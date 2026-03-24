import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, FileVideo, CheckCircle, AlertCircle, Play, Download, Lock } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { authorizedFetch } from '../../lib/api-client';

interface SubtitleJob {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: {
    videoUrl: string;
    srtUrl: string;
    hasWatermark: boolean;
  };
  error?: string;
}

export default function SubtitleGenerator() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  
  // State
  const [file, setFile] = useState<File | null>(null);
  const [removeWatermark, setRemoveWatermark] = useState(false);
  const [loading, setLoading] = useState(false);
  const [job, setJob] = useState<SubtitleJob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Poll for job status
  useEffect(() => {
    if (!job || job.status === 'completed' || job.status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await authorizedFetch(`/api/tools/auto-subtitle/status/${job.id}`);
        const data = await res.json();
        if (data.success) {
          setJob(data.data);
        }
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [job]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Create local preview
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    if (!deductToken(3)) {
      alert('Token tidak cukup! Butuh 3 Token.');
      return;
    }

    setLoading(true);
    setJob(null);

    try {
      // In real app, we would append file to FormData
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('userStatus', userStatus);

      const response = await authorizedFetch('/api/tools/auto-subtitle/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          file: file.name, // Mock file
          removeWatermark 
        }),
      });
      
      const data = await response.json();
      if (data.success) {
        setJob({ id: data.jobId, status: 'queued', progress: 0 });
      } else {
        alert(data.error || 'Gagal memulai proses');
      }
    } catch (error) {
      alert('Terjadi kesalahan koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-5xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Panel: Configuration */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
              <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">AI Auto Subtitle</h1>
              
              {/* Watermark Option */}
              <div className="mb-6 rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="removeWatermark"
                    checked={removeWatermark}
                    onChange={(e) => setRemoveWatermark(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="removeWatermark" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hapus Watermark (Gratis)
                  </label>
                </div>
              </div>

              <form onSubmit={handleStart} className="space-y-6">
                {/* File Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Upload Video
                  </label>
                  <div className="relative flex min-h-[150px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600">
                    <input 
                      type="file" 
                      accept="video/*"
                      onChange={handleFileChange}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                    {file ? (
                      <div className="text-center">
                        <FileVideo className="mx-auto mb-2 h-8 w-8 text-blue-500" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Klik untuk upload video</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Auto Subtitle</span>
                        <span className="text-green-500 flex items-center"><CheckCircle className="h-3 w-3 mr-1"/> Aktif</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">Watermark</span>
                        {!removeWatermark ? (
                            <span className="text-red-500 font-medium">Aktif</span>
                        ) : (
                            <span className="text-gray-400 line-through">Dihapus</span>
                        )}
                    </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !file || (job?.status === 'queued' || job?.status === 'processing')}
                  className="flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memulai...</>
                  ) : job?.status === 'processing' ? (
                    'Sedang Memproses...'
                  ) : (
                    'Generate Subtitle (3 Token)'
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Panel: Preview & Status */}
          <div className="lg:col-span-2">
            {!job ? (
               <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-xl bg-gray-100 text-center dark:bg-gray-800">
                  {previewUrl ? (
                      <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-lg overflow-hidden shadow-xl">
                          <video src={previewUrl} className="w-full h-full object-cover" controls />
                          <div className="absolute top-0 left-0 right-0 bg-black/50 p-2 text-white text-xs text-center">
                              Original Preview
                          </div>
                      </div>
                  ) : (
                    <>
                        <FileVideo className="mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Preview Area</h3>
                        <p className="text-gray-500 dark:text-gray-400">Upload video untuk melihat preview</p>
                    </>
                  )}
               </div>
            ) : (
              <div className="space-y-6">
                {/* Progress Status */}
                {job.status !== 'completed' && (
                   <div className="rounded-xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
                      <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-blue-600" />
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {job.progress < 30 ? 'Mengupload Video...' : 
                         job.progress < 60 ? 'Mengekstrak Audio...' :
                         job.progress < 80 ? 'Whisper AI Transcription...' :
                         'Burning Subtitles & Rendering...'}
                      </h3>
                      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                        <div 
                            className="h-full bg-blue-600 transition-all duration-300" 
                            style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <p className="mt-2 text-sm text-gray-500">{job.progress}% Complete</p>
                   </div>
                )}

                {/* Result */}
                {job.status === 'completed' && job.result && (
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
                            <h3 className="mb-4 font-bold text-gray-900 dark:text-white">Hasil Video</h3>
                            <div className="relative mx-auto aspect-[9/16] w-full max-w-sm overflow-hidden rounded-xl bg-black shadow-lg">
                                <video 
                                    src={job.result.videoUrl} 
                                    controls 
                                    autoPlay 
                                    loop
                                    className="h-full w-full object-cover"
                                />
                                {/* Simulated Hardcoded Subtitles */}
                                <div className="absolute bottom-20 left-4 right-4 text-center">
                                    <span className="inline-block rounded-lg bg-yellow-400 px-2 py-1 font-sans text-lg font-black text-black shadow-md border-2 border-black transform -rotate-1">
                                        Subtitle Gen-Z Style! 🔥
                                    </span>
                                </div>
                                {/* Watermark */}
                                {job.result.hasWatermark && (
                                    <div className="absolute top-4 right-4 rounded bg-white/20 px-2 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                        genztools.com
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-xl bg-green-50 p-6 dark:bg-green-900/20">
                                <div className="flex items-center gap-3">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                    <div>
                                        <h4 className="font-bold text-green-800 dark:text-green-300">Selesai!</h4>
                                        <p className="text-sm text-green-700 dark:text-green-400">Subtitle berhasil dibuat.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl bg-gray-50 p-6 dark:bg-gray-700/50">
                                <h4 className="mb-2 font-bold text-gray-900 dark:text-white">Detail Proses</h4>
                                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-blue-500" /> 
                                        Transcription (Whisper AI)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-blue-500" /> 
                                        Subtitle Burn-in (FFmpeg)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        {job.result.hasWatermark ? (
                                            <CheckCircle className="h-4 w-4 text-orange-500" /> 
                                        ) : (
                                            <CheckCircle className="h-4 w-4 text-gray-400" /> 
                                        )}
                                        {job.result.hasWatermark ? 'Watermark Applied' : 'No Watermark'}
                                    </li>
                                </ul>
                            </div>

                            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700">
                                <Download className="h-4 w-4" /> Download Video
                            </button>
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
