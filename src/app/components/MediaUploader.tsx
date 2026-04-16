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

  const compressImage = (file: File): Promise<Blob | File> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          let width = img.width;
          let height = img.height;
          const MAX_SIZE = 1200;

          if (width > height) {
            if (width > MAX_SIZE) {
              height *= MAX_SIZE / width;
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width *= MAX_SIZE / height;
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) resolve(blob);
              else resolve(file);
            },
            "image/jpeg",
            0.8
          );
        };
      };
    });
  };

  const uploadToCloudinary = async (file: File | Blob, cloudName: string, preset: string): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", preset);
    
    // Automatic image/video optimization tags can be added here
    const resourceType = mediaType === "image" ? "image" : mediaType === "video" ? "video" : "auto";
    
    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
      method: "POST",
      body: formData,
    });
    
    if (!res.ok) throw new Error("Cloudinary upload failed");
    const data = await res.json();
    return data.secure_url;
  };

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      // Use environment variables for Cloudinary
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      let fileToUpload: File | Blob = file;

      // 1. Cloudinary Flow (If Configured)
      if (cloudName && preset) {
        // Automatic Image Compression before Cloudinary if it's an image
        if (mediaType === "image") {
          fileToUpload = await compressImage(file);
        }
        
        const cloudinaryUrl = await uploadToCloudinary(fileToUpload, cloudName, preset);
        onChange(cloudinaryUrl);
        setUploading(false);
        return;
      }

      // 2. Fallback to Supabase Flow (Original Logic)
      // Compression logic for images local fallback
      if (mediaType === "image") {
        fileToUpload = await compressImage(file);
      }
      
      // Size validation for video/audio (20MB limit for Supabase to prevent lag)
      if (mediaType === "video" && file.size > 20 * 1024 * 1024) {
        alert("Video terlalu besar (>20MB)! Gunakan Cloudinary di Settings agar file besar bisa dikompres otomatis.");
        setUploading(false);
        return;
      }

      const ext = mediaType === "image" ? "jpg" : file.name.split(".").pop();
      const path = `${mediaType}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(path, fileToUpload, { 
          upsert: false, 
          contentType: mediaType === "image" ? "image/jpeg" : file.type 
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(data.path);
        onChange(urlData.publicUrl);
        return;
      }

      alert("Upload gagal. Pastikan bucket 'media' sudah ada di Supabase atau atur Cloudinary di Settings.");
    } catch (e) {
      console.error(e);
      alert("Gagal mengunggah file. Cek pengaturan Cloudinary Anda.");
    } finally {
      setUploading(false);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setUrlInput("");
    }
  };

  const clearMedia = () => {
    onChange("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
        {ICON_MAP[mediaType]} {label}
      </label>

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
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            uploading ? "border-indigo-300 bg-indigo-50" : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50"
          }`}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept={accept || ACCEPT_MAP[mediaType]}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-indigo-500">Mengunggah...</p>
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
        <div className="flex gap-2">
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
