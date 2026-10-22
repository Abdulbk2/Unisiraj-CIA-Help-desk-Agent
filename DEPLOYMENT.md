# UniSIRAJ CIA Helpdesk Agent - Cloud Run & GitHub Deployment Guide

Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)  
Centre for International Affairs (CIA)

This document provides complete instructions for publishing the codebase to **GitHub** and deploying the unified application to **Google Cloud Run**.

---

## 🏛️ Architecture Overview

The system is configured as a **Cloud-Native Unified Container**:
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS compiled into `/app/dist`.
- **Backend**: FastAPI (Python 3.12) running under Uvicorn on `${PORT:-8080}`.
- **Serving Model**: FastAPI serves both the REST API endpoints (`/api/*`, `/api/v1/*`) and the production Single-Page Application (SPA) static bundle on root `/`.
- **Zero CORS Issues**: Because frontend and backend run on the same origin in Cloud Run, no cross-origin restrictions apply.

---

## 📦 Part 1: Publishing to GitHub

### 1. Initialize Local Git Repository
Open PowerShell or your terminal in the project root:
```bash
cd C:\Users\abdry\antigravity\UniSIRAJ-CIA-Helpdesk-Agent

# 1. Initialize git
git init

# 2. Verify git status (confirm .env and node_modules are ignored)
git status

# 3. Add all project files
git add .

# 4. Commit initial release
git commit -m "feat: complete UniSIRAJ CIA Helpdesk Agent production release"

# 5. Set default branch to main
git branch -M main
```

### 2. Link & Push to Your GitHub Repository
1. Go to [GitHub New Repository](https://github.com/new).
2. Repository name: `UniSIRAJ-CIA-Helpdesk-Agent`
3. Privacy: Select **Private** (recommended for university systems) or **Public**.
4. Leave *"Initialize this repository with a README"* unchecked.
5. Click **Create repository**.
6. In your terminal, run:
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/UniSIRAJ-CIA-Helpdesk-Agent.git
git push -u origin main
```

---

## ☁️ Part 2: Deploying to Google Cloud Run

You have three streamlined methods to deploy to Google Cloud Run. **Method A** is the simplest and recommended for immediate deployment.

---

### 🚀 Method A: 1-Command Deploy via Google Cloud SDK / Cloud Shell (Recommended)

Google Cloud can build the container image directly in the cloud using Google Cloud Build (no local Docker required):

1. **Open Google Cloud Shell** in the [Google Cloud Console](https://console.cloud.google.com/) (or install the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)).
2. Set your active Google Cloud project:
   ```bash
   gcloud config set project YOUR_GCP_PROJECT_ID
   ```
3. Enable necessary Google Cloud APIs:
   ```bash
   gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com
   ```
4. Deploy the source directory directly:
   ```bash
   gcloud run deploy unisiraj-cia-helpdesk \
     --source . \
     --region asia-southeast1 \
     --platform managed \
     --allow-unauthenticated \
     --port 8080 \
     --memory 1Gi \
     --cpu 1 \
     --set-env-vars "\
   ENVIRONMENT=production,\
   DEBUG=false,\
   DEFAULT_TIMEZONE=Asia/Kuala_Lumpur,\
   TWILIO_PROVIDER=twilio,\
   SMTP_HOST=smtp.gmail.com,\
   SMTP_PORT=587,\
   SMTP_USER=muhammadmataxu@gmail.com,\
   SMTP_FROM_NAME=UniSIRAJ CIA Helpdesk,\
   SMTP_FROM_EMAIL=muhammadmataxu@gmail.com,\
   SMTP_REPLY_TO=cia.helpdesk@unisiraj.edu.my,\
   SMTP_USE_TLS=true,\
   SMTP_USE_SSL=false"
   ```
5. Set sensitive secrets securely in Cloud Run:
   ```bash
   gcloud run services update unisiraj-cia-helpdesk \
     --region asia-southeast1 \
     --update-env-vars "\
   GEMINI_API_KEY=YOUR_GEMINI_API_KEY,\
   TWILIO_ACCOUNT_SID=YOUR_TWILIO_ACCOUNT_SID,\
   TWILIO_AUTH_TOKEN=YOUR_TWILIO_AUTH_TOKEN,\
   TWILIO_WHATSAPP_FROM=whatsapp:+17372508034,\
   SMTP_PASSWORD=YOUR_SMTP_APP_PASSWORD"
   ```
6. Google Cloud Run will output your live URL:
   `Service URL: https://unisiraj-cia-helpdesk-xxxxxx-as.a.run.app`

---

### 🔄 Method B: Continuous Deployment via Cloud Run Console (Zero Terminal)

1. Open **[Google Cloud Run Console](https://console.cloud.google.com/run)**.
2. Click **Create Service**.
3. Choose **Continuously deploy from a repository**.
4. Click **Set Up with Cloud Build**:
   - Provider: **GitHub**
   - Repository: Select `UniSIRAJ-CIA-Helpdesk-Agent`
   - Branch: `^main$`
   - Build Type: **Dockerfile** (Path: `/Dockerfile`)
5. Configuration:
   - Service Name: `unisiraj-cia-helpdesk`
   - Region: `asia-southeast1 (Singapore)`
   - Authentication: Allow unauthenticated invocations (Public Web App)
   - Port: `8080`
   - Memory: `1 GiB`
   - CPU: `1`
6. Under **Variables & Secrets**, add the environment variables listed in `.env.example`.
7. Click **Create**. Every time you `git push` to `main`, Cloud Run will automatically build and deploy!

---

### 🤖 Method C: Automated GitHub Actions CI/CD Pipeline

The repository includes a ready-to-run GitHub Actions workflow at [`.github/workflows/deploy-cloud-run.yml`](.github/workflows/deploy-cloud-run.yml).

1. In Google Cloud Console, create a Service Account with roles:
   - `Cloud Run Admin`
   - `Artifact Registry Writer`
   - `Service Account User`
2. Download the Service Account JSON key.
3. In your GitHub repository, navigate to **Settings > Secrets and variables > Actions > New repository secret**:
   - `GCP_PROJECT_ID`: Your Google Cloud Project ID
   - `GCP_SA_KEY`: Paste the full JSON contents of the downloaded Service Account key
4. Push to `main`:
   ```bash
   git push origin main
   ```
5. GitHub Actions will run the test suite and automatically deploy to Cloud Run!

---

## 🔒 Production Environment Variables Checklist

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `ENVIRONMENT` | Runtime mode | `production` |
| `DEBUG` | FastAPI debug mode | `false` |
| `DEFAULT_TIMEZONE` | Malaysian timezone | `Asia/Kuala_Lumpur` |
| `PORT` | Container listen port | `8080` (Auto-injected by Cloud Run) |
| `FRONTEND_DIST_DIR` | Compiled static files path | `/app/dist` |
| `GEMINI_API_KEY` | Google Gemini API Key | Secure secret |
| `TWILIO_PROVIDER` | WhatsApp messaging engine | `twilio` (live) or `mock` (demo) |
| `TWILIO_ACCOUNT_SID`| Twilio Account SID | `AC...` |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | Secure secret |
| `TWILIO_WHATSAPP_FROM` | Sender WhatsApp Number | `whatsapp:+17372508034` |
| `SMTP_HOST` | Outgoing mail server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `muhammadmataxu@gmail.com` |
| `SMTP_PASSWORD` | App-specific password | 16-character Google App Password |
| `SMTP_FROM_NAME` | Outgoing display name | `UniSIRAJ CIA Helpdesk` |
| `SMTP_FROM_EMAIL` | Sender email address | `muhammadmataxu@gmail.com` |
| `SMTP_REPLY_TO` | Official reply address | `cia.helpdesk@unisiraj.edu.my` |
| `SMTP_USE_TLS` | Transport Layer Security | `true` |
| `DATABASE_URL` | Database connection | `sqlite:///./unisiraj_cia.db` (ephemeral) or PostgreSQL URL |

---

## 🗄️ Database Options on Cloud Run

1. **Default (Zero-Config SQLite)**:
   - Uses `/app/unisiraj_cia.db`.
   - On initial container startup, the database automatically boots the default administrator (`admin@unisiraj.edu.my`) and seeds the UniSIRAJ international student dataset.
   - Ideal for demonstrations, proof-of-concept, and fast testing.
2. **Production Enterprise (Google Cloud SQL PostgreSQL)**:
   - Create a Cloud SQL PostgreSQL instance in `asia-southeast1`.
   - Set `DATABASE_URL` in Cloud Run:
     ```
     postgresql://unisiraj_user:PASSWORD@/unisiraj_cia_db?host=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
     ```
   - Connect the Cloud SQL instance in the Cloud Run service settings under **Cloud SQL connections**.

---

## 🌐 Custom Domain Mapping (e.g. cia.unisiraj.edu.my)

Once deployed on Cloud Run:
1. Go to **Cloud Run > Manage Custom Domains**.
2. Click **Add Mapping** and select service `unisiraj-cia-helpdesk`.
3. Enter your domain: `cia.unisiraj.edu.my`.
4. Copy the provided DNS records (`CNAME` or `A`/`AAAA`) into the UniSIRAJ DNS zone.
5. Google Cloud automatically provisions and renews a free **managed SSL/TLS certificate**.
