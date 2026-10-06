import pytest
from datetime import datetime, timedelta
from backend.allocation import AllocationEngine

class MockGuide:
    def __init__(self, g_id, name, max_teams, specs=None):
        self.id = g_id
        self.name = name
        self.max_teams = max_teams
        self.specialisations = specs or ["AI", "Cloud"]

    def get(self, key, default=None):
        return getattr(self, key, default)

class MockPref:
    def __init__(self, guide_id, rank):
        self.guide_id = guide_id
        self.rank = rank

class MockTeam:
    def __init__(self, t_id, name, avg_cgpa, prefs, sub_time=None, created_at=None):
        self.id = t_id
        self.name = name
        self.avg_cgpa = avg_cgpa
        self.preferences = prefs
        self.preference_submitted_at = sub_time or datetime(2026, 1, 1, 10, 0)
        self.created_at = created_at or datetime(2026, 1, 1, 9, 0)

    def get(self, key, default=None):
        return getattr(self, key, default)

class MockAlloc:
    def __init__(self, team_id, guide_id, is_manual_override=True):
        self.team_id = team_id
        self.guide_id = guide_id
        self.is_manual_override = is_manual_override


def test_perfect_first_choice_allocation():
    guides = [
        MockGuide("g1", "Dr. Sharma", max_teams=2),
        MockGuide("g2", "Dr. Nair", max_teams=2),
    ]
    teams = [
        MockTeam("t1", "Team 1", 9.0, [MockPref("g1", 1), MockPref("g2", 2)]),
        MockTeam("t2", "Team 2", 8.5, [MockPref("g1", 1), MockPref("g2", 2)]),
        MockTeam("t3", "Team 3", 8.0, [MockPref("g2", 1), MockPref("g1", 2)]),
    ]

    result = AllocationEngine.run_allocation(teams, guides, priority_mode="cgpa")
    summary = result["summary"]
    allocations = result["allocations"]

    assert summary["total_teams"] == 3
    assert summary["allocated_count"] == 3
    assert summary["unallocated_count"] == 0
    assert summary["allocated_1st"] == 3
    assert summary["satisfaction_pct"] == 100.0


def test_capacity_overflow_cascades_to_second_choice():
    # Guide 1 capacity is only 1. Both t1 and t2 want g1 first.
    guides = [
        MockGuide("g1", "Dr. Sharma", max_teams=1),
        MockGuide("g2", "Dr. Nair", max_teams=2),
    ]
    teams = [
        MockTeam("t1", "Team 1", 9.2, [MockPref("g1", 1), MockPref("g2", 2)]),
        MockTeam("t2", "Team 2", 8.4, [MockPref("g1", 1), MockPref("g2", 2)]),
    ]

    result = AllocationEngine.run_allocation(teams, guides, priority_mode="cgpa")
    allocations = result["allocations"]
    summary = result["summary"]

    alloc_map = {a["team_id"]: a for a in allocations}
    # t1 (higher CGPA) gets g1 (choice 1)
    assert alloc_map["t1"]["guide_id"] == "g1"
    assert alloc_map["t1"]["allocated_rank"] == 1

    # t2 (lower CGPA) cascades to g2 (choice 2)
    assert alloc_map["t2"]["guide_id"] == "g2"
    assert alloc_map["t2"]["allocated_rank"] == 2

    assert summary["allocated_1st"] == 1
    assert summary["allocated_2nd"] == 1
    assert summary["unallocated_count"] == 0


def test_deterministic_tie_breaking_by_submission_time():
    # Same CGPA (8.5), but t2 submitted earlier than t1
    guides = [
        MockGuide("g1", "Dr. Sharma", max_teams=1),
        MockGuide("g2", "Dr. Nair", max_teams=1),
    ]
    time1 = datetime(2026, 1, 2, 12, 0)
    time2 = datetime(2026, 1, 1, 10, 0)  # Earlier
    teams = [
        MockTeam("t1", "Team 1", 8.5, [MockPref("g1", 1), MockPref("g2", 2)], sub_time=time1),
        MockTeam("t2", "Team 2", 8.5, [MockPref("g1", 1), MockPref("g2", 2)], sub_time=time2),
    ]

    result = AllocationEngine.run_allocation(teams, guides, priority_mode="cgpa")
    alloc_map = {a["team_id"]: a for a in result["allocations"]}

    # t2 submitted earlier, so gets g1
    assert alloc_map["t2"]["guide_id"] == "g1"
    assert alloc_map["t2"]["allocated_rank"] == 1
    # t1 gets second choice
    assert alloc_map["t1"]["guide_id"] == "g2"
    assert alloc_map["t1"]["allocated_rank"] == 2


def test_preserves_manual_override_and_decrements_capacity():
    guides = [
        MockGuide("g1", "Dr. Sharma", max_teams=2),
        MockGuide("g2", "Dr. Nair", max_teams=2),
    ]
    # Coordinator manually assigned t_override to g1
    existing_overrides = [
        MockAlloc("t_override", "g1", is_manual_override=True)
    ]
    # Now g1 only has 1 spot left
    teams = [
        MockTeam("t_override", "Team Override", 7.0, []),
        MockTeam("t1", "Team 1", 9.0, [MockPref("g1", 1)]),
        MockTeam("t2", "Team 2", 8.5, [MockPref("g1", 1), MockPref("g2", 2)]),
    ]

    result = AllocationEngine.run_allocation(
        teams, guides, priority_mode="cgpa", existing_allocations=existing_overrides
    )
    alloc_map = {a["team_id"]: a for a in result["allocations"]}

    # Override preserved
    assert alloc_map["t_override"]["is_manual_override"] is True
    assert alloc_map["t_override"]["guide_id"] == "g1"

    # t1 takes the last spot of g1
    assert alloc_map["t1"]["guide_id"] == "g1"

    # t2 gets bumped to g2 because g1 capacity is saturated (1 override + 1 auto = 2 max)
    assert alloc_map["t2"]["guide_id"] == "g2"


def test_unallocated_team_provides_headroom_suggestions():
    # Only 1 guide with 1 spot, but 2 teams want only that guide
    guides = [
        MockGuide("g1", "Dr. Sharma", max_teams=1),
        MockGuide("g2", "Dr. Nair (Open)", max_teams=3),
    ]
    teams = [
        MockTeam("t1", "Team 1", 9.5, [MockPref("g1", 1)]),
        MockTeam("t2", "Team 2", 8.0, [MockPref("g1", 1)]),  # Only 1 preference, will be unallocated
    ]

    result = AllocationEngine.run_allocation(teams, guides, priority_mode="cgpa")
    summary = result["summary"]
    unalloc = result["unallocated_teams"]

    assert summary["unallocated_count"] == 1
    assert unalloc[0]["team_id"] == "t2"
    # Suggestion should include g2 since g2 has 3 open spots
    assert len(unalloc[0]["suggested_guides"]) > 0
    assert unalloc[0]["suggested_guides"][0]["guide_id"] == "g2"
    assert unalloc[0]["suggested_guides"][0]["remaining_capacity"] == 3


def test_teams_with_fewer_than_three_preferences():
    guides = [
        MockGuide("g1", "Dr. Sharma", max_teams=2),
    ]
    teams = [
        MockTeam("t1", "Team 1", 8.8, [MockPref("g1", 1)]),  # Only 1 preference
    ]

    result = AllocationEngine.run_allocation(teams, guides, priority_mode="cgpa")
    assert result["summary"]["allocated_count"] == 1
    assert result["allocations"][0]["allocated_rank"] == 1
