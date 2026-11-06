// Portal signs stay whole on screen by a gate at either edge of the view, their tail on the gate.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { signSpot } from '../src/render/scenery.js';

test('a portal sign stays whole on screen by a gate at the view edge, and its tail points at the gate', () => {
  const VIEW = 640;
  // The Practice Field sign on Dawnlight Beach, its gate 24 px in from the right edge.
  let s = signSpot(616, 110, VIEW);
  assert.ok(s.bx >= 4 && s.bx + 110 <= VIEW - 4, `whole on screen (${s.bx})`);
  assert.equal(s.tip, 616, 'tail right over the gate');
  assert.equal(s.lean, 1);
  assert.equal(s.alpha, 1);
  // Crystal Cave's sign at the left edge of Sprout Village.
  s = signSpot(40, 100, VIEW);
  assert.equal(s.bx, 4);
  assert.equal(s.tip, 40);
  // In the open it sits centred over its gate, with no tail.
  assert.deepEqual(signSpot(320, 100, VIEW), { bx: 270, lean: 0, tip: 320, alpha: 1 });
  // Sweeping a gate across the view and out past both edges: the sign is never cut off, slides and
  // fades smoothly, points at the gate while the gate is in view, and is gone once the gate is.
  let last = null;
  for (let x = -60; x <= VIEW + 60; x += 0.25) {
    const { bx, lean, tip, alpha } = signSpot(x, 110, VIEW);
    if (alpha > 0) assert.ok(bx >= 4 && bx + 110 <= VIEW - 4, `whole on screen at ${x}`);
    if (last) {
      assert.ok(Math.abs(bx - last.bx) <= 1, `no jump at ${x}`);
      assert.ok(Math.abs(lean - last.lean) <= 0.2 && Math.abs(alpha - last.alpha) <= 0.05, `no pop at ${x}`);
    }
    assert.ok(tip >= bx + 10 && tip <= bx + 100, `tail under the sign at ${x}`);
    if (x >= 14 && x <= VIEW - 14) assert.equal(tip, x, `pointing at the gate at ${x}`);
    if (x >= 0 && x <= VIEW) assert.equal(alpha, 1, `fully shown while the gate's middle is in view (${x})`);
    if (x <= -30 || x >= VIEW + 30) assert.equal(alpha, 0, `gone with the gate at ${x}`);
    last = { bx, lean, alpha };
  }
});
