from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Guide, TeamMember, Team
from backend.schemas import LoginRequest, TokenResponse, UserOut, RegisterStudentRequest
from backend.auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.id, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me")
def get_current_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    res = {
        "user": UserOut.model_validate(current_user),
        "team": None,
        "guide_profile": None
    }
    if current_user.role == "student":
        membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
        if membership:
            team = db.query(Team).filter(Team.id == membership.team_id).first()
            if team:
                res["team"] = {
                    "id": team.id,
                    "code": team.code,
                    "name": team.name,
                    "project_title": team.project_title,
                    "is_lead": team.lead_id == current_user.id,
                    "is_locked": team.is_locked,
                    "avg_cgpa": team.avg_cgpa
                }
    elif current_user.role == "guide":
        guide = db.query(Guide).filter(Guide.user_id == current_user.id).first()
        if guide:
            res["guide_profile"] = {
                "id": guide.id,
                "specialisations": guide.specialisations,
                "max_teams": guide.max_teams
            }
    return res

@router.post("/register-student", response_model=UserOut)
def register_student(payload: RegisterStudentRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists."
        )

    new_user = User(
        email=payload.email.strip().lower(),
        password_hash=get_password_hash(payload.password),
        full_name=payload.full_name.strip(),
        role="student",
        department=payload.department,
        cgpa=payload.cgpa
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
