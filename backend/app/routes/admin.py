"""Admin blueprint — authentication, dashboard, status updates, CSV export."""
import csv
import io
from flask import Blueprint, jsonify, request, make_response
from flask_jwt_extended import create_access_token
from app.auth.decorators import admin_required
from app.services.admin_service import get_dashboard_stats, get_admin_by_username
from app.services.registration_service import (
    update_registration_status,
    get_all_registrations,
)

admin_bp = Blueprint("admin", __name__)


@admin_bp.route("/login", methods=["POST"])
def admin_login():
    """POST /api/admin/login — returns a JWT token."""
    data = request.get_json(silent=True) or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "error": "MISSING_CREDENTIALS", "message": "Username and password are required."}), 400

    admin = get_admin_by_username(username)
    if not admin or not admin.check_password(password):
        return jsonify({"success": False, "error": "INVALID_CREDENTIALS", "message": "Invalid username or password."}), 401

    token = create_access_token(identity=str(admin.id))
    return jsonify({
        "success": True,
        "access_token": token,
        "admin": admin.to_dict(),
    }), 200


@admin_bp.route("/dashboard", methods=["GET"])
@admin_required
def dashboard():
    """GET /api/admin/dashboard — summary statistics."""
    stats = get_dashboard_stats()
    return jsonify({"success": True, **stats}), 200


@admin_bp.route("/registrations/<int:registration_id>/status", methods=["PATCH"])
@admin_required
def update_status(registration_id):
    """PATCH /api/admin/registrations/<id>/status — update registration status."""
    data = request.get_json(silent=True) or {}
    new_status = data.get("status", "").strip().lower()

    result = update_registration_status(registration_id, new_status)
    status_code = result.pop("status_code", 500)

    if not result["success"]:
        return jsonify(result), status_code

    reg = result["registration"]
    return jsonify({
        "success": True,
        "message": f"Registration status updated to '{new_status}'.",
        "registration": reg.to_dict(),
    }), 200


@admin_bp.route("/registrations/export", methods=["GET"])
@admin_required
def export_csv():
    """GET /api/admin/registrations/export — download CSV of filtered attendees."""
    search = request.args.get("search", "").strip() or None
    event_id = request.args.get("event_id", type=int)
    status = request.args.get("status", "").strip() or None

    # Get all (no pagination for export)
    pagination = get_all_registrations(search=search, event_id=event_id, status=status, page=1, per_page=10000)
    registrations = pagination.items

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Full Name", "Email", "College/Organization",
        "Event", "Domain Interests", "Status", "Registered At"
    ])
    for r in registrations:
        writer.writerow([
            r.id,
            r.participant.full_name if r.participant else "",
            r.participant.normalized_email if r.participant else "",
            r.participant.college_or_organization if r.participant else "",
            r.event.title if r.event else "",
            ", ".join(r.domain_interests),
            r.status,
            r.registered_at.strftime("%Y-%m-%d %H:%M:%S"),
        ])

    response = make_response(output.getvalue())
    response.headers["Content-Disposition"] = "attachment; filename=registrations.csv"
    response.headers["Content-Type"] = "text/csv"
    return response
