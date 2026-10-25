'use client'

import { useEffect, useState } from "react"
import { Loader2, FileImage, Video, Hash, ShieldCheck, Download, Eye, History } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "../lib/i18n"
import { formatRelativeTime, formatNumber } from "../lib/helpers"
import { toast } from "sonner"

interface Evidence {
  id: string
  type: string
  filePath: string
  fileName: string
  fileSize: number
  fileHash: string
  capturedAt: string
  accessLogs: string | null
  incident: { id: string; incidentNo: string; type: string; typeEn: string; severity: string; site: { name: string; nameEn: string } }
}

export function EvidenceView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [data, setData] = useState<{ evidence: Evidence[]; stats: any } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/evidence").then((r) => r.json()).then(setData).catch(console.error).finally(() => setLoading(false))
  }, [])

  const recordAccess = async (id: string, action: "view" | "download" | "verify") => {
    try {
      const res = await fetch(`/api/evidence/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actor: isAr ? "مشغّل" : "operator", action }),
      })
      if (res.ok) {
        const d = await res.json()
        toast.success(isAr ? `تم تسجيل ${action === "view" ? "العرض" : action === "download" ? "التنزيل" : "التحقق"}` : `Access logged: ${action}`)
      }
    } catch { toast.error(isAr ? "خطأ" : "Error") }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!data) return null

  const t = (k: string) => (isAr ? ({
    title: "مستودع الأدلة الآمن", subtitle: "حفظ الأدلة مع Hash للتحقق وسلسلة العهدة",
    total: "إجمالي الأدلة", images: "صور", videos: "فيديو", totalSize: "الحجم الكلي",
    incident: "الحادث", hash: "بصمة SHA-256", chainOfCustody: "سلسلة العهدة",
    verify: "تحقق", view: "عرض", download: "تنزيل", noResults: "لا توجد أدلة",
  } as any)[k] : ({
    title: "Secure Evidence Vault", subtitle: "Evidence storage with hash verification & chain of custody",
    total: "Total Evidence", images: "Images", videos: "Videos", totalSize: "Total Size",
    incident: "Incident", hash: "SHA-256 Hash", chainOfCustody: "Chain of Custody",
    verify: "Verify", view: "View", download: "Download", noResults: "No evidence",
  } as any)[k])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3 text-center"><p className="text-2xl font-extrabold tabular-nums">{formatNumber(data.stats.total, lang)}</p><p className="text-[11px] text-muted-foreground">{t("total")}</p></Card>
        <Card className="p-3 text-center bg-cyan-500/5 border-cyan-500/20"><p className="text-2xl font-extrabold tabular-nums text-cyan-600 dark:text-cyan-400">{formatNumber(data.stats.images, lang)}</p><p className="text-[11px] text-muted-foreground">{t("images")}</p></Card>
        <Card className="p-3 text-center bg-violet-500/5 border-violet-500/20"><p className="text-2xl font-extrabold tabular-nums text-violet-600 dark:text-violet-400">{formatNumber(data.stats.videos, lang)}</p><p className="text-[11px] text-muted-foreground">{t("videos")}</p></Card>
        <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20"><p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{(data.stats.totalSize / 1024 / 1024).toFixed(1)} MB</p><p className="text-[11px] text-muted-foreground">{t("totalSize")}</p></Card>
      </div>

      {data.evidence.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t("noResults")}</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.evidence.map((ev) => {
            const incType = isAr ? ev.incident.type : ev.incident.typeEn
            const site = isAr ? ev.incident.site.name : ev.incident.site.nameEn
            const accessLogs = ev.accessLogs ? JSON.parse(ev.accessLogs) : []
            return (
              <Card key={ev.id} className="overflow-hidden">
                <div className="relative aspect-video bg-slate-950">
                  <img src={ev.filePath} alt={ev.fileName} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-white text-[9px] font-mono">
                    {ev.type === "image" ? <FileImage className="h-3 w-3 inline" /> : <Video className="h-3 w-3 inline" />} {ev.type.toUpperCase()}
                  </div>
                  <div className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-white text-[9px] font-mono">
                    {formatRelativeTime(ev.capturedAt, lang)}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-[10px] font-bold text-primary">{ev.incident.incidentNo}</span>
                    <Badge variant="outline" className={`text-[9px] ${ev.incident.severity === "critical" ? "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25" : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25"}`}>
                      {ev.incident.severity}
                    </Badge>
                  </div>
                  <p className="text-xs font-semibold truncate mb-1">{incType}</p>
                  <p className="text-[10px] text-muted-foreground truncate mb-2">{site}</p>
                  <div className="flex items-center gap-1 text-[9px] text-muted-foreground mb-2 bg-muted/50 rounded px-1.5 py-1">
                    <Hash className="h-2.5 w-2.5 shrink-0" />
                    <span className="font-mono truncate">{ev.fileHash.substring(0, 24)}…</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
                    <History className="h-2.5 w-2.5" />
                    <span>{accessLogs.length} {isAr ? "وصول" : "accesses"}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-[10px] flex-1" onClick={() => recordAccess(ev.id, "view")}>
                      <Eye className="h-3 w-3" />{t("view")}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-[10px] flex-1" onClick={() => recordAccess(ev.id, "verify")}>
                      <ShieldCheck className="h-3 w-3" />{t("verify")}
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1 h-7 text-[10px] flex-1" onClick={() => recordAccess(ev.id, "download")}>
                      <Download className="h-3 w-3" />{t("download")}
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
