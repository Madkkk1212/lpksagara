const { jsPDF } = require("jspdf");

const doc = new jsPDF({ unit: "mm", format: "a4" });

const colors = {
  ink: [25, 37, 52],
  muted: [92, 108, 125],
  line: [210, 218, 226],
  blue: [31, 96, 196],
  blueSoft: [232, 240, 255],
  green: [38, 142, 92],
  greenSoft: [231, 248, 239],
  amber: [178, 104, 0],
  amberSoft: [255, 246, 224],
};

function set(rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

function fill(rgb) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}

function stroke(rgb) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

function text(txt, x, y, size = 10, style = "normal", rgb = colors.ink) {
  doc.setFont("helvetica", style);
  doc.setFontSize(size);
  set(rgb);
  doc.text(txt, x, y);
}

function pill(txt, x, y, w, rgb, bg) {
  fill(bg);
  stroke(bg);
  doc.roundedRect(x, y, w, 8, 2, 2, "FD");
  text(txt, x + 4, y + 5.4, 8.5, "bold", rgb);
}

function sectionTitle(txt, x, y) {
  text(txt, x, y, 12, "bold", colors.blue);
  stroke(colors.line);
  doc.line(x, y + 3.5, 195, y + 3.5);
}

function bullet(txt, x, y) {
  fill(colors.blue);
  doc.circle(x, y - 1.4, 1.1, "F");
  const lines = doc.splitTextToSize(txt, 78);
  text(lines, x + 5, y, 9.2, "normal", colors.ink);
  return y + lines.length * 4.7 + 1.2;
}

function box(txt, x, y, w, h, border = colors.blue, bg = colors.blueSoft) {
  fill(bg);
  stroke(border);
  doc.roundedRect(x, y, w, h, 2, 2, "FD");
  const lines = doc.splitTextToSize(txt, w - 8);
  text(lines, x + 4, y + h / 2 - (lines.length - 1) * 2 + 1.5, 8.3, "bold", colors.ink);
}

function arrow(x1, y1, x2, y2) {
  stroke(colors.muted);
  doc.line(x1, y1, x2, y2);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const len = 3.2;
  doc.line(x2, y2, x2 - len * Math.cos(angle - Math.PI / 6), y2 - len * Math.sin(angle - Math.PI / 6));
  doc.line(x2, y2, x2 - len * Math.cos(angle + Math.PI / 6), y2 - len * Math.sin(angle + Math.PI / 6));
}

// Header
fill(colors.blue);
doc.rect(0, 0, 210, 31, "F");
text("Portofolio Singkat", 14, 14, 19, "bold", [255, 255, 255]);
text("Flowchart Perancangan Sistem & Diagram UML untuk Skripsi", 14, 23, 10, "normal", [236, 244, 255]);
text("Nama: [Isi Nama Kamu]", 145, 14, 9.5, "bold", [255, 255, 255]);
text("Web / Mobile Programmer", 145, 21, 8.5, "normal", [236, 244, 255]);

// Profile
sectionTitle("Profil Relevan", 14, 43);
const profile =
  "Programmer Web & Mobile yang terbiasa memahami kebutuhan sistem, menyusun alur proses, dan menerjemahkannya menjadi dokumentasi teknis seperti flowchart, use case diagram, class diagram, sequence diagram, dan activity diagram. Berpengalaman menggunakan Next.js, Flutter, Supabase, database, serta pengembangan aplikasi full-stack.";
text(doc.splitTextToSize(profile, 180), 14, 54, 9.5, "normal", colors.ink);

// Services
sectionTitle("Yang Bisa Saya Bantu", 14, 82);
let y = 93;
y = bullet("Review diagram yang sudah ada, termasuk koreksi aktor, proses, relasi, dan alur sistem.", 16, y);
y = bullet("Membuat ulang diagram agar lebih rapi, konsisten, dan siap dimasukkan ke BAB III/BAB IV.", 16, y);
y = bullet("Menyesuaikan diagram dengan fitur sistem web, kebutuhan user, dan format arahan kampus/dosen.", 16, y);
y = bullet("Memberikan output PNG/JPG/PDF serta file editable jika dibutuhkan, seperti draw.io.", 16, y);

// Skills card
sectionTitle("Tools & Kompetensi", 112, 82);
pill("Flowchart", 112, 92, 32, colors.blue, colors.blueSoft);
pill("Use Case", 147, 92, 31, colors.green, colors.greenSoft);
pill("Class Diagram", 112, 104, 41, colors.amber, colors.amberSoft);
pill("Sequence", 156, 104, 31, colors.blue, colors.blueSoft);
pill("Activity", 112, 116, 29, colors.green, colors.greenSoft);
pill("draw.io", 144, 116, 24, colors.amber, colors.amberSoft);
pill("Dokumentasi Skripsi", 112, 128, 55, colors.blue, colors.blueSoft);

// Example diagrams
sectionTitle("Contoh Mini: Alur Sistem Web", 14, 151);
box("User membuka sistem", 14, 162, 39, 15);
arrow(53, 169.5, 63, 169.5);
box("Login / akses fitur", 63, 162, 39, 15, colors.green, colors.greenSoft);
arrow(102, 169.5, 112, 169.5);
box("Proses data", 112, 162, 35, 15, colors.amber, colors.amberSoft);
arrow(147, 169.5, 157, 169.5);
box("Laporan / output", 157, 162, 39, 15);

sectionTitle("Contoh Mini: Use Case Sederhana", 14, 194);
stroke(colors.line);
doc.roundedRect(47, 204, 112, 50, 2, 2);
text("Sistem Berbasis Web", 82, 211, 9, "bold", colors.muted);
box("Kelola Data", 68, 219, 35, 10, colors.blue, [255, 255, 255]);
box("Cetak Laporan", 104, 235, 38, 10, colors.green, [255, 255, 255]);
text("Admin", 18, 230, 9.2, "bold", colors.ink);
doc.circle(31, 216, 4);
doc.line(31, 220, 31, 235);
doc.line(23, 226, 39, 226);
doc.line(31, 235, 24, 246);
doc.line(31, 235, 38, 246);
arrow(40, 226, 68, 224);
arrow(40, 230, 104, 240);
text("User", 174, 230, 9.2, "bold", colors.ink);
doc.circle(181, 216, 4);
doc.line(181, 220, 181, 235);
doc.line(173, 226, 189, 226);
doc.line(181, 235, 174, 246);
doc.line(181, 235, 188, 246);
arrow(173, 230, 142, 240);

// Footer
stroke(colors.line);
doc.line(14, 272, 196, 272);
text("Estimasi pengerjaan: 2-3 hari, menyesuaikan jumlah diagram dan kelengkapan data dari owner.", 14, 280, 9, "bold", colors.ink);
text("Catatan: contoh ini dapat disesuaikan dengan judul skripsi, aktor, fitur, dan format kampus.", 14, 287, 8.5, "normal", colors.muted);

doc.save("scratch/portofolio-flowchart-uml-skripsi.pdf");
