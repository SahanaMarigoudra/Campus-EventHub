#!/bin/bash
# Render.com build script for Campus EventHub backend
# Ensures instance/ folder exists and database is seeded before starting

set -e  # Exit immediately if any command fails

echo "=== Campus EventHub — Render Build Script ==="

# 1. Create the instance directory (SQLite databases live here)
echo "[1/3] Creating instance directory..."
mkdir -p instance

# 2. Install Python dependencies
echo "[2/3] Installing dependencies..."
pip install -r requirements.txt

# 3. Seed the database (creates tables + sample data if not already seeded)
echo "[3/3] Seeding database..."
python -c "
import os, sys
os.environ.setdefault('FLASK_ENV', 'production')
sys.path.insert(0, '.')
from app import create_app, db
app = create_app()
with app.app_context():
    db.create_all()
    print('Tables created successfully.')

# Now run the full seed
from seed import seed
seed()
print('Seed completed.')
"

echo "=== Build complete! ==="
