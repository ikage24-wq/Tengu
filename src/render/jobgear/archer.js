// Archer gear: elven leaf and silk. Leaf-cut hoods and a feathered cap give way to silver
// circlets with leaf wings, then tall diadems of leaves, moons, suns and stars, and at the top
// a luminous Worldtree crown. Tunics are slim with layered leaf hems and sashes, bracers run up
// the forearm, boots are wrapped, and cloaks become leafy mantles and finally leaf-and-light wings.
//
// Tiers by stage (see JOB_SETS.archer for the names):
//   0-4   hoods and a feathered cap, leather vests, short leaf-cut cloaks
//   5-9   circlets with leaf wings, belted tunics with leaf hems, flowing mantles
//   10-14 tall circlets (branches, moon, sun, aurora, star), layered tunics, long mantles
//   15-19 diadems, raiments with three leaf layers, leaf-and-light wings

import { E, T, F, shade, mix } from '../pixel.js';
import { torsoPts, band, MID, limb, mirrorX } from '../figure.js';

const LEATHER = '#a8754e';
const BARK = '#7a5638';
const FEATHER = '#fffaf0';
const WHITE = '#ffffff';

// ---------- Small motifs ----------

const rad = (a) => (a * Math.PI) / 180;
// A point `len` along angle a (degrees clockwise from straight up) from (x, y).
const along = (x, y, len, a) => [x + Math.sin(rad(a)) * len, y - Math.cos(rad(a)) * len];

// A pointed leaf from its stem at (x, y), `len` long toward angle a, `w` wide at its widest.
function leaf(x, y, len, w, a, c) {
  const s = Math.sin(rad(a));
  const k = -Math.cos(rad(a));
  const at = (u, v) => [x + s * len * u - k * w * v, y + k * len * u + s * w * v];
  return T([at(0, 0), at(0.22, 0.4), at(0.5, 0.5), at(0.78, 0.3), at(1, 0), at(0.78, -0.3), at(0.5, -0.5), at(0.22, -0.4)], c);
}

// A feather: a long leaf with a notch cut into one vane.
function feather(x, y, len, w, a, c) {
  const s = Math.sin(rad(a));
  const k = -Math.cos(rad(a));
  const at = (u, v) => [x + s * len * u - k * w * v, y + k * len * u + s * w * v];
  return T([at(0, 0), at(0.2, 0.45), at(0.45, 0.5), at(0.52, 0.18), at(0.62, 0.5), at(0.85, 0.32), at(1, 0), at(0.8, -0.4), at(0.4, -0.5), at(0.15, -0.35)], c);
}

// A five-pointed star.
const star = (cx, cy, r, c) => T(Array.from({ length: 10 }, (_, i) => {
  const a = (i * Math.PI) / 5 - Math.PI / 2;
  const rr = i % 2 ? r * 0.45 : r;
  return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
}), c);

// A crescent moon, horns up.
function crescent(cx, cy, r, c) {
  const pts = [];
  for (let i = 0; i <= 8; i++) pts.push(along(cx, cy, r, 60 + i * 30));
  for (let i = 8; i >= 0; i--) pts.push(along(cx, cy - r * 0.4, r * 0.78, 64 + i * 29));
  return T(pts, c);
}

// A gem with a shine.
const gem = (x, y, r, c) => [F(E(x, y, r, r * 1.15, c)), F(E(x - r * 0.35, y - r * 0.4, r * 0.32, r * 0.32, WHITE))];

// A thick arc around (cx, cy) from angle a0 to a1 (degrees clockwise from up), th thick.
function arc(cx, cy, rx, ry, th, a0, a1, c, n = 10) {
  const out = [];
  const inner = [];
  for (let i = 0; i <= n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / n);
    out.push([cx + Math.sin(a) * rx, cy - Math.cos(a) * ry]);
    inner.push([cx + Math.sin(a) * (rx - th), cy - Math.cos(a) * (ry - th)]);
  }
  return T([...out, ...inner.reverse()], c);
}

// A fan of leaves (or feathers) from one root: angles a0..a1, each `len` long, tips nudged by sway.
function fan(x, y, n, len, w, a0, a1, colors, sway = 0, kind = leaf) {
  return Array.from({ length: n }, (_, i) => {
    const a = n === 1 ? a0 : a0 + ((a1 - a0) * i) / (n - 1);
    return kind(x, y, len * (1 - Math.abs(i - (n - 1) / 2) * 0.08), w, a + sway, colors[i % colors.length]);
  });
}

// Shapes on the left side of the head plus their mirror on the right.
const pair = (shapes) => [...shapes, ...mirrorX(shapes)];

// ---------- Hats ----------

// A hood that frames the face, its rim cut into leaf points over the brow.
function hood(t, p, m) {
  const h = m.hair * 0.6;
  const rim = [];
  for (let i = 0; i <= 8; i++) rim.push([23.4 - i * 1.98, i % 2 ? 11.2 : 8.6 + Math.abs(i - 4) * 0.25]);
  const out = [
    T([[3.4, 22.6], [2.6, 12], [3, 7.6], [5.2, 4], [10.4, 1.2], [15.5, 0.6], [20.6, 1.2], [25.8, 4], [28, 7.6], [28.4, 12], [27.6, 22.6], [24.8, 22.6], [24.4, 13], ...rim, [6.6, 13], [6.2, 22.6]], p.main),
    // A soft point flopping back off the crown.
    T([[6, 6.4], [10, 2], [4.4, 1.6 + h * 0.3], [-1.4 + h, 6 + Math.abs(h) * 0.3]], p.main),
    F(T([[8.8, 3.2], [5.6, 2.6], [1.8 + h * 0.8, 5.2]], p.light)),
  ];
  if (t >= 1) out.push(leaf(25.4, 8.4, 5, 3, 40 + h * 2, p.light), F(E(25.4, 8.6, 0.9, 0.9, p.accent)));
  // The ranger's hood: a trim edge along the leaf points and a feather pinned at the temple.
  if (t >= 3) {
    out.push(F(T([[3.4, 22.6], [6.2, 22.6], [6.6, 13], ...rim.reverse(), [24.4, 13], [24.8, 22.6], [27.6, 22.6], [27.6, 21.4], [25.8, 21.4], [25.6, 12.4], [7.2, 12.2], [5.2, 12.6], [5, 21.4], [3.4, 21.4]], p.dark)));
    out.push(feather(25, 9, 10, 2.8, 30 - h * 3, FEATHER), F(E(25, 9.2, 1.1, 1.1, p.trim)));
  }
  // The sylvan hood: long leaf ears sweep out from the sides.
  if (t >= 4) out.push(...pair([leaf(4.4, 13, 9, 3.6, -62 + h * 2, p.light), leaf(4.2, 15, 6.4, 2.6, -88 + h * 2, p.main)]));
  return out;
}

// A feathered cap: a peaked hunter's cap with a long feather sweeping back.
function cap(t, p, m) {
  const h = m.hair * 0.8;
  return [
    feather(8.6, 6, 15, 4, -38 + h * 3, FEATHER),
    F(leaf(...along(8.6, 6, 9.6, -38 + h * 3), 5.4, 3, -38 + h * 3, p.accent)),
    T([[4.6, 9.4], [6, 4.6], [11, 1.4], [18, 1], [24, 2.8], [30.6, 6.4], [27, 7.8], [26.6, 9.4]], p.main),
    T([[4.2, 8.4], [26.8, 7.6], [31, 5.4], [29.8, 8.6], [27, 10.6], [4.2, 10.6]], p.dark),
    leaf(8.4, 8.6, 4.4, 2.6, -50, p.light),
    F(E(8.6, 8.8, 0.9, 0.9, p.trim)),
  ];
}

// The band every circlet and diadem sits on: a thin metal arc across the brow.
// A little gem drop hangs from its middle onto the brow.
const brow = (p, th = 1.5) => [arc(15.5, 17.4, 11.2, 10, th, -80, 80, p.trim, 12), T([[14.6, 8.4], [16.4, 8.4], [15.5, 11]], p.trim), F(T([[15, 9], [16, 9], [15.5, 10.4]], p.accent))];

// The ornaments above the band, per tier.
function crown(t, p, m) {
  const h = m.hair * 0.7;
  const tr = p.trim;
  const g = p.accent;
  const out = [];
  // Leaf wings at the temples, stacked down the band like an elf's ear, mirrored onto both sides.
  const wings = (n, len, w, a0, a1, colors, kind = leaf) => pair(Array.from({ length: n }, (_, i) =>
    kind(5.2 - i * 0.3, 11 + i * 1.5, len * (1 - i * 0.16), w, a0 + ((a1 - a0) * i) / Math.max(1, n - 1) + h * 3, colors[i % colors.length])));
  switch (t) {
    case 5: // Thornweave: a woven vine with thorns, leaves and a rosebud.
      out.push(arc(15.5, 17.4, 11.2, 10, 1.6, -80, 80, p.deep, 12));
      for (const x of [8, 11.5, 19.5, 23]) out.push(T([[x - 0.7, 8.4], [x + 0.7, 8.4], [x + 0.2, 5.8]], p.deep));
      out.push(...wings(2, 6.9, 2.4, -28, -52, [p.main, p.light]), leaf(15.5, 7.4, 4, 3, -35, p.main), leaf(15.5, 7.4, 4, 3, 35, p.main), E(15.5, 7, 1.4, 1.4, g), F(E(15.2, 6.6, 0.5, 0.5, WHITE)));
      return out;
    case 6: // Silverleaf: a silver band, a leaf crest set with a gem, two-leaf wings.
      out.push(...wings(2, 9.2, 2.9, -26, -48, [p.main, p.light]), ...brow(p), leaf(15.5, 8.2, 6, 4, 0, tr), leaf(15.5, 8, 4, 2.4, 0, p.light), ...gem(15.5, 6.8, 1.1, g));
      return out;
    case 7: // Windrunner: long feathers swept back from the temples.
      out.push(...wings(3, 13.8, 2.9, -38, -62, [FEATHER, p.light, p.main], feather), ...brow(p), T([[15.5, 4.4], [16.8, 7], [15.5, 9], [14.2, 7]], tr), ...gem(15.5, 7, 1, g));
      return out;
    case 8: // Starweave: a star crest and three-leaf wings with star-dust.
      out.push(...wings(3, 10.3, 2.9, -18, -58, [p.main, p.light, p.main]), ...brow(p), star(15.5, 5.6, 3.4, tr), ...gem(15.5, 5.8, 1, g), ...pair([F(star(3, 3.4, 1, tr))]));
      return out;
    case 9: { // Dawnsong: a rising sun of little rays over the brow and feather wings.
      const sun = '#ffcf6b';
      out.push(...wings(3, 11.5, 2.7, -24, -56, [p.main, FEATHER, p.light], feather), ...fan(15.5, 8, 5, 5.4, 2, -60, 60, [tr]), E(15.5, 8, 3, 2.4, sun), ...brow(p), ...gem(15.5, 8.2, 1.1, g));
      return out;
    }
    case 10: // Elderwood: antler branches with leaf tips rise from the temples.
      out.push(...pair([
        limb(7, 9, 4.4, -1, 1.6, 1, BARK), limb(5.6, 3.4, 1.8, 0.2, 1, 0.7, BARK), limb(4.9, 1, 7.4, -3, 1, 0.6, BARK),
        leaf(4.4, -1, 5, 3, -20 + h * 2, p.main), leaf(1.8, 0.2, 4, 2.6, -70 + h * 2, p.light), leaf(7.4, -3, 4, 2.6, 25 + h * 2, p.main),
      ]), ...brow(p), leaf(15.5, 8, 5, 3.6, 0, p.main), ...gem(15.5, 7.4, 1.1, g));
      return out;
    case 11: // Moonshadow: a crescent moon above the brow, dark leaf wings and a star.
      out.push(...wings(3, 11.5, 2.9, -22, -58, [p.main, p.dark, p.light]), ...brow(p, 1.7), crescent(15.5, 5, 4.2, tr), F(star(15.5, 5, 1.4, g)), ...pair([F(E(4, 2, 0.6, 0.6, WHITE))]));
      return out;
    case 12: // Sunfeather: a halo fan of feathers around a sun disk.
      out.push(...fan(15.5, 8.4, 7, 11, 3.4, -66, 66, [p.main, p.light], 0, feather), ...wings(2, 10.3, 2.7, -38, -62, [p.light, FEATHER], feather), ...brow(p, 1.7), E(15.5, 7.4, 2.8, 2.8, '#ffd95a'), ...gem(15.5, 7.4, 1.4, g));
      return out;
    case 13: // Aurora: a tall crest of leaves shading from the cloth to the glow.
      out.push(...fan(15.5, 8.2, 5, 12, 3.6, -36, 36, [p.main, p.light, g, p.light, p.main]), ...wings(3, 13.8, 2.9, -24, -60, [p.main, g, p.light]), ...brow(p, 1.7), ...gem(15.5, 7.6, 1.3, g));
      return out;
    case 14: // Celestine: a tall star spire and doubled wings.
      out.push(...wings(4, 13.8, 3, -16, -66, [p.light, p.main]), ...wings(2, 8, 2.1, -28, -52, [tr]), ...brow(p, 1.8), T([[15.5, -2], [17.2, 5], [15.5, 8.6], [13.8, 5]], tr), star(15.5, 0, 2.6, g), ...gem(15.5, 6.2, 1.2, g));
      return out;
    case 15: // Wildheart: antlers twined with blossoms.
      out.push(...pair([
        limb(7, 8.6, 3.8, -2.6, 1.8, 1, tr), limb(5.5, 2.8, 0.6, 0.6, 1.1, 0.7, tr), limb(4.6, 0, 7.2, -5.4, 1, 0.6, tr),
        leaf(6.2, 7, 6, 3.4, -50 + h * 2, p.light), E(7.4, 7.6, 2.2, 2.2, p.main), F(E(7.4, 7.6, 0.9, 0.9, g)),
      ]), ...brow(p, 1.8), E(15.5, 6.6, 2.6, 2.6, p.main), E(15.5, 6.6, 1.4, 1.4, p.light), ...gem(15.5, 6.6, 0.8, g));
      return out;
    case 16: // Evergreen: a tiara of tall pointed leaves and big leaf wings.
      out.push(...wings(3, 10, 2.6, -10, -40, [p.main, p.light]), ...fan(15.5, 9, 7, 9, 3, -54, 54, [p.main, p.light], 0), ...brow(p, 1.8), leaf(15.5, 8, 12, 4, 0, p.main), leaf(15.5, 7, 8, 2.2, 0, p.light), ...gem(15.5, 7.4, 1.3, g));
      return out;
    case 17: // Starsinger: a crescent cradling a big star, star-tipped wings, a halo of motes.
      out.push(...wings(3, 10, 2.5, -8, -40, [p.light, p.main]), ...pair([star(-1, -0.4, 1.8, tr), F(E(3, -4, 0.7, 0.7, g))]), ...brow(p, 1.8),
        arc(15.5, 2.6, 5.4, 5.4, 2, -125, 125, tr), star(15.5, 1.8, 3.6, g), F(star(15.5, 1.8, 1.4, WHITE)), ...gem(15.5, 7.6, 1, g));
      return out;
    case 18: { // Lightbloom: a lotus of glowing petals around a bright heart.
      const petals = (r, n, len, w, colors) => fan(15.5, 8.6, n, len, w, -r, r, colors);
      out.push(...wings(3, 9.4, 2.6, -12, -42, [p.light, p.main]), ...petals(80, 5, 10, 5, [p.main]), ...petals(50, 4, 11, 5, [p.light]), leaf(15.5, 8.6, 12, 5.4, 0, p.main), leaf(15.5, 8, 7, 3, 0, WHITE), ...brow(p, 1.8), ...gem(15.5, 7.8, 1.6, g));
      return out;
    }
    default: { // Worldtree: a luminous crown of branches and leaves, wide leaf wings.
      const lit = mix(g, WHITE, 0.4);
      out.push(...wings(3, 11.5, 2.8, -6, -40, [p.main, lit, p.light]), ...pair([limb(9, 8.6, 6, -1, 1.6, 0.8, tr), leaf(6, -1, 7, 3.6, -14 + h, p.light), leaf(6.6, 2, 5, 3, -60 + h, lit)]),
        limb(15.5, 8, 15.5, -4, 2, 1, tr), ...fan(15.5, -2, 5, 8, 3.8, -70, 70, [p.main, lit, p.light]), leaf(15.5, -3, 9, 4.4, 0, lit), ...brow(p, 2), ...gem(15.5, 7, 1.7, g), F(E(15.5, -1, 1, 1, WHITE)));
      return out;
    }
  }
}

function hat(t, p, m = { sway: 0, hair: 0, flap: 0 }) {
  if (t === 2) return cap(t, p, m);
  if (t < 5) return hood(t, p, m);
  return crown(t, p, m);
}

function hatBack(t, p) {
  if (t < 5 && t !== 2) return [E(15.5, 14, 13.4, 12.6, p.dark), T([[6, 22], [25, 22], [27, 27], [4, 27]], p.dark)];
  // A soft glow ring behind the top diadems.
  if (t >= 17) return [arc(15.5, 6, 15, 12, 1.4, -70, 70, mix(p.accent, WHITE, 0.3), 12)];
  return [];
}

// ---------- Tops ----------

// The torso flared into a tunic, its hem cut into leaf points (tips swing a little with sway).
function tunicPts(hemY, n, sway, drop = 1.8, wide = 1) {
  const { front, back } = { front: torsoPts().slice(0, 6), back: torsoPts().slice(8) };
  const x0 = 8.8 - wide;
  const x1 = 22.2 + wide;
  const hem = [];
  for (let i = 0; i <= n * 2; i++) {
    const x = x1 - ((x1 - x0) * i) / (n * 2);
    hem.push([x + (i % 2 ? sway * 0.35 : 0), hemY + (i % 2 ? drop : 0)]);
  }
  return [...front, [21.6, 36], ...hem, [9.4, 36], ...back];
}

function top(t, p, m = { sway: 0, hair: 0, flap: 0 }) {
  const torso = torsoPts();
  const s = m.sway;
  const tr = p.trim;
  const out = [];
  const buckle = F(T([[MID - 1.3, 34.5], [MID, 33.3], [MID + 1.3, 34.5], [MID, 35.7]], tr));
  if (t < 5) {
    // Vests: a leaf-hemmed vest open over a shirt, belted in leather.
    out.push(T(torso, p.second));
    if (t >= 2) out.push(T(tunicPts(39.4 + t * 0.4, 4, s, 2.6, 0.4), p.dark));
    out.push(T(tunicPts(37.6 + t * 0.4, 3, s, 2.6, 0), p.main), T([[MID - 2.2, 26.2], [MID + 2.2, 26.2], [MID + 1, 34], [MID - 1, 34]], p.second));
    out.push(band(torso, 33.6, 35.6, LEATHER), buckle);
    if (t >= 1) out.push(leaf(12.4, 26.2, 5, 3.6, -158, p.light), leaf(18.8, 26.2, 5, 3.6, 158, p.light));
    // The ranger's strap across the chest; the sylvan leaf collar.
    if (t >= 3) out.push(T([[19, 26.2], [21.2, 27.4], [11.8, 35.6], [9.8, 34.4]], BARK));
    if (t >= 4) out.push(...fan(MID, 26.2, 3, 5.4, 4, 140, 220, [p.light, p.main]));
    return out;
  }
  // Tunics and raiments: under-layers of leaves peek below the main hem.
  const layers = t >= 15 ? 3 : t >= 9 ? 2 : 1;
  const hemY = t >= 15 ? 40.6 : 39.4;
  const under = [p.light, p.secondDark];
  for (let i = layers - 1; i >= 1; i--) out.push(T(tunicPts(hemY + i * 2.6, 4, s * (1 + i * 0.4), 3, 0.5 + i * 0.7), under[i - 1]));
  const tunic = tunicPts(hemY, 4, s, 3.4, 0.4);
  out.push(T(tunic, p.main), T([[MID - 3, 26.2], [MID + 3, 26.2], [MID, 31]], p.second));
  // A trim-edged V neck (Silverleaf on), a sash with tails (Windrunner on), a chest leaf.
  if (t >= 6) out.push(F(T([[MID - 3.6, 26.2], [MID - 2.4, 26.2], [MID, 30], [MID + 2.4, 26.2], [MID + 3.6, 26.2], [MID, 31.8]], tr)));
  out.push(band(tunic, 33.4, 35.6, t >= 10 ? p.secondDark : LEATHER), buckle);
  if (t >= 7) out.push(T([[19.4, 26.4], [21.4, 27.8], [12, 35.6], [10, 34.2]], p.second), leaf(10.6, 34.6, 8, 2.8, 194 + s * 5, p.second), leaf(11, 34.8, 6.4, 2.4, 172 + s * 5, p.secondDark));
  if (t >= 8) out.push(leaf(17.6, 32.8, 4.6, 3.4, 0, tr));
  if (t >= 10) out.push(...gem(17.6, 31, 0.9, p.accent));
  if (t >= 12) out.push(band(tunic, hemY - 1.3, hemY, tr));
  if (t >= 15) out.push(...fan(MID, 26.2, 3, 6, 4.6, 140, 220, [p.light, tr]));
  return out;
}

const sleeve = (t, p) => p.second;
const longSleeves = () => true;

// Leaf pauldrons layered over the upper arm.
function shoulder(t, p, side) {
  if (t < 3) return [];
  const a = 180 - side * 34;
  if (t < 5) return [leaf(0, -1, 5, 4, a, LEATHER)];
  const n = t >= 15 ? 4 : t >= 10 ? 3 : 2;
  const out = fan(0, -1.4, n, t >= 15 ? 7 : 6, 3.8, a - side * 26, a + side * 16, [p.main, p.light]);
  if (t >= 6) out.push(leaf(0, -1.6, 4.6, 2.6, a, p.trim));
  if (t >= 10) out.push(...gem(0, -0.6, 0.9, p.accent));
  return out;
}

// ---------- Bottoms ----------

function legs(t, p) {
  if (t < 5) return { top: p.dark, low: t >= 2 ? p.deep : p.secondDark, pad: t >= 3 ? LEATHER : null, cuff: t < 2 ? p.second : null };
  const ink = mix(p.deep, '#4a3f6a', 0.3);
  return { top: ink, low: shade(ink, -8), pad: t >= 15 ? p.trim : p.light, cuff: t >= 10 ? p.second : null };
}

// Side leaf flaps from the hips that sway (Elderwood on), three per side on the raiments.
function skirt(t, p, m = { sway: 0, hair: 0, flap: 0 }) {
  if (t < 10) return null;
  const s = m.sway * 5;
  const n = t >= 15 ? 2 : 1;
  const len = t >= 15 ? 15 : 13;
  const out = [
    ...fan(10.4, 35, n, len, 4.6, 200 + s, 176 + s, [p.light, p.main]),
    ...fan(20.6, 35, n, len, 4.6, 160 + s, 184 + s, [p.light, p.main]),
    T([[9.6, 34.2], [21.4, 34.2], [21.6, 36.2], [9.4, 36.2]], p.dark),
  ];
  if (t >= 15) out.push(...gem(10.4, 35.2, 0.8, p.accent), ...gem(20.6, 35.2, 0.8, p.accent));
  return out;
}

// ---------- Shoes: soft shoes, then wrapped boots, then winged striders ----------

function shoe(t, p, k) {
  const { poly, shaft, sole, c, tint } = k;
  const wrap = tint(t < 5 ? LEATHER : p.light);
  const h = t < 5 ? 2.2 + t * 0.4 : 5.6;
  const out = [shaft(h, c, t < 5 ? 3 : 3.3), sole(c)];
  // Criss-crossed wraps up the shaft.
  for (let y = 0.8; y < h - 0.6; y += 1.6) out.push(poly([[-1.7, -y], [1.7, -y - 1], [1.7, -y - 0.4], [-1.7, -y + 0.6]], wrap));
  out.push(poly([[-2.8, 2.1], [2.9, 2.1], [2.6, 3], [-2.6, 3]], tint(t < 5 ? BARK : p.deep)));
  // A leaf cuff folds over the boot top.
  if (t >= 2) out.push(poly([[-2.2, -h + 0.6], [2.2, -h + 0.6], [2.6, -h - 1.4], [0.6, -h - 0.2], [-0.6, -h - 1.8], [-2.6, -h - 0.6]], tint(t < 5 ? p.light : p.main)));
  if (t >= 10) out.push(poly([[0.6, -0.4], [1.8, 0.4], [0.6, 1.2], [-0.6, 0.4]], tint(p.trim)));
  // Striders: little leaf wings at the heel.
  if (t >= 15) out.push(poly([[-1.6, -2.6], [-6.4, -6], [-5.2, -3.2], [-6.8, -1.6], [-4.6, -0.6], [-1.6, 0.4]], tint(p.light)), poly([[-1.8, -2.2], [-4.6, -4.4], [-3.8, -1.6], [-1.8, -0.6]], tint(p.trim)));
  return out;
}

// ---------- Gloves: a glove and a bracer along the forearm ----------

function hand(t, p, hx, hy, ex = hx, ey = hy - 4) {
  const at = (f) => [hx + (ex - hx) * f, hy + (ey - hy) * f];
  const [ax, ay] = at(0.2);
  const [bx, by] = at(0.9);
  const brace = t < 5 ? LEATHER : p.dark;
  const out = [limb(ax, ay, bx, by, 3.8, 4.4, brace)];
  // Laces, then metal bands, a leaf guard flaring past the elbow and a gem.
  if (t < 6) out.push(limb(...at(0.45), ...at(0.55), 4, 4.1, t < 5 ? BARK : p.deep));
  else out.push(limb(...at(0.24), ...at(0.34), 4, 4.1, p.trim), limb(...at(0.8), ...at(0.9), 4.3, 4.4, p.trim));
  if (t >= 3) {
    const a = (Math.atan2(ex - hx, -(ey - hy)) * 180) / Math.PI;
    out.push(leaf(bx, by, t >= 15 ? 5.4 : 4, t >= 10 ? 4.4 : 3.4, a, t < 5 ? p.main : p.light));
  }
  if (t >= 10) out.push(...gem(...at(0.58), 0.9, p.accent));
  out.push(E(hx, hy, 1.9, 1.9, t < 5 ? BARK : p.dark));
  return out;
}

// ---------- Capes: leaf-cut cloaks, flowing mantles, then leaf-and-light wings ----------

// A cloak from the shoulders whose hem is cut into n leaf points.
function cloakPts(bottom, n, s, flare = 0) {
  const h = s / 2;
  const x0 = 4 - flare + s;
  const x1 = 27 + flare + s;
  const hem = [];
  for (let i = 0; i <= n * 2; i++) hem.push([x1 - ((x1 - x0) * i) / (n * 2), bottom + (i % 2 ? 2.2 : 0) - Math.abs(i - n) * 0.15]);
  return [[8.6, 26], [22.4, 26], [25.4 + flare * 0.5 + h, 36], ...hem, [5.6 - flare * 0.5 + h, 36]];
}

// One wing of leaf-shaped feathers fanned from the back, on the left; mirrored for the right.
function wing(t, p, m) {
  const up = m.flap ? 10 : -3;
  const lit = mix(p.accent, WHITE, 0.45);
  const len = 22 + (t - 15) * 1.5;
  const n = t >= 17 ? 6 : 5;
  const out = [];
  // Leaf feathers rooted low on the back and swept out sideways (the top one tips out at ear
  // height), so the head and hair stay clear; the top ones longest, then a shorter glowing row.
  for (let i = 0; i < n; i++) out.push(leaf(12 - i * 0.3, 31 + i * 0.8, len * (1 - i * 0.1), 5.6, -58 - i * 15 + up, i % 2 ? p.light : p.main));
  for (let i = 0; i < 3; i++) out.push(leaf(12, 31, len * (0.6 - i * 0.06), 3.6, -64 - i * 17 + up, t >= 17 ? lit : p.light));
  if (t >= 17) out.push(...[0, 1, 2].map((i) => F(E(...along(12 - i * 0.3, 31 + i * 0.8, len * (1 - i * 0.1) * 0.96, -58 - i * 15 + up), 0.9, 0.9, WHITE))));
  if (t >= 18) out.push(leaf(12, 31, len * 0.42, 2.2, -70 + up, p.trim), leaf(12, 31, len * 0.36, 2, -100 + up, p.trim));
  return out;
}

function cape(t, p, m = { sway: 0, hair: 0, flap: 0 }) {
  const s = m.sway;
  if (t >= 15) {
    const back = t >= 18 ? [T(cloakPts(44, 4, s), p.dark)] : [];
    return [...back, ...pair(wing(t, p, m))];
  }
  const mantle = t >= 5;
  const bottom = mantle ? 47 + Math.min(4, (t - 5) * 0.6) : 42 + t;
  const n = mantle ? 5 : 4;
  const out = [];
  // A lining of leaves peeks below (Greenleaf on), two rows on the long mantles.
  if (t >= 2) out.push(T(cloakPts(bottom + 2, n + 1, s * 1.2, 1), t >= 10 ? p.second : p.dark));
  if (t >= 10) out.push(T(cloakPts(bottom + 0.6, n, s * 1.1, 0.6), p.light));
  out.push(T(cloakPts(bottom, n, s, t >= 7 ? 0.4 : 0), p.main));
  if (t >= 6) out.push(T([[4.6 + s, bottom - 1.6], [26.4 + s, bottom - 1.6], [26.6 + s, bottom - 0.6], [4.4 + s, bottom - 0.6]], p.trim));
  // Glints on the high mantles: moonlit stars, sun feathers, aurora streaks.
  if (t >= 8) {
    const dots = [[7 + s * 0.6, 38], [24 + s * 0.6, 40], [10 + s, 45], [21 + s, 44]];
    out.push(...dots.slice(0, 2 + Math.floor((t - 8) / 2)).map(([x, y]) => F(star(x, y, 1.3, t >= 10 ? p.glow : p.trim))));
  }
  return out;
}

// A leaf brooch at the neck and ties over the shoulders; wings strap on with a gem harness.
function capeFront(t, p) {
  if (t >= 15) return [leaf(MID, 30.4, 5, 3.6, 0, p.trim), ...gem(MID, 29, 1.1, p.accent)];
  const ties = [T([[10, 26], [12.6, 26], [13.6, 29.4], [11, 29]], p.main), T([[21, 26], [18.4, 26], [17.4, 29.4], [20, 29]], p.main)];
  const brooch = t < 5 ? [leaf(MID, 29.2, 3.6, 3, -30, p.light), leaf(MID, 29.2, 3.6, 3, 30, p.light), F(E(MID, 29.2, 0.9, 0.9, p.trim))] : [leaf(MID, 30, 4.6, 4, -34, p.trim), leaf(MID, 30, 4.6, 4, 34, p.trim), ...gem(MID, 29.4, 1.1, p.accent)];
  return [...ties, ...brooch];
}

export default { hat, hatBack, hatTucks: (t) => t < 5 && t !== 2, hatHidesBangs: () => false, top, sleeve, longSleeves, shoulder, legs, skirt, shoe, hand, cape, capeFront };
