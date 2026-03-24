import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useUserStore } from '@/store/useUserStore';
import { useTokenStore } from '@/store/useTokenStore';
import { Mail, Lock, Eye, EyeOff, Gift } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { syncProfile } = useUserStore();
  const { fetchBalance } = useTokenStore();

  useEffect(() => {
    // Check if redirected from register
    const params = new URLSearchParams(location.search);
    if (params.get('registered') === 'true') {
      setSuccessMsg('Registrasi berhasil! Silakan login.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const translateLoginError = (msg: string) => {
      if (msg.includes('Email not confirmed')) return 'Email belum dikonfirmasi. Hubungi admin atau coba daftar ulang.';
      if (msg.includes('Invalid login credentials')) return 'Email atau password salah.';
      if (msg.includes('Too many requests')) return 'Terlalu banyak percobaan. Tunggu beberapa menit.';
      if (msg.includes('Failed to fetch') || msg.includes('fetch failed')) return 'Tidak dapat terhubung ke server.';
      return msg;
    };

    try {
      let userData: any = null;
      let sessionData: any = null;

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const data = await response.json();

        if (!data.success) {
          throw new Error(translateLoginError(data.error || 'Login gagal'));
        }
        userData = data.data.user;
        sessionData = data.data.session;
      } catch (backendErr: any) {
        // Jika backend timeout/unreachable, fallback ke Supabase client langsung
        if (backendErr.name === 'AbortError' || backendErr.message?.includes('fetch') || backendErr.message?.includes('network')) {
          console.warn('Backend unreachable, fallback to Supabase client');
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
          if (loginError) throw new Error(translateLoginError(loginError.message));
          const { data: profile } = await supabase.from('profiles').select('*').eq('id', loginData.user.id).single();
          userData = { ...loginData.user, ...profile };
          sessionData = loginData.session;
        } else {
          throw backendErr;
        }
      }

      // Set Supabase session
      if (sessionData) {
        await supabase.auth.setSession(sessionData);
      }

      // Update user store
      useUserStore.setState({
        isLoggedIn: true,
        id: userData.id,
        name: userData.full_name || userData.user_metadata?.full_name || 'User',
        avatar: userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.email}`,
        email: userData.email || email,
        referralCode: userData.user_code || userData.referral_code || '',
        referredBy: userData.referred_by || null,
      });

      // Fetch token balance
      await fetchBalance();

      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">GenzTools</h1>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Selamat Datang Kembali</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Silakan login untuk melanjutkan</p>
        </div>

        {/* Info Banner */}
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4 dark:bg-blue-900/20 dark:border-blue-800">
          <Gift className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Dapatkan Kredit Gratis!</p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Daftar akun baru dan dapatkan kredit token gratis untuk mencoba semua tools AI GenzTools.
            </p>
          </div>
        </div>

        {successMsg && (
             <div className="mb-6 rounded-lg bg-green-50 p-4 text-sm text-green-600 dark:bg-green-900/20 dark:text-green-400">
             {successMsg}
           </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Email
            </label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Password
            </label>
             <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
                type={showPassword ? 'text' : 'password'}
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
            </div>
          </div>

          <button
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02] hover:shadow-blue-500/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
          
          <div className="text-center mt-4">
             <Link
              className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
              to="/register"
            >
              Belum punya akun? Daftar
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
