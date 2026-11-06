// The Cleric's vestments (docs/design/mage-line.md): she wears the mage line's robes, drawn in white
// and gold (render/hero.js repaints her plain mage pieces), and in place of the pointed hat a soft
// white veil over her hair, a gold circlet with a sun gem, and a glowing halo floating above her
// head. The veil and circlet grow grander up the tiers: lace at the edge from Scholar, a taller sun
// crest from Archon, a second halo ring and rays from Sunspire. Everything else is the mage module.
// The veil's hem and the halo follow m.hair; nothing comes down over her face.

import { E, T, F, mix } from '../pixel.js';
import mage from './mage.js';

const WHITE = '#ffffff';
const GOLD = '#ffd36a';
const GOLD_DK = '#c8902e';
const stage = (t) => (t < 2 ? 0 : t < 5 ? 1 : t < 9 ? 2 : t < 13 ? 3 : t < 17 ? 4 : 5);
const ring = (n, f) => Array.from({ length: n }, (_, i) => f(i));

// The halo: a gold ring seen at a slant above her head, with a white glow under it; bobs gently.
function halo(t, m, back) {
  const s = stage(t);
  const y = -3.4 - (m.hair ?? 0) * 0.3;
  const rx = 7.4 + s * 0.4;
  const ry = 1.9;
  // The far half of the ring goes behind her head, the near half in front.
  const arc = (a0, a1, c, th) => {
    const pts = [];
    for (let i = 0; i <= 10; i++) { const a = a0 + ((a1 - a0) * i) / 10; pts.push([15.5 + Math.cos(a) * rx, y + Math.sin(a) * ry]); }
    for (let i = 10; i >= 0; i--) { const a = a0 + ((a1 - a0) * i) / 10; pts.push([15.5 + Math.cos(a) * (rx - th), y + Math.sin(a) * (ry - th * 0.4)]); }
    return T(pts, c);
  };
  const out = [];
  if (back) {
    out.push(arc(Math.PI, Math.PI * 2, GOLD_DK, 1.1));
    if (s >= 4) for (let i = 0; i < 8; i++) { const a = Math.PI + (i / 7) * Math.PI; out.push(F(T([[15.5 + Math.cos(a) * (rx + 0.6), y + Math.sin(a) * (ry + 0.4)], [15.5 + Math.cos(a) * (rx + 3), y + Math.sin(a) * (ry + 2)], [15.5 + Math.cos(a + 0.12) * (rx + 0.6), y + Math.sin(a + 0.12) * (ry + 0.4)]], mix(GOLD, WHITE, 0.4)))); }
    return out;
  }
  out.push(arc(0, Math.PI, GOLD, 1.1), F(arc(0.2, Math.PI - 0.2, mix(GOLD, WHITE, 0.6), 0.4)));
  if (s >= 4) out.push(arc(0.1, Math.PI - 0.1, mix(GOLD, WHITE, 0.3), 0.5));
  return out;
}

// The veil's front: a soft cap of white cloth over the crown of her head, above her bangs, with a
// gold circlet across it and a sun gem in the middle.
function hat(t, p, m) {
  const s = stage(t);
  const sw = (m.hair ?? 0) * 0.3;
  const cloth = '#fbf6ec';
  const shade = '#e4d8c4';
  const out = [];
  out.push(T([[4.6, 9.6], [5.6, 5], [8.6, 1.8], [12.4, 0.4], [15.5, 0], [18.6, 0.4], [22.4, 1.8], [25.4, 5], [26.4, 9.6], [23.6, 7.4], [15.5, 6.2], [7.4, 7.4]], cloth));
  out.push(F(T([[4.6, 9.6], [5.6, 5], [7.4, 3.4], [7.2, 7.4]], shade)), F(T([[26.4, 9.6], [25.4, 5], [23.6, 3.4], [23.8, 7.4]], shade)));
  if (s >= 1) out.push(...ring(7, (i) => F(E(6.4 + i * 3.1, 7.6 - Math.sin((i / 6) * Math.PI) * 1.2, 0.8, 0.55, WHITE))));
  // The circlet and its sun gem (a taller sun crest from the Archon on).
  out.push(T([[6.4, 6.4], [24.6, 6.4], [24, 7.6], [7, 7.6]], GOLD), F(T([[6.4, 7.1], [24.6, 7.1], [24, 7.6], [7, 7.6]], GOLD_DK)));
  const crest = s >= 3 ? 3.4 : 2.2;
  out.push(T(ring(16, (i) => { const a = (i / 16) * Math.PI * 2; const r = i % 2 ? crest * 0.6 : crest; return [15.5 + Math.cos(a) * r, 5.6 + Math.sin(a) * r]; }), GOLD));
  out.push(E(15.5, 5.6, crest * 0.5, crest * 0.5, '#8fd8ff'), F(E(15.1, 5.2, 0.4, 0.35, WHITE)));
  out.push(...halo(t, m, false));
  void sw;
  return out;
}

// Behind her head: the veil falling down her back to her shoulders, swinging, and the far half of
// the halo.
function hatBack(t, p, m) {
  const s = stage(t);
  const sw = (m.sway ?? 0) * 0.6 + (m.hair ?? 0) * 0.4;
  const cloth = '#f2eadb';
  const out = [...halo(t, m, true)];
  // (Narrower than her hair, so it peeks out round it at the sides and below, never a sheet.)
  const len = 26 + s * 0.8;
  out.push(T([[5.4, 6], [25.6, 6], [26.4 + sw, len], [22 + sw, len + 1.2], [15.5 + sw, len + 0.6], [9 + sw, len + 1.2], [4.6 + sw, len]], cloth));
  out.push(F(T([[5.4, 6], [9, 6], [8.4 + sw, len + 1], [4.6 + sw, len]], '#e4d8c4')));
  if (s >= 1) out.push(...ring(5, (i) => F(E(5.6 + sw + i * 5, len + 0.8, 1, 0.6, WHITE))));
  return out;
}

export default { ...mage, hat, hatBack, hatTucks: () => false, hatHidesBangs: () => false };
