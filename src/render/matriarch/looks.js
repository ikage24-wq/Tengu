// The Barnacle Matriarch's cast looks (2026-11-27, her new fight, world/skywhale.js): each telegraph drawn
// whole in her own sea style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its
// cast winds up (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1
// over its hold): soft curling sea-green water with white lips, round bubbles, little pastel barnacles, coral
// and pearls, soft four-point sparkles (never specks). render/dreamfx.js hands each zone with one of these
// looks to them. Every shape rounded, outlined in a deeper shade of its own colour, eased; the raid-wide a
// soft sea tint, never a strong flash.
//   maScold    A Proper Scolding (the tank's marker): a ring of water curling up round the tank, a flipper's
//              shadow sweeping in; landing, a splash of curls and "SLAP!"
//   maBabies   Barnacle Babies (a marker on each of you: spread): a little barnacle baby tumbling down onto
//              each of you, its shadow growing; landing, a soft splash
//   maCluster  Cluster, Children! (a stack): her children gathering in a ring on the marker, a glint for each
//              guest it needs; landing, they all pop open and wave, a splash of bubbles
//   maUndertow Undertow (everyone): the sea rising along the floor, bubbles; landing, a soft sea wash
//   maCoral    Coral Bloom (round her, not right beside her): coral buds pushing up out of the deck all
//              round, a calm ring of pearl-white sand beside her; landing, the coral blooms
//   maTide     Find the Pearl's tide on the floor (everywhere but the pearl's clam): water rising, curling
//              waves rolling toward the clam; landing, a great wave crash, "SPLOOSH!"
//   maTideHi   ... and up in the rigging: bubbles rising up there; landing, spray
// Also her clams (drawMatriarchShells, from render/skywhale.js): three pink-and-cream clam shells on the
// deck, her pearl shown in one, then the clams shuffled round (one hops over, one slides under), the
// pearl's clam peeking just before the tide, all opening after.

import { glow, pen, sparkle, ell, sstep, clamp, TAU } from './fx.js';
import { barnacle } from './index.js';

const WATER = ['#f2fffc', '#c4f0e8', '#86d4cc', '#4aa6a4'];
const CORAL = ['#ffc4b4', '#ff8e86', '#e8646a', '#b44852'];
const PEARL = ['#ffffff', '#f4f0fa', '#dcd4ea', '#b4aac8'];
const CLAM = ['#fff2ec', '#ffd4cc', '#f0a8a8', '#c47884'];
const SAND = '#fff6e0';
const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
const spark = (ctx, x, y, s, al) => sparkle(ctx, x, y, s, al, '#f2fffc');

function floorRing(ctx, x, y, rx, fill, rim, al, w = 1.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, rx, rx * 0.26);
  ctx.fillStyle = fill;
  ctx.fill();
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function bubble(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(220,250,246,0.45)';
  ctx.fill();
  pen(ctx, WATER[3], Math.max(0.6, r * 0.18));
  ctx.stroke();
  ell(ctx, x - r * 0.35, y - r * 0.35, r * 0.3, r * 0.22, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function curl(ctx, x, y, r, al, d = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(d, 1);
  ctx.beginPath();
  ctx.moveTo(-r * 1.4, 0);
  ctx.quadraticCurveTo(-r * 0.6, -r * 1.6, r * 0.6, -r * 1.3);
  ctx.quadraticCurveTo(r * 1.2, -r * 1.0, r * 0.7, -r * 0.4);
  ctx.quadraticCurveTo(r * 0.2, -r * 0.8, -r * 0.1, -r * 0.2);
  ctx.quadraticCurveTo(r * 0.4, 0, r * 1.2, 0);
  ctx.closePath();
  pen(ctx, WATER[3], Math.max(1, r * 0.14));
  ctx.stroke();
  ctx.fillStyle = WATER[1];
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-r * 0.6, -r * 0.9);
  ctx.quadraticCurveTo(0, -r * 1.35, r * 0.6, -r * 1.15);
  pen(ctx, WATER[0], Math.max(0.8, r * 0.16));
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
}
function word(ctx, text, x, y, size, col, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = size * 0.36;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
// A rising strip of sea along the floor from x over w (its top a soft wave), level 0..1.
function seaStrip(ctx, x, w, y, level, time, al) {
  if (al <= 0.01 || w <= 1) return;
  const h = 4 + level * 22;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  const n = Math.max(2, Math.floor(w / 14));
  for (let i = 0; i <= n; i++) {
    const px = x + (i / n) * w;
    ctx.lineTo(px, y - h + Math.sin(px * 0.08 + time * 3) * 2);
  }
  ctx.lineTo(x + w, y + 2);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, y - h, 0, y + 2);
  g.addColorStop(0, 'rgba(160,230,220,0.7)');
  g.addColorStop(1, 'rgba(74,166,164,0.55)');
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const px = x + (i / n) * w;
    const py = y - h + Math.sin(px * 0.08 + time * 3) * 2;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  pen(ctx, WATER[0], 1.8);
  ctx.stroke();
  ctx.restore();
}

function scoldWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(196,240,232,0.35)', WATER[3], 0.5 + 0.4 * p, 2);
  for (let i = 0; i < 5; i++) {
    const an = (i / 5) * TAU + time * 1.4;
    curl(ctx, x + Math.cos(an) * r * (1.1 - 0.5 * p), y - 2 + Math.sin(an) * r * 0.24, 3 + 2 * p, 0.5 + 0.4 * p, Math.cos(an) > 0 ? -1 : 1);
  }
  // her flipper's soft shadow sweeping in
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.3 * p;
  ell(ctx, x - (1 - p) * 30, y, r * 0.6, r * 0.14);
  ctx.fillStyle = '#7a4a52';
  ctx.fill();
  ctx.restore();
}
function scoldHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI + (i / 6) * Math.PI;
    curl(ctx, x + Math.cos(an) * (6 + e * 30), y - 4 + Math.sin(an) * (4 + e * 16), 5 + e * 3, fade, Math.cos(an) > 0 ? 1 : -1);
  }
  for (let i = 0; i < 4; i++) bubble(ctx, x + (i - 1.5) * 12, y - 24 - e * 18 - i * 3, 2.4, fade);
  if (u < 0.7) word(ctx, 'SLAP!', x, y - 54 - e * 6, 13, '#2c6670', fade);
}
function babiesWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(244,234,255,0.3)', '#a890c8', 0.4 + 0.5 * p);
  ctx.save();
  ctx.globalAlpha = 0.15 + 0.3 * p;
  ell(ctx, x, y, r * (0.25 + 0.4 * p), r * 0.07 * (0.6 + p));
  ctx.fillStyle = '#8a7aa0';
  ctx.fill();
  ctx.restore();
  // a barnacle baby tumbling down onto the marker
  if (p > 0.25) {
    const k = ease((p - 0.25) / 0.75);
    const by = y - 160 + 150 * k;
    ctx.save();
    ctx.translate(x, Math.min(y - 4, by));
    ctx.rotate(Math.sin(time * 6) * 0.4 * (1 - k));
    for (const mode of ['line', 'fill']) barnacle(ctx, null, mode, [0, 0], 2.6, Math.floor(x) % 3, 0.6 + 0.4 * Math.sin(time * 7), time, 0);
    ctx.restore();
  }
}
function babiesHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 5; i++) {
    const an = -Math.PI + 0.3 + (i / 4) * (Math.PI - 0.6);
    curl(ctx, x + Math.cos(an) * (4 + e * 18), y - 2 + Math.sin(an) * (3 + e * 10), 3.4, fade, Math.cos(an) > 0 ? 1 : -1);
  }
  for (const mode of ['line', 'fill']) barnacle(ctx, null, mode, [x, y - 2], 2.6, Math.floor(x) % 3, 1, u * 3, 1);
}
function clusterWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, 'rgba(255,236,232,0.35)', CORAL[2], 0.5 + 0.4 * p, 2.2);
  // her children gathering in a ring on it
  const n = 5;
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU + time * 0.6;
    const k = sstep(p * 1.6 - i * 0.12);
    const px = x + Math.cos(an) * r * (1.8 - 0.9 * k);
    const py = y - 3 + Math.sin(an) * r * 0.22;
    for (const mode of ['line', 'fill']) barnacle(ctx, null, mode, [px, py], 2.2, i, 0.3, time, i);
  }
  const need = z.need ?? 2;
  for (let i = 0; i < need; i++) spark(ctx, x + (i - (need - 1) / 2) * 13, y - 36, 3, clamp(p * need - i, 0.25, 1));
}
function clusterHit(ctx, z, x, y, u, e, fade) {
  const r = z.w / 2;
  for (let i = 0; i < 5; i++) {
    const an = (i / 5) * TAU;
    ctx.save();
    ctx.globalAlpha *= fade;
    for (const mode of ['line', 'fill']) barnacle(ctx, null, mode, [x + Math.cos(an) * r * 0.9, y - 3 + Math.sin(an) * r * 0.22], 2.2, i, 1, u * 4, i);
    ctx.restore();
  }
  for (let i = 0; i < 6; i++) bubble(ctx, x + Math.cos(i) * (6 + e * 24), y - 14 - e * 30 - (i % 3) * 6, 2.2, fade);
}
function undertowWarn(ctx, z, x, y, p, time) {
  // (everyone: the sea rising along the whole floor in view, bubbles; a soft sea tint)
  ctx.save();
  ctx.globalAlpha = 0.04 + 0.06 * p;
  ctx.fillStyle = '#c4f0e8';
  ctx.fillRect(-20, -20, 700, 420);
  ctx.restore();
  seaStrip(ctx, -20, 700, y, p * 0.7, time, 0.4 + 0.4 * p);
  for (let i = 0; i < 10; i++) {
    const ph = (time * 0.5 + i * 0.1) % 1;
    bubble(ctx, 20 + i * 64 + Math.sin(i * 3 + time) * 8, y - 10 - ph * 120, 2 + (i % 3), (0.3 + 0.4 * p) * Math.sin(Math.PI * ph));
  }
}
function undertowHit(ctx, z, x, y, u, e, fade) {
  ctx.save();
  ctx.globalAlpha = 0.08 * fade;
  ctx.fillStyle = '#c4f0e8';
  ctx.fillRect(-20, -20, 700, 420);
  ctx.restore();
  for (let i = 0; i < 9; i++) curl(ctx, -40 + e * 120 + i * 80, y - 2, 8 + 4 * Math.sin(i), 0.85 * fade, 1);
  seaStrip(ctx, -20, 700, y, 0.7 * (1 - e), u * 4, fade);
  if (u < 0.7) word(ctx, 'WHOOSH', 320, 90 - e * 6, 14, '#2c6670', fade);
}
function coralWarn(ctx, z, x, y, p, time) {
  const inner = z.inner ?? 74;
  // the calm ring of pearl-white sand beside her
  floorRing(ctx, x, y, inner, 'rgba(255,246,224,0.55)', '#e8d08a', 0.6 + 0.4 * p, 2.2);
  glow(ctx, x, y - 10, inner, '#fff6e0', 0.15 + 0.2 * p);
  // coral buds pushing up out of the deck beyond it
  const R = z.w / 2;
  for (let i = 0; i < 22; i++) {
    const sd = i % 2 ? 1 : -1;
    const d = inner + 14 + ((i * 37) % (R - inner - 20));
    const px = x + sd * d;
    const h = 3 + p * (6 + (i % 4) * 2);
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.55 * p;
    ctx.beginPath();
    ctx.roundRect(px - 2, y - h, 4, h + 1, 2);
    ctx.fillStyle = CORAL[i % 3 === 0 ? 2 : 1];
    ctx.fill();
    pen(ctx, CORAL[3], 1);
    ctx.stroke();
    ctx.restore();
  }
}
function coralHit(ctx, z, x, y, u, e, fade) {
  const inner = z.inner ?? 74;
  const R = z.w / 2;
  for (let i = 0; i < 22; i++) {
    const sd = i % 2 ? 1 : -1;
    const d = inner + 14 + ((i * 37) % (R - inner - 20));
    const px = x + sd * d;
    const h = 10 + (i % 4) * 3 + e * 8;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.quadraticCurveTo(px - 2, y - h * 0.6, px - 4, y - h);
    ctx.moveTo(px, y - h * 0.4);
    ctx.quadraticCurveTo(px + 3, y - h * 0.7, px + 5, y - h * 0.9);
    ctx.lineCap = 'round';
    pen(ctx, CORAL[3], 4.2);
    ctx.stroke();
    pen(ctx, CORAL[1], 2.6);
    ctx.stroke();
    ctx.restore();
  }
  if (u < 0.6) word(ctx, 'BLOOM!', x, y - 60 - e * 6, 12, CORAL[3], fade);
}
function tideWarn(ctx, z, x, y, p, time) {
  // the floor's tide rising, curls rolling the way the band points (toward the pearl's clam)
  const d = z.dir ?? 1;
  const lv = sstep((p - 0.15) / 0.85);
  seaStrip(ctx, x, z.w, y, lv * 0.8, time, 0.3 + 0.6 * lv);
  const n = Math.max(1, Math.floor(z.w / 70));
  for (let i = 0; i < n; i++) {
    const ph = (((i + 0.5) / n + time * 0.25 * d) % 1 + 1) % 1;
    curl(ctx, x + ph * z.w, y - 2 - lv * 10, 3 + 4 * lv, (0.3 + 0.6 * lv) * Math.sin(Math.PI * ph), d);
  }
}
function tideHit(ctx, z, x, y, u, e, fade) {
  const d = z.dir ?? 1;
  const n = Math.max(1, Math.floor(z.w / 60));
  for (let i = 0; i < n; i++) curl(ctx, x + ((i + 0.5) / n) * z.w + d * e * 30, y - 4, 10 + (i % 2) * 3, fade, d);
  seaStrip(ctx, x, z.w, y, 0.9 * (1 - e * 0.6), u * 4, fade);
  if (u < 0.7 && z.w > 200) word(ctx, 'SPLOOSH!', x + z.w / 2, y - 60 - e * 6, 14, '#2c6670', fade);
}
function tideHiWarn(ctx, z, x, y, p, time) {
  // (the tide up in the rigging too: bubbles rising up there)
  for (let i = 0; i < 12; i++) {
    const ph = (time * 0.4 + i * 0.083) % 1;
    bubble(ctx, 20 + i * 54 + Math.sin(i * 2 + time) * 6, y - 60 - ph * 160, 2 + (i % 3) * 0.8, (0.15 + 0.45 * p) * Math.sin(Math.PI * ph));
  }
}
function tideHiHit(ctx, z, x, y, u, e, fade) {
  for (let i = 0; i < 10; i++) curl(ctx, 30 + i * 64, y - 90 - (i % 3) * 30 - e * 10, 7, 0.7 * fade, i % 2 ? 1 : -1);
}

export const MATRIARCH_FX = {
  maScold: { warn: scoldWarn, hit: scoldHit },
  maBabies: { warn: babiesWarn, hit: babiesHit },
  maCluster: { warn: clusterWarn, hit: clusterHit },
  maUndertow: { warn: undertowWarn, hit: undertowHit },
  maCoral: { warn: coralWarn, hit: coralHit },
  maTide: { warn: tideWarn, hit: tideHit },
  maTideHi: { warn: tideHiWarn, hit: tideHiHit },
};
export const MATRIARCH_HOLD = { maScold: 0.8, maBabies: 0.6, maCluster: 0.9, maUndertow: 1, maCoral: 0.9, maTide: 1.1, maTideHi: 0.8 };
export const MATRIARCH_OWN_WARN = Object.keys(MATRIARCH_FX);

// One clam shell on the deck, (x, y) its hinge on the floor, `open` 0 shut .. 1 wide, a pearl inside.
function clam(ctx, x, y, s, open, pearl, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  const ribs = (top) => {
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const u = i / 24;
      const an = Math.PI + u * Math.PI;
      const bump = 1 + 0.05 * Math.cos(u * 9 * TAU);
      pts.push([Math.cos(an) * 26 * bump, (top ? -1 : 0.35) * Math.abs(Math.sin(an)) * 15 * bump]);
    }
    return pts;
  };
  // the bottom half on the floor
  const bot = ribs(false).map(([px, py]) => [px, -py * 0.5 - 2]);
  ctx.beginPath();
  bot.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.quadraticCurveTo(0, 3, -26, -2);
  ctx.closePath();
  ctx.fillStyle = CLAM[2];
  ctx.fill();
  pen(ctx, CLAM[3], 1.4);
  ctx.stroke();
  // the pearl, on its pink lining
  if (open > 0.05) {
    ell(ctx, 0, -4, 18 * open, 4 * open);
    ctx.fillStyle = CLAM[0];
    ctx.fill();
    if (pearl) {
      ell(ctx, 0, -7, 5.4, 5.4);
      ctx.fillStyle = PEARL[1];
      ctx.fill();
      pen(ctx, PEARL[3], 1);
      ctx.stroke();
      ell(ctx, -1.6, -8.8, 1.8, 1.3, -0.4);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      glow(ctx, 0, -8, 12, '#ffffff', 0.35 * open);
      sparkle(ctx, 4, -12, 2.6 + Math.sin(time * 7) * 0.6, open, '#ffffff');
    }
  }
  // the top half, hinged at the back, lifting open
  ctx.save();
  ctx.translate(0, -3);
  ctx.rotate(-open * 0.7);
  const top = ribs(true);
  ctx.beginPath();
  top.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -15, 0, 0);
  g.addColorStop(0, CLAM[0]);
  g.addColorStop(1, CLAM[1]);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, CLAM[3], 1.4);
  ctx.stroke();
  for (let i = 1; i < 6; i++) {
    const an = Math.PI + (i / 6) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(0, -1);
    ctx.lineTo(Math.cos(an) * 22, Math.sin(an) * 12.6);
    pen(ctx, CLAM[2], 1);
    ctx.stroke();
  }
  ell(ctx, -8, -9, 5, 2, -0.3);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
  ctx.restore();
}
// Her clams (world/skywhale.js room.shells): shown, shuffled, the pearl's one peeking before the tide,
// all opening after.
export function drawMatriarchShells(ctx, world, cam, time) {
  const S = world.dungeon?.room?.shells;
  if (!S) return;
  const now = world.now;
  const u = now - S.t0;
  if (u > S.dur + 1.4) return;
  const gy = world.map.groundY - cam.y;
  const fade = 1 - sstep((u - S.dur - 0.9) / 0.5);
  const pop = sstep(u / 0.35);
  // where each clam is now: its slot, and the swap it is in (if any)
  const at = [0, 1, 2];
  const pos = [S.slots[0], S.slots[1], S.slots[2]];
  const lift = [0, 0, 0];
  for (const sw of S.swaps) {
    const k = (u - sw.t) / sw.len;
    if (k <= 0) break;
    const ca = at[sw.a];
    const cb = at[sw.b];
    if (k >= 1) {
      [at[sw.a], at[sw.b]] = [cb, ca];
      pos[ca] = S.slots[sw.b];
      pos[cb] = S.slots[sw.a];
      continue;
    }
    const e = sstep(k);
    pos[ca] = S.slots[sw.a] + (S.slots[sw.b] - S.slots[sw.a]) * e;
    pos[cb] = S.slots[sw.b] + (S.slots[sw.a] - S.slots[sw.b]) * e;
    // (one hops over, the other slides under)
    lift[ca] = Math.sin(Math.PI * e) * 34;
    break;
  }
  const reveal = 1 - sstep((u - 0.85) / 0.3);
  const peek = sstep((u - S.dur + 0.7) / 0.25);
  const after = sstep((u - S.dur) / 0.2);
  for (let c = 0; c < 3; c++) {
    const x = pos[c] - cam.x;
    if (x < -80 || x > 720) continue;
    const isPearl = c === S.pearl;
    const open = Math.max(isPearl ? Math.max(reveal, peek * 0.35) : reveal * 0.15, after);
    ctx.save();
    ctx.globalAlpha *= fade;
    // its shadow
    ell(ctx, x, gy, 26 * pop, 5 * pop);
    ctx.fillStyle = 'rgba(40,60,90,0.18)';
    ctx.fill();
    clam(ctx, x, gy - lift[c], 1.25 * pop, open, isPearl, time);
    // the safe one, after the tide: a calm patch
    if (isPearl && after > 0.01) glow(ctx, x, gy - 10, 40, SAND, 0.3 * after);
    ctx.restore();
  }
}
