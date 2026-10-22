# UniSIRAJ CIA Helpdesk Agent — Backend API

Production-grade FastAPI backend for the **Centre of International Affairs (CIA), Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)**.

The system empowers university immigration and student affairs officers to maintain international student visa compliance, detect imminent visa expirations, automatically dispatch WhatsApp renewal alerts via Twilio at 90, 60, and 30 days prior to expiry, securely ingest university spreadsheets, and query administrative data via a Gemini-powered AI assistant grounded strictly in verified database records.

---

## 1. System Architecture

```
app/
├── main.py                     # FastAPI application entrypoint, CORS, lifespan bootstrap
├── cli.py                      # Administrative CLI for database init, admin creation & demo seeding
├── core/
│   ├── config.py               # Pydantic BaseSettings & environment management
│   ├── security.py             # Argon2 password hashing & signed JWT authentication
│   └── logging.py              # Structured logging configuration
├── db/
│   ├── base.py                 # SQLAlchemy DeclarativeBase and TimestampMixin
│   └── session.py              # Engine, connection pooling, and get_db dependency
├── models/                     # Relational ORM models with composite constraints & indexes
│   ├── user.py                 # CIA users (admin, staff, auditor)
│   ├── student.py              # International student visa records
│   ├── notification.py         # WhatsApp notification delivery history
│   ├── import_job.py           # Spreadsheet ingestion job state
│   └── audit_log.py            # Security and administrative audit trail
├── schemas/                    # Typed Pydantic v2 validation contracts
│   ├── auth.py                 # Login, tokens, user representations
│   ├── student.py              # Student schemas, pagination, search
│   ├── dashboard.py            # Summary metrics & recent activities
│   ├── notification.py         # Notifications, WhatsApp payloads, webhooks
│   ├── import_job.py           # Previews, validation reports, confirmation
│   ├── assistant.py            # AI assistant query & structured responses
│   ├── monitoring.py           # Expiry summaries & scheduler responses
│   └── audit.py                # Audit log search & records
├── services/                   # Decoupled business logic layer
│   ├── student_service.py      # Student search, pagination, status calculation
│   ├── spreadsheet_service.py  # Pandas/openpyxl parser, header mapping, validation engine
│   ├── visa_monitoring_service.py # Deterministic milestone math & batch execution
│   ├── notification_service.py # Delivery lifecycle, idempotency & retry logic
│   ├── twilio_service.py       # Live Twilio adapter + Mock adapter & webhook validator
│   ├── ai_agent_service.py     # Gemini tool-grounded assistant
│   └── audit_service.py        # Centralized audit recorder
├── api/
│   ├── dependencies.py         # Role-based access control & token verification
│   └── routes/                 # Dual-mounted REST endpoints (/api/v1 and /api)
│       ├── auth.py
│       ├── dashboard.py
│       ├── students.py
│       ├── imports.py
│       ├── visa_monitoring.py
│       ├── notifications.py
│       ├── webhooks.py
│       ├── assistant.py
│       ├── health.py
│       └── audit.py
├── alembic/                    # Database migration version control
└── tests/                      # Automated test suite (33 test cases, 100% pass)
```

---

## 2. Prerequisites & Quick Start

### Prerequisites
- Python 3.11, 3.12, or 3.14
- PostgreSQL 15+ (Production) or SQLite (Local Development)
- Docker & Docker Compose (Optional for containerized setup)

### Local Virtual Environment Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   # Linux / macOS:
   python3 -m venv venv
   source venv/bin/activate

   # Windows (PowerShell):
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```

5. **Initialize Database & Seed Initial Demo Records:**
   ```bash
   python -m app.cli init-db
   python -m app.cli create-admin --email admin@unisiraj.edu.my --password AdminSecurePassword123! --name "CIA Administrator"
   python -m app.cli seed-demo-data
   ```

6. **Start the FastAPI Development Server:**
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

7. **Explore Interactive OpenAPI Documentation:**
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## 3. Running Automated Tests

Run the complete test suite:
```bash
python -m pytest tests/ -v
```

### Test Coverage Highlights
- **Authentication & RBAC**: Admin, staff, and auditor permissions, Argon2 password verification, token expiry.
- **Visa Monitoring**: Deterministic calendar date calculations, threshold boundaries (90, 60, 30 days, overstay), idempotency guarantees preventing duplicate notifications.
- **Spreadsheet Validation**: Ingestion of CSV and XLSX files, missing header detection, invalid dates, duplicate student detection, and atomic transaction rollback.
- **Notifications & Webhooks**: Mock Twilio WhatsApp dispatch, webhook status updates, HMAC cryptographic signature verification.
- **AI Administrative Assistant**: Parameterized, read-only database query execution, zero hallucination of Malaysian visa policies, health reporting.
- **Dashboard API**: Full metrics calculation matching the existing frontend schema.

---

## 4. Frontend Integration Guide

The backend features a **Universal Dual-Mount Architecture**:
- All endpoints are available at `/api/v1/*` (Master Build Prompt standard).
- All endpoints are also aliased at `/api/*` (matching the existing frontend `src/lib/api/client.ts`).

### Connecting the Existing Frontend
In the root directory of `UniSIRAJ-CIA-Helpdesk-Agent`:
1. Check `vite.config.ts` or create `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   VITE_ENABLE_MOCK_MODE=false
   ```
2. Start the frontend:
   ```bash
   npm run dev
   ```
3. In the UI top navigation, toggle the data source badge from **Demo Mode** to **Live FastAPI Backend**. All student lists, dashboard statistics, spreadsheet imports, and AI queries will stream directly from this FastAPI backend.

---

## 5. API Reference & Contracts

### Authentication (`/api/v1/auth`)
- `POST /auth/login` — Authenticate staff/admin and retrieve signed JWT token.
- `GET /auth/me` — Retrieve profile of authenticated user.
- `POST /auth/refresh` — Refresh active token.
- `POST /auth/logout` — Invalidate session and audit event.

### Student Visa Records (`/api/v1/students`)
- `GET /students` — Paginated list with search, status filtering (`SAFE`, `ACTION_NEEDED`, `URGENT`, `CRITICAL`, `EXPIRED`, `REVIEW_REQUIRED`), and sorting.
- `POST /students` — Create new student record.
- `GET /students/{id}` — Get single student details.
- `PUT /students/{id}` — Update student visa details.
- `DELETE /students/{id}` — Delete student record.
- `GET /students/{id}/notifications` — Get notification history for specific student.

### Spreadsheet Ingestion (`/api/v1/imports`)
- `POST /imports/preview` — Ingest CSV/XLSX file, detect headers, and return first 10 preview rows.
- `POST /imports/validate` — Row-by-row validation report, detecting duplicates and format errors.
- `POST /imports/confirm` & `POST /imports/{id}/commit` — Atomic database transaction commit.
- `GET /imports/{id}` — Retrieve import job status.
- `GET /imports/{id}/errors` — Retrieve import validation errors.

### Visa Monitoring Engine (`/api/v1/visa-monitoring`)
- `GET /visa-monitoring/summary` — Aggregate summary counts.
- `GET /visa-monitoring/expiring` — Filter records approaching expiry.
- `POST /visa-monitoring/preview` — Dry-run simulation of notification candidates.
- `POST /visa-monitoring/run` — Execute automated daily evaluation and dispatch reminders.
- `POST /monitoring/sync` — Synchronisation endpoint for frontend.

### WhatsApp Notifications (`/api/v1/notifications`)
- `GET /notifications` — List notification dispatch records.
- `GET /notifications/eligible` — Filter students eligible for reminders.
- `POST /notifications/send` — Dispatch WhatsApp reminder.
- `GET /notifications/history` — Notification history log.
- `POST /notifications/{id}/retry` — Manually retry failed notification.
- `POST /webhooks/twilio/status` — Twilio delivery status callback with HMAC signature verification.

### AI Administrative Assistant (`/api/v1/assistant` & `/api/agent`)
- `POST /assistant/chat` & `POST /agent/query` — Grounded natural-language query endpoint.
- `GET /assistant/health` — Check Gemini integration and registered database tools.

### Dashboard & Analytics (`/api/v1/dashboard`)
- `GET /dashboard/summary` — Overview metrics, WhatsApp delivery statistics, and recent activities.
- `GET /dashboard/recent-activity` — Audit activity stream.

---

## 6. Google Cloud Deployment

### A. Google Cloud Run

1. **Build and push container image using Google Cloud Build:**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/unisiraj-backend:v1
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy unisiraj-backend \
     --image gcr.io/PROJECT_ID/unisiraj-backend:v1 \
     --platform managed \
     --region asia-southeast1 \
     --allow-unauthenticated \
     --add-cloudsql-instances PROJECT_ID:asia-southeast1:INSTANCE_NAME \
     --set-env-vars ENVIRONMENT=production,DEBUG=false \
     --set-secrets DATABASE_URL=unisiraj-db-url:latest,JWT_SECRET_KEY=unisiraj-jwt-secret:latest,TWILIO_AUTH_TOKEN=unisiraj-twilio-token:latest,GEMINI_API_KEY=unisiraj-gemini-key:latest
   ```

### B. Google Cloud SQL (PostgreSQL)
Connect securely over Unix domain socket on Cloud Run:
```
DATABASE_URL=postgresql://unisiraj_user:PASSWORD@/unisiraj_cia_db?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
```

### C. Google Cloud Scheduler (Automated Daily Monitoring)
Schedule the daily visa monitoring job to run every morning at 06:00 MYT (22:00 UTC):
```bash
gcloud scheduler jobs create http unisiraj-daily-visa-monitoring \
  --schedule="0 22 * * *" \
  --time-zone="Asia/Kuala_Lumpur" \
  --uri="https://unisiraj-backend-xxx.run.app/api/v1/visa-monitoring/run" \
  --http-method=POST \
  --headers="X-Scheduler-Token=YOUR_SECURE_JWT_SECRET"
```

---

## 7. Security Best Practices
1. **Zero Secret Hardcoding**: All credentials, tokens, and database passwords are read from environment variables or Google Secret Manager.
2. **Safe Password Storage**: Argon2id password hashing using OWASP-recommended parameters (64MB memory cost, 3 iterations, 4 parallelism threads).
3. **Idempotent Messaging**: Database unique constraint `(student_id, milestone_days, channel)` guarantees that students never receive duplicate WhatsApp reminders for the same milestone.
4. **Read-Only AI Agent**: The Gemini assistant executes parameterized Python/SQL queries with predefined tools, strictly prohibiting arbitrary SQL injection, shell command execution, or policy hallucination.
