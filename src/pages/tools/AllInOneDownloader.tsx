import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Search, Youtube, AlertCircle, Video, Instagram, Music } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import { useAlert } from '../../context/AlertContext';

export default function AllInOneDownloader() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const { addToHistory } = useHistoryStore();
  const { showAlert, showConfirm } = useAlert();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [platform, setPlatform] = useState<'youtube' | 'tiktok' | 'instagram' | null>(null);
  const [downloadType, setDownloadType] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState('720p');

  // Auto-detect platform and preview on paste
  useEffect(() => {
    if (!url) {
        setPlatform(null);
        return;
    }

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
        setPlatform('youtube');
    } else if (url.includes('tiktok.com')) {
        setPlatform('tiktok');
    } else if (url.includes('instagram.com')) {
        setPlatform('instagram');
    } else {
        setPlatform(null);
    }
  }, [url]);

  const getVideoId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
      if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
      return null;
    } catch {
      return null;
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setResult(null);
    
    if (!platform) {
      setError('Link tidak dikenali atau belum didukung. Coba YouTube, TikTok, atau Instagram.');
      return;
    }

    setLoading(true);

    try {
        if (platform === 'youtube') {
            const videoId = getVideoId(url);
            if (!videoId) throw new Error('ID Video YouTube tidak valid.');

            // Use our backend proxy to call RapidAPI
            const response = await authorizedFetch(`/api/tools/rapidapi/youtube/details?videoId=${videoId}`);
            const data = await response.json();

            if (data.success && data.data) {
                const items = data.data.items || [];
                if (items.length > 0) {
                    setResult({
                        title: items[0].title,
                        thumbnail: items[0].thumbnails?.[items[0].thumbnails.length - 1]?.url,
                        author: items[0].channel?.name,
                        platform: 'YouTube'
                    });
                    addToHistory({
                        toolName: 'All-in-One Downloader',
                        input: url,
                        output: `Found YouTube: ${items[0].title}`,
                        type: 'video'
                    });
                } else {
                    setError('Video tidak ditemukan.');
                }
            } else {
                // Fallback for demo if API fails
                setResult({
                    title: 'Demo YouTube Video (API Quota Exceeded)',
                    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    author: 'Unknown Channel',
                    platform: 'YouTube'
                });
            }
        } else if (platform === 'tiktok') {
            // Mock TikTok Logic
            setTimeout(() => {
                setResult({
                    title: 'TikTok Viral Video #FYP',
                    thumbnail: 'https://placehold.co/600x800/000000/FFF?text=TikTok+Preview',
                    author: '@tiktok_creator',
                    platform: 'TikTok'
                });
                setLoading(false);
            }, 1500);
            return; // Exit early to avoid finally block conflict if async
        } else if (platform === 'instagram') {
            // Mock Instagram Logic
            setTimeout(() => {
                setResult({
                    title: 'Instagram Reel / Post',
                    thumbnail: 'https://placehold.co/600x600/E1306C/FFF?text=IG+Post',
                    author: '@insta_user',
                    platform: 'Instagram'
                });
                setLoading(false);
            }, 1500);
            return;
        }
    } catch (err) {
        console.error(err);
        // Fallback for YouTube error
        if (platform === 'youtube') {
             const videoId = getVideoId(url);
             if (videoId) {
                 setResult({
                    title: 'YouTube Video (Preview Mode)',
                    thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
                    author: 'Channel Name',
                    platform: 'YouTube'
                });
             } else {
                 setError('Gagal memuat preview.');
             }
        } else {
            setError('Terjadi kesalahan koneksi.');
        }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (deductToken(1)) {
        showAlert('Download dimulai! (Simulasi)', 'success');
        
        // Create dummy download link
        const link = document.createElement('a');
        link.href = result?.thumbnail || '#'; // Dummy link
        link.download = `download_${Date.now()}.jpg`; // Dummy file
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } else {
        showConfirm(
            'Token Anda tidak mencukupi untuk menggunakan tools ini. Silakan Top-up terlebih dahulu.',
            () => navigate('/topup'),
            {
                title: 'Saldo Tidak Cukup',
                confirmText: 'Top Up Sekarang',
                cancelText: 'Batal'
            }
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-8 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400">
              <Download className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All-in-One Downloader</h1>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              Download video dari YouTube, TikTok, Instagram tanpa watermark.
            </p>
          </div>

          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative flex items-center">
              <div className="absolute left-4 flex items-center gap-2 text-gray-400">
                  {platform === 'youtube' && <Youtube className="h-6 w-6 text-red-500" />}
                  {platform === 'tiktok' && <Music className="h-6 w-6 text-black dark:text-white" />}
                  {platform === 'instagram' && <Instagram className="h-6 w-6 text-pink-500" />}
                  {!platform && <Search className="h-6 w-6" />}
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Tempel link YouTube, TikTok, atau Instagram..."
                className="w-full rounded-l-xl border border-gray-300 py-4 pl-14 pr-4 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-r-xl bg-red-600 px-8 py-4 font-bold text-white transition hover:bg-red-700 disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'Cari'}
              </button>
            </div>
            {error && (
              <div className="mt-3 flex items-center text-sm text-red-500">
                <AlertCircle className="mr-2 h-4 w-4" />
                {error}
              </div>
            )}
          </form>

          {result && (
            <div className="animate-fade-in overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative aspect-video w-full overflow-hidden md:rounded-l-xl bg-black">
                  <img 
                    src={result.thumbnail || ''} 
                    alt={result.title}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center p-6">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-bold uppercase text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                        {result.platform}
                    </span>
                  </div>
                  <h3 className="mb-2 text-xl font-bold leading-tight text-gray-900 dark:text-white line-clamp-2">
                    {result.title}
                  </h3>
                  <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">{result.author}</span>
                  </div>

                  {/* Format Selection */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Format:</label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => { setDownloadType('video'); setQuality('720p'); }}
                            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                downloadType === 'video'
                                    ? 'bg-red-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <Video className="mb-1 mx-auto h-4 w-4" />
                            Video (MP4)
                        </button>
                        <button
                            onClick={() => { setDownloadType('audio'); setQuality('128kbps'); }}
                            className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                                downloadType === 'audio'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                        >
                            <Music className="mb-1 mx-auto h-4 w-4" />
                            Audio (MP3)
                        </button>
                    </div>
                  </div>

                  {/* Quality Selection */}
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Kualitas:</label>
                    <select
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 p-2.5 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    >
                        {downloadType === 'video' ? (
                            <>
                                <option value="1080p">1080p (HD)</option>
                                <option value="720p">720p (HD)</option>
                                <option value="480p">480p</option>
                                <option value="360p">360p</option>
                            </>
                        ) : (
                            <>
                                <option value="320kbps">320kbps (High Quality)</option>
                                <option value="192kbps">192kbps (Standard)</option>
                                <option value="128kbps">128kbps (Low)</option>
                            </>
                        )}
                    </select>
                  </div>
                  
                  <button
                    onClick={handleDownload}
                    className="flex w-full items-center justify-center rounded-lg bg-green-600 px-6 py-3 font-bold text-white transition hover:bg-green-700"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download {downloadType === 'video' ? 'Video' : 'Audio'} ({quality})
                  </button>
                  <p className="mt-3 text-center text-xs text-gray-500">
                    Biaya: 1 Token
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
