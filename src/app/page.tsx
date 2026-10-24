'use client'

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard,
  Cctv,
  BrainCircuit,
  Siren,
  BarChart3,
  Workflow,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { AppHeader } from "@/components/nathra/app-header"
import { AppFooter } from "@/components/nathra/app-footer"
import { OverviewView } from "@/components/nathra/views/overview-view"
import { CamerasView } from "@/components/nathra/views/cameras-view"
import { VisionView } from "@/components/nathra/views/vision-view"
import { AlertsView } from "@/components/nathra/views/alerts-view"
import { AnalyticsView } from "@/components/nathra/views/analytics-view"
import { PipelinesView } from "@/components/nathra/views/pipelines-view"
import { useI18n } from "@/components/nathra/lib/i18n"
import { toast, Toaster } from "sonner"

type TabId = "overview" | "cameras" | "vision" | "alerts" | "analytics" | "pipelines"

export default function Home() {
  const { t, lang } = useI18n()
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [seeding, setSeeding] = useState(true)
  const [seedError, setSeedError] = useState(false)

  const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: t("nav.overview"), icon: LayoutDashboard },
    { id: "cameras", label: t("nav.cameras"), icon: Cctv },
    { id: "vision", label: t("nav.vision"), icon: BrainCircuit },
    { id: "alerts", label: t("nav.alerts"), icon: Siren },
    { id: "analytics", label: t("nav.analytics"), icon: BarChart3 },
    { id: "pipelines", label: t("nav.pipelines"), icon: Workflow },
  ]

  const ensureSeeded = useCallback(async () => {
    try {
      const res = await fetch("/api/seed", { method: "POST" })
      const data = await res.json()
      if (data.seeded) {
        toast.success(t("app.seeded"), { description: t("app.seededDesc") })
      }
    } catch (e) {
      console.error(e)
      setSeedError(true)
    } finally {
      setSeeding(false)
    }
  }, [t])

  useEffect(() => {
    ensureSeeded()
  }, [ensureSeeded])

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

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
                      className="absolute inset-0 rounded-lg gradient-nathra"
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
            <p className="text-muted-foreground">{t("app.loading")}</p>
          </div>
        ) : seedError ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <p className="text-muted-foreground">{t("app.error")}</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + lang}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === "overview" && <OverviewView />}
              {activeTab === "cameras" && <CamerasView />}
              {activeTab === "vision" && <VisionView />}
              {activeTab === "alerts" && <AlertsView />}
              {activeTab === "analytics" && <AnalyticsView />}
              {activeTab === "pipelines" && <PipelinesView />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AppFooter />
      <Toaster richColors position="top-center" />
    </div>
  )
}
