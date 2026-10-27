"""
Test suite covering all 14 required test scenarios.
"""
import threading
import pytest


# ─────────────────────────────────────────────
# 1. Fetch all events successfully
# ─────────────────────────────────────────────
def test_fetch_all_events(client, sample_event):
    resp = client.get("/api/events")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["count"] >= 1
    assert any(e["id"] == sample_event.id for e in data["events"])


# ─────────────────────────────────────────────
# 2. Retrieve details for an existing event
# ─────────────────────────────────────────────
def test_get_event_detail(client, sample_event):
    resp = client.get(f"/api/events/{sample_event.id}")
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert data["event"]["title"] == "Test Event"
    assert data["event"]["capacity"] == 5


def test_get_nonexistent_event(client):
    resp = client.get("/api/events/9999")
    assert resp.status_code == 404


# ─────────────────────────────────────────────
# 3. Register a new participant — 201 Created
# ─────────────────────────────────────────────
def test_register_new_participant(client, sample_event):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane.doe@example.com",
        "college_or_organization": "MIT",
        "domain_interests": ["Artificial Intelligence", "Data Science"],
    }
    resp = client.post(f"/api/events/{sample_event.id}/registrations", json=payload)
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert "registration" in data
    assert data["registration"]["status"] == "confirmed"


# ─────────────────────────────────────────────
# 4. Duplicate registration → 409 Conflict
# ─────────────────────────────────────────────
def test_duplicate_registration_same_event(client, sample_event):
    payload = {
        "full_name": "Jane Doe",
        "email": "jane.doe@example.com",
        "college_or_organization": "MIT",
        "domain_interests": [],
    }
    # First registration
    resp1 = client.post(f"/api/events/{sample_event.id}/registrations", json=payload)
    assert resp1.status_code == 201

    # Duplicate
    resp2 = client.post(f"/api/events/{sample_event.id}/registrations", json=payload)
    assert resp2.status_code == 409
    data = resp2.get_json()
    assert data["error"] == "DUPLICATE_REGISTRATION"
    assert data["success"] is False


# ─────────────────────────────────────────────
# 5. Same email can register for a DIFFERENT event
# ─────────────────────────────────────────────
def test_same_email_different_event(client, app):
    from app.models.event import Event
    from app import db
    from datetime import datetime, timedelta

    with app.app_context():
        event_a = Event(
            title="Event A", description="Desc A",
            event_date=datetime.utcnow() + timedelta(days=10),
            venue="Hall A", capacity=50, category="Test", registration_open=True,
        )
        event_b = Event(
            title="Event B", description="Desc B",
            event_date=datetime.utcnow() + timedelta(days=20),
            venue="Hall B", capacity=50, category="Test", registration_open=True,
        )
        db.session.add_all([event_a, event_b])
        db.session.commit()
        id_a, id_b = event_a.id, event_b.id

    payload = {
        "full_name": "Shared User",
        "email": "shared@example.com",
        "college_or_organization": "Anywhere",
        "domain_interests": [],
    }
    resp_a = client.post(f"/api/events/{id_a}/registrations", json=payload)
    assert resp_a.status_code == 201

    resp_b = client.post(f"/api/events/{id_b}/registrations", json=payload)
    assert resp_b.status_code == 201


# ─────────────────────────────────────────────
# 6. Reject invalid email addresses
# ─────────────────────────────────────────────
@pytest.mark.parametrize("bad_email", [
    "not-an-email",
    "@nodomain.com",
    "missing@",
    "spaces in@email.com",
    "",
])
def test_reject_invalid_email(client, sample_event, bad_email):
    payload = {
        "full_name": "Test User",
        "email": bad_email,
        "college_or_organization": "SomeOrg",
        "domain_interests": [],
    }
    resp = client.post(f"/api/events/{sample_event.id}/registrations", json=payload)
    assert resp.status_code == 400
    data = resp.get_json()
    assert data["error"] == "INVALID_EMAIL"


# ─────────────────────────────────────────────
# 7. Reject missing required fields
# ─────────────────────────────────────────────
def test_reject_missing_full_name(client, sample_event):
    payload = {"email": "ok@example.com", "college_or_organization": "Org", "domain_interests": []}
    resp = client.post(f"/api/events/{sample_event.id}/registrations", json=payload)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "MISSING_FIELD"


def test_reject_missing_college(client, sample_event):
    payload = {"full_name": "Name", "email": "ok2@example.com", "domain_interests": []}
    resp = client.post(f"/api/events/{sample_event.id}/registrations", json=payload)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "MISSING_FIELD"


# ─────────────────────────────────────────────
# 8. Reject registration when event is full
# ─────────────────────────────────────────────
def test_reject_when_event_full(client, full_event):
    payload = {
        "full_name": "Late Comer",
        "email": "latecomer@example.com",
        "college_or_organization": "Nowhere",
        "domain_interests": [],
    }
    resp = client.post(f"/api/events/{full_event.id}/registrations", json=payload)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "EVENT_FULL"


# ─────────────────────────────────────────────
# 9. Reject registration when event is closed
# ─────────────────────────────────────────────
def test_reject_when_registration_closed(client, closed_event):
    payload = {
        "full_name": "Hopeful Person",
        "email": "hopeful@example.com",
        "college_or_organization": "SomeCollege",
        "domain_interests": [],
    }
    resp = client.post(f"/api/events/{closed_event.id}/registrations", json=payload)
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "REGISTRATION_CLOSED"


# ─────────────────────────────────────────────
# 10. Cancelled registrations do NOT consume capacity
# ─────────────────────────────────────────────
def test_cancelled_registrations_dont_consume_capacity(client, app):
    from app.models.event import Event
    from app.models.participant import Participant
    from app.models.registration import Registration
    from app import db
    from datetime import datetime, timedelta

    with app.app_context():
        event = Event(
            title="Capacity Test Event", description="desc",
            event_date=datetime.utcnow() + timedelta(days=5),
            venue="Hall", capacity=1, category="Test", registration_open=True,
        )
        db.session.add(event)
        db.session.flush()

        p = Participant(full_name="Canceller", normalized_email="canceller@test.com", college_or_organization="Org")
        db.session.add(p)
        db.session.flush()

        reg = Registration(event_id=event.id, participant_id=p.id, status="cancelled")
        db.session.add(reg)
        db.session.commit()
        eid = event.id

    # Should succeed because the cancelled registration doesn't consume capacity
    payload = {
        "full_name": "New Person",
        "email": "newperson@example.com",
        "college_or_organization": "NewOrg",
        "domain_interests": [],
    }
    resp = client.post(f"/api/events/{eid}/registrations", json=payload)
    assert resp.status_code == 201


# ─────────────────────────────────────────────
# 11. Registration counts update correctly
# ─────────────────────────────────────────────
def test_registration_count_updates(client, sample_event):
    eid = sample_event.id
    initial = client.get(f"/api/events/{eid}/availability").get_json()
    initial_confirmed = initial["confirmed_count"]
    initial_available = initial["available_seats"]

    payload = {
        "full_name": "Counter User",
        "email": "counter@example.com",
        "college_or_organization": "CounterOrg",
        "domain_interests": [],
    }
    client.post(f"/api/events/{eid}/registrations", json=payload)

    updated = client.get(f"/api/events/{eid}/availability").get_json()
    assert updated["confirmed_count"] == initial_confirmed + 1
    assert updated["available_seats"] == initial_available - 1


# ─────────────────────────────────────────────
# 12. Unauthenticated users cannot access admin endpoints
# ─────────────────────────────────────────────
def test_admin_dashboard_requires_auth(client):
    resp = client.get("/api/admin/dashboard")
    assert resp.status_code == 401


def test_registrations_list_requires_auth(client):
    resp = client.get("/api/registrations")
    assert resp.status_code == 401


# ─────────────────────────────────────────────
# 12b. Admin can access protected endpoints with valid token
# ─────────────────────────────────────────────
def test_admin_dashboard_with_token(client, admin_token, sample_event):
    headers = {"Authorization": f"Bearer {admin_token}"}
    resp = client.get("/api/admin/dashboard", headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert "total_events" in data


# ─────────────────────────────────────────────
# 13. Search and status filtering in admin view
# ─────────────────────────────────────────────
def test_admin_search_and_filter(client, admin_token, sample_event):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Register someone
    client.post(f"/api/events/{sample_event.id}/registrations", json={
        "full_name": "Searchable User",
        "email": "searchable@example.com",
        "college_or_organization": "SomeCollege",
        "domain_interests": [],
    })

    # Search by name
    resp = client.get("/api/registrations?search=searchable", headers=headers)
    assert resp.status_code == 200
    data = resp.get_json()
    assert len(data["registrations"]) >= 1

    # Filter by status
    resp2 = client.get("/api/registrations?status=confirmed", headers=headers)
    assert resp2.status_code == 200
    for reg in resp2.get_json()["registrations"]:
        assert reg["status"] == "confirmed"


# ─────────────────────────────────────────────
# 14. Concurrent duplicate registration attempts
# ─────────────────────────────────────────────
def test_concurrent_duplicate_registration(client, sample_event):
    """Two simultaneous requests with the same email should result in exactly one success."""
    event_id = sample_event.id
    results = []
    payload = {
        "full_name": "Race Condition User",
        "email": "race@example.com",
        "college_or_organization": "SpeedOrg",
        "domain_interests": [],
    }

    def register():
        with client.application.test_client() as c:
            r = c.post(f"/api/events/{event_id}/registrations", json=payload)
            results.append(r.status_code)

    threads = [threading.Thread(target=register) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()

    successes = results.count(201)
    conflicts = results.count(409)
    assert successes == 1, f"Expected exactly 1 success, got {successes}. Results: {results}"
    assert conflicts == 4, f"Expected 4 conflicts, got {conflicts}. Results: {results}"
