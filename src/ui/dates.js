// Dates (world/dates.js): asking (which date: their favourite marked), the card at the top while
// one's on (what to do, how it's going, the time), the moments drawn over the world (shooting
// stars to wish on; arrows coming round for the lantern dance), and how it went at the end.

import { SWEETHEARTS } from '../data/sweethearts.js';
import { DATES, startDate, dateBlocker } from '../world/dates.js';
import { COLORS, text, box, button, wrap, hover, tooltip, textFont } from './kit.js';
import { VW } from '../input.js';
import { sfx } from '../audio/sfx.js';

// (Fawnelle's people-watching only with her: the others' dates are the shared five)
const ORDER = ['fish', 'ride', 'stars', 'cook', 'dance', 'watch'];
const ICON = { fish: 'drop', ride: 'paw', stars: 'star', cook: 'flame', dance: 'note', watch: 'sight' };

export function datePage(ui, state, world, npc, area) {
  const dlg = state.npc;
  const s = SWEETHEARTS[npc.id];
  const { ctx } = ui;
  text(ctx, `A date with ${npc.name}`, area.x, area.y, { size: 9, bold: true });
  wrap(ctx, `${npc.name} loves a ${DATES[s.date].name.toLowerCase()} most.`, area.x, area.y + 11, area.w, { size: 7, color: COLORS.muted });
  ORDER.filter((kind) => kind !== 'watch' || s.date === 'watch').forEach((kind, i) => {
    const d = DATES[kind];
    const why = dateBlocker(world, npc.id, kind);
    const bx = area.x + (i % 3) * ((area.w + 4) / 3);
    const by = area.y + 22 + Math.floor(i / 3) * 26;
    const bw = (area.w + 4) / 3 - 4;
    const fav = s.date === kind;
    if (button(ui, bx, by, bw, 22, `${fav ? '♥ ' : ''}${d.name}`, { size: 7, primary: fav && !why, enabled: !why, iconName: ICON[kind] })) {
      const r = startDate(world, npc.id, kind);
      if (r) world.log(r, '#ffb3c6');
      else {
        sfx('questAccept');
        state.npc = null;
        state.windows.npc.open = false;
      }
    }
    if (hover(ui, bx, by, bw, 22)) tooltip(ui, [{ text: d.name, bold: true }, { text: d.hint, size: 7 }, ...(why ? [{ text: why, size: 7, color: COLORS.bad }] : [])]);
  });
  if (button(ui, area.x + area.w - 74, area.bottom - 16, 74, 17, 'Back')) dlg.date = false;
}

// The card at the top of the screen, and the moments over the world.
export function drawDateHud(ui, world) {
  const { ctx } = ui;
  const d = world.date;
  const ended = world.dateEnded && world.now - world.dateEnded.at < 4 ? world.dateEnded : null;
  if (!d && !ended) return;
  if (ended && !d) {
    const s = SWEETHEARTS[ended.id];
    const w = 280;
    box(ctx, VW / 2 - w / 2, 46, w, 34, { fill: 'rgba(255,248,252,0.96)', edge: '#ff9ec7', r: 12, width: 2 });
    text(ctx, `${s.name}: ${{ great: 'A wonderful date!', good: 'A lovely date', okay: 'A sweet little date' }[ended.rating]}  +${ended.gained} ♥`, VW / 2, 60, { size: 8.5, bold: true, align: 'center', color: '#c84a7a' });
    wrap(ctx, ended.line, VW / 2 - w / 2 + 10, 70, w - 20, { size: 6.5, color: COLORS.ink, align: 'center' });
    return;
  }
  const s = SWEETHEARTS[d.id];
  const def = DATES[d.kind];
  const w = 260;
  const x = VW / 2 - w / 2;
  box(ctx, x, 46, w, 30, { fill: 'rgba(255,248,252,0.95)', edge: '#ff9ec7', r: 12, width: 2 });
  text(ctx, `${def.name} with ${s.name}`, x + 10, 57, { size: 8, bold: true, color: '#c84a7a' });
  text(ctx, `${Math.max(0, Math.ceil(d.left))}s`, x + w - 10, 57, { size: 7, bold: true, align: 'right', color: COLORS.muted });
  text(ctx, def.hint, x + 10, 68, { size: 6.5, color: COLORS.ink });
  // The bar: how far along.
  box(ctx, x + w - 70, 64, 60, 6, { fill: '#f2e4ee', edge: null, r: 3 });
  box(ctx, x + w - 70, 64, 60 * Math.min(1, d.progress / d.goal), 6, { fill: '#ff8fc4', edge: null, r: 3 });
  if (d.kind === 'stars') drawStars(ctx, d);
  if (d.kind === 'dance') drawDance(ctx, d);
  if (d.kind === 'watch') drawWatch(ctx, d);
}

// People-watching: what she spots, in a speech card, and a ring closing on a notebook; press as it
// meets the notebook's edge.
function drawWatch(ctx, d) {
  const live = d.sights.find((s) => s.got == null) ?? d.sights.filter((s) => d.t - s.t0 < 2.4).at(-1);
  if (!live) return;
  const a = d.t - live.t0;
  const y = 104;
  ctx.save();
  ctx.fillStyle = 'rgba(255,248,252,0.94)';
  ctx.beginPath();
  ctx.roundRect(VW / 2 - 120, y - 16, 240, 46, 12);
  ctx.fill();
  ctx.strokeStyle = '#c9b6ff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#5a4a8a';
  ctx.font = textFont(7, true);
  ctx.textAlign = 'center';
  ctx.fillText(live.line, VW / 2, y - 4);
  // (the notebook, and the ring closing on it)
  const cx = VW / 2;
  const cy = y + 15;
  ctx.fillStyle = live.got === true ? '#ffe36b' : '#efe6ff';
  ctx.fillRect(cx - 6, cy - 7, 12, 14);
  ctx.strokeStyle = '#8f7fd0';
  ctx.lineWidth = 1;
  ctx.strokeRect(cx - 6, cy - 7, 12, 14);
  if (live.got == null) {
    const r = 9 + 22 * Math.max(0, 1 - a / 1.6);
    ctx.strokeStyle = a >= 1.05 ? '#ff8fc4' : '#b8a8e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = live.got ? '#c84a7a' : '#9a92b8';
    ctx.font = textFont(7, true);
    ctx.fillText(live.got ? 'noted!' : 'missed it', cx + 34, cy + 3);
  }
  ctx.restore();
}

// Shooting stars streaking across the sky, a soft band marking the middle where the wish lands.
function drawStars(ctx, d) {
  ctx.save();
  ctx.fillStyle = 'rgba(200,200,255,0.14)';
  ctx.fillRect(VW / 2 - VW / 6, 86, VW / 3, 90);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.setLineDash([3, 3]);
  ctx.strokeRect(VW / 2 - VW / 6, 86, VW / 3, 90);
  ctx.setLineDash([]);
  for (const s of d.stars) {
    const u = (d.t - s.t0) / 1.6;
    if (u < 0 || u > 1.3) continue;
    const sx = s.dir > 0 ? u * VW : VW - u * VW;
    const sy = 90 + s.h * 160 + u * 30;
    const c = s.got === true ? '#ffe36b' : s.got === false ? '#c8c8e8' : '#ffffff';
    const tail = ctx.createLinearGradient(sx, sy, sx - s.dir * 44, sy - 8);
    tail.addColorStop(0, c);
    tail.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.strokeStyle = tail;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx - s.dir * 44, sy - 8);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5 + d.t * 3;
      const r = i % 2 ? 1.6 : 4;
      ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r);
    }
    ctx.fill();
    if (s.got === true && u < 1.2) {
      ctx.fillStyle = '#ffe36b';
      ctx.font = textFont(8, true);
      ctx.textAlign = 'center';
      ctx.fillText('wish!', sx, sy - 10);
    }
  }
  ctx.restore();
}

// The lantern dance: arrows slide in from the right to a ring of lanterns; press as each one
// reaches the ring.
const GLYPH = { ArrowLeft: '←', ArrowUp: '↑', ArrowDown: '↓', ArrowRight: '→' };
function drawDance(ctx, d) {
  const y = 110;
  const ringX = VW / 2 - 80;
  ctx.save();
  ctx.fillStyle = 'rgba(255,240,250,0.85)';
  ctx.beginPath();
  ctx.roundRect(VW / 2 - 110, y - 20, 220, 40, 12);
  ctx.fill();
  ctx.strokeStyle = '#ff9ec7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ringX, y, 13, 0, Math.PI * 2);
  ctx.stroke();
  for (const n of d.notes) {
    const u = (n.at - d.t) / 0.8;
    if (u < -0.6 || u > 3) continue;
    const nx = ringX + u * 60;
    ctx.globalAlpha = n.got === false ? 0.35 : 1;
    ctx.fillStyle = n.got ? '#ffe36b' : '#ff8fc4';
    ctx.beginPath();
    ctx.arc(nx, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = textFont(12, true);
    ctx.textAlign = 'center';
    ctx.fillText(GLYPH[n.key], nx, y + 4);
  }
  ctx.restore();
}
