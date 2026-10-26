// Seraphim's Halo, the holy staff: hand-drawn rather than built from the shared staff form,
// since it was the first endgame weapon and set the bar for the rest.

import { R, E, T, F } from './pixel.js';

// Ramps (at most four tones each), lit from the upper front: gold metal in three steps plus a
// warm specular, ivory, feathers that shade toward lavender (never grey), and the rose heart gem
// whose darkest facet sits nearest the light.
const GOLD = '#ffd25a';
const GOLD_LT = '#fff3b0';
const GOLD_SH = '#e39a3a';
const GOLD_DK = '#a8602e';
const GEM = '#ff7fae';
const GEM_DK = '#c8467e';
const GEM_LT = '#ffd0e2';
const IVORY = '#fff3e0';
const IVORY_SH = '#e8cfb4';
const WHITE = '#ffffff';
const FEATHER = '#f4f2ff';
const FEATHER_SH = '#d6d2f2';
const FEATHER_DK = '#b0a8dc';
const RIBBON = '#ff9ec0';
const RIBBON_SH = '#e0709c';

// ---------- Seraphim's Halo (endgame holy staff) ----------
// A golden halo floats over a radiant crystal with a rose heart gem, cradled in gold filigree;
// angel wings beat on either side, and a ribbon flutters down the ivory shaft. Six frames.

const SERAPH_W = 44;
const SERAPH_CRYSTAL = [22, 20];
const SERAPH_HALO = [22, 5];

// The beat over six frames: held up, a fast downstroke, a slow recovery (never a ping-pong).
const FLAP = [-3, -3, 0, 2, 1, -1.5];

// One wing: three broad flight feathers fanning out from the cradle and a rounded covert over
// their roots. Each feather takes the beat a frame later than the one inside it, so the tips
// trail the root. Every part is at least two pixels wide, so nothing breaks into specks.
function seraphWing(side, frame) {
  const out = [];
  const X = (x) => (side < 0 ? x : SERAPH_W - x);
  const f = (lag) => FLAP[(frame - lag + 6) % 6];
  const feathers = [
    // [tip x, tip y, half width at the root, lag]
    [2, 9, 2.4, 2],
    [3, 17, 2.6, 1],
    [6, 25, 2.4, 0],
  ];
  feathers.forEach(([tx, ty, hw, lag], i) => {
    const y = ty + f(lag) * (1 - i * 0.3);
    const root = [X(15), 19 + i * 2.5];
    const tip = [X(tx), y];
    const mid = [X(lerp(15, tx, 0.55)), lerp(root[1], y, 0.55)];
    out.push(T([[root[0], root[1] - hw], [mid[0], mid[1] - hw * 1.1], [tip[0], tip[1] - 0.5], [tip[0] + side * -1, tip[1] + 1.5], [mid[0], mid[1] + hw], [root[0], root[1] + hw]], i === 1 ? FEATHER : WHITE));
    // The lower vane in shadow.
    out.push(F(T([[root[0], root[1] + 0.2], [mid[0], mid[1] + 0.2], [tip[0] + side * -1, tip[1] + 1.5], [mid[0], mid[1] + hw], [root[0], root[1] + hw]], FEATHER_SH)));
  });
  // Covert: a rounded pad over the roots, lit on top, a darker row under it.
  out.push(E(X(12), 20 + f(0) * 0.4, 4.5, 3.5, WHITE));
  out.push(F(E(X(12), 22 + f(0) * 0.4, 3.5, 1.5, FEATHER_SH)));
  out.push(F(E(X(12.5), 25 + f(0) * 0.3, 3, 1.5, FEATHER_DK)));
  return out;
}
const lerp = (a, b, t) => a + (b - a) * t;

export function seraphShapes(frame) {
  frame %= 6;
  const wave = [0, 1, 1.5, 0.5, -0.5, -1][frame];
  const lag = [-1, 0, 1, 1.5, 0.5, -0.5][frame];
  return {
    w: SERAPH_W, h: 80, grip: [22, 60], blade: [2, 34],
    live: seraphLive,
    shapes: [
      ...seraphWing(-1, frame),
      ...seraphWing(1, frame),
      // The halo: a ring of gold, its far half in shadow, the near half bright with a specular.
      E(SERAPH_HALO[0], SERAPH_HALO[1], 8, 3, GOLD),
      F(T([[14, 5], [16, 3], [22, 2], [28, 3], [30, 5], [27, 4], [22, 3.5], [17, 4]], GOLD_SH)),
      E(SERAPH_HALO[0], SERAPH_HALO[1], 5.5, 1.5, 'none'),
      F(T([[16, 7], [22, 7.5], [28, 7], [26, 8], [18, 8]], GOLD_LT)),
      // Ivory shaft, lit down its front edge, with gold collars.
      R(20.5, 32, 3, 41, IVORY),
      F(R(20.5, 32, 1, 41, IVORY_SH)),
      F(R(22.5, 33, 1, 39, WHITE)),
      ...[37, 50, 67].flatMap((y) => [R(19.5, y, 5, 2, GOLD), F(R(19.5, y + 1, 5, 1, GOLD_SH)), F(R(22, y, 2, 1, GOLD_LT))]),
      // The filigree cradle: two gold arms rising from the shaft around the crystal.
      T([[13, 12], [16, 25], [22, 34], [28, 25], [31, 12], [28, 14], [26, 23], [22, 29], [18, 23], [16, 14]], GOLD),
      F(T([[13, 12], [16, 25], [22, 34], [22, 31], [17.5, 24], [15, 13]], GOLD_SH)),
      F(T([[31, 12], [28, 14], [26.5, 21], [28, 20]], GOLD_LT)),
      // The crystal in flat facets: shade on the back facet, pale front, a bright edge.
      T([[22, 9], [27.5, 19], [22, 31], [16.5, 19]], '#fff6dc'),
      F(T([[22, 9], [22, 31], [16.5, 19]], '#f4dcc0')),
      F(T([[22, 10], [26.5, 19], [23, 19]], WHITE)),
      // The rose heart gem: dark facet up by the light, light facet below.
      F(E(SERAPH_CRYSTAL[0], SERAPH_CRYSTAL[1] + 1, 3, 2.5, GEM)),
      F(T([[19, 20], [22, 18], [25, 20], [22, 19.5]], GEM_DK)),
      F(R(21, 22, 2, 1, GEM_LT)),
      F(R(23, 19, 1, 1, WHITE)),
      // A rose ribbon tied below the head, its tails fluttering a frame behind the wings.
      T([[23, 36], [29, 39 + wave], [28, 45 + lag * 1.5], [32, 51 + lag], [29, 52 + lag], [26, 46 + wave * 0.5], [26, 41], [23, 39]], RIBBON),
      F(T([[26, 41], [28, 45 + lag * 1.5], [29, 52 + lag], [26, 46 + wave * 0.5]], RIBBON_SH)),
      T([[21, 36], [16, 40 - wave], [18, 46 - lag], [15, 50 - lag], [18, 50 - lag], [20, 44], [19, 40], [21, 39]], RIBBON_SH),
      E(22, 37.5, 2, 1.5, RIBBON),
      // A small winged ferrule at the foot.
      T([[20, 72], [25, 72], [22.5, 79]], GOLD),
      F(T([[20, 72], [22.5, 72], [22.5, 79]], GOLD_SH)),
      T([[20.5, 71], [15, 69 + FLAP[frame] * 0.3], [17, 72], [20, 74]], WHITE),
      T([[24.5, 71], [30, 69 + FLAP[frame] * 0.3], [28, 72], [25, 74]], WHITE),
    ],
  };
}

// Live effects, in the weapon's rotated space: a breathing glow, turning rays of light, sparkles
// circling the halo, feathers shedding from the wings, and holy motes rising off the crystal.
function seraphLive(ctx, time, s, grip) {
  const at = ([px, py]) => [(px - grip[0] - 1) * s, (py - grip[1] - 1) * s];
  const [cx, cy] = at(SERAPH_CRYSTAL);
  const [hx, hy] = at(SERAPH_HALO);
  ctx.save();
  // The crystal breathes light.
  const pulse = 0.5 + 0.5 * Math.sin(time * 3);
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, (16 + pulse * 5) * s);
  g.addColorStop(0, 'rgba(255,251,224,0.75)');
  g.addColorStop(1, 'rgba(255,251,224,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 22 * s, cy - 22 * s, 44 * s, 44 * s);
  // Slow rays turning around it.
  ctx.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + time * 0.6;
    const len = (i % 2 ? 9 : 14 + pulse * 3) * s;
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 4 + i);
    ctx.strokeStyle = i % 2 ? '#fff3a6' : WHITE;
    ctx.lineWidth = (i % 2 ? 0.6 : 1) * s;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 6 * s, cy + Math.sin(a) * 6 * s);
    ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    ctx.stroke();
  }
  // Sparkles riding the halo.
  for (let i = 0; i < 3; i++) {
    const a = time * 2.2 + (i / 3) * Math.PI * 2;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(a);
    twinkle(ctx, hx + Math.cos(a) * 7.5 * s, hy + Math.sin(a) * 2.8 * s, (1 + 0.6 * Math.sin(a)) * s, WHITE);
  }
  // Feathers drifting off each wing.
  for (let i = 0; i < 4; i++) {
    const u = (time * 0.45 + i / 4) % 1;
    const side = i % 2 ? 1 : -1;
    const [fx, fy] = at([22 + side * (14 + u * 10), 14 + u * 26]);
    ctx.save();
    ctx.globalAlpha = Math.sin(u * Math.PI) * 0.9;
    ctx.translate(fx + Math.sin(time * 3 + i) * 2 * s, fy);
    ctx.rotate(Math.sin(time * 2 + i) * 0.9);
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.ellipse(0, 0, 1 * s, 2.6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Holy motes rising up past the halo.
  for (let i = 0; i < 6; i++) {
    const u = (time * 0.6 + i / 6) % 1;
    ctx.globalAlpha = Math.sin(u * Math.PI);
    ctx.fillStyle = i % 2 ? '#fff3a6' : WHITE;
    ctx.fillRect(cx + Math.sin(i * 2.1 + time) * 8 * s, cy - u * 30 * s, s, s);
  }
  // Now and then a bright glint flashes on the crystal.
  const flash = (time % 2.6) / 2.6;
  if (flash < 0.12) {
    ctx.globalAlpha = 1 - flash / 0.12;
    twinkle(ctx, cx + 2 * s, cy - 4 * s, 5 * s, WHITE);
  }
  ctx.restore();
}

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

// Bag icon: a winged staff — a gold-ringed pink crystal on an ivory shaft, with a white wing
// sweeping out on each side (no halo on top, which read as a hat at 1x).
export const SERAPH_ICON = [
  T([[2, 14.4], [8.6, 7.8], [9.8, 9], [3.2, 15.6]], IVORY), T([[2.6, 15], [9.2, 8.4], [9.8, 9], [3.2, 15.6]], IVORY_SH),
  F(R(7, 9, 2, 2, GOLD)), F(R(1, 15, 2, 1, GOLD)),
  T([[8.4, 5.6], [5, 1.6], [1, 1.2], [3, 3.2], [0.6, 4], [3.4, 5.6], [1.4, 6.8], [5, 7.4], [8.4, 7.4]], WHITE),
  T([[12, 5.6], [13.6, 2], [15.6, 1.2], [15, 3.8], [15.8, 5], [14, 6.6], [12, 7.4]], WHITE),
  F(T([[7.6, 6.2], [3.4, 5.6], [5, 7.4], [8.4, 7.4]], FEATHER_SH)), F(T([[12.6, 6.4], [15, 5.2], [14, 6.6], [12, 7.4]], FEATHER_SH)),
  E(10.2, 6.4, 2.6, 2.8, GOLD), E(10.2, 6.4, 1.6, 2, GEM), F(R(10, 7, 1, 1, GEM_DK)), F(R(9, 5, 1, 1, WHITE)),
  F(R(10, 2, 1, 1, GOLD_LT)),
];
