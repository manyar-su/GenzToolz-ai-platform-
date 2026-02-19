import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useAlert } from '../context/AlertContext';
import { 
  Users, 
  Copy, 
  Share2, 
  Trophy, 
  TrendingUp, 
  DollarSign, 
  MousePointer, 
  CheckCircle, 
  XCircle,
  ArrowRight,
  Gift
} from 'lucide-react';

export default function Affiliate() {
  const navigate = useNavigate();
  const { isLoggedIn, referralCode, affiliateStats } = useUserStore();
  const { showAlert } = useAlert();
  
  // Simulated State for "Real-Time Tracker" (not yet in store)
  const [clicks, setClicks] = useState(124); // Mock data
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoggedIn) {
      // If not logged in, maybe redirect or show guest view
      // For now, we'll just let them see the page but with "Login to see your stats"
    }

    // Mock Referrals Data
    setReferrals([
      { email: 'an***@gmail.com', status: 'joined', date: '2024-02-20' },
      { email: 'bu***@yahoo.com', status: 'paid', date: '2024-02-19' },
      { email: 'ci***@outlook.com', status: 'joined', date: '2024-02-18' },
    ]);
  }, [isLoggedIn]);

  const copyLink = () => {
    const link = `https://genztools.com/profile?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    showAlert('Link affiliate berhasil disalin!', 'success');
  };

  const copyTemplate = (text: string) => {
    const finalText = text.replace('[LINK]', `https://genztools.com/profile?ref=${referralCode}`);
    navigator.clipboard.writeText(finalText);
    showAlert('Template promosi berhasil disalin!', 'success');
  };

  if (!isLoggedIn) {
     return (
        <div className="flex min-h-[80vh] flex-col items-center justify-center p-4 text-center">
            <div className="rounded-full bg-purple-100 p-6 dark:bg-purple-900/30">
                <Users className="h-12 w-12 text-purple-600 dark:text-purple-400" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">Affiliate Program</h1>
            <p className="mt-2 max-w-md text-gray-500 dark:text-gray-400">
                Dapatkan penghasilan pasif dengan mengajak teman menggunakan GenzTools.
            </p>
            <button 
                onClick={() => navigate('/profile')}
                className="mt-8 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white transition hover:bg-blue-700"
            >
                Gabung Sekarang
            </button>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-8">
      <div className="mx-auto max-w-6xl space-y-8">
        
        {/* Header / Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 to-indigo-600 p-8 text-white shadow-xl md:p-12">
            <div className="relative z-10 max-w-2xl">
                <div className="mb-4 inline-flex items-center rounded-full bg-white/20 px-4 py-1.5 text-sm font-semibold backdrop-blur-md">
                    <Gift className="mr-2 h-4 w-4" /> Bonus Spesial Member
                </div>
                <h1 className="text-3xl font-extrabold leading-tight md:text-5xl">
                    Dapatkan bonus <span className="text-yellow-300">15% koin</span> setiap temanmu Top-up.
                </h1>
                <p className="mt-4 text-lg text-purple-100">
                    Tanpa batas, selamanya! Cukup bagikan link dan biarkan sistem bekerja untukmu.
                </p>
            </div>
            {/* Background Pattern */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
            <div className="absolute -bottom-20 right-20 h-80 w-80 rounded-full bg-purple-500/20 blur-3xl"></div>
        </div>

        {/* Real-Time Tracker Stats */}
        <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 shadow-lg transition-transform hover:scale-105 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Klik Link</span>
                    <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                        <MousePointer className="h-5 w-5" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{clicks}</h3>
                    <span className="text-xs font-bold text-green-500">↗ 12%</span>
                </div>
                <p className="mt-2 text-xs text-gray-400">Update real-time</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg transition-transform hover:scale-105 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Teman Bergabung</span>
                    <div className="rounded-lg bg-green-100 p-2 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                        <Users className="h-5 w-5" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{affiliateStats.friendsJoined}</h3>
                    <span className="text-xs font-bold text-green-500">+1 Hari ini</span>
                </div>
                <p className="mt-2 text-xs text-gray-400">User terverifikasi</p>
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg transition-transform hover:scale-105 dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bonus Cair</span>
                    <div className="rounded-lg bg-yellow-100 p-2 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400">
                        <DollarSign className="h-5 w-5" />
                    </div>
                </div>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{affiliateStats.totalBonusEarned}</h3>
                    <span className="text-xs font-bold text-gray-500">Token</span>
                </div>
                <p className="mt-2 text-xs text-gray-400">Total pendapatan affiliate</p>
            </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content: Referral Card & Assets */}
            <div className="lg:col-span-2 space-y-8">
                {/* Referral Card */}
                <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
                    <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Link Referral Kamu</h2>
                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-700/50">
                        <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center">
                            <div className="flex-1">
                                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Kode Unik</label>
                                <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{referralCode}</div>
                            </div>
                            <div className="flex-1">
                                <label className="mb-2 block text-xs font-bold uppercase text-gray-500">Link Otomatis</label>
                                <div className="truncate text-sm text-gray-500 dark:text-gray-400">genztools.com/profile?ref={referralCode}</div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button 
                                onClick={copyLink}
                                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700"
                            >
                                <Copy className="h-5 w-5" /> Salin Link
                            </button>
                            <button className="flex items-center justify-center rounded-xl bg-gray-200 px-4 text-gray-600 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300">
                                <Share2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Promotional Assets */}
                <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
                    <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Asset Promosi Siap Pakai</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Template 1 */}
                        <div className="group relative rounded-xl border border-gray-200 p-5 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-500">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">Formal & Jelas</span>
                            </div>
                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                                "Baru nemu tools AI keren banget buat konten kreator! Bisa bikin script, caption, sampe edit video otomatis. Coba gratis pake link aku disini: [LINK] 🚀"
                            </p>
                            <button 
                                onClick={() => copyTemplate("Baru nemu tools AI keren banget buat konten kreator! Bisa bikin script, caption, sampe edit video otomatis. Coba gratis pake link aku disini: [LINK] 🚀")}
                                className="w-full rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Salin Teks
                            </button>
                        </div>

                        {/* Template 2 */}
                        <div className="group relative rounded-xl border border-gray-200 p-5 hover:border-blue-500 dark:border-gray-700 dark:hover:border-blue-500">
                            <div className="mb-3 flex items-center justify-between">
                                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700 dark:bg-green-900/30 dark:text-green-300">Singkat & Padat (WA/Story)</span>
                            </div>
                            <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
                                "Daftar GenzTools pake link ini, langsung dapet 10 koin gratis! 🔥 Buruan sebelum promo abis: [LINK]"
                            </p>
                            <button 
                                onClick={() => copyTemplate("Daftar GenzTools pake link ini, langsung dapet 10 koin gratis! 🔥 Buruan sebelum promo abis: [LINK]")}
                                className="w-full rounded-lg border border-gray-300 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                                Salin Teks
                            </button>
                        </div>
                    </div>
                </div>

                {/* Friends List Table */}
                <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
                    <h2 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">Daftar Teman (Referred Users)</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-gray-100 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                                    <th className="pb-3 font-medium">User Email</th>
                                    <th className="pb-3 font-medium">Tanggal</th>
                                    <th className="pb-3 font-medium">Status</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {referrals.map((user, idx) => (
                                    <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-700/50">
                                        <td className="py-4 font-medium text-gray-900 dark:text-white">{user.email}</td>
                                        <td className="py-4 text-gray-500 dark:text-gray-400">{user.date}</td>
                                        <td className="py-4">
                                            {user.status === 'paid' ? (
                                                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle className="mr-1 h-3 w-3" /> Sudah Top-up
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                                    Bergabung
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Sidebar: Leaderboard */}
            <div className="lg:col-span-1 space-y-8">
                <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
                    <div className="mb-6 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Top Affiliator
                        </h3>
                        <span className="text-xs text-gray-500">Minggu Ini</span>
                    </div>
                    
                    <div className="space-y-4">
                        {[
                            { name: 'Rizky M.', points: '1,250 Token', rank: 1 },
                            { name: 'Sarah A.', points: '980 Token', rank: 2 },
                            { name: 'Dimas K.', points: '850 Token', rank: 3 },
                            { name: 'Budi S.', points: '620 Token', rank: 4 },
                            { name: 'Fani P.', points: '450 Token', rank: 5 },
                        ].map((user) => (
                            <div key={user.rank} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-white ${
                                        user.rank === 1 ? 'bg-yellow-400' :
                                        user.rank === 2 ? 'bg-gray-400' :
                                        user.rank === 3 ? 'bg-orange-400' :
                                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {user.rank}
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                                </div>
                                <span className="text-sm font-bold text-purple-600 dark:text-purple-400">{user.points}</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 rounded-xl bg-purple-50 p-4 text-center text-xs text-purple-700 dark:bg-purple-900/20 dark:text-purple-300">
                        <TrendingUp className="mx-auto mb-2 h-5 w-5" />
                        Ajak 5 teman minggu ini untuk masuk leaderboard!
                    </div>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-lg">
                    <h3 className="mb-2 font-bold text-lg">Butuh Bantuan?</h3>
                    <p className="mb-4 text-sm text-gray-400">
                        Bingung cara promosi yang efektif? Baca panduan lengkap kami.
                    </p>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/10 py-2 text-sm font-semibold backdrop-blur-sm hover:bg-white/20">
                        Baca Panduan <ArrowRight className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
