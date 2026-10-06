from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Guide, TeamMember, Allocation, InternshipRequest, Document
from backend.auth import get_current_user, require_role

router = APIRouter(prefix="/internships", tags=["Internship Approval Workflow"])

class InternshipCreate(BaseModel):
    company_name: str
    role_title: str
    start_date: str
    end_date: str
    offer_doc_id: str

class InternshipReview(BaseModel):
    status: str = Field(pattern="^(approved|rejected)$")
    comment: Optional[str] = None

@router.post("")
def submit_internship_request(
    payload: InternshipCreate,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == payload.offer_doc_id).first()
    if not doc:
        raise HTTPException(status_code=400, detail="Invalid offer letter document.")

    req = InternshipRequest(
        student_id=current_user.id,
        company_name=payload.company_name.strip(),
        role_title=payload.role_title.strip(),
        start_date=payload.start_date,
        end_date=payload.end_date,
        offer_doc_id=payload.offer_doc_id,
        guide_status="pending",
        coordinator_status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"message": "Internship approval request submitted.", "id": req.id}

@router.get("/my-requests")
def get_my_internship_requests(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    reqs = db.query(InternshipRequest).filter(InternshipRequest.student_id == current_user.id).all()
    results = []
    for r in reqs:
        doc = db.query(Document).filter(Document.id == r.offer_doc_id).first()
        results.append({
            "id": r.id,
            "company_name": r.company_name,
            "role_title": r.role_title,
            "start_date": r.start_date,
            "end_date": r.end_date,
            "offer_filename": doc.original_filename if doc else "OfferLetter.pdf",
            "guide_status": r.guide_status,
            "coordinator_status": r.coordinator_status,
            "guide_comment": r.guide_comment,
            "coordinator_comment": r.coordinator_comment,
            "created_at": r.created_at
        })
    return results

@router.get("/all")
def get_all_internship_requests(
    current_user: User = Depends(require_role(["coordinator", "guide"])),
    db: Session = Depends(get_db)
):
    reqs = db.query(InternshipRequest).order_by(InternshipRequest.created_at.desc()).all()
    results = []
    for r in reqs:
        student = db.query(User).filter(User.id == r.student_id).first()
        doc = db.query(Document).filter(Document.id == r.offer_doc_id).first()
        results.append({
            "id": r.id,
            "student_id": r.student_id,
            "student_name": student.full_name if student else "Student",
            "department": student.department if student else "",
            "company_name": r.company_name,
            "role_title": r.role_title,
            "start_date": r.start_date,
            "end_date": r.end_date,
            "offer_doc_id": r.offer_doc_id,
            "offer_filename": doc.original_filename if doc else "OfferLetter.pdf",
            "guide_status": r.guide_status,
            "coordinator_status": r.coordinator_status,
            "guide_comment": r.guide_comment,
            "coordinator_comment": r.coordinator_comment,
            "created_at": r.created_at
        })
    return results

@router.put("/{req_id}/guide-review")
def review_by_guide(
    req_id: str,
    payload: InternshipReview,
    current_user: User = Depends(require_role(["guide"])),
    db: Session = Depends(get_db)
):
    req = db.query(InternshipRequest).filter(InternshipRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    req.guide_status = payload.status
    req.guide_comment = payload.comment
    db.commit()
    return {"message": f"Guide reviewed: {payload.status}", "id": req.id}

@router.put("/{req_id}/coordinator-review")
def review_by_coordinator(
    req_id: str,
    payload: InternshipReview,
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    req = db.query(InternshipRequest).filter(InternshipRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found.")
    req.coordinator_status = payload.status
    req.coordinator_comment = payload.comment
    db.commit()
    return {"message": f"Coordinator reviewed: {payload.status}", "id": req.id}
