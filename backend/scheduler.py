"""
CapstoneTrack - Review Scheduling Engine (scheduler.py)
-------------------------------------------------------
Generates conflict-free evaluation schedules and validates manual reschedules.
Hard Constraints:
1. Team Non-Overlap: No team scheduled concurrently in two slots.
2. Guide Non-Overlap: The team's assigned guide cannot attend two overlapping slots.
3. Panel Non-Overlap: Panel evaluators cannot be assigned to overlapping slots.
4. Room/Venue Non-Overlap: Physical or virtual rooms cannot be double-booked.
5. Window Bounds: Slots fall strictly within working hours (09:00 - 17:00, lunch 13:00-14:00).
"""

from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, date, time, timedelta

class ReviewScheduler:
    @staticmethod
    def slots_overlap(start1: datetime, end1: datetime, start2: datetime, end2: datetime) -> bool:
        """Returns True if the two half-open intervals [start1, end1) and [start2, end2) overlap."""
        return max(start1, start2) < min(end1, end2)

    @classmethod
    def validate_conflict(
        cls,
        target_slot_id: Optional[str],
        start_time: datetime,
        end_time: datetime,
        team_id: str,
        guide_id: Optional[str],
        panel_user_id: str,
        room_or_link: str,
        existing_slots: List[Any]
    ) -> Tuple[bool, Optional[str]]:
        """
        Validates if a proposed slot conflicts with any existing slot.
        Returns (has_conflict, error_message).
        """
        if end_time <= start_time:
            return True, "End time must be after start time."

        for s in existing_slots:
            s_id = str(s.id if hasattr(s, "id") else s.get("id"))
            if target_slot_id and s_id == target_slot_id:
                continue

            s_start = s.start_time if hasattr(s, "start_time") else s.get("start_time")
            s_end = s.end_time if hasattr(s, "end_time") else s.get("end_time")
            s_team_id = str(s.team_id if hasattr(s, "team_id") else s.get("team_id"))
            s_panel_id = str(s.panel_user_id if hasattr(s, "panel_user_id") else s.get("panel_user_id"))
            s_room = str(s.room_or_link if hasattr(s, "room_or_link") else s.get("room_or_link"))
            if hasattr(s, "team") and hasattr(s.team, "allocation") and s.team.allocation:
                s_guide_id = str(s.team.allocation.guide_id)
            elif hasattr(s, "guide_id"):
                s_guide_id = str(s.guide_id)
            elif isinstance(s, dict):
                s_guide_id = str(s.get("guide_id", ""))
            else:
                s_guide_id = ""

            if cls.slots_overlap(start_time, end_time, s_start, s_end):
                if s_team_id == team_id:
                    return True, f"Conflict: Team is already scheduled in an overlapping slot ({s_start.strftime('%H:%M')} - {s_end.strftime('%H:%M')})."
                if guide_id and s_guide_id and s_guide_id == guide_id:
                    return True, f"Conflict: Team's guide is already scheduled in another slot at this time."
                if s_panel_id == panel_user_id:
                    return True, f"Conflict: Panel evaluator is already booked for another slot at this time."
                if s_room == room_or_link:
                    return True, f"Conflict: Room/venue '{room_or_link}' is already occupied at this time."

        return False, None

    @classmethod
    def auto_schedule(
        cls,
        review_id: str,
        start_date_str: str,
        end_date_str: str,
        slot_duration_mins: int,
        teams: List[Any],
        panel_users: List[Any],
        daily_start_time_str: str = "09:00",
        daily_end_time_str: str = "17:00",
        room_prefix: str = "Lab 40"
    ) -> List[Dict[str, Any]]:
        """
        Generates conflict-free review slots for all allocated teams across the evaluation window.
        """
        if not teams or not panel_users:
            return []

        # Parse date range
        start_dt = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_dt = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        
        start_hour, start_min = map(int, daily_start_time_str.split(":"))
        end_hour, end_min = map(int, daily_end_time_str.split(":"))

        # Group teams by guide to minimize faculty waiting time
        def get_team_guide_id(t):
            if hasattr(t, "allocation") and t.allocation:
                return str(t.allocation.guide_id)
            if isinstance(t, dict) and "guide_id" in t:
                return str(t["guide_id"])
            return ""

        sorted_teams = sorted(teams, key=get_team_guide_id)

        scheduled_slots: List[Dict[str, Any]] = []
        team_idx = 0
        total_teams = len(sorted_teams)

        current_date = start_dt
        panel_idx = 0
        room_counter = 1

        while current_date <= end_dt and team_idx < total_teams:
            current_slot_start = datetime.combine(current_date, time(start_hour, start_min))
            day_end = datetime.combine(current_date, time(end_hour, end_min))

            while current_slot_start + timedelta(minutes=slot_duration_mins) <= day_end and team_idx < total_teams:
                current_slot_end = current_slot_start + timedelta(minutes=slot_duration_mins)

                # Skip lunch hour (13:00 to 14:00)
                if current_slot_start.hour == 13:
                    current_slot_start = datetime.combine(current_date, time(14, 0))
                    continue

                team = sorted_teams[team_idx]
                t_id = str(team.id if hasattr(team, "id") else team["id"])
                g_id = get_team_guide_id(team)
                panel = panel_users[panel_idx % len(panel_users)]
                p_id = str(panel.id if hasattr(panel, "id") else panel["id"])
                room = f"{room_prefix}{((room_counter - 1) % 4) + 1}"

                # Verify conflict check
                has_conflict, _ = cls.validate_conflict(
                    target_slot_id=None,
                    start_time=current_slot_start,
                    end_time=current_slot_end,
                    team_id=t_id,
                    guide_id=g_id,
                    panel_user_id=p_id,
                    room_or_link=room,
                    existing_slots=scheduled_slots
                )

                if not has_conflict:
                    scheduled_slots.append({
                        "review_id": review_id,
                        "team_id": t_id,
                        "guide_id": g_id,
                        "panel_user_id": p_id,
                        "room_or_link": room,
                        "start_time": current_slot_start,
                        "end_time": current_slot_end,
                        "status": "scheduled"
                    })
                    team_idx += 1
                    panel_idx += 1
                    room_counter += 1

                # Advance slot cursor with a 5-minute break
                current_slot_start = current_slot_end + timedelta(minutes=5)

            current_date += timedelta(days=1)

        return scheduled_slots
