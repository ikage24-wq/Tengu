// Mage gear: robes, towering hats, and great capes, in six stages that grow grander every set.
//   0  Apprentice, Initiate (t0-1): a soft floppy cap and a plain rope-belted robe.
//   1  Scholar..Arcanist (t2-4): the classic pointed wizard hat with a bent tip, sashed robes.
//   2  Sorcerer..Sage (t5-8): taller hats with drooping tips and charms, layered open robes.
//   3  Archon..Moonsage (t9-12): towering crowned hats with floating stars and moons, vestments.
//   4  Sunspire..Ethereal (t13-16): spire hats with halos, wings, and rings; regalia, winged capes.
//   5  Cosmic, Eclipse, Eternity (t17-19): the grandest hats and crowns, arcane wing cloaks.
// Hat tips and feathers follow m.hair; hems, tails, and charms swing with m.sway; wings beat with m.flap.

import { R, E, T, F, mix } from '../pixel.js';
import { hsl } from './kit.js';
import { FIGURE, band, side, MID, limb, mirrorX } from '../figure.js';

const WHITE = '#ffffff';
const ROPE = '#c9a27a';
const stage = (t) => (t < 2 ? 0 : t < 5 ? 1 : t < 9 ? 2 : t < 13 ? 3 : t < 17 ? 4 : 5);
const rad = (d) => (d * Math.PI) / 180;
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i));
const lerp = (a, b, u) => a + (b - a) * u;

// ---------- Ornaments ----------

function star(cx, cy, r, c, n = 5, k = 0.45, rot = 0) {
  return T(ring(n * 2, (i) => {
    const a = (i * Math.PI) / n - Math.PI / 2 + rot;
    const rr = i % 2 ? r * k : r;
    return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
  }), c);
}
const sparkle = (cx, cy, r, c) => F(star(cx, cy, r, c, 4, 0.3));

// A crescent moon whose horns open toward angle phi (degrees).
function crescent(cx, cy, r, c, phi = 0) {
  const p = rad(phi);
  const at = (ox, rr, a) => [cx + ox * Math.cos(p) + rr * Math.cos(p + rad(a)), cy + ox * Math.sin(p) + rr * Math.sin(p + rad(a))];
  return T([...ring(9, (i) => at(0, r, 40 + i * 35)), ...ring(7, (i) => at(r * 0.24, r * 0.83, 309.6 - i * 43.2))], c);
}

// A band along an ellipse between two angles (degrees; 0 = right, 90 = down), th thick.
function arc(cx, cy, rx, ry, th, a0, a1, c, n = 10) {
  const pt = (k, a) => [cx + Math.cos(rad(a)) * (rx - k), cy + Math.sin(rad(a)) * (ry - k)];
  return T([...ring(n + 1, (i) => pt(0, lerp(a0, a1, i / n))), ...ring(n + 1, (i) => pt(th, lerp(a1, a0, i / n)))], c);
}

// ---------- Hats ----------

// A soft cone rising from (x, y), w wide at the base and h long, its tip bending `curl` degrees
// toward the back (left). Returns the spine: points with a heading and half width.
function cone(x, y, w, h, curl, tip = 0.8, n = 12) {
  const sp = [];
  let px = x;
  let py = y;
  let a = -Math.PI / 2;
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    sp.push({ x: px, y: py, a, r: ((w - tip) / 2) * Math.pow(1 - u, 0.85) + tip / 2 });
    a -= (rad(curl) * 3 * (u + 0.5 / n) ** 2) / n;
    px += Math.cos(a) * (h / n);
    py += Math.sin(a) * (h / n);
  }
  return sp;
}
const edge = (q, k, grow = 0) => [q.x - Math.sin(q.a) * (q.r + grow) * k, q.y + Math.cos(q.a) * (q.r + grow) * k];
function spineAt(sp, u) {
  const f = Math.max(0, Math.min(1, u)) * (sp.length - 1);
  const i = Math.min(sp.length - 2, Math.floor(f));
  const a = sp[i];
  const b = sp[i + 1];
  const k = f - i;
  return { x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k), a: lerp(a.a, b.a, k), r: lerp(a.r, b.r, k) };
}
const coneShape = (sp, c) => T([...sp.map((q) => edge(q, 1)), ...sp.slice().reverse().map((q) => edge(q, -1))], c);
// A band wrapped around the cone between u0 and u1.
function coneBand(sp, u0, u1, c, grow = 0.4) {
  const qs = ring(4, (i) => spineAt(sp, lerp(u0, u1, i / 3)));
  return T([...qs.map((q) => edge(q, 1, grow)), ...qs.reverse().map((q) => edge(q, -1, grow))], c);
}
// A point on the cone: u along it, k across it (-1 left edge .. 1 right edge).
const onCone = (sp, u, k) => edge(spineAt(sp, u), k);

// A brim: an ellipse whose ends curl up by `lift`.
const brim = (rx, ry, lift, y, c) => T(ring(24, (i) => {
  const th = (i / 24) * Math.PI * 2;
  return [15.5 + rx * Math.cos(th), y + ry * Math.sin(th) - lift * Math.abs(Math.cos(th)) ** 4];
}), c);

// A crown around the hat's base: `n` points, gems in each.
function crown(y, hw, hgt, n, p, gems = true) {
  const pts = [[15.5 - hw, y + 0.6], [15.5 + hw, y + 0.6]];
  for (let i = 0; i <= n * 2; i++) pts.push([15.5 + hw - (i * hw) / n, y - (i % 2 ? 1.6 : hgt)]);
  const out = [T(pts, p.trim), R(15.5 - hw, y - 0.9, hw * 2, 1.1, p.trimDark)];
  if (gems) for (let i = 0; i <= n; i += 2) out.push(F(E(15.5 + hw - (i * hw) / n, y - hgt + 1.2, 0.6, 0.6, p.accent)));
  out.push(F(E(15.5, y - 0.4, 1.3, 1.3, p.accent)));
  return out;
}

// A feather from (x, y) curving up and back; sw bends its tip.
function feather(x, y, len, c, sw, vane = WHITE) {
  const sp = cone(x, y, 2.6, len, 70 + sw * 8, 0.4, 6);
  return [coneShape(sp, c), F(coneBand(sp, 0.1, 0.95, vane, -0.8))];
}

// Hat shape per tier: cone width, length, curl, brim half width and lift.
const HATS = [
  { w: 21, h: 10, curl: 120 }, { w: 14, h: 12, curl: 60, brim: 11.5, lift: 0 },
  { w: 14, h: 14, curl: 70, brim: 13.5, lift: 0.5 }, { w: 14, h: 16, curl: 95, brim: 14, lift: 0.8 }, { w: 15, h: 17, curl: 110, brim: 14.5, lift: 1 },
  { w: 15, h: 22, curl: 150, brim: 15.5, lift: 1.5 }, { w: 15, h: 22, curl: 115, brim: 15.5, lift: 1.2 }, { w: 16, h: 22, curl: 80, brim: 16, lift: 2 }, { w: 15, h: 24, curl: 135, brim: 16, lift: 1.6 },
  { w: 16, h: 24, curl: 45, brim: 17, lift: 2 }, { w: 16, h: 25, curl: 70, brim: 17, lift: 2 }, { w: 17, h: 27, curl: 210, brim: 17, lift: 2.5 }, { w: 16, h: 25, curl: 55, brim: 17.5, lift: 2.4 },
  { w: 15, h: 27, curl: 14, brim: 17, lift: 3 }, { w: 18, h: 27, curl: 35, brim: 18, lift: 3 }, { w: 16, h: 25, curl: 25, brim: 17, lift: 2.6 }, { w: 16, h: 27, curl: 85, brim: 18, lift: 3 },
  { w: 18, h: 28, curl: 50, brim: 18.5, lift: 3.4 }, { w: 17, h: 28, curl: 30, brim: 18.5, lift: 3.6 }, { w: 18, h: 28, curl: 40, brim: 19, lift: 4 },
];
const BRIM_Y = 7.4;
// Floating ornaments stay inside the sprite's headroom (its top edge is y -22).
const sky = (y, r) => Math.max(y, -21.4 + r);
const hatSpine = (t, m) => {
  const H = HATS[t];
  return cone(15.5, t ? BRIM_Y + 0.4 : 8.6, H.w, H.h, H.curl + m.hair * (3 + H.h * 0.25));
};

function hat(t, p, m) {
  const H = HATS[t];
  const s = stage(t);
  const sp = hatSpine(t, m);
  const tip = sp[sp.length - 1];
  const out = [];
  if (H.brim) out.push(brim(H.brim - 0.4, 2.6, H.lift, BRIM_Y + 0.9, p.deep), brim(H.brim, 2.5, H.lift, BRIM_Y, p.main));
  // Grand hats wear a trim edge on the brim.
  if (s >= 2) out.splice(1, 0, brim(H.brim + 0.6, 2.9, H.lift + 0.2, BRIM_Y + 0.2, t >= 7 ? p.trim : p.dark));
  out.push(coneShape(sp, p.main));
  const dangle = (x, y, len, c, r = 1.4) => [limb(x, y, x - m.sway * 0.4, y + len, 0.35, 0.35, p.trimDark), star(x - m.sway * 0.4, y + len + r * 0.6, r, c)];
  switch (t) {
    case 0: // Apprentice: a floppy cap with a rolled cuff and a pompom.
      out.push(E(15.5, 8.8, 11.2, 2.4, p.light), E(tip.x - 0.6, tip.y + 0.6, 2, 2, WHITE));
      break;
    case 1: // Initiate: a small pointed hat with a band and a star pin.
      out.push(coneBand(sp, 0.02, 0.16, p.dark), star(19, 6.1, 1.5, p.trim));
      break;
    case 2: // Scholar: band and a square buckle.
      out.push(coneBand(sp, 0.02, 0.18, p.deep), R(14, 4.6, 3.2, 3, p.trim), R(14.8, 5.4, 1.6, 1.4, p.deep));
      break;
    case 3: // Mystic: a starry band, a moon and stars on the cone.
      out.push(coneBand(sp, 0.02, 0.16, p.second), crescent(...onCone(sp, 0.45, 0.1), 2, p.trim, 200), star(...onCone(sp, 0.25, -0.45), 1.2, p.trim), sparkle(...onCone(sp, 0.66, 0.2), 1.2, WHITE), F(E(15.5, 6.2, 0.9, 0.9, p.accent)));
      break;
    case 4: // Arcanist: gemmed band and a star charm hanging from the tip.
      out.push(coneBand(sp, 0.02, 0.18, p.second), coneBand(sp, 0.2, 0.25, p.trim, 0.2), E(15.5, 5.6, 1.7, 1.7, p.trim), F(E(15.5, 5.6, 1.1, 1.1, p.accent)), star(...onCone(sp, 0.5, 0), 1.2, p.trim), ...dangle(tip.x, tip.y, 2.4, p.trim));
      break;
    case 5: // Sorcerer: double band, a drooping tip with a bell charm, runes.
      out.push(coneBand(sp, 0.02, 0.14, p.deep), coneBand(sp, 0.17, 0.22, p.trim, 0.2), F(E(15.5, 5.2, 1.4, 1.4, p.accent)), star(...onCone(sp, 0.42, -0.2), 1.4, p.trim), sparkle(...onCone(sp, 0.62, 0.3), 1.3, WHITE),
        ...dangle(tip.x, tip.y, 2.8, p.trim, 1.7), F(E(tip.x - m.sway * 0.4, tip.y + 4, 0.6, 0.6, p.accent)));
      break;
    case 6: // Enchanter: a big bow with swinging tails and hearts of light.
      out.push(coneBand(sp, 0.02, 0.15, p.second), T([[19, 5.4], [24, 2.6], [24.6, 7.4]], p.accent), T([[19, 5.4], [15.6, 2.4], [15.2, 7.2]], p.accent),
        T([[19.4, 6], [23 - m.sway * 0.6, 12.4], [21.4 - m.sway * 0.6, 12], [18.8, 6.4]], p.accent), E(19.2, 5.4, 1.3, 1.3, p.trim),
        sparkle(...onCone(sp, 0.4, 0), 1.6, WHITE), sparkle(...onCone(sp, 0.65, -0.3), 1.1, p.light), F(E(tip.x, tip.y, 1, 1, p.accent)));
      break;
    case 7: // Magister: wide rune band, a big gem buckle, and a tip star.
      out.push(coneBand(sp, 0.02, 0.2, p.deep), ...ring(4, (i) => F(R(9.4 + i * 3.6 + (i > 1 ? 2 : 0), 4.4, 1, 1.2, p.trim))), T([[15.5, 1.8], [18, 4.6], [15.5, 7.4], [13, 4.6]], p.trim), F(E(15.5, 4.6, 1.3, 1.6, p.accent)),
        coneBand(sp, 0.36, 0.4, p.trim, 0.2), star(tip.x, tip.y, 2, p.trim));
      break;
    case 8: // Sage: a long feather in the band and a leafy moon pin.
      out.push(coneBand(sp, 0.02, 0.16, p.second), ...feather(21.2, 6.6, 13, p.light, m.hair), crescent(13.4, 4.4, 2.2, p.trim, 30), F(E(tip.x, tip.y, 1.1, 1.1, p.accent)), coneBand(sp, 0.5, 0.54, p.trim, 0.2));
      break;
    case 9: // Archon: a gold crown on the brim and a floating orb.
      out.push(coneBand(sp, 0.2, 0.25, p.trim, 0.2), ...crown(BRIM_Y + 0.2, 8.6, 4.8, 4, p), E(tip.x, sky(tip.y - 2.4, 1.6), 1.6, 1.6, p.accent), F(E(tip.x - 0.5, sky(tip.y - 2.4, 1.6) - 0.5, 0.5, 0.5, WHITE)));
      break;
    case 10: // Astral: star field and a big floating star.
      out.push(coneBand(sp, 0.02, 0.13, p.deep), ...crown(BRIM_Y + 0.2, 8.4, 3.2, 6, p, false),
        ...[[0.3, -0.5], [0.42, 0.4], [0.58, -0.2], [0.72, 0.3], [0.22, 0.55]].map(([u, k], i) => (i % 2 ? F(E(...onCone(sp, u, k), 0.5, 0.5, WHITE)) : sparkle(...onCone(sp, u, k), 1.3, i ? WHITE : p.accent))),
        star(tip.x, sky(tip.y - 3, 2.6), 2.6, p.trim), F(star(tip.x, sky(tip.y - 3, 2.6), 1.2, WHITE)));
      break;
    case 11: { // Starweaver: a curling tip strung with stars, woven bands.
      out.push(coneBand(sp, 0.02, 0.12, p.second), coneBand(sp, 0.16, 0.2, p.trim, 0.2), coneBand(sp, 0.3, 0.33, p.trim, 0.2), ...crown(BRIM_Y + 0.2, 8.6, 3.4, 4, p));
      for (const [x, y, len] of [[4, 8.6, 3.4], [27, 8.6, 3]]) out.push(...dangle(x, y, len, p.trim, 1.3));
      out.push(star(tip.x, tip.y, 1.8, p.accent), sparkle(...onCone(sp, 0.48, 0), 1.4, WHITE));
      break;
    }
    case 12: // Moonsage: a great crescent floats above, a moon emblem on the cone.
      out.push(coneBand(sp, 0.02, 0.13, p.second), ...crown(BRIM_Y + 0.2, 8.6, 4.2, 4, p), crescent(...onCone(sp, 0.4, 0), 2.4, p.light, 200),
        crescent(tip.x + 1, Math.max(-18, tip.y - 3.6), 3.4, p.trim, 230), F(E(tip.x, tip.y, 0.9, 0.9, p.accent)), sparkle(tip.x - 3.6, tip.y - 1, 1.2, WHITE));
      break;
    case 13: // Sunspire: a straight spire before a rayed sun (in hatBack), a sun gem.
      out.push(coneBand(sp, 0.02, 0.12, p.deep), coneBand(sp, 0.36, 0.4, p.trim, 0.2), coneBand(sp, 0.62, 0.65, p.trim, 0.2), ...crown(BRIM_Y + 0.2, 8.2, 4.6, 4, p),
        star(...onCone(sp, 0.24, 0), 2.2, p.trim, 8, 0.6), F(E(...onCone(sp, 0.24, 0), 1, 1, p.accent)), E(tip.x, tip.y - 1, 1.4, 1.4, p.trim));
      break;
    case 14: // Highmage: a layered hat with a jeweled crown and two orbiting gems.
      out.push(coneBand(sp, 0.02, 0.4, p.second, -1.6), coneBand(sp, 0.38, 0.43, p.trim, 0.2), ...crown(BRIM_Y + 0.2, 9.6, 5.4, 6, p),
        T([[15.5, -1.6], [17.6, 1], [15.5, 3.6], [13.4, 1]], p.accent), F(E(15, 0.4, 0.5, 0.6, WHITE)),
        T([[tip.x - 4, tip.y + 2], [tip.x - 3, tip.y + 0.4], [tip.x - 2, tip.y + 2], [tip.x - 3, tip.y + 3.6]], p.accent),
        T([[tip.x + 3, tip.y - 1], [tip.x + 3.9, tip.y - 2.4], [tip.x + 4.8, tip.y - 1], [tip.x + 3.9, tip.y + 0.4]], p.accent), star(tip.x, tip.y, 1.6, p.trim));
      break;
    case 15: // Seraphic: white wings (in hatBack), feathers, and a halo above.
      out.push(coneBand(sp, 0.02, 0.14, p.trim), ...crown(BRIM_Y + 0.2, 8.4, 3.6, 4, p), ...feather(10.6, 6, 8, WHITE, m.hair, '#eef2ff'),
        arc(tip.x, sky(tip.y - 3, 1.4), 4, 1.4, 0.9, 0, 180, p.trim), F(E(tip.x, tip.y, 1, 1, p.accent)), sparkle(...onCone(sp, 0.45, 0), 1.5, WHITE));
      break;
    case 16: // Ethereal: two rings orbit the cone (their backs in hatBack), floating motes.
      out.push(coneBand(sp, 0.02, 0.13, p.light), ...crown(BRIM_Y + 0.2, 8.6, 3.8, 4, p),
        arc(...onCone(sp, 0.32, 0), 9, 2, 0.9, -10, 190, p.accent), arc(...onCone(sp, 0.6, 0), 6.4, 1.6, 0.8, -10, 190, p.light),
        sparkle(tip.x + 2.6, tip.y - 2, 1.2, WHITE), sparkle(tip.x - 3, tip.y + 1.6, 1, p.accent), F(E(tip.x, tip.y, 1, 1, WHITE)));
      break;
    case 17: // Cosmic: a planet ring around the cone, galaxy dots, a crown.
      out.push(coneBand(sp, 0.02, 0.12, p.deep), ...crown(BRIM_Y + 0.2, 9.2, 4.8, 6, p),
        ...[[0.25, 0.5], [0.33, -0.4], [0.5, 0.3], [0.63, -0.2], [0.78, 0.2]].map(([u, k], i) => (i % 2 ? F(E(...onCone(sp, u, k), 0.6, 0.6, i > 2 ? p.accent : WHITE)) : sparkle(...onCone(sp, u, k), 1.4, WHITE))),
        arc(...onCone(sp, 0.46, 0), 10, 2.4, 1.1, -12, 192, p.trim), E(tip.x, sky(tip.y - 2.4, 2), 2, 2, p.accent), arc(tip.x, sky(tip.y - 2.4, 2), 3.4, 1, 0.6, -15, 195, WHITE));
      break;
    case 18: // Eclipse: a dark crown, the tip piercing a black sun (in hatBack).
      out.push(coneBand(sp, 0.02, 0.14, p.deep), coneBand(sp, 0.42, 0.46, p.trim, 0.2), ...crown(BRIM_Y + 0.2, 9, 5.2, 4, { ...p, accent: p.deep }),
        crescent(...onCone(sp, 0.26, 0), 2.6, p.accent, 0));
      break;
    default: // Eternity: a tall crown, wings, an endless ring of stars, and a star crest.
      out.push(coneBand(sp, 0.02, 0.12, p.light), coneBand(sp, 0.34, 0.38, p.trim, 0.2), ...crown(BRIM_Y + 0.2, 9.4, 6.4, 6, p), ...feather(23.4, 5.4, 9, WHITE, m.hair, p.light),
        arc(...onCone(sp, 0.56, 0), 7.6, 1.8, 0.8, -10, 190, p.accent),
        ...ring(3, (i) => sparkle(...onCone(sp, 0.66 + i * 0.1, i % 2 ? 0.5 : -0.5), 1, WHITE)), star(tip.x, sky(tip.y - 1, 2.8), 2.8, p.trim), F(star(tip.x, sky(tip.y - 1, 2.8), 1.3, p.accent)));
  }
  return out;
}

// Behind the head: halos, suns, wings, and the backs of orbiting rings.
function hatBack(t, p, m) {
  const sp = hatSpine(t, m);
  const tip = sp[sp.length - 1];
  const wing = (dx) => [T([[21, 4], [26 + dx, -4], [31 + dx, -6], [30 + dx, -2], [33 + dx, -1.4], [30 + dx, 2], [32 + dx, 3.4], [27 + dx, 5.4], [22, 8]], WHITE), F(T([[23, 4.6], [29 + dx, -2.4], [27 + dx, 2.6]], '#eef2ff'))];
  switch (t) {
    case 13: return [star(tip.x, tip.y + 9, 10, p.trim, 12, 0.72), E(tip.x, tip.y + 9, 7, 7, p.accent), F(E(tip.x, tip.y + 9, 5, 5, mix(p.accent, WHITE, 0.6)))];
    case 15: {
      const up = m.flap ? -1.6 : 0;
      const w = wing(m.hair * 0.4).map((sh) => ({ ...sh, y: up }));
      return [...w, ...mirrorX(w)];
    }
    case 16: return [arc(...onCone(sp, 0.32, 0), 9, 2, 0.9, 180, 360, p.accent), arc(...onCone(sp, 0.6, 0), 6.4, 1.6, 0.8, 180, 360, p.light)];
    case 17: return [arc(...onCone(sp, 0.46, 0), 10, 2.4, 1.1, 180, 360, p.trim)];
    case 18: {
      const y = sky(tip.y + 3, 6.6);
      return [star(tip.x, y, 6.6, p.accent, 10, 0.62), E(tip.x, y, 4.6, 4.6, mix(p.accent, WHITE, 0.5)), E(tip.x, y, 4, 4, '#2a2140'), crescent(tip.x, y, 4.1, p.accent, 160)];
    }
    case 19: {
      const w = wing(1).map((sh) => ({ ...sh, y: 3 + (m.flap ? -1.6 : 0) }));
      const y = sky(tip.y + 2, 6.6);
      return [arc(...onCone(sp, 0.56, 0), 7.6, 1.8, 0.8, 180, 360, p.accent), E(tip.x, y, 6.6, 6.6, mix(p.accent, WHITE, 0.4)), E(tip.x, y, 5.2, 5.2, p.trim), E(tip.x, y, 4.2, 4.2, mix(p.accent, WHITE, 0.7)), ...w, ...mirrorX(w)];
    }
    default: return [];
  }
}

// ---------- Robes ----------

// The robe follows the figure to the waist, then flares to `len`, the hem swinging with sw.
function robe(len, flare, sw) {
  const { front, back } = FIGURE;
  return [...front.slice(0, -1), [21.8, 37], [22.4 + flare + sw, len], [15.5 + sw, len + 0.8], [8.6 - flare + sw, len], [9.4, 37], ...back.slice(1)];
}
const ROBES = [[42, 0.6], [43, 0.8], [43.5, 1], [44, 1.2], [44.5, 1.4], [45, 1.6], [45, 1.8], [45.5, 1.8], [45.5, 2], [46, 2.2], [46, 2.2], [46, 2.4], [46, 2.4], [46.5, 2.6], [46.5, 2.8], [46.5, 2.8], [46.5, 3], [47, 3.2], [47, 3.2], [47, 3.4]];
// A wedge down the front of the robe, from the neck to the hem.
const panel = (len, top, bottom, sw, c) => T([[MID - top, 26.4], [MID + top, 26.4], [MID + bottom + sw, len + 0.4], [MID - bottom + sw, len + 0.4]], c);

function top(t, p, m) {
  const s = stage(t);
  const sw = m.sway * 0.4;
  const [len, flare] = ROBES[t];
  const body = robe(len, flare, sw);
  const out = [T(body, p.main)];
  const hem = (h, c) => band(body, len - h, len + 0.2, c);
  const dots = (y, c, n = 4) => ring(n, (i) => F(E(lerp(11.6, 19.6, i / (n - 1)) + sw, y, 0.7, 0.55, c)));
  if (s === 0) {
    out.push(T([[MID - 3, 26.2], [MID + 3, 26.2], [MID, 30]], p.light), band(body, 33.6, 35.2, ROPE), E(18.6, 34.4, 1, 0.9, ROPE), limb(18.6, 35, 19.4 + sw, 39.6, 0.8, 0.8, ROPE));
    if (t) out.push(F(R(MID - 0.5, 30, 1, 3.6, p.dark)), hem(1.4, p.light), F(E(MID, 31, 0.6, 0.6, p.trim)));
    return out;
  }
  // From the Scholar on: a front panel in the under-cloth, trimmed edges, a sash.
  out.push(panel(len, s >= 2 ? 2.2 : 1.6, s >= 2 ? 4.6 : 3, sw, p.second));
  if (s >= 2) out.push(F(limb(MID - 2.2, 26.4, MID - 4.6 + sw, len, 0.9, 0.9, p.trim)), F(limb(MID + 2.2, 26.4, MID + 4.6 + sw, len, 0.9, 0.9, p.trim)));
  out.push(hem(s >= 2 ? 2 : 1.4, p.trim));
  if (s === 2) out.push(...dots(len - 1, p.accent));
  // High stand-up collar.
  out.push(T([[MID - 4.4, 25.6], [MID + 4.4, 25.6], [MID + 3.6, 27.6], [MID, 29.6], [MID - 3.6, 27.6]], s >= 3 ? p.trim : p.light), T([[MID - 2.4, 25.8], [MID + 2.4, 25.8], [MID, 28.2]], p.secondDark));
  if (s >= 3) {
    // A mantle over the shoulders, edged in trim.
    out.push(T([[9.6, 26.4], [21.6, 26.4], [22.2, 29], [MID + 3.6, 30.6], [MID, 31.4], [MID - 3.6, 30.6], [9, 29]], p.light), band([[9, 29], [22.2, 29], [22.2, 30.2], [9, 30.2]], 29, 30.2, p.trim));
  }
  // Sash with tails that swing.
  const sash = s >= 2 ? p.accent : p.dark;
  out.push(band(body, 33.4, 35.4, sash), E(17.6, 34.4, 1.3, 1.2, p.trim));
  if (s < 3) out.push(limb(18, 35, 19 + sw * 1.5, 40.6, 1.6, 1.1, sash), limb(17, 35, 17.2 + sw * 1.5, 39.6, 1.4, 1, sash));
  switch (t) {
    case 2: out.push(F(E(MID, 30.4, 0.7, 0.7, p.trim))); break;
    case 3: out.push(star(MID, 31, 1.8, p.trim), F(E(12, 41, 0.6, 0.6, WHITE)), F(E(19.4 + sw, 42, 0.6, 0.6, WHITE))); break;
    case 4: out.push(E(MID, 29.6, 1.6, 1.6, p.trim), F(E(MID, 29.6, 1, 1, p.accent)), star(MID + sw, 39.6, 1.5, p.trim)); break;
    case 5: out.push(star(MID, 30.8, 1.8, p.trim), F(R(MID - 2.4 + sw, 38.6, 4.8, 0.7, p.trim))); break;
    case 6: out.push(...[30.6, 39].map((y, i) => F(T([[MID + sw * i, y - 1.6], [MID + 1.2 + sw * i, y], [MID + sw * i, y + 1.6], [MID - 1.2 + sw * i, y]], p.accent)))); break;
    case 7: out.push(E(MID, 30.8, 2.2, 2.2, p.trim), star(MID, 30.8, 1.6, p.deep), F(E(MID, 30.8, 0.6, 0.6, p.accent)), F(R(MID - 2.6 + sw, 39.4, 5.2, 0.8, p.trim))); break;
    case 8: out.push(limb(MID - 2.8, 26.4, MID - 2.2 + sw, 41, 1.6, 1.6, p.light), limb(MID + 2.8, 26.4, MID + 2.2 + sw, 41, 1.6, 1.6, p.light), star(MID - 2.2 + sw, 41.4, 1.2, p.trim), star(MID + 2.2 + sw, 41.4, 1.2, p.trim)); break;
    default: break;
  }
  if (s >= 3) {
    // Vestments: a big brooch, a double hem, and an emblem on the skirt panel.
    out.push(E(MID, 30.4, 1.9, 1.9, p.trim), F(E(MID, 30.4, 1.2, 1.2, p.accent)), F(E(MID - 0.4, 30, 0.4, 0.4, WHITE)));
    const ey = len - 6;
    const emblem = {
      9: () => [star(MID + sw, ey, 2, p.trim)],
      10: () => [sparkle(MID + sw, ey, 2.2, WHITE), sparkle(MID - 2.6 + sw, ey - 3, 1.2, p.trim), F(E(MID + 2.4 + sw, ey - 4, 0.5, 0.5, WHITE))],
      11: () => [F(limb(MID - 3.4 + sw, ey - 3, MID + 3.4 + sw, ey + 1, 0.8, 0.8, p.trim)), F(limb(MID - 3.4 + sw, ey + 1, MID + 3.4 + sw, ey - 3, 0.8, 0.8, p.trim)), star(MID + sw, ey - 1, 1.4, p.accent)],
      12: () => [crescent(MID + sw, ey, 2.2, p.trim, 300), F(E(MID + 1.8 + sw, ey - 2.6, 0.5, 0.5, WHITE))],
      13: () => [star(MID + sw, ey, 2.4, p.trim, 8, 0.6), F(E(MID + sw, ey, 1, 1, p.accent))],
      14: () => [T([[MID + sw, ey - 2.6], [MID + 1.8 + sw, ey], [MID + sw, ey + 2.6], [MID - 1.8 + sw, ey]], p.trim), F(E(MID + sw, ey, 0.9, 1.2, p.accent))],
      15: () => [T([[MID + sw, ey - 1], [MID - 4 + sw, ey - 3], [MID - 2.6 + sw, ey + 0.6]], WHITE), T([[MID + sw, ey - 1], [MID + 4 + sw, ey - 3], [MID + 2.6 + sw, ey + 0.6]], WHITE), F(E(MID + sw, ey - 0.6, 0.8, 0.8, p.trim))],
      16: () => [arc(MID + sw, ey, 2.8, 1, 0.6, 0, 360, p.accent, 14), sparkle(MID + sw, ey - 2, 1.4, WHITE)],
      17: () => [sparkle(MID + sw, ey, 2.2, WHITE), F(E(MID - 3 + sw, ey - 3, 0.5, 0.5, p.accent)), F(E(MID + 3 + sw, ey - 2, 0.5, 0.5, WHITE))],
      18: () => [E(MID + sw, ey, 2, 2, '#2a2140'), crescent(MID + sw, ey, 2.1, p.accent, 160)],
      19: () => [star(MID + sw, ey, 2.4, p.trim), F(star(MID + sw, ey, 1.1, p.accent))],
    }[t];
    out.push(...emblem());
  }
  if (s >= 4) {
    // Regalia: scalloped petals at the hem and glowing runes.
    for (let i = 0; i < 5; i++) {
      const x = lerp(9.6, 21.6, i / 4) + sw;
      out.push(T([[x - 1.6, len - 1.4], [x + 1.6, len - 1.4], [x, len + 1.6]], i % 2 ? p.trim : p.light));
    }
  }
  return out;
}

const sleeve = (t, p) => p.main;
const longSleeves = () => true;

// Puffed shoulders that grow into layered, gemmed mantles and star-tipped epaulettes.
function shoulder(t, p, sd) {
  const s = stage(t);
  if (s === 0) return t ? [E(0, 0.6, 2.4, 2.2, p.main), F(R(-2.2, 1.6, 4.4, 0.8, p.light))] : [];
  const out = [E(0, 0.8, 2.6 + s * 0.2, 2.4 + s * 0.1, p.main), arc(0, 0.8, 2.6 + s * 0.2, 2.4 + s * 0.1, 0.9, 10, 170, s >= 2 ? p.trim : p.light, 6)];
  if (s >= 2) out.unshift(E(0, 2, 3.2 + s * 0.2, 2.4, p.second));
  if (s >= 3) out.push(F(E(0, 0.4, 0.8, 0.8, p.accent)));
  if (s >= 4) out.unshift(T([[-2.4, -0.6], [-sd * 5.4, -2.6], [-sd * 3.2, 0.4], [-sd * 4.6, 2.2], [2.4, 2.4]], p.trim));
  if (s >= 5) out.push(sparkle(0, 0.4, 1.6, WHITE));
  return out;
}

// ---------- Robe skirt (bottom) ----------

const legs = (t, p) => ({ top: p.deep, low: stage(t) ? p.deep : p.dark, pad: null });

// Hem points from the front edge (x1) to the back edge (x0) at y, bulging lower in the middle;
// `sc` scallops the hem, `train` drags the back edge longer.
function hemPts(x1, x0, y, sw, n, sc = 0, train = 0) {
  return ring(n + 1, (j) => {
    const u = j / n;
    return [lerp(x1, x0 - train, u) + sw * (0.6 + u * 0.6), y + Math.sin(Math.PI * u) * 1.2 + (j % 2 ? -sc : 0) + u * u * train * 0.6];
  });
}
const SKIRTS = [[46, 1], [47, 1.4], [49, 2], [50, 2.2], [51, 2.6], [51.5, 3], [52, 3.2], [52, 3.4], [52.5, 3.6], [52.5, 3.8], [53, 4], [53, 4.2], [53, 4.4], [53, 4.6], [53, 4.8], [53, 5], [53.5, 5], [53.5, 5.2], [53.5, 5.4], [53.5, 5.6]];
function skirt(t, p, m) {
  const s = stage(t);
  const sw = m.sway;
  const [len, fl] = SKIRTS[t];
  const train = s >= 3 ? 2 + s : 0;
  const shape = (y, extra, sc) => [[10, 34.2], [21.2, 34.2], [22 + fl * 0.4, 41], ...hemPts(22.4 + fl + extra, 8.6 - fl - extra, y, sw, 8, sc, train), [9 - fl * 0.4, 41]];
  const outer = shape(len, 0, s >= 4 ? 0.8 : 0);
  const out = [];
  if (s >= 1) out.push(T(shape(len + 1.2, 0.6, s >= 2 ? 0.7 : 0), p.second), band(shape(len + 1.2, 0.6, 0), len + 0.4, len + 1.4, p.trim));
  if (s >= 2) out.push(side(outer, MID - 1.4, -1, p.main), side(outer, MID + 1.6, 1, p.main), F(limb(MID - 1.4, 35, MID - 3 + sw, len, 0.8, 0.8, p.trim)), F(limb(MID + 1.6, 35, MID + 3.2 + sw * 0.6, len, 0.8, 0.8, p.trim)));
  else out.push(T(outer, p.main));
  out.push(band(outer, len - (s ? 1.6 : 1), len + 0.6, s ? p.dark : p.light), R(10, 34.2, 11.2, 1.6, s >= 2 ? p.trim : p.dark));
  // Embroidery: stars down the slit, then a whole star field.
  if (s >= 2) out.push(star(MID + sw * 0.6, 44, 1.2, p.trim), F(E(MID + sw * 0.8, 48, 0.6, 0.6, p.accent)));
  if (s >= 3) out.push(...[[11, 42], [19.6, 44.6], [12.4, 48.4], [21, 49.6]].map(([x, y], i) => (i % 2 ? F(E(x + sw * 0.8, y, 0.6, 0.6, WHITE)) : sparkle(x + sw * 0.8, y, 1.2, i ? p.accent : WHITE))));
  if (s >= 4) out.push(F(E(MID, 35, 0.9, 0.9, p.accent)), ...ring(4, (i) => F(R(lerp(10, 20, i / 3) + sw, len - 3, 1, 1, p.glow ?? p.accent))));
  if (s >= 5) out.push(sparkle(9.2 + sw, 46, 1.4, WHITE), sparkle(16.4 + sw, 51, 1.1, WHITE));
  return out;
}

// ---------- Slippers ----------

function shoe(t, p, k) {
  const s = stage(t);
  const c = k.tint(p.main);
  const out = [k.sole(c), k.poly([[-2.8, 2.2], [2.8, 2.2], [2.5, 3], [-2.5, 3]], k.tint(p.deep))];
  if (s >= 1) out.push(k.shaft(0.9, k.tint(s >= 2 ? p.trim : p.light), 3.1));
  // From the Archon on the toes curl up into points.
  if (s >= 3) out.splice(1, 0, k.poly([[1.8, 0.2], [4.6, 1.2], [5.8, -0.4], [5.4, -1.6], [6.4, -1.4], [5.6, 2.4], [2.4, 2.6]], c));
  if (s >= 1) out.push(k.dot(0.6, 0.4, s >= 3 ? 0.9 : 0.7, k.tint(s >= 2 ? p.accent : p.light)));
  if (s >= 3) out.push(k.dot(5.6, -1.6, 0.6, k.tint(p.trim)));
  if (s >= 4) out.push(k.poly([[-1.6, -1.2], [-4.6, -2.8], [-3.8, -0.8], [-4.4, 0.4], [-1.6, 0.6]], k.tint(s >= 5 ? WHITE : p.light)));
  return out;
}

// ---------- Gloves ----------

function hand(t, p, hx, hy, ex, ey) {
  const s = stage(t);
  const at = (u) => [lerp(hx, ex, u), lerp(hy, ey, u)];
  const silk = s >= 2 ? mix(p.light, WHITE, 0.55) : p.light;
  const out = [];
  if (s >= 1) {
    // A bell cuff flaring toward the hand, edged in trim.
    const w = 3.6 + s * 0.35;
    if (s >= 4) out.push(limb(...at(0.12), ...at(0.4), w + 1.2, 2.8, WHITE));
    out.push(limb(...at(0.2), ...at(0.62), w, 3, p.main), limb(...at(0.18), ...at(0.28), w + 0.2, w - 0.4, s >= 2 ? p.trim : p.dark));
    if (s >= 3) out.push(F(E(...at(0.45), 0.6, 0.6, p.accent)));
  }
  out.push(E(hx, hy, 1.9, 1.9, silk));
  if (s >= 3) out.push(F(E(hx + 0.3, hy - 0.2, 0.6, 0.6, p.accent)));
  return out;
}

// ---------- Capes ----------

// A cape hanging from the shoulders to y, `wd` wider than the body on each side; the hem swings.
function capeShape(y, wd, s, n = 8, sc = 0) {
  return [[8.6, 26], [22.4, 26], [24 + wd * 0.4 + s * 0.4, 38], ...hemPts(22.4 + wd, 8.6 - wd, y, s, n, sc), [7 - wd * 0.4 + s * 0.4, 38]];
}
const CAPES = [[42, 2], [43.5, 3], [47, 4.4], [48, 4.8], [49, 5.2], [50, 6], [50.5, 6.4], [51, 6.8], [51.5, 7.2], [52, 8], [52.5, 8.4], [53, 8.8], [53, 9.2], [53.5, 10], [53.5, 10.4], [53.5, 10.8], [54, 11.2], [54, 12], [54.5, 12.4], [54.5, 12.8]];

// A standing fan collar behind the head: pointed ribs around an upper half-ellipse.
function fan(rx, ry, n, p) {
  const pts = (k) => ring(n * 2 + 1, (i) => {
    const a = Math.PI * (1 + i / (n * 2));
    const rr = k * (i % 2 ? 0.84 : 1);
    return [15.5 + Math.cos(a) * rx * rr, 27 + Math.sin(a) * ry * rr];
  });
  return [T(pts(1.06), p.trim), T(pts(1), p.second), T(pts(0.8), p.dark), ...ring(n + 1, (i) => F(E(...pts(0.97)[i * 2], 0.6, 0.6, p.accent)))];
}

// A colour from hue (degrees), saturation and lightness (0..1).
function hex(h, s, l) {
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const c = l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(c * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// The wing ramp in the set's own hue, clean rather than greyed: shadows lean toward violet,
// lights toward the warm side of the hue (cyan for blues, rose for purples), three steps.
function wingRamp(p) {
  const [h] = hsl(p.main);
  const lit = h >= 170 && h < 270 ? h - 16 : h + 16;
  const shade = h >= 170 && h < 270 ? h + 14 : h - 14;
  return { deep: hex(shade, 0.42, 0.3), mid: hex(h, 0.5, 0.48), light: hex(lit, 0.62, 0.7) };
}

// Arcane wings of long feathers fanning out behind the shoulders; up is the beat.
function wings(p, up, sw) {
  const r = wingRamp(p);
  const w = [[-15, 3, 5.4], [-21, 12, 6], [-22, 22, 5.6], [-17, 32, 4.6]].flatMap(([x, y, wd], i) => {
    const tip = [x + sw * 0.3 * i, y + up * (1 - i * 0.3)];
    const dx = tip[0] - 12.5;
    const dy = tip[1] - 29;
    const len = Math.hypot(dx, dy);
    const at = (u, k) => [12.5 + dx * u - (dy / len) * k, 29 + dy * u + (dx / len) * k];
    // Back row deep, front row mid with a lit leading vane, and a glow streak down the quill.
    const feather = T([[12.5, 29], at(0.5, wd / 2), tip, at(0.62, -wd / 2)], i % 2 ? r.deep : r.mid);
    if (i % 2) return [feather];
    return [feather, T([[12.5, 29], at(0.5, wd / 2), tip, at(0.55, 0.2)], r.light), F(T([at(0.3, 0.2), at(0.55, 0.7), at(0.85, 0.1), at(0.6, -0.4)], p.glow ?? p.accent))];
  }).filter(Boolean);
  return [...w, ...mirrorX(w)];
}

function cape(t, p, m) {
  const s = stage(t);
  const sw = m.sway;
  const [y, wd] = CAPES[t];
  const out = [];
  if (s >= 5) out.push(...wings(p, m.flap ? -3 : 0, sw));
  else if (s >= 3) out.push(...fan(s >= 4 ? 25 : 21, s >= 4 ? 16 : 11, s >= 4 ? 5 : 4, p));
  if (s >= 1) out.push(T(capeShape(y + 1.4, wd + 0.6, sw, 8, s >= 2 ? 1 : 0), p.second));
  if (s >= 3) out.push(band(capeShape(y + 1.4, wd + 0.6, sw), y, y + 2.6, p.trim));
  const main = capeShape(y, wd, sw, s >= 2 ? 10 : 8, s >= 4 ? 1.2 : 0);
  out.push(T(main, p.main), band(main, y - (s ? 2 : 1.2), y + 1.2, s >= 1 ? p.trim : p.dark));
  if (s >= 2) out.push(band(main, y - 3.6, y - 2.6, p.dark));
  // Stars scattered across the cloth, more as the sets climb.
  const spots = [[6, 40], [24.4, 42], [9, 46.6], [22, 47.4], [4.4, 47], [26.6, 49], [14.6, 44]].slice(0, s === 1 ? 2 : s * 2);
  if (s && t > 2) spots.forEach(([x, yy], i) => out.push(i % 3 === 2 ? F(E(x + sw * 0.7, yy, 0.6, 0.6, WHITE)) : sparkle(x + sw * 0.7, yy, 1.3, i % 2 ? p.trim : WHITE)));
  if (s >= 5) out.push(star(15.5 + sw, y - 6, 2.2, p.trim), F(E(15.5 + sw, y - 6, 0.8, 0.8, p.accent)));
  return out;
}

// Over the top: ties, then a capelet over the shoulders and a gem clasp.
function capeFront(t, p) {
  const s = stage(t);
  if (s === 0) return [T([[10, 26], [12.6, 26], [13.6, 29.4], [11, 29]], p.main), T([[21, 26], [18.4, 26], [17.4, 29.4], [20, 29]], p.main), F(E(MID, 28.6, 1, 1, t ? p.trim : p.dark))];
  const out = [];
  if (s >= 2) {
    const low = s >= 3 ? 31.6 : 30.6;
    const shape = [[8.8, 25.8], [22.2, 25.8], [23, 29.4], [MID + 4.4, low - 0.6], [MID, low], [MID - 4.4, low - 0.6], [8.2, 29.4]];
    if (s >= 3) out.push(T(shape.map(([x, yy]) => [x, yy + 1.4]), p.second));
    out.push(T(shape, p.main), band(shape, 29.2, 30.4, p.trim));
    if (s >= 4) for (const x of [11, 20.2]) out.push(T([[x - 1.2, 29.6], [x + 1.2, 29.6], [x, 32.2]], p.trim));
  } else {
    out.push(T([[10, 26], [12.6, 26], [13.6, 29.4], [11, 29]], p.main), T([[21, 26], [18.4, 26], [17.4, 29.4], [20, 29]], p.main));
  }
  const cy = s >= 3 ? 29.4 : 28.8;
  out.push(E(MID, cy, 1.6 + s * 0.15, 1.6 + s * 0.15, p.trim), F(E(MID, cy, 0.9 + s * 0.1, 0.9 + s * 0.1, p.accent)));
  if (s >= 4) out.push(F(limb(11, 29, MID - 1.4, cy + 0.6, 0.5, 0.5, p.trim)), F(limb(20.2, 29, MID + 1.4, cy + 0.6, 0.5, 0.5, p.trim)), sparkle(MID, cy - 0.2, 1, WHITE));
  return out;
}

export default {
  hat, hatBack, hatTucks: () => false, hatHidesBangs: () => false,
  top, sleeve, longSleeves, shoulder, legs, skirt, shoe, hand, cape, capeFront,
};
