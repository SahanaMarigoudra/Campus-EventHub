from datetime import datetime, timezone
import hashlib
from app import db


class Certificate(db.Model):
    __tablename__ = "certificates"

    id = db.Column(db.Integer, primary_key=True)
    certificate_number = db.Column(db.String(80), unique=True, nullable=False, index=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=True, index=True)
    title = db.Column(db.String(200), default="Certificate of Participation")
    cert_type = db.Column(db.String(50), default="participation")  # 'winner', 'runner_up', 'second_runner_up', 'special_award', 'participation'
    rank_position = db.Column(db.String(100), nullable=True)  # e.g. "1st Place (Grand Champion)"
    recipient_name = db.Column(db.String(150), nullable=True)
    team_name = db.Column(db.String(150), nullable=True)
    prize = db.Column(db.String(150), nullable=True)
    track = db.Column(db.String(150), nullable=True)
    verification_hash = db.Column(db.String(64), nullable=True)
    issue_date = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    issued_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    download_url = db.Column(db.String(255), nullable=True)

    __table_args__ = (
        db.UniqueConstraint("event_id", "user_id", "cert_type", name="uq_certificate_event_user_type"),
    )

    # Relationships
    event = db.relationship("Event", back_populates="certificates")
    user = db.relationship("User", foreign_keys=[user_id], back_populates="certificates")
    issuer = db.relationship("User", foreign_keys=[issued_by_id])

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    def generate_hash(self):
        seed_str = f"{self.certificate_number}:{self.event_id}:{self.user_id}:{self.rank_position or ''}:{self.title}"
        return hashlib.sha256(seed_str.encode("utf-8")).hexdigest()[:24].upper()

    def to_dict(self):
        dept_name = self.event.department.name if self.event and self.event.department else "International Innovation Alliance"
        dept_code = self.event.department.code if self.event and self.event.department else "GLOBAL"
        resolved_name = self.recipient_name or (self.user.full_name if self.user else "Distinguished Participant")
        hash_val = self.verification_hash or self.generate_hash()

        return {
            "id": self.id,
            "certificate_number": self.certificate_number,
            "event_id": self.event_id,
            "event_title": self.event.title if self.event else None,
            "department_code": dept_code,
            "department_name": dept_name,
            "event_date": self.event.event_date.isoformat() if self.event and self.event.event_date else None,
            "user_id": self.user_id,
            "student_name": resolved_name,
            "recipient_name": resolved_name,
            "roll_number": self.user.roll_number if self.user else None,
            "title": self.title,
            "cert_type": self.cert_type or "participation",
            "rank_position": self.rank_position,
            "team_name": self.team_name,
            "prize": self.prize,
            "track": self.track or (self.event.category.name if self.event and self.event.category else "Technical Innovation"),
            "verification_hash": hash_val,
            "issue_date": self.issue_date.isoformat() if self.issue_date else None,
            "issuer_name": self.issuer.full_name if self.issuer else "Global Hackathon Directorate & Jury",
            "download_url": self.download_url,
        }
