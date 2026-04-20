import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, TrendingUp, Image as ImageIcon, Download, Hash, Film, Music,
  Lock, Mic, Zap, Search, MessageCircle, Palette, Eraser, Calendar, Sparkles,
  Link as LinkIcon, Scissors, X
} from 'lucide-react';

const tools = [
  // Teks & Strategi
  { id: 'script-architect', name: 'The Script Architect', description: 'Buat naskah video dengan formula copywriting viral (AIDA/PAS).', icon: FileText, path: '/tools/script-architect', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', category: 'teks', badge: 'Terpopuler', preview: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80' },
  { id: 'viral-hook-generator', name: 'Viral Hook Generator', description: 'Buat 10 hook viral untuk memancing perhatian dalam 3 detik pertama.', icon: Zap, path: '/tools/viral-hook-generator', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', category: 'teks', badge: 'Trending', preview: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80' },
  { id: 'trend-analyzer', name: 'Trend Analyzer', description: 'Analisa topik trending untuk ide konten segar.', icon: TrendingUp, path: '/tools/trend-analyzer', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', category: 'teks', badge: 'Wajib Coba', preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80' },
  { id: 'caption-generator', name: 'Caption & Hashtag Generator', description: 'Optimalkan metadata konten untuk masuk FYP/Explore.', icon: Hash, path: '/tools/caption-generator', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30', category: 'teks', badge: 'Favorit', preview: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=600&q=80' },
  { id: 'youtube-seo', name: 'YouTube SEO Optimizer', description: 'Judul clickbait aman dan tags ranking tinggi untuk YouTube.', icon: Search, path: '/tools/youtube-seo', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', category: 'teks', badge: 'Baru', preview: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=600&q=80' },
  { id: 'video-to-short', name: 'Video-to-Short Script', description: 'Ubah video/teks panjang menjadi naskah video pendek.', icon: Film, path: '/tools/video-to-short', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', category: 'teks', badge: null, preview: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80' },
  { id: 'comment-reply', name: 'Comment Reply Automation', description: 'Buat balasan interaktif untuk membangun komunitas.', icon: MessageCircle, path: '/tools/comment-reply', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', category: 'teks', badge: 'Baru', preview: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&q=80' },
  { id: 'podcast-to-shorts', name: 'Podcast-to-Shorts Converter', description: 'Ubah transkrip podcast panjang menjadi 5 ide konten pendek viral.', icon: Mic, path: '/tools/podcast-to-shorts', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', category: 'teks', badge: 'Canggih', preview: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80' },
  { id: 'competitor-analyzer', name: 'Competitor Content Analyzer', description: 'Analisa strategi konten kompetitor untuk menangkan persaingan.', icon: Search, path: '/tools/competitor-analyzer', color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30', category: 'teks', badge: 'Strategi', preview: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80' },
  { id: 'reply-master', name: 'AI Reply Master', description: 'Balas komentar otomatis dengan berbagai gaya bahasa (Sarkas/Santai).', icon: MessageCircle, path: '/tools/reply-master', color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30', category: 'teks', badge: 'Baru', preview: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80' },
  { id: 'poll-generator', name: 'Community Poll Generator', description: 'Ide pertanyaan polling provokatif untuk engagement Story.', icon: MessageCircle, path: '/tools/poll-generator', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', category: 'teks', badge: null, preview: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&q=80' },
  { id: 'bio-optimizer', name: 'Profile Bio Optimizer', description: 'Optimalkan bio profil agar lebih menjual dan profesional.', icon: FileText, path: '/tools/bio-optimizer', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', category: 'teks', badge: null, preview: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80' },
  { id: 'brand-pitch', name: 'Brand Deal Pitch Generator', description: 'Buat surat penawaran profesional untuk endorsement brand.', icon: FileText, path: '/tools/brand-pitch', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', category: 'teks', badge: 'Cuan', preview: 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=600&q=80' },
  // Visual & Branding
  { id: 'thumbnail-tester', name: 'AI Thumbnail A/B Tester', description: 'Simulasi prediksi performa dua desain thumbnail.', icon: ImageIcon, path: '/tools/thumbnail-tester', color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30', category: 'image', badge: 'Pro', preview: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=600&q=80' },
  { id: 'color-grading', name: 'Color Grading Suggester', description: 'Rekomendasi setting warna video berdasarkan mood konten.', icon: Palette, path: '/tools/color-grading', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30', category: 'image', badge: null, preview: 'https://images.unsplash.com/photo-1536240478700-b869ad10e128?w=600&q=80' },
  { id: 'color-palette', name: 'AI Color Palette Designer', description: 'Buat kombinasi warna estetik untuk branding Anda.', icon: Palette, path: '/tools/color-palette', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', category: 'image', badge: 'Estetik', preview: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80' },
  { id: 'text-to-visual', name: 'Text-to-Visual', description: 'Ubah teks menjadi gambar atau aset thumbnail.', icon: ImageIcon, path: '/tools/text-to-visual', color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30', category: 'image', badge: 'Beta', preview: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&q=80' },
  { id: 'text-to-image', name: 'Text to Image AI', description: 'Generate gambar realistis dari teks menggunakan Seedream v4 AI.', icon: Sparkles, path: '/tools/text-to-image', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', category: 'image', badge: 'Baru', preview: 'https://image.runpod.ai/preview/bytedance/seedream-v4-edit.png' },
  { id: 'nano-banana-edit', name: 'Nano Banana Edit', description: 'Edit gambar AI dengan Google Nano Banana 2 — gratis tanpa token!', icon: Sparkles, path: '/tools/nano-banana-edit', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', category: 'image', badge: 'Baru', preview: 'https://image.runpod.ai/preview/google/google-nano-banana-2-edit.png' },
  { id: 'wan-i2v', name: 'Image to Video AI', description: 'Ubah foto menjadi video sinematik dengan WAN 2.1 — gratis!', icon: Film, path: '/tools/wan-i2v', color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30', category: 'video', badge: 'Baru', preview: 'https://image.runpod.ai/asset/alibaba/wan-2-1-i2v-720.png' },
  { id: 'object-remover', name: 'Photo Object Remover', description: 'Hapus objek/orang yang tidak diinginkan dari foto.', icon: Eraser, path: '/tools/object-remover', color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30', category: 'image', badge: 'Beta', preview: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80' },
  { id: 'watermark-remover', name: 'Watermark Remover', description: 'Bersihkan gambar dengan menghapus watermark kecil.', icon: Scissors, path: '/tools/watermark-remover', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700', category: 'image', badge: 'Beta', preview: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80' },
  // Audio & Voice
  { id: 'text-to-speech', name: 'Text to Voice (Natural AI)', description: 'Ubah teks menjadi suara voiceover natural untuk konten tanpa wajah.', icon: Mic, path: '/tools/text-to-speech', color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30', category: 'voice', badge: 'Baru', preview: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=600&q=80' },
  { id: 'audio-visualizer', name: 'Audio Visualizer', description: 'Ubah audio/podcast menjadi video gelombang suara yang menarik.', icon: Music, path: '/tools/audio-visualizer', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', category: 'voice', badge: null, preview: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&q=80' },
  // Utilitas & Produktivitas
  { id: 'scheduler-suggestion', name: 'Smart Post Scheduler', description: 'Analisa waktu posting terbaik untuk jangkauan maksimal.', icon: Calendar, path: '/tools/scheduler-suggestion', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', category: 'utility', badge: 'Produktif', preview: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&q=80' },
  { id: 'smart-clipper', name: 'AI Smart Video Clipper', description: 'Potong video otomatis dengan deteksi highlight & auto-reframe.', icon: Scissors, path: '/tools/smart-clipper', color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30', category: 'utility', badge: 'Premium', preview: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80' },
  { id: 'link-in-bio', name: 'Link-in-Bio Builder', description: 'Buat halaman landing mini untuk link bio Anda.', icon: LinkIcon, path: '/tools/link-in-bio', color: 'text-violet-600', bgColor: 'bg-violet-100 dark:bg-violet-900/30', category: 'utility', badge: 'Baru', preview: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80' },
  { id: 'subtitle-generator', name: 'Automated Video Subtitle', description: 'Generate subtitle otomatis gaya Gen-Z (Pop-up & Emoji).', icon: FileText, path: '/tools/subtitle-generator', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', category: 'utility', badge: 'Wajib', preview: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&q=80' },
  { id: 'affiliate-hunter', name: 'Affiliate Product Hunter', description: 'Cari produk trending di marketplace yang cocok dengan niche Anda.', icon: Search, path: '/tools/affiliate-hunter', color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30', category: 'utility', badge: 'Cuan', preview: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80' },
  { id: 'giveaway-picker', name: 'Giveaway Picker & Checker', description: 'Undi pemenang giveaway secara adil dan transparan.', icon: Zap, path: '/tools/giveaway-picker', color: 'text-yellow-600', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30', category: 'utility', badge: null, preview: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80' },
  { id: 'shadowban-checker', name: 'Shadowban Checker', description: 'Analisa kesehatan akun dan deteksi pembatasan jangkauan.', icon: Search, path: '/tools/shadowban-checker', color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-700', category: 'utility', badge: 'Penting', preview: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80' },
  { id: 'all-in-one-downloader', name: 'All-in-One Downloader', description: 'Download video dari IG, TikTok, YouTube tanpa watermark.', icon: Download, path: '/tools/downloader', color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30', category: 'utility', badge: 'Beta', preview: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=600&q=80' },
];

const categories = [
  { id: 'all', label: 'Semua Tools', emoji: '⚡' },
  { id: 'teks', label: 'Teks & Strategi', emoji: '✍️' },
  { id: 'image', label: 'Visual & Branding', emoji: '🎨' },
  { id: 'voice', label: 'Audio & Voice', emoji: '🎙️' },
  { id: 'utility', label: 'Utilitas & Produktivitas', emoji: '🛠️' },
];

const getBadgeStyle = (text: string) => {
  switch (text) {
    case 'Terpopuler':
    case 'Trending':
      return 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 animate-pulse';
    case 'Baru':
      return 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300';
    case 'Favorit':
    case 'Wajib Coba':
      return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md';
    case 'Cuan':
      return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md';
    case 'Premium':
      return 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md';
    default:
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
  }
};

export default function Tools() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = useMemo(() => {
    return tools.filter(t => {
      const matchCat = activeCategory === 'all' || t.category === activeCategory;
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [activeCategory, searchQuery]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tools.length };
    categories.slice(1).forEach(cat => {
      c[cat.id] = tools.filter(t => t.category === cat.id).length;
    });
    return c;
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Semua Tools</h1>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          {tools.length} tools AI untuk content creator — pilih kategori atau cari langsung.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Cari tools..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-10 pr-10 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="mb-8 flex flex-wrap gap-2">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
              activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {counts[cat.id]}
            </span>
          </button>
        ))}
      </div>

      {/* Results count */}
      {searchQuery && (
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          Menampilkan {filtered.length} hasil untuk "<span className="font-medium text-gray-700 dark:text-gray-300">{searchQuery}</span>"
        </p>
      )}

      {/* Tools Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(tool => (
            <div
              key={tool.id}
              onClick={() => navigate(tool.path)}
              className="group relative flex cursor-pointer flex-col rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-800"
            >
              {/* Preview image */}
              {(tool as any).preview ? (
                <div className="relative h-40 overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={(tool as any).preview}
                    alt={tool.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                  {tool.badge && (
                    <div className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${getBadgeStyle(tool.badge)}`}>
                      {tool.badge}
                    </div>
                  )}
                </div>
              ) : (
                <div className={`flex h-20 items-center justify-center ${tool.bgColor}`}>
                  <tool.icon className={`h-8 w-8 ${tool.color}`} />
                  {tool.badge && (
                    <div className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-xs font-bold ${getBadgeStyle(tool.badge)}`}>
                      {tool.badge}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3">
                {!(tool as any).preview && tool.badge && null}
                <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug truncate">{tool.name}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2">{tool.description}</p>
                <div className="mt-2">
                  <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                    Coba →
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
            <Search className="h-7 w-7 text-gray-400" />
          </div>
          <h3 className="mb-2 font-semibold text-gray-700 dark:text-gray-300">Tools tidak ditemukan</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Coba kata kunci lain atau pilih kategori berbeda.</p>
          <button
            onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Reset Filter
          </button>
        </div>
      )}
    </div>
  );
}

