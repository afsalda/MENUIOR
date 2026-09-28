import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import assert from "node:assert/strict";
await mkdir("qa", { recursive: true });
const base = process.env.QA_URL || "http://127.0.0.1:4174/";
const browser = await chromium.launch({
  channel: process.platform === "win32" ? "msedge" : undefined,
  headless: true,
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: "reduce",
});
const page = await context.newPage();
const errors = [];
const results = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto(base + "?table=5");
await page.locator(".menu-card").first().waitFor();
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: "qa/desktop-final.png" });
assert.equal(await page.locator(".menu-section").count(), 8);
results.push("All seven categories and featured menu render");
await page
  .getByRole("button", { name: "Add Creamy Alfredo Pasta", exact: true })
  .first()
  .click();
await page.getByRole("checkbox", { name: /Extra cheese/ }).check();
await page
  .getByRole("button", { name: "Increase quantity", exact: true })
  .click();
assert.match(
  await page.locator(".drawer-bottom .primary-button").innerText(),
  /720/,
);
await page.screenshot({ path: "qa/dish-detail.png" });
await page.locator(".drawer-bottom .primary-button").click();
await page.locator(".header-order").click();
await page.getByLabel("Anything we should know?").fill("Less salt & no chilli");
const href = await page
  .getByRole("link", { name: "Send order on WhatsApp" })
  .getAttribute("href");
assert.ok(href.startsWith("https://wa.me/917736003337?"));
const message = new URL(href).searchParams.get("text");
assert.match(message, /Table: 5/);
assert.match(message, /2 × Creamy Alfredo Pasta.*Extra cheese/);
assert.match(message, /₹720/);
assert.match(message, /Less salt & no chilli/);
results.push(
  "Options, quantities, total, table and notes produce the correct WhatsApp draft; no message sent",
);
await page.screenshot({ path: "qa/order.png" });
let axe = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  .analyze();
results.push({
  scope: "cart accessibility",
  violations: axe.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  })),
});
await page.keyboard.press("Escape");
assert.equal(await page.locator("dialog").count(), 0);
assert.ok(
  await page
    .locator(".header-order")
    .evaluate((el) => el === document.activeElement),
);
results.push("Escape closes the drawer and restores keyboard focus");
await page.getByRole("searchbox").fill("cheesecake");
assert.ok(
  await page
    .getByRole("button", { name: "Add Baked Cheesecake", exact: true })
    .isDisabled(),
);
await page.getByRole("searchbox").fill("impossible-dish-xyz");
assert.equal(await page.locator(".menu-card").count(), 0);
assert.ok(await page.locator(".empty-state").isVisible());
await page.getByRole("button", { name: "Clear filters", exact: true }).click();
await page.getByRole("switch", { name: "Veg only" }).click();
assert.equal(await page.locator(".diet-mark.nonveg,.diet-mark.egg").count(), 0);
results.push("Sold-out, no-results and vegetarian filtering work");
await page.getByRole("switch", { name: "Veg only" }).click();
await page
  .getByRole("button", {
    name: "Save to favourites: Creamy Alfredo Pasta",
    exact: true,
  })
  .first()
  .click();
await page.reload();
await page.locator(".menu-card").first().waitFor();
assert.equal(
  await page
    .getByRole("button", {
      name: "Remove from favourites: Creamy Alfredo Pasta",
      exact: true,
    })
    .first()
    .getAttribute("aria-pressed"),
  "true",
);
results.push("Favourites persist after reload");
await page.getByLabel("Menu language").selectOption("ar");
assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
await page.getByRole("searchbox").fill("ألفريدو");
assert.equal(await page.locator(".menu-card").count(), 1);
await page.screenshot({ path: "qa/arabic.png" });
results.push("Arabic uses RTL and searches translated item names");
await page.reload();
assert.equal(await page.locator("html").getAttribute("lang"), "ar");
await page.locator("select").first().selectOption("en");
await page.getByRole("searchbox").fill("");
await page
  .getByRole("button", { name: "Book a table", exact: true })
  .first()
  .click();
assert.match(
  await page
    .getByRole("link", { name: "Book on WhatsApp" })
    .getAttribute("href"),
  /917736003337/,
);
assert.equal(
  await page.locator('dialog a[href^="tel:"]').getAttribute("href"),
  "tel:+917736003337",
);
await page.keyboard.press("Escape");
results.push("Booking routes to the configured phone and WhatsApp");
for (const width of [1440, 1024, 768, 390, 360]) {
  await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > innerWidth,
  );
  assert.equal(overflow, false, `horizontal overflow at ${width}`);
  await page.screenshot({ path: `qa/layout-${width}.png` });
  if (width === 390) {
    axe = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    results.push({
      scope: "mobile menu accessibility",
      violations: axe.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
  }
}
results.push("No horizontal overflow at 1440, 1024, 768, 390 and 360 pixels");
for (const theme of ["noir-cafe", "spice-kitchen", "grand-hotel"]) {
  await page.goto(base + `?theme=${theme}`);
  await page.locator(".menu-card").first().waitFor();
  assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
    false,
  );
  await page.screenshot({ path: `qa/theme-${theme}.png` });
}
await page.goto(base);
await page.getByRole("button", { name: "Toggle colour mode" }).click();
axe = await new AxeBuilder({ page })
  .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
  .analyze();
results.push({
  scope: "dark menu accessibility",
  violations: axe.violations.map((v) => ({
    id: v.id,
    nodes: v.nodes.map((n) => ({
      target: n.target,
      summary: n.failureSummary,
    })),
  })),
});
await page.getByRole("button", { name: "Toggle colour mode" }).click();
await page.emulateMedia({ reducedMotion: "reduce" });
assert.equal(
  await page.locator(".rain").evaluate((el) => getComputedStyle(el).display),
  "none",
);
results.push("All four themes render; reduced motion hides rain");
await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.locator(".menu-card").first().waitFor();
await context.setOffline(true);
await page.reload();
await page.locator(".menu-card").first().waitFor();
assert.ok((await page.locator(".menu-card").count()) > 0);
await page
  .getByRole("button", { name: "Add Creamy Alfredo Pasta", exact: true })
  .first()
  .click();
await page.locator("dialog").waitFor();
results.push(
  "Production menu and lazy-loaded drawer open offline after first visit",
);
await context.setOffline(false);
assert.deepEqual(errors, []);
results.push("No page runtime errors");
await writeFile("qa/results.json", JSON.stringify(results, null, 2));
console.log(
  JSON.stringify(
    results.map((r) =>
      typeof r === "string"
        ? r
        : {
            scope: r.scope,
            violations: r.violations.map((v) => ({
              id: v.id,
              count: v.nodes.length,
              example: v.nodes[0],
            })),
          },
    ),
    null,
    2,
  ),
);
await browser.close();
assert.equal(results.filter(r=>typeof r==='object').reduce((n,r)=>n+r.violations.length,0),0,'Accessibility regressions: inspect qa/results.json');
