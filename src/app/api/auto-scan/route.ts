import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";

// تهيئة Google GenAI مباشرة باستخدام مفتاح البيئة
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// خريطة نوع المخالفة → الجهة المختصة (عربي/إنجليزي)
const AUTHORITY_MAP: Record<string, { ar: string; en: string }> = {
  intrusion: { ar: "الأمن الخاص + الشرطة", en: "Private Security + Police" },
  perimeter: { ar: "الأمن الخاص + الشرطة", en: "Private Security + Police" },
  crowd: { ar: "إدارة الحشود الميدانية", en: "Field Crowd Management" },
  suspicious: { ar: "الأمن الخاص", en: "Private Security" },
  loitering: { ar: "الأمن الخاص", en: "Private Security" },
  fight: { ar: "الشرطة + الطوارئ", en: "Police + Emergency" },
  fall: { ar: "الإسعاف + الأمن", en: "Ambulance + Security" },
  face: { ar: "الأمن + الجهة المختصة", en: "Security + Authority" },
  safety: { ar: "السلامة المهنية", en: "Occupational Safety" },
  fire: { ar: "الدفاع المدني", en: "Civil Defense" },
  default: { ar: "مركز العمليات الموحد", en: "Unified Operations Center" },
};

function resolveAuthority(violationType: string) {
  const t = violationType.toLowerCase();
  if (t.includes("intrus") || t.includes("تسلل")) return AUTHORITY_MAP.intrusion;
  if (t.includes("perimeter") || t.includes("محيط") || t.includes("اختراق")) return AUTHORITY_MAP.perimeter;
  if (t.includes("crowd") || t.includes("ازدحام") || t.includes("حشد")) return AUTHORITY_MAP.crowd;
  if (t.includes("fight") || t.includes("شجار") || t.includes("عنف")) return AUTHORITY_MAP.fight;
  if (t.includes("fall") || t.includes("سقوط")) return AUTHORITY_MAP.fall;
  if (t.includes("face") || t.includes("وجه")) return AUTHORITY_MAP.face;
  if (t.includes("fire") || t.includes("حريق") || t.includes("دخان")) return AUTHORITY_MAP.fire;
  if (t.includes("safety") || t.includes("سلامة") || t.includes("خوذة")) return AUTHORITY_MAP.safety;
  if (t.includes("loiter") || t.includes("تردد")) return AUTHORITY_MAP.loitering;
  if (t.includes("suspicious") || t.includes("مشبوه")) return AUTHORITY_MAP.suspicious;
  return AUTHORITY_MAP.default;
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const requestedCameraId = body?.cameraId as string | undefined;

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
  const publicPath = path.join(process.cwd(), "public", camera.imagePath.replace(/^\//, ""));
  let imageBuffer: Buffer;
  try {
    imageBuffer = fs.readFileSync(publicPath);
  } catch (e) {
    return NextResponse.json({ error: "Camera image not found" }, { status: 404 });
  }

  const base64Image = imageBuffer.toString("base64");

  const prompt = `You are an automated security violation detection system for the "Nathra" platform. Analyze this CCTV surveillance frame and detect any security violations or suspicious activities.

Return ONLY valid JSON (no markdown block, just raw JSON) in this exact structure:
{
  "hasViolation": <true if any violation detected, false if scene is normal>,
  "violations": [
    {
      "type": "<arabic type name>",
      "typeEn": "<english type: intrusion|crowd|suspicious|loitering|fight|fall|face|perimeter|safety|fire>",
      "severity": "<critical|high|medium|low>",
      "confidence": <0-100>,
      "description": "<arabic description>",
      "descriptionEn": "<english description>"
    }
  ],
  "peopleCount": <estimated number of people>,
  "summary": "<one-line arabic summary of the scene>",
  "riskLevel": "<low|medium|high|critical>"
}

Violation types to look for:
- intrusion/perimeter: unauthorized person in restricted area, fence climbing
- crowd: dangerous crowd density, congestion
- suspicious: abnormal behavior, unauthorized access attempt
- loitering: person staying too long in one spot
- fight: physical altercation, violence
- fall: person fallen on ground
- safety: missing safety gear (helmet/vest) in industrial zones, unsafe acts
- fire: smoke, flames, fire hazard

If the scene is completely normal with no violations, set hasViolation=false and return empty violations array. Be conservative — only flag real violations with confidence > 60.`;

  // استخدام نموذج Gemini القوي لتحليل الصور
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
  });

  const content = response.text || "";

  let analysis: any;
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
  } catch {
    analysis = { rawResponse: content, hasViolation: false };
  }

  let createdAlert = null;
  if (analysis.hasViolation && Array.isArray(analysis.violations) && analysis.violations.length > 0) {
    const sevOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const topViolation = [...analysis.violations].sort(
      (a, b) => (sevOrder[b.severity as keyof typeof sevOrder] || 0) - (sevOrder[a.severity as keyof typeof sevOrder] || 0)
    )[0];

    const authority = resolveAuthority(topViolation.typeEn || topViolation.type);

    createdAlert = await db.alert.create({
      data: {
        cameraId: camera.id,
        siteId: camera.siteId,
        type: topViolation.type,
        typeEn: topViolation.typeEn || topViolation.type,
        severity: topViolation.severity,
        status: "active",
        description: topViolation.description,
        descriptionEn: topViolation.descriptionEn || topViolation.description,
        confidence: Math.round(topViolation.confidence || 80),
        authority: authority.ar,
        authorityEn: authority.en,
        autoProcessed: true,
      },
    });

    await db.camera.update({
      where: { id: camera.id },
      data: {
        events24h: { increment: 1 },
        lastEventAt: new Date(),
      },
    });
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
    alertCreated: !!createdAlert,
    alert: createdAlert ? {
      id: createdAlert.id,
      type: createdAlert.type,
      typeEn: createdAlert.typeEn,
      severity: createdAlert.severity,
      authority: createdAlert.authority,
      authorityEn: createdAlert.authorityEn,
      confidence: createdAlert.confidence,
    } : null,
  });
}
