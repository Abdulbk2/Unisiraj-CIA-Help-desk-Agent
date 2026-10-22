<div align="center">

# 🏛️ UniSIRAJ CIA Helpdesk Agent
### Visa Compliance & Renewal Monitoring System
**Centre for International Affairs (CIA)**  
*Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)*

[![Cloud Run](https://img.shields.io/badge/Google%20Cloud%20Run-Deployed-4285F4?style=flat&logo=googlecloud&logoColor=white)](https://unisiraj-cia-helpdesk-6fa3krh6aq-as.a.run.app)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python&logoColor=white)](https://python.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Gemini AI](https://img.shields.io/badge/Google%20Gemini-2.5%20Flash-8E75B2?style=flat&logo=google&logoColor=white)](https://ai.google.dev)
[![License](https://img.shields.io/badge/License-Proprietary%20UniSIRAJ-1B365D?style=flat)](#)

---

**Live Production Deployment:**  
👉 **[https://unisiraj-cia-helpdesk-6fa3krh6aq-as.a.run.app](https://unisiraj-cia-helpdesk-6fa3krh6aq-as.a.run.app)**  
*(Alternative URL: `https://unisiraj-cia-helpdesk-234913392666.asia-southeast1.run.app`)*

</div>

---

## 📋 Executive Overview

The **UniSIRAJ CIA Helpdesk Agent** is a production-grade full-stack compliance management platform developed for the **Centre for International Affairs (CIA)** at **Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)**. 

The system automates the tracking of international student student-pass / visa expiry dates, enforces regulatory compliance timelines (90, 60, and 30-day renewal windows), dispatches multi-channel communications (WhatsApp and Live SMTP Email), supports master Excel spreadsheet ingestion, and provides an administrative AI assistant grounded strictly in verified institutional database records.

---

## ✨ Key Capabilities & Features

### 1. 🛡️ Real-Time Visa Compliance & Monitoring
- **Automated Expiry Calculations**: Deterministic calculation of days remaining relative to current business dates.
- **Dynamic Tier Categorization**:
  - 🟢 **Safe Tier**: $>90$ days remaining.
  - 🟡 **90-Day Renewal Window**: Formal reminder to initiate documentation.
  - 🟠 **60-Day Urgent Window**: Urgent follow-up to ensure submission to Malaysian Immigration.
  - 🔴 **30-Day Critical Window**: Critical emergency tier to prevent overstaying penalties.
  - ⚠️ **Overstayed / Expired**: Instant alert flagging for officer intervention.
- **Active Record Syncing**: Real-Time Compliance Metrics automatically reflect all active database modifications.

### 2. 💬 Multi-Channel Communications
- **WhatsApp Notifications (Dual Mode)**:
  - **Demo / Simulation Mode (Default)**: Instant simulation of message delivery with mock SID generation (`SM_DEMO_...`), state updates, and full audit logging for risk-free staff training.
  - **Live Twilio API**: Direct enterprise delivery through Twilio WhatsApp Business API with real-time webhook status callbacks.
  - **Full Audit Trail**: Inspect delivery states (`queued`, `sent`, `delivered`, `failed`), timestamps, and officer triggers with one-click record deletion.
- **Official University Email (Live Real-Time SMTP)**:
  - Direct integration via SMTP (`smtp.gmail.com`).
  - Professional institutional email formatting branded with the official **UniSIRAJ Emblem** and **CIA Helpdesk Identity**.
  - Direct student renewal notices with follow-up instructions and regulatory reminders.

### 3. 🤖 Grounded AI Helpdesk Agent
- Powered by **Google Gemini 2.5 Flash Lite**.
- Strictly grounded in the university database with zero external hallucination.
- Capable of answering complex student queries, generating visa renewal summaries, drafting official notices, and explaining Malaysian immigration requirements.

### 4. 📊 Data Ingestion & Administrative UI
- **Master Excel Spreadsheet Integration**: Ingest, preview, and validate `.xlsx` and `.csv` files with automatic column mapping, duplicate detection, and validation reports.
- **Enterprise Data Tables**: Serial numbering across all data tables, multi-column sorting, search filters, and flexible pagination (5, 10, 20, 50, and 100 rows per page).
- **Institutionally Aligned Design**: Adheres to official UniSIRAJ identity standards with static header navigation, responsive sidebar, and clean typography.

---

## 🏛️ System Architecture

```
UniSIRAJ-CIA-Helpdesk-Agent/
├── Dockerfile                   # Multi-stage production container (Node 22 + Python 3.12)
├── deploy-cloudrun.ps1          # One-click PowerShell deployment script for Cloud Run
├── DEPLOYMENT.md                # In-depth Cloud Run & GitHub deployment documentation
├── package.json                 # Frontend dependencies (React 19, Tailwind CSS, Vite)
├── vite.config.ts               # Vite configuration with ES module path resolution
├── src/                         # React 19 Frontend Application
│   ├── components/              # Modular UI components (WhatsApp, Tables, Modals, TopNav)
│   ├── views/                   # Full-page views (Dashboard, Monitoring, WhatsApp, Reports)
│   ├── lib/api/                 # Axios & fetch API client layers
│   └── types/                   # TypeScript interfaces and contracts
└── backend/                     # FastAPI Production Backend
    ├── requirements.txt         # Python dependencies
    ├── alembic.ini              # Database migration configuration
    └── app/
        ├── main.py              # Application entrypoint & SPA static asset server
        ├── core/                # Configuration, JWT security & logging
        ├── db/                  # SQLAlchemy ORM session & base models
        ├── models/              # Student, User, Notification, AuditLog entities
        ├── schemas/             # Pydantic v2 input/output validation contracts
        ├── services/            # Business logic (Visa, WhatsApp, SMTP, Gemini AI)
        └── api/routes/          # REST endpoints (/auth, /students, /dashboard, /notifications)
```

---

## 🚀 Quick Start & Local Development

### Prerequisites
- **Node.js**: v20 or v22
- **Python**: v3.11, v3.12, or v3.14
- **PowerShell** (Windows) or **Bash** (macOS/Linux)

---

### 1. Backend Setup

```powershell
# Navigate to backend
cd backend

# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1    # On Windows
# source venv/bin/activate     # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
Copy-Item .env.example .env

# Run FastAPI backend with hot-reload
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

The backend API will be accessible at:
- **API Root**: `http://127.0.0.1:8000`
- **Interactive OpenAPI Docs**: `http://127.0.0.1:8000/docs`
- **Health Check**: `http://127.0.0.1:8000/api/v1/health`

---

### 2. Frontend Setup

In a separate terminal:

```powershell
# Install frontend packages
npm install

# Start Vite development server
npm run dev
```

The React frontend will be accessible at `http://localhost:3000`.

---

## 🔑 Default Administrator Credentials

On first run (both locally and in Cloud Run), the system automatically initializes the database and creates the bootstrap administrator account:

| Field | Value |
| :--- | :--- |
| **Email** | `admin@unisiraj.edu.my` |
| **Password** | `AdminSecurePassword123!` |
| **Role** | System Administrator |

---

## ☁️ Deployment Guide

### Deploying to Google Cloud Run

The application is containerized using a multi-stage Docker build that bundles the compiled React frontend into a unified FastAPI runner on port `8080`.

1. Ensure the Google Cloud SDK (`gcloud`) is installed and authenticated:
   ```powershell
   gcloud auth login
   gcloud config set project unisiraj-cia-helpdesk-agent
   ```

2. Run the automated deployment script:
   ```powershell
   .\deploy-cloudrun.ps1
   ```

3. The script will automatically build the container via Cloud Build and output your live service URL.

---

### Deploying to GitHub

```powershell
# Add remote repository
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/UniSIRAJ-CIA-Helpdesk-Agent.git

# Ensure main branch and push
git branch -M main
git push -u origin main
```

---

## 📡 REST API Reference Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Officer authentication & JWT token issuance |
| `GET` | `/api/v1/dashboard/summary` | Real-time compliance metrics, delivery stats, and activity logs |
| `GET` | `/api/v1/students` | Paginated international student records with search & filters |
| `POST` | `/api/v1/students` | Register a new international student |
| `GET` | `/api/v1/visa-monitoring/summary` | Compliance tier summaries and upcoming milestones |
| `GET` | `/api/v1/notifications/eligible` | WhatsApp reminder eligibility queue |
| `POST` | `/api/v1/notifications/send-single` | Dispatch WhatsApp notification (Demo or Twilio Live) |
| `DELETE`| `/api/v1/notifications/{id}` | Remove notification log entry from history |
| `POST` | `/api/v1/notifications/send-email` | Dispatch official live SMTP email notice |
| `POST` | `/api/v1/assistant/query` | Query grounded Gemini AI helpdesk agent |
| `GET` | `/api/v1/health` | Comprehensive system health check |

---

## 📜 Institutional Standards & Attribution

- **Institution**: Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)
- **Department**: Centre for International Affairs (CIA)
- **Visual Identity**: The official UniSIRAJ emblem and CIA Helpdesk Agent wordmark are protected institutional assets. Maintain aspect ratio and visual separation per institutional identity guidelines.
- **Copyright**: &copy; 2026 Universiti Islam Antarabangsa Tuanku Syed Sirajuddin. All rights reserved.
