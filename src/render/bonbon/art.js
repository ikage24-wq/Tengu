// Queen Bonbon's design (2026-11-25, remade on the queen base, the player's pick "A, the Strawberry
// Shortcake Queen"). Second redraw the same day, the player: "looks stiff, eyes feel so childish, it
// should be adult cute eyes; hair is too bad, look at how the player character's hair is made; the
// dress needs to be puffed like a big Victorian one to have more personality".
// The Candy Volcano's lonely queen, who bakes a bigger cake every day in case somebody comes to share
// it: a grand Victorian sweet in a strawberry-shortcake ball gown.
//   - Her hair, built the player's way (render/hair.js: the top and fringe one outline cut into soft
//     clumps along its lower edge, a shadow crease rising from each notch, light strands down the
//     clumps; long hair one flowing sheet with curled ends and shine streaks down the flow; ringlets
//     as stacked coils, each with its shade and shine; an angel ring broken into lens pieces) but all
//     her own shapes: a soft swept fringe of six clumps, side hair over her ears, the long sheet down
//     her back, and two great drill ringlets falling from her temples.
//   - Her eyes her own (the player: no two monsters share eyes), Velvet: sleepy, drooping at the
//     outer corner, lined all round with a soft tail, a candy-pink jewel iris and a heart glint,
//     shaped anew by every face (see FACES); full painted lips.
//   - Her gown a big puffed Victorian ball gown: since 2026-11-27 a skirt of three soft tiers stacked
//     like a shortcake (pink, cream caught up with bows and strawberries, pink with a lace ruffle), little
//     satin slippers peeking under it; a corseted bodice
//     with lace and a strawberry cameo; huge puffed gigot sleeves, lace cuffs.
//   - A crown of birthday candles and a cherry; her sceptre the great spoon, heaped with cream.
// Each piece in the queen base's own drawing units (blankBody('queen'), read only), named for the
// bone it rides on (see bonbonDesign below); every skirt layer hangs from its own seam on its own
// spring, so the gown sways and swings (never one stiff bell).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob, mapShape } from '../mobs/kidbase.js';

const HX = 151;
const HS = 0.87;
const HY0 = 80.5;
export const H2B = ([x, y]) => [HX + x * HS, HY0 + y * HS];
const inHead = (list) => list.map((sh) => mapShape(sh, H2B, HS));
const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);
const toward = ([x, y], [px, py], t) => [x + (px - x) * t, y + (py - y) * t];

export const SKIN_COLORS = { lt: '#fff6f0', base: '#ffe6dc', sh: '#f6c8bc', deep: '#e4a898' };
const SK = SKIN_COLORS;
// her hair: light, base, shade, deep shade, shine
export const HAIR = { lt: '#ffd8e8', base: '#ffaacb', sh: '#f283ad', dk: '#cc5a88', hi: '#ffe6f0' };
const CREAM = ['#ffffff', '#fff8ee', '#f4e4d0', '#e4cdb0'];
const PINK = ['#ffd8e6', '#ffb4cc', '#f08aac', '#d06890'];
const ROSE = ['#ffc4d8', '#ff96b8', '#e8709a', '#c04c7a'];
const GOLD = ['#fff0a0', '#ffd36a', '#e8b14a', '#b8862a'];

// ---------- Outline tools (the player's hair kit, written for her own) ----------
// A sharp point: kept crisp when an outline is smoothed.
const SP = (x, y) => [x, y, 1];
// Rounds every corner of a closed outline except its sharp points (corner cutting, 3 passes).
function rounded(pts, passes = 3) {
  let p = pts;
  for (let k = 0; k < passes; k++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i];
      const b = p[(i + 1) % p.length];
      if (a[2]) out.push(a);
      if (!(a[2] && b[2])) out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = out;
  }
  return p.map(([x, y]) => [x, y]);
}
const mass = (pts, c) => T(rounded(pts), c);
const fill = (pts, c) => F(T(rounded(pts), c));
// A streak along the flow: pointed at both ends, `w` wide in its middle, bowed by `bow`.
function streak(x0, y0, x1, y1, w, bow, c) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  return F(T(rounded([SP(x0, y0), [mx + nx * w * 0.5, my + ny * w * 0.5], SP(x1, y1), [mx - nx * w * 0.5, my - ny * w * 0.5]]), c));
}
// The shadow crease rising from a notch between two clumps.
const crease = (x, y, len, c, tilt = 0) => F(T([[x - 1.4, y + 0.4], [x + 1.4, y + 0.4], [x + tilt, y - len]], c));

// ---------- Her hair (head units: the face's eyes at y 10, chin 34, the face's edges ±34) ----------
// The skull's hair line from angle a0 to a1 (degrees; 0 right, 90 down), one size bigger than the
// skull (the hair sits off the head).
const SKX = 0;
const SKY = -12;
const dome = (a0, a1, n = 14, rx = 44, ry = 46) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [SKX + rx * Math.cos(a), SKY + ry * Math.sin(a)];
});
// Her fringe's edge, her left to her right: six soft clumps of uneven length swept a little toward
// her right, the tips rounded, the notches crisp; the longest just above her right eye.
const FRINGE0 = [[-38, 4], SP(-33, -9), [-27, 1], SP(-20, -12), [-12, 3.6], SP(-4, -13), [4, 1.2], SP(11, -11), [18, 4.2], SP(25, -9), [30, 0.6], SP(34, -8), [38, 2]];
// (gentle, as the player's soft bangs: each notch lifted most of the way toward its neighbours' tips,
// so the clumps read as soft rounded scallops, never a saw)
const FRINGE = FRINGE0.map((p, i) => (p[2] && FRINGE0[i - 1] && FRINGE0[i + 1] ? SP(p[0], p[1] + 0.55 * ((FRINGE0[i - 1][1] + FRINGE0[i + 1][1]) / 2 - p[1])) : p));
const fringeTop = () => {
  const edge = FRINGE.map(([x, y, s]) => (s ? SP(x, y) : [x, y]));
  return mass([...dome(160, 380), [42, 6], SP(39, -2), ...edge.slice().reverse(), SP(-39, -2), [-42, 6]], HAIR.base);
};
// The rest of the fringe's look: the creases from each notch, the dark gap rising toward the crown
// from the notch and a light strand down each clump to its tip, a part line, the angel ring.
function fringeLines() {
  const out = [];
  FRINGE.forEach(([x, y, s], i) => {
    const toCrown = (t) => [x + (SKX - x) * t, y + (-50 - y) * t];
    if (s) {
      out.push(crease(x, y, 5, HAIR.sh, 0.6));
      out.push(streak(...toCrown(0.6), x + 0.6, y - 1.6, 2.2, 0, HAIR.sh));
    } else if (i > 0 && i < FRINGE.length - 1) {
      out.push(streak(...toCrown(0.5), x, y - 5, 1.8, 0, HAIR.lt));
    }
  });
  out.push(streak(-14, -54, -8, -30, 2.4, -1, HAIR.dk));
  // the angel ring: three glossy lens pieces round the crown, a bright core on each
  for (const [a0, a1] of [[212, 240], [246, 278], [284, 312]]) {
    const piece = (th, lift, c) => {
      const top = [];
      const bot = [];
      for (let i = 0; i <= 10; i++) {
        const a = ((a0 + ((a1 - a0) * i) / 10) * Math.PI) / 180;
        const d = th * Math.sin((Math.PI * i) / 10) ** 0.7;
        top.push([SKX + (36 - lift) * Math.cos(a), SKY - 2 + (38 - lift) * Math.sin(a)]);
        bot.push([SKX + (36 - lift - d) * Math.cos(a), SKY - 2 + (38 - lift - d) * Math.sin(a)]);
      }
      return F(T([...top, ...bot.reverse()], c));
    };
    out.push(piece(5, 0, HAIR.lt), piece(2, 0.8, HAIR.hi));
  }
  return out;
}
// The forehead's shade under the fringe: the fringe's own outline, dropped a little and drawn under
// it in the skin's shadow tone, so a soft rim of shade follows every clump (never a zig-zag band).
const foreheadShade = () => {
  const edge = FRINGE.map(([x, y, s]) => (s ? SP(x, y + 2.6) : [x, y + 2.6]));
  return [fill([...dome(160, 380), [40, 8], ...edge.slice().reverse(), [-40, 8]], '#f9d6cc')];
};
// The side hair over each ear, from the temple down past the jaw, its edge curling in; streaks.
const sideHair = (o) => [
  mass([[38 * o, -14], [46 * o, -2], [47 * o, 16], [44 * o, 30], [38 * o, 38], [33 * o, 34], [35 * o, 22], [34 * o, 6], [32 * o, -6]], HAIR.base),
  streak(41 * o, -6, 41 * o, 30, 2.2, 1.2 * o, HAIR.sh), streak(36 * o, -2, 37 * o, 22, 1.6, -0.8 * o, HAIR.lt),
];
// The long sheet down her back: from behind her head to below her waist, its sides rippling, its end
// in four soft curls each with a dark spiral; shine streaks and dark gaps running down the flow.
export const SHEET_ROOT = H2B([0, 20]);
function sheet() {
  const top = 10;
  const len = 168;
  const left = [];
  const right = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const y = top + (len - 8 - top) * t;
    const hw = 44 + 26 * Math.sin((t * Math.PI) / 2);
    const wv = 4 * Math.sin(t * Math.PI * 2.4) * t;
    left.push([-hw + wv, y]);
    right.push([hw + wv, y]);
  }
  const bottom = [];
  const spirals = [];
  const n = 4;
  for (let i = 0; i < n; i++) {
    const xa = -70 + (140 * i) / n;
    const xb = -70 + (140 * (i + 1)) / n;
    const cx = (xa + xb) / 2;
    const rr = (xb - xa) / 2;
    const dir = cx < 0 ? -1 : 1;
    bottom.push([xa + rr * 0.05, len - 6], [xa + rr * 0.3, len + 2], [cx, len + 4], [xb - rr * 0.3, len + 2], [xb - rr * 0.05, len - 6]);
    if (i < n - 1) bottom.push(SP(xb, len - 10));
    spirals.push(fill([[cx - rr * 0.75 * dir, len - 4], [cx - rr * 0.2 * dir, len + 2.4], [cx + rr * 0.7 * dir, len + 0.6], [cx + rr * 0.3 * dir, len - 2], [cx - rr * 0.1 * dir, len - 0.4]], HAIR.dk));
    if (i < n - 1) spirals.push(crease(xb, len - 10, 12, HAIR.dk));
  }
  const out = [mass([...left, ...bottom, ...right.reverse()], HAIR.sh), ...spirals];
  for (const dir of [-1, 1]) {
    out.push(streak(dir * 34, top + 10, dir * 56, len - 18, 3.6, -2 * dir, HAIR.base));
    out.push(streak(dir * 22, top + 16, dir * 34, len - 24, 2.6, -1.4 * dir, HAIR.base));
    out.push(streak(dir * 28, top + 12, dir * 46, len - 20, 1.6, -1.8 * dir, HAIR.dk));
    out.push(streak(dir * 12, top + 20, dir * 18, len - 30, 1.4, -1 * dir, HAIR.dk));
    out.push(streak(dir * 38, top + 14, dir * 60, len - 30, 1.2, -2.2 * dir, HAIR.lt));
  }
  return out;
}
// A drill ringlet falling from the temple: stacked coils, each an oval of hair with its shaded
// underside and a shine on top, getting a little smaller down the drill, a soft tip at the end.
export const DRILL_F = H2B([-42, 18]);
export const DRILL_N = H2B([42, 18]);
function drill(o) {
  const [x, y] = [42 * o, 18];
  const n = 8;
  const step = 8.6;
  // (one twisted ringlet: a tapered lock of hair behind, the coils overlapping down it)
  const len = 6 + n * step;
  const out = [...band(curve([[x, y], [x + 2 * o, y + len * 0.5], [x, y + len]], 3), 20, 9, HAIR.sh, false)];
  for (let i = 0; i < n; i++) {
    const rr = 11.4 * (1 - i * 0.055);
    const ry = rr * 0.62;
    const cx = x + (i % 2 ? 1.2 : -1.2) * o;
    const cy = y + 6 + i * step;
    out.push(mass([[cx - rr, cy], [cx - rr * 0.5, cy - ry], [cx + rr * 0.6, cy - ry * 0.9], [cx + rr, cy + 0.4], [cx + rr * 0.5, cy + ry], [cx - rr * 0.6, cy + ry * 0.9]], HAIR.base));
    out.push(fill([[cx - rr * 0.9, cy + 0.6], [cx, cy + ry * 0.9], [cx + rr * 0.9, cy], [cx, cy + ry * 0.36]], HAIR.sh));
    out.push(streak(cx - rr * 0.6 * o, cy - ry * 0.45, cx + rr * 0.3 * o, cy - ry * 0.6, 1.8, 0.5, HAIR.lt));
  }
  const ey = y + 6 + n * step - 3;
  out.push(mass([[x - 5 * o, ey - 4], [x + 4 * o, ey - 2], [x + 5 * o, ey + 6], [x + 1 * o, ey + 12], [x - 3 * o, ey + 6]], HAIR.base), fill([[x + 2.4 * o, ey], [x + 3.4 * o, ey + 6], [x + 0.8 * o, ey + 10]], HAIR.sh));
  return out;
}

// ---------- Her eyes and faces ----------
// Her eyes, Velvet (2026-11-25, the player's pick: "B", in pink, expressive): sleepy and grown-up,
// the outer corners drooping, the lid resting low, lined all round the outer corner and off it in a
// soft tail, a candy-pink jewel iris with fine light strands and a heart glint. Every face shapes them
// its own way: a glare (the lid slanting down to her nose, the lower lid pushed up, the pupil shrunk),
// a shock (wide open, tiny pupils), smiling eyes (the lower lid risen), a smug side-glance, heart
// pupils for a taste, star pupils for joy, wet shining eyes and a tear when she's sad or hoping.
// Lashes always soft rounded clumps, never thin spikes.
// e: an eye shape (see eye below) or a shut kind (shut, happy, squeeze); m: the mouth; b: the brows.
const FACES = {
  idle: { e: {}, m: 'soft', b: 'soft' },
  blink: { e: 'shut', m: 'soft', b: 'soft' },
  happy: { e: 'happy', m: 'open', b: 'up' },
  joy: { e: { wide: 0.8, pupil: 'star', sparkle: 1 }, m: 'open', b: 'up' },
  angry: { e: { lid: 0.6, slant: 1.2, lower: 1.4, irisK: 0.9, pupil: 'small' }, m: 'pout', b: 'cross' },
  shout: { e: { wide: 0.7, lid: 1.2, slant: 1.4, irisK: 0.82, pupil: 'tiny' }, m: 'shout', b: 'cross' },
  hurt: { e: 'squeeze', m: 'wobble', b: 'worry' },
  dead: { e: 'squeeze', m: 'wobble', b: 'worry' },
  o: { e: { wide: 1.2, irisK: 0.78, pupil: 'tiny' }, m: 'o', b: 'high' },
  sad: { e: { lid: -0.6, droop: 1.2, lower: 0.6, pupil: 'wet', tear: 1 }, m: 'wobble', b: 'worry' },
  tender: { e: { lid: 0.4, lower: 2.2 }, m: 'soft', b: 'worry' },
  hope: { e: { wide: 0.9, pupil: 'wet', sparkle: 1 }, m: 'soft', b: 'worry' },
  taste: { e: { lid: -0.4, lower: 2.4, pupil: 'heart' }, m: 'yum', b: 'up' },
  sigh: { e: 'shut', m: 'sigh', b: 'worry' },
  laugh: { e: 'happy', m: 'laugh', b: 'up' },
  smug: { e: { lid: 1.2, lower: 1.4, look: 1.6 }, m: 'smirk', b: 'smug' },
  puff: { e: 'shut', m: 'puff', b: 'soft', cheeks: 1 },
};
export const MOODS = Object.keys(FACES);
const EY = { white: '#fffafa', lash: '#4a1430', lidShade: '#fbcad6', crease: '#e49ab0', water: '#ffffff', lowLid: '#d47a98' };
const IRIS = { ring: '#9a2a64', base: '#f25a98', top: '#c0347a', mid: '#ff92c0', foot: '#ffe2f0', pupil: '#7a1650', dots: '#ffe4f0' };
const heart = (x, y, s, c = '#ffffff') => F(blob([[x, y + 1.3 * s], [x - 1.4 * s, y], [x - 1.2 * s, y - 1.1 * s], [x - 0.5 * s, y - 1.3 * s], [x, y - 0.6 * s], [x + 0.5 * s, y - 1.3 * s], [x + 1.2 * s, y - 1.1 * s], [x + 1.4 * s, y]], c, 1));
const star4 = (x, y, s, c = '#ffffff') => F(T([[x, y - 1.6 * s], [x + 0.35 * s, y - 0.35 * s], [x + 1.6 * s, y], [x + 0.35 * s, y + 0.35 * s], [x, y + 1.6 * s], [x - 0.35 * s, y + 0.35 * s], [x - 1.6 * s, y], [x - 0.35 * s, y - 0.35 * s]], c));
// A rounded lash clump from a base on the lash line to a soft tip.
const lashTip = ([bx, by], [tx, ty], wd, c) => {
  const len = Math.hypot(tx - bx, ty - by) || 1;
  const [nx, ny] = [-(ty - by) / len, (tx - bx) / len];
  const m = (t, k) => [bx + (tx - bx) * t + nx * wd * k, by + (ty - by) * t + ny * wd * k];
  return fill([m(0, 0.5), m(0.55, 0.32), [tx, ty], m(0.55, -0.22), m(0, -0.5)], c);
};
// Her eye at (x, y), o its side: Velvet, sleepy and grown-up, the outer corner drooping, the lid
// resting low over the iris, lined all the way round the outer corner and off it in a soft tail.
// lid: the lid lowered further, or raised (below 0) (slant: more at the inner corner, a glare;
// droop: more at the outer, sorrow); lower: the lower lid pushed up (a smile, a squint); wide: opened
// right up; irisK: the iris's size; pupil: round, small, tiny, heart, star, wet; look: the iris moved
// sideways (both eyes the same way); tear; sparkle.
function eye(x, y, o, { lid = 0, slant = 0, droop = 0, lower = 0, wide = 0, irisK = 1, pupil = 'round', tear = 0, sparkle = 0, look = 0 } = {}) {
  const P = (u, v) => [x + u * o, y + v];
  const ink = EY.lash;
  const w = 11.4;
  const h = 7 + wide * 1.6;
  const L = Math.max(0, 2.4 + lid - wide * 2.4);
  const out = [F(blob([P(-w * 0.6, -h - 2), P(w * 0.6, -h - 3.4), P(w * 1.4, -h * 0.1), P(w * 1.1, h * 0.1), P(0, -h - 0.4)], EY.lidShade, 2))];
  // the white's edges, inner corner to outer: the top, and the bottom
  const top = [[-w, 0.2], [-w * 0.55, -h * 0.9], [w * 0.1, -h], [w * 0.7, -h * 0.6], [w * 1.08, 2]];
  const bot = [[-w, 0.2], [-w * 0.6, h * 0.6], [0, h * 0.9], [w * 0.7, h * 0.8], [w * 1.08, 2]];
  out.push(blob([...top.map(([u, v]) => P(u, v)), ...bot.slice(1, -1).reverse().map(([u, v]) => P(u, v))], EY.white, 2));
  // the iris: a dark ring, candy pink, a lighter lower half, a glowing foot, the shade under the lid
  const k = IRIS;
  const rx = 6.4 * irisK + wide * 0.3;
  const ry = 6.8 * irisK + wide * 0.4;
  const cx = x + 0.8 * o + look;
  const cy = y + 1 + (1 - irisK) * 1.2;
  out.push(F(E(cx, cy, rx, ry, k.ring)), F(E(cx, cy + 0.3, rx - 0.7, ry - 0.7, k.base)));
  out.push(F(E(cx, cy + ry * 0.36, rx - 1.5, ry * 0.5, k.mid)), F(E(cx, cy + ry * 0.64, rx - 2.8, ry * 0.22, k.foot)), F(E(cx, cy - ry * 0.5, rx - 0.9, ry * 0.4, k.top)));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2;
    out.push(...band([[cx + Math.cos(a) * rx * 0.42, cy + 0.4 + Math.sin(a) * ry * 0.44], [cx + Math.cos(a) * rx * 0.78, cy + 0.4 + Math.sin(a) * ry * 0.82]], 0.4, 0.15, Math.sin(a) < 0 ? k.top : k.dots, true));
  }
  // the pupil, and the glints to suit it (her own: a heart)
  const py = cy + 0.5;
  if (pupil === 'heart') out.push(heart(cx, py, 2.4 * irisK, k.pupil), heart(cx - 0.6 * o, py - 0.6, 0.8, '#ffb4d4'));
  else if (pupil === 'star') out.push(F(E(cx, py, rx * 0.34, ry * 0.38, k.pupil)), star4(cx, py, 2.4, '#ffffff'));
  else if (pupil === 'tiny') out.push(F(E(cx, py, rx * 0.16, ry * 0.18, k.pupil)));
  else if (pupil === 'small') out.push(F(E(cx, py, rx * 0.22, ry * 0.26, k.pupil)));
  else out.push(F(E(cx, py, rx * (pupil === 'wet' ? 0.36 : 0.3), ry * (pupil === 'wet' ? 0.4 : 0.36), k.pupil)));
  if (pupil === 'tiny' || pupil === 'small') out.push(F(E(cx - 2 * o, cy - 1.6 * irisK, 1.2, 1.4, '#ffffff')));
  else if (pupil === 'wet') {
    out.push(heart(cx - 3 * o, cy - 1.6, 1.6), F(E(cx + 2.4 * o, cy - 0.2, 1.1, 1.3, '#ffffff')));
    out.push(...band(curve([[cx - rx * 0.66, cy + ry * 0.5], [cx - rx * 0.2, cy + ry * 0.66], [cx + rx * 0.2, cy + ry * 0.56], [cx + rx * 0.66, cy + ry * 0.62]], 3), 0.7, 0.7, '#ffffff', true));
  } else if (pupil !== 'star') out.push(heart(cx - 3.2 * o, cy - 1.8, 1.3 + sparkle * 0.3));
  if (pupil !== 'tiny') out.push(F(E(cx + 2.6 * o, cy + 3, 0.9, 0.9, '#ffffff')));
  if (sparkle) out.push(star4(cx + 3 * o, cy - 2.4, 0.9));
  // the lower lid pushed up: skin over the white below its new line
  const n = top.length - 1;
  const lowLine = bot.map(([u, v], i) => P(u, v - lower * Math.sin((Math.PI * i) / n) ** 0.8));
  if (lower > 0) out.push(F(blob([...lowLine, ...bot.slice().reverse().map(([u, v]) => P(u, v + 1))], SK.base, 1)));
  // the upper lid resting low: skin over the white above its line; the heavy lash line along it
  const line = top.map(([u, v], i) => P(u, v + L * Math.sin((Math.PI * i) / n) ** 0.8 * (1 + slant * (1 - i / n) + droop * (i / n))));
  if (L > 0) out.push(F(blob([...line, ...top.slice().reverse().map(([u, v]) => P(u, v - 1.4))], SK.base, 1)));
  out.push(...band(curve(line, 3), 2, 3.2, ink, true));
  // (the line wraps the outer corner into the lower lid, and droops off it in a soft tail)
  const oc = line[n];
  out.push(...band(curve([oc, lowLine[3], lowLine[2]].map(([px, py2], i) => [px, py2 + (i ? 0.4 : 0)]), 3), 1.8, 0.4, ink, true));
  out.push(lashTip([oc[0] - 0.6 * o, oc[1] - 0.2], P(w * 1.52, 3.8 + L * 0.1 + droop * 1.4), 2.6, ink));
  // the crease, following the lid
  out.push(...band(curve([P(-w * 0.2, -h - 2.6 + L * 0.3), P(w * 0.5, -h - 2.6 + L * 0.3), P(w * 1.12, -h * 0.4)], 3), 0.7, 0.5, EY.crease, true));
  // a white water line along the lower lid, a soft pink line under it
  out.push(...band(curve(lowLine.slice(1, 3).map(([px, py2]) => [px, py2 - 0.4]), 3), 0.6, 0.6, EY.water, true));
  out.push(...band(curve(lowLine.slice(1, 4).map(([px, py2]) => [px, py2 + 0.8]), 3), 0.4, 0.9, EY.lowLid, true));
  // a tear: pooled along the lower lid, and one running down her cheek
  if (tear) {
    out.push(...band(curve(lowLine.slice(1, 4).map(([px, py2]) => [px, py2 - 0.8]), 3), 1.1, 1.1, '#c4ecff', true));
    out.push(blob([P(w * 0.4, h + 0.4), P(w * 0.62, h + 3.4), P(w * 0.52, h + 5.6), P(w * 0.3, h + 5.2), P(w * 0.24, h + 3)], '#b8e4ff', 2), F(E(...P(w * 0.38, h + 3.6), 0.5, 0.9, '#ffffff')));
  }
  return out;
}
// Her shut eyes: one heavy smooth lash curve (up for a smile, down for a rest) and its drooping tail.
const shut = (x, o, kind) => {
  const ink = EY.lash;
  const P = (u, v) => [x + u * o, 10 + v];
  if (kind === 'squeeze') return [...band(curve([P(-7, -2.4), P(6, 1.8), P(-7, 6)], 3), 2, 2.4, ink, true)];
  const happy = kind === 'happy';
  const end = P(11, happy ? 3.4 : 3.2);
  const pts = happy ? [P(-9.6, 3), P(-2, -3.4), P(6, -2.2), end] : [P(-9.6, 0.6), P(-1, 4.4), P(7, 3.8), end];
  return [...band(curve(pts, 3), 1.6, 3, ink, true), lashTip(end, [end[0] + 3.8 * o, end[1] + 1.6], 2.6, ink)];
};
// Her brows: fine and long, a lady's arch, drawn over the fringe so her look always reads.
const brows = (b) => {
  const c = '#9a3460';
  const one = (o) => {
    const P = (u, v) => [14 * o + u * o, v];
    const br = (pts) => band(curve(pts.map(([u, v]) => P(u, v)), 3), 1.9, 0.6, c, true);
    if (b === 'up' || (b === 'smug' && o < 0)) return br([[-8, -6], [-1, -9.6], [9, -8.4]]);
    if (b === 'high') return br([[-8, -9], [-1, -12.4], [9, -10.4]]);
    if (b === 'cross') return br([[-8, -1.6], [-1, -4.4], [9, -8.6]]);
    if (b === 'worry') return br([[-8, -9.4], [0, -8.2], [9, -5]]);
    if (b === 'smug') return br([[-8, -4], [-1, -6.4], [9, -6]]);
    return br([[-8, -5.4], [-1, -8.4], [9, -7.2]]);
  };
  return [...one(-1), ...one(1)];
};
const LIP = '#e04a76';
const LIP_DK = '#9a2a50';
const LIP_LT = '#ff9ab8';
// Her mouth: full painted lips, an upper and a lower, a gloss.
function mouth(m) {
  const lips = (open = 0) => [
    blob([[-5.4, 23.6], [-2.4, 22.4], [0, 23], [2.4, 22.4], [5.4, 23.6], [2.8, 24.4 + open], [-2.8, 24.4 + open]], LIP, 2),
    blob([[-4.4, 24.2 + open], [4.4, 24.2 + open], [3, 27 + open], [0, 27.8 + open], [-3, 27 + open]], LIP, 2),
    F(E(-1.2, 25.8 + open, 1.6, 0.6, '#ffffff')), F(E(1.2, 23.2, 1, 0.4, LIP_LT)),
  ];
  if (m === 'open' || m === 'laugh') return [blob([[-5, 23.2], [5, 23.2], [3.8, 28], [0, 29.6], [-3.8, 28]], '#8a1e44', 2), F(E(0, 27.8, 2.8, 1.3, LIP_LT)), F(blob([[-4.2, 23.4], [4.2, 23.4], [3.6, 24.4], [-3.6, 24.4]], '#ffffff', 1)), ...arc([[-5.4, 23.2], [0, 22.2], [5.4, 23.2]], 0.9, LIP)];
  if (m === 'yum') return [...lips(0), blob([[1.6, 25.6], [5.4, 25], [5, 28], [3.2, 28.6], [1.8, 27.4]], LIP_LT, 2)];
  if (m === 'pout') return [blob([[-3.4, 24.4], [0, 23.2], [3.4, 24.4], [2.4, 27], [-2.4, 27]], LIP, 2), ...arc([[-3.8, 24.2], [0, 23], [3.8, 24.2]], 0.7, LIP_DK), F(E(-0.8, 25.6, 1, 0.5, '#ffffff'))];
  if (m === 'shout') return [blob([[-5.4, 22.2], [5.4, 22.2], [4.4, 28.4], [0, 30.6], [-4.4, 28.4]], '#6a1a3a', 2), F(E(0, 28.4, 3, 1.4, LIP_LT)), F(blob([[-4.6, 22.4], [4.6, 22.4], [4.2, 23.6], [-4.2, 23.6]], '#ffffff', 1)), ...arc([[-5.6, 22.2], [0, 21.4], [5.6, 22.2]], 0.9, LIP)];
  if (m === 'o') return [blob([[-2.6, 23.6], [2.6, 23.6], [2.8, 26.6], [0, 28.6], [-2.8, 26.6]], LIP, 2), F(E(0, 25.8, 1.4, 1.8, '#6a1a3a'))];
  if (m === 'wobble') return [...arc([[-4, 25.2], [-2, 24.2], [0, 25.2], [2, 24.2], [4, 25.2]], 1.1, LIP_DK)];
  if (m === 'sigh') return [blob([[-2, 24], [2, 24], [2, 26.4], [-2, 26.4]], LIP, 2), F(E(0, 25.2, 0.9, 0.7, '#6a1a3a'))];
  if (m === 'puff') return [blob([[-2.2, 24], [2.2, 24], [1.6, 26.4], [-1.6, 26.4]], LIP, 2), F(E(0, 25, 0.8, 0.8, '#8a1e44'))];
  if (m === 'smirk') return [...lips(0).slice(0, 2), ...arc([[-4, 24.6], [1, 24.8], [5.6, 22.6]], 0.8, LIP_DK), F(E(-1, 25.8, 1.4, 0.5, '#ffffff'))];
  return lips(0);
}
// Her face: a soft oval narrowing to a small rounded chin (a young woman's, not a child's round
// moon), a shade down her far cheek, the light on her cheeks.
function face(f) {
  const out = [blob([[-33, -14], [-34, 4], [-32, 15], [-27, 24.6], [-17, 31.6], [-6, 35], [0, 35.6], [6, 35], [17, 31.6], [27, 24.6], [32, 15], [34, 4], [33, -14], [0, -30]], SK.base, 4), F(blob([[-33, -6], [-31.6, 14], [-27, 23], [-29.6, 8]], SK.sh, 2))];
  out.push(F(E(-22, 18, 8, 6, f.cheeks ? '#ffd8e0' : SK.lt)), F(E(22, 18, 8, 6, f.cheeks ? '#ffd8e0' : SK.lt)));
  const e = f.e;
  if (typeof e === 'object') for (const o of [-1, 1]) out.push(...eye(14 * o, 10, o, { ...e, tear: e.tear && o > 0 ? 1 : 0 }));
  else for (const o of [-1, 1]) out.push(...shut(14 * o, o, e));
  const glare = typeof e === 'object' && e.slant;
  for (const o of [-1, 1]) {
    out.push(F(E(21 * o, 20.2, f.cheeks ? 7 : 5.6, f.cheeks ? 4 : 3, glare ? '#ff8aa0' : '#ffa8c0')));
    for (let i = 0; i < 3; i++) out.push(...arc([[21 * o + (i - 1) * 2.6 - 0.8, 21.4], [21 * o + (i - 1) * 2.6 + 0.8, 19.2]], 0.5, SK.lt));
  }
  out.push(...arc([[0.6, 18.2], [1.4, 19.4]], 0.7, SK.deep), ...mouth(f.m), F(E(11, 26.4, 0.8, 0.8, '#c88a8a')));
  return out;
}
// The crown: a gold band with a scalloped top and pink gems, birthday candles in pink and white
// stripes (their flames drawn live), a big cherry in the middle.
export const CROWN_ROOT = H2B([0, -52]);
export const FLAMES = [-16, -6, 6, 16].map((x) => H2B([x, -81]));
const crown = () => inHead([
  blob([[-27, -56], [27, -56], [28, -47], [0, -45], [-28, -47]], GOLD[1], 2), F(blob([[-26, -55], [-8, -55], [-10, -50], [-26, -49]], GOLD[0], 1)), ...arc([[-28, -48], [0, -46], [28, -48]], 0.9, GOLD[3]),
  ...[-20, -10, 0, 10, 20].map((x) => E(x, -56.4, 3, 2.4, GOLD[1])),
  ...[-15, 15].flatMap((x) => [F(E(x, -51, 2.4, 2, '#ff6a9a')), F(E(x - 0.6, -51.6, 0.8, 0.6, '#ffffff'))]),
  ...[-16, -6, 6, 16].flatMap((x, i) => [blob([[x - 2.6, -75], [x + 2.6, -75], [x + 2.6, -56], [x - 2.6, -56]], i % 2 ? PINK[1] : '#ffffff', 1), ...[-70, -64].map((y) => F(blob([[x - 2.4, y], [x + 2.4, y + 3], [x + 2.4, y + 5], [x - 2.4, y + 2]], i % 2 ? '#ffffff' : PINK[1], 1))), ...arc([[x, -75], [x, -78]], 0.6, '#5a3a2a')]),
  ...band(curve([[0, -64], [3, -72], [9, -78]], 3), 1.1, 0.8, '#5a8a3a', true), F(blob([[8, -78], [14, -81], [12, -76]], '#7ac86a', 1)),
  E(0, -62, 7, 6.6, '#d81a3a'), F(E(-2.4, -64.6, 2.6, 2, '#ff8a9a')), F(E(2.2, -59.8, 2.8, 2, '#a8102a')),
]);

// ---------- The gown ----------
const piping = (pts, r, c = CREAM[0], lt = '#fff6fa') => {
  const sp = curve(pts, 3);
  const L = sp.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - sp[i - 1][0], p[1] - sp[i - 1][1]) : 0), 0);
  const n = Math.max(2, Math.round(L / (r * 1.3)));
  const out = [];
  for (let i = 0; i <= n; i++) {
    const [x, y] = sp[Math.round((i / n) * (sp.length - 1))];
    out.push(E(x, y, r, r * 0.86, c), F(E(x - r * 0.3, y - r * 0.32, r * 0.42, r * 0.28, lt)), ...band(curve([[x - r * 0.6, y + r * 0.1], [x, y + r * 0.45], [x + r * 0.5, y]], 3), r * 0.14, r * 0.08, CREAM[3], true));
  }
  return out;
};
// A lace ruffle along a path: a band of soft scallops with eyelet holes and a fine edge.
function lace(pts, depth, c = '#ffffff', sh = '#f0e4ec') {
  const sp = curve(pts, 4);
  const out = [];
  const step = Math.max(2, Math.round(sp.length / 18));
  for (let i = 0; i < sp.length; i += step) {
    const [x, y] = sp[i];
    out.push(E(x, y + depth * 0.4, depth * 0.62, depth * 0.62, c));
  }
  out.push(...band(sp, depth * 0.7, depth * 0.7, c, false));
  for (let i = 0; i < sp.length; i += step) {
    const [x, y] = sp[i];
    out.push(F(E(x, y + depth * 0.25, depth * 0.14, depth * 0.14, sh)), F(E(x, y + depth * 0.7, depth * 0.36, depth * 0.1, sh)));
  }
  return out;
}
export const strawberry = (x, y, s, rot = 0) => {
  const R = (u, v) => [x + (u * Math.cos(rot) - v * Math.sin(rot)) * s, y + (u * Math.sin(rot) + v * Math.cos(rot)) * s];
  return [blob([R(-4, -3), R(4, -3), R(3.4, 2), R(0, 5.4), R(-3.4, 2)], '#ef3a5a', 2), F(blob([R(-3, -2), R(-1, -2.4), R(-2, 1.4)], '#ff8aa0', 1)), F(blob([R(1.6, -1), R(3, -1.6), R(2.2, 2.4), R(0.6, 3.6)], '#c8203e', 1)), ...[[-1.6, 0], [1.4, -0.6], [0, 2.6], [1.8, 1.8], [-1.6, 2.4], [0, -1]].map(([u, v]) => F(E(...R(u, v), 0.35 * s, 0.45 * s, '#ffe08a'))), F(blob([R(-3.6, -3.4), R(-1.2, -4.8), R(0, -3.6), R(1.2, -4.8), R(3.6, -3.4), R(0, -2.2)], '#5ab84a', 1)), F(E(...R(0, -4.6), 0.6 * s, 0.9 * s, '#3a8a3a'))];
};
// A ribbon bow: two loops, two tails, a knot.
const ribbonBow = (x, y, s, c = ROSE) => [
  ...band(curve([[x, y], [x - 2 * s, y + 6 * s], [x - 4 * s, y + 11 * s]], 3), 2.6 * s, 1.8 * s, c[2], true), ...band(curve([[x, y], [x + 2.4 * s, y + 5 * s], [x + 4.6 * s, y + 10 * s]], 3), 2.4 * s, 1.6 * s, c[1], true),
  blob([[x, y], [x - 8 * s, y - 5 * s], [x - 9 * s, y + 1 * s], [x - 3 * s, y + 3 * s]], c[1], 2), blob([[x, y], [x + 8 * s, y - 5 * s], [x + 9 * s, y + 1 * s], [x + 3 * s, y + 3 * s]], c[1], 2),
  F(blob([[x - 1, y - 0.6], [x - 7 * s, y - 4 * s], [x - 7.4 * s, y - 1 * s]], c[0], 1)), F(blob([[x + 1, y - 0.6], [x + 7 * s, y - 4 * s], [x + 7.4 * s, y - 1 * s]], c[0], 1)),
  E(x, y, 2.6 * s, 2.4 * s, c[2]), F(E(x - 0.6 * s, y - 0.6 * s, 1 * s, 0.8 * s, c[0])),
];
// (The one-piece crinoline, its petticoat and its two swag tiers were replaced on 2026-11-27 by the
// tiered skirt below.)
const CX = 151;
const SKIRT_TOP = 206;
// ---------- The tiered skirt (2026-11-27) ----------
// The player: her big bell gown never moved at all, she slid along like a stiff bell (no rigid bell
// gowns for bosses). Rebuilt as three soft tiers stacked like the layers of a strawberry shortcake,
// each its own piece hung from the seam under the tier above on its own spring (queenrig.js), so the
// gown sways, swings and settles tier by tier: a pink tier at her waist, a cream tier caught up with
// bows and strawberries, a wide pink tier with a lace ruffle at the hem, lifted a touch at the front so
// her little satin slippers peek out as she steps. Every edge a soft round scallop, every trim a
// continuous piped rope (never rows of dots).
const TIERS = {
  top: { y0: 203, y1: 266, w0: 31, w1: 84, n: 5, sc: 6.5 },
  mid: { y0: 252, y1: 320, w0: 70, w1: 106, n: 6, sc: 7 },
  low: { y0: 305, y1: 366, w0: 94, w1: 120, n: 7, sc: 6, lift: 10 },
};
export const TIER_MID = [CX, 258];
export const TIER_LOW = [CX, 311];
// (the low tier's hem lifted at the front, so her toes peek out)
const lift = (x, t) => (t.lift ?? 0) * Math.max(0, 1 - ((x - CX) / 46) ** 2);
// The hem's scallops, left to right: `n` soft round bumps hanging below y1 - sc.
function hemPts(t, inset = 0, steps = 5) {
  const out = [];
  const x0 = CX - t.w1 + inset;
  const x1 = CX + t.w1 - inset;
  for (let i = 0; i < t.n; i++) {
    for (let k = 0; k <= steps; k++) {
      if (i && !k) continue;
      const u = (i + k / steps) / t.n;
      const x = x0 + (x1 - x0) * u;
      const y = t.y1 - t.sc + Math.sin((k / steps) * Math.PI) * t.sc + Math.sin(u * Math.PI) * 3 - lift(x, t) - inset * 0.6;
      out.push([x, y]);
    }
  }
  return out;
}
const sidePts = (t, o) => [[CX + t.w0 * o, t.y0], [CX + (t.w0 + (t.w1 - t.w0) * 0.62) * o, t.y0 + (t.y1 - t.y0) * 0.3], [CX + t.w1 * 0.985 * o, t.y0 + (t.y1 - t.y0) * 0.7], [CX + t.w1 * o, t.y1 - t.sc]];
const tierPts = (t) => [...sidePts(t, -1), ...hemPts(t), ...sidePts(t, 1).reverse()];
// One tier: its body in `c` (light, base, shade, deep), lit down the front, shaded round its sides, two
// soft folds a side falling to the scallops' joins, a piped rope along its hem in `trim`.
function tier(t, c, trim) {
  const out = [mass(tierPts(t), c[1])];
  const h = t.y1 - t.y0;
  for (const o of [-1, 1]) {
    // the shade round its side, the sheen inside it
    out.push(fill([[CX + (t.w0 + 6) * o, t.y0 + 4], [CX + (t.w0 + (t.w1 - t.w0) * 0.62 - 2) * o, t.y0 + h * 0.32], [CX + (t.w1 - 3) * o, t.y1 - t.sc - 2], [CX + (t.w1 - 18) * o, t.y1 - t.sc - 1], [CX + (t.w0 + (t.w1 - t.w0) * 0.4) * o, t.y0 + h * 0.4]], c[2]));
    out.push(fill([[CX + (t.w0 * 0.35) * o, t.y0 + 5], [CX + (t.w0 * 0.75) * o, t.y0 + 5], [CX + (t.w1 * 0.5) * o, t.y1 - t.sc - 4], [CX + (t.w1 * 0.32) * o, t.y1 - t.sc - 4]], c[0]));
    for (const k of [0.42, 0.72]) out.push(...band(curve([[CX + t.w0 * k * o, t.y0 + 6], [CX + (t.w0 + t.w1) * 0.5 * k * o, t.y0 + h * 0.55], [CX + t.w1 * k * o, t.y1 - t.sc - 2]], 3), 0.7, 2.2, c[3], true));
  }
  // the piped rope along the hem: a soft round rope, lit along its top, a shade under it
  const rope = hemPts(t, 3, 4).map(([x, y]) => [x, y - 2.6]);
  out.push(...band(rope, 4.2, 4.2, trim[1], false));
  out.push(...band(rope.map(([x, y]) => [x, y - 1.1]), 1.4, 1.4, trim[0], false).map(F));
  out.push(...band(rope.map(([x, y]) => [x, y + 1.6]), 0.8, 0.8, trim[2], false).map(F));
  return out;
}
// The lace ruffle under the low tier: one soft white scalloped frill, its own fine fold lines.
function laceRuffle() {
  const t = { ...TIERS.low, y1: TIERS.low.y1 + 6, sc: 4.5, n: 12, w1: TIERS.low.w1 - 3 };
  const pts = [[CX - t.w1 + 2, TIERS.low.y1 - 12], ...hemPts(t, 0, 4), [CX + t.w1 - 2, TIERS.low.y1 - 12]];
  const out = [mass(pts, '#ffffff')];
  for (let i = 1; i < t.n; i++) {
    const x = CX - t.w1 + (2 * t.w1 * i) / t.n;
    out.push(...band(curve([[x, TIERS.low.y1 - 4 - lift(x, t)], [x, t.y1 - 3 - lift(x, t)]], 2), 0.5, 0.9, '#f0dce6', true).map(F));
  }
  return out;
}
const tierTop = () => tier(TIERS.top, ROSE, [CREAM[0], CREAM[1], CREAM[3]]);
function tierMid() {
  const t = TIERS.mid;
  const out = tier(t, CREAM, ['#ffd0e0', ROSE[1], ROSE[3]]);
  // caught up at two of the scallops' joins with a bow, a strawberry at the front between them
  for (const i of [2, 4]) {
    const x = CX - t.w1 + (2 * t.w1 * i) / t.n;
    const y = t.y1 - t.sc - 3 + Math.sin((i / t.n) * Math.PI) * 3;
    out.push(...ribbonBow(x, y - 4, 0.85));
  }
  out.push(...strawberry(CX, t.y1 - 4, 1.4, 0.12));
  return out;
}
function tierLow() {
  const t = TIERS.low;
  const out = [...laceRuffle(), ...tier(t, ROSE, [CREAM[0], CREAM[1], CREAM[3]])];
  for (const [x, r] of [[CX - 72, -0.2], [CX + 72, 0.2]]) out.push(...strawberry(x, t.y1 - 18, 1.3, r));
  return out;
}
// Her little satin slippers (on the gait's feet; only the toes show under the hem): rose satin, a
// cream bow on the toe, the far one a shade deeper.
function slipper(k) {
  const [ax, ay] = k === 'N' ? [162.6, 360] : [137.4, 360];
  const c = k === 'N' ? [ROSE[0], ROSE[1], ROSE[2]] : [ROSE[1], ROSE[2], ROSE[3]];
  return [
    mass([[ax - 7, ay - 4], [ax + 3, ay - 3], [ax + 11, ay + 4], [ax + 15, ay + 10], [ax + 13, 376], [ax - 5, 376], [ax - 8, ay + 9]], c[1]),
    fill([[ax + 2, ay + 1], [ax + 9, ay + 5], [ax + 12, ay + 10], [ax + 7, ay + 9]], c[0]),
    fill([[ax - 6, 372], [ax + 13, 372], [ax + 12, 376], [ax - 5, 376]], c[2]),
    E(ax + 9, ay + 4.6, 2.2, 1.7, CREAM[1]), F(E(ax + 8.4, ay + 4, 0.8, 0.6, '#ffffff')),
  ];
}

// The bodice, in two pieces so it stays on her as she bends (the player, 2026-11-25: "her dress isn't
// covering her torso, it's showing, and it's not locked to it"): cut a little wider than her body
// everywhere, and no bare torso drawn under it at all.
//   - bodiceTop, on her chest: her bare shoulders and neckline above a sweetheart neck of lace; the
//     corseted strawberry-pink bodice, a cream front laced in gold, a strawberry cameo; a satin
//     waist ribbon with a little bow, over the seam;
//   - bodiceLow, on her waist: the corset's pointed basque waist flaring over her hips, its cream
//     front still laced, a lace peplum over the skirt's waist.
// (Her body: shoulders at y 125 and chest at 144 both 31 either side of x 151, the waist at 182
// 21.6, the hips at 220 32.6; her chest bends about the ribs at y 167, her waist about the navel at
// y 195.)
const lacing = (ys) => ys.flatMap((y) => [...arc([[146, y], [156, y + 4]], 0.7, GOLD[2]), ...arc([[156, y], [146, y + 4]], 0.7, GOLD[2]), F(E(145.6, y + 2, 0.7, 0.7, GOLD[0])), F(E(156.4, y + 2, 0.7, 0.7, GOLD[0]))]);
const bodiceTop = () => [
  // her shoulders and neckline (skin), shaded under the lace and down the breastbone
  blob([[116, 130], [121, 116], [136, 110], [151, 109], [166, 110], [181, 116], [186, 130], [151, 136]], SK.base, 2),
  F(blob([[120, 127], [151, 131], [182, 127], [180, 132], [151, 136], [122, 132]], SK.sh, 1)), F(E(141, 119, 7, 3, SK.lt)), F(E(161, 119, 7, 3, SK.lt)),
  // the bodice: cut out past her chest, narrowing to her waist
  mass([[115, 128], [124, 122], [137, 121], [151, 128], [165, 121], [178, 122], [187, 128], [186, 146], [182, 164], [178, 180], [151, 184], [124, 180], [120, 164], [116, 146]], ROSE[1]),
  fill([[118, 132], [130, 127], [134, 178], [124, 176], [120, 156]], ROSE[0]), fill([[172, 128], [184, 132], [182, 158], [177, 178], [168, 179]], ROSE[2]),
  ...band(curve([[136, 132], [134, 156], [136, 178]], 3), 0.7, 0.6, ROSE[3], true), ...band(curve([[166, 132], [168, 156], [166, 178]], 3), 0.7, 0.6, ROSE[3], true),
  // the cream front, laced in gold
  mass([[141, 132], [161, 132], [160, 182], [142, 182]], CREAM[1]), F(blob([[143, 134], [148, 134], [147, 180], [143, 180]], '#ffffff', 1)),
  ...lacing([158, 166]),
  ...lace([[115, 127], [124, 122], [137, 121], [151, 128], [165, 121], [178, 122], [187, 127]], 6),
  // the cameo: a gold oval, a cream ground, a strawberry in relief
  E(151, 148, 7, 8.4, GOLD[2]), F(E(151, 148, 5.6, 7, '#fff6ea')), ...strawberry(151, 148.6, 1.1), F(E(149, 143, 1.6, 1, '#ffffff')),
  // the waist ribbon over the seam, a little bow at the front
  ...band(curve([[121, 174], [151, 180], [181, 174]], 3), 5.4, 5.4, ROSE[3], true), ...band(curve([[122, 172.6], [151, 178.4], [180, 172.6]], 3), 1.4, 1.4, ROSE[2], true),
  ...ribbonBow(151, 179, 0.8, ROSE),
];
const bodiceLow = () => [
  // the basque: from above the seam (hidden under the ribbon) to a point over the skirt, flaring
  // out past her hips
  mass([[123, 166], [179, 166], [177, 182], [180, 196], [178, 208], [164, 214], [151, 226], [138, 214], [124, 208], [122, 196], [125, 182]], ROSE[1]),
  fill([[126, 170], [136, 170], [137, 210], [128, 206], [125, 194]], ROSE[0]), fill([[168, 170], [176, 172], [177, 200], [170, 210], [165, 210]], ROSE[2]),
  ...band(curve([[136, 172], [137, 196], [140, 214]], 3), 0.7, 0.6, ROSE[3], true), ...band(curve([[166, 172], [165, 196], [162, 214]], 3), 0.7, 0.6, ROSE[3], true),
  mass([[142, 168], [160, 168], [159, 214], [151, 222], [143, 214]], CREAM[1]), F(blob([[143.6, 170], [148, 170], [147.6, 212], [144, 210]], '#ffffff', 1)),
  ...lacing([186, 196, 206]),
  // the lace peplum over the skirt's waist
  ...lace([[124, 206], [138, 214], [151, 225], [164, 214], [178, 206]], 7, '#ffffff', '#f0dce6'),
];
// The sleeves: huge puffed gigot sleeves (a great puff at the shoulder in pink with cream stripes,
// tied off above the elbow with a ribbon), a fitted forearm, a lace cuff falling over the wrist.
const J = { shN: [181, 125], elN: [185.9, 166], wrN: [186.7, 203], shF: [119, 125], elF: [114.1, 166], wrF: [113.3, 203] };
const puff = (k) => {
  const [sh, el] = [J[`sh${k}`], J[`el${k}`]];
  const o = k === 'N' ? 1 : -1;
  const c = toward(sh, el, 0.42);
  return [
    // (the fitted upper sleeve under the puff, wider than her arm, down past the elbow)
    ...band([sh, toward(sh, el, 1.06)], 15, 13, ROSE[1], true), ...band([toward(sh, el, 0.5), toward(sh, el, 1)], 2, 1.6, ROSE[0], true),
    mass([[sh[0] - 14 * o, sh[1] - 8], [sh[0] + 4 * o, sh[1] - 14], [sh[0] + 20 * o, sh[1] - 4], [c[0] + 18 * o, c[1]], [c[0] + 10 * o, c[1] + 16], [c[0] - 6 * o, c[1] + 18], [sh[0] - 14 * o, sh[1] + 12]], ROSE[1]),
    fill([[sh[0] - 8 * o, sh[1] - 8], [sh[0] + 6 * o, sh[1] - 11], [sh[0] + 2 * o, sh[1] + 4], [sh[0] - 8 * o, sh[1] + 2]], ROSE[0]),
    fill([[c[0] + 6 * o, c[1] + 2], [c[0] + 16 * o, c[1]], [c[0] + 9 * o, c[1] + 14], [c[0] + 2 * o, c[1] + 14]], ROSE[2]),
    ...[-0.5, 0.1, 0.6].flatMap((u) => [...band(curve([[sh[0] + u * 16 * o, sh[1] - 10], [c[0] + u * 14 * o + 4 * o, c[1] + 4], [c[0] + u * 10 * o, c[1] + 15]], 3), 2.2, 1.6, CREAM[1], true)]),
    ...band([[c[0] - 8 * o, c[1] + 16], [c[0] + 12 * o, c[1] + 13]], 3.2, 3.2, ROSE[3], true), F(E(c[0] + 2 * o, c[1] + 15, 2.4, 2.2, ROSE[2])),
  ];
};
// The forearm's sleeve: fitted, a little wider than her arm all the way (no skin shows beside it,
// the player, 2026-11-25), a rounded elbow so a bend never shows a seam, and a bell of lace at the
// wrist falling over the top of her hand, so the hand comes out from under it.
const forearm = (k) => {
  const [el, wr] = [J[`el${k}`], J[`wr${k}`]];
  const end = toward(el, wr, 0.97);
  return [
    E(el[0], el[1], 6.6, 6.6, ROSE[1]), ...band([toward(el, J[`sh${k}`], 0.1), el, end], 13, 11.4, ROSE[1], true),
    ...band([toward(el, J[`sh${k}`], 0.05), toward(el, end, 0.85)], 2, 1.5, ROSE[0], true),
    ...lace([[end[0] - 7.4, end[1] - 0.6], [end[0], end[1] + 3.6], [end[0] + 7.4, end[1] - 0.6]], 5.6),
  ];
};
// The great spoon: a gold handle with a twisted grip and a pink gem, a silver bowl heaped with cream
// and a strawberry; held at the end of its handle, the bowl standing beside her chin.
export const SPOON_GRIP = [186.7, 205];
const spoon = () => {
  const [x, y] = SPOON_GRIP;
  const top = [x + 5, y - 92];
  return [
    ...band([[x - 0.6, y + 10], top], 4.2, 3.6, GOLD[1], true), ...band([[x - 1.6, y + 8], [top[0] - 1.2, top[1] + 4]], 1.2, 1, GOLD[0], true), ...band([[x + 0.6, y + 8], [top[0] + 1, top[1] + 4]], 0.8, 0.6, GOLD[3], true),
    ...[0, 1, 2, 3].map((i) => F(E(x - 0.2 + i * 0.1, y + 6 - i * 3.6, 2.4, 0.9, GOLD[2]))),
    E(x + 1.4, y - 40, 3, 3, '#ff6a9a'), F(E(x + 0.6, y - 41, 1, 0.8, '#ffffff')),
    blob([[top[0] - 12, top[1] + 4], [top[0] + 12, top[1] + 2], [top[0] + 13, top[1] - 16], [top[0], top[1] - 26], [top[0] - 12, top[1] - 16]], '#d8dce8', 3),
    F(blob([[top[0] - 8, top[1] - 2], [top[0] - 2, top[1] - 2], [top[0] - 4, top[1] - 20], [top[0] - 9, top[1] - 14]], '#ffffff', 2)), F(blob([[top[0] + 6, top[1]], [top[0] + 11, top[1] - 4], [top[0] + 10, top[1] - 16], [top[0] + 7, top[1] - 14]], '#b8bccc', 2)),
    ...piping([[top[0] - 12, top[1] - 18], [top[0] - 4, top[1] - 26], [top[0] + 6, top[1] - 26], [top[0] + 13, top[1] - 18]], 4.6),
    ...strawberry(top[0] + 1, top[1] - 33, 1.7, 0.15),
  ];
};
export const SPOON_BOWL = [SPOON_GRIP[0] + 5, SPOON_GRIP[1] - 108];

const cache = new Map();
// Her pieces in one expression (each named for the bone it rides on):
//   sheet       the long hair down her back (on a spring); drillF/N: the drill ringlets (springs)
//   head        her face, the fringe's top, its lines, the forehead shade, her brows
//   sideF/N     the side hair over her ears (on springs); crown: the crown (a small spring)
//   tierTop/Mid/Low  the skirt's three tiers, each on its own spring from the seam above (the low one
//               with its lace ruffle); footF/N: her slippers, on the gait's feet
//   bodiceTop   her neckline and the bodice to the waist ribbon (on her chest); bodiceLow: the
//               pointed corset waist and the peplum (on her waist)
//   puffF/N     the gigot sleeves' puffs; foreF/N: the fitted forearms and lace cuffs; spoon
export function bonbonDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const f = FACES[key];
  const groups = {
    sheet: inHead(sheet()),
    drillF: inHead(drill(-1)),
    drillN: inHead(drill(1)),
    head: inHead([...face(f), ...foreheadShade(), fringeTop(), ...fringeLines(), ...brows(f.b)]),
    sideF: inHead(sideHair(-1)),
    sideN: inHead(sideHair(1)),
    crown: crown(),
    // (the tiered skirt since 2026-11-27, in place of the one-piece crinoline, petticoat and swags)
    tierLow: tierLow(),
    tierMid: tierMid(),
    tierTop: tierTop(),
    footF: slipper('F'),
    footN: slipper('N'),
    bodiceTop: bodiceTop(),
    bodiceLow: bodiceLow(),
    puffF: puff('F'),
    puffN: puff('N'),
    foreF: forearm('F'),
    foreN: forearm('N'),
    spoon: spoon(),
  };
  cache.set(key, groups);
  return groups;
}
// (her head alone, for picking looks)
export const bonbonHead = (mood = 'idle') => {
  const g = bonbonDesign(mood);
  return [...g.sheet, ...g.drillF, ...g.drillN, ...g.head, ...g.sideF, ...g.sideN, ...g.crown];
};
export const MOUTH = H2B([0, 25]);
export const SIDE_F = H2B([-40, -12]);
export const SIDE_N = H2B([40, -12]);
export const SKIRT_ROOT = [CX, SKIRT_TOP];
export const SWAG_LOW = [CX, 318];
export const SWAG_HIGH = [CX, 262];
