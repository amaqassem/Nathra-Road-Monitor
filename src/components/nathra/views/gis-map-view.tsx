'use client'

import { useEffect, useState, useMemo, useCallback } from "react"
import {
  Loader2, MapPin, Cctv, Siren, Filter, Layers, Activity, ShieldAlert,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useI18n } from "../lib/i18n"
import { formatNumber, scoreColor } from "../lib/helpers"
import { toast } from "sonner"

interface Site {
  id: string
  name: string
  nameEn: string
  city: string
  cityEn: string
  lat: number
  lng: number
  cameraCount: number
  onlineCams: number
  eventCount: number
  safetyScore: number
}

interface Incident {
  id: string
  incidentNo: string
  type: string
  typeEn: string
  severity: string
  status: string
  gpsLat: number | null
  gpsLng: number | null
  site: { id: string; name: string; nameEn: string; lat: number; lng: number }
}

// Saudi bounds
const LAT_MIN = 16, LAT_MAX = 32
const LNG_MIN = 34, LNG_MAX = 56
const VW_W = 660, VW_H = 720

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VW_W
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VW_H
  return { x, y }
}

// Stylized Saudi Arabia outline (clockwise from NW)
const SAUDI_PATH = "M 150 0 L 240 0 L 300 135 L 420 135 L 480 270 L 480 360 L 540 360 L 630 450 L 630 540 L 540 630 L 540 720 L 450 675 L 330 675 L 270 630 L 240 585 L 150 495 L 120 450 L 90 360 L 60 270 L 30 180 L 30 90 L 60 45 Z"

function safetyFill(score: number): string {
  if (score >= 80) return "#10b981"
  if (score >= 60) return "#f59e0b"
  return "#dc2626"
}

function incidentColor(sev: string): string {
  if (sev === "critical") return "#dc2626"
  if (sev === "high") return "#ea580c"
  if (sev === "medium") return "#d97706"
  return "#0891b2"
}

export function GisMapView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [sites, setSites] = useState<Site[] | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [severityFilter, setSeverityFilter] = useState("all")
  const [showIncidents, setShowIncidents] = useState(true)
  const [hoveredSite, setHoveredSite] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sitesRes, incRes] = await Promise.all([
        fetch("/api/sites"),
        fetch("/api/incidents"),
      ])
      const sitesData = await sitesRes.json()
      const incData = await incRes.json()
      setSites(sitesData)
      setIncidents(incData.incidents || [])
    } catch (e) {
      console.error(e)
      toast.error(isAr ? "فشل تحميل الخريطة" : "Failed to load map")
    } finally {
      setLoading(false)
    }
  }, [isAr])

  useEffect(() => { load() }, [load])

  // project incident coords (fallback to site coords)
  const incidentMarkers = useMemo(() => {
    return incidents
      .filter((i) => {
        if (severityFilter === "all") return true
        return i.severity === severityFilter
      })
      .map((i) => {
        const lat = i.gpsLat ?? i.site.lat
        const lng = i.gpsLng ?? i.site.lng
        const p = project(lat, lng)
        return { id: i.id, no: i.incidentNo, type: isAr ? i.type : i.typeEn, severity: i.severity, status: i.status, x: p.x, y: p.y }
      })
  }, [incidents, severityFilter, isAr])

  // project site coords
  const siteMarkers = useMemo(() => {
    if (!sites) return []
    return sites.map((s) => {
      const p = project(s.lat, s.lng)
      const radius = Math.max(6, Math.min(16, 6 + s.cameraCount / 2))
      return { ...s, x: p.x, y: p.y, radius }
    })
  }, [sites])

  const selectedSiteData = useMemo(() => {
    if (!selectedSite || !sites) return null
    return sites.find((s) => s.id === selectedSite) || null
  }, [selectedSite, sites])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {isAr ? "خريطة القيادة الوطنية" : "National GIS Command Map"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? "عرض جغرافي للمواقع والحوادث عبر المملكة" : "Geographic view of sites and incidents nationwide"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1 text-[10px] bg-cyan-500/5 border-cyan-500/25 text-cyan-700 dark:text-cyan-400">
            <Cctv className="h-3 w-3" />
            {formatNumber(sites?.length || 0, lang)} {isAr ? "موقع" : "sites"}
          </Badge>
          <Badge variant="outline" className="gap-1 text-[10px] bg-red-500/5 border-red-500/25 text-red-700 dark:text-red-400">
            <Siren className="h-3 w-3" />
            {formatNumber(incidentMarkers.length, lang)} {isAr ? "حادث" : "incidents"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* map */}
        <div className="lg:col-span-2">
          <Card className="p-3 overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: `${VW_W}/${VW_H}` }}>
              <svg viewBox={`0 0 ${VW_W} ${VW_H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                {/* background grid */}
                <defs>
                  <pattern id="gis-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M 60 0 L 0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.08" />
                  </pattern>
                  <radialGradient id="saudi-grad" cx="50%" cy="40%" r="70%">
                    <stop offset="0%" stopColor="oklch(0.55 0.14 210)" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="oklch(0.55 0.14 210)" stopOpacity="0.04" />
                  </radialGradient>
                </defs>
                <rect width={VW_W} height={VW_H} fill="url(#gis-grid)" className="text-foreground" />

                {/* watermark */}
                <text x={VW_W / 2} y={VW_H / 2} textAnchor="middle"
                  className="fill-current font-bold"
                  style={{ fontSize: 56, opacity: 0.05, fontFamily: "var(--font-cairo)" }}>
                  {isAr ? "المملكة العربية السعودية" : "KINGDOM OF SAUDI ARABIA"}
                </text>

                {/* Saudi outline */}
                <path d={SAUDI_PATH} fill="url(#saudi-grad)" stroke="oklch(0.55 0.14 210)" strokeWidth="1.5" strokeOpacity="0.5" />

                {/* grid lines (lat/lng) */}
                {[20, 24, 28].map((lat) => {
                  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VW_H
                  return <line key={`lat-${lat}`} x1="0" y1={y} x2={VW_W} y2={y} stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.1" className="text-foreground" />
                })}
                {[40, 44, 48, 52].map((lng) => {
                  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VW_W
                  return <line key={`lng-${lng}`} x1={x} y1="0" x2={x} y2={VW_H} stroke="currentColor" strokeWidth="0.3" strokeOpacity="0.1" className="text-foreground" />
                })}

                {/* incident markers (under sites) */}
                {showIncidents && incidentMarkers.map((m) => {
                  const isCritical = m.severity === "critical"
                  return (
                    <g key={`inc-${m.id}`}>
                      {isCritical && (
                        <circle cx={m.x} cy={m.y} r="6" fill={incidentColor(m.severity)} opacity="0.4">
                          <animate attributeName="r" values="4;12;4" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle cx={m.x} cy={m.y} r={isCritical ? 3.5 : 2.5} fill={incidentColor(m.severity)} stroke="white" strokeWidth="0.6" />
                    </g>
                  )
                })}

                {/* site markers */}
                {siteMarkers.map((s) => {
                  const isHovered = hoveredSite === s.id || selectedSite === s.id
                  const fill = safetyFill(s.safetyScore)
                  return (
                    <g key={`site-${s.id}`} className="cursor-pointer"
                      onMouseEnter={() => setHoveredSite(s.id)}
                      onMouseLeave={() => setHoveredSite(null)}
                      onClick={() => setSelectedSite(s.id)}>
                      {isHovered && (
                        <circle cx={s.x} cy={s.y} r={s.radius + 4} fill={fill} opacity="0.2" />
                      )}
                      <circle cx={s.x} cy={s.y} r={s.radius} fill={fill} stroke="white" strokeWidth="1.5" opacity="0.9" />
                      <text x={s.x} y={s.y + 1} textAnchor="middle" className="fill-white font-bold pointer-events-none" style={{ fontSize: 8 }}>
                        {s.cameraCount}
                      </text>
                    </g>
                  )
                })}
              </svg>

              {/* tooltip on hover */}
              {hoveredSite && siteMarkers.find((s) => s.id === hoveredSite) && (() => {
                const s = siteMarkers.find((s) => s.id === hoveredSite)!
                const xPct = (s.x / VW_W) * 100
                const yPct = (s.y / VW_H) * 100
                return (
                  <div
                    className="absolute pointer-events-none z-10 bg-popover border rounded-md shadow-md p-2 text-[11px] min-w-[140px]"
                    style={{
                      left: `${Math.min(xPct + 2, 75)}%`,
                      top: `${Math.max(yPct - 18, 0)}%`,
                    }}
                  >
                    <p className="font-bold truncate">{isAr ? s.name : s.nameEn}</p>
                    <p className="text-muted-foreground text-[10px] truncate">{isAr ? s.city : s.cityEn}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: safetyFill(s.safetyScore) }} />
                      <span className="text-[10px]">{isAr ? "درجة الأمان" : "Safety"}: <b>{s.safetyScore}</b></span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {s.onlineCams}/{s.cameraCount} {isAr ? "كاميرا نشطة" : "cams online"}
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 pt-3 border-t text-[10px]">
              <div className="flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-muted-foreground" />
                <span className="font-semibold">{isAr ? "المفتاح" : "Legend"}:</span>
              </div>
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#10b981" }} /><span>{isAr ? "أمان عالٍ ≥80" : "Safe ≥80"}</span></div>
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#f59e0b" }} /><span>{isAr ? "متوسط 60-79" : "Medium 60-79"}</span></div>
              <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ background: "#dc2626" }} /><span>{isAr ? "منخفض <60" : "Low <60"}</span></div>
              <div className="w-px h-3 bg-border mx-1" />
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#dc2626" }} /><span>{isAr ? "حرج" : "Critical"}</span></div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#ea580c" }} /><span>{isAr ? "عالي" : "High"}</span></div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#d97706" }} /><span>{isAr ? "متوسط" : "Medium"}</span></div>
              <div className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: "#0891b2" }} /><span>{isAr ? "منخفض" : "Low"}</span></div>
            </div>
          </Card>
        </div>

        {/* sidebar */}
        <div className="space-y-3">
          {/* filters */}
          <Card className="p-3 space-y-2.5">
            <p className="text-xs font-semibold flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-primary" />
              {isAr ? "الفلاتر" : "Filters"}
            </p>
            <div>
              <label className="text-[10px] text-muted-foreground mb-1 block">{isAr ? "تصفية الحوادث" : "Filter incidents"}</label>
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isAr ? "كل الخطورة" : "All severities"}</SelectItem>
                  <SelectItem value="critical">{isAr ? "حرجة" : "Critical"}</SelectItem>
                  <SelectItem value="high">{isAr ? "عالية" : "High"}</SelectItem>
                  <SelectItem value="medium">{isAr ? "متوسطة" : "Medium"}</SelectItem>
                  <SelectItem value="low">{isAr ? "منخفضة" : "Low"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Activity className="h-3 w-3" />
                {isAr ? "إظهار الحوادث" : "Show incidents"}
              </label>
              <Switch checked={showIncidents} onCheckedChange={setShowIncidents} />
            </div>
          </Card>

          {/* selected site detail */}
          {selectedSiteData && (
            <Card className="p-3 bg-cyan-500/5 border-cyan-500/20">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold text-sm">{isAr ? selectedSiteData.name : selectedSiteData.nameEn}</p>
                  <p className="text-[10px] text-muted-foreground inline-flex items-center gap-0.5">
                    <MapPin className="h-2.5 w-2.5" />
                    {isAr ? selectedSiteData.city : selectedSiteData.cityEn}
                  </p>
                </div>
                <button onClick={() => setSelectedSite(null)} className="text-muted-foreground hover:text-foreground text-xs">×</button>
              </div>
              <div className="grid grid-cols-3 gap-1 mt-2 text-center">
                <div className="rounded bg-background p-1.5">
                  <p className="text-base font-extrabold" style={{ color: scoreColor(selectedSiteData.safetyScore) }}>{selectedSiteData.safetyScore}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "الأمان" : "Safety"}</p>
                </div>
                <div className="rounded bg-background p-1.5">
                  <p className="text-base font-extrabold text-cyan-600 dark:text-cyan-400">{selectedSiteData.cameraCount}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "كاميرا" : "Cameras"}</p>
                </div>
                <div className="rounded bg-background p-1.5">
                  <p className="text-base font-extrabold text-red-600 dark:text-red-400">{formatNumber(selectedSiteData.eventCount, lang)}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "أحداث" : "Events"}</p>
                </div>
              </div>
              <div className="mt-2">
                <div className="flex items-center justify-between text-[10px] mb-0.5">
                  <span className="text-muted-foreground">{isAr ? "الكاميرات النشطة" : "Online cameras"}</span>
                  <span className="font-bold">{selectedSiteData.onlineCams}/{selectedSiteData.cameraCount}</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${(selectedSiteData.onlineCams / Math.max(1, selectedSiteData.cameraCount)) * 100}%`,
                    background: scoreColor(selectedSiteData.safetyScore),
                  }} />
                </div>
              </div>
            </Card>
          )}

          {/* sites list */}
          <Card className="p-3">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Cctv className="h-3.5 w-3.5 text-primary" />
              {isAr ? "المواقع" : "Sites"}
              <span className="text-muted-foreground font-normal">({sites?.length || 0})</span>
            </p>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto custom-scroll">
              {sites?.map((s) => {
                const isSel = selectedSite === s.id
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSite(isSel ? null : s.id)}
                    className={`w-full text-start rounded-md border p-2 transition-colors ${isSel ? "bg-cyan-500/10 border-cyan-500/30" : "hover:bg-accent"}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{isAr ? s.name : s.nameEn}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{isAr ? s.city : s.cityEn} · {s.cameraCount} {isAr ? "كاميرا" : "cams"}</p>
                      </div>
                      <div className="text-end shrink-0">
                        <p className="text-sm font-extrabold" style={{ color: scoreColor(s.safetyScore) }}>{s.safetyScore}</p>
                      </div>
                    </div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden mt-1.5">
                      <div className="h-full rounded-full" style={{ width: `${s.safetyScore}%`, background: scoreColor(s.safetyScore) }} />
                    </div>
                  </button>
                )
              })}
              {!sites || sites.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">{isAr ? "لا توجد مواقع" : "No sites"}</p>
              ) : null}
            </div>
          </Card>

          {/* note */}
          <Card className="p-3 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-2 text-[11px]">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-muted-foreground leading-relaxed">
                {isAr
                  ? "خريطة مبسطة لأغراض عرض المواقع. الإحداثيات الفعلية قد تختلف دقة عن خرائط GIS متخصصة."
                  : "Simplified map for site visualization. Actual coordinates may differ from specialized GIS maps."}
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
