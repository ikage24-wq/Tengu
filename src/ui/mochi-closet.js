// The dressing room: what one of your Mochi wears, picked from everything you own (opened from its
// page, ui/mochi-info.js). On the left the Mochi itself, big, in its little photo; on the right the
// nine places a piece can go (data/mochi-wardrobe.js: hat, eyes, face, top, bottom, dress, shoes,
// over, paws) and its prize costumes (data/mochi-dress.js), each a tab, and under them the pieces
// you own for that place, each standing on a little model the way the clothes stall shows them.
//
// Hover a piece and the Mochi tries it on in its photo, so you see it on this Mochi before you
// pick it; click and it's on, and the Mochi shows it off, there and out in the garden. Click a
// piece it has on and it comes off. A dress takes the place of a top and a bottom (and a top or a
// bottom takes a dress off); a prize costume is the whole look, so putting on a piece takes the
// costume off and putting on a costume covers the pieces until it comes off again.

import { SLOTS, SLOT_NAMES, SETS, TIERS, TIER_NAMES } from '../data/mochi-wardrobe.js';
import { DRESS, dressOpen } from '../data/mochi-dress.js';
import { drawModel } from '../render/shopmodel.js';
import { sfx } from '../audio/sfx.js';
import { VW, VH } from '../input.js';
import { COLORS, windowFrame, text, fit, button, hover, clicked, tooltip, roundRect } from './kit.js';
import { portraitCard, portraitOf, heading } from './mochi-kit.js';

const W = 372;
const H = 262;
const TABS = [...SLOTS, 'costume'];
const TAB_NAMES = { ...SLOT_NAMES, costume: 'Costume' };
// Each tier's colour (as on the clothes stall's cards) and its light; the prize costumes in pink.
const PILL = { beginner: '#a8d8b0', mid: '#8fcfe8', end: '#c8a8f0', elite: '#ffcf5c', costume: '#ff9ec0' };
const SKY = { beginner: '#f2fbf3', mid: '#eef8fc', end: '#f8f2ff', elite: '#fff7e6', costume: '#fff0f6' };
const COLS = 5;
const ROWS = 3;
// Each tile is a close-up on where its piece is worn: the head for a hat, specs or face paint, the
// middle for a top, the feet for shoes, the whole Mochi for a dress or a costume. [How big the
// model is drawn, how far up it (from its feet, out of 1) the middle of the tile looks.]
const FOCUS = {
  hat: [1.6, 0.8], eyes: [2.3, 0.58], face: [2, 0.57],
  top: [2.2, 0.33], over: [1.7, 0.36], hands: [2.1, 0.24],
  bottom: [2.4, 0.17], shoes: [2.6, 0.08], dress: [1.7, 0.27], costume: [1.05, 0.5],
};
// (A model's height at scale 1, feet to the top of its head, in screen pixels: render/shopmodel.js.
// Its head is the top half of it.)
const MODEL_H = 35;

// The pieces you own for `tab`, plainest first, as { id, name, tier }.
function closet(char, tab) {
  if (tab === 'costume') return Object.keys(DRESS).filter((id) => dressOpen(char, id)).map((id) => ({ id, name: DRESS[id].name, tier: 'costume' }));
  const set = SETS[tab];
  return (char.garden?.wardrobe ?? [])
    .filter((id) => set[id])
    .map((id) => ({ id, name: set[id].name, tier: set[id].tier }))
    .sort((a, b) => TIERS.indexOf(a.tier) - TIERS.indexOf(b.tier) || a.name.localeCompare(b.name));
}
// What `rec` would wear with `id` put on in `tab` (or taken off, if it has it on).
export function changed(rec, tab, id) {
  if (tab === 'costume') return { wear: rec.wear ?? {}, dress: rec.dress === id ? null : id };
  const wear = { ...(rec.wear ?? {}) };
  if (wear[tab] === id && !DRESS[rec.dress]) delete wear[tab];
  else {
    wear[tab] = id;
    if (tab === 'dress') {
      delete wear.top;
      delete wear.bottom;
    } else if (tab === 'top' || tab === 'bottom') delete wear.dress;
  }
  return { wear, dress: null };
}
const isOn = (rec, tab, id) => (tab === 'costume' ? rec.dress === id : !DRESS[rec.dress] && rec.wear?.[tab] === id);
const filled = (rec, tab) => (tab === 'costume' ? Boolean(DRESS[rec.dress]) : !DRESS[rec.dress] && Boolean(rec.wear?.[tab]));

export function mochiClosetWindow(ui, state, world) {
  const win = state.windows.closet;
  const rec = world.closetFor;
  const char = world.char;
  if (!rec || world.gardenVisit || !(char.garden?.mochi ?? []).includes(rec)) {
    win.open = false;
    world.closetFor = null;
    return;
  }
  win.x = Math.max(4, Math.min(VW - W - 4, win.x ?? 0));
  win.y = Math.max(4, Math.min(VH - H - 40, win.y ?? 0));
  if (!windowFrame(ui, win, W, H, `Dress ${rec.name ?? 'your Mochi'}`, { icon: 'hanger' })) {
    if (!win.open) world.closetFor = null;
    return;
  }
  const { ctx } = ui;
  const x = win.x + 10;
  const y = win.y + 28;
  const tab = TABS.includes(win.tab) ? win.tab : 'top';
  const items = closet(char, tab);
  const per = COLS * ROWS;
  const pages = Math.max(1, Math.ceil(items.length / per));
  const page = Math.min(win.page ?? 0, pages - 1);

  // ---------- Right: the tabs, then what you own for the one picked ----------
  const rx = x + 124;
  const rw = W - 20 - 124;
  const tw = (rw - 4 * 4) / 5;
  TABS.forEach((t, i) => {
    const tx = rx + (i % 5) * (tw + 4);
    const ty = y + Math.floor(i / 5) * 17;
    if (button(ui, tx, ty, tw, 14, TAB_NAMES[t], { size: 6.5, primary: t === tab })) {
      if (t !== tab) sfx('click');
      win.tab = t;
      win.page = 0;
    }
    // (A pink dot on a tab whose place has something in it.)
    if (filled(rec, t)) {
      ctx.fillStyle = t === tab ? '#ffffff' : '#ff6f9a';
      ctx.beginPath();
      ctx.arc(tx + tw - 3.5, ty + 3.5, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  const gy = y + 40;
  const cw = (rw - (COLS - 1) * 4) / COLS;
  const ch = 52;
  let trying = null;
  if (!items.length) {
    text(ctx, tab === 'costume' ? 'Costumes are won in the races.' : `No ${TAB_NAMES[tab].toLowerCase()} pieces yet.`, rx + rw / 2, gy + 64, { size: 7, bold: true, align: 'center', color: COLORS.muted });
    if (tab !== 'costume') text(ctx, 'The clothes stall on the square has new ones every day.', rx + rw / 2, gy + 76, { size: 6.2, align: 'center', color: COLORS.muted });
  }
  items.slice(page * per, page * per + per).forEach((it, i) => {
    const cx = rx + (i % COLS) * (cw + 4);
    const cy = gy + Math.floor(i / COLS) * (ch + 4);
    const on = isOn(rec, tab, it.id);
    const over = hover(ui, cx, cy, cw, ch);
    const lift = over ? 1 : 0;
    const c = PILL[it.tier] ?? '#e0d0e0';
    ctx.fillStyle = 'rgba(70,40,90,0.12)';
    roundRect(ctx, cx + 1, cy + 1.5, cw, ch, 7);
    ctx.fill();
    ctx.fillStyle = over ? '#ffffff' : SKY[it.tier] ?? '#ffffff';
    roundRect(ctx, cx, cy - lift, cw, ch, 7);
    ctx.fill();
    ctx.strokeStyle = on ? '#ff6f9a' : c;
    ctx.lineWidth = on ? 2 : 1.2;
    ctx.stroke();
    // (The close-up, in its window above the name; its floor, if its feet are in the picture.)
    const [zoom, up] = FOCUS[tab];
    const vh = ch - 13;
    const fy = cy - lift + vh / 2 + up * MODEL_H * zoom;
    ctx.save();
    roundRect(ctx, cx + 1.5, cy + 1.5 - lift, cw - 3, vh - 1.5, 6);
    ctx.clip();
    if (fy < cy + vh) {
      ctx.fillStyle = 'rgba(120,90,70,0.14)';
      ctx.beginPath();
      ctx.ellipse(cx + cw / 2, fy, 5 * zoom, 1.2 * zoom, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawModel(ctx, cx + cw / 2, fy, tab === 'costume' ? { dress: it.id } : { wear: { [tab]: it.id } }, zoom);
    ctx.restore();
    ctx.strokeStyle = 'rgba(160,120,140,0.18)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx + 4, cy + vh - lift + 0.5);
    ctx.lineTo(cx + cw - 4, cy + vh - lift + 0.5);
    ctx.stroke();
    text(ctx, fit(ctx, it.name, cw - 4, 5.4, true), cx + cw / 2, cy + ch - 4 - lift, { size: 5.4, bold: true, align: 'center', color: on ? '#d0507a' : '#7a5a6a' });
    if (on) {
      ctx.fillStyle = '#ff6f9a';
      roundRect(ctx, cx + 3, cy + 3 - lift, 15, 8, 4);
      ctx.fill();
      text(ctx, 'On', cx + 10.5, cy + 9.2 - lift, { size: 5.4, bold: true, align: 'center', color: '#ffffff' });
    }
    if (over) {
      trying = changed(rec, tab, it.id);
      tooltip(ui, [{ text: it.name, bold: true }, { text: tab === 'costume' ? 'Prize costume: the whole look' : `${TIER_NAMES[it.tier]} · ${TAB_NAMES[tab]}`, color: c }, { text: on ? 'Click to take it off' : 'Click to put it on', color: COLORS.muted }]);
    }
    if (clicked(ui, cx, cy, cw, ch)) {
      const next = changed(rec, tab, it.id);
      rec.wear = Object.keys(next.wear).length ? next.wear : null;
      rec.dress = next.dress;
      sfx(on ? 'cancel' : 'click');
      // (It shows it off: in its photo, and out in the garden if it isn't busy.)
      if (!on) {
        if (win.view) portraitOf(win.view).action = { name: 'newstyle', t0: null };
        const e = world.gardenLife?.mochi.find((o) => o.rec === rec);
        if (e?.m && !e.m.action) e.m.action = { name: 'newstyle', t0: null };
      }
    }
  });
  if (pages > 1) {
    const py = gy + ROWS * (ch + 4) + 1;
    if (button(ui, rx + rw / 2 - 46, py, 22, 13, '◀', { size: 7 })) win.page = (page + pages - 1) % pages;
    text(ctx, `${page + 1} / ${pages}`, rx + rw / 2, py + 9.5, { size: 6.5, bold: true, align: 'center', color: COLORS.muted });
    if (button(ui, rx + rw / 2 + 24, py, 22, 13, '▶', { size: 7 })) win.page = (page + 1) % pages;
  }

  // ---------- Left: the Mochi, trying on whatever's under the mouse ----------
  // (One stand-in for it, kept, so its photo keeps moving from frame to frame.)
  const view = (win.view ??= {});
  Object.assign(view, rec, { wear: trying ? trying.wear : rec.wear, dress: trying ? trying.dress : rec.dress });
  portraitCard(ctx, view, x, y, 114, 150, world.now, { scale: view.stage === 'mochiko' ? 3.6 : 3.1, drop: 6 });
  if (trying) {
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, x + 30, y + 7, 54, 12, 6);
    ctx.fill();
    text(ctx, 'Trying on', x + 57, y + 15.4, { size: 6, bold: true, align: 'center', color: '#d0507a' });
  }
  heading(ctx, 'Wearing', x, y + 158, 114);
  const worn = DRESS[rec.dress] ? [DRESS[rec.dress].name] : SLOTS.filter((s) => rec.wear?.[s]).map((s) => SETS[s][rec.wear[s]]?.name).filter(Boolean);
  text(ctx, fit(ctx, worn.length ? worn.join(', ') : 'Its own smock', 112, 6.2, false), x + 1, y + 178, { size: 6.2, color: worn.length ? '#7a5a6a' : COLORS.muted });
  if (worn.length > 1) text(ctx, `${worn.length} pieces`, x + 1, y + 188, { size: 6, bold: true, color: '#c89a20' });
  if (worn.length && button(ui, x, win.y + H - 26, 114, 15, 'Take it all off', { size: 7 })) {
    rec.wear = null;
    rec.dress = null;
    sfx('cancel');
  }
}
