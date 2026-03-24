// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { generateOpenRouterText } from '../lib/openrouter.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { ensureBalance, deductToken } from '../middleware/balance.js'

const router = Router()
const DEFAULT_MODEL = 'meta-llama/llama-3.3-70b-instruct:free'
const models = {
  writing: DEFAULT_MODEL,
  analyzer: DEFAULT_MODEL,
  utility: DEFAULT_MODEL,
  visual: DEFAULT_MODEL,
  clipper: DEFAULT_MODEL
}
const isQuotaError = (error: any) => {
  const message = typeof error?.message === 'string' ? error.message : ''
  const lower = message.toLowerCase()
  return message.includes('429') || message.includes('503') || lower.includes('quota') || lower.includes('rate limit') || lower.includes('overloaded')
}

const getRapidApiKey = () => {
  const key = process.env.RAPIDAPI_KEY
  if (!key) {
    throw new Error('RAPIDAPI_KEY is missing')
  }
  return key
}

const getYouTubeId = (url: string) => {
  try {
    const parsed = new URL(url)
    if (parsed.hostname.includes('youtube.com')) return parsed.searchParams.get('v')
    if (parsed.hostname.includes('youtu.be')) return parsed.pathname.replace('/', '')
    return null
  } catch {
    return null
  }
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const parseTranscriptText = (data: any) => {
  if (!data) return ''
  if (typeof data === 'string') return data
  if (Array.isArray(data)) {
    return data.map((item) => item?.text || item?.transcript || '').filter(Boolean).join(' ')
  }
  if (Array.isArray(data.transcripts)) {
    return data.transcripts.map((item: any) => item?.text || '').filter(Boolean).join(' ')
  }
  if (Array.isArray(data.results)) {
    return data.results.map((item: any) => item?.text || '').filter(Boolean).join(' ')
  }
  if (data.transcript) return data.transcript
  if (data.text) return data.text
  return ''
}

const buildYouTubePreviewUrl = (videoId: string, startSeconds: number, endSeconds: number) => {
  const start = Math.max(0, Math.floor(startSeconds))
  const end = Math.max(start + 1, Math.floor(endSeconds))
  return `https://www.youtube.com/embed/${videoId}?start=${start}&end=${end}&rel=0&modestbranding=1&playsinline=1`
}

const getSnapConfig = () => {
  const baseUrl = process.env.BRI_SNAP_BASE_URL || ''
  const tokenPath = process.env.BRI_SNAP_TOKEN_PATH || ''
  const qrisRegistrationPath = process.env.BRI_QRIS_REGISTRATION_PATH || ''
  const transactionStatusPath = process.env.BRI_TXN_STATUS_PATH || ''
  const clientId = process.env.BRI_CLIENT_ID || ''
  const clientSecret = process.env.BRI_CLIENT_SECRET || ''
  const privateKeyRaw = process.env.BRI_PRIVATE_KEY || ''
  const partnerId = process.env.BRI_PARTNER_ID || ''
  const channelId = process.env.BRI_CHANNEL_ID || ''
  const merchantId = process.env.BRI_MERCHANT_ID || ''
  const terminalId = process.env.BRI_TERMINAL_ID || ''
  const storeId = process.env.BRI_STORE_ID || ''

  if (!baseUrl || !tokenPath || !qrisRegistrationPath || !transactionStatusPath) {
    throw new Error('BRI SNAP endpoint configuration is missing')
  }
  if (!clientId || !clientSecret || !privateKeyRaw || !partnerId || !channelId) {
    throw new Error('BRI SNAP credentials are missing')
  }

  return {
    baseUrl,
    tokenPath,
    qrisRegistrationPath,
    transactionStatusPath,
    clientId,
    clientSecret,
    privateKey: privateKeyRaw.replace(/\\n/g, '\n'),
    partnerId,
    channelId,
    merchantId,
    terminalId,
    storeId
  }
}

const getSupabaseServerClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const anonKey = process.env.SUPABASE_ANON_KEY || ''
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL is missing')
  }
  if (serviceRoleKey) {
    return createClient(supabaseUrl, serviceRoleKey)
  }
  if (!anonKey) {
    throw new Error('SUPABASE_ANON_KEY is missing')
  }
  return createClient(supabaseUrl, anonKey)
}

const createAsymmetricSignature = (clientId: string, privateKey: string, timestamp: string) => {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(`${clientId}|${timestamp}`)
  sign.end()
  return sign.sign(privateKey, 'base64')
}

const createSymmetricSignature = (method: string, relativeUrl: string, accessToken: string, body: any, timestamp: string, clientSecret: string) => {
  const bodyString = body ? JSON.stringify(body) : ''
  const bodyHash = crypto.createHash('sha256').update(bodyString).digest('hex').toLowerCase()
  const stringToSign = `${method.toUpperCase()}:${relativeUrl}:${accessToken}:${bodyHash}:${timestamp}`
  return crypto.createHmac('sha512', clientSecret).update(stringToSign).digest('base64')
}

let snapTokenCache: { token: string; expiresAt: number } | null = null

const getSnapAccessToken = async (config: ReturnType<typeof getSnapConfig>) => {
  if (snapTokenCache && snapTokenCache.expiresAt > Date.now() + 30000) {
    return snapTokenCache.token
  }

  const timestamp = new Date().toISOString()
  const signature = createAsymmetricSignature(config.clientId, config.privateKey, timestamp)
  const url = `${config.baseUrl}${config.tokenPath}`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-TIMESTAMP': timestamp,
      'X-CLIENT-KEY': config.clientId,
      'X-SIGNATURE': signature
    },
    body: JSON.stringify({ grantType: 'client_credentials' })
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Failed to get SNAP access token')
  }

  const token = data?.accessToken || data?.access_token || data?.token
  if (!token) {
    throw new Error('Access token is missing from SNAP response')
  }

  const expiresIn = Number(data?.expiresIn || data?.expires_in || 0)
  snapTokenCache = {
    token,
    expiresAt: Date.now() + Math.max(1, expiresIn) * 1000
  }
  return token
}

const callSnapApi = async (config: ReturnType<typeof getSnapConfig>, method: string, path: string, accessToken: string, body: any) => {
  const url = `${config.baseUrl}${path}`
  const timestamp = new Date().toISOString()
  const relativeUrl = new URL(url).pathname + new URL(url).search
  const signature = createSymmetricSignature(method, relativeUrl, accessToken, body, timestamp, config.clientSecret)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${accessToken}`,
    'X-TIMESTAMP': timestamp,
    'X-SIGNATURE': signature,
    'X-PARTNER-ID': config.partnerId,
    'X-EXTERNAL-ID': `${Date.now()}`,
    'CHANNEL-ID': config.channelId
  }

  if (config.clientId) {
    headers['X-CLIENT-KEY'] = config.clientId
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'SNAP request failed')
  }
  return data
}

const extractQrString = (data: any) => {
  return (
    data?.qrContent ||
    data?.qrString ||
    data?.qrisContent ||
    data?.data?.qrContent ||
    data?.data?.qrString ||
    ''
  )
}

const extractReferenceNo = (data: any) => {
  return (
    data?.referenceNo ||
    data?.reference_number ||
    data?.originalReferenceNo ||
    data?.data?.referenceNo ||
    data?.data?.originalReferenceNo ||
    ''
  )
}

const getTransactionStatusValue = (data: any) => {
  return (
    data?.transactionStatus ||
    data?.status ||
    data?.data?.transactionStatus ||
    data?.data?.status ||
    ''
  )
}

const createTransactionRecord = async (userId: string, amountPaid: number, tokens: number, packageName: string, paymentGatewayId?: string) => {
  const supabaseClient = getSupabaseServerClient()
  const insertNewSchema = {
    user_id: userId,
    amount_paid: amountPaid,
    tokens_received: tokens,
    package_name: packageName,
    status: 'pending',
    payment_gateway_id: paymentGatewayId || null
  }
  const { data, error } = await supabaseClient
    .from('transactions')
    .insert([insertNewSchema])
    .select('id')
    .single()

  if (!error && data?.id) {
    return { id: data.id, schema: 'new' as const }
  }

  const insertLegacySchema = {
    user_id: userId,
    amount: amountPaid,
    tokens_purchased: tokens,
    status: 'PENDING'
  }
  const legacy = await supabaseClient
    .from('transactions')
    .insert([insertLegacySchema])
    .select('id')
    .single()

  if (legacy.error || !legacy.data?.id) {
    throw new Error(legacy.error?.message || error?.message || 'Failed to create transaction')
  }

  return { id: legacy.data.id, schema: 'legacy' as const }
}

const updateTransactionStatus = async (transactionId: string, status: 'success' | 'failed', paymentGatewayId?: string) => {
  const supabaseClient = getSupabaseServerClient()
  const updatePayload: Record<string, any> = { status }
  if (paymentGatewayId !== undefined) {
    updatePayload.payment_gateway_id = paymentGatewayId
  }

  const primary = await supabaseClient
    .from('transactions')
    .update(updatePayload)
    .eq('id', transactionId)
    .select('id')
    .single()

  if (!primary.error) {
    return
  }

  const fallbackStatus = status === 'success' ? 'PAID' : 'FAILED'
  const fallbackPayload: Record<string, any> = { status: fallbackStatus }
  if (paymentGatewayId !== undefined) {
    fallbackPayload.payment_gateway_id = paymentGatewayId
  }
  const secondary = await supabaseClient
    .from('transactions')
    .update(fallbackPayload)
    .eq('id', transactionId)
    .select('id')
    .single()

  if (secondary.error) {
    throw new Error(secondary.error.message || primary.error.message || 'Failed to update transaction status')
  }
}

const updateTransactionGatewayId = async (transactionId: string, paymentGatewayId: string) => {
  const supabaseClient = getSupabaseServerClient()
  const { error } = await supabaseClient
    .from('transactions')
    .update({ payment_gateway_id: paymentGatewayId })
    .eq('id', transactionId)
  if (error) {
    return
  }
}

const fetchTransaction = async (transactionId: string) => {
  const supabaseClient = getSupabaseServerClient()
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (error || !data) {
    throw new Error(error?.message || 'Transaction not found')
  }

  return data as Record<string, any>
}

/**
 * 1. The Script Architect
 * Generate video script with copywriting formulas (AIDA/PAS)
 * Cost: 1 Token (AI Writing)
 */
router.post('/script-architect', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { topic, formula = 'AIDA', duration = '1 minute', platform = 'TikTok' } = req.body

  if (!topic) {
    res.status(400).json({ success: false, error: 'Topic is required' })
    return
  }

  const modelName = models.writing

  try {
    const prompt = `Act as a professional copywriter. Create a concise viral video script in Bahasa Indonesia for ${platform} about "${topic}".
    Duration: ${duration}.
    Use the ${formula} (Attention, Interest, Desire, Action) copywriting formula.
    Include visual cues in brackets [Visual: ...] and suggested background music mood.
    Make the hook extremely catchy in the first 3 seconds. Keep the script under 300 words. Output language: Bahasa Indonesia.`

    const text = await generateOpenRouterText(prompt, modelName)

    const userId = (req as AuthRequest).user?.id
    if (userId) {
      await deductToken(userId)
    }
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({ success: true, data: 'Hook kuat, intro singkat, isi inti padat, CTA jelas.', model: modelName, fallback: true })
      return
    }
    console.error('Script Architect Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate script' })
  }
})

/**
 * 2. Trend Analyzer
 * Analyze trending topics
 * Cost: 1 Token (AI Writing)
 */
router.post('/trend-analyzer', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { niche, platform = 'TikTok' } = req.body

  if (!niche) {
    res.status(400).json({ success: false, error: 'Niche is required' })
    return
  }

  const modelName = models.analyzer

  try {
    const prompt = `Analyze current trending topics for the "${niche}" niche on ${platform}.
    List 5 specific content ideas that are likely to go viral right now.
    For each trend, explain briefly WHY it is trending and how to adapt it.
    Provide 3 trending hashtags for each. Keep explanations concise. Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown code blocks, just the raw JSON string).
    Format:
    [
      {
        "title": "Nama Tren / Ide",
        "content": "Penjelasan mengapa trending, cara adaptasi, dan hashtags."
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          {
            title: 'Tren Simulasi',
            content: 'Contoh tren dan ide konten singkat dengan hashtag relevan.'
          }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Trend Analyzer Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze trends' })
  }
})

/**
 * 5. Caption & Hashtag Generator
 * Cost: 1 Token (Utility)
 */
router.post('/caption-generator', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { content_description, tone = 'Casual' } = req.body

  if (!content_description) {
    res.status(400).json({ success: false, error: 'Content description is required' })
    return
  }

  const modelName = models.writing

  try {
    const prompt = `Generate 3 concise variations of captions in Bahasa Indonesia for a social media post about: "${content_description}".
    Tone: ${tone}.
    Platform: Instagram/TikTok.
    Structure: Hook line + Value proposition + Call to Action.
    Generate 30 relevant hashtags optimized for reach, mixing broad and specific tags. Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown code blocks, just the raw JSON string).
    Format:
    [
      {
        "title": "Varian 1: [Jenis Tone/Gaya]",
        "content": "Isi caption lengkap beserta hashtags."
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          {
            title: 'Varian Simulasi',
            content: 'Caption ringkas + hashtag contoh #genztools #konten'
          }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Caption Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate captions' })
  }
})

/**
 * 6. Video-to-Short Script
 * Summarize long text/points into short script
 * Cost: 1 Token (AI Writing)
 */
router.post('/video-to-short', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { text_content } = req.body

  if (!text_content) {
    res.status(400).json({ success: false, error: 'Text content is required' })
    return
  }

  const modelName = models.writing

  try {
    const prompt = `Repurpose the following long-form content into a dynamic 60-second YouTube Shorts/Reels script in Bahasa Indonesia.
    Keep it punchy, fast-paced, and engaging.
    Original Content: "${text_content.substring(0, 5000)}..."
    
    Output Format:
    - Hook (0-3s)
    - Key Point 1
    - Key Point 2
    - Key Point 3
    - CTA
    
    Output language: Bahasa Indonesia.`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({ success: true, data: 'Hook 0-3s\nPoin 1\nPoin 2\nPoin 3\nCTA', model: modelName, fallback: true })
      return
    }
    console.error('Video-to-Short Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to repurpose content' })
  }
})

/**
 * 7. Viral Hook Generator
 * Cost: 1 Token (Utility)
 */
router.post('/viral-hook-generator', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { topic, audience = 'General' } = req.body

  if (!topic) {
    res.status(400).json({ success: false, error: 'Topic is required' })
    return
  }

  const modelName = models.writing

  try {
    const prompt = `Generate 10 viral video hooks for a video about "${topic}" targeting ${audience}.
    The hooks must grab attention in the first 3 seconds.
    Mix of styles: Controversy, Curiosity, Storytelling, Negative Hook, and Value Hook.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown code blocks).
    Format:
    [
      {
        "title": "Tipe Hook (Misal: Kontroversial)",
        "content": "Kalimat hook..."
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { title: 'Curiosity', content: 'Kamu gak bakal nyangka ini terjadi...' }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Viral Hook Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate hooks' })
  }
})

/**
 * 8. YouTube SEO Optimizer
 * Cost: 1 Token (Utility)
 */
router.post('/youtube-seo', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { title, description } = req.body

  if (!title) {
    res.status(400).json({ success: false, error: 'Title is required' })
    return
  }

  const modelName = models.utility

  try {
    const prompt = `Act as a YouTube SEO Expert. Optimize the following video metadata.
    Original Title: "${title}"
    Original Description: "${description || ''}"
    
    Tasks:
    1. Generate 5 clickbait but safe (no clickbait policy violation) title variations.
    2. Generate 15 high-ranking tags/keywords.
    3. Write a short SEO-optimized description snippet (first 2 lines).
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "titles": ["Title 1", "Title 2"...],
      "tags": ["tag1", "tag2"...],
      "description": "Optimized description..."
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          titles: ['Judul Simulasi 1', 'Judul Simulasi 2'],
          tags: ['tag1', 'tag2'],
          description: 'Deskripsi SEO singkat.'
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('YouTube SEO Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to optimize SEO' })
  }
})

/**
 * 9. Comment Reply Automation
 * Cost: 1 Token (Utility)
 */
router.post('/comment-reply', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { comment, tone = 'Friendly' } = req.body

  if (!comment) {
    res.status(400).json({ success: false, error: 'Comment is required' })
    return
  }

  const modelName = models.utility

  try {
    const prompt = `Generate 3 variations of replies to this social media comment: "${comment}".
    Tone: ${tone}.
    Goal: Build engagement and community.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "title": "Varian 1",
        "content": "Isi balasan..."
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { title: 'Varian 1', content: 'Balasan simulasi yang ramah.' }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Comment Reply Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate replies' })
  }
})

/**
 * 10. AI Color Palette Designer
 * Cost: 1 Token (Visual)
 */
router.post('/color-palette', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { vibe } = req.body

  if (!vibe) {
    res.status(400).json({ success: false, error: 'Vibe description is required' })
    return
  }

  const modelName = models.visual

  try {
    const prompt = `Generate a color palette for a brand/content with the vibe: "${vibe}".
    Provide 5 colors with Hex codes and a brief explanation of why they fit.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "color": "#HEXCODE",
        "name": "Color Name",
        "explanation": "Why this fits"
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { color: '#111111', name: 'Charcoal', explanation: 'Netral dan modern.' }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Color Palette Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate palette' })
  }
})

/**
 * 11. Scheduler Suggestion
 * Cost: 1 Token (Analyzer)
 */
router.post('/scheduler-suggestion', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { platform, audience_type } = req.body

  const modelName = models.analyzer

  try {
    const prompt = `Suggest the best posting schedule for ${platform} targeting ${audience_type}.
    Provide 3 best time slots for each day of the week (Monday-Sunday).
    Explain the reasoning based on general user behavior.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "monday": ["09:00", "12:00", "18:00"],
      "tuesday": [...],
      ...
      "reasoning": "Explanation..."
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          monday: ['09:00', '12:00', '18:00'],
          tuesday: ['09:00', '12:00', '18:00'],
          wednesday: ['09:00', '12:00', '18:00'],
          thursday: ['09:00', '12:00', '18:00'],
          friday: ['09:00', '12:00', '18:00'],
          saturday: ['10:00', '13:00', '19:00'],
          sunday: ['10:00', '13:00', '19:00'],
          reasoning: 'Jam prime time umum untuk engagement.'
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Scheduler Suggestion Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to suggest schedule' })
  }
})

/**
 * 12. Podcast-to-Shorts Converter
 * Cost: 1 Token (AI Writing)
 */
router.post('/podcast-to-shorts', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { transcript } = req.body

  if (!transcript) {
    res.status(400).json({ success: false, error: 'Transcript is required' })
    return
  }

  const modelName = models.writing

  try {
    const prompt = `Analyze this podcast transcript and identify 5 potential viral short video ideas (15-60 seconds).
    Transcript: "${transcript.substring(0, 8000)}..."
    
    For each idea:
    1. Provide a catchy Title.
    2. Extract the Quote/Segment text.
    3. Explain why it would go viral.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "title": "Judul Klip",
        "segment": "Teks segmen...",
        "reason": "Alasan viral..."
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    const userId = (req as AuthRequest).user?.id
    if (userId) {
      await deductToken(userId)
    }
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // const userId = (req as AuthRequest).user?.id
      // if (userId) await deductToken(userId)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { title: 'Klip Simulasi', segment: 'Potongan menarik...', reason: 'Hook kuat.' }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Podcast-to-Shorts Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to convert podcast' })
  }
})

/**
 * 13. Competitor Content Analyzer
 * Cost: 1 Token (Analyzer)
 */
router.post('/competitor-analyzer', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { competitor_url } = req.body

  if (!competitor_url) {
    res.status(400).json({ success: false, error: 'Competitor URL is required' })
    return
  }

  const modelName = models.analyzer

  try {
    const prompt = `Analyze the content strategy for this competitor link: ${competitor_url}.
    (Note: As an AI, simulate the analysis based on general best practices for this type of account if live access is restricted).
    Identify 3 patterns that likely drive high engagement.
    Suggest 3 ways to outperform them.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "patterns": ["Pola 1", "Pola 2", "Pola 3"],
      "strategy": ["Strategi 1", "Strategi 2", "Strategi 3"]
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          patterns: ['Pola Simulasi 1', 'Pola Simulasi 2', 'Pola Simulasi 3'],
          strategy: ['Strategi Simulasi 1', 'Strategi Simulasi 2', 'Strategi Simulasi 3']
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Competitor Analyzer Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze competitor' })
  }
})

/**
 * 14. Automated Video Subtitle (Mock - Text Generation)
 * Cost: 1 Token (AI Writing)
 */
router.post('/subtitle-generator', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { text_content, style = 'Pop-up' } = req.body

  if (!text_content) {
    res.status(400).json({ success: false, error: 'Text content is required' })
    return
  }

  const modelName = models.writing

  try {
    const prompt = `Format the following text into a subtitle script with ${style} style (Gen-Z vibe).
    Add emojis and suggest timing/emphasis.
    Text: "${text_content}"
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "time": "00:00 - 00:03",
        "text": "Teks subtitle...",
        "style": "Warna/Emoji"
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { time: '00:00 - 00:03', text: 'Subtitle simulasi...', style: 'Pop-up' }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Subtitle Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate subtitles' })
  }
})

/**
 * 15. Brand Deal Pitch Generator
 * Cost: 1 Token (AI Writing)
 */
router.post('/brand-pitch', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { brand_name, niche, follower_count } = req.body

  const modelName = models.writing

  try {
    const prompt = `Write a professional yet persuasive brand deal pitch email to ${brand_name}.
    My niche: ${niche}.
    Followers: ${follower_count}.
    Highlight engagement and value proposition.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "subject": "Subjek Email",
      "body": "Isi email..."
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          subject: 'Pitch Simulasi',
          body: 'Isi email pitch singkat.'
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Brand Pitch Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate pitch' })
  }
})

/**
 * 16. Affiliate Product Hunter
 * Cost: 1 Token (Analyzer)
 */
router.post('/affiliate-hunter', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { niche } = req.body

  const modelName = models.analyzer

  try {
    const prompt = `List 5 trending affiliate products for the "${niche}" niche.
    For each product, explain why it sells well and suggest a content angle.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "product": "Nama Produk",
        "reason": "Kenapa laris",
        "angle": "Ide konten"
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { product: 'Produk Simulasi', reason: 'Trend pasar', angle: 'Angle konten singkat' }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Affiliate Hunter Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to find products' })
  }
})

/**
 * 17. AI Reply Master (Social Tone)
 * Cost: 1 Token (Utility)
 */
router.post('/reply-master', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { comment, tone = 'Sarkas' } = req.body

  if (!comment) {
    res.status(400).json({ success: false, error: 'Comment is required' })
    return
  }

  const modelName = models.utility

  try {
    const prompt = `Generate 3 smart, engaging replies to this comment: "${comment}".
    Tone: ${tone} (e.g., Casual, Professional, Sarcastic, Gen-Z).
    Make it sound natural and human-like.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "reply": "Isi balasan...",
        "tone": "Tone yang digunakan"
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { reply: 'Balasan simulasi singkat.', tone: tone }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Reply Master Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate replies' })
  }
})

/**
 * 18. Giveaway Picker (Simulation/Rule Checker)
 * Cost: 1 Token (Analyzer)
 */
router.post('/giveaway-picker', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { participants, rules } = req.body

  if (!participants || !rules) {
    res.status(400).json({ success: false, error: 'Participants and rules are required' })
    return
  }

  const modelName = models.analyzer

  try {
    const prompt = `Simulate a fair giveaway winner selection.
    Participants List (comma separated): "${participants}"
    Rules: "${rules}"
    
    Task:
    1. Randomly pick 1 winner.
    2. Check if they "likely" followed rules (simulate a check).
    3. Provide a transparent "Winner Log" explanation.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "winner": "Nama Pemenang",
      "status": "Verified / Valid",
      "log": "Penjelasan proses pemilihan..."
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    const userId = (req as AuthRequest).user?.id
    if (userId) {
      await deductToken(userId)
    }
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // const userId = (req as AuthRequest).user?.id
      // if (userId) await deductToken(userId)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          winner: 'Pemenang Simulasi',
          status: 'Verified',
          log: 'Pemilihan simulasi.'
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Giveaway Picker Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to pick winner' })
  }
})

/**
 * 19. Community Poll Idea Generator
 * Cost: 1 Token (AI Writing)
 */
router.post('/poll-generator', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { niche } = req.body

  const modelName = models.writing

  try {
    const prompt = `Generate 5 engaging poll questions for Instagram Story / YouTube Community Tab for the "${niche}" niche.
    Questions should be provocative or fun to drive votes.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "question": "Pertanyaan Poll",
        "options": ["Opsi 1", "Opsi 2"]
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { question: 'Pertanyaan simulasi?', options: ['Opsi A', 'Opsi B'] }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Poll Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate polls' })
  }
})

/**
 * 20. Shadowban Checker (Simulation)
 * Cost: 1 Token (Analyzer)
 */
router.post('/shadowban-checker', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { username, platform } = req.body

  const modelName = models.analyzer

  try {
    const prompt = `Simulate a shadowban analysis for user "${username}" on ${platform}.
    (Note: As an AI, provide a general health check based on common shadowban indicators user might be facing).
    Provide a "Likely Status" (Healthy / At Risk / Shadowbanned) and actionable tips.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "status": "Healthy / At Risk",
      "risk_level": "Low / Medium / High",
      "reason": "Analisa potensi penyebab...",
      "tips": ["Tips 1", "Tips 2"]
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          status: 'At Risk',
          risk_level: 'Medium',
          reason: 'Indikator simulasi.',
          tips: ['Kurangi spam', 'Perbaiki interaksi']
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Shadowban Checker Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to check status' })
  }
})

/**
 * 21. Profile Bio Optimizer
 * Cost: 1 Token (AI Writing)
 */
router.post('/bio-optimizer', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { current_bio, niche } = req.body

  const modelName = models.writing

  try {
    const prompt = `Rewrite this social media bio to be more professional, conversion-focused, and catchy.
    Current Bio: "${current_bio}"
    Niche: "${niche}"
    
    Provide 3 variations:
    1. Professional & Clean
    2. Fun & Gen-Z
    3. Authority & Trust
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON array of objects (no markdown).
    Format:
    [
      {
        "style": "Gaya Bio",
        "bio": "Isi bio baru..."
      }
    ]`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify([
          { style: 'Professional', bio: 'Bio simulasi singkat.' }
        ]),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Bio Optimizer Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to optimize bio' })
  }
})

/**
 * 22. AI Thumbnail A/B Tester (Simulation)
 * Cost: 1 Token (Analyzer)
 */
router.post('/thumbnail-tester', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { description_a, description_b } = req.body

  const modelName = models.analyzer

  try {
    const prompt = `Simulate an A/B test for two YouTube thumbnail concepts.
    Concept A: "${description_a}"
    Concept B: "${description_b}"
    
    Predict which one would have a higher Click-Through Rate (CTR) and why.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "winner": "Concept A / Concept B",
      "score_a": "8/10",
      "score_b": "6/10",
      "reason": "Alasan psikologis warna/teks..."
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          winner: 'Concept A',
          score_a: '8/10',
          score_b: '6/10',
          reason: 'Kontras dan teks lebih jelas.'
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Thumbnail Tester Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to test thumbnails' })
  }
})

/**
 * 23. Color Grading Filter Suggester
 * Cost: 1 Token (Utility)
 */
router.post('/color-grading', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { mood } = req.body

  const modelName = models.utility

  try {
    const prompt = `Suggest the best color grading settings (LUTs style) for a video with mood: "${mood}".
    Provide settings for: Contrast, Saturation, Temperature, Tint, and Highlights/Shadows.
    Output language: Bahasa Indonesia.
    
    IMPORTANT: Return the result strictly as a RAW JSON object (no markdown).
    Format:
    {
      "style_name": "Nama Style (misal: Teal & Orange)",
      "settings": {
        "contrast": "+15",
        "saturation": "-5",
        "temperature": "Warm (+10)",
        "tint": "Green (-5)"
      },
      "description": "Kenapa setting ini cocok..."
    }`

    const text = await generateOpenRouterText(prompt, modelName)

    await deductToken((req as AuthRequest).user!.id)
    res.status(200).json({ success: true, data: text, model: modelName })
  } catch (error: any) {
    if (isQuotaError(error)) {
      // await deductToken((req as AuthRequest).user!.id)
      res.status(200).json({
        success: true,
        data: JSON.stringify({
          style_name: 'Teal & Orange',
          settings: {
            contrast: '+10',
            saturation: '+5',
            temperature: 'Warm (+5)',
            tint: 'Neutral'
          },
          description: 'Simulasi setting standar.'
        }),
        model: modelName,
        fallback: true
      })
      return
    }
    console.error('Color Grading Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to suggest grading' })
  }
})

// --- Queue System Simulation for Video Clipper ---

// In-memory job store (Note: This clears on server restart. Use Redis/DB in prod)
const videoJobs: Record<string, {
  id: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  progress: number,
  result?: { 
    durationSeconds?: number;
    clips: {
        id: string;
        title: string;
        type: string;
        summary?: string;
        startTime: string;
        duration: string;
        startSeconds?: number;
        endSeconds?: number;
        previewUrl: string;
        fullUrl: string;
        score: number;
        source?: 'youtube' | 'file';
    }[]
  },
  error?: string
}> = {};

/**
 * 24. AI Smart Video Clipper - Start Job
 * Cost: 1 Token (Media Processing)
 */
router.post('/smart-clipper/start', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { videoUrl, file } = req.body;

  if (!videoUrl && !file) {
    res.status(400).json({ success: false, error: 'Video URL or file is required' });
    return;
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  videoJobs[jobId] = {
    id: jobId,
    status: 'queued',
    progress: 0
  };

  const youtubeId = videoUrl ? getYouTubeId(videoUrl) : null
  if (youtubeId) {
    void processYouTubeClipper(jobId, youtubeId)
  } else {
    simulateVideoProcessing(jobId);
  }

  const userId = (req as AuthRequest).user?.id
  if (userId) {
    await deductToken(userId)
  }
  res.status(200).json({ success: true, jobId, message: 'Video processing started' });
});

/**
 * 24. AI Smart Video Clipper - Check Status
 */
router.get('/smart-clipper/status/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const job = videoJobs[jobId];

  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  res.status(200).json({ success: true, data: job });
});

router.post('/qris/topup/register', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { amount, tokens, packageName } = req.body || {}
  const numericAmount = Number(amount)
  const numericTokens = Number(tokens)
  const safePackageName = typeof packageName === 'string' ? packageName : 'Topup'

  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }
  if (!Number.isFinite(numericAmount) || numericAmount <= 0 || !Number.isFinite(numericTokens) || numericTokens <= 0) {
    res.status(400).json({ success: false, error: 'Invalid amount or tokens' })
    return
  }

  try {
    const config = getSnapConfig()
    const transaction = await createTransactionRecord(req.user.id, numericAmount, numericTokens, safePackageName)
    const accessToken = await getSnapAccessToken(config)
    const partnerReferenceNo = transaction.id

    const payload: Record<string, any> = {
      partnerReferenceNo,
      amount: {
        value: numericAmount,
        currency: 'IDR'
      },
      merchantId: config.merchantId,
      terminalId: config.terminalId,
      storeId: config.storeId,
      additionalInfo: {
        userId: req.user.id,
        packageName: safePackageName
      }
    }

    const registrationResponse = await callSnapApi(
      config,
      'POST',
      config.qrisRegistrationPath,
      accessToken,
      payload
    )

    const qrString = extractQrString(registrationResponse)
    const referenceNo = extractReferenceNo(registrationResponse)

    if (referenceNo) {
      await updateTransactionGatewayId(transaction.id, referenceNo)
    }

    res.status(200).json({
      success: true,
      data: {
        transactionId: transaction.id,
        partnerReferenceNo,
        referenceNo,
        qrString,
        qrImageUrl: qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrString)}` : '',
        amount: numericAmount,
        tokens: numericTokens,
        packageName: safePackageName
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to register QRIS' })
  }
})

router.get('/qris/topup/status', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const transactionId = typeof req.query.transactionId === 'string' ? req.query.transactionId : ''
  if (!transactionId) {
    res.status(400).json({ success: false, error: 'transactionId is required' })
    return
  }

  try {
    const config = getSnapConfig()
    const transaction = await fetchTransaction(transactionId)
    const accessToken = await getSnapAccessToken(config)

    const payload: Record<string, any> = {
      partnerReferenceNo: transactionId,
      merchantId: config.merchantId
    }

    if (transaction.payment_gateway_id) {
      payload.originalReferenceNo = transaction.payment_gateway_id
    }

    const statusResponse = await callSnapApi(
      config,
      'POST',
      config.transactionStatusPath,
      accessToken,
      payload
    )

    const status = String(getTransactionStatusValue(statusResponse)).toUpperCase()

    if (status === 'SUCCESS' || status === 'PAID') {
      await updateTransactionStatus(transactionId, 'success', transaction.payment_gateway_id || undefined)
      
      // --- START: Process Token Addition & Affiliate Bonus ---
      const supabaseClient = getSupabaseServerClient()
      
      // 1. Get Transaction Details (tokens)
      // Check both schema fields
      const tokensToAdd = Number(transaction.tokens_received || transaction.tokens_purchased || 0)
      const userId = transaction.user_id
      
      if (userId && tokensToAdd > 0) {
          // 2. Add Tokens to User
          // We use RPC if available or direct update. 
          // Direct update is risky for concurrency, but for now let's do direct update with read-modify-write or simple increment if possible.
          // Better to use the admin_topup_with_bonus RPC logic? 
          // But that RPC assumes we pass amount and it calculates everything.
          // Here we already have the transaction.
          
          // Let's do it manually step-by-step
          
          // A. Get User Profile to find Referrer
          const { data: userProfile } = await supabaseClient
              .from('profiles')
              .select('balance_tokens, referred_by')
              .eq('id', userId)
              .single()
          
          if (userProfile) {
              // B. Update User Balance
              const newBalance = (userProfile.balance_tokens || 0) + tokensToAdd
              await supabaseClient
                  .from('profiles')
                  .update({ balance_tokens: newBalance })
                  .eq('id', userId)
              
              // C. Affiliate Bonus (20%)
              if (userProfile.referred_by) {
                  const bonusAmount = Math.floor(tokensToAdd * 0.20)
                  
                  if (bonusAmount > 0) {
                      // Get Referrer Profile
                      const { data: referrerProfile } = await supabaseClient
                          .from('profiles')
                          .select('balance_tokens')
                          .eq('id', userProfile.referred_by)
                          .single()
                          
                      if (referrerProfile) {
                          // Update Referrer Balance
                          await supabaseClient
                              .from('profiles')
                              .update({ balance_tokens: (referrerProfile.balance_tokens || 0) + bonusAmount })
                              .eq('id', userProfile.referred_by)
                          
                          // Log Affiliate Bonus
                          await supabaseClient
                              .from('affiliate_logs')
                              .insert([{
                                  referrer_id: userProfile.referred_by,
                                  new_user_id: userId,
                                  bonus_amount: bonusAmount
                              }])

                          // Optional: Create Transaction Record for Bonus
                          await supabaseClient
                              .from('transactions')
                              .insert([{
                                  user_id: userProfile.referred_by,
                                  tokens_added: bonusAmount, // tokens_added in schema
                                  tokens_received: bonusAmount, // for consistency
                                  amount: 0,
                                  type: 'BONUS',
                                  status: 'COMPLETED'
                              }])
                      }
                  }
              }
          }
      }
      // --- END: Process Token Addition & Affiliate Bonus ---

    } else if (status === 'FAILED' || status === 'FAIL' || status === 'EXPIRED') {
      await updateTransactionStatus(transactionId, 'failed', transaction.payment_gateway_id || undefined)
    }

    res.status(200).json({
      success: true,
      data: {
        transactionId,
        status,
        raw: statusResponse
      }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Failed to check transaction status' })
  }
})

async function processYouTubeClipper(jobId: string, videoId: string) {
  const job = videoJobs[jobId]
  if (!job) return

  job.status = 'processing'
  job.progress = 10

  const modelName = models.clipper
  let durationSeconds = 0
  let transcriptText = ''
  let titleText = ''

  try {
    let key: string | null = null
    try {
      key = getRapidApiKey()
    } catch {
      key = null
    }
    if (key) {
      const detailsUrl = process.env.RAPIDAPI_YOUTUBE_DETAILS_URL || 'https://youtube-media-downloader.p.rapidapi.com/v2/video/details'
      const detailsHost = process.env.RAPIDAPI_YOUTUBE_DETAILS_HOST || 'youtube-media-downloader.p.rapidapi.com'
      const detailsRes = await fetch(`${detailsUrl}?videoId=${videoId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': detailsHost
        }
      })
      if (detailsRes.ok) {
        const detailsData = await detailsRes.json()
        titleText = detailsData?.items?.[0]?.title || detailsData?.title || ''
        durationSeconds = Number(detailsData?.items?.[0]?.lengthSeconds || detailsData?.lengthSeconds || 0)
        if (!Number.isFinite(durationSeconds) || durationSeconds <= 0) {
          durationSeconds = 0
        }
      } else {
        durationSeconds = 0
      }
    }
  } catch (error) {
    durationSeconds = 0
  }

  job.progress = 30

  try {
    let key: string | null = null
    try {
      key = getRapidApiKey()
    } catch {
      key = null
    }
    if (key) {
      const transcriptUrl = process.env.RAPIDAPI_YOUTUBE_TRANSCRIPT_URL || 'https://youtube-transcriptor.p.rapidapi.com/transcript'
      const transcriptHost = process.env.RAPIDAPI_YOUTUBE_TRANSCRIPT_HOST || 'youtube-transcriptor.p.rapidapi.com'
      const transcriptRes = await fetch(`${transcriptUrl}?video_id=${videoId}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': key,
          'x-rapidapi-host': transcriptHost
        }
      })
      if (transcriptRes.ok) {
        const transcriptData = await transcriptRes.json()
        transcriptText = parseTranscriptText(transcriptData)
      } else {
        transcriptText = ''
      }
    }
  } catch {
    transcriptText = ''
  }

  job.progress = 60

  let highlights: any[] = []
  try {
    const prompt = `Pilih 3 highlight dari video YouTube berikut.
Judul: ${titleText || 'Tidak diketahui'}
Durasi video (detik): ${durationSeconds || 'Tidak diketahui'}
Syarat:
- 3 highlight berbeda
- Durasi minimal 30 detik
- Beri penjelasan isi tiap highlight

Transkrip:
${(transcriptText || '').slice(0, 8000)}

Output harus JSON array tanpa markdown:
[
  {
    "title": "Judul highlight",
    "type": "Hook/Insight/Story",
    "start_seconds": 120,
    "end_seconds": 155,
    "summary": "Ringkasan isi highlight"
  }
]`

    const raw = await generateOpenRouterText(prompt, modelName)
    const cleaned = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)
    if (Array.isArray(parsed)) {
      highlights = parsed
    }
  } catch {
    highlights = []
  }

  const minDuration = 30
  const maxSeconds = durationSeconds > 0 ? durationSeconds : 100000
  const normalized = Array.from({ length: 3 }).map((_, index) => {
    const item = highlights[index] || {}
    let startSeconds = Number(item.start_seconds ?? item.start ?? item.startTime ?? 0)
    if (Number.isNaN(startSeconds) || startSeconds <= 0) {
      startSeconds = index * 60
    }
    let endSeconds = Number(item.end_seconds ?? item.end ?? 0)
    if (Number.isNaN(endSeconds) || endSeconds <= startSeconds) {
      endSeconds = startSeconds + minDuration
    }
    if (endSeconds - startSeconds < minDuration) {
      endSeconds = startSeconds + minDuration
    }
    if (durationSeconds > 0) {
      if (startSeconds + minDuration > durationSeconds) {
        startSeconds = Math.max(0, durationSeconds - minDuration)
        endSeconds = durationSeconds
      }
      endSeconds = clamp(endSeconds, startSeconds + minDuration, maxSeconds)
    }
    const durationText = `${Math.max(minDuration, Math.floor(endSeconds - startSeconds))}s`
    return {
      id: `clip_${index + 1}`,
      title: item.title || `Highlight ${index + 1}`,
      type: item.type || 'Highlight',
      summary: item.summary || 'Ringkasan highlight dari video.',
      startTime: formatTime(startSeconds),
      duration: durationText,
      startSeconds,
      endSeconds,
      previewUrl: buildYouTubePreviewUrl(videoId, startSeconds, endSeconds),
      fullUrl: `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(startSeconds)}s`,
      score: 90 - index * 3,
      source: 'youtube' as const
    }
  })

  job.status = 'completed'
  job.progress = 100
  job.result = { durationSeconds, clips: normalized }
}

// Helper to simulate long-running process
function simulateVideoProcessing(jobId: string) {
  const job = videoJobs[jobId];
  if (!job) return;

  // Step 1: Queued -> Processing (after 2s)
  setTimeout(() => {
    job.status = 'processing';
    job.progress = 10;
  }, 2000);

  // Step 2: Processing updates (Simulate AI Vision + Audio Analysis)
  setTimeout(() => { job.progress = 30; }, 4000); // Downloading
  setTimeout(() => { job.progress = 50; }, 7000); // Auto-Reframing
  setTimeout(() => { job.progress = 75; }, 10000); // Highlight Detection
  setTimeout(() => { job.progress = 90; }, 13000); // Adding Subtitles

  // Step 3: Complete (after ~15s)
  setTimeout(() => {
    job.status = 'completed';
    job.progress = 100;
    job.result = {
      durationSeconds: 900,
      clips: [
        {
            id: 'clip_1',
            title: 'Opening Hook yang Mematikan',
            type: 'Viral Intro',
            startTime: '00:00',
            duration: '30s',
            summary: 'Bagian pembuka yang paling kuat untuk menarik perhatian.',
            previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            fullUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            score: 98,
            source: 'file'
        },
        {
            id: 'clip_2',
            title: 'Momen Paling Banyak Diulang',
            type: 'Best Action',
            startTime: '04:20',
            duration: '30s',
            summary: 'Bagian aksi dengan momentum paling tinggi.',
            previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            fullUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            score: 95,
            source: 'file'
        },
        {
            id: 'clip_3',
            title: 'Ending Plot Twist',
            type: 'Plot Twist',
            startTime: '10:45',
            duration: '30s',
            summary: 'Bagian penutup dengan twist paling menarik.',
            previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            fullUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            score: 92,
            source: 'file'
        }
      ]
    };
  }, 15000);
}

// --- Auto Subtitle System Simulation ---

const subtitleJobs: Record<string, {
  id: string,
  status: 'queued' | 'processing' | 'completed' | 'failed',
  progress: number,
  result?: { 
    videoUrl: string;
    srtUrl: string;
    hasWatermark: boolean;
  },
  error?: string
}> = {};

/**
 * 25. AI Auto Subtitle - Start Job
 * Cost: 1 Token (Media Processing)
 */
router.post('/auto-subtitle/start', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { videoUrl, file, removeWatermark = false } = req.body; 
  
  // In a real implementation, we would handle file upload via multer here.
  // const videoPath = req.file.path;

  const jobId = `sub_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  subtitleJobs[jobId] = {
    id: jobId,
    status: 'queued',
    progress: 0
  };

  // Simulate Background Processing
  simulateSubtitleProcessing(jobId, removeWatermark);

  await deductToken((req as AuthRequest).user!.id)
  res.status(200).json({ success: true, jobId, message: 'Subtitle generation started' });
});

router.get('/auto-subtitle/status/:jobId', (req: Request, res: Response): void => {
  const { jobId } = req.params;
  const job = subtitleJobs[jobId];

  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found' });
    return;
  }

  res.status(200).json({ success: true, data: job });
});


function simulateSubtitleProcessing(jobId: string, removeWatermark: boolean) {
  const job = subtitleJobs[jobId];
  if (!job) return;

  // Simulation Steps
  setTimeout(() => {
    job.status = 'processing';
    job.progress = 10; // Uploading
  }, 1000);

  setTimeout(() => { job.progress = 30; }, 3000); // Extracting Audio
  setTimeout(() => { job.progress = 60; }, 6000); // Running Whisper AI (Transcribing...)
  setTimeout(() => { job.progress = 80; }, 9000); // Burning Subtitles (FFmpeg)...
  
  if (!removeWatermark) {
     setTimeout(() => { job.progress = 90; }, 10000); // Applying Watermark...
  }

  setTimeout(() => {
    job.status = 'completed';
    job.progress = 100;
    job.result = {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', // Sample video
      srtUrl: '/sample.srt',
      hasWatermark: !removeWatermark
    };
  }, 12000);
}

/**
 * RapidAPI Proxy
 * Authenticated but free (pre-check)
 */
router.get('/rapidapi/youtube/details', async (req: Request, res: Response): Promise<void> => {
  const { videoId } = req.query;

  if (!videoId) {
    res.status(400).json({ success: false, error: 'Video ID is required' });
    return;
  }

  try {
    const key = getRapidApiKey()
    const detailsUrl = process.env.RAPIDAPI_YOUTUBE_DETAILS_URL || 'https://youtube-media-downloader.p.rapidapi.com/v2/video/details'
    const detailsHost = process.env.RAPIDAPI_YOUTUBE_DETAILS_HOST || 'youtube-media-downloader.p.rapidapi.com'
    const response = await fetch(`${detailsUrl}?videoId=${videoId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': key,
        'x-rapidapi-host': detailsHost
      }
    });

    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('RapidAPI Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch from RapidAPI' });
  }
});

/**
 * Admin: Add Tokens
 * POST /api/admin/add-tokens
 */
router.post('/admin/add-tokens', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  const { userId, amount } = req.body;

  // Check if requester is admin
  if (req.user?.id !== 'admin_user') {
      res.status(403).json({ success: false, error: 'Unauthorized: Admin access required' });
      return;
  }

  if (!userId || !amount) {
      res.status(400).json({ success: false, error: 'User ID and Amount are required' });
      return;
  }

  const supabaseClient = getSupabaseServerClient();

  // Bypass Supabase if placeholder
  const isPlaceholderSupabase = process.env.SUPABASE_URL?.includes('placeholder') || false;
  if (isPlaceholderSupabase) {
      res.status(200).json({ success: true, message: `Added ${amount} tokens to ${userId} (Simulated - No Database)` });
      return;
  }

  try {
      // Use the Stored Procedure (RPC) we created to handle everything atomically
      // Function: admin_topup_with_bonus(p_user_id, p_amount)
      const { data, error } = await supabaseClient.rpc('admin_topup_with_bonus', {
          p_user_id: userId,
          p_amount: Number(amount)
      });

      if (error) {
          throw error;
      }

      // Check the result from the SQL function
      // It returns { success: boolean, message: string, bonus_given: int }
      if (!data.success) {
          res.status(404).json({ success: false, error: data.message });
          return;
      }

      res.status(200).json({ 
          success: true, 
          message: data.message, 
          details: {
              added: amount,
              bonus_to_referrer: data.bonus_given,
              referrer_id: data.referrer
          }
      });

  } catch (err: any) {
      console.error('Add tokens error:', err);
      res.status(500).json({ success: false, error: err.message });
  }
});

export default router