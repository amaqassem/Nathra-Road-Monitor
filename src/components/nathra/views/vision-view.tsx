'use client'

import { useState, useRef, useCallback } from "react"
import {
  Upload, Loader2, BrainCircuit, Sparkles, X, Camera, Users,
  ShieldAlert, Lightbulb, FileText, Activity, Lock, Smile,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useI18n } from "../lib/i18n"
import { SEVERITY_BG } from "../lib/helpers"
import { toast } from "sonner"

interface AnalysisResult {
  overallConfidence?: number
  peopleCount?: number
  riskLevel?: string
  urgency?: string
  detectedObjects?: { label: string; count: number; confidence: number }[]
  behaviors?: { type: string; confidence: number; description: string }[]
  emotions?: { emotion: string; percentage: number }[]
  summary?: string
  recommendations?: string[]
  compliance?: { pdplRelevant: boolean; notes: string }
  rawResponse?: string
}

const urgencyColor: Record<string, string> = {
  preventive: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  routine: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
  priority: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  immediate: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
}
const riskColor: Record<string, string> = {
  low: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
}

export function VisionView() {
  const { t, lang } = useI18n()
  const [image, setImage] = useState<string | null>(null)
  const [imageName, setImageName] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const isAr = lang === "ar"

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) { toast.error(isAr ? "ملف صورة غير صالح" : "Invalid image"); return }
    if (file.size > 8 * 1024 * 1024) { toast.error(isAr ? "حجم كبير (الحد 8MB)" : "Max 8MB"); return }
    const reader = new FileReader()
    reader.onload = (e) => { setImage(e.target?.result as string); setImageName(file.name); setResult(null) }
    reader.readAsDataURL(file)
  }, [isAr])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const analyze = async () => {
    if (!image) return
    setAnalyzing(true); setResult(null)
    try {
      const res = await fetch("/api/analyze-vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.analysis)
        toast.success(isAr ? "اكتمل التحليل" : "Analysis complete")
      } else {
        // رسالة خطأ واضحة حسب النوع
        const errMsg = data.retry
          ? (isAr ? "الخدمة مشغولة الآن، حاول بعد لحظات" : "Service busy, retry shortly")
          : data.setup
          ? (isAr ? "خدمة AI غير مُعدة. راجع /api/ai-status" : "AI service not configured. Check /api/ai-status")
          : (data.error || (isAr ? "فشل التحليل" : "Failed"))
        toast.error(errMsg, {
          description: data.setup,
          duration: 6000,
        })
      }
    } catch { toast.error(isAr ? "خطأ في الاتصال" : "Connection error") }
    finally { setAnalyzing(false) }
  }

  const reset = () => {
    setImage(null); setImageName(""); setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-nathra text-primary-foreground">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{t("vision.title")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("vision.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* منطقة الرفع */}
        <Card className="p-5">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />{t("vision.image")}
          </h3>

          {!image ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-accent/40"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">{t("vision.drop")}</p>
                <p className="text-xs text-muted-foreground mt-1">{t("vision.formats")}</p>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border bg-slate-950">
                <img src={image} alt="surveillance" className="w-full h-64 object-cover" />
                <button onClick={reset} className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors" aria-label="remove">
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute top-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-white text-[11px]">
                  <Camera className="h-3 w-3" /><span className="max-w-[180px] truncate">{imageName}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={analyze} disabled={analyzing} className="flex-1 gap-2 gradient-nathra text-primary-foreground">
                  {analyzing ? (<><Loader2 className="h-4 w-4 animate-spin" />{t("vision.analyzing")}</>)
                    : (<><Sparkles className="h-4 w-4" />{t("vision.analyze")}</>)}
                </Button>
                <Button variant="outline" onClick={reset} disabled={analyzing}>{t("vision.changeImage")}</Button>
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />{t("vision.tips")}
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pr-4">
              <li>{t("vision.tip1")}</li>
              <li>{t("vision.tip2")}</li>
              <li>{t("vision.tip3")}</li>
            </ul>
          </div>
        </Card>

        {/* النتائج */}
        <Card className="p-5">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />{t("vision.results")}
          </h3>

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative">
                <BrainCircuit className="h-12 w-12 text-primary animate-pulse" />
                <Loader2 className="absolute -bottom-1 -left-1 h-5 w-5 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">{t("vision.analyzing")}</p>
              <p className="text-[11px] text-muted-foreground">{t("vision.analyzingSub")}</p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BrainCircuit className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t("vision.waiting")}</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[560px] overflow-y-auto custom-scroll pr-1">
              {/* الثقة + عدد الأشخاص */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border p-4" style={{ backgroundColor: `oklch(0.55 0.14 210 / 0.08)` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-xs text-muted-foreground">{t("vision.score")}</span>
                  </div>
                  <p className="text-3xl font-extrabold tabular-nums text-primary">{result.overallConfidence ?? "--"}<span className="text-base text-muted-foreground">%</span></p>
                </div>
                <div className="rounded-xl border p-4 bg-violet-500/5">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-violet-500" />
                    <span className="text-xs text-muted-foreground">{t("vision.peopleDetected")}</span>
                  </div>
                  <p className="text-3xl font-extrabold tabular-nums text-violet-600 dark:text-violet-400">{result.peopleCount ?? 0}</p>
                </div>
              </div>

              {/* الملخص */}
              {result.summary && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />{t("vision.summary")}
                  </p>
                  <p className="text-sm leading-relaxed">{result.summary}</p>
                </div>
              )}

              {/* الخطر والأولوية */}
              <div className="grid grid-cols-2 gap-2">
                {result.riskLevel && (
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" />{t("vision.riskLevel")}
                    </p>
                    <Badge variant="outline" className={`text-xs ${riskColor[result.riskLevel] || ""}`}>
                      {t(`status.${result.riskLevel}` as never) || result.riskLevel}
                    </Badge>
                  </div>
                )}
                {result.urgency && (
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />{t("vision.urgency")}
                    </p>
                    <Badge variant="outline" className={`text-xs ${urgencyColor[result.urgency] || ""}`}>
                      {isAr ? ({ preventive: "وقائية", routine: "اعتيادية", priority: "أولوية", immediate: "فورية" }[result.urgency] || result.urgency) : result.urgency}
                    </Badge>
                  </div>
                )}
              </div>

              {/* العناصر المكتشفة */}
              {result.detectedObjects && result.detectedObjects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <Camera className="h-3.5 w-3.5 text-cyan-500" />{t("vision.objects")}
                  </p>
                  <div className="space-y-1.5">
                    {result.detectedObjects.map((o, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border p-2">
                        <span className="text-xs font-semibold flex-1">{o.label}</span>
                        <Badge variant="secondary" className="text-[10px]">×{o.count}</Badge>
                        <div className="flex items-center gap-1 w-20">
                          <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${o.confidence}%` }} />
                          </div>
                          <span className="text-[10px] font-bold tabular-nums">{o.confidence}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* السلوكيات */}
              {result.behaviors && result.behaviors.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-amber-500" />{t("vision.behaviors")}
                  </p>
                  <div className="space-y-1.5">
                    {result.behaviors.map((b, i) => (
                      <div key={i} className="rounded-lg border p-2.5">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold">{b.type}</span>
                          <Badge variant="outline" className={`text-[10px] ${SEVERITY_BG[(b.confidence > 80 ? "high" : "medium") as never]}`}>
                            {b.confidence}%
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{b.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* المشاعر */}
              {result.emotions && result.emotions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <Smile className="h-3.5 w-3.5 text-violet-500" />{t("vision.emotions")}
                  </p>
                  <div className="space-y-1.5">
                    {result.emotions.map((e, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs w-20 capitalize">{e.emotion}</span>
                        <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-violet-500" style={{ width: `${e.percentage}%` }} />
                        </div>
                        <span className="text-[10px] font-bold tabular-nums w-8 text-left">{e.percentage}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* التوصيات */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />{t("vision.recommendations")}
                  </p>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* الامتثال */}
              {result.compliance && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5 text-emerald-500" />{isAr ? "الامتثال وحماية البيانات" : "Data Compliance"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{result.compliance.notes}</p>
                </div>
              )}

              {result.rawResponse && !result.overallConfidence && (
                <div className="rounded-lg border p-3 text-xs whitespace-pre-wrap">{result.rawResponse}</div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
