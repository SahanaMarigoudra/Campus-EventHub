"""Bookmarks blueprint — student saved events."""
from flask import Blueprint, jsonify, request
from app import db
from app.models.bookmark import Bookmark
from app.models.event import Event
from app.auth.decorators import login_required

bookmarks_bp = Blueprint("bookmarks", __name__)


@bookmarks_bp.route("/my/bookmarks", methods=["GET"])
@login_required
def get_my_bookmarks():
    """GET /api/my/bookmarks — list student's bookmarked events."""
    user = request.current_user
    bookmarks = Bookmark.query.filter_by(user_id=user.id).order_by(Bookmark.created_at.desc()).all()
    return jsonify({
        "success": True,
        "bookmarks": [b.to_dict() for b in bookmarks],
        "total": len(bookmarks),
    }), 200


@bookmarks_bp.route("/events/<int:event_id>/bookmark", methods=["POST"])
@login_required
def add_bookmark(event_id):
    """POST /api/events/<id>/bookmark — save event to student wishlist."""
    user = request.current_user
    event = db.session.get(Event, event_id)
    if not event:
        return jsonify({"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found."}), 404

    existing = Bookmark.query.filter_by(user_id=user.id, event_id=event_id).first()
    if existing:
        return jsonify({"success": True, "message": "Already bookmarked.", "bookmark": existing.to_dict()}), 200

    bm = Bookmark(user_id=user.id, event_id=event_id)
    db.session.add(bm)
    db.session.commit()
    return jsonify({"success": True, "message": "Event bookmarked.", "bookmark": bm.to_dict()}), 201


@bookmarks_bp.route("/events/<int:event_id>/bookmark", methods=["DELETE"])
@login_required
def remove_bookmark(event_id):
    """DELETE /api/events/<id>/bookmark — remove event from wishlist."""
    user = request.current_user
    bm = Bookmark.query.filter_by(user_id=user.id, event_id=event_id).first()
    if bm:
        db.session.delete(bm)
        db.session.commit()
    return jsonify({"success": True, "message": "Bookmark removed."}), 200
