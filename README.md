# 🎓 Campus EventHub — Institutional College Event Management Platform

> An enterprise-grade, interdepartmental event management and registration ecosystem engineered for modern colleges and universities. Built with a React + Vite frontend and a Flask + SQLAlchemy REST API.

---

## 🚀 Key Features

- **🏛️ Department & Interdepartmental Workflows**: Role-based access control (RBAC) separating Super Admins, Department Coordinators (B.Tech, M.Tech, MCA, MBA), Faculty Reviewers, and Students.
- **📅 Interactive Calendar & Timeline**: Full calendar view of college hackathons, symposiums, guest lectures, cultural fests, and workshops with instant department filtering.
- **⚡ Seamless Registration & Live Seat Tracking**: Real-time capacity enforcement, eligibility validation, team registration, and waitlisting.
- **📱 Responsive & Touch-Friendly UI**: Optimized for all screen sizes from mobile phones to 4K monitors with dark-mode glassmorphic aesthetics.
- **🛡️ Enterprise Security**:
  - JWT authentication with secure token handling.
  - HTTP security headers (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Referrer-Policy`).
  - Safe environment variable management (`.env.example` templates, strict `.gitignore`).
  - Production-ready PostgreSQL connection pooling (`pool_pre_ping`, `pool_recycle`).
- **🏆 Certificates & QR Verification**: Automatic certificate generation with unique verification hashes and QR code check-in.

---

## 🛠️ Architecture & Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, TailwindCSS v4, Lucide Icons, Axios |
| **Backend** | Python 3.11+, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, Marshmallow |
| **Database** | SQLite (Development) / PostgreSQL (Production ready) |
| **Deployment** | Gunicorn (WSGI), Procfile included, Docker/Cloud ready |

---

## 📁 Repository Structure

```text
event-registration-platform/
├── backend/
│   ├── app/
│   │   ├── auth/           # Authentication helpers and RBAC decorators
│   │   ├── models/         # SQLAlchemy models (User, Event, Department, etc.)
│   │   ├── routes/         # REST API Blueprints
│   │   ├── schemas/        # Serialization & validation schemas
│   │   └── services/       # Certificate generator, notifications, etc.
│   ├── instance/           # Local SQLite databases (git ignored)
│   ├── tests/              # Pytest test suites (24/24 passing)
│   ├── config.py           # Environment-aware configuration
│   ├── run.py              # Application entrypoint
│   ├── seed.py             # Database seeder with sample college data
│   ├── requirements.txt    # Python dependencies
│   ├── Procfile            # Production Gunicorn process file
│   └── .env.example        # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/     # UI components (Navbar, EventCard, Modals, etc.)
│   │   ├── context/        # Auth and global state
│   │   ├── pages/          # Pages (Events, Calendar, Dashboards, Login)
│   │   └── services/       # Axios API client
│   ├── package.json        # Node dependencies & scripts
│   ├── vite.config.js      # Vite configuration & dev proxy
│   └── .env.example        # Frontend environment template
├── .gitignore              # Protects secrets, databases, and dependencies
└── README.md
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Seed database with sample college data
python seed.py

# Start the Flask API server
python run.py
```
> The API server will be available at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
> The frontend application will be running at `http://localhost:5173`.

---

## 🔐 Environment Variables & Security

### Backend (`backend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `FLASK_ENV` | Environment (`development`, `production`, `testing`) | `development` |
| `PORT` | Server port | `5000` |
| `SECRET_KEY` | Flask session secret (change in production) | `dev-secret-key-...` |
| `JWT_SECRET_KEY` | JWT signing secret (change in production) | `dev-jwt-secret-...` |
| `DATABASE_URL` | SQLAlchemy URI (PostgreSQL or SQLite) | `sqlite:///instance/dev_events.db` |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173` |

### Frontend (`frontend/.env`)
| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base API URL (set to backend URL in production) | `/api` (local proxy) |

---

## 🧪 Testing

To run the automated backend test suite:

```bash
cd backend
pytest
```
*All 24 institutional tests covering authentication, event lifecycle, capacity, eligibility, cancellations, permissions, and reporting run and pass.*

---

## 🚀 Pushing to GitHub (Safe & Secure)

The repository includes a comprehensive `.gitignore` that prevents `.env` secrets, binary SQLite databases, node_modules, and cache files from ever being committed.

```bash
# 1. Initialize git (if not already done)
git init

# 2. Check that no sensitive files (.env, *.db) are staged
git status

# 3. Add and commit files
git add .
git commit -m "feat: institutional college event management platform"

# 4. Connect and push to your GitHub repository
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo-name>.git
git push -u origin main
```

---

## 📄 License
MIT License. Built for colleges and universities.
