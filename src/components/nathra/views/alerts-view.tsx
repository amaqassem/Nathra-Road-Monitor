'use client'

import { useEffect, useState, useCallback } from "react"
import { Loader2, Siren, MapPin, Clock, Cctv, Check, CheckCheck, Building2, Zap } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useI18n } from "../lib/i18n"
import { SEVERITY_BG, ALERT_STATUS_BG, formatRelativeTime, formatNumber } from "../lib/helpers"
import { toast } from "sonner"

interface Alert {
  id: string
  type: string; typeEn: string
  severity: string
  status: string
  description: string; descriptionEn: string
  confidence: number
  authority?: string | null
  authorityEn?: string | null
  autoProcessed?: boolean
  createdAt: string
  camera: { name: string; nameEn: string }
  site: { name: string; nameEn: string }
}

export function AlertsView() {
  const { t, lang } = useI18n()
  const [alerts, setAlerts] = useState<Alert[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)
  const [status, setStatus] = useState("all")
  const [severity, setSeverity] = useState("all")
  const isAr = lang === "ar"

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== "all") params.set("status", status)
    if (severity !== "all") params.set("severity", severity)
    try {
      const res = await fetch(`/api/alerts?${params}`)
      const data = await res.json()
      setAlerts(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [status, severity])

  useEffect(() => {
    const tmr = setTimeout(load, 200)
    return () => clearTimeout(tmr)
  }, [load])

  // إجراء على تنبيه (استلام/حل)
  const handleAction = async (alertId: string, action: "acknowledge" | "resolve") => {
    setActing(alertId)
    try {
      const res = await fetch(`/api/alerts/${alertId}/action`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        // تحديث محلي فوري
        setAlerts((prev) => prev?.map((a) =>
          a.id === alertId
            ? { ...a, status: action === "acknowledge" ? "acknowledged" : "resolved" }
            : a
        ) || null)
        toast.success(
          action === "acknowledge"
            ? (isAr ? "تم استلام التنبيه" : "Alert acknowledged")
            : (isAr ? "تم حل التنبيه" : "Alert resolved")
        )
      } else {
        toast.error(isAr ? "فشل التحديث" : "Update failed")
      }
    } catch {
      toast.error(isAr ? "خطأ" : "Error")
    } finally {
      setActing(null)
    }
  }

  const counts = alerts ? {
    total: alerts.length,
    active: alerts.filter((a) => a.status === "active").length,
    acknowledged: alerts.filter((a) => a.status === "acknowledged").length,
    resolved: alerts.filter((a) => a.status === "resolved").length,
    critical: alerts.filter((a) => a.severity === "critical").length,
  } : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{t("alerts.title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("alerts.subtitle")}</p>
      </div>

      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{formatNumber(counts.total, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("alerts.total")}</p>
          </Card>
          <Card className="p-3 text-center bg-red-500/5 border-red-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{formatNumber(counts.active, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("status.active")}</p>
          </Card>
          <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{formatNumber(counts.acknowledged, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("status.acknowledged")}</p>
          </Card>
          <Card className="p-3 text-center bg-emerald-500/5 border-emerald-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{formatNumber(counts.resolved, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("status.resolved")}</p>
          </Card>
          <Card className="p-3 text-center bg-red-500/5 border-red-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{formatNumber(counts.critical, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{t("alerts.critical")}</p>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("alerts.allStatus")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("alerts.allStatus")}</SelectItem>
            <SelectItem value="active">{t("status.active")}</SelectItem>
            <SelectItem value="acknowledged">{t("status.acknowledged")}</SelectItem>
            <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40"><SelectValue placeholder={t("alerts.allSeverity")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("alerts.allSeverity")}</SelectItem>
            <SelectItem value="critical">{t("status.critical")}</SelectItem>
            <SelectItem value="high">{t("status.high")}</SelectItem>
            <SelectItem value="medium">{t("status.medium")}</SelectItem>
            <SelectItem value="low">{t("status.low")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : alerts && alerts.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t("alerts.noResults")}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {alerts?.map((a) => {
            const type = isAr ? a.type : a.typeEn
            const cam = isAr ? a.camera.name : a.camera.nameEn
            const site = isAr ? a.site.name : a.site.nameEn
            const desc = isAr ? a.description : a.descriptionEn
            const isCriticalActive = a.severity === "critical" && a.status === "active"
            const isActing = acting === a.id
            return (
              <Card key={a.id} className={`p-4 transition-shadow ${isCriticalActive ? "border-red-500/40 alert-pulse" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.severity === "critical" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                      <Siren className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm flex items-center gap-1.5">
                        {type}
                        <span className="flex h-5 items-center rounded bg-primary/10 px-1.5 text-[9px] font-bold text-primary tabular-nums">{a.confidence}%</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Cctv className="h-3 w-3" />{cam}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${SEVERITY_BG[a.severity as keyof typeof SEVERITY_BG]}`}>
                    {t(`status.${a.severity}` as never)}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{desc}</p>

                {/* شارة المعالجة التلقائية + الجهة المختصة */}
                {(a.autoProcessed || a.authority) && (
                  <div className="flex items-center gap-1.5 flex-wrap mb-2">
                    {a.autoProcessed && (
                      <Badge variant="outline" className="text-[9px] bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-400 gap-0.5">
                        <Zap className="h-2.5 w-2.5" />
                        {isAr ? "معالج تلقائياً" : "Auto-processed"}
                      </Badge>
                    )}
                    {a.authority && (
                      <Badge variant="outline" className="text-[9px] bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400 gap-0.5">
                        <Building2 className="h-2.5 w-2.5" />
                        {isAr ? a.authority : a.authorityEn}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-[10px] ${ALERT_STATUS_BG[a.status as keyof typeof ALERT_STATUS_BG]}`}>
                      {t(`status.${a.status}` as never)}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{site}
                    </span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{formatRelativeTime(a.createdAt, lang)}
                    </span>
                  </div>
                </div>

                {/* أزرار الإجراءات */}
                {a.status === "active" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isActing}
                      onClick={() => handleAction(a.id, "acknowledge")}
                      className="gap-1.5 h-7 text-[11px] w-full"
                    >
                      {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                      {isAr ? "استلام" : "Acknowledge"}
                    </Button>
                    <Button
                      size="sm"
                      disabled={isActing}
                      onClick={() => handleAction(a.id, "resolve")}
                      className="gap-1.5 h-7 text-[11px] w-full gradient-nathra text-primary-foreground"
                    >
                      {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                      {isAr ? "حل" : "Resolve"}
                    </Button>
                  </div>
                )}
                {a.status === "acknowledged" && (
                  <div className="flex gap-2 mt-3 pt-3 border-t">
                    <Button
                      size="sm"
                      disabled={isActing}
                      onClick={() => handleAction(a.id, "resolve")}
                      className="gap-1.5 h-7 text-[11px] w-full gradient-nathra text-primary-foreground"
                    >
                      {isActing ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCheck className="h-3 w-3" />}
                      {isAr ? "تم الحل" : "Mark Resolved"}
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
