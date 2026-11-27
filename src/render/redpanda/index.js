// The Blossom Red Panda (2026-11-26, the Mossy Woods canopy's red panda remade from scratch, one
// concept, the player: "just do 1 concept that fits the area and the theme"): Sniffles, a dozy little
// red panda who lives up in the flowering treetops, loves flowers more than anything, and is terribly
// allergic to them. A big pink hibiscus tucked behind his ear; a white-masked face with tear marks;
// big white-rimmed ears; dark legs and belly under rust fur; a huge ringed tail with two little
// blossoms caught in it. On his own copy of the rodent base (rodentbase.js, its squirrel reshaped:
// a chubby chibi body, a big round head, short dark legs under a fringe of belly fur, a long thick
// tail held out behind instead of over his back).
//   going   a soft little pad (the base's scurry: each paw's step from the ground walked, so nothing
//           slides); he bounds only when he chases. Between walks he stands about long enough for a
//           piece of his act (data: `rest`; world/mobs.js tells him how long he has, `m.restUntil`).
//   idle    his act, in three pieces, each whole in itself, the next one that fits the time he has:
//           - the sniff (10.4 s): he sits up, takes the hibiscus from behind his ear in both paws and
//             sniffs it, blissful; pollen drifts up his nose... "ah... ahh..." (the sneeze fizzles,
//             relief) ... ACHOO! (a puff of golden pollen, a hop back); dazed, then a sheepish grin,
//             and the flower goes back behind his ear;
//           - the startle (6.8 s): a petal drifts down; he spots it and rears up into a red panda's
//             Big Scary stand (up on his toes, paws flung high, tail up), trembling; it lands on his
//             nose, he goes cross-eyed at it, lowers his paws, blows it off, and checks nobody saw;
//           - the tail nap (11 s): he curls up hugging his big tail, dozes (little z's), a petal lands
//             on his nose, his nose twitches, a tiny sneeze wakes him with a start; a look round, a
//             big yawn and a stretch.
//   moves   Big Scary (reared right up, paws flung high, then dropping on you with both paws); Pollen
//           Sneeze ("ahh..." head thrown back, then a cone of golden pollen); Tail Swish (his tail
//           raised high behind, then whipped forward over his back, loose petals flying).
//   face    his own: honey-drop eyes (an upright egg, deep amber fading to bright honey at the
//           bottom, a big soft pupil, a little five-petal blossom glint and a round one), a heavy soft
//           upper lid with two curls at its outer corner, a lower lid that rises when he smiles; the
//           red panda's cream brow spots for brows (they do the acting); a cream muzzle and cheek
//           fluff split by rust tear marks; a little heart-shaped nose that twitches when he sniffs;
//           a soft cat mouth from width, smile, openness and roundness; every change eased.
import { dressedRodent } from './rodentbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a damped settle: 1 - e^-kt cos wt, from 0 at t=0 to 1, overshooting once or twice)
const boing = (t, k = 7, w = 16) => (t <= 0 ? 0 : 1 - Math.exp(-k * t) * Math.cos(w * t));
const rgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, al) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};

// ---------- His colours ----------
const FUR = { lt: '#ffb689', base: '#e8794a', sh: '#cc5f37', deep: '#a9492c', guide: '#f6c9ab', nose: '#3d262a', inner: '#5b3433', tooth: '#fffaf2', mouth: '#7e3438' };
const INK = '#a4462b';
const LEG = { lt: '#865249', base: '#62393a', sh: '#4f2d2f', deep: '#402427' };
const LEG_INK = '#3f2427';
const CREAM = '#fff4e4';
const CREAM_SH = '#efd9c2';
const TEAR = '#c2522c';
const EARIN = '#5d3436';
const RING = '#f4c08e';
const TIP = '#a04a30';
const HIB = { lt: '#ffd6e6', base: '#ff9dc3', sh: '#ec6f9f', eye: '#d84a80', ink: '#c95789', stamen: '#f6e1b0', pollen: '#ffd45a' };
const BLOOM = { base: '#fffaf6', sh: '#f3dfe8', eye: '#ffd66b', ink: '#d9b8c6' };
const POLLEN = { lt: '#fff6c4', base: '#ffe58a', rim: '#f0c95c' };

// ---------- His shape over the squirrel's ----------
const S = 1.12;
const P = {
  name: 'Blossom Red Panda',
  scale: S,
  gait: { walk: 'scurry', run: 'bound' },
  // a chubby bean: a full chest, a round rump
  body: [[9.4, -1.0], [8.0, -4.8], [4.4, -7.4], [-1.0, -8.0], [-6.0, -8.0], [-10.4, -6.6], [-13.0, -2.8], [-13.2, 1.6], [-11.2, 5.4], [-7.4, 7.0], [-3.0, 6.8], [1.6, 6.4], [5.6, 5.6], [8.8, 2.6]],
  seat: [-10.4, 6.4],
  haunch: [-8.4, -0.6, 6.8],
  // short, chunky legs (only their lower halves show, under the belly's fringe)
  fore: { top: [5.2, 2.4], bones: [[-0.3, 3.8], [0.3, 3.8], [0.9, 1.6]], w: [6.4, 4.6, 4.0, 3.6] },
  hind: { top: [-8.4, 1.6], bones: [[4.4, 4.3], [-4.4, 4.9], [5.4, 0.6]], w: [11, 7.2, 5.4, 4.0] },
  far: [-1.4, -0.5],
  neck: { base: [7.0, -3.6], len: 2.4, w: 9.4, ang: -44 },
  // a big round chibi head, a short soft muzzle, full cheeks (the cream fluff), no teeth showing
  head: { skull: [9.6, 8.8], muzzle: [6.6, 2.8, 4.1, 3.1], nose: [10.3, 1.3, 1.05], cheek: [2.0, 3.6, 6.8, 5.0], pouch: 0, teeth: [9.0, 4.8, 0.02] },
  // (the ears are his own, drawn here; the base keeps their springs)
  ears: { kind: 'big', near: [-1.2, -7.6], far: [-4.6, -6.9], len: 5.6, w: 5.8, ang: -100 },
  // the long thick tail, held out behind, its tip curling up
  tail: { kind: 'plume', root: [-12.4, -1.6], seg: 3.7, ang: [-168, 176, 170, 176, -170, -152, -128], w: [5.2, 8.0, 9.4, 9.8, 9.8, 9.2, 8.0, 5.6], ballAng: [-95, -70, -40, -10, 20, 50, 80] },
  sitAng: -66,
  nut: 'berry',
  moves: ['scary', 'sneeze', 'swish'],
};

// ---------- His act: three pieces, each whole in itself ----------
const PIECES = { sniff: 10.4, startle: 6.8, tailnap: 11 };
const ORDER = ['sniff', 'startle', 'tailnap'];
const ACHOO = 6.3;
// (the startle's petal lands on his nose, and is blown off)
const LAND = 3.4;
const PFFT = 5.15;
// (the tail nap's petal, and the tiny sneeze that wakes him)
const NAPLAND = 5.5;
const TCHOO = 7.2;
// Each piece: `set` channels eased to a value by a weight, `add` added on, the flower's way from
// behind his ear to his nose (`fw`), his paws (`paw`: 'ear' up behind his head, 'spread' flung high
// and wide), the face.
function actAt(piece, u) {
  const A = { piece, u, set: {}, add: {}, fw: 0, paw: null, pawW: 0, face: 'calm' };
  const set = (k, v, w) => {
    if (w > 0.001) A.set[k] = [v, clamp(w, 0, 1)];
  };
  const add = (k, v) => {
    A.add[k] = (A.add[k] ?? 0) + v;
  };
  if (piece === 'sniff') {
    const s = win(u, 0.3, 1.0, 9.4, 10.2);
    // (the flower from behind his ear to his nose and back)
    A.fw = sstep((u - 1.95) / 0.55) * (1 - sstep((u - 8.45) / 0.55));
    // (both paws up behind his head to fetch it, and again to put it back)
    const ear = Math.max(win(u, 1.0, 1.5, 1.85, 2.35), win(u, 8.3, 8.75, 9.0, 9.5));
    set('sit', 1, s);
    set('pitch', -3, s);
    set('hold', 0.5 + 0.5 * A.fw, s);
    set('throwArm', -0.92 * ear, s);
    A.paw = 'ear';
    A.pawW = ear * s;
    // the sniff (nodding into it), the "ah... ahh..." (head thrown back further and further), the
    // fizzle, a quick "ah?", the ACHOO (snapped forward, a hop back), dazed, a sheepish tilt
    const sniff = win(u, 2.4, 2.7, 3.5, 3.8);
    const ahh = win(u, 3.6, 5.3, 5.4, 5.95);
    const ah2 = win(u, 6.0, 6.22, 6.27, 6.31);
    const choo = win(u, ACHOO - 0.02, ACHOO + 0.03, ACHOO + 0.18, ACHOO + 0.7);
    const daze = win(u, 6.7, 6.9, 7.4, 7.65);
    const shy = win(u, 7.6, 7.95, 8.3, 8.65);
    add('head', 7 * sniff + 2.5 * Math.sin(u * 9) * sniff - 24 * ahh - 17 * ah2 + 21 * choo + 5 * Math.sin(u * 6.5) * daze - 9 * shy);
    add('pitch', -6 * ahh - 4 * ah2 + 9 * choo);
    add('x', -0.06 * win(u, ACHOO, ACHOO + 0.12, ACHOO + 0.6, ACHOO + 1.4));
    add('hop', 0.07 * win(u, ACHOO, ACHOO + 0.07, ACHOO + 0.1, ACHOO + 0.3));
    set('jaw', 0.32 * Math.max(ahh, ah2) + choo * 0.95 + 0.15 * shy, Math.max(ahh, ah2, choo, shy));
    set('nose', 1, Math.max(sniff, ahh, ah2));
    // (perked through the "ahh", flopped by the sneeze and while he's dazed)
    set('ears', u < ACHOO ? 0.9 : -0.9, Math.max(ahh, ah2, choo, daze));
    add('tailUp', 18 * choo + 10 * ahh);
    if (u >= 1.0 && u < 2.45) A.face = 'fond';
    else if (u >= 2.45 && u < 3.6) A.face = 'bliss';
    else if (u >= 3.6 && u < 5.4) A.face = 'ahh';
    else if (u >= 5.4 && u < 6.0) A.face = 'relief';
    else if (u >= 6.0 && u < ACHOO) A.face = 'ahh';
    else if (u >= ACHOO && u < ACHOO + 0.35) A.face = 'sneeze';
    else if (u >= ACHOO + 0.35 && u < 7.6) A.face = 'dazed';
    else if (u >= 7.6 && u < 8.6) A.face = 'sheepish';
    else if (u >= 8.6 && u < 10.1) A.face = 'content';
  } else if (piece === 'startle') {
    const look = win(u, 0.7, 1.1, 1.55, 1.75);
    const st = win(u, 1.55, 1.85, 4.5, 5.3);
    // (reared up on his toes, paws flung high and wide, tail up: a red panda's Big Scary)
    set('sit', 1, st);
    set('hop', 0.1, st);
    set('throwArm', 0.55, st);
    set('hold', 0.7, st);
    set('pitch', -13, st);
    set('ears', 1, st);
    set('tailUp', 30, st);
    set('jaw', u < LAND ? 0.4 : 0.12, st);
    A.paw = 'spread';
    A.pawW = st;
    // (a slow wobble while he holds it, trying very hard to look big)
    const hold = win(u, 1.9, 2.2, 3.3, 3.5);
    add('pitch', 2.2 * Math.sin((u - 1.85) * TAU * 1.5) * hold);
    add('head', -15 * look + 7 * win(u, LAND - 0.05, LAND + 0.2, 4.4, 4.7) - 12 * win(u, 5.5, 5.8, 6.0, 6.35) + 7 * win(u, 6.0, 6.3, 6.4, 6.7));
    set('ears', 1, look);
    // (the "pfft": cheeks puffed, then blown)
    set('cheeks', 0.9, win(u, 4.85, 5.0, 5.08, 5.2));
    set('jaw', 0.3, win(u, 5.08, 5.15, 5.3, 5.45));
    if (u >= 0.7 && u < 1.55) A.face = 'curious';
    else if (u >= 1.55 && u < LAND) A.face = 'scary';
    else if (u >= LAND && u < 4.5) A.face = 'crossed';
    else if (u >= 4.5 && u < 4.9) A.face = 'sheepish';
    else if (u >= 4.9 && u < 5.4) A.face = 'pfft';
    else if (u >= 5.4 && u < 6.35) A.face = 'shifty';
  } else if (piece === 'tailnap') {
    const bw = win(u, 0.3, 1.3, 8.6, 9.8);
    // curled up round, hugging his tail like a blanket; popping his head up when he wakes
    const wake = sstep((u - TCHOO) / 0.3);
    const breath = Math.sin(u * 2.1);
    set('ball', mix(0.85, 0.5, wake), bw);
    set('curl', mix(2.7 + breath * 0.05, 1.6, wake), bw);
    set('pitch', 4, bw);
    set('head', mix(-24, 6, wake), bw);
    set('reach', mix(-0.55, -0.15, wake), bw);
    set('ears', mix(-0.7, 0.9, wake), bw);
    set('tailUp', 34, bw);
    set('sit', 0, bw);
    set('hold', 0, bw);
    set('nose', 1, win(u, NAPLAND + 0.1, NAPLAND + 0.3, TCHOO - 0.1, TCHOO + 0.05));
    add('head', 8 * win(u, TCHOO - 0.02, TCHOO + 0.03, TCHOO + 0.1, TCHOO + 0.3) - 11 * win(u, 7.9, 8.15, 8.25, 8.5) + 9 * win(u, 8.25, 8.5, 8.55, 8.8));
    // the yawn and the big stretch as he gets up
    set('jaw', 1, win(u, 8.7, 9.0, 9.45, 9.75));
    add('head', -12 * win(u, 8.7, 9.0, 9.45, 9.75));
    add('curl', -0.7 * win(u, 9.0, 9.4, 9.7, 10.2));
    add('pitch', -5 * win(u, 9.0, 9.4, 9.7, 10.2));
    if (u >= 0.9 && u < NAPLAND + 0.1) A.face = 'sleep';
    else if (u >= NAPLAND + 0.1 && u < TCHOO) A.face = 'twitch';
    else if (u >= TCHOO && u < TCHOO + 0.25) A.face = 'sneeze';
    else if (u >= TCHOO + 0.25 && u < 7.9) A.face = 'startled';
    else if (u >= 7.9 && u < 8.65) A.face = 'blink';
    else if (u >= 8.65 && u < 9.8) A.face = 'yawn';
    else if (u >= 9.8 && u < 10.9) A.face = 'content';
  }
  return A;
}

// His face's targets for a mood: lid (0 open, 1 shut), shut (which closed shape), brow tilt (+ knit,
// - worried) and raise, the mouth's width, smile, openness and roundness, blush, the lower lid's rise,
// how wide, where the pupils look (px forward, py down).
const F0 = { lid: 0, shut: 'happy', bt: 0, by: 0.3, mw: 0.8, ms: 0.5, mo: 0, mr: 0, bl: 0.55, lw: 0.3, wide: 1, px: 0, py: 0 };
const face0 = (o) => ({ ...F0, ...o });
const FACES = {
  // (at rest: soft and a little dreamy, lids a touch low, a small smile)
  calm: face0({ lid: 0.14, bt: -0.15, by: 0.3, mw: 0.8, ms: 0.65, bl: 0.6, lw: 0.32 }),
  fond: face0({ lid: 0.28, bt: -0.4, by: 0.5, mw: 0.95, ms: 0.95, mo: 0.15, bl: 0.9, lw: 0.6, px: 0.2, py: 0.45 }),
  bliss: face0({ lid: 1, shut: 'sleep', bt: -0.45, by: 0.55, mw: 0.85, ms: 1, mo: 0.12, bl: 1.1, lw: 0.5 }),
  ahh: face0({ lid: 0.58, shut: 'squeeze', bt: -0.75, by: 1, mw: 0.5, ms: -0.1, mo: 0.6, mr: 1, bl: 0.75, lw: 0.4, wide: 0.98, py: -0.5 }),
  relief: face0({ lid: 1, bt: -0.35, by: 0.45, mw: 1.0, ms: 1, mo: 0.2, bl: 0.75, lw: 0.6 }),
  sneeze: face0({ lid: 1, shut: 'squeeze', bt: 0.45, by: -0.1, mw: 1.2, ms: -0.2, mo: 1, bl: 0.95, lw: 0.7 }),
  dazed: face0({ lid: 0.42, bt: -0.6, by: 0.2, mw: 0.6, ms: -0.1, mo: 0.2, mr: 0.6, bl: 0.6, lw: 0.12, wide: 1.04 }),
  sheepish: face0({ lid: 1, bt: -0.6, by: 0.35, mw: 1.0, ms: 0.9, mo: 0.3, bl: 1.25, lw: 0.7 }),
  content: face0({ lid: 0.32, bt: -0.25, by: 0.35, mw: 0.9, ms: 0.9, bl: 0.75, lw: 0.55 }),
  curious: face0({ lid: 0, bt: -0.5, by: 0.8, mw: 0.55, ms: 0.1, mo: 0.25, mr: 0.8, bl: 0.5, lw: 0.08, wide: 1.12, px: 0.15, py: -0.55 }),
  scary: face0({ lid: 0.08, bt: 0.95, by: -0.2, mw: 1.1, ms: -0.3, mo: 0.9, bl: 0.9, lw: 0.35, wide: 1.12 }),
  crossed: face0({ lid: 0.05, bt: -0.5, by: 0.75, mw: 0.5, ms: -0.25, mo: 0.2, mr: 0.8, bl: 0.75, lw: 0.08, wide: 1.08, px: 0.55, py: 0.5 }),
  pfft: face0({ lid: 0.45, shut: 'squeeze', bt: 0.3, by: 0.1, mw: 0.4, ms: 0, mo: 0.35, mr: 1, bl: 0.95, lw: 0.4 }),
  shifty: face0({ lid: 0.45, bt: 0.25, by: 0.05, mw: 0.6, ms: 0.35, bl: 0.95, lw: 0.5, px: -0.55, py: 0.05 }),
  sleep: face0({ lid: 1, shut: 'sleep', bt: -0.1, by: 0.1, mw: 0.5, ms: 0.35, mo: 0.12, mr: 0.6, bl: 0.5, lw: 0.2 }),
  twitch: face0({ lid: 1, shut: 'squeeze', bt: 0.35, by: 0.1, mw: 0.6, ms: -0.2, mo: 0.1, bl: 0.65, lw: 0.4 }),
  startled: face0({ lid: 0, bt: -0.6, by: 1, mw: 0.5, ms: -0.1, mo: 0.7, mr: 1, bl: 0.6, lw: 0, wide: 1.2 }),
  blink: face0({ lid: 0.18, bt: -0.3, by: 0.5, mw: 0.6, ms: 0.2, bl: 0.6, lw: 0.2, wide: 1.06, px: -0.3 }),
  yawn: face0({ lid: 1, shut: 'sleep', bt: -0.35, by: 0.35, mw: 0.9, ms: 0, mo: 1, mr: 1, bl: 0.6, lw: 0.6 }),
  fierce: face0({ lid: 0.15, bt: 0.9, by: -0.3, mw: 0.9, ms: -0.25, mo: 0.55, bl: 0.6, lw: 0.4 }),
  smug: face0({ lid: 0.45, bt: 0.3, by: 0.1, mw: 0.95, ms: 0.85, bl: 0.7, lw: 0.6 }),
  happy: face0({ lid: 1, bt: -0.2, by: 0.55, mw: 1.1, ms: 1, mo: 0.8, bl: 0.9, lw: 0.7 }),
  hurt: face0({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.1, mw: 0.8, ms: -0.6, mo: 0.5, bl: 0.6, lw: 0.4 }),
  dizzy: face0({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.25, mw: 0.7, ms: -0.4, mo: 0.4, mr: 0.4, bl: 0.4, lw: 0 }),
  worried: face0({ lid: 0.08, bt: -0.6, by: 0.3, mw: 0.6, ms: -0.3, mo: 0.15, bl: 0.5, lw: 0.1, wide: 1.05 }),
  sad: face0({ lid: 0.4, bt: -0.7, by: 0.1, mw: 0.65, ms: -0.6, bl: 0.45, lw: 0.15, py: 0.3 }),
  cross: face0({ lid: 0.25, bt: 0.85, by: -0.3, mw: 0.6, ms: -0.45, bl: 0.6, lw: 0.4 }),
  talk: face0({ lid: 0.06, bt: -0.1, by: 0.35, mw: 0.85, ms: 0.45, mo: 0.4, bl: 0.6, lw: 0.25, wide: 1.04 }),
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const KEYS = ['bt', 'by', 'mw', 'ms', 'mo', 'mr', 'bl', 'lw', 'wide', 'px', 'py'];

// ---------- His moves ----------
const MOVES = {
  // Reared right up on his toes, paws flung high and wide, tail up, mouth open (as big and scary as a
  // red panda gets), then dropping forward onto you with both paws.
  scary: {
    anticT: 0.4,
    keys: [
      [0, { sit: 1, hop: 0.11, hold: 0.7, throwArm: 0.55, pitch: -14, head: -8, ears: 1, tailUp: 32, jaw: 0.55 }],
      [0.09, { sit: 0.2, hop: 0.02, hold: 0.45, throwArm: 1, pitch: 12, head: 12, x: 0.17, ears: -0.5, jaw: 0.25, tailUp: 8 }, 'in'],
      [0.14, { sit: 0.1, hold: 0.3, throwArm: 0.85, pitch: 9, head: 9, x: 0.17, crouch: 0.25, ears: -0.3, tailUp: 4 }, 'out'],
      [0.42, { sit: 0, hold: 0, throwArm: 0, x: 0.09, pitch: 2, crouch: 0.1, ears: 0.2 }, 'io'],
      [0.85, {}, 'io'],
    ],
    spark: [0.09],
    sparkAt: 'front',
    dust: [[0.09, 'feet']],
    hit: 0.09,
  },
  // "Ahh..." (head thrown back, nose twitching, paws up), then CHOO: a cone of golden pollen, and a
  // little hop back from his own sneeze.
  sneeze: {
    anticT: 0.4,
    keys: [
      [0, { sit: 0.3, hold: 0, pitch: -10, head: -27, nose: 1, jaw: 0.3, ears: 0.8, tailUp: 14 }],
      [0.05, { sit: 0.1, hold: 0.1, pitch: 10, head: 20, nose: 0, jaw: 1, ears: -1, x: 0.06, crouch: 0.25, tailUp: -6 }, 'out'],
      [0.2, { pitch: 4, head: 8, jaw: 0.3, ears: -0.7, x: -0.03, hop: 0.05, crouch: 0.1 }, 'io'],
      [0.5, { x: -0.02, head: -3, ears: 0.1 }, 'io'],
      [0.85, {}, 'io'],
    ],
    burst: 0.05,
  },
  // His tail raised high behind (a glance back at it), then whipped forward over his back, the loose
  // petals in it flying.
  swish: {
    anticT: 0.35,
    keys: [
      [0, { crouch: 0.3, pitch: -6, curl: 0.3, swish: -0.45, tailUp: 24, ears: -0.3, head: -10 }],
      [0.12, { crouch: 0.3, pitch: 8, curl: 0.6, swish: 1.15, tailUp: 0, ears: -0.6, head: 10, x: 0.04 }, 'io'],
      [0.3, { crouch: 0.25, pitch: 5, curl: 0.45, swish: 1.05, ears: -0.4, head: 6, x: 0.04 }, 'io'],
      [0.56, { crouch: 0.05, pitch: 0, curl: 0.05, swish: 0.1, tailUp: 4, x: 0.02 }, 'io'],
      [0.85, {}, 'io'],
    ],
    spark: [0.1],
    sparkAt: 'tail',
    gust: [0.09],
  },
};
const POOL = ['scary', 'sneeze', 'swish'];
// vowel mouths for talking: [width, smile, open, round], each held a beat, eased into the next
const VOWELS = [[0.55, 0.1, 0.7, 0.7], [1.0, 0.45, 0.55, 0], [1.05, 0.55, 0.3, 0], [0.8, 0.3, 0, 0], [0.6, 0.2, 0.5, 1]];

// ---------- His act, his moods and his face's easing, each frame before drawing ----------
function pose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const k = (rate) => 1 - Math.exp(-dt * rate);
  const now = a.now ?? a.t ?? 0;
  const napping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now);
  // (a hit only counts once it has happened: a negative time since it, as when a stage replays from
  // the start with the last hit remembered, is no hit at all)
  const ago = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && ago >= 0 && ago < 0.55;
  const fighting = (m.aggroUntil ?? 0) > now || Boolean(m.engaged);
  const name = mv ? Object.keys(MOVES).find((n) => MOVES[n] === mv) ?? (mv === K.moves.wash ? 'wash' : null) : null;
  const moving = (a.walkW ?? 0) > 0.05 && m.hp > 0 && !mv;
  // Calm: standing about with nothing else on (the act shows only then, fading in and out)
  const calmGoal = !mv && m.hp > 0 && !napping && !m.pose && !m.cine && !hurt && !fighting && !moving ? 1 : 0;
  st.rpCalm = mix(st.rpCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.rpCalm);
  // The piece he is playing: started as he settles; the next once one ends (a breath between), the
  // first in turn that fits the time he has before he moves on (m.restUntil, from world/mobs.js); none
  // when nothing fits. Dropped once he's no longer calm, or the clock went back (a stage's replay).
  let PC = st.rpPiece ?? null;
  if (PC && (now < PC.t0 - 0.25 || (cw < 0.03 && !calmGoal))) PC = null;
  if (PC && PC.name && now - PC.t0 > PIECES[PC.name] + 1.2) PC = null;
  if (PC && !PC.name && now >= PC.until) PC = null;
  if (!PC && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.rpN ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.rpN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        PC = { name: nm, t0: now + 0.2 };
        st.rpN = (st.rpN + i + 1) % ORDER.length;
        break;
      }
    }
    // (none fits: he just stands and breathes until his next walk)
    if (!PC) PC = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.rpPiece = PC;
  const A = PC && PC.name ? actAt(PC.name, now - PC.t0) : { piece: null, u: 0, set: {}, add: {}, fw: 0, paw: null, pawW: 0, face: 'calm' };
  // (the base's own sit-up-and-look-round gives way to his act while he is calm)
  out.sit *= 1 - cw;
  out.hold *= 1 - cw;
  out.tailUp *= 1 - cw;
  for (const [ch, [v, w]] of Object.entries(A.set)) out[ch] = mix(out[ch], v, w * cw);
  for (const [ch, v] of Object.entries(A.add)) out[ch] += v * cw;
  // A nap: curled up round, hugging his tail (eased in and out)
  st.rpNap = mix(st.rpNap ?? 0, napping && m.hp > 0 && !mv ? 1 : 0, k(napping ? 2.5 : 6));
  const nw = sstep(st.rpNap);
  if (nw > 0.001) {
    const br = Math.sin(now * 2.1);
    const goal = { ball: 0.85, curl: 2.7 + br * 0.05, pitch: 4, head: -24, reach: -0.55, ears: -0.7, tailUp: 34, sit: 0, hold: 0, nose: 0, jaw: 0, throwArm: 0 };
    for (const [ch, v] of Object.entries(goal)) out[ch] = mix(out[ch], v, nw);
  }
  // (hugging his tail: curled up in the tail nap or a nap, his tail wrapped round in front of him)
  a.rpHug = Math.max(A.piece === 'tailnap' ? (A.set.ball?.[1] ?? 0) * cw : 0, nw);
  // His paws: up behind his head for the flower; flung high and wide in a Big Scary (the act's or
  // the move's), the near one forward, the far one back.
  let spread = A.paw === 'spread' ? A.pawW * cw : 0;
  let ear = A.paw === 'ear' ? A.pawW * cw : 0;
  // (the move's: eased in with its wind-up, dropped as the paws come down)
  if (name === 'scary') spread = Math.max(spread, mt < 0 ? sstep((mt + MOVES.scary.anticT) / MOVES.scary.anticT) : 1 - sstep(mt / 0.08));
  a.dressPaw = spread > 0.002 || ear > 0.002 ? (side) => (side ? [-2.4 * spread - 0.4 * ear, -1.4 * spread + 1.2 * ear] : [2.6 * spread + 0.8 * ear, -2.2 * spread + 1.8 * ear]) : null;
  // the flower: behind his ear, or up at his nose in both paws; nodding on a spring, jolted by his
  // sneezes
  const fGoal = A.fw * cw;
  st.rpFw = mix(st.rpFw ?? 0, fGoal, k(30));
  a.rpFw = st.rpFw;
  const fs = (st.rpFl ??= { x: 0, v: 0 });
  // (jolted once, as each sneeze goes off: the act's ACHOO, the move's CHOO)
  const lastU = st.rpLastU ?? -1;
  const crossed = (t0) => A.piece === 'sniff' && lastU < t0 && A.u >= t0;
  if (crossed(ACHOO) || (name === 'sneeze' && mt >= MOVES.sneeze.burst && (st.rpLastMt ?? -1) < MOVES.sneeze.burst)) fs.v += 9;
  st.rpLastU = A.piece === 'sniff' ? A.u : -1;
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      fs.v += (-fs.x * 160 - fs.v * 9) * (dt / n);
      fs.x += fs.v * (dt / n);
    }
  }
  st.rpLastMt = name === 'sneeze' ? mt : -1;
  a.rpFlower = clamp(fs.x, -0.7, 0.7);
  a.rpAct = { ...A, cw };
  // His mood: beaten, hurt, asleep, a move, a scene's, the act's, low on health, calm
  let mood = 'calm';
  const cine = m.cine?.mood;
  if (m.hp <= 0) mood = 'dizzy';
  else if (hurt) mood = 'hurt';
  else if (napping) mood = 'sleep';
  else if (name === 'scary') mood = mt < 0.09 ? 'scary' : 'fierce';
  else if (name === 'sneeze') mood = mt < MOVES.sneeze.burst ? 'ahh' : mt < 0.3 ? 'sneeze' : 'dazed';
  else if (name === 'swish') mood = mt < 0.3 ? 'fierce' : 'smug';
  else if (name === 'wash') mood = 'content';
  else if (cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (cw > 0.5 && A.face !== 'calm') mood = A.face;
  else if (fighting && m.hp > 0) mood = 'fierce';
  else if (m.hp < m.def.hp * 0.25) mood = 'worried';
  let F = FACES[mood];
  if (mood === 'talk') {
    const vw = VOWELS[Math.floor((a.t ?? 0) * 7) % VOWELS.length];
    F = { ...F, mw: vw[0], ms: vw[1], mo: vw[2], mr: vw[3] };
  }
  const f = (st.rpF ??= { ...F0, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  const fast = k(14);
  for (const key of KEYS) f[key] = mix(f[key], F[key], fast);
  f.lid = mix(f.lid, F.lid, k(18));
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, k(12));
  a.rpF = f;
  a.rpMood = mood;
  a.rpMove = name ? { name, t: mt } : null;
}

// ---------- Drawing him ----------
// The body over the base's: his dark belly and chest under the rust (a soft fade between).
function belly(ctx, a, mode, K) {
  if (mode === 'line') return;
  const sk = a.bk;
  ctx.save();
  K.bodyPath(ctx, a);
  ctx.clip();
  const bl = Math.max(...P.body.map((p) => p[1]));
  for (const x of [-10.5, -7, -3.5, 0, 3.5, 7]) K.glow(ctx, sk.at([x, bl + 0.4]), K.sc(4.6), 1, LEG.base);
  K.glow(ctx, sk.at([7.4, 2.4]), K.sc(4.6), 0.9, LEG.base);
  for (const x of [-8, -2, 4]) K.glow(ctx, sk.at([x, bl + 1]), K.sc(4.2), 0.6, LEG.deep);
  // (the rust back lit, a soft rim of light along the top)
  K.glow(ctx, sk.at([-3, -6.4]), K.sc(7), 0.55, FUR.lt);
  ctx.restore();
}
// A fringe of soft belly fur over the tops of his near legs, so only their lower halves show.
const FRINGE = [[7.6, 3.6], [5.6, 5.2], [3.3, 6.0], [1.0, 6.3], [-1.3, 6.5], [-3.6, 6.6], [-5.9, 6.6], [-8.1, 6.1], [-10.1, 5.0]];
function fringePath(ctx, a, K, grow = 0) {
  const sk = a.bk;
  ctx.beginPath();
  FRINGE.forEach(([x, y], i) => {
    const c = sk.at([x, y - 0.6]);
    const r = K.sc(1.75 + 0.2 * Math.sin(i * 2.3)) + grow;
    ctx.moveTo(c[0] + r, c[1]);
    ctx.arc(c[0], c[1], r, 0, TAU);
  });
}
function fringe(ctx, a, mode, K) {
  // (tucked away when he curls up or sits up: then his belly faces front and the legs fold away)
  fringePath(ctx, a, K);
  if (mode === 'line') {
    ctx.strokeStyle = LEG_INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = K.colour(a, LEG.base);
  ctx.fill('nonzero');
  ctx.save();
  fringePath(ctx, a, K);
  ctx.clip('nonzero');
  for (const [x, y] of FRINGE) K.glow(ctx, a.bk.at([x - 0.3, y - 1.4]), K.sc(1.6), 0.45, LEG.lt);
  ctx.restore();
}

// His ears: big, soft rounded triangles, white-rimmed and dark inside, a white tuft at the base;
// each rooted inside his skull, on the base's springs.
function earPath(c2, base, an, L, W, grow = 0) {
  const R = (x, y) => {
    const c = Math.cos(an);
    const s = Math.sin(an);
    return [base[0] + x * c - y * s, base[1] + x * s + y * c];
  };
  const p = [R(-L * 0.25, -W - grow), R(L * 0.55, -W * 1.02 - grow), R(L * 0.93 + grow, -W * 0.22), R(L * 1.06 + grow, 0), R(L * 0.93 + grow, W * 0.22), R(L * 0.55, W * 1.02 + grow), R(-L * 0.25, W + grow)];
  c2.moveTo(...p[0]);
  c2.quadraticCurveTo(...p[1], ...p[2]);
  c2.quadraticCurveTo(...p[3], ...p[4]);
  c2.quadraticCurveTo(...p[5], ...p[6]);
  c2.closePath();
}
function ear(ctx, a, mode, K, far) {
  const sk = a.bk;
  const E0 = K.P.ears;
  const base = K.scp(far ? E0.far : E0.near);
  const an = ((far ? -122 : E0.ang) + (far ? sk.earF : sk.earN)) * (Math.PI / 180);
  const L = K.sc(E0.len);
  const W = K.sc(E0.w) / 2;
  K.headFrame(ctx, a);
  ctx.beginPath();
  earPath(ctx, base, an, L, W);
  if (mode === 'line') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  // the white rim (the whole ear), then the dark inside, then a white tuft from its base
  ctx.fillStyle = K.colour(a, far ? CREAM_SH : CREAM);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  earPath(ctx, base, an, L, W);
  ctx.clip();
  const R = (x, y) => [base[0] + x * Math.cos(an) - y * Math.sin(an), base[1] + x * Math.sin(an) + y * Math.cos(an)];
  ctx.beginPath();
  earPath(ctx, R(L * 0.08, 0), an, L * 0.78, W * 0.68);
  ctx.fillStyle = K.colour(a, far ? LEG.deep : EARIN);
  ctx.fill();
  K.glow(ctx, R(L * 0.45, -W * 0.25), W * 0.6, 0.35, LEG.lt);
  for (const [x, y, r] of [[0.18, 0.15, 0.42], [0.36, -0.08, 0.3], [0.08, -0.28, 0.32]]) {
    ctx.beginPath();
    const c = R(L * x, W * y);
    ctx.arc(c[0], c[1], W * r, 0, TAU);
    ctx.fillStyle = K.colour(a, far ? CREAM_SH : CREAM);
    ctx.fill();
  }
  // (where it meets the head, its rust back melting into the skull)
  K.glow(ctx, R(-L * 0.2, 0), W * 1.05, 0.95, far ? FUR.sh : FUR.base);
  ctx.restore();
}

// The tail over the base's plume: its rings (pale buff bands across the rust), a dark tip, and two
// little blossoms caught in its fur.
function tailOutline(a, K) {
  const sk = a.bk;
  const T = sk.tail;
  if (!T?.pts) return null;
  const sp = K.smoothChain(T.pts, 4);
  const n = sp.length;
  const W = K.P.tail.w;
  const wAt = (i) => {
    const f = (i / (n - 1)) * (W.length - 1);
    const j = Math.min(W.length - 2, Math.floor(f));
    return K.sc(mix(W[j], W[j + 1], f - j));
  };
  return { sp, n, wAt };
}
function tail(ctx, a, mode, K) {
  if ((a.rpHug ?? 0) > 0.5) return;
  const O = tailOutline(a, K);
  if (!O) return;
  rings(ctx, a, mode, K, O);
}
// (its rings, tip and blossoms, over the plume drawn behind him or wrapped in front)
function rings(ctx, a, mode, K, O) {
  const { sp, n, wAt } = O;
  const bloom = (i, sd, s0) => {
    const p = sp[Math.min(n - 1, i)];
    const q = sp[Math.min(n - 1, i + 1)];
    const an = Math.atan2(q[1] - p[1], q[0] - p[0]);
    const off = wAt(i) * 0.36 * sd;
    return [p[0] - Math.sin(an) * off, p[1] + Math.cos(an) * off, s0, an];
  };
  const blooms = [bloom(Math.round(n * 0.42), -1, 1), bloom(Math.round(n * 0.7), -1, 0.85)];
  if (mode === 'line') {
    for (const [x, y, s0] of blooms) {
      ctx.beginPath();
      blossomPath(ctx, x, y, K.sc(1.25) * s0, 0.3, 0.5);
      ctx.strokeStyle = BLOOM.ink;
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
    return;
  }
  ctx.save();
  // (clipped to the plume the base just drew)
  ctx.beginPath();
  K.tubePath(ctx, sp, sp.map((_, i) => wAt(i) * 1.02));
  ctx.clip('nonzero');
  ctx.lineCap = 'butt';
  for (const f0 of [0.2, 0.38, 0.56, 0.74]) {
    const i = Math.round(f0 * (n - 1));
    const p = sp[i];
    const q = sp[Math.min(n - 1, i + 1)];
    const an = Math.atan2(q[1] - p[1], q[0] - p[0]) + Math.PI / 2;
    const w = wAt(i);
    ctx.strokeStyle = K.tint(a, RING, 0.92);
    ctx.lineWidth = K.sc(1.55);
    ctx.beginPath();
    ctx.moveTo(p[0] - Math.cos(an) * w, p[1] - Math.sin(an) * w);
    ctx.quadraticCurveTo(p[0] + Math.cos(an - Math.PI / 2) * K.sc(0.6), p[1] + Math.sin(an - Math.PI / 2) * K.sc(0.6), p[0] + Math.cos(an) * w, p[1] + Math.sin(an) * w);
    ctx.stroke();
  }
  // the dark tip
  const tipI = Math.max(1, n - 3);
  // (hugged round him, the tip lies over his side: only a deeper rust there, never a dark blob)
  if ((a.rpHug ?? 0) > 0.5) {
    ctx.beginPath();
    K.tubePath(ctx, sp.slice(tipI), sp.slice(tipI).map((_, j) => wAt(tipI + j) * 1.05));
    ctx.fillStyle = K.tint(a, FUR.sh, 0.75);
    ctx.fill('nonzero');
    ctx.restore();
    for (const [x, y, s0, an] of blooms) blossom(ctx, a, K, x, y, K.sc(1.25) * s0, an * 0.3 + 0.3);
    return;
  }
  K.glow(ctx, sp[tipI], wAt(tipI) * 0.7, 0.6, TIP);
  ctx.beginPath();
  K.tubePath(ctx, sp.slice(tipI), sp.slice(tipI).map((_, j) => wAt(tipI + j) * 1.05));
  ctx.fillStyle = K.colour(a, TIP);
  ctx.fill('nonzero');
  K.glow(ctx, [sp[n - 2][0], sp[n - 2][1] - wAt(n - 2) * 0.25], wAt(n - 2) * 0.35, 0.35, '#c4775a');
  // (a soft light down the top of it, over the rings)
  for (let i = 3; i < n; i += 4) K.glow(ctx, [sp[i][0], sp[i][1] - wAt(i) * 0.28], wAt(i) * 0.4, 0.3, '#fff2e0');
  ctx.restore();
  for (const [x, y, s0, an] of blooms) blossom(ctx, a, K, x, y, K.sc(1.25) * s0, an * 0.3 + 0.3);
}
// Hugged: his tail wrapped round in front of him (drawn over his body, its own soft deeper edge
// where it lies over him, like a held-up paw).
function frontTail(ctx, a, mode, K) {
  if ((a.rpHug ?? 0) <= 0.5) return;
  const O = tailOutline(a, K);
  if (!O) return;
  const { sp, n, wAt } = O;
  const shape = (grow) => {
    K.tubePath(ctx, sp, sp.map((_, i) => wAt(i)), grow);
  };
  ctx.save();
  shape(0);
  if (mode === 'line') {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
  } else {
    shape(1.2);
    ctx.fillStyle = K.colour(a, FUR.base);
    ctx.fill('nonzero');
    shape(0);
    ctx.strokeStyle = K.colour(a, FUR.deep);
    ctx.lineWidth = 1.7;
    ctx.lineJoin = 'round';
    ctx.stroke();
    ctx.fill('nonzero');
    ctx.save();
    shape(0);
    ctx.clip('nonzero');
    K.tubePath(ctx, sp.map((p) => [p[0], p[1] - K.sc(0.6)]), sp.map((_, i) => wAt(i) * 0.5));
    ctx.fillStyle = K.tint(a, FUR.lt, 0.8);
    ctx.fill('nonzero');
    ctx.restore();
  }
  ctx.restore();
  rings(ctx, a, mode, K, O);
  void n;
}
// A little five-petal blossom (white, a yellow eye), in place.
function blossomPath(c2, x, y, r, q, grow = 0) {
  for (let i = 0; i < 5; i++) {
    const an = q + (i * TAU) / 5;
    const c = [x + Math.cos(an) * r * 0.62, y + Math.sin(an) * r * 0.62];
    c2.moveTo(c[0] + r * 0.52 + grow, c[1]);
    c2.arc(c[0], c[1], r * 0.52 + grow, 0, TAU);
  }
}
function blossom(ctx, a, K, x, y, r, q) {
  ctx.beginPath();
  blossomPath(ctx, x, y, r, q);
  ctx.fillStyle = K.colour(a, BLOOM.base);
  ctx.fill('nonzero');
  ctx.beginPath();
  ctx.arc(x, y, r * 0.36, 0, TAU);
  ctx.fillStyle = K.colour(a, BLOOM.eye);
  ctx.fill();
  K.glow(ctx, [x - r * 0.3, y - r * 0.35], r * 0.7, 0.6, '#ffffff');
}

// The hibiscus: tucked behind his near ear (rooted in his head fur), or held up to his nose in both
// paws; five big round petals, a deep pink eye, its long stamen tipped with pollen.
function flowerSpot(a, K) {
  const sk = a.bk;
  const fw = sstep(a.rpFw ?? 0);
  const tuck = sk.headPt([-4.0, -5.5]);
  const tuckAn = sk.ha - 2.15;
  const pa = sk.legs.foreN.P;
  const pf = sk.legs.foreF.P;
  const held = [mix(pa[0], pf[0], 0.4) + K.sc(0.6), mix(pa[1], pf[1], 0.4) - K.sc(1.8)];
  const nose = sk.headPt([K.P.head.nose[0], K.P.head.nose[1]]);
  const heldAn = Math.atan2(nose[1] - held[1], nose[0] - held[0]);
  const c = [mix(tuck[0], held[0], fw), mix(tuck[1], held[1], fw)];
  const turn = heldAn - tuckAn - TAU * Math.round((heldAn - tuckAn) / TAU);
  const an = tuckAn + turn * fw + (a.rpFlower ?? 0);
  return { c, an, fw };
}
function hibiscusPath(c2, r, grow = 0) {
  for (let i = 0; i < 5; i++) {
    const q = (i * TAU) / 5 + Math.PI / 5;
    const c = [Math.cos(q) * r * 0.7, Math.sin(q) * r * 0.7];
    c2.moveTo(c[0] + r * 0.62 + grow, c[1]);
    c2.ellipse(c[0], c[1], r * 0.62 + grow, r * 0.54 + grow, q, 0, TAU);
  }
}
function flower(ctx, a, mode, K) {
  if (!a.bk) return;
  const { c, an } = flowerSpot(a, K);
  const r = K.sc(2.3);
  ctx.translate(...c);
  ctx.rotate(an);
  // (in its own frame: the stamen out along +x)
  const stamen = () => {
    ctx.beginPath();
    ctx.moveTo(r * 0.1, 0);
    ctx.quadraticCurveTo(r * 0.9, -r * 0.12, r * 1.55, -r * 0.05);
  };
  if (mode === 'line') {
    ctx.beginPath();
    hibiscusPath(ctx, r);
    ctx.strokeStyle = HIB.ink;
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.stroke();
    stamen();
    ctx.lineWidth = K.sc(0.5) + 1.4;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(r * 1.6, -r * 0.05, K.sc(0.55) + 0.7, 0, TAU);
    ctx.fillStyle = HIB.ink;
    ctx.fill();
    return;
  }
  ctx.beginPath();
  hibiscusPath(ctx, r);
  ctx.fillStyle = K.colour(a, HIB.base);
  ctx.fill('nonzero');
  ctx.save();
  ctx.beginPath();
  hibiscusPath(ctx, r);
  ctx.clip('nonzero');
  // each petal lit at its edge, a soft crease between them, the deep pink eye with its streaks
  for (let i = 0; i < 5; i++) {
    const q = (i * TAU) / 5 + Math.PI / 5;
    K.glow(ctx, [Math.cos(q) * r * 1.0, Math.sin(q) * r * 1.0 - r * 0.1], r * 0.62, 0.75, HIB.lt);
    ctx.strokeStyle = K.tint(a, HIB.sh, 0.55);
    ctx.lineWidth = K.sc(0.22);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(Math.cos(q + 0.63) * r * 0.25, Math.sin(q + 0.63) * r * 0.25);
    ctx.lineTo(Math.cos(q + 0.63) * r * 0.95, Math.sin(q + 0.63) * r * 0.95);
    ctx.stroke();
  }
  K.glow(ctx, [0, 0], r * 0.62, 1, HIB.eye);
  ctx.restore();
  stamen();
  ctx.strokeStyle = K.colour(a, HIB.stamen);
  ctx.lineWidth = K.sc(0.5);
  ctx.lineCap = 'round';
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const q = -1.2 + i * 0.8;
    ctx.beginPath();
    ctx.arc(r * 1.6 + Math.cos(q) * K.sc(0.35), -r * 0.05 + Math.sin(q) * K.sc(0.35), K.sc(0.36), 0, TAU);
    ctx.fillStyle = K.colour(a, HIB.pollen);
    ctx.fill();
  }
  K.glow(ctx, [r * 1.5, -r * 0.2], K.sc(0.6), 0.8, '#ffffff');
}

// His face, in the head's frame (facing right): the cream mask and tear marks, honey-drop eyes, the
// cream brow spots, a soft cat mouth, a heart nose.
function face(ctx, a, sk, K) {
  const f = a.rpF;
  if (!f) return;
  const sc = K.sc;
  const H = K.P.head;
  const rx = sc(H.skull[0]);
  const ry = sc(H.skull[1]);
  const t = a.t ?? 0;
  const ink = K.colour(a, '#4a2622');
  const [mx, my, mrx, mry] = H.muzzle.map(sc);
  const [cx, cy, crx, cry] = H.cheek.map(sc);
  const line = (pts, w, col = ink) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = sc(w);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i += 2) ctx.quadraticCurveTo(...pts[i], ...pts[i + 1]);
    ctx.stroke();
  };
  const ey = -ry * 0.1;
  const exN = rx * 0.3;
  const exF = rx * 0.86;
  // the mask: the cream muzzle and cheek fluff, the rust tear marks between, a soft blush
  ctx.save();
  ctx.beginPath();
  K.headShape(ctx, sk);
  ctx.clip('nonzero');
  ctx.fillStyle = K.colour(a, CREAM);
  ctx.beginPath();
  ctx.ellipse(mx + sc(0.2), my + sc(0.15), mrx * 1.02, mry * 1.0, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx + crx * 0.22, cy + cry * 0.42, crx * 0.66, cry * 0.62, 0.15, 0, TAU);
  ctx.fill();
  K.glow(ctx, [cx + crx * 0.2, cy + cry * 0.1], crx * 0.75, 0.6, CREAM);
  K.glow(ctx, [mx - mrx * 0.6, my - mry * 0.4], mrx * 0.8, 0.5, CREAM);
  // (a soft shade under the muzzle, on the chin)
  K.glow(ctx, [mx - sc(0.6), my + mry * 0.95], mrx * 0.7, 0.45, CREAM_SH);
  // the tear marks: from under each eye down to the jaw, tapering
  const tearMark = (x0, s0) => {
    ctx.fillStyle = K.colour(a, TEAR);
    ctx.beginPath();
    ctx.moveTo(x0 - sc(1.0) * s0, ey + sc(1.9));
    ctx.quadraticCurveTo(x0 - sc(0.2) * s0, ey + sc(4.2), x0 - sc(1.4) * s0, ey + sc(7.8));
    ctx.quadraticCurveTo(x0 - sc(2.3) * s0, ey + sc(5.0), x0 - sc(2.4) * s0, ey + sc(1.9));
    ctx.quadraticCurveTo(x0 - sc(1.7) * s0, ey + sc(1.4), x0 - sc(1.0) * s0, ey + sc(1.9));
    ctx.fill();
  };
  tearMark(exN + sc(0.6), 1);
  tearMark(exF + sc(0.2), 0.55);
  K.glow(ctx, [exN + sc(1.6), ey + sc(3.6)], sc(2.4), 0.6 * f.bl, '#ff8fae');
  ctx.restore();
  // the eyes
  const blink = f.lid < 0.6 && !a.rpMove && a.rpMood !== 'crossed' ? win((t + 0.9 + ((a.mo?.uid ?? 0) % 5) * 0.6) % (a.rpMood === 'blink' ? 1.3 : 4.3), 0.7, 0.78, 0.86, 0.97) : 0;
  const L = Math.max(f.lid, blink);
  const eye = (ex, ey0, s0, far) => {
    const ew = sc(1.85) * s0 * f.wide;
    const eh = sc(2.35) * f.wide;
    const closed = sstep((L - 0.7) / 0.3);
    const open = 1 - closed;
    if (closed > 0.01) {
      ctx.save();
      ctx.globalAlpha *= closed;
      const w = 0.62;
      const shut = (k0, pts) => {
        if (k0 <= 0.01) return;
        ctx.globalAlpha *= k0;
        for (const p of pts) line(p, w);
        ctx.globalAlpha /= k0;
      };
      shut(f.shut.happy, [[[ex - ew, ey0 + eh * 0.2], [ex, ey0 - eh * 0.75], [ex + ew, ey0 + eh * 0.2]]]);
      // (asleep or blissful: a soft smile of a lid, two little lashes at its outer end)
      shut(f.shut.sleep, [[[ex - ew, ey0], [ex, ey0 + eh * 0.55], [ex + ew, ey0]], [[ex - ew * 0.9, ey0 + eh * 0.05], [ex - ew * 1.2, ey0 + eh * 0.12], [ex - ew * 1.35, ey0 + eh * 0.35]]]);
      shut(f.shut.squeeze, [[[ex + ew, ey0 - eh * 0.5], [ex - ew * 0.1, ey0 - eh * 0.1], [ex - ew * 0.9, ey0 + sc(0.05)]], [[ex - ew * 0.9, ey0 + sc(0.05)], [ex - ew * 0.1, ey0 + eh * 0.2], [ex + ew, ey0 + eh * 0.5]]]);
      if (f.shut.dizzy > 0.01) {
        ctx.globalAlpha *= f.shut.dizzy;
        ctx.strokeStyle = ink;
        ctx.lineWidth = sc(0.42);
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const q = (i / 26) * TAU * 2 + t * 5 * (far ? -1 : 1);
          const r = (i / 26) * ew * 0.95;
          const p = [ex + Math.cos(q) * r, ey0 + Math.sin(q) * r * 1.1];
          i ? ctx.lineTo(...p) : ctx.moveTo(...p);
        }
        ctx.stroke();
        ctx.globalAlpha /= f.shut.dizzy;
      }
      ctx.restore();
    }
    if (open <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= open;
    const Lo = clamp(L, 0, 0.85);
    // the lids: the upper one coming down (flat and heavy, sloping down to the outer corner: his dozy
    // look), the lower one rising in a smile; the eye shows only between them
    const ly = ey0 - eh + eh * 1.9 * Lo;
    const low = ey0 + eh * (1.05 - 0.7 * f.lw);
    const droop = eh * 0.22;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ex - ew * 1.35, ly + droop + eh * 0.45 * (1 - Lo));
    ctx.quadraticCurveTo(ex, ly - eh * 0.1 - eh * 0.7 * (1 - Lo), ex + ew * 1.35, ly + eh * 0.12 + eh * 0.45 * (1 - Lo));
    ctx.lineTo(ex + ew * 1.35, low + eh * 0.3);
    ctx.quadraticCurveTo(ex, low - eh * 0.25, ex - ew * 1.35, low + eh * 0.3);
    ctx.closePath();
    ctx.clip();
    // the honey drop: an upright egg, fuller at the bottom; deep amber at the top fading to bright
    // honey low down, a dark rim
    const egg = () => {
      ctx.beginPath();
      ctx.moveTo(ex, ey0 - eh);
      ctx.bezierCurveTo(ex + ew * 0.95, ey0 - eh, ex + ew * 1.1, ey0 + eh * 0.25, ex + ew * 0.85, ey0 + eh * 0.7);
      ctx.quadraticCurveTo(ex, ey0 + eh * 1.22, ex - ew * 0.85, ey0 + eh * 0.7);
      ctx.bezierCurveTo(ex - ew * 1.1, ey0 + eh * 0.25, ex - ew * 0.95, ey0 - eh, ex, ey0 - eh);
      ctx.closePath();
    };
    egg();
    ctx.fillStyle = K.colour(a, '#4a2420');
    ctx.fill();
    ctx.save();
    egg();
    ctx.clip();
    const g = ctx.createLinearGradient(ex, ey0 - eh, ex, ey0 + eh);
    g.addColorStop(0, '#7a3a24');
    g.addColorStop(0.45, '#c46d2c');
    g.addColorStop(0.85, '#ffc35a');
    g.addColorStop(1, '#ffdf8c');
    ctx.beginPath();
    ctx.ellipse(ex, ey0 + eh * 0.06, ew * 0.82, eh * 0.95, 0, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();
    // the pupil: big and soft, where he looks
    const px = ex + f.px * ew * 0.38;
    const py = ey0 - eh * 0.05 + f.py * eh * 0.3;
    ctx.beginPath();
    ctx.ellipse(px, py, ew * 0.46, eh * 0.56, 0, 0, TAU);
    ctx.fillStyle = K.colour(a, '#2c1512');
    ctx.fill();
    ctx.restore();
    ctx.restore();
    // the glints: a little five-petal blossom up front, a round one low behind
    if (L < 0.8) {
      const gx = ex + ew * 0.3 + f.px * ew * 0.15;
      const gy = Math.max(ly + eh * 0.5, ey0 - eh * 0.36);
      const gr = ew * 0.36;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const q = -Math.PI / 2 + (i * TAU) / 5 + 0.2;
        const c = [gx + Math.cos(q) * gr * 0.5, gy + Math.sin(q) * gr * 0.5];
        ctx.moveTo(c[0] + gr * 0.42, c[1]);
        ctx.arc(c[0], c[1], gr * 0.42, 0, TAU);
      }
      ctx.fill('nonzero');
      ctx.beginPath();
      ctx.arc(ex - ew * 0.38, Math.min(ey0 + eh * 0.45, low - eh * 0.12), ew * 0.15, 0, TAU);
      ctx.globalAlpha *= 0.9;
      ctx.fill();
      ctx.globalAlpha /= 0.9;
    }
    // the upper lid line (soft and heavy, following the lid), two little curls off its outer corner;
    // the soft lower lid
    line([[ex - ew * 1.12, ly + droop + eh * 0.42 * (1 - Lo)], [ex, ly - sc(0.2) - eh * 0.52 * (1 - Lo)], [ex + ew * 1.02, ly + eh * 0.36 * (1 - Lo)]], far ? 0.48 : 0.6);
    if (!far) {
      const b = [ex - ew * 1.05, ly + droop + eh * 0.36 * (1 - Lo)];
      line([b, [b[0] - sc(0.55), b[1] - sc(0.05)], [b[0] - sc(0.75), b[1] - sc(0.6)]], 0.42);
      line([[b[0] + sc(0.15), b[1] - sc(0.35)], [b[0] - sc(0.2), b[1] - sc(0.6)], [b[0] - sc(0.2), b[1] - sc(1.05)]], 0.36);
    }
    ctx.globalAlpha *= 0.75;
    line([[ex - ew * 0.85, low + eh * 0.12], [ex, low - eh * 0.04], [ex + ew * 0.85, low + eh * 0.12]], 0.34, K.colour(a, '#c98468'));
    ctx.restore();
  };
  eye(exN, ey, 1, false);
  eye(exF, ey - sc(0.2), 0.56, true);
  // the brows: the red panda's cream spots over each eye, tilted (+ knit, the front end down) and
  // raised by the mood
  const brow = (bx, s0) => {
    ctx.save();
    ctx.translate(bx, ey - sc(3.6) - f.by * sc(0.9));
    ctx.rotate(f.bt * 0.42);
    ctx.beginPath();
    ctx.ellipse(0, 0, sc(1.55) * s0, sc(0.85), -0.12, 0, TAU);
    ctx.fillStyle = K.colour(a, CREAM);
    ctx.fill();
    K.glow(ctx, [-sc(0.3) * s0, -sc(0.25)], sc(1.2) * s0, 0.6, '#ffffff');
    ctx.restore();
  };
  brow(exN - sc(0.2), 1);
  brow(exF + sc(0.1), 0.55);
  // the mouth, under the muzzle: a short line down from the nose, then the cat mouth (closed), or
  // open from its width, smile and openness, rounder into an "o"
  const nx = sc(H.nose[0]);
  const ny = sc(H.nose[1]);
  const ox = mx + mrx * 0.55;
  const oy = my + mry * 0.55;
  const w = sc(1.6) * f.mw;
  const mr = clamp(f.mr, 0, 1);
  const lip = K.colour(a, '#8b4a44');
  line([[nx - sc(0.3), ny + sc(0.8)], [nx - sc(0.45), oy - sc(0.7)], [ox, oy - sc(0.1)]], 0.34, lip);
  if (f.mo > 0.08) {
    const o = f.mo;
    const hw = w * (1 - 0.55 * mr);
    const c0 = ox - hw * 0.35;
    const top = oy - sc(0.15);
    const corner = top - f.ms * sc(0.45) * (1 - mr);
    const bot = top + o * sc(1.7) * (0.75 + 0.25 * mr);
    ctx.beginPath();
    ctx.moveTo(c0 - hw, corner);
    ctx.quadraticCurveTo(c0, top - sc(0.25) * mr, c0 + hw * 0.75, top);
    ctx.quadraticCurveTo(c0 + hw * 0.8, bot, c0, bot);
    ctx.quadraticCurveTo(c0 - hw * 0.95, bot, c0 - hw, corner);
    ctx.closePath();
    ctx.fillStyle = K.colour(a, FUR.mouth);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.beginPath();
    ctx.ellipse(c0 - hw * 0.1, bot - sc(0.1), hw * 0.6, o * sc(0.65), 0, 0, TAU);
    ctx.fillStyle = K.colour(a, '#f28da5');
    ctx.fill();
    // (two tiny rounded fangs when he means business: as scary as he gets)
    if ((a.rpMood === 'scary' || a.rpMood === 'fierce') && o > 0.35) {
      ctx.fillStyle = K.colour(a, '#fffaf2');
      for (const fx0 of [c0 + hw * 0.45, c0 - hw * 0.45]) {
        ctx.beginPath();
        ctx.moveTo(fx0 - sc(0.28), top - sc(0.1));
        ctx.lineTo(fx0 + sc(0.28), top - sc(0.1));
        ctx.quadraticCurveTo(fx0 + sc(0.05), top + sc(0.75), fx0, top + sc(0.75));
        ctx.quadraticCurveTo(fx0 - sc(0.05), top + sc(0.75), fx0 - sc(0.28), top - sc(0.1));
        ctx.fill();
      }
    }
    ctx.restore();
  } else {
    // (closed: the back curve of the cat mouth, turning up as he smiles, and its little front curve)
    line([[ox, oy - sc(0.1)], [ox - w * 0.5, oy + sc(0.45) + f.ms * sc(0.15)], [ox - w, oy - f.ms * sc(0.55)]], 0.38, lip);
    line([[ox, oy - sc(0.1)], [ox + w * 0.25, oy + sc(0.35)], [ox + w * 0.45, oy + sc(0.05)]], 0.32, lip);
  }
  // the heart nose: soft and dark, twitching as he sniffs
  const sniffing = a.bk?.nose ?? 0;
  const tw = sniffing * Math.sin(t * 34) * sc(0.16);
  const hx = nx + sc(0.1);
  const hy = ny + tw;
  const hr = sc(H.nose[2]) * (1 + 0.06 * sniffing);
  ctx.beginPath();
  ctx.moveTo(hx, hy + hr * 0.95);
  ctx.bezierCurveTo(hx - hr * 1.5, hy + hr * 0.1, hx - hr * 1.1, hy - hr * 1.05, hx - hr * 0.1, hy - hr * 0.55);
  ctx.quadraticCurveTo(hx, hy - hr * 0.45, hx + hr * 0.1, hy - hr * 0.55);
  ctx.bezierCurveTo(hx + hr * 1.1, hy - hr * 1.05, hx + hr * 1.5, hy + hr * 0.1, hx, hy + hr * 0.95);
  ctx.fillStyle = K.colour(a, FUR.nose);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.ellipse(hx - hr * 0.5, hy - hr * 0.42, hr * 0.32, hr * 0.2, -0.5, 0, TAU);
  ctx.fill();
  // a sweat drop for a sheepish or worried look
  if (a.rpMood === 'sheepish' || a.rpMood === 'worried' || a.rpMood === 'shifty') {
    const x = -rx * 0.12;
    const y = -ry * 0.42 + ((t * 0.6) % 1) * sc(0.8);
    ctx.fillStyle = 'rgba(200,236,255,0.95)';
    ctx.beginPath();
    ctx.moveTo(x, y - sc(1.1));
    ctx.quadraticCurveTo(x + sc(0.85), y + sc(0.3), x, y + sc(0.85));
    ctx.quadraticCurveTo(x - sc(0.85), y + sc(0.3), x, y - sc(1.1));
    ctx.fill();
  }
}

// ---------- His effects ----------
function sparkle(ctx, x, y, k, fill) {
  if (k <= 0.01) return;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fillStyle = fill;
  ctx.fill();
}
// (a speck of pollen: a soft glowing golden bead, never a dot)
function mote(ctx, K, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  K.glow(ctx, [x, y], r * 2.4, 0.55, POLLEN.base);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = POLLEN.lt;
  ctx.fill();
  ctx.restore();
}
// (a soft round puff of pollen, a golden rim)
function puff(ctx, x, y, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fillStyle = POLLEN.lt;
  ctx.fill();
  ctx.strokeStyle = POLLEN.rim;
  ctx.lineWidth = Math.max(0.4, r * 0.14);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU);
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha *= 0.7;
  ctx.fill();
  ctx.restore();
}
// (a hibiscus petal, tumbling: a soft rounded drop)
function petal(ctx, x, y, s, q, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ctx.translate(x, y);
  ctx.rotate(q);
  ctx.beginPath();
  ctx.moveTo(-1.3 * s, 0);
  ctx.quadraticCurveTo(-0.6 * s, -1.0 * s, 0.6 * s, -0.75 * s);
  ctx.quadraticCurveTo(1.45 * s, 0, 0.6 * s, 0.75 * s);
  ctx.quadraticCurveTo(-0.6 * s, 1.0 * s, -1.3 * s, 0);
  ctx.fillStyle = HIB.base;
  ctx.fill();
  ctx.strokeStyle = HIB.ink;
  ctx.lineWidth = 0.28 * s;
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0.1 * s, -0.2 * s, 0.6 * s, 0.3 * s, 0, 0, TAU);
  ctx.fillStyle = HIB.lt;
  ctx.fill();
  ctx.restore();
}
function heart(ctx, c, r, al) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ctx.fillStyle = '#ff9ec0';
  ctx.beginPath();
  ctx.moveTo(c[0], c[1] + r);
  ctx.bezierCurveTo(c[0] - r * 1.6, c[1] - r * 0.2, c[0] - r * 0.6, c[1] - r * 1.4, c[0], c[1] - r * 0.5);
  ctx.bezierCurveTo(c[0] + r * 0.6, c[1] - r * 1.4, c[0] + r * 1.6, c[1] - r * 0.2, c[0], c[1] + r);
  ctx.fill();
  ctx.restore();
}
// (a little rounded "z", the right way round when he faces left)
function zee(ctx, a, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= clamp(al, 0, 1);
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(-s, -s);
    ctx.lineTo(s, -s);
    ctx.lineTo(-s, s);
    ctx.lineTo(s, s);
  };
  path();
  ctx.strokeStyle = '#b79bd0';
  ctx.lineWidth = s * 0.9;
  ctx.stroke();
  path();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = s * 0.45;
  ctx.stroke();
  ctx.restore();
}
// The sneeze: a cone of soft pollen puffs out ahead of his nose, sparkles, a petal or two.
function sneezeBurst(ctx, K, nose, dirA, k, big, grow = 1) {
  const s = K.sc(1) * grow;
  const reach = (big ? 11 : 5) * s;
  for (let i = 0; i < (big ? 7 : 4); i++) {
    const q = dirA + (i / ((big ? 7 : 4) - 1) - 0.5) * (big ? 0.9 : 0.7);
    const d = reach * (0.35 + 0.65 * sstep(k)) * (0.75 + 0.25 * Math.sin(i * 2.1));
    const r = (big ? 2.2 : 1.3) * s * (0.6 + 0.6 * sstep(k)) * (0.8 + 0.25 * Math.cos(i * 1.7));
    puff(ctx, nose[0] + Math.cos(q) * d, nose[1] + Math.sin(q) * d - k * 2 * s, r, (1 - k) * 0.95);
  }
  for (let i = 0; i < (big ? 5 : 3); i++) {
    const q = dirA + (i - 2) * 0.32;
    const d = reach * (0.5 + 0.7 * sstep(k));
    sparkle(ctx, nose[0] + Math.cos(q) * d, nose[1] + Math.sin(q) * d - s, (1.5 - 0.5 * (i % 2)) * s * (1 - k), i % 2 ? '#fff6c8' : '#ffffff');
  }
}
function fx(ctx, m, a, K) {
  const sk = a.bk;
  if (!sk) return;
  const s = K.sc(1);
  const A = a.rpAct;
  const t = a.t ?? 0;
  const nose = sk.headPt([K.P.head.nose[0] + 0.4, K.P.head.nose[1]]);
  const top = sk.headPt([0, -K.P.head.skull[1] - 1]);
  ctx.save();
  if (A && A.cw > 0.01 && m.hp > 0) {
    const u = A.u;
    const pc = A.piece;
    const cw = A.cw;
    if (pc === 'sniff') {
      const { c: fc, an: fa } = flowerSpot(a, K);
      const tipF = [fc[0] + Math.cos(fa) * K.sc(3.6), fc[1] + Math.sin(fa) * K.sc(3.6)];
      // pollen drifting up off the stamen into his nose while he sniffs and "ahh"s
      if (u > 2.5 && u < ACHOO) {
        for (let i = 0; i < 5; i++) {
          const kk = (u * 0.9 + i / 5) % 1;
          const p = [mix(tipF[0], nose[0], kk) + Math.sin(kk * 7 + i) * s * 0.8, mix(tipF[1], nose[1], kk) - Math.sin(Math.PI * kk) * s * 1.5];
          mote(ctx, K, p[0], p[1], s * 0.38, Math.sin(Math.PI * kk) * cw * win(u, 2.5, 2.8, ACHOO - 0.2, ACHOO));
        }
      }
      // hearts as he sniffs it
      for (const [t0, dx] of [[2.6, -1], [3.0, 1.5]]) {
        const kk = (u - t0) / 1.2;
        if (kk > 0 && kk < 1) heart(ctx, [top[0] + dx * s * 2, top[1] - kk * 6 * s], 1.1 * s * Math.sin(Math.PI * Math.min(1, kk * 1.4)), Math.sin(Math.PI * kk) * cw);
      }
      // the tickle: a twinkle at his nose, growing as the "ahh" builds
      if (u > 3.7 && u < ACHOO) {
        const kk = win(u, 3.7, 5.2, 5.4, 5.9) + win(u, 6.0, 6.2, 6.27, ACHOO);
        sparkle(ctx, nose[0] + s * 1.2, nose[1] - s * 1.6, (0.8 + 0.5 * Math.sin(u * 11)) * s * kk, rgba('#fff3a8', cw));
      }
      // ACHOO: the burst ahead of his nose, and petals shaken off the flower
      const kb = (u - ACHOO) / 0.9;
      if (kb > 0 && kb < 1) {
        sneezeBurst(ctx, K, nose, sk.ha + 0.25, kb, true);
        for (let i = 0; i < 2; i++) petal(ctx, fc[0] + (3 + i * 3) * s * sstep(kb), fc[1] + (kb * kb * 9 - 2 - i) * s, s * 0.9, kb * 6 + i * 2, (1 - kb) * cw);
      }
    } else if (pc === 'startle') {
      // the petal: drifting down, swaying, onto his nose; blown off again
      if (u < LAND) {
        const kk = sstep(u / LAND);
        const start = [nose[0] + 5 * s, nose[1] - 17 * s];
        const p = [mix(start[0], nose[0] + 0.4 * s, kk) + Math.sin(u * 3.2) * 2.4 * s * (1 - kk), mix(start[1], nose[1] - 0.9 * s, kk)];
        petal(ctx, p[0], p[1], s * 1.0, Math.sin(u * 3.2) * 0.8 + 0.4, cw * sstep(u / 0.3));
      } else if (u < PFFT) {
        petal(ctx, nose[0] + 0.4 * s, nose[1] - 0.9 * s, s * 1.0, 0.4, cw);
      } else if (u < PFFT + 1.0) {
        const kk = (u - PFFT) / 1.0;
        petal(ctx, nose[0] + (0.4 + 8 * sstep(kk)) * s, nose[1] - (0.9 + 5 * Math.sin(Math.PI * kk * 0.8)) * s + kk * 3 * s, s, 0.4 + kk * 7, (1 - kk) * cw);
        for (let i = 0; i < 3; i++) sparkle(ctx, nose[0] + (2 + i * 1.6) * s * (0.5 + kk), nose[1] - (i - 1) * 1.2 * s, 0.8 * s * (1 - kk), '#ffffff');
      }
      // the startle: three little pop lines over his head
      const kk = (u - 1.55) / 0.45;
      if (kk > 0 && kk < 1) {
        ctx.globalAlpha = (1 - kk) * cw;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7 * s;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          const q = -Math.PI / 2 + (i - 1) * 0.6;
          const r0 = (2 + kk * 2.5) * s;
          ctx.beginPath();
          ctx.moveTo(top[0] + Math.cos(q) * r0, top[1] + Math.sin(q) * r0);
          ctx.lineTo(top[0] + Math.cos(q) * (r0 + 1.8 * s), top[1] + Math.sin(q) * (r0 + 1.8 * s));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    } else if (pc === 'tailnap') {
      // z's drifting up off him as he dozes
      if (u > 1.6 && u < NAPLAND + 1.4) {
        for (let i = 0; i < 3; i++) {
          const kk = ((u - 1.6) * 0.45 + i / 3) % 1;
          zee(ctx, a, top[0] + (1 + kk * 3) * s, top[1] - kk * 7 * s, (0.6 + kk * 0.5) * s, Math.sin(Math.PI * kk) * cw * win(u, 1.6, 2.0, NAPLAND + 1.0, NAPLAND + 1.4));
        }
      }
      // a petal drifting down onto his nose
      if (u > NAPLAND - 1.3 && u < TCHOO) {
        const kk = sstep((u - (NAPLAND - 1.3)) / 1.3);
        const start = [nose[0] + 4 * s, nose[1] - 14 * s];
        petal(ctx, mix(start[0], nose[0], kk) + Math.sin(u * 3) * 2 * s * (1 - kk), mix(start[1], nose[1] - 0.8 * s, kk), s * 0.9, Math.sin(u * 3) * 0.7, cw * win(u, NAPLAND - 1.3, NAPLAND - 1.0, TCHOO - 0.05, TCHOO + 0.02));
      }
      // the tiny sneeze: a little puff (and the petal flicked away in it)
      const kb = (u - TCHOO) / 0.6;
      if (kb > 0 && kb < 1) {
        sneezeBurst(ctx, K, nose, sk.ha + 0.2, kb, false);
        petal(ctx, nose[0] + 6 * s * sstep(kb), nose[1] - 3 * s * Math.sin(Math.PI * kb), s * 0.9, kb * 8, (1 - kb) * cw);
      }
      // waking with a start: the pop lines
      const kk = (u - TCHOO - 0.2) / 0.45;
      if (kk > 0 && kk < 1) {
        ctx.globalAlpha = (1 - kk) * cw;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.7 * s;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          const q = -Math.PI / 2 + (i - 1) * 0.6;
          const r0 = (2 + kk * 2.5) * s;
          ctx.beginPath();
          ctx.moveTo(top[0] + Math.cos(q) * r0, top[1] + Math.sin(q) * r0);
          ctx.lineTo(top[0] + Math.cos(q) * (r0 + 1.8 * s), top[1] + Math.sin(q) * (r0 + 1.8 * s));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }
  }
  // the nap's z's
  if (a.rpMood === 'sleep' && !(A?.cw > 0.5) && m.hp > 0) {
    for (let i = 0; i < 3; i++) {
      const kk = (t * 0.45 + i / 3) % 1;
      zee(ctx, a, top[0] + (1 + kk * 3) * s, top[1] - kk * 7 * s, (0.6 + kk * 0.5) * s, Math.sin(Math.PI * kk));
    }
  }
  // the moves'
  const mvn = a.rpMove;
  if (mvn && m.hp > 0) {
    if (mvn.name === 'sneeze') {
      // the wind-up's tickle at his nose; then the cone of pollen
      if (mvn.t < MOVES.sneeze.burst) sparkle(ctx, nose[0] + s * 1.2, nose[1] - s * 1.6, (1 + 0.4 * Math.sin(t * 11)) * s, '#fff3a8');
      const kb = (mvn.t - MOVES.sneeze.burst) / 0.6;
      if (kb > 0 && kb < 1) sneezeBurst(ctx, K, nose, sk.ha + 0.3, kb, true, 1.3);
    } else if (mvn.name === 'swish') {
      // loose petals flung off his tail as it whips over
      const kb = (mvn.t - 0.06) / 0.6;
      const tp = sk.tail.pts ? sk.tail.pts[sk.tail.pts.length - 2] : sk.pivot;
      if (kb > 0 && kb < 1) for (let i = 0; i < 4; i++) {
        const q = -Math.PI / 2 + (i - 1.5) * 0.5;
        const d = (3 + 8 * sstep(kb)) * s;
        petal(ctx, tp[0] + Math.cos(q) * d + kb * 4 * s, tp[1] + Math.sin(q) * d + kb * kb * 8 * s, s * 0.85, q + kb * 7, 1 - kb);
      }
    } else if (mvn.name === 'scary' && mvn.t < 0) {
      // reared up: the startle lines
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.7 * s;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const q = -Math.PI / 2 + (i - 1) * 0.6;
        const r0 = (3 + Math.sin(t * 9 + i) * 0.4) * s;
        ctx.beginPath();
        ctx.moveTo(top[0] + Math.cos(q) * r0, top[1] + Math.sin(q) * r0);
        ctx.lineTo(top[0] + Math.cos(q) * (r0 + 1.8 * s), top[1] + Math.sin(q) * (r0 + 1.8 * s));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

// ---------- His dress on the rodent ----------
const look = {
  kind: 'squirrel',
  C: FUR,
  P,
  ink: INK,
  legC: LEG,
  legInk: LEG_INK,
  moves: MOVES,
  face,
  pick: (m, a, st) => (typeof m.move === 'string' && MOVES[m.move] ? m.move : POOL[(st.rdN ?? 0) % POOL.length]),
  pose,
  after: (m, a) => {
    // (beaten: his paws down, the dizzy face from the pose)
    if (m.hp <= 0) a.dressPaw = null;
  },
  hide: { earF: true, earN: true, tail: (a) => (a.rpHug ?? 0) > 0.5 },
  under: {},
  over: {
    earF: (ctx, a, mode, K) => ear(ctx, a, mode, K, true),
    tail,
    body: belly,
    foreN: fringe,
    earN: (ctx, a, mode, K) => ear(ctx, a, mode, K, false),
    // the flower last of all: over his ear when tucked, in his paws when held
    hands: (ctx, a, mode, K) => {
      frontTail(ctx, a, mode, K);
      ctx.save();
      flower(ctx, a, mode, K);
      ctx.restore();
    },
  },
  fx,
};

export const BLOSSOM_RED_PANDA = dressedRodent(look);
// (`noHop`: none of the monster drawer's little hops or idle notes over him; he shows his moods in his
// own act and face)
BLOSSOM_RED_PANDA.art.noHop = true;
// (his dress, for the dev tools that watch his parts frame by frame)
export const BLOSSOM_RED_PANDA_LOOK = look;
