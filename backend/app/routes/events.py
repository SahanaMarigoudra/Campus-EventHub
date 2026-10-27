"""Events blueprint — event showcase, creation, filtering, approval workflow, and availability."""
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request
from app import db
from app.models.event import Event
from app.models.department import Department
from app.models.category import EventCategory
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.auth.decorators import (
    login_required,
    faculty_or_admin_required,
    dept_coordinator_required,
    get_current_user,
)

events_bp = Blueprint("events", __name__)


@events_bp.route("", methods=["GET"])
def get_events():
    """
    GET /api/events — public and filtered event discovery.
    Query params:
      - search: string
      - department: code or id
      - category: code or id
      - event_mode: Offline, Online, Hybrid
      - participation_type: individual, team
      - status: published (default for public), pending_approval, draft, completed, cancelled, all
      - timeframe: today, this_week, upcoming, past
      - featured: true/false
      - page, per_page
    """
    current_user = get_current_user()

    search = request.args.get("search", "").strip()
    dept_param = request.args.get("department", "").strip()
    cat_param = request.args.get("category", "").strip()
    mode = request.args.get("event_mode", "").strip()
    p_type = request.args.get("participation_type", "").strip()
    status = request.args.get("status", "").strip()
    timeframe = request.args.get("timeframe", "").strip()
    featured = request.args.get("featured", "").lower() == "true"
    page = max(1, request.args.get("page", 1, type=int))
    per_page = min(50, max(1, request.args.get("per_page", 12, type=int)))

    query = Event.query

    # Status handling: default to 'published' for unauthenticated/students
    if status == "all" and current_user and current_user.role in ["super_admin", "dept_coordinator", "faculty_coordinator"]:
        pass  # allow viewing all
    elif status and current_user and current_user.role in ["super_admin", "dept_coordinator", "faculty_coordinator"]:
        query = query.filter_by(status=status)
    elif status == "pending_approval" and current_user and current_user.role in ["super_admin", "dept_coordinator", "faculty_coordinator"]:
        query = query.filter_by(approval_status="pending")
    else:
        query = query.filter(Event.status == "published")

    # Search filter
    if search:
        query = query.filter(
            (Event.title.ilike(f"%{search}%")) |
            (Event.description.ilike(f"%{search}%")) |
            (Event.venue.ilike(f"%{search}%"))
        )

    # Department filter
    if dept_param:
        if dept_param.isdigit():
            query = query.filter(Event.department_id == int(dept_param))
        else:
            dept = Department.query.filter(Department.code.ilike(dept_param)).first()
            if dept:
                query = query.filter(Event.department_id == dept.id)

    # Category filter
    if cat_param:
        if cat_param.isdigit():
            query = query.filter(Event.category_id == int(cat_param))
        else:
            cat = EventCategory.query.filter((EventCategory.code.ilike(cat_param)) | (EventCategory.name.ilike(cat_param))).first()
            if cat:
                query = query.filter(Event.category_id == cat.id)

    # Mode and participation type
    if mode:
        query = query.filter(Event.event_mode.ilike(mode))
    if p_type:
        query = query.filter(Event.participation_type == p_type.lower())

    if featured:
        query = query.filter(Event.featured == True)

    # Timeframe filtering
    now = datetime.now(timezone.utc)
    if timeframe == "today":
        start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_of_day = start_of_day + timedelta(days=1)
        query = query.filter(Event.event_date >= start_of_day, Event.event_date < end_of_day)
    elif timeframe == "this_week":
        end_of_week = now + timedelta(days=7)
        query = query.filter(Event.event_date >= now, Event.event_date <= end_of_week)
    elif timeframe == "upcoming":
        query = query.filter(Event.event_date >= now)
    elif timeframe == "past":
        query = query.filter(Event.event_date < now)

    # Sorting: upcoming first, then date
    query = query.order_by(Event.event_date.asc())

    total = query.count()
    events = query.offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        "success": True,
        "events": [e.to_dict() for e in events],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page,
        },
    }), 200


@events_bp.route("/<int:event_id>", methods=["GET"])
def get_event_detail(event_id):
    """GET /api/events/<id> — get event details with category, department, availability."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    data = event.to_dict(full=True)
    if event.results:
        data["results"] = event.results.to_dict()
    data["feedbacks_count"] = len(event.feedbacks)
    data["average_rating"] = (
        round(sum(f.rating for f in event.feedbacks) / len(event.feedbacks), 1)
        if event.feedbacks else 5.0
    )

    return jsonify({"success": True, "event": data}), 200


@events_bp.route("/<int:event_id>/availability", methods=["GET"])
def get_event_availability(event_id):
    """GET /api/events/<id>/availability — live capacity and registration status."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    return jsonify({
        "success": True,
        "event_id": event.id,
        "capacity": event.capacity,
        "confirmed_count": event.confirmed_count,
        "available_seats": event.available_seats,
        "is_full": event.is_full,
        "is_registration_open": event.is_registration_open,
        "status": event.status,
    }), 200


@events_bp.route("", methods=["POST"])
@login_required
def create_event():
    """POST /api/events — create event proposal (Draft or Submit)."""
    user = request.current_user
    if user.role not in ["super_admin", "dept_coordinator", "faculty_coordinator", "organizer"]:
        return jsonify({"success": False, "error": "FORBIDDEN", "message": "Only coordinators or organizers can create events."}), 403

    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    description = data.get("description", "").strip()
    event_date_str = data.get("event_date")
    venue = data.get("venue", "").strip()
    capacity = data.get("capacity", 100)
    category_id = data.get("category_id")
    dept_id = data.get("department_id") or user.department_id

    if not title or not description or not event_date_str or not venue:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Title, description, date, and venue are required."}), 400

    if not dept_id:
        return jsonify({"success": False, "error": "MISSING_DEPARTMENT", "message": "Organizing department is required."}), 400

    try:
        event_date = datetime.fromisoformat(event_date_str.replace("Z", "+00:00"))
    except ValueError:
        return jsonify({"success": False, "error": "INVALID_DATE", "message": "Invalid date format. Use ISO format."}), 400

    reg_deadline = None
    if data.get("registration_deadline"):
        try:
            reg_deadline = datetime.fromisoformat(data["registration_deadline"].replace("Z", "+00:00"))
        except ValueError:
            pass

    # Status: draft, or pending_approval, or published (if super_admin)
    initial_status = data.get("status", "pending_approval")
    if user.role == "super_admin":
        approval_status = "approved"
        status = initial_status if initial_status in ["published", "draft"] else "published"
    else:
        approval_status = "pending" if initial_status != "draft" else "pending"
        status = "draft" if initial_status == "draft" else "pending_approval"

    event = Event(
        title=title,
        description=description,
        poster_url=data.get("poster_url", "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80"),
        category_id=category_id,
        subcategory=data.get("subcategory"),
        department_id=dept_id,
        created_by_id=user.id,
        event_coordinator=data.get("event_coordinator", user.full_name),
        faculty_incharge=data.get("faculty_incharge"),
        contact_info=data.get("contact_info", user.email),
        event_date=event_date,
        start_time=data.get("start_time", "10:00 AM"),
        end_time=data.get("end_time", "04:00 PM"),
        registration_deadline=reg_deadline,
        venue=venue,
        event_mode=data.get("event_mode", "Offline"),
        capacity=int(capacity) if str(capacity).isdigit() else 100,
        registration_fee=float(data.get("registration_fee", 0.0)),
        participation_type=data.get("participation_type", "individual"),
        max_team_size=int(data.get("max_team_size", 1)),
        eligibility_criteria=data.get("eligibility_criteria", "Open to all enrolled students"),
        rules_guidelines=data.get("rules_guidelines"),
        prizes_rewards=data.get("prizes_rewards"),
        status=status,
        approval_status=approval_status,
        featured=bool(data.get("featured", False)),
    )

    if "participating_departments" in data:
        event.participating_departments = data["participating_departments"]

    db.session.add(event)
    db.session.flush()

    # Log audit
    log = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="EVENT_CREATE",
        resource_type="event",
        resource_id=event.id,
        details=f"Created event '{event.title}' with status {event.status}",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Event created successfully.",
        "event": event.to_dict(),
    }), 201


@events_bp.route("/<int:event_id>", methods=["PATCH"])
@login_required
def update_event(event_id):
    """PATCH /api/events/<id> — update event."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    user = request.current_user
    # Authorization check
    if user.role != "super_admin" and event.created_by_id != user.id and (user.role != "dept_coordinator" or user.department_id != event.department_id):
        return jsonify({"success": False, "error": "FORBIDDEN", "message": "You do not have permission to modify this event."}), 403

    data = request.get_json(silent=True) or {}
    for field in ["title", "description", "poster_url", "venue", "event_mode", "event_coordinator", "faculty_incharge", "contact_info", "rules_guidelines", "prizes_rewards", "eligibility_criteria", "start_time", "end_time"]:
        if field in data:
            setattr(event, field, data[field])

    if "capacity" in data and str(data["capacity"]).isdigit():
        event.capacity = int(data["capacity"])
    if "event_date" in data:
        try:
            event.event_date = datetime.fromisoformat(data["event_date"].replace("Z", "+00:00"))
        except ValueError:
            pass
    if "registration_deadline" in data:
        try:
            event.registration_deadline = datetime.fromisoformat(data["registration_deadline"].replace("Z", "+00:00"))
        except ValueError:
            pass
    if "participating_departments" in data:
        event.participating_departments = data["participating_departments"]
    if "status" in data and user.role in ["super_admin", "dept_coordinator"]:
        event.status = data["status"]
    if "featured" in data and user.role == "super_admin":
        event.featured = bool(data["featured"])

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Event updated successfully.",
        "event": event.to_dict(),
    }), 200


@events_bp.route("/<int:event_id>", methods=["DELETE"])
@login_required
def delete_or_cancel_event(event_id):
    """DELETE /api/events/<id> — cancels or removes event."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    user = request.current_user
    if user.role != "super_admin" and event.created_by_id != user.id:
        return jsonify({"success": False, "error": "FORBIDDEN", "message": "Permission denied."}), 403

    # Mark as cancelled instead of hard deleting to preserve audit & registration history
    event.status = "cancelled"
    db.session.commit()
    return jsonify({"success": True, "message": "Event cancelled successfully."}), 200


@events_bp.route("/<int:event_id>/submit-for-approval", methods=["POST"])
@login_required
def submit_for_approval(event_id):
    """POST /api/events/<id>/submit-for-approval — submit draft for review."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    event.approval_status = "pending"
    event.status = "pending_approval"
    db.session.commit()
    return jsonify({"success": True, "message": "Event submitted for approval.", "event": event.to_dict()}), 200


@events_bp.route("/<int:event_id>/approve", methods=["POST"])
@faculty_or_admin_required
def approve_event(event_id):
    """POST /api/events/<id>/approve — Faculty or Super Admin approves event for publishing."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    user = request.current_user
    data = request.get_json(silent=True) or {}
    remarks = data.get("remarks", "Approved by faculty/admin.")

    event.approval_status = "approved"
    event.status = "published"
    event.approval_remarks = remarks
    event.approved_by_id = user.id
    event.approved_at = datetime.now(timezone.utc)

    # Notify creator
    if event.created_by_id:
        notif = Notification(
            user_id=event.created_by_id,
            title="Event Approved! 🎉",
            message=f"Your event '{event.title}' has been approved and published.",
            type="approval",
            link=f"/events/{event.id}",
        )
        db.session.add(notif)

    # Log audit
    log = AuditLog(
        user_id=user.id,
        user_email=user.email,
        action="EVENT_APPROVE",
        resource_type="event",
        resource_id=event.id,
        details=f"Approved event '{event.title}'. Remarks: {remarks}",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Event '{event.title}' has been approved and published.",
        "event": event.to_dict(),
    }), 200


@events_bp.route("/<int:event_id>/reject", methods=["POST"])
@faculty_or_admin_required
def reject_event(event_id):
    """POST /api/events/<id>/reject — rejects an event proposal with remarks."""
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    user = request.current_user
    data = request.get_json(silent=True) or {}
    remarks = data.get("remarks", "").strip()
    if not remarks:
        return jsonify({"success": False, "error": "MISSING_REMARKS", "message": "Feedback remarks are required for rejection."}), 400

    event.approval_status = "rejected"
    event.status = "draft"
    event.approval_remarks = remarks
    event.approved_by_id = user.id
    event.approved_at = datetime.now(timezone.utc)

    if event.created_by_id:
        notif = Notification(
            user_id=event.created_by_id,
            title="Event Proposal Rejected",
            message=f"Your event '{event.title}' was rejected. Reason: {remarks}",
            type="approval",
            link=f"/events/{event.id}",
        )
        db.session.add(notif)

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Event proposal rejected.",
        "event": event.to_dict(),
    }), 200
