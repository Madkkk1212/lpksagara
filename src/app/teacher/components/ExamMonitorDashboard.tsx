"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { Monitor, AlertTriangle, Shield, Volume2, VolumeX, Eye, UserX, RefreshCw, Radio } from "lucide-react";

interface ExamViolation {
  id: string;
  student_id: string;
  student_name: string;
  student_email: string;
  test_id: string;
  test_title: string;
  violation_type: string;
  violation_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  browser?: string;
  device?: string;
  user_agent?: string;
}

interface StudentStatus {
  student_email: string;
  student_name: string;
  test_title: string;
  total_violations: number;
  latest_violation_type: string;
  last_seen: string;
  is_active: boolean;
  violations: ExamViolation[];
  isAlerted: boolean; // red flash state
  browser?: string;
  device?: string;
  user_agent?: string;
}

const VIOLATION_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  tab_switch: { label: "Pindah Tab", emoji: "👁️", color: "rose" },
  screenshot: { label: "Screenshot", emoji: "📸", color: "orange" },
  blur: { label: "Keluar Fokus", emoji: "🔍", color: "amber" },
  page_hide: { label: "Sembunyikan Halaman", emoji: "🫣", color: "rose" },
  keyboard: { label: "Shortcut Berbahaya", emoji: "⌨️", color: "purple" },
  fullscreen_exit: { label: "Keluar Fullscreen", emoji: "📱", color: "rose" },
};

const getDeviceIcon = (device?: string) => {
  if (!device) return "❓";
  const d = device.toLowerCase();
  if (d.includes("iphone") || d.includes("android")) return "📱";
  if (d.includes("ipad")) return "📟";
  if (d.includes("windows") || d.includes("mac") || d.includes("linux")) return "💻";
  return "⚙️";
};

export default function ExamMonitorDashboard({ teacherEmail }: { teacherEmail: string }) {
  const [studentStatuses, setStudentStatuses] = useState<Record<string, StudentStatus>>({});
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [newAlert, setNewAlert] = useState(false);
  const [totalActive, setTotalActive] = useState(0);
  const [loading, setLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const newAlertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio
  useEffect(() => {
    // Background music
    const bgMusic = new Audio("/music/mbg-guru.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;
    audioRef.current = bgMusic;

    // We do NOT autoplay music on mount anymore.
    // It will only play when there's an active violation (newAlert).

    return () => {
      bgMusic.pause();
      bgMusic.src = "";
    };
  }, []);

  // Toggle music based on new violations
  useEffect(() => {
    if (!audioRef.current) return;
    if (musicEnabled && newAlert) {
      audioRef.current.currentTime = 0; // Restart from beginning
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [musicEnabled, newAlert]);

  // Load initial violations
  // Load initial violations
  const loadViolations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("exam_violations")
        .select("*")
        .eq("is_active", true)
        .order("updated_at", { ascending: false })
        .limit(200);

      if (error) throw error;

      // Group by student email
      const grouped: Record<string, StudentStatus> = {};
      (data || []).forEach((v: ExamViolation) => {
        if (!grouped[v.student_email]) {
          grouped[v.student_email] = {
            student_email: v.student_email,
            student_name: v.student_name,
            test_title: v.test_title,
            total_violations: 0,
            latest_violation_type: v.violation_type,
            last_seen: v.updated_at,
            is_active: v.is_active,
            violations: [],
            isAlerted: false,
            browser: v.browser,
            device: v.device,
            user_agent: v.user_agent,
          };
        }
        grouped[v.student_email].total_violations += v.violation_count;
        if (v.violation_type !== "none") {
          grouped[v.student_email].violations.push(v);
        }
        if (new Date(v.updated_at) > new Date(grouped[v.student_email].last_seen)) {
          grouped[v.student_email].last_seen = v.updated_at;
          if (v.violation_type !== "none" || grouped[v.student_email].latest_violation_type === "none") {
            grouped[v.student_email].latest_violation_type = v.violation_type;
          }
        }
      });

      setStudentStatuses(grouped);
      setTotalActive(Object.values(grouped).filter(s => s.is_active).length);
      setLoading(false);
    } catch (err) {
      console.error("Failed to load violations:", err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("realtime-exam-violations")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "exam_violations",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const v = payload.new as ExamViolation;
            const isRealViolation = v.violation_type !== "none";

            // Trigger alert ONLY IF it is an active real violation
            if (isRealViolation && v.is_active) {
              setNewAlert(true);
              if (newAlertTimeoutRef.current) clearTimeout(newAlertTimeoutRef.current);
              newAlertTimeoutRef.current = setTimeout(() => setNewAlert(false), 8000);
            }

            // Mark student as alerted (red flash)
            setStudentStatuses((prev) => {
              const existing = prev[v.student_email] || {
                student_email: v.student_email,
                student_name: v.student_name,
                test_title: v.test_title,
                total_violations: 0,
                latest_violation_type: v.violation_type,
                last_seen: v.updated_at,
                is_active: v.is_active,
                violations: [],
                isAlerted: false,
                browser: v.browser,
                device: v.device,
                user_agent: v.user_agent,
              };

              const filteredViolations = existing.violations.filter((ev) => ev.id !== v.id);
              const newViolations = isRealViolation ? [...filteredViolations, v] : filteredViolations;
              
              // Recalculate total_violations from all real violations in history
              const total_violations = newViolations.reduce((sum, ev) => sum + ev.violation_count, 0);

              const updated = {
                ...existing,
                total_violations,
                latest_violation_type: isRealViolation ? v.violation_type : existing.latest_violation_type,
                last_seen: v.updated_at,
                is_active: v.is_active,
                isAlerted: isRealViolation && v.is_active,
                violations: newViolations,
                browser: v.browser || existing.browser,
                device: v.device || existing.device,
                user_agent: v.user_agent || existing.user_agent,
              };

              // Auto-clear red flash after 3 seconds
              if (isRealViolation && v.is_active) {
                setTimeout(() => {
                  setStudentStatuses((prev2) => {
                    if (!prev2[v.student_email]) return prev2;
                    return {
                      ...prev2,
                      [v.student_email]: { ...prev2[v.student_email], isAlerted: false }
                    };
                  });
                }, 3000);
              }

              return { ...prev, [v.student_email]: updated };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatTimeSince = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}d lalu`;
    if (sec < 3600) return `${Math.floor(sec / 60)}m lalu`;
    return `${Math.floor(sec / 3600)}j lalu`;
  };

  const allStudents = Object.values(studentStatuses).filter((s) => s.is_active);
  const alertedStudents = allStudents.filter((s) => s.total_violations > 0);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-rose-500 rounded-full animate-spin" />
        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
          Menghubungkan ke ruang ujian...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* ── HEADER CONTROL BAR ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-3 h-3 rounded-full ${newAlert ? "bg-rose-500 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
            <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tight">
              Monitor Ujian Live
            </h2>
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
              newAlert ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse" : "bg-emerald-50 border-emerald-200 text-emerald-700"
            }`}>
              {newAlert ? "⚠️ PELANGGARAN BARU!" : "● LIVE"}
            </span>
          </div>
          <p className="text-sm text-slate-400 font-medium">
            {allStudents.length} siswa aktif ujian · {alertedStudents.length} pelanggaran terdeteksi
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMusicEnabled((v) => !v)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all ${
              musicEnabled
                ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200"
                : "bg-white text-slate-400 border-slate-200 hover:border-indigo-300"
            }`}
          >
            {musicEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {musicEnabled ? "Musik ON" : "Musik OFF"}
          </button>
          <button
            onClick={loadViolations}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest border border-slate-200 bg-white hover:bg-slate-50 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── STATS ROW ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Siswa Aktif", value: allStudents.length, icon: "👥", color: "indigo" },
          { label: "Pelanggaran", value: alertedStudents.length, icon: "⚠️", color: "rose" },
          { label: "Total Insiden", value: allStudents.reduce((s, v) => s + v.total_violations, 0), icon: "🚨", color: "orange" },
          { label: "Aman", value: allStudents.filter((s) => s.total_violations === 0).length, icon: "✅", color: "emerald" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm"
          >
            <div className="text-2xl mb-2">{stat.icon}</div>
            <p className="text-3xl font-black text-slate-800 mb-1">{stat.value}</p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── NEW VIOLATION ALERT BANNER ── */}
      <AnimatePresence>
        {newAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="flex items-center gap-4 p-5 bg-rose-600 rounded-[2rem] text-white shadow-2xl shadow-rose-500/30"
          >
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-bounce shrink-0">
              🚨
            </div>
            <div>
              <p className="font-black text-lg uppercase tracking-tight">Pelanggaran Terdeteksi!</p>
              <p className="text-rose-100 text-sm font-medium">
                Ada siswa yang terdeteksi melakukan kecurangan. Lihat kartu merah di bawah.
              </p>
            </div>
            <div className="ml-auto shrink-0">
              <AlertTriangle className="w-8 h-8 text-rose-200 animate-pulse" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STUDENT CARDS GRID ── */}
      {allStudents.length === 0 ? (
        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
          <div className="text-6xl mb-4">🖥️</div>
          <h3 className="text-xl font-black text-slate-400 uppercase italic tracking-tight">
            Belum Ada Siswa Aktif
          </h3>
          <p className="text-sm text-slate-300 mt-2">
            Kartu siswa akan muncul otomatis saat mereka memulai ujian.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {allStudents
              .sort((a, b) => b.total_violations - a.total_violations)
              .map((student) => {
                const isViolator = student.total_violations > 0;
                const isFlashing = student.isAlerted;

                return (
                  <motion.div
                    key={student.student_email}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative rounded-[2.5rem] border-2 p-6 transition-all duration-300 overflow-hidden ${
                      isFlashing
                        ? "border-rose-500 bg-rose-50 shadow-2xl shadow-rose-500/30 animate-[pulse_0.5s_ease-in-out_infinite]"
                        : isViolator
                        ? "border-rose-200 bg-white shadow-lg shadow-rose-100"
                        : "border-slate-100 bg-white shadow-sm"
                    }`}
                  >
                    {/* Red flash overlay */}
                    {isFlashing && (
                      <div className="absolute inset-0 bg-rose-500/10 pointer-events-none rounded-[2.5rem] animate-pulse" />
                    )}

                    {/* Status indicator top-right */}
                    <div className="absolute top-5 right-5">
                      <div
                        className={`w-4 h-4 rounded-full ${
                          isFlashing
                            ? "bg-rose-500 animate-ping"
                            : isViolator
                            ? "bg-orange-400 animate-pulse"
                            : "bg-emerald-400 animate-pulse"
                        }`}
                      />
                    </div>

                    {/* Student info */}
                    <div className="flex items-center gap-4 mb-5">
                      <div
                        className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-xl font-black text-white shadow-lg ${
                          isFlashing
                            ? "bg-rose-500 animate-pulse"
                            : isViolator
                            ? "bg-orange-500"
                            : "bg-slate-800"
                        }`}
                      >
                        {student.student_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-black text-sm uppercase tracking-tight truncate ${isFlashing ? "text-rose-700" : "text-slate-800"}`}>
                          {student.student_name || student.student_email}
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold truncate">
                          {student.test_title || "Ujian Aktif"}
                        </p>
                        <p className="text-[10px] text-slate-300 font-bold">
                          Update: {formatTimeSince(student.last_seen)}
                        </p>
                        {(student.device || student.browser) && (
                          <div className="mt-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              <span>{getDeviceIcon(student.device)}</span>
                              <span>{student.device || "Perangkat"} · {student.browser || "Browser"}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Violation count badge */}
                    {isViolator && (
                      <div
                        className={`flex items-center gap-3 p-4 rounded-2xl mb-4 ${
                          isFlashing ? "bg-rose-100 border border-rose-200" : "bg-orange-50 border border-orange-100"
                        }`}
                      >
                        <span className="text-2xl">
                          {VIOLATION_LABELS[student.latest_violation_type]?.emoji || "⚠️"}
                        </span>
                        <div>
                          <p className={`text-xs font-black uppercase tracking-widest ${isFlashing ? "text-rose-700" : "text-orange-700"}`}>
                            {student.total_violations}x Pelanggaran
                          </p>
                          <p className={`text-[10px] font-bold ${isFlashing ? "text-rose-500" : "text-orange-500"}`}>
                            Terakhir: {VIOLATION_LABELS[student.latest_violation_type]?.label || student.latest_violation_type}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Violation history */}
                    {student.violations.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Riwayat</p>
                        {student.violations
                          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                          .slice(0, 3)
                          .map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-[10px] p-2 rounded-xl bg-slate-50">
                              <span className="font-bold text-slate-600">
                                {VIOLATION_LABELS[v.violation_type]?.emoji} {VIOLATION_LABELS[v.violation_type]?.label || v.violation_type}
                              </span>
                              <span className="text-slate-400">{formatTime(v.updated_at)}</span>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* Safe indicator */}
                    {!isViolator && (
                      <div className="flex items-center gap-2 p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                        <Shield className="w-4 h-4 text-emerald-500" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Tidak ada pelanggaran</p>
                      </div>
                    )}
                  </motion.div>
                );
              })}
          </AnimatePresence>
        </div>
      )}

      {/* ── FOOTER INFO ── */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-[2rem] p-5 flex items-start gap-4">
        <Radio className="w-5 h-5 text-indigo-500 mt-0.5 animate-pulse shrink-0" />
        <div>
          <p className="text-sm font-black text-indigo-900 mb-1">Monitoring Realtime Aktif</p>
          <p className="text-xs text-indigo-600 font-medium leading-relaxed">
            Sistem mendeteksi pindah tab, screenshot, blur fokus, dan keluar fullscreen secara otomatis.
            Kartu siswa akan berkedip merah saat pelanggaran terjadi. Musik latar aktif sebagai penanda suasana pengawasan.
          </p>
        </div>
      </div>
    </div>
  );
}
