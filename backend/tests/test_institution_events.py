"""
Comprehensive Pytest Suite for Institution-Wide College Event Management System.
Tests all 24 required scenarios from Section 20 of specification.
"""
from datetime import datetime, timedelta, timezone
from app import db
from app.models.department import Department
from app.models.category import EventCategory
from app.models.event import Event
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.notification import Notification


# ─────────────────────────────────────────────
# 1. Successful authentication
# ─────────────────────────────────────────────
def test_successful_authentication(client, coordinator_user):
    resp = client.post("/api/auth/login", json={
        "email": "mca.coord@college.edu",
        "password": "Admin@123",
    })
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "mca.coord@college.edu"


# ─────────────────────────────────────────────
# 2. Invalid login credentials
# ─────────────────────────────────────────────
def test_invalid_login_credentials(client, student_user):
    resp = client.post("/api/auth/login", json={
        "email": "alex.mca@college.edu",
        "password": "WrongPassword999",
    })
    assert resp.status_code == 401
    assert resp.get_json()["error"] == "INVALID_CREDENTIALS"


# ─────────────────────────────────────────────
# 3. Department creation and listing
# ─────────────────────────────────────────────
def test_department_creation_and_listing(client, super_admin_token):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    create_resp = client.post("/api/departments", headers=headers, json={
        "name": "Master of Business Administration",
        "code": "MBA",
        "description": "Business school",
        "coordinator_name": "Prof. Meera Pillai",
        "coordinator_email": "meera@college.edu",
        "programs": ["MBA General", "MBA Finance"],
    })
    assert create_resp.status_code == 201

    list_resp = client.get("/api/departments")
    assert list_resp.status_code == 200
    data = list_resp.get_json()
    codes = [d["code"] for d in data["departments"]]
    assert "MBA" in codes


# ─────────────────────────────────────────────
# 4. Unauthorized department modification
# ─────────────────────────────────────────────
def test_unauthorized_department_modification(client, student_token, sample_dept):
    headers = {"Authorization": f"Bearer {student_token}"}
    resp = client.patch(f"/api/departments/{sample_dept.id}", headers=headers, json={
        "name": "Hacked Department Name",
    })
    assert resp.status_code == 403


# ─────────────────────────────────────────────
# 5. Event creation
# ─────────────────────────────────────────────
def test_event_creation(client, coordinator_token, sample_dept, sample_category):
    headers = {"Authorization": f"Bearer {coordinator_token}"}
    now = datetime.now(timezone.utc)
    resp = client.post("/api/events", headers=headers, json={
        "title": "Cloud Computing Bootcamp",
        "description": "Learn Kubernetes and Docker hands-on.",
        "department_id": sample_dept.id,
        "category_id": sample_category.id,
        "event_date": (now + timedelta(days=20)).isoformat(),
        "venue": "Lab 401",
        "capacity": 50,
        "event_mode": "Offline",
        "status": "pending_approval",
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["event"]["title"] == "Cloud Computing Bootcamp"
    assert data["event"]["status"] == "pending_approval"


# ─────────────────────────────────────────────
# 6. Event approval and rejection
# ─────────────────────────────────────────────
def test_event_approval_and_rejection(client, super_admin_token, sample_event):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    # Set to pending
    sample_event.status = "pending_approval"
    sample_event.approval_status = "pending"
    db.session.commit()

    # Approve
    resp = client.post(f"/api/events/{sample_event.id}/approve", headers=headers, json={
        "remarks": "Approved by academic dean.",
    })
    assert resp.status_code == 200
    assert resp.get_json()["event"]["status"] == "published"

    # Reject
    resp2 = client.post(f"/api/events/{sample_event.id}/reject", headers=headers, json={
        "remarks": "Schedule conflicts with examinations.",
    })
    assert resp2.status_code == 200
    assert resp2.get_json()["event"]["approval_status"] == "rejected"


# ─────────────────────────────────────────────
# 7. Filtering events by department
# ─────────────────────────────────────────────
def test_filtering_events_by_department(client, sample_event, sample_dept):
    resp = client.get(f"/api/events?department={sample_dept.code}")
    assert resp.status_code == 200
    events = resp.get_json()["events"]
    assert len(events) >= 1
    for ev in events:
        assert ev["department_code"] == sample_dept.code


# ─────────────────────────────────────────────
# 8. Filtering events by category and date
# ─────────────────────────────────────────────
def test_filtering_events_by_category_and_date(client, sample_event, sample_category):
    resp = client.get(f"/api/events?category={sample_category.code}&timeframe=upcoming")
    assert resp.status_code == 200
    events = resp.get_json()["events"]
    assert len(events) >= 1
    assert events[0]["category_code"] == sample_category.code


# ─────────────────────────────────────────────
# 9. Successful event registration
# ─────────────────────────────────────────────
def test_successful_event_registration(client, sample_event, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    resp = client.post(f"/api/events/{sample_event.id}/registrations", headers=headers, json={
        "participation_type": "individual",
    })
    assert resp.status_code == 201
    data = resp.get_json()
    assert data["success"] is True
    assert data["registration"]["status"] == "confirmed"


# ─────────────────────────────────────────────
# 10. Duplicate registration prevention
# ─────────────────────────────────────────────
def test_duplicate_registration_prevention(client, sample_event, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    # First registration
    client.post(f"/api/events/{sample_event.id}/registrations", headers=headers, json={})
    # Second duplicate registration
    resp = client.post(f"/api/events/{sample_event.id}/registrations", headers=headers, json={})
    assert resp.status_code == 409
    assert resp.get_json()["error"] == "DUPLICATE_REGISTRATION"


# ─────────────────────────────────────────────
# 11. Registration capacity enforcement
# ─────────────────────────────────────────────
def test_registration_capacity_enforcement(client, sample_event):
    # Set capacity to 1 in active session
    event = db.session.get(Event, sample_event.id)
    event.capacity = 1
    db.session.commit()

    # User 1 registers
    r1 = client.post(f"/api/events/{sample_event.id}/registrations", json={
        "full_name": "User One",
        "email": "user1@test.com",
    })
    assert r1.status_code == 201

    # User 2 attempts registration when full
    r2 = client.post(f"/api/events/{sample_event.id}/registrations", json={
        "full_name": "User Two",
        "email": "user2@test.com",
    })
    assert r2.status_code == 400
    assert r2.get_json()["error"] == "EVENT_FULL"


# ─────────────────────────────────────────────
# 12. Registration deadline enforcement
# ─────────────────────────────────────────────
def test_registration_deadline_enforcement(client, sample_event, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    # Set deadline in the past in active session
    event = db.session.get(Event, sample_event.id)
    event.registration_deadline = datetime.now(timezone.utc) - timedelta(days=1)
    db.session.commit()

    resp = client.post(f"/api/events/{sample_event.id}/registrations", headers=headers, json={})
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "REGISTRATION_CLOSED"


# ─────────────────────────────────────────────
# 13. Eligibility validation (Cross-department check)
# ─────────────────────────────────────────────
def test_eligibility_validation(client, sample_event, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    # Restrict event to MBA only
    event = db.session.get(Event, sample_event.id)
    event.participating_departments = ["MBA"]
    db.session.commit()

    # Student from MCA attempts registration
    resp = client.post(f"/api/events/{sample_event.id}/registrations", headers=headers, json={
        "department_code": "BCOM",
    })
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "INELIGIBLE_DEPARTMENT"


# ─────────────────────────────────────────────
# 14. Team-size validation
# ─────────────────────────────────────────────
def test_team_size_validation(client, sample_event, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    sample_event.participation_type = "team"
    sample_event.max_team_size = 2
    db.session.commit()

    # Attempt to submit 3 teammates + leader = 4 members (exceeds max 2)
    resp = client.post(f"/api/events/{sample_event.id}/registrations", headers=headers, json={
        "participation_type": "team",
        "team_name": "TooBigTeam",
        "team_members": [
            {"name": "Member 1", "email": "m1@test.com"},
            {"name": "Member 2", "email": "m2@test.com"},
            {"name": "Member 3", "email": "m3@test.com"},
        ],
    })
    assert resp.status_code == 400
    assert resp.get_json()["error"] == "TEAM_SIZE_EXCEEDED"


# ─────────────────────────────────────────────
# 15. Registration cancellation
# ─────────────────────────────────────────────
def test_registration_cancellation(client, sample_event, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    reg_resp = client.post(f"/api/events/{sample_event.id}/registrations", headers=headers, json={})
    reg_id = reg_resp.get_json()["registration"]["id"]

    cancel_resp = client.patch(f"/api/registrations/{reg_id}/cancel", headers=headers)
    assert cancel_resp.status_code == 200
    assert cancel_resp.get_json()["registration"]["status"] == "cancelled"


# ─────────────────────────────────────────────
# 16. Student access restrictions
# ─────────────────────────────────────────────
def test_student_access_restrictions(client, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    # Students cannot access admin dashboard
    resp = client.get("/api/admin/dashboard", headers=headers)
    assert resp.status_code == 403

    # Students cannot view compliance audit logs
    resp2 = client.get("/api/audit-logs", headers=headers)
    assert resp2.status_code == 403


# ─────────────────────────────────────────────
# 17. Department coordinator permissions
# ─────────────────────────────────────────────
def test_department_coordinator_permissions(client, coordinator_token, sample_dept):
    headers = {"Authorization": f"Bearer {coordinator_token}"}
    # Can access department dashboard
    resp = client.get(f"/api/departments/{sample_dept.id}/dashboard", headers=headers)
    assert resp.status_code == 200
    assert "stats" in resp.get_json()


# ─────────────────────────────────────────────
# 18. Super Admin permissions
# ─────────────────────────────────────────────
def test_super_admin_permissions(client, super_admin_token):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    resp = client.get("/api/admin/dashboard", headers=headers)
    assert resp.status_code == 200
    assert "kpis" in resp.get_json()


# ─────────────────────────────────────────────
# 19. Attendance recording
# ─────────────────────────────────────────────
def test_attendance_recording(client, super_admin_token, sample_event, student_user):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    # Register student
    reg = Registration(event_id=sample_event.id, user_id=student_user.id, status="confirmed")
    db.session.add(reg)
    db.session.commit()

    # Mark present
    resp = client.post(f"/api/events/{sample_event.id}/attendance", headers=headers, json={
        "user_id": student_user.id,
        "is_present": True,
    })
    assert resp.status_code == 200

    # Verify presence
    att_resp = client.get(f"/api/events/{sample_event.id}/attendance", headers=headers)
    assert att_resp.status_code == 200
    participants = att_resp.get_json()["participants"]
    assert any(p["user_id"] == student_user.id and p["is_present"] for p in participants)


# ─────────────────────────────────────────────
# 20. Certificate access restrictions
# ─────────────────────────────────────────────
def test_certificate_access_restrictions(client, student_token, sample_event):
    headers = {"Authorization": f"Bearer {student_token}"}
    # Student cannot generate certificates
    resp = client.post(f"/api/events/{sample_event.id}/certificates", headers=headers, json={})
    assert resp.status_code == 403


# ─────────────────────────────────────────────
# 21. Notification retrieval and status updates
# ─────────────────────────────────────────────
def test_notification_retrieval_and_status_updates(client, student_user, student_token):
    headers = {"Authorization": f"Bearer {student_token}"}
    notif = Notification(
        user_id=student_user.id,
        title="Welcome Alert",
        message="Your portal is active.",
        type="info",
        is_read=False,
    )
    db.session.add(notif)
    db.session.commit()

    # Retrieve
    resp = client.get("/api/notifications", headers=headers)
    assert resp.status_code == 200
    assert resp.get_json()["unread_count"] >= 1

    # Mark read
    patch_resp = client.patch(f"/api/notifications/{notif.id}/read", headers=headers)
    assert patch_resp.status_code == 200


# ─────────────────────────────────────────────
# 22. Dashboard statistics accuracy
# ─────────────────────────────────────────────
def test_dashboard_statistics_accuracy(client, super_admin_token, sample_event):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    resp = client.get("/api/admin/dashboard", headers=headers)
    assert resp.status_code == 200
    kpis = resp.get_json()["kpis"]
    assert kpis["total_events"] >= 1
    assert "department_stats" in resp.get_json()


# ─────────────────────────────────────────────
# 23. Event cancellation behavior
# ─────────────────────────────────────────────
def test_event_cancellation_behavior(client, super_admin_token, sample_event):
    headers = {"Authorization": f"Bearer {super_admin_token}"}
    resp = client.delete(f"/api/events/{sample_event.id}", headers=headers)
    assert resp.status_code == 200

    # Ensure cancelled events are not in default public listing
    public_list = client.get("/api/events")
    event_ids = [e["id"] for e in public_list.get_json()["events"]]
    assert sample_event.id not in event_ids


# ─────────────────────────────────────────────
# 24. CSV export authorization
# ─────────────────────────────────────────────
def test_csv_export_authorization(client, student_token, super_admin_token):
    # Student forbidden
    student_headers = {"Authorization": f"Bearer {student_token}"}
    forbidden_resp = client.get("/api/reports/export?type=events", headers=student_headers)
    assert forbidden_resp.status_code == 403

    # Super Admin allowed
    admin_headers = {"Authorization": f"Bearer {super_admin_token}"}
    allowed_resp = client.get("/api/reports/export?type=events", headers=admin_headers)
    assert allowed_resp.status_code == 200
    assert "text/csv" in allowed_resp.headers["Content-Type"]
