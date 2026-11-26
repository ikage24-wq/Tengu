// The Porcelain Doll (2026-11-26, remade from scratch, the player's pick "A" of three: Pinsworth, the
// pincushion duellist): the Moonlit Manor's level 15 monster of the Moonlit Garden, the Portrait
// Gallery and the Library. A plump crimson velvet tomato pincushion with gold-cord panel seams and a
// green felt calyx, a white china thimble (gold rim, painted rosebud) cocked over one eye like a
// musketeer's hat, pearl-headed pins stuck in its back, a little strawberry emery swinging from its
// side on a ribbon, and a long silver sewing needle for a rapier, a moonlit thread trailing from its
// eye. Dashing, vain, theatrical: every fight is a duel, and every duel ends in a bow. It moves on its
// own copy of the veggie base (veggiebase.js).
//   idle    a 30 s act, only while it stands about calm:
//           - the salute: the needle raised before its face, eyes shut proudly; a swish;
//           - the moustache: a nub up to its face, twirling the curl, one brow up, smug;
//           - a loose pin: one slides out of its back; a look back, pushed in ("!": eep), a brave nod;
//           - the petal: a rose petal drifts down; a lunge skewers it; admired, then flicked away;
//           - the bow: a deep courtly bow, needle swept out low; up again, proud.
//   moves   (def.moves, in turn) Lunge: a fencer's crouch, then a long lunge, a glint on the point.
//           Pin-Prick Flurry: three quick jabs stepping in. Flourish Cut: the needle swept overhead
//           and down, the thread lashing after it.
//   hit     squeezed eyes, the thimble knocked back, the pins rattling; nap: sat back, the thimble
//           slid down over its eyes, the moustache fluttering with each snore; beaten: flat on its
//           back, the thimble rolled off beside it, a white hanky waved on the needle's point (I yield).
// Everything here drawn from scratch, the face too; its needle is its own prop, drawn by its rig.
import { dressedVeggie } from './veggiebase.js';

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
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
const span = (t, t0, d) => (t >= t0 && t < t0 + d ? (t - t0) / d : -1);
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
// a four-point sparkle (soft curved sides)
function sparkle(ctx, x, y, k) {
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
}
// blend a channel toward target values by weight w
const go = (out, tgt, w) => {
  if (w <= 0) return;
  for (const [k, v] of Object.entries(tgt)) out[k] = mix(out[k] ?? 0, v, w);
};
// a damped angle spring (radians), in small steps
function spr(s, goal, k, c, push, dt) {
  const n = Math.max(1, Math.ceil(dt * 240));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (k * (goal - s.x) - c * s.v + push) * h;
    s.x += s.v * h;
  }
  if (!Number.isFinite(s.x + s.v)) Object.assign(s, { x: goal, v: 0 });
  return s.x;
}
// A hanging thread: a few points on verlet, held at one end, simulated in the world itself (so it
// trails as the monster moves and stays where it is as the monster turns round, never snapping),
// never through the ground. Handed back in the drawing's own units.
function threadSim(st, key, anchor, m, a, n, seg, grav = 60) {
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const sx = a.flip ? -1 : 1;
  const mx = m.x ?? 0;
  const my = m.y ?? 0;
  const toW = (p) => [mx + sx * p[0], my + p[1]];
  const A = toW(anchor);
  let T = st[key];
  if (T) {
    // (the monster put somewhere else in one go, a teleport or a respawn: the thread goes with it)
    const jx = mx - (T.mx ?? mx);
    const jy = my - (T.my ?? my);
    if (Math.hypot(jx, jy) > 12) {
      for (const q of [...T.p, ...T.q]) {
        q[0] += jx;
        q[1] += jy;
      }
    }
    T.mx = mx;
    T.my = my;
  }
  // (made fresh: hanging straight down behind the hand; also if it's somehow left far behind)
  if (!T || Math.hypot(T.p[0][0] - A[0], T.p[0][1] - A[1]) > 40) {
    T = st[key] = { p: [], q: [], mx, my };
    for (let i = 0; i < n; i++) {
      T.p.push([A[0] - sx * i * 0.3, A[1] + i * seg]);
      T.q.push([A[0] - sx * i * 0.3, A[1] + i * seg]);
    }
  }
  if (dt > 0) {
    // (its swing dies away at the same rate whatever the frame rate)
    const keep = Math.exp(-dt * 5.5);
    for (let i = 1; i < n; i++) {
      const p = T.p[i];
      const q = T.q[i];
      const vx = (p[0] - q[0]) * keep;
      const vy = (p[1] - q[1]) * keep;
      T.q[i] = [p[0], p[1]];
      p[0] += vx;
      p[1] += vy + grav * dt * dt;
    }
  }
  T.p[0] = A;
  const floor = my - 0.3;
  for (let it = 0; it < 5; it++) {
    for (let i = 1; i < n; i++) {
      const p0 = T.p[i - 1];
      const p1 = T.p[i];
      const dx = p1[0] - p0[0];
      const dy = p1[1] - p0[1];
      const d = Math.hypot(dx, dy) || 1e-6;
      const k = (d - seg) / d;
      if (i === 1) {
        p1[0] -= dx * k;
        p1[1] -= dy * k;
      } else {
        p0[0] += dx * k * 0.5;
        p0[1] += dy * k * 0.5;
        p1[0] -= dx * k * 0.5;
        p1[1] -= dy * k * 0.5;
      }
      if (p1[1] > floor) p1[1] = floor;
    }
  }
  return T.p.map((p) => [(p[0] - mx) * sx, p[1] - my]);
}
function smoothLine(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my);
  }
  ctx.lineTo(...pts[pts.length - 1]);
}
const ACT = 30;
const actClock = (a) => ((((a.t ?? 0) % ACT) + ACT) % ACT);
const calmOf = (m, a, cur) => clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine || cur ? 0 : 1) * (m.hp > 0 ? 1 : 0), 0, 1);
const napOf = (m, a) => m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0) && m.hp > 0;

// =====================================================================================================
// A. PINSWORTH, the pincushion duellist (veggie base)
// A plump crimson velvet tomato pincushion with a felt calyx, a china thimble worn cocked over one
// eye like a musketeer's hat, pearl pins stuck in its back, a little strawberry emery dangling from
// its side, and a long silver sewing needle for a rapier, a moonlit thread trailing from its eye.
// Dashing, vain, theatrical: everything is a duel, every duel ends in a bow.
// =====================================================================================================
const PW = {
  lt: '#ff9fae', base: '#e24a62', sh: '#bb3350', deep: '#8f2443', ink: '#7c2244',
  seam: '#f3c25a', seamSh: '#b98a2e',
  felt: { lt: '#c4e696', base: '#83c25e', sh: '#62a24a', deep: '#4b8341', rib: '#5d9a47', stem: '#6fae50' },
  leg: { lt: '#d0566e', base: '#a8304e', sh: '#86243f', deep: '#6a1d34' },
  gold: '#f2c14e', goldLt: '#fff0b8', goldSh: '#c08f2a',
  china: '#fdfaf6', chinaSh: '#dcd3e6', chinaDeep: '#b9aecb', rose: '#f58aa3', roseLt: '#ffd0dc', leaf: '#7cbf6a',
  steel: '#f2f5fc', steelSh: '#b6bfd6', steelDeep: '#8a94b2',
  thread: '#c9b2ff', threadLt: '#ffffff',
  sclera: '#fff6ec', iris0: '#ffd766', iris1: '#e0812e', pupil: '#5a1a30', lid: '#6e1d3a', cheek: '#ff7f96', mouth: '#6a1a34', tongue: '#ff8fa6',
  pearls: ['#fffaf0', '#d6ebff', '#ffe0ec', '#fff0c4'],
  berry: '#ff6f86', berryLt: '#ffb0bf', berrySh: '#d84a66', cap: '#6fb85a',
  hanky: '#ffffff', hankySh: '#e4dcef', petal: '#ffb3c6', petalSh: '#f082a0',
};
// Its eyes: big rounded almonds with cream whites, a honey-gold iris with a wine pupil, a big soft
// glint up front and a small one low behind; a heavy wine upper lid ending in a rounded flick at the
// outer corner, a thin lower lid; gold thread brows that tell its mood.
function pwEye(ctx, a, K, x, y, k, f, far) {
  const rx = 2.0 * k;
  const ry = 2.35;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const shut = (draw) => {
    ctx.strokeStyle = K.colour(a, PW.lid);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    draw();
    ctx.stroke();
  };
  if (f === 'blink' || f === 'sleep') {
    return shut(() => {
      ctx.moveTo(x - rx, y + 0.2);
      ctx.quadraticCurveTo(x, y + 1.3, x + rx, y + 0.1);
      // (the flick of its lashes at the outer corner)
      ctx.moveTo(x - rx, y + 0.2);
      ctx.quadraticCurveTo(x - rx - 0.5, y + 0.1, x - rx - 0.7, y - 0.4);
    });
  }
  if (f === 'happy' || f === 'proud') {
    shut(() => {
      ctx.moveTo(x - rx, y + 0.5);
      ctx.quadraticCurveTo(x, y - 1.5, x + rx, y + 0.5);
    });
    if (f === 'proud' && !far) {
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, x + rx * 0.9, y - 1.8, 0.75);
    }
    return;
  }
  if (f === 'hurt') {
    return shut(() => {
      ctx.moveTo(x - rx * 0.9, y - 1.1);
      ctx.quadraticCurveTo(x + rx * 0.2, y - 0.1, x + rx * 0.8, y);
      ctx.quadraticCurveTo(x + rx * 0.2, y + 0.1, x - rx * 0.9, y + 1.1);
    });
  }
  if (f === 'dead') {
    // (dizzy: a soft wavy line, like a loose thread)
    return shut(() => {
      ctx.moveTo(x - rx, y);
      ctx.bezierCurveTo(x - rx * 0.4, y - 1.1, x + rx * 0.1, y + 1.1, x + rx * 0.6, y);
      ctx.quadraticCurveTo(x + rx * 0.85, y - 0.5, x + rx, y - 0.2);
    });
  }
  // the almond (a rounded lemon: fuller on top), its white
  const lidDrop = f === 'focus' ? 0.32 : f === 'smug' ? 0.48 : 0;
  const almond = () => {
    ctx.beginPath();
    ctx.moveTo(x - rx, y + 0.15);
    ctx.bezierCurveTo(x - rx * 0.7, y - ry * 1.05, x + rx * 0.75, y - ry * 1.05, x + rx, y - 0.1);
    ctx.bezierCurveTo(x + rx * 0.7, y + ry * 0.95, x - rx * 0.65, y + ry * 0.95, x - rx, y + 0.15);
    ctx.closePath();
  };
  almond();
  ctx.fillStyle = K.colour(a, PW.sclera);
  ctx.fill();
  ctx.save();
  almond();
  ctx.clip();
  const ix = x + rx * 0.22;
  const iy = y + 0.1;
  const ir = 1.75 * Math.min(1, k + 0.15);
  const g = ctx.createLinearGradient(ix, iy - ir, ix, iy + ir);
  g.addColorStop(0, K.colour(a, PW.iris1));
  g.addColorStop(0.55, K.colour(a, PW.iris0));
  g.addColorStop(1, K.colour(a, '#ffe9a6'));
  ell(ctx, ix, iy, ir * 0.92, ir * 1.02);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, ix + 0.1, iy + 0.1, ir * 0.42, ir * 0.55);
  ctx.fillStyle = K.colour(a, PW.pupil);
  ctx.fill();
  // (the lid's soft shade on the white)
  ell(ctx, x, y - ry * 0.95, rx * 1.2, 0.9);
  ctx.fillStyle = K.tint(a, PW.deep, 0.22);
  ctx.fill();
  // a lowered lid when it means business (or is being smug)
  if (lidDrop > 0) {
    ctx.fillStyle = K.colour(a, PW.base);
    ctx.fillRect(x - rx - 1, y - ry - 1, rx * 2 + 2, 1 + ry * (0.25 + lidDrop * 1.6));
  }
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix + ir * 0.42, iy - ir * 0.5 + lidDrop * 1.2, 0.62 * k + 0.12, 0.5);
  ctx.fill();
  ell(ctx, ix - ir * 0.45, iy + ir * 0.5, 0.26, 0.26);
  ctx.fill();
  ctx.restore();
  // the upper lid: a heavy rounded line with a flick at the outer corner; the lower: thin and short
  const top = y - ry * (0.78 - lidDrop * 0.9);
  ctx.strokeStyle = K.colour(a, PW.lid);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x + rx * 1.02, y - 0.15);
  ctx.quadraticCurveTo(x + rx * 0.3, top - 0.55, x - rx * 0.75, top + 0.2);
  ctx.quadraticCurveTo(x - rx * 1.15, top + 0.6, x - rx * 1.35, top - 0.15);
  ctx.stroke();
  ctx.lineWidth = 0.32;
  ctx.strokeStyle = K.tint(a, PW.lid, 0.7);
  ctx.beginPath();
  ctx.moveTo(x - rx * 0.55, y + ry * 0.72);
  ctx.quadraticCurveTo(x + rx * 0.1, y + ry * 0.98, x + rx * 0.7, y + ry * 0.55);
  ctx.stroke();
}
function pwBrow(ctx, a, K, x, y, k, lift, tilt) {
  ctx.strokeStyle = K.colour(a, PW.goldSh);
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x - 1.7 * k, y - lift + tilt * 0.6);
  ctx.quadraticCurveTo(x, y - 0.8 - lift, x + 1.5 * k, y - lift - tilt * 0.6);
  ctx.stroke();
  ctx.strokeStyle = K.colour(a, PW.gold);
  ctx.lineWidth = 0.68;
  ctx.stroke();
}
// The moustache: two soft gold-thread curls from under its nose, curling up; `tw` twirls the near
// one up tighter, `fl` flutters them (a snore, a huff).
function pwStache(ctx, a, K, x, y, tw, fl) {
  // a soft handlebar: plump in the middle, swooping out each way and curling up at its tips
  const half = (dir, k, lift) => {
    ctx.beginPath();
    ctx.moveTo(x, y - 0.55);
    ctx.bezierCurveTo(x + dir * 1.2 * k, y - 0.9, x + dir * 2.2 * k, y + 0.2, x + dir * 3.0 * k, y - 0.4 - lift);
    ctx.bezierCurveTo(x + dir * 3.6 * k, y - 0.9 - lift, x + dir * 3.5 * k, y - 1.9 - lift, x + dir * 2.8 * k, y - 1.7 - lift);
    ctx.bezierCurveTo(x + dir * 3.3 * k, y - 1.2 - lift, x + dir * 3.0 * k, y - 0.6 - lift, x + dir * 2.6 * k, y + 0.5 - lift * 0.3);
    ctx.bezierCurveTo(x + dir * 1.8 * k, y + 1.3, x + dir * 0.8 * k, y + 1.0, x, y + 0.7);
    ctx.closePath();
  };
  for (const [dir, k, lift] of [[-1, 0.85, fl * 0.4], [1, 1.2, tw * 0.9 + fl * 0.4]]) {
    half(dir, k, lift);
    ctx.fillStyle = K.colour(a, PW.goldSh);
    ctx.fill();
    ctx.save();
    half(dir, k, lift);
    ctx.clip();
    ell(ctx, x + dir * 1.4 * k, y - 0.4, 1.9 * k, 0.75);
    ctx.fillStyle = K.colour(a, PW.gold);
    ctx.fill();
    ell(ctx, x + dir * 1.1 * k, y - 0.55, 0.9 * k, 0.25);
    ctx.fillStyle = K.tint(a, PW.goldLt, 0.9);
    ctx.fill();
    ctx.restore();
  }
}
const FACE_K = 1.32;
function pwFace(ctx, a, bk, K) {
  const F = K.P.face;
  K.frameAt(ctx, a, F.y);
  const lk = clamp(bk.look ?? 0, -1.2, 1.2);
  ctx.translate(F.x + lk * 0.5 - 0.4, F.y + 1.4);
  // (drawn a size up, so its face reads at the game's own zoom)
  ctx.scale(FACE_K, FACE_K);
  const pw = a.pw ?? {};
  let f = pw.face ?? 'open';
  if (f === 'open' && ((a.t ?? 0) + 0.6) % 4.3 < 0.12) f = 'blink';
  // cheeks
  for (const [cx, cy, r] of [[1.2, 3.0, 1.5], [-4.9, 2.6, 1.0]]) {
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, K.tint(a, PW.cheek, 0.75));
    g.addColorStop(1, K.tint(a, PW.cheek, 0));
    ctx.fillStyle = g;
    ell(ctx, cx, cy, r * 1.2, r * 0.8);
    ctx.fill();
  }
  const fe = f === 'wince' ? 'hurt' : f;
  pwEye(ctx, a, K, -4.4, -0.7, 0.7, f === 'wince' ? 'open' : fe, true);
  pwEye(ctx, a, K, 0.9, -0.6, 1, fe, false);
  const smug = pw.brow ?? (f === 'smug' ? 1 : 0);
  const fierce = f === 'focus' ? 1 : 0;
  pwBrow(ctx, a, K, -4.5, -3.9, 0.7, smug * 0.2 - fierce * 0.2, fierce * 0.9);
  pwBrow(ctx, a, K, 1.0, -3.9 - (f === 'happy' || f === 'proud' ? 0.5 : 0), 1, smug * 1.1 - fierce * 0.3, fierce * 1.3 - smug * 0.5);
  // the mouth under the moustache
  const open = clamp(pw.open ?? 0, 0, 1);
  const mx = -1.4;
  const my = 4.6;
  ctx.lineCap = 'round';
  if (open > 0.1) {
    ell(ctx, mx, my + 0.2, 0.8 + open * 0.5, 0.45 + open * 0.75);
    ctx.fillStyle = K.colour(a, PW.mouth);
    ctx.fill();
    ell(ctx, mx, my + 0.4 + open * 0.4, 0.5 + open * 0.25, 0.3 + open * 0.25);
    ctx.fillStyle = K.colour(a, PW.tongue);
    ctx.fill();
  } else {
    ctx.strokeStyle = K.colour(a, PW.mouth);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    if (f === 'hurt' || f === 'dead') {
      ctx.moveTo(mx - 0.9, my + 0.5);
      ctx.quadraticCurveTo(mx, my - 0.2, mx + 0.9, my + 0.5);
    } else {
      // (a little one-sided smirk)
      ctx.moveTo(mx - 0.9, my);
      ctx.quadraticCurveTo(mx, my + 0.8, mx + 1.1, my - 0.25);
    }
    ctx.stroke();
  }
  pwStache(ctx, a, K, -1.5, 2.9, a.S?.stache ?? 0, pw.flutter ?? 0);
}
// Its velvet: gold cord seams curving round it from the top (tomato pincushion panels), a soft sheen
function pwPaint(ctx, a, bk, K) {
  ctx.lineCap = 'round';
  for (const [x0, bow, al] of [[-7.6, -2.2, 0.5], [-1.6, -0.6, 0.75]]) {
    const q = [[x0 * 0.25, -19.4], [x0 + bow, -10], [x0 * 0.5, -0.4]].map((p) => K.at(a, p));
    ctx.beginPath();
    ctx.moveTo(...q[0]);
    ctx.quadraticCurveTo(...q[1], ...q[2]);
    ctx.strokeStyle = K.tint(a, PW.deep, 0.35 * al);
    ctx.lineWidth = 1.3;
    ctx.stroke();
    ctx.strokeStyle = K.tint(a, PW.seam, 0.6 * al);
    ctx.lineWidth = 0.4;
    ctx.stroke();
  }
  // (a velvet sheen up front)
  K.blob(ctx, a, '#ffd0d8', K.at(a, [4.5, -15]), 4.5, 3, bk.ang - 0.5, 0.35);
}
// Pearl pins stuck in its back (drawn under the body, so only what pokes out shows); they rattle
// when it's hit and when it lands.
const PINS = [[-8.0, -14.0, -138, 5.6, 0], [-3.4, -17.2, -106, 5.4, 1], [-10.0, -8.6, -170, 5.2, 2], [-6.4, -4.6, 160, 4.4, 3]];
function pwPins(ctx, a, mode, K) {
  const st = a.mo.rig;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const bk = a.bk;
  const hit = (a.hurtAgo ?? 9) < 0.06 ? 1 : 0;
  PINS.forEach(([x, y, deg, len, c], i) => {
    const s = (st[`pwPin${i}`] ??= { x: 0, v: 0 });
    if (mode === 'line') {
      if (hit && !s.kicked) s.v += (i % 2 ? 7 : -7);
      s.kicked = hit;
      spr(s, 0, 520, 26, 0, dt);
      s.x = clamp(s.x, -0.6, 0.6);
    }
    const out = (i === 1 ? a.S?.pinOut ?? 0 : 0) * 2.2;
    const th = bk.ang + (deg * D2R) + s.x * 0.35;
    const root = K.at(a, [x, y]);
    const tip = [root[0] + Math.cos(th) * (len + out), root[1] + Math.sin(th) * (len + out)];
    ctx.beginPath();
    ctx.moveTo(...root);
    ctx.lineTo(...tip);
    ctx.lineCap = 'round';
    if (mode === 'line') {
      ctx.strokeStyle = PW.ink;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ell(ctx, tip[0], tip[1], 1.25, 1.25);
      ctx.fillStyle = PW.ink;
      ctx.fill();
      return;
    }
    ctx.strokeStyle = K.colour(a, PW.steelSh);
    ctx.lineWidth = 0.55;
    ctx.stroke();
    const g = ctx.createRadialGradient(tip[0] - 0.4, tip[1] - 0.4, 0.1, tip[0], tip[1], 1.2);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, K.colour(a, PW.pearls[c]));
    g.addColorStop(1, K.colour(a, '#c8b8de'));
    ell(ctx, tip[0], tip[1], 1.1, 1.1);
    ctx.fillStyle = g;
    ctx.fill();
  });
}
// The strawberry emery on a ribbon from its back, swinging on a spring (drawn under the body).
function pwBerry(ctx, a, mode, K) {
  const st = a.mo.rig;
  const bk = a.bk;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const root = K.at(a, [-9.6, -6.2]);
  const m = a.vgM ?? {};
  const sx = a.flip ? -1 : 1;
  const acc = K.feel(st, 'pwBerryF', [root[0] + sx * (m.x ?? 0), root[1] + (m.y ?? 0)], dt, a.flip);
  const s = (st.pwBerry ??= { x: Math.PI / 2 + 0.3, v: 0 });
  // (hanging straight down from where it's tied, nudged back, pushed about by every move)
  const goal = Math.PI / 2 + 0.35 + (a.S?.berry ?? 0);
  const th = mode === 'line' ? clamp(spr(s, goal, 70, 8.5, K.shove(s.x, acc, 0.06) * 9, dt), goal - 1.0, goal + 1.0) : s.x;
  if (mode === 'line') s.x = th;
  const L = 4.6;
  const c = [root[0] + Math.cos(th) * L, root[1] + Math.sin(th) * L];
  const lean = th - Math.PI / 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(...root);
  ctx.quadraticCurveTo(root[0] + Math.cos(th) * L * 0.5 - 0.6, root[1] + Math.sin(th) * L * 0.5, c[0], c[1] - 0.6);
  if (mode === 'line') {
    ctx.strokeStyle = PW.ink;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  } else {
    ctx.strokeStyle = K.colour(a, PW.cap);
    ctx.lineWidth = 0.55;
    ctx.stroke();
  }
  const berry = () => {
    ctx.save();
    ctx.translate(c[0], c[1]);
    ctx.rotate(lean);
    ctx.beginPath();
    ctx.moveTo(0, 0.1);
    ctx.bezierCurveTo(2.3, -0.2, 2.2, 2.9, 0, 4.0);
    ctx.bezierCurveTo(-2.2, 2.9, -2.3, -0.2, 0, 0.1);
    ctx.restore();
  };
  berry();
  if (mode === 'line') {
    ctx.strokeStyle = PW.ink;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    return;
  }
  ctx.fillStyle = K.colour(a, PW.berry);
  ctx.fill();
  ctx.save();
  ctx.translate(c[0], c[1]);
  ctx.rotate(lean);
  ell(ctx, -0.6, 1.4, 0.7, 1.0);
  ctx.fillStyle = K.tint(a, PW.berryLt, 0.8);
  ctx.fill();
  ctx.fillStyle = K.tint(a, '#fff3c0', 0.9);
  for (const [x, y] of [[0.8, 1.6], [-0.2, 2.6], [0.9, 2.9]]) {
    ell(ctx, x, y, 0.2, 0.3);
    ctx.fill();
  }
  ctx.fillStyle = K.colour(a, PW.cap);
  for (const r of [-0.9, 0, 0.9]) {
    ell(ctx, Math.sin(r) * 1.1, 0.4, 0.55, 1.0, r);
    ctx.fill();
  }
  ctx.restore();
}
// The china thimble: a white porcelain thimble with a gold rim, rows of dimples and a painted rosebud,
// cocked forward over one eye on its own spring; slid down over its eyes for a nap; knocked off
// when it's beaten (then lying on the ground beside it).
const pwThimbleShape = (ctx) => {
  ctx.beginPath();
  ctx.moveTo(-3.6, 0);
  ctx.lineTo(-3.05, -5.0);
  ctx.bezierCurveTo(-2.9, -7.6, 2.9, -7.6, 3.05, -5.0);
  ctx.lineTo(3.6, 0);
  ctx.quadraticCurveTo(0, 0.9, -3.6, 0);
  ctx.closePath();
};
function pwThimbleAt(ctx, a, K, mode) {
  pwThimbleShape(ctx);
  if (mode === 'line') {
    ctx.strokeStyle = PW.ink;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  ctx.fillStyle = K.colour(a, PW.china);
  ctx.fill();
  ctx.save();
  pwThimbleShape(ctx);
  ctx.clip();
  // shade round its far side, a soft light down its near side
  const g = ctx.createLinearGradient(-4, 0, 4, 0);
  g.addColorStop(0, K.tint(a, PW.chinaSh, 0.9));
  g.addColorStop(0.45, K.tint(a, PW.china, 0));
  g.addColorStop(0.8, K.tint(a, PW.chinaSh, 0.25));
  g.addColorStop(1, K.tint(a, PW.chinaDeep, 0.7));
  ctx.fillStyle = g;
  ctx.fillRect(-5, -8, 10, 9);
  // dimples, in staggered rows, a soft shade each with a light below
  for (let r = 0; r < 3; r++) {
    const y = -3.0 - r * 1.2;
    const half = 2.6 - r * 0.35;
    for (let x = -half + (r % 2) * 0.55; x <= half; x += 1.1) {
      ell(ctx, x, y, 0.3, 0.26);
      ctx.fillStyle = K.tint(a, PW.chinaDeep, 0.38 * (1 - Math.abs(x) / 4.5));
      ctx.fill();
    }
  }
  // a painted rosebud and its leaf
  ell(ctx, 1.9, -2.2, 0.7, 0.4, -0.5);
  ctx.fillStyle = K.colour(a, PW.leaf);
  ctx.fill();
  ell(ctx, 1.3, -2.5, 0.75, 0.7);
  ctx.fillStyle = K.colour(a, PW.rose);
  ctx.fill();
  ell(ctx, 1.15, -2.7, 0.35, 0.3);
  ctx.fillStyle = K.colour(a, PW.roseLt);
  ctx.fill();
  // the gold rim
  ctx.beginPath();
  ctx.moveTo(-3.7, 0.05);
  ctx.lineTo(-3.5, -1.2);
  ctx.quadraticCurveTo(0, -0.4, 3.5, -1.2);
  ctx.lineTo(3.7, 0.05);
  ctx.quadraticCurveTo(0, 0.95, -3.7, 0.05);
  ctx.fillStyle = K.colour(a, PW.gold);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3.6, -0.75);
  ctx.quadraticCurveTo(-1, -0.4, 1.2, -0.5);
  ctx.strokeStyle = K.tint(a, PW.goldLt, 0.9);
  ctx.lineWidth = 0.35;
  ctx.stroke();
  // the glaze's light
  ell(ctx, -1.6, -3.6, 0.6, 2.0, 0.08);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ctx.restore();
}
function pwThimble(ctx, a, mode, K) {
  const bk = a.bk;
  const st = a.mo.rig;
  if (a.pw?.thimbleOff) return;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const base = K.at(a, [0.2, -19.2]);
  const m = a.vgM ?? {};
  const sx = a.flip ? -1 : 1;
  const acc = K.feel(st, 'pwThF', [base[0] + sx * (m.x ?? 0), base[1] + (m.y ?? 0)], dt, a.flip);
  const s = (st.pwTh ??= { x: 0, v: 0 });
  const goal = (9 + (a.S?.tilt ?? 0)) * D2R;
  const tilt = mode === 'line' ? clamp(spr(s, goal, 300, 26, K.shove(bk.topAng - Math.PI / 2, acc, 0.12) * 9, dt), goal - 0.45, goal + 0.45) : s.x;
  if (mode === 'line') s.x = tilt;
  const slide = clamp(a.S?.slide ?? 0, 0, 1.2);
  // (where it sits, so a knock that sends it flying starts from right there)
  if (mode === 'line') st.pwThAt = { base, ang: bk.topAng + tilt, slide, flip: a.flip };
  ctx.translate(...base);
  ctx.rotate(bk.topAng + tilt);
  ctx.translate(0.4, slide * 8.4);
  pwThimbleAt(ctx, a, K, mode);
}
// The needle: held in its near nub, a long tapering silver needle, its eye behind its hand with the
// moonlit thread through it, trailing.
function pwNeedleGeo(a) {
  const A = a.bk?.arms?.N;
  if (!A) return null;
  const th = A.th + (a.S?.nd ?? 0) * D2R;
  const d = [Math.cos(th), Math.sin(th)];
  const hand = add(A.Hd, [d[0] * -0.2, d[1] * -0.2]);
  return { th, d, hand, eye: add(hand, [-d[0] * 2.6, -d[1] * 2.6]), tip: add(hand, [d[0] * 13, d[1] * 13]) };
}
function pwNeedle(ctx, a, mode, K) {
  const N = pwNeedleGeo(a);
  if (!N) return;
  const { th, d, eye, tip } = N;
  const n = [-d[1], d[0]];
  const shape = () => {
    ctx.beginPath();
    const b0 = add(eye, [-d[0] * 0.7, -d[1] * 0.7]);
    ctx.moveTo(b0[0] + n[0] * 0.7, b0[1] + n[1] * 0.7);
    ctx.lineTo(tip[0] + n[0] * 0.08, tip[1] + n[1] * 0.08);
    ctx.lineTo(tip[0] - n[0] * 0.08, tip[1] - n[1] * 0.08);
    ctx.lineTo(b0[0] - n[0] * 0.7, b0[1] - n[1] * 0.7);
    ctx.arc(b0[0], b0[1], 0.7, th + Math.PI / 2, th + Math.PI * 1.5);
    ctx.closePath();
  };
  shape();
  if (mode === 'line') {
    ctx.strokeStyle = PW.ink;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = 'round';
    ctx.stroke();
    return;
  }
  const g = ctx.createLinearGradient(eye[0] + n[0] * 0.7, eye[1] + n[1] * 0.7, eye[0] - n[0] * 0.7, eye[1] - n[1] * 0.7);
  g.addColorStop(0, K.colour(a, PW.steel));
  g.addColorStop(0.6, K.colour(a, PW.steelSh));
  g.addColorStop(1, K.colour(a, PW.steelDeep));
  ctx.fillStyle = g;
  ctx.fill();
  // the eye: a little slot
  ell(ctx, eye[0], eye[1], 0.75, 0.22, th);
  ctx.fillStyle = K.colour(a, PW.steelDeep);
  ctx.fill();
  // a glint running along it
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 0.22;
  ctx.beginPath();
  const g0 = add(eye, [d[0] * 2 + n[0] * 0.25, d[1] * 2 + n[1] * 0.25]);
  ctx.moveTo(...g0);
  ctx.lineTo(...add(g0, [d[0] * 6, d[1] * 6]));
  ctx.stroke();
}
function pwThread(ctx, a, mode, K) {
  if (mode !== 'fill') return;
  const N = pwNeedleGeo(a);
  if (!N) return;
  const pts = threadSim(a.mo.rig, 'pwThread', N.eye, a.vgM ?? {}, a, 8, 1.45, 46);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  smoothLine(ctx, pts);
  ctx.strokeStyle = K.tint(a, '#8f72c8', 0.55);
  ctx.lineWidth = 0.75;
  ctx.stroke();
  smoothLine(ctx, pts);
  ctx.strokeStyle = K.colour(a, PW.thread);
  ctx.lineWidth = 0.42;
  ctx.stroke();
  // (a soft moonlit shimmer travelling along it)
  // (gliding along the thread between its points, not hopping from one to the next, 2026-11-26)
  const k = ((a.t ?? 0) * 0.7) % 1;
  const f = k * (pts.length - 1);
  const j = Math.min(pts.length - 2, Math.floor(f));
  const u = f - j;
  const p = [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * u, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * u];
  ctx.globalAlpha = Math.sin(Math.PI * k) * 0.9;
  ctx.fillStyle = '#ffffff';
  sparkle(ctx, p[0], p[1], 0.55);
  ctx.globalAlpha = 1;
}
// (the needle held up on guard: its moves key `nd` as the angle they want, eased from this)
const ND_GUARD = 98;
const PW_MOVES = {
  // The lunge: drawn back into a fencer's crouch, back nub raised in a curl behind, then a long
  // lunge along the ground, the needle's point flashing on the target; a beat held, back on guard.
  lunge: {
    anticT: 0.32,
    keys: [
      [0, { crouch: 0.55, lean: -14, bend: -5, x: -1.6, armN: 40, armF: 150, nd: -95, look: 0.1, tilt: -6 }],
      [0.08, { crouch: 0.25, lean: 18, bend: 7, x: 8.5, armN: 96, armF: 165, nd: -20, tuck: 0.2, tilt: 8 }, 'out'],
      [0.2, { crouch: 0.3, lean: 15, bend: 5, x: 8.8, armN: 94, armF: 160, nd: -18 }, 'io'],
      [0.42, { crouch: 0.2, lean: 2, x: 2.5, armN: 70, armF: 130, nd: -30 }, 'io'],
      [0.7, {}, 'io'],
    ],
  },
  // Pin-prick flurry: three quick jabs stepping in, the point a blur.
  flurry: {
    anticT: 0.26,
    keys: [
      [0, { crouch: 0.4, lean: -8, armN: 55, armF: 140, nd: -25, x: -0.8 }],
      [0.06, { lean: 12, armN: 96, nd: -16, x: 3, crouch: 0.2 }, 'out'],
      [0.13, { lean: 4, armN: 64, nd: -12, x: 3.4 }, 'io'],
      [0.19, { lean: 14, armN: 98, nd: -14, x: 5.2 }, 'out'],
      [0.26, { lean: 4, armN: 62, nd: -12, x: 5.4 }, 'io'],
      [0.32, { lean: 16, armN: 100, nd: -12, x: 7.2, crouch: 0.25 }, 'out'],
      [0.5, { lean: 6, armN: 80, nd: -10, x: 4 }, 'io'],
      [0.8, {}, 'io'],
    ],
  },
  // The flourish cut: needle swept up over its head, then brought down in a big arc, the thread
  // lashing round after it.
  cut: {
    anticT: 0.3,
    keys: [
      [0, { lean: -12, bend: -6, armN: 175, armF: 40, nd: 30, hop: 0.4, tilt: -10 }],
      [0.09, { lean: 16, bend: 8, armN: 40, armF: 150, nd: 20, x: 4.5, hop: 1.2, tuck: 0.4 }, 'out'],
      [0.18, { lean: 10, bend: 4, armN: 30, nd: 10, x: 5, hop: 0, tuck: 0, crouch: 0.35 }, 'in'],
      [0.46, { lean: 0, armN: 60, nd: -35, x: 1.5, crouch: 0 }, 'io'],
      [0.75, {}, 'io'],
    ],
  },
  hurt: {
    anticT: 0,
    keys: [
      [0, {}],
      [0.05, { x: -1.4, lean: -16, bend: -8, crouch: 0.3, armN: 70, armF: 120, nd: -60, tilt: -18, mouth: 0.4 }, 'out'],
      [0.24, { x: -1.4, lean: -9, bend: -4, crouch: 0.2, armN: 50, armF: 90, nd: -45, tilt: -8 }, 'io'],
      [0.6, {}, 'io'],
    ],
  },
  // pleased: the needle twirled up in a salute, a little hop
  cheer: {
    anticT: 0.12,
    keys: [
      [0, { crouch: 0.35 }],
      [0.14, { hop: 2.6, tuck: 0.6, armN: 160, armF: 150, nd: -10, tilt: -10 }, 'out'],
      [0.3, { hop: 0, tuck: 0, crouch: 0.3, armN: 150, armF: 130 }, 'in'],
      [0.8, {}, 'io'],
    ],
  },
};
for (const mv of Object.values(PW_MOVES)) for (const [, k] of mv.keys) if ('nd' in k) k.nd += ND_GUARD;
function pwPose(m, a, out, K, cur) {
  const pw = (a.pw = { face: 'open', open: 0, spark: [], petal: null, swish: -1, flutter: 0, eep: -1 });
  // on guard by default: the needle held up and forward, the back nub raised a little behind
  out.nd = (out.nd ?? 0) - ND_GUARD;
  if (!cur) {
    out.armF = Math.max(out.armF, 60 * (1 - (a.walkW ?? 0)));
  }
  const name = cur?.name;
  if (name === 'hurt') pw.face = 'hurt';
  else if (name === 'cheer') pw.face = 'proud';
  else if (cur) {
    pw.face = cur.t < 0 ? 'focus' : cur.t < 0.3 ? 'focus' : 'smug';
    pw.open = cur.t > 0 && cur.t < 0.2 ? 0.7 : 0;
  }
  if (cur || m.hp <= 0 || napOf(m, a)) return;
  const calm = calmOf(m, a, cur);
  if (calm < 0.02) return;
  const lu = actClock(a);
  pw.lu = lu;
  const say = (f, w) => {
    if (w > 0.4) pw.face = f;
  };
  // 1. the salute: the needle raised straight up before its face, eyes shut proudly; then a swish
  //    down and round, the thread trailing a sparkle, and back on guard
  const sal = win(lu, 1.0, 1.5, 3.0, 3.3) * calm;
  go(out, { armN: 150, nd: -62, lean: -4, armF: 20 }, sal);
  say('proud', sal);
  const sw = win(lu, 3.2, 3.45, 3.7, 4.2) * calm;
  go(out, { armN: 40, nd: 40, lean: 8, bend: 4, armF: 150 }, sw);
  pw.swish = span(lu, 3.25, 0.7);
  // 2. the moustache: its nub up to its face, twirling the curl, one brow raised, smug
  const tw = win(lu, 6.5, 7.0, 9.2, 9.7) * calm;
  go(out, { armN: 128, nd: -150, lean: -3 }, tw);
  out.armN += tw * Math.sin(lu * 9) * 6;
  out.stache = (out.stache ?? 0) + tw * (0.6 + 0.4 * Math.sin(lu * 9));
  say('smug', tw);
  if (lu > 9.0 && lu < 9.8) pw.spark.push(['stache', (lu - 9.0) / 0.8]);
  // 3. a loose pin: one slides out of its back with a wobble; a look back, a push back in (eep!),
  //    then a brave little nod
  const loose = win(lu, 12.0, 12.6, 14.4, 14.6) * calm;
  out.pinOut = (out.pinOut ?? 0) + loose * (1 + Math.sin(lu * 15) * 0.15);
  const look = win(lu, 12.8, 13.2, 14.8, 15.2) * calm;
  go(out, { look: -1, lean: -6, armF: 165 }, look);
  say('open', look);
  const eep = win(lu, 14.45, 14.55, 15.0, 15.3) * calm;
  say('wince', eep);
  pw.open = Math.max(pw.open, eep * 0.8);
  pw.eep = span(lu, 14.45, 0.9);
  out.hop = (out.hop ?? 0) + pulse(lu, 14.45, 0.3) * 1.4 * calm;
  const brave = win(lu, 15.4, 15.6, 16.2, 16.5) * calm;
  go(out, { lean: 6, armN: 70 }, brave);
  say('focus', brave);
  // 4. the petal: a rose petal drifts down; a quick lunge and it's skewered on the point; it's
  //    admired, then flicked away
  const petU = span(lu, 18.0, 2.0);
  const st = a.mo.rig;
  const atk = win(lu, 19.6, 19.75, 20.2, 20.6) * calm;
  go(out, { crouch: 0.3, lean: 16, bend: 6, x: 5, armN: 100, nd: -6, armF: 160 }, atk);
  say('focus', win(lu, 19.0, 19.3, 19.7, 19.8) * calm);
  const admire = win(lu, 20.4, 20.8, 22.6, 23.0) * calm;
  go(out, { armN: 140, nd: -55, look: -0.4, lean: -5, armF: 40 }, admire);
  say('happy', admire);
  const flick = win(lu, 22.8, 22.95, 23.1, 23.5) * calm;
  go(out, { armN: 60, nd: 30 }, flick);
  if (petU >= 0) pw.petal = { fall: petU };
  if (lu >= 19.75 && lu < 23.0) pw.petal = { on: 1 };
  if (lu >= 23.0 && lu < 24.4) pw.petal = { off: (lu - 23.0) / 1.4 };
  if (lu >= 19.75 && lu < 20.3) pw.spark.push(['tip', (lu - 19.75) / 0.55]);
  st.pwPetal = pw.petal;
  // 5. the bow: a deep courtly bow, needle swept out low, back nub up behind; up again, proud
  const bow = win(lu, 25.5, 26.2, 27.4, 28.1) * calm;
  go(out, { lean: 34, bend: 10, crouch: 0.3, armN: 20, nd: 50, armF: 140, tilt: 10, look: 0.3 }, bow);
  say('blink', bow);
  const up = win(lu, 28.0, 28.2, 28.8, 29.2) * calm;
  say('proud', up);
}
function pwAfter(m, a, out, K, cur, pose) {
  const pw = a.pw;
  if (pose === 'sleep') {
    // napping: sat back, the thimble slid down over its eyes, needle across its lap, moustache
    // fluttering with each snore
    const b = Math.sin((a.t ?? 0) * 0.95);
    Object.assign(out, { slide: 1, armN: 30, nd: 25, armF: 18, tilt: 2, lean: -10 + b * 2 });
    pw.face = 'sleep';
    pw.flutter = Math.max(0, b);
    pw.open = 0.15 + Math.max(0, b) * 0.2;
  }
  const st = a.mo.rig;
  if (m.hp <= 0) {
    // beaten: flat on its back, the thimble knocked off (it flies off its head in an arc and rolls to a
    // stop beside it), a white hanky unfurling on the needle's point, waved up: "I yield!"
    Object.assign(out, { armN: 150, nd: 70, armF: 120, slide: 0, tilt: 0 });
    pw.face = 'dead';
    pw.thimbleOff = 1;
    if (!st.pwOff) {
      const from = st.pwThAt ?? { base: K.at(a, [0.2, -19.2]), ang: a.bk?.topAng ?? 0, slide: 0, flip: a.flip };
      st.pwOff = { at: a.now ?? 0, from: { ...from, base: [...from.base] } };
    }
    pw.off = st.pwOff;
    pw.hanky = sstep(((a.now ?? 0) - st.pwOff.at - 0.3) / 0.55);
  } else st.pwOff = null;
}
function pwFx(ctx, m, a, S, K) {
  const pw = a.pw;
  const bk = a.bk;
  if (!pw || !bk) return;
  const N = pwNeedleGeo(a);
  const top = K.at(a, [0, -26]);
  ctx.lineCap = 'round';
  // the salute's swish: a soft silver arc
  if (pw.swish >= 0 && N) {
    const v = pw.swish;
    ctx.globalAlpha = Math.sin(Math.PI * v) * 0.85;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    const c = N.hand;
    ctx.arc(c[0], c[1], 11, -1.4 + v * 1.2, -0.2 + v * 1.9);
    ctx.stroke();
    ctx.strokeStyle = PW.thread;
    ctx.lineWidth = 0.4;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // the petal
  const P = pw.petal;
  if (P && N) {
    let p;
    let r = 0;
    let al = 1;
    if (P.fall !== undefined) {
      const v = P.fall;
      p = [N.tip[0] + 1 + Math.sin(v * 9) * 2.4, N.tip[1] - 22 + v * 22];
      r = Math.sin(v * 7) * 0.8;
    } else if (P.on) {
      p = add(N.tip, [-N.d[0] * 1.6, -N.d[1] * 1.6]);
      r = N.th + 1.2;
    } else {
      const v = P.off;
      p = [N.tip[0] + v * 8, N.tip[1] - Math.sin(Math.PI * v) * 6 + v * 6];
      r = v * 5;
      al = 1 - v;
    }
    ctx.globalAlpha = al;
    ctx.save();
    ctx.translate(...p);
    ctx.rotate(r);
    ctx.beginPath();
    ctx.moveTo(0, -1.8);
    ctx.bezierCurveTo(1.8, -1.4, 1.6, 1.2, 0, 1.8);
    ctx.bezierCurveTo(-1.6, 1.2, -1.8, -1.4, 0, -1.8);
    ctx.fillStyle = PW.petal;
    ctx.fill();
    ctx.strokeStyle = PW.petalSh;
    ctx.lineWidth = 0.3;
    ctx.stroke();
    ell(ctx, -0.4, -0.4, 0.5, 0.8);
    ctx.fillStyle = '#ffe2ea';
    ctx.fill();
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  // sparkles
  // eep!: a little "!" popping up over its head (drawn the right way round whichever way it faces)
  if (pw.eep >= 0) {
    const v = pw.eep;
    const h = K.at(a, [-2, -25]);
    ctx.globalAlpha = Math.sin(Math.PI * clamp(v * 1.4, 0, 1));
    ctx.save();
    ctx.translate(h[0] - 5, h[1] - 2 - v * 2);
    if (a.flip) ctx.scale(-1, 1);
    ctx.rotate(-0.15);
    for (const [col, w] of [['#ffffff', 1.0], [PW.ink, 0]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(-0.9 - w, -3.2 - w);
      ctx.quadraticCurveTo(0, -3.8 - w * 1.2, 0.9 + w, -3.2 - w);
      ctx.lineTo(0.35 + w * 0.6, 0.2 + w * 0.5);
      ctx.quadraticCurveTo(0, 0.5 + w * 0.6, -0.35 - w * 0.6, 0.2 + w * 0.5);
      ctx.closePath();
      ctx.fill();
      ell(ctx, 0, 1.8, 0.6 + w * 0.6, 0.6 + w * 0.6);
      ctx.fill();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }
  for (const [w, u] of pw.spark) {
    const p = w === 'tip' && N ? N.tip : K.at(a, [K.P.face.x + 2, K.P.face.y + 2]);
    ctx.globalAlpha = Math.sin(Math.PI * u);
    ctx.fillStyle = '#ffffff';
    sparkle(ctx, p[0] + 1 + u * 1.5, p[1] - 1 - u * 2, 1.3);
    ctx.fillStyle = PW.gold;
    sparkle(ctx, p[0] - 1.5 - u, p[1] + 0.5 - u * 1.5, 0.8);
    ctx.globalAlpha = 1;
  }
  // the lunge / flurry / cut: a glint on the point and a quick "tink" where it lands
  const cur = a.vgMove;
  if (cur && N && ['lunge', 'flurry', 'cut'].includes(cur.name)) {
    const hits = cur.name === 'flurry' ? [0.06, 0.19, 0.32] : [cur.name === 'cut' ? 0.1 : 0.08];
    for (const h of hits) {
      const v = (cur.t - h) / 0.3;
      if (v < 0 || v > 1) continue;
      const p = N.tip;
      ctx.globalAlpha = 1 - v;
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, p[0] + 0.5, p[1], 2.2 * (1 - v * 0.5));
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(p[0], p[1], 1.5 + v * 4, -0.9, 0.9);
      ctx.stroke();
      ctx.fillStyle = PW.gold;
      sparkle(ctx, p[0] + 3 + v * 2, p[1] - 3 - v * 2, 0.9);
      ctx.globalAlpha = 1;
    }
    // the flourish cut's arc
    if (cur.name === 'cut' && cur.t > 0 && cur.t < 0.3) {
      const v = cur.t / 0.3;
      ctx.globalAlpha = 1 - v;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(N.hand[0], N.hand[1], 12, -1.6, -1.6 + 1.9 * Math.min(1, v * 2.5));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
  // beaten: the thimble lying on the ground beside it, rocking to a stop; the hanky on the needle
  if (pw.thimbleOff && pw.off) {
    // (from where it sat, up in an arc and down onto the ground ahead of it, turning onto its side; a
    // little rock as it settles)
    const { at, from } = pw.off;
    const tt = (a.now ?? 0) - at;
    const u = clamp(tt / 0.7, 0, 1);
    const e = sstep(u);
    const fb = from.flip === a.flip ? from.base : [-from.base[0], from.base[1]];
    const fa = from.flip === a.flip ? from.ang : -from.ang;
    const p0 = [fb[0] + Math.cos(fa + Math.PI / 2) * from.slide * 8.4, fb[1] + Math.sin(fa + Math.PI / 2) * from.slide * 8.4];
    const p1 = [fb[0] + 12, -3.6];
    const rock = tt > 0.7 ? Math.sin((tt - 0.7) * 9) * 0.14 * Math.exp(-(tt - 0.7) * 3) : 0;
    pw.offAt = [mix(p0[0], p1[0], u), mix(p0[1], p1[1], e) - Math.sin(Math.PI * u) * 7];
    ctx.save();
    ctx.translate(...pw.offAt);
    ctx.rotate(mix(fa, -1.62, e) + rock);
    pwThimbleAt(ctx, a, K, 'line');
    pwThimbleAt(ctx, a, K, 'fill');
    ctx.restore();
  }
  if (pw.hanky > 0.01 && N) {
    const p = N.tip;
    ctx.save();
    ctx.translate(...p);
    ctx.scale(pw.hanky, pw.hanky);
    ctx.translate(-p[0], -p[1]);
    const t = a.t ?? 0;
    const wv = Math.sin(t * 6) * 0.8;
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.bezierCurveTo(p[0] + 2, p[1] - 0.8 + wv, p[0] + 4, p[1] + 0.8 - wv, p[0] + 6, p[1] + wv * 0.6);
    ctx.lineTo(p[0] + 5.6, p[1] + 4.2 + wv * 0.6);
    ctx.bezierCurveTo(p[0] + 3.8, p[1] + 4.8 - wv, p[0] + 1.8, p[1] + 3.2 + wv, p[0] - 0.4, p[1] + 3.8);
    ctx.closePath();
    ctx.fillStyle = PW.hanky;
    ctx.fill();
    ctx.strokeStyle = '#c9bcdc';
    ctx.lineWidth = 0.4;
    ctx.stroke();
    ctx.strokeStyle = PW.rose;
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(p[0] + 0.6, p[1] + 3.2);
    ctx.lineTo(p[0] + 5, p[1] + 3.6 + wv * 0.5);
    ctx.stroke();
    ctx.restore();
  }
}
const look = {
  kind: 'root',
  ink: PW.ink,
  C: { lt: PW.lt, base: PW.base, sh: PW.sh, deep: PW.deep },
  CL: PW.felt,
  CLeg: PW.leg,
  CT: PW.felt,
  DIRT: { top: '#e9e2f2', clod: '#d9cfe6', crumb: '#f2eef8', dust: '#f6f3fb', dustEdge: '#ddd3ea' },
  P: {
    body: [[0, -19.2], [3.6, -20.2], [7.7, -18.6], [10.7, -14.8], [11.6, -10.0], [10.8, -5.4], [8.0, -1.8], [3.8, 0], [-0.4, 0.3], [-4.6, -0.1], [-8.6, -2.0], [-11.2, -5.6], [-11.8, -10.2], [-10.8, -14.8], [-7.8, -18.6], [-3.6, -20.2]],
    top: 20.2,
    hb: 3.2,
    hip: { N: [1.8, -2.0], F: [-1.4, -2.2] },
    foot: { N: 1.4, F: -1.2 },
    leg: { l1: 2.3, l2: 2.2, r: [2.0, 1.8, 1.6], foot: [2.6, 1.6] },
    arm: { N: [8.6, -8.8], F: [-8.8, -9.2], up: { N: [8.2, -13.2], F: [-8.4, -13.6] }, len: 4.6, r: [2.0, 1.7] },
    face: { x: 5.4, y: -11.6, h: 7 },
    crownH: 8,
    leaves: [
      { root: [-2.6, -19.4], rest: -78, stem: 0.4, len: 4.6, w: 3.4, curl: -22, tone: 'sh' },
      { root: [2.6, -19.6], rest: 74, stem: 0.4, len: 4.6, w: 3.4, curl: 22, tone: 'sh' },
      { root: [-1.4, -19.8], rest: -42, stem: 0.4, len: 4.4, w: 3.4, curl: -16, tone: 'base' },
      { root: [1.4, -19.8], rest: 40, stem: 0.4, len: 4.4, w: 3.4, curl: 16, tone: 'base' },
    ],
    tail: null,
    // (a brisk waddle: a step of each foot every 12 px, under three a second at its roaming 34)
    gait: { cycle: 12, duty: 0.58, bob: 0.55, rock: 3.4, swing: 14, lift: 1.5 },
    speed: 34,
    moves: ['lunge', 'flurry', 'cut'],
  },
  moves: PW_MOVES,
  channels: { nd: [260, 24], stache: [160, 16], slide: [120, 16], tilt: [200, 18], pinOut: [260, 20], berry: [80, 10] },
  quietIdle: ['stretch', 'sway', 'shake'],
  paint: pwPaint,
  face: pwFace,
  under: {
    body: (ctx, a, mode, K) => {
      pwPins(ctx, a, mode, K);
      pwBerry(ctx, a, mode, K);
      // (the thread trails behind the body: where it would cross its face, the body hides it)
      pwThread(ctx, a, mode, K);
    },
    armN: (ctx, a, mode, K) => pwNeedle(ctx, a, mode, K),
  },
  over: {
    leaves: (ctx, a, mode, K) => pwThimble(ctx, a, mode, K),
  },
  pose: pwPose,
  after: pwAfter,
  fx: pwFx,
};


export const PORCELAIN_DOLL = dressedVeggie(look);
// (`noHop`: none of the monster drawer's little happy hops or idle notes over it: a bounce on a sine's
// hard corner that popped all its sprung parts; it shows its moods in its own act, face and cheer)
PORCELAIN_DOLL.art.noHop = true;
// (its dress, for the dev tools that watch its parts frame by frame: tools/zz-porcelaindollprobe.mjs)
export const PORCELAIN_DOLL_LOOK = look;
