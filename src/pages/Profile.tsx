import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTokenStore } from '../store/useTokenStore';
import { useUserStore } from '../store/useUserStore';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../hooks/useTheme';
import { ArrowLeft, User, Mail, CreditCard, Edit2, RefreshCw, X, Check, Gem, Zap, Crown, Share2, Copy, Users, LogOut, Gift, Send, Loader2, Moon, Sun } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    isLoggedIn, name, avatar, email, referralCode, affiliateStats,
    logout, updateName, generateRandomAvatar, loginOrRegister 
  } = useUserStore();
  const { tokens, addToken, transferToken } = useTokenStore();
  const { showAlert, showConfirm } = useAlert();
  const { theme, toggleTheme } = useTheme();
  
  // Auth State
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Profile State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  
  // Transfer State
  const [transferReceiver, setTransferReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');

  // Handle URL Ref Code
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode && !isLoggedIn) {
        // Logic to store refCode temporarily until registration
        localStorage.setItem('genz_ref_code', refCode);
    }
  }, [searchParams, isLoggedIn]);

  const handleLoginRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!authName.trim()) {
        setError('Nama harus diisi');
        setLoading(false);
        return;
    }

    const refCode = searchParams.get('ref') || localStorage.getItem('genz_ref_code');
    const result = await loginOrRegister(authEmail, authName, refCode);
    
    if (result.success) {
        // Login Success & Profile Created/Loaded
        showAlert('Berhasil Masuk!', 'success');
        
        // Anti-Spam Check: Only 1 bonus per device
        const hasBonus = localStorage.getItem('genz_device_bonus');
        if (!hasBonus) {
            localStorage.setItem('genz_device_bonus', 'true');
            setWelcomeMessage(true);
            setTimeout(() => setWelcomeMessage(false), 5000); 
        }
    } else {
        setError(result.error || 'Gagal login/daftar. Cek koneksi atau email.');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    showConfirm("Yakin ingin keluar dari akun?", () => {
        logout();
        navigate('/');
        showAlert("Berhasil logout!", 'success');
    }, { title: "Konfirmasi Logout", confirmText: "Ya, Keluar" });
  };

  const handleSaveName = () => {
    updateName(newName);
    setIsEditingName(false);
  };

  const handleTopup = (amount: number, price: string) => {
    addToken(amount);
    alert(`Berhasil top-up ${amount} Token! (${price})`);
    setIsTopupModalOpen(false);
  };

  const handleTransfer = () => {
    const amount = parseInt(transferAmount);
    
    if (isNaN(amount) || amount <= 0) {
        showAlert('Jumlah token tidak valid', 'error');
        return;
    }
    
    showConfirm(
        `Kirim ${amount} token ke ${transferReceiver}?`,
        async () => {
            const result = await transferToken(transferReceiver, amount, transferMessage);
            if (result.success) {
                showAlert(result.message, 'success');
                setIsTransferModalOpen(false);
                setTransferReceiver('');
                setTransferAmount('');
                setTransferMessage('');
            } else {
                showAlert(result.message, 'error');
            }
        },
        { title: "Konfirmasi Transfer", confirmText: "Kirim Sekarang", cancelText: "Batal" }
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showAlert('Kode berhasil disalin ke clipboard!', 'success');
  };

  if (!isLoggedIn) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 transition-colors duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 transition-colors duration-200">
                <div className="text-center mb-8">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Profil GenzTools
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Silakan login untuk melihat profil Anda.
                    </p>
                </div>
                
                <button 
                    onClick={() => navigate('/login')} 
                    className="w-full flex items-center justify-center rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700"
                >
                    Login Sekarang
                </button>
                
                <button onClick={() => navigate('/')} className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                    Kembali ke Dashboard
                </button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 dark:bg-gray-900 md:p-8 transition-colors duration-200">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-6">
            <button 
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Dashboard
            </button>

            {/* Theme Toggle - Logged In View */}
            <button 
                onClick={toggleTheme}
                className="rounded-full bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
        </div>

        {/* Welcome Notification */}
        {welcomeMessage && (
            <div className="mb-6 animate-bounce rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 p-4 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <Gift className="h-8 w-8" />
                    <div>
                        <h3 className="font-bold text-lg">Selamat datang, genz creator!</h3>
                        <p>Kamu baru saja mendapatkan 10 koin gratis untuk mencoba semua tools kami. Selamat berkarya!</p>
                    </div>
                </div>
            </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column: Profile & Actions */}
            <div className="lg:col-span-2 space-y-8">
                {/* Profile Card */}
                <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800 transition-colors duration-200">
                  <div className="h-32 bg-gradient-to-r from-blue-600 to-purple-600 md:h-40"></div>
                  <div className="relative px-6 pb-8 md:px-8">
                    <div className="absolute -top-16 flex flex-col items-center md:-top-16 md:items-start">
                      <div className="relative group">
                        <img 
                          src={avatar} 
                          alt="Profile" 
                          className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover shadow-md dark:border-gray-800 dark:bg-gray-700"
                        />
                        <button 
                          onClick={generateRandomAvatar}
                          className="absolute bottom-2 right-2 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600"
                          title="Acak Avatar"
                        >
                          <RefreshCw className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-20 flex flex-col justify-between gap-6 md:mt-4 md:ml-40 md:flex-row md:items-center">
                      <div>
                        {isEditingName ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-1 text-lg font-bold focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <button onClick={handleSaveName} className="rounded-full bg-green-100 p-2 text-green-600 hover:bg-green-200">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setIsEditingName(false)} className="rounded-full bg-red-100 p-2 text-red-600 hover:bg-red-200">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{name}</h1>
                            <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <p className="text-sm text-gray-500 dark:text-gray-400">{email} • Gen-Z Creator</p>
                      </div>

                      <div className="flex gap-3">
                          <button
                            onClick={() => setIsTopupModalOpen(true)}
                            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-6 py-3 font-bold text-white shadow-lg transition transform hover:scale-105 hover:shadow-xl"
                          >
                            <Gem className="h-5 w-5" />
                            Top Up
                          </button>
                          <button
                            onClick={handleLogout}
                            className="flex items-center justify-center rounded-xl bg-red-50 px-4 py-3 text-red-500 hover:bg-red-100 dark:bg-red-900/20"
                            title="Logout"
                          >
                            <LogOut className="h-5 w-5" />
                          </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Affiliate Dashboard */}
                <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 transition-colors duration-200">
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="h-6 w-6 text-purple-500" />
                            Affiliate Program
                        </h2>
                        <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                            Komisi 20%
                        </span>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Kode Referral Kamu</p>
                            <div className="mt-2 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                                <span className="font-mono text-xl font-bold tracking-wider text-gray-900 dark:text-white">{referralCode}</span>
                                <button onClick={() => copyToClipboard(referralCode)} className="text-gray-400 hover:text-blue-500">
                                    <Copy className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
                            <p className="text-sm text-gray-500 dark:text-gray-400">Link Share Otomatis</p>
                            <div className="mt-2 flex items-center justify-between rounded-lg bg-white p-3 shadow-sm dark:bg-gray-800">
                                <span className="truncate text-xs text-gray-500 dark:text-gray-400 mr-2">genztools.com/profile?ref={referralCode}</span>
                                <button onClick={() => copyToClipboard(`https://genztools.com/profile?ref=${referralCode}`)} className="text-gray-400 hover:text-blue-500">
                                    <Share2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">
                        <div className="rounded-xl bg-green-50 p-4 text-center dark:bg-green-900/20">
                            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{affiliateStats.friendsJoined}</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Teman Bergabung</p>
                        </div>
                        <div className="rounded-xl bg-blue-50 p-4 text-center dark:bg-blue-900/20">
                            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{affiliateStats.totalBonusEarned}</p>
                            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Bonus Token</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Stats */}
            <div className="space-y-6">
                <div className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-6 text-white shadow-xl">
                    <h3 className="mb-4 flex items-center text-lg font-semibold">
                        <CreditCard className="mr-2 h-5 w-5 text-yellow-400" />
                        Saldo Token
                    </h3>
                    <div className="flex flex-col items-center justify-center py-6">
                        <span className="text-6xl font-black text-yellow-400">{tokens}</span>
                        <span className="mt-2 text-sm font-medium opacity-70">Token Tersedia</span>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setIsTopupModalOpen(true)}
                            className="w-full rounded-lg bg-white/10 py-2 text-sm font-semibold backdrop-blur-sm transition hover:bg-white/20"
                        >
                            Riwayat Transaksi
                        </button>
                        <button 
                            onClick={() => setIsTransferModalOpen(true)}
                            className="w-full rounded-lg bg-yellow-400 py-2 text-sm font-bold text-black shadow-lg transition hover:bg-yellow-300"
                        >
                            <Send className="mr-1 inline h-4 w-4" /> Kirim Token
                        </button>
                    </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 transition-colors duration-200">
                    <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Status Member</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Paket Saat Ini</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">Member</span>
                        </div>
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Valid Sampai</span>
                            <span className="font-medium text-gray-900 dark:text-white">Lifetime</span>
                        </div>
                        <div className="rounded-lg bg-yellow-50 p-3 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-200">
                            <p><strong>Tips:</strong> Undang teman untuk dapat token gratis tanpa batas!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Transfer Token Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800 animate-in fade-in zoom-in duration-200">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Send className="h-5 w-5 text-blue-500" /> Kirim Token
                    </h2>
                    <button onClick={() => setIsTransferModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Penerima (Kode Referral / Email)</label>
                        <input 
                            type="text" 
                            value={transferReceiver}
                            onChange={(e) => setTransferReceiver(e.target.value)}
                            placeholder="Contoh: USER123"
                            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Token</label>
                        <input 
                            type="number" 
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            placeholder="Min. 1 Token"
                            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pesan (Opsional)</label>
                        <textarea 
                            value={transferMessage}
                            onChange={(e) => setTransferMessage(e.target.value)}
                            placeholder="Tulis pesan singkat..."
                            rows={2}
                            className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                    
                    <button 
                        onClick={handleTransfer}
                        disabled={!transferReceiver || !transferAmount}
                        className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed dark:disabled:bg-gray-700"
                    >
                        Kirim Token Sekarang
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Luxury Dark Mode Top-up Modal */}
      {isTopupModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-gray-900 text-white shadow-2xl border border-gray-700 animate-in fade-in zoom-in duration-200">
            <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-8">
              <button 
                onClick={() => setIsTopupModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
              
              <div className="mb-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 ring-4 ring-yellow-500/10">
                  <Crown className="h-8 w-8 text-yellow-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Top Up Token</h2>
                <p className="text-gray-400">Pilih paket token eksklusif Anda</p>
              </div>

              <div className="space-y-4">
                {/* Package 1: 10k */}
                <button 
                  onClick={() => handleTopup(13, 'Rp10.000')}
                  className="group relative flex w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-yellow-500/50 hover:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700 font-bold text-gray-300 group-hover:bg-yellow-500 group-hover:text-black">
                      13
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg">Starter Pack</div>
                      <div className="text-xs text-gray-400">10 Token + <span className="text-yellow-400 font-bold">3 Bonus</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">Rp10.000</div>
                    <div className="text-[10px] text-green-400">Hemat & Efisien</div>
                  </div>
                </button>

                {/* Package 2: 50k */}
                <button 
                  onClick={() => handleTopup(65, 'Rp50.000')}
                  className="group relative flex w-full items-center justify-between rounded-xl border border-yellow-600 bg-gray-800 p-4 shadow-lg shadow-yellow-900/20 transition-all hover:bg-gray-700"
                >
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-yellow-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-500 font-bold text-black">
                      65
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg text-yellow-400">Creator Pack</div>
                      <div className="text-xs text-gray-400">50 Token + <span className="text-yellow-400 font-bold">15 Bonus</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">Rp50.000</div>
                    <div className="text-[10px] text-yellow-400">Best Value</div>
                  </div>
                </button>

                {/* Package 3: 100k */}
                <button 
                  onClick={() => handleTopup(130, 'Rp100.000')}
                  className="group relative flex w-full items-center justify-between rounded-xl border border-gray-700 bg-gray-800/50 p-4 transition-all hover:border-purple-500/50 hover:bg-gray-800"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-700 font-bold text-gray-300 group-hover:bg-purple-500 group-hover:text-white">
                      130
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-lg">Agency Pack</div>
                      <div className="text-xs text-gray-400">100 Token + <span className="text-purple-400 font-bold">30 Bonus</span></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">Rp100.000</div>
                    <div className="text-[10px] text-purple-400">Maximum Power</div>
                  </div>
                </button>
              </div>

              <p className="mt-6 text-center text-xs text-gray-500">
                Secure payment powered by Midtrans. Token langsung masuk otomatis.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
