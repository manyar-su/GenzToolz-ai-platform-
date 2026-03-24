import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, ShoppingBag } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';

export default function AffiliateHunter() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const [niche, setNiche] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }
    setLoading(true);
    setResults([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await authorizedFetch('/api/tools/affiliate-hunter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          setResults(parsed);
        } catch (e) {
          alert('Gagal memproses hasil.');
        }
      } else {
        alert(data.error || 'Gagal mencari produk');
      }
    } catch (error: any) {
      console.error(error);
      if (error.name === 'AbortError') {
        alert('Waktu habis! Permintaan memakan waktu terlalu lama. Silakan coba lagi.');
      } else {
        alert('Terjadi kesalahan saat menghubungi server.');
      }
    } finally {
      setLoading(false);
    }
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
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Affiliate Product Hunter</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Masukkan niche atau kategori konten Anda. 
                  AI akan mencarikan 5 produk affiliate yang sedang trending dan cocok untuk dipromosikan.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900 dark:text-blue-100">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Niche / Kategori
                </label>
                <input
                  required
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Contoh: Gadget, Home Decor, Fashion..."
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mencari Produk...
                  </>
                ) : (
                  'Cari Produk Cuan'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Produk Trending</h2>
            
            {results.length > 0 ? (
              <div className="space-y-4">
                {results.map((item, index) => (
                  <div key={index} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    <div className="mb-2 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      <h3 className="font-bold text-gray-900 dark:text-white">{item.product}</h3>
                    </div>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-gray-900 dark:text-white">Kenapa Laris:</span> {item.reason}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-gray-900 dark:text-white">Ide Konten:</span> {item.angle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Belum ada produk</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Isi form di samping dan klik "Cari Produk Cuan" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
