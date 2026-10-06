import string
import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Guide, Team, TeamMember, GuidePreference, Allocation
from backend.schemas import (
    TeamCreate, TeamJoin, TeamOut, TeamMemberOut,
    PreferenceSubmitRequest, PreferenceOut, GuideOut
)
from backend.auth import get_current_user, require_role

router = APIRouter(prefix="/teams", tags=["Teams"])

def generate_team_code(db: Session) -> str:
    chars = string.ascii_uppercase + string.digits
    for _ in range(20):
        code = "".join(random.choices(chars, k=6))
        if not db.query(Team).filter(Team.code == code).first():
            return code
    raise HTTPException(status_code=500, detail="Could not generate unique team code.")

@router.post("", response_model=TeamOut)
def create_team(
    payload: TeamCreate,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    # Rule: One team per student
    existing_membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of a team. A student can only belong to one team."
        )

    code = generate_team_code(db)
    new_team = Team(
        code=code,
        name=payload.name.strip(),
        project_title=payload.project_title.strip(),
        lead_id=current_user.id,
        is_locked=False,
        avg_cgpa=current_user.cgpa or 0.0
    )
    db.add(new_team)
    db.flush()

    # Add creator as first team member
    member = TeamMember(team_id=new_team.id, student_id=current_user.id)
    db.add(member)
    db.commit()

    return get_team_details(new_team.id, db)

@router.post("/join", response_model=TeamOut)
def join_team(
    payload: TeamJoin,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    # Rule: One team per student
    existing_membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
    if existing_membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already in a team. Leave your current team before joining another."
        )

    team = db.query(Team).filter(Team.code == payload.code.strip().upper()).first()
    if not team:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid team code. Team not found.")

    if team.is_locked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This team has already been locked by the team lead and cannot accept new members."
        )

    current_member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if current_member_count >= 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team has reached the maximum capacity of 4 members."
        )

    member = TeamMember(team_id=team.id, student_id=current_user.id)
    db.add(member)
    db.commit()

    return get_team_details(team.id, db)

@router.get("/my-team", response_model=TeamOut)
def get_my_team(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="You have not joined or formed a team yet.")
    return get_team_details(membership.team_id, db)

@router.post("/my-team/lock")
def lock_team(
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No team found.")

    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.lead_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the team lead can lock the team.")

    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    if len(members) < 2 or len(members) > 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Team size must be between 2 and 4 members to lock. Current members: {len(members)}."
        )

    # Calculate average CGPA
    student_ids = [m.student_id for m in members]
    students = db.query(User).filter(User.id.in_(student_ids)).all()
    valid_cgpas = [s.cgpa for s in students if s.cgpa is not None]
    team.avg_cgpa = round(sum(valid_cgpas) / len(valid_cgpas), 2) if valid_cgpas else 0.0
    team.is_locked = True
    db.commit()

    return {"message": "Team locked successfully. You may now submit your guide preferences.", "avg_cgpa": team.avg_cgpa}

@router.post("/my-team/preferences")
def submit_preferences(
    payload: PreferenceSubmitRequest,
    current_user: User = Depends(require_role(["student"])),
    db: Session = Depends(get_db)
):
    membership = db.query(TeamMember).filter(TeamMember.student_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No team found.")

    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if team.lead_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the team lead can submit guide preferences.")

    if not team.is_locked:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You must lock the team before submitting preferences.")

    if len(payload.preferences) != 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You must submit exactly 3 ranked guide preferences.")

    ranks = [p.rank for p in payload.preferences]
    guide_ids = [p.guide_id for p in payload.preferences]

    if sorted(ranks) != [1, 2, 3]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Preferences must contain distinct ranks 1, 2, and 3.")

    if len(set(guide_ids)) != 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot select the same guide more than once.")

    # Validate guides exist
    existing_guides_count = db.query(Guide).filter(Guide.id.in_(guide_ids)).count()
    if existing_guides_count != 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="One or more selected guides are invalid.")

    # Clear previous preferences if any
    db.query(GuidePreference).filter(GuidePreference.team_id == team.id).delete()

    for p in payload.preferences:
        pref = GuidePreference(
            team_id=team.id,
            guide_id=p.guide_id,
            rank=p.rank
        )
        db.add(pref)

    team.preference_submitted_at = datetime.utcnow()
    db.commit()

    return {"message": "Preferences submitted successfully.", "preferences": payload.preferences}

@router.get("/guides-list", response_model=list[GuideOut])
def get_all_guides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    guides = db.query(Guide).join(User, Guide.user_id == User.id).all()
    results = []
    for g in guides:
        current_load = db.query(Allocation).filter(Allocation.guide_id == g.id).count()
        results.append({
            "id": g.id,
            "user_id": g.user_id,
            "full_name": g.user.full_name,
            "email": g.user.email,
            "department": g.user.department,
            "specialisations": g.specialisations or [],
            "max_teams": g.max_teams,
            "current_load": current_load
        })
    return results

def get_team_details(team_id: str, db: Session) -> dict:
    team = db.query(Team).filter(Team.id == team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    members = db.query(TeamMember).filter(TeamMember.team_id == team.id).all()
    member_outs = []
    for m in members:
        user = db.query(User).filter(User.id == m.student_id).first()
        if user:
            member_outs.append({
                "id": m.id,
                "student_id": user.id,
                "full_name": user.full_name,
                "email": user.email,
                "cgpa": user.cgpa,
                "joined_at": m.joined_at
            })

    prefs = db.query(GuidePreference).filter(GuidePreference.team_id == team.id).order_by(GuidePreference.rank).all()
    pref_outs = []
    for p in prefs:
        g = db.query(Guide).filter(Guide.id == p.guide_id).first()
        g_name = g.user.full_name if g and g.user else "Unknown Guide"
        g_specs = g.specialisations if g else []
        pref_outs.append({
            "id": p.id,
            "guide_id": p.guide_id,
            "guide_name": g_name,
            "specialisations": g_specs,
            "rank": p.rank
        })

    alloc = db.query(Allocation).filter(Allocation.team_id == team.id).first()
    alloc_out = None
    if alloc:
        g = db.query(Guide).filter(Guide.id == alloc.guide_id).first()
        g_name = g.user.full_name if g and g.user else "Unknown Guide"
        alloc_out = {
            "id": alloc.id,
            "team_id": alloc.team_id,
            "team_name": team.name,
            "guide_id": alloc.guide_id,
            "guide_name": g_name,
            "allocated_rank": alloc.allocated_rank,
            "is_manual_override": alloc.is_manual_override,
            "allocated_at": alloc.allocated_at
        }

    return {
        "id": team.id,
        "code": team.code,
        "name": team.name,
        "project_title": team.project_title,
        "lead_id": team.lead_id,
        "is_locked": team.is_locked,
        "avg_cgpa": team.avg_cgpa,
        "members": member_outs,
        "preferences": pref_outs,
        "allocation": alloc_out,
        "created_at": team.created_at
    }
