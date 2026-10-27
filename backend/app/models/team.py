from datetime import datetime, timezone
from app import db


class Team(db.Model):
    __tablename__ = "teams"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    team_name = db.Column(db.String(100), nullable=False)
    team_leader_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    status = db.Column(db.String(30), default="confirmed")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relationships
    event = db.relationship("Event", back_populates="teams")
    leader = db.relationship("User", foreign_keys=[team_leader_id])
    members = db.relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    registrations = db.relationship("Registration", back_populates="team")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "team_name": self.team_name,
            "team_leader_id": self.team_leader_id,
            "team_leader_name": self.leader.full_name if self.leader else None,
            "status": self.status,
            "members": [m.to_dict() for m in self.members],
            "members_count": len(self.members),
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class TeamMember(db.Model):
    __tablename__ = "team_members"

    id = db.Column(db.Integer, primary_key=True)
    team_id = db.Column(db.Integer, db.ForeignKey("teams.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    student_name = db.Column(db.String(120), nullable=False)
    roll_number = db.Column(db.String(50), nullable=True)
    email = db.Column(db.String(150), nullable=False)
    department_code = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    team = db.relationship("Team", back_populates="members")
    user = db.relationship("User")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    def to_dict(self):
        return {
            "id": self.id,
            "team_id": self.team_id,
            "user_id": self.user_id,
            "student_name": self.student_name,
            "roll_number": self.roll_number,
            "email": self.email,
            "department_code": self.department_code,
        }
