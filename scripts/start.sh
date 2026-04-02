#!/bin/sh
# Render startup script
# Runs migrations and seeds the database on every deploy.
# Since Render's free tier uses an ephemeral filesystem, SQLite data
# is recreated on each deploy — this ensures the app always starts
# with a working database and sample data.

set -e

echo "🔄 Running database migrations..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npx prisma db seed

echo "🚀 Starting server..."
node dist/server.js
