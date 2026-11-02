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
import { DESIGNS, gloveShapes } from './weapon-designs.js';
import { finish } from './jobgear/kit.js';

export function weaponFrames(type, tier = 0, theme = null) {
  if (!FORMS[type]) return 1;
  if (theme) return 6;
  return tier >= 9 ? 6 : tier >= 5 ? 4 : 1;
}

const built = new Map();
const GLOVE = { shapes: [], blade: [-2, 0], reach: [], a: { tip: [0, -2], head: [0, -1], blade: [-2, 0] } };

// `variant` (dark, white, crimson, azure, gilded, or null) recolors a progression weapon.
// `unstrung` leaves a bow's string out, for drawing it pulled back live.
export function weaponShapes(type, tier = 0, frame = 0, theme = null, variant = null, unstrung = false) {
  const form = FORMS[type];
  if (!form) return null;
  const key = `${type}|${tier}|${theme}|${variant}|${frame}|${unstrung}`;
  let def = built.get(key);
  if (!def) {
    const look = lookFor(type, tier, theme, variant);
    // Levels 1-50 have their own designs (weapon-designs.js); a gauntlet is a glove on the hand
    // (drawn with the hand), so nothing is held.
    const own = !theme && tier <= 10 && DESIGNS[type];
    const { shapes, blade, reach, a } = type === 'gauntlet' ? GLOVE : own ? own(look, tier, frame) : form(look, frame);
    // (A glove carries no shimmer of its own: on so small a thing it reads as a smudge over the hand.)
    def = pack(finish(unstrung ? shapes.filter((sh) => !sh.string) : shapes, materialsOf(look)), { blade, reach, anchors: a, live: type === 'gauntlet' ? null : liveFor(look, a) });
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

// Wands and staves (the Spirit Mage's shrine tools): a wand is a bell staff, a lacquered handle
// with tiers of gold bells and ribbons trailing from its end; a staff is a gohei, a pole with a
// crossbar of white zigzag paper streamers and a ring of bells at the top.
function iconFocus(c, staff) {
  const r = c.rank;
  // The lacquer takes a little of the weapon's own colour, so a recoloured one shows it.
  const LAC = mix(['#cfc070', '#ead2a2', '#d23a34', '#d23a34', '#2a2230', '#2a2230'][r] ?? '#d23a34', c.main, 0.3);
  const BELL = r <= 1 ? '#f2c94c' : c.trim;
  const out = [];
  const dot = (cc, u, rr, col) => {
    const [x, y] = at(cc, u);
    return E(x, y, rr, rr, col);
  };
  if (staff) {
    out.push(dg(15.2, 16.8, -14, 9, LAC), F(dg(16, 16.8, -14, 9, shadeOf(LAC))));
    out.push(dg(12, 20, 9, 10.2, c.trim));
    // Paper streamers either side of the crossbar.
    for (const side of [-1, 1]) for (let i = 0; i < 3; i++) out.push(dg(16 + side * (2.6 + (i % 2) * 0.6) - 0.9, 16 + side * (2.6 + (i % 2) * 0.6) + 0.9, 8.6 - i * 2.2, 10 - i * 2.2 - 0.6, i % 2 ? '#ddd6ee' : WHITE));
    if (r >= 1) out.push(dot(16, 13.6, 2.6, c.trim), F(dot(16, 13.6, 1.6, '#3a2e50')));
    out.push(dot(14.2, 13, 0.9, BELL), dot(17.8, 13, 0.9, BELL));
    if (c.gem && r >= 2) out.push(F(dot(16, 13.6, 0.9, c.gem)));
    return out;
  }
  out.push(dg(15.2, 16.8, -10, 2, LAC), F(dg(16, 16.8, -10, 2, shadeOf(LAC))));
  // Ribbons trailing from the end.
  out.push(dg(13.6, 14.4, -14, -9, '#e0303e'), dg(17.6, 18.4, -14, -9, '#4f8cd8'));
  out.push(dg(14.6, 17.4, 2, 3, c.trim), dg(15.6, 16.4, 3, 12, c.trimDark));
  const tiers = r >= 4 ? 4 : r >= 2 ? 3 : 2;
  for (let i = 0; i < tiers; i++) {
    const u = 4.4 + i * 2.4;
    const n = tiers + 1 - i;
    for (let k = 0; k < n; k++) out.push(dot(16 - (n - 1) * 1 + k * 2, u, 0.95, BELL));
  }
  if (c.gem && r >= 2) out.push(dot(16, 4.4 + tiers * 2.4, 1, c.gem));
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

// Levels 1-50: the icon is the weapon's own drawing, turned to lie corner to corner (the tip up
// and to the right) and fitted to the 16x16 cell, so the icon always matches what's in the hand.
// A gauntlet's icon is its glove.
const ICON_TURN = { crossbow: -45 };
// Long weapons show their head: only this top part of them is fitted to the cell (the rest runs
// off its corner).
const ICON_HEAD = { spear: 0.5, staff: 0.45, wand: 0.7 };
function designIcon(type, tier, look) {
  const ang = ((ICON_TURN[type] ?? 45) * Math.PI) / 180;
  const [c, sn] = [Math.cos(ang), Math.sin(ang)];
  const d = type === 'gauntlet' ? null : DESIGNS[type](look, tier, 0);
  const raw = d ? d.shapes : gloveShapes(look, 0, 0, -4, 5);
  // The part of the weapon that sets the fit (before turning): its head, for long ones.
  let cutY = Infinity;
  if (d && ICON_HEAD[type]) {
    const ys = raw.flatMap((sh) => (sh.t === 'p' ? sh.pts.map(([, y]) => y + sh.y) : sh.t === 'r' ? [sh.y, sh.y + sh.h] : [sh.y - sh.ry, sh.y + sh.ry]));
    const lo = Math.min(...ys);
    cutY = lo + (Math.max(...ys) - lo) * ICON_HEAD[type];
  }
  const turn = type === 'gauntlet' ? ([x, y]) => [x, y] : ([x, y]) => [x * c - y * sn, x * sn + y * c];
  // Everything as polygons (and round shapes kept round), turned.
  const polys = raw.map((sh) => {
    if (sh.t === 'e') {
      const [x, y] = turn([sh.x, sh.y]);
      return { ...sh, x, y };
    }
    const pts = sh.t === 'r' ? [[sh.x, sh.y], [sh.x + sh.w, sh.y], [sh.x + sh.w, sh.y + sh.h], [sh.x, sh.y + sh.h]] : sh.pts.map(([x, y]) => [x + sh.x, y + sh.y]);
    return { ...sh, t: 'p', x: 0, y: 0, pts: pts.map(turn) };
  });
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  polys.forEach((p, i) => {
    const sh = raw[i];
    // Each point's height before turning, to leave out what lies below the head.
    const ys = sh.t === 'p' ? sh.pts.map(([, y]) => y + sh.y) : sh.t === 'r' ? [sh.y, sh.y, sh.y + sh.h, sh.y + sh.h] : [sh.y, sh.y];
    const pts = (p.t === 'e' ? [[p.x - p.rx, p.y - p.ry], [p.x + p.rx, p.y + p.ry]] : p.pts).filter((_, j) => ys[j] <= cutY);
    for (const [x, y] of pts) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  });
  const k = Math.min(14.6 / (x1 - x0), 14.6 / (y1 - y0));
  const ox = 8 - ((x0 + x1) / 2) * k;
  const oy = 8 - ((y0 + y1) / 2) * k;
  const fit = (p) => (p.t === 'e' ? { ...p, x: p.x * k + ox, y: p.y * k + oy, rx: p.rx * k, ry: p.ry * k } : { ...p, pts: p.pts.map(([x, y]) => [x * k + ox, y * k + oy]) });
  return finish(polys.map(fit), materialsOf(look));
}

export function weaponIcon(type, tier = 0, theme = null, variant = null) {
  if (!ICONS[type]) return null;
  const look = lookFor(type, tier, theme, variant);
  if (type === 'gauntlet' || (!theme && tier <= 10 && DESIGNS[type])) return designIcon(type, tier, look);
  return [...ICONS[type](iconColors(look)), ...(theme ? ICON_MARKS[theme]() : tierMark(type, look))];
}
