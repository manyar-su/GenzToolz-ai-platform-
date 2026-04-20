import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsOfService() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <FileText className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Syarat & Ketentuan</h1>
            <p className="text-xs text-gray-400">Terakhir diperbarui: 20 April 2025</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Penerimaan Syarat</h2>
            <p>Dengan mengakses atau menggunakan platform VerteX, Anda menyetujui untuk terikat oleh Syarat & Ketentuan ini. Jika Anda tidak setuju, harap hentikan penggunaan layanan kami.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Deskripsi Layanan</h2>
            <p>VerteX adalah platform AI tools untuk content creator yang menyediakan berbagai fitur berbasis kecerdasan buatan termasuk pembuatan teks, gambar, analisis konten, dan tools produktivitas lainnya. Layanan beroperasi dengan sistem token yang dapat dibeli atau diperoleh melalui program referral.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Akun Pengguna</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Anda harus berusia minimal 13 tahun untuk menggunakan layanan ini.</li>
              <li>Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda.</li>
              <li>Satu orang hanya boleh memiliki satu akun aktif.</li>
              <li>Kami berhak menangguhkan akun yang melanggar ketentuan ini.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Sistem Token</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li>Token adalah mata uang virtual dalam platform VerteX yang digunakan untuk mengakses tools AI.</li>
              <li>Token yang telah dibeli tidak dapat dikembalikan (non-refundable) kecuali terjadi kesalahan teknis dari pihak kami.</li>
              <li>Token tidak memiliki nilai moneter di luar platform dan tidak dapat ditukar dengan uang tunai.</li>
              <li>Token yang diperoleh dari program referral atau bonus dapat memiliki masa berlaku.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Penggunaan yang Dilarang</h2>
            <p>Anda dilarang menggunakan VerteX untuk:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Membuat konten yang melanggar hukum, mengandung kekerasan, pornografi, atau ujaran kebencian.</li>
              <li>Melanggar hak kekayaan intelektual pihak lain.</li>
              <li>Menyebarkan informasi palsu (hoaks) atau konten yang menyesatkan.</li>
              <li>Melakukan spam, phishing, atau aktivitas penipuan.</li>
              <li>Mencoba meretas, merusak, atau mengganggu sistem kami.</li>
              <li>Menggunakan bot atau skrip otomatis tanpa izin tertulis.</li>
              <li>Menjual kembali akses ke layanan kami tanpa izin.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Hak Kekayaan Intelektual</h2>
            <p>Konten yang Anda generate menggunakan VerteX adalah milik Anda. Namun, Anda memberikan kami lisensi terbatas untuk menggunakan konten tersebut guna meningkatkan layanan kami. Platform VerteX, termasuk kode, desain, dan merek dagang, adalah milik eksklusif kami.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Batasan Tanggung Jawab</h2>
            <p>VerteX disediakan "sebagaimana adanya" tanpa jaminan apapun. Kami tidak bertanggung jawab atas:</p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li>Kerugian yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan.</li>
              <li>Akurasi, kelengkapan, atau kualitas konten yang dihasilkan AI.</li>
              <li>Gangguan layanan akibat pemeliharaan atau kejadian di luar kendali kami.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Perubahan Layanan</h2>
            <p>Kami berhak mengubah, menangguhkan, atau menghentikan layanan kapan saja dengan atau tanpa pemberitahuan. Kami juga berhak mengubah harga token dengan pemberitahuan minimal 7 hari sebelumnya.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Hukum yang Berlaku</h2>
            <p>Syarat & Ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa akan diselesaikan melalui musyawarah mufakat, dan jika tidak tercapai, melalui pengadilan yang berwenang di Indonesia.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Hubungi Kami</h2>
            <div className="rounded-xl border border-white/5 bg-white/8 p-4">
              <p className="text-gray-300">Email: <a href="mailto:legal@genztools.my.id" className="text-purple-400 hover:underline">legal@genztools.my.id</a></p>
              <p className="text-gray-300 mt-1">WhatsApp: <a href="https://wa.me/6282242812329" className="text-purple-400 hover:underline">+62 822-4281-2329</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
