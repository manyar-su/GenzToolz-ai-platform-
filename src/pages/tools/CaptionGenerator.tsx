import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, Info, Download } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';

export default function CaptionGenerator() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState('Casual');
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
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch('/api/tools/caption-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_description: description, tone }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        // Clean markdown if present
        let cleanJson = data.data.replace(/```json\n?|\n?```/g, '').trim();
        try {
          const parsed = JSON.parse(cleanJson);
          if (Array.isArray(parsed)) {
            setResults(parsed);
          } else {
            setResults([{ title: "Hasil Caption", content: data.data }]);
          }
        } catch (e) {
          // Fallback if JSON parsing fails
          setResults([{ title: "Hasil Caption", content: data.data }]);
        }
      } else {
        alert(data.error || 'Gagal menghasilkan caption');
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
    element.download = `caption-${title.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Input Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Caption & Hashtag Generator</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Jelaskan isi postingan Anda (foto/video) dan pilih nada bicara (tone). 
                  AI akan membuatkan caption menarik beserta hashtag yang relevan agar masuk FYP.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tentang apa postingan Anda?
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Contoh: Foto saya sedang bekerja di kafe, membahas tentang produktivitas..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nada Bicara (Tone)
                </label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 p-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Casual">Santai & Seru</option>
                  <option value="Professional">Profesional</option>
                  <option value="Inspirational">Inspiratif</option>
                  <option value="Funny">Lucu / Witty</option>
                  <option value="Educational">Edukatif</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Membuat...
                  </>
                ) : (
                  'Buat Caption'
                )}
              </button>
            </form>
          </div>

          {/* Output Section */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-gray-900">Hasil Caption</h2>
            
            {results.length > 0 ? (
              results.map((item, index) => (
                <div key={index} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
                  <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                    <h3 className="font-semibold text-gray-800">{item.title || `Varian #${index + 1}`}</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(item.title, item.content)}
                        className="flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Download className="mr-1.5 h-4 w-4" />
                        Download
                      </button>
                      <button
                        onClick={() => handleCopy(item.content, index)}
                        className="flex items-center rounded-md bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
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
                  
                  <div className="max-h-[300px] overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
                    <div className="whitespace-pre-wrap">{item.content}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50">
                  <Copy className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mb-2 font-medium text-gray-900">Belum ada caption</h3>
                <p className="text-sm text-gray-500">
                  Isi form di samping dan klik "Buat Caption" untuk melihat hasilnya di sini.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
