from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel, Field

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    department: str
    cgpa: Optional[float] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class RegisterStudentRequest(BaseModel):
    email: str
    password: str
    full_name: str
    department: str = "Computer Science & Engineering"
    cgpa: float = Field(ge=0.0, le=10.0)

# --- GUIDE SCHEMAS ---
class GuideOut(BaseModel):
    id: str
    user_id: str
    full_name: str
    email: str
    department: str
    specialisations: List[str]
    max_teams: int
    current_load: int = 0

    class Config:
        from_attributes = True

class GuideCapacityUpdate(BaseModel):
    max_teams: int = Field(ge=1, le=10)

# --- TEAM SCHEMAS ---
class TeamMemberOut(BaseModel):
    id: str
    student_id: str
    full_name: str
    email: str
    cgpa: Optional[float] = None
    joined_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PreferenceItem(BaseModel):
    guide_id: str
    rank: int = Field(ge=1, le=3)

class PreferenceSubmitRequest(BaseModel):
    preferences: List[PreferenceItem]

class PreferenceOut(BaseModel):
    id: str
    guide_id: str
    guide_name: Optional[str] = None
    specialisations: Optional[List[str]] = None
    rank: int

    class Config:
        from_attributes = True

class AllocationOut(BaseModel):
    id: str
    team_id: str
    team_name: Optional[str] = None
    guide_id: str
    guide_name: Optional[str] = None
    allocated_rank: Optional[int] = None
    is_manual_override: bool
    allocated_at: datetime

    class Config:
        from_attributes = True

class TeamCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    project_title: str = Field(min_length=5, max_length=255)

class TeamJoin(BaseModel):
    code: str = Field(min_length=6, max_length=6)

class TeamOut(BaseModel):
    id: str
    code: str
    name: str
    project_title: str
    lead_id: str
    is_locked: bool
    avg_cgpa: float
    members: List[TeamMemberOut] = []
    preferences: List[PreferenceOut] = []
    allocation: Optional[AllocationOut] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- ALLOCATION ENGINE SCHEMAS ---
class AllocationSummary(BaseModel):
    total_teams: int
    allocated_count: int
    allocated_1st: int
    allocated_2nd: int
    allocated_3rd: int
    unallocated_count: int
    satisfaction_pct: float
    guide_loads: List[Dict[str, Any]]
    unallocated_teams: List[Dict[str, Any]]

class AllocationRunResponse(BaseModel):
    summary: AllocationSummary
    allocations: List[AllocationOut]

class AllocationOverrideRequest(BaseModel):
    team_id: str
    guide_id: str
    reason: Optional[str] = "Coordinator manual assignment"

# --- REVIEW & SCHEDULER SCHEMAS ---
class ReviewCreate(BaseModel):
    title: str
    phase: int = Field(ge=1, le=3)
    start_date: str
    end_date: str
    slot_duration_mins: int = 30

class ReviewOut(BaseModel):
    id: str
    title: str
    phase: int
    start_date: str
    end_date: str
    slot_duration_mins: int
    is_active: bool
    total_slots: int = 0

    class Config:
        from_attributes = True

class ReviewSlotOut(BaseModel):
    id: str
    review_id: str
    team_id: str
    team_name: str
    guide_name: Optional[str] = None
    panel_user_id: str
    panel_name: str
    room_or_link: str
    start_time: datetime
    end_time: datetime
    status: str

    class Config:
        from_attributes = True

class AutoScheduleRequest(BaseModel):
    daily_start_time: str = "09:00"
    daily_end_time: str = "17:00"
    room_prefix: str = "Lab 40"

class RescheduleSlotRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    panel_user_id: Optional[str] = None
    room_or_link: Optional[str] = None

# --- PROGRESS LOG SCHEMAS ---
class LogCreate(BaseModel):
    week_number: int = Field(ge=1, le=16)
    work_done: str = Field(min_length=10)
    planned_next: str = Field(min_length=5)
    blockers: Optional[str] = None

class LogReviewRequest(BaseModel):
    status: str = Field(pattern="^(approved|needs_changes)$")
    guide_feedback: str = Field(min_length=3)

class LogOut(BaseModel):
    id: str
    team_id: str
    student_id: str
    student_name: Optional[str] = None
    week_number: int
    work_done: str
    planned_next: str
    blockers: Optional[str] = None
    status: str
    guide_feedback: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- DOCUMENT SCHEMAS ---
class DocumentOut(BaseModel):
    id: str
    team_id: str
    review_id: Optional[str] = None
    doc_type: str
    file_path: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    version: int
    uploaded_by: str
    uploader_name: Optional[str] = None
    uploaded_at: datetime

    class Config:
        from_attributes = True

# --- FINAL SUBMISSION SCHEMAS ---
class FinalSubmissionCreate(BaseModel):
    semester: str
    report_doc_id: str
    presentation_doc_id: Optional[str] = None
    git_repo_url: str
    demo_url: Optional[str] = None

class FinalSubmissionStatusUpdate(BaseModel):
    status: str = Field(pattern="^(draft|submitted|accepted)$")
    coordinator_feedback: Optional[str] = None

class FinalSubmissionOut(BaseModel):
    id: str
    team_id: str
    team_name: Optional[str] = None
    semester: str
    report_doc_id: str
    presentation_doc_id: Optional[str] = None
    git_repo_url: str
    demo_url: Optional[str] = None
    status: str
    coordinator_feedback: Optional[str] = None
    submitted_at: datetime

    class Config:
        from_attributes = True

# --- COORDINATOR DASHBOARD SCHEMAS ---
class FallingBehindTeam(BaseModel):
    team_id: str
    team_name: str
    guide_name: Optional[str] = None
    last_log_date: Optional[str] = None
    days_overdue: int

class HeatmapRow(BaseModel):
    team_id: str
    team_name: str
    guide_name: Optional[str] = None
    weeks: Dict[int, str]  # week_num -> 'approved' | 'submitted' | 'missing'

class CoordinatorDashboardOut(BaseModel):
    total_teams: int
    unallocated_teams: int
    guides_at_capacity: int
    upcoming_reviews_count: int
    falling_behind_teams: List[FallingBehindTeam]
    guide_loads: List[Dict[str, Any]]
