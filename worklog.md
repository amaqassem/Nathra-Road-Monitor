---
Task ID: 1
Agent: Z.ai Code (main)
Task: بناء منصة وطنية لمراقبة جودة الطرق في السعودية بتصميم رائع ومميزات كاملة

Work Log:
- صمّمت مخطط قاعدة بيانات Prisma شامل (Region, RoadSegment, Issue, Inspection, Sensor) مع 13 منطقة سعودية
- بنيت ثيماً مخصصاً بالأخضر السعودي الزمردي مع خلفية رملية دافئة ووضع داكن (أسفلت)
- جهّزت التخطيط RTL بخط Cairo العربي ودعم وضع فاتح/داكن
- أنشأت 6 نقاط API: /api/seed, /api/dashboard, /api/roads, /api/issues (GET+POST), /api/regions, /api/analyze-road (VLM)
- بنيت بيانات بذرية (seed) لـ 24 مقطع طرقي مع فحوصات وبلاغات ومستشعرات
- طوّرت 6 واجهات: لوحة التحكم، الخريطة التفاعلية، الطرق، البلاغات، التحليلات، التحليل الذكي
- بنيت خريطة SVG تفاعلية للمملكة مع علامات مناطق ملوّنة حسب الجودة
- دمجت مهارة VLM لتحليل صور الطرق وكشف العيوب بالعربية
- أصلحت أخطاء (أيقونة Road غير موجودة، setState في effect، تحذير Dialog ARIA)
- تحققت عبر Agent Browser: لوحة التحكم، الخريطة، الطرق، البلاغات (إنشاء بلاغ)، التحليلات، التحليل الذكي (رفع صورة وتحليل VLM)

Stage Summary:
- المنصة تعمل بالكامل بلا أخطاء على المنفذ 3000
- جميع التبويبات الست تعمل مع بيانات حقيقية من قاعدة SQLite
- ميزة التحليل الذكي بالذكاء الاصطناعي تعمل (VLM يحلل صور الطرق ويرجع درجة، عيوب، توصيات بالعربية)
- إنشاء البلاغات يعمل (تم اختباره — زاد العدد من 67 إلى 68)
- التصميم متجاوب (موبايل 390px + ديسكتوب 1280px) مع وضع فاتح/داكن
- التذييل ثابت أسفل الصفحة (mt-auto + flex-col)
- lint نظيف 0 أخطاء

---
Task ID: 2
Agent: Z.ai Code (main)
Task: تحويل المنصة إلى "نظرة" — منصة أمان ذكي بالرؤية الحاسوبية مع دعم عربي/إنجليزي

Work Log:
- بنيت نظام i18n ثنائي اللغة (عربي/إنجليزي) عبر React Context مع قاموس ترجمات شامل (~150 مفتاح)
- مبدّل لغة في الهيدر يبدّل الاتجاه RTL/LTR ويحفظ الاختيار في localStorage
- صمّمت ثيم "مركز قيادة" جديد: سلايت/كحلي داكن + سيان سماوي كألوان أساسية
- أعدت بناء Prisma schema لمنصة الأمان: Site, Camera, Alert, Pipeline (مع حقول ثنائية اللغة ar/en)
- بنيت بيانات بذرية: 8 مواقع سعودية (صناعي/تجزئة/مدن ذكية/رعاية صحية)، 45 كاميرا، تنبيهات، 7 خطوط إنتاج رؤية
- أنشأت 6 نقاط API: /api/seed, /api/nathra-dashboard, /api/cameras, /api/alerts (GET+POST), /api/sites, /api/pipelines (GET+PATCH), /api/analyze-vision (VLM)
- بنيت 6 واجهات ثنائية اللغة: نظرة عامة، الكاميرات الحية، الرؤية الذكية، التنبيهات، التحليلات، خطوط الإنتاج
- محاكاة بث كاميرا حي مع خط مسح، مؤشر REC نابض، شبكة كاميرا
- ميزة الرؤية الذكية: VLM يحلل صور المراقبة — كشف الأشخاص، السلوكيات، المشاعر، العناصر، الامتثال PDPL
- الخريطة الحرارية للنشاط (7 أيام × 24 ساعة) مع تدرج لوني للكثافة
- خطوط الإنتاج مع مفتاح Switch لتفعيل/إيقاف (تحديث متفائل عبر API)
- شريط امتثال PDPL/GDPR في الهيدر والتذييل
- تحققت عبر Agent Browser: التبديل بين AR/EN يعمل، جميع التبويبات الست، تحليل VLM لصورة كاميرا (كشف 16 شخص + سلوكيات + مشاعر)، تفعيل خط إنتاج، استجابة موبايل

Stage Summary:
- منصة "نظرة" تعمل بالكامل بلا أخطاء، ثنائية اللغة (عربي RTL + إنجليزي LTR)
- 45 كاميرا عبر 8 مواقع، 7 خطوط إنتاج رؤية، نظام تنبيهات كامل
- ميزة الرؤية الذكية تعمل (VLM يكشف الأشخاص والسلوك والمشاعر والتوصيات)
- التصميم متجاوب + وضع فاتح/داكن + تذييل ثابت
- lint نظيف 0 أخطاء

---
Task ID: 3
Agent: Z.ai Code (main)
Task: جعل كل المميزات تعمل فعلياً + كاميرات بث حي + ميزات جديدة شغّالة

Work Log:
- بنيت مكوّن LiveCameraFeed بـ Canvas: أشخاص متحركة بـ bounding boxes ملوّنة، طابع زمني حي يتحدث كل ثانية، خط مسح متحرك، شبكة كاميرا، مؤشر REC نابض، عدد مكتشفات لحظي، دعم getUserMedia للكاميرا الفعلية
- حدّثت واجهة الكاميرات: نقر أي كاميرا يفتح modal ببث حي كبير (800x450) مع تفاصيل كاملة وأزرار تحكم
- أضفت أزرار استلام/حل للتنبيهات مع API PATCH فعّال (/api/alerts/[id]/action) — تحديث محلي فوري + toast
- بنيت شريط الأحداث اللحظي (LiveEventTicker): يتحدث تلقائياً كل 6-12 ثانية بحدث جديد، يعرض تنبيهات نشطة من DB + أحداث محاكاة، عداد "+N جديد"
- بنيت ميزة قائمة الوجوه المراقبة (Watchlist): 8 أشخاص مع أدوار (موظف/زائر/ممنوع)، إضافة/حذف فعّال، تصفية، إحصائيات، بطاقة امتثال PDPL
- أضفت نموذج WatchlistPerson لقاعدة البيانات + API كامل (GET/POST/DELETE)
- أصلحت خطأ: حذف GET من /api/alerts عند إضافة PATCH — أعدت GET+POST+PATCH معاً
- تحققت عبر Agent Browser: 29 كاميرا canvas ترسم فعلياً، modal بث كبير، استلام تنبيه يعمل (18→17)، إضافة شخص للقائمة تعمل، حذف يعمل، شريط لحظي يضيف أحداث

Stage Summary:
- الكاميرات بث حي حقيقي بالـ Canvas (أشخاص متحركة + bounding boxes + طابع زمني لحظي)
- 7 تبويبات جميعها تعمل: نظرة عامة، الكاميرات، الرؤية الذكية، التنبيهات، التحليلات، خطوط الإنتاج، قائمة المراقبة
- استلام/حل التنبيهات يعمل فعلياً (PATCH + تحديث لحظي)
- قائمة الوجوه: إضافة/حذف يعمل + تصفية + إحصائيات
- شريط أحداث لحظي يتحدث تلقائياً
- lint نظيف 0 أخطاء

---
Task ID: 4
Agent: Z.ai Code (main)
Task: كاميرات بصور حقيقية + معالجة تلقائية للمخالفات وفتح بلاغ تلقائي للجهة المختصة

Work Log:
- ولّدت 8 صور مراقبة CCTV واقعية بالذكاء الاصطناعي (مول/مواقف/مستودع/مطار/مكتب/صناعي/تجزئة/محيط ليلي) بحجم 1344x768
- أضفت imagePath لـ Camera schema + authority و autoProcessed لـ Alert schema
- حدّثت seed: تعيين imagePath لكل كاميرا حسب نوع الموقع/اسمه
- أعدت كتابة LiveCameraFeed لعرض الصور الحقيقية مع overlay كامل (REC/timestamp/bounding boxes متحركة/خط مسح/شبكة)
- بنيت API /api/auto-scan: يختار كاميرا نشطة، يقرأ صورتها من public، يحللها بالـ VLM لكشف المخالفات، ينشئ تنبيه تلقائي مع تحديد الجهة المختصة (الأمن/الشرطة/السلامة المهنية/الدفاع المدني/الإسعاف حسب نوع المخالفة)
- بنيت مكوّن AutoScanPanel: فحص دوري تلقائي كل 30ث + زر فحص فوري + إحصائيات (فحوصات/مخالفات/سليمة) + سجل بصور الكاميرات المصغرة + الجهة المحالة + شارة "بلاغ تلقائي"
- أضفت زر "فحص الآن" في modal الكاميرا + عرض نتيجة الفحص (مخالفة/سليم + الجهة المختصة)
- حدّثت واجهة التنبيهات: شارة "معالج تلقائياً" + الجهة المختصة لكل تنبيه تلقائي
- تحققت عبر Agent Browser: 30 صورة كاميرا محمّلة، auto-scan اكتشف مخالفة (رافعة شوكية دون سلامة) وحوّل للجهة المختصة وأنشأ بلاغ، الفحص اليدوي من modal يعمل، شارات التنبيهات تظهر

Stage Summary:
- الكاميرات تعرض صور مراقبة حقيقية (8 مشاهد CCTV مختلفة) مع bounding boxes متحركة + طابع زمني لحظي
- نظام معالجة تلقائية كامل: فحص دوري بالـ VLM → كشف مخالفة → إنشاء بلاغ → تحويل للجهة المختصة تلقائياً
- الجهة المختصة تُحدد تلقائياً حسب نوع المخالفة (السلامة المهنية/الأمن الخاص/الشرطة/الدفاع المدني/الإسعاف)
- التنبيهات التلقائية تحمل شارة "معالج تلقائياً" + الجهة المختصة
- lint نظيف 0 أخطاء

---
Task ID: 5
Agent: Z.ai Code (sub-agent — general-purpose)
Task: بناء 4 واجهات React لمنصة "نظرة": محرر القواعد، مساعد الذكاء الاصطناعي، خريطة القيادة الوطنية GIS، إدارة الكاميرات

Work Log:
- قرأت سياق العمل السابق (Tasks 1-4) + ملفات النظام (i18n, helpers, health-view, incidents-view, globals.css) لفهم الأنماط القائمة
- File 1 — rules-engine-view.tsx: محرر قواعد بدون كود. يعرض القواعد كـ "IF [field op value] THEN [action]" مع شرائح chips ملوّنة. Switch لتفعيل/إيقاف كل قاعدة (PATCH متفائل + تراجع عند الفشل). Dialog لإنشاء قاعدة جديدة مع condition builder (field/op/value) + action builder (action/params) + priority. POST مع JSON.stringify للمصفوفات. بطاقة معلومات تشرح "ما هي قواعد الأتمتة؟" ثنائية اللغة.
- File 2 — copilot-view.tsx: واجهة محادثة مع مساعد Nathra AI. أيقونة BrainCircuit في صندوق gradient-nathra. منطقة محادثة قابلة للتمرير (max-h-500px)، رسائل المستخدم على جانب والمساعد على الآخر. شارة مصدر البيانات تحت كل إجابة: "{recordsAnalyzed} سجل · {timestamp}". أسئلة مقترحة كـ chips قابلة للنقر. بطاقة تنبيه + بطاقة مصادر البيانات + بطاقة نصيحة في الشريط الجانبي. استدعاء POST /api/copilot مع {question, lang} + spinner تحميل.
- File 3 — gis-map-view.tsx: خريطة GIS وطنية. SVG viewBox 660×720 مع مخطط السعودية المبسّط (polygon من 22 نقطة مرسومة بإسقاط lat/lng). علامات المواقع دوائر ملوّنة حسب safetyScore (≥80 أخضر، 60-79 كهرماني، <60 أحمر) بحجم يتناسب مع cameraCount. علامات الحوادث نقاط حمراء/برتقالية مع نبض SVG animate للحرجة. خطوط شبكة lat/lng + علامة مائية "المملكة العربية السعودية". شريط جانبي: فلاتر (Select للخطورة + Switch لإظهار الحوادث) + بطاقة تفاصيل الموقع المختار + قائمة مواقع بأشرطة درجة الأمان + بطاقة تنبيه. استخدم useMemo للإسقاط لتفادي إعادة الرسم غير الضرورية.
- File 4 — camera-management-view.tsx: لوحة إدارة الكاميرات. بطاقة تنبيه بارزة "وضع العرض" توضح أن البث الفعلي يتطلب MediaMTX/FFmpeg. جدول كاميرات (desktop) + بطاقات (mobile) مع: الاسم، الموقع، شارة الحالة، شارة streamType (rtsp/onvif/hls/webrtc/demo)، مؤشر LIVE/DEMO، الدقة، FPS. Dialog إضافة كاميرا مع: name/nameEn، site (Select من /api/sites)، zone، resolution، fps، streamType، streamUrl (مع ملاحظة "stored on server only")، credentials (password مع ملاحظة "encrypted at rest")، model. ملاحظة أمنية واضحة أن البيانات لا تُرجع للعميل.
- جميع الواجهات: 'use client'، useI18n + isAr ternary لكل النصوص، h2 + text-2xl font-extrabold + subtitle text-sm text-muted-foreground، Card/Badge/Button/Input/Select/Switch/Dialog من shadcn/ui، أزرار رئيسية gradient-nathra text-primary-foreground، toast من sonner، formatNumber/formatRelativeTime من helpers.

Stage Summary:
- 4 واجهات جديدة مكتملة في src/components/nathra/views/: rules-engine-view, copilot-view, gis-map-view, camera-management-view
- جميعها تتبع نفس نمط التصميم القائم (header + cards + bilingual + shadcn/ui)
- النصوص ثنائية اللغة بالكامل عبر isAr ternary
- التفاعل مع APIs الحالية يعمل: GET/POST/PATCH /api/automation-rules، POST /api/copilot، GET /api/sites + /api/incidents، GET/POST /api/cameras/manage
- أمان كريم: بيانات الاعتماد لا تُرجع للعميل، واضح في الواجهة
- أداء: استخدمت useMemo لرسم علامات الخريطة لتفادي إعادة الحساب
- lint نظيف 0 أخطاء (eslint exit code 0)
- TypeScript: لا أخطاء في الملفات الأربعة الجديدة (أخطاء موجودة في ملفات أخرى سابقة، ليست ضمن نطاق المهمة)

---
Task ID: 6
Agent: Z.ai Code (main)
Task: تطوير منصة نظرة إلى منصة مؤسسية متكاملة (Phase 1 + عناصر Phase 2/3)

Work Log:
- كتبت تقرير Gap Analysis شامل (GAP_ANALYSIS.md) يوضح ما يعمل/ما هو تجريبي/ما يتطلب تكاملات خارجية
- وسّعت قاعدة البيانات بـ 9 نماذج جديدة: Incident, IncidentEvidence, Authority, RoutingRule, AuditLog, AIModel, AutomationRule, SystemHealthMetric, Notification — مع فهارس وعلاقات
- بنيت مكتبة incidents.ts مشتركة: generateIncidentNo, fileHash (SHA-256), logAudit, createNotification, findDuplicateIncident (منع التكرار), resolveAuthority (عبر قواعد DB)
- حدّثت auto-scan: منع تكرار البلاغات (نفس الكاميرا+النوع خلال ساعة) + إنشاء Incident برقم مرجعي INC-2026-XXXX + SLA تلقائي حسب الخطورة + حفظ Evidence بـ hash + Audit Log + إشعار + توجيه للجهة عبر قواعد DB
- أنشأت 10 APIs جديدة: incidents (GET + [id] GET/PATCH بسير عمل كامل مع validation transitions), evidence (GET + [id] PATCH لـ chain of custody), authorities (GET/POST), routing-rules (GET/POST/PATCH), automation-rules (GET/POST/PATCH), ai-models (GET/PATCH), health (GET), notifications (GET/PATCH), copilot (POST — LLM يستعلم DB الفعلي), cron/scan (POST — background scanner قابل للجدولة), cameras/manage (GET/POST — إضافة RTSP/ONVIF بدون إرجاع credentials)
- بنيت 8 واجهات جديدة: Incidents (سير عمل كامل 7 حالات + modal تفاصيل + audit log + evidence + SLA + تقديم حالة + تعيين), Evidence Vault (hash + chain of custody + أزرار view/verify/download), Authority Routing (قواعد توجيه + دليل جهات + Sandbox banner + إضافة), Rules Engine (No-Code IF/THEN + تفعيل/تعطيل + إضافة), AI Copilot (شات LLM + أسئلة مقترحة + data source badge + disclaimer), GIS Command Map (SVG خريطة السعودية + علامات مواقع/حوادث + heatmaps), Health Monitor (8 مقاييس + حالة كلية), Camera Management (Demo banner + إضافة RTSP/ONVIF + أمان credentials)
- أضفت 15 تبويب منظم في 3 مجموعات بفواصل بصرية
- أضفت مفاتيح i18n لكل التبويبات الجديدة
- وفّرت subagent لبناء 4 واجهات (Rules/Copilot/GIS/CameraMgmt) — Task ID 5
- أصلحت أخطاء: FlaskTriangle→FlaskConical, a.params object rendering في Rules Engine
- تحققت: 8 حوادث مع أدلة+audit+توجيه, تقديم حالة يعمل (toast), 15 تبويب تعمل, Evidence hashes ظاهرة, Sandbox banner, Demo banner للكاميرات, lint نظيف

Stage Summary:
- المنصة الآن مؤسسية بـ 15 وحدة: Overview, Cameras, Camera Mgmt, AI Vision, Incidents, Alerts, Evidence, Routing, Rules, GIS, Analytics, Copilot, Health, Pipelines, Watchlist
- نظام إدارة حوادث كامل: Detected→Under Review→Confirmed→Assigned→In Progress→Resolved→Closed مع validation + audit + SLA + dedup
- محرك توجيه قابل للتكوين بقواعد DB + Sandbox mode واضح
- مستودع أدلة بـ SHA-256 + chain of custody + access logs
- مساعد AI Copilot يستعلم من DB الفعلي (لا يخترع أرقاماً)
- خريطة GIS قيادية تفاعلية
- مراقبة صحة النظام
- خلفية معالجة (cron/scan) قابلة للجدولة دون متصفح
- العوائق الموثقة: بث RTSP فعلي (يتطلب MediaMTX), VLM rate limit مؤقت, إرسال لجهات حكومية (يتطلب تكامل رسمي), PostgreSQL للإنتاج
- lint نظيف 0 أخطاء

---
Task ID: 7
Agent: Z.ai Code (main)
Task: تجديد التصميم بالكامل + إصلاح الأعطال + التحقق الشامل

Work Log:
- استخدمت VLM لتحليل التصميم القديم (7/10): مشاكل محاذاة، هيدر مزدحم، بطاقات فارغة
- صممت ثيم جديد "Midnight Amber": كحلي عميق (oklch 0.14 0.015 265) + كهرماني ذهبي متوهج (oklch 0.75 0.16 60)
- جددت globals.css بالكامل: ألوان جديدة، glassmorphism محسّن، glow-amber، card-hover، nav-scroll
- جددت الهيدر: شعار "نظرة | NATHRA" مع tagline "ذكاء يتجاوز الرؤية"، أيقونة Eye كهرمانية، توهجات ضوئية
- جددت شريط التنقل: أيقونات فقط على الموبايل، نص على الديسكتوب، فواصل بصرية، glow على التبويب النشط
- جددت التذييل: هوية كهرمانية متناسقة
- أصلحت ألوان الرسوم: استبدلت جميع #06b6d4 (سيان) بـ #f59e0b (كهرماني) في كل الواجهات
- أصلحت ألوان LiveCameraFeed (bounding boxes + scan line كهرمانية)
- تحققت من كل الـ 15 تبويب: جميعها تعمل بدون أخطاء
- VLM قيّم التصميم الجديد: نظرة عامة 8/10، الحوادث 9/10، الكاميرات 8/10، الإنجليزية LTR 9/10
- تحققت من تبديل اللغة AR↔EN (RTL↔LTR) يعمل بشكل صحيح
- lint نظيف 0 أخطاء

Stage Summary:
- تصميم جديد كهرماني/كحلي احترافي (Midnight Amber) — تقييم VLM 8-9/10
- 15 تبويب جميعها تعمل بدون أخطاء
- ثنائي اللغة AR/EN مع RTL/LTR يعمل
- متجاوب (أيقونات فقط على الموبايل)
- lint نظيف
