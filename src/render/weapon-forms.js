// Weapon forms: how each weapon type is built for a look (a progression tier or an endgame theme)
// and an animation frame. Every form draws around the grip at (0, 0) pointing toward -y, and
// returns { shapes, blade: [top, base], reach, a } where `a` holds the anchors live effects use
// (see weapon-fx.js). Higher ranks grow longer and fancier; themes swap in their own parts.
//
// Progression weapons evolve by tier: a bigger rank every four tiers reshapes the blade and guard,
// gems appear from Silver and multiply, spikes, fins and engraved runes come at Runic, and from
// Starsteel each material crowns the weapon with its own motif (see `motif`).

import { R, E, P, T, F } from './pixel.js';
import { WHITE, GOLD, STRING, STONE, PRISM, horns, demonEye, skull, wings, halo, hazard, chain, sawDisc, neon, vertebrae, runes, star, crescent, sunburst, crown, tendril } from './weapon-kit.js';

const FLAP = [0, -1, -2, -1.5, 0, 1];
const flapAt = (f) => FLAP[f % 6];
const SOUL = '#6bff9a';
const HORN = '#4a2a35';

// Common heads use stone instead of wood for axes, spears, and claws.
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
// crown sits (defaults to the emblem), `top` above the weapon for halos and orbits, and `guard`
// [x, y, gap, sides] where wings, horns, shards and tendrils spread. `z` is the wing size.
// Returns shapes to draw behind the weapon and in front of it, and sets anchors for live effects.
function motif(m, f, spots, z, a) {
  const back = [];
  const front = [];
  if (!m.motif) return { back, front };
  const [ex, ey] = spots.emblem;
  const [tx, ty] = spots.top;
  const [gx, gy, gap, sides] = spots.guard;
  const flap = flapAt(f);
  a.top = spots.top;
  switch (m.motif) {
    case 'star':
      front.push(star(ex, ey, z * 0.42, m.gem), ...gem(ex, ey, z * 0.11, WHITE, f));
      break;
    case 'moon':
      front.push(crescent(ex - z * 0.08, ey, z * 0.36, m.trim), F(P(ex - z * 0.3, ey - z * 0.12, WHITE)), ...gem(ex + z * 0.08, ey, z * 0.12, m.gem, f));
      break;
    case 'sun':
      front.push(...sunburst(ex, ey, z * 0.5, m.trim, 10), E(ex, ey, z * 0.24, z * 0.24, m.blade), ...gem(ex, ey, z * 0.12, m.gem, f));
      break;
    case 'horns':
      back.push(...horns(gx, gy + z * 0.2, z * 0.6, BONE, sides));
      break;
    case 'shards':
      for (const sd of sides) {
        const x = gx + sd * gap;
        back.push(T([[x, gy + 1], [x + sd * z * 0.42, gy - z * 0.62], [x + sd * z * 0.16, gy - z * 0.08]], '#c08aff'));
        back.push(T([[x, gy + 1.5], [x + sd * z * 0.55, gy - z * 0.15], [x + sd * z * 0.2, gy + z * 0.12]], '#433858'));
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
      sides.forEach((sd, i) => back.push(tendril(gx + sd * gap, gy + 1, z, sd, f + i * 2, ABYSS), tendril(gx + sd * gap, gy + 2, z * 0.6, sd, f + i * 2 + 3, '#4e2c70')));
      front.push(...abyssEye(ex, ey, z * 0.13, m.gem));
      a.eye = [ex, ey, z * 0.13];
      break;
    case 'orbit':
      back.unshift(...halo(tx, ty, z * 0.55, z * 0.18, m.trim));
      front.push(star(ex, ey, z * 0.3, m.gem), F(P(ex - 0.5, ey - 0.5, WHITE)));
      a.halo = [tx, ty, z * 0.55, z * 0.18];
      break;
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
  const L = d.L[r];
  const bw = d.bw[r];
  const gw = d.gw[r];
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
  const orn = th ? null : motif(m, f, { emblem: [0, base + 1.2], crown: [0, base - 0.4], top: [0, top - 5 * k], guard: [0, base - 1, bw / 2 - 0.5, [-1, 1]] }, 10 * k, a);
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

// ---------- Claws ----------

function claw(m0, f) {
  const m = headLook(m0);
  const r = m.rank;
  const th = m.theme;
  const L = [11, 12, 13, 14, 15, 16][r];
  const s = [];
  const a = { tip: [0, -5 - L], head: [0, -5 - L * 0.5], blade: [-5 - L, -5] };
  const reach = [];
  const glove = r === 0 ? m0.handle : th ? m.trim : r === 1 ? m.trimDark : m.handleDark;
  const orn = th ? null : motif(m, f, { emblem: [0, -0.5], crown: [0, -5.5], top: [0, -10 - L], guard: [0, -3, 4.5, [-1, 1]] }, 8, a);
  if (orn) s.push(...orn.back);
  if (!th && m.spikes) for (const sd of [-1, 1]) s.push(T([[sd * 5, -5], [sd * (7.5 + r * 0.3), -8 - r * 0.4], [sd * 5, -1.5]], m.trim));
  if (th === 'chainsaw') {
    s.push(...sawDisc(1, -12, 7, f, 6, m));
    s.push(R(-1, -7, 4, 3, m.handleDark));
    a.sparks = [[1, -20], [8, -12]];
    a.exhaust = [-5, -4];
    a.tip = [1, -21];
    a.head = [1, -12];
    a.blade = [-20, -5];
  }
  // The three talons.
  [-3.3, 0, 3.3].forEach((x, i) => {
    if (th === 'chainsaw') return;
    const l = L * (i === 1 ? 1 : 0.86);
    const cv = l * (th === 'demonic' ? 0.32 : 0.2);
    const y0 = -5;
    if (th === 'laser') {
      s.push(R(x - 1, y0 - 2, 2, 2, m.trim), F(R(x - 0.6, y0 - 2.4, 1.2, 0.5, m.beam)));
      (a.beams ??= []).push({ pts: [[x, y0 - 2.5], [x + cv * 0.2, y0 - l * 0.55], [x + cv, y0 - l]], w: 1.1 });
      reach.push([x + cv, y0 - l - 1]);
      return;
    }
    if (th === 'bone') {
      for (let j = 0; j < 3; j++) {
        const yy = y0 - 2 - j * (l / 3.4);
        s.push(E(x + cv * (j / 3) * 0.6, yy, 1.4 - j * 0.15, l / 7.5, m.blade), F(P(x + cv * (j / 3) * 0.6 - 0.5, yy + l / 7.5 - 0.6, m.bladeDark)));
      }
      s.push(T([[x - 0.8 + cv * 0.6, y0 - l * 0.85], [x + cv, y0 - l], [x + 0.9 + cv * 0.6, y0 - l * 0.8]], m.edge));
      return;
    }
    const pts = [[x - 1.3, y0], [x - 1.2, y0 - l * 0.5], [x + cv, y0 - l], [x + 1.3, y0 - l * 0.55], [x + 1.3, y0]];
    s.push(T(pts, th === 'holy' ? WHITE : m.blade));
    if (th === 'holy') s.push(F(R(x - 0.2, y0 - l * 0.7, 0.6, l * 0.65, GOLD)), T([[x - 1.2, y0 - l * 0.3], [x - 2.4, y0 - l * 0.45], [x - 1.2, y0 - l * 0.5]], '#e8eeff'));
    else if (th === 'demonic') s.push(F(T([[x + cv, y0 - l], [x + 1.3, y0 - l * 0.55], [x + 1.3, y0 - 1], [x + 0.6, y0 - 1], [x + 0.6, y0 - l * 0.55]], m.hot)));
    else if (th === 'cyber') s.push(neon(x + 0.4, y0 - l * 0.55, 0.8, l * 0.5, m.neon[(i + f) % 2]), T([[x + 0.4, y0 - l * 0.55], [x + cv, y0 - l], [x + 1.2, y0 - l * 0.55]], m.neon[0]));
    else if (m.tier >= 4) s.push(T([[x + 0.3, y0 - l * 0.5], [x + cv, y0 - l + 0.5], [x + 1.2, y0 - l * 0.55], [x + 1.2, y0]], m.edge));
    if (!th) s.push(...inlay(m, f, x - 1.2, x + 1.2, y0 - l * 0.6, y0, 1, x));
    if (m.rune) s.push(F(P(x - 0.5, y0 - l * 0.35 - ((f + i) % 3), m.rune)), F(P(x - 0.5, y0 - l * 0.2, m.runeDim)));
  });
  // The gauntlet over the knuckles.
  s.push(R(-5.2, -5.5, 10.4, 9, glove));
  if (th === 'bone') {
    const sk = skull(0, -1.5, 2.8, SOUL, m.blade, m.trimDark);
    s.push(R(-5.2, -5.5, 10.4, 1.6, m.handleDark), ...sk.shapes);
    a.eyes = sk.eyes;
  } else if (th === 'demonic') {
    s.push(...[-3.3, 0, 3.3].map((x) => T([[x - 1, -5.5], [x, -8], [x + 1, -5.5]], m.trimDark)));
    s.push(...demonEye(0, -1, 1.5));
    a.eye = [0, -1, 1.5];
    a.flames = [[-3.3, -9], [0, -11], [3.3, -9]];
  } else if (th === 'holy') {
    s.push(...wings(0, -3, 8, flapAt(f), [-1, 1], 4.5), R(-5.2, -5.5, 10.4, 1.8, m.trim), ...gem(0, -1, 1.5, m.gem, f));
    s.push(...halo(0, -7 - L - 3, 3.6, 1.3));
    a.halo = [0, -10 - L, 3.6, 1.3];
    a.wings = [[-6, -2], [6, -2]];
  } else if (th === 'laser') {
    s.push(R(-5.2, -5.5, 10.4, 1.5, m.trimDark), F(R(-3.5, -1, 7, 0.8, m.beam)));
    a.emit = [0, -7];
  } else if (th === 'chainsaw') {
    s.push(...hazard(-5.2, -1, 10.4, 1.6), R(-7, -4, 2, 3, m.handleDark));
  } else if (th === 'cyber') {
    s.push(neon(-5.2, -2, 10.4, 0.8, m.neon[f % 2]), neon(-3.5, 1, 7, 0.6, m.neon[(f + 1) % 2]));
    a.ring = [0, 0, 7, 2];
    a.neon = [[[-5, -2], [5, -2]]];
  } else {
    if (r >= 1) s.push(R(-5.2, -5.5, 10.4, 1.8, m.trim));
    if (r === 0) for (let x = -4; x < 5; x += 2) s.push(F(P(x, -2, '#e6d2a8')));
    if (r === 1) s.push(F(P(-4, -1, m.trim)), F(P(3, -1, m.trim)));
    if (r >= 3) s.push(R(-5.2, 2, 10.4, 1.5, m.trim));
    if (m.gems >= 1) s.push(...gem(0, -0.5, 1.5, gemOf(m, f), f));
    if (m.gems >= 2) s.push(...gem(-3.4, 0, 0.9, gemOf(m, f, 1), f), ...gem(3.4, 0, 0.9, gemOf(m, f, 2), f));
    if (m.rune) a.runes = [0, -5 - L, -5];
    a.gem = [0, -0.5];
  }
  if (orn) s.push(...orn.front);
  return { shapes: s, blade: a.blade, reach, a };
}

// ---------- Axes ----------

function axe(m0, f) {
  const m = headLook(m0);
  const r = m.rank;
  const th = m.theme;
  const H = [26, 28, 30, 32, 34, 37][r];
  const hh = [12, 14, 15, 16, 18, 20][r];
  const bx = [10, 11, 12, 13, 14, 16][r];
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
  const orn = th ? null : motif(m, f, { emblem: [0, mid], crown: [0, top + 0.5], top: [0, top - 7], guard: [-1, mid, 0, [-1]] }, 9, a);
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
  const S = [34, 36, 38, 40, 42, 45][r];
  const hl = [9, 10, 11, 13, 14, 16][r];
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
  const orn = th ? null : motif(m, f, { emblem: [0, sock + 0.8], crown: [0, sock - 0.5], top: [0, top - 5], guard: [0, sock + 1, 1.5, [-1, 1]] }, 9, a);
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
    if (!th && r >= 4) for (const sd of r >= 5 ? [-1, 1] : [1]) s.push(T([[0, top + 2], [sd * (hw * 0.5 + 2.5), top + 4], [sd * (hw * 0.5 + 3.5), sock - 3], [sd * hw * 0.5, sock - 1]], m.blade));
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

// ---------- Wands and staves ----------

// The head of a wand or staff for a look, centered on (0, y). `big` is 1 for wands and ~1.6 for
// staves.
function focus(m, f, y, big, s, a, reach) {
  const r = m.rank;
  const th = m.theme;
  const z = big;
  a.head = [0, y];
  a.tip = [0, y - 5 * z];
  if (th === 'holy') {
    s.push(...wings(0, y + 1, 7 * z, flapAt(f), [-1, 1], 2.5 * z));
    s.push(T([[0, y - 5 * z], [3 * z, y], [0, y + 4 * z], [-3 * z, y]], '#fff6dc'), T([[0, y - 4 * z], [2 * z, y], [0, y + 3 * z], [0, y]], WHITE));
    s.push(...gem(0, y + 0.5, 1.4 * z, m.gem, f));
    s.push(T([[-4 * z, y - 3 * z], [-2.5 * z, y + 3 * z], [0, y + 5 * z], [2.5 * z, y + 3 * z], [4 * z, y - 3 * z], [3 * z, y - 2.5 * z], [1.8 * z, y + 2.2 * z], [0, y + 3.6 * z], [-1.8 * z, y + 2.2 * z], [-3 * z, y - 2.5 * z]], m.trim));
    s.push(...halo(0, y - 8 * z, 4.5 * z, 1.6 * z));
    a.halo = [0, y - 8 * z, 4.5 * z, 1.6 * z];
    a.wings = [[-6 * z, y], [6 * z, y]];
    a.tip = [0, y - 8 * z];
  } else if (th === 'demonic') {
    s.push(...horns(0, y + 2.5 * z, 4.5 * z, m.trimDark));
    s.push(E(0, y, 4 * z, 4 * z, m.blade), ...demonEye(0, y, 2 * z));
    for (const sd of [-1, 1]) s.push(T([[sd * 3 * z, y + 2.5 * z], [sd * 5.5 * z, y + 5 * z], [sd * 2 * z, y + 4 * z]], m.trim));
    a.eye = [0, y, 2 * z];
    a.flames = [[-3 * z, y - 3 * z], [3 * z, y - 3 * z], [0, y - 4.5 * z]];
  } else if (th === 'bone') {
    const sk = skull(0, y, 3.4 * z, SOUL, m.blade, m.trimDark);
    if (z > 1.2) s.push(...[-3, -1, 1, 3].map((x) => T([[x * z - 0.8, y - 2.6 * z], [x * z, y - 5.5 * z + Math.abs(x) * 0.6], [x * z + 0.8, y - 2.6 * z]], m.trim)));
    s.push(...sk.shapes);
    for (const sd of [-1, 1]) s.push(T([[sd * 2 * z, y + 3 * z], [sd * 5 * z, y + 4 * z], [sd * 5.6 * z, y + 7 * z], [sd * 4.4 * z, y + 5 * z], [sd * 2 * z, y + 4.4 * z]], m.handle));
    a.eyes = sk.eyes;
  } else if (th === 'laser') {
    for (const sd of [-1, 1]) s.push(T([[sd * 1, y + 4 * z], [sd * 4 * z, y + 1 * z], [sd * 4 * z, y - 3 * z], [sd * 3 * z, y - 3 * z], [sd * 3 * z, y + 0.5 * z], [sd * 1, y + 2.5 * z]], m.trim));
    s.push(F(P(-4 * z, y - 3.5 * z, m.beam)), F(P(4 * z - 1, y - 3.5 * z, m.beam)));
    a.orbs = [[0, y - 1, 2 * z]];
    a.beams = [{ pts: [[-3.5 * z, y - 3 * z], [0, y - 1], [3.5 * z, y - 3 * z]], w: 0.6 }];
    a.emit = [0, y + 3 * z];
    reach.push([0, y - 6 * z]);
  } else if (th === 'chainsaw') {
    s.push(...sawDisc(0, y - 1, 4.5 * z, f, 6, m));
    s.push(R(-2.5 * z, y + 3 * z, 5 * z, 3 * z, m.trim), ...hazard(-2.5 * z, y + 5 * z, 5 * z, 1.2), R(2.5 * z, y + 3.5 * z, 1.4, 2, m.handleDark));
    a.exhaust = [3 * z, y + 3.5 * z];
    a.sparks = [[0, y - 6 * z], [4.5 * z, y - 3 * z]];
    a.tip = [0, y - 6 * z];
  } else if (th === 'cyber') {
    for (const sd of [-1, 1]) s.push(T([[sd * 1, y + 4 * z], [sd * 3.5 * z, y - 1 * z], [sd * 2.5 * z, y - 5 * z], [sd * 2 * z, y - 4.6 * z], [sd * 2.6 * z, y - 1 * z], [sd * 0.6, y + 2.5 * z]], m.blade));
    const c = m.neon[f % 2];
    s.push(F(T([[0, y - 3.5 * z], [2 * z, y - 1], [0, y + 1.6 * z], [-2 * z, y - 1]], c)), F(T([[0, y - 2 * z], [1 * z, y - 1], [0, y + 0.2 * z], [-1 * z, y - 1]], m.blade)));
    s.push(neon(-2.5 * z, y - 4.8 * z, 1, 1, m.neon[1]), neon(2.5 * z - 1, y - 4.8 * z, 1, 1, m.neon[0]));
    a.ring = [0, y - 1, 5 * z, 1.6 * z];
    a.neon = [[[0, y - 3.5 * z], [2 * z, y - 1], [0, y + 1.6 * z], [-2 * z, y - 1], [0, y - 3.5 * z]]];
  } else if (r === 0) {
    s.push(T([[0, y + 2], [-2 * z, y - 2 * z], [-1 * z, y - 4 * z], [0.5, y - 1]], m.handle), E(1.5 * z, y - 2 * z, 1.8 * z, 1.2 * z, '#8fd36b'), F(P(1.5 * z, y - 2.4 * z, '#c9f2a0')));
  } else if (r === 1) {
    s.push(E(0, y, 2.6 * z, 2.6 * z, m.trim), R(-2.6 * z, y - 0.4, 5.2 * z, 0.8, m.trimDark), E(-0.8 * z, y - 0.9 * z, 0.7 * z, 0.7 * z, m.edge));
  } else {
    // Progression: a star-shaped mount (rank 2), a ring around a floating crystal (3), prongs
    // cradling an orb (4), and the ring around the cradle (5). Motifs fill the heart of it.
    const orn = motif(m, f, { emblem: [0, y], crown: [0, y - 3 * z], top: [0, y - 9 * z], guard: [0, y + 1, 2.5 * z, [-1, 1]] }, 7 * z, a);
    const bob = [0, -0.6, -1, -0.6, -0.3, 0.2][f % 6];
    s.push(...orn.back);
    if (r === 2) {
      s.push(T([[0, y - 6 * z], [1.8 * z, y - 1.4 * z], [6.6 * z, y - 1.2 * z], [2.8 * z, y + 1.8 * z], [4.2 * z, y + 6.4 * z], [0, y + 3.8 * z], [-4.2 * z, y + 6.4 * z], [-2.8 * z, y + 1.8 * z], [-6.6 * z, y - 1.2 * z], [-1.8 * z, y - 1.4 * z]], m.trim));
      s.push(...inlay(m, f, -1.5 * z, 1.5 * z, y - 3 * z, y + 3 * z));
      s.push(...gem(0, y + 0.8, 1.8 * z, gemOf(m, f), f));
    }
    if (r === 3 || r === 5) {
      const R5 = r === 5 ? 6 : 5;
      if (m.spikes) for (const sd of [-1, 1]) s.push(T([[sd * (R5 - 1) * z, y - 1.5 * z], [sd * (R5 + 2.2) * z, y - 0.5 * z], [sd * (R5 - 1) * z, y + 1.5 * z]], m.trim), T([[-1.2 * z, y - (R5 - 1) * z], [0, y - (R5 + 2.4) * z], [1.2 * z, y - (R5 - 1) * z]], m.trim));
      s.push(E(0, y, R5 * z, R5 * z, m.trim), E(0, y, (R5 - 1) * z, (R5 - 1) * z, 'none'));
    }
    if (r === 3) s.push(T([[0, y - 3 * z + bob], [1.6 * z, y + bob], [0, y + 3 * z + bob], [-1.6 * z, y + bob]], gemOf(m, f)), F(P(-0.5, y - 1.5 + bob, WHITE)));
    if (r >= 4) {
      for (const sd of [-1, 1]) s.push(T([[sd * 1, y + 4 * z], [sd * 4 * z, y + 1 * z], [sd * 3 * z, y - 4 * z], [sd * 2.2 * z, y - 1 * z], [sd * 0.6, y + 2.4 * z]], m.trim));
      s.push(E(0, y - 0.5, 2.6 * z, 2.6 * z, gemOf(m, f)), F(E(-0.8 * z, y - 1.4 * z, 0.7 * z, 0.7 * z, WHITE)));
    }
    if (m.rune && r >= 4) s.push(...runes(0, y - 2, y + 1, f, WHITE, m.rune, 4));
    if (m.rune) a.runes = [0, y - 2, y + 6];
    a.gem = [0, y - 0.5];
    s.push(...orn.front);
  }
}

function wand(m, f) {
  const r = m.rank;
  const th = m.theme;
  const L = [14, 15, 16, 17, 18, 20][r];
  const y = -L - 3;
  const s = [];
  const a = { blade: [y - 6, -L + 4] };
  const reach = [];
  if (th === 'bone') s.push(...vertebrae(0, -L, 6, 2.4, m));
  else if (r === 0) s.push(T([[-1, 6], [1, 6], [1.2, -L * 0.5], [0.4, -L], [-0.8, -L], [-0.4, -L * 0.5]], m.handle));
  else s.push(R(-1, -L, 2, L + 6, th === 'cyber' ? m.blade : m.handle));
  if (r >= 1 && th !== 'bone') {
    s.push(R(-1.4, -L * 0.25, 2.8, 1.4, m.trim), R(-1.4, 2, 2.8, 1.4, m.trim));
    if (!th && r >= 3) s.push(R(-1.4, -L + 0.5, 2.8, 1.4, m.trim), E(0, 7, 1.6, 1.3, m.trim));
    if (m.gems >= 2) s.push(...gem(0, -L * 0.25 + 0.7, 0.9, gemOf(m, f, 1), f));
    if (th === 'cyber') s.push(neon(-1, -L * 0.6, 2, 0.8, m.neon[f % 2]), neon(-1, -L * 0.45, 2, 0.8, m.neon[(f + 1) % 2]));
    if (m.rune) s.push(...runes(0, -L + 2.5, -L * 0.35, f, m.rune, m.runeDim, 4));
    if (th === 'demonic') s.push(T([[-1, -L * 0.6], [-3, -L * 0.7], [-1, -L * 0.5]], m.trimDark), T([[1, -L * 0.4], [3, -L * 0.5], [1, -L * 0.3]], m.trimDark));
  }
  focus(m, f, y, 1, s, a, reach);
  return { shapes: s, blade: a.blade, reach, a };
}

function staff(m, f) {
  const r = m.rank;
  const th = m.theme;
  const S = [30, 32, 34, 36, 38, 40][r];
  const y = -S - 6;
  const s = [];
  const a = { blade: [y - 10, -S + 4] };
  const reach = [];
  if (th === 'bone') s.push(...vertebrae(0, -S, 13, 3, m));
  else if (r === 0) {
    s.push(T([[-1.4, 13], [1.4, 13], [1.6, -S * 0.3], [1.0, -S * 0.7], [1.6, -S], [-1.2, -S], [-1.6, -S * 0.6], [-1.0, -S * 0.3]], m.handle));
    s.push(E(1.4, -S * 0.45, 1, 1.4, m.handleDark), E(-1.2, -S * 0.15, 0.9, 1.2, m.handleDark));
  } else {
    s.push(R(-1.25, -S, 2.5, S + 13, m.handle));
    if (th === 'cyber') for (let yy = -S + 4, i = 0; yy < 8; yy += 7, i++) s.push(neon(-1.25, yy, 2.5, 0.8, m.neon[(i + f) % 2]));
    if (th === 'demonic') for (let yy = -S + 6; yy < 0; yy += 9) s.push(T([[1.2, yy], [3.5, yy - 2], [1.2, yy + 2]], m.trimDark), T([[-1.2, yy + 4], [-3.5, yy + 2], [-1.2, yy + 6]], m.trimDark));
    if (th === 'laser') s.push(R(-1.6, -S * 0.3, 3.2, 1, m.trimDark), R(-1.6, -S * 0.6, 3.2, 1, m.trimDark), F(R(-1.25, -S * 0.45, 2.5, 0.6, m.beam)));
    if (r === 1) for (let yy = -S + 2; yy < 10; yy += 10) s.push(R(-1.5, yy, 3, 1.2, m.trim));
    if (m.rune) s.push(...runes(0, -S + 4, -S * 0.35, f, m.rune, m.runeDim, 5));
    if (!th && r >= 2) s.push(R(-1.5, -S * 0.3, 3, 1.4, m.trim));
    if (m.gems >= 2) s.push(...gem(0, -S * 0.3 + 0.7, 1, gemOf(m, f, 1), f));
    if (!th && r >= 4) s.push(T([[-1.4, 13], [0, 17], [1.4, 13]], m.trim));
    s.push(R(-1.5, 11, 3, 2.5, m.trim));
    if (!th || th === 'holy' || th === 'cyber') s.push(R(-1.6, -S, 3.2, 2.5, m.trim));
  }
  if (r === 1) {
    // An iron cage around a stone.
    s.push(E(0, y + 1, 3.6, 4, '#9aa0aa'), R(-4, y - 3, 1.2, 8, m.trim), R(2.8, y - 3, 1.2, 8, m.trim), R(-0.6, y - 4, 1.2, 9, m.trim), R(-4, y - 4, 8, 1.4, m.trim));
    a.head = [0, y];
    a.tip = [0, y - 4];
    return { shapes: s, blade: a.blade, reach, a };
  }
  if (r === 0) {
    // A curled crook with a sprouting leaf.
    s.push(T([[-1.6, -S], [-4, -S - 4], [-3.6, -S - 9], [0, -S - 11], [3.6, -S - 9], [3.8, -S - 5], [1.4, -S - 4], [1, -S - 6.5], [2, -S - 8], [0, -S - 9], [-1.8, -S - 7.5], [-1.8, -S - 4], [1.6, -S]], m.handle));
    s.push(E(4, -S - 4, 2, 1.2, '#8fd36b'), F(P(4, -S - 4.4, '#c9f2a0')));
    a.head = [0, -S - 6];
    a.tip = [0, -S - 11];
    return { shapes: s, blade: a.blade, reach, a };
  }
  focus(m, f, th ? y - 2 : y, th ? 2 : 1.6, s, a, reach);
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
  const H = [20, 21, 22, 23, 24, 27][r];
  const bulge = 8 + (r >= 5 ? 1 : 0);
  const thick = [2.4, 2.6, 2.8, 2.8, 3, 3.2][r];
  const sx = -bulge + thick / 2;
  const curve = r >= 3 ? 1.6 : 0;
  const xAt = (t) => sx + bulge * (1 - Math.pow(Math.abs(t), 1.7)) + curve * Math.max(0, Math.abs(t) - 0.8) * 10;
  const tipX = xAt(1);
  const s = [];
  const a = { tip: [tipX, -H], head: [1, 0], blade: [-H, H] };
  const reach = [];
  const limbColor = th === 'holy' || (!th && r < 2) ? m.handle : m.blade;
  const orn = th ? null : motif(m, f, { emblem: [1.8, 0], crown: [1.8, -4], top: [tipX + 1, -H - 4], guard: [2, -2, 0, [1]] }, 9, a);
  if (orn) s.push(...orn.back);

  // The string, straight from tip to tip.
  const stringColor = th === 'demonic' ? m.hot : th === 'bone' ? '#bfffe0' : th === 'cyber' ? m.neon[0] : STRING;
  if (th === 'laser') {
    a.beams = [{ pts: [[tipX, -H], [tipX, H]], w: 0.4 }];
  } else s.push(th === 'demonic' || th === 'bone' || th === 'cyber' ? neon(tipX - 0.4, -H, 0.8, H * 2, stringColor) : R(tipX - 0.4, -H, 0.8, H * 2, stringColor));

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
  const S = [9, 10, 10, 11, 12, 13][r];
  const px = [21, 21, 22, 22, 23, 24][r];
  const cy = -4;
  const s = [];
  const a = { tip: [px + 5, cy], head: [px, cy], blade: [-14, 6] };
  const reach = [];
  const wood = th ? m.blade : m.handle;
  const orn = th ? null : motif(m, f, { emblem: [px - 4, cy + 0.5], crown: [px - 4, cy - 2.5], top: [px + 2, cy - S - 5], guard: [4, cy - 2, 0, [-1, 1]] }, 8, a);
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
  claw,
  axe,
  spear,
  wand,
  staff,
  bow,
  crossbow,
};
