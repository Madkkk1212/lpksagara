import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const directUrl = 'https://storage.sagaracloud.web.id/1779620908847_r8uhonz303r.pdf';
  // Query our local proxy endpoint
  const localProxyUrl = `${request.nextUrl.origin}/api/pdf-proxy?url=${encodeURIComponent(directUrl)}`;
  const log: string[] = [];

  log.push(`Querying Local Proxy: ${localProxyUrl}`);
  try {
    const res = await fetch(localProxyUrl, {
      cache: 'no-store'
    });
    log.push(`Proxy Status: ${res.status}`);
    log.push(`Proxy OK: ${res.ok}`);
    log.push(`Proxy Headers:`);
    for (const [k, v] of res.headers.entries()) {
      log.push(`  ${k}: ${v}`);
    }

    const buffer = await res.arrayBuffer();
    const arr = new Uint8Array(buffer);
    const header = String.fromCharCode(...arr.slice(0, 5));
    log.push(`Proxy Output Header (first 5 bytes): "${header}"`);

    if (header !== '%PDF-') {
      log.push(`WARNING: The proxy output is NOT a valid PDF!`);
      const textDecoder = new TextDecoder('utf-8');
      const text = textDecoder.decode(arr.slice(0, 1000));
      log.push(`First 1000 characters of proxy output:`);
      log.push(text);
    } else {
      log.push(`SUCCESS: Proxy returned valid PDF header.`);
    }

  } catch (err: any) {
    log.push(`Local proxy query failed:`);
    log.push(err.stack || err.message || err);
  }

  return new NextResponse(log.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}
