import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/ai-provider";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body as { image: string };

    if (!image) {
      return NextResponse.json({ success: false, error: "Image required" }, { status: 400 });
    }

    const prompt = `You are an expert AI vision system for the "Nathra" road monitoring platform. Analyze this surveillance camera image and provide a comprehensive assessment.

Return ONLY valid JSON (no markdown, no extra text) in this exact structure:
{
  "overallConfidence": 85,
  "peopleCount": 0,
  "riskLevel": "low",
  "urgency": "routine",
  "detectedObjects": [],
  "behaviors": [],
  "emotions": [],
  "summary": "Normal traffic flow observed.",
  "recommendations": ["Maintain routine monitoring."],
  "compliance": {
    "pdplRelevant": false,
    "notes": "No personal data detected."
  }
}

Focus on: people detection and counting, behavioral analysis, object detection, and security risk assessment.`;

    let content: string;

    try {
      content = await analyzeImage([
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ]);
    } catch (error: any) {
      console.error("AI Provider Execution Error:", error);
      return NextResponse.json({
        success: false,
        error: "AI analysis failed at provider level",
        details: error.message || String(error),
      }, { status: 500 });
    }

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      analysis = { rawResponse: content };
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error("Vision analyze route fatal error:", error);
    return NextResponse.json({ 
      success: false, 
      error: "Internal server error during analysis", 
      details: error.message 
    }, { status: 500 });
  }
}
