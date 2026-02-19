import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Calendar, FileText, Film, Music, ImageIcon, CheckSquare, Square } from 'lucide-react';
import { useHistoryStore, HistoryItem } from '../store/useHistoryStore';
import { useAlert } from '../context/AlertContext';

export default function History() {
  const navigate = useNavigate();
  const { history, removeFromHistory, removeSelected, clearHistory } = useHistoryStore();
  const { showConfirm, showAlert } = useAlert();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === history.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map(item => item.id));
    }
  };

  const handleDeleteSelected = () => {
    showConfirm(`Yakin ingin menghapus ${selectedIds.length} item?`, () => {
        removeSelected(selectedIds);
        setSelectedIds([]);
        showAlert('Item berhasil dihapus', 'success');
    }, { title: "Hapus Banyak Item", confirmText: "Hapus", cancelText: "Batal" });
  };

  const handleDeleteSingle = (id: string) => {
    showConfirm('Yakin ingin menghapus item ini?', () => {
        removeFromHistory(id);
        showAlert('Item berhasil dihapus', 'success');
    }, { title: "Hapus Item", confirmText: "Hapus", cancelText: "Batal" });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'video': return <Film className="h-5 w-5 text-purple-600" />;
      case 'audio': return <Music className="h-5 w-5 text-green-600" />;
      case 'image': return <ImageIcon className="h-5 w-5 text-blue-600" />;
      default: return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
          </button>
          
          <div className="flex items-center gap-4">
            {selectedIds.length > 0 && (
              <button 
                onClick={handleDeleteSelected}
                className="flex items-center rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus ({selectedIds.length})
              </button>
            )}
            {history.length > 0 && (
                <button
                    onClick={() => {
                        showConfirm('Hapus SEMUA riwayat? Tindakan ini tidak bisa dibatalkan.', () => {
                            clearHistory();
                            showAlert('Semua riwayat berhasil dihapus', 'success');
                        }, { title: "Hapus Semua Riwayat", confirmText: "Hapus Semua" });
                    }}
                    className="text-sm text-gray-500 hover:text-red-500"
                >
                    Bersihkan Semua
                </button>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center justify-between rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Riwayat Generate</h1>
            <p className="text-gray-500 dark:text-gray-400">Lihat semua konten yang pernah Anda buat.</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">{history.length}</div>
            <div className="text-xs text-gray-400">Total Item</div>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-center dark:border-gray-700">
            <FileText className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Belum ada riwayat</h3>
            <p className="text-gray-500 dark:text-gray-400">Mulai gunakan tools untuk melihat riwayat di sini.</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-4 rounded-lg bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
            >
              Mulai Sekarang
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Header Checkbox */}
            <div className="flex items-center px-4 py-2 text-sm text-gray-500">
              <button onClick={handleSelectAll} className="mr-4 hover:text-purple-600">
                {selectedIds.length === history.length && history.length > 0 ? (
                  <CheckSquare className="h-5 w-5 text-purple-600" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>
              <span>Pilih Semua</span>
            </div>

            {history.map((item) => (
              <div 
                key={item.id}
                className={`group relative flex items-start gap-4 rounded-xl border p-4 transition-all hover:shadow-md ${
                  selectedIds.includes(item.id) 
                    ? 'border-purple-500 bg-purple-50 dark:border-purple-400 dark:bg-purple-900/20' 
                    : 'border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800'
                }`}
              >
                <button 
                  onClick={() => handleToggleSelect(item.id)}
                  className="mt-1 text-gray-400 hover:text-purple-600"
                >
                  {selectedIds.includes(item.id) ? (
                    <CheckSquare className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </button>

                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                  {getIcon(item.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="truncate font-bold text-gray-900 dark:text-white">{item.toolName}</h3>
                    <span className="flex items-center text-xs text-gray-400">
                      <Calendar className="mr-1 h-3 w-3" />
                      {new Date(item.timestamp).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>
                  
                  <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-medium text-gray-700 dark:text-gray-300">Input:</span> {item.input}
                  </div>
                  
                  <div className="mt-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-800 dark:bg-gray-900/50 dark:text-gray-200">
                    <div className="max-h-24 overflow-y-auto whitespace-pre-wrap">
                      {item.output}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => handleDeleteSingle(item.id)}
                  className="absolute right-4 top-4 hidden text-gray-400 hover:text-red-500 group-hover:block"
                  title="Hapus item"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
