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
  await page.goto("http://127.0.0.1:4174/?table=5");
  await page.locator(".release-invitation").click();
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
  for (const ms of [0, 700, 1700, 3800]) {
    await page.locator(".release-poster").evaluate((el, ms) => {
      for (const a of el.getAnimations({ subtree: true })) {
        a.pause();
        a.currentTime = ms;
      }
    }, ms);
    await page.screenshot({ path: `qa/release-${ms}.png` });
  }
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
    scope: "new release dialog",
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
  results.push(
    "Animation assets load; pause/resume/replay works; all four labels reveal; label opens live item details; Escape closes.",
  );
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const width of [360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width > 700 ? 1000 : 800 });
    await page.locator(".release-invitation").click();
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
    await page.keyboard.press("Escape");
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
  results.push(
    "Reduced motion is static at 360, 390, 768 and 1440px; language shortcuts work; waiter draft carries table 5; no review shown without configured link; no runtime errors.",
  );
  console.log(JSON.stringify(results, null, 2));
} finally {
  await writeFile("qa/release-results.json", JSON.stringify(results, null, 2));
  await browser.close();
}
