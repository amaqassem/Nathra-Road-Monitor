import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body as { image: string };

    if (!image) {
      return NextResponse.json({ success: false, error: "Image required" }, { status: 400 });
    }

    const hfToken = process.env.HUGGINGFACE_API_KEY || process.env.HF_TOKEN;

    if (!hfToken) {
      return NextResponse.json({ 
        success: false, 
        error: "مفتاح HUGGINGFACE_API_KEY غير موجود في متغيرات البيئة بـ Vercel." 
      }, { status: 400 });
    }

    const prompt = `You are an expert AI road safety and infrastructure monitoring system. Analyze the provided image truly and dynamically. Look closely at what is actually in the image (whether it is normal highway traffic, potholes, cracks, water pooling, surface wear, lane damage, barriers, etc.). 
Return ONLY a valid JSON object with this exact structure:
{
  "overallConfidence": number (0 to 100 based on your visual certainty),
  "peopleCount": number,
  "riskLevel": "low" | "medium" | "high",
  "urgency": "routine" | "priority" | "immediate",
  "summary": "Detailed Arabic description of what is actually visible in this specific image",
  "detectedObjects": [{"label": "Name of defect or object in Arabic", "count": number, "confidence": number}],
  "behaviors": [{"type": "description of road condition or traffic flow", "confidence": number, "description": string}],
  "recommendations": ["Recommendation 1 in Arabic", "Recommendation 2 in Arabic"],
  "compliance": {"pdplRelevant": false, "notes": "متوافق مع معايير جودة الطرق"}
}`;

    // الاتصال المباشر بنموذج الرؤية الحقيقي عبر Hugging Face OpenAI-compatible API
    const response = await fetch(
      "https://api-inference.huggingface.co/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "meta-llama/Llama-3.2-11B-Vision-Instruct",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: image } }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Hugging Face API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices?.[0]?.message?.content || "";

    let analysis;
    try {
      const cleaned = assistantMessage.replace(/```json/g, "").replace(/```/g, "").trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : cleaned);
    } catch (parseError) {
      throw new Error(`فشل تحليل استجابة نموذج الذكاء الاصطناعي: ${assistantMessage}`);
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error: any) {
    console.error("Vision analyze error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || "Analysis failed" 
    }, { status: 500 });
  }
}
