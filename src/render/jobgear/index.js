// Job gear: the warrior, archer, mage, and thief sets (one every 5 levels, tiers 0 to 19) and
// the earring ladder. Each job has its own module that draws every slot for any tier; this file
// builds the palette a piece is painted in and hands the drawing to the right module.
//
// A job module default-exports an object with these functions. `t` is the tier (0 = level 5,
// 19 = level 100), `p` the palette below, and `m` the motion: { sway, hair, flap }, where sway
// (about -3..3) bends hems and tails with movement, hair is the spring-driven head follow, and
// flap (0/1) beats wings. All shapes are in body coordinates (see figure.js for landmarks).
//
//   hat(t, p, m)          over the head, drawn after the face and front hair
//   hatBack(t, p, m)      behind the head (brims, hoods, plumes that go behind)
//   hatTucks(t)           true if the hat hides the back hair (helms, hoods)
//   hatHidesBangs(t)      true if it hides the front hair too (closed helms)
//   top(t, p, m)          the torso
//   sleeve(t, p)          the sleeve color; longSleeves(t): whether sleeves reach the wrist
//   shoulder(t, p, side)  pauldrons or puffs around a shoulder at (0, 0), over the upper arm;
//                         side is -1 for the back arm and 1 for the front arm
//   legs(t, p, skin)      leg colors: { top, low, pad, cuff } (thigh, shin, knee pad, cuff)
//   skirt(t, p, m)        tassets, robe skirts, coat tails over the hips, or null
//   shoe(t, p, k)         one shoe, built with the shoe kit k (see gear.js shoeShapes)
//   hand(t, p, hx, hy, ex, ey)  a gloved hand at (hx, hy), with the elbow at (ex, ey) for bracers
//   cape(t, p, m)         behind the body; capeFront(t, p, m) over the top (clasps, scarf ends)

import { mix } from '../pixel.js';
import { darker, lighter } from './kit.js';
import { variantsFor } from '../../data/items.js';
import { SETS } from '../../data/sets.js';
import warrior from './warrior.js';
import archer from './archer.js';
import mage from './mage.js';
import cleric from './cleric.js';
import sorcerer from './sorcerer.js';
import thief from './dancer.js';
import casual from './casual.js';
import fun from './fun.js';
import gacha from './gacha.js';
import costume from './costume.js';
import acc from './acc.js';
import starter from './starter.js';

// The four job families, plus the Cash Shop's casual, funny, full-outfit and accessory lines and the creator's
// starter outfits (where `t` picks a
// design from data/outfits-*.js instead of a tier).
export const JOB_GEAR = { warrior, archer, mage, cleric, sorcerer, thief, casual, fun, gacha, costume, acc, starter };
// Looks, not job gear: no job auras, white trim, no glow. `starter` is the creator's outfits.
export const LOOK_FAMILIES = new Set(['casual', 'fun', 'gacha', 'costume', 'acc', 'starter']);

// Trim metal by tier band: bronze, silver, gold, platinum, then radiant.
const TRIMS = ['#d9a45a', '#e6ecf6', '#ffd66b', '#f4f8ff', '#fff1a8'];
// Each job's gems and glows as its sets climb.
const ACCENTS = {
  warrior: ['#ff6b5c', '#ff6b5c', '#ffb03b', '#ff3b2b', '#ffd23b'],
  archer: ['#7fe08f', '#7fe0c8', '#9fe8ff', '#ffe36b', '#b8ffd6'],
  mage: ['#8fd3ff', '#b48cff', '#ff8fe0', '#ffe36b', '#e8f0ff'],
  thief: ['#ff6b8a', '#b46bff', '#6bffd2', '#ff3b5c', '#c9a6ff'],
};

// The palette for a piece. `color` is the item's (or its variant's) main color, `accent` the
// variant's accent if it has one.
export function gearPalette(family, t, color, accent = null, variant = null) {
  const look = LOOK_FAMILIES.has(family);
  const band = look ? 0 : Math.min(4, Math.floor(t / 4));
  const main = color;
  const trim = look ? '#ffffff' : TRIMS[band];
  const acc = accent ?? ACCENTS[family]?.[band] ?? '#ffe36b';
  const p = {
    tier: t, band, variant, family,
    // A hue-shifted ramp: shadows turn cool (or toward red on warm colours), lights warm.
    main, dark: darker(main, 0.15), deep: darker(main, 0.29), light: lighter(main, 0.12),
    // A second cloth that goes with the main one: darker under-layers for light colors and the
    // other way round.
    second: mix(main, lum(main) > 0.6 ? '#4a3f6a' : '#fff6ec', 0.55),
    trim, trimDark: darker(trim, 0.22, 'metal'), trimLight: lighter(trim, 0.1),
    accent: acc, glow: t >= 10 && !look ? acc : null,
  };
  p.secondDark = darker(p.second, 0.14);
  return p;
}

function lum(hex) {
  const n = parseInt(hex.slice(1), 16);
  return (0.3 * ((n >> 16) & 255) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255;
}

// The drawable piece for an item definition (and variant), as the hero renderer passes it to
// gear.js: job sets and jewels carry their family, tier, and palette.
export function pieceOf(def, variant = null) {
  const v = variant ? variantsFor(def)?.[variant] : null;
  const color = v?.main ?? def.color;
  if (def.design !== 'job' && def.design !== 'jewel') return { design: def.design, color };
  return { design: def.design, color, family: def.design === 'job' ? def.family : null, set: def.set ?? null, tier: def.tier, variant, pal: gearPalette(def.family ?? 'mage', def.tier, color, v?.accent ?? def.accent ?? (def.set ? SETS[def.set].accent : null), variant) };
}
