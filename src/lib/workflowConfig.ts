// ══════════════════════════════════════════════════════════════
// WORKFLOW CONFIGURATION & TOKEN COSTS
// ══════════════════════════════════════════════════════════════

export interface NodeConfig {
  id: string;
  type: 'input' | 'text-gen' | 'image-gen' | 'image-edit' | 'video-gen' | 'audio-gen' | 'processor' | 'output';
  title: string;
  category: string;
  description: string;
  prompt: string;
  output: string;
  tokenCost: number;
  modelName: string;
  position: { x: number; y: number };
  inputs?: string[];
  outputs?: string[];
  config?: Record<string, any>;
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  thumbnail: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  totalTokenCost: number;
  nodes: NodeConfig[];
  edges: Array<{ id: string; source: string; target: string; animated?: boolean }>;
  tags: string[];
}

// ── TOKEN COST UNTUK SETIAP AI MODEL ──
export const TOKEN_COSTS = {
  // Text Generation
  'gemini-flash': 1,
  'gpt-4o-mini': 1,
  'gpt-4o': 2,
  'claude-sonnet': 2,
  
  // Image Generation
  'nano-banana-2': 0, // Free
  'seedream-v4': 3,
  'flux-pro': 5,
  'midjourney-v6': 6,
  'stable-diffusion-xl': 2,
  
  // Image Editing
  'nano-banana-edit': 0, // Free
  'image-inpaint': 2,
  'object-removal': 2,
  'upscale-4x': 3,
  
  // Video Generation
  'wan-2.1-i2v': 0, // Free
  'runway-gen3': 8,
  'pika-labs': 6,
  'stable-video': 5,
  
  // Audio/Voice
  'elevenlabs-tts': 1,
  'google-tts': 1,
  'openai-tts': 2,
  'music-gen': 3,
  
  // Processing
  'video-merge': 1,
  'audio-merge': 1,
  'subtitle-gen': 1,
} as const;

// ── WORKFLOW TEMPLATES ──
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'ugc-ai-influencer',
    name: 'UGC AI Influencer',
    description: 'Generate complete UGC video dengan AI influencer holding product, voiceover, dan subtitle',
    category: 'marketing',
    thumbnail: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80',
    difficulty: 'advanced',
    estimatedTime: '120-180 detik',
    totalTokenCost: 14,
    tags: ['UGC', 'Influencer', 'Product', 'Commercial'],
    nodes: [
      {
        id: 'n1',
        type: 'input',
        title: 'Reference Image',
        category: 'Asset Input',
        description: 'Upload atau generate karakter influencer',
        prompt: 'Input referensi karakter influencer: wanita Indonesia gen-z, clean makeup, urban casual. Target framing 9:16, photo studio, commercial look.',
        output: 'Reference image karakter',
        tokenCost: 0,
        modelName: 'manual-input',
        position: { x: 40, y: 40 },
        outputs: ['image'],
      },
      {
        id: 'n2',
        type: 'text-gen',
        title: 'Prompt Generator',
        category: 'AI Text',
        description: 'Generate prompt untuk 4 pose berbeda',
        prompt: 'Generate 4 pose wanita influencer Indonesia. Pose wajib: hero shot, close-up smile, hold pose, call-to-action pose.',
        output: '4 prompt pose siap render',
        tokenCost: TOKEN_COSTS['gemini-flash'],
        modelName: 'gemini-flash',
        position: { x: 40, y: 240 },
        outputs: ['text'],
      },
      {
        id: 'n3',
        type: 'image-gen',
        title: 'Character Generator',
        category: 'AI Image',
        description: 'Generate 4 variasi pose influencer',
        prompt: 'Text-to-image commercial portrait, 4 variasi pose, white seamless background, detail wajah tajam, skin texture natural.',
        output: '4 image influencer (PNG)',
        tokenCost: TOKEN_COSTS['seedream-v4'],
        modelName: 'seedream-v4',
        position: { x: 390, y: 40 },
        inputs: ['n1', 'n2'],
        outputs: ['images'],
      },
      {
        id: 'n4',
        type: 'image-edit',
        title: 'Product Placement',
        category: 'AI Edit',
        description: 'Inpaint produk di tangan influencer',
        prompt: 'Ubah objek tangan jadi memegang [PRODUCT_NAME] brand [BRAND_NAME]. Label produk terbaca jelas, tetap natural dan realistic.',
        output: 'Image influencer + produk final',
        tokenCost: TOKEN_COSTS['image-inpaint'],
        modelName: 'image-inpaint',
        position: { x: 390, y: 280 },
        inputs: ['n3'],
        outputs: ['image'],
      },
      {
        id: 'n5',
        type: 'video-gen',
        title: 'Image to Video',
        category: 'AI Video',
        description: 'Animate still image menjadi video',
        prompt: 'Animate 9:16 video [DURATION] detik. Influencer angkat produk, senyum, lalu tunjuk produk. Motion cinematic smooth.',
        output: 'Video utama [DURATION] detik',
        tokenCost: TOKEN_COSTS['wan-2.1-i2v'],
        modelName: 'wan-2.1-i2v',
        position: { x: 740, y: 160 },
        inputs: ['n4'],
        outputs: ['video'],
      },
      {
        id: 'n6',
        type: 'audio-gen',
        title: 'Voiceover TTS',
        category: 'AI Audio',
        description: 'Generate narasi voiceover',
        prompt: 'Narasi Indonesia tentang [BRAND_NAME]: keunggulan rasa, momen minum, ajakan beli. Durasi [DURATION] detik, tone energik.',
        output: 'Audio voiceover WAV/MP3',
        tokenCost: TOKEN_COSTS['google-tts'],
        modelName: 'google-tts',
        position: { x: 1090, y: 40 },
        inputs: ['n5'],
        outputs: ['audio'],
      },
      {
        id: 'n7',
        type: 'processor',
        title: 'Subtitle Generator',
        category: 'Processing',
        description: 'Auto-generate subtitle dari audio',
        prompt: 'Generate subtitle gaya Gen-Z dengan emoji popup. Sinkron dengan audio voiceover.',
        output: 'Subtitle SRT file',
        tokenCost: TOKEN_COSTS['subtitle-gen'],
        modelName: 'subtitle-gen',
        position: { x: 1090, y: 220 },
        inputs: ['n6'],
        outputs: ['subtitle'],
      },
      {
        id: 'n8',
        type: 'output',
        title: 'Final Render',
        category: 'Video Output',
        description: 'Merge video + audio + subtitle',
        prompt: 'Merge video + voiceover + subtitle. Output MP4 1080x1920, 30fps, audio jernih, siap upload Reels/TikTok.',
        output: 'Final video MP4 siap publish',
        tokenCost: TOKEN_COSTS['video-merge'],
        modelName: 'video-merge',
        position: { x: 1440, y: 140 },
        inputs: ['n5', 'n6', 'n7'],
        outputs: ['video'],
      },
    ],
    edges: [
      { id: 'e-n1-n3', source: 'n1', target: 'n3', animated: true },
      { id: 'e-n2-n3', source: 'n2', target: 'n3', animated: true },
      { id: 'e-n3-n4', source: 'n3', target: 'n4', animated: true },
      { id: 'e-n4-n5', source: 'n4', target: 'n5', animated: true },
      { id: 'e-n5-n6', source: 'n5', target: 'n6', animated: true },
      { id: 'e-n6-n7', source: 'n6', target: 'n7', animated: true },
      { id: 'e-n5-n8', source: 'n5', target: 'n8', animated: true },
      { id: 'e-n6-n8', source: 'n6', target: 'n8', animated: true },
      { id: 'e-n7-n8', source: 'n7', target: 'n8', animated: true },
    ],
  },
  
  {
    id: 'food-commercial',
    name: 'Food & Beverage Commercial',
    description: 'Buat video iklan makanan/minuman dengan shot cinematic dan voiceover appetizing',
    category: 'marketing',
    thumbnail: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',
    difficulty: 'intermediate',
    estimatedTime: '90-120 detik',
    totalTokenCost: 10,
    tags: ['Food', 'Commercial', 'Product', 'F&B'],
    nodes: [
      {
        id: 'f1',
        type: 'text-gen',
        title: 'Shot List Generator',
        category: 'AI Text',
        description: 'Generate daftar shot untuk food photography',
        prompt: 'Generate 5 shot angles untuk food/beverage: hero shot, close-up texture, pouring motion, overhead flat-lay, lifestyle context.',
        output: '5 shot descriptions',
        tokenCost: TOKEN_COSTS['gemini-flash'],
        modelName: 'gemini-flash',
        position: { x: 40, y: 40 },
        outputs: ['text'],
      },
      {
        id: 'f2',
        type: 'image-gen',
        title: 'Product Photography',
        category: 'AI Image',
        description: 'Generate foto produk makanan/minuman',
        prompt: 'Professional food photography, [PRODUCT_NAME], natural lighting, appetizing composition, high detail texture, commercial quality.',
        output: '5 product images',
        tokenCost: TOKEN_COSTS['seedream-v4'],
        modelName: 'seedream-v4',
        position: { x: 390, y: 40 },
        inputs: ['f1'],
        outputs: ['images'],
      },
      {
        id: 'f3',
        type: 'video-gen',
        title: 'Motion Graphics',
        category: 'AI Video',
        description: 'Animate product dengan motion cinematic',
        prompt: 'Cinematic food motion: zoom in, rotation 360°, steam/splash effects, duration 10 sec, slow-motion smooth.',
        output: 'Product video loop',
        tokenCost: TOKEN_COSTS['wan-2.1-i2v'],
        modelName: 'wan-2.1-i2v',
        position: { x: 740, y: 40 },
        inputs: ['f2'],
        outputs: ['video'],
      },
      {
        id: 'f4',
        type: 'audio-gen',
        title: 'Voice & Music',
        category: 'AI Audio',
        description: 'Narasi + background music',
        prompt: 'Voiceover Indonesia tone appetizing tentang [PRODUCT_NAME]. Background music upbeat, cocok untuk iklan F&B.',
        output: 'Audio track MP3',
        tokenCost: TOKEN_COSTS['google-tts'],
        modelName: 'google-tts',
        position: { x: 1090, y: 40 },
        inputs: ['f3'],
        outputs: ['audio'],
      },
      {
        id: 'f5',
        type: 'output',
        title: 'Final Video Export',
        category: 'Video Output',
        description: 'Render final video commercial',
        prompt: 'Merge video + audio. Add text overlay brand name. Export MP4 1920x1080, 60fps, color graded.',
        output: 'Commercial video MP4',
        tokenCost: TOKEN_COSTS['video-merge'],
        modelName: 'video-merge',
        position: { x: 1440, y: 40 },
        inputs: ['f3', 'f4'],
        outputs: ['video'],
      },
    ],
    edges: [
      { id: 'e-f1-f2', source: 'f1', target: 'f2', animated: true },
      { id: 'e-f2-f3', source: 'f2', target: 'f3', animated: true },
      { id: 'e-f3-f4', source: 'f3', target: 'f4', animated: true },
      { id: 'e-f3-f5', source: 'f3', target: 'f5', animated: true },
      { id: 'e-f4-f5', source: 'f4', target: 'f5', animated: true },
    ],
  },

  {
    id: 'product-review',
    name: 'Product Unboxing & Review',
    description: 'Video review produk dengan AI avatar reviewer dan demo produk',
    category: 'content',
    thumbnail: 'https://images.unsplash.com/photo-1523474253046-8cd2748b5fd2?w=800&q=80',
    difficulty: 'beginner',
    estimatedTime: '60-90 detik',
    totalTokenCost: 8,
    tags: ['Review', 'Unboxing', 'Product', 'Tutorial'],
    nodes: [
      {
        id: 'r1',
        type: 'text-gen',
        title: 'Review Script',
        category: 'AI Text',
        description: 'Generate script review produk',
        prompt: 'Buat script review [PRODUCT_NAME]: intro hook, unboxing, fitur utama, demo penggunaan, pros/cons, closing recommendation. Durasi 60 detik.',
        output: 'Review script',
        tokenCost: TOKEN_COSTS['gemini-flash'],
        modelName: 'gemini-flash',
        position: { x: 40, y: 40 },
        outputs: ['text'],
      },
      {
        id: 'r2',
        type: 'image-gen',
        title: 'Product Shots',
        category: 'AI Image',
        description: 'Generate gambar produk dari berbagai angle',
        prompt: 'Product photography [PRODUCT_NAME]: box packaging, close-up detail, size comparison, usage scenario. 4 images.',
        output: '4 product images',
        tokenCost: TOKEN_COSTS['seedream-v4'],
        modelName: 'seedream-v4',
        position: { x: 390, y: 40 },
        inputs: ['r1'],
        outputs: ['images'],
      },
      {
        id: 'r3',
        type: 'audio-gen',
        title: 'Reviewer Voice',
        category: 'AI Audio',
        description: 'Voice talent untuk narasi review',
        prompt: 'Voice Indonesia friendly & enthusiastic untuk review produk. Tone conversational seperti YouTuber tech reviewer.',
        output: 'Voiceover MP3',
        tokenCost: TOKEN_COSTS['google-tts'],
        modelName: 'google-tts',
        position: { x: 740, y: 40 },
        inputs: ['r1'],
        outputs: ['audio'],
      },
      {
        id: 'r4',
        type: 'output',
        title: 'Edit & Export',
        category: 'Video Output',
        description: 'Compile review video final',
        prompt: 'Sync images dengan voiceover. Add text overlay untuk highlight specs. Transition smooth. Export 9:16 vertical.',
        output: 'Review video MP4',
        tokenCost: TOKEN_COSTS['video-merge'],
        modelName: 'video-merge',
        position: { x: 1090, y: 40 },
        inputs: ['r2', 'r3'],
        outputs: ['video'],
      },
    ],
    edges: [
      { id: 'e-r1-r2', source: 'r1', target: 'r2', animated: true },
      { id: 'e-r1-r3', source: 'r1', target: 'r3', animated: true },
      { id: 'e-r2-r4', source: 'r2', target: 'r4', animated: true },
      { id: 'e-r3-r4', source: 'r3', target: 'r4', animated: true },
    ],
  },

  {
    id: 'fashion-lookbook',
    name: 'Fashion Lookbook Video',
    description: 'Create fashion lookbook dengan AI model dan style berbeda-beda',
    category: 'fashion',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&q=80',
    difficulty: 'intermediate',
    estimatedTime: '100-140 detik',
    totalTokenCost: 12,
    tags: ['Fashion', 'Model', 'Lookbook', 'Style'],
    nodes: [
      {
        id: 'l1',
        type: 'text-gen',
        title: 'Style Concept',
        category: 'AI Text',
        description: 'Generate fashion concept & mood',
        prompt: 'Create fashion lookbook concept untuk [BRAND_NAME]: theme, color palette, styling direction, target audience. 5 looks berbeda.',
        output: 'Style guide & concepts',
        tokenCost: TOKEN_COSTS['gemini-flash'],
        modelName: 'gemini-flash',
        position: { x: 40, y: 40 },
        outputs: ['text'],
      },
      {
        id: 'l2',
        type: 'image-gen',
        title: 'Model Generation',
        category: 'AI Image',
        description: 'Generate AI fashion model',
        prompt: 'Fashion model AI: diverse ethnicity, professional pose, studio lighting, white backdrop, full body & detail shots.',
        output: '5 model images',
        tokenCost: TOKEN_COSTS['flux-pro'],
        modelName: 'flux-pro',
        position: { x: 390, y: 40 },
        inputs: ['l1'],
        outputs: ['images'],
      },
      {
        id: 'l3',
        type: 'image-edit',
        title: 'Outfit Styling',
        category: 'AI Edit',
        description: 'Apply outfit & accessories ke model',
        prompt: 'Virtual try-on: dress model dengan outfit [BRAND_NAME]. Fit realistic, fabric texture natural, lighting consistent.',
        output: 'Styled model images',
        tokenCost: TOKEN_COSTS['image-inpaint'],
        modelName: 'image-inpaint',
        position: { x: 740, y: 40 },
        inputs: ['l2'],
        outputs: ['images'],
      },
      {
        id: 'l4',
        type: 'video-gen',
        title: 'Runway Animation',
        category: 'AI Video',
        description: 'Animate model walking/posing',
        prompt: 'Fashion runway motion: model walking gracefully, pose variations, camera pan & zoom, cinematic transitions.',
        output: 'Lookbook video clips',
        tokenCost: TOKEN_COSTS['stable-video'],
        modelName: 'stable-video',
        position: { x: 1090, y: 40 },
        inputs: ['l3'],
        outputs: ['video'],
      },
      {
        id: 'l5',
        type: 'output',
        title: 'Final Compilation',
        category: 'Video Output',
        description: 'Compile lookbook video final',
        prompt: 'Edit lookbook: transitions, text overlay collection name, background music, color grading. Export 1080p.',
        output: 'Lookbook video MP4',
        tokenCost: TOKEN_COSTS['video-merge'],
        modelName: 'video-merge',
        position: { x: 1440, y: 40 },
        inputs: ['l4'],
        outputs: ['video'],
      },
    ],
    edges: [
      { id: 'e-l1-l2', source: 'l1', target: 'l2', animated: true },
      { id: 'e-l2-l3', source: 'l2', target: 'l3', animated: true },
      { id: 'e-l3-l4', source: 'l3', target: 'l4', animated: true },
      { id: 'e-l4-l5', source: 'l4', target: 'l5', animated: true },
    ],
  },

  {
    id: 'brand-story',
    name: 'Brand Story Campaign',
    description: 'Video storytelling brand dengan narasi emosional dan visual cinematic',
    category: 'branding',
    thumbnail: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80',
    difficulty: 'advanced',
    estimatedTime: '150-200 detik',
    totalTokenCost: 16,
    tags: ['Branding', 'Storytelling', 'Corporate', 'Cinematic'],
    nodes: [
      {
        id: 's1',
        type: 'text-gen',
        title: 'Story Script',
        category: 'AI Text',
        description: 'Develop brand story narrative',
        prompt: 'Write brand story script [BRAND_NAME]: origin story, mission & values, customer impact, vision future. Emotional & inspiring. 90 sec.',
        output: 'Brand story script',
        tokenCost: TOKEN_COSTS['gpt-4o'],
        modelName: 'gpt-4o',
        position: { x: 40, y: 40 },
        outputs: ['text'],
      },
      {
        id: 's2',
        type: 'image-gen',
        title: 'Visual Storyboard',
        category: 'AI Image',
        description: 'Generate key visual scenes',
        prompt: 'Cinematic storyboard: brand founding moment, product creation, customer testimonials, team culture, future vision. 8 scenes.',
        output: 'Storyboard images',
        tokenCost: TOKEN_COSTS['midjourney-v6'],
        modelName: 'midjourney-v6',
        position: { x: 390, y: 40 },
        inputs: ['s1'],
        outputs: ['images'],
      },
      {
        id: 's3',
        type: 'video-gen',
        title: 'Scene Animation',
        category: 'AI Video',
        description: 'Animate storyboard menjadi video',
        prompt: 'Animate scenes dengan camera movement cinematic, color grading emotional, transitions smooth between scenes.',
        output: 'Video scenes',
        tokenCost: TOKEN_COSTS['runway-gen3'],
        modelName: 'runway-gen3',
        position: { x: 740, y: 40 },
        inputs: ['s2'],
        outputs: ['video'],
      },
      {
        id: 's4',
        type: 'audio-gen',
        title: 'Narration & Music',
        category: 'AI Audio',
        description: 'Voice narration + cinematic music',
        prompt: 'Professional voiceover Indonesia, tone inspiring & warm. Background music cinematic orchestral, build up emotional.',
        output: 'Audio track',
        tokenCost: TOKEN_COSTS['openai-tts'],
        modelName: 'openai-tts',
        position: { x: 1090, y: 40 },
        inputs: ['s1'],
        outputs: ['audio'],
      },
      {
        id: 's5',
        type: 'output',
        title: 'Final Master',
        category: 'Video Output',
        description: 'Master final brand story video',
        prompt: 'Professional edit: sync narration dengan visual, add logo animation, end card CTA, color grading premium. Export 4K.',
        output: 'Brand story video MP4',
        tokenCost: TOKEN_COSTS['video-merge'],
        modelName: 'video-merge',
        position: { x: 1440, y: 40 },
        inputs: ['s3', 's4'],
        outputs: ['video'],
      },
    ],
    edges: [
      { id: 'e-s1-s2', source: 's1', target: 's2', animated: true },
      { id: 'e-s2-s3', source: 's2', target: 's3', animated: true },
      { id: 'e-s1-s4', source: 's1', target: 's4', animated: true },
      { id: 'e-s3-s5', source: 's3', target: 's5', animated: true },
      { id: 'e-s4-s5', source: 's4', target: 's5', animated: true },
    ],
  },
];

// ── HELPER FUNCTIONS ──
export function calculateTotalCost(nodes: NodeConfig[]): number {
  return nodes.reduce((total, node) => total + (node.tokenCost || 0), 0);
}

export function getTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter(t => t.category === category);
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'beginner': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
    case 'intermediate': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
    case 'advanced': return 'text-red-600 bg-red-50 dark:bg-red-900/20';
    default: return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
  }
}
