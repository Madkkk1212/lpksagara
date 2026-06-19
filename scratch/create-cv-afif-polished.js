const fs = require("fs");
const { jsPDF } = require("jspdf");

const doc = new jsPDF({ unit: "mm", format: "a4" });

const page = {
  w: 210,
  h: 297,
  margin: 14,
};

const colors = {
  ink: [28, 35, 45],
  muted: [90, 103, 119],
  line: [215, 221, 229],
  blue: [25, 86, 168],
  blueDark: [18, 54, 105],
  blueSoft: [235, 242, 255],
};

function rgb(c) {
  doc.setTextColor(c[0], c[1], c[2]);
}

function draw(c) {
  doc.setDrawColor(c[0], c[1], c[2]);
}

function fill(c) {
  doc.setFillColor(c[0], c[1], c[2]);
}

function font(size, style = "normal", color = colors.ink) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  rgb(color);
}

function text(value, x, y, size = 9.2, style = "normal", color = colors.ink, options = {}) {
  font(size, style, color);
  doc.text(value, x, y, options);
}

function line(y) {
  draw(colors.line);
  doc.setLineWidth(0.35);
  doc.line(page.margin, y, page.w - page.margin, y);
}

function section(title, y) {
  text(title, page.margin, y, 10.4, "bold", colors.blueDark);
  draw(colors.blue);
  doc.setLineWidth(0.75);
  doc.line(page.margin, y + 2.7, page.w - page.margin, y + 2.7);
  return y + 8;
}

function wrapped(value, x, y, width, size = 9.1, style = "normal", color = colors.ink, leading = 4.5) {
  font(size, style, color);
  const lines = doc.splitTextToSize(value, width);
  doc.text(lines, x, y);
  return y + lines.length * leading;
}

function bullet(value, x, y, width, size = 8.8) {
  font(size, "normal", colors.ink);
  const lines = doc.splitTextToSize(value, width);
  fill(colors.blue);
  doc.circle(x, y - 1.25, 0.9, "F");
  doc.text(lines, x + 4, y);
  return y + lines.length * 4.25 + 1.2;
}

function role(title, meta, y) {
  text(title, page.margin, y, 9.8, "bold", colors.ink);
  text(meta, page.w - page.margin, y, 8.8, "normal", colors.muted, { align: "right" });
  return y + 5.4;
}

function tag(label, x, y, w) {
  fill(colors.blueSoft);
  draw(colors.blueSoft);
  doc.roundedRect(x, y, w, 6.7, 1.8, 1.8, "FD");
  text(label, x + 2.7, y + 4.55, 7.4, "bold", colors.blueDark);
}

function ensurePage(y, needed = 35) {
  if (y + needed <= page.h - 15) return y;
  doc.addPage();
  return page.margin + 2;
}

// Header
fill(colors.blueDark);
doc.rect(0, 0, page.w, 42, "F");

const photoPath = "scratch/extracted/cv_image_1_1.jpg";
if (fs.existsSync(photoPath)) {
  fill([255, 255, 255]);
  doc.roundedRect(page.margin, 6, 25, 30, 2, 2, "F");
  const photo = `data:image/jpeg;base64,${fs.readFileSync(photoPath).toString("base64")}`;
  doc.addImage(photo, "JPEG", page.margin + 1, 7, 23, 28);
}

text("MUHAMMAD AFIF DZAKI KHAIRULLAH", 44, 13.2, 13.8, "bold", [255, 255, 255]);
text("Web & Mobile Developer | Full-Stack Enthusiast", 44, 21.2, 9.1, "normal", [232, 240, 255]);
text("Jambi, Indonesia | +62 895 1461 8737", 44, 29, 8.4, "normal", [255, 255, 255]);
text("Madk1212@gmail.com", 44, 35.5, 8.4, "normal", [232, 240, 255]);

let y = 53;

y = section("Summary", y);
y = wrapped(
  "Web & Mobile Developer dengan pengalaman sekitar 2 tahun dalam pengembangan aplikasi untuk instansi pemerintah dan proyek digital. Berpengalaman membangun sistem full-stack menggunakan Flutter, Next.js, React, Supabase, REST API, Laravel, autentikasi, database, dashboard admin, CRUD, integrasi API, responsive UI, deployment, dan dokumentasi teknis. Terbiasa menerjemahkan kebutuhan user menjadi fitur aplikasi yang efisien, mudah digunakan, dan siap dikembangkan.",
  page.margin,
  y,
  182,
  9.1,
  "normal",
  colors.ink,
  4.6
);

y += 4;
y = section("Technical Skills", y);
const tags = [
  ["Next.js", 18],
  ["React", 15],
  ["JavaScript", 24],
  ["TypeScript", 23],
  ["HTML/CSS", 22],
  ["Flutter", 17],
  ["Dart", 13],
  ["Supabase", 21],
  ["PostgreSQL", 24],
  ["REST API", 20],
  ["Laravel", 17],
  ["Authentication", 30],
  ["CRUD", 15],
  ["Responsive UI", 28],
  ["Git/GitHub", 22],
  ["Deployment", 25],
  ["Android Studio", 28],
  ["VS Code", 18],
  ["Documentation", 30],
];
let x = page.margin;
tags.forEach(([label, w]) => {
  if (x + w > page.w - page.margin) {
    x = page.margin;
    y += 9;
  }
  tag(label, x, y, w);
  x += w + 3;
});
y += 13;

y = section("Work Experience", y);
y = role("Dinas Komunikasi dan Informatika (KOMINFO) - Kabupaten Tebo", "Programmer | Januari 2024 - Desember 2025", y);
y = bullet("Mengembangkan dan mendukung aplikasi pemerintah daerah untuk kebutuhan layanan informasi, pelaporan, dan operasional internal.", page.margin + 2, y, 174);
y = bullet("Mengerjakan integrasi REST API, parsing JSON, pengelolaan data dinamis, dan perbaikan bug pada aplikasi mobile berbasis Flutter.", page.margin + 2, y, 174);
y = bullet("Membuat tampilan responsif, tabel data, dan komponen UI yang digunakan untuk menampilkan statistik daerah dan laporan tahunan.", page.margin + 2, y, 174);
y = bullet("Mendukung lebih dari 10 kegiatan teknis instansi, termasuk live streaming resmi, konfigurasi jaringan dasar, dan troubleshooting perangkat.", page.margin + 2, y, 174);
y = bullet("Berkolaborasi dengan tim teknis dan non-teknis untuk menerjemahkan kebutuhan pengguna menjadi solusi aplikasi yang dapat digunakan.", page.margin + 2, y, 174);
y += 1;
y = role("Reklame Afia - Jambi, Indonesia", "Staff | 2015 - Present", y);
y = bullet("Membantu produksi desain grafis dan kebutuhan visual menggunakan CorelDraw untuk pelanggan dan operasional usaha.", page.margin + 2, y, 174);
y = bullet("Mendukung pengecekan stok, manajemen material, dokumentasi, koordinasi pekerjaan, dan efisiensi operasional harian.", page.margin + 2, y, 174);

y += 3;
y = section("Projects", y);
y = role("Full-Stack Developer - Sistem LPK Sagara", "2026", y);
y = bullet("Membangun sistem pembelajaran full-stack berbasis web menggunakan Next.js, React, Supabase, dan PostgreSQL.", page.margin + 2, y, 174);
y = bullet("Mengembangkan lebih dari 5 modul utama: dashboard admin, materi belajar, ujian, kategori pembelajaran, dan manajemen pengguna.", page.margin + 2, y, 174);
y = bullet("Mengimplementasikan autentikasi, CRUD, database schema, penyimpanan data, dan pengelolaan konten melalui dashboard admin.", page.margin + 2, y, 174);
y = bullet("Membuat alur admin agar pengelolaan materi dan ujian lebih terstruktur, mudah diperbarui, dan siap digunakan operasional LPK.", page.margin + 2, y, 174);
y = bullet("Merancang responsive UI untuk desktop dan mobile dengan komponen yang konsisten, mudah dibaca, dan ramah pengguna.", page.margin + 2, y, 174);

y = ensurePage(y, 56);
y += 1;
y = role("Flutter Developer - Aplikasi Smart Tebo", "2024", y);
y = bullet("Mengembangkan aplikasi mobile Smart Tebo menggunakan Flutter untuk mendukung akses informasi daerah.", page.margin + 2, y, 174);
y = bullet("Mengintegrasikan aplikasi dengan REST API dari backend Laravel dan menangani pemanggilan data asinkron.", page.margin + 2, y, 174);
y = bullet("Menampilkan statistik daerah, laporan tahunan, dan tabel kompleks dengan header bertingkat untuk kebutuhan perbandingan data.", page.margin + 2, y, 174);
y = bullet("Menangani parsing JSON, pemetaan data, error handling dasar, dan optimasi tampilan agar lebih responsif di perangkat mobile.", page.margin + 2, y, 174);

y += 1;
y = role("Flutter Developer - Aplikasi Keuangan Pribadi", "2025", y);
y = bullet("Membangun aplikasi keuangan pribadi untuk mencatat pemasukan, pengeluaran, kategori transaksi, dan ringkasan saldo.", page.margin + 2, y, 174);
y = bullet("Mengimplementasikan CRUD transaksi, autentikasi, manajemen database, session management, dan pemisahan data berdasarkan user ID dengan Supabase.", page.margin + 2, y, 174);
y = bullet("Menampilkan visualisasi data keuangan menggunakan grafik, filter data, dan ringkasan laporan agar pengguna lebih mudah memantau keuangan.", page.margin + 2, y, 174);

y += 1;
y = role("Flutter Developer - Aplikasi POS / Kasir", "2025", y);
y = bullet("Mengembangkan aplikasi POS/kasir menggunakan Flutter untuk simulasi transaksi penjualan dan pengelolaan produk.", page.margin + 2, y, 174);
y = bullet("Mendesain alur transaksi, input produk, perhitungan total, dan logika pengelolaan data transaksi dasar.", page.margin + 2, y, 174);
y = bullet("Mengelola proses build Android, pengujian fitur utama, dan pembuatan file APK untuk instalasi perangkat.", page.margin + 2, y, 174);

y += 4;
y = ensurePage(y, 46);
y = section("Education", y);
y = role("Universitas Dinamika Bangsa", "S1 Teknologi Informatika | 2019 - 2023 | IPK 3.40", y);
y = role("SMK Revany Indra Putra", "Teknik Komputer dan Jaringan | 2016 - 2019", y + 1);

y += 3;
y = section("Achievements & Activities", y);
y = bullet("Juara 2 - Kompetisi Blogger.", page.margin + 2, y, 174);
y = bullet("Staf Dewan Mahasiswa (pengalaman organisasi).", page.margin + 2, y, 174);

y += 3;
y = section("Additional Information", y);
y = bullet("Bahasa Indonesia: Native / Bahasa Ibu.", page.margin + 2, y, 174);
y = bullet("Bahasa Inggris: Menengah, terutama untuk membaca dokumentasi teknis.", page.margin + 2, y, 174);

const pageCount = doc.internal.getNumberOfPages();
for (let i = 1; i <= pageCount; i += 1) {
  doc.setPage(i);
  line(286);
  text(`CV - Muhammad Afif Dzaki Khairullah | Halaman ${i} dari ${pageCount}`, page.margin, 292, 7.4, "normal", colors.muted);
}

doc.save("scratch/CV-Muhammad-Afif-Dzaki-Khairullah-Polished.pdf");
