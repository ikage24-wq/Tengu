// The Chest Hermit's design (2026-11-24, the player's pick "B" of three for the Gem Mimic): a fluffy
// ginger critter of the Crystal Cave that lives in a treasure chest like a hermit crab, carrying it on
// its back. "They look like treasure. They are not treasure. They bite." On the creature base. Each
// piece, in the base's own drawing units (blankBody('creature'), read only), named for the bone it
// rides on (creaturerig.js):
//   lid      the chest's lid standing open behind its head: red velvet inside, a gold rim, three
//            gems along the top; it tips forward over its head (lidR) to hide it or slam
//   box      the chest itself, strapped on its back: wood, gold bands and corners
//   tail     its fluffy ginger tail, a cream tip
//   bandana  a little blue spotted bandana round its neck
//   straps   the leather straps over its shoulders, gold buckles
//   head     its round-eared head and cream face mask; its face (each expression)
//   coin     a gold coin at its near paw's fingertips (only while it checks one in its idle act)
// Its body under them is the base's own skin (creaturerig.js) in its ginger tones; its face is its
// own, drawn here from scratch (nothing of the player character's: the player's rule).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob, mapShape } from '../mobs/kidbase.js';
import { blankBody } from '../mobs/blankbases.js';
import { BLANK } from '../mobs/blankbase.js';

export const SKIN_COLORS = { lt: '#fff0dc', base: '#f4b878', sh: '#dc9458', deep: '#b8723e' };
const PAL = [SKIN_COLORS.lt, SKIN_COLORS.base, SKIN_COLORS.sh, SKIN_COLORS.deep];
export const C = {
  wood: '#c8945a', woodBox: '#b07a46', woodDk: '#8a5a30', gold: '#f2c860', goldDk: '#d8a030', goldLt: '#fff4c0',
  velvet: '#a83a4a', velvetDk: '#882a3a', leather: '#7a4a2a', bandana: '#5ab0d8', bandanaDk: '#3a8ab8',
  gems: ['#ff8ac0', '#7ad0ff', '#b890ff'], ink: '#2a1a1a',
};
// The lid's hinge (it tips about it), its middle gem (it twinkles), where its mouth is, in base units.
export const HINGE = [91, 76];
export const GEM = [91, 18.4];
export const MOUTH = [91, 72];
export const BOX_TOP = [91, 74];

const HX = 91;
const HY = 60;
const HS = 0.72;
// (head units: its face drawn about the head's middle, 1 unit = HS)
const inHead = (list) => list.map((sh) => mapShape(sh, ([x, y]) => [HX + x * HS, HY + y * HS], HS));
const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);

// ---------- Its face ----------
// e the eyes, m the mouth. Moods: the kit's (idle, blink, happy, angry, hurt) and its own: chomp (the
// bite, mouth wide), peek (hiding, eyes slid to one side), nibble (testing a coin), smug.
const FACES = {
  idle: { e: 'open', m: 'cat' },
  blink: { e: 'blink', m: 'cat' },
  happy: { e: 'happy', m: 'open' },
  angry: { e: 'fierce', m: 'grit' },
  hurt: { e: 'squeeze', m: 'wobble' },
  chomp: { e: 'fierce', m: 'chomp' },
  peek: { e: 'side', m: 'small' },
  nibble: { e: 'happy', m: 'nibble' },
  smug: { e: 'half', m: 'cat' },
};
// A rich eye (head units): its white, a dark ring, a teal iris in three tones, the pupil, highlights
// and a sparkle; the upper lid line with lashes at the outer corner, a lower lid. `look` slides the
// iris sideways; `lid` brings the upper lid down.
function eye(x, y, o, look = 0, lid = 0) {
  const w = 8.4;
  const h = 7.6;
  const r = 6;
  const P = (u, v) => [x + u * o, y + v];
  const ix = x + look;
  const out = [];
  out.push(blob([P(-w, 0.6), P(-w * 0.55, -h), P(w * 0.4, -h - 0.4), P(w, -h * 0.4), P(w * 0.75, h * 0.8), P(0, h + 0.6), P(-w * 0.75, h * 0.7)], '#ffffff', 2));
  out.push(F(E(ix, y + 0.4, r, r * 1.15, '#3a2a1a')), F(E(ix, y + 0.8, r - 0.9, r * 1.15 - 0.9, '#3aa8a0')), F(E(ix, y + r * 0.55, r - 1.6, r * 0.5, '#a8f0e0')), F(E(ix, y - r * 0.5, r - 1.2, r * 0.38, '#1a6a68')));
  out.push(F(E(ix, y + 0.6, 2, 2.6, '#1a1a2e')), F(E(ix - 1.9 * o, y - 2.2, 1.8, 1.6, '#ffffff')), F(E(ix + 2 * o, y + 2.6, 0.9, 0.9, '#ffffff')));
  out.push(F(T([[ix + 1.4 * o, y - 3.6], [ix + 1.9 * o, y - 2.6], [ix + 2.9 * o, y - 2.2], [ix + 1.9 * o, y - 1.8], [ix + 1.4 * o, y - 0.8], [ix + 0.9 * o, y - 1.8], [ix - 0.1 * o, y - 2.2], [ix + 0.9 * o, y - 2.6]], '#ffffff')));
  // (the upper lid, brought down over the eye in the skin's colour, its line riding on it)
  if (lid > 0) out.push(F(blob([P(-w - 0.8, -0.2), P(-w * 0.5, -h - 2.2), P(w * 0.5, -h - 2.6), P(w + 0.8, -h * 0.6), P(w * 0.4, -h + lid), P(-w * 0.5, -h + lid + 0.4)], SKIN_COLORS.lt, 2)));
  out.push(...arc([P(-w - 0.4, 0.4), P(-w * 0.5, -h - 0.4 + lid), P(w * 0.45, -h - 0.8 + lid), P(w + 0.6, -h * 0.4)], 2.2, C.ink));
  for (let i = 0; i < 2; i++) out.push(...arc([P(w * (0.55 + i * 0.2), -h * (0.9 - i * 0.2) + lid * 0.5), P(w * (0.85 + i * 0.25), -h * (1.2 - i * 0.15)), P(w * (1.05 + i * 0.25), -h * (1.15 - i * 0.18))], 0.9, C.ink));
  out.push(...arc([P(-w * 0.7, h * 0.75), P(0, h + 1.2), P(w * 0.7, h * 0.7)], 0.7, '#d0a080'));
  return out;
}
// Shut eyes: happy upside-down arcs, a blink's soft line with lashes, a squeeze's pinched chevrons.
const shut = (x, o, kind) => {
  if (kind === 'happy') return [...arc([[x - 7.4, 3.4], [x, -3.6], [x + 7.4, 3.4]], 2.2, C.ink), ...arc([[x + 6.4 * o, 2], [x + 9.4 * o, 0.4]], 0.9, C.ink)];
  if (kind === 'squeeze') return [...arc([[x - 6.6 * o, -3.6], [x + 5 * o, 0.6], [x - 6.6 * o, 4.2]], 2.2, C.ink)];
  return [...arc([[x - 7.6, 1], [x, 3.4], [x + 7.6, 1]], 2.2, C.ink), ...arc([[x + 6.8 * o, 1.4], [x + 9.6 * o, 0]], 0.9, C.ink)];
};
function face(e, m) {
  const out = [];
  if (e === 'happy' || e === 'blink' || e === 'squeeze') out.push(...shut(-13, -1, e), ...shut(13, 1, e));
  else {
    const look = e === 'side' ? 3 : 0;
    const lid = e === 'half' ? 4.4 : e === 'fierce' ? 3 : 0;
    out.push(...eye(-13, 2, -1, look, lid), ...eye(13, 2, 1, look, lid));
    // (fierce: little brows slanting in, a cross crease)
    if (e === 'fierce') out.push(...arc([[-20, -9], [-13, -7.6], [-6, -4.6]], 2, C.ink), ...arc([[20, -9], [13, -7.6], [6, -4.6]], 2, C.ink));
  }
  // the nose
  out.push(F(E(0, 12.4, 2.4, 1.7, '#6a3a2a')), F(E(-0.7, 11.9, 0.8, 0.5, '#a86a5a')));
  // blush (bigger when happy)
  const bl = e === 'happy' ? 5.4 : 4.6;
  out.push(F(E(-17, 12, bl, 2.8, '#ffb0a0')), F(E(17, 12, bl, 2.8, '#ffb0a0')));
  // the mouth, and its one little fang
  const fang = (x, y) => F(T([[x - 0.9, y], [x + 0.9, y - 0.2], [x, y + 2.8]], '#ffffff'));
  if (m === 'cat') out.push(...arc([[-5, 15], [-2.6, 17.4], [0, 15.6]], 1.1, '#4a2a1a'), ...arc([[0, 15.6], [2.6, 17.4], [5, 15]], 1.1, '#4a2a1a'), fang(2.9, 16.6));
  else if (m === 'open') out.push(blob([[-4.6, 15], [4.6, 15], [3.4, 19.6], [0, 21], [-3.4, 19.6]], '#8a2a3a', 2), F(E(0, 19.2, 2.4, 1.4, '#ff8a9a')), fang(2.4, 15.2));
  else if (m === 'grit') out.push(blob([[-5.4, 15.4], [5.4, 15.4], [4.6, 18.4], [-4.6, 18.4]], '#ffffff', 1), ...arc([[-5.4, 15.4], [0, 14.8], [5.4, 15.4]], 1, '#4a2a1a'), ...arc([[-4.6, 18.4], [0, 18.8], [4.6, 18.4]], 1, '#4a2a1a'));
  else if (m === 'chomp') {
    // (the bite: a big open mouth, two little fangs on top, a tongue)
    out.push(blob([[-7, 14], [7, 14], [6, 20], [0, 24], [-6, 20]], '#7a1a2a', 2), F(E(0, 21.4, 3.6, 2, '#ff7a8a')));
    out.push(F(T([[-4.4, 14.2], [-2.4, 14.2], [-3.4, 17.6]], '#ffffff')), F(T([[2.4, 14.2], [4.4, 14.2], [3.4, 17.6]], '#ffffff')));
  } else if (m === 'small') out.push(F(E(0, 16, 1.4, 1.2, '#6a2a2a')));
  else if (m === 'wobble') out.push(...arc([[-5, 17], [-2.6, 15.4], [0, 17], [2.6, 15.4], [5, 17]], 1.1, '#4a2a1a'));
  else if (m === 'nibble') out.push(blob([[-3.4, 15], [3.4, 15], [2.6, 18.4], [-2.6, 18.4]], '#8a2a3a', 2), F(T([[-1.8, 15.1], [1.8, 15.1], [1.8, 17], [-1.8, 17]], '#ffffff')));
  return out;
}

// ---------- Its pieces ----------
const cache = new Map();
export function hermitDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const f = FACES[key];
  const body = blankBody('creature', { tpose: false, guides: false });
  const recolor = (list) => list.map((sh) => ({ ...sh, c: { [BLANK.lt]: PAL[0], [BLANK.base]: PAL[1], [BLANK.sh]: PAL[2], [BLANK.deep]: PAL[3] }[sh.c] ?? sh.c }));
  const groups = {
    // the lid standing open behind its head (red velvet inside, a gold rim, three gems on top)
    lid: [
      blob([[62, 77], [60, 34], [66, 22], [91, 17], [116, 22], [122, 34], [120, 77]], C.wood, 2),
      blob([[67, 77], [66, 36], [71, 27], [91, 23], [111, 27], [116, 36], [115, 77]], C.velvet, 2),
      F(blob([[70, 77], [70, 40], [74, 32], [80, 30], [76, 40], [75, 77]], C.velvetDk, 1)),
      ...arc([[61, 74], [60, 34], [66, 22], [91, 17], [116, 22], [122, 34], [121, 74]], 2.2, C.gold),
      ...[[72, 22, 0], [91, 18.4, 1], [110, 22, 2]].flatMap(([x, y, i]) => [E(x, y, 3.8, 3.4, C.gems[i]), F(E(x - 1.1, y - 1.1, 1.3, 1, '#ffffff'))]),
    ],
    // the chest on its back: wood, its shaded side, gold bands, a gold rim along the top
    box: [
      blob([[58, 74], [124, 74], [126, 118], [56, 118]], C.woodBox, 1),
      F(blob([[58, 74], [65, 74], [62, 118], [56, 118]], C.woodDk, 1)),
      ...[86, 106].map((y) => F(blob([[57, y], [125, y], [126, y + 4.4], [56, y + 4.4]], C.gold, 1))),
      F(blob([[56, 73], [126, 73], [126, 78], [56, 78]], C.gold, 1)),
      ...[[58, 76], [124, 76], [57, 116], [125, 116]].map(([x, y]) => F(E(x, y, 2.4, 2.4, C.goldDk))),
    ],
    // its tail, out behind it, fluffy, a cream tip
    tail: [
      blob([[82, 112], [70, 104], [56, 98], [42, 98], [34, 106], [38, 116], [50, 120], [66, 120], [78, 118]], PAL[1], 2),
      F(blob([[44, 100], [36, 106], [38, 114], [46, 116], [48, 108]], PAL[0], 2)),
      F(blob([[56, 116], [70, 117], [78, 116], [70, 112], [58, 112]], PAL[2], 2)),
      ...arc([[52, 101], [60, 100], [68, 104]], 0.8, PAL[0]),
    ],
    // a little blue bandana, white spots
    bandana: [blob([[78, 81], [104, 81], [99, 90], [91, 95], [83, 90]], C.bandana, 2), F(blob([[84, 88], [98, 88], [91, 94]], C.bandanaDk, 2)), F(E(86, 84.6, 1.4, 1.4, '#ffffff')), F(E(96, 85, 1.4, 1.4, '#ffffff')), F(E(91, 90, 1.2, 1.2, '#ffffff'))],
    // its backpack straps over the shoulders, gold buckles
    straps: [-1, 1].flatMap((s2) => [...arc([[91 + 12 * s2, 84], [91 + 14.6 * s2, 94], [91 + 14 * s2, 106]], 2.6, C.leather), E(91 + 14.6 * s2, 95, 1.8, 1.8, C.gold), F(E(91 + 14.3 * s2, 94.5, 0.7, 0.7, C.goldLt))]),
    // its head: the base's round head and ears in its tones, its cream mask, its face
    head: [
      ...recolor(body.groups.ears),
      ...recolor(body.groups.head),
      F(blob([[74, 62], [84, 56], [91, 62], [98, 56], [108, 62], [112, 74], [91, 82], [70, 74]], PAL[0], 2)),
      // (a little tuft on top)
      blob([[86, 40], [88, 33], [91, 37], [94, 32], [96, 40]], PAL[1], 2),
      ...inHead(face(f.e, f.m)),
    ],
    // a coin in its near paw
    // (held at its fingertips, so with the paw raised it shows above it, at its mouth)
    coin: [E(106, 116.4, 4.4, 4, C.gold), F(E(106, 117.6, 3.4, 1.9, C.goldDk)), ...arc([[103.6, 115.4], [106, 113.4], [108.4, 115.4]], 0.6, C.goldLt), F(E(106, 116, 1.1, 1.1, C.goldDk))],
  };
  cache.set(key, groups);
  return groups;
}
export const HERMIT_FACES = Object.keys(FACES);
