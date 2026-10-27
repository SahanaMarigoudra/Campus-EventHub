import json
from datetime import datetime, timezone
from app import db


class Event(db.Model):
    __tablename__ = "events"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    poster_url = db.Column(db.String(255), nullable=True)

    # Classification
    category_id = db.Column(db.Integer, db.ForeignKey("event_categories.id", ondelete="SET NULL"), nullable=True, index=True)
    subcategory = db.Column(db.String(100), nullable=True)

    # Department Ownership & Participation
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True)
    _participating_departments = db.Column("participating_departments", db.Text, default='["ALL"]')

    # Personnel
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    event_coordinator = db.Column(db.String(120), nullable=True)
    faculty_incharge = db.Column(db.String(120), nullable=True)
    contact_info = db.Column(db.String(200), nullable=True)

    # Schedule & Location
    event_date = db.Column(db.DateTime, nullable=False, index=True)
    start_time = db.Column(db.String(20), nullable=True, default="10:00 AM")
    end_time = db.Column(db.String(20), nullable=True, default="04:00 PM")
    registration_start = db.Column(db.DateTime, nullable=True)
    registration_deadline = db.Column(db.DateTime, nullable=True, index=True)
    venue = db.Column(db.String(200), nullable=False)
    event_mode = db.Column(db.String(30), default="Offline")  # Offline, Online, Hybrid

    # Capacity & Fees
    capacity = db.Column(db.Integer, nullable=False, default=100)
    registration_fee = db.Column(db.Float, default=0.0)

    # Team vs Individual
    participation_type = db.Column(db.String(20), default="individual")  # individual, team
    max_team_size = db.Column(db.Integer, default=1)

    # Rules, Eligibility, Rewards
    eligibility_criteria = db.Column(db.String(255), default="All enrolled students")
    _required_programs = db.Column("required_programs", db.Text, default='["ALL"]')
    rules_guidelines = db.Column(db.Text, nullable=True)
    prizes_rewards = db.Column(db.Text, nullable=True)

    # Workflow & Approvals
    status = db.Column(
        db.String(30),
        nullable=False,
        default="published",
        index=True,
    )  # draft, pending_approval, published, ongoing, completed, cancelled

    approval_status = db.Column(
        db.String(30),
        default="approved",
        index=True,
    )  # pending, approved, rejected, changes_requested

    approval_remarks = db.Column(db.Text, nullable=True)
    approved_by_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    approved_at = db.Column(db.DateTime, nullable=True)

    # Metadata
    featured = db.Column(db.Boolean, default=False, index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    department = db.relationship("Department", back_populates="events")
    category = db.relationship("EventCategory", back_populates="events")
    creator = db.relationship("User", foreign_keys=[created_by_id], back_populates="created_events")
    approver = db.relationship("User", foreign_keys=[approved_by_id])
    registrations = db.relationship("Registration", back_populates="event", cascade="all, delete-orphan", lazy="dynamic")
    teams = db.relationship("Team", back_populates="event", cascade="all, delete-orphan")
    attendance_records = db.relationship("Attendance", back_populates="event", cascade="all, delete-orphan")
    certificates = db.relationship("Certificate", back_populates="event", cascade="all, delete-orphan")
    results = db.relationship("EventResult", back_populates="event", uselist=False, cascade="all, delete-orphan")
    feedbacks = db.relationship("EventFeedback", back_populates="event", cascade="all, delete-orphan")

    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    @property

    def participating_departments(self):
        if self._participating_departments:
            try:
                return json.loads(self._participating_departments)
            except (json.JSONDecodeError, TypeError):
                return ["ALL"]
        return ["ALL"]

    @participating_departments.setter
    def participating_departments(self, value):
        if isinstance(value, list):
            self._participating_departments = json.dumps(value)
        else:
            self._participating_departments = json.dumps(["ALL"])

    @property
    def required_programs(self):
        if self._required_programs:
            try:
                return json.loads(self._required_programs)
            except (json.JSONDecodeError, TypeError):
                return ["ALL"]
        return ["ALL"]

    @required_programs.setter
    def required_programs(self, value):
        if isinstance(value, list):
            self._required_programs = json.dumps(value)
        else:
            self._required_programs = json.dumps(["ALL"])

    @property
    def confirmed_count(self):
        return self.registrations.filter_by(status="confirmed").count()

    @property
    def available_seats(self):
        return max(0, self.capacity - self.confirmed_count)

    @property
    def is_full(self):
        return self.available_seats <= 0

    @property
    def is_registration_open(self):
        if self.status != "published":
            return False
        if self.is_full:
            return False
        now = datetime.now(timezone.utc)
        if self.registration_deadline:
            dl = self.registration_deadline
            if dl.tzinfo is None:
                dl = dl.replace(tzinfo=timezone.utc)
            if now > dl:
                return False
        return True

    def to_dict(self, full=False):
        data = {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "poster_url": self.poster_url,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else "General",
            "category_code": self.category.code if self.category else "GENERAL",
            "category_color": self.category.color if self.category else "#3b82f6",
            "category_icon": self.category.icon if self.category else "Calendar",
            "subcategory": self.subcategory,
            "department_id": self.department_id,
            "department_code": self.department.code if self.department else None,
            "department_name": self.department.name if self.department else None,
            "participating_departments": self.participating_departments,
            "event_coordinator": self.event_coordinator,
            "faculty_incharge": self.faculty_incharge,
            "contact_info": self.contact_info,
            "event_date": self.event_date.isoformat() if self.event_date else None,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "registration_start": self.registration_start.isoformat() if self.registration_start else None,
            "registration_deadline": self.registration_deadline.isoformat() if self.registration_deadline else None,
            "venue": self.venue,
            "event_mode": self.event_mode,
            "capacity": self.capacity,
            "confirmed_count": self.confirmed_count,
            "available_seats": self.available_seats,
            "is_full": self.is_full,
            "is_registration_open": self.is_registration_open,
            "registration_fee": self.registration_fee,
            "participation_type": self.participation_type,
            "max_team_size": self.max_team_size,
            "eligibility_criteria": self.eligibility_criteria,
            "required_programs": self.required_programs,
            "rules_guidelines": self.rules_guidelines,
            "prizes_rewards": self.prizes_rewards,
            "status": self.status,
            "approval_status": self.approval_status,
            "approval_remarks": self.approval_remarks,
            "featured": self.featured,
            "has_results": self.results is not None,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        return data
