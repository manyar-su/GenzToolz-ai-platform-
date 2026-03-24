import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Scissors, Upload, Download, Info } from 'lucide-react';
import { useTokenStore } from '../../store/useTokenStore';
import { useAlert } from '../../context/AlertContext';

export default function WatermarkRemover() {
  const navigate = useNavigate();
  const { deductToken } = useTokenStore();
  const { showConfirm } = useAlert();
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!image) return;
    
    // Optimistic check
    if (!deductToken(1)) {
        showConfirm(
            'Token Anda tidak mencukupi untuk menggunakan tools ini. Silakan Top-up terlebih dahulu.',
            () => navigate('/topup'),
            {
                title: 'Saldo Tidak Cukup',
                confirmText: 'Top Up Sekarang',
                cancelText: 'Batal'
            }
        );
        return;
    }

    setLoading(true);
    
    // Simulate processing delay
    setTimeout(() => {
      setLoading(false);
      // Simulate processed image
      setResult(image); 
      alert("Watermark berhasil dihapus! (Simulasi)");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="mx-auto max-w-4xl">
        <button 
          onClick={() => navigate('/')}
          className="mb-6 flex items-center rounded-lg bg-green-500 px-4 py-2 text-white shadow-md transition hover:bg-green-600"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
        </button>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">Watermark Remover</h1>
            
            <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm text-gray-800 dark:bg-gray-900/30 dark:text-gray-200">
              <div className="flex items-start">
                <Info className="mr-2 h-5 w-5 flex-shrink-0" />
                <p>
                  <strong>Cara Penggunaan:</strong> Upload foto yang memiliki watermark. AI akan menghapus tanda air tanpa merusak kualitas foto.
                  <br/>
                  <span className="mt-2 block font-semibold text-gray-900 dark:text-gray-100">Biaya: 1 Token per edit.</span>
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-8 hover:border-gray-500 dark:border-gray-600">
                <Upload className="mb-4 h-10 w-10 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">Klik untuk upload foto</p>
                <label className="cursor-pointer rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">
                   Pilih File
                   <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                </label>
              </div>

              {image && (
                <div className="relative overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
                  <img src={image} alt="Preview" className="h-48 w-full object-cover" />
                </div>
              )}

              <button
                onClick={handleProcess}
                disabled={!image || loading}
                className="flex w-full items-center justify-center rounded-lg bg-gray-600 px-4 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghapus Watermark...
                  </>
                ) : (
                  <>
                    <Scissors className="mr-2 h-4 w-4" /> Hapus Watermark
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-100 dark:bg-gray-800 dark:ring-gray-700">
            <h2 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Hasil Edit</h2>
            
            <div className="flex h-[400px] items-center justify-center overflow-hidden rounded-lg bg-gray-50 dark:bg-gray-900">
              {result ? (
                <div className="relative h-full w-full">
                  <img 
                    src={result} 
                    alt="Result" 
                    className="h-full w-full object-contain"
                  />
                  <a 
                    href={result} 
                    download="clean-image.png"
                    className="absolute bottom-4 right-4 flex items-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-lg transition hover:bg-gray-100"
                  >
                    <Download className="mr-2 h-4 w-4" /> Download
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-400">
                  <Scissors className="mb-2 h-12 w-12 opacity-20" />
                  <p>Hasil foto akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
