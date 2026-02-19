import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Copy, Check, Info, Download } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';

export default function VideoToShort() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }
    setLoading(true);
    setResult('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    try {
      const response = await fetch('/api/tools/video-to-short', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text_content: content }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      } else {
        alert(data.error || 'Gagal menghasilkan naskah');
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

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `video-short-script-${Date.now()}.txt`;
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
            <h1 className="mb-2 text-2xl font-bold text-gray-900">Video-to-Short Script</h1>
            
            <div className="mb-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Tempelkan transkrip video panjang, artikel, atau catatan blog Anda. 
                  AI akan meringkasnya menjadi naskah video pendek (Shorts/Reels) berdurasi 60 detik yang padat dan menarik.
                  <br/>
                  <span className="mt-2 block font-semibold text-blue-900">Biaya: 1 Token per generate.</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Konten Panjang / Transkrip
                </label>
                <textarea
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Tempel teks Anda di sini..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={10}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Memproses...
                  </>
                ) : (
                  'Buat Naskah Pendek'
                )}
              </button>
            </form>
          </div>

          {/* Output Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Naskah Shorts</h2>
              {result && (
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center text-sm text-gray-500 hover:text-blue-600"
                  >
                    <Download className="mr-1 h-4 w-4" />
                    Download
                  </button>
                  <button
                    onClick={handleCopy}
                    className="flex items-center text-sm text-gray-500 hover:text-blue-600"
                  >
                    {copied ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
                    {copied ? 'Tersalin!' : 'Salin'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="h-[400px] overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm leading-relaxed text-gray-700">
              {result ? (
                <div className="whitespace-pre-wrap">{result}</div>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Naskah Anda akan muncul di sini...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
