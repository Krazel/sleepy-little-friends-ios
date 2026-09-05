import {readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve('dist/client');
async function walk(dir){const entries=await readdir(dir,{withFileTypes:true});return (await Promise.all(entries.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=(await walk(root)).filter(p=>!p.endsWith('.map')&&!p.endsWith('sw.js')&&!p.includes(path.sep+'.vite'+path.sep)&&!p.endsWith('.br')&&!p.endsWith('.gz'));
const hash=createHash('sha256');for(const f of files)hash.update(await readFile(f));
const name='animalitos-'+hash.digest('hex').slice(0,12);
const assets=files.map(f=>'/'+path.relative(root,f).split(path.sep).join('/'));
if(!assets.includes('/index.html'))throw new Error('Missing exported index.html');
const source=`
const CACHE=${JSON.stringify(name)};
const ASSETS=${JSON.stringify(assets)};
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(ASSETS.map(url=>new Request(url,{cache:'reload'})));
  await self.skipWaiting();
 })());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('animalitos-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
 })());
});
self.addEventListener('fetch',event=>{
 const request=event.request;
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname==='/sw.js')return;
 if(request.mode==='navigate'){
  event.respondWith((async()=>{
   try {
    const response=await fetch(request);
    if(response.ok&&!response.redirected){const cache=await caches.open(CACHE);await cache.put('/index.html',response.clone());}
    if(response.ok||response.redirected)return response;
   }catch{}
   return await caches.match('/index.html')||new Response('Abre el juego una vez con conexión.',{status:503,headers:{'Content-Type':'text/plain;charset=utf-8'}});
  })());return;
 }
 if(ASSETS.includes(url.pathname)){
  event.respondWith((async()=>await caches.match(url.pathname)||fetch(request))());
 }
});
`;
await writeFile(path.join(root,'sw.js'),source);
console.log('Offline package: '+assets.length+' files, '+name);

