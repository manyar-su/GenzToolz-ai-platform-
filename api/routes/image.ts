// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { ensureBalance, deductToken } from '../middleware/balance.js'

const router = Router()

const RUNPOD_IMAGE_API_KEY = process.env.RUNPOD_IMAGE_API_KEY || process.env.RUNPOD_API_KEY || ''
const RUNPOD_VIDEO_API_KEY = process.env.RUNPOD_VIDEO_API_KEY || process.env.RUNPOD_API_KEY || ''
const RUNPOD_ENDPOINT_ID = process.env.RUNPOD_ENDPOINT_ID || 'seedream-v4-edit'
const RUNPOD_BASE = `https://api.runpod.ai/v2/${RUNPOD_ENDPOINT_ID}`

const runpodImageHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${RUNPOD_IMAGE_API_KEY}`,
})

const runpodVideoHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${RUNPOD_VIDEO_API_KEY}`,
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

  if (!RUNPOD_IMAGE_API_KEY) {
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
      headers: runpodImageHeaders(),
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

  if (!RUNPOD_IMAGE_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const response = await fetch(`${RUNPOD_BASE}/status/${jobId}`, {
      method: 'GET',
      headers: runpodImageHeaders(),
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

  if (!RUNPOD_IMAGE_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const response = await fetch('https://api.runpod.ai/v2/upload', {
      method: 'POST',
      headers: runpodImageHeaders(),
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

/**
 * POST /api/image/nano-banana/generate
 * Submit job ke RunPod google-nano-banana-2-edit — GRATIS, tanpa deduct token
 */
router.post('/nano-banana/generate', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { prompt, resolution = '1k', output_format = 'png', enable_safety_checker = true, image } = req.body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    res.status(400).json({ success: false, error: 'Prompt minimal 3 karakter' })
    return
  }

  if (!RUNPOD_IMAGE_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const input: Record<string, any> = {
      prompt: prompt.trim(),
      resolution,
      output_format,
      enable_safety_checker,
    }

    // Tambahkan gambar referensi jika ada
    if (image && typeof image === 'string' && (image.startsWith('http') || image.startsWith('data:image'))) {
      input.image = image
    }

    const response = await fetch('https://api.runpod.ai/v2/google-nano-banana-2-edit/run', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNPOD_IMAGE_API_KEY}`,
      },
      body: JSON.stringify({ input }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data?.error || data?.message || `RunPod error: ${response.status}`)
    }

    const jobId = data?.id
    if (!jobId) throw new Error('RunPod tidak mengembalikan job ID')

    // Deduct 3 token setelah berhasil submit
    const userId = (req as AuthRequest).user?.id
    if (userId) {
      await deductToken(userId, 3)
    }
    res.status(200).json({ success: true, jobId, status: data?.status || 'IN_QUEUE' })
  } catch (error: any) {
    console.error('Nano Banana Generate Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Gagal mengirim job' })
  }
})

/**
 * GET /api/image/nano-banana/status/:jobId
 * Cek status job Nano Banana
 */
router.get('/nano-banana/status/:jobId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params

  if (!RUNPOD_IMAGE_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const response = await fetch(`https://api.runpod.ai/v2/google-nano-banana-2-edit/status/${jobId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RUNPOD_IMAGE_API_KEY}`,
      },
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || `Status error: ${response.status}`)

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
        imageUrl = output?.result || output?.url || output?.image || output?.images?.[0] || null
        if (!imageUrl) {
          for (const val of Object.values(output)) {
            if (typeof val === 'string' && val.startsWith('http')) { imageUrl = val; break; }
          }
        }
      }
    }

    res.status(200).json({ success: true, status, imageUrl, raw: data })
  } catch (error: any) {
    console.error('Nano Banana Status Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Gagal cek status' })
  }
})

/**
 * POST /api/image/wan-i2v/generate
 * Image to Video dengan WAN 2.1 — GRATIS tanpa token
 */
router.post('/wan-i2v/generate', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const {
    prompt, image, negative_prompt = '', size = '1280*720',
    duration = 5, num_inference_steps = 30, guidance = 5,
    flow_shift = 5, seed = -1, enable_prompt_optimization = false,
    enable_safety_checker = true
  } = req.body

  if (!prompt || typeof prompt !== 'string' || prompt.trim().length < 3) {
    res.status(400).json({ success: false, error: 'Prompt minimal 3 karakter' })
    return
  }
  if (!image) {
    res.status(400).json({ success: false, error: 'Image diperlukan' })
    return
  }
  if (!RUNPOD_VIDEO_API_KEY) {
    res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' })
    return
  }

  try {
    const response = await fetch('https://api.runpod.ai/v2/wan-2-1-i2v-720/run', {
      method: 'POST',
      headers: runpodVideoHeaders(),
      body: JSON.stringify({
        input: {
          prompt: prompt.trim(), image, negative_prompt, size,
          duration, num_inference_steps, guidance, flow_shift,
          seed, enable_prompt_optimization, enable_safety_checker
        }
      }),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || `RunPod error: ${response.status}`)
    const jobId = data?.id
    if (!jobId) throw new Error('RunPod tidak mengembalikan job ID')
    // Deduct 3 token setelah berhasil submit
    const userId = (req as AuthRequest).user?.id
    if (userId) {
      await deductToken(userId, 3)
    }
    res.status(200).json({ success: true, jobId, status: data?.status || 'IN_QUEUE' })
  } catch (error: any) {
    console.error('WAN I2V Generate Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Gagal mengirim job' })
  }
})

/**
 * GET /api/image/wan-i2v/status/:jobId
 */
router.get('/wan-i2v/status/:jobId', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { jobId } = req.params
  if (!RUNPOD_VIDEO_API_KEY) { res.status(500).json({ success: false, error: 'RunPod API key tidak dikonfigurasi' }); return }
  try {
    const response = await fetch(`https://api.runpod.ai/v2/wan-2-1-i2v-720/status/${jobId}`, {
      headers: runpodVideoHeaders(),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data?.error || `Status error: ${response.status}`)
    const status = data?.status || 'UNKNOWN'
    const output = data?.output
    let videoUrl: string | null = null
    if (output) {
      if (typeof output === 'string' && (output.startsWith('http') || output.startsWith('data:'))) videoUrl = output
      else if (Array.isArray(output) && output.length > 0) videoUrl = typeof output[0] === 'string' ? output[0] : output[0]?.url || null
      else if (typeof output === 'object') {
        videoUrl = output?.video || output?.result || output?.url || output?.video_url || null
        if (!videoUrl) for (const val of Object.values(output)) { if (typeof val === 'string' && val.startsWith('http')) { videoUrl = val; break; } }
      }
    }
    res.status(200).json({ success: true, status, videoUrl, raw: data })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Gagal cek status' })
  }
})

export default router
