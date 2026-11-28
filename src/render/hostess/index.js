// Lady Marigold, the Eternal Hostess, on screen (2026-11-27, remade from scratch; the Moonlit Manor's
// final boss on the rooftop, her story kept). A lonely ghost hostess who has thrown the same midnight party
// for a hundred years with nobody coming; she makes you keep up with her waltz. She moves on her own copy
// of the blank bases' rig (rig.js) on the queen's tall, slender build (body.js) with real legs to dance on,
// dressed here; her head, hair, gown, gloves and slippers drawn here from scratch over the mannequin's
// (never the shared face, never the hero's body).
//   look    moonlit pale skin with a soft glow; plum-wine hair in a side-swept updo with two marigolds
//           pinned in it and two long ringlets; an off-shoulder marigold bodice with a frill of cream
//           petals and a plum sash; a skirt of long marigold petals hung from her waist, each its own
//           piece swaying on its own (never a rigid bell), split at the front over a sheer glowing
//           underskirt that fades away toward the floor, so her legs show as she dances; long white
//           opera gloves; her dance card (every line blank) on a ribbon at her wrist; a little gold
//           pocket watch at her hip, stopped at midnight; gold dancing slippers.
//   eyes    tall, soft and wistful: a honey iris with a plum rim, a little five-petal glint like a
//           marigold, a long upper lash line with two flicked lashes; fine plum brows. Her own faces:
//           gracious (rest), delighted, pleading, wistful, teary, dreamy (waltzing), focus, hurt, dizzy.
import { dressRig } from './rig.js';
import { drawHeadBack, drawHeadFront, G as HG } from './head.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
function smooth(ctx, pts) {
  ctx.beginPath();
  const n = pts.length;
  const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
  ctx.moveTo(...mid(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...mid(pts[i], pts[(i + 1) % n]));
  ctx.closePath();
}
const flashed = (a, c) => {
  const k = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  if (k <= 0) return c;
  const n = parseInt(c.slice(1, 7), 16);
  const f = (v) => Math.round(v + (255 - v) * k);
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
function glow(ctx, x, y, r, col, al) {
  if (al <= 0.01 || r <= 0) return;
  const n = parseInt(col.slice(1, 7), 16);
  const rgb = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${al})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

// ---------- Her colours ----------
const INK = '#8a4c6a';
const SKIN = ['#f4faff', '#dfeafc', '#c2d3f0', '#a2b6e0'];
const HAIR = ['#c46a92', '#9a3e6a', '#76284e', '#561a3a'];
const GOLDEN = ['#ffe2a0', '#f8b648', '#e88a2a', '#c4661c'];
const CREAM = ['#fffdf4', '#fff4dc', '#f2e0bc'];
const SASH = ['#b0507a', '#8a3460', '#6a2448'];
const GOLD = ['#fff0b4', '#f2c868', '#c8963c'];
const LW = 2;
const paint = (ctx, a, mode, col, w = LW) => {
  if (mode === 'line') {
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
  } else {
    ctx.fillStyle = flashed(a, col);
    ctx.fill();
  }
};
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);

// ---------- Her head (kid units in the head's frame, drawn a little big) ----------
// Built like a real head: the skull, a face fuller at the cheeks tapering to a small soft chin, then the
// hair one size bigger than the skull: an updo at the back, a fringe swept to one side in separate locks
// (a thick lock and thinner ones, a gap where the forehead shows), side locks framing her cheeks down to
// her jaw, tips turned in; the fringe casts a soft shadow on her forehead.
const HS = 1.3;
const HCX = 80.4;
const HCY = 28;
// (the face's outline: temples, cheeks at eye level, the jaw, a small soft chin)
function head(ctx, a, mode, D, part) {
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(-n[0], -n[1]);
  ctx.translate(HCX, HCY - 4.5);
  ctx.scale(HG, HG);
  const q = a.mg ?? {};
  const flash = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  if (part === 'back') drawHeadBack(ctx, a, mode, q, flash);
  else drawHeadFront(ctx, a, mode, q, flash);
  ctx.restore();
}
// ---------- Her gown ----------
// (helpers for the live cloth: a soft line, a little bow)
const line = (ctx, pts, col, w) => {
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  if (pts.length === 3) ctx.quadraticCurveTo(...pts[1], ...pts[2]);
  else for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.stroke();
};
const rgbaOf = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${al})`;
};
// A satin bow at (x, y): two soft loops (each deep inside, lit on its upper curve), a round knot.
function bow(ctx, a, x, y, s, cols, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  for (const sd of [-1, 1]) {
    smooth(ctx, [[0, -0.4], [sd * 2.6, -2.2], [sd * 4.4, -1.6], [sd * 4.6, 0.6], [sd * 3, 1.8], [0, 0.6]]);
    ctx.fillStyle = flashed(a, cols[1]);
    ctx.fill();
    ell(ctx, sd * 2.4, -0.1, 1.3, 0.8, sd * 0.2);
    ctx.fillStyle = flashed(a, cols[2]);
    ctx.fill();
    line(ctx, [[sd * 1.2, -1.4], [sd * 2.8, -2.1], [sd * 4, -1.4]], 'rgba(255,255,255,0.55)', 0.35);
  }
  ell(ctx, 0, 0, 1.2, 1.3);
  ctx.fillStyle = flashed(a, cols[0]);
  ctx.fill();
  ell(ctx, -0.3, -0.4, 0.5, 0.35);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.restore();
}
// A marigold on her gown: three rings of ruffled petals, deep at the heart, gold at the frills.
function marigold(ctx, a, x, y, r, turn = 0) {
  for (const [n, k, c0, c1] of [[11, 1, GOLDEN[3], GOLDEN[1]], [9, 0.74, GOLDEN[2], GOLDEN[0]], [7, 0.46, GOLDEN[2], '#fff4d0']]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * k);
    g.addColorStop(0, flashed(a, c0));
    g.addColorStop(1, flashed(a, c1));
    for (let i = 0; i < n; i++) {
      const an = turn + (i / n) * TAU + k;
      ell(ctx, x + Math.cos(an) * r * 0.52 * k, y + Math.sin(an) * r * 0.52 * k, r * 0.44 * k, r * 0.3 * k, an);
      ctx.fillStyle = g;
      ctx.fill();
    }
  }
  ell(ctx, x, y, r * 0.18, r * 0.18);
  ctx.fillStyle = flashed(a, GOLDEN[3]);
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.32, r * 0.3, r * 0.16, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
}
// Her bare skin round her neckline, shoulders and upper arms, painted in her chest's frame: lit from the
// upper right, cool toward her far side, the head's soft shadow under her chin, the dip at the base of her
// throat, collarbones as soft light-and-shade (never drawn lines), her shoulders rounded with light on
// their tops and shade toward her arms. Her chest and her upper arms are both painted with it, so a
// shoulder flows into her chest with no seam.
function chestSkin(ctx, a, area = [-60, -80, 280, 300]) {
  // (her own skin over the mannequin's shading: lit from the upper right, cool toward her far side)
  ctx.beginPath();
  ctx.rect(...area);
  const sk = ctx.createLinearGradient(56, 0, 104, 0);
  sk.addColorStop(0, flashed(a, SKIN[2]));
  sk.addColorStop(0.22, flashed(a, SKIN[1]));
  sk.addColorStop(0.6, flashed(a, SKIN[0]));
  sk.addColorStop(1, flashed(a, SKIN[1]));
  ctx.fillStyle = sk;
  ctx.fill();
  // (her décolletage: a soft light down its middle, the dip at the base of her throat, her collarbones
  // curving out from it to her shoulders as light above and shade below (never drawn lines), her
  // shoulders round with light on their tops and shade toward her arms, a soft shadow above the
  // middle of her neckline)
  glow(ctx, 82, 54, 10, '#ffffff', 0.32);
  glow(ctx, 80, 50.8, 2.4, SKIN[3], 0.45);
  const soft = (pts, col, al, w) => {
    const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[2][0], pts[2][1]);
    g.addColorStop(0, rgbaOf(col, 0));
    g.addColorStop(0.3, rgbaOf(col, al));
    g.addColorStop(0.75, rgbaOf(col, al));
    g.addColorStop(1, rgbaOf(col, 0));
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    ctx.quadraticCurveTo(...pts[1], ...pts[2]);
    ctx.strokeStyle = g;
    ctx.lineCap = 'round';
    for (const [lw, k] of [[w * 2.2, 0.45], [w, 1]]) {
      ctx.globalAlpha = k;
      ctx.lineWidth = lw;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };
  for (const sd of [-1, 1]) {
    const bone = [[80 + sd * 2.6, 51.6], [80 + sd * 7.4, 49.4], [80 + sd * 13.6, 48.9]];
    soft(bone.map(([x, y]) => [x, y + 0.8]), SKIN[2], 0.38, 0.8);
    soft(bone.map(([x, y]) => [x, y - 0.5]), '#ffffff', 0.45, 0.6);
    glow(ctx, 80 + sd * 18, 48.4, 5, '#ffffff', 0.5);
    glow(ctx, 80 + sd * 22, 54, 6, SKIN[2], 0.45);
  }
  glow(ctx, 80, 56.4, 2.6, SKIN[2], 0.35);
}
// Her neck: the mannequin's neck painted over with her own skin (chestSkin, in her chest's frame) along
// its own outline, so it flows into her shoulders and chest with no seam.
function neckSkinPaint(ctx, a, mode, D) {
  const nk = a.blShapes?.neck;
  if (!nk || mode !== 'fill') return;
  ctx.save();
  if (nk.outline) {
    ctx.beginPath();
    ctx.moveTo(...nk.outline[0]);
    for (const q of nk.outline.slice(1)) ctx.lineTo(...q);
    ctx.closePath();
    ctx.lineWidth = 0.8;
    ctx.save();
    ctx.clip('nonzero');
  } else {
    D.skin.tubePath(ctx, nk.pts, nk.wl.map((w) => w + 0.4));
    ctx.save();
    ctx.clip('nonzero');
  }
  // (only where it rises above her body: over her chest the chest's own painting stays, so no edge)
  const body = a.blTorsoPts;
  if (body) {
    ctx.beginPath();
    ctx.rect(-4000, -4000, 8000, 8000);
    ctx.moveTo(...body[0]);
    for (const p of body.slice(1)) ctx.lineTo(...p);
    ctx.closePath();
    ctx.clip('evenodd');
  }
  const M0 = ctx.getTransform();
  enter(ctx, a, D, 'chest');
  chestSkin(ctx, a);
  ctx.setTransform(M0);
  // (shaped like a neck: round, so deeper down both sides and lit down its front; the jaw's soft
  // shadow across its top; a faint line of each neck muscle running down to the dip of her throat)
  const n = nk.pts.length - 1;
  const top = nk.pts[n];
  const bot = nk.pts[0];
  const d = [top[0] - bot[0], top[1] - bot[1]];
  const L = Math.hypot(...d) || 1;
  const nx = -d[1] / L;
  const ny = d[0] / L;
  const side = (k, u) => {
    const i = Math.round(u * n);
    const p = nk.pts[i];
    return [p[0] + nx * nk.wl[i] * 0.5 * k, p[1] + ny * nk.wl[i] * 0.5 * k];
  };
  // (soft shade down each side, above the choker only, fading out toward it)
  for (const k of [-1, 1]) {
    const a0 = side(k * 0.6, 0.3);
    const a1 = side(k * 0.62, 1);
    const g = ctx.createLinearGradient(a0[0], a0[1], a1[0], a1[1]);
    g.addColorStop(0, rgbaOf(SKIN[2], 0));
    g.addColorStop(0.35, rgbaOf(SKIN[3], k < 0 ? 0.6 : 0.4));
    g.addColorStop(1, rgbaOf(SKIN[3], k < 0 ? 0.6 : 0.4));
    ctx.save();
    ctx.filter = `blur(${(nk.wl[n] * 0.12 * Math.hypot(M0.a, M0.b)).toFixed(1)}px)`;
    line(ctx, [a0, side(k * 0.64, 0.62), a1], g, nk.wl[n] * 0.3);
    ctx.restore();
  }
  // (the jaw's shadow)
  ctx.save();
  const chin = side(0, 0.8);
  ctx.translate(chin[0], chin[1]);
  ctx.scale(1, 0.55);
  glow(ctx, 0, 0, nk.wl[n] * 1.05, SKIN[3], 0.95);
  ctx.restore();
  ctx.restore();
  ctx.restore();
}
// Her upper arms, from the shoulder's round down under her sleeves' bands: the mannequin's arm painted
// over with her own skin (chestSkin, in her chest's frame), so it joins her shoulder smoothly.
function upperArm(ctx, a, mode, D, side) {
  const sh = a.blShapes?.[`arm${side}`];
  if (!sh) return;
  // (her shoulder cap: from a point on her shoulder line toward her neck, the two lines tangent to the
  // round at the top of her arm and the round itself, as one shape, so shoulder and arm always make one
  // smooth curve however the arm swings; never a notch where the arm's round meets the shoulder)
  const neck = ptOf(a, D, 'chest', [80, 47]);
  const sd = Math.sign(sh.sh[0] - neck[0]) || 1;
  const P = ptOf(a, D, 'chest', [80 + sd * 10, 47.8]);
  const c = sh.sh;
  const r = sh.ball + 0.4;
  // (one smooth shoulder: the outline round her shoulder corner, the round at the top of her arm and her
  // upper arm down to the sleeve's band, so body and arm are a single shape however the arm swings: no
  // gap under it where the hair behind shows, no dip where the arm's round meets the corner)
  const i0 = nearestAt(sh.pts, [mix(sh.sh[0], sh.el[0], 0.62), mix(sh.sh[1], sh.el[1], 0.62)]);
  const pts0 = [P, ...Array.from({ length: 24 }, (_, i) => [c[0] + Math.cos((i / 24) * TAU) * r, c[1] + Math.sin((i / 24) * TAU) * r])];
  // (every point here moves smoothly with her, so the shape never pops: her body's edge read at fixed
  // heights, her arm sampled at fixed shares of its length; with the arm hanging, down to the armpit so
  // no gap shows under it; lifted, only the shoulder's round, so no web reaches up to it from her side)
  const lift = clamp((c[1] + r * 2 - sh.el[1]) / (r * 3), 0, 1);
  // (her body's edge round this shoulder: fixed points of her outline, from beside her neck down to her
  // armpit, picked in her rest shape so the same points are used every frame. With the arm lifted the
  // lower ones draw in to the shoulder's round, so no web reaches up to it from her side)
  const body = a.blTorsoPts ?? [];
  const rest = a.blTorsoRest ?? [];
  const spec = a.blTorsoSpec;
  let armpitB = null;
  let armpitA = null;
  if (spec && rest.length === body.length) {
    const rcx = spec.cx;
    const [rsy, rsw] = [spec.shoulder.y, spec.shoulder.w];
    const rnw = spec.shoulder.neckW;
    const pitY = rsy + spec.arm.aw0 * 0.95;
    const rsd = side === 'N' ? 1 : -1;
    let lowY = -Infinity;
    for (let i = 0; i < rest.length; i++) {
      const [rx, ry] = rest[i];
      if (rsd * (rx - rcx) < rnw * 1.4 || ry > pitY || ry < rsy - rsw) continue;
      const e = clamp((ry - rsy) / (pitY - rsy), 0, 1);
      const w = lift * e * e * (3 - 2 * e);
      const p = [mix(body[i][0], c[0], w), mix(body[i][1], c[1], w)];
      pts0.push(p);
      if (ry > lowY) {
        lowY = ry;
        armpitB = p;
      }
    }
  }
  const L = [0];
  for (let i = 1; i < sh.pts.length; i++) L.push(L[i - 1] + Math.hypot(sh.pts[i][0] - sh.pts[i - 1][0], sh.pts[i][1] - sh.pts[i - 1][1]));
  const reach = Math.hypot(sh.el[0] - c[0], sh.el[1] - c[1]) * 0.7;
  const along = (d) => {
    let i = 1;
    while (i < L.length - 1 && L[i] < d) i++;
    const u = clamp((d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]), 0, 1);
    const p0 = sh.pts[i - 1];
    const p1 = sh.pts[i];
    const l = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
    return { p: [mix(p0[0], p1[0], u), mix(p0[1], p1[1], u)], n: [-(p1[1] - p0[1]) / l, (p1[0] - p0[0]) / l], w: mix(sh.wl[i - 1], sh.wl[i], u) };
  };
  for (let k = 0; k <= 6; k++) {
    const { p, n, w } = along((reach * k) / 6);
    const hw = w / 2 + 0.4;
    const e1 = [p[0] + n[0] * hw, p[1] + n[1] * hw];
    const e2 = [p[0] - n[0] * hw, p[1] - n[1] * hw];
    pts0.push(e1, e2);
    if (k === 6) armpitA = sd * (e1[0] - neck[0]) < sd * (e2[0] - neck[0]) ? e1 : e2;
  }
  // (their convex hull, one smooth shape)
  const hull = (() => {
    const ps = pts0.slice().sort((u, v) => u[0] - v[0] || u[1] - v[1]);
    const cross = (o, u, v) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
    const lo = [];
    for (const q of ps) {
      while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
      lo.push(q);
    }
    const up = [];
    for (const q of ps.slice().reverse()) {
      while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
      up.push(q);
    }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  })();
  // (wound the same way as the arm's tube discs, so the clip fills as one)
  let area = 0;
  for (let i = 0; i < hull.length; i++) area += hull[i][0] * hull[(i + 1) % hull.length][1] - hull[(i + 1) % hull.length][0] * hull[i][1];
  const capPts = area >= 0 ? hull : hull.slice().reverse();
  // (the armpit: where her arm's inner edge meets her side, the edge between them curves in toward the
  // shoulder joint, a soft hollow, so the arm reads as growing out of her body; it deepens as the arm
  // opens away from her side and fades to nothing as it closes, so it never pops)
  const gap = armpitA && armpitB ? sd * (armpitA[0] - armpitB[0]) : 0;
  // (and it fades out before any other point of the shape comes near the line between armpit and side,
  // so it is gone before those two stop being neighbours on the outline: no pop)
  let clear = 0;
  if (armpitA && armpitB) {
    const ex = armpitB[0] - armpitA[0];
    const ey = armpitB[1] - armpitA[1];
    const el = Math.hypot(ex, ey) || 1;
    const side = (p) => (ex * (p[1] - armpitA[1]) - ey * (p[0] - armpitA[0])) / el;
    const inner = Math.sign(side(c)) || 1;
    let worst = -Infinity;
    for (const p of pts0) if (p !== armpitA && p !== armpitB) worst = Math.max(worst, -inner * side(p));
    clear = clamp(-worst / 1.4, 0, 1);
  }
  const hollow = clamp(gap / (r * 1.6), 0, 1) * 0.55 * clear;
  const mid = armpitA && armpitB ? [(armpitA[0] + armpitB[0]) / 2, (armpitA[1] + armpitB[1]) / 2] : null;
  const ctrl = mid ? [mix(mid[0], c[0], hollow), mix(mid[1], c[1], hollow)] : null;
  // (the outline as a closed line, the armpit's hollow curved in)
  const ring = [capPts[0]];
  for (let i = 1; i <= capPts.length; i++) {
    const p0 = capPts[i - 1];
    const q = capPts[i % capPts.length];
    const pit = ctrl && hollow > 0.01 && ((p0 === armpitA && q === armpitB) || (p0 === armpitB && q === armpitA));
    if (pit) for (let k = 1; k <= 8; k++) {
      const u = k / 8;
      ring.push([(1 - u) * (1 - u) * p0[0] + 2 * u * (1 - u) * ctrl[0] + u * u * q[0], (1 - u) * (1 - u) * p0[1] + 2 * u * (1 - u) * ctrl[1] + u * u * q[1]]);
    }
    else ring.push(q);
  }
  // (then walked at a fixed number of even steps from where a line straight up from the shoulder joint
  // crosses it, so the corners the hull happens to have this frame never change what is drawn)
  const seg = [];
  let per = 0;
  let start = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x0, y0] = ring[i];
    const [x1, y1] = ring[i + 1];
    if ((x0 - c[0]) * (x1 - c[0]) <= 0 && x0 !== x1) {
      const u = (c[0] - x0) / (x1 - x0);
      if (y0 + (y1 - y0) * u < c[1]) start = per + Math.hypot(x1 - x0, y1 - y0) * u;
    }
    seg.push(per);
    per += Math.hypot(x1 - x0, y1 - y0);
  }
  const N = 72;
  const even = [];
  let j = 0;
  for (let k = 0; k < N; k++) {
    const d = (start + (per * k) / N) % per;
    while (j > 0 && seg[j] > d) j--;
    while (j < seg.length - 1 && seg[j + 1] <= d) j++;
    const l = (seg[j + 1] ?? per) - seg[j] || 1;
    const u = (d - seg[j]) / l;
    even.push([mix(ring[j][0], ring[j + 1][0], u), mix(ring[j][1], ring[j + 1][1], u)]);
  }
  const cap = () => {
    ctx.moveTo(...even[0]);
    for (let k = 1; k < N; k++) ctx.lineTo(...even[k]);
    ctx.closePath();
  };
  if (mode === 'line') {
    ctx.beginPath();
    cap();
    ctx.lineWidth = LW;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
    return;
  }
  const pts = sh.pts.slice(0, i0 + 3);
  const wl = sh.wl.slice(0, i0 + 3).map((w) => w + 0.5);
  ctx.save();
  D.skin.tubePath(ctx, pts, wl);
  cap();
  ctx.clip('nonzero');
  const M0 = ctx.getTransform();
  enter(ctx, a, D, 'chest');
  chestSkin(ctx, a);
  ctx.setTransform(M0);
  // (the armpit's soft crease, just inside its hollow)
  if (ctrl && hollow > 0.01) {
    const g = ctx.createLinearGradient(armpitB[0], armpitB[1], armpitA[0], armpitA[1]);
    g.addColorStop(0, rgbaOf(SKIN[3], 0));
    g.addColorStop(0.45, rgbaOf(SKIN[3], 0.75 * (hollow / 0.55)));
    g.addColorStop(1, rgbaOf(SKIN[3], 0));
    ctx.beginPath();
    ctx.moveTo(...armpitB);
    ctx.quadraticCurveTo(mix(ctrl[0], c[0], 0.2), mix(ctrl[1], c[1], 0.2), ...armpitA);
    ctx.strokeStyle = g;
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}
// Her neckline's line across her chest (u 0..1 from side to side, in her chest's frame): a sweetheart,
// rising in two soft curves and dipping in the middle.
const sweet = (u) => 54.4 - 1.7 * Math.sin(Math.PI * 2 * u) ** 2 + 1.4 * Math.exp(-(((u - 0.5) / 0.07) ** 2));
// The bodice: marigold satin fitted to her torso, lit down the front and deep at the sides, two princess
// seams, a fine gold-thread vine embroidered up its middle to a little marigold; a gold piping under a
// two-layer frill of cream chiffon at the off-shoulder neckline; the plum sash and its bow at her waist,
// the watch on its chain at her hip.
function bodice(ctx, a, mode, S, D) {
  const pts = a.blTorsoPts;
  if (mode === 'line') {
    skirt(ctx, a, mode, D);
    return;
  }
  skirt(ctx, a, mode, D, 'long');
  if (!pts) return;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.clip();
  // her bare shoulders and chest shaded like Fawnelle's skin: the head's soft shadow under her chin, the
  // dip at the base of her throat, collarbones as soft light-and-shade (never drawn lines), her shoulders
  // rounded with light on their tops and shade toward her arms
  ctx.save();
  enter(ctx, a, D, 'chest');
  chestSkin(ctx, a, [40, 20, 80, 42]);
  ctx.restore();
  // (the bodice ends at her waist in a soft point under the sash; below it only her petals)
  const M0 = ctx.getTransform();
  ctx.save();
  enter(ctx, a, D, 'torso');
  const wj = D.J.waist;
  ctx.beginPath();
  ctx.moveTo(wj[0] - 40, wj[1] - 80);
  ctx.lineTo(wj[0] + 40, wj[1] - 80);
  ctx.lineTo(wj[0] + 40, wj[1] + 1.6);
  ctx.quadraticCurveTo(wj[0] + 6, wj[1] + 2.4, wj[0], wj[1] + 6.2);
  ctx.quadraticCurveTo(wj[0] - 6, wj[1] + 2.4, wj[0] - 40, wj[1] + 1.6);
  ctx.closePath();
  ctx.setTransform(M0);
  ctx.clip();
  ctx.save();
  enter(ctx, a, D, 'chest');
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) {
    const u = -0.06 + (i / 24) * 1.12;
    const p = [mix(63, 97, u), sweet(clamp(u, 0, 1)) - 0.2];
    if (i) ctx.lineTo(...p);
    else ctx.moveTo(...p);
  }
  ctx.lineTo(102, 100);
  ctx.lineTo(58, 100);
  ctx.closePath();
  const g = ctx.createLinearGradient(60, 0, 100, 0);
  g.addColorStop(0, flashed(a, GOLDEN[3]));
  g.addColorStop(0.3, flashed(a, GOLDEN[1]));
  g.addColorStop(0.55, flashed(a, '#ffc860'));
  g.addColorStop(0.8, flashed(a, GOLDEN[1]));
  g.addColorStop(1, flashed(a, GOLDEN[2]));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 76, 62, 11, GOLDEN[0], 0.85);
  glow(ctx, 80, 86, 12, GOLDEN[3], 0.28);
  // the princess seams, each with a thread of light beside it
  for (const sd of [-1, 1]) {
    line(ctx, [[80 + sd * 9, 58], [80 + sd * 6.4, 70], [80 + sd * 7.4, 84]], rgbaOf(GOLDEN[3], 0.45), 0.45);
    line(ctx, [[80 + sd * 9 - 0.6, 58.4], [80 + sd * 6.4 - 0.6, 70], [80 + sd * 7.4 - 0.6, 84]], 'rgba(255,250,220,0.45)', 0.3);
  }
  // the satin's soft sheen down the front
  const sg = ctx.createLinearGradient(74, 0, 82, 0);
  sg.addColorStop(0, 'rgba(255,255,240,0)');
  sg.addColorStop(0.5, 'rgba(255,255,240,0.42)');
  sg.addColorStop(1, 'rgba(255,255,240,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(74, 58, 8, 30);
  // her figure (2026-11-28, "it should be seductive and nice not just ugly and flat"): the satin rounds
  // over her bust under each curve of the sweetheart, light on the upper curve, a soft shade where it
  // turns under and a soft valley between
  for (const sd of [-1, 1]) {
    const bx = 80 + sd * 8.2;
    ctx.save();
    ctx.translate(bx, 59.6);
    ctx.scale(1, 0.8);
    const rg = ctx.createRadialGradient(-sd * 0.8, -2.6, 0.4, 0, 0, 8.6);
    rg.addColorStop(0, 'rgba(255,250,224,0.75)');
    rg.addColorStop(0.45, 'rgba(255,240,190,0.28)');
    rg.addColorStop(0.78, rgbaOf(GOLDEN[3], 0));
    rg.addColorStop(0.92, rgbaOf(GOLDEN[3], 0.32));
    rg.addColorStop(1, rgbaOf(GOLDEN[3], 0));
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(0, 0, 8.6, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  const vg = ctx.createLinearGradient(77.6, 0, 82.4, 0);
  vg.addColorStop(0, rgbaOf(GOLDEN[3], 0));
  vg.addColorStop(0.5, rgbaOf(GOLDEN[3], 0.3));
  vg.addColorStop(1, rgbaOf(GOLDEN[3], 0));
  ctx.fillStyle = vg;
  ctx.fillRect(77.6, 54, 4.8, 8);
  // the embroidered vine: a fine gold stem curling up the front, small leaves on alternate sides, a
  // little marigold where it ends
  line(ctx, [[80, 80], [78, 73], [80, 67]], flashed(a, GOLD[2]), 0.75);
  line(ctx, [[80, 67], [82, 63.4], [80.4, 61]], flashed(a, GOLD[2]), 0.7);
  line(ctx, [[80, 80], [78, 73], [80, 67]], 'rgba(255,246,200,0.8)', 0.3);
  for (const [lx, ly, an] of [[77.2, 75.6, -2.5], [79.6, 70.4, -0.6], [82.4, 64.6, -0.4], [79.6, 65.6, -2.7]]) {
    ell(ctx, lx, ly, 1.4, 0.6, an);
    ctx.fillStyle = flashed(a, GOLD[0]);
    ctx.fill();
    ctx.strokeStyle = flashed(a, GOLD[2]);
    ctx.lineWidth = 0.22;
    ctx.stroke();
  }
  marigold(ctx, a, 80.4, 60.2, 1.9, 0.3);
  ctx.restore();
  ctx.restore();
  ctx.restore();
  ctx.restore();
  // the neckline: gold piping, then the frill of cream chiffon in two layers, each a band whose lower
  // edge falls in soft scallops (never a row of beads), a fold down each scallop, light on the top layer
  // (locked to her: clipped to her body's own outline this frame, so its ends never hang out past her
  // sides as her shoulders move)
  const bodyClip = () => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (const p of pts.slice(1)) ctx.lineTo(...p);
    ctx.closePath();
    ctx.clip();
  };
  ctx.save();
  bodyClip();
  enter(ctx, a, D, 'chest');
  const neck = (u, dy = 0) => [mix(63, 97, u), sweet(u) + dy];
  const frill = (dy, N, depth, col, shade, t0) => {
    ctx.beginPath();
    ctx.moveTo(...neck(0, dy));
    for (let i = 1; i <= 12; i++) ctx.lineTo(...neck(i / 12, dy));
    for (let i = 0; i < N; i++) {
      const p0 = neck(1 - i / N, dy);
      const p1 = neck(1 - (i + 1) / N, dy);
      ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, Math.max(p0[1], p1[1]) + depth, p1[0], p1[1] + 1.2);
    }
    ctx.closePath();
    ctx.fillStyle = flashed(a, col);
    ctx.fill();
    ctx.save();
    ctx.clip();
    for (let i = 0; i < N; i++) {
      const u = (i + 0.5) / N;
      const p = neck(u, dy);
      line(ctx, [[p[0] + t0, p[1] + 0.4], [p[0] + t0 * 0.4, p[1] + depth * 0.5], [p[0], p[1] + depth * 0.9]], rgbaOf(shade, 0.7), 0.4);
    }
    const fg = ctx.createLinearGradient(0, 53, 0, 60);
    fg.addColorStop(0, 'rgba(255,255,255,0.55)');
    fg.addColorStop(1, 'rgba(240,215,170,0.25)');
    ctx.fillStyle = fg;
    ctx.fillRect(58, 50, 44, 14);
    ctx.restore();
  };
  frill(1.2, 7, 4.8, CREAM[1], CREAM[2], 0.6);
  line(ctx, Array.from({ length: 13 }, (_, i) => neck(i / 12, 0.4)), flashed(a, GOLD[1]), 0.7);
  frill(0, 6, 3.6, CREAM[0], CREAM[2], -0.5);
  glow(ctx, 74, 54, 7, '#ffffff', 0.7);
  ctx.restore();
  // the plum sash: satin, lit along its top, gold-edged, soft creases toward its bow (its band locked to
  // her waist's own outline too)
  ctx.save();
  const M1 = ctx.getTransform();
  bodyClip();
  enter(ctx, a, D, 'torso');
  const w = D.J.waist;
  smooth(ctx, [[w[0] - 13, w[1] - 2.4], [w[0] + 13, w[1] - 2.4], [w[0] + 13.4, w[1] + 2.4], [w[0] - 13.4, w[1] + 2.4]]);
  const sgr = ctx.createLinearGradient(0, w[1] - 2.4, 0, w[1] + 2.4);
  sgr.addColorStop(0, flashed(a, SASH[0]));
  sgr.addColorStop(0.45, flashed(a, SASH[1]));
  sgr.addColorStop(1, flashed(a, SASH[2]));
  ctx.fillStyle = sgr;
  ctx.fill();
  ctx.save();
  ctx.clip();
  line(ctx, [[w[0] - 12, w[1] - 1.5], [w[0], w[1] - 1.9], [w[0] + 12, w[1] - 1.5]], 'rgba(255,220,236,0.45)', 0.5);
  for (const dx of [-6, -3]) line(ctx, [[w[0] + dx, w[1] - 2.2], [w[0] + dx - 1.4, w[1]], [w[0] + dx - 0.6, w[1] + 2.2]], rgbaOf(SASH[2], 0.6), 0.35);
  ctx.restore();
  line(ctx, [[w[0] - 13, w[1] - 2.3], [w[0] + 13, w[1] - 2.3]], flashed(a, GOLD[1]), 0.35);
  line(ctx, [[w[0] - 13.3, w[1] + 2.3], [w[0] + 13.3, w[1] + 2.3]], flashed(a, GOLD[2]), 0.35);
  // (the tails, the bow, the brooch and the watch hang free of the clip)
  ctx.restore();
  ctx.save();
  ctx.setTransform(M1);
  enter(ctx, a, D, 'torso');
  // its tails: V-cut, swaying, a fold down each
  const sa = (a.mgSash ?? 0) * 1.8;
  for (const sd of [-1, 1]) {
    const r0 = [w[0] - 9, w[1] + 0.6];
    const tip = [w[0] - 9 + sd * 2.4 - sa, w[1] + 11 + Math.abs(sa) * 0.3 - (sd > 0 ? 1.5 : 0)];
    const nx = 1.4;
    smooth(ctx, [[r0[0] - 0.8, r0[1]], [r0[0] + 0.8, r0[1]], [mix(r0[0], tip[0], 0.5) + nx, mix(r0[1], tip[1], 0.5)], [tip[0] + nx, tip[1]], [tip[0], tip[1] - 1.6], [tip[0] - nx, tip[1]], [mix(r0[0], tip[0], 0.5) - nx, mix(r0[1], tip[1], 0.5)]]);
    const tg = ctx.createLinearGradient(r0[0], r0[1], tip[0], tip[1]);
    tg.addColorStop(0, flashed(a, SASH[1]));
    tg.addColorStop(1, flashed(a, SASH[0]));
    ctx.fillStyle = tg;
    ctx.fill();
    line(ctx, [r0, [mix(r0[0], tip[0], 0.5) + 0.3, mix(r0[1], tip[1], 0.5)], [tip[0], tip[1] - 2]], rgbaOf(SASH[2], 0.55), 0.35);
  }
  bow(ctx, a, w[0] - 9, w[1] - 0.2, 0.95, [SASH[2], SASH[0], SASH[2]], -0.1);
  marigold(ctx, a, w[0] + 9.6, w[1] - 0.4, 3.2);
  // the pocket watch on its gold chain, stopped at midnight: a gilt case lit at its top, its crown, a
  // cream dial with four marks and both hands at twelve, a glint on its glass
  const wx = w[0] + 6;
  const wy = w[1] + 10;
  line(ctx, [[w[0] + 4, w[1] + 2], [wx - 2.4, wy - 5], [wx, wy - 3.4]], flashed(a, GOLD[2]), 0.55);
  line(ctx, [[w[0] + 4, w[1] + 2], [wx - 2.4, wy - 5], [wx, wy - 3.4]], 'rgba(255,248,210,0.7)', 0.22);
  ell(ctx, wx, wy - 2.9, 0.7, 0.55);
  ctx.fillStyle = flashed(a, GOLD[1]);
  ctx.fill();
  ell(ctx, wx, wy, 2.5, 2.5);
  const cg = ctx.createRadialGradient(wx - 0.8, wy - 1, 0.2, wx, wy, 2.6);
  cg.addColorStop(0, flashed(a, GOLD[0]));
  cg.addColorStop(0.7, flashed(a, GOLD[1]));
  cg.addColorStop(1, flashed(a, GOLD[2]));
  ctx.fillStyle = cg;
  ctx.fill();
  ell(ctx, wx, wy, 1.75, 1.75);
  ctx.fillStyle = flashed(a, CREAM[0]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(120,80,50,0.6)';
  ctx.lineWidth = 0.18;
  for (let i = 0; i < 4; i++) {
    const an = (i / 4) * TAU;
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(an) * 1.3, wy + Math.sin(an) * 1.3);
    ctx.lineTo(wx + Math.cos(an) * 1.6, wy + Math.sin(an) * 1.6);
    ctx.stroke();
  }
  line(ctx, [[wx, wy], [wx, wy - 1.35]], '#5a3a2a', 0.28);
  line(ctx, [[wx + 0.1, wy], [wx + 0.1, wy - 0.95]], '#5a3a2a', 0.36);
  ell(ctx, wx - 0.6, wy - 0.7, 0.6, 0.3, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
}
// The skirt: a sheer glowing underskirt that fades toward the floor (soft pleats of light down it, a
// few twinkles), seven long marigold petals hung from her waist round her hips, split at the front,
// each swaying on its own (deep at its root, gold at its tip, a lit rim, a midrib and fine veins, a soft
// shade where it lies over the one behind), and a short peplum of deeper petals over their roots.
function skirt(ctx, a, mode, D, part = 'all') {
  const t = a.t ?? 0;
  const st = a.mo?.rig ?? {};
  const W = (x, y) => ptOf(a, D, 'torso', [x, y]);
  const kN = ptOf(a, D, 'shinN', [D.J.kneeN[0], D.J.kneeN[1] + 10]);
  const kF = ptOf(a, D, 'shinF', [D.J.kneeF[0], D.J.kneeF[1] + 10]);
  const wy = D.J.waist[1] + 1.8;
  const wl = W(67, wy);
  const wr = W(93, wy);
  const floorY = Math.max(kN[1], kF[1]);
  if (mode === 'fill' && part !== 'peplum') {
    const under = [wl, wr, [wr[0] + 9, wr[1] + 14], [kN[0] + 10, floorY + 4], [(kN[0] + kF[0]) / 2, floorY + 7], [kF[0] - 10, floorY + 4], [wl[0] - 9, wl[1] + 14]];
    const g = ctx.createLinearGradient(0, wl[1], 0, floorY + 6);
    g.addColorStop(0, 'rgba(255,240,200,0.72)');
    g.addColorStop(0.7, 'rgba(255,236,196,0.3)');
    g.addColorStop(1, 'rgba(255,240,200,0)');
    smooth(ctx, under);
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    smooth(ctx, under);
    ctx.clip();
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.5) / 6;
      const x0 = mix(wl[0], wr[0], u);
      const x1 = mix(kF[0] - 12, kN[0] + 12, u);
      line(ctx, [[x0, wl[1] + 3], [mix(x0, x1, 0.5) + Math.sin(t * 1.2 + i) * 0.6, mix(wl[1], floorY, 0.5)], [x1, floorY + 2]], 'rgba(255,255,240,0.35)', 0.8);
    }
    for (let i = 0; i < 4; i++) {
      const tw = 0.5 + 0.5 * Math.sin(t * 2.2 + i * 1.9);
      const sx = mix(kF[0] - 6, kN[0] + 6, (i * 0.37 + 0.15) % 1);
      const sy = mix(wl[1] + 12, floorY, (i * 0.53 + 0.3) % 1);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(0.4);
      ctx.fillStyle = `rgba(255,252,230,${0.75 * tw})`;
      ctx.beginPath();
      for (let k = 0; k < 8; k++) {
        const an = (k / 8) * TAU;
        const rr = k % 2 ? 0.25 : 1.1;
        ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }
  const sway = st.mgSway ?? 0;
  const petals = [[-0.95, 1.08], [-0.7, 1.0], [-0.42, 0.86], [0.42, 0.86], [0.7, 1.0], [0.95, 1.08], [0, 1.14]];
  const order = [6, 0, 5, 1, 4, 2, 3];
  const petal = (root, L, lean, wdt, cols, veins) => {
    const tip = [root[0] + Math.sin(lean) * L, root[1] + Math.cos(lean) * L];
    const nx = Math.cos(lean);
    const ny = -Math.sin(lean);
    const pts = [
      [root[0] - nx * wdt * 0.5, root[1] - ny * wdt * 0.5],
      [root[0] + nx * wdt * 0.5, root[1] + ny * wdt * 0.5],
      [mix(root[0], tip[0], 0.6) + nx * wdt * 0.62, mix(root[1], tip[1], 0.6) + ny * wdt * 0.62],
      [tip[0] + nx * wdt * 0.36 - (tip[0] - root[0]) * 0.04, tip[1] + ny * wdt * 0.36 - (tip[1] - root[1]) * 0.04],
      [tip[0] + nx * wdt * 0.16, tip[1] + ny * wdt * 0.16 - 0.2],
      [tip[0] + nx * wdt * 0.1 - (tip[0] - root[0]) * 0.025, tip[1] + ny * wdt * 0.1 - (tip[1] - root[1]) * 0.025],
      tip,
      [tip[0] - nx * wdt * 0.1 - (tip[0] - root[0]) * 0.025, tip[1] - ny * wdt * 0.1 - (tip[1] - root[1]) * 0.025],
      [tip[0] - nx * wdt * 0.16, tip[1] - ny * wdt * 0.16 - 0.2],
      [tip[0] - nx * wdt * 0.36 - (tip[0] - root[0]) * 0.04, tip[1] - ny * wdt * 0.36 - (tip[1] - root[1]) * 0.04],
      [mix(root[0], tip[0], 0.6) - nx * wdt * 0.62, mix(root[1], tip[1], 0.6) - ny * wdt * 0.62],
    ];
    if (mode === 'line') {
      smooth(ctx, pts);
      paint(ctx, a, mode, cols[1]);
      return;
    }
    // (its soft shade on what lies behind it)
    ctx.save();
    ctx.translate(nx * 0.8, 1.2);
    smooth(ctx, pts);
    ctx.fillStyle = 'rgba(150,60,20,0.18)';
    ctx.fill();
    ctx.restore();
    smooth(ctx, pts);
    const g = ctx.createLinearGradient(root[0], root[1], tip[0], tip[1]);
    g.addColorStop(0, flashed(a, cols[0]));
    g.addColorStop(0.45, flashed(a, cols[1]));
    g.addColorStop(1, flashed(a, cols[2]));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    // (its lit rim and its shaded side)
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(255,246,210,0.5)';
    smooth(ctx, pts.map(([x, y]) => [x - nx * 0.5, y - ny * 0.5]));
    ctx.stroke();
    const sg = ctx.createLinearGradient(root[0] + nx * wdt * 0.6, root[1] + ny * wdt * 0.6, root[0], root[1]);
    sg.addColorStop(0, 'rgba(180,80,20,0.3)');
    sg.addColorStop(1, 'rgba(180,80,20,0)');
    ctx.fillStyle = sg;
    ctx.fillRect(-400, -400, 800, 800);
    // (its midrib: a crease with light beside it; fine veins out from it)
    const mid = (u) => [mix(root[0], tip[0], u), mix(root[1], tip[1], u)];
    const lift = (p) => [p[0] - nx * 0.6, p[1] - ny * 0.6];
    line(ctx, [mid(0.02), mid(0.45), mid(0.86)], rgbaOf(GOLDEN[3], 0.6), 0.55);
    line(ctx, [lift(mid(0.04)), lift(mid(0.45)), lift(mid(0.8))], 'rgba(255,250,225,0.55)', 0.35);
    for (let i = 0; i < veins; i++) {
      const u = 0.22 + i * (0.56 / Math.max(1, veins - 1));
      const p = mid(u);
      const dx = tip[0] - root[0];
      const dy = tip[1] - root[1];
      for (const sd of [-1, 1]) line(ctx, [p, [p[0] + sd * nx * wdt * 0.2 + dx * 0.06, p[1] + sd * ny * wdt * 0.2 + dy * 0.06], [p[0] + sd * nx * wdt * 0.34 + dx * 0.14, p[1] + sd * ny * wdt * 0.34 + dy * 0.14]], rgbaOf(GOLDEN[3], 0.28), 0.3);
    }
    ctx.restore();
  };
  if (part !== 'peplum') for (const i of order) {
    const [u, len] = petals[i];
    const back = i === 6;
    const root = [mix(wl[0], wr[0], 0.5 + u * 0.5), mix(wl[1], wr[1], 0.5 + u * 0.5) + 1];
    const L = ((floorY - root[1]) * len + 4) * (1 + (a.mgJig ?? 0) * 0.025);
    const lean = u * 0.32 + Math.sin(t * 1.5 + i * 1.1) * 0.03 + sway * (0.6 + Math.abs(u) * 0.4);
    petal(root, L, lean, back ? 13 : 8.6, back ? [GOLDEN[3], GOLDEN[2], GOLDEN[1]] : [GOLDEN[2], GOLDEN[1], '#fff2c8'], 0);
  }
}
// Her detached sleeves: not joined to her bodice (her ghostly shoulders bare above them): each starts
// as a gold-trimmed band round her upper arm with a little marigold on it, and falls from there as cream
// chiffon widening past her elbow into a long bell that hangs below her wrist, its hem cut in soft
// marigold petals, swaying on its spring; soft folds run down it from the band, light on its near
// side. Cut from the arm's own outline (a.blShapes) and always wider than it, so no skin shows under it.
const nearestAt = (pts, p) => {
  let best = 0;
  let bd = Infinity;
  pts.forEach((q, i) => {
    const d = Math.hypot(q[0] - p[0], q[1] - p[1]);
    if (d < bd) {
      bd = d;
      best = i;
    }
  });
  return best;
};
function sleeveShape(a, sh, side) {
  const i0 = nearestAt(sh.pts, [mix(sh.sh[0], sh.el[0], 0.62), mix(sh.sh[1], sh.el[1], 0.62)]);
  // (down the arm to the wrist: the bell's mouth opens there and her hand comes out of it)
  const iw = nearestAt(sh.pts, [mix(sh.el[0], sh.wr[0], 0.72), mix(sh.el[1], sh.wr[1], 0.72)]);
  const line = sh.pts.slice(i0, Math.max(i0 + 2, iw + 1));
  const N = line.length - 1;
  if (N < 1) return null;
  const ei = nearestAt(line, sh.el);
  const sw = (a.mgSleeve ?? 0) * (side === 'N' ? 1 : 0.8) + Math.sin((a.t ?? 0) * 1.6 + (side === 'N' ? 0 : 1.3)) * 0.4;
  const half = line.map((q, i) => {
    const wArm = (sh.wl[Math.min(i0 + i, sh.wl.length - 1)] ?? sh.wl[sh.wl.length - 1]) / 2;
    const u = i <= ei ? 0 : (i - ei) / Math.max(1, N - ei);
    return wArm + 0.9 + 6.6 * u ** 1.5;
  });
  const left = [];
  const right = [];
  for (let i = 0; i <= N; i++) {
    const q = line[Math.min(N, i + 1)];
    const r = line[Math.max(0, i - 1)];
    const dx = q[0] - r[0];
    const dy = q[1] - r[1];
    const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l;
    const ny = dx / l;
    left.push([line[i][0] + nx * half[i], line[i][1] + ny * half[i]]);
    right.push([line[i][0] - nx * half[i], line[i][1] - ny * half[i]]);
  }
  return { line, left, right, half, N, ei, sw };
}
// (the mouth's hem: five round petals, sampled, from the left edge to the right)
function petalHem(S) {
  const { line: ln, left, right, N, sw } = S;
  const a0 = left[N];
  const b0 = right[N];
  const d = [ln[N][0] - ln[N - 1][0], ln[N][1] - ln[N - 1][1]];
  const l = Math.hypot(...d) || 1;
  const out = [];
  for (let k = 0; k < 5; k++) {
    const um = (k + 0.5) / 5;
    const dip = (1.2 + Math.sin(um * Math.PI) * 0.7) * 2;
    const p0 = [mix(a0[0], b0[0], k / 5), mix(a0[1], b0[1], k / 5)];
    const p1 = [mix(a0[0], b0[0], (k + 1) / 5), mix(a0[1], b0[1], (k + 1) / 5)];
    const c = [mix(a0[0], b0[0], um) + (d[0] / l) * dip + sw * 0.3, mix(a0[1], b0[1], um) + (d[1] / l) * dip];
    for (let j = 1; j <= 6; j++) {
      const t = j / 6;
      out.push([(1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * c[0] + t * t * p1[0], (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * c[1] + t * t * p1[1]]);
    }
  }
  return out;
}
// The sleeve's outline as one smooth piece: round all along like the arm inside it (a disc at each step
// and the strip between, so a bent elbow stays round and the arm never shows at the bend), then its
// last stretch out to the mouth, whose hem falls in five soft marigold petals, swaying.
function sleevePath(ctx, S) {
  const { line: ln, left, right, half, N } = S;
  ctx.beginPath();
  for (let i = 0; i < N; i++) {
    const [x, y] = ln[i];
    ctx.moveTo(x + half[i], y);
    ctx.arc(x, y, half[i], 0, TAU);
    if (i) {
      const [x0, y0] = ln[i - 1];
      const dx = x - x0;
      const dy = y - y0;
      const l = Math.hypot(dx, dy) || 1;
      const nx = -dy / l;
      const ny = dx / l;
      ctx.moveTo(x0 + nx * half[i - 1], y0 + ny * half[i - 1]);
      ctx.lineTo(x0 - nx * half[i - 1], y0 - ny * half[i - 1]);
      ctx.lineTo(x - nx * half[i], y - ny * half[i]);
      ctx.lineTo(x + nx * half[i], y + ny * half[i]);
      ctx.closePath();
    }
  }
  // (the mouth: from the last disc out to the hem, wound the same way as the discs)
  const pts = [left[N - 1], left[N], ...petalHem(S), right[N - 1]];
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    area += p[0] * q[1] - q[0] * p[1];
  }
  const ordered = area >= 0 ? pts : [...pts].reverse();
  ctx.moveTo(...ordered[0]);
  for (let i = 1; i < ordered.length; i++) ctx.lineTo(...ordered[i]);
  ctx.closePath();
}
function glove(ctx, a, mode, D, side) {
  const sh = a.blShapes?.[`arm${side}`];
  if (!sh) return;
  const S = sleeveShape(a, sh, side);
  if (S) {
    sleevePath(ctx, S);
    if (mode === 'line') {
      ctx.lineWidth = LW;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else {
      const far = side === 'F';
      const { line: ln, left, right, N, ei } = S;
      const g = ctx.createLinearGradient(ln[0][0], ln[0][1], ln[N][0], ln[N][1]);
      g.addColorStop(0, flashed(a, far ? CREAM[1] : CREAM[0]));
      g.addColorStop(0.7, flashed(a, far ? CREAM[2] : CREAM[1]));
      g.addColorStop(1, flashed(a, far ? '#f6c880' : '#ffd890'));
      ctx.fillStyle = g;
      ctx.fill('nonzero');
      ctx.save();
      sleevePath(ctx, S);
      ctx.clip('nonzero');
      // (light down its near side, shade down its far side and inside the bell's mouth)
      const edge = (pts, col, w) => {
        ctx.beginPath();
        pts.forEach((q, i) => (i ? ctx.lineTo(...q) : ctx.moveTo(...q)));
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.stroke();
      };
      edge(right.map((q, i) => [mix(q[0], ln[i][0], 0.25), mix(q[1], ln[i][1], 0.25)]), rgbaOf(CREAM[2], 0.9), 2.4);
      edge(left.map((q, i) => [mix(q[0], ln[i][0], 0.45), mix(q[1], ln[i][1], 0.45)]).slice(1), 'rgba(255,255,255,0.85)', 1.2);
      glow(ctx, ln[N][0], ln[N][1] + 1.5, S.half[N] * 0.9, GOLDEN[2], 0.35);
      // (soft folds falling from below the elbow into the bell)
      for (const k of [-0.55, -0.15, 0.3, 0.7]) {
        const pts = [];
        for (let i = ei; i <= N; i++) pts.push([mix(ln[i][0], (k < 0 ? left : right)[i][0], Math.abs(k)), mix(ln[i][1], (k < 0 ? left : right)[i][1], Math.abs(k))]);
        if (pts.length > 1) {
          edge(pts, rgbaOf(CREAM[2], 0.8), 0.45);
          edge(pts.map(([x, y]) => [x + 0.5, y]), 'rgba(255,255,255,0.75)', 0.3);
        }
      }
      ctx.restore();
      // (the hem's petals: a fine orange edge and a groove down each)
      ctx.save();
      sleevePath(ctx, S);
      ctx.clip('nonzero');
      const a0 = left[N];
      const b0 = right[N];
      for (let k = 0; k < 5; k++) {
        const u = (k + 0.5) / 5;
        const p0 = [mix(a0[0], b0[0], u), mix(a0[1], b0[1], u)];
        line(ctx, [[p0[0], p0[1] - 2.4], [p0[0], p0[1] + 2.6]], rgbaOf(GOLDEN[3], 0.4), 0.3);
      }
      ctx.restore();
      ctx.save();
      sleevePath(ctx, S);
      ctx.clip('nonzero');
      const hd = [ln[N][0] - ln[N - 1][0], ln[N][1] - ln[N - 1][1]];
      const hl = Math.hypot(...hd) || 1;
      void hl;
      ctx.beginPath();
      ctx.moveTo(...left[N]);
      for (const q of petalHem(S)) ctx.lineTo(...q);
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = rgbaOf(GOLDEN[2], 0.85);
      ctx.stroke();
      ctx.restore();
      // the gold-trimmed band at its top, a little marigold on it
      const t0 = ln[0];
      const t1 = ln[1];
      const an = Math.atan2(t1[1] - t0[1], t1[0] - t0[0]) + Math.PI / 2;
      const hw = S.half[0];
      for (const [off, col, w] of [[0.6, GOLD[2], 1.6], [0.6, GOLD[1], 0.9], [0.3, GOLD[0], 0.3]]) {
        const c = [mix(t0[0], t1[0], off), mix(t0[1], t1[1], off)];
        line(ctx, [[c[0] + Math.cos(an) * hw, c[1] + Math.sin(an) * hw], [c[0] - Math.cos(an) * hw, c[1] - Math.sin(an) * hw]], flashed(a, col), w);
      }
      if (!far) marigold(ctx, a, mix(t0[0], t1[0], 0.6), mix(t0[1], t1[1], 0.6), 1.5, 0.4);
    }
  }
  if (side === 'N') danceCard(ctx, a, D);
}
// Over her hands: the gloves' hands, the hand's own round and thumb, a touch bigger; three fine stitched
// points down the back of the hand, a sheen on the knuckles.
function gloveHand(ctx, a, mode, D, side) {
  const hs = a.blShapes?.[`hand${side}`];
  if (!hs || mode !== 'fill') return;
  ctx.save();
  ctx.transform(...hs.M);
  ell(ctx, hs.c[0], hs.c[1], hs.r + 0.5, hs.r * 0.95 + 0.5);
  ctx.fillStyle = flashed(a, side === 'F' ? CREAM[1] : CREAM[0]);
  ctx.fill();
  ell(ctx, hs.thumb[0], hs.thumb[1], hs.thumb[2] + 0.4, hs.thumb[2] * 0.95 + 0.4);
  ctx.fill();
  ctx.save();
  ell(ctx, hs.c[0], hs.c[1], hs.r + 0.5, hs.r * 0.95 + 0.5);
  ctx.clip();
  glow(ctx, hs.c[0] - hs.r * 0.2, hs.c[1] + hs.r * 0.4, hs.r * 0.9, CREAM[2], 0.6);
  glow(ctx, hs.c[0] + hs.r * 0.2, hs.c[1] - hs.r * 0.4, hs.r * 0.6, '#ffffff', 0.7);
  for (const k of [-0.35, 0, 0.35]) line(ctx, [[hs.c[0] + k * hs.r, hs.c[1] - hs.r * 0.7], [hs.c[0] + k * hs.r * 1.1, hs.c[1] + hs.r * 0.1]], rgbaOf(CREAM[2], 0.9), 0.22);
  ctx.restore();
  ctx.restore();
}
// Her dance card on a ribbon at her near wrist: cream, gilt-edged, a little marigold at its head, every
// line blank.
function danceCard(ctx, a, D) {
  const wr = D.J.wrN;
  ctx.save();
  enter(ctx, a, D, 'armNf');
  const sw = Math.sin((a.t ?? 0) * 1.8) * 0.05 + (a.mgCard ?? 0) * 0.35;
  ctx.translate(wr[0] + 2, wr[1] - 1);
  ctx.rotate(0.2 + sw);
  line(ctx, [[0, 0], [1.2, 2], [1.5, 4]], flashed(a, SASH[0]), 0.5);
  ctx.translate(1.5, 4);
  ctx.beginPath();
  ctx.rect(-2.6, 0, 5.2, 6.6);
  const g = ctx.createLinearGradient(-2.6, 0, 2.6, 6.6);
  g.addColorStop(0, flashed(a, '#ffffff'));
  g.addColorStop(1, flashed(a, CREAM[1]));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = flashed(a, GOLD[1]);
  ctx.lineWidth = 0.4;
  ctx.stroke();
  ctx.strokeStyle = rgbaOf(GOLD[1], 0.7);
  ctx.lineWidth = 0.18;
  ctx.strokeRect(-2.1, 0.5, 4.2, 5.6);
  for (let i = 0; i < 3; i++) line(ctx, [[-1.6, 2.6 + i * 1.2], [1.6, 2.6 + i * 1.2]], rgbaOf(CREAM[2], 0.9), 0.2);
  marigold(ctx, a, 0, 1.3, 0.75, 0.2);
  ctx.restore();
}
// Gold dancing slippers: the foot's own outline, a touch bigger; gold satin lit at the toe, a deeper sole
// edge, a little marigold-orange bow at the throat.
function slipper(ctx, a, mode, D, side) {
  const fs0 = a.blShapes?.[`foot${side}`];
  if (!fs0) return;
  ctx.save();
  ctx.transform(...fs0.M);
  const c = fs0.pts.reduce((acc, p) => [acc[0] + p[0] / fs0.pts.length, acc[1] + p[1] / fs0.pts.length], [0, 0]);
  const pts = fs0.pts.map(([x, y]) => [c[0] + (x - c[0]) * 1.08, c[1] + (y - c[1]) * 1.1]);
  smooth(ctx, pts);
  paint(ctx, a, mode, side === 'F' ? GOLD[2] : GOLD[1]);
  if (mode === 'fill') {
    const tip = pts.reduce((b, p) => (p[0] > b[0] ? p : b), pts[0]);
    const bot = Math.max(...pts.map((p) => p[1]));
    ctx.save();
    smooth(ctx, pts);
    ctx.clip();
    const g = ctx.createLinearGradient(0, c[1] - 3, 0, bot);
    g.addColorStop(0, 'rgba(255,248,210,0.5)');
    g.addColorStop(0.6, 'rgba(255,248,210,0)');
    g.addColorStop(1, 'rgba(140,90,30,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(c[0] - 20, c[1] - 10, 40, 20);
    glow(ctx, mix(c[0], tip[0], 0.6), c[1] - 0.8, 1.8, '#ffffff', 0.6);
    ctx.restore();
    marigold(ctx, a, mix(c[0], tip[0], 0.3), c[1] - 1.1, 1.5, 0.3);
  }
  ctx.restore();
}
// A velvet choker round her throat: plum, lit along its top, with a little marigold cameo in a gilt frame
// hanging from it.
function choker(ctx, a, mode, D) {
  const nk = a.blShapes?.neck;
  if (!nk || mode !== 'fill') return;
  const i = Math.round((nk.pts.length - 1) * 0.16);
  const p = nk.pts[i];
  const q = nk.pts[Math.min(nk.pts.length - 1, i + 1)];
  const an = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const hw = nk.wl[i] / 2 + 0.25;
  ctx.save();
  ctx.translate(...p);
  ctx.rotate(an + Math.PI / 2);
  // (x across the throat, y down it)
  ctx.beginPath();
  ctx.moveTo(-hw, -0.9);
  ctx.quadraticCurveTo(0, 0.1, hw, -0.9);
  ctx.lineTo(hw, 0.9);
  ctx.quadraticCurveTo(0, 1.9, -hw, 0.9);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, -0.9, 0, 1.4);
  g.addColorStop(0, flashed(a, SASH[0]));
  g.addColorStop(1, flashed(a, SASH[2]));
  ctx.fillStyle = g;
  ctx.fill();
  line(ctx, [[-hw * 0.9, -0.5], [0, 0.3], [hw * 0.9, -0.5]], 'rgba(255,215,232,0.45)', 0.3);
  // (a fine lace frill below it, its edge one soft scalloped line (never separate dots), and a thin
  // gold edge along its top and bottom, matching her bodice's trims)
  const edgeY = (u) => 0.9 + 2 * u * (1 - u);
  ctx.beginPath();
  const S = 9;
  ctx.moveTo(-hw, edgeY(0));
  for (let k = 0; k <= S; k++) ctx.lineTo(mix(-hw, hw, k / S), edgeY(k / S));
  for (let k = S; k > 0; k--) {
    const u0 = k / S;
    const u1 = (k - 1) / S;
    const um = (u0 + u1) / 2;
    ctx.quadraticCurveTo(mix(-hw, hw, um), edgeY(um) + 1.5, mix(-hw, hw, u1), edgeY(u1) + 0.7);
  }
  ctx.closePath();
  ctx.fillStyle = rgbaOf(CREAM[0], 0.88);
  ctx.fill();
  ctx.strokeStyle = rgbaOf(CREAM[2], 0.8);
  ctx.lineWidth = 0.16;
  ctx.stroke();
  for (const [y0, y1] of [[-0.9, 0.1], [0.9, 1.9]]) line(ctx, [[-hw, y0], [0, y1], [hw, y0]], flashed(a, GOLD[1]), 0.3);
  ell(ctx, 0, 2.6, 1.6, 1.8);
  ctx.fillStyle = flashed(a, GOLD[2]);
  ctx.fill();
  ell(ctx, 0, 2.6, 1.2, 1.4);
  ctx.fillStyle = flashed(a, CREAM[0]);
  ctx.fill();
  marigold(ctx, a, 0, 2.6, 0.9, 0.4);
  ell(ctx, -0.5, 1.9, 0.45, 0.25, -0.5);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.restore();
}

// ---------- Her springs: petals, sash tails, fringe and side locks, ringlets and dance card all move with
// her (damped springs kicked by her steps, leans and turns) ----------
function spring(st, key, goal, k, c, dt) {
  const v = (st[key + 'V'] ?? 0) + ((goal - (st[key] ?? goal)) * k - (st[key + 'V'] ?? 0) * c) * dt;
  st[key + 'V'] = v;
  st[key] = (st[key] ?? goal) + v * dt;
  return st[key];
}
// Her soft-body jiggle (2026-11-28, the player: "Remember ur allowed to do softbodies jiggle"): one
// underdamped spring jolted by real events, each settling in a bounce or two (never a looping wobble):
// a footfall, a blow landing on her, her own cast letting fly. Her soft parts read it (her hair's
// volume, her curls, her skirt), each keeping its volume: wider as it squashes, narrower as it stretches.
// (2026-11-28, the player: "look for over jiggle random jiggle": the footfall kick ran on its own clock,
// out of step with her feet, and the spring was loose enough to wobble on between steps. Now each kick
// lands on a real footfall (her walk cycle passing 0 or a half, `cyc` the rig's own a.tk<id>U), it is
// gentler, and the spring settles in a bounce or two.)
function jolt(m, a, st, key, dt, cyc) {
  const walk = clamp(a.walkW ?? 0, 0, 1);
  const U = a[cyc] ?? 0;
  const prev = st[key + 'U'] ?? U;
  st[key + 'U'] = U;
  let kick = 0;
  if (walk > 0.25 && Math.floor(U * 2) !== Math.floor(prev * 2)) kick += 3 * walk;
  const hurt = a.hurtAgo ?? 9;
  if (hurt < (st[key + 'Hurt'] ?? 9) - 0.02) kick += 5;
  st[key + 'Hurt'] = hurt;
  if (m.attackAt != null && m.attackAt !== st[key + 'Atk']) {
    if (st[key + 'Atk'] != null) kick -= 4;
    st[key + 'Atk'] = m.attackAt;
  }
  st[key + 'V'] = (st[key + 'V'] ?? 0) + kick;
  return clamp(spring(st, key, 0, 170, 9.5, dt), -1, 1);
}
function springs(m, a, out, st, dt) {
  const t = a.t ?? 0;
  const walk = clamp(a.walkW ?? 0, 0, 1);
  const step = Math.sin(t * 6) * walk;
  const tilt = out.tilt ?? 0;
  const tv = (tilt - (st.mgLastTilt ?? tilt)) / Math.max(dt, 1e-3);
  st.mgLastTilt = tilt;
  const x = out.x ?? 0;
  const xv = (x - (st.mgLastX ?? x)) / Math.max(dt, 1e-3);
  st.mgLastX = x;
  const hop = (out.hop ?? 0) + (out.lift ?? 0) - (out.drop ?? 0);
  const hv = (hop - (st.mgLastHop ?? hop)) / Math.max(dt, 1e-3);
  st.mgLastHop = hop;
  const kick = clamp(-tv * 0.014 - xv * 1.2, -1.4, 1.4) + step * 0.4;
  st.mgSway = spring(st, 'mgSw', kick * 0.35, 40, 4.6, dt);
  a.mgSash = spring(st, 'mgSa', kick * 1.1 + Math.sin(t * 1.2) * 0.1, 36, 4, dt);
  a.mgFringe = spring(st, 'mgFr', kick * 0.6 - hv * 0.02, 80, 8, dt);
  a.mgLocks = spring(st, 'mgLk', kick * 0.9 + Math.sin(t * 1.3) * 0.12 - hv * 0.03, 45, 5, dt);
  a.mgCard = spring(st, 'mgCd', kick * 1.2, 30, 3.6, dt);
  // (her soft-body jolt: her updo and back hair, her corkscrew curls, her petals)
  a.mgJig = jolt(m, a, st, 'mgJg', dt, 'tkhostessU');
  a.mgSleeve = spring(st, 'mgSl', kick * 2.4 + Math.sin(t * 1.1) * 0.2, 26, 3.2, dt);
}

// ---------- Her act (about 30 s, only while she waits for her guests) ----------
//   1  her dance card: held up to read, every line blank, a sigh; a pretend name written with a fingertip,
//      the card pressed to her heart;
//   2  her stopped watch: tapped at her hip, peered at, a pout: still midnight;
//   3  a practice waltz alone: her arms round a partner who isn't there, swaying, eyes shut, humming;
//   4  a wave to the door: delighted, then nobody there; a pat of her updo as if that was what she meant;
//   5  a curtsy to the empty room, petals held out.
// (the casts a cutscene can ask her for by name, and her curtsey)
const SCENE_POSES = new Set(['lanterns', 'bloom', 'clap', 'cards', 'partners', 'twelve', 'curtsey']);
function pose(m, a, out, c) {
  const st = (a.mo.rig ??= {});
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const q = { face: 'gracious', turn: 0.2, talk: 0, cue: null, cueU: 0, write: 0, hum: 0 };
  a.mg = q;
  const dead = m.hp <= 0;
  const hurt = (a.hurtAgo ?? 9) < 0.45;
  const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
  const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3 || Boolean(m.cast);
  const want = dead || hurt || fighting || napping || m.cine || m.pose ? 0 : clamp((1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1), 0, 1);
  st.mgW = Number.isFinite(st.mgW) ? st.mgW + (want - st.mgW) * Math.min(1, dt * (want < st.mgW ? 9 : 3.5)) : want;
  const calm = st.mgW;
  if (dead) q.face = 'dizzy';
  else if (hurt) q.face = 'hurt';
  else if (napping) q.face = 'sleep';
  const t = a.t ?? 0;
  const go = (p, k) => {
    if (k > 0.001) for (const [ch, v] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (v - (out[ch] ?? 0)) * k;
  };
  const hold = (x, a0, a1, b0, b1) => {
    const e = (u) => u * u * (3 - 2 * u);
    return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
  };
  if (calm > 0.02) {
    const lu = (((t + (m.uid % 5) * 3.1) % 30) + 30) % 30;
    let face = null;
    const cue = (str, a0, a1) => {
      if (lu > a0 && lu < a1) {
        q.cue = str;
        q.cueU = (lu - a0) / (a1 - a0);
      }
    };
    // 1  her dance card
    const card = hold(lu, 1, 1.6, 4.4, 5) * calm;
    const write = hold(lu, 3, 3.2, 3.9, 4.1);
    go({ shN: -98, elN: -88 - write * 10, head: 8, tilt: 2 }, card);
    q.write = write * card;
    const heart = hold(lu, 4.6, 5, 5.8, 6.3) * calm;
    go({ shN: -36, elN: -128, head: -4, tilt: -3 }, heart);
    if (card > 0.4) face = lu < 3 ? 'wistful' : 'focus';
    if (heart > 0.4) face = 'delighted';
    cue('*sigh*', 2, 3.1);
    // 2  her stopped watch
    const wat = hold(lu, 7.4, 8, 11, 11.6) * calm;
    const tap = Math.max(0, Math.sin((lu - 8.2) * 12)) * (lu > 8.2 && lu < 9.4 ? 1 : 0);
    go({ shF: -14 + tap * 6, elF: -64, head: 14, tilt: 4 }, wat);
    if (wat > 0.4) face = lu > 9.6 ? 'pleading' : 'focus';
    cue('...still midnight.', 9.6, 11.4);
    // 3  a practice waltz alone
    const wz = hold(lu, 13, 13.8, 18.6, 19.4) * calm;
    const beat = (lu - 13.8) * (TAU / 1.8);
    go({ shN: -84, elN: -66, shF: -118, elF: -34, tilt: Math.sin(beat) * 6, x: Math.sin(beat) * 0.035, fxN: Math.max(0, Math.sin(beat)) * 0.18, fxF: Math.max(0, -Math.sin(beat)) * 0.18, head: -6 }, wz);
    q.hum = wz;
    if (wz > 0.4) face = 'dreamy';
    // 4  a wave to the door; nobody; a pat of her updo
    const wave = hold(lu, 20.4, 20.8, 22, 22.4) * calm;
    go({ shN: -158, elN: Math.sin(lu * 14) * 22 - 10, head: -6 }, wave);
    const pat = hold(lu, 22.4, 22.8, 23.8, 24.3) * calm;
    go({ shN: -142, elN: -58, head: 8, tilt: -2 }, pat);
    if (wave > 0.4) face = 'delighted';
    if (pat > 0.4) face = 'wistful';
    cue('Welcome!', 20.6, 21.9);
    cue('...ahem.', 22.6, 24);
    // 5  a curtsy to the empty room
    const cur = hold(lu, 25.4, 26.2, 27.6, 28.4) * calm;
    go({ drop: 0.16, tilt: 8, head: 12, shN: -22, elN: -10, shF: -22, elF: -10, fxF: -0.12 }, cur);
    if (cur > 0.4) face = 'gracious';
    if (face && !dead && !hurt) q.face = face;
  }
  // ---------- Her fight (2026-11-28, the player: "she needs to have nice idle animations attack
  // animations expressively animated and smooth"): between her casts she keeps dancing, never just
  // standing: a waltz sway in place with her hands in a dance hold, and every few seconds a little
  // moment of her own (a giggle behind her glove, a flourish of both arms, a glance at her stopped
  // watch). Her mood darkens with the night: delighted at the welcome, intent at the lanterns, close to
  // tears at midnight. Her basic attack: a wind-up, her arm drawn back as she leans away, then a
  // sweeping slap of her petal sleeve with a step into it. ----------
  {
    const walk = clamp(a.walkW ?? 0, 0, 1);
    const fwant = fighting && !dead && !napping && !m.cine && !m.pose ? 1 - walk * 0.7 : 0;
    // (eased in and out along a steady ramp, so it starts and ends gently: no snap as the fight begins)
    st.mgFWL = Number.isFinite(st.mgFWL) ? st.mgFWL + clamp(fwant - st.mgFWL, -dt * 2.2, dt * 1.6) : fwant;
    const fw = st.mgFWL * st.mgFWL * (3 - 2 * st.mgFWL);
    const p = m.mech?.phase ?? 1;
    if (fw > 0.01) {
      const beat = t * (TAU / 1.9);
      go({ tilt: Math.sin(beat) * 3.5, x: Math.sin(beat) * 0.014, head: -2 + Math.sin(beat + 0.6) * 3, shN: -38 + Math.sin(beat) * 6, elN: -74, shF: -30 - Math.sin(beat) * 6, elF: -56, drop: 0.015 * (1 + Math.cos(beat * 2)) }, fw);
      const fu = (((t + (m.uid % 3) * 2.3) % 9) + 9) % 9;
      const giggle = hold(fu, 1.2, 1.5, 2.6, 3) * fw;
      go(p >= 3 ? { shN: -54, elN: -122, shF: -50, elF: -118, head: 10, tilt: 2 } : { shN: -62, elN: -132, head: 7, tilt: -4 }, giggle);
      const flourish = hold(fu, 4, 4.4, 5.2, 5.7) * fw;
      go({ shN: -104, elN: -8, shF: -98, elF: -12, head: -8, tilt: Math.sin(t * 6) * 3 }, flourish);
      const watch = hold(fu, 6.6, 7, 7.9, 8.4) * fw;
      go({ shF: -14, elF: -64, head: 14, tilt: 4 }, watch);
      if (!hurt && !dead) {
        const base = p >= 3 ? 'pleading' : p >= 2 ? 'focus' : 'delighted';
        q.face = giggle > 0.4 ? (p >= 3 ? 'teary' : 'delighted') : flourish > 0.4 ? (p >= 3 ? 'wistful' : 'delighted') : watch > 0.4 ? (p >= 3 ? 'teary' : 'focus') : base;
        q.hum = Math.max(q.hum ?? 0, fw * (p < 3 ? 0.6 : 0));
      }
    }
    // (her basic attack, from the rig's attack phase: a.ph.antic through the wind-up, a.ph.strike into
    // the blow and back out)
    const ap = a.ph ?? { antic: 0, strike: 0 };
    if (!dead && ap.antic > 0.01) {
      go({ shN: 36, elN: -96, shF: -60, elF: -40, tilt: -9, head: -8, x: -0.02 }, ap.antic);
      if (!hurt) q.face = 'focus';
    }
    if (!dead && ap.strike > 0.01) {
      go({ shN: -108, elN: -26, shF: 10, elF: -50, tilt: 11, head: 6, x: 0.03, fxN: 0.1 }, ap.strike);
      if (!hurt) q.face = p >= 3 ? 'pleading' : 'delighted';
    }
  }
  // ---------- Her casts (world/manor.js): a pose for each moment of her party, eased in, held, and
  // eased back out after it lands (never snapping) ----------
  const now = a.now ?? 0;
  let castWant = null;
  let cu = 0;
  if (!dead && m.cast && m.castPose) {
    castWant = m.castPose;
    cu = clamp((now - m.cast.t0) / Math.max(0.2, m.cast.dur), 0, 1);
  } else if (!dead && m.phaseAt != null && now - m.phaseAt < 1.6) {
    castWant = (m.mech?.phase ?? 1) >= 3 ? 'twelve' : 'lanterns';
    cu = (now - m.phaseAt) / 1.6;
  } else if (!dead && m.cine?.act && SCENE_POSES.has(m.cine.act.move) && now >= m.cine.act.at && now < m.cine.act.at + m.cine.act.dur) {
    // (a cutscene's own moment (data/scenes.js { act, move }): the same pose, props and face as the
    // cast it's named after)
    castWant = m.cine.act.move;
    cu = (now - m.cine.act.at) / Math.max(0.2, m.cine.act.dur);
  }
  if (castWant) {
    st.mgCast = castWant;
    st.mgCastU = cu;
  }
  st.mgCastW = clamp((st.mgCastW ?? 0) + (castWant ? dt * 4.5 : -dt * 3), 0, 1);
  const e2 = (u) => {
    const v = clamp(u, 0, 1);
    return v * v * (3 - 2 * v);
  };
  const cw = e2(st.mgCastW);
  if (cw > 0.001 && st.mgCast) {
    const u = castWant ? cu : 1;
    const late = e2((u - 0.78) / 0.18);
    const beat = t * (TAU / 1.8);
    const P = {
      // calling cards flicked out from both hands
      cards: { shN: -70 - late * 50, elN: -90 + late * 70, shF: -70 - late * 50, elF: -90 + late * 70, head: -4, tilt: -late * 3 },
      // arms open wide, inviting a partner; a little curtsy as it lands
      partners: { shN: -96, elN: -12, shF: -96, elF: -12, head: 6 + late * 6, tilt: late * 6, drop: late * 0.1 },
      // her waltz hold, swaying round with a partner who isn't there
      steps: { shN: -84, elN: -66, shF: -118, elF: -34, tilt: Math.sin(beat) * 6, x: Math.sin(beat) * 0.035, head: -6 },
      // hands on hips, her near heel lifted, then stamped
      toes: { shN: 22, elN: -64, shF: 22, elF: -64, fyN: -0.16 * (1 - late), head: 8, tilt: 3 + late * 3 },
      // both arms raised to the lanterns, looking up
      lanterns: { shN: -158, elN: -10, shF: -150, elF: -16, head: -14, tilt: -4 },
      // a twirl, arms out like petals opening
      bloom: { shN: -92, elN: -4, shF: -92, elF: -4, tilt: Math.sin(t * 8) * 4, head: -4, x: Math.sin(t * 4) * 0.02 },
      // hands clasped at her heart, looking up at the clock
      twelve: { shN: -56, elN: -118, shF: -56, elF: -118, head: -14, tilt: -2 },
      // a clap for her butlers
      clap: { shN: -74 + Math.sin(t * 16) * 6, elN: -86, shF: -74 + Math.sin(t * 16) * 6, elF: -86, head: -4 },
      // a deep curtsey to her guests, petals held out (her entrance)
      curtsey: { drop: 0.16, tilt: 8, head: 12, shN: -22, elN: -10, shF: -22, elF: -10, fxF: -0.12 },
    }[st.mgCast];
    if (P) go(P, cw);
    const FACE = { curtsey: 'gracious', cards: 'delighted', partners: late > 0.3 ? 'delighted' : 'pleading', steps: 'dreamy', toes: 'focus', lanterns: 'wistful', bloom: 'delighted', twelve: 'teary', clap: 'delighted' };
    if (cw > 0.4 && !hurt) q.face = FACE[st.mgCast] ?? q.face;
    if (st.mgCast === 'steps') q.hum = Math.max(q.hum ?? 0, cw);
  }
  if (m.faceTest) q.face = m.faceTest;
  springs(m, a, out, st, dt);
}
// Her act's extras: what she says, a little note as she hums her waltz, a heart as she presses her card
// to her chest.
function mgFx(ctx, m, a, S, matOf, D) {
  const q = a.mg;
  if (!q || m.hp <= 0) return;
  const t = a.t ?? 0;
  const hd = D.at(a, 'head', [0, -D.SC * 34]);
  const text = (str, x, y, size, col, al) => {
    if (al <= 0.01) return;
    ctx.save();
    ctx.globalAlpha *= al;
    ctx.translate(x, y);
    if (a.flip) ctx.scale(-1, 1);
    ctx.font = `800 ${size}px Nunito, "Trebuchet MS", sans-serif`;
    ctx.lineWidth = Math.max(1, size * 0.22);
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = col;
    ctx.textAlign = 'center';
    ctx.strokeText(str, 0, 0);
    ctx.fillText(str, 0, 0);
    ctx.restore();
  };
  if (q.cue) text(q.cue, hd[0] + 18, hd[1] - 2 - q.cueU * 4, 6, '#a0447a', Math.sin(Math.PI * q.cueU));
  if (q.hum > 0.4) {
    for (let i = 0; i < 2; i++) {
      const u = (t * 0.5 + i * 0.5) % 1;
      text('♪', hd[0] + 12 + i * 6 + u * 2, hd[1] + 4 - u * 8, 6 + u, i ? '#e88a2a' : '#a0447a', q.hum * Math.sin(Math.PI * u));
    }
  }
}

const DRESS = {
  id: 'hostess',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: 2 },
  liveHead: true,
  noMoves: true,
  under: {
    // (the hair behind her head hangs behind her whole body, far arm and all: it is drawn first, so it
    // never lies over her shoulders; tests/boss-layers.test.js)
    armF: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'back'),
  },
  over: {
    footFskin: (ctx, a, mode, S, D) => slipper(ctx, a, mode, D, 'F'),
    footNskin: (ctx, a, mode, S, D) => slipper(ctx, a, mode, D, 'N'),
    torsoSkin: (ctx, a, mode, S, D) => bodice(ctx, a, mode, S, D),
    armF: (ctx, a, mode, S, D) => upperArm(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => upperArm(ctx, a, mode, D, 'N'),
    handFskin: (ctx, a, mode, S, D) => {
      gloveHand(ctx, a, mode, D, 'F');
      glove(ctx, a, mode, D, 'F');
    },
    handNskin: (ctx, a, mode, S, D) => {
      gloveHand(ctx, a, mode, D, 'N');
      glove(ctx, a, mode, D, 'N');
    },
    neckSkin: (ctx, a, mode, S, D) => {
      neckSkinPaint(ctx, a, mode, D);
      choker(ctx, a, mode, D);
    },
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'front'),
  },
  pose,
  fx: mgFx,
};
const R = dressRig('queen', DRESS);
const rig = R.rig;
// (her entrance (data/scenes.js manor_marigold): 'away' she isn't there yet; 'arrive' she fades in out of
// the moonlight, drifting down to the roof as she comes, a ghost taking shape)
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  const sc = m?.cine?.act;
  let al = 1;
  let lift = 0;
  if (sc?.move === 'away') al = 0;
  else if (sc?.move === 'arrive') {
    const u = clamp(((a?.now ?? 0) - sc.at) / Math.max(0.2, sc.dur), 0, 1);
    const e = u * u * (3 - 2 * u);
    al = e;
    lift = (1 - e) * 70;
  }
  if (al <= 0.001) return;
  if (al >= 0.999 && !lift) return draw0(ctx, m, a);
  // (the rig sets each part's see-through from a.alpha, so the fade goes through it)
  const a0 = a.alpha;
  a.alpha = (a0 ?? 1) * al;
  ctx.save();
  ctx.translate(0, -lift);
  draw0(ctx, m, a);
  ctx.restore();
  a.alpha = a0;
};
export const HOSTESS_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [120, 420, 220, 260], draw: R.still, rig, noHop: true };
export const HOSTESS_SIZE = { w: Math.round(R.w), h: Math.round(R.h), speed: Math.round(R.speed) };
