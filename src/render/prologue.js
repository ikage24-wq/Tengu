// The prologue's two rooms (data/story.js PROLOGUE; data/maps.js pr_flat, royal_bed): where
// Hayate fell asleep in the human world, and where she woke up a queen without knowing it.
//
//   pr_flat       Her flat, 2:07 a.m. (and her secret: she is a huge anime fan, and nobody at work
//                 knows - the closet stands open a crack on a shrine of figures, manga and a light
//                 stick under fairy lights, a stack of manga hides under the kotatsu quilt, a star
//                 charm hangs off her phone, her mug has cat ears): a small one-room flat in a big city, lit only by a desk
//                 lamp and a laptop. The front door and a jumble of shoes, the kitchenette with a
//                 tower of instant noodle cups on the fridge and one plate in the rack, the big
//                 window onto the city in the rain (the rain stays outside the glass), the kotatsu
//                 she works at (laptop, a stack of paperwork, a cold noodle cup, a convenience-store
//                 onigiri, her phone), her futon with a round white plush on the pillow, the
//                 calendar with every day crossed out, the clock, a photo of a beach she never went
//                 to, the closet.
//   pr_sea        The open sea at night, the moon's path on the water, Windbag Island far off on
//                 the horizon, and your little boat bobbing in the middle of it (render/cast.js).
//   royal_bed     The Queen's Bedchamber, on the hill above Sprout Village, in the morning: a tall
//                 arched window over the village and its windmill, the Mochi's own little door and
//                 their cushions, the throne-bed under its crown canopy (a tall cloud-topped throne
//                 back with the gold sprout crest, mochi pillows, a cloud of a duvet), the crown's
//                 velvet cushion on its stand, the Royal Snore Translator's tiny lectern and his
//                 brass ear trumpet pointed at the bed, banners, candle sconces, the door out; a
//                 little stair of three steps up the bed's side (the Mochi are small), a gold plaque
//                 on its frame saying no sleeping, the Mochi's slippers by their door, a painting of
//                 the sacred mochi on its cushion, and the morning sun slanting in.
//
// Both are 640 x 480 pictures like the Sweethearts' rooms (render/sweetrooms.js): the wall from y 0
// to 300, the floor painted from 300 down, people standing at y 344. Indoors is indoors: the
// outside shows only through the windows.
//
// Someone sitting in the bed or at the kotatsu is drawn standing with their lower half under the
// covers: the room is drawn, then them, then the covers again over them (`drawBedCovers`,
// `drawKotatsuCovers`), so the duvet or the kotatsu quilt hides their legs and they sit up out of
// it. QUEEN_BED and FLAT_SEAT are where their feet go for that.

import { R, E, T, F, mix } from './pixel.js';
import { ramp, planks, hash } from './propkit.js';
import { art, place } from './scenery.js';
import { cornice, wainscot, skirting, floorShade, contact, frame, plant, shelf, candle, door, curtains, glow, flame } from './sweetrooms.js';
import { drawHayate } from './hayate.js';
import { drawMochiAnim } from './mochi-anim.js';
import { rollMochi } from '../data/mochi-genes.js';
import { SAKURA, WARABI, KURI, GOMA, ICHIGO } from '../data/scenes.js';

const TAU = Math.PI * 2;
const WHITE = '#ffffff';
const GOLD = '#ffd36b';
const GOLD_D = '#d8a040';

// Where a sitter's feet go: Hayate sitting up in the throne-bed (her hips on the mattress, her legs
// under the duvet), and at the kotatsu in her flat (the quilt over her lap).
export const QUEEN_BED = { x: 300, y: 283 };
export const FLAT_SEAT = { x: 302, y: 329 };
// Where the crown waits on its cushion, and the Translator's lectern.
export const CROWN_CUSHION = { x: 500, y: 243 };
export const TRANSLATOR_SPOT = { x: 548, y: 344 };

// Moves a list of shapes by (dx, dy) (for a piece cut out of a room into its own small picture).
function shift(shapes, dx, dy) {
  return shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: (s.x ?? 0) + dx, y: (s.y ?? 0) + dy } : { ...s, x: s.x + dx, y: s.y + dy }));
}
// A star, for the duvet's sprinkle.
function star(cx, cy, r, c) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
  }
  return T(pts, c);
}
// The gold sprout, the Mochi's mark: a stem bending up and two round leaves opening from its tip.
function sproutMark(x, y, s, c = GOLD, flat = false) {
  const w = (sh) => (flat ? F(sh) : sh);
  return [
    w(T([[x - 0.9 * s, y], [x + 0.9 * s, y], [x + 0.6 * s, y - 6 * s], [x - 0.2 * s, y - 6.2 * s]], c)),
    w(T([[x, y - 6 * s], [x - 3 * s, y - 9 * s], [x - 7 * s, y - 9.4 * s], [x - 6.4 * s, y - 6.8 * s], [x - 3.2 * s, y - 5.6 * s]], c)),
    w(T([[x + 0.2 * s, y - 6 * s], [x + 3.4 * s, y - 9.8 * s], [x + 7.6 * s, y - 10 * s], [x + 6.8 * s, y - 7 * s], [x + 3.4 * s, y - 5.8 * s]], c)),
    F(T([[x - 1.4 * s, y - 7.8 * s], [x - 5.4 * s, y - 8.8 * s], [x - 4.6 * s, y - 8 * s]], mix(c, WHITE, 0.55))),
    F(T([[x + 1.8 * s, y - 8.2 * s], [x + 6.2 * s, y - 9.4 * s], [x + 5.2 * s, y - 8.4 * s]], mix(c, WHITE, 0.55))),
  ];
}

// ---------- The Queen's Bedchamber ----------

const LILAC = '#c9b8ff';
const VELVET = '#a898f0';
const BED_FLOOR = '#e3b583';

// The duvet, a cloud over her lap and legs: it rises over her knees and her toes and spills over the
// bed's side in a scalloped hem. Drawn with the room, and again over whoever sits in the bed.
function duvetShapes() {
  const top = [[284, 282], [288, 276], [298, 274], [312, 274], [324, 271], [336, 264], [348, 263], [358, 269], [372, 273], [388, 269], [398, 265], [406, 268], [410, 276]];
  const hem = [];
  for (let i = 0; i <= 7; i++) hem.push([410 - i * 18, 288 + (i % 2 ? 3 : 0)]);
  const out = [T([...top, [412, 288], ...hem, [282, 288]], '#fbf8ff')];
  // The lower half falls into lilac shade where it drapes over the side.
  out.push(F(T([[284, 281], [410, 281], [412, 288], ...hem, [282, 288]], '#ebe3fd')));
  for (let i = 0; i < 7; i++) out.push(F(E(401 - i * 18, 290 + (i % 2 ? 3 : 0), 8, 3, '#ddd2fa')));
  // The turned-down sheet along the top edge, under her arms.
  out.push(T([[284, 282], [288, 276], [298, 274], [314, 274], [316, 279], [300, 280], [290, 283]], LILAC), F(T([[289, 277], [298, 275], [312, 275], [300, 277]], '#e2d8ff')));
  // Soft folds where her knees and toes push the cloud up.
  out.push(F(T([[338, 266], [348, 265], [352, 274], [342, 279]], '#efe9fd')), F(T([[398, 267], [404, 268], [408, 277], [400, 279]], '#efe9fd')));
  out.push(F(T([[318, 278], [334, 272], [336, 273], [320, 280]], WHITE)), F(T([[358, 271], [386, 274], [386, 275], [358, 273]], WHITE)));
  // A sprinkle of little gold stars.
  for (let i = 0; i < 7; i++) out.push(F(star(300 + i * 15 + hash(i * 3.3) * 5, 280 + hash(i * 1.9) * 7, 1.7, GOLD)));
  return out;
}

// The crystal crown as it sits on its cushion or is carried (the hat she wears, render/gear.js
// 'crown', at her size): a gold band with three points, a pink stone and two blue ones.
function crownArt() {
  return art('pr-crown', 20, 13, () => [
    T([[2, 10.5], [2, 4.5], [4.6, 7], [7.1, 2], [10, 6.2], [12.9, 2], [15.4, 7], [18, 4.5], [18, 10.5]], GOLD),
    F(R(2, 8.6, 16, 1.4, GOLD_D)), F(T([[7.1, 3], [8, 5.6], [7.6, 5.8]], '#fff3b0')), F(T([[12.9, 3], [13.6, 5.6], [13.2, 5.8]], '#fff3b0')),
    F(E(10, 7.6, 1.3, 1.3, '#ff9ec0')), F(E(5.1, 8, 0.9, 0.9, '#8fe3ff')), F(E(14.9, 8, 0.9, 0.9, '#8fe3ff')),
  ], false);
}
// The crown with its bottom centre at (x, y), tipped `tilt` radians.
export function drawCrown(ctx, x, y, tilt = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (tilt) ctx.rotate(tilt);
  place(ctx, crownArt(), 0, 0);
  ctx.restore();
}

export function bedchamberArt() {
  return art('pr-bedchamber', 640, 480, () => {
    const out = [R(0, 0, 640, 300, '#f7f0ff')];
    // The ceiling, and the plaster below it with its pattern of little sprouts.
    out.push(R(0, 0, 640, 44, '#e6dcfc'));
    for (let x = 20; x < 640; x += 40) for (let y = 74 + ((x / 40) % 2) * 18; y < 214; y += 36) out.push(...sproutMark(x, y, 0.55, '#ebe0fd', true));
    out.push(...cornice('#d8c8ff', 40, 12), ...wainscot('#bfaef5', 214, GOLD), ...skirting('#9d8ae0'));
    // The floor: warm honey parquet, shaded where it meets the wall.
    out.push(...planks(0, 300, 640, 180, ramp(BED_FLOOR, 0.8), 16, 7), ...floorShade(BED_FLOOR));

    // The tall arched window on the left, and through it the morning: sky, the sea, the hills, and
    // Sprout Village's roofs far below with the windmill, its sails still.
    const wx = 26, ww = 80, wt = 104, wb = 228;
    out.push(R(wx - 6, wt, ww + 12, wb - wt + 4, '#efe2c8'), E(wx + ww / 2, wt, ww / 2 + 6, ww / 2 + 6, '#efe2c8'));
    out.push(R(wx, wt, ww, wb - wt, '#cfe8ff'), E(wx + ww / 2, wt, ww / 2, ww / 2, '#bfe0ff'));
    out.push(F(R(wx, 150, ww, 40, '#e4f2ff')), F(R(wx, 176, ww, 18, '#fff1dc')));
    out.push(F(R(wx, 194, ww, 9, '#9fd8ff')), F(R(wx, 194, ww, 1.4, WHITE)));
    out.push(F(T([[wx, 210], [wx + 18, 200], [wx + 40, 204], [wx + 62, 198], [wx + ww, 203], [wx + ww, wb], [wx, wb]], '#bfe8b8')));
    for (let i = 0; i < 6; i++) {
      const rx = wx + 4 + i * 13, ry = 214 + (i % 2) * 4;
      out.push(F(R(rx, ry, 9, 6, '#fff3e0')), F(T([[rx - 1, ry], [rx + 4.5, ry - 4], [rx + 10, ry]], ['#ff9a8a', '#ffb38a', '#e8866a'][i % 3])));
    }
    out.push(F(T([[wx + 58, 214], [wx + 61, 196], [wx + 65, 196], [wx + 68, 214]], '#fff3e0')), F(T([[wx + 61, 196], [wx + 63, 192], [wx + 65, 196]], '#e8866a')));
    for (const [dx, dy] of [[-7, -2], [7, 2], [-2, 7], [2, -7]]) out.push(F(T([[wx + 63, 196], [wx + 63 + dx, 196 + dy], [wx + 63 + dx * 0.9 + dy * 0.2, 196 + dy * 0.9 - dx * 0.2]], '#ffffff')));
    // Its mullions and sill, a glint on the glass, and the curtains tied back.
    out.push(R(wx + ww / 2 - 2, wt - ww / 2, 4, wb - wt + ww / 2, '#efe2c8'), R(wx, 160, ww, 4, '#efe2c8'));
    out.push(F(T([[wx + 8, 214], [wx + 22, 120], [wx + 27, 120], [wx + 13, 214]], '#e8f4ff')));
    out.push(R(wx - 10, wb, ww + 20, 8, '#efe2c8'), F(R(wx - 10, wb, ww + 20, 1.6, WHITE)), F(R(wx - 10, wb + 6, ww + 20, 2, '#d8c8b0')));
    out.push(...curtains(wx, wt - 30, ww, wb - wt + 30, LILAC));

    // Banners either side of the bed, lilac with the gold sprout.
    for (const bx of [160, 500]) {
      out.push(R(bx - 22, 60, 44, 3, GOLD_D), E(bx - 23, 61.5, 2.4, 2.4, GOLD), E(bx + 23, 61.5, 2.4, 2.4, GOLD));
      out.push(T([[bx - 18, 63], [bx + 18, 63], [bx + 18, 168], [bx, 156], [bx - 18, 168]], '#a898f0'));
      out.push(F(T([[bx - 18, 63], [bx - 13, 63], [bx - 13, 163], [bx - 18, 168]], '#b9acf5')), F(R(bx - 18, 66, 36, 2, GOLD)), F(T([[bx - 15, 160], [bx, 150], [bx + 15, 160], [bx + 15, 162], [bx, 152.5], [bx - 15, 162]], GOLD)));
      out.push(...sproutMark(bx, 118, 2, GOLD));
    }
    // Candle sconces under them.
    for (const sx of [186, 466]) out.push(T([[sx - 6, 198], [sx + 6, 198], [sx + 2, 210], [sx - 2, 210]], GOLD_D), R(sx - 8, 196, 16, 3, GOLD), ...candle(sx, 196, '#fff8e8', 12));

    // The Mochi's own little door in the panelling, a sprout over it, and their cushions.
    out.push(R(129, 264, 24, 36, '#5f9a6a'), E(141, 264, 12, 12, '#5f9a6a'), R(131, 266, 20, 34, '#7fcf9a'), E(141, 266, 10, 10, '#7fcf9a'));
    out.push(F(R(131, 266, 3, 34, '#a8e8b8')), F(R(141, 262, 1, 38, '#5f9a6a')), E(147, 284, 1.6, 1.6, GOLD), ...sproutMark(141, 250, 0.9, GOLD));
    // The Mochi's slippers, lined up by their door.
    for (const [sx, c] of [[118, '#ffb3cf'], [127, '#ffb3cf'], [159, '#8fd8ff'], [168, '#8fd8ff']]) out.push(E(sx, 299, 3.6, 1.6, c), F(E(sx - 0.8, 298.4, 1.6, 0.6, '#ffffff')));
    for (const [cx, c] of [[100, '#ffc8dc'], [186, '#bfe3a8']]) out.push(contact(cx, 26, BED_FLOOR), E(cx, 296, 13, 6, c), F(E(cx - 3, 293, 6, 2.4, mix(c, WHITE, 0.5))), E(cx, 292, 2, 1.4, mix(c, '#6a4a6a', 0.3)));

    // The throne-bed under its crown canopy. The canopy first: a gold crown hung from the ceiling on
    // two chains, a scalloped valance under it, a velvet hanging behind the bed (her white hair shows
    // up against it), sheer drapes falling to the posts.
    out.push(R(279, 44, 1.6, 14, GOLD_D), R(379, 44, 1.6, 14, GOLD_D));
    for (const [cx, h] of [[234, 10], [282, 14], [330, 18], [378, 14], [426, 10]]) out.push(T([[cx - 7, 60], [cx, 60 - h], [cx + 7, 60]], GOLD), F(E(cx, 60 - h + 1, 1.6, 1.6, '#fff3b0')));
    out.push(R(238, 72, 184, 200, '#b9acf5'), F(R(238, 72, 184, 5, '#a99cee')));
    for (let i = 0; i < 9; i++) out.push(F(R(244 + i * 20, 77, 7, 195, '#c6bbf8')), F(R(251 + i * 20, 77, 2, 195, '#a99cee')));
    for (let i = 0; i < 11; i++) out.push(E(236 + i * 19, 74, 10, 6, '#e2d8ff'), F(E(236 + i * 19, 72, 7, 3, '#efe9ff')));
    out.push(R(226, 58, 208, 14, GOLD), F(R(226, 58, 208, 2, '#fff0b0')), F(R(226, 69, 208, 3, GOLD_D)));
    for (let i = 0; i < 5; i++) out.push(F(star(250 + i * 40, 65, 2.4, '#fff3b0')));
    // The drapes: the head's falls behind the throne back, the foot's is tied to its post.
    out.push(T([[226, 72], [248, 72], [244, 150], [240, 300], [218, 300], [230, 150]], '#e2d8ff'), F(T([[234, 72], [240, 72], [236, 300], [230, 300]], '#efe9ff')));
    out.push(R(428, 72, 3.4, 228, GOLD_D), F(R(428, 72, 1.2, 228, '#ffe8a0')), E(429.7, 70, 4, 4, GOLD));
    out.push(T([[414, 74], [440, 74], [436, 206], [456, 300], [426, 300], [428, 206]], '#e2d8ff'), F(T([[424, 74], [430, 74], [432, 206], [428, 206]], '#efe9ff')), F(T([[432, 210], [444, 300], [438, 300], [430, 214]], '#efe9ff')));
    out.push(R(422, 202, 16, 6, GOLD), F(R(422, 202, 16, 1.4, '#fff0b0')), T([[430, 208], [426, 222], [434, 222]], GOLD_D));
    // The bed's frame along its side: lilac velvet with gold piping and buttons, on gold feet.
    out.push(contact(340, 170, BED_FLOOR), R(262, 270, 152, 22, VELVET), F(R(262, 270, 152, 2.4, '#c4b8ff')), R(262, 288, 152, 4, GOLD));
    for (let i = 0; i < 6; i++) out.push(F(E(274 + i * 26, 280, 1.6, 1.6, GOLD)));

    for (const fx of [268, 408]) out.push(T([[fx - 5, 292], [fx + 5, 292], [fx + 3, 300], [fx - 3, 300]], GOLD_D));
    // The footboard, low, with its gold finial.
    out.push(R(404, 238, 14, 54, '#b0a0f2'), F(R(404, 238, 3, 54, '#c8bcff')), E(411, 237, 9, 3.4, GOLD), F(E(408, 236, 4, 1.2, '#fff0b0')));
    // The throne back: an arched back in gold piping, tufted velvet, three puffs of cloud along its
    // top and the gold sprout growing out of them; gold balls at its shoulders.
    out.push(R(228, 178, 46, 122, GOLD), E(251, 178, 23, 23, GOLD), R(231, 180, 40, 120, '#f4eeff'), E(251, 180, 20, 20, '#f4eeff'));
    out.push(F(R(231, 180, 4, 120, WHITE)), F(R(267, 180, 4, 120, '#ddd2f6')));
    out.push(R(237, 184, 28, 84, VELVET), E(251, 184, 14, 14, VELVET), F(R(261, 184, 4, 84, '#9585e0')), F(E(247, 178, 7, 5, '#b9acf5')));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) out.push(F(E(244 + c * 14 + (r % 2) * 7 - 3, 196 + r * 22, 1.6, 1.6, GOLD)));
    out.push(E(236, 160, 9, 8, WHITE), E(266, 160, 9, 8, WHITE), E(251, 152, 12, 10, WHITE), F(E(248, 148, 5, 3, WHITE)));
    out.push(E(228, 178, 4, 4, GOLD), E(274, 178, 4, 4, GOLD), F(E(227, 177, 1.2, 1.2, WHITE)), F(E(273, 177, 1.2, 1.2, WHITE)));
    out.push(...sproutMark(251, 145, 1.6, GOLD));
    out.push(R(226, 266, 50, 6, GOLD), F(R(226, 266, 50, 1.6, '#fff0b0')));
    // The old law, on a gold plaque screwed to the throne back itself: no sleeping (a crossed-out z).
    out.push(R(241, 227, 20, 15, GOLD_D), R(242, 228, 18, 13, GOLD), F(R(242, 228, 18, 1.4, '#fff0b0')));
    out.push(F(R(247, 230.8, 8, 1.3, '#6a4a2a')), F(T([[254.4, 231.8], [255.6, 232], [248.4, 236.6], [247.2, 236.4]], '#6a4a2a')), F(R(247, 235.8, 8, 1.3, '#6a4a2a')));
    out.push(F(T([[244, 239], [245, 239.8], [258.6, 229.6], [257.6, 228.8]], '#e85a6a')));
    // A little stair of three steps up to the head of the bed, for Mochi legs.
    out.push(contact(250, 30, BED_FLOOR));
    for (let k = 0; k < 3; k++) out.push(R(236 + k * 5, 292 - k * 7, 26 - k * 5, 8, '#c88a5a'), F(R(236 + k * 5, 292 - k * 7, 26 - k * 5, 1.4, '#e0b080')), F(R(236 + k * 5, 298 - k * 7, 26 - k * 5, 1.2, '#a86a3a')));
    out.push(F(E(249, 296, 1.6, 1.2, GOLD)));
    // Mochi pillows against the throne back: a pink sakura mochi with its leaf, a green yomogi one,
    // a big white daifuku in front.
    out.push(E(276, 250, 12, 9, '#ffc8dc'), F(E(272, 247, 5, 3, '#ffe0ec')), T([[266, 246], [270, 239], [279, 238], [275, 245]], '#8fcf7a'), F(T([[268, 244], [277, 239], [277.6, 239.6], [268.6, 244.6]], '#6faf5a')));
    out.push(E(294, 254, 10, 8, '#bfe3a8'), F(E(291, 251, 4, 2.4, '#dff2d0')));
    out.push(E(282, 264, 16, 10, WHITE), F(E(278, 260, 6, 3, WHITE)), F(E(286, 270, 10, 3, '#efeafa')));
    out.push(...duvetShapes());

    // A painting of the sacred mochi, round and white on its red cushion, in a gold frame.
    out.push(...frame(538, 86, 40, 32, GOLD_D, '#e8f4ff', [F(R(538, 108, 40, 10, '#d8ecff')), E(558, 110, 12, 3.4, '#d84a5a'), F(E(556, 109, 8, 1.6, '#f07a8a')), E(558, 103, 9, 7, '#ffffff'), F(E(555, 100, 3.4, 2, '#ffffff')), F(E(560, 106, 6, 2.6, '#f2eefa')), ...sproutMark(558, 96.6, 0.7, '#7fcf9a')]));
    // The crown's stand: a slim gold table with a plum velvet cushion and its tassels.
    out.push(contact(500, 30, BED_FLOOR), R(486, 252, 28, 4, GOLD), F(R(486, 252, 28, 1.2, '#fff0b0')));
    for (const lx of [489, 511]) out.push(T([[lx - 1.6, 256], [lx + 1.6, 256], [lx + 2.6, 300], [lx - 2.6, 300]], GOLD_D));
    out.push(T([[492, 270], [508, 270], [508, 272], [492, 272]], GOLD_D));
    out.push(E(500, 248, 19, 6, '#8a5aa8'), F(E(496, 246, 9, 2.4, '#a878c8')));
    for (const tx of [482, 518]) out.push(R(tx - 0.6, 248, 1.2, 6, GOLD), E(tx, 255, 1.8, 2.4, GOLD));
    // The Royal Snore Translator's lectern (Mochi-sized) with an open scroll and an inkpot, and his
    // brass ear trumpet on its stand, its bell turned to the bed.
    out.push(contact(548, 24, BED_FLOOR), R(544, 276, 8, 24, '#a8704a'), R(538, 298, 20, 3, '#8a5a3a'), T([[536, 270], [560, 266], [560, 276], [536, 278]], '#c88a5a'));
    out.push(T([[538, 268], [558, 264], [558, 268], [538, 272]], '#fff8e8'), F(R(541, 268, 14, 0.8, '#b8a890')), E(562, 265, 2.4, 2, '#3a3a5a'), T([[562, 264], [566, 254], [567, 255], [563, 264]], '#ffffff'));
    out.push(R(576, 262, 2, 38, GOLD_D), T([[570, 300], [584, 300], [577, 296]], GOLD_D), T([[577, 262], [568, 252], [556, 246], [556, 260], [568, 258]], GOLD), F(T([[557, 247], [567, 252], [567, 254], [557, 250]], '#fff0b0')), E(557, 253, 2.4, 7, '#a87a2a'));
    // The door out, lilac and gold.
    out.push(...door(608, 44, 110, '#b9a8ef', GOLD, null), ...sproutMark(608, 214, 1.1, GOLD));
    // The big round rug where you stand before the bed.
    out.push(E(320, 352, 214, 22, mix('#a898f0', '#5a4a6a', 0.2)), E(320, 351, 208, 20, '#a898f0'), E(320, 351, 190, 16, GOLD), E(320, 351, 184, 15, '#b9acf5'), E(320, 351, 120, 9, '#c9b8ff'));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      out.push(F(star(320 + Math.cos(a) * 150, 351 + Math.sin(a) * 12, 2.2, GOLD)));
    }
    return out;
  }, false);
}

// The duvet alone, to draw over whoever sits in the bed.
function duvetArt() {
  return art('pr-duvet', 134, 36, () => shift(duvetShapes(), -280, -260), false);
}
export function drawBedCovers(ctx, ox, oy) {
  place(ctx, duvetArt(), ox + 280 + 67, oy + 260 + 36);
}

// The room's life: the candles, the light from the window lying across the floor, the crest's slow
// shimmer.
export function bedchamberLife(ctx, ox, oy, time) {
  glow(ctx, ox + 70, oy + 160, 120, '#fff3d8', 0.35);
  // The morning sun slanting in from the window and lying across the floor, breathing softly.
  ctx.save();
  ctx.globalAlpha = 0.07 + 0.02 * Math.sin(time * 0.6);
  ctx.fillStyle = '#fff6d8';
  for (const [x0, w] of [[30, 30], [72, 22]]) {
    ctx.beginPath();
    ctx.moveTo(ox + x0, oy + 110);
    ctx.lineTo(ox + x0 + w, oy + 110);
    ctx.lineTo(ox + x0 + w + 170, oy + 372);
    ctx.lineTo(ox + x0 + 120, oy + 372);
    ctx.fill();
  }
  ctx.restore();
  glow(ctx, ox + 150, oy + 330, 140, '#fff3d8', 0.22);
  for (const [i, sx] of [186, 466].entries()) flame(ctx, ox + sx, oy + 181, time, i * 1.7);
  glow(ctx, ox + 251, oy + 136, 24, '#ffe9a6', 0.25 + 0.15 * Math.sin(time * 1.4));
}

// ---------- Hayate's flat ----------

const NIGHT_FLOOR = '#5d5470';
const WIN = { x: 236, y: 72, w: 200, h: 154 };

// The kotatsu she works at: a quilt over a low table, and on its board her laptop (its back to us,
// the screen lit toward her), a convenience-store onigiri, her phone lying flat, a stack of
// paperwork, a cold cup of instant noodles with its chopsticks, and the little desk lamp.
function kotatsuShapes() {
  const out = [];
  // The quilt, plaid, hanging to the floor in soft folds.
  const q = [[284, 326], [424, 326], [428, 352], [280, 352]];
  out.push(T(q, '#7a62a8'));
  for (let i = 0; i < 7; i++) out.push(F(R(290 + i * 20, 326, 6, 26, '#8a72b8')));
  for (let j = 0; j < 2; j++) out.push(F(R(284, 334 + j * 10, 142, 3, '#9a82c8')));
  for (let i = 0; i < 6; i++) out.push(F(T([[298 + i * 22, 340], [304 + i * 22, 340], [302 + i * 22, 352], [296 + i * 22, 352]], '#6a5298')));
  out.push(F(T([[280, 350], [428, 350], [428, 352], [280, 352]], '#5a4488')));
  // The board on top.
  out.push(R(290, 320, 128, 6, '#c89a6a'), F(R(290, 320, 128, 1.4, '#e0b88a')), F(R(290, 324, 128, 2, '#a8784a')));
  // The onigiri, half unwrapped, and the phone lying flat.
  out.push(T([[318, 320], [324, 310], [330, 320]], '#ffffff'), F(R(321, 316, 6, 4, '#2a3a3a')), T([[330, 320], [336, 318], [334, 320]], '#e8e8f0'));
  out.push(R(338, 318, 12, 2.4, '#2a2f48'), F(R(339, 318, 10, 0.8, '#4a5070')));
  // The charm on her phone's strap, a little pink star dangling over the board's edge.
  out.push(F(T([[349.6, 319.6], [351.8, 327], [351.2, 327.2], [349, 319.8]], '#e8eaf0')), T([[351.6, 326.6], [352.5, 328.6], [354.6, 328.8], [353, 330.2], [353.6, 332.4], [351.6, 331.2], [349.6, 332.4], [350.2, 330.2], [348.6, 328.8], [350.7, 328.6]], '#ff9ec0'));
  // A stack of manga pushed under the quilt's edge, out of sight. Mostly.
  out.push(R(424, 346, 20, 3.6, '#8fd8ff'), R(425, 342.4, 18, 3.6, '#ff8fb0'), R(424.4, 338.8, 19, 3.6, '#ffe36b'), F(R(424, 346, 20, 0.7, '#ffffff')), F(R(425, 342.4, 18, 0.7, '#ffffff')), F(R(424.4, 338.8, 19, 0.7, '#ffffff')));
  // The laptop: its lid's back to us, the screen's glow on her side, a cute sticker.
  out.push(R(352, 317, 30, 3, '#c8ccd8'), F(R(352, 317, 30, 0.8, '#e8eaf0')));
  out.push(T([[352, 317], [345, 293], [351, 291], [358, 316]], '#8a90a8'), F(T([[351, 316], [344.6, 294], [346.4, 293.4], [352.6, 315.6]], '#bfe4ff')));
  out.push(F(E(352, 304, 1.6, 1.6, '#ff9ec0')), F(E(353.4, 298, 1, 1, '#ffe36b')));
  // The paperwork, one sheet sliding off, and a pen.
  out.push(R(386, 306, 22, 14, '#eef0f8'), F(R(386, 309, 22, 0.8, '#c8ccd8')), F(R(386, 313, 22, 0.8, '#c8ccd8')), F(R(386, 317, 22, 0.8, '#c8ccd8')));
  out.push(T([[384, 305], [406, 300], [408, 303], [386, 308]], '#f6f8ff'), F(T([[389, 305], [402, 302], [402, 303], [389, 306]], '#c8ccd8')), T([[388, 319], [404, 315], [405, 316], [389, 320]], '#e85a6a'));
  // The cold noodle cup and its chopsticks.
  out.push(T([[410, 320], [420, 320], [422, 306], [408, 306]], '#ffffff'), F(R(408.6, 310, 13, 3, '#e85a6a')), E(415, 306, 7, 1.6, '#e8d8b0'));
  out.push(T([[417, 306], [428, 290], [429, 291], [418, 306]], '#c89a6a'), T([[419, 306], [431, 292], [432, 293], [420, 306]], '#c89a6a'));
  // The desk lamp, its head bowed over the papers.
  out.push(E(430, 319, 7, 2, '#6a6f8e'), R(429, 296, 2, 23, '#8a90ae'), T([[430, 296], [420, 290], [421, 288], [431, 294]], '#8a90ae'), T([[424, 286], [412, 292], [418, 298], [426, 292]], '#ffd98a'), F(T([[414, 292], [418, 297], [420, 296]], '#fff3c0')));
  return out;
}

export function flatArt() {
  return art('pr-flat', 640, 480, () => {
    const out = [R(0, 0, 640, 300, '#3d4670')];
    // A plain papered wall with a faint stripe, the ceiling and its light (switched off).
    for (let x = 6; x < 640; x += 18) out.push(F(R(x, 48, 6, 252, '#424c78')));
    out.push(R(0, 0, 640, 44, '#262b47'), ...cornice('#323a5e', 40, 8), ...skirting('#2a3052'));
    out.push(E(320, 46, 34, 5, '#5a6088'), F(E(320, 45, 30, 3, '#6a7098')));
    out.push(...planks(0, 300, 640, 180, ramp(NIGHT_FLOOR, 0.8), 16, 9), ...floorShade(NIGHT_FLOOR));

    // The front door, its peephole and chain; the genkan's tiles and a jumble of shoes; the umbrella
    // drying against the wall in its own little puddle.
    out.push(R(18, 166, 52, 134, '#4a5070'), R(22, 170, 44, 130, '#5b6385'), F(R(22, 170, 3, 130, '#6f78a0')));
    out.push(E(44, 204, 2.2, 2.2, '#2a2f48'), F(E(43.4, 203.4, 0.8, 0.8, '#bfe4ff')), R(56, 236, 9, 3, '#c8ccd8'), E(57, 237.5, 2.4, 2.4, '#c8ccd8'));
    // Her work lanyard on the hook by the door, the ID card hanging off it.
    out.push(R(42, 140, 6, 3, '#8a90ae'), T([[44, 142], [38, 168], [40, 168], [45, 145]], '#5a8ad8'), T([[46, 142], [50, 168], [48, 168], [45, 145]], '#5a8ad8'));
    out.push(R(37, 167, 14, 18, '#eef0f8'), F(R(37, 167, 14, 4, '#5a8ad8')), F(E(44, 177, 3, 3, '#c8ccd8')), F(R(39, 182, 10, 1, '#8a90ae')));
    out.push(R(0, 300, 90, 14, '#4a4a60'));
    for (let x = 0; x < 90; x += 15) out.push(F(R(x, 300, 0.8, 14, '#3a3a50')));
    out.push(T([[12, 312], [30, 312], [32, 306], [22, 304], [14, 306]], '#e8eaf0'), F(R(12, 310, 20, 2, '#e85a6a')), T([[34, 314], [50, 312], [52, 316], [36, 318]], '#8a90ae'), T([[56, 312], [72, 312], [72, 307], [64, 305], [58, 307]], '#c88a5a'));
    out.push(T([[80, 300], [88, 226], [90, 226], [82, 300]], '#2e3458'), T([[88, 228], [92, 230], [86, 280], [83, 278]], '#c85a6a'), F(T([[89, 232], [90, 233], [85, 276], [84, 275]], '#e88a9a')), R(86.4, 220, 3, 7, '#2e3458'), E(81, 302, 9, 2, '#6a78b0'), F(E(79, 301.4, 4, 0.8, '#9fb0e0')));

    // The kitchenette: the fridge with its magnets and a tower of instant noodle cups on top, the
    // counter with the sink, a dish rack holding one plate and one cup, the kettle on its hob, the
    // cupboard over it all.
    out.push(contact(114, 40, NIGHT_FLOOR), R(96, 196, 38, 104, '#a8aec8'), F(R(96, 196, 3, 104, '#c8cce0')), F(R(96, 236, 38, 1.4, '#8a90ae')), R(128, 210, 2, 18, '#8a90ae'), R(128, 244, 2, 24, '#8a90ae'));
    out.push(F(E(106, 218, 2.4, 2.4, '#ff9ec0')), F(E(116, 252, 2.4, 2.4, '#7fcf9a')), F(R(104, 256, 10, 10, '#ffe36b')), F(R(105, 259, 8, 0.8, '#b8a040')), F(R(105, 262, 6, 0.8, '#b8a040')));
    for (let k = 0; k < 4; k++) {
      const y = 196 - k * 9 - (k > 2 ? 0 : 0);
      const x = 104 + (k % 2) * 4 + (k === 3 ? 8 : 0);
      out.push(T([[x, y], [x + 12, y], [x + 13, y - 9], [x - 1, y - 9]], '#ffffff'), F(R(x - 0.4, y - 6, 12.8, 2.4, k % 2 ? '#e8a040' : '#e85a6a')), F(R(x - 1, y - 9.6, 14, 1.4, '#e8d8b0')));
    }
    out.push(R(136, 244, 88, 56, '#6a6f8e'), F(R(178, 248, 1, 48, '#5a5f7e')), E(172, 270, 1.6, 1.6, '#c8ccd8'), E(184, 270, 1.6, 1.6, '#c8ccd8'));
    out.push(R(132, 238, 96, 7, '#9aa0bc'), F(R(132, 238, 96, 1.4, '#c8cce0')), R(150, 240, 28, 4, '#3a3f5e'), R(160, 224, 2, 14, '#c8ccd8'), R(160, 224, 8, 2, '#c8ccd8'));
    out.push(R(181, 230, 14, 8, '#8a90ae'), T([[184, 230], [187, 219], [188, 219], [186, 230]], '#e8eaf0'), E(190, 233, 2.6, 2.6, '#ff9ec0'), F(E(190, 233, 1.2, 1.2, '#3a3f5e')));
    out.push(R(200, 234, 22, 4, '#2a2f48'), E(211, 228, 8, 6, '#c8ccd8'), F(E(208, 225, 3, 2, '#e8eaf0')), T([[218, 228], [225, 223], [224, 226], [218, 230]], '#c8ccd8'), R(207, 220, 8, 2, '#8a90ae'));
    // Her mug, with cat ears.
    out.push(R(138.6, 229, 8, 9, '#ffb3cf'), F(R(138.6, 229, 2, 9, '#ffd0e0')), T([[138.6, 229], [139.6, 226], [141.4, 229]], '#ffb3cf'), T([[143.8, 229], [145.6, 226], [146.6, 229]], '#ffb3cf'), E(147.6, 233, 1.8, 2.2, '#e898b8'), E(147.6, 233, 0.9, 1.3, '#5f6585'), F(E(141.4, 233, 0.6, 0.4, '#5a4a6a')), F(E(144.2, 233, 0.6, 0.4, '#5a4a6a')));
    out.push(R(136, 120, 88, 52, '#5f6585'), F(R(136, 120, 88, 1.4, '#7a80a0')), F(R(179, 122, 1, 48, '#4a5070')), R(172, 160, 4, 1.6, '#c8ccd8'), R(184, 160, 4, 1.6, '#c8ccd8'));

    // The big window onto the city at night: towers with their lit windows, a viaduct the late train
    // crosses, a tall tower with a red light (both alive: flatLife). The rain is on the far side of
    // the glass.
    const { x: wx, y: wy, w: ww, h: wh } = WIN;
    out.push(R(wx - 6, wy - 6, ww + 12, wh + 12, '#7a80a0'));
    out.push(R(wx, wy, ww, wh, '#1c2140'), F(R(wx, wy + wh * 0.55, ww, wh * 0.45, '#262b52')), F(R(wx, wy + wh * 0.8, ww, wh * 0.2, '#343a6a')));
    for (const [bx, bw, bh, c] of [[0, 30, 70, '#232846'], [26, 22, 96, '#2a2f52'], [46, 40, 58, '#232846'], [84, 26, 112, '#2e3458'], [108, 34, 76, '#232846'], [140, 20, 124, '#2a2f52'], [158, 42, 64, '#232846']]) {
      const top = wy + wh - bh;
      out.push(F(R(wx + bx, top, bw, bh, c)));
      for (let r = 0; r < bh / 9 - 1; r++) for (let k = 0; k < bw / 7 - 1; k++) {
        const v = hash(bx * 3.1 + r * 7.3 + k * 1.7);
        if (v > 0.55) out.push(F(R(wx + bx + 3 + k * 7, top + 5 + r * 9, 3, 4, v > 0.85 ? '#a8d8ff' : '#ffd98a')));
      }
    }
    out.push(F(R(wx, wy + 128, ww, 6, '#181c34')), ...[0, 1, 2, 3, 4].map((k) => F(R(wx + 10 + k * 44, wy + 134, 4, 20, '#181c34'))));
    out.push(R(wx + ww / 2 - 2, wy, 4, wh, '#7a80a0'), F(T([[wx + 14, wy + wh - 6], [wx + 40, wy + 6], [wx + 46, wy + 6], [wx + 20, wy + wh - 6]], '#262c50')));
    out.push(R(wx - 12, wy + wh + 2, ww + 24, 8, '#8a90ae'), F(R(wx - 12, wy + wh + 2, ww + 24, 1.4, '#a8aec8')));
    out.push(...curtains(wx, wy, ww, wh, '#58608a'));

    // Her futon on the floor under the shelf: a rumpled quilt, the pillow, and on it a round white
    // plush with a little green leaf on its head.
    out.push(contact(514, 110, NIGHT_FLOOR), R(462, 290, 112, 10, '#d8dcf0'), T([[478, 292], [500, 280], [536, 284], [566, 278], [576, 292]], '#8fa8e0'), F(T([[500, 282], [536, 286], [560, 281], [560, 284], [536, 289], [500, 285]], '#a8bcf0')));
    out.push(E(470, 287, 14, 6, '#f2f2fa'), E(472, 278, 9, 8, '#ffffff'), F(E(469, 275, 3, 2, '#ffffff')), F(E(468, 281, 1.6, 1, '#ffb3cf')), F(E(476, 281, 1.6, 1, '#ffb3cf')));
    out.push(T([[472, 270], [470, 266], [466, 265], [468, 268]], '#7fcf9a'), T([[472, 270], [475, 265], [479, 265], [476, 269]], '#7fcf9a'));
    // The calendar with every day crossed out, the clock (its hands: flatLife), the shelf with a
    // little cactus and a photo of a beach.
    out.push(R(478, 104, 44, 54, '#eef0f8'), R(478, 104, 44, 10, '#e85a6a'), F(R(478, 104, 44, 1.4, '#ff8a9a')));
    for (let r = 0; r < 5; r++) for (let c = 0; c < 6; c++) {
      const cx = 482 + c * 6.6, cy = 118 + r * 7.4;
      if (r * 6 + c < 26) out.push(F(T([[cx, cy], [cx + 4, cy + 4], [cx + 4.6, cy + 3.4], [cx + 0.6, cy - 0.6]], '#8a90ae')), F(T([[cx + 4, cy], [cx, cy + 4], [cx + 0.6, cy + 4.6], [cx + 4.6, cy + 0.6]], '#8a90ae')));
      else if (r * 6 + c === 26) out.push(F(E(cx + 2, cy + 2, 3.4, 3, '#e85a6a')), F(E(cx + 2, cy + 2, 2.4, 2, '#eef0f8')));
    }
    out.push(E(552, 92, 15, 15, '#8a90ae'), E(552, 92, 13, 13, '#e8eaf0'));
    for (let i = 0; i < 12; i++) out.push(F(R(552 + Math.cos((i / 12) * TAU) * 10.5 - 0.6, 92 + Math.sin((i / 12) * TAU) * 10.5 - 0.6, 1.2, 1.2, '#5a5f7e')));
    out.push(...shelf(470, 196, 96, '#6a6f8e'), ...plant(486, 196, '#c88a5a', '#7fcf9a', 0.55, 3));
    out.push(...frame(524, 170, 24, 20, '#c8ccd8', '#9fd8ff', [F(R(524, 182, 24, 8, '#ffe8b0')), F(E(542, 175, 3, 3, '#fff3b0')), F(T([[526, 182], [534, 178], [546, 182]], '#8fd8f0'))]));
    // The closet, its near door slid back a crack, and inside it her secret: shelves of manga in
    // every colour, little figures on their stands, a plush, a pink light stick, fairy lights along
    // the top (they twinkle: flatLife). Then the doors.
    out.push(R(578, 118, 26, 182, '#2a2440'), F(R(578, 118, 26, 4, '#3a3258')));
    for (const y of [162, 206, 250]) out.push(R(578, y, 26, 3, '#6a5a8a'), F(R(578, y, 26, 0.8, '#8a7aaa')));
    for (let i = 0; i < 9; i++) {
      const c = ['#ff8fb0', '#8fd8ff', '#ffe36b', '#c9a6ff', '#7fcf9a', '#ff9a6a'][i % 6];
      const h = 13 + (i % 3) * 2;
      out.push(R(579 + i * 2.6, 162 - h, 2.4, h, c), F(R(579 + i * 2.6, 162 - h + 2, 2.4, 0.6, '#ffffff')));
    }
    for (const [fx, hair, coat] of [[583, '#ff8fb0', '#8fd8ff'], [591, '#ffe36b', '#c9a6ff'], [599, '#8fd8ff', '#ff8fb0']]) {
      out.push(E(fx, 205, 3, 1, '#e8eaf0'), T([[fx - 2, 205], [fx + 2, 205], [fx + 1.4, 198], [fx - 1.4, 198]], coat), E(fx, 195.4, 2.6, 2.6, '#ffe8d8'), E(fx, 194.2, 2.9, 2, hair), T([[fx - 2.9, 194.4], [fx - 3.6, 199], [fx - 1.6, 196]], hair), T([[fx + 2.9, 194.4], [fx + 3.6, 199], [fx + 1.6, 196]], hair));
    }
    out.push(E(586, 246, 6, 4.4, '#ffffff'), E(586, 241, 4.6, 4.2, '#ffffff'), F(E(584, 241, 0.8, 0.5, '#ffb3cf')), F(E(588.6, 241, 0.8, 0.5, '#ffb3cf')), T([[585, 236.6], [583, 233.6], [586, 235.4]], '#7fcf9a'));
    out.push(T([[594, 249], [600, 228], [602, 229], [596, 249]], '#ff8fd8'), F(T([[595, 248], [600.6, 229.4], [601.2, 229.6], [595.8, 248.2]], '#ffffff')), R(593, 246, 4, 4, '#4a4468'));
    for (let i = 0; i < 4; i++) out.push(R(579, 296 - i * 4, 22 - i * 2, 3.6, ['#ff8fb0', '#8fd8ff', '#ffe36b', '#c9a6ff'][i]), F(R(579, 296 - i * 4, 22 - i * 2, 0.7, '#ffffff')));
    out.push(R(600, 118, 38, 182, '#4d5578'), F(R(600, 118, 38, 1.4, '#6a72a0')), R(600, 118, 3, 182, '#3d4568'), R(618, 118, 2, 182, '#3d4568'), R(605, 206, 3, 14, '#8a90ae'), R(626, 206, 3, 14, '#8a90ae'));
    // A little round rug under the kotatsu.
    out.push(E(354, 352, 116, 14, '#4a4468'), E(354, 351, 110, 12, '#6a5a8a'), E(354, 351, 96, 9, '#7a6a9a'));
    out.push(...kotatsuShapes());
    return out;
  }, false);
}

// The kotatsu alone, to draw over whoever sits at it.
function kotatsuArt() {
  return art('pr-kotatsu', 160, 72, () => shift(kotatsuShapes(), -278, -284), false);
}
export function drawKotatsuCovers(ctx, ox, oy) {
  place(ctx, kotatsuArt(), ox + 278 + 80, oy + 284 + 72);
}

// The flat's life: rain running down the far side of the glass, the tower's red light, a late
// train across the viaduct now and then, the laptop's cold glow and the lamp's warm one, the
// clock's second hand. (Its hands stand at 2:07.)
export function flatLife(ctx, ox, oy, time, cues = {}) {
  const { x, y, w, h } = WIN;
  ctx.save();
  ctx.beginPath();
  ctx.rect(ox + x, oy + y, w, h);
  ctx.clip();
  // The late train, every eighteen seconds or so.
  const tr = (time % 18) / 6;
  if (tr < 1) {
    const tx = ox + x - 120 + tr * (w + 240);
    ctx.fillStyle = '#181c34';
    ctx.fillRect(tx, oy + y + 120, 110, 8);
    ctx.fillStyle = '#ffe9a6';
    for (let k = 0; k < 9; k++) ctx.fillRect(tx + 4 + k * 12, oy + y + 122, 7, 3);
  }
  // The tower's red light.
  const blink = (time % 2.4) < 1.2 ? 1 : 0.25;
  glow(ctx, ox + x + 150, oy + y + 30, 10, '#ff5a5a', 0.7 * blink);
  ctx.fillStyle = blink > 0.5 ? '#ff7a7a' : '#8a3a4a';
  ctx.fillRect(ox + x + 149, oy + y + 29, 2, 2);
  // The rain: thin streaks falling, and drops sliding down the glass.
  ctx.strokeStyle = 'rgba(190,210,255,0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 40; i++) {
    const sx = x + hash(i * 2.3) * w;
    const sy = y + ((time * 260 + hash(i * 5.1) * 400) % (h + 30)) - 20;
    ctx.moveTo(ox + sx, oy + sy);
    ctx.lineTo(ox + sx - 3, oy + sy + 12);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(210,225,255,0.5)';
  for (let i = 0; i < 14; i++) {
    const sx = x + 6 + hash(i * 7.7) * (w - 12);
    const sy = y + ((time * (8 + hash(i) * 14) + hash(i * 3.9) * h) % h);
    ctx.beginPath();
    ctx.ellipse(ox + sx, oy + sy, 1, 1.6, 0, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
  // The city's light through the window, lying cold across the floor, and her secret's fairy lights
  // twinkling in the closet's crack.
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = '#9fb8ff';
  ctx.beginPath();
  ctx.moveTo(ox + 236, oy + 304);
  ctx.lineTo(ox + 436, oy + 304);
  ctx.lineTo(ox + 476, oy + 372);
  ctx.lineTo(ox + 214, oy + 372);
  ctx.fill();
  ctx.restore();
  for (let i = 0; i < 6; i++) {
    const tw = 0.5 + 0.5 * Math.sin(time * 2.3 + i * 1.9);
    const c = ['#ffb3df', '#ffe9a6', '#b3e4ff'][i % 3];
    glow(ctx, ox + 580 + i * 4.4, oy + 124 + (i % 2) * 2, 6, c, 0.5 * tw + 0.2);
    ctx.fillStyle = c;
    ctx.fillRect(ox + 579.6 + i * 4.4, oy + 123.6 + (i % 2) * 2, 1, 1);
  }
  glow(ctx, ox + 591, oy + 210, 40, '#ff9ed8', 0.12);
  // The laptop's glow on her side, flickering as the screen changes, and the lamp's warm pool.
  const flick = 0.85 + 0.15 * Math.sin(time * 3.1) * Math.sin(time * 1.7);
  glow(ctx, ox + 336, oy + 300, 40, '#a8d8ff', 0.24 * flick);
  // (Her lamp stutters as the strange breeze comes in: the scene's 'lamp' cue.)
  const stutter = cues.lamp === 'flicker' ? (Math.sin(time * 37) > 0.3 ? 0.35 : 1) * (0.7 + 0.3 * Math.sin(time * 13)) : 1;
  glow(ctx, ox + 404, oy + 314, 56, '#ffd98a', 0.3 * stutter);
  // The clock: 2:07, its second hand ticking round.
  const cx = ox + 552, cy = oy + 92;
  const hand = (a, len, wdt, c) => {
    ctx.strokeStyle = c;
    ctx.lineWidth = wdt;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.sin(a) * len, cy - Math.cos(a) * len);
    ctx.stroke();
  };
  hand(((2 + 7 / 60) / 12) * TAU, 6, 1.6, '#3a3f5e');
  hand((7 / 60) * TAU, 9, 1.2, '#3a3f5e');
  hand((Math.floor(time) / 60) * TAU, 10, 0.6, '#e85a6a');
}

// Her phone, lying on the kotatsu, when it buzzes (the scene's 'phone' cue): it shivers on the
// board, its screen lights up with the battery all but empty, and a soft glow spills round it.
// Drawn over the kotatsu's covers (render/cast.js).
export function drawFlatCues(ctx, ox, oy, time, cues = {}) {
  if (cues.phone !== 'buzz') return;
  const jit = Math.sin(time * 70) * 0.6 * (Math.sin(time * 6) > -0.2 ? 1 : 0);
  const x = ox + 338 + jit;
  const y = oy + 318;
  glow(ctx, x + 6, y, 18, '#bfe4ff', 0.5);
  ctx.fillStyle = '#2a2f48';
  ctx.fillRect(x, y, 12, 2.4);
  ctx.fillStyle = '#d8f0ff';
  ctx.fillRect(x + 1, y, 10, 1.2);
  // The battery, a sliver of red, floating just over it where the camera can read it.
  ctx.fillStyle = '#eef0f8';
  ctx.fillRect(x + 2, y - 9, 8, 4);
  ctx.fillRect(x + 10, y - 8, 1, 2);
  ctx.fillStyle = '#e85a6a';
  ctx.fillRect(x + 2.6, y - 8.4, 1, 2.8);
  ctx.strokeStyle = 'rgba(191,228,255,0.7)';
  ctx.lineWidth = 0.8;
  for (const sd of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + 6 + sd * 9, y - 1, 3 + Math.abs(Math.sin(time * 9)) * 1.5, sd > 0 ? -0.9 : Math.PI - 0.9, sd > 0 ? 0.9 : Math.PI + 0.9);
    ctx.stroke();
  }
}

// ---------- Festival night in the bedchamber ----------

// The bedchamber's window at night (the scene's 'night' cue): a deep sky full of stars over the
// village, the Falling Star Festival's lanterns strung across its roofs, swaying, and (the 'star'
// cue) a star falling across it - with a ring of sound under it, for those who notice.
export function bedchamberNightWindow(ctx, ox, oy, time, cues = {}) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(ox + 66, oy + 104, 40, Math.PI, 0);
  ctx.rect(ox + 26, oy + 104, 80, 124);
  ctx.clip();
  const g = ctx.createLinearGradient(0, oy + 64, 0, oy + 228);
  g.addColorStop(0, '#141838');
  g.addColorStop(0.7, '#2a2a5a');
  g.addColorStop(1, '#4a3a6a');
  ctx.fillStyle = g;
  ctx.fillRect(ox + 26, oy + 60, 80, 170);
  for (let i = 0; i < 26; i++) {
    const tw = 0.5 + 0.5 * Math.sin(time * 2 + i * 2.3);
    ctx.fillStyle = `rgba(255,255,240,${0.4 + tw * 0.6})`;
    ctx.fillRect(ox + 28 + hash(i * 3.7) * 76, oy + 68 + hash(i * 5.3) * 110, 1, 1);
  }
  // The roofs and the windmill, dark against it, their windows lit for the festival.
  ctx.fillStyle = '#231f3e';
  ctx.beginPath();
  ctx.moveTo(ox + 26, oy + 228);
  for (const [x, y] of [[26, 212], [40, 206], [52, 212], [64, 204], [78, 212], [92, 206], [106, 212], [106, 228]]) ctx.lineTo(ox + x, oy + y);
  ctx.fill();
  ctx.fillRect(ox + 86, oy + 194, 6, 18);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = i % 2 ? '#ffd27a' : '#ffb36a';
    ctx.fillRect(ox + 30 + i * 11, oy + 216 + (i % 2) * 3, 2, 2);
  }
  // The lanterns, two strings of them, swaying.
  const cols = ['#ff8fb0', '#ffd27a', '#8fd8ff', '#c9a6ff'];
  for (const [y0, n] of [[176, 7], [192, 6]]) {
    for (let i = 0; i < n; i++) {
      const x = ox + 30 + i * (76 / (n - 1));
      const sag = Math.sin((i / (n - 1)) * Math.PI) * 6 + Math.sin(time * 1.4 + i) * 0.8;
      glow(ctx, x, oy + y0 + sag, 7, cols[i % 4], 0.6);
      ctx.fillStyle = cols[i % 4];
      ctx.fillRect(x - 1.2, oy + y0 + sag - 1.6, 2.4, 3.2);
    }
  }
  // The falling star.
  if (cues.star && cues.starAt != null) {
    const u = (performance.now() / 1000 - cues.starAt) / 1.4;
    if (u >= 0 && u < 1) {
      const sx = ox + 100 - u * 80;
      const sy = oy + 76 + u * 70;
      ctx.strokeStyle = 'rgba(255,248,220,0.8)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 16, sy - 14);
      ctx.stroke();
      glow(ctx, sx, sy, 9, '#fff3c0', 0.9);
    }
  }
  ctx.restore();
}

// Night falls over the whole room (drawn over everyone in it: render/cast.js): a deep blue hush,
// the candles still warm, the window's glow lying on the floor.
export function bedchamberNight(ctx, ox, oy, w, h, time) {
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = '#5c5c9c';
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [i, sx] of [186, 466].entries()) glow(ctx, ox + sx, oy + 180, 70, '#ffb04a', 0.16 + 0.03 * Math.sin(time * 9 + i));
  glow(ctx, ox + 70, oy + 170, 70, '#6a7ad8', 0.12);
  ctx.restore();
}

// ---------- The sea at night ----------

// Out on the open sea at night: a deep sky, a big moon and its path across the water, Windbag
// Island a far dark shape on the horizon with one light on it, and the sea itself, its swells
// rolling (seaLife). Your little boat bobs on it (render/cast.js).
export function seaArt() {
  return art('pr-sea', 640, 480, () => {
    const out = [R(0, 0, 640, 480, '#141838')];
    out.push(F(R(0, 120, 640, 80, '#1c2248')), F(R(0, 180, 640, 60, '#262a58')), F(R(0, 230, 640, 40, '#33306a')));
    for (let i = 0; i < 80; i++) out.push(F(R(hash(i * 1.7) * 640, hash(i * 3.1) * 230, i % 9 ? 1 : 2, i % 9 ? 1 : 2, i % 5 ? '#e8ecff' : '#fff3c0')));
    // The moon.
    out.push(E(180, 96, 30, 30, '#fff6dc'), F(E(172, 88, 8, 6, '#f2e8c8')), F(E(192, 104, 6, 5, '#f2e8c8')), F(E(184, 84, 3, 3, '#f2e8c8')));
    // The island on the horizon, and its one lit window.
    out.push(F(T([[470, 262], [500, 248], [530, 236], [552, 240], [576, 252], [612, 262]], '#1c1a38')), F(R(540, 226, 3, 12, '#1c1a38')), F(R(548, 246, 2, 2, '#ffd27a')));
    // The sea.
    out.push(R(0, 262, 640, 218, '#1e2a5a'), F(R(0, 262, 640, 2, '#3a4a8a')));
    for (let i = 0; i < 9; i++) out.push(F(R(0, 274 + i * 20, 640, 10, i % 2 ? '#22306a' : '#1a2650')));
    return out;
  }, false);
}
// The sea's life: the moon's path shimmering across the water, the swells rolling by.
export function seaLife(ctx, ox, oy, time) {
  glow(ctx, ox + 180, oy + 96, 90, '#fff3c0', 0.18);
  for (let i = 0; i < 18; i++) {
    const y = oy + 268 + i * 6;
    const w = 6 + i * 2.2;
    const x = ox + 180 + Math.sin(time * 1.6 + i * 1.3) * (3 + i * 0.6) - w / 2;
    ctx.fillStyle = `rgba(255,243,200,${0.55 - i * 0.025})`;
    ctx.fillRect(x, y, w, 1.2);
  }
  ctx.strokeStyle = 'rgba(150,170,240,0.35)';
  ctx.lineWidth = 1;
  for (let r = 0; r < 7; r++) {
    const y = oy + 284 + r * 26;
    ctx.beginPath();
    for (let x = -20; x <= 660; x += 10) {
      const yy = y + Math.sin((x + time * (18 + r * 4)) * 0.035 + r) * (1.5 + r * 0.4);
      if (x === -20) ctx.moveTo(ox + x, yy);
      else ctx.lineTo(ox + x, yy);
    }
    ctx.stroke();
  }
}

// Your little boat, in two parts so you can sit in it: the mast and sail behind you, the hull in
// front of you. (x, y) is where your feet would be, sitting in it; it rocks on the swell (`rock`,
// radians) and its sail fills and glows once the gust has found it (`full`, 0 to 1).
export function drawBoatBack(ctx, x, y, rock, full, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rock);
  ctx.fillStyle = '#6a4a32';
  ctx.fillRect(-9, -70, 2.4, 58);
  // The sail: flat and slack, or bellied out by the gust.
  const belly = full * 10 + Math.sin(time * 3) * full * 1.2;
  ctx.fillStyle = full > 0.5 ? '#fffaf0' : '#e8e2d4';
  ctx.beginPath();
  ctx.moveTo(-7, -68);
  ctx.quadraticCurveTo(10 + belly, -44, -7, -20);
  ctx.lineTo(24 + belly * 0.6, -20);
  ctx.quadraticCurveTo(14 + belly, -40, -7, -68);
  ctx.fill();
  ctx.strokeStyle = '#8a7a64';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  if (full > 0) glow(ctx, 6 + belly, -42, 26, '#cfe8ff', 0.35 * full);
  ctx.fillStyle = '#6a4a32';
  ctx.fillRect(-9, -21, 36, 1.8);
  // The far side of the hull, inside.
  ctx.fillStyle = '#5a3a26';
  ctx.beginPath();
  ctx.moveTo(-40, -16);
  ctx.lineTo(34, -16);
  ctx.lineTo(30, -12);
  ctx.lineTo(-36, -12);
  ctx.fill();
  ctx.restore();
}
export function drawBoatFront(ctx, x, y, rock, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rock);
  ctx.fillStyle = '#8a5a3a';
  ctx.strokeStyle = '#3a2418';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-42, -15);
  ctx.lineTo(36, -15);
  ctx.quadraticCurveTo(32, -2, 24, 2);
  ctx.lineTo(-32, 2);
  ctx.quadraticCurveTo(-40, -4, -42, -15);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#a8704a';
  ctx.fillRect(-41, -15, 77, 2.2);
  ctx.fillStyle = '#6a4228';
  for (const yy of [-9, -4]) ctx.fillRect(-36, yy, 66, 0.8);
  ctx.restore();
  // Foam lapping at the waterline.
  ctx.fillStyle = 'rgba(220,232,255,0.55)';
  for (let i = 0; i < 6; i++) {
    const fx = x - 40 + i * 15 + Math.sin(time * 2 + i) * 2;
    ctx.fillRect(fx, y + 2 + Math.sin(time * 3 + i * 2) * 0.8, 7, 1);
  }
}

// ---------- Drawing ----------

// Draws a prologue room (a town piece `pr_*` at the room's centre); returns false for anything else.
export function drawProloguePiece(ctx, map, kind, wx, extra, cam, width, time) {
  if (kind !== 'pr_flat' && kind !== 'pr_bedchamber' && kind !== 'pr_sea') return false;
  const x = wx - cam.x;
  const ox = x - 320;
  const oy = -cam.y;
  if (kind === 'pr_flat') {
    place(ctx, flatArt(), x, 480 - cam.y);
    flatLife(ctx, ox, oy, time, map.cine?.flags);
  } else if (kind === 'pr_sea') {
    place(ctx, seaArt(), x, 480 - cam.y);
    seaLife(ctx, ox, oy, time);
  } else {
    place(ctx, bedchamberArt(), x, 480 - cam.y);
    const cues = map.cine?.flags ?? {};
    if (cues.night) {
      // (At night only the candles: no sun through the window.)
      bedchamberNightWindow(ctx, ox, oy, time, cues);
      for (const [i, sx] of [186, 466].entries()) flame(ctx, ox + sx, oy + 181, time, i * 1.7);
    } else bedchamberLife(ctx, ox, oy, time);
    // Visiting her (not in a scene): the Queen asleep in her bed, and the Royal Snore Translator, who
    // got stuck in the curtains on festival night and never blew away, keeping watch at his lectern.
    if (!map.cine && !map.castOn) {
      drawHayate(ctx, ox + QUEEN_BED.x, oy + QUEEN_BED.y, time, { s: 1 });
      drawBedCovers(ctx, ox, oy);
      TRANSLATOR.genes ??= Object.assign(rollMochi(33), { wear: { dress: 'scholarrobe', hat: 'scholarcap', eyes: 'specs', over: 'eartrumpet' } });
      drawMochiAnim(ctx, TRANSLATOR, ox + 548, oy + 302, time);
      // The elders who've come home: Elder Yomogi, back from the Hollow (Chapter 3).
      if (map.elders?.yomogi) {
        YOMOGI.genes ??= Object.assign(rollMochi(41, { dough: '#d8efc0', hairColor: 'yomogi' }), { wear: { dress: 'elderrobe', hat: 'elderhat', eyes: 'monocle', face: 'fakebeard' } });
        drawMochiAnim(ctx, YOMOGI, ox + 610, oy + 302, time + 1.3);
      }
      // ...and Elder Sakura, home from Lady Marigold's party (Chapter 4).
      if (map.elders?.sakura) {
        SAKURA_HOME.genes ??= Object.assign(rollMochi(SAKURA.seed, SAKURA.genes), { wear: { ...SAKURA.wear } });
        drawMochiAnim(ctx, SAKURA_HOME, ox + 452, oy + 302, time + 2.6);
      }
      // ...and Elder Warabi, out of Queen Coralie's tank (Chapter 5), by the little door she came in at.
      if (map.elders?.warabi) {
        WARABI_HOME.genes ??= Object.assign(rollMochi(WARABI.seed, WARABI.genes), { wear: { ...WARABI.wear } });
        drawMochiAnim(ctx, WARABI_HOME, ox + 188, oy + 302, time + 3.4);
      }
      // ...and Elder Kuri, home from Queen Gearheart's show (Chapter 6), at the foot of the bed,
      // watching over her.
      if (map.elders?.kuri) {
        KURI_HOME.genes ??= Object.assign(rollMochi(KURI.seed, KURI.genes), { wear: { ...KURI.wear } });
        drawMochiAnim(ctx, KURI_HOME, ox + 252, oy + 302, time + 4.2);
      }
      // ...and Elder Goma, home from counting the stars with Astraea (Chapter 7), by the window.
      if (map.elders?.goma) {
        GOMA_HOME.genes ??= Object.assign(rollMochi(GOMA.seed, GOMA.genes), { wear: { ...GOMA.wear } });
        drawMochiAnim(ctx, GOMA_HOME, ox + 112, oy + 302, time + 5.1);
      }
      // ...and Elder Ichigo, home from the Candy Volcano (Chapter 8), by the Translator's lectern,
      // keeping an eye out for seconds.
      if (map.elders?.ichigo) {
        ICHIGO_HOME.genes ??= Object.assign(rollMochi(ICHIGO.seed, ICHIGO.genes), { wear: { ...ICHIGO.wear } });
        drawMochiAnim(ctx, ICHIGO_HOME, ox + 500, oy + 302, time + 6.3);
      }
    }
  }
  return true;
}
const TRANSLATOR = { genes: null, dir: -1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround'] };
const YOMOGI = { genes: null, dir: -1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround'] };
const SAKURA_HOME = { genes: null, dir: -1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround'] };
const KURI_HOME = { genes: null, dir: 1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround'] };
const ICHIGO_HOME = { genes: null, dir: -1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround'] };
const GOMA_HOME = { genes: null, dir: -1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround'] };
const WARABI_HOME = { genes: null, dir: 1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround'] };
