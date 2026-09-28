import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({ channel: process.platform === "win32" ? "msedge" : undefined, headless: true });
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4174/?table=5&new=1");
  const section = page.locator("#menu-content #section-new");
  await section.waitFor();
  assert.equal(await section.locator(".menu-card").count(), 4);
  assert.equal(await page.locator("video, iframe, .release-poster, .release-controls, dialog[open]").count(), 0);
  assert.notEqual(await page.evaluate(() => document.body.style.overflow), "hidden");
  await page.locator(".category-list").getByRole("button", { name: /New on the menu/ }).click();
  await page.locator(".product-reveal.is-revealed").first().waitFor();
  const first = section.locator(".menu-card").first();
  const clips = [];
  for (const ms of [0, 600, 1400]) {
    await first.evaluate((el, ms) => {
      for (const animation of el.getAnimations({ subtree: true })) { animation.pause(); animation.currentTime = ms; }
    }, ms);
    clips.push(await first.locator(".product-reveal-mask").evaluate(el => getComputedStyle(el).clipPath));
    await first.screenshot({ path: `qa/product-entrance-${ms}.png` });
  }
  assert.notEqual(clips[0], clips[1]);
  assert.notEqual(clips[1], clips[2]);
  await first.getByRole("button", { name: "Add Creamy Alfredo Pasta", exact: true }).click();
  await page.locator(".item-drawer").waitFor();
  await page.locator(".drawer-bottom .primary-button").click();
  await page.locator(".header-order").click();
  const order = new URL(await page.getByRole("link", { name: "Send order on WhatsApp" }).getAttribute("href")).searchParams.get("text");
  assert.match(order, /Creamy Alfredo Pasta/);
  assert.match(order, /Table: 5/);
  await page.keyboard.press("Escape");
  await first.locator(".save-button").click();
  assert.equal(await first.locator(".save-button").getAttribute("aria-pressed"), "true");
  await page.getByRole("searchbox").fill("alfredo");
  assert.equal(await page.locator(".menu-card").count(), 1);
  assert.equal(await section.count(), 0);
  await page.getByRole("searchbox").fill("impossible-dish-xyz");
  assert.equal(await page.locator(".menu-card").count(), 0);
  await page.getByRole("searchbox").fill("");
  results.push("New products belong to the menu: native Add, order, table-specific WhatsApp draft, favourites, search and category navigation work. No media player, poster, autoplay modal or scroll lock, including ?new=1.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width > 700 ? 1000 : 844 });
    for (const card of await section.locator(".menu-card").all()) {
      await card.scrollIntoViewIfNeeded();
      await card.locator(".product-reveal.is-revealed").waitFor();
    }
    assert.equal(await section.locator(".product-reveal img").evaluateAll(imgs => imgs.every(i => i.complete && i.naturalWidth > 0)), true);
    assert.equal(await section.evaluate(el => el.getAnimations({ subtree: true }).length), 0);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    const grid = await section.locator(".new-products-grid").evaluate(el => getComputedStyle(el).gridTemplateColumns.split(" ").length);
    assert.equal(grid, width <= 600 ? 1 : 2);
    await section.screenshot({ path: `qa/new-products-${width}.png` });
    await section.evaluate(el => el.scrollIntoView({ block: "start", behavior: "instant" }));
    await page.screenshot({ path: `qa/products-in-menu-${width}.png` });
    const audit = await new AxeBuilder({ page }).include("#section-new").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
    results.push({ scope: `product cards ${width}px`, violations: audit.violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) })) });
    assert.equal(audit.violations.length, 0);
  }
  for (const lang of ["ml", "hi", "ar", "en"]) {
    await page.getByRole("combobox").first().selectOption(lang);
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
    assert.equal(await section.locator(".menu-card").count(), 4);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  }
  await context.close();
  const fallbackContext = await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" });
  const fallbackPage = await fallbackContext.newPage();
  await fallbackPage.route("**/brand/release/*.png", route => route.abort());
  await fallbackPage.goto("http://127.0.0.1:4174/");
  const fallback = fallbackPage.locator(".new-product-card").first();
  await fallback.scrollIntoViewIfNeeded();
  await fallback.locator(".product-reveal.is-revealed").waitFor();
  assert.equal(await fallback.locator("img").evaluate(img => img.complete && img.naturalWidth > 0), true);
  assert.equal(await fallback.locator(".product-reveal-fallback").count(), 1);
  assert.deepEqual(errors, []);
  results.push("Mask reveal has distinct entrance/midpoint/end states; four responsive layouts, reduced motion, all languages and missing-cutout fallback pass. Zero runtime errors; no messages sent.");
  console.log(JSON.stringify(results, null, 2));
} finally {
  await writeFile("qa/release-results.json", JSON.stringify(results, null, 2));
  await browser.close();
}
