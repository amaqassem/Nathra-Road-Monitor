#!/bin/bash
# نقطة دخول الحاوية — تهيئة قاعدة البيانات ثم تشغيل الخادم
set -e

echo "🚀 Starting Nathra Platform..."

# التأكد من وجود مجلد البيانات
mkdir -p /app/data

# ضبط DATABASE_URL إذا لم تكن مضبوطة (SQLite افتراضي)
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:/app/data/nathra.db"
  echo "   Using default SQLite path: $DATABASE_URL"
fi

# توليد Prisma client
echo "   Generating Prisma client..."
bunx prisma generate

# دفع الـ schema لقاعدة البيانات
echo "   Pushing database schema..."
bunx prisma db push --accept-data-loss

# تهيئة البيانات إذا كانت قاعدة البيانات فارغة
echo "   Seeding database (if empty)..."
bun run scripts/seed.ts || echo "   ⚠️  Seed skipped (may already have data)"

echo "✓ Database ready"
echo "─────────────────────────────"

# تشغيل الخادم
exec "$@"
