'use client'

import { useEffect, useState } from "react"
import { Eye, Sun, Moon, Languages, ShieldCheck, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { useI18n } from "./lib/i18n"

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const { lang, setLang, t } = useI18n()
  const [time, setTime] = useState("")

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
          timeZone: "Asia/Riyadh",
        }).format(new Date())
      )
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [lang])

  const dateStr = new Intl.DateTimeFormat(lang === "ar" ? "ar-SA" : "en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Riyadh",
  }).format(new Date())

  return (
    <header className="gradient-midnight text-foreground relative overflow-hidden border-b border-white/5">
      {/* نقش زخرفي */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* توهجات ضوئية */}
      <div className="absolute -top-20 right-1/4 h-48 w-48 rounded-full bg-amber-500/8 blur-3xl" />
      <div className="absolute -bottom-16 left-1/4 h-40 w-40 rounded-full bg-blue-500/6 blur-3xl" />

      <div className="container mx-auto max-w-7xl px-4 relative">
        <div className="flex items-center justify-between gap-4 py-3.5 flex-wrap">
          {/* الشعار */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 ring-1 ring-amber-500/30">
                <Eye className="h-6 w-6 text-amber-400" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-amber-400 ring-2 ring-slate-900" />
              </span>
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold leading-none tracking-tight text-white">
                {t("app.name")}
                <span className="text-amber-400"> | NATHRA</span>
              </h1>
              <p className="text-[10px] md:text-[11px] text-white/50 font-medium mt-0.5 tracking-wide">
                {lang === "ar" ? "ذكاء يتجاوز الرؤية" : "Intelligence Beyond Vision"}
              </p>
            </div>
          </div>

          {/* اليمين: حالة + وقت + لغة + ثيم */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* حالة النظام */}
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/5 ring-1 ring-white/10 px-2.5 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="text-[11px] font-semibold text-white/80">{t("app.live")}</span>
              <span className="h-3 w-px bg-white/10" />
              <Wifi className="h-3 w-3 text-white/40" />
            </div>

            {/* الوقت */}
            <div className="hidden md:block" dir={lang === "ar" ? "rtl" : "ltr"}>
              <div className="text-sm font-bold tabular-nums tracking-tight text-white" suppressHydrationWarning>
                {time || "--:--:--"}
              </div>
              <div className="text-[9px] text-white/40 uppercase tracking-wider">{dateStr}</div>
            </div>

            {/* مبدّل اللغة */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="bg-white/5 hover:bg-white/10 text-white ring-1 ring-white/10 gap-1.5 h-9 px-3"
              aria-label={t("header.lang")}
            >
              <Languages className="h-3.5 w-3.5" />
              <span className="text-xs font-bold">{lang === "ar" ? "EN" : "ع"}</span>
            </Button>

            {/* مبدّل الثيم */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="bg-white/5 hover:bg-white/10 text-white ring-1 ring-white/10 h-9 w-9"
              aria-label={t("header.theme")}
              suppressHydrationWarning
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* شريط امتثال */}
      <div className="border-t border-white/5 bg-black/20">
        <div className="container mx-auto max-w-7xl px-4 py-1">
          <div className="flex items-center justify-center gap-2 text-[10px] text-white/40">
            <ShieldCheck className="h-3 w-3 text-amber-400/60" />
            <span class="font-semibold tracking-wide">PDPL</span>
            <span class="opacity-30">·</span>
            <span class="font-semibold tracking-wide">GDPR</span>
            <span class="opacity-30">·</span>
            <span>{lang === "ar" ? "نشر محلي متاح" : "On-Premises Ready"}</span>
            <span class="opacity-30 hidden sm:inline">·</span>
            <span class="hidden sm:inline">{lang === "ar" ? "وضع Sandbox" : "Sandbox Mode"}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
