import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Download, Search, Music, Video, Image as ImageIcon, Play, Heart, MessageCircle, Share2, Info, CheckCircle } from 'lucide-react';
import { authorizedFetch } from '../../lib/api-client';
import { useTokenStore } from '../../store/useTokenStore';
import { useAlert } from '../../context/AlertContext';

interface TikTokResult {
  id: string;
  title: string;
  author: { name: string; username: string; avatar: string };
  cover: string;
  duration: number;
  type: 'video' | 'photo';
  stats: { plays: number; likes: number; comments: number; shares: number };
  downloads: {
    video_hd?: string;
    video_sd?: string;
    photos?: string[];
    music?: string;
    music_title?: string;
    music_author?: string;
    music_cover?: string;
  };
}

const fmt = (n: number) => n >= 1e6 ? (n/1e6).toFixed(1)+'M' : n >= 1e3 ? (n/1e3).toFixed(1)+'K' : String(n);

export default function TikTokDownloader() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const { showAlert } = useAlert();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TikTokResult | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (!await deductToken(1)) { showAlert('Token tidak cukup!', 'error'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await authorizedFetch('/api/tiktok/info', { method: 'POST', body: JSON.stringify({ url: url.trim() }) });
      const data = await res.json();
      if (data.success) { setResult(data.data); fetchBalance(); }
      else showAlert(data.error || 'Gagal mengambil data', 'error');
    } catch { showAlert('Gagal terhubung ke server', 'error'); }
    finally { setLoading(false); }
  };

  const handleDownload = async (fileUrl: string, filename: string, type: string) => {
    if (!fileUrl) return;
    setDownloading(type);
    try {
      const res = await authorizedFetch(`/api/tiktok/proxy?url=${encodeURIComponent(fileUrl)}&filename=${encodeURIComponent(filename)}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      showAlert('Download berhasil!', 'success');
    } catch { showAlert('Gagal download. Coba lagi.', 'error'); }
    finally { setDownloading(null); }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-3xl">
        <button onClick={() => navigate('/downloader')} className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600">
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-black shadow-lg">
            <svg viewBox="0 0 24 24" className="h-9 w-9 fill-white">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">TikTok Downloader</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Download video, foto, dan musik TikTok tanpa watermark</p>
        </div>

        <div className="mb-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>Tempel link TikTok lalu klik Cari. <span className="font-semibold">Biaya: 1 Token per pencarian.</span></p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input type="text" value={url} onChange={e => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/..."
                className="w-full rounded-xl border border-gray-300 py-3.5 pl-10 pr-4 text-sm focus:border-black focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white" />
            </div>
            <button type="submit" disabled={loading || !url.trim()}
              className="flex items-center gap-2 rounded-xl bg-black px-6 py-3.5 font-semibold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-white dark:text-black">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>
        </form>

        {result && (
          <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-gray-800">
            <div className="flex gap-4 p-5 border-b border-gray-100 dark:border-gray-700">
              <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                {result.cover
                  ? <img src={result.cover} alt="cover" className="h-full w-full object-cover" />
                  : <div className="flex h-full items-center justify-center"><Video className="h-6 w-6 text-gray-400" /></div>}
                {result.type === 'video' && result.duration > 0 && (
                  <div className="absolute bottom-1 left-0 right-0 text-center">
                    <span className="rounded bg-black/60 px-1 text-xs text-white">{result.duration}s</span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="mb-1 flex items-center gap-2">
                  {result.author.avatar && <img src={result.author.avatar} alt="av" className="h-5 w-5 rounded-full object-cover" />}
                  <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">@{result.author.username || result.author.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${result.type === 'photo' ? 'bg-pink-100 text-pink-700' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                    {result.type === 'photo' ? 'Foto' : 'Video'}
                  </span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 mb-3">{result.title}</p>
                <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><Play className="h-3 w-3" />{fmt(result.stats.plays)}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" />{fmt(result.stats.likes)}</span>
                  <span className="flex items-center gap-1"><MessageCircle className="h-3 w-3" />{fmt(result.stats.comments)}</span>
                  <span className="flex items-center gap-1"><Share2 className="h-3 w-3" />{fmt(result.stats.shares)}</span>
                </div>
              </div>
            </div>

            <div className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Pilih Format Download</h3>

              {result.type === 'video' && (
                <>
                  {result.downloads.video_hd && (
                    <button onClick={() => handleDownload(result.downloads.video_hd!, `tiktok_${result.id}_hd.mp4`, 'hd')}
                      disabled={!!downloading}
                      className="flex w-full items-center justify-between rounded-xl bg-black px-5 py-3.5 text-white hover:bg-gray-800 disabled:opacity-60 dark:bg-white dark:text-black">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5" />
                        <div className="text-left"><p className="font-semibold text-sm">Video HD</p><p className="text-xs opacity-70">Tanpa watermark</p></div>
                      </div>
                      {downloading === 'hd' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    </button>
                  )}
                  {result.downloads.video_sd && (
                    <button onClick={() => handleDownload(result.downloads.video_sd!, `tiktok_${result.id}_sd.mp4`, 'sd')}
                      disabled={!!downloading}
                      className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-3.5 text-gray-800 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-700 dark:text-white">
                      <div className="flex items-center gap-3">
                        <Video className="h-5 w-5" />
                        <div className="text-left"><p className="font-semibold text-sm">Video SD</p><p className="text-xs opacity-60">Ukuran lebih kecil</p></div>
                      </div>
                      {downloading === 'sd' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                    </button>
                  )}
                </>
              )}

              {result.type === 'photo' && result.downloads.photos && result.downloads.photos.length > 0 && (
                <div>
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {result.downloads.photos.slice(0, 6).map((p, i) => (
                      <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                        <img src={p} alt={`foto ${i+1}`} className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                  {result.downloads.photos.map((p, i) => (
                    <button key={i} onClick={() => handleDownload(p, `tiktok_${result.id}_photo_${i+1}.jpg`, `photo_${i}`)}
                      disabled={!!downloading}
                      className="mb-2 flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-gray-800 hover:bg-gray-100 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-700 dark:text-white">
                      <div className="flex items-center gap-3"><ImageIcon className="h-4 w-4" /><span className="text-sm font-medium">Foto {i+1}</span></div>
                      {downloading === `photo_${i}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              )}

              {result.downloads.music && (
                <button onClick={() => handleDownload(result.downloads.music!, `tiktok_${result.id}_music.mp3`, 'music')}
                  disabled={!!downloading}
                  className="flex w-full items-center justify-between rounded-xl border border-pink-200 bg-pink-50 px-5 py-3.5 text-pink-800 hover:bg-pink-100 disabled:opacity-60 dark:border-pink-800 dark:bg-pink-900/20 dark:text-pink-300">
                  <div className="flex items-center gap-3">
                    {result.downloads.music_cover
                      ? <img src={result.downloads.music_cover} alt="music" className="h-9 w-9 rounded-lg object-cover" />
                      : <Music className="h-5 w-5" />}
                    <div className="text-left">
                      <p className="font-semibold text-sm">{result.downloads.music_title || 'Musik'}</p>
                      <p className="text-xs opacity-70">{result.downloads.music_author || 'Audio MP3'}</p>
                    </div>
                  </div>
                  {downloading === 'music' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                </button>
              )}

              <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <CheckCircle className="h-3.5 w-3.5" />
                <span>Semua file diunduh tanpa watermark</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
