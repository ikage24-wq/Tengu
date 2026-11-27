// Madame Reveille's head (remade 2026-11-27, drawn from scratch: never the shared face, never the hero's head or hair,
// nothing of another boss's): her face and its moods, her copper-auburn hair and her little rose bonnet with the alarm
// clock's two brass bells on top. In head units about her face's middle (x toward the way she faces, y down; the skull
// about 32 across), each piece drawn in both of the rig's passes (mode 'line': its outline, 'fill': itself), so only
// her outer edge is outlined; her face bare.
//   face   a grown governess's: a neat oval, a small softly pointed chin, warm cheeks.
//   eyes   her own family, "sunrise eyes": a high round dome along the top and a flatter, gently curved lower edge, like
//          the sun coming up over the horizon; a sunrise in each iris (gold low down, through coral and rose to a dusk
//          plum at the top), a round pupil in a soft dawn halo, her signature glint a little round sun with short
//          rounded rays up at the back and a round light low at the front. The upper lash a neat line, thin at the
//          inner corner, thickening to a short upswept wing with two round little flicks. The whole iris always clear
//          while she's awake; only blinks, closed moods and sleep cover it.
//   brows  long, high, prim arches, round at both ends: they do her acting (up in disapproval, knitted ringing).
//   mouth  small and prim at rest, a touch pursed (never a stuck smile); a "tut" pucker to one side, a sweet
//          governess smile, the huge RIIING of a shout, a yawn she won't admit to, vowels when she talks.
//   hair   copper-auburn: an even blunt fringe of four sections cut just above her lashes (her brows peek under it), a
//          deeper layer in its splits, its soft shadow on her forehead; neat chin-length side locks outside her eyes
//          whose ends curl under; the rest a long fall behind her, down her back, its end rolled under in one big soft
//          curl. One light from above, one peach shine band.
//   bonnet a small rose pillbox bonnet set back on her crown, a cream frill round it and a gold band, the alarm
//          clock's two brass bells on top and their striker between them, chattering when she rings (a.rvRing); a
//          little clock dial on its side that keeps time; two rose ribbons from its back.
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear, clamp } from './fx.js';
import { SKIN, SKIN_INK, HAIR, HAIR_SHADE, HAIR_SHINE, LASH, BROW, IRIS, RING, PUPIL, LIP, BLUSH, ROSE, CREAM, GOLD, DIAL } from './palette.js';

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
// lid (0 open .. 1 shut: closed moods only), shut, bt (brow knit: + cross, - worried), by (raise), bo (one brow
// cocked: the outer one up), mw/ms/mo (the mouth's width, smile, open), ro (a round "o"), purse (a prim pucker drawn
// to one side), wide (teeth), wob, bl (blush), sm (small irises), sp (sparkly).
const F0 = { lid: 0, hv: 0, shut: 'happy', bt: 0.05, by: 0.35, bo: 0, mw: 0.62, ms: 0.04, mo: 0, ro: 0, purse: 0.25, wide: 0, wob: 0, bl: 0.4, sm: 0, sp: 0 };
const fc = (o) => ({ ...F0, ...o });
export const FACES = {
  // prim: her resting face, brows up, a small composed mouth
  prim: fc({}),
  // brisk: in a fight, chin up, a firm level mouth
  brisk: fc({ bt: 0.45, by: 0.2, mw: 0.7, ms: -0.05, purse: 0, bl: 0.45 }),
  // pleased: a neat satisfied smile, one brow cocked
  pleased: fc({ bt: -0.05, by: 0.45, bo: 0.6, mw: 0.85, ms: 0.6, purse: 0, bl: 0.6 }),
  // tut: eyes shut, brows up, the pucker drawn to one side
  tut: fc({ lid: 1, shut: 'calm', bt: -0.1, by: 0.9, mw: 0.55, purse: 1, bl: 0.45 }),
  // sweet: the governess's sweet smile, eyes shut in happy arcs (it means trouble)
  sweet: fc({ lid: 1, shut: 'happy', bt: -0.15, by: 0.55, mw: 0.95, ms: 0.95, purse: 0, bl: 0.75 }),
  // shout: RIIIING! the mouth wide open, brows knitted
  shout: fc({ bt: 0.95, by: 0.1, mw: 1.15, ms: -0.1, mo: 1, wide: 1, purse: 0, bl: 0.85 }),
  // cross: brows knitted down, a frown
  cross: fc({ bt: 1, by: -0.1, mw: 0.8, ms: -0.45, mo: 0.2, purse: 0, bl: 0.7 }),
  // focus: casting, brows set, the mouth a line
  focus: fc({ bt: 0.55, by: 0.05, mw: 0.6, ms: -0.05, purse: 0.1, sm: 0.12, bl: 0.4 }),
  // alarmed: shock, brows high, small irises, an "o"
  alarmed: fc({ bt: -0.5, by: 1.2, mw: 0.6, ro: 1, purse: 0, sm: 0.9, bl: 0.55 }),
  // proud: the rooster's pride, eyes shut, chin up, a lofty smile
  proud: fc({ lid: 1, shut: 'calm', bt: -0.2, by: 0.8, bo: 0.4, mw: 0.85, ms: 0.55, purse: 0, bl: 0.55 }),
  // count: watching her pocket watch, eyes down, mouth moving on the seconds
  count: fc({ bt: 0.2, by: 0.25, mw: 0.5, mo: 0.18, purse: 0, bl: 0.4 }),
  // worried: brows up at the inner ends
  worried: fc({ bt: -0.85, by: 0.4, mw: 0.62, ms: -0.3, wob: 0.6, purse: 0, bl: 0.55 }),
  // frazzled: low on health, ruffled and hot, a wobbly mouth
  frazzled: fc({ bt: -0.7, by: 0.6, mw: 0.85, ms: -0.25, mo: 0.35, wob: 0.9, purse: 0, bl: 1.2 }),
  // drowsy: wound down, lids heavy (never at rest: only when she's spent)
  drowsy: fc({ lid: 0, hv: 1, shut: 'calm', bt: -0.35, by: -0.15, mw: 0.55, ms: 0, mo: 0.08, purse: 0, bl: 0.5, sm: 0.15 }),
  // yawn: she would never. (she does)
  yawn: fc({ lid: 1, shut: 'squeeze', bt: -0.4, by: 0.6, mw: 0.9, ro: 1.3, purse: 0, bl: 0.6 }),
  // asleep: wound down, snoozing on her feet
  asleep: fc({ lid: 1, shut: 'calm', bt: -0.25, by: -0.1, mw: 0.5, ms: 0.15, ro: 0.3, purse: 0, bl: 0.7 }),
  hurt: fc({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.85, ms: -0.4, mo: 0.55, purse: 0, bl: 0.7 }),
  dizzy: fc({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.7, ms: -0.2, mo: 0.4, purse: 0, bl: 0.5 }),
  talk: fc({ bt: 0.15, by: 0.45, mw: 0.85, ms: 0.15, mo: 0.4, purse: 0, bl: 0.5 }),
  // beam: wide awake delight (a rare one: dawn breaking)
  beam: fc({ bt: -0.25, by: 0.75, mw: 1.05, ms: 1, mo: 0.45, wide: 0.8, purse: 0, bl: 0.95, sp: 0.8 }),
};
export const SHUTS = ['happy', 'calm', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'hv', 'bt', 'by', 'bo', 'mw', 'ms', 'mo', 'ro', 'purse', 'wide', 'wob', 'bl', 'sm', 'sp'];
export const VOWELS = [[0.55, 0.15, 0.6], [1, 0.4, 0.45], [0.85, 0.45, 0.2], [0.65, 0.15, 0], [0.5, 0.1, 0.5]];

// (the eyes' place: the same size, level; `y` is the eye's horizon, its lower edge)
export const EYE = { y: 6.0, dx: 6.4, w: 4.0, h: 5.1, hb: 1.45, lift: 0.22 };

// The sunrise eye: a high round dome over a flatter, gently curved lower edge.
function eyeOutline(x, y, side) {
  const pts = [];
  for (let i = 0; i < 28; i++) {
    const an = (i / 28) * TAU;
    const px = Math.cos(an) * EYE.w;
    const sn = Math.sin(an);
    const py = sn < 0 ? sn * EYE.h : sn * EYE.hb;
    pts.push([x + px, y + py - ((px * side) / EYE.w) * EYE.lift]);
  }
  return pts;
}
// her glint: a little round sun with short rounded rays
function sunGlint(ctx, x, y, r, al) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = '#ffffff';
  ell(ctx, x, y, r, r);
  ctx.fill();
  pen(ctx, 'rgba(255,255,255,0.95)', r * 0.42);
  for (let k = 0; k < 6; k++) {
    const an = (k / 6) * TAU + 0.26;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(an) * r * 1.45, y + Math.sin(an) * r * 1.45);
    ctx.lineTo(x + Math.cos(an) * r * 1.95, y + Math.sin(an) * r * 1.95);
    ctx.stroke();
  }
  ctx.restore();
}
function eye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  // (she blinks briskly, on her own rhythm)
  const blink = shutK < 0.5 ? win((t + (a.rvUid ?? 0) * 1.3) % 4.7, 4.1, 4.2, 4.28, 4.42) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  // (heavy lids for the drowsy mood: the lid lowered over the dome, the lash riding it)
  const heavy = (f.hv ?? 0) * 0.55;
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
      pen(ctx, tone(a, LASH), 0.95);
      if (s === 'happy' || s === 'calm') {
        const up = s === 'happy' ? -1 : 1;
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const u = i / 10;
          const px = x - w + u * w * 2;
          const py = y - 1.2 + up * Math.sin(Math.PI * u) * (s === 'happy' ? 2.2 : 1.0);
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
        // (her wing at the outer corner, and a little curl)
        pen(ctx, tone(a, LASH), 0.65);
        const ex = x + side * w;
        ctx.beginPath();
        ctx.moveTo(ex - side * 0.2, y - 1.1);
        ctx.quadraticCurveTo(ex + side * 0.9, y - 1.4, ex + side * 1.3, y - 2.3);
        ctx.stroke();
      } else if (s === 'squeeze') {
        ctx.beginPath();
        ctx.moveTo(x + side * w * 0.95, y - 3.2);
        ctx.lineTo(x - side * w * 0.6, y - 1.1);
        ctx.lineTo(x + side * w * 0.95, y + 0.9);
        ctx.stroke();
      } else {
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 1.6 + t * 4 * side;
          const r = 0.4 + (i / 26) * 2.8;
          const px = x + Math.cos(an) * r;
          const py = y - 1.2 + Math.sin(an) * r * 0.9;
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
  // (the lash's soft shadow along the top of the white)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h + 1.8);
  sg.addColorStop(0, 'rgba(150,90,90,0.32)');
  sg.addColorStop(1, 'rgba(150,90,90,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w - 1, y - h - 1, w * 2 + 2, 3.4);
  const lx = clamp(look?.[0] ?? 0.3, -1, 1) * 0.75;
  const ly = clamp(look?.[1] ?? 0, -1, 1) * 0.55;
  const ir = 2.95 * (1 - 0.32 * f.sm);
  const ix = x + lx;
  const iy = y - 1.6 + ly;
  // a sunrise: dusk plum at the top, rose, coral, gold low down
  const ig = ctx.createLinearGradient(0, iy - ir, 0, iy + ir);
  ig.addColorStop(0, tone(a, IRIS[3]));
  ig.addColorStop(0.38, tone(a, IRIS[2]));
  ig.addColorStop(0.7, tone(a, IRIS[1]));
  ig.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir * 0.95, ir);
  ctx.fillStyle = ig;
  ctx.fill();
  pen(ctx, tone(a, RING), 0.36);
  ctx.stroke();
  // (a soft gold glow rising from the bottom of the iris, the sun coming up)
  glow(ctx, ix, iy + ir * 0.9, ir * 0.9, IRIS[0], 0.55);
  // the pupil in a soft dawn halo
  pen(ctx, 'rgba(255,214,170,0.55)', 0.28);
  ell(ctx, ix, iy + 0.05, ir * 0.6, ir * 0.62);
  ctx.stroke();
  ell(ctx, ix, iy + 0.05, ir * 0.33, ir * 0.35);
  ctx.fillStyle = tone(a, PUPIL);
  ctx.fill();
  // her glint: a little round sun up at the back, a round light low at the front
  sunGlint(ctx, ix - 1.0, iy - ir * 0.44, 0.62 * (1 - 0.3 * f.sm), 1);
  if (f.sp > 0.3) sunGlint(ctx, ix + 1.2, iy - ir * 0.62, 0.3 * f.sp, 0.9);
  ell(ctx, ix + 1.15, iy + ir * 0.48, 0.42, 0.32);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  // (drowsy: the lid lowered over the dome, in her skin's shade)
  if (heavy > 0.01) {
    const ly0 = y - h + heavy * h * 1.15;
    ctx.fillStyle = tone(a, SKIN[2]);
    ctx.fillRect(x - w - 1, y - h - 1, w * 2 + 2, ly0 - (y - h - 1));
  }
  ctx.restore();
  // the lash: a neat line along the dome, thin at the inner corner, thickening to the outer; a short upswept wing
  // and two little round flicks
  ctx.lineCap = 'round';
  const lidDrop = heavy * h * 1.15;
  const top = (u) => {
    const an = Math.PI + (side > 0 ? u : 1 - u) * Math.PI;
    const px = Math.cos(an) * w * 1.04;
    const dome = Math.sin(an) * h * 1.0 - 0.1;
    return [x + px, y + Math.max(dome, dome + lidDrop * Math.sin(Math.PI * u) * 0.95 + lidDrop * 0.1) - ((px * side) / w) * EYE.lift];
  };
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const p = top(i / 14);
    if (i) ctx.lineTo(p[0], p[1] - (i / 14) * 0.15);
    else ctx.moveTo(p[0], p[1]);
  }
  for (let i = 14; i >= 0; i--) {
    const p = top(i / 14);
    ctx.lineTo(p[0], p[1] + 0.18 + (i / 14) * 0.75);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  const e = top(1);
  // (the wing: one soft tapered sweep up from the lash's outer end, grown from it, a round tip)
  ctx.beginPath();
  ctx.moveTo(e[0] - side * 0.9, e[1] + 0.95);
  ctx.quadraticCurveTo(e[0] + side * 0.35, e[1] + 0.55, e[0] + side * 0.95, e[1] - 0.75);
  ctx.quadraticCurveTo(e[0] + side * 1.08, e[1] - 1.02, e[0] + side * 0.82, e[1] - 0.98);
  ctx.quadraticCurveTo(e[0] + side * 0.2, e[1] - 0.2, e[0] - side * 0.6, e[1] - 0.05);
  ctx.closePath();
  ctx.fill();
  // (two round little flicks off the top of the dome's outer half, leaning outward)
  pen(ctx, tone(a, LASH), 0.42);
  for (const [u, l] of [[0.66, 0.85], [0.8, 0.95]]) {
    const p = top(u);
    ctx.beginPath();
    ctx.moveTo(p[0], p[1]);
    ctx.quadraticCurveTo(p[0] + side * 0.25, p[1] - l * 0.6, p[0] + side * l * 0.7, p[1] - l);
    ctx.stroke();
  }
  // (a soft warm shade along the lower edge: no drawn lower lid)
  pen(ctx, 'rgba(214,140,130,0.38)', 0.45);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.6, y + EYE.hb * 0.95 + 0.4);
  ctx.quadraticCurveTo(x, y + EYE.hb * 1.15 + 0.4, x + w * 0.6, y + EYE.hb * 0.9 + 0.4);
  ctx.stroke();
  ctx.restore();
}

// Her brows: long, high, prim arches with round ends; `bo` cocks the outer one.
function brow(ctx, a, x, y, side, f) {
  const cock = side > 0 ? f.bo : 0;
  const yi = y - f.by * 0.75 + f.bt * 1.0;
  const yp = y - f.by * 0.9 - 0.9 - f.bt * 0.15 - cock * 0.9;
  const yo = y - f.by * 0.6 - f.bt * 0.4 + 0.5 - cock * 0.6;
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROW), 1.05);
  ctx.beginPath();
  ctx.moveTo(x - side * 1.9, yi);
  ctx.quadraticCurveTo(x + side * 0.2, yp - 0.4, x + side * 2.3, yo);
  ctx.stroke();
  ctx.restore();
}

function mouth(ctx, a, x, y, f) {
  const w = 2.2 * f.mw;
  const cy = y - f.ms * 0.8;
  if (f.ro > 0.3) {
    const k = f.ro;
    ell(ctx, x, y + 0.8, 1.3 * k + 0.3, 1.75 * k + 0.3);
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + 0.6 + 1.1 * k, 0.8 * k, 0.55 * k);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP.sh), 0.4);
    ell(ctx, x, y + 0.8, 1.3 * k + 0.3, 1.75 * k + 0.3);
    ctx.stroke();
    return;
  }
  if (f.mo > 0.08) {
    const o = f.mo;
    // (a wide open RIIING: rounder at the bottom, a little squarer at the corners)
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.5 - o * 0.5, x + w, cy);
    ctx.quadraticCurveTo(x + w * 0.9, y + f.ms * 1.0 + o * 3.6, x, y + f.ms * 1.2 + o * 4.6);
    ctx.quadraticCurveTo(x - w * 0.9, y + f.ms * 1.0 + o * 3.6, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (f.wide > 0.3) {
      ctx.fillStyle = tone(a, LIP.teeth);
      ctx.fillRect(x - w, cy - 2, w * 2, 0.9 + f.wide * 0.7);
    }
    ell(ctx, x, y + f.ms * 1.1 + o * 3.8, w * 0.6, o * 1.4);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP.sh), 0.35);
    ctx.stroke();
    return;
  }
  ctx.save();
  ctx.lineCap = 'round';
  // the prim pucker: a small rounded bow drawn toward one corner
  const pk = f.purse;
  const ox = pk * 0.7;
  if (pk > 0.6) {
    ell(ctx, x + ox, y + 0.3, 0.75, 0.62);
    ctx.fillStyle = tone(a, LIP.base);
    ctx.fill();
    pen(ctx, tone(a, LIP.sh), 0.45);
    ctx.beginPath();
    ctx.moveTo(x + ox - 0.5, y + 0.3);
    ctx.lineTo(x + ox + 0.5, y + 0.3);
    ctx.stroke();
    ctx.restore();
    return;
  }
  pen(ctx, tone(a, LIP.sh), 0.55);
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const px = x - w * (1 - pk * 0.35) + u * w * 2 * (1 - pk * 0.35) + ox * 0.5;
    // (her prim little dip in the middle when she purses, a smile lifting the corners)
    const dip = pk * 0.35 * Math.exp(-((u - 0.5) ** 2) / 0.01);
    const py = cy + Math.sin(Math.PI * u) * f.ms * 0.7 + Math.sin(u * Math.PI * 4) * f.wob * 0.4 - dip;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x + ox * 0.5, y + 1.2, 1.5, LIP.base, 0.28 + pk * 0.12);
}

// Her face: a neat oval, a small softly pointed chin.
export function skullPts(tx) {
  return chaikin([[0, -17.6], [11.6, -14], [15.6, -5], [16.2, 3.4], [14.4, 9.8], [9.2, 15], [3.8 + tx * 0.25, 17.9], [0.7 + tx * 0.25, 18.5], [-4.6 + tx * 0.15, 16.9], [-11.8, 11.8], [-15.8, 4.2], [-15.8, -5], [-11.8, -14]], 3);
}

// ---------- Her hair ----------
const HY0 = -26;
const HY1 = 64;
// (one light for all of it, top to bottom, so it reads as one head of hair)
function hairFill(ctx, a) {
  const g = ctx.createLinearGradient(0, HY0, 0, HY1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(0.18, tone(a, HAIR.base));
  g.addColorStop(0.55, tone(a, HAIR.sh));
  g.addColorStop(1, tone(a, HAIR.deep));
  return g;
}
function shineBand(ctx, y = -9.8) {
  const g = ctx.createLinearGradient(0, y - 2.2, 0, y + 2.2);
  g.addColorStop(0, HAIR_SHINE[0]);
  g.addColorStop(0.5, HAIR_SHINE[1]);
  g.addColorStop(1, HAIR_SHINE[0]);
  ctx.fillStyle = g;
  ctx.fillRect(-60, y - 2.2, 120, 4.4);
  pen(ctx, 'rgba(255,248,236,0.85)', 0.3);
  for (const [x, l] of [[-11.6, 1.8], [-4.8, 2.4], [2.4, 1.5], [8.6, 2.1]]) {
    const yy = y - 0.3 + 0.004 * x * x;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + l / 2, yy - 0.4, x + l, yy + 0.1);
    ctx.stroke();
  }
}
const SHADE = HAIR_SHADE;
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
// The fringe: an even blunt cut just above her lashes, gently curved with her forehead.
const CUT = { y: -2.0, rise: 0.7, half: 14.6 };
export const cutY = (x, cx) => CUT.y + CUT.rise * Math.min(1, ((x - cx) / CUT.half) ** 2);
// (each split: where across, how deep, how wide: neighbours differ)
const SPLITS = [[0.21, 2.4, 0.9], [0.47, 3.4, 1.15], [0.76, 2.7, 0.95]];
function fringeGeom(tx, sw) {
  const cx = 0.7 + tx * 0.6;
  const x0 = cx - CUT.half - 1.2;
  const x1 = cx + CUT.half + 1.0;
  const W = x1 - x0;
  const topY = (x) => -17.2 + 0.02 * (x - cx) ** 2;
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
      pts.push([x + dx * (1 - Math.abs(k / n - 0.5) * 2) * 0.3 + dx * 0.4, cutY(x, cx) + 0.5 * Math.sin(Math.PI * (k / n))]);
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
  G.secs.forEach((s, i) => {
    hairShape(ctx, a, mode, s.pts, () => {
      const cy = cutY(s.mid, G.cx);
      const g = ctx.createLinearGradient(0, cy - 4.6, 0, cy + 0.6);
      g.addColorStop(0, SHADE(0));
      g.addColorStop(1, SHADE(0.36));
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -26, s.R - s.L + 4, 28);
      // (one fine strand line down each wide section, fading before the cut)
      if (s.R - s.L > 8) {
        pen(ctx, SHADE(0.2), 0.42);
        ctx.beginPath();
        ctx.moveTo(s.mid + 0.6, -12.5);
        ctx.quadraticCurveTo(s.mid + 0.9, -8, s.mid + 0.7, cutY(s.mid, G.cx) - 1.4);
        ctx.stroke();
      }
      shineBand(ctx);
    }, lw);
  });
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
// A neat chin-length side lock outside her eye, its end curled under toward her jaw.
function sideLockPts(side, tx, sway) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 12.2 : -11.8;
  const outX = side > 0 ? 17.8 : -17.8;
  const sx = (v) => v + shift;
  const s = sway * 2.2;
  return {
    pts: chaikin([
      [sx(outX - side * 0.4), -10], [sx(inX - side * 1.4), -9.6], [sx(inX), -2.4], [sx(inX + side * 0.2) + s * 0.2, 6],
      [sx(inX + side * 0.1) + s * 0.45, 12.4],
      // (the curl under: in toward the jaw and round)
      [sx(inX - side * 0.6) + s * 0.6, 15.6], [sx(inX + side * 0.6) + s * 0.7, 17.8], [sx((inX + outX) / 2 + side * 0.6) + s * 0.8, 18.2],
      [sx(outX - side * 0.1) + s * 0.6, 15.4], [sx(outX + side * 0.3) + s * 0.4, 9],
      [sx(outX + side * 0.3) + s * 0.15, 2], [sx(outX + side * 0.2), -4],
    ], 3),
    inX: sx(inX),
    outX: sx(outX),
    curl: [sx((inX + outX) / 2) + s * 0.7, 15.8],
  };
}
function sideLock(ctx, a, mode, side, tx, sway, lw) {
  const P = sideLockPts(side, tx, sway);
  hairShape(ctx, a, mode, P.pts, () => {
    const g = ctx.createLinearGradient(0, -10, 0, -4);
    g.addColorStop(0, SHADE(0.42));
    g.addColorStop(1, SHADE(0));
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(P.outX, P.inX) - 4, -11, 14, 7);
    // (the curl's underside in shade, a soft line showing it turn under)
    glow(ctx, P.curl[0], P.curl[1] + 1.4, 3.4, HAIR.deep, 0.5);
    pen(ctx, SHADE(0.28), 0.42);
    ctx.beginPath();
    ctx.moveTo(P.curl[0] - side * 2.2, P.curl[1] - 1.2);
    ctx.quadraticCurveTo(P.curl[0], P.curl[1] - 2.4, P.curl[0] + side * 2.4, P.curl[1] - 0.6);
    ctx.stroke();
    shineBand(ctx);
  }, lw);
}
// Behind her: the long fall of her hair, down her back, its end rolled under in one big soft curl; it swings.
function backHair(ctx, a, mode, tx, sw, lean, lw, sit = 0) {
  const s = sw ?? 0;
  const L = 44 * (1 - 0.35 * (sit ?? 0));
  const top = -9;
  const at = (u, off) => {
    const x0 = -7.6 - u * 5.2 + tx * 0.12 + off + s * 12 * u * u + Math.sin(u * Math.PI) * 1.0;
    const y0 = top + u * L;
    const r = -lean * sstep(u * 1.6);
    const cx = -4;
    const cy = top;
    return [cx + (x0 - cx) * Math.cos(r) - (y0 - cy) * Math.sin(r), cy + (x0 - cx) * Math.sin(r) + (y0 - cy) * Math.cos(r)];
  };
  const W = (u) => 16 + Math.sin(u * Math.PI * 0.9) * 2.4 + u * 1.6;
  const back = [];
  const front = [];
  for (let i = 0; i <= 10; i++) {
    const u = i / 10;
    back.push(at(u, -W(u) * 0.55));
    front.push(at(u, W(u) * 0.45));
  }
  // the roll at the end: a fat round curl turning under
  const rc = at(1, -0.4);
  const rr = 6.4;
  const roll = Array.from({ length: 13 }, (_, k) => {
    const an = (k / 12) * Math.PI;
    return [rc[0] + Math.cos(an) * (W(1) * 0.52), rc[1] + Math.sin(an) * rr];
  });
  const pts = chaikin([[-17.4, -9], [-12, -16], [4, -16], [13, -9], ...front, ...roll, ...back.reverse()], 3);
  hairShape(ctx, a, mode, pts, () => {
    const mid = at(0.55, 0);
    glow(ctx, mid[0], mid[1], 13, HAIR.deep, 0.32);
    pen(ctx, SHADE(0.22), 0.7);
    for (const off of [-4.2, 1.2, 5.4]) {
      const p0 = at(0.14, off);
      const p1 = at(0.55, off * 1.1);
      const p2 = at(0.9, off * 0.8);
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.quadraticCurveTo(...p1, ...p2);
      ctx.stroke();
    }
    // (the roll: its turn shown by a soft shade line and its underside dark)
    glow(ctx, rc[0], rc[1] + rr * 0.8, rr * 1.1, HAIR.deep, 0.6);
    pen(ctx, SHADE(0.3), 0.6);
    ctx.beginPath();
    ctx.ellipse(rc[0], rc[1] + 0.6, W(1) * 0.36, rr * 0.5, 0, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    shineBand(ctx);
  }, lw);
}
// The bonnet's two rose ribbons, from its back, behind her head, each on its own spring.
function ribbons(ctx, a, mode, tx, rb, lw) {
  const bx = -9.6 + tx * 0.3;
  const by = -14.6;
  for (const [i, len, rot0] of [[0, 15, 0.36], [1, 12, 0.12]]) {
    const sw = rb?.[i] ?? 0;
    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(rot0 + sw);
    const pts = chaikin([[-1.3, 0], [1.3, 0], [1.6 + sw * 2, len * 0.5], [1.9, len], [0.2, len - 1.6], [-1.4, len + 0.4], [-1.2 + sw * 2, len * 0.5]], 2);
    poly(ctx, pts);
    if (mode === 'line') {
      pen(ctx, tone(a, ROSE.ink), lw);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, i ? ROSE.sh : ROSE.base);
      ctx.fill();
      ctx.save();
      poly(ctx, pts);
      ctx.clip();
      glow(ctx, -0.4, len * 0.3, 2.4, ROSE.lt, 0.5);
      ctx.restore();
    }
    ctx.restore();
  }
}
// The bonnet: a small rose pillbox set back on her crown, a cream frill and a gold band, a little clock dial on its
// side; the alarm clock's two brass bells on top, the striker between them.
const BON = { x: -2.6, y: -18.2, rx: 10.6, ry: 4.4, h: 5.4 };
export const bonnetAt = (tx) => [BON.x + tx * 0.35, BON.y];
function bell(ctx, a, mode, x, y, rot, r, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // a brass dome with a rolled lip, a little knob on top
  ctx.beginPath();
  ctx.moveTo(-r, 0.2);
  ctx.bezierCurveTo(-r, -r * 1.25, r, -r * 1.25, r, 0.2);
  ctx.quadraticCurveTo(r * 1.08, r * 0.3, r * 0.9, r * 0.38);
  ctx.lineTo(-r * 0.9, r * 0.38);
  ctx.quadraticCurveTo(-r * 1.08, r * 0.3, -r, 0.2);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, tone(a, GOLD.ink), lw);
    ctx.stroke();
    ell(ctx, 0, -r * 0.98, r * 0.28, r * 0.24);
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(-r, 0, r, 0);
    g.addColorStop(0, tone(a, GOLD.sh));
    g.addColorStop(0.35, tone(a, GOLD.lt));
    g.addColorStop(0.6, tone(a, GOLD.base));
    g.addColorStop(1, tone(a, GOLD.deep));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.fillStyle = tone(a, GOLD.sh);
    ctx.fillRect(-r, r * 0.08, r * 2, r * 0.3);
    ell(ctx, -r * 0.4, -r * 0.55, r * 0.24, r * 0.16, -0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();
    ell(ctx, 0, -r * 0.98, r * 0.28, r * 0.24);
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
  }
  ctx.restore();
}
function bonnet(ctx, a, mode, tx, ring, hammer, lw) {
  const [bx, by] = bonnetAt(tx);
  const t = a.t ?? 0;
  const { rx, ry, h } = BON;
  // (the bells on top, ringing: each shivers on its own, the striker chattering between them)
  const shiver = ring > 0.02 ? ring : 0;
  const rL = -0.62 + Math.sin(t * 46) * 0.12 * shiver;
  const rR = 0.62 + Math.sin(t * 46 + 1.7) * 0.12 * shiver;
  const bl = [bx - 6.4, by - h - 6.0];
  const br = [bx + 6.4, by - h - 6.0];
  // (each bell on a short brass post from the bonnet's top, like the clock's)
  for (const [px, py] of [bl, br]) {
    ctx.beginPath();
    ctx.moveTo(px - 0.6 + (px < bx ? 1 : -1) * 0.6, py + 1.6);
    ctx.lineTo(px + 0.6 + (px < bx ? 1 : -1) * 0.6, py + 1.6);
    ctx.lineTo(px + 0.8 + (px < bx ? 1 : -1) * 1.6, by - h + 0.6);
    ctx.lineTo(px - 0.8 + (px < bx ? 1 : -1) * 1.6, by - h + 0.6);
    ctx.closePath();
    if (mode === 'line') {
      pen(ctx, tone(a, GOLD.ink), lw);
      ctx.stroke();
    } else {
      ctx.fillStyle = tone(a, GOLD.sh);
      ctx.fill();
    }
  }
  // the striker's post and its little hammer, behind the bells
  const hm = hammer ?? 0;
  ctx.save();
  ctx.translate(bx, by - h + 0.4);
  ctx.rotate(hm);
  ctx.beginPath();
  ctx.roundRect(-0.5, -7.6, 1.0, 7.6, 0.5);
  if (mode === 'line') {
    pen(ctx, tone(a, GOLD.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, GOLD.sh);
    ctx.fill();
  }
  ell(ctx, 0, -8.2, 1.4, 1.2);
  if (mode === 'line') ctx.stroke();
  else {
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
    ell(ctx, -0.4, -8.6, 0.4, 0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  }
  ctx.restore();
  bell(ctx, a, mode, bl[0], bl[1], rL, 5.0, lw);
  bell(ctx, a, mode, br[0], br[1], rR, 5.0, lw);
  // the pillbox: a rose drum with a soft domed top
  const drum = chaikin([[bx - rx, by], [bx - rx + 0.4, by - h], [bx - rx * 0.5, by - h - ry * 0.55], [bx + rx * 0.5, by - h - ry * 0.55], [bx + rx - 0.4, by - h], [bx + rx, by], [bx + rx * 0.5, by + ry * 0.7], [bx - rx * 0.5, by + ry * 0.7]], 2);
  poly(ctx, drum);
  if (mode === 'line') {
    pen(ctx, tone(a, ROSE.ink), lw);
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(0, by - h - ry, 0, by + ry);
    g.addColorStop(0, tone(a, ROSE.lt));
    g.addColorStop(0.45, tone(a, ROSE.base));
    g.addColorStop(1, tone(a, ROSE.sh));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, drum);
    ctx.clip();
    // its gold band
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.beginPath();
    ctx.ellipse(bx, by - 1.2, rx + 1, ry * 0.75, 0, 0.05, Math.PI - 0.05);
    ctx.ellipse(bx, by - 2.6, rx + 1, ry * 0.75, 0, Math.PI - 0.05, 0.05, true);
    ctx.fill();
    glow(ctx, bx - rx * 0.35, by - h - 0.8, 4, '#ffffff', 0.35);
    ctx.restore();
  }
  // the little dial on its side, keeping time (the minute hand steps each second)
  const dx = bx + rx * 0.52;
  const dy = by - h * 0.5 + 0.2;
  ell(ctx, dx, dy, 2.1, 2.1);
  if (mode === 'line') {
    pen(ctx, tone(a, GOLD.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, GOLD.base);
    ctx.fill();
    ell(ctx, dx, dy, 1.55, 1.55);
    ctx.fillStyle = tone(a, DIAL.base);
    ctx.fill();
    pen(ctx, tone(a, DIAL.tick), 0.22);
    for (let k = 0; k < 4; k++) {
      const an = (k / 4) * TAU;
      ctx.beginPath();
      ctx.moveTo(dx + Math.cos(an) * 1.1, dy + Math.sin(an) * 1.1);
      ctx.lineTo(dx + Math.cos(an) * 1.4, dy + Math.sin(an) * 1.4);
      ctx.stroke();
    }
    const sec = Math.floor(t);
    pen(ctx, tone(a, DIAL.hand), 0.3);
    ctx.beginPath();
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + Math.sin(sec * 0.105) * 1.2, dy - Math.cos(sec * 0.105) * 1.2);
    ctx.moveTo(dx, dy);
    ctx.lineTo(dx + Math.sin(sec * 0.0087 + 1.2) * 0.8, dy - Math.cos(sec * 0.0087 + 1.2) * 0.8);
    ctx.stroke();
  }
  // a neat cream rim round its foot: one smooth soft roll
  const rim = chaikin([[bx - rx - 1.0, by - 0.6], [bx - rx * 0.4, by + ry * 0.55], [bx + rx * 0.4, by + ry * 0.55], [bx + rx + 1.0, by - 0.6], [bx + rx + 0.6, by + 1.4], [bx + rx * 0.4, by + ry * 0.55 + 2.0], [bx - rx * 0.4, by + ry * 0.55 + 2.0], [bx - rx - 0.6, by + 1.4]], 2);
  poly(ctx, rim);
  if (mode === 'line') {
    pen(ctx, tone(a, CREAM.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, CREAM.base);
    ctx.fill();
    ctx.save();
    poly(ctx, rim);
    ctx.clip();
    glow(ctx, bx, by + ry + 2, rx, CREAM.sh, 0.8);
    ctx.restore();
  }
}

// ---------- The whole head ----------
// q: { turn, look }; f: the eased mood; R: { fr, slN, slF, back, lean, sit, rib, hammer }.
export function drawHead(ctx, a, mode, part, q, f, R, lw) {
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  if (part === 'back') {
    backHair(ctx, a, mode, tx, R.back ?? 0, R.lean ?? 0, lw, R.sit ?? 0);
    ribbons(ctx, a, mode, tx, R.rib, lw);
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
    glow(ctx, tx * 0.5, 16, 8, SKIN[2], 0.26);
    // (the fringe's soft shadow on her forehead, a copy of its cut a little lower)
    const G = fringeGeom(tx, R.fr);
    ctx.beginPath();
    ctx.moveTo(G.x0, -26);
    ctx.lineTo(G.x1, -26);
    for (let k = 0; k <= 20; k++) {
      const x = G.x1 - (G.x1 - G.x0) * (k / 20);
      ctx.lineTo(x, cutY(x, G.cx) + 1.0);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, SKIN[2], 0.7);
    ctx.fill();
    ctx.restore();
    // warm cheeks
    for (const s of [-1, 1]) {
      const bx = tx + s * 9.2;
      glow(ctx, bx, 11, 4.2, BLUSH[0], 0.34 + 0.3 * f.bl);
      glow(ctx, bx, 11, 2.2, BLUSH[1], 0.16 + 0.3 * f.bl);
    }
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look, f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.2, -0.2, s, f);
    // a small nose: a soft shade and a light
    glow(ctx, tx + 1.5, 9.8, 1.2, SKIN[3], 0.5);
    ell(ctx, tx + 1.1, 9.5, 0.3, 0.22);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 0.9, 13.0, f);
    if (q.sweat) sweat(ctx, tx - 13, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 9 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  hairShape(ctx, a, mode, capPts(tx), () => {
    glow(ctx, -15, 2, 7, HAIR.deep, 0.45);
    shineBand(ctx);
  }, lw);
  bonnet(ctx, a, mode, tx, a.rvRing ?? 0, R.hammer ?? 0, lw);
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0, lw);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0, lw);
  fringe(ctx, a, mode, tx, R.fr, lw);
}
export { fringeGeom };
