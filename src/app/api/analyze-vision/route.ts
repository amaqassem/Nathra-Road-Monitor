import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body as { image: string };

    if (!image) {
      return NextResponse.json({ error: "Image required" }, { status: 400 });
    }

    const zai = await ZAI.create();

    const prompt = `You are an expert AI vision system for a security platform called "Nathra". Analyze this surveillance camera image and provide a comprehensive security assessment.

Return ONLY valid JSON (no markdown, no extra text) in this exact structure:
{
  "overallConfidence": <0-100 confidence in analysis>,
  "peopleCount": <estimated number of people detected>,
  "riskLevel": "<low|medium|high|critical>",
  "urgency": "<preventive|routine|priority|immediate>",
  "detectedObjects": [
    { "label": "<object/person label>", "count": <number>, "confidence": <0-100> }
  ],
  "behaviors": [
    { "type": "<behavior type>", "confidence": <0-100>, "description": "<brief description>" }
  ],
  "emotions": [
    { "emotion": "<emotion>", "percentage": <0-100> }
  ],
  "summary": "<2-sentence executive summary of the scene>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"],
  "compliance": {
    "pdplRelevant": <true|false>,
    "notes": "<data protection note if personal data detected>"
  }
}

Focus on: people detection and counting, behavioral analysis (loitering, suspicious activity, crowd formation, fighting, falls), emotion analysis, object detection, scene understanding, and security risk assessment. Be precise with confidence values.`;

    const response = await zai.chat.completions.createVision({
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      thinking: { type: "disabled" },
    });

    const content = response.choices[0]?.message?.content || "";

    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      analysis = { rawResponse: content };
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Vision analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
