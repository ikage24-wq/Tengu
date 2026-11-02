// The hero (and NPCs): a layered chibi rig. Each frame the pose is solved into small offsets for
// every part (legs, arms, torso, head, hair, cape), the parts are composited with the equipped
// gear's designs, and the result is cached as a smooth sprite drawn at RES x detail, so offsets
// can be fractions of a pixel. The front arm and the weapon are separate layers so weapons can
// swing around the hand.
//
// Animation: jointed limbs (hip, knee, ankle; shoulder, elbow, wrist) solved by two-bone reach; a
// 24-frame walk cycle driven by distance walked (heel strike with the toe up, a planted foot that
// rolls onto its toe, a high heel kick behind, the knee swinging through, counter-swinging arms,
// and hips that sink when the feet are spread), a breathing idle with blinks, legs tucked when rising, knees giving on landing, spring-driven hair and
// cape follow-through, attack anticipation and lunge with a weapon trail, a climb cycle, and a
// hurt recoil.

import { lookFor } from './weapon-kit.js';
import { outfitFx, drawOutfitFx } from './gacha.js';
import { settings } from '../core/settings.js';
import { ITEMS, RARITIES, VARIANTS, variantsFor } from '../data/items.js';
import { pieceOf, JOB_GEAR, gearPalette } from './jobgear/index.js';
import { STARTER_OUTFITS, starterHasBack, starterHasHat, starterHasHands } from './jobgear/starter.js';
import { GUARDIAN_OUTFIT_KEYS } from './jobgear/guardian.js';
import { TROUPE_OUTFIT_KEYS } from './jobgear/troupe.js';
import { PET_OUTFIT_KEYS } from './jobgear/pets.js';
import { hsl } from './jobgear/kit.js';
import { pack } from './weapon-kit.js';
import { drawGearFx } from './jobgear/live.js';
import { paintFan, paintGohei } from './props.js';
import { R, E, T, F, sprite, spriteBudgeted, blit, shade, mix, tinted, snap, sparkLine } from './pixel.js';
import {
  topShapes, sleeveColor, longSleeves, legLook, hipShapes, skirtShapes, legShapes, hatShapes, hatBackShapes, hatTucks, hatHidesBangs, shoulderShapes, capeShapes, capeFrontShapes, handShapes, earringShapes, limb, reach, THIGH, SHIN, HIP_Y, ANKLE_Y, legJoints, drape,
} from './gear.js';
import { weaponShapes, weaponFrames } from './weapons.js';
import { drawElementAura, ELEMENTS } from './elements.js';
import { walkPhase, walkBob, strideAt } from './animator.js';
import { drawJobAura, AURA_JOBS } from './aura.js';
import { moveAt, streamFlow } from './moves.js';
import { heroineEye } from './mobs/heroine.js';
import { HAIR_STYLES, BANG_STYLES, hairStyleOf, coversEye, hairParts, hairNape } from './hair.js';

export { HAIR_STYLES, BANG_STYLES, hairStyleOf };
// Eye styles offered in the creator and salon. The closed-eye ones (happy, sleepy, wink) are now
// covered by the animated faces, so they are hidden there but still draw for older characters.
export const PICKABLE_EYE_STYLES = ['sparkle', 'round', 'cat', 'droopy', 'star', 'big'];
export const FACE_STYLES = ['smile', 'smug', 'sassy', 'grin', 'pout', 'shy', 'cool', 'cat', 'angry', 'excited', 'love', 'sleepy', 'sad', 'shock', 'playful', 'proud', 'dizzy', 'nervous', 'giggle', 'determined',
  'bleh', 'excuseme', 'dimple', 'mmhm', 'hmph', 'judging', 'ohoho', 'sneer', 'heh', 'smugcat', 'toldyou', 'lookdown'];

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

// Outfits picked in the creator: what a character wears where no top, bottom, shoes or cape is
// equipped (drawn by jobgear/starter.js in a palette built from the outfit color).
export const OUTFIT_STYLES = STARTER_OUTFITS;

// The palette a starter outfit is drawn in: the gear ramp of the picked color, gold trim (so
// buttons and zips are metal and white stays cloth), an accent from across the color wheel, and
// the hero's skin for bare shoulders.
const starterPalettes = new Map();
function starterPalette(color, skin) {
  const key = `${color}|${skin}`;
  let p = starterPalettes.get(key);
  if (!p) {
    p = { ...gearPalette('starter', 0, color), trim: '#ffd66b', trimDark: '#e0a52f', trimLight: '#fff0b0', accent: null, glow: null, skin, pop: popOf(color) };
    starterPalettes.set(key, p);
  }
  return p;
}
// The accent: a pastel that pairs with the outfit color, the classic way (pink with sky blue,
// peach with mint, yellow with lavender, green with pink, blue with coral, purple with butter).
// Whites, greys and near-blacks take pink.
function popOf(c) {
  const [h, s, l] = hsl(c);
  if (s < 0.14 || l > 0.95 || l < 0.12) return '#ff86ab';
  if (h >= 320 || h < 15) return '#7fbcff';
  if (h < 48) return '#6fd6bf';
  if (h < 75) return '#b08cff';
  if (h < 170) return '#ff8fb6';
  if (h < 255) return '#ff7a86';
  return '#ffd36e';
}

// A dancer path's trim on the dancers' gear (see drawHero).
const PATH_TRIMS = {
  shinobi: { trim: '#f4b49a', trimDark: '#c8746a', trimLight: '#ffe0cf', accent: '#ffd36a' },
  kitsune: { trim: '#bfe6ff', trimDark: '#6fa8d8', trimLight: '#eef9ff', accent: '#ffe6a0' },
};

function resolveGear(look, gear) {
  const outfit = look.outfitColor ?? '#ffc2d6';
  const style = OUTFIT_STYLES.includes(look.outfit) || GUARDIAN_OUTFIT_KEYS.includes(look.outfit) || TROUPE_OUTFIT_KEYS.includes(look.outfit) || PET_OUTFIT_KEYS.includes(look.outfit) ? look.outfit : 'casual';
  // Where nothing is equipped, the outfit picked in the creator.
  const starter = { family: 'starter', design: style, tier: style, color: outfit, pal: starterPalette(outfit, look.skinTone ?? '#fff0e6') };
  // A real hero's gear (not a preview or a townsperson, who pass none): where the top, bottoms or
  // shoes are off, the plain basics underneath show, never bare skin.
  const own = gear != null;
  const basics = { family: 'starter', design: 'basics', tier: 'basics', color: '#c9b8f0', pal: starterPalette('#c9b8f0', look.skinTone ?? '#fff0e6') };
  const piece = (slot, fallback) => {
    const inst = gear?.[slot];
    const def = inst ? ITEMS[inst.id] : null;
    // The starting outfit pieces are drawn as the outfit picked in the creator.
    if (def?.starterOutfit) return starter;
    if (!def) return fallback;
    // Outfit lines can show the wearer's skin (a swimsuit's bare shoulders and midriff).
    const pc = pieceOf(def, inst.variant ?? null);
    return pc.pal ? { ...pc, pal: { ...pc.pal, skin: look.skinTone ?? '#fff0e6' } } : pc;
  };
  const dressed = !own || Boolean(gear.top);
  const under = own ? basics : starter;
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
    top: piece('top', under),
    bottom: piece('bottom', under),
    shoes: piece('shoes', under),
    // The outfit's own hat or glasses and back piece, unless the look asks for a bare head (the
    // creator's hairstyle thumbnails), a real hat is equipped, or the top is off.
    hat: piece('hat', starterHasHat(style) && look.outfitHat !== false && dressed ? starter : null),
    cape: piece('cape', starterHasBack(style) && dressed ? starter : null),
    // Outfits whose sleeves cover the hands draw them as their own gloves.
    gloves: piece('gloves', starterHasHands(style) && dressed ? starter : null),
    earring: piece('earring', null),
    // Glasses, masks and stickers: an outfit-only slot, drawn over the face and under the hat.
    face: piece('face', null),
    weapon,
  };
}

function gearKey(gear) {
  if (!gear) return '-';
  const key = ['top', 'bottom', 'shoes', 'gloves', 'hat', 'face', 'cape', 'earring'].map((s) => (gear[s] ? `${gear[s].id}${gear[s].variant ? `:${gear[s].variant}` : ''}` : '')).join(',');
  // A gauntlet is worn as the weapon hand's glove, so it is part of the arm's look.
  const w = gear.weapon;
  return ITEMS[w?.id]?.weaponType === 'gauntlet' ? `${key}|${w.id}:${w.variant ?? ''}:${w.cover ? JSON.stringify(w.cover) : ''}` : key;
}

// ---------- Head ----------
//
// A big round head (center (15.5, 14.6)) on a thin neck, ears on both sides, and a face turned a
// touch toward the facing side. Hair is built around that skull: a crown behind the head, soft
// rounded bangs and side locks in front, and longer styles that hang behind the body.

const HEAD_X = 15.5;
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

// The look's hairstyle for one pose (see hair.js): every part, already moving with the hair spring
// and the breeze, with the two-tone tips applied. Hanging parts are flagged `hang` so the body is
// drawn over them. The bangs carry `shade`, the band of forehead they darken (drawn under the
// eyes); the hairline itself shades the forehead too, so gaps between clumps aren't left bare.
function hairOf(look, rig) {
  const style = hairStyleOf(look);
  const color = look.hairColor ?? '#e9ebfa';
  const r = hairRamp(color);
  const tipColor = look.hairTip && look.hairTip !== 'none' && look.hairTip !== color ? look.hairTip : null;
  const tint = tipColor ? { mid: hairRamp(mix(color, tipColor, 0.5)), tip: hairRamp(tipColor) } : null;
  const m = rig ? { root: rig.hair ?? 0, tip: rig.hairTip ?? rig.hair ?? 0, lift: rig.hairLift ?? 0, wave: rig.hairWave ?? 0 } : null;
  const p = hairParts(style, r, tint, m, look.face ?? 'smile', look.hairBangs);
  const front = [...p.front];
  front.shade = p.front.length ? [...(p.hairline ? [F(E(HEAD_X, 8.2, 10.4, 3.2, '#000000'))] : []), ...p.shade] : [];
  return { style, r, head: p.head, hang: p.hang.map((sh) => ({ ...sh, hang: true })), front, top: p.top };
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
  // A doll's: big and perfectly round, almost all iris, a glass ring for a pupil, barely a lash.
  doll: { rx: 2.35, ry: 2.75, tilt: 0, wing: 0.15, flicks: 0, iris: 1.55, pupil: 'ring', sparkle: true },
  // The oni's own (render/oni.js; never offered in the creator): sharp and upswept with slit
  // pupils; huge and round with star pupils; droopy and heavy-lidded; wide with a small fierce iris.
  onisharp: { rx: 2.4, ry: 2.2, tilt: 0.6, wing: 2, flicks: 2, iris: 1.05, pupil: 'slit' },
  oniround: { rx: 2.35, ry: 2.95, tilt: 0.05, wing: 0.7, flicks: 2, iris: 1.45, pupil: 'star', sparkle: true },
  onitare: { rx: 2.3, ry: 2.3, tilt: -0.28, wing: 1.2, flicks: 1, iris: 1.25, open: 0.6 },
  onisanpaku: { rx: 2.35, ry: 2.6, tilt: 0.3, wing: 1.4, flicks: 2, iris: 0.8 },
  // The yuki-onna's: calm and downcast, long and narrow with heavy lashes and a small pale iris;
  // or wide and empty, a cold stare with a tiny pupil.
  yukicalm: { rx: 2.5, ry: 2, tilt: 0.12, wing: 1.6, flicks: 3, iris: 1.05, open: 0.7 },
  yukistare: { rx: 2.3, ry: 2.7, tilt: 0.05, wing: 1, flicks: 2, iris: 1.2, pupil: 'ring' },
  // More of hers, to pick from: snowflake pupils (round, or narrow and veiled); a long, sleepy,
  // downturned veil of lashes; a thin cold bar of a pupil; diamond pupils, upswept; a huge glassy
  // doll's eye; and a narrow, sharp, almost-closed glance.
  yukiflake: { rx: 2.35, ry: 2.6, tilt: 0.08, wing: 1.2, flicks: 2, iris: 1.35, pupil: 'flake', sparkle: true },
  yukiflakeveil: { rx: 2.5, ry: 2.2, tilt: 0.15, wing: 1.8, flicks: 3, iris: 1.2, pupil: 'flake', open: 0.62 },
  yukiveil: { rx: 2.55, ry: 2.1, tilt: -0.22, wing: 2, flicks: 3, iris: 1.1, open: 0.5 },
  yukibar: { rx: 2.4, ry: 2.4, tilt: 0.1, wing: 1.4, flicks: 2, iris: 1.3, pupil: 'bar' },
  yukidiamond: { rx: 2.4, ry: 2.3, tilt: 0.45, wing: 1.8, flicks: 2, iris: 1.15, pupil: 'diamond' },
  yukiglass: { rx: 2.4, ry: 2.9, tilt: 0, wing: 0.6, flicks: 1, iris: 1.5, pupil: 'ring', sparkle: true },
  yukislit: { rx: 2.6, ry: 1.7, tilt: 0.3, wing: 2.2, flicks: 3, iris: 1, open: 0.55 },
  // More of hers (`lash` sets the lashes' colour: frost white, or ice blue):
  yukifrostlash: { rx: 2.45, ry: 2.4, tilt: 0.1, wing: 1.8, flicks: 3, iris: 1.25, pupil: 'flake', lash: '#e8f0ff', sparkle: true },
  yukicrescent: { rx: 2.4, ry: 2.5, tilt: 0.05, wing: 1.4, flicks: 2, iris: 1.3, pupil: 'crescent' },
  yukimoon: { rx: 2.55, ry: 2.05, tilt: -0.2, wing: 2, flicks: 3, iris: 1.15, pupil: 'crescent', open: 0.58 },
  yukicrystal: { rx: 2.4, ry: 2.6, tilt: 0.08, wing: 1.3, flicks: 2, iris: 1.35, pupil: 'crystal', sparkle: true },
  yukiblank: { rx: 2.35, ry: 2.5, tilt: 0.05, wing: 1.2, flicks: 2, iris: 1.3, pupil: 'none' },
  yukirings: { rx: 2.4, ry: 2.6, tilt: 0.06, wing: 1.2, flicks: 2, iris: 1.35, pupil: 'rings' },
  yukiwhiteveil: { rx: 2.55, ry: 2.1, tilt: -0.22, wing: 2, flicks: 3, iris: 1.1, open: 0.5, lash: '#e8f0ff' },
  yukiicelash: { rx: 2.45, ry: 2.3, tilt: 0.35, wing: 2.2, flicks: 3, iris: 1.15, pupil: 'diamond', lash: '#6a9ad8' },
  // The tengu's: long, sharp and upswept under a heavy lid (a smug, unhurried look down his nose),
  // a man's light lashes, a narrow gold iris.
  tengusmug: { rx: 2.55, ry: 1.85, tilt: 0.34, wing: 1.1, flicks: 1, iris: 1.12, open: 0.64 },
  // More of his, to pick from: a fox's, narrow and sharply upswept; heavy-lidded and bored; keen,
  // with a slit pupil; long and calm, almond-shaped; a hawk's, a small fierce iris in a wide eye.
  tengufox: { rx: 2.6, ry: 1.7, tilt: 0.55, wing: 1.5, flicks: 1, iris: 1.05, open: 0.56 },
  tenguheavy: { rx: 2.5, ry: 2, tilt: 0.12, wing: 1, flicks: 1, iris: 1.1, open: 0.48 },
  tengukeen: { rx: 2.45, ry: 2, tilt: 0.42, wing: 1.3, flicks: 1, iris: 1.15, pupil: 'slit', open: 0.7 },
  tengucalm: { rx: 2.6, ry: 1.9, tilt: 0.2, wing: 1.2, flicks: 1, iris: 1.25, open: 0.72 },
  tenguhawk: { rx: 2.35, ry: 2.3, tilt: 0.3, wing: 1, flicks: 1, iris: 0.9, open: 0.8 },
};
const mirrorAt = (x, y) => [-x, y];

// One eye at screen x `ex`; `out` is -1 for the eye on the back side, 1 for the facing side.
// mode: 'open', 'half' (mid-blink), 'blink', 'hurt' (> <), 'happy' (closed smile), 'dead'. The
// face frame `f` acts on it: `lid` (0-1) lowers the upper lid, `glance` looks aside and `look`
// up or down, `shine` swaps in sparkles, `wide` pops the eye open with a shrunken iris (shock),
// `heart` turns the pupils to hearts, `spiral` spins them (dizzy), `teary` fills the eye with
// water. `cross` pulls the inner lid down (angry). `lids` ([back, front]) lowers each upper lid
// apart (a skeptical squint).
function eye(ex, out, style, color, mode, look, f = {}, cross = 0) {
  const st = EYE_LOOK[style] ?? EYE_LOOK.sparkle;
  const sk = skinRamp(look.skinTone ?? '#fff0e6');
  const hr = hairRamp(look.hairColor ?? '#e9ebfa');
  const closed = mode === 'happy' || style === 'happy' || (style === 'wink' && out > 0);
  const lids = mode === 'blink' ? 'blink' : mode === 'hurt' ? 'squeeze' : mode === 'dead' ? 'dead' : closed ? 'happy' : 'open';
  const lid = f.lids ? f.lids[out < 0 ? 0 : 1] : f.lid ?? 0;
  // Iris offset on screen: a touch toward the facing side, more when glancing.
  const g = 0.3 + 0.55 * (f.glance ?? 0);
  const gy = f.look === 'down' ? 0.13 : f.look === 'up' ? -0.1 : 0;
  const wide = f.wide && lids === 'open';
  const x = {
    lids, open: mode === 'half' ? Math.min(0.36, (st.open ?? 1) * (1 - lid * 0.85)) : wide ? 1 : (st.open ?? 1) * (1 - lid * 0.85), inner: cross, raise: cross * 0.4, gaze: [-(g + 0.3) / (2 * st.rx), gy],
    iris: st.iris * (cross ? 0.9 : 1) * (wide ? 0.62 : 1), pupil: wide ? 0.4 : cross ? 0.75 : f.heart ? 1.7 : 1,
  };
  const kit = {
    k: 1, chibi: true, skin: sk.base, skinSh: sk.sh1, skinSh2: sk.sh2, lip: sk.lip,
    eye: {
      iris: color, pupil: f.heart ? 'heart' : f.shine && !st.pupil ? 'star' : st.pupil, pupilC: f.heart ? '#ff4f86' : mix(shade(color, -62), hr.ink, 0.4), white: '#fffaf7', lashSh: mix('#fffaf7', hr.ink, 0.2),
      ink: st.lash ?? hr.ink, lashW: 0.85, wing: st.wing, flicks: st.flicks, lashLen: 0.95, crease: false, lower: mix(sk.lip, sk.base, 0.4),
      sparkle: st.sparkle || f.shine, tilt: st.tilt,
    },
  };
  const k = wide ? 1.2 : 1;
  if (f.spiral && lids === 'open') {
    // Dizzy: a white eye with a lash-coloured spiral wound into it.
    const pts = [];
    for (let a = 0; a < Math.PI * 4.2; a += 0.35) { const rr = 0.25 + a * 0.13; pts.push([ex + out * Math.cos(a + f.spiral) * rr, EYE_Y + Math.sin(a + f.spiral) * rr * 1.15]); }
    return [F(E(ex, EYE_Y, st.rx, st.ry, '#fffaf7')), stroke(pts, 0.5, hr.ink), arc(ex, EYE_Y, st.rx, st.ry, 200, 340, 0.7, hr.ink)];
  }
  const shapes = heroineEye(mirrorAt, { cx: -ex, cy: EYE_Y, rx: st.rx * k, ry: st.ry * k, o: -out, near: true, tilt: st.tilt }, x, kit);
  if (f.teary && lids === 'open') {
    // Welling up: a wobbling pool along the lower lid and a second big wet shine.
    const w = f.teary === 2 ? 0.2 : 0;
    shapes.push(F(E(ex, EYE_Y + st.ry * 0.62, st.rx * 0.82, 0.62 + w, '#c9ecff')), F(E(ex - 0.5, EYE_Y + st.ry * 0.58, 0.5, 0.28, '#ffffff')), F(E(ex + 0.7 * out, EYE_Y + 0.2, 0.42, 0.42, '#ffffff')));
  }
  return shapes;
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

// Ear styles. Round ears peek out from behind the cheeks; elf ears are a pointed leaf whose base
// tucks under the side locks and whose tip pokes out past the hair: `elf` short and swept up,
// `long` long and swept out to the side, `pointed` broad and swept up and out (the MapleStory
// elf), and `droopy` long and slender, reaching out to the side and drooping down a little.
export const EAR_STYLES = ['round', 'elf', 'long', 'pointed', 'droopy'];

// The front (right-hand) ear in a style: the ear in `c` and its inner hollow in `inner`. The back
// ear is its mirror, a shade darker.
function earShapes(style, c, inner) {
  if (style === 'elf') {
    return [F(T([[24.2, 15.9], [27.4, 15.0], [29.6, 13.0], [31.6, 11.2], [30.4, 14.6], [28.4, 18.4], [25, 20.7]], c)), F(T([[25.4, 16.9], [27.6, 16.2], [30.0, 13.5], [28.9, 15.6], [27.4, 18.1], [25.7, 19.4]], inner))];
  }
  if (style === 'long') {
    return [F(T([[24.2, 16.1], [28.2, 15.1], [32.4, 14.0], [36.2, 12.8], [33.2, 15.6], [29.2, 18.6], [25, 20.7]], c)), F(T([[25.4, 17.0], [28.4, 16.3], [32.0, 15.1], [34.2, 14.0], [31.6, 16.0], [28.6, 18.1], [25.7, 19.4]], inner))];
  }
  if (style === 'pointed') {
    return [
      F(T([[24.2, 15.4], [26.8, 14.3], [29.4, 12.6], [31.6, 11.0], [33.4, 9.6], [32.2, 12.4], [30.6, 15.0], [28.6, 17.6], [26.6, 19.8], [25, 20.8]], c)),
      F(T([[25.4, 16.4], [27.4, 15.6], [29.6, 14.0], [31.6, 11.8], [30.2, 14.6], [28.4, 17.0], [26.6, 18.9], [25.6, 19.6]], inner)),
    ];
  }
  if (style === 'droopy') {
    return [
      F(T([[24.2, 16.0], [26.8, 16.2], [29.6, 16.9], [32.4, 18.2], [35.2, 20.6], [32.2, 20.4], [29.2, 20.5], [26.6, 20.9], [25, 21.0]], c)),
      F(T([[25.4, 17.2], [27.4, 17.4], [29.8, 18.0], [32.6, 19.6], [29.6, 19.7], [27.2, 19.9], [25.7, 20.0]], inner)),
    ];
  }
  return [F(E(25.4, 18, 1.8, 2.3, c)), F(E(25.2, 18.3, 0.7, 1.2, inner))];
}

// Eyebrow styles, each its own silhouette (art bible: brows taper at both ends, in the hair's
// darkest shade, never ink). `round` is hikimayu: small soft ovals set high; `dots` a doll's
// painted brows, two tiny dots side by side set very high. `none` hides them.
export const BROW_STYLES = ['soft', 'thick', 'round', 'thin', 'arched', 'sharp', 'stubby', 'dots', 'none'];
// (Also 'tengu', the tengu's own: never offered in the creator.)

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
    case 'stubby':
      // Short and thick: a small bold dash over the middle of the eye, squared off at both ends.
      return ribbon([at(0.08), at(0.35, 0.08), at(0.72, 0.04)], g([1.35, 1.45, 1.25]), c);
    case 'round': {
      // Hikimayu: a small soft oval, set high over the inner half of the eye.
      const [cx, cy] = at(0.3, 0.9);
      return F(E(cx, cy, 0.95 + grow, 0.72 + grow, c));
    }
    case 'dots': {
      // A doll's painted brows: two tiny dots side by side, high over the inner half of the eye.
      // Painted on in a soft rose, with no skin edge (they sit on the fringe like paint on lacquer).
      if (grow) return [];
      const [ax, ay] = at(-0.1, 1.3);
      const [bx, by] = at(0.62, 1.5);
      const paint = mix(c, '#e07a8c', 0.6);
      return [F(E(ax, ay, 0.5, 0.45, paint)), F(E(bx, by, 0.42, 0.38, paint))];
    }
    case 'thin':
      return ribbon([at(0), at(0.45, 0.35), at(1, 0.1)], g([0.35, 0.5, 0.3]), c);
    case 'arched':
      // A high curve that peaks past the middle.
      return ribbon([at(0), at(0.35, 0.6), at(0.65, 0.95), at(1, 0.2)], g([0.5, 0.75, 0.7, 0.35]), c);
    case 'tengu':
      // The tengu's: straight, strong and clean, a man's brow, tapering long past the eye.
      return ribbon([at(-0.12), at(0.45, 0.18), at(1.18, 0.3)], g([1.05, 0.95, 0.3]), c);
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
    // Bored: a long thin line off to one side, sagging a little at the corner.
    case 'bored': return [stroke([[x - 1.8, MY + 0.5], [x + 0.6, MY + 0.5], [x + 1.6, MY + 0.8]], 0.5, LIP)];
    case 'cat': return [arc(x - 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.6, LIP), arc(x + 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.6, LIP)];
    case 'grit': return [F(R(x - 1.8, MY, 3.6, 1.5, MOUTH)), F(R(x - 1.5, MY + 0.3, 3, 0.9, '#ffffff')), F(R(x - 1.5, MY + 0.7, 3, 0.15, '#d9cde6'))];
    case 'yell': return [F(E(x, MY + 1, 1.8, 1.5, MOUTH)), F(E(x, MY + 1.8, 1, 0.6, '#ff9fb8'))];
    case 'tiny': return [arc(x, MY + 0.2, 0.8, 0.7, 25, 155, 0.6, LIP)];
    // Talking shapes, cycled syllable by syllable.
    case 'o': return [F(E(x, MY + 0.9, 0.7, 0.8, MOUTH)), F(E(x, MY + 1.3, 0.35, 0.25, '#ff9fb8'))];
    case 'ah': return [F(E(x, MY + 1, 1.4, 1.2, MOUTH)), F(E(x, MY + 1.7, 0.8, 0.45, TONGUE))];
    case 'e': return [F(T([[x - 1.5, MY + 0.2], [x + 1.5, MY + 0.2], [x + 1, MY + 1.1], [x - 1, MY + 1.1]], MOUTH)), F(R(x - 1.2, MY + 0.2, 2.4, 0.4, '#ffffff'))];
    // A big open laugh, a fang grin, a kiss, a gasp, a frown, a cat's "w", a yawn, a sob.
    case 'D': return [F(T([[x - 2, MY - 0.2], [x + 2, MY - 0.2], [x + 1.5, MY + 1.4], [x, MY + 2.2], [x - 1.5, MY + 1.4]], MOUTH)), F(E(x, MY + 1.6, 1.1, 0.55, TONGUE))];
    case 'fang': return [arc(x, MY - 0.2, 1.8, 1.4, 15, 165, 0.7, LIP), F(T([[x + 0.2, MY + 1], [x + 1.2, MY + 0.9], [x + 0.7, MY + 2.1]], '#ffffff'))];
    case 'kiss': return [arc(x + 0.2, MY - 0.2, 0.9, 0.75, 270, 450, 0.7, LIP), arc(x + 0.2, MY + 1.2, 0.9, 0.75, 270, 450, 0.7, LIP)];
    case 'gasp': return [F(T([[x, MY - 0.5], [x + 1.2, MY + 1.7], [x - 1.2, MY + 1.7]], MOUTH)), F(E(x, MY + 1.3, 0.5, 0.3, '#ff9fb8'))];
    case 'frown': return [arc(x, MY + 1.4, 1.2, 1.1, 205, 335, 0.66, LIP)];
    case 'meow': return [F(E(x, MY + 1, 1.2, 1.1, MOUTH)), F(E(x, MY + 1.5, 0.6, 0.4, '#ff9fb8')), arc(x - 0.8, MY + 0.1, 0.8, 0.8, 10, 170, 0.6, LIP), arc(x + 0.8, MY + 0.1, 0.8, 0.8, 10, 170, 0.6, LIP)];
    case 'yawn': return [F(E(x, MY + 1.4, 1.2, 1.8, MOUTH)), F(E(x, MY + 2.5, 0.75, 0.55, TONGUE))];
    case 'sob': case 'sob2': {
      const w = kind === 'sob2' ? 0.35 : 0;
      return [F(T([[x - 0.9 - w, MY + 0.1], [x + 0.9 + w, MY + 0.1], [x + 1.7 + w, MY + 1.8], [x - 1.7 - w, MY + 1.8]], MOUTH)), F(E(x, MY + 1.5, 0.9, 0.35, TONGUE))];
    }
    // The oni's own: a wide cocky grin with a fang at each corner; tongue stuck out with a fang; a
    // grin of jagged shark teeth; a smug ":3" with a fang; a lopsided smirk showing a fang.
    case 'onigrin': return [F(T([[x - 2.4, MY - 0.6], [x + 2.6, MY - 0.9], [x + 1.6, MY + 1.4], [x, MY + 1.9], [x - 1.6, MY + 1.3]], MOUTH)), F(T([[x - 2.1, MY - 0.5], [x + 2.3, MY - 0.8], [x + 2.1, MY - 0.1], [x - 1.9, MY + 0.1]], '#ffffff')),
      F(T([[x - 1.9, MY - 0.2], [x - 1.1, MY - 0.2], [x - 1.5, MY + 1.1]], '#ffffff')), F(T([[x + 1.2, MY - 0.4], [x + 2, MY - 0.5], [x + 1.6, MY + 0.9]], '#ffffff')), F(E(x, MY + 1.3, 0.9, 0.4, '#ff9fb8'))];
    case 'onibleh': return [stroke([[x - 1.8, MY + 0.2], [x, MY + 0.6], [x + 1.8, MY - 0.4]], 0.62, LIP), F(E(x - 0.4, MY + 1.4, 0.85, 1.05, TONGUE)), F(R(x - 0.45, MY + 0.9, 0.15, 1.1, '#e86d8c')),
      F(T([[x + 0.7, MY + 0.3], [x + 1.6, MY + 0.1], [x + 1.2, MY + 1.5]], '#ffffff'))];
    case 'onishark': return [F(T([[x - 2.2, MY - 0.4], [x + 2.4, MY - 0.6], [x + 1.6, MY + 1.6], [x - 1.6, MY + 1.6]], MOUTH)),
      F(T([[x - 2, MY - 0.3], [x - 1.4, MY + 0.7], [x - 0.8, MY - 0.3], [x - 0.2, MY + 0.7], [x + 0.4, MY - 0.4], [x + 1, MY + 0.6], [x + 1.6, MY - 0.5], [x + 2.2, MY + 0.4], [x + 2.3, MY - 0.6]], '#ffffff')),
      F(T([[x - 1.4, MY + 1.6], [x - 0.9, MY + 0.9], [x - 0.3, MY + 1.6], [x + 0.3, MY + 0.9], [x + 0.9, MY + 1.6], [x + 1.4, MY + 1]], '#ffffff'))];
    case 'onicat': return [arc(x - 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.6, LIP), arc(x + 0.75, MY + 0.2, 0.8, 0.8, 10, 170, 0.6, LIP), F(T([[x + 0.9, MY + 0.8], [x + 1.7, MY + 0.7], [x + 1.3, MY + 1.9]], '#ffffff'))];
    // The yuki-onna's: small, pale blue lips, closed; or parted with a cold breath.
    case 'yukilips': return [F(E(x, MY + 0.6, 1.1, 0.55, '#8ab4e8')), F(E(x, MY + 0.45, 0.7, 0.2, '#c8e0ff'))];
    case 'yukibreath': return [F(E(x, MY + 0.9, 0.9, 0.8, '#5a7ab8')), F(E(x, MY + 0.9, 1.3, 1.1, '#8ab4e8')), F(E(x, MY + 0.9, 0.7, 0.6, '#3a4a78'))];
    // The tengu's: a small closed smirk, one corner lifted; the same with a flash of teeth at that
    // corner (pleased with himself); a short open 'hah'; and a flat, sideways 'tch'.
    case 'tengusmirk': return [stroke([[x - 1.3, MY + 0.55], [x + 0.4, MY + 0.55], [x + 1.5, MY - 0.15], [x + 1.9, MY - 0.55]], 0.55, LIP)];
    case 'tengugrin': return [F(T([[x - 1.2, MY + 0.3], [x + 1.9, MY - 0.5], [x + 1.4, MY + 1], [x - 0.6, MY + 0.9]], MOUTH)), F(T([[x - 0.9, MY + 0.35], [x + 1.8, MY - 0.4], [x + 1.6, MY + 0.2], [x - 0.6, MY + 0.55]], '#ffffff')),
      stroke([[x - 1.4, MY + 0.35], [x + 0.6, MY + 0.05], [x + 2, MY - 0.6]], 0.45, LIP)];
    case 'tenguhah': return [F(E(x + 0.3, MY + 0.7, 1.1, 0.75, MOUTH)), F(E(x + 0.3, MY + 0.35, 0.9, 0.25, '#ffffff'))];
    // A sly half smile with one small fang showing; a cool, faint line.
    case 'tengusly': return [stroke([[x - 1.4, MY + 0.4], [x + 0.2, MY + 0.7], [x + 1.6, MY + 0.1], [x + 2, MY - 0.4]], 0.55, LIP), F(T([[x + 0.6, MY + 0.55], [x + 1.3, MY + 0.35], [x + 1.05, MY + 1.35]], '#ffffff'))];
    case 'tengucool': return [stroke([[x - 1, MY + 0.6], [x + 1.4, MY + 0.45]], 0.5, LIP)];
    case 'tengutch': return [stroke([[x - 1.2, MY + 0.7], [x + 0.6, MY + 0.5], [x + 1.6, MY + 0.8]], 0.55, LIP), F(E(x + 1.8, MY + 0.6, 0.3, 0.25, LIP))];
    case 'onismirk': return [stroke([[x - 1.6, MY + 0.7], [x + 0.2, MY + 0.6], [x + 1.6, MY - 0.6], [x + 2, MY - 0.9]], 0.62, LIP), F(T([[x + 0.8, MY + 0.4], [x + 1.6, MY - 0.1], [x + 1.4, MY + 1.3]], '#ffffff'))];
    // Attitude: lips pressed into a small prim knot pushed to one side; a sneer, the lifted corner
    // baring a sliver of teeth; a sly closed smile curling up into a dimple; a tongue stuck
    // straight out ("bleh"); an open "ohoho" laugh, tipped up at the near corner.
    case 'pursed': return [stroke([[x - 0.2, MY + 0.65], [x + 1.6, MY + 0.5]], 0.45, LIP), F(E(x + 0.8, MY + 0.6, 0.62, 0.48, sk.lip)), F(E(x + 0.8, MY + 0.6, 0.28, 0.2, LIP))];
    case 'sneer': return [F(T([[x + 0.1, MY + 0.5], [x + 1.5, MY - 0.3], [x + 1.7, MY + 0.3], [x + 0.5, MY + 0.8]], '#ffffff')),
      stroke([[x - 1.5, MY + 0.75], [x + 0.2, MY + 0.55], [x + 1.6, MY - 0.4], [x + 2, MY - 0.7]], 0.55, LIP), stroke([[x + 0.5, MY + 0.85], [x + 1.7, MY + 0.35]], 0.35, LIP)];
    case 'slysmile': return [stroke([[x - 1.7, MY + 0.15], [x - 0.6, MY + 0.75], [x + 0.6, MY + 0.65], [x + 1.6, MY - 0.05], [x + 1.95, MY - 0.55]], 0.6, LIP), F(E(x + 2.45, MY - 0.05, 0.2, 0.38, LIP))];
    case 'bleh': return [F(E(x, MY + 1.5, 0.95, 1.25, TONGUE)), F(R(x - 0.08, MY + 0.8, 0.16, 1.3, '#e86d8c')), stroke([[x - 1.5, MY + 0.35], [x + 1.5, MY + 0.35]], 0.55, LIP)];
    // Smug: a lopsided ":3", the near half bigger and flicked up; a wide one-sided smirk, its
    // corner hitched high into a crease in the cheek.
    case 'smugcat': return [arc(x - 0.7, MY + 0.35, 0.72, 0.68, 10, 170, 0.58, LIP), arc(x + 0.85, MY + 0.1, 0.9, 0.85, 10, 170, 0.6, LIP), stroke([[x + 1.65, MY + 0.3], [x + 2.15, MY - 0.35]], 0.5, LIP)];
    case 'smirkwide': return [stroke([[x - 1.6, MY + 0.6], [x + 0.2, MY + 0.6], [x + 1.8, MY - 0.3], [x + 2.3, MY - 0.9]], 0.6, LIP), stroke([[x + 2.75, MY - 1.2], [x + 2.95, MY - 0.2]], 0.32, sk.lip)];
    case 'ohoho': return [F(T([[x - 1.6, MY - 0.2], [x + 1.9, MY - 0.7], [x + 0.9, MY + 1.4], [x - 0.6, MY + 1.3]], MOUTH)), F(T([[x - 1.4, MY - 0.15], [x + 1.7, MY - 0.6], [x + 1.6, MY - 0.15], [x - 1.3, MY + 0.25]], '#ffffff')), F(E(x + 0.2, MY + 1, 0.7, 0.3, '#ff9fb8'))];
    default: return [arc(x, MY, 1.3, 1.1, 25, 155, 0.62, LIP)];
  }
}

// Little cartoon marks around the head: an anger vein, a sweat drop, sparkles, a shine.
function faceExtras(extra) {
  const out = [];
  for (const e of extra) {
    if (e === 'kitsune') {
      // Kitsune shrine make-up: a sweep of vermilion flicking up from each eye's outer corner,
      // and a small vermilion mark between the brows.
      for (const side of [-1, 1]) {
        const ox = FACE_X + (EYE_DX + 1.9) * side;
        out.push(F(T([[ox - 0.5 * side, EYE_Y - 0.4], [ox + 1.5 * side, EYE_Y - 2.2], [ox + 0.9 * side, EYE_Y - 0.6], [ox, EYE_Y + 0.5]], '#e8463a')));
      }
      out.push(F(E(FACE_X, 13.2, 0.55, 0.85, '#e8463a')), F(E(FACE_X, 13.6, 0.3, 0.3, '#ff9a8a')));
      continue;
    }
    if (e === 'oniglow') {
      // A burning eye: a flare of gold light at the near eye's outer corner, and a streak of it
      // trailing back.
      const ox = FACE_X + EYE_DX + 1.6;
      out.push(F(T([[ox - 0.6, EYE_Y - 0.5], [ox + 4.6, EYE_Y - 1.6], [ox + 4.2, EYE_Y - 0.9], [ox - 0.2, EYE_Y + 0.5]], '#ffd36a')));
      out.push(F(T([[ox, EYE_Y - 1.8], [ox + 0.5, EYE_Y - 0.2], [ox, EYE_Y + 1.4], [ox - 0.5, EYE_Y - 0.2]], '#fff6d0')), F(T([[ox - 1.4, EYE_Y - 0.2], [ox, EYE_Y - 0.6], [ox + 1.4, EYE_Y - 0.2], [ox, EYE_Y + 0.2]], '#fff6d0')));
      continue;
    }
    // The oni's bored props: a bubble of pink gum, a toothpick at the corner of her mouth, a long
    // kiseru pipe with a curl of smoke, a puff of a sigh.
    if (e === 'gumbubble') {
      out.push(F(E(FACE_X + 0.8, MY + 1.8, 2.4, 2.2, '#ff9ac8')), F(E(FACE_X + 0.1, MY + 1, 0.7, 0.6, '#ffd6ea')), arc(FACE_X + 0.8, MY + 1.8, 2.4, 2.2, 0, 360, 0.35, '#e0609a'));
      continue;
    }
    if (e === 'toothpick') {
      out.push(stroke([[FACE_X + 1.2, MY + 0.5], [FACE_X + 6.2, MY - 1.6]], 0.5, '#d8b47a'), stroke([[FACE_X + 5.6, MY - 1.4], [FACE_X + 6.2, MY - 1.6]], 0.5, '#a8844a'));
      continue;
    }
    if (e === 'kiseru') {
      out.push(stroke([[FACE_X + 1.2, MY + 0.4], [FACE_X + 9.4, MY + 2.6]], 0.65, '#2a1e22'), stroke([[FACE_X + 1, MY + 0.35], [FACE_X + 2.4, MY + 0.7]], 0.75, '#f2c94c'),
        F(T([[FACE_X + 8.8, MY + 1.6], [FACE_X + 10.4, MY + 1.6], [FACE_X + 10.2, MY + 3.2], [FACE_X + 9, MY + 3.2]], '#f2c94c')), F(E(FACE_X + 9.6, MY + 1.7, 0.7, 0.3, '#d8303a')));
      for (const [dx, dy, r] of [[9.8, -0.4, 0.8], [10.8, -2.2, 1], [10.2, -4.2, 1.2]]) out.push(F(E(FACE_X + dx, MY + dy, r, r * 0.85, '#e6e2ee')));
      continue;
    }
    if (e === 'sighpuff') {
      for (const [dx, dy, r] of [[3.2, 0.4, 0.8], [4.8, -0.2, 1.1], [6.8, -0.8, 1.3]]) out.push(F(E(FACE_X + dx, MY + dy, r, r * 0.8, '#f4f2fa')), arc(FACE_X + dx, MY + dy, r, r * 0.8, 200, 340, 0.3, '#b8b4c8'));
      continue;
    }
    if (e === 'frostmark') {
      // A snowflake of frost under her near eye, and frost on her lashes.
      const fx0 = FACE_X + EYE_DX + 1.6;
      for (const a of [0, Math.PI / 3, (2 * Math.PI) / 3]) out.push(stroke([[fx0 - Math.cos(a) * 1, EYE_Y + 3.4 - Math.sin(a) * 1], [fx0 + Math.cos(a) * 1, EYE_Y + 3.4 + Math.sin(a) * 1]], 0.3, '#8ab4e8'));
      continue;
    }
    if (e === 'icetear') {
      // A frozen tear on her far cheek.
      out.push(F(T([[FACE_X - EYE_DX + 0.4, EYE_Y + 2], [FACE_X - EYE_DX + 1.2, EYE_Y + 4.4], [FACE_X - EYE_DX - 0.4, EYE_Y + 4.4]], '#c8e8ff')), F(E(FACE_X - EYE_DX + 0.4, EYE_Y + 4.4, 0.8, 0.7, '#c8e8ff')), F(E(FACE_X - EYE_DX + 0.2, EYE_Y + 3.6, 0.25, 0.3, '#ffffff')));
      continue;
    }
    if (e === 'bandaid') {
      // A pink sticking plaster across her near cheek, its pad and a few dots.
      out.push(F(T([[FACE_X + 4.4, 18.6], [FACE_X + 8.4, 17.2], [FACE_X + 8.9, 18.6], [FACE_X + 4.9, 20]], '#ffd2c8')), F(T([[FACE_X + 5.9, 18.1], [FACE_X + 7.3, 17.6], [FACE_X + 7.8, 19], [FACE_X + 6.4, 19.5]], '#ffb4a6')));
      for (const [dx, dy] of [[5.1, 19.2], [8.1, 18.2]]) out.push(F(E(FACE_X + dx, dy, 0.18, 0.18, '#e08a7a')));
      continue;
    }
    if (e === 'warpaint') {
      // Crimson war paint: two stripes under each eye.
      for (const side of [-1, 1]) {
        const ox = FACE_X + EYE_DX * side;
        for (const dy of [3.4, 4.6]) out.push(F(T([[ox - 1.6, EYE_Y + dy], [ox + 1.6, EYE_Y + dy - 0.5], [ox + 1.6, EYE_Y + dy + 0.1], [ox - 1.6, EYE_Y + dy + 0.6]], '#d8303a')));
      }
      continue;
    }
    if (e === 'foremark') {
      // A dark diamond on her brow with a gold heart and a gold dot either side (it reads on any
      // skin, red included).
      out.push(F(T([[FACE_X, 11.2], [FACE_X + 1, 12.8], [FACE_X, 14.4], [FACE_X - 1, 12.8]], '#3a0a14')), F(T([[FACE_X, 12.1], [FACE_X + 0.45, 12.8], [FACE_X, 13.5], [FACE_X - 0.45, 12.8]], '#f2c94c')),
        F(E(FACE_X - 1.9, 13.4, 0.32, 0.32, '#f2c94c')), F(E(FACE_X + 1.9, 13.4, 0.32, 0.32, '#f2c94c')));
      continue;
    }
    if (e === 'scar') {
      // An old scar down through her far eyebrow, with its stitch marks.
      const sx = FACE_X - EYE_DX - 0.4;
      out.push(stroke([[sx - 0.8, EYE_Y - 4.6], [sx + 0.2, EYE_Y - 1.8]], 0.5, '#c8645a'), stroke([[sx + 0.1, EYE_Y + 1.6], [sx + 0.9, EYE_Y + 3.4]], 0.5, '#c8645a'));
      for (const t of [0.25, 0.75]) {
        const [px, py] = [sx - 0.8 + 1 * t, EYE_Y - 4.6 + 2.8 * t];
        out.push(stroke([[px - 0.6, py + 0.2], [px + 0.6, py - 0.2]], 0.35, '#c8645a'));
      }
      continue;
    }
    if (e === 'onifang') {
      // One little fang peeking down from the lip at the near corner (cute).
      out.push(F(T([[FACE_X + 0.8, MY + 0.3], [FACE_X + 2, MY + 0.3], [FACE_X + 1.4, MY + 1.9]], '#ffffff')));
      continue;
    }
    if (e === 'onifangs') {
      // An oni's fangs: two short white fangs standing up from the lower lip at the mouth's corners.
      for (const side of [-1, 1]) out.push(F(T([[FACE_X + side * 0.9, MY + 0.9], [FACE_X + side * 2, MY + 0.9], [FACE_X + side * 1.5, MY - 0.7]], '#ffffff')));
      continue;
    }
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
    } else if (e.startsWith('hearts')) {
      // Little hearts float up from beside the head, each a beat apart, swelling as they rise.
      const n = Number(e.slice(6)) || 0;
      const hp = (hx, hy, k) => F(T([[hx, hy + 1.2 * k], [hx - 1.5 * k, hy - 0.1 * k], [hx - 1.2 * k, hy - 1.1 * k], [hx - 0.4 * k, hy - 1.2 * k], [hx, hy - 0.6 * k], [hx + 0.4 * k, hy - 1.2 * k], [hx + 1.2 * k, hy - 1.1 * k], [hx + 1.5 * k, hy - 0.1 * k]], '#ff5f8f'));
      out.push(hp(0.6 - (n % 2) * 0.3, 8 - n * 1.3, 0.8 + n * 0.12), hp(30.8 + ((n + 1) % 2) * 0.3, 6 - ((n + 2) % 4) * 1.3, 0.8 + ((n + 2) % 4) * 0.12));
    } else if (e.startsWith('tear')) {
      // A tear rolls from each outer corner down the cheek; `tears` (no number) streams.
      for (const side of [-1, 1]) {
        const tx = FACE_X + (EYE_DX + 1.5) * side;
        if (e === 'tears') out.push(F(R(tx - 0.45, 20, 0.9, 4.2, '#9fdcff')), F(E(tx, 24.4, 0.8, 0.6, '#9fdcff')));
        else {
          const ty = 20.8 + (Number(e.slice(4)) || 0) * 0.9;
          out.push(F(E(tx, ty, 0.6, 0.8, '#9fdcff')), F(T([[tx - 0.5, ty - 0.3], [tx + 0.5, ty - 0.3], [tx, ty - 1.4]], '#9fdcff')), F(E(tx - 0.2, ty, 0.2, 0.25, '#ffffff')));
        }
      }
    } else if (e.startsWith('zzz')) {
      // Sleepy z's drifting up and out, bigger as they go.
      const n = Number(e.slice(3)) || 0;
      for (let j = 0; j <= Math.min(1, n); j++) {
        const k = 0.9 + (n - j) * 0.3;
        const [zx, zy] = [27.6 + (n - j) * 1.6, 3.6 - (n - j) * 2.6];
        out.push(stroke([[zx - k, zy - k], [zx + k, zy - k]], 0.45, '#8f7cc4'), stroke([[zx + k, zy - k], [zx - k, zy + k]], 0.45, '#8f7cc4'), stroke([[zx - k, zy + k], [zx + k, zy + k]], 0.45, '#8f7cc4'));
      }
    } else if (e.startsWith('steam')) {
      // Huffing: a puff of steam blows out from each side of the head.
      const n = Number(e.slice(5)) || 0;
      for (const side of [-1, 1]) {
        const px = FACE_X + side * (12.5 + n * 0.9);
        const py = 7 - n * 0.8;
        out.push(F(E(px, py, 1.2 + n * 0.3, 1 + n * 0.25, '#ffffff')), F(E(px + side * 1.1, py - 0.7, 0.8 + n * 0.2, 0.7 + n * 0.2, '#f1eefb')));
      }
    } else if (e.startsWith('bang')) {
      // A red "!" popping in over the head: it overshoots big, then settles.
      const k = [0.6, 1.35, 1, 1][Number(e.slice(4)) || 0] ?? 1;
      const [bx, by] = [28.4, 1.6];
      out.push(F(T([[bx - 0.6 * k, by - 2.6 * k], [bx + 0.6 * k, by - 2.6 * k], [bx + 0.3 * k, by + 0.5 * k], [bx - 0.3 * k, by + 0.5 * k]], '#ff4d6d')), F(E(bx, by + 1.6 * k, 0.55 * k, 0.55 * k, '#ff4d6d')));
    } else if (e === 'q') {
      // A puzzled "?" over the head.
      const [qx, qy] = [28.6, 0.4];
      out.push(arc(qx, qy - 0.6, 1.3, 1.2, 190, 400, 0.6, '#8f7cc4'), F(R(qx - 0.3, qy + 0.5, 0.6, 1.2, '#8f7cc4')), F(E(qx, qy + 2.6, 0.4, 0.4, '#8f7cc4')));
    } else if (e === 'gloom') {
      // Gloom: blue lines hanging down over the forehead.
      for (const [gx, gl] of [[-3.4, 3.2], [-1.2, 4.2], [1.2, 3.6], [3.4, 2.8]]) out.push(F(R(FACE_X + gx - 0.25, 10.4, 0.5, gl, '#9a8fd8')));
    } else if (e.startsWith('orbit')) {
      // Knocked silly: three little stars circling over the head.
      const n = Number(e.slice(5)) || 0;
      for (let j = 0; j < 3; j++) {
        const a = ((n / 8) + j / 3) * Math.PI * 2;
        const back = Math.sin(a) < 0;
        out.push(star(FACE_X + Math.cos(a) * 8, 3.4 + Math.sin(a) * 1.6, back ? 0.9 : 1.4, back ? '#ffe9a6' : '#ffe36b'));
      }
    } else if (e === 'drop') {
      // One big comic sweat drop on the side of the head.
      const [sx, sy] = [27.2, 7.6];
      out.push(F(E(sx, sy, 1.5, 1.8, '#9fdcff')), F(T([[sx - 1.2, sy - 0.7], [sx + 1.2, sy - 0.7], [sx, sy - 3.6]], '#9fdcff')), F(E(sx - 0.5, sy - 0.1, 0.4, 0.6, '#ffffff')));
    } else if (e === 'shock') {
      // Shock lines flaring out around the head.
      for (const a of [-160, -130, -50, -20]) {
        const r = (a * Math.PI) / 180;
        out.push(stroke([[FACE_X + Math.cos(r) * 13, 10 + Math.sin(r) * 11], [FACE_X + Math.cos(r) * 15.4, 10 + Math.sin(r) * 13]], 0.55, '#ff7b9a'));
      }
    } else if (e.startsWith('dots')) {
      // "..." appearing one dot at a time.
      const n = Number(e.slice(4)) || 3;
      for (let j = 0; j < n; j++) out.push(F(E(26.4 + j * 1.6, 1.8, 0.45, 0.45, '#8f7cc4')));
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
      const f = { lid: 0.2, cross: 0.9, mouth: 'grit', brows: [[-0.2, 0.9], [-0.2, 0.9]], extra: [win(p, 0, 0.5) ? 'veinbig' : 'vein'] };
      // Now and then a huff: a shout and steam blowing from both sides.
      const huff = at(5);
      if (win(huff, 0.6, 0.85)) Object.assign(f, { mouth: 'yell', extra: [...f.extra, `steam${Math.min(2, Math.floor((huff - 0.6) * 12))}`] });
      return f;
    }
    case 'excited': {
      const p = at(0.8);
      return { mouth: win(at(2.4), 0.5, 1) ? 'open' : 'grin', shine: true, brows: [[0.8, -0.2], [0.8, -0.2]], extra: [win(p, 0, 0.5) ? 'spark1' : 'spark0'] };
    }
    case 'love': {
      // Heart eyes and floating hearts; every few seconds a dreamy sigh with the eyes shut.
      const p = at(3.6);
      const f = { heart: true, mouth: 'cat', blush: 1.7, brows: [[0.7, -0.3], [0.7, -0.3]], extra: [`hearts${Math.floor(t * 4) % 4}`] };
      if (win(p, 0.62, 0.86)) Object.assign(f, { heart: false, closed: [true, true], mouth: 'kiss' });
      return f;
    }
    case 'sleepy': {
      // Lids drift down, the head nods off (eyes shut, z's), then a big yawn wakes it.
      const p = at(6);
      const f = { lid: 0.55, mouth: 'tiny', brows: [[0.1, -0.2], [0.1, -0.2]] };
      if (win(p, 0.2, 0.35)) f.lid = 0.75;
      else if (win(p, 0.35, 0.68)) Object.assign(f, { closed: ['blink', 'blink'], mouth: 'o', extra: [`zzz${Math.min(3, Math.floor((p - 0.35) * 14))}`] });
      else if (win(p, 0.72, 0.9)) Object.assign(f, { closed: ['hurt', 'hurt'], mouth: 'yawn', brows: [[0.6, -0.4], [0.6, -0.4]], extra: ['tear0'] });
      return f;
    }
    case 'sad': {
      // Welling eyes and a wobbling lip; a tear rolls down, then a sob with gloom lines.
      const p = at(4.4);
      const f = { teary: Math.floor(t * 4) % 2 ? 2 : 1, look: 'down', mouth: 'frown', brows: [[0.5, -0.8], [0.5, -0.8]], blush: 1.2 };
      if (win(p, 0.3, 0.6)) f.extra = [`tear${Math.min(3, Math.floor((p - 0.3) * 14))}`];
      if (win(p, 0.68, 0.92)) Object.assign(f, { teary: 0, closed: ['hurt', 'hurt'], mouth: Math.floor(t * 8) % 2 ? 'sob' : 'sob2', extra: ['tears', 'gloom'] });
      return f;
    }
    case 'shock': {
      // A snap to wide eyes with a "!" that pops in and settles, a gasp, sweat; then it calms.
      const p = at(3.4);
      const f = { mouth: 'tiny', brows: [[0.4, -0.2], [0.4, -0.2]] };
      if (win(p, 0.15, 0.7)) Object.assign(f, { wide: true, mouth: win(p, 0.15, 0.4) ? 'gasp' : 'o', brows: [[1.3, -0.3], [1.3, -0.3]], extra: [`bang${Math.min(3, Math.floor((p - 0.15) * 20))}`, 'drop', ...(win(p, 0.15, 0.3) ? ['shock'] : [])] });
      return f;
    }
    case 'playful': {
      // A wink with the tongue out and a sparkle, swapping eyes now and then.
      const p = at(3.2);
      const right = win(p, 0, 0.5);
      const f = { mouth: 'tongue', brows: right ? [[0.7, -0.3], [0, 0.2]] : [[0, 0.2], [0.7, -0.3]], closed: right ? [false, true] : [true, false], extra: [`spark${Math.floor(t * 4) % 2}`] };
      if (win(p, 0.42, 0.5) || win(p, 0.92, 1)) Object.assign(f, { closed: [false, false], mouth: 'cat', extra: [] });
      return f;
    }
    case 'proud': {
      // Eyes shut, chin up, a confident smirk; then an "ohoho" laugh in quick beats with sparkles.
      const p = at(4);
      const f = { closed: [true, true], mouth: 'smirk', brows: [[0.9, -0.4], [0.9, -0.4]], look: 'up' };
      if (win(p, 0.5, 0.85)) Object.assign(f, { mouth: Math.floor(t * 8) % 2 ? 'D' : 'grin', extra: [`spark${Math.floor(t * 8) % 2}`] });
      return f;
    }
    case 'dizzy': {
      // Spinning eyes, a wavy mouth and stars circling the head.
      return { spiral: 1 + (Math.floor(t * 8) % 4) * 1.5, mouth: Math.floor(t * 4) % 2 ? 'wavy' : 'frown', brows: [[0.3, -0.5], [0.3, -0.5]], extra: [`orbit${Math.floor(t * 8) % 8}`, 'sweat0'] };
    }
    case 'nervous': {
      // Eyes dart side to side, sweat slides, a wobbly mouth; a gulp now and then.
      const p = at(3);
      const dart = [1, 1, -1, -1, 0, 1, -1, 0][Math.floor(t * 4) % 8];
      const f = { glance: dart, mouth: 'wavy', brows: [[0.6, -0.7], [0.6, -0.7]], blush: 1.2, extra: [`sweat${Math.round(p * 4)}`] };
      if (win(p, 0.7, 0.8)) Object.assign(f, { glance: 0, wide: true, mouth: 'o', extra: [...f.extra, 'drop'] });
      return f;
    }
    case 'giggle': {
      // Eyes squeezed into happy arcs, the mouth bouncing between a "w" and a laugh, notes.
      const p = at(2.8);
      const beat = Math.floor(t * 6) % 2;
      const f = { closed: [true, true], mouth: beat ? 'cat' : 'meow', blush: 1.5, brows: [[0.5, -0.3], [0.5, -0.3]] };
      if (win(p, 0.4, 0.75)) f.extra = ['note'];
      if (win(p, 0.85, 1)) Object.assign(f, { closed: [false, false], mouth: 'cat' });
      return f;
    }
    case 'determined': {
      // Set eyes and a firm mouth; a glint flashes in the eyes and the jaw sets in a grit.
      const p = at(3.8);
      const f = { lid: 0.22, cross: 0.4, mouth: 'flat', brows: [[-0.3, 0.6], [-0.3, 0.6]] };
      if (win(p, 0.55, 0.7)) Object.assign(f, { shine: true, mouth: 'grit', extra: ['spark1'] });
      return f;
    }
    // Sassy.
    // The attitude faces, reworked to be livelier and cuter (the player's ask, 2026-11-01): each
    // loop runs four or five beats instead of two, with blushes, sparkles and hearts on its
    // happiest beat, and the body acting (idleActing) moves on the same beats.
    case 'bleh': {
      // A wink and a tongue out; the tongue waggles; she peeks at you with a ":3"; a giggle with
      // her eyes shut; a cheeky wink with the other eye.
      const p = at(3.2);
      const tick = Math.floor(t * 8) % 2;
      if (win(p, 0, 0.2)) return { closed: [false, true], mouth: 'bleh', brows: [[0.6, -0.3], [1, -0.4]], blush: 1 };
      if (win(p, 0.2, 0.36)) return { closed: [false, true], mouth: tick ? 'bleh' : 'bigtongue', brows: [[0.7, -0.3], [1.1, -0.4]], blush: 1.1, extra: ['spark0'] };
      if (win(p, 0.36, 0.55)) return { lid: 0.2, glance: 1, mouth: 'cat', brows: [[0.5, -0.2], [0.9, -0.3]], blush: 1 };
      if (win(p, 0.55, 0.72)) return { closed: [true, true], mouth: 'grin', brows: [[0.8, -0.3], [0.8, -0.3]], blush: 1.4, extra: ['spark1'] };
      return { closed: [true, false], mouth: 'tongue', brows: [[1, -0.4], [0.6, -0.3]], blush: 1.1, extra: ['spark0'] };
    }
    case 'excuseme': {
      // One eye narrowed, a brow shot up; it hops; she looks away, lips pursed; a blink "hmph";
      // then a peek back with a little smirk and a blush.
      const p = at(3.6);
      if (win(p, 0, 0.25)) return { lids: [0.55, 0], mouth: 'sneer', brows: [[-0.1, 0.4], [1.7, -0.5]] };
      if (win(p, 0.25, 0.4)) return { lids: [0.55, 0], mouth: 'o', brows: [[-0.1, 0.4], [Math.floor(t * 8) % 2 ? 2.2 : 1.8, -0.6]], extra: ['vein'] };
      if (win(p, 0.4, 0.6)) return { lids: [0.6, 0.3], glance: -1, mouth: 'pursed', brows: [[0.2, 0.2], [1.2, -0.4]] };
      if (win(p, 0.6, 0.75)) return { closed: ['blink', 'blink'], mouth: 'pursed', brows: [[1, -0.3], [1.2, -0.4]] };
      return { lid: 0.4, glance: 1, mouth: 'smirk', brows: [[0.2, 0.1], [1.4, -0.5]], blush: 1 };
    }
    case 'dimple': {
      // A sly smile, eyes away; she looks back and winks; a happy squint with hearts; then a
      // shy look down, pink to the ears.
      const p = at(3.4);
      if (win(p, 0, 0.3)) return { lid: 0.32, glance: 1, mouth: 'slysmile', brows: [[0.1, 0.2], [0.9, -0.4]], blush: 1.1 };
      if (win(p, 0.3, 0.45)) return { closed: [false, true], mouth: 'slysmile', brows: [[0.3, 0.1], [1, -0.4]], blush: 1.4, extra: ['spark0'] };
      if (win(p, 0.45, 0.68)) return { closed: [true, true], mouth: 'cat', brows: [[0.6, -0.2], [0.6, -0.2]], blush: 1.6, extra: [`hearts${Math.floor(((p - 0.45) / 0.23) * 4)}`] };
      return { lid: 0.35, look: 'down', glance: -0.5, mouth: 'tiny', brows: [[0.8, 0.3], [0.8, 0.3]], blush: 1.4 };
    }
    case 'mmhm': {
      // "Sure.": a flat sideways stare; a slow roll of the eyes up and over; a long blink; a sigh
      // that puffs out; then a side-eye.
      const p = at(4);
      if (win(p, 0, 0.25)) return { lid: 0.5, glance: -1, mouth: 'pursed', brows: [[1.2, -0.3], [0.2, 0.1]] };
      if (win(p, 0.25, 0.37)) return { lid: 0.3, look: 'up', glance: -0.4, mouth: 'pursed', brows: [[1.4, -0.3], [0.6, -0.1]] };
      if (win(p, 0.37, 0.49)) return { lid: 0.3, look: 'up', glance: 0.6, mouth: 'pursed', brows: [[1.4, -0.3], [0.6, -0.1]] };
      if (win(p, 0.49, 0.62)) return { closed: ['blink', 'blink'], mouth: 'bored', brows: [[1, -0.2], [0.4, 0]] };
      if (win(p, 0.62, 0.78)) return { lid: 0.55, mouth: 'o', brows: [[0.8, -0.2], [0.3, 0]], extra: ['sighpuff'] };
      return { lid: 0.55, glance: 1, mouth: 'flat', brows: [[1.1, -0.3], [0.2, 0.1]] };
    }
    case 'hmph': {
      // "How common.": eyes shut, nose up; one eye peeks to see if you're impressed; caught
      // looking, she shuts it tight and puffs her cheeks, pink; a little huff.
      const p = at(3.8);
      if (win(p, 0, 0.32)) return { closed: ['blink', 'blink'], mouth: 'pursed', brows: [[1.3, -0.4], [1.3, -0.4]] };
      if (win(p, 0.32, 0.5)) return { closed: ['blink', false], lid: 0.45, glance: 1, mouth: 'pursed', brows: [[1.3, -0.4], [0.7, -0.1]] };
      if (win(p, 0.5, 0.56)) return { closed: ['blink', false], lid: 0.1, glance: 1, mouth: 'o', brows: [[1.3, -0.4], [1.4, -0.4]], blush: 1 };
      if (win(p, 0.56, 0.8)) return { closed: ['blink', 'blink'], mouth: 'pout', brows: [[1.5, -0.5], [1.5, -0.5]], blush: 1.4 };
      return { closed: ['blink', 'blink'], mouth: 'pursed', brows: [[1.3, -0.4], [1.3, -0.4]], blush: 1, extra: ['sighpuff'] };
    }
    case 'judging': {
      // Looking you up and down through a narrowed eye, scanning; the eyes narrow; a doubtful
      // "hmm" with a brow up; then a slow nod of a blink.
      const p = at(4);
      if (win(p, 0, 0.22)) return { lids: [0.62, 0.15], look: 'down', mouth: 'bored', brows: [[-0.2, 0.4], [1.4, -0.4]] };
      if (win(p, 0.22, 0.36)) return { lids: [0.62, 0.15], look: 'up', glance: -0.6, mouth: 'bored', brows: [[-0.2, 0.4], [1.4, -0.4]] };
      if (win(p, 0.36, 0.5)) return { lids: [0.62, 0.15], look: 'down', glance: 0.8, mouth: 'bored', brows: [[-0.2, 0.4], [1.4, -0.4]] };
      if (win(p, 0.5, 0.68)) return { lids: [0.8, 0.4], mouth: 'flat', brows: [[-0.4, 0.5], [1, -0.3]] };
      if (win(p, 0.68, 0.86)) return { lids: [0.5, 0.1], mouth: 'o', brows: [[0, 0.3], [Math.floor(t * 8) % 2 ? 1.9 : 1.6, -0.5]] };
      return { closed: ['blink', 'blink'], mouth: 'flat', brows: [[0, 0.3], [1.2, -0.4]] };
    }
    case 'ohoho': {
      // "Ohohoho!": eyes shut, the laugh in quick beats with sparkles; she peeks with a satisfied
      // smile, pink; then one more trill of a laugh.
      const p = at(3.2);
      const tick = Math.floor(t * 8) % 2;
      if (win(p, 0, 0.5)) return { closed: [true, true], mouth: tick ? 'ohoho' : 'smirk', brows: [[1, -0.4], [1, -0.4]], extra: [tick ? 'spark1' : 'spark0'] };
      if (win(p, 0.5, 0.72)) return { lid: 0.3, mouth: 'slysmile', brows: [[0.8, -0.3], [1.1, -0.4]], blush: 1.1 };
      if (win(p, 0.72, 0.9)) return { closed: [true, true], mouth: tick ? 'ohoho' : 'slysmile', brows: [[1.1, -0.4], [1.1, -0.4]], blush: 1, extra: ['spark0'] };
      return { lid: 0.35, mouth: 'slysmile', brows: [[0.8, -0.3], [1, -0.4]] };
    }
    case 'sneer': {
      // A sneer down the nose; the lip curls higher; the eyes slide away, done with you; a snort;
      // then back to looking down on you.
      const p = at(4);
      if (win(p, 0, 0.3)) return { lid: 0.6, look: 'down', mouth: 'sneer', brows: [[0.8, -0.3], [1.2, -0.4]] };
      if (win(p, 0.3, 0.45)) return { lid: 0.7, look: 'down', mouth: 'sneer', brows: [[1, -0.3], [1.6, -0.5]] };
      if (win(p, 0.45, 0.65)) return { lid: 0.55, glance: -1, mouth: 'bored', brows: [[0.8, -0.3], [1.1, -0.4]] };
      if (win(p, 0.65, 0.76)) return { closed: ['blink', 'blink'], mouth: 'pursed', brows: [[1.1, -0.4], [1.3, -0.4]], extra: ['sighpuff'] };
      return { lid: 0.6, look: 'down', mouth: 'smirk', brows: [[0.8, -0.3], [1.2, -0.4]] };
    }
    case 'heh': {
      // "Heh~": eyes closed, pleased with herself; one eye opens to check on you; the smile curls
      // into a ":3"; a giggle with sparkles; then a contented hum.
      const p = at(3.4);
      if (win(p, 0, 0.28)) return { closed: [true, true], mouth: 'slysmile', brows: [[0.6, -0.3], [0.9, -0.4]], blush: 1.1 };
      if (win(p, 0.28, 0.44)) return { closed: [true, false], lid: 0.3, glance: 1, mouth: 'slysmile', brows: [[0.6, -0.3], [1.1, -0.4]], blush: 1.1 };
      if (win(p, 0.44, 0.58)) return { closed: [true, false], lid: 0.3, glance: 1, mouth: 'smugcat', brows: [[0.6, -0.3], [1.3, -0.5]], blush: 1.2 };
      if (win(p, 0.58, 0.78)) return { closed: [true, true], mouth: Math.floor(t * 8) % 2 ? 'smugcat' : 'grin', brows: [[0.8, -0.3], [0.8, -0.3]], blush: 1.4, extra: ['spark0'] };
      return { closed: [true, true], mouth: 'tiny', brows: [[0.6, -0.3], [0.8, -0.3]], blush: 1.2 };
    }
    case 'smugcat': {
      // A lopsided ":3"; a pleased squint, pink; a brow hops; a "nya~" with a sparkle; then the
      // smug look again, a slow blink.
      const p = at(3.6);
      if (win(p, 0, 0.26)) return { lid: 0.5, mouth: 'smugcat', brows: [[0.1, 0.2], [1, -0.4]] };
      if (win(p, 0.26, 0.44)) return { closed: [true, true], mouth: 'smugcat', brows: [[0.4, -0.1], [1, -0.4]], blush: 1.3 };
      if (win(p, 0.44, 0.56)) return { lid: 0.45, mouth: 'smugcat', brows: [[0.1, 0.2], [Math.floor(t * 8) % 2 ? 1.6 : 1.1, -0.5]] };
      if (win(p, 0.56, 0.76)) return { closed: [false, true], lid: 0.2, mouth: 'meow', brows: [[0.6, -0.2], [0.9, -0.3]], blush: 1.2, extra: ['spark1'] };
      if (win(p, 0.86, 0.94)) return { closed: ['blink', 'blink'], mouth: 'smugcat', brows: [[0.1, 0.2], [1, -0.4]] };
      return { lid: 0.5, glance: 0.6, mouth: 'smugcat', brows: [[0.1, 0.2], [1, -0.4]] };
    }
    case 'toldyou': {
      // "Told you so.": a side glance and a wide smirk; she turns to look right at you, brows up;
      // a wink; then a bright grin with a sparkle, very pleased.
      const p = at(3.8);
      if (win(p, 0, 0.3)) return { lid: 0.45, glance: 1, mouth: 'smirkwide', brows: [[0, 0.3], [1.3, -0.5]] };
      if (win(p, 0.3, 0.48)) return { lid: 0.3, mouth: 'smirkwide', brows: [[0.7, -0.2], [1.5, -0.5]] };
      if (win(p, 0.48, 0.6)) return { closed: [false, true], mouth: 'smirkwide', brows: [[0.7, -0.2], [1.5, -0.5]], blush: 1 };
      if (win(p, 0.6, 0.8)) return { closed: [true, true], mouth: 'grin', brows: [[0.9, -0.3], [0.9, -0.3]], blush: 1.2, extra: ['spark1'] };
      return { lid: 0.4, glance: 0.5, mouth: 'smirk', brows: [[0.2, 0.2], [1.2, -0.4]] };
    }
    case 'lookdown': {
      // Chin up, looking down on you with a wide smirk; a slow, superior blink; a lazy smile; a
      // little "ohoho" behind it; then the stare again.
      const p = at(4.2);
      if (win(p, 0, 0.3)) return { lid: 0.62, look: 'down', mouth: 'smirkwide', brows: [[0.9, -0.3], [1.2, -0.4]] };
      if (win(p, 0.3, 0.42)) return { closed: ['blink', 'blink'], mouth: 'smirkwide', brows: [[1, -0.3], [1.3, -0.4]] };
      if (win(p, 0.42, 0.6)) return { lid: 0.7, look: 'down', mouth: 'slysmile', brows: [[0.9, -0.3], [1.2, -0.4]] };
      if (win(p, 0.6, 0.78)) return { closed: [true, true], mouth: Math.floor(t * 8) % 2 ? 'ohoho' : 'slysmile', brows: [[1.1, -0.4], [1.1, -0.4]], blush: 0.9, extra: ['spark0'] };
      return { lid: 0.62, look: 'down', glance: 0.4, mouth: 'smirkwide', brows: [[0.9, -0.3], [1.2, -0.4]] };
    }
    default: {
      const p = at(5);
      return win(p, 0.6, 0.78) ? { mouth: 'grin', closed: [true, true] } : { mouth: 'smile' };
    }
  }
}

// What the face does right now: the look's own expression, unless the moment calls for another.
// Knocked out, the eyes spin under circling stars; attacking, the face winds up (narrowed eyes,
// set jaw), shouts on the blow and grins after; jumping, it whoops on the way up and gasps on the
// way down; after a fight it stays set and focused; low on health it frets and sweats. At rest
// the eyes wander now and then. Sampled at FACE_FPS like the expressions.
function liveFace(look, state, mv) {
  const time = Math.floor(((state.time ?? 0) + (state.seed ?? 0) * 1.37) * FACE_FPS) / FACE_FPS;
  const beat = (n) => Math.floor(time * n);
  const pose = state.pose ?? 'idle';
  if (state.down) return { spiral: 1 + (beat(8) % 4) * 1.5, mouth: beat(3) % 2 ? 'wavy' : 'o', brows: [[0.3, -0.5], [0.3, -0.5]], extra: [`orbit${beat(8) % 8}`] };
  // Endless Fox-Fire: her face builds with the barrage, not with each throw (that would flicker):
  // a fox spirit at play, never strained: sly, then playful (a cheeky tongue now and then), then a
  // thrilled fanged grin, then flat out, laughing.
  if (mv && state.flow) {
    const h = state.flow.heat;
    if (h < 0.45) return { lid: 0.2, mouth: 'smirk', brows: [[0, 0.3], [0.5, -0.2]] };
    if (h < 0.9) return { lid: 0.1, mouth: beat(5) % 3 ? 'grin' : 'tongue', brows: [[0.3, 0.2], [0.5, -0.1]] };
    if (h < 1.4) return { lid: 0.05, mouth: beat(4) % 3 ? 'fang' : 'D', brows: [[0.1, 0.6], [0.1, 0.6]] };
    return { mouth: beat(4) % 2 ? 'D' : 'grin', brows: [[0.6, 0.1], [0.6, 0.1]], closed: beat(3) % 4 === 0 ? [true, true] : null };
  }
  if (mv) {
    const p = state.progress ?? 0;
    if (p < 0.3) return { lid: 0.25, cross: 0.5, mouth: 'grit', brows: [[-0.3, 0.7], [-0.3, 0.7]] };
    if (p < 0.7) return { lid: 0.1, cross: 0.6, mouth: 'yell', brows: [[-0.1, 0.8], [-0.1, 0.8]] };
    return { lid: 0.15, mouth: 'smirk', brows: [[0, 0.3], [0.5, -0.2]] };
  }
  if (pose === 'jump') {
    return (state.vy ?? -1) < 0 ? { mouth: 'D', brows: [[0.9, -0.3], [0.9, -0.3]] } : { mouth: 'o', brows: [[1.1, -0.4], [1.1, -0.4]], look: 'down' };
  }
  const base = faceFrame(look.face ?? 'smile', time);
  if (state.low) {
    // Frets: worried brows, a wobbly mouth, sweat sliding and a nervous glance back and forth.
    const p = (time % 2.4) / 2.4;
    return { ...base, closed: null, heart: false, brows: [[0.6, -0.7], [0.6, -0.7]], mouth: 'wavy', glance: p > 0.5 && p < 0.7 ? -1 : p > 0.75 && p < 0.9 ? 1 : 0, extra: [`sweat${Math.round(p * 4)}`] };
  }
  if (state.ready && pose === 'idle') return { ...base, lid: Math.max(base.lid ?? 0, 0.15), cross: Math.max(base.cross ?? 0, 0.35), brows: [[-0.2, 0.5], [-0.2, 0.5]] };
  // At rest the eyes wander: a look one way, a look the other, each held a moment.
  if (base.glance === undefined && !base.closed && !base.spiral) {
    const p = (time * 0.23 + (state.seed ?? 0) * 0.17) % 1;
    if (p > 0.3 && p < 0.42) return { ...base, glance: 1 };
    if (p > 0.7 && p < 0.8) return { ...base, glance: -1, look: 'up' };
  }
  return base;
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
  const hairNow = hairOf(look, rig);
  if (!tucked) out.push(...hairNow.head);
  if (g.face) out.push(...hatBackShapes(g.face.design, g.face.color, g.face, m));
  if (hat) out.push(...hatBackShapes(hat.design, hat.color, hat, m));
  // Facing the screen: a round head with soft full cheeks, an ear peeking out on each side, big
  // eyes set low and wide apart, blush under each eye and a small mouth in the middle. The skin
  // is flat colour from its own ramp: the light comes from the upper front (the facing side, on
  // the right), so the back ear and a thin crescent down the back of the face sit in shadow.
  const ears = look.earStyle ?? 'round';
  if (ears === 'bunny') {
    // Viera ears: tall, furred in the hair's colour, pink inside, the far one a shade darker.
    const bunny = (c, inner, lean) => [F(T([[17.4, 7], [17.2, 1], [17.6 + lean * 0.3, -5], [18.6 + lean, -10.6], [20.4 + lean, -11.4], [21.6 + lean * 0.8, -8], [21.4 + lean * 0.4, -1], [20.6, 7]], c)),
      F(T([[18.4, 4], [18.4, -1], [19 + lean * 0.5, -6.6], [19.8 + lean, -9.4], [20.6 + lean * 0.8, -7.6], [20.4 + lean * 0.4, -1], [19.8, 4]], inner))];
    out.push(...mirror(bunny(hr.sh1, '#e88ab4', 1.4)), ...bunny(hr.base, '#ffa8cc', 1.8));
  } else if (ears === 'fox') {
    // Fox ears: tall, slender and sharply pointed, standing straight up from the head and turned
    // a little out, furred in the hair's colour with a pink hollow and their points dipped in
    // `look.earTip` (a kitsune's vermilion); the far one a shade darker. rig.ears turns each.
    const tipC = look.earTip ?? hr.base;
    const fox = (c, inner, tipc) => [F(T([[17.2, 7.0], [18.6, 3.6], [20.2, 0.2], [22.0, -3.6], [23.4, -6.6], [24.6, -7.4], [25.4, -3.6], [25.8, 1.0], [25.6, 5.4], [25.0, 9.4]], c)),
      F(T([[19.2, 6.6], [20.4, 3.4], [21.8, 0.2], [23.2, -2.8], [24.2, -4.4], [24.4, -0.6], [24.2, 3.6], [23.8, 7.8]], inner)),
      F(T([[22.0, -3.6], [23.4, -6.6], [24.6, -7.4], [25.4, -3.6], [25.6, -2.0], [23.6, -1.6]], tipc))];
    const [near, far] = rig.ears ?? [0, 0];
    out.push(...roll(mirror(fox(hr.sh1, '#e8a6a8', shade(tipC, -14))), 9.8, 7.8, -far), ...roll(fox(hr.base, '#ffc4c0', tipC), 21.2, 7.8, near));
  } else if (ears === 'wolf') {
    // Wolf ears: tall and pointed, set up on the head and turned a little out, furred in the hair's
    // colour with a pale fluff inside; the far one a shade darker.
    const fluff = mix(hr.base, '#fff4ee', 0.6);
    const wolf = (c, inner) => [F(T([[17.0, 6.6], [18.8, 3.4], [21.0, 0.6], [23.6, -2.4], [24.8, -3.0], [25.2, 0.6], [25.4, 4.4], [25.0, 9.4]], c)),
      F(T([[19.0, 6.4], [20.6, 3.8], [22.6, 1.0], [23.9, -0.6], [24.0, 3.2], [23.8, 7.8]], inner)),
      F(T([[20.2, 6.6], [21.4, 4.8], [22.4, 3.6], [21.8, 5.6], [22.6, 5.0], [22.2, 7.2]], c))];
    const [near, far] = rig.ears ?? [0, 0];
    out.push(...roll(mirror(wolf(hr.sh1, mix(fluff, hr.sh1, 0.35))), 9.8, 7.8, -far), ...roll(wolf(hr.base, fluff), 21.2, 7.8, near));
  } else out.push(...mirror(earShapes(ears, sk.sh1, sk.sh2)), ...earShapes(ears, skin, sk.sh1));
  out.push(F(E(FACE_X, 15, 10.2, 9.8, sk.sh1)), F(E(FACE_X, 19, 9.4, 5.8, sk.sh1)));
  out.push(F(E(FACE_X + 0.6, 15, 9.6, 9.8, skin)), F(E(FACE_X + 0.5, 19, 8.9, 5.8, skin)));
  // A hurt or knocked-out face drops the expression's own play (sparkles, notes, winks, puffed
  // cheeks): pain squeezes the brows together and a sweat drop flies; out cold, the brows go slack.
  let f = rig.face ?? {};
  // A look can keep the eyes half closed (heavy lids), or keep one mouth, whatever the expression.
  if (look.lid) f = { ...f, lid: Math.max(f.lid ?? 0, look.lid) };
  if (look.mouth) f = { ...f, mouth: look.mouth };
  // A look can wear marks on its face always (a kitsune's shrine make-up), whatever the expression.
  if (look.marks) f = { ...f, extra: [...(f.extra ?? []), ...look.marks] };
  if (rig.eyes === 'hurt') f = { brows: [[0.5, 0.7], [0.5, 0.7]], extra: ['sweat0'] };
  else if (rig.eyes === 'dead') f = { brows: [[0.2, -0.3], [0.2, -0.3]] };
  else if (rig.mouth && f.puff) f = { ...f, puff: false };
  // The eye-cover lock hides the right eye and brow, so a wink or a raised brow moves to the eye
  // that shows.
  const covered = coversEye(style, look.hairBangs) && !hatHidesBangs(hat);
  if (covered) f = { ...f, closed: f.closed && [...f.closed].reverse(), brows: f.brows && [...f.brows].reverse() };
  if (f.puff) for (const cx of [FACE_X - 7.6, FACE_X + 7.6]) out.push(F(E(cx, 20.8, 2.8, 2.6, skin)));
  // The bangs' shadow on the forehead (under the eyes, so lashes stay on top).
  const front = hatHidesBangs(hat) ? null : hairNow.front;
  if (front) out.push(...front.shade.map((sh) => ({ ...sh, c: sk.sh1 })));
  // Blush: a soft two-tone patch on each cheek, clear of the eyes; flustered faces add hatching.
  const blush = look.blush ?? f.blush ?? 1;
  for (const side of [-1, 1]) {
    const bx = FACE_X + 6.1 * side;
    const k = side < 0 ? 0.8 : 1;
    out.push(F(E(bx, 21.9, 1.8 * blush * k, 0.75 * blush, mix(skin, sk.blush, 0.55))), F(E(bx, 21.9, 1.0 * blush * k, 0.42 * blush, sk.blush)));
    if (blush > 1) for (const j of [-1, 0, 1]) out.push(stroke([[bx + j * 1 - 0.3, 22.4], [bx + j * 1 + 0.3, 21.2]], 0.5, sk.blushDk));
  }
  // Eyes: hurt and blinks win over the expression; otherwise the expression may close one or
  // both eyes, lower the lids, or glance aside. Angry faces pull the inner lids down.
  const cross = f.cross ?? 0;
  [-1, 1].forEach((side, i) => {
    // A closed eye is a happy arc (true) or a named lid ('blink', 'hurt'); a blink only takes an
    // open eye.
    const shut = f.closed?.[i];
    const mode = rig.eyes === 'hurt' || rig.eyes === 'dead' ? rig.eyes : shut ? (shut === true ? 'happy' : shut) : rig.eyes;
    out.push(...eye(FACE_X + EYE_DX * side, side, eyeStyle, eyeColor, mode, look, f, cross));
  });
  if (rig.eyes === 'hurt') out.push(...mouthShapes('grit', sk));
  else if (rig.eyes === 'dead') out.push(...mouthShapes('open', sk));
  else out.push(...mouthShapes(look.mouth ?? rig.mouth ?? f.mouth ?? 'smile', sk));
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
      out.push(...[brow(...args, mix(skin, sk.sh1, 0.25), browStyle, 0.42), brow(...args, hr.brow, browStyle)].flat());
    });
  }
  if (f.extra) out.push(...faceExtras(f.extra));
  // An earring under each ear.
  if (g.earring) {
    const ring = offset(earringShapes(g.earring.design, g.earring.color, g.earring), -1.6, 0);
    out.push(...ring, ...mirror(ring));
  }
  if (g.face) out.push(...hatShapes(g.face.design, g.face.color, g.face, m));
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
  // `side` swings the elbow about the shoulder-to-wrist line: 1 as solved, -1 mirrored across it
  // (bent outward, both bones keeping their length), between them toward the viewer (shorter).
  const len = Math.hypot(wx - sx, wy - sy) || 1;
  const [ux, uy] = [(wx - sx) / len, (wy - sy) / len];
  const along = (bx - sx) * ux + (by - sy) * uy;
  const mx = sx + ux * along;
  const my = sy + uy * along;
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
  return arm(sx, SHOULDER_Y, sx + out + dx, HAND_Y + dy, sleeve, long, gloved(g), skin, side);
}

// The weapon hand wears a gauntlet as a small glove, in the weapon's own look.
function gloved(g) {
  const w = g.weapon;
  if (w?.type !== 'gauntlet' || w.fun) return g;
  return { ...g, gloves: { gauntlet: lookFor('gauntlet', w.tier, w.theme, w.variant) } };
}

// Attack arms point along `angle` (0 = down, 90 = forward, 180 = up) from the front shoulder.
function aimedArm(angle, sleeve, long, g, skin) {
  const rad = (angle * Math.PI) / 180;
  const hx = FRONT_SHOULDER + Math.sin(rad) * 8.6;
  const hy = SHOULDER_Y + Math.cos(rad) * 8.6;
  return { shapes: arm(FRONT_SHOULDER, SHOULDER_Y, hx, hy, sleeve, long, gloved(g), skin), hand: [hx, hy] };
}

// ---------- Body parts per rig ----------

// Legs stand apart under the hips, one on each side.
const LEFT_LEG = 11.4;
const RIGHT_LEG = 16.6;
const LEG_MID = (LEFT_LEG + RIGHT_LEG) / 2;

// A top's sleeve colour; 'skin' is a bare arm (swimsuits, leotards, off-shoulder gowns).
const sleeveOf = (top, skin) => {
  const c = sleeveColor(top.design, top.color, top);
  return c === 'skin' ? skin : c;
};

function bodyShapes(look, g, rig) {
  const skin = look.skinTone ?? '#fff0e6';
  const top = g.top;
  const sleeve = sleeveOf(top, skin);
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
    hang = hairOf(look, rig).hang;
    hang = squash(offset(hang, ux + rig.hx, uy + rig.hy + NECK_LIFT), false);
  }
  if (g.cape) shapes.push(...offset(capeShapes(g.cape.design, g.cape.color, rig.cape, rig.flap, g.cape, m), ux, uy));
  const tail = look.tail === 'wolf' ? wolfTail(look, rig, ux, drop + rig.by * 0.5) : look.tail === 'fox' ? foxTail(look, rig, ux, drop + rig.by * 0.5) : [];
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
  return move([...tail, ...roll(hang, nx, ny, rig.tilt), ...squash(shapes), ...roll(head, nx, ny, rig.tilt)], 0, 0);
}

// A wolf tail: big and bushy, from behind the hips out to the back side and curling up, in the
// hair's colour with a shadowed underside and a pale tip; it sways with the cape spring. Drawn in
// the squashed frame, behind everything.
function wolfTail(look, rig, dx, dy) {
  const hr = hairRamp(look.hairColor ?? '#e9ebfa');
  const sway = (rig.cape ?? 0) * 0.6;
  const at = (pts) => pts.map(([x, y]) => [x + dx * KX - Math.max(0, 30 - y) * sway * 0.08, y + dy * KY]);
  const body = at([[12.6, 32.2], [9.6, 35.0], [5.4, 36.2], [1.0, 35.4], [-2.6, 33.0], [-4.8, 29.4], [-5.4, 25.4], [-4.6, 21.6], [-3.0, 19.0], [-1.6, 17.8], [-1.4, 20.6], [-0.6, 24.0], [1.2, 27.2], [4.2, 29.6], [8.2, 30.4], [12.0, 29.8]]);
  const under = at([[12.6, 32.2], [9.6, 35.0], [5.4, 36.2], [1.0, 35.4], [-2.6, 33.0], [-4.8, 29.4], [-5.4, 25.4], [-3.0, 28.6], [0.6, 31.6], [5.0, 32.8], [9.4, 32.4]]);
  const tip = at([[-5.2, 23.2], [-4.6, 21.0], [-3.0, 19.0], [-1.6, 17.8], [-1.2, 19.8], [-1.4, 21.8], [-3.0, 21.8], [-4.4, 23.6]]);
  const lock = at([[-1.6, 25.0], [0.0, 28.4], [3.0, 31.0], [0.4, 30.0], [-1.4, 27.6]]);
  // rig.tail (degrees) swings it about the root, bending more toward the tip.
  const [rx, ry] = [12.4 + dx * KX, 31 + dy * KY];
  const swing = (pts) => pts.map(([x, y]) => {
    const a = ((rig.tail ?? 0) * Math.PI / 180) * (0.35 + 0.65 * Math.min(1, Math.hypot(x - rx, y - ry) / 16));
    const [c, sn] = [Math.cos(a), Math.sin(a)];
    return [rx + (x - rx) * c - (y - ry) * sn, ry + (x - rx) * sn + (y - ry) * c];
  });
  return [F(T(swing(body), hr.base)), F(T(swing(under), hr.sh1)), F(T(swing(tip), mix(hr.base, '#ffffff', 0.7))), F(T(swing(lock), hr.sh1))];
}

// A fox tail: a great full plume from behind the hips, sweeping out behind and rising in an S,
// fuller than the wolf's, in the hair's colour with a shaded underside, tufts of fur along its
// back, and its last third dipped in `look.tailTip` (a kitsune's vermilion). rig.tail (degrees)
// swings it about the root and rig.tailCurl (degrees) curls it more toward the tip, so it can
// swish, lash and settle; it sways with the cape spring too.
function foxTail(look, rig, dx, dy) {
  const hr = hairRamp(look.hairColor ?? '#e9ebfa');
  const tipC = look.tailTip ?? '#ff7a62';
  const sway = (rig.cape ?? 0) * 0.6;
  const at = (pts) => pts.map(([x, y]) => [x + dx * KX - Math.max(0, 30 - y) * sway * 0.08, y + dy * KY]);
  const [rx, ry] = [12.4 + dx * KX, 31.4 + dy * KY];
  const swing = (pts) => pts.map(([x, y]) => {
    const u = Math.min(1, Math.hypot(x - rx, y - ry) / 22);
    const a = (((rig.tail ?? 0) * (0.35 + 0.65 * u)) + (rig.tailCurl ?? 0) * u * u) * Math.PI / 180;
    const [c, sn] = [Math.cos(a), Math.sin(a)];
    return [rx + (x - rx) * c - (y - ry) * sn, ry + (x - rx) * sn + (y - ry) * c];
  });
  const body = at([[12.8, 33.0], [9.4, 36.4], [4.6, 38.0], [-0.4, 37.6], [-4.8, 35.2], [-8.0, 31.2], [-9.4, 26.4], [-9.0, 21.4], [-7.4, 17.2], [-5.0, 14.2], [-2.6, 12.8], [-1.4, 14.6], [-2.2, 17.6], [-2.6, 21.6], [-1.6, 25.6], [0.8, 28.6], [4.4, 30.4], [8.6, 30.6], [12.2, 29.8]]);
  const under = at([[12.8, 33.0], [9.4, 36.4], [4.6, 38.0], [-0.4, 37.6], [-4.8, 35.2], [-8.0, 31.2], [-9.4, 26.4], [-6.0, 30.4], [-1.8, 33.2], [3.4, 34.6], [8.6, 34.0]]);
  const tip = at([[-9.2, 22.4], [-9.0, 21.4], [-7.4, 17.2], [-5.0, 14.2], [-2.6, 12.8], [-1.4, 14.6], [-2.2, 17.6], [-2.6, 21.6], [-3.4, 22.8], [-6.6, 23.6]]);
  const tipSh = at([[-9.2, 22.4], [-9.0, 21.4], [-7.4, 17.2], [-6.4, 18.6], [-6.6, 21.4], [-6.6, 23.6]]);
  const tufts = [[[6.4, 30.6], [5.6, 29.4], [4.6, 30.4]], [[1.6, 28.6], [0.6, 27.0], [-0.4, 28.0]], [[-1.8, 24.6], [-3.0, 23.6], [-3.4, 24.8]]].map((t) => at(t));
  return [F(T(swing(body), hr.base)), F(T(swing(under), hr.sh1)), F(T(swing(tip), tipC)), F(T(swing(tipSh), shade(tipC, -18))),
    ...tufts.map((t) => F(T(swing(t), hr.sh1)))];
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
    const back = hairOf(look, null);
    out.push(...squash(back.hang, false), ...back.head);
  }
  const hr = hairRamp(hair);
  // From behind, elf ears poke out past the back of the head (round ones hide behind it).
  if ((look.earStyle ?? 'round') !== 'round') {
    const sk = skinRamp(skin);
    out.push(...mirror(earShapes(look.earStyle, skin, sk.sh1)), ...earShapes(look.earStyle, sk.sh1, sk.sh2));
  }
  const nape = hairNape(style, hr);
  // Bald, the back of the skull shows; buns, bows and the like sit on top of it.
  out.push(...(nape.length ? [...nape, ...(hatTucks(g.hat) ? [] : hairOf(look, null).top)] : [F(E(HEAD_X, 14.6, 10.2, 10, skinRamp(skin).sh1)), F(E(HEAD_X, 14.2, 9.6, 9.6, skin))]));
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

function baseRig() {
  return {
    view: 'side', tx: 0, by: 0, hx: 0, hy: 0,
    frontLeg: [0.8, 0, 0], backLeg: [-0.8, 0, 0], frontArm: [0, 0], backArm: [0, 0], armSide: 1, hipIn: 0, air: false, squat: 0,
    hair: 0, hairLift: 0, hairWave: 0, cape: 0, flap: false, eyes: 'open', mouth: null, climb: 0, tilt: 0, lift: 0, armOver: null,
    ears: [0, 0], tail: 0,
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

// Body language: the expression acts with the whole body, not only the face. Idle, each mood has
// its own stance and a beat timed with its face loop (a hop, a stretch and yawn, a startle, a
// stomp, an "ohoho" with a hand under the chin); walking, each mood walks its own way (bouncy
// skips, a strut, a stomp, a droop, small timid steps, a dizzy weave). Hand offsets are from
// the hands' rest spots, in body px; `lift` raises the whole figure (a hop). Poses hold and snap
// at 8 frames a second, like the faces.
const WALK_STYLE = {
  smile: 'bouncy', grin: 'bouncy', cat: 'bouncy', playful: 'bouncy', giggle: 'bouncy', excited: 'skip', love: 'skip',
  smug: 'strut', proud: 'strut', cool: 'cool', sassy: 'sassy', angry: 'stomp', determined: 'stomp', pout: 'stomp',
  sad: 'droop', sleepy: 'droop', tired: 'droop', shy: 'timid', nervous: 'timid', dizzy: 'weave', shock: 'panic',
  bleh: 'sassy', excuseme: 'sassy', dimple: 'sassy', mmhm: 'cool', judging: 'cool',
  hmph: 'strut', ohoho: 'strut', sneer: 'strut', heh: 'strut', smugcat: 'strut', toldyou: 'strut', lookdown: 'strut',
};
// Lean added to the walk (radians): stomps and droops bend forward, struts stand tall.
export const WALK_LEAN = { stomp: 0.03, droop: 0.02, strut: -0.02, cool: -0.015, sassy: -0.01, panic: 0.02 };
export const walkStyleOf = (mood) => WALK_STYLE[mood] ?? 'bouncy';

function idleActing(r, mood, t, armed) {
  // Acting runs on 30 steps a second, so its sways and gestures flow.
  const T = Math.floor(t * 30) / 30;
  const at = (period) => (T % period) / period;
  const win = (p, a, b) => p >= a && p < b;
  const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
  // 1 through the window a..b, easing in and out over `e` at each edge (so beats blend, never snap).
  const hold = (p, a, b, e = 0.06) => {
    const k = Math.min(1, Math.max(0, (p - a) / e), Math.max(0, (b - p) / e));
    return k * k * (3 - 2 * k);
  };
  const hands = (bx, by, fx = -bx, fy = by) => {
    r.backArm = [q(bx), q(by)];
    if (!armed) r.frontArm = [q(fx), q(fy)];
  };
  const hop = (h) => { r.lift = q(h); if (h > 0.5) { r.frontLeg = [r.frontLeg[0], q(-h * 0.6), 4]; r.backLeg = [r.backLeg[0], q(-h * 0.4), -4]; } };
  const slump = (k) => { r.by = q(r.by + k); r.hy = q(r.hy + k * 0.8); r.frontArm = [r.frontArm[0], q(r.frontArm[1] + k)]; r.backArm = [r.backArm[0], q(r.backArm[1] + k)]; };
  // Hands on the hips: the elbows bend outward (see arm()).
  const onHips = (both = true) => { hands(HIPS[0], HIPS[1], both ? -HIPS[0] : 0, both ? HIPS[1] : 0); r.armSide = -1; };
  const CLASP = [5.6, -6.1];
  const HIPS = [0.6, -4.2];
  // Up under the jaw, on the chest (the head is drawn over the arms in the same skin, so any
  // higher and the hand vanishes into the face).
  const CHIN = [6.5, -8.5];
  switch (mood) {
    case 'smile': {
      // A happy little bounce on the beat the eyes close in a smile.
      const p = at(5);
      if (win(p, 0.6, 0.78)) hop(Math.round(bump(p, 0.6, 0.78) * 2) / 2 * 1.5);
      break;
    }
    case 'grin': {
      const p = at(3);
      hop(win(p, 0, 0.45) ? Math.round(Math.abs(Math.sin(T * Math.PI * 3)) * 2) / 2 : 0);
      hands(-1.5, -2.5);
      break;
    }
    case 'smug': {
      // A hand on the hip, weight on one leg, chin up.
      onHips(false);
      r.tx = q(1);
      r.tilt = 2;
      if (win(at(4.4), 0.7, 0.95)) r.tilt = 4;
      break;
    }
    case 'sassy': {
      // Both hands on the hips and a hip pop that snaps from side to side.
      onHips();
      const p = at(3.6);
      r.tx = win(p, 0.45, 0.7) ? -1.5 : 1.5;
      r.tilt = win(p, 0.45, 0.7) ? -4 : 4;
      break;
    }
    case 'pout': {
      // Arms crossed, turned away; a stomp now and then.
      hands(9.5, -5.6, -9.7, -5.1);
      r.tilt = -2;
      const p = at(2.6);
      if (win(p, 0.55, 0.65)) r.frontLeg = [1, -2.5, 0];
      else if (win(p, 0.65, 0.75)) { r.squat = 1; r.by = q(r.by + 1); }
      break;
    }
    case 'shy': {
      // Hands clasped low, twisting side to side, head tipped away.
      const p = at(3.2);
      hands(5.5, -0.6);
      r.tx = q(Math.sin(T * 2.4) * 0.8);
      r.tilt = Math.sin(T * 2.4 - 0.6) > 0 ? -4 : -2;
      r.hipIn = 0.25;
      if (win(p, 0.85, 1)) hands(CLASP[0], CLASP[1]);
      break;
    }
    case 'cool': {
      // Hands in the pockets, weight back on one leg, barely moving.
      hands(2, -1.5);
      r.tx = q(-1);
      r.tilt = -2;
      break;
    }
    case 'cat': {
      // Paws up by the chin, a little bounce while the note plays.
      const p = at(3.4);
      hands(4.5, -8.1);
      if (win(p, 0.5, 0.85)) { hop(Math.round(Math.abs(Math.sin(T * Math.PI * 4))) * 1); r.tilt = Math.floor(T * 4) % 2 ? 4 : -4; }
      break;
    }
    case 'angry': {
      // Fists clenched at the sides; on the huff, a stomp and a shake.
      hands(-1, -1.5);
      const p = at(5);
      if (win(p, 0.6, 0.85)) {
        r.tx = Math.floor(T * 8) % 2 ? 0.5 : -0.5;
        if (win(p, 0.6, 0.68)) r.frontLeg = [1, -3, 0];
        else { r.squat = 1; r.by = q(r.by + 1); }
        hands(-1.5, -3);
      }
      break;
    }
    case 'excited': {
      // Hopping on the spot, fists pumping in turn.
      const k = Math.abs(Math.sin(T * Math.PI * 2.5));
      hop(Math.round(k * 2) / 2 * 2.5);
      const up = Math.floor(T * 2.5) % 2;
      hands(-2, up ? -11 : -6, 2, up ? -6 : -11);
      break;
    }
    case 'love': {
      // Hands clasped at the heart, swaying slowly side to side.
      hands(CLASP[0], CLASP[1]);
      r.tx = q(Math.sin(T * 1.8) * 1.2);
      r.tilt = Math.round(Math.sin(T * 1.8 - 0.5) * 2) * 2;
      if (win(at(3.6), 0.62, 0.86)) hop(0.5);
      break;
    }
    case 'sleepy': {
      // Slumped; nodding off (the head drops); then a big stretch with the yawn.
      const p = at(6);
      slump(1);
      if (win(p, 0.35, 0.68)) { r.hy = q(r.hy + 1.5); r.tilt = 6; }
      else if (win(p, 0.72, 0.9)) { hands(-2, -17, 2, -17); r.by = -0.5; r.hy = -0.5; r.lift = 0.5; }
      else r.tilt = 2;
      break;
    }
    case 'sad': {
      // Slumped, head hung, arms limp; with the sob, hands to the chin and shaking.
      const p = at(4.4);
      slump(1);
      r.hy = q(r.hy + 0.5);
      hands(1.5, 0);
      r.tilt = -2;
      if (win(p, 0.68, 0.92)) { hands(CHIN[0], CHIN[1]); r.tx = Math.floor(T * 8) % 2 ? 0.5 : 0; }
      break;
    }
    case 'shock': {
      // The startle: a jump back with the arms flung up, then a frozen hold.
      const p = at(3.4);
      if (win(p, 0.15, 0.25)) { hop(2); hands(-3.5, -9, 3.5, -9); r.hy = -1; }
      else if (win(p, 0.25, 0.7)) { hands(-3, -6, 3, -6); r.tx = Math.floor(T * 8) % 2 ? 0.5 : 0; }
      break;
    }
    case 'playful': {
      // A bouncy hip sway with a peace sign by the face on the wink.
      r.tx = q(Math.sin(T * Math.PI * 1.3) * 1.2);
      r.tilt = Math.sin(T * Math.PI * 1.3) > 0 ? 3 : -3;
      if (!armed) r.frontArm = [2.5, -13.5];
      r.backArm = [q(HIPS[0]), q(HIPS[1])];
      r.armSide = -1;
      break;
    }
    case 'proud': {
      // Hands on the hips, chest out; the laugh puts a hand under the chin and shakes the body.
      const p = at(4);
      onHips();
      r.by = q(r.by - 0.5);
      r.tilt = -2;
      if (win(p, 0.5, 0.85)) { r.backArm = [q(CHIN[0]), q(CHIN[1])]; r.armSide = 1; r.by = Math.floor(T * 8) % 2 ? 0 : -0.5; r.tilt = -4; }
      break;
    }
    case 'dizzy': {
      // Wobbling round in circles, arms out for balance, one foot staggering.
      r.tx = q(Math.sin(T * 3) * 1.5);
      r.tilt = Math.round(Math.sin(T * 3 - 0.6) * 3) * 2;
      hands(-3.5 + Math.sin(T * 3) * 1, -6, 3.5 + Math.sin(T * 3) * 1, -6);
      if (Math.sin(T * 3) > 0.6) r.frontLeg = [1.5, -1.5, 6];
      break;
    }
    case 'nervous': {
      // Fidgeting hands at the chest, quick little weight shifts; the gulp hunches the shoulders.
      const p = at(3);
      const f = Math.floor(T * 4) % 2 ? 0.5 : -0.5;
      hands(CLASP[0] + f, CLASP[1], -CLASP[0] + f, CLASP[1]);
      r.tx = Math.floor(T * 2) % 2 ? 0.5 : -0.5;
      if (win(p, 0.7, 0.8)) { r.by = q(r.by + 1); r.hy = q(r.hy + 0.5); }
      break;
    }
    case 'giggle': {
      // A hand under the chin, the shoulders shaking with the giggle.
      const p = at(2.8);
      hands(CHIN[0], CHIN[1], armed ? 0 : -CHIN[0], CHIN[1]);
      if (!win(p, 0.85, 1)) { r.by = Math.floor(T * 6) % 2 ? 0.5 : 0; r.hy = Math.floor(T * 6) % 2 ? -0.5 : 0; }
      break;
    }
    case 'determined': {
      // Fists up and a steady, springy readiness.
      hands(2, -5, -1, -6);
      r.squat = Math.sin(T * Math.PI * 1.5) > 0.3 ? 1 : 0;
      r.frontLeg = [2, 0, 4];
      r.backLeg = [-2, 0, -6];
      break;
    }
    // The attitude faces: sassy hip pops and crossed arms, pretentious chins in the air, smug
    // hands on hips; each moves on its face's beats (faceFrame), and every change eases in and
    // out (`hold`) instead of snapping.
    case 'bleh': {
      // A hand on her hip, head tilted; she sways with the waggle, bounces on the giggle, and
      // leans in for the last wink.
      const p = at(3.2);
      onHips(false);
      const wag = hold(p, 0.2, 0.36);
      const giggle = hold(p, 0.55, 0.72);
      r.tilt = q(4 + 2.5 * wag * Math.sin(T * 14) - 2 * giggle);
      hop(Math.round(giggle * Math.abs(Math.sin(T * Math.PI * 5)) * 2) / 2);
      r.tx = q(hold(p, 0.72, 1) * 1.2);
      break;
    }
    case 'excuseme': {
      // Hands on her hips; the hip pops out with the brow, she turns away with her nose up, and
      // swings back round for the peek.
      const p = at(3.6);
      onHips();
      const pop = hold(p, 0.25, 0.4);
      const away = hold(p, 0.4, 0.75);
      const back = hold(p, 0.75, 1);
      r.tx = q(-0.8 - 0.8 * pop - 0.6 * away + 0.6 * back);
      r.tilt = q(-2 - 3 * pop - 4 * away + 3 * back);
      if (back > 0.5) hop(Math.round(bump(p, 0.75, 0.85) * 2) / 2);
      break;
    }
    case 'dimple': {
      // Hands behind her back, swaying; she leans in on the wink, bounces on her toes with the
      // hearts, and twists shyly at the end.
      const p = at(3.4);
      hands(-2.5, -1.5);
      const wink = hold(p, 0.3, 0.45);
      const happy = hold(p, 0.45, 0.68);
      const shy = hold(p, 0.68, 1);
      r.tilt = q(4 + Math.sin(2 * Math.PI * p) * 2 * (1 - wink) + 2 * wink - 3 * shy);
      r.tx = q(wink - 0.6 * shy);
      hop(Math.round(happy * Math.abs(Math.sin(T * Math.PI * 4)) * 2) / 2);
      break;
    }
    case 'mmhm': {
      // Arms crossed; the head rolls back with the eyes, the shoulders drop on the sigh, and a
      // foot taps through the side-eye.
      const p = at(4);
      hands(9.5, -5.6, -9.7, -5.1);
      const roll = hold(p, 0.25, 0.49);
      const sigh = hold(p, 0.62, 0.78);
      r.tilt = q(-3 - 3 * roll);
      if (sigh > 0) slump(q(sigh * 0.8));
      if (win(p, 0.78, 1)) r.frontLeg = [r.frontLeg[0], Math.floor(T * 6) % 2 ? -0.6 : 0, 4];
      break;
    }
    case 'hmph': {
      // Arms crossed, nose in the air, turned away; she turns back a little to peek, snaps away
      // when caught, and huffs.
      const p = at(3.8);
      hands(9.5, -5.6, -9.7, -5.1);
      const peek = hold(p, 0.32, 0.56);
      const snap = hold(p, 0.56, 0.8, 0.03);
      r.tilt = q(-6 + 3 * peek - 2.5 * snap);
      r.tx = q(-1 + peek - 0.4 * snap);
      r.by = q(r.by - 0.5 * bump(p, 0.8, 0.95));
      break;
    }
    case 'judging': {
      // A hand to the chin; the head follows the eyes up and down, she leans in to narrow them,
      // and nods slowly on the blink.
      const p = at(4);
      r.backArm = [q(CHIN[0]), q(CHIN[1])];
      r.armSide = 1;
      const up = hold(p, 0.22, 0.36);
      const down = hold(p, 0.36, 0.5);
      const lean = hold(p, 0.5, 0.86);
      r.tilt = q(2 - 4 * up + 2 * down + 1.5 * lean);
      r.tx = q(0.8 * lean);
      r.hy = q(r.hy + 0.5 * bump(p, 0.86, 1));
      break;
    }
    case 'ohoho': {
      // Hands on the hips, chest out; the laugh shakes her in quick beats, she leans back to
      // catch her breath, and one more trill shakes her.
      const p = at(3.2);
      onHips();
      const laugh = Math.max(hold(p, 0, 0.5), hold(p, 0.72, 0.9));
      const breath = hold(p, 0.5, 0.72);
      const shake = Math.sin(T * Math.PI * 8);
      r.by = q(r.by - 0.5 - 0.35 * laugh * shake);
      r.tilt = q(-4 - 1.2 * laugh * shake - 2 * breath);
      break;
    }
    case 'sneer': {
      // Hands on her hips, chin up; she rears back as the lip curls, turns away, and gives a
      // little toss of the head on the snort.
      const p = at(4);
      onHips();
      const curl = hold(p, 0.3, 0.45);
      const away = hold(p, 0.45, 0.65);
      r.tilt = q(-4 - 1.5 * curl + 2 * away - 2 * bump(p, 0.65, 0.76));
      r.tx = q(-away);
      break;
    }
    case 'heh': {
      // Hands clasped behind; she leans toward you to peek, and her shoulders bob with the giggle.
      const p = at(3.4);
      hands(-1.5, -2.5);
      const peek = hold(p, 0.28, 0.58);
      const giggle = hold(p, 0.58, 0.78);
      r.tilt = q(-2 + 4 * peek);
      r.by = q(r.by - 0.4 * giggle * Math.abs(Math.sin(T * Math.PI * 6)));
      break;
    }
    case 'smugcat': {
      // A hand on her hip, weight on one leg; she leans into the squint, bobs with the brow, and
      // gives a little hop on the "nya".
      const p = at(3.6);
      onHips(false);
      r.tx = q(1);
      const squint = hold(p, 0.26, 0.44);
      const nya = hold(p, 0.56, 0.76);
      r.tilt = q(3 + 2 * squint - 2 * nya);
      r.by = q(r.by - 0.4 * bump(p, 0.44, 0.56));
      hop(Math.round(nya * bump(p, 0.58, 0.72) * 2) / 2);
      break;
    }
    case 'toldyou': {
      // A hand on her hip; she turns square to you for the "so", leans in on the wink, and bounces
      // on her heels with the grin.
      const p = at(3.8);
      onHips(false);
      const square = hold(p, 0.3, 0.6);
      const grin = hold(p, 0.6, 0.8);
      r.tx = q(1 - square);
      r.tilt = q(2 - 3 * square + 2 * hold(p, 0.48, 0.6));
      hop(Math.round(grin * Math.abs(Math.sin(T * Math.PI * 4)) * 2) / 2);
      break;
    }
    case 'lookdown': {
      // Hands on her hips, chin high; a slow, superior sway, and her shoulders shake with the
      // little "ohoho".
      const p = at(4.2);
      onHips();
      const laugh = hold(p, 0.6, 0.78);
      r.by = q(r.by - 0.5 - 0.3 * laugh * Math.sin(T * Math.PI * 8));
      r.tilt = q(-5 + Math.sin(2 * Math.PI * p) * 1.2 - laugh);
      break;
    }
    case 'tired': {
      // Worn out: bent over, hands toward the knees, panting.
      const pant = Math.floor(T * 3) % 2;
      r.by = q(1.5 + pant * 0.5);
      r.hy = q(1 + pant * 0.5);
      hands(1.5, 2.5 + pant * 0.5);
      r.squat = 1;
      break;
    }
    default:
  }
}

function walkActing(r, mood, p, gait, armed) {
  const style = walkStyleOf(mood);
  const u = (p * 2) % 1;
  const step = p < 0.5 ? 1 : -1;
  const scaleArms = (k, dy = 0) => {
    r.backArm = [q(r.backArm[0] * k), q(r.backArm[1] * k + dy)];
    if (!armed) r.frontArm = [q(r.frontArm[0] * k), q(r.frontArm[1] * k + dy)];
  };
  switch (style) {
    case 'bouncy':
      // A springy step: a little hop off each foot and the head tipping in time.
      r.lift = q(Math.sin(Math.PI * u) * (1 + gait * 0.5));
      r.tilt = step * 2;
      scaleArms(1.15);
      break;
    case 'skip':
      // Skipping: a big hop each step, arms swinging high, the head bobbing side to side.
      r.lift = q(Math.sin(Math.PI * u) * 2.5);
      r.tilt = step * 4;
      scaleArms(1.4, -1);
      break;
    case 'strut':
      // A strut: chest out, chin up, the hips rolling, a confident swing.
      r.by = q(r.by - 0.5);
      r.tx = q(r.tx + Math.sin(2 * Math.PI * p) * 0.8);
      r.tilt = -2;
      scaleArms(1.25);
      break;
    case 'sassy':
      // A catwalk: the hips swing wide and the head snaps the other way.
      r.tx = q(r.tx + Math.sin(2 * Math.PI * p) * 1.5);
      r.tilt = step * -4;
      r.backArm = [0.5, -4];
      r.armSide = -1;
      break;
    case 'cool':
      // Hands in the pockets, an easy lope.
      r.backArm = [2, -1.5];
      if (!armed) r.frontArm = [-2, -1.5];
      r.tilt = -2;
      break;
    case 'stomp':
      // A stomp: the knees give hard on each landing and the fists swing big.
      if (u < 0.18) r.squat = Math.max(r.squat, 1);
      r.by = q(r.by + (u < 0.18 ? 1 : 0));
      scaleArms(1.35);
      if (mood === 'pout') { r.backArm = [9.5, -5.6]; if (!armed) r.frontArm = [-9.7, -5.1]; }
      break;
    case 'droop':
      // A droop: the head hangs, the shoulders slump, the arms barely swing, the feet drag.
      r.hy = q(r.hy + 1.5);
      r.by = q(r.by + 1);
      scaleArms(0.35, 1);
      r.tilt = mood === 'sleepy' ? (Math.sin(2 * Math.PI * p) > 0 ? 4 : 2) : 0;
      break;
    case 'timid':
      // Small timid steps, hands held close, the head tipped down and away.
      r.hy = q(r.hy + 0.5);
      scaleArms(0.45, -1);
      r.tilt = -2;
      break;
    case 'weave':
      // Weaving: the body sways from side to side across the steps, arms out for balance.
      r.tx = q(r.tx + Math.sin(Math.PI * p) * 2 - 1);
      r.tilt = Math.round(Math.sin(2 * Math.PI * p) * 3) * 2;
      r.backArm = [q(-3.5 + step), -6];
      if (!armed) r.frontArm = [q(3.5 + step), -6];
      break;
    case 'panic':
      // Panicking: arms flailing over the head.
      r.backArm = [-3, q(-9 + step * 2)];
      if (!armed) r.frontArm = [3, q(-9 - step * 2)];
      r.lift = q(Math.sin(Math.PI * u));
      break;
    default:
  }
}

function solveRig(state, anim, mv = null) {
  const { pose = 'idle', time = 0, hurt = false, seed = 0 } = state;
  const r = baseRig();
  const t = time + seed * 1.37;
  // Without a spring (NPCs, menus) the hair still sways, its tips a beat behind the breath.
  r.hair = Math.round((anim ? Math.max(-3, Math.min(3, anim.hair)) : Math.sin(t * 1.3) * 0.6 + Math.sin(t * 2.4 - 1.4) * 0.35) * 2) / 2;
  // The tips follow the root a beat later (a chain), and swing a little further.
  r.hairTip = Math.round((anim ? Math.max(-4, Math.min(4, anim.hairTip ?? anim.hair)) : Math.sin(t * 1.3 - 0.9) * 0.75 + Math.sin(t * 2.4 - 2.4) * 0.4) * 2) / 2;
  // A slow breeze travels down the hair, in 8 steps over about 2.6 seconds.
  r.hairWave = Math.floor((((t / 2.6) % 1) + 1) % 1 * 8);
  // The cape is a chain of two springs: the root (upper cloth) and the hem a beat behind it.
  r.cape = anim ? Math.round(Math.max(-4, Math.min(4, anim.capeTip ?? anim.cape))) : Math.round(Math.sin(t * 1.1) * 0.8);
  r.capeRoot = anim ? Math.round(Math.max(-3, Math.min(3, anim.cape)) * 2) / 2 : null;
  r.flap = Math.floor(t * (pose === 'jump' ? 10 : 4)) % 2 === 0;
  // A blink every few seconds, slightly offset per character.
  // A blink is three beats (half shut, shut, half open); some blink twice in a row.
  const cycle = (t * 0.31) % 1;
  const lidAt = (c) => (c < 0.012 ? 'half' : c < 0.03 ? 'blink' : c < 0.042 ? 'half' : null);
  r.eyes = lidAt(cycle) ?? (seed % 2 === 0 ? lidAt(cycle - 0.5) : null) ?? (seed % 3 === 0 ? lidAt(cycle - 0.07) : null) ?? 'open';
  // Talking (an NPC whose words are typing out): the mouth shapes syllables on a beat, skipping
  // every third so it doesn't flap like a metronome.
  if (state.talking) {
    const syl = Math.floor(t * 9);
    if (syl % 3 !== 2) r.mouth = ['ah', 'o', 'e', 'open', 'ah', 'e', 'o'][(syl * 5 + seed) % 7];
  }

  if (pose === 'climb') {
    r.view = 'back';
    const f = Math.floor(((anim ? anim.climb : t * 20) / 10) % 4 + 4) % 4;
    r.climb = [2, 0, -2, 0][f];
    return r;
  }

  if (pose === 'walk') {
    const phase = anim ? walkPhase(anim) : (t * 0.9) % 1;
    const p0 = (Math.round(phase * WALK_FRAMES) % WALK_FRAMES) / WALK_FRAMES;
    const p = p0;
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
    if (state.mood) walkActing(r, state.mood, p, gait, state.armed);
  } else if (pose === 'jump') {
    const vy = state.vy ?? -1;
    r.air = true;
    if (anim?.rise > 0 || vy < -250) {
      // Rising: legs tucked, arms swept back.
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
  } else if (state.ready && (state.wtype === 'dagger' || state.wtype === 'gauntlet')) {
    // The Thief's stance: light on her feet, low and loose, a quick small bounce on the balls of her
    // feet with the back heel up, weight forward, the free hand up and ready.
    const beat = t * 8.5;
    const down = Math.sin(beat) > 0;
    r.squat = down ? 2 : 1;
    r.by = down ? 1 : 0;
    r.frontLeg = [3, 0, 6];
    r.backLeg = [-3.2, down ? 0 : -1, -12];
    r.frontArm = [2, q(-1 + (down ? 0.5 : 0))];
    r.backArm = [2.5, q(-3.5 + (down ? 0.5 : 0))];
    r.hair = Math.round((r.hair + Math.sin(beat - 1.2) * 1) * 2) / 2;
    r.tx = 2;
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
    if (pose === 'idle' && state.mood) {
      const [b0, f0] = [r.backArm.join(), r.frontArm.join()];
      idleActing(r, state.mood, t, state.armed);
      // Which arms the mood is holding in a pose of its own (an idle bit leaves those alone).
      r.posed = { back: r.backArm.join() !== b0 || r.armSide !== 1, front: r.frontArm.join() !== f0 || r.armSide !== 1 };
    }
  }

  // Landing: the knees give, the hips drop, and the feet spread (a pose; the figure keeps its shape).
  if (anim?.land > 0 && pose !== 'jump') {
    const k = anim.land > 0.06 ? 2 : 1;
    r.by = 0;
    r.squat = k;
    r.frontLeg = [r.frontLeg[0] + k * 0.6, 0, 0];
    r.backLeg = [r.backLeg[0] - k * 0.6, 0, 0];
    r.frontArm = [k, 1];
    r.backArm = [-k, 1];
  }

  // Hurt: the first beat is held at the deepest crouch, leaning hard away from the blow, then the
  // body rocks back upright (hurtK runs 1 -> overshoot -> 0, see drawHeroBody).
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
    r.eyes = 'open';
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
  return [r.view, r.tx, r.by, r.hx, r.hy, ...r.frontLeg, ...r.backLeg, ...r.backArm, r.armSide, r.hipIn, r.armIn ? r.frontArm.join(',') : '-', r.air ? 1 : 0, r.squat, r.hair, r.hairTip, r.hairLift, r.hairWave, r.cape, r.capeRoot, r.flap ? 1 : 0, r.eyes, r.mouth, r.climb, r.tilt, r.armOver, ...r.ears, r.tail, r.tailCurl ?? 0, r.face ? JSON.stringify(r.face) : ''].join(',');
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

function weaponSprite(w, time, unstrung = false) {
  if (w.fun) {
    const def = funWeapon(w.fun);
    const s = sprite(`funweapon|${w.fun.fun}|${w.fun.t}`, () => ({ w: def.w, h: def.h, shapes: def.shapes }));
    return { ...s, ...logical(s), grip: def.grip, blade: def.blade, live: null };
  }
  const frames = weaponFrames(w.type, w.tier, w.theme);
  const frame = frames > 1 ? Math.floor(time * 9) % frames : 0;
  const def = weaponShapes(w.type, w.tier, frame, w.theme, w.variant, unstrung);
  if (!def) return null;
  const s = sprite(`weapon|${w.type}|${w.tier}|${w.theme}|${w.variant}|${frame}|${unstrung}`, () => ({ w: def.w, h: def.h, shapes: def.shapes, res: RES, soft: 'cel', crisp: true }));
  return { ...s, ...logical(s), grip: def.grip, blade: def.blade, live: def.live, anchors: def.anchors };
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

// Idle routines while standing still: each weapon has a few things it does, taken in turn with a
// breather of the gentle loop between them, each easing in and out so the hands never jump.
// Returns the hand's offset from its rest spot (body units), the weapon's angle, and optionally a
// toss height (px), a sparkle at the hand, and `rig`: the rest of the body (the free hand, the
// head, a lean) acting along with it. Bare hands (`type` none) get theirs too.
const smooth = (u) => u * u * (3 - 2 * u);
const IDLE_REST = 3.2;
function weaponIdle(type, t) {
  const bump = (p, a, b) => (p < a || p > b ? 0 : Math.sin(((p - a) / (b - a)) * Math.PI));
  const seg = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
  const env = (u, a = 0.18, b = 0.82) => smooth(seg(u, 0, a)) * (1 - smooth(seg(u, b, 1)));
  const lerp = (a, b, k) => a + (b - a) * k;
  const q2 = (v) => Math.round(v * 2) / 2;
  // Which bit is playing (and how far through it), from a list of their lengths; null resting.
  const bit = (lens) => {
    const period = lens.reduce((n, d) => n + d + IDLE_REST, 0);
    let c = ((t % period) + period) % period;
    for (let i = 0; i < lens.length; i++) {
      c -= IDLE_REST;
      if (c < 0) return null;
      if (c < lens[i]) return { i, u: c / lens[i], s: c };
      c -= lens[i];
    }
    return null;
  };
  const rest = (angle, arm = [0, 0]) => ({ arm, angle });
  switch (type) {
    case 'sword': {
      const sway = 25 + Math.sin(t * 1.6) * 4;
      const b = bit([1.2, 2.6, 2.4]);
      if (!b) return rest(sway);
      const k = env(b.u);
      // A flourish: the blade lifted and spun once round the hand.
      if (b.i === 0) return { arm: [0.5 * bump(b.u, 0, 1), -3 * bump(b.u, 0, 1)], angle: sway - smooth(seg(b.u, 0.1, 0.9)) * 360 };
      // Laid back over the shoulder, a lean back, the free hand on the hip.
      if (b.i === 1) return { arm: [lerp(0, 1, k), lerp(0, -6, k)], angle: lerp(sway, -50, k), rig: { backArm: [q2(0.6 * k), q2(-4.2 * k)], armSide: k > 0.5 ? -1 : 0.6, tilt: Math.round(-3 * k) } };
      // Held up before the face to look down the edge, a glint running along it.
      return { arm: [lerp(0, 3, k), lerp(0, -7, k)], angle: lerp(sway, 2, k), sparkle: k > 0.8 && b.u > 0.4 && b.u < 0.6, rig: { hx: q2(0.6 * k), hy: q2(0.6 * k) } };
    }
    case 'axe': {
      const breathe = 16 + Math.sin(t * 2) * 3;
      const b = bit([1.4, 2.6, 2.2]);
      if (!b) return { arm: [1, -5], angle: breathe };
      const k = env(b.u);
      // Hefted up off the shoulder and settled back.
      if (b.i === 0) { const heft = bump(b.u, 0, 1); return { arm: [1, -5 - 3 * heft], angle: breathe - 14 * heft }; }
      // Brought down off the shoulder and leant on, head to the ground, both hands on the haft.
      if (b.i === 1) return { arm: [lerp(1, 3, k), lerp(-5, 1, k)], angle: lerp(breathe, 150, k), rig: { backArm: [q2(3.4 * k), q2(0.5 * k)], tilt: Math.round(3 * k), by: q2(0.5 * k) } };
      // The haft rolled in the hand so the head turns over and back, admiring it.
      return { arm: [lerp(1, 2.5, k), lerp(-5, -6, k)], angle: breathe + Math.sin(b.s * 5) * 35 * k, rig: { hx: q2(0.5 * k) } };
    }
    case 'spear': {
      const lean = 4 + Math.sin(t * 1.2) * 2;
      const b = bit([1.2, 2.6, 2.4]);
      if (!b) return { arm: [3, -3], angle: lean };
      const k = env(b.u);
      // A twirl round the hand.
      if (b.i === 0) return { arm: [3, -3 - 2 * bump(b.u, 0, 1)], angle: lean + smooth(seg(b.u, 0.1, 0.9)) * 360 };
      // Shouldered, sloped back, the free hand on the hip.
      if (b.i === 1) return { arm: [lerp(3, 1, k), lerp(-3, -6, k)], angle: lerp(lean, -60, k), rig: { backArm: [q2(0.6 * k), q2(-4.2 * k)], armSide: k > 0.5 ? -1 : 0.6 } };
      // Planted and leant on, the other arm flung out in a stretch.
      return { arm: [3, -3 - 1 * k], angle: lean, rig: { backArm: [q2(-8 * k), q2(-6 * k)], tilt: Math.round(4 * k), tx: q2(0.6 * k) } };
    }
    case 'wand': {
      const twirl = 25 + Math.sin(t * 3) * 18;
      const b = bit([1, 2.4, 2.2]);
      if (!b) return { arm: [0.5, -2], angle: twirl };
      const k = env(b.u);
      // A full spin in the fingers and a sparkle.
      if (b.i === 0) return { arm: [0.5, -2 - 2 * bump(b.u, 0, 1)], angle: twirl + smooth(seg(b.u, 0, 0.8)) * 360, sparkle: b.u > 0.6 && b.u < 0.9 };
      // Thinking: the wand's tip tapped against the chin, head tilted.
      if (b.i === 1) return { arm: [lerp(0.5, 2.6, k), lerp(-2, -9 + 0.6 * Math.abs(Math.sin(b.s * 6)) * k, k)], angle: lerp(twirl, -20, k), rig: { tilt: Math.round(-4 * k), hy: q2(-0.5 * k) } };
      // A little circle drawn in the air, sparkling.
      const a = b.s * 5;
      return { arm: [lerp(0.5, 3 + Math.cos(a) * 1.6, k), lerp(-2, -6 + Math.sin(a) * 1.6, k)], angle: lerp(twirl, 10, k), sparkle: k > 0.6 };
    }
    case 'staff': {
      const lean = 5 + Math.sin(t * 1.4) * 2;
      const b = bit([1.2, 2.8, 2.2]);
      if (!b) return { arm: [3, -4], angle: lean };
      const k = env(b.u);
      // Tapped on the ground, a glimmer going up.
      if (b.i === 0) { const tap = bump(b.u, 0.2, 0.5); return { arm: [3, -4 - 3 * tap], angle: lean, sparkle: b.u > 0.48 && b.u < 0.7 }; }
      // Both hands on it, leaning on it, resting the chin.
      if (b.i === 1) return { arm: [3, lerp(-4, -7, k)], angle: lean, rig: { backArm: [q2(4 * k), q2(-7 * k)], tilt: Math.round(4 * k), tx: q2(0.6 * k), hy: q2(0.8 * k) } };
      // Raised high overhead, glimmering.
      return { arm: [lerp(3, 2, k), lerp(-4, -10, k)], angle: lean, sparkle: k > 0.7, rig: { tilt: Math.round(-3 * k), hy: q2(-0.6 * k) } };
    }
    case 'bow': {
      const sway = 25 + Math.sin(t * 1.3) * 4;
      const b = bit([1.6, 2.4, 2.4]);
      if (!b) return rest(sway);
      const k = env(b.u);
      // Raised to check the string.
      if (b.i === 0) { const c = bump(b.u, 0, 1); return { arm: [1.5 * c, -5 * c], angle: sway - 25 * c }; }
      // Slung over the shoulder.
      if (b.i === 1) return { arm: [lerp(0, -1, k), lerp(0, -6, k)], angle: lerp(sway, -40, k), rig: { backArm: [q2(0.6 * k), q2(-4.2 * k)], armSide: k > 0.5 ? -1 : 0.6, tilt: Math.round(-2 * k) } };
      // Turned over in the hand, once round, slow.
      return { arm: [lerp(0, 2, k), lerp(0, -3, k)], angle: sway + smooth(seg(b.u, 0.2, 0.8)) * 360 };
    }
    case 'crossbow': {
      const hang = 55 + Math.sin(t * 1.5) * 3;
      const b = bit([1.6, 2.6, 2.4]);
      if (!b) return rest(hang);
      const k = env(b.u);
      // Brought up to aim a moment.
      if (b.i === 0) { const aim = bump(b.u, 0, 1); return { arm: [2 * aim, -5 * aim], angle: hang - 50 * aim }; }
      // Rested on the shoulder.
      if (b.i === 1) return { arm: [lerp(0, 1, k), lerp(0, -6, k)], angle: lerp(hang, -30, k), rig: { tilt: Math.round(-2 * k) } };
      // Held across the body while the free hand works the crank.
      return { arm: [lerp(0, 2, k), lerp(0, -3, k)], angle: lerp(hang, 85, k), rig: { backArm: [q2(3.4 * k + 0.6 * Math.sin(b.s * 10) * k), q2(-3 * k + 0.6 * Math.cos(b.s * 10) * k)], hy: q2(0.8 * k), hx: q2(0.4 * k) } };
    }
    case 'dagger': {
      // The Wind Dancer's chakram (the dagger items): every fidget keeps the ring at her hip or
      // out in front, never up by her face.
      const wob = 160 + Math.sin(t * 2) * 5;
      const b = bit([1.3, 2, 1.8]);
      if (!b) return rest(wob);
      const k = env(b.u);
      // Tossed up spinning out in front of her and caught.
      if (b.i === 0) { const air = seg(b.u, 0.1, 0.9); return { arm: [lerp(0, 3, k), -1 * bump(b.u, 0, 1)], angle: wob + smooth(air) * 720, toss: Math.sin(air * Math.PI) * 14 }; }
      // Twirled round her hand at her hip, three turns.
      if (b.i === 1) return { arm: [lerp(0, 3, k), lerp(0, 1, k)], angle: wob + smooth(seg(b.u, 0.15, 0.85)) * 1080 };
      // A little flourish: the ring swept out to the side and held there a beat, a showgirl's pose.
      return { arm: [lerp(0, 5, k), lerp(0, -1.5, k)], angle: lerp(wob, 95, k) + Math.sin(b.s * 5) * 4 * k, rig: { backArm: [q2(-2 * k), q2(-5 * k)] } };
    }
    case 'gauntlet': {
      const flex = 70 + Math.sin(t * 4) * 5;
      const b = bit([1, 2, 2]);
      if (!b) return rest(flex);
      const k = env(b.u);
      // A wrist-flick practice throw.
      if (b.i === 0) { const f = bump(b.u, 0.3, 0.7); return { arm: [4 * f, -2 * f], angle: flex - 25 * f }; }
      // Knuckles cracked, the hands pressed together at the chest.
      if (b.i === 1) return { arm: [lerp(0, 2.4, k), lerp(0, -4, k)], angle: flex, rig: { backArm: [q2(3.6 * k), q2(-4 * k + 0.5 * Math.abs(Math.sin(b.s * 8)) * k)], hy: q2(0.6 * k) } };
      // A fist punched into the other palm, twice.
      const p = Math.max(0, Math.sin(b.s * 7)) * k;
      return { arm: [lerp(0, 1.5, k) + 2.4 * p, lerp(0, -4, k)], angle: flex + 15 * p, rig: { backArm: [q2(4.2 * k), q2(-4 * k)], tilt: Math.round(2 * p) } };
    }
    case 'none': {
      const b = bit([2.4, 2.6, 2]);
      if (!b) return null;
      const k = env(b.u, 0.25, 0.75);
      // A big stretch, both arms flung out wide (raised straight up they'd hide behind the head),
      // up on the toes a moment.
      if (b.i === 0) return { arm: [8 * k, -6 * k], angle: 0, rig: { backArm: [q2(-8 * k), q2(-6 * k)], hy: q2(-0.8 * k), tilt: Math.round(-4 * k), lift: q2(1 * bump(b.u, 0.35, 0.65)) } };
      // Hands on the hips, a look one way and the other.
      if (b.i === 1) return { arm: [-0.6 * k, -4.2 * k], angle: 0, rig: { backArm: [q2(0.6 * k), q2(-4.2 * k)], armSide: k > 0.5 ? -1 : 0.6, hx: q2(Math.sin(b.s * 2.4) * 0.8 * k), tilt: Math.round(2 * Math.sin(b.s * 2.4) * k) } };
      // Dusting off: a couple of brushes down the front.
      const brush = Math.abs(Math.sin(b.s * 6)) * k;
      return { arm: [2.4 * k, -4 * k + 3 * brush], angle: 0, rig: { backArm: [q2(2 * k), q2(-2 * k + 2 * brush)], hy: q2(0.8 * k) } };
    }
    default:
      return null;
  }
}

// Draws a figure in a pose it was handed whole: a character with a skeleton of its own (Snow wolf,
// render/snowwolf.js) that never goes through the hero's pose solving, moves or acting. `pose` is
// laid over the rest rig (legs, lean and bob, head, both arms' hands, hair and cloth springs, ears,
// tail, face, eyes). `under(ctx, hand)` draws beneath the body, given where the back hand (her right
// hand, on the far side) really is on screen once the arm has reached for its spot, so whatever it
// holds is always in it; `over(ctx, hand)` draws on top (seen from behind, on a rope).
// `lean` ({ tilt (radians, + forward), lunge (px, forward), lift (px) }) leans the whole figure the
// way the player's moves do: on the ground the legs stay planted upright on their feet and
// everything from the waist up leans from the hips; off the ground (lift) it turns as one about
// its middle. Whatever the hand holds goes with the upper body.
// `hold: 'front'` hands the callbacks the front (near) hand instead, the one on the facing side,
// which can reach out well past the body (a weapon held out at arm's length).
export function drawPosed(ctx, look, x, y, pose, { scale = 1, facing = 1, under = null, over = null, lean = null, hold = 'back' } = {}) {
  const rig = { ...baseRig(), ...pose, armIn: true };
  const g = resolveGear(look, null);
  const body = sprite(`posed|${JSON.stringify(look)}|${rigKey(rig)}`, () => ({ w: W, h: H, shapes: bodyShapes(look, g, rig), res: RES, soft: 'cel', crisp: true, selout: true }));
  const flip = facing < 0;
  const left = x - (W / 2) * scale;
  const top = y - H * scale - (rig.lift ?? 0) * scale;
  const sx = (px) => (flip ? left + (W - (px + OX)) * scale : left + (px + OX) * scale);
  const sy = (py) => top + (py + OY) * scale;
  // The back hand, as bodyShapes places it: reached for from the shoulder (as far as the arm
  // goes), carried with the upper body, then into the chibi's proportions.
  const [, [wx, wy]] = reach(BACK_SHOULDER, SHOULDER_Y, BACK_SHOULDER - HAND_FORWARD + rig.backArm[0], HAND_Y + rig.backArm[1], UPPER_ARM, FOREARM, 1);
  const [, [fx, fy]] = reach(FRONT_SHOULDER, SHOULDER_Y, FRONT_SHOULDER + HAND_FORWARD + rig.frontArm[0], HAND_Y + rig.frontArm[1], UPPER_ARM, FOREARM, -1);
  const [hx, hy] = hold === 'front' ? [fx, fy] : [wx, wy];
  const hand = rig.view === 'back' ? [sx(15.5), sy(squashY(30))] : [sx(squashX(hx + rig.tx)), sy(squashY(hy + rig.by + hipDrop(rig)))];
  // (And the other hand, for a figure with something in each.)
  const [ox, oy] = hold === 'front' ? [wx, wy] : [fx, fy];
  const other = rig.view === 'back' ? hand : [sx(squashX(ox + rig.tx)), sy(squashY(oy + rig.by + hipDrop(rig)))];
  if (!lean || (!lean.tilt && !lean.lunge && !lean.lift)) {
    under?.(ctx, hand, flip, other);
    blit(ctx, body, left, top, { flip, scale });
    over?.(ctx, hand, flip, other);
    return;
  }
  const dir = flip ? -1 : 1;
  const mv = { tilt: lean.tilt ?? 0, lift: lean.lift ?? 0, lunge: lean.lunge ?? 0 };
  const { pivot: pk, tilt } = leanOf(mv);
  const pivot = y - H * scale * pk;
  const whole = (c, t) => {
    c.translate(x + dir * mv.lunge * scale, pivot - mv.lift * scale);
    c.rotate(t * dir);
    c.translate(-x, -pivot);
  };
  const span = W * scale * 2;
  ctx.save();
  whole(ctx, tilt);
  under?.(ctx, hand, flip, other);
  ctx.restore();
  if (pk < 0.2 && Math.abs(tilt) > 0.01) {
    const cut = pivot + WAIST_OVERLAP * scale;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - span, cut - 2 * WAIST_OVERLAP * scale, span * 2, H * scale);
    ctx.clip();
    whole(ctx, 0);
    blit(ctx, body, left, top, { flip, scale });
    ctx.restore();
    ctx.save();
    whole(ctx, tilt);
    ctx.beginPath();
    ctx.rect(x - span, pivot - H * scale * 2, span * 2, H * scale * 2 + WAIST_OVERLAP * scale);
    ctx.clip();
    blit(ctx, body, left, top, { flip, scale });
    ctx.restore();
  } else {
    ctx.save();
    whole(ctx, tilt);
    blit(ctx, body, left, top, { flip, scale });
    ctx.restore();
  }
  ctx.save();
  whole(ctx, tilt);
  over?.(ctx, hand, flip, other);
  ctx.restore();
}

// Where the mouth of a figure drawn with drawPosed (same x, y, pose and options) is on screen: the
// head's offset and roll, the sprite's placement, and the lean (for breath and words that must
// come from the lips).
export function posedMouth(x, y, pose, { scale = 1, facing = 1, lean = null } = {}) {
  const rig = { ...baseRig(), ...pose };
  const ux = rig.tx;
  const uy = rig.by + hipDrop(rig);
  const nx = squashX(15.5 + ux) + rig.hx;
  const ny = 25 + uy * KY + rig.hy + NECK_LIFT;
  const r0 = FACE_X + squashX(15.5 + ux) - 15.5 + rig.hx;
  const r1 = MY + uy * KY + rig.hy + NECK_LIFT;
  const a = ((rig.tilt ?? 0) * Math.PI) / 180;
  const px = nx + (r0 - nx) * Math.cos(a) - (r1 - ny) * Math.sin(a);
  const py = ny + (r0 - nx) * Math.sin(a) + (r1 - ny) * Math.cos(a);
  return placed(x, y, rig, { scale, facing, lean }, px, py);
}
// Where a point of the upper body (sprite px, at rest) is on screen for a figure drawn with
// drawPosed: carried with the body's lean and bob (for things worn on the back, like wings).
export function posedPoint(x, y, pose, opts, [bx, by]) {
  const rig = { ...baseRig(), ...pose };
  return placed(x, y, rig, opts, squashX(bx + rig.tx), squashY(by + rig.by + hipDrop(rig)));
}
// A sprite point (px, py) of a posed figure, placed and leaned as drawPosed draws it.
function placed(x, y, rig, { scale = 1, facing = 1, lean = null } = {}, px, py) {
  const flip = facing < 0;
  const dir = flip ? -1 : 1;
  const left = x - (W / 2) * scale;
  const top = y - H * scale - (rig.lift ?? 0) * scale;
  let mx = flip ? left + (W - (px + OX)) * scale : left + (px + OX) * scale;
  let my = top + (py + OY) * scale;
  if (lean && (lean.tilt || lean.lunge || lean.lift)) {
    const mv = { tilt: lean.tilt ?? 0, lift: lean.lift ?? 0, lunge: lean.lunge ?? 0 };
    const { pivot: pk, tilt } = leanOf(mv);
    const pivot = y - H * scale * pk;
    const t = tilt * dir;
    const [dx, dy] = [mx - x, my - pivot];
    mx = x + dir * mv.lunge * scale + dx * Math.cos(t) - dy * Math.sin(t);
    my = pivot - mv.lift * scale + dx * Math.sin(t) + dy * Math.cos(t);
  }
  return [mx, my];
}

// Draws a hero. Advanced jobs (state.job) get an idle aura that fades in while standing still,
// layered behind and in front of the sprite.
export function drawHero(ctx, look, gear, x, y, state, anim = null) {
  // Capsule-machine looks carry living effects (render/gacha.js), drawn round the body.
  const worn = outfitFx(gear);
  const job = settings.jobAuras && AURA_JOBS.has(state.job) ? state.job : null;
  if (!job) {
    if (worn) drawOutfitFx(ctx, worn, 'back', x, y, state);
    drawHeroBody(ctx, look, gear, x, y, state, anim);
    if (worn) drawOutfitFx(ctx, worn, 'front', x, y, state);
    return;
  }
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
  if (worn) drawOutfitFx(ctx, worn, 'back', x, y, state);
  drawHeroBody(ctx, look, gear, x, y, state, anim);
  if (worn) drawOutfitFx(ctx, worn, 'front', x, y, state);
  drawJobAura(ctx, job, 'front', x, y, t, s, k);
}

// Eases from one move's pose (`a`) into another's (`b`) by `w` (0-1, eased here): angles take the
// short way round, the body's lift, lean and lunge glide, and so do the legs, the free arm, the
// crouch and the hips (`blendRig`); the face and other switches change halfway.
function blendMove(a, b, w) {
  if (!a || !b) return b;
  const k = w * w * (3 - 2 * w);
  const mix = (x, y) => x + (y - x) * k;
  const angle = (x, y) => (x == null || y == null ? y : y - ((((y - x) % 360) + 540) % 360 - 180) * (1 - k));
  return {
    ...b,
    weapon: angle(a.weapon, b.weapon), arm: angle(a.arm, b.arm),
    lift: mix(a.lift, b.lift), lunge: mix(a.lunge, b.lunge), tilt: mix(a.tilt, b.tilt), turn: mix(a.turn, b.turn), stretch: mix(a.stretch, b.stretch),
    rig: a.rig || b.rig ? (r) => blendRig(r, a.rig, b.rig, k) : undefined,
  };
}

// Poses the rig both ways and glides its limbs from the first pose to the second by `k` (kept on
// the rig's half-pixel grid, leg angles to 2 degrees).
function blendRig(r, ra, rb, k) {
  const from = { ...r, frontLeg: [...r.frontLeg], backLeg: [...r.backLeg], backArm: [...r.backArm] };
  ra?.(from);
  rb?.(r);
  const mix = (x = 0, y = 0) => q(x + (y - x) * k);
  for (const key of ['frontLeg', 'backLeg']) r[key] = [mix(from[key][0], r[key][0]), mix(from[key][1], r[key][1]), Math.round((from[key][2] + (r[key][2] - from[key][2]) * k) / 2) * 2];
  r.backArm = [mix(from.backArm[0], r.backArm[0]), mix(from.backArm[1], r.backArm[1])];
  for (const key of ['squat', 'tx', 'by', 'cape']) r[key] = mix(from[key], r[key]);
  if (k < 0.5) for (const key of ['eyes', 'mouth', 'air', 'hairLift']) r[key] = from[key];
}

// The standing guard a finished move eases back into (the arm low and forward, the blade up).
const SETTLE_POSE = { weapon: 62, arm: 30, lift: 0, lunge: 0, tilt: 0, turn: 1, stretch: 1, trail: false };

// Older pose names still used by callers map onto moves.
const POSE_MOVES = { swing: 'slash', shoot: 'draw', cast: 'castforward' };

// Draws the body, moving the whole figure for the current move: hops, lunges, leans, spins.
function drawHeroBody(ctx, look, gear, x, y, state, anim = null) {
  const pose = state.pose ?? 'idle';
  // Each weapon swings in its own way (render/moves.js `feel`), bent round the moment the blow lands.
  const feel = { weapon: resolveGear(look, gear).weapon?.type, hit: state.hit, fin: state.fin };
  let moved = moveAt(POSE_MOVES[pose] ?? pose, state.progress ?? 0, state.dur ?? 0.35, feel);
  // A move that cut in on another eases out of it over its first few frames.
  if (moved && state.from && state.blend < 1) {
    const from = moveAt(POSE_MOVES[state.from.kind] ?? state.from.kind, state.from.progress, state.from.dur, { weapon: feel.weapon });
    moved = blendMove(from, moved, Math.max(0, state.blend));
  }
  // Endless Fox-Fire: her body keeps moving through the barrage on its own clock (after the blend,
  // so it never jumps from one throw to the next).
  if (moved && state.flow) moved = streamFlow(moved, state.flow, state.progress ?? 0, state.dur ?? 0.35);
  // A move that just ended eases back to the standing guard (`settle`, 0-1) instead of snapping.
  if (moved && state.settle != null) moved = blendMove(moved, SETTLE_POSE, Math.min(1, state.settle));
  // The pose the arm and weapon are drawn from follows the same rule as the body (see `rigid`).
  moved = rigid(moved);
  // Walking, the whole body leans into the run and rises a little at each passing step.
  let mv = moved;
  // A choreographed body move (boss dances): lift, lean and spin of the whole figure.
  if (state.body) mv = { lift: 0, lunge: 0, tilt: 0, turn: 1, stretch: 1, bodyOnly: true, ...state.body };
  if (!moved && pose === 'walk' && anim) {
    // Walking, the body leans in a little; running, more, and it floats between steps (the whole
    // figure lifts, both feet off the ground).
    const p = (Math.round(walkPhase(anim) * WALK_FRAMES) % WALK_FRAMES) / WALK_FRAMES;
    const gait = Math.round(anim.gait * 4) / 4;
    const fly = flightAt(p, gaitShape(gait)) * gait;
    const lean = WALK_LEAN[walkStyleOf(state.low ? 'tired' : look.face ?? 'smile')] ?? 0;
    mv = { lift: 2.2 * fly, lunge: 0, tilt: 0.03 + 0.05 * gait + lean, turn: 1, stretch: 1, bodyOnly: true };
  }
  // Hurt timing: hold the hit pose for a beat, then a decaying wobble back (in the pose).
  if (anim) {
    if (state.hurt) {
      if (!anim.hurtOn) anim.hurtAt = state.time ?? 0;
      const e = Math.max(0, (state.time ?? 0) - anim.hurtAt);
      const k = e < 0.09 ? 1 : Math.exp(-(e - 0.09) * 7) * Math.cos((e - 0.09) * 26);
      state = { ...state, hurtK: Math.round(k * 4) / 4 };
    }
    anim.hurtOn = Boolean(state.hurt);
  }
  // A move can melt the figure into smoke for a moment (`fade`, 0-1: the Thief's blinks).
  if (moved?.fade) {
    if (moved.fade >= 0.98) return;
    state = { ...state, alpha: (state.alpha ?? 1) * (1 - moved.fade) };
  }
  drawMoved(ctx, look, gear, x, y, state, anim, rigid(mv), moved);
}

// The figure never squashes, stretches or narrows (the player's standing rule): a move may lift,
// lunge, lean or crouch it, but a turn is a clean mirror flip (its sign, so a spin flips at each
// half turn) and the height stays its own. A spinning blade (`orbit`) keeps its path on screen
// through the flip: the flip would mirror its angle, so it's mirrored back, and the sweep runs on
// round the body instead of jumping and running backwards for half the turn.
export function rigid(mv) {
  if (!mv) return mv;
  const turn = Math.sign(mv.turn ?? 1) || 1;
  const weapon = mv.orbit && turn < 0 && mv.weapon != null ? -mv.weapon : mv.weapon;
  return { ...mv, turn, weapon, stretch: 1 };
}

// Where the weapon is at a moment of an attack move, as offsets from the feet (screen pixels at
// `scale`), worked out exactly as it's drawn: the aimed arm's hand, the weapon's angle, its tip
// (from the weapon's own length), and the front shoulder, all carried through the whole-body
// lunge, lift, tilt and turn (a flip). Effects use it so a smear or a thrust's spike lines up with
// the weapon instead of a fixed height. Returns null for moves without an aimed arm.
export function strikePose(look, gear, move, progress, dur, facing = 1, scale = 1, blow = {}) {
  const mv = rigid(moveAt(POSE_MOVES[move] ?? move, progress, dur, { weapon: resolveGear(look, gear).weapon?.type, hit: blow.hit, fin: blow.fin }));
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
  // The whole-body move, about the pivot, as drawMoved applies it (a turn is only ever a flip).
  const { pivot: pk, tilt } = leanOf(mv);
  const pivot = -H * scale * pk;
  const c = Math.cos(tilt * dir);
  const sn = Math.sin(tilt * dir);
  const body = ([px, py]) => {
    const x0 = px * mv.turn;
    const y0 = py - pivot;
    return [x0 * c - y0 * sn + dir * mv.lunge * scale, x0 * sn + y0 * c + pivot - mv.lift * scale];
  };
  return { hand: body(h), tip: body(tip), shoulder: body(at(shoulder)), angle: mv.weapon, reach: len, dir };
}

// How high up the figure leans from (a share of its height) and how far: on the ground from low
// down (about the knees), so the feet stay planted while the body leans into a blow, and no further
// than 0.5 rad; in the air about its middle (flips, dives), as far as the move says.
const GROUND_PIVOT = 0.135;
// How far (game pixels) the leaning upper body and the upright legs overlap at the waist.
const WAIST_OVERLAP = 1.5;
function leanOf(mv) {
  const air = Math.min(1, Math.abs(mv.lift) / 6);
  const tilt = Math.max(-0.5, Math.min(0.5, mv.tilt)) * (1 - air) + mv.tilt * air;
  return { pivot: GROUND_PIVOT + (0.42 - GROUND_PIVOT) * air, tilt };
}

function drawMoved(ctx, look, gear, x, y, state, anim, mv, moved) {
  if (!mv || (!mv.lift && !mv.lunge && !mv.tilt && mv.turn === 1 && mv.stretch === 1)) {
    paintHero(ctx, look, gear, x, y, state, anim, moved);
    return;
  }
  const scale = state.scale ?? 1;
  const dir = (state.facing ?? 1) < 0 ? -1 : 1;
  // On the ground the figure leans from low down (about the knees), so the feet stay planted while
  // the body leans into a blow; in the air it turns about its middle (flips, dives).
  const { pivot: pk, tilt } = leanOf(mv);
  const pivot = y - H * scale * pk;
  const whole = (c, t) => {
    c.translate(x + dir * mv.lunge * scale, pivot - mv.lift * scale);
    c.rotate(t * dir);
    // Only ever a mirror flip (see `rigid`): never narrowed or stretched.
    if (mv.turn < 0) c.scale(-1, 1);
    c.translate(-x, -pivot);
  };
  // Planted (on the ground, leaning), the figure is drawn in two parts: the legs stand upright on
  // their feet, and everything from the waist up leans from the hips, overlapping a little at the
  // waist so no gap opens. In the air the whole figure turns as one.
  if (pk < 0.2 && Math.abs(tilt) > 0.01 && Math.abs(tilt) < 0.6 && mv.turn > 0) {
    const cut = pivot + WAIST_OVERLAP * scale;
    const span = W * scale * 2;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - span, cut - 2 * WAIST_OVERLAP * scale, span * 2, H * scale);
    ctx.clip();
    whole(ctx, 0);
    paintHero(ctx, look, gear, x, y, state, anim, moved);
    ctx.restore();
    ctx.save();
    whole(ctx, tilt);
    // The upper part, clipped in the leaning frame just under the hips.
    ctx.beginPath();
    ctx.rect(x - span, pivot - H * scale * 2, span * 2, H * scale * 2 + WAIST_OVERLAP * scale);
    ctx.clip();
    paintHero(ctx, look, gear, x, y, state, anim, moved);
    ctx.restore();
    return;
  }
  ctx.save();
  whole(ctx, tilt);
  paintHero(ctx, look, gear, x, y, state, anim, moved);
  ctx.restore();
}

function paintHero(ctx, look, gear, x, y, state, anim, mv) {
  const { pose = 'idle', facing = 1, alpha = 1, scale = 1 } = state;
  const attack = Boolean(mv);
  const g = resolveGear(look, gear);
  // The Blade Dancer's chakrams take her rose gold, unless the item has a colour of its own.
  if (state.job === 'shinobi' && g.weapon?.type === 'dagger' && !g.weapon.variant && !g.weapon.theme && !g.weapon.fun) g.weapon = { ...g.weapon, variant: 'rosegold' };
  // The Sky Dancer's gloves take her sky blue the same way.
  if (state.job === 'kitsune' && g.weapon?.type === 'gauntlet' && !g.weapon.variant && !g.weapon.theme && !g.weapon.fun) g.weapon = { ...g.weapon, variant: 'skyblue' };
  // Each dancer path trims the dancers' showgirl gear in its own colour (plain pieces only, not
  // gear sets or recoloured variants): the Blade Dancer's in rose gold with gold gems.
  const trim = PATH_TRIMS[state.job];
  if (trim) for (const s of ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape']) if (g[s]?.family === 'thief' && !g[s].set && !g[s].variant) g[s] = { ...g[s], pal: { ...g[s].pal, ...trim } };
  // The body acts out the mood: the expression, or worn out at low health.
  const rig = solveRig({ ...state, mood: state.low ? 'tired' : look.dance ?? look.face ?? 'smile', armed: Boolean(g.weapon), wtype: g.weapon?.type }, anim, mv);
  // A choreographed pose overrides the rig (boss dances).
  if (state.rig) Object.assign(rig, state.rig);
  // A dance pose can lift the front arm over the head (drawn on top, like an attack arm).
  const over = attack ? null : rig.armOver ?? null;
  rig.armIn = !attack && over == null;
  // (Bare hands have idle bits too, unless someone else is already moving the arms: an NPC.)
  const idleW = !attack && pose === 'idle' && !state.ready && rig.view !== 'back' && (g.weapon || !state.rig) ? weaponIdle(g.weapon?.type ?? 'none', (state.time ?? 0) + (state.seed ?? 0) * 1.37) : null;
  // An arm the mood is already posing (crossed, on the hips, behind the back) keeps its pose: the
  // bit's own move for that arm is dropped rather than piled on top of it.
  const posed = rig.posed ?? {};
  if (idleW && !(posed.front && !g.weapon)) rig.frontArm = [rig.frontArm[0] + q(idleW.arm[0]), rig.frontArm[1] + q(idleW.arm[1])];
  // The rest of the body acts along, on top of the breathing (not for an NPC's own routine).
  if (idleW?.rig && !state.rig) {
    for (const [key, v] of Object.entries(idleW.rig)) {
      if ((key === 'backArm' && posed.back) || (key === 'armSide' && (posed.back || posed.front))) continue;
      if (key === 'armSide') rig.armSide = v;
      else if (Array.isArray(v)) rig[key] = rig[key].map((x, i) => x + v[i]);
      else rig[key] = (rig[key] ?? 0) + v;
    }
  }
  if (rig.view !== 'back') rig.face = liveFace(look, state, mv);
  const lookKey = JSON.stringify(look);
  const gk = `${gearKey(gear)}${trim ? `|${state.job}` : ''}`;
  // The player (and a boss) is always drawn as they are now; anyone else may wait a frame when
  // the frame's drawing budget is spent (see spriteBudgeted).
  const bodyKey = `hero|${lookKey}|${gk}|${rigKey(rig)}`;
  const buildBody = () => ({ w: W, h: H, shapes: bodyShapes(look, g, rig), res: RES, soft: 'cel', crisp: true, selout: true });
  const body = state.urgent ? sprite(bodyKey, buildBody) : spriteBudgeted(bodyKey, buildBody, `${lookKey}|${gk}|${state.seed ?? 0}`);

  const flip = facing < 0;
  const left = x - (W / 2) * scale;
  const top = y - H * scale - rig.lift * scale;
  // Mirror a point given in body coordinates when facing left.
  const sx = (px) => (flip ? left + (W - (px + OX)) * scale : left + (px + OX) * scale);
  const sy = (py) => top + (py + OY) * scale;

  const skin = look.skinTone ?? '#fff0e6';
  const sleeve = sleeveOf(g.top, skin);
  const long = longSleeves(g.top.design, g.top);
  // A bow being drawn (`mv.pull`) is drawn without its straight string; the string is bent back
  // to the draw hand live, with the arrow on it (see drawString).
  const drawn = (mv?.pull != null || mv?.twang > 0) && g.weapon?.type === 'bow' && !g.weapon.fun;
  const wpn = g.weapon && rig.view !== 'back' ? weaponSprite(g.weapon, state.time ?? 0, drawn) : null;
  const angles = mv ? { weapon: mv.weapon, arm: mv.arm } : over != null ? { weapon: 0, arm: over } : null;

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
    // Where the hand actually gets to: a target out of reach leaves it at the end of the
    // straightened arm, and the weapon goes there too, not at the target.
    const [, [wx, wy]] = reach(FRONT_SHOULDER, SHOULDER_Y, FRONT_SHOULDER + HAND_FORWARD + rig.frontArm[0], HAND_Y + rig.frontArm[1], UPPER_ARM, FOREARM, -1);
    hand = [wx + rig.tx, wy + bodyY];
    armKey = `r${rig.frontArm.join(',')},${rig.armSide}`;
  }
  const armDx = rig.tx;
  const armDy = bodyY;

  // (A chakram hangs from her hand down by her hip, the ring below it, never up by her face.)
  const restAngle = { crossbow: 55, gauntlet: 70, dagger: 160 }[g.weapon?.type] ?? 25;
  // On guard, the weapon points out front and dips with each bounce.
  // A crossbow is held at low ready, a little under the aim, so a shot settles into it instead of
  // the weapon dropping the moment the move ends (research/archery.md 2, 27: hold the finish).
  const guard = state.ready && pose === 'idle' ? { crossbow: 22, gauntlet: 95, bow: 20, dagger: 105 }[g.weapon?.type] ?? 62 : null;
  let weaponAngle = angles ? angles.weapon : idleW ? idleW.angle : guard != null ? guard + rig.by * 6 : restAngle + rig.frontArm[0] * 4 + (pose === 'jump' ? -15 : 0);

  // The hand was placed on the full-size figure; carry it into the squashed body.
  hand = [squashX(hand[0]), squashY(hand[1])];

  // Weapon size relative to the hero (they are drawn big on purpose).
  const ws = scale * WEAPON_SCALE;
  const drawWeapon = () => {
    // (A thrown weapon is out of her hand: `thrown` from the move, the Blade Dancer's ring in flight.)
    if (!wpn || (mv?.thrown ?? 0) >= 0.5) return;
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
    if (drawn && wpn.anchors?.string) drawString(ctx, wpn.anchors.string, mv.pull ?? 0, mv.nock ?? mv.pull > 0.05, ws, mv.twang ?? 0, mv.spares ?? 0);
    if (settings.weaponEffects) {
      if (el && wpn.blade) drawElementAura(ctx, el, (wpn.blade[0] - wpn.grip[1]) * ws, (wpn.blade[1] - wpn.grip[1]) * ws, time, ws);
      wpn.live?.(ctx, time, ws, wpn.grip);
    }
    ctx.restore();
  };

  // (A swing's smear is the effect pack's slash, drawn with the blow; see effects.js bladeCut.)

  // A folding fan in the free (back) hand, for moves that dance with one (`mv.fan`, how far it's
  // open, 0-1; `mv.fanA` its angle, degrees, 0 = straight up, + tipping forward): drawn from where
  // that hand really is, over the body so it always reads (a back hand reaching behind her is
  // out past her silhouette anyway); `mv.fanBack: true` tucks it behind instead.
  const drawFan = () => {
    if (mv?.fan == null || rig.view === 'back') return;
    const [, [wx, wy]] = reach(BACK_SHOULDER, SHOULDER_Y, BACK_SHOULDER - HAND_FORWARD + rig.backArm[0], HAND_Y + rig.backArm[1], UPPER_ARM, FOREARM, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(sx(squashX(wx + rig.tx)), sy(squashY(wy + bodyY)));
    if (flip) ctx.scale(-1, 1);
    ctx.rotate((((mv.fanA ?? 0) - 90) * Math.PI) / 180);
    // A Shrine Maiden dances with a gohei in place of the fan (the same motion, its streamers
    // flying out where the fan would open).
    if (state.job === 'shrinemaiden') paintGohei(ctx, scale * 1.3, mv.fan, state.time ?? 0);
    else paintFan(ctx, scale * 1.3, mv.fan);
    ctx.restore();
  };
  if (mv?.fanBack) drawFan();

  // Where both hands are on screen, for whoever holds something in them (`state.onHands`: an NPC's
  // props), called once the figure is drawn: (ctx, front hand, back hand, facing, scale).
  const handsAt = () => {
    if (!state.onHands) return;
    const [, [bx, by]] = reach(BACK_SHOULDER, SHOULDER_Y, BACK_SHOULDER - HAND_FORWARD + rig.backArm[0], HAND_Y + rig.backArm[1], UPPER_ARM, FOREARM, 1);
    state.onHands(ctx, [sx(hand[0]), sy(hand[1])], [sx(squashX(bx + rig.tx)), sy(squashY(by + bodyY))], flip ? -1 : 1, scale);
  };
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
  if (rig.view === 'back') return handsAt();
  if (!attack && over == null) {
    if (!wpn) return handsAt();
    drawWeapon();
    const grip = sprite(`grip|${lookKey}|${gk}|${armKey}`, () => ({ w: W, h: H, shapes: move(squash(armShapesNow.slice(armShapesNow.handAt)), 0, 0), res: RES, soft: 'cel', crisp: true, selout: true }));
    blit(ctx, grip, left + (flip ? -armDx : armDx) * KX * scale, top + armDy * KY * scale, { flip, flash: state.flash ?? 0, alpha, scale });
    if (idleW?.sparkle) idleSparkle(ctx, sx(hand[0]), sy(hand[1]), weaponAngle, (wpn.grip[1] - 4) * ws, flip, state.time ?? 0, scale);
    return handsAt();
  }
  drawWeapon();
  // A dance arm lies over the face and hair, so it takes a soft line in its own colours instead of
  // the heavy ink of a swinging weapon arm.
  const arm = sprite(`arm|${lookKey}|${gk}|${armKey}|${over != null ? 's' : 'c'}`, () => ({ w: W, h: H, shapes: move(squash(armShapesNow), 0, 0), res: RES, soft: 'cel', crisp: over == null, selout: true }));
  blit(ctx, arm, left + (flip ? -armDx : armDx) * KX * scale, top + armDy * KY * scale, { flip, flash: state.flash ?? 0, alpha, scale });
  if (mv && !mv.fanBack) drawFan();
  handsAt();
}

// A bow's string drawn back to the hand, in the bow's own frame (grip at the origin, tips up and
// down at `h`, the string at `x`, behind the grip): two straight runs from the tips to the nock,
// pulled back by `pull` (0-1, a full draw is about 10 px), and the arrow lying on it, its head
// past the bow's belly (archery research: the string and arrow are what read a draw at small
// size; the string snaps straight on the loose, in one frame, and rings; research/archery.md).
const PULL = 10;
const SHAFT = '#c89a6a';
function drawString(ctx, st, pull, nock, ws, twang = 0, spares = 0) {
  const nx = (st.x - PULL * Math.max(0, Math.min(1, pull)) - 1) * ws;
  const tx = (st.x - 1) * ws;
  const ty = st.h * ws;
  const y0 = -ws;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = st.color;
  ctx.lineWidth = 0.8 * ws;
  // Just loosed, the string rings: two faint lines at the ends of its swing (where a vibrating
  // string moves slowest), closing in as it dies down. Otherwise one line to the nock.
  const ring = twang > 0 && pull <= 0 ? [-1, 1].map((sd) => tx + sd * 1.6 * twang * ws) : [nx];
  if (ring.length > 1) ctx.globalAlpha = 0.6;
  for (const mx of ring) {
    ctx.beginPath();
    ctx.moveTo(tx, y0 - ty);
    ctx.lineTo(mx, y0);
    ctx.lineTo(tx, y0 + ty);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Spare arrows held fanned in the draw hand (a volley; research/archery.md 21).
  for (let i = 0; i < spares; i++) {
    const a = 0.35 + i * 0.3;
    ctx.strokeStyle = '#3a2d4f';
    ctx.lineWidth = 1.8 * ws;
    ctx.beginPath();
    ctx.moveTo(nx, y0);
    ctx.lineTo(nx + Math.cos(a) * 12 * ws, y0 + Math.sin(a) * 12 * ws);
    ctx.stroke();
    ctx.strokeStyle = SHAFT;
    ctx.lineWidth = 0.8 * ws;
    ctx.stroke();
    ctx.fillStyle = '#ff8fb0';
    ctx.fillRect(nx - ws, y0 + (i + 0.5) * ws, 2.4 * ws, ws);
  }
  if (nock) {
    // The arrow: inked shaft from the nock to past the belly, a steel head, pink fletching.
    const hx = nx + 22 * ws;
    ctx.strokeStyle = '#3a2d4f';
    ctx.lineWidth = 2 * ws;
    ctx.beginPath();
    ctx.moveTo(nx, y0);
    ctx.lineTo(hx, y0);
    ctx.stroke();
    ctx.strokeStyle = SHAFT;
    ctx.lineWidth = 0.9 * ws;
    ctx.stroke();
    ctx.fillStyle = '#3a2d4f';
    ctx.beginPath();
    ctx.moveTo(hx + 3.6 * ws, y0);
    ctx.lineTo(hx - 0.6 * ws, y0 - 2 * ws);
    ctx.lineTo(hx - 0.6 * ws, y0 + 2 * ws);
    ctx.fill();
    ctx.fillStyle = '#eef3ff';
    ctx.beginPath();
    ctx.moveTo(hx + 2.6 * ws, y0);
    ctx.lineTo(hx, y0 - 1.2 * ws);
    ctx.lineTo(hx, y0 + 1.2 * ws);
    ctx.fill();
    ctx.fillStyle = '#ff8fb0';
    ctx.fillRect(nx + 0.6 * ws, y0 - 1.8 * ws, 3 * ws, 1.2 * ws);
    ctx.fillRect(nx + 0.6 * ws, y0 + 0.6 * ws, 3 * ws, 1.2 * ws);
  }
  ctx.restore();
}

