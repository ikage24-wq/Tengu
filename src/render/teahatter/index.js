// The Teacup Hermit (id teahatter; 2026-11-26, the Tea Party Hatter remade from scratch, the player's
// pick "A" of three: Pemberton, the teacup hermit crab): the Moonlit Manor's level 17 tea-table
// gentleman. A little rose-pink hermit crab who has moved into a fine porcelain teacup (tipped up on
// its side, its mouth facing forward and up: a blue band with rosebuds, a gold rim that catches the
// light, a round ear of a handle up top, a sugar cube kept on it for later, a curl of steam now and
// then) and is terribly proud of it. A gold monocle on one eye stalk, its fine chain pinned to his
// shell, soft cream brows and a curly cream moustache. Prim, dignified, easily startled.
// He moves on his own copy of the crab base (crabbase.js, its hermit), dressed here; the cup, the
// face and every prop are drawn here from scratch.
//   going   a dainty sideways scuttle on tiptoe: short quick steps lifted high, the body held level,
//           both claws held up primly before his chest, his eye stalks upright. Between walks he
//           stands long enough for a piece of his act (data: `rest`; world/mobs.js tells him how
//           long he has, `m.restUntil`).
//   idle    his act, in four pieces, each whole in itself, the next one that fits the time he has:
//           - the sugar cube (9.6 s): he reaches back and lifts the sugar cube off the top of his
//             cup, turns it before his monocle, three dainty nibbles (crumbs), pops the rest in and
//             savours it; then reaches into his cup for a fresh one and sets it back on top, pat pat;
//           - the polish (6.8 s): a huff of breath on his gold rim, rubbed round and round with a
//             claw till it gleams; his reflection admired, the monocle set straight;
//           - the clink (6.2 s): somewhere, a teaspoon clinks; he starts and pops into his cup;
//             only the monocle peeks out over the rim, looking this way and that; he comes back
//             out, clears his throat and smooths his moustache;
//           - the bow (4.6 s): a step back and a deep, courtly bow, a claw swept before him.
//   moves   (def.moves; from afar always the lob, close up the pinch and the clonk in turn)
//           Sugar Lob: the sugar cube lifted off his cup and wound back high, then flicked out in an
//           arc (the dungeon carries it: world/dungeon.js, its shot 'sugarcube', drawn by
//           sugarShot below). Tong Pinch: a claw drawn back wide, a lunge and a snap like sugar
//           tongs. Cup Clonk: half into his cup, rocked back, then the whole cup tipped forward in a
//           bump, rim first, and back out.
//   faces   his own: soft oval cocoa eyes on the stalk caps with a big round glint and a small one;
//           dignified upper lids and a soft lower lid, a lash flick at the outer corner; floating
//           cream brows; the moustache that does half the acting (up when pleased, down when sad,
//           puffing when cross); a mouth from width, smile and openness. Calm (warm, a soft smile),
//           a blink, inspecting, yum, proud, startled, peeking, content, focused, fierce, smug,
//           hurt, asleep, dizzy (beaten), sad, cross, talking, happy, worried when low.
import { dressedCrab } from './crabbase.js';

// ---------- Little helpers ----------
const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
// (a beat's weight: 0 before t0, eased up to 1 by t1, held to t2, eased back to 0 by t3)
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
// (a quick soft pulse 0..1..0 over [t0, t0 + d])
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const times = (p, k) => [p[0] * k, p[1] * k];
const lerp2 = (p, q, u) => [mix(p[0], q[0], u), mix(p[1], q[1], u)];
const turn = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const rgb = (hex) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgba = (hex, al) => {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${clamp(al, 0, 1)})`;
};
// A closed smooth curve through the points (Catmull-Rom), `n` steps between each two.
function loop(pts, n = 4) {
  const out = [];
  const N = pts.length;
  for (let i = 0; i < N; i++) {
    const a = pts[(i - 1 + N) % N];
    const b = pts[i];
    const c = pts[(i + 1) % N];
    const d = pts[(i + 2) % N];
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * t + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * t2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * t3)));
    }
  }
  return out;
}
const poly = (ctx, pts) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
};
const line = (ctx, pts) => {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
};
// a curvy four-point sparkle
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
// a soft round puff (breath, steam), outlined only by its own shade
function puff(ctx, x, y, r, al, fill = '#ffffff', rim = '#d8d2ec') {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = rim;
  ell(ctx, x, y, r + 0.45, r + 0.45);
  ctx.fill();
  ctx.fillStyle = fill;
  ell(ctx, x, y, r, r);
  ctx.fill();
  ctx.restore();
}

// ---------- His colours ----------
const PB = {
  // (a rose "strawberry milk" pink, cream claws: none of the garden crab's terracotta)
  C: { lt: '#ffe6ea', base: '#ffb9c2', sh: '#f094a5', deep: '#d47488', guide: '#f7a8b6', nose: '#c9667c', mouth: '#9c4560' },
  CC: { lt: '#fff4ec', base: '#ffdcd0', sh: '#f6b3a8', deep: '#dc8e8a' },
  ink: '#b0637a',
  seam: '#e98ea2',
  cup: { lt: '#ffffff', base: '#fbf7fd', sh: '#e2daf0', deep: '#c7bbdf', inner: '#f3ecf8', innerSh: '#d2c5e5', ink: '#8f84b4' },
  band: '#8fb0ea',
  bandSh: '#6f8fd6',
  rose: '#f7a6c1',
  roseSh: '#e07ea2',
  leaf: '#9cd4ac',
  gold: '#f4cf72',
  rimSoft: '#ecdcb4',
  goldLt: '#fff3c4',
  goldSh: '#c99a42',
  tea: '#d39a5c',
  cream: '#fff6e8',
  creamSh: '#e9d2b6',
  eye: '#4a2c3e',
  blush: '#ff8f9c',
  mouthIn: '#93405a',
  tongue: '#f48c9c',
  sugar: '#ffffff',
  sugarSh: '#e4def0',
  sugarInk: '#9a8fbd',
  steam: '#ffffff',
  tear: '#a8d4ff',
};

// ---------- His teacup (in the shell's frame: about its middle, x forward, y down) ----------
// Lying on its side on the floor, its mouth turned toward you and forward (a three-quarter view: the
// mouth an open oval, `sq` of it seen across), the round bowl narrowing back to its foot, the handle
// a round ear up top. He sits inside it: whatever of him is inside the cup but not in its mouth is
// hidden by its wall (look.clip), so he peeks out of it; his claws come out over the rim, his legs
// out under it. Every ring round the cup (the rim, the band, the foot) is an oval like the mouth's,
// `k` back along it from its middle, as wide as the bowl is there.
const CUP = { R: 10.2, rim: 5, foot: 4.4, bottom: -8.2, sq: 0.6 };
// the bowl's half-height at k along it (round like a teacup's side: full at the rim, rounding in
// to the foot)
const bowlR = (k) => {
  const d = clamp((CUP.rim - k) / (CUP.rim - CUP.bottom), 0, 1);
  return CUP.foot + (CUP.R - CUP.foot) * Math.sqrt(Math.max(0, 1 - d * d * d));
};
// a point on the ring k back along the cup, at angle ph round it (0 the near front, -pi/2 the top)
const ring = (k, ph, rr = bowlR(k)) => [k + CUP.sq * rr * Math.cos(ph), rr * Math.sin(ph)];
function hullOf(pts) {
  const p = pts.slice().sort((A, B) => A[0] - B[0] || A[1] - B[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  const hi = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  lo.pop();
  hi.pop();
  return lo.concat(hi);
}
// The cup's outline: round every ring of it (the bowl's rings and the foot's), a smooth hull.
const CUP_SHAPE = (() => {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const k = mix(CUP.rim, CUP.bottom, i / 10);
    for (let j = 0; j < 36; j++) pts.push(ring(k, (j / 36) * TAU));
  }
  for (let j = 0; j < 36; j++) pts.push(ring(CUP.bottom - 1.3, (j / 36) * TAU, CUP.foot * 0.9));
  return hullOf(pts);
})();
// The handle: a round loop on the top (a D, its ends tucked into the bowl), the hole through it open.
const HANDLE = (() => {
  const kc = CUP.rim - 6.6;
  const out = [];
  for (let i = 0; i <= 20; i++) {
    const an = Math.PI * (i / 20);
    const k = kc + 2.9 * Math.cos(an);
    const j = -bowlR(k) + 1.1 - 4.6 * Math.sin(an) ** 0.8;
    out.push([k + CUP.sq * 0.3, j]);
  }
  return out;
})();
// where the shell's frame sits in the body's, as the base has it
const shellC = (K) => times(K.P.shell.c, K.sc(1));
const toW = (sk, K, p) => sk.shell.sw(plus(shellC(K), times(p, K.sc(1))));
// (the sugar cube's place: on the cup's lower lip, at his doorstep, in easy reach of his claw)
const CUBE_PH = 0.72;
const cubeHome = (sk, K) => plus(toW(sk, K, ring(CUP.rim, CUBE_PH, CUP.R)), turn([K.sc(0.6), -K.sc(2.1)], sk.shell.rot));

// The cup's shapes in the world this frame (kept on a.pbCup for the clip and the drawing).
function cupNow(a, K) {
  const sk = a.bk;
  const W = (p) => toW(sk, K, p);
  const M = W(ring(CUP.rim, 0, 0));
  const out = CUP_SHAPE.map(W);
  const s = K.sc(1);
  return { W, M, out, rot: sk.shell.rot, rx: CUP.sq * CUP.R * s, ry: CUP.R * s, s };
}
// Inside the cup but not in its mouth, he's hidden by its wall: a part drawn only outside the cup's
// outline or inside its mouth (an even-odd cut: the screen, the cup, the mouth). His body also stays
// behind the cup's lower lip: below the mouth's middle it shows only in the mouth (his carapace and
// stalks may come up out over the top of it, never out under the lip).
function inside(ctx, a) {
  const c = a.pbCup;
  if (!c) return;
  ctx.beginPath();
  ctx.rect(-1e4, -1e4, 2e4, 2e4);
  c.out.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.ellipse(c.M[0], c.M[1], c.rx * 0.985, c.ry * 0.985, c.rot, 0, TAU);
  ctx.clip('evenodd');
}
function behindLip(ctx, a) {
  const c = a.pbCup;
  if (!c) return;
  inside(ctx, a);
  ctx.beginPath();
  ctx.rect(-1e4, -1e4, 2e4, 1e4 + c.M[1]);
  ctx.ellipse(c.M[0], c.M[1], c.rx * 0.985, c.ry * 0.985, c.rot, 0, TAU);
  ctx.clip('nonzero');
}
// The cup's near lip (the lower front of its rim) over him: porcelain and gold, so he sits in it.
function lip(ctx, a, mode, K) {
  const c = a.pbCup;
  if (!c || mode === 'line') return;
  const { M, rx, ry, rot, s } = c;
  ctx.save();
  ctx.lineCap = 'round';
  const arc = (w, col, a0 = -0.15, a1 = 2.35) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.ellipse(M[0], M[1], rx, ry, rot, a0, a1);
    ctx.stroke();
  };
  arc(1.9 * s, K.tone(a, PB.cup.sh));
  arc(1.35 * s, K.tone(a, PB.cup.base));
  arc(0.62 * s, K.tone(a, PB.goldSh), -0.05, 2.25);
  arc(0.38 * s, K.tone(a, PB.gold), -0.05, 2.25);
  arc(0.2 * s, K.tone(a, PB.goldLt), 0.3, 1.1);
  ctx.restore();
}

function cup(ctx, a, mode, K) {
  const sk = a.bk;
  if (!sk?.shell) return;
  const c = (a.pbCup = cupNow(a, K));
  const { W, M, out, rot, rx, ry, s } = c;
  const hp = HANDLE.map(W);
  const hw = 2.0 * s;
  if (mode === 'line') {
    // (the porcelain's own soft lilac ink, not his rose one; the handle a stroke of the same width)
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    line(ctx, hp);
    ctx.strokeStyle = PB.cup.ink;
    ctx.lineWidth = hw + 2;
    ctx.stroke();
    poly(ctx, out);
    ctx.lineWidth = 2;
    ctx.stroke();
    return;
  }
  // the handle (its ends tuck in behind the bowl, drawn first): porcelain, a gold line along it
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  line(ctx, hp);
  ctx.strokeStyle = K.tone(a, PB.cup.base);
  ctx.lineWidth = hw;
  ctx.stroke();
  line(ctx, hp.slice(3, 16));
  ctx.strokeStyle = K.tone(a, PB.gold);
  ctx.lineWidth = hw * 0.3;
  ctx.stroke();
  // the bowl: porcelain, lit on top, a lilac moonlit shade underneath and toward the back
  poly(ctx, out);
  ctx.fillStyle = K.tone(a, PB.cup.base);
  ctx.fill();
  ctx.save();
  poly(ctx, out);
  ctx.clip();
  K.glow(ctx, W(ring(-1, -1.9, 9)), 10 * s, PB.cup.lt, 1);
  K.glow(ctx, W(ring(-2, 1.6, 10)), 10 * s, PB.cup.sh, 0.95);
  K.glow(ctx, W([CUP.bottom - 1, 0]), 6 * s, PB.cup.deep, 0.55);
  // the blue band round it behind the rim (the back half of two rings), rosebuds along it
  const back = (k) => Array.from({ length: 19 }, (_, i) => ring(k, Math.PI / 2 + (i / 18) * Math.PI));
  const B0 = CUP.rim - 2.2;
  const B1 = CUP.rim - 4.6;
  const bandPts = [...back(B0), ...back(B1).reverse()].map(W);
  poly(ctx, bandPts);
  ctx.fillStyle = K.tone(a, PB.band);
  ctx.fill();
  ctx.save();
  poly(ctx, bandPts);
  ctx.clip();
  K.glow(ctx, W(ring(B1, 1.7)), 9 * s, PB.bandSh, 0.95);
  K.glow(ctx, W(ring(B0, -1.9)), 6 * s, '#c8d8ff', 0.8);
  ctx.restore();
  ctx.strokeStyle = K.tone(a, PB.gold);
  ctx.lineWidth = 0.55 * s;
  for (const k of [B0 + 0.5, B1 - 0.5]) {
    line(ctx, back(k).map(W));
    ctx.stroke();
  }
  for (const ph of [2.0, 2.65, 3.3, 3.95]) {
    const p = W(ring((B0 + B1) / 2, ph));
    ctx.fillStyle = K.tone(a, PB.leaf);
    ell(ctx, p[0] - 0.95 * s, p[1] + 0.5 * s, 0.8 * s, 0.42 * s, -0.5);
    ctx.fill();
    ctx.fillStyle = K.tone(a, PB.rose);
    ell(ctx, p[0], p[1], 0.95 * s, 0.88 * s);
    ctx.fill();
    ctx.strokeStyle = K.tone(a, PB.roseSh);
    ctx.lineWidth = 0.3 * s;
    ctx.beginPath();
    ctx.arc(p[0] + 0.1 * s, p[1] + 0.05 * s, 0.44 * s, 0.4, 4.6);
    ctx.stroke();
  }
  // the foot ring, a gold line round its back
  ctx.strokeStyle = K.tone(a, PB.goldSh);
  ctx.lineWidth = 0.6 * s;
  line(ctx, back(CUP.bottom - 0.4).map(W));
  ctx.stroke();
  ctx.restore();
  // the mouth: the inside of the cup (lit high at the back, deeper down low, a ring of old tea)
  ctx.fillStyle = K.tone(a, PB.cup.innerSh);
  ell(ctx, M[0], M[1], rx, ry, rot);
  ctx.fill();
  ctx.save();
  ell(ctx, M[0], M[1], rx, ry, rot);
  ctx.clip();
  K.glow(ctx, W(ring(CUP.rim - 3, -2.2, 7)), 9 * s, PB.cup.inner, 1);
  K.glow(ctx, W(ring(CUP.rim - 4, 1.4, 6)), 8 * s, PB.cup.deep, 0.5);
  ctx.strokeStyle = K.tone(a, PB.tea, 0.45);
  ctx.lineWidth = 0.6 * s;
  ctx.beginPath();
  const tc = W([CUP.rim - 6, 0]);
  ctx.ellipse(tc[0], tc[1], rx * 0.55, ry * 0.6, rot, 0.5, 2.6);
  ctx.stroke();
  ctx.restore();
  // the rim: the porcelain's thin edge all round, and a fine gold line on it; soft and pale round the
  // top and the back (where it passes behind his head), a warmer gold coming round the front
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.tone(a, PB.cup.sh);
  ctx.lineWidth = 1.0 * s;
  ell(ctx, M[0], M[1], rx, ry, rot);
  ctx.stroke();
  ctx.strokeStyle = K.tone(a, PB.cup.base);
  ctx.lineWidth = 0.6 * s;
  ell(ctx, M[0], M[1], rx, ry, rot);
  ctx.stroke();
  ctx.strokeStyle = K.tone(a, PB.rimSoft);
  ctx.lineWidth = 0.32 * s;
  ell(ctx, M[0], M[1], rx, ry, rot);
  ctx.stroke();
  ctx.strokeStyle = K.tone(a, PB.gold);
  ctx.lineWidth = 0.36 * s;
  ctx.beginPath();
  ctx.ellipse(M[0], M[1], rx, ry, rot, -0.35, 0.3);
  ctx.stroke();
  // a gleam on the porcelain
  const gp = W(ring(CUP.rim - 4, -2.3));
  sparkle(ctx, gp[0], gp[1], 1.2 * s * (0.75 + 0.25 * Math.sin((a.t ?? 0) * 1.7)), '#ffffff');
}
// The rim's gleam (over him: it runs round the front of the rim too), sliding round now and then,
// big after his polish.
function rimGleam(ctx, a) {
  const c = a.pbCup;
  const pb = a.pb ?? {};
  const gl = pb.gleam ?? -1;
  if (!c || gl < 0) return;
  const { M, rx, ry, rot, s } = c;
  const an = mix(-2.6, 0.2, gl);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.95)';
  ctx.lineWidth = 0.35 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.ellipse(M[0], M[1], rx, ry, rot, an - 0.12, an + 0.12);
  ctx.stroke();
  const p = plus(M, turn([Math.cos(an) * rx, Math.sin(an) * ry], rot));
  sparkle(ctx, p[0], p[1], (0.65 + 0.8 * (pb.shine ?? 0)) * s * Math.sin(Math.PI * gl), '#ffffff');
  ctx.restore();
}
// The cube on his doorstep (over his body: it sits on the lip in front of him), unless he has it.
function doorstepCube(ctx, a, mode, K) {
  const pb = a.pb;
  if (mode === 'line' || !a.bk?.shell || !pb || pb.cubeOn === false) return;
  sugarCube(ctx, a, K.tone, cubeHome(a.bk, K), K.sc(1.75), a.bk.shell.rot + 0.12, pb.cubeHomeA ?? 1);
}
// A sugar cube: soft corners, a lit top, a few sparkly grains; `bites` 0..3 corners nibbled off.
function sugarCube(ctx, a, tone, c, r, rot, alpha = 1, bites = 0) {
  if (alpha <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(c[0], c[1]);
  ctx.rotate(rot);
  const shape = () => {
    ctx.beginPath();
    ctx.roundRect(-r, -r, r * 2, r * 2, r * 0.3);
  };
  ctx.save();
  // (each bite a round notch out of a corner: the top-right first, then the right, then the top)
  if (bites > 0.01) {
    ctx.beginPath();
    ctx.rect(-r * 2, -r * 2, r * 4, r * 4);
    const N = [[r * 0.95, -r * 0.95], [r * 1.05, r * 0.15], [-r * 0.1, -r * 1.05]];
    N.forEach(([x, y], i) => {
      const k = clamp(bites - i, 0, 1);
      if (k > 0.01) ctx.arc(x, y, r * 0.62 * k, 0, TAU, true);
    });
    ctx.clip('evenodd');
  }
  shape();
  ctx.strokeStyle = PB.sugarInk;
  ctx.lineWidth = 1.1;
  ctx.stroke();
  ctx.fillStyle = tone(a, PB.sugarSh);
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  ctx.fillStyle = tone(a, PB.sugar);
  ctx.fillRect(-r, -r, r * 2, r * 1.2);
  ctx.restore();
  ctx.fillStyle = tone(a, '#f1eef9');
  for (const [x, y] of [[-0.45, 0.5], [0.4, 0.62], [0.1, -0.3], [-0.55, -0.5]]) {
    ell(ctx, x * r, y * r, r * 0.12, r * 0.12);
    ctx.fill();
  }
  ctx.restore();
  sparkle(ctx, -r * 0.45, -r * 0.45, r * 0.42, '#ffffff');
  ctx.restore();
}

// ---------- While he hides (the base's curtain: he's in his cup, seen only in its mouth) ----------
function inCup(ctx, sk) {
  const hid = sk.shell?.hidden;
  if (!hid) return;
  const [o, ap] = hid;
  if (o.length < 3) return;
  ctx.beginPath();
  ctx.rect(-1e4, -1e4, 2e4, 2e4);
  o.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  if (ap.length >= 3) {
    ap.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.closePath();
  }
  ctx.clip('evenodd');
}

// ---------- His face ----------
// His eyes, on the stalk caps: soft oval cocoa eyes, a big round glint and a small one; dignified
// upper lids with a lash flick at the outer corner, a soft lower lid; floating cream brows; the
// monocle on the near eye. f: lid (0 open .. 1 shut), low (the lower lid up), brow (+ knit, -
// worried), browUp, shut (a closed shape's weight) and shutKind, look (-1 back .. 1 ahead), tear.
function eyes(ctx, a, K) {
  const sk = a.bk;
  const f = a.pb?.f ?? FACE0;
  const cap = K.sc(K.P.eyes.cap);
  ctx.save();
  // (his stalks stand up out of the cup's mouth, both eyes always seen: only the base's own curtain,
  // as he hides, takes them)
  inCup(ctx, sk);
  sk.eyes.forEach((e, i) => {
    const [x, y] = e.tip;
    const near = i === 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(cap / 3, cap / 3);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const rx = 1.75;
    const ry = 2.15;
    if (f.shut > 0.5) {
      ctx.strokeStyle = PB.eye;
      ctx.lineWidth = 0.75;
      ctx.beginPath();
      if (f.shutKind === 'hurt') {
        // squeezed: a soft sideways chevron, pointing in
        const d = near ? 1 : -1;
        ctx.moveTo(-1.6 * d, -1.1);
        ctx.quadraticCurveTo(0.2 * d, -0.2, 1.4 * d, 0.1);
        ctx.quadraticCurveTo(0.2 * d, 0.3, -1.6 * d, 1.2);
      } else if (f.shutKind === 'dizzy') {
        for (let k = 0; k <= 22; k++) {
          const an = k * 0.62 * (near ? 1 : -1);
          const r = 0.2 + k * 0.085;
          if (k) ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r);
          else ctx.moveTo(Math.cos(an) * r, Math.sin(an) * r);
        }
      } else if (f.shutKind === 'sleep') {
        // asleep: a soft downturned lash curve, a lash at the corner
        ctx.moveTo(-1.8, 0.1);
        ctx.quadraticCurveTo(0, 1.3, 1.8, 0.1);
        const ox = near ? 1 : -1;
        ctx.moveTo(ox * 1.8, 0.1);
        ctx.lineTo(ox * 2.25, 0.55);
      } else {
        // content: a happy upturned arc
        ctx.moveTo(-1.9, 0.6);
        ctx.quadraticCurveTo(0, -1.5, 1.9, 0.6);
      }
      ctx.stroke();
    } else {
      const gx = clamp(f.look ?? 0, -1, 1) * 0.35;
      ctx.save();
      ell(ctx, 0, 0.1, rx, ry);
      ctx.clip();
      ctx.fillStyle = K.tone(a, PB.eye);
      ctx.fillRect(-3, -3, 6, 6);
      const g = ctx.createLinearGradient(0, -ry, 0, ry);
      g.addColorStop(0.42, 'rgba(150,100,124,0)');
      g.addColorStop(1, 'rgba(214,156,178,0.95)');
      ctx.fillStyle = g;
      ctx.fillRect(-3, -3, 6, 6);
      ctx.fillStyle = K.tone(a, '#2e1a28');
      ell(ctx, gx * 0.7, 0.25, 0.85, 1.1);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ell(ctx, -0.55 + gx, -0.75, 0.74, 0.82);
      ctx.fill();
      ell(ctx, 0.75 + gx, 0.95, 0.3, 0.28);
      ctx.fill();
      // the lids: the cap's own skin
      const top = -ry - 0.2 + f.lid * (ry * 2 + 0.2);
      const sl = f.brow * (near ? 0.5 : -0.5);
      ctx.fillStyle = K.tone(a, PB.C.lt);
      ctx.beginPath();
      ctx.moveTo(-3, -3);
      ctx.lineTo(3, -3);
      ctx.lineTo(3, top - sl);
      ctx.quadraticCurveTo(0, top + 0.5, -3, top + sl);
      ctx.closePath();
      ctx.fill();
      const bot = ry + 0.3 - f.low * ry * 1.2;
      ctx.beginPath();
      ctx.moveTo(-3, 3);
      ctx.lineTo(3, 3);
      ctx.lineTo(3, bot + 0.2);
      ctx.quadraticCurveTo(0, bot - 0.55, -3, bot + 0.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // the lash line: open, along the eye's own upper curve; lowered, along the lid's edge (never
      // past the eye's outline); a flick out at the outer corner
      // (the lash line, one shape for every lid: down each side the eye's own upper curve, as far up
      // as the lid lets it show, then across along the lid's edge; a flick out at the outer end. With
      // the lid up out of the way it is the eye's whole upper curve; lowered, only the lid's edge)
      ctx.strokeStyle = PB.eye;
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      const ox = near ? 1 : -1;
      const S0 = -0.435;
      const vL = clamp((top + sl - 0.1) / ry, -1, 0.92);
      const vR = clamp((top - sl - 0.1) / ry, -1, 0.92);
      const thL = -Math.PI - Math.asin(vL);
      const thR = Math.asin(vR);
      const pt = (th) => [rx * Math.cos(th), 0.1 + ry * Math.sin(th)];
      const startL = vL < S0 ? -Math.PI + 0.45 : thL;
      const endR = vR < S0 ? -0.45 : thR;
      if (vL < S0) ctx.ellipse(0, 0.1, rx, ry, 0, startL, thL);
      else ctx.moveTo(...pt(thL));
      const pl = pt(thL);
      const pr = pt(thR);
      ctx.quadraticCurveTo(0, Math.min(pl[1], pr[1]) + 0.4 * clamp((vL + vR) / 2 + 1, 0, 1), ...pr);
      if (vR < S0) ctx.ellipse(0, 0.1, rx, ry, 0, thR, endR);
      const tip = pt(ox > 0 ? endR : startL);
      ctx.moveTo(...tip);
      ctx.lineTo(tip[0] + ox * 0.45, tip[1] - 0.35);
      ctx.stroke();
      ctx.strokeStyle = PB.C.deep;
      ctx.lineWidth = 0.35;
      ctx.beginPath();
      const by = clamp(bot, -ry, ry + 0.2);
      ctx.moveTo(-rx * 0.8, by + 0.05);
      ctx.quadraticCurveTo(0, by - 0.45, rx * 0.8, by + 0.05);
      ctx.stroke();
    }
    // a tear (sad): a drop at the lower lid's outer corner
    if ((f.tear ?? 0) > 0.05) {
      ctx.globalAlpha = f.tear;
      ctx.fillStyle = PB.tear;
      const tx = (near ? 1 : -1) * 1.3;
      ctx.beginPath();
      ctx.moveTo(tx, 1.4);
      ctx.quadraticCurveTo(tx + 0.7, 2.5, tx, 2.9);
      ctx.quadraticCurveTo(tx - 0.7, 2.5, tx, 1.4);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // the brow: a soft cream tuft above, lifted, knit or worried
    ctx.save();
    ctx.translate(0, -3.25 - (f.browUp ?? 0) * 0.6);
    ctx.rotate(f.brow * (near ? -0.35 : 0.35));
    ctx.fillStyle = K.tone(a, PB.cream);
    ctx.strokeStyle = PB.creamSh;
    ctx.lineWidth = 0.3;
    ell(ctx, 0, 0, 1.6, 0.62);
    ctx.fill();
    ctx.stroke();
    ell(ctx, near ? 1.2 : -1.2, -0.3, 0.6, 0.45);
    ctx.fill();
    ctx.restore();
    // the monocle on the near eye: a small clear lens over the iris, a thin gold rim, a soft sheen
    // across the glass (his eye and its lids show through it)
    if (near) {
      const mx = 0.1;
      const my = 0.35;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ell(ctx, mx, my, 1.55, 1.68);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(mx, my, 1.4, 1.52, 0, 3.7, 4.5);
      ctx.lineTo(mx, my);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = K.tone(a, PB.goldSh);
      ctx.lineWidth = 0.46;
      ell(ctx, mx, my, 1.55, 1.68);
      ctx.stroke();
      ctx.strokeStyle = K.tone(a, PB.gold);
      ctx.lineWidth = 0.24;
      ell(ctx, mx, my, 1.55, 1.68);
      ctx.stroke();
      // (a glint flashing across it now and then, and as he takes aim)
      const gk = a.pb?.monoGlint ?? 0;
      if (gk > 0.02) sparkle(ctx, mx + 0.95, my - 1.0, 0.95 * gk, '#ffffff');
    }
    ctx.restore();
  });
  // the monocle's chain: a fine drooping gold line from the ring down to a little pin on his shell
  const e0 = sk.eyes[0];
  if (e0) {
    const p0 = plus(e0.tip, [cap * 0.22, cap * 0.67]);
    const p1 = plus(sk.mouth, turn([K.sc(5.4), -K.sc(1.4)], sk.roll));
    const sag = K.sc(2.6) + Math.sin((a.t ?? 0) * 1.3) * K.sc(0.3);
    ctx.strokeStyle = K.tone(a, PB.goldSh);
    ctx.lineWidth = K.sc(0.34);
    ctx.setLineDash([K.sc(0.5), K.sc(0.32)]);
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.quadraticCurveTo((p0[0] + p1[0]) / 2 + K.sc(1.2), Math.max(p0[1], p1[1]) + sag, ...p1);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = K.tone(a, PB.gold);
    ell(ctx, p1[0], p1[1], K.sc(0.45), K.sc(0.45));
    ctx.fill();
  }
  ctx.restore();
}
// His moustache, cheeks and mouth on the front of the carapace.
function mouth(ctx, a, sk, K) {
  const [mx, my] = sk.mouth;
  const s = K.sc(1);
  const f = a.pb?.f ?? FACE0;
  ctx.save();
  inCup(ctx, sk);
  ctx.translate(mx, my);
  ctx.rotate(sk.roll);
  // cheeks (puffed out round as he chews)
  const chew = a.pb?.chew ?? 0;
  ctx.fillStyle = PB.blush;
  ctx.globalAlpha = 0.4 + 0.45 * (f.blush ?? 0);
  ell(ctx, -4.4 * s, -1.3 * s, (1.5 + 0.3 * chew) * s, (0.85 + 0.2 * chew) * s);
  ctx.fill();
  ell(ctx, 4.2 * s, -1.3 * s, (1.5 + 0.3 * chew) * s, (0.85 + 0.2 * chew) * s);
  ctx.fill();
  ctx.globalAlpha = 1;
  // the mouth under the moustache: from its openness and smile
  const op = Math.max(sk.mouthOpen, f.open ?? 0);
  ctx.strokeStyle = K.tone(a, PB.C.mouth);
  ctx.lineWidth = 0.42 * s;
  ctx.lineCap = 'round';
  if (op > 0.12) {
    ctx.fillStyle = K.tone(a, PB.mouthIn);
    ell(ctx, 0, 1.15 * s, (0.75 + 0.35 * (f.smile > 0 ? f.smile : 0)) * s, (0.3 + 0.95 * op) * s);
    ctx.fill();
    ctx.fillStyle = K.tone(a, PB.tongue);
    ell(ctx, 0, (1.3 + 0.55 * op) * s, 0.55 * s, 0.32 * op * s);
    ctx.fill();
  } else {
    const sm = f.smile ?? 0.4;
    ctx.beginPath();
    ctx.moveTo(-0.95 * s, (0.95 - 0.15 * sm) * s);
    ctx.quadraticCurveTo(0, (0.95 + 0.9 * sm) * s, 0.95 * s, (0.95 - 0.15 * sm) * s);
    ctx.stroke();
  }
  // the moustache: two soft cream curls, the tips turned up (down when sad, twitching as he huffs)
  const up = f.stache ?? 0;
  const tw = a.pb?.stTwitch ?? 0;
  for (const d of [-1, 1]) {
    ctx.save();
    ctx.scale(d, 1);
    ctx.rotate(-up * 0.22 - tw * (d > 0 ? 0.12 : 0.06));
    const pts = [[0.2, -0.25], [1.6, -0.8], [3.0, -0.4], [3.8, 0.4], [3.65, -0.6 - up * 0.45], [4.35, -1.1 - up * 0.3], [4.0, 1.05], [2.6, 0.8], [1.2, 0.9], [0.1, 0.5]].map(([x, y]) => [x * s, y * s]);
    poly(ctx, loop(pts, 3));
    ctx.strokeStyle = PB.creamSh;
    ctx.lineWidth = 0.6 * s;
    ctx.stroke();
    ctx.fillStyle = K.tone(a, PB.cream);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 0.3 * s;
    ctx.beginPath();
    ctx.moveTo(0.8 * s, -0.25 * s);
    ctx.quadraticCurveTo(2 * s, -0.6 * s, 3 * s, -0.15 * s);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}
// The sugar cube in his lead claw, while he has it (the act, a lob's wind-up).
function clawCube(ctx, a, mode, K) {
  const pb = a.pb;
  if (mode === 'line' || !pb?.cubeIn) return;
  const sk = a.bk;
  const p = cubeInClaw(sk, K);
  ctx.save();
  inCup(ctx, sk);
  sugarCube(ctx, a, K.tone, p, K.sc(1.75), sk.claws.lead.ang * 0.25 + (pb.cubeSpin ?? 0), pb.cubeIn, pb.bites ?? 0);
  ctx.restore();
}
const cubeInClaw = (sk, K) => {
  const c = sk.claws.lead;
  return plus(c.W, turn([c.c.L * 0.78, -K.sc(1.9)], c.ang));
};

// ---------- His moves (x, hop in body heights; claw channels as the base's: lR/tR lunge, lU/tU
// raised, lO/tO open, lA/tA the hand's angle, - up) ----------
const MOVES = {
  // Sugar Lob: the cube lifted off his cup and wound back high over it, then flicked out in an arc
  // (the dungeon carries it from the release, `lob`).
  sugarLob: {
    anticT: 0.4,
    keys: [
      [0, { x: -0.05, crouch: 0.22, tilt: -8, lR: -0.75, lU: 1.75, lO: 0.2, lA: -132, tU: 0.4, tO: 0.25, tA: -62, eyeL: 0.2 }],
      [0.07, { x: 0.05, crouch: 0.04, tilt: 8, lR: 1.1, lU: 0.75, lO: 1, lA: -24, tU: 0.2 }, 'out'],
      [0.22, { x: 0.04, tilt: 5, lR: 0.85, lU: 0.55, lO: 0.85, lA: -20 }],
      [0.5, { x: 0.02, tilt: 1, lR: 0.3, lU: 0.25, lO: 0.4 }, 'io'],
      [0.85, {}, 'io'],
    ],
    lob: 0.07,
  },
  // Tong Pinch: the lead claw drawn back wide and high, a lunge and a snap like sugar tongs
  tongPinch: {
    anticT: 0.4,
    keys: [
      [0, { x: -0.07, crouch: 0.32, tilt: -7, lR: -0.45, lU: 0.75, lO: 1.05, lA: -52, tU: 0.45, tO: 0.2, tA: -70, eyeL: 0.3 }],
      [0.06, { x: 0.12, crouch: 0.05, tilt: 8, lR: 1.3, lU: 0.1, lO: 0.95, lA: -6 }, 'out'],
      [0.1, { x: 0.13, crouch: 0.05, tilt: 9, lR: 1.35, lU: 0.1, lO: 0, lA: 2 }, 'out'],
      [0.26, { x: 0.1, tilt: 3, lR: 1.05, lU: 0.12, lO: 0.06 }],
      [0.52, { x: 0.03, tilt: 1, lR: 0.35, lU: 0.3, lO: 0.25 }, 'io'],
      [0.82, {}, 'io'],
    ],
    spark: [0.1],
    sparkAt: 'lead',
  },
  // Cup Clonk: half into his cup, rocked back on it, then the whole cup tipped forward in a bump,
  // rim first; rocked back and out again.
  cupClonk: {
    anticT: 0.4,
    keys: [
      [0, { x: -0.07, crouch: 0.45, tilt: -15, hide: 0.62, eyeF: 0.6, lU: 0.5, tU: 0.5, lO: 0, tO: 0, lA: -92, tA: -80 }],
      [0.08, { x: 0.22, hop: 0.12, crouch: 0.1, tilt: 22, hide: 0.62, eyeF: 0.5 }, 'out'],
      [0.16, { x: 0.24, hop: 0, crouch: 0.12, tilt: 15, hide: 0.55, eyeF: 0.4 }, 'in'],
      [0.42, { x: 0.12, tilt: -3, hide: 0.15, eyeF: 0.1 }, 'io'],
      [0.8, {}, 'io'],
    ],
    clonk: 0.08,
  },
  // Pleased (a win, a happy scene): a prim little jig, claws clasped up before him, tiptoeing side to
  // side, a twirl of the moustache.
  jig: {
    anticT: 0.15,
    keys: [
      [0, { lU: 0.95, tU: 0.95, lA: -100, tA: -78, lO: 0.1, tO: 0.1, lR: -0.15, tR: 0.1, crouch: 0.1 }],
      [0.22, { x: 0.05, tilt: 5, lU: 1.0, tU: 0.9, lA: -100, tA: -78, lO: 0.1, tO: 0.1, lR: -0.15, tR: 0.1, lift: 1.3 }, 'io'],
      [0.44, { x: 0, tilt: 0, lU: 0.95, tU: 0.95, lA: -100, tA: -78, lO: 0.1, tO: 0.1, lR: -0.15, tR: 0.1, crouch: 0.12 }, 'io'],
      [0.66, { x: -0.05, tilt: -5, lU: 0.9, tU: 1.0, lA: -100, tA: -78, lO: 0.1, tO: 0.1, lR: -0.15, tR: 0.1, lift: 1.3 }, 'io'],
      [0.88, { x: 0, tilt: 0, lU: 0.95, tU: 0.95, lA: -100, tA: -78, lO: 0.1, tO: 0.1, lR: -0.15, tR: 0.1, crouch: 0.12 }, 'io'],
      [1.1, { x: 0.05, tilt: 5, lU: 1.0, tU: 0.9, lA: -100, tA: -78, lO: 0.1, tO: 0.1, lR: -0.15, tR: 0.1, lift: 1.3 }, 'io'],
      [1.34, { x: 0, tilt: 0, lU: 0.7, tU: 0.7, lA: -80, tA: -70, lO: 0.2, tO: 0.2 }, 'io'],
      [1.7, {}, 'io'],
    ],
  },
};
// (from afar always the lob; close up the pinch and the clonk in turn; on a stage, all three in turn)
const pick = (m, a, pool, n) => {
  if (m.swingFar === true) return 'sugarLob';
  if (m.swingFar === false) return n % 2 ? 'tongPinch' : 'cupClonk';
  return pool[n % pool.length];
};

// ---------- His act: four pieces, each whole in itself ----------
const PIECES = { sugar: 9.6, polish: 6.8, clink: 6.2, bow: 4.6 };
const ORDER = ['sugar', 'polish', 'clink', 'bow'];
const NONE = { reach: 0, hold: 0, inspect: 0, nibble: 0, bites: 0, chew: 0, yum: 0, dig: 0, place: 0, pat: 0, huff: 0, polish: 0, rub: 0, admire: 0, adjust: 0, clink: -1, hide: 0, peek: 0, peekLook: 0, ahem: 0, smooth: 0, back: 0, bow: 0, sweep: 0, inClaw: 0, onStep: 1, face: 'calm', lookX: null };
// A piece's channels at `u` seconds into it.
function actAt(name, u) {
  const A = { ...NONE, piece: name, u };
  // (the breath after a piece: just standing, his easy face)
  if (u > PIECES[name]) return A;
  if (name === 'sugar') {
    // down to the doorstep for the cube; bring it up before the monocle; turn it about
    A.reach = win(u, 0.2, 0.8, 1.05, 1.6);
    A.hold = win(u, 1.1, 1.7, 5.0, 5.4);
    A.inspect = win(u, 1.5, 1.9, 3.1, 3.4);
    // three dainty nibbles, then the rest popped in and chewed, savoured
    const nibs = [3.5, 4.1, 4.7];
    A.nibble = nibs.reduce((s0, t0) => s0 + pulse(u, t0, 0.32), 0);
    A.bites = nibs.reduce((s0, t0) => s0 + sstep((u - t0 - 0.14) / 0.08), 0);
    A.chew = win(u, 5.2, 5.4, 6.6, 6.9);
    A.yum = win(u, 5.3, 5.6, 6.8, 7.2);
    // into the cup for a fresh one, set down on the doorstep, pat pat
    A.dig = win(u, 7.0, 7.5, 7.7, 8.0);
    A.place = win(u, 7.8, 8.3, 8.6, 9.0);
    A.pat = pulse(u, 8.65, 0.22) + pulse(u, 8.95, 0.22);
    // (the cube: changing hands slowly as the claw is at it, never a jump; popped in at the end; a
    // fresh one fetched out of the cup)
    A.inClaw = sstep((u - 0.85) / 0.25) * (1 - sstep((u - 5.1) / 0.2)) + sstep((u - 7.55) / 0.25) * (1 - sstep((u - 8.45) / 0.25));
    A.onStep = 1 - sstep((u - 0.85) / 0.25) + sstep((u - 8.45) / 0.25);
    A.face = u < 1.4 ? 'calm' : u < 3.4 ? 'inspect' : u < 5.2 ? 'nibble' : u < 7.0 ? 'yum' : u < 8.4 ? 'focus' : 'proud';
    if (A.inspect > 0.3) A.lookX = 0.6;
  } else if (name === 'polish') {
    // the lead claw up to his rim; a huff of breath on it; round and round; the gleam
    A.polish = win(u, 0.2, 0.8, 4.4, 5.0);
    A.huff = pulse(u, 0.9, 0.7);
    A.rub = sstep((u - 1.6) / 0.3) * (1 - sstep((u - 4.2) / 0.3));
    A.admire = win(u, 4.6, 5.0, 6.2, 6.6);
    A.adjust = win(u, 5.0, 5.3, 5.8, 6.2);
    A.face = u < 0.8 ? 'calm' : u < 1.6 ? 'huff' : u < 4.4 ? 'focus' : 'proud';
  } else if (name === 'clink') {
    // the clink: a start, into the cup; the monocle peeking this way and that; out; ahem
    A.clink = u;
    A.hide = win(u, 0.55, 0.85, 3.4, 4.1);
    A.peek = win(u, 1.6, 2.0, 3.2, 3.5);
    A.peekLook = win(u, 1.9, 2.1, 3.1, 3.3) * clamp(Math.sin((u - 1.9) * 3.6) * 2.5, -1, 1);
    A.ahem = win(u, 4.2, 4.4, 5.4, 5.8);
    A.smooth = win(u, 4.4, 4.7, 5.4, 5.8);
    A.face = u < 0.4 ? 'calm' : u < 1.0 ? 'startle' : u < 4.0 ? 'peek' : u < 4.4 ? 'calm' : 'ahem';
  } else if (name === 'bow') {
    A.back = win(u, 0.1, 0.6, 3.6, 4.2);
    A.bow = win(u, 0.7, 1.4, 2.4, 3.2);
    A.sweep = win(u, 0.8, 1.4, 2.3, 3.0);
    A.face = u < 0.7 ? 'calm' : u < 3.2 ? 'content' : 'proud';
  }
  return A;
}

// ---------- His faces ----------
const FACE0 = { lid: 0.16, low: 0.22, brow: -0.15, browUp: 0.25, shut: 0, smile: 0.6, stache: 0.35, blush: 0.4, open: 0, look: 0, tear: 0, shutKind: 'happy' };
const FACES = {
  // (calm: warm and kindly, eyes soft and open, a small smile under the moustache)
  calm: { lid: 0.16, low: 0.22, brow: -0.15, browUp: 0.25, shut: 0, smile: 0.6, stache: 0.35, blush: 0.4, open: 0 },
  inspect: { lid: 0.1, low: 0.06, brow: -0.15, browUp: 1, shut: 0, smile: 0.15, stache: 0.5, blush: 0.3, open: 0.22 },
  nibble: { lid: 0.3, low: 0.25, brow: -0.2, browUp: 0.5, shut: 0, smile: 0.4, stache: 0.6, blush: 0.6, open: 0 },
  yum: { lid: 1, low: 0.4, brow: -0.3, browUp: 0.6, shut: 1, smile: 0.9, stache: 0.9, blush: 0.95, open: 0, shutKind: 'happy' },
  huff: { lid: 0.3, low: 0.25, brow: 0.1, browUp: 0.2, shut: 0, smile: 0, stache: 0.1, blush: 0.4, open: 0.7 },
  focus: { lid: 0.42, low: 0.3, brow: 0.35, browUp: -0.1, shut: 0, smile: 0.2, stache: 0.2, blush: 0.35, open: 0 },
  proud: { lid: 0.55, low: 0.3, brow: -0.1, browUp: 0.5, shut: 0, smile: 0.85, stache: 0.75, blush: 0.6, open: 0 },
  startle: { lid: -0.05, low: 0, brow: -0.6, browUp: 1.3, shut: 0, smile: -0.2, stache: -0.4, blush: 0.4, open: 0.75 },
  peek: { lid: 0.3, low: 0.35, brow: -0.45, browUp: 0.6, shut: 0, smile: -0.2, stache: 0, blush: 0.3, open: 0 },
  ahem: { lid: 1, low: 0.35, brow: 0.1, browUp: 0.3, shut: 1, smile: 0.3, stache: 0.4, blush: 0.5, open: 0, shutKind: 'happy' },
  content: { lid: 1, low: 0.4, brow: -0.2, browUp: 0.3, shut: 1, smile: 0.9, stache: 0.6, blush: 0.7, open: 0, shutKind: 'happy' },
  fierce: { lid: 0.4, low: 0.4, brow: 0.9, browUp: -0.45, shut: 0, smile: -0.25, stache: -0.25, blush: 0.25, open: 0.3 },
  smug: { lid: 0.55, low: 0.35, brow: -0.1, browUp: 0.6, shut: 0, smile: 0.9, stache: 0.85, blush: 0.5, open: 0 },
  hurt: { lid: 1, low: 0.4, brow: -0.8, browUp: 0.4, shut: 1, smile: -0.6, stache: -0.6, blush: 0.4, open: 0.5, shutKind: 'hurt' },
  sleep: { lid: 1, low: 0.3, brow: -0.1, browUp: 0, shut: 1, smile: 0.3, stache: 0.1, blush: 0.4, open: 0.15, shutKind: 'sleep' },
  dizzy: { lid: 1, low: 0.3, brow: -0.5, browUp: 0.3, shut: 1, smile: -0.4, stache: -0.7, blush: 0.3, open: 0.45, shutKind: 'dizzy' },
  sad: { lid: 0.45, low: 0.2, brow: -0.8, browUp: 0.4, shut: 0, smile: -0.6, stache: -0.75, blush: 0.3, open: 0, tear: 1 },
  cross: { lid: 0.35, low: 0.35, brow: 1, browUp: -0.5, shut: 0, smile: -0.5, stache: -0.2, blush: 0.6, open: 0 },
  happy: { lid: 1, low: 0.4, brow: -0.3, browUp: 0.7, shut: 1, smile: 1, stache: 0.95, blush: 0.9, open: 0.55, shutKind: 'happy' },
  worried: { lid: 0.15, low: 0.1, brow: -0.65, browUp: 0.6, shut: 0, smile: -0.35, stache: -0.35, blush: 0.3, open: 0 },
  talk: { lid: 0.24, low: 0.2, brow: -0.1, browUp: 0.3, shut: 0, smile: 0.4, stache: 0.35, blush: 0.4, open: 0.3 },
};
const KEYS = ['lid', 'low', 'brow', 'browUp', 'shut', 'smile', 'stache', 'blush', 'open', 'tear'];
// vowel mouths for talking: [openness, smile], each held a beat
const VOWELS = [[0.55, 0.2], [0.25, 0.6], [0.7, 0.3], [0, 0.5], [0.4, 0.4]];

// ---------- His act and his moods (a.pb), each frame before the base draws ----------
function pose(m, a, out, K, mv, mt) {
  const st = (a.mo.rig ??= {});
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const now = a.now ?? a.t ?? 0;
  const k = (r) => 1 - Math.exp(-dt * r);
  const name = mv ? Object.keys(MOVES).find((n) => K.moves[n] === mv) ?? 'base' : null;
  // (a hit only counts once it has happened: a time since it less than nothing, as when a stage
  // replays from the start with the last hit still remembered, is no hit at all)
  const ago = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && ago >= 0 && ago < 0.55;
  const napping = m.pose === 'sleep' || (m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now && m.hp > 0);
  const fighting = (m.aggroUntil ?? 0) > now || Boolean(m.engaged);
  const walkW = clamp(a.walkW ?? 0, 0, 1);
  const moving = Boolean(a.moving) || walkW > 0.15;
  // Going: a dainty tiptoe scuttle, both claws held up primly before his chest, stalks upright.
  if (!mv && m.hp > 0 && !napping) {
    const w = walkW;
    out.lU = mix(out.lU, 0.62, w);
    out.tU = mix(out.tU, 0.5, w);
    out.lA = mix(out.lA, -78, w);
    out.tA = mix(out.tA, -70, w);
    out.lR = mix(out.lR, -0.3, w);
    out.tR = mix(out.tR, -0.25, w);
    out.lO = mix(out.lO, 0.08, w);
    out.tO = mix(out.tO, 0.08, w);
    out.crouch = mix(out.crouch, -0.12, w);
    out.eyeF = mix(out.eyeF, -0.05, w);
  }
  // (a gentleman's claws never click: out of a move, the base's quick little clicks open and shut
  // eased on a spring of his own)
  for (const key of ['lO', 'tO']) {
    const sp = (st[`pb${key}`] ??= { x: out[key], v: 0 });
    if (mv) {
      sp.x = out[key];
      sp.v = 0;
    } else {
      const n = Math.max(1, Math.ceil(dt / 0.008));
      for (let i = 0; i < n; i++) {
        sp.v += (90 * (out[key] - sp.x) - 17 * sp.v) * (dt / n);
        sp.x += sp.v * (dt / n);
      }
      out[key] = sp.x;
    }
  }
  // Calm: standing about with nothing else on (the act shows only then, fading in and out)
  const calmGoal = !mv && m.hp > 0 && !napping && !m.pose && !m.cine && !hurt && !fighting && !moving ? 1 : 0;
  st.pbCalm = mix(st.pbCalm ?? 0, calmGoal, k(calmGoal ? 1.8 : 7));
  const cw = sstep(st.pbCalm);
  // The piece he is playing: started as he settles; the next once one ends (a breath between), the
  // first in turn that fits the time he has (m.restUntil, from world/mobs.js); none when nothing
  // fits. Dropped once he's no longer calm, or the clock went back (a stage's replay).
  let P = st.pbPiece ?? null;
  if (P && (now < P.t0 - 0.25 || (cw < 0.03 && !calmGoal))) P = null;
  if (P && P.name && now - P.t0 > PIECES[P.name] + 1.4) P = null;
  if (P && !P.name && now >= P.until) P = null;
  if (!P && calmGoal) {
    const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
    st.pbN ??= (m.uid ?? 0) % ORDER.length;
    for (let i = 0; i < ORDER.length; i++) {
      const nm = ORDER[(st.pbN + i) % ORDER.length];
      if (PIECES[nm] + 0.4 <= left) {
        P = { name: nm, t0: now + 0.25 };
        st.pbN = (st.pbN + i + 1) % ORDER.length;
        break;
      }
    }
    if (!P) P = { name: null, t0: now, until: now + Math.max(0.5, Math.min(left, 3)) };
  }
  st.pbPiece = P;
  const A = P && P.name ? actAt(P.name, now - P.t0) : { ...NONE, piece: null, u: 0 };
  // (his own little shuffle and leg-tap give way to the act)
  out.x *= 1 - cw;
  // the sugar cube: the lead claw down to it on the doorstep; up before his monocle; to his mouth
  const reachW = Math.max(A.reach, A.place) * cw;
  out.lU = mix(out.lU, -0.35, reachW);
  out.lR = mix(out.lR, -0.35, reachW);
  out.lA = mix(out.lA, 12, reachW);
  out.lO = mix(out.lO, 0.75 * (1 - Math.max(A.inClaw ?? 0, 0)), reachW);
  out.eyeF += 0.15 * reachW;
  out.tilt += 4 * reachW;
  const holdW = A.hold * cw;
  out.lU = mix(out.lU, 1.05 + 0.12 * Math.sin(A.u * 2.2) * A.inspect, holdW);
  out.lR = mix(out.lR, -0.05 - 0.25 * A.nibble, holdW);
  out.lA = mix(out.lA, -78, holdW);
  out.lO = mix(out.lO, 0.1, holdW);
  out.tilt += (-4 * A.inspect + 3 * A.nibble + 2.5 * Math.sin(A.u * 4) * A.yum) * cw;
  out.mouth = Math.max(out.mouth ?? 0, (A.nibble * 0.7 + A.chew * 0.25 * Math.max(0, Math.sin(A.u * 13))) * cw);
  // into his cup for a fresh cube (the claw up and back into the mouth of it, over his shoulder)
  const digW = A.dig * cw;
  out.lU = mix(out.lU, 1.35, digW);
  out.lR = mix(out.lR, -0.7, digW);
  out.lA = mix(out.lA, -150, digW);
  out.lO = mix(out.lO, 0.6, digW);
  out.tilt += -5 * digW;
  out.lU += A.pat * -0.12 * cw;
  // the polish: the lead claw up at the front of his rim, round and round
  const polW = A.polish * cw;
  const rp = A.u * 9;
  out.lU = mix(out.lU, 0.95 + Math.sin(rp) * 0.18 * A.rub, polW);
  out.lR = mix(out.lR, -0.2 + Math.cos(rp) * 0.16 * A.rub, polW);
  out.lA = mix(out.lA, -112 + Math.sin(rp) * 14 * A.rub, polW);
  out.lO = mix(out.lO, 0.1, polW);
  out.tilt += (-5 * A.polish - 3 * A.huff + 3 * A.admire) * cw;
  // the monocle set straight (the lead claw up to his eye), the moustache smoothed
  out.lU = mix(out.lU, 1.45, A.adjust * cw);
  out.lR = mix(out.lR, -0.35, A.adjust * cw);
  out.lA = mix(out.lA, -100, A.adjust * cw);
  out.lO = mix(out.lO, 0.05, A.adjust * cw);
  out.lU = mix(out.lU, 0.95, A.smooth * cw);
  out.lR = mix(out.lR, 0.05 + 0.12 * Math.sin(A.u * 7) * A.smooth, A.smooth * cw);
  out.lA = mix(out.lA, -150, A.smooth * cw);
  out.lO = mix(out.lO, 0.05, A.smooth * cw);
  // the clink: into his cup; the peek (part way out, his stalks up, looking this way and that)
  out.hide = Math.max(out.hide ?? 0, A.hide * (1 - 0.32 * A.peek) * cw);
  out.eyeF = mix(out.eyeF, 0.75, A.hide * (1 - A.peek) * cw);
  out.crouch += (0.2 * pulse(A.u, 0.38, 0.4) * (A.piece === 'clink' ? 1 : 0)) * cw;
  out.hop += 0.06 * pulse(A.u, 0.4, 0.35) * (A.piece === 'clink' ? 1 : 0) * cw;
  out.tilt += -3 * A.ahem * cw;
  // the bow: a step back, then tipped forward, the lead claw swept across before him
  out.x += -0.05 * A.back * cw;
  out.tilt += 13 * A.bow * cw;
  out.crouch += 0.32 * A.bow * cw;
  out.eyeF = mix(out.eyeF, 0.28, A.bow * cw);
  out.lU = mix(out.lU, 0.75, A.sweep * cw);
  out.lR = mix(out.lR, 0.55 - 0.9 * sstep((A.u - 1.0) / 1.2), A.sweep * cw);
  out.lA = mix(out.lA, -40, A.sweep * cw);
  out.tU = mix(out.tU, 0.15, A.bow * cw);
  out.tR = mix(out.tR, -0.5, A.bow * cw);
  // (where his stalks look: at the cube, at his rim, this way and that from his cup)
  const own = a.crLook ?? [0, 0];
  const wPeek = A.peek * cw;
  const wCube = Math.max(A.inspect, A.nibble) * cw;
  const wRim = A.polish * cw;
  const goal = [0, 1].map((i) => {
    let g = own[i];
    g = mix(g, i ? 0.35 : 0.5, clamp(wCube, 0, 1));
    g = mix(g, i ? 0.6 : 0.85, wRim);
    g = mix(g, A.peekLook * (i ? 0.8 : 1), wPeek);
    return g;
  });
  const lk = (st.pbLook ??= goal.slice());
  for (let i = 0; i < 2; i++) lk[i] = mix(lk[i], goal[i], k(9));
  a.crLook = lk.slice();
  // a move's own extras: the lob's cube in his claw till he lets go; the clonk's tuck
  const lobHold = name === 'sugarLob' && (mt ?? 0) < MOVES.sugarLob.lob;
  // His mood: beaten, hurt, asleep, a move, a scene's mood, the act's, low on health, calm.
  let mood = 'calm';
  const cine = m.cine?.mood;
  if (m.hp <= 0) mood = 'dizzy';
  else if (hurt || name === 'base' && (mv === K.moves.hurt || mv === K.moves.knockdown)) mood = 'hurt';
  else if (napping || cine === 'sleep') mood = 'sleep';
  else if (name === 'sugarLob') mood = (mt ?? 0) < MOVES.sugarLob.lob ? 'focus' : 'smug';
  else if (name === 'tongPinch' || name === 'cupClonk') mood = 'fierce';
  else if (name === 'jig' || cine === 'happy') mood = 'happy';
  else if (cine === 'sad') mood = 'sad';
  else if (cine === 'angry') mood = 'cross';
  else if (cine === 'talk' || m.talking) mood = 'talk';
  else if (name) mood = 'focus';
  else if (cw > 0.5 && A.face !== 'calm') mood = A.face;
  else if (m.hp < m.def.hp * 0.25) mood = 'worried';
  else if (fighting) mood = 'focus';
  let F = FACES[mood] ?? FACES.calm;
  if (mood === 'talk') {
    const v = VOWELS[Math.floor(now * 7) % VOWELS.length];
    F = { ...F, open: v[0], smile: v[1] };
  }
  const f = (st.pbF ??= { ...FACE0 });
  for (const key of KEYS) f[key] = mix(f[key], F[key] ?? FACE0[key], k(key === 'lid' || key === 'shut' ? 18 : 12));
  f.shutKind = F.shutKind ?? f.shutKind ?? 'happy';
  f.look = mix(f.look, cw > 0.4 && A.lookX !== null ? A.lookX : name === 'sugarLob' || name === 'tongPinch' ? 0.6 : 0, k(8));
  // (a blink now and then, only while his eyes are open and easy)
  const blinkK = ['calm', 'worried', 'talk', 'focus'].includes(mood) ? pulse(((a.t ?? 0) + (m.uid % 5) * 0.7) % 4.4, 0, 0.16) : 0;
  // the monocle's glint: as he takes aim, and now and then
  const glint = Math.max(name === 'sugarLob' || name === 'tongPinch' ? pulse(mt ?? 0, -0.28, 0.3) : 0, pulse(((a.t ?? 0) + (m.uid % 3)) % 7.3, 0, 0.35), A.adjust > 0.5 ? pulse(A.u, 5.4, 0.4) : 0);
  // the rim's gleam: sliding round now and then, and big after his polish
  const gq = (((a.t ?? 0) + (m.uid % 4) * 1.3) % 5.2) / 0.9;
  const polGleam = A.piece === 'polish' ? clamp((A.u - 4.3) / 0.8, 0, 1) : 0;
  const gleam = A.piece === 'polish' && cw > 0.05 ? (polGleam > 0 && polGleam < 1 ? polGleam : -1) : gq < 1 ? gq : -1;
  // the cube: on his doorstep, in his claw, or eaten; changing places slowly, never with a jump
  // (the lob: taken up from the step as the wind-up starts; a fresh one set out after)
  let cubeIn = 0;
  let cubeHomeA = 1;
  if (name === 'sugarLob') {
    const w = (mt ?? 0) < 0 ? sstep(1 + (mt ?? 0) / 0.4) : 1;
    cubeIn = lobHold ? sstep(w / 0.35) : 0;
    cubeHomeA = lobHold ? 1 - sstep(w / 0.35) : sstep(((mt ?? 0) - 0.5) / 0.3);
  }
  if (A.piece === 'sugar') {
    cubeIn = Math.max(cubeIn, A.inClaw * cw);
    cubeHomeA = Math.min(cubeHomeA, mix(1, A.onStep, cw));
  }
  a.pb = {
    f: blinkK > 0.001 ? { ...f, lid: mix(f.lid, 1, blinkK) } : f,
    cubeIn,
    cubeHomeA,
    cubeOn: cubeHomeA > 0.01,
    bites: A.piece === 'sugar' && A.u < 6.5 ? A.bites : 0,
    cubeSpin: A.inspect * Math.sin(A.u * 2.4) * 0.6,
    chew: A.chew * cw,
    stTwitch: Math.max(A.smooth, mood === 'cross' ? 1 : 0) * Math.sin(now * 14),
    monoGlint: glint,
    gleam,
    shine: polGleam > 0 ? 1 : 0,
    act: { ...A, cw },
    mood,
    name,
    mt,
  };
}
// After the base's own poses (asleep, beaten): no crab froth bubbles from a gentleman; his own z's.
function after(m, a) {
  a.crBubble = null;
}

// ---------- His effects (over everything): steam, crumbs, breath, the clink, the clonk ----------
// (asleep, the game's own z's rise over his drawn head: none of his own)
function fx(ctx, m, a, K) {
  const sk = a.bk;
  const pb = a.pb;
  if (!sk?.shell || !pb) return;
  rimGleam(ctx, a);
  const s = K.sc(1);
  const t = a.t ?? 0;
  const A = pb.act ?? NONE;
  const cw = A.cw ?? 0;
  // a curl of steam from his cup now and then (puffing hard when he's cross)
  const top = toW(sk, K, ring(CUP.rim, -1.45, CUP.R + 0.6));
  const cross = pb.mood === 'cross' ? 1 : 0;
  const per = cross ? 1.1 : 4.6;
  for (let i = 0; i < (cross ? 3 : 1); i++) {
    const q = ((t + i * (per / 3) + (m.uid % 5) * 0.7) % per) / (cross ? 1.1 : 2.4);
    if (q > 1 || m.hp <= 0) continue;
    const e = sstep(q);
    const p = plus(top, [Math.sin(q * 5 + i) * 1.2 * s, -e * 7 * s]);
    if (cross) puff(ctx, p[0], p[1], (1 + q * 1.4) * s, (1 - q) * 0.9);
    else {
      ctx.strokeStyle = `rgba(255,255,255,${0.75 * Math.sin(Math.PI * q)})`;
      ctx.lineWidth = 0.8 * s;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(p[0], p[1] + 2.2 * s);
      ctx.quadraticCurveTo(p[0] + 1.5 * s, p[1] + 0.6 * s, p[0], p[1] - 0.8 * s);
      ctx.quadraticCurveTo(p[0] - 1.4 * s, p[1] - 2 * s, p[0] + 0.2 * s, p[1] - 3.2 * s);
      ctx.stroke();
    }
  }
  if (cw > 0.2) {
    // crumbs from his nibbles, falling and fading
    if (A.piece === 'sugar') {
      for (const t0 of [3.5, 4.1, 4.7]) {
        const q = (A.u - t0 - 0.12) / 0.6;
        if (q < 0 || q > 1) continue;
        const c = cubeInClaw(sk, K);
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = (1 - q) * cw;
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = PB.sugarInk;
          ctx.lineWidth = 0.3 * s;
          const x = c[0] + (i - 1) * 1.1 * s + q * (i - 1) * 1.4 * s;
          const y = c[1] + q * q * 7 * s + i * 0.4 * s;
          ctx.beginPath();
          ctx.rect(x - 0.35 * s, y - 0.35 * s, 0.7 * s, 0.7 * s);
          ctx.fill();
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
      // a happy little sparkle as he savours it
      if (A.yum > 0.3) {
        const p = plus(sk.mouth, [-K.sc(5), -K.sc(3)]);
        sparkle(ctx, p[0], p[1], 1.1 * s * A.yum * (0.7 + 0.3 * Math.sin(t * 7)), '#fff3c4');
      }
    }
    // his breath on the rim: a soft puff
    if (A.piece === 'polish' && A.huff > 0.02) {
      const p0 = plus(sk.mouth, [-K.sc(1), -K.sc(2)]);
      const p1 = toW(sk, K, ring(CUP.rim, -0.5, CUP.R));
      const p = lerp2(p0, p1, A.huff * 0.7);
      puff(ctx, p[0], p[1], (0.8 + A.huff * 1.2) * s, A.huff * 0.8 * cw);
    }
    // the clink: a little "ting" just behind him, two quick rings
    if (A.piece === 'clink' && A.u > 0.2 && A.u < 1.1) {
      const q = (A.u - 0.2) / 0.9;
      const p = toW(sk, K, ring(CUP.bottom, -2.2, CUP.foot + 4));
      ctx.strokeStyle = rgba(PB.goldSh, (1 - q) * 0.9);
      ctx.lineWidth = 0.55 * s;
      for (const d of [0, 0.22]) {
        const r = (1.5 + (q - d) * 6) * s;
        if (q - d < 0) continue;
        ctx.beginPath();
        ctx.arc(p[0], p[1], r, -2.4, -0.7);
        ctx.stroke();
      }
      sparkle(ctx, p[0], p[1], 1.6 * s * (1 - q), '#fff3c4');
    }
  }
  // a move's own: the lob's flick (a sparkle off his claw at the release), the clonk's bump (stars
  // off the cup's rim)
  const name = pb.name;
  const mt = pb.mt ?? 0;
  if (name === 'sugarLob') {
    const q = (mt - MOVES.sugarLob.lob) / 0.25;
    if (q > 0 && q < 1) {
      const p = cubeInClaw(sk, K);
      sparkle(ctx, p[0] + 2 * s, p[1] - 1 * s, 2 * s * (1 - q), '#ffffff');
      sparkle(ctx, p[0] + (3 + q * 3) * s, p[1] - (2 + q * 2) * s, 1.1 * s * (1 - q), '#fff3c4');
    }
  } else if (name === 'cupClonk') {
    const q = (mt - MOVES.cupClonk.clonk) / 0.3;
    if (q > 0 && q < 1) {
      const p = toW(sk, K, ring(CUP.rim, 0.15, CUP.R + 0.8));
      const e = 1 - (1 - q) ** 3;
      ctx.globalAlpha = 1 - q * q;
      sparkle(ctx, p[0], p[1], 3.2 * s * (0.5 + 0.6 * e), '#ffffff');
      sparkle(ctx, p[0], p[1], 1.6 * s * (0.5 + 0.6 * e), '#fff3a6');
      for (let i = 0; i < 4; i++) {
        const an = -1.2 + i * 0.8;
        sparkle(ctx, p[0] + Math.cos(an) * 6 * e * s, p[1] + Math.sin(an) * 5 * e * s, 0.9 * s * (1 - q * 0.5), i % 2 ? '#ffc9da' : '#fff6c8');
      }
      ctx.globalAlpha = 1;
    }
  }
}

// ---------- His lobbed sugar cube, in flight (the dungeon's 'spit' vfx: render/dreamfx.js) ----------
// `p` 0..1 along its flight, `d` the way it flies. Returns true if it drew.
const plainTone = (a, c) => c;
export function sugarShot(ctx, shot, x, y, p, d) {
  if (shot !== 'sugarcube') return false;
  ctx.save();
  // a soft trail of sugar
  for (let i = 1; i <= 4; i++) {
    ctx.globalAlpha = 0.55 * (1 - i / 5);
    ctx.fillStyle = '#ffffff';
    ell(ctx, x - d * i * 2.6, y + i * 0.4, 1.2 - i * 0.18, 1.2 - i * 0.18);
    ctx.fill();
  }
  ctx.restore();
  sugarCube(ctx, null, plainTone, [x, y], 2.6, p * 12 * d);
  sparkle(ctx, x + d * 3, y - 3, 1.3 + Math.sin(p * 30) * 0.4, '#fff6c8');
  return true;
}

// ---------- His dress on the crab ----------
const look = {
  kind: 'hermit',
  C: PB.C,
  CC: PB.CC,
  ink: PB.ink,
  seam: PB.seam,
  P: {
    // (a size up from the base's hermit: his cup must read at the game's own zoom)
    scale: 1.15,
    eyes: { x: 3.0, z: 0.5, len: 5.6, w: 2.3, cap: 3.3, splay: 15 },
    mouth: [2.4, 0.98],
    // (the cup in the shell's place: the base's shell outline and its opening laid over the cup's
    // bowl and mouth, so the base's seams and its hide-in-your-shell curtain fit the cup)
    shell: { c: [-3.4, -4.4], r: [11, 10.2, 0], coil: [-1.4, -1.6], ap: { c: [CUP.rim, 0], rx: CUP.sq * CUP.R, ry: CUP.R, rot: 0 } },
    claws: {
      lead: { root: [6.2, -1, 4], rest: [9.4, -0.6, 6.2], arm: [2.8, 2.6], w: [3, 2.7, 3], hand: [5.8, 4.4], ang: -30 },
      trail: { root: [-6.2, -1, 4], rest: [-9.8, -1.2, 6.6], arm: [2.6, 2.4], w: [2.7, 2.4, 2.7], hand: [5, 3.8], ang: -46 },
      reach: [5.5, 1.2],
      up: [0, 5, -1],
    },
    // (a dainty tiptoe scuttle: steps a little longer than they look, lifted high, about three a
    // second each leg at his roaming 44)
    gait: { half: 3.8, lift: 3.0, duty: 0.52 },
    moves: ['sugarLob', 'tongPinch', 'cupClonk'],
    happy: 'jig',
  },
  hide: { shell: true },
  // (inside his cup: his body and legs hidden by its wall, seen only in its mouth or outside it; his eye
  // stalks stand up out of it)
  clip: { body: behindLip, belly: behindLip, legsLead: inside, legsTrail: inside },
  moves: MOVES,
  pick,
  mouth,
  over: {
    shell: cup,
    body(ctx, a, mode, K) {
      lip(ctx, a, mode, K);
      doorstepCube(ctx, a, mode, K);
    },
    eyes(ctx, a, mode, K) {
      if (mode !== 'line') eyes(ctx, a, K);
    },
    clawLead: clawCube,
  },
  pose,
  after,
  fx,
};
export const TEACUP_HERMIT = dressedCrab(look);
// (`noHop`: none of the monster drawer's little hops or idle notes over him; he shows his moods in his
// own act and face)
TEACUP_HERMIT.art.noHop = true;
// (his dress, for the dev tools that watch his parts frame by frame)
export const TEACUP_HERMIT_LOOK = look;
