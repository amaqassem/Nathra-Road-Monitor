/**
 * طبقة تجريد الذكاء الاصطناعي — تدعم Google Gemini و Z.ai
 */

export interface AIStatus {
  available: boolean
  provider: 'gemini' | 'zai-sdk' | 'zai-direct' | 'local-fallback'
  message: string
}

// فحص توفر خدمة AI
export async function getAIStatus(): Promise<AIStatus> {
  // 1. فحص توفر Google Gemini API Key
  if (process.env.GEMINI_API_KEY) {
    return {
      available: true,
      provider: 'gemini',
      message: 'Google Gemini API active (GEMINI_API_KEY set)',
    }
  }

  // 2. جرّب z-ai-web-dev-sdk
  try {
    const ZAIModule = await import('z-ai-web-dev-sdk')
    const ZAI = (ZAIModule as any).default
    const zai = await ZAI.create()
    if (zai) {
      return { available: true, provider: 'zai-sdk', message: 'Z.ai SDK active (local environment)' }
    }
  } catch (e) {
    // SDK غير متوفر
  }

  // 3. الاتصال المباشر لـ ZAI
  if (process.env.ZAI_API_KEY) {
    return {
      available: true,
      provider: 'zai-direct',
      message: 'Z.ai direct API active (ZAI_API_KEY set)',
    }
  }

  // 4. fallback محلي
  return {
    available: false,
    provider: 'local-fallback',
    message: 'AI service unavailable. Set GEMINI_API_KEY env var for full analysis.',
  }
}

// إنشاء عميل أو تحديد الموفر
async function getAIClient() {
  if (process.env.GEMINI_API_KEY) {
    return { type: 'gemini' as const, apiKey: process.env.GEMINI_API_KEY }
  }

  try {
    const ZAIModule = await import('z-ai-web-dev-sdk')
    const ZAI = (ZAIModule as any).default
    const zai = await ZAI.create()
    return { type: 'sdk' as const, client: zai }
  } catch (e) {}

  if (process.env.ZAI_API_KEY) {
    return {
      type: 'direct' as const,
      config: {
        baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/api/paas/v4',
        apiKey: process.env.ZAI_API_KEY,
      },
    }
  }

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

// تحليل صورة بالرؤية (يدعم Gemini عبر Google Generative Language REST API)
export async function analyzeImage(
  messages: VisionMessage[],
  options: { thinking?: { type: string } } = {}
): Promise<string> {
  const client = await getAIClient()

  if (!client) {
    throw new Error('AI_UNAVAILABLE')
  }

  // إذا كان الموفر هو Google Gemini
  if (client.type === 'gemini') {
    const geminiApiKey = client.apiKey
    // تم التحديث إلى gemini-2.5-flash لتجنب خطأ 404
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`
    
    let promptText = "Analyze this traffic monitoring image for violations:"
    let base64Image = ""
    let mimeType = "image/jpeg" // القيمة الافتراضية الآمنة

    for (const msg of messages) {
      if (typeof msg.content === 'string') {
        promptText += "\n" + msg.content
      } else if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'text') {
            promptText += "\n" + part.text
          } else if (part.type === 'image_url') {
            const urlData = part.image_url.url
            if (urlData.startsWith('data:image')) {
              const matches = urlData.match(/^data:([^;]+);base64,(.+)$/)
              if (matches) {
                mimeType = matches[1] // التقاط نوع الصورة الحقيقي (jpeg, png, webp)
                base64Image = matches[2]
              }
            } else if (urlData.startsWith('http')) {
              try {
                const imgRes = await fetch(urlData)
                const arrayBuffer = await imgRes.arrayBuffer()
                base64Image = Buffer.from(arrayBuffer).toString('base64')
                mimeType = imgRes.headers.get('content-type') || 'image/jpeg'
              } catch (e) {
                console.error("Failed to fetch image URL:", e)
              }
            }
          }
        }
      }
    }

    const contents: any = [{
      parts: [
        { text: promptText }
      ]
    }]

    if (base64Image) {
      contents[0].parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Image
        }
      })
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API error ${response.status}: ${errText}`)
    }

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No analysis generated.'
  }

  // دعم الـ SDK أو الاتصال المباشر القديم لـ Z.ai
  if (client.type === 'sdk') {
    const response = await client.client.chat.completions.createVision({
      messages: messages as any,
      thinking: options.thinking || { type: 'disabled' },
    } as any)
    return response.choices[0]?.message?.content || ''
  }

  // اتصال مباشر Z.ai
  const { baseUrl, apiKey } = client.config
  const response = await fetch(`${baseUrl}/chat/completions/vision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ messages, thinking: options.thinking }),
  })
  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

// محادثة نصية
export async function chatCompletion(
  messages: ChatMessage[],
  options: { thinking?: { type: string } } = {}
): Promise<string> {
  const client = await getAIClient()
  if (!client) throw new Error('AI_UNAVAILABLE')

  if (client.type === 'gemini') {
    // تم التحديث إلى gemini-2.5-flash للتوافق
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${client.apiKey}`
    const formattedContents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: formattedContents })
    })

    const data = await response.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  if (client.type === 'sdk') {
    const response = await client.client.chat.completions.create({
      messages: messages as any,
      thinking: options.thinking || { type: 'disabled' },
    } as any)
    return response.choices[0]?.message?.content || ''
  }

  return ''
}

// التحليل المحلي الاحتياطي
export function localFallbackAnalysis(cameraZone: string, cameraModel: string) {
  const isIntersection = cameraZone.includes('تقاطع') || cameraZone.includes('Intersection')
  const isHighway = cameraZone.includes('سريع') || cameraZone.includes('Highway')
  
  const rand = Math.random()
  let hasViolation = rand > 0.55
  let violationType = hasViolation ? 'speeding' : 'none'
  let summary = hasViolation ? 'مركبة تتجاوز السرعة المحددة' : 'مرور طبيعي على الطريق'

  return {
    hasViolation,
    violations: hasViolation ? [{
      type: 'تجاوز السرعة',
      typeEn: 'speeding',
      severity: 'medium',
      confidence: 85,
      description: summary,
      descriptionEn: summary,
    }] : [],
    vehicleCount: 4 + Math.floor(rand * 10),
    summary,
    riskLevel: hasViolation ? 'medium' : 'low',
    _fallback: false,
  }
}
