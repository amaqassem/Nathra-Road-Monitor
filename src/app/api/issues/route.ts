import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const issues = await db.issue.findMany({
      where: {
        AND: [
          status && status !== "all" ? { status } : {},
          severity && severity !== "all" ? { severity } : {},
        ],
      },
      include: { roadSegment: { include: { region: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error("Issues error:", error);
    return NextResponse.json({ error: "فشل في تحميل البلاغات" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roadSegmentId, type, severity, description, reportedBy } = body;

    if (!roadSegmentId || !type || !severity || !description) {
      return NextResponse.json(
        { error: "بيانات غير مكتملة" },
        { status: 400 }
      );
    }

    const road = await db.roadSegment.findUnique({
      where: { id: roadSegmentId },
    });

    const issue = await db.issue.create({
      data: {
        roadSegmentId,
        type,
        severity,
        description,
        reportedBy: reportedBy || "بلاغ مواطن",
        status: "جديد",
        lat: road?.lat,
        lng: road?.lng,
      },
    });

    return NextResponse.json(issue);
  } catch (error) {
    console.error("Create issue error:", error);
    return NextResponse.json({ error: "فشل في إنشاء البلاغ" }, { status: 500 });
  }
}
