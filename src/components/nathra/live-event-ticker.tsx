'use client'

import { useEffect, useState, useRef } from "react"
import { Radio, Siren, Cctv, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "./lib/i18n"
import { SEVERITY_BG, formatRelativeTime } from "./lib/helpers"

interface LiveEvent {
  id: string
  type: string
  typeEn: string
  severity: string
  status: string
  confidence: number
  camera: string
  cameraEn: string
  site: string
  siteEn: string
  createdAt: string
}

// مولّد أحداث لحظية محاكاة (يضيف حدث جديد كل بضع ثوان)
function generateEvent(idx: number): LiveEvent {
  const types = [
    { ar: "تسلل", en: "Intrusion" },
    { ar: "ازدحام", en: "Crowd" },
    { ar: "سلوك مشبوه", en: "Suspicious Behavior" },
    { ar: "تردد مريب", en: "Loitering" },
    { ar: "تعرف على الوجه", en: "Face Match" },
    { ar: "اختراق محيط", en: "Perimeter Breach" },
  ]
  const cams = ["CAM-001", "CAM-007", "CAM-012", "CAM-019", "CAM-023", "CAM-031", "CAM-038", "CAM-042"]
  const sites = [
    { ar: "مول العرب", en: "Arab Mall" },
    { ar: "مطار الملك خالد", en: "KKIA Airport" },
    { ar: "مشروع نيوم", en: "NEOM Project" },
    { ar: "حي العليا", en: "Olaya District" },
    { ar: "ميناء الملك عبدالله", en: "King Abdullah Port" },
  ]
  const sevs = ["low", "medium", "medium", "high", "high", "critical"]
  const type = types[Math.floor(Math.random() * types.length)]
  const cam = cams[Math.floor(Math.random() * cams.length)]
  const site = sites[Math.floor(Math.random() * sites.length)]
  return {
    id: `live-${Date.now()}-${idx}`,
    type: type.ar,
    typeEn: type.en,
    severity: sevs[Math.floor(Math.random() * sevs.length)],
    status: "active",
    confidence: 80 + Math.floor(Math.random() * 18),
    camera: cam,
    cameraEn: cam,
    site: site.ar,
    siteEn: site.en,
    createdAt: new Date().toISOString(),
  }
}

export function LiveEventTicker() {
  const { t, lang } = useI18n()
  const [events, setEvents] = useState<LiveEvent[]>([])
  const [newCount, setNewCount] = useState(0)
  const idxRef = useRef(0)
  const isAr = lang === "ar"

  // جلب تنبيهات موجودة أول مرة
  useEffect(() => {
    fetch("/api/alerts?status=active")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setEvents(
            data.slice(0, 6).map((a: any) => ({
              id: a.id,
              type: a.type,
              typeEn: a.typeEn,
              severity: a.severity,
              status: a.status,
              confidence: a.confidence,
              camera: a.camera?.name || a.camera,
              cameraEn: a.camera?.nameEn || a.camera,
              site: a.site?.name || a.site,
              siteEn: a.site?.nameEn || a.site,
              createdAt: a.createdAt,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  // إضافة أحداث لحظية محاكاة كل 6-12 ثانية
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const schedule = () => {
      const delay = 6000 + Math.random() * 6000
      timer = setTimeout(() => {
        idxRef.current += 1
        const ev = generateEvent(idxRef.current)
        setEvents((prev) => [ev, ...prev].slice(0, 6))
        setNewCount((c) => c + 1)
        schedule()
      }, delay)
    }
    schedule()
    return () => clearTimeout(timer)
  }, [])

  return (
    <Card className="p-0 overflow-hidden border-primary/20">
      <div className="flex items-center justify-between bg-primary/5 px-4 py-2 border-b border-primary/15">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Radio className="h-4 w-4 text-primary" />
            <span className="absolute -top-1 -right-1 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
          </div>
          <h3 className="font-bold text-sm">{isAr ? "البث اللحظي للأحداث" : "Live Event Feed"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
            +{newCount} {isAr ? "جديد" : "new"}
          </Badge>
          <span className="text-[10px] text-muted-foreground hidden sm:inline">
            {isAr ? "تحديث تلقائي" : "auto-refresh"}
          </span>
        </div>
      </div>

      {/* الشريط المتحرك */}
      <div className="max-h-[120px] overflow-y-auto custom-scroll">
        {events.length === 0 ? (
          <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
            {isAr ? "في انتظار الأحداث..." : "Waiting for events..."}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {events.map((ev, i) => {
              const type = isAr ? ev.type : ev.typeEn
              const cam = isAr ? ev.camera : ev.cameraEn
              const site = isAr ? ev.site : ev.siteEn
              const isNew = i === 0 && ev.id.startsWith("live-")
              return (
                <div
                  key={ev.id}
                  className={`flex items-center gap-3 px-4 py-2 hover:bg-accent/30 transition-colors ${isNew ? "animate-fade-up bg-primary/5" : ""}`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                    ev.severity === "critical" ? "bg-red-500/15 text-red-600 dark:text-red-400"
                    : ev.severity === "high" ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  }`}>
                    {ev.severity === "critical" ? <Siren className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold truncate">{type}</span>
                      <span className="flex h-4 items-center rounded bg-primary/10 px-1 text-[9px] font-bold text-primary tabular-nums">{ev.confidence}%</span>
                      {isNew && (
                        <Badge variant="outline" className="text-[9px] bg-cyan-500/10 border-cyan-500/25 text-cyan-700 dark:text-cyan-400 px-1 py-0">
                          {isAr ? "جديد" : "NEW"}
                        </Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      <Cctv className="h-2.5 w-2.5" />{cam} · {site}
                    </p>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                    {formatRelativeTime(ev.createdAt, lang)}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
