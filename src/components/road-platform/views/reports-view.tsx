'use client'

import { useEffect, useState, useCallback } from "react"
import { Loader2, AlertTriangle, Plus, MapPin, Clock, Send, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  SEVERITY_BG,
  ISSUE_STATUS_BG,
  formatRelativeTime,
} from "../lib/helpers"

interface Issue {
  id: string
  type: string
  severity: string
  description: string
  status: string
  reportedBy: string
  createdAt: string
  roadSegment: {
    name: string
    region: { name: string }
  }
}

interface RoadOption {
  id: string
  name: string
  region: { name: string }
}

const ISSUE_TYPES = ["حفر", "تشققات طولية", "تصدعات تمساحية", "هبوط", "تآكل الحواف", "صدع انكماشي"]
const SEVERITIES = ["منخفضة", "متوسطة", "عالية", "حرجة"]

export function ReportsView() {
  const [issues, setIssues] = useState<Issue[] | null>(null)
  const [roads, setRoads] = useState<RoadOption[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState("all")
  const [severity, setSeverity] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // حقول النموذج
  const [fRoad, setFRoad] = useState("")
  const [fType, setFType] = useState("")
  const [fSeverity, setFSeverity] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [fReporter, setFReporter] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (status !== "all") params.set("status", status)
    if (severity !== "all") params.set("severity", severity)
    try {
      const res = await fetch(`/api/issues?${params}`)
      const data = await res.json()
      setIssues(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [status, severity])

  useEffect(() => {
    const t = setTimeout(load, 200)
    return () => clearTimeout(t)
  }, [load])

  useEffect(() => {
    fetch("/api/roads")
      .then((r) => r.json())
      .then((d) => setRoads(d))
      .catch(console.error)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fRoad || !fType || !fSeverity || !fDesc) {
      toast.error("الرجاء إكمال جميع الحقول المطلوبة")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roadSegmentId: fRoad,
          type: fType,
          severity: fSeverity,
          description: fDesc,
          reportedBy: fReporter || "بلاغ مواطن",
        }),
      })
      if (res.ok) {
        toast.success("تم تسجيل البلاغ بنجاح", {
          description: "سيتم مراجعة البلاغ ومعالجته في أقرب وقت",
        })
        setDialogOpen(false)
        setFRoad("")
        setFType("")
        setFSeverity("")
        setFDesc("")
        setFReporter("")
        load()
      } else {
        toast.error("فشل في تسجيل البلاغ")
      }
    } catch (err) {
      toast.error("حدث خطأ غير متوقع")
    } finally {
      setSubmitting(false)
    }
  }

  const counts = issues
    ? {
        total: issues.length,
        new: issues.filter((i) => i.status === "جديد").length,
        inProgress: issues.filter((i) => i.status === "قيد المعالجة").length,
        resolved: issues.filter((i) => i.status === "تم الحل").length,
        critical: issues.filter((i) => i.severity === "حرجة").length,
      }
    : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">إدارة البلاغات</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            تتبّع ومعالجة بلاغات عيوب الطرق من المواطنين والمفتشين
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-saudi text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" />
              بلاغ جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>تسجيل بلاغ جديد</DialogTitle>
              <DialogDescription>
                املأ التفاصيل أدناه لتسجيل بلاغ عن عيب في الطريق. الحقول المعلّمة بـ * إلزامية.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>الطريق <span className="text-destructive">*</span></Label>
                <Select value={fRoad} onValueChange={setFRoad}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المقاطع الطرقي" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {roads.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} — {r.region.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>نوع العيب <span className="text-destructive">*</span></Label>
                  <Select value={fType} onValueChange={setFType}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر النوع" />
                    </SelectTrigger>
                    <SelectContent>
                      {ISSUE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>مستوى الخطورة <span className="text-destructive">*</span></Label>
                  <Select value={fSeverity} onValueChange={setFSeverity}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الخطورة" />
                    </SelectTrigger>
                    <SelectContent>
                      {SEVERITIES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>وصف البلاغ <span className="text-destructive">*</span></Label>
                <Textarea
                  value={fDesc}
                  onChange={(e) => setFDesc(e.target.value)}
                  placeholder="صف العيب وموقعه بالتفصيل..."
                  rows={3}
                />
              </div>

              <div className="space-y-1.5">
                <Label>اسم المُبلّغ (اختياري)</Label>
                <Input
                  value={fReporter}
                  onChange={(e) => setFReporter(e.target.value)}
                  placeholder="اسمك أو جهتك"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="gap-2 gradient-saudi text-primary-foreground"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  إرسال البلاغ
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات سريعة */}
      {counts && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{counts.total}</p>
            <p className="text-[11px] text-muted-foreground">إجمالي البلاغات</p>
          </Card>
          <Card className="p-3 text-center bg-blue-500/5 border-blue-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-blue-600 dark:text-blue-400">{counts.new}</p>
            <p className="text-[11px] text-muted-foreground">جديد</p>
          </Card>
          <Card className="p-3 text-center bg-amber-500/5 border-amber-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-amber-600 dark:text-amber-400">{counts.inProgress}</p>
            <p className="text-[11px] text-muted-foreground">قيد المعالجة</p>
          </Card>
          <Card className="p-3 text-center bg-emerald-500/5 border-emerald-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{counts.resolved}</p>
            <p className="text-[11px] text-muted-foreground">تم الحل</p>
          </Card>
          <Card className="p-3 text-center bg-red-500/5 border-red-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{counts.critical}</p>
            <p className="text-[11px] text-muted-foreground">حالات حرجة</p>
          </Card>
        </div>
      )}

      {/* أدوات التصفية */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الحالة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الحالات</SelectItem>
            <SelectItem value="جديد">جديد</SelectItem>
            <SelectItem value="قيد المعالجة">قيد المعالجة</SelectItem>
            <SelectItem value="تم الحل">تم الحل</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="الخطورة" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المستويات</SelectItem>
            {SEVERITIES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* قائمة البلاغات */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : issues && issues.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          لا توجد بلاغات مطابقة
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {issues?.map((issue) => (
            <Card key={issue.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">{issue.type}</h3>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {issue.roadSegment.name}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${SEVERITY_BG[issue.severity]}`}>
                  {issue.severity}
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                {issue.description}
              </p>

              <div className="flex items-center justify-between text-[11px]">
                <Badge variant="outline" className={`text-[10px] ${ISSUE_STATUS_BG[issue.status]}`}>
                  {issue.status}
                </Badge>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <span>{issue.reportedBy}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />
                    {formatRelativeTime(issue.createdAt)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
