#!/usr/bin/env bash
# EduGraph AI — one-command dev startup
# Usage: ./start.sh [--reset]
#   --reset  truncate and re-seed the curriculum tables

set -e
cd "$(dirname "$0")"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
ok()   { echo -e "${GREEN}✓${NC} $1"; }
info() { echo -e "${CYAN}→${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
die()  { echo -e "${RED}✗ $1${NC}"; exit 1; }

RESET=false
[[ "$1" == "--reset" ]] && RESET=true

echo ""
echo -e "${CYAN}╔══════════════════════════════════╗${NC}"
echo -e "${CYAN}║     EduGraph AI — Starting up    ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════╝${NC}"
echo ""

# ── 1. Python venv ───────────────────────────────────────────────────────────
info "Checking Python environment…"
if [[ ! -f venv/bin/python ]]; then
  info "Creating venv…"
  python3 -m venv venv
fi
PYTHON=venv/bin/python
PIP=venv/bin/pip

# Install / update deps quietly
$PIP install -q -r requirements.txt 2>&1 | tail -3
ok "Python venv ready"

# ── 2. Load .env ─────────────────────────────────────────────────────────────
if [[ -f .env ]]; then
  set -a; source .env; set +a
  ok "Environment loaded from .env"
else
  die ".env file not found — copy .env.example and fill in values"
fi

# ── 3. PostgreSQL ─────────────────────────────────────────────────────────────
info "Checking PostgreSQL…"
if ! pg_isready -q 2>/dev/null; then
  warn "PostgreSQL not responding. Trying to start…"
  sudo service postgresql start 2>/dev/null || true
  sleep 2
  pg_isready -q 2>/dev/null || die "PostgreSQL is not running. Start it manually: sudo service postgresql start"
fi
ok "PostgreSQL is running"

# Extract connection details from DATABASE_URL
# Format: postgresql+asyncpg://user:pass@host:port/db
DB_USER=$(echo "$DATABASE_URL" | sed -E 's|.*://([^:]+):.*|\1|')
DB_PASS=$(echo "$DATABASE_URL" | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|')
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*@([^:]+):.*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_NAME=$(echo "$DATABASE_URL" | sed -E 's|.*/([^?]+).*|\1|')

# Create user + db if missing
PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -c "SELECT 1" > /dev/null 2>&1 || {
  warn "Database '$DB_NAME' or user '$DB_USER' missing. Creating…"
  sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';" 2>/dev/null || true
  sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || true
  ok "Database created"
}
ok "Database '$DB_NAME' accessible"

# ── 4. Alembic migrations ─────────────────────────────────────────────────────
info "Running Alembic migrations…"
venv/bin/alembic upgrade head 2>&1 | tail -3
ok "Schema is up to date"

# ── 5. Seed curriculum ────────────────────────────────────────────────────────
SUBJECT_COUNT=$(PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -h "$DB_HOST" -p "$DB_PORT" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM subjects;" 2>/dev/null | tr -d ' ')
if [[ "$SUBJECT_COUNT" -eq 0 ]] || [[ "$RESET" == true ]]; then
  info "Seeding curriculum data…"
  $PYTHON -m scripts.seed_curriculum 2>&1 | tail -5
  ok "Curriculum seeded"
else
  ok "Curriculum already seeded ($SUBJECT_COUNT subjects)"
fi

# ── 6. Neo4j (optional) ───────────────────────────────────────────────────────
if nc -z localhost 7687 2>/dev/null; then
  ok "Neo4j is running (bolt://localhost:7687)"
else
  warn "Neo4j not running — gap prerequisite traversal disabled (app still works)"
fi

# ── 7. Ollama (optional) ──────────────────────────────────────────────────────
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
  ok "Ollama is running"
else
  warn "Ollama not running — AI tutor and exam verification disabled"
  warn "  Start it: ollama serve  (then: ollama pull qwen2.5:7b)"
fi

# ── 8. Kill any existing server on port 8000 ─────────────────────────────────
if lsof -Pi :8000 -sTCP:LISTEN -t > /dev/null 2>/dev/null; then
  warn "Port 8000 in use — killing existing process…"
  kill -9 $(lsof -Pi :8000 -sTCP:LISTEN -t) 2>/dev/null || true
  sleep 1
fi

# ── 9. Start uvicorn ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Backend:   http://localhost:8000${NC}"
echo -e "${GREEN}  API docs:  http://localhost:8000/docs${NC}"
echo -e "${GREEN}  Frontend:  http://localhost:3000  (run separately)${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

exec venv/bin/uvicorn app.main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --reload \
  --log-level info
