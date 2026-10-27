"""Feedback & Results blueprint — participant ratings, winners, rankings, and gallery."""
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from app import db
from app.models.event import Event
from app.models.feedback import EventFeedback, EventResult
from app.models.registration import Registration
from app.auth.decorators import login_required, faculty_or_admin_required

feedback_results_bp = Blueprint("feedback_results", __name__)


@feedback_results_bp.route("/events/<int:event_id>/feedback", methods=["GET"])
def get_event_feedback(event_id):
    """GET /api/events/<id>/feedback — list feedbacks for an event."""
    feedbacks = EventFeedback.query.filter_by(event_id=event_id).order_by(EventFeedback.submitted_at.desc()).all()
    avg_rating = (
        round(sum(f.rating for f in feedbacks) / len(feedbacks), 1)
        if feedbacks else 5.0
    )
    return jsonify({
        "success": True,
        "feedbacks": [f.to_dict() for f in feedbacks],
        "average_rating": avg_rating,
        "total": len(feedbacks),
    }), 200


@feedback_results_bp.route("/events/<int:event_id>/feedback", methods=["POST"])
@login_required
def submit_feedback(event_id):
    """POST /api/events/<id>/feedback — attendee submits feedback rating."""
    user = request.current_user
    # Verify participant was registered
    reg = Registration.query.filter_by(event_id=event_id, user_id=user.id, status="confirmed").first()
    if not reg and user.role == "student":
        return jsonify({"success": False, "error": "NOT_REGISTERED", "message": "Only registered participants can leave feedback."}), 403

    existing = EventFeedback.query.filter_by(event_id=event_id, user_id=user.id).first()
    if existing:
        return jsonify({"success": False, "error": "ALREADY_SUBMITTED", "message": "You have already submitted feedback for this event."}), 409

    data = request.get_json(silent=True) or {}
    rating = max(1, min(5, int(data.get("rating", 5))))
    comment = data.get("comment", "").strip()

    feedback = EventFeedback(
        event_id=event_id,
        user_id=user.id,
        rating=rating,
        comment=comment,
    )
    db.session.add(feedback)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Thank you! Your feedback has been submitted.",
        "feedback": feedback.to_dict(),
    }), 201


@feedback_results_bp.route("/events/<int:event_id>/results", methods=["GET"])
def get_event_results(event_id):
    """GET /api/events/<id>/results — view official summary, winners, and gallery."""
    results = EventResult.query.filter_by(event_id=event_id).first()
    if not results:
        return jsonify({"success": False, "message": "No results published yet for this event."}), 404

    return jsonify({"success": True, "results": results.to_dict()}), 200


@feedback_results_bp.route("/events/<int:event_id>/results", methods=["POST"])
@faculty_or_admin_required
def publish_event_results(event_id):
    """POST /api/events/<id>/results — publish event summary, winners, and gallery."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    data = request.get_json(silent=True) or {}
    summary = data.get("summary", "").strip()
    winners = data.get("winners", [])
    gallery = data.get("gallery", [])

    if not summary:
        return jsonify({"success": False, "error": "MISSING_SUMMARY", "message": "Event summary is required."}), 400

    results = EventResult.query.filter_by(event_id=event_id).first()
    if not results:
        results = EventResult(
            event_id=event_id,
            summary=summary,
            winners=winners if isinstance(winners, list) else [],
            gallery=gallery if isinstance(gallery, list) else [],
            published_by_id=request.current_user.id,
        )
        db.session.add(results)
    else:
        results.summary = summary
        results.winners = winners
        results.gallery = gallery
        results.published_by_id = request.current_user.id

    # Automatically set event status to completed
    event.status = "completed"

    # Auto-generate or update winner certificates if winners exist
    if winners and isinstance(winners, list):
        import uuid
        from app.models.certificate import Certificate
        from app.models.user import User
        from app.models.notification import Notification

        dept_code = event.department.code if event.department else "GLOBAL"
        year = event.event_date.year if event.event_date else datetime.now().year
        category_track = event.category.name if event.category else "Innovation & Technology Track"

        for idx, w in enumerate(winners, start=1):
            w_name = (w.get("name") or "").strip()
            if not w_name:
                continue
            pos_str = w.get("position", f"{idx} Place")
            pos_lower = pos_str.lower()
            if any(k in pos_lower for k in ["1st", "first", "champion", "winner", "grand prize", "gold"]):
                cert_type = "winner"
                title = f"Certificate of Extraordinary Achievement & Grand Champion — {event.title}"
            elif any(k in pos_lower for k in ["2nd", "second", "runner-up", "runner up", "silver"]):
                cert_type = "runner_up"
                title = f"Certificate of Merit & First Runner-Up — {event.title}"
            elif any(k in pos_lower for k in ["3rd", "third", "bronze"]):
                cert_type = "second_runner_up"
                title = f"Certificate of Distinction & Second Runner-Up — {event.title}"
            else:
                cert_type = "special_award"
                title = f"Certificate of Technical Excellence — {event.title}"

            matched_user = User.query.filter(User.full_name.ilike(w_name)).first()
            existing_query = Certificate.query.filter_by(event_id=event_id, cert_type=cert_type)
            if matched_user:
                existing = existing_query.filter_by(user_id=matched_user.id).first()
            else:
                existing = existing_query.filter_by(recipient_name=w_name).first()

            if not existing:
                cert_num = f"HACK-{dept_code}-{year}-WIN{idx:02d}-{uuid.uuid4().hex[:6].upper()}"
                cert = Certificate(
                    certificate_number=cert_num,
                    event_id=event_id,
                    user_id=matched_user.id if matched_user else None,
                    title=title,
                    cert_type=cert_type,
                    rank_position=pos_str,
                    recipient_name=w_name,
                    team_name=w.get("team"),
                    prize=w.get("prize"),
                    track=w.get("track") or category_track,
                    issued_by_id=request.current_user.id,
                    download_url=f"/api/certificates/{cert_num}/download",
                )
                cert.verification_hash = cert.generate_hash()
                db.session.add(cert)
                if matched_user:
                    db.session.add(Notification(
                        user_id=matched_user.id,
                        title="🏆 Hackathon Winner Certificate Issued!",
                        message=f"Congratulations! You were awarded {pos_str} in '{event.title}'. Your official Hackathon Certificate is ready!",
                        type="certificate",
                        link="/dashboard",
                    ))
            else:
                existing.rank_position = pos_str
                existing.prize = w.get("prize")
                existing.team_name = w.get("team")
                existing.track = w.get("track") or category_track

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Event results and winners published successfully, and official winner certificates generated.",
        "results": results.to_dict(),
    }), 200

