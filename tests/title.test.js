import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GAGS, THIEF } from '../src/ui/title-peek.js';
import { NPCS } from '../src/data/npcs.js';

test('the title screen peekers are real island folk, each with short lines of their own', () => {
  const said = new Set();
  for (const g of [...GAGS, THIEF]) {
    assert.ok(g.who === 'hayate' || NPCS[g.who], `${g.who} lives on the island`);
    assert.ok(['up', 'side', 'top', 'thief'].includes(g.kind), `${g.who} pops in a known way`);
    for (const line of g.lines) {
      assert.ok(line.length <= 60, `"${line}" fits the bubble`);
      assert.ok(!said.has(line), `"${line}" is said only once`);
      said.add(line);
    }
  }
});

test('the title show stars real island folk and spells the name on its blocks', async () => {
  const { TITLE } = await import('../src/ui/title-show.js');
  assert.equal(TITLE.length, 2);
  for (const word of TITLE) assert.match(word, /^[A-Z]+$/);
  // Who's in the show stays out of the close-ups (they're busy on stage).
  for (const g of GAGS) assert.ok(!['encore', 'pip', 'nim', 'tora'].includes(g.who), `${g.who} isn't also on stage`);
});
