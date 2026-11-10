// Kinako's costumes (ui/npc.js, her "Mochi costumes"): the dress-up she sells (data/mochi-dress.js,
// the ones with a price; the Tsukimi Usagi only at night, at her secret stall). On the left, one of
// your Mochi trying the picked costume on, big, in a photo (arrows: your other Mochi); on the right,
// her costumes as cards, each with its price or "Yours". Buy it and every Mochi of yours can wear it
// (the Mochi page's "Wears").

import { DRESS, dressOpen } from '../data/mochi-dress.js';
import { NPCS } from '../data/npcs.js';
import { isNight } from '../world/daytime.js';
import { sfx } from '../audio/sfx.js';
import { COLORS, windowFrame, text, button, hover, clicked, roundRect, icon, tooltip } from './kit.js';
import { portraitCard, tag, heading } from './mochi-kit.js';

const W = 344;
const H = 232;
// (Each Mochi trying each costume on keeps its own record, so its portrait keeps its animation.)
const fitting = new Map();
const tryOn = (rec, id) => {
  const key = `${rec.seed}|${id}`;
  let r = fitting.get(key);
  if (!r) fitting.set(key, (r = { ...rec, dress: id }));
  return r;
};

export const forSale = (world) => Object.keys(DRESS).filter((id) => DRESS[id].price && (!DRESS[id].secret || isNight(world)));

export function dressShopWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  if (!dlg.placedDress) {
    win.x = Math.round((640 - W) / 2);
    win.y = Math.max(20, 326 - H - 8);
    dlg.placedDress = true;
  }
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Outfits`, { theme: 'peach', icon: 'hanger' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  const ids = forSale(world);
  dlg.pickDress = ids.includes(dlg.pickDress) ? dlg.pickDress : ids[0];
  const mochi = (char.garden?.mochi ?? []).filter((r) => r.stage !== 'egg');
  dlg.who = Math.max(0, Math.min(mochi.length - 1, dlg.who ?? 0));
  const x = win.x + 10;
  const y = win.y + 28;
  // ---- Left: trying it on.
  const pw = 118;
  const ph = 150;
  if (mochi.length) {
    portraitCard(ctx, tryOn(mochi[dlg.who], dlg.pickDress), x, y, pw, ph, world.now, { scale: 2.5, ribbon: false });
    text(ctx, mochi[dlg.who].name ?? 'Your Mochi', x + pw / 2, y + ph + 12, { size: 7.5, bold: true, align: 'center' });
    if (mochi.length > 1) {
      if (button(ui, x, y + ph + 18, 22, 14, '<', { size: 8 })) dlg.who = (dlg.who + mochi.length - 1) % mochi.length;
      if (button(ui, x + pw - 22, y + ph + 18, 22, 14, '>', { size: 8 })) dlg.who = (dlg.who + 1) % mochi.length;
      text(ctx, `${dlg.who + 1} / ${mochi.length}`, x + pw / 2, y + ph + 28, { size: 6.5, align: 'center', color: COLORS.muted });
    }
  } else {
    text(ctx, 'Hatch a Mochi first', x + pw / 2, y + ph / 2, { size: 7.5, bold: true, align: 'center', color: COLORS.muted });
  }
  // ---- Right: her costumes.
  const rx = x + pw + 10;
  const rw = W - 20 - pw - 10;
  heading(ctx, isNight(world) ? 'Outfits (and a secret one!)' : 'Outfits', rx, y, rw);
  ids.forEach((id, i) => {
    const d = DRESS[id];
    const cy = y + 12 + i * 27;
    const on = dlg.pickDress === id;
    const owned = dressOpen(char, id);
    const over = hover(ui, rx, cy, rw, 24);
    ctx.fillStyle = on ? (d.secret ? '#f0e8ff' : '#fff0f6') : over ? '#fffafc' : '#ffffff';
    roundRect(ctx, rx, cy, rw, 24, 8);
    ctx.fill();
    ctx.strokeStyle = on ? (d.secret ? '#a88ae0' : '#ff8fb8') : '#f0dce6';
    ctx.lineWidth = on ? 1.4 : 1;
    ctx.stroke();
    icon(ctx, d.secret ? 'moon' : 'hanger', rx + 11, cy + 12, 9, d.secret ? '#8a6ad0' : '#e0659f');
    text(ctx, d.name, rx + 22, cy + 10.5, { size: 7.5, bold: true });
    text(ctx, d.secret ? 'Secret: only after dark' : 'Every Mochi of yours can wear it', rx + 22, cy + 19, { size: 5.8, color: COLORS.muted });
    if (owned) tag(ctx, 'Yours', rx + rw - 6, cy + 12, '#62c072', { align: 'right' });
    else {
      icon(ctx, 'coin', rx + rw - 46, cy + 12, 7, '#e0a82a');
      text(ctx, d.price.toLocaleString(), rx + rw - 6, cy + 14.6, { size: 7, bold: true, align: 'right', color: char.gold >= d.price ? '#c89a20' : COLORS.bad });
    }
    if (clicked(ui, rx, cy, rw, 24)) dlg.pickDress = id;
  });
  // ---- Buy the picked one.
  const d = DRESS[dlg.pickDress];
  const by = win.y + H - 26;
  if (d) {
    const owned = dressOpen(char, dlg.pickDress);
    const short = !owned && char.gold < d.price;
    const label = owned ? 'Already yours' : `Buy ${d.name}`;
    if (button(ui, rx, by, rw, 18, label, { primary: !owned && !short, enabled: !owned && !short, size: 8, iconName: owned ? 'check' : 'coin' })) {
      char.gold -= d.price;
      (char.dressBought ??= []).push(dlg.pickDress);
      world.log(`You bought the ${d.name}! Dress a Mochi in it from its page (Wears).`, '#ffc2d4');
      sfx('buy');
    }
    if (short && hover(ui, rx, by, rw, 18)) tooltip(ui, [{ text: `It costs ${d.price.toLocaleString()} gold.`, color: COLORS.bad }]);
  }
  text(ctx, `You have ${char.gold.toLocaleString()} gold`, rx + rw / 2, by - 5, { size: 6.5, align: 'center', color: COLORS.muted });
}
