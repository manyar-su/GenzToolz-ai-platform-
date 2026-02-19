import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, Info, Download } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { useHistoryStore } from '../../store/useHistoryStore';

export default function ViralHookGenerator() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const { addToHistory } = useHistoryStore();
  const [topic, setTopic] = useState('');
  const [audience, setAudience] = useState('General');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{title: string, content: string}[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

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
      const response = await fetch('/api/tools/viral-hook-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, audience }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          let outputText = '';
          
          if (Array.isArray(parsed)) {
            setResults(parsed);
            outputText = parsed.map((p: any) => `[${p.title}]\n${p.content}`).join('\n\n');
          } else {
            setResults([{ title: "Hasil Hook", content: data.data }]);
            outputText = data.data;
          }
          
          addToHistory({
            toolName: 'Viral Hook Generator',
            input: `Topik: ${topic}\nAudiens: ${audience}`,
            output: outputText,
            type: 'text'
          });
        } catch (e) {
          setResults([{ title: "Hasil Hook", content: data.data }]);
          addToHistory({
            toolName: 'Viral Hook Generator',
            input: `Topik: ${topic}\nAudiens: ${audience}`,
            output: data.data,
            type: 'text'
          });
        }
      } else {
        alert(data.error || 'Gagal menghasilkan hook');
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

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownload = (title: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([`${title}\n\n${content}`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `hook-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Viral Hook Generator</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Masukkan topik video Anda dan target audiens. 
                  AI akan membuatkan 10 hook yang memancing rasa penasaran.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900 dark:text-blue-100">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Topik Video
                </label>
                <textarea
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Cara menghasilkan uang dari internet tanpa modal..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Target Audiens
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                >
                  <option value="General">Umum</option>
                  <option value="Gen Z">Gen Z (Anak Muda)</option>
                  <option value="Professionals">Profesional / Pekerja</option>
                  <option value="Students">Pelajar / Mahasiswa</option>
                  <option value="Parents">Orang Tua</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Membuat Hook...
                  </>
                ) : (
                  'Buat Viral Hook'
                )}
              </button>
            </form>
          </div>

          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Hasil Hook</h2>
            
            {results.length > 0 ? (
              results.map((item, index) => (
                <div key={index} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-600">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200">{item.title || `Hook #${index + 1}`}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(item.title, item.content)}
                        className="flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleCopy(item.content, index)}
                        className="flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
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
                  
                  <div className="max-h-[300px] overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                    <div className="whitespace-pre-wrap">{item.content}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
                  <Copy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900 dark:text-white">Belum ada hook</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Isi form di samping dan klik "Buat Viral Hook" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
