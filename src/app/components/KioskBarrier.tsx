"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

interface KioskBarrierProps {
  children: React.ReactNode;
  title?: string;
  userName?: string;
  userEmail?: string;
  studentId?: string;
  testId?: string;
  testTitle?: string;
  onViolationForceExit?: () => void;
}

export default function KioskBarrier({ children, title = "Mode Ujian (Kiosk)", userName, userEmail, studentId, testId, testTitle, onViolationForceExit }: KioskBarrierProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [violation, setViolation] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [violationCooldown, setViolationCooldown] = useState(0);
  const [screenshotWarning, setScreenshotWarning] = useState(false);
  const [isScreenHidden, setIsScreenHidden] = useState(false);
  const isLockedRef = useRef(false);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);
  const screenshotRef = useRef<NodeJS.Timeout | null>(null);
  const violationRecordIdRef = useRef<Record<string, string>>({});
  const violationCounterRef = useRef<Record<string, number>>({});

  // Sync ref with state
  useEffect(() => {
    isLockedRef.current = isLocked;
  }, [isLocked]);

  // Trigger screenshot warning briefly
  const triggerScreenshotWarning = useCallback(() => {
    setScreenshotWarning(true);
    if (screenshotRef.current) clearTimeout(screenshotRef.current);
    screenshotRef.current = setTimeout(() => setScreenshotWarning(false), 2500);
    // Report to Supabase
    reportViolation("screenshot");
  }, []);

  // Report violation to Supabase
  const reportViolation = useCallback(async (type: string) => {
    if (!userEmail) return;
    try {
      const key = type;
      const count = type === "none" ? 0 : (violationCounterRef.current[key] || 0) + 1;
      if (type !== "none") {
        violationCounterRef.current[key] = count;
      }
      const existingId = violationRecordIdRef.current[key];

      if (existingId) {
        // Update existing record
        const { error } = await supabase
          .from("exam_violations")
          .update({ violation_count: count, is_active: true, updated_at: new Date().toISOString() })
          .eq("id", existingId);
        if (error) {
          console.error("Failed to update violation in Supabase:", error);
        }
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from("exam_violations")
          .insert({
            student_id: studentId || userEmail || "unknown",
            student_email: userEmail,
            student_name: userName || userEmail,
            test_id: testId || null,
            test_title: testTitle || title,
            violation_type: type,
            violation_count: count,
            is_active: true,
          })
          .select("id")
          .single();
        
        if (error) {
          console.error("Failed to insert violation in Supabase:", error);
        }
        if (data?.id) violationRecordIdRef.current[key] = data.id;
      }
    } catch (err) {
      console.error("Failed to report violation:", err);
    }
  }, [userEmail, userName, studentId, testId, testTitle, title]);

  // Register the student as active immediately upon locking the screen
  useEffect(() => {
    if (isLocked) {
      reportViolation("none");
    }
  }, [isLocked, reportViolation]);

  // Clean up student status to inactive when they leave/refresh/close the tab
  useEffect(() => {
    const handleUnload = () => {
      if (isLockedRef.current && userEmail && testId) {
        supabase
          .from("exam_violations")
          .update({ is_active: false })
          .eq("student_email", userEmail)
          .eq("test_id", testId)
          .then(() => {});
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      handleUnload();
    };
  }, [userEmail, testId]);

  // Trigger violation
  const triggerViolation = useCallback((type: string = "tab_switch") => {
    if (!isLockedRef.current) return;
    setViolation(true);
    setViolationCount(prev => prev + 1);
    setViolationCooldown(10);
    reportViolation(type);
  }, [reportViolation]);

  // Countdown for violation cooldown
  useEffect(() => {
    if (violationCooldown <= 0) return;
    const t = setInterval(() => {
      setViolationCooldown(prev => {
        if (prev <= 1) { clearInterval(t); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [violationCooldown]);

  useEffect(() => {
    if (!isLocked) return;

    // ─── FULLSCREEN ───────────────────────────────────────────────
    const handleFullscreenChange = () => {
      const isFs = !!(document.fullscreenElement
        || (document as any).webkitFullscreenElement
        || (document as any).mozFullScreenElement
        || (document as any).msFullscreenElement);
      if (!isFs && (document as any).fullscreenEnabled) {
        triggerViolation("fullscreen_exit");
      }
    };

    // ─── TAB / APP SWITCHING ──────────────────────────────────────
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsScreenHidden(true);
        triggerViolation("tab_switch");
      }
    };
    const handleBlur = () => {
      setIsScreenHidden(true);
      triggerViolation("blur");
    };
    const handlePageHide = () => {
      setIsScreenHidden(true);
      triggerViolation("page_hide");
    };

    // ─── SCREENSHOT DETECTION (best effort) ──────────────────────
    // Detects PrintScreen key & OS Screenshot hotkeys
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key?.toLowerCase();

      // Block PrintScreen & OS Screenshot Combos
      const isScreenshotCombo = 
        e.key === "PrintScreen" || 
        key === "printscreen" ||
        (e.metaKey && e.shiftKey && key === "s") || // Win + Shift + S
        (e.metaKey && e.shiftKey && (key === "3" || key === "4" || key === "5")); // Mac Cmd + Shift + 3/4/5

      if (isScreenshotCombo) {
        e.preventDefault();
        e.stopPropagation();
        setIsScreenHidden(true);
        triggerScreenshotWarning();
        return;
      }

      // Block dangerous combos
      const blocked = [
        e.ctrlKey && (key === "c" || key === "v" || key === "a" || key === "x" || key === "p" || key === "s" || key === "u"),
        e.metaKey && (key === "c" || key === "v" || key === "a" || key === "x" || key === "p" || key === "s"),
        e.ctrlKey && e.shiftKey && (key === "i" || key === "j" || key === "c"),
        key === "f12",
        e.altKey && key === "tab",
        e.altKey && key === "f4",
      ];

      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // ─── CONTEXT MENU ─────────────────────────────────────────────
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // ─── MEDIA CAPTURE API (Chrome/Android) ───────────────────────
    // Detect when screen capture session starts
    const handleDisplayMediaStart = () => triggerScreenshotWarning();

    // Register listeners
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown, { capture: true });
    window.addEventListener("blur", handleBlur);
    window.addEventListener("pagehide", handlePageHide);

    // CSS-level text/image protection
    document.body.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    (document.body.style as any).msUserSelect = "none";

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("pagehide", handlePageHide);

      // Restore
      document.body.style.userSelect = "";
      document.body.style.webkitUserSelect = "";
      (document.body.style as any).msUserSelect = "";

      // Exit fullscreen
      try {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else if ((document as any).webkitFullscreenElement) (document as any).webkitExitFullscreen();
      } catch (_) {}

      // Unlock keyboard
      try {
        if ((navigator as any).keyboard?.unlock) (navigator as any).keyboard.unlock();
      } catch (_) {}
    };
  }, [isLocked, triggerViolation, triggerScreenshotWarning]);

  // ─── REQUEST LOCK ─────────────────────────────────────────────────
  const requestLock = async () => {
    // Try fullscreen (works on Android Chrome, Desktop)
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) await (el as any).webkitRequestFullscreen();
      else if ((el as any).mozRequestFullScreen) await (el as any).mozRequestFullScreen();
    } catch (_) {
      // iOS Safari doesn't support fullscreen - still allow kiosk mode via CSS
    }

    // Try keyboard lock (Chrome desktop only)
    try {
      if ((navigator as any).keyboard?.lock) {
        await (navigator as any).keyboard.lock();
      }
    } catch (_) {}

    setIsLocked(true);
  };

  const dismissViolation = () => {
    if (violationCooldown > 0) return;
    setViolation(false);
    setIsScreenHidden(false);
    // Re-request fullscreen after violation
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    } catch (_) {}
  };

  // ─── PRE-LOCK SCREEN ──────────────────────────────────────────────
  if (!isLocked) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-6 text-center">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] max-w-md w-full shadow-2xl">
          {/* Icon */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="w-28 h-28 bg-gradient-to-br from-rose-500 to-rose-700 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-rose-500/30">
              <span className="text-5xl">🛡️</span>
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-xl">🔒</span>
            </div>
          </div>

          <h2 className="text-2xl font-black italic text-white mb-2 tracking-tight">{title}</h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400 mb-8">Mode Ujian Ketat</p>

          {/* Rules */}
          <div className="space-y-3 mb-8 text-left">
            {[
              { icon: "📵", text: "Layar dikunci penuh — tidak bisa keluar" },
              { icon: "🚫", text: "Screenshot & screen recording diblokir" },
              { icon: "⌨️", text: "Shortcut keyboard berbahaya dinonaktifkan" },
              { icon: "👁️", text: "Pindah tab = pelanggaran terdeteksi" },
              { icon: "🖱️", text: "Klik kanan & copy-paste dinonaktifkan" },
            ].map((rule, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 rounded-2xl px-4 py-3">
                <span className="text-lg shrink-0">{rule.icon}</span>
                <p className="text-xs font-bold text-slate-300">{rule.text}</p>
              </div>
            ))}
          </div>

          <button
            onClick={requestLock}
            className="w-full py-5 bg-gradient-to-r from-rose-600 to-rose-500 text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:from-rose-500 hover:to-rose-400 active:scale-95 transition-all shadow-2xl shadow-rose-500/30"
          >
            ⚡ KUNCI LAYAR & MULAI UJIAN
          </button>
          <p className="text-[9px] text-slate-600 mt-4 font-bold uppercase tracking-widest">
            Dengan memulai, kamu setuju mengikuti aturan integritas ujian
          </p>
        </div>
      </div>
    );
  }

  // ─── ACTIVE KIOSK MODE ────────────────────────────────────────────
  return (
    <>
      {/* Anti-screenshot CSS overlay - makes screenshot appear black in some systems */}
      <style>{`
        @media print {
          * { display: none !important; }
          body::after { 
            content: "DOKUMEN INI DILINDUNGI" !important;
            display: block !important;
          }
        }
        /* Prevent selection & drag */
        .kiosk-active * {
          -webkit-user-select: none !important;
          user-select: none !important;
          -webkit-touch-callout: none !important;
        }
        .kiosk-active img, .kiosk-active video, .kiosk-active audio {
          pointer-events: none !important;
        }
      `}</style>

      <div 
        className="kiosk-active h-screen w-screen overflow-hidden bg-slate-50 flex flex-col relative transition-all duration-75"
        style={isScreenHidden ? { filter: 'blur(60px)', opacity: 0.01, transform: 'scale(0.95)' } : undefined}
      >
        {children}

        {/* Watermark overlay - traced if screenshot is taken */}
        {userName && (
          <div
            className="fixed inset-0 pointer-events-none z-[50] overflow-hidden select-none"
            aria-hidden="true"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="absolute text-slate-900/[0.035] font-black text-xs uppercase tracking-widest whitespace-nowrap"
                style={{
                  top: `${(i % 5) * 22 + 5}%`,
                  left: `${Math.floor(i / 5) * 28 - 10}%`,
                  transform: 'rotate(-30deg)',
                }}
              >
                {userName} • LPKSAGARA • {new Date().toLocaleDateString('id-ID')}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Screenshot Warning Overlay */}
      {screenshotWarning && (
        <div className="fixed inset-0 z-[300] bg-black flex items-center justify-center pointer-events-none select-none">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-bounce">📵</div>
            <p className="text-white font-black text-2xl uppercase tracking-widest">Screenshot Diblokir!</p>
            <p className="text-rose-400 font-bold mt-2 text-sm uppercase tracking-widest">Tindakan ini tercatat</p>
          </div>
        </div>
      )}

      {/* VIOLATION OVERLAY */}
      {violation && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center p-6 text-center select-none"
          style={{ background: 'linear-gradient(135deg, #be123c 0%, #9f1239 50%, #881337 100%)' }}
        >
          {/* Animated warning pattern */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i}
                className="absolute border-2 border-white/5 rounded-full animate-ping"
                style={{
                  width: `${(i + 1) * 120}px`,
                  height: `${(i + 1) * 120}px`,
                  top: '50%', left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${i * 0.15}s`,
                  animationDuration: '2s'
                }}
              />
            ))}
          </div>

          <div className="relative z-10 max-w-md">
            <div className="text-8xl mb-4 drop-shadow-2xl">🚨</div>
            <h1 className="text-4xl md:text-5xl font-black italic text-white drop-shadow-lg mb-4 leading-tight">
              PELANGGARAN<br />TERDETEKSI!
            </h1>
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-8">
              <p className="text-white/90 font-bold leading-relaxed text-sm mb-3">
                Sistem mendeteksi Anda <span className="text-amber-300 font-black">meninggalkan layar ujian</span>. Tindakan ini dikategorikan sebagai <span className="text-amber-300 font-black">indikasi kecurangan</span> dan akan dilaporkan.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-white font-black text-sm">⚠️</span>
                </div>
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                  Total pelanggaran: <span className="text-amber-300">{violationCount}x</span>
                </p>
              </div>
            </div>

            <button
              onClick={dismissViolation}
              disabled={violationCooldown > 0}
              className={`w-full py-5 rounded-3xl font-black text-sm uppercase tracking-widest transition-all shadow-2xl ${
                violationCooldown > 0
                  ? 'bg-white/20 text-white/50 cursor-not-allowed border-2 border-white/10'
                  : 'bg-white text-rose-700 hover:bg-rose-50 hover:scale-105 active:scale-95 shadow-white/20'
              }`}
            >
              {violationCooldown > 0
                ? `⏳ Tunggu ${violationCooldown} detik...`
                : '✅ Saya Mengerti, Kembali ke Ujian'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
