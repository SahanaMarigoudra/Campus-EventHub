from datetime import datetime
from app import db


class Participant(db.Model):
    __tablename__ = "participants"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(200), nullable=False)
    normalized_email = db.Column(db.String(254), nullable=False, unique=True, index=True)
    college_or_organization = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    registrations = db.relationship(
        "Registration", back_populates="participant", lazy="dynamic"
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):

        return {
            "id": self.id,
            "full_name": self.full_name,
            "normalized_email": self.normalized_email,
            "college_or_organization": self.college_or_organization,
            "created_at": self.created_at.isoformat(),
        }
