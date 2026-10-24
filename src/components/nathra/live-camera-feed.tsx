'use client'

import { useEffect, useRef, useState, useCallback } from "react"
import { Camera, Radio, AlertTriangle } from "lucide-react"

interface Person {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  bbox: { w: number; h: number }
  id: number
  emotion: string
}

interface Detection {
  x: number
  y: number
  w: number
  h: number
  confidence: number
  label: string
}

interface LiveCameraFeedProps {
  cameraId: string
  cameraName: string
  zone: string
  model: string
  status: string
  resolution: string
  fps: number
  width?: number
  height?: number
  showDetections?: boolean
  useWebcam?: boolean
  className?: string
}

const PERSON_COLORS = [
  "#06b6d4", "#8b5cf6", "#10b981", "#f59e0b", "#ec4899", "#0ea5e9",
]

const EMOTIONS = ["neutral", "neutral", "neutral", "calm", "happy", "focused"]

// مولّد أرقام شبه عشوائي ثابت لكل كاميرا (حركة متسقة)
function seededRandom(seed: string, i: number): number {
  let h = 0
  for (let c = 0; c < seed.length; c++) h = (h * 31 + seed.charCodeAt(c)) | 0
  const x = Math.sin(h + i * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

export function LiveCameraFeed({
  cameraId,
  cameraName,
  zone,
  model,
  status,
  resolution,
  fps,
  width = 320,
  height = 180,
  showDetections = true,
  useWebcam = false,
  className,
}: LiveCameraFeedProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const animRef = useRef<number>(0)
  const personsRef = useRef<Person[]>([])
  const startTimeRef = useRef<number>(Date.now())
  const [webcamError, setWebcamError] = useState<string | null>(null)
  const [webcamReady, setWebcamReady] = useState(false)
  const [currentTime, setCurrentTime] = useState("")
  const [detectionCount, setDetectionCount] = useState(0)
  const isOnline = status === "online"

  // تهيئة الأشخاص المتحركين
  useEffect(() => {
    const count = 2 + Math.floor(seededRandom(cameraId, 0) * 4)
    const persons: Person[] = []
    for (let i = 0; i < count; i++) {
      const r1 = seededRandom(cameraId, i + 1)
      const r2 = seededRandom(cameraId, i + 10)
      const r3 = seededRandom(cameraId, i + 20)
      const r4 = seededRandom(cameraId, i + 30)
      persons.push({
        x: r1 * width,
        y: 40 + r2 * (height - 80),
        vx: (r3 - 0.5) * 0.6,
        vy: (r4 - 0.5) * 0.3,
        color: PERSON_COLORS[i % PERSON_COLORS.length],
        bbox: { w: 14 + r3 * 6, h: 22 + r4 * 8 },
        id: i + 1,
        emotion: EMOTIONS[Math.floor(r1 * EMOTIONS.length)],
      })
    }
    personsRef.current = persons
  }, [cameraId, width, height])

  // الـ webcam
  useEffect(() => {
    if (!useWebcam) return
    let stream: MediaStream | null = null
    let active = true

    async function startWebcam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, facingMode: "user" },
          audio: false,
        })
        if (!active) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play().catch(() => {})
          setWebcamReady(true)
        }
      } catch (e: any) {
        setWebcamError(e?.name === "NotAllowedError" ? "denied" : "unavailable")
      }
    }
    startWebcam()
    return () => {
      active = false
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [useWebcam])

  // حلقة الرسم
  useEffect(() => {
    if (!isOnline) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    let lastDetect = 0
    let currentDetections: Detection[] = []

    const draw = (now: number) => {
      const t = (now - startTimeRef.current) / 1000

      // خلفية متدرجة (محاكاة مشهد داخلي/خارجي)
      const bg = ctx.createLinearGradient(0, 0, 0, height)
      bg.addColorStop(0, "#0f172a")
      bg.addColorStop(0.6, "#1e293b")
      bg.addColorStop(1, "#0f172a")
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, width, height)

      // أرضية بمنظور
      ctx.strokeStyle = "rgba(6, 182, 212, 0.08)"
      ctx.lineWidth = 1
      for (let i = 0; i < 8; i++) {
        const y = height * 0.5 + (i * i) * 3
        if (y > height) break
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(width, y)
        ctx.stroke()
      }
      // خطوط عمودية للمنظور
      for (let i = -4; i <= 4; i++) {
        ctx.beginPath()
        ctx.moveTo(width / 2 + i * 20, height * 0.5)
        ctx.lineTo(width / 2 + i * 80, height)
        ctx.stroke()
      }

      // نقاط ضوضاء خفيفة (محاكاة حساسية الكاميرا)
      ctx.fillStyle = "rgba(255,255,255,0.04)"
      for (let i = 0; i < 30; i++) {
        const r = seededRandom(cameraId + "n", i + Math.floor(t * 4))
        const r2 = seededRandom(cameraId + "n2", i + Math.floor(t * 4))
        ctx.fillRect(r * width, r2 * height, 1, 1)
      }

      // تحديث ورسم الأشخاص
      const persons = personsRef.current
      persons.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        // ارتداد
        if (p.x < 10 || p.x > width - 10) p.vx *= -1
        if (p.y < 40 || p.y > height - 30) p.vy *= -1
        // تغيير عشوائي بسيط بالاتجاه
        if (seededRandom(cameraId + p.id, Math.floor(t * 2)) > 0.97) {
          p.vx += (seededRandom(cameraId, t) - 0.5) * 0.3
          p.vx = Math.max(-1, Math.min(1, p.vx))
        }
      })

      // تحديث الـ detections كل ~400ms
      if (now - lastDetect > 400) {
        lastDetect = now
        currentDetections = persons.map((p) => ({
          x: p.x - p.bbox.w / 2,
          y: p.y - p.bbox.h,
          w: p.bbox.w,
          h: p.bbox.h,
          confidence: Math.round(85 + seededRandom(cameraId + p.id, t) * 13),
          label: `P${p.id}`,
        }))
        setDetectionCount(currentDetections.length)
      }

      // رسم الـ bounding boxes
      if (showDetections) {
        currentDetections.forEach((d, i) => {
          const color = PERSON_COLORS[i % PERSON_COLORS.length]
          ctx.strokeStyle = color
          ctx.lineWidth = 1.5
          ctx.strokeRect(d.x, d.y, d.w, d.h)
          // زوايا ملوّنة (نمط AI detection)
          const cornerLen = 4
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(d.x, d.y + cornerLen); ctx.lineTo(d.x, d.y); ctx.lineTo(d.x + cornerLen, d.y)
          ctx.moveTo(d.x + d.w - cornerLen, d.y); ctx.lineTo(d.x + d.w, d.y); ctx.lineTo(d.x + d.w, d.y + cornerLen)
          ctx.moveTo(d.x, d.y + d.h - cornerLen); ctx.lineTo(d.x, d.y + d.h); ctx.lineTo(d.x + cornerLen, d.y + d.h)
          ctx.moveTo(d.x + d.w - cornerLen, d.y + d.h); ctx.lineTo(d.x + d.w, d.y + d.h); ctx.lineTo(d.x + d.w, d.y + d.h - cornerLen)
          ctx.stroke()
          // الملصق
          ctx.fillStyle = color
          ctx.font = "bold 8px monospace"
          ctx.fillRect(d.x, d.y - 9, 26, 8)
          ctx.fillStyle = "#000"
          ctx.fillText(`${d.label} ${d.confidence}%`, d.x + 1, d.y - 2)
        })
      }

      // خط المسح
      const scanY = ((t * 60) % (height + 40)) - 20
      const scanGrad = ctx.createLinearGradient(0, scanY - 20, 0, scanY + 20)
      scanGrad.addColorStop(0, "rgba(6, 182, 212, 0)")
      scanGrad.addColorStop(0.5, "rgba(6, 182, 212, 0.12)")
      scanGrad.addColorStop(1, "rgba(6, 182, 212, 0)")
      ctx.fillStyle = scanGrad
      ctx.fillRect(0, scanY - 20, width, 40)

      // شبكة خفيفة
      ctx.strokeStyle = "rgba(6, 182, 212, 0.05)"
      ctx.lineWidth = 1
      for (let x = 0; x < width; x += 24) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke()
      }
      for (let y = 0; y < height; y += 24) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke()
      }

      animRef.current = requestAnimationFrame(draw)
    }
    animRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animRef.current)
  }, [cameraId, width, height, isOnline, showDetections])

  // تحديث الطابع الزمني
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

  if (!isOnline) {
    return (
      <div
        className={`relative bg-slate-950 flex flex-col items-center justify-center gap-2 text-slate-500 ${className || ""}`}
        style={{ width: "100%", height: "100%", aspectRatio: `${width}/${height}` }}
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
      {/* فيديو webcam خلفية */}
      {useWebcam && (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            style={{ transform: "scaleX(-1)" }}
          />
          {webcamError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 text-slate-400 gap-1">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <span className="text-[10px]">
                {webcamError === "denied"
                  ? "Camera access denied"
                  : "Webcam unavailable"}
              </span>
            </div>
          )}
        </>
      )}

      {/* Canvas للرسم */}
      {!useWebcam && (
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      )}

      {/* Overlay معلومات */}
      <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-white text-[9px] font-mono">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500 rec-blink" />
        <span className="font-bold">REC</span>
      </div>

      <div className="absolute top-1.5 left-1.5 rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-white text-[9px] font-mono">
        {resolution} · {fps}fps
      </div>

      {showDetections && detectionCount > 0 && (
        <div className="absolute bottom-1.5 left-1.5 rounded bg-cyan-500/20 backdrop-blur-sm border border-cyan-400/30 px-1.5 py-0.5 text-cyan-200 text-[9px] font-mono font-bold">
          {detectionCount} DETECTED
        </div>
      )}

      <div className="absolute bottom-1.5 right-1.5 rounded bg-black/60 backdrop-blur-sm px-1.5 py-0.5 text-white text-[9px] font-mono tabular-nums">
        {currentTime}
      </div>

      {/* اسم المنطقة */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/20 text-[10px] font-bold uppercase tracking-widest pointer-events-none">
        {zone}
      </div>
    </div>
  )
}
