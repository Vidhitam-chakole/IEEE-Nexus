from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Guide, Team, Allocation, Review, ProgressLog
from backend.schemas import (
    CoordinatorDashboardOut, FallingBehindTeam, HeatmapRow,
    GuideCapacityUpdate
)
from backend.auth import require_role

router = APIRouter(prefix="/coordinator", tags=["Coordinator Control Center"])

@router.get("/dashboard", response_model=CoordinatorDashboardOut)
def get_coordinator_dashboard(
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    total_teams = db.query(Team).count()
    allocated_count = db.query(Allocation).count()
    unallocated_teams = total_teams - allocated_count

    guides = db.query(Guide).join(User, Guide.user_id == User.id).all()
    guides_at_capacity = 0
    guide_loads = []

    for g in guides:
        assigned = db.query(Allocation).filter(Allocation.guide_id == g.id).count()
        is_full = assigned >= g.max_teams
        if is_full:
            guides_at_capacity += 1
        guide_loads.append({
            "guide_id": g.id,
            "guide_name": g.user.full_name if g.user else "Faculty",
            "department": g.user.department if g.user else "",
            "max_teams": g.max_teams,
            "assigned_teams": assigned,
            "remaining_capacity": max(0, g.max_teams - assigned),
            "is_at_capacity": is_full
        })
    guide_loads.sort(key=lambda x: x["assigned_teams"], reverse=True)

    upcoming_reviews = db.query(Review).filter(Review.is_active == True).count()

    # Identify teams falling behind (no log submitted in the last 7+ days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    teams = db.query(Team).all()
    falling_behind = []

    for t in teams:
        # Find latest log for this team
        latest_log = db.query(ProgressLog).filter(
            ProgressLog.team_id == t.id
        ).order_by(ProgressLog.created_at.desc()).first()

        alloc = db.query(Allocation).filter(Allocation.team_id == t.id).first()
        g_name = "Unallocated"
        if alloc:
            gd = db.query(Guide).filter(Guide.id == alloc.guide_id).first()
            if gd and gd.user:
                g_name = gd.user.full_name

        if not latest_log:
            # No logs at all
            days_since_creation = (datetime.utcnow() - t.created_at).days
            if days_since_creation >= 7:
                falling_behind.append({
                    "team_id": t.id,
                    "team_name": t.name,
                    "guide_name": g_name,
                    "last_log_date": "Never",
                    "days_overdue": days_since_creation
                })
        else:
            if latest_log.created_at < seven_days_ago:
                days_overdue = (datetime.utcnow() - latest_log.created_at).days
                falling_behind.append({
                    "team_id": t.id,
                    "team_name": t.name,
                    "guide_name": g_name,
                    "last_log_date": latest_log.created_at.strftime("%Y-%m-%d"),
                    "days_overdue": days_overdue
                })

    falling_behind.sort(key=lambda x: x["days_overdue"], reverse=True)

    return {
        "total_teams": total_teams,
        "unallocated_teams": max(0, unallocated_teams),
        "guides_at_capacity": guides_at_capacity,
        "upcoming_reviews_count": upcoming_reviews,
        "falling_behind_teams": falling_behind,
        "guide_loads": guide_loads
    }

@router.get("/heatmap", response_model=List[HeatmapRow])
def get_progress_heatmap(
    current_user: User = Depends(require_role(["coordinator", "guide"])),
    db: Session = Depends(get_db)
):
    teams = db.query(Team).order_by(Team.name).all()
    heatmap_rows = []

    for t in teams:
        alloc = db.query(Allocation).filter(Allocation.team_id == t.id).first()
        g_name = "Unallocated"
        if alloc:
            gd = db.query(Guide).filter(Guide.id == alloc.guide_id).first()
            if gd and gd.user:
                g_name = gd.user.full_name

        logs = db.query(ProgressLog).filter(ProgressLog.team_id == t.id).all()
        log_map = {l.week_number: l.status for l in logs}

        weeks_dict = {}
        for wk in range(1, 13):  # 12 weeks
            status_val = log_map.get(wk, "missing")
            weeks_dict[wk] = status_val

        heatmap_rows.append({
            "team_id": t.id,
            "team_name": t.name,
            "guide_name": g_name,
            "weeks": weeks_dict
        })

    return heatmap_rows

@router.put("/guides/{guide_id}/capacity")
def update_guide_capacity(
    guide_id: str,
    payload: GuideCapacityUpdate,
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    guide = db.query(Guide).filter(Guide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="Guide not found.")

    guide.max_teams = payload.max_teams
    db.commit()

    return {"message": f"Guide capacity updated to {payload.max_teams} teams.", "guide_id": guide.id}
