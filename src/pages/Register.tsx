import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, Gift, Copy, CheckCircle } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ referralCode: string; tokens: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const translateError = (msg: string) => {
    if (msg.includes('already registered') || msg.includes('already been registered')) return 'Email sudah terdaftar. Silakan login.';
    if (msg.includes('Password should be at least')) return 'Password minimal 6 karakter.';
    if (msg.includes('Invalid email')) return 'Format email tidak valid.';
    if (msg.includes('Failed to fetch') || msg.includes('fetch failed')) return 'Tidak dapat terhubung ke server. Pastikan server berjalan.';
    if (msg.includes('Failed to create profile')) return 'Gagal membuat profil. Coba lagi.';
    return msg;
  };

  const handleCopy = () => {
    if (successData) {
      navigator.clipboard.writeText(successData.referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: name, ref_code: refCode }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Pendaftaran gagal');
      }

      // Show success state with referral code
      setSuccessData({
        referralCode: data.data?.user?.user_code || data.data?.user?.referral_code || '-',
        tokens: data.data?.user?.balance_tokens || 10,
      });
    } catch (err: any) {
      setError(translateError(err.message));
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (successData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-4">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Akun kamu sudah dibuat. Kamu mendapat <span className="font-semibold text-blue-600 dark:text-blue-400">{successData.tokens} kredit</span> gratis untuk mulai.
          </p>

          <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Kode Referral Kamu</p>
            <div className="flex items-center justify-between gap-2">
              <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">{successData.referralCode}</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
              >
                <Copy className="h-3.5 w-3.5" />
                {copied ? 'Tersalin!' : 'Salin'}
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Bagikan kode ini untuk mendapat bonus referral.</p>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02]"
          >
            Login Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">Daftar Akun</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Buat akun untuk mulai menggunakan GenzTools</p>
        </div>

        <div className="mb-6 flex items-start gap-3 rounded-xl bg-green-50 border border-green-200 p-4 dark:bg-green-900/20 dark:border-green-800">
          <Gift className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">Bonus Kredit untuk Member Baru!</p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              Daftar sekarang dan dapatkan token gratis untuk langsung mencoba 30+ tools AI GenzTools.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Nama Lengkap</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                type="text"
                placeholder="Nama Kamu"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-3 text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Konfirmasi Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                className={`w-full rounded-xl border pl-10 pr-10 py-3 text-gray-900 transition focus:outline-none focus:ring-2 dark:text-white dark:bg-gray-700 ${
                  confirmPassword && password !== confirmPassword
                    ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500 dark:bg-red-900/10'
                    : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-blue-500/20 dark:border-gray-600'
                }`}
                type={showConfirm ? 'text' : 'password'}
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">Password tidak cocok</p>
            )}
          </div>

          <button
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 font-bold text-white shadow-lg shadow-blue-500/30 transition hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            type="submit"
            disabled={loading || (!!confirmPassword && password !== confirmPassword)}
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>

          <div className="text-center">
            <Link className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400" to="/login">
              Sudah punya akun? Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
