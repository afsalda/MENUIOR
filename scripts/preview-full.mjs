// Local-only preview: authentication is simulated only on this loopback server.
// Production relies exclusively on the Sites dispatcher identity headers.
import { Miniflare } from "miniflare";
import { createServer } from "node:http";
import { readFile, readdir, stat } from "node:fs/promises";
import { extname, join, normalize, resolve } from "node:path";
import { Readable } from "node:stream";
const mf = new Miniflare({
  modules: true, scriptPath: "dist/server/index.js", compatibilityDate: "2026-08-01",
  d1Databases: ["DB"], r2Buckets: ["BUCKET"],
  d1Persist: ".sites-runtime/local-d1", r2Persist: ".sites-runtime/local-r2",
  bindings: { ADMIN_EMAIL: "owner@local.test" },
});
const staticRoot = resolve("dist/client");
const mimes = new Map([
  [".css", "text/css; charset=utf-8"], [".js", "text/javascript; charset=utf-8"],
  [".html", "text/html; charset=utf-8"], [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"], [".png", "image/png"], [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"], [".webp", "image/webp"], [".ico", "image/x-icon"],
]);
const db = await mf.getD1Database("DB");
await db.prepare("CREATE TABLE IF NOT EXISTS _local_migrations (name TEXT PRIMARY KEY)").run();
for (const file of (await readdir("drizzle")).filter(file => file.endsWith(".sql")).sort()) {
  if (await db.prepare("SELECT name FROM _local_migrations WHERE name = ?").bind(file).first()) continue;
  for (const sql of (await readFile(`drizzle/${file}`, "utf8")).split("--> statement-breakpoint").map(s => s.trim()).filter(Boolean)) await db.prepare(sql).run();
  await db.prepare("INSERT INTO _local_migrations (name) VALUES (?)").bind(file).run();
}
const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1:4175");
    if (url.pathname === "/signin-with-chatgpt") { res.writeHead(302, { "Set-Cookie": "menu_local_owner=1; HttpOnly; SameSite=Lax; Path=/", Location: "/?admin=1" }); res.end(); return; }
    if (!url.pathname.startsWith("/api/") && !url.pathname.startsWith("/media/") && url.pathname !== "/") {
      const decoded = decodeURIComponent(url.pathname);
      const requested = normalize(join(staticRoot, decoded));
      if (requested.startsWith(staticRoot)) {
        try {
          const found = await stat(requested);
          if (found.isFile()) {
            res.writeHead(200, {
              "Content-Type": mimes.get(extname(requested)) || "application/octet-stream",
              "Cache-Control": requested.endsWith("index.html") ? "no-store" : "public, max-age=31536000, immutable",
            });
            res.end(await readFile(requested));
            return;
          }
        } catch {}
      }
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) if (value && !key.startsWith("oai-authenticated-user-") && key !== "host") headers.set(key, Array.isArray(value) ? value.join(",") : value);
    if ((req.headers.cookie || "").split(";").some(cookie => cookie.trim() === "menu_local_owner=1")) { headers.set("oai-authenticated-user-id", "local-owner"); headers.set("oai-authenticated-user-email", "owner@local.test"); }
    const response = await mf.dispatchFetch(url.href, { method: req.method, headers, body: ["GET", "HEAD"].includes(req.method) ? undefined : Readable.toWeb(req), duplex: "half" });
    res.writeHead(response.status, Object.fromEntries(response.headers));
    if (response.body) Readable.fromWeb(response.body).pipe(res); else res.end();
  } catch (e) { res.writeHead(500); res.end("Local preview error"); console.error(e.message); }
});
server.listen(4175, "127.0.0.1", () => console.log("Full menu preview: http://127.0.0.1:4175 — use Admin → Sign in for local owner access."));
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, async () => { server.close(); await mf.dispose(); process.exit(0); });
