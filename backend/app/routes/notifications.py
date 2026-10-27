"""Notifications and Announcements blueprint."""
from flask import Blueprint, jsonify, request
from app import db
from app.models.notification import Notification, Announcement
from app.auth.decorators import login_required, faculty_or_admin_required

notifications_bp = Blueprint("notifications", __name__)


@notifications_bp.route("/notifications", methods=["GET"])
@login_required
def get_notifications():
    """GET /api/notifications — current user's in-app alerts."""
    user = request.current_user
    notifications = (
        Notification.query.filter_by(user_id=user.id)
        .order_by(Notification.created_at.desc())
        .limit(30)
        .all()
    )
    unread_count = Notification.query.filter_by(user_id=user.id, is_read=False).count()

    return jsonify({
        "success": True,
        "notifications": [n.to_dict() for n in notifications],
        "unread_count": unread_count,
    }), 200


@notifications_bp.route("/notifications/<int:notif_id>/read", methods=["PATCH"])
@login_required
def mark_notification_read(notif_id):
    """PATCH /api/notifications/<id>/read — mark single notification as read."""
    notif = db.session.get(Notification, notif_id)
    if notif and notif.user_id == request.current_user.id:
        notif.is_read = True
        db.session.commit()
    return jsonify({"success": True, "message": "Marked as read."}), 200


@notifications_bp.route("/notifications/mark-all-read", methods=["POST"])
@login_required
def mark_all_notifications_read():
    """POST /api/notifications/mark-all-read — mark all user notifications as read."""
    Notification.query.filter_by(user_id=request.current_user.id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"success": True, "message": "All notifications marked as read."}), 200


@notifications_bp.route("/announcements", methods=["GET"])
def get_announcements():
    """GET /api/announcements — public & institutional announcements."""
    target_dept = request.args.get("department_id", type=int)
    query = Announcement.query
    if target_dept:
        query = query.filter((Announcement.target_type == "all") | (Announcement.target_id == target_dept))
    else:
        query = query.filter_by(target_type="all")

    announcements = query.order_by(Announcement.created_at.desc()).limit(20).all()
    return jsonify({
        "success": True,
        "announcements": [a.to_dict() for a in announcements],
        "total": len(announcements),
    }), 200


@notifications_bp.route("/announcements", methods=["POST"])
@faculty_or_admin_required
def create_announcement():
    """POST /api/announcements — post institution or department announcement."""
    data = request.get_json(silent=True) or {}
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    target_type = data.get("target_type", "all")
    target_id = data.get("target_id")

    if not title or not content:
        return jsonify({"success": False, "error": "MISSING_FIELDS", "message": "Title and content are required."}), 400

    announcement = Announcement(
        title=title,
        content=content,
        target_type=target_type,
        target_id=target_id,
        created_by_id=request.current_user.id,
    )
    db.session.add(announcement)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Announcement published successfully.",
        "announcement": announcement.to_dict(),
    }), 201
