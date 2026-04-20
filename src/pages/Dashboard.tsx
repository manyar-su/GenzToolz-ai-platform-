import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, Coins, Users, ArrowRight, FileText, Wrench, Rocket, Star, ChevronRight } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useTokenStore } from '../store/useTokenStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useNotificationStore } from '../store/useNotificationStore';

const FEATURED_TOOLS = [
  {
    id: 'wan-i2v',
    name: 'Image to Video AI',
    desc: 'Ubah foto jadi video sinematik dengan WAN 2.1',
    path: '/tools/wan-i2v',
    color: 'from-blue-600 to-cyan-600',
    badge: 'Baru',
    preview: 'https://image.runpod.ai/asset/alibaba/wan-2-1-i2v-720.png',
  },
  {
    id: 'nano-banana-edit',
    name: 'Nano Banana Edit',
    desc: 'Edit gambar AI dengan Google Nano Banana 2 — gratis!',
    path: '/tools/nano-banana-edit',
    color: 'from-yellow-500 to-orange-500',
    badge: 'Baru',
    preview: 'https://image.runpod.ai/preview/google/google-nano-banana-2-edit.png',
  },
  {
    id: 'text-to-image',
    name: 'Image to Image AI',
    desc: 'Generate & edit gambar realistis dengan Seedream v4',
    path: '/tools/text-to-image',
    color: 'from-purple-600 to-pink-600',
    badge: 'Baru',
    preview: 'https://image.runpod.ai/preview/bytedance/seedream-v4-edit.png',
  },
  {
    id: 'script-architect',
    name: 'Script Architect',
    desc: 'Naskah video viral dengan formula AIDA/PAS',
    path: '/tools/script-architect',
    color: 'from-purple-500 to-indigo-500',
    badge: 'Terpopuler',
    preview: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&q=80',
  },
  {
    id: 'viral-hook-generator',
    name: 'Viral Hook Generator',
    desc: '10 hook viral dalam 3 detik pertama',
    path: '/tools/viral-hook-generator',
    color: 'from-yellow-500 to-orange-500',
    badge: 'Trending',
    preview: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&q=80',
  },
  {
    id: 'caption-generator',
    name: 'Caption & Hashtag',
    desc: 'Caption + hashtag optimal untuk FYP/Explore',
    path: '/tools/caption-generator',
    color: 'from-pink-500 to-rose-500',
    badge: 'Favorit',
    preview: 'https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=400&q=80',
  },
  {
    id: 'trend-analyzer',
    name: 'Trend Analyzer',
    desc: 'Analisa topik trending untuk ide konten segar',
    path: '/tools/trend-analyzer',
    color: 'from-blue-500 to-cyan-500',
    badge: 'Wajib',
    preview: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&q=80',
  },
  {
    id: 'youtube-seo',
    name: 'YouTube SEO',
    desc: 'Judul & tags ranking tinggi untuk YouTube',
    path: '/tools/youtube-seo',
    color: 'from-red-500 to-orange-500',
    badge: 'Baru',
    preview: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=400&q=80',
  },
];

// Animated counter hook
function useCounter(target: number, duration = 1500, start = false) {
  const [count, setCount] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    if (!start) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, start]);
  return count;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoggedIn, name, affiliateStats } = useUserStore();
  const { tokens } = useTokenStore();
  const { history } = useHistoryStore();
  const { add: addNotif } = useNotificationStore();
  const [heroVisible, setHeroVisible] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  // Disable onboarding
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('genz_onboarding_done', '1');
    }
  }, [isLoggedIn]);

  // Low token warning
  useEffect(() => {
    if (isLoggedIn && tokens > 0 && tokens <= 3) {
      addNotif({ title: 'Token hampir habis ⚠️', message: `Sisa ${tokens} token. Top up sekarang agar tidak terputus.`, type: 'warning' });
    }
  }, [tokens, isLoggedIn]);

  // Trigger hero animation on mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Intersection observer for stats counter
  useEffect(() => {
    if (!statsRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  const toolsUsed = history.length;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat pagi';
    if (h < 17) return 'Selamat siang';
    return 'Selamat malam';
  };

  // Animated stat counters
  const cTokens = useCounter(tokens, 1200, statsVisible && isLoggedIn);
  const cTools = useCounter(toolsUsed, 1200, statsVisible && isLoggedIn);
  const cFriends = useCounter(affiliateStats.friendsJoined, 1200, statsVisible && isLoggedIn);
  const cBonus = useCounter(affiliateStats.totalBonusEarned, 1200, statsVisible && isLoggedIn);
  const cUsers = useCounter(12847, 2000, statsVisible && !isLoggedIn);

  return (
    <>
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes floatUp {
          0% { opacity: 0; transform: translateY(32px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .hero-gradient {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a0533 30%, #0d1a3a 60%, #0a0a0a 100%);
          background-size: 300% 300%;
          animation: gradientShift 8s ease infinite;
        }
        .hero-glow {
          background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(139,92,246,0.25) 0%, transparent 70%);
        }
        .float-1 { animation: floatUp 0.6s ease forwards; }
        .float-2 { animation: floatUp 0.6s 0.15s ease both; }
        .float-3 { animation: floatUp 0.6s 0.3s ease both; }
        .float-4 { animation: floatUp 0.6s 0.45s ease both; }
        .fade-in { animation: fadeIn 0.8s ease forwards; }
      `}</style>

      <div className="space-y-8">

        {/* ── GUEST HERO ── */}
        {!isLoggedIn && (
          <div className="relative overflow-hidden rounded-3xl hero-gradient min-h-[340px] flex flex-col items-center justify-center text-center px-6 py-14">
            {/* Glow overlay */}
            <div className="absolute inset-0 hero-glow pointer-events-none" />
            {/* Floating orbs */}
            <div className="absolute top-8 left-8 h-24 w-24 rounded-full bg-purple-600/20 blur-2xl animate-pulse" />
            <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full bg-blue-600/20 blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute top-1/2 left-4 h-16 w-16 rounded-full bg-pink-600/15 blur-xl animate-pulse" style={{ animationDelay: '0.5s' }} />

            <div className="relative z-10 max-w-2xl">
              {heroVisible && (
                <>
                  <div className="float-1 mb-4 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300">
                    <Rocket className="h-4 w-4" />
                    Platform AI untuk Content Creator Indonesia
                  </div>
                  <h1 className="float-2 text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
                    Buat Konten Viral<br />
                    <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                      dengan AI 🚀
                    </span>
                  </h1>
                  <p className="float-3 mt-4 text-base text-gray-300 sm:text-lg max-w-xl mx-auto">
                    30+ tools AI untuk script, caption, thumbnail, voiceover, dan lebih banyak lagi. Gratis untuk dicoba.
                  </p>
                  <div className="float-4 mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => navigate('/profile')}
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-7 py-3 font-bold text-white shadow-lg shadow-purple-500/30 transition hover:scale-105 hover:shadow-purple-500/50"
                    >
                      <Zap className="h-4 w-4" /> Daftar Gratis
                    </button>
                    <button
                      onClick={() => navigate('/tools')}
                      className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-7 py-3 font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
                    >
                      Lihat Tools <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── LOGGED IN GREETING ── */}
        {isLoggedIn && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {greeting()}, {name} 👋
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Siap bikin konten viral hari ini?
              </p>
            </div>
            <button
              onClick={() => navigate('/tools')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 hover:scale-[1.02] self-start sm:self-auto"
            >
              <Wrench className="h-4 w-4" /> Semua Tools
            </button>
          </div>
        )}

        {/* ── STATS CARDS (logged in) ── */}
        {isLoggedIn && (
          <div ref={statsRef} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Sisa Token', value: cTokens, icon: Coins, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => navigate('/topup') },
              { label: 'Tools Dipakai', value: cTools, icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', action: () => navigate('/history') },
              { label: 'Teman Diajak', value: cFriends, icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', action: () => navigate('/affiliate') },
              { label: 'Bonus Referral', value: cBonus, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', action: () => navigate('/affiliate') },
            ].map((stat, i) => (
              <button
                key={i}
                onClick={stat.action}
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111] p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{stat.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── FEATURED TOOLS ── */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tools Terpopuler</h2>
            <button onClick={() => navigate('/tools')} className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
              Lihat semua <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED_TOOLS.map(tool => (
              <div
                key={tool.id}
                onClick={() => navigate(tool.path)}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl"
              >
                {/* Preview image */}
                <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-[#161616]">
                  <img
                    src={tool.preview}
                    alt={tool.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={e => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                    }}
                  />
                  <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-40`} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <span className="absolute left-2 top-2 rounded-full bg-black/40 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold text-white">
                    {tool.badge}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tool.name}</h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{tool.desc}</p>
                  <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    Coba <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RECENT HISTORY ── */}
        {history.length > 0 && (
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Aktivitas Terakhir</h2>
              <button onClick={() => navigate('/history')} className="flex items-center gap-1 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                Lihat semua <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2">
              {history.slice(0, 3).map(item => (
                <div key={item.id} className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111] px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-[#161616]">
                    <FileText className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.toolName}</p>
                    <p className="text-xs text-gray-400 truncate">{item.input?.slice(0, 60)}...</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {new Date(item.timestamp).toLocaleDateString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SOCIAL PROOF + JOIN CTA (guests) ── */}
        {!isLoggedIn && (
          <div ref={statsRef} className="overflow-hidden rounded-3xl bg-[#0a0a0a] border border-white/10">
            {/* Stats bar */}
            <div className="grid grid-cols-3 divide-x divide-white/10 border-b border-white/10">
              {[
                { label: 'Creator Aktif', value: cUsers, suffix: '+' },
                { label: 'Tools Tersedia', value: 30, suffix: '+' },
                { label: 'Konten Dibuat', value: 98, suffix: 'K+' },
              ].map((s, i) => (
                <div key={i} className="flex flex-col items-center py-5 px-4 text-center">
                  <span className="text-2xl font-black text-white tabular-nums">{s.value}{s.suffix}</span>
                  <span className="mt-1 text-xs text-gray-400">{s.label}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-6 py-8 text-center">
              <div className="mb-3 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 text-sm text-gray-400">4.9/5 dari 2.000+ pengguna</span>
              </div>
              <h2 className="text-2xl font-black text-white mb-2">Bergabung Sekarang — Gratis!</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto text-sm">
                Daftar dan langsung dapat <span className="font-bold text-purple-400">10 kredit gratis</span> untuk mencoba semua tools AI kami.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-3 font-bold text-white shadow-lg shadow-purple-500/30 transition hover:scale-105"
                >
                  <Zap className="h-4 w-4 animate-bounce" /> Mulai Gratis Sekarang
                </button>
                <button
                  onClick={() => navigate('/tools')}
                  className="flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-medium text-gray-300 transition hover:border-white/40 hover:text-white"
                >
                  Lihat semua tools <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
