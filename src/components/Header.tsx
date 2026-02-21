
import { Menu, Moon, Sun, Coins } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useTokenStore } from '../store/useTokenStore';
import { useUserStore } from '../store/useUserStore';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { isDark, toggleTheme } = useTheme();
  const { tokens } = useTokenStore();
  const { isLoggedIn } = useUserStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white/80 px-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={onMenuClick}
          className="mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 lg:hidden">
          GenzTools
        </h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Token Visualizer */}
        {isLoggedIn && (
          <div className="hidden items-center rounded-full bg-yellow-50 px-4 py-1.5 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:ring-yellow-700/50 sm:flex">
            <Coins className="mr-2 h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <span className="text-sm font-bold text-yellow-700 dark:text-yellow-500">
              Sisa Token: {tokens} 🪙
            </span>
          </div>
        )}

        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
          aria-label="Toggle Dark Mode"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Mobile Token (Icon Only) */}
        {isLoggedIn && (
          <div className="flex sm:hidden items-center rounded-full bg-yellow-50 p-2 ring-1 ring-yellow-200 dark:bg-yellow-900/20 dark:ring-yellow-700/50">
            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">{tokens} 🪙</span>
          </div>
        )}
        
        {/* User Profile Placeholder */}
        <div className="h-8 w-8 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <img 
            src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" 
            alt="User" 
            className="h-full w-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
