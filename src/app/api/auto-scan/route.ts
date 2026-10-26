import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyzeImage, localFallbackAnalysis } from "@/lib/ai-provider";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedCameraId = body?.cameraId as string | undefined;

    // اختيار كاميرا نشطة (عشوائية أو محددة)
    const onlineCameras = await db.camera.findMany({
      where: { status: "online", ...(requestedCameraId ? { id: requestedCameraId } : {}) },
      include: { site: true },
    });

    if (onlineCameras.length === 0) {
      const anyOnline = await db.camera.findMany({ where: { status: "online" }, include: { site: true } });
      if (anyOnline.length === 0) {
        return NextResponse.json({ error: "No online cameras" }, { status: 404 });
      }
      const cam = anyOnline[Math.floor(Math.random() * anyOnline.length)];
      return await runScan(cam);
    }

    const camera = onlineCameras[Math.floor(Math.random() * onlineCameras.length)];
    return await runScan(camera);
  } catch (error) {
    console.error("Auto-scan error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}

async function runScan(camera: any) {
  // قراءة الصورة من public وتحويلها base64
  const publicPath = path.join(process.cwd(), "public", camera.imagePath.replace(/^\//, ""));
  let imageBase64: string;
  try {
    const buffer = fs.readFileSync(publicPath);
    imageBase64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  } catch (e) {
    return NextResponse.json({ error: "Camera image not found" }, { status: 404 });
  }

  const prompt = `You are an automated traffic violation detection system for the "Nathra" road monitoring platform. Analyze this CCTV traffic camera frame from Saudi Arabia roads and detect any traffic violations or road incidents.

Return ONLY valid JSON (no markdown) in this exact structure:
{
  "hasViolation": <true if any violation detected, false if scene is normal>,
  "violations": [
    {
      "type": "<arabic type name>",
      "typeEn": "<english type: speeding|red_light|excessive_speed|reckless|illegal_parking|lane_violation|wrong_way|accident>",
      "severity": "<critical|high|medium|low>",
      "confidence": <0-100>,
      "description": "<arabic description>",
      "descriptionEn": "<english description>"
    }
  ],
  "vehicleCount": <estimated number of vehicles>,
  "summary": "<one-line arabic summary of the road scene>",
  "riskLevel": "<low|medium|high|critical>"
}

Violation types to look for:
- speeding/excessive_speed: vehicles appearing to move fast based on motion blur or road type
- red_light: vehicle crossing on red light at intersection
- reckless: dangerous lane changes, erratic driving
- illegal_parking: vehicle stopped in lane or shoulder without emergency
- lane_violation: vehicle crossing lane markings improperly
- wrong_way: vehicle driving against traffic flow
- accident: collision, stopped vehicles in lane, debris

Be conservative — only flag real violations. For speeding, consider road context (highway vs intersection). If scene is normal traffic flow, set hasViolation=false.`;

  let analysis: any;
  let usedFallback = false;

  try {
    // جرّب تحليل AI الحقيقي
    const content = await analyzeImage([
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageBase64 } },
        ],
      },
    ]);

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch (error: any) {
    // إذا AI غير متوفر، استخدم fallback المحلي
    if (error.message === 'AI_UNAVAILABLE' || error.message?.includes('Configuration file not found') || error.message?.includes('ZAI API error') || error.message?.includes('fetch failed')) {
      console.log("AI unavailable, using local fallback analysis");
      analysis = localFallbackAnalysis(camera.zone, camera.model);
      usedFallback = true;
    } else {
      console.error("Auto-scan analysis error:", error);
      analysis = localFallbackAnalysis(camera.zone, camera.model);
      usedFallback = true;
    }
  }

  // إذا فيه مخالفة، أنشئ تنبيه + حادث (مع منع التكرار) + أدلة + توجيه + سجل تدقيق
  let createdAlert = null;
  let createdIncident = null;
  let deduplicated = false;

  if (analysis.hasViolation && Array.isArray(analysis.violations) && analysis.violations.length > 0) {
    const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const topViolation = [...analysis.violations].sort(
      (a: any, b: any) => (sevOrder[b.severity] || 0) - (sevOrder[a.severity] || 0)
    )[0];

    const violationTypeEn = (topViolation.typeEn || topViolation.type || "").toLowerCase();

    const { findDuplicateIncident, resolveAuthority, generateIncidentNo, logAudit, createNotification, fileHash } = await import("@/lib/incidents");
    const isDuplicate = await findDuplicateIncident(camera.id, violationTypeEn);
    if (isDuplicate) {
      deduplicated = true;
    } else {
      const authority = await resolveAuthority(violationTypeEn, topViolation.severity, camera.site.typeEn);

      createdAlert = await db.alert.create({
        data: {
          cameraId: camera.id,
          siteId: camera.siteId,
          type: topViolation.type,
          typeEn: violationTypeEn,
          severity: topViolation.severity,
          status: "active",
          description: topViolation.description,
          descriptionEn: topViolation.descriptionEn || topViolation.description,
          confidence: Math.round(topViolation.confidence || 80),
          authority: authority?.name,
          authorityEn: authority?.nameEn,
          autoProcessed: true,
        },
      });

      const slaHours: Record<string, number> = { critical: 4, high: 24, medium: 72, low: 168 };
      const slaHoursVal = slaHours[topViolation.severity] || 72;
      const incidentNo = await generateIncidentNo();

      createdIncident = await db.incident.create({
        data: {
          incidentNo,
          type: topViolation.type,
          typeEn: violationTypeEn,
          severity: topViolation.severity,
          status: "detected",
          cameraId: camera.id,
          siteId: camera.siteId,
          description: topViolation.description,
          descriptionEn: topViolation.descriptionEn || topViolation.description,
          aiConfidence: Math.round(topViolation.confidence || 80),
          authorityId: authority?.id,
          gpsLat: camera.site.lat,
          gpsLng: camera.site.lng,
          slaDeadline: new Date(Date.now() + slaHoursVal * 3600 * 1000),
          autoCreated: true,
        },
      });

      await db.alert.update({ where: { id: createdAlert.id }, data: { incidentId: createdIncident.id } });

      try {
        const publicPath = path.join(process.cwd(), "public", camera.imagePath.replace(/^\//, ""));
        const buffer = fs.readFileSync(publicPath);
        const hash = fileHash(buffer);
        await db.incidentEvidence.create({
          data: {
            incidentId: createdIncident.id,
            type: "image",
            filePath: camera.imagePath,
            fileName: `evidence-${incidentNo}.jpg`,
            fileSize: buffer.length,
            fileHash: hash,
            accessLogs: JSON.stringify([{ actor: "system", action: "captured", at: new Date().toISOString() }]),
          },
        });
      } catch (e) {
        console.error("Evidence save failed:", e);
      }

      await logAudit({
        incidentId: createdIncident.id,
        action: "incident_created",
        actor: usedFallback ? "AI Auto-Scan (fallback)" : "AI Auto-Scan",
        details: JSON.stringify({
          source: "auto_scan",
          cameraId: camera.id,
          cameraName: camera.nameEn,
          violationType: violationTypeEn,
          severity: topViolation.severity,
          confidence: Math.round(topViolation.confidence || 80),
          authority: authority?.nameEn,
          fallback: usedFallback,
        }),
      });

      await logAudit({
        incidentId: createdIncident.id,
        action: "authority_routed",
        actor: "Routing Engine",
        details: JSON.stringify({ authority: authority?.nameEn, sandboxMode: true }),
      });

      await createNotification({
        incidentId: createdIncident.id,
        type: "incident_created",
        title: `حادث جديد: ${topViolation.type}`,
        message: `${incidentNo} · ${camera.site.name} · خطورة ${topViolation.severity} · حُوّل إلى ${authority?.name}`,
        recipient: "operators",
      });

      await db.camera.update({
        where: { id: camera.id },
        data: { events24h: { increment: 1 }, lastEventAt: new Date() },
      });
    }
  }

  return NextResponse.json({
    success: true,
    camera: {
      id: camera.id,
      name: camera.name,
      nameEn: camera.nameEn,
      imagePath: camera.imagePath,
      zone: camera.zone,
      zoneEn: camera.zoneEn,
      site: { name: camera.site.name, nameEn: camera.site.nameEn },
    },
    analysis,
    usedFallback,
    alertCreated: !!createdAlert,
    deduplicated,
    incidentCreated: !!createdIncident,
    alert: createdAlert ? {
      id: createdAlert.id,
      type: createdAlert.type,
      typeEn: createdAlert.typeEn,
      severity: createdAlert.severity,
      authority: createdAlert.authority,
      authorityEn: createdAlert.authorityEn,
      confidence: createdAlert.confidence,
    } : null,
    incident: createdIncident ? {
      id: createdIncident.id,
      incidentNo: createdIncident.incidentNo,
      type: createdIncident.type,
      typeEn: createdIncident.typeEn,
      severity: createdIncident.severity,
      status: createdIncident.status,
      authority: createdIncident.authorityId,
      slaDeadline: createdIncident.slaDeadline,
    } : null,
  });
}
