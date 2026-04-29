import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  const { timestamp, params_to_sign } = await request.json();

  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!apiSecret) {
    return NextResponse.json({ error: "Cloudinary API Secret not configured" }, { status: 500 });
  }

  // Create the string to sign
  // Format: param1=value1&param2=value2...api_secret
  // Params must be sorted alphabetically
  const sortedParams = Object.keys(params_to_sign)
    .sort()
    .map((key) => `${key}=${params_to_sign[key]}`)
    .join("&");

  const stringToSign = `${sortedParams}${apiSecret}`;

  // Generate SHA1 hash
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  return NextResponse.json({ signature });
}
