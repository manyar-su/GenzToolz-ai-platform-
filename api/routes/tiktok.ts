// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { ensureBalance, deductToken } from '../middleware/balance.js'

const router = Router()

// tikwm.com — free public API, no key needed
const TIKWM_API = 'https://www.tikwm.com/api/'

/**
 * POST /api/tiktok/info
 * Ambil info video/foto/musik dari link TikTok
 */
router.post('/info', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { url } = req.body

  if (!url || typeof url !== 'string') {
    res.status(400).json({ success: false, error: 'URL TikTok diperlukan' })
    return
  }

  // Validasi URL TikTok
  const isTikTok = url.includes('tiktok.com') || url.includes('vt.tiktok.com') || url.includes('vm.tiktok.com')
  if (!isTikTok) {
    res.status(400).json({ success: false, error: 'URL harus dari TikTok (tiktok.com)' })
    return
  }

  try {
    const formData = new URLSearchParams()
    formData.append('url', url)
    formData.append('hd', '1')

    const response = await fetch(TIKWM_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.code !== 0 || !data.data) {
      throw new Error(data.msg || 'Gagal mengambil data video')
    }

    const d = data.data

    // Tentukan tipe konten
    const isPhoto = d.images && Array.isArray(d.images) && d.images.length > 0
    const isVideo = !isPhoto && (d.play || d.hdplay)

    const result: Record<string, any> = {
      id: d.id,
      title: d.title || 'TikTok Video',
      author: {
        name: d.author?.nickname || d.author?.unique_id || 'Unknown',
        username: d.author?.unique_id || '',
        avatar: d.author?.avatar || '',
      },
      cover: d.cover || d.origin_cover || '',
      duration: d.duration || 0,
      type: isPhoto ? 'photo' : 'video',
      stats: {
        plays: d.play_count || 0,
        likes: d.digg_count || 0,
        comments: d.comment_count || 0,
        shares: d.share_count || 0,
      },
    }

    if (isVideo) {
      result.downloads = {
        video_hd: d.hdplay || d.play || '',
        video_sd: d.play || '',
        music: d.music || d.music_info?.play || '',
        music_title: d.music_info?.title || 'Music',
        music_author: d.music_info?.author || '',
        music_cover: d.music_info?.cover || '',
      }
    }

    if (isPhoto) {
      result.downloads = {
        photos: d.images || [],
        music: d.music || d.music_info?.play || '',
        music_title: d.music_info?.title || 'Music',
        music_author: d.music_info?.author || '',
        music_cover: d.music_info?.cover || '',
      }
    }

    // Token dipotong saat user download, bukan saat search
    res.status(200).json({ success: true, data: result })
  } catch (error: any) {
    console.error('TikTok Downloader Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Gagal mengambil data dari TikTok' })
  }
})

/**
 * POST /api/tiktok/deduct
 * Potong 1 token saat user berhasil download
 */
router.post('/deduct', requireAuth, ensureBalance, async (req: Request, res: Response): Promise<void> => {
  const userId = (req as AuthRequest).user?.id
  if (!userId) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }
  try {
    await deductToken(userId, 1)
    res.status(200).json({ success: true })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Gagal memotong token' })
  }
})

/**
 * GET /api/tiktok/proxy
 * Proxy download file (bypass CORS)
 */
router.get('/proxy', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const fileUrl = req.query.url as string
  const filename = (req.query.filename as string) || 'download'

  if (!fileUrl) {
    res.status(400).json({ success: false, error: 'URL diperlukan' })
    return
  }

  try {
    const response = await fetch(fileUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Referer: 'https://www.tiktok.com/',
      },
    })

    if (!response.ok) {
      throw new Error(`Fetch error: ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const buffer = await response.arrayBuffer()

    res.setHeader('Content-Type', contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.setHeader('Content-Length', buffer.byteLength)
    res.send(Buffer.from(buffer))
  } catch (error: any) {
    console.error('Proxy Error:', error)
    res.status(500).json({ success: false, error: 'Gagal mengunduh file' })
  }
})

export default router
