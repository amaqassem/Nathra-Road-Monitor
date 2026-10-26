'use client'

import { useEffect, useState } from "react"
import {
  Cctv,
  Siren,
  Activity,
  Target,
  Building2,
  Power,
  TrendingUp,
  TrendingDown,
  Loader2,
  Cpu,
  Clock,
  MapPin,
  Zap,
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Line,
  LineChart,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "../lib/i18n"
import { LiveEventTicker } from "../live-event-ticker"
import { AutoScanPanel } from "../auto-scan-panel"
import {
  SEVERITY_BG,
  ALERT_STATUS_BG,
  CAMERA_STATUS_BG,
  formatRelativeTime,
  formatNumber,
  scoreColor,
} from "../lib/helpers"

interface DashData {
  kpi: {
    totalCameras: number
    onlineCameras: number
    activeAlerts: number
    criticalAlerts: number
    eventsToday: number
    totalSites: number
    activePipelines: number
    totalPipelines: number
    avgConfidence: number
    uptime: number
  }
  hourlyTrend: { hour: string; events: number; alerts: number }[]
  alertTypeDist: { name: string; value: number }[]
  cameraStatusDist: { online: number; offline: number; maintenance: number }
  topSites: {
    name: string; nameEn: string; city: string; cityEn: string
    cameras: number; events: number; onlineCams: number
  }[]
  recentAlerts: {
    id: string; type: string; typeEn: string; severity: string; status: string
    confidence: number; camera: string; cameraEn: string; site: string; siteEn: string
    description: string; descriptionEn: string; createdAt: string
  }[]
  recentEvents: {
    id: string; camera: string; cameraEn: string; site: string; siteEn: string
    model: string; modelEn: string; events24h: number; lastEventAt: string; status: string
  }[]
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "var(--popover-foreground)",
}

function KpiCard({
  icon: Icon, label, value, unit, trend, trendValue, accent, delay,
}: {
  icon: typeof Cctv; label: string; value: string; unit?: string
  trend?: "up" | "down" | "neutral"; trendValue?: string; accent: string; delay: number
}) {
  return (
    <Card className="relative overflow-hidden p-4 md:p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight tabular-nums">{value}</span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend === "up" ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                : trend === "down" ? <TrendingDown className="h-3 w-3 text-red-500" />
                : null}
              <span className={`text-[11px] font-semibold ${
                trend === "up" ? "text-emerald-600 dark:text-emerald-400"
                : trend === "down" ? "text-red-600 dark:text-red-400"
                : "text-muted-foreground"
              }`}>{trendValue}</span>
            </div>
          )}
        </div>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}20`, color: accent }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="absolute bottom-0 right-0 left-0 h-1"
        style={{ background: `linear-gradient(to left, ${accent}, transparent)` }} />
    </Card>
  )
}

export function OverviewView() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<DashData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/nathra-dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const { kpi, hourlyTrend, alertTypeDist, cameraStatusDist, topSites, recentAlerts, recentEvents } = data
  const isAr = lang === "ar"

  const camPie = [
    { name: t("status.online"), value: cameraStatusDist.online, color: "#10b981" },
    { name: t("status.offline"), value: cameraStatusDist.offline, color: "#ef4444" },
    { name: t("status.maintenance"), value: cameraStatusDist.maintenance, color: "#f59e0b" },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{t("dash.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("dash.subtitle")}</p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {t("app.realtime")}
        </Badge>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <KpiCard icon={Cctv} label={t("kpi.cameras")} value={formatNumber(kpi.onlineCameras, lang)} unit={`/ ${formatNumber(kpi.totalCameras, lang)}`} accent="#10b981" trend="up" trendValue={`${kpi.uptime}%`} delay={0} />
        <KpiCard icon={Siren} label={t("kpi.alerts")} value={formatNumber(kpi.activeAlerts, lang)} unit={t("kpi.alertsUnit")} accent="#dc2626" trend="down" trendValue={`-${Math.max(1, Math.floor(kpi.activeAlerts * 0.15))}`} delay={60} />
        <KpiCard icon={Activity} label={t("kpi.events")} value={formatNumber(kpi.eventsToday, lang)} unit={t("kpi.eventsUnit")} accent="#8b5cf6" trend="up" trendValue="+12%" delay={120} />
        <KpiCard icon={Target} label={t("kpi.accuracy")} value={`${kpi.avgConfidence}%`} accent="#10b981" trend="up" trendValue="+0.4%" delay={180} />
        <KpiCard icon={Building2} label={t("kpi.sites")} value={formatNumber(kpi.totalSites, lang)} unit={t("kpi.sitesUnit")} accent="#0ea5e9" trend="neutral" trendValue={isAr ? "مستقر" : "stable"} delay={240} />
        <KpiCard icon={Power} label={t("kpi.uptime")} value={`${kpi.uptime}%`} accent="#10b981" trend="up" trendValue={isAr ? "ممتاز" : "excellent"} delay={300} />
      </div>

      {/* شريط الأحداث اللحظي + المعالجة التلقائية */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <LiveEventTicker />
        <AutoScanPanel />
      </div>

      {/* Trend + Camera Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">{t("dash.eventsTrend")}</h3>
              <p className="text-xs text-muted-foreground">{t("dash.eventsTrendSub")}</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> {isAr ? "آخر 8 ساعات" : "Last 8h"}
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={hourlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="eventsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="alertsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="events" stroke="#f59e0b" strokeWidth={2.5} fill="url(#eventsGrad)" />
              <Area type="monotone" dataKey="alerts" stroke="#dc2626" strokeWidth={2} fill="url(#alertsGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-bold text-base">{t("dash.cameraStatus")}</h3>
            <p className="text-xs text-muted-foreground">{t("dash.cameraStatusSub")}</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={camPie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                {camPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-1 gap-2 mt-2">
            {camPie.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="font-bold mr-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alert Types + Top Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-bold text-base">{t("dash.alertTypes")}</h3>
            <p className="text-xs text-muted-foreground">{t("dash.alertTypesSub")}</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={alertTypeDist} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#f59e0b" barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="lg:col-span-2 p-5">
          <div className="mb-4">
            <h3 className="font-bold text-base">{t("dash.topSites")}</h3>
            <p className="text-xs text-muted-foreground">{t("dash.topSitesSub")}</p>
          </div>
          <div className="space-y-2.5 max-h-[240px] overflow-y-auto custom-scroll pr-1">
            {topSites.map((s, idx) => {
              const name = isAr ? s.name : s.nameEn
              const city = isAr ? s.city : s.cityEn
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg gradient-nathra text-primary-foreground text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{name}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-2.5 w-2.5" />{city} · {s.cameras} {isAr ? "كاميرا" : "cams"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-left">
                      <p className="text-sm font-bold tabular-nums">{s.events}</p>
                      <p className="text-[9px] text-muted-foreground">{isAr ? "أحداث" : "events"}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Recent Alerts + Recent Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Siren className="h-4 w-4 text-red-500" />{t("dash.recentAlerts")}
            </h3>
          </div>
          <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scroll pr-1">
            {recentAlerts.map((a) => {
              const type = isAr ? a.type : a.typeEn
              const cam = isAr ? a.camera : a.cameraEn
              const site = isAr ? a.site : a.siteEn
              return (
                <div key={a.id} className={`border rounded-lg p-3 ${a.severity === "critical" && a.status === "active" ? "alert-pulse" : ""}`}>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="text-sm font-semibold flex items-center gap-1.5">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold">
                        {a.confidence}
                      </span>
                      {type}
                    </span>
                    <div className="flex gap-1">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SEVERITY_BG[a.severity as keyof typeof SEVERITY_BG]}`}>{t(`status.${a.severity}` as never)}</Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ALERT_STATUS_BG[a.status as keyof typeof ALERT_STATUS_BG]}`}>{t(`status.${a.status}` as never)}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                    <Cctv className="h-3 w-3 shrink-0" />{cam} · {site}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground line-clamp-1">{isAr ? a.description : a.descriptionEn}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                      <Clock className="h-2.5 w-2.5" />{formatRelativeTime(a.createdAt, lang)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Cpu className="h-4 w-4 text-primary" />{t("dash.recentEvents")}
            </h3>
          </div>
          <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scroll pr-1">
            {recentEvents.map((e) => {
              const cam = isAr ? e.camera : e.cameraEn
              const site = isAr ? e.site : e.siteEn
              const model = isAr ? e.model : e.modelEn
              return (
                <div key={e.id} className="border rounded-lg p-3 hover:bg-accent/40 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold flex items-center gap-1.5">
                        <Cctv className="h-3.5 w-3.5 text-muted-foreground shrink-0" />{cam}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">{site}</p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${CAMERA_STATUS_BG[e.status as keyof typeof CAMERA_STATUS_BG]}`}>
                      {t(`status.${e.status}` as never)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" />{model}
                    </span>
                    <span className="text-[11px] font-bold text-primary">{e.events24h} {isAr ? "حدث" : "ev"}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{formatRelativeTime(e.lastEventAt, lang)}
                  </p>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
