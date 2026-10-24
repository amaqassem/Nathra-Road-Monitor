'use client'

import { useEffect, useState } from "react"
import { Eye, Sun, Moon, Languages, ShieldCheck, Wifi, Activity } from "lucide-react"
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
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(new Date())

  return (
    <header className="gradient-nathra text-primary-foreground relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-16 h-72 w-72 rounded-full bg-violet-400/10 blur-3xl" />

      <div className="container mx-auto max-w-7xl px-4 relative">
        <div className="flex items-center justify-between gap-4 py-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                <Eye className="h-7 w-7" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-cyan-300 ring-2 ring-white/40" />
              </span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight">
                {t("app.name")}
              </h1>
              <p className="text-[11px] md:text-xs text-primary-foreground/80 font-medium">
                {t("app.tagline")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 ring-1 ring-white/15">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                <span className="text-xs font-semibold">{t("app.live")}</span>
              </div>
              <span className="h-3 w-px bg-white/20" />
              <Wifi className="h-3.5 w-3.5" />
              <Activity className="h-3.5 w-3.5" />
            </div>

            <div className="hidden md:block" dir={lang === "ar" ? "rtl" : "ltr"}>
              <div className="text-sm font-bold tabular-nums tracking-wide" suppressHydrationWarning>
                {time || "--:--:--"}
              </div>
              <div className="text-[10px] text-primary-foreground/70">{dateStr}</div>
            </div>

            {/* مبدّل اللغة */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLang(lang === "ar" ? "en" : "ar")}
              className="bg-white/15 hover:bg-white/25 text-primary-foreground ring-1 ring-white/20 gap-1.5 h-9"
              aria-label={t("header.lang")}
            >
              <Languages className="h-4 w-4" />
              <span className="text-xs font-bold">{lang === "ar" ? "EN" : "ع"}</span>
            </Button>

            <Button
              variant="secondary"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="bg-white/15 hover:bg-white/25 text-primary-foreground ring-1 ring-white/20 h-9 w-9"
              aria-label={t("header.theme")}
              suppressHydrationWarning
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* شريط الامتثال */}
      <div className="border-t border-white/10 bg-black/10">
        <div className="container mx-auto max-w-7xl px-4 py-1.5">
          <div className="flex items-center justify-center gap-1.5 text-[10px] text-primary-foreground/70">
            <ShieldCheck className="h-3 w-3" />
            <span className="font-semibold">PDPL</span>
            <span>·</span>
            <span className="font-semibold">GDPR</span>
            <span>·</span>
            <span>{lang === "ar" ? "نشر محلي متاح" : "On-Premises Ready"}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
