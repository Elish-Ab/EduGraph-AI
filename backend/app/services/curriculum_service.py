from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.curriculum import CLO, Subject, Topic, Unit
from app.schemas.curriculum import SubjectSchema, SubjectSummary


async def list_subjects(grade: int | None, db: AsyncSession) -> list[SubjectSummary]:
    stmt = (
        select(
            Subject.id,
            Subject.code,
            Subject.name,
            Subject.grade,
            func.count(Unit.id.distinct()).label("unit_count"),
            func.count(CLO.id).label("clo_count"),
        )
        .outerjoin(Unit, Unit.subject_id == Subject.id)
        .outerjoin(Topic, Topic.unit_id == Unit.id)
        .outerjoin(CLO, CLO.topic_id == Topic.id)
        .group_by(Subject.id)
    )
    if grade is not None:
        stmt = stmt.where(Subject.grade == grade)

    rows = await db.execute(stmt)
    return [
        SubjectSummary(
            id=r.id, code=r.code, name=r.name, grade=r.grade,
            unit_count=r.unit_count, clo_count=r.clo_count,
        )
        for r in rows
    ]


async def get_subject(subject_id: str, db: AsyncSession) -> SubjectSchema | None:
    result = await db.execute(
        select(Subject)
        .where(Subject.id == subject_id)
        .options(
            selectinload(Subject.units)
            .selectinload(Unit.topics)
            .selectinload(Topic.clos)
        )
    )
    subject = result.scalar_one_or_none()
    if subject is None:
        return None
    return SubjectSchema.model_validate(subject)
