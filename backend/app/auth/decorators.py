"""Authentication helpers and role-based decorators."""
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from app import db
from app.models.user import User


def get_current_user():
    """Helper to retrieve current authenticated User object."""
    try:
        verify_jwt_in_request()
        identity = get_jwt_identity()
        user_id = int(identity) if identity is not None else None
        if not user_id:
            return None
        return db.session.get(User, user_id)
    except Exception:
        return None


def login_required(fn):
    """Requires valid JWT authentication."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        try:
            verify_jwt_in_request()
            identity = get_jwt_identity()
            user_id = int(identity) if identity is not None else None
            user = db.session.get(User, user_id) if user_id else None
            if not user or not user.is_active:
                return jsonify({"success": False, "error": "UNAUTHORIZED", "message": "Authentication required or account deactivated."}), 401
            request.current_user = user
        except Exception as e:
            return jsonify({"success": False, "error": "UNAUTHORIZED", "message": str(e)}), 401
        return fn(*args, **kwargs)
    return wrapper


def role_required(allowed_roles):
    """Enforces role-based authorization."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
                identity = get_jwt_identity()
                user_id = int(identity) if identity is not None else None
                user = db.session.get(User, user_id) if user_id else None
                if not user or not user.is_active:
                    return jsonify({"success": False, "error": "UNAUTHORIZED", "message": "User not authenticated."}), 401

                if user.role not in allowed_roles:
                    return jsonify({
                        "success": False,
                        "error": "FORBIDDEN",
                        "message": f"Access denied. Requires one of the roles: {', '.join(allowed_roles)}.",
                    }), 403

                request.current_user = user
            except Exception as e:
                return jsonify({"success": False, "error": "UNAUTHORIZED", "message": str(e)}), 401
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def super_admin_required(fn):
    return role_required(["super_admin"])(fn)


def dept_coordinator_required(fn):
    return role_required(["super_admin", "dept_coordinator"])(fn)


def faculty_or_admin_required(fn):
    return role_required(["super_admin", "dept_coordinator", "faculty_coordinator"])(fn)
