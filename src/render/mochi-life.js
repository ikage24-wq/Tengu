// The big moments of a Mochi's life, played where it stands: hatching and evolving.
//
// Hatching (`m.hatch = { t0 }`, an egg's genes in `m.genes`): the mochi ball wobbles in its
// mortar, then puffs up like mochi toasting, a blister swelling on top, a wisp of steam; it bursts
// in a puff of flour and the Mochiko springs out, landing beside the mortar (the `born` action).
// `m.hatched` is set once it's all done.
//
// Evolving (`m.evolve = { t0, path: 'angel' | 'demon' }`): its sprout glows and grows a big leaf that
// wraps down over it like a kashiwa mochi's; the bundle wobbles and glows (gold on the angel path,
// plum on the demon one), bursts open, and out it springs grown (the `evolved` action).
// `m.evolved` is set once it's all done.
import { E, T, F } from './pixel.js';
import { limb } from './figure.js';
import { art, place } from './scenery.js';
import { drawMochiAnim } from './mochi-anim.js';
import { drawHatchEgg, lookOf, MOCHI_SIZE } from './wagashi.js';

const TAU = Math.PI * 2;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeIO = (k) => 0.5 - 0.5 * Math.cos(Math.PI * clamp01(k));
const easeOut = (k) => 1 - (1 - clamp01(k)) ** 2;
const RARE_SPARK = { common: '#ffffff', uncommon: '#ffffff', rare: '#bfe4ff', epic: '#ffc8e8', legendary: '#ffe27a', mythic: '#ffd9a0', mutation: '#c8b8ff' };
const GLOW = { angel: ['#fff3c4', '#ffd75a'], demon: ['#f2a8d8', '#b8487e'], moon: ['#fffbe6', '#b8a4f0'] };

function twinkle(ctx, x, y, r, c) {
  const k = r * 0.3;
  ctx.fillStyle = c;
  ctx.beginPath();
  for (const [a, b] of [[0, -r], [k, -k], [r, 0], [k, k], [0, r], [-k, k], [-r, 0], [-k, -k]]) ctx.lineTo(x + a, y + b);
  ctx.closePath();
  ctx.fill();
}
// A soft round glow.
function glow(ctx, x, y, r, c, a) {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, c);
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = a;
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A burst: puffs (flour, or bits of light) thrown out and up from (x, y), slowing and fading,
// and sparkles, `age` seconds in (over by 0.9).
function burst(ctx, x, y, age, k, puff, spark) {
  if (age < 0 || age > 0.9) return;
  const u = age / 0.9;
  const out = 1 - (1 - u) * (1 - u);
  ctx.save();
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI * (0.05 + 0.9 * (i / 11)) + Math.sin(i * 7.3) * 0.15;
    const d = (10 + 6 * Math.abs(Math.sin(i * 3.1))) * out * k;
    const r = (1.6 + 1.2 * Math.abs(Math.sin(i * 5.7))) * (1 - 0.5 * u) * k;
    ctx.globalAlpha = 0.9 * (1 - u);
    ctx.fillStyle = puff;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9 + u * u * 4 * k, r, 0, TAU);
    ctx.fill();
  }
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI * (0.15 + 0.7 * (i / 5));
    const d = (13 + 4 * Math.sin(i * 2.3)) * out * k;
    ctx.globalAlpha = 1 - u;
    twinkle(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d, (1.6 - u) * k, spark);
  }
  ctx.restore();
}

// ---------- Hatching ----------
const POP = 2.4;
export function drawHatch(ctx, m, x, y, time) {
  const h = m.hatch;
  h.t0 ??= time;
  const e = Math.max(0, time - h.t0);
  const g = m.genes;
  const k = MOCHI_SIZE.baby / 0.6;
  const dir = m.dir || 1;
  if (e < POP) {
    // Rocking in its mortar, gently, then faster and harder (eased in, its swing smooth); puffing up
    // smoothly like mochi toasting; steam rising off it; a glow building just before it pops.
    const build = clamp01((e - 1) / (POP - 1));
    const rock = (0.035 + 0.05 * build) * easeIO(e / 0.5) * Math.sin(TAU * (1.3 * e + 1.2 * Math.max(0, e - 1) ** 2 / (POP - 1)));
    const puff = e < 1 ? 0 : easeIO((e - 1) / 1.2);
    drawHatchEgg(ctx, x, y, g, puff, 0, false, 1, rock, m.eggScale);
    if (e > POP - 0.35) glow(ctx, x, y - 16 * k, 15 * k, '#ffffff', ((e - (POP - 0.35)) / 0.35) ** 2 * 0.95);
    if (puff > 0) {
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const u = ((e - 1) * 0.9 + i / 3) % 1;
        ctx.globalAlpha = 0.5 * Math.sin(Math.PI * u);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + (i - 1) * 3 * k + Math.sin(u * 6 + i) * 1.2 * k, y - (22 + puff * 6 + u * 10) * k, (0.8 + u * 1.4) * k, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      // About to go: a sparkle or two winking on it.
      if (e > POP - 0.6) twinkle(ctx, x + (Math.floor(e * 8) % 2 ? 5 : -4) * k, y - (20 + puff * 4) * k, 1.6 * k, RARE_SPARK[g.rarity] ?? '#ffffff');
    }
    return;
  }
  // Out: the empty mortar (it fades away once the Mochiko has landed), the Mochiko springing out to
  // land beside it, and the burst of flour over the moment it appears.
  const after = e - POP;
  drawHatchEgg(ctx, x, y, g, 0, 0, true, after < 2.5 ? 1 : clamp01(1 - (after - 2.5) / 0.8), 0, m.eggScale);
  if (!m.action && !m.hatchStarted) {
    m.hatchStarted = true;
    m.size = 'baby';
    m.noIdle = true;
    m.action = { name: 'born', t0: h.t0 + POP };
  }
  const u = clamp01(after / 0.8);
  const ox = dir * 17 * k * (1 - (1 - u) * (1 - u));
  drawMochiAnim(ctx, m, x + ox, y + 1.5 * k * u, time);
  glow(ctx, x, y - 16 * k, 14 * k, '#ffffff', clamp01(1 - after / 0.35) * 0.9);
  burst(ctx, x, y - 16 * k, after, k, '#fffaf4', RARE_SPARK[g.rarity] ?? '#ffffff');
  if (!m.action && m.hatchStarted && !m.hatched) {
    m.hatched = true;
    m.noIdle = false;
  }
}

// ---------- Evolving ----------
const LEAF = '#5e9a48';
const LEAF_LT = '#6fae52';
const RIB = '#467a34';
const VEIN = '#8cc46a';
// The leaf it wraps itself in, seen from the front: one side folded over the other, a midrib
// down the front fold and veins, the tip curling over at the top, and the top of its head and its
// sprout peeking out. (30 x 54, at a Mochiko's size.)
const down = (shapes, dy) => shapes.map((sh) => ({ ...sh, y: (sh.y ?? 0) + dy }));
const cocoonShapes = (hair) => [
  ...down([T([[15, 48], [5, 45], [1.6, 34], [2, 20], [6, 9], [12, 3.4], [16.6, 1.6], [21, 3], [25.4, 9], [28.4, 20], [28.6, 34], [25, 45]], LEAF)], 4),
  E(15.5, 9.6, 7.6, 5.2, hair), F(E(12.8, 7.4, 2.6, 1, '#ffffff')),
  F(limb(15.6, 5, 15.8, 1.4, 0.6, 0.5, '#4f8f45')), T([[15.8, 1.8], [18.4, 0.2], [20.2, 1], [18.2, 2.8]], '#86c96e'), T([[15.6, 2], [13.2, 0.4], [11.4, 1.2], [13.4, 3]], '#78b862'),
  ...down(frontLeaf(), 4),
];
const frontLeaf = () => [
  T([[4, 40], [3.4, 28], [7, 16], [13, 9.6], [19.6, 7], [24.6, 7.4], [21, 11], [24.6, 18], [27, 30], [25.4, 42], [18, 47.2], [9, 46]], LEAF_LT),
  F(limb(15.4, 46.6, 19, 7.2, 0.7, 0.5, RIB)),
  ...[[16, 38, 9, 33], [16.6, 30, 8.4, 24], [17.6, 22, 11, 15.4], [16.2, 38, 23, 32], [17, 30, 24.4, 23.6], [18, 21.4, 23.2, 14.4]].map(([a, b, c, d]) => F(limb(a, b, c, d, 0.35, 0.25, VEIN))),
  // The tip of the leaf curling over at the top, and the stalk.
  T([[19.6, 7], [24.6, 7.4], [25.8, 4.8], [23.8, 2.8], [21, 3.8]], LEAF_LT), F(limb(15.4, 47.4, 14, 49.4, 0.8, 0.6, RIB)),
];
const cocoon = (hair) => art(`mochi-cocoon|${hair}`, 30, 54, () => cocoonShapes(hair));
// The big leaf growing up out of its sprout first, at a size step 1-4.
const LEAF_SIZES = 12;
const bigLeaf = (n) => art(`mochi-bigleaf|${n}`, 30, 40, () => {
  const z = n / LEAF_SIZES;
  const p = (pts) => pts.map(([px, py]) => [15 + (px - 15) * z, 40 + (py - 40) * z]);
  return [F(limb(15, 40, 15, 40 - 8 * z, 0.8, 0.7, RIB)), T(p([[15, 34], [8, 26], [6, 14], [11, 4], [15, 0.6], [19, 4], [24, 14], [22, 26]]), LEAF_LT), F(limb(...p([[15, 33]])[0], ...p([[15, 3]])[0], 0.6, 0.35, RIB))];
});
// The two halves of the leaf flying apart when it bursts.
const halfLeaf = (side) => art(`mochi-halfleaf|${side}`, 30, 30, () => {
  const a = side * 0.6;
  const turn = (pts) => pts.map(([px, py]) => [15 + (px - 15) * Math.cos(a) - (py - 15) * Math.sin(a), 15 + (px - 15) * Math.sin(a) + (py - 15) * Math.cos(a)]);
  const m = (px) => 15 + side * (px - 15);
  return [T(turn([[m(15), 28], [m(10), 26.4], [m(6.4), 21], [m(5.4), 14], [m(7.4), 7], [m(11.6), 2.6], [m(15), 1.4], [m(16.4), 15]]), side < 0 ? LEAF : LEAF_LT),
    F(T(turn([[m(15.2), 27.6], [m(16.6), 15], [m(15.2), 1.8], [m(14.4), 15]]), RIB)),
    ...[[22, 9.6], [15, 7.8], [8, 9.4]].map(([vy, vx]) => { const [[x1, y1], [x2, y2]] = turn([[m(15.2), vy], [m(vx), vy - 3.6]]); return F(limb(x1, y1, x2, y2, 0.4, 0.25, VEIN)); })];
});

const GROW = 2.2; // the leaf grows up out of its sprout
const WRAP = 2.9; // ...and has wrapped down over it
const BURST = 4.8;
export function drawEvolve(ctx, m, x, y, time) {
  const v = m.evolve;
  v.t0 ??= time;
  const e = time - v.t0;
  const s0 = MOCHI_SIZE.baby;
  const k = s0 / 0.6;
  const [soft, deep] = GLOW[v.moon ? 'moon' : v.path] ?? GLOW.angel;
  if (!m.evolveStarted) {
    m.evolveStarted = true;
    m.noIdle = true;
    m.size = 'baby';
    m.action = { name: 'evolving', t0: v.t0 };
  }
  if (e < BURST) {
    // Before it's wrapped: it, under the big leaf growing from its sprout and then coming down.
    // (The leaf comes down over it smoothly, eased.)
    const cover = easeIO((e - GROW) / (WRAP - GROW));
    const top = y - 54 * s0;
    if (cover < 1) {
      drawMochiAnim(ctx, m, x, y, time);
    }
    if (e >= 1 && e < GROW + 0.25) {
      const n = Math.min(LEAF_SIZES, 1 + Math.floor(easeOut((e - 1) / (GROW - 1)) * (LEAF_SIZES - 1)));
      ctx.save();
      ctx.translate(x, y - 24 * k);
      ctx.scale(s0, s0);
      place(ctx, bigLeaf(n), 0, 0);
      ctx.restore();
    }
    if (e >= GROW) {
      // The bundle: glowing more and more, wobbling faster, light at its fold.
      const w = e - WRAP;
      const pulse = 0.5 + 0.5 * Math.sin(w * (4 + 3 * clamp01(w / 1.9)) * TAU * 0.5);
      if (w > 0) glow(ctx, x, y - 13 * k, (16 + 4 * pulse) * k, soft, 0.35 + 0.4 * clamp01(w / 1.9) * pulse);
      const wk = clamp01(w / (BURST - WRAP));
      const rock = w > 0 ? (0.012 + 0.05 * wk) * easeIO(w / 0.6) * Math.sin(TAU * (1.1 * w + 1.4 * w * wk)) : 0;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 22 * k, top - 6, 44 * k, (y - top + 6) * cover + 4);
      ctx.clip();
      ctx.save();
      ctx.translate(x, y + 1);
      ctx.rotate(rock);
      ctx.scale(s0, s0);
      place(ctx, cocoon(lookOf(m.genes, null, 0).hairColor), 0, 0);
      ctx.restore();
      ctx.restore();
      // (Just before it bursts, the light swells to a white flash.)
      if (e > BURST - 0.4) glow(ctx, x, y - 14 * k, 24 * k, '#ffffff', ((e - (BURST - 0.4)) / 0.4) ** 2);
      if (w > 0) {
        ctx.save();
        ctx.translate(x, y + 1);
        ctx.rotate(rock);
        ctx.strokeStyle = deep;
        ctx.globalAlpha = 0.4 + 0.5 * pulse * clamp01(w / 1.2);
        ctx.lineWidth = 0.6 * k;
        ctx.beginPath();
        ctx.moveTo(0.2 * k, -1.6 * k);
        ctx.quadraticCurveTo(2.4 * k, -13 * k, 2 * k, -22 * k);
        ctx.stroke();
        ctx.restore();
        // Sparkles circling it.
        for (let i = 0; i < 4; i++) {
          const a = w * 2.4 + (i / 4) * TAU;
          const r = Math.sin(((w * 1.5 + i / 4) % 1) * Math.PI);
          if (r > 0.2) twinkle(ctx, x + Math.cos(a) * 11 * k, y - 13 * k + Math.sin(a) * 5 * k, r * 1.6 * k, deep);
        }
      }
    }
    return;
  }
  // Burst: a flash, the two halves of the leaf flung away, and out it comes, grown.
  const after = e - BURST;
  if (!m.burstStarted) {
    m.burstStarted = true;
    m.size = 'grown';
    // Grown now, on its path: its feature comes with it.
    m.genes = { ...m.genes, path: v.path ?? 'angel', stage: v.moon ? 'tsukimochi' : v.path === 'demon' ? 'karamochi' : 'amamochi' };
    m.action = { name: 'evolved', t0: v.t0 + BURST };
  }
  glow(ctx, x, y - 14 * k, 26 * k, '#ffffff', (1 - easeOut(after / 0.6)) * 0.95);
  glow(ctx, x, y - 14 * k, 26 * k, soft, 1 - easeOut(after / 0.9));
  for (const side of [-1, 1]) {
    const u = after;
    if (u > 1.4) continue;
    const lx = x + side * (5 + 24 * easeOut(u / 1.4)) * k;
    const ly = y - 18 * k - 16 * u * k + 26 * u * u * k;
    ctx.save();
    ctx.globalAlpha = clamp01(1 - (u - 0.7) / 0.7);
    ctx.translate(lx, ly);
    ctx.rotate(side * 1.4 * easeOut(u / 1.4));
    ctx.scale(s0, s0);
    place(ctx, halfLeaf(side), 0, 15, { alpha: ctx.globalAlpha });
    ctx.restore();
  }
  drawMochiAnim(ctx, m, x, y, time);
  burst(ctx, x, y - 14 * k, after, k * 1.2, soft, deep);
  if (!m.action && !m.evolved) {
    m.evolved = true;
    m.noIdle = false;
  }
}

// ---------- Rebirth ----------
// At the end of a long, happy life (`m.rebirth = { t0 }`, `m.egg` the egg it becomes): it waves you
// goodbye and hugs its hands to its chest; its sprout grows the big leaf, which wraps down over it,
// glowing soft pink, petals drifting up; a gentle flash, and in its place sits an egg in its mortar
// again. `m.reborn` is set once the egg is there.
const PINK = ['#ffe0ec', '#ff8fb4'];
const FAREWELL = 2.2;
const LEAF_UP = 3.2;
const WRAPPED = 3.9;
const EGG_AT = 6;
export function drawRebirth(ctx, m, x, y, time) {
  const v = m.rebirth;
  v.t0 ??= time;
  const e = time - v.t0;
  const s = MOCHI_SIZE[m.size ?? 'grown'];
  const k = s / 0.6;
  if (!m.rebirthStarted) {
    m.rebirthStarted = true;
    m.noIdle = true;
    m.action = { name: 'farewell', t0: v.t0 };
    m.queue = [{ name: 'evolving' }];
  }
  if (e < EGG_AT) {
    const cover = easeIO((e - LEAF_UP) / (WRAPPED - LEAF_UP));
    if (cover < 1) drawMochiAnim(ctx, m, x, y, time);
    if (e >= FAREWELL && e < LEAF_UP + 0.25) {
      const n = Math.min(LEAF_SIZES, 1 + Math.floor(easeOut((e - FAREWELL) / (LEAF_UP - FAREWELL)) * (LEAF_SIZES - 1)));
      ctx.save();
      ctx.translate(x, y - 27 * k);
      ctx.scale(s, s);
      place(ctx, bigLeaf(n), 0, 0);
      ctx.restore();
    }
    if (e >= LEAF_UP) {
      const w = Math.max(0, e - WRAPPED);
      const pulse = 0.5 + 0.5 * Math.sin(w * 2.4);
      if (w > 0) glow(ctx, x, y - 15 * k, (17 + 3 * pulse) * k, PINK[0], 0.45 + 0.25 * pulse + 0.3 * clamp01((e - (EGG_AT - 0.8)) / 0.8));
      const top = y - 54 * s;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x - 22 * k, top - 4, 44 * k, (y - top + 4) * cover + 4);
      ctx.clip();
      ctx.globalAlpha = clamp01((EGG_AT - e) / 0.4);
      ctx.translate(x, y + 1);
      ctx.rotate(w > 0 ? 0.02 * easeIO(w / 0.8) * Math.sin(TAU * 0.6 * w) : 0);
      ctx.scale(s, s);
      place(ctx, cocoon(lookOf(m.genes, null, 0).hairColor), 0, 0, { alpha: ctx.globalAlpha });
      ctx.restore();
      if (e > EGG_AT - 0.45) glow(ctx, x, y - 15 * k, 22 * k, '#ffffff', ((e - (EGG_AT - 0.45)) / 0.45) ** 2);
      // Petals drifting up from it.
      if (w > 0) {
        ctx.save();
        for (let i = 0; i < 6; i++) {
          const u = (w * 0.45 + i / 6) % 1;
          const px = x + Math.sin(i * 2.7 + u * 5) * (6 + 4 * u) * k;
          const py = y - (8 + u * 26) * k;
          ctx.globalAlpha = Math.sin(Math.PI * u) * 0.9;
          ctx.fillStyle = i % 2 ? '#ffc4d6' : '#ffe0ec';
          ctx.beginPath();
          ctx.ellipse(px, py, 1.1 * k, 0.6 * k, u * 4 + i, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
      }
    }
    return;
  }
  // The egg, back in its mortar, the flash fading off it.
  const after = e - EGG_AT;
  drawHatchEgg(ctx, x, y, m.egg ?? m.genes, 0, 0, false, clamp01(after / 0.3));
  glow(ctx, x, y - 12 * k, 20 * k, '#ffffff', clamp01(1 - after / 0.6) * 0.9);
  burst(ctx, x, y - 12 * k, after, k, PINK[0], PINK[1]);
  if (after > 1.4) m.reborn = true;
}
