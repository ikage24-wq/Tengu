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

test('a moved, resized HUD piece takes the mouse with it, and hidden ones see no clicks', async () => {
  const { piece, intoPiece } = await import('../src/ui/layout.js');
  const had = settings.layout;
  const ctx = { save() {}, restore() {}, translate() {}, scale() {}, beginPath() {}, rect() {}, clip() {} };
  const mouse = { x: 0, y: 0, clicked: true, down: true, right: false, double: false, wheel: 0 };
  const ui = { ctx, mouse };
  try {
    settings.layout = { hotkeys: { dx: -100, dy: -200, s: 2 }, log: { hide: true } };
    let seen = null;
    Object.assign(mouse, { x: 300 + 10, y: 100 + 10 });
    piece(ui, 'hotkeys', { x: 400, y: 300, w: 100, h: 20 }, () => { seen = [mouse.x, mouse.y]; });
    assert.deepEqual(seen, [405, 305], 'a point 10 px into the moved, doubled piece is 5 px into it');
    assert.deepEqual(intoPiece('hotkeys', 310, 110), [405, 305]);
    piece(ui, 'log', { x: 0, y: 200, w: 100, h: 50 }, () => { seen = mouse.clicked; });
    assert.equal(seen, false);
    assert.equal(mouse.clicked, true, "the click is still there for whatever's under it");
  } finally {
    settings.layout = had;
  }
});
