// The Night Manager's head (remade 2026-11-27, drawn from scratch: never the shared face, never the hero's
// head or hair, nothing of another boss's): his face and its moods, his round copper glasses, his neat cocoa
// hair and the one curl on his crown that will not lie down. In head units about his face's middle (x toward
// the way he faces, y down; the skull about 16 across), each piece drawn in both of the rig's passes (mode
// 'line': its outline, 'fill': itself), so only his outer edge is outlined; his face bare.
//   face   a young grown-up's: a longer face than a child's, cheeks easing into a soft square jaw and a round
//          chin; a little pale; an ear showing at the back under his hair.
//   eyes   his own family, office-level: wide, softly squared eyes set dead level (an even, attentive
//          look), the upper lash a flat neat line that ends in a short square flick at the outer corner;
//          coffee irises (espresso at the top through to caramel low down), a small round pupil and his
//          signature glint, a little latte-art heart up at the back, with a round light low at the front;
//          under each a faint lavender wash from too many late nights (never a lid, never a line). The whole
//          iris always clear while he's awake.
//   glasses round copper-gold frames, the lenses clear but for a soft glare at their outer rims; they fog
//          up white whenever he sips (a.mgFog).
//   brows  round brows, short and full, cocoa, riding just under his fringe and doing most of his acting.
//   mouth  a polite closed line at rest (never a stuck smile); his customer-service smile, an eager open
//          grin for one more thing, a tight line, a yawn, vowel shapes when he talks.
//   hair   warm cocoa: an even blunt fringe of four sections cut level above his brows, a deeper layer in its
//          splits, its soft shadow on his forehead; a short side lock each side outside his glasses, down to
//          his cheekbones; short and neat at the back to the nape; and on the crown one soft curl like a
//          wisp of coffee steam, on its own spring. One light from above, one caramel shine band.
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, clamp } from './fx.js';
import { SKIN, SKIN_INK, HAIR, LASH, BROW, IRIS, RING, PUPIL, LIP, BLUSH, TIRED, GOLD } from './palette.js';

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

// ---------- His moods (every part eased toward them) ----------
// lid (0 open .. 1 shut: closed moods only), shut (which closed shape), bt (brow tilt: + knit, - worried), by
// (raise), arch (his near brow alone raised: a sceptical look), mw/ms/mo (the mouth's width, smile, open), ro
// (a round "o"), wide (a wide grin, teeth), wob (a wobbly line), bl (blush), sm (small irises: a fright), tr
// (how tired: the lavender under his eyes), lk (the look's pull: eyes on you).
const F0 = { lid: 0, shut: 'calm', bt: 0, by: 0.1, arch: 0, mw: 0.7, ms: 0, mo: 0, ro: 0, wide: 0, wob: 0, bl: 0.3, sm: 0, tr: 0.45 };
const fc = (o) => ({ ...F0, ...o });
export const FACES = {
  desk: fc({}),
  service: fc({ bt: -0.2, by: 0.35, mw: 0.9, ms: 0.7, bl: 0.4 }),
  keen: fc({ bt: -0.3, by: 0.85, mw: 0.95, ms: 0.75, mo: 0.45, bl: 0.5, tr: 0.3 }),
  onemore: fc({ bt: -0.1, by: 1, arch: 0.4, mw: 1, ms: 0.9, mo: 0.3, wide: 1, bl: 0.55, tr: 0.25 }),
  smug: fc({ bt: 0.2, by: 0.3, arch: 1, mw: 0.75, ms: 0.45, bl: 0.35 }),
  stern: fc({ bt: 0.6, by: -0.05, mw: 0.6, ms: -0.15, bl: 0.25 }),
  cross: fc({ bt: 1, by: -0.15, mw: 0.85, ms: -0.4, mo: 0.35, bl: 0.6 }),
  shout: fc({ bt: 0.85, by: 0.2, mw: 1, ms: -0.1, mo: 0.95, bl: 0.7, tr: 0.2 }),
  sip: fc({ lid: 1, shut: 'bliss', bt: -0.3, by: 0.3, mw: 0.45, ms: 0.2, ro: 0.5, bl: 0.45 }),
  bliss: fc({ lid: 1, shut: 'bliss', bt: -0.35, by: 0.45, mw: 0.85, ms: 0.75, bl: 0.6 }),
  tired: fc({ bt: -0.45, by: -0.1, mw: 0.55, ms: -0.1, mo: 0.08, bl: 0.2, tr: 1, sm: 0.25 }),
  yawn: fc({ lid: 1, shut: 'squeeze', bt: -0.4, by: 0.6, mw: 0.9, ro: 1.25, bl: 0.4, tr: 0.9 }),
  sleepy: fc({ lid: 1, shut: 'calm', bt: -0.3, by: -0.1, mw: 0.5, ro: 0.35, bl: 0.35, tr: 0.9 }),
  shock: fc({ bt: -0.5, by: 1.1, mw: 0.6, ro: 1, sm: 0.85, bl: 0.4 }),
  fluster: fc({ bt: -0.75, by: 0.6, mw: 0.8, ms: -0.2, mo: 0.3, wob: 0.9, bl: 1, tr: 0.7 }),
  hurt: fc({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.85, ms: -0.4, mo: 0.55, bl: 0.6 }),
  dizzy: fc({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.7, ms: -0.2, mo: 0.4, bl: 0.4, tr: 0.8 }),
  sad: fc({ bt: -0.95, by: 0.3, mw: 0.6, ms: -0.4, wob: 0.6, bl: 0.35, tr: 0.8 }),
  talk: fc({ bt: -0.05, by: 0.3, mw: 0.8, ms: 0.25, mo: 0.4, bl: 0.35 }),
  happy: fc({ bt: -0.25, by: 0.5, mw: 0.9, ms: 0.85, mo: 0.2, bl: 0.6 }),
  focus: fc({ bt: 0.4, by: 0, mw: 0.55, ms: 0, bl: 0.25 }),
};
export const SHUTS = ['bliss', 'calm', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'bt', 'by', 'arch', 'mw', 'ms', 'mo', 'ro', 'wide', 'wob', 'bl', 'sm', 'tr'];
// (his talking mouth: [width, smile, open], vowel-like shapes)
export const VOWELS = [[0.55, 0.15, 0.6], [0.95, 0.4, 0.45], [0.8, 0.45, 0.2], [0.6, 0.15, 0], [0.5, 0.1, 0.5]];

// (the eyes' place: the same size, dead level)
export const EYE = { y: 4.6, dx: 6.3, w: 3.9, h: 3.5 };

// ---------- One eye ----------
// A softly squared outline: a superellipse, wide and level.
const sq = (u) => Math.sign(u) * Math.pow(Math.abs(u), 0.62);
function eyeOutline(x, y, s = 1) {
  const pts = [];
  for (let i = 0; i < 24; i++) {
    const an = (i / 24) * TAU;
    pts.push([x + sq(Math.cos(an)) * EYE.w * s, y + sq(Math.sin(an)) * EYE.h * s]);
  }
  return pts;
}
function eye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.mgUid ?? 0) * 1.3) % 6.3, 5.6, 5.72, 5.8, 5.96) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  const openW = 1 - closedW;
  // (tired: a faint lavender wash under the eye, never a line)
  glow(ctx, x + side * 0.4, y + h + 1.1, 3.4, TIRED, 0.12 + 0.3 * f.tr);
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    const sh = blink > shutK ? { calm: 1 } : f.shut;
    ctx.lineCap = 'round';
    for (const s of SHUTS) {
      const sw = sh === s ? 1 : typeof sh === 'object' ? sh[s] ?? 0 : 0;
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      pen(ctx, tone(a, LASH), 0.85);
      if (s === 'bliss' || s === 'calm') {
        // bliss (a sip, a smile): a soft arch; calm (a blink, a doze): a level line dipping a touch; both
        // end in his square little flick at the outer corner
        const up = s === 'bliss' ? -1 : 1;
        ctx.beginPath();
        for (let i = 0; i <= 10; i++) {
          const u = i / 10;
          const px = x - w + u * w * 2;
          const py = y + 0.6 + up * Math.sin(Math.PI * u) * (s === 'bliss' ? 1.5 : 0.6);
          if (i) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.stroke();
        const ex = x + side * w;
        pen(ctx, tone(a, LASH), 0.7);
        ctx.beginPath();
        ctx.moveTo(ex - side * 0.3, y + 0.6);
        ctx.lineTo(ex + side * 0.9, y + 0.1 + (s === 'bliss' ? 0.3 : 0.5));
        ctx.stroke();
      } else if (s === 'squeeze') {
        // > < : squeezed shut, pointing in
        ctx.beginPath();
        ctx.moveTo(x + side * w * 0.95, y - 1.6);
        ctx.lineTo(x - side * w * 0.6, y + 0.4);
        ctx.lineTo(x + side * w * 0.95, y + 2.2);
        ctx.stroke();
      } else {
        // dizzy: a soft swirl
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 1.6 + t * 4 * side;
          const r = 0.4 + (i / 26) * 2.6;
          const px = x + Math.cos(an) * r;
          const py = y + 0.4 + Math.sin(an) * r * 0.85;
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
  // the white, softly squared
  const out = eyeOutline(x, y);
  poly(ctx, out);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.save();
  poly(ctx, out);
  ctx.clip();
  // (the lash's soft shadow across the top of the white, never over the iris)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h + 1.6);
  sg.addColorStop(0, 'rgba(120,96,140,0.32)');
  sg.addColorStop(1, 'rgba(120,96,140,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w - 1, y - h - 1, w * 2 + 2, 3);
  // the iris: coffee, espresso at the top to caramel low down, under its lash with room to spare
  const lx = clamp(look?.[0] ?? 0.3, -1, 1) * 0.9;
  const ly = clamp(look?.[1] ?? 0, -1, 1) * 0.55;
  const ir = 2.55 * (1 - 0.32 * f.sm);
  const ix = x + lx;
  const iy = y + 0.25 + ly;
  const ig = ctx.createLinearGradient(0, iy - ir, 0, iy + ir);
  ig.addColorStop(0, tone(a, IRIS[3]));
  ig.addColorStop(0.38, tone(a, IRIS[2]));
  ig.addColorStop(0.75, tone(a, IRIS[1]));
  ig.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, ir * 0.92, ir);
  ctx.fillStyle = ig;
  ctx.fill();
  pen(ctx, tone(a, RING), 0.38);
  ctx.stroke();
  // (fine light lines raying from the pupil, low down)
  pen(ctx, 'rgba(255,226,170,0.45)', 0.22);
  for (let k = 0; k < 5; k++) {
    const an = Math.PI * (0.18 + k * 0.16);
    ctx.beginPath();
    ctx.moveTo(ix + Math.cos(an) * ir * 0.42, iy + Math.sin(an) * ir * 0.42);
    ctx.lineTo(ix + Math.cos(an) * ir * 0.85, iy + Math.sin(an) * ir * 0.85);
    ctx.stroke();
  }
  ell(ctx, ix, iy + 0.05, ir * 0.36, ir * 0.38);
  ctx.fillStyle = tone(a, PUPIL);
  ctx.fill();
  // his glint: a little latte-art heart up at the back, a round light low at the front
  const hx = ix - side * 0 - 0.95;
  const hy = iy - ir * 0.42;
  const hs = 0.62 * (1 - 0.3 * f.sm);
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 1.05);
  ctx.bezierCurveTo(hx - hs * 1.5, hy + hs * 0.1, hx - hs * 0.9, hy - hs * 1.1, hx, hy - hs * 0.35);
  ctx.bezierCurveTo(hx + hs * 0.9, hy - hs * 1.1, hx + hs * 1.5, hy + hs * 0.1, hx, hy + hs * 1.05);
  ctx.fillStyle = '#fff6e6';
  ctx.fill();
  ell(ctx, ix + 0.95, iy + ir * 0.5, 0.36, 0.3);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
  // the lash: a flat neat line along the top, thin at the inner corner, thickening outward, ending in a short
  // square flick (round-cornered) at the outer corner; a soft shade line under the white
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const top = (u) => {
    const px = x - side * w * 1.02 + side * u * w * 2.04;
    return [px, y - h * 0.97 + Math.pow(Math.abs(u * 2 - 1), 3) * h * 0.32];
  };
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const p = top(i / 12);
    if (i) ctx.lineTo(p[0], p[1] - (i / 12) * 0.25);
    else ctx.moveTo(p[0], p[1]);
  }
  for (let i = 12; i >= 0; i--) {
    const p = top(i / 12);
    ctx.lineTo(p[0], p[1] + 0.25 + (i / 12) * 0.75);
  }
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  const e = top(1);
  ctx.beginPath();
  ctx.moveTo(e[0] - side * 0.4, e[1] - 0.1);
  ctx.lineTo(e[0] + side * 0.8, e[1] - 0.7);
  ctx.lineTo(e[0] + side * 1.05, e[1] + 0.2);
  ctx.lineTo(e[0] - side * 0.1, e[1] + 0.9);
  ctx.closePath();
  ctx.fill();
  pen(ctx, tone(a, LASH), 0.4);
  ctx.stroke();
  // (the lower rim: a soft warm shade, not a lid)
  pen(ctx, 'rgba(196,140,140,0.45)', 0.4);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.6, y + h * 0.96);
  ctx.quadraticCurveTo(x, y + h * 1.08, x + w * 0.62, y + h * 0.94);
  ctx.stroke();
  ctx.restore();
}

// ---------- His glasses ----------
// Round copper-gold frames round each eye, a bridge over the nose, the arm running back to his ear; the
// lenses clear but for a soft glare at their outer rims, fogging up white (fog 0..1) when he sips.
export const GLASS = { r: 5.2, y: 4.5 };
function glasses(ctx, a, tx, fog, slip = 0) {
  const t = a.t ?? 0;
  const y = GLASS.y + slip;
  const r = GLASS.r;
  for (const s of [-1, 1]) {
    const x = tx + s * EYE.dx + s * 0.15;
    // (a little bigger on the near side: it's turned toward you)
    const rx = r * (s > 0 ? 1 : 0.93);
    if (fog > 0.01) {
      ell(ctx, x, y, rx, r);
      ctx.fillStyle = `rgba(250,250,255,${0.88 * fog})`;
      ctx.fill();
      // (the fog clears from its edges in, little cleared drops)
      ctx.save();
      ell(ctx, x, y, rx, r);
      ctx.clip();
      for (let k = 0; k < 3; k++) glow(ctx, x - 2.2 + k * 2.2, y + 2 - (k % 2) * 3.4, 1.2, '#ffffff', fog * 0.8);
      ctx.restore();
    }
    // (the soft glare: an arc of light inside the outer rim, high up, never across the iris)
    ctx.save();
    ctx.lineCap = 'round';
    pen(ctx, 'rgba(255,255,255,0.75)', 0.55);
    ctx.beginPath();
    ctx.arc(x, y, rx - 1, -Math.PI * 0.42 + (s > 0 ? 0 : Math.PI * 0.62), -Math.PI * 0.18 + (s > 0 ? 0 : Math.PI * 0.62));
    ctx.stroke();
    ctx.restore();
    ell(ctx, x, y, rx, r);
    pen(ctx, tone(a, GOLD.sh), 0.75);
    ctx.stroke();
    ell(ctx, x, y - 0.25, rx - 0.12, r - 0.12);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x - rx - 1, y - r - 1, rx * 2 + 2, r * 0.9);
    ctx.clip();
    pen(ctx, tone(a, GOLD.lt, 0.8), 0.3);
    ell(ctx, x, y, rx - 0.2, r - 0.2);
    ctx.stroke();
    ctx.restore();
  }
  // the bridge, a soft little arch over his nose, and the arm back to the ear
  pen(ctx, tone(a, GOLD.sh), 0.65);
  ctx.beginPath();
  ctx.moveTo(tx - EYE.dx + GLASS.r * 0.93 - 0.2, y - 1.2);
  ctx.quadraticCurveTo(tx + 0.1, y - 2.7, tx + EYE.dx - GLASS.r + 0.2, y - 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(tx - EYE.dx - GLASS.r * 0.93, y - 1.4);
  ctx.quadraticCurveTo(-14.6, y - 2.2, -15.6 + tx * 0.1, y - 0.6 + Math.sin(t * 0.1) * 0);
  ctx.stroke();
}

// ---------- Brows: round, short and full ----------
function brow(ctx, a, x, y, side, f) {
  const arch = side < 0 ? f.arch : 0;
  const yi = y - f.by * 0.7 + f.bt * 0.95 - arch * 0.3;
  const yo = y - f.by * 0.7 - f.bt * 0.3 - arch * 1.3;
  const xi = x - side * 1.35;
  const xo = x + side * 1.6;
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, BROW), 1.4);
  ctx.beginPath();
  ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo(x, Math.min(yi, yo) - 0.45 - arch * 0.3, xo, yo + 0.1);
  ctx.stroke();
  ctx.restore();
}
// ---------- The mouth ----------
function mouth(ctx, a, x, y, f) {
  const w = 2.3 * f.mw;
  const cy = y - f.ms * 0.7;
  if (f.ro > 0.3) {
    const k = f.ro;
    ell(ctx, x, y + 0.6, 1.05 * k + 0.3, 1.4 * k + 0.3);
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + 0.6 + 1.1 * k, 0.8 * k, 0.55 * k);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP.sh), 0.4);
    ell(ctx, x, y + 0.6, 1.05 * k + 0.3, 1.4 * k + 0.3);
    ctx.stroke();
    return;
  }
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.5 - o * 0.4, x + w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 1.2 + o * 3.4, x - w, cy);
    ctx.closePath();
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (f.wide > 0.3) {
      // (his eager grin: a neat row of top teeth)
      ctx.fillStyle = tone(a, LIP.teeth);
      ctx.fillRect(x - w, cy - 2, w * 2, 0.85 + 2 * f.wide * 0.4);
    }
    ell(ctx, x, y + f.ms * 1 + o * 2.7, w * 0.62, o * 1.1);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    ctx.restore();
    pen(ctx, tone(a, LIP.sh), 0.35);
    ctx.stroke();
    return;
  }
  // closed: one polite line, a touch fuller in the middle, its corners lifting only when he smiles, the near
  // one a little more (his personality: always a little pleased with himself)
  ctx.save();
  ctx.lineCap = 'round';
  pen(ctx, tone(a, LIP.sh), 0.55);
  ctx.beginPath();
  for (let i = 0; i <= 12; i++) {
    const u = i / 12;
    const px = x - w + u * w * 2;
    const py = cy + Math.sin(Math.PI * u) * f.ms * 1.1 - (u > 0.8 ? (u - 0.8) * f.ms * 1.2 : 0) + Math.sin(u * Math.PI * 4) * f.wob * 0.4;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x, y + 1.2, 1.7, LIP.base, 0.28);
}

// His face: longer than a child's, cheeks easing into a soft square jaw and a round chin.
export function skullPts(tx) {
  return chaikin([[0, -18.2], [11.8, -15], [15.9, -6.4], [16.1, 3.6], [15.2, 10.6], [11.4, 15.8], [5.2 + tx * 0.25, 18.4], [-0.6 + tx * 0.25, 18.8], [-6.4 + tx * 0.15, 17.4], [-12.4, 13.4], [-15.8, 5], [-16, -5.6], [-12, -15]], 3);
}
function ear(ctx, a, mode, tx, lw) {
  const x = -15.4 + tx * 0.08;
  ell(ctx, x, 5.6, 2.6, 3.6, -0.15);
  if (mode === 'line') {
    pen(ctx, tone(a, SKIN_INK), lw);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = tone(a, SKIN[1]);
  ctx.fill();
  glow(ctx, x - 0.3, 5.8, 1.6, SKIN[3], 0.55);
}

// ---------- His hair ----------
// One light for all of it, top to nape (the same span for every piece).
const HY0 = -24;
const HY1 = 14;
function hairFill(ctx, a) {
  const g = ctx.createLinearGradient(0, HY0, 0, HY1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(0.22, tone(a, HAIR.base));
  g.addColorStop(0.7, tone(a, HAIR.sh));
  g.addColorStop(1, tone(a, HAIR.deep));
  return g;
}
// The one caramel shine band they all share (clipped into each piece, so it lines up across them).
function shineBand(ctx, y = -11) {
  const g = ctx.createLinearGradient(0, y - 2.2, 0, y + 2.2);
  g.addColorStop(0, 'rgba(255,220,170,0)');
  g.addColorStop(0.5, 'rgba(255,222,176,0.55)');
  g.addColorStop(1, 'rgba(255,220,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-60, y - 2.2, 120, 4.4);
  pen(ctx, 'rgba(255,236,206,0.8)', 0.3);
  for (const [x, l] of [[-11.4, 1.6], [-4.8, 2.2], [2.2, 1.3], [8.2, 2]]) {
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
// (his hair's shade: mocha, never grey)
const SHADE = (al) => `rgba(60,30,34,${al})`;
// The fringe's cut: level, a whisper lower in the middle, above his brows.
const CUT = { y: -4.6, rise: 0.9, half: 14.8 };
export const cutY = (x, cx) => CUT.y + CUT.rise * Math.min(1, ((x - cx) / CUT.half) ** 2);
// Four sections (the second the widest), each split [where, how deep, how wide the gap].
const SPLITS = [[0.24, 2.4, 0.9], [0.55, 3.1, 1.1], [0.8, 2.5, 0.95]];
function fringeGeom(tx, sw) {
  const cx = 0.8 + tx * 0.6;
  const x0 = cx - CUT.half - 1.2;
  const x1 = cx + CUT.half + 1.0;
  const W = x1 - x0;
  const topY = (x) => -17.6 + 0.022 * (x - cx) ** 2;
  const xs = [x0, ...SPLITS.map(([u]) => x0 + W * u), x1];
  const secs = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const L = xs[i];
    const R = xs[i + 1];
    const sl = i > 0 ? SPLITS[i - 1] : null;
    const sr = i < SPLITS.length ? SPLITS[i] : null;
    const dx = (sw?.[i % 3] ?? 0) * 2.2 * (i % 2 ? -1 : 1);
    const lb = sl ? L + sl[2] / 2 : L + 0.4;
    const rb = sr ? R - sr[2] / 2 : R - 0.4;
    const pts = [[L, topY(L)], [R, topY(R)]];
    if (sr) pts.push([R, cutY(R, cx) - sr[1]]);
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const x = rb + (lb - rb) * (k / n);
      pts.push([x + dx * (1 - Math.abs(k / n - 0.5) * 2) * 0.3 + dx * 0.4, cutY(x, cx) + 0.4 * Math.sin(Math.PI * (k / n))]);
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
  for (const s of G.secs) {
    hairShape(ctx, a, mode, s.pts, () => {
      const cy = cutY(s.mid, G.cx);
      const g = ctx.createLinearGradient(0, cy - 4, 0, cy + 0.6);
      g.addColorStop(0, SHADE(0));
      g.addColorStop(1, SHADE(0.4));
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -24, s.R - s.L + 4, 26);
      for (const [ex, k] of [[s.L, 1], [s.R, -1]]) {
        const sg = ctx.createLinearGradient(0, -13, 0, cutY(ex, G.cx));
        sg.addColorStop(0, SHADE(0));
        sg.addColorStop(1, SHADE(0.34));
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ex + k * 0.3, -13);
        ctx.quadraticCurveTo(ex + k * 0.5, (cutY(ex, G.cx) - 13) / 2, ex + k * 0.4, cutY(ex, G.cx));
        ctx.stroke();
      }
      if (s.R - s.L > 8) {
        pen(ctx, SHADE(0.2), 0.6);
        ctx.beginPath();
        ctx.moveTo(s.mid + 0.8, cutY(s.mid, G.cx) - 2.4);
        ctx.quadraticCurveTo(s.mid + 1.1, cutY(s.mid, G.cx) - 1.1, s.mid + 0.9, cutY(s.mid, G.cx) - 0.2);
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
    const off = 1.4 + Math.max(0, -Math.sin(an)) * 1.5;
    pts.push([Math.cos(an) * (16.4 + off), Math.sin(an) * (18.2 + off) + 0.4]);
  }
  return chaikin([[-17.4, 2.6], ...pts, [17.6, 0], [12, -6], [tx, -9], [-9, -7], [-15.6, -2]], 2);
}
// A short side lock: from under the fringe outside his glasses, down to his cheekbone, one soft round end.
function sideLockPts(side, tx, sway) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 12.4 : -12.2;
  const outX = side > 0 ? 17.8 : -17.6;
  const sx = (v) => v + shift;
  const s = sway * 1.6;
  const E = side > 0 ? 9.6 : 3.2;
  return {
    pts: chaikin([
      [sx(outX - side * 0.4), -10.4], [sx(inX - side * 1.4), -10], [sx(inX), -3], [sx(inX + side * 0.4) + s * 0.4, E - 3.4],
      [sx((inX + outX) / 2 + side * 0.2) + s, E + 0.8],
      [sx(outX - side * 0.6) + s * 0.5, E - 3.6], [sx(outX + side * 0.2), -3],
    ], 3),
    inX: sx(inX),
    outX: sx(outX),
    E,
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
    glow(ctx, P.inX + side * 0.8, P.E - 2, 2.6, HAIR.deep, 0.35);
    shineBand(ctx);
  }, lw);
}
// The curl on his crown: one soft S of a lock like a wisp of coffee steam, rooted inside his hair, on its own
// spring (sw); a round end, never a point.
function curl(ctx, a, mode, tx, sw, lw) {
  const s = sw ?? 0;
  const bx = 3 + tx * 0.4;
  const pts = chaikin([
    [bx - 2.4, -16.6], [bx - 1.8 + s * 1, -20.6], [bx + 1.2 + s * 2.6, -24.2], [bx + 4.6 + s * 3.6, -24.4], [bx + 5.4 + s * 3.8, -22.4],
    [bx + 3.8 + s * 3.2, -21.2], [bx + 2.4 + s * 2.6, -22.4], [bx + 1.4 + s * 1.6, -20.4], [bx + 1.6, -16.8],
  ], 3);
  hairShape(ctx, a, mode, pts, () => {
    glow(ctx, bx - 0.6, -17.4, 2.2, HAIR.deep, 0.4);
    pen(ctx, 'rgba(255,230,196,0.7)', 0.35);
    ctx.beginPath();
    ctx.moveTo(bx - 0.6 + s, -20.4);
    ctx.quadraticCurveTo(bx + 0.8 + s * 2, -23, bx + 3 + s * 3, -23.4);
    ctx.stroke();
  }, lw);
}
// Behind his head: short and neat, rounding over the back of his skull to the nape.
function backHair(ctx, a, mode, tx, lw) {
  const pts = chaikin([[-12, -16], [-17.4, -9], [-19, 0], [-18.2, 8.2], [-15.6, 12.4], [-11.2, 13.4], [-8, 9], [-6, -4], [0, -15]], 3);
  hairShape(ctx, a, mode, pts, () => {
    glow(ctx, -14, 8, 6, HAIR.deep, 0.5);
    shineBand(ctx);
  }, lw);
}

// ---------- The whole head ----------
// q: { turn, look, fog, slip }; f: the eased mood; R: { fr (the fringe's springs), slN, slF, curl }.
export function drawHead(ctx, a, mode, part, q, f, R, lw) {
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  if (part === 'back') {
    backHair(ctx, a, mode, tx, lw);
    return;
  }
  ear(ctx, a, mode, tx, lw);
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
    glow(ctx, -12.8, 6, 6, SKIN[2], 0.5);
    glow(ctx, 13.8 + tx * 0.7, 5, 5, SKIN[2], 0.4);
    glow(ctx, tx * 0.5, 17.6, 8, SKIN[2], 0.32);
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
    // a faint flush, low and wide (he rarely blushes; when he does it's a lot)
    for (const s of [-1, 1]) {
      const bx = tx + s * 9.4;
      glow(ctx, bx, 11, 3.8, BLUSH[0], 0.18 + 0.3 * f.bl);
      glow(ctx, bx, 11, 2, BLUSH[1], 0.08 + 0.3 * f.bl);
    }
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look, f.lid);
    // the nose: a soft shade, a tip light
    glow(ctx, tx + 1.6, 9.6, 1.3, SKIN[3], 0.5);
    ell(ctx, tx + 1.2, 9.3, 0.32, 0.24);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 0.9, 13.4, f);
    glasses(ctx, a, tx, clamp(q.fog ?? 0, 0, 1), q.slip ?? 0);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.2, -2.3, s, f);
    if (q.sweat) sweat(ctx, tx - 13.4, -2 + (q.sweat % 1) * 2.5, 1.3);
  }
  hairShape(ctx, a, mode, capPts(tx), () => {
    glow(ctx, -15, 2, 7, HAIR.deep, 0.45);
    shineBand(ctx);
  }, lw);
  curl(ctx, a, mode, tx, R.curl ?? 0, lw);
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0, lw);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0, lw);
  fringe(ctx, a, mode, tx, R.fr, lw);
}
export { fringeGeom };
