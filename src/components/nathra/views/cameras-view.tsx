'use client'

import { useEffect, useState, useCallback } from "react"
import { Loader2, Search, Cctv, MapPin, Video, Zap, Clock, Filter, Radio } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useI18n } from "../lib/i18n"
import {
  CAMERA_STATUS_BG, CAMERA_STATUS_DOT, formatRelativeTime, formatNumber,
} from "../lib/helpers"

interface Camera {
  id: string
  name: string
  nameEn: string
  status: string
  resolution: string
  fps: number
  model: string
  modelEn: string
  zone: string
  zoneEn: string
  events24h: number
  lastEventAt: string | null
  site: { id: string; name: string; nameEn: string; city: string; cityEn: string }
}

export function CamerasView() {
  const { t, lang } = useI18n()
  const [cameras, setCameras] = useState<Camera[] | null>(null)
  const [sites, setSites] = useState<{ id: string; name: string; nameEn: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")
  const [site, setSite] = useState("all")
  const [query, setQuery] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== "all") params.set("status", status)
    if (site !== "all") params.set("site", site)
    if (query) params.set("q", query)
    try {
      const res = await fetch(`/api/cameras?${params}`)
      const data = await res.json()
      setCameras(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [status, site, query])

  useEffect(() => {
    const tmr = setTimeout(load, 250)
    return () => clearTimeout(tmr)
  }, [load])

  useEffect(() => {
    fetch("/api/sites").then((r) => r.json()).then((d) => setSites(d)).catch(console.error)
  }, [])

  const isAr = lang === "ar"

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{t("cam.title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("cam.subtitle")}</p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("cam.search")} value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder={t("cam.allStatus")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cam.allStatus")}</SelectItem>
              <SelectItem value="online">{t("status.online")}</SelectItem>
              <SelectItem value="offline">{t("status.offline")}</SelectItem>
              <SelectItem value="maintenance">{t("status.maintenance")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={site} onValueChange={setSite}>
            <SelectTrigger className="w-full md:w-52"><SelectValue placeholder={t("cam.allSites")} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("cam.allSites")}</SelectItem>
              {sites.map((s) => (
                <SelectItem key={s.id} value={s.id}>{isAr ? s.name : s.nameEn}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cameras && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap px-2">
              <Filter className="h-3.5 w-3.5" />{formatNumber(cameras.length, lang)} {t("cam.results")}
            </div>
          )}
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : cameras && cameras.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{t("cam.noResults")}</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {cameras?.map((cam) => {
            const isOnline = cam.status === "online"
            return (
              <Card key={cam.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* منطقة البث المحاكاة */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden grid-bg">
                  {isOnline ? (
                    <>
                      {/* محاكاة بث — خلفية بتدرج */}
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950" />
                      {/* خط المسح */}
                      <div className="absolute inset-x-0 h-12 bg-gradient-to-b from-cyan-400/20 to-transparent scan-line" />
                      {/* شبكة كاميرا */}
                      <div className="absolute inset-0 opacity-20"
                        style={{ backgroundImage: "linear-gradient(cyan 1px, transparent 1px), linear-gradient(90deg, cyan 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
                      {/* معلومات البث */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-md bg-black/50 backdrop-blur-sm px-2 py-1 text-white text-[10px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 rec-blink" />
                        <span className="font-bold">LIVE</span>
                      </div>
                      <div className="absolute top-2 left-2 rounded-md bg-black/50 backdrop-blur-sm px-2 py-1 text-white text-[10px] font-mono">
                        {cam.resolution} · {cam.fps}fps
                      </div>
                      <div className="absolute bottom-2 right-2 left-2 flex items-center justify-between">
                        <span className="rounded-md bg-black/50 backdrop-blur-sm px-2 py-1 text-white text-[10px] font-mono">
                          {isAr ? cam.zone : cam.zoneEn}
                        </span>
                        <Radio className="h-3.5 w-3.5 text-cyan-400" />
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                      <Video className="h-8 w-8 opacity-40" />
                      <span className="text-[10px]">{t("cam.noStream")}</span>
                    </div>
                  )}
                </div>

                {/* تفاصيل الكاميرا */}
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold flex items-center gap-1.5">
                        <Cctv className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{isAr ? cam.name : cam.nameEn}</span>
                      </h3>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin className="h-2.5 w-2.5" />
                        <span className="truncate">{isAr ? cam.site.name : cam.site.nameEn}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CAMERA_STATUS_DOT[cam.status as keyof typeof CAMERA_STATUS_DOT] }} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 text-[11px] mb-2">
                    <div className="rounded bg-muted/50 px-2 py-1">
                      <span className="text-muted-foreground block text-[9px]">{t("cam.model")}</span>
                      <span className="font-semibold truncate text-[10px]">{isAr ? cam.model : cam.modelEn}</span>
                    </div>
                    <div className="rounded bg-muted/50 px-2 py-1">
                      <span className="text-muted-foreground block text-[9px]">{t("cam.events24")}</span>
                      <span className="font-bold text-primary">{cam.events24h}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className={`text-[10px] ${CAMERA_STATUS_BG[cam.status as keyof typeof CAMERA_STATUS_BG]}`}>
                      {t(`status.${cam.status}` as never)}
                    </Badge>
                    {cam.lastEventAt && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />{formatRelativeTime(cam.lastEventAt, lang)}
                      </span>
                    )}
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
