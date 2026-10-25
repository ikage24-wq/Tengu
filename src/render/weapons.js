// Weapon art: how each weapon is drawn in the hero's hand and as a 16x16 bag icon.
//
// Every weapon type comes in 21 progression tiers (0 wood or stone, then a material every five
// levels from Copper to Genesis), each in five color variants, and six endgame themes (holy,
// demonic, bone, laser, chainsaw, cyber). The shapes come from the type's form (weapon-forms.js)
// in the tier's or theme's look (weapon-kit.js); live effects drawn every frame come from
// weapon-fx.js. Better weapons animate more: gems shine over 4 frames from Silver (tier 5), and
// runes, motifs and every endgame weapon run 6 frames from Runic (tier 9).
//
// weaponShapes(type, tier, frame, theme, variant) -> { w, h, grip, blade: [top, base], shapes, live }
// The hero rotates the sprite around `grip`; `live(ctx, time, s)` draws in that rotated space
// with the grip at the origin and the weapon pointing toward -y.

import { R, E, P, T, F } from './pixel.js';
import { lookFor, pack, GOLD, WHITE } from './weapon-kit.js';
import { FORMS } from './weapon-forms.js';
import { liveFor } from './weapon-fx.js';
import { seraphShapes, SERAPH_ICON } from './seraph.js';

export function weaponFrames(type, tier = 0, theme = null) {
  if (!FORMS[type]) return 1;
  if (theme) return 6;
  return tier >= 9 ? 6 : tier >= 5 ? 4 : 1;
}

const built = new Map();

// `variant` (dark, white, crimson, azure, gilded, or null) recolors a progression weapon.
export function weaponShapes(type, tier = 0, frame = 0, theme = null, variant = null) {
  const form = FORMS[type];
  if (!form) return null;
  if (type === 'staff' && theme === 'holy') return seraphShapes(frame);
  const key = `${type}|${tier}|${theme}|${variant}|${frame}`;
  let def = built.get(key);
  if (!def) {
    const look = lookFor(type, tier, theme, variant);
    const { shapes, blade, reach, a } = form(look, frame);
    def = pack(shapes, { blade, reach, anchors: a, live: liveFor(look, a) });
    built.set(key, def);
  }
  return def;
}

// ---------- Icons ----------

function iconColors(look) {
  const th = look.theme;
  return {
    main: th === 'laser' ? look.beam : look.blade,
    dark: th === 'laser' ? WHITE : look.bladeDark,
    trim: look.trim,
    handle: look.handle,
    grip: look.grip,
    accent: { holy: GOLD, demonic: look.hot, bone: look.soul, laser: WHITE, chainsaw: '#ffd23b', cyber: look.neon?.[0] }[th] ?? (look.gems ? look.gem : look.edge),
  };
}

const ICONS = {
  sword: (c) => [T([[13, 1], [15, 3], [6, 12], [4, 10]], c.main), F(R(8, 6, 4, 1, c.dark)), R(2, 10, 6, 2, c.trim), R(1, 13, 3, 2, c.grip), P(12, 3, c.accent)],
  dagger: (c) => [T([[11, 3], [14, 2], [13, 5], [8, 10], [6, 8]], c.main), R(4, 9, 5, 2, c.trim), R(2, 12, 3, 2, c.grip), P(11, 4, c.accent)],
  axe: (c) => [R(4, 4, 2, 11, c.handle), T([[6, 2], [13, 1], [15, 6], [12, 10], [6, 8]], c.main), T([[8, 3], [12, 3], [13, 6], [8, 7]], c.dark), R(3, 3, 4, 2, c.trim), P(14, 5, c.accent)],
  spear: (c) => [T([[3, 13], [10, 6], [11, 7], [4, 14]], c.handle), T([[10, 1], [15, 1], [15, 6], [11, 8], [8, 5]], c.main), R(8, 7, 2, 2, c.trim), P(13, 3, c.accent)],
  wand: (c) => [T([[3, 14], [9, 8], [10, 9], [4, 15]], c.handle), E(11, 5, 3.5, 3.5, c.trim), E(11, 5, 2, 2, c.main), P(11, 5, c.accent)],
  staff: (c) => [T([[2, 15], [8, 8], [9, 9], [3, 16]], c.handle), E(11, 5, 4, 4, c.trim), E(11, 5, 2.6, 2.6, c.main), P(10, 4, c.accent)],
  bow: (c) => [T([[2, 2], [7, 3], [11, 7], [13, 12], [14, 14], [12, 13], [10, 9], [6, 5]], c.handle), T([[2, 2], [3, 2], [14, 13], [14, 14]], '#fff6fb'), R(9, 7, 2, 2, c.grip), P(8, 4, c.accent)],
  crossbow: (c) => [R(1, 7, 10, 3, c.handle), R(12, 2, 2, 12, c.trim), R(6, 8, 6, 1, c.dark), R(3, 10, 3, 3, c.handle), P(14, 8, c.accent)],
  claw: (c) => [R(3, 9, 8, 6, c.trim), T([[4, 9], [4, 3], [6, 9]], c.main), T([[7, 9], [8, 1], [9, 9]], c.main), T([[10, 9], [12, 3], [11, 9]], c.main), P(7, 12, c.accent)],
};

// A little mark for each theme so endgame icons stand out at a glance.
const ICON_MARKS = {
  holy: () => [E(3, 3, 2.5, 1, GOLD), E(3, 3, 1.2, 0.3, 'none'), F(P(14, 14, WHITE))],
  demonic: () => [T([[1, 5], [2, 1], [3, 5]], '#3a1019'), F(P(14, 14, '#ff3b2b'))],
  bone: () => [E(3, 3, 2.4, 2.2, '#f3e9cf'), F(P(2, 3, '#6bff9a')), F(P(4, 3, '#6bff9a'))],
  laser: () => [F(P(14, 14, '#ffffff'))],
  chainsaw: () => [R(1, 1, 4, 3, '#ff8a1f'), F(P(2, 2, '#2a2a33'))],
  cyber: () => [F(R(1, 1, 3, 1, '#3bf0ff')), F(R(1, 3, 2, 1, '#ff3bd4'))],
};

// Progression icons gain a glint in a free corner as they climb: a rune spark from Runic, a
// four-point star from Dragonbone, and a white-hot heart in it from Abyssal. Dark variants keep
// their violet edge glow as a second spark.
const MARK_AT = { axe: [13, 13], bow: [3, 13] };
function tierMark(type, look) {
  const [x, y] = MARK_AT[type] ?? [2, 2];
  const c = look.prism?.[4] ?? look.rune;
  const out = [];
  if (look.tier >= 13) out.push(F(P(x - 1, y, c)), F(P(x + 1, y, c)), F(P(x, y - 1, c)), F(P(x, y + 1, c)));
  if (look.tier >= 9) out.push(F(P(x, y, look.tier >= 17 ? WHITE : c)));
  if (look.glow) out.push(F(P(x + (x < 8 ? 2 : -2), y + (y < 8 ? 2 : -2), look.glow)));
  return out;
}

export function weaponIcon(type, tier = 0, theme = null, variant = null) {
  if (!ICONS[type]) return null;
  if (type === 'staff' && theme === 'holy') return SERAPH_ICON;
  const look = lookFor(type, tier, theme, variant);
  return [...ICONS[type](iconColors(look)), ...(theme ? ICON_MARKS[theme]() : tierMark(type, look))];
}
