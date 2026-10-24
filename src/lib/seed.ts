import { db } from './db'

// أنواع التنبيهات
const ALERT_TYPES = [
  { ar: "تسلل", en: "Intrusion", key: "intrusion" },
  { ar: "ازدحام", en: "Crowd", key: "crowd" },
  { ar: "سلوك مشبوه", en: "Suspicious Behavior", key: "suspicious" },
  { ar: "تردد مريب", en: "Loitering", key: "loitering" },
  { ar: "شجار", en: "Fight", key: "fight" },
  { ar: "سقوط", en: "Fall Detection", key: "fall" },
  { ar: "تعرف على الوجه", en: "Face Match", key: "face" },
  { ar: "اختراق محيط", en: "Perimeter Breach", key: "perimeter" },
]

const SEVERITIES = ["critical", "high", "medium", "low"]
const ALERT_STATUSES = ["active", "acknowledged", "resolved"]
const CAMERA_STATUSES = ["online", "online", "online", "online", "offline", "maintenance"]

// المواقع (مدن سعودية + قطاعات)
const SITES = [
  { ar: "مجمع الملك عبدالله الصناعي", en: "King Abdullah Industrial Park", cityAr: "الجبيل", cityEn: "Jubail", typeAr: "صناعي", typeEn: "Industrial", lat: 27.0, lng: 49.66 },
  { ar: "مول العرب", en: "Arab Mall", cityAr: "جدة", cityEn: "Jeddah", typeAr: "تجزئة", typeEn: "Retail", lat: 21.5, lng: 39.2 },
  { ar: "مشروع نيوم", en: "NEOM Project", cityAr: "تبوك", cityEn: "Tabuk", typeAr: "مدينة ذكية", typeEn: "Smart City", lat: 28.0, lng: 35.0 },
  { ar: "مدينة الملك عبدالعزيز الطبية", en: "KAMC", cityAr: "الرياض", cityEn: "Riyadh", typeAr: "رعاية صحية", typeEn: "Healthcare", lat: 24.7, lng: 46.7 },
  { ar: "مطار الملك خالد الدولي", en: "KKIA Airport", cityAr: "الرياض", cityEn: "Riyadh", typeAr: "مدينة ذكية", typeEn: "Smart City", lat: 24.96, lng: 46.7 },
  { ar: "ميناء الملك عبدالله", en: "King Abdullah Port", cityAr: "رابغ", cityEn: "Rabigh", typeAr: "صناعي", typeEn: "Industrial", lat: 22.8, lng: 39.05 },
  { ar: "البحر الأحمر العالمي", en: "Red Sea International", cityAr: "الوجه", cityEn: "AlWajh", typeAr: "مدينة ذكية", typeEn: "Smart City", lat: 26.2, lng: 36.5 },
  { ar: "حي العليا التجاري", en: "Olaya Business District", cityAr: "الرياض", cityEn: "Riyadh", typeAr: "تجزئة", typeEn: "Retail", lat: 24.69, lng: 46.68 },
]

const CAMERA_MODELS = [
  { ar: "كشف الأشخاص YOLOv8", en: "YOLOv8 Person Detection" },
  { ar: "تتبع متعدد الأهداف", en: "Multi-Object Tracking" },
  { ar: "تحليل المشاعر", en: "Emotion Analysis" },
  { ar: "كشف الوجه", en: "Face Recognition" },
  { ar: "كشف الحرائق", en: "Fire Detection" },
  { ar: "الخريطة الحرارية", en: "Heatmap Generator" },
]

const ZONES = [
  { ar: "البوابة الرئيسية", en: "Main Gate" },
  { ar: "المواقف الشمالية", en: "North Parking" },
  { ar: "المدخل الشرقي", en: "East Entrance" },
  { ar: "المنطقة الحساسة", en: "Restricted Zone" },
  { ar: "الصالة الرئيسية", en: "Main Hall" },
  { ar: "المخزن", en: "Warehouse" },
  { ar: "الساحة المركزية", en: "Central Plaza" },
  { ar: "الممر الجنوبي", en: "South Corridor" },
]

const RESOLUTIONS = ["4K", "1080p", "1080p", "720p"]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const PIPELINES = [
  {
    nameAr: "خط الأمان المحيطي", nameEn: "Perimeter Security Pipeline",
    descAr: "كشف التسلل واختراق المحيط مع تتبع متعدد الأهداف", descEn: "Intrusion and perimeter breach detection with multi-object tracking",
    stagesAr: "كشف الحركة|تتبع الأشخاص|تصنيف السلوك|تنبيه", stagesEn: "Motion Detection|Person Tracking|Behavior Classification|Alerting",
    throughput: 60, latency: 45, sites: 6,
  },
  {
    nameAr: "إدارة الحشود", nameEn: "Crowd Management",
    descAr: "تحليل كثافة الحشود وكشف الازدحام في الأماكن العامة", descEn: "Crowd density analysis and congestion detection in public spaces",
    stagesAr: "كشف الأشخاص|عد الكثافة|تحليل الحركة|تنبيه", stagesEn: "Person Detection|Density Counting|Flow Analysis|Alerting",
    throughput: 45, latency: 62, sites: 4,
  },
  {
    nameAr: "التحليل السلوكي", nameEn: "Behavioral Analytics",
    descAr: "كشف السلوكيات المشبوهة والتردد المريب والشجار", descEn: "Suspicious behavior, loitering, and fight detection",
    stagesAr: "تتبع الأشخاص|تحليل المسار|تصنيف السلوك|تنبيه", stagesEn: "Person Tracking|Trajectory Analysis|Behavior Classification|Alerting",
    throughput: 30, latency: 88, sites: 5,
  },
  {
    nameAr: "التعرف على الوجه", nameEn: "Face Recognition",
    descAr: "المصادقة بملامح الوجه للوصول الآمن مع امتثال PDPL", descEn: "Face authentication for secure access with PDPL compliance",
    stagesAr: "كشف الوجه|استخراج الملامح|المطابقة|تسجيل", stagesEn: "Face Detection|Feature Extraction|Matching|Logging",
    throughput: 25, latency: 120, sites: 3,
  },
  {
    nameAr: "رؤى التجزئة", nameEn: "Retail Insights",
    descAr: "تحليل حركة العملاء والخريطة الحرارية في المتاجر", descEn: "Customer flow analysis and heatmaps for retail",
    stagesAr: "كشف الأشخاص|تتبع المسار|خريطة حرارية|تقارير", stagesEn: "Person Detection|Path Tracking|Heatmap|Reporting",
    throughput: 50, latency: 55, sites: 2,
  },
  {
    nameAr: "الاستجابة للطوارئ", nameEn: "Emergency Response",
    descAr: "كشف السقوط والحرائق والحوادث للاستجابة الفورية", descEn: "Fall, fire, and accident detection for instant response",
    stagesAr: "كشف الحركة|تصنيف الحدث|تقييم الخطورة|إشعار طوارئ", stagesEn: "Motion Detection|Event Classification|Severity Assessment|Emergency Notify",
    throughput: 40, latency: 35, sites: 7,
  },
  {
    nameAr: "كشف التسلل الليلي", nameEn: "Night Intrusion Detection",
    descAr: "كشف التسلل في الإضاءة المنخفضة باستخدام الرؤية الحرارية", descEn: "Low-light intrusion detection using thermal vision",
    stagesAr: "رؤية حرارية|كشف الحركة|تصفية الإنذارات|تنبيه", stagesEn: "Thermal Vision|Motion Detection|Alarm Filtering|Alerting",
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

  return { seeded: true, sites: sites.length, cameras: cameras.length }
}
