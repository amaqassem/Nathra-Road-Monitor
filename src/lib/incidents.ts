import { db } from './db'
import crypto from 'crypto'

// توليد رقم مرجعي للحادث: INC-2026-0001
export async function generateIncidentNo(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.incident.count()
  const num = String(count + 1).padStart(4, '0')
  return `INC-${year}-${num}`
}

// حساب SHA-256 لملف
export function fileHash(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

// تسجيل إجراء في Audit Log
export async function logAudit(params: {
  incidentId?: string
  action: string
  actor: string
  details: string
}) {
  return db.auditLog.create({
    data: {
      incidentId: params.incidentId,
      action: params.action,
      actor: params.actor,
      details: params.details,
    },
  })
}

// إنشاء إشعار in-app
export async function createNotification(params: {
  incidentId?: string
  type: string
  title: string
  message: string
  recipient?: string
  channel?: string
}) {
  return db.notification.create({
    data: {
      incidentId: params.incidentId,
      type: params.type,
      title: params.title,
      message: params.message,
      recipient: params.recipient || 'operators',
      channel: params.channel || 'in_app',
    },
  })
}

// منع تكرار البلاغات: هل يوجد حادث مفتوح لنفس الكاميرا والنوع خلال آخر ساعة؟
export async function findDuplicateIncident(cameraId: string, typeEn: string): Promise<boolean> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const existing = await db.incident.findFirst({
    where: {
      cameraId,
      typeEn,
      status: { notIn: ['closed', 'resolved'] },
      detectedAt: { gte: oneHourAgo },
    },
  })
  return !!existing
}

// إيجاد الجهة المختصة بناءً على قواعد التوجيه
export async function resolveAuthority(
  typeEn: string,
  severity: string,
  siteTypeEn?: string
): Promise<{ id: string; name: string; nameEn: string } | null> {
  // ابحث عن قاعدة توجيه مطابقة (نوع الحادث أولاً، ثم شدته، ثم نوع الموقع)
  const rules = await db.routingRule.findMany({
    where: { active: true },
    include: { authority: true },
    orderBy: { priority: 'desc' },
  })

  // أولوية: تطابق نوع الحادث
  const typeMatch = rules.find(
    (r) => r.conditionType === 'incident_type' && r.conditionValue.toLowerCase() === typeEn.toLowerCase()
  )
  if (typeMatch) {
    return { id: typeMatch.authority.id, name: typeMatch.authority.name, nameEn: typeMatch.authority.nameEn }
  }

  // ثانياً: تطابق نوع الموقع
  if (siteTypeEn) {
    const siteMatch = rules.find(
      (r) => r.conditionType === 'site_type' && r.conditionValue.toLowerCase() === siteTypeEn.toLowerCase()
    )
    if (siteMatch) {
      return { id: siteMatch.authority.id, name: siteMatch.authority.name, nameEn: siteMatch.authority.nameEn }
    }
  }

  // ثالثاً: تطابق الشدة
  const sevMatch = rules.find(
    (r) => r.conditionType === 'severity' && r.conditionValue.toLowerCase() === severity.toLowerCase()
  )
  if (sevMatch) {
    return { id: sevMatch.authority.id, name: sevMatch.authority.name, nameEn: sevMatch.authority.nameEn }
  }

  // fallback: أول جهة داخلية
  const fallback = rules.find((r) => r.authority.categoryEn === 'internal')
  if (fallback) {
    return { id: fallback.authority.id, name: fallback.authority.name, nameEn: fallback.authority.nameEn }
  }
  return null
}

// بيانات الجهات المختصة بالمرور
export const AUTHORITIES_SEED = [
  { ar: "إدارة المرور - العمليات", en: "Traffic Operations Center", category: "داخلي", categoryEn: "internal", contactName: "مركز العمليات المرورية", contactPhone: "0112918888", sandboxMode: true },
  { ar: "الدوريات المرورية", en: "Traffic Patrols", category: "داخلي", categoryEn: "internal", contactName: "قائد الدوريات", contactPhone: "0114777777", sandboxMode: true },
  { ar: "الإسعاف والطوارئ", en: "Emergency Medical Services", category: "خارجي", categoryEn: "external", contactName: "الهلال الأحمر", contactPhone: "998", sandboxMode: true },
  { ar: "الدفاع المدني (إنقاذ حوادث)", en: "Civil Defense (Accident Rescue)", category: "خارجي", categoryEn: "external", contactName: "العمليات", contactPhone: "999", sandboxMode: true },
  { ar: "صيانة الطرق", en: "Road Maintenance Authority", category: "داخلي", categoryEn: "internal", contactName: "إدارة الصيانة", contactPhone: "0114000000", sandboxMode: true },
  { ar: "مركز العمليات الأمني الموحد", en: "Unified Security Operations", category: "داخلي", categoryEn: "internal", contactName: "مشرف العمليات", contactPhone: "1919", sandboxMode: true },
]

export const ROUTING_RULES_SEED = [
  { ar: "حوادث مرورية → الإسعاف والدفاع المدني", en: "Traffic Accidents → EMS & Civil Defense", condType: "incident_type", condValue: "accident", authorityEn: "Emergency Medical Services", priority: 100 },
  { ar: "حوادث مرورية → الدفاع المدني", en: "Accidents → Civil Defense", condType: "incident_type", condValue: "accident", authorityEn: "Civil Defense (Accident Rescue)", priority: 95 },
  { ar: "تجاوز السرعة العالي → الدوريات المرورية", en: "Excessive Speeding → Traffic Patrols", condType: "incident_type", condValue: "excessive_speed", authorityEn: "Traffic Patrols", priority: 90 },
  { ar: "قطع الإشارة → الدوريات المرورية", en: "Red Light → Traffic Patrols", condType: "incident_type", condValue: "red_light", authorityEn: "Traffic Patrols", priority: 85 },
  { ar: "قيادة عكس الاتجاه → الدوريات المرورية", en: "Wrong Way → Traffic Patrols", condType: "incident_type", condValue: "wrong_way", authorityEn: "Traffic Patrols", priority: 85 },
  { ar: "قيادة خاطئة → الدوريات المرورية", en: "Reckless Driving → Traffic Patrols", condType: "incident_type", condValue: "reckless", authorityEn: "Traffic Patrols", priority: 80 },
  { ar: "تجاوز السرعة → إدارة المرور", en: "Speeding → Traffic Operations", condType: "incident_type", condValue: "speeding", authorityEn: "Traffic Operations Center", priority: 75 },
  { ar: "مركبة متوقفة بالخطأ → صيانة الطرق", en: "Illegal Parking → Road Maintenance", condType: "incident_type", condValue: "illegal_parking", authorityEn: "Road Maintenance Authority", priority: 70 },
  { ar: "حالات حرجة → مركز العمليات الموحد", en: "Critical → Unified Ops", condType: "severity", condValue: "critical", authorityEn: "Unified Security Operations", priority: 60 },
]

export const AUTOMATION_RULES_SEED = [
  {
    ar: "تنبيه فوري للحوادث الحرجة", en: "Instant alert for critical incidents",
    desc: "عند اكتشاف حادث حرج، أنشئ إشعاراً فورياً ووجّهه لمركز العمليات",
    conditions: JSON.stringify([{ field: "severity", operator: "eq", value: "critical" }]),
    actions: JSON.stringify([{ action: "notify", params: { recipient: "operations" } }, { action: "route", params: { authority: "Unified Operations Center" } }]),
    priority: 100,
  },
  {
    ar: "حفظ الأدلة تلقائياً", en: "Auto-save evidence",
    desc: "عند تأكيد حادث، احفظ صورة الإطار كدليل مع hash للتحقق",
    conditions: JSON.stringify([{ field: "status", operator: "in", value: ["confirmed", "assigned"] }]),
    actions: JSON.stringify([{ action: "save_evidence", params: { type: "image" } }, { action: "audit_log", params: { action: "evidence_saved" } }]),
    priority: 80,
  },
  {
    ar: "تصعيد الحوادث المتأخرة عن SLA", en: "Escalate SLA-breached incidents",
    desc: "إذا تجاوز الحادث موعد SLA، صدّده للإدارة العليا",
    conditions: JSON.stringify([{ field: "sla_breached", operator: "eq", value: true }]),
    actions: JSON.stringify([{ action: "escalate", params: { level: "management" } }, { action: "notify", params: { recipient: "management" } }]),
    priority: 90,
  },
  {
    ar: "إغلاق تلقائي للحوداث منخفضة الخطورة", en: "Auto-close low-severity resolved",
    desc: "بعد حل الحادث منخفض الخطورة لمدة 24 ساعة، أغلقه تلقائياً",
    conditions: JSON.stringify([{ field: "severity", operator: "eq", value: "low" }, { field: "status", operator: "eq", value: "resolved" }]),
    actions: JSON.stringify([{ action: "change_status", params: { to: "closed" } }]),
    priority: 30,
  },
]

export const AI_MODELS_SEED = [
  { ar: "كشف المركبات YOLOv8", en: "YOLOv8 Vehicle Detection", task: "كشف المركبات", taskEn: "vehicle_detection", version: "v8.2", threshold: 0.72, status: "deployed", experimental: false },
  { ar: "قراءة اللوحات ANPR", en: "ANPR Plate Recognition", task: "قراءة اللوحات", taskEn: "plate_recognition", version: "v4.1", threshold: 0.85, status: "deployed", experimental: false },
  { ar: "قياس السرعة", en: "Speed Measurement", task: "قياس السرعة", taskEn: "speed_measurement", version: "v3.0", threshold: 0.78, status: "deployed", experimental: false },
  { ar: "كشف قطع الإشارة", en: "Red Light Detection", task: "كشف الإشارة", taskEn: "red_light_detection", version: "v2.5", threshold: 0.8, status: "deployed", experimental: false },
  { ar: "كشف الحوادث", en: "Accident Detection", task: "كشف الحوادث", taskEn: "accident_detection", version: "v2.0", threshold: 0.75, status: "deployed", experimental: false },
  { ar: "تتبع المسارات", en: "Lane Tracking", task: "تتبع المسارات", taskEn: "lane_tracking", version: "v3.3", threshold: 0.7, status: "deployed", experimental: false },
  { ar: "كشف القيادة الخاطئة", en: "Reckless Driving Detection", task: "القيادة الخاطئة", taskEn: "reckless_driving", version: "v1.1", threshold: 0.65, status: "staging", experimental: true },
  { ar: "تحليل تدفق المرور", en: "Traffic Flow Analysis", task: "تدفق المرور", taskEn: "traffic_flow", version: "v2.0", threshold: 0.68, status: "staging", experimental: true },
]
