import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const pdfUrl = request.nextUrl.searchParams.get('url');

  if (!pdfUrl) {
    return new NextResponse('Missing url parameter', { status: 400 });
  }

  // Return an HTML page that renders the PDF using PDF.js
  // This bypasses Chrome's PDF intercept on mobile because the iframe loads HTML, not a PDF
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
      background: #f0f0f0;
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
      gap: 16px;
      color: #555;
    }
    .spinner {
      width: 40px; height: 40px;
      border: 4px solid #ddd;
      border-top-color: #14b8a6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #pdf-container {
      display: none;
      flex-direction: column;
      align-items: center;
      width: 100%;
      padding: 12px;
      gap: 12px;
    }
    canvas {
      max-width: 100%;
      height: auto;
      display: block;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.15);
      background: #fff;
    }
    #error {
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 12px;
      color: #ef4444;
      text-align: center;
      padding: 24px;
    }
    #error a {
      padding: 12px 24px;
      background: #1e293b;
      color: #fff;
      border-radius: 12px;
      text-decoration: none;
      font-weight: bold;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div id="loader">
    <div class="spinner"></div>
    <p style="font-size:13px;color:#888;">Memuat PDF...</p>
  </div>
  <div id="pdf-container"></div>
  <div id="error">
    <div style="font-size:32px;">⚠️</div>
    <p style="font-size:14px;font-weight:bold;">Gagal memuat PDF</p>
    <a href="${pdfUrl}" target="_blank" rel="noreferrer">Buka di Tab Baru ↗</a>
  </div>

  <script>
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const pdfUrl = ${JSON.stringify(pdfUrl)};
    const container = document.getElementById('pdf-container');
    const loader = document.getElementById('loader');
    const errorDiv = document.getElementById('error');

    async function renderPDF() {
      try {
        const loadingTask = pdfjsLib.getDocument({ url: pdfUrl, withCredentials: false });
        const pdf = await loadingTask.promise;

        loader.style.display = 'none';
        container.style.display = 'flex';

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const devicePixelRatio = window.devicePixelRatio || 1;
          const containerWidth = Math.min(window.innerWidth - 24, 900);
          const unscaledViewport = page.getViewport({ scale: 1 });
          const scale = (containerWidth / unscaledViewport.width) * devicePixelRatio;
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = (viewport.width / devicePixelRatio) + 'px';
          canvas.style.height = (viewport.height / devicePixelRatio) + 'px';
          container.appendChild(canvas);

          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch (err) {
        console.error('PDF render error:', err);
        loader.style.display = 'none';
        errorDiv.style.display = 'flex';
      }
    }

    renderPDF();
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
      'X-Frame-Options': 'SAMEORIGIN',
    },
  });
}
