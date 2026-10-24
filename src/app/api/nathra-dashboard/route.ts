import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [sites, cameras, alerts, pipelines] = await Promise.all([
      db.site.findMany({ include: { cameras: true, _count: { select: { alerts: true } } } }),
      db.camera.findMany({ include: { site: true } }),
      db.alert.findMany({ include: { camera: true, site: true }, orderBy: { createdAt: "desc" } }),
      db.pipeline.findMany(),
    ]);

    const totalCameras = cameras.length;
    const onlineCameras = cameras.filter((c) => c.status === "online").length;
    const activeAlerts = alerts.filter((a) => a.status === "active").length;
    const criticalAlerts = alerts.filter((a) => a.severity === "critical" && a.status === "active").length;
    const eventsToday = alerts.filter((a) => {
      const d = new Date(a.createdAt);
      return d.toDateString() === new Date().toDateString();
    }).length;
    const activePipelines = pipelines.filter((p) => p.active).length;
    const avgConfidence = alerts.length > 0 ? Math.round(alerts.reduce((s, a) => s + a.confidence, 0) / alerts.length) : 0;

    const hourlyTrend = Array.from({ length: 8 }, (_, i) => {
      const hourStart = new Date();
      hourStart.setHours(hourStart.getHours() - (7 - i), 0, 0, 0);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hourEnd.getHours() + 1);
      const count = alerts.filter((a) => {
        const d = new Date(a.createdAt);
        return d >= hourStart && d < hourEnd;
      }).length;
      return {
        hour: `${hourStart.getHours()}:00`,
        events: count,
        alerts: Math.floor(count * 0.6),
      };
    });

    const typeMap: Record<string, number> = {};
    alerts.forEach((a) => {
      const key = a.typeEn;
      typeMap[key] = (typeMap[key] || 0) + 1;
    });
    const alertTypeDist = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

    const cameraStatusDist = {
      online: cameras.filter((c) => c.status === "online").length,
      offline: cameras.filter((c) => c.status === "offline").length,
      maintenance: cameras.filter((c) => c.status === "maintenance").length,
    };

    const topSites = sites
      .map((s) => ({
        name: s.name,
        nameEn: s.nameEn,
        city: s.city,
        cityEn: s.cityEn,
        cameras: s.cameras.length,
        events: s._count.alerts,
        onlineCams: s.cameras.filter((c) => c.status === "online").length,
      }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 6);

    const recentAlerts = alerts.slice(0, 8).map((a) => ({
      id: a.id,
      type: a.type,
      typeEn: a.typeEn,
      severity: a.severity,
      status: a.status,
      confidence: a.confidence,
      camera: a.camera.name,
      cameraEn: a.camera.nameEn,
      site: a.site.name,
      siteEn: a.site.nameEn,
      description: a.description,
      descriptionEn: a.descriptionEn,
      createdAt: a.createdAt,
    }));

    const recentEvents = cameras
      .filter((c) => c.lastEventAt)
      .sort((a, b) => (b.lastEventAt?.getTime() || 0) - (a.lastEventAt?.getTime() || 0))
      .slice(0, 8)
      .map((c) => ({
        id: c.id,
        camera: c.name,
        cameraEn: c.nameEn,
        site: c.site.name,
        siteEn: c.site.nameEn,
        model: c.model,
        modelEn: c.modelEn,
        events24h: c.events24h,
        lastEventAt: c.lastEventAt,
        status: c.status,
      }));

    return NextResponse.json({
      kpi: {
        totalCameras,
        onlineCameras,
        activeAlerts,
        criticalAlerts,
        eventsToday,
        totalSites: sites.length,
        activePipelines,
        totalPipelines: pipelines.length,
        avgConfidence,
        uptime: totalCameras > 0 ? Math.round((onlineCameras / totalCameras) * 100) : 0,
      },
      hourlyTrend,
      alertTypeDist,
      cameraStatusDist,
      topSites,
      recentAlerts,
      recentEvents,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
