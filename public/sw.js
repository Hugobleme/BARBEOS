self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (e) => {
  // Passa todas as requisições adiante.
  // Apenas precisamos deste listener para habilitar o prompt de instalação do PWA no Chrome.
});
