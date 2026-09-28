import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
process.env.VITE_SHEET_CSV_URL = "https://menu-fixture.test/items.csv";
process.env.VITE_SETTINGS_CSV_URL = "https://menu-fixture.test/settings.csv";
const server = await createServer({
  server: { host: "127.0.0.1", port: 4175, strictPort: true },
});
await server.listen();
const browser = await chromium.launch({
  channel: process.platform === "win32" ? "msedge" : undefined,
  headless: true,
});
try {
  const page = await browser.newPage({ reducedMotion: "reduce" });
  let broken = false;
  const csv = (await readFile("sheet-template.csv", "utf8"))
    .replace('"Iced Caramel Latte"', '"Live Sheet Latte"')
    .replace('"190"', '"235"');
  await page.route("https://menu-fixture.test/items.csv", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/csv",
      headers: { "access-control-allow-origin": "*" },
      body: broken ? "bad,headers\noops,row" : csv,
    }),
  );
  await page.route("https://menu-fixture.test/settings.csv", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/csv",
      headers: { "access-control-allow-origin": "*" },
      body: "key,value\nevent_title,Fixture garden music\nevent_time,Fixture only\nevent_link,https://example.com/event\nshow_sample_banner,FALSE\nopening_hours,Fixture hours",
    }),
  );
  await page.goto("http://127.0.0.1:4175/");
  await page
    .getByRole("button", { name: "Live Sheet Latte", exact: true })
    .waitFor();
  assert.equal(await page.locator(".sample-banner").count(), 0);
  assert.equal(
    await page.locator(".event-banner").first().getAttribute("href"),
    "https://example.com/event",
  );
  assert.match(
    await page
      .locator(".menu-card")
      .filter({
        has: page.getByRole("button", {
          name: "Live Sheet Latte",
          exact: true,
        }),
      })
      .innerText(),
    /235/,
  );
  broken = true;
  await page.reload();
  await page
    .getByRole("button", { name: "Live Sheet Latte", exact: true })
    .waitFor();
  await page.getByText("Showing your saved menu").waitFor();
  assert.equal(await page.locator(".sample-banner").count(), 0);
  const second = await browser.newPage({ reducedMotion: "reduce" });
  await second.route("https://menu-fixture.test/**", (route) => route.abort());
  await second.goto("http://127.0.0.1:4175/");
  await second
    .getByRole("button", { name: "Iced Caramel Latte", exact: true })
    .waitFor();
  assert.ok(await second.locator(".sample-banner").isVisible());
  console.log(
    "PASS: live Items + Settings refresh, sample flag, event link, changed price, last-good cache on malformed CSV, and bundled fallback on first-visit failure. Mock URLs only; no live Sheet was provided.",
  );
} finally {
  await browser.close();
  await server.close();
}
