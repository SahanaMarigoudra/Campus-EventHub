"""Departments blueprint — multi-department administration, courses, and department dashboard."""
from flask import Blueprint, jsonify, request
from app import db
from app.models.department import Department
from app.models.event import Event
from app.models.registration import Registration
from app.models.user import User
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.audit_log import AuditLog
from app.auth.decorators import login_required, super_admin_required, dept_coordinator_required

departments_bp = Blueprint("departments", __name__)


@departments_bp.route("", methods=["GET"])
def get_departments():
    """GET /api/departments — list active or all academic departments."""
    include_inactive = request.args.get("include_inactive", "false").lower() == "true"
    query = Department.query
    if not include_inactive:
        query = query.filter_by(is_active=True)

    departments = query.order_by(Department.name.asc()).all()
    return jsonify({
        "success": True,
        "departments": [d.to_dict() for d in departments],
        "total": len(departments),
    }), 200


@departments_bp.route("/<int:dept_id>", methods=["GET"])
def get_department_detail(dept_id):
    """GET /api/departments/<id> — get single department details."""
    dept = db.session.get(Department, dept_id)
    if not dept:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "Department not found."}), 404

    # Get recent events
    events = Event.query.filter_by(department_id=dept.id).order_by(Event.event_date.desc()).limit(10).all()
    return jsonify({
        "success": True,
        "department": dept.to_dict(),
        "recent_events": [e.to_dict() for e in events],
    }), 200


@departments_bp.route("", methods=["POST"])
@super_admin_required
def create_department():
    """POST /api/departments — Super Admin creates a new department."""
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip().upper()
    description = data.get("description", "").strip()
    coordinator_name = data.get("coordinator_name", "").strip()
    coordinator_email = data.get("coordinator_email", "").strip()
    programs = data.get("programs", [])

    if not name or not code:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Department name and code are required."}), 400

    if Department.query.filter((Department.name == name) | (Department.code == code)).first():
        return jsonify({"success": False, "error": "ALREADY_EXISTS", "message": "Department with this name or code already exists."}), 409

    dept = Department(
        name=name,
        code=code,
        description=description,
        coordinator_name=coordinator_name,
        coordinator_email=coordinator_email,
        programs=programs if isinstance(programs, list) else [],
    )
    db.session.add(dept)
    db.session.flush()

    # Log audit
    log = AuditLog(
        user_id=request.current_user.id,
        user_email=request.current_user.email,
        action="DEPARTMENT_CREATE",
        resource_type="department",
        resource_id=dept.id,
        details=f"Created department {dept.name} ({dept.code})",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Department {dept.name} created successfully.",
        "department": dept.to_dict(),
    }), 201


@departments_bp.route("/<int:dept_id>", methods=["PATCH"])
@dept_coordinator_required
def update_department(dept_id):
    """PATCH /api/departments/<id> — update department details."""
    dept = db.session.get(Department, dept_id)
    if not dept:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "Department not found."}), 404

    # If coordinator, can only edit their own department unless Super Admin
    if request.current_user.role != "super_admin" and request.current_user.department_id != dept.id:
        return jsonify({"success": False, "error": "FORBIDDEN", "message": "You can only manage your assigned department."}), 403

    data = request.get_json(silent=True) or {}
    if "name" in data and data["name"].strip():
        dept.name = data["name"].strip()
    if "description" in data:
        dept.description = data["description"].strip()
    if "coordinator_name" in data:
        dept.coordinator_name = data["coordinator_name"].strip()
    if "coordinator_email" in data:
        dept.coordinator_email = data["coordinator_email"].strip()
    if "programs" in data and isinstance(data["programs"], list):
        dept.programs = data["programs"]
    if "is_active" in data and request.current_user.role == "super_admin":
        dept.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Department updated successfully.",
        "department": dept.to_dict(),
    }), 200


@departments_bp.route("/<int:dept_id>", methods=["DELETE"])
@super_admin_required
def delete_department(dept_id):
    """DELETE /api/departments/<id> — deactivates or removes a department."""
    dept = db.session.get(Department, dept_id)
    if not dept:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "Department not found."}), 404

    dept.is_active = False
    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Department {dept.name} has been deactivated.",
    }), 200


@departments_bp.route("/<int:dept_id>/dashboard", methods=["GET"])
@dept_coordinator_required
def get_department_dashboard(dept_id):
    """GET /api/departments/<id>/dashboard — department metrics, events, registrations."""
    dept = db.session.get(Department, dept_id)
    if not dept:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "Department not found."}), 404

    # Query events organized by this department
    events = Event.query.filter_by(department_id=dept.id).all()
    event_ids = [e.id for e in events]

    total_events = len(events)
    published_events = len([e for e in events if e.status == "published"])
    pending_events = len([e for e in events if e.approval_status == "pending"])
    completed_events = len([e for e in events if e.status == "completed"])

    # Registrations for this department's events
    registrations = Registration.query.filter(Registration.event_id.in_(event_ids)).all() if event_ids else []
    total_registrations = len(registrations)
    confirmed_registrations = len([r for r in registrations if r.status == "confirmed"])

    # Category breakdown
    categories_map = {}
    for e in events:
        c_name = e.category.name if e.category else "Other"
        categories_map[c_name] = categories_map.get(c_name, 0) + 1

    # Students registered under this department / courses
    students = User.query.filter_by(department_id=dept.id, role="student").order_by(User.created_at.desc()).all()
    students_data = []
    course_counts = {}

    for s in students:
        reg_count = Registration.query.filter_by(user_id=s.id, status="confirmed").count()
        attended_count = Attendance.query.filter_by(user_id=s.id, is_present=True).count()
        cert_count = Certificate.query.filter_by(user_id=s.id).count()
        prog = s.program or "General Enrolled"
        course_counts[prog] = course_counts.get(prog, 0) + 1

        s_dict = s.to_dict()
        s_dict["name"] = s.full_name
        s_dict["stats"] = {
            "registrations_count": reg_count,
            "attended_count": attended_count,
            "certificates_count": cert_count,
        }
        students_data.append(s_dict)

    return jsonify({
        "success": True,
        "department": dept.to_dict(),
        "stats": {
            "total_events": total_events,
            "published_events": published_events,
            "pending_approval": pending_events,
            "completed_events": completed_events,
            "total_registrations": total_registrations,
            "confirmed_registrations": confirmed_registrations,
            "total_students": len(students),
            "students_by_course": [{"course": k, "count": v} for k, v in course_counts.items()],
            "categories_breakdown": [{"name": k, "count": v} for k, v in categories_map.items()],
        },
        "events": [e.to_dict() for e in events],
        "students": students_data,
        "programs": dept.programs or [],
    }), 200
