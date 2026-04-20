import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTokenStore } from '../store/useTokenStore';
import { useUserStore } from '../store/useUserStore';
import { useAlert } from '../context/AlertContext';
import { useTheme } from '../hooks/useTheme';
import { ArrowLeft, User, Mail, CreditCard, Edit2, RefreshCw, X, Check, Gem, Zap, Crown, Share2, Copy, Users, LogOut, Gift, Send, Loader2, Moon, Sun, Clock, Eye, EyeOff, Upload, ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { authorizedFetch } from '../lib/api-client';

export default function Profile() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { 
    isLoggedIn, name, avatar, email, referralCode, affiliateStats,
    logout, updateName, generateRandomAvatar, login, register 
  } = useUserStore();
  const { tokens, transferToken, fetchBalance } = useTokenStore();
  const { showAlert, showConfirm } = useAlert();
  const { theme, toggleTheme } = useTheme();
  
  // Auth State
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authRefCode, setAuthRefCode] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [showAuthConfirm, setShowAuthConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nameSuggestion, setNameSuggestion] = useState('');
  
  // Profile State
  const [isEditingName, setIsEditingName] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [newName, setNewName] = useState(name);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [walletTab, setWalletTab] = useState<'topup' | 'transfer' | 'history'>('topup');
  const [welcomeMessage, setWelcomeMessage] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Avatar & Background
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [coverBg, setCoverBg] = useState('from-blue-600 to-purple-600');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const avatarUploadRef = useRef<HTMLInputElement>(null);
  const coverUploadRef = useRef<HTMLInputElement>(null);

  const bgOptions = [
    { label: 'Biru-Ungu', value: 'from-blue-600 to-purple-600' },
    { label: 'Hijau-Teal', value: 'from-green-500 to-teal-500' },
    { label: 'Oranye-Merah', value: 'from-orange-500 to-red-500' },
    { label: 'Pink-Ungu', value: 'from-pink-500 to-purple-500' },
    { label: 'Kuning-Oranye', value: 'from-yellow-400 to-orange-500' },
    { label: 'Biru-Cyan', value: 'from-blue-500 to-cyan-400' },
    { label: 'Indigo-Biru', value: 'from-indigo-600 to-blue-400' },
    { label: 'Abu-Hitam', value: 'from-gray-700 to-gray-900' },
  ];
  
  // Transfer State
  const [transferReceiver, setTransferReceiver] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState('');
  const [topupStatus, setTopupStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [topupData, setTopupData] = useState<null | {
    transactionId: string;
    referenceNo?: string;
    qrImageUrl?: string;
    qrString?: string;
    amount: number;
    tokens: number;
    packageName: string;
  }>(null);

  // Handle URL Ref Code
  useEffect(() => {
    const refCode = searchParams.get('ref');
    const action = searchParams.get('action');

    if (refCode && !isLoggedIn) {
        localStorage.setItem('genz_ref_code', refCode);
        setAuthRefCode(refCode); // Auto-fill the field
        setAuthMode('register'); // Switch to register tab
    }

    if (action === 'topup') {
        setIsWalletModalOpen(true);
        setWalletTab('topup');
    }
  }, [searchParams, isLoggedIn]);

  // Fetch Balance on Login
  useEffect(() => {
    if (isLoggedIn) {
        fetchBalance();
    }
  }, [isLoggedIn, fetchBalance]);

  const handleAuthEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAuthEmail(val);
    // Auto-extract name from email for register mode
    if (authMode === 'register') {
      const atIdx = val.indexOf('@');
      if (atIdx > 0) {
        const localPart = val.slice(0, atIdx);
        // Replace dots, underscores, hyphens with spaces, capitalize each word
        const suggested = localPart
          .replace(/[._\-]+/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
        setNameSuggestion(suggested);
      } else {
        setNameSuggestion('');
      }
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!authEmail.trim() || !authPassword.trim()) {
        setError('Email dan Password harus diisi');
        setLoading(false);
        return;
    }

    if (authMode === 'register' && authPassword !== authConfirmPassword) {
        setError('Password dan konfirmasi password tidak cocok');
        setLoading(false);
        return;
    }

    let result;
    if (authMode === 'login') {
        result = await login(authEmail, authPassword);
    } else {
        if (!authName.trim()) {
            setError('Nama harus diisi untuk pendaftaran');
            setLoading(false);
            return;
        }
        const refCode = authRefCode.trim() || searchParams.get('ref') || localStorage.getItem('genz_ref_code');
        result = await register(authEmail, authPassword, authName, refCode);
    }
    
    if (result.success) {
        showAlert(`Berhasil ${authMode === 'login' ? 'Masuk' : 'Daftar'}!`, 'success');
        
        const hasBonus = localStorage.getItem('genz_device_bonus');
        if (!hasBonus && authMode === 'register') {
            localStorage.setItem('genz_device_bonus', 'true');
            setWelcomeMessage(true);
            setTimeout(() => setWelcomeMessage(false), 5000); 
        }
    } else {
        setError(result.error || 'Gagal. Pastikan data benar.');
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

  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    setShowAvatarMenu(false);
    try {
      await generateRandomAvatar();
    } catch (error) {
      console.error('Failed to generate avatar:', error);
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setShowAvatarMenu(false);

    if (file.size > 2 * 1024 * 1024) {
      showAlert('Ukuran file maksimal 2MB', 'error');
      return;
    }

    try {
      const { id } = useUserStore.getState();
      const ext = file.name.split('.').pop();
      const path = `avatars/${id}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', id);
      useUserStore.setState({ avatar: publicUrl });
      showAlert('Avatar berhasil diperbarui!', 'success');
    } catch (err: any) {
      showAlert('Gagal upload avatar: ' + err.message, 'error');
    }
    if (avatarUploadRef.current) avatarUploadRef.current.value = '';
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showAlert('Ukuran file cover maksimal 5MB', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCoverImage(ev.target?.result as string);
      setShowBgPicker(false);
    };
    reader.readAsDataURL(file);
    if (coverUploadRef.current) coverUploadRef.current.value = '';
  };

  const handleTopup = async (amount: number, price: number, packageName: string) => {
    setTopupLoading(true);
    setTopupError('');
    setTopupStatus('IDLE');
    setTopupData(null);

    try {
      const response = await authorizedFetch('/api/tools/qris/topup/register', {
        method: 'POST',
        body: JSON.stringify({
          amount: price,
          tokens: amount,
          packageName
        })
      });
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Gagal membuat QRIS');
      }
      setTopupData(data.data);
      setTopupStatus('PENDING');
    } catch (err: any) {
      setTopupError(err.message || 'Gagal membuat QRIS');
      showAlert(err.message || 'Gagal membuat QRIS', 'error');
    } finally {
      setTopupLoading(false);
    }
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

  useEffect(() => {
    if (!isWalletModalOpen) {
      setTopupLoading(false);
      setTopupError('');
      setTopupStatus('IDLE');
      setTopupData(null);
    }
  }, [isWalletModalOpen]);

  useEffect(() => {
    if (!topupData?.transactionId || topupStatus !== 'PENDING') return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        const response = await authorizedFetch(`/api/tools/qris/topup/status?transactionId=${topupData.transactionId}`);
        const result = await response.json();
        if (!result.success) return;
        const status = String(result.data?.status || '').toUpperCase();
        if (!active) return;
        if (status === 'SUCCESS' || status === 'PAID') {
          setTopupStatus('SUCCESS');
          showAlert('Pembayaran berhasil. Token masuk otomatis.', 'success');
          await fetchBalance();
          clearInterval(interval);
        } else if (status === 'FAILED' || status === 'FAIL' || status === 'EXPIRED') {
          setTopupStatus('FAILED');
          showAlert('Pembayaran gagal atau kedaluwarsa.', 'error');
          clearInterval(interval);
        }
      } catch {
        if (!active) return;
      }
    }, 5000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [topupData?.transactionId, topupStatus, fetchBalance, showAlert]);

  if (!isLoggedIn) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 dark:bg-gray-900 transition-colors duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 transition-colors duration-200">
                <div className="text-center mb-6">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                        <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {authMode === 'login' ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {authMode === 'login' ? 'Silakan login untuk melanjutkan' : 'Daftar untuk akses fitur creator'}
                    </p>
                </div>
                
                {/* Tabs */}
                <div className="flex rounded-lg bg-gray-100 p-1 mb-6 dark:bg-gray-700">
                    <button
                        onClick={() => setAuthMode('login')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                            authMode === 'login' 
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        Masuk
                    </button>
                    <button
                        onClick={() => setAuthMode('register')}
                        className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                            authMode === 'register' 
                            ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' 
                            : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                        }`}
                    >
                        Daftar
                    </button>
                </div>

                <form onSubmit={handleAuth} className="space-y-4">
                    {authMode === 'register' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap</label>
                                <input
                                    type="text"
                                    value={authName}
                                    onChange={(e) => setAuthName(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Nama Lengkap"
                                />
                                {nameSuggestion && !authName && (
                                    <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 dark:border-blue-700 dark:bg-blue-900/20">
                                        <span className="text-xs text-blue-600 dark:text-blue-400">
                                            Saran: <span className="font-semibold">{nameSuggestion}</span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setAuthName(nameSuggestion)}
                                            className="ml-auto rounded-md bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white hover:bg-blue-700 transition"
                                        >
                                            Gunakan nama ini
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    ID Affiliator (Opsional)
                                    {searchParams.get('ref') && (
                                        <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                            ✓ Terisi otomatis
                                        </span>
                                    )}
                                </label>
                                <input
                                    type="text"
                                    value={authRefCode}
                                    onChange={(e) => setAuthRefCode(e.target.value)}
                                    readOnly={!!searchParams.get('ref')}
                                    className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white ${
                                        searchParams.get('ref')
                                            ? 'bg-green-50 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300 cursor-not-allowed'
                                            : 'border-gray-300 bg-white'
                                    }`}
                                    placeholder="Contoh: genz-12345"
                                />
                            </div>
                        </>
                    )}
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input
                            type="email"
                            value={authEmail}
                            onChange={handleAuthEmailChange}
                            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            placeholder="email@contoh.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showAuthPassword ? 'text' : 'password'}
                                value={authPassword}
                                onChange={(e) => setAuthPassword(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 px-4 py-2 pr-10 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                placeholder="******"
                            />
                            <button type="button" onClick={() => setShowAuthPassword(!showAuthPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                {showAuthPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    {authMode === 'register' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Konfirmasi Password</label>
                            <div className="relative">
                                <input
                                    type={showAuthConfirm ? 'text' : 'password'}
                                    value={authConfirmPassword}
                                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                                    className={`w-full rounded-lg border px-4 py-2 pr-10 focus:outline-none dark:bg-gray-700 dark:text-white ${
                                        authConfirmPassword && authPassword !== authConfirmPassword
                                            ? 'border-red-400 focus:border-red-500 dark:border-red-500'
                                            : 'border-gray-300 focus:border-blue-500 dark:border-gray-600'
                                    }`}
                                    placeholder="Ulangi password"
                                />
                                <button type="button" onClick={() => setShowAuthConfirm(!showAuthConfirm)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                    {showAuthConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            {authConfirmPassword && authPassword !== authConfirmPassword && (
                                <p className="mt-1 text-xs text-red-500">Password tidak cocok</p>
                            )}
                        </div>
                    )}

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-70"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (authMode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
                    </button>
                </form>

                {/* Divider */}
                <div className="my-4 flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">atau lanjutkan dengan</span>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                </div>

                {/* Social Login Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {/* Google */}
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: 'google',
                          options: {
                            redirectTo: `${window.location.origin}/profile`,
                            queryParams: { access_type: 'offline', prompt: 'consent' }
                          }
                        });
                        if (error) { showAlert('Google login belum dikonfigurasi. Gunakan email.', 'error'); setLoading(false); }
                      } catch { setLoading(false); }
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    <span className="hidden sm:inline">Google</span>
                  </button>

                  {/* Facebook */}
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await supabase.auth.signInWithOAuth({
                          provider: 'facebook',
                          options: { redirectTo: window.location.origin }
                        });
                      } catch { setLoading(false); }
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="hidden sm:inline">Facebook</span>
                  </button>

                  {/* GitHub */}
                  <button
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await supabase.auth.signInWithOAuth({
                          provider: 'github',
                          options: { redirectTo: window.location.origin }
                        });
                      } catch { setLoading(false); }
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4 flex-shrink-0" fill="currentColor">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    <span className="hidden sm:inline">GitHub</span>
                  </button>
                </div>

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
                  {/* Cover Background */}
                  <div
                    className={`relative h-32 md:h-40 ${coverImage ? '' : `bg-gradient-to-r ${coverBg}`}`}
                    style={coverImage ? { backgroundImage: `url(${coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                  >
                    <button
                      onClick={() => setShowBgPicker(!showBgPicker)}
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/50 transition"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Ganti Latar
                    </button>

                    {/* Background Picker */}
                    {showBgPicker && (
                      <div className="absolute bottom-12 right-3 z-20 rounded-xl bg-white p-3 shadow-xl dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                        <p className="mb-2 text-xs font-semibold text-gray-600 dark:text-gray-300">Pilih Warna Latar</p>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                          {bgOptions.map(bg => (
                            <button
                              key={bg.value}
                              onClick={() => { setCoverBg(bg.value); setCoverImage(null); setShowBgPicker(false); }}
                              className={`h-8 w-8 rounded-lg bg-gradient-to-br ${bg.value} ring-2 transition hover:scale-110 ${!coverImage && coverBg === bg.value ? 'ring-white' : 'ring-transparent'}`}
                              title={bg.label}
                            />
                          ))}
                        </div>
                        <button
                          onClick={() => { coverUploadRef.current?.click(); setShowBgPicker(false); }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
                        >
                          <Upload className="h-3.5 w-3.5" /> Upload Foto Cover
                        </button>
                      </div>
                    )}

                    {/* Hidden cover upload input */}
                    <input
                      ref={coverUploadRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                  </div>

                  <div className="px-6 pb-6 md:px-8">
                    {/* Avatar row — sits half on cover, half on white */}
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-end sm:gap-6 -mt-12 sm:-mt-14">
                      {/* Avatar + controls */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`}
                          alt="Profile"
                          onError={(e) => { e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name || 'user'}` }}
                          className="h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-lg dark:border-gray-800 sm:h-28 sm:w-28"
                        />
                        {/* Avatar action buttons */}
                        <div className="absolute -bottom-1 -right-1 flex gap-1">
                          <button
                            onClick={handleGenerateAvatar}
                            disabled={isGeneratingAvatar}
                            title="Acak Avatar"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-blue-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 text-blue-600 dark:text-blue-400 ${isGeneratingAvatar ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={() => avatarUploadRef.current?.click()}
                            title="Upload Foto"
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md hover:bg-green-50 dark:bg-gray-700 dark:hover:bg-gray-600 transition border border-gray-200 dark:border-gray-600"
                          >
                            <Upload className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                          </button>
                        </div>
                        <input
                          ref={avatarUploadRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarUpload}
                        />
                      </div>

                      {/* Name + email + ID — pushed down on mobile, inline on desktop */}
                      <div className="flex-1 min-w-0 text-center sm:text-left pb-1">
                        {isEditingName ? (
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <input
                              type="text"
                              value={newName}
                              onChange={e => setNewName(e.target.value)}
                              className="rounded-lg border border-gray-300 px-3 py-1 text-lg font-bold focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            <button onClick={handleSaveName} className="rounded-full bg-green-100 p-1.5 text-green-600 hover:bg-green-200">
                              <Check className="h-4 w-4" />
                            </button>
                            <button onClick={() => setIsEditingName(false)} className="rounded-full bg-red-100 p-1.5 text-red-600 hover:bg-red-200">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center sm:justify-start gap-2">
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white truncate">{name}</h1>
                            <button onClick={() => setIsEditingName(true)} className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 truncate">{email}</p>
                        <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-1 dark:bg-gray-700">
                          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">ID:</span>
                          <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 select-all">{referralCode}</span>
                          <button onClick={() => copyToClipboard(referralCode)} className="text-gray-400 hover:text-blue-500" title="Salin ID">
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => { setIsWalletModalOpen(true); setWalletTab('topup'); }}
                          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 px-5 py-2.5 font-bold text-white shadow-lg transition hover:scale-105"
                        >
                          <Gem className="h-4 w-4" /> Top Up
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center justify-center rounded-xl bg-red-50 px-3 py-2.5 text-red-500 hover:bg-red-100 dark:bg-red-900/20"
                          title="Logout"
                        >
                          <LogOut className="h-4 w-4" />
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
                            onClick={() => { setIsWalletModalOpen(true); setWalletTab('topup'); }}
                            className="w-full rounded-lg bg-yellow-400 py-2 text-sm font-bold text-black shadow-lg transition hover:bg-yellow-300"
                        >
                            <CreditCard className="mr-1 inline h-4 w-4" /> Kelola Token & Transaksi
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

      {/* Unified Wallet Modal */}
      {isWalletModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-gray-800 animate-in fade-in zoom-in duration-200 flex flex-col md:flex-row h-[600px] md:h-[500px]">
            
            {/* Sidebar / Tabs */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-gray-900 p-4 flex flex-col gap-2 border-r border-gray-100 dark:border-gray-700">
                <div className="mb-6 px-2 pt-2">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <CreditCard className="h-6 w-6 text-yellow-500" /> Wallet
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Kelola token & transaksi</p>
                </div>

                <button 
                    onClick={() => setWalletTab('topup')}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        walletTab === 'topup' 
                        ? 'bg-yellow-500 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                    <Gem className="h-4 w-4" /> Top Up Token
                </button>
                <button 
                    onClick={() => setWalletTab('transfer')}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        walletTab === 'transfer' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                    <Send className="h-4 w-4" /> Kirim Token
                </button>
                <button 
                    onClick={() => setWalletTab('history')}
                    className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                        walletTab === 'history' 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                >
                    <Clock className="h-4 w-4" /> Riwayat
                </button>

                <div className="mt-auto">
                    <div className="rounded-xl bg-gray-900 p-4 text-center text-white dark:bg-black/30">
                        <p className="text-xs opacity-70">Saldo Kamu</p>
                        <p className="text-2xl font-bold text-yellow-400">{tokens}</p>
                        <p className="text-[10px] opacity-50">Token</p>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-white dark:bg-gray-800 flex flex-col">
                <button 
                    onClick={() => setIsWalletModalOpen(false)}
                    className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                    <X className="h-6 w-6" />
                </button>

                <div className="flex-1 overflow-y-auto p-6 md:p-8">
                    
                    {/* TOP UP TAB */}
                    {walletTab === 'topup' && (
                        <div className="animate-in slide-in-from-right-4 duration-200">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Pilih Paket Token</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Metode pembayaran otomatis via QRIS.</p>
                            
                            {topupData ? (
                                <div className="space-y-4 text-center">
                                    <div className="flex flex-col items-center gap-3 bg-gray-50 dark:bg-gray-900 p-6 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                                        {topupData.qrImageUrl ? (
                                            <img src={topupData.qrImageUrl} alt="QRIS" className="h-48 w-48 rounded-lg bg-white p-2 shadow-sm" />
                                        ) : (
                                            <div className="rounded-xl bg-gray-200 px-4 py-6 text-xs text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                                {topupData.qrString || 'QR belum tersedia'}
                                            </div>
                                        )}
                                        {topupData.qrString && (
                                            <button
                                                onClick={() => copyToClipboard(topupData.qrString || '')}
                                                className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                                            >
                                                Salin Kode QR
                                            </button>
                                        )}
                                        <div className="text-sm font-semibold">
                                            Status: <span className={
                                                topupStatus === 'SUCCESS' ? 'text-green-500' :
                                                topupStatus === 'FAILED' ? 'text-red-500' :
                                                'text-yellow-500'
                                            }>{topupStatus}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setTopupData(null);
                                            setTopupStatus('IDLE');
                                        }}
                                        className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white"
                                    >
                                        &larr; Pilih Paket Lain
                                    </button>
                                </div>
                            ) : (
                                <div className="grid gap-4">
                                    <button 
                                        onClick={() => handleTopup(13, 10000, 'Starter Pack')}
                                        disabled={topupLoading}
                                        className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:border-yellow-500 hover:bg-yellow-50 dark:border-gray-700 dark:hover:bg-yellow-900/10 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 font-bold text-yellow-700 dark:bg-yellow-900 dark:text-yellow-400">13</div>
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900 dark:text-white">Starter</div>
                                                <div className="text-xs text-gray-500">10 + 3 Bonus</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white">Rp10k</div>
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleTopup(65, 50000, 'Creator Pack')}
                                        disabled={topupLoading}
                                        className="relative flex items-center justify-between rounded-xl border-2 border-yellow-500 bg-yellow-50/50 p-4 shadow-sm dark:bg-yellow-900/10 transition-all"
                                    >
                                        <div className="absolute -top-2.5 left-4 bg-yellow-500 px-2 py-0.5 text-[10px] font-bold text-white rounded-full">POPULAR</div>
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500 font-bold text-white">65</div>
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900 dark:text-white">Creator</div>
                                                <div className="text-xs text-gray-500">50 + 15 Bonus</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white">Rp50k</div>
                                    </button>

                                    <button 
                                        onClick={() => handleTopup(130, 100000, 'Agency Pack')}
                                        disabled={topupLoading}
                                        className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:border-purple-500 hover:bg-purple-50 dark:border-gray-700 dark:hover:bg-purple-900/10 transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 font-bold text-purple-700 dark:bg-purple-900 dark:text-purple-400">130</div>
                                            <div className="text-left">
                                                <div className="font-bold text-gray-900 dark:text-white">Agency</div>
                                                <div className="text-xs text-gray-500">100 + 30 Bonus</div>
                                            </div>
                                        </div>
                                        <div className="font-bold text-gray-900 dark:text-white">Rp100k</div>
                                    </button>
                                </div>
                            )}
                            {topupLoading && <div className="mt-4 text-center text-sm text-gray-500 animate-pulse">Memproses permintaan...</div>}
                        </div>
                    )}

                    {/* TRANSFER TAB */}
                    {walletTab === 'transfer' && (
                        <div className="animate-in slide-in-from-right-4 duration-200">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Kirim Token</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Transfer token ke sesama pengguna GenzTools.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID Penerima / Kode Unik</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input 
                                            type="text" 
                                            value={transferReceiver}
                                            onChange={(e) => setTransferReceiver(e.target.value)}
                                            placeholder="Contoh: GENZ8821"
                                            className="w-full rounded-lg border border-gray-300 pl-10 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white uppercase"
                                        />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-400">Masukkan Kode Unik pengguna tujuan.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Jumlah Token</label>
                                    <div className="relative">
                                        <Gem className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <input 
                                            type="number" 
                                            value={transferAmount}
                                            onChange={(e) => setTransferAmount(e.target.value)}
                                            placeholder="Min. 1"
                                            className="w-full rounded-lg border border-gray-300 pl-10 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
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
                                    Kirim Token
                                </button>
                            </div>
                        </div>
                    )}

                    {/* HISTORY TAB */}
                    {walletTab === 'history' && (
                        <div className="animate-in slide-in-from-right-4 duration-200">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Riwayat Transaksi</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Catatan masuk & keluar token.</p>
                            
                            <div className="space-y-3">
                                {/* Placeholder History Items */}
                                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                                            <Gem className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Top Up Creator Pack</p>
                                            <p className="text-xs text-gray-500">20 Feb 2026</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-green-600">+65</span>
                                </div>
                                <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                            <Send className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">Kirim ke BUDI99</p>
                                            <p className="text-xs text-gray-500">19 Feb 2026</p>
                                        </div>
                                    </div>
                                    <span className="font-bold text-red-600">-10</span>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

