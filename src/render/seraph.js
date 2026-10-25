// Seraphim's Halo, the holy staff: hand-drawn rather than built from the shared staff form,
// since it was the first endgame weapon and set the bar for the rest.

import { R, E, P, T } from './pixel.js';

const GOLD = '#ffd66b';
const GEM = '#ff9ec0';
const IVORY = '#fff6e6';
const WHITE = '#ffffff';
const FEATHER = '#e8eeff';

// ---------- Seraphim's Halo (endgame holy staff) ----------
// A golden halo floats over a radiant crystal with a rose heart gem, cradled in gold filigree;
// angel wings beat on either side, and a ribbon flutters down the ivory shaft. Six frames.

const SERAPH_W = 44;
const SERAPH_CRYSTAL = [22, 20];
const SERAPH_HALO = [22, 5];

function seraphWing(side, flap) {
  const out = [];
  const bx = side < 0 ? 16 : 28;
  // Four long feathers fanning out from the crystal, the tips rising and falling with the flap.
  const tips = [[1, 7], [2, 15], [4, 23], [9, 30]];
  tips.forEach(([tx, ty], i) => {
    const x = side < 0 ? tx : SERAPH_W - tx;
    const y = ty + flap * (1 - i * 0.25);
    const inner = side < 0 ? 2 : -2;
    out.push(T([[bx, 19 + i * 1.5], [x, y - 1.5], [x + inner, y + 1.5], [bx, 23 + i * 1.5]], i % 2 ? FEATHER : WHITE));
  });
  // Two rows of soft, rounded coverts over the feather roots, so the wing reads full and fluffy.
  const cx = (dx) => (side < 0 ? dx : SERAPH_W - dx);
  out.push(E(cx(9), 17 + flap * 0.6, 4.5, 3, FEATHER));
  out.push(E(cx(8), 24 + flap * 0.4, 4, 2.8, FEATHER));
  out.push(E(cx(13), 19 + flap * 0.4, 4.5, 3.4, WHITE));
  out.push(E(cx(12), 25 + flap * 0.3, 3.6, 2.6, WHITE));
  return out;
}

export function seraphShapes(frame) {
  const flap = [0, -1.5, -3, -2, 0, 1.5][frame % 6];
  const wave = Math.sin((frame / 6) * Math.PI * 2);
  const shine = [[20, 15], [21, 14], [23, 15], [24, 17], [23, 19], [21, 17]][frame % 6];
  return {
    w: SERAPH_W, h: 80, grip: [22, 60], blade: [2, 34],
    live: seraphLive,
    shapes: [
      ...seraphWing(-1, flap),
      ...seraphWing(1, flap),
      // The halo, floating above.
      E(SERAPH_HALO[0], SERAPH_HALO[1], 7.5, 2.8, GOLD),
      E(SERAPH_HALO[0], SERAPH_HALO[1], 5.8, 1.5, 'none'),
      // Ivory shaft with gold rings.
      R(20.7, 32, 2.6, 41, IVORY),
      R(20, 37, 4, 1.6, GOLD),
      R(20, 50, 4, 1.6, GOLD),
      R(20, 67, 4, 1.6, GOLD),
      // The filigree cradle and the crystal it holds.
      T([[13, 13], [16, 26], [22, 34], [28, 26], [31, 13], [28.5, 14], [26, 24], [22, 30], [18, 24], [15.5, 14]], GOLD),
      T([[22, 9], [27.5, 19], [22, 31], [16.5, 19]], '#fff6dc'),
      T([[22, 11], [25.5, 19], [22, 28], [22, 19]], WHITE),
      E(SERAPH_CRYSTAL[0], SERAPH_CRYSTAL[1] + 1, 2.4, 2.2, GEM),
      P(shine[0], shine[1], WHITE),
      // A rose ribbon tied below the head, its tails fluttering.
      T([[23, 36], [29, 39 + wave], [28, 45 + wave * 1.5], [32, 51 + wave], [30, 52 + wave], [26, 46 + wave * 0.5], [27, 41], [23, 39]], GEM),
      T([[21, 36], [17, 40 - wave], [18, 46 - wave], [16, 49 - wave], [18, 49 - wave], [20, 44], [19, 40], [21, 39]], '#ffc2d6'),
      // A small winged ferrule at the foot.
      T([[20.5, 72], [24.5, 72], [22.5, 79]], GOLD),
      T([[20.5, 72], [16, 70 + flap * 0.3], [19, 74]], WHITE),
      T([[24.5, 72], [29, 70 + flap * 0.3], [26, 74]], WHITE),
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

export const SERAPH_ICON = [
  E(4, 6, 3, 2, WHITE), E(12, 6, 3, 2, WHITE),
  T([[2, 15], [7, 10], [8, 11], [3, 16]], IVORY),
  E(8, 7, 2.5, 3, '#fff6dc'), P(8, 7, GEM),
  E(8, 2, 3, 1, GOLD), P(6, 9, GOLD), P(10, 9, GOLD),
];

