"""
Seed the PostgreSQL + Neo4j curriculum graph for EduGraph AI.

Run from the backend/ directory:
    python -m scripts.seed_curriculum
"""

import asyncio
import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.database import Base
from app.graph_db import close_driver, get_driver
from app.models.curriculum import CLO, Subject, Topic, Unit

CURRICULUM = [
    {
        "code": "PHYS",
        "name": "Physics",
        "grade": 11,
        "units": [
            {
                "code": "PHYS.11.U1",
                "title": "Mechanics",
                "topics": [
                    {
                        "title": "Kinematics",
                        "clos": [
                            ("PHYS.11.U1.T1.CLO1", "Define displacement, velocity, and acceleration", "remember"),
                            ("PHYS.11.U1.T1.CLO2", "Solve problems using kinematic equations", "apply"),
                            ("PHYS.11.U1.T1.CLO3", "Interpret position-time and velocity-time graphs", "understand"),
                        ],
                    },
                    {
                        "title": "Newton's Laws of Motion",
                        "clos": [
                            ("PHYS.11.U1.T2.CLO1", "State and explain Newton's three laws of motion", "remember"),
                            ("PHYS.11.U1.T2.CLO2", "Apply Newton's second law to solve force problems", "apply"),
                            ("PHYS.11.U1.T2.CLO3", "Analyze friction and normal force in systems", "analyze"),
                        ],
                    },
                    {
                        "title": "Work, Energy, and Power",
                        "clos": [
                            ("PHYS.11.U1.T3.CLO1", "Define work, kinetic energy, and potential energy", "remember"),
                            ("PHYS.11.U1.T3.CLO2", "Apply the work-energy theorem", "apply"),
                            ("PHYS.11.U1.T3.CLO3", "Calculate power in mechanical systems", "apply"),
                        ],
                    },
                ],
            },
            {
                "code": "PHYS.11.U2",
                "title": "Electricity and Magnetism",
                "topics": [
                    {
                        "title": "Electric Charge and Field",
                        "clos": [
                            ("PHYS.11.U2.T1.CLO1", "Explain Coulomb's law", "understand"),
                            ("PHYS.11.U2.T1.CLO2", "Calculate electric field intensity", "apply"),
                        ],
                    },
                    {
                        "title": "Electric Circuits",
                        "clos": [
                            ("PHYS.11.U2.T2.CLO1", "Apply Ohm's law to simple circuits", "apply"),
                            ("PHYS.11.U2.T2.CLO2", "Analyze series and parallel resistor combinations", "analyze"),
                            ("PHYS.11.U2.T2.CLO3", "Apply Kirchhoff's laws to circuit analysis", "apply"),
                        ],
                    },
                ],
            },
        ],
    },
    {
        "code": "MATH",
        "name": "Mathematics",
        "grade": 11,
        "units": [
            {
                "code": "MATH.11.U1",
                "title": "Algebra",
                "topics": [
                    {
                        "title": "Linear Equations and Inequalities",
                        "clos": [
                            ("MATH.11.U1.T1.CLO1", "Solve linear equations in one variable", "apply"),
                            ("MATH.11.U1.T1.CLO2", "Solve systems of linear equations by substitution and elimination", "apply"),
                            ("MATH.11.U1.T1.CLO3", "Graph linear inequalities in two variables", "apply"),
                        ],
                    },
                    {
                        "title": "Quadratic Equations",
                        "clos": [
                            ("MATH.11.U1.T2.CLO1", "Factor quadratic expressions", "apply"),
                            ("MATH.11.U1.T2.CLO2", "Solve quadratic equations using the quadratic formula", "apply"),
                            ("MATH.11.U1.T2.CLO3", "Interpret the discriminant of a quadratic equation", "analyze"),
                        ],
                    },
                ],
            },
            {
                "code": "MATH.11.U2",
                "title": "Trigonometry",
                "topics": [
                    {
                        "title": "Trigonometric Ratios",
                        "clos": [
                            ("MATH.11.U2.T1.CLO1", "Define sine, cosine, and tangent ratios", "remember"),
                            ("MATH.11.U2.T1.CLO2", "Solve right triangles using trigonometric ratios", "apply"),
                        ],
                    },
                    {
                        "title": "Trigonometric Identities",
                        "clos": [
                            ("MATH.11.U2.T2.CLO1", "Prove basic trigonometric identities", "apply"),
                            ("MATH.11.U2.T2.CLO2", "Use identities to simplify trigonometric expressions", "apply"),
                        ],
                    },
                ],
            },
        ],
    },
    {
        "code": "CHEM",
        "name": "Chemistry",
        "grade": 11,
        "units": [
            {
                "code": "CHEM.11.U1",
                "title": "Atomic Structure",
                "topics": [
                    {
                        "title": "Atomic Models",
                        "clos": [
                            ("CHEM.11.U1.T1.CLO1", "Describe the development of atomic models from Dalton to quantum", "understand"),
                            ("CHEM.11.U1.T1.CLO2", "Determine electron configuration using the Aufbau principle", "apply"),
                        ],
                    },
                ],
            },
            {
                "code": "CHEM.11.U2",
                "title": "Chemical Bonding",
                "topics": [
                    {
                        "title": "Ionic and Covalent Bonds",
                        "clos": [
                            ("CHEM.11.U2.T1.CLO1", "Distinguish between ionic and covalent bonding", "understand"),
                            ("CHEM.11.U2.T1.CLO2", "Draw Lewis structures for simple molecules", "apply"),
                            ("CHEM.11.U2.T1.CLO3", "Predict molecular geometry using VSEPR theory", "apply"),
                        ],
                    },
                ],
            },
        ],
    },
]

# Neo4j prerequisite edges: (from_clo_code, to_clo_code)
PREREQUISITES = [
    ("PHYS.11.U1.T1.CLO1", "PHYS.11.U1.T1.CLO2"),
    ("PHYS.11.U1.T1.CLO2", "PHYS.11.U1.T2.CLO2"),
    ("PHYS.11.U1.T2.CLO2", "PHYS.11.U1.T3.CLO2"),
    ("PHYS.11.U2.T1.CLO2", "PHYS.11.U2.T2.CLO1"),
    ("PHYS.11.U2.T2.CLO1", "PHYS.11.U2.T2.CLO2"),
    ("PHYS.11.U2.T2.CLO2", "PHYS.11.U2.T2.CLO3"),
    ("MATH.11.U1.T1.CLO1", "MATH.11.U1.T1.CLO2"),
    ("MATH.11.U1.T1.CLO2", "MATH.11.U1.T2.CLO1"),
    ("MATH.11.U1.T2.CLO1", "MATH.11.U1.T2.CLO2"),
    ("MATH.11.U2.T1.CLO1", "MATH.11.U2.T1.CLO2"),
    ("MATH.11.U2.T1.CLO2", "MATH.11.U2.T2.CLO1"),
    ("CHEM.11.U1.T1.CLO1", "CHEM.11.U1.T1.CLO2"),
    ("CHEM.11.U1.T1.CLO2", "CHEM.11.U2.T1.CLO1"),
]


async def seed_postgres() -> dict[str, str]:
    """Truncate curriculum tables and re-seed; return mapping clo_code → clo_id."""
    from sqlalchemy import text

    engine = create_async_engine(settings.DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Wipe existing curriculum data (CASCADE handles FK order)
        await conn.execute(text("TRUNCATE clos, topics, units, subjects RESTART IDENTITY CASCADE"))

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    clo_code_to_id: dict[str, str] = {}

    async with session_factory() as db:
        for s_data in CURRICULUM:
            subject = Subject(
                id=str(uuid.uuid4()),
                code=s_data["code"],
                name=s_data["name"],
                grade=s_data["grade"],
            )
            db.add(subject)
            await db.flush()

            for u_idx, u_data in enumerate(s_data["units"]):
                unit = Unit(
                    id=str(uuid.uuid4()),
                    subject_id=subject.id,
                    code=u_data["code"],
                    title=u_data["title"],
                    order=u_idx,
                )
                db.add(unit)
                await db.flush()

                for t_idx, t_data in enumerate(u_data["topics"]):
                    topic = Topic(
                        id=str(uuid.uuid4()),
                        unit_id=unit.id,
                        title=t_data["title"],
                        order=t_idx,
                    )
                    db.add(topic)
                    await db.flush()

                    for _, (code, desc, bloom) in enumerate(t_data["clos"]):
                        clo = CLO(
                            id=str(uuid.uuid4()),
                            topic_id=topic.id,
                            code=code,
                            description=desc,
                            bloom_level=bloom,
                        )
                        db.add(clo)
                        clo_code_to_id[code] = clo.id

        await db.commit()

    await engine.dispose()
    print(f"PostgreSQL: seeded {len(clo_code_to_id)} CLOs")
    return clo_code_to_id


async def seed_neo4j(clo_code_to_id: dict[str, str]) -> None:
    """Build the curriculum knowledge graph in Neo4j."""
    driver = await get_driver()
    async with driver.session() as session:
        await session.run("MATCH (n:CLO) DETACH DELETE n")

        for code, clo_id in clo_code_to_id.items():
            await session.run(
                "MERGE (c:CLO {id: $id, code: $code})",
                id=clo_id, code=code,
            )

        for from_code, to_code in PREREQUISITES:
            if from_code in clo_code_to_id and to_code in clo_code_to_id:
                await session.run(
                    """
                    MATCH (a:CLO {code: $from_code}), (b:CLO {code: $to_code})
                    MERGE (a)-[:REQUIRES]->(b)
                    """,
                    from_code=from_code, to_code=to_code,
                )

    await close_driver()
    print(f"Neo4j: created {len(PREREQUISITES)} REQUIRES edges")


async def main() -> None:
    clo_map = await seed_postgres()
    try:
        await seed_neo4j(clo_map)
    except Exception as exc:
        print(f"Neo4j skipped (not running?): {exc}")
        print("Run Neo4j and re-run this script to build the knowledge graph.")
    print("Curriculum seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
