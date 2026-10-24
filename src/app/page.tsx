'use client'

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LayoutDashboard, MapIcon, Route, AlertTriangle, BarChart3, BrainCircuit, Loader2 } from "lucide-react"
import { AppHeader } from "@/components/road-platform/app-header"
import { AppFooter } from "@/components/road-platform/app-footer"
import { DashboardView } from "@/components/road-platform/views/dashboard-view"
import { MapView } from "@/components/road-platform/views/map-view"
import { RoadsView } from "@/components/road-platform/views/roads-view"
import { ReportsView } from "@/components/road-platform/views/reports-view"
import { AnalyticsView } from "@/components/road-platform/views/analytics-view"
import { AiAnalysisView } from "@/components/road-platform/views/ai-analysis-view"
import { toast, Toaster } from "sonner"

type TabId = "dashboard" | "map" | "roads" | "reports" | "analytics" | "ai"

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { id: "map", label: "الخريطة", icon: MapIcon },
  { id: "roads", label: "الطرق", icon: Route },
  { id: "reports", label: "البلاغات", icon: AlertTriangle },
  { id: "analytics", label: "التحليلات", icon: BarChart3 },
  { id: "ai", label: "التحليل الذكي", icon: BrainCircuit },
]

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard")
  const [seeding, setSeeding] = useState(true)
  const [seedError, setSeedError] = useState(false)

  const ensureSeeded = useCallback(async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" })
      const data = await res.json()
      if (data.seeded) {
        toast.success("تمت تهيئة البيانات", {
          description: "تم تحميل بيانات الطرق والمناطق بنجاح",
        })
      }
    } catch (e) {
      console.error(e)
      setSeedError(true)
    } finally {
      setSeeding(false)
    }
  }, [])

  useEffect(() => {
    ensureSeeded()
  }, [ensureSeeded])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      {/* شريط التنقل بين الأقسام */}
      <nav className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-1 overflow-x-auto custom-scroll py-2">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const active = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                    active
                      ? "text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 rounded-lg gradient-saudi"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon className="relative z-10 h-4 w-4" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      <main className="flex-1 container mx-auto max-w-7xl px-4 py-6 md:py-8">
        {seeding ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground font-arabic">
              جارٍ تهيئة بيانات الطرق والمناطق...
            </p>
          </div>
        ) : seedError ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground">
              تعذّر تحميل البيانات. يرجى تحديث الصفحة.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "dashboard" && <DashboardView />}
              {activeTab === "map" && <MapView />}
              {activeTab === "roads" && <RoadsView />}
              {activeTab === "reports" && <ReportsView />}
              {activeTab === "analytics" && <AnalyticsView />}
              {activeTab === "ai" && <AiAnalysisView />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AppFooter />
      <Toaster richColors position="top-center" />
    </div>
  )
}
