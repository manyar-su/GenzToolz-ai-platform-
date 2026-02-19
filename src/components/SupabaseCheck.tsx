import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Database, XCircle } from 'lucide-react';

export default function SupabaseCheck() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [message, setMessage] = useState('Checking Supabase connection...');
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST301' || error.message.includes('does not exist')) {
            setStatus('error');
            setMessage('Tabel "profiles" belum dibuat. Silakan jalankan script SQL di Supabase.');
        } else {
            setStatus('error');
            setMessage(`Koneksi Gagal: ${error.message}`);
        }
      } else {
        setStatus('connected');
        setMessage('Terhubung ke Supabase & Tabel Siap!');
        setTimeout(() => setIsVisible(false), 5000); // Hide after 5s if success
      }
    } catch (err: any) {
      setStatus('error');
      setMessage(`Error: ${err.message}`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <div className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-md ${
        status === 'connected' 
          ? 'border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-300' 
          : status === 'error'
          ? 'border-red-500/50 bg-red-900/90 text-white'
          : 'border-blue-500/50 bg-blue-500/10 text-blue-700 dark:text-blue-300'
      }`}>
        <div className="mt-0.5">
          {status === 'loading' && <Database className="h-5 w-5 animate-pulse" />}
          {status === 'connected' && <CheckCircle className="h-5 w-5" />}
          {status === 'error' && <XCircle className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-sm">Status Database</h3>
          <p className="text-xs opacity-90">{message}</p>
          {status === 'error' && (
            <div className="mt-2 space-y-2">
                <button 
                    onClick={() => {
                        navigator.clipboard.writeText(`-- Copy content of supabase/migrations/20240221_token_system.sql`);
                        alert('Silakan buka file supabase/migrations/20240221_token_system.sql dan copy isinya ke Supabase SQL Editor');
                    }}
                    className="w-full rounded bg-white/20 px-2 py-1 text-xs font-semibold hover:bg-white/30"
                >
                    Salin Panduan Fix
                </button>
                <div className="rounded bg-black/20 p-2 text-[10px] font-mono">
                    <p className="mb-1 font-bold text-yellow-300">⚠️ Action Required:</p>
                    <ol className="list-decimal pl-3 space-y-1">
                        <li>Buka Dashboard Supabase</li>
                        <li>Masuk ke SQL Editor</li>
                        <li>Paste script dari file: <br/><span className="text-blue-200">migrations/20240221_token_system.sql</span></li>
                        <li>Klik Run</li>
                    </ol>
                </div>
            </div>
          )}
        </div>
        <button onClick={() => setIsVisible(false)} className="opacity-70 hover:opacity-100">
            <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
