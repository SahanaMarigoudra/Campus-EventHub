"""Authentication blueprint — user registration, login, profile, and session verification."""
from flask import Blueprint, jsonify, request
from flask_jwt_extended import create_access_token
from app import db
from app.models.user import User
from app.models.department import Department
from app.models.audit_log import AuditLog
from app.auth.decorators import login_required, super_admin_required, get_current_user

auth_bp = Blueprint("auth", __name__)


def resolve_department(dept_code_or_name):
    if not dept_code_or_name:
        return None
    val = str(dept_code_or_name).strip()
    # 1. Exact or case-insensitive code
    dept = Department.query.filter(Department.code.ilike(val)).first()
    if dept:
        return dept
    # 2. Stripped of dots/spaces e.g. 'B.Tech' -> 'BTECH'
    clean = val.upper().replace(".", "").replace(" ", "").replace("-", "")
    dept = Department.query.filter(Department.code.ilike(clean)).first()
    if dept:
        return dept
    # 3. Search in code substring
    for code in ["BTECH", "MTECH", "MCA", "MBA", "BCA", "BBA", "BCOM", "BSC", "MSC"]:
        if code in clean:
            dept = Department.query.filter_by(code=code).first()
            if dept:
                return dept
    # 4. Check department name or programs
    for d in Department.query.all():
        if d.name.lower() in val.lower() or val.lower() in d.name.lower():
            return d
        if d.programs:
            for p in d.programs:
                if p.lower() in val.lower() or val.lower() in p.lower():
                    return d
    return None


@auth_bp.route("/register", methods=["POST"])
def register():
    """POST /api/auth/register — student or faculty self-registration."""
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "student").strip()
    department_code = data.get("department_code", "").strip()
    program = data.get("program", "").strip()
    roll_number = data.get("roll_number", "").strip()
    phone = data.get("phone", "").strip()

    if not email or not password or not full_name:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Email, password, and full name are required."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "EMAIL_EXISTS", "message": "An account with this email already exists."}), 409

    department = resolve_department(department_code) or resolve_department(program)
    if department and not program and department.programs:
        program = department.programs[0]

    # Allowed self-registered roles: student, organizer
    if role not in ["student", "organizer", "faculty_coordinator"]:
        role = "student"

    user = User(
        email=email,
        full_name=full_name,
        role=role,
        department_id=department.id if department else None,
        program=program,
        roll_number=roll_number,
        phone=phone,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "email": user.email, "name": user.full_name},
    )

    return jsonify({
        "success": True,
        "message": "Account created successfully.",
        "access_token": token,
        "user": user.to_dict(),
    }), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """POST /api/auth/login — authenticates user and issues JWT."""
    data = request.get_json(silent=True) or {}
    email_or_user = data.get("email", "") or data.get("username", "")
    email_or_user = email_or_user.strip()
    password = data.get("password", "")

    if not email_or_user or not password:
        return jsonify({"success": False, "error": "MISSING_CREDENTIALS", "message": "Email and password are required."}), 400

    # 1. Exact match by email or roll_number
    user = User.query.filter(
        (User.email.ilike(email_or_user)) | (User.roll_number == email_or_user)
    ).first()

    # 2. Match department code (e.g. 'BTECH' -> btech.coord, 'MTECH' -> mtech.coord)
    if not user:
        dept = Department.query.filter(Department.code.ilike(email_or_user)).first()
        if dept:
            user = User.query.filter_by(department_id=dept.id, role="dept_coordinator").first()

    # 3. Match username prefix or without .coord (e.g. 'btech' or 'btech.coord' or 'btech@college.edu')
    if not user:
        if "@" not in email_or_user:
            user = User.query.filter(
                (User.email.ilike(f"{email_or_user}.coord@college.edu")) |
                (User.email.ilike(f"{email_or_user}@college.edu"))
            ).first()
        else:
            prefix, domain = email_or_user.split("@", 1)
            user = User.query.filter(User.email.ilike(f"{prefix}.coord@{domain}")).first()

    # 4. Super admin shortcut
    if not user and email_or_user.lower() in ["admin", "superadmin"]:
        user = User.query.filter_by(role="super_admin").first()

    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "INVALID_CREDENTIALS", "message": "Invalid email or password."}), 401

    if not user.is_active:
        return jsonify({"success": False, "error": "ACCOUNT_DISABLED", "message": "Your account has been deactivated. Contact the administrator."}), 403

    # Portal access is restricted strictly to faculty, department coordinators, and admins
    if user.role == "student":
        return jsonify({
            "success": False,
            "error": "STUDENT_LOGIN_DISABLED",
            "message": "Student accounts cannot access this portal. Browse events on the homepage instead."
        }), 403

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "email": user.email, "name": user.full_name},
    )

    return jsonify({
        "success": True,
        "access_token": token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/student-login", methods=["POST"])
def student_login():
    """POST /api/auth/student-login — authenticates student users only."""
    data = request.get_json(silent=True) or {}
    email_or_user = (data.get("email", "") or data.get("username", "")).strip()
    password = data.get("password", "")

    if not email_or_user or not password:
        return jsonify({"success": False, "error": "MISSING_CREDENTIALS", "message": "Email and password are required."}), 400

    # 1. Exact match by email or roll_number
    user = User.query.filter(
        (User.email.ilike(email_or_user)) | (User.roll_number == email_or_user)
    ).first()

    # 2. Without domain e.g. 'rohit.btech', 'sneha.mtech'
    if not user and "@" not in email_or_user:
        user = User.query.filter(
            (User.email.ilike(f"{email_or_user}@college.edu")) |
            (User.email.ilike(f"{email_or_user}"))
        ).first()

    # 3. Match department code e.g. 'btech' or 'mtech'
    if not user:
        dept = Department.query.filter(Department.code.ilike(email_or_user)).first()
        if dept:
            user = User.query.filter_by(department_id=dept.id, role="student").first()

    if not user or not user.check_password(password):
        return jsonify({"success": False, "error": "INVALID_CREDENTIALS", "message": "Invalid email or password."}), 401

    if not user.is_active:
        return jsonify({"success": False, "error": "ACCOUNT_DISABLED", "message": "Your account has been deactivated. Contact the administrator."}), 403

    # This endpoint is ONLY for students
    if user.role != "student":
        return jsonify({
            "success": False,
            "error": "NOT_A_STUDENT",
            "message": "This login is for student accounts only. Staff should use the Staff Sign In."
        }), 403

    token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "email": user.email, "name": user.full_name},
    )

    return jsonify({
        "success": True,
        "access_token": token,
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/logout", methods=["POST"])
def logout():
    """POST /api/auth/logout."""
    return jsonify({"success": True, "message": "Logged out successfully."}), 200


@auth_bp.route("/me", methods=["GET"])
@login_required
def get_me():
    """GET /api/auth/me — returns current authenticated user details."""
    return jsonify({
        "success": True,
        "user": request.current_user.to_dict(),
    }), 200


@auth_bp.route("/users", methods=["GET"])
@super_admin_required
def list_users():
    """GET /api/auth/users — Super Admin user management."""
    role = request.args.get("role")
    dept_id = request.args.get("department_id", type=int)
    search = request.args.get("search", "").strip()

    query = User.query
    if role:
        query = query.filter_by(role=role)
    if dept_id:
        query = query.filter_by(department_id=dept_id)
    if search:
        query = query.filter(
            (User.full_name.ilike(f"%{search}%")) |
            (User.email.ilike(f"%{search}%"))
        )

    users = query.order_by(User.created_at.desc()).all()
    return jsonify({
        "success": True,
        "users": [u.to_dict() for u in users],
        "total": len(users),
    }), 200


@auth_bp.route("/users", methods=["POST"])
@super_admin_required
def create_user():
    """POST /api/auth/users — Super Admin creates a faculty/coordinator user and persists to DB."""
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "").strip()
    full_name = data.get("full_name", "").strip()
    role = data.get("role", "dept_coordinator").strip()
    department_code = data.get("department_code", "").strip()
    program = data.get("program", "").strip()
    phone = data.get("phone", "").strip()

    if not email or not full_name:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Email and full name are required."}), 400

    if not password:
        # Auto-generate a default password
        password = "Faculty@123"

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "error": "EMAIL_EXISTS", "message": "An account with this email already exists."}), 409

    # Validate role
    allowed_roles = ["dept_coordinator", "faculty_coordinator", "organizer", "super_admin"]
    if role not in allowed_roles:
        role = "faculty_coordinator"

    department = resolve_department(department_code) if department_code else None

    user = User(
        email=email,
        full_name=full_name,
        role=role,
        department_id=department.id if department else None,
        program=program,
        phone=phone,
        is_active=True,
    )
    user.set_password(password)
    db.session.add(user)
    db.session.flush()

    # Audit log
    admin = get_current_user()
    log = AuditLog(
        user_id=admin.id if admin else None,
        user_email=admin.email if admin else "system",
        action="USER_CREATE",
        resource_type="user",
        resource_id=user.id,
        details=f"Created {role} account for '{full_name}' ({email}), dept: {department.code if department else 'N/A'}",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"User '{full_name}' created successfully. Default password: {password}",
        "user": user.to_dict(),
        "default_password": password,
    }), 201


@auth_bp.route("/users/<int:user_id>", methods=["PATCH"])
@super_admin_required
def update_user(user_id):
    """PATCH /api/auth/users/<id> — update user profile, role, department, or active status."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "User not found."}), 404

    data = request.get_json(silent=True) or {}
    changed = []

    for field in ["full_name", "phone", "program", "roll_number"]:
        if field in data:
            setattr(user, field, data[field])
            changed.append(field)

    if "role" in data and data["role"] in ["dept_coordinator", "faculty_coordinator", "organizer", "student", "super_admin"]:
        user.role = data["role"]
        changed.append("role")

    if "department_code" in data:
        dept = resolve_department(data["department_code"])
        if dept:
            user.department_id = dept.id
            changed.append("department")

    if "is_active" in data:
        user.is_active = bool(data["is_active"])
        changed.append("is_active")

    if "password" in data and data["password"]:
        user.set_password(data["password"])
        changed.append("password")

    admin = get_current_user()
    log = AuditLog(
        user_id=admin.id if admin else None,
        user_email=admin.email if admin else "system",
        action="USER_UPDATE",
        resource_type="user",
        resource_id=user.id,
        details=f"Updated user '{user.full_name}' ({user.email}): fields changed = {', '.join(changed)}",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User updated successfully.",
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/users/<int:user_id>/toggle-active", methods=["PATCH"])
@super_admin_required
def toggle_user_active(user_id):
    """PATCH /api/auth/users/<id>/toggle-active — enable or disable user account."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "User not found."}), 404

    user.is_active = not user.is_active
    action_label = "ENABLED" if user.is_active else "DISABLED"

    admin = get_current_user()
    log = AuditLog(
        user_id=admin.id if admin else None,
        user_email=admin.email if admin else "system",
        action=f"USER_{action_label}",
        resource_type="user",
        resource_id=user.id,
        details=f"Account {'enabled' if user.is_active else 'disabled'} for '{user.full_name}' ({user.email})",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"User account {action_label.lower()} successfully.",
        "user": user.to_dict(),
    }), 200


@auth_bp.route("/users/<int:user_id>", methods=["DELETE"])
@super_admin_required
def delete_user(user_id):
    """DELETE /api/auth/users/<id> — deactivate (soft-delete) a user account."""
    user = db.session.get(User, user_id)
    if not user:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "User not found."}), 404

    if user.role == "super_admin":
        return jsonify({"success": False, "error": "FORBIDDEN", "message": "Cannot delete the Super Admin account."}), 403

    # Soft-delete: deactivate rather than hard delete to preserve audit trail
    user.is_active = False
    admin = get_current_user()
    log = AuditLog(
        user_id=admin.id if admin else None,
        user_email=admin.email if admin else "system",
        action="USER_DEACTIVATED",
        resource_type="user",
        resource_id=user.id,
        details=f"Deactivated user '{user.full_name}' ({user.email}) — role: {user.role}",
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({"success": True, "message": f"User '{user.full_name}' has been deactivated."}), 200


@auth_bp.route("/demo-accounts", methods=["GET"])
def get_demo_accounts():
    """GET /api/auth/demo-accounts — quick helper for evaluating different roles."""
    sample_roles = ["super_admin", "dept_coordinator", "faculty_coordinator", "student"]
    accounts = []
    for r in sample_roles:
        u = User.query.filter_by(role=r).first()
        if u:
            accounts.append({
                "role": u.role,
                "email": u.email,
                "name": u.full_name,
                "department": u.department.code if u.department else "Institution",
            })
    return jsonify({"success": True, "demo_accounts": accounts}), 200
