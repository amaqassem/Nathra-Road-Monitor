import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");
    const type = searchParams.get("type");

    const incidents = await db.incident.findMany({
      where: {
        AND: [
          status && status !== "all" ? { status } : {},
          severity && severity !== "all" ? { severity } : {},
          type && type !== "all" ? { typeEn: type } : {},
        ],
      },
      include: {
        camera: { select: { id: true, name: true, nameEn: true, imagePath: true, zone: true, zoneEn: true } },
        site: { select: { id: true, name: true, nameEn: true, lat: true, lng: true } },
        authority: { select: { id: true, name: true, nameEn: true, categoryEn: true } },
        evidence: { select: { id: true, type: true, filePath: true, fileName: true, fileHash: true } },
        _count: { select: { auditLogs: true, notifications: true } },
      },
      orderBy: { detectedAt: "desc" },
    });

    // إحصائيات
    const all = await db.incident.findMany();
    const stats = {
      total: all.length,
      detected: all.filter((i) => i.status === "detected").length,
      underReview: all.filter((i) => i.status === "under_review").length,
      confirmed: all.filter((i) => i.status === "confirmed").length,
      assigned: all.filter((i) => i.status === "assigned").length,
      inProgress: all.filter((i) => i.status === "in_progress").length,
      resolved: all.filter((i) => i.status === "resolved").length,
      closed: all.filter((i) => i.status === "closed").length,
      critical: all.filter((i) => i.severity === "critical" && !["closed", "resolved"].includes(i.status)).length,
      slaBreached: all.filter((i) => i.slaDeadline && i.slaDeadline < new Date() && !["closed", "resolved"].includes(i.status)).length,
      autoCreated: all.filter((i) => i.autoCreated).length,
    };

    return NextResponse.json({ incidents, stats });
  } catch (error) {
    console.error("Incidents GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
