import { Router, type Request, type Response } from 'express'
import { model } from '../lib/gemini.js'
import { requireAuth, type AuthRequest } from '../middleware/auth.js'
import { checkBalance } from '../middleware/balance.js'

const router = Router()

/**
 * 1. The Script Architect
 * Generate video script with copywriting formulas (AIDA/PAS)
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/script-architect', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { topic, formula = 'AIDA', duration = '1 minute', platform = 'TikTok' } = req.body

  if (!topic) {
    res.status(400).json({ success: false, error: 'Topic is required' })
    return
  }

  try {
    const prompt = `Act as a professional copywriter. Create a concise viral video script in Bahasa Indonesia for ${platform} about "${topic}".
    Duration: ${duration}.
    Use the ${formula} (Attention, Interest, Desire, Action) copywriting formula.
    Include visual cues in brackets [Visual: ...] and suggested background music mood.
    Make the hook extremely catchy in the first 3 seconds. Keep the script under 300 words. Output language: Bahasa Indonesia.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Script Architect Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate script' })
  }
})

/**
 * 2. Trend Analyzer
 * Analyze trending topics
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/trend-analyzer', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { niche, platform = 'TikTok' } = req.body

  if (!niche) {
    res.status(400).json({ success: false, error: 'Niche is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Trend Analyzer Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze trends' })
  }
})

/**
 * 5. Caption & Hashtag Generator
 * Cost: 0.2 Token (Utility)
 */
router.post('/caption-generator', requireAuth, checkBalance(0.2), async (req: Request, res: Response): Promise<void> => {
  const { content_description, tone = 'Casual' } = req.body

  if (!content_description) {
    res.status(400).json({ success: false, error: 'Content description is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Caption Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate captions' })
  }
})

/**
 * 6. Video-to-Short Script
 * Summarize long text/points into short script
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/video-to-short', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { text_content } = req.body

  if (!text_content) {
    res.status(400).json({ success: false, error: 'Text content is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Video-to-Short Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to repurpose content' })
  }
})

/**
 * 7. Viral Hook Generator
 * Cost: 0.2 Token (Utility)
 */
router.post('/viral-hook-generator', requireAuth, checkBalance(0.2), async (req: Request, res: Response): Promise<void> => {
  const { topic, audience = 'General' } = req.body

  if (!topic) {
    res.status(400).json({ success: false, error: 'Topic is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Viral Hook Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate hooks' })
  }
})

/**
 * 8. YouTube SEO Optimizer
 * Cost: 0.2 Token (Utility)
 */
router.post('/youtube-seo', requireAuth, checkBalance(0.2), async (req: Request, res: Response): Promise<void> => {
  const { title, description } = req.body

  if (!title) {
    res.status(400).json({ success: false, error: 'Title is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('YouTube SEO Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to optimize SEO' })
  }
})

/**
 * 9. Comment Reply Automation
 * Cost: 0.2 Token (Utility)
 */
router.post('/comment-reply', requireAuth, checkBalance(0.2), async (req: Request, res: Response): Promise<void> => {
  const { comment, tone = 'Friendly' } = req.body

  if (!comment) {
    res.status(400).json({ success: false, error: 'Comment is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Comment Reply Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate replies' })
  }
})

/**
 * 10. AI Color Palette Designer
 * Cost: 1 Token (Visual)
 */
router.post('/color-palette', requireAuth, checkBalance(1), async (req: Request, res: Response): Promise<void> => {
  const { vibe } = req.body

  if (!vibe) {
    res.status(400).json({ success: false, error: 'Vibe description is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Color Palette Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate palette' })
  }
})

/**
 * 11. Scheduler Suggestion
 * Cost: 0.5 Token (Analyzer)
 */
router.post('/scheduler-suggestion', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { platform, audience_type } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Scheduler Suggestion Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to suggest schedule' })
  }
})

/**
 * 12. Podcast-to-Shorts Converter
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/podcast-to-shorts', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { transcript } = req.body

  if (!transcript) {
    res.status(400).json({ success: false, error: 'Transcript is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Podcast-to-Shorts Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to convert podcast' })
  }
})

/**
 * 13. Competitor Content Analyzer
 * Cost: 0.5 Token (Analyzer)
 */
router.post('/competitor-analyzer', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { competitor_url } = req.body

  if (!competitor_url) {
    res.status(400).json({ success: false, error: 'Competitor URL is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Competitor Analyzer Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to analyze competitor' })
  }
})

/**
 * 14. Automated Video Subtitle (Mock - Text Generation)
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/subtitle-generator', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { text_content, style = 'Pop-up' } = req.body

  if (!text_content) {
    res.status(400).json({ success: false, error: 'Text content is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Subtitle Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate subtitles' })
  }
})

/**
 * 15. Brand Deal Pitch Generator
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/brand-pitch', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { brand_name, niche, follower_count } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Brand Pitch Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate pitch' })
  }
})

/**
 * 16. Affiliate Product Hunter
 * Cost: 0.5 Token (Analyzer)
 */
router.post('/affiliate-hunter', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { niche } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Affiliate Hunter Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to find products' })
  }
})

/**
 * 17. AI Reply Master (Social Tone)
 * Cost: 0.2 Token (Utility)
 */
router.post('/reply-master', requireAuth, checkBalance(0.2), async (req: Request, res: Response): Promise<void> => {
  const { comment, tone = 'Sarkas' } = req.body

  if (!comment) {
    res.status(400).json({ success: false, error: 'Comment is required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Reply Master Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate replies' })
  }
})

/**
 * 18. Giveaway Picker (Simulation/Rule Checker)
 * Cost: 0.5 Token (Analyzer)
 */
router.post('/giveaway-picker', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { participants, rules } = req.body

  if (!participants || !rules) {
    res.status(400).json({ success: false, error: 'Participants and rules are required' })
    return
  }

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Giveaway Picker Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to pick winner' })
  }
})

/**
 * 19. Community Poll Idea Generator
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/poll-generator', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { niche } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Poll Generator Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to generate polls' })
  }
})

/**
 * 20. Shadowban Checker (Simulation)
 * Cost: 0.5 Token (Analyzer)
 */
router.post('/shadowban-checker', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { username, platform } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Shadowban Checker Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to check status' })
  }
})

/**
 * 21. Profile Bio Optimizer
 * Cost: 0.5 Token (AI Writing)
 */
router.post('/bio-optimizer', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { current_bio, niche } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Bio Optimizer Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to optimize bio' })
  }
})

/**
 * 22. AI Thumbnail A/B Tester (Simulation)
 * Cost: 0.5 Token (Analyzer)
 */
router.post('/thumbnail-tester', requireAuth, checkBalance(0.5), async (req: Request, res: Response): Promise<void> => {
  const { description_a, description_b } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
    console.error('Thumbnail Tester Error:', error)
    res.status(500).json({ success: false, error: error.message || 'Failed to test thumbnails' })
  }
})

/**
 * 23. Color Grading Filter Suggester
 * Cost: 0.2 Token (Utility)
 */
router.post('/color-grading', requireAuth, checkBalance(0.2), async (req: Request, res: Response): Promise<void> => {
  const { mood } = req.body

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

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    res.status(200).json({ success: true, data: text })
  } catch (error: any) {
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
    clips: {
        id: string;
        title: string;
        type: string;
        startTime: string;
        duration: string;
        previewUrl: string;
        fullUrl: string;
        score: number;
    }[]
  },
  error?: string
}> = {};

/**
 * 24. AI Smart Video Clipper - Start Job
 * Cost: 1 Token (Media Processing)
 */
router.post('/smart-clipper/start', requireAuth, checkBalance(1), async (req: Request, res: Response): Promise<void> => {
  const { videoUrl, file } = req.body;

  if (!videoUrl && !file) {
    res.status(400).json({ success: false, error: 'Video URL or file is required' });
    return;
  }

  const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Initialize Job
  videoJobs[jobId] = {
    id: jobId,
    status: 'queued',
    progress: 0
  };

  // Simulate Background Processing
  simulateVideoProcessing(jobId);

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
      clips: [
        {
            id: 'clip_1',
            title: 'Opening Hook yang Mematikan',
            type: 'Viral Intro',
            startTime: '00:00',
            duration: '15s',
            previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            fullUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            score: 98
        },
        {
            id: 'clip_2',
            title: 'Momen Paling Banyak Diulang',
            type: 'Best Action',
            startTime: '04:20',
            duration: '30s',
            previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            fullUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
            score: 95
        },
        {
            id: 'clip_3',
            title: 'Ending Plot Twist',
            type: 'Plot Twist',
            startTime: '10:45',
            duration: '20s',
            previewUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            fullUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            score: 92
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
router.post('/auto-subtitle/start', requireAuth, checkBalance(1), async (req: Request, res: Response): Promise<void> => {
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

  /**
   * TECHNICAL WORKFLOW (Real Code Reference):
   * 
   * import ffmpeg from 'fluent-ffmpeg';
   * import { exec } from 'child_process';
   * 
   * // 1. Transcription using OpenAI Whisper (Local)
   * // Assuming 'whisper' command line tool is installed (pip install -U openai-whisper)
   * const transcribe = (inputPath) => {
   *   return new Promise((resolve, reject) => {
   *     exec(`whisper "${inputPath}" --model base --output_format srt --output_dir ./temp`, (error, stdout, stderr) => {
   *       if (error) reject(error);
   *       else resolve('./temp/video.srt');
   *     });
   *   });
   * };
   * 
   * // 2. Watermark & Subtitle Burn-in using FFmpeg
   * const processVideo = (inputVideo, inputSrt, outputVideo, isFreeUser) => {
   *   let command = ffmpeg(inputVideo)
   *     // Burn subtitles (Hardcode)
   *     // force_style='FontName=Montserrat,FontSize=24,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0'
   *     .videoFilters(`subtitles=${inputSrt}:force_style='Fontname=Montserrat,Fontsize=24,PrimaryColour=&H00FFFF00,OutlineColour=&H00000000,BorderStyle=1,Outline=2'`);
   * 
   *   // Conditional Logic: Watermark for Free Users
   *   if (isFreeUser) {
   *     command.input('./assets/watermark.png')
   *       .complexFilter([
   *         // Overlay watermark top-right
   *         "[0:v][1:v] overlay=W-w-10:10 [watermarked]", 
   *         // Burn subtitles on watermarked video
   *         "[watermarked] subtitles=" + inputSrt + ":force_style='...'" 
   *       ]);
   *   }
   * 
   *   return command.save(outputVideo);
   * };
   */

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
router.get('/rapidapi/youtube/details', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const { videoId } = req.query;

  if (!videoId) {
    res.status(400).json({ success: false, error: 'Video ID is required' });
    return;
  }

  try {
    const response = await fetch(`https://youtube-media-downloader.p.rapidapi.com/v2/video/details?videoId=${videoId}`, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': '528ae111eamsh81c96b58f6837bfp19ddc2jsne0f74137919c',
        'x-rapidapi-host': 'youtube-media-downloader.p.rapidapi.com'
      }
    });

    const data = await response.json();
    res.status(200).json({ success: true, data });
  } catch (error: any) {
    console.error('RapidAPI Error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to fetch from RapidAPI' });
  }
});

export default router
