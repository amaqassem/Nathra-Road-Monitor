'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Loader2, UserPlus, User, Ban, Clock, MapPin, Trash2, Search, ShieldCheck, X,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog"
import { useI18n } from "../lib/i18n"
import { formatRelativeTime, formatNumber } from "../lib/helpers"
import { toast } from "sonner"

interface Person {
  id: string
  name: string; nameEn: string
  role: string; roleEn: string
  status: string; statusEn: string
  matchCount: number
  lastSeen: string | null
  lastSite: string | null
  lastSiteEn: string | null
  notes: string | null
}

export function WatchlistView() {
  const { t, lang } = useI18n()
  const [people, setPeople] = useState<Person[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState("all")
  const [status, setStatus] = useState("all")
  const [query, setQuery] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  // حقول النموذج
  const [fName, setFName] = useState("")
  const [fNameEn, setFNameEn] = useState("")
  const [fRole, setFRole] = useState("")
  const [fStatus, setFStatus] = useState("")
  const [fNotes, setFNotes] = useState("")
  const isAr = lang === "ar"

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (role !== "all") params.set("role", role)
    if (status !== "all") params.set("status", status)
    try {
      const res = await fetch(`/api/watchlist?${params}`)
      const data = await res.json()
      const filtered = query
        ? data.filter((p: Person) =>
            (isAr ? p.name : p.nameEn).toLowerCase().includes(query.toLowerCase())
          )
        : data
      setPeople(filtered)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [role, status, query, isAr])

  useEffect(() => {
    const tmr = setTimeout(load, 200)
    return () => clearTimeout(tmr)
  }, [load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!fName || !fRole) {
      toast.error(isAr ? "الاسم والصف إلزاميان" : "Name and role required")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fName,
          nameEn: fNameEn || fName,
          role: fRole,
          roleEn: ({ "موظف": "Employee", "زائر": "Visitor", "ممنوع": "Banned" }[fRole]) || fRole,
          status: fStatus,
          statusEn: fStatus === "موقوف" ? "Suspended" : "Active",
          notes: fNotes,
        }),
      })
      if (res.ok) {
        toast.success(isAr ? "تمت الإضافة لقائمة المراقبة" : "Added to watchlist")
        setDialogOpen(false)
        setFName(""); setFNameEn(""); setFRole(""); setFStatus("نشط"); setFNotes("")
        load()
      } else {
        toast.error(isAr ? "فشل الإضافة" : "Failed")
      }
    } catch {
      toast.error(isAr ? "خطأ" : "Error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" })
      if (res.ok) {
        setPeople((prev) => prev?.filter((p) => p.id !== id) || null)
        toast.success(isAr ? "تم الحذف" : "Removed")
      } else {
        toast.error(isAr ? "فشل الحذف" : "Failed")
      }
    } catch {
      toast.error(isAr ? "خطأ" : "Error")
    } finally {
      setDeleting(null)
    }
  }

  const roleBg: Record<string, string> = {
    "موظف": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    "زائر": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
    "ممنوع": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  }
  const statusBg: Record<string, string> = {
    "نشط": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
    "موقوف": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  }

  const stats = people ? {
    total: people.length,
    active: people.filter((p) => p.statusEn === "Active").length,
    banned: people.filter((p) => p.roleEn === "Banned").length,
    matches: people.reduce((s, p) => s + p.matchCount, 0),
  } : null

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">{isAr ? "قائمة الوجوه المراقبة" : "Watchlist"}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isAr ? "إدارة الأشخاص المرخص لهم والممنوعين مع تتبع المطابقات" : "Manage authorized and banned individuals with match tracking"}
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-nathra text-primary-foreground">
              <UserPlus className="h-4 w-4" />{isAr ? "إضافة شخص" : "Add Person"}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{isAr ? "إضافة شخص لقائمة المراقبة" : "Add to Watchlist"}</DialogTitle>
              <DialogDescription>
                {isAr ? "أدخل بيانات الشخص. سيتم تطبيق المصادقة بملامح الوجه عند الكشف." : "Enter person details. Face authentication will apply on detection."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isAr ? "الاسم (عربي)" : "Name (Arabic)"}</Label>
                  <Input value={fName} onChange={(e) => setFName(e.target.value)} placeholder="الاسم" />
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? "الاسم (إنجليزي)" : "Name (English)"}</Label>
                  <Input value={fNameEn} onChange={(e) => setFNameEn(e.target.value)} placeholder="Name" dir="ltr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>{isAr ? "الصفة" : "Role"}</Label>
                  <Select value={fRole} onValueChange={setFRole}>
                    <SelectTrigger><SelectValue placeholder={isAr ? "اختر" : "Select"} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="موظف">{isAr ? "موظف" : "Employee"}</SelectItem>
                      <SelectItem value="زائر">{isAr ? "زائر" : "Visitor"}</SelectItem>
                      <SelectItem value="ممنوع">{isAr ? "ممنوع" : "Banned"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>{isAr ? "الحالة" : "Status"}</Label>
                  <Select value={fStatus} onValueChange={setFStatus}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="نشط">{isAr ? "نشط" : "Active"}</SelectItem>
                      <SelectItem value="موقوف">{isAr ? "موقوف" : "Suspended"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>{isAr ? "ملاحظات" : "Notes"}</Label>
                <Input value={fNotes} onChange={(e) => setFNotes(e.target.value)} placeholder={isAr ? "ملاحظات..." : "Notes..."} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>{isAr ? "إلغاء" : "Cancel"}</Button>
                <Button type="submit" disabled={submitting} className="gap-2 gradient-nathra text-primary-foreground">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  {isAr ? "إضافة" : "Add"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* إحصائيات */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-extrabold tabular-nums">{formatNumber(stats.total, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "إجمالي" : "Total"}</p>
          </Card>
          <Card className="p-3 text-center bg-emerald-500/5 border-emerald-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400">{formatNumber(stats.active, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "نشط" : "Active"}</p>
          </Card>
          <Card className="p-3 text-center bg-red-500/5 border-red-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-red-600 dark:text-red-400">{formatNumber(stats.banned, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "ممنوع" : "Banned"}</p>
          </Card>
          <Card className="p-3 text-center bg-cyan-500/5 border-cyan-500/20">
            <p className="text-2xl font-extrabold tabular-nums text-cyan-600 dark:text-cyan-400">{formatNumber(stats.matches, lang)}</p>
            <p className="text-[11px] text-muted-foreground">{isAr ? "مطابقات" : "Matches"}</p>
          </Card>
        </div>
      )}

      {/* تصفية */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={isAr ? "ابحث عن شخص..." : "Search person..."} value={query} onChange={(e) => setQuery(e.target.value)} className="pr-9" />
          </div>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder={isAr ? "الصفة" : "Role"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الصفات" : "All roles"}</SelectItem>
              <SelectItem value="Employee">{isAr ? "موظف" : "Employee"}</SelectItem>
              <SelectItem value="Visitor">{isAr ? "زائر" : "Visitor"}</SelectItem>
              <SelectItem value="Banned">{isAr ? "ممنوع" : "Banned"}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder={isAr ? "الحالة" : "Status"} /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{isAr ? "كل الحالات" : "All statuses"}</SelectItem>
              <SelectItem value="Active">{isAr ? "نشط" : "Active"}</SelectItem>
              <SelectItem value="Suspended">{isAr ? "موقوف" : "Suspended"}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* القائمة */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : people && people.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">{isAr ? "لا أشخاص مطابقون" : "No matching people"}</Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {people?.map((p) => {
            const name = isAr ? p.name : p.nameEn
            const role = isAr ? p.role : p.roleEn
            const status = isAr ? p.status : p.statusEn
            const site = isAr ? p.lastSite : p.lastSiteEn
            const initials = (isAr ? p.nameEn : p.nameEn).split(" ").map((s) => s[0]).slice(0, 2).join("")
            const isBanned = p.roleEn === "Banned"
            return (
              <Card key={p.id} className={`p-4 ${isBanned ? "border-red-500/30" : ""}`}>
                <div className="flex items-start gap-3">
                  <Avatar className={`h-12 w-12 ${isBanned ? "ring-2 ring-red-500/30" : ""}`}>
                    <AvatarFallback className={isBanned ? "bg-red-500/15 text-red-600 dark:text-red-400" : "gradient-nathra text-primary-foreground"}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-sm truncate flex items-center gap-1.5">
                        {isBanned ? <Ban className="h-3.5 w-3.5 text-red-500 shrink-0" /> : <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                        {name}
                      </h3>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deleting === p.id}
                        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                        aria-label="delete"
                      >
                        {deleting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${roleBg[p.role] || ""}`}>{role}</Badge>
                      <Badge variant="outline" className={`text-[10px] ${statusBg[p.status] || ""}`}>{status}</Badge>
                    </div>
                    {p.notes && (
                      <p className="text-[11px] text-muted-foreground mt-2 line-clamp-1">{p.notes}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t">
                      <div>
                        <p className="text-[10px] text-muted-foreground">{isAr ? "المطابقات" : "Matches"}</p>
                        <p className="text-sm font-bold text-primary tabular-nums">{formatNumber(p.matchCount, lang)}</p>
                      </div>
                      {p.lastSeen && (
                        <div className="text-left">
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                            <Clock className="h-2.5 w-2.5" />{formatRelativeTime(p.lastSeen, lang)}
                          </p>
                          {site && (
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                              <MapPin className="h-2.5 w-2.5" />{site}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* بطاقة امتثال */}
      <Card className="p-5 gradient-nathra-soft border-primary/20">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-nathra text-primary-foreground shrink-0">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-base mb-1">{isAr ? "الامتثال ونظام حماية البيانات PDPL" : "PDPL Compliance"}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isAr
                ? "تخزَّن بيانات القائمة محلياً On-Premises مع تشفير كامل. المصادقة بملامح الوجه تتم بموافقة صريحة ولا تُنقل البيانات الحيوية خارج البنية التحتية للمنشأة."
                : "Watchlist data is stored on-premises with full encryption. Face authentication requires explicit consent, and biometric data never leaves the organization's infrastructure."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
