'use client'

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, Cctv, BrainCircuit, Siren, BarChart3, Workflow, Users,
  ShieldAlert, FileLock2, GitBranch, Zap, MapPinned, Activity, Settings,
  Loader2, AlertTriangle,
} from "lucide-react"
import { AppHeader } from "@/components/nathra/app-header"
import { AppFooter } from "@/components/nathra/app-footer"
import { OverviewView } from "@/components/nathra/views/overview-view"
import { CamerasView } from "@/components/nathra/views/cameras-view"
import { VisionView } from "@/components/nathra/views/vision-view"
import { AlertsView } from "@/components/nathra/views/alerts-view"
import { AnalyticsView } from "@/components/nathra/views/analytics-view"
import { PipelinesView } from "@/components/nathra/views/pipelines-view"
import { WatchlistView } from "@/components/nathra/views/watchlist-view"
import { IncidentsView } from "@/components/nathra/views/incidents-view"
import { EvidenceView } from "@/components/nathra/views/evidence-view"
import { AuthorityRoutingView } from "@/components/nathra/views/authority-routing-view"
import { RulesEngineView } from "@/components/nathra/views/rules-engine-view"
import { CopilotView } from "@/components/nathra/views/copilot-view"
import { GisMapView } from "@/components/nathra/views/gis-map-view"
import { HealthView } from "@/components/nathra/views/health-view"
import { CameraManagementView } from "@/components/nathra/views/camera-management-view"
import { useI18n } from "@/components/nathra/lib/i18n"
import { toast, Toaster } from "sonner"

type TabId =
  | "overview" | "cameras" | "vision" | "alerts" | "analytics" | "pipelines" | "watchlist"
  | "incidents" | "evidence" | "routing" | "rules" | "copilot" | "gis" | "health" | "cameraMgmt"

export default function Home() {
  const { t, lang } = useI18n()
  const [activeTab, setActiveTab] = useState<TabId>("overview")
  const [seeding, setSeeding] = useState(true)
  const [seedError, setSeedError] = useState(false)

  const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard; group: number }[] = [
    { id: "overview", label: t("nav.overview"), icon: LayoutDashboard, group: 0 },
    { id: "cameras", label: t("nav.cameras"), icon: Cctv, group: 0 },
    { id: "cameraMgmt", label: t("nav.cameraMgmt"), icon: Settings, group: 0 },
    { id: "vision", label: t("nav.vision"), icon: BrainCircuit, group: 0 },
    { id: "incidents", label: t("nav.incidents"), icon: ShieldAlert, group: 1 },
    { id: "alerts", label: t("nav.alerts"), icon: Siren, group: 1 },
    { id: "evidence", label: t("nav.evidence"), icon: FileLock2, group: 1 },
    { id: "routing", label: t("nav.routing"), icon: GitBranch, group: 1 },
    { id: "rules", label: t("nav.rules"), icon: Zap, group: 1 },
    { id: "gis", label: t("nav.gis"), icon: MapPinned, group: 2 },
    { id: "analytics", label: t("nav.analytics"), icon: BarChart3, group: 2 },
    { id: "copilot", label: t("nav.copilot"), icon: BrainCircuit, group: 2 },
    { id: "health", label: t("nav.health"), icon: Activity, group: 2 },
    { id: "pipelines", label: t("nav.pipelines"), icon: Workflow, group: 2 },
    { id: "watchlist", label: t("nav.watchlist"), icon: Users, group: 2 },
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

  // تقسيم التبويبات إلى مجموعات بفواصل
  const groups = [0, 1, 2]
  const groupTabs = (g: number) => TABS.filter((tab) => tab.group === g)

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader />

      <nav className="sticky top-0 z-40 glass border-b border-border">
        <div className="container mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-1 overflow-x-auto custom-scroll py-2">
            {groups.map((g, gi) => (
              <div key={g} className="flex items-center gap-1">
                {gi > 0 && <div className="h-5 w-px bg-border mx-1 shrink-0" />}
                {groupTabs(g).map((tab) => {
                  const Icon = tab.icon
                  const active = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
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
            ))}
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
              {activeTab === "cameraMgmt" && <CameraManagementView />}
              {activeTab === "vision" && <VisionView />}
              {activeTab === "incidents" && <IncidentsView />}
              {activeTab === "alerts" && <AlertsView />}
              {activeTab === "evidence" && <EvidenceView />}
              {activeTab === "routing" && <AuthorityRoutingView />}
              {activeTab === "rules" && <RulesEngineView />}
              {activeTab === "gis" && <GisMapView />}
              {activeTab === "analytics" && <AnalyticsView />}
              {activeTab === "copilot" && <CopilotView />}
              {activeTab === "health" && <HealthView />}
              {activeTab === "pipelines" && <PipelinesView />}
              {activeTab === "watchlist" && <WatchlistView />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <AppFooter />
      <Toaster richColors position="top-center" />
    </div>
  )
}
