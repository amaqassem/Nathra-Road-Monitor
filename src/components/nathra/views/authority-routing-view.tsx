'use client'

import { useEffect, useState, useCallback } from "react"
import { Loader2, Building2, Phone, Mail, Plus, FlaskConical, ArrowRight, Webhook } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog"
import { useI18n } from "../lib/i18n"
import { toast } from "sonner"

export function AuthorityRoutingView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [authorities, setAuthorities] = useState<any[]>([])
  const [rules, setRules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [ruleDialogOpen, setRuleDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  // نموذج جهة
  const [aName, setAName] = useState(""); const [aNameEn, setANameEn] = useState("")
  const [aCat, setACat] = useState("internal"); const [aContact, setAContact] = useState("")
  const [aPhone, setAPhone] = useState(""); const [aWebhook, setAWebhook] = useState("")
  // نموذج قاعدة
  const [rName, setRName] = useState(""); const [rCondType, setRCondType] = useState("incident_type")
  const [rCondValue, setRCondValue] = useState(""); const [rAuthority, setRAuthority] = useState("")
  const [rPriority, setRPriority] = useState("50")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, r] = await Promise.all([
        fetch("/api/authorities").then((x) => x.json()),
        fetch("/api/routing-rules").then((x) => x.json()),
      ])
      setAuthorities(a); setRules(r)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const addAuthority = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!aName) return toast.error(isAr ? "الاسم مطلوب" : "Name required")
    setSubmitting(true)
    try {
      const res = await fetch("/api/authorities", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: aName, nameEn: aNameEn || aName,
          category: aCat === "internal" ? "داخلي" : "خارجي", categoryEn: aCat,
          contactName: aContact, contactPhone: aPhone, webhookUrl: aWebhook,
          sandboxMode: true,
        }),
      })
      if (res.ok) { toast.success(isAr ? "أُضيفت الجهة" : "Added"); setDialogOpen(false); setAName(""); setANameEn(""); setAContact(""); setAPhone(""); setAWebhook(""); load() }
    } catch { toast.error(isAr ? "خطأ" : "Error") }
    finally { setSubmitting(false) }
  }

  const addRule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rName || !rCondValue || !rAuthority) return toast.error(isAr ? "حقول ناقصة" : "Missing fields")
    setSubmitting(true)
    try {
      const res = await fetch("/api/routing-rules", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: rName, nameEn: rName, conditionType: rCondType, conditionValue: rCondValue, authorityId: rAuthority, priority: parseInt(rPriority) }),
      })
      if (res.ok) { toast.success(isAr ? "أُضيفت القاعدة" : "Rule added"); setRuleDialogOpen(false); setRName(""); setRCondValue(""); setRPriority("50"); load() }
    } catch { toast.error(isAr ? "خطأ" : "Error") }
    finally { setSubmitting(false) }
  }

  const toggleRule = async (id: string, active: boolean) => {
    setRules((prev) => prev.map((r) => r.id === id ? { ...r, active: !active } : r))
    try {
      await fetch("/api/routing-rules", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, active: !active }) })
    } catch { load() }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight">{isAr ? "محرك التوجيه الذكي" : "Smart Authority Routing Engine"}</h2>
        <p className="text-sm text-muted-foreground mt-0.5">{isAr ? "توجيه الحوادث تلقائياً للجهة المختصة حسب قواعد قابلة للتكوين" : "Route incidents automatically based on configurable rules"}</p>
      </div>

      {/* بطاقة تحذير Sandbox */}
      <Card className="p-3 bg-amber-500/5 border-amber-500/20">
        <div className="flex items-center gap-2 text-xs">
          <FlaskConical className="h-4 w-4 text-amber-500 shrink-0" />
          <span className="text-amber-700 dark:text-amber-400 font-semibold">{isAr ? "وضع Sandbox مفعّل" : "Sandbox Mode Active"}</span>
          <span className="text-muted-foreground">— {isAr ? "لا يتم إرسال بلاغات لجهات خارجية. التكاملات للاختبار فقط." : "No external deliveries. Integrations for testing only."}</span>
        </div>
      </Card>

      {/* قواعد التوجيه */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">{isAr ? "قواعد التوجيه" : "Routing Rules"}</h3>
          <Dialog open={ruleDialogOpen} onOpenChange={setRuleDialogOpen}>
            <DialogTrigger asChild><Button size="sm" className="gap-1.5 gradient-nathra text-primary-foreground"><Plus className="h-3.5 w-3.5" />{isAr ? "قاعدة جديدة" : "New Rule"}</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{isAr ? "قاعدة توجيه جديدة" : "New Routing Rule"}</DialogTitle><DialogDescription>{isAr ? "حدد الشرط والجهة المُحالة لها" : "Define condition and target authority"}</DialogDescription></DialogHeader>
              <form onSubmit={addRule} className="space-y-3">
                <div className="space-y-1.5"><Label>{isAr ? "اسم القاعدة" : "Rule name"}</Label><Input value={rName} onChange={(e) => setRName(e.target.value)} placeholder={isAr ? "مثال: حرائق → الدفاع المدني" : "e.g. Fire → Civil Defense"} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>{isAr ? "نوع الشرط" : "Condition type"}</Label>
                    <Select value={rCondType} onValueChange={setRCondType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                      <SelectItem value="incident_type">{isAr ? "نوع الحادث" : "Incident type"}</SelectItem>
                      <SelectItem value="severity">{isAr ? "الخطورة" : "Severity"}</SelectItem>
                      <SelectItem value="site_type">{isAr ? "نوع الموقع" : "Site type"}</SelectItem>
                    </SelectContent></Select>
                  </div>
                  <div className="space-y-1.5"><Label>{isAr ? "القيمة" : "Value"}</Label><Input value={rCondValue} onChange={(e) => setRCondValue(e.target.value)} placeholder="fire / critical / Industrial" /></div>
                </div>
                <div className="space-y-1.5"><Label>{isAr ? "الجهة" : "Authority"}</Label>
                  <Select value={rAuthority} onValueChange={setRAuthority}><SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger><SelectContent>
                    {authorities.map((a) => <SelectItem key={a.id} value={a.id}>{isAr ? a.name : a.nameEn}</SelectItem>)}
                  </SelectContent></Select>
                </div>
                <div className="space-y-1.5"><Label>{isAr ? "الأولوية" : "Priority"}</Label><Input type="number" value={rPriority} onChange={(e) => setRPriority(e.target.value)} /></div>
                <Button type="submit" disabled={submitting} className="w-full gap-2 gradient-nathra text-primary-foreground">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{isAr ? "إضافة" : "Add"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {rules.sort((a, b) => b.priority - a.priority).map((r) => {
            const auth = isAr ? r.authority?.name : r.authority?.nameEn
            return (
              <Card key={r.id} className={`p-3 ${!r.active ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold shrink-0">{r.priority}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{isAr ? r.name : r.nameEn}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <span className="font-mono">{r.conditionType}</span> = <span className="font-mono font-bold">{r.conditionValue}</span>
                      <ArrowRight className="h-2.5 w-2.5" />
                      <span className="font-semibold text-amber-700 dark:text-amber-400">{auth}</span>
                    </p>
                  </div>
                  <Switch checked={r.active} onCheckedChange={() => toggleRule(r.id, r.active)} aria-label="toggle" />
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* دليل الجهات */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-base">{isAr ? "دليل الجهات المختصة" : "Authority Directory"}</h3>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline" className="gap-1.5"><Plus className="h-3.5 w-3.5" />{isAr ? "جهة جديدة" : "New Authority"}</Button></DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>{isAr ? "إضافة جهة" : "Add Authority"}</DialogTitle><DialogDescription>{isAr ? "أدخل بيانات الجهة المختصة" : "Enter authority details"}</DialogDescription></DialogHeader>
              <form onSubmit={addAuthority} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label><Input value={aName} onChange={(e) => setAName(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label><Input value={aNameEn} onChange={(e) => setANameEn(e.target.value)} dir="ltr" /></div>
                </div>
                <div className="space-y-1.5"><Label>{isAr ? "النوع" : "Category"}</Label>
                  <Select value={aCat} onValueChange={setACat}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                    <SelectItem value="internal">{isAr ? "داخلي" : "Internal"}</SelectItem>
                    <SelectItem value="external">{isAr ? "خارجي" : "External"}</SelectItem>
                  </SelectContent></Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label>{isAr ? "جهة الاتصال" : "Contact"}</Label><Input value={aContact} onChange={(e) => setAContact(e.target.value)} /></div>
                  <div className="space-y-1.5"><Label>{isAr ? "الهاتف" : "Phone"}</Label><Input value={aPhone} onChange={(e) => setAPhone(e.target.value)} dir="ltr" /></div>
                </div>
                <div className="space-y-1.5"><Label>Webhook URL</Label><Input value={aWebhook} onChange={(e) => setAWebhook(e.target.value)} dir="ltr" placeholder="https://..." /></div>
                <Button type="submit" disabled={submitting} className="w-full gap-2 gradient-nathra text-primary-foreground">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{isAr ? "إضافة" : "Add"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {authorities.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start gap-2 mb-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${a.categoryEn === "internal" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                  <Building2 className="h-4.5 w-4.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm truncate">{isAr ? a.name : a.nameEn}</h4>
                  <Badge variant="outline" className={`text-[9px] mt-0.5 ${a.categoryEn === "internal" ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"}`}>
                    {isAr ? a.category : a.categoryEn}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 text-[11px] text-muted-foreground">
                {a.contactName && <p className="flex items-center gap-1"><Building2 className="h-3 w-3" />{a.contactName}</p>}
                {a.contactPhone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{a.contactPhone}</p>}
                {a.webhookUrl && <p className="flex items-center gap-1"><Webhook className="h-3 w-3" /><span className="truncate font-mono">{a.webhookUrl}</span></p>}
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                <span className="text-[10px] text-muted-foreground">{a._count.incidents} {isAr ? "حوادث محالة" : "routed incidents"}</span>
                {a.sandboxMode && <Badge variant="outline" className="text-[9px] bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400 gap-0.5"><FlaskConical className="h-2.5 w-2.5" />Sandbox</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
