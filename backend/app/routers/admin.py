from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from passlib.context import CryptContext
from app.database import get_session
from app.models import User, Result, AdminClass, UploadResultsRequest, CreateAdminRequest
from app.middleware.auth_guard import require_admin, require_superadmin

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── Super Admin: manage admins ────────────────────────────────────

@router.post("/create-admin", status_code=201)
def create_admin(
    body: CreateAdminRequest,
    superadmin: dict = Depends(require_superadmin),
    session: Session = Depends(get_session),
):
    existing = session.exec(select(User).where(User.username == body.username.lower())).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken.")

    admin = User(
        username=body.username.lower().strip(),
        password_hash=pwd_context.hash(body.password),
        name=body.name.strip(),
        class_name="",
        role="admin",
        status="approved",
    )
    session.add(admin)
    session.flush()  # get admin.id before committing

    for cls in body.classes:
        session.add(AdminClass(admin_id=admin.id, class_name=cls.strip()))

    session.commit()
    return {"message": f"Admin '{admin.name}' created and assigned to {body.classes}."}

@router.get("/admins")
def get_all_admins(
    superadmin: dict = Depends(require_superadmin),
    session: Session = Depends(get_session),
):
    admins = session.exec(select(User).where(User.role == "admin")).all()
    result = []
    for a in admins:
        classes = session.exec(
            select(AdminClass).where(AdminClass.admin_id == a.id)
        ).all()
        result.append({
            "id":       str(a.id),
            "username": a.username,
            "name":     a.name,
            "classes":  [c.class_name for c in classes],
        })
    return {"admins": result}

@router.patch("/assign-classes/{admin_id}")
def assign_classes(
    admin_id: UUID,
    classes: list[str],
    superadmin: dict = Depends(require_superadmin),
    session: Session = Depends(get_session),
):
    admin = session.get(User, admin_id)
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=404, detail="Admin not found")

    # Remove existing assignments
    existing = session.exec(select(AdminClass).where(AdminClass.admin_id == admin_id)).all()
    for e in existing:
        session.delete(e)

    # Add new assignments
    for cls in classes:
        session.add(AdminClass(admin_id=admin_id, class_name=cls.strip()))

    session.commit()
    return {"message": f"Classes updated for {admin.name}."}

@router.delete("/delete-admin/{admin_id}")
def delete_admin(
    admin_id: UUID,
    superadmin: dict = Depends(require_superadmin),
    session: Session = Depends(get_session),
):
    admin = session.get(User, admin_id)
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=404, detail="Admin not found")

    # Remove class assignments first
    existing = session.exec(select(AdminClass).where(AdminClass.admin_id == admin_id)).all()
    for e in existing:
        session.delete(e)

    session.delete(admin)
    session.commit()
    return {"message": f"Admin '{admin.name}' deleted."}


# ── Admin: pending approvals ──────────────────────────────────────

@router.get("/pending")
def get_pending_students(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    students = session.exec(
        select(User).where(User.role == "student", User.status == "pending").order_by(User.name)
    ).all()
    return {
        "pending": [
            {"id": str(s.id), "username": s.username, "name": s.name, "class_name": s.class_name}
            for s in students
        ]
    }

@router.patch("/approve/{user_id}")
def approve_student(
    user_id: UUID,
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == "approved":
        raise HTTPException(status_code=400, detail="User already approved")
    user.status = "approved"
    session.add(user)
    session.commit()
    return {"message": f"{user.name} approved."}

@router.delete("/reject/{user_id}")
def reject_student(
    user_id: UUID,
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    session.delete(user)
    session.commit()
    return {"message": f"{user.name}'s account rejected."}


# ── Admin: upload results (filtered by assigned classes) ──────────

@router.get("/my-classes")
def get_my_classes(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Returns classes assigned to the logged-in admin."""
    admin_id = UUID(admin["user_id"])
    rows = session.exec(select(AdminClass).where(AdminClass.admin_id == admin_id)).all()
    return {"classes": [r.class_name for r in rows]}

@router.get("/students")
def get_students(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Returns approved students — filtered to admin's assigned classes."""
    admin_id = UUID(admin["user_id"])
    role     = admin["role"]

    if role == "superadmin":
        students = session.exec(
            select(User).where(User.role == "student", User.status == "approved").order_by(User.class_name)
        ).all()
    else:
        assigned = session.exec(select(AdminClass).where(AdminClass.admin_id == admin_id)).all()
        class_names = [a.class_name for a in assigned]
        students = session.exec(
            select(User).where(
                User.role == "student",
                User.status == "approved",
                User.class_name.in_(class_names),
            ).order_by(User.class_name)
        ).all()

    return {
        "students": [
            {"id": str(s.id), "username": s.username, "name": s.name, "class_name": s.class_name, "status": s.status}
            for s in students
        ]
    }

@router.post("/upload-results")
def upload_results(
    body: UploadResultsRequest,
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    admin_id = UUID(admin["user_id"])
    role     = admin["role"]

    # Verify admin is assigned to this class (superadmin bypasses)
    if role != "superadmin":
        assigned = session.exec(
            select(AdminClass).where(
                AdminClass.admin_id == admin_id,
                AdminClass.class_name == body.class_name,
            )
        ).first()
        if not assigned:
            raise HTTPException(status_code=403, detail=f"You are not assigned to {body.class_name}")

    rows_saved = 0
    for entry in body.results:
        student = session.exec(
            select(User).where(
                User.username == entry.username,
                User.class_name == body.class_name,
                User.status == "approved",
            )
        ).first()

        if not student:
            raise HTTPException(status_code=404, detail=f"Student '{entry.username}' not found in {body.class_name}")

        for subj in entry.subjects:
            existing = session.exec(
                select(Result).where(
                    Result.student_id == student.id,
                    Result.week       == body.week,
                    Result.subject    == subj.subject,
                )
            ).first()

            if existing:
                existing.score     = subj.score
                existing.max_score = subj.max_score
                session.add(existing)
            else:
                session.add(Result(
                    student_id=student.id,
                    week=body.week,
                    subject=subj.subject,
                    score=subj.score,
                    max_score=subj.max_score,
                ))
            rows_saved += 1

    session.commit()
    return {"message": f"Results for {body.week} ({body.class_name}) uploaded.", "count": rows_saved}

@router.get("/weeks")
def get_weeks(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    rows = session.exec(select(Result.week).distinct()).all()
    return {"weeks": sorted(set(rows))}
