import { useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { Lock, User } from 'lucide-react';

interface AuthGuardModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
}

export function AuthGuardModal({ isOpen, onClose, featureName }: AuthGuardModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white text-center shadow-2xl dark:bg-gray-800 animate-in fade-in zoom-in duration-200">
        <div className="bg-red-50 p-6 dark:bg-red-900/20">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
            <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Opps! Akses Dibatasi</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Fitur <strong>"{featureName}"</strong> khusus untuk member GenzTools.
          </p>
        </div>
        
        <div className="p-6">
          <p className="mb-6 text-gray-500 dark:text-gray-400">
            Silakan daftar atau login member untuk mulai menggunakan tools ini dan dapatkan 10 Token Gratis!
          </p>
          
          <div className="space-y-3">
            <button
              onClick={() => navigate('/profile')}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-bold text-white transition hover:bg-blue-700"
            >
              <User className="h-5 w-5" />
              Daftar / Login Member
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-gray-100 px-4 py-3 font-semibold text-gray-600 transition hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Nanti Saja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Higher Order Component to wrap Tools
interface WithAuthGuardProps {
    children: ReactNode;
}

export const useAuthGuard = () => {
    const { isLoggedIn } = useUserStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const checkAuth = () => {
        if (!isLoggedIn) {
            setIsModalOpen(true);
            return false;
        }
        return true;
    };

    return { checkAuth, isModalOpen, setIsModalOpen };
};
