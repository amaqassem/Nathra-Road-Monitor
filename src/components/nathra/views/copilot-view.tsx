'use client'

import { useState, useRef, useEffect } from "react"
import {
  Loader2, Send, BrainCircuit, User, ShieldAlert, Database,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "../lib/i18n"
import { formatNumber } from "../lib/helpers"
import { toast } from "sonner"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  dataContext?: {
    generatedAt: string
    sources: string[]
    recordsAnalyzed: number
  }
  error?: boolean
}

export function CopilotView() {
  const { lang } = useI18n()
  const isAr = lang === "ar"
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const suggestions = [
    { ar: "ما أخطر المواقع اليوم؟", en: "What are the riskiest sites today?" },
    { ar: "كم عدد الحوادث الحرجة؟", en: "How many critical incidents?" },
    { ar: "ما الكاميرات المتوقفة؟", en: "Which cameras are offline?" },
    { ar: "ما أكثر أنواع المخالفات تكراراً؟", en: "Most common violation types?" },
  ]

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const ask = async (question: string) => {
    const q = question.trim()
    if (!q || loading) return
    setInput("")

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: q }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, lang }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "failed")
      }
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        dataContext: data.dataContext,
      }
      setMessages((prev) => [...prev, assistantMsg])
    } catch (e) {
      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: isAr
          ? "تعذّر الاتصال بالمساعد. حاول مرة أخرى."
          : "Failed to reach the assistant. Try again.",
        error: true,
      }
      setMessages((prev) => [...prev, assistantMsg])
      toast.error(isAr ? "فشل الطلب" : "Request failed")
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    ask(input)
  }

  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-nathra text-primary-foreground shrink-0">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">
              {isAr ? "مساعد نظرة الذكي" : "Nathra AI Copilot"}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isAr ? "اسأل عن أي بيانات في النظام — يجيب من البيانات الفعلية فقط" : "Ask anything about system data — grounded in real records only"}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* chat column */}
        <div className="lg:col-span-3 space-y-3">
          <Card className="p-0 overflow-hidden">
            {/* messages */}
            <div ref={scrollRef} className="max-h-[500px] min-h-[400px] overflow-y-auto custom-scroll p-4 space-y-3">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-nathra-soft text-primary mb-3">
                    <BrainCircuit className="h-7 w-7" />
                  </div>
                  <p className="font-semibold text-sm mb-1">
                    {isAr ? "مرحباً، أنا مساعد نظرة" : "Hi, I'm Nathra Copilot"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {isAr
                      ? "اطرح أي سؤال عن المواقع أو الكاميرات أو الحوادث أو الأدلة، وسأجيب من بيانات النظام الفعلية."
                      : "Ask any question about sites, cameras, incidents, or evidence — grounded in real system data."}
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg shrink-0 ${
                    m.role === "user"
                      ? "bg-muted text-muted-foreground"
                      : m.error
                        ? "bg-red-500/15 text-red-600 dark:text-red-400"
                        : "gradient-nathra text-primary-foreground"
                  }`}>
                    {m.role === "user" ? <User className="h-3.5 w-3.5" /> : <BrainCircuit className="h-3.5 w-3.5" />}
                  </div>
                  <div className={`max-w-[80%] ${m.role === "user" ? "items-end text-right" : ""}`}>
                    <div className={`rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary/10 text-foreground"
                        : m.error
                          ? "bg-red-500/10 border border-red-500/20 text-foreground"
                          : "bg-muted/60 border text-foreground"
                    }`}>
                      {m.content}
                    </div>
                    {m.role === "assistant" && m.dataContext && (
                      <div className="mt-1 flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] gap-0.5 bg-cyan-500/5 border-cyan-500/20 text-cyan-700 dark:text-cyan-400">
                          <Database className="h-2.5 w-2.5" />
                          {formatNumber(m.dataContext.recordsAnalyzed, lang)} {isAr ? "سجل" : "records"}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground">
                          · {new Date(m.dataContext.generatedAt).toLocaleString(isAr ? "ar-SA" : "en-US", {
                            hour: "2-digit", minute: "2-digit", day: "numeric", month: "short",
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-nathra text-primary-foreground shrink-0">
                    <BrainCircuit className="h-3.5 w-3.5" />
                  </div>
                  <div className="rounded-xl px-3 py-2 bg-muted/60 border flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">
                      {isAr ? "يحلّل البيانات الفعلية…" : "Analyzing real data…"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* suggestions + input */}
            <div className="border-t p-3 space-y-2.5 bg-muted/30">
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => ask(isAr ? s.ar : s.en)}
                    disabled={loading}
                    className="text-[11px] px-2.5 py-1 rounded-full border bg-background hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAr ? s.ar : s.en}
                  </button>
                ))}
              </div>
              <form onSubmit={onSubmit} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isAr ? "اكتب سؤالك…" : "Type your question…"}
                  disabled={loading}
                  className="h-10 text-sm"
                />
                <Button type="submit" disabled={loading || !input.trim()} className="gap-1.5 gradient-nathra text-primary-foreground h-10 px-4">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 rtl:rotate-180" />}
                  <span className="hidden sm:inline">{isAr ? "إرسال" : "Send"}</span>
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* sidebar — disclaimer + tips */}
        <div className="space-y-3">
          <Card className="p-4 bg-amber-500/5 border-amber-500/20">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold mb-1">{isAr ? "تنبيه" : "Disclaimer"}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {isAr
                    ? "يجيب المساعد من بيانات النظام الفعلية فقط ولا يخترع أرقاماً. للإجراءات الحساسة أكّد يدوياً."
                    : "Answers use only real system data. Confirm sensitive actions manually."}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-primary" />
              {isAr ? "مصادر البيانات" : "Data Sources"}
            </p>
            <ul className="space-y-1 text-[11px] text-muted-foreground">
              {(isAr
                ? ["المواقع", "الكاميرات", "الحوادث", "التنبيهات", "خطوط الإنتاج", "الجهات", "الأدلة", "صحة النظام"]
                : ["Sites", "Cameras", "Incidents", "Alerts", "Pipelines", "Authorities", "Evidence", "System Health"]
              ).map((s) => (
                <li key={s} className="flex items-center gap-1.5">
                  <span className="h-1 w-1 rounded-full bg-primary/60" />
                  {s}
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-4 bg-cyan-500/5 border-cyan-500/20">
            <p className="text-xs font-semibold mb-1 text-cyan-700 dark:text-cyan-400">
              {isAr ? "نصيحة" : "Tip"}
            </p>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {isAr
                ? "كل سؤال يجري تحليل بيانات لحظي من قاعدة البيانات، لذا قد تستغرق الإجابة بضع ثوانٍ."
                : "Each question runs a fresh query against the database, so answers may take a few seconds."}
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}
