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

import { ITEMS, RARITIES } from '../data/items.js';
import { R, E, T, F, C, L, sprite, blit, shade, mix, shadowTone, tinted } from './pixel.js';
import {
  topShapes, sleeveColor, longSleeves, legLook, hipShapes, skirtShapes, legShapes, hatShapes,
  hatBackShapes, TUCKS_HAIR, capeShapes, capeFrontShapes, handShapes, earringShapes, limb, reach, THIGH, SHIN, HIP_Y, ANKLE_Y,
} from './gear.js';
import { weaponShapes, weaponFrames } from './weapons.js';
import { drawElementAura, ELEMENTS } from './elements.js';
import { walkPhase } from './animator.js';
import { drawJobAura, AURA_JOBS } from './aura.js';
import { moveAt } from './moves.js';

export const HAIR_STYLES = ['bob', 'wavy', 'twintails', 'ponytail', 'short', 'curly', 'bun', 'long', 'ahoge', 'curtain', 'sweep', 'quiff', 'wolf', 'hime', 'odango', 'drills', 'braid', 'eyecover'];
// Spiky hair was retired; old saves that used it get soft curls instead.
const hairStyleOf = (look) => (look.hairStyle === 'spiky' ? 'curly' : look.hairStyle ?? 'bob');
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
const OX = 6;
const OY = 11;
const W = 30 + OX * 2;
const H = Math.ceil(NECK + (LEG_TOP - NECK) * KY + (56 - LEG_TOP) * KY * KL) + OY;
const INK = '#3a2d4f';
// Detail cells per art pixel for character sprites (drawn crisp, like pixel art), and rounding of
// rig offsets to that grid.
const RES = 2;
const q = (v) => Math.round(v * RES) / RES;

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
    return { design: def.design ?? design, color: def.color };
  };
  const w = gear?.weapon ? ITEMS[gear.weapon.id] : null;
  return {
    top: piece('top', preset.top, outfit),
    bottom: piece('bottom', preset.bottom, preset.bottomColor ?? shade(outfit, -22)),
    shoes: piece('shoes', 'sneakers', '#fffaf0'),
    hat: piece('hat', null),
    cape: piece('cape', null),
    gloves: piece('gloves', null),
    earring: piece('earring', null),
    weapon: w ? { type: w.weaponType, color: w.color, tier: w.tier, theme: w.theme ?? null, element: w.element ?? null, rarity: gear.weapon.rarity ?? 0 } : null,
  };
}

function gearKey(gear) {
  if (!gear) return '-';
  return ['top', 'bottom', 'shoes', 'gloves', 'hat', 'cape', 'earring'].map((s) => gear[s]?.id ?? '').join(',');
}

// ---------- Head ----------
//
// A big round head (center (15.5, 14.6)) on a thin neck, ears on both sides, and a face turned a
// touch toward the facing side. Hair is built around that skull: a crown behind the head, soft
// rounded bangs and side locks in front, and longer styles that hang behind the body.

const RIBBON = '#ff9ec0';
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

// Hair that hangs below the head bends with the hair spring: the lower a point, the more it sways.
function swayShape(shape, sway, lift) {
  const bend = (py) => Math.max(0, Math.min(1, (py - 14) / 16));
  if (shape.t === 'p') {
    return { ...shape, pts: shape.pts.map(([px, py]) => [px + q(sway * bend(shape.y + py)), py + (shape.y + py >= 22 ? lift : 0)]) };
  }
  return { ...shape, x: shape.x + q(sway * bend(shape.y)), y: shape.y + (shape.y >= 22 ? lift : 0) };
}

// A white ribbon bow tied at (x, y), with a pink knot so it shows on any hair color.
const BOW = '#fff6fb';
const bow = (x, y) => [T([[x, y], [x - 2.8, y - 1.8], [x - 2.6, y + 1.6]], BOW), T([[x, y], [x + 2.8, y - 1.8], [x + 2.6, y + 1.6]], BOW), F(E(x, y, 0.9, 0.9, RIBBON))];

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
// locks over a solid mass, each with a strand line.
function hairBack(style, front, sway, lift) {
  // Hair behind the head sits a little in shadow, so the bangs stand out in front of it.
  const c = shade(front, -6);
  const crown = E(HEAD_X, 13.2, 12, 11.2, c);
  // Everything that sways hangs below the head and is drawn behind the body.
  const sw = (shapes) => shapes.map((sh) => ({ ...swayShape(sh, sway, lift), hang: true }));
  const locks = (list) => list.flatMap(([x0, y0, x1, y1, w, bend]) => lockWithStrand(x0, y0, x1, y1, w, bend, c));
  switch (style) {
    case 'bob': return [crown, ...sw([
      E(HEAD_X, 16.4, 12.8, 10, c),
      ...locks([[4.4, 12, 6.8, 25.4, 5.4, 1.8], [26.6, 12, 24.2, 25.4, 5.4, -1.8], [9, 17, 10.8, 26, 5, 0.6], [22, 17, 20.2, 26, 5, -0.6], [15.5, 19, 15.5, 26.4, 6, 0]]),
    ])];
    case 'wavy': return [crown, ...sw([
      E(HEAD_X, 21, 13, 12, c),
      ...locks([[4, 14, 3.4, 41, 6, -3], [8.6, 18, 9.6, 42.6, 5.6, 2.6], [15.5, 20, 15.5, 43.4, 6.4, -2], [22.4, 18, 21.4, 42.6, 5.6, -2.6], [27, 14, 27.6, 41, 6, 3]]),
      E(3.8, 40.2, 1.8, 1.6, c), E(27.2, 40.2, 1.8, 1.6, c),
    ])];
    case 'long': return [crown, ...sw([
      T([[3.6, 13], [27.4, 13], [28.2, 30], [27.4, 40], [3.6, 40], [2.8, 30]], c),
      ...locks([[4.6, 15, 4.4, 43, 5.4, -1], [9.6, 18, 10, 44.4, 5.6, 0.6], [15.5, 20, 15.5, 45, 6.2, 0], [21.4, 18, 21, 44.4, 5.6, -0.6], [26.4, 15, 26.6, 43, 5.4, 1]]),
    ])];
    case 'twintails': return [crown, ...sw([
      ...locks([[3, 11, 1.2, 38.4, 7.6, 2.8], [3.8, 13, 4.8, 34, 4.2, -1.2], [28, 11, 29.8, 38.4, 7.6, -2.8], [27.2, 13, 26.2, 34, 4.2, 1.2]]),
    ])];
    case 'ponytail': return [crown, ...sw([
      ...locks([[3.6, 6.6, 0.2, 35, 8, 3.2], [3, 10, 2.8, 30, 4.2, -1.2]]),
    ]), E(4.4, 8.4, 2, 1.8, '#ffd66b')];
    case 'short': return [E(HEAD_X, 13.2, 11.6, 10.6, c), E(HEAD_X, 19.6, 9.6, 4, c), ...locks([[7, 16, 8, 23.4, 4.2, 0.6], [24, 16, 23, 23.4, 4.2, -0.6]])];
    case 'curly': {
      // Soft, fluffy curls all around the head, a little fuller at the back.
      const curls = [[5, 8.6, 2.6], [4, 13.4, 2.6], [4.6, 18.4, 2.4], [6.8, 22, 2.2], [10, 4.4, 2.6], [15.5, 3, 2.8], [21, 4.4, 2.6], [26, 8.6, 2.6], [27, 13.4, 2.4], [26.4, 18.4, 2.2], [24.4, 21.6, 2]];
      return [E(HEAD_X, 13.2, 11.8, 10.8, c), ...curls.map(([x, y, r]) => E(x, y, r, r * 0.92, c))];
    }
    case 'bun': return [crown, E(HEAD_X, 2.8, 5.4, 4.4, c), arc(HEAD_X, 3.2, 4, 3, 200, 300, 0.8, mix(front, '#ffffff', 0.45)), E(HEAD_X, 6.6, 4.6, 1.3, RIBBON),
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
        E(HEAD_X, 21, 11.4, 6.4, c),
        ...locks([[4.6, 18, 0.6, 31, 5.6, -2.4], [9.4, 20, 6.6, 33, 5.4, -1.4], [15.5, 21, 15.5, 33.6, 6, 0], [21.6, 20, 24.4, 33, 5.4, 1.4], [26.4, 18, 30.4, 31, 5.6, 2.4]]),
      ]),
    ];
    case 'eyecover': return [crown, ...sw([
      E(HEAD_X, 19, 12.4, 9, c),
      ...locks([[4.6, 14, 5.6, 29, 5.4, 1.2], [9.6, 18, 10.6, 30, 5, 0.6], [21.4, 18, 20.4, 30, 5, -0.6], [26.4, 14, 25.4, 29, 5.4, -1.2]]),
    ])];
    case 'hime': return [crown, ...sw([
      // Long, straight, and cut level a little above the waist.
      T([[4.4, 14], [26.6, 14], [25.8, 38], [5.2, 38]], c),
      F(R(5.2, 37.4, 20.6, 0.6, shade(c, -16))),
    ])];
    case 'odango': return [crown, E(6.2, 3.6, 3.8, 3.6, c), E(24.8, 3.6, 3.8, 3.6, c),
      arc(6.2, 3.6, 2.6, 2.4, 200, 290, 0.7, mix(front, '#ffffff', 0.45)), arc(24.8, 3.6, 2.6, 2.4, 200, 290, 0.7, mix(front, '#ffffff', 0.45)),
      ...sw(locks([[5, 6, 1.6, 33, 4.6, 2], [26, 6, 29.4, 33, 4.6, -2]]))];
    case 'drills': {
      // Ojou-sama ringlets: a stack of shrinking coils on each side, each with a darker turn line.
      const coil = (x, dir) => Array.from({ length: 5 }, (_, k) => {
        const y = 17 + k * 4.2;
        const rr = 3.6 - k * 0.38;
        return [E(x + (k % 2 ? 0.5 : -0.5) * dir, y, rr, 2.6, c), arc(x + (k % 2 ? 0.5 : -0.5) * dir, y - 0.2, rr, 2.4, 20, 160, 0.6, shade(c, -18))];
      }).flat();
      return [crown, ...sw([...coil(3.6, 1), ...coil(27.4, -1)])];
    }
    case 'braid': return [E(HEAD_X, 13.2, 12, 11, c), E(HEAD_X, 19.6, 10, 4.4, c)];
    default: return [crown];
  }
}

// Bangs. The original styles share one fringe: a rounded cap over the forehead, three big soft
// locks ending just above the eyes, slim side locks, and one clean shine band. Newer styles each
// draw their own fringe. `sway` (from the hair spring) and `mood` (the face) move the ahoge.
function hairFront(style, c, sway = 0, mood = 'smile') {
  const l = mix(c, '#ffffff', 0.45);
  const d = shade(c, -16);
  const cap = C(E(HEAD_X, 7.8, 11.8, 5, c));
  const shine = arc(HEAD_X, 9.6, 8.6, 5.2, 215, 325, 1.3, l);
  const lock = (x0, y0, x1, y1, w, bend) => C(curvedLock(x0, y0, x1, y1, w, bend, c));
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
        lock(6.8, 8, 5.6, 17.4, 4, 0.8), lock(24.6, 8, 25.6, 17, 3.6, -0.8), arc(HEAD_X + 1, 4.6, 7.4, 3.6, 200, 320, 1.2, l)];
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
        C(T([[14.6, 4.6], [15.4, 10], [16.2, 14.6], [17.2, 18.6], [18.2, 22], [19.6 + peek, 25.2], [21.4 + peek, 27.6], [23 + peek, 25.6], [25 + peek, 27],
          [26.6 + peek, 23.4], [27.4, 18], [27.4, 11], [25.4, 5.6], [20, 3.4]], c)),
        stroke([[15.8, 9], [16.7, 14.6], [17.7, 18.6], [18.8 + peek, 22], [20.2 + peek, 25]], 0.6, d),
        lock(7, 8, 5.4, 22, 4.4, 1),
        arc(HEAD_X, 9.6, 8.6, 5.2, 215, 325, 1.3, l), arc(22 + peek, 17, 4.4, 8.4, 245, 300, 1, l)];
    }
    case 'hime':
      // Blunt, straight-cut bangs and straight side locks cut level at the chin.
      return [cap, C(T([[5.4, 8], [25.6, 8], [25.4, 14.6], [5.6, 14.6]], c)), C(R(4.2, 10, 4.6, 14.2, c)), C(R(22.2, 10, 4.6, 14.2, c)),
        F(R(4.2, 23.6, 4.6, 0.6, d)), F(R(22.2, 23.6, 4.6, 0.6, d)), shine];
    case 'braid': {
      // Side-swept bangs, and a thick braid brought forward over one shoulder, tied with a bow.
      const out = [cap, lock(9, 6.4, 18.6, 15.2, 7.6, -2), lock(19.6, 6.6, 23.4, 14, 5.4, -0.8), lock(7, 8, 5.6, 20.4, 4.4, 1), lock(24.6, 8.4, 25.6, 19, 4, -1)];
      const bx = 24.8 + sway * 0.3;
      for (let k = 0; k < 5; k++) {
        const y = 20.6 + k * 2.5;
        const x = bx + (k % 2 ? 0.7 : -0.7) - k * 0.2;
        out.push(E(x, y, 2.3 - k * 0.12, 1.7, c), arc(x, y - 0.1, 2.2 - k * 0.12, 1.6, 20, 160, 0.5, d));
      }
      out.push(E(bx - 1, 33.6, 1.4, 1.8, c), ...bow(bx - 0.8, 32));
      out.push(shine);
      return out;
    }
    case 'drills':
      return [cap, lock(11, 7, 9.8, 14.4, 7, 0.8), lock(16, 6.6, 15.6, 15, 7.2, 0.2), lock(21, 7, 22.4, 14, 6.6, -0.8),
        lock(7.2, 8, 5.8, 17, 4.2, 1), lock(24.8, 8.4, 25.8, 16.4, 3.8, -1), ...bow(4.4, 9), ...bow(26.6, 9), shine];
    default: {
      const short = style === 'short' || style === 'curly';
      const side = short ? 20 : 23;
      const out = [cap];
      // Three big, soft bang locks and two side locks: simple shapes that read at a glance.
      for (const [x0, y0, x1, y1, w, bend] of [[11, 7, 9.8, 14.6, 7, 0.8], [16, 6.6, 15.6, 15.2, 7.2, 0.2], [21, 7, 22.4, 14.2, 6.6, -0.8]]) out.push(lock(x0, y0, x1, y1, w, bend));
      out.push(lock(7.2, 8, 5.6, side, 4.4, 1), lock(24.8, 8.4, 26.2, side - 1.4, 4, -1));
      out.push(shine);
      return out;
    }
  }
}

// A four-point sparkle, for star-shine eyes; it stays readable at small sizes.
function star(cx, cy, r, c) {
  const k = r * 0.28;
  return F(T([[cx, cy - r], [cx + k, cy - k], [cx + r, cy], [cx + k, cy + k], [cx, cy + r], [cx - k, cy + k], [cx - r, cy], [cx - k, cy - k]], c));
}

// Simple anime eyes: a tall dark oval with the eye color in its lower part, one big shine and a
// tiny one, and a thin lash on top. Styles only change the outline, lid, or shine. `out` is -1 for the far eye (its tick points back) and 1 for the near one.
const EYE_Y = 18.2;

// `lid` (0-1) lowers a lid over the top of the eye; `glance` shifts the iris sideways.
function eye(ex, out, style, color, mode, skin, lid = 0, glance = 0, shine = false) {
  const ey = EYE_Y;
  if (mode === 'blink') return [arc(ex, ey - 0.6, 2.2, 1.3, 20, 160, 0.8, INK)];
  if (mode === 'hurt') return [F(T([[ex - 1.8 * out, ey - 2], [ex + 1.8 * out, ey], [ex - 1.8 * out, ey + 2], [ex - 1.1 * out, ey]], INK))];
  if (mode === 'happy' || style === 'happy' || (style === 'wink' && out > 0)) return [arc(ex, ey + 1, 2.1, 1.8, 200, 340, 0.8, INK)];
  const big = style === 'big' ? 1.2 : style === 'round' ? 1.1 : 1;
  const rx = 1.9 * big;
  const ry = 2.6 * big;
  const gx = ex + glance * 0.5;
  const shapes = [
    // A dark oval with the eye color filling its lower part, one big shine and a tiny one.
    F(E(ex, ey, rx, ry, shade(color, -38))),
    F(E(gx, ey + ry * 0.3, rx * 0.86, ry * 0.62, color)),
    style === 'star' || shine ? star(gx - 0.3, ey - 0.7, shine ? 2 : 1.6, '#ffffff') : F(E(gx - rx * 0.35, ey - ry * 0.35, 0.9 * big, 1 * big, '#ffffff')),
    F(E(gx + rx * 0.4, ey + ry * 0.45, 0.4, 0.4, '#ffffff')),
  ];
  if (style === 'cat') shapes.push(F(R(ex - 0.25, ey - ry * 0.4, 0.5, ry * 1.1, shade(color, -55))));
  const lash = arc(ex, ey, rx + 0.3, ry + 0.2, 205, 335, 0.7, INK);
  if (style === 'sleepy') lid = Math.max(lid, 0.46);
  if (lid > 0) {
    const ly = ey - ry + 2 * ry * lid;
    shapes.push(F(T([[ex - rx - 0.5, ey - ry - 0.5], [ex + rx + 0.5, ey - ry - 0.5], [ex + rx + 0.5, ly], [ex - rx - 0.5, ly]], skin)));
    shapes.push(F(R(ex - rx - 0.3, ly - 0.4, rx * 2 + 0.6, 0.7, INK)));
    return shapes;
  }
  const flick = (lift) => F(T([[ex + out * (rx - 0.1), ey - ry * 0.6], [ex + out * (rx + 1), ey - ry * 0.6 - lift], [ex + out * (rx + 0.4), ey - ry * 0.3]], INK));
  if (style === 'cat') return [...shapes, lash, flick(1.3)];
  if (style === 'droopy') return [...shapes, lash, flick(-1)];
  return [...shapes, lash];
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

// An eyebrow over the eye at ex: `raise` lifts it, `tilt` drops its inner end (angry) or, when
// negative, lifts it (worried).
function brow(ex, side, raise, tilt, c) {
  const y = 14.4 - raise;
  return stroke([[ex - side * 1.5, y + tilt], [ex + side * 1.8, y - tilt * 0.6]], 0.8, c);
}

const LIP = '#b86a7c';
const MOUTH = '#b2506c';
const TONGUE = '#ff8fa8';
const MY = 21.7;

function mouthShapes(kind) {
  const x = FACE_X;
  switch (kind) {
    case 'open': return [F(E(x, 22.9, 1.1, 0.9, MOUTH)), F(E(x, 23.4, 0.6, 0.35, '#ff9fb8'))];
    case 'smirk': return [stroke([[x - 1.4, MY + 0.5], [x + 0.4, MY + 0.6], [x + 1.6, MY - 0.4]], 0.55, LIP)];
    case 'tongue': return [arc(x, MY, 1.4, 1.1, 20, 160, 0.55, LIP), F(E(x + 0.5, MY + 1.3, 0.75, 0.85, TONGUE)), F(R(x + 0.45, MY + 1, 0.15, 0.9, '#e86d8c'))];
    case 'bigtongue': return [F(T([[x - 1.6, MY + 0.2], [x + 1.6, MY + 0.2], [x + 1, MY + 1.4], [x - 1, MY + 1.4]], MOUTH)), F(E(x + 0.4, MY + 1.8, 0.9, 1.1, TONGUE))];
    case 'grin': return [F(T([[x - 2, MY - 0.2], [x + 2, MY - 0.2], [x + 1.4, MY + 1.4], [x, MY + 2], [x - 1.4, MY + 1.4]], MOUTH)), F(R(x - 1.7, MY - 0.2, 3.4, 0.6, '#ffffff')), F(E(x, MY + 1.4, 0.8, 0.4, '#ff9fb8'))];
    case 'pout': return [arc(x, MY + 0.9, 0.8, 0.7, 200, 340, 0.5, LIP), arc(x, MY + 0.9, 0.8, 0.7, 20, 160, 0.5, LIP)];
    case 'wavy': return [stroke([[x - 1.6, MY + 0.6], [x - 0.8, MY + 0.1], [x, MY + 0.6], [x + 0.8, MY + 0.1], [x + 1.6, MY + 0.6]], 0.5, LIP)];
    case 'flat': return [F(R(x - 1, MY + 0.4, 2, 0.5, LIP))];
    case 'cat': return [arc(x - 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.5, LIP), arc(x + 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.5, LIP)];
    case 'grit': return [F(R(x - 1.8, MY, 3.6, 1.5, MOUTH)), F(R(x - 1.5, MY + 0.3, 3, 0.9, '#ffffff')), F(R(x - 1.5, MY + 0.7, 3, 0.15, '#d9cde6'))];
    case 'yell': return [F(E(x, MY + 1, 1.8, 1.5, MOUTH)), F(E(x, MY + 1.8, 1, 0.6, '#ff9fb8'))];
    case 'tiny': return [arc(x, MY + 0.2, 0.8, 0.7, 25, 155, 0.5, LIP)];
    default: return [arc(x, MY, 1.3, 1.1, 25, 155, 0.55, LIP)];
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
      out.push(F(E(25.2, 12.6 + dy, 1, 1.2, '#9fdcff')), F(T([[24.4, 12.2 + dy], [26, 12.2 + dy], [25.2, 10.2 + dy]], '#9fdcff')), F(E(24.9, 12.4 + dy, 0.3, 0.4, '#ffffff')));
    } else if (e.startsWith('spark')) {
      const big = e === 'spark1';
      out.push(star(1.6, 6, big ? 2 : 1.3, '#ffe36b'), star(29.6, 9, big ? 1.3 : 2, '#ffe36b'), star(27.6, 2.4, big ? 1.4 : 0.9, '#ffffff'));
    } else if (e === 'note') {
      out.push(F(E(27.6, 7.4, 1, 0.8, INK)), F(R(28.3, 3, 0.5, 4.4, INK)), F(T([[28.3, 3], [30, 3.8], [30, 4.8], [28.8, 4.2]], INK)));
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
  const hair = look.hairColor ?? '#e9ebfa';
  const style = hairStyleOf(look);
  const eyeStyle = look.eyeStyle ?? 'sparkle';
  const eyeColor = look.eyeColor ?? '#4fcfb8';
  const hat = g.hat;
  const tucked = hat && TUCKS_HAIR.has(hat.design);
  const out = [];
  if (!tucked) out.push(...hairBack(style, hair, rig.hair, rig.hairLift).filter((sh) => !sh.hang));
  if (hat) out.push(...hatBackShapes(hat.design, hat.color));
  // Facing the screen: a round head with soft full cheeks, an ear peeking out on each side, big
  // eyes set low and wide apart, blush under each eye and a small mouth in the middle.
  for (const ex of [5.6, 25.4]) out.push(L(E(ex, 18, 1.8, 2.3, skin)), F(E(ex, 18.2, 0.7, 1.2, '#f4bfcb')));
  out.push(L(E(FACE_X, 15, 10.2, 9.8, skin)), L(E(FACE_X, 19, 9.4, 5.8, skin)));
  const f = rig.face ?? {};
  if (f.puff) for (const cx of [FACE_X - 7.6, FACE_X + 7.6]) out.push(L(E(cx, 20.8, 2.8, 2.6, skin)));
  // Eyes: hurt and blinks win over the expression; otherwise the expression may close one or
  // both eyes, lower the lids, or glance aside.
  [-1, 1].forEach((side, i) => {
    const mode = rig.eyes !== 'open' ? rig.eyes : f.closed?.[i] ? 'happy' : 'open';
    out.push(...eye(FACE_X + 4.3 * side, side, eyeStyle, eyeColor, mode, skin, f.lid ?? 0, f.glance ?? 0, f.shine));
  });
  const blush = f.blush ?? 1;
  for (const side of [-1, 1]) {
    const bx = FACE_X + 6.3 * side;
    out.push(F(E(bx, 21.8, 1.7 * blush, 0.7 * blush, blush > 1 ? '#f7a8bb' : '#f9c3cf')));
    if (blush > 1) for (const k of [-1, 0, 1]) out.push(stroke([[bx + k * 1 - 0.3, 22.4], [bx + k * 1 + 0.3, 21.2]], 0.4, '#e2788f'));
  }
  if (rig.eyes === 'hurt') out.push(F(E(FACE_X, 23, 1, 0.7, INK)));
  else out.push(...mouthShapes(rig.mouth === 'open' ? 'open' : f.mouth ?? 'smile'));
  if (!hat || hat.design !== 'bunny') out.push(...hairFront(style, hair, rig.hair, look.face ?? 'smile'));
  if (f.brows) {
    const bc = mix(shade(hair, -30), INK, 0.35);
    // The eye-cover lock hides that side's brow.
    [-1, 1].forEach((side, i) => (style === 'eyecover' && side > 0) || out.push(brow(FACE_X + 4.3 * side, side, f.brows[i][0], f.brows[i][1], bc)));
  }
  if (f.extra) out.push(...faceExtras(f.extra));
  if (style === 'twintails' && !tucked) out.push(...bow(3.6, 12), ...bow(27.4, 12));
  // An earring under each ear.
  if (g.earring) {
    const ring = offset(earringShapes(g.earring.design, g.earring.color), -1.6, 0);
    out.push(...ring, ...mirror(ring));
  }
  if (hat) out.push(...hatShapes(hat.design, hat.color));
  return out;
}

// ---------- Arms ----------

const UPPER_ARM = 5;
const FOREARM = 4.7;

// Shoulder to elbow in the sleeve color, then a forearm (bare unless the top has long sleeves).
// The elbow bends outward (away from the body's middle) to bring the hand to (hx, hy).
function arm(sx, sy, hx, hy, sleeve, long, g, skin) {
  const [[ex, ey], [wx, wy]] = reach(sx, sy, hx, hy, UPPER_ARM, FOREARM, sx < HEAD_X ? 1 : -1);
  return [
    E(sx, sy + 0.4, 2, 2, sleeve),
    limb(sx, sy, ex, ey, 4.2, 3.6, sleeve),
    E(ex, ey, 1.8, 1.8, long ? sleeve : skin),
    limb(ex, ey, wx, wy, 3.6, 3.1, long ? sleeve : skin),
    ...handShapes(wx, wy, g.gloves, skin),
  ];
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
function armShapes(sx, dx, dy, sleeve, long, g, skin) {
  const out = sx < HEAD_X ? -HAND_FORWARD : HAND_FORWARD;
  return arm(sx, SHOULDER_Y, sx + out + dx, HAND_Y + dy, sleeve, long, g, skin);
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

function bodyShapes(look, g, rig) {
  const skin = look.skinTone ?? '#fff0e6';
  const top = g.top;
  const sleeve = sleeveColor(top.design, top.color);
  const long = longSleeves(top.design);
  const legs = legLook(g.bottom.design, g.bottom.color, skin);
  if (rig.view === 'back') return backShapes(look, g, rig, skin, sleeve, legs);

  // Everything above the hips leans with tx and bobs with by; the hips also sink by however much
  // the planted legs need to reach the ground, and the legs hang from there.
  const drop = hipDrop(rig);
  const ux = rig.tx;
  const uy = rig.by + drop;
  const shapes = [];
  const hat = g.hat;
  let hang = [];
  if (!hat || !TUCKS_HAIR.has(hat.design)) {
    hang = hairBack(hairStyleOf(look), look.hairColor ?? '#e9ebfa', rig.hair, rig.hairLift).filter((sh) => sh.hang);
    hang = squash(offset(hang, ux + rig.hx, uy + rig.hy + NECK_LIFT), false);
  }
  if (g.cape) shapes.push(...offset(capeShapes(g.cape.design, g.cape.color, rig.cape, rig.flap), ux, uy));
  shapes.push(...legShapes(LEFT_LEG, legs, g.shoes, false, rig.backLeg, HIP_Y + drop));
  shapes.push(...legShapes(RIGHT_LEG, legs, g.shoes, false, rig.frontLeg, HIP_Y + drop));
  shapes.push(...offset(hipShapes(legs), ux * 0.5, drop + rig.by * 0.5));
  const skirt = skirtShapes(g.bottom.design, g.bottom.color);
  if (skirt) shapes.push(...offset(skirt, ux, uy));
  shapes.push(...offset([R(14.3, 22.6, 2.8, 4.8, shadowTone(skin))], ux, uy));
  shapes.push(...offset(topShapes(top.design, top.color), ux, uy));
  if (g.cape) shapes.push(...offset(capeFrontShapes(g.cape.design, g.cape.color), ux, uy));
  shapes.push(...offset(armShapes(BACK_SHOULDER, rig.backArm[0], rig.backArm[1], sleeve, long, g, skin), ux, uy));
  // Out of combat the weapon arm is part of the body too, so it has no outline across the torso.
  if (rig.armIn) shapes.push(...offset(armShapes(FRONT_SHOULDER, rig.frontArm[0], rig.frontArm[1], sleeve, long, g, skin), ux, uy));
  // The head rides the squashed body, so it moves by the squashed bob.
  const head = offset(headShapes(look, g, rig), squashX(15.5 + ux) - 15.5 + rig.hx, uy * KY + rig.hy + NECK_LIFT);
  return move([...hang, ...squash(shapes), ...head], 0, 0);
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
  const long = longSleeves(g.top.design);
  const body = [];
  const out = [];
  body.push(...legShapes(12, legs, g.shoes, true, [0, a > 0 ? -a * 1.6 : 0, 0]));
  body.push(...legShapes(15.6, legs, g.shoes, false, [0, a < 0 ? a * 1.6 : 0, 0]));
  body.push(...hipShapes(legs));
  body.push(...topShapes('tee', g.top.color));
  if (g.cape && g.cape.design !== 'fairy' && g.cape.design !== 'angel') body.push(T([[8.6, 26], [22.4, 26], [26, 46], [5, 46]], g.cape.color), R(5, 45, 21, 1.2, shade(g.cape.color, -20)));
  if (!g.hat || !TUCKS_HAIR.has(g.hat.design)) {
    const back = hairBack(style, hair, 0, 0);
    out.push(...squash(back.filter((sh) => sh.hang), false), ...back.filter((sh) => !sh.hang));
  }
  out.push(E(HEAD_X, 13.6, 12, 11.2, hair), E(HEAD_X, 20.4, 9.8, 4, hair));
  out.push(arc(HEAD_X, 10, 9, 5.6, 210, 330, 1.1, mix(hair, '#ffffff', 0.45)));
  if (g.hat) out.push(...hatBackShapes(g.hat.design, g.hat.color), ...hatShapes(g.hat.design, g.hat.color));
  // Arms reach up past the head to grip the rope, hand over hand.
  const arms = [...arm(11.3, 27.6, 13, 3 + a, sleeve, long, g, skin), ...arm(19.2, 27.6, 18, 3 - a, sleeve, long, g, skin)];
  if (g.cape?.design === 'fairy' || g.cape?.design === 'angel') {
    const wing = capeShapes(g.cape.design, g.cape.color, 0, rig.flap);
    arms.push(...wing);
  }
  return move([...squash(body), ...out, ...squash(arms)], 0, 0);
}

// ---------- Pose solving ----------

// Walk cycle: frames per two steps. Each foot spends 60% of the cycle planted, sliding back from
// heel strike (toe up) to toe-off (heel rolling up); then the heel kicks up behind, the knee
// swings through, and the foot reaches forward to land again. The body sinks a little whenever the
// planted feet are spread, and the arms counter-swing with a soft elbow.
const WALK_FRAMES = 24;
const HALF_STRIDE = 7.5;
const KICK = 6;
const STANCE = 0.6;
const LEG = THIGH + SHIN;
const REST_LEG = ANKLE_Y - HIP_Y;

// Ankle offset and foot tilt for one leg at walk phase p (0 = heel strike).
function walkLeg(p) {
  if (p < STANCE) {
    const u = p / STANCE;
    const roll = u > 0.7 ? (u - 0.7) / 0.3 : 0;
    const tilt = u < 0.15 ? 16 * (1 - u / 0.15) : -30 * roll;
    return [HALF_STRIDE - 2 * HALF_STRIDE * u, -1.6 * roll, tilt];
  }
  const v = (p - STANCE) / (1 - STANCE);
  return [-HALF_STRIDE + 2 * HALF_STRIDE * (0.5 - 0.5 * Math.cos(Math.PI * v)), -KICK * Math.sin(Math.PI * v ** 0.7), -30 * (1 - v) ** 2 + 14 * v ** 3];
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
    frontLeg: [0.8, 0, 0], backLeg: [-0.8, 0, 0], frontArm: [0, 0], backArm: [0, 0], air: false, squat: 0,
    hair: 0, hairLift: 0, cape: 0, flap: false, eyes: 'open', mouth: null, climb: 0,
  };
}

function solveRig(state, anim, mv = null) {
  const { pose = 'idle', time = 0, hurt = false, seed = 0 } = state;
  const r = baseRig();
  const t = time + seed * 1.37;
  r.hair = Math.round((anim ? Math.max(-3, Math.min(3, anim.hair)) : Math.sin(t * 1.3) * 0.6) * 2) / 2;
  r.cape = anim ? Math.round(Math.max(-4, Math.min(4, anim.cape))) : Math.round(Math.sin(t * 1.1) * 0.8);
  r.flap = Math.floor(t * (pose === 'jump' ? 10 : 4)) % 2 === 0;
  // A blink every few seconds, slightly offset per character.
  const cycle = (t * 0.31) % 1;
  if (cycle < 0.035 || (cycle > 0.5 && cycle < 0.53 && seed % 2 === 0)) r.eyes = 'blink';

  if (pose === 'climb') {
    r.view = 'back';
    const f = Math.floor(((anim ? anim.climb : t * 20) / 10) % 4 + 4) % 4;
    r.climb = [2, 0, -2, 0][f];
    return r;
  }

  if (pose === 'walk') {
    const phase = anim ? walkPhase(anim) : (t * 0.9) % 1;
    const p = (Math.round(phase * WALK_FRAMES) % WALK_FRAMES) / WALK_FRAMES;
    const front = walkLeg(p);
    const back = walkLeg((p + 0.5) % 1);
    r.frontLeg = legKey(front);
    r.backLeg = legKey(back);
    // Each arm swings against the leg on its side; the hand lifts at the ends of the swing.
    const hand = ([dx]) => [q(-0.45 * dx), q(-0.5 * (dx / HALF_STRIDE) ** 2)];
    r.frontArm = hand(front);
    r.backArm = hand(back);
    r.hy = q(0.3 * Math.sin(4 * Math.PI * p - 1));
    r.tx = q(0.6);
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
  } else {
    // Idle breathing: the upper body eases down a pixel on each exhale, the arms follow.
    r.by = q(0.5 + 0.5 * Math.sin(t * 2.4));
    r.frontArm = [0, r.by];
    r.backArm = [0, r.by];
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

  if (hurt) {
    r.tx = -1;
    r.hx = -1;
    r.eyes = 'hurt';
    r.frontArm = [-1, -2];
    r.backArm = [-2, -2];
  }

  // Attack and skill moves shape the body on top of everything else.
  if (mv) mv.rig?.(r);
  return r;
}

function rigKey(r) {
  return [r.view, r.tx, r.by, r.hx, r.hy, ...r.frontLeg, ...r.backLeg, ...r.backArm, r.armIn ? r.frontArm.join(',') : '-', r.air ? 1 : 0, r.squat, r.hair, r.hairLift, r.cape, r.flap ? 1 : 0, r.eyes, r.mouth, r.climb, r.face ? JSON.stringify(r.face) : ''].join(',');
}

// ---------- Weapons ----------

function weaponSprite(w, time) {
  const frames = weaponFrames(w.type, w.tier, w.theme);
  const frame = frames > 1 ? Math.floor(time * 9) % frames : 0;
  const def = weaponShapes(w.type, w.tier, frame, w.theme);
  if (!def) return null;
  const s = sprite(`weapon|${w.type}|${w.tier}|${w.theme}|${frame}`, () => ({ w: def.w, h: def.h, shapes: def.shapes }));
  return { ...s, grip: def.grip, blade: def.blade, live: def.live };
}

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
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) ctx.drawImage(glow, ox + dx * scale, oy + dy * scale, wpn.canvas.width * scale, wpn.canvas.height * scale);
  ctx.globalAlpha = base;
}

// Rarity effects drawn in the weapon's rotated frame (grip at the origin, tip toward -y).
// Rare: a glint sweeps up the weapon. Epic: a glowing outline and motes circling the tip.
// Legendary: a stronger pulsing aura and sparkles rising off the whole weapon.
function weaponGlow(ctx, wpn, rarity, time, scale, draw) {
  const color = RARITIES[rarity].color;
  const ox = -(wpn.grip[0] + 1) * scale;
  const oy = -(wpn.grip[1] + 1) * scale;
  const w = wpn.canvas.width * scale;
  const h = wpn.canvas.height * scale;
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
    case 'claw': {
      // Flexes the claws, with a quick jab every few seconds.
      const p = at(3.5);
      const jab = bump(p, 0.78, 0.9);
      return { arm: [4 * jab, -1.5 * jab], angle: 100 + Math.sin(t * 6) * 6 - 15 * jab };
    }
    default:
      return null;
  }
}

// Draws a hero. Advanced jobs (state.job) get an idle aura that fades in while standing still,
// layered behind and in front of the sprite.
export function drawHero(ctx, look, gear, x, y, state, anim = null) {
  const job = AURA_JOBS.has(state.job) ? state.job : null;
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
  const mv = moveAt(POSE_MOVES[pose] ?? pose, state.progress ?? 0, state.dur ?? 0.35);
  if (!mv || (!mv.lift && !mv.lunge && !mv.tilt && mv.turn === 1 && mv.stretch === 1)) {
    paintHero(ctx, look, gear, x, y, state, anim, mv);
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
  paintHero(ctx, look, gear, x, y, state, anim, mv);
  ctx.restore();
}

function paintHero(ctx, look, gear, x, y, state, anim, mv) {
  const { pose = 'idle', facing = 1, alpha = 1, scale = 1 } = state;
  const attack = Boolean(mv);
  const g = resolveGear(look, gear);
  const rig = solveRig(state, anim, mv);
  rig.armIn = !attack;
  const idleW = !attack && pose === 'idle' && g.weapon && rig.view !== 'back' ? weaponIdle(g.weapon.type, (state.time ?? 0) + (state.seed ?? 0) * 1.37) : null;
  if (idleW) rig.frontArm = [rig.frontArm[0] + q(idleW.arm[0]), rig.frontArm[1] + q(idleW.arm[1])];
  if (rig.view !== 'back') rig.face = faceFrame(look.face ?? 'smile', (state.time ?? 0) + (state.seed ?? 0) * 1.37);
  const lookKey = JSON.stringify(look);
  const gk = gearKey(gear);
  const body = sprite(`hero|${lookKey}|${gk}|${rigKey(rig)}`, () => ({ w: W, h: H, shapes: bodyShapes(look, g, rig), res: RES, soft: 'cel', crisp: true }));

  const flip = facing < 0;
  const left = x - (W / 2) * scale;
  const top = y - H * scale;
  // Mirror a point given in body coordinates when facing left.
  const sx = (px) => (flip ? left + (W - (px + OX)) * scale : left + (px + OX) * scale);
  const sy = (py) => top + (py + OY) * scale;

  const skin = look.skinTone ?? '#fff0e6';
  const sleeve = sleeveColor(g.top.design, g.top.color);
  const long = longSleeves(g.top.design);
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
    armShapesNow = armShapes(FRONT_SHOULDER, rig.frontArm[0], rig.frontArm[1], sleeve, long, g, skin);
    hand = [FRONT_SHOULDER + HAND_FORWARD + rig.frontArm[0] + rig.tx, HAND_Y + rig.frontArm[1] + bodyY];
    armKey = `r${rig.frontArm.join(',')}`;
  }
  const armDx = rig.tx;
  const armDy = bodyY;

  const restAngle = { crossbow: 55, claw: 100 }[g.weapon?.type] ?? 25;
  let weaponAngle = angles ? angles.weapon : idleW ? idleW.angle : restAngle + rig.frontArm[0] * 4 + (pose === 'jump' ? -15 : 0);

  // The hand was placed on the full-size figure; carry it into the squashed body.
  hand = [squashX(hand[0]), squashY(hand[1])];

  // Weapon size relative to the hero (they are drawn big on purpose).
  const ws = scale * WEAPON_SCALE;
  const drawWeapon = () => {
    if (!wpn) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(sx(hand[0])), Math.round(sy(hand[1]) - (idleW?.toss ?? 0) * scale));
    if (flip) ctx.scale(-1, 1);
    ctx.rotate((weaponAngle * Math.PI) / 180);
    const time = state.time ?? 0;
    const paint = (ox, oy, w, h) => ctx.drawImage(wpn.canvas, ox, oy, w, h);
    const el = g.weapon.element;
    if (el) elementGlow(ctx, wpn, el, time, ws);
    if (g.weapon.rarity) weaponGlow(ctx, wpn, g.weapon.rarity, time, ws, paint);
    else paint(-(wpn.grip[0] + 1) * ws, -(wpn.grip[1] + 1) * ws, wpn.canvas.width * ws, wpn.canvas.height * ws);
    if (el && wpn.blade) drawElementAura(ctx, el, (wpn.blade[0] - wpn.grip[1]) * ws, (wpn.blade[1] - wpn.grip[1]) * ws, time, ws);
    wpn.live?.(ctx, time, ws, wpn.grip);
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
  if (rig.view === 'back') return;
  if (!attack) {
    if (!wpn) return;
    drawWeapon();
    const grip = sprite(`grip|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(squash(armShapesNow.slice(4)), 0, 0), res: RES, soft: 'cel', crisp: true }));
    blit(ctx, grip, left + (flip ? -armDx : armDx) * KX * scale, top + armDy * KY * scale, { flip, flash: state.flash ?? 0, alpha, scale });
    if (idleW?.sparkle) idleSparkle(ctx, sx(hand[0]), sy(hand[1]), weaponAngle, (wpn.grip[1] - 4) * ws, flip, state.time ?? 0, scale);
    return;
  }
  drawWeapon();
  const arm = sprite(`arm|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(squash(armShapesNow), 0, 0), res: RES, soft: 'cel', crisp: true }));
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
