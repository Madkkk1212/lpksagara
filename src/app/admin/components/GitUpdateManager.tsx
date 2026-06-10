"use client";

import { useState } from "react";

export default function GitUpdateManager() {
  const [version] = useState("v2.1.1 - Paling Baru");

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-[2rem] p-8 gap-4 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <span className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400 border border-indigo-500/30">🚀</span>
            <span className="px-3 py-1 bg-teal-500/20 text-teal-300 rounded-full text-[10px] font-black tracking-widest uppercase">System Update</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight">Git Update Log</h2>
          <p className="text-xs font-medium text-slate-400 mt-1">
            Pantau versi rilis terbaru dan catatan pembaruan sistem yang telah di-push.
          </p>
        </div>
        <div className="relative z-10 px-4 py-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-right">
          <p className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">Active Build</p>
          <p className="text-sm font-black tracking-wider text-white mt-0.5">{version}</p>
        </div>
      </div>

      {/* ── LATEST RELEASE: v2.1.1 ── */}
      <div className="bg-white rounded-3xl p-8 border-2 border-indigo-100 shadow-xl shadow-indigo-50/50 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              ⚡
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">v2.1.1 — CBT Monitoring Sync & Anti-Screenshot Blur</h3>
              <p className="text-xs font-bold text-slate-400">Dipublikasikan pada: 9 Juni 2026</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-black border border-indigo-100">
            Latest 🔥
          </span>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider text-indigo-600">📌 Ringkasan Pembaruan:</h4>
            <p className="text-slate-700">
              Sinkronisasi realtime data monitoring ujian antara siswa dan guru, penambahan efek sensor blur & fade-out layar instan saat screenshot/kehilangan fokus, pembersihan otomatis siswa keluar, serta perbaikan RLS database untuk akses masuk data anonim.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Registrasi Sesi Siswa Otomatis</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Siswa kini otomatis terdaftar di layar pantau guru dengan status "Aman" (0 pelanggaran) sesaat setelah menekan tombol mulai kuis/ujian.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Efek Sensor Blur & Fade Layar Instan</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Ketika tombol screenshot (Win+Shift+S / Mac shortcuts) ditekan atau browser blur, seluruh layar ujian langsung kabur (60px) & transparan (opacity 0.01) dalam milidetik sehingga tangkapan layar menjadi kosong/tidak terbaca.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Auto-Cleanup Siswa Keluar</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Siswa yang menyelesaikan kuis atau menutup tab browser akan otomatis dihapus dari daftar monitoring aktif guru secara realtime.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Perbaikan RLS & Database Constraints</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Memperbaiki database constraint RLS untuk akses masuk data anonim dan memetakan student_id dengan benar agar data sinkron tanpa error 23502.</p>
              </div>
            </div>

          </div>

          {/* SQL Migrations callout */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">⚠️</span>
            <div>
              <p className="font-black text-xs text-amber-800 mb-1">Wajib Dijalankan di Supabase SQL Editor:</p>
              <ul className="text-[11px] text-amber-700 space-y-1 list-disc ml-4">
                <li><code className="bg-amber-100 px-1 rounded font-mono">051_fix_exam_violations_rls.sql</code> — Memperbaiki hak akses publik anonim & null constraint student_id.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── PREVIOUS RELEASE: v2.1.0 ── */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">
              🛡️
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">v2.1.0 — CBT Security & Real-time Monitor</h3>
              <p className="text-xs font-bold text-slate-400">Dipublikasikan pada: 7 Juni 2026</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100">
            Stable Release
          </span>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider text-indigo-600">📌 Ringkasan Pembaruan:</h4>
            <p className="text-slate-700">
              Peningkatan besar-besaran pada sistem keamanan ujian CBT, penambahan fitur monitoring ujian real-time untuk guru, perbaikan popup level terkunci dengan desain glassmorphism, watermark nama siswa otomatis, serta penguatan akun monitoring super tersembunyi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Popup Level Terkunci (Glassmorphism)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Alert bawaan browser diganti modal premium di halaman utama & halaman belajar. Ikon gembok animasi, tidak mengarah ke WhatsApp lagi.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">KioskBarrier Anti-Cheat — Total Overhaul</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Fullscreen cross-device (iOS/Android), blokir PrintScreen + flash hitam, Ctrl+C/V/P/S diblokir, deteksi tab switch & blur, countdown 10 detik saat pelanggaran.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Watermark Dinamis Nama Siswa</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Nama siswa + tanggal ujian muncul diagonal di seluruh layar saat ujian berlangsung. Screenshot bisa ditelusuri ke pelakunya.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Monitor Ujian Real-time (Tab Guru)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tab baru "Monitor Ujian" di dashboard guru. Kartu siswa berkedip merah saat pelanggaran. Musik latar otomatis aktif (mbg-guru.mp3). Data via Supabase Realtime.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Tabel exam_violations (Database Baru)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Mencatat semua insiden: tab_switch, screenshot, blur, fullscreen_exit, page_hide. Realtime subscription aktif untuk update instan ke guru.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Laporan Pelanggaran Langsung ke Supabase</p>
                <p className="text-[11px] text-slate-500 mt-0.5">KioskBarrier kini langsung INSERT/UPDATE ke tabel exam_violations saat terjadi pelanggaran, lengkap dengan jenis, jumlah, dan identitas siswa.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Akun Monitoring Super (guru.super & siswa.super)</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Dua akun khusus pengawasan yang hanya terlihat Super Admin. guru.super otomatis terhubung ke siswa.super untuk simulasi dan testing monitoring.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Filter Akun Tersembunyi Diperkuat</p>
                <p className="text-[11px] text-slate-500 mt-0.5">UserManager, TeacherAssignmentManager, AllStudentsAssessment — semua kini menyembunyikan 4 akun monitoring dari admin biasa.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Anti-Cheat Tambahan di ModernQuizPlayer</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Mode ujian: blokir drag & drop konten soal, blokir klik kanan, flash hitam saat PrintScreen. Berlapis dengan KioskBarrier.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg shrink-0">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Fix framer-motion di MateriView</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Import AnimatePresence & motion ditambahkan di MateriView.tsx untuk mendukung animasi popup level terkunci yang baru.</p>
              </div>
            </div>

          </div>

          {/* SQL Migrations callout */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-3">
            <span className="text-amber-500 text-lg shrink-0">⚠️</span>
            <div>
              <p className="font-black text-xs text-amber-800 mb-1">Wajib Dijalankan di Supabase SQL Editor:</p>
              <ul className="text-[11px] text-amber-700 space-y-1 list-disc ml-4">
                <li><code className="bg-amber-100 px-1 rounded font-mono">049_exam_violations.sql</code> — Tabel pelanggaran + realtime subscription</li>
                <li><code className="bg-amber-100 px-1 rounded font-mono">050_assign_super_monitoring_accounts.sql</code> — Akun guru.super & siswa.super + assignment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* ── PREVIOUS RELEASE: v2.0.1 ── */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-100/50 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 text-2xl font-bold shadow-inner">
              ✨
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">v2.0.1 — Media & CBT Stability</h3>
              <p className="text-xs font-bold text-slate-400">Dipublikasikan pada: Mei 2026</p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-black border border-emerald-100">
            Stable Release
          </span>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
            <h4 className="font-black text-slate-800 text-xs uppercase tracking-wider text-indigo-600">📌 Keterangan Rilis &amp; Catatan Pembaruan:</h4>
            <p className="text-slate-700">
              Pembaruan arsitektur sistem penyimpanan media, stabilisasi pemutar audio CBT, serta penambahan pemindai rekursif (Deep Recursive Media Scanner). Seluruh berkas kuis, latihan mendengarkan (Choukai), dan kosakata (Moji-Goi) telah tersinkronisasi 100% dengan Cloudflare R2.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">CBT Audio &amp; Video Resolved</p>
                <p className="text-[11px] text-slate-500 mt-0.5">MIME type dan pemisahan file audio/video terlindungi ketat.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-start gap-3">
              <span className="text-emerald-500 text-lg">✅</span>
              <div>
                <p className="font-black text-xs text-slate-800">Super Admin Override</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Akses pengumuman dan catatan rilis selalu tersedia di sidebar.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
