import QRCode from "qrcode";
import { mkdir, writeFile } from "node:fs/promises";
import { restaurant } from "../src/config/restaurant.config";
const args = process.argv.slice(2);
const value = (key: string) => {
  const i = args.indexOf(key);
  return i >= 0 ? args[i + 1] : undefined;
};
const base = value("--url") ?? restaurant.qr.base_url;
const tables = Number(value("--tables") ?? restaurant.qr.tables);
const url = new URL(base);
if (!["https:", "http:"].includes(url.protocol))
  throw new Error("Use a full https:// URL.");
if (!Number.isInteger(tables) || tables < 0 || tables > 500)
  throw new Error("Tables must be a whole number between 0 and 500.");
await mkdir("qr-output", { recursive: true });
for (let table = 0; table <= tables; table++) {
  const target = new URL(url);
  target.searchParams.delete("table");
  if (table) target.searchParams.set("table", String(table));
  const name = table ? `table-${table}` : "general";
  const options = {
    width: 1024,
    margin: 4,
    errorCorrectionLevel: "M" as const,
    color: { dark: "#244c3a", light: "#ffffff" },
  };
  await QRCode.toFile(`qr-output/${name}.png`, target.href, options);
  await writeFile(
    `qr-output/${name}.svg`,
    await QRCode.toString(target.href, { ...options, type: "svg" }),
  );
}
console.log(
  `Created general + ${tables} table QR codes (PNG and SVG) in qr-output/.`,
);
if (url.hostname === "localhost" || url.hostname === "127.0.0.1")
  console.warn(
    "These are LOCAL DEMO codes. Set --url to your published HTTPS menu URL before printing.",
  );
