-- CapstoneTrack: Migration 001 - Initial PostgreSQL / Supabase Schema
-- Compatible with PostgreSQL 14+ / Supabase

-- Enable UUID extension if not present
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'guide', 'coordinator', 'panel')),
    department VARCHAR(100) NOT NULL,
    cgpa NUMERIC(3, 2) CHECK (cgpa IS NULL OR (cgpa >= 0.00 AND cgpa <= 10.00)),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. GUIDES TABLE
CREATE TABLE IF NOT EXISTS guides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    specialisations TEXT[] NOT NULL DEFAULT '{}',
    max_teams INT NOT NULL DEFAULT 3 CHECK (max_teams >= 1 AND max_teams <= 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guides_user_id ON guides(user_id);

-- 3. TEAMS TABLE
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(6) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    project_title VARCHAR(255) NOT NULL,
    lead_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    avg_cgpa NUMERIC(3, 2) DEFAULT 0.00,
    preference_submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(code);
CREATE INDEX IF NOT EXISTS idx_teams_lead ON teams(lead_id);
CREATE INDEX IF NOT EXISTS idx_teams_locked ON teams(is_locked);

-- 4. TEAM MEMBERS TABLE (Enforces strictly 1 team per student via UNIQUE constraint)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_student_id ON team_members(student_id);

-- 5. GUIDE PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS guide_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    rank INT NOT NULL CHECK (rank IN (1, 2, 3)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_team_pref_rank UNIQUE (team_id, rank),
    CONSTRAINT uq_team_pref_guide UNIQUE (team_id, guide_id)
);

CREATE INDEX IF NOT EXISTS idx_guide_preferences_team ON guide_preferences(team_id);
CREATE INDEX IF NOT EXISTS idx_guide_preferences_guide ON guide_preferences(guide_id);

-- 6. ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID UNIQUE NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE RESTRICT,
    allocated_rank INT CHECK (allocated_rank IS NULL OR allocated_rank IN (1, 2, 3)),
    is_manual_override BOOLEAN NOT NULL DEFAULT FALSE,
    allocated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_allocations_team_id ON allocations(team_id);
CREATE INDEX IF NOT EXISTS idx_allocations_guide_id ON allocations(guide_id);

-- 7. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    phase INT NOT NULL CHECK (phase IN (1, 2, 3)),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    slot_duration_mins INT NOT NULL DEFAULT 30,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REVIEW SLOTS TABLE
CREATE TABLE IF NOT EXISTS review_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    panel_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    room_or_link VARCHAR(100) NOT NULL DEFAULT 'Lab 402',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'rescheduled')),
    CONSTRAINT chk_slot_time_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_review_slots_review ON review_slots(review_id);
CREATE INDEX IF NOT EXISTS idx_review_slots_team ON review_slots(team_id);
CREATE INDEX IF NOT EXISTS idx_review_slots_panel ON review_slots(panel_user_id);
CREATE INDEX IF NOT EXISTS idx_review_slots_start ON review_slots(start_time);

-- 9. PROGRESS LOGS TABLE
CREATE TABLE IF NOT EXISTS progress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    week_number INT NOT NULL CHECK (week_number >= 1 AND week_number <= 16),
    work_done TEXT NOT NULL,
    planned_next TEXT NOT NULL,
    blockers TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'needs_changes')),
    guide_feedback TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_team_week_log UNIQUE (team_id, week_number)
);

CREATE INDEX IF NOT EXISTS idx_progress_logs_team ON progress_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_progress_logs_week ON progress_logs(week_number);
CREATE INDEX IF NOT EXISTS idx_progress_logs_status ON progress_logs(status);

-- 10. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE SET NULL,
    doc_type VARCHAR(30) NOT NULL CHECK (doc_type IN ('synopsis', 'srs', 'report', 'presentation', 'code_zip', 'internship_offer')),
    file_path VARCHAR(500) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes <= 20971520),
    mime_type VARCHAR(100) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_team ON documents(team_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(doc_type);

-- 11. FINAL SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS final_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    semester VARCHAR(20) NOT NULL,
    report_doc_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
    presentation_doc_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    git_repo_url VARCHAR(500) NOT NULL,
    demo_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'accepted')),
    coordinator_feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_team_semester UNIQUE (team_id, semester)
);

CREATE INDEX IF NOT EXISTS idx_final_submissions_team ON final_submissions(team_id);

-- 12. INTERNSHIP REQUESTS TABLE (Stretch 1)
CREATE TABLE IF NOT EXISTS internship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(150) NOT NULL,
    role_title VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    offer_doc_id UUID NOT NULL REFERENCES documents(id) ON DELETE RESTRICT,
    guide_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (guide_status IN ('pending', 'approved', 'rejected')),
    coordinator_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (coordinator_status IN ('pending', 'approved', 'rejected')),
    guide_comment TEXT,
    coordinator_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_internship_dates CHECK (end_date > start_date)
);

CREATE INDEX IF NOT EXISTS idx_internship_student ON internship_requests(student_id);

-- 13. NOTIFICATIONS TABLE (Stretch 4)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(120) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'deadline', 'success')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- 14. DEFENSE-IN-DEPTH ROW LEVEL SECURITY (RLS) POLICIES
-- Lock down all tables from direct public/anonymous PostgREST access
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE internship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
