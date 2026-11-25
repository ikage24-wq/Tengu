// Ramen Ryu's design (2026-11-25, the Cup-Noodle Dragon remade on the serpent base, the player's pick
// "A" of three, "heavily heavily polish it"): the Queen's 2 a.m. dinner, every single night, as a
// cheeky little noodle dragon still half in his cup. He wears the cup round his waist like a skirt (a
// red and white label, gold lines, a fish-cake badge), the broth at its rim with noodles spilling over;
// below it his tail is one thick rope of wavy golden noodles (drawn live along the tail's bones by his
// rig, so every strand wiggles); the peeled foil lid stands up behind his far shoulder; a white
// tee in the cup's colours and a red scarf, its ends flicking; golden noodle hair, wavy, falling
// down his back; a round noodle bun on top with a pair of red chopsticks stuck in it; soft fin ears; noodle whiskers; amber
// dragon eyes, a hungry fang grin.
// Each piece, in the serpent base's own drawing units (blankBody('serpent'), read only), named for the
// bone it rides on:
//   lid        the peeled foil lid standing up behind him (on his chest, on a spring)
//   hairB      the long wavy noodle hair behind his head and down his back (on a spring)
//   bun        the noodle bun on top of his head (on a spring); sticks: the chopsticks in it
//   head       his face (each expression), fin ears, the wavy fringe
//   lockF/N    a long wavy noodle lock by each cheek (on springs)
//   top        his white tee in the cup's colours; scarf: his red scarf round his neck; scarfEnd: its ends
//              (on a spring)
//   cup        the cup round his waist; spill: the noodles over its rim (on a spring)
//   sleeveFu/Nu  white cap sleeves trimmed red; cuffF/N: red wristbands
// Everything drawn here from scratch (nothing of the player character's: the player's rule).
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob, HS, mapShape } from '../mobs/kidbase.js';

const HX = 151;
const NECK = 85;
const HY0 = NECK - 31 * HS;
const H2B = ([x, y]) => [HX + x * HS, HY0 + y * HS];
const inHead = (list) => list.map((sh) => mapShape(sh, H2B, HS));
const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);
const lens = ([x0, y0], [x1, y1], w, bow, c) => {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const [nx, ny] = [-(y1 - y0) / len, (x1 - x0) / len];
  const mx = (x0 + x1) / 2 + nx * bow;
  const my = (y0 + y1) / 2 + ny * bow;
  return F(blob([[x0, y0], [mx + nx * w * 0.5, my + ny * w * 0.5], [x1, y1], [mx - nx * w * 0.5, my - ny * w * 0.5]], c, 2));
};
const toward = ([x, y], [px, py], t) => [x + (px - x) * t, y + (py - y) * t];

export const SKIN_COLORS = { lt: '#fff8ee', base: '#ffe8d4', sh: '#f4ccb0', deep: '#e0a888' };
const SK = SKIN_COLORS;
export const NOOD = ['#fff6c8', '#f8dc7c', '#e8b850', '#c8923a'];
export const CUP = { red: '#e8304a', redLt: '#ff5a6a', redSh: '#b8243a', white: '#ffffff', shade: '#e6e4f0', gold: '#e8b14a', broth: '#d8a064', brothSh: '#b8743c' };
const NORI = ['#4e6a54', '#34483a', '#22302a', '#16201c'];

// ---------- Faces ----------
// e the eyes, m the mouth, b the brows; cheeks puffed (slurping), a fang.
const FACES = {
  idle: { e: 'open', m: 'grin', b: 'cheeky' }, blink: { e: 'blink', m: 'grin', b: 'cheeky' },
  happy: { e: 'happy', m: 'open', b: 'up' }, angry: { e: 'fierce', m: 'snarl', b: 'cross' },
  hurt: { e: 'squeeze', m: 'wobble', b: 'worry' }, dead: { e: 'squeeze', m: 'wobble', b: 'worry' },
  o: { e: 'wide', m: 'o', b: 'up' }, shout: { e: 'fierce', m: 'shout', b: 'cross' },
  slurp: { e: 'happy', m: 'slurp', b: 'up', cheeks: 1 }, chew: { e: 'happy', m: 'chew', b: 'up', cheeks: 1 },
  hungry: { e: 'star', m: 'lick', b: 'up' }, smug: { e: 'half', m: 'smirk', b: 'cheeky' },
  yawn: { e: 'shut', m: 'yawn', b: 'soft' }, sleepy: { e: 'shut', m: 'small', b: 'soft' },
  sad: { e: 'teary', m: 'wobble', b: 'worry' }, dizzy: { e: 'swirl', m: 'wobble', b: 'worry' },
  hot: { e: 'squeeze', m: 'pant', b: 'worry', cheeks: 1 },
};
export const MOODS = Object.keys(FACES);
const EYE = { ink: '#3a2430' };
const BROW = '#8a4a1a';
// ---------- His eyes: the Dragon Glare (2026-11-25, the player: "give her different eyes that fit a
// boss", then "a but heavy redraw it and polish it") ----------
// An almond eye, its outer corner swept up into a winged lash line, a molten iris (dark red at the top,
// orange, a gold glow at the bottom, fine streaks raying out, a bright ring round a slit dragon pupil
// with a dark halo), a soft glare across it and a sharp star; the lid over the top of the iris and its
// shadow on the white; a crease, a warm shadow at the outer corner, lashes flicking up, a short lower
// lash line.
const DG = {
  white: '#fffaf6', whiteSh: '#f6dcd6', ring: '#4a0c06', top: '#9a1608', base: '#e8461a', mid: '#ff7a1e', glow: '#ffb426', glow2: '#ffe066',
  streak: '#ffa04a', streakDk: '#c42a0c', halo: '#6a0c08', pupil: '#160404', rim: '#ffd84a', ink: '#2a1214', crease: '#e8aa98',
  shadow: '#ffb09a', shadow2: '#f6846e', low: '#d07a6a',
};
// The eye at (x, y) (head units), o its side; `lid` lowers the upper lid (`slant`: its inner end more,
// as in a glare); `wide` opens it.
function dragonEye(x, y, o, lid = 0, wide = 0, slant = 0) {
  const k = DG;
  const w = 8.8 + wide * 0.4;
  const h = 6.9 + wide * 0.8;
  const P = (u, v) => [x + u * o, y + v];
  const out = [];
  // the lid's line (where the upper lid crosses the eye), lowered by `lid`, its inner end by `slant` more
  // (its two corners stay put; between them it drops, never below the eye's middle)
  const L = (u, v) => {
    const t = Math.min(1, Math.max(0, (u + w) / (w * 2.2)));
    const end = Math.sin(Math.PI * Math.min(1, t * 1.15));
    const drop = lid * (0.65 + 0.35 * (1 - t)) + slant * Math.max(0, 0.55 - t) * 6;
    return P(u, Math.min(v + drop * end, h * 0.1));
  };
  const lidLine = [P(-w - 0.4, 1.2), L(-w * 0.6, -h * 0.55), L(-w * 0.1, -h * 0.9), L(w * 0.45, -h * 0.98), L(w * 0.95, -h * 0.8), P(w * 1.2, -h * 0.98 + lid * 0.25)];
  // the warm shadow above the outer corner (under everything else), and the crease
  out.push(F(blob([P(w * 0.1, -h - 2.2), P(w * 0.8, -h - 3.4), P(w * 1.5, -h * 1.35), P(w * 1.3, -h * 0.7), P(w * 0.5, -h * 0.9)], k.shadow, 3)));
  out.push(F(blob([P(w * 0.7, -h - 1.8), P(w * 1.35, -h * 1.3), P(w * 1.25, -h * 0.8), P(w * 0.85, -h * 0.85)], k.shadow2, 2)));
  out.push(...band(curve([P(-w * 0.55, -h - 1.8 + lid * 0.3), P(0, -h - 3.2 + lid * 0.3), P(w * 0.75, -h - 3 + lid * 0.2), P(w * 1.2, -h * 1.25)], 3), 0.5, 0.9, k.crease, true));
  // the white: an almond, its outer corner swept up; the pink inner corner
  out.push(blob([P(-w, 1.6), P(-w * 0.55, -h * 0.85), P(w * 0.35, -h * 1.02), P(w * 1.15, -h * 0.92), P(w * 0.88, h * 0.22), P(w * 0.2, h * 0.8), P(-w * 0.55, h * 0.64)], k.white, 2));
  // the iris, tucked up under the lid
  const r = 6 + wide * 0.5;
  const cx = x + 0.9 * o;
  const cy = y - 0.4;
  out.push(F(E(cx, cy, r, r * 1.1, k.ring)), F(E(cx, cy + 0.2, r - 0.8, r * 1.1 - 0.8, k.base)));
  out.push(F(E(cx, cy - r * 0.48, r - 1.2, r * 0.5, k.top)), F(E(cx, cy + r * 0.38, r - 1.6, r * 0.5, k.mid)), F(E(cx, cy + r * 0.62, r - 2.6, r * 0.32, k.glow)), F(E(cx, cy + r * 0.72, r - 3.8, r * 0.18, k.glow2)));
  // fine streaks raying out from the pupil, dark above, light below
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.11;
    const r0 = r * 0.38;
    const r1 = r * (0.74 + (i % 2) * 0.1);
    const c = Math.sin(a) < -0.2 ? k.streakDk : k.streak;
    out.push(...band([[cx + Math.cos(a) * r0, cy + Math.sin(a) * r0 * 1.1], [cx + Math.cos(a) * r1, cy + Math.sin(a) * r1 * 1.1]], 0.45, 0.2, c, true));
  }
  // the bright ring round the pupil, the dark halo, the slit
  out.push(F(E(cx, cy + 0.3, 2.9, 4.4, k.rim)), F(E(cx, cy + 0.3, 2.1, 3.9, k.halo)));
  out.push(F(T([[cx, cy - 4.9], [cx + 0.9, cy - 2.2], [cx + 1.2, cy + 0.3], [cx + 0.9, cy + 2.8], [cx, cy + 5.2], [cx - 0.9, cy + 2.8], [cx - 1.2, cy + 0.3], [cx - 0.9, cy - 2.2]], k.pupil)));
  // the glare: a soft arc of light across the top of the iris, a sharp star, a dot low
  out.push(lens([cx - r * 0.75 * o, cy - r * 0.15], [cx + r * 0.1 * o, cy - r * 0.8], 1.6, -0.9 * o, '#fff2e0'));
  {
    const sx = cx - 2.4 * o;
    const sy = cy - 2.2;
    out.push(F(T([[sx, sy - 2.8], [sx + 0.7, sy - 0.7], [sx + 2.8, sy], [sx + 0.7, sy + 0.7], [sx, sy + 2.8], [sx - 0.7, sy + 0.7], [sx - 2.8, sy], [sx - 0.7, sy - 0.7]], '#ffffff')));
  }
  out.push(F(E(cx + 2.6 * o, cy + 3, 0.9, 0.9, '#ffffff')), F(E(cx + 1.4 * o, cy + 3.9, 0.5, 0.5, '#fff2c0')));
  // the lid: skin from the lid's line up, over the top of the iris; its shadow on the white under it
  out.push(F(blob([...lidLine, P(w * 1.4, -h - 4), P(-w * 0.6, -h - 4.4), P(-w - 1.4, -1)], SK.base, 2)));
  const lidC = curve(lidLine.slice(0, 5), 3);
  out.push(F(blob([...lidC, ...lidC.slice().reverse().map(([px, py]) => [px, py + 1.2])], k.whiteSh, 1)));
  // the lash line: bold, thickening to the outer corner, sweeping up into a wing; lashes flicking up
  out.push(...band(curve(lidLine, 3), 1.2, 3.2, k.ink, true));
  out.push(...band(curve([lidLine[4], P(w * 1.42, -h * 1.22 + lid * 0.4), P(w * 1.62, -h * 1.62 + lid * 0.3)], 3), 2.4, 0.5, k.ink, true));
  for (const [u0, len, bend] of [[0.62, 2.6, 0.6], [0.84, 3.2, 0.9], [1.02, 3.4, 1.1]]) {
    const [bx, by] = L(w * u0, -h * (0.96 - (u0 - 0.6) * 0.3));
    out.push(...band(curve([[bx, by], [bx + o * len * 0.35, by - len * 0.75], [bx + o * len * (0.55 + bend * 0.2), by - len]], 3), 0.9, 0.3, k.ink, true));
  }
  // the lower lash line at the outer part, a fine line at the inner part, a soft shadow at the corner
  out.push(...band(curve([P(-w * 0.1, h * 0.76), P(w * 0.45, h * 0.56), P(w * 0.8, h * 0.24)], 3), 0.5, 1.3, k.ink, true));
  out.push(...band(curve([P(-w * 0.55, h * 0.6), P(-w * 0.28, h * 0.74)], 2), 0.3, 0.5, k.low, true));
  out.push(F(blob([P(w * 0.25, h * 1.05), P(w * 0.85, h * 0.62), P(w * 1.12, h * 0.32), P(w * 0.75, h * 1.12)], k.shadow, 2)));
  return out;
}
// Shut eyes in his style: the lash line as a curve, its wing still flicking up at the outer corner.
const shut = (x, o, kind) => {
  const ink = DG.ink;
  const wing = (px, py) => band(curve([[px, py], [px + 2.4 * o, py - 1.8], [px + 3.6 * o, py - 3.8]], 3), 2, 0.4, ink, true);
  if (kind === 'happy') return [F(blob([[x + 3 * o, 6.4], [x + 9 * o, 7.4], [x + 10 * o, 11], [x + 6 * o, 9]], DG.shadow, 2)), ...band(curve([[x - 7.6 * o, 14.4], [x - 2 * o, 8.2], [x + 5 * o, 8.8], [x + 8 * o, 12.6]], 3), 1.4, 2.6, ink, true), ...wing(x + 8 * o, 12.6)];
  if (kind === 'squeeze') return [...band(curve([[x - 6.4 * o, 8.6], [x + 5 * o, 12.6], [x - 6.4 * o, 16.4]], 3), 2, 2.4, ink, true)];
  if (kind === 'swirl') {
    const sp = Array.from({ length: 18 }, (_, i) => {
      const a = i * 0.62;
      const r = 1 + i * 0.36;
      return [x + Math.cos(a) * r * o, 11 + Math.sin(a) * r];
    });
    return [...band(sp, 1.1, 1.1, ink, true)];
  }
  // asleep / blinking: a soft downward curve, its wing flicking out, a lash under it
  return [...band(curve([[x - 7.6 * o, 12], [x - 1 * o, 15.6], [x + 6 * o, 14.4], [x + 8.6 * o, 12]], 3), 1.3, 2.6, ink, true), ...wing(x + 8.6 * o, 12), ...band(curve([[x + 1 * o, 17], [x + 1.4 * o, 18.6]], 2), 0.5, 0.2, ink, true)];
};
// His brows: tapered, thick at the inner end to a fine tip; set by the face.
const brows = (b, c) => {
  const one = (o) => {
    const P = (u, v) => [14 * o + u * o, v];
    const br = (pts, w0 = 2.6) => band(curve(pts.map(([u, v]) => P(u, v)), 3), w0, 0.7, c, true);
    if (b === 'up') return br([[-7, -3.4], [-1, -6.4], [7, -5.2]]);
    if (b === 'cross') return br([[-7, 0.2], [-1, -2.6], [7, -6.2]], 2.9);
    if (b === 'worry') return br([[-7, -6], [0, -4.4], [7, -2.4]]);
    if (b === 'soft') return br([[-7, -2.8], [0, -3.8], [7, -2.6]], 2.2);
    // his everyday look: confident, a touch lowered at the inner end, one brow a little higher
    return o < 0 ? br([[-7, -2], [-1, -4.6], [7, -4.8]]) : br([[-7, -2.6], [-1, -5.6], [7, -5.6]]);
  };
  return [...one(-1), ...one(1)];
};
const LIP = '#9a3a4e';
const TONGUE = '#ff8a9e';
function mouth(m) {
  const fang = (x, y) => F(T([[x, y], [x + 1.8, y], [x + 0.9, y + 2.6]], '#ffffff'));
  if (m === 'grin') return [blob([[-5, 23.2], [5.4, 22.6], [4.2, 26.6], [0, 28], [-4, 26.6]], LIP, 2), F(E(0.4, 26.6, 2.4, 1.1, TONGUE)), fang(2.8, 22.9), ...arc([[-6, 22.8], [-5.2, 23.4]], 0.8, EYE.ink), ...arc([[5.8, 22.2], [6.8, 21.4]], 0.8, EYE.ink)];
  if (m === 'open') return [blob([[-5.2, 22.6], [5.2, 22.6], [4, 27.6], [0, 29.4], [-4, 27.6]], LIP, 2), F(E(0, 27.4, 2.8, 1.4, TONGUE)), fang(2.6, 22.8)];
  if (m === 'snarl') return [blob([[-5.6, 23.4], [5.6, 22.4], [4.6, 26.4], [-4.6, 26.6]], LIP, 2), F(blob([[-4.8, 23.4], [4.8, 22.6], [4.4, 24], [-4.4, 24.4]], '#ffffff', 1)), fang(2.6, 23.6), fang(-3.6, 23.8)];
  if (m === 'shout') return [blob([[-6, 21.8], [6, 21.8], [5, 28.6], [0, 31.4], [-5, 28.6]], '#6a1a3a', 2), F(E(0, 28.6, 3.2, 1.4, TONGUE)), F(blob([[-5, 22], [5, 22], [4.6, 23.2], [-4.6, 23.2]], '#ffffff', 1)), fang(2.8, 23)];
  if (m === 'o') return [F(E(0, 25.6, 2.4, 2.8, '#6a1a3a')), F(E(0, 26.8, 1.3, 0.8, TONGUE))];
  if (m === 'slurp') return [blob([[-2.6, 24.4], [2.6, 24.4], [2.2, 27.4], [-2.2, 27.4]], '#c84a64', 2), F(E(0, 25.9, 1.1, 1, '#6a1a3a'))];
  if (m === 'chew') return [...arc([[-4, 25.6], [-1.6, 24.4], [1, 25.8], [3.6, 24.6]], 1.2, EYE.ink)];
  if (m === 'lick') return [blob([[-5, 23.2], [5, 23], [3.6, 26.4], [-3.6, 26.4]], LIP, 2), blob([[0.6, 25.4], [5.6, 25.4], [5.2, 28.6], [3, 29.6], [1, 28.4]], TONGUE, 2), F(E(3.2, 27, 0.6, 1.4, '#e8607a')), fang(-3.2, 23.4)];
  if (m === 'smirk') return [...band(curve([[-4, 24.4], [0, 25.4], [4, 23.6], [5.6, 22.2]], 3), 1.2, 1.2, EYE.ink, true), fang(1.8, 24.6)];
  if (m === 'yawn') return [blob([[-3.6, 22.6], [3.6, 22.6], [4.2, 28], [0, 31.4], [-4.2, 28]], '#6a1a3a', 2), F(E(0, 28.8, 2.4, 1.2, TONGUE))];
  if (m === 'wobble') return [...arc([[-4.4, 25.4], [-2.2, 24.2], [0, 25.4], [2.2, 24.2], [4.4, 25.4]], 1.2, EYE.ink)];
  if (m === 'pant') return [blob([[-4, 23], [4, 23], [3.2, 27], [-3.2, 27]], '#6a1a3a', 2), blob([[-1.6, 25.6], [2.4, 25.6], [2.2, 30], [0.4, 31], [-1.4, 29.6]], TONGUE, 2)];
  return [...arc([[-2.4, 25.4], [0, 26], [2.4, 25.4]], 1.1, EYE.ink)];
}
function face(f) {
  const out = [blob([[-33, -14], [-34, 6], [-30, 21], [-18, 31], [0, 34], [18, 31], [30, 21], [34, 6], [33, -14], [0, -30]], SK.base, 4), F(blob([[-33, -6], [-31, 16], [-26, 24], [-29, 10]], SK.sh, 2))];
  out.push(F(E(-23, 18, f.cheeks ? 10 : 8, f.cheeks ? 8 : 6, f.cheeks ? '#ffe2d8' : SK.lt)), F(E(23, 18, f.cheeks ? 10 : 8, f.cheeks ? 8 : 6, f.cheeks ? '#ffe2d8' : SK.lt)));
  const e = f.e;
  if (e === 'open' || e === 'wide' || e === 'fierce' || e === 'half' || e === 'star' || e === 'teary' || e === 'sleepy') {
    const lid = e === 'fierce' ? 3.4 : e === 'half' ? 4.2 : e === 'sleepy' ? 6.4 : e === 'open' ? 0.6 : 0;
    const big = e === 'wide' ? 1.2 : e === 'star' ? 1 : 0.4;
    const slant = e === 'fierce' ? 1.6 : 0;
    out.push(...dragonEye(-14, 11, -1, lid, big, slant), ...dragonEye(14, 11, 1, lid * (e === 'half' ? 0.7 : 1), big, slant));
    // hungry: a star in each eye
    if (e === 'star') {
      for (const o of [-1, 1]) {
        const sx = 14 * o - 1.4 * o;
        const sy = 9.4;
        out.push(F(T([[sx, sy - 3.4], [sx + 0.9, sy - 0.9], [sx + 3.4, sy], [sx + 0.9, sy + 0.9], [sx, sy + 3.4], [sx - 0.9, sy + 0.9], [sx - 3.4, sy], [sx - 0.9, sy - 0.9]], '#ffffff')));
      }
    }
    if (e === 'teary') for (const o of [-1, 1]) out.push(...arc([[14 * o - 5, 17.4], [14 * o, 18.6], [14 * o + 5, 17.4]], 1.2, '#d8f2ff'));
  } else out.push(...shut(-14, -1, e), ...shut(14, 1, e));
  for (const o of [-1, 1]) {
    out.push(F(E(21 * o, 21, 5.4, 3, f.cheeks ? '#ff9aa8' : '#ffb0bc')));
    for (let i = 0; i < 3; i++) out.push(...arc([[21 * o + (i - 1) * 2.6 - 0.8, 22.2], [21 * o + (i - 1) * 2.6 + 0.8, 20]], 0.5, SK.lt));
  }
  out.push(...arc([[0.6, 18.6], [1.2, 19.6]], 0.7, SK.deep));
  out.push(...mouth(f.m));
  if (e === 'teary') out.push(blob([[-21, 20], [-18.6, 24], [-19.4, 26.4], [-21, 27], [-22.6, 26.4], [-23.4, 24]], '#b4e2ff', 2));
  return out;
}
// Soft rounded fin ears, a little dragon fin at each side of his head, ribbed, a light along the top.
const finEar = (o) => [
  blob([[32 * o, 2], [42 * o, -7], [50 * o, -4], [47 * o, 4], [52 * o, 10], [42 * o, 15], [32 * o, 12]], NOOD[1], 3),
  F(blob([[35 * o, 4], [43 * o, -3], [46 * o, 8], [38 * o, 11]], NOOD[0], 2)),
  ...[0, 1, 2].flatMap((i) => arc([[34 * o, 4 + i * 3], [44 * o + i * 1.4 * o, -2 + i * 4.6]], 0.6, NOOD[2])),
];

// ---------- Noodles ----------
// A wavy noodle strand along a path (base units), `w` thick, a light down it.
function noodle(pts, w, waves = 0.9, ph = 0, c = NOOD) {
  const sp = curve(pts, 4);
  const wav = sp.map(([x, y], i) => {
    const [a, b] = [sp[Math.max(0, i - 1)], sp[Math.min(sp.length - 1, i + 1)]];
    const an = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const s = Math.sin(i * waves + ph) * w * 0.55;
    return [x - Math.sin(an) * s, y + Math.cos(an) * s];
  });
  return [...band(wav, w, w * 0.9, c[1], true), ...band(wav.map(([x, y]) => [x - w * 0.15, y - w * 0.2]), w * 0.32, w * 0.28, c[0], true)];
}
// A fish-cake slice: white, a pink swirl, a crinkled edge.
export function naruto(x, y, r) {
  const out = [blob(Array.from({ length: 16 }, (_, i) => {
    const a = (i / 16) * Math.PI * 2;
    const rr = r * (i % 2 ? 1 : 0.92);
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  }), '#ffffff', 2)];
  const sw = Array.from({ length: 22 }, (_, i) => {
    const a = i * 0.55;
    const rr = r * 0.72 * (i / 21);
    return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
  });
  out.push(...band(sw, r * 0.16, r * 0.24, '#ff7a9e', true));
  return out;
}
// A lacquered chopstick from a to b: red, a gold band, a pale tip, a light down it.
export function chopstick(a, b, w = 2.2) {
  const t = toward(a, b, 0.82);
  return [...band([a, t], w, w * 0.8, CUP.red, true), ...band([t, b], w * 0.8, w * 0.6, '#f4dcb0', true), ...band([toward(a, b, 0.16), toward(a, b, 0.2)], w * 1.05, w * 1.02, '#ffd36a', false), ...band([toward(a, b, 0.05), toward(a, b, 0.7)], w * 0.3, w * 0.24, '#ff7a8a', true)];
}

// ---------- The pieces ----------
// The foil lid, peeled back and standing up behind his far shoulder: a round of silver foil tipped
// back, its paper side's red ring and fish-cake, crinkle lines, its peeled tab curling.
const lid = () => {
  const [x, y] = [132, 74];
  const R = (u, v) => [x + u * 0.94 - v * 0.34, y + u * 0.34 + v * 0.94];
  const ring = (r, k = 1) => Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return R(Math.cos(a) * r, Math.sin(a) * r * 0.82 * k);
  });
  return [
    blob(ring(19), '#cdd2e0', 3),
    F(blob(ring(16.4), '#eef0f6', 2)),
    F(blob(ring(10, 1), CUP.red, 2)), F(blob(ring(7.6, 1), '#ffffff', 2)), ...naruto(...R(0, 0), 3),
    ...[[-14, -4, -9, -2], [11, -9, 7, -5], [-6, 12, -3, 8], [13, 7, 9, 5]].flatMap(([u0, v0, u1, v1]) => arc([R(u0, v0), R(u1, v1)], 0.6, '#b8bccc')),
    blob([R(14, -12), R(22, -20), R(25, -14), R(18, -8)], '#cdd2e0', 2), F(E(...R(21, -15), 2, 1.4, '#eef0f6')),
  ];
};
// The back hair (2026-11-25 polish, the player: "same with back hair"): a soft under-layer of noodle
// hair behind his head, darker inside, falling to his shoulders in rounded waves; and (hairLocks, on
// a spring of its own) long wavy noodle locks fanning out from behind his head down past his shoulders
// to the cup's rim, each tapered with a light down it and a little curl at its tip, the outer ones
// lighter, peeking out either side of him.
const HAIR_IN = '#d89a3a';
const hairB = () => [
  ...inHead([
    blob([[-40, -30], [-48, -4], [-52, 22], [-50, 44], [-42, 58], [-30, 54], [-18, 60], [0, 56], [18, 60], [30, 54], [42, 58], [50, 44], [52, 22], [48, -4], [40, -30], [0, -52]], NOOD[2], 4),
    F(blob([[-30, 0], [-36, 26], [-30, 48], [-16, 52], [0, 48], [16, 52], [30, 48], [36, 26], [30, 0]], HAIR_IN, 4)),
    ...[-1, 1].flatMap((o) => [lens([44 * o, -6], [48 * o, 30], 3.4, 1.6 * o, NOOD[1]), lens([42 * o, 20], [44 * o, 50], 2.4, 1.2 * o, NOOD[0])]),
  ]),
];
// A long wavy lock: from `a` hanging to `b`, swinging out by `bow`, `w` wide at its root, a curl at its
// tip turning `turn` (+1 out, -1 in).
function lockOf(a, b, bow, w, c, turn, ph) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const x = a[0] + (b[0] - a[0]) * u + Math.sin(Math.PI * u) * bow + Math.sin(u * 9 + ph) * 1.2 * u;
    const y = a[1] + (b[1] - a[1]) * u;
    pts.push([x, y]);
  }
  const [tx, ty] = pts[pts.length - 1];
  const curl = Array.from({ length: 7 }, (_, i) => {
    const an = Math.PI / 2 - turn * (i / 6) * Math.PI * 1.3;
    const r = 2.6 * (1 - i / 9);
    return [tx + turn * r - Math.cos(an) * r * turn, ty + Math.sin(an) * r - r];
  });
  const all = [...pts, ...curl.slice(1)];
  return [...band(all, w, w * 0.28, c[1], true), ...band(all.slice(1, -3).map(([x, y]) => [x - w * 0.18, y]), w * 0.3, w * 0.1, c[0], true), ...band(all.slice(2, -4).map(([x, y]) => [x + w * 0.25, y + 0.4]), w * 0.18, w * 0.08, c[2], true)];
}
const LIGHT = [NOOD[0], NOOD[1], NOOD[2]];
const DEEP = ['#ffe9a0', NOOD[2], '#c88a2e'];
export const LOCKS_ROOT = [151, 74];
const hairLocks = () => [
  // (the inner ones, deeper, mostly behind him)
  ...[[-10, 4, 112, -3, -1], [-3, 6, 116, 2, 1], [4, 6, 116, -2, -1], [11, 4, 112, 3, 1]].flatMap(([dx, w, by, bow, turn], i) => lockOf([151 + dx * 0.6, 70], [151 + dx * 1.4, by], bow, w, DEEP, turn, i)),
  // (the outer ones fanning out past his shoulders, lighter)
  ...[[-1, 0], [1, 1]].flatMap(([o, i]) => [
    ...lockOf([151 + 20 * o, 68], [151 + 30 * o, 114], 7 * o, 6.4, LIGHT, o, i * 2 + 1),
    ...lockOf([151 + 24 * o, 72], [151 + 26 * o, 104], 4 * o, 5, LIGHT, -o, i * 2 + 2.4),
    ...lockOf([151 + 16 * o, 70], [151 + 21 * o, 120], 3 * o, 5.6, DEEP, o, i * 2 + 3.3),
  ]),
];
// The noodle bun on top: a round coil of noodles, a light on it.
export const BUN = [151, 30];
const bun = () => {
  const [x, y] = BUN;
  const sp = Array.from({ length: 32 }, (_, i) => {
    const a = i * 0.6;
    const r = 12.6 * (1 - i / 36);
    return [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.78];
  });
  return [E(x, y, 14.6, 11.6, NOOD[2]), ...band(sp, 2.8, 2, NOOD[1], true), ...band(sp.map(([px, py]) => [px - 0.5, py - 0.7]), 0.9, 0.6, NOOD[0], true), F(E(x - 4, y - 5, 4, 1.6, NOOD[0]))];
};
const sticks = () => [...chopstick([149, 34], [173, 3]), ...chopstick([154, 36], [179, 7])];
// The wavy fringe: soft rounded noodle locks, a shine on each, fine gaps between.
const fringe = () => [
  blob([[-38, -8], [-34, 4], [-27, -2], [-21, 6], [-13, -4], [-6, 4], [1, -6], [8, 4], [15, -4], [22, 6], [28, -2], [34, 4], [38, -8], [32, -38], [0, -52], [-32, -38]], NOOD[1], 3),
  ...band(curve([[-34, 3], [-27, -1], [-21, 5], [-13, -3], [-6, 3], [1, -5], [8, 3], [15, -3], [22, 5], [28, -1], [34, 3]], 4), 0.9, 0.9, NOOD[2], true),
  ...[[-30, -24], [-16, -34], [2, -38], [18, -32], [30, -20]].map(([x, y]) => lens([x - 3, y], [x + 4, y + 12], 2.6, 1.2, NOOD[0])),
  ...[[-24, -2], [-10, -2], [5, -2], [19, -1]].map(([x, y]) => lens([x, y - 10], [x + 1, y + 2], 1.4, 0.6, NOOD[2])),
];
// A long wavy noodle lock hanging by each cheek (its top at the temple).
export const LOCK_F = H2B([-34, 4]);
export const LOCK_N = H2B([34, 4]);
const lock = (o) => {
  const [x, y] = o < 0 ? LOCK_F : LOCK_N;
  return [...noodle([[x, y], [x + 1.6 * o, y + 8], [x - 0.6 * o, y + 16], [x + 1.4 * o, y + 24]], 3.6, 1.2, o < 0 ? 0 : 1.6), ...noodle([[x + 2 * o, y], [x + 3 * o, y + 7], [x + 1.4 * o, y + 13]], 2.6, 1.3, 2.4)];
};
// His tee (2026-11-25 polish): white, a little loose, tucked into the cup: a rounded neckline piped in
// red, soft folds, a shade down each side and a light down the middle, a red hem band with gold piping
// and white stitching; a cute ramen-bowl print on his chest (a red bowl, noodles, chopsticks, steam
// curls) and a fish-cake pin.
const BOWL = [151, 103];
const bowlPrint = () => {
  const [x, y] = BOWL;
  return [
    ...[-3, 0, 3].flatMap((dx, i) => arc([[x + dx, y - 3.4], [x + dx + 1, y - 5.6], [x + dx - 0.6, y - 7.6]], 0.6, '#f0b8a8')),
    blob([[x - 6.4, y - 1.6], [x + 6.4, y - 1.6], [x + 5.6, y + 1.8], [x + 3, y + 3.8], [x - 3, y + 3.8], [x - 5.6, y + 1.8]], CUP.red, 2),
    F(blob([[x - 5.4, y - 1], [x - 1, y - 1], [x - 2.4, y + 2.6], [x - 4.4, y + 1.6]], CUP.redLt, 1)),
    ...arc([[x - 5, y + 0.6], [x + 5, y + 0.6]], 0.4, '#ffd36a'),
    E(x, y - 1.6, 6.4, 1.4, '#ffe39a'), ...[-3.4, -1, 1.4, 3.6].flatMap((dx) => arc([[x + dx, y - 2.4], [x + dx + 0.8, y - 1.6], [x + dx, y - 0.8]], 0.5, '#e8b14a')),
    ...band([[x + 1, y - 2], [x + 7, y - 7.4]], 0.9, 0.7, '#8a3a2a', true), ...band([[x + 2.4, y - 2], [x + 8, y - 6.4]], 0.9, 0.7, '#8a3a2a', true),
  ];
};
const top = () => [
  blob([[134, 92], [168, 92], [170, 104], [171, 116], [131, 116], [132, 104]], CUP.white, 3),
  F(blob([[134, 94], [143, 94], [140, 104], [139, 115], [133, 115], [133, 104]], '#f4f2fa', 3)), F(blob([[160, 94], [168, 95], [170, 104], [170, 115], [162, 115], [162, 104]], CUP.shade, 3)),
  F(blob([[146, 93], [156, 93], [155, 112], [147, 112]], '#ffffff', 3)),
  ...arc([[138, 98], [140, 106], [138, 113]], 0.5, '#e2deec'), ...arc([[164, 98], [162.6, 106], [164, 113]], 0.5, '#d8d4e4'), ...arc([[142, 110], [147, 112], [152, 111]], 0.45, '#e6e2ee'),
  // the neckline piped in red (most of it under the scarf)
  ...arc([[140, 93.2], [151, 97.4], [162, 93.2]], 1, CUP.red),
  // the hem band, its piping and stitches
  F(blob([[131, 110.6], [171, 110.6], [171, 116], [131, 116]], CUP.red, 1)), ...arc([[132, 110.2], [170, 110.2]], 0.6, CUP.gold),
  ...Array.from({ length: 9 }, (_, i) => F(E(134 + i * 4.2, 113.4, 0.5, 0.35, '#ffd8dc'))),
  ...bowlPrint(),
  ...naruto(162, 99, 2.6), F(E(162, 101.8, 0.8, 0.5, CUP.gold)),
];
// His scarf (2026-11-25 polish): knitted, in the cup's red with two white stripes, a gold edge, soft
// folds, its knot a round puff at the back; its ends two long strips trailing out behind, striped near
// their tips, each finished with a row of little gold tassels.
const scarf = () => [
  blob([[132, 86.6], [170, 86.6], [172, 96.4], [130, 96.4]], CUP.red, 3),
  F(blob([[134, 87.6], [148, 87.6], [147, 91.6], [134, 92.4]], CUP.redLt, 2)), F(blob([[160, 88], [170, 88], [171, 95.4], [161, 95]], CUP.redSh, 2)),
  ...arc([[131, 90.6], [151, 92.6], [171, 90.6]], 0.7, '#ffffff'), ...arc([[131, 92.6], [151, 94.6], [171, 92.6]], 0.7, '#ffffff'),
  ...[140, 147, 154, 161].flatMap((x) => arc([[x, 87.4], [x + 0.6, 96]], 0.4, CUP.redSh)),
  ...arc([[131, 96], [151, 97.4], [171, 96]], 0.8, CUP.gold),
];
export const SCARF_KNOT = [134, 92];
const scarfStrip = (pts, w0, w1, base, lt) => {
  const sp = curve(pts, 4);
  const n = sp.length;
  const [tx, ty] = sp[n - 1];
  const [px, py] = sp[n - 2];
  const an = Math.atan2(ty - py, tx - px);
  const nx = -Math.sin(an);
  const ny = Math.cos(an);
  return [
    ...band(sp, w0, w1, base, true),
    ...band(sp.slice(0, Math.round(n * 0.7)).map(([x, y]) => [x - nx * w0 * 0.2, y - ny * w0 * 0.2]), w0 * 0.24, w1 * 0.2, lt, true),
    // (the stripes near its tip)
    ...[0.74, 0.84].flatMap((u) => {
      const [x, y] = sp[Math.round(u * (n - 1))];
      const ww = (w0 + (w1 - w0) * u) * 0.55;
      return band([[x - nx * ww, y - ny * ww], [x + nx * ww, y + ny * ww]], 1, 1, '#ffffff', false);
    }),
    // (its tassels)
    ...[-0.6, 0, 0.6].map((k) => E(tx + Math.cos(an) * 1.6 + nx * w1 * k, ty + Math.sin(an) * 1.6 + ny * w1 * k, 1.1, 1.1, '#ffd36a')),
  ];
};
const scarfEnd = () => [
  ...scarfStrip([[136, 91], [126, 92], [117, 90.6], [109, 92.6]], 5.8, 4.6, CUP.red, CUP.redLt),
  ...scarfStrip([[136, 94], [128, 98.6], [121, 102.4], [114, 102.6]], 5.2, 4.2, CUP.redSh, CUP.red),
  E(135, 92.6, 4, 3.6, CUP.red), F(E(134.2, 91.8, 1.6, 1.1, CUP.redLt)), ...arc([[132.6, 94.6], [137.4, 94.6]], 0.5, CUP.redSh),
];
// The cup round his waist (2026-11-25 polish): a rolled paper rim, lit along its top; a red band at the
// top with a white flame pattern; the white label, a light down its near side and a shade round its far
// side; gold lines; a round gold emblem of a little noodle dragon curled up; rows of red label print
// either side; a red foot band with white dots, a darker foot ring; the broth at its rim.
export const CUP_TOP = [151, 112];
const flames = (y, x0, x1, c) => band(curve(Array.from({ length: Math.round((x1 - x0) / 2) + 1 }, (_, i) => [x0 + i * 2, y + (i % 2 ? -1.4 : 0.6)]), 2), 0.9, 0.9, c, true);
const emblem = (x, y) => [
  E(x, y, 6.6, 6.6, '#e8b14a'), F(E(x, y, 5.6, 5.6, '#ffd36a')), F(E(x - 1.6, y - 1.8, 2.6, 1.6, '#fff0b0')),
  ...noodle([[x - 3.4, y + 2.4], [x - 3.6, y - 1.4], [x, y - 3.4], [x + 3.4, y - 1.6], [x + 2.4, y + 1.6], [x - 0.6, y + 1.4]], 1.4, 1.4, 0, ['#fff6c8', '#e8304a', '#b8243a']),
  F(E(x + 2.6, y - 2.4, 0.7, 0.7, '#3a2430')),
];
const cup = () => [
  blob([[125, 113], [177, 113], [173, 160], [129, 160]], CUP.white, 3),
  // the label's light and shade
  F(blob([[127, 123], [139, 123], [137, 136], [135, 149], [130, 149], [129, 136]], '#f4f2fa', 3)), F(blob([[160, 123], [175, 123], [173.6, 136], [172.6, 149], [163, 149], [162, 136]], CUP.shade, 3)),
  F(blob([[129, 124], [133, 124], [132, 148], [130, 148]], '#ffffff', 2)),
  // the top band, its flame pattern
  F(blob([[125, 113], [177, 113], [176, 123], [126, 123]], CUP.red, 2)), F(blob([[126, 114], [134, 114], [133, 122], [127, 122]], CUP.redLt, 1)), F(blob([[168, 114], [176, 114], [175, 122], [167, 122]], CUP.redSh, 1)),
  ...flames(119.6, 129, 173, '#ffffff'), ...arc([[126, 123], [176, 123]], 0.8, CUP.gold),
  // gold lines, the emblem, the label print
  ...arc([[129, 127.4], [173, 127.4]], 1.2, CUP.gold), ...arc([[131, 145.6], [171, 145.6]], 0.8, CUP.gold),
  ...emblem(151, 136.6),
  ...[[134, 131], [134, 135], [134, 139], [162, 131], [162, 135], [162, 139]].flatMap(([x, y], i) => band([[x, y], [x + (i % 3 === 1 ? 4.6 : 6.4), y]], 1, 1, i % 3 === 2 ? CUP.gold : CUP.red, true)),
  ...[[136.4, 142.4], [164.4, 142.4]].map(([x, y]) => F(E(x, y, 1.4, 1.4, CUP.red))),
  // the foot band, its dots, the foot ring
  F(blob([[128.6, 148.6], [173.4, 148.6], [173, 160], [129, 160]], CUP.red, 2)), F(blob([[129, 149.4], [137, 149.4], [136, 159], [130, 159]], CUP.redLt, 1)),
  ...Array.from({ length: 8 }, (_, i) => F(E(133 + i * 5.2, 153.6, 0.9, 0.9, '#ffffff'))),
  F(blob([[129.4, 157.4], [172.6, 157.4], [172.8, 160], [129.2, 160]], CUP.redSh, 1)),
  // the rolled rim, lit along its top, and the broth
  E(151, 112.6, 27, 5, '#f4f2fa'), F(E(151, 111.8, 26, 3.6, '#ffffff')), ...arc([[127, 113.6], [151, 116.4], [175, 113.6]], 0.6, '#d8d4e4'),
  E(151, 112, 23, 3.4, CUP.broth), F(E(151, 112.6, 20, 2.2, CUP.brothSh)), F(E(144, 111.4, 6, 0.9, '#f0c488')), F(E(158, 112, 2.6, 0.6, '#f4d4a0')),
];
// The noodles spilling over the rim, hanging down the label.
const spill = () => [...[[133, 1], [141, -1], [160, 1], [169, -1]].flatMap(([x, d]) => noodle([[x, 110], [x + 2 * d, 116], [x - d, 123], [x + d, 130]], 2.6, 1.3, x)), F(E(147, 111, 3, 1.4, '#7ac86a')), F(E(156, 111.4, 2.4, 1.2, '#ffe9b0'))];
// The sleeves (2026-11-25 polish): soft puffed cap sleeves, gathered at the shoulder (little fold
// lines), a light on top, a shade underneath, finished with a red band piped in gold. The wristbands:
// red, a gold stripe, white stitching.
const J = { shN: [163.6, 92], elN: [165.8, 110.6], wrN: [166.2, 128.6], shF: [136.4, 92], elF: [134.2, 110.6], wrF: [133.8, 128.6] };
const sleeve = (k) => {
  const [sh, el] = [J[`sh${k}`], J[`el${k}`]];
  const m = toward(sh, el, 0.44);
  const d = [el[0] - sh[0], el[1] - sh[1]];
  const L = Math.hypot(d[0], d[1]);
  const n = [-d[1] / L, d[0] / L];
  const at = (u, v) => [sh[0] + d[0] * u + n[0] * v, sh[1] + d[1] * u + n[1] * v];
  return [
    blob([at(-0.14, -5.4), at(-0.16, 5.4), at(0.22, 7), at(0.4, 6.2), at(0.46, 0), at(0.4, -6.2), at(0.22, -7)], CUP.white, 3),
    F(blob([at(-0.1, -4.6), at(0.2, -6), at(0.32, -4.6), at(0.1, -2.4)], '#ffffff', 2)), F(blob([at(0.06, 4.4), at(0.26, 6), at(0.38, 5), at(0.2, 3)], CUP.shade, 2)),
    ...[-2.6, 0, 2.6].flatMap((v) => arc([at(-0.06, v * 0.8), at(0.12, v)], 0.45, '#dedaea')),
    ...band([at(0.36, -6.4), at(0.36, 0), at(0.36, 6.4)].map(([x, y]) => [x, y]), 2.2, 2.2, CUP.red, true),
    ...band([at(0.31, -6.2), at(0.31, 6.2)], 0.5, 0.5, CUP.gold, true),
  ];
};
const cuff = (k) => {
  const w = J[`wr${k}`];
  const e = J[`el${k}`];
  const a = toward(e, w, 0.76);
  const b = toward(e, w, 0.93);
  return [
    ...band([a, b], 7.8, 7.6, CUP.red, false), ...band([toward(a, b, 0.1), toward(a, b, 0.42)], 8, 7.8, CUP.redLt, false), ...band([toward(a, b, 0.44), toward(a, b, 0.6)], 8, 7.8, '#ffd36a', false),
    ...[-2.6, -0.9, 0.9, 2.6].map((v) => {
      const m = toward(a, b, 0.8);
      return F(E(m[0] + v, m[1], 0.45, 0.45, '#ffd8dc'));
    }),
  ];
};

const cache = new Map();
// (his head alone in an expression, for picking looks: the fin ears, the face, the fringe)
export const ryuHead = (mood = 'idle') => inHead([...finEar(-1), ...finEar(1), ...face(FACES[mood] ?? FACES.idle), ...fringe(), ...brows((FACES[mood] ?? FACES.idle).b, BROW)]);
// His pieces in one expression (the face changes; all else is the same).
export function ryuDesign(mood = 'idle') {
  const key = mood in FACES ? mood : 'idle';
  if (cache.has(key)) return cache.get(key);
  const f = FACES[key];
  const groups = {
    lid: lid(),
    hairB: hairB(),
    hairLocks: hairLocks(),
    bun: bun(),
    sticks: sticks(),
    // (his brows drawn over his fringe, so his look always reads)
    head: inHead([...finEar(-1), ...finEar(1), ...face(f), ...fringe(), ...brows(f.b, BROW)]),
    lockF: lock(-1),
    lockN: lock(1),
    top: top(),
    scarf: scarf(),
    scarfEnd: scarfEnd(),
    cup: cup(),
    spill: spill(),
    sleeveFu: sleeve('F'),
    sleeveNu: sleeve('N'),
    cuffF: cuff('F'),
    cuffN: cuff('N'),
  };
  cache.set(key, groups);
  return groups;
}
// Joints of his own, in base units: his mouth; the lid's hinge (his nape); the bun; the locks' roots;
// the scarf's knot; the cup's rim; a cheek each side (for his whiskers).
export const MOUTH = H2B([0, 26]);
export const NAPE = [151, 86];
export const CHEEK_F = H2B([-30, 18]);
export const CHEEK_N = H2B([30, 18]);
