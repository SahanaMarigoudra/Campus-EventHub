"""Admin service — dashboard stats and admin operations."""
from app import db
from app.models.event import Event
from app.models.registration import Registration
from app.models.admin import Admin


def get_dashboard_stats() -> dict:
    """Return summary statistics for the admin dashboard."""
    total_events = Event.query.count()
    total_registrations = Registration.query.count()
    confirmed_count = Registration.query.filter_by(status="confirmed").count()
    pending_count = Registration.query.filter_by(status="pending").count()
    cancelled_count = Registration.query.filter_by(status="cancelled").count()

    total_capacity = db.session.query(db.func.sum(Event.capacity)).scalar() or 0
    total_confirmed = confirmed_count
    total_available = max(0, total_capacity - total_confirmed)

    return {
        "total_events": total_events,
        "total_registrations": total_registrations,
        "confirmed_count": confirmed_count,
        "pending_count": pending_count,
        "cancelled_count": cancelled_count,
        "total_capacity": total_capacity,
        "available_seats": total_available,
    }


def get_admin_by_username(username: str):
    return Admin.query.filter_by(username=username).first()
