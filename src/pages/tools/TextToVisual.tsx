import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Image as ImageIcon, Download } from 'lucide-react';

export default function TextToVisual() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Input Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h1 className="mb-6 text-2xl font-bold text-gray-900">Text-to-Visual</h1>
            <p className="mb-6 text-sm text-gray-500">
              Describe the image you want to create. (Currently in Mock Mode)
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Image Prompt
                </label>
                <textarea
                  required
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. A futuristic city with flying cars, neon lights, cyberpunk style..."
                  className="w-full rounded-lg border border-gray-300 p-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" /> Generate Image
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Output Section */}
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="mb-4 text-lg font-bold text-gray-900">Result</h2>
            
            <div className="flex h-[400px] items-center justify-center overflow-hidden rounded-lg bg-gray-50">
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
                  <p>Your generated image will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
