// Weapon art: how each weapon type is drawn in the hero's hand and as a 16x16 bag icon. New designs
// plug in here by type. A design provides
//   shapes(tier, frame) -> { w, h, grip: [x, y], blade: [top, base], shapes }   (in-hand sprite)
//   frames(tier)        -> animation frame count (1 = still)
//   icon(tier)          -> shapes for the 16x16 icon
// and the sprite may carry live(ctx, time, s, grip): effects drawn every frame in the weapon's own
// rotated space (grip at the origin, the weapon pointing toward -y), on top of the sprite.
// Weapons point straight up with the grip near the bottom; the hero rotates them around the grip.
// Bows stand upright with the string toward the archer; crossbows lie flat, prongs forward (+x).
// Until a type has a design, nothing is drawn for it. Each type has a test design (tier 0); the
// staff also has its first endgame design, Seraphim's Halo (tier 4 and up).

import { R, E, P, T } from './pixel.js';

const STEEL = '#e6edf7';
const STEEL_DARK = '#aeb9cf';
const GOLD = '#ffd66b';
const GRIP = '#7a5238';
const WOOD = '#c98e55';
const GEM = '#ff9ec0';
const STRING = '#fff6fb';
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

function seraphShapes(frame) {
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

const SERAPH_ICON = [
  E(4, 6, 3, 2, WHITE), E(12, 6, 3, 2, WHITE),
  T([[2, 15], [7, 10], [8, 11], [3, 16]], IVORY),
  E(8, 7, 2.5, 3, '#fff6dc'), P(8, 7, GEM),
  E(8, 2, 3, 1, GOLD), P(6, 9, GOLD), P(10, 9, GOLD),
];

const DESIGNS = {
  sword: {
    shapes: () => ({
      w: 16, h: 46, grip: [8, 37], blade: [2, 32],
      shapes: [
        T([[8, 1], [11, 6], [11, 32], [5, 32], [5, 6]], STEEL),
        R(7.5, 7, 1, 24, STEEL_DARK),
        R(1, 32, 14, 2.5, GOLD),
        E(8, 33.2, 1.6, 1.6, GEM),
        R(6.5, 34.5, 3, 7, GRIP),
        E(8, 43, 2.2, 2.2, GOLD),
      ],
    }),
    icon: () => [T([[13, 1], [15, 3], [6, 12], [4, 10]], STEEL), R(2, 10, 6, 2, GOLD), R(1, 13, 3, 2, GRIP), P(12, 3, '#ffffff')],
  },
  axe: {
    shapes: () => ({
      w: 26, h: 48, grip: [9, 40], blade: [3, 22],
      shapes: [
        R(8, 4, 2.5, 42, WOOD),
        // A crescent bit sweeping forward, with a small spike behind the haft.
        T([[10, 6], [18, 2], [24, 9], [24, 19], [18, 25], [10, 20]], STEEL),
        T([[13, 8], [19, 5], [22, 10], [22, 18], [19, 22], [13, 18]], STEEL_DARK),
        T([[8, 10], [3, 13], [8, 16]], STEEL),
        R(7.5, 8, 3.5, 12, GOLD),
        E(9.2, 46, 2, 1.6, GOLD),
      ],
    }),
    icon: () => [R(4, 4, 2, 11, WOOD), T([[6, 2], [13, 1], [15, 6], [12, 10], [6, 8]], STEEL), R(3, 3, 4, 2, GOLD)],
  },
  spear: {
    shapes: () => ({
      w: 14, h: 60, grip: [7, 46], blade: [0, 16],
      shapes: [
        R(6, 14, 2.5, 45, WOOD),
        T([[7, 0], [11, 8], [9.5, 16], [4.5, 16], [3, 8]], STEEL),
        R(6.8, 3, 1, 11, STEEL_DARK),
        R(3.5, 15.5, 7, 2.5, GOLD),
        T([[5, 18], [9, 18], [7, 22]], '#ff6b8a'),
        R(5.5, 56, 3.5, 3, GOLD),
      ],
    }),
    icon: () => [R(2, 13, 2, 2, WOOD), T([[3, 13], [10, 6], [11, 7], [4, 14]], WOOD), T([[10, 1], [15, 1], [15, 6], [11, 8], [8, 5]], STEEL), R(8, 7, 2, 2, GOLD)],
  },
  wand: {
    shapes: () => ({
      w: 16, h: 34, grip: [8, 27], blade: [0, 12],
      shapes: [
        R(7, 11, 2, 21, '#fff0f6'),
        R(7, 22, 2, 1.5, GOLD),
        R(7, 25, 2, 1.5, GOLD),
        // A five-point star on top with a heart-pink gem in it.
        T([[8, 0], [9.8, 4.6], [14.6, 4.8], [10.8, 7.8], [12.2, 12.4], [8, 9.8], [3.8, 12.4], [5.2, 7.8], [1.4, 4.8], [6.2, 4.6]], GOLD),
        E(8, 6.8, 1.8, 1.8, GEM),
      ],
    }),
    icon: () => [T([[3, 14], [9, 8], [10, 9], [4, 15]], '#fff0f6'), T([[11, 1], [12, 4], [15, 4], [13, 6], [14, 9], [11, 7], [8, 9], [9, 6], [7, 4], [10, 4]], GOLD), P(11, 5, GEM)],
  },
  staff: {
    frames: (tier) => (tier >= 4 ? 6 : 1),
    shapes: (tier, frame) => (tier >= 4 ? seraphShapes(frame) : {
      w: 20, h: 58, grip: [10, 44], blade: [0, 16],
      shapes: [
        R(8.8, 12, 2.5, 45, WOOD),
        // A crescent cradling a glowing orb.
        T([[4, 3], [10, 0], [16, 3], [17, 10], [13, 15], [7, 15], [3, 10]], GOLD),
        E(10, 8, 5, 5, 'none'),
        E(10, 8, 4, 4, '#9fd8ff'),
        E(8.6, 6.6, 1.4, 1.4, '#ffffff'),
        R(8, 15, 4, 2.5, GOLD),
        R(8.8, 55, 2.5, 2.5, GOLD),
      ],
    }),
    icon: (tier) => (tier >= 4 ? SERAPH_ICON : [T([[2, 15], [8, 8], [9, 9], [3, 16]], WOOD), E(11, 5, 4, 4, GOLD), E(11, 5, 2.6, 2.6, '#9fd8ff'), P(10, 4, '#ffffff')]),
  },
  bow: {
    shapes: () => ({
      w: 16, h: 46, grip: [11, 23], blade: [1, 45],
      shapes: [
        // Limbs bowing forward (+x) from tip to tip, with the string straight behind them.
        T([[4, 1], [8, 5], [11.5, 14], [12.5, 20], [12.5, 26], [11.5, 32], [8, 41], [4, 45], [5.5, 41], [9, 32], [10, 26], [10, 20], [9, 14], [5.5, 5]], WOOD),
        R(10, 19, 3.5, 8, GRIP),
        E(4.5, 1.5, 1.6, 1.6, GOLD),
        E(4.5, 44.5, 1.6, 1.6, GOLD),
        R(4.2, 2, 0.8, 42, STRING),
      ],
    }),
    icon: () => [T([[2, 2], [7, 3], [11, 7], [13, 12], [14, 14], [12, 13], [10, 9], [6, 5]], WOOD), T([[2, 2], [3, 2], [14, 13], [14, 14]], STRING), R(9, 7, 2, 2, GRIP)],
  },
  crossbow: {
    shapes: () => ({
      w: 40, h: 22, grip: [14, 15], blade: [0, 40],
      shapes: [
        // The stock runs back from the prongs at the front (+x), a bolt loaded along the top.
        T([[34, 9], [4, 9], [1, 12], [3, 17], [10, 17], [13, 21], [17, 21], [16, 14], [34, 14]], WOOD),
        R(35, 1, 3, 20, STEEL),
        R(35.5, 10, 2, 2, GOLD),
        R(35.2, 1.5, 0.8, 19, STRING),
        R(14, 9.8, 22, 1.4, STEEL_DARK),
        T([[40, 10.5], [37, 9], [37, 12]], STEEL),
        R(5, 10, 5, 2, GOLD),
      ],
    }),
    icon: () => [R(1, 7, 10, 3, WOOD), R(12, 2, 2, 12, STEEL), R(6, 8, 6, 1, STEEL_DARK), R(3, 10, 3, 3, WOOD), P(12, 8, GOLD)],
  },
  dagger: {
    shapes: () => ({
      w: 12, h: 26, grip: [6, 20], blade: [1, 15],
      shapes: [
        T([[6, 0], [9, 5], [8, 15], [4, 15], [3, 5]], STEEL),
        R(5.6, 4, 0.8, 10, STEEL_DARK),
        R(1, 15, 10, 2, GOLD),
        R(4.6, 17, 2.8, 6, GRIP),
        E(6, 24, 1.8, 1.8, GEM),
      ],
    }),
    icon: () => [T([[11, 2], [14, 2], [14, 5], [8, 10], [6, 8]], STEEL), R(4, 9, 5, 2, GOLD), R(2, 12, 3, 2, GRIP)],
  },
  claw: {
    shapes: () => ({
      w: 16, h: 24, grip: [8, 19], blade: [0, 12],
      shapes: [
        // A gauntlet with three curved blades reaching out over the knuckles.
        R(3, 13, 10, 9, '#8d96a8'),
        R(3, 13, 10, 2, GOLD),
        T([[3.5, 14], [2, 6], [3, 1], [5.5, 6], [6, 14]], STEEL),
        T([[6.8, 14], [6.5, 4], [8, 0], [9.5, 4], [9.2, 14]], STEEL),
        T([[10, 14], [10.5, 6], [13, 1], [14, 6], [12.5, 14]], STEEL),
        E(8, 18, 1.6, 1.6, GEM),
      ],
    }),
    icon: () => [R(3, 9, 8, 6, '#8d96a8'), T([[4, 9], [4, 3], [6, 9]], STEEL), T([[7, 9], [8, 1], [9, 9]], STEEL), T([[10, 9], [12, 3], [11, 9]], STEEL), R(3, 9, 8, 1, GOLD)],
  },
};

export function weaponShapes(type, tier = 0, frame = 0) {
  return DESIGNS[type]?.shapes(tier, frame) ?? null;
}

export function weaponFrames(type, tier = 0) {
  return DESIGNS[type]?.frames?.(tier) ?? 1;
}

export function weaponIcon(type, tier) {
  return DESIGNS[type]?.icon(tier) ?? null;
}
