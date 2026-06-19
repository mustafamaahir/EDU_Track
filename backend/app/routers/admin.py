from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from uuid import UUID
from app.database import get_session
from app.models import User, Result, UploadResultsRequest
from app.middleware.auth_guard import require_admin

router = APIRouter()

# ── Pending approvals ─────────────────────────────────────────────

@router.get("/pending")
def get_pending_students(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Returns all students awaiting approval."""
    students = session.exec(
        select(User).where(User.role == "student", User.status == "pending")
        .order_by(User.name)
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
    """Approve a pending student account."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.status == "approved":
        raise HTTPException(status_code=400, detail="User is already approved")

    user.status = "approved"
    session.add(user)
    session.commit()
    return {"message": f"{user.name} has been approved and can now log in."}

@router.delete("/reject/{user_id}")
def reject_student(
    user_id: UUID,
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    """Reject and delete a pending student account."""
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    session.delete(user)
    session.commit()
    return {"message": f"{user.name}'s account has been rejected and removed."}


# ── Upload results ────────────────────────────────────────────────

@router.post("/upload-results")
def upload_results(
    body: UploadResultsRequest,
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
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
            raise HTTPException(status_code=404, detail=f"Approved student '{entry.username}' not found in {body.class_name}")

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
    return {"message": f"Results for {body.week} ({body.class_name}) uploaded successfully", "count": rows_saved}


# ── Student management ────────────────────────────────────────────

@router.get("/students")
def get_all_students(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    students = session.exec(
        select(User).where(User.role == "student").order_by(User.class_name)
    ).all()
    return {
        "students": [
            {"id": str(s.id), "username": s.username, "name": s.name, "class_name": s.class_name, "status": s.status}
            for s in students
        ]
    }

@router.get("/weeks")
def get_weeks(
    admin: dict = Depends(require_admin),
    session: Session = Depends(get_session),
):
    rows = session.exec(select(Result.week).distinct()).all()
    return {"weeks": sorted(set(rows))}
