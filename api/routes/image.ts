// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { ensureBalance, deductToken } from '../middleware/balance.js'

const router = Router()

const RUNPOD_API_KEY = process.env.RUNPOD_API_KEY || ''
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || 'seedream-v4-edit'
const RUNPOD_BASE = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`

const runpodHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${RUNPOD_API_KEY}`,
})

/**
 * POST /api/image/upload
 * Upload gambar lokal ke Supabase Storage, return URL publik
 * Fallback: return base64 data URL jika Supabase tidak tersedia
 */
router.post('/upload', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { base64, filename = 'image.jpg', contentType = 'image/jpeg' } = req.body

  if (!base64) {
    res.status(400).json({ success: false, error: 'base64 image data diperlukan' })
    return
  }

  const supabaseUrl = process.env.SUPABASE_URL || ''
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''

  // Jika Supabase tidak dikonfigurasi, return base64 langsung
  // RunPod juga support base64 image input
  if (!supabaseUrl || supabaseUrl.includes('placeholder') || !serviceKey) {
    res.status(200).json({ success: true, url: base64, type: 'base64' })
    return
  }

  try {
    // Decode base64 → Buffer
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')

    const userId = (req as AuthRequest).user?.id || 'anonymous'
    const ext = contentType.split('/')[1] || 'jpg'
    const path = `uploads/${userId}/${Date.now()}.${ext}`

    const uploadUrl = `${supabaseUrl}/storage/v1/object/ai-images/${path}`
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
      signal: AbortSignal.timeout(10000), // 10s timeout
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.text()
      throw new Error(`Upload gagal: ${err}`)
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/ai-images/${path}`
    res.status(200).json({ success: true, url: publicUrl, type: 'supabase' })
  } catch (error: any) {
    console.error('Image Upload Error:', error.message)

    // Fallback: jika Supabase tidak bisa diakses (DNS/network error), return base64
    if (
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNREFUSED' ||
      error.name === 'TimeoutError' ||
      error.message?.includes('fetch failed') ||
      error.cause?.code === 'ENOTFOUND' ||
      error.cause?.code === 'ECONNREFUSED'
    ) {
      console.warn('[Upload] Supabase unreachable, falling back to base64')
      res.status(200).json({ success: true, url: base64, type: 'base64' })
      return
    }

    res.status(500).json({ success: false, error: error.message || 'Gagal upload gambar' })
  }
})

/**
 * POST /api/image/generate
 * Submit job ke RunPod seedream-v4-edit
 * Cost: 3 Token
 */
router.post('/generate', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const { prompt, size = '1024*1024', images = [], enable_safety_checker = true } = req.body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    res.status(400).json({ success: false, error: 'Prompt minimal 3 karakter' })
    return
  }

  if (!RUNPOD_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const payload: Record<string, any> = {
      input: {
        prompt: prompt.trim(),
        size,
        enable_safety_checker,
      }
    }

    // seedream-v4-edit WAJIB ada images array
    if (Array.isArray(images) && images.length > 0) {
      // Filter: bisa URL publik ATAU base64 data URL
      const validImages = images.filter(img =>
        typeof img === 'string' && (img.startsWith('http') || img.startsWith('data:image'))
      )
      if (validImages.length === 0) {
        res.status(400).json({ success: false, error: 'Gambar tidak valid. Gunakan URL publik atau upload ulang.' })
        return
      }
      payload.input.images = validImages
    } else {
      res.status(400).json({
        success: false,
        error: 'Model Seedream v4 Edit membutuhkan minimal 1 gambar referensi.'
      })
      return
    }

    const response = await fetch(`${RUNPOD_BASE}/run`, {
      method: 'POST',
      headers: runpodHeaders(),
      body: JSON.stringify(payload),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || data?.message || `RunPod error: ${response.status}`)
    }

    const jobId = data?.id
    if (!jobId) {
      throw new Error('RunPod tidak mengembalikan job ID')
    }

    // Deduct token setelah job berhasil di-submit
    const userId = (req as AuthRequest).user?.id
    if (userId) {
      await deductToken(userId, 3)
    }

    res.status(200).json({
      success: true,
      jobId,
      status: data?.status || 'IN_QUEUE',
    })
  } catch (error: any) {
    console.error('RunPod Generate Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Gagal mengirim job ke RunPod' })
  }
})

/**
 * GET /api/image/status/:jobId
 * Cek status job RunPod
 */
router.get('/status/:jobId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params

  if (!jobId) {
    res.status(400).json({ success: false, error: 'Job ID diperlukan' })
    return
  }

  if (!RUNPOD_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const response = await fetch(`${RUNPOD_BASE}/status/${jobId}`, {
      method: 'GET',
      headers: runpodHeaders(),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || `RunPod status error: ${response.status}`)
    }

    const status = data?.status || 'UNKNOWN'
    const output = data?.output

    // Ekstrak URL gambar dari output
    let imageUrl: string | null = null
    if (output) {
      if (typeof output === 'string' && output.startsWith('http')) {
        imageUrl = output
      } else if (Array.isArray(output) && output.length > 0) {
        imageUrl = typeof output[0] === 'string' ? output[0] : output[0]?.url || output[0]?.image || null
      } else if (typeof output === 'object') {
        // Cek semua kemungkinan field output RunPod
        imageUrl = output?.result || output?.url || output?.image || output?.images?.[0] || output?.output || null
        // Jika masih null, cari field yang berisi URL
        if (!imageUrl) {
          for (const val of Object.values(output)) {
            if (typeof val === 'string' && val.startsWith('http')) {
              imageUrl = val
              break
            }
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      status,
      imageUrl,
      raw: data,
    })
  } catch (error: any) {
    console.error('RunPod Status Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Gagal mengecek status job' })
  }
})

/**
 * POST /api/image/upload-url
 * Dapatkan URL upload untuk gambar referensi ke RunPod storage
 */
router.post('/upload-url', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { filename, contentType = 'image/jpeg' } = req.body

  if (!RUNPOD_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const response = await fetch('https://api.runpod.ai/v2/upload', {
      method: 'POST',
      headers: runpodHeaders(),
      body: JSON.stringify({ filename, contentType }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || 'Gagal mendapatkan upload URL')
    }

    res.status(200).json({ success: true, data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
