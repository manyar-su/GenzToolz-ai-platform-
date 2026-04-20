import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Image as ImageIcon, X, Sparkles, RefreshCw, ZoomIn, ChevronDown, ChevronUp, Plus, FileImage, AlertCircle } from 'lucide-react';
import { authorizedFetch } from '../../lib/api-client';
import { useAlert } from '../../context/AlertContext';

const RESOLUTIONS = [
  { label: '1K', value: '1k', desc: '~1024px' },
  { label: '2K', value: '2k', desc: '~2048px' },
  { label: '4K', value: '4k', desc: '~4096px' },
];
const OUTPUT_FORMATS = [
  { label: 'PNG', value: 'png' },
  { label: 'JPEG', value: 'jpeg' },
  { label: 'WebP', value: 'webp' },
];

interface UploadedImage { preview: string; publicUrl: string; name: string; uploading: boolean; error?: string; }
type JobStatus = 'IDLE' | 'SUBMITTING' | 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

const STATUS_DOT: Record<JobStatus, string> = {
  IDLE: 'bg-gray-400', SUBMITTING: 'bg-yellow-400 animate-pulse', IN_QUEUE: 'bg-blue-400 animate-pulse',
  IN_PROGRESS: 'bg-purple-500 animate-pulse', COMPLETED: 'bg-green-500', FAILED: 'bg-red-500',
};
const STATUS_LABEL: Record<JobStatus, string> = {
  IDLE: 'Idle', SUBMITTING: 'Submitting...', IN_QUEUE: 'In Queue',
  IN_PROGRESS: 'Generating...', COMPLETED: 'Completed', FAILED: 'Failed',
};

export default function NanaBananaEdit() {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const [prompt, setPrompt] = useState('Change the man to a woman, and hold a digital-style banana.');
  const [resolution, setResolution] = useState('1k');
  const [outputFormat, setOutputFormat] = useState('png');
  const [safetyChecker, setSafetyChecker] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [status, setStatus] = useState<JobStatus>('IDLE');
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultTab, setResultTab] = useState<'preview' | 'json'>('preview');
  const [rawJson, setRawJson] = useState<any>(null);
  const [lightbox, setLightbox] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const uploadImage = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target?.result as string;
        try {
          const res = await authorizedFetch('/api/image/upload', { method: 'POST', body: JSON.stringify({ base64, filename: file.name, contentType: file.type || 'image/jpeg' }) });
          const data = await res.json();
          if (data.success && data.url) resolve(data.url);
          else reject(new Error(data.error || 'Upload gagal'));
        } catch (err: any) { reject(err); }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file'));
      reader.readAsDataURL(file);
    });
  };

  const addFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (file.size > 16 * 1024 * 1024) { showAlert('Ukuran file maksimal 16MB', 'error'); return; }
    const newImg: UploadedImage = { preview: URL.createObjectURL(file), publicUrl: '', name: file.name, uploading: true };
    setImage(newImg);
    try {
      const url = await uploadImage(file);
      setImage(prev => prev ? { ...prev, publicUrl: url, uploading: false } : null);
    } catch (err: any) {
      setImage(prev => prev ? { ...prev, uploading: false, error: err.message } : null);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) addFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) addFile(file);
  };

  const removeImage = () => {
    if (image?.preview.startsWith('blob:')) URL.revokeObjectURL(image.preview);
    setImage(null);
  };

  useEffect(() => {
    if (!jobId || status === 'COMPLETED' || status === 'FAILED') { if (pollRef.current) clearInterval(pollRef.current); return; }
    pollRef.current = setInterval(async () => {
      try {
        const res = await authorizedFetch(`/api/image/nano-banana/status/${jobId}`);
        const data = await res.json();
        if (!data.success) return;
        setStatus(data.status as JobStatus);
        setRawJson(data.raw);
        if (data.status === 'COMPLETED' && data.imageUrl) { setResultUrl(data.imageUrl); if (pollRef.current) clearInterval(pollRef.current); }
        else if (data.status === 'FAILED') { if (pollRef.current) clearInterval(pollRef.current); }
      } catch { }
    }, 2500);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [jobId, status]);

  const handleRun = async () => {
    if (!prompt.trim()) { showAlert('Prompt tidak boleh kosong', 'error'); return; }
    if (!image) { showAlert('Upload minimal 1 gambar referensi', 'error'); return; }
    if (image.uploading) { showAlert('Tunggu upload selesai', 'error'); return; }
    if (image.error) { showAlert('Gambar gagal diupload, coba lagi', 'error'); return; }
    setResultUrl(null); setRawJson(null); setJobId(null); setStatus('SUBMITTING');
    try {
      const res = await authorizedFetch('/api/image/nano-banana/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt: prompt.trim(), resolution, output_format: outputFormat, enable_safety_checker: safetyChecker, image: image.publicUrl }),
      });
      const data = await res.json();
      if (data.success && data.jobId) { setJobId(data.jobId); setStatus('IN_QUEUE'); }
      else throw new Error(data.error || 'Gagal submit');
    } catch (err: any) { setStatus('FAILED'); showAlert(err.message || 'Terjadi kesalahan', 'error'); }
  };

  const handleReset = () => {
    if (image?.preview.startsWith('blob:')) URL.revokeObjectURL(image.preview);
    setImage(null); setPrompt(''); setResultUrl(null); setRawJson(null); setJobId(null); setStatus('IDLE');
    if (pollRef.current) clearInterval(pollRef.current);
  };

  const handleDownload = async () => {
    if (!resultUrl) return;
    try {
      const res = await fetch(resultUrl, { mode: 'cors' });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const ext = outputFormat === 'png' ? 'png' : outputFormat === 'webp' ? 'webp' : 'jpg';
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `nano-banana-${Date.now()}.${ext}`;
      a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(a.href); }, 100);
    } catch {
      const a = document.createElement('a');
      a.href = resultUrl; a.download = `nano-banana-${Date.now()}.${outputFormat}`; a.target = '_self'; a.style.display = 'none';
      document.body.appendChild(a); a.click();
      setTimeout(() => document.body.removeChild(a), 100);
    }
  };

  const isRunning = status === 'SUBMITTING' || status === 'IN_QUEUE' || status === 'IN_PROGRESS';
  const canRun = !!image && !image.uploading && !image.error && !!image.publicUrl && !!prompt.trim();

  return (
    <div className="flex min-h-screen flex-col bg-[#050505] text-white">
      {/* Top bar */}
      <div className="flex h-12 items-center justify-between border-b border-white/[0.06] px-4 bg-[#111]">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-sm font-semibold">Nano Banana Edit</span>
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs text-gray-400">Google Nano Banana 2</span>
        </div>
        <div className="w-24" />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT */}
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
                onChange={e => { setPrompt(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                ref={el => { if (el) { el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; } }}
                placeholder="Describe what you want to change..."
                className="w-full resize-none overflow-hidden rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-gray-600 focus:border-yellow-500/50 focus:outline-none min-h-[80px]"
                style={{ height: 'auto' }}
              />
            </div>

            {/* Image Upload */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-400">
                Image <span className="text-red-400">*</span>
                <span className="ml-1 text-gray-600">(1 gambar, maks 16MB)</span>
              </label>
              {image ? (
                <div className="mb-2 flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
                  <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded">
                    <img src={image.preview} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs text-gray-300">
                      {image.uploading ? 'Uploading...' : image.error ? image.error : image.publicUrl || image.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {image.uploading && <Loader2 className="h-3.5 w-3.5 animate-spin text-yellow-400" />}
                    {image.error && <AlertCircle className="h-3.5 w-3.5 text-red-400" />}
                    {!image.uploading && !image.error && <div className="h-2 w-2 rounded-full bg-green-500" />}
                    <button onClick={removeImage} className="text-gray-500 hover:text-red-400 transition">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-8 transition ${isDragging ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'}`}
                >
                  <Plus className="h-5 w-5 text-gray-500" />
                  <span className="text-xs text-gray-500">Upload or drag and drop</span>
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileInput} />
              <p className="mt-1.5 text-xs text-gray-600">jpeg, jpg, png up to 16MB</p>
            </div>

            {/* Additional Settings */}
            <div className="rounded-lg border border-white/10">
              <button type="button" onClick={() => setShowSettings(!showSettings)}
                className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-400 hover:text-white transition">
                <span>Additional settings</span>
                {showSettings ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {showSettings && (
                <div className="border-t border-white/10 px-4 py-4 space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-400">Resolution</label>
                    <div className="flex gap-2">
                      {RESOLUTIONS.map(r => (
                        <button key={r.value} onClick={() => setResolution(r.value)}
                          className={`flex-1 rounded-lg border py-2 text-center transition ${resolution === r.value ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>
                          <p className="text-sm font-bold">{r.label}</p>
                          <p className="text-xs opacity-60">{r.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-medium text-gray-400">Output Format</label>
                    <div className="flex gap-2">
                      {OUTPUT_FORMATS.map(f => (
                        <button key={f.value} onClick={() => setOutputFormat(f.value)}
                          className={`flex-1 rounded-lg border py-2 text-sm font-medium transition ${outputFormat === f.value ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-400' : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400">Safety Checker</label>
                    <button type="button" onClick={() => setSafetyChecker(!safetyChecker)}
                      className={`relative h-5 w-9 rounded-full transition ${safetyChecker ? 'bg-yellow-500' : 'bg-white/10'}`}>
                      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${safetyChecker ? 'left-4' : 'left-0.5'}`} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-white/[0.06] px-4 py-3 flex items-center justify-end gap-3">
            <button onClick={handleReset} disabled={isRunning}
              className="rounded-lg border border-white/10 px-5 py-2 text-sm font-medium text-gray-400 hover:border-white/20 hover:text-white transition disabled:opacity-40">
              Reset
            </button>
            <button onClick={handleRun} disabled={isRunning || !canRun}
              className="flex items-center gap-2 rounded-lg bg-yellow-500 px-6 py-2 text-sm font-semibold text-black hover:bg-yellow-400 transition disabled:opacity-40">
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isRunning ? STATUS_LABEL[status] : 'Run'}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-1 flex-col">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">Result</span>
              <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-1">
                <div className={`h-2 w-2 rounded-full ${STATUS_DOT[status]}`} />
                <span className="text-xs text-gray-400">{STATUS_LABEL[status]}</span>
              </div>
            </div>
            {resultUrl && (
              <div className="flex items-center gap-2">
                <div className="flex rounded-lg border border-white/10 overflow-hidden">
                  <button onClick={() => setResultTab('preview')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition ${resultTab === 'preview' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    <ImageIcon className="h-3.5 w-3.5" /> Preview
                  </button>
                  <button onClick={() => setResultTab('json')} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition ${resultTab === 'json' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    <FileImage className="h-3.5 w-3.5" /> JSON
                  </button>
                </div>
                <button onClick={handleDownload} className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:border-white/20 hover:text-white transition">
                  <Download className="h-3.5 w-3.5" /> Download image
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {resultUrl && resultTab === 'preview' ? (
              <div className="relative group max-h-full">
                <img src={resultUrl} alt="Generated" className="max-h-[calc(100vh-120px)] max-w-full rounded-xl object-contain shadow-2xl" />
                <button onClick={() => setLightbox(true)} className="absolute right-3 top-3 hidden group-hover:flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur-sm hover:bg-black/80">
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
                  <div className="h-20 w-20 rounded-full border-4 border-white/10" />
                  <div className="absolute inset-0 h-20 w-20 animate-spin rounded-full border-4 border-transparent border-t-yellow-500" />
                  <div className="absolute inset-3 flex items-center justify-center text-2xl">🍌</div>
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{STATUS_LABEL[status]}</p>
                  <p className="mt-1 text-sm text-gray-400">Biasanya 15–60 detik, harap tunggu...</p>
                </div>
                <div className="w-64 overflow-hidden rounded-full bg-white/10">
                  <div className="h-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000"
                    style={{ width: status === 'IN_PROGRESS' ? '75%' : status === 'IN_QUEUE' ? '35%' : '10%' }} />
                </div>
              </div>
            ) : status === 'FAILED' ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                  <AlertCircle className="h-8 w-8 text-red-400" />
                </div>
                <p className="font-semibold text-white">Generation Failed</p>
                <p className="text-sm text-gray-400">Coba lagi dengan prompt atau gambar berbeda</p>
                <button onClick={() => setStatus('IDLE')} className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-400 hover:text-white transition">
                  <RefreshCw className="h-4 w-4" /> Coba Lagi
                </button>
              </div>
            ) : (
              <div className="relative flex flex-col items-center justify-center h-full">
                <div className="relative w-full max-w-lg overflow-hidden rounded-2xl">
                  <img
                    src="https://image.runpod.ai/preview/google/google-nano-banana-2-edit.png"
                    alt="Contoh hasil Nano Banana Edit"
                    className="w-full object-cover opacity-60 rounded-2xl"
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent rounded-2xl" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 text-center">
                    <p className="text-sm font-semibold text-white mb-1">Contoh hasil Nano Banana Edit</p>
                    <p className="text-xs text-gray-300">Upload gambar + tulis prompt → klik Run</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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
