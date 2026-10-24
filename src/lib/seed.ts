import { db } from './db'

// بيانات المناطق الإدارية في المملكة العربية السعودية
const REGIONS = [
  { name: 'الرياض', code: 'RYD', lat: 24.7136, lng: 46.6753 },
  { name: 'مكة المكرمة', code: 'MKH', lat: 21.3891, lng: 39.8579 },
  { name: 'المدينة المنورة', code: 'MDN', lat: 24.5247, lng: 39.5692 },
  { name: 'القصيم', code: 'QSM', lat: 26.3260, lng: 43.9750 },
  { name: 'المنطقة الشرقية', code: 'EST', lat: 25.3833, lng: 49.6833 },
  { name: 'عسير', code: 'ASR', lat: 18.2164, lng: 42.5053 },
  { name: 'تبوك', code: 'TBK', lat: 28.3835, lng: 36.5662 },
  { name: 'حائل', code: 'HIL', lat: 27.5114, lng: 41.4208 },
  { name: 'الحدود الشمالية', code: 'NBD', lat: 30.0617, lng: 41.6939 },
  { name: 'جازان', code: 'JZN', lat: 16.8892, lng: 42.5511 },
  { name: 'نجران', code: 'NJN', lat: 17.4916, lng: 44.1322 },
  { name: 'الباحة', code: 'BHA', lat: 20.0129, lng: 41.4677 },
  { name: 'الجوف', code: 'JOF', lat: 29.7827, lng: 39.6856 },
]

const HIGHWAYS = ['سريع', 'إقليمي', 'ثانوي']
const SURFACE_TYPES = ['أسفلت مرن', 'خرساني', 'أسفلت مدعم']
const ISSUE_TYPES = ['حفر', 'تشققات طولية', 'تصدعات تمساحية', 'هبوط', 'تآكل الحواف', 'صدع انكماشي']
const SEVERITIES = ['منخفضة', 'متوسطة', 'عالية', 'حرجة']
const ISSUE_STATUSES = ['جديد', 'قيد المعالجة', 'تم الحل']
const SENSOR_TYPES = ['اهتزاز', 'حرارة', 'رطوبة', 'مرور']
const SENSOR_STATUSES = ['نشط', 'معطل', 'صيانة']
const INSPECTORS = [
  'م. خالد العتيبي',
  'م. سعد القحطاني',
  'م. فهد الدوسري',
  'م. عبدالله الشمري',
  'م. ناصر الحربي',
  'م. ماجد الغامدي',
  'م. تركي المطيري',
  'م. بدر الزهراني',
]

const ROAD_NAMES = [
  'طريق الرياض-القصيم السريع',
  'طريق مكة-المدينة المنورة السريع',
  'طريق الظهران-الجبيل السريع',
  'طريق الرياض-الدمام السريع',
  'طريق أبها-خميس مشيط',
  'طريق تبوك-الوجه الساحلي',
  'طريق حائل-بريدة',
  'طريق عرعر-رفحاء',
  'طريق جازان-أبو عريش',
  'طريق نجران-شرورة',
  'طريق الباحة-بلجرشي',
  'طريق الجوف-سكاكا',
  'طريق الطائف-الليملي',
  'طريق المدينة-ينبع',
  'طريق الأحساء-الهفوف',
  'طريق بريدة-عنيزة',
  'طريق خميس مشيط-أبها',
  'طريق جدة-رابغ',
  'طريق الرياض-الخرج',
  'طريق الدمام-الأحساء',
  'طريق تبوك-القريات',
  'طريق حائل-المدينة',
  'طريق عسير-تهامة',
  'طريق نجران-أبها',
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function statusFromScore(score: number): string {
  if (score >= 85) return 'ممتاز'
  if (score >= 70) return 'جيد'
  if (score >= 50) return 'متوسط'
  return 'رديء'
}

export async function seedDatabase() {
  const regionCount = await db.region.count()
  if (regionCount > 0) return { seeded: false, message: 'البيانات موجودة مسبقاً' }

  // إنشاء المناطق
  const regions = await Promise.all(
    REGIONS.map((r) =>
      db.region.create({
        data: { name: r.name, code: r.code, lat: r.lat, lng: r.lng },
      })
    )
  )

  // إنشاء المقاطع الطرقية
  const roadSegments = []
  for (let i = 0; i < ROAD_NAMES.length; i++) {
    const region = regions[i % regions.length]
    const score = Math.round(rand(35, 96))
    const highway = pick(HIGHWAYS)
    const daysAgo = Math.floor(rand(1, 90))
    const lastInspection = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)

    const road = await db.roadSegment.create({
      data: {
        name: ROAD_NAMES[i],
        highway,
        regionId: region.id,
        length: Math.round(rand(15, 320) * 10) / 10,
        qualityScore: score,
        status: statusFromScore(score),
        surfaceType: pick(SURFACE_TYPES),
        aadt: Math.floor(rand(5000, 85000)),
        lastInspection,
        lat: region.lat + rand(-1.5, 1.5),
        lng: region.lng + rand(-1.5, 1.5),
      },
    })

    // إنشاء فحوصات لكل مقطع
    const inspectionCount = Math.floor(rand(2, 5))
    for (let j = 0; j < inspectionCount; j++) {
      await db.inspection.create({
        data: {
          roadSegmentId: road.id,
          inspector: pick(INSPECTORS),
          score: Math.round(rand(40, 98)),
          notes: pick([
            'الرصف بحالة جيدة، يحتاج صيانة وقائية',
            'وجود تشققات بسيطة، يُنصح بالمعالجة المبكرة',
            'تدهور ملحوظ في طبقة الأسفلت',
            'تصريف المياه يحتاج تحسين',
            'العلامات الأرضية باهتة',
            'الحواف بحاجة لإصلاح',
          ]),
          date: new Date(Date.now() - rand(1, 180) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // إنشاء مشاكل حسب درجة الجودة
    const issueCount = score < 60 ? Math.floor(rand(3, 8)) : score < 80 ? Math.floor(rand(1, 4)) : Math.floor(rand(0, 2))
    for (let k = 0; k < issueCount; k++) {
      await db.issue.create({
        data: {
          roadSegmentId: road.id,
          type: pick(ISSUE_TYPES),
          severity: pick(SEVERITIES),
          description: pick([
            'تم رصد العيب أثناء الفحص الدوري',
            'بلاغ من مستخدمي الطريق',
            'اكتشاف عبر المستشعرات الذكية',
            'ظهور مفاجئ بعد الأمطار',
            'تدهور تدريجي يستدعي التدخل',
          ]),
          status: pick(ISSUE_STATUSES),
          reportedBy: pick([...INSPECTORS, 'بلاغ مواطن', 'نظام آلي', 'دورية المرور']),
          lat: road.lat + rand(-0.05, 0.05),
          lng: road.lng + rand(-0.05, 0.05),
          createdAt: new Date(Date.now() - rand(1, 60) * 24 * 60 * 60 * 1000),
        },
      })
    }

    // إنشاء مستشعرات
    const sensorCount = Math.floor(rand(2, 5))
    for (let m = 0; m < sensorCount; m++) {
      await db.sensor.create({
        data: {
          roadSegmentId: road.id,
          type: pick(SENSOR_TYPES),
          status: Math.random() > 0.85 ? pick(['معطل', 'صيانة']) : 'نشط',
          lastReading: `${Math.round(rand(10, 95))}`,
          battery: Math.floor(rand(20, 100)),
        },
      })
    }

    roadSegments.push(road)
  }

  return {
    seeded: true,
    regions: regions.length,
    roads: roadSegments.length,
  }
}
