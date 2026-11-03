// Tora's forge: polish a piece of the gear you're wearing (core/items.js polish). The eight worn
// pieces on the left, each with its polish shown as little stars; on the right the picked piece:
// what the next step adds, the chance it takes, ore to make it likelier (mined, data/gathering.js),
// its price, and the Polish button. Sparks fly when a
// step takes; a puff of smoke when it doesn't.

import { NPCS } from '../data/npcs.js';
import { EQUIP_SLOTS } from '../data/items.js';
import { itemName, POLISH_MAX, polishCost, polishGain, polish, oreFor, POLISH_GEMS, POLISH_ORES, POLISH_STONES, ORE_USE, boostedChance, stonesFor } from '../core/items.js';
import { drawItemIcon } from '../render/icons.js';
import { countItem } from '../core/inventory.js';
import { ITEMS } from '../data/items.js';
import { COLORS, windowFrame, text, box, button, itemSlot, hover, clicked, tooltip, sparkle, icon, wrap, fit, font } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { sfx } from '../audio/sfx.js';

const W = 300;
const H = 214;
const NAMES = { watk: 'Weapon ATK', matk: 'Magic ATK', wdef: 'Weapon DEF', hp: 'Max HP', mp: 'Max MP' };

// Bench-made polishing stones in the bag that fit the piece: the two best (one chip each).
// The gems shown: the best one or two you carry (or the rose quartz, so you know gems help).
const bestGems = (char) => {
  const held = POLISH_GEMS.filter((g) => countItem(char.inventory, g.id) > 0).sort((a, b) => b.boost - a.boost).slice(0, 2);
  return (held.length ? held : POLISH_GEMS.slice(0, 1)).map((g) => ({ id: g.id, need: 1 }));
};
const bestStones = (char, inst) => stonesFor(inst).filter((g) => countItem(char.inventory, g.id) > 0).sort((a, b) => b.boost - a.boost).slice(0, 2).map((g) => ({ id: g.id, need: 1 }));

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
  // Ore for this piece's level, or a rare gem: click one to use it on the next tries.
  const boosts = [oreFor(inst) && { id: oreFor(inst).id, need: ORE_USE }, ...bestGems(char), ...bestStones(char, inst)].filter(Boolean);
  const have = (b) => countItem(char.inventory, b.id) >= b.need;
  if (dlg.boost && !boosts.some((b) => b.id === dlg.boost && have(b))) dlg.boost = null;
  text(ctx, `Chance ${Math.round(boostedChance(inst, dlg.boost) * 100)}%`, px, y + 86, { size: 8.5, bold: true, color: dlg.boost ? '#3f9f5f' : COLORS.ink });
  const cost = polishCost(inst);
  text(ctx, `${cost.toLocaleString()} gold`, px + pw, y + 86, { size: 8.5, bold: true, align: 'right', color: char.gold >= cost ? COLORS.gold : COLORS.bad });
  ctx.font = font(8.5, true);
  icon(ctx, 'coin', px + pw - ctx.measureText(`${cost.toLocaleString()} gold`).width - 6, y + 83, 8, COLORS.gold);
  // One tidy row of chips: each ore, gem or stone as its own icon with the chance it adds; the
  // picked one sits on a bold green rim with a check. Its name (and what it costs a try) shows
  // under the row for the one picked or pointed at.
  const raw = (id) => (POLISH_ORES.find((o) => o.id === id) ?? POLISH_GEMS.find((o) => o.id === id) ?? POLISH_STONES.find((o) => o.id === id))?.boost ?? 0;
  const cw = Math.min(44, (pw - (boosts.length - 1) * 4) / Math.max(1, boosts.length));
  let named = boosts.find((b) => b.id === dlg.boost) ?? null;
  boosts.forEach((b, i) => {
    const bx = px + i * (cw + 4);
    const by = y + 92;
    const on = dlg.boost === b.id;
    const ok = have(b);
    const hot = hover(ui, bx, by, cw, 18);
    if (hot) named = b;
    ctx.globalAlpha = ok ? 1 : 0.45;
    box(ctx, bx, by, cw, 18, { fill: on ? '#e2f8da' : hot && ok ? '#fffaf2' : '#ffffff', edge: on ? '#3f9f5f' : th.light, r: 7, width: on ? 2 : 1 });
    drawItemIcon(ctx, b.id, bx + 2, by + 2, 0.875);
    text(ctx, `+${Math.round(raw(b.id) * 100)}%`, bx + cw - 3, by + 12.5, { size: 7.5, bold: true, align: 'right', color: on ? '#3f9f5f' : COLORS.ink });
    if (on) {
      ctx.fillStyle = '#3f9f5f';
      ctx.beginPath();
      ctx.arc(bx + cw - 2, by + 1, 3.5, 0, Math.PI * 2);
      ctx.fill();
      icon(ctx, 'check', bx + cw - 2, by + 1, 5, '#ffffff');
    }
    ctx.globalAlpha = 1;
    if (ok && clicked(ui, bx, by, cw, 18)) dlg.boost = on ? null : b.id;
  });
  if (named) {
    const n = countItem(char.inventory, named.id);
    const line = `${ITEMS[named.id].name} · +${Math.round(raw(named.id) * 100)}% · uses ${named.need} a try (have ${n})`;
    text(ctx, fit(ctx, line, pw, 7, true), px, y + 120, { size: 7, bold: true, color: have(named) ? (dlg.boost === named.id ? '#3f9f5f' : th.dark) : COLORS.bad });
    text(ctx, have(named) ? (dlg.boost === named.id ? "Lost with the gold if it doesn't take." : 'Tap to use it on the next tries.') : 'You need more: mine it on the fields.', px, y + 130, { size: 7, color: COLORS.muted });
  } else wrap(ctx, "If it doesn't take, you only lose the gold. Ore or a gem makes it likelier.", px, y + 120, pw, { size: 7, color: COLORS.muted, lineHeight: 10 });
  if (button(ui, px, y + 138, 80, 20, 'Polish', { primary: true, enabled: char.gold >= cost, iconName: 'star' })) {
    const r = polish(char, inst, Math.random, dlg.boost ?? null);
    dlg.polishAt = world.now;
    dlg.polishOk = r.ok;
    if (r.ok) {
      world.log(`${itemName(inst)} is now polished to +${inst.polish}!`, '#ffe36b');
      sfx('itemGet');
    } else world.log("Tora: Hm, didn't take that time. Try again?", '#ffb3c6');
  }
}
