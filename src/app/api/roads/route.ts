import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const region = searchParams.get("region");
    const status = searchParams.get("status");
    const q = searchParams.get("q");

    const roads = await db.roadSegment.findMany({
      where: {
        AND: [
          region && region !== "all" ? { region: { code: region } } : {},
          status && status !== "all" ? { status } : {},
          q
            ? { name: { contains: q } }
            : {},
        ],
      },
      include: {
        region: true,
        issues: { take: 3, orderBy: { createdAt: "desc" } },
        sensors: true,
      },
      orderBy: { qualityScore: "asc" },
    });

    return NextResponse.json(roads);
  } catch (error) {
    console.error("Roads error:", error);
    return NextResponse.json({ error: "فشل في تحميل الطرق" }, { status: 500 });
  }
}
