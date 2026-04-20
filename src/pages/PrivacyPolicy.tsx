import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20">
            <Shield className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
            <p className="text-xs text-gray-400">Terakhir diperbarui: 20 April 2025</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Informasi yang Kami Kumpulkan</h2>
            <p>VerteX mengumpulkan informasi berikut saat Anda menggunakan layanan kami:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong className="text-gray-300">Informasi Akun:</strong> Nama, alamat email, dan password yang dienkripsi saat Anda mendaftar.</li>
              <li><strong className="text-gray-300">Data Penggunaan:</strong> Tools yang digunakan, riwayat generate, dan jumlah token yang dipakai.</li>
              <li><strong className="text-gray-300">Data Teknis:</strong> Alamat IP, jenis browser, sistem operasi, dan waktu akses untuk keperluan keamanan dan analitik.</li>
              <li><strong className="text-gray-300">Konten yang Diinput:</strong> Teks prompt, gambar, dan konten lain yang Anda masukkan ke tools kami untuk diproses oleh AI.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Cara Kami Menggunakan Informasi</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Menyediakan, mengoperasikan, dan meningkatkan layanan VerteX.</li>
              <li>Memproses transaksi token dan mengelola saldo akun Anda.</li>
              <li>Mengirimkan notifikasi penting terkait akun dan layanan.</li>
              <li>Mendeteksi dan mencegah penipuan, penyalahgunaan, atau aktivitas ilegal.</li>
              <li>Menganalisis pola penggunaan untuk meningkatkan performa tools AI.</li>
              <li>Memenuhi kewajiban hukum yang berlaku.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Berbagi Informasi dengan Pihak Ketiga</h2>
            <p>Kami tidak menjual data pribadi Anda. Kami hanya berbagi data dengan:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong className="text-gray-300">Penyedia Layanan AI:</strong> SumoPod dan RunPod untuk memproses permintaan AI Anda. Data dikirim secara terenkripsi dan tidak disimpan oleh mereka.</li>
              <li><strong className="text-gray-300">Supabase:</strong> Sebagai penyedia database dan autentikasi kami.</li>
              <li><strong className="text-gray-300">Vercel:</strong> Sebagai platform hosting kami.</li>
              <li><strong className="text-gray-300">Penegak Hukum:</strong> Jika diwajibkan oleh hukum yang berlaku.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Keamanan Data</h2>
            <p>Kami menerapkan langkah-langkah keamanan industri standar termasuk enkripsi SSL/TLS, hashing password, dan kontrol akses berbasis peran. Namun, tidak ada sistem yang 100% aman. Kami menyarankan Anda menggunakan password yang kuat dan tidak membagikan kredensial akun.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Penyimpanan dan Retensi Data</h2>
            <p>Data akun disimpan selama akun Anda aktif. Riwayat penggunaan disimpan maksimal 12 bulan. Anda dapat meminta penghapusan data kapan saja dengan menghubungi kami.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Hak Pengguna</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Hak untuk mengakses data pribadi Anda.</li>
              <li>Hak untuk memperbaiki data yang tidak akurat.</li>
              <li>Hak untuk menghapus akun dan data Anda.</li>
              <li>Hak untuk membatasi pemrosesan data.</li>
              <li>Hak untuk portabilitas data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Cookie dan Pelacakan</h2>
            <p>Kami menggunakan cookie esensial untuk autentikasi dan preferensi pengguna. Kami juga menggunakan Vercel Analytics untuk memahami pola penggunaan secara anonim. Anda dapat menonaktifkan cookie di pengaturan browser, namun beberapa fitur mungkin tidak berfungsi optimal.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Perubahan Kebijakan</h2>
            <p>Kami dapat memperbarui kebijakan ini sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi di platform. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan terhadap kebijakan baru.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Hubungi Kami</h2>
            <p>Untuk pertanyaan terkait privasi, hubungi kami di:</p>
            <div className="mt-3 rounded-xl border border-white/5 bg-white/8 p-4">
              <p className="text-gray-300">Email: <a href="mailto:privacy@genztools.my.id" className="text-purple-400 hover:underline">privacy@genztools.my.id</a></p>
              <p className="text-gray-300 mt-1">WhatsApp: <a href="https://wa.me/6282242812329" className="text-purple-400 hover:underline">+62 822-4281-2329</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
