import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const metrics = await db.systemHealthMetric.findMany({
      orderBy: { recordedAt: "desc" },
      distinct: ["metric"],
    });
    // مقاييس إضافية محسوبة
    const [cameras, incidents] = await Promise.all([
      db.camera.findMany(),
      db.incident.findMany({ where: { status: { notIn: ["closed", "resolved"] } } }),
    ]);
    const online = cameras.filter((c) => c.status === "online").length;
    const offline = cameras.filter((c) => c.status === "offline").length;
    const maintenance = cameras.filter((c) => c.status === "maintenance").length;
    const openIncidents = incidents.length;
    const critical = incidents.filter((i) => i.severity === "critical").length;
    const slaBreached = incidents.filter((i) => i.slaDeadline && i.slaDeadline < new Date()).length;

    return NextResponse.json({
      metrics,
      computed: {
        cameraOnline: online,
        cameraOffline: offline,
        cameraMaintenance: maintenance,
        openIncidents,
        criticalIncidents: critical,
        slaBreached,
        overallStatus: slaBreached > 0 || critical > 0 ? "critical" : offline > 2 ? "warning" : "ok",
      },
    });
  } catch (error) {
    console.error("Health error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
