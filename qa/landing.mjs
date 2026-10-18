import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";

const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
const base = process.env.QA_BASE || "http://127.0.0.1:4175";
try {
  for (const width of [1440, 768, 390, 360]) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      reducedMotion: "reduce",
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${base}/`);
    await expect(
      page.getByRole("heading", { name: "Menuoir: Menu, Games and Review" }),
    ).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Choose a section" })
        .getByRole("link"),
    ).toHaveCount(3);
    await expect(
      page.getByRole("link", { name: /Menu/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Games/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Review/ }).first(),
    ).toBeVisible();
    await expect(page.getByText("Video", { exact: true })).toHaveCount(0);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
      `overflow at ${width}`,
    );
    await page.screenshot({ path: `qa/landing-${width}.png`, fullPage: true });
    const accessibility = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    console.log(
      width,
      "violations",
      JSON.stringify(
        accessibility.violations.map((item) => ({
          id: item.id,
          nodes: item.nodes.map((node) => ({
            target: node.target,
            summary: node.failureSummary,
          })),
        })),
      ),
    );
    await context.close();
  }
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    serviceWorkers: "block",
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/`);
  await page.getByRole("link", { name: /Games/ }).click();
  await expect(page).toHaveURL(/games=1/);
  await page.getByLabel("First name", {exact:true}).fill("Demo guest");
  await page.getByLabel("Phone number", {exact:true}).fill("+12025550123");
  await page.getByRole("button", {name:"Start playing",exact:true}).click();
  await expect(page.getByRole("heading", { name: /Play a little/ })).toBeVisible();
  await page.screenshot({ path: "qa/games-390.png", fullPage: true });
  await expect(page.locator(".game-choice")).toHaveCount(8);
  await page.evaluate(() =>
    localStorage.setItem(
      "fress-trees:games:v1",
      JSON.stringify({ catch: 50, memory: 50, pour: 50, quiz: 50 }),
    ),
  );
  await page.reload();
  await page
    .getByRole("button", { name: /Start claim steps/ })
    .first()
    .click();
  await expect(page.getByText(/Post URL placeholder/)).toHaveCount(3);
  await expect(page.getByText("Complete the steps above")).toBeVisible();
  for (const checkbox of await page.locator(".claim-action input").all())
    await checkbox.check();
  await page
    .getByLabel("Private feedback for our team")
    .fill("The garden drinks were lovely.");
  await page.getByRole("button", { name: /Save private feedback/ }).click();
  await expect(page.getByText("Ready to show our team")).toBeVisible();
  await page.goto(`${base}/?menu=1`);
  await expect(page.getByRole("searchbox")).toBeVisible();
  await expect(page.locator(".wordmark")).toContainText("menuoir");
  await page.goto(`${base}/?admin=1`);
  await expect(page.locator(".admin-brand")).toContainText("menuoir");
  assert.deepEqual(errors, []);
  console.log("Landing, eight game links, claim flow, menu and admin routes pass.");
} finally {
  await browser.close();
}
