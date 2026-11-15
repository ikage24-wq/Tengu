// The Mochi Show, drawn (world/mochi-show.js runs it): the striped show tent on the Mochi Market's
// terrace, and inside, the hall.
//
// The hall (2026-11-15): a deep plum back wall hung with a velvet drape, swags of fairy lights and a
// round lit sign; the curtain's wings either side, velvet with gold tassels, under a scalloped
// pelmet; the stage's boards with a pink runway carpet across them, footlights along its edge. A
// soft spotlight finds whoever's on and follows them in. Down in front, in the dark: the judges'
// table - Hayate, Kinako and Maestro Mugi behind its cloth, their cards flipping up one by one - and
// rows of little round Mochi heads, bobbing, cheering when the cards go up. At the end the top three
// get their rosettes and the confetti flies.

import { R, E, T, F, snap, mix } from './pixel.js';
import { art, place, BACKDROPS } from './scenery.js';
import { drawMochiAnim } from './mochi-anim.js';
import { drawHero } from './hero.js';
import { drawHayate } from './hayate.js';
import { signText } from './signfont.js';
import { NPCS } from '../data/npcs.js';
import { JUDGES, ACTS } from '../data/mochi-show.js';
import { SHOW_FX } from './mochi-show-acts.js';
import { drawTaiko, drawMask, drawRose, twinkle, TAIKO_SIZE } from './mochi-show-props.js';
import { newRecord } from '../data/mochi-raise.js';
import { rollMochi } from '../data/mochi-genes.js';
import { FLOOR, STAGE, CARD_AT, INTRO, RESULTS, HALL } from '../world/mochi-show.js';
import { VW, VH } from '../input.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

// ---------- The tent, out on the market's terrace (render/garden.js: 'mg_showtent') ----------
const tentArt = () => art('mg-showtent', 124, 122, () => {
  const out = [];
  const stripe = (x0, x1, c) => T([[62, 6], [x1, 82], [x0, 82]], c);
  // The roof: a peaked cone in pink and cream stripes (the cream ones a touch shaded on its right,
  // away from the light), its scalloped skirt hanging over the walls.
  out.push(T([[62, 4], [116, 82], [8, 82]], '#ff9ec0'));
  for (let i = 1; i < 8; i += 2) out.push(F(stripe(8 + i * 13.5, 8 + (i + 1) * 13.5, i >= 5 ? '#f2dfd2' : '#fff4ea')));
  // The walls.
  for (let i = 0; i < 7; i++) out.push(R(14 + i * 13.7, 80, 13.7, 40, i % 2 ? '#fff4ea' : '#ffb3cf'));
  // The doorway: flaps tied back on a warm glowing inside.
  out.push(F(T([[46, 120], [52, 88], [72, 88], [78, 120]], '#ffd79a')));
  out.push(F(T([[50, 120], [55, 94], [69, 94], [74, 120]], '#ffe8b8')));
  out.push(T([[40, 120], [52, 86], [56, 104], [46, 120]], '#ff8fb4'), T([[84, 120], [72, 86], [68, 104], [78, 120]], '#ff8fb4'));
  out.push(F(E(53, 102, 2, 1.4, '#d8a03a')), F(E(71, 102, 2, 1.4, '#d8a03a')));
  // The scalloped skirt of the roof.
  for (let i = 0; i < 9; i++) out.push(E(12 + i * 12.5, 82, 6.4, 4.4, i % 2 ? '#ff9ec0' : '#fff4ea'));
  // Its pole's tip and the bunting from the peak.
  out.push(R(61, 0, 2, 7, '#c8945a'));
  return out;
});
export function drawShowTent(ctx, x, gy, time, wx) {
  place(ctx, tentArt(), snap(x), gy + 2);
  // The pennant at the top, fluttering, a gold star on it.
  const px = x;
  const py = gy - 120 + 2;
  const flap = Math.sin(time * 3 + wx) * 1.4;
  ctx.fillStyle = '#ff6f9a';
  ctx.beginPath();
  ctx.moveTo(px + 1, py - 1);
  ctx.quadraticCurveTo(px + 8, py + 1 + flap, px + 15, py + 2 + flap * 1.4);
  ctx.lineTo(px + 1, py + 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffe680';
  ctx.fillRect(px + 5, py + 1.5 + flap * 0.5, 2, 2);
  // Bunting from the peak down either side.
  const flags = ['#ffe680', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffb3c8'];
  for (const side of [-1, 1]) {
    for (let k = 0; k < 6; k++) {
      const u = (k + 0.5) / 6;
      const fx = px + side * (8 + u * 50);
      const fy = py + 10 + u * 62 + Math.sin(Math.PI * u) * 4;
      ctx.fillStyle = flags[(k + (side > 0 ? 2 : 0)) % flags.length];
      ctx.beginPath();
      ctx.moveTo(fx - 2.4, fy);
      ctx.lineTo(fx + 2.4, fy);
      ctx.lineTo(fx, fy + 4 + Math.sin(time * 4 + k) * 0.5);
      ctx.closePath();
      ctx.fill();
    }
  }
  // The sign over the door.
  ctx.fillStyle = '#fff6ea';
  ctx.fillRect(x - 32, gy - 52, 64, 13);
  ctx.fillStyle = '#e0659f';
  ctx.fillRect(x - 32, gy - 52, 64, 1.4);
  ctx.fillRect(x - 32, gy - 40.4, 64, 1.4);
  signText(ctx, 'MOCHI SHOW', x, gy - 48.5, { align: 'center', color: '#e0659f' });
}

// ---------- The hall ----------
// The camera never moves in the hall (render/scene.js: SHOW_CAM), so the hall is laid out in the
// world for that one shot: the pelmet along its top edge, the lit sign under it, the wings framing
// either side, the stage's lip, and the dark pit below with the judges and the audience.
const TOP = HALL.y0;
const X0 = HALL.x0;
const X1 = HALL.x1;
const BOTTOM = HALL.y1;
const LIP = FLOOR + 12;
const SIGN = { x: STAGE.mid, y: TOP + 43, rx: 46, ry: 16 };

// Its back wall: a velvet drape in soft folds, swags of fairy lights, the round lit sign.
function hallBack(ctx, t, cam, width, y0, time) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  const g = ctx.createLinearGradient(0, TOP, 0, FLOOR);
  g.addColorStop(0, '#2a1834');
  g.addColorStop(1, '#4e2648');
  ctx.fillStyle = g;
  ctx.fillRect(X0 - 4, TOP - 4, X1 - X0 + 8, FLOOR - TOP + 8);
  // The drape: folds lit from the spotlight's side, each a lighter crest and a darker trough.
  for (let x = X0 - 18; x < X1 + 18; x += 18) {
    const lit = 0.5 + 0.5 * Math.sin(x * 0.35);
    ctx.fillStyle = mix('#5a2a52', '#7a3a66', lit);
    ctx.fillRect(x, TOP + 18, 10, FLOOR - TOP - 18);
    ctx.fillStyle = mix('#48203f', '#5a2a52', lit);
    ctx.fillRect(x + 10, TOP + 18, 8, FLOOR - TOP - 18);
  }
  // The stage's boards: honey-coloured planks, their top edge catching the light.
  ctx.fillStyle = '#a8683e';
  ctx.fillRect(X0 - 4, FLOOR - 1, X1 - X0 + 8, LIP - FLOOR + 2);
  ctx.fillStyle = '#d29a62';
  ctx.fillRect(X0 - 4, FLOOR - 1, X1 - X0 + 8, 1.6);
  ctx.fillStyle = '#8a5432';
  for (let x = X0 - 4 + 7; x < X1 + 4; x += 23) ctx.fillRect(x, FLOOR + 0.6, 0.8, 4);
  // (Its foot in shadow, where it meets the boards.)
  const foot = ctx.createLinearGradient(0, FLOOR - 26, 0, FLOOR);
  foot.addColorStop(0, 'rgba(30,12,30,0)');
  foot.addColorStop(1, 'rgba(30,12,30,0.55)');
  ctx.fillStyle = foot;
  ctx.fillRect(X0 - 4, FLOOR - 26, X1 - X0 + 8, 26);
  // Swags of fairy lights, either side of the sign.
  for (const [a, b] of [[X0 - 6, SIGN.x - SIGN.rx - 4], [SIGN.x + SIGN.rx + 4, X1 + 6]]) {
    for (const [lift, sag] of [[0, 15], [14, 11]]) {
      const y = TOP + 30 + lift;
      ctx.strokeStyle = '#2e1a2e';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(a, y);
      ctx.quadraticCurveTo((a + b) / 2, y + sag * 2, b, y);
      ctx.stroke();
      for (let i = 1; i < 11; i++) {
        const u = i / 11;
        const lx = a + (b - a) * u;
        const ly = y + 4 * u * (1 - u) * sag + 1;
        const tw = 0.62 + 0.38 * Math.sin(time * 2.2 + i * 1.7 + lift + a * 0.1);
        ctx.fillStyle = ['#fff3b0', '#ffc8e0', '#c8e8ff'][(i + lift) % 3];
        ctx.globalAlpha = 0.2 * tw;
        ctx.beginPath();
        ctx.arc(lx, ly, 3.2, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 0.55 + 0.45 * tw;
        ctx.beginPath();
        ctx.arc(lx, ly, 1.1, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
  // The round sign: a frame in pink, a ring of chasing bulbs, "MOCHI SHOW" and two stars.
  const { x: sx, y: sy, rx, ry } = SIGN;
  ctx.fillStyle = 'rgba(255,190,220,0.12)';
  ctx.beginPath();
  ctx.ellipse(sx, sy, rx + 8, ry + 4, 0, 0, TAU);
  ctx.fill();
  for (const [grow, c] of [[4, '#c0385e'], [2, '#ff9ec0'], [0, '#fff6fa']]) {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(sx, sy, rx + grow - 2, ry + grow - 2, 0, 0, TAU);
    ctx.fill();
  }
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * TAU;
    const on = (Math.floor(time * 5) + i) % 4 !== 0;
    ctx.fillStyle = on ? '#fff3b0' : '#a86a58';
    ctx.fillRect(sx + Math.cos(a) * (rx + 1) - 0.8, sy + Math.sin(a) * (ry + 1) - 0.8, 1.6, 1.6);
  }
  signText(ctx, 'MOCHI SHOW', sx, sy - 3, { align: 'center', color: '#e0659f' });
  for (const side of [-1, 1]) star(ctx, sx + side * (rx - 10), sy, 3.2, '#f2c94c');
  ctx.restore();
  return true;
}
function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * TAU;
    const rr = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
}
// The wings and the pelmet: velvet curtains either side, each folds of light and dark gathered by a
// gold tasselled tie-back, and the scalloped pelmet across the top with its gold fringe.
function hallWings(ctx, t, cam, width, y0, time) {
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.translate(-cam.x, -cam.y);
  for (const side of [-1, 1]) {
    const edge = side < 0 ? STAGE.left + 10 : STAGE.right - 10;
    const outer = side < 0 ? X0 - 4 : X1 + 4;
    const tie = FLOOR - 70;
    // Folds: straight down from the pelmet, pulled in to the tie-back, flaring out to the floor.
    const at = (u, y) => {
      const pull = y < tie ? (y - TOP) / (tie - TOP) : 1 - (y - tie) / (FLOOR - tie) * 0.6;
      const inner = edge + side * pull * pull * 14;
      return outer + (inner - outer) * u;
    };
    const n = 5;
    for (let i = 0; i < n; i++) {
      const u0 = i / n;
      const u1 = (i + 1) / n;
      ctx.fillStyle = i % 2 ? '#b02c56' : '#cc4470';
      ctx.beginPath();
      for (let y = TOP; y <= FLOOR; y += 8) ctx.lineTo(at(u0, y), y);
      for (let y = FLOOR; y >= TOP; y -= 8) ctx.lineTo(at(u1, y), y);
      ctx.closePath();
      ctx.fill();
    }
    // The inner edge's lit hem, the shade behind it.
    ctx.strokeStyle = '#e8628a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let y = TOP; y <= FLOOR; y += 8) ctx.lineTo(at(1, y) - side * 0.6, y);
    ctx.stroke();
    // The tie-back: a gold cord and its tassel, swinging a little.
    const tx = at(1, tie);
    const sw = Math.sin(time * 1.3 + side) * 0.6;
    ctx.fillStyle = '#f2c94c';
    ctx.fillRect(Math.min(tx, outer) , tie - 1.5, Math.abs(tx - outer), 3);
    ctx.beginPath();
    ctx.arc(tx, tie, 3, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#d8a03a';
    ctx.beginPath();
    ctx.moveTo(tx - 1.6, tie + 2);
    ctx.lineTo(tx + 1.6, tie + 2);
    ctx.lineTo(tx + 3 + sw, tie + 13);
    ctx.lineTo(tx - 3 + sw, tie + 13);
    ctx.closePath();
    ctx.fill();
  }
  // The pelmet: a velvet band, its scallops, and the gold fringe swaying under them.
  ctx.fillStyle = '#a82a50';
  ctx.fillRect(X0 - 4, TOP - 4, X1 - X0 + 8, 15);
  ctx.fillStyle = '#c0385e';
  ctx.fillRect(X0 - 4, TOP + 9, X1 - X0 + 8, 1.4);
  for (let x = X0 - 20; x < X1 + 30; x += 28) {
    ctx.fillStyle = '#c0385e';
    ctx.beginPath();
    ctx.ellipse(x + 14, TOP + 11, 14, 8, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#f2c94c';
    for (let f = 0; f < 7; f++) {
      const fx = x + 3 + f * 3.7;
      const dy = Math.sin(((fx - x - 14) / 14) * Math.PI / 2 + Math.PI / 2) * 7;
      ctx.fillRect(fx, TOP + 11 + dy, 0.9, 3 + Math.sin(time * 1.6 + fx * 0.3) * 0.5);
    }
  }
  ctx.restore();
  return true;
}
BACKDROPS.push({
  far: (ctx, t, cam, width, y0, time) => (t.skyline === 'course:showhall' ? hallBack(ctx, t, cam, width, y0, time) : false),
  mid: (ctx, t, cam, width, y0, time) => (t.skyline === 'course:showhall' ? hallWings(ctx, t, cam, width, y0, time) : false),
});

// ---------- The show ----------
// Maestro Mugi, the talent judge: a grand old Mochi in a beret and monocle.
let mugi = null;
const mugiOf = () => {
  if (mugi) return mugi;
  const rec = newRecord(rollMochi(424242, { coat: null }));
  Object.assign(rec, { stage: 'grown', personality: 'proud', wear: { hat: 'beret', eyes: 'monocle', over: 'cape' } });
  mugi = { genes: rec, dir: 1, size: 'grown', mode: 'run', speed: 0, dist: 0, tired: 0, rest: false };
  return mugi;
};
// The judges' table, down in front on the left, the three of them sat behind it facing the stage.
const JUDGE_X = [160, 198, 236];
const TABLE = { x0: 140, x1: 254, y: FLOOR + 34 };
// (Each holds its card up beside its face, on the side it faces, its hand round the handle.)
const CARD_SIDE = [13, 12, 10];
const HAND = ['#ffe6da', '#ffe0cc', '#fff4ec'];
// The audience, in the pit to the right of the judges: three rows of Mochi seen from behind.
const ROWS = [
  { y: FLOOR + 28, r: 5.5, step: 15, dim: 0.62 },
  { y: FLOOR + 38, r: 7, step: 19, dim: 0.5 },
  { y: FLOOR + 50, r: 8.5, step: 23, dim: 0.38 },
];
const SEAT_FROM = 266;
const PASTEL = ['#ffd6e4', '#fff1c8', '#d6f0ff', '#e0f5d8', '#eadcff', '#ffe2cc', '#ffffff'];
const PIT = '#1e1024';

// Where a turn has got to: whose it is, which part, how far into it.
const turnOf = (S) => (S.phase === 'turn' ? { c: S.cast[S.order[S.turn]], step: S.step, st: S.st } : null);
// (The intro: the welcome, then each judge lit and named in turn.)
const INTRO_JUDGE = [1.3, 2.3, 3.3];
const introJudge = (S) => (S.phase === 'intro' ? INTRO_JUDGE.findLastIndex((at) => S.t >= at) : -1);

export function drawShow(ctx, world, cam, time, layer) {
  const S = world.show;
  if (!S) return;
  if (layer === 'back') return drawStage(ctx, S, cam, time);
  drawFront(ctx, S, cam, time);
}

function drawStage(ctx, S, cam, time) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  // The runway carpet across the stage, a gold edge to it.
  ctx.fillStyle = '#e8709a';
  ctx.fillRect(STAGE.left, FLOOR, STAGE.right - STAGE.left, 4);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(STAGE.left, FLOOR - 0.5, STAGE.right - STAGE.left, 2);
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(STAGE.left, FLOOR + 4, STAGE.right - STAGE.left, 0.8);
  // The spotlight: a soft cone from above onto whoever's on (or the middle of the stage), easing
  // after them as they walk, and its pool of light on the boards.
  const T0 = turnOf(S);
  const goal = T0?.c.on ? T0.c.x : STAGE.mid;
  const dt = Math.min(0.1, Math.max(0, time - (S.spotAt ?? time)));
  S.spotAt = time;
  S.spot = S.spot == null ? goal : S.spot + (goal - S.spot) * (1 - Math.exp(-dt * 7));
  const sx = S.spot;
  const k = S.phase === 'intro' ? Math.min(1, S.t / 1.2) : 1;
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, TOP, 0, FLOOR);
  g.addColorStop(0, `rgba(255,236,210,${0.03 * k})`);
  g.addColorStop(1, `rgba(255,236,210,${0.15 * k})`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(sx - 7, TOP);
  ctx.lineTo(sx + 7, TOP);
  ctx.lineTo(sx + 30, FLOOR);
  ctx.lineTo(sx - 30, FLOOR);
  ctx.closePath();
  ctx.fill();
  const pool = ctx.createRadialGradient(sx, FLOOR, 2, sx, FLOOR, 32);
  pool.addColorStop(0, `rgba(255,240,215,${0.3 * k})`);
  pool.addColorStop(1, 'rgba(255,240,215,0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(sx, FLOOR, 32, 6, 0, 0, TAU);
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // Whoever's on the stage (the drum or the lit boards of its act behind it, its notes and sparkle
  // in front).
  drawActBack(ctx, S, time);
  for (const c of S.cast) {
    if (!c.on) continue;
    c.m.anchors = {};
    drawMochiAnim(ctx, c.m, c.x, FLOOR, time);
  }
  drawActFront(ctx, S, time);
  ctx.restore();
}

function drawFront(ctx, S, cam, time) {
  ctx.save();
  ctx.translate(-cam.x, -cam.y);
  // The stage's lip: its dark front, a gold trim, the footlights glowing up off it.
  ctx.fillStyle = '#3a1c34';
  ctx.fillRect(X0 - 4, FLOOR + 4, X1 - X0 + 8, LIP - FLOOR - 4);
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(X0 - 4, FLOOR + 4.8, X1 - X0 + 8, 0.8);
  for (let x = X0 + 14; x < X1; x += 32) {
    ctx.fillStyle = '#5a2a48';
    ctx.fillRect(x - 4, FLOOR + 6, 8, 3.4);
    ctx.fillStyle = '#fff3c4';
    ctx.fillRect(x - 3, FLOOR + 6.6, 6, 1.6);
    ctx.globalCompositeOperation = 'lighter';
    const fg = ctx.createRadialGradient(x, FLOOR + 6, 1, x, FLOOR + 6, 14);
    fg.addColorStop(0, 'rgba(255,230,180,0.22)');
    fg.addColorStop(1, 'rgba(255,230,180,0)');
    ctx.fillStyle = fg;
    ctx.fillRect(x - 14, FLOOR - 8, 28, 14);
    ctx.globalCompositeOperation = 'source-over';
  }
  // The pit: dark, a little warmer near the stage where its light spills down.
  const pit = ctx.createLinearGradient(0, LIP, 0, BOTTOM);
  pit.addColorStop(0, '#2c1630');
  pit.addColorStop(1, PIT);
  ctx.fillStyle = pit;
  ctx.fillRect(X0 - 4, LIP, X1 - X0 + 8, BOTTOM - LIP + 4);
  // The audience, from behind: round pastel Mochi in the dark, their tops lit by the stage, sprouts
  // up; bobbing along, and when the cards go up or at the end, paws up, bouncing, hearts rising.
  const T0 = turnOf(S);
  const cheering = (T0?.step === 'cards' && T0.st > CARD_AT[2]) || T0?.step === 'out' || (S.phase === 'results' && S.t > RESULTS.lineup) || S.phase === 'done';
  for (const [ri, row] of ROWS.entries()) {
    for (let x = SEAT_FROM + (ri % 2) * row.step * 0.5; x < X1 + row.r; x += row.step) {
      const h = hash(x * 0.37 + ri * 9);
      const base = PASTEL[Math.floor(h * PASTEL.length)];
      const bob = cheering ? Math.abs(Math.sin(time * 5.5 + h * 9)) * row.r * 0.45 : Math.sin(time * 1.3 + h * 7) * 0.5;
      // (Each its own size and a little off the seat line, so it reads as a crowd, not a pattern.)
      const r = row.r * (0.88 + hash(h * 31) * 0.24);
      audienceMochi(ctx, x + (hash(h * 17) - 0.5) * 4, row.y - bob + (row.r - r) * 0.8, r, base, row.dim, cheering, time, h);
      if (cheering && h > 0.7) {
        const u = (time * 0.7 + h * 3) % 1;
        ctx.globalAlpha = Math.sin(Math.PI * u);
        heart(ctx, x + Math.sin(u * 6 + h) * 3, row.y - row.r * 2 - u * 30, 1.8, h > 0.85 ? '#ff6f9a' : '#ffb3c8');
        ctx.globalAlpha = 1;
      }
    }
  }
  // The judges at their table, its cloth in front of them, their name cards on it.
  drawJudges(ctx, S, time, T0);
  // The rosettes, over the winners' heads.
  drawRosettes(ctx, S, time);
  ctx.restore();
}

// Words over it all - the welcome, whose turn, the scores, the results - and the confetti, on the
// screen itself (render/scene.js, after the hall's light) so they stay crisp and bright.
export function drawShowScreen(ctx, S, cam, time) {
  drawCaptions(ctx, S, cam, time, turnOf(S));
}

// One of the audience, seen from behind: its round body, its top lit by the stage, a sprout, and its
// paws up when it's cheering.
export function audienceMochi(ctx, x, y, r, base, dim, cheering, time, h) {
  const body = mix(base, PIT, dim);
  const lit = mix(base, PIT, dim * 0.45);
  if (cheering) {
    const wave = Math.sin(time * 9 + h * 11) * 0.25;
    ctx.fillStyle = body;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.ellipse(x + side * (r * 0.95), y - r * (1.05 + (side > 0 ? wave : -wave) * 0.4), r * 0.26, r * 0.36, side * 0.4, 0, TAU);
      ctx.fill();
    }
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.86, 0, 0, TAU);
  ctx.fill();
  // (The stage's light along its top.)
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.ellipse(x, y - r * 0.38, r * 0.8, r * 0.46, 0, Math.PI, TAU);
  ctx.fill();
  // Its sprout: a little stem and two leaves.
  const sw = Math.sin(time * 1.8 + h * 6) * 0.25;
  const tx = x + sw * r * 0.3;
  const ty = y - r * 0.86;
  ctx.strokeStyle = mix('#7cc87a', PIT, dim * 0.8);
  ctx.lineWidth = Math.max(0.8, r * 0.13);
  ctx.beginPath();
  ctx.moveTo(x, ty + 0.5);
  ctx.lineTo(tx, ty - r * 0.42);
  ctx.stroke();
  ctx.fillStyle = mix('#9fe0a0', PIT, dim * 0.7);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(tx + side * r * 0.22, ty - r * 0.46, r * 0.24, r * 0.12, side * -0.5 + sw, 0, TAU);
    ctx.fill();
  }
}

function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - s * 0.5, y, s * 0.6, 0, TAU);
  ctx.arc(x + s * 0.5, y, s * 0.6, 0, TAU);
  ctx.moveTo(x - s * 1.08, y + s * 0.2);
  ctx.lineTo(x, y + s * 1.4);
  ctx.lineTo(x + s * 1.08, y + s * 0.2);
  ctx.fill();
}

function drawJudges(ctx, S, time, T0) {
  const base = TABLE.y;
  // (Each judge lit in turn while they're introduced.)
  const lit = introJudge(S);
  if (lit >= 0) {
    ctx.globalCompositeOperation = 'lighter';
    const x = JUDGE_X[lit];
    const g = ctx.createRadialGradient(x, base - 16, 2, x, base - 16, 26);
    g.addColorStop(0, 'rgba(255,236,210,0.32)');
    g.addColorStop(1, 'rgba(255,236,210,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 26, base - 42, 52, 52);
    ctx.globalCompositeOperation = 'source-over';
  }
  // Hayate (style), Kinako (charm), Maestro Mugi (talent): sat behind the table, the cloth hiding
  // them from the waist down, facing the stage.
  drawHayate(ctx, JUDGE_X[0], base + 3, time, { s: 1, awake: true, talking: lit === 0 });
  drawHero(ctx, NPCS.kinako.look, null, JUDGE_X[1], base + 3, { time, seed: 7, facing: 1, talking: lit === 1 }, null);
  // (Mugi claps for a fine turn.)
  const mg = mugiOf();
  const clap = (T0?.step === 'cards' && T0.st > CARD_AT[2] && T0.c.total >= 20) || lit === 2;
  if (clap && !mg.action) mg.action = { name: lit === 2 ? 'wave' : 'clap', t0: null, hold: 1.2 };
  if (!clap && mg.action && time - (mg.action.t0 ?? time) > 1.4) mg.action = null;
  drawMochiAnim(ctx, mg, JUDGE_X[2], base - 3, time);
  // The table: a long pink cloth, its scalloped edge and gold hem, a name card for each judge.
  ctx.fillStyle = '#ffe2ee';
  ctx.fillRect(TABLE.x0, base - 6, TABLE.x1 - TABLE.x0, BOTTOM - base + 10);
  ctx.fillStyle = '#ffd0e0';
  ctx.fillRect(TABLE.x0, base - 6, TABLE.x1 - TABLE.x0, 2.4);
  for (let x = TABLE.x0; x < TABLE.x1; x += 9.5) {
    ctx.fillStyle = '#ff9ec0';
    ctx.beginPath();
    ctx.ellipse(x + 4.75, base - 3.6, 4.75, 2.4, 0, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#f2c94c';
  ctx.fillRect(TABLE.x0, base - 6.8, TABLE.x1 - TABLE.x0, 0.8);
  // (Its shade toward the floor.)
  const sh = ctx.createLinearGradient(0, base, 0, BOTTOM);
  sh.addColorStop(0, 'rgba(60,20,50,0)');
  sh.addColorStop(1, 'rgba(60,20,50,0.4)');
  ctx.fillStyle = sh;
  ctx.fillRect(TABLE.x0, base, TABLE.x1 - TABLE.x0, BOTTOM - base);
  JUDGES.forEach((j, i) => {
    const x = JUDGE_X[i];
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 15, base + 2, 30, 9);
    ctx.fillStyle = ['#ff8fb4', '#ffb86a', '#7ab8f0'][i];
    ctx.fillRect(x - 15, base + 2, 30, 1.6);
    ctx.fillStyle = '#5a3a5a';
    ctx.font = '800 5.5px Nunito, "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(j.word, x, base + 9.2);
    ctx.textAlign = 'left';
  });
  // The cards going up, one by one, with the score on each - flipping over as they rise, and staying
  // up until it walks off.
  if (T0 && (T0.step === 'cards' || T0.step === 'out')) {
    const st = T0.step === 'out' ? 9 : T0.st;
    T0.c.cards.forEach((v, i) => {
      const u = (st - CARD_AT[i]) / 0.32;
      if (u <= 0) return;
      const rise = Math.min(1, u);
      const e = 1 - (1 - rise) ** 3;
      // (A little overshoot as it lands at the top.)
      const pop = rise < 1 ? 0 : Math.max(0, 1 - (st - CARD_AT[i] - 0.32) / 0.25) * Math.sin(Math.min(1, (st - CARD_AT[i] - 0.32) / 0.25) * Math.PI) * 1.5;
      const cx = JUDGE_X[i] + CARD_SIDE[i];
      const cy = base - 50 - e * 10 - pop;
      const w = 16 * Math.max(0.08, Math.abs(Math.cos((1 - e) * Math.PI * 0.5)));
      ctx.fillStyle = '#c8945a';
      ctx.fillRect(cx - 0.7, cy + 17, 1.4, base - 12 - cy - 17);
      // (Its handle in a hand.)
      ctx.fillStyle = HAND[i];
      ctx.beginPath();
      ctx.ellipse(cx, base - 12, 2.2, 1.8, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = 'rgba(30,10,30,0.3)';
      ctx.fillRect(cx - w / 2 + 1, cy + 1, w, 18);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(cx - w / 2, cy, w, 18);
      ctx.fillStyle = v >= 8 ? '#e0408a' : v >= 5 ? '#4a8ad8' : '#8a7a9a';
      ctx.fillRect(cx - w / 2, cy, w, 2);
      if (e > 0.6) {
        ctx.fillStyle = '#3a2d4f';
        ctx.font = '900 12px Nunito, "Trebuchet MS", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(v), cx, cy + 15);
        ctx.textAlign = 'left';
      }
    });
  }
}

// The rosettes: third, then second, then first, dropping in over their heads.
function drawRosettes(ctx, S, time) {
  if (S.phase !== 'results' && S.phase !== 'done') return;
  const t = S.phase === 'done' ? 99 : S.t;
  for (const c of S.cast) {
    if (c.place > 3) continue;
    const at = RESULTS.lineup + RESULTS.ribbon * (3 - c.place);
    const u = (t - at) / 0.45;
    if (u <= 0) continue;
    const e = Math.min(1, u);
    const drop = 1 - (1 - e) ** 3;
    rosette(ctx, c.x, FLOOR - 36 - (1 - drop) * 20, c.place, Math.min(1, e * 1.3), time);
  }
}

export const say = (ctx, words, x, y, { size = 18, color = '#ffffff', edge = '#e0659f', alpha = 1 } = {}) => {
  ctx.save();
  ctx.globalAlpha = Math.max(0, alpha);
  ctx.font = `900 ${size}px Nunito, "Trebuchet MS", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, size * 0.28);
  ctx.strokeStyle = edge;
  ctx.strokeText(words, x, y);
  ctx.fillStyle = color;
  ctx.fillText(words, x, y);
  ctx.restore();
};

// The captions, on the screen (not the zoomed world).
function drawCaptions(ctx, S, cam, time, T0) {
  const mid = VW / 2;
  const z = S.zoom ?? 1;
  const sx = (wx) => (wx - cam.x) * z;
  const sy = (wy) => (wy - cam.y) * z;
  const y0 = 138;
  if (S.phase === 'intro') {
    const a = Math.min(1, S.t / 0.5, (INTRO - S.t) / 0.5);
    say(ctx, 'Welcome to the Mochi Show!', mid, y0, { size: 22, alpha: a });
    const j = introJudge(S);
    if (j >= 0) {
      const ja = Math.min(1, (S.t - INTRO_JUDGE[j]) / 0.25, (INTRO - S.t) / 0.5);
      const who = ['Hayate judges Style', 'Kinako judges Charm', 'Maestro Mugi judges Talent'][j];
      say(ctx, who, mid, y0 + 24, { size: 13, alpha: ja, edge: ['#e0659f', '#d8803a', '#4a8ad8'][j] });
    }
    say(ctx, 'Up: skip to the results', mid, y0 + 44, { size: 10, alpha: a * 0.75, edge: '#7a4a8a' });
    return;
  }
  if (T0) {
    const c = T0.c;
    const into = T0.step === 'in' ? T0.st : 9;
    const a = Math.min(1, into / 0.5);
    // (Up at the top, clear of whatever it's doing on the stage below.)
    const y0 = 58;
    say(ctx, c.you ? `${c.name} (yours!)` : c.name, mid, y0, { size: 19, alpha: a, edge: c.you ? '#e0408a' : '#7a4a8a' });
    if (T0.step === 'talent') {
      const words = c.act !== 'trick' ? `Talent: ${ACTS[c.act].name}!` : c.trick ? `Talent: ${cap(c.trick)}!` : 'No tricks yet - a big wave!';
      say(ctx, words, mid, y0 + 22, { size: 13, alpha: Math.min(1, T0.st / 0.3), edge: '#4a8ad8' });
    }
    if ((T0.step === 'cards' && T0.st > CARD_AT[2] + 0.4) || T0.step === 'out') {
      const p = T0.step === 'out' ? 1 : Math.min(1, (T0.st - CARD_AT[2] - 0.4) / 0.25);
      const pop = 1 + Math.sin(p * Math.PI) * 0.25;
      say(ctx, `${c.total} points!`, sx(c.x), sy(FLOOR - 40), { size: 17 * pop, alpha: p, edge: c.total >= 20 ? '#e0408a' : '#4a8ad8' });
    }
    return;
  }
  if (S.phase === 'results' || S.phase === 'done') {
    const t = S.phase === 'done' ? 99 : S.t;
    // (Once it's over, the words make way for how yours did.)
    const over = S.phase === 'done' ? Math.min(1, S.t / 0.4) : 0;
    say(ctx, 'And the winners are...', mid, 84, { size: 19, alpha: Math.min(1, t / 0.6) - over });
    // The confetti, once the winner's out.
    const win = RESULTS.lineup + RESULTS.ribbon * 2;
    if (t > win) confetti(ctx, S.phase === 'done' ? S.t + RESULTS.ribbon + RESULTS.cheer : t - win, time);
    if (S.phase === 'done') {
      const you = S.cast.find((c) => c.you);
      const nth = ['1st', '2nd', '3rd', '4th'][you.place - 1];
      const pop = 1 + Math.sin(Math.min(1, S.t / 0.35) * Math.PI) * 0.18;
      say(ctx, you.place === 1 ? `${you.name} wins! +${S.prize}g` : `${you.name} came ${nth}! +${S.prize}g`, mid, 78, { size: 20 * pop, alpha: over, edge: you.place === 1 ? '#d8a03a' : '#7a4a8a' });
      if (S.opened) say(ctx, `The ${S.opened} show is open!`, mid, 102, { size: 12, alpha: Math.min(1, (S.t - 0.4) / 0.4), edge: '#d8a03a' });
      say(ctx, 'Up: back to the tent', mid, VH - 16, { size: 13, edge: '#4a2a5a', alpha: Math.min(1, (S.t - 0.8) / 0.4) * (0.8 + 0.2 * Math.sin(time * 3)) });
    }
  }
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// A prize rosette: frilled rings in its colour, a numbered middle and two tails.
const ROSETTE = { 1: ['#f2c94c', '#ffe680'], 2: ['#c8d0dc', '#eef2f8'], 3: ['#d89060', '#f2c0a0'] };
function rosette(ctx, x, y, place, k, time) {
  const [a, b] = ROSETTE[place];
  const r = 6 * k;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.sin(time * 2 + place) * 0.06);
  ctx.fillStyle = a;
  ctx.fillRect(-3.4, r * 0.5, 2.6, 8 * k);
  ctx.fillRect(0.8, r * 0.5, 2.6, 8 * k);
  for (let i = 0; i < 12; i++) {
    const t = (i / 12) * TAU;
    ctx.beginPath();
    ctx.arc(Math.cos(t) * r, Math.sin(t) * r, r * 0.38, 0, TAU);
    ctx.fill();
  }
  ctx.fillStyle = b;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#3a2d4f';
  ctx.font = `900 ${Math.max(1, 7 * k)}px Nunito, "Trebuchet MS", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(String(place), 0, 2.6 * k);
  ctx.textAlign = 'left';
  ctx.restore();
}
// Confetti over the whole screen, tumbling down, each piece flipping as it falls.
export function confetti(ctx, t, time) {
  const colors = ['#ff9ec0', '#ffe680', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffffff'];
  for (let i = 0; i < 90; i++) {
    const fall = 40 + hash(i * 2.1) * 50;
    const y = ((hash(i * 7.7) * 120 + t * fall) % (VH + 40)) - 20;
    const x = hash(i * 3.3) * VW + Math.sin(time * 2 + i) * 10;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(time * (2 + hash(i) * 3) + i);
    ctx.scale(1, Math.cos(time * (4 + hash(i * 5) * 4) + i));
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(-2.6, -1.6, 5.2, 3.2);
    ctx.restore();
  }
}

// ---------- The acts' own sparkle (render/mochi-show-acts.js SHOW_FX) ----------
// The act on now, if it's a turn of its own: who, which (`sing2`...), how far in, and what goes with it.
const actOn = (S) => {
  const T0 = turnOf(S);
  if (!T0 || T0.step !== 'talent' || T0.c.act === 'trick') return null;
  const name = `${T0.c.act}${T0.c.tier}`;
  return { c: T0.c, name, u: T0.st, fx: SHOW_FX[name] ?? {}, len: T0.c.talentLen ?? 4.6 };
};
const dirOf = (c) => ((c.m.dir ?? 1) < 0 ? -1 : 1);
const DRUM_AT = 13;
// Behind the performer: the boards lighting up under a dancer, and the taiko drum it plays.
function drawActBack(ctx, S, time) {
  const A = actOn(S);
  if (!A) return;
  const { c, u, fx } = A;
  const d = dirOf(c);
  if (fx.floor) {
    const [t0, t1, beat] = fx.floor;
    const k = Math.min(1, (u - t0) / 0.3, (t1 + 0.4 - u) / 0.4);
    if (k > 0) {
      const n = Math.floor((u - t0) / beat);
      const colors = ['#ff6fa8', '#ffc840', '#5ab8f0', '#6ccf7a', '#a880e8'];
      for (let i = -2; i <= 2; i++) {
        const on = (i + n + 10) % 2 === 0;
        const pulse = 1 - ((u - t0) % beat) / beat;
        const col = colors[(i + n + 10) % colors.length];
        ctx.fillStyle = col;
        ctx.globalAlpha = k * (on ? 0.35 + 0.3 * pulse : 0.12);
        ctx.beginPath();
        ctx.ellipse(c.x + i * 11, FLOOR + 1.2, 4.2, 1.1, 0, 0, TAU);
        ctx.fill();
        // (A glow going up off the lit ones.)
        if (on) {
          const gl = ctx.createLinearGradient(0, FLOOR - 9, 0, FLOOR + 1);
          gl.addColorStop(0, 'rgba(255,255,255,0)');
          gl.addColorStop(1, col);
          ctx.fillStyle = gl;
          ctx.globalAlpha = k * 0.22 * pulse;
          ctx.fillRect(c.x + i * 11 - 3.6, FLOOR - 9, 7.2, 10);
        }
      }
      ctx.globalAlpha = 1;
    }
  }
  if (fx.drum) {
    // (It's there for the act: popped on with a puff, and off with one.)
    const on = u > 0.12 && u < A.len - 0.2;
    if (on) {
      let hit = 0;
      for (const [t, size] of fx.hits ?? []) if (u >= t && u < t + 0.2) hit = Math.max(hit, (1 - (u - t) / 0.2) * (size === 0 ? 0.55 : 1));
      drawTaiko(ctx, c.x + d * DRUM_AT, FLOOR, d, hit, time);
    }
    for (const at of [0.12, A.len - 0.2]) if (u >= at - 0.05 && u < at + 0.45) puff(ctx, c.x + d * (DRUM_AT + 5), FLOOR - 9, (u - at + 0.05) / 0.5, '#fff0f6', 7);
  }
}
// In front of it: notes, the drum's strokes, puffs and bursts, the wand's trail, the flung mask and
// the thrown rose - and a little twinkle as a prop comes out, a puff as it goes.
function drawActFront(ctx, S, time) {
  for (const c of S.cast) if (c.on) propComings(ctx, c, S);
  const A = actOn(S);
  if (!A) return;
  const { c, u, fx } = A;
  const d = dirOf(c);
  const an = c.m.anchors ?? {};
  const mouth = an.mouth ?? [c.x + d * 4, FLOOR - 14];
  for (const [t, kind] of fx.notes ?? []) {
    const v = (u - t) / 1.6;
    if (v < 0 || v > 1) continue;
    const wob = kind === 0 ? Math.sin(v * 14 + t * 3) * 1.6 : Math.sin(v * 6 + t * 5) * 2.2;
    const x = mouth[0] + d * (4 + v * 10) + wob;
    const y = mouth[1] - 4 - v * 20;
    const color = kind === 2 ? '#ffd040' : kind === 0 ? '#c8b8e0' : ['#ff8fb4', '#8fd3ff', '#ffb860'][Math.round(t * 10) % 3];
    ctx.globalAlpha = Math.min(1, v * 6) * (1 - v) ** 0.7;
    note(ctx, x, y, kind === 0 ? 0.8 : kind === 2 ? 1.25 : 1, color, Math.round(t * 10) % 2 === 0, Math.sin(v * 5 + t) * 0.25);
    if (kind === 2) twinkle(ctx, x + 3, y - 3, 1.5 + Math.sin(time * 9 + t) * 0.5, '#fff8d8', 0.8);
    ctx.globalAlpha = 1;
  }
  if (fx.crack != null && u >= fx.crack && u < fx.crack + 0.9) {
    const v = (u - fx.crack) / 0.9;
    ctx.globalAlpha = Math.min(1, v * 8) * (1 - v);
    ctx.strokeStyle = '#7a6a8a';
    ctx.lineWidth = 0.9;
    ctx.lineJoin = 'round';
    const x = mouth[0] + d * 6;
    const y = mouth[1] - 6 - v * 4;
    ctx.beginPath();
    ctx.moveTo(x - 3, y - 2);
    ctx.lineTo(x - 1, y + 1);
    ctx.lineTo(x + 0.5, y - 1.5);
    ctx.lineTo(x + 2, y + 1.5);
    ctx.lineTo(x + 3.6, y - 1);
    ctx.stroke();
    note(ctx, x + d * 2, y - 5 + v * 6, 0.8, '#b8a8c8', false, 1.1 * v);
    ctx.globalAlpha = 1;
  }
  if (fx.drum) {
    const hx = c.x + d * (DRUM_AT - 1);
    const hy = FLOOR - 13.5 * TAIKO_SIZE;
    for (const [t, size] of fx.hits ?? []) {
      const v = (u - t) / (size === 2 ? 0.7 : 0.45);
      if (v < 0 || v > 1) continue;
      ctx.strokeStyle = size === 2 ? '#ffe680' : '#ffffff';
      ctx.lineWidth = size === 2 ? 1.2 : 0.7;
      for (let r = 0; r < (size === 2 ? 3 : size === 1 ? 2 : 1); r++) {
        const w = v * (size === 2 ? 1 : 0.7) - r * 0.12;
        if (w <= 0) continue;
        ctx.globalAlpha = (1 - v) * 0.8;
        ctx.beginPath();
        ctx.ellipse(hx, hy, 2 + w * 9, 6 + w * 10, 0, d > 0 ? Math.PI * 0.6 : -Math.PI * 0.4, d > 0 ? Math.PI * 1.4 : Math.PI * 0.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      if (size === 2) for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + t;
        twinkle(ctx, hx + Math.cos(a) * (4 + v * 14), hy + Math.sin(a) * (4 + v * 12), 2.2 * (1 - v), i % 2 ? '#ffe680' : '#ffffff', 1);
      }
    }
  }
  for (const [t, kind] of fx.poofs ?? []) {
    const v = (u - t) / 0.75;
    if (v < 0 || v > 1) continue;
    const [px, py] = an.hat ?? an.tip ?? [c.x + d * 8, FLOOR - 16];
    puff(ctx, px, py - 2, v, kind === 'smoke' ? '#b8b0c4' : '#ffd0e6', kind === 'smoke' ? 8 : 6);
    if (kind === 'magic') for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + t * 3;
      twinkle(ctx, px + Math.cos(a) * (2 + v * 9), py - 3 + Math.sin(a) * (2 + v * 7) - v * 4, 1.8 * (1 - v), i % 2 ? '#ffe680' : '#ffffff', 1);
    }
  }
  if (fx.burst != null && u >= fx.burst && u < fx.burst + 1.6) {
    const [px, py] = an.hat ?? an.mic ?? [c.x, FLOOR - 22];
    const v = u - fx.burst;
    const colors = ['#ff9ec0', '#ffe680', '#8fd3ff', '#9fe0a0', '#c8a8f0', '#ffffff'];
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI / 2 + (hash(i * 3.1) - 0.5) * 2.2;
      const sp = 22 + hash(i * 7.3) * 26;
      const x = px + Math.cos(a) * sp * v;
      const y = py + Math.sin(a) * sp * v + 30 * v * v;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1.6 - v) / 0.5);
      ctx.translate(x, y);
      ctx.rotate(time * (4 + hash(i) * 4) + i);
      ctx.scale(1, Math.cos(time * 7 + i));
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(-1, -0.6, 2, 1.2);
      ctx.restore();
    }
  }
  if (fx.trail) {
    const tr = (c.trail ??= []);
    if (an.tip && u >= fx.trail[0] && u <= fx.trail[1]) tr.push([an.tip[0], an.tip[1], u]);
    while (tr.length && u - tr[0][2] > 0.45) tr.shift();
    for (const [x, y, t] of tr) {
      const v = (u - t) / 0.45;
      twinkle(ctx, x + Math.sin(t * 40) * 1.2, y + v * 3, 1.6 * (1 - v), Math.round(t * 30) % 2 ? '#ffe680' : '#ffffff', 1 - v);
    }
  }
  if (fx.mask != null) {
    if (an.mask) c.maskAt = an.mask;
    const v = (u - fx.mask) / 1.1;
    if (v >= 0 && v < 1 && c.maskAt) {
      const [mx, my] = c.maskAt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (1 - v) / 0.3);
      drawMask(ctx, mx - d * v * 34, my - 26 * v + 34 * v * v + 7, 1, d, -d * v * 7, 'sad');
      ctx.restore();
      if (v > 0.8) for (let i = 0; i < 5; i++) twinkle(ctx, mx - d * 34 + Math.cos(i * 1.3) * 4, my + 8 + Math.sin(i * 1.3) * 4, 1.6 * (1 - (v - 0.8) / 0.2), i % 2 ? '#ffe680' : '#ffffff', 1);
    }
  }
  if (fx.rose != null) {
    const v = (u - (fx.rose - 0.75)) / 0.75;
    if (v >= 0 && v < 1) {
      // (Thrown from the audience, out in the dark to the right, arcing up and down into its paw.)
      const sx = c.x + 70;
      const sy = FLOOR + 40;
      const ex = c.x + d * 5;
      const ey = FLOOR - 6;
      const x = sx + (ex - sx) * v;
      const y = sy + (ey - sy) * v - Math.sin(v * Math.PI) * 46;
      drawRose(ctx, x, y + 6, 1, -1, v * 9, null);
    }
  }
}
// (A prop coming out - a little ring of twinkles where it appears - or put away, a soft puff.)
function propComings(ctx, c, S) {
  const an = c.m.anchors ?? {};
  const at = an.mic ?? an.tip ?? an.hat ?? an.mask ?? an.rose ?? an.ribbon ?? null;
  const now = S.t;
  if (at && !c.propAt) c.popAt = now;
  if (!at && c.propAt) {
    c.goneAt = now;
    c.gonePos = c.propAt;
  }
  c.propAt = at;
  if (at && c.popAt != null && now - c.popAt < 0.4) {
    const v = (now - c.popAt) / 0.4;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU;
      twinkle(ctx, at[0] + Math.cos(a) * (2 + v * 6), at[1] + Math.sin(a) * (2 + v * 6), 1.6 * (1 - v), i % 2 ? '#ffe680' : '#ffffff', 1);
    }
  }
  if (c.goneAt != null && now - c.goneAt < 0.45) puff(ctx, c.gonePos[0], c.gonePos[1], (now - c.goneAt) / 0.45, '#fff0f6', 4.5);
}
// A soft round puff of cloud, billowing out and fading (`v` 0-1 through it).
function puff(ctx, x, y, v, color, size) {
  if (v < 0 || v > 1) return;
  ctx.save();
  ctx.globalAlpha = (1 - v) ** 1.4 * 0.7;
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4;
    const r = size * (0.35 + 0.35 * v) * (0.8 + 0.3 * hash(i * 4.7));
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * size * 0.55 * (0.4 + v), y + Math.sin(a) * size * 0.4 * (0.4 + v) - v * 3, r, 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}
// A music note: a round head, a stem, a flag (or two joined, `pair`).
function note(ctx, x, y, s, color, pair, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(s, s);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.ellipse(-1.4, 2.4, 1.5, 1.1, -0.4, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-0.05, 2.2);
  ctx.lineTo(-0.05, -3.4);
  ctx.stroke();
  if (pair) {
    ctx.beginPath();
    ctx.ellipse(2.6, 1.6, 1.5, 1.1, -0.4, 0, TAU);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(4, 1.4);
    ctx.lineTo(4, -4.2);
    ctx.stroke();
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(-0.05, -3.2);
    ctx.lineTo(4, -4);
    ctx.stroke();
  } else {
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-0.05, -3.4);
    ctx.quadraticCurveTo(2.2, -2.2, 1.6, 0.2);
    ctx.stroke();
  }
  ctx.restore();
}
