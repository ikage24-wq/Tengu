// Madame Velvet's end of the Endless Hallway (2026-11-28, remade with her: the player: "remake their
// boss rooms also with matching art and effects"). Where the long corridor of the hallway ends, its
// striped paper gives way to her own domain, the housekeeper's hall: plum damask over dark panelled
// wainscot, a tall arched window of moonlight between velvet drapes (she stands before it), the
// hostess's portrait in a gilt oval over the sideboard and its silver tea service, the HOUSE RULES on
// the wall, the board where every key of the manor hangs, a plate shelf over the grandfather clock, a
// linen press stacked with folded sheets. Painted once with the bosses' fine painting kit
// (render/bossart/kit.js) in world units; the candle flames, the clock's pendulum, the moonbeams and
// the dust drifting in them are drawn live each frame.
//   drawVelvetHall   behind the floor and ledges (scenery.js BEHIND_GROUND, hooked in by render/manor.js)
//   drawVelvetLedge  her ledges' own looks (terrain.js: a platform's style 'vvSideboard', 'vvShelf',
//                    'vvPress'): the furniture whose tops you stand on
import { TAU, lerp, clamp, cr, poly, smooth, ell, ribbon, swell, rgba, mixHex, lin, rad, star4, piece, drawPiece } from '../bossart/kit.js';

// Where her hall starts along the hallway (world x), and the floor.
export const VV_HALL = { x0: 2930, x1: 3600 };
const G = 380;
const OUT = '#2e1c3a';
const WALL = { dk: '#2e1c40', base: '#4a2e62', lt: '#5e3c7a', motif: '#8a66aa' };
const WOOD = { dk: '#2e1a26', base: '#4a2a3a', lt: '#6a4054', hi: '#8e5c72' };
const GILT = { dk: '#9a6a28', base: '#d4a24a', lt: '#f4d488', hi: '#fff2c4' };
const CREAM = { dk: '#c8b8d8', base: '#eee6f4', lt: '#fbf8ff' };
const PLUM = { dk: '#4e1e44', base: '#7e3a6c', lt: '#a65a92', hi: '#d08ab8' };
const SKY = ['#1c1a48', '#3a3484', '#7a6ac0'];

// (local x from the hall's start; the pieces live in this frame)
const L = (wx) => wx - VV_HALL.x0;
const WIN = { x: L(3350), w: 132, top: 44, bot: 290 };
const PORTRAIT = { x: L(3065), y: 200 };
const RULES = { x: L(3198), y: 150 };
const KEYS = { x: L(3495), y: 196 };
const CLOCK = { x: L(3198), top: 262 };
const SCONCES = [L(2990), L(3150), L(3270), L(3432)];

// ---------- The wall ----------
function damask(P, clip, x, y, s, al) {
  // a soft fleur: a lily of three rounded petals over a pair of curling leaves, a little stem
  const c = rgba(WALL.motif, al);
  P.detail(poly(cr([[x, y - 9 * s], [x + 3.4 * s, y - 3 * s], [x, y + 1 * s], [x - 3.4 * s, y - 3 * s]], true, 3)), c, { clip });
  for (const k of [-1, 1]) {
    P.detail(poly(cr([[x + k * 1.2 * s, y - 2 * s], [x + k * 7 * s, y - 6 * s], [x + k * 8 * s, y - 1 * s], [x + k * 3 * s, y + 0.6 * s]], true, 3)), c, { clip });
    P.band(clip, [[x + k * 1 * s, y + 1 * s], [x + k * 5 * s, y + 5 * s], [x + k * 9 * s, y + 3 * s], [x + k * 8 * s, y + 0.4 * s]], swell(0.9 * s, 0.1), c, { n: 4 });
  }
  P.band(clip, [[x, y + 1 * s], [x, y + 8 * s]], () => 1 * s, c, { n: 1 });
}
function wallPiece() {
  const W = L(VV_HALL.x1) + 20;
  return piece('vvroom:wall', [-30, -10, W, G + 4], (P) => {
    const wall = new Path2D();
    wall.rect(-30, -10, W + 30, G + 14);
    P.detail(wall, lin(0, 0, 0, G, [[0, WALL.dk], [0.25, WALL.base], [0.7, WALL.lt], [1, WALL.base]]));
    // the damask, in soft staggered rows
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col * 46 < W + 46; col++) {
        const x = col * 46 + (row % 2 ? 23 : 0);
        const y = 96 + row * 46;
        if (y > G - 92) continue;
        damask(P, wall, x, y, 1, 0.26);
      }
    }
    // light from the window spreading over the paper; the corners deep
    P.glow(wall, WIN.x, 150, 230, '#b8a8f0', 0.28);
    P.detail(wall, lin(-30, 0, W, 0, [[0, rgba(WALL.dk, 0.6)], [0.18, rgba(WALL.dk, 0)], [0.85, rgba(WALL.dk, 0)], [1, rgba(WALL.dk, 0.55)]]));
    // the crown moulding and the picture rail
    const crown = new Path2D();
    crown.rect(-30, -10, W + 30, 30);
    P.detail(crown, lin(0, -10, 0, 20, [[0, WOOD.dk], [0.5, WOOD.base], [0.8, WOOD.lt], [1, WOOD.dk]]));
    P.band(null, [[-30, 18], [W, 18]], () => 2.2, GILT.base, { n: 1 });
    P.band(null, [[-30, 17.4], [W, 17.4]], () => 0.7, GILT.hi, { n: 1 });
    P.band(null, [[-30, 70], [W, 70]], () => 1.6, GILT.dk, { n: 1 });
    P.band(null, [[-30, 69.5], [W, 69.5]], () => 0.6, GILT.lt, { n: 1 });
    // the wainscot: dark panelled wood under a moulded chair rail, each panel raised with its bevels lit
    // from the window
    const wTop = G - 80;
    const wain = new Path2D();
    wain.rect(-30, wTop, W + 30, 84);
    P.detail(wain, lin(0, wTop, 0, G, [[0, WOOD.base], [1, WOOD.dk]]));
    for (let x = -10; x < W; x += 92) {
      const pnl = new Path2D();
      pnl.roundRect?.(x + 8, wTop + 16, 76, 56, 3) ?? pnl.rect(x + 8, wTop + 16, 76, 56);
      P.detail(pnl, lin(x, wTop + 16, x + 76, wTop + 72, [[0, WOOD.lt], [1, WOOD.base]]), { stroke: rgba(WOOD.dk, 0.9), slw: 1.2 });
      P.band(null, [[x + 10, wTop + 18], [x + 82, wTop + 18]], () => 1, rgba(WOOD.hi, 0.7), { n: 1 });
      P.band(null, [[x + 10, wTop + 18], [x + 10, wTop + 70]], () => 1, rgba(WOOD.hi, 0.5), { n: 1 });
      P.glow(pnl, x + 46, wTop + 40, 34, WOOD.hi, 0.25);
    }
    P.band(null, [[-30, wTop + 2], [W, wTop + 2]], () => 6, WOOD.lt, { n: 1 });
    P.band(null, [[-30, wTop - 0.6], [W, wTop - 0.6]], () => 1.4, GILT.base, { n: 1 });
    P.band(null, [[-30, wTop + 5], [W, wTop + 5]], () => 1, rgba(WOOD.dk, 0.8), { n: 1 });
    // the archway where the hallway ends and her hall begins: a fluted cream pilaster, a gilt capital
    for (const px of [-4, 26]) {
      const pil = new Path2D();
      pil.rect(px, 20, 24, G - 20);
      P.add(pil, lin(px, 0, px + 24, 0, [[0, CREAM.dk], [0.35, CREAM.lt], [1, CREAM.base]]));
      for (const fx of [5, 12, 19]) P.band(pil, [[px + fx, 96], [px + fx, G - 40]], () => 1.6, rgba(CREAM.dk, 0.8), { n: 1 });
      const cap = new Path2D();
      cap.rect(px - 3, 72, 30, 16);
      P.add(cap, lin(0, 72, 0, 88, [[0, GILT.hi], [0.5, GILT.base], [1, GILT.dk]]));
      P.band(cap, [[px + 2, 80], [px + 8, 76], [px + 14, 80], [px + 20, 76], [px + 25, 80]], () => 1, rgba(GILT.dk, 0.8), { n: 3 });
      const base = new Path2D();
      base.rect(px - 3, G - 22, 30, 22);
      P.add(base, lin(0, G - 22, 0, G, [[0, CREAM.lt], [1, CREAM.dk]]));
    }
    // the window: an arch of moonlit night between cream mullions, a moon too big, soft clouds, the
    // silhouette of the manor's far tower; the glass glinting; its deep sill
    const wx0 = WIN.x - WIN.w / 2;
    const wx1 = WIN.x + WIN.w / 2;
    const r = WIN.w / 2;
    const frame = new Path2D();
    frame.moveTo(wx0 - 10, WIN.bot + 8);
    frame.lineTo(wx0 - 10, WIN.top + r);
    frame.arc(WIN.x, WIN.top + r, r + 10, Math.PI, 0);
    frame.lineTo(wx1 + 10, WIN.bot + 8);
    frame.closePath();
    P.add(frame, lin(wx0, 0, wx1, 0, [[0, CREAM.dk], [0.4, CREAM.lt], [1, CREAM.base]]));
    const glass = new Path2D();
    glass.moveTo(wx0, WIN.bot);
    glass.lineTo(wx0, WIN.top + r);
    glass.arc(WIN.x, WIN.top + r, r, Math.PI, 0);
    glass.lineTo(wx1, WIN.bot);
    glass.closePath();
    P.detail(glass, lin(0, WIN.top, 0, WIN.bot, [[0, SKY[0]], [0.6, SKY[1]], [1, SKY[2]]]));
    P.glow(glass, WIN.x + 18, WIN.top + 70, 56, '#fff4d8', 0.35);
    P.detail(ell(WIN.x + 18, WIN.top + 70, 30, 30), rad(WIN.x + 10, WIN.top + 62, 34, [[0, '#fffbea'], [0.7, '#f6ecd0'], [1, '#e4d6b8']]), { clip: glass });
    for (const [cx, cy, cr0] of [[8, 58, 7], [26, 80, 5], [14, 86, 3.5]]) P.detail(ell(WIN.x + cx, WIN.top + cy, cr0, cr0 * 0.9), rgba('#d8c8a8', 0.45), { clip: glass, blur: 0.8 });
    for (const [cx, cy, w, h] of [[-30, 120, 40, 7], [20, 140, 54, 8], [-10, 104, 28, 5]]) P.detail(ell(WIN.x + cx, WIN.top + cy, w, h), rgba('#c8c0f0', 0.35), { clip: glass, blur: 2 });
    // (the far tower and a roofline)
    P.detail(poly([[wx0, WIN.bot], [wx0, 236], [WIN.x - 36, 222], [WIN.x - 30, 190], [WIN.x - 26, 172], [WIN.x - 22, 190], [WIN.x - 16, 214], [WIN.x + 10, 226], [wx1, 210], [wx1, WIN.bot]]), '#262050', { clip: glass });
    P.detail(ell(WIN.x - 26, 204, 2, 3), '#ffd88a', { clip: glass });
    // (stars)
    for (const [sx, sy, s] of [[-44, 40, 2.4], [40, 30, 1.8], [-20, 160, 1.6], [48, 176, 2]]) star4(P, WIN.x + sx, WIN.top + sy, s, 'rgba(255,255,255,0.85)', 0, { clip: glass });
    // the mullions and the glass's glints
    P.band(glass, [[WIN.x, WIN.top], [WIN.x, WIN.bot]], () => 4, CREAM.base, { n: 1 });
    P.band(glass, [[wx0, WIN.top + r + 20], [wx1, WIN.top + r + 20]], () => 4, CREAM.base, { n: 1 });
    P.band(glass, [[wx0, WIN.top + r + 104], [wx1, WIN.top + r + 104]], () => 4, CREAM.base, { n: 1 });
    for (const gx of [-46, 16]) P.band(glass, [[WIN.x + gx, WIN.bot - 40], [WIN.x + gx + 26, WIN.bot - 90]], () => 5, 'rgba(255,255,255,0.12)', { n: 1, blur: 1 });
    const sill = new Path2D();
    sill.rect(wx0 - 16, WIN.bot + 4, WIN.w + 32, 12);
    P.add(sill, lin(0, WIN.bot + 4, 0, WIN.bot + 16, [[0, CREAM.lt], [1, CREAM.dk]]));
    // her drapes: plum velvet hanging in deep folds either side, caught back with gilt tasselled cords;
    // a scalloped pelmet over them
    for (const s of [-1, 1]) {
      const x0 = WIN.x + s * (r + 4);
      const x1 = WIN.x + s * (r + 46);
      const tie = 214;
      const dr = poly(cr([[x0 - s * 4, 32], [x1, 32], [x1 + s * 4, 140], [x1 - s * 2, tie], [x1 + s * 6, 300], [x1 + s * 10, G - 2], [x0 + s * 10, G - 2], [x0 + s * 18, 300], [x0 + s * 26, tie], [x0 + s * 10, 140]], true, 4));
      P.add(dr, lin(x0, 0, x1, 0, [[0, PLUM.lt], [0.4, PLUM.base], [1, PLUM.dk]]));
      for (const k of [0.25, 0.5, 0.75]) {
        const fx = lerp(x0, x1, k);
        P.band(dr, [[fx, 40], [fx + s * 6, 140], [lerp(x0 + s * 26, x1, k), tie], [lerp(x0 + s * 18, x1 + s * 6, k), 300], [lerp(x0 + s * 10, x1 + s * 10, k), G]], swell(3.4, 0.4), rgba(PLUM.dk, 0.6), { blur: 1, n: 4 });
        P.band(dr, [[fx + 3, 40], [fx + 3 + s * 6, 140], [lerp(x0 + s * 26, x1, k) + 3, tie], [lerp(x0 + s * 18, x1 + s * 6, k) + 3, 300], [lerp(x0 + s * 10, x1 + s * 10, k) + 3, G]], swell(1.6, 0.2), rgba(PLUM.hi, 0.45), { blur: 0.6, n: 4 });
      }
      // (the tie-back cord and its tassel)
      const tx = lerp(x0 + s * 26, x1, 0.5);
      P.band(null, [[x0 + s * 22, tie - 4], [tx, tie + 4], [x1 - s * 2, tie - 2]], () => 3, GILT.base, { n: 4 });
      P.add(poly(cr([[tx - 4, tie + 4], [tx + 4, tie + 4], [tx + 6, tie + 22], [tx, tie + 26], [tx - 6, tie + 22]], true, 3)), lin(tx, tie, tx, tie + 26, [[0, GILT.hi], [1, GILT.dk]]));
      for (const k of [-3, -1, 1, 3]) P.band(null, [[tx + k, tie + 10], [tx + k * 1.4, tie + 24]], () => 0.6, rgba(GILT.dk, 0.8), { n: 1 });
    }
    const pel = [];
    pel.push([WIN.x - r - 52, 24], [WIN.x + r + 52, 24]);
    const N = 6;
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pel.push([lerp(WIN.x + r + 52, WIN.x - r - 52, u), 50 + (i % 2 ? 8 : 0)]);
    }
    const pelP = poly(cr(pel, true, 3));
    P.add(pelP, lin(0, 24, 0, 58, [[0, PLUM.base], [1, PLUM.dk]]));
    P.band(pelP, [[WIN.x - r - 50, 30], [WIN.x + r + 50, 30]], () => 2, GILT.base, { n: 1 });
    // the hostess's portrait in a gilt oval over the sideboard: Lady Marigold, plum hair, a marigold
    // in it, her blue ghost's face, her gown's gold; a little plate beneath
    const pf = ell(PORTRAIT.x, PORTRAIT.y, 40, 52);
    P.add(pf, rad(PORTRAIT.x - 14, PORTRAIT.y - 20, 70, [[0, GILT.hi], [0.5, GILT.base], [1, GILT.dk]]));
    for (let i = 0; i < 24; i++) {
      const an = (i / 24) * TAU;
      P.detail(ell(PORTRAIT.x + Math.cos(an) * 37, PORTRAIT.y + Math.sin(an) * 48.5, 3.2, 1.6, an + Math.PI / 2), rgba(GILT.dk, 0.45), { clip: pf });
    }
    const canvas = ell(PORTRAIT.x, PORTRAIT.y, 31, 42);
    P.detail(canvas, rad(PORTRAIT.x + 6, PORTRAIT.y - 14, 52, [[0, '#5a4a7a'], [0.6, '#3a2c56'], [1, '#221a36']]));
    const px = PORTRAIT.x;
    const py = PORTRAIT.y + 4;
    // (her hair behind, falling to her shoulders in two ringlets)
    P.detail(poly(cr([[px - 15, py - 14], [px - 13, py - 27], [px, py - 33], [px + 13, py - 27], [px + 16, py - 12], [px + 17, py + 8], [px + 11, py + 4], [px - 11, py + 4], [px - 17, py + 8]], true, 4)), lin(0, py - 33, 0, py + 8, [[0, '#b44e82'], [1, '#7a2a56']]), { clip: canvas });
    // (her gown's shoulders, gold, and its cream frill)
    P.detail(poly(cr([[px - 30, py + 46], [px - 26, py + 24], [px - 10, py + 17], [px + 10, py + 17], [px + 26, py + 24], [px + 30, py + 46]], true, 3)), lin(0, py + 17, 0, py + 46, [[0, '#ffd070'], [1, '#e8902e']]), { clip: canvas });
    P.detail(poly(cr([[px - 20, py + 20], [px, py + 25], [px + 20, py + 20], [px + 18, py + 26], [px, py + 30], [px - 18, py + 26]], true, 3)), '#fff4e0', { clip: canvas });
    // (her neck and face, ghost-blue)
    P.detail(poly([[px - 4, py + 8], [px + 4, py + 8], [px + 5, py + 20], [px - 5, py + 20]]), '#cfdcf4', { clip: canvas });
    P.detail(poly(cr([[px - 11, py - 14], [px - 11.6, py - 2], [px - 8, py + 7], [px, py + 11], [px + 8, py + 7], [px + 11.6, py - 2], [px + 11, py - 14], [px, py - 19]], true, 4)), lin(0, py - 19, 0, py + 11, [[0, '#f0f6ff'], [1, '#d2e0f6']]), { clip: canvas });
    // (her fringe swept across, a marigold pinned in it)
    P.detail(poly(cr([[px - 12, py - 12], [px - 6, py - 22], [px + 8, py - 22], [px + 13, py - 10], [px + 9, py - 13], [px + 3, py - 12], [px - 4, py - 9]], true, 4)), lin(0, py - 22, 0, py - 8, [[0, '#c45a8e'], [1, '#9a3a6a']]), { clip: canvas });
    for (const s2 of [-1, 1]) {
      P.detail(ell(px + s2 * 4.4, py - 1.5, 2.2, 2.8), '#ffffff', { clip: canvas });
      P.detail(ell(px + s2 * 4.4, py - 1, 1.6, 2.2), '#d0802a', { clip: canvas });
      P.detail(ell(px + s2 * 4.4 - 0.4, py - 1.9, 0.6, 0.6), '#ffffff', { clip: canvas });
      P.band(canvas, [[px + s2 * 2, py - 4.2], [px + s2 * 4.6, py - 5], [px + s2 * 7, py - 3.8]], () => 0.9, '#3e1430', { n: 3 });
      P.detail(ell(px + s2 * 6.4, py + 3, 2.4, 1.2), 'rgba(255,150,180,0.45)', { clip: canvas, blur: 0.6 });
    }
    P.band(canvas, [[px - 1.6, py + 5.4], [px, py + 6.2], [px + 1.6, py + 5.4]], () => 0.8, '#b0506e', { n: 3 });
    P.detail(ell(px + 10, py - 18, 4.6, 4.6), rad(px + 9, py - 19, 5, [[0, '#ffd27a'], [1, '#f08a2a']]), { clip: canvas });
    P.detail(ell(px + 10, py - 18, 1.5, 1.5), '#c45e1a', { clip: canvas });
    P.glow(canvas, px - 12, py - 22, 32, '#ffffff', 0.2);
    const plate = new Path2D();
    plate.rect(px - 14, py + 56, 28, 8);
    P.add(plate, lin(0, py + 56, 0, py + 64, [[0, GILT.lt], [1, GILT.dk]]));
    // the HOUSE RULES, framed: a cream sheet with its title and her neat lines
    const rw = 66;
    const rh = 74;
    const rf = new Path2D();
    rf.rect(RULES.x - rw / 2 - 5, RULES.y - 5, rw + 10, rh + 10);
    P.add(rf, lin(0, RULES.y, 0, RULES.y + rh, [[0, WOOD.lt], [1, WOOD.dk]]));
    const sheet = new Path2D();
    sheet.rect(RULES.x - rw / 2, RULES.y, rw, rh);
    P.detail(sheet, lin(0, RULES.y, 0, RULES.y + rh, [[0, '#fffaf0'], [1, '#efe2cc']]));
    P.detail(null, null, {
      draw: (ctx) => {
        ctx.fillStyle = PLUM.dk;
        ctx.textAlign = 'center';
        ctx.font = '700 8px Georgia, serif';
        ctx.fillText('HOUSE RULES', RULES.x, RULES.y + 13);
      },
    });
    for (let i = 0; i < 5; i++) {
      const y = RULES.y + 24 + i * 9;
      P.band(sheet, [[RULES.x - 26, y], [RULES.x + 26 - (i % 2) * 10, y]], () => 1.1, rgba('#5a4060', 0.6), { n: 1 });
      P.detail(ell(RULES.x - 29, y, 1, 1), rgba(PLUM.base, 0.8), { clip: sheet });
    }
    // the key board: dark wood, a brass hook for every door, most of the keys on them, each its own
    const kb = new Path2D();
    kb.roundRect?.(KEYS.x - 40, KEYS.y - 44, 80, 76, 4) ?? kb.rect(KEYS.x - 40, KEYS.y - 44, 80, 76);
    P.add(kb, lin(0, KEYS.y - 44, 0, KEYS.y + 32, [[0, WOOD.lt], [1, WOOD.dk]]));
    P.band(kb, [[KEYS.x - 36, KEYS.y - 40], [KEYS.x + 36, KEYS.y - 40]], () => 1, rgba(WOOD.hi, 0.7), { n: 1 });
    const bows = ['ring', 'clover', 'heart', 'ring', 'diamond', 'clover'];
    for (let i = 0; i < 6; i++) {
      const kx = KEYS.x - 28 + (i % 3) * 28;
      const ky = KEYS.y - 32 + Math.floor(i / 3) * 36;
      P.detail(ell(kx, ky, 1.6, 1.6), GILT.dk);
      if (i === 4) continue;
      const kc = i % 2 ? '#c8a050' : '#d8b868';
      const kp = (path) => P.add(path, lin(kx - 4, ky, kx + 4, ky + 20, [[0, GILT.hi], [1, kc]]), true, { lw: 1 });
      if (bows[i] === 'ring') kp(ell(kx, ky + 5, 3.4, 3.4));
      else if (bows[i] === 'heart') kp(poly(cr([[kx, ky + 9], [kx - 4, ky + 4], [kx - 2.4, ky + 1.6], [kx, ky + 3.2], [kx + 2.4, ky + 1.6], [kx + 4, ky + 4]], true, 2)));
      else if (bows[i] === 'diamond') kp(poly([[kx, ky + 1], [kx + 3.6, ky + 5], [kx, ky + 9], [kx - 3.6, ky + 5]]));
      else kp(poly(cr([[kx, ky + 1.4], [kx + 3.4, ky + 3], [kx + 2.4, ky + 6], [kx + 3.6, ky + 8], [kx, ky + 9], [kx - 3.6, ky + 8], [kx - 2.4, ky + 6], [kx - 3.4, ky + 3]], true, 2)));
      P.add(poly(ribbon([[kx, ky + 8], [kx, ky + 22]], () => 1.6, { n: 1 })), kc, true, { lw: 1 });
      P.add(poly([[kx, ky + 18], [kx + 4, ky + 18], [kx + 4, ky + 20], [kx, ky + 20]]), kc, false);
      P.add(poly([[kx, ky + 21], [kx + 3, ky + 21], [kx + 3, ky + 22.6], [kx, ky + 22.6]]), kc, false);
    }
    // the grandfather clock's case (its pendulum swings live): tall dark wood, a moon-phase arch over a
    // cream face stopped at no particular hour, a glass door down its waist
    const cw = 36;
    const cc = new Path2D();
    cc.moveTo(CLOCK.x - cw / 2, G);
    cc.lineTo(CLOCK.x - cw / 2, CLOCK.top + 20);
    cc.quadraticCurveTo(CLOCK.x, CLOCK.top - 4, CLOCK.x + cw / 2, CLOCK.top + 20);
    cc.lineTo(CLOCK.x + cw / 2, G);
    cc.closePath();
    P.add(cc, lin(CLOCK.x - cw / 2, 0, CLOCK.x + cw / 2, 0, [[0, WOOD.dk], [0.35, WOOD.lt], [1, WOOD.base]]));
    P.add(ell(CLOCK.x, CLOCK.top + 30, 13, 13), rad(CLOCK.x - 3, CLOCK.top + 26, 15, [[0, '#fffaf0'], [1, '#e8dcc4']]), true, { lw: 1.4, lc: GILT.dk });
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * TAU;
      P.band(null, [[CLOCK.x + Math.cos(an) * 10, CLOCK.top + 30 + Math.sin(an) * 10], [CLOCK.x + Math.cos(an) * 12, CLOCK.top + 30 + Math.sin(an) * 12]], () => (i % 3 ? 0.5 : 1), '#5a4060', { n: 1 });
    }
    P.band(null, [[CLOCK.x, CLOCK.top + 30], [CLOCK.x + 1, CLOCK.top + 22]], () => 1.1, '#3a2040', { n: 1 });
    P.band(null, [[CLOCK.x, CLOCK.top + 30], [CLOCK.x + 6, CLOCK.top + 33]], () => 1.2, '#3a2040', { n: 1 });
    const door = new Path2D();
    door.rect(CLOCK.x - 9, CLOCK.top + 50, 18, 66);
    P.detail(door, lin(0, CLOCK.top + 50, 0, CLOCK.top + 116, [[0, '#2a1830'], [1, '#1c1024']]), { stroke: GILT.dk, slw: 1 });
    // her wall sconces: gilt brackets, cream candles (the flames burn live)
    for (const sx of SCONCES) {
      P.add(poly(cr([[sx - 6, 132], [sx + 6, 132], [sx + 3, 146], [sx, 150], [sx - 3, 146]], true, 2)), lin(0, 132, 0, 150, [[0, GILT.lt], [1, GILT.dk]]));
      P.add(poly([[sx - 2.4, 118], [sx + 2.4, 118], [sx + 2.4, 133], [sx - 2.4, 133]]), lin(sx - 2.4, 0, sx + 2.4, 0, [[0, CREAM.lt], [1, CREAM.dk]]));
    }
  }, { out: OUT, lw: 2.2 });
}

// ---------- Live: candle flames, moonbeams with dust drifting in them, the clock's pendulum ----------
function flame(ctx, x, y, time, i) {
  const f = 1 + Math.sin(time * 9 + i * 1.7) * 0.12 + Math.sin(time * 23 + i) * 0.06;
  const g = ctx.createRadialGradient(x, y - 3, 0, x, y - 3, 22);
  g.addColorStop(0, 'rgba(255,220,150,0.35)');
  g.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 22, y - 25, 44, 44);
  ctx.beginPath();
  ctx.moveTo(x, y - 9 * f);
  ctx.quadraticCurveTo(x + 2.8, y - 3, x, y);
  ctx.quadraticCurveTo(x - 2.8, y - 3, x, y - 9 * f);
  ctx.fillStyle = '#ffd27a';
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y - 2.6, 1.1, 2.4, 0, 0, TAU);
  ctx.fillStyle = '#fffbe8';
  ctx.fill();
}
export function drawVelvetHall(ctx, map, cam, width, time) {
  if (map.id !== 'manor5') return;
  const ox = VV_HALL.x0 - cam.x;
  if (ox > width + 40 || ox + (VV_HALL.x1 - VV_HALL.x0) < -60) return;
  const oy = -cam.y;
  ctx.save();
  ctx.translate(ox, oy);
  drawPiece(ctx, wallPiece(), 'line');
  drawPiece(ctx, wallPiece(), 'fill');
  // the moonbeams from her window, falling across the floor, dust drifting in them
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const [dx, w, al] of [[-30, 50, 0.1], [22, 40, 0.08]]) {
    const x0 = WIN.x + dx;
    const g = ctx.createLinearGradient(x0, WIN.top + 60, x0 - 80, G);
    g.addColorStop(0, `rgba(190,180,255,${al})`);
    g.addColorStop(1, 'rgba(190,180,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x0 - w / 2, WIN.top + 70);
    ctx.lineTo(x0 + w / 2, WIN.top + 70);
    ctx.lineTo(x0 + w / 2 - 110, G);
    ctx.lineTo(x0 - w / 2 - 150, G);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  for (let i = 0; i < 9; i++) {
    const u = (time * 0.05 + i * 0.137) % 1;
    const x = WIN.x - 20 - u * 120 + Math.sin(time * 0.7 + i * 2) * 10;
    const y = WIN.top + 90 + u * (G - WIN.top - 110) + Math.sin(time * 0.9 + i) * 6;
    const a = Math.sin(Math.PI * u) * 0.75;
    ctx.fillStyle = `rgba(240,236,255,${a})`;
    ctx.beginPath();
    ctx.arc(x, y, 0.9 + (i % 3) * 0.3, 0, TAU);
    ctx.fill();
  }
  // the pendulum behind the clock's glass, swinging slowly
  const sw = Math.sin(time * 2.1) * 0.22;
  ctx.save();
  ctx.beginPath();
  ctx.rect(CLOCK.x - 8, CLOCK.top + 51, 16, 64);
  ctx.clip();
  ctx.translate(CLOCK.x, CLOCK.top + 52);
  ctx.rotate(sw);
  ctx.strokeStyle = '#c8a050';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 44);
  ctx.stroke();
  const pg = ctx.createRadialGradient(-1.5, 46, 0.5, 0, 48, 6);
  pg.addColorStop(0, '#fff2c4');
  pg.addColorStop(1, '#b08030');
  ctx.fillStyle = pg;
  ctx.beginPath();
  ctx.arc(0, 48, 5.4, 0, TAU);
  ctx.fill();
  ctx.restore();
  SCONCES.forEach((sx, i) => flame(ctx, sx, 118, time, i));
  ctx.restore();
}

// ---------- Her ledges: the furniture you stand on ----------
// The sideboard: a long low cabinet of dark wood, two drawers with brass pulls over carved doors, turned
// feet, a cream marble top with her silver tea service on it.
function sideboardPiece(w, h) {
  return piece(`vvroom:sideboard:${w}:${h}`, [-6, -26, w + 6, h + 2], (P) => {
    const body = new Path2D();
    body.rect(4, 6, w - 8, h - 14);
    P.add(body, lin(0, 0, w, 0, [[0, WOOD.dk], [0.35, WOOD.lt], [1, WOOD.base]]));
    for (const [x0, x1] of [[10, w / 2 - 3], [w / 2 + 3, w - 10]]) {
      const dr = new Path2D();
      dr.rect(x0, 12, x1 - x0, 14);
      P.detail(dr, lin(0, 12, 0, 26, [[0, WOOD.lt], [1, WOOD.base]]), { stroke: rgba(WOOD.dk, 0.9), slw: 1 });
      P.add(ell((x0 + x1) / 2, 19, 3, 1.6), lin(0, 17, 0, 21, [[0, GILT.hi], [1, GILT.dk]]), false);
      const dd = new Path2D();
      dd.rect(x0, 31, x1 - x0, h - 46);
      P.detail(dd, lin(x0, 31, x1, h - 15, [[0, WOOD.lt], [1, WOOD.dk]]), { stroke: rgba(WOOD.dk, 0.9), slw: 1 });
      P.detail(poly(cr([[(x0 + x1) / 2, 36], [x1 - 6, (31 + h - 15) / 2], [(x0 + x1) / 2, h - 20], [x0 + 6, (31 + h - 15) / 2]], true, 3)), rgba(WOOD.hi, 0.35), { stroke: rgba(GILT.base, 0.5), slw: 0.6 });
    }
    for (const fx of [8, w - 8]) P.add(poly(cr([[fx - 4, h - 9], [fx + 4, h - 9], [fx + 2, h - 3], [fx + 3, h], [fx - 3, h], [fx - 2, h - 3]], true, 2)), WOOD.base);
    const top = new Path2D();
    top.rect(-2, 0, w + 4, 7);
    P.add(top, lin(0, 0, 0, 7, [[0, '#fbf8ff'], [0.6, '#e4dcec'], [1, '#c8bcd8']]));
    P.band(top, [[6, 3], [w * 0.4, 4], [w * 0.7, 2.5]], () => 0.5, 'rgba(150,130,170,0.4)', { n: 3 });
    // the tea service: a silver teapot, a sugar bowl, two cups on saucers, gleaming
    const silver = (x0, y0, x1, y1) => lin(x0, y0, x1, y1, [[0, '#ffffff'], [0.45, '#c8c4dc'], [1, '#7a7498']]);
    const tx = w * 0.3;
    P.add(poly(cr([[tx - 10, -1], [tx - 12, -9], [tx - 7, -16], [tx + 7, -16], [tx + 12, -9], [tx + 10, -1]], true, 3)), silver(tx - 12, -16, tx + 12, 0));
    P.add(poly(cr([[tx + 10, -10], [tx + 20, -16], [tx + 22, -19], [tx + 18, -12], [tx + 11, -6]], true, 2)), silver(tx + 10, -19, tx + 22, -6));
    P.band(null, [[tx - 10, -12], [tx - 17, -10], [tx - 16, -4], [tx - 10, -4]], () => 1.6, '#a8a4c0', { n: 3 });
    P.add(ell(tx, -17, 5, 1.8), silver(tx - 5, -19, tx + 5, -15));
    P.add(ell(tx, -20.5, 1.8, 1.8), silver(tx - 2, -22, tx + 2, -19));
    P.detail(ell(tx - 5, -10, 1.6, 4), 'rgba(255,255,255,0.85)');
    const bx = w * 0.58;
    P.add(poly(cr([[bx - 6, -1], [bx - 7, -7], [bx + 7, -7], [bx + 6, -1]], true, 2)), silver(bx - 7, -7, bx + 7, 0));
    P.add(ell(bx, -8, 6.6, 1.6), silver(bx - 7, -10, bx + 7, -6));
    for (const cx of [w * 0.75, w * 0.88]) {
      P.add(ell(cx, -1.2, 6, 1.4), '#f4eefa');
      P.add(poly(cr([[cx - 4, -2], [cx - 4.4, -6], [cx + 4.4, -6], [cx + 4, -2]], true, 2)), lin(0, -6, 0, -2, [[0, '#ffffff'], [1, '#e0d6ec']]));
      P.band(null, [[cx - 4.2, -5.2], [cx + 4.2, -5.2]], () => 0.6, PLUM.base, { n: 1 });
    }
  }, { out: OUT, lw: 2 });
}
// The plate shelf: a long shelf of dark wood on two carved brackets, her best china standing along it.
function shelfPiece(w) {
  return piece(`vvroom:shelf:${w}`, [-6, -24, w + 6, 30], (P) => {
    const sh = new Path2D();
    sh.rect(-2, 0, w + 4, 7);
    P.add(sh, lin(0, 0, 0, 7, [[0, WOOD.lt], [1, WOOD.dk]]));
    P.band(sh, [[0, 1.2], [w, 1.2]], () => 0.8, rgba(WOOD.hi, 0.8), { n: 1 });
    for (const bx of [12, w - 12]) P.add(poly(cr([[bx - 4, 6], [bx + 4, 6], [bx + 3, 14], [bx - 1, 24], [bx - 4, 20], [bx - 2, 12]], true, 3)), lin(0, 6, 0, 24, [[0, WOOD.lt], [1, WOOD.dk]]));
    const plates = Math.max(2, Math.floor(w / 30));
    for (let i = 0; i < plates; i++) {
      const px = (w / plates) * (i + 0.5);
      const pl = ell(px, -10, 10, 10);
      P.add(pl, rad(px - 3, -13, 12, [[0, '#ffffff'], [0.7, '#eee8f6'], [1, '#c8bcd8']]));
      P.detail(ell(px, -10, 6.4, 6.4), null, { draw: (ctx) => { ctx.strokeStyle = i % 2 ? PLUM.base : '#5a78b0'; ctx.lineWidth = 0.8; ctx.stroke(ell(px, -10, 6.6, 6.6)); } });
      P.detail(ell(px, -10, 3, 3), rgba(i % 2 ? PLUM.lt : '#8aa4d8', 0.6));
      P.detail(ell(px - 4, -14, 2, 1.2, -0.6), 'rgba(255,255,255,0.9)');
    }
  }, { out: OUT, lw: 2 });
}
// The linen press: a tall cupboard of dark wood under a moulded cornice, two panelled doors with brass
// keyholes, a drawer below; her folded sheets stacked on top, tied with a plum ribbon.
function pressPiece(w, h) {
  return piece(`vvroom:press:${w}:${h}`, [-8, -16, w + 8, h + 2], (P) => {
    const body = new Path2D();
    body.rect(2, 8, w - 4, h - 10);
    P.add(body, lin(0, 0, w, 0, [[0, WOOD.dk], [0.4, WOOD.lt], [1, WOOD.base]]));
    const corn = new Path2D();
    corn.rect(-4, 0, w + 8, 10);
    P.add(corn, lin(0, 0, 0, 10, [[0, WOOD.hi], [1, WOOD.dk]]));
    P.band(corn, [[-4, 8], [w + 4, 8]], () => 1, GILT.base, { n: 1 });
    for (const [x0, x1] of [[8, w / 2 - 2], [w / 2 + 2, w - 8]]) {
      const d = new Path2D();
      d.rect(x0, 16, x1 - x0, h - 46);
      P.detail(d, lin(x0, 16, x1, h - 30, [[0, WOOD.lt], [1, WOOD.dk]]), { stroke: rgba(WOOD.dk, 0.9), slw: 1 });
      const pnl = new Path2D();
      pnl.rect(x0 + 5, 22, x1 - x0 - 10, h - 58);
      P.detail(pnl, rgba(WOOD.hi, 0.18), { stroke: rgba(GILT.base, 0.45), slw: 0.6 });
    }
    for (const s of [-1, 1]) P.add(ell(w / 2 + s * 5, h / 2 - 8, 1.4, 2.2), GILT.base, false);
    const dr = new Path2D();
    dr.rect(8, h - 26, w - 16, 14);
    P.detail(dr, lin(0, h - 26, 0, h - 12, [[0, WOOD.lt], [1, WOOD.base]]), { stroke: rgba(WOOD.dk, 0.9), slw: 1 });
    P.add(ell(w / 2, h - 19, 3, 1.4), GILT.base, false);
    // (sheets folded on top)
    const sx = w * 0.62;
    for (let i = 0; i < 3; i++) {
      const y = -4 - i * 4;
      const sheetP = new Path2D();
      sheetP.roundRect?.(sx - 15 + i, y, 28 - i, 4.4, 1.6) ?? sheetP.rect(sx - 15 + i, y, 28 - i, 4.4);
      P.add(sheetP, lin(0, y, 0, y + 4.4, [[0, '#ffffff'], [1, i === 1 ? '#e8dcf4' : '#ddd6ec']]));
    }
    P.band(null, [[sx - 2, -15], [sx - 2, 0]], () => 1.6, PLUM.base, { n: 1 });
  }, { out: OUT, lw: 2 });
}
// (x, y: the ledge's top-left on the screen)
export function drawVelvetLedge(ctx, x, y, w, time, style, map, cam) {
  const h = Math.max(20, Math.round(map.groundY - (y + cam.y)));
  const pc = style === 'vvSideboard' ? sideboardPiece(w, h) : style === 'vvShelf' ? shelfPiece(w) : pressPiece(w, h);
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  drawPiece(ctx, pc, 'line');
  drawPiece(ctx, pc, 'fill');
  ctx.restore();
}

// ---------- Her doors ----------
// Tall double doors of plum-stained wood in her archway, each with two raised panels and a brass
// handle, swinging shut behind the group as she joins the fight (world/manor.js room.vvShut), and
// open again after.
function doorPiece() {
  return piece('vvroom:door', [-2, -2, 26, 214], (P) => {
    const d = new Path2D();
    d.rect(0, 0, 24, 212);
    P.add(d, lin(0, 0, 24, 0, [[0, '#3e1e36'], [0.4, '#6a3458'], [1, '#4a2440']]));
    for (const [y0, h] of [[10, 86], [108, 92]]) {
      const pn = new Path2D();
      pn.rect(4, y0, 16, h);
      P.detail(pn, lin(4, y0, 20, y0 + h, [[0, '#7a426a'], [1, '#4a2440']]), { stroke: 'rgba(40,16,34,0.9)', slw: 1 });
      P.band(null, [[5, y0 + 1], [19, y0 + 1]], () => 0.8, 'rgba(220,160,200,0.5)', { n: 1 });
    }
    P.add(ell(19, 104, 2.4, 2.4), rad(18.4, 103.4, 2.6, [[0, GILT.hi], [1, GILT.dk]]));
  }, { out: OUT, lw: 2 });
}
export function drawVelvetDoors(ctx, world, cam, time) {
  const room = world.dungeon?.room;
  const at = room?.vvShut;
  const closing = at != null ? clamp((world.now - at) / 0.8, 0, 1) : 0;
  room.vvDoorK = clamp((room.vvDoorK ?? 0) + (at != null ? 1 : -1) * 0.04, 0, 1);
  const k = Math.max(closing, room.vvDoorK);
  if (k <= 0.01) return;
  const cx = VV_HALL.x0 + 23 - cam.x;
  const y = G - 212 - cam.y;
  const e = Math.max(0.06, sstepK(k));
  // (each leaf swings shut round its hinge, the left from the left post, the right from the right)
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + s * 24, y);
    ctx.scale(-s * e, 1);
    drawPiece(ctx, doorPiece(), 'line');
    drawPiece(ctx, doorPiece(), 'fill');
    ctx.restore();
  }
}
const sstepK = (u) => u * u * (3 - 2 * u);
