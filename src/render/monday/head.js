// Monday's head (remade 2026-11-27, drawn from scratch: never the shared face, never the hero's head or hair,
// nothing of another boss's): her face and its moods, her long night-navy hair, her round baku ears and her
// alarm-bell clips. In head units about her face's middle (x toward the way she faces, y down; the skull about 16
// across), each piece drawn in both of the rig's passes (mode 'line': its outline, 'fill': itself), so only her
// outer edge is outlined; her face bare.
//   face   a little girl's: soft round cheeks, a small pointed-round chin, a pink flush.
//   eyes   her own family, tsurime: almond eyes whose outer corners lift (a smug, bossy look even at rest),
//          violet irises (deep at the top to a lilac glow low down), a round pupil and her signature glint, a
//          little crescent moon up at the back (she eats dreams), with a round light low at the front. The upper
//          lash a neat line rising to one soft round wing at the outer corner. The whole iris always clear while
//          she's awake; only blinks, closed moods and her sleep cover it.
//   brows  round brows, short and full, navy.
//   mouth  a small smug line at rest, one corner up (never a stuck smile: it drops for every other mood); a
//          shout, a yawn, nibbling crumbs, vowel shapes when she talks.
//   hair   deep night navy with a lilac sheen: an even blunt fringe of four sections cut straight across above
//          her brows, a deeper layer in its splits, its soft shadow on her forehead; long straight side locks
//          outside her eyes down past her chin, each clipped with a little gold alarm bell; the rest straight down
//          her back behind her to her thighs, kept slim behind her shoulders, one soft round end. One light from above, one lilac
//          shine band.
//   ears   two round baku ears, navy with pink insides, growing from inside her head, each twitching on its own.
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear, clamp } from './fx.js';
import { SKIN, SKIN_INK, HAIR, LASH, BROW, IRIS, RING, PUPIL, LIP, BLUSH, EAR, GOLD } from './palette.js';

export function chaikin(pts, n = 2, open = false) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = open ? [q[0]] : [];
    const N = open ? q.length - 1 : q.length;
    for (let i = 0; i < N; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      o.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    if (open) o.push(q[q.length - 1]);
    q = o;
  }
  return q;
}
export function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}

// ---------- Her moods ----------
// lid (0 open .. 1 shut: closed moods only), shut, bt (brow tilt: + knit, - worried), by (raise), mw/ms/mo (the
// mouth's width, smile, open), ro (a round "o"), puck (nibbling, cheeks puffed), fang (unused), wide (a wide
// grin, teeth), wob, bl (blush), sm (small irises), sp (sparkly).
const F0 = { lid: 0, shut: 'happy', bt: 0.15, by: 0.15, mw: 0.7, ms: 0.25, mo: 0, ro: 0, puck: 0, fang: 0, wide: 0, wob: 0, bl: 0.45, sm: 0, sp: 0 };
const fc = (o) => ({ ...F0, ...o });
export const FACES = {
  smug: fc({}),
  rest: fc({ ms: 0.05, bt: 0.05 }),
  bossy: fc({ bt: 0.6, by: 0.1, mw: 0.8, ms: 0.1, mo: 0.35, bl: 0.5 }),
  shout: fc({ bt: 0.9, by: 0.3, mw: 1.1, ms: -0.1, mo: 1, bl: 0.8 }),
  grin: fc({ bt: 0.35, by: 0.3, mw: 1, ms: 0.9, mo: 0.3, wide: 1, bl: 0.6 }),
  nibble: fc({ bt: -0.1, by: 0.3, mw: 0.5, puck: 1, ro: 0.4, bl: 0.7 }),
  yum: fc({ lid: 1, shut: 'happy', bt: -0.3, by: 0.4, mw: 0.85, ms: 0.85, bl: 0.9 }),
  cross: fc({ bt: 1, by: -0.15, mw: 0.85, ms: -0.4, mo: 0.4, bl: 0.7 }),
  focus: fc({ bt: 0.6, by: 0, mw: 0.6, ms: 0, bl: 0.4 }),
  shock: fc({ bt: -0.5, by: 1.1, mw: 0.6, ro: 1, sm: 0.85, bl: 0.5 }),
  pout: fc({ bt: 0.45, by: 0.1, mw: 0.5, ms: -0.3, puck: 0.5, bl: 1 }),
  sad: fc({ bt: -0.95, by: 0.3, mw: 0.6, ms: -0.4, wob: 0.6, bl: 0.5 }),
  fluster: fc({ bt: -0.75, by: 0.6, mw: 0.8, ms: -0.2, mo: 0.35, wob: 0.9, bl: 1.2 }),
  drowsy: fc({ bt: -0.35, by: -0.15, mw: 0.55, ms: 0, mo: 0.1, bl: 0.5, sm: 0.2 }),
  yawn: fc({ lid: 1, shut: 'squeeze', bt: -0.4, by: 0.6, mw: 0.9, ro: 1.3, bl: 0.6 }),
  asleep: fc({ lid: 1, shut: 'calm', bt: -0.25, by: -0.1, mw: 0.55, ms: 0.25, ro: 0.3, bl: 0.7 }),
  hurt: fc({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.85, ms: -0.4, mo: 0.55, bl: 0.7 }),
  dizzy: fc({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.7, ms: -0.2, mo: 0.4, bl: 0.5 }),
  talk: fc({ bt: 0.2, by: 0.3, mw: 0.85, ms: 0.25, mo: 0.4, bl: 0.5 }),
  happy: fc({ bt: -0.2, by: 0.5, mw: 1, ms: 0.95, mo: 0.3, bl: 0.9, sp: 0.6 }),
};
export const SHUTS = ['happy', 'calm', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'ro', 'puck', 'fang', 'wide', 'wob', 'bl', 'sm', 'sp'];
export const VOWELS = [[0.55, 0.2, 0.6], [1, 0.45, 0.45], [0.85, 0.5, 0.2], [0.65, 0.2, 0], [0.5, 0.15, 0.5]];

// (the eyes' place: the same size, level)
export const EYE = { y: 4.4, dx: 6.2, w: 4.1, h: 3.9, lift: 0.3 };

// Tsurime: an almond whose outer corner lifts.
function eyeOutline(x, y, side) {
  const pts = [];
  for (let i = 0; i < 26; i++) {
    const an = (i / 26) * TAU;
    const px = Math.cos(an) * EYE.w;
    const sn = Math.sin(an);
    const py = sn < 0 ? sn * EYE.h * 0.9 : sn * EYE.h * 0.95;
    pts.push([x + px, y + py - ((px * side) / EYE.w) * EYE.lift * 1.8]);
  }
  return pts;
}
function eye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.mnUid ?? 0) * 1.7) % 5.4, 4.8, 4.92, 5, 5.16) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  const openW = 1 - closedW;
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    const sh = blink > shutK ? { calm: 1 } : f.shut;
    ctx.lineCap = 'round';
    for (const s of SHUTS) {
      const sw = sh[s] ?? 0;
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      pen(ctx, tone(a, LASH), 0.9);
      if (s === 'happy' || s === 'calm') {
        const up = s === 'happy' ? -1 : 1;
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const u = i / 10;
          const px = x - w + u * w * 2;
          const py = y + 0.4 + up * Math.sin(Math.PI * u) * (s === 'happy' ? 2 : 0.9);
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
        // (her soft wing at the outer corner)
        pen(ctx, tone(a, LASH), 0.6);
        const ex = x + side * w;
        ctx.beginPath();
        ctx.moveTo(ex - side * 0.2, y + 0.3);
        ctx.quadraticCurveTo(ex + side * 0.8, y - 0.2, ex + side * 1.2, y - 0.9);
        ctx.stroke();
      } else if (s === 'squeeze') {
        ctx.beginPath();
        ctx.moveTo(x + side * w * 0.95, y - 1.8);
        ctx.lineTo(x - side * w * 0.6, y + 0.4);
        ctx.lineTo(x + side * w * 0.95, y + 2.4);
        ctx.stroke();
      } else {
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 1.6 + t * 4 * side;
          const r = 0.4 + (i / 26) * 2.8;
          const px = x + Math.cos(an) * r;
          const py = y + 0.4 + Math.sin(an) * r * 0.9;
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  const out = eyeOutline(x, y, side);
  poly(ctx, out);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.save();
  poly(ctx, out);
  ctx.clip();
  const sg = ctx.createLinearGradient(0, y - h * 0.8, 0, y - h * 0.8 + 1.6);
  sg.addColorStop(0, 'rgba(160,100,80,0.3)');
  sg.addColorStop(1, 'rgba(160,100,80,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w - 1, y - h - 1, w * 2 + 2, 3);
  const lx = clamp(look?.[0] ?? 0.3, -1, 1) * 0.8;
  const ly = clamp(look?.[1] ?? 0, -1, 1) * 0.6;
  const ir = 2.9 * (1 - 0.32 * f.sm);
  const ix = x + lx;
  const iy = y + 0.45 + ly;
  const ig = ctx.createLinearGradient(0, iy - ir, 0, iy + ir);
  ig.addColorStop(0, tone(a, IRIS[3]));
  ig.addColorStop(0.35, tone(a, IRIS[2]));
  ig.addColorStop(0.72, tone(a, IRIS[1]));
  ig.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir * 0.94, ir);
  ctx.fillStyle = ig;
  ctx.fill();
  pen(ctx, tone(a, RING), 0.38);
  ctx.stroke();
  // (a soft brighter ring round the pupil, a moonlit halo)
  pen(ctx, 'rgba(255,230,150,0.5)', 0.3);
  ell(ctx, ix, iy + 0.1, ir * 0.62, ir * 0.64);
  ctx.stroke();
  ell(ctx, ix, iy + 0.1, ir * 0.36, ir * 0.38);
  ctx.fillStyle = tone(a, PUPIL);
  ctx.fill();
  // her glint: a little crescent moon up at the back (a sparkle beside it when she's pleased), a round light low
  const gx = ix - 1.0;
  const gy = iy - ir * 0.42;
  const gs = 0.95 * (1 - 0.3 * f.sm);
  ctx.beginPath();
  ctx.arc(gx, gy, gs, 0, TAU);
  ctx.arc(gx + gs * 0.55, gy - gs * 0.35, gs * 0.82, 0, TAU, true);
  ctx.fillStyle = '#ffffff';
  ctx.fill('evenodd');
  if (f.sp > 0.3) {
    ell(ctx, gx + 1, gy - 0.7, 0.35 * f.sp, 0.35 * f.sp);
    ctx.fill();
  }
  ell(ctx, ix + 1.1, iy + ir * 0.5, 0.42, 0.34);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
  // the lash: a neat curve along the top, thin at the inner corner, thickening outward; two round flicks
  // kicking up at the outer corner
  ctx.lineCap = 'round';
  const top = (u) => {
    const an = Math.PI + (side > 0 ? u : 1 - u) * Math.PI;
    const px = Math.cos(an) * w * 1.04;
    return [x + px, y + Math.sin(an) * h * 0.88 - 0.1 - ((px * side) / w) * EYE.lift * 1.8];
  };
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const p = top(i / 12);
    if (i) ctx.lineTo(p[0], p[1] - (i / 12) * 0.2);
    else ctx.moveTo(p[0], p[1]);
  }
  for (let i = 12; i >= 0; i--) {
    const p = top(i / 12);
    ctx.lineTo(p[0], p[1] + 0.2 + (i / 12) * 0.7);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  const e = top(1);
  // (one soft round wing lifting off the outer corner)
  ctx.beginPath();
  ctx.moveTo(e[0] - side * 0.6, e[1] + 0.9);
  ctx.quadraticCurveTo(e[0] + side * 0.7, e[1] + 0.2, e[0] + side * 1.5, e[1] - 0.9);
  ctx.quadraticCurveTo(e[0] + side * 0.6, e[1] - 0.6, e[0] - side * 0.4, e[1] - 0.1);
  ctx.closePath();
  ctx.fill();
  ell(ctx, e[0] + side * 1.45, e[1] - 0.85, 0.34, 0.34);
  ctx.fill();
  pen(ctx, 'rgba(204,140,120,0.45)', 0.4);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.55, y + h * 1.02);
  ctx.quadraticCurveTo(x, y + h * 1.12, x + w * 0.58, y + h * 1.0);
  ctx.stroke();
  ctx.restore();
}

function brow(ctx, a, x, y, side, f) {
  const yi = y - f.by * 0.7 + f.bt * 0.95;
  const yo = y - f.by * 0.7 - f.bt * 0.3;
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROW), 1.35);
  ctx.beginPath();
  ctx.moveTo(x - side * 1.25, yi);
  ctx.quadraticCurveTo(x, Math.min(yi, yo) - 0.45, x + side * 1.45, yo + 0.1);
  ctx.stroke();
  ctx.restore();
}
function mouth(ctx, a, x, y, f) {
  const w = 2.4 * f.mw;
  const cy = y - f.ms * 0.8;
  if (f.puck > 0.3) {
    // puckered for a slurp: a small round pucker, the cheeks puffed (drawn by the face)
    const k = f.puck;
    ell(ctx, x + 0.6, y + 0.4, 0.7 + 0.3 * k, 0.85 + 0.3 * k);
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    pen(ctx, tone(a, LIP.base), 0.6);
    ctx.stroke();
    return;
  }
  if (f.ro > 0.3) {
    const k = f.ro;
    ell(ctx, x, y + 0.8, 1.35 * k + 0.3, 1.75 * k + 0.3);
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + 0.6 + 1.1 * k, 0.8 * k, 0.55 * k);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP.sh), 0.4);
    ell(ctx, x, y + 0.8, 1.35 * k + 0.3, 1.75 * k + 0.3);
    ctx.stroke();
    return;
  }
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.5 - o * 0.4, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 1.3 + o * 4.4, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (f.wide > 0.3) {
      ctx.fillStyle = tone(a, LIP.teeth);
      ctx.fillRect(x - w, cy - 2, w * 2, 0.8 + f.wide * 0.8);
    }
    ell(ctx, x, y + f.ms * 1.1 + o * 3.4, w * 0.62, o * 1.4);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP.sh), 0.35);
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LIP.sh), 0.55);
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const px = x - w + u * w * 2;
    const py = cy + Math.sin(Math.PI * u) * f.ms * 0.7 + Math.sin(u * Math.PI * 4) * f.wob * 0.4 - (u > 0.7 ? (u - 0.7) * f.ms * 3.2 : 0);
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x, y + 1.2, 1.6, LIP.base, 0.25);
}

// Her face: soft round cheeks, a small pointed-round chin (puffed out nibbling, `puff`).
export function skullPts(tx, puff = 0) {
  const p = puff * 1.2;
  return chaikin([[0, -17.4], [11.8, -13.8], [15.8, -4.6], [16.6 + p, 4.2], [15.2 + p, 10.6], [9.4 + p * 0.6, 14.2], [3.6 + tx * 0.25, 16.8], [0.6 + tx * 0.25, 17.4], [-5.6 + tx * 0.15, 15.4], [-12.8 - p * 0.4, 10.8], [-16.2 - p * 0.4, 4.4], [-16, -4.6], [-11.9, -13.8]], 3);
}

// ---------- Her hair ----------
const HY0 = -24;
const HY1 = 92;
function hairFill(ctx, a) {
  const g = ctx.createLinearGradient(0, HY0, 0, HY1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(0.2, tone(a, HAIR.base));
  g.addColorStop(0.6, tone(a, HAIR.sh));
  g.addColorStop(1, tone(a, HAIR.deep));
  return g;
}
function shineBand(ctx, y = -10.4) {
  const g = ctx.createLinearGradient(0, y - 2.3, 0, y + 2.3);
  g.addColorStop(0, 'rgba(220,210,255,0)');
  g.addColorStop(0.5, 'rgba(214,204,255,0.55)');
  g.addColorStop(1, 'rgba(220,210,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-60, y - 2.3, 120, 4.6);
  pen(ctx, 'rgba(255,255,255,0.85)', 0.3);
  for (const [x, l] of [[-12, 1.6], [-5.4, 2.2], [1.8, 1.4], [8, 2]]) {
    const yy = y - 0.3 + 0.004 * x * x;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + l / 2, yy - 0.4, x + l, yy + 0.1);
    ctx.stroke();
  }
}
// (her hair's shade: indigo, never grey)
const SHADE = (al) => `rgba(30,24,80,${al})`;
function hairShape(ctx, a, mode, pts, shade, lw) {
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, tone(a, HAIR.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = hairFill(ctx, a);
  ctx.fill();
  if (shade) {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    shade();
    ctx.restore();
  }
}
// A soft straight strand line (her hair's own texture), from (x, y0) to y1.
function waveLine(ctx, x, y0, y1, amp, ph, al) {
  pen(ctx, SHADE(al), 0.45);
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const v = i / 10;
    const px = x + Math.sin(v * 7 + ph) * amp * sstep(v * 3);
    const py = y0 + (y1 - y0) * v;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
}
// The fringe: an even blunt cut straight across, just above her brows.
const CUT = { y: -3.8, rise: 0.5, half: 14.8 };
export const cutY = (x, cx) => CUT.y + CUT.rise * Math.min(1, ((x - cx) / CUT.half) ** 2);
const SPLITS = [[0.23, 2.6, 0.9], [0.5, 3.3, 1.1], [0.77, 2.8, 1.0]];
function fringeGeom(tx, sw) {
  const cx = 0.6 + tx * 0.6;
  const x0 = cx - CUT.half - 1.1;
  const x1 = cx + CUT.half + 1.0;
  const W = x1 - x0;
  const topY = (x) => -17 + 0.02 * (x - cx) ** 2;
  const xs = [x0, ...SPLITS.map(([u]) => x0 + W * u), x1];
  const secs = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const L = xs[i];
    const R = xs[i + 1];
    const sl = i > 0 ? SPLITS[i - 1] : null;
    const sr = i < SPLITS.length ? SPLITS[i] : null;
    const dx = (sw?.[i % 3] ?? 0) * 2.4 * (i % 2 ? -1 : 1);
    const lb = sl ? L + sl[2] / 2 : L + 0.4;
    const rb = sr ? R - sr[2] / 2 : R - 0.4;
    const pts = [[L, topY(L)], [R, topY(R)]];
    if (sr) pts.push([R, cutY(R, cx) - sr[1]]);
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const x = rb + (lb - rb) * (k / n);
      pts.push([x + dx * (1 - Math.abs(k / n - 0.5) * 2) * 0.3 + dx * 0.4, cutY(x, cx) + 0.45 * Math.sin(Math.PI * (k / n))]);
    }
    if (sl) pts.push([L, cutY(L, cx) - sl[1]]);
    secs.push({ pts: chaikin(pts, 2), L, R, mid: (L + R) / 2 });
  }
  return { cx, x0, x1, secs, topY };
}
function fringe(ctx, a, mode, tx, sw, lw) {
  const G = fringeGeom(tx, sw);
  const inner = chaikin([[G.x0 + 0.6, G.topY(G.x0) + 1], [G.x1 - 0.6, G.topY(G.x1) + 1], ...Array.from({ length: 9 }, (_, k) => {
    const x = G.x1 - 0.8 - (G.x1 - G.x0 - 1.6) * (k / 8);
    return [x, cutY(x, G.cx) - 0.3];
  })], 2);
  poly(ctx, inner);
  if (mode === 'line') {
    pen(ctx, tone(a, HAIR.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, HAIR.deep);
    ctx.fill();
  }
  G.secs.forEach((s, i) => {
    hairShape(ctx, a, mode, s.pts, () => {
      const cy = cutY(s.mid, G.cx);
      const g = ctx.createLinearGradient(0, cy - 4.4, 0, cy + 0.6);
      g.addColorStop(0, SHADE(0));
      g.addColorStop(1, SHADE(0.38));
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -24, s.R - s.L + 4, 26);
      // (one soft strand line down each wide section, fading before the cut)
      if (s.R - s.L > 8) waveLine(ctx, s.mid + 0.8, -12, cutY(s.mid, G.cx) - 1.2, 0.08, i, 0.22);
      shineBand(ctx);
    }, lw);
  });
}
function capPts(tx) {
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const an = Math.PI * (0.98 + (i / 18) * 1.04);
    const off = 1.6 + Math.max(0, -Math.sin(an)) * 1.5;
    pts.push([Math.cos(an) * (16.6 + off), Math.sin(an) * (17.8 + off) + 0.4]);
  }
  return chaikin([[-17.6, 4], ...pts, [17.8, 1], [12, -5], [tx, -8], [-9, -6], [-15.8, -1]], 2);
}
// A long straight side lock outside her eye, down past her chin, one soft round end, a gold alarm-bell clip on it.
const LOCK_E = 24;
function sideLockPts(side, tx, sway) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 11.8 : -11.4;
  const outX = side > 0 ? 17.6 : -17.6;
  const sx = (v) => v + shift;
  const s = sway * 2.6;
  const E = LOCK_E;
  return {
    pts: chaikin([
      [sx(outX - side * 0.4), -9.6], [sx(inX - side * 1.3), -9.2], [sx(inX), -2], [sx(inX + side * 0.2) + s * 0.2, 8],
      [sx(inX + side * 0.4) + s * 0.5, 16], [sx(inX + side * 0.6) + s * 0.8, E - 2],
      [sx((inX + outX) / 2) + s, E + 1],
      [sx(outX - side * 0.6) + s * 0.8, E - 2], [sx(outX - side * 0.2) + s * 0.5, 16],
      [sx(outX + side * 0.2) + s * 0.2, 7], [sx(outX + side * 0.3), -3],
    ], 3),
    inX: sx(inX),
    outX: sx(outX),
    s,
    bell: [sx((inX + outX) / 2) + s * 0.6, 12],
  };
}
// A little gold alarm bell (her hair clip): two tiny bells on a bar, ringing when `ring` (a.mnRing) is up.
function bellClip(ctx, a, mode, x, y, ring, lw) {
  const sh = Math.sin((a.t ?? 0) * 40) * 0.25 * ring;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(sh);
  for (const dx of [-1.3, 1.3]) {
    ctx.beginPath();
    ctx.arc(dx, 0, 1.35, Math.PI, 0);
    ctx.lineTo(dx + 1.35, 0.6);
    ctx.lineTo(dx - 1.35, 0.6);
    ctx.closePath();
    if (mode === 'line') {
      pen(ctx, tone(a, GOLD.ink), lw);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, GOLD.base);
      ctx.fill();
      ell(ctx, dx - 0.45, -0.55, 0.38, 0.3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.beginPath();
  ctx.roundRect(-2.4, -2, 4.8, 0.8, 0.4);
  if (mode === 'line') {
    pen(ctx, tone(a, GOLD.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, GOLD.sh);
    ctx.fill();
  }
  ctx.restore();
}
function sideLock(ctx, a, mode, side, tx, sway, lw) {
  const P = sideLockPts(side, tx, sway);
  hairShape(ctx, a, mode, P.pts, () => {
    const g = ctx.createLinearGradient(0, -10, 0, -4);
    g.addColorStop(0, SHADE(0.42));
    g.addColorStop(1, SHADE(0));
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(P.outX, P.inX) - 4, -11, 14, 7);
    glow(ctx, P.inX + side * 0.8, 10, 3.2, HAIR.deep, 0.35);
    shineBand(ctx);
  }, lw);
  bellClip(ctx, a, mode, P.bell[0], P.bell[1], a.mnRing ?? 0, lw);
}
// Her baku ears: round, navy with a pink inside, growing from inside her head behind the fringe, each twitching.
function ears(ctx, a, mode, tx, tw, lw) {
  for (const s of [-1, 1]) {
    const bx = tx * 0.4 + s * 10.4 - 0.6;
    const by = -15.6;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(s * 0.42 + (tw?.[s > 0 ? 1 : 0] ?? 0) * 0.3);
    ell(ctx, 0, -2.6, 4.6, 4.2);
    if (mode === 'line') {
      pen(ctx, tone(a, EAR.ink), lw);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, EAR.base);
      ctx.fill();
      ell(ctx, 0.2, -2.4, 2.8, 2.6);
      ctx.fillStyle = tone(a, EAR.inner);
      ctx.fill();
      glow(ctx, 0.2, -1.4, 2, EAR.innerSh, 0.6);
      ell(ctx, -1.6, -4.6, 1.2, 0.7);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
    }
    ctx.restore();
  }
}
// Behind her head: the rest of her hair, straight down her back to the backs of her knees, one soft round end; it swings.
function backHair(ctx, a, mode, tx, sw, lean, lw, sit = 0) {
  const s = sw ?? 0;
  const L = 56 * (1 - 0.5 * (sit ?? 0));
  const top = -8;
  const at = (u, off) => {
    const x0 = -8.5 - u * 6 + tx * 0.12 + off + s * 14 * u * u + Math.sin(u * Math.PI) * 1.2;
    const y0 = top + u * L;
    const r = -lean * sstep(u * 1.6);
    const cx = -4;
    const cy = top;
    return [cx + (x0 - cx) * Math.cos(r) - (y0 - cy) * Math.sin(r), cy + (x0 - cx) * Math.sin(r) + (y0 - cy) * Math.cos(r)];
  };
  const W = (u) => 15.5 + Math.sin(u * Math.PI * 0.9) * 2.6 - u * 1.5;
  const back = [];
  const front = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    back.push(at(u, -W(u) * 0.55));
    front.push(at(u, W(u) * 0.45));
  }
  const end = at(1.035, -0.6);
  const pts = chaikin([[-17.4, -9], [-12, -16], [4, -16], [13, -9], ...front, end, ...back.reverse()], 3);
  hairShape(ctx, a, mode, pts, () => {
    const mid = at(0.6, 0);
    glow(ctx, mid[0], mid[1], 14, HAIR.deep, 0.35);
    pen(ctx, SHADE(0.22), 0.7);
    for (const off of [-4, 1.5, 5.5]) {
      const p0 = at(0.12, off);
      const p1 = at(0.6, off * 1.1);
      const p2 = at(0.94, off * 0.7);
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.quadraticCurveTo(...p1, ...p2);
      ctx.stroke();
    }
    shineBand(ctx);
  }, lw);
}

// ---------- The whole head ----------
// q: { turn, look, puff }; f: the eased mood; R: { fr, slN, slF, back, lean, sit, ears }.
export function drawHead(ctx, a, mode, part, q, f, R, lw) {
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  if (part === 'back') {
    backHair(ctx, a, mode, tx, R.back ?? 0, R.lean ?? 0, lw, R.sit ?? 0);
    ears(ctx, a, mode, tx, R.ears, lw);
    return;
  }
  const puff = (f?.puck ?? 0) * (q.puff ?? 1);
  poly(ctx, skullPts(tx, puff));
  if (mode === 'line') {
    pen(ctx, tone(a, SKIN_INK), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, SKIN[1]);
    ctx.fill();
  }
  if (mode === 'fill' && f) {
    ctx.save();
    poly(ctx, skullPts(tx, puff));
    ctx.clip();
    glow(ctx, tx - 1, 2, 15, SKIN[0], 0.9);
    glow(ctx, -12.6, 5, 6, SKIN[2], 0.5);
    glow(ctx, 13.6 + tx * 0.7, 5, 5, SKIN[2], 0.4);
    glow(ctx, tx * 0.5, 15.6, 8, SKIN[2], 0.28);
    const G = fringeGeom(tx, R.fr);
    ctx.beginPath();
    ctx.moveTo(G.x0, -24);
    ctx.lineTo(G.x1, -24);
    for (let k = 0; k <= 20; k++) {
      const x = G.x1 - (G.x1 - G.x0) * (k / 20);
      ctx.lineTo(x, cutY(x, G.cx) + 0.9);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, SKIN[2], 0.7);
    ctx.fill();
    ctx.restore();
    // soft pink cheeks
    for (const s of [-1, 1]) {
      const bx = tx + s * 9 + (s > 0 ? puff : -puff * 0.4);
      glow(ctx, bx, 10, 4.2, BLUSH[0], 0.36 + 0.3 * f.bl);
      glow(ctx, bx, 10, 2.3, BLUSH[1], 0.18 + 0.3 * f.bl);
    }
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look, f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.3, -1.4, s, f);
    glow(ctx, tx + 1.5, 8.8, 1.2, SKIN[3], 0.5);
    ell(ctx, tx + 1.1, 8.5, 0.3, 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 0.9, 12.2, f);
    if (q.sweat) sweat(ctx, tx - 13, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 9 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  hairShape(ctx, a, mode, capPts(tx), () => {
    glow(ctx, -15, 2, 7, HAIR.deep, 0.45);
    shineBand(ctx);
  }, lw);
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0, lw);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0, lw);
  fringe(ctx, a, mode, tx, R.fr, lw);
}
export { fringeGeom };
