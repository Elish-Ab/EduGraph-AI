"""
AI exam verification and Graph-RAG tutor using Ollama (local LLM).

Verification flow:
  1. Embed all CLO descriptions into ChromaDB (once at startup or on demand)
  2. For each question, find the nearest CLO via vector search
  3. Ask Ollama to confirm the match and score alignment
  4. Return structured result: per-question CLO, alignment %, coverage %

Graph-RAG tutor flow:
  1. Student sends a question
  2. Find relevant CLOs via ChromaDB
  3. Traverse Neo4j for prerequisite chain
  4. Build context: CLO description + prereqs + student gap info
  5. Stream Ollama response
"""

import json
from pathlib import Path
from typing import AsyncGenerator

import httpx

from app.core.config import settings

OLLAMA_URL = settings.OLLAMA_BASE_URL
MODEL = settings.OLLAMA_MODEL


# ── ChromaDB helpers ──────────────────────────────────────────────────────

def _get_chroma_collection():
    import chromadb
    client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
    return client.get_or_create_collection("clos")


async def embed_clos(clos: list[dict]) -> None:
    """
    Index CLOs into ChromaDB.
    clos: list of {"id": str, "code": str, "description": str}
    """
    collection = _get_chroma_collection()
    if collection.count() >= len(clos):
        return  # already indexed

    collection.upsert(
        ids=[c["id"] for c in clos],
        documents=[c["description"] for c in clos],
        metadatas=[{"code": c["code"]} for c in clos],
    )


def find_nearest_clos(query: str, n: int = 3) -> list[dict]:
    """Return top-n CLOs most similar to the query text."""
    collection = _get_chroma_collection()
    if collection.count() == 0:
        return []
    results = collection.query(query_texts=[query], n_results=min(n, collection.count()))
    hits = []
    for i, doc_id in enumerate(results["ids"][0]):
        hits.append({
            "id": doc_id,
            "code": results["metadatas"][0][i]["code"],
            "description": results["documents"][0][i],
            "distance": results["distances"][0][i],
        })
    return hits


# ── Ollama helpers ────────────────────────────────────────────────────────

SYSTEM = "You are a helpful AI tutor. Always respond in English only. Never use any other language."


async def _ollama_generate(prompt: str, stream: bool = False) -> str | AsyncGenerator:
    async with httpx.AsyncClient(timeout=120) as client:
        if not stream:
            resp = await client.post(
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": False,
                },
            )
            resp.raise_for_status()
            return resp.json()["message"]["content"]

        async def _stream() -> AsyncGenerator[str, None]:
            async with client.stream(
                "POST",
                f"{OLLAMA_URL}/api/chat",
                json={
                    "model": MODEL,
                    "messages": [
                        {"role": "system", "content": SYSTEM},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": True,
                },
            ) as r:
                async for line in r.aiter_lines():
                    if line:
                        chunk = json.loads(line)
                        if token := chunk.get("message", {}).get("content"):
                            yield token
                        if chunk.get("done"):
                            break

        return _stream()


# ── Exam verification ─────────────────────────────────────────────────────

async def verify_exam_questions(
    questions: list[dict],  # [{"id": str, "text": str, "options": list}]
    clos: list[dict],       # [{"id": str, "code": str, "description": str}]
) -> dict:
    """
    Use Ollama to map each question to a CLO and score alignment.
    Returns: {
        "question_mappings": [{"question_id": str, "clo_id": str, "clo_code": str, "confidence": float}],
        "alignment_score": float,   # 0-100
        "clo_coverage": float,      # % of CLOs covered
        "ai_notes": str,
    }
    """
    await embed_clos(clos)

    mappings = []
    mapped_clo_ids: set[str] = set()

    for q in questions:
        nearest = find_nearest_clos(q["text"], n=3)
        if not nearest:
            continue

        # Let Ollama confirm the best match
        clo_options = "\n".join(
            f"{i+1}. [{c['code']}] {c['description']}" for i, c in enumerate(nearest)
        )
        options_text = ""
        if q.get("options"):
            options_text = "\nOptions: " + " / ".join(q["options"])

        prompt = f"""You are an Ethiopian curriculum alignment expert.

Question: {q['text']}{options_text}

Candidate Course Learning Outcomes (CLOs):
{clo_options}

Which CLO does this question best assess? Reply ONLY with a JSON object:
{{"best_match": 1, "confidence": 0.9, "reason": "brief reason"}}

Where best_match is the number (1-{len(nearest)}) of the best CLO."""

        try:
            raw = await _ollama_generate(prompt)
            # Extract JSON from response
            start = raw.find("{")
            end = raw.rfind("}") + 1
            parsed = json.loads(raw[start:end])
            idx = int(parsed.get("best_match", 1)) - 1
            idx = max(0, min(idx, len(nearest) - 1))
            best = nearest[idx]
            confidence = float(parsed.get("confidence", 0.7))
        except Exception:
            best = nearest[0]
            confidence = 0.5

        mappings.append({
            "question_id": q["id"],
            "clo_id": best["id"],
            "clo_code": best["code"],
            "confidence": confidence,
        })
        mapped_clo_ids.add(best["id"])

    total = len(questions)
    mapped = len(mappings)
    alignment_score = round(sum(m["confidence"] for m in mappings) / max(mapped, 1) * 100, 1)
    clo_coverage = round(len(mapped_clo_ids) / max(len(clos), 1) * 100, 1)

    # Overall narrative from Ollama
    summary_prompt = f"""You are reviewing an Ethiopian Grade {questions[0].get('grade', 11)} exam.

The exam has {total} questions. {mapped} were mapped to curriculum CLOs.
Alignment score: {alignment_score}%. CLO coverage: {clo_coverage}%.

Write a brief 2-sentence review of this exam's curriculum alignment for the teacher.
Be specific and constructive."""

    try:
        ai_notes = await _ollama_generate(summary_prompt)
    except Exception:
        ai_notes = f"Exam mapped {mapped}/{total} questions to CLOs. Alignment: {alignment_score}%."

    return {
        "question_mappings": mappings,
        "alignment_score": alignment_score,
        "clo_coverage": clo_coverage,
        "ai_notes": ai_notes.strip(),
    }


# ── Graph-RAG tutor ───────────────────────────────────────────────────────

async def get_prerequisite_chain(clo_id: str, depth: int = 3) -> list[dict]:
    """Traverse Neo4j to find prerequisite CLOs (what student must know first)."""
    from app.graph_db import get_driver
    driver = await get_driver()
    async with driver.session() as session:
        result = await session.run(
            """
            MATCH path = (start:CLO {id: $id})-[:REQUIRES*1..$depth]->(prereq:CLO)
            RETURN prereq.id AS id, prereq.code AS code, length(path) AS depth
            ORDER BY depth
            """,
            id=clo_id, depth=depth,
        )
        records = await result.data()
    return records


async def build_rag_context(
    question: str,
    student_grade: int,
    career_interest: str,
    gap_clo_ids: list[str],
) -> str:
    """Build context string for the tutor from CLO graph + student gaps."""
    nearest = find_nearest_clos(question, n=3)
    context_parts = []

    for clo in nearest:
        context_parts.append(f"Relevant topic: {clo['description']} [{clo['code']}]")
        prereqs = await get_prerequisite_chain(clo["id"], depth=2)
        if prereqs:
            prereq_text = ", ".join(p["code"] for p in prereqs[:3])
            context_parts.append(f"  Prerequisites: {prereq_text}")

    if gap_clo_ids:
        context_parts.append(f"Student has known gaps in {len(gap_clo_ids)} CLO(s)")

    context_parts.append(f"Student is Grade {student_grade}, interested in {career_interest}")
    return "\n".join(context_parts)


async def stream_tutor_response(
    question: str,
    student_grade: int,
    career_interest: str,
    gap_clo_ids: list[str],
) -> AsyncGenerator[str, None]:
    """Stream a Graph-RAG tutoring response."""
    context = await build_rag_context(question, student_grade, career_interest, gap_clo_ids)

    prompt = f"""You are EduGraph AI, an offline tutor for Ethiopian high school students.

Student context:
{context}

Student question: {question}

Instructions:
- Answer clearly for a Grade {student_grade} student
- Connect to their {career_interest} career interest where relevant
- Use step-by-step explanations for calculations
- Keep response under 300 words
- If the student has prerequisite gaps, mention what they should review first"""

    generator = await _ollama_generate(prompt, stream=True)
    async for token in generator:
        yield token
