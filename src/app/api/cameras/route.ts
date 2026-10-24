import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const site = searchParams.get("site");
    const q = searchParams.get("q");

    const cameras = await db.camera.findMany({
      where: {
        AND: [
          status && status !== "all" ? { status } : {},
          site && site !== "all" ? { siteId: site } : {},
          q ? {
            OR: [
              { name: { contains: q } },
              { nameEn: { contains: q } },
            ],
          } : {},
        ],
      },
      include: { site: true },
      orderBy: { events24h: "desc" },
    });

    return NextResponse.json(cameras);
  } catch (error) {
    console.error("Cameras error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
