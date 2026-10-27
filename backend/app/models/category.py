from app import db


class EventCategory(db.Model):
    __tablename__ = "event_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False, unique=True, index=True)
    code = db.Column(db.String(40), nullable=False, unique=True, index=True)
    description = db.Column(db.Text, nullable=True)
    icon = db.Column(db.String(50), default="Calendar")
    color = db.Column(db.String(30), default="#3b82f6")  # HEX color or tailwind class
    is_active = db.Column(db.Boolean, default=True)

    # Relationship
    events = db.relationship("Event", back_populates="category")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)


    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "code": self.code,
            "description": self.description,
            "icon": self.icon,
            "color": self.color,
            "is_active": self.is_active,
            "events_count": len(self.events) if self.events else 0,
        }
