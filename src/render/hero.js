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
import { R, E, T, F, C, sprite, blit, shade, tinted } from './pixel.js';
import {
  topShapes, sleeveColor, longSleeves, legLook, hipShapes, skirtShapes, legShapes, hatShapes,
  hatBackShapes, TUCKS_HAIR, capeShapes, handShapes, earringShapes, limb, reach, THIGH, SHIN, HIP_Y, ANKLE_Y,
} from './gear.js';
import { weaponShapes, weaponFrames } from './weapons.js';
import { drawElementAura, ELEMENTS } from './elements.js';
import { walkPhase } from './animator.js';

export const HAIR_STYLES = ['bob', 'wavy', 'twintails', 'ponytail', 'short', 'spiky', 'bun', 'long'];
export const EYE_STYLES = ['sparkle', 'round', 'happy', 'sleepy'];

// Body coordinates are a 30x56 anime chibi with feet at y 56; the sprite box adds room for hats,
// ears, and wings.
const OX = 6;
const OY = 11;
const W = 30 + OX * 2;
const H = 56 + OY;
const INK = '#3a2d4f';
// Detail cells per art pixel for character sprites, and rounding of rig offsets to that grid.
const RES = 3;
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

const RIBBON = '#ff9ec0';

// Hair that hangs below the head bends with the hair spring: the lower a point, the more it sways.
function swayShape(shape, sway, lift) {
  const bend = (py) => Math.max(0, Math.min(1, (py - 14) / 16));
  if (shape.t === 'p') {
    return { ...shape, pts: shape.pts.map(([px, py]) => [px + q(sway * bend(shape.y + py)), py + (shape.y + py >= 22 ? lift : 0)]) };
  }
  return { ...shape, x: shape.x + q(sway * bend(shape.y)), y: shape.y + (shape.y >= 22 ? lift : 0) };
}

// Hair behind the head: the crown's volume plus whatever hangs down (tails, long hair, curls),
// which is flagged `hang` so the body can be drawn over it.
function hairBack(style, front, sway, lift) {
  // Hair behind the head sits a little in shadow, so the bangs stand out in front of it.
  const c = shade(front, -6);
  const d = shade(c, -14);
  const cap = E(15.5, 12.8, 12.6, 11.6, c);
  const crown = E(15.5, 12.6, 12, 10.8, c);
  // Everything that sways hangs below the head and is drawn behind the body.
  const sw = (shapes) => shapes.map((sh) => ({ ...swayShape(sh, sway, lift), hang: true }));
  switch (style) {
    case 'bob': return [cap, ...sw([
      E(15.5, 15.6, 13.4, 11.4, c),
      T([[2.4, 14], [7.6, 14], [8, 25], [4.6, 24.4], [1.4, 26.6], [2, 21]], c),
      T([[23.6, 14], [28.8, 14], [29.6, 21], [30.2, 26.4], [27, 24.4], [23.6, 25]], c),
    ])];
    case 'wavy': return [cap, ...sw([
      T([[2.4, 12], [28.8, 12], [29.6, 22], [28, 30], [30, 36], [26.6, 41], [22, 37], [18, 41.6], [13.6, 37.6], [9.4, 41.6], [5, 37], [1.4, 36], [3.4, 30], [1.6, 22]], c),
      E(3.4, 28, 2.6, 4, c), E(27.8, 28, 2.6, 4, c), E(3, 36, 2.4, 3.4, c), E(28.2, 36, 2.4, 3.4, c),
      F(T([[6, 24], [6.8, 24], [5.4, 33], [4.8, 33]], d)), F(T([[25, 24], [25.8, 24], [26.6, 33], [26, 33]], d)),
    ])];
    case 'long': return [cap, ...sw([
      T([[2.8, 12], [28.4, 12], [29, 26], [28, 38], [24.6, 44], [22.6, 39], [19, 45], [15.6, 40], [12.2, 45], [8.6, 39], [6.6, 44], [3.2, 38], [2.2, 26]], c),
      F(T([[7, 22], [7.7, 22], [7, 38], [6.4, 38]], d)), F(T([[24, 22], [24.7, 22], [25.4, 38], [24.8, 38]], d)),
    ])];
    case 'twintails': return [cap, ...sw([
      T([[3.2, 10], [7, 12.4], [6.6, 22], [5, 31], [2.4, 37.6], [-0.6, 31], [-1.6, 21], [-0.4, 13.4]], c),
      T([[27.8, 10], [31.6, 13.4], [32.8, 21], [32, 31], [29.2, 37.6], [26.6, 31], [25, 22], [24.4, 12.4]], c),
      F(T([[2, 18], [2.7, 18], [2.2, 30], [1.6, 30]], d)), F(T([[29, 18], [29.7, 18], [30.2, 30], [29.6, 30]], d)),
    ]), E(3.4, 10.8, 2, 1.5, RIBBON), E(27.6, 10.8, 2, 1.5, RIBBON)];
    case 'ponytail': return [cap, ...sw([
      T([[1.6, 6.4], [6.6, 7.6], [5.6, 16], [3.8, 26], [1.8, 34.4], [-0.8, 27], [-1.8, 17], [-0.8, 10]], c),
      F(T([[1.6, 14], [2.3, 14], [1, 27], [0.4, 27]], d)),
    ]), E(3.6, 7.6, 1.8, 1.6, '#ffd66b')];
    case 'short': return [crown];
    case 'spiky': return [crown,
      T([[3, 9], [-1.6, 3.6], [5, 5]], c), T([[6, 4], [5.4, -2.4], [11, 2]], c), T([[11.6, 2.4], [14.4, -3.6], [17.4, 2]], c),
      T([[17.6, 2], [22.6, -2.6], [22.4, 3.4]], c), T([[22, 3.4], [28.6, 0.4], [26.4, 6.6]], c), T([[3, 13], [-1.4, 14.6], [3.4, 16.6]], c)];
    case 'bun': return [cap, E(15.5, 2.6, 5.4, 4.4, c), F(T([[12, 0.6], [15.5, -1.2], [16, -0.4], [12.6, 1.4]], shade(c, 24))), R(11.2, 5.4, 8.6, 1.2, RIBBON)];
    default: return [cap];
  }
}

// Bangs over the forehead: a rounded cap with pointed locks, a lock in front of the ear, and a
// glossy highlight band across the crown.
function hairFront(style, c) {
  const d = shade(c, -18);
  const l = shade(c, 34);
  const short = style === 'short' || style === 'spiky';
  const k = short ? -1.4 : 0;
  // Locks: [center x, width, tip y, lean].
  const locks = [[7.4, 4.6, 19.4, -1.6], [11, 4.6, 15.8, 0.4], [14.8, 4.8, 16.8, 0.8], [18.6, 4.6, 15.4, 1], [22.2, 4.2, 17.2, 1.6], [25.4, 3.4, 19.6, 1.2]];
  const out = [C(E(15.8, 8.4, 11.4, 5.8, c))];
  for (const [x, w, tip, lean] of locks) out.push(C(T([[x - w / 2, 8.6], [x + w / 2, 8.6], [x + lean, tip + k]], c)));
  out.push(C(T([[4.2, 9.6], [8.8, 9.6], [8.6, 18], [7.6, 24 + k * 2], [5.4, 26 + k * 2], [4.6, 18]], c)));
  // Strands: a thin darker line down each lock, between locks, and down the side lock.
  for (const [x, , tip, lean] of locks) out.push(F(T([[x - 0.3, 9.4], [x + 0.3, 9.4], [x + lean * 0.7, tip + k - 1.6]], d)));
  for (const x of [9.2, 12.9, 16.7, 20.4]) out.push(F(T([[x - 0.25, 10], [x + 0.25, 10], [x + 0.3, 13.6]], d)));
  out.push(F(T([[6.4, 12], [7, 12], [6.6, 22 + k]], d)));
  // Glossy band across the crown, with a sparkle.
  out.push(
    F(T([[6.6, 7.6], [10.8, 5.2], [11.4, 6.4], [7.4, 8.8]], l)), F(T([[12.4, 4.4], [17.6, 4], [17.8, 5.3], [12.6, 5.7]], l)),
    F(T([[19, 4.2], [23.6, 5.8], [23.2, 7], [18.8, 5.5]], l)), F(T([[24.4, 6.6], [26.2, 8.4], [25.6, 9], [24, 7.6]], l)),
    F(E(15, 4.8, 0.7, 0.5, '#ffffff')), F(E(21, 5.2, 0.45, 0.35, '#ffffff')),
  );
  return out;
}

// Big anime eyes: a dark upper lash with a little wing, a deep iris top, a pupil, a lighter glow
// at the bottom, and two shines. `k` narrows the far eye in the three-quarter view.
function eye(ex, k, style, color, mode, skin) {
  const lash = (y = 0) => F(T([[ex - 2.2 * k, 16 + y], [ex - 1.4 * k, 14.8 + y], [ex + 1.6 * k, 14.6 + y], [ex + 2.6 * k, 15.6 + y], [ex + 2.1 * k, 16 + y], [ex + 1.4 * k, 15.5 + y], [ex - 1.4 * k, 15.6 + y]], INK));
  const lower = F(R(ex - 0.8 * k, 20.1, 1.8 * k, 0.45, shade(skin, -30)));
  const closed = (y) => F(T([[ex - 2.1 * k, y], [ex, y - 1.4], [ex + 2.2 * k, y], [ex + 1.8 * k, y + 0.6], [ex, y - 0.6], [ex - 1.7 * k, y + 0.6]], INK));
  if (mode === 'blink') return [F(T([[ex - 2.1 * k, 17.6], [ex + 2.3 * k, 17.6], [ex + 1.9 * k, 18.4], [ex - 1.7 * k, 18.4]], INK))];
  if (mode === 'hurt') return [F(T([[ex - 1.8 * k, 15.6], [ex + 1.8 * k, 17.4], [ex - 1.8 * k, 19.2], [ex - 1.2 * k, 17.4]], INK))];
  if (mode === 'happy' || style === 'happy') return [closed(18)];
  const r = style === 'round' ? 1.15 : 1;
  const open = [
    F(E(ex, 17.4, 1.9 * k * r, 2.7, '#ffffff')),
    F(E(ex + 0.15, 17.7, 1.55 * k * r, 2.35, color)),
    F(E(ex + 0.15, 16.6, 1.55 * k * r, 1.25, shade(color, -32))),
    F(E(ex + 0.2, 17.8, 0.75 * k, 1.05, shade(color, -58))),
    F(E(ex + 0.15, 19.1, 1.05 * k, 0.65, shade(color, 32))),
    F(E(ex - 0.5 * k, 16.6, 0.6 * r, 0.65 * r, '#ffffff')),
    F(E(ex + 0.7 * k, 18.8, 0.35, 0.35, '#ffffff')),
    style === 'round' ? F(T([[ex - 2.1 * k, 15.8], [ex - 1.2 * k, 14.8], [ex + 1.4 * k, 14.7], [ex + 2.3 * k, 15.8], [ex + 1.4 * k, 15.5], [ex - 1.2 * k, 15.6]], INK)) : lash(),
    lower,
  ];
  if (style === 'sleepy') open.push(F(T([[ex - 2.4 * k, 14.2], [ex + 2.8 * k, 14.2], [ex + 2.8 * k, 17], [ex - 2.4 * k, 17]], skin)), F(T([[ex - 2.2 * k, 16.8], [ex + 2.6 * k, 16.6], [ex + 2.4 * k, 17.5], [ex - 2 * k, 17.6]], INK)));
  return open;
}

function headShapes(look, g, rig) {
  const skin = look.skinTone ?? '#fff0e6';
  const hair = look.hairColor ?? '#e9ebfa';
  const style = look.hairStyle ?? 'bob';
  const eyeStyle = look.eyeStyle ?? 'sparkle';
  const eyeColor = look.eyeColor ?? '#4fcfb8';
  const hat = g.hat;
  const out = [];
  if (!hat || !TUCKS_HAIR.has(hat.design)) out.push(...hairBack(style, hair, rig.hair, rig.hairLift).filter((sh) => !sh.hang));
  if (hat) out.push(...hatBackShapes(hat.design, hat.color));
  // Face: round cheeks narrowing to a small chin, turned a little toward the facing side.
  out.push(E(15.5, 14.6, 9.8, 9.2, skin));
  out.push(T([[6.6, 16], [24.6, 15.6], [23.4, 20], [20.2, 23.6], [17.8, 24.6], [12.4, 22.8], [8, 19.6]], skin));
  out.push(...eye(12.2, 0.82, eyeStyle, eyeColor, rig.eyes, skin), ...eye(19.6, 1, eyeStyle, eyeColor, rig.eyes, skin));
  out.push(F(E(10.9, 20.6, 1.7, 0.75, '#ffb6c8')), F(E(22.4, 20.4, 1.5, 0.7, '#ffb6c8')));
  out.push(F(E(21.6, 19.8, 0.35, 0.35, shade(skin, -22))));
  if (rig.eyes === 'hurt') out.push(F(E(19.6, 22.8, 1, 0.7, INK)));
  else if (rig.mouth === 'open') out.push(F(E(19.6, 22.7, 1.1, 0.9, '#b2506c')), F(E(19.6, 23.2, 0.6, 0.35, '#ff9fb8')));
  else out.push(F(T([[18.4, 22.3], [20.6, 22.1], [20.4, 22.7], [18.6, 22.8]], '#b2506c')));
  if (!hat || hat.design !== 'bunny') out.push(...hairFront(style, hair));
  if (g.earring) out.push(...earringShapes(g.earring.design, g.earring.color));
  if (hat) out.push(...hatShapes(hat.design, hat.color));
  return out;
}

// ---------- Arms ----------

const UPPER_ARM = 5;
const FOREARM = 4.7;

// Shoulder to elbow in the sleeve color, then a forearm (bare unless the top has long sleeves).
// The elbow bends backward to bring the hand to (hx, hy).
function arm(sx, sy, hx, hy, sleeve, long, g, skin) {
  const [[ex, ey], [wx, wy]] = reach(sx, sy, hx, hy, UPPER_ARM, FOREARM, -1);
  return [
    E(sx, sy + 0.4, 1.7, 1.8, sleeve),
    limb(sx, sy, ex, ey, 3, 2.6, sleeve),
    E(ex, ey, 1.25, 1.25, long ? sleeve : skin),
    limb(ex, ey, wx, wy, 2.5, 2.1, long ? sleeve : skin),
    ...handShapes(wx, wy, g.gloves, skin),
  ];
}

// A resting arm from the shoulder at (sx, 27.6), the hand offset (dx, dy) from its rest spot.
function armShapes(sx, dx, dy, sleeve, long, g, skin) {
  return arm(sx, 27.6, sx + 0.6 + dx, 36.8 + dy, sleeve, long, g, skin);
}

// Attack arms point along `angle` (0 = down, 90 = forward, 180 = up) from the front shoulder.
function aimedArm(angle, sleeve, long, g, skin) {
  const rad = (angle * Math.PI) / 180;
  const hx = 19.2 + Math.sin(rad) * 8.6;
  const hy = 27.8 + Math.cos(rad) * 8.6;
  return { shapes: arm(19.2, 27.8, hx, hy, sleeve, long, g, skin), hand: [hx, hy] };
}

// ---------- Body parts per rig ----------

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
  if (!hat || !TUCKS_HAIR.has(hat.design)) {
    const hang = hairBack(look.hairStyle ?? 'bob', look.hairColor ?? '#e9ebfa', rig.hair, rig.hairLift).filter((sh) => sh.hang);
    shapes.push(...offset(hang, ux + rig.hx, uy + rig.hy));
  }
  if (g.cape) shapes.push(...offset(capeShapes(g.cape.design, g.cape.color, rig.cape, rig.flap), ux, uy));
  shapes.push(...offset(armShapes(11.3, rig.backArm[0], rig.backArm[1], shade(sleeve, -12), long, g, shade(skin, -6)), ux, uy));
  shapes.push(...legShapes(12, legs, g.shoes, true, rig.backLeg, HIP_Y + drop));
  shapes.push(...legShapes(15.6, legs, g.shoes, false, rig.frontLeg, HIP_Y + drop));
  shapes.push(...offset(hipShapes(legs), ux * 0.5, drop + rig.by * 0.5));
  const skirt = skirtShapes(g.bottom.design, g.bottom.color);
  if (skirt) shapes.push(...offset(skirt, ux, uy));
  shapes.push(...offset([R(14, 22.5, 3.4, 5, shade(skin, -8))], ux, uy));
  shapes.push(...offset(topShapes(top.design, top.color), ux, uy));
  shapes.push(...offset(headShapes(look, g, rig), ux + rig.hx, uy + rig.hy));
  return move(shapes, 0, 0);
}

const offset = (shapes, dx, dy) => shapes.map((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));

// Seen from behind on a rope: no face, hands reaching up the rope.
function backShapes(look, g, rig, skin, sleeve, legs) {
  const hair = look.hairColor ?? '#e9ebfa';
  const style = look.hairStyle ?? 'bob';
  const a = rig.climb;
  const long = longSleeves(g.top.design);
  const out = [];
  out.push(...legShapes(12, legs, g.shoes, true, [0, a > 0 ? -a * 1.6 : 0, 0]));
  out.push(...legShapes(15.6, legs, g.shoes, false, [0, a < 0 ? a * 1.6 : 0, 0]));
  out.push(...hipShapes(legs));
  out.push(...topShapes('tee', g.top.color));
  if (g.cape && g.cape.design !== 'fairy' && g.cape.design !== 'angel') out.push(T([[10.6, 26.6], [20, 26.6], [21, 46], [9.6, 46]], g.cape.color), R(9.6, 45, 11.4, 1, shade(g.cape.color, -20)));
  if (!g.hat || !TUCKS_HAIR.has(g.hat.design)) out.push(...hairBack(style, hair, 0, 0));
  const d = shade(hair, -16);
  out.push(E(15.5, 13.4, 12.6, 11.6, hair));
  for (const x of [9.6, 13.4, 17.6, 21.4]) out.push(F(T([[x - 0.3, 10], [x + 0.3, 10], [x + (x - 15.5) * 0.15, 22]], d)));
  out.push(F(T([[8.4, 8], [15.5, 5.6], [22.6, 8], [22.2, 9.4], [15.5, 7.1], [8.8, 9.4]], shade(hair, 30))));
  if (g.hat) out.push(...hatBackShapes(g.hat.design, g.hat.color), ...hatShapes(g.hat.design, g.hat.color));
  // Arms reach up past the head to grip the rope, hand over hand.
  out.push(...arm(11.3, 27.6, 13, 3 + a, sleeve, long, g, skin), ...arm(19.2, 27.6, 18, 3 - a, sleeve, long, g, skin));
  if (g.cape?.design === 'fairy' || g.cape?.design === 'angel') {
    const wing = capeShapes(g.cape.design, g.cape.color, 0, rig.flap);
    out.push(...wing, ...wing.map((s) => (s.t === 'p' ? { ...s, pts: s.pts.map(([px, py]) => [31 - px, py]) } : { ...s, x: 31 - s.x - (s.w ?? 0) })));
  }
  return move(out, 0, 0);
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
  const body = sprite(`hero|${lookKey}|${gk}|${rigKey(rig)}`, () => ({ w: W, h: H, shapes: bodyShapes(look, g, rig), res: RES, soft: true }));

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
    armShapesNow = armShapes(19.2, rig.frontArm[0], rig.frontArm[1], sleeve, long, g, skin);
    hand = [19.8 + rig.frontArm[0] + rig.tx, 36.8 + rig.frontArm[1] + bodyY];
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
  const arm = sprite(`arm|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(armShapesNow, 0, 0), res: RES, soft: true }));
  blit(ctx, arm, left + (flip ? -armDx : armDx) * scale, top + armDy * scale, { flip, flash: state.flash ?? 0, alpha, scale });
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
