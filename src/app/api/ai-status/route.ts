import { NextResponse } from "next/server";
import { getAIStatus } from "@/lib/ai-provider";

/**
 * فحص حالة خدمة الذكاء الاصطناعي
 * GET /api/ai-status
 */
export async function GET() {
  const status = await getAIStatus();

  const messageAr: Record<string, string> = {
    'zai-sdk': 'Z.ai SDK نشط (بيئة محلية)',
    'zai-direct': 'Z.ai API مباشر نشط (ZAI_API_KEY مضبوط)',
    'local-fallback': 'خدمة AI غير متاحة. اضبط ZAI_API_KEY لتفعيل التحليل الكامل.',
  };

  const setupAr: Record<string, string> = {
    'zai-sdk': 'خدمة AI مُعدة.',
    'zai-direct': 'خدمة AI مُعدة.',
    'local-fallback': 'اضبط ZAI_API_KEY واختيارياً ZAI_BASE_URL في متغيرات البيئة لتفعيل التحليل الكامل.',
  };

  return NextResponse.json({
    ...status,
    message_ar: messageAr[status.provider] || status.message,
    setup_ar: setupAr[status.provider] || status.message,
    timestamp: new Date().toISOString(),
    env: {
      hasZaiApiKey: !!process.env.ZAI_API_KEY,
      hasZaiBaseUrl: !!process.env.ZAI_BASE_URL,
      nodeEnv: process.env.NODE_ENV,
    },
    setup: status.provider === 'local-fallback'
      ? 'Set ZAI_API_KEY and optionally ZAI_BASE_URL environment variables to enable full AI analysis.'
      : 'AI service is configured.',
  });
}
