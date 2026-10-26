# ═══════════════════════════════════════════════════════════
#  Nathra — Dockerfile للنشر على Hostinger VPS
#  يستخدم SQLite (تخزين دائم عبر volume)
# ═══════════════════════════════════════════════════════════

# Stage 1: تثبيت الاعتماديات والبناء
FROM oven/bun:1.1 AS builder
WORKDIR /app

# نسخ ملفات الاعتماديات
COPY package.json bun.lock* ./
COPY prisma ./prisma/

# تثبيت الاعتماديات
RUN bun install --frozen-lockfile

# نسخ باقي الكود
COPY . .

# ضبط مزود قاعدة البيانات (SQLite افتراضياً)
ENV DB_PROVIDER=sqlite
RUN bun run scripts/setup-db.ts && bunx prisma generate

# البناء
RUN bun run build

# Stage 2: الإنتاج (صورة مصغّرة)
FROM oven/bun:1.1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PROVIDER=sqlite
ENV DATABASE_URL=file:/app/data/nathra.db

# تثبيت sqlite3 للأدوات (اختياري)
RUN apt-get update && apt-get install -y --no-install-recommends sqlite3 && rm -rf /var/lib/apt/lists/*

# نسخ الملفات المنشأة
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts

# إنشاء مجلد البيانات الدائم
RUN mkdir -p /app/data

# تهيئة قاعدة البيانات عند أول تشغيل
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 3000

# Volume للتخزين الدائم
VOLUME ["/app/data"]

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["bun", ".next/standalone/server.js"]
