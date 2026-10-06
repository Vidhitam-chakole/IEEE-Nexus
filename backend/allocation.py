"""
CapstoneTrack - Guide Allocation Engine (allocation.py)
-------------------------------------------------------
Deterministic Many-to-One preference-based allocation algorithm with load limits.
Handles:
- Configurable priority ordering: 'cgpa' (Academic Merit) or 'submission_time' (FCFS)
- Multi-tier deterministic tie-breaking (no random non-reproducible outcomes)
- Preservation of coordinator manual overrides
- Saturated preference cascade (Rank 1 -> Rank 2 -> Rank 3)
- Graceful handling of teams with < 3 preferences
- Intelligent headroom recommendations for unallocated teams
- Full metric generation: Choice satisfaction percentages, unallocated count, guide loads
"""

from typing import List, Dict, Any, Optional
from datetime import datetime

class AllocationEngine:
    @staticmethod
    def run_allocation(
        teams: List[Any],
        guides: List[Any],
        priority_mode: str = "cgpa",
        existing_allocations: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes the allocation matching.
        
        :param teams: List of locked Team objects/dicts with id, name, avg_cgpa, 
                      preference_submitted_at, created_at, and preferences.
        :param guides: List of Guide objects/dicts with id, full_name, max_teams, specialisations.
        :param priority_mode: 'cgpa' or 'submission_time'
        :param existing_allocations: List of existing Allocation objects/dicts (to check manual overrides).
        :return: Dict containing summary metrics, list of new allocations, and unallocated teams.
        """
        # 1. Initialize guide remaining capacities and metadata lookup
        remaining_capacity: Dict[str, int] = {}
        guide_meta: Dict[str, Dict[str, Any]] = {}
        for g in guides:
            g_id = str(g.id if hasattr(g, "id") else g["id"])
            max_teams = int(g.max_teams if hasattr(g, "max_teams") else g["max_teams"])
            g_name = str(g.user.full_name if hasattr(g, "user") and hasattr(g.user, "full_name") 
                         else g.get("full_name", f"Guide {g_id[:6]}"))
            specs = g.specialisations if hasattr(g, "specialisations") else g.get("specialisations", [])
            
            remaining_capacity[g_id] = max_teams
            guide_meta[g_id] = {
                "id": g_id,
                "name": g_name,
                "max_teams": max_teams,
                "specialisations": specs
            }

        new_allocations: List[Dict[str, Any]] = []
        unallocated_teams: List[Dict[str, Any]] = []
        processed_team_ids = set()

        # 2. Preserve and honor manual coordinator overrides
        if existing_allocations:
            for alloc in existing_allocations:
                is_override = alloc.is_manual_override if hasattr(alloc, "is_manual_override") else alloc.get("is_manual_override", False)
                if is_override:
                    t_id = str(alloc.team_id if hasattr(alloc, "team_id") else alloc["team_id"])
                    g_id = str(alloc.guide_id if hasattr(alloc, "guide_id") else alloc["guide_id"])
                    
                    if g_id in remaining_capacity and remaining_capacity[g_id] > 0:
                        remaining_capacity[g_id] -= 1
                    
                    new_allocations.append({
                        "team_id": t_id,
                        "guide_id": g_id,
                        "allocated_rank": None,
                        "is_manual_override": True,
                        "allocated_at": datetime.utcnow()
                    })
                    processed_team_ids.add(t_id)

        # 3. Filter candidates: teams that are locked and not manually overridden
        candidate_teams = []
        for t in teams:
            t_id = str(t.id if hasattr(t, "id") else t["id"])
            if t_id not in processed_team_ids:
                candidate_teams.append(t)

        # 4. Sort candidates by priority mode with deterministic tie-breakers
        def get_team_sort_key(team):
            avg_cgpa = float(team.avg_cgpa if hasattr(team, "avg_cgpa") else team.get("avg_cgpa", 0.0))
            sub_time = team.preference_submitted_at if hasattr(team, "preference_submitted_at") else team.get("preference_submitted_at")
            if not sub_time:
                sub_time = datetime.max
            created_at = team.created_at if hasattr(team, "created_at") else team.get("created_at")
            if not created_at:
                created_at = datetime.max
            t_id = str(team.id if hasattr(team, "id") else team["id"])

            if priority_mode == "cgpa":
                # Priority 1: Higher CGPA (negative for ascending sort)
                # Priority 2: Earlier submission time
                # Priority 3: Earlier creation time
                # Priority 4: UUID string
                return (-avg_cgpa, sub_time, created_at, t_id)
            else:
                # Priority 1: Earlier submission time
                # Priority 2: Higher CGPA
                # Priority 3: Earlier creation time
                # Priority 4: UUID string
                return (sub_time, -avg_cgpa, created_at, t_id)

        candidate_teams.sort(key=get_team_sort_key)

        # 5. Greedy matching across ranked preferences
        for team in candidate_teams:
            t_id = str(team.id if hasattr(team, "id") else team["id"])
            t_name = str(team.name if hasattr(team, "name") else team.get("name", "Unnamed Team"))
            t_cgpa = float(team.avg_cgpa if hasattr(team, "avg_cgpa") else team.get("avg_cgpa", 0.0))
            
            # Extract and sort preferences by rank (1, 2, 3)
            raw_prefs = team.preferences if hasattr(team, "preferences") else team.get("preferences", [])
            sorted_prefs = []
            for p in raw_prefs:
                p_guide_id = str(p.guide_id if hasattr(p, "guide_id") else p["guide_id"])
                p_rank = int(p.rank if hasattr(p, "rank") else p["rank"])
                sorted_prefs.append((p_rank, p_guide_id))
            sorted_prefs.sort(key=lambda x: x[0])

            assigned = False
            for p_rank, p_guide_id in sorted_prefs:
                if remaining_capacity.get(p_guide_id, 0) > 0:
                    remaining_capacity[p_guide_id] -= 1
                    new_allocations.append({
                        "team_id": t_id,
                        "guide_id": p_guide_id,
                        "allocated_rank": p_rank,
                        "is_manual_override": False,
                        "allocated_at": datetime.utcnow()
                    })
                    assigned = True
                    break

            if not assigned:
                # Preferences saturated: find guides with maximum remaining headroom
                available_guides = [
                    (g_id, cap) for g_id, cap in remaining_capacity.items() if cap > 0
                ]
                # Sort by highest remaining capacity first
                available_guides.sort(key=lambda x: x[1], reverse=True)
                suggested_guides = [
                    {
                        "guide_id": g_id,
                        "guide_name": guide_meta[g_id]["name"],
                        "remaining_capacity": cap,
                        "specialisations": guide_meta[g_id]["specialisations"]
                    }
                    for g_id, cap in available_guides[:3]
                ]

                unallocated_teams.append({
                    "team_id": t_id,
                    "team_name": t_name,
                    "avg_cgpa": t_cgpa,
                    "suggested_guides": suggested_guides
                })

        # 6. Aggregate metric summaries
        auto_allocs = [a for a in new_allocations if not a["is_manual_override"]]
        count_1st = sum(1 for a in auto_allocs if a["allocated_rank"] == 1)
        count_2nd = sum(1 for a in auto_allocs if a["allocated_rank"] == 2)
        count_3rd = sum(1 for a in auto_allocs if a["allocated_rank"] == 3)
        total_auto = len(auto_allocs)

        # Satisfaction formula: 100% for 1st choice, 75% for 2nd, 50% for 3rd
        if total_auto > 0:
            satisfaction = round(
                ((count_1st * 100.0) + (count_2nd * 75.0) + (count_3rd * 50.0)) / total_auto, 1
            )
        else:
            satisfaction = 100.0 if len(candidate_teams) == 0 else 0.0

        # Guide load distribution
        guide_loads = []
        for g_id, meta in guide_meta.items():
            assigned_count = meta["max_teams"] - remaining_capacity[g_id]
            guide_loads.append({
                "guide_id": g_id,
                "guide_name": meta["name"],
                "max_teams": meta["max_teams"],
                "assigned_teams": assigned_count,
                "remaining_capacity": remaining_capacity[g_id],
                "is_at_capacity": remaining_capacity[g_id] == 0
            })
        guide_loads.sort(key=lambda x: x["assigned_teams"], reverse=True)

        summary = {
            "total_teams": len(teams),
            "allocated_count": len(new_allocations),
            "allocated_1st": count_1st,
            "allocated_2nd": count_2nd,
            "allocated_3rd": count_3rd,
            "unallocated_count": len(unallocated_teams),
            "satisfaction_pct": satisfaction,
            "guide_loads": guide_loads,
            "unallocated_teams": unallocated_teams
        }

        return {
            "summary": summary,
            "allocations": new_allocations,
            "unallocated_teams": unallocated_teams
        }
