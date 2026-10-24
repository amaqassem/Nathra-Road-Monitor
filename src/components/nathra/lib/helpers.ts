import type { Lang } from "./i18n"

export type AlertType = "intrusion" | "crowd" | "suspicious" | "loitering" | "fight" | "fall" | "face" | "perimeter"
export type Severity = "critical" | "high" | "medium" | "low"
export type AlertStatus = "active" | "acknowledged" | "resolved"
export type CameraStatus = "online" | "offline" | "maintenance"

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: "#dc2626",
  high: "#ea580c",
  medium: "#d97706",
  low: "#0891b2",
}

export const SEVERITY_BG: Record<Severity, string> = {
  critical: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  high: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  medium: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  low: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border-cyan-500/25",
}

export const ALERT_STATUS_BG: Record<AlertStatus, string> = {
  active: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  acknowledged: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  resolved: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
}

export const CAMERA_STATUS_BG: Record<CameraStatus, string> = {
  online: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  offline: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
  maintenance: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
}

export const CAMERA_STATUS_DOT: Record<CameraStatus, string> = {
  online: "#10b981",
  offline: "#ef4444",
  maintenance: "#f59e0b",
}

export function formatRelativeTime(date: string | Date, lang: Lang): string {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  const locale = lang === "ar" ? "ar-SA" : "en-US"
  if (diff < 60) return lang === "ar" ? "قبل لحظات" : "just now"
  if (diff < 3600) {
    const m = Math.floor(diff / 60)
    return lang === "ar" ? `قبل ${m} دقيقة` : `${m}m ago`
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600)
    return lang === "ar" ? `قبل ${h} ساعة` : `${h}h ago`
  }
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(d)
}

export function formatDate(date: string | Date, lang: Lang): string {
  const locale = lang === "ar" ? "ar-SA" : "en-US"
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

export function formatNumber(n: number, lang: Lang): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-SA" : "en-US").format(n)
}

export function scoreColor(score: number): string {
  if (score >= 85) return "#10b981"
  if (score >= 70) return "#65a30d"
  if (score >= 50) return "#d97706"
  return "#dc2626"
}
