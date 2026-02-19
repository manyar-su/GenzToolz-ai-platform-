import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Loader2, Mail, ArrowRight, CheckCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isNewUser: boolean) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        }
      });

      if (error) throw error;
      setStep('otp');
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim kode OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;

      // Check if user is new (handled by backend trigger ideally, but we can infer or pass flag)
      // For now, assume success means we proceed.
      // We will check if profile exists in parent component or store.
      onSuccess(true); 
      onClose();
    } catch (err: any) {
      setError('Kode OTP salah atau kedaluwarsa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white p-8 shadow-2xl dark:bg-gray-800 animate-in fade-in zoom-in duration-200">
        
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {step === 'email' ? 'Masuk / Daftar' : 'Verifikasi OTP'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {step === 'email' 
              ? 'Masukkan email untuk menerima kode akses' 
              : `Kode 6 digit telah dikirim ke ${email}`
            }
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 pl-10 p-3 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  placeholder="email@contoh.com"
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-lg bg-blue-600 py-3 font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Kirim Kode OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kode OTP</label>
              <input 
                required
                type="text" 
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full rounded-lg border border-gray-300 p-3 text-center text-2xl font-bold tracking-widest focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                placeholder="000000"
              />
            </div>
            <button 
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center rounded-lg bg-green-600 py-3 font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verifikasi & Masuk'}
            </button>
            <button 
              type="button"
              onClick={() => setStep('email')}
              className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400"
            >
              Ganti Email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
