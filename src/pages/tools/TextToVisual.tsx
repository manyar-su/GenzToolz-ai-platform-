import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Image as ImageIcon, Download, Info } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';

export default function TextToVisual() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!deductToken(1)) {
        alert('Token tidak cukup! Silakan top-up.');
        return;
    }

    setLoading(true);
    setResult(null);

    // Mock API call since we don't have a real image generation API yet
    setTimeout(() => {
      setLoading(false);
      // Using a placeholder image service for demonstration
      setResult(`https://placehold.co/1024x1024/2563eb/white?text=${encodeURIComponent(prompt)}`);
    }, 2000);
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
          {/* Input Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Text-to-Visual</h1>
            
            <div className="mb-6 rounded-lg bg-indigo-50 p-4 text-sm text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Deskripsikan gambar yang ingin Anda buat. AI akan mengubah teks menjadi visual menarik.
                  <br/>
                  <span className="mt-2 block font-semibold text-indigo-900 dark:text-indigo-100">Biaya: 1 Token per gambar.</span>
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Deskripsi Gambar (Prompt)
                </label>
                <textarea
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Contoh: Kota futuristik dengan mobil terbang, neon lights, gaya cyberpunk..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  rows={4}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang Membuat...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" /> Generate Gambar
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Output Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Hasil</h2>
            
            <div className="flex h-[400px] items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
              {result ? (
                <div className="relative h-full w-full">
                  <img 
                    src={result} 
                    alt="Generated" 
                    className="h-full w-full object-cover"
                  />
                  <a 
                    href={result} 
                    download="generated-image.png"
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <ImageIcon className="mb-2 h-12 w-12 opacity-20" />
                  <p>Gambar akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
