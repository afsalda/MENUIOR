import { createServer } from "vite";
import { chromium } from "@playwright/test";
import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
process.env.VITE_SHEET_CSV_URL = "https://menu-fixture.test/items.csv";
process.env.VITE_SETTINGS_CSV_URL = "https://menu-fixture.test/settings.csv";
process.env.VITE_GA4_ID = "G-TEST123";
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
  let csv = (await readFile("sheet-template.csv", "utf8"))
    .replace('"Iced Caramel Latte"', '"Live Sheet Latte"')
    .replace('"190"', '"235"');
  await page.clock.install();
  await page.route("https://www.googletagmanager.com/**", (route) =>
    route.fulfill({ body: "", contentType: "application/javascript" }),
  );
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
      body: "key,value\nevent_title,Fixture garden music\nevent_time,Fixture only\nevent_link,https://example.com/event\nshow_sample_banner,FALSE\nopening_hours,Fixture hours\ngoogle_review_link,https://example.com/review-fixture",
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
  const bill = page.locator(".guest-assistance a").nth(1);
  await bill.evaluate((el) =>
    el.addEventListener("click", (e) => e.preventDefault(), { once: true }),
  );
  await bill.click();
  assert.equal(
    await page.locator(".review-prompt a").getAttribute("href"),
    "https://example.com/review-fixture",
  );
  await page
    .getByRole("button", { name: "Add Live Sheet Latte", exact: true })
    .click();
  assert.ok(
    await page.evaluate(() =>
      window.dataLayer.some(
        (args) =>
          args[0] === "event" &&
          args[1] === "item_view" &&
          args[2].item_id === "iced-latte",
      ),
    ),
  );
  await page.locator(".drawer-bottom .primary-button").click();
  await page.locator(".header-order").click();
  assert.match(await page.locator(".order-total").innerText(), /235/);
  csv = csv.replace('"235"', '"275"');
  const priceRefresh = page.waitForResponse(
    "https://menu-fixture.test/items.csv",
  );
  await page.clock.fastForward(61000);
  await priceRefresh;
  await page.waitForFunction(() =>
    document.querySelector(".order-total")?.textContent.includes("275"),
  );
  assert.match(
    new URL(
      await page
        .getByRole("link", { name: "Send order on WhatsApp" })
        .getAttribute("href"),
    ).searchParams.get("text"),
    /₹275/,
  );
  csv = csv.replace('"true","false"', '"true","true"');
  const soldRefresh = page.waitForResponse(
    "https://menu-fixture.test/items.csv",
  );
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await soldRefresh;
  await page
    .getByRole("button", { name: "Remove unavailable items to continue" })
    .waitFor();
  assert.equal(
    await page.getByRole("link", { name: "Send order on WhatsApp" }).count(),
    0,
  );
  await page.keyboard.press("Escape");
  assert.equal(
    await page
      .getByRole("button", { name: "Add Live Sheet Latte", exact: true })
      .isDisabled(),
    true,
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
    "PASS: live Items + Settings, 60-second price refresh updates current cart and WhatsApp total, focus refresh blocks sold-out selections, post-bill Google review prompt, GA4 item-view event parameters, last-good cache and bundled fallback. All connections mocked; no live request sent.",
  );
} finally {
  await browser.close();
  await server.close();
}
