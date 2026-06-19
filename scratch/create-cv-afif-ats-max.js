const { jsPDF } = require("jspdf");

const doc = new jsPDF({ unit: "mm", format: "a4" });
const margin = 14;
const width = 182;
const ink = [20, 25, 32];
const muted = [76, 86, 99];
const blue = [18, 73, 135];
const line = [205, 213, 224];

function color(c) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function draw(c) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function text(value, x, y, size = 9, style = "normal", c = ink, opts = {}) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  color(c);
  doc.text(value, x, y, opts);
}

function wrap(value, x, y, w = width, size = 8.9, style = "normal", c = ink, leading = 4.35) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  color(c);
  const lines = doc.splitTextToSize(value, w);
  doc.text(lines, x, y);
  return y + lines.length * leading;
}

function section(title, y) {
  y += 2;
  text(title, margin, y, 10.3, "bold", blue);
  draw(line);
  doc.setLineWidth(0.35);
  doc.line(margin, y + 2.7, 196, y + 2.7);
  return y + 7.3;
}

function bullet(value, y) {
  const lines = doc.splitTextToSize(value, width - 5);
  text("•", margin + 1.5, y, 8.6, "normal", ink);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.6);
  color(ink);
  doc.text(lines, margin + 6, y);
  return y + lines.length * 4.15 + 0.9;
}

function role(title, meta, y) {
  text(title, margin, y, 9.4, "bold", ink);
  text(meta, 196, y, 8.5, "normal", muted, { align: "right" });
  return y + 4.9;
}

function ensure(y, need = 36) {
  if (y + need < 282) return y;
  doc.addPage();
  return 16;
}

let y = 14;
text("MUHAMMAD AFIF DZAKI KHAIRULLAH", margin, y, 15, "bold", ink);
y += 6.8;
text("Web Developer | Mobile Developer | Full-Stack Developer", margin, y, 9.6, "bold", blue);
y += 5.4;
text("Jambi, Indonesia | +62 895 1461 8737 | Madk1212@gmail.com", margin, y, 8.8, "normal", muted);
y += 5.2;
text("Target Roles: Frontend Developer, Flutter Developer, Web Developer, Full-Stack Developer, Junior Software Engineer", margin, y, 8.1, "normal", muted);

y = section("Professional Summary", y + 3);
y = wrap(
  "Web & Mobile Developer dengan pengalaman sekitar 2 tahun dalam pengembangan aplikasi pemerintah daerah, sistem pembelajaran berbasis web, dashboard admin, dan aplikasi mobile. Menguasai Flutter, Dart, Next.js, React, JavaScript, TypeScript, Supabase, PostgreSQL, REST API, Laravel, authentication, CRUD, responsive design, API integration, debugging, deployment, dan technical documentation. Terbiasa membangun fitur dari analisis kebutuhan, database design, UI implementation, testing, hingga perbaikan bug.",
  margin,
  y,
  width,
  8.8
);

y = section("Core Competencies", y + 1);
y = wrap(
  "Frontend Development | Mobile App Development | Full-Stack Development | REST API Integration | Database Management | Supabase Authentication | PostgreSQL | CRUD Operations | Admin Dashboard | Responsive Web Design | UI Implementation | State Management | JSON Parsing | Debugging | User Requirements Analysis | Technical Documentation | Deployment | Team Collaboration",
  margin,
  y,
  width,
  8.6
);

y = section("Technical Skills", y + 1);
y = wrap("Programming Languages: JavaScript, TypeScript, Dart, PHP, HTML, CSS", margin, y, width, 8.6);
y = wrap("Frameworks & Libraries: Next.js, React, Flutter, Laravel, Material UI, Ant Design, fl_chart", margin, y + 0.4, width, 8.6);
y = wrap("Backend & Database: Supabase, PostgreSQL, REST API, Authentication, Database Schema, Data Storage", margin, y + 0.4, width, 8.6);
y = wrap("Tools: Git, GitHub, Visual Studio Code, Android Studio, Microsoft Excel, Word, PowerPoint", margin, y + 0.4, width, 8.6);

y = section("Professional Experience", y + 1);
y = role("Dinas Komunikasi dan Informatika (KOMINFO) - Kabupaten Tebo", "Programmer | Jan 2024 - Dec 2025", y);
y = bullet("Mengembangkan dan mendukung aplikasi pemerintah daerah untuk kebutuhan layanan informasi, pelaporan, statistik daerah, dan operasional internal.", y);
y = bullet("Mengerjakan integrasi REST API, JSON parsing, asynchronous data fetching, data mapping, bug fixing, dan UI implementation pada aplikasi mobile Flutter.", y);
y = bullet("Membangun tampilan data dinamis, tabel kompleks dengan header bertingkat, dan halaman laporan tahunan untuk membantu proses monitoring data instansi.", y);
y = bullet("Mendukung lebih dari 10 kegiatan teknis resmi instansi, termasuk live streaming, konfigurasi jaringan dasar, troubleshooting perangkat, dan dokumentasi teknis.", y);
y = bullet("Berkolaborasi dengan tim teknis dan non-teknis untuk menerjemahkan kebutuhan pengguna menjadi fitur aplikasi yang dapat digunakan secara operasional.", y);
y = bullet("Memberikan dukungan sistem dan perbaikan teknis untuk menjaga aplikasi serta perangkat pendukung tetap berjalan sesuai kebutuhan institusi.", y);

y = ensure(y, 24);
y = role("Reklame Afia - Jambi, Indonesia", "Staff | 2015 - Present", y + 1);
y = bullet("Membantu produksi desain grafis dan kebutuhan visual menggunakan CorelDraw untuk pelanggan dan operasional usaha.", y);
y = bullet("Mendukung pengecekan stok, manajemen material, dokumentasi, koordinasi pekerjaan, dan efisiensi operasional harian.", y);

y = ensure(y, 65);
y = section("Selected Projects", y + 1);
y = role("Full-Stack Developer - Sistem LPK Sagara", "2026", y);
y = bullet("Membangun sistem pembelajaran berbasis web menggunakan Next.js, React, Supabase, PostgreSQL, authentication, dan responsive UI.", y);
y = bullet("Mengembangkan 5+ modul utama: dashboard admin, materi belajar, ujian, kategori pembelajaran, manajemen pengguna, dan pengelolaan konten.", y);
y = bullet("Mengimplementasikan CRUD, database schema, penyimpanan data, autentikasi, dan alur admin untuk mendukung operasional LPK secara digital.", y);
y = bullet("Membuat dashboard admin agar pengelolaan materi, ujian, kategori, dan data pembelajaran lebih terstruktur serta mudah diperbarui.", y);
y = bullet("Mendesain antarmuka desktop dan mobile agar sistem nyaman digunakan oleh admin maupun peserta pembelajaran.", y);

y = ensure(y, 48);
y = role("Flutter Developer - Aplikasi Smart Tebo", "2024", y + 1);
y = bullet("Mengembangkan aplikasi mobile Smart Tebo menggunakan Flutter untuk mendukung akses informasi dan data daerah.", y);
y = bullet("Mengintegrasikan Flutter dengan REST API backend Laravel, termasuk asynchronous request, JSON parsing, dan error handling dasar.", y);
y = bullet("Menampilkan statistik daerah, laporan tahunan, dan tabel data kompleks untuk kebutuhan perbandingan data instansi.", y);
y = bullet("Mengoptimalkan UI mobile agar data dinamis lebih mudah dibaca oleh masyarakat dan pengguna internal pemerintah.", y);

y = ensure(y, 48);
y = role("Flutter Developer - Aplikasi Keuangan Pribadi", "2025", y + 1);
y = bullet("Membangun aplikasi keuangan pribadi untuk mencatat pemasukan, pengeluaran, kategori transaksi, saldo, dan ringkasan laporan.", y);
y = bullet("Mengimplementasikan Supabase authentication, CRUD transaksi, session management, database management, dan pemisahan data berdasarkan user ID.", y);
y = bullet("Menambahkan visualisasi data menggunakan grafik, filter transaksi, dan ringkasan laporan untuk membantu pengguna memantau keuangan.", y);

y = ensure(y, 38);
y = role("Flutter Developer - Aplikasi POS / Kasir", "2025", y + 1);
y = bullet("Mengembangkan aplikasi POS/kasir menggunakan Flutter untuk simulasi transaksi penjualan, pengelolaan produk, dan perhitungan total.", y);
y = bullet("Mendesain alur input produk, transaksi, data management, pengujian fitur utama, proses build Android, dan pembuatan file APK.", y);

y = ensure(y, 36);
y = section("Education", y + 1);
y = role("Universitas Dinamika Bangsa", "S1 Teknologi Informatika | 2019 - 2023 | IPK 3.40", y);
y = role("SMK Revany Indra Putra", "Teknik Komputer dan Jaringan | 2016 - 2019", y + 0.5);

y = ensure(y, 28);
y = section("Achievements and Activities", y + 1);
y = bullet("Juara 2 - Kompetisi Blogger.", y);
y = bullet("Staf Dewan Mahasiswa, pengalaman organisasi, koordinasi kegiatan, dan kerja sama tim.", y);

y = ensure(y, 20);
y = section("Additional Information", y + 1);
y = bullet("Bahasa Indonesia: Native / Bahasa Ibu.", y);
y = bullet("Bahasa Inggris: Menengah, terutama membaca dokumentasi teknis dan referensi developer.", y);
y = bullet("Availability: Remote, freelance project, contract, internship, dan full-time opportunity.", y);

const pages = doc.internal.getNumberOfPages();
for (let i = 1; i <= pages; i += 1) {
  doc.setPage(i);
  draw(line);
  doc.line(margin, 287, 196, 287);
  text(`CV ATS - Muhammad Afif Dzaki Khairullah | Page ${i} of ${pages}`, margin, 292.5, 7.2, "normal", muted);
}

doc.save("scratch/CV-Muhammad-Afif-Dzaki-Khairullah-ATS-90.pdf");
