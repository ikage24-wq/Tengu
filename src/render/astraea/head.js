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
//   hair   starlight aqua, warming through a soft sage to dawn apricot at its ends (2026-11-27 polish,
//          after the bangs checklist: the fringe was straight blocks, the side locks flat sheets): a soft
//          fringe of rounded locks in three chunks (the middle the widest and shortest, each chunk one
//          thick lock and thinner ones leaning in to it, a triangle of the deeper layer between chunks),
//          stopping above her lashes, its soft shadow on her forehead, her brows drawn over its tips; a
//          long side lock each side outside her eyes (a thick lock and a thinner one before it), down just
//          past her chin, bound near its end with one of her star beads; and the rest falling down her
//          back behind her body to the backs of her knees, parting into three soft round ends. One light
//          from above for all of it, one pearly shine band across it all.
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear, clamp } from './fx.js';
import { curve } from '../mobs/kidbase.js';
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
// lid (0 open .. 1 shut; a little in a set, determined face: the lid lowered over the iris's top), shut (which closed shape), bt (brow tilt: + knit, - worried),
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
  focus: fc({ lid: 0.2, bt: 0.45, by: 0, mw: 0.55, ms: -0.05, bl: 0.4 }),
  tally: fc({ lid: 0.14, bt: 0.5, by: 0.05, mw: 0.6, mo: 0.25, bl: 0.5 }),
  brave: fc({ lid: 0.22, bt: 0.7, by: -0.05, mw: 0.62, ms: -0.15, bl: 0.5 }),
  cross: fc({ lid: 0.26, bt: 0.95, by: -0.1, mw: 0.7, ms: -0.35, mo: 0.3, bl: 0.75 }),
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
  // (closing, a real lid comes down over the open eye, its lash with it, so an eye shutting never shows
  // as a see-through eye under a closed one: only the lash fades into the closed shape at the very end)
  const lidK = sstep(L / 0.85);
  const dy = lidK * h * 1.6;
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
  const openW = 1 - sstep((L - 0.78) / 0.22);
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // a soft rose wash over the lid
  glow(ctx, x + side * 0.6, y - h * 0.9 + dy * 0.5, 4.4, '#f6b6c8', 0.32);
  if (dy > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - w * 2, y - h * 1.05 + dy, w * 4, h * 3);
    ctx.clip();
  }
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
  if (dy > 0.01) ctx.restore();
  ctx.save();
  ctx.translate(0, dy);
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
  ctx.restore();
}
// Brows: round brows, short, full, even, round at both ends.
function brow(ctx, a, x, y, side, f) {
  const yi = y - f.by * 0.5 + f.bt * 1.1;
  const yo = y - f.by * 0.5 - f.bt * 0.35;
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
// `end`: where this piece of hair ends (down her back, past her chin): over its last stretch it warms
// through a pale cream to dawn apricot, so every long lock's end glows (2026-11-27 polish: the fade ran
// over the one span for all of it and only the last pixels of her back hair ever reached it).
function hairFill(ctx, a, end = HY1) {
  const g = ctx.createLinearGradient(0, HY0, 0, end);
  const u = (y) => clamp((y - HY0) / (end - HY0), 0, 1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(u(-6), tone(a, HAIR.base));
  if (end > 40) {
    g.addColorStop(0.45, tone(a, HAIR.sh));
    g.addColorStop(0.64, tone(a, HAIR.deep));
    g.addColorStop(0.79, tone(a, HAIR.sh));
    g.addColorStop(0.9, tone(a, HAIR.fade));
  } else {
    g.addColorStop(Math.max(u(-6) + 0.1, 0.6), tone(a, HAIR.sh));
    g.addColorStop(0.83, tone(a, HAIR.fade));
  }
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
function hairShape(ctx, a, mode, pts, shade, lw, end) {
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, tone(a, HAIR.ink), lw);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = hairFill(ctx, a, end);
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

// ---------- Her locks (2026-11-27 polish: the fringe was cut in straight blocks and the side locks were
// flat sheets; now every piece is a soft rounded lock, after the bangs checklist) ----------
// One lock: a centre line from `start` (up in the hair over her crown) through its root on her hairline,
// bowing by `bend`, to its tip; `w` wide down to the root, then tapering to a round cap `tw` wide, a
// little swell along it so no edge runs straight.
function lockOf(start, root, tip, bend, w, tw) {
  const mid = [(root[0] + tip[0]) / 2, (root[1] + tip[1]) / 2];
  const dx = tip[0] - root[0];
  const dy = tip[1] - root[1];
  const L = Math.hypot(dx, dy) || 1;
  const ctrl = [mid[0] - (dy / L) * bend, mid[1] + (dx / L) * bend];
  const line = curve([start, root, ctrl, tip], 6);
  const n = line.length;
  const left = [];
  const right = [];
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    const p = line[Math.max(0, i - 1)];
    const q = line[Math.min(n - 1, i + 1)];
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
    const nx = -(q[1] - p[1]) / d;
    const ny = (q[0] - p[0]) / d;
    const ww = u < 0.3 ? w : mix(w, tw, ((u - 0.3) / 0.7) ** 1.2) * (1 + Math.sin(Math.PI * u) * 0.07);
    left.push([line[i][0] + nx * ww * 0.5, line[i][1] + ny * ww * 0.5]);
    right.push([line[i][0] - nx * ww * 0.5, line[i][1] - ny * ww * 0.5]);
  }
  const [ex, ey] = line[n - 1];
  const [px, py] = line[n - 2];
  const an = Math.atan2(ey - py, ex - px);
  const cap = [];
  for (let k = 1; k < 7; k++) {
    const a = an - Math.PI / 2 + (k / 7) * Math.PI;
    cap.push([ex + Math.cos(a) * tw * 0.5, ey + Math.sin(a) * tw * 0.5]);
  }
  const pts = [...left, ...cap.reverse(), ...right.reverse()];
  // (its lower edge, both sides and round the tip, from `k0` of the way down: where the lock lies over
  // her face, so it gets a fine edge of its own there)
  const edgeFrom = (k0) => {
    const i0 = Math.round(n * k0);
    const N = pts.length;
    return [...pts.slice(i0, n), ...pts.slice(n - 1, N - n + 1), ...pts.slice(N - n, N - i0)];
  };
  return { pts, line, edgeFrom };
}
// (a lock's own fine edge over her face: its hair's shade, thin, never a dark line)
function lockEdge(ctx, a, L, k0 = 0.5) {
  const e = L.edgeFrom(k0);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  pen(ctx, tone(a, HAIR.sh, 0.95), 0.42);
  ctx.beginPath();
  e.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.stroke();
  ctx.restore();
}
// The fringe: a cute three-chunk cut, the middle chunk the widest and the shortest (her eyes stay clear),
// each chunk one thick lock and thinner ones whose tips lean in to it; neighbours differ in width and tip
// height, one lock curls back the other way, a triangle of the deeper layer opening between the chunks,
// every tip a round cap, all of it springing from her part like a fountain. [x of the root on her
// hairline, tip [x, y], width, tip width, bow, chunk, thick] (x about the face's middle).
const LOCKS = [
  [-11.6, [-12.0, -0.3], 8.4, 3.4, 1.2, 0, 1],
  [-7.6, [-9.5, -1.5], 5.2, 2.5, 0.9, 0, 0],
  [-4.4, [-3.3, -2.2], 4.2, 2.2, -0.9, 1, 0],
  [0.2, [-0.5, -3.1], 9.6, 3.9, 0.6, 1, 1],
  [3.8, [2.7, -2.4], 4.8, 2.3, -1.0, 1, 0],
  [8.6, [9.3, -0.4], 8.7, 3.6, -1.3, 2, 1],
  [12.4, [11.4, -1.3], 5.6, 2.6, -0.6, 2, 0],
];
const hairlineY = (x) => -8.6 + (x / 15) ** 2 * 3.2;
function fringeLocks(tx, sw) {
  const cx = 0.6 + tx * 0.6;
  const part = [cx + 2.5, -18.5];
  return LOCKS.map(([rx, [tx0, ty], w, tw, bend, c, thick]) => {
    const root = [cx + rx, hairlineY(rx) - 1];
    const start = [mix(root[0], part[0], 0.55), mix(root[1], part[1], 0.55)];
    // (each chunk on its own spring, the thin locks a touch freer; never far enough to cross her eyes)
    const s = clamp((sw?.[c] ?? 0) * 14 * (thick ? 0.8 : 1.1), -0.7, 0.7);
    const L = lockOf(start, root, [cx + tx0 + s, ty], bend, w, tw);
    L.thick = thick;
    L.tip = [cx + tx0 + s, ty];
    return L;
  });
}
function fringe(ctx, a, mode, tx, sw, lw) {
  const cx = 0.6 + tx * 0.6;
  const locks = fringeLocks(tx, sw);
  // (the deeper layer behind it, seen up inside the gaps between the chunks; forehead below that)
  const inner = chaikin([[cx - 14.4, -4.6], [cx - 6, -6.4], [cx + 6, -6.4], [cx + 14.4, -4.0], [cx + 14.0, -2.4], [cx + 6, -3.6], [cx, -4.4], [cx - 6, -3.6], [cx - 14.0, -2.4]], 2);
  poly(ctx, inner);
  if (mode === 'line') {
    pen(ctx, tone(a, HAIR.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, HAIR.deep);
    ctx.fill();
  }
  // (thin locks first, the thick ones over them: nearer, thicker)
  for (const L of [...locks.filter((l) => !l.thick), ...locks.filter((l) => l.thick)]) {
    hairShape(ctx, a, mode, L.pts, () => {
      // (its shade gathers toward the tip: the deepest tone on the overhang above her eyes)
      const g = ctx.createLinearGradient(0, L.tip[1] - 6, 0, L.tip[1] + 0.6);
      g.addColorStop(0, SHADE(0));
      g.addColorStop(1, SHADE(L.thick ? 0.3 : 0.24));
      ctx.fillStyle = g;
      ctx.fillRect(L.tip[0] - 6, L.tip[1] - 7, 12, 9);
      shineBand(ctx);
    }, lw);
    if (mode === 'fill') lockEdge(ctx, a, L, 0.52);
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
// A long side lock each side: one thick lock from under her fringe outside her eye, bowing softly round
// her cheek and turning in to a round end just past her chin, bound near it with a star bead; a thinner
// lock in front of it, shorter, its end tucked in toward the thick one's; both warming to dawn at their
// ends; their ends swaying on its spring.
const LOCK_E = 24.5;
function sideLocks(side, tx, sway) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const X = (v) => side * v + shift;
  const s = sway * 3.2;
  const main = lockOf([X(10.6), -11], [X(14.9), -4], [X(13.8) + s, LOCK_E], -side * 1.2, 5.9, 2.7);
  const thin = lockOf([X(10), -10], [X(13.1), -3], [X(12.6) + s * 0.8, 18.6], -side * 0.8, 3.4, 1.9);
  // (the bead binds the thick lock a little above its end)
  const by = LOCK_E - 6.6;
  const ln = main.line;
  let bead = ln[ln.length - 1];
  for (let i = 1; i < ln.length; i++) {
    if (ln[i][1] >= by) {
      const u = (by - ln[i - 1][1]) / Math.max(0.01, ln[i][1] - ln[i - 1][1]);
      bead = [mix(ln[i - 1][0], ln[i][0], u), by];
      break;
    }
  }
  return { main, thin, bead, s };
}
function sideLock(ctx, a, mode, side, tx, sway, lw) {
  const P = sideLocks(side, tx, sway);
  for (const [L, end] of [[P.main, LOCK_E], [P.thin, 18.6]]) {
    hairShape(ctx, a, mode, L.pts, () => {
      // (shaded where it tucks under the fringe, and along the face side)
      const g = ctx.createLinearGradient(0, -10, 0, -3);
      g.addColorStop(0, SHADE(0.45));
      g.addColorStop(1, SHADE(0));
      ctx.fillStyle = g;
      ctx.fillRect(-30, -12, 60, 9);
      const mid = L.line[Math.round(L.line.length * 0.6)];
      glow(ctx, mid[0] - side * 1.4, mid[1], 3, HAIR.deep, L === P.main ? 0.35 : 0.2);
      shineBand(ctx);
    }, lw, end);
    if (mode === 'fill') lockEdge(ctx, a, L, 0.42);
  }
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
  for (let i = 0; i <= 9; i++) {
    const u = i / 10;
    back.push(at(u, -W(u) * 0.55));
    front.push(at(u, W(u) * 0.45));
  }
  // (its end in three soft round locks of their own lengths, the middle one longest, the splits between
  // them of different depths: never an even scalloped hem)
  const W1 = W(1);
  const ends = [at(0.985, W1 * 0.31), at(0.925, W1 * 0.14), at(1.05, -W1 * 0.07), at(0.965, -W1 * 0.29), at(1.015, -W1 * 0.46)];
  const tipEnd = top + L * 1.05;
  const pts = chaikin([[-17.4, -9], [-12, -16], [4, -16], [13, -9], ...front, ...ends, ...back.reverse()], 3);
  hairShape(ctx, a, mode, pts, () => {
    // (deeper where it falls behind her, a soft fullness where it turns toward the light, the long locks
    // it parts into running down into the splits at its end, the shine band at the crown)
    const mid = at(0.55, 0);
    glow(ctx, mid[0], mid[1], 18, HAIR.deep, 0.35);
    const full = at(0.34, W(0.34) * 0.2);
    glow(ctx, full[0], full[1], 9, HAIR.base, 0.3);
    pen(ctx, SHADE(0.24), 0.7);
    ctx.lineCap = 'round';
    for (const [u0, o0, o1, u1] of [[0.2, 0.2, 0.14, 0.93], [0.3, -0.3, -0.29, 0.96], [0.14, -0.04, -0.08, 0.62]]) {
      ctx.beginPath();
      const p0 = at(u0, W(u0) * o0);
      const p1 = at((u0 + u1) / 2, W((u0 + u1) / 2) * (o0 + o1) * 0.55);
      const p2 = at(u1, W1 * o1);
      ctx.moveTo(...p0);
      ctx.quadraticCurveTo(...p1, ...p2);
      ctx.stroke();
    }
    shineBand(ctx);
  }, lw, tipEnd);
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
    // the fringe's soft shadow on her forehead, in her skin's own shade: a copy of its locks a little
    // lower, filled once (so where they overlap it never doubles), moving with them
    ctx.beginPath();
    for (const L of fringeLocks(tx, R.fr)) L.pts.forEach((p, i) => (i ? ctx.lineTo(p[0] + 0.35, p[1] + 1.25) : ctx.moveTo(p[0] + 0.35, p[1] + 1.25)));
    ctx.fillStyle = tone(a, SKIN[2], 0.75);
    ctx.fill('nonzero');
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
  // her brows, drawn over the fringe's tips (as anime faces do), a little see-through and in a colour
  // close to her hair's shade, so her brows still act when the fringe falls over them
  if (mode === 'fill' && f) {
    ctx.save();
    ctx.globalAlpha *= 0.88;
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.3, -1.55, s, f);
    ctx.restore();
  }
}
export { fringeLocks, sideLocks };
