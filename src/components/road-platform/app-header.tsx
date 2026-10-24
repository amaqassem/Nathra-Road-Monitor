'use client'

import { useEffect, useState } from "react"
import { ShieldCheck, Sun, Moon, Activity, Wifi } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTheme } from "next-themes"

export function AppHeader() {
  const { theme, setTheme } = useTheme()
  const [time, setTime] = useState("")

  useEffect(() => {
    const update = () => {
      setTime(
        new Intl.DateTimeFormat("ar-SA", {
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
  }, [])

  const dateStr = new Intl.DateTimeFormat("ar-SA", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(new Date())

  return (
    <header className="gradient-saudi text-primary-foreground relative overflow-hidden">
      {/* نقش زخرفي */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "20px 20px",
        }}
      />
      <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-32 -right-16 h-72 w-72 rounded-full bg-amber-300/10 blur-3xl" />

      <div className="container mx-auto max-w-7xl px-4 relative">
        <div className="flex items-center justify-between gap-4 py-4 flex-wrap">
          {/* الشعار والعنوان */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <span className="absolute -bottom-1 -left-1 flex h-4 w-4">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-60" />
                <span className="relative inline-flex h-4 w-4 rounded-full bg-amber-400 ring-2 ring-white/40" />
              </span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold leading-tight tracking-tight">
                طَريق
              </h1>
              <p className="text-[11px] md:text-xs text-primary-foreground/80 font-medium">
                المنصة الوطنية لمراقبة جودة الطرق — المملكة العربية السعودية
              </p>
            </div>
          </div>

          {/* الحالة والوقت */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden sm:flex items-center gap-2 rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 ring-1 ring-white/15">
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
                </span>
                <span className="text-xs font-semibold">النظام يعمل</span>
              </div>
              <span className="h-3 w-px bg-white/20" />
              <Wifi className="h-3.5 w-3.5" />
              <Activity className="h-3.5 w-3.5" />
            </div>

            <div className="hidden md:block text-left rtl:text-right">
              <div className="text-sm font-bold tabular-nums tracking-wide" suppressHydrationWarning>
                {time || "--:--:--"}
              </div>
              <div className="text-[10px] text-primary-foreground/70">
                {dateStr}
              </div>
            </div>

            <Button
              variant="secondary"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="bg-white/15 hover:bg-white/25 text-primary-foreground ring-1 ring-white/20"
              aria-label="تبديل المظهر"
              suppressHydrationWarning
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
