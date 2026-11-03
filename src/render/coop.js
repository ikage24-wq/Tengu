// The two-person boss mechanics on screen (world/coopboss.js) and a defend quest's calm stone
// (world/partyquest.js). The telegraphs are Tengu's own effect art (tools/fx-art.js, the `celco*`
// strips), each in its boss's own colour and shapes: the shared blow's gold ring with the Queen
// Bee's honeycomb and bees, the Myconid Queen's mushroom caps and spores, or Tuskar's stomping
// rocks, with a gold star pip over it for each player standing in it; the two-sided guard built of
// pieces laid round the boss (Old MacGoblin's barn-door planks, Tuskar's flame bulwark,
// Gnarlroot's bark plates) that crack when a side is struck and break apart; Gnarlroot's Root Seal,
// a rune circle of roots with its stone, and the ribbon of light chained from it to him while it's
// held; and the twin puffballs' spore tether, fraying red once one falls. Everything eases in and
// out on time; nothing pops.

import { fxSprite } from './fx-sprites.js';
import { coopBosses, inRing, membersHere } from '../world/coopboss.js';

const TAU = Math.PI * 2;
const smooth = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u));
const ease = (v, to, k) => v + (to - v) * k;

// Each boss's look: the motif of its share ring and the pieces of its guard.
const RING_OF = { queenbee: 'celcohoney', mothercapper: 'celcospore', tuskar: 'celcostomp' };
const HIT_OF = { celcohoney: 'celcohoneyhit', celcospore: 'celcosporehit', celcostomp: 'celcostomphit' };
const GUARD_OF = {
  macgoblin: { idle: 'celcobarn', crack: 'celcobarncrack', broke: 'celcobarnbreak', gap: 21, brace: true },
  tuskar: { idle: 'celcoflame', crack: 'celcoflamecrack', broke: 'celcoflamebreak', gap: 20, upright: true },
  gnarlroot: { idle: 'celcobark', crack: 'celcobarkcrack', broke: 'celcobarkbreak', gap: 22 },
};
const ringOf = (id) => RING_OF[id] ?? 'celcohoney';
const guardOf = (id) => GUARD_OF[id] ?? GUARD_OF.gnarlroot;
const RING_W = 130; // the share ring's drawn width

// A soft glow for the calm stone (a defend quest's prop, not a boss telegraph).
function softGlow(ctx, x, y, r, color, a) {
  if (a <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

// A little curvy four-point sparkle star.
function twinkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// Points along a quadratic curve about every `gap` px, each with the curve's angle there.
function along(x0, y0, mx, my, x1, y1, gap) {
  const len = Math.hypot(mx - x0, my - y0) + Math.hypot(x1 - mx, y1 - my);
  const n = Math.max(2, Math.round(len / gap));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * x1;
    const y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * y1;
    const dx = 2 * (1 - u) * (mx - x0) + 2 * u * (x1 - mx);
    const dy = 2 * (1 - u) * (my - y0) + 2 * u * (y1 - my);
    out.push({ x, y, a: Math.atan2(dy, dx), u });
  }
  return out;
}

// Where a guard's pieces sit round a boss (centre cx, cy; the guard's half-sizes rx, ry): on each
// side an arc of them, turned along it.
export function guardPieces(cx, cy, rx, ry, gap) {
  const arc = 1.15;
  const len = 2 * arc * Math.sqrt((rx * rx + ry * ry) / 2);
  const n = Math.max(3, Math.round(len / gap));
  const out = [];
  for (const side of [-1, 1]) {
    for (let j = 0; j < n; j++) {
      const th = -arc + (2 * arc * (j + 0.5)) / n;
      const tx = -rx * Math.sin(th);
      const ty = ry * Math.cos(th);
      const rot = Math.atan2(ty, tx) - Math.PI / 2;
      out.push({ side, j, x: cx + side * Math.cos(th) * rx, y: cy + Math.sin(th) * ry, rot: side > 0 ? rot : -rot, th });
    }
  }
  return out;
}
const guardSize = (def) => ({ rx: def.w * 0.62 + 8, ry: def.h * 0.62 + 6 });

// ---------- On the floor, under everyone ----------

// The share rings on screen this frame, so name tags standing in one step back (tagFade) and
// the ring and the stars over it stay readable instead of a pile of labels on the floor.
let ringsOnScreen = [];
export function tagFade(x, y) {
  for (const r of ringsOnScreen) if (Math.abs(x - r.x) < r.w / 2 + 6 && Math.abs(y - r.y) < 22) return 0.3;
  return 1;
}

export function drawCoopBack(ctx, world, cam, time) {
  ringsOnScreen = [];
  for (const m of coopBosses(world)) {
    for (const s of m.coop.mechs) {
      if (s.def.kind === 'split' && s.ring) drawRing(ctx, world, m, s.ring, cam, time);
      if (s.def.kind === 'seal' && s.x != null) drawSealStone(ctx, s, cam, time);
    }
  }
  const d = world.pqDefend;
  if (d?.spot && world.map.id === world.char.partyQuest?.map) drawCalmStone(ctx, d, cam, time);
}

// The share ring: it grows into place, its motif turning round the rim, the blow gathering inside
// it (a bright ring closing out to the rim). Its pips go over everyone (ringPips).
function drawRing(ctx, world, m, r, cam, time) {
  const p = Math.min(1, r.t / r.warn);
  const x = r.x - cam.x;
  const y = r.y - cam.y;
  const born = smooth(r.t / 0.35);
  const scale = (r.w / RING_W) * (0.8 + 0.2 * born);
  ringsOnScreen.push({ x, y, w: r.w });
  // A deep rim under the ring (its own drawing, darkened and a touch wider) so the gold reads on any
  // ground, even gold-brown earth.
  ctx.save();
  ctx.filter = 'brightness(0.32) saturate(1.6)';
  fxSprite(ctx, ringOf(m.def.id), x, y + 1, { t: time, scale: scale * 1.05, alpha: born * 0.7 });
  ctx.restore();
  fxSprite(ctx, ringOf(m.def.id), x, y, { t: time, scale, alpha: born });
  fxSprite(ctx, 'celcosharefill', x, y, { p: p * 0.999, scale, alpha: born * (p > 0.8 ? 0.75 + 0.25 * Math.sin(time * 18) : 1) });
}

// Over the ring, above everyone's heads (drawn in front): a pip for every player near the fight,
// lit gold (popping in) for each one standing in it.
function ringPips(ctx, world, m, r, cam, time) {
  const x = r.x - cam.x;
  const y = r.y - cam.y;
  const born = smooth(r.t / 0.35);
  // Who's in it: counted here (your own step shows at once), or as the boss's owner counted it.
  const here = membersHere(world);
  const n = Math.max(here.filter((g) => inRing(r, g.body)).length, r.n ?? 0);
  const slots = Math.min(6, Math.max(n, here.filter((g) => Math.abs(g.body.x - m.x) < 620).length, 1));
  r.pips ??= [];
  const pipY = y - 64 +Math.sin(time * 3) * 1.5;
  for (let i = 0; i < slots; i++) {
    const lit = (r.pips[i] = ease(r.pips[i] ?? 0, i < n ? 1 : 0, 0.18));
    const px = x + (i - (slots - 1) / 2) * 11;
    fxSprite(ctx, 'celcopipoff', px, pipY, { t: time + i * 0.2, alpha: born * (1 - lit) * 0.9 });
    if (lit > 0.02) fxSprite(ctx, 'celcopip', px, pipY - lit * 2, { t: time + i * 0.2, scale: 0.6 + 0.4 * lit + 0.15 * Math.sin(lit * Math.PI), alpha: born * Math.min(1, lit * 1.5) });
  }
}

// The Root Seal on the floor: its rune circle of roots (lighting up while someone holds it), the
// stone in the middle, and a leaf bobbing over it asking while nobody's on it.
function drawSealStone(ctx, s, cam, time) {
  const x = s.x - cam.x;
  const y = s.y - cam.y;
  const k = (s.glow = ease(s.glow ?? 0, s.heldBy ? 1 : 0, 0.12));
  // (It eases in where it lands each time it hops.)
  if (s.drawnAt !== s.x) {
    s.drawnAt = s.x;
    s.born = 0;
  }
  s.born = ease(s.born ?? 0, 1, 0.08);
  const b = smooth(s.born);
  fxSprite(ctx, 'celcoseal', x, y, { t: time, alpha: b * (1 - k), scale: 0.85 + 0.15 * b });
  fxSprite(ctx, 'celcosealheld', x, y, { t: time, alpha: b * k, scale: 0.85 + 0.15 * b });
  const lift = Math.sin(time * 2) * 0.8;
  fxSprite(ctx, 'celcosealstone', x, y + 1 + lift, { t: time, alpha: b });
  if (k < 0.95) fxSprite(ctx, 'celcosealask', x, y - 30 + lift, { t: time, alpha: b * (1 - k) });
}

function drawCalmStone(ctx, d, cam, time) {
  const x = d.spot.x - cam.x;
  const y = d.spot.y - cam.y;
  const fight = d.mobs.some((m) => m.hp > 0);
  ctx.save();
  softGlow(ctx, x, y - 14, 40, fight ? '#ffd6ea' : '#d2f5e4', 0.45 + 0.1 * Math.sin(time * 3));
  ctx.fillStyle = '#6a48ad';
  ctx.beginPath();
  ctx.ellipse(x, y - 13, 9, 14, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8dcff';
  ctx.beginPath();
  ctx.ellipse(x, y - 13, 7.6, 12.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = fight ? '#ff9ec8' : '#7fd1a0';
  ctx.beginPath();
  ctx.ellipse(x + 1, y - 12, 4.4, 7.4, 0, 0, TAU);
  ctx.fill();
  twinkle(ctx, x - 2, y - 18, 2.4, '#ffffff');
  for (let k = 0; k < 3; k++) {
    const u = (time * 0.5 + k / 3) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    twinkle(ctx, x + Math.sin(k * 2.1 + time) * 14, y - 20 - u * 26, 1.6, fight ? '#ffd6ea' : '#d2f5e4');
  }
  ctx.restore();
}

// ---------- Over everyone (with the glow) ----------

export function drawCoopFront(ctx, world, cam, time) {
  for (const m of coopBosses(world)) {
    const bx = m.x - cam.x;
    const by = m.y - (m.air ?? 0) - cam.y;
    for (const s of m.coop.mechs) {
      if (s.def.kind === 'sides') drawGuard(ctx, world, m, s, bx, by, time);
      if (s.def.kind === 'split' && s.ring) ringPips(ctx, world, m, s.ring, cam, time);
      if (s.def.kind === 'seal' && s.x != null) drawSealBeam(ctx, s, bx, by - m.def.h * 0.55, cam, time);
      if (s.def.kind === 'twins' && s.pair && !s.done) drawTether(ctx, world, s, cam, time);
    }
  }
  for (const f of world.coopFx ?? []) {
    const p = Math.min(0.999, f.t / f.dur);
    const x = f.x - cam.x;
    const y = f.y - cam.y;
    if (f.kind === 'split') {
      // The blow coming down in the boss's own shapes.
      fxSprite(ctx, HIT_OF[ringOf(f.boss)], x, y, { p, scale: (f.w ?? RING_W) / RING_W });
    } else if (f.kind === 'crack') {
      // The guard breaking: every piece snaps and tumbles off outward.
      const look = guardOf(f.boss);
      const { rx, ry } = guardSize({ w: f.w, h: f.h ?? f.w });
      for (const q of guardPieces(x, y, rx, ry, look.gap)) {
        const out = smooth(p) * 26;
        fxSprite(ctx, look.broke, q.x + q.side * out * Math.cos(q.th), q.y + out * Math.sin(q.th) * 0.6, { p, flip: q.side < 0, rot: look.upright ? 0 : q.rot });
      }
    } else if (f.kind === 'seal') {
      fxSprite(ctx, 'celcosealpop', x, y, { p });
    } else if (f.kind === 'twins' || f.kind === 'revive') {
      fxSprite(ctx, 'celcotwinpop', x, y, { p, scale: f.kind === 'revive' ? 0.8 : 1.1 });
    }
  }
}

// The guard: its pieces laid round the boss in two arcs. A half struck in the last beat shows its
// cracked drawing (light splitting it); while one half is lit the other pulses and a lilac pip
// over it asks for the blow. Broken, it's gone (the pieces fly, above) until it forms again,
// growing back in.
function drawGuard(ctx, world, m, s, bx, by, time) {
  const k = (s.shell = ease(s.shell ?? 1, s.guard ? 1 : 0, 0.1));
  if (k < 0.03) return;
  const look = guardOf(m.def.id);
  const cy = by - m.def.h * 0.5;
  const { rx, ry } = guardSize(m.def);
  const lit = {};
  for (const side of [-1, 1]) {
    const since = world.now - (s.hits[side] ?? -9);
    lit[side] = s.guard ? Math.max(0, 1 - since / s.def.window) : 0;
  }
  const e = smooth(k);
  for (const q of guardPieces(bx, cy, rx * (0.9 + 0.1 * e), ry * (0.9 + 0.1 * e), look.gap)) {
    const L = smooth(Math.min(1, lit[q.side] * 1.6));
    const waiting = s.guard && lit[-q.side] > 0 && lit[q.side] === 0;
    const a = e * (waiting ? 0.75 + 0.25 * Math.sin(time * 12) : 1);
    const o = { t: time + q.j * 0.17 + (q.side > 0 ? 0.5 : 0), flip: q.side < 0, rot: look.upright ? 0 : q.rot, scale: 0.7 + 0.3 * e, sy: look.brace && q.j % 2 ? -1 : 1 };
    if (L < 0.98) fxSprite(ctx, look.idle, q.x, q.y, { ...o, alpha: a * (1 - L) });
    if (L > 0.02) fxSprite(ctx, look.crack, q.x, q.y, { ...o, alpha: a * L });
  }
  for (const side of [-1, 1]) {
    if (!(s.guard && lit[-side] > 0 && lit[side] === 0)) continue;
    fxSprite(ctx, 'celcopipoff', bx + side * (rx + 14), cy - 8 + Math.sin(time * 6) * 2, { t: time, scale: 1.3, alpha: 0.6 + 0.4 * Math.sin(time * 12) });
  }
}

// The seal held: a ribbon of mint light braided from the stone to the boss, rippling, a leaf
// riding it.
function drawSealBeam(ctx, s, bx, by, cam, time) {
  const k = s.glow ?? 0;
  if (k < 0.05) return;
  const x = s.x - cam.x;
  const y = s.y - cam.y - 24;
  const mx = (x + bx) / 2;
  const my = Math.min(y, by) - 40 + Math.sin(time * 4) * 6;
  // It reaches out from the stone as it lights.
  const pts = along(x, y, mx, my, bx, by, 16).filter((q) => q.u <= k + 0.001);
  pts.forEach((q, i) => fxSprite(ctx, 'celcosealbeam', q.x, q.y, { t: time - i * 0.11, rot: q.a, alpha: Math.min(1, k * 1.4) }));
}

// The twins' tether: a pink spore-thread sagging between them; once one falls it frays red, and
// the fray takes over as its twin's call-back nears.
function drawTether(ctx, world, s, cam, time) {
  const [a, b] = s.pair;
  const ax = a.x - cam.x;
  const ay = a.y - a.def.h * 0.5 - cam.y;
  const bx = b.x - cam.x;
  const by = b.y - b.def.h * 0.5 - cam.y;
  const alone = s.alone != null ? Math.min(1, (world.now - s.alone) / s.def.revive) : 0;
  s.fray = ease(s.fray ?? 0, s.alone != null ? 0.35 + 0.65 * alone : 0, 0.1);
  const sag = 20 + Math.sin(time * 3) * 4;
  const pts = along(ax, ay, (ax + bx) / 2, Math.max(ay, by) + sag, bx, by, 15);
  pts.forEach((q, i) => {
    const o = { t: time + i * 0.09, rot: q.a };
    if (s.fray < 0.98) fxSprite(ctx, 'celcotether', q.x, q.y, { ...o, alpha: 1 - s.fray });
    if (s.fray > 0.02) fxSprite(ctx, 'celcotetherfray', q.x, q.y, { ...o, alpha: s.fray * (0.8 + 0.2 * Math.sin(time * 16 + i)) });
  });
}
