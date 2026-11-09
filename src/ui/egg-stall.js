// The egg stall by your Mochi Garden's gate (world/garden-life.js): three eggs of its own each day,
// drawn as they'll sit by the gate (render/wagashi.js), so you can read them before you buy: the
// rarer the egg, the stronger its tint, and rare ones glint. Buy one and it's set down by the gate,
// ready to rock and hatch. Walk away and the window closes.

import { rollMochi } from '../data/mochi-genes.js';
import { drawMochiEgg } from '../render/wagashi.js';
import { stallEggs, stallSold, buyStallEgg, STALL_X, EGG_PRICE, EGG_SLOTS } from '../world/garden-life.js';
import { COLORS, windowFrame, text, box, button, hover, tooltip } from './kit.js';

const W = 250;
const H = 150;
const genes = new Map();
const genesOf = (seed) => {
  if (!genes.has(seed)) genes.set(seed, rollMochi(seed));
  return genes.get(seed);
};

export function eggStallWindow(ui, state, world) {
  const win = state.windows.eggs;
  if (!world.map.garden || world.map.indoor || world.gardenVisit || Math.abs(world.body.x - STALL_X) > 80) {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Egg Stall')) return;
  const { ctx } = ui;
  const char = world.char;
  const x = win.x + 10;
  const y = win.y + 30;
  text(ctx, "Today's eggs. Read them: the rare ones glint!", x, y + 4, { size: 6.5, color: COLORS.muted });
  const seeds = stallEggs(char);
  const sold = stallSold(char);
  const full = (char.garden?.eggs ?? []).length >= EGG_SLOTS.length;
  const cw = (W - 28) / 3;
  seeds.forEach((seed, i) => {
    const cx = x + i * (cw + 4);
    const gone = sold.includes(i);
    box(ctx, cx, y + 10, cw, 92, { fill: gone ? '#f6f0ee' : '#fffaf2', edge: '#f0d8c0', r: 8, width: 1 });
    if (!gone) drawMochiEgg(ctx, cx + cw / 2, y + 66, genesOf(seed), world.now, 1.4);
    else text(ctx, 'Sold', cx + cw / 2, y + 52, { size: 8, bold: true, align: 'center', color: COLORS.muted });
    if (gone) return;
    const why = full ? 'No room by the gate: hatch one first.' : char.gold < EGG_PRICE ? `It costs ${EGG_PRICE.toLocaleString()} gold.` : null;
    if (button(ui, cx + 6, y + 80, cw - 12, 16, `${EGG_PRICE.toLocaleString()} g`, { primary: !why, enabled: !why, size: 7.5 })) {
      const no = buyStallEgg(world, i);
      if (no) world.log(no, '#ffb3c6');
    }
    if (why && hover(ui, cx + 6, y + 80, cw - 12, 16)) tooltip(ui, [{ text: why, color: COLORS.bad }]);
  });
  text(ctx, `New eggs tomorrow · you have ${char.gold.toLocaleString()} gold`, win.x + W / 2, win.y + H - 10, { size: 6.5, align: 'center', color: COLORS.muted });
}
