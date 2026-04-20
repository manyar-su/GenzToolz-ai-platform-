import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Download, Image as ImageIcon,
  Upload, X, Sparkles, RefreshCw, ZoomIn,
  ChevronDown, ChevronUp, Plus, FileImage, AlertCircle
} from 'lucide-react';
import { authorizedFetch } from '../../lib/api-client';
import { useTokenStore } from '../../store/useTokenStore';
import { useAlert } from '../../context/AlertContext';

const SIZE_OPTIONS = [
  { label: '1024 × 1024 (1:1)', value: '1024*1024', ratio: '1/1', ratioLabel: '1:1' },
  { label: '1280 × 720 (16:9)', value: '1280*720', ratio: '16/9', ratioLabel: '16:9' },
  { label: '720 × 1280 (9:16)', value: '720*1280', ratio: '9/16', ratioLabel: '9:16' },
  { label: '1024 × 768 (4:3)', value: '1024*768', ratio: '4/3', ratioLabel: '4:3' },
  { label: '768 × 1024 (3:4)', value: '768*1024', ratio: '3/4', ratioLabel: '3:4' },
];

interface UploadedImage {
  preview: string;   // data URL untuk preview
  publicUrl: string; // URL publik setelah upload
  name: string;
  uploading: boolean;
  error?: string;
}

type JobStatus = 'IDLE' | 'UPLOADING' | 'SUBMITTING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

const STATUS_DOT: Record<JobStatus, string> = {
  IDLE: 'bg-gray-400',
  UPLOADING: 'bg-yellow-400 animate-pulse',
  SUBMITTING: 'bg-yellow-400 animate-pulse',
  IN_QUEUE: 'bg-blue-400 animate-pulse',
  IN_PROGRESS: 'bg-purple-500 animate-pulse',
  COMPLETED: 'bg-green-500',
  FAILED: 'bg-red-500',
};

const STATUS_LABEL: Record<JobStatus, string> = {
  IDLE: 'Idle',
  UPLOADING: 'Uploading...',
  SUBMITTING: 'Submitting...',
  IN_QUEUE: 'In Queue',
  IN_PROGRESS: 'Generating...',
  COMPLETED: 'Completed',
  FAILED: 'Failed',
};

export default function TextToImage() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const { showAlert } = useAlert();

  const [prompt, setPrompt] = useState('Dress the model in the clothes and hat. Turn the model into a character figure. Behind it, place a box with the characters image printed on it, and a computer showing the Blender modeling process on its screen. In front of the box, add a round plastic base with the character figure standing on it. Set the scene indoors if possible.');
  const [size, setSize] = useState('1024*1024');
  const [safetyChecker, setSafetyChecker] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [status, setStatus] = useState<JobStatus>('IDLE');
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<'preview' | 'json'>('preview');
  const [rawJson, setRawJson] = useState<any>(null);
  const [lightbox, setLightbox] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload gambar ke backend â†’ Supabase Storage â†’ dapat URL publik
  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const res = await authorizedFetch('/api/image/upload', {
            method: 'POST',
            body: JSON.stringify({
              base64,
              filename: file.name,
              contentType: file.type || 'image/jpeg',
            }),
          });
          const data = await res.json();
          if (data.success && data.url) {
            resolve(data.url);
          } else {
            reject(new Error(data.error || 'Upload gagal'));
          }
        } catch (err: any) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  const addFiles = useCallback(async (files: File[]) => {
    const allowed = files.filter(f => f.type.startsWith('image/'));
    if (allowed.length === 0) return;
    if (images.length + allowed.length > 3) {
      showAlert('Maksimal 3 gambar', 'error');
      return;
    }

    const newImages: UploadedImage[] = allowed.map(f => ({
      preview: URL.createObjectURL(f),
      publicUrl: '',
      name: f.name,
      uploading: true,
    }));

    setImages(prev => [...prev, ...newImages]);

    // Upload semua file
    for (let i = 0; i < allowed.length; i++) {
      const file = allowed[i];
      const idx = images.length + i;
      try {
        const url = await uploadImage(file);
        setImages(prev => prev.map((img, j) =>
          j === idx ? { ...img, publicUrl: url, uploading: false } : img
        ));
      } catch (err: any) {
        setImages(prev => prev.map((img, j) =>
          j === idx ? { ...img, uploading: false, error: err.message } : img
        ));
      }
    }
  }, [images.length]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
  };

  const removeImage = (idx: number) => {
    setImages(prev => {
      const img = prev[idx];
      if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // Poll status job
  useEffect(() => {
    if (!jobId || status === 'COMPLETED' || status === 'FAILED') {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const res = await authorizedFetch(`/api/image/status/${jobId}`);
        const data = await res.json();
        if (!data.success) return;
        setStatus(data.status as JobStatus);
        setRawJson(data.raw);
        if (data.status === 'COMPLETED' && data.imageUrl) {
          setResultUrl(data.imageUrl);
          fetchBalance();
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === 'FAILED') {
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch { /* ignore */ }
    }, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, status]);

  const handleRun = async () => {
    if (!prompt.trim()) { showAlert('Prompt tidak boleh kosong', 'error'); return; }
    if (images.length === 0) { showAlert('Upload minimal 1 gambar', 'error'); return; }
    if (images.some(img => img.uploading)) { showAlert('Tunggu upload selesai', 'error'); return; }
    if (images.some(img => img.error)) { showAlert('Ada gambar yang gagal diupload', 'error'); return; }

    setResultUrl(null);
    setRawJson(null);
    setJobId(null);
    setStatus('SUBMITTING');

    try {
      const publicImages = images.map(img => img.publicUrl).filter(Boolean);
      const res = await authorizedFetch('/api/image/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim(), size, enable_safety_checker: safetyChecker, images: publicImages }),
      });
      const data = await res.json();
      if (data.success && data.jobId) {
        setJobId(data.jobId);
        setStatus('IN_QUEUE');
      } else {
        throw new Error(data.error || 'Gagal submit');
      }
    } catch (err: any) {
      setStatus('FAILED');
      showAlert(err.message || 'Terjadi kesalahan', 'error');
    }
  };

  const handleReset = () => {
    images.forEach(img => { if (img.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview); });
    setImages([]);
    setPrompt('');
    setResultUrl(null);
    setRawJson(null);
    setJobId(null);
    setStatus('IDLE');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      // Fetch via proxy backend agar CORS tidak block
      const res = await fetch(resultUrl, { mode: 'cors' });
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const ext = blob.type.includes('png') ? 'png' : 'jpg';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vertex-image-${Date.now()}.${ext}`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
      }, 100);
    } catch {
      // Fallback: buat link dengan download attribute
      const a = document.createElement('a');
      a.href = resultUrl;
      a.download = `vertex-image-${Date.now()}.jpg`;
      a.target = '_self'; // jangan buka tab baru
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    }
  };

  const isRunning = status === 'UPLOADING' || status === 'SUBMITTING' || status === 'IN_QUEUE' || status === 'IN_PROGRESS';
  const allUploaded = images.length > 0 && images.every(img => !img.uploading && !img.error && img.publicUrl);

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      {/* Top bar */}
      <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-4 bg-[#111]">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span className="text-sm font-semibold">Image to Image AI</span>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-gray-400">Seedream v4 Edit</span>
        </div>
        <div className="w-24" />
      </div>

      {/* Main split layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* â”€â”€ LEFT PANEL: Input â”€â”€ */}
        <div className="flex w-full flex-col border-r border-white/[0.06] lg:w-[480px] overflow-y-auto bg-[#111]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <span className="text-sm font-semibold text-white">Input</span>
            <span className="text-xs text-gray-400">3 Token per generate</span>
          </div>

          <div className="flex-1 space-y-5 p-4">
            {/* Prompt */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">Prompt</label>
              <textarea
                value={prompt}
                onChange={e => {
                  setPrompt(e.target.value);
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                }}
                ref={el => {
                  if (el) {
                    el.style.height = 'auto';
                    el.style.height = el.scrollHeight + 'px';
                  }
                }}
                placeholder="Describe what you want to create or edit..."
                className="w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 min-h-[80px]"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400 dark:text-gray-400">
                Images <span className="text-red-400">*</span>
                <span className="ml-1 text-gray-400">(wajib, maks 3)</span>
              </label>

              {/* Uploaded images list */}
              {images.map((img, i) => (
                <div key={i} className="mb-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                    <img src={img.preview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-gray-300">
                      {img.uploading ? 'Uploading...' : img.error ? img.error : img.publicUrl || img.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {img.uploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400" />}
                    {img.error && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                    {!img.uploading && !img.error && (
                      <div className="h-2 w-2 rounded-full bg-green-500" title="Uploaded" />
                    )}
                    <button onClick={() => removeImage(i)} className="text-gray-400 hover:text-red-400 transition">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Drop zone */}
              {images.length < 3 && (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 transition ${
                    isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                  }`}
                >
                  <Plus className="h-5 w-5 text-gray-400" />
                  <span className="text-xs text-gray-400">Add more files</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileInput} />
              <p className="mt-1.5 text-xs text-gray-400">jpeg, jpg, png up to 16MB</p>
            </div>

            {/* Additional Settings */}
            <div className="rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-white transition"
              >
                <span>Additional settings</span>
                {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showSettings && (
                <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-400">Output Size</label>
                    <div className="flex gap-2">
                      {SIZE_OPTIONS.map(opt => {
                        const [w, h] = opt.ratio.split('/').map(Number);
                        const isSelected = size === opt.value;
                        // Normalize box dimensions: max 32px on longest side
                        const maxPx = 32;
                        const boxW = w >= h ? maxPx : Math.round((w / h) * maxPx);
                        const boxH = h >= w ? maxPx : Math.round((h / w) * maxPx);
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setSize(opt.value)}
                            title={opt.label}
                            className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border py-2 px-1 transition-all ${
                              isSelected
                                ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                                : 'border-gray-600 bg-gray-700/50 text-gray-400 hover:border-purple-400 hover:text-purple-300'
                            }`}
                          >
                            <div className="flex items-center justify-center" style={{ width: maxPx, height: maxPx }}>
                              <div
                                className={`rounded-sm border-2 ${isSelected ? 'border-purple-400 bg-purple-500/30' : 'border-gray-400 bg-gray-600/50'}`}
                                style={{ width: boxW, height: boxH }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold leading-none">{opt.ratioLabel}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-1.5 text-xs text-gray-500">{SIZE_OPTIONS.find(o => o.value === size)?.label}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400 dark:text-gray-400">Safety Checker</label>
                    <button
                      type="button"
                      onClick={() => setSafetyChecker(!safetyChecker)}
                      className={`relative h-5 w-9 rounded-full transition ${safetyChecker ? 'bg-purple-600' : 'bg-white/10'}`}
                    >
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${safetyChecker ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-end gap-3">
            <button
              onClick={handleReset}
              disabled={isRunning}
              className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-gray-400 hover:border-white/30 hover:text-white transition disabled:opacity-40"
            >
              Reset
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || images.length === 0 || !allUploaded || !prompt.trim()}
              className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2 text-sm font-semibold text-white hover:bg-purple-700 transition disabled:opacity-40"
            >
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isRunning ? STATUS_LABEL[status] : 'Run'}
            </button>
          </div>
        </div>

        {/* â”€â”€ RIGHT PANEL: Result â”€â”€ */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Result</span>
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                <div className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                <span className="text-xs text-gray-400 dark:text-gray-400">{STATUS_LABEL[status]}</span>
              </div>
            </div>
            {resultUrl && (
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button
                    onClick={() => setResultTab('preview')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition ${resultTab === 'preview' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button
                    onClick={() => setResultTab('json')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition ${resultTab === 'json' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <FileImage className="h-3.5 w-3.5" /> JSON
                  </button>
                </div>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:border-white/30 hover:text-white transition"
                >
                  <Download className="h-3.5 w-3.5" /> Download image
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {resultUrl && resultTab === 'preview' ? (
              <div className="relative group max-h-full">
                <img
                  src={resultUrl}
                  alt="Generated"
                  className="max-h-[calc(100vh-120px)] max-w-full rounded-xl object-contain shadow-2xl"
                />
                <button
                  onClick={() => setLightbox(true)}
                  className="absolute right-3 top-3 hidden group-hover:flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/80"
                >
                  <ZoomIn className="h-3.5 w-3.5" /> Fullscreen
                </button>
              </div>
            ) : resultUrl && resultTab === 'json' ? (
              <div className="w-full max-w-2xl">
                <pre className="overflow-auto rounded-xl bg-white/5 p-4 text-xs text-green-400 max-h-[calc(100vh-160px)]">
                  {JSON.stringify(rawJson, null, 2)}
                </pre>
              </div>
            ) : isRunning ? (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-gray-200 dark:border-gray-700" />
                  <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-purple-500" />
                  <div className="absolute inset-3 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-purple-400" />
                  </div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{STATUS_LABEL[status]}</p>
                  <p className="mt-1 text-sm text-gray-400">Biasanya 15–60 detik, harap tunggu...</p>
</div>
                <div className="w-64 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                    style={{ width: status === 'IN_PROGRESS' ? '75%' : status === 'IN_QUEUE' ? '35%' : '10%' }}
                  />
                </div>
              </div>
            ) : status === 'FAILED' ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="font-semibold text-white">Generation Failed</p>
                <p className="text-sm text-gray-400">Coba lagi dengan prompt atau gambar berbeda</p>
                <button
                  onClick={() => setStatus('IDLE')}
                  className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition"
                >
                  <RefreshCw className="h-4 w-4" /> Coba Lagi
                </button>
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center h-full">
                {/* Preview image sebagai background hint */}
                <div className="relative w-full max-w-lg overflow-hidden rounded-2xl">
                  <img
                    src="https://image.runpod.ai/preview/bytedance/seedream-v4-edit.png"
                    alt="Contoh hasil Image to Image"
                    className="w-full object-cover opacity-60 rounded-2xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                    <p className="text-sm font-semibold text-white mb-1">Contoh hasil Image to Image</p>
                    <p className="text-xs text-gray-300">Upload gambar referensi + tulis prompt → klik Run</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && resultUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4" onClick={() => setLightbox(false)}>
          <button className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20">
            <X className="h-5 w-5" />
          </button>
          <img src={resultUrl} alt="Full" className="max-h-screen max-w-full rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

