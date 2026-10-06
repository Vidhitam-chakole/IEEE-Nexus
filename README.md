# CapstoneTrack — Final-Year Project & Internship Tracker

> A modern, collegiate Capstone Project & Internship Management ERP replacing fragmented WhatsApp groups and manual spreadsheets with deterministic guide allocation, conflict-free review scheduling, continuous weekly progress logbooks, and live 12-week coordinator heatmaps.

### 🌐 Live Production Deployments
- **Primary Vercel URL**: [https://capstonetrack-app.vercel.app](https://capstonetrack-app.vercel.app)
- **Alternate Vercel Mirror**: [https://capstonetrack-hub.vercel.app](https://capstonetrack-hub.vercel.app)
- **GitHub Repository**: [https://github.com/Vidhitam-chakole/IEEE-Nexus](https://github.com/Vidhitam-chakole/IEEE-Nexus)

---

## 1. Features Overview

### 🎯 Core MVP Modules
1. **Team Formation & Join Codes**:
   - Students form teams with unique 6-character alphanumeric join codes (e.g. `NX104`).
   - Strict business rules enforced: strictly 1 team per student (enforced by DB unique constraints), team sizes of 2–4 members, 1 designated team lead.
   - Lead locks the team roster to finalize average CGPA before submitting preferences.
2. **Guide Allocation Engine with Load Balancing (Most Important)**:
   - Faculty guides have supervision capacities (2–4 teams each, editable by coordinator).
   - Locked teams submit an ordered ranking of 3 distinct faculty preferences.
   - Deterministic Many-to-One matching algorithm prioritizing teams by Academic Merit (average CGPA) or Submission Timestamp.
   - Automatically handles guide saturation, cascade to choices 2 & 3, manual coordinator overrides, and intelligent headroom suggestions for unallocated teams.
3. **Conflict-Free Review Scheduling**:
   - Coordinator schedules evaluation milestones (Review 1: Synopsis, Review 2: Mid-Term SRS, Review 3: Final Defense).
   - Zero-conflict scheduling engine arranges presentation slots ensuring no team, guide, panel member, or physical room is double-booked.
   - Real-time reschedule conflict detection.
4. **Weekly Progress Logbooks & Deliverables**:
   - Students submit weekly logs (work accomplished, planned next, blockers).
   - Guides sign off as `approved` or request revisions with feedback remarks.
   - File upload pipeline with 20MB limit and MIME validation (`.pdf`, `.docx`, `.pptx`, `.zip`), partitioned on disk with auto-incrementing version history (`v1`, `v2`, ...).
5. **Semester Final Submissions**:
   - Team lead submits the final semester dossier: final report, Git repository URL, live deployment link, and presentation slides.
   - Coordinator marks submissions as `draft`, `submitted`, or `accepted` with formal sign-off.
6. **Coordinator Control Center & Progress Heatmap**:
   - Real-time KPI summary cards: Total Teams, Unallocated Teams, Guides at Capacity, Active Reviews.
   - **"Teams Falling Behind" table**: automatically flags teams with no progress log in the last 7+ days in high-visibility red with days overdue.
   - **12-Week Progress Heatmap**: matrix of teams (rows) $\times$ weeks 1..12 (columns) color-coded by submission status (Green = Approved, Amber = Submitted, Red = Missing).
   - Visual guide load distribution bars and capacity adjusters.

### ✨ Aesthetic & 3D Innovations
- **Bespoke Claymorphism Design System**: Tactile, soft 3D clay aesthetic with inflated border radii (28–40px), pill buttons, inset pressed input fields, layered drop/inset box-shadows, and pastel color palettes.
- **Scroll-Driven 3D Storytelling**: Fixed Three.js canvas featuring a procedural clay graduation cap with floating tassel, synced via GSAP ScrollTrigger through 7 narrative stages (Hero, Problem, Solution, HUD lifecycle, Stats strip, Roles orbit, Final CTA).
- **Zero 3D Overhead in Portals**: The 3D scene is strictly isolated to the marketing landing page, ensuring the authenticated dashboards render with instant, lightweight speed.

### 🚀 Stretch Features Included
- **Internship Approval Workflow**: Dual-tier approval (Offer Letter upload $\to$ Guide approval $\to$ Coordinator final NOC).
- **Similarity Check Stub**: Automated originality check hook returning similarity percentage scores on document uploads.

---

## 2. Prerequisites

- **Python**: Version 3.10 or higher (Tested on Python 3.14)
- **Node.js**: Version 18.0 or higher (Tested on Node v24.20)
- **Git**: Installed and available in terminal

---

## 3. Step-by-Step Installation & Run Guide

### 3.1 Backend Setup (FastAPI & Database)

#### Windows (PowerShell):
```powershell
# 1. Open project root
cd "c:\Users\Dell\OneDrive\Desktop\IEEE Nexus"

# 2. Create and activate Python virtual environment
python -m venv backend\venv
.\backend\venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r backend\requirements.txt

# 4. Copy environment configuration
Copy-Item .env.example .env

# 5. Run database migrations & seed realistic collegiate dataset
python -m backend.seed

# 6. Start FastAPI server with live reloading
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

#### macOS / Linux (Bash):
```bash
# 1. Open project root
cd /path/to/IEEE\ Nexus

# 2. Create and activate virtual environment
python3 -m venv backend/venv
source backend/venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Copy environment configuration
cp .env.example .env

# 5. Run database seed
python -m backend.seed

# 6. Start FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

*The API will be live at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.*

---

### 3.2 Frontend Setup (React 18 + Vite)

#### Windows / macOS / Linux:
```bash
# 1. Navigate to frontend folder
cd frontend

# 2. Install npm dependencies
npm install

# 3. Launch Vite development server
npm run dev
```

*The frontend application will be live at `http://localhost:5173`.*

---

## 4. Environment Variables Explained

The `.env` file at the project root supports the following variables:

| Variable | Description | Default Value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Supabase) or SQLite fallback | `sqlite:///./capstonetrack.db` |
| `JWT_SECRET` | Secret key used for signing HS256 authentication tokens | `super-secret-capstonetrack-jwt-token-key-2026` |
| `JWT_ALGORITHM` | Algorithm used for token generation | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime duration in minutes (24 hours) | `1440` |
| `PORT` | API server listen port | `8000` |

### Connecting to Supabase Hosted PostgreSQL
To use your hosted Supabase PostgreSQL database:
1. In your Supabase Project Settings $\to$ Database, copy the Connection String URI.
2. In your `.env`, set:
   ```env
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
3. Run the versioned SQL migration in [001_initial_schema.sql](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/backend/migrations/001_initial_schema.sql) either via Supabase SQL Editor or by running `python -m backend.seed`.

---

## 5. Demo Login Credentials for All 4 Roles

The application comes pre-seeded with realistic collegiate accounts. You can type these manually or use the **1-Click Demo Profile buttons** on the login screen:

| Role | Name & Title | Email Address | Password |
|---|---|---|---|
| **Coordinator** | Dr. Rajesh Verma (Head of Projects) | `coordinator@college.edu` | `Coord@123` |
| **Guide** | Dr. Arun Sharma (AI/ML & Vision) | `arun.sharma@college.edu` | `Guide@123` |
| **Guide** | Dr. Priya Nair (Cloud & DevOps) | `priya.nair@college.edu` | `Guide@123` |
| **Student Lead (Allocated)** | Aarav Joshi (Team 1: AeroNexus) | `aarav.1@college.edu` | `Student@123` |
| **Student Lead (Unallocated)** | Tanvi Shukla (Team 4: MediFederate) | `tanvi.10@college.edu` | `Student@123` |
| **Solo Student (Ungrouped)** | Rohan Singh (Solo) | `rohan.37@college.edu` | `Student@123` |
| **Review Panel Evaluator** | Dr. Meera Oberoi (External Expert) | `panel.oberoi@college.edu` | `Panel@123` |

---

## 6. Guided Demo Walkthrough

Follow this step-by-step path to experience the complete platform lifecycle:

1. **Step 1: Experience the Landing Page**:
   - Open `http://localhost:5173/`.
   - Scroll down slowly: observe the 3D clay graduation cap floating, wobbling left into coral in the Problem section, returning and rotating in the Solution section, cycling through the `[TEAM] [GUIDE] [REVIEWS] [LOGS] [SUBMIT]` HUD arc, and highlighting the 3 stats columns with dot-matrix counts.
2. **Step 2: Sign in as Coordinator & Run Guide Allocation**:
   - Click **Open Portal** or go to `http://localhost:5173/login`.
   - Click the **Coordinator** 1-click button and sign in.
   - Observe the 12-week heatmap showing active logs for Teams 1, 2, and 3, and the red alert for teams falling behind.
   - Click **"Run Allocation"** in the top right. Watch the engine evaluate all 12 teams, calculate choice satisfaction (e.g. 85%+), and balance loads across all 10 faculty guides in real time!
3. **Step 3: Auto-Schedule Presentation Reviews**:
   - Scroll to the Review Milestones section and select "Review 1".
   - Click **"Auto-Schedule Slots"**. The scheduler distributes all teams across seminar halls and panel evaluators with zero conflicts.
4. **Step 4: Student Team Formation (Solo Student)**:
   - Log out, then select **Solo Student** (`Rohan Singh`) on the login screen.
   - Form a new team or enter code `NX104` to join Team 4.
5. **Step 5: Student Logbook Submission**:
   - Sign in as **Student Lead** (`Aarav Joshi`).
   - Fill out the Week 5 progress log (Tasks completed, planned next, blockers) and click **Submit Weekly Log**.
   - Upload a new PDF under Deliverables and observe the version tag increment to `v2`.
6. **Step 6: Guide Verification & Sign-Off**:
   - Sign in as **Guide** (`Dr. Arun Sharma`).
   - Open Team 1's logbook, click **Approve Log**, enter review remarks, and submit. The status immediately updates to `APPROVED` across the platform and reflects on the coordinator's heatmap!

---

## 7. How the Code Works

### 7.1 Architecture & Request Flow
```
Browser (React SPA)
       │ (Axios with Bearer JWT interceptor)
       ▼
FastAPI Gateway (/api/v1)
       │ (FastAPI Dependency: require_role(['coordinator', ...]))
       ▼
Router Endpoints (/routers/*.py)
       │ (Pydantic v2 Payload Validation)
       ▼
Algorithmic Engines & Services (allocation.py / scheduler.py)
       │ (SQLAlchemy ORM Transactions)
       ▼
PostgreSQL / Supabase Database
```

### 7.2 Backend Modules (`/backend`)
- [models.py](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/backend/models.py): Defines 13 SQLAlchemy ORM models with foreign keys and unique constraints (`UNIQUE(student_id)` enforces strictly 1 team per student).
- [auth.py](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/backend/auth.py): Handles bcrypt salted password hashing, JWT issue/verification, and `require_role(...)` RBAC dependency.
- [allocation.py](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/backend/allocation.py): Pure Many-to-One preference matching engine handling load limits, tie-breakers, manual overrides, and headroom recommendations.
- [scheduler.py](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/backend/scheduler.py): Pure review scheduling engine with hard constraints preventing overlapping slots for teams, guides, panel members, and rooms.
- [routers/](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/backend/routers): Modular FastAPI routers for `auth`, `teams`, `allocation`, `reviews`, `logs`, `documents`, `submissions`, `coordinator`, and `internships`.

### 7.3 Frontend Structure (`/frontend/src`)
- [styles/tokens.css](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/frontend/src/styles/tokens.css): Single design token file containing all claymorphic layered shadows, pastel surfaces, border radii, and accessible high-contrast color tokens.
- [three/HeroObject.jsx](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/frontend/src/three/HeroObject.jsx): Swappable procedural 3D clay graduation cap assembled from `@react-three/drei` primitives with idle floating physics and a 4-blob role orbit split.
- [three/scrollKeyframes.js](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/frontend/src/three/scrollKeyframes.js): Configuration file mapping normalized scroll progress ($0.0 \to 1.0$) to 3D object position, rotation, scale, color, and section status.
- [pages/](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/frontend/src/pages): Role-specific views (`LandingPage`, `LoginPage`, `StudentDashboard`, `GuideDashboard`, `CoordinatorDashboard`, `PanelDashboard`).

---

## 8. Algorithmic Explanations

### 8.1 Guide Allocation Algorithm
Given student teams $T = \{t_1, t_2, \dots, t_N\}$ and guides $G = \{g_1, g_2, \dots, g_M\}$ with capacity $C(g_j)$:
1. **Preserve Overrides**: Teams previously manually assigned by the coordinator are held constant, decrementing the respective guide's remaining capacity $C(g_j) \leftarrow C(g_j) - 1$.
2. **Priority Sort**: Eligible candidate teams are sorted by priority:
   - In **Academic Merit Mode**: $(- \text{avg\_cgpa}, \text{preference\_submitted\_at}, \text{created\_at}, \text{team\_id})$.
   - In **FCFS Mode**: $(\text{preference\_submitted\_at}, - \text{avg\_cgpa}, \text{created\_at}, \text{team\_id})$.
3. **Greedy Assignment**:
   - For each team, evaluate ranked choices $r \in [1, 2, 3]$.
   - If guide $g_r$ has $C(g_r) > 0$, assign $t_i \to g_r$ and decrement $C(g_r) \leftarrow C(g_r) - 1$.
   - If all 3 choices are saturated, mark team as `unallocated` and suggest faculty with the greatest remaining capacity.
4. **Time Complexity**: $O(N \log N + M \log M)$, executing in $< 5 \text{ ms}$ for standard collegiate cohort sizes.

### 8.2 Review Scheduling Conflict Validation
When a slot is created or rescheduled at $[s, e)$ for team $t$, guide $g$, panelist $p$, and room $r$, the engine verifies:
$$\forall \text{ active slot } s' \ne \text{target}, \quad [s', e') \cap [s, e) \ne \emptyset \implies (t' \ne t \land g' \ne g \land p' \ne p \land r' \ne r)$$
If any collision is detected, the operation is blocked and returns an exact conflict explanation (e.g., `"Guide Dr. Sharma is already scheduled in slot 10:30 - 11:00 with Team 3"`).

---

## 9. Customization & Theming

### Changing the Claymorphism Theme
All colors, radii, and shadows reside in [tokens.css](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/frontend/src/styles/tokens.css).
- To switch the primary accent color from violet to coral, update:
  ```css
  --accent-primary: #FF6B6B;
  --accent-hover: #EE5252;
  ```
- To adjust the card puffiness or shadow depth:
  ```css
  --shadow-clay-card:
    14px 14px 28px rgba(120, 100, 180, 0.28),
    -10px -10px 24px rgba(255, 255, 255, 0.95),
    inset 6px 6px 12px rgba(255, 255, 255, 0.8),
    inset -6px -6px 12px rgba(120, 100, 180, 0.16);
  ```

### Customizing the 3D Hero Object
The 3D graduation cap is isolated in [HeroObject.jsx](file:///c:/Users/Dell/OneDrive/Desktop/IEEE%20Nexus/frontend/src/three/HeroObject.jsx). To replace it with a custom 3D model (e.g. `.glb` file), load the model with `@react-three/drei`'s `useGLTF('/model.glb')` and bind the `groupRef` to its root.

---

## 10. Running Test Suites

Run the full pytest suite for allocation, review scheduling, and API integration:

```powershell
# Run all tests
backend\venv\Scripts\pytest.exe -v
```

Expected output:
```
backend/tests/test_allocation.py ......  [100%] (6 passed)
backend/tests/test_scheduler.py .....   [100%] (5 passed)
backend/tests/test_api_endpoints.py .... [100%] (4 passed)
======================= 15 passed in 3.90s =======================
```

---

## 11. Troubleshooting & Known Limitations

1. **Supabase Direct Connection**: If running against remote Supabase Postgres, ensure your network allows outbound connections to port 5432 and SSL mode `require` is enabled in your connection string.
2. **File Upload Size**: Uploads exceeding 20MB are rejected by both FastAPI Pydantic middleware and the database constraint `CHECK(file_size_bytes <= 20971520)`.
3. **Hardware Acceleration**: The landing page 3D canvas requires WebGL. In environments where WebGL is unsupported or `prefers-reduced-motion` is active, the app renders an accessible 2D clay illustration.
#   I E E E - N e x u s  
 