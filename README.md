# 🚀 GenzTools — AI Toolkit untuk Content Creator

Platform AI tools lengkap untuk para content creator Gen-Z. Buat konten viral, optimalkan strategi, dan tingkatkan produktivitas dengan 30+ tools bertenaga AI.

---

## ✨ Fitur Unggulan

- 🪙 **Sistem Token** — Setiap penggunaan tool menggunakan token. Hemat & efisien.
- 🎁 **10 Kredit Gratis** — Langsung dapat token saat daftar, tanpa kartu kredit.
- 🤝 **Program Affiliate** — Ajak teman, dapat bonus token setiap referral berhasil.
- 🌙 **Dark Mode** — Nyaman dipakai siang maupun malam.
- 📱 **Responsive** — Optimal di desktop maupun mobile.

---

## 🛠️ Daftar Tools (30+ Tools AI)

### ✍️ Teks & Strategi

| Tool | Deskripsi | Badge |
|------|-----------|-------|
| **The Script Architect** | Buat naskah video dengan formula copywriting viral (AIDA/PAS) | 🔥 Terpopuler |
| **Viral Hook Generator** | Buat 10 hook viral untuk memancing perhatian dalam 3 detik pertama | 📈 Trending |
| **Trend Analyzer** | Analisa topik trending untuk ide konten segar | ⭐ Wajib Coba |
| **Caption & Hashtag Generator** | Optimalkan metadata konten untuk masuk FYP/Explore | ❤️ Favorit |
| **YouTube SEO Optimizer** | Judul clickbait aman dan tags ranking tinggi untuk YouTube | 🆕 Baru |
| **Video-to-Short Script** | Ubah video/teks panjang menjadi naskah video pendek | — |
| **Comment Reply Automation** | Buat balasan interaktif untuk membangun komunitas | 🆕 Baru |
| **Podcast-to-Shorts Converter** | Ubah transkrip podcast panjang menjadi 5 ide konten pendek viral | 🤖 Canggih |
| **Competitor Content Analyzer** | Analisa strategi konten kompetitor untuk menangkan persaingan | 🎯 Strategi |
| **AI Reply Master** | Balas komentar otomatis dengan berbagai gaya bahasa (Sarkas/Santai) | 🆕 Baru |
| **Community Poll Generator** | Ide pertanyaan polling provokatif untuk engagement Story | — |
| **Profile Bio Optimizer** | Optimalkan bio profil agar lebih menjual dan profesional | — |
| **Brand Deal Pitch Generator** | Buat surat penawaran profesional untuk endorsement brand | 💰 Cuan |

### 🎨 Visual & Branding

| Tool | Deskripsi | Badge |
|------|-----------|-------|
| **AI Thumbnail A/B Tester** | Simulasi prediksi performa dua desain thumbnail | 💎 Pro |
| **Color Grading Suggester** | Rekomendasi setting warna video berdasarkan mood konten | — |
| **AI Color Palette Designer** | Buat kombinasi warna estetik untuk branding kamu | 🌈 Estetik |
| **Text-to-Visual** | Ubah teks menjadi gambar atau aset thumbnail | 🧪 Beta |
| **Photo Object Remover** | Hapus objek/orang yang tidak diinginkan dari foto | 🧪 Beta |
| **Watermark Remover** | Bersihkan gambar dengan menghapus watermark kecil | 🧪 Beta |

### 🎙️ Audio & Voice

| Tool | Deskripsi | Badge |
|------|-----------|-------|
| **Text to Voice (Natural AI)** | Ubah teks menjadi suara voiceover natural untuk konten tanpa wajah | 🆕 Baru |
| **Audio Visualizer** | Ubah audio/podcast menjadi video gelombang suara yang menarik | — |

### 🛠️ Utilitas & Produktivitas

| Tool | Deskripsi | Badge |
|------|-----------|-------|
| **Smart Post Scheduler** | Analisa waktu posting terbaik untuk jangkauan maksimal | 📅 Produktif |
| **AI Smart Video Clipper** | Potong video otomatis dengan deteksi highlight & auto-reframe | 💎 Premium |
| **Link-in-Bio Builder** | Buat halaman landing mini untuk link bio kamu | 🆕 Baru |
| **Automated Video Subtitle** | Generate subtitle otomatis gaya Gen-Z (Pop-up & Emoji) | ✅ Wajib |
| **Affiliate Product Hunter** | Cari produk trending di marketplace yang cocok dengan niche kamu | 💰 Cuan |
| **Giveaway Picker & Checker** | Undi pemenang giveaway secara adil dan transparan | — |
| **Shadowban Checker** | Analisa kesehatan akun dan deteksi pembatasan jangkauan | ⚠️ Penting |
| **All-in-One Downloader** | Download video dari IG, TikTok, YouTube tanpa watermark | 🧪 Beta |

---

## 💎 Sistem Token & Kredit

| Aksi | Token |
|------|-------|
| Daftar akun baru | +10 token gratis |
| Referral berhasil (pengundang) | +20 token |
| Penggunaan tool rata-rata | -1 token |
| Top Up | Sesuai paket |

---

## 🗄️ Database (Supabase)

| Tabel | Keterangan |
|-------|-----------|
| `profiles` | Data user: nama, email, kredit, kode referral, role |
| `transactions` | Riwayat topup & pembayaran |
| `tool_usage` | Log penggunaan setiap tool |
| `admins` | Data admin panel |
| `user_overview` *(view)* | Ringkasan lengkap data user + statistik |

---

## 🧰 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Node.js + Express |
| Database & Auth | Supabase (PostgreSQL) |
| AI Engine | Google Gemini |
| Deployment | Vercel |

---

## 🚀 Cara Menjalankan

```bash
# 1. Clone repo
git clone https://github.com/manyar-su/genztools2.git
cd genztools2

# 2. Install dependencies
pnpm install

# 3. Setup environment
cp .env.example .env
# Isi VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, GEMINI_API_KEY

# 4. Jalankan dev server
pnpm run dev
# Buka http://localhost:5173
```

---

## 🤝 Kontribusi

Fork repo ini, buat branch baru, dan kirim pull request. Semua kontribusi disambut!

---

**Happy Creating!** ✨🎬
