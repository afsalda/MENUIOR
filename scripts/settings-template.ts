import { restaurant } from "../src/config/restaurant.config";
import { writeFileSync } from "node:fs";
const escape = (v: unknown) => '"' + String(v).replaceAll('"', '""') + '"';
const rows = Object.entries(restaurant).filter(
  ([k, v]) =>
    !["id", "theme", "qr", "categories"].includes(k) && typeof v !== "object",
);
writeFileSync(
  "settings-template.csv",
  "\uFEFFkey,value\r\n" +
    rows.map(([k, v]) => `${escape(k)},${escape(v)}`).join("\r\n"),
);
