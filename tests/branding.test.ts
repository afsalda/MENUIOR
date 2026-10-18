import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultSettings,
  menuoirSettings,
} from "../src/config/restaurant.config";

test("legacy visible brand defaults become Menuoir without changing contact links", () => {
  const legacy = {
    ...defaultSettings,
    name: "Fress Trees Garden & Cafe",
    wordmark: "fress trees",
    menu_eyebrow: "THE FRESS TREES MENU",
    facebook_name: "Fresstrees",
  };
  const current = menuoirSettings(legacy);
  assert.equal(current.name, "Menuoir");
  assert.equal(current.wordmark, "menuoir");
  assert.equal(current.menu_eyebrow, "THE MENUOIR MENU");
  assert.equal(current.facebook_name, "");
  assert.equal(current.instagram, legacy.instagram);
});

test("custom owner branding is preserved", () => {
  const custom = {
    ...defaultSettings,
    name: "A different café",
    wordmark: "different",
  };
  assert.equal(menuoirSettings(custom).name, custom.name);
  assert.equal(menuoirSettings(custom).wordmark, custom.wordmark);
});
