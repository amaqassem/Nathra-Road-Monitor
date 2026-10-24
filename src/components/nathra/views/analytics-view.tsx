'use client'

import { useEffect, useState } from "react"
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
  LineChart, Line, Legend,
} from "recharts"
import { Loader2, ShieldCheck, Activity, TrendingUp, MapPin, Flame } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useI18n } from "../lib/i18n"
import { scoreColor } from "../lib/helpers"

interface AnalyticsData {
  kpi: {
    totalCameras: number; onlineCameras: number; totalSites: number
    activeAlerts: number; eventsToday: number; avgConfidence: number; uptime: number
  }
  topSites: { name: string; nameEn: string; city: string; cityEn: string; cameras: number; events: number; onlineCams: number; safetyScore?: number }[]
  alertTypeDist: { name: string; value: number }[]
  hourlyTrend: { hour: string; events: number; alerts: number }[]
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)", border: "1px solid var(--border)",
  borderRadius: "0.5rem", fontSize: "12px", color: "var(--popover-foreground)",
}

// ألوان الخريطة الحرارية (كثافة)
function heatColor(value: number, max: number): string {
  const ratio = value / max
  if (ratio > 0.8) return "#dc2626"
  if (ratio > 0.6) return "#ea580c"
  if (ratio > 0.4) return "#f59e0b"
  if (ratio > 0.2) return "#84cc16"
  if (ratio > 0) return "#06b6d4"
  return "var(--muted)"
}

export function AnalyticsView() {
  const { t, lang } = useI18n()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [sites, setSites] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const isAr = lang === "ar"

  useEffect(() => {
    Promise.all([
      fetch("/api/nathra-dashboard").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ])
      .then(([d, s]) => { setData(d); setSites(s) })
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

  const { kpi } = data

  // مؤشرات صحية
  const safetyIndex = Math.round(70 + (kpi.avgConfidence - 80) * 1.5)
  const coverage = kpi.uptime
  const falseAlarmRate = Math.max(2, Math.round(15 - kpi.avgConfidence / 8))

  const healthMetrics = [
    { label: t("analytics.nationalIndex"), value: Math.min(99, Math.max(40, safetyIndex)), max: 100, icon: ShieldCheck, color: scoreColor(safetyIndex), desc: t("analytics.nationalIndexDesc") },
    { label: t("analytics.coverage"), value: coverage, max: 100, icon: Activity, color: "#06b6d4", desc: t("analytics.coverageDesc") },
    { label: t("analytics.falseAlarmRate"), value: falseAlarmRate, max: 100, icon: TrendingUp, color: "#8b5cf6", desc: t("analytics.falseAlarmDesc") },
  ]

  // الخريطة الحرارية: 7 أيام × 24 ساعة
  const days = isAr
    ? ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const heatmap = days.map((day, di) => ({
    day,
    hours: Array.from({ length: 24 }, (_, h) => {
      // محاكاة: ذروة في الصباح والمساء
      const base = Math.sin((h - 6) * Math.PI / 12) * 30 + 20
      const weekend = di >= 5 ? 1.4 : 1
      const noise = Math.random() * 15
      return Math.max(0, Math.round((base + noise) * weekend))
    }),
  }))
  const maxHeat = Math.max(...heatmap.flatMap((d) => d.hours))

  // بيانات الرادار: أعلى 7 مواقع
  const radarData = [...sites]
    .sort((a, b) => b.safetyScore - a.safetyScore)
    .slice(0, 7)
    .map((s) => ({ site: isAr ? s.name : s.nameEn, score: s.safetyScore }))

  // بيانات الأعمدة: المواقع
  const barData = [...sites]
    .sort((a, b) => b.safetyScore - a.safetyScore)
    .map((s) => ({ name: isAr ? s.name : s.nameEn, score: s.safetyScore }))

  // بيانات الأسبوع (محاكاة)
  const weekData = Array.from({ length: 7 }, (_, i) => ({
    day: days[i],
    alerts: Math.round(20 + Math.random() * 30),
    confirmed: Math.round(15 + Math.random() * 22),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{t("analytics.title")}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{t("analytics.subtitle")}</p>
      </div>

      {/* المؤشرات الصحية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {healthMetrics.map((m) => {
          const Icon = m.icon
          const pct = Math.min(100, (m.value / m.max) * 100)
          return (
            <Card key={m.label} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{m.label}</p>
                  <p className="text-3xl font-extrabold tabular-nums mt-1" style={{ color: m.color }}>
                    {m.value}<span className="text-base text-muted-foreground">/{m.max}</span>
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: m.color }} />
              </div>
              <p className="text-[11px] text-muted-foreground">{m.desc}</p>
            </Card>
          )
        })}
      </div>

      {/* الخريطة الحرارية */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="font-bold text-base flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />{t("analytics.heatmap")}
            </h3>
            <p className="text-xs text-muted-foreground">{t("analytics.heatmapSub")}</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span>{isAr ? "منخفض" : "Low"}</span>
            {["#06b6d4", "#84cc16", "#f59e0b", "#ea580c", "#dc2626"].map((c) => (
              <span key={c} className="h-3 w-4 rounded-sm" style={{ backgroundColor: c }} />
            ))}
            <span>{isAr ? "مرتفع" : "High"}</span>
          </div>
        </div>
        <div className="overflow-x-auto custom-scroll">
          <div className="min-w-[640px]">
            {/* رأس الساعات */}
            <div className="flex items-center gap-px mb-1">
              <div className="w-16 shrink-0" />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center text-[9px] text-muted-foreground tabular-nums">
                  {h % 3 === 0 ? h : ""}
                </div>
              ))}
            </div>
            {/* صفوف الأيام */}
            {heatmap.map((row) => (
              <div key={row.day} className="flex items-center gap-px mb-px">
                <div className="w-16 shrink-0 text-[10px] font-semibold text-muted-foreground truncate">{row.day}</div>
                {row.hours.map((v, h) => (
                  <div
                    key={h}
                    className="flex-1 aspect-square rounded-sm transition-transform hover:scale-125 hover:z-10 relative group"
                    style={{ backgroundColor: heatColor(v, maxHeat) }}
                    title={`${row.day} ${h}:00 — ${v} ${isAr ? "حدث" : "events"}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Radar + Behavior bar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">{t("analytics.siteCompare")}</h3>
            <p className="text-xs text-muted-foreground">{t("analytics.siteCompareSub")}</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} outerRadius="72%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="site" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Radar name="Safety" dataKey="score" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} strokeWidth={2} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">{t("analytics.behavior")}</h3>
            <p className="text-xs text-muted-foreground">{t("analytics.behaviorSub")}</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.alertTypeDist} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} angle={-30} textAnchor="end" height={60} interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={26}>
                {data.alertTypeDist.map((_, i) => (
                  <Cell key={i} fill={["#06b6d4", "#8b5cf6", "#0ea5e9", "#f59e0b", "#dc2626", "#10b981", "#ea580c"][i % 7]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Trend + Top Sites */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">{t("analytics.trend")}</h3>
            <p className="text-xs text-muted-foreground">{t("analytics.trendSub")}</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={weekData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="alerts" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} name={isAr ? "تنبيهات" : "Alerts"} />
              <Line type="monotone" dataKey="confirmed" stroke="#06b6d4" strokeWidth={2.5} dot={{ r: 3 }} name={isAr ? "مؤكدة" : "Confirmed"} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">{t("dash.topSites")}</h3>
            <p className="text-xs text-muted-foreground">{t("dash.topSitesSub")}</p>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto custom-scroll pr-1">
            {[...sites].sort((a, b) => b.safetyScore - a.safetyScore).map((s, idx) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-nathra text-primary-foreground text-[10px] font-bold">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">{isAr ? s.name : s.nameEn}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />{isAr ? s.city : s.cityEn}
                  </p>
                </div>
                <span className="text-sm font-extrabold tabular-nums shrink-0" style={{ color: scoreColor(s.safetyScore) }}>
                  {s.safetyScore}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* الملخص التنفيذي */}
      <Card className="p-5 gradient-nathra-soft border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-nathra text-primary-foreground shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1">{t("analytics.execSummary")}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr ? (
                <>
                  يحقق النظام مؤشر أمان وطني بقيمة <span className="font-bold" style={{ color: scoreColor(safetyIndex) }}>{safetyIndex}/100</span> عبر <span className="font-bold">{kpi.totalSites}</span> موقعاً و<span className="font-bold">{kpi.totalCameras}</span> كاميرا، بمعدل تغطية <span className="font-bold text-cyan-600 dark:text-cyan-400">{coverage}%</span> ودقة نماذج <span className="font-bold">{kpi.avgConfidence}%</span>. تم رصد <span className="font-bold text-red-600 dark:text-red-400">{kpi.activeAlerts}</span> تنبيه نشط اليوم مع معدل إنذارات كاذبة منخفض <span className="font-bold">{falseAlarmRate}%</span> بفضل التحقق المدعوم بالذكاء الاصطناعي. النظام متوافق بالكامل مع PDPL.
                </>
              ) : (
                <>
                  The system achieves a national safety index of <span className="font-bold" style={{ color: scoreColor(safetyIndex) }}>{safetyIndex}/100</span> across <span className="font-bold">{kpi.totalSites}</span> sites and <span className="font-bold">{kpi.totalCameras}</span> cameras, with <span className="font-bold text-cyan-600 dark:text-cyan-400">{coverage}%</span> coverage and <span className="font-bold">{kpi.avgConfidence}%</span> model accuracy. <span className="font-bold text-red-600 dark:text-red-400">{kpi.activeAlerts}</span> active alerts today with a low <span className="font-bold">{falseAlarmRate}%</span> false-alarm rate thanks to AI-assisted verification. Fully PDPL-compliant.
                </>
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
