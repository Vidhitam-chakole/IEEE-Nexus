from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Guide, Team, TeamMember, ProgressLog, Allocation
from backend.schemas import LogCreate, LogReviewRequest, LogOut
from backend.auth import get_current_user, require_role

router = APIRouter(prefix="/logs", tags=["Weekly Progress Logs"])

@router.post("", response_model=LogOut)
def submit_weekly_log(
    payload: LogCreate,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="You must belong to a team to submit a weekly log.")

    # Check if a log already exists for this week
    existing_log = db.query(ProgressLog).filter(
        ProgressLog.team_id == membership.team_id,
        ProgressLog.week_number == payload.week_number
    ).first()

    if existing_log:
        if existing_log.status == "approved":
            raise HTTPException(
                status_code=400,
                detail=f"Week {payload.week_number} log has already been approved by your guide and cannot be modified."
            )
        # Update existing log
        existing_log.work_done = payload.work_done
        existing_log.planned_next = payload.planned_next
        existing_log.blockers = payload.blockers
        existing_log.status = "submitted"
        db.commit()
        db.refresh(existing_log)
        return {
            "id": existing_log.id,
            "team_id": existing_log.team_id,
            "student_id": existing_log.student_id,
            "student_name": current_user.full_name,
            "week_number": existing_log.week_number,
            "work_done": existing_log.work_done,
            "planned_next": existing_log.planned_next,
            "blockers": existing_log.blockers,
            "status": existing_log.status,
            "guide_feedback": existing_log.guide_feedback,
            "reviewed_at": existing_log.reviewed_at,
            "created_at": existing_log.created_at
        }

    new_log = ProgressLog(
        team_id=membership.team_id,
        student_id=current_user.id,
        week_number=payload.week_number,
        work_done=payload.work_done,
        planned_next=payload.planned_next,
        blockers=payload.blockers,
        status="submitted"
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return {
        "id": new_log.id,
        "team_id": new_log.team_id,
        "student_id": new_log.student_id,
        "student_name": current_user.full_name,
        "week_number": new_log.week_number,
        "work_done": new_log.work_done,
        "planned_next": new_log.planned_next,
        "blockers": new_log.blockers,
        "status": new_log.status,
        "guide_feedback": new_log.guide_feedback,
        "reviewed_at": new_log.reviewed_at,
        "created_at": new_log.created_at
    }

@router.get("/team/{team_id}", response_model=List[LogOut])
def get_team_logs(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(ProgressLog).filter(ProgressLog.team_id == team_id).order_by(ProgressLog.week_number).all()
    results = []
    for l in logs:
        student = db.query(User).filter(User.id == l.student_id).first()
        results.append({
            "id": l.id,
            "team_id": l.team_id,
            "student_id": l.student_id,
            "student_name": student.full_name if student else "Student",
            "week_number": l.week_number,
            "work_done": l.work_done,
            "planned_next": l.planned_next,
            "blockers": l.blockers,
            "status": l.status,
            "guide_feedback": l.guide_feedback,
            "reviewed_at": l.reviewed_at,
            "created_at": l.created_at
        })
    return results

@router.put("/{log_id}/review")
def review_weekly_log(
    log_id: str,
    payload: LogReviewRequest,
    current_user: User = Depends(require_role(["guide", "coordinator"])),
    db: Session = Depends(get_db)
):
    log = db.query(ProgressLog).filter(ProgressLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found.")

    # If guide, verify guide is allocated to this team
    if current_user.role == "guide":
        guide = db.query(Guide).filter(Guide.user_id == current_user.id).first()
        alloc = db.query(Allocation).filter(Allocation.team_id == log.team_id).first()
        if not alloc or alloc.guide_id != guide.id:
            raise HTTPException(status_code=403, detail="You are not the designated supervisor for this team.")

    log.status = payload.status
    log.guide_feedback = payload.guide_feedback
    log.reviewed_at = datetime.utcnow()
    db.commit()

    return {"message": f"Log status updated to '{payload.status}'.", "log_id": log.id}
