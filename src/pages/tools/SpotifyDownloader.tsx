import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Download, Search, Music,
  Clock, Info, CheckCircle, ExternalLink, Play
} from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { useAlert } from '../../context/AlertContext';

interface SpotifyTrack {
  id: string;
  name: string;
  artists: string;
  album: string;
  albumArt: string;
  duration: string;
  previewUrl: string | null;
  spotifyUrl: string;
  releaseDate: string;
}

const formatMs = (ms: number) => {
  const m = Math.floor(ms / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${m}:${String(s).padStart(2, '0')}`;
};

// Spotify Web API — client credentials (public, read-only)
const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = import.meta.env.VITE_SPOTIFY_CLIENT_SECRET || '';

const getSpotifyToken = async (): Promise<string | null> => {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) return null;
  try {
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`),
      },
      body: 'grant_type=client_credentials',
    });
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
};

const extractSpotifyId = (input: string): { type: 'track' | 'album' | 'playlist' | null; id: string | null } => {
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      const type = parts[parts.length - 2] as any;
      const id = parts[parts.length - 1].split('?')[0];
      if (['track', 'album', 'playlist'].includes(type)) return { type, id };
    }
  } catch {}
  // bare ID
  if (/^[a-zA-Z0-9]{22}$/.test(input.trim())) return { type: 'track', id: input.trim() };
  return { type: null, id: null };
};

export default function SpotifyDownloader() {
  const navigate = useNavigate();
  const { deductToken, fetchBalance } = useTokenStore();
  const { showAlert } = useAlert();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [tracks, setTracks] = useState<SpotifyTrack[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);
  const [noApiKey, setNoApiKey] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (!await deductToken(1)) {
      showAlert('Token tidak cukup! Silakan top-up.', 'error');
      return;
    }

    setLoading(true);
    setTracks([]);

    try {
      // Coba pakai Spotify API jika ada key
      const token = await getSpotifyToken();

      if (!token) {
        // Fallback: tidak ada API key, tampilkan info
        setNoApiKey(true);
        setLoading(false);
        fetchBalance();
        return;
      }

      setNoApiKey(false);

      // Cek apakah input adalah URL Spotify
      const { type, id } = extractSpotifyId(query.trim());

      let results: SpotifyTrack[] = [];

      if (type === 'track' && id) {
        // Fetch single track
        const res = await fetch(`https://api.spotify.com/v1/tracks/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.id) {
          results = [{
            id: data.id,
            name: data.name,
            artists: data.artists.map((a: any) => a.name).join(', '),
            album: data.album.name,
            albumArt: data.album.images[0]?.url || '',
            duration: formatMs(data.duration_ms),
            previewUrl: data.preview_url,
            spotifyUrl: data.external_urls.spotify,
            releaseDate: data.album.release_date,
          }];
        }
      } else {
        // Search by keyword
        const res = await fetch(
          `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=6`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        results = (data.tracks?.items || []).map((item: any) => ({
          id: item.id,
          name: item.name,
          artists: item.artists.map((a: any) => a.name).join(', '),
          album: item.album.name,
          albumArt: item.album.images[0]?.url || '',
          duration: formatMs(item.duration_ms),
          previewUrl: item.preview_url,
          spotifyUrl: item.external_urls.spotify,
          releaseDate: item.album.release_date,
        }));
      }

      setTracks(results);
      fetchBalance();
    } catch {
      showAlert('Gagal mencari lagu. Coba lagi.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = (track: SpotifyTrack) => {
    if (!track.previewUrl) {
      showAlert('Preview tidak tersedia untuk lagu ini', 'error');
      return;
    }
    if (playing === track.id) {
      audioEl?.pause();
      setPlaying(null);
      return;
    }
    audioEl?.pause();
    const audio = new Audio(track.previewUrl);
    audio.play();
    audio.onended = () => setPlaying(null);
    setAudioEl(audio);
    setPlaying(track.id);
  };

  const handleDownloadPreview = (track: SpotifyTrack) => {
    if (!track.previewUrl) {
      // Buka di Spotify
      window.open(track.spotifyUrl, '_blank');
      return;
    }
    const link = document.createElement('a');
    link.href = track.previewUrl;
    link.download = `${track.name} - ${track.artists} (preview).mp3`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showAlert('Download preview berhasil!', 'success');
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
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500 text-white shadow-lg">
            <svg viewBox="0 0 24 24" className="h-9 w-9 fill-white">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Spotify Downloader</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Cari lagu Spotify & download preview audio 30 detik</p>
        </div>

        {/* Info */}
        <div className="mb-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-semibold mb-1">Catatan Penting</p>
              <p>Spotify melindungi lagu dengan DRM. Tool ini menyediakan <strong>preview 30 detik</strong> resmi dari Spotify. Untuk lagu full, gunakan Spotify Premium atau layanan legal lainnya.</p>
              {!SPOTIFY_CLIENT_ID && (
                <p className="mt-2 text-amber-700 dark:text-amber-400">Tambahkan <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_SPOTIFY_CLIENT_ID</code> dan <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_SPOTIFY_CLIENT_SECRET</code> di <code>.env</code> untuk mengaktifkan pencarian.</p>
              )}
            </div>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Music className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Nama lagu, artis, atau link Spotify..."
                className="w-full rounded-xl border border-gray-300 py-3.5 pl-10 pr-4 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="flex items-center gap-2 rounded-xl bg-green-500 px-6 py-3.5 font-semibold text-white transition hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              <span className="hidden sm:inline">Cari</span>
            </button>
          </div>
        </form>

        {/* No API Key State */}
        {noApiKey && (
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-gray-800">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Music className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <h3 className="mb-2 font-bold text-gray-900 dark:text-white">API Key Belum Dikonfigurasi</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Tambahkan Spotify API credentials di file <code className="rounded bg-gray-100 px-1 dark:bg-gray-700">.env</code> untuk mengaktifkan fitur ini.
            </p>
            <div className="rounded-lg bg-gray-50 p-4 text-left text-xs font-mono text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              VITE_SPOTIFY_CLIENT_ID=your_client_id<br/>
              VITE_SPOTIFY_CLIENT_SECRET=your_client_secret
            </div>
            <a
              href="https://developer.spotify.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-600"
            >
              <ExternalLink className="h-4 w-4" /> Buat App di Spotify Developer
            </a>
          </div>
        )}

        {/* Results */}
        {tracks.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{tracks.length} lagu ditemukan</p>
            {tracks.map((track) => (
              <div
                key={track.id}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700"
              >
                {/* Album Art */}
                <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {track.albumArt ? (
                    <img src={track.albumArt} alt={track.album} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Music className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{track.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{track.artists}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{track.duration}</span>
                    <span className="truncate">{track.album}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 gap-2">
                  {/* Preview */}
                  <button
                    onClick={() => handlePreview(track)}
                    title={track.previewUrl ? 'Putar preview' : 'Preview tidak tersedia'}
                    className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                      track.previewUrl
                        ? playing === track.id
                          ? 'bg-green-500 text-white'
                          : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-300 cursor-not-allowed dark:bg-gray-700'
                    }`}
                  >
                    <Play className="h-4 w-4" />
                  </button>

                  {/* Download */}
                  <button
                    onClick={() => handleDownloadPreview(track)}
                    title={track.previewUrl ? 'Download preview 30s' : 'Buka di Spotify'}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition hover:bg-green-100 hover:text-green-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-green-900/30 dark:hover:text-green-400"
                  >
                    {track.previewUrl ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-center gap-1.5 pt-2 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>Preview 30 detik resmi dari Spotify API</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
