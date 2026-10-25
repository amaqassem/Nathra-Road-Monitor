# Nathra — Gap Analysis & Implementation Report

## تقرير فجوة التحليل

تاريخ الفحص: {date}
الإصدار: Phase 1 Foundation

---

## 1. الحالة الحالية للمشروع (ما يعمل فعلياً)

### يعمل فعلياً (Production-ready)
| الميزة | الحالة | الدليل |
|---|---|---|
| i18n ثنائي اللغة (AR/EN + RTL/LTR) | ✅ يعمل | قاموس ~150 مفتاح، تبديل لحظي، حفظ localStorage |
| قاعدة بيانات Prisma + SQLite | ✅ يعمل | 5 نماذج: Site, Camera, Alert, Pipeline, WatchlistPerson |
| بيانات بذرية واقعية | ✅ يعمل | 8 مواقع سعودية، 43 كاميرا، تنبيهات، 7 خطوط إنتاج، 8 وجوه |
| تحليل الصور بالـ VLM (z-ai-web-dev-sdk) | ✅ يعمل | /api/analyze-vision و /api/auto-scan يحللان صور CCTV حقيقية |
| صور مراقبة CCTV حقيقية مولّدة بالـ AI | ✅ يعمل | 8 صور 1344×768 في /public/cameras |
| إدارة التنبيهات (CRUD + acknowledge/resolve) | ✅ يعمل | API PATCH + تحديث لحظي + toast |
| قائمة الوجوه (CRUD كامل) | ✅ يعمل | إضافة/حذف/تصفية |
| خطوط الإنتاج (toggle فعّال) | ✅ يعمل | PATCH + تحديث متفائل |
| لوحة التحكم + KPIs + رسوم Recharts | ✅ يعمل | بيانات حقيقية من DB |
| Dark/Light mode | ✅ يعمل | next-themes |
| تصميم متجاوب + تذييل ثابت | ✅ يعمل | موبايل 390px + ديسكتوب |

### تجريبي / يحتاج توضيح (Demo — needs honesty label)
| الميزة | الواقع | الإجراء المطلوب |
|---|---|---|
| "البث الحي" للكاميرات | **صور ثابتة + Canvas overlay** (bounding boxes متحركة + timestamp) — ليست بث فيديو حقيقي | وضع علامة "Demo Stream" واضحة، وبناء Camera Management للكاميرات الفعلية |
| شريط الأحداث اللحظي | يجلب تنبيهات DB حقيقية + يضيف أحداث محاكاة كل 6-12ث | الفصل بين الأحداث الحقيقية والمحاكاة |
| المعالجة التلقائية (auto-scan) | تستدعي VLM عند الطلب فقط — لا تعمل في الخلفية دون متصفح | بناء Background Scanner مستقل |

### يتطلب تكاملات خارجية (لا يمكن تنفيذه بالكامل في هذه البيئة)
| الميزة | السبب | البديل المنفّذ |
|---|---|---|
| بث RTSP/ONVIF/WebRTC حقيقي | يتطلب MediaMTX/GStreamer/FFmpeg server + كاميرا فعلية | Camera Management Dashboard + Demo Mode واضح |
| معالجة فيديو مستمرة في الخلفية | يتطلب Worker process مستقل (BullMQ + Redis أو cron server) | Background Scanner عبر cron endpoint يمكن جدولته |
| إرسال بلاغات لجهات حكومية | يتطلب تكامل رسمي مصرّح به + تأكيد تقني | محرك توجيه داخلي قابل للتكوين + Sandbox mode |
| إشعارات Email/SMS/Push | يتطلب SMTP/FCM/Twilio | نظام إشعارات in-app + واجهة جاهزة للقنوات الخارجية |
| التعرف على الوجوه ببيانات حيوية | يتطلب تقييماً قانونياً وخصوصياً (PDPL) | Watchlist كبيانات تنظيمية فقط بدون مطابقة حيوية فعلية |

---

## 2. ما تم تنفيذه في هذه المرحلة (Phase 1 + عناصر Phase 2/3)

### المرحلة 1 — Production Foundation
1. **توسيع قاعدة البيانات** بإضافة 9 نماذج جديدة: Incident, IncidentEvidence, Authority, RoutingRule, AuditLog, AIModel, AutomationRule, SystemHealthMetric, Notification
2. **نظام إدارة الحوادث (Incidents)** بسير عمل كامل: Detected → Under Review → Confirmed → Assigned → In Progress → Resolved → Closed، مع تعيين المسؤول، سجل إجراءات، SLA، منع التكرار
3. **مستودع الأدلة (Evidence Vault)** مع Hash للتحقق، Chain of Custody، Access Logs
4. **تحديث auto-scan**: منع تكرار البلاغات، إنشاء Incident مع أدلة، تسجيل Audit Log، توجيه للجهة
5. **محرك التوجيه (Authority Routing)** قابل للتكوين مع Routing Rules Dashboard + Authority Directory + Sandbox mode
6. **خلفية المعالجة (Background Scanner)**: endpoint قابل للجدولة يعمل دون فتح المتصفح

### المرحلة 2 — Operations
7. **خريطة GIS القيادية** التفاعلية مع مواقع الكاميرات والحوادث وHeatmaps
8. **محرر القواعد (Rules Engine)** No-Code IF/THEN
9. **مراقبة الصحة (Health Monitor)** بمقاييس النظام
10. **الإشعارات (in-app)** مع واجهة جاهزة للقنوات الخارجية
11. **لوحة إدارة الكاميرات** لإضافة RTSP/ONVIF مع Demo Mode واضح

### المرحلة 3 — Intelligence
12. **مساعد Nathra AI Copilot** يستعلم من DB الفعلي عبر LLM (لا يخترع أرقاماً)
13. **تحليلات تنبؤية أساسية** (ساعات الذروة، مواقع عالية المخاطر)

### الامتثال والأمان
14. **Audit Log** لجميع الإجراءات الحساسة
15. **RBAC أساسي** (Admin / Operator / Viewer) عبر واجهة
16. شارات PDPL مع توضيح أنها ليست دليل امتثال قانوني

---

## 3. العوائق والمتطلبات الخارجية غير المتوفرة

> هذه عوائق حقيقية يجب حلها قبل الإنتاج:

1. **بث الكاميرات الفعلي**: يتطلب خادم MediaMTX أو FFmpeg + كاميرات RTSP مرخصة. المنصة الحالية تعرض Demo Streams بوضوح.
2. **معالجة الفيديو المستمرة**: يتطلب Worker process مستقل (BullMQ + Redis). تم بناء `/api/cron/scan` قابل للجدولة بـ curl/cron.
3. **التكامل الحكومي**: لا يتم إرسال بلاغ لأي جهة خارجية. محرك التوجيه داخلي + Sandbox للاختبار.
4. **PostgreSQL**: SQLite كافٍ للعرض التوضيحي. للإنتاج يجب الترحيل (موصى به) — schema جاهز للترحيل.
5. **المصادقة الكاملة (MFA/SSO)**: يتطلب IdP. متوفر NextAuth.js لكن لم يُفعّل بالكامل.
6. **البيانات الحيوية (الوجوه)**: مطابقة الوجوه الفعلية معطّلة قانونياً وتتطلب تقييماً.

---

## 4. اختبارات القبول (Acceptance Criteria)

| # | الاختبار | الحالة |
|---|---|---|
| 1 | إضافة كاميرا ببيانات RTSP | ✅ (Demo Stream — لا بث فعلي) |
| 2 | ظهور فيديو حقيقي من الكاميرا | ⚠️ يتطلب كاميرا فعلية + MediaMTX |
| 3 | استمرار المعالجة دون متصفح | ✅ عبر /api/cron/scan |
| 4 | اكتشاف مخالفة بفيديو اختبار | ✅ عبر VLM (صور) |
| 5 | إنشاء حادث تلقائي دون تكرار | ✅ منع التكرار + Incident |
| 6 | حفظ مقطع كدليل | ⚠️ صورة دليل (الفيديو يتطلب storage + recording) |
| 7 | توجيه البلاغ لفريق داخلي | ✅ Authority Routing |
| 8 | استقبال إشعار | ✅ in-app Notification |
| 9 | تحديث حالة البلاغ | ✅ سير عمل كامل |
| 10 | عرض الحادث على الخريطة | ✅ GIS Map |
| 11 | ظهور الحادث في التقارير | ✅ Dashboard + Analytics |
| 12 | تسجيل الإجراءات في Audit Log | ✅ AuditLog model |

---

## 5. ملاحظات الامتثال

- شارة "PDPL/GDPR" في الواجهة هي **مؤشر تنظيمي** وليست دليل امتثال قانوني.
- التعرف على الوجوه معطّل — قائمة الوجوه بيانات تنظيمية فقط.
- أي معالجة بيانات شخصية تتطلب تقييماً قانونياً قبل التفعيل.
- البيانات تُحفظ محلياً (On-Premises ready) لكن التشفير at-rest يتطلب تكوين SQLite SEE أو PostgreSQL.
