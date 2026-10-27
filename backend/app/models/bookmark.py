from datetime import datetime, timezone
from app import db


class Bookmark(db.Model):
    __tablename__ = "bookmarks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_id = db.Column(db.Integer, db.ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        db.UniqueConstraint("user_id", "event_id", name="uq_user_event_bookmark"),
    )

    user = db.relationship("User", back_populates="bookmarks")
    event = db.relationship("Event")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def to_dict(self):

        return {
            "id": self.id,
            "user_id": self.user_id,
            "event_id": self.event_id,
            "event": self.event.to_dict() if self.event else None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
