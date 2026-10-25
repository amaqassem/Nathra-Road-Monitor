import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Background scanner — قابل للجدولة بـ cron دون فتح المتصفح
// مثال: curl -X POST http://localhost:3000/api/cron/scan
export async function POST() {
  try {
    const onlineCameras = await db.camera.findMany({
      where: { status: "online" },
      include: { site: true },
    });

    if (onlineCameras.length === 0) {
      return NextResponse.json({ success: false, message: "No online cameras" });
    }

    // افحص كاميرا واحدة عشوائية في كل استدعاء (لتوزيع الحمل)
    // في الإنتاج: يُجدول هذا الـ endpoint كل دقيقة عبر cron خارجي
    const camera = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];

    // استدعاء منطق الفحص (نفس /api/auto-scan لكن داخلياً)
    const scanRes = await fetch(`http://localhost:${process.env.PORT || 3000}/api/auto-scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cameraId: camera.id }),
    });
    const result = await scanRes.json();

    return NextResponse.json({
      success: true,
      scannedCamera: camera.nameEn,
      timestamp: new Date().toISOString(),
      result,
      note: "Background scan executed. In production, schedule this endpoint via external cron (e.g., every 60s).",
    });
  } catch (error) {
    console.error("Cron scan error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
