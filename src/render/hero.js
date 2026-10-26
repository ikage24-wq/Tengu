// The hero (and NPCs): a layered chibi rig. Each frame the pose is solved into small offsets for
// every part (legs, arms, torso, head, hair, cape), the parts are composited with the equipped
// gear's designs, and the result is cached as a smooth sprite drawn at RES x detail, so offsets
// can be fractions of a pixel. The front arm and the weapon are separate layers so weapons can
// swing around the hand.
//
// Animation: jointed limbs (hip, knee, ankle; shoulder, elbow, wrist) solved by two-bone reach; a
// 24-frame walk cycle driven by distance walked (heel strike with the toe up, a planted foot that
// rolls onto its toe, a high heel kick behind, the knee swinging through, counter-swinging arms,
// and hips that sink when the feet are spread), a breathing idle with blinks, stretch when rising, squash when landing, spring-driven hair and
// cape follow-through, attack anticipation and lunge with a weapon trail, a climb cycle, and a
// hurt recoil.

import { settings } from '../core/settings.js';
import { ITEMS, RARITIES, VARIANTS, variantsFor } from '../data/items.js';
import { pieceOf, JOB_GEAR } from './jobgear/index.js';
import { pack } from './weapon-kit.js';
import { drawGearFx } from './jobgear/live.js';
import { R, E, T, F, C, L, sprite, blit, shade, mix, shadowTone, tinted, snap, sparkLine } from './pixel.js';
import {
  topShapes, sleeveColor, longSleeves, legLook, hipShapes, skirtShapes, legShapes, hatShapes,
  hatBackShapes, hatTucks, hatHidesBangs, shoulderShapes, capeShapes, capeFrontShapes, handShapes, earringShapes, limb, reach, THIGH, SHIN, HIP_Y, ANKLE_Y, legJoints, drape,
} from './gear.js';
import { weaponShapes, weaponFrames } from './weapons.js';
import { drawElementAura, ELEMENTS } from './elements.js';
import { walkPhase, walkBob, strideAt } from './animator.js';
import { drawJobAura, AURA_JOBS } from './aura.js';
import { moveAt } from './moves.js';
import { heroineEye } from './mobs/heroine.js';

export const HAIR_STYLES = ['bob', 'pixie', 'curtain', 'sweep', 'ahoge', 'quiff', 'wolf', 'curly', 'fluffy', 'wavy', 'hime', 'halfup', 'eyecover', 'ponytail', 'twintails', 'lowtails', 'odango', 'bun', 'braid', 'drills'];
// Spiky hair was retired; old saves that used it get soft curls instead.
// Retired styles draw as their closest kept look: spiky became soft curls; 'short' and 'long'
// were near twins of the curtain cut and the wavy long hair.
const RETIRED_HAIR = { spiky: 'curly', short: 'curtain', long: 'wavy' };
export const hairStyleOf = (look) => RETIRED_HAIR[look.hairStyle] ?? look.hairStyle ?? 'bob';
export const EYE_STYLES = ['sparkle', 'round', 'happy', 'sleepy', 'cat', 'droopy', 'star', 'wink', 'big'];
// Eye styles offered in the creator and salon. The closed-eye ones (happy, sleepy, wink) are now
// covered by the animated faces, so they are hidden there but still draw for older characters.
export const PICKABLE_EYE_STYLES = ['sparkle', 'round', 'cat', 'droopy', 'star', 'big'];
export const FACE_STYLES = ['smile', 'smug', 'sassy', 'grin', 'pout', 'shy', 'cool', 'cat', 'angry', 'excited'];

// Parts are designed on a 30x56 figure with feet at y 56, then everything below the neck is
// squashed into a small, slim chibi body under the same big head: heights shrink to KY and (for
// the body) widths to KX around the center line. The sprite box adds room for hats, ears, and
// wings, and its bottom edge is the soles.
const NECK = 24;
const KY = 0.56;
const KX = 0.66;
// Below the hips the legs shrink a little more, for short chibi legs.
const LEG_TOP = 38;
const KL = 0.72;
const OX = 10;
const OY = 22;
const W = 30 + OX * 2;
const H = Math.ceil(NECK + (LEG_TOP - NECK) * KY + (56 - LEG_TOP) * KY * KL) + OY;
const INK = '#3a2d4f';
// Detail cells per art pixel for character sprites (drawn crisp, like pixel art), and rounding of
// rig offsets to that grid.
const RES = 2;
const q = (v) => Math.round(v * RES) / RES;

// ---------- Colour ramps ----------
//
// Skin and hair get their own hue-shifted ramps (highlight, base, two shadows) instead of the
// engine's lavender shadow tone, which turns grey on tan and brown skin. Shadows come from
// multiplying by a tint, so they darken AND rotate hue: skin toward rose, warm hair toward red,
// cool hair toward blue-violet. Every tone in the creator gets the same treatment.

const rgbOf = (c) => {
  const n = parseInt(c.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hexOf = (rgb) => `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const multiply = (a, b) => {
  const [x, y] = [rgbOf(a), rgbOf(b)];
  return hexOf(x.map((v, i) => (v * y[i]) / 255));
};
function hslOf(c) {
  const [r, g, b] = rgbOf(c).map((v) => v / 255);
  const hi = Math.max(r, g, b);
  const lo = Math.min(r, g, b);
  const l = (hi + lo) / 2;
  if (hi === lo) return [0, 0, l];
  const d = hi - lo;
  const s = l > 0.5 ? d / (2 - hi - lo) : d / (hi + lo);
  const h = hi === r ? ((g - b) / d + (g < b ? 6 : 0)) * 60 : hi === g ? ((b - r) / d + 2) * 60 : ((r - g) / d + 4) * 60;
  return [h, s, l];
}
function hslHex(h, s, l) {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return hexOf([f(0) * 255, f(8) * 255, f(4) * 255]);
}

const ramps = new Map();
const memo = (key, fn) => {
  let v = ramps.get(key);
  if (!v) {
    v = fn();
    ramps.set(key, v);
  }
  return v;
};

// Skin: base, highlight, two shadows (rose, then rose-magenta), line, blush, and lips.
// On deep skin a light rose tint only reddens the shadow without darkening it, so the bangs'
// cast shadow read as a lighter, warmer band; the tint deepens as the skin does, so every tone
// drops about the same step in value.
export const skinRamp = (skin) => memo(`s${skin}`, () => {
  const deep = Math.max(0, Math.min(1, (0.78 - hslOf(skin)[2]) / 0.42));
  return {
    base: skin,
    hi: mix(skin, '#fffaf0', 0.45),
    sh1: multiply(skin, mix('#f4cfd2', '#cc9aaa', deep)),
    sh2: multiply(skin, mix('#dfa3b5', '#a8708e', deep)),
    line: multiply(skin, '#b06878'),
    blush: mix(skin, '#ff7f9b', 0.42),
    blushDk: multiply(skin, '#e2788f'),
    lip: multiply(skin, '#ec8c9c'),
    lipDk: multiply(skin, '#b04a64'),
    mouthIn: multiply(skin, '#c8405e'),
  };
});

// Hair: highlight (warm, for the angel ring), base, shadow 1 (the back hair, clump edges),
// shadow 2 (deepest gaps), and the lash and brow colour: a very dark shade of the hair's hue.
export const hairRamp = (c) => memo(`h${c}`, () => {
  const [h, s, l] = hslOf(c);
  const grey = s < 0.14;
  const tint = grey ? '#d2cff0' : h < 75 || h >= 290 ? '#f0c4cc' : h < 170 ? '#c2dcd6' : '#c6c6f0';
  const sh1 = multiply(c, tint);
  const ink = mix(grey ? hslHex(275, 0.3, 0.17) : hslHex(h, Math.min(0.55, s), 0.16), '#2a1a33', 0.35);
  return {
    base: c,
    // Dark hair mixed toward cream turns a flat grey; its sheen is its own hue lifted and made
    // richer (near-black hair takes a cool indigo sheen, as in anime).
    hi: l < 0.35 ? hslHex(grey ? 248 : h, Math.max(s, 0.26), Math.min(0.6, l + 0.22)) : mix(c, '#fff6e0', 0.55),
    sh1,
    sh2: multiply(sh1, tint),
    ink,
    brow: mix(multiply(sh1, tint), ink, 0.55),
  };
});

const move = (shapes, dx, dy) => shapes.map((s) => (s ? { ...s, x: s.x + dx + OX, y: s.y + dy + OY } : s));

// ---------- Gear lookup ----------

// Outfits picked in the creator: what a character wears where no top or bottom is equipped.
// Bottoms take a darker shade of the outfit color unless they have their own (denim, khaki).
export const OUTFITS = {
  casual: { top: 'tee', bottom: 'pants' },
  sporty: { top: 'stripes', bottom: 'shorts' },
  hoodie: { top: 'hoodie', bottom: 'jeans', bottomColor: '#6f8fcf' },
  jacket: { top: 'jacket', bottom: 'cargo', bottomColor: '#9aa07a' },
  school: { top: 'blazer', bottom: 'skirt' },
  sailor: { top: 'sailor', bottom: 'skirt', bottomColor: '#5b6fc4' },
  sweater: { top: 'sweater', bottom: 'longskirt' },
  overalls: { top: 'overalls', bottom: 'pants' },
  sundress: { top: 'dress', bottom: 'skirt' },
  maid: { top: 'maid', bottom: 'skirt' },
  puffer: { top: 'puffer', bottom: 'jeans', bottomColor: '#6f8fcf' },
};
export const OUTFIT_STYLES = Object.keys(OUTFITS);

function resolveGear(look, gear) {
  const outfit = look.outfitColor ?? '#ffc2d6';
  const preset = OUTFITS[look.outfit] ?? OUTFITS.casual;
  const piece = (slot, design, color) => {
    const inst = gear?.[slot];
    if (!inst) return design ? { design, color } : null;
    const def = ITEMS[inst.id];
    if (!def) return design ? { design, color } : null;
    return pieceOf(def, inst.variant ?? null);
  };
  const w = gear?.weapon ? ITEMS[gear.weapon.id] : null;
  let weapon = w ? { type: w.weaponType, color: (gear.weapon.variant && variantsFor(w)?.[gear.weapon.variant]?.main) || w.color, tier: w.tier, theme: w.theme ?? null, element: w.element ?? null, rarity: gear.weapon.rarity ?? 0, variant: gear.weapon.variant ?? null } : null;
  // A weapon cover reskins the weapon as an endgame design or a top material (looks only).
  const cover = gear?.weapon?.cover;
  if (weapon && cover?.fun) {
    // A joke cover (a fish, a baguette...) drawn by its outfit line.
    weapon = { ...weapon, tier: 0, theme: null, element: null, variant: null, fun: cover, color: '#ffffff' };
  } else if (weapon && cover) {
    const v = cover.theme ? null : gear.weapon.coverVariant ?? null;
    const color = cover.theme ? ITEMS[`sword_${cover.theme}`].color : (v && VARIANTS[v]?.main) || ITEMS[`sword_${cover.tier * 5}`].color;
    weapon = { ...weapon, tier: cover.theme ? 21 : cover.tier, theme: cover.theme ?? null, element: cover.theme ?? null, color, variant: v };
  }
  return {
    top: piece('top', preset.top, outfit),
    bottom: piece('bottom', preset.bottom, preset.bottomColor ?? shade(outfit, -22)),
    shoes: piece('shoes', 'sneakers', '#fffaf0'),
    hat: piece('hat', null),
    cape: piece('cape', null),
    gloves: piece('gloves', null),
    earring: piece('earring', null),
    weapon,
  };
}

function gearKey(gear) {
  if (!gear) return '-';
  return ['top', 'bottom', 'shoes', 'gloves', 'hat', 'cape', 'earring'].map((s) => (gear[s] ? `${gear[s].id}${gear[s].variant ? `:${gear[s].variant}` : ''}` : '')).join(',');
}

// ---------- Head ----------
//
// A big round head (center (15.5, 14.6)) on a thin neck, ears on both sides, and a face turned a
// touch toward the facing side. Hair is built around that skull: a crown behind the head, soft
// rounded bangs and side locks in front, and longer styles that hang behind the body.

const HEAD_X = 15.5;
const HEAD_Y = 14.6;
// The face sits a little forward on the skull, toward the facing side.
const FACE_X = HEAD_X;

// An arc stroke along an ellipse, from angle a0 to a1 (degrees, 0 = right, 90 = down), th thick.
function arc(cx, cy, rx, ry, a0, a1, th, c) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= 8; i++) {
    const a = ((a0 + ((a1 - a0) * i) / 8) * Math.PI) / 180;
    outer.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
    inner.push([cx + (rx - th) * Math.cos(a), cy + (ry - th) * Math.sin(a)]);
  }
  return F(T([...outer, ...inner.reverse()], c));
}

// Hair that hangs below the head is a chain: near the root it follows the root spring, toward the
// tips it follows the tip spring, which lags and overshoots it, so a swing travels down the hair.
// Where root and tip disagree the tips also ride up a little, tracing a loop instead of a line.
// Every shape is cut into short steps and bent point by point (ellipses too), so a long sheet of
// hair curves as it swings instead of shearing like a card; the bend eases in below the skull, and
// locks further out from the middle trail a touch more, so they fan apart instead of moving as one.
const HANG_TOP = 13;
const HANG_LEN = 24;
function swayShape(shape, root, tip, lift) {
  const bend = (py) => {
    const u = Math.max(0, Math.min(1, (py - HANG_TOP) / HANG_LEN));
    return u * u * (3 - 2 * u);
  };
  const move = ([px, py]) => {
    const b = bend(py);
    const fan = 1 + 0.22 * Math.min(1, Math.abs(px - HEAD_X) / 12);
    const dx = (root * b + (tip - root) * b * b) * fan;
    const up = -Math.abs(tip - root) * 0.3 * b * b;
    return [px + q(dx), py + q(up) + (py >= 22 ? lift : 0)];
  };
  if (!root && !tip && !lift) return shape;
  const pts = shape.t === 'p' ? shape.pts.map(([px, py]) => [px + shape.x, py + shape.y]) : shape.t === 'e' ? ellipsePts(shape) : null;
  if (!pts) {
    const [nx, ny] = move([shape.x, shape.y]);
    return { ...shape, x: nx, y: ny };
  }
  if (Math.max(...pts.map(([, py]) => py)) <= HANG_TOP) return shape;
  const { rx, ry, ...rest } = shape;
  return { ...rest, t: 'p', x: 0, y: 0, pts: subdivide(pts, 1.5).map(move) };
}

const ellipsePts = (e, n = 24) => Array.from({ length: n }, (_, i) => {
  const a = (i / n) * Math.PI * 2;
  return [e.x + Math.cos(a) * e.rx, e.y + Math.sin(a) * e.ry];
});
function subdivide(pts, step) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let k = 0; k < n; k++) out.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
  }
  return out;
}

// A tapered, curved lock from its root (x0, y0) to its tip (x1, y1), w wide at the root. `bend`
// bows the middle sideways (positive bows to the left of the root-to-tip direction).
function curvedLock(x0, y0, x1, y1, w, bend, c, from = 0, to = 1) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const cx = (x0 + x1) / 2 - ((y1 - y0) / len) * bend;
  const cy = (y0 + y1) / 2 + ((x1 - x0) / len) * bend;
  const left = [];
  const right = [];
  for (let i = 0; i <= 10; i++) {
    const t = from + ((to - from) * i) / 10;
    const u = 1 - t;
    const px = u * u * x0 + 2 * u * t * cx + t * t * x1;
    const py = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const tx = 2 * u * (cx - x0) + 2 * t * (x1 - cx);
    const ty = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
    const tl = Math.hypot(tx, ty) || 1;
    const half = (w / 2) * Math.pow(1 - t, 0.8);
    left.push([px - (ty / tl) * half, py + (tx / tl) * half]);
    right.push([px + (ty / tl) * half, py - (tx / tl) * half]);
  }
  return T([...left, ...right.reverse()], c);
}

// A smooth lock (kept simple: no strand lines).
function lockWithStrand(x0, y0, x1, y1, w, bend, c) {
  return [curvedLock(x0, y0, x1, y1, w, bend, c)];
}

// Hair behind the head: the crown's volume plus whatever hangs down (tails, long hair, curls),
// which is flagged `hang` so the body can be drawn over it. Hanging hair is built from curved
// locks (shadow 1) over a deeper mass (shadow 2) that shows only in the gaps between them, so the
// locks read as clumps.
function hairBack(style, front, root, tip, lift) {
  return hairBackShapes(style, front, root, tip, lift).map((sh) => F(sh));
}
function hairBackShapes(style, front, root, tip, lift) {
  // Hair behind the head is one shade darker, so the bangs stand out in front of it.
  const r = hairRamp(front);
  const c = r.sh1;
  const m = r.sh2;
  const crown = E(HEAD_X, 13.2, 12, 11.2, c);
  // Everything that sways hangs below the head and is drawn behind the body.
  const sw = (shapes) => shapes.map((sh) => ({ ...swayShape(sh, root, tip, lift), hang: true }));
  const locks = (list) => list.flatMap(([x0, y0, x1, y1, w, bend]) => lockWithStrand(x0, y0, x1, y1, w, bend, c));
  switch (style) {
    case 'bob': return [crown, ...sw([
      E(HEAD_X, 16.4, 12.8, 10, m),
      ...locks([[4.4, 12, 6.8, 25.4, 5.4, 1.8], [26.6, 12, 24.2, 25.4, 5.4, -1.8], [9, 17, 10.8, 26, 5, 0.6], [22, 17, 20.2, 26, 5, -0.6], [15.5, 19, 15.5, 26.4, 6, 0]]),
    ])];
    case 'wavy': return [crown, ...sw([
      E(HEAD_X, 21, 13, 12, m),
      ...locks([[4, 14, 3.4, 41, 6, -3], [8.6, 18, 9.6, 42.6, 5.6, 2.6], [15.5, 20, 15.5, 43.4, 6.4, -2], [22.4, 18, 21.4, 42.6, 5.6, -2.6], [27, 14, 27.6, 41, 6, 3]]),
      E(3.8, 40.2, 1.8, 1.6, c), E(27.2, 40.2, 1.8, 1.6, c),
    ])];
    case 'twintails': return [crown, ...sw([
      ...locks([[3, 11, 1.2, 38.4, 7.6, 2.8], [3.8, 13, 4.8, 34, 4.2, -1.2], [28, 11, 29.8, 38.4, 7.6, -2.8], [27.2, 13, 26.2, 34, 4.2, 1.2]]),
    ])];
    case 'ponytail': return [crown, ...sw([
      ...locks([[3.6, 6.6, 0.2, 35, 8, 3.2], [3, 10, 2.8, 30, 4.2, -1.2]]),
    ]), E(4.4, 8.4, 1.8, 1.5, m)];
    case 'curly': {
      // Soft, fluffy curls all around the head, a little fuller at the back.
      const curls = [[5, 8.6, 2.6], [4, 13.4, 2.6], [4.6, 18.4, 2.4], [6.8, 22, 2.2], [10, 4.4, 2.6], [15.5, 3, 2.8], [21, 4.4, 2.6], [26, 8.6, 2.6], [27, 13.4, 2.4], [26.4, 18.4, 2.2], [24.4, 21.6, 2]];
      return [E(HEAD_X, 13.2, 11.8, 10.8, c), ...curls.map(([x, y, r]) => E(x, y, r, r * 0.92, c))];
    }
    case 'bun': return [crown, E(HEAD_X, 2.8, 5.4, 4.4, c), arc(HEAD_X, 3.2, 4, 3, 200, 300, 0.8, r.hi), E(HEAD_X, 6.4, 4.2, 1, m),
      ...sw(locks([[6, 14, 6.6, 24.6, 3.2, 0.6], [25, 14, 24.4, 24.6, 3.2, -0.6]]))];
    case 'ahoge':
    case 'sweep':
    case 'curtain': return [E(HEAD_X, 13.2, 11.8, 10.8, c), E(HEAD_X, 19.8, 9.8, 4.2, c), ...locks([[6.4, 16, 7.4, 24, 4.4, 0.8], [24.6, 16, 23.6, 24, 4.4, -0.8]])];
    case 'quiff': return [E(HEAD_X, 13.2, 11.4, 10.6, c), E(HEAD_X, 19, 9.4, 3.6, c)];
    case 'wolf': return [
      // A shaggy wolf cut: a big layered crown that bumps out at the temples, and longer mullet
      // layers at the back that flick out past the shoulders.
      E(HEAD_X, 12.6, 12.8, 11.6, c), E(4.2, 10.6, 3.4, 3.8, c), E(26.8, 10.6, 3.4, 3.8, c), E(3.4, 16.4, 3, 3.4, c), E(27.6, 16.4, 3, 3.4, c),
      ...sw([
        E(HEAD_X, 21, 11.4, 6.4, m),
        ...locks([[4.6, 18, 0.6, 31, 5.6, -2.4], [9.4, 20, 6.6, 33, 5.4, -1.4], [15.5, 21, 15.5, 33.6, 6, 0], [21.6, 20, 24.4, 33, 5.4, 1.4], [26.4, 18, 30.4, 31, 5.6, 2.4]]),
      ]),
    ];
    case 'eyecover': return [crown, ...sw([
      E(HEAD_X, 19, 12.4, 9, m),
      ...locks([[4.6, 14, 5.6, 29, 5.4, 1.2], [9.6, 18, 10.6, 30, 5, 0.6], [21.4, 18, 20.4, 30, 5, -0.6], [26.4, 14, 25.4, 29, 5.4, -1.2]]),
    ])];
    case 'hime': return [crown, ...sw([
      // Long, straight, and cut level a little above the waist.
      T([[4.4, 14], [26.6, 14], [27, 38], [4, 38]], m),
      ...locks([[6, 16, 5.4, 38.6, 5, 0.3], [11, 18, 10.8, 38.8, 5.4, 0.1], [15.5, 18, 15.5, 38.6, 5.6, 0], [20, 18, 20.2, 38.8, 5.4, -0.1], [25, 16, 25.6, 38.6, 5, -0.3]]),
    ])];
    case 'odango': return [crown, E(6.2, 3.6, 3.8, 3.6, c), E(24.8, 3.6, 3.8, 3.6, c),
      arc(6.2, 3.6, 2.6, 2.4, 200, 290, 0.7, r.hi), arc(24.8, 3.6, 2.6, 2.4, 200, 290, 0.7, r.hi),
      ...sw(locks([[5, 6, 1.6, 33, 4.6, 2], [26, 6, 29.4, 33, 4.6, -2]]))];
    case 'drills': {
      // Ojou-sama ringlets: a stack of shrinking coils on each side, each with a darker turn line.
      const coil = (x, dir) => Array.from({ length: 5 }, (_, k) => {
        const y = 17 + k * 4.2;
        const rr = 3.6 - k * 0.38;
        return [E(x + (k % 2 ? 0.5 : -0.5) * dir, y, rr, 2.6, c), arc(x + (k % 2 ? 0.5 : -0.5) * dir, y - 0.2, rr, 2.4, 20, 160, 0.6, m)];
      }).flat();
      return [crown, ...sw([...coil(3.6, 1), ...coil(27.4, -1)])];
    }
    case 'braid': return [E(HEAD_X, 13.2, 12, 11, c), E(HEAD_X, 19.6, 10, 4.4, c)];
    // A pixie cut hugs the skull: a close crown and two little flicks at the nape.
    case 'pixie': return [E(HEAD_X, 12.8, 11.4, 10.4, c), ...locks([[8, 17.6, 7, 22.2, 3, 0.4], [23, 17.6, 24, 22.2, 3, -0.4]])];
    // Low twintails: the tails are tied at the jaw and fall in front of the shoulders (see the
    // fringe); behind is only a short mass to the nape.
    case 'lowtails': return [crown, ...sw([E(HEAD_X, 18.6, 11.4, 6.6, m)])];
    case 'fluffy': {
      // A big soft cloud of long hair: puffs stacked down both sides and across the hem over a
      // deeper mass, much wider than the head.
      const side = [[3.4, 16, 4.2], [2.6, 22, 4.4], [3.2, 28, 4.4], [4.8, 33.4, 4], [8.6, 36.8, 3.6]];
      const puffs = [...side, ...side.map(([x, y, rr]) => [31 - x, y, rr]), [13, 38, 3.6], [18, 38, 3.6]];
      return [E(HEAD_X, 13, 12.6, 11.6, c), ...sw([T([[4, 14], [27, 14], [28, 34], [24, 38], [7, 38], [3, 34]], m), ...puffs.map(([x, y, rr]) => E(x, y, rr, rr * 0.92, c))])];
    }
    // Half-up: the top section gathered into a high knot on the crown, the rest left down.
    case 'halfup': return [crown, E(HEAD_X, 0.8, 4.4, 3.6, c), arc(HEAD_X, 1, 3.2, 2.6, 200, 300, 0.8, r.hi), E(HEAD_X, 3.8, 3, 0.9, m), ...sw([
      // The rest left down, long and straight, its ends splitting into points.
      T([[3.8, 13], [27.2, 13], [28, 30], [27.2, 38], [3.8, 38], [3, 30]], m),
      ...locks([[4.8, 15, 4.6, 41, 5.4, -1], [9.8, 18, 10.2, 42.4, 5.6, 0.6], [15.5, 20, 15.5, 43, 6.2, 0], [21.2, 18, 20.8, 42.4, 5.6, -0.6], [26.2, 15, 26.4, 41, 5.4, 1]]),
    ])];
    default: return [crown];
  }
}

// The angel ring: one highlight band across the crown that follows the skull, broken into a few
// pieces by the gaps between clumps, with a zigzag lower edge.
function halo(cx, cy, rx, ry, a0, a1, th, c, parts = 3) {
  const out = [];
  const gap = 6;
  const span = (a1 - a0 - gap * (parts - 1)) / parts;
  for (let k = 0; k < parts; k++) {
    const s0 = a0 + k * (span + gap);
    const top = [];
    const bot = [];
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const a = ((s0 + (span * i) / n) * Math.PI) / 180;
      const d = th * (i === 0 || i === n ? 0.3 : i % 2 ? 1.15 : 0.6);
      top.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
      bot.push([cx + (rx - d) * Math.cos(a), cy + (ry - d) * Math.sin(a)]);
    }
    out.push(F(T([...top, ...bot.reverse()], c)));
  }
  return out;
}

// Bangs. The original styles share one fringe: a rounded cap over the forehead, three big
// clumps ending just above the eyes, slim side locks, and the angel ring. Newer styles each draw
// their own fringe. `sway` (the hair's tip spring) and `mood` (the face) move the ahoge.
//
// Every lock is drawn over a copy of itself in hair shadow, nudged down and back: where a clump
// overlaps the one beside it, or ends on the forehead, that copy shows as the shadow line that
// separates them (no strand stripes). Bangs that end on the face also cast a band of skin shadow
// (returned as `shade`, drawn under the eyes).
function hairFront(style, c, sway = 0, mood = 'smile') {
  const r = hairRamp(c);
  const shapes = fringe(style, r, sway, mood).flat();
  const out = [];
  const shade1 = [];
  // The hairline itself shades the forehead too, so gaps between clumps aren't left bare.
  if (style !== 'quiff') shade1.push(F(E(HEAD_X, 9, 11.4, 5, '#000000')));
  for (const sh of shapes) {
    if (sh.lock) {
      const nudge = (s0, dx, dy, col) => ({ ...s0, f: 1, cast: 0, lock: 0, c: col, pts: s0.pts.map(([px, py]) => [px + dx, py + dy]) });
      // Only the lower half of a clump gets the shadow copy, so it reads as an edge, not a stripe.
      const half = Array.isArray(sh.lock) ? curvedLock(...sh.lock, c, 0.45, 1) : sh;
      out.push(nudge(half, -0.3, 0.55, r.sh1));
      // Bangs ending on the face (not side locks) shade the skin under them.
      const tip = sh.pts.reduce((a, b) => (b[1] > a[1] ? b : a));
      if (tip[1] > 11 && tip[1] < 17.5 && tip[0] > 7.4 && tip[0] < 23.6) shade1.push(nudge(sh, 0, 1.1, null));
    }
    out.push(sh.f ? sh : F({ ...sh, cast: 0 }));
  }
  out.shade = shade1;
  return out;
}

function fringe(style, r, sway, mood) {
  const c = r.base;
  const l = r.hi;
  const d = r.sh2;
  const cap = E(HEAD_X, 7.8, 11.8, 5, c);
  const shine = halo(HEAD_X, 9.6, 8.6, 5.2, 212, 328, 1.3, l);
  const lock = (x0, y0, x1, y1, w, bend) => ({ ...curvedLock(x0, y0, x1, y1, w, bend, c), lock: [x0, y0, x1, y1, w, bend] });
  switch (style) {
    case 'ahoge': {
      // Messy boyish bangs and a single antenna strand on top that bounces with every move,
      // perks up when excited and wilts when sulking.
      const droop = mood === 'pout' || mood === 'shy';
      const perk = mood === 'excited' || mood === 'angry';
      const tipX = 17 + sway * 1.2 + (droop ? 6 : 2.4);
      const tipY = droop ? 0.4 : perk ? -7 : -5;
      return [
        curvedLock(14.6, 3.4, tipX, tipY, 2.8, droop ? -2.4 : 1.8, c),
        cap,
        lock(9.6, 6.6, 7.8, 14.2, 6, 1), lock(13.6, 6.4, 13, 15, 5.6, 0.4), lock(17.6, 6.4, 18.8, 14.6, 5.6, -0.4), lock(21.6, 6.8, 23.6, 13.8, 5.4, -1),
        lock(7, 8, 5.4, 20.6, 4.4, 1), lock(24.8, 8.4, 26.2, 19.4, 4, -1),
        shine,
      ];
    }
    case 'curtain':
      // Parted down the middle, each half curving out to frame the face.
      return [cap, lock(15, 5.4, 8.4, 15.4, 6.6, 2.2), lock(16, 5.4, 22.6, 15.4, 6.6, -2.2), lock(7, 8, 5.4, 21, 4.4, 1), lock(24, 8, 25.8, 21, 4.4, -1),
        shine];
    case 'sweep':
      // One big lock swept across the forehead toward the facing side, nearly over one eye.
      return [cap, lock(7.6, 6, 22.8, 16.4, 8.4, -2.6), lock(12, 5.6, 25.4, 12.4, 5.4, -1.6), lock(7, 8, 5.6, 19.6, 4.2, 1), lock(25, 8.4, 26.4, 19, 3.8, -1), shine];
    case 'quiff':
      // A big rounded swoop up and back off the forehead, with short neat sides.
      return [C(E(HEAD_X, 8.2, 11.6, 3.8, c)), E(HEAD_X + 1, 3.6, 9, 4.6, c), lock(7.6, 6.4, 22.4, -0.6, 7.4, 3), lock(8, 9, 10.6, 12.4, 3.4, 0.4),
        lock(6.8, 8, 5.6, 17.4, 4, 0.8), lock(24.6, 8, 25.6, 17, 3.6, -0.8), halo(HEAD_X + 1, 4.6, 7.4, 3.6, 200, 320, 1.2, l, 2)];
    case 'wolf':
      // Choppy curtain-ish bangs split off-center, short layers flicking out at the cheeks, and
      // longer ones flicking out at the jaw.
      return [cap, lock(13.4, 5.6, 8.2, 15.6, 5.6, 1.8), lock(10.6, 6.6, 12.4, 16.2, 4, -0.6), lock(17.2, 5.6, 21.8, 15.8, 5.2, -1.6), lock(20.4, 6.4, 18.6, 15.4, 3.6, 0.6),
        lock(6.6, 8, 2.4, 16.4, 4.2, 1.6), lock(24.4, 8, 28.6, 16.4, 4.2, -1.6),
        lock(6.4, 11, 3.4, 24.4, 4.6, 2.4), lock(24.6, 11, 27.6, 24.4, 4.6, -2.4), shine];
    case 'eyecover': {
      // Mekakure: heavy hair swept down over half the face, with a short fringe over the other
      // eye; it sways enough to give a peek.
      const peek = sway * 0.4;
      return [cap, lock(9.6, 6.8, 9, 14.4, 6.4, 0.6), lock(13, 6, 13.4, 14.8, 5, 0),
        // A curtain of hair from the part down past the chin, curving away from the mouth, hiding
        // that half of the face and ending in two soft points; a darker line along its inner
        // edge gives it a little depth.
        { ...T([[14.6, 4.6], [15.4, 10], [16.2, 14.6], [17.2, 18.6], [18.2, 22], [19.6 + peek, 25.2], [21.4 + peek, 27.6], [23 + peek, 25.6], [25 + peek, 27],
          [26.6 + peek, 23.4], [27.4, 18], [27.4, 11], [25.4, 5.6], [20, 3.4]], c), lock: 1 },
        stroke([[15.8, 9], [16.7, 14.6], [17.7, 18.6], [18.8 + peek, 22], [20.2 + peek, 25]], 0.6, d),
        lock(7, 8, 5.4, 22, 4.4, 1),
        halo(HEAD_X, 9.6, 8.6, 5.2, 212, 300, 1.3, l, 2), arc(22 + peek, 17, 4.4, 8.4, 245, 300, 1, l)];
    }
    case 'hime':
      // Blunt, straight-cut bangs and straight side locks cut level at the chin.
      // The cut stays level, split into clumps by small V notches.
      return [cap, { ...T([[5.4, 8], [25.6, 8], [25.4, 14.6], [23.6, 14.6], [22.9, 13.8], [22.2, 14.7], [19.2, 14.7], [18.5, 13.9], [17.8, 14.8], [13.2, 14.8], [12.5, 13.9], [11.8, 14.7], [8.8, 14.7], [8.1, 13.8], [7.4, 14.6], [5.6, 14.6]], c), lock: 1 },
        { ...T([[4.2, 10], [8.8, 10], [8.8, 24.2], [7.1, 24.2], [6.5, 23.4], [5.9, 24.2], [4.2, 24.2]], c), lock: 1 },
        { ...T([[22.2, 10], [26.8, 10], [26.8, 24.2], [25.1, 24.2], [24.5, 23.4], [23.9, 24.2], [22.2, 24.2]], c), lock: 1 }, shine];
    case 'braid': {
      // Side-swept bangs, and a thick braid brought forward over one shoulder, tied with a bow.
      const out = [cap, lock(9, 6.4, 18.6, 15.2, 7.6, -2), lock(19.6, 6.6, 23.4, 14, 5.4, -0.8), lock(7, 8, 5.6, 20.4, 4.4, 1), lock(24.6, 8.4, 25.6, 19, 4, -1)];
      const bx = 24.8 + sway * 0.3;
      for (let k = 0; k < 5; k++) {
        const y = 20.6 + k * 2.5;
        const x = bx + (k % 2 ? 0.7 : -0.7) - k * 0.2;
        out.push(E(x, y, 2.3 - k * 0.12, 1.7, c), arc(x, y - 0.1, 2.2 - k * 0.12, 1.6, 20, 160, 0.5, d));
      }
      out.push(E(bx - 1, 33.6, 1.4, 1.8, c), F(E(bx - 0.8, 32, 1.6, 0.8, d)));
      out.push(shine);
      return out;
    }
    case 'pixie':
      // Short wispy bangs swept to one side, ending high so the forehead shows, and short sides.
      return [cap, lock(10.2, 6.4, 7.6, 11.8, 5.2, 1.2), lock(14.2, 6, 12.4, 11.4, 5, 0.8), lock(18, 6, 19.6, 11.8, 4.8, -0.6), lock(21.8, 6.6, 23.4, 10.8, 3.8, -0.8),
        lock(7, 8, 6.2, 15.4, 3.6, 0.8), lock(24.6, 8.4, 25.4, 15, 3.4, -0.8), shine];
    case 'fluffy':
      // Soft rounded bangs, and curls framing the face down both cheeks.
      return [cap, lock(10.4, 7, 9, 13.6, 6.4, 1), lock(15, 6.6, 14.6, 14.4, 6.4, 0.3), lock(19.4, 6.8, 20.6, 13.8, 6, -0.6),
        E(4.4, 15.6, 3.2, 3.6, c), E(3.8, 21.2, 3, 3.2, c), E(26.6, 15.6, 3.2, 3.6, c), E(27.2, 21.2, 3, 3.2, c),
        arc(4.4, 15.4, 2.8, 3.2, 200, 290, 0.6, l), arc(26.6, 15.4, 2.8, 3.2, 200, 290, 0.6, l), shine];
    case 'lowtails': {
      // Two tails tied low at the jaw with ribbons, lying forward over the shoulders and swinging
      // a beat behind the head; each ends in two points.
      const out = [cap];
      for (const [x0, y0, x1, y1, w, bend] of [[10.6, 7, 9.4, 14.2, 6.2, 0.8], [14.8, 6.6, 14.2, 15.4, 6, 0.3], [19, 6.6, 19.6, 14.8, 5.8, -0.4], [22.6, 7, 23.6, 13.4, 4.8, -0.8]]) out.push(lock(x0, y0, x1, y1, w, bend));
      for (const side of [-1, 1]) {
        const x0 = HEAD_X + side * 10.2;
        const sw2 = sway * (side < 0 ? 0.6 : 0.45);
        out.push(lock(HEAD_X + side * 8.6, 8.4, x0, 20.4, 4.4, side * 1));
        out.push(lock(x0 - side * 0.4, 20, x0 + side * 0.6 + sw2, 36, 6.8, side * -1.6), lock(x0 + side * 1.4, 21, x0 + side * 3.2 + sw2 * 1.2, 34, 4.2, side * 1),
          lock(x0 - side * 1.2, 22, x0 - side * 1.6 + sw2 * 0.8, 33, 3.4, side * -0.6));
        out.push(F(E(x0, 20.4, 2.4, 0.9, d)));
      }
      out.push(shine);
      return out;
    }
    case 'drills':
      return [cap, lock(11, 7, 9.6, 14.4, 6, 0.8), lock(15.6, 6.6, 15.2, 15.2, 5.6, 0.2), lock(19.6, 6.8, 20.6, 14.6, 5.4, -0.5), lock(22.4, 7, 23.4, 13.8, 4.6, -0.8),
        lock(7.2, 8, 5.8, 17, 4.2, 1), lock(24.8, 8.4, 25.8, 16.4, 3.8, -1), shine];
    default: {
      const short = style === 'curly';
      const side = short ? 20 : 23;
      const out = [cap];
      // Four bang clumps of different lengths (a long one off-centre, a short one at the temple)
      // and two side locks: simple shapes that read at a glance.
      for (const [x0, y0, x1, y1, w, bend] of [[10.6, 7, 9.4, 14.2, 6.2, 0.8], [14.8, 6.6, 14.2, 15.4, 6, 0.3], [19, 6.6, 19.6, 14.8, 5.8, -0.4], [22.6, 7, 23.6, 13.4, 4.8, -0.8]]) out.push(lock(x0, y0, x1, y1, w, bend));
      out.push(lock(7.2, 8, 5.6, side, 4.4, 1), lock(24.8, 8.4, 26.2, side - 1.4, 4, -1));
      out.push(shine);
      return out;
    }
  }
}

// A four-point sparkle, for star-shine eyes; it stays readable at small sizes.
// Outside the head it takes a warm gold line of its own, not the grey a darkened white or yellow
// would give.
function star(cx, cy, r, c) {
  const k = r * 0.28;
  return { ...F(T([[cx, cy - r], [cx + k, cy - k], [cx + r, cy], [cx + k, cy + k], [cx, cy + r], [cx - k, cy + k], [cx - r, cy], [cx - k, cy - k]], c)), line: sparkLine(c) };
}

// Eyes are built with the heroine face kit (mobs/heroine.js), the same construction as the
// queens and maidens: sclera corners with a lash shadow, an iris in bands (dark top under the
// lash, base, a light crescent at the bottom) with a pupil, a big catchlight and a small one in
// the same place in both eyes, one heavy lash polygon ending in a wing and clumps, and a light
// lower lid. The hero faces the screen, so each eye is drawn as the kit's near eye, mirrored so
// its catchlights sit on the lit (facing) side and its outer corner points away from the nose.
const EYE_Y = 18.2;
const EYE_DX = 4.3;
// Per eye style: size (rx, ry), outer-corner lift, wing and clumps, iris size, pupil, openness.
const EYE_LOOK = {
  sparkle: { rx: 2, ry: 2.5, tilt: 0.12, wing: 0.9, flicks: 1, iris: 1.3 },
  round: { rx: 2.05, ry: 2.6, tilt: 0.02, wing: 0.45, flicks: 1, iris: 1.4 },
  big: { rx: 2.3, ry: 2.85, tilt: 0.1, wing: 0.9, flicks: 2, iris: 1.3, sparkle: true },
  cat: { rx: 2.1, ry: 2.3, tilt: 0.4, wing: 1.6, flicks: 2, iris: 1.12, pupil: 'slit' },
  droopy: { rx: 2.05, ry: 2.45, tilt: -0.18, wing: 0.8, flicks: 1, iris: 1.3, open: 0.86 },
  star: { rx: 2.05, ry: 2.55, tilt: 0.1, wing: 0.8, flicks: 1, iris: 1.36, pupil: 'star', sparkle: true },
  sleepy: { rx: 2.05, ry: 2.4, tilt: 0.06, wing: 0.7, flicks: 1, iris: 1.3, open: 0.56 },
  happy: { rx: 2, ry: 2.5, tilt: 0.12, wing: 0.9, flicks: 1, iris: 1.3 },
  wink: { rx: 2, ry: 2.5, tilt: 0.12, wing: 0.9, flicks: 1, iris: 1.3 },
};
const mirrorAt = (x, y) => [-x, y];

// One eye at screen x `ex`; `out` is -1 for the eye on the back side, 1 for the facing side.
// mode: 'open', 'blink', 'hurt', 'happy' (closed smile), 'dead'. `lid` (0-1) lowers the upper
// lid, `glance` looks aside, `shine` swaps in sparkles, `cross` pulls the inner lid down (angry).
function eye(ex, out, style, color, mode, look, lid = 0, glance = 0, shine = false, cross = 0) {
  const st = EYE_LOOK[style] ?? EYE_LOOK.sparkle;
  const sk = skinRamp(look.skinTone ?? '#fff0e6');
  const hr = hairRamp(look.hairColor ?? '#e9ebfa');
  const closed = mode === 'happy' || style === 'happy' || (style === 'wink' && out > 0);
  const lids = mode === 'blink' ? 'blink' : mode === 'hurt' ? 'squeeze' : mode === 'dead' ? 'dead' : closed ? 'happy' : 'open';
  // Iris offset on screen: a touch toward the facing side, more when glancing.
  const g = 0.3 + 0.55 * glance;
  const x = {
    lids, open: (st.open ?? 1) * (1 - lid * 0.85), inner: cross, raise: cross * 0.4, gaze: [-(g + 0.3) / (2 * st.rx), 0],
    iris: st.iris * (cross ? 0.9 : 1), pupil: cross ? 0.75 : 1,
  };
  const kit = {
    k: 1, chibi: true, skin: sk.base, skinSh: sk.sh1, skinSh2: sk.sh2, lip: sk.lip,
    eye: {
      iris: color, pupil: shine && !st.pupil ? 'star' : st.pupil, pupilC: mix(shade(color, -62), hr.ink, 0.4), white: '#fffaf7', lashSh: mix('#fffaf7', hr.ink, 0.2),
      ink: hr.ink, lashW: 0.85, wing: st.wing, flicks: st.flicks, lashLen: 0.95, crease: false, lower: mix(sk.lip, sk.base, 0.4),
      sparkle: st.sparkle || shine, tilt: st.tilt,
    },
  };
  return heroineEye(mirrorAt, { cx: -ex, cy: EYE_Y, rx: st.rx, ry: st.ry, o: -out, near: true, tilt: st.tilt }, x, kit);
}

// A polyline drawn as a run of thin quads.
function stroke(pts, th, c) {
  const out = [];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const nx = (-(y1 - y0) / len) * th * 0.5;
    const ny = ((x1 - x0) / len) * th * 0.5;
    out.push([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]);
  }
  return out.length === 1 ? F(T(out[0], c)) : F(T([...out.map((q) => q[0]), out.at(-1)[1], out.at(-1)[2], ...out.map((q) => q[3]).reverse()], c));
}

// Eyebrow styles, each its own silhouette (art bible: brows taper at both ends, in the hair's
// darkest shade, never ink). `round` is hikimayu: small soft ovals set high. `none` hides them.
export const BROW_STYLES = ['soft', 'thick', 'round', 'thin', 'arched', 'sharp', 'none'];

// A tapered ribbon along `pts`, `ws` thick at each point.
function ribbon(pts, ws, c) {
  const left = [];
  const right = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(bx - ax, by - ay) || 1;
    const nx = (-(by - ay) / len) * ws[i] * 0.5;
    const ny = ((bx - ax) / len) * ws[i] * 0.5;
    left.push([x + nx, y + ny]);
    right.push([x - nx, y - ny]);
  });
  return F(T([...left, ...right.reverse()], c));
}

// An eyebrow over the eye at ex in a style: `raise` lifts it, `tilt` drops its inner end (angry)
// or, when negative, lifts it (worried). Every style follows the same raise and tilt, so every
// expression still reads.
// `grow` widens it all round, for the skin-coloured edge drawn under it.
function brow(ex, side, raise, tilt, c, style = 'soft', grow = 0) {
  const y = 14.4 - raise;
  const g = (ws) => ws.map((w) => w + grow * 2);
  // Points from the inner end (toward the nose) to the outer end.
  const at = (u, lift = 0) => {
    const x0 = ex - side * 1.5;
    const x1 = ex + side * 1.8;
    return [x0 + (x1 - x0) * u, y + tilt + (-tilt * 1.6) * u - lift];
  };
  switch (style) {
    case 'thick':
      // Bold and straight-ish, a little longer, thinning only at the tail.
      return ribbon([at(-0.08), at(0.35, 0.1), at(0.75, 0.1), at(1.08)], g([1.25, 1.35, 1.2, 0.6]), c);
    case 'round': {
      // Hikimayu: a small soft oval, set high over the inner half of the eye.
      const [cx, cy] = at(0.3, 0.9);
      return F(E(cx, cy, 0.95 + grow, 0.72 + grow, c));
    }
    case 'thin':
      return ribbon([at(0), at(0.45, 0.35), at(1, 0.1)], g([0.35, 0.5, 0.3]), c);
    case 'arched':
      // A high curve that peaks past the middle.
      return ribbon([at(0), at(0.35, 0.6), at(0.65, 0.95), at(1, 0.2)], g([0.5, 0.75, 0.7, 0.35]), c);
    case 'sharp':
      // Full at the inner end, narrowing to a point that flicks up past the eye.
      return ribbon([at(0), at(0.5, 0.15), at(1.12, 0.75)], g([0.95, 0.7, 0.12]), c);
    default:
      return ribbon([at(0), at(0.45, 0.15), at(1)], g([0.6, 0.85, 0.45]), c);
  }
}

// Mouth colours come from the skin ramp (lip line, a bright open-mouth fill), never ink.
const TONGUE = '#ff8fa8';
const MY = 21.7;

function mouthShapes(kind, sk) {
  const x = FACE_X;
  const LIP = sk.lipDk;
  const MOUTH = sk.mouthIn;
  switch (kind) {
    case 'open': return [F(E(x, 22.9, 1.1, 0.9, MOUTH)), F(E(x, 23.4, 0.6, 0.35, '#ff9fb8'))];
    case 'smirk': return [stroke([[x - 1.4, MY + 0.5], [x + 0.4, MY + 0.6], [x + 1.6, MY - 0.4]], 0.62, LIP)];
    case 'tongue': return [arc(x, MY, 1.4, 1.1, 20, 160, 0.62, LIP), F(E(x + 0.5, MY + 1.3, 0.75, 0.85, TONGUE)), F(R(x + 0.45, MY + 1, 0.15, 0.9, '#e86d8c'))];
    case 'bigtongue': return [F(T([[x - 1.6, MY + 0.2], [x + 1.6, MY + 0.2], [x + 1, MY + 1.4], [x - 1, MY + 1.4]], MOUTH)), F(E(x + 0.4, MY + 1.8, 0.9, 1.1, TONGUE))];
    case 'grin': return [F(T([[x - 2, MY - 0.2], [x + 2, MY - 0.2], [x + 1.4, MY + 1.4], [x, MY + 2], [x - 1.4, MY + 1.4]], MOUTH)), F(R(x - 1.7, MY - 0.2, 3.4, 0.6, '#ffffff')), F(E(x, MY + 1.4, 0.8, 0.4, '#ff9fb8'))];
    case 'pout': return [arc(x, MY + 0.9, 0.8, 0.7, 200, 340, 0.6, LIP), arc(x, MY + 0.9, 0.8, 0.7, 20, 160, 0.6, LIP)];
    case 'wavy': return [stroke([[x - 1.6, MY + 0.6], [x - 0.8, MY + 0.1], [x, MY + 0.6], [x + 0.8, MY + 0.1], [x + 1.6, MY + 0.6]], 0.6, LIP)];
    case 'flat': return [F(R(x - 1, MY + 0.4, 2, 0.6, LIP))];
    case 'cat': return [arc(x - 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.6, LIP), arc(x + 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.6, LIP)];
    case 'grit': return [F(R(x - 1.8, MY, 3.6, 1.5, MOUTH)), F(R(x - 1.5, MY + 0.3, 3, 0.9, '#ffffff')), F(R(x - 1.5, MY + 0.7, 3, 0.15, '#d9cde6'))];
    case 'yell': return [F(E(x, MY + 1, 1.8, 1.5, MOUTH)), F(E(x, MY + 1.8, 1, 0.6, '#ff9fb8'))];
    case 'tiny': return [arc(x, MY + 0.2, 0.8, 0.7, 25, 155, 0.6, LIP)];
    default: return [arc(x, MY, 1.3, 1.1, 25, 155, 0.62, LIP)];
  }
}

// Little cartoon marks around the head: an anger vein, a sweat drop, sparkles, a shine.
function faceExtras(extra) {
  const out = [];
  for (const e of extra) {
    if (e === 'vein' || e === 'veinbig') {
      const k = e === 'veinbig' ? 1.3 : 1;
      const [vx, vy] = [23.4, 8.6];
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        out.push(stroke([[vx + sx * 0.5 * k, vy + sy * 1.6 * k], [vx + sx * 0.5 * k, vy + sy * 0.5 * k], [vx + sx * 1.6 * k, vy + sy * 0.5 * k]], 0.6, '#ff4d6d'));
      }
    } else if (e.startsWith('sweat')) {
      const dy = Number(e.slice(5)) || 0;
      // On the temple beside the eye, sliding down toward the ear (never onto the eye).
      const [sx, sy] = [26.6, 11.4 + dy * 0.6];
      out.push(F(E(sx, sy, 1, 1.2, '#9fdcff')), F(T([[sx - 0.8, sy - 0.4], [sx + 0.8, sy - 0.4], [sx, sy - 2.4]], '#9fdcff')), F(E(sx - 0.3, sy - 0.2, 0.3, 0.4, '#ffffff')));
    } else if (e.startsWith('spark')) {
      const big = e === 'spark1';
      // Just clear of the hair's outline, so they read as floating around the head.
      out.push(star(0, 5, big ? 2 : 1.3, '#ffe36b'), star(31.6, 8.6, big ? 1.3 : 2, '#ffe36b'), star(29.2, 1.4, big ? 1.4 : 0.9, '#ffffff'));
    } else if (e === 'note') {
      // Floating above the head's corner, clear of the hair.
      const [nx, ny] = [30, 1.2];
      out.push(F(E(nx, ny + 4.4, 1, 0.8, INK)), F(R(nx + 0.7, ny, 0.5, 4.4, INK)), F(T([[nx + 0.7, ny], [nx + 2.4, ny + 0.8], [nx + 2.4, ny + 1.8], [nx + 1.2, ny + 1.2]], INK)));
    }
  }
  return out;
}

// Expressions: a resting face plus a short idle loop, sampled at 8 frames a second so the
// sprite cache only ever holds a handful of frames per face. Brows are [raise, tilt] per eye
// (left, right); `closed` closes an eye into a happy arc.
const FACE_FPS = 8;
export function faceFrame(kind, time) {
  const t = Math.floor(time * FACE_FPS) / FACE_FPS;
  const at = (period) => (t % period) / period;
  const win = (p, a, b) => p >= a && p < b;
  switch (kind) {
    case 'smug': {
      const p = at(4.4);
      const f = { lid: 0.42, mouth: 'smirk', brows: [[0, 0.1], [0.6, -0.3]] };
      if (win(p, 0.25, 0.55)) f.glance = 1;
      if (win(p, 0.7, 0.95)) f.brows = [[0, 0.1], [Math.floor(t * 4) % 2 ? 1.6 : 0.9, -0.5]];
      return f;
    }
    case 'sassy': {
      const p = at(3.6);
      const f = { mouth: 'tongue', brows: [[0, 0.3], [0.9, -0.4]], lid: 0.15 };
      if (win(p, 0.45, 0.7)) Object.assign(f, { closed: [false, true], mouth: 'bigtongue', extra: ['spark0'] });
      return f;
    }
    case 'grin': {
      const p = at(3);
      return win(p, 0.45, 0.8) ? { mouth: 'grin', brows: [[0.6, -0.2], [0.6, -0.2]] } : { mouth: 'grin', closed: [true, true], brows: [[0.4, -0.2], [0.4, -0.2]] };
    }
    case 'pout': {
      const p = at(2.6);
      const f = { mouth: 'pout', brows: [[0, 0.5], [0, 0.5]], glance: -1, blush: 1.2 };
      if (win(p, 0, 0.55)) Object.assign(f, { puff: true, mouth: 'tiny' });
      return f;
    }
    case 'shy': {
      const p = at(3.2);
      const f = { mouth: 'wavy', blush: 2, lid: 0.12, glance: win(p, 0.55, 0.9) ? 1 : -1, brows: [[0.3, -0.5], [0.3, -0.5]] };
      f.extra = [`sweat${Math.round(Math.min(1, p * 1.4) * 4)}`];
      if (win(p, 0.85, 1)) f.blush = 1.4;
      return f;
    }
    case 'cool': {
      const p = at(4.2);
      const f = { lid: 0.48, mouth: 'flat', brows: [[-0.2, 0.2], [-0.2, 0.2]] };
      if (win(p, 0.82, 0.95)) Object.assign(f, { shine: true, mouth: 'smirk' });
      return f;
    }
    case 'cat': {
      const p = at(3.4);
      return win(p, 0.5, 0.85) ? { mouth: 'cat', closed: [true, true], blush: 1.3, extra: ['note'] } : { mouth: 'cat' };
    }
    case 'angry': {
      const p = at(1.2);
      const f = { lid: 0.2, mouth: 'grit', brows: [[-0.2, 0.9], [-0.2, 0.9]], extra: [win(p, 0, 0.5) ? 'veinbig' : 'vein'] };
      if (win(at(5), 0.6, 0.75)) f.mouth = 'yell';
      return f;
    }
    case 'excited': {
      const p = at(0.8);
      return { mouth: win(at(2.4), 0.5, 1) ? 'open' : 'grin', shine: true, brows: [[0.8, -0.2], [0.8, -0.2]], extra: [win(p, 0, 0.5) ? 'spark1' : 'spark0'] };
    }
    default: {
      const p = at(5);
      return win(p, 0.6, 0.78) ? { mouth: 'grin', closed: [true, true] } : { mouth: 'smile' };
    }
  }
}

function headShapes(look, g, rig) {
  const skin = look.skinTone ?? '#fff0e6';
  const sk = skinRamp(skin);
  const hair = look.hairColor ?? '#e9ebfa';
  const hr = hairRamp(hair);
  const style = hairStyleOf(look);
  const eyeStyle = look.eyeStyle ?? 'sparkle';
  const eyeColor = look.eyeColor ?? '#4fcfb8';
  const hat = g.hat;
  const tucked = hatTucks(hat);
  const m = motionOf(rig);
  const out = [];
  if (!tucked) out.push(...hairBack(style, hair, rig.hair, rig.hairTip ?? rig.hair, rig.hairLift).filter((sh) => !sh.hang));
  if (hat) out.push(...hatBackShapes(hat.design, hat.color, hat, m));
  // Facing the screen: a round head with soft full cheeks, an ear peeking out on each side, big
  // eyes set low and wide apart, blush under each eye and a small mouth in the middle. The skin
  // is flat colour from its own ramp: the light comes from the upper front (the facing side, on
  // the right), so the back ear and a thin crescent down the back of the face sit in shadow.
  out.push(F(E(5.6, 18, 1.8, 2.3, sk.sh1)), F(E(5.8, 18.3, 0.7, 1.2, sk.sh2)));
  out.push(F(E(25.4, 18, 1.8, 2.3, skin)), F(E(25.2, 18.3, 0.7, 1.2, sk.sh1)));
  out.push(F(E(FACE_X, 15, 10.2, 9.8, sk.sh1)), F(E(FACE_X, 19, 9.4, 5.8, sk.sh1)));
  out.push(F(E(FACE_X + 0.6, 15, 9.6, 9.8, skin)), F(E(FACE_X + 0.5, 19, 8.9, 5.8, skin)));
  // A hurt or knocked-out face drops the expression's own play (sparkles, notes, winks, puffed
  // cheeks): pain squeezes the brows together and a sweat drop flies; out cold, the brows go slack.
  let f = rig.face ?? {};
  if (rig.eyes === 'hurt') f = { brows: [[0.5, 0.7], [0.5, 0.7]], extra: ['sweat0'] };
  else if (rig.eyes === 'dead') f = { brows: [[0.2, -0.3], [0.2, -0.3]] };
  else if (rig.mouth === 'open' && f.puff) f = { ...f, puff: false };
  // The eye-cover lock hides the right eye and brow, so a wink or a raised brow moves to the eye
  // that shows.
  const covered = style === 'eyecover' && !hatHidesBangs(hat);
  if (covered) f = { ...f, closed: f.closed && [...f.closed].reverse(), brows: f.brows && [...f.brows].reverse() };
  if (f.puff) for (const cx of [FACE_X - 7.6, FACE_X + 7.6]) out.push(F(E(cx, 20.8, 2.8, 2.6, skin)));
  // The bangs' shadow on the forehead (under the eyes, so lashes stay on top).
  const front = hatHidesBangs(hat) ? null : hairFront(style, hair, rig.hairTip ?? rig.hair, look.face ?? 'smile');
  if (front) out.push(...front.shade.map((sh) => ({ ...sh, c: sk.sh1 })));
  // Blush: a soft two-tone patch on each cheek, clear of the eyes; flustered faces add hatching.
  const blush = f.blush ?? 1;
  for (const side of [-1, 1]) {
    const bx = FACE_X + 6.1 * side;
    const k = side < 0 ? 0.8 : 1;
    out.push(F(E(bx, 21.9, 1.8 * blush * k, 0.75 * blush, mix(skin, sk.blush, 0.55))), F(E(bx, 21.9, 1.0 * blush * k, 0.42 * blush, sk.blush)));
    if (blush > 1) for (const j of [-1, 0, 1]) out.push(stroke([[bx + j * 1 - 0.3, 22.4], [bx + j * 1 + 0.3, 21.2]], 0.5, sk.blushDk));
  }
  // Eyes: hurt and blinks win over the expression; otherwise the expression may close one or
  // both eyes, lower the lids, or glance aside. Angry faces pull the inner lids down.
  const cross = look.face === 'angry' ? 0.9 : 0;
  [-1, 1].forEach((side, i) => {
    const mode = rig.eyes !== 'open' ? rig.eyes : f.closed?.[i] ? 'happy' : 'open';
    out.push(...eye(FACE_X + EYE_DX * side, side, eyeStyle, eyeColor, mode, look, f.lid ?? 0, f.glance ?? 0, f.shine, cross));
  });
  if (rig.eyes === 'hurt') out.push(...mouthShapes('grit', sk));
  else if (rig.eyes === 'dead') out.push(...mouthShapes('open', sk));
  else out.push(...mouthShapes(rig.mouth === 'open' ? 'open' : f.mouth ?? 'smile', sk));
  if (front) out.push(...front);
  // Brows, in the look's style; an expression that doesn't move them leaves them at rest. The
  // eye-cover lock hides that side's brow.
  const browStyle = look.browStyle ?? 'soft';
  if (browStyle !== 'none') {
    const brows = f.brows ?? [[0.2, 0], [0.2, 0]];
    // Each sits on a thin skin-coloured edge, so it reads over the bangs (as if seen through
    // them, the anime way) even when the hair is as dark as the brow.
    [-1, 1].forEach((side, i) => {
      if (covered && side > 0) return;
      const args = [FACE_X + EYE_DX * side, side, brows[i][0], brows[i][1]];
      out.push(brow(...args, mix(skin, sk.sh1, 0.25), browStyle, 0.42), brow(...args, hr.brow, browStyle));
    });
  }
  if (f.extra) out.push(...faceExtras(f.extra));
  // Hair ties where the twintails gather (no bows, so nothing clashes with a hat).
  if (style === 'twintails' && !tucked) out.push(F(E(3.6, 12, 1.6, 1.1, hairRamp(hair).sh2)), F(E(27.4, 12, 1.6, 1.1, hairRamp(hair).sh2)));
  // An earring under each ear.
  if (g.earring) {
    const ring = offset(earringShapes(g.earring.design, g.earring.color, g.earring), -1.6, 0);
    out.push(...ring, ...mirror(ring));
  }
  if (hat) out.push(...hatShapes(hat.design, hat.color, hat, m));
  return out;
}

// What gear sways and flaps with: the cape's hem and root springs, the hair spring, and the wing beat.
const motionOf = (rig) => ({ sway: rig.cape ?? 0, hair: rig.hair ?? 0, capeRoot: rig.capeRoot ?? null, flap: rig.flap ? 1 : 0 });

// ---------- Arms ----------

const UPPER_ARM = 5;
const FOREARM = 4.7;

// Shoulder to elbow in the sleeve color, then a forearm (bare unless the top has long sleeves).
// The elbow bends outward (away from the body's middle) to bring the hand to (hx, hy).
// The hand's shapes come last; `handAt` says where they start (the grip layer redraws them).
// `side` (0..1) is how much of the elbow's bend shows sideways: aimed arms bend in the picture's
// plane (1); hanging, swinging arms bend mostly toward or away from the viewer, so the elbow only
// eases out a little while the arm foreshortens, instead of jutting out like a wing.
function arm(sx, sy, hx, hy, sleeve, long, g, skin, side = 1) {
  const [[bx, by], [wx, wy]] = reach(sx, sy, hx, hy, UPPER_ARM, FOREARM, sx < HEAD_X ? 1 : -1);
  const k = UPPER_ARM / (UPPER_ARM + FOREARM);
  const mx = sx + (wx - sx) * k;
  const my = sy + (wy - sy) * k;
  const ex = mx + (bx - mx) * side;
  const ey = my + (by - my) * side;
  const out = [
    E(sx, sy + 0.4, 2, 2, sleeve),
    limb(sx, sy, ex, ey, 4.2, 3.6, sleeve),
    E(ex, ey, 1.8, 1.8, long ? sleeve : skin),
    limb(ex, ey, wx, wy, 3.6, 3.1, long ? sleeve : skin),
    ...offset(shoulderShapes(g.top, sx < HEAD_X ? -1 : 1), sx, sy),
  ];
  out.handAt = out.length;
  out.push(...handShapes(wx, wy, g.gloves, skin, ex, ey));
  return out;
}

// Facing the screen: a shoulder at each edge of the torso, so the arms hang down the sides, each
// hand resting a little out from the hip so the elbow bends softly. The "back" arm is the one on
// the left (away from the facing side); the "front" arm holds the weapon.
const SHOULDER_Y = 28.2;
const BACK_SHOULDER = 10.4;
const FRONT_SHOULDER = 20.8;
const HAND_FORWARD = 1.4;
const HAND_Y = 37.6;

// A resting arm from the shoulder at (sx, SHOULDER_Y), the hand offset (dx, dy) from its rest spot.
function armShapes(sx, dx, dy, sleeve, long, g, skin, side = 1) {
  const out = sx < HEAD_X ? -HAND_FORWARD : HAND_FORWARD;
  return arm(sx, SHOULDER_Y, sx + out + dx, HAND_Y + dy, sleeve, long, g, skin, side);
}

// Attack arms point along `angle` (0 = down, 90 = forward, 180 = up) from the front shoulder.
function aimedArm(angle, sleeve, long, g, skin) {
  const rad = (angle * Math.PI) / 180;
  const hx = FRONT_SHOULDER + Math.sin(rad) * 8.6;
  const hy = SHOULDER_Y + Math.cos(rad) * 8.6;
  return { shapes: arm(FRONT_SHOULDER, SHOULDER_Y, hx, hy, sleeve, long, g, skin), hand: [hx, hy] };
}

// ---------- Body parts per rig ----------

// Legs stand apart under the hips, one on each side.
const LEFT_LEG = 11.4;
const RIGHT_LEG = 16.6;
const LEG_MID = (LEFT_LEG + RIGHT_LEG) / 2;

function bodyShapes(look, g, rig) {
  const skin = look.skinTone ?? '#fff0e6';
  const top = g.top;
  const sleeve = sleeveColor(top.design, top.color, top);
  const long = longSleeves(top.design, top);
  const legs = legLook(g.bottom.design, g.bottom.color, skin, g.bottom);
  const m = motionOf(rig);
  if (rig.view === 'back') return backShapes(look, g, rig, skin, sleeve, legs);

  // Everything above the hips leans with tx and bobs with by; the hips also sink by however much
  // the planted legs need to reach the ground, and the legs hang from there.
  const drop = hipDrop(rig);
  const ux = rig.tx;
  const uy = rig.by + drop;
  const shapes = [];
  const hat = g.hat;
  let hang = [];
  if (!hatTucks(hat)) {
    hang = hairBack(hairStyleOf(look), look.hairColor ?? '#e9ebfa', rig.hair, rig.hairTip ?? rig.hair, rig.hairLift).filter((sh) => sh.hang);
    hang = squash(offset(hang, ux + rig.hx, uy + rig.hy + NECK_LIFT), false);
  }
  if (g.cape) shapes.push(...offset(capeShapes(g.cape.design, g.cape.color, rig.cape, rig.flap, g.cape, m), ux, uy));
  // Walking, the pelvis turns toward the way it's going: the hips draw together on screen (they
  // part in depth instead), so the legs scissor past each other rather than splaying from wide
  // hips into splits and an X, and the far leg falls into shadow.
  const lx = LEFT_LEG + (LEG_MID - LEFT_LEG) * rig.hipIn;
  const rx = RIGHT_LEG + (LEG_MID - RIGHT_LEG) * rig.hipIn;
  shapes.push(...legShapes(lx, legs, g.shoes, rig.hipIn > 0, rig.backLeg, HIP_Y + drop));
  shapes.push(...legShapes(rx, legs, g.shoes, false, rig.frontLeg, HIP_Y + drop));
  shapes.push(...offset(hipShapes(legs), ux * 0.5, drop + rig.by * 0.5));
  // Skirts and the hems of dresses and robes drape over the legs as they're posed (in the upper
  // body's frame, which leans and bobs by ux, uy).
  const inFrame = (j) => j.map(([x, y]) => [x - ux, y - uy]);
  const posed = [inFrame(legJoints(lx, rig.backLeg, HIP_Y + drop)), inFrame(legJoints(rx, rig.frontLeg, HIP_Y + drop))];
  const rest = [legJoints(LEFT_LEG), legJoints(RIGHT_LEG)];
  const skirt = skirtShapes(g.bottom.design, g.bottom.color, g.bottom, m);
  if (skirt) shapes.push(...offset(drape(skirt, posed, rest), ux, uy));
  // The neck sits in the head's shadow, darkest right under the chin so the jaw reads.
  const sk = skinRamp(skin);
  shapes.push(...offset([F(R(14.3, 22.6, 2.8, 4.8, sk.sh1)), F(R(14.3, 22.6, 2.8, 3.1, sk.sh2))], ux, uy));
  shapes.push(...offset(drape(topShapes(top.design, top.color, top, m), posed, rest, 36), ux, uy));
  if (g.cape) shapes.push(...offset(capeFrontShapes(g.cape.design, g.cape.color, g.cape, m), ux, uy));
  shapes.push(...offset(armShapes(BACK_SHOULDER, rig.backArm[0], rig.backArm[1], sleeve, long, g, skin, rig.armSide), ux, uy));
  // Out of combat the weapon arm is part of the body too, so it has no outline across the torso.
  if (rig.armIn) shapes.push(...offset(armShapes(FRONT_SHOULDER, rig.frontArm[0], rig.frontArm[1], sleeve, long, g, skin, rig.armSide), ux, uy));
  // The head rides the squashed body, so it moves by the squashed bob.
  const head = offset(headShapes(look, g, rig), squashX(15.5 + ux) - 15.5 + rig.hx, uy * KY + rig.hy + NECK_LIFT);
  // The head (and the hair hanging from it) rolls about the neck.
  const nx = squashX(15.5 + ux) + rig.hx;
  const ny = 25 + uy * KY + rig.hy + NECK_LIFT;
  return move([...roll(hang, nx, ny, rig.tilt), ...squash(shapes), ...roll(head, nx, ny, rig.tilt)], 0, 0);
}

// Turns shapes by deg about (cx, cy): polygons point by point, ellipses and rects by their centres
// (fine for the few degrees a head tilts).
function roll(shapes, cx, cy, deg) {
  if (!deg) return shapes;
  const c = Math.cos((deg * Math.PI) / 180);
  const sn = Math.sin((deg * Math.PI) / 180);
  const r = (x, y) => [cx + (x - cx) * c - (y - cy) * sn, cy + (x - cx) * sn + (y - cy) * c];
  return shapes.map((sh) => {
    if (!sh) return sh;
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([px, py]) => r(sh.x + px, sh.y + py)) };
    if (sh.t === 'e') {
      const [x, y] = r(sh.x, sh.y);
      return { ...sh, x, y };
    }
    const [x, y] = r(sh.x + sh.w / 2, sh.y + sh.h / 2);
    return { ...sh, x: x - sh.w / 2, y: y - sh.h / 2 };
  });
}

// Mirrors shapes across the body's center line.
const mirror = (shapes) => shapes.map((s) => (s.t === 'p' ? { ...s, x: 0, pts: s.pts.map(([px, py]) => [31 - s.x - px, py]) } : { ...s, x: 31 - s.x - (s.w ?? 0) }));
const offset = (shapes, dx, dy) => shapes.map((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));

// The head sits this far above where it would rest on the shoulders, so a short neck shows and
// the figure stands upright instead of hunching.
const NECK_LIFT = 0;

const squashY = (y) => (y <= NECK ? y : y <= LEG_TOP ? NECK + (y - NECK) * KY : NECK + (LEG_TOP - NECK) * KY + (y - LEG_TOP) * KY * KL);
const squashX = (x) => 15.5 + (x - 15.5) * KX;
function squash(shapes, narrow = true) {
  const fx = (x) => (narrow ? squashX(x) : x);
  return shapes.map((sh) => {
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([px, py]) => [fx(sh.x + px), squashY(sh.y + py)]) };
    if (sh.t === 'e') return { ...sh, x: fx(sh.x), y: squashY(sh.y), rx: sh.rx * (narrow ? KX : 1), ry: sh.ry * (sh.y > LEG_TOP ? KY * KL : sh.y > NECK ? KY : 1) };
    const x0 = fx(sh.x);
    const y0 = squashY(sh.y);
    return { ...sh, x: x0, y: y0, w: fx(sh.x + sh.w) - x0, h: squashY(sh.y + sh.h) - y0 };
  });
}

// Seen from behind on a rope: no face, hands reaching up the rope.
function backShapes(look, g, rig, skin, sleeve, legs) {
  const hair = look.hairColor ?? '#e9ebfa';
  const style = hairStyleOf(look);
  const a = rig.climb;
  const long = longSleeves(g.top.design, g.top);
  const body = [];
  const out = [];
  body.push(...legShapes(12, legs, g.shoes, true, [0, a > 0 ? -a * 1.6 : 0, 0]));
  body.push(...legShapes(15.6, legs, g.shoes, false, [0, a < 0 ? a * 1.6 : 0, 0]));
  body.push(...hipShapes(legs));
  body.push(...topShapes('tee', g.top.color));
  // From behind, job capes show their own shape (scarves, banners, wings); others a plain drape.
  if (g.cape?.family) body.push(...capeShapes(g.cape.design, g.cape.color, 0, rig.flap, g.cape, motionOf(rig)));
  else if (g.cape && g.cape.design !== 'fairy' && g.cape.design !== 'angel') body.push(T([[8.6, 26], [22.4, 26], [26, 46], [5, 46]], g.cape.color), R(5, 45, 21, 1.2, shade(g.cape.color, -20)));
  if (!hatTucks(g.hat)) {
    const back = hairBack(style, hair, 0, 0, 0);
    out.push(...squash(back.filter((sh) => sh.hang), false), ...back.filter((sh) => !sh.hang));
  }
  const hr = hairRamp(hair);
  out.push(F(E(HEAD_X, 13.6, 12, 11.2, hair)), F(E(HEAD_X, 20.4, 9.8, 4, hr.sh1)), ...halo(HEAD_X, 10, 9, 5.6, 210, 330, 1.1, hr.hi));
  if (g.hat) out.push(...hatBackShapes(g.hat.design, g.hat.color, g.hat), ...hatShapes(g.hat.design, g.hat.color, g.hat));
  // Arms reach up past the head to grip the rope, hand over hand.
  const arms = [...arm(11.3, 27.6, 13, 3 + a, sleeve, long, g, skin), ...arm(19.2, 27.6, 18, 3 - a, sleeve, long, g, skin)];
  if (g.cape?.design === 'fairy' || g.cape?.design === 'angel') {
    const wing = capeShapes(g.cape.design, g.cape.color, 0, rig.flap);
    arms.push(...wing);
  }
  return move([...squash(body), ...out, ...squash(arms)], 0, 0);
}

// ---------- Pose solving ----------

// Walk and run cycles: frames per two steps. Each foot is planted from heel strike (toe up) to
// toe-off (heel rolling up) and slides back exactly as fast as the ground goes by: over its
// stance it travels the ground covered in that time (the animator's stride for this gait), so
// feet never skate. Then the heel kicks up behind, the knee swings through, and the foot reaches
// forward to land again. Walking, a foot is planted 52% of the cycle (both feet down between
// steps) and the hips sink when the feet are spread; running, only 24%, so there's a moment with
// both feet off the ground after every push-off, and the hips compress through each stance.
const WALK_FRAMES = 24;
const LEG = THIGH + SHIN;
const REST_LEG = ANKLE_Y - HIP_Y;
const lerp = (a, b, t) => a + (b - a) * t;
// The legs are drawn on the full-size figure and narrowed by KX, so a planted foot's offset in
// figure units is the ground distance divided by KX.
const gaitShape = (gait) => {
  const stance = lerp(0.52, 0.24, gait);
  return { stance, half: (strideAt(gait) * stance) / 2 / KX, kick: lerp(4.2, 6.5, gait) };
};

// Ankle offset and foot tilt for one leg at walk phase p (0 = heel strike).
function walkLeg(p, { stance, half, kick }) {
  if (p < stance) {
    const u = p / stance;
    const roll = u > 0.7 ? (u - 0.7) / 0.3 : 0;
    const tilt = u < 0.15 ? 16 * (1 - u / 0.15) : -30 * roll;
    return [half - 2 * half * u, -1.6 * roll, tilt];
  }
  const v = (p - stance) / (1 - stance);
  return [-half + 2 * half * (0.5 - 0.5 * Math.cos(Math.PI * v)), -kick * Math.sin(Math.PI * v ** 0.7), -30 * (1 - v) ** 2 + 14 * v ** 3];
}

// How high a running body floats between steps (0-1): zero while a foot is planted.
function flightAt(p, G) {
  const u = (p * 2) % 1;
  const st2 = G.stance * 2;
  return u >= st2 ? Math.sin((Math.PI * (u - st2)) / (1 - st2)) : 0;
}

const legKey = ([dx, dy, tilt]) => [q(dx), q(dy), Math.round(tilt / 2) * 2];

// How far the hips sink so every planted foot (one not lifted) can reach the ground.
function hipDrop(r) {
  if (r.air) return 0;
  let drop = r.squat;
  for (const [dx, dy] of [r.frontLeg, r.backLeg]) {
    if (dy < -0.01) continue;
    drop = Math.max(drop, REST_LEG - Math.sqrt(Math.max(0, LEG * LEG - dx * dx)));
  }
  return q(drop);
}

const ease = (t) => 1 - (1 - t) ** 3;

function baseRig() {
  return {
    view: 'side', tx: 0, by: 0, hx: 0, hy: 0,
    frontLeg: [0.8, 0, 0], backLeg: [-0.8, 0, 0], frontArm: [0, 0], backArm: [0, 0], armSide: 1, hipIn: 0, air: false, squat: 0,
    hair: 0, hairLift: 0, cape: 0, flap: false, eyes: 'open', mouth: null, climb: 0, tilt: 0,
  };
}

// An idle breath, 0 (out) to 1 (in), over one cycle of u: a slow swell, a held beat at the top,
// then a quicker letting go.
function breath(u) {
  const b = ((u % 1) + 1) % 1;
  if (b < 0.5) return 0.5 - 0.5 * Math.cos((b / 0.5) * Math.PI);
  if (b < 0.64) return 1;
  return 0.5 + 0.5 * Math.cos(((b - 0.64) / 0.36) * Math.PI);
}

function solveRig(state, anim, mv = null) {
  const { pose = 'idle', time = 0, hurt = false, seed = 0 } = state;
  const r = baseRig();
  const t = time + seed * 1.37;
  // Without a spring (NPCs, menus) the hair still sways, its tips a beat behind the breath.
  r.hair = Math.round((anim ? Math.max(-3, Math.min(3, anim.hair)) : Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.4 - 1.4) * 0.35) * 2) / 2;
  // The tips follow the root a beat later (a chain), and swing a little further.
  r.hairTip = Math.round((anim ? Math.max(-4, Math.min(4, anim.hairTip ?? anim.hair)) : Math.sin(t * 1.3 - 0.9) * 0.75 + Math.sin(t * 2.4 - 2.4) * 0.4) * 2) / 2;
  // The cape is a chain of two springs: the root (upper cloth) and the hem a beat behind it.
  r.cape = anim ? Math.round(Math.max(-4, Math.min(4, anim.capeTip ?? anim.cape))) : Math.round(Math.sin(t * 1.1) * 0.8);
  r.capeRoot = anim ? Math.round(Math.max(-3, Math.min(3, anim.cape)) * 2) / 2 : null;
  r.flap = Math.floor(t * (pose === 'jump' ? 10 : 4)) % 2 === 0;
  // A blink every few seconds, slightly offset per character.
  const cycle = (t * 0.31) % 1;
  if (cycle < 0.035 || (cycle > 0.5 && cycle < 0.53 && seed % 2 === 0)) r.eyes = 'blink';
  // Talking (an NPC whose words are typing out): the mouth opens and closes on a syllable beat,
  // skipping every third so it doesn't flap like a metronome.
  if (state.talking && Math.floor(t * 9) % 3 !== 2 && Math.floor(t * 9) % 2 === 0) r.mouth = 'open';

  if (pose === 'climb') {
    r.view = 'back';
    const f = Math.floor(((anim ? anim.climb : t * 20) / 10) % 4 + 4) % 4;
    r.climb = [2, 0, -2, 0][f];
    return r;
  }

  if (pose === 'walk') {
    const phase = anim ? walkPhase(anim) : (t * 0.9) % 1;
    const p = (Math.round(phase * WALK_FRAMES) % WALK_FRAMES) / WALK_FRAMES;
    const gait = anim ? Math.round(anim.gait * 4) / 4 : 0;
    const G = gaitShape(gait);
    const front = walkLeg(p, G);
    const back = walkLeg((p + 0.5) % 1, G);
    r.frontLeg = legKey(front);
    r.backLeg = legKey(back);
    // Each arm swings against the leg on its side. The figure faces the screen while it walks
    // sideways, so a swing toward the walking direction is only shown where it carries a hand
    // outward; a swing that would carry it across the body shows as the hand lifting toward the
    // viewer instead (with the forearm foreshortening), so the hands never meet over the belly.
    // The hand rises at the ends of the swing; running, the arms pump higher with bent elbows.
    const hand = ([dx], out) => {
      const sw = Math.max(-1, Math.min(1, -dx / G.half));
      const along = sw * (1.8 + 0.9 * gait);
      const x = along * out >= 0 ? along : out * 0.5 * Math.abs(sw);
      const lift = (1.1 + 1.9 * gait) * Math.abs(sw) + (along * out < 0 ? 1.1 * Math.abs(sw) : 0) + 1.6 * gait;
      return [q(x), q(-lift)];
    };
    r.frontArm = hand(front, 1);
    r.backArm = hand(back, -1);
    // Swinging arms bend mostly toward and away from the viewer (see arm()).
    r.armSide = 0.35;
    // The hips turn toward the walking direction (see bodyShapes).
    r.hipIn = 0.6;
    // Running, the hips give a little through each stance (the float is drawn in drawHeroBody).
    const u = (p * 2) % 1;
    if (u < G.stance * 2) r.squat = q(gait * 1.2 * Math.sin((Math.PI * u) / (G.stance * 2)));
    // The head rides a step behind the body's bob.
    r.hy = q(0.9 * (walkBob(p) - walkBob(p, 0.14)));
    r.tx = q(1 + 0.5 * gait);
  } else if (pose === 'jump') {
    const vy = state.vy ?? -1;
    r.air = true;
    if (anim?.rise > 0 || vy < -250) {
      // Rising: stretched tall, legs tucked, arms swept back.
      r.by = -1;
      r.frontLeg = [2.6, -5, 10];
      r.backLeg = [-1.6, -2.6, -10];
      r.frontArm = [-2, -2];
      r.backArm = [-2, -3];
    } else if (vy < 120) {
      // Apex: a little ball.
      r.frontLeg = [3, -6, 10];
      r.backLeg = [-1, -4, -6];
      r.frontArm = [1, -3];
      r.backArm = [-1, -3];
    } else {
      // Falling: legs reach for the ground, arms out for balance, hair floats up.
      r.frontLeg = [2, -2, 6];
      r.backLeg = [-2.6, -1, -6];
      r.frontArm = [2, -4];
      r.backArm = [-3, -4];
      r.hairLift = -1;
    }
    r.mouth = 'open';
  } else if (state.ready) {
    // Fighting stance after a fight: feet wide, a springy bounce in the knees on a quick beat,
    // fists up, and the hair whipping a moment behind each bounce.
    const beat = t * 6.5;
    const down = Math.sin(beat) > 0.2;
    r.squat = down ? 1 : 0;
    r.by = down ? 1 : 0;
    r.frontLeg = [2, 0, 4];
    r.backLeg = [-2.2, 0, -6];
    r.frontArm = [1, q(-1.5 + (down ? 0.5 : 0))];
    r.backArm = [1.5, q(-2 + (down ? 0.5 : 0))];
    r.hair = Math.round((r.hair + Math.sin(beat - 1.2) * 1.2) * 2) / 2;
    r.tx = 1;
  } else {
    // Idle breathing: the upper body eases down a pixel on each exhale, the arms follow, and the
    // weight drifts from foot to foot every few seconds.
    // The breath swells slowly and lets go quickly, and the head settles a beat after the chest.
    const inhale = breath(t * 0.38);
    r.by = q(1 - inhale);
    r.hy = q(1.6 * (inhale - breath(t * 0.38 - 0.1)));
    r.frontArm = [0, r.by];
    r.backArm = [0, r.by];
    r.tx = q(0.6 * Math.sin(t * 0.45));
    // The head tips a little toward the hip the weight shifts onto, a beat after the body.
    r.tilt = Math.round(1.6 * Math.sin(t * 0.45 - 0.7)) * 2;
  }

  // Landing squash: the knees give, the hips drop, and the feet spread.
  if (anim?.land > 0 && pose !== 'jump') {
    const k = anim.land > 0.06 ? 2 : 1;
    r.by = 0;
    r.squat = k;
    r.frontLeg = [r.frontLeg[0] + k * 0.6, 0, 0];
    r.backLeg = [r.backLeg[0] - k * 0.6, 0, 0];
    r.frontArm = [k, 1];
    r.backArm = [-k, 1];
  }

  // Hurt: the first beat is held at the most squashed, leaning hard away from the blow, then the
  // body wobbles back like jelly (hurtK runs 1 -> overshoot -> 0, see drawHeroBody).
  if (hurt) {
    const k = state.hurtK ?? 0.7;
    r.tx = q(-1.6 * k);
    r.hx = q(-1.2 * k);
    r.hy = q(0.8 * Math.max(0, k));
    r.squat = k > 0.5 ? 1 : 0;
    r.eyes = 'hurt';
    r.frontArm = [q(-1 - k), q(-1 - 1.5 * k)];
    r.backArm = [q(-2 - k), q(-1 - 1.5 * k)];
    r.hairLift = k > 0.5 ? -1 : 0;
    // The head snaps back away from the blow, then wobbles upright with the body.
    r.tilt = Math.round(-3 * k) * 2;
  }

  // Knocked out (a fallen party member): limp, eyes shut, mouth open.
  if (state.down) {
    r.eyes = 'dead';
    r.frontArm = [2, -1];
    r.backArm = [-2, -1];
    r.frontLeg = [1.5, 0, 10];
    r.backLeg = [-1.5, 0, -10];
    r.hairLift = 0;
    // Limp: the head lolls to one side.
    r.tilt = 8;
  }

  // Attack and skill moves shape the body on top of everything else.
  if (mv) mv.rig?.(r);
  return r;
}

function rigKey(r) {
  return [r.view, r.tx, r.by, r.hx, r.hy, ...r.frontLeg, ...r.backLeg, ...r.backArm, r.armSide, r.hipIn, r.armIn ? r.frontArm.join(',') : '-', r.air ? 1 : 0, r.squat, r.hair, r.hairTip, r.hairLift, r.cape, r.capeRoot, r.flap ? 1 : 0, r.eyes, r.mouth, r.climb, r.tilt, r.face ? JSON.stringify(r.face) : ''].join(',');
}

// ---------- Weapons ----------

// Joke weapon covers, packed like weapons so they swing the same way.
const funWeapons = new Map();
function funWeapon(fun) {
  const key = `${fun.fun}|${fun.t}`;
  if (!funWeapons.has(key)) {
    const { shapes, blade } = JOB_GEAR[fun.fun].cover(fun.t);
    funWeapons.set(key, pack(shapes, { blade }));
  }
  return funWeapons.get(key);
}

function weaponSprite(w, time) {
  if (w.fun) {
    const def = funWeapon(w.fun);
    const s = sprite(`funweapon|${w.fun.fun}|${w.fun.t}`, () => ({ w: def.w, h: def.h, shapes: def.shapes }));
    return { ...s, ...logical(s), grip: def.grip, blade: def.blade, live: null };
  }
  const frames = weaponFrames(w.type, w.tier, w.theme);
  const frame = frames > 1 ? Math.floor(time * 9) % frames : 0;
  const def = weaponShapes(w.type, w.tier, frame, w.theme, w.variant);
  if (!def) return null;
  const s = sprite(`weapon|${w.type}|${w.tier}|${w.theme}|${w.variant}|${frame}`, () => ({ w: def.w, h: def.h, shapes: def.shapes, res: RES, soft: 'cel', crisp: true }));
  return { ...s, ...logical(s), grip: def.grip, blade: def.blade, live: def.live };
}

// A sprite's canvas size in art pixels (HD sprites hold several cells per art pixel).
const logical = (s) => ({ cw: s.canvas.width / s.res, ch: s.canvas.height / s.res });

// Little twinkles at a weapon's tip, for wand twirls and staff taps.
function idleSparkle(ctx, hx, hy, angle, len, flip, time, scale) {
  const rad = (angle * Math.PI) / 180;
  const x = hx + Math.sin(rad) * len * (flip ? -1 : 1);
  const y = hy - Math.cos(rad) * len;
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const a = time * 5 + i * 1.6;
    const r = (1.6 + (i % 2)) * scale;
    const px = x + Math.cos(a) * 6 * scale;
    const py = y + Math.sin(a) * 5 * scale - i * scale;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 9 + i);
    ctx.fillStyle = i % 2 ? '#ffffff' : '#ffe36b';
    ctx.beginPath();
    ctx.moveTo(px, py - r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.quadraticCurveTo(px, py, px, py + r);
    ctx.quadraticCurveTo(px, py, px - r, py);
    ctx.quadraticCurveTo(px, py, px, py - r);
    ctx.fill();
  }
  ctx.restore();
}

// Elemental weapons always glow softly in their element's color.
function elementGlow(ctx, wpn, element, time, scale) {
  const glow = tinted(wpn, ELEMENTS[element].glow);
  const ox = -(wpn.grip[0] + 1) * scale;
  const oy = -(wpn.grip[1] + 1) * scale;
  const base = ctx.globalAlpha;
  ctx.globalAlpha = base * (0.3 + 0.2 * Math.sin(time * 4));
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.drawImage(glow, ox + dx * scale, oy + dy * scale, wpn.cw * scale, wpn.ch * scale);
  ctx.globalAlpha = base;
}

// Rarity effects drawn in the weapon's rotated frame (grip at the origin, tip toward -y).
// Rare: a glint sweeps up the weapon. Epic: a glowing outline and motes circling the tip.
// Legendary: a stronger pulsing aura and sparkles rising off the whole weapon.
function weaponGlow(ctx, wpn, rarity, time, scale, draw) {
  const color = RARITIES[rarity].color;
  const ox = -(wpn.grip[0] + 1) * scale;
  const oy = -(wpn.grip[1] + 1) * scale;
  const w = wpn.cw * scale;
  const h = wpn.ch * scale;
  if (rarity >= 2) {
    const pulse = 0.5 + 0.5 * Math.sin(time * (rarity >= 3 ? 5 : 3));
    const glow = tinted(wpn, color);
    const reach = rarity >= 3 ? 2 : 1;
    const base = ctx.globalAlpha;
    ctx.globalAlpha = base * (0.35 + 0.35 * pulse);
    for (let r = 1; r <= reach; r++) {
      for (const [dx, dy] of [[r, 0], [-r, 0], [0, r], [0, -r]]) ctx.drawImage(glow, ox + dx * scale, oy + dy * scale, w, h);
    }
    ctx.globalAlpha = base;
  }
  draw(ox, oy, w, h);
  const len = (wpn.grip[1] - 4) * scale;
  ctx.fillStyle = '#ffffff';
  // Glint sliding from grip to tip.
  const p = (time * 0.9) % 1.6;
  if (p < 1) {
    const gy = -p * len;
    const k = Math.sin(p * Math.PI) * 2 * scale;
    ctx.fillRect(-0.5 * scale, gy - k, scale, k * 2 + scale);
    ctx.fillRect(-k, gy, k * 2 + scale, scale);
  }
  if (rarity >= 2) {
    ctx.fillStyle = color;
    const n = rarity >= 3 ? 4 : 2;
    for (let i = 0; i < n; i++) {
      const a = time * 3 + (i / n) * Math.PI * 2;
      ctx.fillRect(Math.round(Math.cos(a) * 7 * scale), Math.round(-len * 0.85 + Math.sin(a) * 4 * scale), scale * 1.5, scale * 1.5);
    }
  }
  if (rarity >= 3) {
    for (let i = 0; i < 5; i++) {
      const k = (time * 0.7 + i / 5) % 1;
      ctx.fillStyle = i % 2 ? '#ffffff' : color;
      ctx.globalAlpha *= 1 - k;
      ctx.fillRect(Math.round(Math.sin(i * 2.3 + time) * 5 * scale), Math.round(-len * (i / 5) - k * 10 * scale), scale, scale);
      ctx.globalAlpha /= Math.max(0.01, 1 - k);
    }
  }
}

// ---------- Public drawing ----------

// look: appearance; gear: equipment map or null.
// state: { pose, time, facing, progress, hurt, flash, alpha, scale, seed, vy }; anim: from createAnim().
// (x, y) is the character's feet center in screen space.
const WEAPON_SCALE = 1;

// Idle routines while standing still with a weapon: a gentle loop plus a signature move every
// few seconds. Returns the hand's offset from its rest spot (body units), the weapon's angle, and
// optionally a toss height (px), a spin, and a sparkle at the hand.
const smooth = (u) => u * u * (3 - 2 * u);
function weaponIdle(type, t) {
  const at = (period) => (t % period) / period;
  const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
  switch (type) {
    case 'sword': {
      // Sway, then a quick flourish: lift the blade and spin it once.
      const p = at(5);
      const spin = p > 0.8 ? smooth((p - 0.8) / 0.2) * 360 : 0;
      return { arm: [0.5 * bump(p, 0.8, 1), -3 * bump(p, 0.8, 1)], angle: 25 + Math.sin(t * 1.6) * 4 - spin };
    }
    case 'axe': {
      // Rests on the shoulder, bobbing with each breath; now and then it gets hefted up.
      const p = at(6);
      const heft = bump(p, 0.75, 0.95);
      return { arm: [1, -5 - 3 * heft], angle: 16 + Math.sin(t * 2) * 3 - 14 * heft };
    }
    case 'spear': {
      // Planted upright; every so often a twirl.
      const p = at(6);
      const spin = p > 0.82 ? smooth((p - 0.82) / 0.18) * 360 : 0;
      return { arm: [3, -3 - 2 * bump(p, 0.82, 1)], angle: 4 + Math.sin(t * 1.2) * 2 + spin };
    }
    case 'wand': {
      // Twirls in the fingers, with a full spin and a sparkle every few seconds.
      const p = at(4);
      const spin = p > 0.75 ? smooth((p - 0.75) / 0.25) * 360 : 0;
      return { arm: [0.5, -2 - 2 * bump(p, 0.75, 1)], angle: 25 + Math.sin(t * 3) * 18 + spin, sparkle: p > 0.85 && p < 0.97 };
    }
    case 'staff': {
      // Held upright and tapped on the ground, which sends up a little glimmer.
      const p = at(4);
      const tap = bump(p, 0.7, 0.85);
      return { arm: [3, -4 - 3 * tap], angle: 5 + Math.sin(t * 1.4) * 2, sparkle: p > 0.84 && p < 0.96 };
    }
    case 'bow': {
      // A slow sway; every so often it's raised to check the string.
      const p = at(6);
      const check = bump(p, 0.7, 0.95);
      return { arm: [1.5 * check, -5 * check], angle: 25 + Math.sin(t * 1.3) * 4 - 25 * check };
    }
    case 'crossbow': {
      // Hangs at the side, then comes up to aim for a moment and lowers again.
      const p = at(5.5);
      const aim = bump(p, 0.62, 0.95);
      return { arm: [2 * aim, -5 * aim], angle: 55 + Math.sin(t * 1.5) * 3 - 50 * aim };
    }
    case 'dagger': {
      // Tossed into the air with a couple of flips and caught again.
      const p = at(3.2);
      const air = p > 0.6 ? (p - 0.6) / 0.4 : 0;
      return { arm: [0, -2 * bump(p, 0.55, 1)], angle: 25 + Math.sin(t * 2) * 5 + air * 720, toss: Math.sin(air * Math.PI) * 18 };
    }
    case 'gauntlet': {
      // Flexes the gauntlet, with a quick wrist-flick practice throw every few seconds.
      const p = at(3.5);
      const flick = bump(p, 0.78, 0.9);
      return { arm: [4 * flick, -2 * flick], angle: 70 + Math.sin(t * 4) * 5 - 25 * flick };
    }
    default:
      return null;
  }
}

// Draws a hero. Advanced jobs (state.job) get an idle aura that fades in while standing still,
// layered behind and in front of the sprite.
export function drawHero(ctx, look, gear, x, y, state, anim = null) {
  const job = settings.jobAuras && AURA_JOBS.has(state.job) ? state.job : null;
  if (!job) return drawHeroBody(ctx, look, gear, x, y, state, anim);
  const time = state.time ?? 0;
  const idle = (state.pose ?? 'idle') === 'idle';
  let k = idle ? 1 : 0;
  if (anim) {
    const dt = Math.max(0, Math.min(0.1, time - (anim.auraT ?? time)));
    anim.auraT = time;
    anim.aura = Math.max(0, Math.min(1, (anim.aura ?? 0) + (idle ? dt * 1.5 : -dt * 6)));
    k = anim.aura;
  }
  const s = state.scale ?? 1;
  const t = time + (state.seed ?? 0) * 1.37;
  drawJobAura(ctx, job, 'back', x, y, t, s, k);
  drawHeroBody(ctx, look, gear, x, y, state, anim);
  drawJobAura(ctx, job, 'front', x, y, t, s, k);
}

// Older pose names still used by callers map onto moves.
const POSE_MOVES = { swing: 'slash', shoot: 'draw', cast: 'castforward' };

// Draws the body, moving the whole figure for the current move: hops, lunges, leans, spins.
function drawHeroBody(ctx, look, gear, x, y, state, anim = null) {
  const pose = state.pose ?? 'idle';
  const moved = moveAt(POSE_MOVES[pose] ?? pose, state.progress ?? 0, state.dur ?? 0.35);
  // Walking, the whole body leans into the run and rises a little at each passing step.
  let mv = moved;
  if (!moved && pose === 'walk' && anim) {
    // Walking, the body leans in a little; running, more, and it floats between steps (the whole
    // figure lifts, both feet off the ground) with a touch of stretch.
    const p = (Math.round(walkPhase(anim) * WALK_FRAMES) % WALK_FRAMES) / WALK_FRAMES;
    const gait = Math.round(anim.gait * 4) / 4;
    const fly = flightAt(p, gaitShape(gait)) * gait;
    mv = { lift: 2.2 * fly, lunge: 0, tilt: 0.03 + 0.05 * gait, turn: 1, stretch: 1 + 0.03 * fly, bodyOnly: true };
  }
  // Hurt timing: hold the hit pose for a beat, then a decaying wobble back.
  let hx = 1;
  let hy = 1;
  if (anim) {
    if (state.hurt) {
      if (!anim.hurtOn) anim.hurtAt = state.time ?? 0;
      const e = Math.max(0, (state.time ?? 0) - anim.hurtAt);
      const k = e < 0.09 ? 1 : Math.exp(-(e - 0.09) * 7) * Math.cos((e - 0.09) * 26);
      state = { ...state, hurtK: Math.round(k * 4) / 4 };
      hx = 1 + 0.1 * k;
      hy = 1 - 0.1 * k;
    }
    anim.hurtOn = Boolean(state.hurt);
  }
  // Take-off stretch and landing squash (from the animator), about the feet.
  const sx = (anim?.sqx ?? 1) * hx;
  const sy = (anim?.sqy ?? 1) * hy;
  const sq = sx !== 1 || sy !== 1;
  if (sq) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.translate(-x, -y);
  }
  drawMoved(ctx, look, gear, x, y, state, anim, mv, moved);
  if (sq) ctx.restore();
}

// Where the weapon is at a moment of an attack move, as offsets from the feet (screen pixels at
// `scale`), worked out exactly as it's drawn: the aimed arm's hand, the weapon's angle, its tip
// (from the weapon's own length), and the front shoulder, all carried through the whole-body
// lunge, lift, tilt, turn and stretch. Effects use it so a smear or a thrust's spike lines up with
// the weapon instead of a fixed height. Returns null for moves without an aimed arm.
export function strikePose(look, gear, move, progress, dur, facing = 1, scale = 1) {
  const mv = moveAt(POSE_MOVES[move] ?? move, progress, dur);
  if (!mv || mv.arm == null || mv.weapon == null) return null;
  const g = resolveGear(look, gear);
  const rig = solveRig({ pose: move, progress, dur, time: 0, facing }, null, mv);
  const bodyY = rig.by + hipDrop(rig);
  const rad = (mv.arm * Math.PI) / 180;
  const hand = [squashX(FRONT_SHOULDER + Math.sin(rad) * 8.6 + rig.tx), squashY(SHOULDER_Y + Math.cos(rad) * 8.6 + bodyY)];
  const shoulder = [squashX(FRONT_SHOULDER + rig.tx), squashY(SHOULDER_Y + bodyY)];
  const dir = facing < 0 ? -1 : 1;
  // Body coordinates to offsets from the feet, mirrored when facing left.
  const at = ([px, py]) => [dir * ((px + OX) - W / 2) * scale, ((py + OY) - H) * scale];
  const wpn = g.weapon ? weaponSprite(g.weapon, 0) : null;
  const len = wpn ? (wpn.grip[1] - 6) * scale * WEAPON_SCALE : 0;
  const wa = (mv.weapon * Math.PI) / 180;
  const h = at(hand);
  const tip = [h[0] + Math.sin(wa) * len * dir, h[1] - Math.cos(wa) * len];
  // The whole-body move, about the pivot, as drawMoved applies it.
  const pivot = -H * scale * 0.42;
  const turn = Math.abs(mv.turn) < 0.05 ? 0.05 * Math.sign(mv.turn || 1) : mv.turn;
  const c = Math.cos(mv.tilt * dir);
  const sn = Math.sin(mv.tilt * dir);
  const body = ([px, py]) => {
    const x0 = px * turn;
    const y0 = (py - pivot) * mv.stretch;
    return [x0 * c - y0 * sn + dir * mv.lunge * scale, x0 * sn + y0 * c + pivot - mv.lift * scale];
  };
  return { hand: body(h), tip: body(tip), shoulder: body(at(shoulder)), angle: mv.weapon, reach: len, dir };
}

function drawMoved(ctx, look, gear, x, y, state, anim, mv, moved) {
  if (!mv || (!mv.lift && !mv.lunge && !mv.tilt && mv.turn === 1 && mv.stretch === 1)) {
    paintHero(ctx, look, gear, x, y, state, anim, moved);
    return;
  }
  const scale = state.scale ?? 1;
  const dir = (state.facing ?? 1) < 0 ? -1 : 1;
  const pivot = y - H * scale * 0.42;
  ctx.save();
  ctx.translate(x + dir * mv.lunge * scale, pivot - mv.lift * scale);
  ctx.rotate(mv.tilt * dir);
  ctx.scale(Math.abs(mv.turn) < 0.05 ? 0.05 * Math.sign(mv.turn || 1) : mv.turn, mv.stretch);
  ctx.translate(-x, -pivot);
  paintHero(ctx, look, gear, x, y, state, anim, moved);
  ctx.restore();
}

function paintHero(ctx, look, gear, x, y, state, anim, mv) {
  const { pose = 'idle', facing = 1, alpha = 1, scale = 1 } = state;
  const attack = Boolean(mv);
  const g = resolveGear(look, gear);
  const rig = solveRig(state, anim, mv);
  rig.armIn = !attack;
  const idleW = !attack && pose === 'idle' && !state.ready && g.weapon && rig.view !== 'back' ? weaponIdle(g.weapon.type, (state.time ?? 0) + (state.seed ?? 0) * 1.37) : null;
  if (idleW) rig.frontArm = [rig.frontArm[0] + q(idleW.arm[0]), rig.frontArm[1] + q(idleW.arm[1])];
  if (rig.view !== 'back') rig.face = faceFrame(look.face ?? 'smile', (state.time ?? 0) + (state.seed ?? 0) * 1.37);
  const lookKey = JSON.stringify(look);
  const gk = gearKey(gear);
  const body = sprite(`hero|${lookKey}|${gk}|${rigKey(rig)}`, () => ({ w: W, h: H, shapes: bodyShapes(look, g, rig), res: RES, soft: 'cel', crisp: true, selout: true }));

  const flip = facing < 0;
  const left = x - (W / 2) * scale;
  const top = y - H * scale;
  // Mirror a point given in body coordinates when facing left.
  const sx = (px) => (flip ? left + (W - (px + OX)) * scale : left + (px + OX) * scale);
  const sy = (py) => top + (py + OY) * scale;

  const skin = look.skinTone ?? '#fff0e6';
  const sleeve = sleeveColor(g.top.design, g.top.color, g.top);
  const long = longSleeves(g.top.design, g.top);
  const wpn = g.weapon && rig.view !== 'back' ? weaponSprite(g.weapon, state.time ?? 0) : null;
  const angles = mv ? { weapon: mv.weapon, arm: mv.arm } : null;

  // Front arm layer; it moves with the upper body, which sinks with the hips.
  const bodyY = rig.by + hipDrop(rig);
  let armShapesNow;
  let hand;
  let armKey;
  if (angles) {
    const aimed = aimedArm(angles.arm, sleeve, long, g, skin);
    armShapesNow = aimed.shapes;
    hand = [aimed.hand[0] + rig.tx, aimed.hand[1] + bodyY];
    armKey = `a${Math.round(angles.arm / 5)}`;
  } else {
    armShapesNow = armShapes(FRONT_SHOULDER, rig.frontArm[0], rig.frontArm[1], sleeve, long, g, skin, rig.armSide);
    hand = [FRONT_SHOULDER + HAND_FORWARD + rig.frontArm[0] + rig.tx, HAND_Y + rig.frontArm[1] + bodyY];
    armKey = `r${rig.frontArm.join(',')},${rig.armSide}`;
  }
  const armDx = rig.tx;
  const armDy = bodyY;

  const restAngle = { crossbow: 55, gauntlet: 70 }[g.weapon?.type] ?? 25;
  // On guard, the weapon points out front and dips with each bounce.
  const guard = state.ready && pose === 'idle' ? { crossbow: 80, gauntlet: 95, bow: 20 }[g.weapon?.type] ?? 62 : null;
  let weaponAngle = angles ? angles.weapon : idleW ? idleW.angle : guard != null ? guard + rig.by * 6 : restAngle + rig.frontArm[0] * 4 + (pose === 'jump' ? -15 : 0);

  // The hand was placed on the full-size figure; carry it into the squashed body.
  hand = [squashX(hand[0]), squashY(hand[1])];

  // Weapon size relative to the hero (they are drawn big on purpose).
  const ws = scale * WEAPON_SCALE;
  const drawWeapon = () => {
    if (!wpn) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(snap(sx(hand[0])), snap(sy(hand[1]) - (idleW?.toss ?? 0) * scale));
    if (flip) ctx.scale(-1, 1);
    ctx.rotate((weaponAngle * Math.PI) / 180);
    const time = state.time ?? 0;
    const paint = (ox, oy, w, h) => ctx.drawImage(wpn.canvas, ox, oy, w, h);
    const el = g.weapon.element;
    if (el) elementGlow(ctx, wpn, el, time, ws);
    if (g.weapon.rarity) weaponGlow(ctx, wpn, g.weapon.rarity, time, ws, paint);
    else paint(-(wpn.grip[0] + 1) * ws, -(wpn.grip[1] + 1) * ws, wpn.cw * ws, wpn.ch * ws);
    if (settings.weaponEffects) {
      if (el && wpn.blade) drawElementAura(ctx, el, (wpn.blade[0] - wpn.grip[1]) * ws, (wpn.blade[1] - wpn.grip[1]) * ws, time, ws);
      wpn.live?.(ctx, time, ws, wpn.grip);
    }
    ctx.restore();
  };

  // Weapon trail: remember where the tip was during a swing, drawn as a fading ribbon.
  if (anim && wpn && mv?.trail) {
    const len = (wpn.grip[1] - 6) * ws;
    const rad = (weaponAngle * Math.PI) / 180;
    const tipX = sx(hand[0]) + Math.sin(rad) * len * (flip ? -1 : 1);
    const tipY = sy(hand[1]) - Math.cos(rad) * len;
    anim.trail.push({ dx: tipX - x, dy: tipY - y, hx: sx(hand[0]) - x, hy: sy(hand[1]) - y, age: 0 });
  }
  if (anim && anim.trail.length > 1) drawTrail(ctx, anim.trail, x, y, g.weapon?.color ?? '#ffffff');

  // A held weapon is drawn in front of the body, with the hand drawn again on top so it grips
  // the handle.
  blit(ctx, body, left, top, { flip, flash: state.flash ?? 0, alpha, scale });
  if (alpha > 0.5) {
    // Anchor points on the posed figure for the live gear effects.
    const pt = (px, py) => [sx(px), sy(py)];
    const headDx = squashX(15.5 + rig.tx) - 15.5 + rig.hx;
    const headDy = bodyY * KY + rig.hy;
    drawGearFx(ctx, g, {
      head: pt(15.5 + headDx, 4 + headDy), chest: pt(squashX(15.5 + rig.tx), squashY(31 + bodyY)), hips: pt(squashX(15.5 + rig.tx * 0.5), squashY(38 + bodyY)),
      feet: pt(15.5, squashY(55)), hands: pt(hand[0], hand[1]), back: pt(squashX(10.5 + rig.tx), squashY(32 + bodyY)), w: 4 * scale,
    }, scale, flip ? -1 : 1, (state.time ?? 0) + (state.seed ?? 0) * 1.37);
  }
  if (rig.view === 'back') return;
  if (!attack) {
    if (!wpn) return;
    drawWeapon();
    const grip = sprite(`grip|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(squash(armShapesNow.slice(armShapesNow.handAt)), 0, 0), res: RES, soft: 'cel', crisp: true, selout: true }));
    blit(ctx, grip, left + (flip ? -armDx : armDx) * KX * scale, top + armDy * KY * scale, { flip, flash: state.flash ?? 0, alpha, scale });
    if (idleW?.sparkle) idleSparkle(ctx, sx(hand[0]), sy(hand[1]), weaponAngle, (wpn.grip[1] - 4) * ws, flip, state.time ?? 0, scale);
    return;
  }
  drawWeapon();
  const arm = sprite(`arm|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(squash(armShapesNow), 0, 0), res: RES, soft: 'cel', crisp: true, selout: true }));
  blit(ctx, arm, left + (flip ? -armDx : armDx) * KX * scale, top + armDy * KY * scale, { flip, flash: state.flash ?? 0, alpha, scale });
}

function drawTrail(ctx, trail, x, y, color) {
  ctx.save();
  for (let i = 1; i < trail.length; i++) {
    const a = trail[i - 1];
    const b = trail[i];
    const fade = 1 - b.age / 0.14;
    ctx.globalAlpha = Math.max(0, fade) * 0.7;
    ctx.fillStyle = i % 2 ? '#ffffff' : shade(color, 30);
    ctx.beginPath();
    // A quad between two tip samples and points two-thirds of the way down the blade.
    const mid = (p) => [x + p.hx + (p.dx - p.hx) * 0.45, y + p.hy + (p.dy - p.hy) * 0.45];
    const [am, an] = mid(a);
    const [bm, bn] = mid(b);
    ctx.moveTo(x + a.dx, y + a.dy);
    ctx.lineTo(x + b.dx, y + b.dy);
    ctx.lineTo(bm, bn);
    ctx.lineTo(am, an);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
