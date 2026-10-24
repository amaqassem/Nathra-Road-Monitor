'use client'

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts"
import { Loader2, TrendingUp, Award, AlertCircle, Activity } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { scoreColor } from "../lib/helpers"

interface AnalyticsData {
  kpi: {
    totalRoads: number
    totalLength: number
    avgScore: number
    openIssues: number
    activeSensors: number
    totalSensors: number
    regions: number
  }
  statusDist: Record<string, number>
  issueTypeDist: { name: string; value: number }[]
  regionStats: { name: string; code: string; score: number; roads: number }[]
}

const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.5rem",
  fontSize: "12px",
  color: "var(--popover-foreground)",
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null)
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

  const { kpi, regionStats, issueTypeDist, statusDist } = data

  // بيانات الرادار: أعلى 7 مناطق
  const radarData = [...regionStats]
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map((r) => ({ region: r.name, score: r.score, roads: r.roads }))

  // بيانات التشتت: الطول مقابل الجودة
  const scatterData = regionStats.map((r) => ({
    name: r.name,
    x: r.roads,
    y: r.score,
    z: r.score,
  }))

  // بيانات الأعمدة: جودة المناطق
  const barData = [...regionStats]
    .sort((a, b) => b.score - a.score)
    .map((r) => ({ name: r.name, score: r.score }))

  // بيانات الأقطاب: توزيع الحالات
  const statusData = Object.entries(statusDist).map(([name, value]) => ({
    name,
    value,
  }))
  const statusColors: Record<string, string> = {
    "ممتاز": "#16a34a",
    "جيد": "#65a30d",
    "متوسط": "#d97706",
    "رديء": "#dc2626",
  }

  const issueColors = ["#16a34a", "#0d9488", "#d97706", "#dc2626", "#7c3aed", "#0369a1"]

  // مؤشرات صحية
  const goodRoads = (statusDist["ممتاز"] || 0) + (statusDist["جيد"] || 0)
  const goodRoadsPct = kpi.totalRoads > 0 ? Math.round((goodRoads / kpi.totalRoads) * 100) : 0
  const sensorPct = kpi.totalSensors > 0 ? Math.round((kpi.activeSensors / kpi.totalSensors) * 100) : 0

  const healthMetrics = [
    {
      label: "مؤشر الجودة الوطني",
      value: kpi.avgScore,
      max: 100,
      icon: Award,
      color: scoreColor(kpi.avgScore),
      desc: "متوسط جودة جميع الطرق",
    },
    {
      label: "نسبة التغطية",
      value: sensorPct,
      max: 100,
      icon: Activity,
      color: "#7c3aed",
      desc: "مستشعرات نشطة من الإجمالي",
    },
    {
      label: "نسبة الطرق السليمة",
      value: goodRoadsPct,
      max: 100,
      icon: AlertCircle,
      color: scoreColor(goodRoadsPct),
      desc: "طرق بحالة ممتازة أو جيدة",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">التحليلات المتقدمة</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          تحليل معمّق لأداء شبكة الطرق ومقارنة بين مناطق المملكة
        </p>
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
                    {m.value}
                    <span className="text-base text-muted-foreground">/{m.max}</span>
                  </p>
                </div>
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `${m.color}15`, color: m.color }}
                >
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden mb-1.5">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: m.color }}
                />
              </div>
              <p className="text-[11px] text-muted-foreground">{m.desc}</p>
            </Card>
          )
        })}
      </div>

      {/* الرادار + التشتت */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">مقارنة مناطق المملكة الرائدة</h3>
            <p className="text-xs text-muted-foreground">درجة الجودة لأعلى 7 مناطق</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <RadarChart data={radarData} outerRadius="75%">
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="region" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
              <Radar name="درجة الجودة" dataKey="score" stroke="#16a34a" fill="#16a34a" fillOpacity={0.35} strokeWidth={2} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">العلاقة بين الكثافة والجودة</h3>
            <p className="text-xs text-muted-foreground">عدد المقاطع مقابل متوسط الجودة لكل منطقة</p>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                dataKey="x"
                name="عدد المقاطع"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                label={{ value: "عدد المقاطع", position: "insideBottom", offset: -5, style: { fontSize: 11, fill: "var(--muted-foreground)" } }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="الجودة"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis type="number" dataKey="z" range={[80, 280]} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: number, name: string) => {
                  if (name === "الجودة") return [value, "الجودة"]
                  return [value, "عدد المقاطع"]
                }}
              />
              <Scatter data={scatterData} fill="#0d9488" />
            </ScatterChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* الأعمدة + الأقطاب */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">الترتيب التنافسي للمناطق</h3>
            <p className="text-xs text-muted-foreground">متوسط جودة الطرق لكل منطقة</p>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={barData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                angle={-35}
                textAnchor="end"
                height={60}
              />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={28}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={scoreColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <div className="mb-3">
            <h3 className="font-bold text-base">توزيع أنواع العيوب</h3>
            <p className="text-xs text-muted-foreground">حسب البلاغات المسجلة</p>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={issueTypeDist}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                paddingAngle={2}
                stroke="none"
              >
                {issueTypeDist.map((_, i) => (
                  <Cell key={i} fill={issueColors[i % issueColors.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            {issueTypeDist.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-[11px]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: issueColors[i % issueColors.length] }} />
                <span className="text-muted-foreground truncate">{d.name}</span>
                <span className="font-bold mr-auto">{d.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* ملخص تنفيذي */}
      <Card className="p-5 gradient-saudi-soft border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-saudi text-primary-foreground shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base mb-1">الملخص التنفيذي</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              تُظهر المؤشرات الوطنية متوسط جودة يبلغ{" "}
              <span className="font-bold" style={{ color: scoreColor(kpi.avgScore) }}>{kpi.avgScore}/100</span> عبر{" "}
              <span className="font-bold">{kpi.totalRoads}</span> مقطع طرقي بطول إجمالي{" "}
              <span className="font-bold">{kpi.totalLength}</span> كم في{" "}
              <span className="font-bold">{kpi.regions}</span> منطقة. يوجد حالياً{" "}
              <span className="font-bold text-amber-600 dark:text-amber-400">{kpi.openIssues}</span> بلاغ مفتوح، مع تشغيل{" "}
              <span className="font-bold">{kpi.activeSensors}</span> مستشعر ذكي. تتفوّق منطقة{" "}
              <span className="font-bold">{barData[0]?.name}</span> بأعلى درجة جودة، بينما تتطلب{" "}
              <span className="font-bold">{barData[barData.length - 1]?.name}</span> تدخلاً عاجلاً لتحسين البنية الطرقية.
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
