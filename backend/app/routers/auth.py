import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session, select
from jose import jwt
from passlib.context import CryptContext
from app.database import get_session
from app.models import User, LoginRequest, SignupRequest

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
JWT_SECRET  = os.environ.get("JWT_SECRET", "change-this-secret")
ALGORITHM   = "HS256"
TOKEN_EXPIRE_HOURS = 8

@router.post("/login")
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(
        select(User).where(User.username == body.username.lower().strip())
    ).first()

    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if user.status == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending admin approval. Please check back later."
        )

    payload = {
        "user_id":    str(user.id),
        "username":   user.username,
        "name":       user.name,
        "role":       user.role,
        "class_name": user.class_name,
        "exp":        datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS),
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

    return {
        "access_token": token,
        "token_type":   "bearer",
        "user": {
            "id":         str(user.id),
            "username":   user.username,
            "name":       user.name,
            "role":       user.role,
            "class_name": user.class_name,
        }
    }


@router.post("/signup", status_code=201)
def signup(body: SignupRequest, session: Session = Depends(get_session)):
    # Check username not already taken
    existing = session.exec(
        select(User).where(User.username == body.username.lower().strip())
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another."
        )

    user = User(
        username=body.username.lower().strip(),
        password_hash=pwd_context.hash(body.password),
        name=body.name.strip(),
        class_name=body.class_name.strip(),
        role="student",
        status="pending",   # must be approved by admin before login
    )
    session.add(user)
    session.commit()

    return {"message": "Account created successfully. Please wait for admin approval before logging in."}
