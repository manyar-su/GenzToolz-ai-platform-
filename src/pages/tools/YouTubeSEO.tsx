import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, Info, Download } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { authorizedFetch } from '../../lib/api-client';

export default function YouTubeSEO() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check local balance first (Optimistic)
    if (!await deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }
    
    setLoading(true);
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await authorizedFetch('/api/tools/youtube-seo', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        // Sync balance with server
        fetchBalance();
        
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          setResult(parsed);
        } catch (e) {
          alert('Gagal memproses hasil dari AI.');
        }
      } else {
        alert(data.error || 'Gagal mengoptimasi SEO');
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

  const handleDownload = () => {
    if (!result) return;
    const content = `JUDUL:\n${result.titles.join('\n')}\n\nTAGS:\n${result.tags.join(', ')}\n\nDESKRIPSI:\n${result.description}`;
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `seo-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
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
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">YouTube SEO Optimizer</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Masukkan judul dan deskripsi video Anda. 
                  AI akan memberikan rekomendasi judul clickbait, tags relevan, dan deskripsi SEO.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900 dark:text-blue-100">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Judul Video Saat Ini
                </label>
                <input
                  required
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Vlog Liburan ke Bali"
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deskripsi Singkat (Opsional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ceritakan sedikit tentang isi video..."
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengoptimasi SEO...
                  </>
                ) : (
                  'Optimasi Video'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hasil Optimasi</h2>
            
            {result ? (
              <div className="space-y-4">
                {/* Titles */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Rekomendasi Judul</h3>
                    <button
                      onClick={() => handleCopy(result.titles.join('\n'), 'titles')}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {copiedSection === 'titles' ? 'Tersalin!' : 'Salin Semua'}
                    </button>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-gray-700 dark:text-gray-300 space-y-1">
                    {result.titles.map((t: string, i: number) => (
                      <li key={i}>{t}</li>
                    ))}
                  </ul>
                </div>

                {/* Tags */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Tags / Keywords</h3>
                    <button
                      onClick={() => handleCopy(result.tags.join(', '), 'tags')}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {copiedSection === 'tags' ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.tags.map((tag: string, i: number) => (
                      <span key={i} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">Deskripsi SEO</h3>
                    <button
                      onClick={() => handleCopy(result.description, 'desc')}
                      className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {copiedSection === 'desc' ? 'Tersalin!' : 'Salin'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {result.description}
                  </p>
                </div>

                <button
                  onClick={handleDownload}
                  className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <Download className="mr-2 h-4 w-4" /> Download Semua Hasil
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Copy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Belum ada hasil</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Isi form di samping dan klik "Optimasi Video" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
