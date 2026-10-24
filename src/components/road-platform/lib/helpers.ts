// أدوات مساعدة مشتركة للمنصة

export type RoadStatus = "ممتاز" | "جيد" | "متوسط" | "رديء"

export const STATUS_COLORS: Record<RoadStatus, string> = {
  "ممتاز": "#16a34a",
  "جيد": "#65a30d",
  "متوسط": "#d97706",
  "رديء": "#dc2626",
}

export const STATUS_BG: Record<RoadStatus, string> = {
  "ممتاز": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
  "جيد": "bg-lime-500/15 text-lime-700 dark:text-lime-400 border-lime-500/25",
  "متوسط": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  "رديء": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
}

export const SEVERITY_BG: Record<string, string> = {
  "منخفضة": "bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/25",
  "متوسطة": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  "عالية": "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/25",
  "حرجة": "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25",
}

export const ISSUE_STATUS_BG: Record<string, string> = {
  "جديد": "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25",
  "قيد المعالجة": "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25",
  "تم الحل": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25",
}

export function scoreColor(score: number): string {
  if (score >= 85) return "#16a34a"
  if (score >= 70) return "#65a30d"
  if (score >= 50) return "#d97706"
  return "#dc2626"
}

export function scoreStatus(score: number): RoadStatus {
  if (score >= 85) return "ممتاز"
  if (score >= 70) return "جيد"
  if (score >= 50) return "متوسط"
  return "رديء"
}

export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000)
  if (diff < 60) return "قبل لحظات"
  if (diff < 3600) return `قبل ${Math.floor(diff / 60)} دقيقة`
  if (diff < 86400) return `قبل ${Math.floor(diff / 3600)} ساعة`
  if (diff < 2592000) return `قبل ${Math.floor(diff / 86400)} يوم`
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "short",
  }).format(d)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("ar-SA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(new Date(date))
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("ar-SA").format(n)
}
