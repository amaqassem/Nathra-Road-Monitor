'use client'

import { useEffect, useState, useCallback } from "react"
import { Loader2, Workflow, Zap, Clock, Building2, ArrowLeft, CheckCircle2, XCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useI18n } from "../lib/i18n"
import { toast } from "sonner"

interface Pipeline {
  id: string
  name: string; nameEn: string
  description: string; descriptionEn: string
  stages: string; stagesEn: string
  active: boolean
  throughput: number
  latency: number
  siteCount: number
}

export function PipelinesView() {
  const { t, lang } = useI18n()
  const [pipelines, setPipelines] = useState<Pipeline[] | null>(null)
  const [loading, setLoading] = useState(true)
  const isAr = lang === "ar"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/pipelines")
      const data = await res.json()
      setPipelines(data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (id: string, current: boolean) => {
    // تحديث متفائل
    setPipelines((prev) => prev?.map((p) => p.id === id ? { ...p, active: !current } : p) || null)
    try {
      await fetch("/api/pipelines", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !current }),
      })
      toast.success(isAr ? "تم تحديث خط الإنتاج" : "Pipeline updated")
    } catch {
      // تراجع
      setPipelines((prev) => prev?.map((p) => p.id === id ? { ...p, active: current } : p) || null)
      toast.error(isAr ? "فشل التحديث" : "Update failed")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!pipelines || pipelines.length === 0) {
    return <Card className="p-12 text-center text-muted-foreground">{t("pipelines.noResults")}</Card>
  }

  const activeCount = pipelines.filter((p) => p.active).length

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{t("pipelines.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("pipelines.subtitle")}</p>
        </div>
        <Badge variant="outline" className="gap-1.5 bg-emerald-500/5 border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {activeCount} / {pipelines.length} {isAr ? "نشط" : "active"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {pipelines.map((p) => {
          const name = isAr ? p.name : p.nameEn
          const desc = isAr ? p.description : p.descriptionEn
          const stages = (isAr ? p.stages : p.stagesEn).split("|")
          return (
            <Card key={p.id} className={`p-5 transition-shadow hover:shadow-md ${!p.active ? "opacity-70" : ""}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${p.active ? "gradient-nathra text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Workflow className="h-4.5 w-4.5" />
                    </div>
                    <span className="truncate">{name}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
                </div>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <Switch checked={p.active} onCheckedChange={() => toggle(p.id, p.active)} aria-label={t("pipelines.toggle")} />
                  <Badge variant="outline" className={`text-[10px] ${p.active ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25" : "bg-muted text-muted-foreground"}`}>
                    {p.active ? t("pipelines.active") : t("pipelines.inactive")}
                  </Badge>
                </div>
              </div>

              {/* مراحل خط الإنتاج */}
              <div className="mb-4">
                <p className="text-[10px] text-muted-foreground font-semibold mb-2">{t("pipelines.stages")}</p>
                <div className="flex items-center gap-1 flex-wrap" dir="ltr">
                  {stages.map((stage, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <div className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-semibold ${p.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-[9px] tabular-nums">{i + 1}</span>
                        {stage.trim()}
                      </div>
                      {i < stages.length - 1 && (
                        <ArrowLeft className="h-3 w-3 text-muted-foreground shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* مقاييس الأداء */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border p-2.5 text-center">
                  <Zap className="h-3.5 w-3.5 text-amber-500 mx-auto mb-1" />
                  <p className="text-sm font-extrabold tabular-nums">{p.throughput}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "إطار/ث" : "fps"}</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                  <Clock className="h-3.5 w-3.5 text-cyan-500 mx-auto mb-1" />
                  <p className="text-sm font-extrabold tabular-nums">{p.latency}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "مللي ث" : "ms"}</p>
                </div>
                <div className="rounded-lg border p-2.5 text-center">
                  <Building2 className="h-3.5 w-3.5 text-violet-500 mx-auto mb-1" />
                  <p className="text-sm font-extrabold tabular-nums">{p.siteCount}</p>
                  <p className="text-[9px] text-muted-foreground">{isAr ? "موقع" : "sites"}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* بطاقة معلوماتية */}
      <Card className="p-5 gradient-nathra-soft border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-nathra text-primary-foreground shrink-0">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base mb-1">{isAr ? "ما هي خطوط إنتاج الرؤية؟" : "What are Vision Pipelines?"}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "خطوط الإنتاج هي سلاسل قابلة للتكوين من نماذج الذكاء الاصطناعي تعمل بالتسلسل على بث الكاميرا. كل مرحلة تأخذ مخرجات المرحلة السابقة — من كشف الحركة إلى تتبع الأشخاص إلى تصنيف السلوك إلى إصدار التنبيه. يمكنك تفعيل أو إيقاف أي خط حسب احتياج كل موقع."
                : "Pipelines are configurable chains of AI models that run sequentially on camera streams. Each stage consumes the previous stage's output — from motion detection to person tracking to behavior classification to alerting. You can enable or disable any pipeline per site requirements."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
