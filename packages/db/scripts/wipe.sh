#!/bin/bash
# Wipe and recreate database schema (staging only!)
set -e

DB_URL="${DATABASE_URL:-postgres://tuxuser:ChangeThisToAStrongPassword123!@localhost:5432/iso_archive}"

echo "⚠️  This will DROP ALL TABLES and recreate the schema!"
echo "Database: $DB_URL"
read -p "Continue? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 1
fi

echo "Dropping all tables..."
psql "$DB_URL" << 'EOF'
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO public;
EOF

echo "Pushing fresh schema..."
cd "$(dirname "$0")"
DATABASE_URL="$DB_URL" pnpm drizzle-kit push

echo "✅ Database wiped and schema recreated!"
