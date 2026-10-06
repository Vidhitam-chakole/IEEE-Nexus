import os
import random
from datetime import datetime, timedelta
from backend.database import SessionLocal, engine, Base
from backend.models import (
    User, Guide, Team, TeamMember, GuidePreference,
    Allocation, Review, ReviewSlot, ProgressLog, Document
)
from backend.auth import get_password_hash

def seed_database():
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        existing_coord = db.query(User).filter(User.email == "coordinator@college.edu").first()
        if existing_coord:
            print("Database already seeded. Skipping...")
            return

        print("Seeding CapstoneTrack realistic collegiate dataset...")

        # 1. COORDINATOR
        coord = User(
            email="coordinator@college.edu",
            password_hash=get_password_hash("Coord@123"),
            full_name="Dr. Rajesh Verma",
            role="coordinator",
            department="Computer Science & Engineering",
            cgpa=None
        )
        db.add(coord)
        db.flush()

        # 2. PANEL EVALUATORS
        panel_users = [
            User(
                email="panel.oberoi@college.edu",
                password_hash=get_password_hash("Panel@123"),
                full_name="Dr. Meera Oberoi",
                role="panel",
                department="Information Technology",
                cgpa=None
            ),
            User(
                email="panel.saxena@college.edu",
                password_hash=get_password_hash("Panel@123"),
                full_name="Prof. Harish Saxena",
                role="panel",
                department="Artificial Intelligence & Data Science",
                cgpa=None
            ),
        ]
        for p in panel_users:
            db.add(p)
        db.flush()

        # 3. 10 GUIDES (Realistic domains & capacities 2-4)
        guides_data = [
            ("Dr. Arun Sharma", "arun.sharma@college.edu", ["Computer Vision", "Medical Imaging", "Edge AI"], 3),
            ("Dr. Priya Nair", "priya.nair@college.edu", ["Cloud Systems", "Microservices", "DevOps"], 3),
            ("Prof. Sanjay Kulkarni", "sanjay.kulkarni@college.edu", ["Cybersecurity", "Zero-Trust", "Cryptography"], 2),
            ("Dr. Ananya Deshmukh", "ananya.deshmukh@college.edu", ["NLP", "Large Language Models", "Multimodal AI"], 4),
            ("Dr. Vikram Mehta", "vikram.mehta@college.edu", ["IoT", "Robotics", "Embedded Systems"], 3),
            ("Prof. Sneha Patel", "sneha.patel@college.edu", ["Data Analytics", "Big Data", "Recommender Systems"], 3),
            ("Dr. Rohit Menon", "rohit.menon@college.edu", ["Full-Stack Distributed Web", "High-Throughput APIs"], 2),
            ("Dr. Kavita Rao", "kavita.rao@college.edu", ["Bioinformatics", "Genomics AI", "Computational Biology"], 3),
            ("Prof. Amit Banerjee", "amit.banerjee@college.edu", ["Augmented Reality", "Computer Graphics", "Unity/3D"], 2),
            ("Dr. Deepa Iyer", "deepa.iyer@college.edu", ["Quantum Computing", "Algorithmic Optimisation"], 2),
        ]

        created_guides = []
        for name, email, specs, max_cap in guides_data:
            guide_user = User(
                email=email,
                password_hash=get_password_hash("Guide@123"),
                full_name=name,
                role="guide",
                department="Computer Science & Engineering",
                cgpa=None
            )
            db.add(guide_user)
            db.flush()

            guide_prof = Guide(
                user_id=guide_user.id,
                specialisations=specs,
                max_teams=max_cap
            )
            db.add(guide_prof)
            db.flush()
            created_guides.append(guide_prof)

        # 4. STUDENTS: 36 grouped into 12 teams of 3 + 4 ungrouped students = 40 students
        student_names = [
            ("Aarav Joshi", 9.4), ("Diya Sen", 8.8), ("Kabir Kapoor", 8.5),
            ("Ishaan Malhotra", 9.1), ("Ananya Gupta", 8.9), ("Rohan Verma", 8.2),
            ("Zoya Akhtar", 8.7), ("Aditya Roy", 8.4), ("Pooja Hegde", 8.6),
            ("Tanvi Shukla", 9.5), ("Manish Pandey", 9.0), ("Shruti Hassan", 8.7),
            ("Dev Patel", 8.1), ("Sneha Kulkarni", 8.5), ("Karan Johar", 7.9),
            ("Rhea Chakraborty", 8.3), ("Varun Dhawan", 8.2), ("Siddharth Nigam", 8.0),
            ("Tara Sutaria", 9.2), ("Kartik Aaryan", 8.6), ("Kriti Sanon", 8.9),
            ("Ayushmann Khurrana", 8.8), ("Bhumi Pednekar", 8.5), ("Yami Gautam", 8.1),
            ("Rajkummar Rao", 9.3), ("Patralekha Paul", 8.7), ("Pankaj Tripathi", 9.0),
            ("Nawazuddin Siddiqui", 8.4), ("Radhika Apte", 8.8), ("Jaideep Ahlawat", 8.2),
            ("Manoj Bajpayee", 9.6), ("Kay Kay Menon", 8.9), ("Shefali Shah", 9.1),
            ("Vijay Varma", 8.5), ("Tillotama Shome", 8.7), ("Rasika Dugal", 8.3),
            # 4 Solo ungrouped students
            ("Rohan Singh (Solo)", 8.2), ("Megha Rao (Solo)", 8.6),
            ("Nikhil Deshmukh (Solo)", 7.8), ("Preeti Nair (Solo)", 8.4)
        ]

        created_students = []
        for i, (s_name, cgpa) in enumerate(student_names):
            clean_email = s_name.lower().split(" ")[0] + f".{i+1}@college.edu"
            s_user = User(
                email=clean_email,
                password_hash=get_password_hash("Student@123"),
                full_name=s_name,
                role="student",
                department="Computer Science & Engineering",
                cgpa=cgpa
            )
            db.add(s_user)
            db.flush()
            created_students.append(s_user)

        # 5. 12 TEAMS (3 members each)
        project_titles = [
            ("Team 1: AeroNexus", "Autonomous Search & Rescue Drone with Edge Vision"),
            ("Team 2: CloudPulse", "Distributed Observability Mesh for Cloud Native Microservices"),
            ("Team 3: ZeroTrustVault", "Decentralized Zero-Trust Key Management for Enterprise"),
            ("Team 4: MediFederate", "Privacy-Preserving Federated Learning for Oncology Imaging"),
            ("Team 5: AgroSense", "Precision Agriculture IoT Network with Real-Time Soil Telemetry"),
            ("Team 6: TrendCast", "Big Data Clickstream Analytics with Real-Time Predictive ML"),
            ("Team 7: NextFlow", "High-Throughput Reactive Workflow Engine with Distributed Caching"),
            ("Team 8: GenomeMap", "Deep Learning for Structural Variant Discovery in Genomics"),
            ("Team 9: HoloClass", "Immersive WebXR Simulation Platform for Surgical Anatomy"),
            ("Team 10: QuantumCrypto", "Post-Quantum Lattice-Based Cryptographic Key Exchange"),
            ("Team 11: AutoTutor", "Conversational AI Tutor with Dynamic Socratic Dialogues"),
            ("Team 12: SmartGrid", "Decentralized Peer-to-Peer Energy Trading Microgrid")
        ]

        created_teams = []
        for idx in range(12):
            team_num = idx + 1
            t_name, t_title = project_titles[idx]
            members_chunk = created_students[idx*3 : (idx+1)*3]
            lead_user = members_chunk[0]
            avg_cgpa = round(sum(m.cgpa for m in members_chunk) / 3.0, 2)

            team = Team(
                code=f"NX{100 + team_num}",
                name=t_name,
                project_title=t_title,
                lead_id=lead_user.id,
                is_locked=True,  # Locked & ready for allocation
                avg_cgpa=avg_cgpa,
                preference_submitted_at=datetime.utcnow() - timedelta(days=5 - (idx * 0.2))
            )
            db.add(team)
            db.flush()
            created_teams.append(team)

            # Add 3 members
            for s in members_chunk:
                member = TeamMember(team_id=team.id, student_id=s.id)
                db.add(member)
            db.flush()

            # Assign 3 realistic ranked guide preferences
            # Varied guides so choice distribution is interesting
            pref_guide_indices = [
                (idx % 10),
                ((idx + 2) % 10),
                ((idx + 5) % 10)
            ]
            for rank_num, g_idx in enumerate(pref_guide_indices, start=1):
                pref = GuidePreference(
                    team_id=team.id,
                    guide_id=created_guides[g_idx].id,
                    rank=rank_num
                )
                db.add(pref)
            db.flush()

        # 6. ALLOCATION STATE:
        # Pre-allocate Teams 1, 2, 3 so coordinator dashboard & heatmap have active logs
        # Teams 4 through 12 remain UNALLOCATED so the coordinator can click "Run Allocation" live!
        pre_allocations = [
            (created_teams[0], created_guides[0], 1),  # Team 1 -> Dr. Arun Sharma (Rank 1)
            (created_teams[1], created_guides[1], 1),  # Team 2 -> Dr. Priya Nair (Rank 1)
            (created_teams[2], created_guides[2], 1),  # Team 3 -> Prof. Sanjay Kulkarni (Rank 1)
        ]
        for tm, gd, rk in pre_allocations:
            alloc = Allocation(
                team_id=tm.id,
                guide_id=gd.id,
                allocated_rank=rk,
                is_manual_override=False,
                allocated_at=datetime.utcnow() - timedelta(days=14)
            )
            db.add(alloc)
        db.flush()

        # 7. 3 REVIEW CYCLES
        review1 = Review(
            title="Review 1: Synopsis & Feasibility",
            phase=1,
            start_date=(datetime.utcnow() + timedelta(days=3)).strftime("%Y-%m-%d"),
            end_date=(datetime.utcnow() + timedelta(days=5)).strftime("%Y-%m-%d"),
            slot_duration_mins=30,
            is_active=True
        )
        review2 = Review(
            title="Review 2: Mid-Term SRS & System Design",
            phase=2,
            start_date=(datetime.utcnow() + timedelta(days=25)).strftime("%Y-%m-%d"),
            end_date=(datetime.utcnow() + timedelta(days=27)).strftime("%Y-%m-%d"),
            slot_duration_mins=30,
            is_active=False
        )
        review3 = Review(
            title="Review 3: Final Implementation & Defense",
            phase=3,
            start_date=(datetime.utcnow() + timedelta(days=60)).strftime("%Y-%m-%d"),
            end_date=(datetime.utcnow() + timedelta(days=62)).strftime("%Y-%m-%d"),
            slot_duration_mins=45,
            is_active=False
        )
        db.add_all([review1, review2, review3])
        db.flush()

        # 8. PRE-SCHEDULE SLOTS FOR REVIEW 1 (For the 3 pre-allocated teams)
        slot_base_time = datetime.utcnow() + timedelta(days=3, hours=9)
        for i, (tm, _, _) in enumerate(pre_allocations):
            slot = ReviewSlot(
                review_id=review1.id,
                team_id=tm.id,
                panel_user_id=panel_users[i % 2].id,
                room_or_link=f"Seminar Hall {401 + i}",
                start_time=slot_base_time + timedelta(minutes=i * 35),
                end_time=slot_base_time + timedelta(minutes=(i * 35) + 30),
                status="scheduled"
            )
            db.add(slot)
        db.flush()

        # 9. WEEKLY LOGS FOR PRE-ALLOCATED TEAMS (Across weeks 1 to 4)
        # Mix of approved, submitted, and missing
        # Team 1: Consistent (Weeks 1, 2, 3 Approved; Week 4 Submitted)
        # Team 2: Needs attention (Week 1 Approved; Week 2 Needs Changes; Week 3 Missing)
        # Team 3: Falling behind (Week 1 Approved; No logs in last 12 days -> Falling Behind alert!)
        logs_seed = [
            # Team 1 logs
            (created_teams[0], created_teams[0].lead_id, 1, "Completed problem definition and literature review of 15 IEEE papers on drone SLAM.", "Finalize hardware drone specs and ROS2 simulator.", "No blockers.", "approved", "Excellent literature review. Proceed with ROS2 gazebo simulations.", datetime.utcnow() - timedelta(days=21)),
            (created_teams[0], created_teams[0].lead_id, 2, "Configured Gazebo simulation environment and tested stereo camera vision feed.", "Integrate YOLOv8-nano on simulated drone feed.", "Slight GPU driver issue in gazebo.", "approved", "Good progress on Gazebo setup.", datetime.utcnow() - timedelta(days=14)),
            (created_teams[0], created_teams[0].lead_id, 3, "Benchmarked YOLOv8-nano inference speed: achieved 42 FPS on edge simulator.", "Test obstacle avoidance algorithm with simulated LiDAR.", "None.", "approved", "Solid benchmarks. Keep this momentum.", datetime.utcnow() - timedelta(days=7)),
            (created_teams[0], created_teams[0].lead_id, 4, "Integrated A* path planning with 2D occupancy grid map.", "Deploy to physical drone flight controller.", "Awaiting ESC parts delivery.", "submitted", None, datetime.utcnow() - timedelta(days=1)),

            # Team 2 logs
            (created_teams[1], created_teams[1].lead_id, 1, "Architected microservices topology using eBPF probes for network tracing.", "Setup Kubernetes test cluster.", "Minikube memory consumption high.", "approved", "Scope looks solid. Monitor memory usage.", datetime.utcnow() - timedelta(days=21)),
            (created_teams[1], created_teams[1].lead_id, 2, "Installed Cilium and Grafana Tempo for distributed trace visualization.", "Build custom eBPF packet capture filter.", "eBPF verifier rejected custom filter.", "needs_changes", "Please refer to the kernel documentation for BPF verifier memory bounds.", datetime.utcnow() - timedelta(days=14)),

            # Team 3 logs (Older log only -> triggers 'falling behind' table!)
            (created_teams[2], created_teams[2].lead_id, 1, "Defined threat model and cryptographic threat vectors for enterprise vaults.", "Implement Shamir Secret Sharing in Go.", "Key derivation algorithm choice pending.", "approved", "Ensure constant-time cryptographic primitives are selected.", datetime.utcnow() - timedelta(days=18)),
        ]

        for tm, stud_id, wk, done, planned, blk, stat, feedback, dt in logs_seed:
            log = ProgressLog(
                team_id=tm.id,
                student_id=stud_id,
                week_number=wk,
                work_done=done,
                planned_next=planned,
                blockers=blk,
                status=stat,
                guide_feedback=feedback,
                reviewed_at=dt + timedelta(days=1) if feedback else None,
                created_at=dt
            )
            db.add(log)
        db.flush()

        db.commit()
        print("Successfully seeded all realistic dataset entities!")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
