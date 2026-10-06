from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Team, TeamMember, FinalSubmission, Document
from backend.schemas import (
    FinalSubmissionCreate, FinalSubmissionStatusUpdate, FinalSubmissionOut
)
from backend.auth import get_current_user, require_role

router = APIRouter(prefix="/submissions", tags=["Final Capstone Submissions"])

@router.post("", response_model=FinalSubmissionOut)
def create_final_submission(
    payload: FinalSubmissionCreate,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=400, detail="You do not belong to a team.")

    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.lead_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the team lead can submit the final capstone record.")

    # Validate report doc exists
    report = db.query(Document).filter(
        Document.id == payload.report_doc_id,
        Document.team_id == team.id
    ).first()
    if not report:
        raise HTTPException(status_code=400, detail="Invalid final report document ID.")

    existing_sub = db.query(FinalSubmission).filter(
        FinalSubmission.team_id == team.id,
        FinalSubmission.semester == payload.semester
    ).first()

    if existing_sub:
        existing_sub.report_doc_id = payload.report_doc_id
        existing_sub.presentation_doc_id = payload.presentation_doc_id
        existing_sub.git_repo_url = payload.git_repo_url.strip()
        existing_sub.demo_url = payload.demo_url.strip() if payload.demo_url else None
        existing_sub.status = "submitted"
        existing_sub.submitted_at = datetime.utcnow()
        db.commit()
        db.refresh(existing_sub)
        return {
            "id": existing_sub.id,
            "team_id": existing_sub.team_id,
            "team_name": team.name,
            "semester": existing_sub.semester,
            "report_doc_id": existing_sub.report_doc_id,
            "presentation_doc_id": existing_sub.presentation_doc_id,
            "git_repo_url": existing_sub.git_repo_url,
            "demo_url": existing_sub.demo_url,
            "status": existing_sub.status,
            "coordinator_feedback": existing_sub.coordinator_feedback,
            "submitted_at": existing_sub.submitted_at
        }

    new_sub = FinalSubmission(
        team_id=team.id,
        semester=payload.semester,
        report_doc_id=payload.report_doc_id,
        presentation_doc_id=payload.presentation_doc_id,
        git_repo_url=payload.git_repo_url.strip(),
        demo_url=payload.demo_url.strip() if payload.demo_url else None,
        status="submitted",
        submitted_at=datetime.utcnow()
    )
    db.add(new_sub)
    db.commit()
    db.refresh(new_sub)

    return {
        "id": new_sub.id,
        "team_id": new_sub.team_id,
        "team_name": team.name,
        "semester": new_sub.semester,
        "report_doc_id": new_sub.report_doc_id,
        "presentation_doc_id": new_sub.presentation_doc_id,
        "git_repo_url": new_sub.git_repo_url,
        "demo_url": new_sub.demo_url,
        "status": new_sub.status,
        "coordinator_feedback": new_sub.coordinator_feedback,
        "submitted_at": new_sub.submitted_at
    }

@router.get("/team/{team_id}", response_model=FinalSubmissionOut)
def get_team_final_submission(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    sub = db.query(FinalSubmission).filter(FinalSubmission.team_id == team_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="No final submission record found for this team.")
    team = db.query(Team).filter(Team.id == sub.team_id).first()
    return {
        "id": sub.id,
        "team_id": sub.team_id,
        "team_name": team.name if team else "Team",
        "semester": sub.semester,
        "report_doc_id": sub.report_doc_id,
        "presentation_doc_id": sub.presentation_doc_id,
        "git_repo_url": sub.git_repo_url,
        "demo_url": sub.demo_url,
        "status": sub.status,
        "coordinator_feedback": sub.coordinator_feedback,
        "submitted_at": sub.submitted_at
    }

@router.put("/{sub_id}/status")
def update_final_submission_status(
    sub_id: str,
    payload: FinalSubmissionStatusUpdate,
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    sub = db.query(FinalSubmission).filter(FinalSubmission.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found.")
    sub.status = payload.status
    sub.coordinator_feedback = payload.coordinator_feedback
    db.commit()
    return {"message": f"Final submission status updated to '{payload.status}'.", "sub_id": sub.id}
