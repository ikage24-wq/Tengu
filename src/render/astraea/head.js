// Astraea, the Star Keeper's head (2026-11-27, drawn from scratch: never the shared face, never the hero's
// head or hair, nothing of Folio's or the twins'): her face and its moods, her long starlight hair and its
// star beads. In head units about her face's middle (x toward the way she faces, y down; the skull about 16
// across each way), each piece drawn in both of the rig's passes (mode 'line': its outline, 'fill':
// itself), so only her outer edge is outlined; her face bare.
//   face   soft and young for a thousand years: full round cheeks low on her face, a short soft jaw and a
//          small round chin, a dusting of peach on her cheeks.
//   eyes   her own family, tareme: big gentle eyes whose outer corners droop (a sad, kind look even when
//          she smiles), tall oval irises holding a dusk sky (deep violet at the top, through rose, to a
//          warm gold low down), a soft round pupil and her signature glint: a little falling star, a round
//          light with a short soft tail, up at the back of each iris (every night one falls), and a small
//          round light low at the front. The upper lash a neat line, thin at the inner corner, thickening
//          as it goes out and curling DOWN round the outer corner to a small round end, one short round
//          flick out over it. The whole iris clear whenever she's awake; only blinks and closed moods
//          cover it.
//   brows  round brows: short, full, even, round at both ends, set just under the fringe; a little
//          worried even at rest.
//   mouth  small and soft: a closed line that rests level (never a stuck smile), lifting at both corners
//          only when she's happy; a counting mouth (vowel shapes), a round "o", a wobble when she's sad.
//   hair   starlight aqua, warming to a faint dawn apricot at its ends: an even blunt fringe of four
//          sections (the third the widest) cut in a gentle U that stops above her lashes, a deeper layer
//          seen in its splits, its soft shadow on her forehead; a long side lock each side outside her
//          eyes, down just past her chin, each bound near its end with one of her star beads; and
//          the rest falling straight down her back behind her body to the backs of her knees, its end one
//          soft round. One light from above for all of it, one pearly shine band across it all.
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear } from './fx.js';
import { SKIN, SKIN_INK, HAIR, GOLD, BEAD, LASH, BROW, IRIS, RING, PUPIL, LIP, BLUSH } from './palette.js';

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
// lid (0 open .. 1 shut: closed moods only), shut (which closed shape), bt (brow tilt: + knit, - worried),
// by (raise), mw/ms/mo (the mouth's width, smile, open), ro (a round "o"), wob (a wobbly line), bl (blush),
// sp (the falling-star glints turned to sparkles: wonder), wet (tears brimming), sm (small irises: a
// fright), wk (a wink).
const F0 = { lid: 0, shut: 'happy', bt: -0.2, by: 0.15, mw: 0.7, ms: 0, mo: 0, ro: 0, wob: 0, bl: 0.45, sp: 0, wet: 0, sm: 0, wk: 0 };
const fc = (o) => ({ ...F0, ...o });
export const FACES = {
  keep: fc({}),
  still: fc({ bt: -0.1, by: 0.25, ms: 0.08 }),
  count: fc({ bt: 0.1, by: 0.2, mw: 0.6, mo: 0.25, bl: 0.5 }),
  hope: fc({ bt: -0.45, by: 0.45, mw: 0.7, ms: 0.3, bl: 0.6, sp: 0.4 }),
  happy: fc({ bt: -0.3, by: 0.4, mw: 0.85, ms: 0.6, bl: 0.7 }),
  joy: fc({ bt: -0.35, by: 0.7, mw: 1, ms: 1, mo: 0.55, bl: 0.9, sp: 1 }),
  bliss: fc({ lid: 1, shut: 'happy', bt: -0.3, by: 0.4, mw: 0.85, ms: 0.75, bl: 0.8 }),
  sleepy: fc({ lid: 1, shut: 'calm', bt: -0.15, by: 0, mw: 0.5, ms: 0, mo: 0.15, bl: 0.5 }),
  focus: fc({ bt: 0.45, by: 0, mw: 0.55, ms: -0.05, bl: 0.4 }),
  brave: fc({ bt: 0.7, by: -0.05, mw: 0.62, ms: -0.15, bl: 0.5 }),
  cross: fc({ bt: 0.95, by: -0.1, mw: 0.7, ms: -0.35, mo: 0.3, bl: 0.75 }),
  awe: fc({ bt: -0.4, by: 0.9, mw: 0.5, ro: 0.8, bl: 0.6, sp: 1 }),
  lost: fc({ bt: -0.55, by: 1, mw: 0.5, ro: 1, sm: 0.85, bl: 0.5 }),
  fluster: fc({ bt: -0.7, by: 0.6, mw: 0.75, ms: -0.15, mo: 0.3, wob: 0.8, bl: 1.15 }),
  sad: fc({ bt: -0.95, by: 0.3, mw: 0.62, ms: -0.4, wob: 0.6, wet: 1, bl: 0.5 }),
  pout: fc({ bt: 0.35, by: 0.1, mw: 0.45, ms: -0.2, ro: 0.35, bl: 0.95 }),
  hurt: fc({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.85, ms: -0.45, mo: 0.5, bl: 0.7 }),
  dizzy: fc({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.75, ms: -0.25, mo: 0.35, bl: 0.5 }),
  talk: fc({ bt: -0.1, by: 0.3, mw: 0.75, ms: 0.2, mo: 0.4, bl: 0.5 }),
  wink: fc({ bt: -0.2, by: 0.45, mw: 0.85, ms: 0.65, mo: 0.15, bl: 0.8, sp: 1, wk: 1 }),
};
export const SHUTS = ['happy', 'calm', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'wk', 'bt', 'by', 'mw', 'ms', 'mo', 'ro', 'wob', 'bl', 'sp', 'wet', 'sm'];
// (her counting mouth: [width, smile, open], vowel-like shapes)
export const VOWELS = [[0.5, 0.1, 0.6], [0.85, 0.35, 0.45], [0.75, 0.4, 0.2], [0.55, 0.15, 0], [0.45, 0.1, 0.5]];

// (the eyes' place on her face: the same size, level)
export const EYE = { y: 4.3, dx: 6.2, w: 3.9, h: 4.3, droop: 0.26 };

// ---------- One eye ----------
// The eye's outline, its outer corner lower (tareme): an ellipse turned down at the outside.
const eyeAt = (x, y, side, u) => {
  const { w, h, droop } = EYE;
  const an = Math.PI + (side > 0 ? u : 1 - u) * Math.PI;
  const px = Math.cos(an) * w * 1.03;
  const py = Math.sin(an) * h * 1.03;
  const r = side * droop;
  return [x + px * Math.cos(r) - py * Math.sin(r), y + px * Math.sin(r) + py * Math.cos(r)];
};
function eye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h, droop } = EYE;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.asUid ?? 0) * 1.7) % 5.9, 5.3, 5.42, 5.5, 5.66) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  const inner = eyeAt(x, y, side, 0.02);
  const outer = eyeAt(x, y, side, 0.98);
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
        // happy: a soft arch; calm (a blink, a doze): a gentle curve down; both end in her soft lash
        // curl, turning down round the outer corner
        const up = s === 'happy' ? -1 : 1;
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          pts.push([mix(inner[0], outer[0], u), mix(inner[1], outer[1], u) + (s === 'happy' ? 0.6 : 0.3) + up * Math.sin(Math.PI * u) * h * (s === 'happy' ? 0.42 : 0.28)]);
        }
        pen(ctx, tone(a, LASH), 0.85);
        ctx.beginPath();
        pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
        ctx.stroke();
        const e = pts[12];
        pen(ctx, tone(a, LASH), 0.6);
        ctx.beginPath();
        ctx.moveTo(e[0] - side * 0.5, e[1] - 0.1);
        ctx.quadraticCurveTo(e[0] + side * 0.9, e[1] + 0.1, e[0] + side * 0.9, e[1] + 0.9);
        ctx.stroke();
        ell(ctx, e[0] + side * 0.9, e[1] + 0.95, 0.32, 0.32);
        ctx.fillStyle = tone(a, LASH);
        ctx.fill();
      } else if (s === 'squeeze') {
        // > < : squeezed shut, pointing in
        pen(ctx, tone(a, LASH), 0.85);
        ctx.beginPath();
        ctx.moveTo(x + side * w, y - 2.2);
        ctx.quadraticCurveTo(x - side * w * 0.1, y - 0.2, x - side * w * 0.9, y + 0.4);
        ctx.quadraticCurveTo(x - side * w * 0.1, y + 0.9, x + side * w, y + 2.8);
        ctx.stroke();
      } else {
        // dizzy: a soft swirl
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
  // a soft rose wash over the lid
  glow(ctx, x + side * 0.6, y - h * 0.9, 4.4, '#f6b6c8', 0.32);
  // the white: an oval turned down at its outer corner
  const shape = () => ell(ctx, x, y, w, h, side * droop);
  shape();
  ctx.fillStyle = tone(a, '#fffeff');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.34 * f.sm;
  const ix = x + side * 0.1 + (look?.[0] ?? 0) * 0.55;
  const iy = y + 0.45 + (look?.[1] ?? 0) * 0.5;
  const RX = 2.95 * small;
  const RY = 3.55 * small;
  // the iris: a dusk sky, deep violet at the top through rose to warm gold below
  const g = ctx.createLinearGradient(0, iy - RY, 0, iy + RY);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.38, tone(a, IRIS[2]));
  g.addColorStop(0.72, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, RX, RY);
  ctx.fillStyle = g;
  ctx.fill();
  // a soft deeper top under the lid, and a faint glow of gold round the pupil's lower half
  glow(ctx, ix, iy - RY * 0.7, RX * 1.1, IRIS[3], 0.55);
  glow(ctx, ix, iy + RY * 0.45, RX * 0.8, '#fff0b8', 0.35);
  // its rim, a soft violet
  ell(ctx, ix, iy, RX, RY);
  pen(ctx, tone(a, RING, 0.85), 0.5);
  ctx.stroke();
  // the pupil: soft and round, a touch tall
  ell(ctx, ix, iy - 0.1, RX * 0.42, RY * 0.42);
  ctx.fillStyle = tone(a, PUPIL);
  ctx.fill();
  // the lid's soft shadow along the top of the white (never over the iris's middle)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.5);
  sg.addColorStop(0, 'rgba(120,80,150,0.3)');
  sg.addColorStop(1, 'rgba(120,80,150,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.72);
  // her glint: a little falling star, a round light up at the back of the iris with a short soft tail
  // trailing up and back (in wonder it turns to a four-point sparkle); and a small round light low in front
  const sp = f.sp;
  const gx = ix - side * RX * 0.34;
  const gy = iy - RY * 0.32;
  if (sp < 0.98) {
    ctx.save();
    ctx.globalAlpha *= 1 - sp;
    const tx = gx - side * 2.0;
    const ty = gy - 1.7;
    const tg = ctx.createLinearGradient(tx, ty, gx, gy);
    tg.addColorStop(0, 'rgba(255,255,255,0)');
    tg.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    tg.addColorStop(1, 'rgba(255,255,255,0.95)');
    ctx.beginPath();
    ctx.moveTo(tx, ty);
    ctx.quadraticCurveTo(gx - side * 0.6, gy - 1.05, gx + side * 0.35, gy - 0.6);
    ctx.lineTo(gx - side * 0.45, gy + 0.55);
    ctx.quadraticCurveTo(gx - side * 1.1, gy - 0.4, tx, ty);
    ctx.closePath();
    ctx.fillStyle = tg;
    ctx.fill();
    ell(ctx, gx, gy, 0.8, 0.8);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
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
  ell(ctx, ix + side * RX * 0.45, iy + RY * 0.5, 0.42, 0.42);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
  if (f.wet > 0.05) {
    ell(ctx, ix, y + h * 0.7, w * 0.85, 0.95);
    ctx.fillStyle = `rgba(222,238,255,${0.75 * f.wet})`;
    ctx.fill();
  }
  ctx.restore();
  // the upper lash: one closed outline, thin at the inner corner, thickening outward, curling down round
  // the outer corner to a small round end
  const N = 14;
  const up = [];
  const lo = [];
  for (let i = 0; i <= N; i++) {
    const u = 0.08 + (i / N) * 0.86;
    const [px, py] = eyeAt(x, y, side, u);
    const th = 0.2 + 0.8 * (i / N) ** 1.5;
    up.push([px, py - th * 0.62]);
    lo.push([px, py + th * 0.38]);
  }
  const [ox, oy] = eyeAt(x, y, side, 0.97);
  const tail = [ox + side * 0.75, oy + 1.25];
  ctx.beginPath();
  ctx.moveTo(...lo[0]);
  for (const p of up) ctx.lineTo(...p);
  ctx.quadraticCurveTo(ox + side * 1.15, oy - 0.2, tail[0] + side * 0.3, tail[1]);
  ctx.quadraticCurveTo(tail[0], tail[1] + 0.45, tail[0] - side * 0.25, tail[1] - 0.05);
  ctx.quadraticCurveTo(ox + side * 0.2, oy + 0.3, lo[N][0], lo[N][1]);
  for (let i = N; i >= 0; i--) ctx.lineTo(...lo[i]);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  // one short round flick out over the outer end, grown from the line
  const [fx, fy] = eyeAt(x, y, side, 0.82);
  pen(ctx, tone(a, LASH), 0.42);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(fx, fy - 0.45);
  ctx.quadraticCurveTo(fx + side * 0.5, fy - 1.05, fx + side * 1.15, fy - 1.0);
  ctx.stroke();
  // a soft sheen along the lash
  pen(ctx, 'rgba(210,190,240,0.35)', 0.18);
  ctx.beginPath();
  for (let i = 3; i <= N - 2; i++) (i === 3 ? ctx.moveTo : ctx.lineTo).call(ctx, up[i][0], up[i][1] + 0.22);
  ctx.stroke();
  ctx.restore();
}
// Brows: round brows, short, full, even, round at both ends.
function brow(ctx, a, x, y, side, f) {
  const yi = y - f.by * 0.5 + f.bt * 0.6;
  const yo = y - f.by * 0.5 - f.bt * 0.2;
  const xi = x - side * 1.3;
  const xo = x + side * 1.5;
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROW), 1.0);
  ctx.beginPath();
  ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo(x, Math.min(yi, yo) - 0.4, xo, yo + 0.15);
  ctx.stroke();
  ctx.restore();
}
// The mouth: small and soft.
function mouth(ctx, a, x, y, f) {
  const w = 1.35 * f.mw;
  const cy = y - f.ms * 0.45;
  if (f.ro > 0.3) {
    const k = f.ro;
    ell(ctx, x, y + 0.4, 0.65 * k + 0.25, 0.95 * k + 0.25);
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
    ctx.quadraticCurveTo(x, y + f.ms * 0.45 - o * 0.4, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.9 + o * 2.2, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + f.ms * 0.7 + o * 1.8, w * 0.68, o * 0.8);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    return;
  }
  // closed: one soft line, a touch fuller in the middle, both corners lifting only when she smiles (a
  // wobble when she's upset)
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LIP.sh), 0.5);
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const px = x - w + u * w * 2;
    const py = cy + Math.sin(Math.PI * u) * f.ms * 0.75 + Math.sin(u * Math.PI * 4) * f.wob * 0.3;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x, y + 0.9, 1.2, LIP.base, 0.3);
}

// Her face: full round cheeks low on it, a short soft jaw, a small round chin.
export function skullPts(tx) {
  return chaikin([[0, -17.6], [11.8, -13.8], [15.8, -4.6], [16.3, 4.2], [14.4, 10.2], [9.6, 14.4], [3.4 + tx * 0.25, 16.2], [-1.2 + tx * 0.25, 16.4], [-6.2 + tx * 0.15, 15], [-12.6, 10.6], [-15.9, 4.4], [-16, -4.6], [-11.9, -13.8]], 3);
}

// ---------- Her hair ----------
// One light for all of it, top to bottom (the same span for every piece, so it reads as one head of hair):
// pale at the crown, deeper down her back, its ends warming to dawn.
const HY0 = -22;
const HY1 = 76;
function hairFill(ctx, a) {
  const g = ctx.createLinearGradient(0, HY0, 0, HY1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(0.16, tone(a, HAIR.base));
  g.addColorStop(0.5, tone(a, HAIR.sh));
  g.addColorStop(0.8, tone(a, HAIR.deep));
  g.addColorStop(0.93, tone(a, HAIR.sh));
  g.addColorStop(1, tone(a, HAIR.tip));
  return g;
}
// The one shine band they all share (clipped into each piece, so it lines up across them).
function shineBand(ctx, y = -9.4) {
  const g = ctx.createLinearGradient(0, y - 2.4, 0, y + 2.4);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(0.5, 'rgba(240,255,252,0.7)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-60, y - 2.4, 120, 4.8);
  pen(ctx, 'rgba(255,255,255,0.85)', 0.3);
  for (const [x, l] of [[-12, 1.8], [-5.6, 2.4], [1.6, 1.4], [7.8, 2.2], [13, 1.2]]) {
    const yy = y - 0.3 + 0.004 * x * x;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + l / 2, yy - 0.4, x + l, yy + 0.1);
    ctx.stroke();
  }
}
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
// (her hair's shade: periwinkle, never grey)
const SHADE = (al) => `rgba(96,120,190,${al})`;
// The fringe's cut: one even gentle U across her forehead, lowest in the middle just above her lashes.
const CUT = { y: -3.0, rise: 2.6, half: 14.6 };
const cutY = (x, cx) => CUT.y + CUT.rise * Math.min(1, ((x - cx) / CUT.half) ** 2);
// Its four sections (the third the widest), each split [where, how deep, how wide the gap].
const SPLITS = [[0.21, 2.7, 0.95], [0.45, 3.5, 1.15], [0.76, 3.0, 1.0]];
function fringeGeom(tx, sw) {
  const cx = 0.6 + tx * 0.6;
  const x0 = cx - CUT.half - 0.9;
  const x1 = cx + CUT.half + 0.9;
  const W = x1 - x0;
  const topY = (x) => -16.8 + 0.02 * (x - cx) ** 2;
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
      pts.push([x + dx * (1 - Math.abs(k / n - 0.5) * 2) * 0.3 + dx * 0.4, cutY(x, cx) + 0.45 * Math.sin(Math.PI * (k / n))]);
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
  for (const s of G.secs) {
    hairShape(ctx, a, mode, s.pts, () => {
      const cy = cutY(s.mid, G.cx);
      const g = ctx.createLinearGradient(0, cy - 4.4, 0, cy + 0.6);
      g.addColorStop(0, SHADE(0));
      g.addColorStop(1, SHADE(0.42));
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -22, s.R - s.L + 4, 26);
      // (thin soft shadows down each side at the splits, fading toward the crown)
      for (const [ex, k] of [[s.L, 1], [s.R, -1]]) {
        const sg = ctx.createLinearGradient(0, -12, 0, cutY(ex, G.cx));
        sg.addColorStop(0, SHADE(0));
        sg.addColorStop(1, SHADE(0.36));
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ex + k * 0.3, -12);
        ctx.quadraticCurveTo(ex + k * 0.5, (cutY(ex, G.cx) - 12) / 2, ex + k * 0.4, cutY(ex, G.cx));
        ctx.stroke();
      }
      // (a small soft shadow cutting into the widest section, so it isn't one flat slab)
      if (s.R - s.L > 8) {
        pen(ctx, SHADE(0.22), 0.6);
        ctx.beginPath();
        ctx.moveTo(s.mid + 0.8, cutY(s.mid, G.cx) - 2.6);
        ctx.quadraticCurveTo(s.mid + 1.1, cutY(s.mid, G.cx) - 1.2, s.mid + 0.9, cutY(s.mid, G.cx) - 0.2);
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
    const off = 1.6 + Math.max(0, -Math.sin(an)) * 1.4;
    pts.push([Math.cos(an) * (16.6 + off), Math.sin(an) * (17.8 + off) + 0.4]);
  }
  return chaikin([[-17.6, 4], ...pts, [17.8, 1], [12, -5], [tx, -8], [-9, -6], [-15.8, -1]], 2);
}
// A long side lock: from under the fringe outside her eye, down just past her chin, a gentle
// taper to one soft round end, bound near it with a star bead; its end swaying on its own spring.
const LOCK_E = 24;
function sideLockPts(side, tx, sway) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 11.8 : -11.2;
  const outX = side > 0 ? 17.6 : -17.8;
  const sx = (v) => v + shift;
  const s = sway * 3.2;
  const E = LOCK_E;
  // (it hugs the cheek, narrows a little at the bead, and ends in one soft round)
  const pts = chaikin([
    [sx(outX - side * 0.4), -9.8], [sx(inX - side * 1.3), -9.4], [sx(inX), -2], [sx(inX + side * 0.3) + s * 0.2, 8],
    [sx(inX + side * 0.9) + s * 0.45, 16], [sx(inX + side * 1.6) + s * 0.7, E - 7], [sx(inX + side * 1.9) + s * 0.85, E - 2.6],
    [sx((inX + outX) / 2 + side * 0.4) + s, E + 0.8],
    [sx(outX - side * 1.6) + s * 0.85, E - 2.6], [sx(outX - side * 1.5) + s * 0.7, E - 7], [sx(outX - side * 0.4) + s * 0.45, 16],
    [sx(outX + side * 0.3) + s * 0.2, 7], [sx(outX + side * 0.3), -3],
  ], 3);
  const bead = [sx((inX + outX) / 2 + side * 0.2) + s * 0.72, E - 6.2];
  return { pts, bead, inX: sx(inX), outX: sx(outX), s };
}
function sideLock(ctx, a, mode, side, tx, sway, lw) {
  const P = sideLockPts(side, tx, sway);
  hairShape(ctx, a, mode, P.pts, () => {
    const g = ctx.createLinearGradient(0, -10, 0, -4);
    g.addColorStop(0, SHADE(0.45));
    g.addColorStop(1, SHADE(0));
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(P.outX, P.inX) - 4, -11, 14, 7);
    // (a soft shade along the face side, and where it tucks under the fringe)
    glow(ctx, P.inX + side * 0.8, 10, 3.2, HAIR.deep, 0.35);
    // (one soft split down its length, fading before the end)
    pen(ctx, SHADE(0.28), 0.5);
    ctx.beginPath();
    ctx.moveTo((P.inX + P.outX) / 2 + side * 0.4, 4);
    ctx.quadraticCurveTo((P.inX + P.outX) / 2 + side * 0.7 + P.s * 0.4, 14, (P.inX + P.outX) / 2 + side * 0.4 + P.s * 0.65, LOCK_E - 8);
    ctx.stroke();
    shineBand(ctx);
  }, lw);
  // the star bead that binds it: a round gold bead with a little star on it
  starBead(ctx, a, mode, P.bead[0], P.bead[1], 1.55, lw);
}
// One of her star beads (the same as on her abacus): a round soft-gold bead, a little star pressed in it.
export function starBead(ctx, a, mode, x, y, r, lw, lit = 0) {
  ell(ctx, x, y, r * 1.08, r);
  if (mode === 'line') {
    pen(ctx, tone(a, BEAD.ink), lw);
    ctx.stroke();
    return;
  }
  if (lit > 0.01) glow(ctx, x, y, r * 3.2, BEAD.glow, 0.5 * lit);
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r * 1.1);
  g.addColorStop(0, tone(a, BEAD.lt));
  g.addColorStop(0.55, tone(a, BEAD.base));
  g.addColorStop(1, tone(a, BEAD.sh));
  ell(ctx, x, y, r * 1.08, r);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = (i % 2 ? 0.26 : 0.6) * r;
    const p = [x + 0.05 * r + Math.cos(an) * rr, y + 0.05 * r + Math.sin(an) * rr];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, GOLD.sh);
  ctx.fill();
  ell(ctx, x - r * 0.38, y - r * 0.42, r * 0.26, r * 0.2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
}
// Behind her head: the rest of her hair, falling straight down her back behind her body to the backs of
// her knees, a little fuller toward its end, which is one soft round; a long heavy swing (`sw`), and it
// keeps hanging down when her head tilts (`lean`, the head's own turn, undone down its length).
function backHair(ctx, a, mode, tx, sw, lean, lw, sit = 0) {
  const s = sw ?? 0;
  // (sitting down, it gathers on the floor behind her instead of going through it)
  const L = 76 * (1 - 0.52 * sit);
  const top = -8;
  // (a point down the hair at u 0..1, its sideways offset; the head's own lean undone as it goes down)
  const at = (u, off) => {
    const x0 = -9.5 - u * 9 + tx * 0.12 + off + s * 16 * u * u + Math.sin(u * Math.PI) * 1.6;
    const y0 = top + u * L;
    const r = -lean * sstep(u * 1.6);
    const cx = -4;
    const cy = top;
    return [cx + (x0 - cx) * Math.cos(r) - (y0 - cy) * Math.sin(r), cy + (x0 - cx) * Math.sin(r) + (y0 - cy) * Math.cos(r)];
  };
  const W = (u) => 19 + Math.sin(u * Math.PI * 0.9) * 5 + u * 3;
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
    // (deeper where it falls behind her, a few soft long locks down it, the shine band at the crown)
    const mid = at(0.55, 0);
    glow(ctx, mid[0], mid[1], 18, HAIR.deep, 0.35);
    pen(ctx, SHADE(0.22), 0.7);
    for (const off of [-4, 1.5, 5.5]) {
      ctx.beginPath();
      const p0 = at(0.12, off);
      const p1 = at(0.6, off * 1.1);
      const p2 = at(0.94, off * 0.7);
      ctx.moveTo(...p0);
      ctx.quadraticCurveTo(...p1, ...p2);
      ctx.stroke();
    }
    shineBand(ctx);
  }, lw);
}

// ---------- The whole head ----------
export function drawHead(ctx, a, mode, part, q, f, R, lw) {
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  if (part === 'back') {
    backHair(ctx, a, mode, tx, R.back ?? 0, R.lean ?? 0, lw, R.sit ?? 0);
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
    glow(ctx, -12.6, 5, 6, SKIN[2], 0.5);
    glow(ctx, 13.6 + tx * 0.7, 5, 5, SKIN[2], 0.4);
    glow(ctx, tx * 0.5, 15.6, 8, SKIN[2], 0.28);
    // the fringe's soft shadow on her forehead, in her skin's own shade
    const G = fringeGeom(tx, R.fr);
    ctx.beginPath();
    ctx.moveTo(G.x0, -22);
    ctx.lineTo(G.x1, -22);
    for (let k = 0; k <= 20; k++) {
      const x = G.x1 - (G.x1 - G.x0) * (k / 20);
      ctx.lineTo(x, cutY(x, G.cx) + 0.9);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, SKIN[2], 0.7);
    ctx.fill();
    ctx.restore();
    // the blush: a wide peachy flush low on her round cheeks, a rosier core, two neat tapered strokes
    for (const s of [-1, 1]) {
      const bx = tx + s * 8.8;
      glow(ctx, bx, 9.6, 4, BLUSH[0], 0.32 + 0.28 * f.bl);
      glow(ctx, bx, 9.6, 2.2, BLUSH[1], 0.16 + 0.32 * f.bl);
      ctx.save();
      ctx.lineCap = 'round';
      pen(ctx, tone(a, '#ff8aa0', 0.22 + 0.4 * f.bl), 0.3);
      for (const dx of [-0.6, 0.6]) {
        ctx.beginPath();
        ctx.moveTo(bx + dx - 0.3, 10.3);
        ctx.lineTo(bx + dx + 0.3, 9.3);
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look, s < 0 ? Math.max(f.lid, f.wk) : f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.3, -1.55, s, f);
    // the nose: a soft shade and a tip light
    glow(ctx, tx + 1.5, 8.4, 1.2, SKIN[3], 0.5);
    ell(ctx, tx + 1.1, 8.1, 0.3, 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 0.9, 12, f);
    if (q.sweat) sweat(ctx, tx - 13, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (f.wet > 0.6 && q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.6, 8.4 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  hairShape(ctx, a, mode, capPts(tx), () => {
    glow(ctx, -15, 2, 7, HAIR.deep, 0.45);
    shineBand(ctx);
  }, lw);
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0, lw);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0, lw);
  fringe(ctx, a, mode, tx, R.fr, lw);
}
export { fringeGeom, cutY, sideLockPts };
