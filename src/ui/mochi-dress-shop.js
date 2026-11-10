// Kinako's costumes (ui/npc.js, her "Mochi costumes"): the dress-up she sells (data/mochi-dress.js,
// the ones with a price; the secret ones only at night, at his secret stall). On the left, one of
// your Mochi trying the picked costume on, big, in a photo (arrows: your other Mochi); on the right,
// his outfits as cards, each with its price or "Yours". Buy it and every Mochi of yours can wear it
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
    // (Close up, so the glasses and the little things show; a baby closer still.)
    const baby = mochi[dlg.who].stage === 'mochiko';
    portraitCard(ctx, tryOn(mochi[dlg.who], dlg.pickDress), x, y, pw, ph, world.now, { scale: baby ? 3.2 : 2.7, drop: baby ? 14 : 18, ribbon: false });
    text(ctx, mochi[dlg.who].name ?? 'Your Mochi', x + pw / 2, y + ph + 12, { size: 7.5, bold: true, align: 'center' });
    if (mochi.length > 1) {
      if (button(ui, x, y + ph + 18, 22, 14, '<', { size: 8 })) dlg.who = (dlg.who + mochi.length - 1) % mochi.length;
      if (button(ui, x + pw - 22, y + ph + 18, 22, 14, '>', { size: 8 })) dlg.who = (dlg.who + 1) % mochi.length;
      text(ctx, `${dlg.who + 1} / ${mochi.length}`, x + pw / 2, y + ph + 28, { size: 6.5, align: 'center', color: COLORS.muted });
    }
  } else {
    text(ctx, 'Hatch a Mochi first', x + pw / 2, y + ph / 2, { size: 7.5, bold: true, align: 'center', color: COLORS.muted });
  }
  // ---- Right: his outfits.
  const rx = x + pw + 10;
  const rw = W - 20 - pw - 10;
  heading(ctx, isNight(world) ? 'Outfits (and secret ones!)' : 'Outfits', rx, y, rw);
  // (Two columns of cards: there are a dozen of them now.)
  const cw = (rw - 4) / 2;
  ids.forEach((id, i) => {
    const d = DRESS[id];
    const cx = rx + (i % 2) * (cw + 4);
    const cy = y + 12 + Math.floor(i / 2) * 25;
    const on = dlg.pickDress === id;
    const owned = dressOpen(char, id);
    const over = hover(ui, cx, cy, cw, 23);
    ctx.fillStyle = on ? (d.secret ? '#f0e8ff' : '#fff0f6') : over ? '#fffafc' : '#ffffff';
    roundRect(ctx, cx, cy, cw, 23, 8);
    ctx.fill();
    ctx.strokeStyle = on ? (d.secret ? '#a88ae0' : '#ff8fb8') : '#f0dce6';
    ctx.lineWidth = on ? 1.4 : 1;
    ctx.stroke();
    icon(ctx, d.secret ? 'moon' : 'hanger', cx + 9, cy + 11.5, 8, d.secret ? '#8a6ad0' : '#e0659f');
    text(ctx, d.name, cx + 18, cy + 9.6, { size: 6.6, bold: true });
    if (owned) text(ctx, 'Yours', cx + 18, cy + 19, { size: 6.4, bold: true, color: '#62c072' });
    else {
      icon(ctx, 'coin', cx + 21, cy + 16.6, 6, '#e0a82a');
      text(ctx, d.price.toLocaleString(), cx + 26, cy + 19, { size: 6.4, bold: true, color: char.gold >= d.price ? '#c89a20' : COLORS.bad });
    }
    if (clicked(ui, cx, cy, cw, 23)) dlg.pickDress = id;
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
