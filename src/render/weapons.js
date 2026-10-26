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

import { R, E, P, T, F, mix } from './pixel.js';
import { lookFor, pack, GOLD, WHITE } from './weapon-kit.js';
import { FORMS } from './weapon-forms.js';
import { liveFor } from './weapon-fx.js';
import { finish } from './jobgear/kit.js';
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
    def = pack(finish(shapes, materialsOf(look)), { blade, reach, anchors: a, live: liveFor(look, a) });
    built.set(key, def);
  }
  return def;
}

// The weapon's parts as materials (see jobgear/kit.js), lit from the upper front of the weapon's
// own frame: blades and fittings are metal (a shadow plane down the back of the blade, the base
// as reflected light, a glint band and a specular toward the tip), wood and wraps are leather,
// gems are gems, and neon, beams and runes stay emissive. Wood, stone and bone blades are matte.
const MATTE = new Set(['wood', 'dragonbone']);
function materialsOf(look) {
  const metal = new Set();
  const wood = new Set([look.handle, look.handleDark, look.grip]);
  const bladeMat = look.tier === 0 || MATTE.has(look.name) || look.theme === 'bone' ? 'leather' : 'metal';
  if (bladeMat === 'metal') metal.add(look.blade).add(look.bladeDark);
  if (look.theme !== 'bone') metal.add(look.trim).add(look.trimDark);
  const gems = new Set([look.gem]);
  return (s) => {
    if (s.c === look.edge || s.c === look.beam || s.c === look.rune) return null;
    if (metal.has(s.c)) return 'metal';
    if (gems.has(s.c)) return 'gem';
    if (s.c === look.blade || s.c === look.bladeDark || wood.has(s.c)) return 'leather';
    return null;
  };
}

// ---------- Icons ----------

function iconColors(look) {
  const th = look.theme;
  return {
    main: th === 'laser' ? look.beam : look.blade,
    dark: th === 'laser' ? WHITE : look.bladeDark,
    edge: th === 'laser' ? WHITE : look.edge,
    trim: look.trim,
    trimDark: look.trimDark,
    handle: look.handle,
    handleDark: look.handleDark,
    grip: look.grip,
    accent: { holy: GOLD, demonic: look.hot, bone: look.soul, laser: WHITE, chainsaw: '#ffd23b', cyber: look.neon?.[0] }[th] ?? (look.gems ? look.gem : look.edge),
    rank: look.rank,
    gem: look.gems > 0 || th ? (look.prism?.[2] ?? look.gem) : null,
  };
}

// Icons are drawn on the diagonal from the grip (bottom left) to the tip (top right), in
// coordinates across (c = x + y, 16 on the centre line) and along (u = x - y, toward the tip),
// so 45-degree edges step cleanly one pixel at a time. Each part follows the weapon's light: the
// upper-left face of a blade is the lit edge, the lower-right the shadow, with a specular near the
// tip. Ranks grow every four tiers as on the weapon itself: longer, wider, grander guards and heads.
const at = (c, u) => [(c + u) / 2, (c - u) / 2];
// A strip across c0..c1 and along u0..u1.
const dg = (c0, c1, u0, u1, col) => T([at(c0, u0), at(c0, u1), at(c1, u1), at(c1, u0)], col);
// A point (tip) at (c, u) closing a strip of c0..c1 that ends at u0.
const tipOf = (c0, c1, u0, c, u, col) => T([at(c0, u0), at(c, u), at(c1, u0)], col);
const px = (c, u, col) => {
  const [x, y] = at(c, u);
  return F(P(Math.floor(x), Math.floor(y), col));
};

// A blade on the centre line from u0 up to its tip, `w` rows wide: base, shadow side, lit edge,
// and a specular glint.
function iconBlade(c, u0, tip, w) {
  const h = w / 2;
  const tl = h + 1;
  return [
    dg(16 - h, 16 + h, u0, tip - tl, c.main), tipOf(16 - h, 16 + h, tip - tl, 16, tip, c.main),
    dg(16, 16 + h, u0, tip - tl, c.dark), tipOf(16, 16 + h, tip - tl, 16, tip - 0.5, c.dark),
    dg(16 - h, 16 - h + 1, u0 + 1, tip - tl - 0.5, c.edge),
    px(16 - h + 0.5, tip - tl - 1.5, WHITE),
  ];
}

function iconGrip(c, u0, u1, pommel) {
  const out = [dg(15, 17, u0, u1, c.grip)];
  for (let u = u0 + 1; u < u1 - 0.5; u += 2) out.push(F(dg(15, 17, u, u + 0.6, shadeOf(c.grip))));
  if (pommel) out.push(dg(16 - pommel, 16 + pommel, u0 - 2, u0, c.trim), px(16 - pommel + 0.5, u0 - 1, c.edge === WHITE ? WHITE : c.trim));
  return out;
}
const shadeOf = (col) => mix(col, '#2a2035', 0.3);

function iconSword(c, dagger = false) {
  const r = c.rank;
  const tip = dagger ? 6 + r * 0.8 : 9 + r * 0.8;
  const w = r >= 3 ? 3 : 2;
  const gu = dagger ? -3 : -4;
  const gw = (dagger ? 2 : 2.5) + (r >= 2 ? 1 : 0) + (r >= 4 ? 0.5 : 0);
  const out = [...iconGrip(c, gu - (dagger ? 5 : 6), gu, r >= 1 ? 1.5 : 1)];
  out.push(...iconBlade(c, gu + 1, tip, w));
  // The guard: a bar, swept toward the tip from rank 3.
  out.push(dg(16 - gw, 16 + gw, gu - 1, gu + 1, c.trim), F(dg(16, 16 + gw, gu - 1, gu - 0.2, c.trimDark)));
  if (r >= 3) out.push(dg(16 - gw - 1, 16 - gw + 0.5, gu, gu + 2.5, c.trim), dg(16 + gw - 0.5, 16 + gw + 1, gu, gu + 2.5, c.trim));
  if (c.gem) out.push(px(16, gu, c.gem));
  return out;
}

function iconAxe(c) {
  const r = c.rank;
  const top = 5;
  const hd = 5 + Math.min(r, 2) * 0.5;
  const out = [dg(15, 17, -13, top, c.handle), F(dg(16, 17, -13, top, c.handleDark)), ...iconGrip(c, -13, -8, 0)];
  // The head: a fan flaring away from the haft, longest at its cutting edge.
  const head = (sd) => {
    const c0 = sd > 0 ? 17 : 15;
    const c1 = c0 + sd * hd;
    return [
      T([at(c0, top - 6), at(c0, top + 1), at(c1, top + 3.5), at(c1, top - 9)], c.main),
      T([at(c0, top - 6), at(c0, top - 2.5), at(c1, top - 3), at(c1, top - 9)], c.dark),
      dg(c1 - sd, c1, top - 8.5, top + 3, c.edge),
    ];
  };
  out.push(...head(1));
  if (r >= 3) out.push(...head(-1));
  out.push(dg(14.5, 17.5, top - 6.5, top - 5, c.trim), px(15.5, top - 6, c.accent));
  if (r >= 2) out.push(tipOf(15, 17, top, 16, top + 2.5, c.trim));
  return out;
}

function iconSpear(c) {
  const r = c.rank;
  const sock = 3;
  const tip = 12 + Math.min(r, 3) * 0.5;
  const hw = r >= 2 ? 3 : 2;
  const out = [dg(15, 17, -14, sock, c.handle), F(dg(16, 17, -14, sock, c.handleDark))];
  // A leaf head: widest a third of the way up, the lit half and the shadow half meeting on the rib.
  const mid = sock + (tip - sock) * 0.35;
  out.push(T([at(15, sock), at(16 - hw, mid), at(16, tip), at(16 + hw, mid), at(17, sock)], c.main));
  out.push(T([at(16, sock), at(16, tip), at(16 + hw, mid), at(17, sock)], c.dark));
  out.push(T([at(16 - hw + 0.8, mid), at(16, tip - 1), at(16 - 0.2, mid)], c.edge), px(15.5, tip - 2.5, WHITE));
  if (r >= 3) out.push(dg(16 - hw - 1.5, 16 + hw + 1.5, sock - 1, sock + 0.5, c.trim));
  out.push(dg(14.5, 17.5, sock - 1.5, sock + 0.5, c.trim));
  return out;
}

// Wands and staves: a shaft with a ring and gem at the top, growing prongs and crowns by rank.
function iconFocus(c, staff) {
  const r = c.rank;
  const end = staff ? 6 : 4;
  const [ox, oy] = at(16, end + 4);
  const R0 = (staff ? 3.6 : 2.8) + (r >= 3 ? 0.4 : 0);
  const out = [dg(15, 17, staff ? -14 : -10, end, c.handle), F(dg(16, 17, staff ? -14 : -10, end, c.handleDark))];
  if (r >= 1) out.push(dg(14.5, 17.5, end - 1.5, end, c.trim));
  if (staff && r >= 2) {
    // Prongs cradling the orb.
    out.push(T([at(14, end), at(12, end + 4), at(13.4, end + 7), at(14.6, end + 3)], c.trim), T([at(18, end), at(20, end + 4), at(18.6, end + 7), at(17.4, end + 3)], c.trim));
  }
  if (!staff && r >= 3) out.push(T([[ox, oy - R0 - 2.5], [ox + 1, oy - R0], [ox - 1, oy - R0]], c.trim), T([[ox + R0 + 2.5, oy], [ox + R0, oy + 1], [ox + R0, oy - 1]], c.trim));
  out.push(E(ox, oy, R0, R0, c.trim), E(ox, oy, R0 - 1, R0 - 1, c.main), F(E(ox + 0.6, oy + 0.6, R0 - 1.6, R0 - 1.6, c.dark)), F(P(Math.floor(ox - 1), Math.floor(oy - 1), WHITE)));
  if (c.gem) out.push(F(P(Math.floor(ox), Math.floor(oy), c.gem)));
  return out;
}

function iconBow(c) {
  const r = c.rank;
  const out = [
    T([[2, 2], [7, 3], [11, 7], [13, 12], [14, 14], [12, 13], [10, 9], [6, 5]], c.handle),
    F(T([[7, 3], [11, 7], [13, 12], [12.2, 12], [10.2, 8], [6.4, 4]], c.handleDark)),
    T([[2, 2], [3, 2], [14, 13], [14, 14]], '#fff6fb'), R(9, 7, 2, 2, c.grip),
  ];
  // Recurved, capped tips from rank 2, and a gem at the grip once it has one.
  if (r >= 2) out.push(R(1, 1, 2, 2, c.trim), R(13, 13, 2, 2, c.trim));
  if (r >= 4) out.push(T([[2, 2], [0, 4], [1, 1]], c.trim), T([[14, 14], [12, 16], [15, 15]], c.trim));
  out.push(P(8, 4, c.accent));
  if (c.gem) out.push(F(P(9, 7, c.gem)));
  return out;
}

function iconCrossbow(c) {
  const r = c.rank;
  const out = [R(1, 7, 10, 3, c.handle), F(R(1, 9, 10, 1, c.handleDark)), R(12, 2, 2, 12, c.trim), F(R(13, 2, 1, 12, c.trimDark)), R(6, 8, 6, 1, c.dark), R(3, 10, 3, 3, c.handle)];
  if (r >= 2) out.push(R(11, 1, 4, 1, c.trim), R(11, 14, 4, 1, c.trim));
  if (r >= 4) out.push(R(14, 0, 2, 2, c.trim), R(14, 14, 2, 2, c.trim));
  out.push(P(14, 8, c.accent), F(P(12, 3, WHITE)));
  return out;
}

function iconGauntlet(c) {
  const out = [T([[1, 12], [4, 9], [8, 13], [5, 16]], c.trim), T([[2, 11], [3, 10], [7, 14], [6, 15]], c.dark), T([[4, 9], [6, 7], [10, 11], [8, 13]], c.handle), T([[5, 7], [7, 5], [11, 9], [9, 11]], c.trim), P(7, 5, c.dark), P(9, 7, c.dark), R(12, 0, 1, 7, c.main), R(9, 3, 7, 1, c.main), R(11, 2, 3, 3, c.main), F(P(12, 3, c.dark)), P(6, 12, c.accent)];
  if (c.rank >= 3) out.push(R(10, 1, 1, 1, c.main), R(14, 1, 1, 1, c.main), R(10, 5, 1, 1, c.main), R(14, 5, 1, 1, c.main));
  return out;
}

const ICONS = {
  sword: (c) => iconSword(c),
  dagger: (c) => iconSword(c, true),
  axe: iconAxe,
  spear: iconSpear,
  wand: (c) => iconFocus(c, false),
  staff: (c) => iconFocus(c, true),
  bow: iconBow,
  crossbow: iconCrossbow,
  gauntlet: iconGauntlet,
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
