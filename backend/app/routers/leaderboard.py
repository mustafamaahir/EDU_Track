from fastapi import APIRouter, Depends, Query, HTTPException
from sqlmodel import Session, select
from app.database import get_session
from app.models import Result, User, WeekSettings
from app.middleware.auth_guard import get_current_user

router = APIRouter()

def compute_grade(avg: float) -> str:
    if avg >= 90: return "A"
    if avg >= 80: return "B"
    if avg >= 70: return "C"
    if avg >= 60: return "D"
    return "F"

def get_top3_for_class(week: str, class_name: str, session: Session, tiebreaker: str = ""):
    students = session.exec(
        select(User).where(
            User.class_name == class_name,
            User.role == "student",
            User.status == "approved"
        )
    ).all()

    if not students:
        return []

    student_map = {s.id: s for s in students}
    results = session.exec(
        select(Result).where(
            Result.week == week,
            Result.student_id.in_(list(student_map.keys()))
        )
    ).all()

    if not results:
        return []

    # Build scores map: { student_id: { subject: pct } }
    scores_map: dict = {}
    for row in results:
        sid = row.student_id
        pct = (row.score / row.max_score) * 100
        if sid not in scores_map:
            scores_map[sid] = {}
        scores_map[sid][row.subject] = pct

    ranked = []
    for sid, subj_scores in scores_map.items():
        values = list(subj_scores.values())
        avg = round(sum(values) / len(values), 1)
        tiebreaker_score = subj_scores.get(tiebreaker, 0) if tiebreaker else 0
        ranked.append({
            "student_name":      student_map[sid].name,
            "class_name":        class_name,
            "average":           avg,
            "tiebreaker_score":  tiebreaker_score,
            "grade":             compute_grade(avg),
        })

    # Sort: primary = average DESC, secondary = tiebreaker_score DESC
    ranked.sort(key=lambda x: (x["average"], x["tiebreaker_score"]), reverse=True)

    return [{"rank": i + 1, **r} for i, r in enumerate(ranked[:3])]


@router.get("/student/{week}")
def get_student_leaderboard(
    week: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    # Check lock
    settings = session.exec(select(WeekSettings).where(WeekSettings.week == week)).first()
    if settings and settings.results_locked:
        raise HTTPException(status_code=403, detail="LOCKED")

    tiebreaker = settings.tiebreaker if settings else ""
    class_name = current_user["class_name"]
    top3 = get_top3_for_class(week, class_name, session, tiebreaker)
    return {"week": week, "class_name": class_name, "top3": top3, "tiebreaker": tiebreaker}


@router.get("/admin/{week}")
def get_admin_leaderboard(
    week: str,
    class_name: str = Query(...),
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user["role"] not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    settings   = session.exec(select(WeekSettings).where(WeekSettings.week == week)).first()
    tiebreaker = settings.tiebreaker if settings else ""
    top3 = get_top3_for_class(week, class_name, session, tiebreaker)
    return {"week": week, "class_name": class_name, "top3": top3, "tiebreaker": tiebreaker}


@router.get("/admin/classes/{week}")
def get_all_classes_leaderboard(
    week: str,
    current_user: dict = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if current_user["role"] not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin access required")

    settings   = session.exec(select(WeekSettings).where(WeekSettings.week == week)).first()
    tiebreaker = settings.tiebreaker if settings else ""

    classes = session.exec(
        select(User.class_name).where(User.role == "student", User.status == "approved").distinct()
    ).all()

    result = []
    for cls in sorted(set(classes)):
        if cls:
            top3 = get_top3_for_class(week, cls, session, tiebreaker)
            result.append({"class_name": cls, "top3": top3})

    return {"week": week, "classes": result, "tiebreaker": tiebreaker}
