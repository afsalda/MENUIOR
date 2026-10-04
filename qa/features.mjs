import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

// Loopback only: do not send test orders or edit hosted restaurant content.
const base = "http://127.0.0.1:4175";
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];
let owner, original, changed = false;
try {
  owner = await browser.newContext({ reducedMotion: "reduce", serviceWorkers: "block" });
  const guest = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", serviceWorkers: "block" });
  const admin = await owner.newPage(), page = await guest.newPage();
  const errors = [];
  [admin, page].forEach(p => p.on("pageerror", e => errors.push(e.message)));
  await admin.goto(base + "/signin-with-chatgpt");
  await admin.getByRole("heading", { name: "Guest experience", exact: true }).waitFor();
  original = await (await owner.request.get(base + "/api/admin/menu")).json();
  const item = original.items.find(i => i.id === "iced-latte");
  const patch = async (dish) => {
    const current = await (await owner.request.get(base + "/api/admin/menu")).json();
    const response = await owner.request.patch(base + "/api/admin/items/iced-latte", { headers: { Origin: base }, data: { item: dish, revision: current.revision } });
    assert.equal(response.status(), 200);
    changed = true;
  };
  await patch({ ...item, sold_out: false, available: true, name_ml: "", tags: [...new Set([...item.tags, "bestseller"])], price: 215 });
  await admin.reload();
  await admin.getByRole("button", { name: "Review missing translations", exact: true }).click();
  await expect(admin.getByLabel("Availability filter")).toHaveValue("translations");
  await expect(admin.locator(".admin-dish").filter({ hasText: "Iced Caramel Latte" })).toHaveCount(1);
  await admin.getByRole("button", { name: "Manage bestsellers", exact: true }).click();
  await expect(admin.getByLabel("Availability filter")).toHaveValue("bestseller");
  await admin.getByRole("button", { name: "Manage Google review link", exact: true }).click();
  await expect(admin.getByLabel("Google review link", { exact: true })).toBeVisible();
  results.push("Dashboard cards filter translation gaps and bestsellers and open review configuration.");

  await page.goto(base + "/?table=7");
  await page.getByRole("searchbox").fill(item.name_en);
  for (const [lang, label] of [["ml", "മലയാളം"], ["hi", "हिन्दी"], ["ar", "العربية"], ["en", "English"]]) {
    await page.locator(".language-options").getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
    await expect(page.locator(".menu-card h3 button")).toHaveText(lang === "ml" ? item.name_en : item[`name_${lang}`] || item.name_en);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    await page.screenshot({ path: `qa/feature-language-${lang}.png` });
  }
  results.push("All four language toggles change dish names and document language; blank Malayalam falls back to English; Arabic uses RTL without horizontal overflow.");

  await page.getByRole("button", { name: item.name_en, exact: true }).click();
  await page.locator(".item-drawer .drawer-bottom .primary-button").click();
  await page.locator(".header-order").click();
  await expect(page.getByLabel("Table number", { exact: true })).toHaveValue("7");
  await page.getByLabel("Anything we should know?", { exact: true }).fill("No ice & less sugar");
  let link = new URL(await page.getByRole("link", { name: "Send order on WhatsApp", exact: true }).getAttribute("href"));
  assert.equal(link.hostname, "wa.me");
  assert.match(link.searchParams.get("text"), /Table: 7/);
  assert.match(link.searchParams.get("text"), /No ice & less sugar/);
  assert.match(link.searchParams.get("text"), /₹215/);
  await patch({ ...item, price: 225, sold_out: false });
  await expect(page.locator(".order-total strong")).toHaveText("₹225", { timeout: 10000 });
  await patch({ ...item, price: 225, sold_out: true });
  await expect(page.getByRole("button", { name: "Remove unavailable items to continue" })).toBeDisabled({ timeout: 10000 });
  await expect(page.getByRole("link", { name: "Send order on WhatsApp", exact: true })).toHaveCount(0);
  results.push("WhatsApp draft includes table, notes and totals. An open cart reprices after an owner edit and blocks a newly sold-out dish. No messages sent.");

  await page.keyboard.press("Escape");
  await page.getByRole("searchbox").fill("");
  await admin.getByRole("button", { name: "Menu items", exact: true }).click();
  for (const width of [1440, 768, 390, 360]) {
    for (const [name, p] of [["guest", page], ["owner", admin]]) {
      await p.setViewportSize({ width, height: 900 });
      await p.evaluate(() => scrollTo(0, 0));
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name} overflow at ${width}`);
      await p.screenshot({ path: `qa/features-${name}-${width}.png` });
      const audit = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      assert.deepEqual(audit.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), []);
      results.push(`${name} ${width}px: no horizontal overflow; axe reports zero violations.`);
    }
  }
  assert.deepEqual(errors, []);
  console.log(JSON.stringify(results, null, 2));
} finally {
  if (changed && original && owner) {
    const current = await (await owner.request.get(base + "/api/admin/menu")).json();
    const response = await owner.request.patch(base + "/api/admin/items/iced-latte", { headers: { Origin: base }, data: { item: original.items.find(i => i.id === "iced-latte"), revision: current.revision } });
    assert.equal(response.status(), 200, "restore local sample dish");
  }
  await writeFile("qa/features-results.json", JSON.stringify(results, null, 2));
  await browser.close();
}
