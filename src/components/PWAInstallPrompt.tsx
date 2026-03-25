import { useState, useEffect } from 'react';
import { Download, X, Share, Plus, MoreVertical, Chrome } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const detectBrowser = () => {
  const ua = navigator.userAgent;
  if (/SamsungBrowser/i.test(ua)) return 'samsung';
  if (/OPR|Opera/i.test(ua)) return 'opera';
  if (/Firefox/i.test(ua)) return 'firefox';
  if (/EdgA|EdgW/i.test(ua)) return 'edge';
  if (/Chrome/i.test(ua)) return 'chrome';
  if (/Safari/i.test(ua)) return 'safari';
  return 'other';
};

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
const isAndroid = () => /android/i.test(navigator.userAgent);
const isMobile = () => isIOS() || isAndroid();

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [browser, setBrowser] = useState('');
  const [mobile, setMobile] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    // Sudah terinstall (standalone)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    // Sudah pernah dismiss dalam 3 hari
    const dismissed = localStorage.getItem('pwa-dismissed');
    if (dismissed && Date.now() - parseInt(dismissed) < 3 * 24 * 60 * 60 * 1000) return;

    setBrowser(detectBrowser());
    setMobile(isMobile());
    setIos(isIOS());

    // Tangkap native install prompt (Android Chrome/Edge/Samsung)
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // iOS & browser lain yang tidak support beforeinstallprompt
    if (isIOS() || !('BeforeInstallPromptEvent' in window)) {
      // Tampilkan manual guide setelah 2 detik
      setTimeout(() => setShow(true), 2000);
    }

    window.addEventListener('appinstalled', () => {
      setShow(false);
      localStorage.removeItem('pwa-dismissed');
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setShow(false);
      } finally {
        setInstalling(false);
        setDeferredPrompt(null);
      }
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-dismissed', Date.now().toString());
  };

  if (!show) return null;

  // --- iOS Safari Guide ---
  if (ios) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:bottom-6 md:left-auto md:right-6 md:w-80">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <button onClick={handleDismiss} className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow">GZ</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Install GenzTools</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Akses cepat, bisa offline</p>
              </div>
            </div>
            <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 mb-2">Cara install di iPhone/iPad:</p>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 font-bold text-xs">1</span>
                <span>Tap ikon <Share className="inline h-3.5 w-3.5 text-blue-500" /> di bawah Safari</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 font-bold text-xs">2</span>
                <span>Scroll lalu pilih <strong>"Add to Home Screen"</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 font-bold text-xs">3</span>
                <span>Tap <strong>"Add"</strong> — selesai!</span>
              </div>
            </div>
            <button onClick={handleDismiss} className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
              Mengerti
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Android Chrome/Samsung/Edge dengan native prompt ---
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:bottom-6 md:left-auto md:right-6 md:w-80">
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
          <button onClick={handleDismiss} className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </button>
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow">GZ</div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white text-sm">Install GenzTools</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Gratis · Tanpa Play Store · Offline ready</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleDismiss} className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700">
                Nanti
              </button>
              <button onClick={handleInstall} disabled={installing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70">
                {installing ? <span className="animate-pulse">Installing...</span> : <><Download className="h-4 w-4" /> Install App</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Android Firefox / Opera / browser lain tanpa native prompt ---
  const guideByBrowser: Record<string, { icon: React.ReactNode; steps: string[] }> = {
    chrome: {
      icon: <Chrome className="h-4 w-4 text-blue-500" />,
      steps: ['Tap ikon ⋮ (titik tiga) di kanan atas', 'Pilih "Add to Home screen"', 'Tap "Add"'],
    },
    samsung: {
      icon: <MoreVertical className="h-4 w-4 text-blue-500" />,
      steps: ['Tap ikon ⋮ di kanan atas', 'Pilih "Add page to" → "Home screen"', 'Tap "Add"'],
    },
    firefox: {
      icon: <MoreVertical className="h-4 w-4 text-blue-500" />,
      steps: ['Tap ikon ⋮ di kanan atas', 'Pilih "Install"', 'Tap "Add"'],
    },
    opera: {
      icon: <MoreVertical className="h-4 w-4 text-blue-500" />,
      steps: ['Tap ikon ⋮ di kanan atas', 'Pilih "Home screen"', 'Tap "Add"'],
    },
    edge: {
      icon: <MoreVertical className="h-4 w-4 text-blue-500" />,
      steps: ['Tap ikon ⋯ di bawah', 'Pilih "Add to phone"', 'Tap "Install"'],
    },
    other: {
      icon: <Plus className="h-4 w-4 text-blue-500" />,
      steps: ['Buka menu browser (⋮ atau ⋯)', 'Cari "Add to Home Screen"', 'Tap "Add" atau "Install"'],
    },
  };

  const guide = guideByBrowser[browser] || guideByBrowser.other;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 md:bottom-6 md:left-auto md:right-6 md:w-80">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
        <button onClick={handleDismiss} className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="h-4 w-4" />
        </button>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg shadow">GZ</div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-sm">Install GenzTools</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Akses cepat, bisa offline</p>
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-3 space-y-2">
            {guide.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 font-bold">{i + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
          <button onClick={handleDismiss} className="mt-3 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
