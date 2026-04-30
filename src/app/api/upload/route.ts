import { NextResponse } from "next/server";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";
export const maxDuration = 300;

// ── Cloudflare R2 client (S3-compatible) ──────────────────────────────────
function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  });
}

// ── Upload ke Cloudflare R2 (video & audio — up to 5GB per file) ──────────
async function uploadToR2(file: File, fileBytes: ArrayBuffer): Promise<string> {
  const r2     = getR2Client();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
  const pubUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
  const ext    = file.name.split(".").pop() || "bin";
  const key    = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket:      bucket,
    Key:         key,
    Body:        Buffer.from(fileBytes),
    ContentType: file.type || "application/octet-stream",
  }));

  // Public URL: https://{pub-xxx}.r2.dev/{key}
  return `${pubUrl}/${key}`;
}

// ── Upload ke Cloudinary (gambar — CDN + auto-transform) ──────────────────
async function uploadToCloudinary(file: File, fileBytes: ArrayBuffer): Promise<string> {
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const apiKey    = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY!;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME!;
  const folder    = process.env.CLOUDINARY_UPLOAD_FOLDER || "lpksagara";

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const toSign    = `folder=${folder}&timestamp=${timestamp}` + apiSecret;
  const signature = crypto.createHash("sha1").update(toSign).digest("hex");

  const form = new FormData();
  form.append("file", new Blob([fileBytes], { type: file.type }), file.name);
  form.append("api_key",   apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("folder",    folder);

  const res  = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, { method: "POST", body: form });
  const text = await res.text();
  if (!res.ok) {
    let msg = `Cloudinary HTTP ${res.status}`;
    try { msg = JSON.parse(text)?.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  return (JSON.parse(text) as { secure_url: string }).secure_url;
}

// ── Route handler ─────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file") as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Tidak ada file yang dikirim." }, { status: 400 });
    }

    const isImage   = file.type.startsWith("image/");
    const sizeMB    = file.size / 1024 / 1024;
    const CLOUDINARY_LIMIT_MB = 100;

    // Routing logic:
    // - Image         → always Cloudinary (CDN + transform)
    // - Video/Audio < 100MB → Cloudinary (faster CDN delivery)
    // - Video/Audio ≥ 100MB → Cloudflare R2 (no size limit)
    const useCloudinary = isImage || sizeMB < CLOUDINARY_LIMIT_MB;
    const dest = useCloudinary
      ? `Cloudinary${isImage ? " (image)" : ` (video/audio ${sizeMB.toFixed(1)}MB < 100MB)`}`
      : `Cloudflare R2 (${sizeMB.toFixed(1)}MB ≥ 100MB)`;

    console.log(`[/api/upload] ${file.name} → ${dest}`);

    const fileBytes = await file.arrayBuffer();
    const url = useCloudinary
      ? await uploadToCloudinary(file, fileBytes)
      : await uploadToR2(file, fileBytes);

    console.log(`[/api/upload] ✓ ${url}`);
    return NextResponse.json({ url });

  } catch (err: any) {
    console.error("[/api/upload] Error:", err.message);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
