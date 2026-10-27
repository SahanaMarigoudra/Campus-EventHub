"""Attendance blueprint — participant attendance tracking, QR check-in, and presence summaries."""
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from app import db
from app.models.event import Event
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.models.user import User
from app.auth.decorators import login_required, faculty_or_admin_required

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/events/<int:event_id>/attendance", methods=["GET"])
@faculty_or_admin_required
def get_event_attendance(event_id):
    """GET /api/events/<id>/attendance — list registered participants with attendance status."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    registrations = Registration.query.filter_by(event_id=event_id, status="confirmed").all()
    attendance_records = {a.user_id: a for a in Attendance.query.filter_by(event_id=event_id).all()}

    participants_data = []
    for reg in registrations:
        att = attendance_records.get(reg.user_id)
        participants_data.append({
            "registration_id": reg.id,
            "user_id": reg.user_id,
            "student_name": reg.user.full_name if reg.user else "Unknown",
            "roll_number": reg.user.roll_number if reg.user else "N/A",
            "email": reg.user.email if reg.user else "N/A",
            "department_code": reg.user.department.code if reg.user and reg.user.department else "N/A",
            "is_present": att.is_present if att else False,
            "check_in_time": att.check_in_time.isoformat() if att and att.check_in_time else None,
            "attendance_id": att.id if att else None,
        })

    present_count = len([p for p in participants_data if p["is_present"]])
    total_count = len(participants_data)

    return jsonify({
        "success": True,
        "event_id": event.id,
        "event_title": event.title,
        "stats": {
            "total_registered": total_count,
            "present_count": present_count,
            "absent_count": max(0, total_count - present_count),
            "attendance_rate": round((present_count / total_count * 100), 1) if total_count > 0 else 0,
        },
        "participants": participants_data,
    }), 200


@attendance_bp.route("/events/<int:event_id>/attendance", methods=["POST"])
@faculty_or_admin_required
def mark_attendance(event_id):
    """
    POST /api/events/<id>/attendance — record attendance for one or more users.
    Payload: { "attendance": [ {"user_id": 1, "is_present": true}, ... ] }
    or { "user_id": 1, "is_present": true }
    """
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    user = request.current_user
    data = request.get_json(silent=True) or {}

    items = data.get("attendance", [])
    if not items and "user_id" in data:
        items = [data]

    if not items:
        return jsonify({"success": False, "error": "MISSING_DATA", "message": "Attendance records are required."}), 400

    updated_count = 0
    for item in items:
        u_id = item.get("user_id")
        is_pres = bool(item.get("is_present", True))
        notes = item.get("notes")

        if not u_id:
            continue

        # Look up registration
        reg = Registration.query.filter_by(event_id=event_id, user_id=u_id).first()
        if not reg:
            continue

        record = Attendance.query.filter_by(event_id=event_id, user_id=u_id).first()
        if record:
            record.is_present = is_pres
            record.marked_by_id = user.id
            if notes:
                record.notes = notes
        else:
            record = Attendance(
                event_id=event_id,
                registration_id=reg.id,
                user_id=u_id,
                is_present=is_pres,
                marked_by_id=user.id,
                notes=notes,
            )
            db.session.add(record)
        updated_count += 1

    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Successfully updated attendance for {updated_count} participant(s).",
    }), 200


@attendance_bp.route("/events/<int:event_id>/attendance/qr-checkin", methods=["POST"])
@faculty_or_admin_required
def qr_checkin(event_id):
    """POST /api/events/<id>/attendance/qr-checkin — quick check-in by roll number or registration ID."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    data = request.get_json(silent=True) or {}
    identifier = data.get("identifier", "").strip()

    if not identifier:
        return jsonify({"success": False, "error": "MISSING_IDENTIFIER", "message": "Roll number or registration ID is required."}), 400

    reg = None
    if identifier.isdigit():
        reg = db.session.get(Registration, int(identifier))

    if not reg or reg.event_id != event_id:
        # Search by roll number or email
        user = User.query.filter((User.roll_number == identifier) | (User.email == identifier.lower())).first()
        if user:
            reg = Registration.query.filter_by(event_id=event_id, user_id=user.id).first()

    if not reg:
        return jsonify({"success": False, "error": "NOT_REGISTERED", "message": "No confirmed registration found for this participant."}), 404

    att = Attendance.query.filter_by(event_id=event_id, user_id=reg.user_id).first()
    if att:
        att.is_present = True
        att.marked_by_id = request.current_user.id
    else:
        att = Attendance(
            event_id=event_id,
            registration_id=reg.id,
            user_id=reg.user_id,
            is_present=True,
            marked_by_id=request.current_user.id,
        )
        db.session.add(att)

    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Check-in verified for {reg.user.full_name} ({reg.user.roll_number})!",
        "participant": att.to_dict(),
    }), 200
