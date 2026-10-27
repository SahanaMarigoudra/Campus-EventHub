from datetime import datetime, timezone
from app import db


class Attendance(db.Model):
    __tablename__ = "attendance"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    registration_id = db.Column(db.Integer, db.ForeignKey("registrations.id", ondelete="CASCADE"), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    is_present = db.Column(db.Boolean, default=True)
    check_in_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    marked_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    notes = db.Column(db.String(255), nullable=True)

    __table_args__ = (
        db.UniqueConstraint("event_id", "user_id", name="uq_attendance_event_user"),
    )

    # Relationships
    event = db.relationship("Event", back_populates="attendance_records")
    registration = db.relationship("Registration", back_populates="attendance")
    user = db.relationship("User", foreign_keys=[user_id], back_populates="attendance_records")
    marker = db.relationship("User", foreign_keys=[marked_by_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):

        return {
            "id": self.id,
            "event_id": self.event_id,
            "registration_id": self.registration_id,
            "user_id": self.user_id,
            "student_name": self.user.full_name if self.user else None,
            "roll_number": self.user.roll_number if self.user else None,
            "email": self.user.email if self.user else None,
            "department_code": self.user.department.code if self.user and self.user.department else None,
            "is_present": self.is_present,
            "check_in_time": self.check_in_time.isoformat() if self.check_in_time else None,
            "marked_by": self.marker.full_name if self.marker else None,
            "notes": self.notes,
        }
