// The capsule machines (data/outfits-gacha.js) on screen: the machine itself (a glass globe of
// capsules on a painted base, a crank, a chute) themed per town, and the capsule a pull drops
// (it rolls out, wobbles, pops open in a burst, and the look inside rises out in its rarity's
// glow). Sprites are cached per frame; motion comes from where things are drawn, not stretching.

import { E, T, F, R, sprite, blit, snap, mix, shade } from './pixel.js';
import { ITEMS } from '../data/items.js';
import { GACHA_LOOKS, GACHA_SETS } from '../data/outfits-gacha.js';

const INK = '#3a2d4f';
const RARITY = {
  common: { glow: '#bfe6ff', capsule: '#8fd3ff', label: 'Common' },
  rare: { glow: '#e2c6ff', capsule: '#b48cff', label: 'Rare' },
  star: { glow: '#fff1a8', capsule: '#ffd23f', label: 'Star prize' },
};
export const rarityOf = (r) => RARITY[r] ?? RARITY.common;

// Sprout Village's machine: a sprout-green base with a painted flower, a gold crank, a glass
// globe of pastel capsules, and a little sprout growing from its lid.
const SPROUT = { base: '#7fd17a', trim: '#ffd23f', lid: '#ff9ec0', capsules: ['#ff9ec0', '#ffe066', '#8fd3ff', '#b8f0a8', '#e2c6ff', '#ffb38a'] };

function machineArt(theme, crank, shake) {
  return sprite(`gacha|machine|${crank}|${shake}`, () => {
    const W = 64;
    const H = 96;
    const b = theme.base;
    const out = [];
    // The base: a rounded block, darker at the bottom, a painted flower and the coin slot.
    out.push(T([[12, 50], [52, 50], [56, 58], [56, 90], [52, 94], [12, 94], [8, 90], [8, 58]], b));
    out.push(F(T([[8, 84], [56, 84], [56, 90], [52, 94], [12, 94], [8, 90]], shade(b, -18))));
    out.push(F(T([[12, 52], [52, 52], [54, 56], [10, 56]], mix(b, '#ffffff', 0.35))));
    for (let k = 0; k < 5; k++) {
      const a = (Math.PI / 2) + (k * 2 * Math.PI) / 5;
      out.push(E(22 + Math.cos(a) * 3.2, 70 - Math.sin(a) * 3.2, 2.6, 2.6, '#ffffff'));
    }
    out.push(F(E(22, 70, 2, 2, theme.trim)));
    out.push(F(R(36, 62, 10, 3, shade(b, -30))), F(R(37, 62.6, 8, 1, '#2a2238')));
    // The chute, with its flap.
    out.push(T([[30, 80], [46, 80], [46, 90], [30, 90]], shade(b, -26)), F(T([[31, 81], [45, 81], [45, 89], [31, 89]], '#2a2238')));
    out.push(F(T([[31, 81], [45, 81], [45, 83.4], [31, 83.4]], mix(b, '#ffffff', 0.2))));
    // The crank: a gold disc and handle, turned by `crank` (0-3, quarter turns).
    const a = (crank * Math.PI) / 2;
    out.push(E(50, 72, 5.6, 5.6, theme.trim), F(E(50, 72, 3.4, 3.4, shade(theme.trim, -14))));
    const hx = 50 + Math.cos(a) * 4.6;
    const hy = 72 - Math.sin(a) * 4.6;
    out.push(T([[50 - Math.sin(a), 72 - Math.cos(a)], [hx - Math.sin(a), hy - Math.cos(a)], [hx + Math.sin(a), hy + Math.cos(a)], [50 + Math.sin(a), 72 + Math.cos(a)]], shade(theme.trim, -22)));
    out.push(E(hx, hy, 2, 2, '#ffffff'), F(E(hx - 0.5, hy - 0.5, 0.8, 0.8, theme.trim)));
    // The collar the globe sits in.
    out.push(T([[10, 46], [54, 46], [56, 52], [8, 52]], theme.trim), F(T([[8, 50], [56, 50], [56, 52], [8, 52]], shade(theme.trim, -18))));
    // The globe of capsules (they jostle when cranked), then the glass and its shine.
    const g = { x: 32, y: 28, r: 21 };
    out.push(E(g.x, g.y, g.r, g.r, '#e8f6ff'));
    const pile = [];
    for (let row = 0; row < 4; row++) {
      for (let k = 0; k < 6 - row; k++) {
        const x = g.x - 14 + row * 3 + k * 5.6 + (shake ? ((row + k) % 2 ? 1 : -1) : 0);
        const y = g.y + 14 - row * 5 - (shake && (row + k) % 3 === 0 ? 1.4 : 0);
        if (Math.hypot(x - g.x, y - g.y) > g.r - 3) continue;
        pile.push([x, y, theme.capsules[(row * 3 + k) % theme.capsules.length]]);
      }
    }
    for (const [x, y, c] of pile) out.push(E(x, y, 2.8, 2.8, c), F(T([[x - 2.8, y], [x + 2.8, y], [x + 2.6, y + 1.2], [x - 2.6, y + 1.2]], '#ffffff')), F(E(x - 1, y - 1.2, 0.8, 0.6, '#ffffff')));
    out.push(F(T([[g.x - 15, g.y - 6], [g.x - 11, g.y - 14], [g.x - 6, g.y - 17], [g.x - 9, g.y - 12], [g.x - 13, g.y - 3]], '#ffffff')));
    // The lid and the sprout growing from it.
    out.push(E(g.x, g.y - g.r + 1, 7, 3, theme.lid), F(E(g.x - 2, g.y - g.r, 3, 1, mix(theme.lid, '#ffffff', 0.5))));
    out.push(F(R(g.x - 0.6, g.y - g.r - 7, 1.2, 6, '#4fae5f')));
    out.push(T([[g.x, g.y - g.r - 5], [g.x - 6, g.y - g.r - 9], [g.x - 3, g.y - g.r - 4]], '#7fd17a'), T([[g.x, g.y - g.r - 6], [g.x + 6, g.y - g.r - 10], [g.x + 3, g.y - g.r - 5]], '#7fd17a'));
    return { w: W, h: H, shapes: out, res: 2, soft: 'cel', crisp: true, selout: true };
  });
}

// The machine standing with its feet at (x, y). `crank` 0-3 turns the handle; `shake` jostles
// the capsules (while a pull is going).
export function drawMachine(ctx, x, y, { crank = 0, shake = false, theme = SPROUT } = {}) {
  const s = machineArt(theme, crank % 4, shake);
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}

// A capsule: two halves (the top in the rarity's colour, the bottom white), `open` 0-1 lifting the
// top half off and tipping it back.
function capsuleArt(color, open) {
  return sprite(`gacha|capsule|${color}|${open}`, () => {
    const out = [];
    const lift = open * 6;
    const tip = open * 0.6;
    out.push(E(8, 12, 7, 6, '#ffffff'), F(T([[1, 12], [15, 12], [15, 13], [1, 13]], '#e6e2ee')));
    const top = [];
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      const px = Math.cos(a) * 7;
      const py = Math.sin(a) * 6;
      top.push([8 + px * Math.cos(tip) - py * Math.sin(tip), 12 - lift + px * Math.sin(tip) + py * Math.cos(tip)]);
    }
    out.push(T(top, color), F(E(5 - open * 2, 8.4 - lift, 2, 1, '#ffffff')));
    return { w: 16, h: 20, shapes: out, res: 3, soft: 'cel', crisp: true, selout: true };
  });
}

export function drawCapsule(ctx, x, y, { rarity = 'common', open = 0 } = {}) {
  const s = capsuleArt(rarityOf(rarity).capsule, Math.round(open * 4) / 4);
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}

// A reveal: soft rings of the rarity's colour opening out, rays turning behind, and a ring of
// sparkles flying out (a star prize gets more of everything). `t` is seconds since the pop.
export function drawBurst(ctx, x, y, t, rarity = 'common') {
  const r = rarityOf(rarity);
  const big = rarity === 'star' ? 1.4 : rarity === 'rare' ? 1.15 : 1;
  const fade = Math.max(0, 1 - Math.max(0, t - 0.6) / 1);
  ctx.save();
  // Rays turning slowly behind.
  const rays = rarity === 'common' ? 0 : 10;
  for (let k = 0; k < rays; k++) {
    const a = (k / rays) * TAU + t * 0.6;
    const len = 44 * big * ease(Math.min(1, t * 2.5));
    ctx.globalAlpha = 0.28 * fade;
    ctx.fillStyle = r.glow;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a - 0.09) * len, y + Math.sin(a - 0.09) * len);
    ctx.lineTo(x + Math.cos(a + 0.09) * len, y + Math.sin(a + 0.09) * len);
    ctx.fill();
  }
  // Soft rings, widest and faintest outside.
  const open = ease(Math.min(1, t * 3));
  for (const [k, a] of [[1, 0.18], [0.7, 0.28], [0.42, 0.45]]) {
    ctx.globalAlpha = a * fade;
    ctx.fillStyle = k < 0.5 ? '#ffffff' : r.glow;
    ctx.beginPath();
    ctx.arc(x, y, 34 * big * k * open, 0, TAU);
    ctx.fill();
  }
  // Sparkles flying out.
  const n = rarity === 'star' ? 12 : 8;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * TAU + 0.3;
    const d = (10 + ease(Math.min(1, t * 1.4)) * 30) * big * (k % 2 ? 0.8 : 1);
    star4(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.8, (k % 2 ? 2.2 : 3.2) * (1 - Math.min(1, t * 0.6)), k % 3 ? '#ffffff' : r.glow, fade);
  }
  ctx.restore();
}

// ---------- Living outfits: the effects the capsule looks carry ----------
// Each gacha look can carry an effect (data/outfits-gacha.js `fx`): golden pollen spiralling up off
// the Bloom Crown, petals tumbling off the Petal Dress (a shower while you walk), flowers budding
// and opening round your feet in Root Sandals, a glint on the Dew Sparkle, glowing fireflies and a
// shimmer on the Dewdrop Wings. Wearing the whole set adds its own bonus: a pool of spring light
// at your feet, a butterfly that flits round you and settles on your crown, and every few seconds
// a spring bloom (a ring of flowers opening round you and petals spiralling up). All of it runs on
// the time and the hero's own seed, eased in and out: small soft shapes, nothing stretched.

const TAU = Math.PI * 2;

// The effects a hero's worn gear carries: { fx: Set, sets: Set }, or null when there are none.
export function outfitFx(gear) {
  if (!gear) return null;
  let fx = null;
  const worn = new Map();
  for (const inst of Object.values(gear)) {
    const def = inst?.id ? ITEMS[inst.id] : null;
    if (def?.family !== 'gacha') continue;
    const e = GACHA_LOOKS[def.tier];
    if (!e) continue;
    if (!worn.has(e.machine)) worn.set(e.machine, new Set());
    worn.get(e.machine).add(e.key);
    if (e.fx) (fx ??= new Set()).add(e.fx);
  }
  if (!worn.size) return null;
  const sets = new Set();
  for (const [machine, keys] of worn) {
    if (GACHA_SETS[machine] && GACHA_LOOKS.filter((e) => e.machine === machine).every((e) => keys.has(e.key))) {
      sets.add(GACHA_SETS[machine].fx);
      (fx ??= new Set()).add(GACHA_SETS[machine].fx);
    }
  }
  return fx ? { fx, sets } : null;
}

const ease = (u) => u * u * (3 - 2 * u);
const clamp01 = (u) => Math.max(0, Math.min(1, u));
// 0 -> 1 over [a, b], eased.
const rise = (u, a, b) => ease(clamp01((u - a) / (b - a)));
// A soft glowing dot: a faint wide halo, a softer middle and a bright core, its halo added as light.
function mote(ctx, x, y, r, core, halo, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = halo;
  ctx.globalAlpha = a * 0.16;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = a * 0.3;
  ctx.beginPath();
  ctx.arc(x, y, r * 1.9, 0, TAU);
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = a;
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
// The game's curvy sparkle star, with a soft halo.
function star4(ctx, x, y, r, c, a, halo = null) {
  if (a <= 0.01 || r <= 0.05) return;
  if (halo) mote(ctx, x, y, r * 0.35, c, halo, a * 0.8);
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}
// A petal tumbling: it turns over as it falls (its width follows the turn, like a real petal).
function petalAt(ctx, x, y, r, rot, turn, c, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  const w = Math.max(0.25, Math.abs(Math.cos(turn)));
  ctx.fillStyle = shade(c, -0.18);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.12, r * 0.62 * w + 0.15, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.55 * w, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = a * 0.7;
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.15 * w, r * 0.35, r * 0.18 * w, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
// A flower budding and opening: `g` 0..1 grows a stem and a bud, then the petals unfold.
function bloomAt(ctx, x, y, r, c, a, g) {
  if (g <= 0.01 || a <= 0.01) return;
  const stem = Math.min(1, g * 2.2) * r * 1.6;
  ctx.globalAlpha = a;
  ctx.strokeStyle = '#4fae5f';
  ctx.lineWidth = Math.max(0.4, r * 0.32);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - stem);
  ctx.stroke();
  // Two leaves at the foot of the stem.
  ctx.fillStyle = '#7fd17a';
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x + sd * r * 0.7, y - r * 0.3, r * 0.75 * Math.min(1, g * 2), r * 0.3, sd * -0.5, 0, TAU);
    ctx.fill();
  }
  const cy = y - stem;
  const open = rise(g, 0.35, 1);
  if (open < 0.05) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x, cy, r * 0.5 * Math.min(1, g * 3), 0, TAU);
    ctx.fill();
    return;
  }
  const pr = r * (0.45 + 0.55 * open);
  for (let k = 0; k < 5; k++) {
    const ang = -Math.PI / 2 + (k * TAU) / 5;
    const d = pr * 0.85 * open;
    ctx.fillStyle = shade(c, -0.15);
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * d, cy + Math.sin(ang) * d, pr * 0.78, 0, TAU);
    ctx.fill();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * d, cy + Math.sin(ang) * d, pr * 0.66, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe066';
  ctx.beginPath();
  ctx.arc(x, cy, pr * 0.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - pr * 0.15, cy - pr * 0.18, pr * 0.18, 0, TAU);
  ctx.fill();
}
// A little sky-blue butterfly (blue so it stands out on the pink crown), wings beating (`beat` 0..1, how open), facing `f`.
function butterfly(ctx, x, y, s, beat, f, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.scale(f * s, s);
  const w = 0.2 + 0.8 * beat;
  for (const [cx, cy, rx, ry, c, e] of [[-1.6, -1.4, 2.4, 2.1, '#8fd8ff', '#3f8fd0'], [-1.2, 1.1, 1.6, 1.5, '#c8f0ff', '#5aa8dc']]) {
    for (const sd of [1, -0.55]) {
      ctx.fillStyle = sd > 0 ? e : shade(e, -0.15);
      ctx.beginPath();
      ctx.ellipse(cx * w * sd, cy, rx * w + 0.3, ry + 0.3, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = sd > 0 ? c : shade(c, -0.12);
      ctx.beginPath();
      ctx.ellipse(cx * w * sd, cy, rx * w, ry, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(-1.9 * w, -1.8, 0.8 * w, 0.6, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#5a4470';
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.45, 1.8, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#5a4470';
  ctx.lineWidth = 0.25;
  ctx.beginPath();
  ctx.moveTo(0, -1.6);
  ctx.quadraticCurveTo(0.6, -3, 1.4, -3.2);
  ctx.stroke();
  ctx.restore();
}

// The figure: the head is drawn at full size, the body below the neck (24) is squeezed into the
// chibi body, so the whole hero stands about 39 art pixels tall.
const NECK = 24;
const TALL = NECK + 14 * 0.56 + 18 * 0.56 * 0.72;
const artY = (ly) => (ly <= NECK ? TALL - ly : TALL - NECK - (ly - NECK) * 0.56);

// Draws one layer ('back', behind the hero, or 'front') of the worn looks' effects. (x, y) is
// where the hero stands; `state` gives the time, scale, facing and whether they're on the move.
export function drawOutfitFx(ctx, worn, layer, x, y, state) {
  const t = (state.time ?? 0) + (state.seed ?? 0) * 1.37;
  const s = state.scale ?? 1;
  const f = state.facing ?? 1;
  const pose = state.pose ?? 'idle';
  const moving = pose === 'walk' || pose === 'run';
  const still = pose === 'idle';
  const at = (lx, ly) => [x + f * (lx - 15.5) * s, y - artY(ly) * s];
  const fx = worn.fx;
  const set = worn.sets.size > 0;
  const back = layer === 'back';
  ctx.save();

  // ---- The set bonus: a pool of spring light underfoot (behind everything). ----
  if (set && back) {
    const p = 0.75 + 0.25 * Math.sin(t * 1.8);
    ctx.globalAlpha = 0.16 * p;
    ctx.fillStyle = '#b8f0a8';
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5 * s, 25 * s, 5.4 * s, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = 0.45 * p;
    ctx.strokeStyle = '#e2ffd8';
    ctx.lineWidth = 0.6 * s;
    ctx.beginPath();
    ctx.ellipse(x, y - 0.5 * s, 22 * s, 4.6 * s, 0, 0, TAU);
    ctx.stroke();
    // Sparkles running round the ring.
    for (let k = 0; k < 4; k++) {
      const ang = t * 0.8 + (k * TAU) / 4;
      star4(ctx, x + Math.cos(ang) * 22 * s, y - 0.5 * s + Math.sin(ang) * 4.6 * s, 1.2 * s * p, '#f2fff0', 0.8 * p, '#9ff2c8');
    }
  }

  // ---- Petals off the dress: a few tumbling down standing, a shower trailing behind on the move. ----
  if (fx.has('petals') && back) {
    const n = moving ? 11 : 5;
    for (let k = 0; k < n; k++) {
      const u = (t * (moving ? 0.85 : 0.3) + k / n) % 1;
      const sx = ((k * 37) % 13) - 6;
      const px = x + (sx + Math.sin(t * 1.6 + k) * 3.5) * s - f * (moving ? u * 30 : u * 5) * s;
      const py = y - (14 - u * 13) * s + Math.sin(u * 9 + k) * 1.2 * s;
      petalAt(ctx, px, py, 1.6 * s, t * 2 + k, t * 4 + k * 1.3, ['#ffb7d3', '#ffd6e6', '#ffffff', '#ff9ec0'][k % 4], Math.sin(Math.PI * u) * 0.95);
    }
  }

  // ---- Flowers budding and opening round the feet while you stand (the sandals). ----
  if (fx.has('blooms') && still && back) {
    const spots = set ? [-15, -9, 10, 16, -21, 22] : [-11, 10, 16];
    spots.forEach((dx, k) => {
      const u = (t / 3.6 + k * 0.37) % 1;
      const g = rise(u, 0, 0.3);
      const a = 1 - rise(u, 0.82, 1);
      bloomAt(ctx, x + dx * s, y, 1.5 * s, ['#ff9ec0', '#ffffff', '#ffe066', '#e2c6ff'][k % 4], 0.95 * a, g);
    });
  }

  // ---- The wings' shimmer: light running along the wings, and a dewdrop now and then. ----
  if (fx.has('fireflies') && back) {
    for (let k = 0; k < 4; k++) {
      const u = (t * 0.55 + k * 0.25) % 1;
      const [wx, wy] = at(-2 - u * 9 + (k % 2) * 3, 30 - u * 14 + (k % 2) * 6);
      star4(ctx, wx, wy, (1.4 + (k % 2) * 0.6) * s * Math.sin(Math.PI * u), '#f2fff8', 0.9 * Math.sin(Math.PI * u), '#9ff2c8');
    }
    const u = (t / 2.6) % 1;
    const [tx, ty] = at(-9, 33);
    const drop = rise(u, 0.2, 1);
    mote(ctx, tx, ty + drop * 12 * s, (0.9 - drop * 0.3) * s, '#e8fbff', '#a8e8ff', rise(u, 0, 0.2) * (1 - rise(u, 0.75, 1)));
  }

  // ---- Fireflies circling the wings: half the round behind the hero, half in front, glowing. ----
  if (fx.has('fireflies')) {
    const n = set ? 8 : 6;
    const pos = (k, tt) => {
      const ang = tt * 0.7 + (k * TAU) / n + Math.sin(tt * 1.3 + k) * 0.25;
      return [ang, x - f * 2 * s + Math.cos(ang) * 21 * s, y - (22 + Math.sin(tt * 1.1 + k * 0.9) * 8) * s + Math.sin(ang) * 5 * s];
    };
    for (let k = 0; k < n; k++) {
      const [ang, cx, cy] = pos(k, t);
      if (!back !== Math.sin(ang) > 0) continue;
      const blink = 0.4 + 0.6 * ease(0.5 + 0.5 * Math.sin(t * 3.1 + k * 1.7));
      // A trail along the path it just flew, longer on the move.
      const trail = moving ? 5 : 2;
      for (let j = trail; j >= 1; j--) {
        const [, ox, oy] = pos(k, t - j * 0.06);
        mote(ctx, ox - (moving ? f * j * 2.2 * s : 0), oy, (0.75 - j * 0.09) * s, '#f6ffc8', '#c8ff5a', blink * (0.45 - j * 0.07));
      }
      mote(ctx, cx, cy, 1.05 * s, '#fffbe0', '#d8ff6a', blink);
    }
  }

  if (!back) {
    // ---- Golden pollen spiralling up off the crown, twinkling. ----
    if (fx.has('pollen')) {
      for (let k = 0; k < 7; k++) {
        const u = (t * 0.28 + k / 7) % 1;
        const ang = u * TAU * 1.2 + k * 0.9;
        const [hx, hy] = at(15.5 + Math.cos(ang) * (11 - u * 5), 3 - u * 16);
        const a = Math.sin(Math.PI * u);
        if (k % 3 === 0) star4(ctx, hx, hy, 1.5 * s * a, '#fff6c8', a, '#ffd23f');
        else mote(ctx, hx, hy, 0.6 * s, '#fff6c8', '#ffd23f', a * 0.9);
      }
    }
    // ---- A glint across the cheek dewdrops now and then. ----
    if (fx.has('glints')) {
      for (const [k, lx] of [[0, 8.6], [1, 22.4]]) {
        const u = (t / 2.4 + k * 0.5) % 1;
        if (u > 0.24) continue;
        const [gx, gy] = at(lx, 21);
        const g = Math.sin(Math.PI * (u / 0.24));
        star4(ctx, gx, gy, 3 * g * s, '#ffffff', 0.95, '#a8e8ff');
      }
    }
  }

  // ---- The set bonus: the spring bloom and the butterfly. ----
  if (set) {
    // Every few seconds: a ring of flowers opens round the feet, petals spiral up round the
    // hero and burst into sparkles over the head. Front and back halves of the ring and spiral.
    const u = (t / 6.5) % 1;
    if (u < 0.36) {
      const v = u / 0.36;
      const fade = 1 - rise(v, 0.75, 1);
      for (let k = 0; k < 8; k++) {
        const ang = (k * TAU) / 8 + 0.3;
        if (!back !== Math.sin(ang) > 0) continue;
        const g = rise(v, k * 0.04, k * 0.04 + 0.35);
        bloomAt(ctx, x + Math.cos(ang) * 24 * s, y + Math.sin(ang) * 4 * s, 1.6 * s, ['#ff9ec0', '#ffffff', '#ffe066', '#e2c6ff'][k % 4], fade, g);
      }
      for (let k = 0; k < 12; k++) {
        const w = clamp01((v - k * 0.025) / 0.6);
        if (w <= 0 || w >= 1) continue;
        const ang = w * TAU * 1.5 + k * 1.1;
        if (!back !== Math.sin(ang) > 0) continue;
        const r = (20 - w * 10) * s;
        petalAt(ctx, x + Math.cos(ang) * r, y - w * 46 * s + Math.sin(ang) * 4 * s, 1.6 * s, ang, ang * 2, ['#ffb7d3', '#ffffff', '#ff9ec0', '#e2c6ff'][k % 4], Math.sin(Math.PI * w));
      }
      if (!back) {
        const b = rise(v, 0.55, 0.7) * (1 - rise(v, 0.75, 1));
        for (let k = 0; k < 6; k++) {
          const ang = (k * TAU) / 6 + v * 2;
          const d = (6 + rise(v, 0.55, 1) * 12) * s;
          star4(ctx, x + Math.cos(ang) * d, y - 48 * s + Math.sin(ang) * d * 0.6, 2 * s * b, '#fff6c8', b, '#ffb7d3');
        }
      }
    }
    // A butterfly flitting round the hero, now and then settling on the crown to rest.
    const c = (t / 10) % 1;
    const land = rise(c, 0.5, 0.6) * (1 - rise(c, 0.85, 0.94));
    const fa = t * 0.9;
    const fly = [x + Math.sin(fa) * 24 * s, y - (30 + Math.sin(fa * 1.7) * 9 + Math.sin(t * 6) * 1.2) * s];
    const [rx, ry] = at(19.5, -0.4);
    const bx = fly[0] + (rx - fly[0]) * land;
    const by = fly[1] + (ry - fly[1]) * land;
    const inFront = land > 0.5 || Math.cos(fa) > 0;
    if (inFront !== back) {
      // Quick beats in flight, slow resting opens and closes once settled.
      const beat = land > 0.95 ? 0.55 + 0.45 * Math.sin(t * 1.6) : 0.5 + 0.5 * Math.sin(t * 22);
      const dir = land > 0.5 ? -f : Math.cos(fa) >= 0 ? 1 : -1;
      butterfly(ctx, bx, by, s * 1.25, beat, dir, 1);
    }
  }
  ctx.restore();
}
