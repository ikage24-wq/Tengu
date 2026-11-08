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
const SPROUT = { id: 'sprout', base: '#7fd17a', trim: '#ffd23f', lid: '#ff9ec0', gem: '#ff6fae', capsules: ['#ff9ec0', '#ffe066', '#8fd3ff', '#b8f0a8', '#e2c6ff', '#ffb38a'] };
// Pastel Harbor's: lighthouse red with gold, white and navy, its capsules the colours of the set.
const HARBOR = { id: 'harbor', base: '#e86a6a', trim: '#ffd23f', lid: '#ffffff', gem: '#2e4a7a', capsules: ['#e8484a', '#ffffff', '#2e4a7a', '#ffd23f', '#8fd3ff', '#ffb38a'] };
// Ember Crag's: obsidian with gold, glowing lava gems, capsules in molten colours.
const CRAG = { id: 'crag', base: '#3a2e44', trim: '#ffcf4a', lid: '#ff7a2a', gem: '#ff5a1a', capsules: ['#ff5a1a', '#ffcf4a', '#2a2232', '#ff9a3a', '#fff0a0', '#c83a2a'] };
export const MACHINE_THEMES = { sprout: SPROUT, harbor: HARBOR, crag: CRAG };
export const MACHINE = { w: 88, h: 132, globe: [44, 42, 29], crank: [76, 90], chute: [44, 108] };

function machineArt(theme, crank) {
  return sprite(`gacha|machine3|${theme.id}|${crank}`, () => {
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
    if (theme.id === 'crag') {
      // Ember Crag's: a burning hammer crossed over an anvil.
      out.push(T([[28.6, 92.4], [39.4, 92.4], [38.4, 90.6], [29.6, 90.6]], '#1f1a26'), T([[26.4, 90.6], [41.6, 90.6], [41.6, 88.6], [30, 88.6], [27, 89.4]], '#2a2232'));
      out.push(T([[30.6, 86.6], [31.4, 85.8], [38.6, 81.6], [39.4, 82.4]], '#c89a6a'), T([[36.2, 79.8], [39.8, 77.8], [41.6, 81], [38, 83]], '#2a2232'), F(T([[39.2, 78.2], [39.8, 77.8], [41.6, 81], [41, 81.4]], '#ff7a2a')));
      out.push(F(E(34, 85, 1.2, 1.2, '#ff9a3a')), F(E(34, 85, 0.6, 0.6, '#fff0a0')));
    } else if (theme.id === 'harbor') {
      // Pastel Harbor's: a little lighthouse on its rock, its lamp lit.
      out.push(E(34, 94, 5.4, 1.6, '#8a96a8'));
      for (const [y0, c] of [[93.4, '#e8484a'], [90.6, '#ffffff'], [87.8, '#e8484a']]) out.push(T([[31.6 + (93.4 - y0) * 0.12, y0], [36.4 - (93.4 - y0) * 0.12, y0], [36.2 - (93.4 - y0 + 2.8) * 0.12, y0 - 2.8], [31.8 + (93.4 - y0 + 2.8) * 0.12, y0 - 2.8]], c));
      out.push(R(31.4, 84.4, 5.2, 0.8, '#1f3358'), R(32.6, 82.2, 2.8, 2.2, '#ffe36b'), F(E(34, 83.3, 0.8, 0.8, '#ffffff')), T([[32.2, 82.2], [35.8, 82.2], [34, 80.4]], '#e8484a'));
    } else {
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3;
        out.push(E(34 + Math.cos(a) * 3.6, 88 + Math.sin(a) * 3.3, 2.8, 2.6, theme.lid));
      }
      out.push(E(34, 88, 2.4, 2.4, gold), F(E(33.4, 87.4, 0.8, 0.8, '#ffffff')));
    }
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
  ctx.globalAlpha = A0 * (0.75);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(cx, cy, gr - 3.2, Math.PI * 1.05, Math.PI * 1.42);
  ctx.arc(cx, cy, gr - 7.2, Math.PI * 1.38, Math.PI * 1.08, true);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = A0 * (0.45);
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
    ctx.globalAlpha = A0 * (k);
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
// (The fade the machine is drawn under, so its own see-through bits fade with it.)
let A0 = 1;
export function drawMachine(ctx, x, y, { crank = 0, shake = false, theme = SPROUT, time = performance.now() / 1000 } = {}) {
  if (typeof theme === 'string') theme = MACHINE_THEMES[theme] ?? SPROUT;
  A0 = ctx.globalAlpha;
  const s = machineArt(theme, crank % 4);
  const left = snap(x - s.w / 2);
  const top = snap(y - s.h);
  const [gx, gy, gr] = MACHINE.globe;
  // The glow inside the glass, behind everything.
  ctx.save();
  ctx.globalAlpha = A0 * (0.22 + 0.12 * Math.sin(time * 1.8));
  const g = ctx.createRadialGradient(left + gx, top + gy, 0, left + gx, top + gy, gr * 1.5);
  g.addColorStop(0, '#fff6c4');
  g.addColorStop(1, 'rgba(255,246,196,0)');
  ctx.fillStyle = g;
  ctx.fillRect(left + gx - gr * 1.5, top + gy - gr * 1.5, gr * 3, gr * 3);
  ctx.restore();
  blit(ctx, s, left, top, { alpha: A0 });
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
      ctx.globalAlpha = A0 * (0.45);
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
  ctx.globalAlpha = A0 * (0.35 * tw);
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

// The Godforge Hammer, drawn live: centred on (x, y), turned by `ang` (0 = head up), `s` big.
// An obsidian head banded in gold, its runes and its strike faces glowing (`heat` 0..1, brighter
// with the full set), a gold-wrapped haft and a molten gem in the pommel.
function godHammer(ctx, x, y, ang, s, heat, t) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  // The heat round the head.
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(0, -12, 0, 0, -12, 14);
  g.addColorStop(0, `rgba(255,150,60,${0.35 + heat * 0.3})`);
  g.addColorStop(1, 'rgba(255,90,30,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-14, -26, 28, 28);
  ctx.restore();
  // The haft: dark, wrapped in gold, a pommel with its gem.
  ctx.fillStyle = '#3a2a1a';
  ctx.fillRect(-1.4, -9, 2.8, 21);
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(-1.4, -9, 0.9, 21);
  ctx.fillStyle = '#ffcf4a';
  ctx.fillRect(-1.7, -8.6, 3.4, 2.2);
  for (let k = 0; k < 6; k++) ctx.fillRect(-1.6, -4.6 + k * 2.6, 3.2, 1.4);
  ctx.fillStyle = '#c8902e';
  for (let k = 0; k < 6; k++) ctx.fillRect(-1.6, -3.6 + k * 2.6, 3.2, 0.4);
  ctx.beginPath();
  ctx.arc(0, 13, 1.8, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ff5a1a';
  ctx.beginPath();
  ctx.arc(0, 13, 0.9, 0, TAU);
  ctx.fill();
  // The head: obsidian, bevelled, banded in gold, its strike faces molten.
  ctx.fillStyle = '#2a2232';
  ctx.beginPath();
  ctx.moveTo(-6.6, -15);
  ctx.lineTo(6.6, -15);
  ctx.lineTo(7.2, -14);
  ctx.lineTo(7.2, -9.6);
  ctx.lineTo(6.6, -8.6);
  ctx.lineTo(-6.6, -8.6);
  ctx.lineTo(-7.2, -9.6);
  ctx.lineTo(-7.2, -14);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#463a56';
  ctx.fillRect(-6.4, -14.6, 12.8, 1.4);
  ctx.fillStyle = '#ffcf4a';
  ctx.fillRect(-4.2, -15.2, 1.2, 6.8);
  ctx.fillRect(3, -15.2, 1.2, 6.8);
  ctx.fillRect(-1.4, -16.4, 2.8, 1.6);
  const glow = 0.6 + 0.4 * Math.sin(t * 3.2);
  ctx.fillStyle = heat > 0.6 ? '#fff6d0' : '#ff7a2a';
  ctx.fillRect(-7.8, -13.6, 1.1, 3.6);
  ctx.fillRect(6.7, -13.6, 1.1, 3.6);
  // Its rune, burning: a stroke and two dots, glowing in time.
  ctx.globalAlpha = glow;
  ctx.fillStyle = heat > 0.6 ? '#fff6d0' : '#ffb04a';
  ctx.fillRect(-0.4, -13.8, 0.8, 4);
  ctx.fillRect(-1.6, -12.2, 3.2, 0.7);
  ctx.beginPath();
  ctx.arc(-1.8, -10, 0.4, 0, TAU);
  ctx.arc(1.8, -10, 0.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  // A lava crack across the head.
  ctx.strokeStyle = '#ff5a1a';
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(-6, -9.2);
  ctx.lineTo(-5, -11);
  ctx.lineTo(-5.6, -12.6);
  ctx.moveTo(5.4, -14.4);
  ctx.lineTo(5, -12.6);
  ctx.lineTo(5.8, -11.4);
  ctx.stroke();
  ctx.restore();
}
// Where each hero's hammer is between floating at rest (0) and up striking (1), eased.
const HAMMERS = new Map();
function hammerMem(key, t, want) {
  let h = HAMMERS.get(key);
  if (!h) HAMMERS.set(key, (h = { t, up: want }));
  const dt = t - h.t;
  h.t = t;
  if (dt > 0 && dt < 0.5) h.up += (want - h.up) * Math.min(1, dt * (want > h.up ? 7 : 2.4));
  return h;
}

// A water drop at (x, y): round below, pointed above, a glint.
function drop(ctx, x, y, r, a) {
  if (a <= 0.01) return;
  ctx.globalAlpha = a;
  ctx.fillStyle = '#a8dcf4';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 2);
  ctx.quadraticCurveTo(x + r, y - r * 0.4, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.quadraticCurveTo(x - r, y - r * 0.4, x, y - r * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.2, r * 0.3, 0, TAU);
  ctx.fill();
}
// A soap bubble: a thin bright rim, a faint rainbow sheen and a highlight.
function soapBubble(ctx, x, y, r, a) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = a * 0.18;
  ctx.fillStyle = '#d8f4ff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = a * 0.85;
  ctx.lineWidth = Math.max(0.3, r * 0.14);
  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.stroke();
  ctx.strokeStyle = '#ffb8e0';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 0.3, 1.6);
  ctx.stroke();
  ctx.strokeStyle = '#a8e8ff';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.82, 3.4, 4.6);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.38, y - r * 0.4, r * 0.24, r * 0.15, -0.6, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Where the hero's head is this frame, for the looks worn on it (the lighthouse's lamp, the pipe's
// bubbles) to stay fixed to it as it bobs, tilts and turns: render/hero.js sets `at` (head
// coordinates to the canvas) and `hair` (the hair spring the hat wobbles on) as it draws each hero.
export const HEAD_POSE = { at: null, hair: 0, body: null, hand: null, conv: null, outer: null, key: 0, ox: 0, oy: 0 };
// Each hero's pose from its last drawing, kept relative to where it stood: the effects drawn
// behind the hero (before this frame's pose is known) use it, a frame old, moved to where the
// hero stands now.
const LAST_POSE = new Map();
function poseFor(back, x, y) {
  if (!back) {
    if (HEAD_POSE.at) LAST_POSE.set(HEAD_POSE.key, { at: HEAD_POSE.at, body: HEAD_POSE.body, hand: HEAD_POSE.hand, hair: HEAD_POSE.hair, ox: HEAD_POSE.ox, oy: HEAD_POSE.oy });
    return HEAD_POSE.at ? HEAD_POSE : null;
  }
  const l = LAST_POSE.get(HEAD_POSE.key);
  if (!l) return null;
  const mv = (f) => (f ? (a, b) => { const [px, py] = f(a, b); return [px - l.ox + x, py - l.oy + y]; } : null);
  return { at: mv(l.at), body: mv(l.body), hand: l.hand ? [l.hand[0] - l.ox + x, l.hand[1] - l.oy + y] : null, hair: l.hair };
}

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
  const set = worn.sets.has('springglow');
  const keeper = worn.sets.has('keeperglow');
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


  // ---- The lighthouse's lamp: it turns, sweeping a beam out to one side, round behind the head
  // (the beam behind, fainter), and flashing as it points out at you. The full set's fog makes the
  // beam stronger and longer. ----
  // (Points on the head: fixed to where it really is this frame, the lighthouse leaning with
  // its wobble just as render/jobgear/gacha.js draws it.)
  const hp = poseFor(back, x, y);
  const onHead = (lx, ly) => {
    const lean = (hp?.hair ?? 0) * 0.5 * Math.max(0, (4 - ly) / 20);
    return hp?.at ? hp.at(lx + lean, ly) : at(lx + lean, ly);
  };
  // (Points on the body, in body coordinates, and the front hand.)
  const onBody = (lx, ly) => (hp?.body ? hp.body(lx, ly) : at(lx, ly));
  const handAt = () => hp?.hand ?? at(21, 33);
  if (fx.has('beam') && !back) {
    const th = t * 1.15;
    const toward = Math.sin(th);
    const [lx, ly] = onHead(15.5, -12.2);
    const c = Math.cos(th);
    // (Pointing away, the beam starts behind the lamp room and is fainter.)
    const reach = (12 + 78 * Math.abs(c)) * s * (keeper ? 1.35 : 1);
    const half = (2.4 + 11 * Math.abs(c)) * s;
    const a = (keeper ? 0.36 : 0.24) * (toward > 0 ? 1 : 0.5) * Math.min(1, Math.abs(c) * 3 + 0.2);
    const ox = lx + Math.sign(c) * (toward > 0 ? 0 : 2.4 * s);
    const tx = lx + Math.sign(c) * reach;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(ox, ly, tx, ly);
    g.addColorStop(0, `rgba(255,240,170,${a})`);
    g.addColorStop(0.6, `rgba(255,230,150,${a * 0.45})`);
    g.addColorStop(1, 'rgba(255,230,150,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(ox, ly - 1.1 * s);
    ctx.lineTo(tx, ly - half);
    ctx.quadraticCurveTo(tx + Math.sign(c) * half * 0.3, ly, tx, ly + half);
    ctx.lineTo(ox, ly + 1.1 * s);
    ctx.fill();
    ctx.restore();
    // The lamp's own glow, and the flash as it faces you.
    mote(ctx, lx, ly, 1.1 * s, '#fffbe0', '#ffd23f', 0.75 + 0.25 * Math.max(0, toward));
    const flash = toward > 0 ? Math.max(0, 1 - Math.abs(c) * 4) : 0;
    if (flash > 0) star4(ctx, lx, ly, (3 + 6 * flash) * s, '#fffbe0', flash, '#ffd23f');
  }


  // ---- The Forge God ----
  const swinging = !still && !moving && pose !== 'jump' && pose !== 'fall';
  const godSet = worn.sets.has('forgegod');
  // The Godforge Hammer floats at your back, bobbing, tilted back over the shoulder; swing and it
  // rises over your head and strikes down in front of you, again and again while you fight, then
  // settles back. Behind you at rest, in front once raised.
  if (fx.has('hammer')) {
    if (back) hammerMem(HEAD_POSE.key, t, swinging ? 1 : 0);
    const h = HAMMERS.get(HEAD_POSE.key) ?? { up: 0 };
    const e = ease(Math.min(1, Math.max(0, h.up)));
    if (back === e < 0.5) {
      const [ax, ay] = onBody(6, 27);
      const bob = Math.sin(t * 1.7) * 1.6 * s;
      const rest = [ax - f * 13 * s, ay - 22 * s + bob];
      const strikeA = Math.sin(t * 9);
      const high = [x + f * 4 * s, y - (64 - strikeA * 8) * s];
      const hx = rest[0] + (high[0] - rest[0]) * e;
      const hy = rest[1] + (high[1] - rest[1]) * e;
      const ang = f * (-0.55 + e * (0.9 + strikeA * 0.9));
      godHammer(ctx, hx, hy, ang, s * 1.05, godSet ? 1 : 0.3, t);
      // As it comes down, sparks burst off its face.
      if (e > 0.5 && strikeA > 0.75) {
        const k = (strikeA - 0.75) / 0.25;
        const [fx0, fy0] = [hx + Math.sin(ang) * 12 * s * 1.05, hy - Math.cos(ang) * 12 * s * 1.05];
        for (let j = 0; j < 7; j++) {
          const a2 = ang - Math.PI / 2 + (j - 3) * 0.32;
          star4(ctx, fx0 + Math.cos(a2) * (4 + k * 10) * s, fy0 + Math.sin(a2) * (4 + k * 10) * s, 1.2 * s * (1 - k * 0.6), '#fff0b0', 1 - k * 0.7, '#ff7a2a');
        }
      }
    }
  }
  // The crown: a halo of heat, flames licking from its points, embers lifting off the horn tips.
  if (fx.has('crown') && !back) {
    const [cx, cy] = onHead(15.5, -4.4);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 16 * s);
    g.addColorStop(0, 'rgba(255,190,80,0.32)');
    g.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = g;
    ctx.fillRect(cx - 16 * s, cy - 16 * s, 32 * s, 32 * s);
    ctx.restore();
    [[-6.4, 3], [-3.4, 4.4], [0, 6.4], [3.4, 4.4], [6.4, 3]].forEach(([dx, hgt], k) => {
      const [px, py] = onHead(15.5 + dx, -4.4 + 2.2 * Math.sqrt(1 - (dx / 8.6) ** 2) - 0.4 - hgt);
      const fl = (1.6 + Math.sin(t * 11 + k * 1.7) * 0.6) * s;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#ff9a3a';
      ctx.beginPath();
      ctx.moveTo(px - 0.8 * s, py + 0.4 * s);
      ctx.quadraticCurveTo(px - 0.6 * s, py - fl * 0.6, px + Math.sin(t * 7 + k) * 0.5 * s, py - fl * 1.4);
      ctx.quadraticCurveTo(px + 0.6 * s, py - fl * 0.6, px + 0.8 * s, py + 0.4 * s);
      ctx.fill();
      ctx.fillStyle = '#fff0a0';
      ctx.beginPath();
      ctx.ellipse(px, py - 0.2 * s, 0.35 * s, fl * 0.45, 0, 0, TAU);
      ctx.fill();
    });
    for (const hx0 of [0.6, 30.4]) {
      const [tx, ty] = onHead(hx0, -5.8);
      for (let k = 0; k < 2; k++) {
        const u = (t * 0.6 + k * 0.5 + hx0 * 0.01) % 1;
        mote(ctx, tx + Math.sin(u * 6 + k) * 2 * s, ty - u * 14 * s, 0.55 * s, '#fff0a0', '#ff7a2a', Math.sin(Math.PI * u));
      }
    }
  }
  // The armour's veins pulse with lava, a wave running down from the heart; the heart beats.
  if (fx.has('veins') && !back) {
    const veins = [[[12, 28.8], [13.4, 30.2], [12.9, 32.4], [14.2, 34.4]], [[19.4, 29], [18.2, 30.4], [18.8, 32.8], [17.4, 34.6]], [[15.6, 32.6], [15.2, 33.8], [15.8, 34.8]]];
    for (const v of veins) v.forEach(([lx, ly], i) => {
      const w = Math.max(0, Math.sin(t * 3 - i * 0.9));
      const [px, py] = onBody(lx, ly);
      mote(ctx, px, py, 0.4 * s, '#fff0a0', '#ff5a1a', 0.25 + 0.6 * w);
    });
    const beat = (t * 1.2) % 1;
    const pulse = Math.max(Math.exp(-((beat - 0.08) ** 2) / 0.002), Math.exp(-((beat - 0.24) ** 2) / 0.002) * 0.7);
    const [hx, hy] = onBody(15.6, 30.2);
    mote(ctx, hx, hy, (0.8 + pulse * 0.6) * s, '#fff6d0', '#ff7a2a', 0.6 + pulse * 0.4);
  }
  // The gauntlets: a glow at the fist, molten drops falling from it; a burst of fire as you swing.
  if (fx.has('magma') && !back) {
    const [hx, hy] = handAt();
    mote(ctx, hx, hy, 0.7 * s, '#fff0a0', '#ff5a1a', 0.7);
    const u = (t / 1.6) % 1;
    if (!swinging && u < 0.55) {
      const v = u / 0.55;
      drop(ctx, hx, hy + 1.5 * s + v * v * (y - hy), 0.6 * s, 0.85 * (1 - v * 0.6));
    }
    if (swinging) {
      for (let k = 0; k < 6; k++) {
        const w = (t * 4 + k / 6) % 1;
        const a2 = (f > 0 ? 0 : Math.PI) + (k - 2.5) * 0.25;
        mote(ctx, hx + Math.cos(a2) * w * 16 * s, hy + Math.sin(a2) * w * 10 * s - w * 4 * s, (0.9 - w * 0.5) * s, '#fff0a0', '#ff5a1a', 1 - w);
      }
    }
  }
  // The greaves: cracks of lava glow where you step and cool; standing, heat shimmers off them.
  if (fx.has('cinders') && back) {
    if (moving) {
      for (let k = 0; k < 3; k++) {
        const u = ((t * 3.2) % 1) / 3 + k / 3;
        const age = u;
        const dx = (-f * age * 26 + (k % 2 ? 3 : -3)) * s;
        ctx.globalAlpha = 0.85 * (1 - age);
        ctx.strokeStyle = age < 0.4 ? '#ffb04a' : '#c83a1a';
        ctx.lineWidth = 0.6 * s;
        ctx.beginPath();
        ctx.moveTo(x + dx - 3 * s, y);
        ctx.lineTo(x + dx - 1 * s, y - 0.6 * s);
        ctx.lineTo(x + dx + 0.6 * s, y + 0.2 * s);
        ctx.lineTo(x + dx + 3 * s, y - 0.4 * s);
        ctx.stroke();
      }
    } else {
      for (let k = 0; k < 3; k++) {
        const u = (t * 0.5 + k / 3) % 1;
        ctx.globalAlpha = 0.22 * Math.sin(Math.PI * u);
        ctx.strokeStyle = '#ffb070';
        ctx.lineWidth = 0.5 * s;
        ctx.beginPath();
        const bx = x + (k - 1) * 4 * s;
        for (let j = 0; j <= 6; j++) ctx.lineTo(bx + Math.sin(j * 1.4 + t * 4 + k) * 1 * s, y - (u * 10 + j * 1.6) * s);
        ctx.stroke();
      }
    }
  }
  // The runes on the cheeks flare now and then.
  if (fx.has('runes') && !back) {
    for (const [k, lx] of [[0, 8.6], [1, 22.4]]) {
      const u = (t / 3.1 + k * 0.5) % 1;
      if (u > 0.2) continue;
      const [gx, gy] = onHead(lx, 21.6);
      star4(ctx, gx, gy, 2.4 * Math.sin(Math.PI * (u / 0.2)) * s, '#fff0b0', 0.95, '#ff9a3a');
    }
  }
  // The full set: a molten rune circle turning under your feet, and a storm of embers spiralling
  // up round you.
  if (godSet) {
    const ring = (rx, ry, spin, n, col) => {
      for (let k = 0; k < n; k++) {
        const a2 = spin + (k * TAU) / n;
        if (back !== Math.sin(a2) < 0) continue;
        const px = x + Math.cos(a2) * rx * s;
        const py = y + Math.sin(a2) * ry * s;
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = col;
        ctx.fillRect(px - 0.9 * s, py - 0.35 * s, 1.8 * s, 0.7 * s);
        if (k % 3 === 0) {
          ctx.fillRect(px - 0.3 * s, py - 1.1 * s, 0.6 * s, 0.75 * s);
        }
      }
    };
    if (back) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.2 + 0.06 * Math.sin(t * 2);
      ctx.fillStyle = '#ff6a1a';
      ctx.beginPath();
      ctx.ellipse(x, y, 30 * s, 6.6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
      ctx.globalAlpha = 0.8;
      ctx.strokeStyle = '#ffcf4a';
      ctx.lineWidth = 0.6 * s;
      ctx.beginPath();
      ctx.ellipse(x, y, 28 * s, 6 * s, 0, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(x, y, 21 * s, 4.5 * s, 0, 0, TAU);
      ctx.stroke();
    }
    ring(24.5, 5.25, t * 0.6, 18, '#ffcf4a');
    ring(17.5, 3.75, -t * 0.9, 12, '#ff9a3a');
    for (let k = 0; k < 12; k++) {
      const u = (t * 0.35 + k / 12) % 1;
      const a2 = u * TAU * 1.6 + k;
      if (back !== Math.sin(a2) < 0) continue;
      const r = (24 - u * 12) * s;
      mote(ctx, x + Math.cos(a2) * r, y - u * 58 * s + Math.sin(a2) * 4 * s, (0.7 - u * 0.3) * s, '#fff0a0', '#ff5a1a', Math.sin(Math.PI * u));
    }
  }

  // ---- Rain off the oilskin: drops swell on the hem, fall, and ring on the ground. ----
  if (fx.has('drips') && !back) {
    [9.4, 15.2, 21.6].forEach((lx, k) => {
      const u = (t / 1.9 + k * 0.37) % 1;
      const [hx, hy] = at(lx + (moving ? -f * 1 : 0), 42.6);
      if (u < 0.45) {
        const g = u / 0.45;
        drop(ctx, hx, hy + g * 0.8 * s, (0.4 + g * 0.5) * s, 0.9);
      } else if (u < 0.68) {
        const v = (u - 0.45) / 0.23;
        drop(ctx, hx - (moving ? f * v * 6 * s : 0), hy + (y - hy) * v * v, 0.8 * s, 0.9);
      } else if (u < 0.9) {
        const v = (u - 0.68) / 0.22;
        ctx.globalAlpha = 0.7 * (1 - v);
        ctx.strokeStyle = '#d8f4ff';
        ctx.lineWidth = 0.4 * s;
        ctx.beginPath();
        ctx.ellipse(hx - (moving ? f * 6 * s : 0), y - 0.3 * s, (0.6 + v * 3) * s, (0.2 + v * 0.8) * s, 0, 0, TAU);
        ctx.stroke();
      }
    });
  }

  // ---- The wellies: standing, a puddle at your feet that rings as drops land; on the move,
  // a splash kicked up at every step. ----
  if (fx.has('puddles') && back) {
    if (!moving) {
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = '#7ec8e8';
      ctx.beginPath();
      ctx.ellipse(x, y - 0.2 * s, 13 * s, 2.6 * s, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#e8f8ff';
      ctx.beginPath();
      ctx.ellipse(x - 5 * s, y - 0.8 * s, 3 * s, 0.5 * s, 0, 0, TAU);
      ctx.fill();
      for (let k = 0; k < 2; k++) {
        const u = (t / 2.3 + k * 0.5) % 1;
        ctx.globalAlpha = 0.6 * (1 - u);
        ctx.strokeStyle = '#e8f8ff';
        ctx.lineWidth = 0.4 * s;
        ctx.beginPath();
        ctx.ellipse(x + (k ? 6 : -7) * s, y - 0.3 * s, (0.8 + u * 4.5) * s, (0.25 + u * 1) * s, 0, 0, TAU);
        ctx.stroke();
      }
    } else {
      const u = (t * 3.2) % 1;
      const foot = Math.floor(t * 3.2) % 2 ? 3 : -3;
      for (let k = 0; k < 5; k++) {
        const ang = Math.PI * (0.15 + k * 0.17);
        const d = u * 7 * s;
        drop(ctx, x + foot * s - f * Math.cos(ang) * d * 0.9, y - Math.sin(ang) * d * 1.2 + u * u * 6 * s, 0.55 * s, 0.85 * (1 - u));
      }
    }
  }

  // ---- The bubble pipe: soap bubbles drifting up and away off its bowl, popping. ----
  if (fx.has('pipe') && !back) {
    const [bx, by] = onHead(24, 21);
    for (let k = 0; k < 4; k++) {
      const u = (t * 0.3 + k / 4) % 1;
      const drift = f * (u * 12 + Math.sin(t * 1.7 + k) * 2) * s - (moving ? f * u * 22 * s : 0);
      const px = bx + drift;
      const py = by - u * 24 * s + Math.sin(u * 7 + k) * 1.2 * s;
      if (u < 0.9) soapBubble(ctx, px, py, (0.6 + u * 1.8 + (k % 2) * 0.5) * s, Math.min(1, u * 8));
      else {
        // Pop: a ring of little droplets.
        const v = (u - 0.9) / 0.1;
        for (let j = 0; j < 6; j++) {
          const ang = (j * TAU) / 6;
          star4(ctx, px + Math.cos(ang) * (1.6 + v * 2.4) * s, py + Math.sin(ang) * (1.6 + v * 2.4) * s, 0.6 * s, '#ffffff', 1 - v);
        }
      }
    }
  }

  // ---- The keeper's lantern: a warm flickering glow, and a moth looping round it. ----
  if (fx.has('lantern')) {
    const [lx, ly] = at(3.6, 32.2);
    const flick = 0.82 + 0.18 * Math.sin(t * 13) * Math.sin(t * 7.3);
    if (back) {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(lx, ly, 0, lx, ly, 12 * s);
      g.addColorStop(0, `rgba(255,200,110,${0.42 * flick})`);
      g.addColorStop(1, 'rgba(255,170,80,0)');
      ctx.fillStyle = g;
      ctx.fillRect(lx - 12 * s, ly - 12 * s, 24 * s, 24 * s);
      ctx.restore();
    } else {
      mote(ctx, lx, ly, 0.7 * s, '#fff6c8', '#ffb04a', flick);
      const ang = t * 2.6;
      const mx = lx + Math.cos(ang) * 5 * s;
      const my = ly + Math.sin(ang * 2) * 2.4 * s - 1 * s;
      const beat = 0.5 + 0.5 * Math.sin(t * 30);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#f4e8d0';
      for (const sd of [-1, 1]) {
        ctx.beginPath();
        ctx.ellipse(mx + sd * 0.8 * s * beat, my, 0.9 * s * beat + 0.2 * s, 0.7 * s, 0, 0, TAU);
        ctx.fill();
      }
    }
  }

  // ---- The full set: sea fog rolling past your feet (and the beam above grows stronger). ----
  if (keeper) {
    for (let k = 0; k < 5; k++) {
      if (back !== (k % 2 === 0)) continue;
      const u = (t * 0.04 + k / 5) % 1;
      const px = x + (u * 2 - 1) * 50 * s;
      const py = y - (3 + (k % 3) * 2.4) * s;
      const rx = (16 + (k % 3) * 6) * s;
      const fa = Math.sin(Math.PI * u) * (back ? 0.32 : 0.22);
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.translate(px, py);
      ctx.scale(1, 0.24);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, `rgba(236,244,250,${fa})`);
      g.addColorStop(0.6, `rgba(236,244,250,${fa * 0.5})`);
      g.addColorStop(1, 'rgba(236,244,250,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
      ctx.restore();
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
