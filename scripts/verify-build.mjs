import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import vm from 'node:vm';
import path from 'node:path';
const root = path.resolve('dist/client');
const html = await readFile(path.join(root, 'index.html'), 'utf8');
assert.match(html, /<html[^>]*lang="es"/);
assert.match(html, /Animalitos/);
assert.match(html, /manifest.webmanifest/);
for (const [, url] of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
  if (!url.startsWith('/') || url.startsWith('//')) continue;
  await stat(path.join(root, url.split('?')[0]));
}
const source = await readFile(path.join(root, 'sw.js'), 'utf8');
const assets = JSON.parse(source.match(/const ASSETS=(\[[^;]+\]);/)[1]);
for (const name of [
  '/art/bunny.png',
  '/art/kitten.png',
  '/art/bear.png',
  '/art/puppy.png',
  '/art/fox.png',
  '/art/panda.png',
  '/voice/es/welcome.mp3',
  '/voice/en/welcome.mp3',
  '/index.html',
  '/manifest.webmanifest',
  '/icon-192.png',
  '/icon-512.png',
])
  assert.ok(assets.includes(name), name);
assert.equal(
  assets.filter((s) => s.startsWith('/voice/') && s.endsWith('.mp3')).length,
  68,
);
assert.ok(assets.some((s) => s.endsWith('.js')));
assert.ok(assets.some((s) => s.endsWith('.css')));
for (const url of assets) await stat(path.join(root, url));
const listeners = {},
  entries = new Map(),
  deleted = [];
let offline = false,
  claimed = false,
  skipped = false;
const cache = {
  async addAll(requests) {
    for (const r of requests)
      entries.set(
        new URL(r.url).pathname,
        new Response('cached:' + new URL(r.url).pathname),
      );
  },
  async put(key, res) {
    entries.set(key, res);
  },
};
class LocalRequest extends Request {
  constructor(url, options) {
    super(new URL(url, 'https://test.local'), options);
  }
}
const context = {
  Request: LocalRequest,
  Response,
  URL,
  caches: {
    open: async () => cache,
    match: async (key) => entries.get(key)?.clone(),
    keys: async () => ['unrelated-cache', 'animalitos-old'],
    delete: async (key) => deleted.push(key),
  },
  fetch: async () => {
    if (offline) throw new Error('Offline');
    return new Response('online');
  },
  self: {
    location: { origin: 'https://test.local' },
    skipWaiting: async () => {
      skipped = true;
    },
    clients: {
      claim: async () => {
        claimed = true;
      },
    },
    addEventListener: (name, handler) => {
      listeners[name] = handler;
    },
  },
};
vm.runInNewContext(source, context);
function fire(name, event = {}) {
  return new Promise((resolve, reject) =>
    listeners[name]({
      ...event,
      waitUntil: (p) => Promise.resolve(p).then(resolve, reject),
      respondWith: (p) => Promise.resolve(p).then(resolve, reject),
    }),
  );
}
await fire('install');
assert.equal(entries.size, assets.length);
assert.ok(skipped);
await fire('activate');
assert.ok(claimed);
assert.deepEqual(deleted, ['animalitos-old']);
offline = true;
const navigation = await fire('fetch', {
  request: { url: 'https://test.local/', method: 'GET', mode: 'navigate' },
});
assert.equal(await navigation.text(), 'cached:/index.html');
const art = await fire('fetch', {
  request: {
    url: 'https://test.local/art/bunny.png',
    method: 'GET',
    mode: 'no-cors',
  },
});
assert.equal(await art.text(), 'cached:/art/bunny.png');
for (const lang of ['es', 'en']) {
  const voice = await fire('fetch', {
    request: {
      url: 'https://test.local/voice/' + lang + '/welcome.mp3',
      method: 'GET',
      mode: 'cors',
    },
  });
  assert.equal(await voice.text(), 'cached:/voice/' + lang + '/welcome.mp3');
}
let intercepted = false;
listeners.fetch({
  request: { url: 'https://external.test/x', method: 'GET', mode: 'cors' },
  respondWith: () => {
    intercepted = true;
  },
});
assert.equal(intercepted, false);
listeners.fetch({
  request: {
    url: 'https://test.local/action',
    method: 'POST',
    mode: 'same-origin',
  },
  respondWith: () => {
    intercepted = true;
  },
});
assert.equal(intercepted, false);
console.log(
  'Production verified: Spanish HTML, all local references, ' +
    assets.length +
    ' precached files, offline navigation, six rooms and both voice libraries, safe cache cleanup, network scope.',
);
