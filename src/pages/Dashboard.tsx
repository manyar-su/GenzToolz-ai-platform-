import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  TrendingUp, 
  Image as ImageIcon, 
  Download, 
  Hash, 
  Film, 
  Music,
  Lock,
  Mic,
  Zap,
  Search,
  MessageCircle,
  Palette,
  Eraser,
  Calendar,
  Link as LinkIcon,
  Scissors
} from 'lucide-react';

const tools = [
  // Teks
  {
    id: 'script-architect',
    name: 'The Script Architect',
    description: 'Buat naskah video dengan formula copywriting viral (AIDA/PAS).',
    icon: FileText,
    path: '/tools/script-architect',
    available: true,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'teks',
    badge: 'Terpopuler'
  },
  {
    id: 'viral-hook-generator',
    name: 'Viral Hook Generator',
    description: 'Buat 10 hook viral untuk memancing perhatian dalam 3 detik pertama.',
    icon: Zap,
    path: '/tools/viral-hook-generator',
    available: true,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'teks',
    badge: 'Trending'
  },
  {
    id: 'trend-analyzer',
    name: 'Trend Analyzer',
    description: 'Analisa topik trending untuk ide konten segar.',
    icon: TrendingUp,
    path: '/tools/trend-analyzer',
    available: true,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'teks',
    badge: 'Wajib Coba'
  },
  {
    id: 'caption-generator',
    name: 'Caption & Hashtag Generator',
    description: 'Optimalkan metadata konten untuk masuk FYP/Explore.',
    icon: Hash,
    path: '/tools/caption-generator',
    available: true,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    category: 'teks',
    badge: 'Favorit'
  },
  {
    id: 'youtube-seo',
    name: 'YouTube SEO Optimizer',
    description: 'Judul clickbait aman dan tags ranking tinggi untuk YouTube.',
    icon: Search,
    path: '/tools/youtube-seo',
    available: true,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'teks',
    badge: 'Baru'
  },
  {
    id: 'video-to-short',
    name: 'Video-to-Short Script',
    description: 'Ubah video/teks panjang menjadi naskah video pendek.',
    icon: Film,
    path: '/tools/video-to-short',
    available: true,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'teks',
    badge: null
  },
  {
    id: 'comment-reply',
    name: 'Comment Reply Automation',
    description: 'Buat balasan interaktif untuk membangun komunitas.',
    icon: MessageCircle,
    path: '/tools/comment-reply',
    available: true,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'teks',
    badge: 'Baru'
  },
  // Video / Utility
  {
    id: 'scheduler-suggestion',
    name: 'Smart Post Scheduler',
    description: 'Analisa waktu posting terbaik untuk jangkauan maksimal.',
    icon: Calendar,
    path: '/tools/scheduler-suggestion',
    available: true,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'video',
    badge: 'Produktif'
  },
  {
    id: 'smart-clipper',
    name: 'AI Smart Video Clipper',
    description: 'Potong video otomatis dengan deteksi highlight & auto-reframe.',
    icon: Scissors,
    path: '/tools/smart-clipper',
    available: true,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'video',
    badge: 'Premium'
  },
  {
    id: 'link-in-bio',
    name: 'Link-in-Bio Builder',
    description: 'Buat halaman landing mini untuk link bio Anda.',
    icon: LinkIcon,
    path: '/tools/link-in-bio',
    available: true,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    category: 'video',
    badge: 'Baru'
  },
  {
    id: 'podcast-to-shorts',
    name: 'Podcast-to-Shorts Converter',
    description: 'Ubah transkrip podcast panjang menjadi 5 ide konten pendek viral.',
    icon: Mic,
    path: '/tools/podcast-to-shorts',
    available: true,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'teks',
    badge: 'Canggih'
  },
  {
    id: 'competitor-analyzer',
    name: 'Competitor Content Analyzer',
    description: 'Analisa strategi konten kompetitor untuk menangkan persaingan.',
    icon: Search,
    path: '/tools/competitor-analyzer',
    available: true,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    category: 'teks',
    badge: 'Strategi'
  },
  {
    id: 'subtitle-generator',
    name: 'Automated Video Subtitle',
    description: 'Generate subtitle otomatis gaya Gen-Z (Pop-up & Emoji).',
    icon: FileText,
    path: '/tools/subtitle-generator',
    available: true,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'video',
    badge: 'Wajib'
  },
  {
    id: 'brand-pitch',
    name: 'Brand Deal Pitch Generator',
    description: 'Buat surat penawaran profesional untuk endorsement brand.',
    icon: FileText,
    path: '/tools/brand-pitch',
    available: true,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'video',
    badge: 'Cuan'
  },
  {
    id: 'affiliate-hunter',
    name: 'Affiliate Product Hunter',
    description: 'Cari produk trending di marketplace yang cocok dengan niche Anda.',
    icon: Search,
    path: '/tools/affiliate-hunter',
    available: true,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'video',
    badge: 'Cuan'
  },
  {
    id: 'reply-master',
    name: 'AI Reply Master',
    description: 'Balas komentar otomatis dengan berbagai gaya bahasa (Sarkas/Santai).',
    icon: MessageCircle,
    path: '/tools/reply-master',
    available: true,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    category: 'teks',
    badge: 'Baru'
  },
  {
    id: 'giveaway-picker',
    name: 'Giveaway Picker & Checker',
    description: 'Undi pemenang giveaway secara adil dan transparan.',
    icon: Zap,
    path: '/tools/giveaway-picker',
    available: true,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    category: 'video',
    badge: null
  },
  {
    id: 'poll-generator',
    name: 'Community Poll Generator',
    description: 'Ide pertanyaan polling provokatif untuk engagement Story.',
    icon: MessageCircle,
    path: '/tools/poll-generator',
    available: true,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    category: 'teks',
    badge: null
  },
  {
    id: 'shadowban-checker',
    name: 'Shadowban Checker',
    description: 'Analisa kesehatan akun dan deteksi pembatasan jangkauan.',
    icon: Search,
    path: '/tools/shadowban-checker',
    available: true,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    category: 'video',
    badge: 'Penting'
  },
  {
    id: 'bio-optimizer',
    name: 'Profile Bio Optimizer',
    description: 'Optimalkan bio profil agar lebih menjual dan profesional.',
    icon: FileText,
    path: '/tools/bio-optimizer',
    available: true,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    category: 'teks',
    badge: null
  },
  {
    id: 'thumbnail-tester',
    name: 'AI Thumbnail A/B Tester',
    description: 'Simulasi prediksi performa dua desain thumbnail.',
    icon: ImageIcon,
    path: '/tools/thumbnail-tester',
    available: true,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    category: 'image',
    badge: 'Pro'
  },
  {
    id: 'color-grading',
    name: 'Color Grading Suggester',
    description: 'Rekomendasi setting warna video berdasarkan mood konten.',
    icon: Palette,
    path: '/tools/color-grading',
    available: true,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    category: 'image',
    badge: null
  },
  // Voice
  {
    id: 'text-to-speech',
    name: 'Text to Voice (Natural AI)',
    description: 'Ubah teks menjadi suara voiceover natural untuk konten tanpa wajah.',
    icon: Mic,
    path: '/tools/text-to-speech',
    available: true,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    category: 'voice',
    badge: 'Baru'
  },
  {
    id: 'audio-visualizer',
    name: 'Audio Visualizer',
    description: 'Ubah audio/podcast menjadi video gelombang suara yang menarik.',
    icon: Music,
    path: '/tools/audio-visualizer',
    available: true,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    category: 'voice',
    badge: null
  },
  // Image / Visual
  {
    id: 'color-palette',
    name: 'AI Color Palette Designer',
    description: 'Buat kombinasi warna estetik untuk branding Anda.',
    icon: Palette,
    path: '/tools/color-palette',
    available: true,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'image',
    badge: 'Estetik'
  },
  {
    id: 'text-to-visual',
    name: 'Text-to-Visual',
    description: 'Ubah teks menjadi gambar atau aset thumbnail.',
    icon: ImageIcon,
    path: '/tools/text-to-visual',
    available: true,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
    category: 'image',
    badge: 'Beta'
  },
  {
    id: 'object-remover',
    name: 'Photo Object Remover',
    description: 'Hapus objek/orang yang tidak diinginkan dari foto.',
    icon: Eraser,
    path: '/tools/object-remover',
    available: true,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    category: 'image',
    badge: 'Beta'
  },
  {
    id: 'watermark-remover',
    name: 'Watermark Remover',
    description: 'Bersihkan gambar dengan menghapus watermark kecil.',
    icon: Scissors,
    path: '/tools/watermark-remover',
    available: true,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    category: 'image',
    badge: 'Beta'
  },
  {
    id: 'all-in-one-downloader',
    name: 'All-in-One Downloader',
    description: 'Download video dari IG, TikTok, YouTube tanpa watermark.',
    icon: Download,
    path: '/tools/downloader',
    available: true,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    category: 'video',
    badge: 'Beta'
  }
];

export default function Dashboard() {
  const navigate = useNavigate();

  const categories = [
    { id: 'teks', label: 'Text & Strategy Tools' },
    { id: 'image', label: 'Visual & Branding Tools' },
    { id: 'voice', label: 'Audio & Voice Tools' },
    { id: 'video', label: 'Utility & Productivity Tools' },
  ];

  const getBadgeStyle = (text: string) => {
    switch (text) {
      case 'Terpopuler':
      case 'Trending':
        return 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30 animate-pulse';
      case 'Baru':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'Favorit':
      case 'Wajib Coba':
        return 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Creative Tools</h2>
        <p className="text-gray-600 dark:text-gray-400">Semua yang Anda butuhkan untuk membuat konten viral.</p>
      </div>

      <div className="space-y-12">
        {categories.map((category) => {
          const categoryTools = tools.filter(t => t.category === category.id);
          if (categoryTools.length === 0) return null;

          return (
            <div key={category.id}>
              <h3 className="mb-4 text-lg font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {category.label}
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryTools.map((tool) => (
                  <div 
                    key={tool.id}
                    onClick={() => tool.available && navigate(tool.path)}
                    className={`group relative flex cursor-pointer flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900 ${
                      !tool.available ? 'cursor-not-allowed opacity-70 grayscale' : ''
                    }`}
                  >
                    {tool.badge && (
                      <div className={`absolute -right-2 -top-2 rounded-full px-3 py-1 text-xs font-bold ${getBadgeStyle(tool.badge)}`}>
                        {tool.badge}
                      </div>
                    )}
                    
                    <div>
                      <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${tool.bgColor} ${tool.color} transition-transform group-hover:scale-110`}>
                        <tool.icon className="h-6 w-6" />
                      </div>
                      <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{tool.name}</h3>
                      <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{tool.description}</p>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between">
                      {tool.available ? (
                        <span className="text-sm font-semibold text-blue-600 group-hover:underline dark:text-blue-400">Coba Sekarang &rarr;</span>
                      ) : (
                        <div className="flex items-center text-xs font-medium text-gray-400">
                          <Lock className="mr-1 h-3 w-3" /> Segera Hadir
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
