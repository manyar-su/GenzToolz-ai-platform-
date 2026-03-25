import { useNavigate } from 'react-router-dom';
import { Download, Music, Video, ArrowRight, Headphones } from 'lucide-react';

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const SpotifyIcon = () => (
  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-white">
    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
  </svg>
);

const downloaderTools = [
  {
    path: '/tools/tiktok-downloader',
    Icon: TikTokIcon,
    bg: 'bg-black',
    label: 'TikTok Downloader',
    desc: 'Download video, foto slideshow & musik TikTok tanpa watermark',
    badge: 'Video & Foto',
    badgeColor: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
    cost: '1 Token',
  },
  {
    path: '/tools/youtube-music-downloader',
    Icon: YouTubeIcon,
    bg: 'bg-red-600',
    label: 'YouTube Downloader',
    desc: 'Download video YouTube & ekstrak audio MP3 berkualitas tinggi',
    badge: 'Video & MP3',
    badgeColor: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    cost: '1 Token',
  },
  {
    path: '/tools/spotify-downloader',
    Icon: SpotifyIcon,
    bg: 'bg-green-500',
    label: 'Spotify Downloader',
    desc: 'Cari info lagu Spotify & download preview audio resmi',
    badge: 'Musik',
    badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    cost: '1 Token',
  },
  {
    path: '/tools/downloader',
    Icon: () => <Video className="h-7 w-7 text-white" />,
    bg: 'bg-gradient-to-br from-blue-500 to-purple-600',
    label: 'All-in-One Downloader',
    desc: 'Download dari YouTube, TikTok, Instagram dalam satu tempat',
    badge: 'Multi Platform',
    badgeColor: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    cost: '1 Token',
  },
];

export default function Downloader() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Download className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Downloader Hub</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Pilih platform yang ingin kamu download. Semua tanpa watermark, cepat dan mudah.
          </p>
        </div>

        {/* Grid Tools */}
        <div className="grid gap-4 sm:grid-cols-2">
          {downloaderTools.map((tool) => (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className="group flex items-start gap-4 rounded-2xl bg-white p-5 text-left shadow-sm ring-1 ring-gray-100 transition hover:shadow-md hover:ring-blue-200 dark:bg-gray-800 dark:ring-gray-700 dark:hover:ring-blue-700"
            >
              <div className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl ${tool.bg} shadow-md`}>
                <tool.Icon />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{tool.label}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tool.badgeColor}`}>
                    {tool.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{tool.desc}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{tool.cost}</span>
                  <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-blue-500" />
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 rounded-xl bg-blue-50 p-4 text-sm text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
          <div className="flex items-start gap-2">
            <Music className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p>
              Semua downloader menggunakan API publik yang tersedia. Harap gunakan hanya untuk konten yang kamu miliki atau yang bebas hak cipta.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
