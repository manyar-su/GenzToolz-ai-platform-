import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/useUserStore';
import { useTokenStore } from '../store/useTokenStore';
import { useNotificationStore } from '../store/useNotificationStore';
import {
  Coins, Copy, Check, Crown, Zap, Star, Download, AlertCircle,
  ChevronDown, ChevronUp, ArrowLeft, Smartphone, Info, CheckCircle2
} from 'lucide-react';

// ── Paket token ───────────────────────────────────────────────
const PACKAGES = [
  { name: 'Starter',  total: 13,   base: 10,  bonus: 3,   price: 10000, icon: Zap,   color: 'from-blue-500 to-cyan-500',     textColor: 'text-blue-600' },
  { name: 'Creator',  total: 65,   base: 50,  bonus: 15,  price: 50000, icon: Star,  color: 'from-purple-500 to-indigo-500', textColor: 'text-purple-600', popular: true },
  { name: 'Agency',   total: 130,  base: 100, bonus: 30,  price: 100000, icon: Crown, color: 'from-yellow-500 to-orange-500', textColor: 'text-yellow-600' },
];

const DANA_NUMBER  = '082242812329';
const DANA_NAME    = 'Maris Ibrahim';
const ADMIN_WA     = '6282242812329';

// Generate 3-digit unique suffix (001–999) based on timestamp
function generateUniqueSuffix(): number {
  return (Date.now() % 900) + 100; // 100–999
}

export default function Topup() {
  const navigate = useNavigate();
  const { id, name: userName } = useUserStore();
  const { tokens } = useTokenStore();
  const { add: addNotif } = useNotificationStore();

  const [selectedPkg, setSelectedPkg] = useState<typeof PACKAGES[0] | null>(null);
  const [uniqueSuffix] = useState(generateUniqueSuffix);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [copiedDana, setCopiedDana] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [showGuide, setShowGuide] = useState(true);
  const receiptRef = useRef<HTMLDivElement>(null);

  const totalAmount = selectedPkg ? selectedPkg.price + uniqueSuffix : 0;
  const formattedAmount = totalAmount.toLocaleString('id-ID');

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  // Download receipt as PNG via canvas
  const handleDownload = () => {
    if (!selectedPkg) return;
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 520;
    const ctx = canvas.getContext('2d')!;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 520);

    // Header gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 0);
    grad.addColorStop(0, '#2563eb');
    grad.addColorStop(1, '#7c3aed');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 100);

    // Header text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('GenzTools — Bukti Top Up', 300, 45);
    ctx.font = '16px Arial';
    ctx.fillText('Simpan gambar ini sebagai bukti pembayaran', 300, 75);

    // Card body
    ctx.fillStyle = '#f8fafc';
    ctx.roundRect(30, 120, 540, 360, 16);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'left';

    const rows = [
      ['Paket',          selectedPkg.name],
      ['Token',          `${selectedPkg.total} token (${selectedPkg.base} + ${selectedPkg.bonus} bonus)`],
      ['Tujuan Transfer','Dana ' + DANA_NUMBER],
      ['Atas Nama',      DANA_NAME],
      ['',               ''],
      ['NOMINAL UNIK',   `Rp ${formattedAmount}`],
      ['',               ''],
      ['ID User',        id],
      ['Nama',           userName],
    ];

    let y = 165;
    rows.forEach(([label, value]) => {
      if (!label && !value) { y += 10; return; }
      ctx.fillStyle = '#64748b';
      ctx.font = '14px Arial';
      ctx.fillText(label, 60, y);
      ctx.fillStyle = label === 'NOMINAL UNIK' ? '#2563eb' : '#1e293b';
      ctx.font = label === 'NOMINAL UNIK' ? 'bold 22px Arial' : '15px Arial';
      ctx.fillText(value, 220, y);
      y += label === 'NOMINAL UNIK' ? 38 : 30;
    });

    // Footer note
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⚠ Transfer TEPAT nominal di atas agar mudah diverifikasi', 300, 460);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Arial';
    ctx.fillText('Setelah transfer, kirim bukti ke WhatsApp Admin', 300, 485);

    const link = document.createElement('a');
    link.download = `topup-genztools-${selectedPkg.name.toLowerCase()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    addNotif({ title: 'Bukti Top Up Diunduh', message: `Kirim bukti transfer ke Admin WA untuk konfirmasi.`, type: 'info' });
  };

  const handleWhatsApp = () => {
    if (!selectedPkg) return;
    const msg = `Halo Admin GenzTools 👋\n\nSaya sudah transfer Top Up:\n\n📦 Paket: ${selectedPkg.name} (${selectedPkg.total} token)\n💰 Nominal: Rp ${formattedAmount}\n🏦 Via: Dana ${DANA_NUMBER}\n👤 ID User: ${id}\n\nMohon dikonfirmasi. Terima kasih!`;
    window.open(`https://wa.me/${ADMIN_WA}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Back + Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Top Up Token</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Transfer Dana manual dengan nominal unik</p>
        </div>
      </div>

      {/* Saldo card */}
      <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-white/20 p-2.5">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs opacity-80">Saldo Token Kamu</p>
            <p className="text-2xl font-bold">{tokens} Token</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs opacity-80">ID User</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="font-mono text-sm font-semibold">{id?.slice(0, 12)}...</span>
            <button onClick={() => copy(id, setCopiedId)} className="rounded-md bg-white/20 p-1 hover:bg-white/30 transition">
              {copiedId ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Guide / Warning */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50 dark:border-amber-800/50 dark:bg-amber-900/10">
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="flex w-full items-center justify-between px-5 py-4"
        >
          <div className="flex items-center gap-2 font-semibold text-amber-800 dark:text-amber-300">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            Cara Top Up — Baca Sebelum Transfer
          </div>
          {showGuide ? <ChevronUp className="h-4 w-4 text-amber-600" /> : <ChevronDown className="h-4 w-4 text-amber-600" />}
        </button>

        {showGuide && (
          <div className="border-t border-amber-200 dark:border-amber-800/50 px-5 pb-5 pt-4">
            <ol className="space-y-2.5 text-sm text-amber-800 dark:text-amber-200">
              {[
                'Pilih paket token yang kamu inginkan di bawah.',
                'Sistem akan membuat NOMINAL UNIK (harga + 3 digit khusus) agar mudah diverifikasi.',
                'Transfer ke Dana 082242812329 a.n. Maris Ibrahim dengan nominal TEPAT.',
                'Download bukti top up (gambar) lalu kirim ke WhatsApp Admin.',
                'Admin akan memverifikasi dan menambahkan token ke akunmu dalam 1×24 jam.',
                'Jangan transfer nominal berbeda — sistem verifikasi berdasarkan nominal unik.',
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 dark:bg-amber-800 text-xs font-bold text-amber-800 dark:text-amber-200">
                    {i + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>

      {/* Package selection */}
      <div>
        <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">Pilih Paket</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PACKAGES.map(pkg => {
            const Icon = pkg.icon;
            const isSelected = selectedPkg?.name === pkg.name;
            return (
              <button
                key={pkg.name}
                onClick={() => setSelectedPkg(pkg)}
                className={`relative rounded-2xl border-2 p-5 text-left transition-all hover:-translate-y-0.5 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-blue-300'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-3 py-0.5 text-[10px] font-bold text-white shadow">
                    POPULER
                  </span>
                )}
                {isSelected && (
                  <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-blue-500" />
                )}
                <div className={`mb-3 inline-flex rounded-xl bg-gradient-to-br ${pkg.color} p-2.5`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-gray-900 dark:text-white">{pkg.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{pkg.base} + {pkg.bonus} bonus token</p>
                <p className={`mt-2 text-xl font-black ${pkg.textColor}`}>{pkg.total} Token</p>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rp {pkg.price.toLocaleString('id-ID')}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment detail — shown after package selected */}
      {selectedPkg && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800/50 bg-white dark:bg-gray-900 shadow-lg overflow-hidden">
          {/* Header */}
          <div className={`bg-gradient-to-r ${selectedPkg.color} px-6 py-4`}>
            <p className="text-sm font-medium text-white/80">Paket {selectedPkg.name} — {selectedPkg.total} Token</p>
            <p className="text-2xl font-black text-white">Rp {formattedAmount}</p>
            <p className="text-xs text-white/70 mt-0.5">Harga Rp {selectedPkg.price.toLocaleString('id-ID')} + kode unik {uniqueSuffix}</p>
          </div>

          <div className="p-6 space-y-4">
            {/* Dana info */}
            <div className="rounded-xl bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <Smartphone className="h-4 w-4 text-blue-500" />
                Transfer ke Dana
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Nomor Dana</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white tracking-wider">{DANA_NUMBER}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">a.n. {DANA_NAME}</p>
                </div>
                <button
                  onClick={() => copy(DANA_NUMBER, setCopiedDana)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 px-3 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-200 transition"
                >
                  {copiedDana ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedDana ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
            </div>

            {/* Nominal unik */}
            <div className="rounded-xl border-2 border-dashed border-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Transfer TEPAT nominal ini</p>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-black text-blue-700 dark:text-blue-300">Rp {formattedAmount}</p>
                  <p className="text-xs text-blue-500 mt-0.5">3 digit unik: <span className="font-bold">{uniqueSuffix}</span> untuk identifikasi</p>
                </div>
                <button
                  onClick={() => copy(totalAmount.toString(), setCopiedAmount)}
                  className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 transition shadow-md shadow-blue-500/30"
                >
                  {copiedAmount ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedAmount ? 'Tersalin!' : 'Salin'}
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 hover:border-blue-400 hover:text-blue-600 transition"
              >
                <Download className="h-4 w-4" />
                Download Bukti
              </button>
              <button
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 rounded-xl bg-green-500 py-3 text-sm font-bold text-white hover:bg-green-600 transition shadow-md shadow-green-500/30"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Konfirmasi WA
              </button>
            </div>

            {/* Reminder */}
            <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-900/10 p-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>Transfer <strong>tepat Rp {formattedAmount}</strong> — jangan dibulatkan. 3 digit unik ({uniqueSuffix}) digunakan untuk verifikasi otomatis.</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedPkg && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-10 text-center text-gray-400">
          <Coins className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p className="text-sm">Pilih paket di atas untuk melihat detail pembayaran</p>
        </div>
      )}
    </div>
  );
}
