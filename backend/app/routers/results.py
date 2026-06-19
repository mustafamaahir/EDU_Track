from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from app.database import get_session
from app.models import Result, User
from app.middleware.auth_guard import get_current_user
from uuid import UUID

router = APIRouter()

def compute_grade(avg: float) -> str:
    if avg >= 90: return "A"
    if avg >= 80: return "B"
    if avg >= 70: return "C"
    if avg >= 60: return "D"
    return "F"

@router.get("/me")
def get_my_results(
    week: str = Query(None),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = select(Result).where(Result.student_id == UUID(current_user["user_id"]))
    if week:
        query = query.where(Result.week == week)

    rows = session.exec(query.order_by(Result.week)).all()

    # Group by week
    weeks_map: dict = {}
    for row in rows:
        w = row.week
        if w not in weeks_map:
            weeks_map[w] = {"week": w, "subjects": []}
        pct = round((row.score / row.max_score) * 100, 1)
        weeks_map[w]["subjects"].append({
            "subject":    row.subject,
            "score":      row.score,
            "max_score":  row.max_score,
            "percentage": pct,
            "grade":      compute_grade(pct),
        })

    result_list = []
    for w, data in weeks_map.items():
        avg = round(sum(s["percentage"] for s in data["subjects"]) / len(data["subjects"]), 1)
        result_list.append({
            **data,
            "student_name":  current_user["name"],
            "class_name":    current_user["class_name"],
            "average":       avg,
            "overall_grade": compute_grade(avg),
        })

    return {"results": result_list}

@router.get("/weeks")
def get_weeks(session: Session = Depends(get_session)):
    rows = session.exec(select(Result.week).distinct()).all()
    return {"weeks": sorted(set(rows))}
