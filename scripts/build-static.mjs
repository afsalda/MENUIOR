import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { restaurant } from "../src/config/restaurant.config.ts";
const manifest = JSON.parse(
  await readFile("public/manifest.webmanifest", "utf8"),
);
manifest.name = restaurant.name;
manifest.short_name = restaurant.wordmark;
manifest.description = `${restaurant.tagline}. ${restaurant.address}.`;
await writeFile("dist/client/manifest.webmanifest", JSON.stringify(manifest));
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((e) =>
        e.isDirectory() ? walk(path.join(dir, e.name)) : path.join(dir, e.name),
      ),
    )
  ).flat();
}
const files = (await walk("dist/client")).filter(
  (p) => !p.endsWith("sw.js") && !p.endsWith(".jpg"),
);
const version = createHash("sha256")
  .update(
    (await Promise.all(files.map((f) => readFile(f))))
      .map((b) => b.toString("base64"))
      .join(""),
  )
  .digest("hex")
  .slice(0, 12);
const urls = files.map(
  (f) => "./" + path.relative("dist/client", f).replaceAll("\\", "/"),
);
const sw = `const CACHE='menure-${version}';
const PRECACHE=${JSON.stringify(["./", ...urls])};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(c=>c.addAll(PRECACHE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('menure-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 const url=new URL(event.request.url);
 if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/signin-with-chatgpt')||url.pathname.startsWith('/signout-with-chatgpt'))return;
 if(event.request.mode==='navigate'){
   event.respondWith(fetch(event.request).catch(()=>caches.match(new URL('./index.html',self.registration.scope).href)));return;
 }
 if(url.pathname.endsWith('/menu.json')){
   event.respondWith(fetch(event.request).then(r=>{if(r.ok){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return r;}).catch(()=>caches.match(event.request)));return;
 }
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(r=>{if(r.ok&&url.pathname.startsWith(new URL(self.registration.scope).pathname)){const copy=r.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}return r;})));
});`;
await writeFile("dist/client/sw.js", sw);
console.log("Offline app shell generated:", version, urls.length, "assets");

