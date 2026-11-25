// The Lamplighter Wisp's design (2026-11-24, the player's pick "A" of three for the Lantern Wisp): a
// little ghost lamplighter of the Moonlit Manor, on the spirit base. Each piece of her, in the base's
// own drawing units (blankBody('spirit'), read only), named for the bone it rides on (spiritrig.js):
//   hairB      her soft lilac bob behind her head
//   head       her face (each expression), fringe and peaked cap
//   lower      her wisp: lavender smoke, curling up at the tip
//   sleeveFu/Fu, sleeveFf/Nf   the coat's navy sleeves over the base's own (skin) arms, white cuffs
//   coatSkirt  the coat's skirts flaring open over the top of the wisp (on the hips)
//   coatTop    the coat over her chest, its gold buttons (on the chest)
//   collar     a white sailor collar round her neck
//   pole       the lamplighter's brass pole in her near hand, crooked at the top
//   lantern    the lantern hanging from the crook (it swings on its own)
// Her body under the clothes is the base's own skin (spiritrig.js), in her pale ghost tones. Her head, hair and
// face are her own, drawn here from scratch (nothing of the player character's: the player's rule).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob, HS, mapShape } from '../mobs/kidbase.js';
import { blankBody } from '../mobs/blankbases.js';
import { BLANK } from '../mobs/blankbase.js';
import { FACE_OF, STYLES } from './faces.js';

// (her ghostly pale lavender skin, with her face: faces.js Ghost Glow)
export const SKIN_COLORS = STYLES.glow.skin;
const HX = 106;
const NECK = 95;
const HY0 = NECK - 31 * HS;
const inHead = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY0 + y * HS], HS));
export const C = {
  coat: '#3c4a8a', coatLt: '#4e5ea6', coatDk: '#2a3266', gold: '#ffd36a', goldSh: '#e0a41c',
  cuff: '#f4efff', brass: '#c8963a', brassLt: '#ecc068', brassDk: '#9a6c22', iron: '#2a2a3e', ironLt: '#454a66',
  flame: '#ffb347', flameIn: '#ffe9a0', glass: '#fff3c4',
  wisp: ['#f4efff', '#d8ccf4', '#b4a4e0', '#9484c8'],
};
// Where the pole's crook ends (the lantern hangs from it), and the flame's middle, in base units.
export const CROOK = [146, 46];
export const FLAME = [146, 66];
export const MOUTH = [106, 88];

// ---------- Her face ----------
// Her own (faces.js, the player's pick: Ghost Glow): e the eyes, m the mouth, brow fierce.
const FACES = {
  idle: { e: 'open', m: 'calm' },
  blink: { e: 'blink', m: 'calm' },
  happy: { e: 'happy', m: 'open' },
  o: { e: 'wide', m: 'o' },
  angry: { e: 'open', m: 'open', brow: true },
  hurt: { e: 'squeeze', m: 'wobble' },
  sleepy: { e: 'sleepy', m: 'o' },
  blow: { e: 'happy', m: 'blow' },
};
// ---------- Her head: her own face shape and her own soft lilac bob ----------
const HAIR = { base: '#c8b8f0', sh: '#a898d8', dk: '#8a7ac4', lt: '#e6dcff' };
// (the head's units: her eyes at y 10, her mouth at 23, her chin about 31)
export const HAIR_BACK = [
  blob([[-36, -30], [-44, -6], [-45, 14], [-42, 30], [-33, 39], [-22, 35], [-12, 39], [0, 36], [12, 39], [22, 35], [33, 39], [42, 30], [45, 14], [44, -6], [36, -30], [0, -46]], HAIR.sh, 4),
  F(blob([[-40, 20], [-36, 34], [-24, 33], [-28, 22]], HAIR.dk, 3)),
  F(blob([[40, 20], [36, 34], [24, 33], [28, 22]], HAIR.dk, 3)),
];
// the fringe: five soft rounded clumps over her brow, the middle one longest; then a side lock each
// side down past her cheek, its end curling in under her jaw; a shine across the crown
const clump = (x, top, tip, w) => blob([[x - w, top], [x + w, top], [x + w * 0.85, tip - 7], [x + w * 0.35, tip - 1], [x, tip], [x - w * 0.35, tip - 1], [x - w * 0.85, tip - 7]], HAIR.base, 3);
const lock = (o) => blob([[30 * o, -18], [38 * o, -6], [40 * o, 10], [38 * o, 24], [33 * o, 31], [26 * o, 31], [28 * o, 25], [31 * o, 18], [30 * o, 4], [26 * o, -8]], HAIR.base, 3);
export const FRINGE = [
  blob([[-36, -24], [-26, -40], [0, -47], [26, -40], [36, -24], [30, -12], [-30, -12]], HAIR.base, 4),
  clump(-22, -24, -5, 8), clump(22, -24, -5, 8), clump(-10, -26, -2, 8), clump(10, -26, -2, 8), clump(0, -28, 0, 8),
  lock(-1), lock(1),
  ...band(curve([[-14, -2], [-12, -12], [-10, -22]], 2), 0.8, 0.5, HAIR.sh, true), ...band(curve([[14, -2], [12, -12], [10, -22]], 2), 0.8, 0.5, HAIR.sh, true),
  ...band(curve([[-22, -32], [-8, -38], [8, -38], [22, -32]], 3), 1.6, 1.6, HAIR.lt, true),
];
export const CAP = [blob([[-30, -30], [-24, -46], [0, -52], [24, -46], [30, -30], [0, -26]], C.coat), F(blob([[-20, -44], [0, -49], [18, -44], [0, -46]], C.coatLt)), blob([[-34, -30], [34, -30], [40, -24], [-6, -22], [-34, -25]], C.coatDk), F(E(0, -38, 4, 3.4, C.gold)), F(E(-0.8, -38.8, 1.6, 1.3, '#fff0b8'))];

// ---------- The pieces ----------
const cache = new Map();
export function wispDesign(mood = 'idle') {
  const f = FACES[mood] ?? FACES.idle;
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const body = blankBody('spirit', { tpose: false, guides: false });
  const J = body.J;
  const recolor = (list, pal) => list.map((sh) => ({ ...sh, c: { [BLANK.lt]: pal[0], [BLANK.base]: pal[1], [BLANK.sh]: pal[2], [BLANK.deep]: pal[3] }[sh.c] ?? sh.c }));
  // her wisp, with soft swirls of light smoke along it and a curl at the tip
  const lower = [...recolor(body.groups.lower, C.wisp), ...band(curve([[96, 140], [92, 156], [88, 170], [82, 180]], 3), 2.4, 0.8, '#f4efff', true), ...band(curve([[112, 144], [114, 158], [108, 172]], 3), 1.8, 0.6, '#c4b6ec', true)];
  // a sleeve: a tube along the arm's bone at rest, round at both ends, the cuff on the forearm
  const tube = (a, b, w0, w1) => [...band([a, b], w0, w1, C.coat, true), F(E(a[0], a[1], w0 / 2, w0 / 2, C.coat)), F(E(b[0], b[1], w1 / 2, w1 / 2, C.coat))];
  const fore = (side) => {
    const el = J[`el${side}`];
    const wr = J[`wr${side}`];
    const end = [el[0] + (wr[0] - el[0]) * 0.78, el[1] + (wr[1] - el[1]) * 0.78];
    return [...tube(el, end, 7.6, 7.8), ...band([[end[0], end[1] - 1.4], [end[0], end[1] + 1.6]], 9, 9, C.cuff, true)];
  };
  const upper = (side) => [...tube(J[`sh${side}`], J[`el${side}`], 9, 7.8), F(E(J[`sh${side}`][0], J[`sh${side}`][1] + 1, 5.6, 4.4, C.coatLt))];
  const groups = {
    hairB: inHead(HAIR_BACK),
    sleeveFu: upper('F'),
    sleeveFf: fore('F'),
    sleeveNu: upper('N'),
    sleeveNf: fore('N'),
    lower,
    coatSkirt: [blob([[88, 118], [122, 118], [124, 128], [131, 148], [118, 141], [106, 151], [94, 141], [81, 148], [88, 128]], C.coat), F(blob([[97, 120], [115, 120], [113, 139], [106, 147], [99, 139]], C.coatLt)), F(E(106, 130, 1.6, 1.6, C.gold)), F(E(106, 139, 1.5, 1.5, C.gold))],
    coatTop: [blob([[90, 99], [122, 99], [124, 112], [123, 124], [89, 124], [88, 112]], C.coat), F(blob([[97, 103], [115, 103], [114, 123], [98, 123]], C.coatLt)), F(E(106, 110, 1.6, 1.6, C.gold)), F(E(106, 119, 1.6, 1.6, C.gold))],
    collar: [blob([[93, 97], [106, 104], [119, 97], [118, 102], [106, 109], [94, 102]], C.cuff), F(blob([[103, 104], [109, 104], [106, 108]], '#d84a6a'))],
    head: inHead([...FACE_OF.glow(f.e, f.m, f.brow), ...FRINGE, ...CAP]),
    // the pole up from her near hand, a crook at the top
    pole: [...band([[121, 172], [121.6, 70], [124, 52], [128, 42]], 2.4, 2.2, C.brass, true), ...band(curve([[128, 42], [134, 35], [142, 36], [146, 42]], 3), 2, 1.8, C.brass, true), ...band([[120.6, 160], [121.4, 72]], 0.7, 0.6, C.brassLt, true), F(E(121, 172, 2, 1.6, C.brassDk))],
    // the lantern on its hook: an iron hood and a ring, warm glass, its flame, an iron foot
    lantern: [
      ...band([[146, 42], [146, 49]], 1.2, 1.2, C.iron, true),
      blob([[139, 50], [153, 50], [155, 56], [154, 77], [138, 77], [137, 56]], C.iron),
      F(blob([[141, 56], [151, 56], [152, 75], [140, 75]], C.glass)),
      F(blob([[146, 59], [149.5, 65], [149, 70], [146, 72], [143, 70], [142.5, 65]], C.flame)),
      F(blob([[146, 63], [148, 67], [147.6, 70], [146, 71], [144.4, 70], [144, 67]], C.flameIn)),
      ...band([[141.5, 57], [141.5, 74]], 0.8, 0.8, '#ffffff', true),
      blob([[136, 76], [156, 76], [152, 81], [140, 81]], C.iron), blob([[140, 46], [152, 46], [154, 51], [138, 51]], C.iron), F(blob([[142, 47], [150, 47], [151, 49], [141, 49]], C.ironLt)),
    ],
  };
  cache.set(key, groups);
  return groups;
}
export const WISP_FACES = Object.keys(FACES);
