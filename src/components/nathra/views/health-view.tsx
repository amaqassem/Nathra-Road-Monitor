'use client'

import { useEffect, useState } from "react"
import { Loader2, Cpu, HardDrive, Activity, Zap, Wifi, AlertTriangle, CheckCircle2, Server } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useI18n } from "../lib/i18n"

const METRIC_META: Record<string, { icon: any; ar: string; en: string; color: string; max?: number; invert?: boolean }> = {
  camera_online: { icon: Server, ar: "كاميرات نشطة", en: "Cameras Online", color: "#10b981" },
  stream_fps: { icon: Activity, ar: "معدل الإطارات", en: "Stream FPS", color: "#f59e0b", max: 60 },
  network_latency: { icon: Wifi, ar: "زمن استجابة الشبكة", en: "Network Latency", color: "#8b5cf6", max: 200, invert: true },
  storage_usage: { icon: HardDrive, ar: "استخدام التخزين", en: "Storage Usage", color: "#f59e0b", max: 100 },
  ai_latency: { icon: Cpu, ar: "زمن معالجة AI", en: "AI Processing Latency", color: "#ec4899", max: 1000, invert: true },
  failed_jobs: { icon: AlertTriangle, ar: "مهام فاشلة", en: "Failed Jobs", color: "#dc2626", invert: true },
  api_availability: { icon: CheckCircle2, ar: "توفر API", en: "API Availability", color: "#10b981", max: 100 },
  system_uptime: { icon: Zap, ar: "نسبة تشغيل النظام", en: "System Uptime", color: "#0ea5e9", max: 100 },
}

export function HealthView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/health").then((r) => r.json()).then(setData).catch(console.error).finally(() => setLoading(false))
    const id = setInterval(() => fetch("/api/health").then((r) => r.json()).then(setData), 10000)
    return () => clearInterval(id)
  }, [])

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  if (!data) return null

  const statusColor: Record<string, string> = {
    ok: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    warning: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{isAr ? "مراقبة صحة النظام" : "System Health Monitor"}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{isAr ? "مراقبة لحظية لمقاييس البنية التشغيلية" : "Real-time operational infrastructure metrics"}</p>
        </div>
        <Badge variant="outline" className={`gap-1.5 ${statusColor[data.computed.overallStatus]}`}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
          </span>
          {isAr ? ({ ok: "سليم", warning: "تحذير", critical: "حرج" }[data.computed.overallStatus] || data.computed.overallStatus) : data.computed.overallStatus.toUpperCase()}
        </Badge>
      </div>

      {/* مقاييس محسوبة */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{data.computed.cameraOnline}</p><p className="text-[11px] text-muted-foreground">{isAr ? "كاميرات نشطة" : "Online"}</p></Card>
        <Card className="p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{data.computed.cameraOffline}</p><p className="text-[11px] text-muted-foreground">{isAr ? "كاميرات متوقفة" : "Offline"}</p></Card>
        <Card className="p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-cyan-600 dark:text-cyan-400">{data.computed.openIncidents}</p><p className="text-[11px] text-muted-foreground">{isAr ? "حوادث مفتوحة" : "Open Incidents"}</p></Card>
        <Card className="p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{data.computed.criticalIncidents}</p><p className="text-[11px] text-muted-foreground">{isAr ? "حرجة" : "Critical"}</p></Card>
        <Card className="p-3 text-center"><p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{data.computed.slaBreached}</p><p className="text-[11px] text-muted-foreground">{isAr ? "متأخرة SLA" : "SLA Breached"}</p></Card>
      </div>

      {/* مقاييس النظام */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {data.metrics.map((m: any) => {
          const meta = METRIC_META[m.metric] || { icon: Activity, ar: m.metric, en: m.metric, color: "#f59e0b" }
          const Icon = meta.icon
          const pct = meta.max ? Math.min(100, (m.value / meta.max) * 100) : (m.status === "ok" ? 75 : m.status === "warning" ? 50 : 25)
          return (
            <Card key={m.metric} className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                  <Icon className="h-5 w-5" />
                </div>
                <Badge variant="outline" className={`text-[9px] ${statusColor[m.status]}`}>{m.status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{isAr ? meta.ar : meta.en}</p>
              <p className="text-2xl font-extrabold tabular-nums mt-0.5">{m.value} <span className="text-xs text-muted-foreground font-normal">{m.unit}</span></p>
              <Progress value={pct} className="h-1.5 mt-2" style={{ backgroundColor: "var(--muted)" }} />
              {m.message && <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1.5">{m.message}</p>}
            </Card>
          )
        })}
      </div>

      <Card className="p-4 bg-amber-500/5 border-amber-500/20">
        <div className="flex items-start gap-2 text-xs">
          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-muted-foreground">
            {isAr
              ? "هذه المقاييس تجريبية لأغراض العرض. في الإنتاج، يتطلب هذا تكامل Prometheus/Grafana أو Agent مراقبة فعلي على خوادم البنية التحتية."
              : "These metrics are simulated for demonstration. Production requires Prometheus/Grafana integration or a real monitoring agent on infrastructure servers."}
          </p>
        </div>
      </Card>

      {/* بطاقة حالة خدمة الذكاء الاصطناعي */}
      <AiStatusCard />
    </div>
  )
}

// بطاقة حالة AI
function AiStatusCard() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    fetch("/api/ai-status").then((r) => r.json()).then(setStatus).catch(console.error)
  }, [])

  if (!status) return null

  const providerLabels: Record<string, { ar: string; en: string; color: string }> = {
    'zai-sdk': { ar: 'Z.ai SDK (محلي)', en: 'Z.ai SDK (local)', color: 'text-emerald-600 dark:text-emerald-400' },
    'zai-direct': { ar: 'Z.ai API مباشر', en: 'Z.ai Direct API', color: 'text-emerald-600 dark:text-emerald-400' },
    'local-fallback': { ar: 'احتياطي محلي', en: 'Local Fallback', color: 'text-amber-600 dark:text-amber-400' },
  }
  const prov = providerLabels[status.provider] || providerLabels['local-fallback']

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-base flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          {isAr ? "حالة خدمة الذكاء الاصطناعي" : "AI Service Status"}
        </h3>
        <Badge variant="outline" className={`text-[10px] ${status.available ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25' : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25'}`}>
          <span className="relative flex h-2 w-2 mr-1">
            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${status.available ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`} />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${status.available ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          </span>
          {isAr ? (status.available ? "متاح" : "احتياطي") : (status.available ? "Available" : "Fallback")}
        </Badge>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{isAr ? "المزود" : "Provider"}</span>
          <span className={`font-bold ${prov.color}`}>{isAr ? prov.ar : prov.en}</span>
        </div>
        <p className="text-xs text-muted-foreground">{isAr ? status.message_ar : status.message}</p>
        {status.env && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="rounded bg-muted/50 px-2 py-1.5">
              <span className="text-[10px] text-muted-foreground block">ZAI_API_KEY</span>
              <span className={`text-xs font-bold ${status.env.hasZaiApiKey ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                {status.env.hasZaiApiKey ? (isAr ? "مضبوط ✓" : "Set ✓") : (isAr ? "غير مضبوط" : "Not set")}
              </span>
            </div>
            <div className="rounded bg-muted/50 px-2 py-1.5">
              <span className="text-[10px] text-muted-foreground block">ZAI_BASE_URL</span>
              <span className={`text-xs font-bold ${status.env.hasZaiBaseUrl ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                {status.env.hasZaiBaseUrl ? (isAr ? "مضبوط ✓" : "Set ✓") : (isAr ? "افتراضي" : "Default")}
              </span>
            </div>
          </div>
        )}
        {status.provider === 'local-fallback' && (
          <div className="mt-3 rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-xs">
            <p className="font-semibold text-amber-700 dark:text-amber-400 mb-1">
              {isAr ? "⚠️ لتفعيل التحليل الكامل بالذكاء الاصطناعي:" : "⚠️ To enable full AI analysis:"}
            </p>
            <code className="text-[10px] block bg-black/30 rounded px-2 py-1 text-amber-200">
              ZAI_API_KEY=your-api-key
            </code>
            <p className="text-[10px] text-muted-foreground mt-2">
              {isAr
                ? "أضف هذا المتغير في لوحة تحكم Vercel أو ملف .env على Hostinger. راجع DEPLOY.md للتفاصيل."
                : "Add this variable in Vercel dashboard or .env file on Hostinger. See DEPLOY.md for details."}
            </p>
          </div>
        )}
      </div>
    </Card>
  )
}
