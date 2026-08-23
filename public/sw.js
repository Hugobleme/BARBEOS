const CACHE_NAME = "barberos-pwa-v3";
const STATIC_ASSETS = [
  "/manifest.json",
  "/manifest.webmanifest",
  "/icon-192.png",
  "/icon-512.png"
];

// Instalação: Pré-cacheia apenas assets estáticos imutáveis
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Ativação: Limpa TODOS os caches antigos para remover páginas de erro residuais
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Estratégia de requisições
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Não interceptar requisições que não sejam GET
  if (req.method !== "GET") return;

  // 1. Supabase e APIs externas: Network-Only / Network-First
  if (url.hostname.includes("supabase.co") || url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // 2. Navegação / Páginas HTML: SEMPRE Network-First (evita travar em páginas de erro)
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(req).then((cached) => {
            return cached || caches.match("/");
          });
        })
    );
    return;
  }

  // 3. Arquivos Estáticos (JS, CSS, Imagens, Fontes): Stale-While-Revalidate
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
