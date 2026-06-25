"""
Parse exam files (PDF or DOCX) into structured question objects.

Expected format (flexible):
    1. What is Newton's second law?
    A. F = ma
    B. F = mv
    C. E = mc²
    D. v = u + at
    Answer: A

    2. Describe the photoelectric effect. (essay)

The parser handles:
- Numbered questions (1. / 1) / Q1.)
- MCQ options A. B. C. D. (or a) b) c) d))
- Optional "Answer: X" line
- Questions without options → classified as essay
"""

import re
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class ParsedQuestion:
    order: int
    text: str
    question_type: str = "mcq"
    option_a: str | None = None
    option_b: str | None = None
    option_c: str | None = None
    option_d: str | None = None
    correct_option: str | None = None
    marks: int = 2


# ── regex patterns ──────────────────────────────────────────────────────────
_Q_START = re.compile(r"^(?:Q\.?\s*)?(\d+)[.)]\s+(.+)", re.IGNORECASE)
_OPTION   = re.compile(r"^([A-Da-d])[.)]\s+(.+)", re.IGNORECASE)
_ANSWER   = re.compile(r"^(?:ans(?:wer)?|key)\s*[:\-]?\s*([A-Da-d])", re.IGNORECASE)
_MARKS    = re.compile(r"\((\d+)\s*marks?\)", re.IGNORECASE)


def _extract_text_from_pdf(path: Path) -> str:
    import fitz  # PyMuPDF
    doc = fitz.open(str(path))
    pages = [page.get_text() for page in doc]
    doc.close()
    return "\n".join(pages)


def _extract_text_from_docx(path: Path) -> str:
    from docx import Document
    doc = Document(str(path))
    return "\n".join(p.text for p in doc.paragraphs if p.text.strip())


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return _extract_text_from_pdf(path)
    if suffix in (".docx", ".doc"):
        return _extract_text_from_docx(path)
    raise ValueError(f"Unsupported file type: {suffix}")


def parse_questions(text: str) -> list[ParsedQuestion]:
    """Parse raw exam text into structured questions."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    questions: list[ParsedQuestion] = []
    current: ParsedQuestion | None = None

    for line in lines:
        q_match = _Q_START.match(line)
        if q_match:
            if current:
                _finalize(current)
                questions.append(current)
            num = int(q_match.group(1))
            q_text = q_match.group(2)
            marks = _extract_marks(q_text)
            current = ParsedQuestion(order=num, text=_strip_marks(q_text), marks=marks)
            continue

        opt_match = _OPTION.match(line)
        if opt_match and current:
            letter = opt_match.group(1).upper()
            value = opt_match.group(2).strip()
            setattr(current, f"option_{letter.lower()}", value)
            continue

        ans_match = _ANSWER.match(line)
        if ans_match and current:
            current.correct_option = ans_match.group(1).upper()
            continue

        # continuation of question text
        if current and not opt_match:
            current.text += " " + line

    if current:
        _finalize(current)
        questions.append(current)

    return questions


def _finalize(q: ParsedQuestion) -> None:
    has_options = any([q.option_a, q.option_b, q.option_c, q.option_d])
    q.question_type = "mcq" if has_options else "essay"
    if q.question_type == "essay":
        q.marks = max(q.marks, 5)


def _extract_marks(text: str) -> int:
    m = _MARKS.search(text)
    return int(m.group(1)) if m else 2


def _strip_marks(text: str) -> str:
    return _MARKS.sub("", text).strip()


def parse_exam_file(path: Path) -> list[ParsedQuestion]:
    text = extract_text(path)
    return parse_questions(text)
