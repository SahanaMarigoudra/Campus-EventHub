"""Event service — business logic for event operations."""
from app import db
from app.models.event import Event


def get_all_events():
    """Return all events ordered by event_date ascending."""
    return Event.query.order_by(Event.event_date.asc()).all()


def get_event_by_id(event_id: int):
    """Return a single event or None."""
    return Event.query.get(event_id)


def get_event_availability(event_id: int):
    """Return availability dict for an event."""
    event = get_event_by_id(event_id)
    if not event:
        return None
    return {
        "event_id": event.id,
        "title": event.title,
        "capacity": event.capacity,
        "confirmed_count": event.confirmed_count,
        "available_seats": event.available_seats,
        "is_full": event.is_full,
        "registration_open": event.registration_open,
    }
