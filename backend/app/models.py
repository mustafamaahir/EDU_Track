from typing import Optional, List
from uuid import UUID, uuid4
from sqlmodel import SQLModel, Field, Relationship
from pydantic import BaseModel

class AdminClass(SQLModel, table=True):
    __tablename__ = "admin_classes"
    id:         UUID = Field(default_factory=uuid4, primary_key=True)
    admin_id:   UUID = Field(foreign_key="users.id", index=True)
    class_name: str  = Field(index=True)

class User(SQLModel, table=True):
    __tablename__ = "users"
    id:            UUID = Field(default_factory=uuid4, primary_key=True)
    username:      str  = Field(unique=True, index=True)
    password_hash: str
    name:          str
    class_name:    str  = Field(default="")
    role:          str  = Field(default="student")   # "student" | "admin" | "superadmin"
    status:        str  = Field(default="pending")   # "pending" | "approved"
    results: List["Result"] = Relationship(back_populates="student")

class Result(SQLModel, table=True):
    __tablename__ = "results"
    id:         UUID  = Field(default_factory=uuid4, primary_key=True)
    student_id: UUID  = Field(foreign_key="users.id", index=True)
    week:       str   = Field(index=True)
    subject:    str
    score:      float
    max_score:  float = Field(default=100)
    student: Optional[User] = Relationship(back_populates="results")

# ── Schemas ───────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    username: str
    password: str

class SignupRequest(BaseModel):
    username:   str
    password:   str
    name:       str
    class_name: str = ""

class SubjectScore(BaseModel):
    subject:   str
    score:     float
    max_score: float = 100

class StudentUpload(BaseModel):
    username: str
    subjects: List[SubjectScore]

class UploadResultsRequest(BaseModel):
    week:       str
    class_name: str
    results:    List[StudentUpload]

class CreateAdminRequest(BaseModel):
    username: str
    password: str
    name:     str
    classes:  List[str]
