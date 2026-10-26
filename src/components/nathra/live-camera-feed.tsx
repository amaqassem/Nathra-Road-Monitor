'use client'

import { useEffect, useState } from "react"
import { Camera, Radio, AlertTriangle, ScanLine } from "lucide-react"

interface Detection {
  x: number  // نسبة 0-100
  y: number
  w: number
  h: number
  label: string
  confidence: number
  color: string
}

interface LiveCameraFeedProps {
  cameraId: string
  imagePath: string
  zone: string
  status: string
  resolution: string
  fps: number
  width?: number
  height?: number
  showDetections?: boolean
  className?: string
}

<<<<<<< HEAD
const DETECTION_COLORS = ["#f59e0b", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"]
=======
const DETECTION_COLORS = ["#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899"]
>>>>>>> 31cd72b5a77be501df5bc1ccbf5eaf6070e480e0

// مولّد ثابت لكل كاميرا (كشف متناسق)
function seededRandom(seed: string, i: number): number {
  let h = 0
  for (let c = 0; c < seed.length; c++) h = (h * 31 + seed.charCodeAt(c)) | 0
  const x = Math.sin(h + i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function LiveCameraFeed({
  cameraId,
  imagePath,
  zone,
  status,
  resolution,
  fps,
  width = 320,
  height = 180,
  showDetections = true,
  className,
}: LiveCameraFeedProps) {
  const [currentTime, setCurrentTime] = useState("")
  const [detections, setDetections] = useState<Detection[]>(() => {
    if (!showDetections) return []
    const count = 1 + Math.floor(seededRandom(cameraId, 0) * 3)
    const arr: Detection[] = []
    for (let i = 0; i < count; i++) {
      const r1 = seededRandom(cameraId, i + 1)
      const r2 = seededRandom(cameraId, i + 10)
      const r3 = seededRandom(cameraId, i + 20)
      arr.push({
        x: 10 + r1 * 60,
        y: 20 + r2 * 50,
        w: 12 + r3 * 8,
        h: 20 + r1 * 12,
        label: `P${i + 1}`,
        confidence: Math.round(82 + r3 * 16),
        color: DETECTION_COLORS[i % DETECTION_COLORS.length],
      })
    }
    return arr
  })
  const [imgError, setImgError] = useState(false)
  const isOnline = status === "online"

  // الطابع الزمني الحي
  useEffect(() => {
    if (!isOnline) return
    const update = () => {
      const d = new Date()
      const pad = (n: number) => String(n).padStart(2, "0")
      setCurrentTime(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [isOnline])

  // تحديث مواقع الكشوفات كل 1.2s (محاكاة تتبع لحظي)
  useEffect(() => {
    if (!isOnline || !showDetections) return
    let tick = 0
    const id = setInterval(() => {
      tick += 1
      setDetections((prev) =>
        prev.map((d, i) => {
          const r = seededRandom(cameraId + "move", tick + i)
          const r2 = seededRandom(cameraId + "move2", tick + i)
          return {
            ...d,
            x: Math.max(2, Math.min(82, d.x + (r - 0.5) * 6)),
            y: Math.max(15, Math.min(65, d.y + (r2 - 0.5) * 4)),
            confidence: Math.max(78, Math.min(99, d.confidence + Math.round((r - 0.5) * 4))),
          }
        })
      )
    }, 1200)
    return () => clearInterval(id)
  }, [cameraId, isOnline, showDetections])

  if (!isOnline) {
    return (
      <div
        className={`relative bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-500 ${className || ""}`}
        style={{ width: "100%", aspectRatio: `${width}/${height}` }}
      >
        <Camera className="h-8 w-8 opacity-30" />
        <span className="text-[10px]">{status === "maintenance" ? "Under Maintenance" : "No Signal"}</span>
      </div>
    )
  }

  return (
    <div
      className={`relative bg-slate-950 overflow-hidden ${className || ""}`}
      style={{ width: "100%", aspectRatio: `${width}/${height}` }}
    >
      {/* الصورة الحقيقية */}
      {!imgError ? (
        <img
          src={imagePath}
          alt={zone}
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: "contrast(1.05) brightness(0.95) saturate(0.9)" }}
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-slate-900 flex items-center justify-center">
          <Camera className="h-8 w-8 text-slate-600" />
        </div>
      )}

      {/* تدرج بسيط لتحسين ظهور الـ overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40 pointer-events-none" />

      {/* شبكة كاميرا خفيفة */}
      <div className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(6,182,212,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.15) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* bounding boxes للكشوفات */}
      {showDetections && detections.map((d, i) => (
        <div
          key={i}
          className="absolute transition-all duration-1000 ease-linear pointer-events-none"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: `${d.w}%`,
            height: `${d.h}%`,
          }}
        >
          {/* الإطار */}
          <div className="absolute inset-0 border-2 rounded-sm" style={{ borderColor: d.color }} />
          {/* الزوايا */}
          <div className="absolute top-0 left-0 w-2 h-2 border-t-[3px] border-l-[3px]" style={{ borderColor: d.color }} />
          <div className="absolute top-0 right-0 w-2 h-2 border-t-[3px] border-r-[3px]" style={{ borderColor: d.color }} />
          <div className="absolute bottom-0 left-0 w-2 h-2 border-b-[3px] border-l-[3px]" style={{ borderColor: d.color }} />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b-[3px] border-r-[3px]" style={{ borderColor: d.color }} />
          {/* الملصق */}
          <div
            className="absolute -top-3.5 left-0 px-1 text-[8px] font-mono font-bold leading-tight rounded-sm whitespace-nowrap"
            style={{ backgroundColor: d.color, color: "#000" }}
          >
            {d.label} {d.confidence}%
          </div>
        </div>
      ))}

      {/* خط المسح */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-x-0 h-10 scan-line"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(6,182,212,0.18), transparent)" }}
        />
      </div>

      {/* overlay معلومات */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-white text-[9px] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 rec-blink" />
        <span className="font-bold">REC</span>
      </div>

      <div className="absolute top-1.5 left-1.5 rounded bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-white text-[9px] font-mono">
        {resolution} · {fps}fps
      </div>

      {showDetections && detections.length > 0 && (
        <div className="absolute bottom-1.5 left-1.5 rounded bg-cyan-500/25 backdrop-blur-sm border border-cyan-400/40 px-1.5 py-0.5 text-cyan-100 text-[9px] font-mono font-bold flex items-center gap-1">
          <ScanLine className="h-2.5 w-2.5" />
          {detections.length} DETECTED
        </div>
      )}

      <div className="absolute bottom-1.5 right-1.5 rounded bg-black/70 backdrop-blur-sm px-1.5 py-0.5 text-white text-[9px] font-mono tabular-nums">
        {currentTime}
      </div>

      {/* اسم المنطقة */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/15 text-[11px] font-bold uppercase tracking-widest pointer-events-none">
        {zone}
      </div>
    </div>
  )
}
