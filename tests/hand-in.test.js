// A quest can end with someone other than its giver (2026-11-10: Pip's parcel ends with Captain
// Rook instead of a two-map walk back to Sprout; Pip's compass scene moves to her next errand).
import test from "node:test";
import assert from "node:assert/strict";
import { createCharacter } from "../src/core/character.js";
import {
  acceptQuest,
  noteTalk,
  questState,
  questsOf,
  reportTo,
  completeQuest,
} from "../src/core/quests.js";
import { questTarget } from "../src/world/routes.js";
import { QUEST_SCENES } from "../src/data/scenes.js";

test("Pip's parcel is handed in to Rook, and Pip hears about it on her next errand", () => {
  const c = createCharacter("Courier", {});
  c.level = 5;
  c.quests.snail_trouble = { state: "done" };
  assert.ok(acceptQuest(c, "pip_parcel"));
  noteTalk(c, "rook");
  assert.equal(questState(c, "pip_parcel"), "ready");
  assert.equal(reportTo("pip_parcel"), "rook");
  assert.ok(questsOf(c, "rook").includes("pip_parcel"));
  assert.ok(!questsOf(c, "pip").includes("pip_parcel"));
  assert.equal(questTarget(c, "pip_parcel"), "harbor");
  assert.ok(completeQuest(c, "pip_parcel"));
  assert.equal(QUEST_SCENES.pip_souvenirs.accept, "pip_parcel_done");
  assert.equal(QUEST_SCENES.pip_parcel?.done, undefined);
});
