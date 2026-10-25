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

// بيانات الجهات الافتراضية
export const AUTHORITIES_SEED = [
  { ar: "الأمن الخاص - العمليات", en: "Private Security - Operations", category: "داخلي", categoryEn: "internal", contactName: "مركز العمليات", contactPhone: "940", sandboxMode: true },
  { ar: "السلامة المهنية", en: "Occupational Safety Dept", category: "داخلي", categoryEn: "internal", contactName: "مدير السلامة", contactPhone: "1001", sandboxMode: true },
  { ar: "إدارة الحشود الميدانية", en: "Field Crowd Management", category: "داخلي", categoryEn: "internal", contactName: "قائد الحشود", contactPhone: "1002", sandboxMode: true },
  { ar: "فريق الطوارئ الطبية", en: "Medical Emergency Team", category: "داخلي", categoryEn: "internal", contactName: "الإسعاف", contactPhone: "937", sandboxMode: true },
  { ar: "الدفاع المدني (تكامل خارجي)", en: "Civil Defense (External)", category: "خارجي", categoryEn: "external", contactName: "العمليات", contactPhone: "999", sandboxMode: true },
  { ar: "مركز العمليات الموحد", en: "Unified Operations Center", category: "داخلي", categoryEn: "internal", contactName: "مشرف العمليات", contactPhone: "1919", sandboxMode: true },
]

export const ROUTING_RULES_SEED = [
  { ar: "تسليقات وحرائق → الدفاع المدني", en: "Intrusion & Fire → Civil Defense", condType: "incident_type", condValue: "fire", authorityEn: "Civil Defense (External)", priority: 100 },
  { ar: "مخالفات السلامة → قسم السلامة", en: "Safety Violations → Safety Dept", condType: "incident_type", condValue: "safety", authorityEn: "Occupational Safety Dept", priority: 90 },
  { ar: "سقوط → الطوارئ الطبية", en: "Fall → Medical Team", condType: "incident_type", condValue: "fall", authorityEn: "Medical Emergency Team", priority: 90 },
  { ar: "تسلل → الأمن الخاص", en: "Intrusion → Private Security", condType: "incident_type", condValue: "intrusion", authorityEn: "Private Security - Operations", priority: 85 },
  { ar: "اختراق محيط → الأمن الخاص", en: "Perimeter → Private Security", condType: "incident_type", condValue: "perimeter", authorityEn: "Private Security - Operations", priority: 85 },
  { ar: "شجار → الأمن الخاص", en: "Fight → Private Security", condType: "incident_type", condValue: "fight", authorityEn: "Private Security - Operations", priority: 80 },
  { ar: "ازدحام → إدارة الحشود", en: "Crowd → Crowd Management", condType: "incident_type", condValue: "crowd", authorityEn: "Field Crowd Management", priority: 75 },
  { ar: "مواقع صناعية → السلامة المهنية", en: "Industrial Sites → Safety", condType: "site_type", condValue: "Industrial", authorityEn: "Occupational Safety Dept", priority: 60 },
  { ar: "حرجة → مركز العمليات الموحد", en: "Critical → Unified Ops", condType: "severity", condValue: "critical", authorityEn: "Unified Operations Center", priority: 50 },
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
  { ar: "كشف الأشخاص YOLOv8", en: "YOLOv8 Person Detection", task: "كشف الأشخاص", taskEn: "person_detection", version: "v8.2", threshold: 0.65, status: "deployed", experimental: false },
  { ar: "كشف الحريق والدخان", en: "Fire & Smoke Detection", task: "كشف الحريق", taskEn: "fire_detection", version: "v3.1", threshold: 0.7, status: "deployed", experimental: false },
  { ar: "كشف السقوط", en: "Fall Detection", task: "كشف السقوط", taskEn: "fall_detection", version: "v2.0", threshold: 0.75, status: "deployed", experimental: false },
  { ar: "تحليل كثافة الحشود", en: "Crowd Density Analysis", task: "تحليل الحشود", taskEn: "crowd_density", version: "v1.5", threshold: 0.6, status: "deployed", experimental: false },
  { ar: "كشف PPE (معدات السلامة)", en: "PPE Detection", task: "كشف معدات السلامة", taskEn: "ppe_detection", version: "v2.3", threshold: 0.68, status: "deployed", experimental: false },
  { ar: "كشف المركبات", en: "Vehicle Detection", task: "كشف المركبات", taskEn: "vehicle_detection", version: "v6.0", threshold: 0.7, status: "deployed", experimental: false },
  { ar: "كشف الأشياء المهجورة", en: "Abandoned Object Detection", task: "الأشياء المهجورة", taskEn: "abandoned_object", version: "v0.9", threshold: 0.6, status: "staging", experimental: true },
  { ar: "تحليل المشاعر", en: "Emotion Analysis", task: "تحليل المشاعر", taskEn: "emotion_analysis", version: "v1.2", threshold: 0.55, status: "staging", experimental: true },
]
