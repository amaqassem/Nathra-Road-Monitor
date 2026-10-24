import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const regions = await db.region.findMany({
      include: {
        roads: {
          select: {
            id: true,
            name: true,
            qualityScore: true,
            status: true,
            length: true,
            highway: true,
            lat: true,
            lng: true,
          },
        },
      },
    });

    const result = regions.map((r) => {
      const score =
        r.roads.length > 0
          ? Math.round(r.roads.reduce((s, x) => s + x.qualityScore, 0) / r.roads.length)
          : 0;
      const statusDist = {
        "ممتاز": r.roads.filter((x) => x.status === "ممتاز").length,
        "جيد": r.roads.filter((x) => x.status === "جيد").length,
        "متوسط": r.roads.filter((x) => x.status === "متوسط").length,
        "رديء": r.roads.filter((x) => x.status === "رديء").length,
      };
      return {
        id: r.id,
        name: r.name,
        code: r.code,
        lat: r.lat,
        lng: r.lng,
        score,
        roadCount: r.roads.length,
        totalLength: Math.round(r.roads.reduce((s, x) => s + x.length, 0) * 10) / 10,
        statusDist,
        roads: r.roads,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Regions error:", error);
    return NextResponse.json({ error: "فشل في تحميل المناطق" }, { status: 500 });
  }
}
