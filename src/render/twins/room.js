// The Mirrored Ballroom (2026-11-28, the Mirror Twins' own room, remade with them; the player: "Yes build
// it and heavily redraw it with extremely good details"). The ballroom the twins have danced in, each the
// other's reflection, since the manor fell asleep: Rondo's floor below, polished black and white marble;
// Minuet's floor above, the same marble in white and lilac, upside down, which she hangs from; between
// them the back wall in deep violet damask, its bays divided by fluted marble pilasters with gilt
// capitals and candle sconces, tall arched mirrors in gilt frames turn about with moonlit windows hung
// in plum velvet; in the middle, in a velvet alcove, the great clock with a ruby face, stopped at twelve
// (the hidden red eye's clock); before it the crystal chandelier, whose crown is the little ledge up in
// the dome; gilt balconies either side, marble pedestals for landings, and two ghost instruments, a harp
// and a violin, playing the twins' waltz by themselves. Painted once with the bosses' fine painting kit
// (render/bossart/kit.js) in world units; the candle flames, moonbeams and their dust, the mirrors' light,
// the clock, the crystals' twinkle and the instruments are drawn live each frame, and the room answers the
// fight: when time stops (world/twins.js) the mirrors glow ruby and the clock's second hand shudders.
//   drawTwinsHall    behind the floor and ledges (scenery.js BEHIND_GROUND, hooked in by render/manor.js)
//   drawTwinsFloor   the marble floor, over the ground's top (render/manor.js drawManorBack)
//   drawTwinsLedge   the ledges' own looks (terrain.js: a platform's style 'twBalcony', 'twPlinth',
//                    'twCrown'): the balconies, the pedestals, the chandelier's crown
import { TAU, lerp, cr, poly, ell, swell, rgba, mixHex, lin, rad, piece, drawPiece } from '../bossart/kit.js';
import { ornateClock, sparkle } from './fxparts.js';
import { TWIN_ARTS } from './arts.js';

const G = 380;
const W = 1500;
// Minuet's floor, the ceiling: where its cornice meets the wall (world/twins.js hangs her just under it).
export const BALL_CEIL = 132;
const OUT = '#2a1a3e';
const WALL = { dk: '#24163a', base: '#3a2458', lt: '#4e3274', motif: '#7e5ab0' };
const GILT = ['#fff4cc', '#f6d88a', '#d8a84c', '#a6742a', '#6a4618'];
const MARBLE = ['#fbf9ff', '#e6e0f2', '#c8bede', '#9a8ebc'];
const LILAC = ['#f8f2ff', '#e2d2f8', '#c4aaec', '#9a7ad2', '#6a4ea0'];
const NOIR = ['#4a4a6a', '#2a2a44', '#16162a', '#0a0a16'];
const PLUM = ['#c87ab0', '#9a3e7e', '#6e2458', '#44123a'];
const WOOD = ['#6a3a5e', '#4a2442', '#2e142a'];
const SKY = ['#120e34', '#2a2470', '#5a4aa8', '#9a86d8'];
// The bays between the pilasters, and what fills each.
const BAYS = [150, 300, 450, 600, 750, 900, 1050, 1200, 1350];
// (the two mirrors either side of the clock are the ones the twins step out of at their entrance)
const KIND = ['window', 'mirror', 'window', 'mirror', 'clock', 'mirror', 'window', 'mirror', 'window'];
const PILLARS = [75, 225, 375, 525, 675, 825, 975, 1125, 1275, 1425];
const ARCH = { half: 50, apex: 172, spring: 206, bot: 326 };
const WAIN = 330;
const CLOCK = { x: 750, y: 266, r: 33 };
const SCONCE_Y = 244;

// An arched opening's outline (bay centre bx, half width h, apex, the arch's spring line, bottom).
function archPts(bx, h, apex, spring, bot) {
  const pts = [[bx - h, bot], [bx - h, spring]];
  for (let i = 1; i < 12; i++) {
    const a = Math.PI + (i / 12) * Math.PI;
    pts.push([bx + Math.cos(a) * h, spring + Math.sin(a) * (spring - apex)]);
  }
  pts.push([bx + h, spring], [bx + h, bot]);
  return pts;
}
const archPath = (bx, h, apex, spring, bot) => poly(archPts(bx, h, apex, spring, bot));

// ---------- The ceiling: Minuet's floor, upside down ----------
function ceilingPiece() {
  return piece('twroom:ceiling', [-10, -40, W + 10, BALL_CEIL + 16], (P) => {
    const field = new Path2D();
    field.rect(-10, -40, W + 20, BALL_CEIL + 2);
    P.detail(field, LILAC[1]);
    // the marble tiles in perspective: nearest (biggest) at the top of the view, receding to the cornice
    const rows = 7;
    for (let r = 0; r < rows; r++) {
      const ya = lerp(-40, BALL_CEIL - 12, (r / rows) ** 0.8);
      const yb = lerp(-40, BALL_CEIL - 12, ((r + 1) / rows) ** 0.8);
      const sa = 1.25 - 0.45 * (r / rows);
      const sb = 1.25 - 0.45 * ((r + 1) / rows);
      const tile = 60;
      for (let c = -16; c < 18; c++) {
        const xa = W / 2 + c * tile * sa;
        const xb = W / 2 + (c + 1) * tile * sa;
        const xc = W / 2 + (c + 1) * tile * sb;
        const xd = W / 2 + c * tile * sb;
        const t = poly([[xa, ya], [xb, ya], [xc, yb], [xd, yb]]);
        const light = (r + c) % 2 === 0;
        P.detail(t, lin(0, ya, 0, yb, light ? [[0, '#ffffff'], [1, LILAC[0]]] : [[0, LILAC[2]], [1, mixHex(LILAC[2], LILAC[3], 0.4)]]), { clip: field });
        // the marble's soft veining, a fine line across each tile
        P.stroke([[lerp(xa, xb, 0.15), lerp(ya, yb, 0.3)], [lerp(xa, xb, 0.5), lerp(ya, yb, 0.55)], [lerp(xd, xc, 0.85), lerp(ya, yb, 0.75)]], rgba(light ? LILAC[2] : LILAC[0], 0.35), 0.5, { clip: field });
        P.stroke([[xa, ya], [xb, ya]], rgba(LILAC[4], 0.3), 0.6, { clip: field });
        P.stroke([[xb, ya], [xc, yb]], rgba(LILAC[4], 0.25), 0.6, { clip: field });
      }
    }
    // a polished sheen, deeper toward the cornice
    P.detail(field, lin(0, -40, 0, BALL_CEIL, [[0, 'rgba(255,255,255,0.18)'], [0.6, 'rgba(255,255,255,0)'], [1, 'rgba(60,30,110,0.35)']]));
    // the chandelier's medallion: a gilt rosette where its chain hangs
    const rx = 750;
    const ry = BALL_CEIL - 8;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      P.add(poly(cr([[rx, ry], [rx + Math.cos(a - 0.2) * 16, ry + Math.sin(a - 0.2) * 7], [rx + Math.cos(a) * 24, ry + Math.sin(a) * 10], [rx + Math.cos(a + 0.2) * 16, ry + Math.sin(a + 0.2) * 7]], true, 3)), lin(0, ry - 10, 0, ry + 10, [[0, GILT[1]], [1, GILT[3]]]), true, { lw: 0.6 });
    }
    P.add(ell(rx, ry, 8, 4), rad(rx - 2, ry - 1, 8, [[0, GILT[0]], [1, GILT[2]]]), true, { lw: 0.6 });
    // the cornice: a deep shadow, a gilt bead, a frieze of running scrolls, a gilt edge
    const corn = new Path2D();
    corn.rect(-10, BALL_CEIL - 12, W + 20, 26);
    P.add(corn, lin(0, BALL_CEIL - 12, 0, BALL_CEIL + 14, [[0, GILT[3]], [0.18, GILT[1]], [0.3, GILT[2]], [0.34, WALL.dk], [0.8, WALL.base], [0.86, GILT[2]], [1, GILT[3]]]), true, { lw: 0.8 });
    for (let x = -10; x < W + 20; x += 18) {
      const y = BALL_CEIL + 2;
      P.stroke(cr([[x, y + 3], [x + 4, y - 3], [x + 9, y - 2], [x + 10, y + 2], [x + 7, y + 3.4], [x + 6, y + 1], [x + 14, y + 3], [x + 18, y + 3]], false, 4), GILT[1], 1.1);
    }
    P.stroke([[-10, BALL_CEIL - 6], [W + 10, BALL_CEIL - 6]], 'rgba(255,250,220,0.8)', 0.7);
  }, { out: OUT, lw: 1.2 });
}

// ---------- The wall ----------
// A lyre with a ribbon, the wall's damask motif (the ballroom's music).
function lyre(P, clip, x, y, s, al) {
  const c = rgba(WALL.motif, al);
  for (const k of [-1, 1]) P.band(clip, [[x + k * 1.2 * s, y + 6 * s], [x + k * 4.6 * s, y + 1 * s], [x + k * 4 * s, y - 5 * s], [x + k * 2 * s, y - 7 * s]], swell(1.4 * s, 0.4), c, { n: 6 });
  P.band(clip, [[x - 3 * s, y - 3.4 * s], [x + 3 * s, y - 3.4 * s]], () => 0.8 * s, c, { n: 1 });
  for (const k of [-1, 0, 1]) P.band(clip, [[x + k * 1.2 * s, y - 3.4 * s], [x + k * 1 * s, y + 5 * s]], () => 0.4 * s, c, { n: 1 });
  P.detail(ell(x, y + 6.4 * s, 2.2 * s, 1.2 * s), c, { clip });
  for (const k of [-1, 1]) P.band(clip, [[x, y + 7 * s], [x + k * 4 * s, y + 9.5 * s], [x + k * 7 * s, y + 8 * s], [x + k * 6 * s, y + 10.6 * s]], swell(1 * s, 0.2), c, { n: 4 });
}
function wallPiece() {
  return piece('twroom:wall', [-10, BALL_CEIL + 10, W + 10, G + 4], (P) => {
    const wall = new Path2D();
    wall.rect(-10, BALL_CEIL + 10, W + 20, G - BALL_CEIL - 6);
    P.detail(wall, lin(0, BALL_CEIL, 0, G, [[0, WALL.dk], [0.3, WALL.base], [0.75, WALL.lt], [1, WALL.base]]));
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col * 38 < W + 38; col++) {
        const x = col * 38 + (row % 2 ? 19 : 0);
        const y = BALL_CEIL + 40 + row * 38;
        if (y > WAIN - 20) continue;
        lyre(P, wall, x, y, 1, 0.3);
      }
    }
    // the cornice's shadow on the wall
    P.detail(wall, lin(0, BALL_CEIL + 10, 0, BALL_CEIL + 40, [[0, 'rgba(10,0,30,0.55)'], [1, 'rgba(10,0,30,0)']]));
    BAYS.forEach((bx, i) => bay(P, bx, KIND[i]));
    PILLARS.forEach((px) => pilaster(P, px));
    // the wainscot: dark plum wood, a gilt rail, a raised panel framed in gilt in each bay
    const wain = new Path2D();
    wain.rect(-10, WAIN, W + 20, G - WAIN + 2);
    P.add(wain, lin(0, WAIN, 0, G, [[0, WOOD[0]], [0.5, WOOD[1]], [1, WOOD[2]]]), true, { lw: 0.8 });
    const rail = new Path2D();
    rail.rect(-10, WAIN - 4, W + 20, 6);
    P.add(rail, lin(0, WAIN - 4, 0, WAIN + 2, [[0, GILT[0]], [0.5, GILT[2]], [1, GILT[3]]]), true, { lw: 0.7 });
    for (let x = 0; x < W; x += 75) {
      const pnl = poly(cr([[x + 8, WAIN + 8], [x + 67, WAIN + 8], [x + 67, G - 8], [x + 8, G - 8]], true, 2));
      P.detail(pnl, lin(0, WAIN + 8, 0, G - 8, [[0, WOOD[2]], [0.2, WOOD[0]], [1, WOOD[1]]]), { stroke: GILT[2], slw: 0.9 });
      P.stroke([[x + 10, WAIN + 10], [x + 65, WAIN + 10]], 'rgba(255,230,190,0.35)', 0.6);
    }
    const base = new Path2D();
    base.rect(-10, G - 4, W + 20, 6);
    P.add(base, lin(0, G - 4, 0, G + 2, [[0, GILT[2]], [1, GILT[4]]]), true, { lw: 0.6 });
  }, { out: OUT, lw: 1.2 });
}
// A fluted marble pilaster, a gilt capital with two curling volutes, a gilt base.
function pilaster(P, px) {
  const top = BALL_CEIL + 12;
  const bot = WAIN - 4;
  const w = 13;
  const shaft = poly([[px - w, top + 18], [px + w, top + 18], [px + w, bot - 10], [px - w, bot - 10]]);
  P.add(shaft, lin(px - w, 0, px + w, 0, [[0, MARBLE[3]], [0.3, MARBLE[1]], [0.55, MARBLE[0]], [1, MARBLE[2]]]), true, { lw: 0.8 });
  for (const k of [-0.55, -0.18, 0.18, 0.55]) {
    P.stroke([[px + k * w * 1.6, top + 22], [px + k * w * 1.6, bot - 14]], rgba(MARBLE[3], 0.6), 1.4, { clip: shaft });
    P.stroke([[px + k * w * 1.6 + 1.2, top + 22], [px + k * w * 1.6 + 1.2, bot - 14]], 'rgba(255,255,255,0.7)', 0.5, { clip: shaft });
  }
  // the capital: an abacus slab, two volutes, a band of leaf
  P.add(poly(cr([[px - w - 6, top + 2], [px + w + 6, top + 2], [px + w + 4, top + 8], [px - w - 4, top + 8]], true, 2)), lin(0, top + 2, 0, top + 8, [[0, GILT[0]], [1, GILT[2]]]), true, { lw: 0.6 });
  for (const k of [-1, 1]) {
    const vx = px + k * (w + 2);
    P.add(ell(vx, top + 12, 5, 5), rad(vx - k, top + 11, 5, [[0, GILT[0]], [0.6, GILT[2]], [1, GILT[3]]]), true, { lw: 0.6 });
    P.stroke(cr([[vx, top + 12], [vx + k * 2, top + 10], [vx + k * 1, top + 14.6], [vx - k * 2.6, top + 12]], false, 4), GILT[4], 0.7);
  }
  P.add(poly(cr([[px - w, top + 9], [px + w, top + 9], [px + w - 1, top + 18], [px - w + 1, top + 18]], true, 2)), lin(0, top + 9, 0, top + 18, [[0, GILT[1]], [1, GILT[3]]]), true, { lw: 0.6 });
  for (let i = -2; i <= 2; i++) P.detail(poly(cr([[px + i * 5, top + 17], [px + i * 5 - 2.4, top + 12], [px + i * 5, top + 9.6], [px + i * 5 + 2.4, top + 12]], true, 3)), GILT[0], { stroke: GILT[3], slw: 0.4 });
  // the base
  P.add(poly(cr([[px - w - 3, bot - 10], [px + w + 3, bot - 10], [px + w + 5, bot], [px - w - 5, bot]], true, 2)), lin(0, bot - 10, 0, bot, [[0, GILT[1]], [1, GILT[3]]]), true, { lw: 0.6 });
  // the sconce: a gilt backplate and three curling arms holding candles (the flames are live)
  const sy = SCONCE_Y;
  P.add(poly(cr([[px, sy - 18], [px + 6, sy - 8], [px + 5, sy + 6], [px, sy + 12], [px - 5, sy + 6], [px - 6, sy - 8]], true, 3)), lin(px - 6, 0, px + 6, 0, [[0, GILT[3]], [0.5, GILT[0]], [1, GILT[2]]]), true, { lw: 0.6 });
  for (const k of [-1, 0, 1]) {
    const cx = px + k * 15;
    const cy = sy - (k ? 6 : 12);
    P.band(null, [[px, sy + 4], [px + k * 8, sy + 8], [cx, sy + 2], [cx, cy + 10]], swell(2, 1.2), GILT[2], { n: 6 });
    P.add(poly(cr([[cx - 4, cy + 10], [cx + 4, cy + 10], [cx + 3, cy + 13], [cx - 3, cy + 13]], true, 2)), GILT[1], true, { lw: 0.5 });
    P.add(poly([[cx - 1.8, cy], [cx + 1.8, cy], [cx + 1.8, cy + 10], [cx - 1.8, cy + 10]]), lin(cx - 2, 0, cx + 2, 0, [[0, '#f4eee0'], [1, '#d8ccb4']]), true, { lw: 0.4 });
  }
}
// A bay: an arched mirror, a moonlit window between plum drapes, or the clock's velvet alcove.
function bay(P, bx, kind) {
  const { half: h, apex, spring, bot } = ARCH;
  const outer = archPath(bx, h + 7, apex - 7, spring, bot + 2);
  const inner = archPath(bx, h, apex, spring, bot);
  if (kind === 'clock') {
    // a deep alcove of violet velvet, its gilt arch, a gilt shelf the clock stands over
    P.add(outer, lin(bx - h, 0, bx + h, 0, [[0, GILT[3]], [0.4, GILT[1]], [0.6, GILT[0]], [1, GILT[2]]]), true, { lw: 0.9 });
    P.detail(inner, lin(0, apex, 0, bot, [[0, '#1a0e2e'], [0.5, '#3a1e58'], [1, '#2a143e']]));
    for (let k = -3; k <= 3; k++) P.band(inner, [[bx + k * 14, apex], [bx + k * 14 + 2, spring + 40], [bx + k * 13, bot]], swell(5, 1), rgba(k % 2 ? '#5a3484' : '#140a24', 0.45), { blur: 1.4 });
    P.add(poly(cr([[bx - h - 4, CLOCK.y + CLOCK.r + 8], [bx + h + 4, CLOCK.y + CLOCK.r + 8], [bx + h, CLOCK.y + CLOCK.r + 14], [bx - h, CLOCK.y + CLOCK.r + 14]], true, 2)), lin(0, CLOCK.y + CLOCK.r + 8, 0, CLOCK.y + CLOCK.r + 14, [[0, GILT[0]], [1, GILT[3]]]), true, { lw: 0.7 });
    crest(P, bx, apex - 8, 1.2);
    return;
  }
  if (kind === 'mirror') {
    P.add(outer, lin(bx - h, apex, bx + h, bot, [[0, GILT[1]], [0.3, GILT[0]], [0.55, GILT[2]], [0.8, GILT[1]], [1, GILT[3]]]), true, { lw: 1 });
    // a fine inner gilt bead
    P.detail(archPath(bx, h + 3, apex - 3, spring, bot + 1), 'rgba(0,0,0,0)', { stroke: GILT[3], slw: 0.8 });
    // the glass: cool lilac and blue, a reflection of the window across the room (an arch of moonlight),
    // a broad diagonal light, a bevelled edge
    P.detail(inner, lin(0, apex, 0, bot, [[0, '#d8dcf6'], [0.35, '#a8a4dc'], [0.6, '#8a7ec8'], [1, '#b8acde']]));
    P.detail(archPath(bx + 6, h * 0.55, apex + 26, spring + 20, bot - 30), lin(0, apex, 0, bot, [[0, 'rgba(40,36,110,0.45)'], [1, 'rgba(90,74,168,0.2)']]), { clip: inner });
    P.detail(ell(bx + 12, spring + 16, 9, 9), 'rgba(255,250,230,0.5)', { clip: inner, blur: 1.4 });
    P.detail(poly([[bx - h, bot - 40], [bx - h + 30, bot], [bx - h + 54, bot], [bx - h, bot - 96]]), 'rgba(255,255,255,0.22)', { clip: inner });
    P.detail(poly([[bx - 10, apex], [bx + 10, apex], [bx + h, spring + 60], [bx + h, spring + 90]]), 'rgba(255,255,255,0.16)', { clip: inner });
    P.detail(inner, 'rgba(0,0,0,0)', { stroke: 'rgba(255,255,255,0.6)', slw: 1.2 });
    crest(P, bx, apex - 9, 1);
    return;
  }
  // a window: the night sky, stars and (in one) the moon; gilt-dark mullions; plum drapes tied back
  P.add(outer, lin(bx - h, 0, bx + h, 0, [[0, NOIR[1]], [0.5, NOIR[0]], [1, NOIR[2]]]), true, { lw: 1 });
  P.detail(inner, lin(0, apex, 0, bot, [[0, SKY[0]], [0.45, SKY[1]], [0.85, SKY[2]], [1, SKY[3]]]));
  if (bx === 1050) {
    P.detail(ell(bx + 10, spring + 8, 18, 18), rad(bx + 10, spring + 8, 30, [[0, 'rgba(255,250,230,0.95)'], [0.55, 'rgba(255,250,230,0.95)'], [0.62, 'rgba(230,220,255,0.35)'], [1, 'rgba(230,220,255,0)']]), { clip: inner });
    P.detail(ell(bx + 15, spring + 4, 4, 3), 'rgba(220,210,240,0.5)', { clip: inner });
    P.detail(ell(bx + 4, spring + 14, 3, 2.4), 'rgba(220,210,240,0.45)', { clip: inner });
  }
  for (let i = 0; i < 7; i++) {
    const sx = bx - h + 8 + ((i * 37 + bx) % (h * 2 - 16));
    const sy = apex + 14 + ((i * 53 + bx * 3) % 90);
    P.detail(poly(cr([[sx, sy - 2.4], [sx + 0.6, sy - 0.6], [sx + 2.4, sy], [sx + 0.6, sy + 0.6], [sx, sy + 2.4], [sx - 0.6, sy + 0.6], [sx - 2.4, sy], [sx - 0.6, sy - 0.6]], true, 2)), 'rgba(255,250,235,0.85)', { clip: inner });
  }
  // mullions and the leaded panes
  P.band(inner, [[bx, apex], [bx, bot]], () => 3, NOIR[2], { n: 1 });
  for (const yy of [spring, spring + 46, spring + 88]) P.band(inner, [[bx - h, yy], [bx + h, yy]], () => 2.4, NOIR[2], { n: 1 });
  P.band(inner, [[bx - h * 0.5, spring], [bx - h * 0.5, bot]], () => 1.2, NOIR[1], { n: 1 });
  P.band(inner, [[bx + h * 0.5, spring], [bx + h * 0.5, bot]], () => 1.2, NOIR[1], { n: 1 });
  P.detail(inner, lin(bx - h, 0, bx + h, 0, [[0, 'rgba(200,190,255,0.12)'], [0.5, 'rgba(200,190,255,0)'], [1, 'rgba(200,190,255,0.1)']]));
  drapes(P, bx, h);
}
// A little gilt crest over an arch: a scroll either side of a shell.
function crest(P, x, y, s) {
  for (const k of [-1, 1]) P.add(poly(cr([[x, y + 3 * s], [x + k * 6 * s, y - 2 * s], [x + k * 12 * s, y + 1 * s], [x + k * 10 * s, y + 5 * s], [x + k * 7 * s, y + 3 * s], [x + k * 4 * s, y + 5 * s]], true, 3)), lin(0, y - 3 * s, 0, y + 6 * s, [[0, GILT[0]], [1, GILT[2]]]), true, { lw: 0.6 });
  const shell = poly(cr([[x - 6 * s, y + 4 * s], [x - 5 * s, y - 4 * s], [x, y - 8 * s], [x + 5 * s, y - 4 * s], [x + 6 * s, y + 4 * s]], true, 4));
  P.add(shell, rad(x, y - 2 * s, 8 * s, [[0, GILT[0]], [0.7, GILT[1]], [1, GILT[3]]]), true, { lw: 0.6 });
  for (let i = -2; i <= 2; i++) P.stroke([[x, y + 4 * s], [x + i * 2.4 * s, y - 6 * s]], rgba(GILT[3], 0.7), 0.5 * s, { clip: shell });
}
// Plum velvet drapes either side of a window, gathered and tied back with a gold rope and tassel, a
// swagged pelmet over the top.
function drapes(P, bx, h) {
  const { apex, bot } = ARCH;
  for (const k of [-1, 1]) {
    const x0 = bx + k * (h + 10);
    const tie = bot - 70;
    const pts = [[x0 + k * 6, apex - 18], [x0 - k * 26, apex - 14], [x0 - k * 16, apex + 40], [x0 - k * 6, tie], [x0 - k * 14, tie + 20], [x0 - k * 24, bot + 2], [x0 + k * 8, bot + 2], [x0 + k * 6, tie + 8], [x0 + k * 10, apex + 40]];
    const curtain = poly(cr(pts, true, 6));
    P.add(curtain, lin(x0 - 20, 0, x0 + 20, 0, k < 0 ? [[0, PLUM[2]], [0.45, PLUM[1]], [0.7, PLUM[0]], [1, PLUM[2]]] : [[0, PLUM[2]], [0.3, PLUM[0]], [0.55, PLUM[1]], [1, PLUM[3]]]), true, { lw: 1 });
    // its folds: deep shade and a soft sheen down each
    for (const f of [-10, -3, 4]) {
      P.band(curtain, [[x0 - k * f, apex - 10], [x0 - k * (f + 2), apex + 60], [x0 - k * (f * 0.5), tie], [x0 - k * (f + 8), bot]], swell(2.6, 0.4), rgba(PLUM[3], 0.5), { blur: 0.8 });
      P.band(curtain, [[x0 - k * (f + 3), apex - 6], [x0 - k * (f + 5), apex + 60], [x0 - k * (f * 0.5 + 3), tie], [x0 - k * (f + 11), bot]], swell(1.2, 0.2), rgba(PLUM[0], 0.5), { blur: 0.5 });
    }
    // the gold rope and its tassel
    P.band(null, [[x0 - k * 12, tie + 2], [x0 - k * 2, tie + 6], [x0 + k * 8, tie + 2]], swell(2.4, 1.6), GILT[2], { n: 6 });
    const ty = tie + 8;
    const tx = x0 + k * 8;
    P.add(ell(tx, ty, 2.6, 2.6), GILT[1], true, { lw: 0.5 });
    P.add(poly(cr([[tx - 2.4, ty + 2], [tx + 2.4, ty + 2], [tx + 4, ty + 14], [tx - 4, ty + 14]], true, 2)), lin(tx - 4, 0, tx + 4, 0, [[0, GILT[3]], [0.5, GILT[0]], [1, GILT[2]]]), true, { lw: 0.5 });
  }
  // the pelmet: a swag of velvet across the top, a gilt rod
  const sw = poly(cr([[bx - h - 30, apex - 20], [bx + h + 30, apex - 20], [bx + h + 24, apex - 6], [bx, apex + 14], [bx - h - 24, apex - 6]], true, 6));
  P.add(sw, lin(0, apex - 20, 0, apex + 14, [[0, PLUM[1]], [0.6, PLUM[0]], [1, PLUM[2]]]), true, { lw: 1 });
  P.band(sw, [[bx - h - 20, apex - 12], [bx, apex + 4], [bx + h + 20, apex - 12]], swell(2, 0.2), rgba(PLUM[3], 0.45), { blur: 0.6 });
  P.add(poly(cr([[bx - h - 34, apex - 24], [bx + h + 34, apex - 24], [bx + h + 34, apex - 19], [bx - h - 34, apex - 19]], true, 2)), lin(0, apex - 24, 0, apex - 19, [[0, GILT[0]], [1, GILT[3]]]), true, { lw: 0.6 });
}

// ---------- The ledges ----------
// A gilt balcony: a marble floor slab with a gilt rim, a balustrade of turned balusters, a velvet swag
// hung along its front with tassels, a carved bracket beneath it to the wall.
function balconyPiece(w) {
  return piece(`twroom:balcony:${w}`, [-10, -36, w + 10, 64], (P) => {
    // the bracket under it
    for (const bx of [w * 0.2, w * 0.8]) P.add(poly(cr([[bx - 10, 8], [bx + 10, 8], [bx + 6, 26], [bx, 54], [bx - 6, 26]], true, 4)), lin(bx - 10, 0, bx + 10, 0, [[0, GILT[3]], [0.5, GILT[1]], [1, GILT[3]]]), true, { lw: 0.8 });
    // the slab
    P.add(poly(cr([[-6, 0], [w + 6, 0], [w + 4, 10], [-4, 10]], true, 2)), lin(0, 0, 0, 10, [[0, MARBLE[0]], [0.5, MARBLE[1]], [1, MARBLE[3]]]), true, { lw: 0.9 });
    P.add(poly([[-6, 7], [w + 6, 7], [w + 5, 11], [-5, 11]]), lin(0, 7, 0, 11, [[0, GILT[0]], [1, GILT[3]]]), true, { lw: 0.6 });
    // the balustrade: a rail on turned balusters
    const n = Math.max(4, Math.round(w / 16));
    for (let i = 0; i <= n; i++) {
      const x = (w * i) / n;
      P.add(poly(cr([[x - 2.2, -2], [x + 2.2, -2], [x + 3.6, -9], [x + 1.6, -14], [x + 3, -22], [x - 3, -22], [x - 1.6, -14], [x - 3.6, -9]], true, 3)), lin(x - 3, 0, x + 3, 0, [[0, MARBLE[2]], [0.4, MARBLE[0]], [1, MARBLE[3]]]), true, { lw: 0.5 });
    }
    P.add(poly(cr([[-6, -28], [w + 6, -28], [w + 6, -22], [-6, -22]], true, 2)), lin(0, -28, 0, -22, [[0, GILT[0]], [0.5, GILT[1]], [1, GILT[3]]]), true, { lw: 0.7 });
    // the velvet swags along its front, a tassel between
    const sn = Math.max(2, Math.round(w / 70));
    for (let i = 0; i < sn; i++) {
      const x0 = (w * i) / sn;
      const x1 = (w * (i + 1)) / sn;
      const sw = poly(cr([[x0, 9], [x1, 9], [x1 - 2, 14], [(x0 + x1) / 2, 26], [x0 + 2, 14]], true, 6));
      P.add(sw, lin(0, 9, 0, 26, [[0, PLUM[0]], [0.5, PLUM[1]], [1, PLUM[2]]]), true, { lw: 0.8 });
      P.band(sw, [[x0 + 6, 12], [(x0 + x1) / 2, 20], [x1 - 6, 12]], swell(1.4, 0.1), rgba(PLUM[0], 0.6), { blur: 0.4 });
      P.add(poly(cr([[x1 - 2, 10], [x1 + 2, 10], [x1 + 3, 22], [x1 - 3, 22]], true, 2)), lin(x1 - 3, 0, x1 + 3, 0, [[0, GILT[3]], [0.5, GILT[0]], [1, GILT[2]]]), true, { lw: 0.5 });
    }
  }, { out: OUT, lw: 1.1 });
}
// A marble pedestal for a landing: a round top with a gilt edge on a fluted column down to the floor.
function plinthPiece(w, h) {
  return piece(`twroom:plinth:${w}:${h}`, [-12, -6, w + 12, h + 4], (P) => {
    const c = w / 2;
    const cw = w * 0.22;
    const col = poly([[c - cw, 8], [c + cw, 8], [c + cw, h - 10], [c - cw, h - 10]]);
    P.add(col, lin(c - cw, 0, c + cw, 0, [[0, MARBLE[3]], [0.35, MARBLE[0]], [1, MARBLE[2]]]), true, { lw: 0.8 });
    for (const k of [-0.5, 0, 0.5]) P.stroke([[c + k * cw, 12], [c + k * cw, h - 14]], rgba(MARBLE[3], 0.6), 1, { clip: col });
    P.add(poly(cr([[c - cw - 8, h - 10], [c + cw + 8, h - 10], [c + cw + 12, h], [c - cw - 12, h]], true, 2)), lin(0, h - 10, 0, h, [[0, GILT[1]], [1, GILT[3]]]), true, { lw: 0.7 });
    P.add(poly(cr([[-6, 0], [w + 6, 0], [w + 2, 8], [c + cw + 4, 12], [c - cw - 4, 12], [-2, 8]], true, 3)), lin(0, 0, 0, 12, [[0, MARBLE[0]], [0.5, MARBLE[1]], [1, MARBLE[3]]]), true, { lw: 0.9 });
    P.add(poly([[-6, 4], [w + 6, 4], [w + 5, 7], [-5, 7]]), lin(0, 4, 0, 7, [[0, GILT[0]], [1, GILT[3]]]), true, { lw: 0.5 });
    P.detail(ell(c, h + 1, w * 0.6, 3), 'rgba(10,0,30,0.25)', { blur: 1.5 });
  }, { out: OUT, lw: 1.1 });
}
// The chandelier, its crown the ledge (w wide): a gilt crown ring, two tiers of curling arms holding
// candles, festoons and drops of crystal, a great crystal at its foot, its chain up to the medallion.
function chandelierPiece(w, up) {
  return piece(`twroom:chandelier:${w}:${up}`, [-40, -up - 4, w + 40, 92], (P) => {
    const c = w / 2;
    // the chain up to the ceiling's medallion
    for (let y = -up; y < -6; y += 7) P.add(ell(c, y + 3.5, 2.2, 3.6), lin(c - 2, 0, c + 2, 0, [[0, GILT[3]], [0.5, GILT[0]], [1, GILT[2]]]), true, { lw: 0.5 });
    // the crown ring (the ledge's top): a band of gilt with little fleurons along its top
    for (let i = 0; i <= 6; i++) {
      const x = (w * i) / 6;
      P.add(poly(cr([[x - 4, 2], [x, -8], [x + 4, 2]], true, 3)), lin(0, -8, 0, 2, [[0, GILT[0]], [1, GILT[2]]]), true, { lw: 0.5 });
    }
    P.add(poly(cr([[-8, 0], [w + 8, 0], [w + 4, 10], [-4, 10]], true, 2)), lin(0, 0, 0, 10, [[0, GILT[0]], [0.4, GILT[1]], [0.7, GILT[2]], [1, GILT[3]]]), true, { lw: 0.9 });
    // the arms: two tiers curling out and up to candle cups
    const arm = (x, y, tx, ty) => P.band(null, [[x, y], [lerp(x, tx, 0.4), y + 14], [tx, ty + 12], [tx, ty]], swell(2.6, 1.4), GILT[2], { n: 8 });
    const cups = [];
    for (const [k, dy, reach] of [[1, 10, 1.05], [0.6, 30, 0.8]]) {
      for (let i = 0; i < 5; i++) {
        const tx = c + (i - 2) * (w / 4) * reach * k * 1.4;
        const ty = dy - 4;
        arm(c, dy + 12, tx, ty);
        cups.push([tx, ty]);
      }
    }
    for (const [tx, ty] of cups) {
      P.add(poly(cr([[tx - 5, ty], [tx + 5, ty], [tx + 3, ty + 4], [tx - 3, ty + 4]], true, 2)), GILT[1], true, { lw: 0.5 });
      P.add(poly([[tx - 1.6, ty - 10], [tx + 1.6, ty - 10], [tx + 1.6, ty], [tx - 1.6, ty]]), lin(tx - 2, 0, tx + 2, 0, [[0, '#fbf6ea'], [1, '#d8ccb4']]), true, { lw: 0.4 });
    }
    // the body: a gilt bowl and stem
    P.add(poly(cr([[c - 16, 12], [c + 16, 12], [c + 10, 30], [c + 4, 46], [c - 4, 46], [c - 10, 30]], true, 4)), lin(c - 16, 0, c + 16, 0, [[0, GILT[3]], [0.4, GILT[0]], [1, GILT[2]]]), true, { lw: 0.8 });
    // the crystal: festoons swinging between the arms, drops hanging from every cup, the great prism
    const crystal = (x, y, s) => {
      P.add(poly([[x, y - s], [x + s * 0.55, y], [x, y + s * 1.4], [x - s * 0.55, y]]), lin(x - s, y - s, x + s, y + s, [[0, '#ffffff'], [0.4, '#e2e6ff'], [0.6, '#f6e2ff'], [1, '#b8c0ee']]), true, { lw: 0.4 });
      P.stroke([[x, y - s], [x, y + s * 1.4]], 'rgba(255,255,255,0.8)', 0.3);
    };
    for (let i = 0; i < cups.length - 1; i++) {
      if (i === 4) continue;
      const [ax, ay] = cups[i];
      const [bx, by] = cups[i + 1];
      for (let j = 1; j < 5; j++) {
        const u = j / 5;
        crystal(lerp(ax, bx, u), lerp(ay, by, u) + 5 + Math.sin(Math.PI * u) * 8, 1.4);
      }
    }
    for (const [tx, ty] of cups) crystal(tx, ty + 9, 2.4);
    crystal(c, 58, 5.4);
    for (const k of [-1, 1]) crystal(c + k * 8, 52, 3.2);
  }, { out: OUT, lw: 1 });
}

// ---------- Drawing ----------
const stoppedNow = (world) => Boolean(world?.dungeon?.room?.twins?.stop);
// (render/scenery.js BEHIND_GROUND: map, cam, width, time; world read from the module's last one)
let lastWorld = null;
export function noteTwinsWorld(world) {
  lastWorld = world;
}
// ---------- Their entrance (data/scenes.js manor_twins) ----------
// Read from the twins' scene moves (m.cine.act, on the scene's own clock): before it and while they are
// 'away' the ballroom is dark, the candles out, the instruments silent, the clock creeping toward twelve;
// as it strikes ('chime') the candles light one by one from the clock outward and the instruments begin;
// 'mirror': their reflections waltz in the mirrors, together, then apart, each to her own mirror.
function introOf(world) {
  if (!world) return null;
  const r = world.mobs.find((m) => m.def.id === 'waltzrondo');
  const n = world.mobs.find((m) => m.def.id === 'waltzminuet');
  if (r?.mech?.placed || n?.mech?.placed) return null;
  const act = r?.cine?.act ?? n?.cine?.act ?? null;
  const now = world.now + (world.cine?.clock ?? 0);
  const u = act ? clamp((now - act.at) / Math.max(0.2, act.dur), 0, 1) : 0;
  if (!act) return r?.offstage || n?.offstage ? { move: 'away', u: 0, now } : null;
  return { move: act.move, u, now };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// How lit the room is (0 dark .. 1), and whether a sconce (its order out from the clock) is lit.
function litOf(intro) {
  if (!intro) return 1;
  if (intro.move === 'away') return 0;
  if (intro.move === 'chime') return ease((intro.u - 0.18) / 0.7);
  return 1;
}
function candleOn(intro, rank) {
  if (!intro) return 1;
  if (intro.move === 'away') return 0;
  if (intro.move === 'chime') return ease((intro.u - 0.2 - rank * 0.07) / 0.06);
  return 1;
}
// The reflections: the twins' own rigs, drawn in the glass, see-through and cool.
const REFL = {};
function reflection(ctx, key, art, id, x, y, now, o) {
  const r = (REFL[key] ??= { m: { def: { id, h: 96, w: 46, boss: true, fight: {} }, uid: key.length + 11, hp: 1, x: 0, y: 0, dir: 1, heading: 1, flash: 0, fightTest: true }, mo: { rig: null }, last: now });
  const dt = clamp(now - r.last, 0, 0.05);
  r.last = now;
  r.m.castTest = o.cast;
  r.m.dir = o.dir;
  const a = { t: now, now, dt, mood: 'calm', moving: false, mo: r.mo, hurtAgo: 9, flip: o.dir < 0, flash: 0, alpha: o.alpha, walkW: 0 };
  ctx.save();
  ctx.translate(x, y);
  if (o.turn) {
    ctx.translate(0, -48);
    ctx.rotate(o.turn);
    ctx.translate(0, 48);
  }
  if (o.dir < 0) ctx.scale(-1, 1);
  art.rig.draw(ctx, r.m, a);
  ctx.restore();
}
function drawReflections(ctx, intro) {
  const mv = intro?.move;
  if ((mv !== 'mirror' && mv !== 'stepout') || !TWIN_ARTS.rondo || !TWIN_ARTS.minuet) return;
  const u = mv === 'mirror' ? intro.u : 1;
  const out = mv === 'stepout' ? 1 - ease(intro.u / 0.6) : 1;
  const now = intro.now;
  const L = 600;
  const R = 900;
  const bot = ARCH.bot - 4;
  // (together in Rondo's mirror and, reflected, in Minuet's; then apart, each to her own; Minuet turning
  // upside down in her glass before she steps out)
  const together = 1 - ease((u - 0.42) / 0.12);
  const apart = ease((u - 0.5) / 0.12);
  const sway = Math.sin(now * 2.4) * 6;
  const spin = { name: 'swap', u: (now * 0.35) % 1 };
  for (const [bx, flip] of [[L, 1], [R, -1]]) {
    ctx.save();
    ctx.clip(archPath(bx, ARCH.half, ARCH.apex, ARCH.spring, ARCH.bot));
    // a soft lilac haze in the glass behind them
    const hz = ctx.createRadialGradient(bx, bot - 50, 0, bx, bot - 50, 70);
    hz.addColorStop(0, `rgba(235,226,255,${0.35 * out})`);
    hz.addColorStop(1, 'rgba(235,226,255,0)');
    ctx.fillStyle = hz;
    ctx.fillRect(bx - 60, ARCH.apex, 120, ARCH.bot - ARCH.apex);
    if (together > 0.01) {
      reflection(ctx, `r${bx}t`, TWIN_ARTS.rondo, 'waltzrondo', bx - 16 * flip + sway, bot, now, { cast: spin, dir: flip, alpha: 0.6 * together * out });
      reflection(ctx, `m${bx}t`, TWIN_ARTS.minuet, 'waltzminuet', bx + 16 * flip + sway, bot, now, { cast: spin, dir: -flip, alpha: 0.6 * together * out });
    }
    if (apart > 0.01) {
      const solo = bx === L;
      const turn = solo ? 0 : Math.PI * ease((u - 0.75) / 0.2);
      reflection(ctx, `${solo ? 'r' : 'm'}${bx}s`, solo ? TWIN_ARTS.rondo : TWIN_ARTS.minuet, solo ? 'waltzrondo' : 'waltzminuet', bx + sway * 0.5, turn > 0.01 ? bot - (turn / Math.PI) * 30 : bot, now, {
        cast: { name: 'mirror', u: 0.6 }, dir: solo ? 1 : 1, alpha: 0.65 * apart * out, turn,
      });
    }
    ctx.restore();
  }
}
export function drawTwinsHall(ctx, map, cam, width, time) {
  if (map.id !== 'manor3') return;
  const world = lastWorld?.map === map ? lastWorld : null;
  const stop = stoppedNow(world);
  const intro = introOf(world);
  const lit = litOf(intro);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  drawPiece(ctx, ceilingPiece(), 'line');
  drawPiece(ctx, ceilingPiece(), 'fill');
  drawPiece(ctx, wallPiece(), 'line');
  drawPiece(ctx, wallPiece(), 'fill');
  // the chandelier's warm light on the ceiling marble round it
  const g = ctx.createRadialGradient(750, BALL_CEIL - 20, 0, 750, BALL_CEIL - 20, 220);
  g.addColorStop(0, `rgba(255,226,170,${0.22 + 0.03 * Math.sin(time * 3)})`);
  g.addColorStop(1, 'rgba(255,226,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(530, -40, 440, BALL_CEIL + 30);
  // the moonbeams from the windows, falling across the floor, dust drifting in them
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  BAYS.forEach((bx, i) => {
    if (KIND[i] !== 'window') return;
    const gb = ctx.createLinearGradient(bx, ARCH.spring, bx + 90, G);
    gb.addColorStop(0, 'rgba(170,160,255,0.11)');
    gb.addColorStop(1, 'rgba(170,160,255,0)');
    ctx.fillStyle = gb;
    ctx.beginPath();
    ctx.moveTo(bx - ARCH.half + 6, ARCH.spring);
    ctx.lineTo(bx + ARCH.half - 6, ARCH.spring);
    ctx.lineTo(bx + ARCH.half + 90, G);
    ctx.lineTo(bx - ARCH.half + 40, G);
    ctx.closePath();
    ctx.fill();
  });
  ctx.restore();
  BAYS.forEach((bx, i) => {
    if (KIND[i] !== 'window') return;
    for (let k = 0; k < 4; k++) {
      const u = (time * 0.05 + k * 0.25 + bx * 0.001) % 1;
      const x = bx - 30 + u * 110 + Math.sin(time * 0.7 + k * 2 + bx) * 6;
      const y = ARCH.spring + 20 + u * (G - ARCH.spring - 30);
      sparkleAt(ctx, x, y, 1.3 * Math.sin(Math.PI * u), 0.7);
    }
  });
  // the mirrors' light: a gleam sliding down each; ruby while time is stopped
  BAYS.forEach((bx, i) => {
    if (KIND[i] !== 'mirror') return;
    ctx.save();
    ctx.clip(archPath(bx, ARCH.half, ARCH.apex, ARCH.spring, ARCH.bot));
    const u = ((time * 0.18 + i * 0.37) % 1.6) - 0.3;
    const y0 = lerp(ARCH.apex - 40, ARCH.bot + 40, u);
    const lg = ctx.createLinearGradient(0, y0 - 30, 0, y0 + 30);
    lg.addColorStop(0, 'rgba(255,255,255,0)');
    lg.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    lg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.moveTo(bx - 60, y0 + 20);
    ctx.lineTo(bx + 60, y0 - 20);
    ctx.lineTo(bx + 60, y0 + 10);
    ctx.lineTo(bx - 60, y0 + 50);
    ctx.closePath();
    ctx.fill();
    if (stop) {
      ctx.fillStyle = `rgba(216,40,60,${0.28 + 0.08 * Math.sin(time * 8)})`;
      ctx.fillRect(bx - 60, ARCH.apex - 10, 120, ARCH.bot - ARCH.apex + 20);
    }
    ctx.restore();
  });
  // their reflections dancing in the mirrors
  drawReflections(ctx, intro);
  // the great clock: stopped at twelve; its second hand shudders, and it glows ruby, while time is stopped.
  // Before their entrance it creeps the last minute to twelve, and as it strikes a ring of sound rolls out
  let hand = Math.PI * 2 * 12;
  let sec = stop ? Math.sin(time * 40) * 0.05 : Math.sin(time * 1.6) * 0.02;
  if (intro && (intro.move === 'away' || intro.move === 'chime')) {
    const k = intro.move === 'chime' ? ease(intro.u / 0.16) : 0;
    hand = Math.PI * 2 * (12 - (1 - k) / 60);
    sec = Math.PI * 2 * (k - 1) * 0.25 + (intro.move === 'away' ? (intro.now % 1) * 0.1 : 0);
    if (intro.move === 'chime') {
      const ring = clamp((intro.u - 0.16) / 0.5, 0, 1);
      if (ring > 0 && ring < 1) {
        for (let k2 = 0; k2 < 3; k2++) {
          const q = clamp(ring * 1.3 - k2 * 0.15, 0, 1);
          ctx.save();
          ctx.globalAlpha = 1 - q;
          ctx.beginPath();
          ctx.ellipse(CLOCK.x, CLOCK.y, CLOCK.r + q * 300, (CLOCK.r + q * 300) * 0.7, 0, 0, TAU);
          ctx.strokeStyle = k2 % 2 ? GILT[1] : 'rgba(255,120,130,0.9)';
          ctx.lineWidth = 3 * (1 - q) + 1;
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }
  ornateClock(ctx, CLOCK.x, CLOCK.y, CLOCK.r, hand, 1, 'ruby', stop ? time * 0.2 : time * 0.6, { sec });
  if (stop) {
    const rg = ctx.createRadialGradient(CLOCK.x, CLOCK.y, 0, CLOCK.x, CLOCK.y, 90);
    rg.addColorStop(0, `rgba(255,80,100,${0.3 + 0.1 * Math.sin(time * 6)})`);
    rg.addColorStop(1, 'rgba(255,80,100,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(CLOCK.x - 90, CLOCK.y - 90, 180, 180);
  }
  // the sconces' candle flames (lit one by one from the clock outward as it strikes)
  for (const px of PILLARS) {
    const on = candleOn(intro, Math.round(Math.abs(px - CLOCK.x) / 150));
    if (on <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = on;
    for (const k of [-1, 0, 1]) flame(ctx, px + k * 15, SCONCE_Y - (k ? 6 : 12), time + px * 0.01 + k, 0.4 + 0.6 * on);
    if (on < 0.95) sparkle(ctx, px, SCONCE_Y - 14, 6 * (1 - on), 1, '#fff2c8');
    ctx.restore();
  }
  // the ghost instruments, playing by themselves (they begin with the chime)
  const play = intro ? (intro.move === 'away' ? 0 : intro.move === 'chime' ? ease((intro.u - 0.45) / 0.3) : 1) : 1;
  if (play > 0.01) {
    ctx.save();
    ctx.globalAlpha = play;
    harp(ctx, 196, 214 + Math.sin(time * 1.2) * 3, time);
    violin(ctx, 1304, 210 + Math.sin(time * 1.3 + 1) * 3, time);
    ctx.restore();
  }
  ctx.restore();
}
function sparkleAt(ctx, x, y, s, al) {
  if (s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - s * 2);
  ctx.quadraticCurveTo(x + s * 0.3, y - s * 0.3, x + s * 2, y);
  ctx.quadraticCurveTo(x + s * 0.3, y + s * 0.3, x, y + s * 2);
  ctx.quadraticCurveTo(x - s * 0.3, y + s * 0.3, x - s * 2, y);
  ctx.quadraticCurveTo(x - s * 0.3, y - s * 0.3, x, y - s * 2);
  ctx.fill();
  ctx.restore();
}
// A candle flame: a warm glow, a teardrop of gold with a white heart, flickering.
function flame(ctx, x, y, t, s) {
  const f = 1 + Math.sin(t * 13) * 0.08 + Math.sin(t * 7.3) * 0.06;
  const lean = Math.sin(t * 3.1) * 0.6;
  const g = ctx.createRadialGradient(x, y - 3, 0, x, y - 3, 14 * s);
  g.addColorStop(0, 'rgba(255,214,140,0.45)');
  g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 14 * s, y - 17 * s, 28 * s, 28 * s);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x - 2.6 * s, y - 2.6 * s * f, x + lean, y - 7 * s * f);
  ctx.quadraticCurveTo(x + 2.6 * s, y - 2.6 * s * f, x, y);
  ctx.fillStyle = '#ffc860';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x, y - 0.4);
  ctx.quadraticCurveTo(x - 1.2 * s, y - 2 * s, x + lean * 0.6, y - 4.4 * s * f);
  ctx.quadraticCurveTo(x + 1.2 * s, y - 2 * s, x, y - 0.4);
  ctx.fillStyle = '#fff8e0';
  ctx.fill();
}
// The ghost instruments: soft lilac-white, see-through, glowing a little; notes rising as they play.
function ghostly(ctx, fn, x, y) {
  ctx.save();
  ctx.translate(x, y);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 40);
  g.addColorStop(0, 'rgba(220,206,255,0.3)');
  g.addColorStop(1, 'rgba(220,206,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-40, -40, 80, 80);
  ctx.globalAlpha *= 0.85;
  fn();
  ctx.restore();
}
function noteGlyph(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = 'rgba(246,240,255,0.95)';
  ctx.strokeStyle = 'rgba(120,96,180,0.9)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(x, y, s * 1.1, s * 0.8, -0.4, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + s, y);
  ctx.lineTo(x + s, y - s * 3.6);
  ctx.quadraticCurveTo(x + s * 2.6, y - s * 2.6, x + s * 2, y - s * 1.4);
  ctx.stroke();
  ctx.restore();
}
function harp(ctx, x, y, time) {
  ghostly(ctx, () => {
    ctx.lineCap = 'round';
    // its frame: the curved neck, the pillar, the soundboard
    ctx.beginPath();
    ctx.moveTo(-10, 16);
    ctx.quadraticCurveTo(-14, -6, -6, -20);
    ctx.quadraticCurveTo(4, -26, 12, -16);
    ctx.quadraticCurveTo(14, 0, 8, 16);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(250,244,255,0.95)';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,120,210,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // its strings, one shivering as it's plucked
    for (let i = 0; i < 6; i++) {
      const sx = -7 + i * 3;
      const pl = Math.sin(time * 9 + i * 2.1) > 0.9 ? Math.sin(time * 60) * 0.8 : 0;
      ctx.beginPath();
      ctx.moveTo(sx, -18 + Math.abs(i - 2.5) * 1.4);
      ctx.quadraticCurveTo(sx + pl, 0, sx + 1, 14);
      ctx.strokeStyle = 'rgba(255,250,235,0.7)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    for (let k = 0; k < 2; k++) {
      const u = (time * 0.4 + k * 0.5) % 1;
      noteGlyph(ctx, 10 + u * 10, -20 - u * 22, 2, Math.sin(Math.PI * u));
    }
  }, x, y);
}
function violin(ctx, x, y, time) {
  ghostly(ctx, () => {
    ctx.rotate(-0.5);
    // its body: two rounded bouts and a waist, f-holes, the neck and scroll
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.bezierCurveTo(7, -12, 7, -5, 4, -3);
    ctx.bezierCurveTo(8, 0, 8, 10, 0, 11);
    ctx.bezierCurveTo(-8, 10, -8, 0, -4, -3);
    ctx.bezierCurveTo(-7, -5, -7, -12, 0, -12);
    ctx.fillStyle = 'rgba(246,238,255,0.5)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(250,244,255,0.95)';
    ctx.lineWidth = 1.6;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(150,120,210,0.8)';
    ctx.lineWidth = 0.6;
    ctx.stroke();
    for (const k of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(k * 2.4, -3);
      ctx.quadraticCurveTo(k * 3.4, 0, k * 2.4, 3);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, -24);
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(250,244,255,0.95)';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(1, -25, 1.8, 0, TAU);
    ctx.stroke();
    // the bow, sawing back and forth
    const b = Math.sin(time * 4) * 8;
    ctx.beginPath();
    ctx.moveTo(-14 + b, 4);
    ctx.lineTo(14 + b, -2);
    ctx.strokeStyle = 'rgba(255,250,235,0.85)';
    ctx.lineWidth = 0.9;
    ctx.stroke();
    ctx.rotate(0.5);
    for (let k = 0; k < 2; k++) {
      const u = (time * 0.45 + k * 0.5) % 1;
      noteGlyph(ctx, -12 - u * 10, -14 - u * 22, 2, Math.sin(Math.PI * u));
    }
  }, x, y);
}

// The floor: polished black and white marble in perspective, a gilt inlay along its edge, the windows'
// light lying across it, the room's soft reflection.
function floorPiece() {
  return piece('twroom:floor', [-10, G - 2, W + 10, G + 90], (P) => {
    const field = new Path2D();
    field.rect(-10, G, W + 20, 90);
    P.detail(field, NOIR[2]);
    const rows = 6;
    for (let r = 0; r < rows; r++) {
      const ya = lerp(G + 4, G + 90, (r / rows) ** 1.25);
      const yb = lerp(G + 4, G + 90, ((r + 1) / rows) ** 1.25);
      const sa = 0.8 + 0.45 * (r / rows);
      const sb = 0.8 + 0.45 * ((r + 1) / rows);
      const tile = 48;
      for (let c = -20; c < 22; c++) {
        const xa = W / 2 + c * tile * sa;
        const xb = W / 2 + (c + 1) * tile * sa;
        const xc = W / 2 + (c + 1) * tile * sb;
        const xd = W / 2 + c * tile * sb;
        const t = poly([[xa, ya], [xb, ya], [xc, yb], [xd, yb]]);
        const light = (r + c) % 2 === 0;
        P.detail(t, lin(0, ya, 0, yb, light ? [[0, MARBLE[1]], [1, '#ffffff']] : [[0, NOIR[2]], [1, NOIR[1]]]), { clip: field });
        P.stroke([[lerp(xa, xb, 0.2), lerp(ya, yb, 0.25)], [lerp(xa, xb, 0.6), lerp(ya, yb, 0.6)], [lerp(xd, xc, 0.9), lerp(ya, yb, 0.85)]], rgba(light ? MARBLE[2] : NOIR[0], 0.4), 0.5, { clip: field });
      }
    }
    // the room's reflection: the wall's violet and the windows' light lying in the polish
    P.detail(field, lin(0, G, 0, G + 90, [[0, 'rgba(90,60,150,0.45)'], [0.4, 'rgba(90,60,150,0.12)'], [1, 'rgba(255,255,255,0.08)']]));
    BAYS.forEach((bx, i) => {
      if (KIND[i] === 'clock') return;
      P.detail(poly([[bx - 30, G + 4], [bx + 30, G + 4], [bx + 50, G + 90], [bx - 10, G + 90]]), lin(0, G, 0, G + 90, [[0, KIND[i] === 'mirror' ? 'rgba(220,214,255,0.22)' : 'rgba(170,160,255,0.2)'], [1, 'rgba(170,160,255,0)']]), { clip: field });
    });
    // the gilt inlay along its edge
    P.add(poly([[-10, G], [W + 10, G], [W + 10, G + 4], [-10, G + 4]]), lin(0, G, 0, G + 4, [[0, GILT[0]], [0.5, GILT[2]], [1, GILT[3]]]), true, { lw: 0.5 });
  }, { out: OUT, lw: 1 });
}
export function drawTwinsFloor(ctx, world, cam, time) {
  if (world.map.id !== 'manor3') return;
  noteTwinsWorld(world);
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  drawPiece(ctx, floorPiece(), 'fill');
  // Before their entrance the whole ballroom (walls, balconies, floor) lies dark; as the clock strikes the
  // light comes up, a warm pool round each candle as it lights, and the clock's ruby glow.
  const intro = introOf(world);
  const lit = litOf(intro);
  if (lit < 1) {
    ctx.fillStyle = `rgba(10,6,28,${0.66 * (1 - lit)})`;
    ctx.fillRect(cam.x - 20, cam.y - 20, 720, 420);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const px of PILLARS) {
      const on = candleOn(intro, Math.round(Math.abs(px - CLOCK.x) / 150));
      if (on <= 0.01) continue;
      const g = ctx.createRadialGradient(px, SCONCE_Y - 8, 0, px, SCONCE_Y - 8, 60);
      g.addColorStop(0, `rgba(255,190,110,${0.3 * on * (1 - lit)})`);
      g.addColorStop(1, 'rgba(255,190,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(px - 60, SCONCE_Y - 68, 120, 120);
    }
    const cg = ctx.createRadialGradient(CLOCK.x, CLOCK.y, 0, CLOCK.x, CLOCK.y, 70);
    cg.addColorStop(0, `rgba(255,90,110,${0.25 * (1 - lit)})`);
    cg.addColorStop(1, 'rgba(255,90,110,0)');
    ctx.fillStyle = cg;
    ctx.fillRect(CLOCK.x - 70, CLOCK.y - 70, 140, 140);
    ctx.restore();
  }
  ctx.restore();
}
// The ledges' own looks (terrain.js): (x, y) the ledge's left end on screen, `w` its width.
export function drawTwinsLedge(ctx, x, y, w, time, style, map, cam) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  if (style === 'twCrown') {
    const up = Math.max(10, Math.round(y + cam.y - BALL_CEIL + 8));
    const pc = chandelierPiece(w, up);
    drawPiece(ctx, pc, 'line');
    drawPiece(ctx, pc, 'fill');
    // its candles alight (once the clock has struck, at their entrance), its crystals twinkling
    const c = w / 2;
    const on = litOf(introOf(lastWorld?.map === map ? lastWorld : null));
    if (on > 0.01) {
      ctx.save();
      ctx.globalAlpha = on;
      for (const [k, dy, reach] of [[1, 10, 1.05], [0.6, 30, 0.8]]) {
        for (let i = 0; i < 5; i++) flame(ctx, c + (i - 2) * (w / 4) * reach * k * 1.4, dy - 14, time + i + dy, 0.9);
      }
      ctx.restore();
    }
    for (let i = 0; i < 6; i++) {
      const tw = Math.max(0, Math.sin(time * 2.2 + i * 1.9));
      sparkleAt(ctx, c + (i - 2.5) * 16, 24 + (i % 3) * 12, 1.6 * tw ** 3, 0.9);
    }
  } else if (style === 'twBalcony') {
    const pc = balconyPiece(w);
    drawPiece(ctx, pc, 'line');
    drawPiece(ctx, pc, 'fill');
  } else {
    const h = Math.max(20, Math.round(map.groundY - (y + cam.y)));
    const pc = plinthPiece(w, h);
    drawPiece(ctx, pc, 'line');
    drawPiece(ctx, pc, 'fill');
  }
  ctx.restore();
}
export const TWINS_LEDGES = new Set(['twBalcony', 'twPlinth', 'twCrown']);
