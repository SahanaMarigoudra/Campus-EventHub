import json
from datetime import datetime, timezone
from app import db


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    user_email = db.Column(db.String(150), nullable=True)
    action = db.Column(db.String(80), nullable=False, index=True)  # EVENT_CREATE, EVENT_APPROVE, EVENT_REJECT, etc.
    resource_type = db.Column(db.String(50), nullable=False)  # event, department, registration, user
    resource_id = db.Column(db.Integer, nullable=True)
    details = db.Column(db.Text, nullable=True)
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), index=True)

    user = db.relationship("User")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):

        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_email": self.user_email or (self.user.email if self.user else "System"),
            "user_name": self.user.full_name if self.user else "System",
            "action": self.action,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "details": self.details,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
