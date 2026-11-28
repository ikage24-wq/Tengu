// Lady Marigold's rooftop party (2026-11-28, remade with her: the player: "remake their boss rooms also
// with matching art and effects"). The roof is dressed for the party she has thrown every midnight for
// a hundred years with nobody coming: strings of marigold paper lanterns swaying between the chimney
// tops, a bunting of pennants spelling WELCOME! on the first string, a flower box of marigolds on every
// chimney, the stopped clock on the weathervane's pole over where she waits (both hands at twelve), a
// banquet table laid for guests at the stair end with two empty chairs, a gramophone playing her waltz
// to the moon. Painted once with the bosses' fine painting kit (render/bossart/kit.js) in world units;
// the lanterns' sway and glow, the gramophone's notes and the petals drifting over the roof are drawn
// live each frame.
//   drawMarigoldRoof  behind the floor and chimneys (scenery.js BEHIND_GROUND, hooked in by
//                     render/manor.js): the strings, the clock, the table, the gramophone
//   drawMarigoldFront in front of the chimneys (render/manor.js drawManorBack): the flower boxes, the
//                     clock on the tall stack, the petals
import { TAU, lerp, clamp, cr, poly, smooth, ell, ribbon, swell, rgba, mixHex, lin, rad, star4, piece, drawPiece } from '../bossart/kit.js';

const G = 380;
const OUT = '#4a2a4a';
const GOLDEN = ['#fff0c0', '#ffd27a', '#f8a83c', '#e8802a', '#c45e1a'];
const CREAM = ['#fffdf6', '#fff4dc', '#efe0c0'];
const PLUM = ['#d890b8', '#a84a7c', '#7a2a56', '#4e1a3a'];
const GILT = ['#fff2c4', '#f4d488', '#d4a24a', '#9a6a28'];
const WOOD = ['#8a5a6a', '#6a3e50', '#4a2a3a'];
// The chimney tops the strings hang between (data/maps.js manor6 platforms), and the vane's pole.
const TOPS = [[-10, 236], [267, 290], [597, 294], [800, 214], [1003, 294], [1333, 290], [1610, 236]];
const CLOCK = { x: 800, y: 262, r: 27 };
const TABLE = { x: 150 };
const GRAMO = { x: 1236 };

// (a hanging string's point at u between two tops: a soft sag)
function sag(a, b, u, depth) {
  return [lerp(a[0], b[0], u), lerp(a[1], b[1], u) + Math.sin(Math.PI * u) * depth];
}

// ---------- Painted pieces ----------
// A paper lantern: a round marigold-orange shade with soft ribs, a cream band top and bottom, a little
// gold cap and tassel; it glows (the glow is drawn live).
function lanternPiece(col) {
  return piece(`mgroof:lantern:${col}`, [-10, -4, 10, 26], (P) => {
    const body = ell(0, 10, 8.4, 8);
    const fill = col === 1 ? GOLDEN : [CREAM[0], CREAM[1], '#ffe6b0', '#f4c880', GOLDEN[3]];
    P.add(body, rad(-2, 8, 11, [[0, fill[0]], [0.5, fill[2]], [1, fill[3]]]));
    for (const k of [-0.6, -0.2, 0.2, 0.6]) P.band(body, [[k * 8, 2.4], [k * 9.6, 10], [k * 8, 17.6]], () => 0.5, rgba(fill[4], 0.45), { n: 3 });
    P.glow(body, -2, 8, 7, '#ffffff', 0.55);
    const capT = new Path2D();
    capT.rect(-4, 0.4, 8, 2.6);
    P.add(capT, lin(0, 0, 0, 3, [[0, GILT[1]], [1, GILT[3]]]));
    const capB = new Path2D();
    capB.rect(-3.4, 17, 6.8, 2.4);
    P.add(capB, lin(0, 17, 0, 19.4, [[0, GILT[1]], [1, GILT[3]]]));
    P.band(null, [[0, -3], [0, 0.6]], () => 0.8, GILT[3], { n: 1 });
    P.add(poly(cr([[-1.4, 19.4], [1.4, 19.4], [2, 24.6], [0, 25.6], [-2, 24.6]], true, 2)), lin(0, 19, 0, 26, [[0, PLUM[1]], [1, PLUM[2]]]));
  }, { out: OUT, lw: 1.6 });
}
// A pennant with a letter: cream with a plum edge, the letter in plum.
function pennantPiece(ch, tint) {
  return piece(`mgroof:pennant:${ch}:${tint}`, [-8, -2, 8, 20], (P) => {
    const p = poly(cr([[-7, 0], [7, 0], [6, 6], [0, 18], [-6, 6]], true, 2));
    P.add(p, lin(0, 0, 0, 18, [[0, tint ? GOLDEN[1] : CREAM[0]], [1, tint ? GOLDEN[2] : CREAM[2]]]));
    P.band(p, [[-7, 1], [7, 1]], () => 2, PLUM[1], { n: 1 });
    P.detail(null, null, { draw: (ctx) => {
      ctx.fillStyle = PLUM[3];
      ctx.textAlign = 'center';
      ctx.font = '700 8px Georgia, serif';
      ctx.fillText(ch, 0, 11);
    } });
  }, { out: OUT, lw: 1.4 });
}
// The stopped clock on the vane's pole: a gilt case with a scrolled crest and a little marigold, a cream
// face with its numerals' marks, both hands together at twelve; a pendant bracket to the pole.
function clockPiece() {
  const r = CLOCK.r;
  return piece('mgroof:clock', [-r - 12, -r - 22, r + 12, r + 14], (P) => {
    // (the bracket back to the pole)
    P.add(poly([[-3, -r - 6], [3, -r - 6], [3, r + 8], [-3, r + 8]]), lin(-3, 0, 3, 0, [[0, GILT[3]], [0.5, GILT[1]], [1, GILT[3]]]));
    // the crest: two gilt scrolls and a marigold
    for (const s of [-1, 1]) P.add(poly(cr([[0, -r - 2], [s * 10, -r - 14], [s * 18, -r - 10], [s * 15, -r - 4], [s * 9, -r - 8], [s * 4, -r + 2]], true, 3)), lin(0, -r - 16, 0, -r, [[0, GILT[0]], [1, GILT[2]]]));
    P.add(ell(0, -r - 10, 6, 6), rad(-1, -r - 11, 7, [[0, GOLDEN[1]], [1, GOLDEN[3]]]));
    for (let i = 0; i < 9; i++) {
      const an = (i / 9) * TAU;
      P.detail(ell(Math.cos(an) * 4, -r - 10 + Math.sin(an) * 4, 2.6, 1.8, an), GOLDEN[i % 2 ? 1 : 2]);
    }
    P.detail(ell(0, -r - 10, 1.6, 1.6), GOLDEN[4]);
    // the case and the face
    const cs = ell(0, 0, r + 6, r + 6);
    P.add(cs, rad(-8, -10, r * 2, [[0, GILT[0]], [0.5, GILT[2]], [1, GILT[3]]]));
    for (let i = 0; i < 24; i++) {
      const an = (i / 24) * TAU;
      P.detail(ell(Math.cos(an) * (r + 3), Math.sin(an) * (r + 3), 2.4, 1.2, an + Math.PI / 2), rgba(GILT[3], 0.45), { clip: cs });
    }
    const face = ell(0, 0, r, r);
    P.detail(face, rad(-6, -8, r * 1.5, [[0, '#fffdf6'], [0.7, '#f6ecd8'], [1, '#e4d4b4']]));
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * TAU - Math.PI / 2;
      const r0 = i % 3 ? r * 0.82 : r * 0.74;
      P.band(face, [[Math.cos(an) * r0, Math.sin(an) * r0], [Math.cos(an) * r * 0.92, Math.sin(an) * r * 0.92]], () => (i % 3 ? 1 : 2.2), PLUM[3], { n: 1 });
    }
    // both hands together at twelve, a little marigold at their pin
    P.add(poly(cr([[-1.6, 2], [0, -r * 0.82], [1.6, 2]], true, 1)), PLUM[3], false);
    P.add(poly(cr([[-2.4, 2], [0, -r * 0.6], [2.4, 2]], true, 1)), PLUM[2], false);
    P.add(ell(0, 0, 2.8, 2.8), GOLDEN[2], false);
    P.glow(face, -10, -12, 16, '#ffffff', 0.5);
  }, { out: OUT, lw: 2 });
}
// A flower box on a chimney's face: a plum-painted box spilling marigolds and leaves.
function flowerBoxPiece(w) {
  return piece(`mgroof:box:${w}`, [-6, -16, w + 6, 16], (P) => {
    const box = new Path2D();
    box.roundRect?.(0, 0, w, 12, 2) ?? box.rect(0, 0, w, 12);
    P.add(box, lin(0, 0, 0, 12, [[0, PLUM[1]], [1, PLUM[3]]]));
    P.band(box, [[1, 2], [w - 1, 2]], () => 1, rgba(PLUM[0], 0.7), { n: 1 });
    for (let i = 0; i < Math.floor(w / 7); i++) {
      const fx = 4 + i * 7 + (i % 2) * 1.5;
      P.add(poly(cr([[fx - 3, 2], [fx - 1, -6], [fx + 3, 1]], true, 2)), lin(fx, -6, fx, 2, [[0, '#a8d888'], [1, '#5e9450']]));
    }
    for (let i = 0; i < Math.floor(w / 10); i++) {
      const fx = 6 + i * 10;
      const fy = -6 - (i % 2) * 4;
      const fl = ell(fx, fy, 4.4, 4.2);
      P.add(fl, rad(fx - 1, fy - 1, 5, [[0, GOLDEN[1]], [0.6, GOLDEN[2]], [1, GOLDEN[3]]]));
      for (let k = 0; k < 7; k++) {
        const an = (k / 7) * TAU + i;
        P.detail(ell(fx + Math.cos(an) * 2.6, fy + Math.sin(an) * 2.6, 1.6, 1.1, an), rgba(GOLDEN[4], 0.35), { clip: fl });
      }
      P.detail(ell(fx, fy, 1.2, 1.2), GOLDEN[4]);
    }
  }, { out: OUT, lw: 1.6 });
}
// The banquet table laid for guests nobody sent: a white cloth with a marigold runner, a tiered cake
// stand, a cake with one candle, a teapot, four glasses; two empty chairs pulled out.
function tablePiece() {
  return piece('mgroof:table', [-70, -78, 70, 2], (P) => {
    // the chairs behind, their backs scrolled
    for (const cx of [-46, 46]) {
      const back = poly(cr([[cx - 9, -6], [cx - 10, -40], [cx - 4, -50], [cx + 4, -50], [cx + 10, -40], [cx + 9, -6]], true, 3));
      P.add(back, lin(cx - 10, 0, cx + 10, 0, [[0, GILT[3]], [0.5, GILT[1]], [1, GILT[3]]]));
      P.detail(ell(cx, -34, 6, 9), lin(0, -43, 0, -25, [[0, PLUM[0]], [1, PLUM[2]]]));
      for (const lx of [cx - 8, cx + 8]) P.add(poly([[lx - 1.4, -8], [lx + 1.4, -8], [lx + 1.6, 0], [lx - 1.6, 0]]), GILT[2]);
    }
    // the table and its cloth
    const cloth = poly(cr([[-40, -30], [40, -30], [44, -4], [36, -2], [28, -6], [18, -2], [8, -6], [-2, -2], [-12, -6], [-22, -2], [-32, -6], [-44, -4]], true, 2));
    P.add(cloth, lin(0, -30, 0, 0, [[0, CREAM[0]], [1, CREAM[2]]]));
    P.band(cloth, [[-40, -29], [40, -29]], () => 3, GOLDEN[2], { n: 1 });
    for (const fx of [-30, -10, 10, 30]) P.band(cloth, [[fx, -27], [fx + 2, -6]], () => 0.8, rgba(CREAM[2], 0.9), { n: 1 });
    // the cake stand, three tiers of little cakes
    for (const [w, y] of [[22, -32], [16, -44], [10, -56]]) {
      P.add(ell(-14, y, w / 2, 2), lin(0, y - 2, 0, y + 2, [[0, '#ffffff'], [1, '#d8cce8']]));
      for (let i = 0; i < Math.max(1, Math.floor(w / 6)); i++) {
        const cx = -14 - w / 2 + 4 + i * 6;
        P.add(poly(cr([[cx - 2.4, y - 1], [cx - 2, y - 5], [cx + 2, y - 5], [cx + 2.4, y - 1]], true, 2)), i % 2 ? '#ffb4cc' : '#ffe0a0', true, { lw: 1 });
      }
    }
    P.band(null, [[-14, -58], [-14, -32]], () => 1.2, GILT[2], { n: 1 });
    // the cake with its one candle (its flame burns live)
    P.add(poly(cr([[2, -30], [2, -44], [22, -44], [22, -30]], true, 1)), lin(0, -44, 0, -30, [[0, '#fff6ea'], [1, '#f4dcc4']]));
    P.band(null, [[2, -42], [22, -42]], () => 3, '#ffb4cc', { n: 1 });
    P.add(poly([[11, -52], [13, -52], [13, -44], [11, -44]]), lin(11, 0, 13, 0, [[0, CREAM[0]], [1, CREAM[2]]]));
    // the glasses, and a teapot
    for (const gx of [28, 34]) P.add(poly(cr([[gx - 2.4, -44], [gx + 2.4, -44], [gx + 1, -36], [gx + 1, -31], [gx + 2.6, -30], [gx - 2.6, -30], [gx - 1, -31], [gx - 1, -36]], true, 1)), 'rgba(240,236,255,0.85)', true, { lw: 1 });
    P.add(poly(cr([[-36, -30], [-38, -38], [-32, -42], [-24, -42], [-20, -36], [-22, -30]], true, 2)), lin(-38, -42, -20, -30, [[0, '#ffffff'], [1, '#d4c8e4']]));
  }, { out: OUT, lw: 2 });
}
// The gramophone: a plum box with a brass crank, a turntable with its record, a great flower of a horn.
function gramoPiece() {
  return piece('mgroof:gramo', [-30, -78, 34, 2], (P) => {
    const box = new Path2D();
    box.rect(-16, -22, 32, 22);
    P.add(box, lin(-16, 0, 16, 0, [[0, WOOD[2]], [0.4, WOOD[0]], [1, WOOD[1]]]));
    P.band(box, [[-14, -20], [14, -20]], () => 1, rgba(GILT[1], 0.8), { n: 1 });
    P.add(ell(0, -23, 14, 2.4), '#2a1a2a');
    P.detail(ell(0, -23.4, 4, 0.8), GOLDEN[2]);
    P.band(null, [[16, -12], [22, -12], [24, -8]], () => 1.6, GILT[2], { n: 3 });
    // the arm and the horn
    P.band(null, [[8, -24], [10, -34], [6, -44]], () => 2.4, GILT[2], { n: 4 });
    const horn = poly(cr([[4, -44], [8, -46], [22, -66], [30, -74], [18, -76], [4, -70], [-4, -58], [2, -48]], true, 4));
    P.add(horn, lin(0, -76, 30, -44, [[0, GOLDEN[0]], [0.5, GOLDEN[2]], [1, GILT[3]]]));
    P.detail(poly(cr([[22, -66], [30, -74], [18, -76], [8, -70]], true, 3)), rgba(PLUM[2], 0.55), { clip: horn });
    for (const k of [0.3, 0.6]) P.band(horn, [[lerp(2, 30, k), -48], [lerp(-2, 22, k), -72]], () => 0.8, rgba(GILT[3], 0.5), { n: 1 });
  }, { out: OUT, lw: 2 });
}

// ---------- Behind the chimneys: the strings, the clock, the table, the gramophone ----------
export function drawMarigoldRoof(ctx, map, cam, width, time) {
  if (map.id !== 'manor6') return;
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  // the strings, each a soft sagging cord of plum, its lanterns swaying, glowing
  const WORD = 'WELCOME!';
  for (let s = 0; s < TOPS.length - 1; s++) {
    const a = TOPS[s];
    const b = TOPS[s + 1];
    if (Math.max(a[0], b[0]) < cam.x - 40 || Math.min(a[0], b[0]) > cam.x + width + 40) continue;
    const depth = 34 + Math.abs(b[0] - a[0]) * 0.04;
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const p = sag(a, b, i / 20, depth);
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.strokeStyle = PLUM[3];
    ctx.lineWidth = 1.4;
    ctx.stroke();
    const n = s === 1 ? WORD.length : Math.max(3, Math.round(Math.abs(b[0] - a[0]) / 60));
    for (let i = 0; i < n; i++) {
      const u = s === 1 ? 0.13 + ((i + 0.5) / n) * 0.74 : (i + 0.5) / n;
      const p = sag(a, b, u, depth);
      const sw = Math.sin(time * 1.4 + s * 1.7 + i * 0.9) * 0.12;
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(sw);
      if (s === 1) {
        const pc = pennantPiece(WORD[i], i % 2);
        drawPiece(ctx, pc, 'line');
        drawPiece(ctx, pc, 'fill');
      } else {
        const g = ctx.createRadialGradient(0, 10, 0, 0, 10, 26);
        const fl = 0.3 + 0.08 * Math.sin(time * 3 + i * 2 + s);
        g.addColorStop(0, `rgba(255,210,120,${fl})`);
        g.addColorStop(1, 'rgba(255,210,120,0)');
        ctx.fillStyle = g;
        ctx.fillRect(-26, -16, 52, 52);
        const pc = lanternPiece(i % 3 === 1 ? 2 : 1);
        drawPiece(ctx, pc, 'line');
        drawPiece(ctx, pc, 'fill');
      }
      ctx.restore();
    }
  }
  // the banquet table and its candle
  ctx.save();
  ctx.translate(TABLE.x, G);
  drawPiece(ctx, tablePiece(), 'line');
  drawPiece(ctx, tablePiece(), 'fill');
  const f = 1 + Math.sin(time * 9) * 0.12;
  const fg = ctx.createRadialGradient(12, -55, 0, 12, -55, 16);
  fg.addColorStop(0, 'rgba(255,220,150,0.4)');
  fg.addColorStop(1, 'rgba(255,220,150,0)');
  ctx.fillStyle = fg;
  ctx.fillRect(-4, -71, 32, 32);
  ctx.beginPath();
  ctx.moveTo(12, -52 - 6 * f);
  ctx.quadraticCurveTo(14, -54, 12, -52);
  ctx.quadraticCurveTo(10, -54, 12, -52 - 6 * f);
  ctx.fillStyle = '#ffd27a';
  ctx.fill();
  ctx.restore();
  // the gramophone, its record turning, notes rising from its horn
  ctx.save();
  ctx.translate(GRAMO.x, G);
  drawPiece(ctx, gramoPiece(), 'line');
  drawPiece(ctx, gramoPiece(), 'fill');
  ctx.save();
  ctx.translate(0, -23);
  ctx.scale(1, 0.17);
  ctx.rotate(time * 3);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 10, 0, 1.2);
  ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.3 + i / 3) % 1;
    ctx.save();
    ctx.globalAlpha = Math.sin(Math.PI * u) * 0.85;
    ctx.translate(26 + u * 18 + Math.sin(u * 6 + i) * 5, -72 - u * 44);
    ctx.fillStyle = i % 2 ? GOLDEN[3] : PLUM[1];
    ctx.font = `700 ${9 + u * 3}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.fillText(i % 2 ? '♪' : '♫', 0, 0);
    ctx.restore();
  }
  ctx.restore();
  ctx.restore();
}

// ---------- In front of the chimneys: their flower boxes, and petals drifting over the roof ----------
export function drawMarigoldFront(ctx, world, cam, time) {
  const map = world.map;
  if (map.id !== 'manor6') return;
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  for (const p of map.platforms) {
    if (p.w > 78 || p.y > 310) continue;
    if (p.x + p.w < cam.x - 20 || p.x > cam.x + 680) continue;
    const pc = flowerBoxPiece(p.w - 18);
    ctx.save();
    ctx.translate(p.x + 9, p.y + 22);
    drawPiece(ctx, pc, 'line');
    drawPiece(ctx, pc, 'fill');
    ctx.restore();
  }
  // the stopped clock on the face of the tall stack over where she waits
  ctx.save();
  ctx.translate(CLOCK.x, CLOCK.y);
  const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 70);
  cg.addColorStop(0, 'rgba(255,236,170,0.28)');
  cg.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(-70, -70, 140, 140);
  drawPiece(ctx, clockPiece(), 'line');
  drawPiece(ctx, clockPiece(), 'fill');
  ctx.restore();
  for (let i = 0; i < 12; i++) {
    const u = (time * 0.04 + i * 0.083) % 1;
    const x = cam.x + ((i * 97 + time * 18) % 700) - 30;
    const y = 120 + u * (G - 130) + Math.sin(time * 1.3 + i) * 10;
    ctx.save();
    ctx.globalAlpha = Math.sin(Math.PI * u) * 0.85;
    ctx.translate(x, y);
    ctx.rotate(time * 1.5 + i);
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.bezierCurveTo(2.6, -1.8, 2, 2.4, 0, 3);
    ctx.bezierCurveTo(-2, 2.4, -2.6, -1.8, 0, -3);
    ctx.fillStyle = i % 2 ? GOLDEN[1] : GOLDEN[2];
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}
