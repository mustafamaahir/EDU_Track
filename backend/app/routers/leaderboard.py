from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models import Result, User
from app.middleware.auth_guard import get_current_user

router = APIRouter()

def compute_grade(avg: float) -> str:
    if avg >= 90: return "A"
    if avg >= 80: return "B"
    if avg >= 70: return "C"
    if avg >= 60: return "D"
    return "F"

def get_top3_for_class(week: str, class_name: str, session: Session):
    students = session.exec(
        select(User).where(User.class_name == class_name, User.role == "student", User.status == "approved")
    ).all()

    if not students:
        return []

    student_map = {s.id: s for s in students}
    results = session.exec(
        select(Result).where(Result.week == week, Result.student_id.in_(list(student_map.keys())))
    ).all()

    if not results:
        return []

    scores_map: dict = {}
    for row in results:
        pct = (row.score / row.max_score) * 100
        scores_map.setdefault(row.student_id, []).append(pct)

    ranked = []
    for sid, scores in scores_map.items():
        avg = round(sum(scores) / len(scores), 1)
        ranked.append({
            "student_name": student_map[sid].name,
            "class_name":   class_name,
            "average":      avg,
            "grade":        compute_grade(avg),
        })

    ranked.sort(key=lambda x: x["average"], reverse=True)
    return [{"rank": i + 1, **r} for i, r in enumerate(ranked[:3])]


@router.get("/student/{week}")
def get_student_leaderboard(
    week: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Student view — only their own class."""
    class_name = current_user["class_name"]
    top3 = get_top3_for_class(week, class_name, session)
    return {"week": week, "class_name": class_name, "top3": top3}


@router.get("/admin/{week}")
def get_admin_leaderboard(
    week: str,
    class_name: str = Query(..., description="Class to filter by"),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Admin view — filter by any class."""
    if current_user["role"] not in ("admin", "superadmin"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")

    top3 = get_top3_for_class(week, class_name, session)
    return {"week": week, "class_name": class_name, "top3": top3}


@router.get("/admin/classes/{week}")
def get_all_classes_leaderboard(
    week: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Admin view — top 3 for ALL classes in one call."""
    if current_user["role"] not in ("admin", "superadmin"):
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin access required")

    classes = session.exec(
        select(User.class_name).where(User.role == "student", User.status == "approved").distinct()
    ).all()

    result = []
    for cls in sorted(set(classes)):
        if cls:
            top3 = get_top3_for_class(week, cls, session)
            result.append({"class_name": cls, "top3": top3})

    return {"week": week, "classes": result}
