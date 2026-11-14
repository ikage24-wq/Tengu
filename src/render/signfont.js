// A pixel alphabet for the signs painted on things in the world: shop boards, stall cards, gate
// banners (render/garden.js and the rest).
//
// Why not just write the words with the canvas's own font: the world is drawn small and scaled up
// whole, so a 7px typeface comes out of that as a grey smear - the letters go soft, the counters
// close up and the colour washes into whatever is behind. These letters are drawn as plain
// rectangles on whole pixels instead, so they stay as crisp at four times the size as the rest of
// the art does, which is the whole point of drawing a game this way.
//
// Each glyph is 5 wide and 7 tall, a row per five bits, and letters sit a pixel apart. (It was 4x6
// and the player called the result bad, 2026-11-14: at four wide a round letter had only three
// columns to turn in, so C, G, O and S came out narrower than their neighbours and the word read
// as a ragged picket fence. Five gives every letter the same width, a counter you can see through,
// and room for the bowl of a B or an R to close.) Lower case is drawn as small capitals, because a
// hand-painted sign is lettered that way anyway.

const G = {
  A: [0x0e, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  B: [0x1e, 0x11, 0x11, 0x1e, 0x11, 0x11, 0x1e],
  C: [0x0e, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0e],
  D: [0x1e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1e],
  E: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x1f],
  F: [0x1f, 0x10, 0x10, 0x1e, 0x10, 0x10, 0x10],
  G: [0x0e, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0f],
  H: [0x11, 0x11, 0x11, 0x1f, 0x11, 0x11, 0x11],
  I: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x1f],
  J: [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0c],
  K: [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  L: [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1f],
  M: [0x11, 0x1b, 0x15, 0x15, 0x11, 0x11, 0x11],
  N: [0x11, 0x19, 0x19, 0x15, 0x13, 0x13, 0x11],
  O: [0x0e, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  P: [0x1e, 0x11, 0x11, 0x1e, 0x10, 0x10, 0x10],
  Q: [0x0e, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0d],
  R: [0x1e, 0x11, 0x11, 0x1e, 0x14, 0x12, 0x11],
  S: [0x0f, 0x10, 0x10, 0x0e, 0x01, 0x01, 0x1e],
  T: [0x1f, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  U: [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0e],
  V: [0x11, 0x11, 0x11, 0x11, 0x11, 0x0a, 0x04],
  W: [0x11, 0x11, 0x11, 0x15, 0x15, 0x1b, 0x11],
  X: [0x11, 0x11, 0x0a, 0x04, 0x0a, 0x11, 0x11],
  Y: [0x11, 0x11, 0x0a, 0x04, 0x04, 0x04, 0x04],
  Z: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1f],
  0: [0x0e, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0e],
  1: [0x04, 0x0c, 0x04, 0x04, 0x04, 0x04, 0x0e],
  2: [0x0e, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1f],
  3: [0x1e, 0x01, 0x01, 0x0e, 0x01, 0x01, 0x1e],
  4: [0x02, 0x06, 0x0a, 0x12, 0x1f, 0x02, 0x02],
  5: [0x1f, 0x10, 0x1e, 0x01, 0x01, 0x11, 0x0e],
  6: [0x06, 0x08, 0x10, 0x1e, 0x11, 0x11, 0x0e],
  7: [0x1f, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  8: [0x0e, 0x11, 0x11, 0x0e, 0x11, 0x11, 0x0e],
  9: [0x0e, 0x11, 0x11, 0x0f, 0x01, 0x02, 0x0c],
  "'": [0x04, 0x04, 0, 0, 0, 0, 0],
  '.': [0, 0, 0, 0, 0, 0, 0x04],
  ',': [0, 0, 0, 0, 0, 0x04, 0x08],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0, 0x04],
  '?': [0x0e, 0x11, 0x01, 0x02, 0x04, 0, 0x04],
  '-': [0, 0, 0, 0x0e, 0, 0, 0],
  '&': [0x0c, 0x12, 0x12, 0x0c, 0x15, 0x12, 0x0d],
};
const SPACE = 2;
const GLYPH_W = 5;
const GLYPH_H = 7;
const GAP = 1;

// How wide a word comes out, in pixels, at this size.
export function signWidth(str, size = 1) {
  let w = 0;
  for (const ch of String(str).toUpperCase()) w += (ch === ' ' ? SPACE : GLYPH_W) + GAP;
  return Math.max(0, w - GAP) * size;
}
export const signHeight = (size = 1) => GLYPH_H * size;

// Paints a word. (x, y) is its top left, or its top centre / top right with `align`. Everything is
// snapped to whole pixels, which is what keeps the letters sharp when the world is scaled up.
// `shadow` paints the word again a pixel lower first, to lift it off a painted board; `edge` paints
// it all round instead, for a word that has to hold its own over busy art.
export function signText(ctx, str, x, y, { size = 1, color = '#4a3a52', align = 'left', shadow = null, edge = null } = {}) {
  const text = String(str).toUpperCase();
  const w = signWidth(text, size);
  const px = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
  const py = Math.round(y);
  const draw = (dx, dy, c) => {
    ctx.fillStyle = c;
    let cx = px + dx;
    for (const ch of text) {
      if (ch === ' ') {
        cx += (SPACE + GAP) * size;
        continue;
      }
      const rows = G[ch];
      if (rows) {
        for (let r = 0; r < GLYPH_H; r++) {
          const bits = rows[r];
          if (!bits) continue;
          let run = 0;
          for (let c2 = 0; c2 <= GLYPH_W; c2++) {
            const on = c2 < GLYPH_W && (bits >> (GLYPH_W - 1 - c2)) & 1;
            if (on) run++;
            else if (run) {
              ctx.fillRect(cx + (c2 - run) * size, py + dy + r * size, run * size, size);
              run = 0;
            }
          }
        }
      }
      cx += (GLYPH_W + GAP) * size;
    }
  };
  if (edge) for (const [dx, dy] of [[-size, 0], [size, 0], [0, -size], [0, size]]) draw(dx, dy, edge);
  if (shadow) draw(0, size, shadow);
  draw(0, 0, color);
  return w;
}

// A little painted board with a word on it: a wooden plaque cut to fit the word, so a sign can
// never spill off its own board (the stalls' did, with the board drawn at a fixed width in the art
// and the word painted over it). It is lit from the upper left like everything else - a pale top
// and left to the frame, a dark underside and right, and its own shadow on the wall behind - so it
// reads as a board nailed up rather than a pale sticker laid over the art. (x, y) is its middle.
export function signBoard(ctx, str, x, y, { size = 1, color = '#4a3a52', board = '#fff4e2', rim = '#c08a52', pad = 4 } = {}) {
  const w = Math.round(signWidth(str, size) + pad * 2);
  const h = Math.round(signHeight(size) + pad + 1);
  const bx = Math.round(x - w / 2);
  const by = Math.round(y - h / 2);
  // Its shadow on whatever it is hung on.
  ctx.fillStyle = 'rgba(70,40,30,0.22)';
  ctx.fillRect(bx, by + 2, w + 3, h + 1);
  // The frame, then the board itself inside it.
  ctx.fillStyle = rim;
  ctx.fillRect(bx - 1, by - 1, w + 2, h + 2);
  ctx.fillStyle = mixHex(rim, '#ffffff', 0.4);
  ctx.fillRect(bx - 1, by - 1, w + 2, 1);
  ctx.fillRect(bx - 1, by - 1, 1, h + 2);
  ctx.fillStyle = mixHex(rim, '#000000', 0.3);
  ctx.fillRect(bx - 1, by + h, w + 2, 1);
  ctx.fillRect(bx + w, by - 1, 1, h + 2);
  ctx.fillStyle = board;
  ctx.fillRect(bx, by, w, h);
  ctx.fillStyle = mixHex(board, '#ffffff', 0.7);
  ctx.fillRect(bx, by, w, 1);
  ctx.fillStyle = mixHex(board, rim, 0.3);
  ctx.fillRect(bx, by + h - 1, w, 1);
  signText(ctx, str, x, by + Math.round((h - signHeight(size)) / 2), { size, color, align: 'center' });
  return w;
}
// (A plain hex blend, so the frame's light and dark sides follow whatever colour it is given.)
function mixHex(a, b, k) {
  const v = (c, i) => parseInt(c.slice(1 + i * 2, 3 + i * 2), 16);
  const out = [0, 1, 2].map((i) => Math.round(v(a, i) + (v(b, i) - v(a, i)) * k));
  return `#${out.map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}
