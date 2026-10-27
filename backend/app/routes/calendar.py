"""Calendar blueprint — scheduled events across institution, department, and student personal calendar."""
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request
from app.models.event import Event
from app.models.registration import Registration
from app.auth.decorators import get_current_user

calendar_bp = Blueprint("calendar", __name__)


@calendar_bp.route("/events", methods=["GET"])
def get_calendar_events():
    """
    GET /api/calendar/events — calendar scheduled events.
    Params:
      - year: int
      - month: int (1-12)
      - department_id: int
      - personal_only: bool (if logged in, shows registered events)
    """
    current_user = get_current_user()
    dept_id = request.args.get("department_id", type=int)
    personal_only = request.args.get("personal_only", "false").lower() == "true"

    query = Event.query.filter(Event.status.in_(["published", "ongoing", "completed"]))

    if personal_only and current_user:
        registered_event_ids = [
            r.event_id for r in Registration.query.filter_by(user_id=current_user.id, status="confirmed").all()
        ]
        query = query.filter(Event.id.in_(registered_event_ids))
    elif dept_id:
        query = query.filter(Event.department_id == dept_id)

    events = query.order_by(Event.event_date.asc()).all()

    # Format for calendar display
    calendar_events = []
    for e in events:
        calendar_events.append({
            "id": e.id,
            "title": e.title,
            "start": e.event_date.isoformat(),
            "end": e.event_date.isoformat(),
            "venue": e.venue,
            "event_mode": e.event_mode,
            "category_name": e.category.name if e.category else "General",
            "category_color": e.category.color if e.category else "#3b82f6",
            "department_code": e.department.code if e.department else "INST",
            "participation_type": e.participation_type,
            "is_full": e.is_full,
            "status": e.status,
        })

    return jsonify({"success": True, "events": calendar_events, "total": len(calendar_events)}), 200
