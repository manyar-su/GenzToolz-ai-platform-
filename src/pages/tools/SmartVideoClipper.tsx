import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Info, Youtube, Upload, Film, Scissors, Type, Bell, Play, Clock, Eye } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useAlert } from '../../context/AlertContext';
import { authorizedFetch } from '../../lib/api-client';

interface Clip {
  id: string;
  title: string;
  type: string;
  summary?: string;
  startTime: string;
  duration: string;
  startSeconds?: number;
  endSeconds?: number;
  previewUrl: string;
  fullUrl: string;
  score: number;
  source?: 'youtube' | 'file';
}

interface JobStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    durationSeconds?: number;
    clips: Clip[];
  };
  error?: string;
}

export default function SmartVideoClipper() {
  const navigate = useNavigate();
  const { deductToken, tokens } = useTokenStore();
  const { addToHistory } = useHistoryStore();
  const { showAlert } = useAlert();
  const [videoUrl, setVideoUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'link' | 'upload'>('link');
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<JobStatus | null>(null);
  const [notification, setNotification] = useState(false);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const hasSavedRef = useRef(false);

  // Poll for status when job is active
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await authorizedFetch(`/api/tools/smart-clipper/status/${job.id}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
          if (data.data.status === 'completed') {
            setNotification(true);
            if (data.data.result?.clips?.length > 0) {
              setSelectedClip(data.data.result.clips[0]);
            }
          }
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [job]);

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setJob(null);
    setSelectedClip(null);
    hasSavedRef.current = false;

    try {
      const response = await authorizedFetch('/api/tools/smart-clipper/start', {
        method: 'POST',
        body: JSON.stringify({ videoUrl: activeTab === 'link' ? videoUrl : 'uploaded_file_mock' }),
      });
      
      const data = await response.json();
      if (data.success) {
        setJob({ id: data.jobId, status: 'queued', progress: 0 });
      } else {
        showAlert(data.error || 'Gagal memulai proses', 'error');
      }
    } catch (error) {
      showAlert('Terjadi kesalahan koneksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!selectedClip) return;
    
    // Simulate Download Logic
    const url = removeWatermark ? selectedClip.fullUrl : selectedClip.previewUrl;
    const filename = removeWatermark 
        ? `genztools-clip-clean-${selectedClip.id}.mp4`
        : `genztools-clip-watermark-${selectedClip.id}.mp4`;

    alert(`Mengunduh video... ${removeWatermark ? '(Tanpa Watermark)' : '(Dengan Watermark)'}`);

    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getSourceId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      return null;
    } catch {
      return null;
    }
  };

  const sourceId = getSourceId(videoUrl);
  const isYouTubePreview = !!selectedClip?.previewUrl?.includes('youtube.com/embed');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-6xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        {/* Notification Toast */}
        {notification && (
          <div className="fixed top-4 right-4 z-50 animate-bounce rounded-lg bg-green-500 px-6 py-4 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-6 w-6" />
              <div>
                <h4 className="font-bold">Proses Selesai!</h4>
                <p className="text-sm">Video Anda siap ditonton.</p>
              </div>
              <button onClick={() => setNotification(false)} className="ml-2 text-white/80 hover:text-white">✕</button>
            </div>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Panel: Input */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Smart Video Clipper</h1>
              
              <div className="mb-6 rounded-lg bg-purple-50 p-4 text-sm text-purple-800 dark:bg-purple-900/30 dark:text-purple-200">
                <div className="flex items-start">
                  <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                  <p>
                    <strong>Fitur:</strong> Auto-Reframe (9:16), Highlight Detection, & Instant Subtitles.
                    <br/>
                    <span className="mt-2 block font-semibold">Gratis Preview & Watermark.</span>
                    <span className="block font-semibold text-purple-700 dark:text-purple-300">Unlock Full: 5 Token.</span>
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div className="mb-6 flex rounded-lg bg-gray-100 p-1 dark:bg-gray-700">
                <button
                  onClick={() => setActiveTab('link')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    activeTab === 'link' 
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  Link YouTube
                </button>
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                    activeTab === 'upload' 
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' 
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
                  }`}
                >
                  Upload File
                </button>
              </div>

              <form onSubmit={handleStart} className="space-y-6">
                {activeTab === 'link' ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Link Video
                    </label>
                    <div className="relative">
                      <Youtube className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        required
                        type="url"
                        value={videoUrl}
                        onChange={(e) => setVideoUrl(e.target.value)}
                        placeholder="https://youtube.com/watch?v=..."
                        className="w-full rounded-lg border border-gray-300 pl-10 p-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    {/* Source Preview */}
                    {sourceId && (
                      <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 shadow-sm dark:border-gray-700">
                        <img 
                          src={`https://img.youtube.com/vi/${sourceId}/mqdefault.jpg`} 
                          alt="Video Thumbnail" 
                          className="h-full w-full object-cover"
                        />
                        <div className="bg-gray-50 p-2 text-center text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          Video Sumber Terdeteksi
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-purple-500 dark:border-gray-600">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Drag & drop video atau klik untuk upload</p>
                    <p className="mt-1 text-xs text-gray-400">(Max 500MB)</p>
                  </div>
                )}

                {/* Watermark Option */}
                <div className="flex items-center space-x-2 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                  <input
                    type="checkbox"
                    id="removeWatermark"
                    checked={removeWatermark}
                    onChange={(e) => setRemoveWatermark(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <label htmlFor="removeWatermark" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hapus Watermark (Gratis)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading || (job?.status === 'queued' || job?.status === 'processing')}
                  className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memulai...
                    </>
                  ) : job?.status === 'processing' ? (
                    'Sedang Memproses...'
                  ) : (
                    'Mulai Clipping AI'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Status & Result */}
          <div className="lg:col-span-2 space-y-6">
            {!job ? (
              <div className="flex h-full flex-col items-center justify-center rounded-xl bg-white p-12 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                <div className="mb-6 flex gap-4">
                  <div className="rounded-full bg-blue-100 p-4 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                    <Scissors className="h-8 w-8" />
                  </div>
                  <div className="rounded-full bg-pink-100 p-4 text-pink-600 dark:bg-pink-900/20 dark:text-pink-400">
                    <Film className="h-8 w-8" />
                  </div>
                  <div className="rounded-full bg-yellow-100 p-4 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
                    <Type className="h-8 w-8" />
                  </div>
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">AI Video Processing</h3>
                <p className="max-w-md text-gray-500 dark:text-gray-400">
                  Sistem kami akan otomatis memotong bagian terbaik, mengubah rasio ke 9:16, dan menambahkan subtitle otomatis.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Progress Bar */}
                {job.status !== 'completed' && job.status !== 'failed' && (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-purple-600" />
                    <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Sedang Memproses Video...</h3>
                    <p className="mb-6 text-sm text-gray-500">Anda bisa meninggalkan halaman ini, kami akan memberi notifikasi saat selesai.</p>
                    
                    <div className="relative h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <div 
                        className="absolute left-0 top-0 h-full bg-purple-600 transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Analyzing Views...</span>
                      <span>Reframing 9:16...</span>
                      <span>Subtitling...</span>
                    </div>
                  </div>
                )}
                {job.status === 'failed' && (
                  <div className="rounded-xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                    <h3 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">Proses Gagal</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{job.error || 'Terjadi kesalahan saat memproses video.'}</p>
                  </div>
                )}

                {/* Result Preview */}
                {job.status === 'completed' && job.result && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {/* Main Player */}
                    <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Preview</h2>
                        {selectedClip && (
                          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                            {selectedClip.type}
                          </span>
                        )}
                      </div>

                      <div className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-2xl bg-black shadow-2xl">
                        {isYouTubePreview ? (
                          <iframe
                            key={selectedClip?.id}
                            src={selectedClip?.previewUrl}
                            className="h-full w-full"
                            title={`Preview ${selectedClip?.title}`}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <video 
                            key={selectedClip?.id}
                            src={selectedClip?.previewUrl} 
                            controls 
                            autoPlay 
                            loop
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              console.error("Video Error:", e);
                              showAlert("Gagal memuat preview video. Pastikan koneksi internet stabil.", 'error');
                            }}
                          />
                        )}
                        {/* Watermark Overlay Simulation */}
                        <div className="pointer-events-none absolute bottom-8 right-4 opacity-50">
                          <span className="font-black text-white drop-shadow-md">GenzTools</span>
                        </div>
                      </div>

                      {selectedClip && (
                        <div className="mt-6 space-y-4">
                          <div className="flex flex-wrap justify-between gap-2 text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Timestamp: <span className="font-mono text-gray-900 dark:text-white">{selectedClip.startTime}</span></span>
                            <span className="text-gray-500 dark:text-gray-400">Durasi: <span className="font-mono text-gray-900 dark:text-white">{selectedClip.duration}</span></span>
                            {selectedClip.startSeconds !== undefined && selectedClip.endSeconds !== undefined && (
                              <span className="text-gray-500 dark:text-gray-400">Start–End: <span className="font-mono text-gray-900 dark:text-white">{selectedClip.startSeconds}s–{selectedClip.endSeconds}s</span></span>
                            )}
                          </div>
                          {job.result?.durationSeconds && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">Durasi video: <span className="font-mono text-gray-900 dark:text-white">{job.result.durationSeconds}s</span></div>
                          )}
                          {selectedClip.summary && (
                            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              {selectedClip.summary}
                            </div>
                          )}
                          
                          <div className="grid gap-3">
                            <button
                              onClick={handleDownload}
                              className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 font-bold text-white transition hover:from-purple-700 hover:to-indigo-700"
                            >
                              Download Video {removeWatermark ? '(No Watermark)' : ''}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Clip List */}
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900 dark:text-white">Pilihan Highlight</h3>
                      {job.result.clips.map((clip) => (
                        <div 
                          key={clip.id}
                          onClick={() => setSelectedClip(clip)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all hover:shadow-md ${
                            selectedClip?.id === clip.id 
                              ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20' 
                              : 'border-gray-200 bg-white hover:border-purple-300 dark:border-gray-700 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="font-bold text-gray-900 dark:text-white">{clip.title}</h4>
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{clip.type}</p>
                              {clip.summary && (
                                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{clip.summary}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                              <Eye className="h-3 w-3" />
                              {clip.score}% Retention
                            </div>
                          </div>
                          
                          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Start: {clip.startTime}
                            </div>
                            <div className="flex items-center gap-1">
                              <Film className="h-3 w-3" />
                              Durasi: {clip.duration}
                            </div>
                            {clip.startSeconds !== undefined && clip.endSeconds !== undefined && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {clip.startSeconds}s–{clip.endSeconds}s
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
