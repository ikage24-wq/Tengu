// The dungeon gate maps (their makeover, 2026-11-20): landmarks for the short stretches outside
// each dungeon, the door built into one of them the way Hollow Gate's is in the great tree's roots.
// Carnival Gates: a carousel in the middle, pastel horses bobbing on gold poles, its striped canopy
// flat on top (a ledge), and a clockwork ticket kiosk, a wind-up key turning in its side, its roof
// the step up to the canopy (the striped CARNIVAL arch at the door stays: render/fairground.js).
// Observatory Steps: the Great Telescope on a carved pedestal (its railed deck a ledge), its tube
// sweeping the sky; a brass orrery, planets circling a glowing sun; Professor Lumen's stargazing
// tent with a crate desk of charts (the star arch at the door stays: render/starlight.js).
// Sugar Trail: Chef Praline's gingerbread hut (its frosted roof ridge a ledge), a giant cupcake
// (its frosting the step up to the roof), and the way into the Candy Volcano: a doorway cut in a
// slab of layered cake dripping caramel at the volcano's foot.
// Tidepool Pier: Marina's dive shop on the quay (its roof deck a ledge, a stack of crates to climb
// to it) and, at the pier's end, a timber crane with a big brass diving bell resting on the boards,
// its hatch open: the way down to the Sunken Aquarium Palace (the portal's swirl turns in it).

import { E, T, F, sprite, blit, snap } from './pixel.js';
import { band } from './propkit.js';
import { FG } from './fairground.js';

export const GT = {
  board: '#8fc4e0', boardLit: '#b8dcf0', boardSh: '#6a9ec0', trim: '#fff6ea', trimSh: '#e6d8c8',
  wood: '#c89a74', woodLit: '#e4b892', woodSh: '#a07656', woodDeep: '#7a5640',
  roof: '#e86a6a', roofLit: '#ff9a8a', roofSh: '#c04a5a', awning: ['#ffffff', '#ff8a8a'],
  brass: '#f0c060', brassLit: '#ffe6a0', brassSh: '#c8943a', brassDeep: '#9a6a2a',
  glass: '#9fe6ff', glassLit: '#e8faff', hole: '#2a3a5a', holeIn: '#3a5a7a',
  rope: '#e8d8b0', ropeSh: '#c8b088', buoy: '#ff6a6a', ink: '#4a3a5c', crate: '#d8a870', crateSh: '#b08050',
};

const h01 = (n) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;
const arc = (cx, cy, rx, ry, a0, a1, n = 12) => Array.from({ length: n + 1 }, (_, i) => {
  const a = ((a0 + ((a1 - a0) * i) / n) * Math.PI) / 180;
  return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
});
const R = (x0, y0, x1, y1, c) => T([[x0, y0], [x1, y0], [x1, y1], [x0, y1]], c);

const M = 40;
const moveIn = (sh) => (sh.pts ? { ...sh, pts: sh.pts.map(([px, py]) => [px + M, py + M]) } : { ...sh, x: (sh.x ?? 0) + M, y: (sh.y ?? 0) + M });
function art(key, w, h, build) {
  return sprite(`gt|${key}`, () => ({ w: w + M * 2, h: h + M, shapes: build().filter(Boolean).map(moveIn), res: 2, soft: 'cel' }));
}
function place(ctx, s, x, y) {
  blit(ctx, s, snap(x - s.w / 2), snap(y - s.h));
}
// A life ring at (x, y), radius r.
const lifeRing = (x, y, r) => {
  const out = [E(x, y, r, r, GT.trim)];
  for (let k = 0; k < 4; k++) {
    const a0 = k * 90 + 20;
    out.push(F(band(arc(x, y, r * 0.78, r * 0.78, a0, a0 + 45, 6), () => r * 0.42, GT.buoy)));
  }
  out.push(E(x, y, r * 0.5, r * 0.5, GT.board), F(E(x, y, r * 0.42, r * 0.42, GT.boardSh)));
  return out;
};
// A round porthole at (x, y), radius r: a brass rim, glass, a glint.
const porthole = (x, y, r) => [E(x, y, r, r, GT.brass), F(E(x, y, r * 0.72, r * 0.72, GT.glass)), F(E(x - r * 0.25, y - r * 0.25, r * 0.28, r * 0.2, GT.glassLit)), F(band(arc(x, y, r * 0.86, r * 0.86, 200, 330, 8), () => 1, GT.brassLit))];

// ---------- Marina's dive shop: a painted-board shack on the quay, a striped awning, a porthole
// window, a brass diving helmet on its sign, a life ring and coiled rope, glass floats in a net,
// a railed roof deck on top (a ledge DS_ROOF up). Bottom middle at its door. ----------
const DS_W = 240;
const DS_H = 170;
export const DS_ROOF = 120;
export const DS_ROOF_SPAN = [-90, 70];
function shopArt() {
  return art('shop', DS_W, DS_H, () => {
    const out = [];
    const cx = DS_W / 2;
    const H = DS_H;
    const rt = H - DS_ROOF;
    // The walls: painted boards on a timber frame.
    out.push(R(cx - 88, rt + 10, cx + 88, H, GT.board));
    for (let y = rt + 22; y < H; y += 12) out.push(F(R(cx - 88, y, cx + 88, y + 1.4, GT.boardSh)));
    out.push(F(R(cx + 60, rt + 10, cx + 88, H, GT.boardSh)), F(R(cx - 88, rt + 10, cx - 80, H, GT.boardLit)));
    for (const px of [-92, 84]) out.push(R(cx + px, rt + 4, cx + px + 8, H, GT.wood), F(R(cx + px + 5, rt + 4, cx + px + 8, H, GT.woodSh)));
    // The door, the porthole window, the life ring.
    out.push(R(cx - 16, H - 62, cx + 16, H, GT.woodDeep), F(R(cx - 13, H - 59, cx + 13, H, GT.wood)), F(E(cx + 8, H - 30, 2, 2, GT.brass)));
    out.push(...porthole(cx - 52, H - 56, 15));
    out.push(...lifeRing(cx + 52, H - 64, 14));
    // Coiled rope and glass floats in a net by the door.
    out.push(E(cx + 50, H - 10, 16, 8, GT.rope), F(E(cx + 50, H - 11, 10, 4.4, GT.ropeSh)), F(E(cx + 50, H - 12, 4, 1.6, GT.rope)));
    for (const [fx, fy, c] of [[-58, -12, GT.glass], [-46, -16, '#b8f0c8'], [-68, -20, '#ffd0e8']]) out.push(E(cx + fx, H + fy, 7, 7, c), F(E(cx + fx - 2, H + fy - 2, 2.4, 2, GT.glassLit)));
    out.push(F(band([[cx - 76, H - 26], [cx - 36, H - 6]], () => 0.8, GT.ropeSh)), F(band([[cx - 36, H - 26], [cx - 76, H - 6]], () => 0.8, GT.ropeSh)));
    // The sign over the door: a brass diving helmet.
    out.push(R(cx - 26, rt + 14, cx + 26, rt + 40, GT.trim), F(R(cx - 26, rt + 36, cx + 26, rt + 40, GT.trimSh)));
    out.push(E(cx, rt + 27, 10, 10, GT.brass), F(E(cx, rt + 27, 6, 6, GT.glass)), F(R(cx - 8, rt + 35, cx + 8, rt + 38, GT.brassSh)));
    // The striped awning.
    for (let k = 0; k < 8; k++) {
      const x0 = cx - 96 + k * 24;
      out.push(T([[x0, rt + 2], [x0 + 24, rt + 2], [x0 + 24, rt + 12], [x0 + 12, rt + 16], [x0, rt + 12]], GT.awning[k % 2]));
    }
    // The roof deck: planks and a rail of posts and rope.
    const [r0, r1] = DS_ROOF_SPAN;
    out.push(R(cx - 98, rt - 4, cx + 98, rt + 4, GT.wood), F(R(cx - 98, rt - 4, cx + 98, rt - 2, GT.woodLit)), F(R(cx - 98, rt + 2, cx + 98, rt + 4, GT.woodSh)));
    for (const px of [-96, 84]) out.push(R(cx + px, rt - 26, cx + px + 6, rt - 4, GT.wood), F(R(cx + px + 4, rt - 26, cx + px + 6, rt - 4, GT.woodSh)));
    out.push(F(band(arc(cx - 6, rt - 30, 90, 10, 20, 160, 14), () => 1.4, GT.rope)));
    // A little flag on the rail.
    out.push(F(band([[cx + 87, rt - 26], [cx + 87, rt - 44]], () => 1, GT.woodDeep)), T([[cx + 88, rt - 44], [cx + 102, rt - 40], [cx + 88, rt - 36]], GT.buoy));
    return out;
  });
}

// ---------- A stack of crates and a barrel on the quay, flat on top (a ledge CS_TOP up). ----------
const CS_W = 96;
const CS_H = 70;
export const CS_TOP = 56;
function cratesArt() {
  return art('crates', CS_W, CS_H, () => {
    const out = [];
    const cx = CS_W / 2;
    const H = CS_H;
    const crate = (x0, y0, s) => {
      out.push(R(x0, y0, x0 + s, y0 + s, GT.crate), F(R(x0 + s - 5, y0, x0 + s, y0 + s, GT.crateSh)));
      out.push(F(R(x0, y0, x0 + s, y0 + 3, GT.woodLit)), F(band([[x0 + 3, y0 + 3], [x0 + s - 3, y0 + s - 3]], () => 1.6, GT.crateSh)), F(R(x0 + 2, y0 + s / 2 - 1, x0 + s - 2, y0 + s / 2 + 1, GT.crateSh)));
    };
    crate(cx - 40, H - 28, 28);
    crate(cx - 10, H - 28, 28);
    crate(cx - 28, H - CS_TOP, 28);
    // A barrel at the end.
    out.push(T([[cx + 22, H], [cx + 20, H - 18], [cx + 22, H - 34], [cx + 42, H - 34], [cx + 44, H - 18], [cx + 42, H]], GT.wood));
    out.push(F(R(cx + 21, H - 26, cx + 43, H - 23, GT.woodDeep)), F(R(cx + 21, H - 10, cx + 43, H - 7, GT.woodDeep)), F(R(cx + 36, H - 33, cx + 42, H - 1, GT.woodSh)));
    return out;
  });
}

// ---------- The crane and the diving bell: a timber crane over the end of the pier, its arm out
// over the bell, a chain down to it; the bell (brass, riveted, portholes either side, a lamp on top)
// resting on the boards, its round hatch open in front (BELL_DOOR) - the way down. Bottom middle at
// the hatch. ----------
const BC_W = 320;
const BC_H = 300;
export const BELL_DOOR = { w: 56, h: 72 };
function bellArt() {
  return art('bell', BC_W, BC_H, () => {
    const out = [];
    const cx = BC_W / 2;
    const H = BC_H;
    // The crane: a mast on a block to the left, a brace, the arm out over the bell, a pulley.
    const mx = cx - 110;
    out.push(R(mx - 22, H - 16, mx + 22, H, GT.woodDeep), R(mx - 9, H - 290, mx + 9, H - 16, GT.wood), F(R(mx + 4, H - 290, mx + 9, H - 16, GT.woodSh)));
    for (let y = H - 40; y > H - 280; y -= 22) out.push(F(R(mx - 9, y, mx + 9, y + 2.4, GT.woodSh)));
    out.push(R(mx - 14, H - 292, cx + 30, H - 278, GT.wood), F(R(mx - 14, H - 292, cx + 30, H - 289, GT.woodLit)), F(R(mx - 14, H - 281, cx + 30, H - 278, GT.woodSh)));
    out.push(F(band([[mx + 6, H - 210], [mx + 90, H - 282]], () => 4, GT.woodSh)));
    out.push(E(cx, H - 272, 9, 9, GT.woodDeep), F(E(cx, H - 272, 4, 4, GT.brass)));
    // The chain down to the bell's ring.
    for (let y = H - 262; y < H - 140; y += 9) out.push(E(cx + ((y / 9) % 2 ? 0.6 : -0.6), y, 2.6, 4.4, (y / 9) % 2 ? GT.brassSh : '#9aa0b8'));
    // The bell: a brass dome flaring to a lip, rivet bands, a ring and a lamp on top.
    out.push(E(cx, H - 142, 10, 8, GT.brassSh), F(E(cx, H - 142, 5, 4, GT.brassDeep)));
    const dome = [[cx - 76, H], [cx - 74, H - 16], [cx - 64, H - 60], ...arc(cx, H - 70, 64, 66, 180, 360, 18), [cx + 64, H - 60], [cx + 74, H - 16], [cx + 76, H]];
    out.push(T(dome, GT.brass));
    out.push(F(T([[cx - 64, H - 60], ...arc(cx, H - 70, 64, 66, 180, 250, 8), [cx - 30, H - 120], [cx - 46, H - 70], [cx - 58, H - 20], [cx - 70, H - 16]], GT.brassLit)));
    out.push(F(T([[cx + 64, H - 60], ...arc(cx, H - 70, 64, 66, 330, 360, 4), [cx + 74, H - 16], [cx + 76, H], [cx + 50, H], [cx + 52, H - 50]], GT.brassSh)));
    out.push(R(cx - 78, H - 14, cx + 78, H - 4, GT.brassSh), F(R(cx - 78, H - 14, cx + 78, H - 12, GT.brassLit)));
    for (const yb of [H - 60, H - 14]) for (let x = cx - 66; x <= cx + 66; x += 12) out.push(F(E(x, yb - 5, 1.6, 1.6, GT.brassDeep)));
    out.push(...porthole(cx - 46, H - 70, 12), ...porthole(cx + 46, H - 70, 12));
    // The lamp on top.
    out.push(R(cx - 6, H - 146, cx + 6, H - 136, GT.brassSh), E(cx, H - 150, 7, 6, '#fff0b0'), F(E(cx - 2, H - 152, 2.4, 2, '#ffffff')));
    // The hatch, swung open: the dark round doorway (the swirl turns in it), the door hinged aside.
    const dw = BELL_DOOR.w / 2;
    out.push(T([[cx - dw - 6, H - 4], ...arc(cx, H - BELL_DOOR.h + dw, dw + 6, dw + 6, 180, 360, 14), [cx + dw + 6, H - 4]], GT.brassDeep));
    out.push(T([[cx - dw, H - 4], ...arc(cx, H - BELL_DOOR.h + dw, dw, dw, 180, 360, 14), [cx + dw, H - 4]], GT.hole));
    out.push(F(T([[cx - dw + 8, H - 4], ...arc(cx, H - BELL_DOOR.h + dw + 6, dw - 8, dw - 8, 180, 360, 12), [cx + dw - 8, H - 4]], GT.holeIn)));
    out.push(T([[cx + dw + 6, H - 6], [cx + dw + 22, H - 10], [cx + dw + 24, H - BELL_DOOR.h + 6], [cx + dw + 8, H - BELL_DOOR.h + 14]], GT.brass), F(E(cx + dw + 16, H - 38, 4, 6, GT.glass)));
    return out;
  });
}
function drawBell(ctx, x, y, time) {
  place(ctx, bellArt(), x, y);
  // The lamp's glow, and bubbles rising off the bell's lip where it meets the water.
  const g = ctx.createRadialGradient(x, y - 150, 2, x, y - 150, 40);
  g.addColorStop(0, hexA('#fff0b0', 0.5));
  g.addColorStop(1, hexA('#fff0b0', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 40, y - 190, 80, 80);
  for (let i = 0; i < 5; i++) {
    const u = (time * 0.4 + i / 5) % 1;
    ctx.fillStyle = hexA('#e8faff', (1 - u) * 0.7);
    ctx.beginPath();
    ctx.arc(x - 70 + h01(i) * 140, y - 4 - u * 50, 1.6 + h01(i + 2) * 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- The carousel: a round wooden stage trimmed with bulbs, a candy-striped centre pole, a
// striped canopy flat on top (a ledge CR_TOP up) with a scalloped valance and bulbs, a gold gear on
// its front, a pennant on top; horses on gold poles bobbing in turn (drawn live). Bottom middle at
// the stage's middle. ----------
const CR_W = 320;
const CR_H = 210;
export const CR_TOP = 160;
export const CR_SPAN = [-110, 110];
const BULB = ['#fff2b0', '#ff9ac0', '#9ff0dc', '#ffd36b', '#c8a8ff'];
function carouselBack() {
  return art('carouselB', CR_W, CR_H, () => {
    const out = [];
    const cx = CR_W / 2;
    const H = CR_H;
    const top = H - CR_TOP;
    // The stage and the centre pole (behind the horses).
    out.push(R(cx - 140, H - 18, cx + 140, H, FG.wood), F(R(cx - 140, H - 18, cx + 140, H - 15, FG.woodLit)), F(R(cx - 140, H - 5, cx + 140, H, FG.woodSh)));
    for (let k = 0; k < 14; k++) out.push(E(cx - 130 + k * 20, H - 9, 3, 3, BULB[k % 5]));
    out.push(R(cx - 8, top + 40, cx + 8, H - 18, FG.cream));
    for (let y = top + 44; y < H - 22; y += 14) out.push(F(T([[cx - 8, y], [cx + 8, y - 6], [cx + 8, y], [cx - 8, y + 6]], FG.pink)));
    // The mirrored drum round the pole's top.
    out.push(R(cx - 40, top + 40, cx + 40, top + 66, FG.butter), F(R(cx - 40, top + 60, cx + 40, top + 66, FG.butterSh)));
    for (let k = 0; k < 4; k++) out.push(F(R(cx - 34 + k * 18, top + 44, cx - 22 + k * 18, top + 58, FG.sky)));
    return out;
  });
}
function carouselTop() {
  return art('carouselT', CR_W, CR_H, () => {
    const out = [];
    const cx = CR_W / 2;
    const top = CR_H - CR_TOP;
    const [c0, c1] = CR_SPAN;
    // The canopy: flat on top, sloping out to the valance, in pink and cream stripes.
    out.push(T([[cx + c0, top], [cx + c1, top], [cx + 152, top + 30], [cx - 152, top + 30]], FG.cream));
    for (let k = 0; k < 10; k += 2) {
      const tx = (u) => cx + c0 + (c1 - c0) * u;
      const bx = (u) => cx - 152 + 304 * u;
      out.push(F(T([[tx(k / 10), top], [tx((k + 1) / 10), top], [bx((k + 1) / 10), top + 30], [bx(k / 10), top + 30]], FG.pink)));
    }
    out.push(F(R(cx + c0 + 4, top, cx + c1 - 4, top + 3, '#ffffff')));
    // The scalloped valance with bulbs.
    for (let k = 0; k < 12; k++) {
      const x0 = cx - 152 + k * (304 / 12);
      const x1 = x0 + 304 / 12;
      out.push(T([[x0, top + 30], [x1, top + 30], ...arc((x0 + x1) / 2, top + 36, (x1 - x0) / 2, 8, 0, 180, 6)], k % 2 ? FG.mint : FG.lilac));
      out.push(E((x0 + x1) / 2, top + 30, 2.6, 2.6, BULB[k % 5]));
    }
    // The gold gear on the canopy's front, and the pennant on top.
    const gy = top + 16;
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      out.push(F(E(cx + Math.cos(a) * 11, gy + Math.sin(a) * 9, 3.4, 3, FG.butter)));
    }
    out.push(F(E(cx, gy, 10, 8.6, FG.butter)), F(E(cx, gy, 4, 3.4, FG.butterSh)));
    out.push(F(band([[cx + c1 - 6, top], [cx + c1 - 6, top - 26]], () => 1.2, FG.woodDeep)), T([[cx + c1 - 5, top - 26], [cx + c1 + 12, top - 21], [cx + c1 - 5, top - 16]], FG.pink));
    return out;
  });
}
// A carousel horse (side view), its pole through it, in one of three colours.
function horseArt(v) {
  const body = ['#ffffff', '#ffd0e4', '#d0e8ff'][v];
  const mane = ['#ff9ac0', '#c8a0f0', '#ffd36b'][v];
  return art(`horse|${v}`, 60, 70, () => [
    R(28, 0, 32, 70, FG.butter), F(R(30.6, 0, 32, 70, FG.butterSh)),
    E(30, 40, 20, 11, body),
    T([[44, 34], [52, 16], [58, 18], [58, 26], [50, 34], [48, 42]], body),
    F(T([[44, 32], [50, 16], [46, 18], [40, 32]], mane)), F(E(55, 22, 1.4, 1.4, FG.navy)),
    T([[12, 46], [6, 58], [10, 60], [18, 48]], body), T([[44, 46], [52, 56], [48, 60], [40, 48]], body),
    T([[14, 36], [4, 34], [2, 44], [10, 42]], mane),
    F(R(22, 28, 38, 33, FG.pink)), F(R(26, 33, 34, 40, FG.pinkSh)),
  ]);
}
function drawCarousel(ctx, x, y, time) {
  place(ctx, carouselBack(), x, y);
  // Three horses bobbing in turn on their poles under the canopy.
  for (const [dx, v, ph] of [[-96, 0, 0], [-6, 1, 2.1], [84, 2, 4.2]]) {
    const bob = Math.sin(time * 2.2 + ph) * 8;
    place(ctx, horseArt(v), x + dx + 30, y - 40 + bob);
  }
  place(ctx, carouselTop(), x, y);
}

// ---------- The ticket kiosk: a tin booth (red and cream, riveted) with a ticket window and a
// ticket on its sign, a domed roof flat on top (a ledge KS_TOP up), a big wind-up key in its side
// turning (drawn live). Bottom middle at the window. ----------
const KS_W = 120;
const KS_H = 130;
export const KS_TOP = 80;
export const KS_SPAN = [-44, 44];
function kioskArt() {
  return art('kiosk', KS_W, KS_H, () => {
    const out = [];
    const cx = KS_W / 2;
    const H = KS_H;
    const top = H - KS_TOP;
    out.push(R(cx - 40, top + 8, cx + 40, H, '#e8605a'), F(R(cx + 24, top + 8, cx + 40, H, '#c0484a')), F(R(cx - 40, top + 8, cx - 34, H, '#ff8a80')));
    out.push(R(cx - 40, H - 22, cx + 40, H, FG.cream), F(R(cx - 40, H - 22, cx + 40, H - 19, '#ffffff')));
    for (const yy of [top + 14, H - 26]) for (let x = cx - 34; x <= cx + 34; x += 10) out.push(F(E(x, yy, 1.3, 1.3, FG.butterSh)));
    // The window and the ticket sign.
    out.push(R(cx - 24, top + 22, cx + 24, top + 50, FG.navy), F(R(cx - 21, top + 25, cx + 21, top + 47, '#4a4a8a')), F(R(cx - 26, top + 50, cx + 26, top + 54, FG.cream)));
    out.push(T([[cx - 14, top + 30], [cx + 14, top + 30], [cx + 14, top + 34], [cx + 12, top + 36], [cx + 14, top + 38], [cx + 14, top + 42], [cx - 14, top + 42], [cx - 14, top + 38], [cx - 12, top + 36], [cx - 14, top + 34]], FG.butter));
    out.push(F(R(cx - 8, top + 35, cx + 8, top + 37, FG.butterSh)));
    // The domed roof, flat on top, a gold rim, pink stripes.
    const [k0, k1] = KS_SPAN;
    out.push(T([[cx - 48, top + 10], [cx - 46, top + 4], [cx + k0, top], [cx + k1, top], [cx + 46, top + 4], [cx + 48, top + 10]], FG.cream));
    out.push(F(R(cx - 48, top + 8, cx + 48, top + 11, FG.butter)), F(R(cx + k0 + 4, top, cx + k1 - 4, top + 2, '#ffffff')));
    for (let k = 0; k < 4; k++) out.push(F(T([[cx + k0 + 6 + k * 22, top + 1], [cx + k0 + 16 + k * 22, top + 1], [cx + k0 + 14 + k * 22, top + 8], [cx + k0 + 6 + k * 22, top + 8]], FG.pink)));
    return out;
  });
}
// The wind-up key, turning: its bow drawn edge-on to face-on and back.
function keyArt(f) {
  return art(`key|${f}`, 40, 40, () => {
    const w = Math.abs(Math.cos((f / 8) * Math.PI)) * 14 + 3;
    return [R(0, 18, 16, 22, FG.butterSh), E(20, 20, w, 13, FG.butter), F(E(20, 20, Math.max(1, w - 6), 7, FG.butterSh)), F(E(20 - w * 0.3, 16, Math.max(1, w * 0.3), 3, '#fff0b8'))];
  });
}
function drawKiosk(ctx, x, y, time) {
  place(ctx, kioskArt(), x, y);
  place(ctx, keyArt(Math.floor(time * 6) % 8), x + 56, y - 40);
}

// ---------- The Great Telescope: a round stone pedestal carved with stars, a railed deck on top (a
// ledge GS_DECK up), a fork mount and a long brass tube aimed at the sky, sweeping slowly (drawn
// live). Bottom middle at the pedestal. ----------
const GS_W = 200;
const GS_H = 130;
export const GS_DECK = 80;
export const GS_SPAN = [-74, 74];
const STAR = { stone: '#8a90c8', stoneLit: '#b0b8e8', stoneSh: '#666ca8', stoneDeep: '#4e5490', gold: '#ffd36b', goldSh: '#d8a840', goldLit: '#fff0b8', navy: '#2a2a5a', glass: '#bfe6ff', tent: '#3a3a7a', tentSh: '#2a2a5a', lamp: '#ffd890' };
const star5 = (x, y, r, c) => T(Array.from({ length: 10 }, (_, i) => {
  const a = ((-90 + i * 36) * Math.PI) / 180;
  const rr = i % 2 ? r * 0.45 : r;
  return [x + Math.cos(a) * rr, y + Math.sin(a) * rr];
}), c);
function scopeBase() {
  return art('scopebase', GS_W, GS_H, () => {
    const out = [];
    const cx = GS_W / 2;
    const H = GS_H;
    const dk = H - GS_DECK;
    // The pedestal: a stone drum, carved stars, a little arched niche glowing.
    out.push(T([[cx - 64, H], [cx - 60, dk + 12], [cx + 60, dk + 12], [cx + 64, H]], STAR.stone));
    out.push(F(T([[cx + 30, dk + 12], [cx + 60, dk + 12], [cx + 64, H], [cx + 34, H]], STAR.stoneSh)), F(T([[cx - 60, dk + 12], [cx - 46, dk + 12], [cx - 50, H], [cx - 64, H]], STAR.stoneLit)));
    for (const y of [dk + 34, dk + 58]) out.push(F(R(cx - 62, y, cx + 62, y + 2, STAR.stoneDeep)));
    out.push(T([[cx - 12, H], [cx - 12, H - 30], ...arc(cx, H - 30, 12, 12, 180, 360, 8), [cx + 12, H - 30], [cx + 12, H]], STAR.navy), F(E(cx, H - 20, 6, 9, STAR.lamp)));
    for (const [sx, sy, r] of [[-38, dk + 24, 5], [36, dk + 46, 4], [-30, dk + 52, 3.4], [44, dk + 22, 3]]) out.push(F(star5(cx + sx, sy, r, STAR.gold)));
    // The deck: a stone slab with a gold rail.
    const [d0, d1] = GS_SPAN;
    out.push(R(cx + d0 - 4, dk, cx + d1 + 4, dk + 12, STAR.stoneLit), F(R(cx + d0 - 4, dk + 9, cx + d1 + 4, dk + 12, STAR.stoneSh)));
    for (const px of [d0, d1 - 3]) out.push(R(cx + px, dk - 20, cx + px + 3, dk, STAR.gold));
    out.push(F(R(cx + d0, dk - 20, cx + d1, dk - 18, STAR.gold)));
    // The fork mount on the deck.
    out.push(T([[cx - 16, dk], [cx - 10, dk - 30], [cx + 10, dk - 30], [cx + 16, dk]], STAR.navy), F(R(cx - 18, dk - 34, cx + 18, dk - 28, STAR.goldSh)));
    return out;
  });
}
function scopeTube() {
  return art('scopetube', 220, 40, () => {
    const out = [];
    out.push(T([[0, 12], [200, 4], [200, 30], [0, 26]], STAR.gold));
    out.push(F(T([[0, 12], [200, 4], [200, 10], [0, 16]], STAR.goldLit)), F(T([[0, 23], [200, 26], [200, 30], [0, 26]], STAR.goldSh)));
    for (const x of [30, 90, 150]) out.push(R(x, 6 + (x / 200) * -2, x + 8, 30 - (x / 200) * -2, STAR.goldSh));
    out.push(R(196, 0, 214, 34, STAR.navy), F(E(210, 17, 4, 13, STAR.glass)), F(E(209, 11, 1.4, 4, '#ffffff')));
    out.push(R(-12, 14, 2, 24, STAR.navy));
    return out;
  });
}
function drawScope(ctx, x, y, time) {
  place(ctx, scopeBase(), x, y);
  // The tube on its pivot over the fork, sweeping slowly across the sky.
  const px = x;
  const py = y - GS_DECK - 32;
  const a = -0.62 + Math.sin(time * 0.15) * 0.12;
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(a);
  const s = scopeTube();
  blit(ctx, s, snap(-40 - 30), snap(-M - 17));
  ctx.restore();
}

// ---------- The orrery: a brass stand with a glowing sun on top and three planets on arms
// circling it at their own speeds (drawn live). Bottom middle at its foot. ----------
function orreryStand() {
  return art('orrery', 80, 120, () => [
    T([[22, 120], [30, 108], [50, 108], [58, 120]], STAR.navy), R(37, 40, 43, 108, STAR.goldSh), F(R(37, 40, 39, 108, STAR.goldLit)),
    E(40, 40, 28, 6, STAR.goldSh), F(E(40, 39, 24, 4, STAR.navy)),
  ]);
}
function drawOrrery(ctx, x, y, time) {
  place(ctx, orreryStand(), x, y);
  const cy = y - 96;
  const sun = ctx.createRadialGradient(x, cy, 2, x, cy, 30);
  sun.addColorStop(0, hexA('#fff4c0', 0.9));
  sun.addColorStop(1, hexA('#ffd36b', 0));
  ctx.fillStyle = sun;
  ctx.fillRect(x - 30, cy - 30, 60, 60);
  for (const [r, sp, c, s] of [[22, 1.1, '#9fd8ff', 3.4], [36, 0.7, '#ff9ab8', 4.6], [50, 0.45, '#c8a8ff', 4]]) {
    const a = time * sp;
    const px = x + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r * 0.32;
    ctx.strokeStyle = hexA('#d8a840', 0.8);
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(x, cy);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(px, py, s, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#fff4c0';
  ctx.beginPath();
  ctx.arc(x, cy, 7, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- Professor Lumen's stargazing camp: a navy tent spangled with stars, its flap tied open
// on lamplight, a crate desk with a star chart, books and a teapot. Bottom middle at the tent. ----
function tentArt() {
  return art('startent', 200, 120, () => {
    const out = [];
    const cx = 80;
    const H = 120;
    out.push(T([[cx - 70, H], [cx, H - 100], [cx + 70, H]], STAR.tent), F(T([[cx, H - 100], [cx + 70, H], [cx + 36, H]], STAR.tentSh)));
    out.push(T([[cx - 22, H], [cx, H - 70], [cx + 22, H]], '#5a4a6e'), F(T([[cx - 14, H], [cx, H - 56], [cx + 14, H]], STAR.lamp)));
    out.push(T([[cx, H - 70], [cx - 30, H], [cx - 22, H]], '#4a4a8a'));
    for (const [sx, sy, r] of [[-40, 60, 3], [30, 44, 2.6], [-14, 34, 2.4], [44, 80, 3], [-52, 90, 2.4], [16, 70, 2]]) out.push(F(star5(cx + sx, sy, r, STAR.gold)));
    out.push(F(band([[cx, H - 100], [cx, H - 112]], () => 1.4, STAR.goldSh)), T([[cx + 1, H - 112], [cx + 14, H - 108], [cx + 1, H - 104]], '#ff9ab8'));
    // The crate desk: a star chart, books, a teapot.
    const dx = 150;
    out.push(R(dx - 26, H - 30, dx + 26, H, '#c89a74'), F(R(dx - 26, H - 30, dx + 26, H - 27, '#e4b892')), F(R(dx + 18, H - 30, dx + 26, H, '#a07656')));
    out.push(T([[dx - 22, H - 32], [dx + 6, H - 34], [dx + 8, H - 30], [dx - 20, H - 28]], '#f4ecd8'), F(star5(dx - 8, H - 31.6, 2.4, STAR.navy)));
    out.push(R(dx + 8, H - 40, dx + 22, H - 30, '#9a74c8'), R(dx + 10, H - 46, dx + 22, H - 40, '#7fd8ff'));
    out.push(E(dx - 16, H - 38, 6, 5, '#ff9ab8'), F(band([[dx - 22, H - 40], [dx - 26, H - 44]], () => 1.4, '#ff9ab8')));
    return out;
  });
}
function drawTent(ctx, x, y, time) {
  place(ctx, tentArt(), x + 20, y);
  const g = ctx.createRadialGradient(x, y - 24, 2, x, y - 24, 46);
  g.addColorStop(0, hexA('#ffd890', 0.3 + 0.05 * Math.sin(time * 3)));
  g.addColorStop(1, hexA('#ffd890', 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - 46, y - 70, 92, 80);
}

// ---------- Sugar Trail's pieces ----------
const SW = {
  ginger: '#c8844a', gingerLit: '#e0a066', gingerSh: '#a06438', icing: '#ffffff', icingSh: '#f0e4ec',
  frost: '#ffb0cc', frostLit: '#ffd6e6', frostSh: '#e88aae', mint: '#9ff0dc', mintSh: '#6ad0b8',
  choc: '#7a4a3a', chocSh: '#5a3428', chocLit: '#9a6450', sponge: '#ffd0a0', spongeSh: '#e8b080',
  caramel: '#e8a040', caramelLit: '#ffc870', cherry: '#ff4a6a', wrap: '#9fd8ff', wrapSh: '#6ab8e8',
  sprinkle: ['#ff6a9a', '#ffd36b', '#7fe0c8', '#c8a0f0', '#7fd8ff'],
};
const sprinkles = (x0, x1, y0, y1, n, seed) => Array.from({ length: n }, (_, i) => {
  const x = x0 + h01(seed + i) * (x1 - x0);
  const y = y0 + h01(seed + i * 3) * (y1 - y0);
  const a = h01(seed + i * 7) * Math.PI;
  return F(band([[x - Math.cos(a) * 2.4, y - Math.sin(a) * 2.4], [x + Math.cos(a) * 2.4, y + Math.sin(a) * 2.4]], () => 1.6, SW.sprinkle[i % 5]));
});

// The gingerbread hut: gingerbread walls trimmed with icing, gumdrop buttons, a peppermint window,
// a candy-cane door frame, a pink frosted roof with a flat ridge on top (a ledge GH_ROOF up),
// a striped chimney (puffing, drawn live). Bottom middle at the door.
const GH_W = 240;
const GH_H = 200;
export const GH_ROOF = 150;
export const GH_SPAN = [-60, 60];
function gingerArt() {
  return art('ginger', GH_W, GH_H, () => {
    const out = [];
    const cx = GH_W / 2;
    const H = GH_H;
    const rt = H - GH_ROOF;
    // The chimney, behind the roof.
    out.push(R(cx + 50, rt - 6, cx + 72, rt + 40, '#ffffff'));
    for (let y = rt - 2; y < rt + 40; y += 10) out.push(F(T([[cx + 50, y], [cx + 72, y - 6], [cx + 72, y], [cx + 50, y + 6]], SW.cherry)));
    // The walls.
    out.push(R(cx - 90, rt + 50, cx + 90, H, SW.ginger), F(R(cx + 64, rt + 50, cx + 90, H, SW.gingerSh)), F(R(cx - 90, rt + 50, cx - 82, H, SW.gingerLit)));
    for (let x = cx - 88; x < cx + 88; x += 12) out.push(F(T([[x, rt + 52], [x + 6, rt + 58], [x + 12, rt + 52]], SW.icing)));
    out.push(F(R(cx - 90, H - 6, cx + 90, H - 3, SW.icing)));
    // The door in its candy-cane frame, gumdrop buttons.
    out.push(T([[cx - 20, H], [cx - 20, H - 52], ...arc(cx, H - 52, 20, 18, 180, 360, 10), [cx + 20, H - 52], [cx + 20, H]], '#ffffff'));
    for (let k = 0; k < 8; k++) {
      const a = Math.PI + (k / 7) * Math.PI;
      out.push(F(E(cx + Math.cos(a) * 20, H - 52 + Math.sin(a) * 18, 2.4, 2.4, SW.cherry)));
    }
    out.push(T([[cx - 15, H], [cx - 15, H - 50], ...arc(cx, H - 50, 15, 14, 180, 360, 10), [cx + 15, H - 50], [cx + 15, H]], SW.choc), F(E(cx + 8, H - 26, 2.2, 2.2, SW.caramelLit)));
    for (const [gx, gy, c] of [[-60, H - 30, '#7fe0c8'], [60, H - 30, '#ffd36b'], [-60, H - 60, '#ff9ac0'], [60, H - 60, '#c8a0f0']]) out.push(E(cx + gx, gy, 6, 5, c), F(E(cx + gx - 2, gy - 2, 2, 1.4, '#ffffff')));
    // The peppermint window.
    const wx = cx - 52;
    const wy = rt + 76;
    out.push(E(wx, wy, 12, 12, '#ffffff'));
    for (let k = 0; k < 6; k++) out.push(F(T([[wx, wy], ...arc(wx, wy, 11, 11, k * 60, k * 60 + 30, 3)], SW.cherry)));
    // The roof: pink frosting, drippy eaves, a flat ridge, sprinkles.
    const [r0, r1] = GH_SPAN;
    const drips = [];
    for (let x = cx + 108; x >= cx - 108; x -= 18) drips.push([x, rt + 50], [x - 9, rt + 58 + h01(x) * 8]);
    out.push(T([[cx + r0, rt], [cx + r1, rt], [cx + 108, rt + 46], ...drips, [cx - 108, rt + 46]], SW.frost));
    out.push(F(T([[cx + r0, rt], [cx + r0 + 30, rt], [cx - 70, rt + 40], [cx - 104, rt + 44]], SW.frostLit)));
    out.push(F(T([[cx + r1 - 20, rt + 4], [cx + r1, rt], [cx + 108, rt + 46], [cx + 80, rt + 46]], SW.frostSh)));
    out.push(F(R(cx + r0 + 4, rt, cx + r1 - 4, rt + 3, SW.icing)));
    out.push(...sprinkles(cx - 90, cx + 90, rt + 10, rt + 40, 26, 7));
    return out;
  });
}
function drawGinger(ctx, x, y, time) {
  place(ctx, gingerArt(), x, y);
  // Sugar smoke puffing from the chimney.
  for (let k = 0; k < 4; k++) {
    const u = (time * 0.3 + k / 4) % 1;
    ctx.fillStyle = hexA(k % 2 ? '#ffd6e6' : '#ffffff', Math.sin(u * Math.PI) * 0.7);
    ctx.beginPath();
    ctx.arc(x + 61 + Math.sin(time + k) * 4, y - GH_ROOF - 12 - u * 50, 4 + u * 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The giant cupcake: a pleated striped wrapper, a swirl of frosting flat on top (a ledge CC_TOP up),
// sprinkles, a cherry at the edge. Bottom middle at its foot.
const CC_W = 140;
const CC_H = 120;
export const CC_TOP = 80;
export const CC_SPAN = [-46, 46];
function cupcakeArt() {
  return art('cupcake', CC_W, CC_H, () => {
    const out = [];
    const cx = CC_W / 2;
    const H = CC_H;
    const top = H - CC_TOP;
    out.push(T([[cx - 44, H], [cx - 56, top + 36], [cx + 56, top + 36], [cx + 44, H]], SW.wrap));
    for (let k = -4; k <= 4; k++) out.push(F(band([[cx + k * 11, top + 38], [cx + k * 9, H - 2]], () => 2, SW.wrapSh)));
    const [c0, c1] = CC_SPAN;
    out.push(T([[cx - 62, top + 40], [cx - 64, top + 26], [cx - 54, top + 10], [cx + c0, top], [cx + c1, top], [cx + 54, top + 10], [cx + 64, top + 26], [cx + 62, top + 40]], SW.frost));
    for (let k = -2; k <= 2; k++) out.push(F(band(arc(cx + k * 22, top + 24, 14, 10, 200, 340, 8), () => 2, SW.frostSh)));
    out.push(F(R(cx + c0 + 4, top, cx + c1 - 4, top + 3, SW.frostLit)));
    out.push(...sprinkles(cx - 50, cx + 50, top + 6, top + 34, 20, 31));
    out.push(E(cx + 56, top + 2, 9, 9, SW.cherry), F(E(cx + 53, top - 1, 3, 2.4, '#ffffff')), F(band([[cx + 56, top - 6], [cx + 62, top - 18]], () => 1.2, '#6aa04a')));
    return out;
  });
}

// The cake cave: a slab of layered cake at the volcano's foot (chocolate, pink sponge, cream),
// caramel dripping off its top, sprinkles, a doorway cut in it with a candy-cane frame, dark
// chocolate inside (the portal's swirl turns in it, CK_DOOR). Bottom middle at the door.
const CK_W = 270;
const CK_H = 240;
export const CK_DOOR = { w: 64, h: 92 };
function cakeArt() {
  return art('cake', CK_W, CK_H, () => {
    const out = [];
    const cx = CK_W / 2;
    const H = CK_H;
    const body = [[cx - 128, H], [cx - 126, 70], [cx - 110, 34], [cx - 60, 14], [cx + 20, 8], [cx + 90, 20], [cx + 122, 50], [cx + 130, H]];
    out.push(T(body, SW.sponge));
    // The layers.
    for (const [y, c, th] of [[90, SW.choc, 26], [150, SW.choc, 22], [200, SW.choc, 18]]) {
      out.push(F(T([[cx - 127, y], [cx + 129, y - 4], [cx + 130, y + th], [cx - 127, y + th]], c)));
      out.push(F(T([[cx - 127, y - 4], [cx + 129, y - 8], [cx + 129, y - 2], [cx - 127, y + 2]], SW.icing)));
    }
    out.push(F(T([[cx + 80, 20], [cx + 122, 50], [cx + 130, H], [cx + 96, H]], SW.spongeSh)));
    // Caramel over the top, dripping.
    const drips = [];
    for (let x = cx + 120; x >= cx - 120; x -= 16) drips.push([x, 52 + Math.abs(x - cx) * 0.08], [x - 8, 64 + h01(x) * 26]);
    out.push(T([[cx - 126, 70], [cx - 110, 34], [cx - 60, 14], [cx + 20, 8], [cx + 90, 20], [cx + 122, 50], ...drips], SW.caramel));
    out.push(F(T([[cx - 100, 36], [cx - 60, 18], [cx + 10, 12], [cx - 50, 26], [cx - 96, 46]], SW.caramelLit)));
    out.push(...sprinkles(cx - 110, cx + 110, 20, 54, 30, 53));
    // The doorway with its candy-cane frame.
    const dw = CK_DOOR.w / 2;
    out.push(T([[cx - dw - 8, H], ...arc(cx, H - CK_DOOR.h + dw, dw + 8, dw + 8, 180, 360, 16), [cx + dw + 8, H]], '#ffffff'));
    for (let k = 0; k < 10; k++) {
      const a = Math.PI + (k / 9) * Math.PI;
      out.push(F(E(cx + Math.cos(a) * (dw + 4), H - CK_DOOR.h + dw + Math.sin(a) * (dw + 4), 3, 3, SW.cherry)));
    }
    out.push(F(R(cx - dw - 8, H - CK_DOOR.h + dw, cx - dw, H, SW.cherry)), F(R(cx + dw, H - CK_DOOR.h + dw, cx + dw + 8, H, SW.cherry)));
    out.push(T([[cx - dw, H], ...arc(cx, H - CK_DOOR.h + dw, dw, dw, 180, 360, 14), [cx + dw, H]], SW.chocSh));
    out.push(F(T([[cx - dw + 8, H], ...arc(cx, H - CK_DOOR.h + dw + 6, dw - 8, dw - 8, 180, 360, 12), [cx + dw - 8, H]], SW.choc)));
    return out;
  });
}

export const GATE_KINDS = {
  diveshop: { w: DS_W + M * 2, h: DS_H + M, draw: (ctx, x, y) => place(ctx, shopArt(), x, y) },
  quaycrates: { w: CS_W + M * 2, h: CS_H + M, draw: (ctx, x, y) => place(ctx, cratesArt(), x, y) },
  bellcrane: { w: BC_W + M * 2, h: BC_H + M, draw: drawBell },
  carousel: { w: CR_W + M * 2, h: CR_H + M, draw: drawCarousel },
  windkiosk: { w: KS_W + M * 2, h: KS_H + M, draw: drawKiosk },
  greatscope: { w: 420, h: 340, draw: drawScope },
  orrery: { w: 160, h: 200, draw: drawOrrery },
  startent: { w: 280, h: 200, draw: drawTent },
  gingerhut: { w: GH_W + M * 2, h: GH_H + M, draw: drawGinger },
  giantcupcake: { w: CC_W + M * 2, h: CC_H + M, draw: (ctx, x, y) => place(ctx, cupcakeArt(), x, y) },
  cakecave: { w: CK_W + M * 2, h: CK_H + M, draw: (ctx, x, y) => place(ctx, cakeArt(), x, y) },
};
