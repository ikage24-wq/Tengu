// Dame Rondo, the Tailcoat Penguin (2026-11-26, concept "A" for the Ballroom duo, "Black Tie & Bat
// Wings"): the lead. A stiff little penguin in her own tailcoat who counts every step out loud, proud,
// a stickler, pompous but sweet. She moves on her own copy of the bird base (penguinbase.js), grown
// from the owl's upright barrel into a penguin: a pear of a body, a big round head, stiff flippers,
// short legs on big webbed feet, never flying.
//   look    midnight navy (a deep blue with plum hints) back, head and flippers; a cream shirt front
//           with a soft shine; apricot-gold comma patches behind her cheeks; a rose-gold satin bow
//           tie at her throat (on a spring, it goes askew); a white carnation boutonniere; two soft
//           tailcoat tails from her rump (her own back feathers, each on its own spring, plum-lined);
//           white spats over little orange feet; two curled gold crest plumes over her brows that
//           act with them; a slim coral beak with a gold stripe along its lower half.
//   eyes    level almonds: a flat proud upper lid at half-mast, a chocolate iris, a rounded-square
//           glint and a tiny dot, a thin white eye-ring, a neat soft lower lid. Faces: proud (rest),
//           counting, judging (a side-eye), focus (casting), cross, happy (wide and bright), glee,
//           startled, smug (^ ^), sad, blink (her own rhythm), hurt (> <), beaten (soft swirls).
//   mouth   her beak: closed, a small "o" (counting), open, wide, a smile and a pout at the gape.
//   idle    standing tall, chest out, flippers a little back; her near foot taps the count, "1, 2,
//           3!", her beak counting with it, chin up on the three; a judging side-eye; her bow tie
//           slips askew, she notices, pats it straight with a flipper, very pleased with herself.
//   cast    Belly Slide (pose 'slide'): she crouches and leans in, flippers swept back, eyes
//           narrowed, counting "1... 2... 3!", her rump wiggling, the floor ahead starting to gleam;
//           the wind-up deepest at its end; at the release she's down on her belly sliding over the
//           polished floor (flat out, flippers back, feet kicked up behind, coat tails streaming), a
//           soft gold-white polish streak behind her and sparkles off the floor ahead.
// Everything here drawn from scratch (the face too). Text reads the right way round facing left.
import { dressedBird } from './penguinbase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const rot = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
// (a smooth closed shape through points: each span a curve through the midpoints, no corners)
function smooth(ctx, pts) {
  const n = pts.length;
  const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  ctx.beginPath();
  ctx.moveTo(...mid(n - 1));
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...mid(i));
  ctx.closePath();
}
function sline(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(...pts[i], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  ctx.lineTo(...pts[pts.length - 1]);
}
function pen(ctx, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
// (a soft tapered tube along a line of points, round at both ends, as one smooth outline)
function tube(ctx, pts, ws) {
  const L = [];
  const R = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(n - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const nx = -Math.sin(an);
    const ny = Math.cos(an);
    L.push([pts[i][0] + nx * ws[i] / 2, pts[i][1] + ny * ws[i] / 2]);
    R.push([pts[i][0] - nx * ws[i] / 2, pts[i][1] - ny * ws[i] / 2]);
  }
  const cap = (i, dir) => {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(n - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]) + (dir > 0 ? 0 : Math.PI);
    const r = ws[i] / 2;
    return [[pts[i][0] + Math.cos(an) * r * 0.95, pts[i][1] + Math.sin(an) * r * 0.95]];
  };
  smooth(ctx, [...L, ...cap(n - 1, 1), ...R.reverse(), ...cap(0, -1)]);
}
function sparkle(ctx, x, y, k) {
  if (k <= 0.01) return;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
}
// A damped spring kept in the rig's state.
function spring(st, key, goal, k, c, dt, kick = 0) {
  // (never NaN: a bad number from anywhere resets it to its goal)
  if (!Number.isFinite(goal)) goal = 0;
  const s = (st[key] ??= { x: goal, v: 0 });
  if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) Object.assign(s, { x: goal, v: 0 });
  if (Number.isFinite(kick)) s.v += kick;
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      s.v += (-(s.x - goal) * k - s.v * c) * (dt / n);
      s.x += s.v * (dt / n);
    }
  }
  return s.x;
}

// ---------- Her colours ----------
const INK = '#232a5a';
const NAVY = { lt: '#56649f', base: '#36417b', sh: '#2a3266', deep: '#212855', plum: '#5a4688' };
const SHIRT = ['#ffffff', '#fff6e8', '#efdfc8', '#dcc6aa'];
const APRICOT = ['#ffe0a8', '#ffbe6e', '#f2964a'];
const GOLD = ['#fff3b8', '#ffd66a', '#e7a93a', '#c4862a'];
const ROSE = ['#ffe6dc', '#f4b6a4', '#de8c7c', '#b86a62'];
const CORAL = ['#ffb4a2', '#ff8b78', '#e86a60', '#c8564e'];
const SPAT = ['#ffffff', '#f2eff8', '#d8d2e6'];
const IRIS = ['#2e1a12', '#5c3622', '#9a6440', '#c99a6a'];
const LIDINK = '#2a1f3a';
const LOWLID = '#c8a2b0';
const POLISH = ['#ffffff', '#fff6d8', '#ffe6a0', '#f2c66a'];

// ---------- Her face (the head's frame, facing right; a three-quarter view) ----------
// [lid (0 open .. 1 shut), slant (+ inner end lower), look x (+ ahead), look y (+ down), iris size,
// plume tilt (+ cross), plume lift]
const FACES = {
  proud: [0.46, 0, 0.2, 0, 1, -0.2, 0.3],
  count: [0.5, -0.05, 0.3, 0.25, 1, -0.15, 0.4],
  judge: [0.6, 0.1, -0.85, 0.05, 0.95, -0.35, 0.55],
  focus: [0.62, 0.42, 0.55, 0.12, 0.95, 0.95, -0.25],
  cross: [0.56, 0.45, 0.3, 0, 1, 1, -0.15],
  happy: [0.02, 0, 0.15, -0.05, 1.08, -0.25, 0.75],
  glee: [-0.04, 0, 0.6, -0.1, 1.12, 0.15, 0.55],
  startled: [-0.12, 0, 0.25, 0.75, 0.78, -0.5, 1],
  sad: [0.4, -0.38, 0, 0.25, 1.05, -0.85, 0.1],
  worried: [0.22, -0.4, 0.1, 0.15, 0.95, -0.95, 0.55],
  brave: [0.52, 0.45, 0.45, 0, 1, 1.15, -0.25],
  skate: [0.3, 0.1, 0.7, -0.05, 1.05, 0.2, 0.3],
};
const SHUT = { blink: 1, smug: 1, hurt: 1, dead: 1, dizzy: 1, sleep: 1, joy: 1 };
// (the brows for the shut faces: [tilt, lift])
const SHUT_BROW = { blink: [0, 0.2], smug: [-0.3, 0.75], hurt: [0.9, -0.3], dead: [-0.6, 0.3], dizzy: [-0.6, 0.3], sleep: [-0.2, 0], joy: [-0.7, 0.9] };
// (the face's middle in the head frame, three-quarters toward us)
const FCX = 3.0;
const EYE_N = [FCX - 3.7, -0.7];
const EYE_F = [FCX + 3.35, -0.8];
function eye(ctx, a, K, x, y, side, k, f) {
  const s = K.sc;
  const w = s(2.25) * k;
  const h = s(1.85);
  const cl = (c) => K.colour(a, c);
  const lw = Math.max(0.5, s(0.42));
  const name = f.name;
  // (her almond: level, fuller below than above)
  const almond = (g = 0) => {
    ctx.beginPath();
    ctx.moveTo(x - w - g, y + s(0.05));
    ctx.bezierCurveTo(x - w * 0.6, y - h * 1.15 - g, x + w * 0.6, y - h * 1.15 - g, x + w + g, y - s(0.05));
    ctx.bezierCurveTo(x + w * 0.55, y + h * 1.05 + g, x - w * 0.55, y + h * 1.05 + g, x - w - g, y + s(0.05));
    ctx.closePath();
  };
  if (SHUT[name]) {
    pen(ctx, cl(LIDINK), lw * 1.15);
    ctx.beginPath();
    if (name === 'smug' || name === 'joy') {
      // pleased with herself: a calm upward arc, a lash flick at the outer corner
      ctx.moveTo(x - w, y + s(0.3));
      ctx.quadraticCurveTo(x, y - h * 1.1, x + w, y + s(0.3));
    } else if (name === 'hurt') {
      // squeezed: > < (pointing in toward the face's middle)
      const sd = -side;
      ctx.moveTo(x - sd * w, y - h * 0.85);
      ctx.quadraticCurveTo(x + sd * w * 0.15, y - h * 0.1, x + sd * w * 0.85, y);
      ctx.quadraticCurveTo(x + sd * w * 0.15, y + h * 0.1, x - sd * w, y + h * 0.85);
    } else if (name === 'dead' || name === 'dizzy') {
      for (let i = 0; i <= 26; i++) {
        const q = (i / 26) * TAU * 2;
        const r = (i / 26) * w * 0.9;
        const p = [x + Math.cos(q) * r, y + Math.sin(q) * r * 0.85];
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      }
    } else {
      // a blink: the lid's line come down, curving softly
      ctx.moveTo(x - w, y);
      ctx.quadraticCurveTo(x, y + h * 0.7, x + w, y);
    }
    ctx.stroke();
    if (name !== 'dead' && name !== 'dizzy' && name !== 'hurt') {
      const ox = x + side * w;
      pen(ctx, cl(LIDINK), lw * 0.85);
      ctx.beginPath();
      ctx.moveTo(ox, y + (name === 'smug' ? s(0.2) : 0));
      ctx.quadraticCurveTo(ox + side * s(0.8), y - s(0.2), ox + side * s(0.75), y - s(0.9));
      ctx.stroke();
    }
    return;
  }
  const [lid0, slant0, lx, ly, isz] = f.v;
  // (a blink: the lid itself coming down and back up, eased: never a swap of shapes)
  const bk = clamp(f.blink ?? 0, 0, 1);
  const L = mix(clamp(lid0, -0.2, 0.9), 0.98, bk);
  const slant = slant0 * (1 - bk);
  // the thin white eye-ring, the white
  almond(s(0.42));
  ctx.fillStyle = cl('#ffffff');
  ctx.fill();
  almond();
  ctx.fillStyle = cl('#fffaf2');
  ctx.fill();
  ctx.save();
  almond();
  ctx.clip();
  const ix = x + lx * w * 0.32;
  const iy = y + ly * h * 0.32 + s(0.1);
  const g = ctx.createLinearGradient(0, iy - h, 0, iy + h);
  g.addColorStop(0, cl(IRIS[0]));
  g.addColorStop(0.45, cl(IRIS[1]));
  g.addColorStop(1, cl(IRIS[3]));
  ell(ctx, ix, iy, w * 0.6 * isz, h * 1.0 * isz);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, ix, iy - h * 0.05, w * 0.3 * isz, h * 0.55 * isz);
  ctx.fillStyle = cl('#1e100a');
  ctx.fill();
  ell(ctx, ix, iy + h * 0.62 * isz, w * 0.4 * isz, h * 0.22);
  ctx.fillStyle = K.tint(a, IRIS[3], 0.7);
  ctx.fill();
  // the lid: flat and level at half-mast (slanting in when cross or focused), the navy over it
  const top = y - h * 1.15;
  const yL = top + (L + 0.06) * h * 2.0;
  const yIn = yL + slant * h * 0.55;
  const yOut = yL - slant * h * 0.35;
  const xIn = x - side * w * 1.3;
  const xOut = x + side * w * 1.3;
  {
    ctx.beginPath();
    ctx.moveTo(xOut, top - s(2));
    ctx.lineTo(xIn, top - s(2));
    ctx.lineTo(xIn, yIn);
    ctx.lineTo(xOut, yOut);
    ctx.closePath();
    ctx.fillStyle = cl(NAVY.base);
    ctx.fill();
    // (a soft shadow the lid casts on the eye)
    ctx.beginPath();
    ctx.moveTo(xIn, yIn);
    ctx.lineTo(xOut, yOut);
    ctx.lineTo(xOut, yOut + s(0.5));
    ctx.lineTo(xIn, yIn + s(0.5));
    ctx.closePath();
    ctx.fillStyle = K.tint(a, '#3a2a40', 0.28);
    ctx.fill();
  }
  ctx.restore();
  // the glints: a rounded square up behind, a tiny dot low ahead
  const lidAt = (px) => mix(yOut, yIn, (px - xOut) / (xIn - xOut));
  // (the glints fade as the lid covers them, never pushed down onto her cheek)
  const gA = 1 - sstep((L - 0.62) / 0.25);
  const al0 = ctx.globalAlpha;
  ctx.globalAlpha = al0 * gA;
  const gs = s(0.95) * (f.bright ?? 1);
  const gx = ix - w * 0.28;
  const gy = Math.max(iy - h * 0.42, lidAt(gx) + gs * 0.4);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect(gx - gs / 2, gy - gs / 2, gs, gs, gs * 0.32);
  ctx.fill();
  ell(ctx, ix + w * 0.3, iy + h * 0.42, s(0.28), s(0.28));
  ctx.fill();
  if ((f.bright ?? 1) > 1.05) {
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    sparkle(ctx, ix + w * 0.12, iy - h * 0.05, s(0.45));
  }
  ctx.globalAlpha = al0;
  // the lid's line (heavy, soft), a lash flick at the outer corner; the soft lower lid
  pen(ctx, cl(LIDINK), lw * 1.2);
  ctx.save();
  almond(s(0.3));
  ctx.clip();
  // (wide open, the eye's own top arc; the lid's edge fading in over it as it lowers)
  const lk = sstep((L - 0.0) / 0.14);
  const al1 = ctx.globalAlpha;
  if (lk < 1) {
    ctx.globalAlpha = al1 * (1 - lk);
    ctx.beginPath();
    ctx.moveTo(x - w, y + s(0.05));
    ctx.bezierCurveTo(x - w * 0.6, y - h * 1.15, x + w * 0.6, y - h * 1.15, x + w, y - s(0.05));
    ctx.stroke();
  }
  if (lk > 0) {
    ctx.globalAlpha = al1 * lk;
    ctx.beginPath();
    ctx.moveTo(xOut, yOut);
    ctx.lineTo(xIn, yIn);
    ctx.stroke();
  }
  ctx.globalAlpha = al1;
  ctx.restore();
  const ox = x + side * w * 0.98;
  const oy = mix(y - h * 0.2, Math.max(lidAt(ox), y - h * 0.2), lk);
  pen(ctx, cl(LIDINK), lw * 0.85);
  ctx.beginPath();
  ctx.moveTo(ox, oy);
  ctx.quadraticCurveTo(ox + side * s(0.9), oy - s(0.15), ox + side * s(0.85), oy - s(0.95));
  ctx.stroke();
  pen(ctx, cl(LOWLID), lw * 0.7);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.62, y + h * 0.82);
  ctx.quadraticCurveTo(x, y + h * 1.12, x + w * 0.62, y + h * 0.82);
  ctx.stroke();
}
// The face under the plumes and the beak: the cream mask, the apricot commas, the cheeks, the eyes.
function face(ctx, a, sk, K) {
  const s = K.sc;
  const q = a.rd ?? {};
  const Hd = K.P.head;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(0, 0, s(Hd.rx), s(Hd.r), 0, 0, TAU);
  ctx.clip();
  // the cream mask: up to just under the eyes' tops, a little navy point between them
  const c = FCX;
  smooth(ctx, [[c - 8.6, -0.6], [c - 7.4, -2.3], [c - 5.4, -2.6], [c - 3.6, -2.4], [c - 1.4, -2.2], [c - 0.1, -1.2], [c + 1.3, -2.1], [c + 3.3, -2.5], [c + 5.4, -2.2], [c + 6.8, -0.6], [c + 7.6, 3.4], [c + 5.6, 8.2], [c + 0.6, 10.6], [c - 5.2, 9.6], [c - 8.4, 5.6], [c - 9.2, 2.2]].map(([x, y]) => [s(x), s(y)]));
  ctx.fillStyle = K.colour(a, SHIRT[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  K.glow(ctx, [s(c + 1), s(3.4)], s(6.5), 0.9, SHIRT[0]);
  K.glow(ctx, [s(c - 7), s(7)], s(4.5), 0.5, SHIRT[2]);
  ctx.restore();
  // the king penguin's neck patch: a soft apricot-gold blush painted on from behind her cheek down
  // the side of her neck (it runs on into her shirt front, see shirt()); no edge of its own
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    const x = mix(c - 8.6, c - 3.2, u * u);
    const y = mix(-1.2, 9.6, u);
    K.glow(ctx, [s(x), s(y)], s(2.7 - u * 0.5), 0.5, i < 4 ? APRICOT[1] : APRICOT[0]);
  }
  ctx.restore();
  // the cheeks: a soft rose under each eye (warmer when happy or hurt)
  const bl = 0.38 + (q.blush ?? 0) * 0.4;
  K.glow(ctx, [s(EYE_N[0] - 0.4), s(2.5)], s(2.1), bl, '#ff9ea0');
  K.glow(ctx, [s(EYE_F[0] + 0.4), s(2.4)], s(1.6), bl * 0.8, '#ff9ea0');
  const f = q.f ?? { name: 'proud', v: FACES.proud };
  // (a shut face fading in over the open eye and out again: never a snap between them)
  const sk2 = clamp(f.shutK ?? (SHUT[f.name] ? 1 : 0), 0, 1);
  const al = ctx.globalAlpha;
  // (both always drawn, the hidden one at no alpha, so neither pops in from somewhere old)
  {
    ctx.globalAlpha = al * (1 - sk2);
    const fo = { ...f, name: 'open' };
    eye(ctx, a, K, s(EYE_N[0]), s(EYE_N[1]), -1, 1, fo);
    eye(ctx, a, K, s(EYE_F[0]), s(EYE_F[1]), 1, 0.8, fo);
  }
  {
    ctx.globalAlpha = al * sk2;
    const fs = { ...f, name: f.shutName ?? f.name };
    eye(ctx, a, K, s(EYE_N[0]), s(EYE_N[1]), -1, 1, fs);
    eye(ctx, a, K, s(EYE_F[0]), s(EYE_F[1]), 1, 0.8, fs);
  }
  ctx.globalAlpha = al;
  // her brows: soft cream strokes on the navy over each eye, doing the acting (tipped in and down
  // when cross or focused, up in the middle when worried, high when proud or startled)
  const [bt, bLift] = [f.v[5], f.v[6]];
  for (const [[ex, ey], side, k] of [[EYE_N, -1, 1], [EYE_F, 1, 0.8]]) {
    const by = ey - 2.75 - bLift * 0.85;
    const inner = [ex - side * 1.75 * k, by + bt * 0.7];
    const outer = [ex + side * 1.95 * k, by - bt * 0.28 + 0.15];
    const mid = [(inner[0] + outer[0]) / 2, Math.min(inner[1], outer[1]) - 0.42];
    tube(ctx, [inner, mid, outer].map(([x, y]) => [s(x), s(y)]), [0.62, 0.78, 0.5].map((v) => s(v) * (0.85 + k * 0.15)));
    ctx.fillStyle = K.colour(a, SHIRT[1]);
    ctx.fill();
  }
  // tears of joy (she can fly!) or of a brave heart: little drops rolling from the eyes' outer corners
  if (q.tears) {
    for (const [[ex, ey], side] of [[EYE_N, -1], [EYE_F, 1]]) {
      for (let i = 0; i < 2; i++) {
        const u = ((a.t ?? 0) * 0.9 + i * 0.5 + (side > 0 ? 0.25 : 0)) % 1;
        const x = s(ex + side * 2.1 + side * u * 0.6);
        const y = s(ey + 0.6 + u * 4.2);
        ctx.globalAlpha = Math.sin(Math.PI * u) * q.tears;
        ctx.beginPath();
        ctx.moveTo(x, y - s(0.75));
        ctx.quadraticCurveTo(x + s(0.6), y + s(0.2), x, y + s(0.6));
        ctx.quadraticCurveTo(x - s(0.6), y + s(0.2), x, y - s(0.75));
        ctx.fillStyle = 'rgba(190,232,255,0.95)';
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }
  // a sweat drop when she's beaten or hurt badly
  if (q.sweat) {
    const y = s(-4 + (q.sweat % 1) * 1.2);
    const x = s(c + 7);
    ctx.beginPath();
    ctx.moveTo(x, y - s(1.1));
    ctx.quadraticCurveTo(x + s(0.85), y + s(0.3), x, y + s(0.85));
    ctx.quadraticCurveTo(x - s(0.85), y + s(0.3), x, y - s(1.1));
    ctx.fillStyle = 'rgba(200,236,255,0.95)';
    ctx.fill();
  }
}
// Her beak: slim and coral, the lower half striped gold, opening about the gape; a smile or a pout
// at the gape's corner. (Both passes: its edge only where it stands out from her head.)
const BK = { x: FCX + 1.5, y: 1.7, len: 3.9 };
const BEAK = ['#ffd0c4', '#f3a493', '#de8c7e', '#bf7468'];
const STRIPE = '#f1c47e';
function beak(ctx, a, mode, K) {
  const s = K.sc;
  const q = a.rd ?? {};
  const bx = s(BK.x);
  const by = s(BK.y);
  const L = s(BK.len);
  const open = clamp(a.bk.beak, 0, 1);
  const upper = () => {
    // slim, its ridge arching and the tip curving softly down, round at the end
    ctx.beginPath();
    ctx.moveTo(bx - s(0.5), by - s(0.72));
    ctx.quadraticCurveTo(bx + L * 0.55, by - s(0.95), bx + L * 0.98, by + s(0.38));
    ctx.quadraticCurveTo(bx + L * 1.02, by + s(0.66), bx + L * 0.84, by + s(0.58));
    ctx.quadraticCurveTo(bx + L * 0.4, by + s(0.26), bx - s(0.3), by + s(0.24));
    ctx.quadraticCurveTo(bx - s(0.8), by - s(0.1), bx - s(0.5), by - s(0.72));
    ctx.closePath();
  };
  const lower = () => {
    ctx.beginPath();
    ctx.moveTo(bx - s(0.3), by + s(0.18));
    ctx.quadraticCurveTo(bx + L * 0.4, by + s(0.24), bx + L * 0.72, by + s(0.5));
    ctx.quadraticCurveTo(bx + L * 0.7, by + s(0.76), bx + L * 0.5, by + s(0.74));
    ctx.quadraticCurveTo(bx + L * 0.2, by + s(0.82), bx - s(0.25), by + s(0.7));
    ctx.quadraticCurveTo(bx - s(0.6), by + s(0.48), bx - s(0.3), by + s(0.18));
    ctx.closePath();
  };
  K.headFrame(ctx, a);
  for (const lo of [true, false]) {
    ctx.save();
    if (lo) {
      ctx.translate(bx - s(0.3), by + s(0.25));
      ctx.rotate(open * 0.62);
      ctx.translate(-(bx - s(0.3)), -(by + s(0.25)));
    }
    if (lo) lower();
    else upper();
    if (mode === 'line') {
      K.edge(ctx);
      ctx.restore();
      continue;
    }
    ctx.fillStyle = K.colour(a, BEAK[1]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (lo) {
      // the gold stripe along the lower half
      pen(ctx, K.colour(a, STRIPE), s(0.34));
      ctx.beginPath();
      ctx.moveTo(bx - s(0.1), by + s(0.46));
      ctx.quadraticCurveTo(bx + L * 0.3, by + s(0.54), bx + L * 0.62, by + s(0.56));
      ctx.stroke();
    } else {
      K.glow(ctx, [bx + L * 0.35, by - s(0.4)], s(1.5), 0.8, BEAK[0]);
    }
    ctx.restore();
    // (a soft deeper rim of its own colour, so it reads over her face)
    if (lo) lower();
    else upper();
    pen(ctx, K.colour(a, BEAK[3]), Math.max(0.4, s(0.16)));
    ctx.stroke();
    ctx.restore();
  }
  if (mode === 'line') return;
  // rooted in her face: the cream of her face flowing round the beak's base (soft, no edge)
  smooth(ctx, [[bx - s(1.4), by - s(0.9)], [bx - s(0.2), by - s(1.15)], [bx + s(0.3), by - s(0.5)], [bx + s(0.25), by + s(0.55)], [bx - s(0.3), by + s(1.1)], [bx - s(1.5), by + s(0.8)]]);
  ctx.fillStyle = K.colour(a, SHIRT[1]);
  ctx.fill();
  // the gape's corner: a smile up into the cheek, or a pout down
  const mo = q.mouth ?? 'closed';
  const k = q.gape ?? (mo === 'smile' ? 1 : mo === 'pout' ? -1 : 0.25);
  pen(ctx, K.colour(a, BEAK[3], 0.85), Math.max(0.45, s(0.24)));
  ctx.beginPath();
  ctx.moveTo(bx + s(0.2), by + s(0.3));
  ctx.quadraticCurveTo(bx - s(0.6), by + s(0.36) - k * s(0.3), bx - s(1.1), by + s(0.3) - k * s(0.8));
  ctx.stroke();
  if (open > 0.25) {
    // her little tongue inside, between the halves
    ctx.save();
    ctx.translate(bx - s(0.3), by + s(0.25));
    ctx.rotate(open * 0.31);
    ell(ctx, L * 0.32, s(0.35), L * 0.24, s(0.3) + open * s(0.2));
    ctx.fillStyle = K.colour(a, '#ff9aa6');
    ctx.fill();
    ctx.restore();
  }
}
// Her crown tuft: two small rounded gold feathers rooted in the top of her head (each a quill line
// down its middle), perking up when she's startled or happy, flattening when cross, each swaying on
// its own spring.
function plumes(ctx, a, mode, K) {
  const s = K.sc;
  const q = a.rd ?? {};
  const f = q.f ?? { v: FACES.proud };
  const perk = q.perk ?? 0;
  const sw = q.plumeSw ?? [0, 0];
  K.headFrame(ctx, a);
  for (const [root, ang0, len, w, i, col] of [[[-0.6, -8.4], -1.95, 4.4, 1.5, 1, GOLD[2]], [[0.6, -8.6], -1.62, 5.2, 1.7, 0, GOLD[1]]]) {
    const an = ang0 - perk * 0.25 + sw[i] * 1.6 + (f.v ? -f.v[5] * 0.12 : 0);
    const dir = [Math.cos(an), Math.sin(an)];
    const nrm = [-dir[1], dir[0]];
    const tip = add(root, dir.map((v) => v * len));
    // (curving back a little toward its tip, like a feather)
    const mid = add(lerp2(root, tip, 0.55), nrm.map((v) => v * 0.55));
    const pts = [root, lerp2(root, mid, 0.5), mid, lerp2(mid, tip, 0.6), tip].map(([x, y]) => [s(x), s(y)]);
    const ws = [w * 0.55, w * 0.9, w, w * 0.8, w * 0.45].map(s);
    tube(ctx, pts, ws);
    if (mode === 'line') {
      K.edge(ctx);
      continue;
    }
    ctx.fillStyle = K.colour(a, col);
    ctx.fill();
    ctx.save();
    tube(ctx, pts, ws);
    ctx.clip();
    K.glow(ctx, pts[2], s(w * 1.2), 0.7, GOLD[0]);
    // the quill down its middle
    pen(ctx, K.colour(a, GOLD[3]), Math.max(0.35, s(0.2)));
    sline(ctx, pts.slice(0, 4));
    ctx.stroke();
    ctx.restore();
  }
}
// The bow tie: rose-gold satin at her throat, two round loops and a knot; it slips askew on a spring
// and she pats it straight.
function bowTie(ctx, a, mode, K) {
  const s = K.sc;
  const q = a.rd ?? {};
  K.headFrame(ctx, a);
  ctx.translate(s(FCX + 0.3), s(9.0));
  ctx.rotate(-a.bk.ha * 0.45 + (q.bow ?? 0));
  const loop = (sd, k) => {
    smooth(ctx, [[0, -0.5], [sd * 1.2, -1.5], [sd * 2.9, -1.65], [sd * 3.4, -0.1], [sd * 2.95, 1.55], [sd * 1.3, 1.45], [0, 0.5]].map(([x, y]) => [s(x) * k, s(y) * k]));
  };
  const all = () => {
    loop(-1, 1.08);
    loop(1, 0.9);
  };
  if (mode === 'line') {
    all();
    K.edge(ctx);
    ell(ctx, 0, 0, s(1.0), s(1.1));
    return K.edge(ctx);
  }
  for (const [sd, k] of [[1, 0.9], [-1, 1.08]]) {
    loop(sd, k);
    ctx.fillStyle = K.colour(a, sd < 0 ? ROSE[1] : ROSE[2]);
    ctx.fill();
    ctx.save();
    ctx.clip();
    K.glow(ctx, [s(sd * 2.0) * k, s(-0.6)], s(1.8), 0.9, ROSE[0]);
    pen(ctx, K.colour(a, ROSE[3]), Math.max(0.4, s(0.25)));
    ctx.beginPath();
    ctx.moveTo(s(sd * 0.9) * k, s(-0.2));
    ctx.quadraticCurveTo(s(sd * 2) * k, s(0.2), s(sd * 2.7) * k, s(0.9));
    ctx.stroke();
    ctx.restore();
    loop(sd, k);
    pen(ctx, K.colour(a, ROSE[3]), Math.max(0.5, s(0.3)));
    ctx.stroke();
  }
  ell(ctx, 0, 0, s(1.0), s(1.1));
  ctx.fillStyle = K.colour(a, ROSE[2]);
  ctx.fill();
  pen(ctx, K.colour(a, ROSE[3]), Math.max(0.5, s(0.3)));
  ctx.stroke();
  ell(ctx, -s(0.25), -s(0.35), s(0.4), s(0.3));
  ctx.fillStyle = K.colour(a, ROSE[0]);
  ctx.fill();
}
// The shirt front: cream from her throat down her breast and belly (only on the body: no edge of its
// own), a soft shine, a faint lapel line where the navy coat meets it; the carnation on it.
function shirt(ctx, a, mode, K) {
  if (mode !== 'fill') return;
  const s = K.sc;
  const sk = a.bk;
  ctx.save();
  K.bodyPath(ctx, a);
  ctx.clip();
  const pts = [[1.6, -10.8], [5.2, -8.6], [7.6, -3.6], [8.2, 1.6], [6.8, 6.6], [3.0, 9.6], [-1.6, 9.8], [-2.0, 6.4], [-0.8, 1.4], [-0.2, -3.6], [0.2, -8.0]].map(sk.at);
  smooth(ctx, pts);
  ctx.fillStyle = K.colour(a, SHIRT[1]);
  ctx.fill();
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  K.glow(ctx, sk.at([4.6, -1.6]), s(6.2), 0.95, SHIRT[0]);
  K.glow(ctx, sk.at([0.4, 8.0]), s(5), 0.6, SHIRT[3]);
  // a soft satin sheen
  ctx.globalAlpha = 0.55;
  pen(ctx, K.colour(a, '#ffffff'), s(0.8));
  sline(ctx, [sk.at([5.6, -4.2]), sk.at([6.6, -0.6]), sk.at([6.4, 2.8])]);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.restore();
  // the lapel: a soft lighter navy edge where the coat meets the shirt
  pen(ctx, K.colour(a, NAVY.lt), Math.max(0.6, s(0.5)));
  sline(ctx, [[-1.0, 9.6], [-1.2, 6.2], [-0.4, 1.4], [0.1, -3.8], [0.3, -8.4]].map(sk.at));
  ctx.stroke();
  // the neck patch's blush running on down into the top of her shirt front
  for (const [p, r, al] of [[[0.6, -2.6], 3.4, 0.4], [[2.2, -0.6], 3.0, 0.3], [[3.6, 1.2], 2.4, 0.18]]) K.glow(ctx, sk.at(p), s(r), al, APRICOT[1]);
  // a plum glow low on her back (the coat's own sheen)
  K.glow(ctx, sk.at([-6, 3]), s(6), 0.5, NAVY.plum);
  ctx.restore();
  carnation(ctx, a, K);
}
// A white carnation in her buttonhole: ruffled round petals, a soft pink heart, a little leaf.
function carnation(ctx, a, K) {
  const s = K.sc;
  const sk = a.bk;
  const c = sk.at([5.0, 1.4]);
  const t = a.t ?? 0;
  ctx.save();
  ctx.translate(...c);
  ctx.rotate(sk.th * 0.6 + Math.sin(t * 1.3) * 0.04);
  // the leaf
  smooth(ctx, [[-0.2, 0.4], [-1.6, 1.4], [-2.8, 1.2], [-1.6, 0.2]].map(([x, y]) => [s(x), s(y)]));
  ctx.fillStyle = K.colour(a, '#7cc47a');
  ctx.fill();
  pen(ctx, K.colour(a, '#4f9a5a'), Math.max(0.4, s(0.22)));
  ctx.stroke();
  // the petals: a ruffled round of soft lobes
  const pts = [];
  for (let i = 0; i < 14; i++) {
    const an = (i / 14) * TAU;
    const r = s(i % 2 ? 1.45 : 1.85);
    pts.push([Math.cos(an) * r, Math.sin(an) * r * 0.92]);
  }
  smooth(ctx, pts);
  ctx.fillStyle = K.colour(a, '#ffffff');
  ctx.fill();
  pen(ctx, K.colour(a, '#dccfe2'), Math.max(0.4, s(0.25)));
  ctx.stroke();
  pen(ctx, K.colour(a, '#e8dcea'), Math.max(0.35, s(0.2)));
  for (let i = 0; i < 5; i++) {
    const an = (i / 5) * TAU + 0.3;
    ctx.beginPath();
    ctx.arc(Math.cos(an) * s(0.7), Math.sin(an) * s(0.7), s(0.6), an - 1.2, an + 1.2);
    ctx.stroke();
  }
  ell(ctx, 0, 0, s(0.55), s(0.5));
  ctx.fillStyle = K.tint(a, '#ffc4d4', 0.8);
  ctx.fill();
  ctx.restore();
}
// The tailcoat's tails: two soft long tails from her rump (rooted inside her body), each on its own
// spring, plum-lined, the far one in shade.
function coatTails(ctx, a, mode, K) {
  const s = K.sc;
  const sk = a.bk;
  const q = a.rd ?? {};
  const tw = q.tails ?? [0, 0, 0, 0];
  for (const [far, root, len, w, sw, bend0] of [[true, [-5.0, 5.2], 8.2, 3.2, tw[2], tw[3]], [false, [-5.8, 4.6], 8.8, 3.6, tw[0], tw[1]]]) {
    const bend = bend0 - 0.38;
    const R = sk.at(root);
    const an = sk.th + (134 + (far ? -12 : 4)) * (Math.PI / 180) + sw;
    const L = s(len);
    const p1 = add(R, [Math.cos(an) * L * 0.5, Math.sin(an) * L * 0.5]);
    const an2 = an + bend;
    const p2 = add(p1, [Math.cos(an2) * L * 0.5, Math.sin(an2) * L * 0.5]);
    const pts = [R, lerp2(R, p1, 0.5), p1, lerp2(p1, p2, 0.55), p2];
    const ws = [w, w * 0.98, w * 0.86, w * 0.7, w * 0.55].map(s);
    tube(ctx, pts, ws);
    if (mode === 'line') {
      K.edge(ctx);
      continue;
    }
    ctx.fillStyle = K.colour(a, far ? NAVY.deep : NAVY.sh);
    ctx.fill();
    ctx.save();
    tube(ctx, pts, ws);
    ctx.clip();
    // the plum lining along its inner edge, a satin light down its middle
    const nrm = an2 + Math.PI / 2;
    pen(ctx, K.colour(a, far ? '#4a3a72' : NAVY.plum), s(w * 0.32));
    sline(ctx, pts.slice(1).map((p, i) => add(p, [Math.cos(nrm) * s(w) * 0.42 * (1 - i * 0.1), Math.sin(nrm) * s(w) * 0.42 * (1 - i * 0.1)])));
    ctx.stroke();
    if (!far) {
      pen(ctx, K.tint(a, NAVY.lt, 0.7), s(0.6));
      sline(ctx, pts.slice(0, 4).map((p) => add(p, [-Math.cos(nrm) * s(0.6), -Math.sin(nrm) * s(0.6)])));
      ctx.stroke();
    }
    ctx.restore();
  }
}
// White spats over her ankles, a pearl button each, her orange feet below.
function spat(k) {
  return (ctx, a, mode, K) => {
    const s = K.sc;
    const Lg = a.bk.legs[k];
    const far = k === 'legF';
    const p0 = lerp2(Lg.J1, Lg.J2, 0.82);
    const p1 = lerp2(Lg.J2, Lg.P, 0.42);
    const ws = [Lg.w[2] * 0.98, Lg.w[2] * 1.02, Lg.w[3] * 1.04];
    const pts = [p0, Lg.J2, p1];
    tube(ctx, pts, ws);
    if (mode === 'line') return K.edge(ctx);
    ctx.fillStyle = K.colour(a, far ? SPAT[2] : SPAT[0]);
    ctx.fill();
    if (far) return;
    // the spat's top hem
    pen(ctx, K.colour(a, SPAT[2]), Math.max(0.5, s(0.3)));
    ctx.beginPath();
    ctx.moveTo(...add(p0, [-ws[0] * 0.42, ws[0] * 0.15]));
    ctx.quadraticCurveTo(...add(p0, [0, ws[0] * 0.38]), ...add(p0, [ws[0] * 0.42, ws[0] * 0.15]));
    ctx.stroke();
    ctx.save();
    tube(ctx, pts, ws);
    ctx.clip();
    K.glow(ctx, lerp2(Lg.J2, p1, 0.6), s(2.4), 0.6, SPAT[2]);
    ctx.restore();
    ell(ctx, ...add(Lg.J2, [s(0.6), s(0.3)]), s(0.42), s(0.42));
    ctx.fillStyle = K.colour(a, '#e8dcf4');
    ctx.fill();
  };
}

// ---------- Her act and her cast ----------
const CYCLE = 13;
const SLIDES = new Set(['slide', 'echoslide', 'crossing']);
const SKATES = new Set(['echoslide', 'crossing']);
const SWINGS = ['slap', 'peck'];
const look = {
  kind: 'owl',
  noFly: true,
  noMoves: true,
  ink: INK,
  channels: { kick: [520, 40], tap: [420, 30], pitch: [300, 30], lift: [320, 32] },
  P: {
    scale: 2.2,
    gait: 'waddle',
    body: [[5.8, -7.2], [3.8, -10.4], [0, -11.4], [-3.8, -10.6], [-6.6, -7.4], [-8.0, -2.2], [-8.2, 3.2], [-6.2, 7.6], [-0.8, 9.6], [4.8, 8.4], [7.8, 3.8], [7.8, -2.0]],
    breast: [3.8, 1.2, 6],
    neck: { base: [1.2, -8.8], len: 2.8, ang: -86 },
    head: { r: 9.4, rx: 9.8, disc: false },
    beak: { kind: 'none', at: [BK.x, BK.y], len: BK.len, h: 2.2 },
    wing: { root: [-1.4, -1.6], far: [-1.4, -0.8], fold: [-260, 4.8, 4, 5.2], up: [-104, 5.4, 2, 6], w: [4.6, 4.1, 2.9], feathers: 1, flipper: true },
    leg: { top: [-0.5, 6.6], bones: [[1.2, 2.3], [-0.8, 2.3], [0.6, 1.5]], w: [5.6, 4.2, 2.8, 2.4] },
    far: [-2.2, -0.6],
    foot: { kind: 'web', toe: 4.6, up: 0.7 },
    tail: { root: [-6.6, 6.4], ang: 140, len: 2.4, w: 2.4, n: 2, spread: 8 },
    flap: 3,
    moves: [],
  },
  C: { lt: NAVY.lt, base: NAVY.base, sh: NAVY.sh, deep: NAVY.deep, guide: NAVY.sh, beak: CORAL[1], beakSh: CORAL[2], leg: '#ff9a52' },
  face,
  under: { body: coatTails },
  over: {
    body: shirt,
    head: (ctx, a, mode, K) => {
      ctx.save();
      beak(ctx, a, mode, K);
      ctx.restore();
      ctx.save();
      plumes(ctx, a, mode, K);
      ctx.restore();
      bowTie(ctx, a, mode, K);
    },
    legN: spat('legN'),
    legF: spat('legF'),
  },
  pose: (m, a, out, K) => {
    const st = a.mo.rig;
    const t = a.t ?? 0;
    const now = a.now ?? t;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const q = { mouth: 'closed', blush: 0, count: null, big: null, gleam: 0, slide: 0, bowGoal: 0, bright: 1, sweat: 0, tears: 0, perk: 0, steam: -1, z: 0, spark: null, skate: 0, dizzy: 0, tadah: -1, gather: 0, twinkle: null };
    a.rd = q;
    a.noStep = 0;
    const go = (p, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(p)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * Math.min(1, w);
    };
    let face = 'proud';
    let busy = false;
    const say = (f, w = 1) => {
      if (w > 0.45) face = f;
    };
    const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
    const hurtU = a.hurtAgo ?? 9;
    const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.45;
    const mood = m.cine?.mood ?? (a.mood === 'calm' ? null : a.mood);
    const act = m.cine?.act;
    const au = act ? now - act.at : -1;
    // ---- the cast now, and the one that just ended (its release) ----
    if (m.cast && m.castPose) {
      if (st.rdCast?.t0 !== m.cast.t0) st.rdCrouchAt = m.cast.t0;
      st.rdCast = { pose: m.castPose, t0: m.cast.t0, dur: m.cast.dur };
    } else if (st.rdCast) {
      st.rdLast = { pose: st.rdCast.pose, at: m.attackAt ?? now };
      st.rdCast = null;
    }
    const casting = m.cast && m.castPose ? m.castPose : null;
    const u = casting ? now - m.cast.t0 : -1;
    const dur = m.cast?.dur ?? 2.8;
    const rel = !m.cast && st.rdLast && Math.abs((m.attackAt ?? -99) - st.rdLast.at) < 0.25 ? st.rdLast.pose : null;
    const rs = rel ? now - st.rdLast.at : -1;
    // ---- her plain swings between casts: a flipper slap, a beak peck, in turn ----
    const since = now - (m.attackAt ?? -99);
    const meleeOn = m.hp > 0 && !casting && !rel && !m.lift && !m.charging && (!act || act.move === 'attack') && ((m.windup ?? 0) > 0 || (since >= 0 && since < 0.75));
    if (meleeOn && !st.rdAtk) {
      st.rdSwN = (st.rdSwN ?? m.uid ?? 0) + 1;
      st.rdSw = SWINGS[st.rdSwN % SWINGS.length];
    }
    st.rdAtk = meleeOn;
    // ---- the belly slide (a slide's release while the fight carries her, the entrance's slide-in) ----
    const slideWant = m.hp > 0 && (Boolean(m.charging) || (act?.move === 'slidein' && au >= 0) || (act?.move === 'spinstop' && au >= 0 && au < 0.62) || (SLIDES.has(rel) && rs < 0.3));
    st.rdSlideK = approach(st.rdSlideK ?? 0, slideWant ? 1 : 0, dt * (slideWant ? 12 : 4));
    if (st.rdWasSlide && !slideWant) st.rdUpAt = now;
    st.rdWasSlide = slideWant;
    const slideK = sstep(st.rdSlideK ?? 0);
    // ---- carried up in the Grand Lift ----
    const lifted = Boolean(m.lift) && m.hp > 0;
    st.rdLiftK = approach(st.rdLiftK ?? 0, lifted ? 1 : 0, dt * (lifted ? 5 : 3));
    if (st.rdWasLift && !lifted) st.rdLandAt = now;
    st.rdWasLift = lifted;
    const liftK = sstep(st.rdLiftK ?? 0);

    // Standing tall: chest out, balanced over her feet, flippers held a little back.
    go({ pitch: 1.5, fluff: 0, wingN: 0.16, wingF: 0.12, head: -2 + Math.sin(t * 0.7) * 1.5 }, 1 - walkW);
    // Waddling: rocking foot to foot, flippers out a little for balance, swinging with her steps.
    if (walkW > 0.01) {
      const sw = Math.sin(t * 7.5);
      go({ wingN: 0.34 + sw * 0.1, wingF: 0.3 - sw * 0.1, head: -3 + sw * 2, pitch: 2, fluff: 0 }, walkW);
    }

    // ---- her idle act, only while she stands about ----
    const goal = clamp((1 - walkW) * (a.moving ? 0 : 1) * (m.pose || m.cine || casting || rel || meleeOn || slideWant || lifted || m.hp <= 0 || hurt || m.alone ? 0 : 1), 0, 1);
    st.rdCalm = Number.isFinite(st.rdCalm) ? st.rdCalm + (goal - st.rdCalm) * Math.min(1, dt * 6) : goal;
    const calm = st.rdCalm;
    if (calm > 0.02 && m.hp > 0) idleAct(m, a, out, q, go, (f, w) => say(f, w), calm, t);

    // ---- a plain swing ----
    if (meleeOn) {
      busy = true;
      const wk = (m.windup ?? 0) > 0 ? sstep(1 - (m.windup ?? 0) / Math.max(0.2, m.def?.fight?.windup ?? 0.5)) : since >= 0 ? 1 : 0;
      const hit = since >= 0 && since < 0.75 ? (since < 0.16 ? sstep(since / 0.16) : 1 - sstep((since - 0.28) / 0.47)) : 0;
      const pre = since >= 0 ? 1 - hit : wk;
      if (st.rdSw === 'slap') {
        // the flipper drawn back high, then whipped forward: SLAP
        go({ wingN: 0.8, pitch: -4, head: -6, crouch: 0.2, x: -0.02 }, pre);
        go({ wingN: -1.0, pitch: 9, head: 4, crouch: 0.1, x: 0.05 }, hit);
        if (since >= 0 && since < 0.4) q.spark = { at: 'wing', u: since / 0.4 };
      } else {
        // the beak drawn back, then a quick peck
        go({ reach: -0.5, head: -18, pitch: -6, crouch: 0.25 }, pre);
        go({ reach: 1.0, head: 22, pitch: 14, x: 0.04 }, hit);
        out.beak = Math.max(out.beak ?? 0, 0.5 * hit);
        if (since >= 0 && since < 0.4) q.spark = { at: 'beak', u: since / 0.4 };
      }
      say(hit > 0.3 ? 'glee' : 'cross');
      q.mouth = 'pout';
    }

    // ---- her casts ----
    if (casting && m.hp > 0) {
      busy = true;
      if (SLIDES.has(casting)) {
        const skating = SKATES.has(casting) && (m.goto != null || walkW > 0.3);
        if (skating) {
          // a quick skating glide to her mark: leaning in, flippers out for balance, one foot up
          st.rdCrouchAt = now;
          a.noStep = 1;
          const sw = Math.sin(t * 4.2);
          go({ pitch: 12, crouch: 0.15, wingN: 0.78 + sw * 0.08, wingF: 0.72 - sw * 0.08, head: -12, kick: 0.3 + 0.12 * sw, tailUp: 0, fluff: 0 }, 1);
          say('skate');
          q.mouth = 'smile';
          q.skate = 1;
        } else crouchCount(now - (st.rdCrouchAt ?? m.cast.t0), m.cast.t0 + dur - (st.rdCrouchAt ?? m.cast.t0), out, q, go, (f) => say(f));
      } else if (casting === 'count' || casting === 'echocount') {
        // conducting: one flipper raised and beating time, her beak counting, a big gold numeral
        // popping over her head on each third
        const beat = Math.sin((u / dur) * Math.PI * 6);
        go({ wingN: 0.86 + beat * 0.16, wingF: 0.18, head: -8 + Math.max(0, beat) * 5, pitch: -1, fluff: 0.15 }, sstep(u / 0.3));
        for (const [n, b] of [[1, 0.12], [2, 0.45]]) {
          const v = u - b * dur;
          if (v >= 0 && v < 0.9) q.big = { n, u: v / 0.9, k: 1.2 };
          out.beak = Math.max(out.beak ?? 0, pulse(u, b * dur, 0.32) * 0.45);
        }
        if (u > 0.78 * dur) q.big = { n: 3, u: 0, k: 1.2, ready: (u - 0.78 * dur) / (0.22 * dur) };
        say('count');
      } else if (casting === 'twirl') {
        // gathering for the spin: a lean, coat tails drawn in, flippers in
        const k = sstep(u / 0.6);
        go({ pitch: 9, crouch: 0.35, wingN: 0.05, wingF: 0.04, head: -6, fluff: 0.1 }, k);
        q.gather = k;
        say('focus');
      } else if (casting === 'bow') {
        // straightening her bow tie first: it's askew, she notices, pats it, very proper
        q.bowGoal = 0.42 * (1 - sstep((u - 0.45 * dur) / 0.3));
        const pat = win(u, 0.2 * dur, 0.3 * dur, 0.65 * dur, 0.78 * dur);
        go({ wingN: -0.92 + Math.sin(u * 22) * 0.06, head: -14, pitch: -4 }, pat);
        say(u < 0.2 * dur ? 'startled' : 'count');
        if (u > 0.78 * dur) {
          say('smug');
          q.mouth = 'smile';
        }
      } else if (casting === 'lift') {
        // waiting to be carried: flippers up high, up on her toes, bouncing with excitement
        const k = sstep(u / 0.5);
        go({ wingN: 1.05, wingF: 1.0, head: -14, pitch: -4, hop: 0.02 * Math.abs(Math.sin(u * 7)) }, k);
        say('happy');
        q.mouth = 'smile';
        q.perk = 1;
      } else {
        say('focus');
      }
    }
    // ---- their releases ----
    if (rel && m.hp > 0 && !slideWant) {
      if ((rel === 'count' || rel === 'echocount') && rs < 1.4) {
        busy = true;
        const k = win(rs, 0, 0.1, 1.0, 1.4);
        go({ head: -22, pitch: -6, wingN: 1.0, wingF: 0.3, fluff: 0.3 }, k);
        q.big = { n: 3, u: clamp(rs / 1.2, 0, 1), k: 1.7 };
        out.beak = Math.max(out.beak ?? 0, 0.6 * (1 - sstep(rs / 0.5)));
        say(rs < 0.5 ? 'glee' : 'smug', k * 2);
        q.mouth = 'smile';
      } else if (rel === 'twirl' && rs < 1.3) {
        busy = true;
        // the spin (mirror flips at each half turn, drawn round her rig), then the flipper smack
        const sp = win(rs, 0, 0.05, 0.4, 0.5);
        go({ crouch: 0.1, pitch: -2, wingN: 0.5, wingF: 0.5, hop: 0.03 * sp }, sp);
        const smack = win(rs, 0.4, 0.48, 0.75, 1.1);
        go({ wingN: -1.2, pitch: 10, head: 4, x: 0.04 }, smack);
        if (rs >= 0.48 && rs < 0.9) q.spark = { at: 'wing', u: (rs - 0.48) / 0.42 };
        say(rs < 0.45 ? 'glee' : 'smug');
        q.mouth = 'smile';
      } else if (rel === 'bow' && rs < 1.8) {
        busy = true;
        // a deep proud bow: one flipper across her front, the other back, eyes shut, pleased
        const k = win(rs, 0, 0.35, 1.2, 1.8);
        go({ pitch: 40, head: 26, crouch: 0.2, wingN: -0.75, wingF: 0.7, reach: -0.2, fluff: 0.1 }, k);
        say('smug', k * 2);
        q.mouth = 'smile';
        if (rs > 0.3 && rs < 1.3) q.twinkle = rs - 0.3;
      } else if (rel === 'lift' && !lifted && rs < 0.6) {
        busy = true;
        go({ wingN: 1.05, wingF: 1.0, head: -14 }, 1 - sstep(rs / 0.6));
        say('happy');
      }
    }
    // ---- the belly slide ----
    if (slideK > 0.001) {
      busy = true;
      a.noStep = Math.max(a.noStep, slideK);
      const bob = Math.sin(t * 16) * 0.5;
      go({ pitch: 82, crouch: 0, lift: -9.6 + bob, reach: 0.12, head: -42, wingN: 0.12, wingF: 0.08, kick: 1, x: 0, fluff: 0, tailUp: 0 }, slideK);
      out.beak = Math.max(out.beak ?? 0, 0.65 * slideK);
      say('glee', slideK);
      q.mouth = 'smile';
      q.slide = slideK;
      q.blush = Math.max(q.blush, 0.6 * slideK);
      q.bright = 1.25;
    }
    // back up off her belly: a proud little hop
    const upU = now - (st.rdUpAt ?? -99);
    if (upU >= 0 && upU < 0.7 && m.hp > 0) {
      out.hop = (out.hop ?? 0) + 0.035 * pulse(upU, 0.12, 0.35);
      if (!busy) say('smug');
    }
    // ---- the entrance's acts ----
    if (act && au >= 0 && m.hp > 0) {
      if (act.move === 'spinstop' && au >= 0.55) {
        // popped up from her spin: flippers up, ta-da!
        const k = win(au, 0.55, 0.7, 1.5, 1.9);
        go({ wingN: 0.98, wingF: 0.92, head: -14, pitch: -4, hop: 0.04 * pulse(au, 0.55, 0.3) }, k);
        say('glee', k);
        q.mouth = 'smile';
        if (au < 1.4) q.tadah = (au - 0.55) / 0.85;
        busy = true;
      } else if (act.move === 'bowtie') {
        q.bowGoal = 0.45 * (1 - sstep((au - 0.45) / 0.25));
        const pat = win(au, 0.2, 0.32, 0.7, 0.85);
        go({ wingN: -0.92 + Math.sin(au * 22) * 0.06, head: -14, pitch: -4 }, pat);
        say(au < 0.2 ? 'startled' : au < 0.8 ? 'count' : 'smug');
        if (au >= 0.8) q.mouth = 'smile';
        if (au > 0.75 && au < 1.6) q.twinkle = (au - 0.75) / 0.85;
        busy = true;
      } else if (act.move === 'bow') {
        const k = win(au, 0, 0.3, (act.dur ?? 1.4) - 0.3, (act.dur ?? 1.4) + 0.2);
        go({ pitch: 40, head: 26, crouch: 0.2, wingN: -0.75, wingF: 0.7, reach: -0.2 }, k);
        say('smug', k * 2);
        q.mouth = 'smile';
        busy = true;
      }
    }
    // ---- carried in the Grand Lift: dangling by her raised flippers, feet kicking, tears of joy ----
    if (liftK > 0.001) {
      busy = true;
      a.noStep = Math.max(a.noStep, liftK);
      go({ wingN: 1.08, wingF: 1.02, pitch: 2, head: -12, crouch: 0, fluff: 0.2, kick: 0.25 + 0.22 * Math.sin(t * 7), tap: 0.5 + 0.5 * Math.sin(t * 9) }, liftK);
      out.beak = Math.max(out.beak ?? 0, (0.45 + 0.15 * Math.sin(t * 5)) * liftK);
      say('joy', liftK);
      q.mouth = 'smile';
      q.tears = liftK;
      q.blush = Math.max(q.blush, liftK);
    }
    const landU = now - (st.rdLandAt ?? -99);
    if (landU >= 0 && landU < 0.8 && m.hp > 0) {
      go({ crouch: 0.35 }, pulse(landU, 0, 0.3));
      out.hop = (out.hop ?? 0) + 0.04 * pulse(landU, 0.22, 0.35);
      say('happy');
    }
    // ---- a hit: a flinch ----
    if (hurt) {
      const k = 1 - sstep(hurtU / 0.45);
      go({ pitch: -8, head: -10, wingN: 0.5, wingF: 0.45, fluff: 0.6 }, k * (busy ? 0.4 : 1));
    }
    // ---- her faces ----
    const low = m.hp > 0 && m.def?.hp && m.hp / m.def.hp < 0.3;
    if (m.hp <= 0) {
      face = 'dizzy';
      q.dizzy = 1;
      q.bowGoal = 0.55;
      q.mouth = 'pout';
      out.beak = Math.max(out.beak ?? 0, 0.2);
    } else if (hurt) {
      face = 'hurt';
      q.mouth = 'pout';
      out.beak = Math.max(out.beak ?? 0, 0.35);
      q.blush = 0.8;
    } else if (!busy) {
      if (mood === 'happy') {
        face = 'happy';
        q.mouth = 'smile';
      } else if (mood === 'angry') {
        face = 'cross';
        q.mouth = 'pout';
      } else if (mood === 'sad') {
        face = 'sad';
        q.mouth = 'pout';
        q.tears = 0.6;
      } else if (mood === 'hurt') {
        face = 'hurt';
        q.mouth = 'pout';
      } else if (mood === 'blink' || mood === 'sleep') {
        face = 'sleep';
        q.z = 1;
        go({ head: 16, pitch: 3, fluff: 0.4 + Math.sin(t * 1.4) * 0.05 }, 1);
      } else if (m.alone) {
        // her partner has fallen: set and cross, huffing steam
        face = 'brave';
        q.mouth = 'pout';
        q.steam = (t * 0.45) % 1;
        go({ pitch: -3, head: -6, fluff: 0.25 }, 1);
      } else if (low) {
        face = 'worried';
        q.mouth = 'pout';
        q.sweat = (t * 0.6) % 1;
      } else if (m.engaged || a.mood === 'angry' || (m.aggroUntil ?? 0) > now) {
        if (face === 'proud') face = 'cross';
      }
    } else if (low && !hurt) q.sweat = (t * 0.6) % 1;
    if (m.alone && m.hp > 0 && busy && !hurt) q.steam = (t * 0.45) % 1;
    // talking: real vowel shapes on her beak (how far it opens, the corner), never a flap
    if ((mood === 'talk' || a.mood === 'talk') && m.hp > 0) {
      const V = [[0.42, 'closed'], [0.18, 'smile'], [0.55, 'closed'], [0.08, 'closed'], [0.3, 'smile'], [0.12, 'pout']];
      const i = Math.floor(t * 6.5) % V.length;
      const j = (i + 1) % V.length;
      const f = sstep((t * 6.5) % 1);
      out.beak = Math.max(out.beak ?? 0, mix(V[i][0], V[j][0], f));
      q.mouth = f < 0.5 ? V[i][1] : V[j][1];
    }
    // a blink at her own rhythm (from her id)
    // (on a smooth curve down and up, its own rhythm from her id)
    const blinkW = ['proud', 'count', 'judge', 'cross', 'happy', 'worried', 'brave', 'skate'].includes(face) ? win((t + (m.uid ?? 0) * 0.53) % 4.1, 0, 0.09, 0.15, 0.27) : 0;
    // (the face's numbers eased from one expression to the next: an in-between, never a snap; a shut
    // face keeps the last open eye's numbers under it, its brows eased too)
    const tv = (FACES[face] ?? st.rdFV ?? FACES.proud).slice();
    if (SHUT[face] && face !== 'blink') [tv[5], tv[6]] = SHUT_BROW[face];
    st.rdFV = (st.rdFV ?? tv).map((v, i) => approach(Number.isFinite(v) ? v : tv[i], tv[i], dt * 13));
    // (a blink is the lid itself coming down; a shut face fades in over the open eye)
    // (asleep is the lids slowly down over the open eyes, the same eased lid a blink uses)
    const shutName = SHUT[face] && face !== 'blink' && face !== 'sleep' ? face : null;
    st.rdSleepK = approach(st.rdSleepK ?? 0, face === 'sleep' ? 1 : 0, dt * 4);
    if (shutName) st.rdShut = shutName;
    st.rdShutK = approach(st.rdShutK ?? (shutName ? 1 : 0), shutName ? 1 : 0, dt * 14);
    st.rdBlink = Math.max(blinkW, sstep(st.rdSleepK));
    q.f = { name: shutName ?? 'open', shutName: st.rdShut ?? 'smug', shutK: st.rdShutK, blink: st.rdBlink, v: st.rdFV, bright: q.bright * (face === 'happy' ? 1.15 : 1) };
    // (the beak's corner eased between a smile, a pout and rest)
    const gT = q.mouth === 'smile' ? 1 : q.mouth === 'pout' ? -1 : 0.25;
    st.rdGape = approach(st.rdGape ?? gT, gT, dt * 12);
    q.gape = st.rdGape;
    const perkGoal = Math.max(q.perk, face === 'startled' || face === 'glee' || face === 'happy' || face === 'joy' ? 1 : face === 'cross' || face === 'brave' || face === 'focus' ? -0.6 : face === 'sad' || face === 'dizzy' || face === 'sleep' ? -1 : 0);
    st.rdPerk = approach(st.rdPerk ?? perkGoal, perkGoal, dt * 8);
    q.perk = st.rdPerk;
    // ---- her springs: the crown tuft, the coat tails, the bow tie ----
    const kick = ((st.rdLastP ?? out.pitch ?? 0) - (out.pitch ?? 0)) * 0.6 + ((st.rdLastH ?? out.head ?? 0) - (out.head ?? 0)) * 0.3;
    st.rdLastP = out.pitch;
    st.rdLastH = out.head;
    // (each half turn of a spin flings the coat tails out)
    const flips = a.rdFlips ?? 0;
    const flipKick = flips !== (st.rdFlipsSeen ?? flips) ? 2.2 : 0;
    st.rdFlipsSeen = flips;
    const stream = Math.max(slideK, liftK * 0.8);
    const gather = q.gather;
    q.plumeSw = [0, 1].map((i) => spring(st, `rdPl${i}`, Math.sin(t * 1.5 + i * 1.7) * 0.04 + stream * 0.25, 90 - i * 14, 7, dt, kick * 0.002 * (i ? 1.2 : 1)));
    q.tails = [
      spring(st, 'rdT0', Math.sin(t * 1.3) * 0.05 + walkW * Math.sin(t * 7.5) * 0.2 + stream * (0.85 + Math.sin(t * 13) * 0.08) - gather * 0.45, 60, 6, dt, kick * 0.004 + flipKick),
      spring(st, 'rdT1', Math.sin(t * 1.3 - 0.7) * 0.06 + walkW * Math.sin(t * 7.5 - 0.8) * 0.2 + stream * (0.2 + Math.sin(t * 13 - 0.8) * 0.12) + gather * 0.2, 45, 4.5, dt, kick * 0.006 + flipKick * 0.6),
      spring(st, 'rdT2', Math.sin(t * 1.3 + 0.9) * 0.05 + walkW * Math.sin(t * 7.5 + 0.5) * 0.2 + stream * (0.75 + Math.sin(t * 13 + 1) * 0.08) - gather * 0.4, 55, 5.5, dt, kick * 0.004 + flipKick * 0.9),
      spring(st, 'rdT3', Math.sin(t * 1.3 + 0.2) * 0.06 + walkW * Math.sin(t * 7.5 - 0.2) * 0.2 + stream * (0.25 + Math.sin(t * 13 - 0.2) * 0.12) + gather * 0.2, 42, 4.5, dt, kick * 0.006 + flipKick * 0.5),
    ];
    q.bow = spring(st, 'rdBow', q.bowGoal + Math.sin(t * 1.1) * 0.02, 120, 8, dt, kick * 0.003);
  },
  // Her extras: the count's numerals, a proud twinkle, the floor's gleam and the slide's polish, the
  // skate's swish, a swing's spark, the ta-da, steam, z's, dizzy stars.
  fx: (ctx, m, a, K) => {
    const q = a.rd;
    const bk = a.bk;
    if (!q || !bk) return;
    const s = K.sc;
    const t = a.t ?? 0;
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const head = bk.hp;
    const crown = add(head, rot([s(0.5), -s(12.5)], bk.ha));
    if (q.count) {
      const { n, u, big } = q.count;
      const e = 1 - (1 - u) ** 3;
      ctx.globalAlpha = Math.min(1, u * 10, (1 - u) * 3);
      const pop = 1 + 0.25 * Math.sin(Math.min(1, u * 4) * Math.PI);
      glyph(ctx, a, n === 3 ? '3!' : String(n), crown[0] + s(6) + (n - 2) * s(2.2), crown[1] - s(1) - e * s(2.4), s(4.2) * big * pop, -0.08 + (n - 2) * 0.08);
      ctx.globalAlpha = 1;
    }
    if (q.big) {
      // a big gold numeral popping over her head (THREE: biggest, with sparkles)
      const { n, u, k, ready } = q.big;
      const pop = ready != null ? 0.5 + 0.5 * sstep(ready) : 1 + 0.3 * Math.sin(Math.min(1, u * 4) * Math.PI);
      ctx.globalAlpha = ready != null ? 0.35 + 0.5 * ready : Math.min(1, u * 10, (1 - u) * 3);
      const y = crown[1] - s(3) - (1 - (1 - u) ** 3) * s(2.5);
      glyph(ctx, a, n === 3 ? '3!' : String(n), crown[0] + s(2), y, s(5.5) * k * pop, -0.06);
      if (n === 3 && ready == null) {
        ctx.fillStyle = '#fff3b8';
        for (let i = 0; i < 4; i++) {
          const an = i * 1.6 + u * 2;
          sparkle(ctx, crown[0] + s(2) + Math.cos(an) * s(7 + u * 4), y + Math.sin(an) * s(5 + u * 3), s(1.1) * (1 - u));
        }
      }
      ctx.globalAlpha = 1;
    }
    if (q.twinkle != null && q.twinkle >= 0 && q.twinkle <= 1) {
      const u = q.twinkle;
      const p = add(head, rot([s(1), s(9.2)], bk.ha));
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, p[0] + s(4), p[1] - s(1), s(1.3) * Math.sin(Math.PI * u) + s(0.4));
      ctx.fillStyle = GOLD[0];
      sparkle(ctx, p[0] + s(6.4), p[1] - s(3.2), s(0.8) * Math.sin(Math.PI * u));
      ctx.globalAlpha = 1;
    }
    if (q.tadah >= 0 && q.tadah <= 1) {
      const u = q.tadah;
      ctx.globalAlpha = Math.sin(Math.PI * u);
      for (let i = 0; i < 5; i++) {
        const an = -Math.PI / 2 + (i - 2) * 0.55;
        ctx.fillStyle = i % 2 ? '#fff3b8' : '#ffffff';
        sparkle(ctx, crown[0] + Math.cos(an) * s(6 + u * 6), crown[1] + s(4) + Math.sin(an) * s(5 + u * 5), s(1.2) * (1 - u * 0.5));
      }
      ctx.globalAlpha = 1;
    }
    // the floor ahead beginning to gleam as she winds up
    if (q.gleam > 0.01) {
      const g = q.gleam;
      const x0 = bk.pivot[0] + s(6);
      lane(ctx, x0, s(26) + g * s(14), s(1.3), 0.55 * g);
      for (let i = 0; i < 4; i++) {
        const v = (t * 0.9 + i * 0.27) % 1;
        ctx.globalAlpha = Math.sin(Math.PI * v) * g;
        ctx.fillStyle = i % 2 ? POLISH[0] : POLISH[2];
        sparkle(ctx, x0 + s(4) + i * s(8.5), -s(0.8) - v * s(1.6), s(0.7 + (i % 2) * 0.4));
      }
      ctx.globalAlpha = 1;
    }
    // the slide's wake: a polish streak along the floor behind her belly, sparkles kicked up
    if (q.slide > 0.3) {
      const f = sstep((q.slide - 0.3) / 0.7);
      const belly = bk.at([7.6, 1.5]);
      const back = bk.at([-8, 2]);
      const xs = back[0] - s(30);
      lane(ctx, xs, belly[0] - xs + s(2), s(1.7), 0.9 * f, true);
      for (let i = 0; i < 6; i++) {
        const v = (t * 1.6 + i / 6) % 1;
        const ahead = i % 2 === 0;
        const x = ahead ? belly[0] + s(4) + v * s(8) : back[0] - s(2) - v * s(24);
        ctx.globalAlpha = Math.sin(Math.PI * v) * f;
        ctx.fillStyle = i % 3 === 0 ? POLISH[0] : i % 3 === 1 ? POLISH[2] : '#ffe8f0';
        sparkle(ctx, x, -s(1.2) - v * s(ahead ? 4.5 : 3), s(ahead ? 1.2 : 0.9) * (1 - v * 0.4));
      }
      ctx.globalAlpha = 0.55 * f;
      pen(ctx, '#ffffff', s(0.6));
      for (let i = 0; i < 3; i++) {
        const y = back[1] - s(2 + i * 2.6);
        const off = ((t * 2 + i * 0.3) % 1) * s(4);
        ctx.beginPath();
        ctx.moveTo(back[0] - s(2 + i * 1.5) - off, y);
        ctx.quadraticCurveTo(back[0] - s(6 + i * 2) - off, y - s(0.4), back[0] - s(10 + i * 3) - off, y + s(0.3));
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // the skate: two thin swishes off her feet, a glint
    if (q.skate > 0.01) {
      const ft = lerp2(bk.legs.legN.P, bk.legs.legF.P, 0.5);
      ctx.globalAlpha = 0.7;
      pen(ctx, POLISH[1], s(0.5));
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(ft[0] - s(2), -s(0.4 + i * 0.6));
        ctx.quadraticCurveTo(ft[0] - s(10), -s(0.6 + i * 0.9), ft[0] - s(18 + i * 4), -s(0.2));
        ctx.stroke();
      }
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, ft[0] - s(8) - ((t * 3) % 1) * s(8), -s(1.4), s(0.8));
      ctx.globalAlpha = 1;
    }
    // a swing's spark: off her flipper's end or her beak
    if (q.spark && q.spark.u >= 0) {
      const p = q.spark.at === 'wing' ? bk.wings.near.tip : bk.beakTip;
      const u = q.spark.u;
      ctx.globalAlpha = 1 - u;
      ctx.fillStyle = '#ffffff';
      sparkle(ctx, p[0] + s(2), p[1], s(2.6) * (0.5 + u));
      ctx.fillStyle = GOLD[0];
      for (let i = 0; i < 4; i++) {
        const an = i * (TAU / 4) + 0.5;
        sparkle(ctx, p[0] + s(2) + Math.cos(an) * s(3 + u * 5), p[1] + Math.sin(an) * s(3 + u * 5), s(0.9) * (1 - u));
      }
      ctx.globalAlpha = 1;
    }
    // huffing steam (alone and cross): two little puffs off her beak
    if (q.steam >= 0) {
      const tip = bk.beakTip;
      for (let i = 0; i < 2; i++) {
        const v = (q.steam + i * 0.5) % 1;
        if (v > 0.6) continue;
        const k = v / 0.6;
        ctx.globalAlpha = Math.sin(Math.PI * k) * 0.8;
        ell(ctx, tip[0] + s(1.5) + k * s(4), tip[1] - s(1) - k * s(4) - i * s(1), s(1.1) + k * s(1.3), s(0.9) + k * s(1));
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // asleep: a little navy "z" drifting up off her head
    if (q.z > 0) {
      for (let i = 0; i < 2; i++) {
        const u = (t * 0.35 + i * 0.5) % 1;
        const z = s(1.6) + u * s(1.2);
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95;
        ctx.save();
        ctx.translate(crown[0] + s(4) + u * s(4), crown[1] + s(3) - u * s(6));
        if (a.flip) ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(-z * 0.5, -z * 0.5);
        ctx.lineTo(z * 0.5, -z * 0.5);
        ctx.lineTo(-z * 0.5, z * 0.5);
        ctx.lineTo(z * 0.5, z * 0.5);
        pen(ctx, '#ffffff', 1.3);
        ctx.stroke();
        pen(ctx, '#5a68b0', 0.65);
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    // beaten: soft dizzy stars wheeling round her head
    if (q.dizzy > 0) {
      for (let i = 0; i < 3; i++) {
        const an = t * 2.4 + (i * TAU) / 3;
        const x = crown[0] + Math.cos(an) * s(6);
        const y = crown[1] + s(3) + Math.sin(an) * s(1.8);
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(an);
        ctx.fillStyle = i % 2 ? '#fff3b8' : '#ffd6e8';
        sparkle(ctx, x, y, s(1.3));
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  },
};
// (a value easing toward its goal at a rate, never past it)
function approach(v, goal, k) {
  return v + (goal - v) * Math.min(1, Math.max(0, k));
}
// The slide's wind-up after any skate: a crouch, leaning in, flippers swept back, counting it in
// "1... 2... 3!", her rump wiggling, the floor ahead starting to gleam; deepest at its end.
function crouchCount(u, dur, out, q, go, say) {
  const k0 = sstep(u / 0.4);
  const wk = sstep(u / Math.max(0.3, dur));
  const deep = sstep((u - (dur - 0.55)) / 0.55);
  const wig = Math.sin(u * 13) * (1 - deep);
  go({ crouch: 0.3 + 0.4 * wk + 0.35 * deep, pitch: 12 + 16 * wk + 12 * deep, wingN: 0.55 + 0.25 * wk + 0.15 * deep, wingF: 0.5 + 0.25 * wk + 0.15 * deep, reach: 0.15 + 0.1 * deep, head: -12 - 8 * wk - 6 * deep, tailUp: 10 + wig * 10, x: -0.035 * deep, fluff: 0.15 * deep, kick: 0 }, k0);
  out.tap = Math.max(0, Math.sin(u * 8.6)) * 0.8 * (1 - deep) * k0;
  say('focus');
  for (const [i, b] of [[1, 0.13], [2, 0.4], [3, 0.67]]) {
    const v = u - b * dur;
    if (v >= 0 && v < 0.8) q.count = { n: i, u: v / 0.8, big: i === 3 ? 1.3 : 1 };
    out.beak = Math.max(out.beak ?? 0, pulse(u, b * dur, 0.3) * (i === 3 ? 0.55 : 0.35));
  }
  q.mouth = 'pout';
  q.gleam = sstep((u - 0.2) / Math.max(0.3, dur - 0.2));
}
// Her idle act: counting the step out loud, a judging side-eye, the bow tie slipping askew and
// patted straight, very pleased with herself.
function idleAct(m, a, out, q, go, say, calm, t) {
  const lu = (((t + ((m.uid ?? 0) % 5) * 2.7) % CYCLE) + CYCLE) % CYCLE;
  const cnt = win(lu, 0.4, 0.7, 3.9, 4.3) * calm;
  if (cnt > 0.01) {
    for (let i = 0; i < 6; i++) {
      const b = 0.75 + i * 0.52;
      const p = pulse(lu, b - 0.06, 0.32);
      out.tap = (out.tap ?? 0) + p * cnt;
      out.head = (out.head ?? 0) + p * (i % 3 === 2 ? -9 : 5) * cnt;
      out.pitch = (out.pitch ?? 0) + p * (i % 3 === 2 ? -3 : 1.2) * cnt;
      out.beak = Math.max(out.beak ?? 0, pulse(lu, b, 0.26) * (i % 3 === 2 ? 0.5 : 0.32) * cnt);
      if (lu >= b && lu < b + 0.5 && cnt > 0.5) q.count = { n: (i % 3) + 1, u: (lu - b) / 0.5, big: i % 3 === 2 ? 1.25 : 0.95 };
    }
    say('count', cnt);
  }
  const jd = win(lu, 4.5, 4.75, 5.9, 6.2) * calm;
  go({ head: 3, pitch: -1 }, jd);
  say('judge', jd);
  if (jd > 0.45) q.mouth = 'pout';
  q.bowGoal = 0.42 * win(lu, 6.4, 6.6, 7.7, 8.0);
  const look2 = win(lu, 6.6, 6.75, 7.2, 7.35) * calm;
  go({ head: 12, reach: -0.25 }, look2);
  say('startled', look2);
  const pat = win(lu, 7.15, 7.45, 8.2, 8.55) * calm;
  go({ wingN: -0.92 + Math.sin(lu * 22) * 0.06 * pat, head: -14, pitch: -4, fluff: 0.15 }, pat);
  say('count', pat);
  const smug = win(lu, 8.35, 8.6, 10.0, 10.5) * calm;
  go({ head: -14, pitch: -4, fluff: 0.3 }, smug);
  say('smug', smug);
  if (smug > 0.4) q.mouth = 'smile';
  q.blush = Math.max(q.blush, smug * 0.6);
  if (lu > 8.35 && lu < 9.2) q.twinkle = (lu - 8.35) / 0.85;
}
// The polished floor: a long soft gleam lying on the floor (y = 0), gold-white, its bright core a
// thin line; `hot` the slide's wake (brightest at its front end).
function lane(ctx, x0, len, h, al, hot = false) {
  if (al <= 0.01 || len <= 0) return;
  ctx.save();
  // (a soft gold glow round it on the boards first, then the gleam, then its bright core)
  const gg = ctx.createLinearGradient(x0, 0, x0 + len, 0);
  gg.addColorStop(0, `rgba(242,198,106,${hot ? 0 : 0.4 * al})`);
  gg.addColorStop(hot ? 0.6 : 0.4, `rgba(242,198,106,${0.4 * al})`);
  gg.addColorStop(1, `rgba(242,198,106,${hot ? 0.45 * al : 0})`);
  ctx.fillStyle = gg;
  ctx.beginPath();
  ctx.ellipse(x0 + len / 2, -h * 0.1, len / 2 + h, h * 1.7, 0, 0, TAU);
  ctx.fill();
  const g = ctx.createLinearGradient(x0, 0, x0 + len, 0);
  if (hot) {
    g.addColorStop(0, 'rgba(255,230,160,0)');
    g.addColorStop(0.5, `rgba(255,240,190,${0.8 * al})`);
    g.addColorStop(1, `rgba(255,252,240,${al})`);
  } else {
    g.addColorStop(0, `rgba(255,246,216,${0.85 * al})`);
    g.addColorStop(0.6, `rgba(255,230,160,${0.5 * al})`);
    g.addColorStop(1, 'rgba(255,220,140,0)');
  }
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(x0 + len / 2, -h * 0.15, len / 2, h, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = g;
  ctx.globalAlpha = 1;
  ctx.lineWidth = h * 0.35;
  ctx.beginPath();
  ctx.moveTo(x0 + len * 0.08, -h * 0.1);
  ctx.lineTo(x0 + len * 0.96, -h * 0.1);
  ctx.stroke();
  ctx.restore();
}
// Text the right way round even when she faces left: bold, round, a white rim, her navy.
function glyph(ctx, a, text, x, y, sz, rotA, col = '#d99a2e') {
  ctx.save();
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.rotate(rotA);
  ctx.font = `900 ${sz.toFixed(2)}px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#3a4688';
  ctx.lineWidth = sz * 0.42;
  ctx.strokeText(text, 0, 0);
  ctx.strokeStyle = '#fff8e8';
  ctx.lineWidth = sz * 0.22;
  ctx.strokeText(text, 0, 0);
  ctx.fillStyle = col;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// (her size as drawn, standing, measured on the concept sheet: from her coat tails to her beak, her
// toes to the tops of her plumes; the base's own walking pace at her size)
const BUILT = dressedBird(look);
// Round her rig: the spins (a clean mirror flip at each half turn: the Tailcoat Twirl's release,
// the entrance's spin-stop) and the Grand Lift (carried m.lift.y px up, eased back down).
const rig = BUILT.art.rig;
const draw0 = rig.draw;
const TWIRL = [0.06, 0.16, 0.26, 0.36];
const SPINSTOP = [0.1, 0.24, 0.38, 0.52];
rig.draw = (ctx, m, a) => {
  const st = (a.mo.rig ??= {});
  const now = a.now ?? a.t ?? 0;
  let flips = 0;
  const act = m.cine?.act;
  if (act?.move === 'spinstop') flips = SPINSTOP.filter((v) => now - act.at >= v).length;
  else if (st.rdLast?.pose === 'twirl' && !m.cast && Math.abs((m.attackAt ?? -99) - st.rdLast.at) < 0.25) flips = TWIRL.filter((v) => now - st.rdLast.at >= v).length;
  a.rdFlips = flips;
  const dt = Math.min(0.1, Math.max(0, a.dt ?? 0));
  const goal = m.lift && m.hp > 0 ? Math.max(0, Number(m.lift.y) || 0) : 0;
  if (!Number.isFinite(st.rdUp)) st.rdUp = 0;
  st.rdUp = m.lift ? goal : (st.rdUp ?? 0) + (goal - (st.rdUp ?? 0)) * Math.min(1, dt * 9);
  if (st.rdUp < 0.05) st.rdUp = 0;
  ctx.save();
  if (st.rdUp > 0) ctx.translate(0, -st.rdUp);
  // (the rig mirrors itself by a.flip: a half turn is that flip, its text still reading the right way)
  if (flips % 2) a.flip = !a.flip;
  draw0(ctx, m, a);
  ctx.restore();
};
// Her art entry, her size as drawn (standing: from her coat tails to her beak, her toes to the top of
// her crown tuft) and her walking pace (a waddle at 40, her stride matched to it: no sliding feet).
export const DAME_RONDO = { ...BUILT, w: 49, h: 80, speed: 40 };
DAME_RONDO.art.noHop = true;
