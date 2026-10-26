import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// إدارة الكاميرات — إضافة كاميرا ببيانات بث فعلية (RTSP/ONVIF/HLS)
// ملاحظة: بيانات الاعتماد تُخزّن على الخادم فقط ولا تُرجع للعميل
export async function GET() {
  try {
    const cameras = await db.camera.findMany({
      select: {
        id: true, name: true, nameEn: true, status: true, resolution: true, fps: true,
        model: true, modelEn: true, zone: true, zoneEn: true, imagePath: true,
        streamType: true, isLive: true, events24h: true, lastEventAt: true,
        site: { select: { id: true, name: true, nameEn: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    // لا نرجع streamUrl أو credentials أبداً
    return NextResponse.json(cameras);
  } catch (error) {
    console.error("Camera manage GET error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, nameEn, siteId, zone, zoneEn, resolution, fps, model, modelEn, streamType, streamUrl, credentials, imagePath } = body;

    if (!name || !siteId || !streamType) {
      return NextResponse.json({ error: "name, siteId, streamType required" }, { status: 400 });
    }

    const validTypes = ["rtsp", "onvif", "hls", "webrtc", "demo"];
    if (!validTypes.includes(streamType)) {
      return NextResponse.json({ error: "Invalid streamType" }, { status: 400 });
    }

    // في الإنتاج: يجب تشفير credentials قبل التخزين (مثلاً AES-256 مع مفتاح من env)
    // هنا نخزنها كنص للعرض التوضيحي مع توضيح واضح
    const isLive = streamType !== "demo";

    const camera = await db.camera.create({
      data: {
        name, nameEn: nameEn || name,
        siteId,
        status: "online",
        resolution: resolution || "1080p",
        fps: fps || 25,
        model: model || "كشف الأشخاص", modelEn: modelEn || "Person Detection",
        zone: zone || "عام", zoneEn: zoneEn || "General",
        imagePath: imagePath || "/cameras/scene-office.jpg",
        streamType,
        streamUrl: streamUrl || null,
        credentials: credentials || null,
        isLive,
        events24h: 0,
      },
      select: {
        id: true, name: true, nameEn: true, status: true, streamType: true, isLive: true,
        site: { select: { name: true, nameEn: true } },
      },
    });

    return NextResponse.json({ success: true, camera, note: isLive ? "Camera added. Actual stream ingestion requires MediaMTX/FFmpeg gateway." : "Demo camera added." });
  } catch (error) {
    console.error("Camera manage POST error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
