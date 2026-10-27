"""Event Categories blueprint — dynamic category creation and listing."""
from flask import Blueprint, jsonify, request
from app import db
from app.models.category import EventCategory
from app.auth.decorators import super_admin_required

categories_bp = Blueprint("categories", __name__)


@categories_bp.route("", methods=["GET"])
def get_categories():
    """GET /api/categories — list all active event categories."""
    categories = EventCategory.query.filter_by(is_active=True).order_by(EventCategory.name.asc()).all()
    return jsonify({
        "success": True,
        "categories": [c.to_dict() for c in categories],
        "total": len(categories),
    }), 200


@categories_bp.route("", methods=["POST"])
@super_admin_required
def create_category():
    """POST /api/categories — Super Admin adds a new category."""
    data = request.get_json(silent=True) or {}
    name = data.get("name", "").strip()
    code = data.get("code", "").strip().upper()
    description = data.get("description", "").strip()
    icon = data.get("icon", "Calendar")
    color = data.get("color", "#3b82f6")

    if not name or not code:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Category name and code are required."}), 400

    if EventCategory.query.filter((EventCategory.name == name) | (EventCategory.code == code)).first():
        return jsonify({"success": False, "error": "ALREADY_EXISTS", "message": "Category with this name or code already exists."}), 409

    category = EventCategory(
        name=name,
        code=code,
        description=description,
        icon=icon,
        color=color,
    )
    db.session.add(category)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Category {category.name} created.",
        "category": category.to_dict(),
    }), 201


@categories_bp.route("/<int:cat_id>", methods=["PATCH"])
@super_admin_required
def update_category(cat_id):
    """PATCH /api/categories/<id> — update category details."""
    cat = db.session.get(EventCategory, cat_id)
    if not cat:
        return jsonify({"success": False, "error": "NOT_FOUND", "message": "Category not found."}), 404

    data = request.get_json(silent=True) or {}
    if "name" in data:
        cat.name = data["name"].strip()
    if "description" in data:
        cat.description = data["description"].strip()
    if "icon" in data:
        cat.icon = data["icon"].strip()
    if "color" in data:
        cat.color = data["color"].strip()
    if "is_active" in data:
        cat.is_active = bool(data["is_active"])

    db.session.commit()
    return jsonify({"success": True, "category": cat.to_dict()}), 200
