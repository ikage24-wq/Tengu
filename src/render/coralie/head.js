// Queen Coralie's head (2026-11-26, drawn from scratch: never the shared face, never the hero's head or
// hair): her face and its moods, her long seafoam hair, her coral crown. In head units about her face's
// middle (x toward the way she faces, y down; the skull about 16 across each way), each piece drawn in
// both of the rig's passes (mode 'line': its outline, 'fill': itself), so only her outer edge is
// outlined; her face bare.
//   eyes   her own family: big round doll eyes, the whole round iris always clear (deep sea blue at the
//          top through aqua to a pink glow at the bottom), a big round pearl of a glint up at the back
//          with a little one under it and a tiny one at the front; the upper lash a soft rounded line
//          ending in three small round flicks at the outer corner; a short lower lash. Only blinks and
//          closed moods (proud, bliss, sob, squeeze, dizzy) cover them.
//   brows  short soft rounded brows, set high (a young queen's open face).
//   mouth  small and rosy: a sweet little smile at rest, a round "o", a wobbly pout, a big open laugh.
//   hair   seafoam: an even blunt fringe of four rounded sections stopping just above her lashes, a long
//          side lock each side outside her eyes down to her chest with a soft wave in it and a pearl bead
//          at its end, and the long hair behind her shoulders falling in big soft waves down her back
//          (three rounded waves each side, its ends a soft scalloped round); one shared light from above
//          and one pearly shine band across it all.
//   crown  a little crown of branching coral on a gold band, every branch tip round, a pearl at the
//          front and pearls on the tallest tips.
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear } from './fx.js';
import { SKIN, SKIN_INK, HAIR, CORAL, PEARL, GOLD, LASH, BROW, IRIS, PUPIL, LIP, BLUSH } from './palette.js';

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

// ---------- Her moods (every part eased toward them) ----------
// lid (0 open .. 1 shut: only closed moods), shut (which closed shape), bt (brow tilt: + knit, -
// worried), by (raise), mw/ms/mo (the mouth's width, smile, open), ro (a round "o"), wob (a wobbly
// line), po (a pout), bl (blush), sp (sparkles in her eyes), wet (tears brimming), sm (small irises).
const F0 = { lid: 0, shut: 'happy', bt: -0.1, by: 0.25, mw: 0.8, ms: 0.5, mo: 0, ro: 0, wob: 0, po: 0, bl: 0.55, sp: 0, wet: 0, sm: 0 };
const fc = (o) => ({ ...F0, ...o });
export const FACES = {
  regal: fc({}),
  still: fc({ by: 0.3, ms: 0.65, mw: 0.85, bl: 0.6 }),
  delighted: fc({ bt: -0.25, by: 0.7, mw: 1.1, ms: 1, mo: 0.55, bl: 0.85, sp: 1 }),
  proud: fc({ lid: 1, shut: 'happy', bt: -0.1, by: 0.5, mw: 0.9, ms: 0.8, bl: 0.7 }),
  bliss: fc({ lid: 1, shut: 'happy', bt: -0.3, by: 0.5, mw: 1, ms: 1, mo: 0.3, bl: 1 }),
  focus: fc({ bt: 0.45, by: 0, mw: 0.7, ms: 0.15, bl: 0.5 }),
  pleading: fc({ bt: -0.85, by: 0.5, mw: 0.6, ms: -0.15, mo: 0.3, wob: 0.6, bl: 0.75, wet: 0.7 }),
  pout: fc({ bt: 0.7, by: -0.1, mw: 0.55, ms: -0.45, po: 1, bl: 0.9 }),
  sad: fc({ bt: -0.85, by: 0.25, mw: 0.7, ms: -0.6, wob: 0.8, wet: 1, bl: 0.5 }),
  sob: fc({ lid: 1, shut: 'sob', bt: -0.9, by: 0.3, mw: 1.1, ms: -0.4, mo: 0.8, bl: 0.8 }),
  shock: fc({ bt: -0.45, by: 1, mw: 0.5, ms: 0, ro: 1, sm: 0.85, bl: 0.5 }),
  hurt: fc({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.9, ms: -0.5, mo: 0.5, bl: 0.7 }),
  dizzy: fc({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.35, bl: 0.5 }),
  sheepish: fc({ bt: -0.5, by: 0.2, mw: 0.75, ms: 0.45, bl: 1 }),
  talk: fc({ bt: -0.1, by: 0.35, mw: 0.85, ms: 0.45, mo: 0.4, bl: 0.6 }),
  wink: fc({ lid: 0, by: 0.5, mw: 1, ms: 0.9, mo: 0.3, bl: 0.85, sp: 1, wk: 1 }),
};
for (const f of Object.values(FACES)) f.wk ??= 0;
export const SHUTS = ['happy', 'sob', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'wk', 'bt', 'by', 'mw', 'ms', 'mo', 'ro', 'wob', 'po', 'bl', 'sp', 'wet', 'sm'];
export const VOWELS = [[0.55, 0.2, 0.75], [1, 0.5, 0.55], [0.9, 0.6, 0.3], [0.7, 0.35, 0], [0.6, 0.3, 0.5]];

// (the eyes' place on her face: the same size, level)
const EYE = { y: 3.4, dx: 5.9, w: 3.6, h: 4.1 };

// ---------- One eye ----------
function eye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.crUid ?? 0) * 0.9) % 4.9, 4.3, 4.42, 4.5, 4.66) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  const inner = x - side * w;
  const outer = x + side * w;
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    const sh = f.wk > 0.5 && f.lid < 0.5 ? { happy: 1 } : f.shut;
    for (const s of SHUTS) {
      const sw = sh[s] ?? 0;
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      if (s === 'happy' || s === 'sob') {
        // happy: a soft arch with three little round flicks at its end; sob: arched the other way,
        // squeezed, a tear at its corner
        const up = s === 'happy' ? -1 : 1;
        pen(ctx, tone(a, LASH), 0.85);
        ctx.beginPath();
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          const p = [mix(inner, outer, u), y + 0.6 + up * Math.sin(Math.PI * u) * h * (s === 'happy' ? 0.5 : 0.3)];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
        ctx.stroke();
        if (s === 'happy') {
          pen(ctx, tone(a, LASH), 0.5);
          for (const k of [0, 1]) {
            ctx.beginPath();
            ctx.moveTo(outer - side * k * 0.6, y + 0.4 - k * 0.3);
            ctx.quadraticCurveTo(outer + side * (0.8 - k * 0.2), y - 0.2 - k * 0.5, outer + side * (0.9 - k * 0.3), y - 0.9 - k * 0.6);
            ctx.stroke();
          }
        } else tear(ctx, outer - side * 0.4, y + 2.2 + ((t * 1.4) % 1) * 2.4, 0.8, 0.9);
      } else if (s === 'squeeze') {
        pen(ctx, tone(a, LASH), 0.85);
        ctx.beginPath();
        ctx.moveTo(x + side * w, y - 2.4);
        ctx.quadraticCurveTo(x - side * w * 0.1, y - 0.3, x - side * w * 0.9, y + 0.3);
        ctx.quadraticCurveTo(x - side * w * 0.1, y + 0.8, x + side * w, y + 2.8);
        ctx.stroke();
      } else {
        pen(ctx, tone(a, LASH), 0.6);
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * w * 0.9;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // a soft coral wash over the lid
  glow(ctx, x + side * 0.4, y - h * 0.95, 4.2, '#ffb4c0', 0.32);
  // the white: a round, a little taller than wide
  const shape = () => ell(ctx, x, y, w, h);
  shape();
  ctx.fillStyle = tone(a, '#fffeff');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.36 * f.sm;
  const ix = x + side * 0.2 + (look?.[0] ?? 0) * 0.6;
  const iy = y + 0.35 + (look?.[1] ?? 0) * 0.5;
  const R = 3.0 * small;
  const g = ctx.createLinearGradient(0, iy - R * 1.1, 0, iy + R * 1.1);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.4, tone(a, IRIS[2]));
  g.addColorStop(0.75, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, R, R * 1.1);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#1a3a70', 0.85), 0.4);
  ctx.stroke();
  // a soft ring of light round the pupil, the pupil
  ell(ctx, ix, iy + 0.1, R * 0.62, R * 0.7);
  pen(ctx, tone(a, '#bff4ff', 0.45), 0.3);
  ctx.stroke();
  ell(ctx, ix, iy + 0.1, R * 0.4, R * 0.46);
  ctx.fillStyle = tone(a, PUPIL);
  ctx.fill();
  // the lid's soft shadow at the top of the white (never over the iris)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.55);
  sg.addColorStop(0, 'rgba(120,70,110,0.28)');
  sg.addColorStop(1, 'rgba(120,70,110,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.2, y - h * 1.1, w * 2.4, h * 0.6);
  // the glints: a big round pearl up at the back (a pink rim), a little one under it, a tiny one at the
  // front; delighted, the big one becomes a sparkle
  const sp = f.sp;
  const gx = ix - side * R * 0.38;
  const gy = iy - R * 0.42;
  if (sp < 0.98) {
    ctx.save();
    ctx.globalAlpha *= 1 - sp;
    ell(ctx, gx, gy, 1.15, 1.15);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    pen(ctx, 'rgba(255,190,210,0.7)', 0.25);
    ctx.stroke();
    ctx.restore();
  }
  if (sp > 0.02) {
    const s4 = 1.8 * sp;
    ctx.save();
    ctx.globalAlpha *= sp;
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
  ell(ctx, gx + side * 0.6, gy + 1.6, 0.45, 0.45);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  ell(ctx, ix + side * R * 0.5, iy + R * 0.55, 0.42, 0.42);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (f.wet > 0.05) {
    ell(ctx, ix, y + h * 0.66, w * 0.85, 0.9);
    ctx.fillStyle = `rgba(220,242,255,${0.75 * f.wet})`;
    ctx.fill();
  }
  ctx.restore();
  // the upper lash: a soft rounded line over the top of the eye, thicker toward the outer corner, ending
  // in three small rounded flicks
  const top = (u) => {
    const an = Math.PI + (side > 0 ? u : 1 - u) * Math.PI;
    return [x + Math.cos(an) * w * 1.02, y + Math.sin(an) * h * 1.02];
  };
  const N = 14;
  const up = [];
  const lo = [];
  for (let i = 0; i <= N; i++) {
    const u = 0.12 + (i / N) * 0.8;
    const [px, py] = top(u);
    const th = 0.25 + 0.75 * (i / N) ** 1.4;
    up.push([px, py - th * 0.6]);
    lo.push([px, py + th * 0.4]);
  }
  ctx.beginPath();
  ctx.moveTo(...lo[0]);
  for (const p of up) ctx.lineTo(...p);
  for (let i = N; i >= 0; i--) ctx.lineTo(...lo[i]);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  pen(ctx, tone(a, LASH), 0.5);
  for (const [u, len, lean] of [[0.74, 0.7, 0.5], [0.84, 0.85, 0.8], [0.93, 0.9, 1.1]]) {
    const [px, py] = top(u);
    const an = -Math.PI / 2 + side * lean;
    const ex = px + Math.cos(an) * len;
    const ey = py - 0.3 + Math.sin(an) * len;
    ctx.beginPath();
    ctx.moveTo(px, py - 0.3);
    ctx.quadraticCurveTo(px + side * 0.3, ey + 0.2, ex, ey);
    ctx.stroke();
    ell(ctx, ex, ey, 0.28, 0.28);
    ctx.fillStyle = tone(a, LASH);
    ctx.fill();
  }
  // the lower lash: a short soft line under the outer half
  pen(ctx, tone(a, LASH, 0.6), 0.32);
  ctx.beginPath();
  ctx.ellipse(x, y, w * 1.02, h * 1.02, 0, side > 0 ? 0.15 : Math.PI - 0.9, side > 0 ? 0.9 : Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();
}
// Brows: short, soft, rounded at both ends, set high.
function brow(ctx, a, x, y, side, f) {
  const yi = y - f.by * 0.9 + f.bt * 0.8;
  const yo = y - f.by * 0.9 - f.bt * 0.3;
  const xi = x - side * 1.6;
  const xo = x + side * 1.8;
  pen(ctx, tone(a, BROW), 0.9);
  ctx.beginPath();
  ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo(x, Math.min(yi, yo) - 0.6, xo, yo + 0.1);
  ctx.stroke();
}
// The mouth: small and rosy.
function mouth(ctx, a, x, y, f) {
  const w = 1.5 * f.mw * (1 - 0.35 * f.po);
  const cy = y - f.ms * 0.55;
  if (f.ro > 0.3) {
    ell(ctx, x, y + 0.4, 0.9 * f.ro + 0.2, 1.1 * f.ro + 0.2);
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    pen(ctx, tone(a, LIP.base), 0.4);
    ctx.stroke();
    return;
  }
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.5 - o * 0.4, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.9 + o * 2.4, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + f.ms * 0.7 + o * 2, w * 0.7, o * 0.9);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    return;
  }
  // closed: one soft line, its corners curling up (a wobble when she's about to cry)
  pen(ctx, tone(a, LIP.sh), 0.5);
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    const px = x - w + u * w * 2;
    const py = cy + Math.sin(Math.PI * u) * f.ms * 0.9 + Math.sin(u * Math.PI * 4) * f.wob * 0.35 - f.po * Math.sin(Math.PI * u) * 0.5;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  glow(ctx, x, y + 0.9, 1.3, LIP.base, 0.3);
  if (f.po > 0.3) {
    ell(ctx, x + 0.2, cy + 0.9, 0.9 * f.po, 0.42 * f.po);
    ctx.fillStyle = tone(a, LIP.base, 0.55);
    ctx.fill();
  }
}

// Her face: round soft cheeks, a small round chin.
export function skullPts(tx) {
  return chaikin([[0, -17.6], [11.8, -13.2], [16, -4], [15.6, 5], [12, 11], [5.4 + tx * 0.2, 15], [0.8 + tx * 0.35, 16.2], [-4.4 + tx * 0.2, 15], [-11.6, 11], [-15.6, 4.8], [-16.2, -4], [-12, -13.2]], 3);
}

// ---------- Her hair ----------
function hairFill(ctx, a, y0 = -22, y1 = 40) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(0.26, tone(a, HAIR.base));
  g.addColorStop(0.65, tone(a, HAIR.sh));
  g.addColorStop(1, tone(a, HAIR.deep));
  return g;
}
// The one pearly shine band they all share (clipped into each piece, so it lines up across them).
function shineBand(ctx, y = -9) {
  const g = ctx.createLinearGradient(0, y - 2.6, 0, y + 2.6);
  g.addColorStop(0, 'rgba(255,250,252,0)');
  g.addColorStop(0.5, 'rgba(255,240,246,0.5)');
  g.addColorStop(1, 'rgba(255,250,252,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-40, y - 2.6, 80, 5.2);
  pen(ctx, 'rgba(255,255,255,0.6)', 0.3);
  for (const [x, l] of [[-10.6, 2.2], [-3.4, 1.6], [3.4, 2.4], [10, 1.4]]) {
    const yy = y - 0.3 + 0.004 * x * x;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + l / 2, yy - 0.4, x + l, yy + 0.1);
    ctx.stroke();
  }
}
function hairShape(ctx, a, mode, pts, shade, lw, y0, y1) {
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, tone(a, HAIR.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = hairFill(ctx, a, y0, y1);
  ctx.fill();
  if (shade) {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    shade();
    ctx.restore();
  }
}
// The fringe's cut: one even rounded U across her forehead, lowest in the middle just above her
// lashes, rising to her temples.
const CUT = { y: -2.9, rise: 3.4, half: 14.6 };
const cutY = (x, cx) => CUT.y + CUT.rise * Math.min(1, ((x - cx) / CUT.half) ** 2);
// Its four sections (the middle two the widest).
const SPLITS = [[0.21, 2.8, 1.0], [0.5, 3.8, 1.2], [0.79, 2.8, 1.0]];
function fringeGeom(tx, sw) {
  const cx = 0.6 + tx * 0.6;
  const x0 = cx - CUT.half - 0.8;
  const x1 = cx + CUT.half + 0.8;
  const W = x1 - x0;
  const topY = (x) => -16.4 + 0.02 * (x - cx) ** 2;
  const xs = [x0, ...SPLITS.map(([u]) => x0 + W * u), x1];
  const secs = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const L = xs[i];
    const R = xs[i + 1];
    const sl = i > 0 ? SPLITS[i - 1] : null;
    const sr = i < SPLITS.length ? SPLITS[i] : null;
    const dx = (sw?.[i % 3] ?? 0) * 3 * (i % 2 ? -1 : 1);
    const lb = sl ? L + sl[2] / 2 : L + 0.4;
    const rb = sr ? R - sr[2] / 2 : R - 0.4;
    const pts = [[L, topY(L)], [R, topY(R)]];
    if (sr) pts.push([R, cutY(R, cx) - sr[1]]);
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const x = rb + (lb - rb) * (k / n);
      // (each section's end rounded softly, the cut even across them)
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
    return [x, cutY(x, G.cx) - 0.2];
  })], 2);
  poly(ctx, inner);
  if (mode === 'line') {
    pen(ctx, tone(a, HAIR.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, HAIR.deep);
    ctx.fill();
  }
  for (const s of G.secs) {
    hairShape(ctx, a, mode, s.pts, () => {
      const cy = cutY(s.mid, G.cx);
      const g = ctx.createLinearGradient(0, cy - 4, 0, cy + 0.6);
      g.addColorStop(0, 'rgba(50,140,140,0)');
      g.addColorStop(1, 'rgba(50,140,140,0.45)');
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -22, s.R - s.L + 4, 26);
      for (const [ex, k] of [[s.L, 1], [s.R, -1]]) {
        const sg = ctx.createLinearGradient(0, -12, 0, cutY(ex, G.cx));
        sg.addColorStop(0, 'rgba(50,140,140,0)');
        sg.addColorStop(1, 'rgba(50,140,140,0.4)');
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ex + k * 0.3, -12);
        ctx.quadraticCurveTo(ex + k * 0.5, (cutY(ex, G.cx) - 12) / 2, ex + k * 0.4, cutY(ex, G.cx));
        ctx.stroke();
      }
      shineBand(ctx);
    }, lw);
  }
}
function capPts(tx) {
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const an = Math.PI * (0.98 + (i / 18) * 1.04);
    const off = 1.5 + Math.max(0, -Math.sin(an)) * 1.4;
    pts.push([Math.cos(an) * (16.6 + off), Math.sin(an) * (17.6 + off) + 0.4]);
  }
  return chaikin([[-17.6, 4], ...pts, [17.8, 1], [12, -5], [tx, -8], [-9, -6], [-15.8, -1]], 2);
}
// A long side lock: from under the fringe outside her eye, down past her jaw to her chest with one soft
// wave in it, its end round with a pearl bead.
export const LOCK_END = 27;
function sideLock(ctx, a, mode, side, tx, sway, lw) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 12.4 : -11.4;
  const outX = side > 0 ? 17.6 : -18;
  const sx = (v) => v + shift;
  const s = sway * 3;
  const E = LOCK_END;
  const wv = side * 1.2;
  const pts = chaikin([
    [sx(outX - side * 0.6), -9.5], [sx(inX - side * 1.4), -9.2], [sx(inX), -2], [sx(inX + side * 0.4) + wv + s * 0.3, 7],
    [sx(inX + side * 0.2) + s * 0.6, 15], [sx(inX + side * 0.8) + wv + s * 0.9, 22], [sx(inX + side * 1.6) + s, E], [sx((inX + outX) / 2 + side * 0.6) + s, E + 1.6],
    [sx(outX - side * 0.2) + s, E - 0.4], [sx(outX + side * 0.4) + wv + s * 0.8, 21], [sx(outX + side * 0.2) + s * 0.6, 14], [sx(outX + side * 0.6) + wv + s * 0.3, 6], [sx(outX + side * 0.2), -3],
  ], 3);
  hairShape(ctx, a, mode, pts, () => {
    const g = ctx.createLinearGradient(0, -10, 0, -4);
    g.addColorStop(0, 'rgba(40,120,120,0.5)');
    g.addColorStop(1, 'rgba(40,120,120,0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(sx(outX), sx(inX)) - 4, -11, 14, 7);
    glow(ctx, sx(inX + side * 0.6), 8, 3.2, HAIR.deep, 0.35);
    // the soft wave: a band of shade across it, lit above
    pen(ctx, 'rgba(40,130,130,0.3)', 0.7);
    ctx.beginPath();
    ctx.moveTo(sx(inX) + wv, 12);
    ctx.quadraticCurveTo(sx((inX + outX) / 2) + s * 0.7, 10.6, sx(outX) + wv, 12.4);
    ctx.stroke();
    shineBand(ctx);
  }, lw, -22, E + 4);
  // the pearl bead at its end
  const bx = sx((inX + outX) / 2 + side * 0.4) + s;
  ell(ctx, bx, E - 1, 1.3, 1.3);
  if (mode === 'line') {
    pen(ctx, tone(a, PEARL.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, PEARL.base);
    ctx.fill();
    ell(ctx, bx - 0.4, E - 1.4, 0.45, 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
}
// The long hair behind her: down her back in big soft waves (three each side), wider as it falls, its
// end a soft round of three scallops. len: how long, in her head's units.
export function backHair(ctx, a, mode, tx, sw, len, lw) {
  const s = sw ?? 0;
  const L = len;
  const pts = [[-17.2, -6], [-12, -18.4], [0, -21], [12, -18], [17.6, -6]];
  // (down the near side, waving out and in)
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    pts.push([19 + u * 4 + Math.sin(u * Math.PI * 3) * 1.8 + s * 6 * u, -6 + u * (L + 6)]);
  }
  for (const [x, dy] of [[14, 2.6], [6, 1], [-2, 3], [-10, 1.2], [-17, 2.8]]) pts.push([x + s * 6.4, L + dy]);
  for (let i = 6; i >= 1; i--) {
    const u = i / 6;
    pts.push([-19.4 - u * 4 - Math.sin(u * Math.PI * 3) * 1.8 + s * 5 * u, -6 + u * (L + 6)]);
  }
  hairShape(ctx, a, mode, chaikin(pts, 3), () => {
    glow(ctx, s * 3, L * 0.5, L * 0.45, HAIR.deep, 0.45);
    // the waves: soft bands of shade
    pen(ctx, 'rgba(40,130,130,0.28)', 1.1);
    for (let i = 1; i <= 2; i++) {
      const y = -6 + (i / 3) * (L + 6);
      ctx.beginPath();
      ctx.moveTo(-22, y);
      ctx.quadraticCurveTo(s * 4, y + 3, 24 + s * 5, y);
      ctx.stroke();
    }
    shineBand(ctx);
  }, lw, -22, L + 4);
}

// ---------- Her crown ----------
// Branching coral on a gold band: each branch a soft tapering tube with round tips, a pearl at the front
// of the band and on the tallest tips.
const BRANCHES = [
  { x: 0, h: 9.4, lean: 0, kids: [[0.55, -0.7, 3.2], [0.6, 0.7, 3.4]] },
  { x: -5.4, h: 6.6, lean: -0.32, kids: [[0.6, -0.6, 2.4]] },
  { x: 5.4, h: 6.8, lean: 0.32, kids: [[0.6, 0.6, 2.4]] },
  { x: -9.6, h: 4.4, lean: -0.6, kids: [] },
  { x: 9.6, h: 4.6, lean: 0.6, kids: [] },
];
function crown(ctx, a, mode, tx, bob, lw) {
  ctx.save();
  ctx.translate(0.6 + tx * 0.45, -16.4);
  ctx.rotate(-0.06 + bob * 0.5);
  const tube = (x0, y0, x1, y1, w0, w1) => {
    const an = Math.atan2(y1 - y0, x1 - x0);
    const nx = -Math.sin(an);
    const ny = Math.cos(an);
    ctx.moveTo(x0 + nx * w0, y0 + ny * w0);
    ctx.lineTo(x1 + nx * w1, y1 + ny * w1);
    ctx.arc(x1, y1, w1, an + Math.PI / 2, an - Math.PI / 2, true);
    ctx.lineTo(x0 - nx * w0, y0 - ny * w0);
    ctx.closePath();
  };
  ctx.beginPath();
  const tips = [];
  for (const B of BRANCHES) {
    const ex = B.x + Math.sin(B.lean) * B.h;
    const ey = -Math.cos(B.lean) * B.h;
    tube(B.x, 0.5, ex, ey, 1.5, 0.95);
    tips.push([ex, ey, B.h > 8]);
    for (const [u, dl, l] of B.kids) {
      const kx = B.x + (ex - B.x) * u;
      const ky = ey * u;
      const ang = B.lean + dl;
      tube(kx, ky, kx + Math.sin(ang) * l, ky - Math.cos(ang) * l, 0.9, 0.75);
    }
  }
  if (mode === 'line') {
    pen(ctx, tone(a, CORAL.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, CORAL.base);
    ctx.fill('nonzero');
    ctx.save();
    ctx.clip('nonzero');
    glow(ctx, -3, -6, 7, CORAL.lt, 0.7);
    ctx.restore();
  }
  // the gold band
  ctx.beginPath();
  ctx.moveTo(-11.4, 0.2);
  ctx.quadraticCurveTo(0, -1.6, 11.4, 0.2);
  ctx.lineTo(11.2, 2.6);
  ctx.quadraticCurveTo(0, 0.9, -11.2, 2.6);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, tone(a, GOLD.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
    pen(ctx, tone(a, GOLD.lt, 0.9), 0.4);
    ctx.beginPath();
    ctx.moveTo(-10.6, 0.8);
    ctx.quadraticCurveTo(0, -0.8, 10.6, 0.8);
    ctx.stroke();
  }
  // the pearls: one big at the front of the band, little ones on the tallest tips
  const pearl = (x, y, r) => {
    ell(ctx, x, y, r, r);
    if (mode === 'line') {
      pen(ctx, tone(a, PEARL.ink), lw);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, PEARL.base);
      ctx.fill();
      ell(ctx, x - r * 0.35, y - r * 0.35, r * 0.32, r * 0.24);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  };
  pearl(0, 1.2, 1.7);
  for (const [x, y, big] of tips) if (big) pearl(x, y, 1.1);
  ctx.restore();
}

// ---------- The whole head ----------
export function drawHead(ctx, a, mode, part, q, f, R, lw) {
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  if (part === 'back') {
    backHair(ctx, a, mode, tx, R.back ?? 0, 56, lw);
    return;
  }
  poly(ctx, skullPts(tx));
  if (mode === 'line') {
    pen(ctx, tone(a, SKIN_INK), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, SKIN[1]);
    ctx.fill();
  }
  if (mode === 'fill' && f) {
    ctx.save();
    poly(ctx, skullPts(tx));
    ctx.clip();
    glow(ctx, tx - 1, 2, 15, SKIN[0], 0.9);
    glow(ctx, -12.4, 4, 6, SKIN[2], 0.5);
    glow(ctx, 13.2 + tx * 0.7, 4, 5, SKIN[2], 0.4);
    glow(ctx, tx * 0.5, 15, 8, SKIN[2], 0.3);
    const G = fringeGeom(tx, R.fr);
    ctx.beginPath();
    ctx.moveTo(G.x0, -22);
    ctx.lineTo(G.x1, -22);
    for (let k = 0; k <= 20; k++) {
      const x = G.x1 - (G.x1 - G.x0) * (k / 20);
      ctx.lineTo(x, cutY(x, G.cx) + 0.85);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, SKIN[2], 0.7);
    ctx.fill();
    ctx.restore();
    // the blush: a round rosy flush and three tiny strokes
    for (const s of [-1, 1]) {
      const bx = tx + s * 8.4;
      glow(ctx, bx, 8.4, 3.6, BLUSH[0], 0.32 + 0.3 * f.bl);
      glow(ctx, bx, 8.4, 2, BLUSH[1], 0.2 + 0.35 * f.bl);
      pen(ctx, tone(a, '#ff8aa4', 0.3 + 0.4 * f.bl), 0.3);
      for (const dx of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.moveTo(bx + dx - 0.3, 9.1);
        ctx.lineTo(bx + dx + 0.3, 8.1);
        ctx.stroke();
      }
    }
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look, s < 0 ? Math.max(f.lid, f.wk) : f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.2, -2.2, s, f);
    glow(ctx, tx + 1.6, 7.6, 1.2, SKIN[3], 0.5);
    ell(ctx, tx + 1.2, 7.3, 0.32, 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 1, 11.2, f);
    if (q.sweat) sweat(ctx, tx - 12.8, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (f.wet > 0.6 && q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 7.4 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  hairShape(ctx, a, mode, capPts(tx), () => {
    glow(ctx, -15, 2, 7, HAIR.deep, 0.45);
    shineBand(ctx);
  }, lw);
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0, lw);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0, lw);
  fringe(ctx, a, mode, tx, R.fr, lw);
  crown(ctx, a, mode, tx, R.crown ?? 0, lw);
}
export { EYE };
