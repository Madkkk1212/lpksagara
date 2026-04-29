import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 });
  }

  try {
    const validOrigins = ['yimg.jp', 'yahoo.co.jp', 'unsplash.com'];
    const hostname = new URL(url).hostname;
    const isValid = validOrigins.some(o => hostname.endsWith(o));

    if (!isValid) {
      return NextResponse.json({ error: 'Origin not allowed' }, { status: 403 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SagaraBot/1.0)',
        'Referer': 'https://news.yahoo.co.jp/',
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch image' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    return NextResponse.json({ error: 'Proxy error' }, { status: 500 });
  }
}
