import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [roads, issues, regions, sensors, inspections] = await Promise.all([
      db.roadSegment.findMany({ include: { region: true } }),
      db.issue.findMany({ include: { roadSegment: { include: { region: true } } }, orderBy: { createdAt: "desc" } }),
      db.region.findMany({ include: { roads: true } }),
      db.sensor.findMany(),
      db.inspection.findMany({ orderBy: { date: "desc" }, take: 50 }),
    ]);

    const totalRoads = roads.length;
    const totalLength = roads.reduce((sum, r) => sum + r.length, 0);
    const avgScore =
      totalRoads > 0
        ? Math.round(roads.reduce((sum, r) => sum + r.qualityScore, 0) / totalRoads)
        : 0;

    const openIssues = issues.filter((i) => i.status !== "تم الحل").length;
    const criticalIssues = issues.filter(
      (i) => i.severity === "حرجة" && i.status !== "تم الحل"
    ).length;
    const activeSensors = sensors.filter((s) => s.status === "نشط").length;

    const statusDist = {
      "ممتاز": roads.filter((r) => r.status === "ممتاز").length,
      "جيد": roads.filter((r) => r.status === "جيد").length,
      "متوسط": roads.filter((r) => r.status === "متوسط").length,
      "رديء": roads.filter((r) => r.status === "رديء").length,
    };

    const issueTypeMap: Record<string, number> = {};
    issues.forEach((i) => {
      issueTypeMap[i.type] = (issueTypeMap[i.type] || 0) + 1;
    });
    const issueTypeDist = Object.entries(issueTypeMap).map(([name, value]) => ({
      name,
      value,
    }));

    const regionStats = regions.map((r) => {
      const rRoads = r.roads;
      const score =
        rRoads.length > 0
          ? Math.round(
              rRoads.reduce((s, x) => s + x.qualityScore, 0) / rRoads.length
            )
          : 0;
      return { name: r.name, code: r.code, score, roads: rRoads.length, lat: r.lat, lng: r.lng };
    });

    const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس"];
    const monthlyTrend = months.map((m, idx) => {
      const baseScore = avgScore - 8 + idx * 1.2;
      return {
        month: m,
        "جودة": Math.round(Math.max(40, Math.min(95, baseScore + Math.sin(idx) * 3))),
        "هدف": 80,
      };
    });

    const recentIssues = issues.slice(0, 8).map((i) => ({
      id: i.id,
      type: i.type,
      severity: i.severity,
      status: i.status,
      road: i.roadSegment.name,
      region: i.roadSegment.region.name,
      reportedBy: i.reportedBy,
      createdAt: i.createdAt,
    }));

    const worstRoads = [...roads]
      .sort((a, b) => a.qualityScore - b.qualityScore)
      .slice(0, 6)
      .map((r) => ({
        id: r.id,
        name: r.name,
        region: r.region.name,
        score: r.qualityScore,
        status: r.status,
        length: r.length,
        highway: r.highway,
      }));

    const recentInspections = inspections.slice(0, 6).map((i) => ({
      id: i.id,
      inspector: i.inspector,
      score: i.score,
      notes: i.notes,
      date: i.date,
    }));

    return NextResponse.json({
      kpi: {
        totalRoads,
        totalLength: Math.round(totalLength * 10) / 10,
        avgScore,
        openIssues,
        criticalIssues,
        activeSensors,
        totalSensors: sensors.length,
        regions: regions.length,
        totalInspections: inspections.length,
      },
      statusDist,
      issueTypeDist,
      regionStats,
      monthlyTrend,
      recentIssues,
      worstRoads,
      recentInspections,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json(
      { error: "فشل في تحميل البيانات" },
      { status: 500 }
    );
  }
}
