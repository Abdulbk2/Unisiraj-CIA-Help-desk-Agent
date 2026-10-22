# ==============================================================================
# UniSIRAJ CIA Helpdesk Agent - Multi-Stage Production Container
# Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ)
# Optimized for Google Cloud Run (Full-Stack Unified Container)
# ==============================================================================

# STAGE 1: Frontend Build
FROM node:22-slim AS frontend-builder
WORKDIR /app

# Install dependencies using package-lock.json with legacy peer deps protection
COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Copy frontend source
COPY tsconfig.json vite.config.ts index.html ./
COPY firebase-applet-config.json* metadata.json* ./
COPY public ./public
COPY src ./src

# Build frontend to /app/dist
RUN npm run build

# STAGE 2: Python Backend & Production Runner
FROM python:3.12-slim AS runner
WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    FRONTEND_DIST_DIR=/app/dist

# Install minimal OS dependencies for PostgreSQL and health checks
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Backend application
COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini

# Copy Built Frontend dist from Stage 1
COPY --from=frontend-builder /app/dist ./dist

# Create secure non-root user
RUN groupadd -r appuser && useradd -r -g appuser -m appuser && \
    mkdir -p /app/data && \
    chown -R appuser:appuser /app
USER appuser

EXPOSE 8080

# Cloud Run injects $PORT (default 8080)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
