import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Key, Eye, EyeOff, Save, Check, AlertCircle, 
  Sparkles, Image, Video, Music, FileText, Settings2, ExternalLink
} from 'lucide-react';

interface APIConfig {
  id: string;
  name: string;
  description: string;
  envKey: string;
  placeholder: string;
  icon: any;
  color: string;
  category: 'text' | 'image' | 'video' | 'audio';
  required: boolean;
  docsUrl?: string;
}

const API_CONFIGS: APIConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini API',
    description: 'Untuk text generation, prompt building, dan AI chat',
    envKey: 'GEMINI_API_KEY',
    placeholder: 'AIza...',
    icon: FileText,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20',
    category: 'text',
    required: true,
    docsUrl: 'https://ai.google.dev/gemini-api/docs/api-key',
  },
  {
    id: 'openai',
    name: 'OpenAI API',
    description: 'Untuk GPT-4, DALL-E, dan text-to-speech',
    envKey: 'OPENAI_API_KEY',
    placeholder: 'sk-proj-...',
    icon: Sparkles,
    color: 'text-green-600 bg-green-50 dark:bg-green-900/20',
    category: 'text',
    required: false,
    docsUrl: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'replicate',
    name: 'Replicate API',
    description: 'Untuk Flux, SDXL, dan image/video generation',
    envKey: 'REPLICATE_API_TOKEN',
    placeholder: 'r8_...',
    icon: Image,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-900/20',
    category: 'image',
    required: false,
    docsUrl: 'https://replicate.com/account/api-tokens',
  },
  {
    id: 'runway',
    name: 'Runway API',
    description: 'Untuk video generation Gen-3',
    envKey: 'RUNWAY_API_KEY',
    placeholder: 'rwk_...',
    icon: Video,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20',
    category: 'video',
    required: false,
    docsUrl: 'https://runwayml.com/',
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs API',
    description: 'Untuk voice cloning dan text-to-speech premium',
    envKey: 'ELEVENLABS_API_KEY',
    placeholder: 'el_...',
    icon: Music,
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-900/20',
    category: 'audio',
    required: false,
    docsUrl: 'https://elevenlabs.io/api',
  },
];

export default function APIConfiguration() {
  const navigate = useNavigate();
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Semua', icon: Settings2 },
    { id: 'text', label: 'Text AI', icon: FileText },
    { id: 'image', label: 'Image AI', icon: Image },
    { id: 'video', label: 'Video AI', icon: Video },
    { id: 'audio', label: 'Audio AI', icon: Music },
  ];

  const filteredConfigs = API_CONFIGS.filter(
    config => activeCategory === 'all' || config.category === activeCategory
  );

  const handleSave = () => {
    // In production, this would send to backend to store in environment variables
    // For now, we'll just store in localStorage as demo
    Object.entries(configs).forEach(([key, value]) => {
      if (value) {
        localStorage.setItem(key, value);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleShowKey = (id: string) => {
    setShowKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const updateConfig = (envKey: string, value: string) => {
    setConfigs(prev => ({ ...prev, [envKey]: value }));
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.15),transparent_50%)]" />
        <div className="relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-sm backdrop-blur-sm transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
              <Key className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-black">API Configuration</h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-300">
                Atur API keys untuk berbagai AI models yang digunakan di workflow. Semua keys disimpan dengan aman dan tidak dibagikan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Banner ── */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-800/50 dark:bg-blue-900/10">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="flex-1 text-sm">
          <p className="font-semibold text-blue-800 dark:text-blue-300">Cara Menggunakan</p>
          <p className="mt-1 text-blue-700 dark:text-blue-400">
            API keys ini dibutuhkan jika Anda ingin menjalankan workflow dengan model AI tertentu. 
            Beberapa model seperti <strong>Nano Banana</strong> dan <strong>WAN 2.1</strong> gratis dan tidak memerlukan API key.
          </p>
        </div>
      </div>

      {/* ── Category Filter ── */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                  : 'border border-gray-200 bg-white text-gray-600 hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              <Icon className="h-4 w-4" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* ── API Keys List ── */}
      <div className="space-y-4">
        {filteredConfigs.map(config => {
          const Icon = config.icon;
          const isVisible = showKeys[config.id];
          const value = configs[config.envKey] || '';
          
          return (
            <div
              key={config.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${config.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white">{config.name}</h3>
                        {config.required && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
                    </div>
                    
                    {config.docsUrl && (
                      <a
                        href={config.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Docs <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={value}
                        onChange={e => updateConfig(config.envKey, e.target.value)}
                        placeholder={config.placeholder}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm font-mono text-gray-900 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                      <button
                        onClick={() => toggleShowKey(config.id)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Environment Variable: <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-gray-800">{config.envKey}</code>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Save Button ── */}
      <div className="sticky bottom-6 flex justify-center">
        <button
          onClick={handleSave}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3 font-bold text-white shadow-2xl shadow-purple-500/40 transition hover:scale-105"
        >
          {saved ? (
            <>
              <Check className="h-5 w-5" />
              Tersimpan!
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Simpan Konfigurasi
            </>
          )}
        </button>
      </div>

      {/* ── Free Models Info ── */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800/50 dark:bg-green-900/10">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-500 text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white">Model AI Gratis (Tanpa API Key)</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              GenzTools menyediakan beberapa model AI yang bisa langsung digunakan tanpa perlu API key external:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <strong>Google Nano Banana 2</strong> - Image editing & generation
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <strong>WAN 2.1</strong> - Image to video conversion
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <strong>Google TTS</strong> - Text to speech basic
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
