import pytest
from datetime import datetime, date, time, timedelta
from backend.scheduler import ReviewScheduler

class MockTeam:
    def __init__(self, t_id, guide_id):
        self.id = t_id
        self.guide_id = guide_id

class MockPanel:
    def __init__(self, p_id, name):
        self.id = p_id
        self.name = name

class MockSlot:
    def __init__(self, s_id, team_id, guide_id, panel_id, room, start_time, end_time):
        self.id = s_id
        self.team_id = team_id
        self.guide_id = guide_id
        self.panel_user_id = panel_id
        self.room_or_link = room
        self.start_time = start_time
        self.end_time = end_time


def test_auto_schedule_zero_conflicts():
    teams = [MockTeam(f"t{i}", f"g{i % 3}") for i in range(6)]
    panels = [MockPanel("p1", "Panel 1"), MockPanel("p2", "Panel 2")]

    slots = ReviewScheduler.auto_schedule(
        review_id="rev1",
        start_date_str="2026-10-10",
        end_date_str="2026-10-12",
        slot_duration_mins=30,
        teams=teams,
        panel_users=panels,
        daily_start_time_str="09:00",
        daily_end_time_str="17:00",
        room_prefix="Room "
    )

    assert len(slots) == 6

    # Verify no overlaps between any pairs with shared entities
    for i in range(len(slots)):
        for j in range(i + 1, len(slots)):
            s1 = slots[i]
            s2 = slots[j]
            overlap = ReviewScheduler.slots_overlap(
                s1["start_time"], s1["end_time"], s2["start_time"], s2["end_time"]
            )
            if overlap:
                assert s1["team_id"] != s2["team_id"]
                assert s1["panel_user_id"] != s2["panel_user_id"]
                assert s1["room_or_link"] != s2["room_or_link"]
                if s1["guide_id"] and s2["guide_id"]:
                    assert s1["guide_id"] != s2["guide_id"]


def test_validate_team_conflict():
    existing = [
        MockSlot("s1", "t1", "g1", "p1", "Room A", datetime(2026, 10, 10, 10, 0), datetime(2026, 10, 10, 10, 30))
    ]
    # Attempt to schedule t1 at 10:15 - 10:45 (overlapping)
    has_conflict, err = ReviewScheduler.validate_conflict(
        target_slot_id=None,
        start_time=datetime(2026, 10, 10, 10, 15),
        end_time=datetime(2026, 10, 10, 10, 45),
        team_id="t1",
        guide_id="g2",
        panel_user_id="p2",
        room_or_link="Room B",
        existing_slots=existing
    )
    assert has_conflict is True
    assert "Team is already scheduled" in err


def test_validate_panel_conflict():
    existing = [
        MockSlot("s1", "t1", "g1", "p1", "Room A", datetime(2026, 10, 10, 10, 0), datetime(2026, 10, 10, 10, 30))
    ]
    # Same panel p1 booked in overlapping slot
    has_conflict, err = ReviewScheduler.validate_conflict(
        target_slot_id=None,
        start_time=datetime(2026, 10, 10, 10, 15),
        end_time=datetime(2026, 10, 10, 10, 45),
        team_id="t2",
        guide_id="g2",
        panel_user_id="p1",
        room_or_link="Room B",
        existing_slots=existing
    )
    assert has_conflict is True
    assert "Panel evaluator is already booked" in err


def test_validate_room_conflict():
    existing = [
        MockSlot("s1", "t1", "g1", "p1", "Room A", datetime(2026, 10, 10, 10, 0), datetime(2026, 10, 10, 10, 30))
    ]
    # Same room Room A booked in overlapping slot
    has_conflict, err = ReviewScheduler.validate_conflict(
        target_slot_id=None,
        start_time=datetime(2026, 10, 10, 10, 0),
        end_time=datetime(2026, 10, 10, 10, 30),
        team_id="t2",
        guide_id="g2",
        panel_user_id="p2",
        room_or_link="Room A",
        existing_slots=existing
    )
    assert has_conflict is True
    assert "already occupied" in err


def test_validate_invalid_time_range():
    has_conflict, err = ReviewScheduler.validate_conflict(
        target_slot_id=None,
        start_time=datetime(2026, 10, 10, 11, 0),
        end_time=datetime(2026, 10, 10, 10, 0),
        team_id="t1",
        guide_id="g1",
        panel_user_id="p1",
        room_or_link="Room A",
        existing_slots=[]
    )
    assert has_conflict is True
    assert "End time must be after start time" in err
