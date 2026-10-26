'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, Siren, MapPin, Clock, Cctv, Building2, ShieldAlert, X,
  ChevronLeft, FileText, Hash, Image as ImageIcon, History, User, Zap, AlertCircle,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useI18n } from "../lib/i18n"
import { SEVERITY_BG, formatRelativeTime, formatNumber } from "../lib/helpers"
import { toast } from "sonner"

interface Incident {
  id: string
  incidentNo: string
  type: string; typeEn: string
  severity: string
  status: string
  description: string; descriptionEn: string
  aiConfidence: number
  autoCreated: boolean
  detectedAt: string
  slaDeadline: string | null
  resolvedAt: string | null
  assignedOperator: string | null
  gpsLat: number | null
  gpsLng: number | null
  camera: { id: string; name: string; nameEn: string; imagePath: string; zone: string; zoneEn: string }
  site: { id: string; name: string; nameEn: string; lat: number; lng: number }
  authority: { id: string; name: string; nameEn: string; categoryEn: string } | null
  evidence: { id: string; type: string; filePath: string; fileName: string; fileHash: string }[]
  _count: { auditLogs: number; notifications: number }
}

interface Stats {
  total: number; detected: number; underReview: number; confirmed: number
  assigned: number; inProgress: number; resolved: number; closed: number
  critical: number; slaBreached: number; autoCreated: number
}

const STATUS_FLOW = ["detected", "under_review", "confirmed", "assigned", "in_progress", "resolved", "closed"]
const STATUS_AR: Record<string, string> = {
  detected: "مكتشف", under_review: "قيد المراجعة", confirmed: "مؤكد",
  assigned: "معيّن", in_progress: "قيد المعالجة", resolved: "تم الحل", closed: "مغلق",
}
const STATUS_EN: Record<string, string> = {
  detected: "Detected", under_review: "Under Review", confirmed: "Confirmed",
  assigned: "Assigned", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
}
const STATUS_BG: Record<string, string> = {
  detected: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
  under_review: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  confirmed: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  assigned: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25",
  in_progress: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  closed: "bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/25",
}

export function IncidentsView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [data, setData] = useState<{ incidents: Incident[]; stats: Stats } | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [selected, setSelected] = useState<Incident | null>(null)
  const [detail, setDetail] = useState<any>(null)
  const [acting, setActing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter !== "all") params.set("status", statusFilter)
    if (severityFilter !== "all") params.set("severity", severityFilter)
    try {
      const res = await fetch(`/api/incidents?${params}`)
      const d = await res.json()
      setData(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [statusFilter, severityFilter])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  const openDetail = async (inc: Incident) => {
    setSelected(inc)
    setDetail(null)
    try {
      const res = await fetch(`/api/incidents/${inc.id}`)
      const d = await res.json()
      setDetail(d)
    } catch (e) { console.error(e) }
  }

  const doAction = async (action: string, payload: any) => {
    if (!selected) return
    setActing(true)
    try {
      const res = await fetch(`/api/incidents/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload, actor: isAr ? "مشغّل" : "operator" }),
      })
      if (res.ok) {
        toast.success(isAr ? "تم التحديث" : "Updated")
        await openDetail(selected)
        load()
      } else {
        const err = await res.json()
        toast.error(err.error || (isAr ? "فشل" : "Failed"))
      }
    } catch { toast.error(isAr ? "خطأ" : "Error") }
    finally { setActing(false) }
  }

  const t = (key: string) => {
    const dict: Record<string, any> = {
      title: isAr ? "إدارة الحوادث" : "Incident Management",
      subtitle: isAr ? "نظام مركزي لإدارة الحوادث الأمنية من الكشف حتى الإغلاق" : "Centralized incident lifecycle management",
      total: isAr ? "إجمالي الحوادث" : "Total Incidents",
      open: isAr ? "مفتوحة" : "Open",
      critical: isAr ? "حرجة" : "Critical",
      slaBreached: isAr ? "متأخرة عن SLA" : "SLA Breached",
      allStatus: isAr ? "كل الحالات" : "All statuses",
      allSeverity: isAr ? "كل الخطورة" : "All severities",
      noResults: isAr ? "لا توجد حوادث" : "No incidents",
      camera: isAr ? "الكاميرا" : "Camera",
      site: isAr ? "الموقع" : "Site",
      detected: isAr ? "وقت الكشف" : "Detected",
      sla: isAr ? "موعد SLA" : "SLA Deadline",
      authority: isAr ? "الجهة" : "Authority",
      operator: isAr ? "المسؤول" : "Operator",
      confidence: isAr ? "ثقة AI" : "AI Confidence",
      evidence: isAr ? "الأدلة" : "Evidence",
      auditLog: isAr ? "سجل الإجراءات" : "Audit Log",
      status: isAr ? "الحالة" : "Status",
      advance: isAr ? "تقديم الحالة" : "Advance Status",
      assign: isAr ? "تعيين" : "Assign",
      assignOperator: isAr ? "اسم المسؤول" : "Operator name",
      noEvidence: isAr ? "لا توجد أدلة محفوظة" : "No evidence saved",
      noAudit: isAr ? "لا توجد إجراءات مسجلة" : "No actions logged",
      autoCreated: isAr ? "إنشاء تلقائي" : "Auto-created",
      viewDetail: isAr ? "عرض التفاصيل" : "View Details",
    }
    return dict[key] || key
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      {data?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{formatNumber(data.stats.total, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("total")}</p>
          </Card>
          <Card className="p-3 text-center bg-cyan-500/5 border-cyan-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-cyan-600 dark:text-cyan-400">{formatNumber(data.stats.detected + data.stats.underReview + data.stats.confirmed + data.stats.assigned + data.stats.inProgress, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("open")}</p>
          </Card>
          <Card className="p-3 text-center bg-red-500/5 border-red-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{formatNumber(data.stats.critical, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("critical")}</p>
          </Card>
          <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{formatNumber(data.stats.slaBreached, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("slaBreached")}</p>
          </Card>
          <Card className="p-3 text-center bg-violet-500/5 border-violet-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-violet-600 dark:text-violet-400">{formatNumber(data.stats.autoCreated, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("autoCreated")}</p>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder={t("allStatus")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allStatus")}</SelectItem>
            {STATUS_FLOW.map((s) => (
              <SelectItem key={s} value={s}>{isAr ? STATUS_AR[s] : STATUS_EN[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("allSeverity")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("allSeverity")}</SelectItem>
            <SelectItem value="critical">{isAr ? "حرجة" : "Critical"}</SelectItem>
            <SelectItem value="high">{isAr ? "عالية" : "High"}</SelectItem>
            <SelectItem value="medium">{isAr ? "متوسطة" : "Medium"}</SelectItem>
            <SelectItem value="low">{isAr ? "منخفضة" : "Low"}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : !data || data.incidents.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t("noResults")}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {data.incidents.map((inc) => {
            const type = isAr ? inc.type : inc.typeEn
            const cam = isAr ? inc.camera.name : inc.camera.nameEn
            const site = isAr ? inc.site.name : inc.site.nameEn
            const slaBreached = inc.slaDeadline && new Date(inc.slaDeadline) < new Date() && !["closed", "resolved"].includes(inc.status)
            return (
              <Card key={inc.id} className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${inc.severity === "critical" && inc.status === "detected" ? "border-red-500/40 alert-pulse" : ""}`} onClick={() => openDetail(inc)}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${inc.severity === "critical" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                      <Siren className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-muted-foreground">{inc.incidentNo}</span>
                        {type}
                      </h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Cctv className="h-3 w-3" />{cam}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <Badge variant="outline" className={`text-[10px] ${SEVERITY_BG[inc.severity as keyof typeof SEVERITY_BG]}`}>
                      {isAr ? ({ critical: "حرجة", high: "عالية", medium: "متوسطة", low: "منخفضة" }[inc.severity] || inc.severity) : inc.severity}
                    </Badge>
                    {inc.autoCreated && (
                      <Badge variant="outline" className="text-[9px] bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-400 gap-0.5">
                        <Zap className="h-2.5 w-2.5" />{isAr ? "تلقائي" : "Auto"}
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{isAr ? inc.description : inc.descriptionEn}</p>
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className={`text-[10px] ${STATUS_BG[inc.status]}`}>{isAr ? STATUS_AR[inc.status] : STATUS_EN[inc.status]}</Badge>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {slaBreached && <span className="text-red-500 font-bold flex items-center gap-0.5"><AlertCircle className="h-2.5 w-2.5" />SLA</span>}
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{site}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{formatRelativeTime(inc.detectedAt, lang)}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal تفاصيل الحادث */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto custom-scroll">
          <DialogTitle className="sr-only">{selected?.incidentNo}</DialogTitle>
          <DialogDescription className="sr-only">{t("viewDetail")}</DialogDescription>
          {selected && (
            <div>
              {/* رأس الحادث */}
              <div className="p-5 border-b gradient-nathra-soft">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-primary">{selected.incidentNo}</span>
                      <Badge variant="outline" className={`text-[10px] ${STATUS_BG[selected.status]}`}>{isAr ? STATUS_AR[selected.status] : STATUS_EN[selected.status]}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${SEVERITY_BG[selected.severity as keyof typeof SEVERITY_BG]}`}>
                        {isAr ? ({ critical: "حرجة", high: "عالية", medium: "متوسطة", low: "منخفضة" }[selected.severity] || selected.severity) : selected.severity}
                      </Badge>
                      {selected.autoCreated && (
                        <Badge variant="outline" className="text-[9px] bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-400 gap-0.5">
                          <Zap className="h-2.5 w-2.5" />{t("autoCreated")}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-bold text-lg">{isAr ? selected.type : selected.typeEn}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{isAr ? selected.description : selected.descriptionEn}</p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className="text-[10px] text-muted-foreground">{t("confidence")}</p>
                    <p className="text-2xl font-extrabold tabular-nums text-primary">{selected.aiConfidence}%</p>
                  </div>
                </div>
              </div>

              {/* صورة الكاميرا */}
              <div className="relative bg-slate-950">
                <img src={selected.camera.imagePath} alt="evidence" className="w-full h-48 object-cover" />
                <div className="absolute top-2 right-2 rounded bg-black/70 px-2 py-1 text-white text-[10px] font-mono">
                  {isAr ? selected.camera.zone : selected.camera.zoneEn}
                </div>
              </div>

              {/* المعلومات */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("camera")}</p>
                    <p className="font-bold text-[11px] truncate">{isAr ? selected.camera.name : selected.camera.nameEn}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("site")}</p>
                    <p className="font-bold text-[11px] truncate">{isAr ? selected.site.name : selected.site.nameEn}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("detected")}</p>
                    <p className="font-bold text-[11px]">{formatRelativeTime(selected.detectedAt, lang)}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("sla")}</p>
                    <p className={`font-bold text-[11px] ${selected.slaDeadline && new Date(selected.slaDeadline) < new Date() && !["closed", "resolved"].includes(selected.status) ? "text-red-500" : ""}`}>
                      {selected.slaDeadline ? formatRelativeTime(selected.slaDeadline, lang) : "—"}
                    </p>
                  </div>
                </div>

                {selected.authority && (
                  <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs">
                    <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-muted-foreground">{t("authority")}:</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">{isAr ? selected.authority.name : selected.authority.nameEn}</span>
                  </div>
                )}

                {/* الإجراءات */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><ShieldAlert className="h-3.5 w-3.5 text-primary" />{t("advance")}</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_FLOW.map((s, idx) => {
                      const currentIdx = STATUS_FLOW.indexOf(selected.status)
                      if (idx <= currentIdx || idx > currentIdx + 1) return null
                      return (
                        <Button key={s} size="sm" disabled={acting} onClick={() => doAction("change_status", { status: s })} className="gap-1.5 h-7 text-[11px] gradient-nathra text-primary-foreground">
                          {acting ? <Loader2 className="h-3 w-3 animate-spin" /> : <ChevronLeft className="h-3 w-3 rotate-180" />}
                          {isAr ? STATUS_AR[s] : STATUS_EN[s]}
                        </Button>
                      )
                    })}
                  </div>

                  {/* تعيين مسؤول */}
                  {selected.status !== "closed" && (
                    <div className="mt-3 flex gap-2">
                      <Input
                        placeholder={t("assignOperator")}
                        defaultValue={selected.assignedOperator || ""}
                        className="h-8 text-xs"
                        id="operator-input"
                      />
                      <Button size="sm" disabled={acting} onClick={() => {
                        const el = document.getElementById("operator-input") as HTMLInputElement
                        doAction("assign", { operator: el.value })
                      }} className="gap-1.5 h-8 text-xs">
                        <User className="h-3 w-3" />{t("assign")}
                      </Button>
                    </div>
                  )}
                </div>

                {/* الأدلة */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5 text-cyan-500" />{t("evidence")} ({detail?.evidence?.length || selected.evidence.length})</p>
                  {selected.evidence.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("noEvidence")}</p>
                  ) : (
                    <div className="space-y-2">
                      {selected.evidence.map((ev) => (
                        <div key={ev.id} className="flex items-center gap-2 rounded-lg border p-2 text-xs">
                          <ImageIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="font-mono text-[10px] truncate flex-1">{ev.fileName}</span>
                          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground"><Hash className="h-2.5 w-2.5" />{ev.fileHash.substring(0, 12)}…</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* سجل الإجراءات */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-violet-500" />{t("auditLog")} ({detail?.auditLogs?.length || 0})</p>
                  {!detail?.auditLogs || detail.auditLogs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">{t("noAudit")}</p>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scroll pr-1">
                      {detail.auditLogs.map((log: any) => (
                        <div key={log.id} className="flex items-start gap-2 text-xs border-l-2 border-primary/30 pl-2 py-1">
                          <div className="flex-1">
                            <p className="font-semibold text-[11px]">{log.action}</p>
                            <p className="text-[10px] text-muted-foreground">{log.actor} · {formatRelativeTime(log.timestamp, lang)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
