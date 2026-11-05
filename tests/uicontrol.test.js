import { test } from 'node:test';
import assert from 'node:assert/strict';
import { settings, DEFAULT_SETTINGS } from '../src/core/settings.js';
import { createUiState } from '../src/ui/manager.js';

test('windows come back where you left them; talk boxes and trades never fold or wander', () => {
  const had = settings.windowPos;
  settings.windowPos = { bag: { x: 420, y: 90, min: true }, quests: { x: 9999, y: -50 } };
  try {
    const s = createUiState();
    assert.deepEqual([s.windows.bag.x, s.windows.bag.y, s.windows.bag.moved, s.windows.bag.key], [420, 90, true, 'bag']);
    assert.ok(s.windows.quests.x <= 600 && s.windows.quests.y >= 8, 'a spot off the screen is pulled back on');
    assert.equal(s.windows.npc.key, undefined);
    assert.equal(s.windows.trade.key, undefined);
  } finally {
    settings.windowPos = had;
  }
});

test('the layout settings start in their usual places', () => {
  assert.deepEqual(DEFAULT_SETTINGS.windowPos, {});
  assert.equal(DEFAULT_SETTINGS.minimapSize, 'normal');
  assert.equal(DEFAULT_SETTINGS.minimapPos, null);
  assert.equal(DEFAULT_SETTINGS.minimapMin, false);
});
