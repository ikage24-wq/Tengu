// The sweets a Mochi eats (data/mochi-genes.js SWEETS), small props drawn at a Mochi's own pixel
// size, and its toy ball. Each sweet fits a 14 x 12 box, its bottom middle where it's held; a
// bitten one has bites taken out of its top (1 to 3), and after the last it's gone.
import { R, E, T, F } from './pixel.js';
import { limb } from './figure.js';
import { art, place } from './scenery.js';

const STICK = '#c89a5a';
const ANKO = '#5a2430';
const stick = (top = 1) => [F(limb(7, 12, 7, top, 0.45, 0.4, STICK))];
const SHAPES = {
  dango: () => [...stick(0.4), E(7, 9.2, 2.4, 2.2, '#a8d48a'), E(7, 5.7, 2.4, 2.2, '#fbf6ec'), E(7, 2.2, 2.4, 2.2, '#f7a8c0'),
    F(E(6.2, 8.5, 0.8, 0.5, '#d6efc4')), F(E(6.2, 5, 0.8, 0.5, '#ffffff')), F(E(6.2, 1.5, 0.8, 0.5, '#ffd4e0'))],
  daifuku: () => [E(7, 8, 5.6, 4, '#fbf6f0'), F(E(8.4, 8.8, 2.2, 1.3, '#efdde2')), F(E(5, 5.8, 1.8, 0.9, '#ffffff')),
    F(R(3.6, 7.2, 0.5, 0.5, '#ffffff')), F(R(9.8, 6.4, 0.5, 0.5, '#ffffff')), F(R(7.4, 10.6, 0.5, 0.5, '#e8dfe2'))],
  taiyaki: () => [T([[1, 7.4], [3, 4.4], [7, 3.4], [10, 4.4], [11, 6.2], [13.4, 4], [13.2, 10.4], [11, 8.6], [9.6, 10.6], [6, 11.2], [2.6, 10.2]], '#e0a050'),
    F(E(3.4, 6.6, 0.55, 0.55, '#3a2418')), F(limb(5, 5.6, 6, 8, 0.25, 0.25, '#b87a32')), F(limb(7, 5.4, 8, 8.4, 0.25, 0.25, '#b87a32')), F(limb(9, 5.6, 9.6, 8.4, 0.25, 0.25, '#b87a32')),
    F(E(5.8, 4.6, 2, 0.6, '#f4c47a'))],
  dorayaki: () => [E(7, 9.4, 5.8, 2.2, '#b8702e'), F(R(1.6, 7, 10.8, 1.8, ANKO)), E(7, 6.4, 5.8, 2.4, '#c8803c'), F(E(7, 5.6, 3.4, 1.1, '#e8a868')), F(E(5.6, 5.3, 1.2, 0.4, '#f6c890'))],
  'warabi mochi': () => [...stick(3), E(4.6, 9.2, 2.6, 2.2, '#cbd7ae'), E(9.2, 9.4, 2.6, 2.1, '#cbd7ae'), E(7, 5.6, 2.8, 2.4, '#d3dfb6'),
    F(E(6.2, 4.8, 1, 0.5, '#f4f8e6')), F(E(3.9, 8.5, 0.8, 0.4, '#f4f8e6')), F(E(8.5, 8.7, 0.8, 0.4, '#f4f8e6')),
    ...[[5.6, 4], [8, 4.4], [7.2, 3.6], [3.6, 8], [10, 8.4], [9.2, 8]].map(([x, y]) => F(R(x, y, 0.5, 0.5, '#c8a050')))],
  'sakura mochi': () => [E(7, 6.6, 5.2, 3.8, '#f8b8c8'), F(E(5.6, 5.2, 1.6, 0.8, '#ffe0e8')), T([[1.8, 7.2], [7, 11.6], [12.2, 7.2], [11, 10.8], [3, 10.8]], '#6a9a4a'),
    F(limb(3, 9.6, 11, 9.6, 0.25, 0.2, '#8cbc66')), ...[[6, 6.8], [8.6, 5.4], [9.6, 7.4]].map(([x, y]) => F(R(x, y, 0.5, 0.5, '#e890a8')))],
  'kashiwa mochi': () => [T([[1.2, 10.8], [1.6, 7], [3.4, 4.2], [5, 5.4], [6.6, 3], [8.4, 4.6], [10.2, 3.2], [11.6, 5.8], [12.8, 10.8]], '#5a8a3a'),
    E(7, 8.6, 5, 3, '#fbf6ec'), F(E(5.4, 7.4, 1.6, 0.7, '#ffffff')), F(limb(2.4, 10.4, 11.6, 10.4, 0.25, 0.2, '#7aac56'))],
  monaka: () => [T([[1.4, 9.6], [2, 5.4], [7, 3], [12, 5.4], [12.6, 9.6], [7, 11.4]], '#e8c890'), F(R(1.8, 7.8, 10.4, 1.2, ANKO)),
    F(limb(4, 5, 4.4, 7.4, 0.2, 0.2, '#c8a060')), F(limb(7, 4, 7, 7.4, 0.2, 0.2, '#c8a060')), F(limb(10, 5, 9.6, 7.4, 0.2, 0.2, '#c8a060')), F(E(5.4, 4.8, 1.6, 0.5, '#f8e4b8'))],
  yokan: () => [T([[2, 4.4], [11.4, 3.4], [12.4, 10.6], [3, 11.4]], '#5a1e2a'), F(T([[3, 5], [10.6, 4.2], [10.8, 5.2], [3.2, 6]], '#8a3a48')), F(R(3.4, 9, 0.6, 0.6, '#7a2e3c'))],
  kakigori: () => [T([[3, 8], [11, 8], [9.4, 11.6], [4.6, 11.6]], '#cfe8f4'), F(R(4.2, 8.2, 5.6, 0.5, '#ffffff')), E(7, 5.4, 4.8, 3.8, '#f6fbff'),
    F(T([[3.6, 4.6], [7, 1.8], [10.4, 4.6], [9.4, 6.4], [8, 5.4], [6.6, 6.8], [5, 5.6]], '#ff6a8a')), F(E(6, 3, 1, 0.5, '#ffd0dc'))],
  manju: () => [E(7, 7.8, 5.6, 4, '#f0d8a8'), F(E(5.6, 5.6, 2, 0.8, '#fff0d0')),
    ...[[0, -1.2], [1.1, -0.4], [0.7, 0.9], [-0.7, 0.9], [-1.1, -0.4]].map(([dx, dy]) => F(E(7 + dx, 6.6 + dy * 0.7, 0.6, 0.45, '#9a5a2a'))), F(E(7, 6.6, 0.45, 0.35, '#c88a4a'))],
  ohagi: () => [E(7, 7.8, 5.4, 3.8, '#4a2028'), F(E(5.4, 6, 1.8, 0.8, '#7a3a44')), ...[[4, 8], [6.4, 9.2], [9, 7.2], [10, 9], [7.6, 5.8]].map(([x, y]) => F(R(x, y, 0.5, 0.5, '#6a3038')))],
  anmitsu: () => [E(5, 4.6, 1.8, 1.6, '#fbf6ec'), E(9, 4.8, 1.9, 1.6, '#e8f0f8'), E(7, 3.4, 1.6, 1.4, ANKO), E(10.6, 3, 1.1, 1.1, '#e83a50'), F(limb(10.6, 2, 11.6, 0.4, 0.2, 0.2, '#4f8f45')),
    T([[1.2, 6], [12.8, 6], [11.4, 10], [9, 11.4], [5, 11.4], [2.6, 10]], '#f4f0f8'), F(R(1.6, 6, 10.8, 0.6, '#ffffff')), F(limb(3, 8.4, 11, 8.4, 0.3, 0.3, '#c8b8e8'))],
  imagawayaki: () => [T([[1.6, 5.6], [12.4, 5.6], [12.4, 9.6], [1.6, 9.6]], '#c8803c'), E(7, 9.6, 5.4, 1.6, '#b8702e'), E(7, 5.6, 5.4, 1.8, '#e0a050'),
    F(E(7, 5.4, 3.4, 1, '#eab868')), F(R(1.8, 7.2, 10.4, 0.6, '#a8602a'))],
  'kinako mochi': () => [E(4.4, 9.2, 2.8, 2.2, '#e6c56a'), E(9.6, 9.2, 2.8, 2.2, '#e6c56a'), E(7, 5.8, 3, 2.4, '#ecce78'),
    ...[[3.4, 8.2], [5.2, 9.6], [8.8, 8.4], [10.4, 9.8], [6.2, 5], [7.8, 6.2], [7, 4.4]].map(([x, y]) => F(R(x, y, 0.5, 0.5, '#c89a3a'))), F(E(6.2, 4.8, 1, 0.4, '#fbe8a8'))],
  // A Heart Mochi: a pink heart of mochi, a white shine, a dusting of sugar.
  'heart mochi': () => [T([[7, 11.6], [1.6, 6.4], [1.4, 3.6], [3, 1.8], [5.2, 1.8], [7, 3.6], [8.8, 1.8], [11, 1.8], [12.6, 3.6], [12.4, 6.4]], '#ff8fb4'),
    F(T([[7, 10.4], [2.8, 6.2], [2.8, 4.2], [4, 3], [5.4, 3.2], [7, 5]], '#ffb3cc')), F(E(4.4, 4, 1.2, 0.7, '#ffffff')), F(E(9.6, 6.6, 0.5, 0.5, '#ffffff')), F(E(8.4, 8.4, 0.4, 0.4, '#ffffff'))],
  mitarashi: () => [...stick(0.4), E(7, 9.2, 2.5, 2.2, '#a8682a'), E(7, 5.7, 2.5, 2.2, '#b07030'), E(7, 2.2, 2.5, 2.2, '#a8682a'),
    F(E(6, 8.4, 1, 0.6, '#e0a050')), F(E(6, 4.9, 1, 0.6, '#e0a050')), F(E(6, 1.4, 1, 0.6, '#e0a050')), F(R(8, 9.6, 0.6, 0.5, '#6a3a18')), F(R(7.8, 2.6, 0.6, 0.5, '#6a3a18'))],
  // The spicy treats (they lean a Mochi toward the demon path).
  'fire senbei': () => [E(7, 7.8, 5.8, 4, '#d89a48'), F(E(7, 7.2, 4.4, 2.8, '#e8b464')), F(R(4.8, 5.6, 2.6, 1.4, '#3a4a3a')),
    ...[[4.2, 8.4], [6.6, 9.6], [9, 6.4], [10, 8.8], [7.6, 6.8]].map(([x, y]) => F(R(x, y, 0.6, 0.5, '#e8483a')))],
  'shichimi dango': () => [...stick(0.4), E(7, 9.2, 2.4, 2.2, '#f4e6d4'), E(7, 5.7, 2.4, 2.2, '#f4e6d4'), E(7, 2.2, 2.4, 2.2, '#f4e6d4'),
    ...[[6, 8.4], [7.8, 9.6], [6.4, 5], [8, 6.2], [6.2, 1.6], [7.6, 2.8]].map(([x, y]) => F(R(x, y, 0.6, 0.5, '#e8483a')))],
  'ember arare': () => [E(4.4, 9.4, 2.2, 1.9, '#ff8a4a'), E(9.4, 9.6, 2.2, 1.8, '#e8483a'), E(7, 7.2, 2.2, 2, '#ffb060'), E(4.8, 5.6, 1.8, 1.6, '#e8483a'), E(9.2, 5.6, 1.8, 1.6, '#ff8a4a'),
    F(E(6.4, 6.6, 0.8, 0.4, '#fff0c8')), F(E(3.8, 8.8, 0.7, 0.35, '#ffe0b0'))],
  firedrop: () => [T([[1, 5.4], [3.2, 6.8], [3.2, 8.6], [1, 10]], '#ffd0a0'), T([[13, 5.4], [10.8, 6.8], [10.8, 8.6], [13, 10]], '#ffd0a0'), E(7, 7.7, 4.2, 3.6, '#ff6a3a'),
    F(E(5.6, 6.2, 1.4, 0.8, '#ffc0a0')), F(E(8.4, 9, 1.6, 0.8, '#d8401e'))],
  'hot koi': () => [T([[1, 7.4], [3, 4.4], [7, 3.4], [10, 4.4], [11, 6.2], [13.4, 4], [13.2, 10.4], [11, 8.6], [9.6, 10.6], [6, 11.2], [2.6, 10.2]], '#e8603a'),
    F(E(3.4, 6.6, 0.55, 0.55, '#3a2418')), F(limb(5, 5.6, 6, 8, 0.25, 0.25, '#b83a1e')), F(limb(7, 5.4, 8, 8.4, 0.25, 0.25, '#b83a1e')), F(limb(9, 5.6, 9.6, 8.4, 0.25, 0.25, '#b83a1e')),
    F(E(5.8, 4.6, 2, 0.6, '#ff9a6a'))],
};
export const SWEET_KINDS = Object.keys(SHAPES);
const sweetSprite = (kind) => art(`mochi-sweet|${kind}`, 14, 12, SHAPES[kind] ?? SHAPES.daifuku);
// Bites out of the top: where each one goes (fractions of the sprite) and how big.
const BITES = [[0.78, 0.18, 0.26], [0.42, 0.12, 0.3], [0.62, 0.42, 0.34]];
const bitten = new Map();
function bittenSprite(kind, bites) {
  const s = sweetSprite(kind);
  if (!bites) return s;
  const key = `${kind}|${bites}|${s.canvas.width}`;
  if (!bitten.has(key)) {
    const c = document.createElement('canvas');
    c.width = s.canvas.width;
    c.height = s.canvas.height;
    const x = c.getContext('2d');
    x.drawImage(s.canvas, 0, 0);
    // (The bites go by the sweet itself, not its box: where it actually is.)
    const px = x.getImageData(0, 0, c.width, c.height).data;
    let [x0, y0, x1, y1] = [c.width, c.height, 0, 0];
    for (let i = 3; i < px.length; i += 4) {
      if (!px[i]) continue;
      const p = (i - 3) / 4;
      const [cx, cy] = [p % c.width, Math.floor(p / c.width)];
      [x0, y0, x1, y1] = [Math.min(x0, cx), Math.min(y0, cy), Math.max(x1, cx), Math.max(y1, cy)];
    }
    const [w, h] = [x1 - x0, y1 - y0];
    const size = Math.min(w, h);
    x.globalCompositeOperation = 'destination-out';
    for (const [bx, by, br] of BITES.slice(0, bites)) {
      // A bite: a scallop of three little tooth curves.
      for (const off of [-0.6, 0, 0.6]) {
        x.beginPath();
        x.arc(x0 + w * bx + off * br * size * 0.5, y0 + h * by - size * 0.1, size * br * 0.55, 0, Math.PI * 2);
        x.fill();
      }
    }
    bitten.set(key, { ...s, canvas: c });
  }
  return bitten.get(key);
}
// Sweet `kind` as a 16 x 16 bag icon: the same drawing, set in the middle of the cell.
export function sweetIcon(kind) {
  const draw = SHAPES[kind];
  if (!draw) return [E(8, 9, 5, 4, '#ffd0dc')];
  return draw().map((sh) => ({ ...sh, x: sh.x + 1, y: sh.y + 2.4 }));
}
// Draws sweet `kind` with its bottom middle at (x, y), at a Mochi's size `s`, `bites` taken (0-3).
export function drawSweet(ctx, kind, x, y, s = 0.6, bites = 0) {
  if (bites > 3) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  place(ctx, bittenSprite(kind, bites), 0, 0);
  ctx.restore();
}

// Its toy: a little temari ball, wound in coloured thread. Drawn with its middle at (x, y),
// turned by `spin` (radians) as it flies.
const temari = () => art('mochi-temari', 9, 9, () => [E(4.5, 4.5, 3.8, 3.8, '#f6eef0'),
  F(T([[1, 4.5], [2.6, 2.6], [4.5, 4.5], [6.4, 2.6], [8, 4.5], [6.4, 6.4], [4.5, 4.5], [2.6, 6.4]], '#e8485e')),
  F(limb(4.5, 0.8, 4.5, 8.2, 0.35, 0.35, '#4a7ad0')), F(limb(0.8, 4.5, 8.2, 4.5, 0.35, 0.35, '#f2c94c')), F(E(4.5, 4.5, 0.8, 0.8, '#4a7ad0')), F(E(3, 2.4, 0.9, 0.5, '#ffffff'))]);
export function drawBall(ctx, x, y, s = 0.6, spin = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.round(spin / (Math.PI / 2)) * (Math.PI / 2));
  ctx.scale(s, s);
  place(ctx, temari(), 0, 4.5);
  ctx.restore();
}
