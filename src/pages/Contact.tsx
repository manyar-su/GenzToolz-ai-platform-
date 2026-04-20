import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle, Clock, MapPin } from 'lucide-react';

export default function Contact() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Hubungi Kami</h1>
          <p className="mt-1 text-sm text-gray-400">Tim kami siap membantu kamu 7 hari seminggu</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          <a href="https://wa.me/6282242812329" target="_blank" rel="noreferrer"
            className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#111111] p-5 hover:border-green-500/30 transition group">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-green-500/20">
              <MessageCircle className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-green-400 transition">WhatsApp</p>
              <p className="text-sm text-gray-400 mt-0.5">+62 822-4281-2329</p>
              <p className="text-xs text-gray-400 mt-1">Respon tercepat</p>
            </div>
          </a>

          <a href="mailto:support@genztools.my.id"
            className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#111111] p-5 hover:border-purple-500/30 transition group">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-purple-500/20">
              <Mail className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-white group-hover:text-purple-400 transition">Email</p>
              <p className="text-sm text-gray-400 mt-0.5">support@genztools.my.id</p>
              <p className="text-xs text-gray-400 mt-1">Respon dalam 24 jam</p>
            </div>
          </a>

          <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#111111] p-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/20">
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Jam Operasional</p>
              <p className="text-sm text-gray-400 mt-0.5">Senin – Minggu</p>
              <p className="text-xs text-gray-400 mt-1">08.00 – 22.00 WIB</p>
            </div>
          </div>

          <div className="flex items-start gap-4 rounded-2xl border border-white/5 bg-[#111111] p-5">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/20">
              <MapPin className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="font-semibold text-white">Lokasi</p>
              <p className="text-sm text-gray-400 mt-0.5">Indonesia</p>
              <p className="text-xs text-gray-400 mt-1">Layanan online nationwide</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#111111] p-6">
          <h2 className="text-base font-semibold text-white mb-4">Kirim Pesan</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nama</label>
              <input type="text" placeholder="Nama kamu" className="w-full rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input type="email" placeholder="email@contoh.com" className="w-full rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Pesan</label>
              <textarea rows={4} placeholder="Tulis pesanmu di sini..." className="w-full resize-none rounded-xl border border-white/10 bg-white/8 px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none" />
            </div>
            <a
              href="https://wa.me/6282242812329"
              target="_blank"
              rel="noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 transition"
            >
              <MessageCircle className="h-4 w-4" /> Kirim via WhatsApp
            </a>
            <p className="text-center text-xs text-gray-400">Atau email langsung ke support@genztools.my.id</p>
          </div>
        </div>
      </div>
    </div>
  );
}
