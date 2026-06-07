"use client";

import { useRef, useState, useCallback } from "react";
import { directUpload } from "@/lib/upload";

type MediaType = "image" | "audio" | "video" | "document";

interface MediaUploaderProps {
  label: string;
  mediaType: MediaType;
  value: string | null | undefined;
  onChange: (url: string, size?: number, provider?: string) => void;
  accept?: string;
}

const ACCEPT_MAP: Record<MediaType, string> = {
  image: "image/*",
  audio: "audio/mp3,audio/ogg,audio/wav,audio/mpeg,audio/*",
  video: "video/mp4,video/webm,video/ogg,video/*",
  document: ".pdf,.ppt,.pptx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const ICON_MAP: Record<MediaType, string> = {
  image: "🖼️",
  audio: "🔊",
  video: "🎬",
  document: "📄",
};

// ── Compress image client-side (fast, aggressive) ──────────────────────────
async function compressImage(file: File, maxPx = 1600, quality = 0.82): Promise<File> {
  return new Promise((resolve) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => resolve(blob ? new File([blob], file.name, { type: "image/jpeg" }) : file),
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(blobUrl); resolve(file); };
    img.src = blobUrl;
  });
}

// ── Component ──────────────────────────────────────────────────────────────
export default function MediaUploader({ label, mediaType, value, onChange, accept }: MediaUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [pct, setPct] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [phase, setPhase] = useState<"compressing" | "uploading" | "processing" | "">("");
  const [storageDest, setStorageDest] = useState<"cloudinary" | "r2" | null>(null);

  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    if (fileRef.current) fileRef.current.value = "";

    // Tipe file validation
    if (mediaType === "video" && !file.type.startsWith("video/")) {
      alert("⚠️ File ditolak!\n\nHanya file video (seperti mp4, webm) yang diperbolehkan.");
      return;
    }
    if (mediaType === "audio" && !file.type.startsWith("audio/")) {
      alert("⚠️ File ditolak!\n\nHanya file audio (seperti mp3, wav) yang diperbolehkan.");
      return;
    }
    if (mediaType === "image" && !file.type.startsWith("image/")) {
      alert("⚠️ File ditolak!\n\nHanya file gambar (seperti jpg, png) yang diperbolehkan.");
      return;
    }
    if (mediaType === "document") {
      if (accept) {
        const allowed = accept.split(",").map(a => a.trim().toLowerCase());
        const fileName = file.name.toLowerCase();
        const fileType = file.type.toLowerCase();
        const matches = allowed.some(pattern => {
          if (pattern.startsWith(".")) {
            return fileName.endsWith(pattern);
          }
          if (pattern.includes("/*")) {
            const [main] = pattern.split("/");
            return fileType.startsWith(main + "/");
          }
          return fileType === pattern || fileType.includes(pattern);
        });
        if (!matches) {
          alert(`⚠️ File ditolak!\n\nHarap unggah file yang sesuai (${accept}).`);
          return;
        }
      } else {
        if (!(file.type === "application/pdf" || file.type.includes("powerpoint") || file.type.includes("presentation") || file.name.endsWith(".pdf") || file.name.endsWith(".ppt") || file.name.endsWith(".pptx"))) {
          alert("⚠️ File ditolak!\n\nHanya file dokumen (PDF, PPT) yang diperbolehkan.");
          return;
        }
      }
    }

    // Limits: Cloudinary free (image 10MB), Cloudflare R2 free (video/audio 5GB)
    const limitMB = mediaType === "image" ? 10 : (mediaType === "document" ? 100 : 5120);
    const limitBytes = limitMB * 1024 * 1024;
    if (file.size > limitBytes) {
      alert(`⚠️ File terlalu besar!\n\nBatas upload:\n• Gambar: maks 10 MB (Cloudinary)\n• Video: maks 5 GB (Cloudflare R2)\n• Audio: maks 5 GB (Cloudflare R2)\n• Dokumen: maks 100 MB\n\nFile Anda: ${(file.size / 1024 / 1024).toFixed(1)} MB`);
      return;
    }

    // Determine storage destination
    const isImage = file.type.startsWith("image/");
    const dest: "cloudinary" | "r2" = isImage ? "cloudinary" : "r2";
    setStorageDest(dest);

    setUploading(true);
    setPct(0);
    setUploadedBytes(0);
    setTotalBytes(file.size);
    setPhase("");

    try {
      // Compress image (skip if already small)
      if (mediaType === "image" && file.size > 300 * 1024) {
        setPhase("compressing");
        const compressed = await compressImage(file);
        if (compressed.size < file.size) {
          file = compressed;
          setTotalBytes(compressed.size);
        }
      }

      setPhase("uploading");

      const resultUrl = await directUpload(file, (p, loaded, total) => {
        setPct(p);
        setUploadedBytes(loaded);
        setTotalBytes(total);
      });

      setPct(100);
      
      // Fix: Report correct provider to onChange
      const finalProvider = file.type.startsWith("image/") ? "cloudinary" : "r2";
      onChange(resultUrl, file.size, finalProvider);

    } catch (err: any) {
      console.error("Upload error:", err);
      // More helpful error if it looks like CORS
      if (err.message.includes("Koneksi R2 terputus")) {
        alert(`❌ Koneksi ke Cloudflare R2 Gagal (CORS)\n\nPastikan domain ini sudah ditambahkan ke "CORS Policy" di Dashboard Cloudflare R2 Bucket Anda.`);
      } else {
        alert(`❌ ${err.message}`);
      }
    } finally {
      setUploading(false);
      setPhase("");
      setPct(0);
    }
  }, [mediaType, onChange]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {(["upload", "url"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                mode === m ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {m === "upload" ? "⬆️ Upload" : "🔗 URL"}
            </button>
          ))}
        </div>
      </div>

      {mode === "upload" ? (
        <>
          <div
            onClick={() => !uploading && fileRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center transition-all overflow-hidden ${
              uploading
                ? "h-28 border-indigo-300 bg-gradient-to-b from-indigo-50 to-white cursor-default"
                : "h-24 border-slate-200 hover:border-indigo-400 hover:bg-slate-50 cursor-pointer"
            }`}
          >
          {uploading ? (
            <div className="flex flex-col items-center gap-2.5 w-full px-6">
              {phase === "compressing" ? (
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">
                  ⚡ Mengompres gambar...
                </p>
              ) : phase === "processing" ? (
                <>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 transition-all duration-150"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between w-full text-[9px] font-black uppercase">
                    <span className="text-teal-600 animate-pulse">
                      ⚡ Menyimpan ke {storageDest === "r2" ? "Cloudflare R2" : "Cloudinary"}...
                    </span>
                    <span className="text-slate-400">{pct}%</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Animated progress bar */}
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 transition-all duration-200"
                      style={{ width: `${pct}%` }}
                    />
                    {/* Shimmer */}
                    <div
                      className="absolute inset-y-0 w-16 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse"
                      style={{ left: `${Math.max(0, pct - 10)}%` }}
                    />
                  </div>
                  {/* MB Progress + Storage Info */}
                  <div className="flex justify-between w-full text-[9px] font-black uppercase">
                    <span className="text-indigo-600">
                      {(uploadedBytes / 1024 / 1024).toFixed(1)} MB
                      {" / "}
                      {(totalBytes / 1024 / 1024).toFixed(1)} MB
                    </span>
                    <span className={storageDest === "r2" ? "text-orange-500" : "text-teal-500"}>
                      {pct}% · {storageDest === "r2" ? "☁️ R2" : "⚡ Cloudinary"}
                    </span>
                  </div>
                  {/* Storage destination info */}
                  <p className="text-[8px] font-bold uppercase tracking-wide w-full text-center mt-0.5">
                    {storageDest === "r2"
                      ? <span className="text-orange-400">Video/Audio → Cloudflare R2 (Asia-Pacific)</span>
                      : <span className="text-teal-400">Gambar → Cloudinary CDN (Auto-Optimize)</span>
                    }
                  </p>
                </>
              )}
              <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">
                Jangan tutup halaman ini
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">{ICON_MAP[mediaType]}</span>
              <div className="text-center">
                <p className="text-xs font-bold text-slate-700 uppercase">Klik untuk pilih {mediaType}</p>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  {mediaType === "image"
                    ? "Direct Cloudinary · Maks 10 MB"
                    : mediaType === "document"
                    ? "Direct Cloudflare R2 · Maks 100 MB"
                    : "Direct Cloudflare R2 · Maks 5 GB"}
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept={accept || ACCEPT_MAP[mediaType]}
            onChange={handleUpload}
          />
        </div>

        {storageDest === "r2" && !uploading && mediaType !== "image" && (
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-[9px] font-bold text-orange-700 uppercase tracking-wide">
            <span className="text-base leading-none">⚡</span>
            <span>
              File besar otomatis dialihkan ke{" "}
              <span className="text-orange-900">Cloudflare R2</span>{" "}
              (Super Cepat)
            </span>
          </div>
        )}

        {storageDest === "r2" && uploading && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-[9px] font-bold text-orange-700 uppercase tracking-wide animate-pulse">
            <span className="text-base leading-none">☁️</span>
            <span>Mengunggah ke Cloudflare R2 (Asia-Pacific)...</span>
          </div>
        )}
        </>
      ) : (
        <div className="relative group">
          <input
            type="text"
            placeholder={`Paste ${mediaType} URL...`}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={() => urlInput && onChange(urlInput)}
            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-xs font-bold text-slate-600 focus:outline-none focus:border-indigo-400 focus:bg-white transition-all pr-12"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-opacity">🔗</div>
        </div>
      )}

      {/* Preview */}
      {value && (() => {
        const fixedValue = value.replace(/^undefined\//, "https://pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev/");
        return (
          <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
            <div className="h-12 w-12 rounded-xl bg-white border border-emerald-100 flex items-center justify-center text-xl overflow-hidden shadow-sm shrink-0">
              {mediaType === "image" ? (
                <img src={fixedValue} className="h-full w-full object-cover" alt="preview" />
              ) : mediaType === "video" ? "🎬" : mediaType === "document" ? "📄" : "🔊"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">✓ Uploaded</p>
              <p className="text-[10px] font-bold text-slate-500 truncate mb-1">{fixedValue}</p>
              {mediaType === "audio" && (
                <audio controls className="w-full h-8 scale-90 origin-left" src={fixedValue} />
              )}
            </div>
            <button
              onClick={() => onChange(null as any)}
              className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all shrink-0"
            >✕</button>
          </div>
        );
      })()}
    </div>
  );
}
