import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Download, Search, Music, Video,
  Clock, Eye, ThumbsUp, Info, CheckCircle
} from 'lucide-react';
import { authorizedFetch } from '../../lib/api-client';
import { useTokenStore } from '../../store/useTokenStore';
import { useAlert } from '../../context/AlertContext';

interface YTResult {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
}

const YTIcon = () => (
  <svg viewBox="0 0 24 24" className="h-9 w-9 fill-white">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const YTIconSmall = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-red-500">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const formatNumber = (n: number) => {
  if (!n) return '0';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
};

const formatDuration = (seconds: number) => {
  if (!seconds) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

const getVideoId = (url: string) => {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v');
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('?')[0];
  } catch {}
  if (/^[a-zA-Z0-9_-]{11}$/.test(url.trim())) return url.trim();
  return null;
};

export default function YouTubeMusicDownloader() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const { showAlert } = useAlert();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<YTResult | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [format, setFormat] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState('720p');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const videoId = getVideoId(url.trim());
    if (!videoId) {
      showAlert('URL YouTube tidak valid', 'error');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const res = await authorizedFetch(`/api/tools/rapidapi/youtube/details?videoId=${videoId}`);
      const data = await res.json();

      if (data.success && data.data?.items?.[0]) {
        const item = data.data.items[0];
        setResult({
          videoId,
          title: item.title || 'YouTube Video',
          author: item.channel?.name || 'Unknown',
          thumbnail: item.thumbnails?.[item.thumbnails.length - 1]?.url
            || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: formatDuration(Number(item.lengthSeconds || 0)),
          views: formatNumber(Number(item.viewCount || 0)),
          likes: formatNumber(Number(item.likeCount || 0)),
        });
      } else {
        setResult({
          videoId,
          title: 'YouTube Video',
          author: 'Unknown Channel',
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          duration: '-',
          views: '-',
          likes: '-',
        });
      }
      fetchBalance();
    } catch {
      const vid = getVideoId(url.trim());
      if (vid) {
        setResult({
          videoId: vid,
          title: 'YouTube Video',
          author: 'Unknown',
          thumbnail: `https://img.youtube.com/vi/${vid}/hqdefault.jpg`,
          duration: '-', views: '-', likes: '-',
        });
        fetchBalance();
      } else {
        showAlert('Gagal mengambil info video', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!result) return;
    if (!await deductToken(1)) {
      showAlert('Token tidak cukup! Silakan top-up.', 'error');
      return;
    }
    setDownloading(format);
    const cobaltUrl = `https://cobalt.tools/#${encodeURIComponent(`https://www.youtube.com/watch?v=${result.videoId}`)}`;
    window.open(cobaltUrl, '_blank');
    await fetchBalance();
    showAlert('Membuka halaman download. 1 token dipotong.', 'success');
    setDownloading(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate('/downloader')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-600 text-white shadow-lg">
            <YTIcon />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">YouTube Downloader</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Download video YouTube atau ekstrak audio MP3</p>
        </div>

        {/* Info */}
        <div className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Tempel link YouTube lalu klik Cari untuk melihat info video. <span className="font-semibold">Biaya: 1 Token per pencarian.</span></p>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <YTIconSmall />
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <YTIconSmall />
              </span>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full rounded-xl border border-gray-300 py-3.5 pl-10 pr-4 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>
        </form>

        {/* Result */}
        {result && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
            <div className="relative aspect-video w-full overflow-hidden bg-black">
              <img src={result.thumbnail} alt={result.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600/90 shadow-lg">
                  <Video className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>

            <div className="p-5">
              <h3 className="mb-1 text-lg font-bold text-gray-900 dark:text-white line-clamp-2">{result.title}</h3>
              <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{result.author}</p>

              <div className="mb-5 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                {result.duration !== '-' && (
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{result.duration}</span>
                )}
                {result.views !== '-' && (
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{result.views} views</span>
                )}
                {result.likes !== '-' && (
                  <span className="flex items-center gap-1"><ThumbsUp className="h-3.5 w-3.5" />{result.likes}</span>
                )}
              </div>

              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => { setFormat('video'); setQuality('720p'); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                    format === 'video' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Video className="h-4 w-4" /> Video (MP4)
                </button>
                <button
                  onClick={() => { setFormat('audio'); setQuality('128kbps'); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition ${
                    format === 'audio' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Music className="h-4 w-4" /> Audio (MP3)
                </button>
              </div>

              <div className="mb-5">
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Kualitas</label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-sm dark:border-gray-700 dark:bg-gray-700 dark:text-white"
                >
                  {format === 'video' ? (
                    <>
                      <option value="1080p">1080p Full HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p</option>
                      <option value="360p">360p</option>
                    </>
                  ) : (
                    <>
                      <option value="320kbps">320kbps (Terbaik)</option>
                      <option value="192kbps">192kbps</option>
                      <option value="128kbps">128kbps</option>
                    </>
                  )}
                </select>
              </div>

              <button
                onClick={handleDownload}
                disabled={!!downloading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5 font-bold text-white transition hover:bg-red-700 disabled:opacity-60"
              >
                {downloading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Download {format === 'video' ? `Video ${quality}` : `MP3 ${quality}`}
              </button>

              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Dibuka via cobalt.tools — downloader open source terpercaya</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
