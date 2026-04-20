import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    category: 'Umum',
    items: [
      {
        q: 'Apa itu VerteX?',
        a: 'VerteX adalah platform AI tools lengkap untuk content creator Indonesia. Kami menyediakan 30+ tools berbasis kecerdasan buatan untuk membantu kamu membuat konten viral, mengoptimalkan SEO, generate gambar, dan banyak lagi.',
      },
      {
        q: 'Apakah VerteX gratis?',
        a: 'VerteX menggunakan sistem token. Setiap akun baru mendapatkan 10 token gratis untuk mencoba semua tools. Setelah itu, kamu bisa top up token sesuai kebutuhan dengan harga yang terjangkau.',
      },
      {
        q: 'Apakah perlu install aplikasi?',
        a: 'Tidak perlu! VerteX berjalan langsung di browser. Namun kamu bisa install sebagai PWA (Progressive Web App) untuk pengalaman seperti aplikasi native — cukup klik "Install App" di browser kamu.',
      },
    ],
  },
  {
    category: 'Token & Pembayaran',
    items: [
      {
        q: 'Bagaimana cara top up token?',
        a: 'Klik menu "Top Up" di sidebar, pilih paket yang sesuai, lalu transfer via Dana ke nomor 082242812329 a.n. Maris Ibrahim. Setelah transfer, konfirmasi via WhatsApp dengan menyertakan bukti transfer.',
      },
      {
        q: 'Berapa lama token masuk setelah transfer?',
        a: 'Token akan ditambahkan dalam 1-24 jam setelah konfirmasi pembayaran diterima oleh admin. Proses biasanya lebih cepat di jam kerja (08.00-22.00 WIB).',
      },
      {
        q: 'Apakah token bisa dikembalikan?',
        a: 'Token yang sudah dibeli tidak dapat dikembalikan (non-refundable). Namun jika terjadi kesalahan teknis dari pihak kami, kami akan mengembalikan token yang terpakai.',
      },
      {
        q: 'Berapa token yang dibutuhkan per tools?',
        a: 'Sebagian besar tools membutuhkan 1 token per generate. Tools yang lebih kompleks seperti Subtitle Generator (3 token), Podcast to Shorts (2 token), Smart Video Clipper (5 token), dan Text to Image AI (3 token).',
      },
      {
        q: 'Bagaimana cara mendapatkan token gratis?',
        a: 'Kamu bisa mendapatkan token gratis melalui program referral. Setiap teman yang mendaftar menggunakan link referral kamu dan melakukan top up, kamu mendapatkan bonus 20% dari nilai top up mereka.',
      },
    ],
  },
  {
    category: 'Tools AI',
    items: [
      {
        q: 'Model AI apa yang digunakan VerteX?',
        a: 'VerteX menggunakan model mimo-v2-omni dari SumoPod untuk tools teks, dan Seedream v4 Edit dari RunPod untuk tools gambar. Semua model dipilih untuk memberikan hasil terbaik dengan biaya efisien.',
      },
      {
        q: 'Apakah hasil generate AI bisa digunakan secara komersial?',
        a: 'Ya, konten yang kamu generate menggunakan VerteX adalah milikmu dan bisa digunakan untuk keperluan komersial. Namun pastikan konten tidak melanggar hak cipta pihak lain.',
      },
      {
        q: 'Kenapa hasil AI kadang tidak sesuai ekspektasi?',
        a: 'Kualitas output AI sangat bergantung pada kualitas prompt yang kamu berikan. Semakin detail dan spesifik promptmu, semakin baik hasilnya. Coba gunakan contoh prompt yang tersedia di setiap tools.',
      },
      {
        q: 'Apakah ada batasan penggunaan per hari?',
        a: 'Tidak ada batasan harian selama kamu memiliki token yang cukup. Namun ada rate limiting untuk mencegah penyalahgunaan — maksimal 60 request per menit.',
      },
    ],
  },
  {
    category: 'Akun & Keamanan',
    items: [
      {
        q: 'Bagaimana cara mendaftar?',
        a: 'Klik "Profile" di sidebar, pilih tab "Daftar", isi nama, email, dan password. Akun langsung aktif tanpa perlu konfirmasi email.',
      },
      {
        q: 'Lupa password, bagaimana cara reset?',
        a: 'Saat ini fitur reset password belum tersedia secara mandiri. Hubungi admin via WhatsApp di 082242812329 untuk bantuan reset password.',
      },
      {
        q: 'Apakah data saya aman?',
        a: 'Ya. Kami menggunakan enkripsi SSL/TLS untuk semua komunikasi data, password di-hash menggunakan algoritma bcrypt, dan data disimpan di Supabase dengan keamanan enterprise-grade.',
      },
      {
        q: 'Bagaimana cara menghapus akun?',
        a: 'Hubungi admin via WhatsApp atau email di support@genztools.my.id untuk meminta penghapusan akun. Semua data akan dihapus dalam 7 hari kerja.',
      },
    ],
  },
  {
    category: 'Downloader',
    items: [
      {
        q: 'Apakah TikTok Downloader legal?',
        a: 'Downloader kami menggunakan API publik yang tersedia. Gunakan hanya untuk mengunduh konten yang kamu miliki atau yang bebas hak cipta. Kami tidak bertanggung jawab atas penyalahgunaan.',
      },
      {
        q: 'Kenapa video tidak bisa didownload?',
        a: 'Beberapa video mungkin dilindungi atau API sedang mengalami gangguan. Coba lagi beberapa saat kemudian atau gunakan URL yang berbeda.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-gray-300 hover:text-white transition"
      >
        <span>{q}</span>
        {open ? <ChevronUp className="h-4 w-4 flex-shrink-0 text-purple-400" /> : <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-400" />}
      </button>
      {open && (
        <div className="pb-4 text-sm text-gray-400 leading-relaxed">
          {a}
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <button onClick={() => navigate(-1)} className="mb-8 flex items-center gap-2 text-sm text-gray-400 hover:text-white transition">
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/20">
            <HelpCircle className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">FAQ</h1>
            <p className="text-xs text-gray-400">Pertanyaan yang Sering Ditanyakan</p>
          </div>
        </div>

        <div className="space-y-8">
          {faqs.map(cat => (
            <div key={cat.category}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-purple-400">{cat.category}</h2>
              <div className="rounded-2xl border border-white/5 bg-[#111111] px-5">
                {cat.items.map((item, i) => (
                  <FAQItem key={i} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 text-center">
          <p className="text-sm text-gray-400 mb-3">Tidak menemukan jawaban yang kamu cari?</p>
          <a
            href="https://wa.me/6282242812329"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 transition"
          >
            Hubungi Support
          </a>
        </div>
      </div>
    </div>
  );
}
