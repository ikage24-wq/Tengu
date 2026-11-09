// Whose Mochi Garden? The way into the Garden asks, when friends online have gardens of their own
// (world/garden-life.js gardenGateUp): your own, or one of theirs (net/visit.js: their game sends
// theirs over). Walk away from the way in and it closes.

import { loadMap } from '../world/world.js';
import { askGardenVisit, gardenFriends } from '../net/visit.js';
import { COLORS, windowFrame, text, button } from './kit.js';

const W = 200;

export function gardenPickWindow(ui, state, world) {
  const win = state.windows.gardenpick;
  const gate = world.gardenGate;
  const friends = gardenFriends().slice(0, 5);
  if (!gate || world.map.garden || Math.abs(world.body.x - gate.x) > 60 || !friends.length) {
    win.open = false;
    return;
  }
  const H = 52 + (friends.length + 1) * 20;
  if (!windowFrame(ui, win, W, H, 'Mochi Garden')) return;
  const { ctx } = ui;
  const x = win.x + 12;
  let y = win.y + 30;
  text(ctx, 'Whose garden?', x, y + 4, { size: 7, bold: true, color: COLORS.muted });
  y += 10;
  if (button(ui, x, y, W - 24, 16, world.char.garden ? 'Your Mochi Garden' : 'Your own (new!) Mochi Garden', { primary: true, size: 8 })) {
    win.open = false;
    world.gardenGate = null;
    loadMap(world, 'garden', gate.toPortal);
    world.log(`Entered ${world.map.name}.`, '#cfe8ff');
    return;
  }
  for (const g of friends) {
    y += 20;
    if (button(ui, x, y, W - 24, 16, `${g.name}'s Mochi Garden`, { size: 8 })) {
      win.open = false;
      world.gardenGate = null;
      const why = askGardenVisit(world, g.id);
      if (why) world.log(why, '#ffb3c6');
      return;
    }
  }
}
