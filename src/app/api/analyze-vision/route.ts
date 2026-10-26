let promptText = "Analyze this traffic monitoring image for violations:"
    let base64Image = ""
    let mimeType = "image/jpeg" // القيمة الافتراضية

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
                mimeType = matches[1] // التقاط النوع الحقيقي للصورة (jpeg, png, webp...)
                base64Image = matches[2]
              }
            } else if (urlData.startsWith('http')) {
              // جلب الصورة الخارجية وتحويلها إلى Base64 لكي يفهمها Gemini
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
          mime_type: mimeType, // استخدام النوع المستخرج بدقة
          data: base64Image
        }
      })
    }
