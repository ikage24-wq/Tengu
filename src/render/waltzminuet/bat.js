// Dame Minuet, the Upside-down Bat (2026-11-26, concept "A" for the Ballroom duo, "Black Tie & Bat
// Wings"): the follow. A dreamy, giggly, romantic little fruit bat (a flying fox: a soft fox-like
// face, never a scary one) who can only really dance upside-down: Rondo has the floor, she has the
// ceiling. She moves on her own copy of the creature base (batrig.js; batbody.js `bat`: a small round
// body, short legs on tiny feet, slim arms that are her wings' bones), dressed here; her big head
// drawn here from scratch over the mannequin's (the shared face never used).
//   look    soft plum-lilac fur; a big fluffy apricot-cream ruff round her neck and shoulders like a
//           fur stole (its rounded tufts on springs); huge rounded ears with pink insides, the near
//           one wearing a rose-pink satin bow (its tails on springs); a pearl choker; a tiny
//           dark-plum nose on a short soft muzzle; her wings soft membranes from her arms and three
//           long fingers each (lilac-plum, a little translucent, pale finger lines, the trailing edge
//           in rounded scallops, each scallop sprung), wrapped round her at rest like a ball-gown
//           cape, opening wide for her cast. Her own soft plum outline on the outer edge only.
//   eyes    huge round dewdrops: a glossy near-black plum iris filling most of the eye, two big round
//           glints and a small star twinkle, long curled rounded upper lashes, the upper lid drooping
//           dreamily, a soft pink lower lid with blush under it. Faces: dreamy (rest), sparkly
//           (happy, wide), giggle (^ ^), a slow sleepy blink (her own rhythm), listening (closed,
//           content), surprised, sad, hurt (> <), beaten (soft swirls). Mouths: closed, a small "o",
//           open, wide, a smile, a pout, and her sweet "~".
//   idle    wrapped in her wings, swaying dreamily; a little giggle; an ear twitch; a peek out of
//           her wing cape (the near wing lifted, a sparkly look); a slow sleepy blink.
//   cast    Echo (pose 'echo'): a flutter and a flip up onto a pale rose silk ribbon from the ceiling,
//           hanging by her feet upside-down (the whole figure turned over: a pose, never a stretch);
//           her wings open wide through the cast, her eyes closing as she listens; at the release her
//           mouth opens in a sweet "~" and soft pastel sound arcs ripple out from her (curved
//           lilac-pink waves, fading as they spread, sparkles riding them); then she flips back down.
import { dressRig } from './batrig.js';

const TAU = Math.PI * 2;
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const win = (t, t0, t1, t2, t3) => sstep((t - t0) / (t1 - t0)) * (1 - sstep((t - t2) / (t3 - t2)));
const pulse = (t, t0, d) => {
  const u = (t - t0) / d;
  return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
};
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const sub = (p, q) => [p[0] - q[0], p[1] - q[1]];
const lerp2 = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
const hexRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
// (a colour, whitened by a hit's flash)
const tone = (a, c, al = 1) => {
  const k = Math.min(0.85, Math.max(0, (a?.flash ?? 0) * 6));
  const [r, g, b] = hexRgb(c);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgba(${f(r)},${f(g)},${f(b)},${al})`;
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.01, rx), Math.max(0.01, ry), r, 0, TAU);
};
function smooth(ctx, pts) {
  const n = pts.length;
  const mid = (i) => [(pts[i % n][0] + pts[(i + 1) % n][0]) / 2, (pts[i % n][1] + pts[(i + 1) % n][1]) / 2];
  ctx.beginPath();
  ctx.moveTo(...mid(n - 1));
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...mid(i));
  ctx.closePath();
}
function sline(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (let i = 1; i < pts.length - 1; i++) ctx.quadraticCurveTo(...pts[i], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  ctx.lineTo(...pts[pts.length - 1]);
}
function pen(ctx, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}
function glow(ctx, x, y, r, col, al) {
  const [cr, cg, cb] = hexRgb(col);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${cr},${cg},${cb},${al})`);
  g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
function sparkle(ctx, x, y, k, col = '#ffffff') {
  if (k <= 0.01) return;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.quadraticCurveTo(x, y, x, y + k);
  ctx.quadraticCurveTo(x, y, x - k, y);
  ctx.quadraticCurveTo(x, y, x, y - k);
  ctx.fill();
}
function spring(st, key, goal, k, c, dt, kick = 0) {
  // (never NaN: a bad number from anywhere resets it to its goal)
  if (!Number.isFinite(goal)) goal = 0;
  const s = (st[key] ??= { x: goal, v: 0 });
  if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) Object.assign(s, { x: goal, v: 0 });
  if (Number.isFinite(kick)) s.v += kick;
  if (dt > 0) {
    const n = Math.max(1, Math.ceil(dt * 240));
    for (let i = 0; i < n; i++) {
      s.v += (-(s.x - goal) * k - s.v * c) * (dt / n);
      s.x += s.v * (dt / n);
    }
  }
  return s.x;
}

// ---------- Her colours ----------
const INK = '#5e4682';
const FUR = ['#e4d4f2', '#c2a6dc', '#9a7ab8', '#7c5e9c', '#634a82'];
const MUZ = ['#fbf2ff', '#eadcf6', '#d4bfe8'];
const EAR = ['#ffd6e4', '#f5a8c4', '#e088aa'];
const RUFF = ['#fff4e4', '#ffe2c0', '#ffcd9c', '#f0ae7e', '#d8946a'];
const BOW = ['#ffe2ec', '#ff9fc0', '#e87aa2', '#c45f86'];
const WING = ['#d6bdf0', '#b294d4', '#8e6cb2', '#6e5294'];
const IRIS = ['#1c0f22', '#3a1f44', '#6a3f78'];
const LASH = '#3c2450';
const PEARL = ['#ffffff', '#f6eefa', '#d8c8e4'];
const WAVE = ['#f4d8ff', '#e8b8f0', '#ffc4dc', '#c8a4f0'];
const RIBBON = ['#fff0f2', '#ffd6dc', '#f2b2bc', '#d8909e'];
// (her drawn size over the base's)
const BIG = 1.45;
const LW = 2 / BIG;

const paint = (ctx, a, mode, col, w = LW) => {
  if (mode === 'line') {
    pen(ctx, INK, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
// A bone's frame in the base's kid-box units.
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// ---------- Her head (kid units about her neck joint; a big chibi head) ----------
const HS = 1.22;
const HO = [0, -17.5];
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS]);
};
// (her face turned three-quarters toward us: the middle of her face this far ahead)
const TX = 4.6;
// The faces: [lid (0 open .. 1 shut), look x, look y, iris size, brow lift, brow tilt (+ worried)]
const FACES = {
  dreamy: [0.14, 0.35, -0.05, 1, 1.1, 0],
  sparkly: [0.0, 0.15, -0.1, 1.04, 1, 0.15],
  surprised: [-0.1, 0, 0, 0.8, 1.3, 0],
  sad: [0.4, 0, 0.3, 1.02, 0.2, 1],
  peek: [0.12, 0.6, 0.1, 1.04, 0.8, 0.1],
  cross: [0.3, 0.3, 0.05, 1, -0.2, 0.9],
  worried: [0.1, 0, 0.15, 0.98, 0.9, -0.7],
  brave: [0.2, 0.4, 0, 1.02, 0.1, 0.55],
  determined: [0.06, 0.5, 0, 1.04, 0.35, 0.35],
};
const SHUT = { giggle: 1, listen: 1, hurt: 1, dead: 1, sleep: 1 };
function eye(ctx, a, x, y, side, k, f) {
  const r = 6.2;
  const rx = r * k;
  const t = a.t ?? 0;
  const name = f.name;
  if (SHUT[name]) {
    pen(ctx, tone(a, LASH), 1.05);
    ctx.beginPath();
    if (name === 'giggle') {
      ctx.moveTo(x - rx * 0.85, y + 1.2);
      ctx.quadraticCurveTo(x, y - 4.4, x + rx * 0.85, y + 1.2);
    } else if (name === 'hurt') {
      const sd = -side;
      ctx.moveTo(x - sd * rx * 0.8, y - 3.4);
      ctx.quadraticCurveTo(x + sd * rx * 0.1, y - 0.5, x + sd * rx * 0.75, y);
      ctx.quadraticCurveTo(x + sd * rx * 0.1, y + 0.5, x - sd * rx * 0.8, y + 3.4);
    } else if (name === 'dead') {
      for (let i = 0; i <= 30; i++) {
        const q = (i / 30) * TAU * 2.1 + t * 2 * side;
        const rr = (i / 30) * rx * 0.85;
        const p = [x + Math.cos(q) * rr, y + Math.sin(q) * rr];
        if (i) ctx.lineTo(...p);
        else ctx.moveTo(...p);
      }
    } else {
      // closed, content: a soft downward curve, the lashes resting along it
      ctx.moveTo(x - rx * 0.9, y);
      ctx.quadraticCurveTo(x, y + 3.6, x + rx * 0.9, y);
    }
    ctx.stroke();
    if (name === 'listen' || name === 'sleep' || name === 'giggle') {
      // the lashes, curled and rounded at the outer corner
      const ox = x + side * rx * 0.88;
      const oy = name === 'giggle' ? y + 0.8 : y + 0.4;
      pen(ctx, tone(a, LASH), 0.8);
      for (const [dx, dy, cx, cy] of [[2.2, -0.6, 2.8, -2.4], [1.6, 0.8, 2.6, 0.4]]) {
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.quadraticCurveTo(ox + side * dx, oy + dy, ox + side * cx, oy + cy);
        ctx.stroke();
      }
      if (name !== 'giggle') {
        pen(ctx, tone(a, '#e99ab4'), 0.8);
        ctx.beginPath();
        ctx.moveTo(x - rx * 0.5, y + 3.2);
        ctx.quadraticCurveTo(x, y + 4.3, x + rx * 0.5, y + 3.2);
        ctx.stroke();
      }
    }
    return;
  }
  const [lid0, lx, ly, isz] = f.v;
  const L = clamp(Math.max(lid0, f.blink ?? 0), -0.15, 1);
  if (L > 0.92) {
    eye(ctx, a, x, y, side, k, { name: 'sleep' });
    return;
  }
  // the lid, drooping dreamily: its edge a soft arch from side to side of the eye, the outer end a
  // little lower than the inner (dreamy, never cross); only the eye below it is drawn, so no edge
  // of the eye shows above the lid
  const yl = y - r + L * r * 2;
  const dxl = rx * Math.sqrt(Math.max(0, 1 - ((yl - y) / r) ** 2));
  const yo = yl + 0.7;
  const yi = yl + 0.15;
  const lidEdge = (dy = 0) => {
    ctx.moveTo(x + side * (dxl + 0.4), yo + dy);
    ctx.quadraticCurveTo(x, yl - 3.4 + dy, x - side * (dxl + 0.4), yi + dy);
  };
  ctx.save();
  if (L > 0.01) {
    ctx.beginPath();
    lidEdge();
    ctx.lineTo(x - side * rx * 1.4, yi);
    ctx.lineTo(x - side * rx * 1.4, y + r * 1.5);
    ctx.lineTo(x + side * rx * 1.4, y + r * 1.5);
    ctx.lineTo(x + side * rx * 1.4, yo);
    ctx.closePath();
    ctx.clip();
  }
  // the white (barely showing), the big glossy iris
  ell(ctx, x, y, rx, r);
  ctx.fillStyle = tone(a, '#ffffff');
  ctx.fill();
  ell(ctx, x, y, rx, r);
  ctx.clip();
  const ix = x + lx * 0.9;
  const iy = y + ly * 0.9 + 0.2;
  const g = ctx.createRadialGradient(ix - 1.2, iy - 1.8, 0.5, ix, iy, r * 0.95);
  g.addColorStop(0, tone(a, IRIS[1]));
  g.addColorStop(0.6, tone(a, IRIS[0]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, rx * 0.88 * isz, r * 0.9 * isz);
  ctx.fillStyle = g;
  ctx.fill();
  // a soft plum glow low in it, like light through a dewdrop
  ctx.beginPath();
  ctx.ellipse(ix, iy + r * 0.42, rx * 0.62 * isz, r * 0.36 * isz, 0, 0, Math.PI);
  ctx.fillStyle = tone(a, IRIS[2], 0.75);
  ctx.fill();
  if (L > 0.01) {
    // the lid's soft shadow just under its edge
    ctx.beginPath();
    lidEdge();
    ctx.lineTo(x - side * (dxl + 0.4), yi + 1.1);
    ctx.quadraticCurveTo(x, yl - 2.3, x + side * (dxl + 0.4), yo + 1.1);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#3a2050', 0.22);
    ctx.fill();
  }
  ctx.restore();
  // the glints: two big round ones, a small star twinkle (twinkling)
  const lidY = L > 0.01 ? yl + 0.5 : y - r;
  const bright = f.bright ?? 1;
  const g1 = [ix - rx * 0.36, Math.max(iy - r * 0.36, lidY + 1.6 * bright)];
  ell(ctx, g1[0], g1[1], 1.75 * bright, 1.75 * bright);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, ix + rx * 0.34, iy + r * 0.34, 0.95 * bright, 0.95 * bright);
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.fill();
  const tw = 0.75 + 0.25 * Math.sin(t * 3.1 + side);
  sparkle(ctx, ix + rx * 0.3, Math.max(iy - r * 0.5, lidY + 0.9), 1.15 * tw * bright, '#fff6ff');
  // the upper lid's line (soft, heavy), the long curled lashes at the outer corner
  pen(ctx, tone(a, LASH), 0.95);
  ctx.beginPath();
  // (wide open, the eye's own top line; the lid's edge fading in over it as it lowers)
  const lk = sstep((L - 0.01) / 0.12);
  if (lk < 1) {
    ctx.globalAlpha *= 1 - lk;
    ctx.ellipse(x, y, rx, r, 0, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
    ctx.globalAlpha /= 1 - lk;
    ctx.beginPath();
  }
  if (lk > 0) {
    ctx.globalAlpha *= lk;
    lidEdge();
    ctx.stroke();
    ctx.globalAlpha /= lk;
  }
  // (the lashes ride the eye's edge where the lid meets it, never above its upper third: one
  // smooth path as the lid goes up and down, no jump)
  const oy = Math.max(L > 0.01 ? yo : y - r, y - r * 0.45);
  const ox = x + side * (rx * Math.sqrt(Math.max(0, 1 - ((oy - y) / r) ** 2)) + 0.2);
  pen(ctx, tone(a, LASH), 0.85);
  for (const [dx, dy, cx, cy] of [[2.6, -0.6, 3.0, -2.8], [1.8, -1.8, 1.2, -3.6], [2.4, 0.7, 3.4, -0.2]]) {
    ctx.beginPath();
    ctx.moveTo(ox - side * 0.4, oy);
    ctx.quadraticCurveTo(ox + side * dx, oy + dy, ox + side * cx, oy + cy);
    ctx.stroke();
    ell(ctx, ox + side * cx, oy + cy, 0.42, 0.42);
    ctx.fillStyle = tone(a, LASH);
    ctx.fill();
  }
  // the soft pink lower lid
  pen(ctx, tone(a, '#e99ab4'), 0.85);
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.98, r * 0.98, 0, Math.PI * 0.22, Math.PI * 0.78);
  ctx.stroke();
}
// Her brows: soft little tufts of pale fur, floating up when she's sparkly, tipped up in the middle
// when she's worried.
function brow(ctx, a, x, y, side, lift, tilt) {
  ctx.save();
  ctx.translate(x, y - lift * 1.6);
  ctx.rotate(side * tilt * 0.35);
  // (a soft arch, its ends rounded, never a hard line)
  smooth(ctx, [[-2.8, 0.7], [-1.9, -0.35], [0, -0.75], [2.0, -0.35], [2.9, 0.65], [0, 0.05]]);
  ctx.fillStyle = tone(a, FUR[3], 0.75);
  ctx.fill();
  ctx.restore();
}
// Her mouth, under her nose on her muzzle: closed (a soft little smile), 'o', open, wide, smile,
// pout, and her "~".
function mouth(ctx, a, mo, x0, y0) {
  ctx.save();
  ctx.translate(x0, y0);
  ctx.scale(1.3, 1.3);
  const x = 0;
  const y = 0;
  mouthAt(ctx, a, mo, x, y);
  ctx.restore();
}
function mouthAt(ctx, a, mo, x, y) {
  pen(ctx, tone(a, LASH), 0.75);
  if (mo === 'o' || mo === 'open' || mo === 'wide') {
    const rx = mo === 'o' ? 1.2 : mo === 'open' ? 1.7 : 2.6;
    const ry = mo === 'o' ? 1.3 : mo === 'open' ? 1.9 : 1.8;
    ctx.beginPath();
    if (mo === 'wide') {
      ctx.moveTo(x - rx, y);
      ctx.quadraticCurveTo(x, y + 0.4, x + rx, y);
      ctx.quadraticCurveTo(x, y + ry * 2.2, x - rx, y);
    } else ctx.ellipse(x, y + ry * 0.7, rx, ry, 0, 0, TAU);
    ctx.fillStyle = tone(a, '#8a3c64');
    ctx.fill();
    ctx.stroke();
    ell(ctx, x, y + ry * (mo === 'wide' ? 1.2 : 1.15), rx * 0.6, ry * 0.4);
    ctx.fillStyle = tone(a, '#ff9ab8');
    ctx.fill();
    return;
  }
  if (mo === 'tilde') {
    // her sweet "~": a small open mouth whose upper lip waves
    const w = 3.0;
    ctx.beginPath();
    ctx.moveTo(x - w, y + 0.4);
    ctx.bezierCurveTo(x - w * 0.5, y - 1.4, x - w * 0.1, y + 1.4, x + w * 0.35, y - 0.2);
    ctx.quadraticCurveTo(x + w * 0.7, y - 1.0, x + w, y + 0.2);
    ctx.quadraticCurveTo(x + w * 0.3, y + 3.6, x - w, y + 0.4);
    ctx.fillStyle = tone(a, '#8a3c64');
    ctx.fill();
    ctx.stroke();
    ell(ctx, x - 0.2, y + 1.7, 1.5, 0.75);
    ctx.fillStyle = tone(a, '#ff9ab8');
    ctx.fill();
    return;
  }
  ctx.beginPath();
  if (mo === 'smile') {
    // a little cat-like "w" of a smile
    ctx.moveTo(x - 2.4, y - 0.2);
    ctx.quadraticCurveTo(x - 1.2, y + 1.6, x, y + 0.2);
    ctx.quadraticCurveTo(x + 1.2, y + 1.6, x + 2.4, y - 0.2);
  } else if (mo === 'pout') {
    ctx.moveTo(x - 1.6, y + 1.0);
    ctx.quadraticCurveTo(x, y - 0.3, x + 1.6, y + 1.0);
  } else {
    ctx.moveTo(x - 1.7, y + 0.1);
    ctx.quadraticCurveTo(x - 0.8, y + 1.1, x, y + 0.3);
    ctx.quadraticCurveTo(x + 0.8, y + 1.1, x + 1.7, y + 0.1);
  }
  ctx.stroke();
}
// An ear: huge and rounded, a pink inside; the near one wears the bow at its root.
function ear(ctx, a, mode, side, near) {
  const q = a.mnQ ?? {};
  const tw = (q.ear ?? [0, 0])[near ? 0 : 1];
  const root = near ? [TX - 14.5, -10.5] : [TX + 9.5, -13];
  ctx.save();
  ctx.translate(...root);
  ctx.rotate((near ? -0.72 : 0.5) + tw + (q.earOut ?? 0) * (near ? -0.25 : 0.2));
  const k = near ? 1 : 0.86;
  const shape = [[-6.4, 2], [-9.0, -5.4], [-8.6, -13.4], [-5.4, -19.4], [0, -21.4], [5.0, -19.2], [7.8, -12.6], [7.6, -4.6], [5.4, 2]].map(([x, y]) => [x * k, y * k]);
  smooth(ctx, shape);
  paint(ctx, a, mode, near ? FUR[2] : FUR[3]);
  if (mode === 'fill') {
    smooth(ctx, [[-4.2, 0], [-6.4, -5.6], [-6.0, -12.6], [-3.2, -17.0], [0.4, -18.0], [3.8, -16.0], [5.4, -11.0], [5.2, -3.6], [3.4, 0.5]].map(([x, y]) => [x * k, y * k]));
    const g = ctx.createLinearGradient(0, -16 * k, 0, 0);
    g.addColorStop(0, tone(a, EAR[0]));
    g.addColorStop(1, tone(a, near ? EAR[1] : EAR[2]));
    ctx.fillStyle = g;
    ctx.fill();
    glow(ctx, -1.0 * k, -10 * k, 5 * k, '#ffffff', near ? 0.4 : 0.2);
    // a soft fold line down its inside
    pen(ctx, tone(a, EAR[2], 0.7), 0.6);
    sline(ctx, [[-1.2 * k, -2], [-1.8 * k, -7], [-0.8 * k, -12]]);
    ctx.stroke();
  }
  ctx.restore();
}
// The bow on her near ear's root: two round loops, a knot, two tails on springs.
function earBow(ctx, a, mode) {
  const q = a.mnQ ?? {};
  const tails = q.bowT ?? [0, 0];
  const g = q.grav ?? 1;
  ctx.save();
  ctx.translate(TX - 14.8, -11.4);
  ctx.rotate(-0.75);
  const loop = (sd) => smooth(ctx, [[0, -0.4], [sd * 1.6, -2.6], [sd * 4.4, -3.0], [sd * 5.2, -0.2], [sd * 4.4, 2.6], [sd * 1.6, 2.2], [0, 0.4]]);
  const tail = (sd, sw) => {
    const an = (g > 0 ? 1.6 : -1.6) + sd * 0.45 + sw;
    const L = 6.4;
    const p1 = [Math.cos(an) * L * 0.5 + sd * 0.4, Math.sin(an) * L * 0.5];
    const p2 = [Math.cos(an + sd * 0.15) * L, Math.sin(an + sd * 0.15) * L];
    smooth(ctx, [[-0.9, 0], [0.9, 0], [p1[0] + 1.2, p1[1]], [p2[0] + 1.3, p2[1]], [p2[0], p2[1] + Math.sign(Math.sin(an)) * 0.9], [p2[0] - 1.3, p2[1]], [p1[0] - 1.2, p1[1]]]);
  };
  const parts = [() => tail(-1, tails[0]), () => tail(1, tails[1]), () => loop(-1), () => loop(1), () => ell(ctx, 0, 0, 1.5, 1.7)];
  for (const [i, p] of parts.entries()) {
    p();
    if (mode === 'line') {
      pen(ctx, INK, LW);
      ctx.stroke();
      continue;
    }
    ctx.fillStyle = tone(a, i < 2 ? BOW[2] : i === 4 ? BOW[2] : BOW[1]);
    ctx.fill();
    if (i === 2 || i === 3) {
      ctx.save();
      ctx.clip();
      glow(ctx, (i === 2 ? -1 : 1) * 3, -1.2, 3, BOW[0], 0.9);
      ctx.restore();
    }
    p();
    pen(ctx, tone(a, BOW[3]), 0.5);
    ctx.stroke();
  }
  ctx.restore();
}
// The skull: round and soft, full fluffy cheeks (rounded fur lumps, never spiky).
function skullPts() {
  const pts = [];
  for (let i = 0; i < 30; i++) {
    const an = (i / 30) * TAU - Math.PI / 2;
    const s = Math.sin(an);
    const c = Math.cos(an);
    const low = Math.max(0, s);
    const rx = 20.5 + low * 1.4;
    const ry = s < 0 ? 18.6 : 17;
    const lump = low > 0.2 && low < 0.95 && i % 2 ? 1.3 : 0;
    pts.push([c * (rx + lump), s * (ry + lump * 0.6)]);
  }
  return pts;
}
// The muzzle: a short soft fox-like snout three-quarters toward us, paler; the tiny dark-plum nose.
const snout = (ctx) => smooth(ctx, [[TX - 5, 4.6], [TX + 2, 1.6], [TX + 10, 1.0], [TX + 16.6, 2.2], [TX + 20.2, 4.8], [TX + 19.6, 8.4], [TX + 14, 11.4], [TX + 5, 13.6], [TX - 3, 12.6], [TX - 6, 8.6]]);
function muzzle(ctx, a) {
  snout(ctx);
  ctx.fillStyle = tone(a, MUZ[1]);
  ctx.fill();
  ctx.save();
  snout(ctx);
  ctx.clip();
  glow(ctx, TX + 8, 4.6, 9, MUZ[0], 0.95);
  glow(ctx, TX + 6, 13, 6, MUZ[2], 0.5);
  ctx.restore();
  // the nose: a tiny soft plum heart-ish bean, a glint
  ell(ctx, TX + 18.2, 4.4, 2.1, 1.5, -0.25);
  ctx.fillStyle = tone(a, '#4a2a52');
  ctx.fill();
  ell(ctx, TX + 17.5, 3.8, 0.75, 0.45, -0.3);
  ctx.fillStyle = tone(a, '#ffffff', 0.8);
  ctx.fill();
  // the line down from her nose to her mouth
  pen(ctx, tone(a, MUZ[2]), 0.6);
  ctx.beginPath();
  ctx.moveTo(TX + 17.8, 5.9);
  ctx.quadraticCurveTo(TX + 17.2, 7.6, TX + 15.6, 8.8);
  ctx.stroke();
}
function head(ctx, a, mode, D, part) {
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
  const q = a.mnQ ?? {};
  if (part === 'back') {
    ear(ctx, a, mode, 1, false);
    ctx.restore();
    return;
  }
  ear(ctx, a, mode, -1, true);
  smooth(ctx, skullPts());
  paint(ctx, a, mode, FUR[2]);
  if (mode === 'line') {
    snout(ctx);
    paint(ctx, a, mode, MUZ[1]);
  }
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, skullPts());
    ctx.clip();
    glow(ctx, -6, -12, 17, FUR[1], 0.95);
    glow(ctx, -18, 8, 11, FUR[3], 0.5);
    // her face: a soft paler mask round her eyes, the muzzle
    smooth(ctx, [[TX - 17, 0], [TX - 15, -8], [TX - 7, -10.5], [TX, -8.6], [TX + 7, -10.4], [TX + 14.6, -7.4], [TX + 16.6, 1], [TX + 12, 11], [TX, 15], [TX - 12, 12]]);
    ctx.fillStyle = tone(a, FUR[1]);
    ctx.fill();
    glow(ctx, TX - 2, -2, 13, FUR[0], 0.55);
    ctx.restore();
    muzzle(ctx, a);
    // the cheeks' blush
    const bl = 0.55 + (q.blush ?? 0) * 0.4;
    glow(ctx, TX - 9.6, 6.4, 4.4, '#ff8fb8', bl);
    glow(ctx, TX + 12.4, 6, 3.2, '#ff8fb8', bl * 0.7);
    const f = q.f ?? { name: 'dreamy', v: FACES.dreamy };
    eye(ctx, a, TX - 7.6, -1.4, -1, 1, f);
    eye(ctx, a, TX + 6.4, -1.6, 1, 0.8, f);
    const fv = f.v ?? FACES.dreamy;
    brow(ctx, a, TX - 7.8, -10.6, -1, q.browLift ?? fv[4], q.browTilt ?? fv[5]);
    brow(ctx, a, TX + 6.6, -10.8, 1, q.browLift ?? fv[4], q.browTilt ?? fv[5]);
    mouth(ctx, a, q.mouth ?? 'closed', TX + 13.6, 10.0);
    // the pearl choker, just under her chin
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      const x = TX - 9 + u * 18;
      const y = 15.6 + Math.sin(u * Math.PI) * 1.8;
      ell(ctx, x, y, 1.15, 1.15);
      ctx.fillStyle = tone(a, i % 2 ? PEARL[1] : PEARL[0]);
      ctx.fill();
      pen(ctx, tone(a, PEARL[2]), 0.35);
      ctx.stroke();
      ell(ctx, x - 0.35, y - 0.4, 0.38, 0.3);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  earBow(ctx, a, mode);
  ctx.restore();
}

// ---------- Her body ----------
// A paler belly on her round body.
function belly(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const w = D.J.waist;
  ell(ctx, h[0] + 2, (h[1] + w[1]) / 2 + 1, 10.5, 11.5);
  ctx.fillStyle = tone(a, FUR[1], 0.95);
  ctx.fill();
  glow(ctx, h[0], w[1] - 2, 9, FUR[0], 0.7);
  ctx.restore();
}
// The ruff: a big fluffy apricot-cream stole round her neck and shoulders, its rounded tufts on
// springs (falling the way that's down, hanging or not).
function ruff(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'chest');
  const sh = D.J.shN;
  const sf = D.J.shF;
  const cx = (sh[0] + sf[0]) / 2 + 1.5;
  const cy = sh[1] - 2;
  const sw = a.mnQ?.ruff ?? [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const g = a.mnQ?.grav ?? 1;
  const halfW = 20;
  const hem = [];
  const N = 9;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = cx - halfW + u * halfW * 2;
    const drop = (6 + Math.sin(u * Math.PI) * 5.5 + (i % 2 ? 3.2 : -0.8)) * (g > 0 ? 1 : 0.8);
    hem.push([x + (sw[i] ?? 0) * 1.5, cy + drop + Math.abs(sw[i] ?? 0) * 0.3 * g]);
  }
  const top = [[cx - halfW - 2.5, cy + 1.5], [cx - halfW - 0.5, cy - 4.6], [cx - halfW + 4, cy - 6.4], [cx - 9, cy - 9.2], [cx - 2, cy - 10.4], [cx + 6, cy - 10], [cx + 13, cy - 8.4], [cx + halfW - 1, cy - 5], [cx + halfW + 2.4, cy - 1], [cx + halfW + 3, cy + 2.6]];
  const pts = [...top, ...hem.reverse()];
  smooth(ctx, pts);
  paint(ctx, a, mode, RUFF[1]);
  if (mode === 'fill') {
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    glow(ctx, cx - 4, cy - 4, 16, RUFF[0], 0.95);
    glow(ctx, cx + 12, cy + 8, 10, RUFF[3], 0.55);
    // soft tufts of fur across it, each its own light
    for (const [x, y, r] of [[-13, 3, 3.4], [-6, 6, 3.8], [2.4, 5, 3.6], [10, 5.6, 3.2], [-9, -3, 3], [-1, -4.6, 3.2], [7, -3.6, 3], [15, 1, 2.6]]) {
      ell(ctx, cx + x, cy + y, r, r * 0.8);
      ctx.fillStyle = tone(a, RUFF[0], 0.32);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}
// Her feet: tiny and soft, the toes curled (round, never claws).
function foot(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `foot${k}`);
  const p = D.J[`ank${k}`];
  const near = k === 'N';
  smooth(ctx, [[p[0] - 4.4, p[1] - 2.6], [p[0] + 1.6, p[1] - 3.2], [p[0] + 6.2, p[1] + 0.4], [p[0] + 6.4, p[1] + 3.2], [p[0] + 2, p[1] + 4.4], [p[0] - 4.2, p[1] + 3.8], [p[0] - 5.2, p[1] + 0.6]]);
  paint(ctx, a, mode, near ? FUR[3] : FUR[4]);
  if (mode === 'fill' && near) {
    pen(ctx, tone(a, FUR[4]), 0.5);
    for (const dx of [1.8, 3.8]) {
      ctx.beginPath();
      ctx.moveTo(p[0] + dx, p[1] + 1.4);
      ctx.lineTo(p[0] + dx + 0.6, p[1] + 3.8);
      ctx.stroke();
    }
  }
  ctx.restore();
}

// ---------- Her wings ----------
// A wing: from the shoulder along the arm to the wrist (the arm, the base's own, its leading edge),
// three long fingers fanning from the wrist, the membrane between them and back to her side, its
// trailing edge in rounded scallops, each scallop sprung. Wrapped round her at rest (the fingers
// hanging down like a cape); fanned wide open for her cast.
function wingGeom(a, D, k) {
  const q = a.mnQ ?? {};
  const near = k === 'N';
  const S = D.at(a, `arm${k}u`, [0, 0]);
  const E = D.at(a, `arm${k}f`, [0, 0]);
  const W = D.at(a, `hand${k}`, [0, 0]);
  const open = clamp(q.open?.[near ? 0 : 1] ?? 0, 0, 1);
  const fa = Math.atan2(W[1] - E[1], W[0] - E[0]);
  const sgn = Math.cos(fa) >= 0 ? 1 : -1;
  // (wrapped: hanging down the way her body is down, a little toward the back; open: fanned from
  // the forearm round toward her feet)
  const bodyDown = Math.atan2(D.at(a, 'torso', [0, 10])[1] - D.at(a, 'torso', [0, 0])[1], D.at(a, 'torso', [0, 10])[0] - D.at(a, 'torso', [0, 0])[0]);
  const rest = near ? [-0.78, -0.12, 0.52] : [0.82, 0.22, -0.36];
  const fan = [-0.15, 0.62, 1.25];
  const lenR = near ? [10, 13, 12.2] : [9.4, 12.8, 12];
  const lenO = [9.5, 17.5, 15];
  const tipsOff = q.tips?.[near ? 0 : 1] ?? [[0, 0], [0, 0], [0, 0], [0, 0]];
  const tips = [0, 1, 2].map((i) => {
    const r0 = bodyDown + rest[i];
    const r1 = fa + sgn * fan[i];
    let d = r1 - r0;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    const an = r0 + d * sstep(open);
    const L = mix(lenR[i], lenO[i], sstep(open));
    return add(add(W, [Math.cos(an) * L, Math.sin(an) * L]), tipsOff[i]);
  });
  const H = add(ptOf(a, D, 'torso', [D.J.hip[0] + (near ? 3 : -5), D.J.hip[1] + 5]), tipsOff[3]);
  return { S, E, W, tips, H, open };
}
function membranePts(g) {
  const { S, E, W, tips, H } = g;
  const lobe = (p, q, k) => {
    const m = lerp2(p, q, 0.5);
    const d = sub(m, W);
    const L = Math.hypot(...d) || 1;
    const gap = Math.hypot(q[0] - p[0], q[1] - p[1]);
    return add(m, [(d[0] / L) * gap * k, (d[1] / L) * gap * k]);
  };
  const hl = (() => {
    const m = lerp2(tips[2], H, 0.5);
    const d = sub(m, lerp2(S, W, 0.5));
    const L = Math.hypot(...d) || 1;
    const gap = Math.hypot(H[0] - tips[2][0], H[1] - tips[2][1]);
    return add(m, [(d[0] / L) * gap * 0.22, (d[1] / L) * gap * 0.22]);
  })();
  // (the leading edge sits a little outside the arm's bones, so the velvet covers them: no stick
  // of an arm shows across the front)
  const mid = lerp2(lerp2(tips[1], H, 0.5), W, 0.4);
  const out = (p, k) => {
    const d = sub(p, mid);
    const L = Math.hypot(...d) || 1;
    return add(p, [(d[0] / L) * k, (d[1] / L) * k]);
  };
  return [out(S, 1.3), out(lerp2(S, E, 0.5), 1.5), out(E, 1.6), out(lerp2(E, W, 0.5), 1.5), out(W, 1.6), lerp2(W, tips[0], 0.7), tips[0], lobe(tips[0], tips[1], 0.2), tips[1], lobe(tips[1], tips[2], 0.22), tips[2], hl, H, lerp2(H, S, 0.5)];
}
function wing(ctx, a, mode, D, k) {
  const g = wingGeom(a, D, k);
  const near = k === 'N';
  const pts = membranePts(g);
  // (a bad number anywhere: skip the wing this frame rather than throw)
  if (!pts.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))) return;
  smooth(ctx, pts);
  if (mode === 'line') {
    pen(ctx, INK, 2);
    ctx.stroke();
    return;
  }
  // soft velvet: opaque, deepening toward the hem, a gentle sheen across it
  const gr = ctx.createLinearGradient(g.W[0], g.W[1], g.tips[1][0], g.tips[1][1]);
  gr.addColorStop(0, tone(a, near ? WING[2] : WING[3]));
  gr.addColorStop(0.55, tone(a, near ? '#9f7ec2' : '#7a5ea0'));
  gr.addColorStop(1, tone(a, near ? WING[2] : WING[3]));
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.save();
  smooth(ctx, pts);
  ctx.clip();
  glow(ctx, ...lerp2(g.W, g.tips[1], 0.35), 8, WING[0], near ? 0.38 : 0.16);
  // the drape: soft folds hanging from the wrist down into the scallops (a lit ridge and its shade),
  // fading as the wing opens
  const wrap = 1 - sstep(g.open / 0.6);
  if (wrap > 0.02) {
    for (const [tp, u] of [[g.tips[0], 0.55], [lerp2(g.tips[0], g.tips[1], 0.55), 0.6], [lerp2(g.tips[1], g.tips[2], 0.45), 0.6], [lerp2(g.tips[2], g.H, 0.5), 0.5]]) {
      const top = lerp2(g.W, lerp2(g.E, g.H, 0.5), u * 0.4);
      const bend = add(lerp2(top, tp, 0.55), [0.5, 0]);
      pen(ctx, tone(a, WING[0], 0.4 * wrap), near ? 0.9 : 0.6);
      sline(ctx, [top, bend, lerp2(top, tp, 0.95)]);
      ctx.stroke();
      pen(ctx, tone(a, WING[3], 0.45 * wrap), near ? 0.7 : 0.5);
      sline(ctx, [add(top, [0.9, 0.2]), add(bend, [0.9, 0]), add(lerp2(top, tp, 0.95), [0.9, 0])]);
      ctx.stroke();
    }
  }
  // the fingers: pale soft lines from the wrist to near each tip, only once the wing opens
  const fing = sstep((g.open - 0.25) / 0.45);
  if (fing > 0.02) {
    pen(ctx, tone(a, near ? WING[0] : WING[1], 0.85 * fing), near ? 0.75 : 0.6);
    for (const tp of g.tips) {
      const m2 = add(lerp2(g.W, tp, 0.5), [0, 0.3]);
      sline(ctx, [g.W, m2, lerp2(g.W, tp, 0.9)]);
      ctx.stroke();
    }
  }
  ctx.restore();
  // (a soft deeper rim of its own colour, so it reads over her body: never the outline)
  smooth(ctx, pts);
  pen(ctx, tone(a, WING[3], 0.85), 0.75);
  ctx.stroke();
}

// ---------- Her act, her fight and her scenes (on the base's channels) ----------
const CYCLE = 15;
// (heights, game px: the hang's turn-over pivot (her middle), the hang's own lift (head about 25-30 px
// off the floor), the chandelier perch, the ribbon drop's end (her face level with Rondo's beak), the
// Grand Lift's reach (her feet up at Rondo's raised flippers), lowered when beaten)
const MID = -31;
const UP = 16;
const PERCH = 162;
const DROP = 16;
const LIFT_UP = 44;
const LOWEST = -18;
const HANGS = new Set(['kiss', 'rings', 'bow', 'echo']);
const HANG_REL = { kiss: 1.6, rings: 2.7, bow: 1.8, echo: 1.8 };
const SWINGS = ['buffet', 'whip'];
const easeOut = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
// A damped spring kept in the rig's state, its value and speed (`snap`: set it there at once).
function follow(st, key, goal, k, c, dt, snap = null) {
  if (!Number.isFinite(goal)) goal = 0;
  if (snap != null && !Number.isFinite(snap)) snap = null;
  if (!Number.isFinite(dt)) dt = 0;
  const s = (st[key] ??= { x: goal, v: 0 });
  if (!Number.isFinite(s.x) || !Number.isFinite(s.v)) Object.assign(s, { x: goal, v: 0 });
  if (snap != null) {
    s.v = dt > 0 ? (snap - s.x) / dt : 0;
    s.x = snap;
    return s.x;
  }
  const n = Math.max(1, Math.ceil(dt * 240));
  for (let i = 0; i < n; i++) {
    s.v += (-(s.x - goal) * k - s.v * c) * (dt / n);
    s.x += s.v * (dt / n);
  }
  return s.x;
}
// Where she is this frame, worked out before she's drawn: how far she's turned over onto her ribbon
// (h, 0 standing .. 1 hanging), how high the ribbon holds her (up), how high she flies (fly), and the
// swing of her hang. Every change eased; the scene's acts drawn on their own curves.
function place(m, a) {
  const st = (a.mo.rig ??= {});
  const now = a.now ?? a.t ?? 0;
  const dt = Math.min(0.1, Math.max(0, a.dt ?? 0));
  let hT = 0;
  let upT = 0;
  let flyT = 0;
  let snapH = null;
  let snapUp = null;
  let mode = 'stand';
  // (the cast now and the one just ended, as the pose reads them)
  if (m.cast && m.castPose) st.mnCast = { pose: m.castPose, t0: m.cast.t0 };
  else if (st.mnCast) {
    st.mnLast = { pose: st.mnCast.pose, at: m.attackAt ?? now };
    st.mnCast = null;
  }
  const casting = m.cast && m.castPose ? m.castPose : null;
  const u = casting ? now - m.cast.t0 : -1;
  const dur = m.cast?.dur ?? 2.6;
  const rel = !m.cast && st.mnLast && Math.abs((m.attackAt ?? -99) - st.mnLast.at) < 0.25 ? st.mnLast.pose : null;
  const rs = rel ? now - st.mnLast.at : -1;
  const act = m.cine?.act;
  if (m.hp <= 0) {
    // beaten: hanging limp, then lowered on the ribbon nearly to the floor, then down onto it
    if (st.mnDeadAt == null) {
      st.mnDeadAt = now;
      st.mnDeadHang = (st.mnH?.x ?? 0) > 0.5 || (st.mnFly?.x ?? 0) > 20;
      st.mnDeadUp = st.mnUp?.x ?? 0;
    }
    const du = now - st.mnDeadAt;
    if (st.mnDeadHang) {
      mode = 'deadhang';
      hT = du < 2.3 ? 1 : 0;
      upT = du < 0.9 ? st.mnDeadUp : du < 2.3 ? mix(st.mnDeadUp, LOWEST, sstep((du - 0.9) / 1.3)) : 0;
      if (du < 2.3) snapUp = upT;
    }
  } else {
    st.mnDeadAt = null;
    if (m.cine && act) {
      // the entrance's acts, each from where the last left her
      if (st.mnActAt !== act.at) {
        st.mnActAt = act.at;
        st.mnAct0 = { h: st.mnH?.x ?? 0, up: st.mnUp?.x ?? 0 };
      }
      const au = Math.max(0, now - act.at);
      const d = act.dur ?? 1;
      const s0 = st.mnAct0;
      if (act.move === 'perch') {
        snapH = 1;
        snapUp = PERCH;
        mode = 'hang';
      } else if (act.move === 'ribbondrop') {
        // lowered smoothly from the chandelier, a little bounce on the ribbon at the end
        const v = clamp(au / d, 0, 1);
        snapH = 1;
        snapUp = mix(s0.up, DROP, easeOut(v)) - 4.5 * Math.sin(Math.PI * clamp((au - d * 0.78) / (d * 0.42), 0, 1)) * (1 - clamp((au - d) / 0.4, 0, 1));
        mode = 'hang';
      } else if (act.move === 'bow') {
        snapH = s0.h > 0.5 ? 1 : null;
        snapUp = s0.h > 0.5 ? s0.up : null;
        mode = s0.h > 0.5 ? 'hang' : 'stand';
      } else if (act.move === 'flipdown') {
        // she lets go and flips down onto her feet
        const v = sstep(au / Math.max(0.3, d * 0.85));
        snapH = s0.h * (1 - v);
        snapUp = s0.up * (1 - v);
        mode = v < 1 ? 'flip' : 'stand';
      } else {
        // (any other act, a swing or a mood: she stays where the last one left her)
        snapH = null;
        hT = st.mnHT ?? 0;
        upT = st.mnUT ?? 0;
        mode = hT > 0.5 ? 'hang' : 'stand';
      }
    } else if (m.lift) {
      flyT = Math.max(0, Number(m.lift.y) || 0) + LIFT_UP;
      mode = 'lift';
    } else if (m.fly) {
      flyT = Math.max(0, Number(m.fly.y) || 0);
      mode = 'fly';
    } else if (casting === 'swoop') {
      flyT = 46 * sstep(u / Math.max(0.5, dur));
      mode = 'rise';
    } else if (casting === 'lift') {
      // (up to where she'll hold Rondo's flippers: the Lift's own height with Rondo still on the floor)
      flyT = (40 + LIFT_UP) * sstep((u - 0.2) / Math.max(0.5, dur * 0.8));
      mode = 'rise';
    } else if ((rel === 'swoop' || rel === 'lift') && rs < 0.4) {
      flyT = st.mnFT ?? 0;
      mode = 'rise';
    } else if (HANGS.has(casting) || (HANGS.has(rel) && rs < HANG_REL[rel]) || m.hang) {
      hT = 1;
      mode = 'hang';
    } else if (a.moving) {
      flyT = 5;
      mode = 'hover';
    }
  }
  if (snapH != null || snapUp != null) {
    if (snapH != null) hT = snapH;
    if (snapUp != null) upT = snapUp;
  }
  st.mnHT = hT;
  st.mnUT = upT;
  st.mnFT = flyT;
  const h = clamp(follow(st, 'mnH', hT, 46, 13.5, dt, snapH), 0, 1);
  const up = follow(st, 'mnUp', upT, 60, 15.5, dt, snapUp);
  const flyK = m.fly || m.lift ? [160, 25] : [34, 11.6];
  const fly = Math.max(0, follow(st, 'mnFly', flyT, flyK[0], flyK[1], dt));
  // the swing of her hang on the ribbon: kicked as she moves along, settling like a pendulum
  const vx = dt > 0 && Number.isFinite(m.x) ? ((m.x ?? 0) - (st.mnX ?? m.x ?? 0)) / dt : 0;
  st.mnX = m.x ?? 0;
  const sway = follow(st, 'mnSway', Math.sin(now * 1.1) * 0.035 - clamp(vx / 600, -0.3, 0.3), 9, 1.6, dt) * h;
  return (a.mnP = { h, up, fly, sway, mode, casting, u, dur, rel, rs });
}

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const P = a.mnP ?? { h: 0, up: 0, fly: 0, mode: 'stand' };
  const q = { f: null, mouth: 'smile', blush: 0, open: [0, 0], earOut: 0, wave: null, kiss: null, gust: -1, whip: -1, trail: 0, tears: 0, sweat: -1, z: 0, dizzy: 0, browLift: null, browTilt: null };
  a.mnQ = q;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * Math.min(1, k);
  };
  let face = 'dreamy';
  let blink = 0;
  let busy = false;
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const hang = P.h;
  const { casting, u, dur, rel, rs } = P;
  const act = m.cine?.act;
  const au = act ? now - act.at : -1;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.45;
  const mood = m.cine?.mood ?? (a.mood === 'calm' ? null : a.mood);
  const sway = Math.sin(t * 0.9);
  // Wrapped in her wings: the near arm across her front, the far one round her back, the fingers
  // hanging like a cape; a dreamy sway from side to side.
  go({ tilt: sway * 3, pelvis: -sway * 1.5, head: 4 + sway * 4, neckR: sway * 2, shN: -34 + sway * 2, elN: 52, hwN: 10, shF: 30, elF: -46, hwF: -8, x: sway * 0.004 });
  // Hanging: wrapped snug, the wings closer round her
  go({ shN: -26, elN: 60, shF: 24, elF: -54, tilt: sway * 1.5, head: 2 }, hang);
  // ---- flying: her wings beating (hard in the Lift, a glide in the Swoop, low flaps hovering) ----
  const flying = P.fly > 2.5 || P.mode === 'lift' || P.mode === 'fly' || P.mode === 'rise';
  // (how airborne she is, from her eased height: no snap as she lifts off or settles)
  const flyK = clamp(P.fly / 12, 0, 1) * (1 - hang);
  st.mnHard = (st.mnHard ?? 0.35) + ((P.mode === 'lift' ? 1 : P.mode === 'hover' ? 0.35 : 0.75) - (st.mnHard ?? 0.35)) * Math.min(1, dt * 4);
  if (flyK > 0.01) {
    const hard = st.mnHard;
    const freq = 2.0 + 1.4 * hard;
    st.mnBeat = ((st.mnBeat ?? 0) + dt * freq) % 1;
    const b = 0.5 + 0.5 * Math.sin(st.mnBeat * TAU);
    const amp = 40 + 70 * hard;
    // (her feet tucked right up into her fur while she's airborne: no thin legs dangling)
    go({ shN: -55 - amp * b, elN: 18 - 30 * b, hwN: -8, shF: 55 + amp * b, elF: -18 + 30 * b, hwF: 8, tilt: P.mode === 'fly' ? 10 : 3, head: -4, fyN: 0.8, fyF: 0.78, fxN: -0.15, fxF: -0.2, toeN: 30, toeF: 26 }, flyK);
    const op = (0.55 + 0.45 * hard) * flyK;
    q.open = [Math.max(q.open[0], op), Math.max(q.open[1], op * 0.95)];
    q.earOut = Math.max(q.earOut, flyK * 0.6);
    if (P.mode === 'fly' || (P.mode === 'rise' && casting === 'swoop')) q.trail = flyK;
    if (P.mode === 'lift') {
      // her feet gripping Rondo's flippers below her: down, not tucked
      go({ fyN: 0.1, fyF: 0.1, fxN: 0, fxF: 0, toeN: -10, toeF: -10 }, flyK);
      face = 'determined';
      q.mouth = 'smile';
      q.blush = 0.6;
      busy = true;
    } else if (flying) {
      face = 'sparkly';
      q.mouth = P.mode === 'fly' ? 'open' : 'smile';
      busy = true;
    }
  }
  // ---- her casts ----
  if (casting && m.hp > 0) {
    busy = true;
    if (casting === 'echo' || casting === 'rings') {
      // hanging, wings opening as she listens, eyes closing; singing softly for the rings
      const op = sstep((u - 0.55) / Math.max(0.4, dur - 0.75));
      q.open = [op, op * 0.95];
      go({ shN: mix(-26, -112, op), elN: mix(60, 22, op), hwN: mix(10, -10, op), shF: mix(24, 108, op), elF: mix(-54, -20, op), hwF: mix(-8, 12, op), chest: -5 * sstep((u - dur + 0.5) / 0.5), head: -6 }, hang);
      q.earOut = op;
      const shut = sstep((u - 0.9) / 0.8);
      face = shut > 0.6 ? 'listen' : 'dreamy';
      blink = shut;
      q.mouth = casting === 'rings' && u > 1 ? (Math.sin(u * 5) > 0 ? 'o' : 'tilde') : 'smile';
      q.blush = 0.4;
    } else if (casting === 'kiss') {
      // a paw to her lips, puckered, sparkly-eyed
      const k = sstep(u / 0.5);
      go({ shN: -150, elN: -105, hwN: -20, head: -4 }, k);
      face = 'sparkly';
      q.mouth = 'o';
      q.blush = 0.8;
    } else if (casting === 'bow') {
      face = 'sparkly';
      q.mouth = 'smile';
      q.blush = 0.5;
    } else if (casting === 'swoop') {
      face = u < dur * 0.6 ? 'sparkly' : 'determined';
      q.mouth = 'smile';
    } else if (casting === 'lift') {
      face = 'determined';
      q.mouth = 'smile';
    }
  }
  // ---- their releases ----
  if (rel && m.hp > 0 && !casting) {
    if ((rel === 'echo' || rel === 'rings') && rs < (rel === 'rings' ? 2.7 : 1.8)) {
      busy = true;
      const op = 1 - sstep((rs - (rel === 'rings' ? 2.2 : 1.2)) / 0.5);
      q.open = [op, op * 0.95];
      go({ shN: mix(-26, -112, op), elN: mix(60, 22, op), hwN: mix(10, -10, op), shF: mix(24, 108, op), elF: mix(-54, -20, op), hwF: mix(-8, 12, op), head: -6 }, hang);
      q.earOut = op;
      face = 'listen';
      const singing = rel === 'rings' ? rs < 2.4 : rs < 1.2;
      q.mouth = singing ? (rel === 'rings' && Math.sin(rs * 6) < 0 ? 'o' : 'tilde') : 'smile';
      const from = rel === 'rings' && m.ringsAt != null ? now - m.ringsAt : rs;
      q.wave = { u: from, n: rel === 'rings' ? 9 : 4, every: rel === 'rings' ? 0.28 : 0.24 };
      q.blush = 0.7;
    } else if (rel === 'kiss' && rs < 1.6) {
      busy = true;
      // three blown kisses: her paw flung out from her lips each time
      const blow = pulse(rs, 0, 0.3) + pulse(rs, 0.3, 0.3) + pulse(rs, 0.6, 0.3);
      go({ shN: -150 + blow * 60, elN: -105 + blow * 90, hwN: -20 + blow * 30, head: -4 - blow * 4 }, 1 - sstep((rs - 1.0) / 0.5));
      q.kiss = rs;
      face = rs < 1.0 ? 'giggle' : 'sparkly';
      q.mouth = rs < 0.9 ? (blow > 0.5 ? 'o' : 'smile') : 'smile';
      q.blush = 0.9;
    } else if (rel === 'bow' && rs < 1.8) {
      busy = true;
      // an upside-down curtsy: wings spread like a skirt, a dip of her head, eyes shut, pleased
      const k = win(rs, 0, 0.35, 1.2, 1.8);
      q.open = [0.55 * k, 0.5 * k];
      go({ shN: -80, elN: 20, shF: 80, elF: -20, head: 16, tilt: 6 }, k);
      face = 'giggle';
      q.mouth = 'smile';
      q.blush = 0.8;
    }
  }
  // ---- the entrance's acts ----
  if (act && au >= 0 && m.hp > 0) {
    if (act.move === 'ribbondrop') {
      face = au < (act.dur ?? 1.8) ? 'dreamy' : 'sparkly';
      q.mouth = 'smile';
      q.blush = 0.5;
    } else if (act.move === 'bow') {
      const k = win(au, 0, 0.3, (act.dur ?? 1.4) - 0.3, (act.dur ?? 1.4) + 0.2);
      q.open = [0.55 * k, 0.5 * k];
      go({ shN: -80, elN: 20, shF: 80, elF: -20, head: 16, tilt: 6 }, k);
      face = 'giggle';
      q.mouth = 'smile';
      q.blush = 0.8;
      busy = true;
    } else if (act.move === 'flipdown') {
      // the wings flung open as she flips, then wrapping back round her into the cape
      const k = win(au, 0, 0.15, 0.55, 0.9);
      q.open = [0.7 * k, 0.65 * k];
      go({ shN: -100, elN: 20, shF: 100, elF: -20 }, k);
      face = 'sparkly';
      q.mouth = 'open';
      busy = true;
    } else if (act.move === 'perch') {
      face = 'dreamy';
    }
  }
  // ---- a plain swing between casts: a wing buffet, a little ribbon whip, in turn ----
  const since = now - (m.attackAt ?? -99);
  const meleeOn = m.hp > 0 && !casting && !rel && !m.lift && !m.fly && (!act || act.move === 'attack') && ((m.windup ?? 0) > 0 || (since >= 0 && since < 0.75));
  if (meleeOn && !st.mnAtk) {
    st.mnSwN = (st.mnSwN ?? m.uid ?? 0) + 1;
    st.mnSw = SWINGS[st.mnSwN % SWINGS.length];
  }
  st.mnAtk = meleeOn;
  if (meleeOn) {
    busy = true;
    const wk = (m.windup ?? 0) > 0 ? sstep(1 - (m.windup ?? 0) / Math.max(0.2, m.def?.fight?.windup ?? 0.45)) : since >= 0 ? 1 : 0;
    const hit = since >= 0 && since < 0.75 ? (since < 0.16 ? sstep(since / 0.16) : 1 - sstep((since - 0.28) / 0.47)) : 0;
    const pre = since >= 0 ? 1 - hit : wk;
    if (st.mnSw === 'buffet') {
      // the near wing drawn back and open, then swept forward: a soft gust
      go({ shN: 22, elN: 14, tilt: -4, head: -4 }, pre);
      go({ shN: -92, elN: -6, tilt: 6, x: 0.03 }, hit);
      q.open[0] = Math.max(q.open[0], 0.75 * Math.max(pre, hit));
      if (since >= 0 && since < 0.5) q.gust = since / 0.5;
    } else {
      // a little rose ribbon in her paw, drawn back over her shoulder, then whipped forward
      go({ shN: -140, elN: -60, hwN: -16, tilt: -3 }, pre);
      go({ shN: -78, elN: -16, hwN: 14, tilt: 5, x: 0.02 }, hit);
      q.whip = since >= 0 ? clamp(since / 0.6, 0, 1) : -wk;
    }
    face = hit > 0.3 ? 'giggle' : 'peek';
    q.mouth = hit > 0.3 ? 'wide' : 'pout';
  }
  // ---- her faces outside the act ----
  const low = m.hp > 0 && m.def?.hp && m.hp / m.def.hp < 0.3;
  if (m.hp <= 0) {
    face = 'dead';
    q.mouth = 'o';
    q.dizzy = 1;
    // limp: wings drooping half open
    go({ shN: -40, elN: 30, shF: 40, elF: -30, head: 14 }, hang);
    q.open = [0.3 * hang, 0.25 * hang];
    if (hang < 0.5) go({ drop: 0.6, tilt: -10, head: 18 });
  } else if (hurt) {
    face = 'hurt';
    q.mouth = 'pout';
    const k = 1 - sstep(hurtU / 0.45);
    go({ tilt: -8 * k, head: -10 * k });
    q.blush = 0.8;
  } else if (!busy) {
    if (mood === 'angry') {
      face = 'cross';
      q.mouth = 'pout';
    } else if (mood === 'sad') {
      face = 'sad';
      q.mouth = 'pout';
      q.tears = 0.8;
    } else if (mood === 'happy') {
      face = 'sparkly';
      q.mouth = 'wide';
      q.blush = 0.6;
    } else if (mood === 'hurt') {
      face = 'hurt';
      q.mouth = 'pout';
    } else if (mood === 'blink' || mood === 'sleep') {
      face = 'sleep';
      q.z = 1;
      go({ head: 10 }, 1);
    } else if (m.alone) {
      // her partner has fallen: teary but brave
      face = 'brave';
      q.mouth = 'pout';
      q.tears = 1;
    } else if (low) {
      face = 'worried';
      q.mouth = 'o';
      q.sweat = (t * 0.6) % 1;
    } else if (m.engaged || a.mood === 'angry' || (m.aggroUntil ?? 0) > now) {
      face = 'peek';
      q.mouth = 'pout';
    }
  } else if (m.alone && !hurt) q.tears = 0.7;
  // ---- her idle act (standing about, or hanging about) ----
  const calmK = (a.calm ?? 1) * (1 - walkW) * (casting || rel || meleeOn || m.hp <= 0 || hurt || m.engaged || mood || m.alone || flyK > 0.3 || (act && act.move !== 'perch' && act.move !== 'ribbondrop') ? 0 : 1);
  if (calmK > 0.02) {
    const lu = (t + ((m.uid ?? 0) % 7) * 2.3) % CYCLE;
    const at = (k) => k * calmK > 0.45;
    const gg = win(lu, 2.4, 2.7, 4.2, 4.6);
    if (gg > 0.01) {
      const b = Math.abs(Math.sin(lu * 14));
      go({ chest: -b * 3, shrugN: b * 4, shrugF: b * 4, head: -4 - b * 2, tilt: 2 }, gg * calmK);
      if (at(gg)) {
        face = 'giggle';
        q.mouth = 'wide';
        q.blush = 0.8;
      }
    }
    q.twitch = pulse(lu, 6.0, 0.22) + pulse(lu, 6.35, 0.18) * 0.6;
    if (lu > 4.8 && lu < 7.4 && calmK > 0.5) q.heart = (lu - 4.8) / 2.6;
    // a peek out of her wing cape (standing only)
    const pk = win(lu, 8.0, 8.6, 10.6, 11.4) * (1 - hang);
    if (pk > 0.01) {
      go({ shN: -96, elN: 30, hwN: -6, head: -8, tilt: -3 }, pk * calmK);
      q.open[0] = Math.max(q.open[0], 0.5 * pk * calmK);
      if (at(pk)) {
        face = lu < 9.0 ? 'peek' : 'sparkly';
        q.mouth = lu < 9.0 ? 'o' : 'smile';
        q.blush = 0.5;
      }
    }
    blink = Math.max(blink, win(lu, 12.6, 13.1, 13.4, 14.0) * calmK);
  }
  // talking: real vowel shapes, eased from one to the next by the clock
  if ((mood === 'talk' || a.mood === 'talk') && m.hp > 0) {
    const V = ['open', 'smile', 'o', 'closed', 'wide', 'o'];
    q.mouth = V[Math.floor(t * 6.5) % V.length];
  }
  // her own blink rhythm otherwise (from her id, a soft quick one)
  if (['dreamy', 'sparkly', 'peek', 'worried', 'brave', 'determined', 'cross'].includes(face)) blink = Math.max(blink, win((t + (m.uid ?? 0) * 0.71) % 5.3, 0, 0.08, 0.14, 0.24));
  // (the face's numbers eased from one expression to the next: an in-between, never a snap)
  const tv = FACES[face] ?? st.mnFV ?? FACES.dreamy;
  st.mnFV = (st.mnFV ?? tv).map((v, i) => (Number.isFinite(v) ? v + (tv[i] - v) * Math.min(1, dt * 13) : tv[i]));
  q.f = { name: face, v: st.mnFV, blink: face === 'listen' ? 0 : blink, bright: face === 'sparkly' || face === 'determined' ? 1.15 : 1 };
  // ---- springs: her ears, the ruff's tufts, the bow's tails, the wing's scallops ----
  const kick = (st.mnLastHd ?? out.head ?? 0) - (out.head ?? 0) + ((st.mnLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.6;
  st.mnLastHd = out.head;
  st.mnLastT = out.tilt;
  const flapK = clamp(((st.mnLastS ?? out.shN ?? 0) - (out.shN ?? 0)) * 0.05, -3, 3);
  st.mnLastS = out.shN;
  const grav = Math.cos(Math.PI * hang);
  q.grav = grav;
  q.ear = [0, 1].map((i) => spring(st, `ear${i}`, Math.sin(t * 1.1 + i * 2) * 0.05 + (i === 0 ? -(q.twitch ?? 0) * 0.28 : 0), 70, 6, dt, kick * 0.004));
  q.ruff = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => spring(st, `rf${i}`, Math.sin(t * 1.3 + i * 0.8) * 0.3 + (out.tilt ?? 0) * -0.04, 70 + i * 5, 6, dt, kick * 0.03));
  q.bowT = [0, 1].map((i) => spring(st, `bw${i}`, Math.sin(t * 1.5 + i * 1.9) * 0.12 + sway * 0.1, 45 + i * 8, 4.5, dt, kick * 0.01 + flapK * 0.2));
  q.tips = [0, 1].map((w) => [0, 1, 2, 3].map((i) => {
    const bx = spring(st, `tx${w}${i}`, Math.sin(t * 1.2 + i * 1.1 + w) * 0.35 + sway * 0.4, 60 + i * 8, 5, dt, (kick * 0.05 + flapK) * (i + 1) * 0.3);
    const by = spring(st, `ty${w}${i}`, Math.cos(t * 1.4 + i * 0.9 + w) * 0.25 + (1 - grav) * 0.6, 70 + i * 6, 5.5, dt, kick * 0.02);
    return [bx, by];
  }));
}

// ---------- Effects (the rig's space, facing right; inside her turn-over when she hangs) ----------
function fx(ctx, m, a, S, matOf, D) {
  const q = a.mnQ;
  if (!q) return;
  const t = a.t ?? 0;
  const g = q.grav ?? 1;
  ctx.save();
  // (the head's points: anything that floats "up" goes the way that's up in the room)
  const crown = headAt(a, D, [TX - 2, -24]);
  const up = (p, d) => [p[0], p[1] - d * g];
  if (q.wave) {
    for (let i = 0; i < q.wave.n; i++) waves(ctx, a, D, q.wave.u - i * q.wave.every, i);
  }
  if (q.heart != null) {
    const u = q.heart;
    const p = up(headAt(a, D, [TX - 16 + Math.sin(u * 6) * 3, -26]), u * 26 * 0.42);
    ctx.globalAlpha = Math.min(1, u * 6) * (1 - sstep((u - 0.6) / 0.4));
    heartUp(ctx, p[0], p[1], 2.2 + u * 0.8, '#ffa6c8', g);
    sparkle(ctx, p[0] + 3.4, p[1] - 2.6 * g, 1.0 * Math.sin(Math.PI * u), '#fff0f8');
    ctx.globalAlpha = 1;
  }
  // three blown kisses: hearts floating off her lips, away ahead of her, bobbing
  if (q.kiss != null) {
    const lips = headAt(a, D, [TX + 14, 10]);
    for (let i = 0; i < 3; i++) {
      const v = (q.kiss - i * 0.3) / 1.2;
      if (v <= 0 || v >= 1) continue;
      const e = easeOut(v);
      const x = lips[0] + 4 + e * 34;
      const y = lips[1] - (Math.sin(v * 7 + i) * 2.4 + e * 6) * g;
      ctx.globalAlpha = Math.min(1, v * 8) * (1 - sstep((v - 0.7) / 0.3));
      heartUp(ctx, x, y, 2.4 + e * 1.2, i === 1 ? '#ff8fb8' : '#ffa6c8', g);
      sparkle(ctx, x - 3, y + 2 * g, 0.9 * (1 - v), '#fff0f8');
    }
    ctx.globalAlpha = 1;
  }
  // the swoop's trail: soft lilac air ripples streaming off behind her, sparkles in it
  if (q.trail > 0.05) {
    const c = headAt(a, D, [0, 22]);
    for (let i = 0; i < 4; i++) {
      const v = (t * 1.6 + i / 4) % 1;
      const x = c[0] - 10 - v * 30;
      const y = c[1] + (i - 1.5) * 5;
      ctx.globalAlpha = q.trail * (1 - v) * 0.75;
      pen(ctx, WAVE[i % WAVE.length], 1.6 * (1 - v * 0.5));
      ctx.beginPath();
      ctx.arc(x, y, 4 + v * 5, -0.9, 0.9);
      ctx.stroke();
      if (i % 2) sparkle(ctx, x - 4, y - 2, 1.1 * (1 - v), '#fff0ff');
    }
    ctx.globalAlpha = 1;
  }
  // a wing buffet's soft gust: rounded air arcs rolling out ahead of her
  if (q.gust >= 0) {
    const tip = ptOf(a, D, 'handN', D.J.handN);
    ctx.globalAlpha = 0.8 * (1 - q.gust);
    for (let i = 0; i < 3; i++) {
      pen(ctx, i % 2 ? '#ffffff' : WAVE[0], 1.4);
      ctx.beginPath();
      ctx.arc(tip[0] + 6 + q.gust * 18, tip[1] + (i - 1) * 6, 4 + i, -0.9, 0.9);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // the little ribbon whip: a short rose ribbon from her paw, trailing her swing, a sparkle at its end
  if (q.whip !== -1) {
    const hand = ptOf(a, D, 'handN', D.J.handN);
    const k = q.whip;
    // (wound up: trailing down behind her paw; whipped: swept round to the front, curling at its end,
    // then drooping back)
    const e = k >= 0 ? easeOut(k / 0.5) * (1 - sstep((k - 0.55) / 0.45)) : 0;
    let an = mix(2.3, 0.15, e) + Math.sin(t * 6) * 0.08;
    const pts = [hand];
    for (let i = 1; i <= 5; i++) {
      an += (e > 0.3 ? 0.42 : -0.18) * (0.6 + i * 0.12) + Math.sin(t * 9 + i) * 0.04;
      const p = pts[i - 1];
      pts.push([p[0] + Math.cos(an) * 2.1, p[1] + Math.sin(an) * 2.1]);
    }
    pen(ctx, RIBBON[3], 1.9);
    sline(ctx, pts);
    ctx.stroke();
    pen(ctx, RIBBON[1], 1.15);
    sline(ctx, pts);
    ctx.stroke();
    if (k >= 0 && k < 0.6) sparkle(ctx, pts[5][0], pts[5][1], 2.4 * (1 - k / 0.6), '#fff0f8');
  }
  // tears (sad, or brave and alone): little drops rolling down from the eyes' outer corners
  if (q.tears > 0) {
    for (const [ex, side] of [[TX - 7.6, -1], [TX + 6.4, 1]]) {
      const u2 = ((t * 0.9 + (side > 0 ? 0.4 : 0)) % 1);
      const p = headAt(a, D, [ex + side * 6.2, -1 + u2 * 7]);
      ctx.globalAlpha = Math.sin(Math.PI * u2) * q.tears;
      drop(ctx, p[0], p[1], 1.1, g);
    }
    ctx.globalAlpha = 1;
  }
  if (q.sweat >= 0) {
    const p = headAt(a, D, [TX + 17, -12 + q.sweat * 3]);
    drop(ctx, p[0], p[1], 1.3, g);
  }
  // asleep: a lilac "z" drifting up off her head (up in the room, whichever way she hangs)
  if (q.z > 0) {
    for (let i = 0; i < 2; i++) {
      const v = (t * 0.35 + i * 0.5) % 1;
      const p = up(headAt(a, D, [TX + 6 + v * 6, -22]), v * 8);
      const z = 1.8 + v * 1.2;
      ctx.globalAlpha = Math.sin(Math.PI * v) * 0.95;
      ctx.save();
      ctx.translate(p[0], p[1]);
      if (g < 0) ctx.scale(1, -1);
      ctx.beginPath();
      ctx.moveTo(-z * 0.5, -z * 0.5);
      ctx.lineTo(z * 0.5, -z * 0.5);
      ctx.lineTo(-z * 0.5, z * 0.5);
      ctx.lineTo(z * 0.5, z * 0.5);
      pen(ctx, '#ffffff', 1.3);
      ctx.stroke();
      pen(ctx, '#8a6ab8', 0.65);
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  // beaten: soft dizzy stars wheeling round her head
  if (q.dizzy > 0) {
    for (let i = 0; i < 3; i++) {
      const an = t * 2.4 + (i * TAU) / 3;
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin(an);
      sparkle(ctx, crown[0] + Math.cos(an) * 9, crown[1] + Math.sin(an) * 2.6, 1.8, i % 2 ? '#fff3b8' : '#ffd6e8');
    }
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}
// A soft little drop (a tear, a bead of sweat), its point the way that's up.
function drop(ctx, x, y, k, g) {
  ctx.beginPath();
  ctx.moveTo(x, y - k * g);
  ctx.quadraticCurveTo(x + k * 0.8, y + k * 0.3 * g, x, y + k * 0.8 * g);
  ctx.quadraticCurveTo(x - k * 0.8, y + k * 0.3 * g, x, y - k * g);
  ctx.fillStyle = 'rgba(200,236,255,0.95)';
  ctx.fill();
}
// A soft little heart (round lobes, a rounded point), a white rim; upright in the room.
function heartUp(ctx, x, y, k, col, g = 1) {
  ctx.save();
  ctx.translate(x, y);
  if (g < 0) ctx.scale(1, -1);
  heart(ctx, 0, 0, k, col);
  ctx.restore();
}
function heart(ctx, x, y, k, col) {
  ctx.beginPath();
  ctx.moveTo(x + k * 0.22, y + k * 0.72);
  ctx.quadraticCurveTo(x, y + k * 0.98, x - k * 0.22, y + k * 0.72);
  ctx.bezierCurveTo(x - k * 1.5, y - k * 0.1, x - k * 0.9, y - k * 1.3, x, y - k * 0.45);
  ctx.bezierCurveTo(x + k * 0.9, y - k * 1.3, x + k * 1.5, y - k * 0.1, x + k * 0.22, y + k * 0.72);
  ctx.closePath();
  pen(ctx, '#ffffff', k * 0.45);
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
}
// The echo: soft pastel sound arcs rippling out from her mouth (one wave, `rs` since it set out),
// thick in the middle, thinning to round ends, lilac to pink, fading as it spreads, sparkles riding it.
function waves(ctx, a, D, rs, i0 = 0) {
  const mo = headAt(a, D, [TX + 13.6, 10.5]);
  const fwd = headAt(a, D, [TX + 34, 10.5]);
  const dir = Math.atan2(fwd[1] - mo[1], fwd[0] - mo[0]);
  for (let i = 0; i < 4; i++) {
    const v = (rs + 0.22 - i * 0.24) / 1.1;
    if (v <= 0 || v >= 1) continue;
    if (i0 > 0 && i > 0) continue;
    const e = 1 - (1 - v) ** 2;
    const R = 3 + e * 34;
    const al = Math.min(1, v * 8) * (1 - sstep((v - 0.45) / 0.55));
    const spread = 0.75 + e * 0.35;
    const col = WAVE[(i + i0) % WAVE.length];
    for (const [side, k] of [[0, 1], [Math.PI, 0.55]]) {
      const c0 = dir + side;
      ctx.globalAlpha = al * k;
      const w = (2.6 - e * 1.4) * k;
      ctx.beginPath();
      ctx.arc(mo[0], mo[1], R + w / 2, c0 - spread, c0 + spread);
      ctx.arc(mo[0], mo[1], R - w / 2, c0 + spread, c0 - spread, true);
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
      for (const sgn of [-1, 1]) {
        const an = c0 + sgn * spread;
        ell(ctx, mo[0] + Math.cos(an) * R, mo[1] + Math.sin(an) * R, w / 2, w / 2);
        ctx.fill();
      }
      ctx.globalAlpha = al * k * 0.8;
      pen(ctx, '#ffffff', Math.max(0.3, w * 0.28));
      ctx.beginPath();
      ctx.arc(mo[0], mo[1], R - w * 0.12, c0 - spread * 0.7, c0 + spread * 0.5);
      ctx.stroke();
      if (side === 0) {
        for (const s of [-0.55, 0.35]) {
          const an = c0 + s * spread;
          sparkle(ctx, mo[0] + Math.cos(an) * R, mo[1] + Math.sin(an) * R, 1.2 * (1 - v * 0.5), (i + i0) % 2 ? '#fff6ff' : '#ffe0f0');
        }
      }
    }
  }
  ctx.globalAlpha = 1;
}
// The ribbon: pale rose silk from the ceiling (up out of the picture) down to her ankles, a soft
// wave down it and a turn of it round her ankles; drawn in the room, behind her.
function ribbon(ctx, feet, h, t) {
  const al = sstep((h - 0.2) / 0.5);
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = al;
  const top = -460;
  const n = 14;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const v = i / n;
    pts.push([feet[0] + Math.sin(v * 7 + t * 1.3) * 2.2 * v + v * 6, mix(feet[1] - 2, top, v)]);
  }
  const w = 3.6;
  const L = [];
  const R = [];
  for (let i = 0; i <= n; i++) {
    const tw = Math.abs(Math.cos(i * 0.5 + t * 0.6)) * 0.7 + 0.3;
    L.push([pts[i][0] - (w * tw) / 2, pts[i][1]]);
    R.push([pts[i][0] + (w * tw) / 2, pts[i][1]]);
  }
  ctx.beginPath();
  ctx.moveTo(...L[0]);
  for (const p of L.slice(1)) ctx.lineTo(...p);
  for (const p of R.reverse()) ctx.lineTo(...p);
  ctx.closePath();
  ctx.fillStyle = RIBBON[2];
  ctx.strokeStyle = RIBBON[3];
  ctx.lineWidth = 1;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fill();
  pen(ctx, RIBBON[0], 0.9);
  sline(ctx, pts.slice(0, n).map(([x, y]) => [x - 0.5, y]));
  ctx.stroke();
  ell(ctx, feet[0] + 1, feet[1] + 1, 5.4, 2.6, 0.1);
  ctx.fillStyle = RIBBON[1];
  ctx.fill();
  ctx.strokeStyle = RIBBON[3];
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

const DRESS = {
  id: 'waltzbat',
  skin: { lt: FUR[1], base: FUR[2], sh: FUR[3], deep: FUR[4], ink: INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  under: {
    neckSkin: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'back'),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      belly(ctx, a, mode, D);
    },
    neckSkin: (ctx, a, mode, S, D) => ruff(ctx, a, mode, D),
    handFskin: (ctx, a, mode, S, D) => wing(ctx, a, mode, D, 'F'),
    handNskin: (ctx, a, mode, S, D) => wing(ctx, a, mode, D, 'N'),
    footFskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => foot(ctx, a, mode, D, 'N'),
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'front'),
  },
  pose,
  fx,
};
const R = dressRig('bat', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
// Round her rig: her turn-over onto the ribbon (turned about her middle: a pose, never a stretch;
// a clean mirror flip at the half turn, so she still faces the way she faced), the ribbon's height,
// her flight, and the swing of her hang.
rig.draw = (ctx, m, a) => {
  const P = place(m, a);
  const h = P.h;
  const th = Math.PI * h;
  const ty = -(UP * sstep(h) + P.up * Math.min(1, h * 1.5)) - P.fly;
  ctx.save();
  // (where her feet are in the room as she hangs: the ribbon's end and the pendulum's pivot)
  const feet = [MID * Math.sin(th), MID * (1 - Math.cos(th)) + ty];
  if (h > 0.001) {
    ctx.translate(feet[0], feet[1]);
    ctx.rotate(P.sway);
    ctx.translate(-feet[0], -feet[1]);
    ribbon(ctx, feet, h, a.t ?? 0);
  }
  ctx.translate(0, ty);
  if (h > 0.001) {
    ctx.translate(0, MID);
    ctx.rotate(th);
    if (h > 0.5) ctx.scale(-1, 1);
    ctx.translate(0, -MID);
  }
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
export const MINUET_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [120, 460, 220, 260], draw: R.still, rig, noHop: true };
// (her size as drawn, standing: measured on the concept sheet; her pace: a fluttery hover-walk at 40)
export const MINUET_SIZE = { w: 40, h: 64, speed: 40 };
export const DAME_MINUET = { art: MINUET_ART, w: MINUET_SIZE.w, h: MINUET_SIZE.h, speed: MINUET_SIZE.speed };
