// A Mochi's care panel, opened with Up beside one of your Mochi in your garden
// (world/garden-life.js): its portrait, how it's feeling, its five stats, and what you can do with
// it: care for it (gentle care leans it angelic, rough play devilish) and feed it a sweet from your
// bag (sweets are what raise its stats; its favourite has a heart, the one it hates a cross). Walk
// away and the panel closes. Built from the Mochi kit (ui/mochi-kit.js).

import { STAGES } from '../data/mochi-genes.js';
import { CARE, MOCHI_SWEETS } from '../data/mochi-raise.js';
import { countItem } from '../core/inventory.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, windowFrame, text, button, hover, clicked, tooltip, fit, roundRect, icon } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { VW, VH } from '../input.js';
import { careFor, feedMochi, sayGoodbye, VISITOR_CARE } from '../world/garden-life.js';
import { STAT_ORDER, STAT_INFO, portraitCard, statRow, feelMeter, heading, cap } from './mochi-kit.js';

const W = 300;
const H = 262;
// Gentle care first (pink), then rough play (lavender), each with its icon.
const CARE_ROWS = [
  ['pet', 'Pet', 'heart', 'Gentle: leans it angelic.'],
  ['play', 'Play', 'paw', 'A game of catch. Now and then it learns a little Run.'],
  ['cheer', 'Cheer', 'star', 'Cheer it on. Leans it angelic.'],
  ['tickle', 'Tickle', 'feather', 'Cheeky: leans it devilish.'],
  ['wrestle', 'Wrestle', 'hammer', 'Rough play. Now and then it learns a little Power; leans it devilish.'],
  ['prank', 'Prank', 'dice', 'Mischief: leans it devilish.'],
];

export function mochiCareWindow(ui, state, world) {
  const win = state.windows.mochi;
  const life = world.gardenLife;
  const e = life?.caring;
  // Walk away (or leave the garden) and it closes.
  if (!e || !life.mochi.includes(e) || e.hidden || e.scene || Math.abs((e.x ?? 1e9) - world.body.x) > 90) {
    win.open = false;
    if (life) life.caring = null;
    return;
  }
  // (It stays by you while the panel's open.)
  const now = Date.now() / 1000;
  e.busyUntil = Math.max(e.busyUntil ?? 0, now + 0.4);
  const rec = e.rec;
  // (In a friend's garden: their Mochi, and only gentle care.)
  const guest = world.gardenVisit;
  const title = rec.name ?? STAGES[rec.stage] ?? 'Mochi';
  const care = CARE_ROWS.filter(([what]) => !guest || VISITOR_CARE.includes(what));
  const h = guest ? H - 20 : H;
  // (Opened beside a Mochi: on the far side of the screen from it, so you can watch it eat and
  // react; the camera keeps you, and so it, near the middle.)
  if (win.forMochi !== e) {
    win.forMochi = e;
    win.x = e.x < world.body.x ? VW - W - 8 : 8;
  }
  // (Kept on screen: a window left near the edge when it was smaller.)
  win.x = Math.max(4, Math.min(VW - W - 4, win.x ?? 0));
  win.y = Math.max(4, Math.min(VH - h - 40, win.y ?? 0));
  if (!windowFrame(ui, win, W, h, guest ? `${guest.name}'s ${title}` : title, { icon: 'heart' })) return;
  const { ctx } = ui;
  const x = win.x + 10;
  const y = win.y + 28;
  // ---- Left: its portrait, who it is, and its page.
  portraitCard(ctx, rec, x, y, 86, 92, world.now);
  text(ctx, fit(ctx, `${cap(rec.personality)} ${STAGES[rec.stage] ?? 'Mochi'}`, 86, 7, true), x + 43, y + 103, { size: 7, bold: true, align: 'center' });
  if (button(ui, x, y + 109, 86, 14, 'Its page', { size: 7, iconName: 'book' })) {
    world.mochiInfo = rec;
    world.events.push({ type: 'mochiinfo' });
  }
  // (Your own: name it, and say goodbye with a second click to be sure.)
  if (!guest) {
    if (button(ui, x, y + 126, 41, 13, rec.name ? 'Rename' : 'Name', { size: 6.5 })) {
      world.naming = rec;
      world.events.push({ type: 'mochiname' });
    }
    const sure = win.bye?.e === e && now < win.bye.until;
    if (button(ui, x + 45, y + 126, 41, 13, sure ? 'Sure?' : 'Goodbye', { size: 6.5, theme: sure ? 'ruby' : null })) {
      if (sure) {
        sayGoodbye(world, e);
        win.bye = null;
      } else win.bye = { e, until: now + 3 };
    }
    if (hover(ui, x + 45, y + 126, 41, 13)) tooltip(ui, [{ text: 'Say goodbye', bold: true }, { text: 'It goes off to a new home, for good. Click twice.', color: COLORS.muted }]);
  }
  // ---- Right: how it feels, and its stats.
  const rx = x + 96;
  const rw = W - 20 - 96;
  const mw = (rw - 8) / 3;
  feelMeter(ui, rx, y, mw, 'mood', rec.mood);
  feelMeter(ui, rx + mw + 4, y, mw, 'bond', rec.bond);
  feelMeter(ui, rx + (mw + 4) * 2, y, mw, 'tummy', rec.tummy, { hungry: rec.hungry });
  let ry = y + 16;
  heading(ctx, 'Stats', rx, ry, rw);
  ry += 11;
  for (const st of STAT_ORDER) {
    statRow(ui, rx, ry, rw, rec, st, { style: false });
    ry += 15;
  }
  // ---- Below: care, then feed.
  let by = y + 146;
  heading(ctx, 'Care', x, by, W - 20);
  by += 11;
  const bw = (W - 20 - 10) / 3;
  care.forEach(([what, label, ico, tip], i) => {
    const bx = x + (i % 3) * (bw + 5);
    const yy = by + Math.floor(i / 3) * 18;
    const rough = (CARE[what]?.lean ?? 0) < 0;
    if (button(ui, bx, yy, bw, 15, label, { size: 7.5, primary: !rough, theme: rough ? 'lavender' : null, iconName: ico })) careFor(world, e, what);
    if (hover(ui, bx, yy, bw, 15)) tooltip(ui, [{ text: label, bold: true }, { text: tip, color: COLORS.muted }]);
  });
  by += Math.ceil(care.length / 3) * 18 + 3;
  // Feed: the sweets in your bag, its favourite with a heart, the one it hates with a cross.
  heading(ctx, 'Feed', x, by, W - 20);
  by += 10;
  const sweets = MOCHI_SWEETS.filter((sw) => countItem(world.char.inventory, sw.id) > 0);
  if (!sweets.length) text(ctx, 'No sweets in your bag: cook some at the Sweet Kitchen!', x + 2, by + 12, { size: 6.5, color: COLORS.muted });
  sweets.slice(0, 12).forEach((sw, i) => {
    const ix = x + i * 23;
    const iy = by;
    const on = hover(ui, ix, iy, 21, 21);
    const loved = sw.kind === rec.loves;
    const hated = sw.kind === rec.hates;
    ctx.fillStyle = on ? '#fff0f6' : '#ffffff';
    roundRect(ctx, ix, iy, 21, 21, 6);
    ctx.fill();
    ctx.strokeStyle = loved ? '#ff6f9a' : on ? '#ff9ec0' : '#f0d8e4';
    ctx.lineWidth = loved ? 1.4 : 1;
    ctx.stroke();
    drawItemIcon(ctx, sw.id, ix + 2.5, iy + 2.5);
    text(ctx, String(countItem(world.char.inventory, sw.id)), ix + 19, iy + 19.5, { size: 5.5, bold: true, align: 'right' });
    if (loved || hated) {
      ctx.fillStyle = loved ? '#ff6f9a' : '#9a8aa8';
      ctx.beginPath();
      ctx.arc(ix + 19, iy + 2, 4, 0, Math.PI * 2);
      ctx.fill();
      icon(ctx, loved ? 'heart' : 'skull', ix + 19, iy + 2, 5, '#ffffff');
    }
    if (on) {
      const trains = Object.entries(sw.trains).map(([st, n]) => `${STAT_INFO[st]?.name ?? st} +${n}`).join(', ');
      tooltip(ui, [...itemTooltip(world.char, sw.id), { text: trains || 'Makes a grown Mochi bloom', color: COLORS.muted }, { text: loved ? 'Its favourite!' : hated ? 'It hates this one...' : 'Click to feed', color: loved ? COLORS.good : hated ? COLORS.bad : COLORS.muted }]);
    }
    if (clicked(ui, ix, iy, 21, 21)) feedMochi(world, e, sw.id);
  });
}
