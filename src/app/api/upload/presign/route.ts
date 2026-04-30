import { NextResponse } from "next/server";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

function getR2Client() {
  return new S3Client({
    region: "us-east-1", // R2 works best with us-east-1 or auto
    endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId:     process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true, // MANDATORY for R2 SSL to work (avoids bucket.account.r2...)
  });
}

export async function POST(request: Request) {
  try {
    const { sizeMB, mimeType, filename } = await request.json() as {
      sizeMB: number;
      mimeType: string;
      filename: string;
    };

    const isImage = mimeType.startsWith("image/");

    if (isImage) {
      // ── Cloudinary direct upload signature (Khusus Foto) ───────────────
      const apiSecret = process.env.CLOUDINARY_API_SECRET!;
      const apiKey    = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY!;
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME!;
      const folder    = process.env.CLOUDINARY_UPLOAD_FOLDER || "lpksagara";

      const timestamp = Math.floor(Date.now() / 1000).toString();
      const toSign    = `folder=${folder}&timestamp=${timestamp}` + apiSecret;
      const signature = crypto.createHash("sha1").update(toSign).digest("hex");

      return NextResponse.json({
        type: "cloudinary",
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        fields: { api_key: apiKey, timestamp, signature, folder },
      });
    } else {
      // ── R2 presigned PUT URL (Semua Video & Audio agar "Gacor") ────────
      const r2     = getR2Client();
      const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME!;
      const pubUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL!;
      const ext    = filename.split(".").pop() || "bin";
      const key    = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

      const putUrl = await getSignedUrl(
        r2,
        new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: mimeType }),
        { expiresIn: 3600 }
      );

      return NextResponse.json({
        type: "r2",
        putUrl,
        publicUrl: `${pubUrl}/${key}`,
      });
    }
  } catch (err: any) {
    console.error("[/api/upload/presign] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
