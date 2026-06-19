from fastapi import APIRouter, Depends
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

@router.get("/{week}")
def get_leaderboard(
    week: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    class_name = current_user["class_name"]

    # Get all students in the same class
    students = session.exec(
        select(User).where(User.class_name == class_name, User.role == "student")
    ).all()

    if not students:
        return {"week": week, "class_name": class_name, "top3": []}

    student_map = {s.id: s for s in students}
    student_ids = list(student_map.keys())

    # Get results for those students this week
    results = session.exec(
        select(Result).where(Result.week == week, Result.student_id.in_(student_ids))
    ).all()

    if not results:
        return {"week": week, "class_name": class_name, "top3": []}

    # Aggregate average per student
    scores_map: dict = {}
    for row in results:
        sid = row.student_id
        pct = (row.score / row.max_score) * 100
        scores_map.setdefault(sid, []).append(pct)

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
    top3 = [{"rank": i + 1, **r} for i, r in enumerate(ranked[:3])]

    return {"week": week, "class_name": class_name, "top3": top3}
