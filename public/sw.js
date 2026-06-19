const CACHE_NAME = 'sagara-v3';
const urlsToCache = [
  '/',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Bypass service worker interception for non-GET requests (e.g. POST, PUT, DELETE)
  if (event.request.method !== 'GET') return;

  // Only handle same-origin requests — skip cross-origin (CORS) requests entirely
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Bypass service worker for API routes, Next.js internal endpoints, static chunks (to avoid dev HMR issues)
  if (
    url.pathname.startsWith('/api/') || 
    url.pathname.startsWith('/_next/') || 
    url.pathname.includes('webpack') ||
    url.pathname.includes('hot-update')
  ) {
    return;
  }

  const isHtmlRequest = event.request.mode === 'navigate' || 
                        event.request.headers.get('accept')?.includes('text/html');

  if (isHtmlRequest) {
    // Network First Strategy for HTML/Page requests
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(err => {
          console.warn('[SW] Fetch failed for navigation, falling back to cache:', err);
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            
            // Return custom offline page if not found in cache
            return new Response(
              `<!DOCTYPE html>
              <html lang="id">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">
                <title>Koneksi Terputus - Sagara</title>
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #334155; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
                  .card { padding: 40px; background: white; border-radius: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); max-width: 400px; width: 100%; border: 1px solid #f1f5f9; }
                  h2 { margin-top: 0; color: #0f172a; font-weight: 800; }
                  p { font-size: 14px; color: #64748b; line-height: 1.6; margin-bottom: 24px; }
                  button { background: #0f172a; color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
                  button:hover { opacity: 0.9; transform: scale(1.02); }
                </style>
              </head>
              <body>
                <div class="card">
                  <div style="font-size: 48px; margin-bottom: 16px;">📶</div>
                  <h2>Koneksi Terputus</h2>
                  <p>Gagal memuat halaman karena koneksi internet Anda terputus atau tidak stabil. Silakan periksa jaringan Anda.</p>
                  <button onclick="window.location.reload()">Coba Lagi</button>
                </div>
              </body>
              </html>`,
              {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              }
            );
          });
        })
    );
    return;
  }

  // Cache First Strategy for other assets (manifest, images, etc.)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).catch(err => {
        console.warn('[SW] Fetch failed for:', event.request.url, err);
        return new Response('Offline/Network error', { 
          status: 480, 
          statusText: 'Network Connection Failed' 
        });
      });
    })
  );
});
