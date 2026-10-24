'use client'

import { useEffect, useState, useCallback } from "react"
import { Loader2, Search, Route as RoadIcon, MapPin, Gauge, Filter } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { scoreColor, STATUS_BG, formatNumber, type RoadStatus } from "../lib/helpers"

interface Road {
  id: string
  name: string
  highway: string
  region: { name: string; code: string }
  length: number
  qualityScore: number
  status: string
  surfaceType: string
  aadt: number
  lastInspection: string | null
  issues: { id: string; type: string; severity: string }[]
  sensors: { id: string; status: string }[]
}

export function RoadsView() {
  const [roads, setRoads] = useState<Road[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [region, setRegion] = useState("all")
  const [status, setStatus] = useState("all")
  const [query, setQuery] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (region !== "all") params.set("region", region)
    if (status !== "all") params.set("status", status)
    if (query) params.set("q", query)
    try {
      const res = await fetch(`/api/roads?${params}`)
      const data = await res.json()
      setRoads(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [region, status, query])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">سجل المقاطع الطرقية</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          استعراض وتصفية جميع المقاطع الطرقية المرصودة في المملكة
        </p>
      </div>

      {/* أدوات التصفية */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="ابحث عن طريق..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="ممتاز">ممتاز</SelectItem>
              <SelectItem value="جيد">جيد</SelectItem>
              <SelectItem value="متوسط">متوسط</SelectItem>
              <SelectItem value="رديء">رديء</SelectItem>
            </SelectContent>
          </Select>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue placeholder="المنطقة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المناطق</SelectItem>
              <SelectItem value="RYD">الرياض</SelectItem>
              <SelectItem value="MKH">مكة المكرمة</SelectItem>
              <SelectItem value="MDN">المدينة المنورة</SelectItem>
              <SelectItem value="QSM">القصيم</SelectItem>
              <SelectItem value="EST">المنطقة الشرقية</SelectItem>
              <SelectItem value="ASR">عسير</SelectItem>
              <SelectItem value="TBK">تبوك</SelectItem>
              <SelectItem value="HIL">حائل</SelectItem>
              <SelectItem value="NBD">الحدود الشمالية</SelectItem>
              <SelectItem value="JZN">جازان</SelectItem>
              <SelectItem value="NJN">نجران</SelectItem>
              <SelectItem value="BHA">الباحة</SelectItem>
              <SelectItem value="JOF">الجوف</SelectItem>
            </SelectContent>
          </Select>
          {roads && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap px-2">
              <Filter className="h-3.5 w-3.5" />
              {formatNumber(roads.length)} نتيجة
            </div>
          )}
        </div>
      </Card>

      {/* قائمة الطرق */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : roads && roads.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          لا توجد طرق مطابقة لمعايير البحث
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {roads?.map((road) => (
            <Card key={road.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0">
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <RoadIcon className="h-4 w-4 text-primary shrink-0" />
                    <span className="truncate">{road.name}</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {road.region.name} · {road.highway}
                  </p>
                </div>
                <div
                  className="flex flex-col items-center justify-center rounded-lg px-2 py-1 shrink-0"
                  style={{ backgroundColor: `${scoreColor(road.qualityScore)}15` }}
                >
                  <span
                    className="text-xl font-extrabold tabular-nums leading-none"
                    style={{ color: scoreColor(road.qualityScore) }}
                  >
                    {road.qualityScore}
                  </span>
                  <span className="text-[9px] text-muted-foreground mt-0.5">/100</span>
                </div>
              </div>

              <div className="mb-3">
                <Progress
                  value={road.qualityScore}
                  className="h-2"
                  style={{
                    background: "var(--muted)",
                  }}
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="text-muted-foreground block text-[10px]">الطول</span>
                  <span className="font-bold">{formatNumber(road.length)} كم</span>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="text-muted-foreground block text-[10px]">المرور اليومي</span>
                  <span className="font-bold">{formatNumber(road.aadt)}</span>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="text-muted-foreground block text-[10px]">نوع الرصف</span>
                  <span className="font-bold text-[11px]">{road.surfaceType}</span>
                </div>
                <div className="rounded-md bg-muted/50 px-2 py-1.5">
                  <span className="text-muted-foreground block text-[10px]">المستشعرات</span>
                  <span className="font-bold">
                    {road.sensors.filter((s) => s.status === "نشط").length}/{road.sensors.length}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-[10px] ${STATUS_BG[road.status as RoadStatus]}`}>
                  {road.status}
                </Badge>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Gauge className="h-3 w-3" />
                  {road.issues.length} بلاغ مفتوح
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
