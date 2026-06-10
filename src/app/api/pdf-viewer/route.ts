import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const pdfUrl = request.nextUrl.searchParams.get('url');

  if (!pdfUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PDF Viewer</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" crossorigin="anonymous"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      background: #e5e7eb;
      font-family: sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      min-height: 100vh;
    }
    #loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 14px;
      color: #6b7280;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #d1d5db;
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: spin .8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #pages {
      display: none;
      flex-direction: column;
      align-items: center;
      width: 100%;
      padding: 12px;
      gap: 10px;
    }
    canvas {
      max-width: 100%;
      height: auto;
      display: block;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      background: #fff;
    }
    #page-info {
      padding: 6px 16px;
      background: #1e293b;
      color: #fff;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      letter-spacing: .05em;
    }
  </style>
</head>
<body>
  <div id="loader">
    <div class="spinner"></div>
    <p id="loader-text" style="font-size:13px">Mengunduh PDF...</p>
  </div>
  <div id="pages"></div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const directUrl = ${JSON.stringify(pdfUrl)};

    async function renderPDF() {
      const loader      = document.getElementById('loader');
      const loaderText  = document.getElementById('loader-text');
      const pages       = document.getElementById('pages');

      try {
        // Step 1: fetch PDF through our same-origin proxy
        // Use window.location.origin so the URL is always absolute — fixes PDF.js worker resolve bug
        const proxyUrl = window.location.origin + '/api/pdf-proxy?url=' + encodeURIComponent(directUrl);

        loaderText.textContent = 'Mengunduh PDF...';
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error('Proxy responded with ' + res.status);

        // Step 2: get raw bytes, pass to PDF.js via { data } — no HTTP fetch by PDF.js at all
        loaderText.textContent = 'Memuat halaman...';
        const arrayBuffer = await res.arrayBuffer();
        const pdf         = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const total       = pdf.numPages;

        loader.style.display = 'none';
        pages.style.display  = 'flex';

        const info = document.createElement('div');
        info.id = 'page-info';
        info.textContent = total + ' halaman';
        pages.appendChild(info);

        for (let n = 1; n <= total; n++) {
          const page     = await pdf.getPage(n);
          const dpr      = window.devicePixelRatio || 1;
          const maxW     = Math.min(window.innerWidth - 24, 960);
          const baseVP   = page.getViewport({ scale: 1 });
          const scale    = (maxW / baseVP.width) * dpr;
          const viewport = page.getViewport({ scale });

          const canvas   = document.createElement('canvas');
          const ctx      = canvas.getContext('2d');
          canvas.width   = viewport.width;
          canvas.height  = viewport.height;
          canvas.style.width  = (viewport.width  / dpr) + 'px';
          canvas.style.height = (viewport.height / dpr) + 'px';
          pages.appendChild(canvas);

          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch (err) {
        console.error('PDF render error:', err);
        loader.innerHTML = \`
          <div style="text-align:center;padding:24px">
            <div style="font-size:36px;margin-bottom:8px">\u26A0\uFE0F</div>
            <p style="font-size:13px;color:#ef4444;font-weight:bold;margin-bottom:4px">Gagal memuat PDF</p>
            <p style="font-size:11px;color:#9ca3af;margin-bottom:16px">Coba buka langsung di tab baru</p>
            <a href="\${directUrl}" target="_blank" rel="noreferrer"
               style="display:inline-block;padding:10px 20px;background:#1e293b;
                      color:#fff;border-radius:10px;text-decoration:none;
                      font-size:13px;font-weight:bold">
              Buka PDF \u2197
            </a>
          </div>\`;
      }
    }

    renderPDF();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
