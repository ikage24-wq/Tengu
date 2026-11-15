// The Mochi Show (world/mochi-show.js, data/mochi-show.js): Up by the show tent in the Mochi Market,
// a show run through - each of the four on the runway in turn, the judges' cards, the results - the
// prize and the ribbon, a win opening the next rank, and back out to the tent.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCharacter } from '../src/core/character.js';
import { createWorld, updateWorld, loadMap } from '../src/world/world.js';
import { rollMochi, STATS } from '../src/data/mochi-genes.js';
import { newRecord } from '../src/data/mochi-raise.js';
import { startShow, showTentUp, STAGE } from '../src/world/mochi-show.js';
import { styleScore, charmScore, talentScore, cardsFor, showRivals, showOpen, SHOW_ORDER, ACT_ORDER, ACT_LEN, actSkill, actTier } from '../src/data/mochi-show.js';
import { MARKET } from '../src/world/market.js';

const keys = (pressed = []) => ({ held: new Set(), pressed: new Set(pressed) });
const mochi = (seed, { stage = 'grown', personality = 'showoff', bond = 0, tricks = [], wear = {}, dress = null, points = 600 } = {}) => {
  const rec = newRecord(rollMochi(seed, { coat: null }));
  Object.assign(rec, { stage, personality, bond, tricks, wear, dress, mood: 80, name: 'Puff' });
  for (const st of STATS) Object.assign(rec.stats[st], { points, level: Math.round(points / 21) });
  return rec;
};
function atTent(...recs) {
  const char = createCharacter('Mina', { hairStyle: 'bob' });
  char.garden = { back: null, mochi: recs, eggs: [], unlocked: {} };
  const w = createWorld(char);
  w.log = () => {};
  loadMap(w, 'mochi_market', 'start');
  w.body.x = MARKET.show;
  return w;
}

test('the judges see what they judge: a finer outfit, a closer Mochi, more tricks all score higher', () => {
  const plain = mochi(1);
  const dressed = mochi(1, { wear: { top: 'sailor', bottom: 'tartan', shoes: Object.keys({})[0], hat: 'beret' } });
  assert.ok(styleScore(dressed) > styleScore(plain) + 2, `${styleScore(dressed)} vs ${styleScore(plain)}`);
  assert.ok(styleScore(mochi(1, { dress: 'starry' })) > styleScore(dressed), 'a fine costume beats middling pieces');
  assert.ok(charmScore(mochi(2, { bond: 700 })) > charmScore(mochi(2, { bond: 0 })) + 3);
  assert.ok(charmScore(mochi(2, { personality: 'showoff' })) > charmScore(mochi(2, { personality: 'shy' })));
  assert.ok(talentScore(mochi(3, { tricks: ['roll', 'twirl', 'clap', 'hops', 'wave'] })) > talentScore(mochi(3)) + 3);
  // (Each card a whole number 1-10, and the same show always gives the same cards.)
  const cards = cardsFor(mochi(4), 123);
  assert.deepEqual(cards, cardsFor(mochi(4), 123));
  assert.ok(cards.every((c) => Number.isInteger(c) && c >= 1 && c <= 10));
  // (Rivals get stronger rank by rank.)
  const avg = (rank) => [0, 1, 2, 3, 4, 5].flatMap((h) => showRivals(rank, 9000 + h)).reduce((s, r) => s + cardsFor(r.rec, 1).reduce((a, b) => a + b, 0), 0) / 18;
  assert.ok(avg('beginner') < avg('challenge') && avg('challenge') < avg('master'), `${avg('beginner')} ${avg('challenge')} ${avg('master')}`);
});

test('Up by the show tent opens its window; a show runs through every turn to the results, pays out, and back to the tent', () => {
  const star = mochi(77, { personality: 'showoff', bond: 700, tricks: ['backflip', 'twirl', 'clap', 'hops', 'roll', 'wave', 'flaps'], dress: 'starry', points: 2000 });
  const w = atTent(star);
  assert.ok(showTentUp(w), 'Up by the tent');
  assert.ok(w.events.some((e) => e.type === 'show'), 'its window');
  assert.ok(!startShow(w, star, 'master'), 'Master is locked to start with');
  assert.ok(startShow(w, star, 'beginner'));
  const S = w.show;
  assert.equal(w.map.id, 'mochi_show');
  assert.equal(S.cast.length, 4);
  const yours = S.cast.find((c) => c.you);
  assert.ok([1, 2].includes(S.order.indexOf(S.cast.indexOf(yours))), 'yours goes on second or third');
  const seen = [];
  let atMid = 0;
  for (let t = 0; t < 120 && w.show && w.show.phase !== 'done'; t += 1 / 30) {
    updateWorld(w, 1 / 30, keys());
    if (S.phase === 'turn' && !seen.includes(S.turn)) seen.push(S.turn);
    if (S.phase === 'turn' && S.step === 'pose' && Math.abs(S.cast[S.order[S.turn]].x - STAGE.mid) < 0.5) atMid += 1;
  }
  assert.equal(S.phase, 'done');
  assert.deepEqual(seen, [0, 1, 2, 3], 'all four took their turn');
  assert.ok(atMid > 0, 'each poses in the spotlight');
  // (Places follow the cards.)
  const byPlace = [...S.cast].sort((a, b) => a.place - b.place);
  for (let i = 1; i < 4; i++) assert.ok(byPlace[i - 1].total >= byPlace[i].total);
  assert.equal(yours.place, 1, `a star wins a Beginner show: ${S.cast.map((c) => c.total)}`);
  assert.ok(w.char.gold >= S.prize && S.prize > 0);
  assert.equal(star.ribbons.beginner, 'gold');
  assert.ok(showOpen(w.char, 'challenge'), 'the next rank opens');
  // Up: back out to the tent.
  updateWorld(w, 1 / 30, keys(['ArrowUp']));
  assert.equal(w.show, null);
  assert.equal(w.map.id, 'mochi_market');
  assert.ok(Math.abs(w.body.x - MARKET.show) < 2);
});

test('a save made in the hall (no show running) loads back out in the Mochi Market', () => {
  const w = atTent(mochi(9));
  loadMap(w, 'mochi_show', 'start');
  assert.equal(w.map.id, 'mochi_market');
});

test('a little one fresh from its egg can go on too - and does its best', () => {
  const tiny = mochi(5, { stage: 'mochiko', personality: 'shy', points: 120 });
  const w = atTent(tiny);
  assert.ok(startShow(w, tiny, 'beginner'));
  for (let t = 0; t < 120 && w.show.phase !== 'done'; t += 1 / 30) updateWorld(w, 1 / 30, keys());
  const yours = w.show.cast.find((c) => c.you);
  assert.ok(yours.place >= 1 && yours.place <= 4);
  assert.ok(w.show.prize > 0, 'something for going on, whatever the place');
  assert.ok(SHOW_ORDER.length === 3);
});

test('six acts of its own, each done three ways - wobbly, good, dazzling - every one keyed to its length', async () => {
  const { SHOW_ACTS, SHOW_FX } = await import('../src/render/mochi-show-acts.js');
  for (const act of ACT_ORDER.filter((a) => a !== 'trick')) {
    for (const tier of [0, 1, 2]) {
      const name = `${act}${tier}`;
      const bit = SHOW_ACTS[name];
      assert.ok(bit, name);
      assert.equal(bit.dur, ACT_LEN[tier], `${name} runs its length`);
      const ts = bit.keys.map(([t]) => t);
      assert.equal(ts[0], 0, `${name} starts at 0`);
      assert.equal(ts.at(-1), bit.dur, `${name} ends on its last key`);
      assert.ok(ts.every((t, i) => !i || t > ts[i - 1]), `${name}'s keys in order`);
      // (It starts and ends standing as it was, its prop put away: straight on into its bow.)
      const last = bit.keys.at(-1)[1];
      assert.ok(!last.lift && !last.lean && !last.tip && !last.sink && !last.turned, `${name} ends standing`);
      assert.ok(!last.hold, `${name} puts its prop away`);
      // (What the stage does with it happens while it's on.)
      const fx = SHOW_FX[name];
      assert.ok(fx, name);
      const times = [...(fx.notes ?? []).map(([t]) => t), ...(fx.hits ?? []).map(([t]) => t), ...(fx.poofs ?? []).map(([t]) => t), fx.crack, fx.burst, fx.mask, fx.rose].filter((t) => t != null);
      assert.ok(times.every((t) => t > 0 && t < bit.dur), `${name}'s effects inside it`);
    }
  }
});

test('how good a Mochi is at an act: its stat for it, whether it loves it, and its tricks - and that picks the way it does it', () => {
  const base = mochi(11, { personality: 'lazy', points: 300, tricks: [] });
  const strong = mochi(11, { personality: 'lazy', points: 2100, tricks: [] });
  assert.ok(actSkill(strong, 'drum') > actSkill(base, 'drum') + 3, 'Power makes a drummer');
  const lover = mochi(11, { personality: 'brave', points: 300, tricks: [] });
  assert.ok(actSkill(lover, 'drum') > actSkill(base, 'drum') + 2, 'a brave one loves the drum');
  // (A shy one shies from a loud act - but a mime is just right for it.)
  const shy = mochi(11, { personality: 'shy', points: 300, tricks: [] });
  assert.ok(actSkill(shy, 'sing') < actSkill(base, 'sing'));
  assert.ok(actSkill(shy, 'mime') > actSkill(base, 'mime'));
  // (Acting goes by its bond.)
  assert.ok(actSkill(mochi(11, { bond: 700 }), 'act') > actSkill(mochi(11, { bond: 0 }), 'act') + 4);
  assert.equal(actTier(2), 0);
  assert.equal(actTier(6), 1);
  assert.equal(actTier(9), 2);
  // (Its pick goes into its Talent card.)
  const pick = mochi(11, { personality: 'brave', points: 2100, tricks: [] });
  pick.showAct = 'drum';
  assert.equal(talentScore(pick), actSkill(pick, 'drum'));
  pick.showAct = 'trick';
  assert.ok(talentScore(pick) < actSkill(pick, 'drum'));
});

test('on the stage it does its act the way it can, for as long as that takes, then bows', () => {
  const star = mochi(12, { personality: 'brave', points: 2100, bond: 600, tricks: ['roll'] });
  star.showAct = 'drum';
  const w = atTent(star);
  assert.ok(startShow(w, star, 'beginner'));
  const S = w.show;
  const yours = S.cast.find((c) => c.you);
  assert.equal(yours.act, 'drum');
  assert.equal(yours.tier, actTier(actSkill(star, 'drum')));
  let seen = null;
  let talentFor = 0;
  for (let t = 0; t < 120 && S.phase !== 'done'; t += 1 / 30) {
    updateWorld(w, 1 / 30, keys());
    if (S.phase === 'turn' && S.cast[S.order[S.turn]] === yours && S.step === 'talent') {
      seen ??= yours.m.action?.name;
      talentFor += 1 / 30;
    }
  }
  assert.equal(seen, `drum${yours.tier}`);
  assert.ok(Math.abs(talentFor - (ACT_LEN[yours.tier] + 0.1)) < 0.1, `${talentFor}`);
  // (Every rival puts on something of its own too, the way it can.)
  for (const c of S.cast) assert.ok(ACT_ORDER.includes(c.act));
});
