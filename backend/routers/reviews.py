from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Guide, Team, Allocation, Review, ReviewSlot
from backend.schemas import (
    ReviewCreate, ReviewOut, ReviewSlotOut, AutoScheduleRequest,
    RescheduleSlotRequest
)
from backend.auth import get_current_user, require_role
from backend.scheduler import ReviewScheduler

router = APIRouter(prefix="/reviews", tags=["Reviews & Scheduling"])

@router.get("", response_model=List[ReviewOut])
def list_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reviews = db.query(Review).order_by(Review.phase).all()
    results = []
    for r in reviews:
        slot_count = db.query(ReviewSlot).filter(ReviewSlot.review_id == r.id).count()
        results.append({
            "id": r.id,
            "title": r.title,
            "phase": r.phase,
            "start_date": r.start_date,
            "end_date": r.end_date,
            "slot_duration_mins": r.slot_duration_mins,
            "is_active": r.is_active,
            "total_slots": slot_count
        })
    return results

@router.post("", response_model=ReviewOut)
def create_review(
    payload: ReviewCreate,
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    review = Review(
        title=payload.title.strip(),
        phase=payload.phase,
        start_date=payload.start_date,
        end_date=payload.end_date,
        slot_duration_mins=payload.slot_duration_mins,
        is_active=True
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {
        "id": review.id,
        "title": review.title,
        "phase": review.phase,
        "start_date": review.start_date,
        "end_date": review.end_date,
        "slot_duration_mins": review.slot_duration_mins,
        "is_active": review.is_active,
        "total_slots": 0
    }

@router.post("/{review_id}/auto-schedule")
def auto_schedule_review(
    review_id: str,
    payload: AutoScheduleRequest,
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found.")

    # Get all allocated teams
    allocated_teams = db.query(Team).join(Allocation, Team.id == Allocation.team_id).all()
    if not allocated_teams:
        raise HTTPException(status_code=400, detail="No allocated teams found. Run guide allocation first.")

    # Get panel members
    panel_users = db.query(User).filter(User.role == "panel").all()
    if not panel_users:
        # Fallback to coordinator/guides if no panel users registered
        panel_users = db.query(User).filter(User.role.in_(["panel", "guide"])).limit(4).all()

    # Clear existing slots for this review
    db.query(ReviewSlot).filter(ReviewSlot.review_id == review_id).delete()
    db.flush()

    # Run scheduling algorithm
    generated_slots = ReviewScheduler.auto_schedule(
        review_id=review.id,
        start_date_str=review.start_date,
        end_date_str=review.end_date,
        slot_duration_mins=review.slot_duration_mins,
        teams=allocated_teams,
        panel_users=panel_users,
        daily_start_time_str=payload.daily_start_time,
        daily_end_time_str=payload.daily_end_time,
        room_prefix=payload.room_prefix
    )

    for slot_data in generated_slots:
        slot = ReviewSlot(
            review_id=slot_data["review_id"],
            team_id=slot_data["team_id"],
            panel_user_id=slot_data["panel_user_id"],
            room_or_link=slot_data["room_or_link"],
            start_time=slot_data["start_time"],
            end_time=slot_data["end_time"],
            status="scheduled"
        )
        db.add(slot)

    db.commit()

    return {
        "message": f"Successfully scheduled {len(generated_slots)} conflict-free slots.",
        "scheduled_count": len(generated_slots)
    }

@router.get("/{review_id}/slots", response_model=List[ReviewSlotOut])
def get_review_slots(
    review_id: str,
    guide_id: Optional[str] = None,
    panel_id: Optional[str] = None,
    team_id: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(ReviewSlot).filter(ReviewSlot.review_id == review_id)

    if team_id:
        query = query.filter(ReviewSlot.team_id == team_id)
    if panel_id:
        query = query.filter(ReviewSlot.panel_user_id == panel_id)

    slots = query.order_by(ReviewSlot.start_time).all()

    slot_outs = []
    for s in slots:
        team = db.query(Team).filter(Team.id == s.team_id).first()
        panel = db.query(User).filter(User.id == s.panel_user_id).first()
        alloc = db.query(Allocation).filter(Allocation.team_id == s.team_id).first()
        g_name = "Not Assigned"
        if alloc:
            gd = db.query(Guide).filter(Guide.id == alloc.guide_id).first()
            if gd and gd.user:
                g_name = gd.user.full_name
                # Optional guide filter
                if guide_id and gd.id != guide_id:
                    continue

        slot_outs.append({
            "id": s.id,
            "review_id": s.review_id,
            "team_id": s.team_id,
            "team_name": team.name if team else "Team",
            "guide_name": g_name,
            "panel_user_id": s.panel_user_id,
            "panel_name": panel.full_name if panel else "Panel",
            "room_or_link": s.room_or_link,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "status": s.status
        })

    return slot_outs

@router.put("/slots/{slot_id}/reschedule")
def reschedule_slot(
    slot_id: str,
    payload: RescheduleSlotRequest,
    current_user: User = Depends(require_role(["coordinator"])),
    db: Session = Depends(get_db)
):
    slot = db.query(ReviewSlot).filter(ReviewSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found.")

    target_panel_id = payload.panel_user_id or slot.panel_user_id
    target_room = payload.room_or_link or slot.room_or_link

    # Check team guide ID
    alloc = db.query(Allocation).filter(Allocation.team_id == slot.team_id).first()
    g_id = alloc.guide_id if alloc else None

    # Get all other active slots in this review
    other_slots = db.query(ReviewSlot).filter(
        ReviewSlot.review_id == slot.review_id,
        ReviewSlot.id != slot_id
    ).all()

    # Validate conflict
    has_conflict, err_msg = ReviewScheduler.validate_conflict(
        target_slot_id=slot.id,
        start_time=payload.start_time,
        end_time=payload.end_time,
        team_id=slot.team_id,
        guide_id=g_id,
        panel_user_id=target_panel_id,
        room_or_link=target_room,
        existing_slots=other_slots
    )

    if has_conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=err_msg)

    slot.start_time = payload.start_time
    slot.end_time = payload.end_time
    slot.panel_user_id = target_panel_id
    slot.room_or_link = target_room
    slot.status = "rescheduled"
    db.commit()

    return {"message": "Slot rescheduled successfully without conflicts.", "slot_id": slot.id}
