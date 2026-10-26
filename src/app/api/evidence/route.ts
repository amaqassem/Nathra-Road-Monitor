import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const evidence = await db.incidentEvidence.findMany({
      include: {
        incident: {
          select: { id: true, incidentNo: true, type: true, typeEn: true, severity: true, site: { select: { name: true, nameEn: true } } },
        },
      },
      orderBy: { capturedAt: "desc" },
    });
    const stats = {
      total: evidence.length,
      images: evidence.filter((e) => e.type === "image").length,
      videos: evidence.filter((e) => e.type === "video").length,
      totalSize: evidence.reduce((s, e) => s + e.fileSize, 0),
    };
    return NextResponse.json({ evidence, stats });
  } catch (error) {
    console.error("Evidence error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
