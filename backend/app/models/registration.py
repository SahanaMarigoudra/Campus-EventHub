from datetime import datetime, timezone
from app import db


class Registration(db.Model):
    __tablename__ = "registrations"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id", ondelete="SET NULL"), nullable=True, index=True)
    participation_type = db.Column(db.String(20), default="individual")  # individual, team
    status = db.Column(
        db.String(20),
        nullable=False,
        default="confirmed",
        index=True,
    )  # confirmed, waitlist, cancelled
    notes = db.Column(db.Text, nullable=True)
    registered_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)

    # Unique constraint: one registration per student per event
    __table_args__ = (
        db.UniqueConstraint("event_id", "user_id", name="uq_event_user_registration"),
    )

    # Relationships
    event = db.relationship("Event", back_populates="registrations")
    user = db.relationship("User", back_populates="registrations")
    team = db.relationship("Team", back_populates="registrations")
    attendance = db.relationship("Attendance", back_populates="registration", uselist=False, cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    def to_dict(self):

        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "team_id": self.team_id,
            "team_name": self.team.team_name if self.team else None,
            "participation_type": self.participation_type,
            "status": self.status,
            "notes": self.notes,
            "registered_at": self.registered_at.isoformat() if self.registered_at else None,
            "cancelled_at": self.cancelled_at.isoformat() if self.cancelled_at else None,
            "event": {
                "id": self.event.id,
                "title": self.event.title,
                "event_date": self.event.event_date.isoformat() if self.event.event_date else None,
                "venue": self.event.venue,
                "event_mode": self.event.event_mode,
                "status": self.event.status,
                "category_name": self.event.category.name if self.event and self.event.category else "General",
                "department_code": self.event.department.code if self.event and self.event.department else None,
            } if self.event else None,
            "user": {
                "id": self.user.id,
                "full_name": self.user.full_name,
                "email": self.user.email,
                "roll_number": self.user.roll_number,
                "program": self.user.program,
                "department_code": self.user.department.code if self.user and self.user.department else None,
            } if self.user else None,
        }
