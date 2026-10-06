import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Team, TeamMember, Document
from backend.schemas import DocumentOut
from backend.auth import get_current_user, require_role

router = APIRouter(prefix="/documents", tags=["Documents & Uploads"])

UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".pptx", ".zip"}

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    team_id: str = Form(...),
    doc_type: str = Form(...),
    review_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    # Verify student is in this team
    membership = db.query(TeamMember).filter(
        TeamMember.team_id == team_id,
        TeamMember.student_id == current_user.id
    ).first()
    if not membership:
        raise HTTPException(status_code=403, detail="You do not belong to this team.")

    if doc_type not in ["synopsis", "srs", "report", "presentation", "code_zip", "internship_offer"]:
        raise HTTPException(status_code=400, detail="Invalid document type.")

    # Extension validation
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read content to verify size
    content = await file.read()
    file_size = len(content)
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowable limit of 20MB.")

    # Version tracking: count existing documents for this team and doc_type
    version_count = db.query(Document).filter(
        Document.team_id == team_id,
        Document.doc_type == doc_type
    ).count()
    new_version = version_count + 1

    # Prepare storage directory
    team_upload_dir = os.path.join(UPLOAD_ROOT, team_id)
    os.makedirs(team_upload_dir, exist_ok=True)

    safe_name = f"{doc_type}_v{new_version}_{uuid.uuid4().hex[:8]}{ext}"
    dest_path = os.path.join(team_upload_dir, safe_name)

    with open(dest_path, "wb") as f:
        f.write(content)

    relative_path = os.path.join("uploads", team_id, safe_name)

    doc = Document(
        team_id=team_id,
        review_id=review_id if review_id else None,
        doc_type=doc_type,
        file_path=relative_path,
        original_filename=filename,
        file_size_bytes=file_size,
        mime_type=file.content_type or "application/octet-stream",
        version=new_version,
        uploaded_by=current_user.id,
        uploaded_at=datetime.utcnow()
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    return {
        "id": doc.id,
        "team_id": doc.team_id,
        "review_id": doc.review_id,
        "doc_type": doc.doc_type,
        "file_path": doc.file_path,
        "original_filename": doc.original_filename,
        "file_size_bytes": doc.file_size_bytes,
        "mime_type": doc.mime_type,
        "version": doc.version,
        "uploaded_by": doc.uploaded_by,
        "uploader_name": current_user.full_name,
        "uploaded_at": doc.uploaded_at
    }

@router.get("/team/{team_id}", response_model=List[DocumentOut])
def get_team_documents(
    team_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    docs = db.query(Document).filter(Document.team_id == team_id).order_by(Document.uploaded_at.desc()).all()
    results = []
    for d in docs:
        uploader = db.query(User).filter(User.id == d.uploaded_by).first()
        results.append({
            "id": d.id,
            "team_id": d.team_id,
            "review_id": d.review_id,
            "doc_type": d.doc_type,
            "file_path": d.file_path,
            "original_filename": d.original_filename,
            "file_size_bytes": d.file_size_bytes,
            "mime_type": d.mime_type,
            "version": d.version,
            "uploaded_by": d.uploaded_by,
            "uploader_name": uploader.full_name if uploader else "Student",
            "uploaded_at": d.uploaded_at
        })
    return results

@router.get("/download/{doc_id}")
def download_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    full_path = os.path.join(base_dir, doc.file_path)

    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found on storage disk.")

    return FileResponse(
        path=full_path,
        filename=doc.original_filename,
        media_type=doc.mime_type
    )

@router.post("/similarity-stub/{doc_id}")
def check_document_similarity(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Stretch 5: Mock similarity check
    return {
        "doc_id": doc.id,
        "original_filename": doc.original_filename,
        "similarity_score_pct": 11.8,
        "status": "passed",
        "threshold_pct": 20.0,
        "flag": "green",
        "message": "Originality check completed: No significant similarity detected."
    }
