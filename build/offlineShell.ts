import { createHash } from 'node:crypto';
import type { Plugin } from 'vite';

// Cache only the built application shell. Account data stays in IndexedDB.
export function offlineShell(): Plugin {
  return {
    name: 'poupae-offline-shell',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = Object.keys(bundle).filter(file => /\.(html|js|css)$/.test(file)).sort();
      const hash = createHash('sha256');
      for (const file of files) {
        const entry = bundle[file];
        hash.update(entry.type === 'chunk' ? entry.code : entry.source);
      }
      const version = hash.digest('hex').slice(0, 16);
      this.emitFile({
        type: 'asset', fileName: 'sw.js',
        source: `
const CACHE = 'poupae-shell-${version}';
const ASSETS = ${JSON.stringify([...files, 'favicon-16x16.png'])};
const resolve = path => new URL(path, self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache =>
    cache.addAll(ASSETS.map(path => new Request(resolve(path), { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('poupae-shell-') && key !== CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin ||
      !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) return response;
      } catch {}
      return (await (await caches.open(CACHE)).match(resolve('index.html'))) ||
        new Response('Abra o Poupaê com internet uma vez para preparar o acesso offline.', { status: 503 });
    })());
  } else if (ASSETS.some(path => resolve(path) === url.href)) {
    event.respondWith(caches.open(CACHE).then(async cache =>
      (await cache.match(request, { ignoreVary: true })) || fetch(request)));
  }
});
// Do not force an update over an open app: pending forms and the current JS stay together.
`,
      });
    },
  };
}
