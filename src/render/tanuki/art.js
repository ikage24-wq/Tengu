// The Tanuki Picker's design (2026-11-25, remade on the creature base, the player's pick "B, Tea Break"):
// a tea picker of the Tea Terraces on his contracted tea break, and in no hurry to end it.
//   - Tanuki fur over the creature base's own live body (its skin recoloured: warm brown, a cream
//     belly); his head and tail grown from the base's own shapes (read only): the dark tanuki mask
//     round both eyes, dark round ears with pale insides, a cream muzzle and a little dark nose, rosy
//     cheeks; a big fluffy tail with two dark rings and a pale tip; dark socks, dark paws.
//   - His own eyes (no one else has them): sleepy, half-lidded, a round dark eye under a heavy lid
//     with a long lash at the outer corner, a soft glint; they close happily over a sip, go wide when
//     he thinks the boss is coming, glance sideways, glare.
//   - A knotted white headband, its tails on a spring; a towel round his neck, one end hanging down
//     his front; a work apron full of pockets with tea-bag tags and a pencil; a thermos on his back
//     on a strap; and always, in his paw, a big steaming teacup.
// Each piece in the creature base's own drawing units (blankBody('creature'), read only), named for
// the bone it rides on (see tanukiDesign below).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob } from '../mobs/kidbase.js';
import { blankBody } from '../mobs/blankbases.js';
import { BLANK } from '../mobs/blankbase.js';

const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);
const taper = (pts, w0, w1, c) => band(curve(pts, 3), w0, w1, c, true);
export const SKIN = { lt: '#f0d2a8', base: '#c8925e', sh: '#a06e44', deep: '#7a5234' };
const FUR = [SKIN.lt, SKIN.base, SKIN.sh, SKIN.deep];
const MASK = '#5e3e2c';
const MASK_LT = '#7a5440';
const CREAM = '#fbeedd';
const INK = '#2a1a14';
const TOWEL = ['#ffffff', '#e8eef4', '#8ab0d8'];
const APRON = ['#e6d8b6', '#d8c8a4', '#c4b088', '#a8946c'];
const recolour = (list) => list.map((sh) => ({ ...sh, c: { [BLANK.lt]: FUR[0], [BLANK.base]: FUR[1], [BLANK.sh]: FUR[2], [BLANK.deep]: FUR[3] }[sh.c] ?? sh.c }));
const BASE = blankBody('creature', { tpose: false, guides: false }).groups;
// The base's joints (blankBody('creature').J) and its spine's bend points.
export const J = {
  neck: [91, 79], crown: [91, 38], hip: [90, 112], stern: [90, 82.8], ribs: [90, 100.4], navel: [90, 106.8], tail: [80, 110],
  shF: [76, 87], elF: [74.75, 97.4], wrF: [74.54, 106.8], shN: [104, 87], elN: [105.25, 97.4], wrN: [105.46, 106.8],
  hipF: [81.8, 112], kneeF: [81.8, 125], ankF: [81.8, 138], hipN: [98.2, 112], kneeN: [98.2, 125], ankN: [98.2, 138],
};
export const KNOT = [120, 46];
export const TOWEL_END = [99, 88];
export const CUP = [111, 103];
export const STEAM = [111, 94];
export const MOUTH = [91, 75];

// ---------- his face ----------
// e: the eyes (sleepy, shut, happy, wide, side, glare, squeeze); m: the mouth; b: the brows' lean.
const FACES = {
  idle: { e: 'sleepy', m: 'smile' }, blink: { e: 'shut', m: 'smile' },
  sip: { e: 'happy', m: 'sip', cheeks: 1 }, blow: { e: 'sleepy', m: 'blow', cheeks: 1 }, content: { e: 'happy', m: 'smile' },
  worried: { e: 'side', m: 'wobble', sweat: 1 }, whistle: { e: 'up', m: 'whistle' }, doze: { e: 'shut', m: 'open' }, startle: { e: 'wide', m: 'o' },
  happy: { e: 'happy', m: 'open' }, angry: { e: 'glare', m: 'frown' }, shout: { e: 'glare', m: 'shout' }, hurt: { e: 'squeeze', m: 'wobble' },
  dead: { e: 'squeeze', m: 'wobble' }, sad: { e: 'sleepy', m: 'wobble' }, talk: { e: 'sleepy', m: 'open' }, sleep: { e: 'shut', m: 'smile' },
};
export const MOODS = Object.keys(FACES);
// Sleepy eyes (his own): a round dark eye under a heavy mask-coloured lid, the lid's edge a soft dark
// line, one long lash at the outer corner; `lid` how far down the lid sits; `look` the eye's turn.
function eye(x, y, o, kind) {
  const out = [];
  if (kind === 'shut' || kind === 'happy') {
    const up = kind === 'happy';
    out.push(...taper([[x - 5.4, y + (up ? 1.4 : -0.4)], [x, y + (up ? -2.4 : 1.8)], [x + 5.4, y + (up ? 1.4 : -0.4)]], 2.2, 2.2, INK));
    out.push(...taper([[x + 5 * o, y + (up ? 1 : -0.2)], [x + 7.6 * o, y + (up ? -0.8 : -1.4)]], 1.4, 0.4, INK));
    return out;
  }
  if (kind === 'squeeze') return [...taper([[x - 4 * o, y - 3], [x + 3 * o, y], [x - 4 * o, y + 3]], 2.2, 2.2, INK)];
  const wide = kind === 'wide';
  const lx = kind === 'side' ? 1.6 * -o : 0;
  const ly = kind === 'up' ? -1.4 : 0;
  const lid = { sleepy: 0.55, side: 0.4, up: 0.3, wide: 0, glare: 0.5 }[kind] ?? 0.5;
  const r = wide ? 6 : 5.2;
  out.push(E(x + lx, y + 1 + ly, r * 0.92, r, INK), F(E(x + lx, y + 2.4 + ly, r * 0.6, r * 0.5, '#5a3424')));
  out.push(F(E(x + lx - 1.6, y - 0.4 + ly, wide ? 2 : 1.6, wide ? 2 : 1.4, '#ffffff')), F(E(x + lx + 1.8, y + 3.2 + ly, 0.8, 0.8, '#ffffff')));
  // the lid: mask-coloured, down over the eye's top; for a glare it slants down toward the nose
  const top = y - r - 1;
  const edge = y - r + 1 + lid * r * 1.4;
  const gl = kind === 'glare' ? 2.6 : 0;
  const yIn = edge + gl;
  const yOut = edge - gl * 0.4;
  const [yL, yR] = o > 0 ? [yIn, yOut] : [yOut, yIn];
  if (lid > 0 || gl) {
    out.push(F(blob([[x - 7, yL], [x - 6.6, top - 1], [x + 6.6, top - 1], [x + 7, yR], [x, (yL + yR) / 2 + 0.4]], MASK, 2)));
    out.push(...taper([[x - 6.4, yL], [x, (yL + yR) / 2 + 0.3], [x + 6.4, yR]], 1.8, 1.8, INK));
  } else out.push(...taper([[x - 5.6, y - r + 1.6], [x, y - r - 0.6], [x + 5.6, y - r + 1.6]], 1.6, 1.6, INK));
  out.push(...taper([[x + 5.8 * o, (o > 0 ? yR : yL) - 0.2], [x + 8.4 * o, (o > 0 ? yR : yL) + 1.6]], 1.4, 0.4, INK));
  return out;
}
function mouth(m) {
  const ink = '#3a2620';
  if (m === 'sip') return [blob([[88.6, 74.6], [93.4, 74.6], [93, 77], [91, 77.6], [89, 77]], '#6a3a2a', 2)];
  if (m === 'blow' || m === 'whistle') return [E(m === 'blow' ? 93 : 92, 75.8, 1.6, 1.8, '#6a3a2a'), F(E(m === 'blow' ? 93 : 92, 76.2, 0.8, 0.9, '#c86a5a'))];
  if (m === 'open') return [blob([[87, 73.6], [95, 73.6], [94, 77], [91, 78.4], [88, 77]], '#6a3a2a', 2), F(E(91, 77, 2.4, 1, '#e88a7a'))];
  if (m === 'shout') return [blob([[86, 73], [96, 73], [95, 78.6], [91, 80.4], [87, 78.6]], '#5a2a1e', 2), F(E(91, 78.4, 3, 1.4, '#e88a7a')), F(T([[87.6, 73.4], [89.4, 73.4], [88.4, 75.6]], '#ffffff'))];
  if (m === 'o') return [E(91, 75.6, 1.8, 2.2, '#6a3a2a')];
  if (m === 'frown') return arc([[86, 76.6], [91, 74.2], [96, 76.6]], 1.2, ink);
  if (m === 'wobble') return arc([[86, 75.4], [88.6, 74.4], [91, 75.4], [93.4, 74.4], [96, 75.4]], 1.1, ink);
  return [...arc([[86, 73.6], [88.6, 75.6], [91, 74]], 1.1, ink), ...arc([[91, 74], [93.4, 75.6], [96, 73.6]], 1.1, ink)];
}
// His head: the base's own head (read only) in his fur, the dark ears, the mask, the muzzle and nose,
// the eyes and mouth of the moment, rosy cheeks, a sweat drop when worried, the headband.
function head(f) {
  const out = [...recolour(BASE.ears ?? []), ...recolour(BASE.head ?? [])];
  out.push(...[[70, 42], [112, 42]].flatMap(([x, y]) => [E(x, y, 8, 7.4, MASK), F(E(x + 0.6, y + 1, 4.4, 4, MASK_LT)), F(E(x - 1.6, y - 1.6, 2, 1.4, '#8a6450'))]));
  // the forehead's light and a few soft tufts of fur at the cheeks
  out.push(F(blob([[78, 46], [91, 42], [104, 46], [98, 50], [84, 50]], FUR[0], 2)));
  out.push(...[[66, 72, -1], [116, 72, 1]].flatMap(([x, y, s]) => [blob([[x, y - 6], [x + 4 * s, y - 2], [x + 2 * s, y + 4], [x - 2 * s, y + 6], [x - 1 * s, y]], FUR[1], 2)]));
  // the mask: a soft dark band round both eyes, dipping at the nose
  out.push(blob([[66, 58], [72, 51], [82, 52], [91, 57], [100, 52], [110, 51], [116, 58], [112, 67], [102, 69], [91, 64], [80, 69], [70, 67]], MASK, 3));
  out.push(F(blob([[70, 56], [76, 53], [82, 54], [78, 57]], MASK_LT, 2)), F(blob([[102, 54], [108, 53], [112, 56], [106, 57]], MASK_LT, 2)));
  // the muzzle, the nose
  out.push(blob([[79, 68], [85, 63], [91, 62], [97, 63], [103, 68], [100, 76.6], [91, 79.6], [82, 76.6]], CREAM, 3));
  out.push(blob([[87, 64.6], [95, 64.6], [94, 68], [91, 69.4], [88, 68]], INK, 2), F(E(89.6, 65.4, 1.4, 0.8, '#8a6a5a')));
  out.push(...arc([[91, 69.4], [91, 72.4]], 0.9, '#3a2620'));
  const e = f.e;
  out.push(...eye(81, 59, -1, e), ...eye(101, 59, 1, e));
  out.push(F(E(72, 71, f.cheeks ? 6 : 5, f.cheeks ? 3.6 : 3, '#f0a88c')), F(E(110, 71, f.cheeks ? 6 : 5, f.cheeks ? 3.6 : 3, '#f0a88c')));
  out.push(...mouth(f.m));
  if (f.sweat) out.push(blob([[114, 50], [117, 55], [116, 58], [113, 58], [112, 55]], '#a8dcff', 2), F(E(114, 56, 0.8, 1.2, '#ffffff')));
  // the headband: a white towel tied round his head, its blue stripe
  out.push(...arc([[64, 46], [91, 40], [118, 46]], 4.6, TOWEL[0]), ...arc([[64, 47.6], [91, 41.8], [118, 47.6]], 1, TOWEL[2]).map(F));
  out.push(blob([[113, 43], [121, 41], [123, 47], [116, 49]], TOWEL[0], 2));
  return out;
}
// The headband's tails, flicking on a spring off its knot.
const knot = () => [blob([[118, 46], [127, 49], [131, 55], [126, 54]], TOWEL[0], 2), blob([[118, 48], [123, 55], [122, 60], [119, 54]], TOWEL[1], 2), ...arc([[120, 48], [127, 52]], 0.7, TOWEL[2]).map(F)];
// The big fluffy tail with two dark rings and a pale tip (over the base's stub).
const tail = () => {
  const pts = [[82, 112], [68, 110], [58, 102], [54, 90]];
  return [
    ...recolour(BASE.tail ?? []),
    ...taper(pts, 14, 18, FUR[1]), E(54, 90, 9.4, 9.4, FUR[1]),
    F(blob([[70, 103], [78, 104], [76, 119], [67, 117]], FUR[3], 2)), F(blob([[56, 94], [64, 96], [64, 108], [55, 106]], FUR[3], 2)),
    F(E(52, 86, 4.6, 4.4, FUR[0])), F(blob([[60, 84], [66, 90], [62, 92]], FUR[0], 1)),
  ];
};
// The thermos on his back, on a strap over his chest.
const thermos = () => [
  blob([[54, 80], [66, 78], [68, 110], [56, 112]], '#7aa8a0', 2), F(blob([[56, 82], [60, 80], [61, 108], [57, 108]], '#a8d0c8', 1)),
  blob([[54, 76], [66, 74], [66, 80], [54, 82]], '#4a6a66', 2), ...arc([[56, 96], [67, 95]], 1.2, '#4a6a66').map(F),
];
const strap = () => [...taper([[70, 84], [90, 96], [104, 108]], 2.2, 2.2, '#5a7a74')];
// The apron, in two: its top on his waist (the waistband, the pencil tucked in it), and the skirt
// below his hips, full of pockets with tea-bag tags hanging out, which swings with his stepping legs.
const apron = () => [
  blob([[74, 96], [108, 96], [109.4, 114], [72.6, 114]], APRON[1], 2),
  F(blob([[75, 98], [82, 98], [81.4, 114], [73.6, 114]], APRON[0], 2)), F(blob([[104, 98], [108, 99], [108.6, 114], [103.6, 114]], APRON[2], 2)),
  ...taper([[99, 108], [104, 100]], 1.4, 1.2, '#f4c84a'), ...taper([[104, 100], [105, 98.6]], 1.2, 0.4, '#3a2620'),
  ...arc([[72, 96], [91, 99], [110, 96]], 1.6, APRON[3]),
];
const apronSkirt = () => [
  blob([[72.8, 108], [109.2, 108], [111, 128], [91, 133], [71, 128]], APRON[1], 2),
  F(blob([[73.6, 108], [81.6, 108], [80, 128], [73, 126]], APRON[0], 2)), F(blob([[103.8, 108], [108.8, 108], [109, 126], [103, 128]], APRON[2], 2)),
  ...[[77, 110], [93, 110]].flatMap(([x, y]) => [blob([[x, y], [x + 13, y], [x + 13, y + 11], [x, y + 11]], APRON[2], 1), ...arc([[x, y + 1], [x + 13, y + 1]], 0.8, APRON[3]), ...arc([[x + 1, y + 8], [x + 12, y + 8]], 0.5, APRON[3]).map(F)]),
  ...[[80, 114, '#e85a5a'], [85, 115, '#7ab86a'], [97, 114, '#e8b84a']].flatMap(([x, y, c]) => [...arc([[x, y - 4], [x + 0.6, y + 2]], 0.5, '#ffffff'), blob([[x - 1.8, y + 2], [x + 2.4, y + 2], [x + 2.4, y + 6], [x - 1.8, y + 6]], c, 1), F(E(x + 0.3, y + 3.4, 1, 0.6, '#ffffff'))]),
  ...arc([[72, 128], [91, 133], [110, 128]], 1, APRON[3]).map(F),
];
// The towel round his neck (on his chest) and its end hanging down his front (on a spring).
const towel = () => [...arc([[72, 84], [91, 90], [110, 84]], 7, TOWEL[0]), ...arc([[72, 86], [91, 92], [110, 86]], 1, TOWEL[2]).map(F), F(E(78, 85, 4, 1.4, '#ffffff'))];
const towelEnd = () => [blob([[95, 86], [104, 86], [103.4, 106], [94.6, 106]], TOWEL[0], 2), ...arc([[94.6, 101], [103.4, 101]], 1, TOWEL[2]), ...[96, 98.6, 101.2].map((x) => arc([[x, 106], [x, 108]], 0.7, TOWEL[1])).flat()];
// Socks and feet: dark, on the legs' bones; paws: dark mitts on the wrists.
const sock = (k) => {
  const [x] = J[`knee${k}`];
  return [blob([[x - 5.4, 127], [x + 5.4, 127], [x + 5.6, 139], [x - 5.6, 139]], MASK, 2), F(blob([[x - 4.6, 128], [x - 2, 128], [x - 2.6, 137], [x - 4.6, 137]], MASK_LT, 1))];
};
const foot = (k) => {
  const [x, y] = J[`ank${k}`];
  return [blob([[x - 6, y + 1], [x - 4, y - 3], [x + 6, y - 3], [x + 9, y + 3], [x + 7, y + 8], [x - 5, y + 8]], MASK, 2), F(E(x + 4, y + 6.2, 3.4, 1, '#8a6a5a'))];
};
const paw = (k) => {
  const [x, y] = J[`wr${k}`];
  return [E(x, y + 2, 5.4, 5, MASK), F(E(x - 1.6, y + 0.4, 2, 1.4, MASK_LT)), F(E(x + 0.6, y + 4, 2.4, 1.4, '#8a6a5a'))];
};
// The big teacup: a sage-green glazed cup, its darker rim, the tea inside, a white glaze drip.
const cup = () => {
  const [x, y] = CUP;
  return [
    blob([[x - 9, y - 8], [x + 9, y - 8], [x + 8, y + 6], [x, y + 9], [x - 8, y + 6]], '#8aa880', 2),
    F(blob([[x - 7, y - 6], [x - 3, y - 6], [x - 3.6, y + 5], [x - 6.6, y + 3]], '#b0c8a4', 1)), F(blob([[x + 4, y - 6], [x + 8, y - 6], [x + 7, y + 4], [x + 4, y + 6]], '#6a8a60', 1)),
    blob([[x - 9, y - 8], [x + 9, y - 8], [x + 8.4, y - 5.6], [x - 8.4, y - 5.6]], '#5a7a4a', 1), F(E(x, y - 7.4, 8, 1.2, '#7a9a58')),
    F(blob([[x - 2, y - 5.6], [x + 2, y - 5.6], [x + 1.4, y - 2], [x - 1.4, y - 1]], '#f4f4ec', 1)),
  ];
};

const cache = new Map();
// His pieces in one expression (each named for the bone it rides on):
//   head        his face of the moment, ears, mask, muzzle, headband; knot: its tails (a spring)
//   tail        his big ringed tail (on his hips, a spring)
//   thermos     on his back (his chest); strap: across his chest
//   apron       on his waist; apronSkirt: from his hips, swung by his legs; towel: round his neck (chest); towelEnd: a spring
//   sockF/N     on his shins; tootF/N: his feet; pawF/N: his paws; cup: in his near paw
export function tanukiDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const groups = {
    head: head(FACES[key]), knot: knot(), tail: tail(), thermos: thermos(), strap: strap(), apron: apron(), apronSkirt: apronSkirt(), towel: towel(), towelEnd: towelEnd(),
    sockF: sock('F'), sockN: sock('N'), tootF: foot('F'), tootN: foot('N'), pawF: paw('F'), pawN: paw('N'), cup: cup(),
  };
  cache.set(key, groups);
  return groups;
}
export const TANUKI_HEAD = (mood) => tanukiDesign(mood).head;
