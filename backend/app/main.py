"""
UniSIRAJ CIA Helpdesk Agent - FastAPI Application Entrypoint
Centre of International Affairs (CIA), Universiti Islam Antarabangsa Tuanku Syed Sirajuddin
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.logging import setup_logging, logger
from app.core.security import hash_password, Role
from app.db.session import engine, SessionLocal
from app.db.base import Base
from app.models.user import User

# Import API Routers
from app.api.routes import (
    auth,
    dashboard,
    students,
    imports,
    visa_monitoring,
    notifications,
    webhooks,
    assistant,
    health,
    audit,
    excel,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application startup and shutdown lifecycle management.
    Initializes database tables, configures logging, and ensures bootstrap admin existence.
    """
    setup_logging()
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION} [{settings.ENVIRONMENT}]")

    # Initialize tables
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.error(f"Database table verification failed: {e}")

    # Bootstrap default administrator if enabled
    if settings.BOOTSTRAP_ADMIN_ENABLED and settings.BOOTSTRAP_ADMIN_EMAIL:
        db = SessionLocal()
        try:
            admin_user = db.query(User).filter(User.email == settings.BOOTSTRAP_ADMIN_EMAIL.lower()).first()
            if not admin_user:
                logger.info(f"Bootstrapping default administrator account: {settings.BOOTSTRAP_ADMIN_EMAIL}")
                admin_user = User(
                    email=settings.BOOTSTRAP_ADMIN_EMAIL.lower(),
                    full_name=settings.BOOTSTRAP_ADMIN_NAME,
                    password_hash=hash_password(settings.BOOTSTRAP_ADMIN_PASSWORD),
                    role=Role.ADMIN,
                    is_active=True,
                )
                db.add(admin_user)
                db.commit()
                logger.info("Bootstrap administrator account created successfully.")
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to bootstrap administrator account: {e}")
        finally:
            db.close()

    # Bootstrap initial international student dataset if table is empty
    db = SessionLocal()
    try:
        from app.models.student import Student
        from app.services.student_service import determine_student_status, calculate_days_remaining
        from datetime import date, timedelta
        if db.query(Student).count() == 0:
            logger.info("Empty students table detected; seeding initial UniSIRAJ sample records...")
            today = date.today()
            samples = [
                Student(
                    matric_id="8231123071",
                    student_name="Abdulrahman Yahaya",
                    email="muhammadmataxu@gmail.com",
                    whatsapp_number="+601140478950",
                    passport_number="A1122334",
                    nationality="Nigeria",
                    faculty="Faculty of Islamic Studies",
                    program="Bachelor of Islamic Studies",
                    visa_expiry_date=today + timedelta(days=77),
                ),
                Student(
                    matric_id="8231123072",
                    student_name="Usman Usman",
                    email="muhammadmataxu@gmail.com",
                    whatsapp_number="+60123456789",
                    passport_number="A2233445",
                    nationality="Cameroon",
                    faculty="Faculty of Computing & Informatics",
                    program="Bachelor of Computer Science",
                    visa_expiry_date=today + timedelta(days=47),
                ),
                Student(
                    matric_id="8231123073",
                    student_name="Muhammad Doshiro",
                    email="muhammadmataxu@gmail.com",
                    whatsapp_number="+60134567890",
                    passport_number="A3344556",
                    nationality="Somalia",
                    faculty="Faculty of Islamic Finance",
                    program="Master of Islamic Finance",
                    visa_expiry_date=today + timedelta(days=17),
                ),
                Student(
                    matric_id="8231123074",
                    student_name="Aminu Ibrahim",
                    email="muhammadmataxu@gmail.com",
                    whatsapp_number="+60145678901",
                    passport_number="A4455667",
                    nationality="Ghana",
                    faculty="Faculty of Shariah & Law",
                    program="Bachelor of Laws (LL.B)",
                    visa_expiry_date=today + timedelta(days=7),
                ),
                Student(
                    matric_id="8231123075",
                    student_name="Muhammad Mataxuh",
                    email="muhammadmataxu@gmail.com",
                    whatsapp_number="+60167890123",
                    passport_number="A5566778",
                    nationality="Sudan",
                    faculty="Faculty of Language & Translation",
                    program="Bachelor of Arabic Language",
                    visa_expiry_date=today + timedelta(days=112),
                ),
                Student(
                    matric_id="8231123076",
                    student_name="Muhammad Abdullahi",
                    email="muhammadmataxu@gmail.com",
                    whatsapp_number="+60167890123",
                    passport_number="A6677889",
                    nationality="Yemen",
                    faculty="Faculty of Islamic Studies",
                    program="Doctor of Philosophy in Islamic Studies",
                    visa_expiry_date=today + timedelta(days=144),
                ),
            ]
            for s in samples:
                days = calculate_days_remaining(s.visa_expiry_date, today)
                s.status = determine_student_status(days)
                db.add(s)
            db.commit()
            logger.info(f"Successfully seeded {len(samples)} UniSIRAJ international student records.")
    except Exception as e:
        db.rollback()
        logger.warning(f"Initial student seeding skipped or encountered error: {e}")
    finally:
        db.close()

    yield

    logger.info(f"Shutting down {settings.APP_NAME}.")


# Initialize FastAPI instance
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "Production-oriented backend for the Centre of International Affairs (CIA), "
        "Universiti Islam Antarabangsa Tuanku Syed Sirajuddin (UniSIRAJ). "
        "Manages international student visa compliance, 90/60/30-day automated WhatsApp reminders, "
        "spreadsheet ingestion, and grounded AI administrative assistance."
    ),
    docs_url="/docs" if settings.DEBUG or settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.DEBUG or settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global Exception Handler to ensure no secrets or stack traces leak in production
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}", exc_info=True)
    if settings.DEBUG:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": str(exc), "type": type(exc).__name__},
        )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please contact the CIA administrator."},
    )


# ------------------------------------------------------------------------------
# Mount Routes under /api/v1 (Master specification standard)
# ------------------------------------------------------------------------------
api_v1_routers = [
    auth.router,
    dashboard.router,
    students.router,
    imports.router,
    visa_monitoring.router,
    notifications.router,
    webhooks.router,
    assistant.router,
    health.router,
    audit.router,
    excel.router,
]

for router in api_v1_routers:
    app.include_router(router, prefix="/api/v1")

# ------------------------------------------------------------------------------
# Mount Route Aliases under /api (Existing Frontend client.ts compatibility)
# ------------------------------------------------------------------------------
for router in api_v1_routers:
    app.include_router(router, prefix="/api")

# Also mount monitoring sync directly under /api/monitoring for client.ts compatibility
app.add_api_route(
    "/api/monitoring/sync",
    visa_monitoring.trigger_daily_sync,
    methods=["POST"],
    tags=["Visa Expiry Monitoring"],
)


# ------------------------------------------------------------------------------
# Serve Frontend Single-Page Application (SPA) in Production / Cloud Run
# ------------------------------------------------------------------------------
frontend_dist = os.getenv("FRONTEND_DIST_DIR", "")
if not frontend_dist or not os.path.isdir(frontend_dist):
    candidates = [
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "dist"),
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "dist"),
        "/app/dist",
    ]
    for c in candidates:
        if os.path.isdir(c):
            frontend_dist = c
            break

if frontend_dist and os.path.isdir(frontend_dist):
    logger.info(f"Serving production frontend SPA from: {frontend_dist}")

    # Mount static assets directory
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="spa_assets")

    images_dir = os.path.join(frontend_dist, "images")
    if os.path.isdir(images_dir):
        app.mount("/images", StaticFiles(directory=images_dir), name="spa_images")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_app(full_path: str):
        # Do not catch API or documentation routes
        if full_path.startswith(("api/", "api/v1/", "docs", "redoc", "openapi.json")):
            return JSONResponse(status_code=404, content={"detail": f"Route '{full_path}' not found"})
        target_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(target_path):
            return FileResponse(target_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.isfile(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend index.html not found"})
else:
    @app.get("/", tags=["Root"])
    def root():
        return {
            "service": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "environment": settings.ENVIRONMENT,
            "docs_url": "/docs",
            "api_v1_prefix": "/api/v1",
            "status": "operational",
        }
