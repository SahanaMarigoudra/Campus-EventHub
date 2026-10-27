"""Pytest configuration and shared fixtures for Institution Event Management System."""
import pytest
from datetime import datetime, timedelta, timezone
from app import create_app, db
from app.models.department import Department
from app.models.category import EventCategory
from app.models.user import User
from app.models.event import Event
from app.models.registration import Registration
from config import TestingConfig
from flask_jwt_extended import create_access_token


@pytest.fixture(scope="function")
def app():
    """Create application with in-memory SQLite for each test."""
    application = create_app(TestingConfig)
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture(scope="function")
def client(app):
    return app.test_client()


@pytest.fixture(scope="function")
def sample_dept(app):
    with app.app_context():
        dept = Department(
            name="Master of Computer Applications",
            code="MCA",
            description="Computer Applications department",
            coordinator_name="Dr. Ramesh Sharma",
            coordinator_email="ramesh@college.edu",
            programs=["MCA Regular"],
        )
        db.session.add(dept)
        db.session.commit()
        return db.session.get(Department, dept.id)


@pytest.fixture(scope="function")
def sample_category(app):
    with app.app_context():
        cat = EventCategory(
            name="Technical & Computing",
            code="TECH",
            description="Technical competitions and workshops",
            icon="Code2",
            color="#3b82f6",
        )
        db.session.add(cat)
        db.session.commit()
        return db.session.get(EventCategory, cat.id)


@pytest.fixture(scope="function")
def super_admin_user(app):
    with app.app_context():
        admin = User(
            email="superadmin@college.edu",
            full_name="Dr. Arthur Campbell",
            role="super_admin",
            program="Administration",
            roll_number="ADM-001",
        )
        admin.set_password("Admin@123")
        db.session.add(admin)
        db.session.commit()
        return db.session.get(User, admin.id)


@pytest.fixture(scope="function")
def super_admin_token(super_admin_user):
    return create_access_token(
        identity=str(super_admin_user.id),
        additional_claims={"role": super_admin_user.role, "email": super_admin_user.email},
    )


@pytest.fixture(scope="function")
def coordinator_user(app, sample_dept):
    with app.app_context():
        coord = User(
            email="mca.coord@college.edu",
            full_name="Dr. Ramesh Sharma",
            role="dept_coordinator",
            department_id=sample_dept.id,
            program="MCA Faculty",
            roll_number="FAC-001",
        )
        coord.set_password("Admin@123")
        db.session.add(coord)
        db.session.commit()
        return db.session.get(User, coord.id)


@pytest.fixture(scope="function")
def coordinator_token(coordinator_user):
    return create_access_token(
        identity=str(coordinator_user.id),
        additional_claims={"role": coordinator_user.role, "email": coordinator_user.email},
    )


@pytest.fixture(scope="function")
def student_user(app, sample_dept):
    with app.app_context():
        student = User(
            email="alex.mca@college.edu",
            full_name="Alex Rivera",
            role="student",
            department_id=sample_dept.id,
            program="MCA Regular",
            roll_number="MCA-2026-001",
        )
        student.set_password("Student@123")
        db.session.add(student)
        db.session.commit()
        return db.session.get(User, student.id)


@pytest.fixture(scope="function")
def student_token(student_user):
    return create_access_token(
        identity=str(student_user.id),
        additional_claims={"role": student_user.role, "email": student_user.email},
    )


@pytest.fixture(scope="function")
def sample_event(app, sample_dept, sample_category, coordinator_user):
    with app.app_context():
        now = datetime.now(timezone.utc)
        event = Event(
            title="AI and Machine Learning Workshop",
            description="Hands-on workshop covering neural networks and practical applications.",
            department_id=sample_dept.id,
            category_id=sample_category.id,
            created_by_id=coordinator_user.id,
            event_date=now + timedelta(days=14),
            registration_deadline=now + timedelta(days=12),
            venue="Tech Hub Room 301",
            event_mode="Offline",
            capacity=5,
            participation_type="individual",
            status="published",
            approval_status="approved",
        )
        event.participating_departments = ["ALL"]
        db.session.add(event)
        db.session.commit()
        return db.session.get(Event, event.id)
