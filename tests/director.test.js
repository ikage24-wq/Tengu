// The cutscene director (world/director.js): scenes staged in the world itself. People walk, the
// camera pans, emotes and bubbles show, the world's own clock stays paused, Esc plays the rest out
// at once, and afterwards everyone is back where they belong.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SCENES } from '../src/data/story.js';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { playScene, advanceScene } from '../src/world/story.js';

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
