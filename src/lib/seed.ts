import { db } from './db'

// أنواع المخالفات المرورية
const ALERT_TYPES = [
  { ar: "تجاوز السرعة", en: "Speeding", key: "speeding" },
  { ar: "قطع الإشارة الحمراء", en: "Red Light Violation", key: "red_light" },
  { ar: "تجاوز السرعة العالية", en: "Excessive Speeding", key: "excessive_speed" },
  { ar: "القيادة الخاطئة", en: "Reckless Driving", key: "reckless" },
  { ar: "مركبة متوقفة بالخطأ", en: "Illegal Parking", key: "illegal_parking" },
  { ar: "تجاوز المسار", en: "Lane Violation", key: "lane_violation" },
  { ar: "القيادة عكس الاتجاه", en: "Wrong Way Driving", key: "wrong_way" },
  { ar: "حادث مروري", en: "Traffic Accident", key: "accident" },
]

const SEVERITIES = ["critical", "high", "medium", "low"]
const ALERT_STATUSES = ["active", "acknowledged", "resolved"]
const CAMERA_STATUSES = ["online", "online", "online", "online", "offline", "maintenance"]

// المواقع (مدن سعودية + قطاعات)
const SITES = [
  { ar: "طريق الرياض-الدمام السريع", en: "Riyadh-Dammam Highway", cityAr: "الرياض", cityEn: "Riyadh", typeAr: "طريق سريع", typeEn: "Highway", lat: 24.7, lng: 47.5, image: "/cameras/road-highway.jpg" },
  { ar: "تقاطع طريق الملك فهد", en: "King Fahd Road Intersection", cityAr: "الرياض", cityEn: "Riyadh", typeAr: "تقاطع حضري", typeEn: "Urban Intersection", lat: 24.71, lng: 46.68, image: "/cameras/road-intersection.jpg" },
  { ar: "كورنيش جدة", en: "Jeddah Corniche Road", cityAr: "جدة", cityEn: "Jeddah", typeAr: "طريق ساحلي", typeEn: "Coastal Road", lat: 21.5, lng: 39.2, image: "/cameras/road-corniche.jpg" },
  { ar: "طريق مكة-المدينة السريع", en: "Mecca-Medina Highway", cityAr: "مكة", cityEn: "Mecca", typeAr: "طريق سريع", typeEn: "Highway", lat: 21.4, lng: 39.8, image: "/cameras/road-mecca.jpg" },
  { ar: "طريق عسير الجبلي", en: "Asir Mountain Road", cityAr: "أبها", cityEn: "Abha", typeAr: "طريق جبلي", typeEn: "Mountain Road", lat: 18.2, lng: 42.5, image: "/cameras/road-mountain.jpg" },
  { ar: "طريق تبوك-الوجه الليلي", en: "Tabuk-AlWajh Night Road", cityAr: "تبوك", cityEn: "Tabuk", typeAr: "طريق صحراوي", typeEn: "Desert Road", lat: 28.0, lng: 36.5, image: "/cameras/road-night.jpg" },
  { ar: "نفق جبل الفيصلية", en: "Faisaliah Tunnel", cityAr: "الرياض", cityEn: "Riyadh", typeAr: "نفق", typeEn: "Tunnel", lat: 24.69, lng: 46.69, image: "/cameras/road-tunnel.jpg" },
  { ar: "دوار الملك عبدالله", en: "King Abdullah Roundabout", cityAr: "الرياض", cityEn: "Riyadh", typeAr: "دوار", typeEn: "Roundabout", lat: 24.72, lng: 46.71, image: "/cameras/road-roundabout.jpg" },
]

const CAMERA_MODELS = [
  { ar: "كشف المركبات YOLOv8", en: "YOLOv8 Vehicle Detection" },
  { ar: "قراءة اللوحات ANPR", en: "ANPR Plate Recognition" },
  { ar: "قياس السرعة", en: "Speed Measurement" },
  { ar: "كشف المخالفات المرورية", en: "Traffic Violation Detection" },
  { ar: "عدّ المركبات", en: "Vehicle Counting" },
  { ar: "تتبع المركبات", en: "Vehicle Tracking" },
]

const ZONES = [
  { ar: "المسار الأول", en: "Lane 1" },
  { ar: "المسار الثاني", en: "Lane 2" },
  { ar: "المسار الثالث", en: "Lane 3" },
  { ar: "المسار الطارئ", en: "Emergency Lane" },
  { ar: "كتف الطريق", en: "Road Shoulder" },
  { ar: "مدخل التقاطع", en: "Intersection Entry" },
  { ar: "مخرج التقاطع", en: "Intersection Exit" },
  { ar: "منطقة الدوار", en: "Roundabout Area" },
]

const RESOLUTIONS = ["4K", "1080p", "1080p", "720p"]

<<<<<<< HEAD
const ALL_IMAGES = [
  "/cameras/road-highway.jpg",
  "/cameras/road-intersection.jpg",
  "/cameras/road-corniche.jpg",
  "/cameras/road-mecca.jpg",
  "/cameras/road-mountain.jpg",
  "/cameras/road-night.jpg",
  "/cameras/road-tunnel.jpg",
  "/cameras/road-roundabout.jpg",
=======
// خريطة نوع الموقع → صورة المشهد
const SITE_IMAGE_MAP: Record<string, string> = {
  "صناعي": "/cameras/scene-industrial.jpg",
  "تجزئة": "/cameras/scene-retail.jpg",
  "مدينة ذكية": "/cameras/scene-airport.jpg",
  "رعاية صحية": "/cameras/scene-office.jpg",
}
// بدائل للتنويع حسب المدينة/الاسم
const NAME_IMAGE_MAP: Record<string, string> = {
  "مول العرب": "/cameras/scene-mall.jpg",
  "حي العليا التجاري": "/cameras/scene-mall.jpg",
  "ميناء الملك عبدالله": "/cameras/scene-warehouse.jpg",
  "مجمع الملك عبدالله الصناعي": "/cameras/scene-warehouse.jpg",
  "مشروع نيوم": "/cameras/scene-parking.jpg",
  "مطار الملك خالد الدولي": "/cameras/scene-airport.jpg",
  "البحر الأحمر العالمي": "/cameras/scene-perimeter.jpg",
  "مدينة الملك عبدالعزيز الطبية": "/cameras/scene-office.jpg",
}
const ALL_IMAGES = [
  "/cameras/scene-mall.jpg",
  "/cameras/scene-parking.jpg",
  "/cameras/scene-warehouse.jpg",
  "/cameras/scene-airport.jpg",
  "/cameras/scene-office.jpg",
  "/cameras/scene-industrial.jpg",
  "/cameras/scene-retail.jpg",
  "/cameras/scene-perimeter.jpg",
>>>>>>> 31cd72b5a77be501df5bc1ccbf5eaf6070e480e0
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const PIPELINES = [
  {
    nameAr: "كشف تجاوز السرعة", nameEn: "Speed Violation Detection",
    descAr: "قياس سرعة المركبات وكشف المتجاوزين للحد المسموح", descEn: "Vehicle speed measurement and speed limit violation detection",
    stagesAr: "كشف المركبة|قياس السرعة|مقارنة الحد|تسجيل مخالفة", stagesEn: "Vehicle Detection|Speed Measurement|Limit Compare|Violation Record",
    throughput: 60, latency: 45, sites: 6,
  },
  {
    nameAr: "قراءة اللوحات ANPR", nameEn: "ANPR Plate Recognition",
    descAr: "قراءة لوحات المركبات تلقائياً وتسجيلها في قاعدة البيانات", descEn: "Automatic number plate reading and database logging",
    stagesAr: "كشف المركبة|تحديد اللوحة|قراءة الأحرف|تسجيل", stagesEn: "Vehicle Detection|Plate Localization|OCR|Logging",
    throughput: 45, latency: 62, sites: 8,
  },
  {
    nameAr: "كشف قطع الإشارة", nameEn: "Red Light Violation",
    descAr: "كشف المركبات التي تتجاوز الإشارة الحمراء على التقاطعات", descEn: "Detect vehicles running red lights at intersections",
    stagesAr: "كشف الإشارة|تحديد الخط|كشف التجاوز|تسجيل مخالفة", stagesEn: "Light Detection|Line Detect|Crossing Detect|Violation Record",
    throughput: 30, latency: 88, sites: 4,
  },
  {
    nameAr: "كشف الحوادث المرورية", nameEn: "Traffic Accident Detection",
    descAr: "كشف الحوادث والاصطدامات للاستجابة الفورية للطوارئ", descEn: "Accident and collision detection for emergency response",
    stagesAr: "تتبع المركبات|تحليل الحركة|كشف الاصطدام|إشعار طوارئ", stagesEn: "Vehicle Tracking|Motion Analysis|Collision Detect|Emergency Notify",
    throughput: 40, latency: 35, sites: 7,
  },
  {
    nameAr: "تحليل تدفق المرور", nameEn: "Traffic Flow Analysis",
    descAr: "عدّ المركبات وتحليل كثافة المرور والازدحام", descEn: "Vehicle counting, traffic density and congestion analysis",
    stagesAr: "كشف المركبة|عدّ الكثافة|تحليل التدفق|تقارير", stagesEn: "Vehicle Detection|Density Count|Flow Analysis|Reporting",
    throughput: 50, latency: 55, sites: 8,
  },
  {
    nameAr: "كشف القيادة الخاطئة", nameEn: "Reckless Driving Detection",
    descAr: "كشف التغييرات الخطيرة بين المسارات والقيادة المتهورة", descEn: "Dangerous lane changes and reckless driving detection",
    stagesAr: "تتبع المسار|تحليل الانحراف|تصنيف السلوك|تنبيه", stagesEn: "Lane Tracking|Deviation Analysis|Behavior Class|Alerting",
    throughput: 35, latency: 50, sites: 5,
  },
  {
    nameAr: "المراقبة الليلية", nameEn: "Night Surveillance",
    descAr: "مراقبة الطرق ليلاً بكشف المركبات بالأضواء والرؤية الحرارية", descEn: "Night road surveillance with headlight and thermal detection",
    stagesAr: "رؤية ليلية|كشف الأضواء|تتبع المركبة|تنبيه", stagesEn: "Night Vision|Headlight Detect|Vehicle Tracking|Alerting",
    throughput: 35, latency: 50, sites: 4,
  },
]

export async function seedDatabase() {
  const siteCount = await db.site.count()
  if (siteCount > 0) return { seeded: false, message: "Data already exists" }

  // إنشاء المواقع
  const sites = await Promise.all(
    SITES.map((s) =>
      db.site.create({
        data: {
          name: s.ar, nameEn: s.en,
          city: s.cityAr, cityEn: s.cityEn,
          type: s.typeAr, typeEn: s.typeEn,
          lat: s.lat, lng: s.lng,
        },
      })
    )
  )

  // إنشاء الكاميرات (4-7 لكل موقع)
  let camIdx = 0
  for (const site of sites) {
    const camCount = Math.floor(rand(4, 8))
    for (let i = 0; i < camCount; i++) {
      camIdx++
      const status = pick(CAMERA_STATUSES)
      const model = pick(CAMERA_MODELS)
      const zone = pick(ZONES)
      const hasEvents = status === "online"
      const events24h = hasEvents ? Math.floor(rand(0, 28)) : 0
<<<<<<< HEAD
      // اختيار صورة المشهد: صورة الطريق المحددة + تنويع
      const imagePath = site.image || ALL_IMAGES[(camIdx - 1) % ALL_IMAGES.length]
=======
      // اختيار صورة المشهد: الاسم أولاً ثم النوع ثم تنويع
      let imagePath = NAME_IMAGE_MAP[site.name] || SITE_IMAGE_MAP[site.type] || ALL_IMAGES[(camIdx - 1) % ALL_IMAGES.length]
>>>>>>> 31cd72b5a77be501df5bc1ccbf5eaf6070e480e0
      await db.camera.create({
        data: {
          name: `كاميرا ${camIdx}`,
          nameEn: `CAM-${String(camIdx).padStart(3, "0")}`,
          siteId: site.id,
          status,
          resolution: pick(RESOLUTIONS),
          fps: pick([25, 30, 30, 60]),
          model: model.ar,
          modelEn: model.en,
          zone: zone.ar,
          zoneEn: zone.en,
          imagePath,
          events24h,
          lastEventAt: events24h > 0 ? new Date(Date.now() - rand(1, 1440) * 60000) : null,
        },
      })
    }
  }

  // إنشاء التنبيهات
  const cameras = await db.camera.findMany({ include: { site: true } })
  const onlineCams = cameras.filter((c) => c.status === "online")
  for (const cam of onlineCams) {
    const alertCount = Math.floor(rand(0, 5))
    for (let i = 0; i < alertCount; i++) {
      const type = pick(ALERT_TYPES)
      const severity = pick(SEVERITIES)
      const status = pick(ALERT_STATUSES)
      const confidence = Math.floor(rand(72, 99))
      const descAr = pick([
        "تم رصد الحدث أثناء التحليل اللحظي للبث",
        "النموذج كشف النشاط بدقة عالية",
        "تنبيه مؤكد من خط إنتاج الرؤية",
        "حدث متكرر في المنطقة نفسها",
        "كشف فوري بعد تجاوز العتبة",
      ])
      const descEn = pick([
        "Event detected during real-time stream analysis",
        "Model detected activity with high precision",
        "Confirmed alert from vision pipeline",
        "Recurring event in the same zone",
        "Instant detection after threshold breach",
      ])
      await db.alert.create({
        data: {
          cameraId: cam.id,
          siteId: cam.siteId,
          type: type.ar,
          typeEn: type.en,
          severity,
          status,
          description: descAr,
          descriptionEn: descEn,
          confidence,
          createdAt: new Date(Date.now() - rand(1, 4320) * 60000),
        },
      })
    }
  }

  // إنشاء خطوط الإنتاج
  for (const p of PIPELINES) {
    await db.pipeline.create({
      data: {
        name: p.nameAr,
        nameEn: p.nameEn,
        description: p.descAr,
        descriptionEn: p.descEn,
        stages: p.stagesAr,
        stagesEn: p.stagesEn,
        active: Math.random() > 0.25,
        throughput: p.throughput + Math.floor(rand(-5, 6)),
        latency: p.latency + Math.floor(rand(-8, 9)),
        siteCount: p.sites,
      },
    })
  }

  // إنشاء قائمة الوجوه المراقبة
  const watchlist = [
    { ar: "أحمد المالكي", en: "Ahmad Al-Maliki", roleAr: "موظف", roleEn: "Employee", statusAr: "نشط", statusEn: "Active", notes: "وصول كامل - إدارة" },
    { ar: "سارة العتيبي", en: "Sara Al-Otaibi", roleAr: "موظف", roleEn: "Employee", statusAr: "نشط", statusEn: "Active", notes: "دوام صباحي" },
    { ar: "خالد الحربي", en: "Khalid Al-Harbi", roleAr: "زائر", roleEn: "Visitor", statusAr: "نشط", statusEn: "Active", notes: "موعد متكرر" },
    { ar: "نورة القحطاني", en: "Noura Al-Qahtani", roleAr: "موظف", roleEn: "Employee", statusAr: "نشط", statusEn: "Active", notes: "أمن الموقع" },
    { ar: "فهد الزهراني", en: "Fahad Al-Zahrani", roleAr: "ممنوع", roleEn: "Banned", statusAr: "موقوف", statusEn: "Suspended", notes: "ممنوع من الدخول" },
    { ar: "ريم الشمري", en: "Reem Al-Shammari", roleAr: "زائر", roleEn: "Visitor", statusAr: "نشط", statusEn: "Active", notes: "مقاول خارجي" },
    { ar: "عبدالله الدوسري", en: "Abdullah Al-Dosari", roleAr: "موظف", roleEn: "Employee", statusAr: "نشط", statusEn: "Active", notes: "إدارة الصيانة" },
    { ar: "ماجد الغامدي", en: "Majed Al-Ghamdi", roleAr: "ممنوع", roleEn: "Banned", statusAr: "موقوف", statusEn: "Suspended", notes: "تحت المراقبة" },
  ]

  for (const w of watchlist) {
    const hasMatch = Math.random() > 0.4
    const siteForMatch = pick(SITES)
    await db.watchlistPerson.create({
      data: {
        name: w.ar,
        nameEn: w.en,
        role: w.roleAr,
        roleEn: w.roleEn,
        status: w.statusAr,
        statusEn: w.statusEn,
        matchCount: hasMatch ? Math.floor(rand(1, 28)) : 0,
        lastSeen: hasMatch ? new Date(Date.now() - rand(1, 1440) * 60000) : null,
        lastSite: hasMatch ? siteForMatch.ar : null,
        lastSiteEn: hasMatch ? siteForMatch.en : null,
        notes: w.notes,
      },
    })
  }

  // إنشاء الجهات المختصة
  const { AUTHORITIES_SEED, ROUTING_RULES_SEED, AUTOMATION_RULES_SEED, AI_MODELS_SEED } = await import('./incidents')
  const authorities = await Promise.all(
    AUTHORITIES_SEED.map((a) =>
      db.authority.create({
        data: {
          name: a.ar, nameEn: a.en,
          category: a.category, categoryEn: a.categoryEn,
          contactName: a.contactName, contactPhone: a.contactPhone,
          sandboxMode: a.sandboxMode, active: true,
        },
      })
    )
  )

  // إنشاء قواعد التوجيه
  for (const r of ROUTING_RULES_SEED) {
    const auth = authorities.find((a) => a.nameEn === r.authorityEn)
    if (auth) {
      await db.routingRule.create({
        data: {
          name: r.ar, nameEn: r.en,
          conditionType: r.condType,
          conditionValue: r.condValue,
          authorityId: auth.id,
          priority: r.priority,
          active: true,
        },
      })
    }
  }

  // إنشاء قواعد الأتمتة
  for (const r of AUTOMATION_RULES_SEED) {
    await db.automationRule.create({
      data: {
        name: r.ar, nameEn: r.en,
        description: r.desc,
        conditions: r.conditions,
        actions: r.actions,
        priority: r.priority,
        active: true,
      },
    })
  }

  // إنشاء نماذج الذكاء الاصطناعي
  for (const m of AI_MODELS_SEED) {
    await db.aIModel.create({
      data: {
        name: m.ar, nameEn: m.en,
        task: m.task, taskEn: m.taskEn,
        version: m.version,
        threshold: m.threshold,
        status: m.status,
        isExperimental: m.experimental,
      },
    })
  }

  // إنشاء مقاييس صحة النظام (بيانات تجريبية موضحة)
  const metrics = [
    { metric: "camera_online", value: cameras.filter(c => c.status === "online").length, unit: "cameras", status: "ok" },
    { metric: "stream_fps", value: 28, unit: "fps", status: "ok" },
    { metric: "network_latency", value: 42, unit: "ms", status: "ok" },
    { metric: "storage_usage", value: 67, unit: "%", status: "warning", message: "اقترب المساحة من الحد" },
    { metric: "ai_latency", value: 380, unit: "ms", status: "ok" },
    { metric: "failed_jobs", value: 2, unit: "jobs", status: "warning" },
    { metric: "api_availability", value: 99.8, unit: "%", status: "ok" },
    { metric: "system_uptime", value: 99.6, unit: "%", status: "ok" },
  ]
  for (const m of metrics) {
    await db.systemHealthMetric.create({ data: { ...m, message: m.message || null } })
  }

  return { seeded: true, sites: sites.length, cameras: cameras.length, authorities: authorities.length }
}
