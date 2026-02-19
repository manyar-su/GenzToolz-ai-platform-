import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { GlobalAlert, AlertType } from '../components/ui/GlobalAlert';

interface AlertOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, options?: AlertOptions) => void;
  showConfirm: (message: string, onConfirm: () => void, options?: Omit<AlertOptions, 'onConfirm'>) => void;
  closeAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<{
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
  }>({
    type: 'info',
    title: 'Info',
    message: '',
  });

  const closeAlert = useCallback(() => {
    setIsOpen(false);
  }, []);

  const showAlert = useCallback((message: string, type: AlertType = 'info', options?: AlertOptions) => {
    let defaultTitle = 'Info';
    if (type === 'error') defaultTitle = 'Gagal';
    if (type === 'success') defaultTitle = 'Berhasil';
    if (type === 'warning') defaultTitle = 'Peringatan';

    setConfig({
      type,
      message,
      title: options?.title || defaultTitle,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      onConfirm: undefined, // Alerts don't usually have a confirm action other than close
    });
    setIsOpen(true);
  }, []);

  const showConfirm = useCallback((message: string, onConfirm: () => void, options?: Omit<AlertOptions, 'onConfirm'>) => {
    setConfig({
      type: 'confirm',
      message,
      title: options?.title || 'Konfirmasi',
      onConfirm,
      confirmText: options?.confirmText || 'Ya, Lanjutkan',
      cancelText: options?.cancelText || 'Batal',
    });
    setIsOpen(true);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, showConfirm, closeAlert }}>
      {children}
      <GlobalAlert
        isOpen={isOpen}
        type={config.type}
        title={config.title}
        message={config.message}
        onClose={closeAlert}
        onConfirm={config.onConfirm}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
      />
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
}
