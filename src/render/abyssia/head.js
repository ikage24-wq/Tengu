// Lady Abyssia's head (2026-11-26, drawn from scratch: never the shared face, never the hero's head or
// hair): her face and its moods, her ink-indigo hime hair, her witch's hat with its nautilus tip. In
// head units about her face's middle (x toward the way she faces, y down; the skull about 16 across
// each way), each piece drawn in both of the rig's passes (mode 'line': its outline, 'fill': itself),
// so only the outer edge of her is outlined; her face bare.
//   eyes   her own family: wide almond eyes tipped up at the outer corner, the whole round iris
//          always clear inside them (deep teal at the top through sea-glass to a gold glow at the
//          bottom, the lantern's light in it), a crescent-moon glint up at the back and a small round
//          one low at the front; the upper lash a neat line thickening outward into a little curl at
//          the corner (curled like the tip of one of her arms); a fine lower lash at the outer end; a
//          violet wash over the lid. Only blinks and closed moods (happy, hum, squeeze, dizzy, a wink)
//          cover them.
//   brows  long fine arches, high and haughty.
//   mouth  plum lipstick: a sly smirk at rest (one corner higher), an open "ohoho", a pucker for a
//          kiss, a pout, a little round "o!".
//   hair   ink-indigo hime: an even blunt fringe of five sections stopping just above her lashes,
//          a blunt side lock each side outside her eyes down to her jaw, the long hair behind her
//          shoulders and down her back to her waist, its ends turned under in one soft round curl; one
//          shared light from above and one teal shine band across it all.
//   hat    a witch's hat of dark violet felt with a wide soft brim, the teal band and the orange
//          starfish buckle (the darlings wear the same on their lantern caps), its point curling back
//          into a pearly nautilus shell striped in violet (on a spring: it bobs as she moves).
import { TAU, mix, sstep, win, tone, ell, pen, glow, sweat, tear } from './fx.js';
import { SKIN, SKIN_INK, HAIR, HAT, TEAL, STAR, SHELL, LASH, BROW, IRIS, PUPIL, LIP, BLUSH } from './palette.js';

// Corner cutting: a closed run of points rounded (every corner soft, the shape kept close).
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

// ---------- Her moods (the face's targets; every part eased toward them) ----------
// lid (0 open .. 1 shut: only closed moods), shut (which closed shape), wk (a wink: her far eye shut,
// the near one open), bt (brow tilt: + knit, - worried), by (raise), mw/ms/mo (the mouth's width,
// smile, open), sly (one corner higher), pk (a kissing pucker), po (a pout), te (teeth), bl (blush), sp
// (sparkles in her eyes), wet (tears brimming), sm (small irises: shock).
const F0 = { lid: 0, shut: 'happy', wk: 0, bt: 0, by: 0.2, mw: 0.9, ms: 0.4, mo: 0, sly: 0, pk: 0, po: 0, te: 0, bl: 0.45, sp: 0, wet: 0, sm: 0 };
const fc = (o) => ({ ...F0, ...o });
export const FACES = {
  sly: fc({ bt: 0.08, by: 0.25, ms: 0.5, sly: 0.75 }),
  focus: fc({ bt: 0.45, by: 0, ms: 0.3, sly: 1, bl: 0.4 }),
  gloat: fc({ bt: -0.15, by: 0.55, mw: 1, ms: 0.75, mo: 0.55, sly: 0.3, bl: 0.6 }),
  cackle: fc({ lid: 1, shut: 'happy', bt: -0.2, by: 0.7, mw: 1.1, ms: 0.9, mo: 0.85, bl: 0.75 }),
  delighted: fc({ bt: -0.25, by: 0.75, mw: 1.1, ms: 1, mo: 0.55, bl: 0.8, sp: 1 }),
  greedy: fc({ bt: 0.15, by: 0.5, mw: 1, ms: 0.85, sly: 0.6, bl: 0.75, sp: 1 }),
  kiss: fc({ wk: 1, bt: -0.1, by: 0.4, mw: 0.7, ms: 0.2, pk: 1, bl: 0.95 }),
  hum: fc({ lid: 1, shut: 'hum', bt: -0.2, by: 0.35, mw: 0.7, ms: 0.5, pk: 0.45, bl: 0.6 }),
  pout: fc({ bt: 0.7, by: -0.1, mw: 0.6, ms: -0.4, po: 1, bl: 0.9 }),
  cross: fc({ bt: 1, by: -0.2, mw: 0.85, ms: -0.5, mo: 0.35, te: 1, bl: 0.85 }),
  shock: fc({ bt: -0.45, by: 1, mw: 0.55, ms: -0.1, mo: 0.75, sm: 0.85, bl: 0.5 }),
  sad: fc({ bt: -0.85, by: 0.3, mw: 0.75, ms: -0.6, mo: 0.1, wet: 1, bl: 0.5 }),
  hurt: fc({ lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.9, ms: -0.5, mo: 0.5, te: 1, bl: 0.7 }),
  dizzy: fc({ lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.4, bl: 0.5 }),
  sheepish: fc({ bt: -0.5, by: 0.25, mw: 0.8, ms: 0.45, bl: 1 }),
  talk: fc({ bt: -0.05, by: 0.35, mw: 0.9, ms: 0.45, mo: 0.4, sly: 0.3, bl: 0.55 }),
  dreamy: fc({ lid: 1, shut: 'sleep', bt: -0.25, by: 0.3, mw: 0.8, ms: 0.6, bl: 0.7 }),
};
export const SHUTS = ['happy', 'hum', 'sleep', 'squeeze', 'dizzy'];
export const FKEYS = ['lid', 'wk', 'bt', 'by', 'mw', 'ms', 'mo', 'sly', 'pk', 'po', 'te', 'bl', 'sp', 'wet', 'sm'];
export const VOWELS = [[0.6, 0.2, 0.8], [1.1, 0.5, 0.6], [1, 0.6, 0.3], [0.8, 0.35, 0], [0.65, 0.3, 0.55]];

// (the eyes' place on her face: the same size, level)
const EYE = { y: 3.6, dx: 5.9, w: 4.0, h: 3.9 };

// ---------- One eye ----------
// side +1: the one toward the way she faces (its outer corner on the right). shutK: how far this eye
// is shut (its mood's lid, or a wink).
function eye(ctx, a, x, y, side, f, look, shutK) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = shutK < 0.6 ? win((t + (a.abUid ?? 0) * 0.83) % 5.2, 4.62, 4.74, 4.82, 4.98) : 0;
  const L = Math.max(shutK, blink);
  const closedW = sstep((L - 0.7) / 0.3);
  const inner = x - side * w;
  const outer = x + side * w * 1.05;
  // (the almond: the inner corner low, the outer corner tipped up)
  const cIn = [inner, y + 0.4];
  const cOut = [outer, y - h * 0.32];
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    // (a wink is the happy shape)
    const sh = f.wk > 0.5 && f.lid < 0.5 ? { happy: 1 } : f.shut;
    for (const s of SHUTS) {
      const sw = sh[s] ?? 0;
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      if (s === 'happy' || s === 'hum' || s === 'sleep') {
        // one tapered stroke, its outer end curling up in her little curl
        const up = s === 'sleep' ? 1 : -1;
        const deep = s === 'happy' ? 0.62 : s === 'hum' ? 0.45 : 0.3;
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          pts.push([mix(cIn[0], cOut[0], u), mix(cIn[1], cOut[1] + 1.1, u) + up * Math.sin(Math.PI * u) * h * deep]);
        }
        ctx.beginPath();
        pts.forEach((p, i) => {
          const tw = 0.16 + 0.45 * (i / 12);
          if (!i) ctx.moveTo(p[0], p[1] - tw);
          else ctx.lineTo(p[0], p[1] - tw);
        });
        for (let i = 12; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 0.16 + 0.45 * (i / 12));
        ctx.closePath();
        ctx.fillStyle = tone(a, LASH);
        ctx.fill();
        const e = pts[12];
        pen(ctx, tone(a, LASH), 0.55);
        ctx.beginPath();
        ctx.moveTo(e[0], e[1]);
        ctx.quadraticCurveTo(e[0] + side * 1.3, e[1] - 0.2, e[0] + side * 1.2, e[1] - 1.3);
        ctx.quadraticCurveTo(e[0] + side * 1.05, e[1] - 1.9, e[0] + side * 0.55, e[1] - 1.5);
        ctx.stroke();
      } else if (s === 'squeeze') {
        pen(ctx, tone(a, LASH), 0.85);
        ctx.beginPath();
        ctx.moveTo(x + side * w, y - 2.4);
        ctx.quadraticCurveTo(x - side * w * 0.1, y - 0.3, x - side * w * 0.9, y + 0.3);
        ctx.quadraticCurveTo(x - side * w * 0.1, y + 0.8, x + side * w, y + 2.8);
        ctx.stroke();
      } else {
        // dizzy: a soft spiral
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
  // a violet wash over the lid, the lid's crease above it
  glow(ctx, x + side * 0.8, y - h * 0.95, 4.6, '#c49cf0', 0.38);
  pen(ctx, tone(a, SKIN[3], 0.5), 0.35);
  ctx.beginPath();
  ctx.moveTo(x - side * w * 0.6, y - h * 1.08);
  ctx.quadraticCurveTo(x + side * 0.6, y - h * 1.36, x + side * w * 0.95, y - h * 0.98);
  ctx.stroke();
  // the white: an almond, the top a long arch tipped up outward, the bottom a softer curve
  const topC = (u) => {
    const px = mix(cIn[0], cOut[0], u);
    const py = mix(cIn[1], cOut[1], u) - Math.sin(Math.PI * (0.1 + u * 0.85)) * h * 0.78;
    return [px, py];
  };
  const botC = (u) => {
    const px = mix(cIn[0], cOut[0], u);
    const py = mix(cIn[1], cOut[1], u) + Math.sin(Math.PI * u) ** 0.85 * h * 0.84;
    return [px, py];
  };
  const shape = () => {
    ctx.beginPath();
    for (let i = 0; i <= 14; i++) {
      const p = topC(i / 14);
      if (i) ctx.lineTo(...p);
      else ctx.moveTo(...p);
    }
    for (let i = 14; i >= 0; i--) ctx.lineTo(...botC(i / 14));
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdff');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.36 * f.sm;
  const ix = x + side * 0.25 + (look?.[0] ?? 0) * 0.7;
  const iy = y + 0.05 + (look?.[1] ?? 0) * 0.5;
  const R = 2.75 * small;
  // the iris: deep teal at the top, sea-glass, a gold glow at the bottom (the lantern's light)
  const g = ctx.createLinearGradient(0, iy - R, 0, iy + R);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.38, tone(a, IRIS[2]));
  g.addColorStop(0.74, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, R, R * 1.06);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#163e60', 0.85), 0.4);
  ctx.stroke();
  // fine rings of light in it, and the pupil
  pen(ctx, tone(a, '#c8fff4', 0.45), 0.26);
  for (const [a0, a1, rr] of [[0.4, 1.2, 0.72], [1.9, 2.7, 0.66], [0.95, 1.6, 0.84]]) {
    ctx.beginPath();
    ctx.ellipse(ix, iy + 0.2, R * rr, R * rr * 1.06, 0, a0, a1);
    ctx.stroke();
  }
  ell(ctx, ix, iy + 0.05, R * 0.42, R * 0.5);
  ctx.fillStyle = tone(a, PUPIL);
  ctx.fill();
  // the upper lid's soft shadow on the white (a thin wash, never over the iris)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.5);
  sg.addColorStop(0, 'rgba(70,50,130,0.3)');
  sg.addColorStop(1, 'rgba(70,50,130,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.3, y - h * 1.2, w * 2.6, h * 0.7);
  // the glints: a crescent moon up at the back, a small round one low at the front; delighted they
  // swell into little sparkles
  const sp = f.sp;
  const gx = ix - side * R * 0.42;
  const gy = iy - R * 0.46;
  if (sp < 0.98) {
    ctx.save();
    ctx.globalAlpha *= 1 - sp;
    ctx.beginPath();
    ctx.arc(gx, gy, 1.05, -Math.PI * 0.95, Math.PI * 0.45);
    ctx.arc(gx - side * 0.42, gy - 0.32, 0.78, Math.PI * 0.45, -Math.PI * 0.95, true);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  if (sp > 0.02) {
    const s4 = 1.7 * sp;
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
  ell(ctx, ix + side * R * 0.42, iy + R * 0.5, 0.48 * (1 + sp * 0.4), 0.48 * (1 + sp * 0.4));
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (f.wet > 0.05) {
    ell(ctx, ix, y + h * 0.62, w * 0.85, 0.9);
    ctx.fillStyle = `rgba(220,242,255,${0.75 * f.wet})`;
    ctx.fill();
  }
  ctx.restore();
  // the upper lash: one closed shape along the top, thin at the inner corner, thickening outward and
  // curling up and back at the corner into her little curl
  const N = 14;
  const up = [];
  const lo = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const [px, py] = topC(u);
    const th = 0.18 + 0.9 * u ** 1.5;
    up.push([px, py - th * 0.6]);
    lo.push([px, py + th * 0.4]);
  }
  const e = topC(1);
  ctx.beginPath();
  ctx.moveTo(...lo[0]);
  for (const p of up) ctx.lineTo(...p);
  // (out past the corner, up, and curling back on itself: a round little curl, never a point)
  ctx.quadraticCurveTo(e[0] + side * 1.5, e[1] - 0.9, e[0] + side * 1.75, e[1] - 2.0);
  ctx.quadraticCurveTo(e[0] + side * 1.8, e[1] - 3.0, e[0] + side * 0.95, e[1] - 2.85);
  ctx.quadraticCurveTo(e[0] + side * 0.5, e[1] - 2.6, e[0] + side * 0.85, e[1] - 2.15);
  ctx.quadraticCurveTo(e[0] + side * 1.1, e[1] - 1.9, e[0] + side * 1.05, e[1] - 1.45);
  ctx.quadraticCurveTo(e[0] + side * 0.8, e[1] - 0.5, e[0] - side * 0.2, e[1] + 0.55);
  for (let i = N; i >= 0; i--) ctx.lineTo(...lo[i]);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  // a soft sheen along it
  pen(ctx, 'rgba(200,210,255,0.35)', 0.22);
  ctx.beginPath();
  ctx.moveTo(...topC(0.35).map((v, k) => v - (k ? 0.3 : 0)));
  ctx.lineTo(...topC(0.6).map((v, k) => v - (k ? 0.45 : 0)));
  ctx.stroke();
  // the lower lash: a fine line under the outer half, a tiny tick at its end
  pen(ctx, tone(a, LASH, 0.75), 0.32);
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const p = botC(0.45 + (i / 8) * 0.5);
    if (i) ctx.lineTo(p[0], p[1] + 0.25);
    else ctx.moveTo(p[0], p[1] + 0.25);
  }
  ctx.stroke();
  const b1 = botC(0.95);
  ctx.beginPath();
  ctx.moveTo(b1[0], b1[1] + 0.2);
  ctx.quadraticCurveTo(b1[0] + side * 0.6, b1[1] + 0.3, b1[0] + side * 0.85, b1[1] + 0.95);
  ctx.stroke();
  ctx.restore();
}

// Brows: long fine arches, high at the outer third, tapering at both ends.
function brow(ctx, a, x, y, side, f) {
  const yi = y - f.by * 0.9 + f.bt * 0.85;
  const yo = y - f.by * 0.9 - f.bt * 0.25 + 0.4;
  const xi = x - side * 2.2;
  const xo = x + side * 3.1;
  const top = Math.min(yi, yo) - 1.0 - f.by * 0.15;
  ctx.beginPath();
  ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo(x + side * 0.9, top - 0.35, xo, yo);
  ctx.quadraticCurveTo(x + side * 0.9, top + 0.35, xi, yi + 0.45);
  ctx.closePath();
  ctx.fillStyle = tone(a, BROW);
  ctx.fill();
}

// The mouth: plum lipstick. At rest a sly smirk (a full little cupid's bow over a soft lower lip, the
// corner toward her turn curling higher); open: a laugh or a round "o"; a pucker for a kiss; a pout.
function mouth(ctx, a, x, y, f) {
  const w = 1.75 * f.mw * (1 - 0.35 * f.po) * (1 - 0.5 * f.pk);
  const sly = f.sly * 0.7;
  const cyL = y - f.ms * 0.55 + sly * 0.25;
  const cyR = y - f.ms * 0.55 - sly * 0.55;
  if (f.pk > 0.3) {
    // the pucker: a small round of lips, a soft shine, a darker heart
    const k = f.pk;
    ell(ctx, x + 0.2, y + 0.2, 1.05 * k + 0.4, 1.0 * k + 0.4);
    ctx.fillStyle = tone(a, LIP.base);
    ctx.fill();
    ell(ctx, x + 0.25, y + 0.25, 0.42 * k, 0.32 * k);
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ell(ctx, x - 0.2, y - 0.35, 0.45, 0.2, -0.3);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();
    return;
  }
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cyL);
    ctx.quadraticCurveTo(x, y + f.ms * 0.45 - o * 0.5, x + w, cyR);
    ctx.quadraticCurveTo(x + w * 0.2, y + f.ms * 0.8 + o * 2.6, x - w, cyL);
    ctx.closePath();
    ctx.fillStyle = tone(a, LIP.in);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + f.ms * 0.7 + o * 2.2, w * 0.7, o * 0.95);
    ctx.fillStyle = tone(a, LIP.tongue);
    ctx.fill();
    if (f.te > 0.05) {
      ctx.fillStyle = tone(a, '#ffffff', f.te);
      ctx.fillRect(x - w, Math.min(cyL, cyR) - 0.4, w * 2, 0.75);
    }
    ctx.restore();
    // the lipstick round it
    pen(ctx, tone(a, LIP.base), 0.55);
    ctx.beginPath();
    ctx.moveTo(x - w, cyL);
    ctx.quadraticCurveTo(x, y + f.ms * 0.45 - o * 0.5, x + w, cyR);
    ctx.quadraticCurveTo(x + w * 0.2, y + f.ms * 0.8 + o * 2.6, x - w, cyL);
    ctx.stroke();
    return;
  }
  // closed: the upper lip (a soft cupid's bow), the lower lip fuller, both plum
  const mid = y + f.ms * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - w - 0.2, cyL);
  ctx.quadraticCurveTo(x - w * 0.5, mid - 0.95, x - 0.1, mid - 0.55);
  ctx.quadraticCurveTo(x + w * 0.5, mid - 1.0, x + w + 0.25, cyR);
  ctx.quadraticCurveTo(x, mid + 0.2, x - w - 0.2, cyL);
  ctx.closePath();
  ctx.fillStyle = tone(a, LIP.base);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - w * 0.8, cyL + 0.15);
  ctx.quadraticCurveTo(x, mid + 1.55 - f.po * 0.2, x + w * 0.85, cyR + 0.15);
  ctx.quadraticCurveTo(x, mid + 0.15, x - w * 0.8, cyL + 0.15);
  ctx.closePath();
  ctx.fillStyle = tone(a, LIP.lt);
  ctx.fill();
  // the line between them
  pen(ctx, tone(a, LIP.sh), 0.34);
  ctx.beginPath();
  ctx.moveTo(x - w - 0.2, cyL);
  ctx.quadraticCurveTo(x, mid + 0.25, x + w + 0.25, cyR);
  ctx.stroke();
  // the lower lip's shine
  ell(ctx, x + 0.35, mid + 0.85, 0.5, 0.18);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  if (f.po > 0.3) {
    ell(ctx, x + 0.2, mid + 1.1, 0.95 * f.po, 0.42 * f.po);
    ctx.fillStyle = tone(a, LIP.lt, 0.7);
    ctx.fill();
  }
}

// ---------- Her face's outline: full cheeks at eye level, a soft jaw to a small round chin ----------
export function skullPts(tx) {
  return chaikin([[0, -17.6], [11.6, -13.2], [16, -4], [15.8, 4.6], [12.6, 10.8], [6 + tx * 0.2, 15.2], [1.2 + tx * 0.35, 16.6], [-4.8 + tx * 0.2, 15.4], [-12.2, 10.8], [-15.8, 4.4], [-16.2, -4], [-11.8, -13.2]], 3);
}

// ---------- Her hair ----------
// The one light every lock is coloured from: lit at the top of her head, deeper toward the ends.
function hairFill(ctx, a, y0 = -22, y1 = 40) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, tone(a, HAIR.lt));
  g.addColorStop(0.3, tone(a, HAIR.base));
  g.addColorStop(0.62, tone(a, HAIR.sh));
  g.addColorStop(1, tone(a, HAIR.deep));
  return g;
}
// The one shine band they all share: a soft teal band at one height across her head (drawn clipped
// into each piece, so it lines up across them), a few fine lines of light in it.
function shineBand(ctx, y = -9.5) {
  const g = ctx.createLinearGradient(0, y - 2.6, 0, y + 2.6);
  g.addColorStop(0, 'rgba(168,236,230,0)');
  g.addColorStop(0.5, 'rgba(168,236,230,0.42)');
  g.addColorStop(1, 'rgba(168,236,230,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-30, y - 2.6, 60, 5.2);
  pen(ctx, 'rgba(230,255,250,0.5)', 0.3);
  for (const [x, l] of [[-11.4, 2.4], [-4, 1.6], [2.8, 2.6], [9.6, 1.6]]) {
    const yy = y - 0.3 + 0.004 * x * x;
    ctx.beginPath();
    ctx.moveTo(x, yy);
    ctx.quadraticCurveTo(x + l / 2, yy - 0.4, x + l, yy + 0.1);
    ctx.stroke();
  }
}
// Paints a hair shape: its outline in the line pass; in the fill pass the shared light, then its own
// soft shading (a callback, clipped to it).
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
// The fringe's cut: one even line across her forehead just above her lashes, a touch lower in the
// middle, rising gently to her temples (an even blunt cut).
const CUT = { y: -2.7, rise: 2.2, half: 14.8 };
const cutY = (x, cx) => CUT.y + CUT.rise * Math.min(1, ((x - cx) / CUT.half) ** 2);
// Its five sections: where each split rises from the cut (a share of the width), how deep it goes and
// how wide it opens there; the middle section the widest, each a little different.
const SPLITS = [[0.16, 2.6, 0.9], [0.37, 3.6, 1.15], [0.63, 3.3, 1.1], [0.84, 2.4, 0.9]];
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
    // (each section's end sways a touch on its own spring; its root stays put)
    const dx = (sw?.[i % 3] ?? 0) * 3 * (i % 2 ? -1 : 1);
    const lb = sl ? L + sl[2] / 2 : L + 0.4;
    const rb = sr ? R - sr[2] / 2 : R - 0.4;
    const pts = [[L, topY(L)], [R, topY(R)]];
    if (sr) pts.push([R, cutY(R, cx) - sr[1]]);
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const x = rb + (lb - rb) * (k / n);
      // (trimmed flat along the cut, the corners soft)
      pts.push([x + dx * (1 - Math.abs(k / n - 0.5) * 2) * 0.3 + dx * 0.4, cutY(x, cx) + 0.2 * Math.sin(Math.PI * (k / n))]);
    }
    if (sl) pts.push([L, cutY(L, cx) - sl[1]]);
    secs.push({ pts: chaikin(pts, 2), L, R, mid: (L + R) / 2 });
  }
  return { cx, x0, x1, secs, topY };
}
function fringe(ctx, a, mode, tx, sw, lw) {
  const G = fringeGeom(tx, sw);
  // the deeper layer seen up inside the splits
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
      // a soft shade gathering toward the cut, the ends a clean deeper tone
      const cy = cutY(s.mid, G.cx);
      const g = ctx.createLinearGradient(0, cy - 4, 0, cy + 0.6);
      g.addColorStop(0, 'rgba(36,36,104,0)');
      g.addColorStop(1, 'rgba(36,36,104,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -22, s.R - s.L + 4, 26);
      // thin shadows down its sides at the splits, fading up toward the crown
      for (const [ex, k] of [[s.L, 1], [s.R, -1]]) {
        const sg = ctx.createLinearGradient(0, -12, 0, cutY(ex, G.cx));
        sg.addColorStop(0, 'rgba(36,36,104,0)');
        sg.addColorStop(1, 'rgba(36,36,104,0.45)');
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ex + k * 0.3, -12);
        ctx.quadraticCurveTo(ex + k * 0.5, (cutY(ex, G.cx) - 12) / 2, ex + k * 0.4, cutY(ex, G.cx));
        ctx.stroke();
      }
      shineBand(ctx, -8.6);
    }, lw);
  }
}
// The hair cap: one size larger than her head, from the hairline over the crown (mostly under the
// hat), down the back of her head.
function capPts(tx) {
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const an = Math.PI * (0.98 + (i / 18) * 1.04);
    const off = 1.5 + Math.max(0, -Math.sin(an)) * 1.4;
    pts.push([Math.cos(an) * (16.6 + off), Math.sin(an) * (17.6 + off) + 0.4]);
  }
  return chaikin([[-17.6, 4], ...pts, [17.8, 1], [12, -5], [tx, -8], [-9, -6], [-15.8, -1]], 2);
}
// A side lock: framing her cheek outside her eye, from under the fringe straight down to her jaw,
// cut blunt across the bottom (its corners rounded), swinging a touch on its spring.
function sideLock(ctx, a, mode, side, tx, sway, lw) {
  const shift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 12.2 : -11.2;
  const outX = side > 0 ? 17.6 : -18;
  const sx = (v) => v + shift;
  const s = sway * 2.4;
  const bot = 13.6;
  const pts = chaikin([
    [sx(outX - side * 0.6), -9.5], [sx(inX - side * 1.4), -9.2], [sx(inX), -2], [sx(inX + side * 0.2) + s * 0.4, 6],
    [sx(inX + side * 0.4) + s * 0.8, bot - 0.6], [sx(inX + side * 0.9) + s, bot + 0.4], [sx((inX + outX) / 2) + s, bot + 0.7], [sx(outX - side * 0.5) + s, bot + 0.4],
    [sx(outX + side * 0.1) + s * 0.8, bot - 0.8], [sx(outX + side * 0.4) + s * 0.4, 5], [sx(outX + side * 0.2), -3],
  ], 3);
  hairShape(ctx, a, mode, pts, () => {
    // occlusion up under the fringe, a soft shade on its face side, the ends a clean deeper tone
    const g = ctx.createLinearGradient(0, -10, 0, -4);
    g.addColorStop(0, 'rgba(30,30,90,0.55)');
    g.addColorStop(1, 'rgba(30,30,90,0)');
    ctx.fillStyle = g;
    ctx.fillRect(Math.min(sx(outX), sx(inX)) - 4, -11, 14, 7);
    glow(ctx, sx(inX + side * 0.6), 6, 3.2, HAIR.deep, 0.4);
    glow(ctx, sx(outX - side * 1.4), 0, 3.4, HAIR.lt, 0.4);
    shineBand(ctx, -8.6);
  }, lw);
}
// The long hair behind her: from the back of her head down behind her shoulders and her back to her
// waist, a little wider as it falls, its ends turned under in one soft round curl. In her head's
// units, `len` long, swaying from its springs (sw: the whole mass, cu: the curl).
export function backHair(ctx, a, mode, tx, sw, len, lw) {
  const s = sw ?? 0;
  const L = len;
  const side = (k) => k * (18.4 + 2.2 * Math.min(1, L / 40));
  const pts = chaikin([
    [-17.2, -6], [-12, -18.4], [0, -21], [12, -18], [17.6, -6],
    [18.8 + s * 2, 8], [side(1) + s * 4, L * 0.55], [side(1) + 0.4 + s * 6, L * 0.86],
    // (the curl under at the end: round, never a point)
    [side(1) - 2 + s * 7, L + 2.4], [8 + s * 7, L + 3.2], [0 + s * 7, L + 2], [-8 + s * 6, L + 3.4], [side(-1) + 2 + s * 6, L + 2.6],
    [side(-1) - 0.4 + s * 5, L * 0.86], [side(-1) + s * 3, L * 0.55], [-19 + s * 1.5, 8],
  ], 3);
  hairShape(ctx, a, mode, pts, () => {
    // deeper in the middle (where it falls behind her back), lit at the outer edges, the curl's
    // underside in shade, and the shared shine high up
    glow(ctx, s * 3, L * 0.5, L * 0.45, HAIR.deep, 0.5);
    const g = ctx.createLinearGradient(0, L - 3, 0, L + 3.6);
    g.addColorStop(0, 'rgba(30,30,90,0)');
    g.addColorStop(1, 'rgba(30,30,90,0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(-30, L - 4, 60, 8);
    pen(ctx, 'rgba(36,36,104,0.3)', 0.7);
    for (const dx of [-7, 6]) {
      ctx.beginPath();
      ctx.moveTo(dx * 0.6, 2);
      ctx.quadraticCurveTo(dx + s * 3, L * 0.5, dx * 1.1 + s * 6, L * 0.92);
      ctx.stroke();
    }
    shineBand(ctx, -8.6);
  }, lw, -22, L + 4);
}

// ---------- Her hat ----------
// The brim: a wide soft oval tipped with her head; the crown: a cone of felt rising from it and leaning
// back, its point curling over into a nautilus shell (on its spring, `bob`); the band and the buckle.
function hat(ctx, a, mode, tx, bob, lw) {
  const lean = -0.32 + bob * 0.5;
  const cxB = 0.4 + tx * 0.35;
  const yB = -14.6;
  ctx.save();
  // the crown (behind the brim's front edge: drawn first, the brim over its foot)
  const base0 = [cxB - 9.4, yB - 1];
  const base1 = [cxB + 9.2, yB - 1];
  const tipBase = [cxB - 4.2 + Math.sin(lean) * 16, yB - 21 + (1 - Math.cos(lean)) * 6];
  const crown = chaikin([
    base0, [cxB - 7.6, yB - 9], [tipBase[0] - 3.8, tipBase[1] + 2.4], [tipBase[0] - 1.4, tipBase[1] - 1.8], [tipBase[0] + 3.4, tipBase[1] - 0.6],
    [tipBase[0] + 4.6, tipBase[1] + 3.2], [cxB + 6.6, yB - 9.6], base1,
  ], 3);
  poly(ctx, crown);
  if (mode === 'line') {
    pen(ctx, tone(a, HAT.ink), lw);
    ctx.stroke();
  } else {
    const g = ctx.createLinearGradient(cxB - 8, 0, cxB + 8, 0);
    g.addColorStop(0, tone(a, HAT.sh));
    g.addColorStop(0.5, tone(a, HAT.base));
    g.addColorStop(1, tone(a, HAT.deep));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    poly(ctx, crown);
    ctx.clip();
    // a soft fold where it leans back, a lit front
    glow(ctx, cxB - 2.6, yB - 9, 6, HAT.lt, 0.55);
    pen(ctx, tone(a, HAT.deep, 0.6), 0.6);
    ctx.beginPath();
    ctx.moveTo(cxB + 3, yB - 3);
    ctx.quadraticCurveTo(cxB + 2.2, yB - 11, tipBase[0] + 2.4, tipBase[1] + 2);
    ctx.stroke();
    ctx.restore();
  }
  // the nautilus at the point: a round shell, its opening toward the crown, a spiral of chambers
  nautilus(ctx, a, mode, tipBase[0] + 1.2, tipBase[1] - 3.4, 5.4, lean * 0.6 - 0.3, lw);
  // the brim: a wide oval, its front edge lower (we see it from a little above)
  ctx.save();
  ctx.translate(cxB, yB);
  ctx.rotate(-0.04 + bob * 0.12);
  const brim = chaikin([[-23, 1.2], [-17, -2.6], [-6, -4], [6, -4], [17, -2.4], [23.4, 1.4], [18, 4.4], [6, 5.6], [-6, 5.6], [-18, 4.4]], 3);
  poly(ctx, brim);
  if (mode === 'line') {
    pen(ctx, tone(a, HAT.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, HAT.base);
    ctx.fill();
    ctx.save();
    poly(ctx, brim);
    ctx.clip();
    // the top of the brim lit, its soft rolled edge in shade, the crown's foot in shade on it
    const g = ctx.createLinearGradient(0, -4, 0, 5.6);
    g.addColorStop(0, tone(a, HAT.lt));
    g.addColorStop(0.55, tone(a, HAT.base));
    g.addColorStop(1, tone(a, HAT.sh));
    ctx.fillStyle = g;
    ctx.fillRect(-26, -6, 52, 13);
    pen(ctx, tone(a, HAT.deep, 0.6), 0.9);
    ctx.beginPath();
    ctx.moveTo(-21.6, 2.2);
    ctx.quadraticCurveTo(0, 7.6, 22, 2.4);
    ctx.stroke();
    glow(ctx, 0, -1.6, 9, HAT.deep, 0.35);
    ctx.restore();
  }
  // the teal band round the crown's foot and the starfish buckle on it
  ctx.beginPath();
  ctx.moveTo(-9.4, -1.2);
  ctx.quadraticCurveTo(0, 1.6, 9.2, -1.2);
  ctx.lineTo(8.6, -4.4);
  ctx.quadraticCurveTo(0, -1.8, -8.8, -4.4);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, tone(a, TEAL.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, TEAL.base);
    ctx.fill();
    pen(ctx, tone(a, TEAL.lt, 0.8), 0.45);
    ctx.beginPath();
    ctx.moveTo(-8.4, -3.4);
    ctx.quadraticCurveTo(0, -0.9, 8.2, -3.4);
    ctx.stroke();
  }
  starfish(ctx, a, mode, 2.4, -1.4, 2.6, 0.2, lw);
  ctx.restore();
  ctx.restore();
}
// A nautilus shell: a round shell coiling in on itself, pearly cream with soft violet stripes, its
// chambers a spiral of soft lines, a pearly glint.
export function nautilus(ctx, a, mode, x, y, r, rot, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  // (the outer whorl: a round shape, a little flattened where its mouth opens toward the hat)
  const outer = chaikin([[-r, 0.2 * r], [-0.8 * r, -0.72 * r], [0, -1.02 * r], [0.78 * r, -0.74 * r], [1.04 * r, 0], [0.82 * r, 0.7 * r], [0.1 * r, 1.0 * r], [-0.6 * r, 0.86 * r]], 3);
  poly(ctx, outer);
  if (mode === 'line') {
    pen(ctx, tone(a, SHELL.ink), lw);
    ctx.stroke();
    ctx.restore();
    return;
  }
  ctx.fillStyle = tone(a, SHELL.base);
  ctx.fill();
  ctx.save();
  poly(ctx, outer);
  ctx.clip();
  // the stripes: soft violet flames from the rim in toward the coil
  for (let i = 0; i < 6; i++) {
    const an = -2.4 + i * 0.62;
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * r * 1.1, Math.sin(an) * r * 1.1);
    ctx.quadraticCurveTo(Math.cos(an + 0.3) * r * 0.7, Math.sin(an + 0.3) * r * 0.7, Math.cos(an + 0.5) * r * 0.42, Math.sin(an + 0.5) * r * 0.42);
    ctx.quadraticCurveTo(Math.cos(an + 0.12) * r * 0.72, Math.sin(an + 0.12) * r * 0.72, Math.cos(an - 0.22) * r * 1.1, Math.sin(an - 0.22) * r * 1.1);
    ctx.fillStyle = tone(a, i % 2 ? SHELL.stripe : SHELL.stripeSh, 0.75);
    ctx.fill();
  }
  glow(ctx, 0.5 * r, 0.5 * r, r * 0.9, SHELL.sh, 0.6);
  ctx.restore();
  // the coil's spiral of chambers
  pen(ctx, tone(a, SHELL.ink, 0.8), 0.45);
  ctx.beginPath();
  for (let i = 0; i <= 30; i++) {
    const an = (i / 30) * TAU * 1.6 + 0.6;
    const rr = r * (0.62 - (i / 30) * 0.5);
    const p = [0.12 * r + Math.cos(an) * rr, 0.08 * r + Math.sin(an) * rr];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.stroke();
  ell(ctx, 0.14 * r, 0.1 * r, r * 0.14, r * 0.14);
  ctx.fillStyle = tone(a, SHELL.sh);
  ctx.fill();
  // a pearly glint
  ell(ctx, -0.42 * r, -0.5 * r, r * 0.22, r * 0.13, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();
}
// A little starfish: five round-tipped arms, orange, a soft lit middle.
export function starfish(ctx, a, mode, x, y, r, rot, lw) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const an = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.48 : r;
    pts.push([Math.cos(an) * rr, Math.sin(an) * rr]);
  }
  poly(ctx, chaikin(pts, 2));
  if (mode === 'line') {
    pen(ctx, tone(a, STAR.ink), lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, STAR.base);
    ctx.fill();
    ell(ctx, -r * 0.12, -r * 0.16, r * 0.32, r * 0.26);
    ctx.fillStyle = tone(a, STAR.lt, 0.8);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- The whole head ----------
// part 'back': her long hair (behind her body); 'front': her face, the hair over it and the hat.
// q: her state this frame (turn, look, sweat, tears); f: the face; R: the hair's springs.
export function drawHead(ctx, a, mode, part, q, f, R, lw) {
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  if (part === 'back') {
    backHair(ctx, a, mode, tx, R.back ?? 0, 44, lw);
    return;
  }
  // the face
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
    glow(ctx, -12.4, 4, 6, SKIN[2], 0.55);
    glow(ctx, 13.2 + tx * 0.7, 4, 5, SKIN[2], 0.45);
    glow(ctx, tx * 0.5, 15, 8, SKIN[2], 0.3);
    // the fringe's soft cast shadow on her forehead, in her skin's own shade
    const G = fringeGeom(tx, R.fr);
    ctx.beginPath();
    ctx.moveTo(G.x0, -22);
    ctx.lineTo(G.x1, -22);
    for (let k = 0; k <= 20; k++) {
      const x = G.x1 - (G.x1 - G.x0) * (k / 20);
      ctx.lineTo(x, cutY(x, G.cx) + 0.85);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, SKIN[2], 0.75);
    ctx.fill();
    // the hat brim's soft shadow up on her forehead under the fringe
    glow(ctx, tx * 0.4, -14, 14, SKIN[3], 0.25);
    ctx.restore();
    // the blush: a wide pink flush, a rosier core, two neat little strokes
    for (const s of [-1, 1]) {
      const bx = tx + s * 8.6;
      glow(ctx, bx, 8.6, 3.6, BLUSH[0], 0.3 + 0.32 * f.bl);
      glow(ctx, bx, 8.6, 1.9, BLUSH[1], 0.2 + 0.35 * f.bl);
      pen(ctx, tone(a, '#f08ab4', 0.3 + 0.4 * f.bl), 0.3);
      for (const dx of [-0.8, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(bx + dx - 0.4, 9.2);
        ctx.quadraticCurveTo(bx + dx, 8.5, bx + dx + 0.5, 8.2);
        ctx.stroke();
      }
    }
    // the eyes: a wink shuts the far one (s -1), the near one stays open
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look, s < 0 ? Math.max(f.lid, f.wk) : f.lid);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.2, -1.5, s, f);
    // the nose: a soft shade and a tip light
    glow(ctx, tx + 1.6, 7.6, 1.3, SKIN[3], 0.55);
    ell(ctx, tx + 1.2, 7.2, 0.35, 0.25);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 1, 11.4, f);
    if (q.sweat) sweat(ctx, tx - 12.8, -1 + (q.sweat % 1) * 2.5, 1.3);
    if (f.wet > 0.6 && q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 7 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  // the hair cap (mostly under the hat), the side locks, the fringe over them, then the hat
  hairShape(ctx, a, mode, capPts(tx), () => {
    glow(ctx, -15, 2, 7, HAIR.deep, 0.5);
    shineBand(ctx, -8.6);
  }, lw);
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0, lw);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0, lw);
  fringe(ctx, a, mode, tx, R.fr, lw);
  hat(ctx, a, mode, tx, R.hat ?? 0, lw);
}
export { EYE };
