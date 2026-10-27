"""
Seed script — creates full sample database for Institution-Wide College Event Management System.

Populates:
  - 9 Academic Departments (MCA, MBA, M.Tech, B.Tech, BBA, BCA, B.Com, B.Sc, M.Sc)
  - 8 Event Categories (Technical, Management, Academic, Cultural, Sports, Career, Social, Club)
  - Multi-Role Users (Super Admin, Coordinators, Faculty, Students)
  - 34+ Rich Realistic Events across categories, departments, modes, and statuses
  - Teams, Registrations, Attendance, Certificates, Feedbacks, Results, Announcements, Notifications
"""
import io
import os
import sys
import argparse
from datetime import datetime, timedelta, timezone

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from app import create_app, db
from app.models.department import Department
from app.models.user import User
from app.models.category import EventCategory
from app.models.event import Event
from app.models.team import Team, TeamMember
from app.models.registration import Registration
from app.models.attendance import Attendance
from app.models.certificate import Certificate
from app.models.notification import Notification, Announcement
from app.models.bookmark import Bookmark
from app.models.feedback import EventFeedback, EventResult
from app.models.audit_log import AuditLog


SAMPLE_DEPARTMENTS = [
    {
        "name": "Master of Computer Applications",
        "code": "MCA",
        "description": "Postgraduate department focusing on software engineering, cloud architecture, and artificial intelligence.",
        "coordinator_name": "Dr. Ramesh Sharma",
        "coordinator_email": "ramesh.sharma@college.edu",
        "programs": ["MCA Regular (2 Years)", "MCA Integrated (5 Years)"],
    },
    {
        "name": "Master of Business Administration",
        "code": "MBA",
        "description": "Premier business school fostering leadership, entrepreneurial mindset, finance, and marketing strategies.",
        "coordinator_name": "Prof. Meera Pillai",
        "coordinator_email": "meera.pillai@college.edu",
        "programs": ["MBA Marketing", "MBA Finance", "MBA Human Resources", "MBA Business Analytics"],
    },
    {
        "name": "Master of Technology",
        "code": "MTECH",
        "description": "Advanced engineering research in VLSI, Data Science, Cyber Security, and Autonomous Systems.",
        "coordinator_name": "Dr. Anirudh Sen",
        "coordinator_email": "anirudh.sen@college.edu",
        "programs": ["M.Tech Computer Science", "M.Tech AI & Data Science", "M.Tech VLSI Design"],
    },
    {
        "name": "Bachelor of Technology",
        "code": "BTECH",
        "description": "Undergraduate engineering department covering CSE, Electronics, Mechanical, and Robotics.",
        "coordinator_name": "Dr. Rajesh Gupta",
        "coordinator_email": "rajesh.gupta@college.edu",
        "programs": ["B.Tech Computer Science", "B.Tech AI & ML", "B.Tech Electronics & Comm", "B.Tech Mechanical"],
    },
    {
        "name": "Bachelor of Business Administration",
        "code": "BBA",
        "description": "Undergraduate program developing foundational corporate governance, management, and startup skills.",
        "coordinator_name": "Prof. Sunita Verma",
        "coordinator_email": "sunita.verma@college.edu",
        "programs": ["BBA General", "BBA International Business", "BBA Digital Marketing"],
    },
    {
        "name": "Bachelor of Computer Applications",
        "code": "BCA",
        "description": "Undergraduate computing department emphasizing web technologies, mobile apps, and systems programming.",
        "coordinator_name": "Prof. Amit Saxena",
        "coordinator_email": "amit.saxena@college.edu",
        "programs": ["BCA Regular", "BCA Cloud & DevOps"],
    },
    {
        "name": "Bachelor of Commerce",
        "code": "BCOM",
        "description": "Focusing on corporate accounting, taxation, fintech, and economic policy.",
        "coordinator_name": "Dr. Sanjay Deshmukh",
        "coordinator_email": "sanjay.deshmukh@college.edu",
        "programs": ["B.Com Honours", "B.Com Accounting & Finance"],
    },
    {
        "name": "Bachelor of Science",
        "code": "BSC",
        "description": "Undergraduate scientific research in Mathematics, Physics, Biotechnology, and Statistics.",
        "coordinator_name": "Dr. Neha Kulkarni",
        "coordinator_email": "neha.kulkarni@college.edu",
        "programs": ["B.Sc Computer Science", "B.Sc Biotechnology", "B.Sc Data Science"],
    },
    {
        "name": "Master of Science",
        "code": "MSC",
        "description": "Advanced postgraduate sciences in Pure Mathematics, Applied Physics, and Computational Biology.",
        "coordinator_name": "Dr. Vikram Joshi",
        "coordinator_email": "vikram.joshi@college.edu",
        "programs": ["M.Sc Mathematics", "M.Sc Data Science", "M.Sc Biotechnology"],
    },
]

SAMPLE_CATEGORIES = [
    {
        "name": "Technical & Computing",
        "code": "TECH",
        "description": "Hackathons, competitive coding, robotics, AI workshops, and system development challenges.",
        "icon": "Code2",
        "color": "#3b82f6",
    },
    {
        "name": "Management & Business",
        "code": "MGMT",
        "description": "B-plan pitch competitions, marketing strategizing, fintech games, and leadership summits.",
        "icon": "Briefcase",
        "color": "#10b981",
    },
    {
        "name": "Academic & Research",
        "code": "ACAD",
        "description": "Conferences, IEEE paper presentations, faculty seminars, and research methodology colloquiums.",
        "icon": "GraduationCap",
        "color": "#8b5cf6",
    },
    {
        "name": "Cultural & Entertainment",
        "code": "CULT",
        "description": "Music fests, dance battles, drama performances, photography contests, and literary debates.",
        "icon": "Sparkles",
        "color": "#ec4899",
    },
    {
        "name": "Sports & Fitness",
        "code": "SPORTS",
        "description": "Cricket, football, badminton, chess tournaments, athletic meets, and yoga sessions.",
        "icon": "Trophy",
        "color": "#f59e0b",
    },
    {
        "name": "Career & Placement",
        "code": "CAREER",
        "description": "Resume masterclasses, mock interviews, corporate networking, and recruitment drives.",
        "icon": "Compass",
        "color": "#06b6d4",
    },
    {
        "name": "Social Responsibility",
        "code": "SOCIAL",
        "description": "Blood donation drives, campus green initiatives, NGO volunteering, and road safety awareness.",
        "icon": "HeartHandshake",
        "color": "#ef4444",
    },
    {
        "name": "Department & Clubs",
        "code": "CLUB",
        "description": "Student club meetups, orientation sessions, coding circles, and alumni interactions.",
        "icon": "Users",
        "color": "#6366f1",
    },
]


def seed(reset=False):
    app = create_app()
    with app.app_context():
        if reset:
            print("🔄  Dropping and recreating all tables...")
            db.drop_all()

        db.create_all()
        print("✅  Tables initialized.")

        now = datetime.now(timezone.utc)

        # 1. Seed Departments
        dept_map = {}
        for d_info in SAMPLE_DEPARTMENTS:
            dept = Department.query.filter_by(code=d_info["code"]).first()
            if not dept:
                dept = Department(
                    name=d_info["name"],
                    code=d_info["code"],
                    description=d_info["description"],
                    coordinator_name=d_info["coordinator_name"],
                    coordinator_email=d_info["coordinator_email"],
                    programs=d_info["programs"],
                )
                db.session.add(dept)
                db.session.flush()
            dept_map[dept.code] = dept
        db.session.commit()
        print(f"✅  Seeded {len(dept_map)} Departments.")

        # 2. Seed Categories
        cat_map = {}
        for c_info in SAMPLE_CATEGORIES:
            cat = EventCategory.query.filter_by(code=c_info["code"]).first()
            if not cat:
                cat = EventCategory(
                    name=c_info["name"],
                    code=c_info["code"],
                    description=c_info["description"],
                    icon=c_info["icon"],
                    color=c_info["color"],
                )
                db.session.add(cat)
                db.session.flush()
            cat_map[cat.code] = cat
        db.session.commit()
        print(f"✅  Seeded {len(cat_map)} Event Categories.")

        # 3. Seed Users (Super Admin, Coordinators, Faculty, Students)
        users_to_create = [
            # Super Admin
            {
                "email": "superadmin@college.edu",
                "password": "Admin@123",
                "full_name": "Dr. Arthur Campbell",
                "role": "super_admin",
                "dept_code": None,
                "program": "Central Administration",
                "roll_number": "ADM-001",
            },
            # Department Coordinators
            {
                "email": "mca.coord@college.edu",
                "password": "Admin@123",
                "full_name": "Dr. Ramesh Sharma",
                "role": "dept_coordinator",
                "dept_code": "MCA",
                "program": "MCA Faculty",
                "roll_number": "FAC-MCA-01",
            },
            {
                "email": "mba.coord@college.edu",
                "password": "Admin@123",
                "full_name": "Prof. Meera Pillai",
                "role": "dept_coordinator",
                "dept_code": "MBA",
                "program": "MBA Faculty",
                "roll_number": "FAC-MBA-01",
            },
            {
                "email": "mtech.coord@college.edu",
                "password": "Admin@123",
                "full_name": "Dr. Anirudh Sen",
                "role": "dept_coordinator",
                "dept_code": "MTECH",
                "program": "M.Tech Faculty",
                "roll_number": "FAC-MTECH-01",
            },
            {
                "email": "btech.coord@college.edu",
                "password": "Admin@123",
                "full_name": "Dr. Rajesh Gupta",
                "role": "dept_coordinator",
                "dept_code": "BTECH",
                "program": "Engineering Faculty",
                "roll_number": "FAC-BTECH-01",
            },
            {
                "email": "bca.coord@college.edu",
                "password": "Admin@123",
                "full_name": "Prof. Amit Saxena",
                "role": "dept_coordinator",
                "dept_code": "BCA",
                "program": "Computing Faculty",
                "roll_number": "FAC-BCA-01",
            },
            # Faculty Incharge / Approver
            {
                "email": "faculty.approver@college.edu",
                "password": "Admin@123",
                "full_name": "Dr. Vikram Joshi",
                "role": "faculty_coordinator",
                "dept_code": "MSC",
                "program": "Academic Affairs",
                "roll_number": "FAC-MSC-01",
            },
            # Students
            {
                "email": "alex.mca@college.edu",
                "password": "Student@123",
                "full_name": "Alex Rivera",
                "role": "student",
                "dept_code": "MCA",
                "program": "MCA Regular (2 Years)",
                "roll_number": "MCA-2026-001",
            },
            {
                "email": "priya.mba@college.edu",
                "password": "Student@123",
                "full_name": "Priya Nair",
                "role": "student",
                "dept_code": "MBA",
                "program": "MBA Marketing",
                "roll_number": "MBA-2026-014",
            },
            {
                "email": "rohit.btech@college.edu",
                "password": "Student@123",
                "full_name": "Rohit Verma",
                "role": "student",
                "dept_code": "BTECH",
                "program": "B.Tech Computer Science",
                "roll_number": "BT-CSE-2026-088",
            },
            {
                "email": "ananya.bca@college.edu",
                "password": "Student@123",
                "full_name": "Ananya Sharma",
                "role": "student",
                "dept_code": "BCA",
                "program": "BCA Regular",
                "roll_number": "BCA-2026-042",
            },
            {
                "email": "kevin.bba@college.edu",
                "password": "Student@123",
                "full_name": "Kevin D'Souza",
                "role": "student",
                "dept_code": "BBA",
                "program": "BBA International Business",
                "roll_number": "BBA-2026-029",
            },
            {
                "email": "sneha.mtech@college.edu",
                "password": "Student@123",
                "full_name": "Sneha Roy",
                "role": "student",
                "dept_code": "MTECH",
                "program": "M.Tech AI & Data Science",
                "roll_number": "MT-AI-2026-007",
            },
            {
                "email": "tanvi.bcom@college.edu",
                "password": "Student@123",
                "full_name": "Tanvi Jain",
                "role": "student",
                "dept_code": "BCOM",
                "program": "B.Com Honours",
                "roll_number": "BCOM-2026-055",
            },
            {
                "email": "sid.bsc@college.edu",
                "password": "Student@123",
                "full_name": "Siddharth Rao",
                "role": "student",
                "dept_code": "BSC",
                "program": "B.Sc Data Science",
                "roll_number": "BSC-2026-018",
            },
        ]

        user_map = {}
        for u_info in users_to_create:
            u = User.query.filter_by(email=u_info["email"]).first()
            if not u:
                u = User(
                    email=u_info["email"],
                    full_name=u_info["full_name"],
                    role=u_info["role"],
                    department_id=dept_map[u_info["dept_code"]].id if u_info["dept_code"] else None,
                    program=u_info["program"],
                    roll_number=u_info["roll_number"],
                )
                u.set_password(u_info["password"])
                db.session.add(u)
                db.session.flush()
            user_map[u.email] = u
        db.session.commit()
        print(f"✅  Seeded {len(user_map)} Users across 5 roles.")

        # 4. Seed 34 Realistic Events across Departments & Categories
        events_data = [
            # ── MCA Events ──
            {
                "title": "HackMCA 2026: 36-Hour National Hackathon",
                "description": "Flagship national-level software hackathon challenging student teams to architect generative AI applications, fintech protocols, and smart governance platforms.",
                "dept": "MCA",
                "cat": "TECH",
                "subcat": "Hackathons",
                "date_offset": 12,
                "venue": "Apex Innovation Lab & Tech Center",
                "mode": "Hybrid",
                "capacity": 150,
                "participation_type": "team",
                "max_team_size": 4,
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format&fit=crop&q=80",
                "prizes": "₹1,00,000 Cash Prize Pool + Cloud Credits + Internship Offers",
            },
            {
                "title": "Mastering Kubernetes & Cloud Microservices",
                "description": "Hands-on industrial masterclass covering container orchestration, Docker multi-stage builds, Helm charts, and CI/CD automated deployment pipelines.",
                "dept": "MCA",
                "cat": "TECH",
                "subcat": "Cloud & DevOps",
                "date_offset": 18,
                "venue": "MCA Seminar Hall 401",
                "mode": "Offline",
                "capacity": 75,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["MCA", "BCA", "BTECH", "MTECH"],
                "poster": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
                "prizes": "Certified DevOps Completion Badge & Cloud Sandbox Access",
            },
            {
                "title": "MCA Turing Coding Challenge",
                "description": "High-intensity competitive programming contest featuring algorithmic puzzles, dynamic programming challenges, and graph theory problem sets.",
                "dept": "MCA",
                "cat": "TECH",
                "subcat": "Competitive Programming",
                "date_offset": 5,
                "venue": "Main Computer Center, Lab 3",
                "mode": "Offline",
                "capacity": 60,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["MCA", "BCA", "BTECH"],
                "poster": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80",
                "prizes": "1st Prize: Mechanical Keyboard + Trophy; 2nd Prize: Smart Watch",
            },
            {
                "title": "Generative AI & Agentic Architectures Workshop",
                "description": "Comprehensive tutorial exploring autonomous LLM agents, retrieval augmented generation (RAG), vector embeddings, and LangChain integration.",
                "dept": "MCA",
                "cat": "TECH",
                "subcat": "Artificial Intelligence",
                "date_offset": 25,
                "venue": "Virtual Stream / Google Meet",
                "mode": "Online",
                "capacity": 200,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
                "prizes": "Digital Certificate + Open-source GitHub Project Portfolio",
            },

            # ── MBA Events ──
            {
                "title": "VentureVibe 2026: Inter-Collegiate Startup Pitch",
                "description": "Annual flagship startup pitch battle where budding entrepreneurs present business plans to venture capitalists and angel investors.",
                "dept": "MBA",
                "cat": "MGMT",
                "subcat": "Startup Pitch",
                "date_offset": 14,
                "venue": "Auditorium A, Management Block",
                "mode": "Offline",
                "capacity": 100,
                "participation_type": "team",
                "max_team_size": 3,
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format&fit=crop&q=80",
                "prizes": "₹50,000 Seed Grant + Incubation Center Mentorship",
            },
            {
                "title": "BrandWars: Marketing Strategy Simulation",
                "description": "Intense case competition analyzing consumer behavior, digital marketing budget allocation, and turnaround brand campaigns.",
                "dept": "MBA",
                "cat": "MGMT",
                "subcat": "Marketing",
                "date_offset": 9,
                "venue": "Executive Hall B",
                "mode": "Offline",
                "capacity": 50,
                "participation_type": "team",
                "max_team_size": 2,
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["MBA", "BBA", "BCOM"],
                "poster": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80",
                "prizes": "Certificates of Excellence + Best Pitch Trophies",
            },
            {
                "title": "Global Fintech & Investment Colloquium",
                "description": "Distinguished corporate panel discussing algorithmic trading, decentralized finance, and ESG investment portfolio frameworks.",
                "dept": "MBA",
                "cat": "MGMT",
                "subcat": "Finance",
                "date_offset": 22,
                "venue": "Convention Center, 2nd Floor",
                "mode": "Hybrid",
                "capacity": 120,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&auto=format&fit=crop&q=80",
                "prizes": "Executive Attendance Certificate + Networking Reception",
            },

            # ── B.Tech Events ──
            {
                "title": "RoboWars 2026: Combat Robotics Championship",
                "description": "Heavyweight and lightweight custom battle bot collisions in an armored combat arena with hazard obstacles and flame traps.",
                "dept": "BTECH",
                "cat": "TECH",
                "subcat": "Robotics & IoT",
                "date_offset": 16,
                "venue": "Outdoor Amphitheatre Grounds",
                "mode": "Offline",
                "capacity": 250,
                "participation_type": "team",
                "max_team_size": 4,
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&auto=format&fit=crop&q=80",
                "prizes": "₹75,000 Cash Pool + Custom Championship Belts",
            },
            {
                "title": "Autonomous Drone Design & Flight Symposium",
                "description": "Learn flight controllers, computer vision object tracking with Raspberry Pi, and UAV regulations with practical outdoor flight demos.",
                "dept": "BTECH",
                "cat": "TECH",
                "subcat": "Hardware & IoT",
                "date_offset": 28,
                "venue": "Engineering Quadrangle & Flight Field",
                "mode": "Offline",
                "capacity": 80,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["BTECH", "MTECH", "MCA"],
                "poster": "https://images.unsplash.com/photo-1527977966376-1c8408f9f108?w=800&auto=format&fit=crop&q=80",
                "prizes": "Mini Drone Kit for Top 3 Model Exhibitions",
            },

            # ── BCA Events ──
            {
                "title": "WebCrafters: Front-End UI/UX Speed Run",
                "description": "3-hour rapid web development sprint to recreate polished, high-fidelity responsive web interfaces using Tailwind CSS and modern JS.",
                "dept": "BCA",
                "cat": "TECH",
                "subcat": "Web Development",
                "date_offset": 7,
                "venue": "BCA Lab 102",
                "mode": "Offline",
                "capacity": 50,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["BCA", "MCA", "BSC"],
                "poster": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=80",
                "prizes": "Figma Pro Subscription + Wireless Mouse & Trophy",
            },
            {
                "title": "Full-Stack MERN Stack Bootcamp",
                "description": "Intensive weekend workshop covering MongoDB schemas, Express routers, React components, and Node API authentication.",
                "dept": "BCA",
                "cat": "TECH",
                "subcat": "Web Development",
                "date_offset": 21,
                "venue": "BCA Smart Classroom 201",
                "mode": "Offline",
                "capacity": 70,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80",
                "prizes": "Full Stack Mastery Certificate + Course Vouchers",
            },

            # ── BBA Events ──
            {
                "title": "Chanakya: The Strategic Management Simulation",
                "description": "Multi-round corporate business game testing crisis communication, PR responses, equity dilution, and hostile takeover defense.",
                "dept": "BBA",
                "cat": "MGMT",
                "subcat": "Business Simulation",
                "date_offset": 11,
                "venue": "BBA Seminar Hall",
                "mode": "Offline",
                "capacity": 60,
                "participation_type": "team",
                "max_team_size": 3,
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["BBA", "MBA", "BCOM"],
                "poster": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&auto=format&fit=crop&q=80",
                "prizes": "Chanakya Rolling Trophy + ₹15,000 Cash",
            },

            # ── M.Tech Events ──
            {
                "title": "International Colloquium on Deep Learning & Vision",
                "description": "Peer-reviewed academic research symposium featuring keynote addresses from IEEE fellows on diffusion models and medical imaging.",
                "dept": "MTECH",
                "cat": "ACAD",
                "subcat": "Research Conferences",
                "date_offset": 35,
                "venue": "Main University Auditorium",
                "mode": "Hybrid",
                "capacity": 180,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
                "prizes": "Best Research Paper Gold Medal + IEEE Xplore Indexing",
            },

            # ── Cultural & Entertainment Events ──
            {
                "title": "Tarang 2026: Annual Inter-College Cultural Fest",
                "description": "3-day cultural celebration uniting music, classical and western dance, street theatre, battle of the bands, and celebrity DJ night.",
                "dept": "BTECH",
                "cat": "CULT",
                "subcat": "Annual Fest",
                "date_offset": 40,
                "venue": "Grand University Stadium",
                "mode": "Offline",
                "capacity": 1000,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&auto=format&fit=crop&q=80",
                "prizes": "₹2,50,000 Total Prizes across 15+ Competitions",
            },
            {
                "title": "Cadence: Western & Fusion Dance Battle",
                "description": "Electrifying solo and crew dance face-offs evaluated on synchronization, choreographic originality, and stage dynamism.",
                "dept": "BBA",
                "cat": "CULT",
                "subcat": "Dance",
                "date_offset": 19,
                "venue": "College Open Stage",
                "mode": "Offline",
                "capacity": 300,
                "participation_type": "team",
                "max_team_size": 6,
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&auto=format&fit=crop&q=80",
                "prizes": "Best Crew Trophy + ₹20,000 Cash",
            },
            {
                "title": "Through The Lens: Campus Photography Contest",
                "description": "Exhibition of architectural, portrait, and street photography capturing daily student life and college moments.",
                "dept": "BSC",
                "cat": "CULT",
                "subcat": "Photography",
                "date_offset": 8,
                "venue": "Art Gallery, Humanities Wing",
                "mode": "Offline",
                "capacity": 40,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format&fit=crop&q=80",
                "prizes": "Camera Accessories + Framed Exhibition Placement",
            },

            # ── Sports & Fitness Events ──
            {
                "title": "Apex Champions Trophy: Inter-Department Cricket Tournament",
                "description": "T20 knockout tournament between all academic departments. MCA vs MBA vs B.Tech in an electric clash under floodlights.",
                "dept": "MCA",
                "cat": "SPORTS",
                "subcat": "Cricket",
                "date_offset": 15,
                "venue": "College Cricket Oval",
                "mode": "Offline",
                "capacity": 180,
                "participation_type": "team",
                "max_team_size": 11,
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format&fit=crop&q=80",
                "prizes": "Apex Rolling Cup + Gold Medals for 11 Players",
            },
            {
                "title": "Grandmaster Blitz: Inter-College Chess Open",
                "description": "FIDE-rated rapid and blitz format chess tournament with clock timers and digital boards.",
                "dept": "MSC",
                "cat": "SPORTS",
                "subcat": "Chess",
                "date_offset": 6,
                "venue": "Indoor Sports Complex, Room 104",
                "mode": "Offline",
                "capacity": 64,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&auto=format&fit=crop&q=80",
                "prizes": "Wooden Staunton Chess Set + ₹10,000 Cash",
            },
            {
                "title": "ShuttleSmash: Badminton Singles & Doubles",
                "description": "Fast-paced tournament on synthetic badminton courts with singles and mixed doubles brackets.",
                "dept": "BCOM",
                "cat": "SPORTS",
                "subcat": "Badminton",
                "date_offset": 17,
                "venue": "Sports Arena Courts 1 & 2",
                "mode": "Offline",
                "capacity": 48,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=800&auto=format&fit=crop&q=80",
                "prizes": "Yonex Pro Rackets + Medals",
            },

            # ── Career & Placement Events ──
            {
                "title": "FAANG/MAANG Mock Technical Interview Drive",
                "description": "Simulated live coding rounds, system design grilling, and behavioral STAR-method coaching with verified alumni working at top tech firms.",
                "dept": "MCA",
                "cat": "CAREER",
                "subcat": "Mock Interviews",
                "date_offset": 10,
                "venue": "Placement Cell Interview Suites",
                "mode": "Offline",
                "capacity": 50,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": True,
                "depts_allowed": ["MCA", "MTECH", "BTECH", "BCA"],
                "poster": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800&auto=format&fit=crop&q=80",
                "prizes": "Personalized 1-on-1 Placement Assessment Scorecard",
            },
            {
                "title": "ATS-Proof Resume & LinkedIn Brand Masterclass",
                "description": "Learn recruiter search algorithms, impact metric formatting, GitHub portfolio curation, and cold-emailing strategies for high-paying roles.",
                "dept": "MBA",
                "cat": "CAREER",
                "subcat": "Resume Building",
                "date_offset": 4,
                "venue": "Live Virtual Webinar",
                "mode": "Online",
                "capacity": 300,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80",
                "prizes": "50+ ATS-Approved Premium Resume Templates",
            },

            # ── Social Responsibility Events ──
            {
                "title": "Blood Donation Camp & Health Check-up Drive",
                "description": "Voluntary blood donation camp in partnership with the Red Cross Society, featuring complimentary blood-typing and vitals checks.",
                "dept": "BSC",
                "cat": "SOCIAL",
                "subcat": "Health Camp",
                "date_offset": 13,
                "venue": "College Health Center & Foyer",
                "mode": "Offline",
                "capacity": 200,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&auto=format&fit=crop&q=80",
                "prizes": "Donor Certificate, Recognition Badge & Refreshments",
            },
            {
                "title": "Green Campus Initiative: 500 Tree Plantation",
                "description": "Campus-wide environmental sustainability drive to plant 500 native saplings and establish automated drip irrigation zones.",
                "dept": "BTECH",
                "cat": "SOCIAL",
                "subcat": "Environment",
                "date_offset": 20,
                "venue": "North Campus Botanical Green",
                "mode": "Offline",
                "capacity": 150,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",
                "prizes": "Eco-Warrior Certificate & Adopt-A-Tree Plaque",
            },

            # ── Department & Club Activities ──
            {
                "title": "MCA Turing Club Inaugural Meet & Code-Jam",
                "description": "Welcoming juniors, introducing open-source software project tracks, and a 2-hour beginner-friendly Git & GitHub workshop.",
                "dept": "MCA",
                "cat": "CLUB",
                "subcat": "Club Activities",
                "date_offset": 3,
                "venue": "MCA Lab 302",
                "mode": "Offline",
                "capacity": 65,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "published",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["MCA"],
                "poster": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80",
                "prizes": "Club Membership Kit & Stickers",
            },

            # ── Completed Events with Results & Feedback ──
            {
                "title": "CyberCon 2026: Ethical Hacking & CTF Challenge",
                "description": "Capture-The-Flag cybersecurity war games testing web penetration, cryptographic breaking, reverse engineering, and digital forensics.",
                "dept": "MCA",
                "cat": "TECH",
                "subcat": "Cybersecurity",
                "date_offset": -10,  # 10 days ago (Completed)
                "venue": "Cyber Defense Lab 204",
                "mode": "Offline",
                "capacity": 60,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "completed",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=80",
                "prizes": "1st: ₹25,000 + HackerOne Certified Goodies",
            },
            {
                "title": "National Student Research Colloquium",
                "description": "Multi-disciplinary paper presentation on sustainable technologies and digital transformation in emerging markets.",
                "dept": "MTECH",
                "cat": "ACAD",
                "subcat": "Research Colloquium",
                "date_offset": -15,  # 15 days ago (Completed)
                "venue": "Senate Conference Room",
                "mode": "Offline",
                "capacity": 80,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "completed",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&auto=format&fit=crop&q=80",
                "prizes": "Best Paper Citations & Research Fellowship Recommendations",
            },

            # ── Pending Approval Events (Demonstrates Workflow) ──
            {
                "title": "Blockchain & Web3 Decentralized Finance Workshop",
                "description": "Proposed workshop by MCA student club on Solidity smart contracts, ERC-20 tokenomics, and zero-knowledge proof verification.",
                "dept": "MCA",
                "cat": "TECH",
                "subcat": "Blockchain",
                "date_offset": 30,
                "venue": "MCA Lab 403",
                "mode": "Offline",
                "capacity": 50,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "pending_approval",
                "approval_status": "pending",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80",
                "prizes": "Web3 Developer Certificate",
            },
            {
                "title": "Ad-Mad: Creative Commercial Video Challenge",
                "description": "Student teams create 90-second humorous or impactful video advertisements for fictitious bizarre products.",
                "dept": "BBA",
                "cat": "MGMT",
                "subcat": "Marketing",
                "date_offset": 24,
                "venue": "Media Studio 1",
                "mode": "Offline",
                "capacity": 45,
                "participation_type": "team",
                "max_team_size": 3,
                "fee": 0.0,
                "status": "pending_approval",
                "approval_status": "pending",
                "featured": False,
                "depts_allowed": ["BBA", "MBA", "BCOM"],
                "poster": "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&auto=format&fit=crop&q=80",
                "prizes": "Best Ad Trophy + ₹10,000",
            },

            # ── Draft & Cancelled Events ──
            {
                "title": "Quantum Computing Fundamentals [Draft Proposal]",
                "description": "Draft concept for Qiskit and quantum annealing session for postgraduate scholars.",
                "dept": "MTECH",
                "cat": "ACAD",
                "subcat": "Quantum Tech",
                "date_offset": 45,
                "venue": "TBD",
                "mode": "Offline",
                "capacity": 40,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "draft",
                "approval_status": "pending",
                "featured": False,
                "depts_allowed": ["MTECH", "MSC"],
                "poster": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
                "prizes": "None",
            },
            {
                "title": "Campus Monsoons Marathon (Cancelled due to weather)",
                "description": "5K cross-campus run cancelled as per campus safety committee notice.",
                "dept": "BTECH",
                "cat": "SPORTS",
                "subcat": "Marathon",
                "date_offset": -2,
                "venue": "Main Stadium",
                "mode": "Offline",
                "capacity": 200,
                "participation_type": "individual",
                "fee": 0.0,
                "status": "cancelled",
                "approval_status": "approved",
                "featured": False,
                "depts_allowed": ["ALL"],
                "poster": "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&auto=format&fit=crop&q=80",
                "prizes": "Finisher Medals",
            },
        ]

        seeded_events = []
        for ed in events_data:
            ev = Event.query.filter_by(title=ed["title"]).first()
            if not ev:
                target_dept = dept_map.get(ed["dept"])
                target_cat = cat_map.get(ed["cat"])
                creator = user_map.get(f"{ed['dept'].lower()}.coord@college.edu") or user_map["superadmin@college.edu"]

                e_date = now + timedelta(days=ed["date_offset"])
                reg_deadline = e_date - timedelta(days=2) if ed["date_offset"] > 2 else e_date

                ev = Event(
                    title=ed["title"],
                    description=ed["description"],
                    poster_url=ed["poster"],
                    category_id=target_cat.id if target_cat else None,
                    subcategory=ed.get("subcat"),
                    department_id=target_dept.id if target_dept else list(dept_map.values())[0].id,
                    created_by_id=creator.id,
                    event_coordinator=creator.full_name,
                    faculty_incharge="Dr. Vikram Joshi",
                    contact_info=creator.email,
                    event_date=e_date,
                    start_time="10:00 AM",
                    end_time="04:30 PM",
                    registration_deadline=reg_deadline,
                    venue=ed["venue"],
                    event_mode=ed["mode"],
                    capacity=ed["capacity"],
                    registration_fee=ed.get("fee", 0.0),
                    participation_type=ed.get("participation_type", "individual"),
                    max_team_size=ed.get("max_team_size", 1),
                    eligibility_criteria="Valid college identity card required",
                    prizes_rewards=ed.get("prizes"),
                    status=ed["status"],
                    approval_status=ed["approval_status"],
                    featured=ed.get("featured", False),
                )
                ev.participating_departments = ed.get("depts_allowed", ["ALL"])
                db.session.add(ev)
                db.session.flush()
            seeded_events.append(ev)
        db.session.commit()
        print(f"✅  Seeded {len(seeded_events)} Realistic Events.")

        # 5. Seed Registrations, Teams, Attendance, and Certificates
        # Register students across events
        students = [u for u in user_map.values() if u.role == "student"]

        # Register Alex Rivera for HackMCA, Turing Challenge, and completed CyberCon
        mca_hack = Event.query.filter(Event.title.ilike("%HackMCA%")).first()
        turing = Event.query.filter(Event.title.ilike("%Turing Coding%")).first()
        cybercon = Event.query.filter(Event.title.ilike("%CyberCon%")).first()
        venturevibe = Event.query.filter(Event.title.ilike("%VentureVibe%")).first()

        # HackMCA Team Registration
        if mca_hack and user_map.get("alex.mca@college.edu"):
            alex = user_map["alex.mca@college.edu"]
            team = Team(
                event_id=mca_hack.id,
                team_name="ByteCommanders",
                team_leader_id=alex.id,
            )
            db.session.add(team)
            db.session.flush()

            # Add team members
            tm1 = TeamMember(team_id=team.id, user_id=alex.id, student_name=alex.full_name, roll_number=alex.roll_number, email=alex.email, department_code="MCA")
            tm2 = TeamMember(team_id=team.id, student_name="David Chen", roll_number="MCA-2026-002", email="david.chen@college.edu", department_code="MCA")
            tm3 = TeamMember(team_id=team.id, student_name="Sarah Miller", roll_number="BT-CSE-2026-012", email="sarah.m@college.edu", department_code="BTECH")
            db.session.add_all([tm1, tm2, tm3])

            reg = Registration(
                event_id=mca_hack.id,
                user_id=alex.id,
                team_id=team.id,
                participation_type="team",
                status="confirmed",
                notes="Generative AI agent track submission",
            )
            db.session.add(reg)

        # Individual registrations for diverse students
        for st in students:
            # Register each student for 2-3 events matching eligibility
            for ev in seeded_events[:8]:
                if ev.status == "published":
                    # Check not already registered
                    if not Registration.query.filter_by(event_id=ev.id, user_id=st.id).first():
                        r = Registration(
                            event_id=ev.id,
                            user_id=st.id,
                            participation_type="individual",
                            status="confirmed",
                        )
                        db.session.add(r)

        # Completed Event: CyberCon 2026 Registrations + Attendance + Certificates + Results
        if cybercon:
            for st in students[:5]:
                reg = Registration.query.filter_by(event_id=cybercon.id, user_id=st.id).first()
                if not reg:
                    reg = Registration(
                        event_id=cybercon.id,
                        user_id=st.id,
                        participation_type="individual",
                        status="confirmed",
                    )
                    db.session.add(reg)
                    db.session.flush()

                # Mark attendance
                att = Attendance.query.filter_by(event_id=cybercon.id, user_id=st.id).first()
                if not att:
                    att = Attendance(
                        event_id=cybercon.id,
                        registration_id=reg.id,
                        user_id=st.id,
                        is_present=True,
                        marked_by_id=user_map["faculty.approver@college.edu"].id,
                    )
                    db.session.add(att)

                # Issue certificate
                cert = Certificate.query.filter_by(event_id=cybercon.id, user_id=st.id).first()
                if not cert:
                    cert = Certificate(
                        certificate_number=f"CERT-MCA-2026-CYBER-{st.id:03d}",
                        event_id=cybercon.id,
                        user_id=st.id,
                        title=f"Certificate of Excellence in Ethical Hacking — {cybercon.title}",
                        issued_by_id=user_map["mca.coord@college.edu"].id,
                        download_url=f"/api/certificates/CERT-MCA-2026-CYBER-{st.id:03d}/download",
                    )
                    db.session.add(cert)

            # Publish Official Results for CyberCon
            if not cybercon.results:
                res = EventResult(
                    event_id=cybercon.id,
                    summary="CyberCon 2026 concluded with unprecedented participation! Over 60 hackers tackled 24 challenging CTF flags covering web vulnerabilities, cryptographic RSA attacks, and kernel exploitation.",
                    winners=[
                        {"position": "1st Place (Champion)", "name": "Alex Rivera", "department": "MCA", "prize": "₹25,000 + HackerOne Pro Kit"},
                        {"position": "2nd Place (Runner-up)", "name": "Rohit Verma", "department": "B.Tech CSE", "prize": "₹15,000 + Wi-Fi Pineapple"},
                        {"position": "3rd Place", "name": "Sneha Roy", "department": "M.Tech AI", "prize": "₹10,000 + Flipper Zero"},
                    ],
                    gallery=[
                        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80",
                        "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
                    ],
                    published_by_id=user_map["mca.coord@college.edu"].id,
                )
                db.session.add(res)


            # Issue Official International Hackathon Winner Certificates for CyberCon
            alex_user = user_map.get("alex.mca@college.edu")
            cyber_winners_data = [
                {
                    "rank": "1st Place (Grand Champion)",
                    "cert_type": "winner",
                    "user": alex_user,
                    "name": "Alex Rivera",
                    "team": "Team CyberSentinels",
                    "dept": "MCA",
                    "prize": "₹25,000 + HackerOne Pro Kit & Grand Trophy",
                    "track": "Offensive Security & Kernel Exploitation Track",
                    "cert_num": "HACK-MCA-2026-WIN01-GOLD-94F2",
                    "title": "Certificate of Extraordinary Achievement & Grand Champion",
                },
                {
                    "rank": "2nd Place (1st Runner-Up)",
                    "cert_type": "runner_up",
                    "user": None,
                    "name": "Rohit Verma",
                    "team": "KernelPanic Squad",
                    "dept": "B.Tech CSE",
                    "prize": "₹15,000 + Wi-Fi Pineapple Mark VII",
                    "track": "Wireless & Network Exploitation Track",
                    "cert_num": "HACK-MCA-2026-WIN02-SLVR-82B1",
                    "title": "Certificate of Distinction & First Runner-Up",
                },
                {
                    "rank": "3rd Place (2nd Runner-Up)",
                    "cert_type": "second_runner_up",
                    "user": None,
                    "name": "Sneha Roy",
                    "team": "NeuralExploiters",
                    "dept": "M.Tech AI",
                    "prize": "₹10,000 + Flipper Zero Multi-Tool",
                    "track": "AI-Assisted Threat Simulation Track",
                    "cert_num": "HACK-MCA-2026-WIN03-BRNZ-47C9",
                    "title": "Certificate of Excellence & Second Runner-Up",
                },
            ]

            for w_info in cyber_winners_data:
                existing_win_cert = Certificate.query.filter_by(
                    certificate_number=w_info["cert_num"]
                ).first()
                if not existing_win_cert:
                    win_cert = Certificate(
                        certificate_number=w_info["cert_num"],
                        event_id=cybercon.id,
                        user_id=w_info["user"].id if w_info["user"] else None,
                        title=f"{w_info['title']} — {cybercon.title}",
                        cert_type=w_info["cert_type"],
                        rank_position=w_info["rank"],
                        recipient_name=w_info["name"],
                        team_name=w_info["team"],
                        prize=w_info["prize"],
                        track=w_info["track"],
                        issued_by_id=user_map["mca.coord@college.edu"].id,
                        download_url=f"/api/certificates/{w_info['cert_num']}/download",
                    )
                    win_cert.verification_hash = win_cert.generate_hash()
                    db.session.add(win_cert)


            # Add participant feedback for CyberCon
            if user_map.get("alex.mca@college.edu"):
                alex = user_map["alex.mca@college.edu"]
                if not EventFeedback.query.filter_by(event_id=cybercon.id, user_id=alex.id).first():
                    fb = EventFeedback(
                        event_id=cybercon.id,
                        user_id=alex.id,
                        rating=5,
                        comment="Phenomenal CTF challenge infrastructure! The reverse engineering problems were exceptionally well crafted.",
                    )
                    db.session.add(fb)

        # 6. Bookmarks for Alex
        if user_map.get("alex.mca@college.edu"):
            alex = user_map["alex.mca@college.edu"]
            for ev in seeded_events[:3]:
                if not Bookmark.query.filter_by(user_id=alex.id, event_id=ev.id).first():
                    bm = Bookmark(user_id=alex.id, event_id=ev.id)
                    db.session.add(bm)

        # 7. Announcements
        announcements_data = [
            {
                "title": "Welcome to the College Event Portal 🎓",
                "content": "All students and faculty across MCA, MBA, B.Tech, BCA, M.Tech, BBA, B.Com, and B.Sc can now explore, register, and manage event participation seamlessly.",
                "target_type": "all",
            },
            {
                "title": "HackMCA 2026 Registrations are Live!",
                "content": "Cross-department team formations are open for the 36-hour national hackathon. ₹1,00,000 cash prizes up for grabs.",
                "target_type": "department",
                "target_id": dept_map["MCA"].id,
            },
            {
                "title": "Placement Mock Drive Starting Next Monday",
                "content": "Pre-final and final year students are advised to book their slots for the FAANG mock interview series.",
                "target_type": "all",
            },
        ]
        for a_info in announcements_data:
            if not Announcement.query.filter_by(title=a_info["title"]).first():
                ann = Announcement(
                    title=a_info["title"],
                    content=a_info["content"],
                    target_type=a_info["target_type"],
                    target_id=a_info.get("target_id"),
                    created_by_id=user_map["superadmin@college.edu"].id,
                )
                db.session.add(ann)

        db.session.commit()
        print("✅  Seeded Registrations, Teams, Attendance, Certificates, and Announcements.")
        print("\n🎉  INSTITUTION-WIDE COLLEGE EVENT MANAGEMENT DATABASE SEEDED SUCCESSFULLY!")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print("   Super Admin:         superadmin@college.edu  /  Admin@123")
        print("   MCA Coordinator:     mca.coord@college.edu   /  Admin@123")
        print("   MBA Coordinator:     mba.coord@college.edu   /  Admin@123")
        print("   Faculty Approver:    faculty.approver@college.edu / Admin@123")
        print("   Student (Alex MCA):  alex.mca@college.edu    /  Student@123")
        print("   Student (Priya MBA): priya.mba@college.edu   /  Student@123")
        print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Institution Event Management Database")
    parser.add_argument("--reset", action="store_true", help="Drop all tables before seeding")
    args = parser.parse_args()
    seed(reset=args.reset)
