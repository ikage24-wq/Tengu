// The egg stall by your Mochi Garden's gate (world/garden-life.js): three eggs of its own each day,
// drawn as they'll sit by the gate (render/wagashi.js), so you can read them before you buy: the
// rarer the egg, the stronger its tint, and rare ones glint. Buy one and it's set down by the gate,
// ready to rock and hatch. Walk away and the window closes.

import { rollMochi } from '../data/mochi-genes.js';
import { drawMochiEgg } from '../render/wagashi.js';
import { stallEggs, stallSold, buyStallEgg, STALL_X, EGG_PRICE, EGG_SLOTS } from '../world/garden-life.js';
import { COLORS, windowFrame, text, button, hover, tooltip, roundRect, photoCorners, icon } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 300;
const H = 196;
const genes = new Map();
const genesOf = (seed) => {
  if (!genes.has(seed)) genes.set(seed, rollMochi(seed));
  return genes.get(seed);
};
// Each egg sits in a straw nest on a little card of its own soft colour, framed like a photo.
const CARD_SKY = [['#ffe4ee', '#fff6f0'], ['#e4f0ff', '#f6fbff'], ['#eaf6e0', '#fafff4']];

export function eggStallWindow(ui, state, world) {
  const win = state.windows.eggs;
  if (!world.map.garden || world.map.indoor || world.gardenVisit || Math.abs(world.body.x - STALL_X) > 80) {
    win.open = false;
    return;
  }
  if (!windowFrame(ui, win, W, H, 'Egg Stall', { icon: 'gift' })) return;
  const { ctx } = ui;
  const char = world.char;
  const x = win.x + 10;
  const y = win.y + 28;
  heading(ctx, "Today's eggs", x, y, W - 20);
  text(ctx, 'Read them before you buy: the rarer the egg, the deeper its tint, and rare ones glint.', x, y + 16, { size: 6, color: COLORS.muted });
  const seeds = stallEggs(char);
  const sold = stallSold(char);
  const have = (char.garden?.eggs ?? []).length;
  const full = have >= EGG_SLOTS.length;
  const cw = (W - 20 - 12) / 3;
  const cy = y + 24;
  const ch = 118;
  seeds.forEach((seed, i) => {
    const cx = x + i * (cw + 6);
    const gone = sold.includes(i);
    const on = !gone && hover(ui, cx, cy, cw, ch);
    // The card: a soft shadow, white, a sky inside in its own colour, photo corners.
    ctx.fillStyle = 'rgba(70,40,90,0.13)';
    roundRect(ctx, cx + 1.5, cy + 2.5, cw, ch, 9);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    roundRect(ctx, cx, cy - (on ? 2 : 0), cw, ch, 9);
    ctx.fill();
    const top = cy - (on ? 2 : 0);
    const [a, b] = CARD_SKY[i % CARD_SKY.length];
    const g = ctx.createLinearGradient(0, top + 4, 0, top + 82);
    g.addColorStop(0, gone ? '#f2eeee' : a);
    g.addColorStop(1, gone ? '#faf8f8' : b);
    ctx.fillStyle = g;
    roundRect(ctx, cx + 4, top + 4, cw - 8, 80, 6);
    ctx.fill();
    photoCorners(ctx, cx + 3, top + 3, cw - 6, 82, on ? '#ff9ec0' : '#f0c8d8', 6);
    if (gone) {
      text(ctx, 'Sold!', cx + cw / 2, top + 46, { size: 9, bold: true, align: 'center', color: '#c8a8b8' });
      text(ctx, 'Gone to a good home', cx + cw / 2, top + 98, { size: 6, align: 'center', color: COLORS.muted });
      return;
    }
    // The straw nest: a woven oval under the egg.
    const nx = cx + cw / 2;
    const ny = top + 70;
    ctx.fillStyle = '#d8a860';
    ctx.beginPath();
    ctx.ellipse(nx, ny, 20, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b88440';
    ctx.lineWidth = 0.8;
    for (let k = -3; k <= 3; k++) {
      ctx.beginPath();
      ctx.ellipse(nx + k * 4.6, ny + 0.5, 3.4, 4.6, 0.6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#f0cc84';
    ctx.beginPath();
    ctx.ellipse(nx, ny - 2.4, 15, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    drawMochiEgg(ctx, nx, ny - 2, genesOf(seed), world.now, 1.5);
    text(ctx, `Egg ${i + 1}`, cx + cw / 2, top + 96, { size: 7.5, bold: true, align: 'center' });
    const why = full ? 'No room by the gate: hatch one first.' : char.gold < EGG_PRICE ? `It costs ${EGG_PRICE.toLocaleString()} gold.` : null;
    if (button(ui, cx + 7, top + ch - 18, cw - 14, 15, `${EGG_PRICE.toLocaleString()}`, { primary: !why, enabled: !why, size: 7.5, iconName: 'coin' })) {
      const no = buyStallEgg(world, i);
      if (no) world.log(no, '#ffb3c6');
    }
    if (why && hover(ui, cx + 7, top + ch - 18, cw - 14, 15)) tooltip(ui, [{ text: why, color: COLORS.bad }]);
  });
  // Underneath: room by the gate (a nest each), and your gold.
  const by = win.y + H - 14;
  text(ctx, 'By the gate:', x, by + 3, { size: 6.5, bold: true, color: '#a8467a' });
  for (let k = 0; k < EGG_SLOTS.length; k++) {
    ctx.fillStyle = k < have ? '#ffb3cf' : '#f4e6ee';
    ctx.beginPath();
    ctx.ellipse(x + 56 + k * 12, by, 4, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  icon(ctx, 'coin', x + W - 92, by, 8, '#e0a82a');
  text(ctx, `${char.gold.toLocaleString()} gold`, x + W - 84, by + 3, { size: 7, bold: true, color: '#c89a20' });
  text(ctx, 'New eggs tomorrow', x + W / 2 - 10, by + 3, { size: 6, align: 'center', color: COLORS.muted });
}
