'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, Plus, Cctv, Radio, AlertTriangle, ShieldCheck, Lock, Key, Film,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { useI18n } from "../lib/i18n"
import { CAMERA_STATUS_BG, formatNumber } from "../lib/helpers"
import { toast } from "sonner"

interface CameraRow {
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
  streamType: string
  isLive: boolean
  events24h: number
  lastEventAt: string | null
  site: { id: string; name: string; nameEn: string }
}

interface Site {
  id: string
  name: string
  nameEn: string
}

const STREAM_TYPE_BG: Record<string, string> = {
  rtsp: "bg-violet-500/15 text-violet-700 dark:text-violet-400 border-violet-500/25",
  onvif: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  hls: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
  webrtc: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  demo: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
}

export function CameraManagementView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [cameras, setCameras] = useState<CameraRow[] | null>(null)
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // form state
  const [fName, setFName] = useState("")
  const [fNameEn, setFNameEn] = useState("")
  const [fSite, setFSite] = useState("")
  const [fZone, setFZone] = useState("")
  const [fResolution, setFResolution] = useState("1080p")
  const [fFps, setFFps] = useState("25")
  const [fStreamType, setFStreamType] = useState("demo")
  const [fStreamUrl, setFStreamUrl] = useState("")
  const [fCredentials, setFCredentials] = useState("")
  const [fModel, setFModel] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/cameras/manage")
      const d = await res.json()
      setCameras(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    fetch("/api/sites").then((r) => r.json()).then(setSites).catch(console.error)
  }, [load])

  const resetForm = () => {
    setFName(""); setFNameEn(""); setFSite(""); setFZone("")
    setFResolution("1080p"); setFFps("25"); setFStreamType("demo")
    setFStreamUrl(""); setFCredentials(""); setFModel("")
  }

  const submit = async () => {
    if (!fName.trim()) { toast.error(isAr ? "الاسم مطلوب" : "Name required"); return }
    if (!fSite) { toast.error(isAr ? "الموقع مطلوب" : "Site required"); return }
    setSaving(true)
    try {
      const res = await fetch("/api/cameras/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fName,
          nameEn: fNameEn || fName,
          siteId: fSite,
          zone: fZone,
          zoneEn: fZone,
          resolution: fResolution,
          fps: parseInt(fFps) || 25,
          model: fModel,
          modelEn: fModel,
          streamType: fStreamType,
          streamUrl: fStreamUrl,
          credentials: fCredentials,
        }),
      })
      if (!res.ok) throw new Error("failed")
      toast.success(isAr ? "تمت إضافة الكاميرا" : "Camera added")
      setOpen(false)
      resetForm()
      load()
    } catch {
      toast.error(isAr ? "فشل الإضافة" : "Failed to add")
    } finally {
      setSaving(false)
    }
  }

  const liveCount = cameras?.filter((c) => c.isLive).length || 0
  const demoCount = (cameras?.length || 0) - liveCount

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {isAr ? "إدارة الكاميرات" : "Camera Management"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? "إدارة كاميرات المراقبة وإعدادات البث" : "Manage surveillance cameras and stream configuration"}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5 gradient-nathra text-primary-foreground">
          <Plus className="h-4 w-4" />
          {isAr ? "إضافة كاميرا" : "Add Camera"}
        </Button>
      </div>

      {/* demo mode banner */}
      <Card className="p-4 bg-amber-500/5 border-amber-500/25">
        <div className="flex items-start gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm mb-0.5">
              {isAr ? "وضع العرض التوضيحي" : "Demo Mode Notice"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? "البث الفعلي يتطلب بوابة MediaMTX/FFmpeg. الكاميرات الحالية تعرض Demo Stream. يمكنك إضافة كاميرات ببيانات RTSP/ONVIF — لكن تشغيلها يتطلب تفعيل بوابة البث على الخادم."
                : "Real streaming requires a MediaMTX/FFmpeg gateway. Current cameras show Demo Stream. You can add cameras with RTSP/ONVIF details — but playback requires enabling the streaming gateway on the server."}
            </p>
          </div>
        </div>
      </Card>

      {/* stats */}
      {cameras && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{formatNumber(cameras.length, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "إجمالي الكاميرات" : "Total Cameras"}</p>
          </Card>
          <Card className="p-3 text-center bg-emerald-500/5 border-emerald-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{formatNumber(liveCount, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "بث مباشر" : "Live Stream"}</p>
          </Card>
          <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{formatNumber(demoCount, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "بث تجريبي" : "Demo Stream"}</p>
          </Card>
          <Card className="p-3 text-center bg-cyan-500/5 border-cyan-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-cyan-600 dark:text-cyan-400">
              {formatNumber(cameras.filter((c) => c.status === "online").length, lang)}
            </p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "نشطة" : "Online"}</p>
          </Card>
        </div>
      )}

      {/* cameras table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !cameras || cameras.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          {isAr ? "لا توجد كاميرات بعد." : "No cameras yet."}
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden">
          {/* desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th className="text-start font-medium px-3 py-2.5">{isAr ? "الكاميرا" : "Camera"}</th>
                  <th className="text-start font-medium px-3 py-2.5">{isAr ? "الموقع" : "Site"}</th>
                  <th className="text-start font-medium px-3 py-2.5">{isAr ? "الحالة" : "Status"}</th>
                  <th className="text-start font-medium px-3 py-2.5">{isAr ? "نوع البث" : "Stream"}</th>
                  <th className="text-start font-medium px-3 py-2.5">{isAr ? "الدقة" : "Resolution"}</th>
                  <th className="text-start font-medium px-3 py-2.5">FPS</th>
                  <th className="text-start font-medium px-3 py-2.5">{isAr ? "المنطقة" : "Zone"}</th>
                </tr>
              </thead>
              <tbody>
                {cameras.map((c) => (
                  <tr key={c.id} className="border-t hover:bg-muted/30">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                          <Cctv className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs truncate">{isAr ? c.name : c.nameEn}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{isAr ? c.model : c.modelEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{isAr ? c.site.name : c.site.nameEn}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className={`text-[10px] ${CAMERA_STATUS_BG[c.status as keyof typeof CAMERA_STATUS_BG] || ""}`}>
                        {isAr ? ({ online: "نشطة", offline: "متوقفة", maintenance: "صيانة" }[c.status] || c.status) : c.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge variant="outline" className={`text-[10px] ${STREAM_TYPE_BG[c.streamType] || ""}`}>
                        {c.streamType}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs font-mono">{c.resolution}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums">{c.fps}</td>
                    <td className="px-3 py-2.5 text-xs">{isAr ? c.zone : c.zoneEn}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* mobile cards */}
          <div className="md:hidden divide-y">
            {cameras.map((c) => (
              <div key={c.id} className="p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                      <Cctv className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate">{isAr ? c.name : c.nameEn}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{isAr ? c.site.name : c.site.nameEn}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 items-end shrink-0">
                    <Badge variant="outline" className={`text-[9px] ${CAMERA_STATUS_BG[c.status as keyof typeof CAMERA_STATUS_BG] || ""}`}>
                      {isAr ? ({ online: "نشطة", offline: "متوقفة", maintenance: "صيانة" }[c.status] || c.status) : c.status}
                    </Badge>
                    <Badge variant="outline" className={`text-[9px] ${STREAM_TYPE_BG[c.streamType] || ""}`}>
                      {c.streamType}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    {c.isLive ? (
                      <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-amber-600 dark:text-amber-400 font-bold">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        DEMO
                      </span>
                    )}
                  </span>
                  <span className="font-mono">{c.resolution} · {c.fps}fps</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* add camera dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll">
          <DialogTitle>{isAr ? "إضافة كاميرا جديدة" : "Add New Camera"}</DialogTitle>
          <DialogDescription>
            {isAr ? "بيانات الاعتماد تُخزّن مشفّرة على الخادم ولا تُرجع للعميل." : "Credentials are stored encrypted on the server and never returned to the client."}
          </DialogDescription>

          <div className="space-y-4">
            {/* basics */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</label>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder={isAr ? "مثال: كاميرا الباب الرئيسي" : "e.g., Main Entrance"} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</label>
                <Input value={fNameEn} onChange={(e) => setFNameEn(e.target.value)} placeholder="e.g., Main Entrance" className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الموقع" : "Site"}</label>
                <Select value={fSite} onValueChange={setFSite}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder={isAr ? "اختر الموقع" : "Select site"} /></SelectTrigger>
                  <SelectContent>
                    {sites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{isAr ? s.name : s.nameEn}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "المنطقة" : "Zone"}</label>
                <Input value={fZone} onChange={(e) => setFZone(e.target.value)} placeholder={isAr ? "مثال: الباب الرئيسي" : "e.g., Main Gate"} className="h-9 text-sm" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الدقة" : "Resolution"}</label>
                <Select value={fResolution} onValueChange={setFResolution}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4K">4K (2160p)</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">FPS</label>
                <Input type="number" min={1} max={60} value={fFps} onChange={(e) => setFFps(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الموديل" : "Model"}</label>
                <Input value={fModel} onChange={(e) => setFModel(e.target.value)} placeholder={isAr ? "كشف الأشخاص" : "Person Detection"} className="h-9 text-sm" />
              </div>
            </div>

            {/* stream config */}
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-700 dark:text-cyan-400">
                <Film className="h-3.5 w-3.5" />
                {isAr ? "إعدادات البث" : "Stream Configuration"}
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "نوع البث" : "Stream Type"}</label>
                <Select value={fStreamType} onValueChange={setFStreamType}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rtsp">RTSP</SelectItem>
                    <SelectItem value="onvif">ONVIF</SelectItem>
                    <SelectItem value="hls">HLS</SelectItem>
                    <SelectItem value="webrtc">WebRTC</SelectItem>
                    <SelectItem value="demo">{isAr ? "تجريبي" : "Demo"}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block flex items-center gap-1">
                  <Radio className="h-3 w-3" />
                  {isAr ? "رابط البث (Stream URL)" : "Stream URL"}
                </label>
                <Input
                  value={fStreamUrl}
                  onChange={(e) => setFStreamUrl(e.target.value)}
                  placeholder="rtsp://..."
                  disabled={fStreamType === "demo"}
                  className="h-9 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                  <Lock className="h-2.5 w-2.5" />
                  {isAr ? "يُخزّن على الخادم فقط" : "Stored on server only"}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block flex items-center gap-1">
                  <Key className="h-3 w-3" />
                  {isAr ? "بيانات الاعتماد" : "Credentials"}
                </label>
                <Input
                  type="password"
                  value={fCredentials}
                  onChange={(e) => setFCredentials(e.target.value)}
                  placeholder={isAr ? "user:password" : "user:password"}
                  disabled={fStreamType === "demo"}
                  className="h-9 text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                  <ShieldCheck className="h-2.5 w-2.5" />
                  {isAr ? "تُخزّن مشفّرة على الخادم، ولا تُرجع للعميل أبداً." : "Encrypted at rest, never returned to client."}
                </p>
              </div>
            </div>

            {/* security note */}
            <div className="rounded-md bg-emerald-500/5 border border-emerald-500/20 p-2.5">
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 inline-flex items-start gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                {isAr
                  ? "بيانات الاعتماد تُخزّن مشفّرة على الخادم ولا تُرجع للعميل. تُستخدم فقط من قبل بوابة البث لفتح الاتصال بالكاميرا."
                  : "Credentials are stored encrypted on the server, never returned to the client. Only the streaming gateway uses them to open the camera connection."}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submit} disabled={saving} className="gap-1.5 gradient-nathra text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAr ? "إضافة الكاميرا" : "Add Camera"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
