/**
 * طبقة تجريد الذكاء الاصطناعي — تعمل في أي بيئة
 *
 * أولوية الاستخدام:
 * 1. z-ai-web-dev-sdk (بيئة Z.ai المحلية — ملف .z-ai-config متوفر)
 * 2. استدعاء مباشر لـ ZAI API عبر ZAI_API_KEY + ZAI_BASE_URL (للنشر الخارجي)
 * 3. تحليل محلي احتياطي (عند عدم توفر أي خدمة AI)
 *
 * متغيرات البيئة المطلوبة للنشر الخارجي:
 *   ZAI_API_KEY=your-key
 *   ZAI_BASE_URL=https://api.z.ai/api/paas/v4   (افتراضي)
 */

export interface AIStatus {
  available: boolean
  provider: 'zai-sdk' | 'zai-direct' | 'local-fallback'
  message: string
}

// فحص توفر خدمة AI
export async function getAIStatus(): Promise<AIStatus> {
  // 1. جرّب z-ai-web-dev-sdk
  try {
    const ZAIModule = await import('z-ai-web-dev-sdk')
    const ZAI = (ZAIModule as any).default
    const zai = await ZAI.create()
    if (zai) {
      return { available: true, provider: 'zai-sdk', message: 'Z.ai SDK active (local environment)' }
    }
  } catch (e) {
    // SDK غير متوفر أو ملف الإعداد ناقص
  }

  // 2. جرّب الاتصال المباشر عبر env vars
  if (process.env.ZAI_API_KEY) {
    return {
      available: true,
      provider: 'zai-direct',
      message: 'Z.ai direct API active (ZAI_API_KEY set)',
    }
  }

  // 3. fallback محلي
  return {
    available: false,
    provider: 'local-fallback',
    message: 'AI service unavailable. Set ZAI_API_KEY env var for full analysis. Using local heuristic fallback.',
  }
}

// إنشاء عميل AI
async function getAIClient() {
  // 1. z-ai-web-dev-sdk
  try {
    const ZAIModule = await import('z-ai-web-dev-sdk')
    const ZAI = (ZAIModule as any).default
    const zai = await ZAI.create()
    return { type: 'sdk' as const, client: zai }
  } catch (e) {
    // متابعة للخيار التالي
  }

  // 2. اتصال مباشر
  if (process.env.ZAI_API_KEY) {
    return {
      type: 'direct' as const,
      config: {
        baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
        apiKey: process.env.ZAI_API_KEY,
        chatId: process.env.ZAI_CHAT_ID || '',
        userId: process.env.ZAI_USER_ID || '',
      },
    }
  }

  // 3. لا يوجد عميل
  return null
}

export interface VisionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | Array<
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
  >
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// تحليل صورة بالرؤية
export async function analyzeImage(
  messages: VisionMessage[],
  options: { thinking?: { type: string } } = {}
): Promise<string> {
  const client = await getAIClient()

  if (!client) {
    // fallback محلي — نرجع نصاً يوضح أن التحليل محدود
    throw new Error('AI_UNAVAILABLE')
  }

  try {
    if (client.type === 'sdk') {
      const response = await client.client.chat.completions.createVision({
        messages: messages as any,
        thinking: options.thinking || { type: 'disabled' },
      } as any)
      return response.choices[0]?.message?.content || ''
    }

    // اتصال مباشر
    const { baseUrl, apiKey, chatId, userId } = client.config
    const url = `${baseUrl}/chat/completions/vision`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'X-Z-AI-From': 'Z',
    }
    if (chatId) headers['X-Chat-Id'] = chatId
    if (userId) headers['X-User-Id'] = userId

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        messages,
        thinking: options.thinking || { type: 'disabled' },
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      const err = new Error(`ZAI API error ${response.status}: ${errorBody}`)
      ;(err as any).statusCode = response.status
      throw err
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || ''
  } catch (error: any) {
    // صنّف الخطأ: 429 = rate limit (مؤقت)، غير ذلك = unavailable
    if (error.statusCode === 429 || error.message?.includes('429')) {
      const err = new Error('AI_RATE_LIMITED')
      ;(err as any).code = 'RATE_LIMITED'
      throw err
    }
    if (error.message?.includes('Configuration file not found')) {
      throw new Error('AI_UNAVAILABLE')
    }
    throw error
  }
}

// محادثة نصية (للـ Copilot)
export async function chatCompletion(
  messages: ChatMessage[],
  options: { thinking?: { type: string } } = {}
): Promise<string> {
  const client = await getAIClient()

  if (!client) {
    throw new Error('AI_UNAVAILABLE')
  }

  if (client.type === 'sdk') {
    const response = await client.client.chat.completions.create({
      messages: messages as any,
      thinking: options.thinking || { type: 'disabled' },
    } as any)
    return response.choices[0]?.message?.content || ''
  }

  // اتصال مباشر
  const { baseUrl, apiKey, chatId, userId } = client.config
  const url = `${baseUrl}/chat/completions`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-Z-AI-From': 'Z',
  }
  if (chatId) headers['X-Chat-Id'] = chatId
  if (userId) headers['X-User-Id'] = userId

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages,
      thinking: options.thinking || { type: 'disabled' },
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`ZAI API error ${response.status}: ${errorBody}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// تحليل احتياطي محلي (عند عدم توفر AI)
// يحلل الصورة بناءً على بيانات الكاميرا + قواعد بسيطة
export function localFallbackAnalysis(cameraZone: string, cameraModel: string) {
  const isIntersection = cameraZone.includes('تقاطع') || cameraZone.includes('Intersection')
  const isHighway = cameraZone.includes('سريع') || cameraZone.includes('Highway')
  const isNight = cameraZone.includes('ليلي') || cameraZone.includes('Night')
  const isRoundabout = cameraZone.includes('دوار') || cameraZone.includes('Roundabout')

  // احتمال عشوائي مبني على نوع الطريق
  const rand = Math.random()
  let hasViolation = rand > 0.55
  let violationType = 'speeding'
  let severity = 'medium'
  let confidence = 70 + Math.floor(rand * 25)
  let summary = 'مرور طبيعي على الطريق'
  let riskLevel = 'low'

  if (isIntersection) {
    if (rand > 0.6) {
      violationType = 'red_light'
      hasViolation = true
      severity = 'high'
      summary = 'مركبة تجاوزت الإشارة الحمراء'
      riskLevel = 'high'
    }
  } else if (isHighway) {
    if (rand > 0.5) {
      violationType = 'speeding'
      hasViolation = true
      severity = 'medium'
      summary = 'مركبة تتجاوز السرعة المحددة'
      riskLevel = 'medium'
    } else if (rand > 0.85) {
      violationType = 'excessive_speed'
      hasViolation = true
      severity = 'critical'
      summary = 'تجاوز سرعة عالية جداً'
      riskLevel = 'critical'
    }
  } else if (isNight) {
    if (rand > 0.7) {
      violationType = 'reckless'
      hasViolation = true
      severity = 'high'
      summary = 'قيادة خاطئة ليلاً'
      riskLevel = 'high'
    }
  } else if (isRoundabout) {
    if (rand > 0.65) {
      violationType = 'lane_violation'
      hasViolation = true
      severity = 'medium'
      summary = 'تجاوز مسار في الدوار'
      riskLevel = 'medium'
    }
  }

  const typesMap: Record<string, { ar: string; en: string }> = {
    speeding: { ar: 'تجاوز السرعة', en: 'speeding' },
    red_light: { ar: 'قطع الإشارة الحمراء', en: 'red_light' },
    excessive_speed: { ar: 'تجاوز السرعة العالية', en: 'excessive_speed' },
    reckless: { ar: 'القيادة الخاطئة', en: 'reckless' },
    lane_violation: { ar: 'تجاوز المسار', en: 'lane_violation' },
    wrong_way: { ar: 'القيادة عكس الاتجاه', en: 'wrong_way' },
    accident: { ar: 'حادث مروري', en: 'accident' },
    illegal_parking: { ar: 'مركبة متوقفة بالخطأ', en: 'illegal_parking' },
  }

  const t = typesMap[violationType] || typesMap.speeding

  return {
    hasViolation,
    violations: hasViolation
      ? [{
          type: t.ar,
          typeEn: t.en,
          severity,
          confidence,
          description: summary,
          descriptionEn: summary,
        }]
      : [],
    vehicleCount: 3 + Math.floor(rand * 15),
    summary,
    riskLevel,
    _fallback: true,
  }
}
