import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  availability,
  localName,
  normalizeItems,
  number,
  orderMessage,
  parseCSV,
  parseSettings,
  safeUrl,
  whatsappLink,
} from "../src/lib/menu";
import type { MenuItem } from "../src/types";
const base = {
  id: "test",
  category: "Starters",
  name_en: "Test dish",
  price: " ₹ 1,250 ",
  veg_type: "VEG",
  tags: " Chef | new ",
  available: " TRUE ",
};
test("defensive money parsing handles currencies and rejects corrupt prices", () => {
  assert.equal(number("Rs. 250"), 250);
  assert.equal(number("₹1,250.50"), 1250.5);
  assert.equal(number(""), undefined);
  assert.equal(number("-10"), undefined);
  assert.equal(number("free"), undefined);
  assert.equal(number("1.2.3"), undefined);
});
test("CSV supports BOM, commas, escaped quotes and multiline descriptions", () => {
  const rows = parseCSV(
    '\uFEFFid,name_en,desc_en\r\n1,"Lime, mint","A ""fresh"" drink\nfor summer"\r\n',
  );
  assert.deepEqual(rows, [
    { id: "1", name_en: "Lime, mint", desc_en: 'A "fresh" drink\nfor summer' },
  ]);
  assert.throws(() => parseCSV('id,name\n1,"unclosed'));
});
test("normalization skips corrupt rows and duplicate ids, keeps zero-price items", () => {
  const result = normalizeItems([
    base,
    { ...base },
    null as unknown as Record<string, unknown>,
    { ...base, id: "bad", price: "oops" },
    { ...base, id: "free", price: 0 },
    { ...base, id: "hidden", available: "FALSE", sold_out: "TRUE" },
  ]);
  assert.equal(result.length, 3);
  assert.equal(result[0].price, 1250);
  assert.equal(result[0].category, "starters");
  assert.equal(result[0].veg_type, "veg");
  assert.deepEqual(result[0].tags, ["chef", "new"]);
  assert.equal(result[1].price, 0);
  assert.equal(result[2].available, false);
  assert.equal(result[2].sold_out, true);
});
test("variant/add-on pricing accepts JSON and sheet shorthand; bad options are dropped", () => {
  const [item] = normalizeItems([
    {
      ...base,
      variants: "Half:170|Full:290|Broken:oops",
      addons: '[{"name":"Cheese","price":"₹40"}]',
    },
  ]);
  assert.deepEqual(item.variants, [
    { name: "Half", price: 170 },
    { name: "Full", price: 290 },
  ]);
  assert.deepEqual(item.addons, [{ name: "Cheese", price: 40 }]);
});
test("time windows follow Kochi time including overnight and exact end boundaries", () => {
  const [item] = normalizeItems([
    { ...base, available_from: "22:00", available_to: "02:00" },
  ]);
  assert.equal(availability(item, new Date("2026-09-28T18:00:00Z")).ok, true);
  assert.equal(availability(item, new Date("2026-09-28T20:30:00Z")).ok, false);
  assert.equal(availability(item, new Date("2026-09-28T08:00:00Z")).ok, false);
  assert.equal(availability({ ...item, sold_out: true }).label, "Back soon");
});
test("Settings accepts key/value and wide forms and rejects script URLs", () => {
  assert.equal(
    parseSettings([{ key: "show_sample_banner", value: "false" }])
      .show_sample_banner,
    false,
  );
  assert.equal(
    parseSettings([
      { event_title: "Music night", event_link: "https://example.com/form" },
    ]).event_title,
    "Music night",
  );
  assert.equal(safeUrl("javascript:alert(1)"), "");
  assert.equal(safeUrl("brand/logo.webp", true), "brand/logo.webp");
  assert.equal(
    parseSettings([{ key: "time_zone", value: "invalid/time" }]).time_zone,
    undefined,
  );
});
test("bundled and CSV menus match, and every sample has four language names", () => {
  const bundled = JSON.parse(readFileSync("public/menu.json", "utf8"));
  const items = normalizeItems(bundled.items);
  const csv = normalizeItems(
    parseCSV(readFileSync("sheet-template.csv", "utf8")),
  );
  assert.deepEqual(csv, items);
  assert.equal(items.length, 28);
  assert.equal(new Set(items.map((i) => i.category)).size, 7);
  for (const i of items)
    for (const lang of ["en", "ml", "hi", "ar"] as const)
      assert.ok(i[`name_${lang}`]);
  assert.ok(
    items.some((i) => i.tags.includes("sharing") && i.serves.includes("2")),
  );
  assert.equal(localName({ ...items[0], name_ar: "" }, "ar"), items[0].name_en);
});
test("WhatsApp totals include quantity/options and encode guest notes safely", () => {
  const text = orderMessage(
    [
      {
        key: "x",
        itemId: "a",
        name: "Pasta",
        variant: "Full",
        addons: ["Cheese"],
        price: 360,
        qty: 2,
      },
    ],
    "Cafe",
    "5",
    "Less salt & no chilli",
  );
  assert.match(text, /₹720/);
  assert.match(text, /Table: 5/);
  assert.match(text, /2 × Pasta \(Full\) \+ Cheese/);
  const url = new URL(whatsappLink("+91 77360 03337", text));
  assert.equal(url.pathname, "/917736003337");
  assert.equal(url.searchParams.get("text"), text);
  assert.match(text, /Please confirm/);
});
