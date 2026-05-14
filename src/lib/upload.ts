import { supabase } from "./supabase";

export async function directUpload(
  file: File,
  onProgress?: (pct: number, loaded: number, total: number) => void
): Promise<string> {
  let resolvedMime = file.type;
  if (!resolvedMime || resolvedMime === "application/octet-stream") {
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (ext === "mp3") resolvedMime = "audio/mpeg";
    else if (ext === "wav") resolvedMime = "audio/wav";
    else if (ext === "ogg") resolvedMime = "audio/ogg";
    else if (ext === "m4a") resolvedMime = "audio/mp4";
    else if (ext === "webm") resolvedMime = "audio/webm";
    else if (ext === "aac") resolvedMime = "audio/aac";
    else resolvedMime = "application/octet-stream";
  }

  // Step 1: Get upload params from server
  const presignRes = await fetch("/api/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sizeMB: file.size / 1024 / 1024, mimeType: resolvedMime, filename: file.name }),
  });
  
  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || "Gagal mendapat upload params");
  }
  
  const presign = await presignRes.json() as
    | { type: "cloudinary"; uploadUrl: string; fields: Record<string, string> }
    | { type: "r2"; putUrl: string; publicUrl: string };

  // Step 2: Upload directly to destination
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Step 2a: Cloudinary Direct
    if (presign.type === "cloudinary") {
      const form = new FormData();
      form.append("file", file);
      Object.entries(presign.fields).forEach(([k, v]) => form.append(k, v));

      xhr.open("POST", presign.uploadUrl, true);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.min(Math.round((e.loaded / e.total) * 98), 98), e.loaded, e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText) as { secure_url?: string; error?: { message: string } };
            if (data.error) return reject(new Error(data.error.message));
            if (data.secure_url) return resolve(data.secure_url);
            reject(new Error("Response Cloudinary invalid."));
          } catch { reject(new Error("Gagal parse Cloudinary.")); }
        } else {
          reject(new Error(`Cloudinary error ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("Koneksi Cloudinary terputus."));
      xhr.send(form);
    } 
    // Step 2b: R2 Direct
    else {
      xhr.open("PUT", presign.putUrl, true);
      xhr.setRequestHeader("Content-Type", resolvedMime);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.min(Math.round((e.loaded / e.total) * 98), 98), e.loaded, e.total);
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(presign.publicUrl);
        } else {
          reject(new Error(`R2 upload gagal (${xhr.status})`));
        }
      };
      xhr.onerror = () => reject(new Error("Koneksi R2 terputus (CORS?)."));
      xhr.send(file);
    }
  });
}
