from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, select
from uuid import UUID
from passlib.context import CryptContext
from app.database import get_session
from app.models import User, Result, AdminClass, AdminSubject, UploadResultsRequest, CreateAdminRequest, AssignSubjectsRequest
from app.middleware.auth_guard import require_admin, require_superadmin

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

MASTER_SUBJECTS = ["Arobiyyah", "Qiroohah", "Memorization", "Writing", "Hadith"]

# ── Superadmin: manage admins ─────────────────────────────────────

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
    session.flush()

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
        classes = session.exec(select(AdminClass).where(AdminClass.admin_id == a.id)).all()
        # Get subjects per class
        subjects_by_class = {}
        for cls in classes:
            subs = session.exec(
                select(AdminSubject).where(
                    AdminSubject.admin_id == a.id,
                    AdminSubject.class_name == cls.class_name,
                )
            ).all()
            subjects_by_class[cls.class_name] = [s.subject for s in subs]

        result.append({
            "id":               str(a.id),
            "username":         a.username,
            "name":             a.name,
            "classes":          [c.class_name for c in classes],
            "subjects_by_class": subjects_by_class,
        })
    return {"admins": result}

@router.get("/master-subjects")
def get_master_subjects(admin: dict = Depends(require_admin)):
    return {"subjects": MASTER_SUBJECTS}

@router.post("/assign-subjects")
def assign_subjects(
    body: AssignSubjectsRequest,
    superadmin: dict = Depends(require_superadmin),
    session: Session = Depends(get_session),
):
    admin_id = UUID(body.admin_id)
    # Remove existing subject assignments for this admin+class
    existing = session.exec(
        select(AdminSubject).where(
            AdminSubject.admin_id == admin_id,
            AdminSubject.class_name == body.class_name,
        )
    ).all()
    for e in existing:
        session.delete(e)

    # Add new ones
    for subj in body.subjects:
        session.add(AdminSubject(admin_id=admin_id, class_name=body.class_name, subject=subj))

    session.commit()
    return {"message": f"Subjects updated for class {body.class_name}."}

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

    existing = session.exec(select(AdminClass).where(AdminClass.admin_id == admin_id)).all()
    for e in existing:
        session.delete(e)

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

    for e in session.exec(select(AdminClass).where(AdminClass.admin_id == admin_id)).all():
        session.delete(e)
    for e in session.exec(select(AdminSubject).where(AdminSubject.admin_id == admin_id)).all():
        session.delete(e)

    session.delete(admin)
    session.commit()
    return {"message": f"Admin '{admin.name}' deleted."}


# ── Superadmin: assign students ───────────────────────────────────

@router.patch("/assign-student/{student_id}")
def assign_student_class(
    student_id: UUID,
    class_name: str,
    superadmin: dict = Depends(require_superadmin),
    session: Session = Depends(get_session),
):
    student = session.get(User, student_id)
    if not student or student.role != "student":
        raise HTTPException(status_code=404, detail="Student not found")
    student.class_name = class_name.strip()
    session.add(student)
    session.commit()
    return {"message": f"{student.name} assigned to {class_name}."}

@router.get("/all-students")
def get_all_students_superadmin(
    superadmin: dict = Depends(require_superadmin),
    session: Session = Depends(get_session),
):
    students = session.exec(
        select(User).where(User.role == "student").order_by(User.class_name, User.name)
    ).all()
    return {
        "students": [
            {"id": str(s.id), "username": s.username, "name": s.name, "class_name": s.class_name, "status": s.status}
            for s in students
        ]
    }


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
        raise HTTPException(status_code=400, detail="Already approved")
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
    return {"message": f"{user.name} rejected."}


# ── Admin: classes and subjects ───────────────────────────────────

@router.get("/my-classes")
def get_my_classes(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    admin_id = UUID(admin["user_id"])
    rows = session.exec(select(AdminClass).where(AdminClass.admin_id == admin_id)).all()
    return {"classes": [r.class_name for r in rows]}

@router.get("/my-subjects")
def get_my_subjects(
    class_name: str = Query(...),
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Returns subjects assigned to this admin for a specific class."""
    admin_id = UUID(admin["user_id"])
    role     = admin["role"]

    if role == "superadmin":
        return {"subjects": MASTER_SUBJECTS}

    rows = session.exec(
        select(AdminSubject).where(
            AdminSubject.admin_id == admin_id,
            AdminSubject.class_name == class_name,
        )
    ).all()
    return {"subjects": [r.subject for r in rows]}


# ── Admin: students ───────────────────────────────────────────────

@router.get("/students")
def get_students(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
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


# ── Admin: upload results ─────────────────────────────────────────

@router.get("/existing-results")
def get_existing_results(
    week: str = Query(...),
    class_name: str = Query(...),
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Load previously saved scores for a week+class so admin can see/edit them."""
    students = session.exec(
        select(User).where(User.class_name == class_name, User.role == "student", User.status == "approved")
    ).all()

    student_ids = [s.id for s in students]
    results = session.exec(
        select(Result).where(Result.week == week, Result.student_id.in_(student_ids))
    ).all()

    # Build map: { username: { subject: score } }
    student_map = {s.id: s.username for s in students}
    scores = {}
    for r in results:
        username = student_map.get(r.student_id)
        if username:
            if username not in scores:
                scores[username] = {}
            scores[username][r.subject] = r.score

    return {"scores": scores}

@router.post("/upload-results")
def upload_results(
    body: UploadResultsRequest,
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    admin_id = UUID(admin["user_id"])
    role     = admin["role"]

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
    return {"message": f"Results for {body.week} ({body.class_name}) saved.", "count": rows_saved}

@router.get("/weeks")
def get_weeks(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    rows = session.exec(select(Result.week).distinct()).all()
    return {"weeks": sorted(set(rows))}