import json
from datetime import datetime, timezone
from app import db


class EventFeedback(db.Model):
    __tablename__ = "event_feedbacks"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    rating = db.Column(db.Integer, nullable=False, default=5)  # 1 to 5 stars
    comment = db.Column(db.Text, nullable=True)
    submitted_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("event_id", "user_id", name="uq_feedback_event_user"),
    )

    event = db.relationship("Event", back_populates="feedbacks")
    user = db.relationship("User")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "user_id": self.user_id,
            "user_name": self.user.full_name if self.user else "Anonymous",
            "department_code": self.user.department.code if self.user and self.user.department else None,
            "rating": self.rating,
            "comment": self.comment,
            "submitted_at": self.submitted_at.isoformat() if self.submitted_at else None,
        }


class EventResult(db.Model):
    __tablename__ = "event_results"

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, unique=True)
    summary = db.Column(db.Text, nullable=False)
    _winners = db.Column("winners", db.Text, default="[]")  # JSON list of {position, name, team, department, prize}
    _gallery = db.Column("gallery", db.Text, default="[]")  # JSON list of image URLs
    published_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    published_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    event = db.relationship("Event", back_populates="results")
    publisher = db.relationship("User")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    @property
    def winners(self):
        if self._winners:
            try:
                return json.loads(self._winners)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    @winners.setter
    def winners(self, value):
        if isinstance(value, list):
            self._winners = json.dumps(value)
        else:
            self._winners = json.dumps([])

    @property
    def gallery(self):
        if self._gallery:
            try:
                return json.loads(self._gallery)
            except (json.JSONDecodeError, TypeError):
                return []
        return []

    @gallery.setter
    def gallery(self, value):
        if isinstance(value, list):
            self._gallery = json.dumps(value)
        else:
            self._gallery = json.dumps([])

    def to_dict(self):
        return {
            "id": self.id,
            "event_id": self.event_id,
            "summary": self.summary,
            "winners": self.winners,
            "gallery": self.gallery,
            "publisher_name": self.publisher.full_name if self.publisher else "Coordinator",
            "published_at": self.published_at.isoformat() if self.published_at else None,
        }
