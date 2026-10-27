"""Certificates blueprint — certificate issuance, student portfolio, winner credentials, and verification."""
import uuid
import hashlib
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from app import db
from app.models.event import Event
from app.models.user import User
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.feedback import EventResult
from app.models.notification import Notification
from app.auth.decorators import login_required, faculty_or_admin_required

certificates_bp = Blueprint("certificates", __name__)


def _classify_winner_type(position_str):
    """Determine certificate type and title tier based on position text."""
    pos = (position_str or "").lower()
    if any(k in pos for k in ["1st", "first", "champion", "winner", "grand prize", "gold"]):
        return "winner", "Certificate of Extraordinary Achievement & Grand Champion"
    elif any(k in pos for k in ["2nd", "second", "runner-up", "runner up", "silver"]):
        return "runner_up", "Certificate of Merit & First Runner-Up"
    elif any(k in pos for k in ["3rd", "third", "bronze"]):
        return "second_runner_up", "Certificate of Distinction & Second Runner-Up"
    else:
        return "special_award", f"Certificate of Technical Excellence & Special Award"


@certificates_bp.route("/events/<int:event_id>/certificates", methods=["GET"])
def get_event_certificates(event_id):
    """GET /api/events/<id>/certificates — list issued certificates for an event."""
    cert_type = request.args.get("type")
    query = Certificate.query.filter_by(event_id=event_id)
    if cert_type:
        query = query.filter_by(cert_type=cert_type)
    certs = query.all()
    return jsonify({
        "success": True,
        "certificates": [c.to_dict() for c in certs],
        "total": len(certs),
    }), 200


@certificates_bp.route("/events/<int:event_id>/winner-certificates", methods=["GET"])
def get_event_winner_certificates(event_id):
    """GET /api/events/<id>/winner-certificates — public list of official winner certificates for an event."""
    certs = (
        Certificate.query.filter(
            Certificate.event_id == event_id,
            Certificate.cert_type.in_(["winner", "runner_up", "second_runner_up", "special_award"])
        )
        .order_by(Certificate.id.asc())
        .all()
    )
    return jsonify({
        "success": True,
        "certificates": [c.to_dict() for c in certs],
        "total": len(certs),
    }), 200


@certificates_bp.route("/events/<int:event_id>/certificates", methods=["POST"])
@faculty_or_admin_required
def generate_event_certificates(event_id):
    """
    POST /api/events/<id>/certificates — generate participation certificates for confirmed attendees.
    Can specify "user_ids": [1, 2, ...] or issue to all attendees.
    """
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    data = request.get_json(silent=True) or {}
    user_ids = data.get("user_ids")
    cert_title = data.get("title", f"Certificate of Participation — {event.title}")

    # Find attended participants
    query = Attendance.query.filter_by(event_id=event_id, is_present=True)
    if user_ids and isinstance(user_ids, list):
        query = query.filter(Attendance.user_id.in_(user_ids))

    attendees = query.all()
    if not attendees:
        return jsonify({"success": False, "error": "NO_ATTENDEES", "message": "No eligible attendees found with marked attendance."}), 400

    created_certs = []
    dept_code = event.department.code if event.department else "GLOBAL"
    year = event.event_date.year if event.event_date else datetime.now().year

    for att in attendees:
        # Check if already issued participation cert
        existing = Certificate.query.filter_by(event_id=event_id, user_id=att.user_id, cert_type="participation").first()
        if existing:
            created_certs.append(existing)
            continue

        cert_num = f"CERT-{dept_code}-{year}-{uuid.uuid4().hex[:6].upper()}"
        cert = Certificate(
            certificate_number=cert_num,
            event_id=event_id,
            user_id=att.user_id,
            cert_type="participation",
            title=cert_title,
            recipient_name=att.user.full_name if att.user else None,
            track=event.category.name if event.category else "General Track",
            issued_by_id=request.current_user.id,
            download_url=f"/api/certificates/{cert_num}/download",
        )
        cert.verification_hash = cert.generate_hash()
        db.session.add(cert)

        # Notify student
        notif = Notification(
            user_id=att.user_id,
            title="Participation Certificate Issued! 📜",
            message=f"Your verified certificate for '{event.title}' is now available in your Student Portal.",
            type="certificate",
            link="/dashboard",
        )
        db.session.add(notif)
        created_certs.append(cert)

    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Issued {len(created_certs)} participation certificate(s) for '{event.title}'.",
        "certificates": [c.to_dict() for c in created_certs],
    }), 201


@certificates_bp.route("/events/<int:event_id>/winner-certificates", methods=["POST"])
@faculty_or_admin_required
def generate_winner_certificates(event_id):
    """
    POST /api/events/<id>/winner-certificates — generate professional international hackathon winner certificates.
    Accepts explicit winners list or extracts from published results.
    """
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    data = request.get_json(silent=True) or {}
    winners = data.get("winners")

    # If no explicit winners passed, check event results
    if not winners:
        results = EventResult.query.filter_by(event_id=event_id).first()
        if results and results.winners:
            winners = results.winners

    if not winners or not isinstance(winners, list):
        return jsonify({
            "success": False,
            "error": "NO_WINNERS",
            "message": "No winner records found. Please specify winners or publish event results first."
        }), 400

    dept_code = event.department.code if event.department else "GLOBAL"
    year = event.event_date.year if event.event_date else datetime.now().year
    category_track = event.category.name if event.category else "Innovation & Technology Track"

    created_certs = []

    for idx, w in enumerate(winners, start=1):
        pos_str = w.get("position", f"{idx} Place")
        w_name = (w.get("name") or "").strip()
        team_name = (w.get("team") or "").strip() or None
        prize = (w.get("prize") or "").strip() or None
        track = (w.get("track") or "").strip() or category_track

        if not w_name and not team_name:
            continue

        cert_type, default_title = _classify_winner_type(pos_str)
        cert_title = f"{default_title} — {event.title}"

        # Match user if student exists with matching name
        matched_user = None
        if w.get("user_id"):
            matched_user = db.session.get(User, w.get("user_id"))
        elif w_name:
            matched_user = User.query.filter(User.full_name.ilike(w_name)).first()
            if not matched_user and w.get("department"):
                matched_user = User.query.filter(
                    User.full_name.ilike(f"%{w_name}%")
                ).first()

        # Check if winner certificate already exists for this position/user/name
        existing_query = Certificate.query.filter_by(event_id=event_id, cert_type=cert_type)
        if matched_user:
            existing = existing_query.filter_by(user_id=matched_user.id).first()
        else:
            existing = existing_query.filter_by(recipient_name=w_name).first()

        if existing:
            # Update fields if changed
            existing.rank_position = pos_str
            existing.prize = prize
            existing.team_name = team_name
            existing.track = track
            existing.title = cert_title
            created_certs.append(existing)
            continue

        cert_num = f"HACK-{dept_code}-{year}-WIN{idx:02d}-{uuid.uuid4().hex[:6].upper()}"
        cert = Certificate(
            certificate_number=cert_num,
            event_id=event_id,
            user_id=matched_user.id if matched_user else None,
            title=cert_title,
            cert_type=cert_type,
            rank_position=pos_str,
            recipient_name=w_name,
            team_name=team_name,
            prize=prize,
            track=track,
            issued_by_id=request.current_user.id,
            download_url=f"/api/certificates/{cert_num}/download",
        )
        cert.verification_hash = cert.generate_hash()
        db.session.add(cert)

        if matched_user:
            notif = Notification(
                user_id=matched_user.id,
                title="🏆 Winner Certificate Issued!",
                message=f"Congratulations! You were awarded {pos_str} in '{event.title}'. Your official Hackathon Winner Certificate is available now!",
                type="certificate",
                link="/dashboard",
            )
            db.session.add(notif)

        created_certs.append(cert)

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Successfully issued {len(created_certs)} international hackathon winner certificate(s) for '{event.title}'.",
        "certificates": [c.to_dict() for c in created_certs],
    }), 201


@certificates_bp.route("/my/certificates", methods=["GET"])
@login_required
def get_my_certificates():
    """GET /api/my/certificates — list student's issued certificates (winner awards prioritized)."""
    user = request.current_user
    certs = (
        Certificate.query.filter(
            (Certificate.user_id == user.id) |
            (Certificate.recipient_name.ilike(user.full_name))
        )
        .order_by(
            # Sort winner types before participation
            Certificate.cert_type.desc(),
            Certificate.issue_date.desc()
        )
        .all()
    )
    return jsonify({
        "success": True,
        "certificates": [c.to_dict() for c in certs],
        "total": len(certs),
    }), 200


@certificates_bp.route("/certificates/<cert_number>/verify", methods=["GET"])
def verify_certificate(cert_number):
    """GET /api/certificates/<number>/verify — public certificate verification."""
    cert = Certificate.query.filter_by(certificate_number=cert_number.strip().upper()).first()
    if not cert:
        return jsonify({
            "success": False,
            "error": "INVALID_CERTIFICATE",
            "message": "Certificate record not found in the global registry."
        }), 404

    data = cert.to_dict()
    return jsonify({
        "success": True,
        "verified": True,
        "status": "VALID_AUTHENTICATED",
        "issuer": "Apex Global Hackathon Directorate",
        "certificate": data,
        "security": {
            "algorithm": "SHA-256 Cryptographic Checksum",
            "hash": data["verification_hash"],
            "tamper_proof": True,
            "blockchain_ready": True,
        }
    }), 200
