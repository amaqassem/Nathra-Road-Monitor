'use client'

import { useMemo } from "react"

export interface MapRegion {
  id: string
  name: string
  code: string
  lat: number
  lng: number
  score: number
  roadCount: number
}

// تحويل الإحداثيات الجغرافية إلى إحداثيات SVG
// المملكة: خط عرض 16-32 شمالاً، خط طول 34-56 شرقاً
function project(lat: number, lng: number, width = 660, height = 720) {
  const x = ((lng - 34) / (56 - 34)) * width
  const y = ((32 - lat) / (32 - 16)) * height
  return { x, y }
}

export function SaudiMap({
  regions,
  selectedCode,
  onSelect,
}: {
  regions: MapRegion[]
  selectedCode: string | null
  onSelect: (code: string) => void
}) {
  const markers = useMemo(
    () =>
      regions.map((r) => ({
        ...r,
        pos: project(r.lat, r.lng),
      })),
    [regions]
  )

  return (
    <svg
      viewBox="0 0 660 720"
      className="w-full h-auto"
      role="img"
      aria-label="خريطة المملكة العربية السعودية"
    >
      <defs>
        <linearGradient id="ksa-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.52 0.13 152 / 0.08)" />
          <stop offset="100%" stopColor="oklch(0.75 0.14 75 / 0.06)" />
        </linearGradient>
        <filter id="marker-shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* حدود المملكة - مسار مبسط */}
      <path
        d="M 30 112 Q 75 95 120 90 L 240 90 Q 300 95 360 112 Q 405 130 450 180 Q 490 240 510 315 L 510 360 Q 525 405 555 425 Q 600 440 630 450 Q 600 540 540 630 Q 420 690 270 697 Q 255 695 255 675 Q 220 580 165 495 Q 140 430 120 360 Q 80 290 45 225 Q 32 170 30 112 Z"
        fill="url(#ksa-fill)"
        stroke="oklch(0.52 0.13 152 / 0.5)"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* خطوط شبكية خفيفة */}
      <g opacity="0.08" stroke="currentColor" strokeWidth="0.5">
        {[120, 240, 360, 480, 600].map((x) => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2="720" />
        ))}
        {[120, 240, 360, 480, 600].map((y) => (
          <line key={`h${y}`} x1="0" y1={y} x2="660" y2={y} />
        ))}
      </g>

      {/* النقش المائي - اسم المملكة */}
      <text
        x="330"
        y="380"
        textAnchor="middle"
        className="fill-current"
        style={{
          fontSize: "42px",
          fontWeight: "800",
          opacity: "0.06",
          fontFamily: "var(--font-cairo), sans-serif",
        }}
      >
        المملكة العربية السعودية
      </text>

      {/* علامات المناطق */}
      {markers.map((m) => {
        const isSelected = m.code === selectedCode
        const isGood = m.score >= 75
        const isMid = m.score >= 55 && m.score < 75
        const color = isGood ? "#16a34a" : isMid ? "#d97706" : "#dc2626"
        const radius = isSelected ? 16 : 12
        return (
          <g
            key={m.code}
            transform={`translate(${m.pos.x}, ${m.pos.y})`}
            className="cursor-pointer"
            onClick={() => onSelect(m.code)}
            filter="url(#marker-shadow)"
          >
            {/* حلقة خارجية نبضية للحرج */}
            {m.score < 55 && !isSelected && (
              <circle r={radius + 8} fill="none" stroke={color} strokeWidth="1.5" opacity="0.4">
                <animate attributeName="r" values={`${radius};${radius + 10};${radius}`} dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
              </circle>
            )}
            {/* الدائرة */}
            <circle
              r={radius}
              fill={color}
              fillOpacity={isSelected ? 0.95 : 0.75}
              stroke="white"
              strokeWidth={isSelected ? 3 : 2}
              style={{ transition: "all 0.2s" }}
            />
            <text
              y="4"
              textAnchor="middle"
              style={{ fontSize: "11px", fontWeight: "700", fill: "white", pointerEvents: "none" }}
            >
              {m.score}
            </text>
            {/* اسم المنطقة */}
            <text
              y={radius + 16}
              textAnchor="middle"
              style={{
                fontSize: "13px",
                fontWeight: "600",
                fill: "var(--foreground)",
                paintOrder: "stroke",
                stroke: "var(--background)",
                strokeWidth: "3px",
                pointerEvents: "none",
              }}
            >
              {m.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
