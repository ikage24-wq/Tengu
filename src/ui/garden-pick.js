// Whose Mochi Garden? The way into the Garden asks, when friends online have gardens of their own
// (world/garden-life.js gardenGateUp): your own, or one of theirs (net/visit.js: their game sends
// theirs over). Walk away from the way in and it closes.

import { loadMap } from '../world/world.js';
import { askGardenVisit, gardenFriends } from '../net/visit.js';
import { COLORS, windowFrame, text, hover, clicked, roundRect, icon } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 220;
// A garden to go to, as a card: a round plate with its icon, whose garden, a line under it.
function gardenCard(ui, x, y, w, title, sub, ico, color, primary) {
  const { ctx } = ui;
  const on = hover(ui, x, y, w, 26);
  ctx.fillStyle = 'rgba(70,40,90,0.12)';
  roundRect(ctx, x + 1, y + 2, w, 26, 9);
  ctx.fill();
  ctx.fillStyle = on ? '#fff0f6' : primary ? '#fff6fa' : '#ffffff';
  roundRect(ctx, x, y - (on ? 1 : 0), w, 26, 9);
  ctx.fill();
  ctx.strokeStyle = on ? '#ff8fb8' : primary ? '#ffb3cf' : '#ecdce8';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  const top = y - (on ? 1 : 0);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 14, top + 13, 8.5, 0, Math.PI * 2);
  ctx.fill();
  icon(ctx, ico, x + 14, top + 13, 10, '#ffffff');
  text(ctx, title, x + 28, top + 11.5, { size: 8, bold: true });
  text(ctx, sub, x + 28, top + 21, { size: 6, color: COLORS.muted });
  icon(ctx, 'door', x + w - 13, top + 13, 9, on ? '#ff6f9a' : '#d8b8c8');
  return clicked(ui, x, y, w, 26);
}

export function gardenPickWindow(ui, state, world) {
  const win = state.windows.gardenpick;
  const gate = world.gardenGate;
  const friends = gardenFriends().slice(0, 5);
  if (!gate || world.map.garden || Math.abs(world.body.x - gate.x) > 60 || !friends.length) {
    win.open = false;
    return;
  }
  const H = 50 + (friends.length + 1) * 31;
  if (!windowFrame(ui, win, W, H, 'Mochi Garden', { icon: 'leaf' })) return;
  const { ctx } = ui;
  const x = win.x + 10;
  let y = win.y + 28;
  heading(ctx, 'Whose garden?', x, y, W - 20);
  y += 13;
  const mine = world.char.garden;
  const n = mine?.mochi?.length ?? 0;
  if (gardenCard(ui, x, y, W - 20, mine ? 'Your Mochi Garden' : 'Your own Mochi Garden', mine ? `${n} Mochi waiting for you` : 'New! Start your own', 'heart', '#ff8fb8', true)) {
    win.open = false;
    world.gardenGate = null;
    loadMap(world, 'garden', gate.toPortal);
    world.log(`Entered ${world.map.name}.`, '#cfe8ff');
    return;
  }
  for (const g of friends) {
    y += 31;
    if (gardenCard(ui, x, y, W - 20, `${g.name}'s Mochi Garden`, 'Visit: pet and play with theirs', 'friends', '#9a82d8', false)) {
      win.open = false;
      world.gardenGate = null;
      const why = askGardenVisit(world, g.id);
      if (why) world.log(why, '#ffb3c6');
      return;
    }
  }
}
