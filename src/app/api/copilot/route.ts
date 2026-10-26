import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { chatCompletion } from "@/lib/ai-provider";

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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const incidentsToday = incidents.filter((i) => i.detectedAt >= today);

    const siteRiskMap = new Map<string, { name: string; nameEn: string; critical: number; total: number }>();
    incidents.forEach((i) => {
      const key = i.siteId;
      const existing = siteRiskMap.get(key) || { name: i.site.name, nameEn: i.site.nameEn, critical: 0, total: 0 };
      existing.total++;
      if (i.severity === "critical") existing.critical++;
      siteRiskMap.set(key, existing);
    });
    const riskySites = Array.from(siteRiskMap.values()).sort((a, b) => b.critical - a.critical || b.total - a.total).slice(0, 5);

    const typeMap = new Map<string, number>();
    incidents.forEach((i) => { typeMap.set(i.typeEn, (typeMap.get(i.typeEn) || 0) + 1); });
    const topTypes = Array.from(typeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

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

    const systemPrompt = `You are "Nathra AI Copilot", an intelligent assistant for the Nathra road monitoring platform. You answer questions based ONLY on the real system data provided below.

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

    let answer: string;
    try {
      answer = await chatCompletion([
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ]);
    } catch (error: any) {
      // AI غير متوفر — أرجع إجابة بناءً على البيانات المحلية
      return NextResponse.json({
        success: false,
        error: "AI service unavailable",
        answer: userLang === "ar"
          ? `⚠️ خدمة الذكاء الاصطناعي غير متوفرة حالياً. لإتاحة المساعد، اضبط ZAI_API_KEY في متغيرات البيئة.\n\n📊 بيانات النظام الحالية:\n• المواقع المراقبة: ${context.summary.totalSites}\n• الكاميرات النشطة: ${context.summary.onlineCameras}/${context.summary.totalCameras}\n• الحوادث المفتوحة: ${context.summary.openIncidents}\n• الحوادث الحرجة: ${context.summary.criticalIncidents}\n• الحوادث اليوم: ${context.summary.incidentsToday}\n\nسؤالك: "${question}"`
          : `⚠️ AI service unavailable. To enable Copilot, set ZAI_API_KEY environment variable.\n\n📊 Current system data:\n• Monitored sites: ${context.summary.totalSites}\n• Online cameras: ${context.summary.onlineCameras}/${context.summary.totalCameras}\n• Open incidents: ${context.summary.openIncidents}\n• Critical incidents: ${context.summary.criticalIncidents}\n• Incidents today: ${context.summary.incidentsToday}\n\nYour question: "${question}"`,
        question,
        lang: userLang,
        dataContext: {
          generatedAt: context.generatedAt,
          sources: ["sites", "cameras", "incidents", "alerts", "pipelines", "authorities", "evidence", "system_health"],
          recordsAnalyzed: sites.length + cameras.length + incidents.length + alerts.length,
          aiAvailable: false,
        },
        setup: "Set ZAI_API_KEY env var to enable AI-powered answers.",
      }, { status: 200 }); // 200 مع answer حتى لو fallback
    }

    return NextResponse.json({
      success: true,
      answer,
      question,
      lang: userLang,
      dataContext: {
        generatedAt: context.generatedAt,
        sources: ["sites", "cameras", "incidents", "alerts", "pipelines", "authorities", "evidence", "system_health"],
        recordsAnalyzed: sites.length + cameras.length + incidents.length + alerts.length,
        aiAvailable: true,
      },
    });
  } catch (error) {
    console.error("Copilot error:", error);
    return NextResponse.json({ error: "Copilot failed" }, { status: 500 });
  }
}
