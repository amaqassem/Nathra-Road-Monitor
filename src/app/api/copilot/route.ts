import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { question, lang } = body as { question: string; lang?: "ar" | "en" };
    const userLang = lang === "en" ? "en" : "ar";

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question required" }, { status: 400 });
    }

    // اجمع بيانات حقيقية من DB لتغذية الـ LLM (منع اختراع الأرقام)
    const [sites, cameras, incidents, alerts, pipelines, authorities, evidence, health] = await Promise.all([
      db.site.findMany({ include: { _count: { select: { cameras: true, incidents: true } } } }),
      db.camera.findMany({ include: { site: { select: { name: true, nameEn: true } } } }),
      db.incident.findMany({ include: { camera: { select: { name: true, nameEn: true } }, site: { select: { name: true, nameEn: true } } } }),
      db.alert.findMany(),
      db.pipeline.findMany(),
      db.authority.findMany(),
      db.incidentEvidence.findMany(),
      db.systemHealthMetric.findMany({ orderBy: { recordedAt: "desc" }, distinct: ["metric"] }),
    ]);

    const onlineCameras = cameras.filter((c) => c.status === "online");
    const offlineCameras = cameras.filter((c) => c.status === "offline");
    const openIncidents = incidents.filter((i) => !["closed", "resolved"].includes(i.status));
    const criticalIncidents = openIncidents.filter((i) => i.severity === "critical");
    const slaBreached = openIncidents.filter((i) => i.slaDeadline && i.slaDeadline < new Date());

    // تجميع البيانات حسب السؤال (تجنب إرسال بيانات ضخمة)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const incidentsToday = incidents.filter((i) => i.detectedAt >= today);

    // أكثر المواقع خطورة (أكثر حوادث حرجة)
    const siteRiskMap = new Map<string, { name: string; nameEn: string; critical: number; total: number }>();
    incidents.forEach((i) => {
      const key = i.siteId;
      const existing = siteRiskMap.get(key) || { name: i.site.name, nameEn: i.site.nameEn, critical: 0, total: 0 };
      existing.total++;
      if (i.severity === "critical") existing.critical++;
      siteRiskMap.set(key, existing);
    });
    const riskySites = Array.from(siteRiskMap.values()).sort((a, b) => b.critical - a.critical || b.total - a.total).slice(0, 5);

    // أكثر أنواع الحوادث تكراراً
    const typeMap = new Map<string, number>();
    incidents.forEach((i) => { typeMap.set(i.typeEn, (typeMap.get(i.typeEn) || 0) + 1); });
    const topTypes = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // ساعات الذروة (آخر 7 أيام)
    const hourMap = new Array(24).fill(0);
    incidents.forEach((i) => { hourMap[i.detectedAt.getHours()]++; });
    const peakHour = hourMap.indexOf(Math.max(...hourMap));

    const context = {
      lang: userLang,
      generatedAt: new Date().toISOString(),
      summary: {
        totalSites: sites.length,
        totalCameras: cameras.length,
        onlineCameras: onlineCameras.length,
        offlineCameras: offlineCameras.length,
        maintenanceCameras: cameras.filter((c) => c.status === "maintenance").length,
        totalIncidents: incidents.length,
        openIncidents: openIncidents.length,
        criticalIncidents: criticalIncidents.length,
        incidentsToday: incidentsToday.length,
        slaBreached: slaBreached.length,
        totalAlerts: alerts.length,
        activeAlerts: alerts.filter((a) => a.status === "active").length,
        activePipelines: pipelines.filter((p) => p.active).length,
        totalEvidence: evidence.length,
      },
      riskySites,
      topIncidentTypes: topTypes,
      peakHour,
      offlineCameraList: offlineCameras.slice(0, 10).map((c) => ({ name: c.nameEn, site: c.site.nameEn })),
      recentIncidents: openIncidents.slice(0, 10).map((i) => ({
        no: i.incidentNo, type: i.typeEn, severity: i.severity, status: i.status,
        site: i.site.nameEn, camera: i.camera.nameEn, detectedAt: i.detectedAt.toISOString(),
        slaDeadline: i.slaDeadline?.toISOString(),
      })),
      healthMetrics: health.map((h) => ({ metric: h.metric, value: h.value, unit: h.unit, status: h.status })),
    };

    const zai = await ZAI.create();

    const systemPrompt = `You are "Nathra AI Copilot", an intelligent assistant for the Nathra security platform. You answer questions based ONLY on the real system data provided below. 

CRITICAL RULES:
1. Use ONLY the data in the context. NEVER invent numbers, incidents, or statistics.
2. If the data doesn't contain the answer, say so honestly.
3. Always cite the data source and time period when giving numbers.
4. Answer in ${userLang === "ar" ? "Arabic" : "English"}.
5. Be concise and actionable. Use bullet points for lists.
6. For sensitive actions, remind the user to confirm manually.
7. Data was generated at: ${context.generatedAt}

REAL SYSTEM DATA (JSON):
${JSON.stringify(context, null, 2)}`;

    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      thinking: { type: "disabled" },
    });

    const answer = response.choices[0]?.message?.content || "";
    const tokens = response.usage?.total_tokens;

    return NextResponse.json({
      success: true,
      answer,
      question,
      lang: userLang,
      dataContext: {
        generatedAt: context.generatedAt,
        sources: ["sites", "cameras", "incidents", "alerts", "pipelines", "authorities", "evidence", "system_health"],
        recordsAnalyzed: sites.length + cameras.length + incidents.length + alerts.length,
      },
    });
  } catch (error) {
    console.error("Copilot error:", error);
    return NextResponse.json({ error: "Copilot failed" }, { status: 500 });
  }
}
