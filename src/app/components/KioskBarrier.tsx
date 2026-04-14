"use client";

import { useEffect, useState, useRef } from "react";

export default function KioskBarrier({ children, title = "Mode Ujian (Kiosk)" }: { children: React.ReactNode, title?: string }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violation, setViolation] = useState(false);
  const isFullscreenRef = useRef(isFullscreen);

  useEffect(() => {
    isFullscreenRef.current = isFullscreen;
  }, [isFullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      } else {
        setIsFullscreen(true);
      }
    };

    // Prevent Context Menu (Right Click)
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const handleVisibilityC = () => {
       if (document.hidden && isFullscreenRef.current) setViolation(true);
    };
    const handleBlur = () => {
       if (isFullscreenRef.current) setViolation(true);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityC);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityC);
      window.removeEventListener("blur", handleBlur);
      
      // Auto-exit fullscreen and unlock keyboard when unmounting (e.g. going back to Dashboard)
      if (document.fullscreenElement) {
         document.exitFullscreen().catch(() => {});
      }
      if ('keyboard' in navigator && (navigator as any).keyboard && typeof (navigator as any).keyboard.unlock === 'function') {
         (navigator as any).keyboard.unlock();
      }
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      
      // Mengunci Tombol Keyboard Sistem (Alt-Tab, Windows Key, Esc) jika didukung Chrome
      if ('keyboard' in navigator && (navigator as any).keyboard && typeof (navigator as any).keyboard.lock === 'function') {
        try {
           await (navigator as any).keyboard.lock();
        } catch (e) {
           console.log("Keyboard lock not supported or permitted.");
        }
      }
      setIsFullscreen(true);
    } catch (err) {
      alert("Browser Anda memblokir mode Fullscreen. Mohon izinkan.");
    }
  };

  if (!isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="bg-white p-10 rounded-[3rem] max-w-lg shadow-2xl">
          <div className="text-6xl mb-6 flex justify-center items-center">
             <div className="relative">
                🛡️
                <span className="absolute -bottom-2 -right-2 text-3xl">🔒</span>
             </div>
          </div>
          <h2 className="text-3xl font-black italic text-slate-800 mb-4">{title}</h2>
          <p className="text-slate-500 font-medium mb-8">
            Anda akan masuk ke dalam **Mode Ujian Terkunci**. Sistem akan mengikat layar menjadi penuh secara permanen. Fungsi seperti klik kanan, Alt+Tab, tombol Windows, dan copy-paste akan dinonaktifkan.
          </p>
          <button 
            onClick={requestFullscreen}
            className="w-full py-5 bg-teal-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-teal-700 active:scale-95 transition-all shadow-xl shadow-teal-500/20"
          >
            KUNCI LAYAR & MULAI
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="select-none h-screen w-screen overflow-y-auto bg-slate-50">
        {children}
      </div>
      {violation && (
        <div className="fixed inset-0 z-[200] bg-rose-600 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
          <div className="text-9xl mb-6 animate-pulse">🛑</div>
          <h1 className="text-5xl md:text-7xl font-black italic text-white drop-shadow-lg mb-6">PELANGGARAN UJIAN!</h1>
          <p className="text-xl md:text-2xl font-bold text-rose-100 max-w-2xl mb-12 drop-shadow-md">
            Sistem mendeteksi Anda memindahkan layar (seperti menekan Ctrl+Alt+Del atau keluar tab). Ini dikategorikan sebagai tindakan KECURANGAN karena Anda berpaling dari Ujian.
          </p>
          <button 
            onClick={() => { requestFullscreen(); setViolation(false); }}
            className="px-12 py-6 bg-white text-rose-700 font-black text-xl uppercase tracking-widest rounded-full hover:bg-rose-50 hover:scale-105 active:scale-95 transition-all shadow-2xl"
          >
            SAYA MENGAKU SALAH, KEMBALI KE LOKASI UJIAN
          </button>
        </div>
      )}
    </>
  );
}
