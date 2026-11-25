// The Candelabra Bride's design (2026-11-24, the player's pick "B" of three for the Candle Bride): a
// gothic bride of the Moonlit Manor, on the maiden base. Each piece of her, in the base's own drawing
// units (blankBody('maiden'), read only), named for the bone it rides on (bridalrig.js):
//   veil       her sheer black veil from her shoulders to the floor (behind everything)
//   hairB      her long plum hair behind her
//   sleeveFu/Ff, sleeveNu/Nf   long black lace sleeves, cream lace at the cuffs
//   skirt      the black lace gown from the waist to the floor, its wine satin underskirt
//   bodice     the high black lace bodice, little wine buttons
//   collar     the high lace collar round her neck with its rose brooch
//   curls      the two big round curls on her shoulders
//   head       her face (each expression), her bangs and face-framing locks, the little headdress
//   candelabra the brass candelabra in her near hand, its three candles (their flames live: index.js)
// Her hair and face are her own, drawn here from scratch (nothing of the player character's: the
// player's rule, 2026-11-24). Her body under the clothes is the base's own skin (bridalrig.js).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob, mapShape } from '../mobs/kidbase.js';
import { blankBody } from '../mobs/blankbases.js';

export const SKIN_COLORS = { lt: '#fff8f4', base: '#fbe6dc', sh: '#ecc8bc', deep: '#d8a89a' };
export const C = {
  lace: '#2e2440', laceLt: '#463a5e', wine: '#6a1e3a', wineLt: '#8e3456', veil: '#4a3a5a', cream: '#f4e8d8', creamSh: '#e0d0bc',
  hair: '#6a3a6a', hairDk: '#5a2a5a', hairLt: '#9a6a9a', curl: '#7a4a7a', rose: '#c84a6a',
  brass: '#c8963a', brassLt: '#ecc068', brassDk: '#9a6c22', wax: '#fff6e6', ink: '#2a1a3a',
};
// The candles' flames (the live glow sits on them) and the candelabra's grip, in base units.
export const FLAMES = { flameL: [106, 98], flameM: [118, 91], flameR: [130, 98] };
const HX = 101;
const HS = 0.66;
const HY0 = 86 - 31 * HS;
const inHead = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY0 + y * HS], HS));
const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);
const scallops = (x0, x1, y, r, c) => Array.from({ length: Math.round((x1 - x0) / (r * 1.6)) + 1 }, (_, i) => E(x0 + i * r * 1.6, y, r, r * 0.8, c));

// ---------- Her face (her own: rich almond eyes, crease, shadow, lashes, a beauty mark, berry lips) ----------
// e: 'calm' | 'open' | 'blink' | 'happy' | 'narrow' | 'squeeze' | 'wide'; m: 'flat' | 'calm' | 'smile' | 'o' | 'frown'.
// (2026-11-24, the player: "she should also look emotionless": a blank, doll-like calm whatever
// happens: half-lidded eyes, level brows, a flat mouth; fighting she only narrows her eyes, hit she
// only shuts them.)
const FACES = {
  idle: { e: 'calm', m: 'flat' },
  blink: { e: 'blink', m: 'flat' },
  happy: { e: 'calm', m: 'flat' },
  hum: { e: 'calm', m: 'flat' },
  o: { e: 'calm', m: 'flat' },
  angry: { e: 'narrow', m: 'flat' },
  hurt: { e: 'blink', m: 'flat' },
};
function face(e, m) {
  const out = [blob([[-33, -14], [-34, 6], [-29, 22], [-17, 31], [0, 34], [17, 31], [29, 22], [34, 6], [33, -14], [0, -30]], SKIN_COLORS.base, 4)];
  const brow = false;
  for (const o of [-1, 1]) {
    const x = 14 * o;
    // (u: toward the outer corner, mirrored each side)
    const P = (u, v) => [x + u * o, v];
    // her brows: thin and arched (fierce: slanting down to her nose)
    out.push(...arc(brow ? [P(-7, 3.6), P(0, 1.4), P(7, -0.6)] : [P(-7, 1.6), P(0, -0.6), P(7.4, 0.8)], 1.2, C.hairDk));
    if (e === 'blink' || e === 'happy') {
      const up = e === 'happy' ? -4 : 2.4;
      out.push(...arc([P(-8, 12), P(0, 12 + up), P(8.4, 11)], 2.4, C.ink), ...arc([P(8.4, 11), P(10.6, 9.4)], 1.2, C.ink), ...arc([P(7.4, 11.4 + up * 0.3), P(9.6, 12.6 + up * 0.2)], 0.9, C.ink));
      continue;
    }
    if (e === 'squeeze') {
      out.push(...arc([P(8, 7.4), P(-1, 12), P(8, 16.6)], 2.2, C.ink));
      continue;
    }
    const lid = e === 'narrow' ? 3 : e === 'calm' ? 1.8 : e === 'wide' ? -1.4 : 0;
    // eyeshadow and the crease above the lid
    out.push(F(blob([P(-9, 11), P(-6, 4 + lid * 0.5), P(2, 2.6 + lid * 0.5), P(9.4, 6.6), P(9, 10.4), P(0, 7.4 + lid)], '#ecc8de', 3)));
    out.push(...arc([P(-7, 4.6 + lid * 0.4), P(0, 2.4 + lid * 0.4), P(7.6, 4.6)], 0.7, '#c49ab0'));
    // the eye's white, almond, a little tilted up at the outer corner
    out.push(blob([P(-8, 12.4), P(-4, 6.6 + lid), P(3, 6 + lid), P(8.2, 10.4), P(5, 16.4), P(-2, 17.6), P(-6.4, 16)], '#ffffff', 2));
    // the iris: a dark ring, violet, darker under the lid, lighter below, a slit of a pupil, two lights
    const iy = 12.4 + lid * 0.25;
    out.push(F(E(x, iy, 4.9, 5.6, '#3a1a5a')), F(E(x, iy + 0.4, 4, 4.8, '#7a4ad0')), F(E(x, iy + 2.6, 3.2, 2.2, '#b48af0')), F(E(x, iy - 2.4, 3.8, 1.8, '#4a2a8a')));
    out.push(F(E(x, iy, 1.3, 2.7, '#1a0a2a')), F(E(x - 1.8 * o, iy - 2.4, 1.7, 1.4, '#ffffff')), F(E(x + 1.9 * o, iy + 2.8, 0.8, 0.8, '#ffffff')));
    // (the lid's skin over the top of the eye when she narrows it)
    if (lid > 0) out.push(F(blob([P(-8.4, 11.6), P(-4, 5), P(3, 4.4), P(8.6, 9.4), P(3, 6 + lid), P(-4, 6.6 + lid)], SKIN_COLORS.base, 2)));
    // the upper lid line, thick, its lashes curling up and out at the corner
    out.push(...arc([P(-8.4, 12.2), P(-4.4, 6.2 + lid), P(3, 5.6 + lid), P(8.6, 9.8)], 2.4, C.ink));
    out.push(...arc([P(7.2, 8.4 + lid * 0.4), P(9.4, 6.4), P(10.6, 6.6)], 1, C.ink), ...arc([P(8.6, 9.8), P(11, 8.6), P(12, 9.2)], 1, C.ink), ...arc([P(5, 7 + lid * 0.6), P(6.4, 4.6 + lid * 0.4), P(7.6, 4.2)], 0.8, C.ink));
    // the lower lid, fine, two little lashes at its outer end
    out.push(...arc([P(-6, 16.6), P(0, 18), P(6.4, 16)], 0.8, '#9a6a8a'), ...arc([P(5, 16.6), P(6.4, 18.4)], 0.6, '#9a6a8a'), ...arc([P(6.8, 15.8), P(8.4, 17.2)], 0.6, '#9a6a8a'));
  }
  out.push(F(E(-21, 21.6, 3.4, 2, '#f6dcd4')), F(E(21, 22.2, 3.4, 2, '#f6dcd4')), F(E(15.4, 19.6, 0.9, 0.9, '#4a2a3a')));
  out.push(...arc([[-0.6, 18], [0.4, 19.6]], 0.7, '#e0b0a0'));
  if (m === 'flat') out.push(...arc([[-2.6, 24.8], [0, 25], [2.6, 24.8]], 1.2, '#8a2a4a'));
  else if (m === 'o') out.push(F(E(0, 25, 1.6, 1.9, '#9a2a4a')));
  else if (m === 'smile') out.push(F(blob([[-3.6, 23.6], [0, 24.4], [3.6, 23.6], [2, 26.6], [-2, 26.6]], '#9a2a4a', 2)));
  else if (m === 'frown') out.push(...arc([[-3.2, 26], [0, 24.2], [3.2, 26]], 1.4, '#9a2a4a'));
  else out.push(F(blob([[-3.4, 24], [0, 23.2], [3.4, 24], [1.6, 26.4], [-1.6, 26.4]], '#9a2a4a', 2)), F(E(0.6, 24.2, 1, 0.4, '#d85a7a')));
  return out;
}
// Her hair in front: soft rounded bangs across her brow (each clump leaning a little to one side),
// long locks framing her face past her cheeks, a shine; her little black headdress with its rose.
const bang = (x, top, tip, w, lean) => blob([[x - w, top], [x + w, top], [x + w * 0.8 + lean * 0.4, tip - 6], [x + lean * 0.6 + w * 0.3, tip - 0.6], [x + lean, tip], [x + lean * 0.6 - w * 0.3, tip - 0.6], [x - w * 0.8 + lean * 0.4, tip - 6]], C.hair, 3);
const lockS = (o) => blob([[30 * o, -16], [37 * o, -2], [38 * o, 14], [36 * o, 30], [31 * o, 34], [28 * o, 26], [29 * o, 10], [27 * o, -6]], C.hair, 3);
const FRINGE = [
  blob([[-36, -14], [-28, -38], [0, -46], [28, -38], [36, -14], [24, -16], [0, -20], [-24, -16]], C.hair, 4),
  bang(-23, -20, -2, 7, -1.4), bang(-11, -22, 0.6, 7.4, -1.6), bang(1, -22, 1.6, 7.4, -1.8), bang(13, -22, 0, 7, -1.6), bang(24, -20, -3, 6.4, -1.2),
  ...arc([[-17, -4], [-16, -14]], 0.8, C.hairDk), ...arc([[-5, -2], [-4.4, -13]], 0.8, C.hairDk), ...arc([[7, -2], [7.4, -13]], 0.8, C.hairDk), ...arc([[18.6, -5], [19, -14]], 0.8, C.hairDk),
  lockS(-1), lockS(1),
  ...arc([[-22, -32], [-8, -38], [8, -38], [22, -32]], 1.6, C.hairLt),
  E(-6, -42, 6, 4, C.lace), E(6, -42, 6, 4, C.lace), E(0, -42, 3, 3, C.rose), F(E(-0.6, -42.6, 1, 0.9, '#ff8aa8')),
];

// ---------- The pieces ----------
const cache = new Map();
export function brideDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const f = FACES[key];
  const J = blankBody('maiden', { tpose: false, guides: false }).J;
  const tube = (a, b, w0, w1, c) => [...band([a, b], w0, w1, c, true), F(E(a[0], a[1], w0 / 2, w0 / 2, c)), F(E(b[0], b[1], w1 / 2, w1 / 2, c))];
  const upper = (s) => [...tube(J[`sh${s}`], J[`el${s}`], 9, 7.6, C.lace), F(E(J[`sh${s}`][0], J[`sh${s}`][1] + 1, 5.6, 4.6, C.laceLt))];
  const fore = (s) => {
    const el = J[`el${s}`];
    const wr = J[`wr${s}`];
    const end = [el[0] + (wr[0] - el[0]) * 0.86, el[1] + (wr[1] - el[1]) * 0.86];
    return [...tube(el, end, 7.4, 8.4, C.lace), ...scallops(end[0] - 4, end[0] + 4, end[1] + 1.6, 1.6, C.cream)];
  };
  const groups = {
    veil: [blob([[86, 54], [116, 54], [132, 110], [138, 196], [64, 196], [72, 110]], C.veil), ...scallops(66, 136, 197, 3.4, C.veil), ...arc([[80, 70], [74, 130], [70, 190]], 0.8, '#5e4e70'), ...arc([[122, 70], [128, 130], [132, 190]], 0.8, '#5e4e70')],
    hairB: inHead([blob([[-36, -24], [-42, 10], [-40, 50], [-30, 66], [-16, 56], [16, 56], [30, 66], [40, 50], [42, 10], [36, -24], [0, -46]], C.hair, 4), ...arc([[-30, 0], [-32, 30], [-26, 54]], 1.2, C.hairDk), ...arc([[30, 0], [32, 30], [26, 54]], 1.2, C.hairDk)]),
    sleeveFu: upper('F'),
    sleeveFf: fore('F'),
    // (the gown black lace; the underskirt showing at the front deep wine satin, its sheen, black lace
    // scalloped down both its edges; the hem's lace a lighter black)
    skirt: [blob([[84, 112], [116, 112], [126, 160], [134, 200], [66, 200], [74, 160]], C.lace), F(blob([[94, 118], [106, 118], [111, 198], [89, 198]], C.wine)), F(blob([[100, 120], [104, 120], [107, 196], [101, 196]], C.wineLt)), ...[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].flatMap((k) => { const y = 122 + k * 7.4; const w = 6 + (y - 118) * 0.06; return [E(100 - w, y, 1.8, 2.4, C.laceLt), E(102 + w, y, 1.8, 2.4, C.laceLt)]; }), ...arc([[80, 140], [74, 196]], 0.8, C.laceLt), ...arc([[120, 140], [127, 196]], 0.8, C.laceLt), ...scallops(68, 132, 200, 2.8, C.laceLt)],
    // (a high bodice of black lace up to her collar, a row of little wine buttons down it)
    bodice: [blob([[86, 92], [94, 88], [108, 88], [116, 92], [118, 100], [118, 116], [84, 116], [84, 100]], C.lace), ...[96, 102, 108, 114].map((y) => F(E(101, y, 1.1, 1.1, C.wineLt))), ...arc([[88, 100], [86, 112]], 0.7, C.laceLt), ...arc([[114, 100], [116, 112]], 0.7, C.laceLt)],
    // the high lace collar round her neck, ruffled at the top, a rose brooch at the throat
    collar: [blob([[94, 81], [108, 81], [110, 91], [92, 91]], C.lace), ...scallops(93, 109, 81, 1.8, C.laceLt), E(101, 89.4, 2.6, 2.6, C.rose), F(E(100.4, 88.8, 1, 0.9, '#ff8aa8'))],
    curls: inHead([E(-36, 40, 10, 9, C.curl), E(36, 40, 10, 9, C.curl), ...arc([[-42, 38], [-36, 33], [-30, 38], [-36, 44]], 1.4, C.hairDk), ...arc([[30, 38], [36, 33], [42, 38], [36, 44]], 1.4, C.hairDk)]),
    head: inHead([...face(f.e, f.m), ...FRINGE]),
    // the candelabra: a stem with a foot, three arms, three white candles (their flames are live)
    candelabra: [...band([[118, 150], [118, 112]], 2.2, 2, C.brass, true), ...arc([[106, 112], [112, 118], [118, 118], [124, 118], [130, 112]], 1.6, C.brass), E(118, 150, 5, 2, C.brass), E(118, 128, 2.4, 1.6, C.brassLt), ...[[106, 112, 9], [118, 108, 12], [130, 112, 9]].flatMap(([x, y, h]) => [...band([[x, y], [x, y - h]], 2.6, 2.4, C.wax, true), E(x, y, 2.6, 1, C.brassDk), ...band([[x, y - h], [x, y - h - 1.4]], 0.6, 0.6, '#3a2a2a', true)])],
    sleeveNu: upper('N'),
    sleeveNf: fore('N'),
  };
  cache.set(key, groups);
  return groups;
}
export const BRIDE_FACES = Object.keys(FACES);
