import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const sites = await db.site.findMany({
      include: {
        cameras: { select: { id: true, status: true, name: true, nameEn: true } },
        _count: { select: { alerts: true } },
      },
    });

    const result = sites.map((s) => {
      const onlineCams = s.cameras.filter((c) => c.status === "online").length;
      return {
        id: s.id,
        name: s.name,
        nameEn: s.nameEn,
        city: s.city,
        cityEn: s.cityEn,
        type: s.type,
        typeEn: s.typeEn,
        lat: s.lat,
        lng: s.lng,
        cameraCount: s.cameras.length,
        onlineCams,
        eventCount: s._count.alerts,
        safetyScore: Math.round(60 + (onlineCams / Math.max(1, s.cameras.length)) * 35),
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sites error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
