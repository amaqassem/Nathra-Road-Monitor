import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image } = body as { image: string };

    if (!image) {
      return NextResponse.json(
        { error: "الرجاء رفع صورة للطريق" },
        { status: 400 }
      );
    }

    const zai = await ZAI.create();

    const prompt = `أنت خبير في تقييم جودة رصف الطرق. حلّل صورة الطريق هذه بدقة وأعطني تقييماً شاملاً.

أرجع النتيجة بصيغة JSON فقط بدون أي نص إضافي بالصيغة التالية:
{
  "overallScore": <رقم من 0 إلى 100 يمثل جودة الرصف>,
  "surfaceCondition": "<حالة السطح: ممتازة / جيدة / متوسطة / رديئة / حرجة>",
  "defects": [
    { "type": "<نوع العيب>", "severity": "<الخطورة: منخفضة/متوسطة/عالية/حرجة>", "extent": "<النطاق: محدود/متوسط/واسع>", "description": "<وصف موجز بالعربية>" }
  ],
  "distresses": ["<قائمة بأنواع التشوهات المرصودة>"],
  "maintenanceUrgency": "<أولوية الصيانة: فورية/عاجلة/متوسطة/وقائية>",
  "estimatedLife": "<العمر المتبقي المقدر للرصف>",
  "recommendations": ["<توصية 1>", "<توصية 2>", "<توصية 3>"],
  "safetyRisk": "<مستوى الخطر على السلامة: منخفض/متوسط/مرتفع>",
  "summary": "<ملخص تنفيذي من سطرين بالعربية>"
}

ركّز على: الحفر، التشققات (الطولية والعرضية والتمساحية)، الهبوط، تآكل الحواف، صدوع الانكماش، حالة العلامات الأرضية، تصريف المياه.`;

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

    // استخراج JSON من الرد
    let analysis;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      analysis = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    } catch {
      analysis = { rawResponse: content };
    }

    return NextResponse.json({ success: true, analysis });
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "فشل في تحليل الصورة. حاول مرة أخرى." },
      { status: 500 }
    );
  }
}
