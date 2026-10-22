"""
UniSIRAJ CIA Helpdesk Agent - Administrative CLI & Bootstrap Utility
"""

import sys
import argparse
from datetime import datetime, date, timedelta, timezone
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.user import User
from app.models.student import Student, StudentStatus
from app.core.security import hash_password, Role
from app.core.config import settings
from app.core.logging import logger
from app.services.student_service import calculate_days_remaining, determine_student_status


def init_db():
    """Create all database tables if they do not exist."""
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")


def create_admin(email: str, password: str, full_name: str = "CIA Administrator"):
    """Create or update an administrative user."""
    init_db()
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email.lower().strip()).first()
        if user:
            print(f"User '{email}' already exists. Updating role to admin and resetting password.")
            user.password_hash = hash_password(password)
            user.role = Role.ADMIN
            user.is_active = True
            user.full_name = full_name
        else:
            user = User(
                email=email.lower().strip(),
                full_name=full_name,
                password_hash=hash_password(password),
                role=Role.ADMIN,
                is_active=True,
            )
            db.add(user)
        db.commit()
        print(f"Administrator '{email}' created/updated successfully.")
    finally:
        db.close()


def seed_demo_data():
    """Seed initial international student sample records for demonstration and testing."""
    init_db()
    db = SessionLocal()
    today = datetime.now(timezone.utc).date()

    sample_students = [
        {
            "matric_id": "UIS-2023-INT084",
            "student_name": "Tariq Al-Mansoor",
            "email": "tariq.mansoor@student.unisiraj.edu.my",
            "whatsapp_number": "+601123456789",
            "passport_number": "09482103",
            "nationality": "Yemen",
            "faculty": "Faculty of Islamic Economics & Business",
            "program": "Bachelor of Islamic Finance (Hons)",
            "days_offset": -12,  # Expired
        },
        {
            "matric_id": "UIS-2024-INT119",
            "student_name": "Amina Zainab Bello",
            "email": "amina.bello@student.unisiraj.edu.my",
            "whatsapp_number": "+60123454321",
            "passport_number": "A1049281",
            "nationality": "Nigeria",
            "faculty": "Faculty of Quranic & Islamic Studies",
            "program": "Bachelor of Usuluddin (Hons)",
            "days_offset": 0,  # Critical (expires today)
        },
        {
            "matric_id": "UIS-2023-INT042",
            "student_name": "Fajar Nurul Huda",
            "email": "fajar.huda@student.unisiraj.edu.my",
            "whatsapp_number": "+60178907890",
            "passport_number": "B9876543",
            "nationality": "Indonesia",
            "faculty": "Faculty of Shariah & Law",
            "program": "Master of Comparative Law",
            "days_offset": 9,  # Critical
        },
        {
            "matric_id": "UIS-2022-INT008",
            "student_name": "Zhang Wei (Rashid)",
            "email": "zhang.wei@student.unisiraj.edu.my",
            "whatsapp_number": "+60198888901",
            "passport_number": "E4729103",
            "nationality": "China",
            "faculty": "Faculty of Education & Social Sciences",
            "program": "PhD in Education",
            "days_offset": 19,  # Critical
        },
        {
            "matric_id": "UIS-2024-INT201",
            "student_name": "Bilal Al-Husseini",
            "email": "bilal.husseini@student.unisiraj.edu.my",
            "whatsapp_number": "+60163334455",
            "passport_number": "SY839102",
            "nationality": "Syria",
            "faculty": "Faculty of Shariah & Law",
            "program": "Bachelor of Fiqh & Fatwa",
            "days_offset": 28,  # Critical
        },
        {
            "matric_id": "UIS-2023-INT156",
            "student_name": "Tanvir Hossain",
            "email": "tanvir.hossain@student.unisiraj.edu.my",
            "whatsapp_number": "+60134441234",
            "passport_number": "BF901234",
            "nationality": "Bangladesh",
            "faculty": "Faculty of Computing & Informatics",
            "program": "Bachelor of Computer Science (Cybersecurity)",
            "days_offset": 44,  # Urgent (60 days)
        },
        {
            "matric_id": "UIS-2023-INT177",
            "student_name": "Fatoumata Camara",
            "email": "fatoumata.camara@student.unisiraj.edu.my",
            "whatsapp_number": "+60185556677",
            "passport_number": "GM204918",
            "nationality": "Gambia",
            "faculty": "Faculty of Islamic Economics & Business",
            "program": "Bachelor of Accounting (Information Systems)",
            "days_offset": 52,  # Urgent (60 days)
        },
        {
            "matric_id": "UIS-2024-INT305",
            "student_name": "Mehmet Fatih Demir",
            "email": "mehmet.demir@student.unisiraj.edu.my",
            "whatsapp_number": "+60126667788",
            "passport_number": "U2948103",
            "nationality": "Turkey",
            "faculty": "Faculty of Languages & Linguistics",
            "program": "Master of Arabic for Specific Purposes",
            "days_offset": 75,  # Action Needed (90 days)
        },
        {
            "matric_id": "UIS-2024-INT340",
            "student_name": "Sara Binte Omar",
            "email": "sara.omar@student.unisiraj.edu.my",
            "whatsapp_number": "+60117778899",
            "passport_number": "SD901248",
            "nationality": "Sudan",
            "faculty": "Faculty of Quranic & Islamic Studies",
            "program": "Bachelor of Quran & Qiraat",
            "days_offset": 88,  # Action Needed (90 days)
        },
        {
            "matric_id": "UIS-2025-INT012",
            "student_name": "Abdoulaye Diallo",
            "email": "abdoulaye.diallo@student.unisiraj.edu.my",
            "whatsapp_number": "+60148889900",
            "passport_number": "GN392014",
            "nationality": "Guinea",
            "faculty": "Faculty of Shariah & Law",
            "program": "Bachelor of Islamic Law",
            "days_offset": 140,  # Safe
        },
        {
            "matric_id": "UIS-2025-INT045",
            "student_name": "Nadia Binti Hassan",
            "email": "nadia.hassan@student.unisiraj.edu.my",
            "whatsapp_number": "+60192223344",
            "passport_number": "SO194820",
            "nationality": "Somalia",
            "faculty": "Faculty of Computing & Informatics",
            "program": "Bachelor of Software Engineering",
            "days_offset": 210,  # Safe
        },
    ]

    try:
        count = 0
        for item in sample_students:
            existing = db.query(Student).filter(Student.matric_id == item["matric_id"]).first()
            exp_date = today + timedelta(days=item["days_offset"])
            days = (exp_date - today).days
            st = determine_student_status(days)

            if existing:
                existing.visa_expiry_date = exp_date
                existing.status = st
            else:
                s = Student(
                    matric_id=item["matric_id"],
                    student_name=item["student_name"],
                    email=item["email"],
                    whatsapp_number=item["whatsapp_number"],
                    passport_number=item["passport_number"],
                    nationality=item["nationality"],
                    faculty=item["faculty"],
                    program=item["program"],
                    visa_expiry_date=exp_date,
                    status=st,
                    last_verified_at=datetime.now(timezone.utc),
                )
                db.add(s)
                count += 1
        db.commit()
        print(f"Seeded {count} demo student records successfully.")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="UniSIRAJ CIA Helpdesk Agent CLI")
    subparsers = parser.add_subparsers(dest="command")

    # init-db
    subparsers.add_parser("init-db", help="Initialize all database tables")

    # create-admin
    admin_parser = subparsers.add_parser("create-admin", help="Create or update an administrator account")
    admin_parser.add_argument("--email", required=True, help="Administrator email address")
    admin_parser.add_argument("--password", required=True, help="Secure password (min 8 chars)")
    admin_parser.add_argument("--name", default="CIA Administrator", help="Full name")

    # seed-demo-data
    subparsers.add_parser("seed-demo-data", help="Seed initial sample student visa records")

    args = parser.parse_args()

    if args.command == "init-db":
        init_db()
    elif args.command == "create-admin":
        create_admin(email=args.email, password=args.password, full_name=args.name)
    elif args.command == "seed-demo-data":
        seed_demo_data()
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
