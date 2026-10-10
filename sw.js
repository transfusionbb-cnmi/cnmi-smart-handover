const NAME='cnmi-handover-v1.0.2';
const ASSETS=['./','index.html','assets/styles.css','assets/icon.svg','src/app.js','src/api.js','src/barcode.js','src/ocr.js','src/helpers.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(x=>x!==NAME).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||u.pathname.includes('config.js')||u.pathname.includes('/rest/')||u.pathname.includes('/auth/')||u.pathname.includes('/functions/'))return; e.respondWith(fetch(e.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(NAME).then(c=>c.put(e.request,copy)).catch(()=>{})}return r}).catch(()=>caches.match(e.request)))});
