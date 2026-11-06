// The cutscene director (world/director.js): scenes staged in the world itself. People walk, the
// camera pans, emotes and bubbles show, the world's own clock stays paused, Esc plays the rest out
// at once, and afterwards everyone is back where they belong.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SCENES } from '../src/data/story.js';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { playScene, advanceScene } from '../src/world/story.js';
import { ROOM } from '../src/world/director.js';
import { waterAt } from '../src/world/physics.js';

const DT = 1 / 60;
const idle = { held: new Set(), pressed: new Set() };
const run = (w, secs) => {
  for (let i = 0; i < secs * 60 && w.scene; i++) updateWorld(w, DT, idle);
};

function inSprout() {
  const w = createWorld(createCharacter('Hana', {}));
  loadMap(w, 'sprout', 'start');
  w.body.x = 700;
  return w;
}

test('a staged scene walks people over, pans the camera and pops emotes, with the world paused', () => {
  SCENES.__walk = [
    { emote: 'mira', kind: '!' },
    { walk: 'mira', to: 'player', gap: 30 },
    { cam: 'player', dur: 0.5 },
    { say: 'mira', text: 'Hello!' },
  ];
  const w = inSprout();
  const mira = w.map.npcs.find((n) => n.id === 'mira');
  const home = mira.x;
  const now = w.now;
  playScene(w, '__walk');
  run(w, 0.2);
  assert.equal(w.cine.emotes[0]?.kind, '!', 'the emote is up');
  run(w, 8);
  assert.ok(Math.abs(mira.x - (700 - 30)) < 1, `she walked up to you (${mira.x})`);
  assert.ok(w.cine.cam, 'the scene holds the camera');
  assert.equal(w.cine.say?.text, 'Hello!', 'her bubble waits for a press');
  assert.equal(w.now, now, "the world's own clock stays paused");
  w.cine.go = true;
  run(w, 0.1);
  w.cine && (w.cine.go = true);
  run(w, 0.1);
  assert.equal(w.scene, null, 'the scene is over');
  assert.equal(mira.x, home, 'she went back to her place');
  assert.equal(mira.cine, undefined);
  delete SCENES.__walk;
});

test('skipping plays the rest out at once: the hero ends where the scene puts them, visitors leave', () => {
  SCENES.__skip = [
    { spawn: 'rook', x: 900 },
    { walk: 'player', to: 1000 },
    { who: 'rook', text: 'A line nobody has to read.' },
    { fade: 'out', dur: 2 },
    { walk: 'player', by: 40 },
  ];
  const w = inSprout();
  const count = w.map.npcs.length;
  playScene(w, '__skip');
  run(w, 0.1);
  assert.equal(w.map.npcs.length, count + 1, 'Rook came for the scene');
  advanceScene(w, true);
  assert.equal(w.scene, null);
  assert.equal(w.body.x, 1040, 'the hero walked all the way, at once');
  assert.equal(w.map.npcs.length, count, 'the visitor left with the scene');
  assert.equal(w.cine, null);
  delete SCENES.__skip;
});

test('a step naming someone who is not here is passed over, never stuck', () => {
  SCENES.__missing = [{ walk: 'kestrel', to: 'player' }, { emote: 'tora', kind: 'heart' }, { jump: 'nobody' }];
  const w = inSprout();
  // Kestrel is in Sprout, but Tora and "nobody" are not.
  playScene(w, '__missing');
  run(w, 30);
  assert.equal(w.scene, null, 'the scene played through');
  delete SCENES.__missing;
});

test('the real story scenes play through on their own staging and presses', () => {
  for (const id of ['ch1_open', 'ch1_hello', 'ch1_end']) {
    const w = inSprout();
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

// The instructors' story chains play at their camp, where the people in them stand.
test("Brann's shield story plays through at Ember Crag", () => {
  for (const id of ['brann_stand_done', 'brann_ruins_done', 'brann_forge_done', 'brann_howl_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'crag', 'west');
    const brann = w.map.npcs.find((n) => n.id === 'brann');
    w.body.x = brann.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("Kestrel's arrow story plays through in Sprout Village", () => {
  for (const id of ['kestrel_targets_done', 'kestrel_canyon_done', 'kestrel_glade_done', 'kestrel_wings_done']) {
    const w = inSprout();
    const kestrel = w.map.npcs.find((n) => n.id === 'kestrel');
    w.body.x = kestrel.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("Elowen's teapot story plays through in Moonleaf Grove, and Mira comes to tea", () => {
  for (const id of ['elowen_dance_done', 'elowen_wisps_done', 'elowen_foxfire_done', 'elowen_lid_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'grove', 'west');
    const elowen = w.map.npcs.find((n) => n.id === 'elowen');
    w.body.x = elowen.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.ok(!w.map.npcs.some((n) => n.id === 'mira'), `${id}: Mira goes home after tea`);
  }
});

test("Vex's hammer story plays through on Pastel Harbor, and Tora comes to the show", () => {
  for (const id of ['vex_shadows_done', 'vex_stage_done', 'vex_miko_done', 'vex_festival_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'harbor', 'west');
    const vex = w.map.npcs.find((n) => n.id === 'vex');
    w.body.x = vex.x - 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.ok(!w.map.npcs.some((n) => n.id === 'tora'), `${id}: Tora goes home to her forge`);
  }
});

test("Marlo's dream-jar story plays through on Pastel Harbor", () => {
  for (const id of ['marlo_scales_done', 'marlo_tusk_done', 'marlo_key_done', 'spa_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'harbor', 'west');
    const marlo = w.map.npcs.find((n) => n.id === 'marlo');
    w.body.x = marlo.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("Tora's Great Forge story plays through in Ember Crag", () => {
  for (const id of ['tora_handles_done', 'tora_bellows_done', 'tora_draught_done', 'cores_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'crag', 'start');
    const tora = w.map.npcs.find((n) => n.id === 'tora');
    w.body.x = tora.x - 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.equal(w.map.npcs.find((n) => n.id === 'tora').x, tora.x, `${id}: Tora is back at her forge`);
  }
});

test("Nim's runaway-candle story plays through in Moonleaf Grove", () => {
  for (const id of ['nim_chimes_done', 'candles_open', 'candles_done', 'nim_cape_done', 'stardust_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'grove', 'start');
    const nim = w.map.npcs.find((n) => n.id === 'nim');
    w.body.x = nim.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.ok(!w.cine || (w.cine.fade.a === 0 && !w.cine.spot), `${id}: the lights come back up`);
  }
});

test("Pip's never-left-the-shop story plays through in Sprout Village", () => {
  for (const id of ['pip_snails_done', 'pip_parcel_done', 'pip_souvenirs_done', 'pip_lunch_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'sprout', 'start');
    const pip = w.map.npcs.find((n) => n.id === 'pip');
    w.body.x = pip.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.equal(w.map.npcs.find((n) => n.id === 'pip').x, pip.x, `${id}: Pip is back behind her counter`);
  }
});

test("Clover's Golden Bun story plays through in Sprout Village, and you ride off on your bun", () => {
  for (const id of ['clover_count_done', 'clover_bun_done', 'clover_golden_done', 'clover_parade_done']) {
    const char = createCharacter('Hana', {});
    char.mounts = ['bun'];
    const w = createWorld(char);
    loadMap(w, 'sprout', 'start');
    const clover = w.map.npcs.find((n) => n.id === 'clover');
    w.body.x = clover.x - 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.equal(Boolean(w.riding), id === 'clover_bun_done', `${id}: only the round-up scene puts you on your bun`);
  }
});

test("Bramble's Great Wipe story plays through at the Hollow Gate", () => {
  for (const id of ['bramble_check_done', 'hollow_open', 'bramble_hollow_done', 'bramble_wipe_done', 'bramble_charge_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'hollow_gate', 'start');
    const bramble = w.map.npcs.find((n) => n.id === 'bramble');
    w.body.x = bramble.x - 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.equal(w.map.npcs.find((n) => n.id === 'bramble').x, bramble.x, `${id}: Bramble is back at his post`);
  }
});

test('the endings for Rook, Mira, Lulu and Granny Kelp play through where each of them stands', () => {
  for (const [id, mapId, who] of [['rook_harpies_done', 'harbor', 'rook'], ['letter_done', 'sprout', 'mira'], ['winter_done', 'sprout', 'lulu'], ['kelp_done', 'lagoon', 'kelp']]) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, mapId, 'start');
    const giver = w.map.npcs.find((n) => n.id === who);
    assert.ok(giver, `${who} stands on ${mapId}`);
    w.body.x = giver.x - 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test('the new main-story scenes play through where their givers stand', () => {
  for (const [id, mapId, who] of [['ch2_found', 'harbor', 'rook'], ['ch4_road', 'harbor', 'vex'], ['ch6_sky', 'grove', 'elowen'], ['ch6_stars', 'grove', 'elowen'], ['ch7_rook', 'sprout', 'mira']]) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, mapId, 'start');
    const giver = w.map.npcs.find((n) => n.id === who);
    assert.ok(giver, `${who} stands on ${mapId}`);
    w.body.x = giver.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test('the new chapter 2 and 3 scenes play through where Mira and Bramble stand', () => {
  for (const [id, mapId, who] of [['ch2_sour_open', 'sprout', 'mira'], ['ch2_festival', 'sprout', 'mira'], ['ch3_root_open', 'hollow_gate', 'bramble'], ['ch3_root_done', 'hollow_gate', 'bramble']]) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, mapId, 'start');
    const giver = w.map.npcs.find((n) => n.id === who);
    w.body.x = giver.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("chapter 4's scenes play through where Elowen stands", () => {
  for (const id of ['party_open', 'party_invite', 'party_clocks']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'grove', 'start');
    const elowen = w.map.npcs.find((n) => n.id === 'elowen');
    w.body.x = elowen.x - 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("chapter 5's new scenes play through at Tidepool Pier where Marina stands", () => {
  for (const id of ['tide_open', 'tide_done', 'coralie_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'tidepool_pier', 'start');
    const marina = w.map.npcs.find((n) => n.id === 'marina');
    w.body.x = marina.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("chapter 6's new scenes play through at the Carnival Gates where Tock stands", () => {
  for (const id of ['fair_open', 'fair_done', 'gearheart_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'carnival_gate', 'start');
    const tock = w.map.npcs.find((n) => n.id === 'tock');
    w.body.x = tock.x - 70;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("chapter 7's scenes play through at Nim's shop, and Elowen and Mira come for the twist", () => {
  for (const id of ['charts_open', 'charts_done', 'falling_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'grove', 'start');
    const nim = w.map.npcs.find((n) => n.id === 'nim');
    const elowenX = w.map.npcs.find((n) => n.id === 'elowen').x;
    w.body.x = nim.x + 60;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    assert.ok(!w.map.npcs.some((n) => n.id === 'mira'), `${id}: Mira goes home to Sprout`);
    assert.equal(w.map.npcs.find((n) => n.id === 'elowen').x, elowenX, `${id}: Elowen goes back to her tower`);
  }
});

test("chapter 8's new scenes play through on the Sugar Trail where Chef Praline stands", () => {
  for (const id of ['dessert_open', 'dessert_done', 'bonbon_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'sugar_trail', 'start');
    const praline = w.map.npcs.find((n) => n.id === 'praline');
    w.body.x = praline.x - 70;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("chapter 9's new scenes play through on Theatre Row where Madame Encore stands", () => {
  for (const id of ['encore_open', 'encore_done', 'playwright_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'theatre_row', 'start');
    const encore = w.map.npcs.find((n) => n.id === 'encore');
    w.body.x = encore.x - 70;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test("chapter 10's whale scenes play through at Cloudcatch Pier where Skipper Nimbus stands", () => {
  for (const id of ['whale_open', 'whale_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'cloudcatch_pier', 'start');
    const nimbus = w.map.npcs.find((n) => n.id === 'nimbus');
    w.body.x = nimbus.x - 70;
    playScene(w, id);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
  }
});

test('the finale plays through under the windmill, with the friends you made, and the wind comes back', () => {
  const chains = ['pip_lunch', 'bramble_charge', 'clover_parade', 'tora_cores'];
  for (const finished of [[], chains]) {
    const char = createCharacter('Hana', {});
    for (const q of finished) char.quests[q] = { state: 'done' };
    char.windBack = true;
    const w = createWorld(char);
    loadMap(w, 'sprout', 'start');
    const mira = w.map.npcs.find((n) => n.id === 'mira');
    const miraX = mira.x;
    w.body.x = mira.x + 60;
    playScene(w, 'wind_finale');
    const lines = SCENES[w.scene.id].filter((st) => st.who === 'bramble').length;
    assert.equal(lines > 0, finished.length > 0, 'Bramble only charges in if you finished his story');
    let wasHeld = false;
    let returned = false;
    for (let k = 0; k < 300 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      if (w.windHold) wasHeld = true;
      else if (wasHeld) returned = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, 'the finale finished');
    assert.ok(wasHeld, 'the wind waited for its moment');
    assert.ok(returned, 'and came back during the scene');
    assert.ok(!w.windHold, 'and stays back afterwards');
    assert.ok(Math.abs(w.body.x - 1830) < 80, 'you stand under the windmill');
    assert.equal(w.map.npcs.find((n) => n.id === 'mira').x, miraX, 'Mira goes home to her spot');
    assert.ok(!w.map.npcs.some((n) => ['rook', 'tora', 'elowen', 'nim', 'bramble'].includes(n.id)), 'the guests go home');
    assert.ok(w.map.npcs.every((n) => !n.cine), 'everyone is back to themselves');
  }
});

test("Malvina's villain story plays through at her tower, and the party guests go home after", () => {
  for (const id of ['malv_minion_done', 'malv_well_done', 'malv_mob_done', 'malv_diary_done']) {
    const w = createWorld(createCharacter('Hana', {}));
    loadMap(w, 'sprout', 'start');
    const home = Object.fromEntries(w.map.npcs.map((n) => [n.id, n.x]));
    w.body.x = home.malvina - 120;
    playScene(w, id);
    let performed = false;
    for (let k = 0; k < 300 && w.scene; k++) {
      run(w, 0.5);
      if (w.map.npcs.find((n) => n.id === 'malvina')?.cine?.move) performed = true;
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
    assert.ok(performed, `${id}: Malvina plays her own moves`);
    assert.ok(w.map.npcs.every((n) => !n.cine), `${id}: everyone is back to themselves`);
    for (const n of w.map.npcs) assert.equal(n.x, home[n.id], `${id}: ${n.id} is back where they stand`);
  }
});

// ---------- Nobody hidden behind you ----------

// A stage for the rules about where you can step: the ground steps up at a wall at x 400, a low
// step of a ledge (30 px up) at 150-215, a puddle on the upper ground at 900-1000.
const STAGE = {
  id: '__stage', name: 'Stage', width: 1200, height: 480, groundY: 440,
  terrain: [[0, 440], [400, 440], [400, 360], [1200, 360]],
  platforms: [{ x: 150, y: 410, w: 65 }],
  water: [{ x1: 900, x2: 1000, y: 352 }],
  ropes: [], portals: [{ id: 'start', x: 100, y: 440, hidden: true }], spawns: [],
  npcs: [{ id: 'kestrel', x: 420 }, { id: 'pip', x: 880 }, { id: 'mira', x: 180 }, { id: 'lulu', x: 600 }, { id: 'posy', x: 664 }],
};
function onStage(x, y, facing) {
  const w = inSprout();
  w.map = STAGE;
  Object.assign(w.body, { x, y, facing, onGround: true, surface: null, vx: 0, vy: 0 });
  return w;
}

test('a scene never opens with you standing on top of someone in it: you step aside and face them', () => {
  SCENES.__aside = [{ who: 'kestrel', text: 'Hm. Good posture. You will do.' }, { emote: 'kestrel', kind: '!' }];
  // Walked in from the right and stopped right on Kestrel: you step back out to the right.
  for (const [dx, facing, side] of [[6, -1, 1], [-8, 1, -1], [0, 1, -1], [0, -1, 1]]) {
    const w = inSprout();
    const k = w.map.npcs.find((n) => n.id === 'kestrel');
    w.body.x = k.x + dx;
    w.body.facing = facing;
    const y = w.body.y;
    playScene(w, '__aside');
    run(w, 1.5);
    const gap = (w.body.x - k.x) * side;
    assert.ok(gap >= ROOM && gap < 60, `from ${dx} facing ${facing}: beside her on the side you came from (${w.body.x - k.x})`);
    assert.equal(w.body.facing, -side, 'turned to face her');
    assert.equal(w.body.y, y, 'on the same floor');
    assert.equal(w.body.vx, 0, 'standing still again');
    assert.equal(w.cine.say, null);
    assert.ok(w.scene, 'while her first line is still up');
  }
  // Not in her way, or standing on someone the scene doesn't use: you stay where you are.
  for (const [who, dx] of [['kestrel', 60], ['posy', 0]]) {
    const w = inSprout();
    w.body.x = w.map.npcs.find((n) => n.id === who).x + dx;
    const x = w.body.x;
    playScene(w, '__aside');
    run(w, 1);
    assert.equal(w.body.x, x, `${who} ${dx}: no need to move`);
  }
  delete SCENES.__aside;
});

test('stepping aside never goes into the pond, through a wall, off a ledge or onto someone else', () => {
  SCENES.__aside = [{ who: 'posy', text: 'Everything must go!' }, { who: 'kestrel', text: '...' }, { who: 'mira', text: 'Hello!' }, { who: 'lulu', text: 'Darling!' }, { emote: 'pip', kind: 'sweat' }];
  // Posy's stall stands at the edge of Sprout's duck pond: from the pond side you step away from it.
  const w = inSprout();
  const posy = w.map.npcs.find((n) => n.id === 'posy');
  w.body.x = posy.x + 6;
  w.body.facing = -1;
  playScene(w, '__aside');
  run(w, 1.5);
  assert.ok(posy.x - w.body.x >= ROOM, `away from the pond (${w.body.x - posy.x})`);
  assert.equal(waterAt(w.map, w.body.x), null);
  assert.equal(w.body.facing, 1, 'facing her');
  // Kestrel stands just past a wall: you never step back through it, you go round her side.
  let s = onStage(415, 360, 1);
  playScene(s, '__aside');
  run(s, 1.5);
  assert.ok(s.body.x - 420 >= ROOM && s.body.y === 360, `the far side of her, up on her floor (${s.body.x})`);
  // Someone else standing on the side you came from: the other side.
  s = onStage(606, 360, -1);
  playScene(s, '__aside');
  run(s, 1.5);
  assert.ok(600 - s.body.x >= ROOM && Math.abs(s.body.x - 664) >= ROOM, `round the other side, clear of Posy (${s.body.x})`);
  // On a little ledge over Mira with nowhere on it to go: you stay up there rather than fall off.
  s = onStage(185, 410, 1);
  playScene(s, '__aside');
  run(s, 1.5);
  assert.equal(s.body.x, 185, 'stays on the ledge');
  assert.equal(s.body.y, 410);
  // Pip stands by a puddle: never into it.
  s = onStage(882, 360, -1);
  playScene(s, '__aside');
  run(s, 1.5);
  assert.ok(880 - s.body.x >= ROOM, `away from the puddle (${s.body.x})`);
  delete SCENES.__aside;
});

test('a scene that moves you itself takes over from stepping aside, and skipping lands you beside them', () => {
  SCENES.__aside = [{ walk: 'player', to: 'kestrel', gap: 60 }, { who: 'kestrel', text: 'Over here.' }];
  let w = inSprout();
  const k = w.map.npcs.find((n) => n.id === 'kestrel');
  w.body.x = k.x - 4;
  w.body.facing = 1;
  playScene(w, '__aside');
  run(w, 2);
  assert.ok(Math.abs(w.body.x - (k.x - 60)) < 1, `where the scene walked you (${w.body.x - k.x})`);
  SCENES.__aside2 = [{ who: 'kestrel', text: 'Hm.' }];
  w = inSprout();
  w.body.x = k.x + 3;
  playScene(w, '__aside2');
  advanceScene(w, true);
  assert.equal(w.scene, null);
  assert.ok(w.body.x - k.x >= ROOM, 'skipped: you end up beside her all the same');
  delete SCENES.__aside;
  delete SCENES.__aside2;
});

test("the real scenes open with the giver in sight: Kestrel's new path and Mira's welcome", () => {
  for (const [id, who] of [['job_archer', 'kestrel'], ['ch1_hello', 'mira'], ['kestrel_targets_done', 'kestrel']]) {
    const w = inSprout();
    const n = w.map.npcs.find((q) => q.id === who);
    w.body.x = n.x + 2;
    w.body.facing = -1;
    playScene(w, id, { job: 'Acrobat Archer' });
    run(w, 1.2);
    assert.ok(Math.abs(w.body.x - n.x) >= ROOM, `${id}: you stand beside ${who}, not on her`);
    for (let k = 0; k < 200 && w.scene; k++) {
      run(w, 0.5);
      if (w.cine) w.cine.go = true;
      const step = w.scene && SCENES[w.scene.id][w.scene.i];
      if (step && (step.card || (typeof step.text === 'string' && step.say === undefined))) advanceScene(w);
    }
    assert.equal(w.scene, null, `${id} finished`);
  }
});

test("standing on someone, your name tag drops under theirs instead of covering it", async () => {
  const { tagDrop } = await import('../src/render/scene.js');
  // Kestrel's tag under her feet at x 320; yours (narrower) right on top of it.
  const kestrel = [{ x: 296, y: 302, w: 48, h: 11 }];
  const drop = tagDrop(322, 300, 26, kestrel);
  assert.equal(drop, 12, 'a row lower');
  assert.ok(300 + drop + 2 >= 302 + 11, 'clear of hers');
  assert.equal(tagDrop(380, 300, 26, kestrel), 0, 'beside her, it stays under your feet');
  assert.equal(tagDrop(322, 300, 26, []), 0, 'nobody there');
});
