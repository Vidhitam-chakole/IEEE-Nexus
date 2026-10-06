import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.database import engine, Base
from backend.seed import seed_database

# Import routers
from backend.routers import (
    auth, teams, allocation, reviews, logs,
    documents, submissions, coordinator, internships
)

# Initialize DB tables
Base.metadata.create_all(bind=engine)

# Ensure uploads directory exists
UPLOAD_ROOT = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_ROOT, exist_ok=True)

app = FastAPI(
    title="CapstoneTrack API",
    description="Final-Year Project & Internship Tracker for Colleges",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Startup event to auto-seed if clean database
@app.on_event("startup")
def on_startup():
    try:
        seed_database()
    except Exception as e:
        print(f"Startup seed notice: {e}")

# Include API Routers under /api/v1
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(teams.router, prefix=API_PREFIX)
app.include_router(allocation.router, prefix=API_PREFIX)
app.include_router(reviews.router, prefix=API_PREFIX)
app.include_router(logs.router, prefix=API_PREFIX)
app.include_router(documents.router, prefix=API_PREFIX)
app.include_router(submissions.router, prefix=API_PREFIX)
app.include_router(coordinator.router, prefix=API_PREFIX)
app.include_router(internships.router, prefix=API_PREFIX)

# Static file serving for uploads
app.mount("/uploads", StaticFiles(directory=UPLOAD_ROOT), name="uploads")

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "CapstoneTrack API",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
