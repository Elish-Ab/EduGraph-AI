"""
Generate a weekly study plan from a student's learning gaps.

Logic:
- Take the top N gaps (sorted by severity + career-criticality)
- Assign 2 tasks per gap: review session + practice session
- Distribute across Mon–Sat (6 days)
- Each task: 30-45 min
"""

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.study_plan import PlanTask, StudyPlan
from app.services.gap_service import analyze_gaps

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]


async def generate_plan(student_id: str, career_interest: str | None, db: AsyncSession) -> dict:
    # Delete existing plan
    existing = await db.execute(select(StudyPlan).where(StudyPlan.student_id == student_id))
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)
        await db.flush()

    gaps = await analyze_gaps(student_id, career_interest, db)

    plan = StudyPlan(id=str(uuid.uuid4()), student_id=student_id)
    db.add(plan)
    await db.flush()

    tasks: list[PlanTask] = []
    day_idx = 0

    for gap in gaps[:9]:  # max 9 gaps → 18 tasks → 3 tasks/day × 6 days
        clo_id = gap["clo_id"]
        topic = gap.get("topic") or gap["clo_code"]
        severity_emoji = {"critical": "🔴", "needs_support": "🟡", "on_track": "🟢"}.get(gap["severity"], "")

        # Task 1: Review
        tasks.append(PlanTask(
            id=str(uuid.uuid4()),
            plan_id=plan.id,
            clo_id=clo_id,
            day=DAYS[day_idx % 6],
            title=f"Review: {topic}",
            description=f"Study {gap['description']}. Fail rate: {gap['fail_rate']}%",
            duration_minutes=40,
            task_type="review",
            order=len(tasks),
        ))
        day_idx += 1

        # Task 2: Practice
        tasks.append(PlanTask(
            id=str(uuid.uuid4()),
            plan_id=plan.id,
            clo_id=clo_id,
            day=DAYS[day_idx % 6],
            title=f"Practice: {topic}",
            description=f"Solve practice problems on {gap['description']}",
            duration_minutes=30,
            task_type="practice",
            order=len(tasks),
        ))
        day_idx += 1

    for t in tasks:
        db.add(t)

    await db.commit()
    return await get_plan(student_id, db)


async def get_plan(student_id: str, db: AsyncSession) -> dict | None:
    result = await db.execute(
        select(StudyPlan)
        .where(StudyPlan.student_id == student_id)
        .options(selectinload(StudyPlan.tasks))
    )
    plan = result.scalar_one_or_none()
    if plan is None:
        return None

    plan.tasks.sort(key=lambda t: t.order)
    by_day: dict[str, list] = {day: [] for day in DAYS}
    for task in plan.tasks:
        if task.day in by_day:
            by_day[task.day].append({
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "duration_minutes": task.duration_minutes,
                "task_type": task.task_type,
                "is_completed": task.is_completed,
                "clo_id": task.clo_id,
            })

    return {
        "id": plan.id,
        "student_id": plan.student_id,
        "generated_at": plan.generated_at.isoformat(),
        "week": by_day,
        "total_tasks": len(plan.tasks),
        "completed_tasks": sum(1 for t in plan.tasks if t.is_completed),
    }


async def mark_task_complete(task_id: str, student_id: str, db: AsyncSession) -> dict:
    result = await db.execute(
        select(PlanTask)
        .join(StudyPlan)
        .where(PlanTask.id == task_id, StudyPlan.student_id == student_id)
    )
    task = result.scalar_one_or_none()
    if task is None:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_completed = not task.is_completed
    await db.commit()
    return {"id": task_id, "is_completed": task.is_completed}
