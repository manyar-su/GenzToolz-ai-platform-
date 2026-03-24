import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, TrendingUp, Coins, Users, ArrowRight, FileText, Wrench } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { useTokenStore } from '../store/useTokenStore';
import { useHistoryStore } from '../store/useHistoryStore';
import { useNotificationStore } from '../store/useNotificationStore';
import OnboardingModal from '../components/OnboardingModal';

const FEATURED_TOOLS = [
  { id: 'script-architect', name: 'Script Architect', desc: 'Naskah video viral', path: '/tools/script-architect', color: 'from-purple-500 to-indigo-500', badge: 'Terpopuler' },
  { id: 'viral-hook-generator', name: 'Viral Hook Generator', desc: '10 hook dalam detik', path: '/tools/viral-hook-generator', color: 'from-yellow-500 to-orange-500', badge: 'Trending' },
  { id: 'caption-generator', name: 'Caption & Hashtag', desc: 'Masuk FYP/Explore', path: '/tools/caption-generator', color: 'from-pink-500 to-rose-500', badge: 'Favorit' },
  { id: 'trend-analyzer', name: 'Trend Analyzer', desc: 'Ide konten segar', path: '/tools/trend-analyzer', color: 'from-blue-500 to-cyan-500', badge: 'Wajib' },
  { id: 'youtube-seo', name: 'YouTube SEO', desc: 'Ranking tinggi di YT', path: '/tools/youtube-seo', color: 'from-red-500 to-orange-500', badge: 'Baru' },
  { id: 'text-to-speech', name: 'Text to Voice', desc: 'Voiceover natural AI', path: '/tools/text-to-speech', color: 'from-emerald-500 to-teal-500', badge: 'Baru' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { isLoggedIn, name, affiliateStats } = useUserStore();
  const { tokens } = useTokenStore();
  const { history } = useHistoryStore();
  const { add: addNotif } = useNotificationStore();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Show onboarding for new users
  useEffect(() => {
    if (isLoggedIn) {
      const seen = localStorage.getItem('genz_onboarding_done');
      if (!seen) {
        setShowOnboarding(true);
        localStorage.setItem('genz_onboarding_done', '1');
        // Welcome notification
        addNotif({ title: 'Selamat datang! 🎉', message: `Halo ${name}! Kamu dapat 10 kredit gratis untuk mulai.`, type: 'success' });
      }
    }
  }, [isLoggedIn]);

  // Low token warning
  useEffect(() => {
    if (isLoggedIn && tokens > 0 && tokens <= 3) {
      addNotif({ title: 'Token hampir habis ⚠️', message: `Sisa ${tokens} token. Top up sekarang agar tidak terputus.`, type: 'warning' });
    }
  }, [tokens, isLoggedIn]);

  const toolsUsed = history.length;
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Selamat pagi';
    if (h < 17) return 'Selamat siang';
    return 'Selamat malam';
  };

  return (
    <div className="space-y-8">
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}

      {/* Greeting */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {greeting()}, {isLoggedIn ? name : 'Creator'} 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {isLoggedIn ? 'Siap bikin konten viral hari ini?' : 'Login untuk menyimpan hasil dan mendapat kredit gratis.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/tools')}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/30 transition hover:bg-blue-700 hover:scale-[1.02] self-start sm:self-auto"
        >
          <Wrench className="h-4 w-4" /> Semua Tools
        </button>
      </div>

      {/* Stats Cards */}
      {isLoggedIn && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: 'Sisa Token', value: tokens, icon: Coins, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20', action: () => navigate('/topup') },
            { label: 'Tools Dipakai', value: toolsUsed, icon: Wrench, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', action: () => navigate('/history') },
            { label: 'Teman Diajak', value: affiliateStats.friendsJoined, icon: Users, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', action: () => navigate('/affiliate') },
            { label: 'Bonus Referral', value: affiliateStats.totalBonusEarned, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20', action: () => navigate('/affiliate') },
          ].map((stat, i) => (
            <button
              key={i}
              onClick={stat.action}
              className="flex flex-col gap-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Featured Tools */}
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
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${tool.color} opacity-0 transition-opacity group-hover:opacity-5`} />
              <div className="flex items-start justify-between">
                <div className={`rounded-xl bg-gradient-to-br ${tool.color} p-2.5`}>
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <span className="rounded-full bg-blue-100 dark:bg-blue-900/30 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {tool.badge}
                </span>
              </div>
              <h3 className="mt-3 font-bold text-gray-900 dark:text-white">{tool.name}</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{tool.desc}</p>
              <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:underline">
                Coba Sekarang <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent History */}
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
              <div key={item.id} className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
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

      {/* CTA for guests */}
      {!isLoggedIn && (
        <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Daftar Gratis & Dapat 10 Kredit</h2>
          <p className="text-blue-100 mb-6">Akses 30+ AI tools untuk content creator tanpa kartu kredit.</p>
          <button
            onClick={() => navigate('/profile')}
            className="rounded-xl bg-white px-8 py-3 font-bold text-blue-600 transition hover:bg-blue-50"
          >
            Mulai Gratis Sekarang
          </button>
        </div>
      )}
    </div>
  );
}
