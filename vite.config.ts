import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { restaurant } from "./src/config/restaurant.config";
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "restaurant-metadata",
      transformIndexHtml(html) {
        const title = escape(`${restaurant.name} · The Menu`);
        const description = escape(
          `${restaurant.tagline}. Explore coffee, continental, Asian and Malayalee favourites at ${restaurant.address}.`,
        );
        return html
          .replace(/<title>.*?<\/title>/s, () => `<title>${title}</title>`)
          .replace(
            /(<meta\s+property="og:title"\s+content=")[^"]*"/g,
            (_, prefix) => `${prefix}${title}"`,
          )
          .replace(
            /(<meta\s+(?:name|property)="(?:description|og:description)"\s+content=")[^"]*"/g,
            (_, prefix) => `${prefix}${description}"`,
          );
      },
    },
  ],
  base: "./",
});
