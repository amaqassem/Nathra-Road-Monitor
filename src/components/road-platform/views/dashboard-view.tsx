'use client'

import { useEffect, useState } from "react"
import {
  Route,
  Ruler,
  Gauge,
  AlertTriangle,
  AlertOctagon,
  Cpu,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  MapPin,
  Wrench,
  Clock,
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
  LineChart,
  Line,
  Legend,
} from "recharts"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  scoreColor,
  STATUS_COLORS,
  SEVERITY_BG,
  ISSUE_STATUS_BG,
  formatRelativeTime,
  formatNumber,
  type RoadStatus,
} from "../lib/helpers"

interface DashboardData {
  kpi: {
    totalRoads: number
    totalLength: number
    avgScore: number
    openIssues: number
    criticalIssues: number
    activeSensors: number
    totalSensors: number
    regions: number
    totalInspections: number
  }
  statusDist: Record<string, number>
  issueTypeDist: { name: string; value: number }[]
  regionStats: { name: string; code: string; score: number; roads: number }[]
  monthlyTrend: { month: string; "جودة": number; "هدف": number }[]
  recentIssues: {
    id: string
    type: string
    severity: string
    status: string
    road: string
    region: string
    reportedBy: string
    createdAt: string
  }[]
  worstRoads: {
    id: string
    name: string
    region: string
    score: number
    status: string
    length: number
    highway: string
  }[]
  recentInspections: {
    id: string
    inspector: string
    score: number
    notes: string
    date: string
  }[]
}

function KpiCard({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  trendValue,
  accent,
  delay,
}: {
  icon: typeof Route
  label: string
  value: string
  unit?: string
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  accent: string
  delay: number
}) {
  return (
    <Card className="relative overflow-hidden p-4 md:p-5 animate-fade-up" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl md:text-3xl font-extrabold tracking-tight tabular-nums">
              {value}
            </span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          {trend && (
            <div className="flex items-center gap-1 mt-1.5">
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3 text-emerald-500" />
              ) : trend === "down" ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : (
                <Minus className="h-3 w-3 text-muted-foreground" />
              )}
              <span
                className={`text-[11px] font-semibold ${
                  trend === "up"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : trend === "down"
                    ? "text-red-600 dark:text-red-400"
                    : "text-muted-foreground"
                }`}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${accent}20`, color: accent }}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div
        className="absolute bottom-0 right-0 left-0 h-1"
        style={{ background: `linear-gradient(to left, ${accent}, transparent)` }}
      />
    </Card>
  )
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "var(--popover-foreground)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
}

export function DashboardView() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/dashboard")
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

  const { kpi, statusDist, issueTypeDist, regionStats, monthlyTrend, recentIssues, worstRoads, recentInspections } = data

  const statusPieData = Object.entries(statusDist).map(([name, value]) => ({
    name,
    value,
    color: STATUS_COLORS[name as RoadStatus],
  }))

  return (
    <div className="space-y-6">
      {/* عنوان القسم */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">لوحة التحكم الوطنية</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            نظرة شاملة على جودة الطرق في المملكة العربية السعودية
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          تحديث لحظي
        </Badge>
      </div>

      {/* بطاقات المؤشرات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        <KpiCard icon={Route} label="إجمالي الطرق" value={formatNumber(kpi.totalRoads)} unit="مقطع" accent="#16a34a" trend="up" trendValue="+3 هذا الشهر" delay={0} />
        <KpiCard icon={Ruler} label="الطول الكلي" value={formatNumber(kpi.totalLength)} unit="كم" accent="#0d9488" trend="up" trendValue="شبكة متوسعة" delay={60} />
        <KpiCard icon={Gauge} label="متوسط الجودة" value={formatNumber(kpi.avgScore)} unit="/100" accent={scoreColor(kpi.avgScore)} trend="up" trendValue="+1.8%" delay={120} />
        <KpiCard icon={AlertTriangle} label="بلاغات مفتوحة" value={formatNumber(kpi.openIssues)} unit="بلاغ" accent="#d97706" trend="down" trendValue="-12%" delay={180} />
        <KpiCard icon={AlertOctagon} label="حالات حرجة" value={formatNumber(kpi.criticalIssues)} unit="حالة" accent="#dc2626" trend="down" trendValue="-4" delay={240} />
        <KpiCard icon={Cpu} label="مستشعرات نشطة" value={`${formatNumber(kpi.activeSensors)}/${formatNumber(kpi.totalSensors)}`} accent="#7c3aed" trend="up" trendValue={`${Math.round((kpi.activeSensors / kpi.totalSensors) * 100)}% تشغيل`} delay={300} />
      </div>

      {/* الصف الأول من الرسوم */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* اتجاه الجودة */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">اتجاه جودة الطرق</h3>
              <p className="text-xs text-muted-foreground">متوسط درجة الجودة الشهري مقابل الهدف</p>
            </div>
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3 text-emerald-500" /> تحسّن مستمر
            </Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={monthlyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="qualityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={scoreColor(kpi.avgScore)} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={scoreColor(kpi.avgScore)} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="جودة" stroke={scoreColor(kpi.avgScore)} strokeWidth={2.5} fill="url(#qualityGrad)" />
              <Line type="monotone" dataKey="هدف" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* توزيع الحالات */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-bold text-base">توزيع حالات الطرق</h3>
            <p className="text-xs text-muted-foreground">حسب درجة الجودة</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} stroke="none">
                {statusPieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {statusPieData.map((s) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-muted-foreground">{s.name}</span>
                <span className="font-bold mr-auto">{s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* الصف الثاني */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* أنواع المشاكل */}
        <Card className="p-5">
          <div className="mb-4">
            <h3 className="font-bold text-base">أنواع عيوب الرصف</h3>
            <p className="text-xs text-muted-foreground">توزيع البلاغات حسب النوع</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={issueTypeDist} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={70} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#16a34a" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* جودة المناطق */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-base">جودة الطرق حسب المنطقة</h3>
              <p className="text-xs text-muted-foreground">متوسط درجة الجودة لكل منطقة إدارية</p>
            </div>
          </div>
          <div className="space-y-2.5 max-h-[240px] overflow-y-auto custom-scroll pr-1">
            {[...regionStats]
              .sort((a, b) => b.score - a.score)
              .map((r) => (
                <div key={r.code} className="flex items-center gap-3">
                  <div className="w-28 shrink-0">
                    <p className="text-xs font-semibold truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">{r.roads} مقطع</p>
                  </div>
                  <div className="flex-1">
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${r.score}%`, backgroundColor: scoreColor(r.score) }}
                      />
                    </div>
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums w-10 text-left"
                    style={{ color: scoreColor(r.score) }}
                  >
                    {r.score}
                  </span>
                </div>
              ))}
          </div>
        </Card>
      </div>

      {/* الصف الثالث: أحدث البلاغات + أسوأ الطرق + الفحوصات */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* أحدث البلاغات */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              أحدث البلاغات
            </h3>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scroll pr-1">
            {recentIssues.map((issue) => (
              <div key={issue.id} className="border rounded-lg p-3 hover:bg-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-sm font-semibold">{issue.type}</span>
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${SEVERITY_BG[issue.severity]}`}>
                    {issue.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {issue.road} — {issue.region}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${ISSUE_STATUS_BG[issue.status]}`}>
                    {issue.status}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatRelativeTime(issue.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* الطرق الأكثر تدهوراً */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              الطرق الأكثر تدهوراً
            </h3>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scroll pr-1">
            {worstRoads.map((road, idx) => (
              <div key={road.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground tabular-nums">#{idx + 1}</span>
                      {road.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">{road.region} · {road.highway} · {road.length} كم</p>
                  </div>
                  <span
                    className="text-lg font-extrabold tabular-nums shrink-0"
                    style={{ color: scoreColor(road.score) }}
                  >
                    {road.score}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${road.score}%`, backgroundColor: scoreColor(road.score) }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* أحدث الفحوصات */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-base flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" />
              أحدث الفحوصات الميدانية
            </h3>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scroll pr-1">
            {recentInspections.map((insp) => (
              <div key={insp.id} className="border rounded-lg p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div>
                    <p className="text-sm font-semibold">{insp.inspector}</p>
                    <p className="text-[11px] text-muted-foreground">{formatRelativeTime(insp.date)}</p>
                  </div>
                  <div
                    className="flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold"
                    style={{ backgroundColor: `${scoreColor(insp.score)}20`, color: scoreColor(insp.score) }}
                  >
                    <Gauge className="h-3 w-3" />
                    {insp.score}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{insp.notes}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
