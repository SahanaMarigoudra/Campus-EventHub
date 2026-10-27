"""Registrations blueprint — duplicate prevention, capacity enforcement, team registrations, and CSV export."""
import csv
import io
import threading
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, make_response
from sqlalchemy.exc import IntegrityError, DatabaseError
from app import db
from app.models.event import Event
from app.models.user import User
from app.models.department import Department
from app.models.registration import Registration
from app.models.team import Team, TeamMember
from app.models.notification import Notification
from app.models.audit_log import AuditLog
from app.auth.decorators import login_required, dept_coordinator_required, get_current_user

registrations_bp = Blueprint("registrations", __name__)
_reg_lock = threading.Lock()


@registrations_bp.route("/events/<int:event_id>/registrations", methods=["POST"])
def register_for_event(event_id):
    """
    POST /api/events/<id>/registrations — Register for an event.
    Can be called by authenticated users or with form data.
    Enforces duplicate prevention, capacity limits, eligibility, and team size.
    """
    data = request.get_json(silent=True) or {}
    current_user = get_current_user()

    # Extract user details
    full_name = data.get("full_name", "").strip() or (current_user.full_name if current_user else "")
    email = data.get("email", "").strip().lower() or (current_user.email if current_user else "")
    roll_number = data.get("roll_number", "").strip() or (current_user.roll_number if current_user else "")
    department_code = data.get("department_code", "").strip().upper() or (current_user.department.code if current_user and current_user.department else "")
    program = data.get("program", "").strip() or (current_user.program if current_user else "")
    phone = data.get("phone", "").strip() or (current_user.phone if current_user else "")

    participation_type = data.get("participation_type", "individual").lower()
    team_name = data.get("team_name", "").strip()
    team_members_data = data.get("team_members", [])

    if not full_name:
        return jsonify({"success": False, "error": "MISSING_FIELD", "message": "Full name is required."}), 400
    if not email:
        return jsonify({"success": False, "error": "MISSING_FIELD", "message": "Email address is required."}), 400

    with _reg_lock:
        event = db.session.get(Event, event_id)
        if not event:
            return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

        # 1. Check status
        if event.status != "published":
            return jsonify({"success": False, "error": "REGISTRATION_CLOSED", "message": "This event is not open for registration."}), 400

        # 2. Check deadline
        now = datetime.now(timezone.utc)
        if event.registration_deadline:
            dl = event.registration_deadline
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            if now > dl:
                return jsonify({"success": False, "error": "REGISTRATION_CLOSED", "message": "Registration deadline has passed."}), 400

        # 3. Check capacity
        if event.is_full:
            return jsonify({"success": False, "error": "EVENT_FULL", "message": "This event has reached its maximum capacity."}), 400

        # 4. Check department eligibility
        allowed_depts = event.participating_departments
        if allowed_depts and "ALL" not in allowed_depts and department_code:
            if department_code not in allowed_depts and (event.department and event.department.code != department_code):
                return jsonify({
                    "success": False,
                    "error": "INELIGIBLE_DEPARTMENT",
                    "message": f"This event is restricted to: {', '.join(allowed_depts)}.",
                }), 400

        # 5. Resolve user
        user = current_user
        dept = None
        if department_code:
            dept = Department.query.filter(Department.code.ilike(department_code.strip())).first()
            if not dept:
                clean = department_code.upper().replace(".", "").replace(" ", "")
                dept = Department.query.filter(Department.code.ilike(clean)).first()

        if not user:
            user = User.query.filter_by(email=email).first()
            if not user:
                user = User(
                    email=email,
                    full_name=full_name,
                    role="student",
                    department_id=dept.id if dept else None,
                    roll_number=roll_number,
                    program=program or (dept.programs[0] if dept and dept.programs else ""),
                    phone=phone,
                )
                user.set_password("Student@123")  # default initial password
                db.session.add(user)
                db.session.flush()

        # If user exists but has no department assigned, link them to the department
        if user and not user.department_id and dept:
            user.department_id = dept.id
            if program:
                user.program = program
            db.session.add(user)
            db.session.flush()

        # 6. Check for duplicate registration
        existing_reg = Registration.query.filter_by(
            event_id=event.id,
            user_id=user.id,
            status="confirmed",
        ).first()

        if existing_reg:
            return jsonify({
                "success": False,
                "error": "DUPLICATE_REGISTRATION",
                "message": "This student / email is already registered for this event.",
            }), 409

        # 7. Team management (if applicable)
        team = None
        if participation_type == "team":
            if not team_name:
                return jsonify({"success": False, "error": "MISSING_TEAM_NAME", "message": "Team name is required for team events."}), 400

            team = Team(
                event_id=event.id,
                team_name=team_name,
                team_leader_id=user.id,
                status="confirmed",
            )
            db.session.add(team)
            db.session.flush()

            # Add leader as team member
            leader_member = TeamMember(
                team_id=team.id,
                user_id=user.id,
                student_name=user.full_name,
                roll_number=user.roll_number,
                email=user.email,
                department_code=department_code,
            )
            db.session.add(leader_member)

            # Add teammates
            if isinstance(team_members_data, list):
                if len(team_members_data) + 1 > event.max_team_size:
                    return jsonify({
                        "success": False,
                        "error": "TEAM_SIZE_EXCEEDED",
                        "message": f"Team exceeds maximum allowed size of {event.max_team_size} members.",
                    }), 400

                for tm in team_members_data:
                    m_name = tm.get("name", "").strip()
                    m_email = tm.get("email", "").strip().lower()
                    if m_name and m_email:
                        member = TeamMember(
                            team_id=team.id,
                            student_name=m_name,
                            roll_number=tm.get("roll_number", "").strip(),
                            email=m_email,
                            department_code=tm.get("department_code", "").strip().upper(),
                        )
                        db.session.add(member)

        # 8. Create registration record
        try:
            registration = Registration(
                event_id=event.id,
                user_id=user.id,
                team_id=team.id if team else None,
                participation_type=participation_type,
                status="confirmed",
                notes=data.get("notes"),
            )
            db.session.add(registration)

            # In-app notification for the user
            notif = Notification(
                user_id=user.id,
                title="Registration Confirmed! 🎟️",
                message=f"You are confirmed for '{event.title}' on {event.event_date.strftime('%b %d, %Y')}.",
                type="registration",
                link=f"/events/{event.id}",
            )
            db.session.add(notif)

            # Audit log — persist every registration to the database
            log = AuditLog(
                user_id=user.id,
                user_email=user.email,
                action="EVENT_REGISTRATION",
                resource_type="event",
                resource_id=event.id,
                details=f"'{user.full_name}' ({user.program or 'N/A'}, dept: {user.department.code if user.department else 'N/A'}) registered for '{event.title}'",
            )
            db.session.add(log)
            db.session.commit()

            return jsonify({
                "success": True,
                "message": "Registration successful! You're all set.",
                "registration": registration.to_dict(),
            }), 201

        except (IntegrityError, DatabaseError):
            db.session.rollback()
            return jsonify({
                "success": False,
                "error": "DUPLICATE_REGISTRATION",
                "message": "This student / email is already registered for this event.",
            }), 409
        except Exception as e:
            db.session.rollback()
            return jsonify({
                "success": False,
                "error": "SERVER_ERROR",
                "message": f"An unexpected error occurred: {str(e)}",
            }), 500


@registrations_bp.route("/events/<int:event_id>/registrations", methods=["GET"])
@login_required
def get_event_registrations(event_id):
    """GET /api/events/<id>/registrations — view participants of an event."""
    user = request.current_user
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    # Authorization
    if user.role != "super_admin" and event.created_by_id != user.id and (user.role != "dept_coordinator" or user.department_id != event.department_id):
        return jsonify({"success": False, "error": "FORBIDDEN", "message": "Permission denied."}), 403

    registrations = Registration.query.filter_by(event_id=event_id).order_by(Registration.registered_at.desc()).all()
    return jsonify({
        "success": True,
        "registrations": [r.to_dict() for r in registrations],
        "total": len(registrations),
    }), 200


@registrations_bp.route("/my/registrations", methods=["GET"])
@login_required
def get_my_registrations():
    """GET /api/my/registrations — student's registered events."""
    user = request.current_user
    registrations = (
        Registration.query.filter_by(user_id=user.id)
        .order_by(Registration.registered_at.desc())
        .all()
    )
    return jsonify({
        "success": True,
        "registrations": [r.to_dict() for r in registrations],
        "total": len(registrations),
    }), 200


@registrations_bp.route("/registrations/<int:reg_id>/cancel", methods=["PATCH"])
@login_required
def cancel_registration(reg_id):
    """PATCH /api/registrations/<id>/cancel — cancels registration and frees capacity."""
    reg = db.session.get(Registration, reg_id)
    if not reg:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "Registration not found."}), 404

    user = request.current_user
    if user.role != "super_admin" and reg.user_id != user.id:
        return jsonify({"success": False, "error": "FORBIDDEN", "message": "Permission denied."}), 403

    reg.status = "cancelled"
    reg.cancelled_at = datetime.now(timezone.utc)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Registration cancelled successfully.",
        "registration": reg.to_dict(),
    }), 200


@registrations_bp.route("/registrations/export", methods=["GET"])
@dept_coordinator_required
def export_registrations_csv():
    """GET /api/registrations/export — exports CSV report."""
    event_id = request.args.get("event_id", type=int)
    dept_id = request.args.get("department_id", type=int)

    query = Registration.query.join(Event)
    if event_id:
        query = query.filter(Registration.event_id == event_id)
    if dept_id:
        query = query.filter(Event.department_id == dept_id)

    registrations = query.order_by(Registration.registered_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Registration ID",
        "Event Title",
        "Department",
        "Student Name",
        "Email",
        "Roll Number",
        "Program",
        "Participation Type",
        "Team Name",
        "Status",
        "Registered At",
    ])

    for r in registrations:
        writer.writerow([
            r.id,
            r.event.title if r.event else "N/A",
            r.event.department.code if r.event and r.event.department else "N/A",
            r.user.full_name if r.user else "N/A",
            r.user.email if r.user else "N/A",
            r.user.roll_number if r.user else "N/A",
            r.user.program if r.user else "N/A",
            r.participation_type,
            r.team.team_name if r.team else "N/A",
            r.status,
            r.registered_at.isoformat() if r.registered_at else "N/A",
        ])

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=registrations_export.csv"
    response.headers["Content-Type"] = "text/csv; charset=utf-8"
    return response
