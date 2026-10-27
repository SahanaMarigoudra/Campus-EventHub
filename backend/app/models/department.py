import json
from datetime import datetime, timezone
from app import db


class Department(db.Model):
    __tablename__ = "departments"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False, unique=True)
    code = db.Column(db.String(20), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    coordinator_name = db.Column(db.String(120), nullable=True)
    coordinator_email = db.Column(db.String(120), nullable=True)
    _programs = db.Column("programs", db.Text, nullable=True)  # JSON string of courses/programs
    is_active = db.Column(db.Boolean, default=True, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    users = db.relationship("User", back_populates="department", cascade="all, delete-orphan")
    events = db.relationship("Event", back_populates="department", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    @property
    def programs(self):
        if self._programs:
            try:
                return json.loads(self._programs)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    @programs.setter
    def programs(self, value):
        if isinstance(value, list):
            self._programs = json.dumps(value)
        else:
            self._programs = json.dumps([])

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "coordinator_name": self.coordinator_name,
            "coordinator_email": self.coordinator_email,
            "programs": self.programs,
            "is_active": self.is_active,
            "events_count": len(self.events) if self.events else 0,
            "students_count": len([u for u in self.users if u.role == "student"]) if self.users else 0,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
