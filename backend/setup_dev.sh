#!/usr/bin/env bash
# Bootstrap EduGraph backend for local development.
# Run from the backend/ directory: bash setup_dev.sh

set -e

echo "==> Creating PostgreSQL database and user..."
sudo -u postgres psql -c "CREATE USER edugraph WITH PASSWORD 'edugraph';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE edugraph OWNER edugraph;" 2>/dev/null || true

echo "==> Running Alembic migrations..."
source venv/bin/activate
alembic upgrade head

echo "==> Seeding curriculum data..."
python -m scripts.seed_curriculum

echo ""
echo "Done! Start the API with:"
echo "  source venv/bin/activate && uvicorn app.main:app --reload"
