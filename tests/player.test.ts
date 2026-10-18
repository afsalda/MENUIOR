import assert from "node:assert/strict";
import test from "node:test";
import { validatePlayer } from "../src/lib/player";
test("player details require usable name and phone", () => {
  assert.ok(validatePlayer(" ", "abc").nameError);
  assert.ok(validatePlayer("Guest", "0000000000").phoneError);
  const result = validatePlayer("  Guest  ", "+91 98765 43210");
  assert.equal(result.nameError, "");
  assert.equal(result.phoneError, "");
  assert.deepEqual(result.player, {name:"Guest", phone:"+919876543210"});
});
