import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const browser = await chromium.launch({
  channel: process.platform === "win32" ? "msedge" : undefined,
  headless: true,
});
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://127.0.0.1:4174/?table=5&new=1");
  await page.locator("main #new-on-menu").waitFor();
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.notEqual(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
  );
  await page
    .locator(".release-section")
    .evaluate((el) =>
      el.scrollIntoView({ block: "center", behavior: "instant" }),
    );
  await page.locator(".release-poster.ready").waitFor();
  assert.equal(
    await page
      .locator(".release-product")
      .evaluateAll((imgs) =>
        imgs.every((i) => i.complete && i.naturalWidth > 0),
      ),
    true,
  );
  await page.getByRole("button", { name: "Pause", exact: true }).click();
  const time = await page
    .locator(".release-timer")
    .evaluate((e) => e.getAnimations()[0].currentTime);
  await page.waitForTimeout(200);
  assert.ok(
    Math.abs(
      (await page
        .locator(".release-timer")
        .evaluate((e) => e.getAnimations()[0].currentTime)) - time,
    ) < 25,
  );
  await page.getByRole("button", { name: "Play", exact: true }).click();
  await page.getByRole("button", { name: "Replay", exact: true }).click();
  assert.equal(await page.locator(".release-mask").count(), 2);
  assert.equal(await page.locator(".release-mask .release-product").count(), 4);
  assert.equal(await page.locator(".release-mask .release-track").count(), 2);
  const clips = [];
  for (const ms of [0, 700, 1700, 3800]) {
    await page.locator(".release-poster").evaluate((el, ms) => {
      for (const a of el.getAnimations({ subtree: true })) {
        a.pause();
        a.currentTime = ms;
      }
    }, ms);
    clips.push(
      await page
        .locator(".release-mask-top")
        .evaluate((el) => getComputedStyle(el).clipPath),
    );
    if (ms === 700)
      assert.equal(
        await page
          .locator(".release-label-1")
          .evaluate((el) => getComputedStyle(el).opacity),
        "0",
      );
    await page.screenshot({ path: `qa/release-${ms}.png` });
  }
  assert.match(clips[0], /ellipse\(0% 0%/);
  assert.notEqual(clips[1], clips[0]);
  assert.notEqual(clips[1], clips[3]);
  assert.equal(await page.locator(".release-callout path").count(), 4);
  assert.equal(await page.locator(".release-description").count(), 4);
  await page.locator(".release-poster").evaluate((el) => {
    for (const a of el.getAnimations({ subtree: true })) {
      a.finish();
    }
  });
  assert.equal(await page.locator(".release-label").count(), 4);
  assert.equal(
    await page.getByRole("button", { name: "Replay", exact: true }).count(),
    1,
  );
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  results.push({
    scope: "inline new release, mobile",
    violations: audit.violations.map((v) => ({
      id: v.id,
      nodes: v.nodes.map((n) => ({
        target: n.target,
        summary: n.failureSummary,
      })),
    })),
  });
  await page.locator(".release-label-1").click();
  await page.locator(".item-drawer").waitFor();
  assert.match(await page.locator("#drawer-title").innerText(), /Alfredo/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.equal(await page.locator(".release-section").count(), 1);
  assert.notEqual(
    await page.evaluate(() => document.body.style.overflow),
    "hidden",
  );
  results.push(
    "The reveal is inside main on normal and legacy ?new=1 URLs, with no modal or scroll lock. Shared masks, delayed labels, pause/resume/replay and product details work; closing details returns to the inline section.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".release-section-heading").click();
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width > 700 ? 1000 : 800 });
    await page
      .locator(".release-section")
      .evaluate((el) =>
        el.scrollIntoView({ block: "center", behavior: "instant" }),
      );
    await page.locator(".release-poster.ready").waitFor();
    assert.equal(
      await page
        .locator(".release-poster")
        .evaluate((e) => e.getAnimations({ subtree: true }).length),
      0,
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    await page.screenshot({ path: `qa/release-static-${width}.png` });
    const shape = await page.locator(".release-poster").boundingBox();
    assert.ok(
      width >= 760 ? shape.width > shape.height : shape.height > shape.width,
    );
    const check = await new AxeBuilder({ page })
      .include("#new-on-menu")
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    results.push({
      scope: `inline release ${width}px`,
      violations: check.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    });
    if (width === 1440) {
      await page.evaluate(() =>
        window.scrollTo({ top: 0, behavior: "instant" }),
      );
      await page.screenshot({
        path: "qa/inline-page-desktop.png",
        fullPage: false,
      });
    }
  }
  for (const lang of ["ml", "hi", "ar", "en"]) {
    await page.locator(`.language-options button[lang="${lang}"]`).click();
    assert.equal(await page.locator("html").getAttribute("lang"), lang);
  }
  const waiter = await page
    .locator(".guest-assistance a")
    .first()
    .getAttribute("href");
  assert.match(new URL(waiter).searchParams.get("text"), /table 5/);
  assert.equal(await page.locator(".review-prompt").count(), 0);
  assert.deepEqual(errors, []);
  assert.equal(audit.violations.length, 0);
  assert.equal(
    results
      .filter((r) => typeof r === "object")
      .reduce((n, r) => n + r.violations.length, 0),
    0,
  );
  results.push(
    "Reduced motion is static at 360, 390, 768 and 1440px; language shortcuts work; waiter draft carries table 5; no review shown without configured link; no runtime errors.",
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await writeFile("qa/release-results.json", JSON.stringify(results, null, 2));
  await browser.close();
}
