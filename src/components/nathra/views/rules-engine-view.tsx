'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, Plus, Workflow, Zap, Clock, ArrowRight, Info, Sparkles,
  ShieldAlert, Bell, Route, Save, RefreshCw, FileText, Trash2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { useI18n } from "../lib/i18n"
import { formatNumber, formatRelativeTime } from "../lib/helpers"
import { toast } from "sonner"

interface Condition { field: string; operator: string; value: string }
interface Action { action: string; params: any }

interface Rule {
  id: string
  name: string
  nameEn: string
  description: string
  conditions: string // JSON string
  actions: string // JSON string
  priority: number
  active: boolean
  lastTriggered: string | null
  triggerCount: number
}

const FIELD_LABELS: Record<string, { ar: string; en: string }> = {
  severity: { ar: "الخطورة", en: "Severity" },
  status: { ar: "الحالة", en: "Status" },
  incident_type: { ar: "نوع الحادث", en: "Incident Type" },
  camera_zone: { ar: "نطاق الكاميرا", en: "Camera Zone" },
  time: { ar: "الوقت", en: "Time" },
}

const OPERATOR_LABELS: Record<string, { ar: string; en: string }> = {
  eq: { ar: "يساوي", en: "equals" },
  ne: { ar: "لا يساوي", en: "not equal" },
  in: { ar: "ضمن", en: "in" },
  gt: { ar: "أكبر من", en: "greater than" },
  lt: { ar: "أقل من", en: "less than" },
}

const ACTION_META: Record<string, { ar: string; en: string; icon: any; color: string }> = {
  notify: { ar: "إشعار", en: "Notify", icon: Bell, color: "#06b6d4" },
  route: { ar: "تمرير لجهة", en: "Route to Authority", icon: Route, color: "#8b5cf6" },
  save_evidence: { ar: "حفظ دليل", en: "Save Evidence", icon: Save, color: "#10b981" },
  change_status: { ar: "تغيير الحالة", en: "Change Status", icon: RefreshCw, color: "#f59e0b" },
  escalate: { ar: "تصعيد", en: "Escalate", icon: ShieldAlert, color: "#dc2626" },
  audit_log: { ar: "سجل تدقيق", en: "Audit Log", icon: FileText, color: "#64748b" },
}

function safeParse<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try { return JSON.parse(s) as T } catch { return fallback }
}

export function RulesEngineView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [rules, setRules] = useState<Rule[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // form state
  const [fName, setFName] = useState("")
  const [fNameEn, setFNameEn] = useState("")
  const [fDesc, setFDesc] = useState("")
  const [cField, setCField] = useState("severity")
  const [cOp, setCOp] = useState("eq")
  const [cVal, setCVal] = useState("")
  const [aAction, setAAction] = useState("notify")
  const [aParams, setAParams] = useState("")
  const [fPriority, setFPriority] = useState("50")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/automation-rules")
      const d = await res.json()
      setRules(d)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const toggleActive = async (id: string, current: boolean) => {
    // optimistic update
    setRules((prev) => prev?.map((r) => r.id === id ? { ...r, active: !current } : r) || null)
    try {
      const res = await fetch("/api/automation-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, active: !current }),
      })
      if (!res.ok) throw new Error("failed")
      toast.success(isAr ? "تم تحديث القاعدة" : "Rule updated")
    } catch {
      // rollback
      setRules((prev) => prev?.map((r) => r.id === id ? { ...r, active: current } : r) || null)
      toast.error(isAr ? "فشل التحديث" : "Update failed")
    }
  }

  const resetForm = () => {
    setFName(""); setFNameEn(""); setFDesc("")
    setCField("severity"); setCOp("eq"); setCVal("")
    setAAction("notify"); setAParams(""); setFPriority("50")
  }

  const submit = async () => {
    if (!fName.trim()) {
      toast.error(isAr ? "الاسم مطلوب" : "Name required")
      return
    }
    if (!cVal.trim()) {
      toast.error(isAr ? "قيمة الشرط مطلوبة" : "Condition value required")
      return
    }
    setSaving(true)
    const conditions: Condition[] = [{ field: cField, operator: cOp, value: cVal }]
    const actions: Action[] = [{ action: aAction, params: aParams }]
    try {
      const res = await fetch("/api/automation-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fName,
          nameEn: fNameEn || fName,
          description: fDesc,
          conditions: JSON.stringify(conditions),
          actions: JSON.stringify(actions),
          priority: parseInt(fPriority) || 50,
        }),
      })
      if (!res.ok) throw new Error("failed")
      toast.success(isAr ? "تم إنشاء القاعدة" : "Rule created")
      setOpen(false)
      resetForm()
      load()
    } catch {
      toast.error(isAr ? "فشل الإنشاء" : "Creation failed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {isAr ? "محرر القواعد" : "Rules Engine"}
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? "محرر قواعد بدون كود لأتمتة الاستجابة للحوادث" : "No-code editor for automated incident response"}
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-1.5 gradient-nathra text-primary-foreground">
          <Plus className="h-4 w-4" />
          {isAr ? "قاعدة جديدة" : "New Rule"}
        </Button>
      </div>

      {/* info card */}
      <Card className="p-4 bg-cyan-500/5 border-cyan-500/20">
        <div className="flex items-start gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
            <Info className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-sm mb-0.5">
              {isAr ? "ما هي قواعد الأتمتة؟" : "What are Automation Rules?"}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? "قواعد الأتمتة تسمح بتحديد شرط (مثل: خطورة = حرجة) وإجراء تلقائي (مثل: إشعار الفريق + تمرير للجهة المختصة). عند تطابق الشرط مع حادث جديد، يُنفّذ الإجراء فوراً دون تدخل بشري — مما يقلل زمن الاستجابة ويضمن اتساق المعالجة."
                : "Automation rules let you define a condition (e.g., severity = critical) and an automatic action (e.g., notify the team + route to the authority). When a new incident matches the condition, the action runs immediately — reducing response time and ensuring consistent handling."}
            </p>
          </div>
        </div>
      </Card>

      {/* rules list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !rules || rules.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          {isAr ? "لا توجد قواعد بعد. أنشئ قاعدتك الأولى." : "No rules yet. Create your first rule."}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {rules.map((rule) => {
            const conds = safeParse<Condition[]>(rule.conditions, [])
            const acts = safeParse<Action[]>(rule.actions, [])
            const name = isAr ? rule.name : (rule.nameEn || rule.name)
            return (
              <Card key={rule.id} className={`p-4 ${!rule.active ? "opacity-60" : ""}`}>
                {/* IF ... THEN ... visual */}
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Badge variant="outline" className="gap-1 text-[10px] bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400">
                    <Workflow className="h-2.5 w-2.5" />IF
                  </Badge>
                  {conds.map((c, i) => (
                    <span key={i} className="text-[11px] font-mono bg-muted px-1.5 py-0.5 rounded">
                      {FIELD_LABELS[c.field]?.[isAr ? "ar" : "en"] || c.field}
                      <span className="text-muted-foreground mx-1">{OPERATOR_LABELS[c.operator]?.[isAr ? "ar" : "en"] || c.operator}</span>
                      <span className="text-primary font-bold">{c.value}</span>
                    </span>
                  ))}
                  <ArrowRight className="h-3 w-3 text-muted-foreground rtl:rotate-180" />
                  <Badge variant="outline" className="gap-1 text-[10px] bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400">
                    <Zap className="h-2.5 w-2.5" />THEN
                  </Badge>
                  {acts.map((a, i) => {
                    const meta = ACTION_META[a.action] || { ar: a.action, en: a.action, icon: Sparkles, color: "#64748b" }
                    const Icon = meta.icon
                    const paramsStr = a.params ? (typeof a.params === "string" ? a.params : JSON.stringify(a.params)) : ""
                    return (
                      <span key={i} className="text-[11px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                        style={{ backgroundColor: `${meta.color}15`, color: meta.color }}>
                        <Icon className="h-2.5 w-2.5" />
                        {isAr ? meta.ar : meta.en}
                        {paramsStr && <span className="text-muted-foreground">({paramsStr})</span>}
                      </span>
                    )
                  })}
                </div>

                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm truncate">{name}</h3>
                      <Badge variant="outline" className="text-[9px] bg-violet-500/10 border-violet-500/25 text-violet-700 dark:text-violet-400 shrink-0">
                        P{rule.priority}
                      </Badge>
                    </div>
                    {rule.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{rule.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-muted-foreground">{isAr ? "تفعيل" : "Active"}</span>
                    <Switch checked={rule.active} onCheckedChange={() => toggleActive(rule.id, rule.active)} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1">
                      <Zap className="h-2.5 w-2.5" />
                      {formatNumber(rule.triggerCount, lang)} {isAr ? "تشغيل" : "triggers"}
                    </span>
                    {rule.lastTriggered && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {isAr ? "آخر: " : "Last: "}{formatRelativeTime(rule.lastTriggered, lang)}
                      </span>
                    )}
                  </div>
                  <Trash2 className="h-3 w-3 opacity-40" />
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* new rule dialog */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm() }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scroll">
          <DialogTitle>{isAr ? "قاعدة أتمتة جديدة" : "New Automation Rule"}</DialogTitle>
          <DialogDescription>
            {isAr ? "عرّف شرطاً واحداً وإجراءً واحداً. يمكن توسيعها لاحقاً." : "Define one condition and one action. Extendable later."}
          </DialogDescription>

          <div className="space-y-4">
            {/* basics */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</label>
                <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder={isAr ? "مثال: تصعيد الحوادث الحرجة" : "e.g., Escalate Critical"} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</label>
                <Input value={fNameEn} onChange={(e) => setFNameEn(e.target.value)} placeholder="e.g., Escalate Critical" className="h-9 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1 block">{isAr ? "الوصف" : "Description"}</label>
              <Input value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder={isAr ? "وصف موجز للقاعدة" : "Brief description"} className="h-9 text-sm" />
            </div>

            {/* condition builder */}
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <Workflow className="h-3.5 w-3.5" />
                {isAr ? "الشرط (IF)" : "Condition (IF)"}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Select value={cField} onValueChange={setCField}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(FIELD_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={cOp} onValueChange={setCOp}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATOR_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{isAr ? v.ar : v.en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input value={cVal} onChange={(e) => setCVal(e.target.value)} placeholder={isAr ? "القيمة" : "Value"} className="h-9 text-sm" />
              </div>
            </div>

            {/* action builder */}
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                {isAr ? "الإجراء (THEN)" : "Action (THEN)"}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={aAction} onValueChange={setAAction}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_META).map(([k, v]) => {
                      const Icon = v.icon
                      return (
                        <SelectItem key={k} value={k}>
                          <span className="inline-flex items-center gap-1.5">
                            <Icon className="h-3 w-3" />
                            {isAr ? v.ar : v.en}
                          </span>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <Input value={aParams} onChange={(e) => setAParams(e.target.value)} placeholder={isAr ? "معاملات (مثال: فريق الأمن)" : "Params (e.g., security team)"} className="h-9 text-sm" />
              </div>
            </div>

            {/* priority */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium mb-1 block">{isAr ? "الأولوية" : "Priority"}</label>
                <Input type="number" min={1} max={100} value={fPriority} onChange={(e) => setFPriority(e.target.value)} className="h-9 text-sm" />
              </div>
              <div className="text-[10px] text-muted-foreground flex items-end pb-1.5">
                {isAr ? "1–100. القواعد ذات الأولوية الأعلى تُنفّذ أولاً." : "1–100. Higher priority rules run first."}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              {isAr ? "إلغاء" : "Cancel"}
            </Button>
            <Button onClick={submit} disabled={saving} className="gap-1.5 gradient-nathra text-primary-foreground">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isAr ? "إنشاء القاعدة" : "Create Rule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
