import { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Cek apakah sudah diinstall (standalone mode)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Cek apakah sudah pernah dismiss
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissed) {
      const dismissedAt = parseInt(dismissed);
      // Tampilkan lagi setelah 7 hari
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Deteksi iOS
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // iOS tidak support beforeinstallprompt, tampilkan manual guide
      setTimeout(() => setShow(true), 3000);
      return;
    }

    // Android/Desktop: tangkap event beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Cek jika sudah terinstall
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShow(false);
        setIsInstalled(true);
      }
    } finally {
      setInstalling(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!show || isInstalled) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:w-80">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200 dark:bg-gray-800 dark:ring-gray-700">
        {/* Gradient top bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        <div className="p-4">
          {/* Close */}
          <button
            onClick={handleDismiss}
            className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex items-start gap-3">
            {/* App Icon */}
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
              <span className="text-lg font-black">GZ</span>
            </div>

            <div className="flex-1 min-w-0 pr-4">
              <p className="font-bold text-gray-900 dark:text-white text-sm">Install GenzTools</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Akses lebih cepat, bisa dipakai offline
              </p>
            </div>
          </div>

          {isIOS ? (
            // iOS Guide
            <div className="mt-4 rounded-xl bg-gray-50 p-3 dark:bg-gray-700/50">
              <p className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">Cara install di iPhone/iPad:</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-xs font-bold text-blue-600">1</span>
                  </div>
                  <span>Tap tombol <Share className="inline h-3.5 w-3.5 text-blue-500" /> di Safari</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-xs font-bold text-blue-600">2</span>
                  </div>
                  <span>Pilih <strong>"Add to Home Screen"</strong> <Plus className="inline h-3.5 w-3.5" /></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                    <span className="text-xs font-bold text-blue-600">3</span>
                  </div>
                  <span>Tap <strong>"Add"</strong> — selesai!</span>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="mt-3 w-full rounded-xl bg-blue-600 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Mengerti
              </button>
            </div>
          ) : (
            // Android/Desktop
            <div className="mt-4 flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                Nanti
              </button>
              <button
                onClick={handleInstall}
                disabled={installing}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-70"
              >
                {installing ? (
                  <span className="animate-pulse">Menginstall...</span>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Install App
                  </>
                )}
              </button>
            </div>
          )}

          <div className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-400">
            <Smartphone className="h-3 w-3" />
            <span>Gratis · Tanpa Play Store · Offline ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
