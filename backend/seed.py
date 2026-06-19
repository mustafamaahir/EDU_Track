"""
Run once to insert initial students and admin into the database.
Usage: python seed.py
"""
from passlib.context import CryptContext
from sqlmodel import Session
from app.database import engine, create_db_and_tables
from app.models import User

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

USERS = [
    # Students — Form 3A
    {"username": "alice",   "password": "pass123",  "name": "Alice Mensah",     "class_name": "Form 3A", "role": "student"},
    {"username": "bob",     "password": "secure1",  "name": "Bob Asante",       "class_name": "Form 3A", "role": "student"},
    {"username": "carol",   "password": "carol99",  "name": "Carol Osei",       "class_name": "Form 3A", "role": "student"},
    {"username": "grace",   "password": "grace55",  "name": "Grace Owusu",      "class_name": "Form 3A", "role": "student"},
    # Students — Form 3B
    {"username": "david",   "password": "david88",  "name": "David Kofi",       "class_name": "Form 3B", "role": "student"},
    {"username": "eve",     "password": "eve2024",  "name": "Eve Agyemang",     "class_name": "Form 3B", "role": "student"},
    {"username": "frank",   "password": "frank77",  "name": "Frank Boateng",    "class_name": "Form 3B", "role": "student"},
    {"username": "henry",   "password": "henry66",  "name": "Henry Darko",      "class_name": "Form 3B", "role": "student"},
    # Admin
    {"username": "teacher", "password": "admin2024","name": "Mr. Acheampong",   "class_name": "Admin",   "role": "admin"},
]

def seed():
    create_db_and_tables()
    with Session(engine) as session:
        for u in USERS:
            user = User(
                username=u["username"],
                password_hash=pwd.hash(u["password"]),
                name=u["name"],
                class_name=u["class_name"],
                role=u["role"],
                status="approved",
            )
            session.add(user)
        session.commit()
        print(f"✅ Seeded {len(USERS)} users.")

if __name__ == "__main__":
    seed()
