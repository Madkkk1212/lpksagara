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
<<<<<<< HEAD
  const [progress, setProgress] = useState(0);
  const [uploadSize, setUploadSize] = useState({ current: 0, total: 0 });
=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790

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

<<<<<<< HEAD
  const uploadToCloudinary = async (file: File | Blob, cloudName: string): Promise<string> => {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;
    const totalSize = file.size;
    const chunkSize = 6 * 1024 * 1024; // 6MB chunks
    const uniqueUploadId = Math.random().toString(36).substring(2, 15);
    
    setUploadSize({ current: 0, total: totalSize });

    // 1. Get Signature from our API
    const sigRes = await fetch("/api/cloudinary-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp,
        params_to_sign: {
          timestamp,
          folder: "media_files"
        }
      })
    });
    
    if (!sigRes.ok) throw new Error("Gagal mendapatkan otorisasi upload");
    const { signature } = await sigRes.json();

    let start = 0;
    let end = 0;
    let secureUrl = "";

    while (start < totalSize) {
      end = Math.min(start + chunkSize, totalSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("api_key", apiKey || "");
      formData.append("timestamp", timestamp.toString());
      formData.append("signature", signature);
      formData.append("folder", "media_files");

      const resourceType = mediaType === "image" ? "image" : mediaType === "video" ? "video" : "auto";
      
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`, {
        method: "POST",
        body: formData,
        headers: {
          "X-Unique-Upload-Id": uniqueUploadId,
          "Content-Range": `bytes ${start}-${end - 1}/${totalSize}`,
        },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Chunked upload failed");
      }

      const data = await res.json();
      if (data.secure_url) {
        secureUrl = data.secure_url.replace("/upload/", "/upload/q_auto,f_auto/");
      }

      start = end;
      setProgress(Math.round((start / totalSize) * 100));
      setUploadSize(prev => ({ ...prev, current: start }));
    }

    return secureUrl;
  };

  const handleFile = async (file: File) => {
    // Validation
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      alert("File terlalu besar! Maksimal ukuran file adalah 100MB.");
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadSize({ current: 0, total: file.size });

    try {
      let cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY;

      if (!cloudName) {
        const { data: theme } = await supabase.from('app_theme').select('cloudinary_cloud_name').single();
        if (theme?.cloudinary_cloud_name) cloudName = theme.cloudinary_cloud_name;
      }

      let fileToUpload: File | Blob = file;

      if (cloudName && apiKey) {
        if (mediaType === "image") fileToUpload = await compressImage(file);
        const cloudinaryUrl = await uploadToCloudinary(fileToUpload, cloudName);
=======
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
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
        onChange(cloudinaryUrl);
        setUploading(false);
        return;
      }

<<<<<<< HEAD
      // Fallback to Supabase (Limited size)
      if (file.size > 20 * 1024 * 1024) {
        alert("Video >20MB membutuhkan Cloudinary. Silakan atur Cloudinary di Settings.");
=======
      // 2. Fallback to Supabase Flow (Original Logic)
      // Compression logic for images local fallback
      if (mediaType === "image") {
        fileToUpload = await compressImage(file);
      }
      
      // Size validation for video/audio (20MB limit for Supabase to prevent lag)
      if (mediaType === "video" && file.size > 20 * 1024 * 1024) {
        alert("Video terlalu besar (>20MB)! Gunakan Cloudinary di Settings agar file besar bisa dikompres otomatis.");
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
        setUploading(false);
        return;
      }

<<<<<<< HEAD
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
=======
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
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
    } finally {
      setUploading(false);
    }
  };

<<<<<<< HEAD
  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0MB";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)}MB`;
  };

=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
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
<<<<<<< HEAD
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
          {ICON_MAP[mediaType]} {label}
        </label>
        <span className="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 uppercase tracking-tighter">
          Max 100MB
        </span>
      </div>
=======
      <label className="text-[10px] font-black uppercase text-slate-500 flex items-center gap-2">
        {ICON_MAP[mediaType]} {label}
      </label>
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790

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
<<<<<<< HEAD
          key="upload-container"
=======
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
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
<<<<<<< HEAD
            <div className="flex flex-col items-center gap-3">
              <div className="relative h-14 w-14 flex items-center justify-center">
                 <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
                 <div 
                    className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin" 
                    style={{ animationDuration: '1s' }}
                 />
                 <span className="text-[10px] font-black text-indigo-600">{progress}%</span>
              </div>
              <div className="text-center space-y-1">
                 <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Mengunggah...</p>
                 <p className="text-[9px] font-bold text-slate-400">
                    {formatSize(uploadSize.current)} / {formatSize(uploadSize.total)}
                 </p>
              </div>
              <div className="w-full max-w-[180px] bg-indigo-100 h-1.5 rounded-full overflow-hidden">
                 <div 
                    className="bg-indigo-500 h-full transition-all duration-300" 
                    style={{ width: `${progress}%` }}
                 />
              </div>
=======
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-bold text-indigo-500">Mengunggah...</p>
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
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
<<<<<<< HEAD
        <div key="url-container" className="flex gap-2">
=======
        <div className="flex gap-2">
>>>>>>> 4fdea8a5b00d8560d7175f35be4e413be575b790
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
