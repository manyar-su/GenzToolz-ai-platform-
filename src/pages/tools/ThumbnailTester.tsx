import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, Eye, BarChart2 } from 'lucide-react';
import { authorizedFetch } from '../../lib/api-client';
import { useTokenStore } from '../../store/useTokenStore';

export default function ThumbnailTester() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const [descA, setDescA] = useState('');
  const [descB, setDescB] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }
    setLoading(true);
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await authorizedFetch('/api/tools/thumbnail-tester', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description_a: descA, description_b: descB }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          setResult(parsed);
        } catch (e) {
          alert('Gagal memproses hasil.');
        }
      } else {
        alert(data.error || 'Gagal mengetes thumbnail');
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
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Thumbnail A/B Tester</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Deskripsikan dua konsep thumbnail (Warna, Teks, Ekspresi). 
                  AI akan memprediksi mana yang memiliki potensi klik (CTR) lebih tinggi.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900 dark:text-blue-100">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Konsep A (Deskripsi)
                </label>
                <textarea
                  required
                  value={descA}
                  onChange={(e) => setDescA(e.target.value)}
                  placeholder="Contoh: Wajah kaget, background merah, teks 'RAHASIA TERBONGKAR' warna kuning..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Konsep B (Deskripsi)
                </label>
                <textarea
                  required
                  value={descB}
                  onChange={(e) => setDescB(e.target.value)}
                  placeholder="Contoh: Close up produk, background putih bersih, teks minimalis..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Simulasi A/B Test...
                  </>
                ) : (
                  'Mulai Test'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hasil Prediksi</h2>
            
            {result ? (
              <div className="space-y-6">
                <div className="rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 p-6 text-white shadow-lg">
                  <div className="mb-2 flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-300" />
                    <h3 className="text-lg font-bold uppercase">Pemenang: {result.winner}</h3>
                  </div>
                  <p className="text-sm opacity-90">Prediksi CTR lebih tinggi berdasarkan psikologi visual.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Skor Konsep A</h4>
                    <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{result.score_a}</div>
                  </div>
                  <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Skor Konsep B</h4>
                    <div className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">{result.score_b}</div>
                  </div>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <h4 className="mb-2 font-semibold text-gray-900 dark:text-white">Analisa AI:</h4>
                  <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    {result.reason}
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <BarChart2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Belum ada hasil</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Isi form di samping dan klik "Mulai Test" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Trophy(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  )
}
