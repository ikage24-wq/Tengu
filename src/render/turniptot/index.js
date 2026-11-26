// The Turnip Tot (2026-11-25, remade on the veggie critter base, the player's pick "A" of three, the
// Mufflebeet): Clover Hills' level 4 root-cellar critter, a round ruby beet who is always a little
// chilly down in the cellar. Wrapped in a chunky mustard knitted scarf (two cream stripes, a plump
// knot at the front, one end hanging over its tummy, the long end streaming out behind on springs),
// beet greens with ruby stems and veins on top, a curly tap-root tail. Cosy half-lidded amber eyes,
// rosy cold cheeks, a small content smile. It moves on its own copy of the veggie critter base
// (veggiebase.js: its bones, waddle, springs and moves), dressed here.
//   idle    a 30 s act (see its pose below):
//           - a shiver, snuggled right down into the scarf (its mouth hidden); a tickle, "a-a-",
//             and a huge ACHOO that whips its leaves forward and puffs a sparkly cloud; a sniffle and
//             a pleased wiggle;
//           - it blows on its little root-hands to warm them (soft warm wisps), rubs them, happy;
//           - a sunbeam breaks through just ahead: it spots it, shuffles over in two little hops and
//             melts into the warmth (leaves flopped, scarf loosened, a heart), then hops back home as
//             the beam fades;
//           - it re-ties its scarf, tongue out with concentration; a yank flips the long end up over
//             its head and snags its leaves; a puzzled wobble, a big shake, the leaves pop free with a
//             sparkle; it pats the scarf smooth, proud;
//           - a stomp-dance to warm up: four stomps rocking side to side, arms pumping, little dust
//             puffs, and a ta-da.
//   moves   (def.moves order) the sneeze blast (a breath in, leaves perking up, then ACHOO: a sparkly
//           cloud bursting out close in front of it), the scarf whip (wound back, the hanging scarf
//           end flung up by its shoulder, then unspooled and swung on over the top to lash out level in
//           front on its spring, a recoil, a second little flick, reeled back in down the front), the bonk (the
//           base's headbutt).
//   faces   hurt (squeezed shut), focused before a move (lids set low at the inner corners), wide
//           (surprised), a sneezy squint, a blissful melt, content, sad, happy, asleep (napping half
//           planted in the soil, snuggled up to its eyes in the scarf, a little ruby "z"), and soft
//           swirl eyes when it's beaten.
// Everything drawn here from scratch (the face too).
import { dressedVeggie } from './veggiebase.js';

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
const sparkle = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.quadraticCurveTo(x, y, x + s, y);
  ctx.quadraticCurveTo(x, y, x, y + s);
  ctx.quadraticCurveTo(x, y, x - s, y);
  ctx.quadraticCurveTo(x, y, x, y - s);
  ctx.fill();
};
const heart = (ctx, x, y, s) => {
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
};
const blush = (ctx, a, K, x, y, rx, ry, col, al) => {
  const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, K.tint(a, col, al));
  g.addColorStop(1, K.tint(a, col, 0));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  ctx.translate(-x, -y);
  ctx.fillStyle = g;
  ctx.fillRect(x - rx, y - rx, rx * 2, rx * 2);
  ctx.restore();
};
// (a soft path through points: midpoints joined by quadratic curves)
function smooth(ctx, pts) {
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  ctx.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const m1 = mid(pts[i], pts[(i + 1) % n]);
    ctx.quadraticCurveTo(pts[i][0], pts[i][1], m1[0], m1[1]);
  }
  ctx.closePath();
}

const EYE_INK = '#5c1236';
const LID = '#cf3d74';
const RUBY = '#b02a62';
const SC = { base: '#f2b843', lt: '#ffe08a', sh: '#cf8d2a', deep: '#a8681c', stripe: '#fff3d6' };
const PUFF = ['#fff4f7', '#f3c4d4'];

// ---------- Its eyes ----------
// A closed eye: a soft lash curve (asleep, blinking), a happy arc, a blissful melt, or squeezed tight.
function shut(ctx, a, K, x, y, rx, ry, kind) {
  ctx.strokeStyle = K.colour(a, EYE_INK);
  ctx.lineWidth = 0.46;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  if (kind === 'happy') {
    ctx.moveTo(x - rx, y + ry * 0.25);
    ctx.quadraticCurveTo(x, y - ry * 0.8, x + rx, y + ry * 0.25);
  } else if (kind === 'melt') {
    ctx.moveTo(x - rx, y - ry * 0.05);
    ctx.quadraticCurveTo(x, y + ry * 0.45, x + rx, y + ry * 0.1);
    ctx.stroke();
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(x - rx * 0.95, y - ry * 0.05);
    ctx.quadraticCurveTo(x - rx * 1.25, y - ry * 0.05, x - rx * 1.4, y + ry * 0.2);
  } else if (kind === 'squeeze') {
    ctx.moveTo(x - rx * 0.85, y - ry * 0.45);
    ctx.quadraticCurveTo(x + rx * 0.1, y - ry * 0.1, x + rx * 0.6, y + ry * 0.02);
    ctx.quadraticCurveTo(x + rx * 0.1, y + ry * 0.14, x - rx * 0.85, y + ry * 0.5);
  } else {
    ctx.moveTo(x - rx, y + ry * 0.05);
    ctx.quadraticCurveTo(x, y + ry * 0.62, x + rx, y);
  }
  ctx.stroke();
}
// The lid's line for each look: [outer, inner, arch] (how far above the eye's middle, in eye heights,
// at its outer and inner corners, and how much it arches between).
const LIDS = { open: [0.1, 0.2, 0.6], focus: [0.6, -0.08, 0.12], sad: [-0.08, 0.62, 0.18], wide: [1.05, 1.05, 0.1] };
// A cosy eye: a wide oval, a warm amber iris (a deep rim, honey, gold low down), a soft brown pupil, a
// big round glint and a little one, the heavy lid in its own skin, two lashes at the outer corner, a
// pink lower lid. `inner`: which way its inner corner is (+1 the near eye, -1 the far one).
function eye(ctx, a, K, x, y, k, inner, f, up = 0) {
  const rx = 1.8 * k;
  const ry = 1.72;
  if (f === 'dead') {
    // a soft swirl
    ctx.strokeStyle = K.colour(a, EYE_INK);
    ctx.lineWidth = 0.38;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= 26; i++) {
      const u = i / 26;
      const th = u * TAU * 1.6;
      const r = 0.15 + u * 1.15;
      const p = [x + Math.cos(th) * r * k, y + Math.sin(th) * r * 0.95];
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    ctx.stroke();
    return;
  }
  if (f === 'hurt' || f === 'squint') return shut(ctx, a, K, x, y, rx, ry, 'squeeze');
  if (f === 'sleep' || f === 'blink') return shut(ctx, a, K, x, y + ry * 0.25, rx, ry, 'shut');
  if (f === 'happy') return shut(ctx, a, K, x, y, rx, ry, 'happy');
  if (f === 'melt') return shut(ctx, a, K, x, y + ry * 0.2, rx, ry, 'melt');
  const wide = f === 'wide';
  ell(ctx, x, y, rx, ry);
  ctx.fillStyle = K.colour(a, '#fff8f4');
  ctx.fill();
  ctx.save();
  ell(ctx, x, y, rx, ry);
  ctx.clip();
  const ix = x + rx * 0.12 * inner;
  const iy = y + ry * 0.08 - up * ry * 0.3;
  const ps = wide ? 0.72 : 1;
  ell(ctx, ix, iy, rx * 0.74, ry * 0.92);
  ctx.fillStyle = K.colour(a, '#6a2a14');
  ctx.fill();
  ell(ctx, ix, iy + ry * 0.06, rx * 0.62, ry * 0.8);
  ctx.fillStyle = K.colour(a, '#c06a26');
  ctx.fill();
  ell(ctx, ix, iy + ry * 0.42, rx * 0.5, ry * 0.36);
  ctx.fillStyle = K.colour(a, '#f4b84e');
  ctx.fill();
  ell(ctx, ix + rx * 0.04 * inner, iy - ry * 0.02, rx * 0.34 * ps, ry * 0.44 * ps);
  ctx.fillStyle = K.colour(a, '#3a140c');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, ix - rx * 0.28 * inner, iy - ry * 0.08, rx * 0.24, ry * 0.24);
  ctx.fill();
  ell(ctx, ix + rx * 0.32 * inner, iy + ry * 0.42, rx * 0.11, ry * 0.1);
  ctx.fill();
  if (wide) {
    ell(ctx, ix + rx * 0.2 * inner, iy - ry * 0.4, rx * 0.09, ry * 0.08);
    ctx.fill();
  }
  ctx.restore();
  // the lid, in its own skin (clipped a touch wider than the eye, so no light ring shows round it)
  const [o, n, arch] = LIDS[f] ?? LIDS.open;
  const yl = y - ry * (inner > 0 ? o : n);
  const yr = y - ry * (inner > 0 ? n : o);
  const ym = (yl + yr) / 2 - ry * arch;
  if (!wide) {
    ctx.save();
    ell(ctx, x, y, rx * 1.12, ry * 1.1);
    ctx.clip();
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.3, y - ry * 1.4);
    ctx.lineTo(x + rx * 1.3, y - ry * 1.4);
    ctx.lineTo(x + rx * 1.3, yr);
    ctx.quadraticCurveTo(x, ym, x - rx * 1.3, yl);
    ctx.closePath();
    ctx.fillStyle = K.colour(a, LID);
    ctx.fill();
    ctx.restore();
  }
  // the lid's edge, and two lashes flicked out at the outer corner (the near eye's)
  ctx.save();
  ell(ctx, x, y, rx * 1.02, ry * 1.04);
  ctx.clip();
  ctx.strokeStyle = K.colour(a, EYE_INK);
  ctx.lineCap = 'round';
  ctx.lineWidth = 0.36;
  ctx.beginPath();
  if (wide) ctx.ellipse(x, y, rx, ry, 0, Math.PI * 1.12, Math.PI * 1.88);
  else {
    ctx.moveTo(x - rx * 1.3, yl);
    ctx.quadraticCurveTo(x, ym, x + rx * 1.3, yr);
  }
  ctx.stroke();
  ctx.restore();
  if (k > 0.9) {
    // (where the lid line meets the eye's outer edge)
    const ly = wide ? y - ry * 0.5 : mix(yl, ym, 0.12);
    const ex = x - Math.sqrt(Math.max(0.05, 1 - ((ly - y) / ry) ** 2)) * rx;
    ctx.strokeStyle = K.colour(a, EYE_INK);
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(ex + 0.05, ly + 0.02);
    ctx.quadraticCurveTo(ex - rx * 0.3, ly + ry * 0.02, ex - rx * 0.44, ly + ry * 0.24);
    ctx.moveTo(ex + rx * 0.14, ly - ry * 0.04);
    ctx.quadraticCurveTo(ex - rx * 0.16, ly - ry * 0.2, ex - rx * 0.34, ly - ry * 0.12);
    ctx.stroke();
  }
  ctx.strokeStyle = K.colour(a, '#ff9ec0');
  ctx.lineWidth = 0.3;
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.98, ry * 0.98, 0, Math.PI * 0.22, Math.PI * 0.78);
  ctx.stroke();
}
// Its mouth (the face's frame): a small content smile, a wavy shiver, an open "o", a pucker to blow,
// a grin, a set little line, a frown, a tongue tip out with concentration.
function mouth(ctx, a, K, bk, f) {
  const tt = a.tt ?? {};
  const mx = 0.3;
  const my = 2.55;
  ctx.strokeStyle = K.colour(a, EYE_INK);
  ctx.lineWidth = 0.36;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const open = Math.max(bk.open, tt.open ?? 0);
  const fillO = (rx, ry, oy) => {
    ell(ctx, mx, my + oy, rx, ry);
    ctx.fillStyle = K.colour(a, '#7a1438');
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ell(ctx, mx, my + oy, rx, ry);
    ctx.clip();
    ell(ctx, mx + 0.08, my + oy + ry * 0.7, rx * 0.8, ry * 0.55);
    ctx.fillStyle = K.colour(a, '#ff8fb2');
    ctx.fill();
    ctx.restore();
  };
  if (f === 'dead') {
    ctx.beginPath();
    ctx.moveTo(mx - 0.6, my + 0.2);
    ctx.quadraticCurveTo(mx, my - 0.15, mx + 0.6, my + 0.2);
    ctx.stroke();
    return;
  }
  if ((tt.pucker ?? 0) > 0.3) {
    ell(ctx, mx + 0.25, my + 0.1, 0.38, 0.42);
    ctx.fillStyle = K.colour(a, '#7a1438');
    ctx.fill();
    ctx.stroke();
    return;
  }
  if (open > 0.12) return fillO(0.6 + open * 0.35, 0.35 + open * 0.7, 0.1 + open * 0.3);
  if (f === 'grin') {
    ctx.beginPath();
    ctx.moveTo(mx - 0.95, my - 0.15);
    ctx.quadraticCurveTo(mx, my + 0.05, mx + 0.95, my - 0.15);
    ctx.quadraticCurveTo(mx + 0.6, my + 1.25, mx, my + 1.25);
    ctx.quadraticCurveTo(mx - 0.6, my + 1.25, mx - 0.95, my - 0.15);
    ctx.closePath();
    ctx.fillStyle = K.colour(a, '#7a1438');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, mx + 0.1, my + 1.1, 0.7, 0.45);
    ctx.fillStyle = K.colour(a, '#ff8fb2');
    ctx.fill();
    ctx.restore();
    ctx.stroke();
    return;
  }
  ctx.beginPath();
  if (f === 'focus') {
    ctx.moveTo(mx - 0.6, my + 0.12);
    ctx.quadraticCurveTo(mx, my - 0.05, mx + 0.6, my + 0.05);
  } else if (f === 'sad' || f === 'hurt') {
    ctx.moveTo(mx - 0.65, my + 0.3);
    ctx.quadraticCurveTo(mx, my - 0.2, mx + 0.65, my + 0.3);
  } else if ((a.S?.shake ?? 0) > 0.15) {
    // (a little wavy chilly mouth, trembling)
    const tr = 0.25 * Math.sin((a.now ?? 0) * 40);
    ctx.moveTo(mx - 0.95, my + 0.05);
    ctx.bezierCurveTo(mx - 0.7, my - 0.3 + tr, mx - 0.45, my + 0.4, mx - 0.15, my + 0.12 - tr);
    ctx.bezierCurveTo(mx + 0.15, my - 0.2, mx + 0.45, my + 0.42 + tr, mx + 0.9, my - 0.02);
  } else {
    ctx.moveTo(mx - 0.75, my - 0.1);
    ctx.quadraticCurveTo(mx, my + 0.62, mx + 0.75, my - 0.1);
  }
  ctx.stroke();
  if ((tt.mlem ?? 0) > 0.2) {
    ell(ctx, mx + 0.45, my + 0.42, 0.32, 0.34 * tt.mlem);
    ctx.fillStyle = K.colour(a, '#ff8fb2');
    ctx.fill();
  }
}
function face(ctx, a, bk, K) {
  const F = K.P.face;
  K.frameAt(ctx, a, F.y);
  const lk = clamp(bk.look ?? 0, -1.2, 1.2);
  ctx.translate(F.x + lk * 0.9, F.y);
  const tt = a.tt ?? {};
  let f = tt.face ?? 'open';
  if (f === 'open' && ((a.t ?? 0) + 0.7) % 4.3 < 0.13) f = 'blink';
  const up = tt.up ?? 0;
  const warm = 0.75 + (tt.blush ?? 0) * 0.25;
  blush(ctx, a, K, -2.4, 1.75, 1.9, 1.0, '#ff9cc0', warm);
  blush(ctx, a, K, 2.6, 1.6, 1.0, 0.75, '#ff9cc0', warm * 0.8);
  eye(ctx, a, K, 1.85, -0.15, 0.68, -1, f, up);
  eye(ctx, a, K, -1.95, 0, 1, 1, f, up);
  mouth(ctx, a, K, bk, f);
}

// ---------- The scarf ----------
// A scarf tail: links on springs from a root (all its springs start at rest, from the first frame).
function chain(a, K, key, root, ang0, n, seg, curl, k0, flutter, c0 = 13) {
  const st = a.mo.rig;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const m = a.vgM ?? {};
  const sx = a.flip ? -1 : 1;
  const acc = K.feel(st, `${key}F`, [root[0] + sx * (m.x ?? 0), root[1] + (m.y ?? 0)], dt, a.flip);
  const ch = (st[key] ??= []);
  let p = root;
  let prev = 0;
  const out = [p];
  const t = a.t ?? 0;
  for (let i = 0; i < n; i++) {
    const wav = Math.sin(t * 5.2 - i * 1.1) * flutter * (0.4 + 0.6 * clamp(a.walkW ?? 0, 0, 1));
    const goal = i === 0 ? ang0 + wav * 0.5 * D2R : prev + (curl + wav) * D2R;
    const s = (ch[i] ??= { x: goal, v: 0 });
    if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) Object.assign(s, { x: goal, v: 0 });
    prev = K.swing(s, goal, k0 - i * 40, c0 - i, K.shove(s.x, acc, 0.3), dt, 1.1);
    p = K.plus(p, [Math.cos(prev) * seg, Math.sin(prev) * seg]);
    if (p[1] > -0.4 && (a.bk.sink ?? 0) < 0.02) p[1] = -0.4;
    out.push(p);
  }
  return out;
}
// Both tails, once a frame: the long end streaming out behind (flipped up over its head when it
// snags its leaves), the end hanging over its tummy (unspooled and lashed out in a scarf whip).
function scarf(a, K) {
  if (a.ttFrame === a.bk) return a.ttScarf;
  a.ttFrame = a.bk;
  const bk = a.bk;
  const S = a.S ?? {};
  const tg = clamp(a.tt?.tangle ?? 0, 0, 1);
  const backAng = bk.ang + mix(168, -100, tg) * D2R;
  const back = chain(a, K, 'ttBack', K.at(a, [-8.6, -6.8]), backAng, 5, 1.5 * (1 + 0.75 * tg), mix(-8, 24, tg), 260, 9 * (1 - tg));
  // (the whip: its angle swung round over the top and on down the front, never back the way it came)
  const off = a.tt?.whipOff ?? 0;
  const wl = clamp(a.tt?.whipLen ?? 0, 0, 1);
  const front = chain(a, K, 'ttFront', K.at(a, [3.4, -5.6]), bk.ang + (96 + off) * D2R, 4, 1.2 * (1 + 1.4 * wl), 3 - wl * 4, 300 + wl * 700, 3, 13 + wl * 19);
  return (a.ttScarf = { back, front });
}
// (one tail: a soft knitted strip, a cream stripe near its end, ribs along it, a fringe)
function tail(ctx, a, K, mode, pts, w) {
  ctx.beginPath();
  for (let i = 0; i < pts.length - 1; i++) K.capsule(ctx, pts[i], pts[i + 1], w / 2, (w * 0.94) / 2);
  const e = pts[pts.length - 1];
  const p = pts[pts.length - 2];
  const th = Math.atan2(e[1] - p[1], e[0] - p[0]);
  for (const s of [-0.32, 0, 0.32]) {
    const b = K.plus(e, [Math.cos(th + Math.PI / 2) * s * w, Math.sin(th + Math.PI / 2) * s * w]);
    K.capsule(ctx, b, K.plus(b, [Math.cos(th) * 1.1, Math.sin(th) * 1.1]), 0.36, 0.3);
  }
  if (mode === 'line') return K.edge(ctx);
  ctx.fillStyle = K.colour(a, SC.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  const at = (i, v) => {
    const q = pts[i];
    const r = pts[Math.min(i + 1, pts.length - 1)];
    const o = pts[Math.max(i - 1, 0)];
    const th2 = Math.atan2(r[1] - o[1], r[0] - o[0]);
    return [q[0] - Math.sin(th2) * v, q[1] + Math.cos(th2) * v];
  };
  ctx.lineCap = 'round';
  const si = Math.max(1, pts.length - 2);
  ctx.strokeStyle = K.colour(a, SC.stripe);
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(...at(si, -w * 0.6));
  ctx.lineTo(...at(si, w * 0.6));
  ctx.stroke();
  ctx.strokeStyle = K.tint(a, SC.sh, 0.55);
  ctx.lineWidth = 0.26;
  for (const v of [-0.22, 0.22]) {
    ctx.beginPath();
    pts.forEach((_, i) => (i ? ctx.lineTo(...at(i, v * w)) : ctx.moveTo(...at(i, v * w))));
    ctx.stroke();
  }
  ctx.strokeStyle = K.tint(a, SC.deep, 0.35);
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  pts.forEach((_, i) => (i ? ctx.lineTo(...at(i, w * 0.5)) : ctx.moveTo(...at(i, w * 0.5))));
  ctx.stroke();
  ctx.restore();
}
// The wrap round its middle (body units), its top edge lifting at the front as it snuggles in.
function band(a) {
  const sn = Math.max(-0.6, a.S?.snug ?? 0);
  const lift = (x) => sn * 2.1 * sstep((x + 2) / 8);
  return [
    [-9.7, -8.9], [-5, -8.35 - lift(-5) * 0.4], [0, -8.1 - lift(0)], [4.5, -8.3 - lift(4.5)], [8.4, -8.75 - lift(8.4)], [9.9, -8.2 - lift(9.6) * 0.7],
    [10.2, -6.6], [9.4, -5.0], [5, -4.5], [0, -4.35], [-5, -4.5], [-9.3, -5.0], [-10.1, -6.8],
  ];
}
function wrap(ctx, a, K, mode) {
  const local = band(a);
  ctx.beginPath();
  smooth(ctx, local.map((p) => K.at(a, p)));
  if (mode === 'line') return K.edge(ctx);
  ctx.fillStyle = K.colour(a, SC.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.lineCap = 'round';
  for (let x = -9.4; x <= 9.6; x += 1.05) {
    const top = mix(local[1][1], local[3][1], (x + 5) / 9.5);
    ctx.strokeStyle = K.tint(a, SC.sh, 0.5);
    ctx.lineWidth = 0.24;
    ctx.beginPath();
    ctx.moveTo(...K.at(a, [x, top + 0.3]));
    ctx.quadraticCurveTo(...K.at(a, [x + 0.25, (top - 4.4) / 2]), ...K.at(a, [x, -4.4]));
    ctx.stroke();
  }
  for (const yy of [-6.9, -5.6]) {
    ctx.strokeStyle = K.colour(a, SC.stripe);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(...K.at(a, [-10.5, yy - 0.1]));
    ctx.quadraticCurveTo(...K.at(a, [0, yy + 0.35]), ...K.at(a, [10.5, yy - 0.2]));
    ctx.stroke();
  }
  K.blob(ctx, a, SC.deep, K.at(a, [-7.5, -6.2]), 4.5, 3.5, a.bk.ang, 0.55);
  K.blob(ctx, a, SC.sh, K.at(a, [0, -4.4]), 11, 1.3, a.bk.ang, 0.7);
  K.blob(ctx, a, SC.lt, K.at(a, [2.5, -8.0]), 6, 1.2, a.bk.ang, 0.85);
  ctx.restore();
  // the knot: a plump knitted lump with a soft shade ring, wiggled as it's tied
  const kw = a.tt?.knot ?? 0;
  const kn = K.plus(K.at(a, [3.6, -6.4]), [Math.sin((a.t ?? 0) * 22) * 0.35 * kw, 0]);
  ell(ctx, kn[0], kn[1], 1.95, 1.75, a.bk.ang - 0.3);
  ctx.fillStyle = K.colour(a, SC.base);
  ctx.fill();
  ctx.save();
  ctx.clip();
  K.blob(ctx, a, SC.lt, K.plus(kn, [-0.4, -0.6]), 1.4, 1.1, 0, 0.9);
  K.blob(ctx, a, SC.deep, K.plus(kn, [0.5, 1.2]), 2, 1.1, 0, 0.6);
  ctx.restore();
  ctx.strokeStyle = K.tint(a, SC.deep, 0.6);
  ctx.lineWidth = 0.3;
  ell(ctx, kn[0], kn[1], 1.95, 1.75, a.bk.ang - 0.3);
  ctx.stroke();
}

// ---------- Its own moves ----------
// The sneeze blast: a breath in (leaves perking up, leaning back, the scarf pulled down), then ACHOO,
// leaning right in; a sniffle back up.
const ACHOO = {
  anticT: 0.36,
  keys: [
    [0, { lean: -17, bend: -8, crouch: 0.2, spread: 0.8, mouth: 0.55, armN: 40, armF: 60, look: 0.4, snug: -0.6 }],
    [0.07, { lean: 22, bend: 9, x: 1.8, crown: 30, spread: -0.2, mouth: 1, armN: 70, armF: 20, look: 0, snug: -0.6 }, 'out'],
    [0.22, { lean: 14, bend: 4, x: 1.8, crown: 14, mouth: 0.5, armN: 50, armF: 25, snug: -0.4 }, 'io'],
    [0.48, { lean: 2, x: 0.6, crown: 2, mouth: 0.1 }, 'io'],
    [0.82, {}, 'io'],
  ],
  spark: [[0.12, 'ahead']],
};
// The scarf whip: the body wound back, then lunging in after the scarf end cracks out in front; a
// second little flick; settled.
// (the scarf end's own swing is played from the move's clock in its pose: whipAt)
const WHIP = {
  anticT: 0.3,
  keys: [
    [0, { lean: -12, bend: -6, crouch: 0.35, armN: 10, armF: 70, look: 0.2, snug: -0.3 }],
    [0.08, { lean: 12, bend: 7, x: 1.6, armN: 75, armF: 20, crown: 10, mouth: 0.35 }, 'out'],
    [0.2, { lean: 7, bend: 3, x: 1.6, armN: 50, armF: 25 }, 'io'],
    [0.32, { lean: 9, bend: 4, x: 1.4, armN: 60 }, 'out'],
    [0.6, { lean: 2, x: 0.4 }, 'io'],
    [0.8, {}, 'io'],
  ],
  dust: [[0.1, 'feet']],
};
// The scarf end through a whip, by the move's clock: flung up behind its shoulder as it winds up,
// unspooled and swung on over the top to lash out level in front, a recoil, a second flick, then
// down the front and reeled back in. Returns [degrees turned from hanging, how far unspooled].
function whipAt(t) {
  const out = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
  if (t < 0) return [114 * sstep(1 + t / WHIP.anticT), 0];
  if (t < 0.08) return [mix(114, 252, out(t / 0.08)), sstep(t / 0.05)];
  if (t < 0.2) return [mix(252, 232, sstep((t - 0.08) / 0.12)), 1];
  if (t < 0.32) return [mix(232, 262, out((t - 0.2) / 0.12)), 1];
  const u = sstep((t - 0.32) / 0.32);
  return [mix(262, 360, u), 1 - u];
}

const look = {
  kind: 'root',
  ink: '#6e1c44',
  C: { lt: '#ee6f9c', base: '#c8336c', sh: '#9e2458', deep: '#7a1846' },
  CL: { lt: '#9ee08e', base: '#5cb45e', sh: '#3f9450', deep: '#2f7442', rib: '#d63a72', stem: '#c8336c' },
  DIRT: { top: '#c9a582', clod: '#a8805c', crumb: '#d9bb98', dust: '#f6ecdf', dustEdge: '#dcc6aa' },
  dirtInk: '#7a5236',
  spore: PUFF,
  P: {
    face: { x: 5.3, y: -11.8, h: 6 },
    arm: { N: [6.4, -4.6], F: [-6.4, -4.8] },
    crownH: 11,
    leaves: [
      { root: [-1.8, -16.6], rest: -38, stem: 3.4, len: 7.6, w: 4.8, curl: -24, tone: 'sh' },
      { root: [1.6, -16.6], rest: 32, stem: 3, len: 7.2, w: 4.6, curl: 22, tone: 'base' },
      { root: [0, -16.9], rest: -4, stem: 4.2, len: 8.8, w: 5.4, curl: 12, tone: 'base' },
    ],
    tail: { root: [-4.8, -2.0], ang: 122, n: 4, seg: 1.2, w: [3.0, 0.55], curl: 34 },
    moves: ['achoo', 'scarfwhip', 'bonk'],
  },
  moves: { achoo: ACHOO, scarfwhip: WHIP },
  channels: { snug: [80, 13] },
  quietIdle: ['stretch', 'sway', 'shake', 'glance'],
  paint: (ctx, a, bk, K) => {
    // the sunbeam's warmth on it
    const sun = (a.tt?.sun ?? 0) * sstep((a.S?.x ?? 0) / 4);
    if (sun > 0.01) K.blob(ctx, a, '#ffd98a', K.at(a, [2, -10]), 11, 10, bk.ang, 0.5 * sun);
    // a beet's faint rings round its shoulders
    ctx.lineCap = 'round';
    for (const [r, al] of [[5.2, 0.4], [7.6, 0.28]]) {
      ctx.strokeStyle = K.tint(a, '#f58ab0', al);
      ctx.lineWidth = 0.42;
      ctx.beginPath();
      const q = [[-r * 0.95, -16.8 + r * 0.42], [0, -16.6 + r * 0.72], [r * 0.95, -16.8 + r * 0.42]].map((p) => K.at(a, p));
      ctx.moveTo(...q[0]);
      ctx.quadraticCurveTo(...q[1], ...q[2]);
      ctx.stroke();
    }
  },
  face,
  under: {
    legF: (ctx, a, mode, K) => {
      const tt = a.tt;
      if (!tt || !a.bk) return;
      const H = K.H;
      // the sunbeam: a soft golden ray slanting down onto the warm spot ahead, a glow on the ground,
      // motes of light drifting in it (behind it: drawn under its far leg)
      if (tt.sun > 0.01 && mode === 'fill') {
        const cx = 4.2;
        const top = -(H + 4);
        ctx.save();
        ctx.globalAlpha = tt.sun;
        const g = ctx.createLinearGradient(0, top, 0, 0);
        g.addColorStop(0, 'rgba(255,236,160,0)');
        g.addColorStop(0.45, 'rgba(255,236,160,0.32)');
        g.addColorStop(1, 'rgba(255,226,140,0.45)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx - 1.5, top);
        ctx.lineTo(cx + 3.5, top);
        ctx.lineTo(cx + 9, 0);
        ctx.lineTo(cx - 8, 0);
        ctx.closePath();
        ctx.fill();
        const gg = ctx.createRadialGradient(cx, -0.3, 0, cx, -0.3, 10);
        gg.addColorStop(0, 'rgba(255,234,150,0.55)');
        gg.addColorStop(1, 'rgba(255,234,150,0)');
        ctx.fillStyle = gg;
        ctx.save();
        ctx.translate(cx, -0.3);
        ctx.scale(1, 0.22);
        ctx.translate(-cx, 0.3);
        ctx.fillRect(cx - 10, -10.3, 20, 20);
        ctx.restore();
        for (let j = 0; j < 4; j++) {
          const u = ((tt.lu ?? 0) * 0.25 + j / 4) % 1;
          ctx.globalAlpha = tt.sun * Math.sin(Math.PI * u) * 0.9;
          K.twinkle(ctx, cx - 3 + j * 2.4 + Math.sin(u * 6 + j) * 1, top + 4 + u * (H - 6), 0.7 + (j % 2) * 0.3, u * 3, j % 2 ? '#fff3b0' : '#ffffff');
        }
        ctx.restore();
      }
    },
    body: (ctx, a, mode, K) => {
      if ((a.tt?.tangle ?? 0) <= 0.5) tail(ctx, a, K, mode, scarf(a, K).back, 2.7);
    },
  },
  over: {
    body: (ctx, a, mode, K) => {
      // (flipped up over its head and snagged in its leaves, the long end lies over its back)
      if ((a.tt?.tangle ?? 0) > 0.5) tail(ctx, a, K, mode, scarf(a, K).back, 2.7);
      wrap(ctx, a, K, mode);
      tail(ctx, a, K, mode, scarf(a, K).front, 2.5);
    },
  },
  // Its act on the base's channels (x, lift, hop, lean, bend, crouch, sink, sit, lie, armN, armF,
  // crown, spread, droop, mouth, look, shake, tuck; its own snug), its face and props
  // (a.tt).
  pose: (m, a, out, K, cur) => {
    const tt = { face: 'open', up: 0, open: 0, pucker: 0, mlem: 0, knot: 0, tangle: 0, blush: 0, sneeze: -1, blow: 0, sun: 0, heart: -1, pop: -1, stomp: [], z: 0, lu: 0 };
    a.tt = tt;
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0);
    const mood = m.cine?.mood ?? a.mood;
    const name = cur?.name;
    if (name === 'scarfwhip') [tt.whipOff, tt.whipLen] = whipAt(cur.t);
    if (m.hp <= 0) tt.face = 'dead';
    else if ((a.hurtAgo ?? 9) < 0.45 || name === 'hurt' || name === 'knockdown') tt.face = 'hurt';
    else if (napping || mood === 'sleep') {
      tt.face = 'sleep';
      tt.z = 1;
    } else if (name === 'cheer') tt.face = 'grin';
    else if (name === 'achoo') tt.face = cur.t < 0 ? 'squint' : cur.t < 0.4 ? 'squint' : 'focus';
    else if (cur || a.face === 'angry' || mood === 'angry') tt.face = 'focus';
    else if (mood === 'happy') tt.face = 'happy';
    else if (mood === 'sad') tt.face = 'sad';
    if (mood === 'talk' && m.hp > 0) out.mouth += Math.max(0, Math.sin((a.t ?? 0) * 13)) * 0.4;
    if (mood === 'sleep' && !napping) out.snug = (out.snug ?? 0) + 0.8;
    if (m.hp <= 0 || napping || cur) return;
    // (its act only while it stands about: never while it walks, fights or is posed)
    const calm = clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    if (calm < 0.02) return;
    const lu = (((a.t ?? 0) % 30) + 30) % 30;
    tt.lu = lu;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const say = (f, w) => {
      if (w > 0.4) tt.face = f;
    };
    // (a slow glance about in the quiet moments)
    out.look += Math.sin(lu * 0.7) * 0.25 * calm;
    // 1. a shiver, snuggled down into the scarf; a tickle, "a-a-", ACHOO; a sniffle and a wiggle
    const shiver = win(lu, 0.5, 0.8, 2.0, 2.3) * calm;
    const snug = win(lu, 0.5, 1.0, 2.2, 2.6) * calm;
    const ah = win(lu, 2.5, 3.1, 3.55, 3.62) * calm;
    const choo = win(lu, 3.58, 3.64, 3.8, 4.4) * calm;
    const sniff = win(lu, 4.3, 4.5, 5.4, 5.8) * calm;
    out.shake += shiver * 0.7;
    out.snug = (out.snug ?? 0) + snug;
    out.crouch += snug * 0.35;
    go({ armN: 8, armF: 8 }, snug);
    go({ lean: -15, bend: -6, spread: 0.8, mouth: 0.5, armN: 45, armF: 55, look: 0.4 }, ah);
    go({ lean: 22, bend: 9, crown: 34, mouth: 1, x: 1.4, armN: 70, armF: 20 }, choo);
    out.lean += sniff * Math.sin(lu * 8) * 3;
    out.lift += sniff * Math.abs(Math.sin(lu * 8)) * 0.4;
    say('blink', snug * (lu > 1.0 && lu < 2.2 ? 1 : 0));
    say('squint', Math.max(ah, choo));
    say('happy', sniff);
    tt.sneeze = lu >= 3.6 && lu < 4.5 ? (lu - 3.6) / 0.9 : -1;
    // 2. blowing on its little root-hands; rubbing them; pleased
    const hands = win(lu, 7.0, 7.5, 10.6, 11.2) * calm;
    const blow = (pulse(lu, 7.7, 0.7) + pulse(lu, 8.6, 0.7)) * calm;
    const rub = win(lu, 9.4, 9.6, 10.4, 10.6) * calm;
    go({ armN: 122, armF: 108, lean: 4, crouch: 0.15 }, hands);
    out.armN += rub * Math.sin(lu * 26) * 12;
    out.armF -= rub * Math.sin(lu * 26) * 12;
    out.lift += rub * Math.abs(Math.sin(lu * 13)) * 0.3;
    tt.pucker = Math.max(tt.pucker, blow);
    tt.blow = blow;
    tt.blowT = lu;
    say('blink', blow);
    say('happy', rub);
    // 3. a sunbeam ahead: spotted, two little hops over, melting into the warmth, two hops home
    tt.sun = win(lu, 12.6, 13.4, 18.4, 19.4) * calm;
    const spot = win(lu, 13.0, 13.3, 13.9, 14.1) * calm;
    const there = sstep((lu - 14.2) / 0.3) * 0.5 + sstep((lu - 14.8) / 0.3) * 0.5;
    const back = sstep((lu - 18.9) / 0.3) * 0.5 + sstep((lu - 19.5) / 0.3) * 0.5;
    out.x += 4.2 * (there - back) * calm;
    out.hop += (pulse(lu, 14.15, 0.4) + pulse(lu, 14.75, 0.4) + pulse(lu, 18.85, 0.4) + pulse(lu, 19.45, 0.4)) * 1.3 * calm;
    out.tuck += (pulse(lu, 14.15, 0.4) + pulse(lu, 14.75, 0.4) + pulse(lu, 18.85, 0.4) + pulse(lu, 19.45, 0.4)) * 0.6 * calm;
    go({ look: -0.8, lean: -4 }, spot);
    say('wide', spot);
    const melt = win(lu, 15.3, 16.0, 18.0, 18.6) * calm;
    go({ crouch: 0.45, lean: -9, bend: -4, droop: 0.75, armN: 4, armF: 4, snug: -0.45 }, melt);
    out.lift += melt * Math.sin(lu * 1.6) * 0.2;
    say('melt', melt);
    tt.blush = Math.max(tt.blush, melt);
    tt.heart = lu >= 16.2 && lu < 17.8 ? (lu - 16.2) / 1.6 : -1;
    // 4. re-tying the scarf: tongue out; a yank flips the long end up over its head and snags its
    //    leaves; a puzzled wobble, a big shake, the leaves pop free; patted smooth, proud
    const tie = win(lu, 20.4, 20.8, 21.6, 21.8) * calm;
    go({ armN: 88, armF: 78, lean: 6, look: 0.6 }, tie);
    out.lean += tie * Math.sin(lu * 14) * 1.5;
    tt.knot = tie;
    tt.mlem = tie;
    tt.up -= tie * 0.8;
    const yank = win(lu, 21.6, 21.75, 21.85, 22.1) * calm;
    go({ armN: 40, armF: 130, lean: -8, hop: 0.6 }, yank);
    tt.tangle = (sstep((lu - 21.62) / 0.22) - sstep((lu - 24.05) / 0.3)) * calm;
    const stuck = win(lu, 21.9, 22.1, 23.5, 23.7) * calm;
    go({ crown: -26, droop: 0.35, look: -0.7 }, tt.tangle);
    out.lean += stuck * Math.sin(lu * 4) * 4;
    say('wide', yank + win(lu, 21.9, 22.0, 22.5, 22.6) * calm);
    say('sad', win(lu, 22.5, 22.6, 23.4, 23.5) * calm);
    const shake = win(lu, 23.5, 23.6, 24.1, 24.2) * calm;
    out.shake += shake * 1.1;
    out.crown += shake * Math.sin(lu * 30) * 14;
    say('squint', shake);
    tt.pop = lu >= 24.05 && lu < 24.65 ? (lu - 24.05) / 0.6 : -1;
    const pat = win(lu, 24.4, 24.7, 25.6, 26.0) * calm;
    go({ armN: 70, armF: 60, lean: -3 }, pat);
    out.armN += pat * Math.sin(lu * 18) * 8;
    say('happy', pat);
    // 5. a stomp-dance to warm up: four stomps rocking side to side, arms pumping; a ta-da
    const dance = win(lu, 26.3, 26.5, 28.9, 29.1) * calm;
    const beat = (lu - 26.5) * 2.2;
    const ph = beat * Math.PI;
    out.lean += dance * Math.sin(ph) * 8;
    out.hop += dance * Math.abs(Math.sin(ph)) * 0.9;
    out.armN += dance * (60 + Math.sin(ph) * 45);
    out.armF += dance * (60 - Math.sin(ph) * 45);
    out.spread += dance * Math.abs(Math.sin(ph)) * 0.4;
    say('grin', dance);
    for (let i = 0; i < 5; i++) {
      const t0 = 26.5 + (i + 1) / 2.2;
      if (lu >= t0 && lu < t0 + 0.4 && t0 < 29) tt.stomp.push([(lu - t0) / 0.4, i % 2 ? -1 : 1]);
    }
    const tada = win(lu, 29.0, 29.2, 29.6, 29.95) * calm;
    go({ armN: 150, armF: 140, spread: 0.8, lean: -4 }, tada);
    say('happy', tada);
  },
  // Napping: half planted in the soil, snuggled up to its eyes in the scarf, its leaves drooped, a
  // slow breath.
  after: (m, a, out, K, cur) => {
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0) && m.hp > 0;
    if (!napping) return;
    const P = K.P;
    const depth = P.hb + P.top + P.crownH - 5.5;
    const b = Math.sin((a.t ?? 0) * 0.95);
    Object.assign(out, { sink: (P.hb + 3.2) / depth, sit: 0, lie: 0, lean: -4 + b * 1.5, bend: -2 + b, crouch: 0, hop: 0, armN: 10, armF: 10, droop: 0.9, crown: 6, snug: 1.15, mouth: 0, look: 0.1, shake: 0, spread: 0 });
  },
  // Its extras: the sneeze cloud, warm breath wisps, the sunbeam and a heart, the leaves popping free,
  // the stomp-dance's dust, a nap's little "z"; in a fight, the sneeze blast and the whip's crack.
  fx: (ctx, m, a, S, K) => {
    const bk = a.bk;
    const tt = a.tt;
    if (!bk || !tt) return;
    const H = K.H;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const cur = a.vgMove;
    // the sneeze cloud (an idle sneeze small, the sneeze blast bigger; both close in front of it)
    let k = -1;
    let big = 0.62;
    if (cur?.name === 'achoo' && cur.t >= 0.05 && cur.t < 0.75) {
      k = (cur.t - 0.05) / 0.7;
      big = 1;
    } else if (tt.sneeze >= 0) k = tt.sneeze;
    if (k >= 0) {
      const st = a.mo.rig;
      const key = cur?.name === 'achoo' ? `a${Math.round(((a.now ?? 0) - cur.t) * 20)}` : `i${Math.floor((a.t ?? 0) / 30)}`;
      if (st.ttAt?.key !== key) st.ttAt = { key, at: [...bk.mouth] };
      const [x0, y0] = st.ttAt.at;
      const e = 1 - (1 - k) ** 2;
      for (let j = 0; j < 7; j++) {
        const sp = (j - 3) * 0.17;
        const far = K.hash(j * 3.1 + 1);
        const d = (2.5 + far * 3 + e * (5 + far * 4)) * big;
        K.puff(ctx, x0 + Math.cos(sp) * d + 1, y0 + Math.sin(sp) * d * 0.9 - e * 1.5, (0.9 + e * (1.6 + far)) * big, (1 - sstep((k - 0.4) / 0.6)) * 0.9, PUFF[0], PUFF[1]);
      }
      ctx.globalAlpha = 1 - sstep((k - 0.5) / 0.5);
      for (let j = 0; j < 3; j++) K.twinkle(ctx, x0 + (4 + j * 2.6 + e * 4) * big, y0 - 2 + j * 1.6 - e * 2, 0.9 + (j % 2) * 0.4, k * 3 + j, j % 2 ? '#ffe8a0' : '#ffffff');
      ctx.fillStyle = '#ff8fb4';
      heart(ctx, x0 + (3 + e * 5) * big, y0 - 3.5 - e * 2.5, 0.9 * big);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // the scarf whip's crack: sparkles off the tip as it lashes out, again on the flick
    if (cur?.name === 'scarfwhip') {
      const tip = a.ttScarf?.front?.at(-1);
      for (const [t0, s] of [[0.14, 1], [0.3, 0.7]]) {
        const u = (cur.t - t0) / 0.26;
        if (!tip || u < 0 || u > 1) continue;
        const st = a.mo.rig;
        const key = `w${t0}${Math.round(((a.now ?? 0) - cur.t) * 20)}`;
        if (st.ttWhip?.key !== key) st.ttWhip = { key, at: [...tip] };
        const [x, y] = st.ttWhip.at;
        const e = 1 - (1 - u) ** 3;
        ctx.globalAlpha = 1 - u * u;
        K.twinkle(ctx, x, y, (1.6 + e * 1.6) * s, u, '#ffffff');
        K.twinkle(ctx, x, y, (0.8 + e * 0.8) * s, u + 0.5, '#fff3b0');
        for (let j = 0; j < 4; j++) {
          const q = (j * TAU) / 4 + 0.6;
          ctx.fillStyle = j % 2 ? '#ffd3e6' : '#ffe8a0';
          sparkle(ctx, x + Math.cos(q) * e * 4 * s, y + Math.sin(q) * e * 4 * s, 0.7 * (1 - u * 0.5));
        }
        ctx.globalAlpha = 1;
      }
    }
    // warm breath on its hands: soft curls drifting from its mouth to its hands, a warm sparkle
    if (tt.blow > 0.05) {
      const mo = bk.mouth;
      const hd = bk.arms.N.Hd;
      for (let i = 0; i < 2; i++) {
        const u = (((tt.blowT ?? 0) * 1.6 + i * 0.5) % 1);
        const x = mix(mo[0] + 0.6, hd[0] + 0.5, u);
        const y = mix(mo[1], hd[1] - 0.6, u) - Math.sin(Math.PI * u) * 1.2;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.8 * tt.blow;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(x - 1, y + 0.4);
        ctx.bezierCurveTo(x - 0.3, y - 0.8, x + 0.4, y + 0.8, x + 1.1, y - 0.3);
        ctx.stroke();
      }
      ctx.globalAlpha = tt.blow * 0.9;
      ctx.fillStyle = '#ffe2a0';
      sparkle(ctx, hd[0] + 1.2, hd[1] - 1.4, 0.7);
      ctx.globalAlpha = 1;
    }
    if (tt.heart >= 0) {
      const p = K.at(a, [3, -19]);
      const u = tt.heart;
      ctx.globalAlpha = Math.sin(Math.PI * u);
      ctx.fillStyle = '#ff7fa8';
      heart(ctx, p[0] + Math.sin(u * 5) * 1, p[1] - u * 4, 1.2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    // the leaves popping free of the scarf: a ring of sparkles
    if (tt.pop >= 0) {
      const c = K.at(a, [-2, -20]);
      const u = tt.pop;
      const e = 1 - (1 - u) ** 3;
      ctx.globalAlpha = 1 - u;
      for (let j = 0; j < 5; j++) {
        const q = -Math.PI / 2 + (j - 2) * 0.6;
        ctx.fillStyle = j % 2 ? '#fff3b0' : '#ffffff';
        sparkle(ctx, c[0] + Math.cos(q) * (2 + e * 4), c[1] + Math.sin(q) * (2 + e * 4), 1 - u * 0.5);
      }
      ctx.globalAlpha = 1;
    }
    // the stomps: a little soft dust puff at the stomping foot
    for (const [u, side] of tt.stomp) {
      const gx = (bk.spots.feet?.[0] ?? 0) + side * 1.4;
      const e = 1 - (1 - u) ** 2;
      for (const d of [-1, 1]) K.puff(ctx, gx + d * (1.6 + e * 2.2), -0.8 - e * 1.2, 0.8 + e * 0.6, (1 - u) * 0.8, K.DIRT.dust, K.DIRT.dustEdge);
    }
    // napping: a little ruby "z" drifting up off its head
    if (tt.z > 0 && m.hp > 0) {
      const top = K.at(a, [4, -15]);
      for (let i = 0; i < 2; i++) {
        const u = ((a.t ?? 0) * 0.35 + i * 0.5) % 1;
        const s = 1.3 + u * 1.1;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.95;
        ctx.save();
        ctx.translate(top[0] + 2 + u * 3.5, top[1] - u * 5.5);
        if (a.flip) ctx.scale(-1, 1);
        ctx.beginPath();
        ctx.moveTo(-s * 0.5, -s * 0.5);
        ctx.lineTo(s * 0.5, -s * 0.5);
        ctx.lineTo(-s * 0.5, s * 0.5);
        ctx.lineTo(s * 0.5, s * 0.5);
        ctx.strokeStyle = '#fff4f7';
        ctx.lineWidth = 1.1;
        ctx.stroke();
        ctx.strokeStyle = RUBY;
        ctx.lineWidth = 0.5;
        ctx.stroke();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  },
};

export const TURNIPTOT = dressedVeggie(look);
TURNIPTOT.art.noHop = true;
