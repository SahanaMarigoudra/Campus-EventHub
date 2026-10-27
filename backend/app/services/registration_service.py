"""Registration service — handles duplicate prevention, capacity enforcement, and registration CRUD."""
import re
import threading
from sqlalchemy.exc import IntegrityError, DatabaseError
from app import db
from app.models.event import Event
from app.models.participant import Participant
from app.models.registration import Registration

_registration_lock = threading.Lock()


def normalize_email(email: str) -> str:
    """Strip whitespace and lowercase the email."""
    return email.strip().lower()


def validate_email_format(email: str) -> bool:
    """Basic RFC-5321 inspired email validation."""
    pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
    return bool(re.match(pattern, email))


def register_participant(event_id: int, data: dict) -> dict:
    """
    Core registration flow with duplicate prevention.

    Returns a result dict:
      {"success": True, "registration": Registration}
      or
      {"success": False, "error": <error_code>, "message": <msg>}
    """
    # 1. Normalize and validate email
    raw_email = data.get("email", "")
    email = normalize_email(raw_email)
    if not validate_email_format(email):
        return {
            "success": False,
            "error": "INVALID_EMAIL",
            "message": "Please provide a valid email address.",
            "status_code": 400,
        }

    full_name = data.get("full_name", "").strip()
    college = data.get("college_or_organization", "").strip()
    domain_interests = data.get("domain_interests", [])

    # Validate required fields
    if not full_name:
        return {"success": False, "error": "MISSING_FIELD", "message": "Full name is required.", "status_code": 400}
    if not college:
        return {"success": False, "error": "MISSING_FIELD", "message": "College or organization is required.", "status_code": 400}

    with _registration_lock:
        # 2. Check event exists
        event = Event.query.get(event_id)
        if not event:
            return {"success": False, "error": "EVENT_NOT_FOUND", "message": "Event not found.", "status_code": 404}

        # 3. Check event is open for registration
        if not event.registration_open:
            return {
                "success": False,
                "error": "REGISTRATION_CLOSED",
                "message": "Registration for this event is currently closed.",
                "status_code": 400,
            }

        # 4. Check capacity (only confirmed count)
        if event.is_full:
            return {
                "success": False,
                "error": "EVENT_FULL",
                "message": "This event has reached its maximum capacity.",
                "status_code": 400,
            }

        # 5. Check for duplicate: same email already registered for this event
        existing_participant = Participant.query.filter_by(normalized_email=email).first()
        if existing_participant:
            existing_reg = Registration.query.filter_by(
                event_id=event_id, participant_id=existing_participant.id
            ).first()
            if existing_reg:
                return {
                    "success": False,
                    "error": "DUPLICATE_REGISTRATION",
                    "message": "This email address is already registered for this event.",
                    "status_code": 409,
                }

        # 6. Create or retrieve participant
        try:
            participant = existing_participant
            if not participant:
                participant = Participant(
                    full_name=full_name,
                    normalized_email=email,
                    college_or_organization=college,
                )
                db.session.add(participant)
                db.session.flush()  # get participant.id before commit

            # 7. Create registration
            registration = Registration(
                event_id=event_id,
                participant_id=participant.id,
                status="confirmed",
            )
            registration.domain_interests = domain_interests if isinstance(domain_interests, list) else []
            db.session.add(registration)
            db.session.commit()

            return {"success": True, "registration": registration, "status_code": 201}

        except (IntegrityError, DatabaseError) as e:
            db.session.rollback()
            # Race condition or unique constraint caught at DB level
            return {
                "success": False,
                "error": "DUPLICATE_REGISTRATION",
                "message": "This email address is already registered for this event.",
                "status_code": 409,
            }
        except Exception as e:
            db.session.rollback()
            return {
                "success": False,
                "error": "SERVER_ERROR",
                "message": f"An unexpected error occurred: {str(e)}",
                "status_code": 500,
            }


def get_event_registrations(event_id: int):
    """Return all registrations for an event with participant info."""
    return (
        Registration.query
        .filter_by(event_id=event_id)
        .order_by(Registration.registered_at.desc())
        .all()
    )


def get_all_registrations(search=None, event_id=None, status=None, page=1, per_page=20):
    """Return paginated registrations for the admin dashboard."""
    query = Registration.query.join(Registration.participant).join(Registration.event)

    if search:
        like = f"%{search}%"
        from app.models.participant import Participant as P
        query = query.filter(
            db.or_(P.full_name.ilike(like), P.normalized_email.ilike(like))
        )

    if event_id:
        query = query.filter(Registration.event_id == event_id)

    if status:
        query = query.filter(Registration.status == status)

    query = query.order_by(Registration.registered_at.desc())
    return query.paginate(page=page, per_page=per_page, error_out=False)


def update_registration_status(registration_id: int, new_status: str) -> dict:
    """Update status of a registration."""
    valid_statuses = {"confirmed", "pending", "cancelled"}
    if new_status not in valid_statuses:
        return {"success": False, "error": "INVALID_STATUS", "message": f"Status must be one of {valid_statuses}", "status_code": 400}

    reg = Registration.query.get(registration_id)
    if not reg:
        return {"success": False, "error": "NOT_FOUND", "message": "Registration not found.", "status_code": 404}

    reg.status = new_status
    db.session.commit()
    return {"success": True, "registration": reg, "status_code": 200}
