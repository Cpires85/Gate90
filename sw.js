const CACHE_NAME = 'gate90-cache-v1';

// Ficheiros essenciais para guardar na memória do telemóvel
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './151623.png' // O nosso mascote guardado offline
];

// Evento de Instalação: Guarda a interface e o mascote no cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto com sucesso');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de Interceção: Serve os ficheiros do cache para carregar instantaneamente
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrar no cache, devolve imediatamente. Se não, vai buscar à internet.
        return response || fetch(event.request);
      })
  );
});

// Evento de Ativação: Limpa caches antigos se houver atualizações
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
