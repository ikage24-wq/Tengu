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
  hatBackShapes, TUCKS_HAIR, capeShapes, handShapes, earringShapes, limb, reach, THIGH, SHIN, HIP_Y, ANKLE_Y,
} from './gear.js';
import { weaponShapes, weaponFrames } from './weapons.js';
import { drawElementAura, ELEMENTS } from './elements.js';
import { walkPhase } from './animator.js';

export const HAIR_STYLES = ['bob', 'wavy', 'twintails', 'ponytail', 'short', 'curly', 'bun', 'long'];
// Spiky hair was retired; old saves that used it get soft curls instead.
const hairStyleOf = (look) => (look.hairStyle === 'spiky' ? 'curly' : look.hairStyle ?? 'bob');
export const EYE_STYLES = ['sparkle', 'round', 'happy', 'sleepy', 'cat', 'droopy', 'star', 'wink', 'big'];

// Parts are designed on a 30x56 figure with feet at y 56, then everything below the neck is
// squashed into a small, slim chibi body under the same big head: heights shrink to KY and (for
// the body) widths to KX around the center line. The sprite box adds room for hats, ears, and
// wings, and its bottom edge is the soles.
const NECK = 24;
const KY = 0.56;
const KX = 0.74;
const OX = 6;
const OY = 11;
const W = 30 + OX * 2;
const H = Math.ceil(NECK + (56 - NECK) * KY) + OY;
const INK = '#3a2d4f';
// Detail cells per art pixel for character sprites (drawn crisp, like pixel art), and rounding of
// rig offsets to that grid.
const RES = 2;
const q = (v) => Math.round(v * RES) / RES;

const move = (shapes, dx, dy) => shapes.map((s) => (s ? { ...s, x: s.x + dx + OX, y: s.y + dy + OY } : s));

// ---------- Gear lookup ----------

function resolveGear(look, gear) {
  const outfit = look.outfitColor ?? '#ffc2d6';
  const piece = (slot, design, color) => {
    const inst = gear?.[slot];
    if (!inst) return design ? { design, color } : null;
    const def = ITEMS[inst.id];
    return { design: def.design ?? design, color: def.color };
  };
  const w = gear?.weapon ? ITEMS[gear.weapon.id] : null;
  return {
    top: piece('top', 'tee', outfit),
    bottom: piece('bottom', 'pants', shade(outfit, -22)),
    shoes: piece('shoes', 'sneakers', '#fffaf0'),
    hat: piece('hat', null),
    cape: piece('cape', null),
    gloves: piece('gloves', null),
    earring: piece('earring', null),
    weapon: w ? { type: w.weaponType, color: w.color, tier: w.tier, element: w.element ?? null, rarity: gear.weapon.rarity ?? 0 } : null,
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
    default: return [crown];
  }
}

// Bangs: a rounded cap over the forehead that ends in five soft points just above the eyes,
// slim side locks framing the face (leaving room to see it), two gentle lock separations in a
// slightly deeper tone, and one clean shine band with a couple of glints.
function hairFront(style, c) {
  const l = mix(c, '#ffffff', 0.45);
  const short = style === 'short' || style === 'curly';
  const side = short ? 20 : 23;
  const out = [C(E(HEAD_X, 7.8, 11.8, 5, c))];
  // Three big, soft bang locks and two side locks: simple shapes that read at a glance.
  for (const [x0, y0, x1, y1, w, bend] of [[11, 7, 9.8, 14.6, 7, 0.8], [16, 6.6, 15.6, 15.2, 7.2, 0.2], [21, 7, 22.4, 14.2, 6.6, -0.8]]) out.push(C(curvedLock(x0, y0, x1, y1, w, bend, c)));
  out.push(C(curvedLock(7.2, 8, 5.6, side, 4.4, 1, c)), C(curvedLock(24.8, 8.4, 26.2, side - 1.4, 4, -1, c)));
  out.push(arc(HEAD_X, 9.6, 8.6, 5.2, 215, 325, 1.3, l));
  return out;
}

// A four-point sparkle, for star-shine eyes; it stays readable at small sizes.
function star(cx, cy, r, c) {
  const k = r * 0.28;
  return F(T([[cx, cy - r], [cx + k, cy - k], [cx + r, cy], [cx + k, cy + k], [cx, cy + r], [cx - k, cy + k], [cx - r, cy], [cx - k, cy - k]], c));
}

// Simple anime eyes: a tall dark oval with the eye color in its lower part, one big shine and a
// tiny one, and a thin lash on top. Styles only change the outline, lid, or shine. `out` is -1 for the far eye (its tick points back) and 1 for the near one.
const EYE_Y = 18.2;

function eye(ex, out, style, color, mode, skin) {
  const ey = EYE_Y;
  if (mode === 'blink') return [arc(ex, ey - 0.6, 2.2, 1.3, 20, 160, 0.8, INK)];
  if (mode === 'hurt') return [F(T([[ex - 1.8 * out, ey - 2], [ex + 1.8 * out, ey], [ex - 1.8 * out, ey + 2], [ex - 1.1 * out, ey]], INK))];
  if (mode === 'happy' || style === 'happy' || (style === 'wink' && out > 0)) return [arc(ex, ey + 1, 2.1, 1.8, 200, 340, 0.8, INK)];
  const big = style === 'big' ? 1.2 : style === 'round' ? 1.1 : 1;
  const rx = 1.9 * big;
  const ry = 2.6 * big;
  const shapes = [
    // A dark oval with the eye color filling its lower part, one big shine and a tiny one.
    F(E(ex, ey, rx, ry, shade(color, -38))),
    F(E(ex, ey + ry * 0.3, rx * 0.86, ry * 0.62, color)),
    style === 'star' ? star(ex - 0.3, ey - 0.7, 1.6, '#ffffff') : F(E(ex - rx * 0.35, ey - ry * 0.35, 0.9 * big, 1 * big, '#ffffff')),
    F(E(ex + rx * 0.4, ey + ry * 0.45, 0.4, 0.4, '#ffffff')),
  ];
  if (style === 'cat') shapes.push(F(R(ex - 0.25, ey - ry * 0.4, 0.5, ry * 1.1, shade(color, -55))));
  const lash = arc(ex, ey, rx + 0.3, ry + 0.2, 205, 335, 0.7, INK);
  if (style === 'sleepy') {
    shapes.push(F(T([[ex - rx - 0.5, ey - ry - 0.5], [ex + rx + 0.5, ey - ry - 0.5], [ex + rx + 0.5, ey - 0.2], [ex - rx - 0.5, ey - 0.2]], skin)));
    shapes.push(F(R(ex - rx - 0.3, ey - 0.6, rx * 2 + 0.6, 0.7, INK)));
    return shapes;
  }
  const flick = (lift) => F(T([[ex + out * (rx - 0.1), ey - ry * 0.6], [ex + out * (rx + 1), ey - ry * 0.6 - lift], [ex + out * (rx + 0.4), ey - ry * 0.3]], INK));
  if (style === 'cat') return [...shapes, lash, flick(1.3)];
  if (style === 'droopy') return [...shapes, lash, flick(-1)];
  return [...shapes, lash];
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
  out.push(...eye(FACE_X - 4.3, -1, eyeStyle, eyeColor, rig.eyes, skin), ...eye(FACE_X + 4.3, 1, eyeStyle, eyeColor, rig.eyes, skin));
  out.push(F(E(FACE_X - 6.3, 21.8, 1.7, 0.7, '#f9c3cf')), F(E(FACE_X + 6.3, 21.8, 1.7, 0.7, '#f9c3cf')));
  if (rig.eyes === 'hurt') out.push(F(E(FACE_X, 23, 1, 0.7, INK)));
  else if (rig.mouth === 'open') out.push(F(E(FACE_X, 22.9, 1.1, 0.9, '#b2506c')), F(E(FACE_X, 23.4, 0.6, 0.35, '#ff9fb8')));
  else out.push(arc(FACE_X, 21.7, 1.3, 1.1, 25, 155, 0.55, '#b86a7c'));
  if (!hat || hat.design !== 'bunny') out.push(...hairFront(style, hair));
  if (style === 'twintails' && !tucked) out.push(...bow(3.6, 12), ...bow(27.4, 12));
  if (g.earring) out.push(...earringShapes(g.earring.design, g.earring.color));
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
const LEFT_LEG = 10.8;
const RIGHT_LEG = 17.2;

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
  shapes.push(...offset(armShapes(BACK_SHOULDER, rig.backArm[0], rig.backArm[1], sleeve, long, g, skin), ux, uy));
  // The head rides the squashed body, so it moves by the squashed bob.
  const head = offset(headShapes(look, g, rig), squashX(15.5 + ux) - 15.5 + rig.hx, uy * KY + rig.hy + NECK_LIFT);
  return move([...hang, ...squash(shapes), ...head], 0, 0);
}

const offset = (shapes, dx, dy) => shapes.map((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));

// The head sits this far above where it would rest on the shoulders, so a short neck shows and
// the figure stands upright instead of hunching.
const NECK_LIFT = 0;

const squashY = (y) => (y <= NECK ? y : NECK + (y - NECK) * KY);
const squashX = (x) => 15.5 + (x - 15.5) * KX;
function squash(shapes, narrow = true) {
  const fx = (x) => (narrow ? squashX(x) : x);
  return shapes.map((sh) => {
    if (sh.t === 'p') return { ...sh, x: 0, y: 0, pts: sh.pts.map(([px, py]) => [fx(sh.x + px), squashY(sh.y + py)]) };
    if (sh.t === 'e') return { ...sh, x: fx(sh.x), y: squashY(sh.y), rx: sh.rx * (narrow ? KX : 1), ry: sh.ry * (sh.y > NECK ? KY : 1) };
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
  if (g.cape && g.cape.design !== 'fairy' && g.cape.design !== 'angel') body.push(T([[10.6, 26.6], [20, 26.6], [21, 46], [9.6, 46]], g.cape.color), R(9.6, 45, 11.4, 1, shade(g.cape.color, -20)));
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
    arms.push(...wing, ...wing.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [31 - px, py]) } : { ...s, x: 31 - s.x - (s.w ?? 0) })));
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

function solveRig(state, anim) {
  const { pose = 'idle', time = 0, progress = 0, hurt = false, seed = 0 } = state;
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

  if (pose === 'swing') {
    if (progress < 0.3) {
      // Anticipation: lean back and wind up.
      r.tx = -1;
      r.by = 0;
      r.backArm = [-2, -1];
    } else if (progress < 0.7) {
      // The strike: lunge forward and dip.
      r.tx = 2;
      r.squat = 1;
      r.frontLeg = [3.6, 0, 4];
      r.backLeg = [-3, 0, -10];
      r.backArm = [-3, -1];
      r.mouth = 'open';
    } else {
      r.tx = 1;
      r.frontLeg = [2.4, 0, 0];
      r.backLeg = [-1.6, 0, 0];
    }
  } else if (pose === 'shoot') {
    r.tx = progress < 0.25 ? -1 : 0;
    r.frontLeg = [2.6, 0, 0];
    r.backLeg = [-2.6, 0, 0];
    r.backArm = [2, -3];
  } else if (pose === 'cast') {
    // Rise on tiptoe with the free arm open; hair and cape lift in the magic wind.
    r.by = progress > 0.2 && progress < 0.8 ? -1 : 0;
    r.backArm = [-2, -4];
    r.hairLift = -1;
    r.cape = r.cape - 2;
    r.mouth = 'open';
  }
  return r;
}

function rigKey(r) {
  return [r.view, r.tx, r.by, r.hx, r.hy, ...r.frontLeg, ...r.backLeg, ...r.backArm, r.air ? 1 : 0, r.squat, r.hair, r.hairLift, r.cape, r.flap ? 1 : 0, r.eyes, r.mouth, r.climb].join(',');
}

// ---------- Weapons ----------

function weaponSprite(w, time) {
  const frames = weaponFrames(w.type, w.tier);
  const frame = frames > 1 ? Math.floor(time * 9) % frames : 0;
  const def = weaponShapes(w.type, w.color, w.tier, null, frame);
  if (!def) return null;
  const s = sprite(`weapon|${w.type}|${w.tier}|${frame}`, () => ({ w: def.w, h: def.h, shapes: def.shapes }));
  return { ...s, grip: def.grip, blade: def.blade };
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

// Weapon angle (degrees, 0 = up, positive tips forward) and attack arm angle for a pose.
function weaponPose(type, pose, progress) {
  if (pose === 'swing') {
    if (progress < 0.3) {
      const t = ease(progress / 0.3);
      return { weapon: 25 - 110 * t, arm: 40 + 125 * t };
    }
    const t = ease(Math.min(1, (progress - 0.3) / 0.35));
    return { weapon: -85 + 235 * t, arm: 165 - 120 * t };
  }
  if (pose === 'shoot') {
    const pull = progress < 0.25 ? -6 : 0;
    return { weapon: type === 'bow' || type === 'crossbow' ? 0 : 90, arm: 95 + pull };
  }
  if (pose === 'cast') return { weapon: -25 + ease(Math.min(1, progress * 1.6)) * 35, arm: 150 };
  return null;
}

// ---------- Public drawing ----------

// look: appearance; gear: equipment map or null.
// state: { pose, time, facing, progress, hurt, flash, alpha, scale, seed, vy }; anim: from createAnim().
// (x, y) is the character's feet center in screen space.
export function drawHero(ctx, look, gear, x, y, state, anim = null) {
  const { pose = 'idle', facing = 1, progress = 0, alpha = 1, scale = 1 } = state;
  const attack = pose === 'swing' || pose === 'shoot' || pose === 'cast';
  const g = resolveGear(look, gear);
  const rig = solveRig(state, anim);
  const lookKey = JSON.stringify(look);
  const gk = gearKey(gear);
  const body = sprite(`hero|${lookKey}|${gk}|${rigKey(rig)}`, () => ({ w: W, h: H, shapes: bodyShapes(look, g, rig), res: RES, soft: true, crisp: true }));

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
  const angles = attack ? weaponPose(g.weapon?.type, pose, progress) : null;

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

  const restAngle = { crossbow: 10, claw: 70 }[g.weapon?.type] ?? 25;
  let weaponAngle = angles ? angles.weapon : restAngle + rig.frontArm[0] * 4 + (pose === 'jump' ? -15 : 0);
  // Bows grip in the middle, so out of combat they're slung across the back instead of held.
  if (!angles && g.weapon?.type === 'bow') {
    hand = [14 + rig.tx, 30 + bodyY];
    weaponAngle = 112 + rig.by * 2;
  }

  // The hand was placed on the full-size figure; carry it into the squashed body.
  hand = [squashX(hand[0]), squashY(hand[1])];

  const drawWeapon = () => {
    if (!wpn) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(sx(hand[0])), Math.round(sy(hand[1])));
    if (flip) ctx.scale(-1, 1);
    ctx.rotate((weaponAngle * Math.PI) / 180);
    const time = state.time ?? 0;
    const paint = (ox, oy, w, h) => ctx.drawImage(wpn.canvas, ox, oy, w, h);
    const el = g.weapon.element;
    if (el) elementGlow(ctx, wpn, el, time, scale);
    if (g.weapon.rarity) weaponGlow(ctx, wpn, g.weapon.rarity, time, scale, paint);
    else paint(-(wpn.grip[0] + 1) * scale, -(wpn.grip[1] + 1) * scale, wpn.canvas.width * scale, wpn.canvas.height * scale);
    if (el && wpn.blade) drawElementAura(ctx, el, (wpn.blade[0] - wpn.grip[1]) * scale, (wpn.blade[1] - wpn.grip[1]) * scale, time, scale);
    ctx.restore();
  };

  // Weapon trail: remember where the tip was during a swing, drawn as a fading ribbon.
  if (anim && wpn && pose === 'swing' && progress > 0.28 && progress < 0.75) {
    const len = (wpn.grip[1] - 6) * scale;
    const rad = (weaponAngle * Math.PI) / 180;
    const tipX = sx(hand[0]) + Math.sin(rad) * len * (flip ? -1 : 1);
    const tipY = sy(hand[1]) - Math.cos(rad) * len;
    anim.trail.push({ dx: tipX - x, dy: tipY - y, hx: sx(hand[0]) - x, hy: sy(hand[1]) - y, age: 0 });
  }
  if (anim && anim.trail.length > 1) drawTrail(ctx, anim.trail, x, y, g.weapon?.color ?? '#ffffff');

  if (wpn && !attack && rig.view !== 'back') drawWeapon();
  blit(ctx, body, left, top, { flip, flash: state.flash ?? 0, alpha, scale });
  if (rig.view === 'back') return;
  if (attack) drawWeapon();
  const arm = sprite(`arm|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(squash(armShapesNow), 0, 0), res: RES, soft: true, crisp: true }));
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
