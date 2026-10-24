'use client'

import { useEffect, useState } from "react"
import { Loader2, MapPin, Route, Gauge, ChevronLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { SaudiMap, type MapRegion } from "../saudi-map"
import { scoreColor, STATUS_BG, type RoadStatus } from "../lib/helpers"

interface RegionData {
  id: string
  name: string
  code: string
  lat: number
  lng: number
  score: number
  roadCount: number
  totalLength: number
  statusDist: Record<string, number>
  roads: {
    id: string
    name: string
    qualityScore: number
    status: string
    length: number
    highway: string
    lat: number
    lng: number
  }[]
}

export function MapView() {
  const [regions, setRegions] = useState<RegionData[] | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((d) => {
        setRegions(d)
        if (d.length > 0) setSelected(d[0].code)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading || !regions) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const mapRegions: MapRegion[] = regions.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    lat: r.lat,
    lng: r.lng,
    score: r.score,
    roadCount: r.roadCount,
  }))

  const selectedRegion = regions.find((r) => r.code === selected)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">خريطة جودة الطرق</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          نظرة جغرافية على حالة الطرق في مناطق المملكة الثلاث عشرة
        </p>
      </div>

      {/* مفتاح الألوان */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="text-muted-foreground font-semibold">مفتاح الجودة:</span>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#16a34a" }} />
          <span>ممتاز (75+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#d97706" }} />
          <span>متوسط (55-74)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: "#dc2626" }} />
          <span>رديء (&lt;55)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* الخريطة */}
        <Card className="lg:col-span-3 p-4 md:p-6 pattern-bg">
          <SaudiMap
            regions={mapRegions}
            selectedCode={selected}
            onSelect={setSelected}
          />
        </Card>

        {/* تفاصيل المنطقة المحددة */}
        <Card className="lg:col-span-2 p-5 max-h-[640px] overflow-y-auto custom-scroll">
          {selectedRegion && (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary" />
                    <h3 className="font-bold text-lg">{selectedRegion.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    منطقة {selectedRegion.code} · {selectedRegion.roadCount} مقطع طرقي · {selectedRegion.totalLength} كم
                  </p>
                </div>
                <div
                  className="flex flex-col items-center justify-center rounded-xl px-3 py-2"
                  style={{ backgroundColor: `${scoreColor(selectedRegion.score)}15` }}
                >
                  <span
                    className="text-2xl font-extrabold tabular-nums"
                    style={{ color: scoreColor(selectedRegion.score) }}
                  >
                    {selectedRegion.score}
                  </span>
                  <span className="text-[10px] text-muted-foreground">متوسط الجودة</span>
                </div>
              </div>

              {/* توزيع الحالات */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">توزيع حالات الطرق</p>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(selectedRegion.statusDist).map(([status, count]) => (
                    <div
                      key={status}
                      className={`flex items-center justify-between rounded-lg border px-2.5 py-1.5 ${STATUS_BG[status as RoadStatus]}`}
                    >
                      <span className="text-xs font-semibold">{status}</span>
                      <span className="text-sm font-extrabold tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* قائمة الطرق */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">
                  المقاطع الطرقية في المنطقة
                </p>
                <div className="space-y-2">
                  {selectedRegion.roads
                    .sort((a, b) => a.qualityScore - b.qualityScore)
                    .map((road) => (
                      <div key={road.id} className="border rounded-lg p-3 hover:bg-accent/40 transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate flex items-center gap-1.5">
                              <Route className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              {road.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {road.highway} · {road.length} كم
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className="text-base font-extrabold tabular-nums"
                              style={{ color: scoreColor(road.qualityScore) }}
                            >
                              {road.qualityScore}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={road.qualityScore}
                            className="h-1.5"
                            style={{
                              backgroundColor: "var(--muted)",
                            }}
                          />
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 shrink-0 ${STATUS_BG[road.status as RoadStatus]}`}>
                            {road.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* أزرار التنقل بين المناطق */}
              <div className="flex items-center justify-between pt-2 border-t">
                <button
                  onClick={() => {
                    const idx = regions.findIndex((r) => r.code === selected)
                    const prev = regions[(idx - 1 + regions.length) % regions.length]
                    setSelected(prev.code)
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5 rotate-180" />
                  المنطقة السابقة
                </button>
                <button
                  onClick={() => {
                    const idx = regions.findIndex((r) => r.code === selected)
                    const next = regions[(idx + 1) % regions.length]
                    setSelected(next.code)
                  }}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  المنطقة التالية
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
