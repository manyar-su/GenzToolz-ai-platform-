import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, Info, Download } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { authorizedFetch } from '../../lib/api-client';

export default function TrendAnalyzer() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const [niche, setNiche] = useState('');
  const [platform, setPlatform] = useState('TikTok');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{title: string, content: string}[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Optimistic check
    if (!await deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }
    
    setLoading(true);
    setResults([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await authorizedFetch('/api/tools/trend-analyzer', {
        method: 'POST',
        body: JSON.stringify({ niche, platform }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        fetchBalance(); // Sync balance
        
        // Clean markdown if present
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed)) {
            setResults(parsed);
          } else {
            setResults([{ title: "Analisa Tren", content: data.data }]);
          }
        } catch (e) {
          setResults([{ title: "Analisa Tren", content: data.data }]);
        }
      } else {
        alert(data.error || 'Gagal menganalisis tren');
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

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = (title: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([`${title}\n\n${content}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `trend-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
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
          {/* Input Section */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Trend Analyzer</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-800 dark:text-blue-300">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Masukkan niche atau industri Anda (contoh: Fashion, Teknologi). 
                  AI akan mencari topik yang sedang trending dan memberikan ide konten yang relevan.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900 dark:text-blue-200">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Niche / Industri Anda
                </label>
                <input
                  required
                  type="text"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Contoh: Digital Marketing, Skincare, AI Tools..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Platform untuk Dianalisis
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="YouTube">YouTube</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menganalisis Tren...
                  </>
                ) : (
                  'Cari Tren Viral'
                )}
              </button>
            </form>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hasil Analisa Tren</h2>
            
            {results.length > 0 ? (
              results.map((item, index) => (
                <div key={index} className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-3">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100">{item.title || `Tren #${index + 1}`}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(item.title, item.content)}
                        className="flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleCopy(item.content, index)}
                        className="flex items-center rounded-md bg-gray-50 dark:bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check className="mr-1.5 h-4 w-4 text-green-500" />
                            <span className="text-green-600">Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="mr-1.5 h-4 w-4" />
                            Salin
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-[300px] overflow-y-auto rounded-lg bg-gray-50 dark:bg-gray-900 p-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                    <div className="whitespace-pre-wrap">{item.content}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white dark:bg-gray-800 p-12 text-center shadow-sm ring-1 ring-gray-100 dark:ring-gray-700">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Copy className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Belum ada analisa</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Isi form di samping dan klik "Cari Tren" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
