import { NextRequest, NextResponse } from 'next/server';

/**
 * PDF Proxy: fetches PDF server-side (no CORS) and re-serves it
 * with CORS + inline headers so PDF.js can fetch it from the browser.
 * Vercel CDN caches the response for 10 minutes per region.
 */
export async function GET(request: NextRequest) {
  const pdfUrl = request.nextUrl.searchParams.get('url');

  if (!pdfUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Validate URL to prevent abuse (only allow known storage domains)
  try {
    const parsed = new URL(pdfUrl);
    const allowed = [
      'storage.sagaracloud.web.id',
      'pub-bf4a771e8dc944ecb4b9810d20caa60e.r2.dev',
      'res.cloudinary.com',
    ];
    if (!allowed.some(d => parsed.hostname.endsWith(d))) {
      return new NextResponse('URL not allowed', { status: 403 });
    }
  } catch {
    return new NextResponse('Invalid URL', { status: 400 });
  }

  try {
    const upstream = await fetch(pdfUrl, {
      headers: { 'User-Agent': 'SagaraLMS/1.0' },
      // @ts-ignore
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return new NextResponse('Failed to fetch PDF', { status: upstream.status });
    }

    // Size guard: reject PDFs > 30 MB to protect server
    const contentLength = upstream.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 30 * 1024 * 1024) {
      return new NextResponse('PDF too large', { status: 413 });
    }

    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        // Allow PDF.js (same origin) to fetch this
        'Access-Control-Allow-Origin': '*',
        // Vercel CDN caches for 10 min — same PDF only fetched once per region
        'Cache-Control': 'public, max-age=600, s-maxage=600, stale-while-revalidate=3600',
      },
    });
  } catch (err) {
    console.error('[pdf-proxy] error:', err);
    return new NextResponse('Proxy error', { status: 500 });
  }
}
