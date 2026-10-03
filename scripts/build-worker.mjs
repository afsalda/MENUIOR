import { build } from "esbuild";
import { readFile, mkdir, cp } from "node:fs/promises";
await mkdir("dist/server", { recursive: true });
await build({
  entryPoints: ["worker/index.ts"],
  outfile: "dist/server/index.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  define: { "import.meta.env": "{}" },
  plugins: [
    {
      name: "shell",
      setup(build) {
        build.onResolve({ filter: /^virtual:app-shell$/ }, () => ({
          path: "shell",
          namespace: "shell",
        }));
        build.onLoad({ filter: /.*/, namespace: "shell" }, async () => ({
          contents: `export default ${JSON.stringify(await readFile("dist/client/index.html", "utf8"))}`,
          loader: "js",
        }));
      },
    },
  ],
});
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
console.log("Menu Worker and storage migrations built.");
