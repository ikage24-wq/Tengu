// Sol and Luna, the Eclipse Twins' heads (2026-11-27, drawn from scratch: never the shared face, never the
// hero's head or hair, and never each other's: twins, but each her own face). In head units about the
// face's middle (x toward the way she faces, y down; the skull about 16 across each way), each piece drawn in
// both of the rig's passes (mode 'line': its outline, 'fill': itself), so only the outer edge is outlined;
// faces bare. (Only the plain drawing kit is shared between them: the shapes are each sister's own.)
// Sol, the elder, the sun:
//   eyes   her own family, sunburst: almond eyes lifting at the outer corner, warm irises (deep red-orange
//          at the top through orange to gold below) with fine golden rays from the pupil, a fox's upright
//          oval pupil, and a little four-rayed sun for a glint; a bold lash line, two short upturned flicks
//          at its end. The whole iris clear when she's awake.
//   brows  round, short and full, set a little low (she means it).
//   mouth  a wide, confident smile, one little round-tipped fang at its near corner; a big open grin.
//   mark   sun-kissed freckles, three on each cheek.
//   hair   sunset orange: an even blunt fringe of four rounded sections just above her lashes, short side
//          locks outside her eyes to her cheeks, a high ponytail tied with a sun-disc tie falling behind her
//          shoulders; fox ears, orange with cream insides and russet tips (round), rooted in her hair.
// Luna, the younger, the moon:
//   eyes   her own family, moonlit: big round eyes drooping a little at the outer corner (dreamy), irises
//          deep indigo at the top through periwinkle to silver below with a soft light ring, a round pupil,
//          and a little crescent moon for a glint with a tiny star by it; a soft lash line that dips at its
//          outer end into one small rounded flick. The whole iris clear when she's awake.
//   brows  round, thin and soft, set high (gentle).
//   mouth  a tiny soft bunny's "w"; a small round "o"; a little open smile.
//   mark   a tiny four-point star under her near eye's outer corner.
//   hair   silver-lilac, a hime cut: an even blunt fringe of five sections just above her lashes, long
//          straight side locks outside her eyes down to her chest, the rest straight down her back behind
//          her shoulders, a gold crescent clip at her temple; long rabbit ears, silver-white with pink
//          insides, their tips bending softly, rooted in her hair.
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear } from './fx.js';
import { SOL, LUNA } from './palette.js';

export function chaikin(pts, n = 2) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      o.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = o;
  }
  return q;
}
export function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}
const rgbaOf = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${al})`;
};

// ---------- Moods (every part eased toward them) ----------
// lid (0 open .. 1 shut: closed moods only), shut (which closed shape), bt (brow tilt: + knit, - worried),
// by (raise), mw/ms/mo (the mouth's width, smile, open), ro (a round "o"), wob (a wobbly line), bl (blush),
// sp (sparkles in the eyes), wet (tears brimming), sm (small irises), wk (a wink).
const fcOf = (F0) => (o) => ({ ...F0, wk: 0, ...o });
const S0 = { lid: 0, shut: 'happy', bt: 0.1, by: 0.1, mw: 1, ms: 0.75, mo: 0, ro: 0, wob: 0, bl: 0.55, sp: 0, wet: 0, sm: 0 };
const sf = fcOf(S0);
export const SOL_FACES = {
  grin: sf({}),
  still: sf({ ms: 0.6 }),
  cheer: sf({ bt: -0.2, by: 0.6, mw: 1.15, ms: 1, mo: 0.6, bl: 0.8, sp: 1 }),
  smug: sf({ bt: 0.25, by: 0.2, mw: 1, ms: 0.8, bl: 0.6 }),
  fierce: sf({ bt: 0.75, by: -0.15, mw: 1.05, ms: 0.55, mo: 0.15, bl: 0.5 }),
  shout: sf({ bt: 0.6, by: 0.1, mw: 1.1, ms: 0.3, mo: 0.9, bl: 0.6 }),
  proud: sf({ lid: 1, shut: 'happy', bt: 0, by: 0.4, mw: 1.05, ms: 0.95, mo: 0.2, bl: 0.7 }),
  pout: sf({ bt: 0.7, by: -0.1, mw: 0.6, ms: -0.4, bl: 0.9 }),
  shock: sf({ bt: -0.45, by: 1, mw: 0.5, ms: 0, ro: 1, sm: 0.8, bl: 0.5 }),
  sad: sf({ bt: -0.85, by: 0.25, mw: 0.7, ms: -0.55, wob: 0.7, wet: 1, bl: 0.5 }),
  hurt: sf({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.95, ms: -0.4, mo: 0.55, bl: 0.7 }),
  dizzy: sf({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.85, ms: -0.3, mo: 0.35, bl: 0.5 }),
  talk: sf({ bt: 0.05, by: 0.25, mw: 1, ms: 0.6, mo: 0.4, bl: 0.6 }),
  wink: sf({ by: 0.4, mw: 1.1, ms: 0.95, mo: 0.3, bl: 0.8, sp: 1, wk: 1 }),
};
const L0 = { lid: 0, shut: 'calm', bt: -0.15, by: 0.3, mw: 0.7, ms: 0.35, mo: 0, ro: 0, wob: 0, bl: 0.6, sp: 0, wet: 0, sm: 0 };
const lf = fcOf(L0);
export const LUNA_FACES = {
  dreamy: lf({}),
  still: lf({ ms: 0.3 }),
  happy: lf({ bt: -0.3, by: 0.6, mw: 0.9, ms: 0.9, mo: 0.45, bl: 0.9, sp: 1 }),
  sleepy: lf({ lid: 1, shut: 'calm', bt: -0.3, by: 0.3, mw: 0.6, ms: 0.25, bl: 0.7 }),
  bliss: lf({ lid: 1, shut: 'happy', bt: -0.3, by: 0.5, mw: 0.8, ms: 0.8, mo: 0.25, bl: 0.95 }),
  focus: lf({ bt: 0.45, by: 0.05, mw: 0.55, ms: 0.05, bl: 0.5 }),
  worried: lf({ bt: -0.8, by: 0.55, mw: 0.55, ms: -0.15, mo: 0.15, wob: 0.4, bl: 0.7 }),
  pout: lf({ bt: 0.6, by: 0, mw: 0.5, ms: -0.45, bl: 1 }),
  shock: lf({ bt: -0.45, by: 1, mw: 0.45, ms: 0, ro: 1, sm: 0.8, bl: 0.55 }),
  sad: lf({ bt: -0.9, by: 0.3, mw: 0.6, ms: -0.6, wob: 0.8, wet: 1, bl: 0.6 }),
  hurt: lf({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.8, ms: -0.5, mo: 0.45, bl: 0.8 }),
  dizzy: lf({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.7, ms: -0.3, mo: 0.3, bl: 0.6 }),
  talk: lf({ bt: -0.1, by: 0.35, mw: 0.75, ms: 0.4, mo: 0.35, bl: 0.65 }),
  wink: lf({ by: 0.5, mw: 0.85, ms: 0.85, mo: 0.25, bl: 0.9, sp: 1, wk: 1 }),
};
export const SHUTS = ['happy', 'calm', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'wk', 'bt', 'by', 'mw', 'ms', 'mo', 'ro', 'wob', 'bl', 'sp', 'wet', 'sm'];
export const VOWELS = [[0.55, 0.2, 0.7], [0.95, 0.45, 0.5], [0.85, 0.5, 0.25], [0.65, 0.3, 0], [0.55, 0.25, 0.45]];

// ---------- Closed eyes (each in her own lash) ----------
function closedEye(ctx, a, x, y, side, w, h, sh, lash, t, sol) {
  for (const s of SHUTS) {
    const sw = sh[s] ?? 0;
    if (sw <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha *= sw;
    ctx.lineCap = 'round';
    const inner = x - side * w;
    const outer = x + side * w;
    if (s === 'happy' || s === 'calm') {
      const up = s === 'happy' ? -1 : 1;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        pts.push([mix(inner, outer, u), y + (s === 'happy' ? 0.8 : 0.4) + up * Math.sin(Math.PI * u) * h * (s === 'happy' ? 0.45 : 0.28) + (sol ? -u * 0.4 : u * 0.3)]);
      }
      pen(ctx, tone(a, lash), 0.8);
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.stroke();
      const e = pts[12];
      pen(ctx, tone(a, lash), 0.55);
      ctx.beginPath();
      ctx.moveTo(e[0] - side * 0.5, e[1]);
      // (Sol's flick turns up; Luna's dips)
      ctx.quadraticCurveTo(e[0] + side * 0.6, e[1] + (sol ? -0.2 : 0.2), e[0] + side * 1.0, e[1] + (sol ? -0.9 : 0.7));
      ctx.stroke();
      ell(ctx, e[0] + side * 1.0, e[1] + (sol ? -0.9 : 0.7), 0.28, 0.28);
      ctx.fillStyle = tone(a, lash);
      ctx.fill();
    } else if (s === 'squeeze') {
      pen(ctx, tone(a, lash), 0.85);
      ctx.beginPath();
      ctx.moveTo(x + side * w, y - 2.2);
      ctx.quadraticCurveTo(x - side * w * 0.1, y - 0.2, x - side * w * 0.9, y + 0.4);
      ctx.quadraticCurveTo(x - side * w * 0.1, y + 0.9, x + side * w, y + 2.8);
      ctx.stroke();
    } else {
      pen(ctx, tone(a, lash), 0.6);
      ctx.beginPath();
      for (let i = 0; i <= 26; i++) {
        const an = (i / 26) * TAU * 2 + t * 4 * side * (sol ? 1 : -1);
        const r = (i / 26) * w * 0.9;
        const p = [x + Math.cos(an) * r, y + Math.sin(an) * r];
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      }
      ctx.stroke();
    }
    ctx.restore();
  }
}
// A lash: one closed outline along the top of the eye (its own curve `top(u)`), thin at the inner corner,
// thick at the outer; `wing(ox, oy)` adds the sister's own ending.
function lashLine(ctx, a, top, lash, wing) {
  const N = 14;
  const up = [];
  const lo = [];
  for (let i = 0; i <= N; i++) {
    const u = 0.1 + (i / N) * 0.84;
    const [px, py] = top(u);
    const th = 0.22 + 0.9 * (i / N) ** 1.5;
    up.push([px, py - th * 0.62]);
    lo.push([px, py + th * 0.38]);
  }
  ctx.beginPath();
  ctx.moveTo(...lo[0]);
  for (const p of up) ctx.lineTo(...p);
  wing(ctx, up[N], lo[N]);
  for (let i = N; i >= 0; i--) ctx.lineTo(...lo[i]);
  ctx.closePath();
  ctx.fillStyle = tone(a, lash);
  ctx.fill();
}

// ---------- Sol's eye: sunburst ----------
export const SOL_EYE = { y: 3.7, dx: 6.1, w: 3.9, h: 3.5, tilt: 0.12 };
function solEye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h, tilt } = SOL_EYE;
  const P = SOL;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.ecUid ?? 0) * 0.7) % 4.6, 4.05, 4.16, 4.24, 4.4) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    closedEye(ctx, a, x, y, side, w, h, f.wk > 0.5 && f.lid < 0.5 ? { happy: 1 } : blink > shutK ? { calm: 1 } : f.shut, P.lash, t, true);
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  glow(ctx, x + side * 0.6, y - h * 0.95, 4.2, '#ffb08a', 0.32);
  // the white: an almond, its outer corner lifting
  const shape = () => {
    ctx.beginPath();
    ctx.ellipse(x, y, w, h, -side * tilt, 0, TAU);
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdfa');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.34 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.5;
  const iy = y + 0.25 + (look?.[1] ?? 0) * 0.4;
  const R = 3.05 * small;
  const g = ctx.createLinearGradient(0, iy - R, 0, iy + R);
  g.addColorStop(0, tone(a, P.iris[3]));
  g.addColorStop(0.4, tone(a, P.iris[2]));
  g.addColorStop(0.78, tone(a, P.iris[1]));
  g.addColorStop(1, tone(a, P.iris[0]));
  ell(ctx, ix, iy, R, R * 1.06);
  ctx.fillStyle = g;
  ctx.fill();
  // fine golden rays from the pupil
  pen(ctx, tone(a, '#fff0a0', 0.55), 0.24);
  for (let i = 0; i < 12; i++) {
    const an = (i / 12) * TAU;
    ctx.beginPath();
    ctx.moveTo(ix + Math.cos(an) * R * 0.38, iy + Math.sin(an) * R * 0.4);
    ctx.lineTo(ix + Math.cos(an) * R * (i % 2 ? 0.7 : 0.86), iy + Math.sin(an) * R * (i % 2 ? 0.74 : 0.9));
    ctx.stroke();
  }
  ell(ctx, ix, iy, R, R * 1.06);
  pen(ctx, tone(a, '#8a3022', 0.8), 0.45);
  ctx.stroke();
  // a fox's upright oval pupil, soft and round at both ends
  ell(ctx, ix, iy + 0.1, R * 0.26, R * 0.56);
  ctx.fillStyle = tone(a, P.pupil);
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.45);
  sg.addColorStop(0, 'rgba(140,60,50,0.3)');
  sg.addColorStop(1, 'rgba(140,60,50,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.2, y - h * 1.1, w * 2.4, h * 0.7);
  // her glint: a little four-rayed sun (a bigger sparkle when she's delighted), a dot at the front
  const gx = ix - side * R * 0.38;
  const gy = iy - R * 0.4;
  const s4 = 1.05 + 0.8 * f.sp;
  ctx.beginPath();
  ctx.moveTo(gx, gy - s4);
  ctx.quadraticCurveTo(gx + 0.15, gy - 0.15, gx + s4, gy);
  ctx.quadraticCurveTo(gx + 0.15, gy + 0.15, gx, gy + s4);
  ctx.quadraticCurveTo(gx - 0.15, gy + 0.15, gx - s4, gy);
  ctx.quadraticCurveTo(gx - 0.15, gy - 0.15, gx, gy - s4);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, gx, gy, 0.45, 0.45);
  ctx.fill();
  ell(ctx, ix + side * R * 0.45, iy + R * 0.5, 0.42, 0.42);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  if (f.wet > 0.05) {
    ell(ctx, ix, y + h * 0.62, w * 0.85, 0.85);
    ctx.fillStyle = `rgba(230,242,255,${0.75 * f.wet})`;
    ctx.fill();
  }
  ctx.restore();
  // the bold lash line along the top, two short upturned flicks at its end
  const top = (u) => {
    const an = Math.PI + (side > 0 ? u : 1 - u) * Math.PI;
    const px = Math.cos(an) * w * 1.03;
    const py = Math.sin(an) * h * 1.06;
    const c = Math.cos(-side * tilt);
    const s = Math.sin(-side * tilt);
    return [x + px * c - py * s, y + px * s + py * c];
  };
  lashLine(ctx, a, top, P.lash, (c, U, Lo) => {
    c.quadraticCurveTo(U[0] + side * 0.9, U[1] - 0.2, U[0] + side * 1.35, U[1] - 0.75);
    c.quadraticCurveTo(U[0] + side * 1.5, U[1] - 0.45, Lo[0] + side * 0.6, Lo[1] - 0.1);
  });
  ctx.lineCap = 'round';
  pen(ctx, tone(a, P.lash), 0.42);
  for (const [u, l] of [[0.74, 0.9], [0.86, 1.05]]) {
    const [px, py] = top(u);
    ctx.beginPath();
    ctx.moveTo(px, py - 0.35);
    ctx.quadraticCurveTo(px + side * 0.35, py - 1.0, px + side * l, py - 1.15 - l * 0.2);
    ctx.stroke();
  }
  ctx.restore();
}
// ---------- Luna's eye: moonlit ----------
export const LUNA_EYE = { y: 4.2, dx: 6.0, w: 3.8, h: 4.3 };
function lunaEye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h } = LUNA_EYE;
  const P = LUNA;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.ecUid ?? 0) * 1.1 + 2.1) % 5.8, 5.1, 5.25, 5.35, 5.55) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    closedEye(ctx, a, x, y, side, w, h, f.wk > 0.5 && f.lid < 0.5 ? { calm: 1 } : blink > shutK ? { calm: 1 } : f.shut, P.lash, t, false);
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  glow(ctx, x + side * 0.4, y - h * 0.9, 4.4, '#c4b8ff', 0.34);
  const shape = () => ell(ctx, x, y, w, h);
  shape();
  ctx.fillStyle = tone(a, '#fefdff');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.34 * f.sm;
  const ix = x + side * 0.1 + (look?.[0] ?? 0) * 0.5;
  const iy = y + 0.45 + (look?.[1] ?? 0) * 0.45;
  const R = 3.2 * small;
  const g = ctx.createLinearGradient(0, iy - R * 1.1, 0, iy + R * 1.1);
  g.addColorStop(0, tone(a, P.iris[3]));
  g.addColorStop(0.45, tone(a, P.iris[2]));
  g.addColorStop(0.8, tone(a, P.iris[1]));
  g.addColorStop(1, tone(a, P.iris[0]));
  ell(ctx, ix, iy, R, R * 1.12);
  ctx.fillStyle = g;
  ctx.fill();
  ell(ctx, ix, iy, R, R * 1.12);
  pen(ctx, tone(a, '#3a3290', 0.75), 0.4);
  ctx.stroke();
  // a soft light ring, the round pupil
  ell(ctx, ix, iy + 0.15, R * 0.64, R * 0.72);
  pen(ctx, tone(a, '#e8ecff', 0.5), 0.32);
  ctx.stroke();
  ell(ctx, ix, iy + 0.15, R * 0.4, R * 0.45);
  ctx.fillStyle = tone(a, P.pupil);
  ctx.fill();
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.5);
  sg.addColorStop(0, 'rgba(90,80,150,0.3)');
  sg.addColorStop(1, 'rgba(90,80,150,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.2, y - h * 1.1, w * 2.4, h * 0.6);
  // her glint: a little crescent moon (a sparkle when she's delighted), a tiny star by it
  const gx = ix - side * R * 0.36;
  const gy = iy - R * 0.42;
  ctx.save();
  ctx.globalAlpha *= 1 - f.sp;
  ctx.beginPath();
  ctx.arc(gx, gy, 1.2, 0, TAU);
  ctx.arc(gx + side * 0.6, gy - 0.35, 1.0, 0, TAU, true);
  ctx.fillStyle = '#ffffff';
  ctx.fill('evenodd');
  ctx.restore();
  if (f.sp > 0.02) {
    const s4 = 1.8 * f.sp;
    ctx.save();
    ctx.globalAlpha *= f.sp;
    ctx.beginPath();
    ctx.moveTo(gx, gy - s4);
    ctx.quadraticCurveTo(gx, gy, gx + s4, gy);
    ctx.quadraticCurveTo(gx, gy, gx, gy + s4);
    ctx.quadraticCurveTo(gx, gy, gx - s4, gy);
    ctx.quadraticCurveTo(gx, gy, gx, gy - s4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  ell(ctx, ix + side * R * 0.45, iy + R * 0.55, 0.4, 0.4);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  if (f.wet > 0.05) {
    ell(ctx, ix, y + h * 0.66, w * 0.85, 0.9);
    ctx.fillStyle = `rgba(230,236,255,${0.75 * f.wet})`;
    ctx.fill();
  }
  ctx.restore();
  // the soft lash line, dipping at its outer end into one small rounded flick
  const top = (u) => {
    const an = Math.PI + (side > 0 ? u : 1 - u) * Math.PI;
    const k = side > 0 ? u : 1 - u;
    return [x + Math.cos(an) * w * 1.03, y + Math.sin(an) * h * 1.03 + sstep((k - 0.6) / 0.4) * (side > 0 ? 0.5 : 0) + sstep((0.4 - k) / 0.4) * (side < 0 ? 0.5 : 0)];
  };
  lashLine(ctx, a, top, P.lash, (c, U, Lo) => {
    c.quadraticCurveTo(U[0] + side * 0.8, U[1] + 0.1, U[0] + side * 1.2, U[1] + 0.75);
    c.quadraticCurveTo(U[0] + side * 1.25, U[1] + 1.05, Lo[0] + side * 0.4, Lo[1] + 0.2);
  });
  ctx.restore();
}

// ---------- Brows and mouths ----------
function brow(ctx, a, x, y, side, f, col, w, len) {
  const yi = y - f.by * 0.5 + f.bt * 0.6;
  const yo = y - f.by * 0.5 - f.bt * 0.2;
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, col), w);
  ctx.beginPath();
  ctx.moveTo(x - side * len * 0.48, yi);
  ctx.quadraticCurveTo(x, Math.min(yi, yo) - 0.45, x + side * len * 0.52, yo + 0.1);
  ctx.stroke();
  ctx.restore();
}
function solMouth(ctx, a, x, y, f) {
  const P = SOL;
  const w = 1.7 * f.mw;
  const cy = y - f.ms * 0.55;
  if (f.ro > 0.3) {
    ell(ctx, x, y + 0.4, 0.9 * f.ro + 0.2, 1.1 * f.ro + 0.2);
    ctx.fillStyle = tone(a, P.lip.in);
    ctx.fill();
    pen(ctx, tone(a, P.lip.base), 0.4);
    ctx.stroke();
    return;
  }
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.4 - o * 0.3, x + w, cy - 0.2);
    ctx.quadraticCurveTo(x, y + f.ms * 0.9 + o * 2.6, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, P.lip.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + f.ms * 0.7 + o * 2.1, w * 0.7, o * 0.9);
    ctx.fillStyle = tone(a, P.lip.tongue);
    ctx.fill();
    ctx.restore();
    fang(ctx, a, x + w * 0.55, cy + 0.15, 0.7);
    return;
  }
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, P.lip.sh), 0.5);
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const px = x - w + u * w * 2;
    const py = cy + Math.sin(Math.PI * u) * f.ms * 0.9 + Math.sin(u * Math.PI * 4) * f.wob * 0.35;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  if (f.ms > 0.3) fang(ctx, a, x + w * 0.55, cy + Math.sin(Math.PI * 0.78) * f.ms * 0.9 - 0.05, 0.6);
  glow(ctx, x, y + 1, 1.4, P.lip.base, 0.3);
}
// (her little fang: a soft white drop with a round tip)
function fang(ctx, a, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x - s * 0.55, y);
  ctx.quadraticCurveTo(x - s * 0.2, y + s * 1.2, x, y + s * 1.25);
  ctx.quadraticCurveTo(x + s * 0.25, y + s * 1.15, x + s * 0.45, y);
  ctx.closePath();
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  pen(ctx, tone(a, SOL.lip.sh, 0.6), 0.18);
  ctx.stroke();
}
function lunaMouth(ctx, a, x, y, f) {
  const P = LUNA;
  const w = 1.25 * f.mw;
  const cy = y - f.ms * 0.4;
  if (f.ro > 0.3) {
    ell(ctx, x, y + 0.4, 0.75 * f.ro + 0.2, 0.95 * f.ro + 0.2);
    ctx.fillStyle = tone(a, P.lip.in);
    ctx.fill();
    pen(ctx, tone(a, P.lip.base), 0.4);
    ctx.stroke();
    return;
  }
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.4 - o * 0.3, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.8 + o * 2.1, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, P.lip.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + f.ms * 0.6 + o * 1.8, w * 0.7, o * 0.8);
    ctx.fillStyle = tone(a, P.lip.tongue);
    ctx.fill();
    ctx.restore();
    return;
  }
  // the bunny's "w": two soft little curves meeting under her nose
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, P.lip.sh), 0.45);
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const u = i / 16;
    const px = x - w + u * w * 2;
    const half = u < 0.5 ? u * 2 : (u - 0.5) * 2;
    const py = cy - 0.15 + Math.sin(Math.PI * half) * (0.35 + f.ms * 0.55) - Math.max(0, -f.ms) * Math.sin(Math.PI * u) * 0.6 + Math.sin(u * Math.PI * 5) * f.wob * 0.3;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x, y + 0.9, 1.2, P.lip.base, 0.3);
}

// ---------- Faces ----------
export function skullPts(tx, round = 0) {
  return chaikin([[0, -17.8], [11.8, -13.6], [15.8, -4.2], [15.6 + round, 4.8], [12 + round, 11], [5.6 + tx * 0.2 + round, 15.2], [0.8 + tx * 0.35, 16.4 - round * 0.4], [-4.4 + tx * 0.2 - round, 15.2], [-11.6 - round, 11], [-15.6 - round, 4.8], [-16, -4.2], [-11.8, -13.6]], 3);
}

// ---------- Hair (the kit) ----------
function hairFill(ctx, a, H, y0 = -22, y1 = 40) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(a, H.lt));
  g.addColorStop(0.3, tone(a, H.base));
  g.addColorStop(0.7, tone(a, H.sh));
  g.addColorStop(1, tone(a, H.deep));
  return g;
}
function shineBand(ctx, col, y = -9.6) {
  const g = ctx.createLinearGradient(0, y - 2.4, 0, y + 2.4);
  g.addColorStop(0, rgbaOf(col, 0));
  g.addColorStop(0.5, rgbaOf(col, 0.55));
  g.addColorStop(1, rgbaOf(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-80, y - 2.4, 160, 4.8);
  pen(ctx, 'rgba(255,255,255,0.75)', 0.3);
  for (const [x, l] of [[-11, 2], [-4.4, 1.4], [2.6, 2.4], [9.6, 1.6]]) {
    const yy = y - 0.3 + 0.004 * x * x;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + l / 2, yy - 0.4, x + l, yy + 0.1);
    ctx.stroke();
  }
}
function hairShape(ctx, a, mode, H, pts, shade, lw, y0, y1) {
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, tone(a, H.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = hairFill(ctx, a, H, y0, y1);
  ctx.fill();
  if (shade) {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    shade();
    ctx.restore();
  }
}
// An even blunt fringe of sections (`splits`: [where, how deep, how wide the gap]) along a gentle U cut.
function fringeGeom(tx, sw, C, splits) {
  const cx = 0.6 + tx * 0.6;
  const cutY = (x) => C.y + C.rise * Math.min(1, ((x - cx) / C.half) ** 2);
  const x0 = cx - C.half - 0.9;
  const x1 = cx + C.half + 0.9;
  const W = x1 - x0;
  const topY = (x) => -16.6 + 0.02 * (x - cx) ** 2;
  const xs = [x0, ...splits.map(([u]) => x0 + W * u), x1];
  const secs = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const L = xs[i];
    const R = xs[i + 1];
    const sl = i > 0 ? splits[i - 1] : null;
    const sr = i < splits.length ? splits[i] : null;
    const dx = (sw?.[i % 3] ?? 0) * 2.6 * (i % 2 ? -1 : 1);
    const lb = sl ? L + sl[2] / 2 : L + 0.4;
    const rb = sr ? R - sr[2] / 2 : R - 0.4;
    const pts = [[L, topY(L)], [R, topY(R)]];
    if (sr) pts.push([R, cutY(R) - sr[1]]);
    for (let k = 0; k <= 6; k++) {
      const x = rb + (lb - rb) * (k / 6);
      pts.push([x + dx * (1 - Math.abs(k / 6 - 0.5) * 2) * 0.3 + dx * 0.4, cutY(x) + 0.4 * Math.sin(Math.PI * (k / 6))]);
    }
    if (sl) pts.push([L, cutY(L) - sl[1]]);
    secs.push({ pts: chaikin(pts, 2), L, R, mid: (L + R) / 2 });
  }
  return { cx, x0, x1, secs, topY, cutY };
}
function fringe(ctx, a, mode, H, shadeCol, G, lw) {
  const inner = chaikin([[G.x0 + 0.6, G.topY(G.x0) + 1], [G.x1 - 0.6, G.topY(G.x1) + 1], ...Array.from({ length: 9 }, (_, k) => {
    const x = G.x1 - 0.8 - (G.x1 - G.x0 - 1.6) * (k / 8);
    return [x, G.cutY(x) - 0.2];
  })], 2);
  poly(ctx, inner);
  if (mode === 'line') {
    pen(ctx, tone(a, H.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, H.deep);
    ctx.fill();
  }
  for (const s of G.secs) {
    hairShape(ctx, a, mode, H, s.pts, () => {
      const cy = G.cutY(s.mid);
      const g = ctx.createLinearGradient(0, cy - 4, 0, cy + 0.6);
      g.addColorStop(0, rgbaOf(shadeCol, 0));
      g.addColorStop(1, rgbaOf(shadeCol, 0.42));
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -22, s.R - s.L + 4, 26);
      for (const [ex, k] of [[s.L, 1], [s.R, -1]]) {
        const sg = ctx.createLinearGradient(0, -12, 0, G.cutY(ex));
        sg.addColorStop(0, rgbaOf(shadeCol, 0));
        sg.addColorStop(1, rgbaOf(shadeCol, 0.36));
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ex + k * 0.3, -12);
        ctx.quadraticCurveTo(ex + k * 0.5, (G.cutY(ex) - 12) / 2, ex + k * 0.4, G.cutY(ex));
        ctx.stroke();
      }
      shineBand(ctx, H.lt);
    }, lw);
  }
}
function capPts(tx) {
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const an = Math.PI * (0.98 + (i / 18) * 1.04);
    const off = 1.5 + Math.max(0, -Math.sin(an)) * 1.3;
    pts.push([Math.cos(an) * (16.6 + off), Math.sin(an) * (17.8 + off) + 0.4]);
  }
  return chaikin([[-17.6, 4], ...pts, [17.8, 1], [12, -5], [tx, -8], [-9, -6], [-15.8, -1]], 2);
}
// A side lock outside the eye from under the fringe down to `end`, its end one soft round.
function sideLock(ctx, a, mode, H, shadeCol, side, tx, sway, end, width, lw) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 11.6 : -11;
  const outX = inX + side * width;
  const sx = (v) => v + shift;
  const s = sway * 2.6;
  const E = end;
  const pts = chaikin([
    [sx(outX - side * 0.4), -9.6], [sx(inX - side * 1.3), -9.2], [sx(inX), -2], [sx(inX + side * 0.3) + s * 0.3, E * 0.45],
    [sx(inX + side * 0.6) + s * 0.8, E - 1.6], [sx(inX + side * 1.1) + s, E], [sx((inX + outX) / 2) + s, E + 1.2],
    [sx(outX - side * 0.6) + s, E - 0.2], [sx(outX) + s * 0.9, E - 2], [sx(outX + side * 0.4) + s * 0.5, E * 0.45], [sx(outX + side * 0.2), -3],
  ], 3);
  hairShape(ctx, a, mode, H, pts, () => {
    const g = ctx.createLinearGradient(0, -10, 0, -4);
    g.addColorStop(0, rgbaOf(shadeCol, 0.45));
    g.addColorStop(1, rgbaOf(shadeCol, 0));
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(sx(outX), sx(inX)) - 4, -11, 14, 7);
    glow(ctx, sx(inX + side * 0.8), E * 0.6, 3, H.deep, 0.3);
    shineBand(ctx, H.lt);
  }, lw, -22, E + 4);
}

// ---------- Sol's hair and ears ----------
const SOL_CUT = { y: -3.4, rise: 2.6, half: 14.2 };
const SOL_SPLITS = [[0.22, 2.6, 1.0], [0.5, 3.4, 1.2], [0.77, 2.6, 1.0]];
const SOL_SHADE = '#c8502a';
// A fox ear rooted in her crown: a soft rounded triangle, a cream inside, a russet tip (round).
function foxEar(ctx, a, mode, x, y, ang, s, far, lw) {
  const F = SOL.fur;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const outer = chaikin([[-4.2 * s, 2], [-3.4 * s, -4 * s], [-0.8 * s, -9.6 * s], [0, -10.4 * s], [0.9 * s, -9.6 * s], [3.4 * s, -4 * s], [4.2 * s, 2]], 2);
  poly(ctx, outer);
  if (mode === 'line') {
    pen(ctx, tone(a, F.ink), lw);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, far ? F.sh : F.base);
  ctx.fill();
  ctx.save();
  poly(ctx, outer);
  ctx.clip();
  // (its russet tip, a soft band)
  const g = ctx.createLinearGradient(0, -10.4 * s, 0, -5 * s);
  g.addColorStop(0, tone(a, F.tip));
  g.addColorStop(1, rgbaOf(F.tip, 0));
  ctx.fillStyle = g;
  ctx.fillRect(-6 * s, -11 * s, 12 * s, 7 * s);
  const inner = chaikin([[-2.4 * s, 1], [-1.8 * s, -4 * s], [-0.4 * s, -7.4 * s], [0.4 * s, -7.4 * s], [1.8 * s, -4 * s], [2.4 * s, 1]], 2);
  poly(ctx, inner);
  ctx.fillStyle = tone(a, far ? F.inner : F.cream);
  ctx.fill();
  // (soft fluff tufts inside, round)
  for (const [tx, ty] of [[-0.8, -1.4], [0.7, -2.6]]) {
    ell(ctx, tx * s, ty * s, 0.9 * s, 1.3 * s);
    ctx.fillStyle = tone(a, '#ffffff', 0.8);
    ctx.fill();
  }
  ctx.restore();
  ctx.restore();
}
// Her high ponytail (behind): from the tie at the back of her crown, a full soft tail falling behind her
// shoulders, one smooth taper to a soft round end curling out; the sun-disc tie over its root.
function ponytail(ctx, a, mode, tx, sw, lw) {
  const H = SOL.hair;
  const s = sw ?? 0;
  const rx = -11 + tx * 0.1;
  const ry = -15;
  const L = 34;
  const pts = [[rx - 2.6, ry - 3.4], [rx + 3, ry - 3.2], [rx + 4.6, ry + 1]];
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    pts.push([rx + 3.4 - u * 6 + Math.sin(u * Math.PI) * 2.6 + s * 8 * u * u, ry + u * L]);
  }
  pts.push([rx - 6.8 + s * 8.6, ry + L + 2.6]);
  for (let i = 6; i >= 1; i--) {
    const u = i / 6;
    pts.push([rx - 4.4 - u * 6.4 - Math.sin(u * Math.PI) * 2.2 + s * 7.6 * u * u, ry + u * L * 0.97]);
  }
  hairShape(ctx, a, mode, H, chaikin(pts, 3), () => {
    glow(ctx, rx - 4 + s * 3, ry + L * 0.6, L * 0.35, H.deep, 0.5);
    pen(ctx, rgbaOf(SOL_SHADE, 0.25), 0.7);
    ctx.beginPath();
    ctx.moveTo(rx - 1, ry + 2);
    ctx.quadraticCurveTo(rx - 4 + s * 2, ry + L * 0.5, rx - 6 + s * 7, ry + L);
    ctx.stroke();
    shineBand(ctx, H.lt, ry + 8);
  }, lw, -22, ry + L + 4);
  // the sun-disc tie: a gold disc with soft round rays
  ctx.save();
  ctx.translate(rx + 0.6, ry - 0.6);
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU + 0.2;
    ctx.moveTo(Math.cos(an) * 3.2 + 1, Math.sin(an) * 3.2);
    ctx.arc(Math.cos(an) * 3.2, Math.sin(an) * 3.2, 1, 0, TAU);
  }
  ctx.moveTo(2.6, 0);
  ctx.arc(0, 0, 2.6, 0, TAU);
  if (mode === 'line') {
    pen(ctx, tone(a, SOL.gold.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, SOL.gold.base);
    ctx.fill();
    ell(ctx, -0.7, -0.8, 1, 0.7);
    ctx.fillStyle = tone(a, SOL.gold.lt);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Luna's hair and ears ----------
const LUNA_CUT = { y: -3.3, rise: 2.2, half: 14.4 };
const LUNA_SPLITS = [[0.17, 2.4, 0.9], [0.38, 3.2, 1.1], [0.62, 3.2, 1.1], [0.83, 2.4, 0.9]];
const LUNA_SHADE = '#6a64b8';
// A long rabbit ear rooted in her crown, its tip bending softly (bend: how far, + toward the back).
function bunEar(ctx, a, mode, x, y, ang, bend, s, far, lw) {
  const F = LUNA.fur;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  const L = 17 * s;
  const at = (u, v) => {
    const b = bend * sstep((u - 0.45) / 0.55);
    const th = -Math.PI / 2 - b * 0.9 * u;
    return [Math.cos(th) * L * u - Math.sin(th) * v * 0 + v * Math.cos(th + Math.PI / 2), Math.sin(th) * L * u + v * Math.sin(th + Math.PI / 2)];
  };
  const wd = (u) => (2.2 + 1.6 * Math.sin(Math.PI * Math.min(1, u * 1.15))) * s;
  const side = (sgn, k) => Array.from({ length: 9 }, (_, i) => {
    const u = i / 8;
    return at(u, sgn * wd(u) * k);
  });
  const outline = chaikin([...side(-1, 1), ...side(1, 1).reverse()], 2);
  poly(ctx, outline);
  if (mode === 'line') {
    pen(ctx, tone(a, F.ink), lw);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, far ? F.sh : F.base);
  ctx.fill();
  ctx.save();
  poly(ctx, outline);
  ctx.clip();
  const inner = chaikin([...side(-1, 0.5).slice(1, 8), ...side(1, 0.5).slice(1, 8).reverse()], 2);
  poly(ctx, inner);
  ctx.fillStyle = tone(a, far ? '#f4b0cc' : F.inner, 0.85);
  ctx.fill();
  glow(ctx, ...at(0.9, 0), 4 * s, F.tip, 0.5);
  ctx.restore();
  ctx.restore();
}
// Her long straight hair behind her, down past her shoulders; its end trimmed straight with soft corners.
function lunaBack(ctx, a, mode, tx, sw, lw) {
  const H = LUNA.hair;
  const s = sw ?? 0;
  const L = 46;
  const pts = [[-17.6, -6], [-12, -18.6], [0, -21.2], [12, -18.2], [17.8, -6]];
  for (let i = 1; i <= 5; i++) {
    const u = i / 5;
    pts.push([19.4 + u * 2 + s * 6 * u, -6 + u * (L + 6)]);
  }
  pts.push([17 + s * 6.4, L + 1.6], [6 + s * 6.4, L + 2.2], [-6 + s * 6.2, L + 2.2], [-17 + s * 6, L + 1.6]);
  for (let i = 5; i >= 1; i--) {
    const u = i / 5;
    pts.push([-19.6 - u * 2 + s * 5.6 * u, -6 + u * (L + 6)]);
  }
  hairShape(ctx, a, mode, H, chaikin(pts, 3), () => {
    glow(ctx, s * 3, L * 0.5, L * 0.45, H.deep, 0.45);
    pen(ctx, rgbaOf(LUNA_SHADE, 0.22), 0.8);
    for (const x of [-9, 0, 9]) {
      ctx.beginPath();
      ctx.moveTo(x, 4);
      ctx.quadraticCurveTo(x + s * 2, L * 0.5, x + s * 6, L);
      ctx.stroke();
    }
    shineBand(ctx, H.lt);
  }, lw, -22, L + 4);
}
// A gold crescent clip at her temple.
function crescentClip(ctx, a, mode, x, y, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.5);
  ctx.beginPath();
  ctx.arc(0, 0, 2.4, Math.PI * 0.35, Math.PI * 1.65);
  ctx.arc(1.1, -0.2, 1.9, Math.PI * 1.55, Math.PI * 0.45, true);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, tone(a, LUNA.gold.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, LUNA.gold.base);
    ctx.fill();
    ell(ctx, -1.3, -0.9, 0.5, 0.4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}

// ---------- The whole head ----------
function face(ctx, a, mode, q, f, R, lw, P, round, G) {
  const tx = (q.turn ?? 0.35) * 4;
  poly(ctx, skullPts(tx, round));
  if (mode === 'line') {
    pen(ctx, tone(a, P.skinInk), lw);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = tone(a, P.skin[1]);
  ctx.fill();
  if (!f) return;
  ctx.save();
  poly(ctx, skullPts(tx, round));
  ctx.clip();
  glow(ctx, tx - 1, 2, 15, P.skin[0], 0.9);
  glow(ctx, -12.4, 4, 6, P.skin[2], 0.5);
  glow(ctx, 13.2 + tx * 0.7, 4, 5, P.skin[2], 0.4);
  glow(ctx, tx * 0.5, 15, 8, P.skin[2], 0.3);
  ctx.beginPath();
  ctx.moveTo(G.x0, -22);
  ctx.lineTo(G.x1, -22);
  for (let k = 0; k <= 20; k++) {
    const x = G.x1 - (G.x1 - G.x0) * (k / 20);
    ctx.lineTo(x, G.cutY(x) + 0.85);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, P.skin[2], 0.7);
  ctx.fill();
  ctx.restore();
  for (const s of [-1, 1]) {
    const bx = tx + s * 8.4;
    glow(ctx, bx, 8.8, 3.6, P.blush[0], 0.3 + 0.28 * f.bl);
    glow(ctx, bx, 8.8, 2, P.blush[1], 0.18 + 0.32 * f.bl);
  }
}
export function drawSol(ctx, a, mode, part, q, f, R, lw) {
  const tx = (q.turn ?? 0.35) * 4;
  const G = fringeGeom(tx, R.fr, SOL_CUT, SOL_SPLITS);
  const H = SOL.hair;
  if (part === 'back') {
    ponytail(ctx, a, mode, tx, R.back ?? 0, lw);
    foxEar(ctx, a, mode, -9.6 + tx * 0.3, -14.2, -0.42 + (R.earF ?? 0), 1, true, lw);
    return;
  }
  face(ctx, a, mode, q, f, R, lw, SOL, 0, G);
  if (mode === 'fill' && f) {
    // sun-kissed freckles, three on each cheek
    for (const s of [-1, 1]) for (const [dx, dy] of [[-1.2, 0.2], [0, -0.5], [1.2, 0.3]]) {
      ell(ctx, tx + s * 8.6 + dx, 7.4 + dy, 0.36, 0.32);
      ctx.fillStyle = tone(a, SOL.freckle, 0.75);
      ctx.fill();
    }
    for (const s of [-1, 1]) solEye(ctx, a, tx + s * SOL_EYE.dx, SOL_EYE.y, s, f, q.look, s < 0 ? Math.max(f.lid, f.wk) : f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * SOL_EYE.dx + s * 0.2, -1.6, s, f, SOL.brow, 1.05, 3);
    glow(ctx, tx + 1.6, 7.8, 1.2, SOL.skin[3], 0.5);
    ell(ctx, tx + 1.2, 7.4, 0.32, 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    solMouth(ctx, a, tx + 1, 11.4, f);
    if (q.sweat) sweat(ctx, tx - 12.8, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (f.wet > 0.6 && q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 7.6 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  // the near ear before the cap, so its root is tucked into her hair
  foxEar(ctx, a, mode, 8.4 + tx * 0.6, -14.6, 0.36 + (R.earN ?? 0), 1, false, lw);
  hairShape(ctx, a, mode, H, capPts(tx), () => {
    glow(ctx, -15, 2, 7, H.deep, 0.45);
    shineBand(ctx, H.lt);
  }, lw);
  sideLock(ctx, a, mode, H, SOL_SHADE, -1, tx, R.slN ?? 0, 8.6, 5.2, lw);
  sideLock(ctx, a, mode, H, SOL_SHADE, 1, tx, R.slF ?? 0, 8.6, 5.2, lw);
  fringe(ctx, a, mode, H, SOL_SHADE, G, lw);
}
export function drawLuna(ctx, a, mode, part, q, f, R, lw) {
  const tx = (q.turn ?? 0.35) * 4;
  const G = fringeGeom(tx, R.fr, LUNA_CUT, LUNA_SPLITS);
  const H = LUNA.hair;
  if (part === 'back') {
    lunaBack(ctx, a, mode, tx, R.back ?? 0, lw);
    bunEar(ctx, a, mode, -6.6 + tx * 0.3, -15.6, -0.32 + (R.earF ?? 0), 0.6 + (R.droopF ?? 0), 1, true, lw);
    return;
  }
  face(ctx, a, mode, q, f, R, lw, LUNA, 0.6, G);
  if (mode === 'fill' && f) {
    for (const s of [-1, 1]) lunaEye(ctx, a, tx + s * LUNA_EYE.dx, LUNA_EYE.y, s, f, q.look, s < 0 ? Math.max(f.lid, f.wk) : f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * LUNA_EYE.dx + s * 0.1, -1.7, s, f, LUNA.brow, 0.8, 2.8);
    // her little star mark under her near eye's outer corner
    const mx = tx + LUNA_EYE.dx + 3.4;
    const my = 9.2;
    ctx.beginPath();
    ctx.moveTo(mx, my - 0.8);
    ctx.quadraticCurveTo(mx, my, mx + 0.8, my);
    ctx.quadraticCurveTo(mx, my, mx, my + 0.8);
    ctx.quadraticCurveTo(mx, my, mx - 0.8, my);
    ctx.quadraticCurveTo(mx, my, mx, my - 0.8);
    ctx.fillStyle = tone(a, '#9a94e8', 0.85);
    ctx.fill();
    glow(ctx, tx + 1.4, 8.2, 1.1, LUNA.skin[3], 0.5);
    ell(ctx, tx + 1.1, 7.9, 0.3, 0.2);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    lunaMouth(ctx, a, tx + 1, 11.6, f);
    if (q.sweat) sweat(ctx, tx - 12.8, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (f.wet > 0.6 && q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 8 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  bunEar(ctx, a, mode, 5.6 + tx * 0.6, -16.2, 0.26 + (R.earN ?? 0), 0.4 + (R.droopN ?? 0), 1, false, lw);
  hairShape(ctx, a, mode, H, capPts(tx), () => {
    glow(ctx, -15, 2, 7, H.deep, 0.45);
    shineBand(ctx, H.lt);
  }, lw);
  sideLock(ctx, a, mode, H, LUNA_SHADE, -1, tx, R.slN ?? 0, 27, 5.6, lw);
  sideLock(ctx, a, mode, H, LUNA_SHADE, 1, tx, R.slF ?? 0, 27, 5.6, lw);
  fringe(ctx, a, mode, H, LUNA_SHADE, G, lw);
  crescentClip(ctx, a, mode, 12.6 + tx * 0.75, -7.6, lw);
}
