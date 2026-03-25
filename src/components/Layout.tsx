import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Menu, X, Moon, Sun, Coins,
  User, History, Wrench, ChevronUp, ShieldCheck, Wallet, Download
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useTokenStore } from '../store/useTokenStore';
import { useUserStore } from '../store/useUserStore';
import NotificationBell from './ui/NotificationBell';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showBackTop, setShowBackTop] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { tokens, fetchBalance, subscribeToBalance } = useTokenStore();
  const { name, avatar, id } = useUserStore();
  const location = useLocation();
  const isAdmin = useUserStore(state => state.name === 'Admin');

  useEffect(() => {
    if (id) {
      fetchBalance();
      const unsubscribe = subscribeToBalance();
      return () => unsubscribe();
    }
  }, [id, fetchBalance, subscribeToBalance]);

  useEffect(() => {
    const el = document.getElementById('main-content');
    if (!el) return;
    const onScroll = () => setShowBackTop(el.scrollTop > 300);
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Wrench, label: 'Tools', path: '/tools' },
    { icon: Download, label: 'Downloader', path: '/downloader' },
    { icon: History, label: 'Riwayat', path: '/history' },
    { icon: Users, label: 'Affiliate', path: '/affiliate' },
    { icon: Wallet, label: 'Top Up', path: '/topup' },
    { icon: User, label: 'Profile', path: '/profile' },
    ...(isAdmin ? [{ icon: ShieldCheck, label: 'Admin Panel', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => {
    if (path === '/tools') return location.pathname === '/tools';
    if (path === '/downloader') return location.pathname === '/downloader' || location.pathname.startsWith('/tools/tiktok-downloader') || location.pathname.startsWith('/tools/youtube-music') || location.pathname.startsWith('/tools/spotify') || location.pathname.startsWith('/tools/downloader');
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 transition-all duration-300 ${isCollapsed ? 'w-[72px]' : 'w-64'}`}>
        <div className={`flex h-16 items-center border-b border-gray-200 dark:border-gray-800 px-4 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
            <span className="rounded-lg bg-blue-600 px-1.5 py-0.5 text-white text-sm">GZ</span>
            {!isCollapsed && <span>GenzTools</span>}
          </Link>
          {!isCollapsed && (
            <button onClick={() => setIsCollapsed(true)} className="rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className="border-b border-gray-200 dark:border-gray-800 p-4">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-lg">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium opacity-90">Sisa Token</span>
                <Coins className="h-4 w-4 opacity-75" />
              </div>
              <div className="text-2xl font-bold">{tokens} 🪙</div>
              <Link to="/topup" className="mt-3 block w-full rounded-lg bg-white/20 py-1.5 text-center text-xs font-semibold backdrop-blur-sm transition hover:bg-white/30">
                Top Up Sekarang
              </Link>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-0.5 p-3">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              title={isCollapsed ? item.label : ''}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {isCollapsed && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800">
            <button onClick={() => setIsCollapsed(false)} className="flex w-full items-center justify-center rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800">
              <Menu className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 shadow-xl transition-transform duration-300 md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800 px-5">
          <span className="font-bold text-xl text-blue-600 dark:text-blue-400">GenzTools</span>
          <button onClick={() => setIsSidebarOpen(false)}>
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <nav className="p-3 space-y-0.5">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:px-6">
          <button className="md:hidden" onClick={() => setIsSidebarOpen(true)}>
            <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-2">
            {/* Token (mobile) */}
            <div className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 md:hidden">
              <Coins className="h-4 w-4" />
              <span>{tokens}</span>
            </div>

            {/* Theme toggle */}
            <button onClick={toggleTheme} className="rounded-full p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors">
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Admin button */}
            <Link
              to="/admin"
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                isAdmin
                  ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span className="hidden sm:inline">{isAdmin ? 'Admin Panel' : 'Admin'}</span>
            </Link>

            {/* Profile */}
            <Link to="/profile" className="flex items-center gap-2 border-l border-gray-200 pl-3 dark:border-gray-700 hover:opacity-80 transition-opacity">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Member</p>
              </div>
              <img src={avatar} alt="Profile" className="h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-gray-800" />
            </Link>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* Back to Top */}
      {showBackTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 transition hover:bg-blue-700 hover:scale-110"
          aria-label="Kembali ke atas"
        >
          <ChevronUp className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
