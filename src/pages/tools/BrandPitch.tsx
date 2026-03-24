import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, Info } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { authorizedFetch } from '../../lib/api-client';

export default function BrandPitch() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const [brandName, setBrandName] = useState('');
  const [niche, setNiche] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Optimistic check
    if (!await deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }
    
    setLoading(true);
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await authorizedFetch('/api/tools/brand-pitch', {
        method: 'POST',
        body: JSON.stringify({ brand_name: brandName, niche, follower_count: followerCount }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        fetchBalance(); // Sync balance
        
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          setResult(parsed);
        } catch (e) {
          alert('Gagal memproses hasil.');
        }
      } else {
        alert(data.error || 'Gagal membuat pitch');
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

  const handleCopy = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
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
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Brand Deal Pitch</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Masukkan nama brand yang ingin Anda ajak kerjasama, niche konten Anda, dan jumlah followers. 
                  AI akan membuatkan email penawaran profesional.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900 dark:text-blue-100">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nama Brand Target
                </label>
                <input
                  required
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Contoh: Skintific, Samsung, dll."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Niche Konten Anda
                </label>
                <input
                  required
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Contoh: Beauty & Skincare"
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Jumlah Followers
                </label>
                <input
                  required
                  type="text"
                  value={followerCount}
                  onChange={(e) => setFollowerCount(e.target.value)}
                  placeholder="Contoh: 50K di TikTok"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Membuat Pitch...
                  </>
                ) : (
                  'Buat Surat Penawaran'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Draft Email</h2>
            
            {result ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Subject:</span>
                    <button
                      onClick={() => handleCopy(result.subject, 'subject')}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {copiedSection === 'subject' ? 'Tersalin!' : 'Salin Subject'}
                    </button>
                  </div>
                  <p className="font-medium text-gray-900 dark:text-white">{result.subject}</p>
                </div>

                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-2 dark:border-gray-700">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Body Email:</span>
                    <button
                      onClick={() => handleCopy(result.body, 'body')}
                      className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {copiedSection === 'body' ? 'Tersalin!' : 'Salin Isi'}
                    </button>
                  </div>
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    {result.body}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Loader2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Belum ada draft</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Isi form di samping dan klik "Buat Surat Penawaran" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
