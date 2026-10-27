from datetime import datetime, timezone
from werkzeug.security import generate_password_hash, check_password_hash
from app import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    full_name = db.Column(db.String(120), nullable=False)
    role = db.Column(
        db.String(30),
        nullable=False,
        default="student",
        index=True,
    )  # super_admin, dept_coordinator, faculty_coordinator, student, organizer
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="SET NULL"), nullable=True, index=True)
    program = db.Column(db.String(80), nullable=True)  # e.g. "MCA Regular", "B.Tech CSE"
    roll_number = db.Column(db.String(50), nullable=True, index=True)
    phone = db.Column(db.String(20), nullable=True)
    avatar_url = db.Column(db.String(255), nullable=True)
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    department = db.relationship("Department", back_populates="users")
    created_events = db.relationship("Event", back_populates="creator", foreign_keys="Event.created_by_id")
    registrations = db.relationship("Registration", back_populates="user", cascade="all, delete-orphan")
    attendance_records = db.relationship("Attendance", foreign_keys="Attendance.user_id", back_populates="user", cascade="all, delete-orphan")
    certificates = db.relationship("Certificate", foreign_keys="Certificate.user_id", back_populates="user", cascade="all, delete-orphan")
    notifications = db.relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    bookmarks = db.relationship("Bookmark", back_populates="user", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def set_password(self, password: str):

        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self, include_sensitive=False):
        data = {
            "id": self.id,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "department_id": self.department_id,
            "department_code": self.department.code if self.department else None,
            "department_name": self.department.name if self.department else None,
            "program": self.program,
            "roll_number": self.roll_number,
            "phone": self.phone,
            "avatar_url": self.avatar_url,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        return data
