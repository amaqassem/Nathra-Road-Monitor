'use client'

import { useEffect, useState, useRef } from "react"
import {
  BrainCircuit, Loader2, ScanLine, Building2, AlertTriangle,
  CheckCircle2, Radio, Cctv, Zap,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useI18n } from "./lib/i18n"
import { SEVERITY_BG, formatRelativeTime } from "./lib/helpers"

interface ScanRecord {
  id: string
  cameraName: string
  cameraNameEn: string
  imagePath: string
  zone: string
  zoneEn: string
  siteName: string
  siteNameEn: string
  hasViolation: boolean
  riskLevel?: string
  summary?: string
  violationType?: string
  violationTypeEn?: string
  severity?: string
  confidence?: number
  authority?: string
  authorityEn?: string
  alertId?: string
  usedFallback?: boolean
  timestamp: string
}

export function AutoScanPanel() {
  const { t, lang } = useI18n()
  const isAr = lang === "ar"
  const [scanning, setScanning] = useState(false)
  const [history, setHistory] = useState<ScanRecord[]>([])
  const [autoMode, setAutoMode] = useState(true)
  const [stats, setStats] = useState({ total: 0, violations: 0, clean: 0 })
  const [lastScanAt, setLastScanAt] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const runScan = async () => {
    setScanning(true)
    try {
      const res = await fetch("/api/auto-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      if (data.success) {
        const record: ScanRecord = {
          id: `scan-${Date.now()}`,
          cameraName: data.camera.name,
          cameraNameEn: data.camera.nameEn,
          imagePath: data.camera.imagePath,
          zone: data.camera.zone,
          zoneEn: data.camera.zoneEn,
          siteName: data.camera.site.name,
          siteNameEn: data.camera.site.nameEn,
          hasViolation: data.analysis?.hasViolation || data.alertCreated,
          riskLevel: data.analysis?.riskLevel,
          summary: data.analysis?.summary,
          violationType: data.alert?.type,
          violationTypeEn: data.alert?.typeEn,
          severity: data.alert?.severity,
          confidence: data.alert?.confidence,
          authority: data.alert?.authority,
          authorityEn: data.alert?.authorityEn,
          alertId: data.alert?.id,
          usedFallback: data.usedFallback,
          timestamp: new Date().toISOString(),
        }
        setHistory((prev) => [record, ...prev].slice(0, 4))
        setStats((s) => ({
          total: s.total + 1,
          violations: s.violations + (record.hasViolation ? 1 : 0),
          clean: s.clean + (record.hasViolation ? 0 : 1),
        }))
        setLastScanAt(record.timestamp)
      }
    } catch (e) {
      console.error("Auto-scan error:", e)
    } finally {
      setScanning(false)
    }
  }

  // الفحص التلقائي الدوري
  useEffect(() => {
    if (!autoMode) return
    // أول فحص بعد 3 ثوان
    const initial = setTimeout(() => {
      runScan()
    }, 3000)
    return () => clearTimeout(initial)
  }, [autoMode])

  // جدولة الفحص التالي بعد انتهاء الحالي
  useEffect(() => {
    if (!autoMode || scanning) return
    if (stats.total === 0) return // ما بدأنا بعد
    const next = setTimeout(() => {
      runScan()
    }, 30000) // كل 30 ثانية
    timerRef.current = next
    return () => clearTimeout(next)
  }, [autoMode, scanning, stats.total])

  return (
    <Card className="overflow-hidden border-primary/20">
      {/* الرأس */}
      <div className="flex items-center justify-between bg-primary/5 px-4 py-2.5 border-b border-primary/15">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${scanning ? "gradient-nathra" : "bg-primary/15 text-primary"}`}>
              {scanning ? <Loader2 className="h-4 w-4 animate-spin text-primary-foreground" /> : <BrainCircuit className="h-4 w-4" />}
            </div>
            {scanning && (
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
              </span>
            )}
          </div>
          <div>
            <h3 className="font-bold text-sm flex items-center gap-1.5">
              {isAr ? "المعالجة التلقائية للمخالفات" : "Automatic Violation Processing"}
            </h3>
            <p className="text-[10px] text-muted-foreground">
              {scanning
                ? (isAr ? "جارٍ فحص كاميرا..." : "Scanning camera...")
                : lastScanAt
                ? (isAr ? `آخر فحص: ${formatRelativeTime(lastScanAt, lang)}` : `Last scan: ${formatRelativeTime(lastScanAt, lang)}`)
                : (isAr ? "بانتظار بدء الفحص" : "Waiting to start")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={scanning}
            onClick={runScan}
            className="gap-1.5 h-7 text-[11px]"
          >
            <ScanLine className="h-3 w-3" />
            {isAr ? "فحص فوري" : "Scan now"}
          </Button>
          <button
            onClick={() => setAutoMode((v) => !v)}
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
              autoMode ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground"
            }`}
          >
            <span className={`relative flex h-1.5 w-1.5 ${autoMode ? "" : "opacity-40"}`}>
              {autoMode && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${autoMode ? "bg-emerald-500" : "bg-muted-foreground"}`} />
            </span>
            {autoMode ? (isAr ? "تلقائي" : "Auto") : (isAr ? "متوقف" : "Off")}
          </button>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-3 gap-px bg-border">
        <div className="bg-card p-2.5 text-center">
          <p className="text-lg font-extrabold tabular-nums">{stats.total}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "فحوصات" : "Scans"}</p>
        </div>
        <div className="bg-card p-2.5 text-center">
          <p className="text-lg font-extrabold tabular-nums text-red-600 dark:text-red-400">{stats.violations}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "مخالفات" : "Violations"}</p>
        </div>
        <div className="bg-card p-2.5 text-center">
          <p className="text-lg font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{stats.clean}</p>
          <p className="text-[10px] text-muted-foreground">{isAr ? "سليمة" : "Clean"}</p>
        </div>
      </div>

      {/* سجل الفحوصات */}
      <div className="max-h-[300px] overflow-y-auto custom-scroll">
        {history.length === 0 && !scanning ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
            <ScanLine className="h-8 w-8 opacity-30" />
            <p className="text-xs">{isAr ? "سيبدأ الفحص التلقائي قريباً..." : "Auto-scan will start shortly..."}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {scanning && (
              <div className="flex items-center gap-3 px-4 py-3 bg-primary/5">
                <div className="relative w-16 h-9 rounded bg-slate-950 overflow-hidden shrink-0">
                  <div className="absolute inset-0 grid-bg" />
                  <div className="absolute inset-x-0 h-4 scan-line" style={{ background: "linear-gradient(to bottom, transparent, rgba(6,182,212,0.4), transparent)" }} />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold">{isAr ? "جارٍ تحليل الإطار بالذكاء الاصطناعي..." : "Analyzing frame with AI..."}</p>
                  <p className="text-[10px] text-muted-foreground">{isAr ? "كشف المخالفات وتحديد الجهة المختصة" : "Detecting violations and routing to authority"}</p>
                </div>
                <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />
              </div>
            )}
            {history.map((rec) => {
              const camName = isAr ? rec.cameraName : rec.cameraNameEn
              const siteName = isAr ? rec.siteName : rec.siteNameEn
              const zone = isAr ? rec.zone : rec.zoneEn
              const authority = isAr ? rec.authority : rec.authorityEn
              const vType = isAr ? rec.violationType : rec.violationTypeEn
              return (
                <div key={rec.id} className="px-4 py-3 hover:bg-accent/30 transition-colors animate-fade-up">
                  <div className="flex items-start gap-3">
                    {/* صورة الكاميرا المصغرة */}
                    <div className="relative w-20 h-12 rounded overflow-hidden shrink-0 border border-border">
                      <img src={rec.imagePath} alt={zone} className="w-full h-full object-cover" />
                      <div className="absolute top-0.5 right-0.5 flex items-center gap-0.5 rounded bg-black/70 px-1 text-white text-[8px] font-mono">
                        <span className="h-1 w-1 rounded-full bg-red-500 rec-blink" />
                      </div>
                      {rec.hasViolation && (
                        <div className="absolute inset-0 ring-2 ring-red-500/60 rounded" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {rec.hasViolation ? (
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span className="text-xs font-semibold truncate">{camName}</span>
                        {rec.hasViolation ? (
                          <Badge variant="outline" className={`text-[9px] ml-auto shrink-0 ${SEVERITY_BG[rec.severity as keyof typeof SEVERITY_BG]}`}>
                            {rec.severity}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9px] ml-auto shrink-0 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25">
                            {isAr ? "سليم" : "Clean"}
                          </Badge>
                        )}
                      </div>
                      {rec.usedFallback && (
                        <div className="flex items-center gap-1 text-[9px] text-amber-600 dark:text-amber-400 mb-0.5">
                          <AlertTriangle className="h-2.5 w-2.5" />
                          {isAr ? "تحليل محلي احتياطي — اضبط GEMINI_API_KEY للتحليل الكامل" : "Local fallback — set GEMINI_API_KEY for full AI"}
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1 mb-1">
                        <Cctv className="h-2.5 w-2.5" />{zone} · {siteName}
                      </p>
                      {rec.summary && (
                        <p className="text-[11px] line-clamp-2 mb-1.5">{rec.summary}</p>
                      )}
                      {rec.hasViolation && authority && (
                        <div className="flex items-center gap-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[10px]">
                          <Building2 className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-muted-foreground">{isAr ? "حُوّل إلى:" : "Routed to:"}</span>
                          <span className="font-bold text-amber-700 dark:text-amber-400 truncate">{authority}</span>
                          {rec.alertId && (
                            <Badge variant="outline" className="text-[8px] ml-auto shrink-0 bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/25">
                              <Zap className="h-2 w-2 ml-0.5" />
                              {isAr ? "بلاغ تلقائي" : "Auto-alert"}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
