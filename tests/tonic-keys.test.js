// A new hero's first tonics go on a key by themselves (2026-11-10: a live run fainted at level 4
// with 19 tonics in the bag and none on a key).
import test from "node:test";
import assert from "node:assert/strict";
import { createCharacter, bindFirstTonics } from "../src/core/character.js";
import { addItem } from "../src/core/inventory.js";

test("first tonics land on keys 1 and 2, once, and a cleared key stays clear", () => {
  const c = createCharacter("Tester", {});
  assert.equal(bindFirstTonics(c), null);
  addItem(c.inventory, "red_potion", 5);
  const said = bindFirstTonics(c);
  assert.deepEqual(c.hotkeys.Digit1, { item: "red_potion" });
  assert.match(said[0], /key 1/);
  addItem(c.inventory, "blue_potion", 5);
  bindFirstTonics(c);
  assert.deepEqual(c.hotkeys.Digit2, { item: "blue_potion" });
  delete c.hotkeys.Digit1;
  assert.equal(bindFirstTonics(c), null);
  assert.equal(c.hotkeys.Digit1, undefined);
});
