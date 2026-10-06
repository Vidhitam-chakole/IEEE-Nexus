import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_flow_all_roles():
    # 1. Coordinator login
    coord_resp = client.post("/api/v1/auth/login", json={
        "email": "coordinator@college.edu",
        "password": "Coord@123"
    })
    assert coord_resp.status_code == 200
    coord_token = coord_resp.json()["access_token"]
    assert coord_resp.json()["user"]["role"] == "coordinator"

    # 2. Guide login
    guide_resp = client.post("/api/v1/auth/login", json={
        "email": "arun.sharma@college.edu",
        "password": "Guide@123"
    })
    assert guide_resp.status_code == 200
    assert guide_resp.json()["user"]["role"] == "guide"

    # 3. Student login
    student_resp = client.post("/api/v1/auth/login", json={
        "email": "aarav.1@college.edu",
        "password": "Student@123"
    })
    assert student_resp.status_code == 200
    assert student_resp.json()["user"]["role"] == "student"

    # 4. Panel login
    panel_resp = client.post("/api/v1/auth/login", json={
        "email": "panel.oberoi@college.edu",
        "password": "Panel@123"
    })
    assert panel_resp.status_code == 200
    assert panel_resp.json()["user"]["role"] == "panel"

def test_coordinator_dashboard_and_heatmap():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "coordinator@college.edu",
        "password": "Coord@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Test Dashboard KPI Cards
    dash_resp = client.get("/api/v1/coordinator/dashboard", headers=headers)
    assert dash_resp.status_code == 200
    data = dash_resp.json()
    assert data["total_teams"] >= 12
    assert "falling_behind_teams" in data
    assert len(data["guide_loads"]) == 10

    # Test Heatmap Matrix
    heat_resp = client.get("/api/v1/coordinator/heatmap", headers=headers)
    assert heat_resp.status_code == 200
    heat_data = heat_resp.json()
    assert len(heat_data) >= 12
    # Verify weeks 1..12 presence
    first_team = heat_data[0]
    assert 1 in first_team["weeks"] or "1" in first_team["weeks"]

def test_allocation_run_and_review_scheduling():
    login_resp = client.post("/api/v1/auth/login", json={
        "email": "coordinator@college.edu",
        "password": "Coord@123"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Run Allocation
    alloc_resp = client.post("/api/v1/allocation/run?priority_mode=cgpa", headers=headers)
    assert alloc_resp.status_code == 200
    alloc_data = alloc_resp.json()
    assert alloc_data["summary"]["allocated_count"] >= 10
    assert alloc_data["summary"]["satisfaction_pct"] > 0

    # List Reviews
    rev_resp = client.get("/api/v1/reviews", headers=headers)
    assert rev_resp.status_code == 200
    reviews = rev_resp.json()
    assert len(reviews) >= 3

    # Auto Schedule Review 1
    rev1_id = reviews[0]["id"]
    sched_resp = client.post(f"/api/v1/reviews/{rev1_id}/auto-schedule", json={
        "daily_start_time": "09:00",
        "daily_end_time": "17:00",
        "room_prefix": "Lab 40"
    }, headers=headers)
    assert sched_resp.status_code == 200
    assert sched_resp.json()["scheduled_count"] > 0

    # Get Slots
    slots_resp = client.get(f"/api/v1/reviews/{rev1_id}/slots", headers=headers)
    assert slots_resp.status_code == 200
    assert len(slots_resp.json()) > 0
