# 🚀 دليل نشر منصة نظرة | Nathra Deployment Guide

دليل كامل لنشر المنصة على **Vercel** و **Hostinger**.

---

## 📋 المتطلبات الأساسية

- Node.js 18+ أو Bun 1.1+
- حساب GitHub (لرفع الكود)
- قاعدة بيانات (SQLite لـ Hostinger، PostgreSQL لـ Vercel)

---

## 🟢 النشر على Vercel (الأسهل — Serverless)

Vercel يدعم Next.js تلقائياً، لكن **SQLite لا يعمل** لأن filesystem مؤقت. لذلك نستخدم PostgreSQL.

### الخطوة 1: إعداد قاعدة بيانات PostgreSQL

اختر واحدة:
- **Vercel Postgres** (مدمج): Vercel Dashboard → Storage → Create Postgres
- **Neon** (مجاني): https://neon.tech — أنشئ قاعدة بيانات وانسخ الاتصال
- **Supabase** (مجاني): https://supabase.com — أنشئ project وانسخ Database URL

انسخ الـ connection string بصيغة:
```
postgresql://user:password@host:5432/nathra?schema=public&sslmode=require
```

### الخطوة 2: رفع الكود لـ GitHub

```bash
git init
git add .
git commit -m "Initial commit - Nathra platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/nathra.git
git push -u origin main
```

### الخطوة 3: النشر على Vercel

1. اذهب إلى https://vercel.com/new
2. اختر مستودع GitHub الخاص بك
3. **Framework Preset**: Next.js (يُكتشف تلقائياً)
4. **Build Command**: `bun run vercel-build` (موجود في vercel.json)
5. **Install Command**: `bun install`
6. اضغط **Environment Variables** وأضف:

| المتغير | القيمة |
|---|---|
| `DATABASE_URL` | `postgresql://...` (من الخطوة 1) |
| `DB_PROVIDER` | `postgresql` |
| `ADMIN_SEED_KEY` | سلسلة عشوائية آمنة (مثل `openssl rand -hex 32`) |
| `ALLOW_PUBLIC_SEED` | `false` |
| `NODE_ENV` | `production` |

7. اضغط **Deploy** وانتظر البناء (~2-3 دقائق)

### الخطوة 4: تهيئة قاعدة البيانات

بعد النشر، شغّل التهيئة عبر API (لأن Vercel serverless لا يدعم سكريبت مباشر):

```bash
# استبدل YOUR_DOMAIN و ADMIN_SEED_KEY
curl -X POST https://your-app.vercel.app/api/seed \
  -H "x-admin-key: YOUR_ADMIN_SEED_KEY"
```

أو افتح في المتصفح (مع header):
```bash
curl https://your-app.vercel.app/api/seed?x-admin-key=YOUR_ADMIN_SEED_KEY
```

### الخطوة 5: التحقق

- افتح `https://your-app.vercel.app` → يجب أن تظهر لوحة التحكم
- افتح `https://your-app.vercel.app/api/health` → يجب أن تظهر مقاييس النظام

---

## 🟠 النشر على Hostinger VPS

Hostinger VPS يوفر filesystem دائم، لذا **SQLite يعمل بشكل مثالي**.

### الخيار A: Docker (موصى به — الأسهل)

#### الخطوة 1: الاتصال بالخادم

```bash
ssh root@YOUR_VPS_IP
```

#### الخطوة 2: تثبيت Docker

```bash
curl -fsSL https://get.docker.com | sh
systemctl enable docker
```

#### الخطوة 3: نسخ المشروع

```bash
git clone https://github.com/YOUR_USERNAME/nathra.git
cd nathra
```

#### الخطوة 4: إعداد المتغيرات

```bash
cp .env.example .env
nano .env
```

اضبط:
```env
DB_PROVIDER=sqlite
DATABASE_URL=file:/app/data/nathra.db
ADMIN_SEED_KEY=generate-a-secure-random-string
ALLOW_PUBLIC_SEED=false
NODE_ENV=production
PORT=3000
```

#### الخطوة 5: البناء والتشغيل

```bash
# التهيئة التلقائية (يحتاج .env في نفس المجلد)
export $(cat .env | xargs)

# البناء والتشغيل
docker-compose up -d --build

# مراقبة السجلات
docker-compose logs -f
```

المنصة ستكون متاحة على `http://YOUR_VPS_IP:3000`

#### الخطوة 6: إعداد Nginx Reverse Proxy + SSL (اختياري)

```bash
apt install nginx certbot python3-certbot-nginx -y

# أنشئ /etc/nginx/sites-available/nathra
cat > /etc/nginx/sites-available/nathra << 'EOF'
server {
    server_name nathra.yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -s /etc/nginx/sites-available/nathra /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# شهادة SSL مجانية
certbot --nginx -d nathra.yourdomain.com
```

---

### الخيار B: النشر المباشر بـ Bun (بدون Docker)

#### الخطوة 1: تثبيت Bun

```bash
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc
```

#### الخطوة 2: نسخ وتثبيت

```bash
git clone https://github.com/YOUR_USERNAME/nathra.git
cd nathra
bun install
```

#### الخطوة 3: إعداد المتغيرات

```bash
cp .env.example .env
nano .env
# اضبط DATABASE_URL=file:/home/USER/data/nathra.db (مسار دائم!)
mkdir -p /home/USER/data
```

#### الخطوة 4: إعداد قاعدة البيانات + البناء

```bash
# إعداد مزود SQLite + توليد Prisma
bun run db:setup

# دفع الـ schema
bun run db:push

# التهيئة
bun run seed

# البناء
bun run build
```

#### الخطوة 5: التشغيل بـ PM2 (إدارة العملية)

```bash
npm install -g pm2

# تشغيل
PORT=3000 NODE_ENV=production pm2 start "bun .next/standalone/server.js" --name nathra

# حفظ للإقلاع التلقائي
pm2 save
pm2 startup
```

المنصة على `http://YOUR_VPS_IP:3000`

---

## 🔧 أوامر الصيانة

### إعادة تهيئة قاعدة البيانات
```bash
# Hostinger (داخل المجلد)
bun run seed:force
# أو عبر Docker:
docker-compose exec nathra bun run scripts/seed.ts --force

# Vercel
curl -X POST https://your-app.vercel.app/api/seed -H "x-admin-key: YOUR_KEY"
```

### تحديث المنصة
```bash
git pull
bun install
bun run db:push
bun run build
pm2 restart nathra
# أو Docker:
docker-compose up -d --build
```

### مراقبة السجلات
```bash
# PM2
pm2 logs nathra

# Docker
docker-compose logs -f nathra
```

---

## ⚠️ ملاحظات مهمة

### قاعدة البيانات
- **Vercel**: PostgreSQL إلزامي (SQLite لا يستمر)
- **Hostinger**: SQLite يعمل مع مسار دائم (`file:/absolute/path/db.db`)
- للترحيل من SQLite إلى PostgreSQL: صدّر البيانات + غيّر `DB_PROVIDER` + `bun run db:push` + أعد التهيئة

### الذكاء الاصطناعي (z-ai-web-dev-sdk)
- في بيئة Z.ai: يعمل تلقائياً
- للنشر الخارجي: قد تحتاج إعداد مفاتيح API — راجع توثيق SDK

### الأمان
- `/api/seed` محمي بـ `ADMIN_SEED_KEY` في الإنتاج
- لا تضع `ALLOW_PUBLIC_SEED=true` في الإنتاج
- استخدم HTTPS دائماً (Vercel تلقائي، Hostinger عبر Let's Encrypt)

### حدود المنصة الحالية
- بث الكاميرات: Demo Mode (يتطلب MediaMTX/FFmpeg للبث الفعلي)
- الإشعارات: in-app فقط (Email/SMS/Push يتطلب تكامل خارجي)
- التكامل الحكومي: Sandbox mode (لا إرسال فعلي)

---

## 🆘 استكشاف الأخطاء

### البناء يفشل على Vercel
- تأكد أن `DB_PROVIDER=postgresql` و `DATABASE_URL` صحيح
- تحقق من سجلات البناء في Vercel Dashboard

### قاعدة البيانات فارغة بعد النشر
- شغّل التهيئة (الخطوة 4 في كل قسم)
- تحقق من `ADMIN_SEED_KEY`

### خطأ "Prisma Client not generated"
- أضف `postinstall: "prisma generate"` (موجود بالفعل)
- على Vercel، `vercel-build` يتولى ذلك

### الصور لا تظهر
- تأكد أن مجلد `public/cameras/` موجود في النشر
- على Vercel: يتم تلقائياً؛ على Hostinger: تحقق من مسار البناء

---

## 📞 الدعم

للمساعدة، راجع:
- `GAP_ANALYSIS.md` — تحليل الفجوات والمتطلبات الخارجية
- ملف `worklog.md` — سجل التطوير الكامل
