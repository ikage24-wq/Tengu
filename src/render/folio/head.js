// Folio, the Archivist's head (2026-11-27, drawn from scratch: never the shared face, never the hero's head
// or hair): her face and its moods, her snowy hair, her reading glasses. In head units about her face's
// middle (x toward the way she faces, y down; the skull about 16 across each way), each piece drawn in
// both of the rig's passes (mode 'line': its outline, 'fill': itself), so only her outer edge is
// outlined; her face bare.
//   eyes   her own family, owl gold: big round irises that almost fill the eye (gold, lit from below,
//          a soft plum ring round each one, fine lighter lines round the pupil like an owl's), a big
//          round pupil, and her signature glint: a little arched library window up at the back, a
//          small round light at the front. The upper lash a neat line, thin at the inner corner,
//          thickening to one soft rounded wing with a single short flick over it. The whole iris clear
//          whenever she's awake; only blinks and closed moods cover it.
//   brows  round brows: short, full, even, round at both ends, set just under the fringe.
//   mouth  small and prim: a neat line a little fuller in the middle, its near corner lifting (a
//          librarian's knowing little smile); a pursed "shh", a round "o", an open laugh.
//   mark   a tiny smudge of starlight ink on her near cheek.
//   hair   snowy white: an even blunt fringe of five sections (the middle one widest) stopping just
//          above her lashes, the cut a gentle U; a straight side lock each side outside her eyes, cut
//          blunt at her chin; the rest wound up in a big soft bun low at the back of her head, a quill
//          pushed through it, and one long soft tail of hair from under the bun down her back behind
//          her shoulders. One light from above, one pearly shine band across it all.
//   glasses  round brass reading glasses pushed up and resting on top of her hair (never over her eyes).
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear } from './fx.js';
import { SKIN, SKIN_INK, HAIR, GOLD, FEATHER, INK, LASH, BROW, IRIS, RING, PUPIL, LIP, BLUSH } from './palette.js';

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

// ---------- Her moods (every part eased toward them) ----------
// lid (0 open .. 1 shut: closed moods only), shut (which closed shape), bt (brow tilt: + knit, -
// worried), by (raise), mw/ms/mo (the mouth's width, smile, open), ro (a round "o"), pu (pursed: "shh"),
// sk (her near corner lifting), wob (a wobbly line), bl (blush), sp (sparkles in her eyes), wet (tears
// brimming), sm (small irises).
const F0 = { lid: 0, shut: 'happy', bt: 0, by: 0.2, mw: 0.75, ms: 0.25, mo: 0, ro: 0, pu: 0, sk: 0.55, wob: 0, bl: 0.45, sp: 0, wet: 0, sm: 0 };
const fc = (o) => ({ ...F0, ...o });
export const FACES = {
  prim: fc({}),
  still: fc({ by: 0.25, ms: 0.3, sk: 0.4 }),
  read: fc({ bt: -0.1, by: 0.1, ms: 0.35, sk: 0.7, bl: 0.5 }),
  stern: fc({ bt: 0.7, by: -0.1, mw: 0.6, ms: -0.1, sk: 0, bl: 0.35 }),
  shush: fc({ bt: 0.55, by: 0.05, mw: 0.5, pu: 1, sk: 0, bl: 0.45 }),
  smug: fc({ bt: 0.15, by: 0.35, mw: 0.8, ms: 0.5, sk: 1, bl: 0.55 }),
  delighted: fc({ bt: -0.3, by: 0.7, mw: 1, ms: 1, mo: 0.5, sk: 0.2, bl: 0.85, sp: 1 }),
  bliss: fc({ lid: 1, shut: 'calm', bt: -0.25, by: 0.4, mw: 0.85, ms: 0.8, sk: 0.4, bl: 0.75 }),
  proud: fc({ lid: 1, shut: 'happy', bt: 0.1, by: 0.45, mw: 0.8, ms: 0.55, sk: 0.9, bl: 0.6 }),
  focus: fc({ bt: 0.45, by: 0, mw: 0.65, ms: 0.1, sk: 0.25, bl: 0.4 }),
  shock: fc({ bt: -0.45, by: 1, mw: 0.5, ms: 0, ro: 1, sk: 0, sm: 0.8, bl: 0.5 }),
  flustered: fc({ bt: -0.6, by: 0.55, mw: 0.7, ms: -0.1, mo: 0.25, wob: 0.7, sk: 0, bl: 1.15 }),
  sad: fc({ bt: -0.85, by: 0.25, mw: 0.65, ms: -0.5, wob: 0.7, sk: 0, wet: 1, bl: 0.5 }),
  hurt: fc({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.85, ms: -0.5, mo: 0.5, sk: 0, bl: 0.7 }),
  dizzy: fc({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.35, sk: 0, bl: 0.5 }),
  talk: fc({ bt: 0.05, by: 0.3, mw: 0.8, ms: 0.35, mo: 0.4, sk: 0.4, bl: 0.5 }),
  wink: fc({ by: 0.45, mw: 0.9, ms: 0.75, mo: 0.2, sk: 0.8, bl: 0.75, sp: 1, wk: 1 }),
};
for (const f of Object.values(FACES)) f.wk ??= 0;
export const SHUTS = ['happy', 'calm', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'wk', 'bt', 'by', 'mw', 'ms', 'mo', 'ro', 'pu', 'sk', 'wob', 'bl', 'sp', 'wet', 'sm'];
export const VOWELS = [[0.55, 0.2, 0.7], [0.95, 0.45, 0.5], [0.85, 0.5, 0.25], [0.65, 0.3, 0], [0.55, 0.25, 0.45]];

// (the eyes' place on her face: the same size, level)
export const EYE = { y: 3.7, dx: 6.0, w: 3.7, h: 4.0 };

// ---------- One eye ----------
function eye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.foUid ?? 0) * 1.3) % 5.3, 4.7, 4.82, 4.9, 5.06) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  const inner = x - side * w;
  const outer = x + side * w;
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    const sh = f.wk > 0.5 && f.lid < 0.5 ? { calm: 1 } : blink > shutK ? { calm: 1 } : f.shut;
    for (const s of SHUTS) {
      const sw = sh[s] ?? 0;
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      ctx.lineCap = 'round';
      if (s === 'happy' || s === 'calm') {
        // happy: a soft arch; calm (a blink, a contented shut): a gentle curve down; both end in her
        // soft rounded wing
        const up = s === 'happy' ? -1 : 1;
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          pts.push([mix(inner, outer, u), y + (s === 'happy' ? 0.8 : 0.2) + up * Math.sin(Math.PI * u) * h * (s === 'happy' ? 0.45 : 0.3)]);
        }
        pen(ctx, tone(a, LASH), 0.8);
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
        ctx.stroke();
        const e = pts[12];
        pen(ctx, tone(a, LASH), 0.6);
        ctx.beginPath();
        ctx.moveTo(e[0] - side * 0.6, e[1] - 0.1);
        ctx.quadraticCurveTo(e[0] + side * 0.7, e[1] - 0.2, e[0] + side * 1.1, e[1] - 0.9);
        ctx.stroke();
        ell(ctx, e[0] + side * 1.1, e[1] - 0.9, 0.3, 0.3);
        ctx.fillStyle = tone(a, LASH);
        ctx.fill();
      } else if (s === 'squeeze') {
        pen(ctx, tone(a, LASH), 0.85);
        ctx.beginPath();
        ctx.moveTo(x + side * w, y - 2.2);
        ctx.quadraticCurveTo(x - side * w * 0.1, y - 0.2, x - side * w * 0.9, y + 0.4);
        ctx.quadraticCurveTo(x - side * w * 0.1, y + 0.9, x + side * w, y + 2.8);
        ctx.stroke();
      } else {
        pen(ctx, tone(a, LASH), 0.6);
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 - t * 4 * side;
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
  // a soft lilac wash over the lid
  glow(ctx, x + side * 0.5, y - h * 0.95, 4.2, '#c8b8f0', 0.34);
  // the white: round
  const shape = () => ell(ctx, x, y, w, h);
  shape();
  ctx.fillStyle = tone(a, '#fffeff');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.34 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.5;
  const iy = y + 0.3 + (look?.[1] ?? 0) * 0.45;
  const R = 3.2 * small;
  // the iris: owl gold, lit from below
  const g = ctx.createLinearGradient(0, iy - R, 0, iy + R);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.42, tone(a, IRIS[2]));
  g.addColorStop(0.78, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, R, R * 1.05);
  ctx.fillStyle = g;
  ctx.fill();
  // fine lighter lines round the pupil, like an owl's
  pen(ctx, tone(a, '#fff0b0', 0.5), 0.22);
  for (let i = 0; i < 10; i++) {
    const an = (i / 10) * TAU + 0.2;
    ctx.beginPath();
    ctx.moveTo(ix + Math.cos(an) * R * 0.55, iy + Math.sin(an) * R * 0.58);
    ctx.lineTo(ix + Math.cos(an) * R * 0.82, iy + Math.sin(an) * R * 0.86);
    ctx.stroke();
  }
  // the soft plum ring round it
  ell(ctx, ix, iy, R, R * 1.05);
  pen(ctx, tone(a, RING, 0.9), 0.55);
  ctx.stroke();
  // the pupil: big and round
  ell(ctx, ix, iy + 0.1, R * 0.47, R * 0.5);
  ctx.fillStyle = tone(a, PUPIL);
  ctx.fill();
  // the lid's soft shadow at the top of the white (never over the iris's middle)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.5);
  sg.addColorStop(0, 'rgba(110,80,140,0.3)');
  sg.addColorStop(1, 'rgba(110,80,140,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.2, y - h * 1.1, w * 2.4, h * 0.65);
  // her glints: a little arched library window up at the back (a sparkle when she's delighted), a
  // small round light at the front
  const sp = f.sp;
  const gx = ix - side * R * 0.36;
  const gy = iy - R * 0.36;
  if (sp < 0.98) {
    ctx.save();
    ctx.globalAlpha *= 1 - sp;
    const ww = 0.82;
    const wh = 1.05;
    ctx.beginPath();
    ctx.moveTo(gx - ww, gy + wh);
    ctx.lineTo(gx - ww, gy - wh * 0.2);
    ctx.arc(gx, gy - wh * 0.2, ww, Math.PI, 0);
    ctx.lineTo(gx + ww, gy + wh);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    // (its glazing bars, a cross in the iris's own gold)
    pen(ctx, tone(a, IRIS[2], 0.75), 0.18);
    ctx.beginPath();
    ctx.moveTo(gx, gy - wh * 0.9);
    ctx.lineTo(gx, gy + wh);
    ctx.moveTo(gx - ww, gy + wh * 0.25);
    ctx.lineTo(gx + ww, gy + wh * 0.25);
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
  ell(ctx, ix + side * R * 0.48, iy + R * 0.5, 0.45, 0.45);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  if (f.wet > 0.05) {
    ell(ctx, ix, y + h * 0.66, w * 0.85, 0.9);
    ctx.fillStyle = `rgba(220,236,255,${0.75 * f.wet})`;
    ctx.fill();
  }
  ctx.restore();
  // the upper lash: one closed outline, thin at the inner corner, thickening to a soft rounded wing
  const top = (u) => {
    const an = Math.PI + (side > 0 ? u : 1 - u) * Math.PI;
    return [x + Math.cos(an) * w * 1.03, y + Math.sin(an) * h * 1.03];
  };
  const N = 14;
  const up = [];
  const lo = [];
  for (let i = 0; i <= N; i++) {
    const u = 0.1 + (i / N) * 0.84;
    const [px, py] = top(u);
    const th = 0.2 + 0.85 * (i / N) ** 1.6;
    up.push([px, py - th * 0.62]);
    lo.push([px, py + th * 0.38]);
  }
  // (the wing: out past the outer corner, lifting a little, its end round)
  const [ox, oy] = top(0.94);
  const wing = [[ox + side * 1.0, oy - 0.35], [ox + side * 1.55, oy - 0.85]];
  ctx.beginPath();
  ctx.moveTo(...lo[0]);
  for (const p of up) ctx.lineTo(...p);
  ctx.quadraticCurveTo(ox + side * 0.9, oy - 1.1, wing[1][0], wing[1][1] - 0.2);
  ctx.quadraticCurveTo(wing[1][0] + side * 0.35, wing[1][1] + 0.15, wing[0][0], wing[0][1] + 0.35);
  for (let i = N; i >= 0; i--) ctx.lineTo(...lo[i]);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  // one short flick over the wing, grown from the line
  const [fx, fy] = top(0.8);
  pen(ctx, tone(a, LASH), 0.42);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx, fy - 0.4);
  ctx.quadraticCurveTo(fx + side * 0.45, fy - 1.05, fx + side * 1.05, fy - 1.25);
  ctx.stroke();
  // a soft sheen along the lash
  pen(ctx, 'rgba(200,180,240,0.35)', 0.18);
  ctx.beginPath();
  for (let i = 3; i <= N - 2; i++) (i === 3 ? ctx.moveTo : ctx.lineTo).call(ctx, up[i][0], up[i][1] + 0.22);
  ctx.stroke();
  ctx.restore();
}
// Brows: round brows, short, full, even, round at both ends.
function brow(ctx, a, x, y, side, f) {
  const yi = y - f.by * 0.5 + f.bt * 0.6;
  const yo = y - f.by * 0.5 - f.bt * 0.2;
  const xi = x - side * 1.4;
  const xo = x + side * 1.5;
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROW), 0.95);
  ctx.beginPath();
  ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo(x, Math.min(yi, yo) - 0.45, xo, yo + 0.1);
  ctx.stroke();
  ctx.restore();
}
// The mouth: small and prim.
function mouth(ctx, a, x, y, f) {
  const w = 1.4 * f.mw * (1 - 0.45 * f.pu);
  const cy = y - f.ms * 0.5;
  if (f.ro > 0.3 || f.pu > 0.5) {
    const k = Math.max(f.ro, f.pu * 0.6);
    ell(ctx, x, y + 0.4, 0.7 * k + 0.25, (f.pu > 0.5 ? 0.6 : 1.05) * k + 0.25);
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
    ctx.quadraticCurveTo(x, y + f.ms * 0.5 - o * 0.4, x + w, cy - f.sk * 0.3);
    ctx.quadraticCurveTo(x, y + f.ms * 0.9 + o * 2.3, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + f.ms * 0.7 + o * 1.9, w * 0.7, o * 0.85);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    return;
  }
  // closed: one line, a little fuller in the middle, her near corner lifting (a wobble when upset)
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LIP.sh), 0.48);
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const px = x - w + u * w * 2;
    const py = cy + Math.sin(Math.PI * u) * f.ms * 0.8 - u * u * f.sk * 0.55 + Math.sin(u * Math.PI * 4) * f.wob * 0.32;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x + 0.1, y + 0.9, 1.2, LIP.base, 0.32);
}

// Her face: soft cheeks, a small round chin.
export function skullPts(tx) {
  return chaikin([[0, -17.8], [11.6, -13.6], [15.6, -4.4], [15.2, 4.6], [11.6, 10.8], [5.2 + tx * 0.2, 15.2], [0.8 + tx * 0.35, 16.6], [-4.2 + tx * 0.2, 15.2], [-11.4, 10.8], [-15.4, 4.6], [-15.9, -4.4], [-11.8, -13.6]], 3);
}

// ---------- Her hair ----------
function hairFill(ctx, a, y0 = -22, y1 = 40) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(0.3, tone(a, HAIR.base));
  g.addColorStop(0.7, tone(a, HAIR.sh));
  g.addColorStop(1, tone(a, HAIR.deep));
  return g;
}
// The one shine band they all share (clipped into each piece, so it lines up across them).
function shineBand(ctx, y = -9.6) {
  const g = ctx.createLinearGradient(0, y - 2.4, 0, y + 2.4);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(236,232,255,0.65)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-60, y - 2.4, 120, 4.8);
  pen(ctx, 'rgba(255,255,255,0.85)', 0.3);
  for (const [x, l] of [[-11, 2], [-4.4, 1.4], [2.6, 2.4], [9.6, 1.6]]) {
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
const SHADE = (al) => `rgba(120,110,180,${al})`;
// The fringe's cut: one even gentle U across her forehead, lowest in the middle just above her lashes.
const CUT = { y: -3.5, rise: 2.4, half: 14.2 };
const cutY = (x, cx) => CUT.y + CUT.rise * Math.min(1, ((x - cx) / CUT.half) ** 2);
// Its five sections (the middle one widest), each split [where, how deep, how wide the gap].
const SPLITS = [[0.17, 2.4, 0.9], [0.37, 3.2, 1.1], [0.63, 3.4, 1.1], [0.84, 2.5, 0.9]];
function fringeGeom(tx, sw) {
  const cx = 0.6 + tx * 0.6;
  const x0 = cx - CUT.half - 0.9;
  const x1 = cx + CUT.half + 0.9;
  const W = x1 - x0;
  const topY = (x) => -16.6 + 0.02 * (x - cx) ** 2;
  const xs = [x0, ...SPLITS.map(([u]) => x0 + W * u), x1];
  const secs = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const L = xs[i];
    const R = xs[i + 1];
    const sl = i > 0 ? SPLITS[i - 1] : null;
    const sr = i < SPLITS.length ? SPLITS[i] : null;
    const dx = (sw?.[i % 3] ?? 0) * 2.6 * (i % 2 ? -1 : 1);
    const lb = sl ? L + sl[2] / 2 : L + 0.4;
    const rb = sr ? R - sr[2] / 2 : R - 0.4;
    const pts = [[L, topY(L)], [R, topY(R)]];
    if (sr) pts.push([R, cutY(R, cx) - sr[1]]);
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const x = rb + (lb - rb) * (k / n);
      // (each section's end trimmed flat with soft corners, the cut even across them)
      pts.push([x + dx * (1 - Math.abs(k / n - 0.5) * 2) * 0.3 + dx * 0.4, cutY(x, cx) + 0.4 * Math.sin(Math.PI * (k / n))]);
    }
    if (sl) pts.push([L, cutY(L, cx) - sl[1]]);
    secs.push({ pts: chaikin(pts, 2), L, R, mid: (L + R) / 2 });
  }
  return { cx, x0, x1, secs, topY };
}
function fringe(ctx, a, mode, tx, sw, lw) {
  const G = fringeGeom(tx, sw);
  // (the deeper layer seen up inside the splits)
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
      g.addColorStop(0, SHADE(0));
      g.addColorStop(1, SHADE(0.4));
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -22, s.R - s.L + 4, 26);
      // (thin soft shadows down each side at the splits, fading toward the crown)
      for (const [ex, k] of [[s.L, 1], [s.R, -1]]) {
        const sg = ctx.createLinearGradient(0, -12, 0, cutY(ex, G.cx));
        sg.addColorStop(0, SHADE(0));
        sg.addColorStop(1, SHADE(0.38));
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
    const off = 1.5 + Math.max(0, -Math.sin(an)) * 1.3;
    pts.push([Math.cos(an) * (16.4 + off), Math.sin(an) * (17.8 + off) + 0.4]);
  }
  return chaikin([[-17.4, 4], ...pts, [17.6, 1], [12, -5], [tx, -8], [-9, -6], [-15.6, -1]], 2);
}
// A straight side lock: from under the fringe outside her eye down to her chin, cut blunt there with
// soft corners, its end swaying a little.
function sideLock(ctx, a, mode, side, tx, sway, lw) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 11.4 : -10.8;
  const outX = side > 0 ? 17.0 : -17.2;
  const sx = (v) => v + shift;
  const s = sway * 2.4;
  const E = 14.2;
  const pts = chaikin([
    [sx(outX - side * 0.4), -9.6], [sx(inX - side * 1.3), -9.2], [sx(inX), -2], [sx(inX + side * 0.2) + s * 0.4, 6],
    [sx(inX + side * 0.5) + s * 0.8, E - 1.2], [sx(inX + side * 0.9) + s, E], [sx((inX + outX) / 2) + s, E + 0.5],
    [sx(outX - side * 0.6) + s, E - 0.2], [sx(outX) + s * 0.9, E - 1.6], [sx(outX + side * 0.4) + s * 0.5, 5], [sx(outX + side * 0.2), -3],
  ], 3);
  hairShape(ctx, a, mode, pts, () => {
    const g = ctx.createLinearGradient(0, -10, 0, -4);
    g.addColorStop(0, SHADE(0.45));
    g.addColorStop(1, SHADE(0));
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(sx(outX), sx(inX)) - 4, -11, 14, 7);
    glow(ctx, sx(inX + side * 0.8), 9, 3, HAIR.deep, 0.35);
    // (one soft split near its end)
    pen(ctx, SHADE(0.3), 0.5);
    ctx.beginPath();
    ctx.moveTo(sx((inX + outX) / 2 + side * 0.4), 4);
    ctx.quadraticCurveTo(sx((inX + outX) / 2 + side * 0.6) + s * 0.7, 9, sx((inX + outX) / 2 + side * 0.5) + s, E - 0.4);
    ctx.stroke();
    shineBand(ctx);
  }, lw, -22, E + 4);
}
// Behind her head: one long soft tail of hair from under the bun down her back (behind her shoulders),
// its end one smooth round; then the bun, wound round and round, the quill through it.
function backHair(ctx, a, mode, tx, sw, lw) {
  const s = sw ?? 0;
  const L = 40;
  const bx = -10.4 + tx * 0.1;
  const by = -7;
  const pts = [[bx - 6.4, by - 2], [bx + 2.6, by - 3]];
  for (let i = 1; i <= 6; i++) {
    const u = i / 6;
    pts.push([bx + 3.6 - u * 1.2 + Math.sin(u * Math.PI) * 1.4 + s * 7 * u * u, by + u * L]);
  }
  pts.push([bx - 0.2 + s * 7.4, by + L + 3.2]);
  for (let i = 6; i >= 1; i--) {
    const u = i / 6;
    pts.push([bx - 6.6 - u * 1.4 + Math.sin(u * Math.PI) * 0.6 + s * 6.6 * u * u, by + u * L]);
  }
  hairShape(ctx, a, mode, chaikin(pts, 3), () => {
    glow(ctx, bx - 2 + s * 3, by + L * 0.55, L * 0.35, HAIR.deep, 0.5);
    pen(ctx, SHADE(0.25), 0.7);
    ctx.beginPath();
    ctx.moveTo(bx - 1.2, by + 2);
    ctx.quadraticCurveTo(bx - 1.6 + s * 2, by + L * 0.5, bx - 1 + s * 6.4, by + L);
    ctx.stroke();
    shineBand(ctx, by + 9);
  }, lw, -22, by + L + 4);
  // the bun: big, soft, wound
  const cx = bx - 1.4;
  const cy = -13.4;
  const bun = chaikin(Array.from({ length: 12 }, (_, i) => {
    const an = (i / 12) * TAU;
    return [cx + Math.cos(an) * 7.4, cy + Math.sin(an) * 6.8];
  }), 2);
  hairShape(ctx, a, mode, bun, () => {
    glow(ctx, cx - 2.6, cy + 3, 6, HAIR.deep, 0.5);
    glow(ctx, cx + 1.4, cy - 3, 4, HAIR.lt, 0.8);
    // (it's wound: two soft curved wraps across it)
    pen(ctx, SHADE(0.38), 0.6);
    for (const k of [0, 1]) {
      ctx.beginPath();
      ctx.arc(cx + 1 - k * 1.2, cy + 0.6 + k * 0.6, 4.6 - k * 1.8, Math.PI * (0.85 + k * 0.1), Math.PI * (1.95 - k * 0.15));
      ctx.stroke();
    }
    shineBand(ctx, cy - 2.6);
  }, lw, cy - 8, cy + 8);
  // the quill pushed through it: a white owl feather on a slant, its vane soft and rounded, a brass nib
  quill(ctx, a, mode, cx - 9.4, cy + 4.4, cx + 6.4, cy - 7.6, 1, lw);
}
// A quill: from its nib (x0, y0) to the end of its vane (x1, y1), drawn in her colours.
export function quill(ctx, a, mode, x0, y0, x1, y1, k, lw) {
  const an = Math.atan2(y1 - y0, x1 - x0);
  const L = Math.hypot(x1 - x0, y1 - y0);
  ctx.save();
  ctx.translate(x0, y0);
  ctx.rotate(an);
  // the vane: a long soft leaf, wider toward its far end, round
  const vane = chaikin([[L * 0.28, 0], [L * 0.45, -1.9 * k], [L * 0.8, -2.5 * k], [L, -1.1 * k], [L * 1.02, 0.3 * k], [L * 0.82, 1.5 * k], [L * 0.5, 1.2 * k], [L * 0.3, 0.4 * k]], 2);
  poly(ctx, vane);
  if (mode === 'line') {
    pen(ctx, tone(a, FEATHER.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, FEATHER.base);
    ctx.fill();
    ctx.save();
    poly(ctx, vane);
    ctx.clip();
    glow(ctx, L * 0.85, 0.6 * k, 2.6 * k, FEATHER.sh, 0.8);
    pen(ctx, tone(a, FEATHER.sh), 0.3);
    for (let i = 0; i < 5; i++) {
      const u = 0.42 + i * 0.12;
      ctx.beginPath();
      ctx.moveTo(L * u, 0);
      ctx.lineTo(L * (u + 0.07), -1.8 * k);
      ctx.stroke();
    }
    ctx.restore();
  }
  // the shaft and the brass nib
  ctx.lineCap = 'round';
  pen(ctx, mode === 'line' ? tone(a, FEATHER.ink) : tone(a, '#e8e2f4'), mode === 'line' ? 0.55 + lw * 2 : 0.55);
  ctx.beginPath();
  ctx.moveTo(L * 0.1, 0);
  ctx.lineTo(L * 0.98, -0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(L * 0.12, -0.7 * k);
  ctx.lineTo(L * 0.14, 0.7 * k);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, tone(a, GOLD.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her reading glasses, pushed up on top of her hair ----------
function glasses(ctx, a, mode, tx, tip, lw) {
  ctx.save();
  ctx.translate(1.4 + tx * 0.5, -17.4);
  ctx.rotate(-0.12 + tip);
  for (const dx of [-3.3, 3.3]) {
    ell(ctx, dx, 0, 2.6, 2.3);
    if (mode === 'line') {
      pen(ctx, tone(a, GOLD.ink), 0.85 + lw);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(236,244,255,0.55)';
      ctx.fill();
      pen(ctx, tone(a, GOLD.base), 0.7);
      ctx.stroke();
      pen(ctx, 'rgba(255,255,255,0.9)', 0.35);
      ctx.beginPath();
      ctx.arc(dx, 0, 1.6, Math.PI * 1.1, Math.PI * 1.45);
      ctx.stroke();
    }
  }
  ctx.beginPath();
  ctx.moveTo(-0.8, -0.4);
  ctx.quadraticCurveTo(0, -1.4, 0.8, -0.4);
  ctx.moveTo(-5.9, -0.2);
  ctx.lineTo(-8.6, 0.8);
  pen(ctx, mode === 'line' ? tone(a, GOLD.ink) : tone(a, GOLD.base), mode === 'line' ? 0.7 + lw : 0.6);
  ctx.stroke();
  ctx.restore();
}

// ---------- The whole head ----------
export function drawHead(ctx, a, mode, part, q, f, R, lw) {
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  if (part === 'back') {
    backHair(ctx, a, mode, tx, R.back ?? 0, lw);
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
    // the fringe's soft shadow on her forehead, in her skin's own shade
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
    // the blush: a wide peachy flush, a rosier core, three neat tapered strokes
    for (const s of [-1, 1]) {
      const bx = tx + s * 8.4;
      glow(ctx, bx, 8.6, 3.6, BLUSH[0], 0.3 + 0.28 * f.bl);
      glow(ctx, bx, 8.6, 2, BLUSH[1], 0.18 + 0.32 * f.bl);
      ctx.save();
      ctx.lineCap = 'round';
      pen(ctx, tone(a, '#ff8aa4', 0.25 + 0.4 * f.bl), 0.3);
      for (const dx of [-1, 0, 1]) {
        ctx.beginPath();
        ctx.moveTo(bx + dx - 0.3, 9.3);
        ctx.lineTo(bx + dx + 0.3, 8.3);
        ctx.stroke();
      }
      ctx.restore();
    }
    // her smudge of starlight ink, low on her near cheek
    ell(ctx, tx + 7.0, 12.6, 0.95, 0.6, -0.4);
    ctx.fillStyle = tone(a, INK.base, 0.55);
    ctx.fill();
    ell(ctx, tx + 8.2, 12.1, 0.32, 0.3);
    ctx.fill();
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look, s < 0 ? Math.max(f.lid, f.wk) : f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.2, -1.85, s, f);
    // the nose: a soft shade and a tip light
    glow(ctx, tx + 1.6, 7.8, 1.2, SKIN[3], 0.5);
    ell(ctx, tx + 1.2, 7.5, 0.32, 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 1, 11.4, f);
    if (q.sweat) sweat(ctx, tx - 12.8, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (f.wet > 0.6 && q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 7.6 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  hairShape(ctx, a, mode, capPts(tx), () => {
    glow(ctx, -15, 2, 7, HAIR.deep, 0.45);
    shineBand(ctx);
  }, lw);
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0, lw);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0, lw);
  fringe(ctx, a, mode, tx, R.fr, lw);
  glasses(ctx, a, mode, tx, R.glasses ?? 0, lw);
}
