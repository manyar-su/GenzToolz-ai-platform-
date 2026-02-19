import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';
import { useEffect } from 'react';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface GlobalAlertProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export function GlobalAlert({
  isOpen,
  type,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Ya, Lanjutkan',
  cancelText = 'Batal'
}: GlobalAlertProps) {
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'error': return <X className="h-12 w-12 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
      case 'confirm': return <HelpCircle className="h-12 w-12 text-blue-500" />;
      default: return <Info className="h-12 w-12 text-blue-500" />;
    }
  };

  const getColorClass = () => {
    switch (type) {
      case 'success': return 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-300';
      case 'error': return 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300';
      case 'warning': return 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300';
      case 'confirm': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
      default: return 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-center shadow-2xl transition-all dark:bg-gray-800 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        <div className={`flex flex-col items-center justify-center p-6 ${getColorClass()}`}>
          <div className="rounded-full bg-white/50 p-3 backdrop-blur-sm dark:bg-black/20">
            {getIcon()}
          </div>
          <h3 className="mt-4 text-xl font-bold leading-6">{title}</h3>
        </div>
        
        <div className="p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {message}
          </p>
          
          <div className="mt-6 flex gap-3">
            {type === 'confirm' ? (
              <>
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  onClick={onClose}
                >
                  {cancelText}
                </button>
                <button
                  type="button"
                  className="inline-flex w-full justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:ring-offset-gray-800"
                  onClick={() => {
                    if (onConfirm) onConfirm();
                    onClose();
                  }}
                >
                  {confirmText}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="inline-flex w-full justify-center rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
                onClick={onClose}
              >
                Mengerti
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
