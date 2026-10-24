'use client'

import { useState, useRef, useCallback } from "react"
import {
  Upload,
  Image as ImageIcon,
  Loader2,
  BrainCircuit,
  Gauge,
  AlertOctagon,
  ShieldAlert,
  Lightbulb,
  Wrench,
  FileText,
  Sparkles,
  X,
  Camera,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"
import { scoreColor, SEVERITY_BG } from "../lib/helpers"

interface AnalysisResult {
  overallScore?: number
  surfaceCondition?: string
  defects?: {
    type: string
    severity: string
    extent: string
    description: string
  }[]
  distresses?: string[]
  maintenanceUrgency?: string
  estimatedLife?: string
  recommendations?: string[]
  safetyRisk?: string
  summary?: string
  rawResponse?: string
}

export function AiAnalysisView() {
  const [image, setImage] = useState<string | null>(null)
  const [imageName, setImageName] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار ملف صورة صالح")
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("حجم الصورة كبير جداً (الحد الأقصى 8 ميجابايت)")
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      setImage(e.target?.result as string)
      setImageName(file.name)
      setResult(null)
    }
    reader.readAsDataURL(file)
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const analyze = async () => {
    if (!image) return
    setAnalyzing(true)
    setResult(null)
    try {
      const res = await fetch("/api/analyze-road", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.analysis)
        toast.success("اكتمل التحليل الذكي")
      } else {
        toast.error(data.error || "فشل التحليل")
      }
    } catch (e) {
      toast.error("حدث خطأ أثناء التحليل")
    } finally {
      setAnalyzing(false)
    }
  }

  const reset = () => {
    setImage(null)
    setImageName("")
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  const urgencyColor: Record<string, string> = {
    "فورية": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
    "عاجلة": "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
    "متوسطة": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    "وقائية": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  }

  const riskColor: Record<string, string> = {
    "منخفض": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    "متوسط": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
    "مرتفع": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-saudi text-primary-foreground">
          <BrainCircuit className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">التحليل الذكي لجودة الطرق</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            ارفع صورة للطريق وسيقوم الذكاء الاصطناعي بتحليل الرصف وكشف العيوب والتوصيات
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* منطقة الرفع */}
        <Card className="p-5">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            صورة الطريق
          </h3>

          {!image ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                dragging
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 hover:bg-accent/40"
              }`}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-8 w-8" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm">اسحب الصورة هنا أو انقر للاختيار</p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP — حتى 8 ميجابايت
                </p>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFile(file)
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative rounded-xl overflow-hidden border bg-muted/30">
                <img src={image} alt="صورة الطريق" className="w-full h-64 object-cover" />
                <button
                  onClick={reset}
                  className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white hover:bg-black/80 transition-colors"
                  aria-label="إزالة الصورة"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-2 py-1 text-white text-[11px]">
                  <ImageIcon className="h-3 w-3" />
                  <span className="max-w-[180px] truncate">{imageName}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={analyze}
                  disabled={analyzing}
                  className="flex-1 gap-2 gradient-saudi text-primary-foreground"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      جارٍ التحليل الذكي...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      تحليل الصورة
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={reset} disabled={analyzing}>
                  تغيير الصورة
                </Button>
              </div>
            </div>
          )}

          {/* نصائح */}
          <div className="mt-4 rounded-lg bg-muted/40 p-3">
            <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
              نصائح للحصول على أفضل تحليل
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-1 list-disc pr-4">
              <li>صوّر سطح الطريق من الأعلى بوضوح</li>
              <li>تأكد من إضاءة جيدة وعدم وجود ظلال قوية</li>
              <li>التقط صورة قريبة تكشف التفاصيل والعيوب</li>
            </ul>
          </div>
        </Card>

        {/* منطقة النتائج */}
        <Card className="p-5">
          <h3 className="font-bold text-base mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            نتائج التحليل
          </h3>

          {analyzing ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="relative">
                <BrainCircuit className="h-12 w-12 text-primary animate-pulse" />
                <Loader2 className="absolute -bottom-1 -left-1 h-5 w-5 animate-spin text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">
                الذكاء الاصطناعي يحلل الصورة...
              </p>
              <p className="text-[11px] text-muted-foreground">
                يكتشف العيوب ويقيّم الجودة
              </p>
            </div>
          ) : !result ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <BrainCircuit className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                ستظهر نتائج التحليل هنا بعد رفع صورة الطريق
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[560px] overflow-y-auto custom-scroll pr-1">
              {/* الدرجة الإجمالية */}
              {typeof result.overallScore === "number" && (
                <div className="flex items-center gap-4 rounded-xl p-4" style={{ backgroundColor: `${scoreColor(result.overallScore)}10` }}>
                  <div
                    className="flex h-20 w-20 flex-col items-center justify-center rounded-full border-4"
                    style={{ borderColor: scoreColor(result.overallScore) }}
                  >
                    <span className="text-2xl font-extrabold tabular-nums" style={{ color: scoreColor(result.overallScore) }}>
                      {result.overallScore}
                    </span>
                    <span className="text-[9px] text-muted-foreground">/100</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">درجة جودة الرصف</p>
                    <p className="text-lg font-bold" style={{ color: scoreColor(result.overallScore) }}>
                      {result.surfaceCondition || "—"}
                    </p>
                    {result.estimatedLife && (
                      <p className="text-[11px] text-muted-foreground mt-1">
                        العمر المتبقي: {result.estimatedLife}
                      </p>
                    )}
                  </div>
                  <Gauge className="h-8 w-8 opacity-30" style={{ color: scoreColor(result.overallScore) }} />
                </div>
              )}

              {/* الملخص */}
              {result.summary && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-xs font-semibold mb-1 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    الملخص التنفيذي
                  </p>
                  <p className="text-sm leading-relaxed">{result.summary}</p>
                </div>
              )}

              {/* مؤشرات الأمان والأولوية */}
              <div className="grid grid-cols-2 gap-2">
                {result.maintenanceUrgency && (
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <Wrench className="h-3 w-3" /> أولوية الصيانة
                    </p>
                    <Badge variant="outline" className={`text-xs ${urgencyColor[result.maintenanceUrgency] || ""}`}>
                      {result.maintenanceUrgency}
                    </Badge>
                  </div>
                )}
                {result.safetyRisk && (
                  <div className="rounded-lg border p-3">
                    <p className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1">
                      <ShieldAlert className="h-3 w-3" /> خطر السلامة
                    </p>
                    <Badge variant="outline" className={`text-xs ${riskColor[result.safetyRisk] || ""}`}>
                      {result.safetyRisk}
                    </Badge>
                  </div>
                )}
              </div>

              {/* العيوب المكتشفة */}
              {result.defects && result.defects.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <AlertOctagon className="h-3.5 w-3.5 text-amber-500" />
                    العيوب المكتشفة ({result.defects.length})
                  </p>
                  <div className="space-y-2">
                    {result.defects.map((d, i) => (
                      <div key={i} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold">{d.type}</span>
                          <Badge variant="outline" className={`text-[10px] ${SEVERITY_BG[d.severity] || ""}`}>
                            {d.severity}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-1">
                          النطاق: {d.extent}
                        </p>
                        <p className="text-xs">{d.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* التشوهات */}
              {result.distresses && result.distresses.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2">أنواع التشوهات المرصودة</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.distresses.map((d, i) => (
                      <Badge key={i} variant="secondary" className="text-[11px]">
                        {d}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* التوصيات */}
              {result.recommendations && result.recommendations.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5 text-primary" />
                    التوصيات
                  </p>
                  <ul className="space-y-1.5">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="text-xs flex items-start gap-2">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/15 text-primary text-[9px] font-bold shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* رد خام في حال فشل التحليل المنظم */}
              {result.rawResponse && !result.overallScore && (
                <div className="rounded-lg border p-3 text-xs whitespace-pre-wrap">
                  {result.rawResponse}
                </div>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
