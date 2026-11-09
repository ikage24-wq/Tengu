// Weapon forms: how each weapon type is built for a look (a progression tier or an endgame theme)
// and an animation frame. Every form draws around the grip at (0, 0) pointing toward -y, and
// returns { shapes, blade: [top, base], reach, a } where `a` holds the anchors live effects use
// (see weapon-fx.js). Higher ranks grow longer and fancier; themes swap in their own parts.
//
// Progression weapons evolve by tier: a bigger rank every four tiers reshapes the blade and guard,
// gems appear from Silver and multiply, spikes, fins and engraved runes come at Runic, and from
// Starsteel each material crowns the weapon with its own motif (see `motif`).

import { R, E, P, T, F, mix } from './pixel.js';
import { WHITE, GOLD, STRING, STONE, PRISM, horns, demonEye, skull, wings, halo, hazard, chain, sawDisc, neon, vertebrae, runes, star, crescent, sunburst, crown, tendril } from './weapon-kit.js';

const FLAP = [0, -1, -2, -1.5, 0, 1];
const flapAt = (f) => FLAP[f % 6];
const SOUL = '#6bff9a';
const HORN = '#4a2a35';
const IVORY_HANDLE = '#f6efe0';

// Common heads use stone instead of wood for axes, spears, and gauntlet stars.
const headLook = (m) => (m.rank === 0 ? { ...m, ...STONE } : m);

// A mirrored polygon: `half` lists the right side from top to bottom.
function mirrored(half, c) {
  return T([...half, ...half.slice().reverse().map(([x, y]) => [-x, y])], c);
}

// A gem with a shine that hops around as the frames run.
function gem(x, y, r, c, f = 0) {
  const shine = [[-0.4, -0.5], [0, -0.6], [0.3, -0.3], [0, 0]][f % 4];
  return [E(x, y, r, r * 1.1, c), F(P(x + shine[0] * r - 0.5, y + shine[1] * r - 0.5, WHITE))];
}

// A tier's gem color; Genesis's gems run through the rainbow, the `i`th one a step along.
const gemOf = (m, f, i = 0) => (m.prism ? m.prism[(f + i * 2) % m.prism.length] : m.gem);

// ---------- Tier ornaments ----------

const BONE = '#efe2c0';
const ABYSS = '#6a3a9a';
const PHOENIX_WING = ['#ffcf3b', '#ff8a3c', '#ffcf3b', '#ff6a2a', '#e0402a', '#fff06b'];
const prismWing = (f) => [0, 1, 2, 3].map((i) => PRISM[(i + f) % PRISM.length]).concat(WHITE, WHITE);

// Abyssal's eye: a slitted, sickly glowing eye.
function abyssEye(x, y, r, c) {
  return [E(x, y, r * 1.6, r, '#12081e'), F(E(x, y, r * 1.35, r * 0.75, c)), F(R(x - 0.4, y - r * 0.7, 0.8, r * 1.4, '#12081e'))];
}

// The material's crowning ornament, from Starsteel up. Spots on the weapon: `emblem` is its
// centerpiece (a guard's gem, a staff's orb) where stars, moons, suns and eyes go, `crown` where a
// crown sits (defaults to the emblem), `top` above the weapon for halos (`orbit`, around it, for
// rings), `guard` [x, y, gap, sides] where wings spread, and `flank` (defaults to the guard) where
// horns, shards and tendrils sprout. `z` is the wing size.
// Returns shapes to draw behind the weapon and in front of it, and sets anchors for live effects.
function motif(m, f, spots, z, a) {
  const back = [];
  const front = [];
  if (!m.motif) return { back, front };
  const [ex, ey] = spots.emblem;
  const [tx, ty] = spots.top;
  const [gx, gy, gap, sides] = spots.guard;
  const [fx, fy, fgap, fsides] = spots.flank ?? spots.guard;
  const flap = flapAt(f);
  a.top = spots.top;
  switch (m.motif) {
    case 'star':
      front.push(star(ex, ey, z * 0.5, GOLD), ...gem(ex, ey, z * 0.11, WHITE, f));
      break;
    case 'moon':
      front.push(crescent(ex - z * 0.08, ey, z * 0.38, '#ffe9a0'), F(P(ex - z * 0.32, ey - z * 0.12, WHITE)), ...gem(ex + z * 0.08, ey, z * 0.12, m.gem, f));
      break;
    case 'sun':
      front.push(...sunburst(ex, ey, z * 0.52, '#ff6a2a', 10), E(ex, ey, z * 0.25, z * 0.25, '#fff3a6'), ...gem(ex, ey, z * 0.12, m.gem, f));
      break;
    case 'horns':
      for (const sd of fsides) back.push(...horns(fx + sd * fgap, fy + z * 0.1, z * 0.5, BONE, [sd]));
      break;
    case 'shards':
      for (const sd of fsides) {
        const x = fx + sd * fgap;
        back.push(T([[x - sd, fy + 1], [x + sd * z * 0.3, fy - z * 0.7], [x + sd * z * 0.25, fy - z * 0.1]], '#c08aff'));
        back.push(T([[x - sd, fy + 1.5], [x + sd * z * 0.6, fy - z * 0.3], [x + sd * z * 0.3, fy + z * 0.15]], '#5a4a78'));
      }
      break;
    case 'crown': {
      const [cx, cy] = spots.crown ?? spots.emblem;
      front.push(...crown(cx, cy, z * 0.6, GOLD, m.gem));
      break;
    }
    case 'feathers':
      back.push(...wings(gx, gy, z * 0.85, flap, sides, gap, PHOENIX_WING));
      a.wings = sides.map((sd) => [gx + sd * (gap + z * 0.6), gy]);
      break;
    case 'eye':
      fsides.forEach((sd, i) => back.push(tendril(fx + sd * fgap, fy + 1, z, sd, f + i * 2, ABYSS), tendril(fx + sd * fgap, fy + 2, z * 0.6, sd, f + i * 2 + 3, '#4e2c70')));
      front.push(...abyssEye(ex, ey, z * 0.13, m.gem));
      a.eye = [ex, ey, z * 0.13];
      break;
    case 'orbit': {
      // A ring around the weapon: its far half behind, its near half in front.
      const [ox, oy] = spots.orbit ?? spots.top;
      const [rx, ry] = [z * 0.8, z * 0.24];
      const band = [];
      for (let i = 0; i <= 10; i++) band.push([ox + Math.cos((i / 10) * Math.PI) * rx, oy + Math.sin((i / 10) * Math.PI) * ry]);
      for (let i = 10; i >= 0; i--) band.push([ox + Math.cos((i / 10) * Math.PI) * (rx - 1.3), oy + Math.sin((i / 10) * Math.PI) * (ry - 1)]);
      back.unshift(...halo(ox, oy, rx, ry, m.trim));
      front.push(T(band, m.trim), F(P(ox + rx * 0.5, oy + ry * 0.6, WHITE)), star(ex, ey, z * 0.4, GOLD), F(P(ex - 0.5, ey - 0.5, WHITE)));
      a.halo = [ox, oy, rx, ry];
      break;
    }
    case 'halo':
      back.push(...wings(gx, gy, z * 0.9, flap, sides, gap));
      front.push(...halo(tx, ty, z * 0.45, z * 0.17));
      a.halo = [tx, ty, z * 0.45, z * 0.17];
      a.wings = sides.map((sd) => [gx + sd * (gap + z * 0.6), gy]);
      break;
    case 'genesis':
      back.push(...wings(gx, gy, z, flap, sides, gap, prismWing(f)));
      front.push(...halo(tx, ty, z * 0.5, z * 0.18, m.trim), star(ex, ey, z * 0.36, WHITE), ...gem(ex, ey, z * 0.12, gemOf(m, f), f));
      a.halo = [tx, ty, z * 0.5, z * 0.18];
      a.wings = sides.map((sd) => [gx + sd * (gap + z * 0.6), gy]);
      break;
  }
  return { back, front };
}

// Material detail inlaid in a blade: crystal facets and star specks across its flat (x0-x1), and
// Genesis's rainbow running down its fuller (fx +- fw/2). Only between y0 and y1.
function inlay(m, f, x0, x1, y0, y1, fw = 1, fx = 0) {
  const out = [];
  if (m.name === 'crystal') for (let y = y0 + 1; y < y1 - 3; y += 5) out.push(F(T([[x0 + 0.4, y + 2], [x1 - 0.4, y], [x1 - 0.4, y + 0.8], [x0 + 0.4, y + 2.8]], WHITE)));
  if (m.name === 'starsteel' || m.name === 'astral') {
    for (let i = 0, y = y0 + 1; y < y1 - 1; y += 2.6, i++) out.push(F(P(i % 2 ? x0 + 0.3 : x1 - 1.3, y, (i + f) % 3 ? m.rune : WHITE)));
  }
  if (m.prism) for (let i = 0, y = y0; y < y1 - 1; y += 2, i++) out.push(F(R(fx - fw / 2, y, fw, 2, m.prism[(i + f) % m.prism.length])));
  return out;
}

// Dragonbone's teeth along an edge at x, pointing out toward `sd`.
function teeth(x, y0, y1, sd, k, c) {
  const out = [];
  for (let y = y0; y < y1 - 1.5; y += 2.6) out.push(T([[x - sd * 0.5, y], [x + sd * 1.6 * k, y + 0.9], [x - sd * 0.5, y + 2]], c));
  return out;
}

// ---------- Swords and daggers ----------

function bladed(m, f, d) {
  const r = m.rank;
  const th = m.theme;
  const k = d.k;
  const g = m.step ?? 0;
  const L = d.L[r] + g * 0.75 * k;
  const bw = d.bw[r];
  const gw = d.gw[r] + g * 0.4;
  const gl = d.gl;
  const base = -2.5 - 1.5 * k;
  const top = base - L;
  const tipL = bw * 0.9;
  const s = [];
  const a = { tip: [0, top], head: [0, base - L * 0.55], blade: [top, base] };
  const reach = [];

  if (th === 'laser') {
    // A chrome hilt; the blade is pure light, drawn live.
    const em = base - 1.5;
    s.push(R(-1.9, -2.5, 3.8, gl + 3, m.handle));
    for (let y = -1.2; y < gl; y += 2) s.push(R(-1.9, y, 3.8, 0.8, m.grip));
    s.push(R(-2.5, em, 5, -2.5 - em, m.trim));
    s.push(R(-3, em - 0.4, 6, 1.2, m.trimDark));
    s.push(F(R(-1.6, em - 0.9, 3.2, 0.6, m.beam)));
    s.push(F(P(1.2, -0.6, m.beam)));
    s.push(R(-1.4, gl + 0.5, 2.8, 1.5, m.trimDark));
    const tip = em - 1 - L;
    a.beams = [{ pts: [[0, em - 1], [0, tip]], w: bw * 0.42 }];
    a.emit = [0, em - 1];
    a.tip = [0, tip];
    a.head = [0, (em + tip) / 2];
    reach.push([0, tip - 2], [3, tip], [-3, tip]);
    return { shapes: s, blade: [tip, em], reach, a };
  }

  // Grip and pommel.
  if (th === 'bone') s.push(...vertebrae(0, -2.5, gl + 1, 3.4, m));
  else {
    s.push(R(-1.5, -2.5, 3, gl + 2.5, m.grip));
    if (r >= 1) for (let y = -1.6; y < gl - 0.5; y += 2) s.push(th === 'cyber' ? neon(-1.5, y, 3, 0.6, m.neon[(Math.floor(y) + f) & 1]) : R(-1.5, y, 3, 0.7, m.trimDark));
    if (r === 0) for (let y = -1.6; y < gl - 0.5; y += 1.5) s.push(R(-1.5, y, 3, 0.5, '#c9a878'));
  }
  if (th === 'demonic') s.push(T([[-1.6, gl], [1.6, gl], [0, gl + 4.5 * k]], m.trim), ...horns(0, gl + 1.2, 2.2 * k, m.trimDark).map((h) => ({ ...h, pts: h.pts.map(([x, y]) => [x, 2 * (gl + 1.2) - y]) })));
  else if (th === 'bone') s.push(E(0, gl + 1.8, 2.2 * k + 0.4, 1.8, m.blade), F(P(-1, gl + 1.6, m.bladeDark)), F(P(0.5, gl + 1.6, m.bladeDark)));
  else if (th === 'chainsaw') s.push(R(-2, gl, 4, 2.5, m.handleDark));
  else if (th === 'cyber') s.push(R(-2, gl, 4, 2.2, m.trim), neon(-1, gl + 0.8, 2, 0.6, m.neon[1]));
  else if (th === 'holy' || m.gems >= 2) s.push(E(0, gl + 1.4, 2.2 * k + 0.3, 2.2 * k + 0.3, m.trim), ...gem(0, gl + 1.4, 1.1, gemOf(m, f, 1), f));
  else if (r >= 2) s.push(E(0, gl + 1.4, 2.2 * k + 0.3, 2.2 * k + 0.3, m.trim), F(P(-0.6, gl + 0.7, m.edge)));
  else s.push(E(0, gl + 1.2, 1.9, 1.9, m.trim));
  if (!th && r >= 4) s.push(T([[-1.3 * k, gl + 2.6], [0, gl + 3.4 + 2.6 * k], [1.3 * k, gl + 2.6]], m.trim));

  if (th === 'chainsaw') {
    // A motor housing with a pull handle and exhaust, and a chain bar where the blade would be.
    const hb = base;
    const ht = base - 6 * k;
    const bar = 2.6 * k;
    s.push(T([[-3.4 * k, ht + 2.2], [-6 * k, ht + 1.2], [-6 * k, hb - 0.6], [-3.4 * k, hb - 1.5], [-3.4 * k, hb - 2.6], [-5 * k, hb - 2], [-5 * k, ht + 2.3], [-3.4 * k, ht + 3.3]], m.handle));
    s.push(R(3.6 * k, ht + 1, 1.7 * k, 2.4 * k, m.handleDark));
    s.push(R(-4 * k, ht, 8 * k, hb - ht + 1.5, m.trim));
    s.push(R(-4 * k, ht, 8 * k, 1.2, m.trimDark));
    s.push(...hazard(-4 * k, hb - 1.2, 8 * k, 1.6));
    s.push(F(P(1.5, ht + 2, m.gem)));
    const bt = top + bar;
    s.push(R(-bar, bt, bar * 2, ht - bt + 0.5, m.blade));
    s.push(E(0, bt, bar, bar, m.blade));
    s.push(R(-0.7, bt + 1, 1.4, ht - bt - 1.5, m.bladeDark));
    for (let y = bt + 3; y < ht - 1; y += 5) s.push(F(P(-0.5, y, m.edge)));
    const shift = f / 6;
    s.push(...chain([bar, ht], [bar, bt], 1, shift, m.edge));
    s.push(...chain([-bar, bt], [-bar, ht], 1, shift, m.edge));
    for (let i = 0; i < 4; i++) {
      const ang = Math.PI + (i + shift) * (Math.PI / 4);
      const [cx, cy] = [Math.cos(ang) * bar, bt + Math.sin(ang) * bar];
      s.push(T([[cx, cy], [Math.cos(ang + 0.25) * (bar + 1.8), bt + Math.sin(ang + 0.25) * (bar + 1.8)], [Math.cos(ang + 0.5) * bar, bt + Math.sin(ang + 0.5) * bar]], m.edge));
    }
    a.exhaust = [4.4 * k, ht + 1];
    a.sparks = [[0, top]];
    a.chain = [[[bar + 1, ht], [bar + 1, bt]], [[-bar - 1, bt], [-bar - 1, ht]]];
    a.tip = [0, top];
    return { shapes: s, blade: [top, ht], reach, a };
  }

  // The blade.
  const std = [[0, top], [bw / 2, top + tipL], [bw / 2, base]];
  const fuller = () => R(-0.5, top + tipL + 1, 1, L - tipL - 3, m.bladeDark);
  const edge = () => T([[0, top + 1], [bw / 2 - 0.2, top + tipL], [bw / 2 - 0.2, base], [bw / 2 - 1, base], [bw / 2 - 1, top + tipL + 0.5]], m.edge);
  const orn = th ? null : motif(m, f, { emblem: [0, base - 1.5 * k], crown: [0, base - 0.4], top: [0, top - 5 * k], orbit: [0, top + L * 0.3], guard: [0, base - 1, bw / 2 - 0.5, [-1, 1]], flank: [0, base + 1, gw / 2 - 1.5, [-1, 1]] }, 10 * k, a);
  if (orn) s.push(...orn.back);
  if (!th && m.spikes) {
    // Fins flaring from the blade's base, a second pair higher up on the grandest blades.
    for (const sd of [-1, 1]) {
      for (let i = 0; i < (r >= 5 ? 2 : 1); i++) {
        const y = base - i * L * 0.3;
        s.push(T([[sd * (bw / 2 - 0.5), y - 0.5], [sd * (bw / 2 + 2.4 * k), y - 4.5 * k], [sd * (bw / 2 + 1.2 * k), y - 0.2], [sd * (bw / 2 - 0.5), y + 0.8]], i ? m.blade : m.trim));
      }
    }
  }
  if (m.name === 'dragonbone') s.push(...teeth(bw / 2 - 0.2, top + tipL + 1, base - 3, 1, k, m.edge));
  if (th === 'holy') s.push(...wings(0, base - 1, 10 * k, flapAt(f), [-1, 1], bw / 2 - 0.5));
  if (th === 'demonic') s.push(...horns(0, base + 1.5, 10 * k, HORN));
  if (th === 'bone') {
    // Ribs curling down around the hand.
    for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) s.push(T([[sd * 1, base + i * 1.8], [sd * gw * 0.5, base + 0.6 + i * 1.8], [sd * gw * 0.55, base + 3 + i * 1.8], [sd * (gw * 0.5 - 1), base + 1.6 + i * 1.8], [sd * 1, base + 1.2 + i * 1.8]], m.handle));
  }

  if (r === 0) {
    s.push(mirrored([[0, top], [bw * 0.35, top + 0.6], [bw / 2, top + 2.2], [bw / 2, base]], m.blade));
    s.push(R(-1, top + 4, 0.6, L - 6, m.bladeDark), R(0.8, top + 8, 0.6, L - 12, m.bladeDark));
  } else if (th === 'demonic') {
    const rs = [];
    for (let y = top + tipL; y < base - 4; y += 4.5) rs.push([bw / 2, y], [bw / 2 + 2.2 * k, y + 3.2], [bw / 2 - 0.2, y + 3.4]);
    s.push(mirrored([[0, top], ...rs, [bw / 2, base]], m.blade));
    s.push(T([[0, top + 1.5], [-bw / 2 + 0.7, top + tipL], [-bw / 2 + 0.7, base], [-0.7, base], [-0.7, top + tipL]], '#5a3550'));
    for (let y = top + tipL - 1; y < base - 0.5; y += 1.2) {
      const lit = Math.floor((y - top) / 3 - f) % 3 === 0;
      s.push(F(R(Math.floor(y) % 4 < 2 ? -0.6 : 0, y, 1, 1.3, lit ? m.ember : m.hot)));
    }
    a.flames = [0.2, 0.45, 0.7].flatMap((u) => [[bw / 2 + 0.5, top + L * u], [-bw / 2 - 0.5, top + L * u + 2]]);
  } else if (th === 'bone') {
    // A blade carved from a giant's jaw: teeth along the edge, a marrow channel, a knuckled base.
    for (let y = top + tipL + 1; y < base - 4; y += 2.6) s.push(T([[bw / 2 - 0.5, y], [bw / 2 + 1.6 * k, y + 0.9], [bw / 2 - 0.5, y + 2]], m.edge));
    s.push(T([[0.6, top], [bw / 2, top + tipL], [bw / 2, base - 2], [-bw / 2, base - 2], [-bw / 2 + 0.3, top + tipL + 2]], m.blade));
    s.push(T([[-0.3, top + tipL + 1], [0.5, top + tipL + 1], [0.3, base - 4], [-0.9, base - 4]], m.bladeDark));
    s.push(F(P(-bw / 2 + 1, top + L * 0.4, m.trimDark)), F(P(-bw / 2 + 1.5, top + L * 0.4 + 1, m.trimDark)), F(P(bw / 2 - 1.5, top + L * 0.62, m.trimDark)));
    s.push(E(-bw / 2 + 0.6, base - 2, 1.9 * k, 1.7 * k, m.blade), E(bw / 2 - 0.6, base - 2, 1.9 * k, 1.7 * k, m.blade));
  } else if (th === 'cyber') {
    s.push(T([[bw / 2, base], [bw / 2, top + 5], [bw / 2 - 1.6, top], [-bw / 2, top + 4.5], [-bw / 2, base]], m.blade));
    s.push(neon(bw / 2 - 1, top + 4.5, 1, base - top - 4.5, m.neon[0]));
    s.push(T([[bw / 2 - 1, top + 4.6], [bw / 2 - 2.2, top + 0.6], [bw / 2 - 1.6, top + 0.3], [bw / 2 - 0.4, top + 4.4]], m.neon[0]));
    for (let y = top + 6, i = 0; y < base - 2; y += 3, i++) if ((i + f) % 3) s.push(neon(-bw / 2 + 0.8, y, 1, 1.6, m.neon[1]));
    a.neon = [[[bw / 2 - 0.5, base], [bw / 2 - 0.5, top + 5], [bw / 2 - 1.7, top + 0.4]]];
  } else if (th === 'holy') {
    s.push(mirrored(std, m.blade), fuller(), edge());
    s.push(F(R(-0.5, top + tipL + 1, 1, L - tipL - 3, GOLD)), ...gem(0, base - 2.4, 1.2, m.gem, f));
  } else {
    // Straight blades, then a leaf flare (rank 3), notched barbs (4), and both (5).
    const notch = [[bw / 2, base - L * 0.36], [bw / 2 - 1.4, base - L * 0.3], [bw / 2 + (r - 4) * 0.6, base - L * 0.24], [bw / 2, base]];
    if (r <= 2) s.push(mirrored(std, m.blade));
    else if (r === 3) s.push(mirrored([[0, top], [bw / 2 + 0.8, top + tipL + 3], [bw / 2, base - L * 0.3], [bw / 2 - 0.4, base]], m.blade));
    else s.push(mirrored([[0, top], [bw / 2 + (r - 4), top + tipL + 2 * (r - 4)], ...notch], m.blade));
    const fw = r >= 4 ? 3 : 1;
    const end = base - (m.gems >= 3 ? 5 : 2);
    if (m.tier >= 3) s.push(R(-fw / 2, top + tipL + 1, fw, L - tipL - 3, m.bladeDark));
    if (m.tier >= 4) s.push(edge());
    s.push(...inlay(m, f, -bw / 2 + 0.6, bw / 2 - 0.6, top + tipL + 1, base - 2, fw));
    if (m.rune) {
      s.push(...runes(0, top + tipL + 2, end, f, m.rune, m.runeDim, 4));
      a.runes = [0, top + tipL + 2, end];
    }
    if (m.tier >= 5) s.push(F(P(bw / 2 - 1.2, top + tipL + 2 + ((f * L) / 4) % (L - tipL - 3), WHITE)));
    if (m.gems >= 3) s.push(...gem(0, base - 2.6, 1.1, gemOf(m, f, 2), f));
  }

  // The guard.
  if (th === 'holy') {
    s.push(T([[-gw / 2, base - 1.6], [-gw / 2 + 2, base], [gw / 2 - 2, base], [gw / 2, base - 1.6], [gw / 2 - 1, base + 2.4], [-gw / 2 + 1, base + 2.4]], m.trim));
    s.push(...gem(0, base + 1.1, 1.3, m.gem, f));
    s.push(...halo(0, top - 4.5 * k, 4.5 * k, 1.7 * k));
    a.halo = [0, top - 4.5 * k, 4.5 * k, 1.7 * k];
    a.wings = [[-7 * k, base - 1], [7 * k, base - 1]];
  } else if (th === 'demonic') {
    s.push(T([[-gw / 2, base + 2.6], [-gw / 2 + 1, base - 0.5], [gw / 2 - 1, base - 0.5], [gw / 2, base + 2.6], [0, base + 3.4]], m.trim));
    s.push(...demonEye(0, base + 1.1, 1.2 * k + 0.2));
    a.eye = [0, base + 1.1, 1.2 * k + 0.2];
  } else if (th === 'bone') {
    const sk = skull(0, base + 0.5, 3.4 * k + 0.3, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'cyber') {
    s.push(R(-gw / 2, base, gw, 2.4, m.trim), neon(-gw / 2 + 0.6, base + 0.9, 1, 0.8, m.neon[f % 2]), neon(gw / 2 - 1.6, base + 0.9, 1, 0.8, m.neon[(f + 1) % 2]));
    a.ring = [0, base + 1.2, gw / 2 + 2, 1.4];
  } else if (r === 0) {
    s.push(R(-gw / 2, base, gw, 2.2, m.trim));
  } else if (r === 1) {
    s.push(R(-gw / 2, base, gw, 2.2, m.trim), F(P(-gw / 2 + 0.6, base + 0.6, m.trimDark)), F(P(gw / 2 - 1.6, base + 0.6, m.trimDark)));
  } else {
    // Swept quillons (rank 2), quillons curling up (3), bat wings down (4), and both (5).
    if (r === 2) s.push(T([[-gw / 2, base - 1.4], [-gw / 2 + 1.5, base], [gw / 2 - 1.5, base], [gw / 2, base - 1.4], [gw / 2, base + 2.2], [-gw / 2, base + 2.2]], m.trim), E(-gw / 2, base - 0.6, 1, 1, m.trim), E(gw / 2, base - 0.6, 1, 1, m.trim));
    if (r >= 4) s.push(T([[-gw / 2, base + 3.5], [-gw / 2 + 1, base], [gw / 2 - 1, base], [gw / 2, base + 3.5], [gw / 2 - 1.5, base + 2.2], [-gw / 2 + 1.5, base + 2.2]], r === 5 ? m.trimDark : m.trim));
    if (r === 3 || r === 5) for (const sd of [-1, 1]) s.push(T([[sd * 1.5, base], [sd * gw / 2, base - 3], [sd * (gw / 2 - 0.6), base + 0.8], [sd * 1.5, base + 2.6]], m.trim));
    s.push(R(-2.2, base, 4.4, 2.6, m.trim), ...gem(0, base + 1.2, 1.25, gemOf(m, f), f));
    a.gem = [0, base + 1.2];
  }
  if (orn) s.push(...orn.front);
  return { shapes: s, blade: [top, base], reach, a };
}

const SWORD = { k: 1, L: [22, 25, 28, 30, 33, 36], bw: [5, 5, 6, 6, 7, 7.5], gw: [10, 11, 13, 15, 15, 16], gl: 6 };
const DAGGER = { k: 0.7, L: [11, 12, 13, 14, 15, 17], bw: [3.6, 3.6, 4, 4.4, 4.6, 5], gw: [7, 7, 8, 9, 9, 10], gl: 4 };

// ---------- Gauntlets ----------
//
// A throwing gauntlet worn on the hand: a bracer over the wrist and forearm (toward +y, behind the
// grip), plates over the knuckles, and a shuriken held ready at the fingertips (toward -y). Ranks
// grow from a leather wrap with a plain stone star to plated steel, then flared, gem-set bracers
// with spare stars slotted in a holster on the side, and a bigger, runic, glowing star.

// A four-point throwing star at (x, y), radius `r`, turned by `ang`: blades with one curved
// trailing edge (a pinwheel), the lit half of each blade in `lit`, and a hub with a hole.
function shuriken(x, y, r, ang, c, lit, hub, hole = true) {
  const at = (a, d) => [x + Math.cos(a) * d, y + Math.sin(a) * d];
  const outline = [];
  const facets = [];
  for (let k = 0; k < 4; k++) {
    const a = ang - Math.PI / 2 + (k * Math.PI) / 2;
    outline.push(at(a, r), at(a + 0.38, r * 0.52), at(a + Math.PI / 4, r * 0.3));
    facets.push(T([[x, y], at(a, r - 0.4), at(a - Math.PI / 4, r * 0.3)], lit));
  }
  const out = [T(outline, c), ...facets];
  if (hub) out.push(E(x, y, Math.max(1.2, r * 0.3), Math.max(1.2, r * 0.3), hub));
  if (hole) out.push(E(x, y, Math.max(0.6, r * 0.12), Math.max(0.6, r * 0.12), 'none'));
  return out;
}

// The tips of a star as `shuriken` draws it, for live effects.
function starTips(x, y, r, ang) {
  return [0, 1, 2, 3].map((k) => {
    const a = ang - Math.PI / 2 + (k * Math.PI) / 2;
    return [x + Math.cos(a) * r, y + Math.sin(a) * r];
  });
}

const IVORY_GLOVE = '#f3ead8';

function gauntlet(m0, f) {
  const m = headLook(m0);
  const r = m.rank;
  const th = m.theme;
  const s = [];
  const reach = [];
  // The held star spins a quarter turn over the weapon's animation.
  const frames = th || m.tier >= 9 ? 6 : m.tier >= 5 ? 4 : 1;
  const spin = ((f % frames) / frames) * (Math.PI / 2);
  const SR = [4.4, 4.8, 5.2, 5.6, 6, 6.5][r] + (m.step ?? 0) * 0.12;
  const sy = -7.2 - SR;
  const top = sy - SR;
  const a = { tip: [0, top], head: [0, sy], blade: [top, -4] };
  // The bracer, from the wrist back along the forearm, flaring a little toward the elbow.
  const by = 2.2;
  const be = by + [3.2, 3.6, 4, 4.4, 4.8, 5.2][r];
  const bw0 = r === 0 ? 3.4 : 3.6;
  const bw1 = r === 0 ? 3.8 : 4.1 + (r >= 4 ? 0.3 : 0);

  let plate, band, knuck, ridge;
  if (th === 'holy') [plate, band, knuck, ridge] = [m.blade, m.trim, m.trim, m.trimDark];
  else if (th === 'demonic') [plate, band, knuck, ridge] = [m.handle, m.trim, m.trim, m.trimDark];
  else if (th === 'bone') [plate, band, knuck, ridge] = [m.handleDark, m.handle, m.blade, m.bladeDark];
  else if (th === 'laser') [plate, band, knuck, ridge] = [m.trim, m.trimDark, m.trim, m.trimDark];
  else if (th === 'chainsaw') [plate, band, knuck, ridge] = [m.handle, m.trim, m.trim, m.trimDark];
  else if (th === 'cyber') [plate, band, knuck, ridge] = [m.handle, m.trim, m.trim, m.trimDark];
  else if (r === 0) [plate, band, knuck, ridge] = [m0.handle, m0.grip, m0.handleDark, m0.trimDark];
  else if (r === 1) [plate, band, knuck, ridge] = [m.handleDark, m.trim, m.trim, m.trimDark];
  else [plate, band, knuck, ridge] = [m.trim, m.trimDark, m.trim, m.trimDark];

  const orn = th ? null : motif(m, f, { emblem: [0, (by + be) / 2], crown: [0, -6], top: [0, top - 4], orbit: [0, sy], guard: [0, by + 1.5, bw0, [-1, 1]], flank: [0, by + 3, bw0, [-1, 1]] }, 8, a);
  if (orn) s.push(...orn.back);

  // Spare stars slotted in a holster on the bracer's side (rank 3 up), behind the plate.
  if (!th && r >= 3) {
    const n = r >= 4 ? 2 : 1;
    for (let i = 0; i < n; i++) s.push(...shuriken(-bw1 - 1, by + 1.4 + i * 3.4, 2.4, 0.35, m.blade, m.edge, null, false));
  }
  // Fins along the bracer from Runic.
  if (!th && m.spikes) for (const sd of r >= 4 ? [-1, 1] : [1]) s.push(T([[sd * bw0, by + 1], [sd * (bw1 + 2.2 + r * 0.2), by + 3.5], [sd * bw1, by + 5.5]], m.trim));

  // Theme parts behind the gauntlet.
  if (th === 'holy') {
    s.push(...wings(0, by + 2.5, 6.5, flapAt(f), [-1], bw0 - 0.5));
    a.wings = [[-bw0 - 4.5, by + 2.5]];
  }
  if (th === 'demonic') for (const sd of [-1, 1]) for (const y of [by + 2, by + 5.5]) s.push(T([[sd * bw0, y], [sd * (bw1 + 2.6), y + 0.6], [sd * bw1, y + 2.4]], m.trimDark));
  if (th === 'chainsaw') s.push(R(-bw1 - 2, by + 2, 2.4, 4, m.handleDark), R(-bw1 - 3, by + 2.4, 1.4, 1.2, m.trimDark));

  // The held star.
  let st = [m.blade, m.edge, r === 0 ? m.bladeDark : m.rune ?? m.bladeDark];
  if (th === 'holy') st = [WHITE, GOLD, m.trim];
  else if (th === 'demonic') st = [m.blade, m.trimDark, m.trim];
  else if (th === 'bone') st = [m.blade, m.edge, m.trimDark];
  if (th === 'chainsaw') {
    s.push(...sawDisc(0, sy, SR - 1, f, 6, m));
    a.sparks = [[0, top - 1], [SR + 1, sy]];
    a.tip = [0, top - 1.5];
  } else if (th === 'laser') {
    // A projector pad; the star is hard light, drawn live.
    s.push(R(-2.2, -7.6, 4.4, 1.6, m.trimDark), F(R(-1.4, -7.9, 2.8, 0.6, m.beam)));
    const pts = [];
    for (let k = 0; k < 4; k++) {
      const ang = spin - Math.PI / 2 + (k * Math.PI) / 2;
      pts.push([Math.cos(ang) * SR, sy + Math.sin(ang) * SR], [Math.cos(ang + Math.PI / 4) * SR * 0.32, sy + Math.sin(ang + Math.PI / 4) * SR * 0.32]);
    }
    a.beams = [{ pts, w: 0.45, fill: true }, { pts: [[0, -7.8], [0, sy + SR * 0.32]], w: 0.35 }];
    a.emit = [0, -8];
    for (const p of starTips(0, sy, SR + 1.5, spin)) reach.push(p);
  } else {
    if (th === 'cyber') {
      // A hologram: a flat neon star with a dark core, its colors trading places as it turns.
      s.push(...shuriken(0, sy, SR, spin, m.neon[f % 2], m.neon[f % 2], null, false).map(F));
      s.push(...shuriken(0, sy, SR - 1.6, spin, m.blade, m.bladeDark, m.neon[(f + 1) % 2]).map(F));
      const tips = starTips(0, sy, SR, spin);
      a.neon = [[...tips, tips[0]]];
      a.ring = [0, sy, SR + 2, 1.6];
    } else s.push(...shuriken(0, sy, SR, spin, st[0], st[1], st[2]));
    if (th === 'demonic') {
      for (const [x, y] of starTips(0, sy, SR - 1.5, spin)) s.push(F(E(x * 0.9, sy + (y - sy) * 0.9, 0.7, 0.7, m.hot)));
      s.push(F(E(0, sy, 1, 1, m.ember)));
      a.flames = starTips(0, sy, SR - 1, spin);
    }
    if (th === 'holy') s.push(...gem(0, sy, 1.2, m.gem, f));
    if (!th && m.rune) {
      // Runes cut into the blades, lit in turn.
      starTips(0, sy, SR * 0.62, spin).forEach(([x, y], i) => s.push(F(P(x - 0.5, y - 0.5, (i + f) % 3 ? m.runeDim : m.rune))));
    }
    if (!th && m.gems >= 3) s.push(...gem(0, sy, 1, gemOf(m, f, 2), f));
  }

  // The bracer.
  s.push(T([[-bw0, by], [bw0, by], [bw1, be], [-bw1, be]], plate));
  if (th === 'bone') {
    // Stacked bone plates.
    for (let y = by + 0.3; y < be - 1; y += 2.4) s.push(E(0, y + 1.1, bw0 + 0.3, 1.2, m.blade), F(P(-bw0 + 1, y + 1, m.bladeDark)));
  } else if (th === 'laser') {
    s.push(R(-bw1, be - 1.6, bw1 * 2, 1.6, band), F(R(-bw0 + 1.2, by + 1.5, 0.8, be - by - 3.5, m.beam)), F(R(bw0 - 2, by + 1.5, 0.8, be - by - 3.5, m.beam)));
  } else if (th === 'chainsaw') {
    s.push(R(-bw1, be - 1.8, bw1 * 2, 1.8, band), ...hazard(-bw0, by + 1, bw0 * 2, 1.6));
    a.exhaust = [-bw1 - 3, by + 2.4];
  } else if (th === 'cyber') {
    s.push(R(-bw1, be - 1.6, bw1 * 2, 1.6, band));
    for (let i = 0; i < 3; i++) s.push(neon(-bw0 + 0.6, by + 1.2 + i * 2.2, bw0 * 2 - 1.2, 0.7, m.neon[(i + f) % 2]));
  } else if (r === 0) {
    // A leather wrap: crossing bands of cloth.
    for (let y = by + 0.8; y < be - 1; y += 2.2) s.push(T([[-bw0, y + 1.2], [bw0, y], [bw0, y + 0.8], [-bw0, y + 2]], band));
  } else {
    s.push(R(-bw1, be - 1.6, bw1 * 2, 1.6, band));
    if (r >= 2 || th) s.push(R(-bw0, by, bw0 * 2, 1.4, band));
    if (r >= 2 && !th) s.push(F(R(-bw0 + 1, by + 2, 0.8, be - by - 4.2, m.edge)));
    if (r >= 4 && !th) s.push(T([[-bw1, be - 1.6], [bw1, be - 1.6], [bw1 + 1.2, be + 0.6], [-bw1 - 1.2, be + 0.6]], m.trim));
    if (r >= 3 && !th) s.push(F(P(-bw0 + 0.5, by + 0.2, GOLD)), F(P(bw0 - 1.5, by + 0.2, GOLD)), F(P(-bw1 + 0.6, be - 1.2, GOLD)), F(P(bw1 - 1.6, be - 1.2, GOLD)));
  }
  const gy = (by + be) / 2 + 0.3;
  if (th === 'demonic') {
    s.push(...demonEye(0, gy, 1.5));
    a.eye = [0, gy, 1.5];
  } else if (th === 'holy') {
    s.push(R(-bw0, by, bw0 * 2, 1.4, band), R(-bw1, be - 1.6, bw1 * 2, 1.6, band), ...gem(0, gy, 1.4, m.gem, f));
    s.push(...halo(0, top - 3, 3.6, 1.3));
    a.halo = [0, top - 3, 3.6, 1.3];
    a.gem = [0, gy];
  } else if (!th) {
    if (m.gems >= 1) s.push(E(0, gy, 2.1, 2.1, m.trimDark), ...gem(0, gy, 1.4, gemOf(m, f), f));
    if (m.gems >= 2) s.push(...gem(-bw0 + 1.3, be - 2.8, 0.8, gemOf(m, f, 1), f), ...gem(bw0 - 1.3, be - 2.8, 0.8, gemOf(m, f, 1), f));
    if (m.rune) {
      for (const x of [-bw0 + 1.6, bw0 - 1.6]) s.push(...runes(x, by + 1.8, be - 1.6, f, m.rune, m.runeDim, 4));
      a.runes = [0, by + 1, be];
    }
    a.gem = [0, m.gems >= 1 ? gy : sy];
  }

  // The glove and the plates over the knuckles.
  const glove = th === 'holy' ? IVORY_GLOVE : th === 'laser' ? m.handleDark : th ? m.handleDark : r === 0 ? m0.handleDark : m.handleDark;
  s.push(R(-2.8, -3, 5.6, 5.6, glove), E(3.2, -2.4, 1.3, 1.6, glove));
  s.push(T([[-4.4, -6.2], [4.4, -6.2], [4.6, -3.4], [3.8, -2.4], [-3.8, -2.4], [-4.6, -3.4]], knuck));
  if (th === 'bone') {
    const sk = skull(0, -4.6, 2.5, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else {
    for (const x of [-3.3, -1.1, 1.1, 3.3]) s.push(E(x, -6.2, 1.15, 0.9, knuck), F(P(x - 0.5, -6.8, r === 0 && !th ? m0.trim : th === 'cyber' ? m.neon[0] : th === 'laser' ? m.beam : m.edge)));
    s.push(F(R(-4.2, -3.4, 8.4, 0.6, ridge)));
    if (th === 'demonic') for (const x of [-3.3, 0, 3.3]) s.push(T([[x - 0.9, -6.6], [x, -8.8], [x + 0.9, -6.6]], m.trimDark));
  }
  if (orn) s.push(...orn.front);
  return { shapes: s, blade: a.blade, reach, a };
}

// ---------- Axes ----------

function axe(m0, f) {
  const m = headLook(m0);
  const r = m.rank;
  const th = m.theme;
  const g = m.step ?? 0;
  const H = [26, 28, 30, 32, 34, 37][r] + g * 0.6;
  const hh = [12, 14, 15, 16, 18, 20][r] + g * 0.4;
  const bx = [10, 11, 12, 13, 14, 16][r] + g * 0.3;
  const top = -H;
  const mid = top + hh / 2;
  const s = [];
  const a = { tip: [bx, mid], head: [bx * 0.6, mid], blade: [top - 2, top + hh + 2] };
  const reach = [];
  // The haft.
  if (th === 'bone') s.push(...vertebrae(0, top, 7, 3, m));
  else {
    s.push(R(-1.25, top, 2.5, H + 7, m0.handle));
    if (th === 'cyber') for (let y = -2, i = 0; y < 6; y += 2.5, i++) s.push(neon(-1.25, y, 2.5, 0.8, m.neon[(i + f) % 2]));
    else if (th !== 'laser') s.push(R(-1.25, -2, 2.5, 6, m0.grip));
    if (!th && r >= 4) s.push(T([[-1.2, 7.5], [0, 11], [1.2, 7.5]], m.trim));
    s.push(E(0, 7, 1.8, 1.4, m.trim));
    if (m.gems >= 2) s.push(...gem(0, 7, 0.9, gemOf(m, f, 1), f));
  }
  if (th === 'laser') {
    s.push(R(-2.4, top - 1, 4.8, hh + 2, m.trim), R(-2.4, top + hh * 0.35, 4.8, 1, m.trimDark), F(R(2.4, top + 1, 0.8, hh - 2, m.beam)));
    const arc = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      arc.push([3 + Math.sin(t * Math.PI) * (bx - 3) + 1, top - 2 + t * (hh + 4)]);
    }
    a.beams = [{ pts: [[3, top + 1], ...arc, [3, top + hh - 1]], w: 1.2, fill: true }];
    a.emit = [3, mid];
    reach.push([bx + 2, mid], [bx, top - 3], [bx, top + hh + 3]);
    return { shapes: s, blade: a.blade, reach, a };
  }
  if (th === 'chainsaw') {
    s.push(...sawDisc(6, mid, hh * 0.55, f, 6, m));
    s.push(R(-3, top - 1, 6, hh + 2, m.trim), ...hazard(-3, top + hh - 2, 6, 1.6), R(-5, top + 1, 2, 3, m.handleDark));
    a.exhaust = [-5, top + 1];
    a.sparks = [[6 + hh * 0.6, mid - 3], [6, top - 2]];
    a.tip = [6 + hh * 0.6, mid];
    a.head = [6, mid];
    return { shapes: s, blade: a.blade, reach, a };
  }
  const bit = (b, c) => T([[1, top + 2], [b * 0.6, top - 1], [b, top + 3], [b, top + hh - 3], [b * 0.6, top + hh + 1], [1, top + hh - 2]], c);
  const rear = r >= 3 ? bx * 0.6 : 4;
  const orn = th ? null : motif(m, f, { emblem: [0, mid], crown: [0, top + 0.5], top: [0, top - 7], orbit: [0, top + hh + 4], guard: [-rear, mid, 0, [-1]], flank: [0, top + 1, rear * 0.5, [-1, 1]] }, 10, a);
  if (orn) s.push(...orn.back);
  if (th === 'holy') s.push(...wings(-1, mid, 9, flapAt(f), [-1]));
  if (th === 'demonic') s.push(...horns(-1, top + 3, 5, m.trimDark, [-1]));
  // The bit.
  if (th === 'demonic') {
    const pts = [[1, top + 2], [bx * 0.55, top - 3], [bx * 0.75, top - 1], [bx + 1, top - 3], [bx, top + 3]];
    for (let y = top + 4; y < top + hh - 3; y += 3.5) pts.push([bx + 1.6, y + 1.7], [bx, y + 3]);
    pts.push([bx + 1, top + hh + 2], [bx * 0.75, top + hh + 0.5], [bx * 0.55, top + hh + 3], [1, top + hh - 2]);
    s.push(T(pts, m.blade));
    for (let i = 0; i < 6; i++) {
      const lit = (i - f + 60) % 3 === 0;
      s.push(F(R(3 + i * (bx - 5) / 6, mid - 2 + (i % 2) * 2.4, 1.4, 1, lit ? m.ember : m.hot)));
    }
    s.push(F(T([[bx - 1.4, top + 2], [bx - 0.4, top + 2], [bx - 0.4, top + hh - 2], [bx - 1.4, top + hh - 2]], m.hot)));
    a.flames = [[bx, top + 1], [bx + 1, mid], [bx, top + hh - 1], [bx * 0.6, top - 2]];
  } else if (th === 'bone') {
    s.push(bit(bx, m.blade), T([[3, top + 3], [bx - 3, top + 2], [bx - 3, top + hh - 2], [3, top + hh - 3]], m.bladeDark));
    for (let y = top + 3; y < top + hh - 2; y += 2.4) s.push(T([[bx - 0.2, y], [bx + 1.6, y + 0.8], [bx - 0.2, y + 1.7]], m.edge));
    const sk = skull(0, top - 2.5, 3, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'cyber') {
    s.push(T([[1, top + 1], [bx - 3, top - 1], [bx, top + 3], [bx, top + hh - 3], [bx - 3, top + hh + 1], [1, top + hh - 1]], m.blade));
    s.push(T([[bx - 1, top + 2.6], [bx - 3, top + 0.2], [bx - 2.5, top - 0.6], [bx, top + 3], [bx, top + hh - 3], [bx - 2.5, top + hh + 0.6], [bx - 3, top + hh - 0.2], [bx - 1, top + hh - 2.6]], m.neon[0]));
    s.push(neon(3, mid - 0.5, bx - 6, 1, m.neon[f % 2]), neon(3, top + 2, 1, hh - 4, m.neon[1]));
    a.neon = [[[bx - 3, top - 0.5], [bx - 0.5, top + 3], [bx - 0.5, top + hh - 3], [bx - 3, top + hh + 0.5]]];
    a.ring = [0, mid, 6, 2];
  } else {
    // Progression: a back spike, then a top spike (rank 2), a second bit (3), barbed horns on the
    // bit (4), and a spike under the socket (Runic up).
    if (r >= 3) s.push(bit(-bx * (!th && r >= 5 ? 0.7 : 0.55), m.blade));
    else if (r >= 1) s.push(T([[-1, top + hh / 2 - 2.5], [-5, top + hh / 2], [-1, top + hh / 2 + 2.5]], m.blade));
    if (r >= 2) s.push(T([[-1, top], [0, top - 4.5 - (th ? 0 : r - 2)], [1, top]], m.blade));
    if (!th && m.spikes) s.push(T([[-1, top + hh - 1], [0, top + hh + 4], [1, top + hh - 1]], m.trim));
    if (!th && r >= 4) for (const sd of [-1, 1]) s.push(T([[bx * 0.55, mid + sd * (hh / 2 - 0.5)], [bx + 1.5, mid + sd * (hh / 2 + 2.5)], [bx - 1, mid + sd * (hh / 2 - 2.5)]], m.blade));
    if (m.name === 'dragonbone') s.push(...teeth(bx - 0.2, top + 3, top + hh - 2, 1, 1, m.edge));
    s.push(bit(bx, m.blade));
    if (th || m.tier >= 3) s.push(T([[3, top + 3], [bx - 2.5, top + 1.5], [bx - 2.5, top + hh - 1.5], [3, top + hh - 3]], m.bladeDark));
    if (th || m.tier >= 4) s.push(T([[bx - 1.2, top + 2], [bx - 0.3, top + 3], [bx - 0.3, top + hh - 3], [bx - 1.2, top + hh - 2]], m.edge));
    if (!th) s.push(...inlay(m, f, 3, bx - 2.5, top + 2.5, top + hh - 2, 2, bx - 3.5));
    if (th === 'holy') {
      // A gold cutting edge and a sunburst engraved in the bit.
      s.push(F(T([[bx - 1.6, top + 1.5], [bx - 0.3, top + 3], [bx - 0.3, top + hh - 3], [bx - 1.6, top + hh - 1.5]], GOLD)));
      for (let i = 0; i < 5; i++) {
        const ang = -Math.PI / 2 + (i - 2) * 0.55;
        s.push(F(T([[4.5, mid], [4.5 + Math.cos(ang) * 6, mid + Math.sin(ang) * 6 - 0.6], [4.5 + Math.cos(ang) * 6, mid + Math.sin(ang) * 6 + 0.6]], GOLD)));
      }
      s.push(F(E(4.5, mid, 1.6, 1.6, GOLD)), ...halo(0, top - 5, 4, 1.5));
    }
    if (m.rune) {
      s.push(...runes(bx * 0.5, top + 3, top + hh - 2, f, m.rune, m.runeDim, 4));
      a.runes = [bx * 0.5, top + 3, top + hh - 2];
    }
    if (m.gems >= 3) s.push(...gem(-bx * 0.32, mid, 1, gemOf(m, f, 2), f));
    if (!th && m.tier >= 5) s.push(F(P(bx - 1.5, top + 3 + (f * 3) % (hh - 5), WHITE)));
  }
  // The socket band.
  s.push(R(-2, top + 1, 4, hh - 2, m.trim));
  if (r >= 1 && !th) s.push(F(P(-0.5, top + 2.5, m.trimDark)), F(P(-0.5, top + hh - 3, m.trimDark)));
  if (th === 'demonic') {
    s.push(...demonEye(0, mid, 1.4));
    a.eye = [0, mid, 1.4];
  } else if (th === 'holy' || m.gems >= 1) {
    s.push(...gem(0, mid, 1.3, gemOf(m, f), f));
    a.gem = [0, mid];
  }
  if (orn) s.push(...orn.front);
  if (th === 'holy') {
    a.halo = [0, top - 5, 4, 1.5];
    a.wings = [[-8, mid - 2]];
  }
  return { shapes: s, blade: a.blade, reach, a };
}

// ---------- Spears ----------

function spear(m0, f) {
  const m = headLook(m0);
  const r = m.rank;
  const th = m.theme;
  const g = m.step ?? 0;
  const S = [34, 36, 38, 40, 42, 45][r] + g * 0.6;
  const hl = [9, 10, 11, 13, 14, 16][r] + g * 0.4;
  const hw = [4, 4, 5, 5, 6, 6][r];
  const top = -S - hl;
  const sock = -S;
  const s = [];
  const a = { tip: [0, top], head: [0, sock - hl * 0.5], blade: [top, sock] };
  const reach = [];
  // The shaft.
  if (th === 'bone') s.push(...vertebrae(0, sock, 14, 3, m));
  else {
    s.push(R(-1.25, sock, 2.5, S + 14, r === 0 ? '#c8c27a' : m0.handle));
    if (r === 0) for (let y = sock + 6; y < 12; y += 8) s.push(R(-1.4, y, 2.8, 0.8, '#9c9650'));
    if (th === 'cyber') for (let y = sock + 4, i = 0; y < 10; y += 6, i++) s.push(neon(-1.25, y, 2.5, 0.8, m.neon[(i + f) % 2]));
    else if (th !== 'laser' && r >= 1) s.push(R(-1.25, -3, 2.5, 7, m0.grip));
    if (!th && r >= 4) s.push(T([[-1.4, 14], [0, 17.5], [1.4, 14]], m.trim));
    s.push(R(-1.6, 12, 3.2, 2.5, m.trim));
    if (m.gems >= 2) s.push(R(-1.6, -4, 3.2, 1.4, m.trim), ...gem(0, -3.3, 0.9, gemOf(m, f, 1), f));
  }
  if (th === 'laser') {
    s.push(R(-2, sock - 1, 4, 5, m.trim), R(-2.6, sock - 1.8, 5.2, 1.2, m.trimDark), F(R(-1.2, sock + 1, 2.4, 0.7, m.beam)));
    a.beams = [{ pts: [[0, sock - 2], [hw * 0.6, sock - hl * 0.35], [0, top], [-hw * 0.6, sock - hl * 0.35]], w: 0.9, fill: true }];
    a.emit = [0, sock - 2];
    reach.push([0, top - 2]);
    return { shapes: s, blade: a.blade, reach, a };
  }
  if (th === 'chainsaw') {
    const bt = top + 2;
    s.push(R(-2.2, bt, 4.4, sock - 4 - bt, m.blade), E(0, bt, 2.2, 2.2, m.blade), R(-0.6, bt + 1, 1.2, sock - 6 - bt, m.bladeDark));
    s.push(...chain([2.2, sock - 4], [2.2, bt], 1, f / 6, m.edge), ...chain([-2.2, bt], [-2.2, sock - 4], 1, f / 6, m.edge));
    s.push(R(-3.5, sock - 5, 7, 7, m.trim), ...hazard(-3.5, sock, 7, 1.5), R(3.5, sock - 4, 1.6, 2.4, m.handleDark));
    a.exhaust = [4.4, sock - 4];
    a.sparks = [[0, top]];
    a.chain = [[[3.2, sock - 4], [3.2, bt]], [[-3.2, bt], [-3.2, sock - 4]]];
    return { shapes: s, blade: [top, sock], reach, a };
  }
  if (th === 'holy') s.push(...wings(0, sock + 1, 9, flapAt(f), [-1, 1], 1.5));
  const orn = th ? null : motif(m, f, { emblem: [0, sock + 0.8], crown: [0, sock - 0.5], top: [0, top - 5], orbit: [0, sock - hl * 0.4], guard: [0, sock + 1, 1.5, [-1, 1]] }, 9, a);
  if (orn) s.push(...orn.back);
  if (th === 'demonic') {
    // A barbed trident.
    for (const sd of [-1, 1]) s.push(T([[sd * 1, sock - 1], [sd * 4.5, sock - 2], [sd * 5, sock - hl * 0.75], [sd * 5.6, sock - hl * 0.8], [sd * 4.6, sock - hl + 1], [sd * 3.6, sock - hl * 0.6], [sd * 3.4, sock - 3.5], [sd * 1, sock - 3]], m.blade));
    s.push(mirrored([[0, top], [1.8, top + 3], [2.6, top + 4.5], [1.4, top + 4], [1.4, sock]], m.blade));
    s.push(...horns(0, sock + 2, 4, m.trimDark));
    for (let y = top + 4, i = 0; y < sock - 1; y += 1.3, i++) s.push(F(R(-0.5, y, 1, 1.4, (i - f * 2 + 60) % 6 < 2 ? m.ember : m.hot)));
    a.flames = [[0, top + 1], [-5, sock - hl * 0.8], [5, sock - hl * 0.8]];
  } else if (th === 'bone') {
    s.push(T([[0, top], [hw / 2 + 0.6, top + hl * 0.5], [hw / 2 - 0.4, sock - 1], [-hw / 2, sock - 1], [-hw / 2 - 0.3, top + hl * 0.55]], m.blade));
    s.push(R(-0.4, top + 3, 0.8, hl - 5, m.bladeDark));
  } else if (th === 'cyber') {
    for (const sd of [-1, 1]) s.push(T([[sd * 0.6, sock - 1], [sd * (hw * 0.8 + 1), sock - hl * 0.45], [sd * 1.8, top], [sd * 0.4, sock - hl * 0.4]], m.blade));
    s.push(neon(-0.4, top + 2, 0.8, hl - 2, m.neon[0]));
    for (const sd of [-1, 1]) s.push(T([[sd * hw * 0.6, sock - hl * 0.5], [sd * 1.4, top + 0.5], [sd * 1.0, top + 1.5], [sd * (hw * 0.6 - 0.8), sock - hl * 0.5]], m.neon[sd > 0 ? 0 : 1]));
    a.neon = [[[0, sock], [0, top + 1]]];
    a.ring = [0, sock - hl * 0.4, 6, 2];
  } else {
    // Progression: a tassel (rank 2), lugs at the socket (3), a side hook (4), hooks both sides (5).
    if (r === 2) s.push(T([[-1, sock + 2], [1, sock + 2], [2.5, sock + 8 + (f % 2)], [-2.5, sock + 8]], m.grip));
    if ((!th && r >= 3) || th === 'holy') for (const sd of [-1, 1]) s.push(T([[sd * 1, sock + 0.5], [sd * (hw + 1), sock + 2.5], [sd * 1.5, sock - 1.5]], m.trim));
    if (!th && r >= 4) s.push(T([[hw / 2 - 0.5, sock - hl * 0.55], [hw / 2 + 3.5, sock - hl * 0.8], [hw / 2 + 2.4, sock - hl * 0.4], [hw / 2 + 4, sock - 0.5], [hw / 2 - 0.5, sock - 1]], m.blade));
    if (!th && r >= 5) s.push(T([[-hw / 2 + 0.5, sock - hl * 0.5], [-hw / 2 - 4.5, sock - hl * 0.7], [-hw / 2 + 0.5, sock - hl * 0.25]], m.blade));
    if (m.name === 'dragonbone') s.push(...teeth(hw / 2 - 0.3, top + hl * 0.45, sock - 1, 1, 0.8, m.edge));
    s.push(mirrored([[0, top], [hw / 2, top + hl * 0.5], [hw / 2 - 0.6, sock]], m.blade));
    if (th || m.tier >= 3) s.push(R(-0.5, top + 3, 1, hl - 4, m.bladeDark));
    if (th || m.tier >= 4) s.push(T([[0, top + 1], [hw / 2 - 0.3, top + hl * 0.5], [hw / 2 - 0.8, sock], [0.2, sock]], m.edge));
    if (!th) s.push(...inlay(m, f, -hw / 2 + 0.6, hw / 2 - 0.6, top + 3, sock - 1));
    if (m.rune) {
      s.push(...runes(0, top + hl * 0.4, sock - 2, f, m.rune, m.runeDim, 4));
      a.runes = [0, top + hl * 0.4, sock - 2];
    }
    if (!th && m.tier >= 5) s.push(F(P(1, top + 3 + (f * 2) % (hl - 4), WHITE)));
    if (th === 'holy') {
      s.push(F(R(-0.5, top + 3, 1, hl - 4, GOLD)), ...halo(0, top + hl * 0.4, 5, 1.8));
      a.halo = [0, top + hl * 0.4, 5, 1.8];
      a.wings = [[-7, sock], [7, sock]];
    }
  }
  // The collar.
  s.push(R(-2, sock - 0.5, 4, 2.5, m.trim));
  if (th === 'bone') {
    const sk = skull(0, sock + 0.5, 2.6, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'demonic') {
    s.push(...demonEye(0, sock + 1, 1.2));
    a.eye = [0, sock + 1, 1.2];
  } else if (th === 'holy' || m.gems >= 1) {
    s.push(...gem(0, sock + 0.8, 1.1, gemOf(m, f), f));
    a.gem = [0, sock + 0.8];
  }
  if (orn) s.push(...orn.front);
  return { shapes: s, blade: [top, sock], reach, a };
}

// ---------- Wands and staves: shrine tools ----------
// (The old orb-topped wands and staves are retired.) A wand is a suzu, the bell staff a shrine maiden dances with: a lacquered handle, tiers of little gold bells
// on a slender stem (more tiers as it ranks up), and five-colour ribbons trailing from its end. A
// staff is a gohei on a tall pole: zigzag paper streamers hanging from a crossbar at the top, a
// ring of rattling bells round the head (a shakujo's), and a crowning ornament. Endgame themes keep
// the shrine shape in their own materials. Ribbons and streamers sway frame to frame.

// The handle's lacquer by rank: green bamboo, pale wood, then vermilion, then black and gold.
const LACQUER = ['#cfc070', '#ead2a2', '#d23a34', '#d23a34', '#2a2230', '#2a2230'];
const LACQUER_DK = ['#a8984c', '#c8aa78', '#9a1e22', '#9a1e22', '#141018', '#141018'];
const PAPER = '#ffffff';
const PAPER_SH = '#ddd6ee';
const RIBBONS = ['#e0303e', '#ffffff', '#ffd36a', '#4f8cd8', '#5fb86a'];
// Bells: brass on the plainest, then the weapon's own metal, a theme's colour on endgame ones.
function bellTone(m) {
  if (m.theme === 'holy') return ['#fff3c4', '#e0b040'];
  if (m.theme === 'demonic') return ['#4a2434', '#24141f'];
  if (m.theme === 'bone') return [m.blade, m.bladeDark];
  if (m.theme === 'laser') return [m.beam ?? m.gem, WHITE];
  if (m.theme === 'chainsaw') return [m.trim, m.trimDark];
  if (m.theme === 'cyber') return [m.blade, m.bladeDark];
  return m.rank <= 1 ? ['#f2c94c', '#b8862a'] : [m.trim, m.trimDark];
}
// One little bell: round, its slot, and a glint that hops with the frame.
function bell(x, y, r, tone, f, slot = '#3a2414') {
  const g = [[-0.4, -0.45], [-0.2, -0.5], [0, -0.4]][f % 3];
  return [E(x, y, r, r, tone[0]), F(R(x - r * 0.7, y + r * 0.15, r * 1.4, Math.max(0.35, r * 0.28), slot)), F(P(x + g[0] * r - 0.3, y + g[1] * r - 0.3, WHITE))];
}
// Ribbons hanging from (x, y) down `len`, fluttering with the frame.
function ribbons(x, y, len, n, f) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const sw = flapAt(f + i) * 0.5 + (i - (n - 1) / 2) * 0.9;
    const w = 0.7;
    out.push(T([[x - w / 2 + (i - (n - 1) / 2) * 0.5, y], [x + w / 2 + (i - (n - 1) / 2) * 0.5, y], [x + sw + w / 2, y + len * (0.8 + 0.1 * (i % 2))], [x + sw - w / 2, y + len * (0.8 + 0.1 * (i % 2)) + 0.6]], RIBBONS[i % RIBBONS.length]));
  }
  return out;
}
// A zigzag paper streamer (shide) hanging from (x, y): `n` folds `w` wide and `h` tall, swaying.
function shideOf(x, y, n, w, h, sway, side) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const k = i % 2 ? 1 : -1;
    const x0 = x + side * i * 0.35 + sway * (i / n);
    const y0 = y + i * h;
    out.push(T([[x0 - w / 2, y0], [x0 + w / 2, y0], [x0 + w / 2 - k * w * 0.55, y0 + h], [x0 - w / 2 - k * w * 0.55, y0 + h]], i % 2 ? PAPER_SH : PAPER));
  }
  return out;
}

function wand(m, f) {
  const r = m.rank;
  const th = m.theme;
  const H = [7, 7.5, 8, 8.5, 9, 9.5][r] + (m.step ?? 0) * 0.2; // the handle, above the hand
  const tiers = th ? 3 : [2, 2, 3, 3, 4, 4][r];
  const tone = bellTone(m);
  const lac = th === 'holy' ? IVORY_HANDLE : th ? m.handle : mix(LACQUER[r], m.blade, 0.3);
  const lacDk = th === 'holy' ? '#eadfc8' : th ? m.handleDark : mix(LACQUER_DK[r], m.bladeDark, 0.3);
  const s = [];
  const a = {};
  const reach = [];
  // The five-colour ribbons trailing from the end of the handle.
  s.push(...ribbons(0, 5.5, 8 + r * 0.6, Math.min(5, 2 + Math.ceil(r / 2)), f));
  // The handle: lacquered, a shadow down one side, a metal cap at the end and a collar at the top.
  s.push(R(-1, -H, 2, H + 6, lac), F(R(0.3, -H, 0.7, H + 6, lacDk)));
  if (r >= 2 || th) for (let y = -H + 2; y < 4; y += 3) s.push(F(R(-1, y, 2, 0.5, m.trim)));
  s.push(E(0, 6, 1.5, 1.1, m.trim), R(-1.6, -H - 1, 3.2, 1.4, m.trim));
  // The stem and the tiers of bells, widest at the bottom.
  const top = -H - 2 - tiers * 3.4;
  s.push(R(-0.4, top, 0.8, -H - 1 - top, m.trimDark));
  for (let i = 0; i < tiers; i++) {
    const y = -H - 3 - i * 3.4;
    const n = Math.max(2, tiers + 2 - i);
    const span = (n - 1) * 1.15;
    s.push(R(-span - 0.6, y - 1.6, span * 2 + 1.2, 0.6, m.trim));
    for (let k = 0; k < n; k++) s.push(...bell(-span + k * 2.3, y, th === 'laser' ? 0.9 : 1.05, tone, f + k, th === 'demonic' ? m.hot : th === 'laser' ? m.beam ?? m.gem : '#3a2414'));
  }
  const y = top - 1.6;
  a.blade = [y - 2, -H];
  a.head = [0, (top + -H) / 2];
  a.tip = [0, y - 2];
  // The finial, by rank and theme.
  if (th === 'holy') {
    s.push(...wings(0, y + 1, 6, flapAt(f), [-1, 1], 2));
    s.push(...gem(0, y, 1.3, m.gem, f), ...halo(0, y - 5, 3.6, 1.3));
    a.halo = [0, y - 5, 3.6, 1.3];
    a.wings = [[-5, y], [5, y]];
  } else if (th === 'demonic') {
    s.push(...horns(0, y + 1.5, 3.6, m.trimDark), E(0, y, 1.8, 1.8, m.blade), ...demonEye(0, y, 1.2));
    a.eye = [0, y, 1.2];
    a.flames = [[-2, y - 2], [2, y - 2], [0, y - 3]];
  } else if (th === 'bone') {
    const sk = skull(0, y - 0.5, 2.4, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'laser') {
    s.push(F(E(0, y, 1.6, 1.6, m.beam ?? m.gem)), F(P(-0.5, y - 0.5, WHITE)));
    a.orbs = [[0, y, 1.6]];
    a.beams = [{ pts: [[-2.5, top + 2], [0, y], [2.5, top + 2]], w: 0.5 }];
    a.emit = [0, -H];
    reach.push([0, y - 4]);
  } else if (th === 'chainsaw') {
    s.push(...sawDisc(0, y - 1, 3, f, 6, m));
    a.exhaust = [1.6, -H + 1];
    a.sparks = [[0, y - 4], [3, y - 1]];
  } else if (th === 'cyber') {
    s.push(neon(-0.6, y - 2, 1.2, 2.4, m.neon[f % 2]));
    a.ring = [0, (top + -H) / 2, 3.4, 1.2];
    a.neon = [[[0, top], [0, -H - 1]]];
  } else if (r >= 2) {
    // A jewel atop the stem from rank 2; a gold flame-shaped jewel mount (hoju) from rank 4, and
    // the material's crowning motif past that.
    if (r >= 4) s.push(T([[0, y - 4.2], [1.8, y - 1.2], [1.2, y + 0.8], [-1.2, y + 0.8], [-1.8, y - 1.2]], m.trim));
    s.push(...gem(0, y - 0.6, r >= 4 ? 1.3 : 1, gemOf(m, f), f));
    a.gem = [0, y - 0.6];
    const orn = motif(m, f, { emblem: [0, y - 0.6], crown: [0, y - 3], top: [0, y - 8], orbit: [0, y], guard: [0, top + 3, 3, [-1, 1]] }, 6, a);
    s.unshift(...orn.back);
    s.push(...orn.front);
  } else {
    s.push(E(0, y + 0.4, 0.9, 0.9, tone[0]));
  }
  if (m.rune) a.runes = [0, -H + 1, 3];
  return { shapes: s, blade: a.blade, reach, a };
}

function staff(m, f) {
  const r = m.rank;
  const th = m.theme;
  const S = [30, 32, 34, 36, 38, 40][r] + (m.step ?? 0) * 0.6;
  const tone = bellTone(m);
  const lac = th === 'holy' ? IVORY_HANDLE : th ? m.handle : mix(LACQUER[r], m.blade, 0.3);
  const lacDk = th === 'holy' ? '#eadfc8' : th ? m.handleDark : mix(LACQUER_DK[r], m.bladeDark, 0.3);
  const s = [];
  const a = {};
  const reach = [];
  // The pole: lacquered, shadowed, banded with metal, a metal shoe at the foot.
  s.push(R(-1.1, -S, 2.2, S + 13, lac), F(R(0.3, -S, 0.8, S + 13, lacDk)));
  for (let y = -S + 6; y < 10; y += r >= 2 || th ? 8 : 14) s.push(F(R(-1.1, y, 2.2, 0.8, m.trim)));
  s.push(R(-1.4, 11, 2.8, 2.6, m.trim), T([[-1.4, 13.6], [0, 15.5], [1.4, 13.6]], m.trimDark));
  // The head: a crossbar with the paper streamers, then (from rank 1) a ring of bells round a
  // pointed finial, a shakujo's.
  const yb = -S - 1;
  s.push(R(-4.6, yb - 0.8, 9.2, 1.4, m.trim));
  const sway = flapAt(f) * 0.6;
  const folds = 3 + Math.min(2, Math.floor(r / 2));
  s.push(...shideOf(-3.4, yb + 0.6, folds, 2.2, 2.2, sway - 0.6, -1), ...shideOf(3.4, yb + 0.6, folds, 2.2, 2.2, sway + 0.6, 1));
  if (th === 'demonic') s.push(F(R(-3.6, yb + 0.6, 0.4, folds * 2.2, m.hot)));
  // The finial's ring of bells.
  const rr = 3.6 + (r >= 3 ? 0.6 : 0);
  const cy = yb - rr - 1.2;
  a.head = [0, cy];
  a.tip = [0, cy - rr - 2];
  a.blade = [cy - rr - 2, -S];
  if (r >= 1 || th) {
    s.push(E(0, cy, rr, rr * 1.15, m.trim), E(0, cy, rr - 0.9, rr * 1.15 - 0.9, 'none'));
    for (let k = 0; k < (r >= 3 || th ? 4 : 2); k++) {
      const ang = Math.PI * (0.25 + (k / 3) * 0.5) * (k % 2 ? -1 : 1) + (k % 2 ? Math.PI : 0);
      s.push(...bell(Math.cos(ang) * rr, cy + Math.sin(ang) * rr * 1.15 + 1.4, 0.9, tone, f + k));
    }
  } else {
    // The plainest: a bamboo pole with a little bell tied under the crossbar.
    s.push(...bell(0, yb + 2.6, 1, tone, f));
  }
  if (th === 'holy') {
    s.push(...wings(0, cy, 8, flapAt(f), [-1, 1], 2.5), ...gem(0, cy, 1.6, m.gem, f), ...halo(0, cy - rr - 4, 4.5, 1.6));
    a.halo = [0, cy - rr - 4, 4.5, 1.6];
    a.wings = [[-7, cy], [7, cy]];
  } else if (th === 'demonic') {
    s.push(...horns(0, cy + 2, 4.5, m.trimDark), E(0, cy, 2.2, 2.2, m.blade), ...demonEye(0, cy, 1.5));
    a.eye = [0, cy, 1.5];
    a.flames = [[-3, cy - 3], [3, cy - 3], [0, cy - 4.5]];
  } else if (th === 'bone') {
    const sk = skull(0, cy, 3, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'laser') {
    s.push(F(E(0, cy, 2.2, 2.2, m.beam ?? m.gem)), F(P(-0.6, cy - 0.6, WHITE)));
    a.orbs = [[0, cy, 2.2]];
    a.beams = [{ pts: [[-rr, cy], [0, cy - rr], [rr, cy]], w: 0.6 }];
    a.emit = [0, yb];
    reach.push([0, cy - rr - 5]);
  } else if (th === 'chainsaw') {
    s.push(...sawDisc(0, cy, rr - 0.6, f, 6, m));
    a.exhaust = [2, -S + 2];
    a.sparks = [[0, cy - rr], [rr, cy]];
  } else if (th === 'cyber') {
    s.push(neon(-0.6, cy - 1.6, 1.2, 3.2, m.neon[f % 2]));
    a.ring = [0, cy, rr + 1, 1.4];
    a.neon = [[[0, -S], [0, yb]]];
  } else {
    // A pointed jewel finial (a flame-shaped hoju from rank 3), and the material's motif.
    s.push(T([[0, cy - rr - 2.4], [1.2, cy - 0.6], [0, cy + 0.6], [-1.2, cy - 0.6]], m.trim));
    if (r >= 2) {
      s.push(...gem(0, cy - 0.2, r >= 3 ? 1.4 : 1.1, gemOf(m, f), f));
      a.gem = [0, cy - 0.2];
    }
    const orn = motif(m, f, { emblem: [0, cy], crown: [0, cy - rr], top: [0, cy - rr - 6], orbit: [0, cy], guard: [0, yb, 5, [-1, 1]] }, 8, a);
    s.unshift(...orn.back);
    s.push(...orn.front);
  }
  if (m.rune) {
    s.push(...runes(0, -S + 4, -S * 0.35, f, m.rune, m.runeDim, 5));
    a.runes = [0, -S + 4, -S * 0.35];
  }
  return { shapes: s, blade: a.blade, reach, a };
}

// ---------- Bows ----------

// A limb's polygon running tip to tip. x(t) gives the belly's x at t in [-1, 1].
function limbPoly(H, xAt, th, c) {
  const outer = [];
  const inner = [];
  for (let i = 0; i <= 16; i++) {
    const t = -1 + (i / 16) * 2;
    const x = xAt(t);
    const w = th * (1 - 0.55 * Math.abs(t));
    outer.push([x, t * H]);
    inner.unshift([x - w, t * H]);
  }
  return T([...outer, ...inner], c);
}

function bow(m, f) {
  const r = m.rank;
  const th = m.theme;
  const H = [20, 21, 22, 23, 24, 27][r] + (m.step ?? 0) * 0.4;
  const bulge = 8 + (r >= 5 ? 1 : 0) + (!th && r >= 3 ? 4 : 0);
  const thick = [2.4, 2.6, 2.8, 2.8, 3, 3.2][r];
  const sx = -bulge + thick / 2;
  const curve = r >= 3 ? 1.6 : 0;
  const xAt = (t) => sx + bulge * (1 - Math.pow(Math.abs(t), 1.7)) + curve * Math.max(0, Math.abs(t) - 0.8) * 10;
  const tipX = xAt(1);
  const s = [];
  const a = { tip: [tipX, -H], head: [1, 0], blade: [-H, H] };
  const reach = [];
  const limbColor = th === 'holy' || (!th && r < 2) ? m.handle : m.blade;
  const orn = th ? null : motif(m, f, { emblem: [1.8, 0], crown: [1.8, -4], top: [tipX + 1, -H - 4], orbit: [1, 0], guard: [2, -2, 0, [1]] }, 11, a);
  if (orn) s.push(...orn.back);

  // The string, straight from tip to tip.
  const stringColor = th === 'demonic' ? m.hot : th === 'bone' ? '#bfffe0' : th === 'cyber' ? m.neon[0] : STRING;
  if (th === 'laser') {
    a.beams = [{ pts: [[tipX, -H], [tipX, H]], w: 0.4 }];
  } else s.push({ ...(th === 'demonic' || th === 'bone' || th === 'cyber' ? neon(tipX - 0.4, -H, 0.8, H * 2, stringColor) : R(tipX - 0.4, -H, 0.8, H * 2, stringColor)), string: true });
  // Where the string runs, so a draw can bend it back to the hand live (hero.js `drawString`).
  a.string = { x: tipX, h: H, color: stringColor };

  if (th === 'holy') {
    // Wing feathers along each limb, sweeping out toward the tips and growing longer.
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 5; i++) {
        const t = sd * (0.2 + i * 0.17);
        const x = xAt(t) - 0.5;
        const y = t * H;
        const len = 5 + i * 1.6;
        const fl = flapAt(f) * (0.4 + i * 0.15) * -sd;
        const tx = x + len * 0.95;
        const ty = y + sd * len * 0.4 - fl;
        s.push(T([[x, y - sd * 1.2], [tx, ty], [tx - 1.6, ty + sd * 1.4], [x - 0.5, y + sd * 2.2]], i % 2 ? '#d9e0fb' : WHITE));
      }
    }
    a.wings = [[8, -H * 0.6], [8, H * 0.6]];
  }
  if (th === 'laser') {
    // A chrome riser with stub limbs; the rest of the bow is light.
    s.push(limbPoly(H * 0.35, (t) => xAt(t * 0.35), thick, m.handle));
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const t = -1 + (i / 12) * 2;
      pts.push([xAt(t) - thick * 0.3, t * H]);
    }
    a.beams.push({ pts: pts.slice(0, 5), w: 0.9 }, { pts: pts.slice(8), w: 0.9 });
    for (const sd of [-1, 1]) s.push(R(xAt(sd * 0.35) - 2, sd * H * 0.35 - 1, 2.6, 2, m.trimDark), F(P(xAt(sd * 0.35) - 1, sd * H * 0.35 - 0.5, m.beam)));
    reach.push([tipX - 1, -H - 1], [tipX - 1, H + 1], [bulge, 0]);
  } else {
    s.push(limbPoly(H, xAt, thick, limbColor));
  }
  if (th === 'demonic') {
    for (let i = 1; i < 8; i++) {
      const t = -1 + i * 0.25;
      if (Math.abs(t) < 0.2) continue;
      const x = xAt(t);
      s.push(T([[x - 0.5, t * H - 1], [x + 2.4, t * H + Math.sign(t) * 1.5], [x - 0.5, t * H + 1]], m.trimDark));
    }
    for (let i = 0; i < 10; i++) {
      const t = -0.9 + i * 0.2;
      const lit = (i - f + 60) % 3 === 0;
      s.push(F(P(xAt(t) - thick * 0.45, t * H, lit ? m.ember : m.hot)));
    }
    s.push(...horns(tipX, -H + 1, 2.5, m.trimDark, [1]), ...horns(tipX, -H + 1, 2.5, m.trimDark, [1]).map((h) => ({ ...h, pts: h.pts.map(([x, y]) => [x, -y]) })));
    a.flames = [[xAt(-0.6), -H * 0.6], [xAt(0.6), H * 0.6], [tipX, -H]];
  }
  if (th === 'bone') {
    for (let i = 0; i <= 10; i++) {
      const t = -1 + i * 0.2;
      if (Math.abs(t) < 0.25) continue;
      s.push(E(xAt(t) - thick / 2, t * H, thick * 0.75, 1.1, m.handle));
    }
    for (const sd of [-1, 1]) for (let i = 0; i < 2; i++) s.push(T([[xAt(sd * 0.4) - 1, sd * (H * 0.35 + i * 3)], [xAt(sd * 0.4) + 4, sd * (H * 0.3 + i * 3 + 2)], [xAt(sd * 0.4) + 4.2, sd * (H * 0.3 + i * 3 + 3.2)], [xAt(sd * 0.4) - 1, sd * (H * 0.35 + i * 3 + 1.4)]], m.handle));
  }
  if (th === 'chainsaw') {
    for (const sd of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 5; i++) {
        const t = sd * (0.25 + i * 0.14);
        pts.push([xAt(t) + 0.6, t * H]);
      }
      for (let i = 0; i < pts.length - 1; i++) s.push(...chain(sd < 0 ? pts[i + 1] : pts[i], sd < 0 ? pts[i] : pts[i + 1], sd < 0 ? 1 : -1, f / 6, m.edge, 2.6));
    }
    s.push(...hazard(xAt(-0.6) - 2.5, -H * 0.6 - 1, 2.5, 2), ...hazard(xAt(0.6) - 2.5, H * 0.6 - 1, 2.5, 2));
    a.sparks = [[xAt(-0.6) + 1, -H * 0.6], [xAt(0.6) + 1, H * 0.6]];
    a.chain = [[[xAt(-0.3) + 1, -H * 0.3], [xAt(-0.9) + 1, -H * 0.9]], [[xAt(0.3) + 1, H * 0.3], [xAt(0.9) + 1, H * 0.9]]];
  }
  if (th === 'cyber') {
    for (let i = 0; i < 12; i++) {
      const t = -0.95 + i * 0.17;
      if (Math.abs(t) < 0.2) continue;
      if ((i + f) % 3) s.push(neon(xAt(t) - thick * 0.6, t * H, 1, 1.4, m.neon[i % 2]));
    }
    s.push(T([[tipX, -H], [tipX + 3, -H - 2], [tipX + 1, -H + 2]], m.trim), T([[tipX, H], [tipX + 3, H + 2], [tipX + 1, H - 2]], m.trim));
    a.neon = [[[xAt(-0.95) - 1, -H * 0.95], [xAt(-0.5) - 1, -H * 0.5], [xAt(-0.2) - 1, -H * 0.2]], [[xAt(0.2) - 1, H * 0.2], [xAt(0.5) - 1, H * 0.5], [xAt(0.95) - 1, H * 0.95]]];
    a.ring = [0, 0, 5, 7];
  }

  // Tips, blades at the tips (rank 3), fins along the back (Runic up), and inlaid runes or rainbow.
  if (!th) {
    if (r >= 1) for (const sd of [-1, 1]) s.push(E(tipX, sd * (H - 0.5), 1.4, 1.4, m.trim));
    if (r >= 3) for (const sd of [-1, 1]) s.push(T([[xAt(sd * 0.85), sd * H * 0.85], [xAt(sd * 0.85) + 3, sd * (H * 0.85 + 2)], [xAt(sd * 0.85), sd * (H * 0.85 + 2.4)]], m.trim));
    if (m.spikes) for (const sd of [-1, 1]) for (const u of r >= 5 ? [0.4, 0.62] : [0.5]) s.push(T([[xAt(sd * u) - 0.5, sd * H * (u - 0.08)], [xAt(sd * u) + 3.2, sd * H * u], [xAt(sd * u) - 0.5, sd * H * (u + 0.06)]], m.trim));
    if (r >= 2 && (m.rune || m.prism || m.tier >= 5)) {
      for (let i = 0; i < 6; i++) {
        const t = -0.85 + i * 0.34;
        const c = m.prism ? m.prism[(i + f) % m.prism.length] : m.rune ? ((i + f) % 3 ? m.rune : WHITE) : m.edge;
        s.push(F(P(xAt(t) - thick * 0.5, t * H, c)));
      }
    }
    if (m.rune) a.runes = [xAt(0.5) - 1, -H * 0.6, H * 0.6];
  }
  s.push(R(-1.8, -4, 3.6, 8, th === 'cyber' ? m.trim : th === 'laser' ? m.trim : m.grip));
  if (th === 'bone') {
    const sk = skull(1.5, 0, 2.6, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'demonic') {
    s.push(...demonEye(1.4, 0, 1.3));
    a.eye = [1.4, 0, 1.3];
  } else if (th === 'chainsaw') {
    s.push(R(-2.5, -4.5, 6, 9, m.trim), ...hazard(-2.5, 2.5, 6, 1.5), R(-4.5, -3, 2, 2.6, m.handleDark), F(P(1.5, -2.5, m.gem)));
    a.exhaust = [-4.5, -3];
  } else if (th === 'laser') {
    s.push(F(R(-1, -2.5, 2, 5, m.beam)));
    a.emit = [1, 0];
  } else if (th === 'cyber') {
    s.push(neon(-1, -3, 2, 6, m.neon[1]));
  } else if (r >= 2) {
    s.push(R(-1.8, -4, 3.6, 1, m.trim), R(-1.8, 3, 3.6, 1, m.trim), ...gem(1.8, 0, 1.2, gemOf(m, f), f));
    if (m.gems >= 2) for (const sd of [-1, 1]) s.push(...gem(xAt(sd * 0.3) - 0.8, sd * H * 0.3, 0.8, gemOf(m, f, 1), f));
    a.gem = [1.8, 0];
  }
  if (orn) s.push(...orn.front);
  if (th === 'holy') s.push(...gem(1.8, 0, 1.4, m.gem, f), ...halo(tipX + 1, -H - 3, 3, 1.1));
  if (th === 'holy') a.halo = [tipX + 1, -H - 3, 3, 1.1];
  return { shapes: s, blade: [-H, H], reach, a };
}

// ---------- Crossbows ----------

function crossbow(m0, f) {
  const m = headLook(m0);
  const r = m.rank;
  const th = m.theme;
  const S = [9, 10, 10, 11, 12, 13][r] + (m.step ?? 0) * 0.25;
  const px = [21, 21, 22, 22, 23, 24][r] + (m.step ?? 0) * 0.3;
  const cy = -4;
  const s = [];
  const a = { tip: [px + 5, cy], head: [px, cy], blade: [-14, 6] };
  const reach = [];
  const wood = th ? m.blade : m.handle;
  const orn = th ? null : motif(m, f, { emblem: [px - 4, cy + 0.5], crown: [px - 4, cy - 2.5], top: [px + 2, cy - S - 5], orbit: [px + 1, cy], guard: [4, cy - 2, 0, [-1, 1]] }, 10, a);
  if (orn) s.push(...orn.back);
  if (th === 'holy') {
    // Wings in place of the prongs, beating up and down.
    for (const sd of [-1, 1]) {
      for (let i = 0; i < 4; i++) {
        const tx = px + 2 - i * 2.6;
        const ty = cy + sd * (S + 3 - i * 1.2) + flapAt(f) * sd * (1 - i * 0.2);
        s.push(T([[px + 1.5, cy + sd * 0.5], [tx + 1, ty], [tx - 1.4, ty - sd * 1.6], [px - 1.5, cy + sd * 1.5]], i % 2 ? '#e8eeff' : WHITE));
      }
      s.push(E(px - 0.5, cy + sd * 3.5, 2.6, 2.4, WHITE));
    }
  }
  // The stock.
  s.push(T([[px - 1, cy - 2], [-10, cy - 2], [-13, cy + 1], [-11, cy + 6], [-4, cy + 6], [-1, cy + 10], [3, cy + 10], [2, cy + 3], [px - 1, cy + 3]], th === 'holy' ? m.handle : th === 'laser' ? '#5a6478' : th === 'chainsaw' ? m.handle : wood));
  if (th === 'bone') {
    s.push(E(-11, cy + 2, 2.6, 3.4, m.blade), E(px - 3, cy + 0.5, 2, 2.6, m.blade));
    for (let x = -6; x < px - 4; x += 3) s.push(F(P(x, cy + 0.5, m.bladeDark)));
  }
  if (th === 'cyber') s.push(neon(-8, cy + 0.2, px - 8, 0.8, m.neon[f % 2]), neon(-11, cy + 3, 5, 0.8, m.neon[1]), R(2, cy - 6, 8, 3, m.trim), F(R(3, cy - 5.4, 6, 1.6, m.neon[0])));
  if (th === 'demonic') {
    for (let x = -8; x < px - 3; x += 4) s.push(T([[x, cy - 2], [x + 1.5, cy - 4.5], [x + 3, cy - 2]], m.trimDark));
    for (let i = 0; i < 8; i++) s.push(F(P(-6 + i * 3, cy + 0.5 + (i % 2), (i - f + 60) % 3 === 0 ? m.ember : m.hot)));
  }
  if (th === 'chainsaw') s.push(R(4, cy - 4.5, 10, 9, m.trim), ...hazard(4, cy + 3, 10, 1.5), R(6, cy - 6.5, 2, 2, m.handleDark));
  if (r >= 2 && !th) s.push(R(-9, cy - 1, 5, 2, m.trim));
  if (r >= 4 && !th) s.push(R(-13, cy + 1, 2.5, 4, m.trim), T([[-13, cy + 1], [-15.5, cy + 3], [-13, cy + 5]], m.trim));
  if (m.rune) {
    s.push(...runes(-6, cy - 1, cy + 4, f, m.rune, m.runeDim, 4), ...runes(-2, cy - 1, cy + 3, f + 1, m.rune, m.runeDim, 4));
    a.runes = [-4, cy - 1, cy + 4];
  }
  if (m.gems >= 2) s.push(...gem(-10.5, cy + 2, 1, gemOf(m, f, 1), f));
  if (!th && m.spikes) s.push(T([[px - 3, cy + 2.5], [px + 7, cy + 4.5], [px - 1, cy + 5.5]], m.blade), T([[px - 2, cy + 3], [px + 6, cy + 4.4], [px - 1, cy + 4.4]], m.edge));
  // The bolt along the top.
  if (th === 'laser') {
    s.push(R(-2, cy - 3.5, px + 6, 1.4, m.trim), R(-2, cy + 1.5, px + 6, 1.4, m.trim), R(px + 3, cy - 4.5, 2, 8, m.trimDark));
    for (let x = 4; x < px; x += 5) s.push(E(x, cy - 0.5, 1.4, 1.8, m.trimDark), F(P(x - 0.5, cy - 1, m.beam)));
    a.beams = [{ pts: [[-1, cy - 0.5], [px + 6, cy - 0.5]], w: 0.8 }];
    a.orbs = [[px + 7, cy - 0.5, 1.6]];
    a.emit = [px + 6, cy - 0.5];
    a.tip = [px + 8, cy - 0.5];
    reach.push([px + 10, cy]);
    return { shapes: s, blade: a.blade, reach, a };
  }
  if (th === 'chainsaw') {
    s.push(...sawDisc(px + 1, cy, 8, f, 6, m));
    a.sparks = [[px + 1, cy - 10], [px + 10, cy]];
    a.exhaust = [7, cy - 6.5];
    a.tip = [px + 10, cy];
    a.head = [px + 1, cy];
    return { shapes: s, blade: a.blade, reach, a };
  }
  s.push(R(-2, cy - 3.8, px + 6, 1.5, th === 'demonic' ? m.hot : m.bladeDark), R(-4, cy - 4.4, 2.5, 2.6, th === 'holy' ? WHITE : m.trim));
  s.push(T([[px + 8, cy - 3], [px + 4, cy - 5.2], [px + 4, cy - 0.8]], th === 'holy' ? GOLD : th === 'bone' ? m.edge : m.blade));
  // The prongs (limbs) and string.
  if (th === 'bone') {
    for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) s.push(T([[px - 1, cy + sd * (1 + i)], [px + 3 - i, cy + sd * (S - i * 2)], [px + 1.5 - i, cy + sd * (S - i * 2 + 0.6)], [px - 1, cy + sd * (2 + i)]], m.handle));
    const sk = skull(px + 1, cy, 2.4, SOUL, m.blade, m.trimDark);
    s.push(...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'demonic') {
    s.push(...horns(px, cy, S * 0.6, m.trimDark).map((h) => ({ ...h, pts: h.pts.map(([x, y]) => [px + (cy - y) * -0.6 + 1, cy + (x - px)]) })));
    s.push(...demonEye(px, cy, 1.3));
    a.eye = [px, cy, 1.3];
    a.flames = [[px - 4, cy - S * 0.7], [px - 4, cy + S * 0.7], [px + 4, cy - 2.5]];
  } else if (th !== 'holy') {
    // Limbs bowing forward from the stock's nose, their tips swept back.
    const back = 3 + r * 0.4;
    const xAt = (t) => px + 2.6 - back * Math.pow(Math.abs(t), 1.6);
    s.push({ ...limbPoly(S, xAt, 2.6, th === 'cyber' || r >= 2 ? m.blade : r >= 1 ? m.trim : m.handle), y: cy });
    if (th === 'cyber') s.push(neon(px + 1.2, cy - S * 0.6, 0.8, S * 1.2, m.neon[(f + 1) % 2]));
    if (r >= 3 && !th) for (const sd of [-1, 1]) s.push(T([[xAt(1) - 1, cy + sd * S], [xAt(1) - 3, cy + sd * (S + 1.5)], [xAt(1) + 0.5, cy + sd * (S - 1.5)]], m.trim));
    s.push(R(xAt(1) - 0.9, cy - S + 0.5, 0.8, S * 2 - 1, th === 'cyber' ? m.neon[0] : STRING));
  } else {
    s.push(R(px - 0.6, cy - 9, 0.8, 18, STRING), ...halo(px + 5, cy - 2.5, 1.6, 3.2));
    a.halo = [px + 5, cy - 2.5, 1.6, 3.2];
    a.wings = [[px, cy - 9], [px, cy + 9]];
  }
  if (th === 'cyber') {
    a.neon = [[[-8, cy + 0.6], [px - 1, cy + 0.6]]];
    a.ring = [px + 3, cy - 2.5, 2, 5];
  }
  if (th === 'holy' || th === 'cyber' || m.gems >= 1) {
    s.push(...gem(px - 4, cy + 0.5, 1.2, gemOf(m, f), f));
    a.gem = [px - 4, cy + 0.5];
  }
  if (m.gems >= 3) s.push(...gem(px - 12, cy + 0.5, 1, gemOf(m, f, 2), f));
  if (orn) s.push(...orn.front);
  return { shapes: s, blade: a.blade, reach, a };
}

export const FORMS = {
  sword: (m, f) => bladed(m, f, SWORD),
  dagger: (m, f) => bladed(m, f, DAGGER),
  gauntlet,
  axe,
  spear,
  wand,
  staff,
  bow,
  crossbow,
};
