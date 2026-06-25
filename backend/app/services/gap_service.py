"""
Learning gap analysis.

Algorithm:
1. Find all questions a student answered incorrectly across submitted exams
2. Group by CLO (via question.clo_id)
3. For each failed CLO, traverse Neo4j [:REQUIRES] edges to find prerequisite gaps
4. Score severity: critical (>2 gaps in CLO chain), needs_support (1-2), on_track (0)
5. Tag career-critical CLOs based on student's career_interest
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.graph_db import get_driver
from app.models.curriculum import CLO
from app.models.exam import Answer, ExamSession, Question

CAREER_CLO_MAP: dict[str, list[str]] = {
    "electrical_engineering": ["PHYS.11.U2.T2.CLO1", "PHYS.11.U2.T2.CLO2", "PHYS.11.U2.T2.CLO3",
                                "MATH.11.U1.T2.CLO2"],
    "software_engineering":   ["MATH.11.U1.T1.CLO2", "MATH.11.U1.T2.CLO2", "MATH.11.U2.T1.CLO2"],
    "medicine":               ["CHEM.11.U2.T1.CLO1", "CHEM.11.U2.T1.CLO2", "CHEM.11.U1.T1.CLO2"],
    "civil_engineering":      ["PHYS.11.U1.T2.CLO2", "PHYS.11.U1.T3.CLO2", "MATH.11.U2.T1.CLO2"],
    "accounting":             ["MATH.11.U1.T1.CLO1", "MATH.11.U1.T1.CLO2"],
    "architecture":           ["MATH.11.U2.T1.CLO2", "PHYS.11.U1.T3.CLO2"],
}


async def _get_prerequisite_roots(failed_clo_id: str) -> list[dict]:
    """Walk [:REQUIRES] edges to find the root cause CLOs."""
    try:
        driver = await get_driver()
        async with driver.session() as session:
            result = await session.run(
                """
                MATCH path = (start:CLO {id: $id})-[:REQUIRES*1..5]->(root:CLO)
                WHERE NOT (root)-[:REQUIRES]->()
                RETURN DISTINCT root.id AS id, root.code AS code, length(path) AS depth
                ORDER BY depth
                LIMIT 5
                """,
                id=failed_clo_id,
            )
            return await result.data()
    except Exception:
        return []


async def analyze_gaps(student_id: str, career_interest: str | None, db: AsyncSession) -> list[dict]:
    """
    Analyze a student's learning gaps from their exam history.
    Returns a list of gap objects sorted by severity.
    """
    # Load all submitted sessions with answers
    sessions_result = await db.execute(
        select(ExamSession)
        .where(ExamSession.student_id == student_id, ExamSession.status.in_(["submitted", "graded"]))
        .options(selectinload(ExamSession.answers).selectinload(Answer.question))
    )
    sessions = sessions_result.scalars().all()

    # Collect failed CLO IDs with failure counts
    clo_fail_count: dict[str, int] = {}
    clo_total: dict[str, int] = {}

    for session in sessions:
        for answer in session.answers:
            q = answer.question
            if q.clo_id is None:
                continue
            clo_total[q.clo_id] = clo_total.get(q.clo_id, 0) + 1
            if answer.is_correct is False:
                clo_fail_count[q.clo_id] = clo_fail_count.get(q.clo_id, 0) + 1

    if not clo_fail_count:
        return []

    # Load CLO details
    clo_ids = list(clo_fail_count.keys())
    clo_result = await db.execute(
        select(CLO).where(CLO.id.in_(clo_ids)).options(
            selectinload(CLO.topic)
        )
    )
    clos = {c.id: c for c in clo_result.scalars()}

    career_codes = set(CAREER_CLO_MAP.get(career_interest or "", []))
    gaps = []

    for clo_id, fail_count in clo_fail_count.items():
        clo = clos.get(clo_id)
        if clo is None:
            continue

        total = clo_total.get(clo_id, 1)
        fail_rate = fail_count / total

        # Find prerequisite root causes
        prereqs = await _get_prerequisite_roots(clo_id)

        # Severity based on fail rate and prereq chain depth
        if fail_rate >= 0.7 or len(prereqs) >= 2:
            severity = "critical"
        elif fail_rate >= 0.4:
            severity = "needs_support"
        else:
            severity = "on_track"

        is_career_critical = clo.code in career_codes

        gaps.append({
            "clo_id": clo_id,
            "clo_code": clo.code,
            "description": clo.description,
            "topic": clo.topic.title if clo.topic else None,
            "bloom_level": clo.bloom_level,
            "fail_rate": round(fail_rate * 100, 1),
            "fail_count": fail_count,
            "total_attempts": total,
            "severity": severity,
            "is_career_critical": is_career_critical,
            "prerequisite_roots": prereqs,
        })

    # Sort: critical first, then career-critical, then by fail rate
    gaps.sort(key=lambda g: (
        0 if g["severity"] == "critical" else (1 if g["severity"] == "needs_support" else 2),
        0 if g["is_career_critical"] else 1,
        -g["fail_rate"],
    ))

    return gaps
