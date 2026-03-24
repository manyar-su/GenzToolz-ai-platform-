import { useUserStore } from "@/store/useUserStore";
import { useTokenStore } from "@/store/useTokenStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { MessageCircle, Coins, CreditCard, Copy, Check, Crown, Zap, Star } from "lucide-react";
import { useState } from "react";

const ONE_TIME = [
  { name: 'Starter', total: 13, price: 'Rp 10.000', priceNum: 10000, bonus: 3, base: 10 },
  { name: 'Creator', total: 65, price: 'Rp 50.000', priceNum: 50000, bonus: 15, base: 50, popular: true },
  { name: 'Agency', total: 130, price: 'Rp 100.000', priceNum: 100000, bonus: 30, base: 100 },
];

const SUBSCRIPTIONS = [
  { name: 'Basic', icon: Zap, tokens: 100, price: 'Rp 29.000/bln', color: 'from-blue-500 to-cyan-500', perks: ['100 token/bulan', 'Semua tools', 'Prioritas support'] },
  { name: 'Pro', icon: Star, tokens: 300, price: 'Rp 79.000/bln', color: 'from-purple-500 to-indigo-500', popular: true, perks: ['300 token/bulan', 'Semua tools', 'Bonus referral 2x', 'Early access fitur baru'] },
  { name: 'Creator+', icon: Crown, tokens: 1000, price: 'Rp 199.000/bln', color: 'from-yellow-500 to-orange-500', perks: ['1000 token/bulan', 'Semua tools', 'Bonus referral 3x', 'Custom branding', 'API access'] },
];

export default function Topup() {
  const { id } = useUserStore();
  const { tokens } = useTokenStore();
  const { add: addNotif } = useNotificationStore();
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'topup' | 'subscription'>('topup');

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = (pkgName: string, pkgAmount: number, pkgPrice: string) => {
    const message = `Halo Admin GenzTools, saya ingin Top Up Token.\n\nID User: ${id}\nPaket: ${pkgName}\nJumlah Token: ${pkgAmount}\nHarga: ${pkgPrice}\n\nMohon diproses. Terima kasih!`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
    addNotif({ title: 'Permintaan Top Up Dikirim', message: `Paket ${pkgName} (${pkgAmount} token) sedang diproses admin.`, type: 'info' });
  };

  const handleSubscription = (plan: typeof SUBSCRIPTIONS[0]) => {
    const message = `Halo Admin GenzTools, saya ingin berlangganan paket ${plan.name}.\n\nID User: ${id}\nPaket: ${plan.name}\nHarga: ${plan.price}\n\nMohon diproses. Terima kasih!`;
    window.open(`https://wa.me/6281234567890?text=${encodeURIComponent(message)}`, '_blank');
    addNotif({ title: 'Permintaan Langganan Dikirim', message: `Paket ${plan.name} sedang diproses admin.`, type: 'info' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Top Up Token
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Dapatkan token lebih banyak untuk menggunakan tools premium tanpa batas
        </p>
      </div>

      {/* User Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <Coins className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Saldo Token Anda</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{tokens} Token</h2>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <p className="text-xs text-gray-500 dark:text-gray-400">ID User Anda (Wajib Disertakan)</p>
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-700 w-full md:w-auto justify-between">
              <code className="text-sm font-mono text-gray-700 dark:text-gray-300 px-2">{id}</code>
              <button 
                onClick={copyToClipboard}
                className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
                title="Copy ID"
              >
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, index) => (
          <div 
            key={index}
            className={`group relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border transition-all duration-300 hover:-translate-y-1 ${pkg.popular ? 'border-yellow-400 ring-1 ring-yellow-400' : 'border-gray-100 dark:border-gray-700'}`}
          >
            {/* Popular Badge */}
            {pkg.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                MOST POPULAR
              </div>
            )}

            {/* Bonus Badge */}
            <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
              Bonus +{pkg.bonus}
            </div>

            <div className="text-center space-y-4 mt-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full w-16 h-16 mx-auto flex items-center justify-center group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">{pkg.total}</span>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{pkg.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{pkg.base} + {pkg.bonus} Bonus</p>
              </div>

              <div className="py-4 border-t border-gray-100 dark:border-gray-700">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{pkg.price}</span>
              </div>

              <button 
                onClick={() => handleWhatsApp(pkg.total, pkg.price)}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-colors ${pkg.popular ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                <MessageCircle className="w-4 h-4" />
                Beli via WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl p-6 border border-blue-100 dark:border-blue-900/30">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Cara Pembelian
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800 dark:text-blue-200">
          <li>Pilih paket token yang Anda inginkan di atas.</li>
          <li>Klik tombol <strong>"Beli via WhatsApp"</strong>.</li>
          <li>Anda akan diarahkan ke chat WhatsApp Admin dengan pesan otomatis yang berisi ID User Anda.</li>
          <li>Lakukan pembayaran sesuai instruksi Admin (Transfer Bank / E-Wallet).</li>
          <li>Setelah pembayaran dikonfirmasi, Admin akan menambahkan token ke akun Anda secara langsung.</li>
          <li>Token akan masuk otomatis tanpa perlu reload halaman (atau refresh jika perlu).</li>
        </ol>
      </div>
    </div>
  );
}
