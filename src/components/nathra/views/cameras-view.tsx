'use client'

import { useEffect, useState, useCallback } from "react"
import { Loader2, Search, Cctv, MapPin, Filter, Maximize2, X, Radio, Camera, Eye, ScanLine, BrainCircuit, Building2, CheckCircle2, AlertTriangle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { useI18n } from "../lib/i18n"
import { LiveCameraFeed } from "../live-camera-feed"
import {
  CAMERA_STATUS_BG, CAMERA_STATUS_DOT, SEVERITY_BG, formatRelativeTime, formatNumber,
} from "../lib/helpers"
import { toast } from "sonner"

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
  imagePath: string
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
  const [selected, setSelected] = useState<Camera | null>(null)
  const [scanning, setScanning] = useState(false)
  const [scanResult, setScanResult] = useState<any>(null)
  const isAr = lang === "ar"

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

  const handleScan = async (cameraId: string) => {
    setScanning(true)
    setScanResult(null)
    try {
      const res = await fetch("/api/auto-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cameraId }),
      })
      const data = await res.json()
      setScanResult(data)
      if (data.alertCreated) {
        toast.success(isAr ? "تم اكتشاف مخالفة وفتح بلاغ تلقائياً" : "Violation detected — alert auto-created")
      } else if (data.success) {
        toast.success(isAr ? "تم الفحص — لا توجد مخالفات" : "Scanned — no violations")
      }
    } catch {
      toast.error(isAr ? "فشل الفحص" : "Scan failed")
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{t("cam.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("cam.subtitle")}</p>
        </div>
        {cameras && (
          <Badge variant="outline" className="gap-1.5 bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            {formatNumber(cameras.filter(c => c.status === "online").length, lang)} / {formatNumber(cameras.length, lang)} {isAr ? "بث حي" : "live"}
          </Badge>
        )}
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
              <Card key={cam.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group" onClick={() => { setSelected(cam); setScanResult(null) }}>
                <div className="relative">
                  <LiveCameraFeed
                    cameraId={cam.id}
                    imagePath={cam.imagePath}
                    zone={isAr ? cam.zone : cam.zoneEn}
                    status={cam.status}
                    resolution={cam.resolution}
                    fps={cam.fps}
                    width={320}
                    height={180}
                  />
                  {/* overlay عند المرور */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex items-center gap-1.5 rounded-lg bg-white/20 backdrop-blur-sm px-3 py-1.5 text-white text-xs font-semibold">
                      <Maximize2 className="h-3.5 w-3.5" />{t("cam.viewLive")}
                    </div>
                  </div>
                </div>

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
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: CAMERA_STATUS_DOT[cam.status as keyof typeof CAMERA_STATUS_DOT] }} />
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
                        <Radio className="h-2.5 w-2.5" />{formatRelativeTime(cam.lastEventAt, lang)}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Modal البث الكبير */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          <DialogTitle className="sr-only">{selected ? (isAr ? selected.name : selected.nameEn) : ""}</DialogTitle>
          <DialogDescription className="sr-only">{t("cam.stream")}</DialogDescription>
          {selected && (
            <div>
              {/* البث الكبير */}
              <div className="relative bg-slate-950">
                <LiveCameraFeed
                  cameraId={selected.id}
                  imagePath={selected.imagePath}
                  zone={isAr ? selected.zone : selected.zoneEn}
                  status={selected.status}
                  resolution={selected.resolution}
                  fps={selected.fps}
                  width={800}
                  height={450}
                />
              </div>

              {/* تفاصيل */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Cctv className="h-5 w-5 text-primary" />
                      {isAr ? selected.name : selected.nameEn}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {isAr ? selected.site.name : selected.site.nameEn} · {isAr ? selected.zone : selected.zoneEn}
                    </p>
                  </div>
                  <Badge variant="outline" className={`text-xs ${CAMERA_STATUS_BG[selected.status as keyof typeof CAMERA_STATUS_BG]}`}>
                    {t(`status.${selected.status}` as never)}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("cam.resolution")}</p>
                    <p className="text-sm font-bold">{selected.resolution}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("cam.fps")}</p>
                    <p className="text-sm font-bold">{selected.fps} fps</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("cam.model")}</p>
                    <p className="text-xs font-bold truncate">{isAr ? selected.model : selected.modelEn}</p>
                  </div>
                  <div className="rounded-lg border p-2.5">
                    <p className="text-[10px] text-muted-foreground mb-0.5">{t("cam.events24")}</p>
                    <p className="text-sm font-bold text-primary">{selected.events24h}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    size="sm"
                    disabled={scanning || selected.status !== "online"}
                    onClick={() => handleScan(selected.id)}
                    className="gap-1.5 gradient-nathra text-primary-foreground"
                  >
                    {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ScanLine className="h-3.5 w-3.5" />}
                    {scanning ? (isAr ? "جارٍ الفحص..." : "Scanning...") : (isAr ? "فحص الآن" : "Scan Now")}
                  </Button>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Camera className="h-3.5 w-3.5" />{isAr ? "لقطة" : "Snapshot"}
                  </Button>
                  <div className="mr-auto text-[11px] text-muted-foreground flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                    </span>
                    {isAr ? "بث مباشر" : "Live streaming"}
                  </div>
                </div>

                {/* نتيجة الفحص التلقائي */}
                {scanResult && scanResult.success && (
                  <div className={`rounded-lg border p-3 ${scanResult.alertCreated ? "border-red-500/30 bg-red-500/5" : "border-emerald-500/30 bg-emerald-500/5"}`}>
                    <div className="flex items-center gap-2 mb-2">
                      {scanResult.alertCreated ? (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                      <span className="text-sm font-bold">
                        {scanResult.alertCreated
                          ? (isAr ? "تم اكتشاف مخالفة" : "Violation Detected")
                          : (isAr ? "لا توجد مخالفات" : "No Violations")}
                      </span>
                      <Badge variant="outline" className="text-[10px] ml-auto bg-primary/10 border-primary/25 text-primary">
                        <BrainCircuit className="h-2.5 w-2.5 ml-1" />
                        {scanResult.analysis?.riskLevel || "—"}
                      </Badge>
                    </div>
                    {scanResult.analysis?.summary && (
                      <p className="text-xs text-muted-foreground mb-2">{scanResult.analysis.summary}</p>
                    )}
                    {scanResult.alertCreated && scanResult.alert && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{isAr ? "النوع:" : "Type:"}</span>
                          <span className="font-semibold">{isAr ? scanResult.alert.type : scanResult.alert.typeEn}</span>
                          <Badge variant="outline" className={`text-[9px] mr-auto ${SEVERITY_BG[scanResult.alert.severity as keyof typeof SEVERITY_BG]}`}>
                            {t(`status.${scanResult.alert.severity}` as never)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">{isAr ? "الثقة:" : "Confidence:"}</span>
                          <span className="font-bold tabular-nums">{scanResult.alert.confidence}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1.5">
                          <Building2 className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-muted-foreground">{isAr ? "الجهة المختصة:" : "Authority:"}</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400">{isAr ? scanResult.alert.authority : scanResult.alert.authorityEn}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
