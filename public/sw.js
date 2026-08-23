// KILL SWITCH SERVICE WORKER
// Esse Service Worker é projetado apenas para se desinstalar e limpar qualquer cache antigo
const CACHE_VERSION = 'v-kill-switch-1';

self.addEventListener('install', (event) => {
  // Pula a espera e se torna ativo imediatamente
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Deleta TODOS os caches
          console.log('SW: Deletando cache antigo', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Força todos os clientes a recarregarem
      self.clients.claim();
      
      // Desregistra a si mesmo
      self.registration.unregister();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Passa as requisições direto para a rede sem tentar usar cache
  event.respondWith(fetch(event.request));
});
