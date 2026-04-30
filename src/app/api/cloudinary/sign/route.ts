import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const apiSecret  = process.env.CLOUDINARY_API_SECRET;
    const apiKey     = process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY  || process.env.CLOUDINARY_API_KEY;
    const cloudName  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const folder     = process.env.CLOUDINARY_UPLOAD_FOLDER || "lpksagara";

    if (!apiSecret || !apiKey || !cloudName) {
      const missing = [
        !apiSecret  && "CLOUDINARY_API_SECRET",
        !apiKey     && "NEXT_PUBLIC_CLOUDINARY_API_KEY",
        !cloudName  && "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
      ].filter(Boolean).join(", ");
      return NextResponse.json(
        { error: `Cloudinary env vars belum lengkap. Yang belum ada: ${missing}` },
        { status: 500 }
      );
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();

    // Build params to sign (sorted alphabetically)
    const paramsToSign: Record<string, string> = {
      folder,
      timestamp,
    };

    const stringToSign =
      Object.keys(paramsToSign)
        .sort()
        .map((k) => `${k}=${paramsToSign[k]}`)
        .join("&") + apiSecret;

    const signature = crypto
      .createHash("sha1")
      .update(stringToSign)
      .digest("hex");

    return NextResponse.json({
      signature,
      timestamp,
      api_key: apiKey,
      cloud_name: cloudName,
      folder,
    });
  } catch (err: any) {
    console.error("Cloudinary sign error:", err);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
