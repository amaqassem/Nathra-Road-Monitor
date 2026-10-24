import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const alerts = await db.alert.findMany({
      where: {
        AND: [
          status && status !== "all" ? { status } : {},
          severity && severity !== "all" ? { severity } : {},
        ],
      },
      include: { camera: true, site: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(alerts);
  } catch (error) {
    console.error("Alerts error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cameraId, siteId, type, typeEn, severity, description, descriptionEn, confidence } = body;

    if (!cameraId || !siteId || !type || !severity) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const alert = await db.alert.create({
      data: {
        cameraId,
        siteId,
        type,
        typeEn: typeEn || type,
        severity,
        status: "active",
        description: description || "",
        descriptionEn: descriptionEn || description || "",
        confidence: confidence || 85,
      },
    });

    return NextResponse.json(alert);
  } catch (error) {
    console.error("Create alert error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
