// A door into a place 10+ levels above you asks first (2026-11-10, after a live run walked from
// Sprout Village straight into Crystal Cave's Lv 27-35 monsters at level 5; that road is gone now).
import test from "node:test";
import assert from "node:assert/strict";
import { tooStrong } from "../src/world/world.js";
import { MAPS } from "../src/data/maps.js";

test("no road from Sprout Village into Crystal Cave, and its doors ask a low-level hero first, not a strong one, and towns never ask", () => {
  const door = MAPS.ruins.portals.find((p) => p.to === "cave");
  assert.ok(!MAPS.sprout.portals.some((p) => p.to === "cave"));
  assert.ok(!MAPS.cave.portals.some((p) => p.to === "sprout"));
  assert.equal(tooStrong({ char: { level: 5 } }, door), true);
  assert.equal(tooStrong({ char: { level: 20 } }, door), false);
  const home = MAPS.meadow1.portals.find((p) => p.to === "sprout");
  assert.equal(tooStrong({ char: { level: 1 } }, home), false);
});
