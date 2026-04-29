"use client";

import { useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type MediaType = "image" | "audio" | "video";

interface MediaUploaderProps {
  label: string;
  mediaType: MediaType;
  value: string | null | undefined;
  onChange: (url: string) => void;
  accept?: string;
}

const BUCKET = "media";

const ACCEPT_MAP: Record<MediaType, string> = {
  image: "image/*",
  audio: "audio/mp3,audio/ogg,audio/wav,audio/mpeg,audio/*",
  video: "video/mp4,video/webm,video/ogg,video/*",
};

const ICON_MAP: Record<MediaType, string> = {
  image: "🖼️",
  audio: "🔊",
  video: "🎬",
};

const MAX_BASE64_SIZE = 2 * 1024 * 1024; // 2MB for base64 fallback (images only)

export default function MediaUploader({ label, mediaType, value, onChange, accept }: MediaUploaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [mode, setMode] = useState<"upload" | "url">("upload");
  const [progress, setProgress] = useState(0);
  const [uploadSize, setUploadSize] = useState({ current: 0, total: 0 });
        onChange(cloudinaryUrl);
        setUploading(false);
        return;
      }

      // Fallback to Supabase (Limited size)
      if (file.size > 20 * 1024 * 1024) {
        alert("Video >20MB membutuhkan Cloudinary. Silakan atur Cloudinary di Settings.");
        setUploading(false);
        return;
      }

      const ext = file.name.split(".").pop();
      const path = `${mediaType}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage.from(BUCKET).upload(path, fileToUpload);

      if (!error && data) {
        const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
        onChange(urlData.publicUrl);
        return;
      }
      alert("Upload gagal.");
    } catch (e: any) {
      console.error(e);
      alert(`Gagal: ${e.message}`);
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };


      {/* Mode Toggle */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === "upload" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
        >
          ⬆️ Upload File
        </button>
        <button
          type="button"
          onClick={() => setMode("url")}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${mode === "url" ? "bg-white shadow-sm text-slate-900" : "text-slate-400"}`}
        >
          🔗 Paste URL
        </button>
      </div>

      {mode === "upload" ? (
        <div
          key="upload-container"
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <span className="text-3xl">{ICON_MAP[mediaType]}</span>
              <p className="text-xs font-bold text-slate-500">Klik untuk pilih file</p>
              <p className="text-[10px] text-slate-400">
                {mediaType === "image" ? "JPG, PNG, GIF, WebP" :
                 mediaType === "audio" ? "MP3, OGG, WAV" :
                 "MP4, WebM, OGG"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div key="url-container" className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            placeholder={`Paste URL ${mediaType === "image" ? "gambar" : mediaType === "audio" ? "audio (MP3)" : "video (MP4)"}...`}
            className="flex-1 px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none focus:border-indigo-400 transition-all"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="mt-3 relative">
          <button
            type="button"
            onClick={clearMedia}
            className="absolute -top-2 -right-2 z-10 h-6 w-6 bg-rose-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-rose-600 transition-all shadow-sm"
          >
            ✕
          </button>
          {mediaType === "image" && (
            <img
              src={value}
              alt="preview"
              className="w-full max-h-48 object-cover rounded-xl border border-slate-200"
            />
          )}
          {mediaType === "audio" && (
            <audio controls className="w-full" src={value}>
              Browser tidak mendukung audio.
            </audio>
          )}
          {mediaType === "video" && (
            <video
              controls
              className="w-full max-h-48 rounded-xl border border-slate-200"
              src={value}
            >
              Browser tidak mendukung video.
            </video>
          )}
        </div>
      )}
    </div>
  );
}
