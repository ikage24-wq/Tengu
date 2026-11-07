// The capsule machines (data/outfits-gacha.js) on screen: the machine itself (a grand fairground
// machine: a great glass globe of capsules on a gilded cabinet, a crank wheel, a chute) themed per town, and the capsule a pull drops
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

// Sprout Village's machine: a grand fairground capsule machine. A stepped pedestal trimmed in gold,
// a cabinet in the town's green between two fluted gold columns, a framed flower emblem, a gilded
// ticket slot and a prize chute under a golden arch, a big spoked gold crank wheel, a jewelled
// collar, a great glass globe heaped with capsules and banded in gold, and a crown with a star gem
// on top. (Its marquee lights chasing round the globe, the star's twinkle and the glow inside are
// drawn alive by drawMachine.)
const SPROUT = { base: '#7fd17a', trim: '#ffd23f', lid: '#ff9ec0', gem: '#ff6fae', capsules: ['#ff9ec0', '#ffe066', '#8fd3ff', '#b8f0a8', '#e2c6ff', '#ffb38a'] };
export const MACHINE = { w: 88, h: 132, globe: [44, 42, 29], crank: [76, 90], chute: [44, 108] };

function machineArt(theme, crank) {
  return sprite(`gacha|machine3|${crank}`, () => {
    const { w: W, h: H } = MACHINE;
    const b = theme.base;
    const gold = theme.trim;
    const goldSh = shade(gold, -22);
    const goldHi = mix(gold, '#ffffff', 0.5);
    const out = [];
    // The pedestal: two gold-edged steps.
    out.push(T([[4, 124], [84, 124], [86, 132], [2, 132]], shade(b, -34)), F(R(4, 124, 80, 1.6, gold)));
    out.push(T([[10, 116], [78, 116], [80, 124], [8, 124]], shade(b, -22)), F(R(10, 116, 68, 1.6, gold)), F(R(8, 122.4, 72, 1.6, goldSh)));
    for (let x = 14; x < 76; x += 10) out.push(F(E(x, 120, 1, 1, goldHi)));
    // The cabinet.
    out.push(T([[16, 72], [72, 72], [74, 76], [74, 116], [14, 116], [14, 76]], b));
    out.push(F(T([[56, 72], [72, 72], [74, 76], [74, 116], [58, 116]], shade(b, -14))), F(T([[16, 72], [40, 72], [36, 76], [16, 76]], mix(b, '#ffffff', 0.3))));
    // The fluted gold columns either side, with their capitals and feet.
    for (const cx of [16, 72]) {
      out.push(R(cx - 3.4, 74, 6.8, 42, gold), F(R(cx - 3.4, 74, 1.6, 42, goldHi)), F(R(cx + 1.8, 74, 1.6, 42, goldSh)));
      for (const dx of [-1, 1]) out.push(F(R(cx + dx * 1.2 - 0.3, 76, 0.6, 38, goldSh)));
      out.push(R(cx - 4.6, 72, 9.2, 3, gold), F(R(cx - 4.6, 72, 9.2, 1, goldHi)), R(cx - 4.6, 113, 9.2, 3, gold));
    }
    // The framed emblem: a big painted flower in a gold oval.
    out.push(E(34, 88, 9.4, 8.6, gold), E(34, 88, 8, 7.2, mix(b, '#ffffff', 0.55)));
    for (let k = 0; k < 6; k++) {
      const a = (k * Math.PI) / 3;
      out.push(E(34 + Math.cos(a) * 3.6, 88 + Math.sin(a) * 3.3, 2.8, 2.6, theme.lid));
    }
    out.push(E(34, 88, 2.4, 2.4, gold), F(E(33.4, 87.4, 0.8, 0.8, '#ffffff')));
    // The ticket slot on its gilded plate.
    out.push(R(48, 80, 14, 9, gold), F(R(48, 80, 14, 1.4, goldHi)), F(R(51, 83, 8, 2.4, '#2a2238')), F(R(52, 83.6, 6, 0.8, '#5a4a6a')));
    // The prize chute under its golden arch.
    out.push(E(44, 104, 10.6, 9, gold), F(E(44, 104, 9, 7.6, goldSh)), R(33.4, 104, 21.2, 10, gold), T([[35.4, 104], [52.6, 104], [52.6, 114], [35.4, 114]], '#2a2238'), E(44, 104, 8.6, 7, '#2a2238'));
    out.push(F(T([[35.4, 110], [52.6, 110], [52.6, 112], [35.4, 112]], mix(b, '#ffffff', 0.2))), F(E(44, 96, 1.6, 1.6, theme.gem)));
    // The crank: a big gold wheel with six spokes, turned by `crank` (quarter turns), and its knob.
    const [kx, ky] = MACHINE.crank;
    const a0 = (crank * Math.PI) / 2;
    out.push(E(kx, ky, 9, 9, goldSh), E(kx, ky, 8, 8, gold), E(kx, ky, 5.6, 5.6, shade(b, -10)));
    for (let k = 0; k < 6; k++) {
      const a = a0 + (k * Math.PI) / 3;
      out.push(T([[kx + Math.cos(a + 0.18) * 1.4, ky - Math.sin(a + 0.18) * 1.4], [kx + Math.cos(a + 0.08) * 7.6, ky - Math.sin(a + 0.08) * 7.6], [kx + Math.cos(a - 0.08) * 7.6, ky - Math.sin(a - 0.08) * 7.6], [kx + Math.cos(a - 0.18) * 1.4, ky - Math.sin(a - 0.18) * 1.4]], gold));
    }
    out.push(E(kx, ky, 2.4, 2.4, gold), F(E(kx - 0.6, ky - 0.6, 0.9, 0.9, goldHi)));
    const hx = kx + Math.cos(a0) * 7.4;
    const hy = ky - Math.sin(a0) * 7.4;
    out.push(E(hx, hy, 2.6, 2.6, '#ffffff'), F(E(hx, hy, 1.5, 1.5, theme.gem)), F(E(hx - 0.7, hy - 0.7, 0.6, 0.6, '#ffffff')));
    // The jewelled collar the globe sits in.
    out.push(T([[8, 64], [80, 64], [84, 72], [4, 72]], gold), F(T([[4, 70], [84, 70], [84, 72], [4, 72]], goldSh)), F(R(8, 64, 72, 1.4, goldHi)));
    for (let k = 0; k < 7; k++) {
      const x = 14 + k * 10;
      out.push(E(x, 67.6, 1.8, 1.8, k % 2 ? theme.gem : '#8fd3ff'), F(E(x - 0.5, 67, 0.6, 0.6, '#ffffff')));
    }
    // The great globe's glass, empty: a rim catching the light round its edge, clear inside, a
    // shade pooling toward the bottom. (The capsules tumble inside it and the shine lies over
    // them: drawMachine draws both alive.)
    const [gx, gy, gr] = MACHINE.globe;
    out.push(E(gx, gy, gr, gr, '#b8d4ec'), E(gx, gy, gr - 1.4, gr - 1.4, '#eef8ff'), F(E(gx + 3, gy + 10, gr - 6, gr * 0.55, '#dcecfa')));
    // The crown on top: a gold cap with five points and jewels, the star gem above it.
    const cy = gy - gr + 2;
    out.push(E(gx, cy + 1, 12, 4, gold), F(E(gx, cy + 2, 12, 2.4, goldSh)));
    out.push(T([[gx - 12, cy], [gx - 12, cy - 8], [gx - 7, cy - 4], [gx - 3.4, cy - 11], [gx, cy - 5], [gx + 3.4, cy - 11], [gx + 7, cy - 4], [gx + 12, cy - 8], [gx + 12, cy]], gold));
    out.push(F(T([[gx - 12, cy - 1.6], [gx + 12, cy - 1.6], [gx + 12, cy], [gx - 12, cy]], goldSh)));
    for (const [x, y, c] of [[gx - 12, cy - 8.6, theme.gem], [gx - 3.4, cy - 11.6, '#8fd3ff'], [gx + 3.4, cy - 11.6, '#8fd3ff'], [gx + 12, cy - 8.6, theme.gem], [gx, cy - 3, theme.gem]]) out.push(E(x, y, 1.4, 1.4, c), F(E(x - 0.4, y - 0.4, 0.5, 0.5, '#ffffff')));
    return { w: W, h: H, shapes: out, res: 2, soft: 'cel', crisp: true, selout: true };
  });
}

// The heap in the globe: capsules packed into the bottom of the bowl, each two-tone at its own
// angle (worked out once). Alive: at rest they breathe and nudge; every couple of seconds one hops
// up, spins and drops back with a little bounce; while the crank turns the whole heap churns,
// swirling round the bowl and tumbling over itself, then settles.
const HEAP = (() => {
  const out = [];
  const r = 3.6;
  let i = 0;
  for (let row = 0; row < 8; row++) {
    const y = 23.5 - row * r * 1.6;
    const half = Math.sqrt(Math.max(0, 27 * 27 - y * y)) - r;
    // (The heap mounds up in the middle: the top rows are narrower.)
    const reach = Math.min(half, row < 5 ? 99 : 26 - (row - 4) * 6);
    for (let x = -reach + (row % 2) * r; x <= reach; x += r * 2.05) {
      out.push({ x, y, rot: ((i * 2.399) % (Math.PI * 2)), c: i, seed: i * 0.731 });
      i++;
    }
  }
  return out;
})();
const ease2 = (u) => u * u * (3 - 2 * u);
function capsuleAt(ctx, x, y, rr, rot, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // Mostly its colour, a white cap below the seam.
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(0, 0, rr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, rr, Math.PI * 0.2, Math.PI * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(58,45,79,0.3)';
  ctx.fillRect(-rr * 0.82, rr * 0.55, rr * 1.64, 0.45);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(-rr * 0.35, -rr * 0.45, rr * 0.32, rr * 0.2, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,45,79,0.55)';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(0, 0, rr, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
function drawGlobeLife(ctx, cx, cy, gr, theme, time, shake) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, gr - 1.4, 0, Math.PI * 2);
  ctx.clip();
  // How hard the heap is churning: up while the crank turns, easing back down after.
  const churn = shake ? 1 : 0;
  const hopBeat = 2.3;
  const hopIdx = Math.floor(time / hopBeat) % HEAP.length;
  const hopU = (time % hopBeat) / 0.75;
  const list = HEAP.map((p, i) => {
    let { x, y, rot } = p;
    // Breathing: each nudges its neighbours a touch.
    x += Math.sin(time * 1.7 + p.seed * 9) * 0.35;
    y += Math.sin(time * 2.1 + p.seed * 7) * 0.3;
    if (churn) {
      // Swirling round the bowl: a turn about the middle, each at its own pace, lifted and tumbling.
      const a = Math.atan2(y, x) + time * (2.6 + (i % 5) * 0.35);
      const d = Math.max(7, Math.min(gr - 5, Math.hypot(x, y) + Math.sin(time * 5 + p.seed * 11) * 3));
      x = Math.cos(a) * d;
      y = Math.sin(a) * d * 0.9 + 3 - Math.abs(Math.sin(time * 7 + p.seed * 13)) * 3;
      rot += time * (6 + (i % 3) * 2) * (i % 2 ? 1 : -1);
    } else if (i === hopIdx && hopU < 1) {
      // The hop: up in an arc, a full spin, and a little bounce on landing.
      const u = hopU;
      const up = u < 0.8 ? Math.sin((u / 0.8) * Math.PI) * 9 : Math.sin(((u - 0.8) / 0.2) * Math.PI) * 1.6;
      y -= up;
      x += Math.sin(u * Math.PI) * 2 * (p.x > 0 ? -1 : 1);
      rot += ease2(Math.min(1, u / 0.8)) * Math.PI * 2;
    }
    return { x, y, rot, c: theme.capsules[p.c % theme.capsules.length], hop: i === hopIdx && hopU < 1 };
  });
  // Back to front: lower ones in front, the hopping one on top of everything.
  list.sort((a, b) => (a.hop ? 1 : b.hop ? -1 : a.y - b.y));
  for (const q of list) capsuleAt(ctx, cx + q.x, cy + q.y, 3.6, q.rot, q.c);
  ctx.restore();
  // The glass over them: a big curved shine on the upper left, a thin one on the right, and a
  // glint that slides along the shine now and then.
  ctx.save();
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, gr - 3.2, Math.PI * 1.05, Math.PI * 1.42);
  ctx.arc(cx, cy, gr - 7.2, Math.PI * 1.38, Math.PI * 1.08, true);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(cx, cy, gr - 3, Math.PI * 1.85, Math.PI * 0.05 + Math.PI * 2);
  ctx.arc(cx, cy, gr - 5, Math.PI * 0.05 + Math.PI * 2, Math.PI * 1.85, true);
  ctx.closePath();
  ctx.fill();
  const g = (time / 3.1) % 1;
  if (g < 0.35) {
    const a = Math.PI * (1.08 + (g / 0.35) * 0.32);
    const gx = cx + Math.cos(a) * (gr - 5.2);
    const gy = cy + Math.sin(a) * (gr - 5.2);
    const k = Math.sin((g / 0.35) * Math.PI);
    ctx.globalAlpha = k;
    ctx.beginPath();
    for (let j = 0; j < 8; j++) {
      const b = (j * Math.PI) / 4;
      const rr = j % 2 ? 0.8 : 3 * k + 0.6;
      ctx.lineTo(gx + Math.cos(b) * rr, gy + Math.sin(b) * rr);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

// The machine standing with its feet at (x, y). `crank` 0-3 turns the wheel; `shake` jostles the
// capsules (while a pull is going). Alive on top of the art: a ring of marquee lights chasing round
// the globe, a soft glow breathing inside it, and the star gem on the crown twinkling.
export function drawMachine(ctx, x, y, { crank = 0, shake = false, theme = SPROUT, time = performance.now() / 1000 } = {}) {
  const s = machineArt(theme, crank % 4);
  const left = snap(x - s.w / 2);
  const top = snap(y - s.h);
  const [gx, gy, gr] = MACHINE.globe;
  // The glow inside the glass, behind everything.
  ctx.save();
  ctx.globalAlpha = 0.22 + 0.12 * Math.sin(time * 1.8);
  const g = ctx.createRadialGradient(left + gx, top + gy, 0, left + gx, top + gy, gr * 1.5);
  g.addColorStop(0, '#fff6c4');
  g.addColorStop(1, 'rgba(255,246,196,0)');
  ctx.fillStyle = g;
  ctx.fillRect(left + gx - gr * 1.5, top + gy - gr * 1.5, gr * 3, gr * 3);
  ctx.restore();
  blit(ctx, s, left, top);
  drawGlobeLife(ctx, left + gx, top + gy, gr, theme, time, shake);
  // The marquee: bulbs round the globe, every third lit, the pattern chasing round (faster while
  // you crank).
  const n = 18;
  const step = Math.floor(time * (shake ? 14 : 5));
  // (The bulbs sit on a gold ring round the globe.)
  ctx.strokeStyle = '#c8962a';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(left + gx, top + gy, gr + 3.4, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  ctx.strokeStyle = '#ffe08a';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(left + gx, top + gy, gr + 3, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  for (let i = 0; i < n; i++) {
    const a = Math.PI * 0.85 - (i / (n - 1)) * Math.PI * 1.7;
    const bx = left + gx + Math.cos(a) * (gr + 3.4);
    const by = top + gy - Math.sin(a) * (gr + 3.4);
    const on = (i + step) % 3 === 0;
    ctx.fillStyle = on ? '#fff6c4' : '#c8a040';
    ctx.beginPath();
    ctx.arc(bx, by, on ? 1.8 : 1.3, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      ctx.save();
      ctx.globalAlpha = 0.45;
      const h = ctx.createRadialGradient(bx, by, 0, bx, by, 6);
      h.addColorStop(0, '#fff6c4');
      h.addColorStop(1, 'rgba(255,246,196,0)');
      ctx.fillStyle = h;
      ctx.fillRect(bx - 6, by - 6, 12, 12);
      ctx.restore();
    }
  }
  // The star gem atop the crown, turning slowly and twinkling.
  const sx = left + gx;
  const sy = top + gy - gr - 18;
  const tw = 0.85 + 0.15 * Math.sin(time * 4);
  ctx.save();
  ctx.translate(sx, sy);
  ctx.rotate(Math.sin(time * 0.8) * 0.15);
  ctx.fillStyle = theme.trim;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = (k % 2 ? 3.4 : 8) * tw;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fffbe0';
  ctx.beginPath();
  ctx.arc(-1, -1, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.globalAlpha = 0.35 * tw;
  const st = ctx.createRadialGradient(sx, sy, 0, sx, sy, 18);
  st.addColorStop(0, '#fff6c4');
  st.addColorStop(1, 'rgba(255,246,196,0)');
  ctx.fillStyle = st;
  ctx.fillRect(sx - 18, sy - 18, 36, 36);
  ctx.restore();
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
