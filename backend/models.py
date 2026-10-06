import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey,
    UniqueConstraint, JSON
)
from sqlalchemy.orm import relationship
from backend.database import Base

def gen_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    role = Column(String(20), nullable=False, index=True)  # student, guide, coordinator, panel
    department = Column(String(100), nullable=False)
    cgpa = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    guide_profile = relationship("Guide", back_populates="user", uselist=False, cascade="all, delete-orphan")
    team_member = relationship("TeamMember", back_populates="student", uselist=False, cascade="all, delete-orphan")
    led_teams = relationship("Team", back_populates="lead")
    progress_logs = relationship("ProgressLog", back_populates="student")
    documents = relationship("Document", back_populates="uploader")
    assigned_slots = relationship("ReviewSlot", back_populates="panel_user")
    internship_requests = relationship("InternshipRequest", back_populates="student")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class Guide(Base):
    __tablename__ = "guides"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialisations = Column(JSON, default=list)  # list of string tags
    max_teams = Column(Integer, default=3, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="guide_profile")
    preferences = relationship("GuidePreference", back_populates="guide", cascade="all, delete-orphan")
    allocations = relationship("Allocation", back_populates="guide")


class Team(Base):
    __tablename__ = "teams"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    code = Column(String(6), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    project_title = Column(String(255), nullable=False)
    lead_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    avg_cgpa = Column(Float, default=0.0)
    preference_submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    lead = relationship("User", back_populates="led_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    preferences = relationship("GuidePreference", back_populates="team", cascade="all, delete-orphan")
    allocation = relationship("Allocation", back_populates="team", uselist=False, cascade="all, delete-orphan")
    logs = relationship("ProgressLog", back_populates="team", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="team", cascade="all, delete-orphan")
    slots = relationship("ReviewSlot", back_populates="team", cascade="all, delete-orphan")
    final_submission = relationship("FinalSubmission", back_populates="team", uselist=False, cascade="all, delete-orphan")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    joined_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="members")
    student = relationship("User", back_populates="team_member")


class GuidePreference(Base):
    __tablename__ = "guide_preferences"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    guide_id = Column(String(36), ForeignKey("guides.id", ondelete="CASCADE"), nullable=False)
    rank = Column(Integer, nullable=False)  # 1, 2, or 3
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("team_id", "rank", name="uq_team_rank"),
        UniqueConstraint("team_id", "guide_id", name="uq_team_guide"),
    )

    team = relationship("Team", back_populates="preferences")
    guide = relationship("Guide", back_populates="preferences")


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), unique=True, nullable=False)
    guide_id = Column(String(36), ForeignKey("guides.id"), nullable=False)
    allocated_rank = Column(Integer, nullable=True)  # 1, 2, 3 or None
    is_manual_override = Column(Boolean, default=False, nullable=False)
    allocated_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="allocation")
    guide = relationship("Guide", back_populates="allocations")


class Review(Base):
    __tablename__ = "reviews"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    title = Column(String(100), nullable=False)
    phase = Column(Integer, nullable=False)  # 1, 2, 3
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    slot_duration_mins = Column(Integer, default=30, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    slots = relationship("ReviewSlot", back_populates="review", cascade="all, delete-orphan")


class ReviewSlot(Base):
    __tablename__ = "review_slots"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    panel_user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    room_or_link = Column(String(100), default="Lab 402", nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    status = Column(String(20), default="scheduled", nullable=False)  # scheduled, completed, rescheduled

    review = relationship("Review", back_populates="slots")
    team = relationship("Team", back_populates="slots")
    panel_user = relationship("User", back_populates="assigned_slots")


class ProgressLog(Base):
    __tablename__ = "progress_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    week_number = Column(Integer, nullable=False)  # 1..16
    work_done = Column(Text, nullable=False)
    planned_next = Column(Text, nullable=False)
    blockers = Column(Text, nullable=True)
    status = Column(String(20), default="submitted", nullable=False)  # submitted, approved, needs_changes
    guide_feedback = Column(Text, nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("team_id", "week_number", name="uq_team_week"),
    )

    team = relationship("Team", back_populates="logs")
    student = relationship("User", back_populates="progress_logs")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    review_id = Column(String(36), ForeignKey("reviews.id", ondelete="SET NULL"), nullable=True)
    doc_type = Column(String(30), nullable=False)  # synopsis, srs, report, presentation, code_zip, internship_offer
    file_path = Column(String(500), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size_bytes = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    version = Column(Integer, default=1, nullable=False)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow)

    team = relationship("Team", back_populates="documents")
    uploader = relationship("User", back_populates="documents")


class FinalSubmission(Base):
    __tablename__ = "final_submissions"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    team_id = Column(String(36), ForeignKey("teams.id", ondelete="CASCADE"), nullable=False)
    semester = Column(String(20), nullable=False)
    report_doc_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    presentation_doc_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    git_repo_url = Column(String(500), nullable=False)
    demo_url = Column(String(500), nullable=True)
    status = Column(String(20), default="draft", nullable=False)  # draft, submitted, accepted
    coordinator_feedback = Column(Text, nullable=True)
    submitted_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("team_id", "semester", name="uq_team_semester"),
    )

    team = relationship("Team", back_populates="final_submission")


class InternshipRequest(Base):
    __tablename__ = "internship_requests"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    company_name = Column(String(150), nullable=False)
    role_title = Column(String(150), nullable=False)
    start_date = Column(String(20), nullable=False)
    end_date = Column(String(20), nullable=False)
    offer_doc_id = Column(String(36), ForeignKey("documents.id"), nullable=False)
    guide_status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    coordinator_status = Column(String(20), default="pending", nullable=False)  # pending, approved, rejected
    guide_comment = Column(Text, nullable=True)
    coordinator_comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("User", back_populates="internship_requests")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(120), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="info", nullable=False)  # info, warning, deadline, success
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")
