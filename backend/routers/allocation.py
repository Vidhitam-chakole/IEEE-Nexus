from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import get_db
from backend.models import User, Guide, Team, GuidePreference, Allocation
from backend.schemas import (
    AllocationRunResponse, AllocationSummary, AllocationOut,
    AllocationOverrideRequest
)
from backend.auth import require_role
from backend.allocation import AllocationEngine

router = APIRouter(prefix="/allocation", tags=["Allocation Engine"])

@router.post("/run", response_model=AllocationRunResponse)
def run_allocation(
    priority_mode: str = Query("cgpa", regex="^(cgpa|submission_time)$"),
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    # Fetch all locked teams
    locked_teams = db.query(Team).filter(Team.is_locked == True).all()
    if not locked_teams:
        raise HTTPException(status_code=400, detail="No locked teams found to allocate.")

    # Fetch all guides
    guides = db.query(Guide).join(User, Guide.user_id == User.id).all()
    if not guides:
        raise HTTPException(status_code=400, detail="No guides found in the system.")

    # Fetch existing manual overrides
    existing_allocations = db.query(Allocation).all()

    # Run allocation engine
    result = AllocationEngine.run_allocation(
        teams=locked_teams,
        guides=guides,
        priority_mode=priority_mode,
        existing_allocations=existing_allocations
    )

    # Persist results in DB: delete non-overridden allocations, insert newly calculated ones
    manual_allocs = {a.team_id: a for a in existing_allocations if a.is_manual_override}
    db.query(Allocation).filter(Allocation.is_manual_override == False).delete()
    db.flush()

    saved_allocations = []
    for alloc_item in result["allocations"]:
        t_id = alloc_item["team_id"]
        if t_id in manual_allocs:
            saved_allocations.append(manual_allocs[t_id])
            continue

        new_alloc = Allocation(
            team_id=t_id,
            guide_id=alloc_item["guide_id"],
            allocated_rank=alloc_item["allocated_rank"],
            is_manual_override=False,
            allocated_at=alloc_item["allocated_at"]
        )
        db.add(new_alloc)
        db.flush()
        saved_allocations.append(new_alloc)

    db.commit()

    # Build response format
    allocation_outs = []
    for a in saved_allocations:
        tm = db.query(Team).filter(Team.id == a.team_id).first()
        gd = db.query(Guide).filter(Guide.id == a.guide_id).first()
        allocation_outs.append({
            "id": a.id,
            "team_id": a.team_id,
            "team_name": tm.name if tm else "Unknown Team",
            "guide_id": a.guide_id,
            "guide_name": gd.user.full_name if (gd and gd.user) else "Unknown Guide",
            "allocated_rank": a.allocated_rank,
            "is_manual_override": a.is_manual_override,
            "allocated_at": a.allocated_at
        })

    return {
        "summary": result["summary"],
        "allocations": allocation_outs
    }

@router.get("/results")
def get_allocation_results(
    current_user: User = Depends(require_role(["coordinator", "guide"])),
    db: Session = Depends(get_db)
):
    teams = db.query(Team).filter(Team.is_locked == True).all()
    guides = db.query(Guide).join(User, Guide.user_id == User.id).all()
    allocations = db.query(Allocation).all()

    alloc_map = {a.team_id: a for a in allocations}
    auto_allocs = [a for a in allocations if not a.is_manual_override]
    count_1st = sum(1 for a in auto_allocs if a.allocated_rank == 1)
    count_2nd = sum(1 for a in auto_allocs if a.allocated_rank == 2)
    count_3rd = sum(1 for a in auto_allocs if a.allocated_rank == 3)
    total_auto = len(auto_allocs)

    satisfaction = round(
        ((count_1st * 100.0) + (count_2nd * 75.0) + (count_3rd * 50.0)) / max(total_auto, 1), 1
    ) if total_auto > 0 else 0.0

    guide_loads = []
    for g in guides:
        current_assigned = db.query(Allocation).filter(Allocation.guide_id == g.id).count()
        guide_loads.append({
            "guide_id": g.id,
            "guide_name": g.user.full_name if g.user else "Faculty",
            "max_teams": g.max_teams,
            "assigned_teams": current_assigned,
            "remaining_capacity": max(0, g.max_teams - current_assigned),
            "is_at_capacity": current_assigned >= g.max_teams
        })
    guide_loads.sort(key=lambda x: x["assigned_teams"], reverse=True)

    unallocated = [t for t in teams if t.id not in alloc_map]
    unallocated_outs = []
    for t in unallocated:
        open_guides = [gl for gl in guide_loads if gl["remaining_capacity"] > 0]
        unallocated_outs.append({
            "team_id": t.id,
            "team_name": t.name,
            "avg_cgpa": t.avg_cgpa,
            "suggested_guides": open_guides[:3]
        })

    allocation_outs = []
    for a in allocations:
        tm = db.query(Team).filter(Team.id == a.team_id).first()
        gd = db.query(Guide).filter(Guide.id == a.guide_id).first()
        allocation_outs.append({
            "id": a.id,
            "team_id": a.team_id,
            "team_name": tm.name if tm else "Unknown",
            "guide_id": a.guide_id,
            "guide_name": gd.user.full_name if (gd and gd.user) else "Unknown",
            "allocated_rank": a.allocated_rank,
            "is_manual_override": a.is_manual_override,
            "allocated_at": a.allocated_at
        })

    return {
        "summary": {
            "total_teams": len(teams),
            "allocated_count": len(allocations),
            "allocated_1st": count_1st,
            "allocated_2nd": count_2nd,
            "allocated_3rd": count_3rd,
            "unallocated_count": len(unallocated),
            "satisfaction_pct": satisfaction,
            "guide_loads": guide_loads,
            "unallocated_teams": unallocated_outs
        },
        "allocations": allocation_outs
    }

@router.post("/override")
def override_allocation(
    payload: AllocationOverrideRequest,
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    team = db.query(Team).filter(Team.id == payload.team_id).first()
    if not team:
        raise HTTPException(status_code=404, detail="Team not found.")

    guide = db.query(Guide).filter(Guide.id == payload.guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found.")

    # Remove existing allocation for this team
    existing = db.query(Allocation).filter(Allocation.team_id == payload.team_id).first()
    if existing:
        db.delete(existing)
        db.flush()

    new_alloc = Allocation(
        team_id=payload.team_id,
        guide_id=payload.guide_id,
        allocated_rank=None,
        is_manual_override=True,
        allocated_at=datetime.utcnow()
    )
    db.add(new_alloc)
    db.commit()

    return {"message": "Allocation overridden successfully.", "allocation_id": new_alloc.id}

@router.post("/reset")
def reset_allocations(
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    db.query(Allocation).filter(Allocation.is_manual_override == False).delete()
    db.commit()
    return {"message": "Automatic allocations reset successfully."}
