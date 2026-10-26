import { NextResponse } from "next/server";
import { getAIStatus } from "@/lib/ai-provider";

export const dynamic = 'force-dynamic';

/**
 * فحص حالة خدمة الذكاء الاصطناعي
 * GET /api/ai-status
 */
export async function GET() {
  const status = await getAIStatus();

  const messageAr: Record<string, string> = {
    'gemini': 'Google Gemini API نشط ومعد بنجاح',
    'zai-sdk': 'Z.ai SDK نشط (بيئة محلية)',
    'zai-direct': 'Z.ai API مباشر نشط',
    'local-fallback': 'خدمة AI غير متاحة. اضبط GEMINI_API_KEY لتفعيل التحليل الكامل.',
  };

  const setupAr: Record<string, string> = {
    'gemini': 'خدمة AI مُعدة.',
    'zai-sdk': 'خدمة AI مُعدة.',
    'zai-direct': 'خدمة AI مُعدة.',
    'local-fallback': 'اضبط GEMINI_API_KEY في متغيرات البيئة لتفعيل التحليل الكامل.',
  };

  return NextResponse.json({
    ...status,
    message_ar: messageAr[status.provider] || status.message,
    setup_ar: setupAr[status.provider] || status.message,
    timestamp: new Date().toISOString(),
    env: {
      hasGeminiApiKey: !!process.env.GEMINI_API_KEY,
      hasZaiApiKey: !!process.env.ZAI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
    },
    setup: status.provider === 'local-fallback'
      ? 'Set GEMINI_API_KEY environment variable to enable full AI analysis.'
      : 'AI service is configured.',
  });
}
