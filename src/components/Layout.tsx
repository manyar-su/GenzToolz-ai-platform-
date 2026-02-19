import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  Users, 
  Menu, 
  X, 
  Moon, 
  Sun, 
  Coins,
  LogOut,
  User,
  History
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useTokenStore } from '../store/useTokenStore';

import { useUserStore } from '../store/useUserStore';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false); // Desktop
  const { theme, toggleTheme } = useTheme();
  const { tokens } = useTokenStore();
  const { name, avatar } = useUserStore();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: History, label: 'Riwayat', path: '/history' },
    { icon: Users, label: 'Affiliate Program', path: '/affiliate' },
    { icon: Wallet, label: 'Top-up Token', path: '/topup' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden flex-col border-r border-gray-200 bg-white transition-all duration-300 dark:border-gray-800 dark:bg-gray-900 md:flex ${
          isDesktopSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className={`flex h-16 items-center border-b border-gray-200 px-6 dark:border-gray-800 ${isDesktopSidebarCollapsed ? 'justify-center px-0' : 'justify-between'}`}>
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 dark:text-blue-400">
            <span className="rounded-lg bg-blue-600 p-1 text-white">GZ</span>
            {!isDesktopSidebarCollapsed && <span>GenzTools</span>}
          </Link>
          
           {/* Collapse Toggle Button (Moved to Top) */}
           <button
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="hidden md:flex items-center justify-center rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            title={isDesktopSidebarCollapsed ? "Expand" : "Collapse"}
        >
            {isDesktopSidebarCollapsed ? (
                <Menu className="h-5 w-5 text-gray-500" />
            ) : (
                 <Menu className="h-5 w-5 text-gray-500" />
            )}
        </button>
        </div>

        {!isDesktopSidebarCollapsed && (
          <div className="border-b border-gray-200 p-4 dark:border-gray-800">
            <div className="rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-lg">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium opacity-90">Sisa Token</span>
                <Coins className="h-5 w-5 opacity-75" />
              </div>
              <div className="text-2xl font-bold">{tokens} 🪙</div>
              <Link 
                to="/topup"
                className="mt-3 block w-full rounded-lg bg-white/20 py-2 text-center text-xs font-semibold backdrop-blur-sm transition hover:bg-white/30"
              >
                Top Up Sekarang
              </Link>
            </div>
          </div>
        )}

        <nav className="flex-1 space-y-1 p-4">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isDesktopSidebarCollapsed ? item.label : ''}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                } ${isDesktopSidebarCollapsed ? 'justify-center px-2' : ''}`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!isDesktopSidebarCollapsed && item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* Collapse Toggle Button - Removed from Bottom */}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-xl transition-transform duration-300 dark:bg-gray-900 md:hidden ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-6 dark:border-gray-800">
          <span className="font-bold text-xl text-blue-600 dark:text-blue-400">GenzTools</span>
          <button onClick={() => setIsSidebarOpen(false)}>
            <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 md:px-8">
          <button 
            className="md:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
          </button>

          <div className="flex flex-1 items-center justify-end gap-4">
            {/* Token Widget (Mobile Only - Simplified) */}
            <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 md:hidden">
              <Coins className="h-4 w-4" />
              <span>{tokens}</span>
            </div>

            {/* User Profile */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 dark:border-gray-700">
              <div className="hidden text-right md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Member</p>
              </div>
              <img 
                src={avatar} 
                alt="Profile" 
                className="h-8 w-8 rounded-full bg-white object-cover ring-2 ring-white dark:ring-gray-800"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
