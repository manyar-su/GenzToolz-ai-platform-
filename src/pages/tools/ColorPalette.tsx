import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, Info } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { authorizedFetch } from '../../lib/api-client';

export default function ColorPalette() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const [vibe, setVibe] = useState('');
  const [loading, setLoading] = useState(false);
  const [palette, setPalette] = useState<{color: string, name: string, explanation: string}[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Optimistic check
    if (!await deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }
    
    setLoading(true);
    setPalette([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await authorizedFetch('/api/tools/color-palette', {
        method: 'POST',
        body: JSON.stringify({ vibe }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        fetchBalance(); // Sync balance
        
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          setPalette(parsed);
        } catch (e) {
          alert('Gagal memproses palet warna.');
        }
      } else {
        alert(data.error || 'Gagal menghasilkan palet');
      }
    } catch (error: any) {
      console.error(error);
      if (error.message === 'Saldo Tidak Cukup') {
         alert('Saldo Tidak Cukup! Silakan top-up.');
      } else if (error.name === 'AbortError') {
        alert('Waktu habis! Permintaan memakan waktu terlalu lama. Silakan coba lagi.');
      } else {
        alert('Terjadi kesalahan saat menghubungi server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">AI Color Palette</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Jelaskan vibe atau mood yang Anda inginkan (misal: "Tech Startup", "Coffee Shop Cozy", "Cyberpunk"). 
                  AI akan menyarankan kombinasi warna yang cocok.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900 dark:text-blue-100">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Vibe / Mood
                </label>
                <input
                  required
                  type="text"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  placeholder="Contoh: Modern Minimalist, Retro 90s, Fresh Nature..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Meracik Warna...
                  </>
                ) : (
                  'Generate Palet'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hasil Palet Warna</h2>
            
            {palette.length > 0 ? (
              <div className="grid gap-4">
                {palette.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    <div 
                      className="h-16 w-16 flex-shrink-0 rounded-lg shadow-inner"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">{item.name}</h3>
                        <button
                          onClick={() => handleCopy(item.color)}
                          className="flex items-center text-xs font-mono text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                        >
                          {copiedColor === item.color ? (
                            <Check className="mr-1 h-3 w-3 text-green-500" />
                          ) : (
                            <Copy className="mr-1 h-3 w-3" />
                          )}
                          {item.color}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <div className="grid grid-cols-2 gap-1">
                    <div className="h-3 w-3 rounded-full bg-red-400"></div>
                    <div className="h-3 w-3 rounded-full bg-blue-400"></div>
                    <div className="h-3 w-3 rounded-full bg-green-400"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                  </div>
                </div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Belum ada palet</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Isi form di samping dan klik "Generate Palet" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
