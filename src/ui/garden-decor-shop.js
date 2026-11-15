// Kinako's garden things (ui/npc.js, her "Garden decorations"): the Mochi Garden set (data/furniture.js),
// for gold. On the left the piece picked, big, turning its own little life (the fountain playing,
// the pinwheels spinning), what it's for and what the Mochi do with it; on the right the set as
// cards, each with its price and how many you have. Buy one and it's in your bag: set it out in
// your garden with Decorate (Y).

import { GARDEN_DECOR } from '../data/furniture.js';
import { NPCS } from '../data/npcs.js';
import { countItem, addItem } from '../core/inventory.js';
import { drawPiece, drawPieceIcon } from '../render/furniture.js';
import { sfx } from '../audio/sfx.js';
import { say } from './chat.js';
import { COLORS, windowFrame, text, button, box, clicked, fit } from './kit.js';
import { heading } from './mochi-kit.js';

const W = 344;
const H = 214;
// (What the Mochi do with each, said plainly.)
const USE = {
  sit: 'Two Mochi sit on it together',
  shade: 'A Mochi naps in its shade',
  gaze: 'Mochi come to watch the water',
  picnic: 'Mochi share a snack on it',
  sniff: 'Mochi sniff its flowers',
};
const gold = (n) => n.toLocaleString('en-GB');

export function gardenShopWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  if (!dlg.placedDecor) {
    win.x = Math.round((640 - W) / 2);
    win.y = Math.max(20, 326 - H - 8);
    dlg.placedDecor = true;
  }
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Garden Things`, { theme: 'peach', icon: 'gift' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const all = GARDEN_DECOR();
  dlg.pickDecor = all.some((f) => f.id === dlg.pickDecor) ? dlg.pickDecor : all[0].id;
  const pick = all.find((f) => f.id === dlg.pickDecor);
  const x = win.x + 10;
  const y = win.y + 28;
  // ---- Left: the piece, big, on a little patch of grass.
  const pw = 112;
  const ph = 104;
  box(ctx, x, y, pw, ph, { fill: '#eaf6ea', edge: '#bfe0c4', r: 8 });
  ctx.fillStyle = '#9fd87a';
  ctx.fillRect(x + 6, y + ph - 22, pw - 12, 3);
  ctx.fillStyle = '#c8945a';
  ctx.fillRect(x + 6, y + ph - 19, pw - 12, 12);
  const k = Math.min(1.9, (pw - 24) / pick.w, (ph - 34) / (pick.h + 4));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, y + 2, pw - 4, ph - 4);
  ctx.clip();
  ctx.translate(x + pw / 2, y + ph - 22);
  ctx.scale(k, k);
  drawPiece(ctx, { id: pick.id, x: 0, y: 0 }, 0, 0, world.now, { night: 0 });
  ctx.restore();
  text(ctx, pick.name, x + pw / 2, y + ph + 11, { size: 8, bold: true, align: 'center' });
  text(ctx, fit(ctx, pick.use ? USE[pick.use] : 'Just for looking lovely', pw, 6.5, false), x + pw / 2, y + ph + 21, { size: 6.5, align: 'center', color: '#3f8a4c' });
  // (Its description, wrapped into two lines.)
  const words = pick.desc.split(' ');
  const lines = [''];
  ctx.font = '6px Nunito, sans-serif';
  for (const wd of words) {
    const tryLine = lines.at(-1) ? `${lines.at(-1)} ${wd}` : wd;
    if (ctx.measureText(tryLine).width > pw && lines.length < 3) lines.push(wd);
    else lines[lines.length - 1] = tryLine;
  }
  lines.slice(0, 3).forEach((ln, i) => text(ctx, ln, x + pw / 2, y + ph + 31 + i * 8, { size: 6, align: 'center', color: COLORS.muted }));
  // ---- Right: the set, as cards.
  const rx = x + pw + 10;
  const rw = W - 20 - pw - 10;
  heading(ctx, 'For your Mochi Garden', rx, y, rw);
  const cw = (rw - 4) / 2;
  all.forEach((f, i) => {
    const cx = rx + (i % 2) * (cw + 4);
    const cy = y + 10 + Math.floor(i / 2) * 31;
    const on = f.id === dlg.pickDecor;
    box(ctx, cx, cy, cw, 28, { fill: on ? '#fff0f6' : '#ffffff', edge: on ? '#ff8fb0' : '#f0dce4', r: 6, width: on ? 1.5 : 1 });
    drawPieceIcon(ctx, f.id, cx + 2, cy + 2, 24, world.now);
    text(ctx, fit(ctx, f.name, cw - 30, 6.8, true), cx + 28, cy + 11, { size: 6.8, bold: true });
    text(ctx, `${gold(f.price)}g`, cx + 28, cy + 21, { size: 6.5, color: char.gold >= f.price ? '#c08a2a' : '#c0607a', bold: true });
    const have = countItem(char.inventory, f.id);
    if (have) text(ctx, `x${have}`, cx + cw - 4, cy + 21, { size: 6, align: 'right', color: COLORS.muted });
    if (clicked(ui, cx, cy, cw, 28)) dlg.pickDecor = f.id;
  });
  // ---- Buy it.
  const by = win.y + H - 24;
  text(ctx, `Your gold: ${gold(char.gold)}g`, rx, by + 10, { size: 6.5, color: COLORS.muted });
  const can = char.gold >= pick.price;
  if (button(ui, rx + rw - 110, by, 110, 16, `Buy · ${gold(pick.price)}g`, { size: 7.5, primary: can, iconName: 'gift' })) {
    if (!can) say(world, dlg.id, 'Save up a little more, dear!');
    else if (addItem(char.inventory, pick.id, 1)) {
      char.gold -= pick.price;
      sfx('buy');
      say(world, dlg.id, `Lovely choice! Set it out in your garden with Decorate (Y).`);
    } else say(world, dlg.id, 'Your bag is full, dear!');
  }
}
