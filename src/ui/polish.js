// Tora's forge: polish a piece of the gear you're wearing (core/items.js polish). The eight worn
// pieces on the left, each with its polish shown as little stars; on the right the picked piece:
// what the next step adds, the chance it takes, its price, and the Polish button. Sparks fly when a
// step takes; a puff of smoke when it doesn't.

import { NPCS } from '../data/npcs.js';
import { EQUIP_SLOTS } from '../data/items.js';
import { itemName, POLISH_MAX, polishChance, polishCost, polishGain, polish } from '../core/items.js';
import { COLORS, windowFrame, text, box, button, itemSlot, hover, clicked, tooltip, sparkle, icon, wrap } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { sfx } from '../audio/sfx.js';

const W = 300;
const H = 214;
const NAMES = { watk: 'Weapon ATK', matk: 'Magic ATK', wdef: 'Weapon DEF', hp: 'Max HP', mp: 'Max MP' };

export function polishWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  if (!dlg.placedPolish) {
    win.x = Math.round((640 - W) / 2);
    win.y = Math.max(20, 326 - H - 8);
    dlg.placedPolish = true;
  }
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Forge`, { theme: 'peach', icon: 'star' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const worn = EQUIP_SLOTS.map((slot) => ({ slot, inst: char.equipment[slot] })).filter((e) => e.inst);
  if (!worn.some((e) => e.slot === dlg.polishSlot)) dlg.polishSlot = worn[0]?.slot ?? null;
  const x = win.x + 10;
  const y = win.y + 28;
  if (!worn.length) {
    wrap(ctx, "Wear something first, then I'll put a shine on it!", x, y + 20, W - 20, { size: 9 });
    return;
  }
  // The worn pieces, two columns of four.
  worn.forEach((e, i) => {
    const cx = x + (i % 2) * 52;
    const cy = y + Math.floor(i / 2) * 42;
    const on = e.slot === dlg.polishSlot;
    box(ctx, cx, cy, 48, 38, { fill: on ? '#fff3c4' : '#ffffff', edge: on ? COLORS.select : th.light, r: 8, width: on ? 2 : 1 });
    itemSlot(ctx, cx + 14, cy + 3, 20, e.inst, { shadow: false });
    for (let k = 0; k < Math.min(POLISH_MAX, e.inst.polish ?? 0); k++) sparkle(ctx, cx + 6 + (k % 5) * 9, cy + 28 + Math.floor(k / 5) * 5, 1.8, '#f0b53a');
    if (hover(ui, cx, cy, 48, 38)) tooltip(ui, itemTooltip(char, e.inst.id, e.inst));
    if (clicked(ui, cx, cy, 48, 38)) dlg.polishSlot = e.slot;
  });

  // The picked piece.
  const inst = char.equipment[dlg.polishSlot];
  const px = x + 112;
  const pw = W - 132;
  const n = inst.polish ?? 0;
  text(ctx, itemName(inst), px, y + 10, { size: 9, bold: true, color: COLORS.ink });
  for (let k = 0; k < POLISH_MAX; k++) {
    const sx = px + 6 + k * 15;
    ctx.globalAlpha = k < n ? 1 : 0.3;
    sparkle(ctx, sx, y + 24, k < n ? 4 : 3, k < n ? '#f0b53a' : '#c9b6ff');
    ctx.globalAlpha = 1;
  }
  text(ctx, `Polish +${n} / ${POLISH_MAX}`, px, y + 42, { size: 8, bold: true, color: th.dark });
  // A spark burst (or smoke) for a moment after a try.
  const since = world.now - (dlg.polishAt ?? -9);
  if (since < 0.8) {
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const d = 8 + since * 50;
      ctx.globalAlpha = 1 - since / 0.8;
      if (dlg.polishOk) sparkle(ctx, px + 70 + Math.cos(a) * d, y + 24 + Math.sin(a) * d * 0.5, 2.6, k % 2 ? '#ffe36b' : '#ffffff');
      else {
        ctx.fillStyle = '#c9c0d8';
        ctx.beginPath();
        ctx.arc(px + 70 + Math.cos(a) * d * 0.5, y + 20 - since * 20 + Math.sin(a) * 4, 4 + since * 6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
  }
  if (n >= POLISH_MAX) {
    wrap(ctx, "That's as bright as it gets. A masterpiece!", px, y + 62, pw, { size: 8.5 });
    return;
  }
  const gain = Object.entries(polishGain(inst)).map(([k, v]) => `${NAMES[k] ?? k} +${v}`).join(', ');
  text(ctx, 'Next step', px, y + 60, { size: 7.5, bold: true, color: COLORS.muted });
  text(ctx, gain, px, y + 71, { size: 8.5, bold: true, color: '#3f9f5f' });
  text(ctx, `Chance ${Math.round(polishChance(inst) * 100)}%`, px, y + 87, { size: 8.5, bold: true });
  const cost = polishCost(inst);
  icon(ctx, 'coin', px + 4, y + 98, 8, COLORS.gold);
  text(ctx, `${cost.toLocaleString()} gold`, px + 11, y + 101, { size: 8.5, bold: true, color: char.gold >= cost ? COLORS.gold : COLORS.bad });
  wrap(ctx, "If it doesn't take, you only lose the gold.", px, y + 116, pw, { size: 7, color: COLORS.muted });
  if (button(ui, px, y + 136, 80, 20, 'Polish', { primary: true, enabled: char.gold >= cost, iconName: 'star' })) {
    const r = polish(char, inst);
    dlg.polishAt = world.now;
    dlg.polishOk = r.ok;
    if (r.ok) {
      world.log(`${itemName(inst)} is now polished to +${inst.polish}!`, '#ffe36b');
      sfx('itemGet');
    } else world.log("Tora: Hm, didn't take that time. Try again?", '#ffb3c6');
  }
}
