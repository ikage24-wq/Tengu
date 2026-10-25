// The Cash Shop (O, or the gift button): outfits bought with Cash. Pick a slot, click a piece to
// try it on in the fitting room (your hero, wearing your gear, outfit, and whatever you're trying),
// pick its color, and buy it to wear it right away. Outfits only change your look.

import { ITEMS, variantsFor } from '../data/items.js';
import { CASH_ITEMS, OUTFIT_SLOTS, OUTFIT_STYLES, cashPrice } from '../data/cash.js';
import { wornGear, wearOutfit } from '../core/character.js';
import { makeCash, itemName } from '../core/items.js';
import { addItem } from '../core/inventory.js';
import { drawHero } from '../render/hero.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, tabs, text, box, button, hover, clicked, tooltip, well, icon, sparkle } from './kit.js';
import { itemTooltip } from './tooltips.js';

const LABELS = ['Hat', 'Top', 'Bottom', 'Shoes', 'Gloves', 'Cape', 'Earrings', 'Weapon'];
const COLS = 4;
const ROWS = 3;
const PINK = '#d0559a';

const STYLE_LABELS = ['All', 'Casual', 'Swim', 'Funny', 'Fantasy'];

// The catalog for a slot: casual, swim, and funny lines first, then the fantasy costumes (one-of-a-
// kind looks, then each job's by level) and covers.
const styleRank = (d) => OUTFIT_STYLES.indexOf(d.style);
const bySlot = Object.fromEntries(OUTFIT_SLOTS.map((slot) => [slot, CASH_ITEMS.filter((id) => ITEMS[id].slot === slot)
  .sort((a, b) => styleRank(ITEMS[a]) - styleRank(ITEMS[b]) || Number(Boolean(ITEMS[a].family)) - Number(Boolean(ITEMS[b].family)) || ITEMS[a].cash - ITEMS[b].cash)]));

export function cashShopWindow(ui, state, world) {
  const win = state.windows.cashshop;
  const W = 360;
  const H = 250;
  if (!windowFrame(ui, win, W, H, 'Cash Shop')) {
    win.tryOn = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const th = ui.theme;
  win.tryOn ??= {};
  win.cat ??= 0;

  // Fitting room.
  const lx = win.x + 8;
  const ly = win.y + 24;
  well(ctx, lx, ly, 112, 150, th);
  const facing = win.turned ? -1 : 1;
  drawHero(ctx, char.appearance, wornGear(char, win.tryOn), lx + 56, ly + 138, { pose: win.walk ? 'walk' : 'idle', time: world.now, scale: 2.2, facing, job: char.job });
  if (button(ui, lx + 4, ly + 4, 24, 12, '⟲', { size: 8 })) win.turned = !win.turned;
  if (button(ui, lx + 30, ly + 4, 30, 12, win.walk ? 'Stand' : 'Walk', { size: 6.5 })) win.walk = !win.walk;
  if (Object.keys(win.tryOn).length && button(ui, lx + 78, ly + 4, 30, 12, 'Reset', { size: 6.5 })) win.tryOn = {};
  box(ctx, lx, ly + 156, 112, 16, { fill: '#ffe6f2', edge: '#ff8fc1', r: 8 });
  icon(ctx, 'star', lx + 10, ly + 164, 9, '#ff6fae');
  text(ctx, `${(char.cash ?? 0).toLocaleString()} Cash`, lx + 60, ly + 167.5, { size: 9, bold: true, align: 'center', color: PINK });
  text(ctx, 'Earn Cash by leveling up', lx + 56, ly + 184, { size: 6.5, align: 'center', color: COLORS.muted });
  text(ctx, 'and finishing quests.', lx + 56, ly + 193, { size: 6.5, align: 'center', color: COLORS.muted });

  // Slots and catalog.
  const rx = win.x + 128;
  const was = `${win.cat}|${win.style}`;
  win.style = tabs(ui, rx, win.y + 24, STYLE_LABELS, win.style ?? 0, { w: 42.6, h: 12 });
  // Two rows of slot tabs act as one set: a click in either row picks that slot.
  const in1 = win.cat < 4 ? win.cat : -1;
  const in2 = win.cat >= 4 ? win.cat - 4 : -1;
  const row1 = tabs(ui, rx, win.y + 42, LABELS.slice(0, 4), in1, { w: 53, h: 12 });
  const row2 = tabs(ui, rx, win.y + 58, LABELS.slice(4), in2, { w: 53, h: 12 });
  if (row1 !== in1) win.cat = row1;
  else if (row2 !== in2) win.cat = row2 + 4;
  if (`${win.cat}|${win.style}` !== was) win.scroll = 0;
  const slot = OUTFIT_SLOTS[win.cat];
  const style = win.style ? OUTFIT_STYLES[win.style - 1] : null;
  const list = style ? bySlot[slot].filter((id) => ITEMS[id].style === style) : bySlot[slot];
  const cw = 55;
  const ch = 38;
  const gy = win.y + 76;
  const rowsTotal = Math.ceil(list.length / COLS);
  if (hover(ui, rx, gy, COLS * cw, ROWS * ch)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(rowsTotal - ROWS, win.scroll ?? 0));
  const trying = win.tryOn[slot];
  list.slice(win.scroll * COLS, (win.scroll + ROWS) * COLS).forEach((id, i) => {
    const def = ITEMS[id];
    const x = rx + (i % COLS) * cw;
    const y = gy + Math.floor(i / COLS) * ch;
    const on = trying?.id === id;
    const hot = hover(ui, x, y, cw - 3, ch - 3);
    const owned = char.outfit?.[slot]?.id === id || char.inventory.cash.some((e) => e.id === id);
    box(ctx, x, y, cw - 3, ch - 3, { fill: on ? '#fff0f7' : hot ? '#ffffff' : '#fffaf6', edge: on ? '#ff6fae' : '#f3d6e6', r: 7, width: on ? 2 : 1 });
    drawItemIcon(ctx, id, x + cw / 2 - 13.5, y + 3, 1.5, on ? trying.variant : null);
    text(ctx, `${cashPrice(def, on ? trying.variant : null).toLocaleString()}`, x + cw / 2 - 1.5, y + ch - 7, { size: 6.5, bold: true, align: 'center', color: PINK });
    if (owned) {
      box(ctx, x + 2, y + 2, 13, 8, { fill: '#7ee0a8', edge: null, r: 4 });
      text(ctx, '✓', x + 8.5, y + 8.5, { size: 6, bold: true, align: 'center', color: '#ffffff' });
    }
    if (hot) tooltip(ui, [...itemTooltip(char, id, on && trying.variant ? { id, variant: trying.variant } : null), { text: on ? 'Trying it on' : 'Click to try on', size: 7, color: COLORS.muted }]);
    if (clicked(ui, x, y, cw - 3, ch - 3)) win.tryOn = { ...win.tryOn, [slot]: on ? undefined : { id, variant: null } };
  });
  if (win.tryOn[slot] === undefined) delete win.tryOn[slot];
  if (!list.length) text(ctx, 'Nothing in this style for this slot yet.', rx + (COLS * cw) / 2, gy + 50, { size: 8, align: 'center', color: COLORS.muted });
  if (rowsTotal > ROWS) text(ctx, `rows ${win.scroll + 1}-${Math.min(rowsTotal, win.scroll + ROWS)} of ${rowsTotal} · scroll`, rx + COLS * cw - 4, gy + ROWS * ch + 4, { size: 6, align: 'right', color: COLORS.muted });

  // The piece being tried on: its colors, its price, and buying it.
  const by = win.y + H - 52;
  box(ctx, rx, by, COLS * cw - 3, 44, { fill: '#fffaf6', edge: '#f3d6e6', r: 8, width: 1 });
  const pick = win.tryOn[slot];
  if (!pick) {
    text(ctx, 'Click a piece to try it on.', rx + (COLS * cw) / 2, by + 25, { size: 8, align: 'center', color: COLORS.muted });
    return;
  }
  const def = ITEMS[pick.id];
  text(ctx, itemName({ id: pick.id, variant: pick.variant }), rx + 8, by + 12, { size: 8, bold: true, color: PINK });
  const variants = variantsFor(def);
  if (variants) {
    [null, ...Object.keys(variants)].forEach((k, i) => {
      const cx = rx + 13 + i * 13;
      const cy = by + 26;
      const sel = (pick.variant ?? null) === k;
      const hot = hover(ui, cx - 5.5, cy - 5.5, 11, 11);
      ctx.fillStyle = sel ? '#4a3560' : hot ? '#b9a2d6' : 'rgba(74,53,96,0.25)';
      ctx.beginPath();
      ctx.arc(cx, cy, sel ? 5.4 : 4.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = k ? variants[k].main : def.color;
      ctx.beginPath();
      ctx.arc(cx, cy, sel ? 4 : 3.6, 0, Math.PI * 2);
      ctx.fill();
      if (hot) tooltip(ui, [{ text: k ? variants[k].name : 'Standard', bold: true }]);
      if (clicked(ui, cx - 5.5, cy - 5.5, 11, 11)) win.tryOn = { ...win.tryOn, [slot]: { id: pick.id, variant: k } };
    });
  } else text(ctx, 'One look only.', rx + 8, by + 29, { size: 7, color: COLORS.muted });
  const cost = cashPrice(def, pick.variant);
  const afford = (char.cash ?? 0) >= cost;
  icon(ctx, 'star', rx + COLS * cw - 98, by + 13, 8, '#ff6fae');
  text(ctx, `${cost.toLocaleString()} Cash`, rx + COLS * cw - 91, by + 16, { size: 8, bold: true, color: afford ? PINK : COLORS.bad });
  if (button(ui, rx + COLS * cw - 100, by + 22, 92, 16, 'Buy & Wear', { primary: true, enabled: afford, size: 8 })) {
    const inst = makeCash(pick.id, pick.variant);
    if (!addItem(char.inventory, inst)) world.log('Your Cash tab is full.', '#ffb3c6');
    else {
      char.cash -= cost;
      wearOutfit(char, char.inventory.cash.indexOf(inst));
      delete win.tryOn[slot];
      world.log(`Bought ${itemName(inst)}! You're wearing it now.`, '#ff8fc1');
      world.fx.push({ kind: 'buff', x: world.body.x, y: world.body.y, t: 0, dur: 0.8, color: '#ff8fc1' });
      sparkle(ctx, lx + 56, ly + 70, 8, '#ff8fc1');
    }
  }
}
