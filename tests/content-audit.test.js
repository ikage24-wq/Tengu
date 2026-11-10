// Every quest can be reached and handed in, for every job family, and no shop sells anything
// another shop buys back for more (the dev kits' audits, dev/kits3.js, run as tests).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installKits3 } from '../src/dev/kits3.js';

const t = {};
installKits3(t);

test('every quest is sound, reachable and can be handed in, for every job family', () => {
  const r = t.questWalk();
  assert.equal(r.dataProblems, 'none', JSON.stringify(r.dataProblems));
  assert.equal(r.failedToHandIn, 'none', JSON.stringify(r.failedToHandIn));
  assert.equal(r.neverReached, 'none', JSON.stringify(r.neverReached));
});

test('no shop sells something another buys back for more, and every price is sane', () => {
  const r = t.economy();
  assert.equal(r.profit, 'no buy-low, sell-high loops', JSON.stringify(r.profit));
  assert.equal(r.odd, 'nothing odd', JSON.stringify(r.odd));
});

test('a Mochi raised with care evolves, is reborn and never gets broken numbers', () => {
  const [life] = t.mochiLife(1, 45);
  assert.equal(life.broken, 'none');
  assert.ok(life.steps.some((s) => s.includes('evolved')), life.steps.join('; '));
  assert.ok(life.steps.some((s) => s.includes('reborn')), life.steps.join('; '));
});
