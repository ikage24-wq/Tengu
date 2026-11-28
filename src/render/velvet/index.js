// Madame Velvet, the Head Housekeeper, on screen (2026-11-27, remade from scratch; the Moonlit Manor's
// mid-boss at the end of the Endless Hallway, her story kept). The manor's ghost housekeeper for a hundred
// years: big, broad and formidable, strict about mud on her runner and "house rules", scalding with her
// tea, secretly soft about the hostess she serves. She moves on her own copy of the blank bases' rig
// (rig.js) on the brute's build (body.js), dressed here; her head, hair, cap, spectacles, dress, apron,
// keys and ghostly feet drawn here from scratch over the mannequin's (never the shared face, never the
// hero's body).
//   look    pale periwinkle ghost skin with a blush; steel-lilac hair swept up into a big round bun under
//           a frilled white mob cap with a plum ribbon; round gold spectacles low on her nose; a plum
//           velvet dress, high white collar with a cameo, puffed shoulders and sleeves rolled to the
//           elbow; a starched white apron with a frilled edge and a feather duster in its pocket; a
//           chatelaine ring of keys at her hip (sprung); a floor-length skirt melting at the hem into
//           soft ghostly wisps where her feet should be (she floats a finger's width off the floor).
//   eyes    narrow and sharp: a slate-violet iris, a small pupil, one hard lash line flicked up at the
//           outer corner, a heavy upper lid; level brows, the near one ready to rise. Her own faces:
//           stern (rest), inspecting (one brow up, peering over the specs), tsk (pursed), scandalised
//           (wide, specs flashing), fond (a rare small smile), focus, hurt, dizzy.
import { dressRig } from './rig.js';
import { drawHeadBack, drawHeadFront, G as HG, HSCALE } from './head.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const mix = (a, b, u) => a + (b - a) * u;
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
// A closed smooth curve through points (midpoint quadratics).
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

// (a soft line through two or three points; a colour with an alpha)
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
// A cameo: a gilt oval frame with a twisted rope edge, a rose shell, a lady's profile carved in white.
function cameo(ctx, a, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ell(ctx, 0, 0, 2.7, 3.2);
  const g = ctx.createRadialGradient(-0.8, -1.2, 0.2, 0, 0, 3.3);
  g.addColorStop(0, flashed(a, GOLD[0]));
  g.addColorStop(0.6, flashed(a, GOLD[1]));
  g.addColorStop(1, flashed(a, GOLD[2]));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = rgbaOf(GOLD[2], 0.8);
  ctx.lineWidth = 0.18;
  for (let i = 0; i < 16; i++) {
    const an = (i / 16) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(an) * 2.2, Math.sin(an) * 2.7);
    ctx.lineTo(Math.cos(an + 0.15) * 2.65, Math.sin(an + 0.15) * 3.15);
    ctx.stroke();
  }
  ell(ctx, 0, 0, 1.9, 2.35);
  const sh = ctx.createLinearGradient(0, -2.3, 0, 2.3);
  sh.addColorStop(0, flashed(a, '#e8a8c4'));
  sh.addColorStop(1, flashed(a, '#b06a90'));
  ctx.fillStyle = sh;
  ctx.fill();
  // (the profile, facing right: her bun, brow, nose, lips, chin, the neck down)
  ctx.beginPath();
  ctx.moveTo(-1.1, 2);
  ctx.lineTo(-0.9, 0.6);
  ctx.quadraticCurveTo(-1.6, 0.2, -1.4, -0.8);
  ctx.quadraticCurveTo(-1.6, -1.6, -0.9, -1.8);
  ctx.quadraticCurveTo(0.2, -2.1, 0.5, -1.1);
  ctx.lineTo(0.9, -0.5);
  ctx.lineTo(0.55, -0.35);
  ctx.lineTo(0.7, 0);
  ctx.lineTo(0.45, 0.25);
  ctx.quadraticCurveTo(0.55, 0.65, 0.1, 0.7);
  ctx.lineTo(0.2, 2);
  ctx.closePath();
  ctx.fillStyle = flashed(a, '#fff6fa');
  ctx.fill();
  ell(ctx, -0.6, -1.9, 0.6, 0.45);
  ctx.fill();
  ell(ctx, -0.6, -1.2, 1.2, 1.6);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fill();
  ctx.restore();
}

// ---------- Her colours ----------
const INK = '#6e4f7e';
const SKIN = ['#f6f4ff', '#dedcf8', '#bfbae8', '#a29cd6'];
const HAIR = ['#ddd6f2', '#bdb4dc', '#9a90c2', '#7c72a6'];
const PLUM = ['#b46aa8', '#8e467e', '#6e3262', '#52234a'];
const LINEN = ['#ffffff', '#f6f2fa', '#e4dcee', '#cbbfdc'];
const GOLD = ['#fff0b4', '#f2c868', '#c8963c'];
const STOCK = ['#6a4c7a', '#4c3460', '#382448'];
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
// A bone's frame in the base's kid-box units.
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
// A kid-box point on a bone, in the rig's own space.
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);

// ---------- Her head (painted finely in head.js; drawn here in the head's frame) ----------
const HCX = 80.5;
const HCY = 38.5;
function head(ctx, a, mode, D, part) {
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HSCALE, HSCALE);
  ctx.translate(-n[0], -n[1]);
  ctx.translate(HCX, HCY);
  ctx.scale(HG, HG);
  const q = a.vv ?? {};
  const flash = Math.min(0.85, Math.max(0, (a.flash ?? 0) * 6));
  if (part === 'back') drawHeadBack(ctx, a, mode, q, flash);
  else drawHeadFront(ctx, a, mode, q, flash);
  ctx.restore();
}

// ---------- Her dress (over the torso) ----------
function dress(ctx, a, mode, S, D) {
  const pts = a.blTorsoPts;
  if (mode === 'line' || !pts) {
    // (the skirt's outline; the bodice is the torso's own shape)
    skirt(ctx, a, mode, D);
    return;
  }
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.clip();
  // the bodice: the whole torso in plum velvet: deep at the sides, its pile catching the light in a soft
  // band down each side of her front, princess seams curving from the bust to the waist
  ctx.fillStyle = flashed(a, PLUM[1]);
  ctx.fillRect(-500, -500, 1000, 1000);
  ctx.save();
  enter(ctx, a, D, 'chest');
  const vg = ctx.createLinearGradient(56, 0, 104, 0);
  vg.addColorStop(0, rgbaOf(PLUM[3], 0.75));
  vg.addColorStop(0.2, rgbaOf(PLUM[2], 0.2));
  vg.addColorStop(0.36, rgbaOf(PLUM[0], 0.55));
  vg.addColorStop(0.5, rgbaOf(PLUM[1], 0));
  vg.addColorStop(0.66, rgbaOf(PLUM[0], 0.45));
  vg.addColorStop(0.82, rgbaOf(PLUM[2], 0.2));
  vg.addColorStop(1, rgbaOf(PLUM[3], 0.7));
  ctx.fillStyle = vg;
  ctx.fillRect(40, 40, 80, 80);
  glow(ctx, 72, 76, 9, '#d890c8', 0.35);
  for (const sd of [-1, 1]) {
    line(ctx, [[80 + sd * 12, 70], [80 + sd * 8.6, 84], [80 + sd * 10, 99]], rgbaOf(PLUM[3], 0.75), 0.55);
    line(ctx, [[80 + sd * 12 - 0.7, 70.4], [80 + sd * 8.6 - 0.7, 84], [80 + sd * 10 - 0.7, 99]], 'rgba(230,170,215,0.4)', 0.35);
  }
  ctx.restore();
  ctx.restore();
  // the skirt and the apron's skirt, over the bodice's lower edge
  skirt(ctx, a, mode, D);
  // the apron's bib: starched white, from under the collar to the waist, its straps over the shoulders
  // (locked to her: clipped to her body's own outline this frame, so the straps never stand up past her
  // shoulders as she moves)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...pts[0]);
  for (const p of pts.slice(1)) ctx.lineTo(...p);
  ctx.closePath();
  ctx.clip();
  enter(ctx, a, D, 'chest');
  // (its straps up over her shoulders, ruffled along their outer edge)
  for (const sd of [-1, 1]) {
    const a0 = [80 + sd * 9.6, 73];
    const a1 = [80 + sd * 15.4, 63];
    ctx.beginPath();
    ctx.moveTo(a0[0] - sd * 1.4, a0[1]);
    ctx.lineTo(a1[0] - sd * 1.6, a1[1]);
    ctx.lineTo(a1[0] + sd * 1.6, a1[1] + 0.4);
    for (let i = 0; i <= 4; i++) {
      const u = i / 4;
      const p = [mix(a1[0], a0[0], u) + sd * 2.4, mix(a1[1], a0[1], u)];
      ctx.quadraticCurveTo(p[0] + sd * 1.4, p[1] - 0.8, p[0] + sd * 0.2, p[1] + 1.4);
    }
    ctx.lineTo(a0[0] + sd * 1.4, a0[1]);
    ctx.closePath();
    ctx.fillStyle = flashed(a, LINEN[1]);
    ctx.fill();
    line(ctx, [[a0[0], a0[1]], [a1[0], a1[1]]], rgbaOf(LINEN[3], 0.6), 0.3);
  }
  const bib = [[70, 72], [90, 72], [92, 88], [90, 97], [70, 97], [68, 88]];
  smooth(ctx, bib);
  const bg = ctx.createLinearGradient(68, 0, 92, 0);
  bg.addColorStop(0, flashed(a, LINEN[2]));
  bg.addColorStop(0.35, flashed(a, '#ffffff'));
  bg.addColorStop(1, flashed(a, LINEN[1]));
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, 76, 78, 10, '#ffffff', 0.9);
  // (starched pintucks down it, each a fine fold with light beside it)
  for (const x of [73.4, 76.6, 83.4, 86.6]) {
    line(ctx, [[x, 72.6], [x + (x - 80) * 0.04, 96]], rgbaOf(LINEN[3], 0.7), 0.3);
    line(ctx, [[x + 0.5, 72.6], [x + 0.5 + (x - 80) * 0.04, 96]], 'rgba(255,255,255,0.9)', 0.25);
  }
  glow(ctx, 80, 96, 9, LINEN[2], 0.6);
  // (a little key embroidered in plum thread in the middle: her own badge)
  ctx.strokeStyle = flashed(a, PLUM[1]);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(80, 81.4, 1.3, 0, TAU);
  ctx.stroke();
  line(ctx, [[80, 82.7], [80, 88.6]], flashed(a, PLUM[1]), 0.45);
  line(ctx, [[80, 87], [81.3, 87]], flashed(a, PLUM[1]), 0.4);
  line(ctx, [[80, 88.4], [81, 88.4]], flashed(a, PLUM[1]), 0.4);
  ctx.restore();
  // (lace down the bib's sides: a soft scalloped edge)
  for (const sd of [-1, 1]) {
    const e0 = [80 + sd * 10, 72.6];
    const e1 = [80 + sd * 12, 88];
    const e2 = [80 + sd * 10, 96.6];
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const u = i / 8;
      pts.push(u < 0.64 ? [mix(e0[0], e1[0], u / 0.64), mix(e0[1], e1[1], u / 0.64)] : [mix(e1[0], e2[0], (u - 0.64) / 0.36), mix(e1[1], e2[1], (u - 0.64) / 0.36)]);
    }
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      ctx.quadraticCurveTo((p0[0] + p1[0]) / 2 + sd * 1.8, (p0[1] + p1[1]) / 2, p1[0], p1[1]);
    }
    ctx.closePath();
    ctx.fillStyle = flashed(a, '#ffffff');
    ctx.fill();
    ctx.strokeStyle = rgbaOf(LINEN[3], 0.6);
    ctx.lineWidth = 0.25;
    ctx.stroke();
  }
  // the collar: high and white, a cameo brooch at the throat
  ctx.restore();
}
// The skirt (both passes) and the apron's skirt over it: plum velvet from her waist to the floor, full
// and gently belled, soft folds falling the whole way; toward the floor the velvet pales and melts into a
// low ghostly mist, so she glides with no feet at all (her legs never show). Only its sides are inked:
// its hem is mist.
function skirt(ctx, a, mode, D) {
  const W = (x, y) => ptOf(a, D, 'torso', [x, y]);
  const t = a.t ?? 0;
  const wy = D.J.waist[1] + 2;
  const wl = W(60, wy);
  const wr = W(100, wy);
  const hl = W(53, wy + 13);
  const hr = W(107, wy + 13);
  const aN = ptOf(a, D, 'shinN', D.J.ankN);
  const aF = ptOf(a, D, 'shinF', D.J.ankF);
  const floorY = Math.max(aN[1], aF[1]) + 3;
  const sk = a.vvSkirt ?? 0;
  const sway = -sk * 4 + Math.sin(t * 1.4) * 0.6;
  const hc = (wl[0] + wr[0]) / 2 + sway;
  const HW = 33 * (1 + (a.vvJig ?? 0) * 0.03);
  const hemR = [hc + HW, floorY - 1];
  const hemL = [hc - HW, floorY - 1];
  const midR = [mix(hr[0], hemR[0], 0.5) + 2.4, mix(hr[1], hemR[1], 0.5)];
  const midL = [mix(hl[0], hemL[0], 0.5) - 2.4, mix(hl[1], hemL[1], 0.5)];
  // (the hem: soft waves where the folds reach the floor)
  const hem = [];
  for (let i = 0; i <= 8; i++) {
    const u = i / 8;
    hem.push([mix(hemR[0], hemL[0], u), floorY + Math.sin(u * Math.PI * 4 + t * 1.2) * 1.2 + Math.sin(u * Math.PI) * (1.6 - (a.vvJig ?? 0) * 1.2)]);
  }
  const shape = [wl, wr, hr, midR, ...hem, midL, hl];
  const hemM = [hc, floorY + 1.6];
  if (mode === 'line') {
    // (inked along its own edge, down to where it turns to mist)
    ctx.save();
    ctx.beginPath();
    ctx.rect(hc - 200, wl[1] - 200, 400, mix(wl[1], floorY, 0.9) - (wl[1] - 200));
    ctx.clip();
    smooth(ctx, shape);
    ctx.lineWidth = LW;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.restore();
    return;
  }
  smooth(ctx, shape);
  const vg = ctx.createLinearGradient(0, wl[1], 0, floorY + 2);
  vg.addColorStop(0, flashed(a, PLUM[1]));
  vg.addColorStop(0.58, flashed(a, PLUM[1]));
  vg.addColorStop(0.8, flashed(a, '#a678b8'));
  vg.addColorStop(0.93, flashed(a, '#d8d0f4'));
  vg.addColorStop(1, flashed(a, '#eeeaff'));
  ctx.fillStyle = vg;
  ctx.fill();
  ctx.save();
  smooth(ctx, shape);
  ctx.clip();
  // (deep at its sides, its pile catching the light down the front; fading out where it turns to mist)
  const sideG = ctx.createLinearGradient(hemL[0], 0, hemR[0], 0);
  sideG.addColorStop(0, rgbaOf(PLUM[3], 0.7));
  sideG.addColorStop(0.22, rgbaOf(PLUM[3], 0));
  sideG.addColorStop(0.42, rgbaOf(PLUM[0], 0.35));
  sideG.addColorStop(0.6, rgbaOf(PLUM[0], 0));
  sideG.addColorStop(0.82, rgbaOf(PLUM[3], 0));
  sideG.addColorStop(1, rgbaOf(PLUM[3], 0.6));
  ctx.fillStyle = sideG;
  ctx.fillRect(hemL[0] - 10, wl[1] - 4, HW * 2 + 20, (floorY - wl[1]) * 0.72);
  const fade = (al) => {
    const g = ctx.createLinearGradient(0, wl[1], 0, floorY);
    g.addColorStop(0, `rgba(82,35,74,${al})`);
    g.addColorStop(0.6, `rgba(82,35,74,${al})`);
    g.addColorStop(0.9, 'rgba(82,35,74,0)');
    return g;
  };
  const lit = (al) => {
    const g = ctx.createLinearGradient(0, wl[1], 0, floorY);
    g.addColorStop(0, `rgba(215,150,205,${al})`);
    g.addColorStop(0.6, `rgba(215,150,205,${al})`);
    g.addColorStop(0.9, 'rgba(215,150,205,0)');
    return g;
  };
  // (soft folds from the waist to the floor, widening as they fall, swaying with her)
  for (const u of [0.1, 0.26, 0.42, 0.58, 0.74, 0.9]) {
    const top = [mix(wl[0], wr[0], u), mix(wl[1], wr[1], u) + 2];
    const bot = [mix(hemL[0], hemR[0], u), floorY];
    const bend = (u - 0.5) * 8 + Math.sin(t * 1.6 + u * 4) * 0.5 - sk * 4;
    line(ctx, [top, [mix(top[0], bot[0], 0.5) + bend, (top[1] + bot[1]) / 2], bot], fade(0.5), 1.6);
    line(ctx, [[top[0] + 1.3, top[1] + 1], [mix(top[0], bot[0], 0.5) + bend + 1.8, (top[1] + bot[1]) / 2], [bot[0] + 2.2, bot[1]]], lit(0.3), 1.3);
  }
  ctx.restore();
  // the ghostly mist she glides on: soft drifting puffs along the hem
  for (let i = 0; i < 8; i++) {
    const u = (i + 0.5) / 8;
    const dx = Math.sin(t * 0.7 + i * 1.7) * 2.4;
    glow(ctx, mix(hemL[0] - 4, hemR[0] + 4, u) + dx, floorY + 0.5 + Math.sin(t + i) * 0.8, 9 + (i % 3) * 1.6, '#eeeaff', 0.75);
  }
  const hemL0 = hemL;
  const hemR0 = hemR;
  // the apron's skirt: a starched white panel down the front with a frilled edge, a pocket with a
  // feather duster in it
  const al = W(66, wy + 1);
  const ar = W(94, wy + 1);
  const ap = ((a.vvApron ?? 0) - (a.vvSkirt ?? 0)) * 3;
  const yA = mix(wl[1], floorY, 0.6);
  const bl = [hc - 17 - ap, yA];
  const br = [hc + 17 - ap, yA];
  void hemL0;
  void hemR0;
  // (its outline: down one side, along a scalloped hem of five soft bumps, up the other side)
  const apronPath = () => {
    ctx.beginPath();
    ctx.moveTo(...al);
    ctx.lineTo(...ar);
    ctx.quadraticCurveTo(ar[0] + 2, (ar[1] + br[1]) / 2, br[0], br[1]);
    const N = 5;
    for (let i = 0; i < N; i++) {
      const u0 = 1 - i / N;
      const u1 = 1 - (i + 1) / N;
      const p0 = [mix(bl[0], br[0], u0), mix(bl[1], br[1], u0)];
      const p1 = [mix(bl[0], br[0], u1), mix(bl[1], br[1], u1)];
      ctx.quadraticCurveTo((p0[0] + p1[0]) / 2, Math.max(p0[1], p1[1]) + 3.2, p1[0], p1[1]);
    }
    ctx.quadraticCurveTo(al[0] - 2, (al[1] + bl[1]) / 2, al[0], al[1]);
    ctx.closePath();
  };
  apronPath();
  ctx.fillStyle = flashed(a, LINEN[1]);
  ctx.fill();
  ctx.save();
  apronPath();
  ctx.clip();
  glow(ctx, (al[0] + ar[0]) / 2 - 3, al[1] + 6, 12, '#ffffff', 0.9);
  glow(ctx, (bl[0] + br[0]) / 2, bl[1] + 2, 10, LINEN[2], 0.6);
  // (two soft starched folds down it)
  for (const u of [0.3, 0.68]) {
    const t0 = [mix(al[0], ar[0], u), al[1] + 2];
    const b0 = [mix(bl[0], br[0], u), mix(bl[1], br[1], u)];
    line(ctx, [t0, [(t0[0] + b0[0]) / 2 + 0.8, (t0[1] + b0[1]) / 2], b0], rgbaOf(LINEN[3], 0.45), 1.2);
    line(ctx, [[t0[0] + 1, t0[1]], [(t0[0] + b0[0]) / 2 + 1.9, (t0[1] + b0[1]) / 2], [b0[0] + 1.2, b0[1]]], 'rgba(255,255,255,0.8)', 0.6);
  }
  // (a band of embroidery above the hem: a fine plum vine with little leaves)
  const ev = (u) => [mix(bl[0], br[0], u), mix(bl[1], br[1], u) - 2.8 + Math.sin(u * TAU * 3) * 0.6];
  ctx.beginPath();
  ctx.moveTo(...ev(0.04));
  for (let i = 1; i <= 24; i++) ctx.lineTo(...ev(0.04 + (i / 24) * 0.92));
  ctx.strokeStyle = rgbaOf(PLUM[0], 0.7);
  ctx.lineWidth = 0.3;
  ctx.stroke();
  for (let i = 0; i < 6; i++) {
    const p = ev(0.1 + i * 0.16);
    ell(ctx, p[0] + 0.6, p[1] + (i % 2 ? 0.7 : -0.7), 0.8, 0.35, i % 2 ? 0.5 : -0.5);
    ctx.fillStyle = rgbaOf(PLUM[0], 0.6);
    ctx.fill();
  }
  ctx.restore();
  // a fine line just inside the scalloped hem
  ctx.save();
  apronPath();
  ctx.clip();
  ctx.strokeStyle = flashed(a, LINEN[2]);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(bl[0], bl[1] - 1.6);
  ctx.lineTo(br[0], br[1] - 1.6);
  ctx.stroke();
  ctx.restore();
  // a plum sash at her waist, its bow tails at the back
  smooth(ctx, [[wl[0] - 1, wl[1] - 2.2], [wr[0] + 1, wr[1] - 2.2], [wr[0] + 1, wr[1] + 2.2], [wl[0] - 1, wl[1] + 2.2]]);
  const sg = ctx.createLinearGradient(0, wl[1] - 2.2, 0, wl[1] + 2.2);
  sg.addColorStop(0, flashed(a, PLUM[1]));
  sg.addColorStop(1, flashed(a, PLUM[3]));
  ctx.fillStyle = sg;
  ctx.fill();
  line(ctx, [[wl[0], wl[1] - 1.4], [wr[0], wr[1] - 1.4]], 'rgba(220,160,210,0.45)', 0.4);
  // the waistband and its pocket
  ctx.strokeStyle = flashed(a, LINEN[2]);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(al[0], al[1] + 1.5);
  ctx.lineTo(ar[0], ar[1] + 1.5);
  ctx.stroke();
  const pk = [mix(al[0], br[0], 0.66), mix(al[1], br[1], 0.42)];
  if ((a.vv?.duster ?? 0) < 0.3) duster(ctx, a, pk[0] + 1, pk[1] - 1);
  smooth(ctx, [[pk[0] - 4.4, pk[1] - 1], [pk[0] + 4.4, pk[1] - 1], [pk[0] + 4, pk[1] + 4.4], [pk[0] - 4, pk[1] + 4.4]]);
  ctx.fillStyle = flashed(a, LINEN[0]);
  ctx.fill();
  ctx.strokeStyle = flashed(a, LINEN[3]);
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([0.6, 0.5]);
  line(ctx, [[pk[0] - 3.6, pk[1] - 0.2], [pk[0] + 3.6, pk[1] - 0.2]], rgbaOf(PLUM[1], 0.6), 0.25);
  ctx.restore();
  glow(ctx, pk[0] - 1.6, pk[1] + 0.6, 2.6, '#ffffff', 0.7);
}
// A feather duster poking out of her apron pocket: a turned handle, a soft plume of lilac feathers.
function duster(ctx, a, x, y) {
  ctx.save();
  ctx.translate(x, y + 2);
  ctx.rotate((a.vvPlume ?? 0) * 0.25);
  ctx.translate(-x, -(y + 2));
  ctx.strokeStyle = flashed(a, '#a8784c');
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, y + 2);
  ctx.lineTo(x + 0.8, y - 3);
  ctx.stroke();
  // (soft curling feathers, each lit on top, a fine quill down its middle)
  for (const [dx, dy, r, an] of [[-1.4, -4.6, 2.3, -0.9], [3.4, -4.6, 2.3, 0.9], [0, -6.6, 2.4, -0.4], [2.4, -7, 2.3, 0.4], [1.2, -8.4, 2.2, 0]]) {
    const fx = x + dx;
    const fy = y + dy;
    ell(ctx, fx, fy, r * 0.55, r, an);
    const g = ctx.createLinearGradient(fx, fy - r, fx, fy + r);
    g.addColorStop(0, flashed(a, '#f6e8ff'));
    g.addColorStop(1, flashed(a, '#c8a2e0'));
    ctx.fillStyle = g;
    ctx.fill();
    line(ctx, [[fx - Math.sin(an) * r * 0.8, fy + Math.cos(an) * r * 0.8], [fx + Math.sin(an) * r * 0.7, fy - Math.cos(an) * r * 0.7]], 'rgba(150,110,180,0.5)', 0.2);
  }
  glow(ctx, x + 1, y - 8, 3, '#ffffff', 0.6);
  ctx.restore();
}
// Her chatelaine: a ring of old keys hanging from her waist on a little chain, swinging as she moves.
function keys(ctx, a, mode, D) {
  const st = a.mo?.rig ?? {};
  const top = ptOf(a, D, 'torso', [101, 99]);
  const sw = st.vvKey ?? 0;
  const ring = [top[0] + Math.sin(sw) * 6, top[1] + Math.cos(sw) * 6];
  ctx.save();
  ctx.lineCap = 'round';
  if (mode === 'line') {
    ctx.beginPath();
    ctx.moveTo(...top);
    ctx.lineTo(...ring);
    ctx.lineWidth = 2.4;
    ctx.strokeStyle = INK;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ring[0], ring[1], 2.6, 0, TAU);
    ctx.lineWidth = 3;
    ctx.stroke();
    for (const k of [-0.5, 0, 0.6]) {
      const an = Math.PI / 2 + k + sw * 0.8;
      const p0 = [ring[0] + Math.cos(an) * 2.6, ring[1] + Math.sin(an) * 2.6];
      const p1 = [p0[0] + Math.cos(an) * 5, p0[1] + Math.sin(an) * 5];
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.lineTo(...p1);
      ctx.lineWidth = 2.8;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(...top);
  ctx.lineTo(...ring);
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = flashed(a, GOLD[2]);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(ring[0], ring[1], 2.6, 0, TAU);
  ctx.lineWidth = 1;
  ctx.strokeStyle = flashed(a, GOLD[1]);
  ctx.stroke();
  for (const k of [-0.5, 0, 0.6]) {
    const an = Math.PI / 2 + k + sw * 0.8;
    const p0 = [ring[0] + Math.cos(an) * 2.6, ring[1] + Math.sin(an) * 2.6];
    const p1 = [p0[0] + Math.cos(an) * 5, p0[1] + Math.sin(an) * 5];
    ctx.beginPath();
    ctx.moveTo(...p0);
    ctx.lineTo(...p1);
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = flashed(a, GOLD[1]);
    ctx.stroke();
    // the bit at the end, and the bow at the top
    ell(ctx, p1[0], p1[1], 1, 0.7, an);
    ctx.fillStyle = flashed(a, GOLD[1]);
    ctx.fill();
    ell(ctx, p0[0], p0[1], 1.1, 1.1);
    ctx.fill();
  }
  ctx.restore();
}

// ---------- Her clothes on her limbs: cut from the skin's own outlines (a.blShapes), a little bigger, so
// no skin ever shows under them in any pose, and every join flows into the next piece ----------
// (the index along a limb's centre line nearest a point)
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
// (a stretch of a limb's tube: its centre line and widths from i0 to i1, each width grown by `grow`)
const span = (sh, i0, i1, grow) => [sh.pts.slice(i0, i1 + 1), sh.wl.slice(i0, i1 + 1).map((w) => w + grow * 2)];
// The sleeve: plum velvet from inside the shoulder (its round included) down past the elbow to a white
// frilled cuff on the forearm, puffed a little at the shoulder.
function sleeve(ctx, a, mode, D, side) {
  const sh = a.blShapes?.[`arm${side}`];
  if (!sh) return;
  const cuffAt = [mix(sh.el[0], sh.wr[0], 0.6), mix(sh.el[1], sh.wr[1], 0.6)];
  const iEnd = nearestAt(sh.pts, cuffAt);
  const [pts, wl] = span(sh, 0, iEnd, 0.7);
  // (the shoulder's puff: the round a little fuller)
  const puff = () => {
    ctx.moveTo(sh.sh[0] + sh.ball * 1.22, sh.sh[1]);
    ctx.arc(sh.sh[0], sh.sh[1] - sh.ball * 0.12, sh.ball * 1.22, 0, TAU);
  };
  const path = () => {
    D.skin.tubePath(ctx, pts, wl);
    puff();
  };
  path();
  if (mode === 'line') {
    ctx.lineWidth = LW;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
    return;
  }
  ctx.fillStyle = flashed(a, PLUM[1]);
  ctx.fill('nonzero');
  ctx.save();
  path();
  ctx.clip('nonzero');
  glow(ctx, sh.sh[0] - sh.ball * 0.5, sh.sh[1] - sh.ball * 0.6, sh.ball * 1.8, PLUM[0], 0.75);
  glow(ctx, sh.el[0] + sh.ball * 0.6, sh.el[1], sh.ball * 1.6, PLUM[3], 0.45);
  // soft gathers where the puff meets the upper arm
  ctx.strokeStyle = 'rgba(82,35,74,0.35)';
  ctx.lineWidth = 0.45;
  ctx.lineCap = 'round';
  for (const dx of [-0.7, -0.35, 0, 0.35, 0.7]) {
    ctx.beginPath();
    ctx.moveTo(sh.sh[0] + dx * sh.ball * 0.6, sh.sh[1] - sh.ball * 0.9);
    ctx.quadraticCurveTo(sh.sh[0] + dx * sh.ball * 1.3, sh.sh[1], sh.sh[0] + dx * sh.ball * 0.9, sh.sh[1] + sh.ball * 1.25);
    ctx.stroke();
  }
  ctx.strokeStyle = 'rgba(220,150,210,0.35)';
  for (const dx of [-0.5, 0.2]) {
    ctx.beginPath();
    ctx.moveTo(sh.sh[0] + dx * sh.ball * 0.6 + 0.6, sh.sh[1] - sh.ball * 0.8);
    ctx.quadraticCurveTo(sh.sh[0] + dx * sh.ball * 1.3 + 0.6, sh.sh[1], sh.sh[0] + dx * sh.ball * 0.9 + 0.6, sh.sh[1] + sh.ball * 1.15);
    ctx.stroke();
  }
  // (the velvet's sheen down the arm, and a soft crease at the elbow)
  ctx.strokeStyle = 'rgba(214,150,205,0.35)';
  ctx.lineWidth = wl[0] * 0.18;
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0] - 0.8, p[1]) : ctx.moveTo(p[0] - 0.8, p[1])));
  ctx.stroke();
  line(ctx, [[sh.el[0] - 1.6, sh.el[1] - 0.6], [sh.el[0], sh.el[1] + 0.4], [sh.el[0] + 1.6, sh.el[1] - 0.2]], rgbaOf(PLUM[3], 0.6), 0.45);
  ctx.restore();
  // the frilled white cuff round the sleeve's end, one scalloped band
  const e = pts[pts.length - 1];
  const p0 = pts[Math.max(0, pts.length - 2)];
  const dir = Math.atan2(e[1] - p0[1], e[0] - p0[0]);
  const w = wl[wl.length - 1] * 0.5 + 0.4;
  ctx.save();
  ctx.translate(e[0], e[1]);
  ctx.rotate(dir);
  ctx.beginPath();
  ctx.moveTo(-1.6, -w);
  ctx.lineTo(-1.6, w);
  const N = 4;
  for (let i = 0; i < N; i++) {
    const y0 = w - (i * 2 * w) / N;
    const y1 = w - ((i + 1) * 2 * w) / N;
    ctx.quadraticCurveTo(2.4, (y0 + y1) / 2, 0.6, y1);
  }
  ctx.closePath();
  ctx.fillStyle = flashed(a, LINEN[0]);
  ctx.fill();
  ctx.strokeStyle = rgbaOf(LINEN[3], 0.8);
  ctx.lineWidth = 0.25;
  ctx.stroke();
  for (let i = 0; i < N; i++) {
    const yy = w - ((i + 0.5) * 2 * w) / N;
    line(ctx, [[-0.4, yy], [0.8, yy * 0.95], [1.6, yy * 0.9]], rgbaOf(LINEN[3], 0.6), 0.22);
  }
  line(ctx, [[-1.4, -w + 0.3], [-1.4, w - 0.3]], flashed(a, PLUM[2]), 0.5);
  ctx.restore();
}
// A high collar over her neck: plum velvet round the neck's own outline from where it leaves her body up
// to just under her chin, a white lace edge at its top, so no bare neck shows under her head.
function collarHigh(ctx, a, mode, D) {
  const nk = a.blShapes?.neck;
  if (!nk) return;
  // (the neck's own outline from its foot up to a little under halfway, grown by a little all round,
  // its top edge curving down at the front)
  const dn = nk.dense ?? nk.pts;
  const n = dn.length - 1;
  const iTop = Math.max(2, Math.round(n * 0.46));
  const side = (i, k) => {
    const q = dn[Math.min(n, i + 1)];
    const r = dn[Math.max(0, i - 1)];
    const dx = q[0] - r[0];
    const dy = q[1] - r[1];
    const l = Math.hypot(dx, dy) || 1;
    const h = (nk.prof ? nk.prof(i / n) : nk.wl[0]) / 2 + 0.8;
    return [dn[i][0] - (dy / l) * h * k, dn[i][1] + (dx / l) * h * k];
  };
  const L = [];
  const R = [];
  for (let i = 0; i <= iTop; i++) {
    L.push(side(i, 1));
    R.push(side(i, -1));
  }
  const pts = [...L, ...R.reverse()];
  const path = () => {
    ctx.beginPath();
    ctx.moveTo(...pts[0]);
    for (const q of pts.slice(1)) ctx.lineTo(...q);
    ctx.closePath();
  };
  path();
  if (mode === 'line') {
    ctx.lineWidth = LW;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
    return;
  }
  const e = dn[iTop];
  const b0 = dn[0];
  const g = ctx.createLinearGradient(L[iTop][0], L[iTop][1], R[0][0], R[0][1]);
  g.addColorStop(0, flashed(a, PLUM[2]));
  g.addColorStop(0.45, flashed(a, PLUM[0]));
  g.addColorStop(1, flashed(a, PLUM[2]));
  ctx.fillStyle = g;
  ctx.fill();
  ctx.save();
  path();
  ctx.clip();
  // (soft velvet folds round it, a shade at its foot)
  for (const u of [0.35, 0.7]) {
    const i = Math.round(iTop * u);
    line(ctx, [side(i, 1), dn[i], side(i, -1)], rgbaOf(PLUM[3], 0.5), 0.5);
  }
  glow(ctx, b0[0], b0[1], 6, PLUM[3], 0.4);
  ctx.restore();
  // the white lace edge at its top: a soft scalloped ruffle round the neck
  const dir = Math.atan2(e[1] - dn[iTop - 1][1], e[0] - dn[iTop - 1][0]);
  const w = (nk.prof ? nk.prof(iTop / n) : nk.wl[0]) / 2 + 1.1;
  ctx.save();
  ctx.translate(e[0], e[1]);
  ctx.rotate(dir);
  ctx.beginPath();
  ctx.moveTo(-1.4, -w - 0.3);
  ctx.lineTo(-1.4, w + 0.3);
  const N = 5;
  for (let i = 0; i < N; i++) {
    const y0 = w + 0.3 - (i * (2 * w + 0.6)) / N;
    const y1 = w + 0.3 - ((i + 1) * (2 * w + 0.6)) / N;
    ctx.quadraticCurveTo(2, (y0 + y1) / 2, 0.4, y1);
  }
  ctx.closePath();
  ctx.fillStyle = flashed(a, LINEN[0]);
  ctx.fill();
  ctx.strokeStyle = rgbaOf(LINEN[3], 0.7);
  ctx.lineWidth = 0.25;
  ctx.stroke();
  ctx.restore();
  // the cameo brooch at the front of the collar
  const cm = dn[Math.round(iTop * 0.45)];
  cameo(ctx, a, cm[0], cm[1], 0.72);
}
// The neck above the collar: a soft shadow under her jaw, a shade down each side, so it reads round.
function neckShade(ctx, a, mode, D) {
  const nk = a.blShapes?.neck;
  if (!nk?.outline || mode !== 'fill') return;
  const dn = nk.dense;
  const n = dn.length - 1;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(...nk.outline[0]);
  for (const q of nk.outline.slice(1)) ctx.lineTo(...q);
  ctx.closePath();
  ctx.clip();
  const at = (u, k) => {
    const i = Math.round(u * n);
    const q = dn[Math.min(n, i + 1)];
    const r = dn[Math.max(0, i - 1)];
    const dx = q[0] - r[0];
    const dy = q[1] - r[1];
    const l = Math.hypot(dx, dy) || 1;
    const h = nk.prof(i / n) / 2;
    return [dn[i][0] - (dy / l) * h * k, dn[i][1] + (dx / l) * h * k];
  };
  const w = nk.prof(1);
  for (const k of [-1, 1]) line(ctx, [at(0.45, k * 0.7), at(0.7, k * 0.72), at(1, k * 0.7)], rgbaOf(SKIN[2], k > 0 ? 0.7 : 0.45), w * 0.3);
  const chin = at(0.8, 0);
  ctx.translate(chin[0], chin[1]);
  ctx.scale(1, 0.55);
  glow(ctx, 0, 0, w * 1.05, SKIN[3], 0.8);
  ctx.restore();
}
// Her gloves: short white cotton housekeeper's gloves over the hand's own round and thumb, a touch bigger,
// lit on the back of the hand, three fine stitched points down it, a little plum-edged cuff at the wrist.
function glove(ctx, a, mode, side) {
  const hs = a.blShapes?.[`hand${side}`];
  if (!hs || mode !== 'fill') return;
  ctx.save();
  ctx.transform(...hs.M);
  const far = side === 'F';
  ell(ctx, hs.c[0], hs.c[1], hs.r + 0.5, hs.r * 0.95 + 0.5);
  ctx.fillStyle = flashed(a, far ? LINEN[2] : LINEN[1]);
  ctx.fill();
  ell(ctx, hs.thumb[0], hs.thumb[1], hs.thumb[2] + 0.4, hs.thumb[2] * 0.95 + 0.4);
  ctx.fill();
  ctx.save();
  ell(ctx, hs.c[0], hs.c[1], hs.r + 0.5, hs.r * 0.95 + 0.5);
  ctx.clip();
  glow(ctx, hs.c[0] - hs.r * 0.2, hs.c[1] + hs.r * 0.45, hs.r, LINEN[3], 0.6);
  glow(ctx, hs.c[0] + hs.r * 0.2, hs.c[1] - hs.r * 0.4, hs.r * 0.7, '#ffffff', 0.9);
  for (const k of [-0.35, 0, 0.35]) line(ctx, [[hs.c[0] + k * hs.r, hs.c[1] - hs.r * 0.7], [hs.c[0] + k * hs.r * 1.1, hs.c[1] + hs.r * 0.1]], rgbaOf(LINEN[3], 0.9), 0.22);
  ctx.restore();
  ctx.restore();
}

// ---------- Her springs: her skirt, apron, cap ribbon, loose wisps of hair, bun, duster and keys all move
// with her (each a damped spring kicked by her steps, leans and turns, settling softly) ----------
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
// lands on a real footfall (her walk cycle passing 0 or a half, `cyc` the rig's own a.bl<kind>U), it is
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
  const step = Math.sin(t * 7.2) * walk;
  // how fast she's leaning and bobbing: the kick for everything that hangs off her
  const tilt = out.tilt ?? 0;
  const tv = (tilt - (st.vvLastTilt ?? tilt)) / Math.max(dt, 1e-3);
  st.vvLastTilt = tilt;
  const hop = (out.hop ?? 0) + (out.lift ?? 0);
  const hv = (hop - (st.vvLastHop ?? hop)) / Math.max(dt, 1e-3);
  st.vvLastHop = hop;
  const kick = clamp(-tv * 0.012, -1.2, 1.2) + step * 0.5;
  // skirt and apron: the hem swings back as she moves, the apron a beat behind
  a.vvSkirt = spring(st, 'vvSk', kick * 0.9, 70, 7, dt);
  a.vvApron = spring(st, 'vvAp', a.vvSkirt * 1.2, 48, 5.5, dt);
  // the cap's ribbon tails and the loose wisps of hair at her temples
  a.vvRibbon = spring(st, 'vvRb', kick * 1.2 + Math.sin(t * 1.3) * 0.15, 40, 4.5, dt);
  a.vvWisp = spring(st, 'vvWs', kick * 1 + Math.sin(t * 1.1) * 0.12 - hv * 0.02, 34, 4, dt);
  // the bun bobs a little with her head
  a.vvBun = spring(st, 'vvBn', clamp(-hv * 0.03, -1, 1), 90, 9, dt);
  // the duster's plume and her keys
  a.vvPlume = spring(st, 'vvPl', kick * 1.4, 55, 5, dt);
  st.vvKey = spring(st, 'vvKy', kick * 0.9, 60, 6, dt);
  // (her soft-body jolt: her bun and cap, her skirt)
  a.vvJig = jolt(m, a, st, 'vvJg', dt, 'blgrownupU');
}

// ---------- Her act (about 30 s, only while she stands about) ----------
//   1  inspection: bent forward over the runner, peering over her spectacles; a speck of mud found:
//      "tsk, tsk";
//   2  dusting: the feather duster out of her pocket, brisk swishes at something up high, a puff of dust;
//   3  tea: a cup on its saucer held up, a sip, pinky out, eyes shut: "ahh";
//   4  her keys: a pat of the ring at her hip, a jingle, chin up;
//   5  waiting: arms down, a foot tapping, a glance at the door: "Hmph."
// (the casts a cutscene can ask her for by name)
const SCENE_POSES = new Set(['polish', 'inspect', 'rules', 'keys', 'tea', 'pour', 'bell', 'dust']);
function pose(m, a, out, c) {
  const st = (a.mo.rig ??= {});
  const dt = clamp(a.dt ?? 0, 0, 0.05);
  const q = { face: 'stern', turn: 0.25, talk: 0, bunBob: 0, duster: 0, cup: 0, cue: null, cueU: 0, puff: -1, jingle: -1, steam: 0, tray: 0, pot: 0, potTilt: 0, keyring: 0, cloth: 0, bell: 0 };
  a.vv = q;
  const dead = m.hp <= 0;
  const hurt = (a.hurtAgo ?? 9) < 0.45;
  const napping = (m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0)) || m.pose === 'sleep';
  const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3 || Boolean(m.cast);
  const want = dead || hurt || fighting || napping || m.cine || m.pose ? 0 : clamp((1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1), 0, 1);
  st.vvW = Number.isFinite(st.vvW) ? st.vvW + (want - st.vvW) * Math.min(1, dt * (want < st.vvW ? 9 : 3.5)) : want;
  const calm = st.vvW;
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
    const lu = (((t + (m.uid % 5) * 3.3) % 30) + 30) % 30;
    let face = null;
    // 1  inspection
    const ins = hold(lu, 1, 1.8, 5.4, 6.2) * calm;
    go({ tilt: 14, head: 14, shN: -150, elN: -110, shF: -12, elF: -30 }, ins);
    if (ins > 0.4) face = lu > 4 ? 'tsk' : 'inspect';
    if (lu > 4 && lu < 5.6) {
      q.cue = 'tsk, tsk';
      q.cueU = (lu - 4) / 1.6;
    }
    // 2  dusting: the duster out of her pocket, swished briskly
    const dus = hold(lu, 7.4, 8, 11.6, 12.2) * calm;
    q.duster = dus;
    const sw = Math.sin((lu - 8) * 11);
    // (dusting something up high: the duster swishing above her)
    go({ shN: -128 + sw * 18, elN: -26 + sw * 16, tilt: -3 + sw * 2, head: -10 }, dus);
    if (dus > 0.4) face = 'focus';
    if (lu > 8.2 && lu < 11.4) q.puff = ((lu - 8.2) % 0.9) / 0.9;
    // 3  tea: cup and saucer held up, a sip, pinky out
    const tea = hold(lu, 13.4, 14.2, 17.8, 18.6) * calm;
    q.cup = tea;
    const sip = hold(lu, 15, 15.4, 16.6, 17);
    go({ shN: -70 - sip * 42, elN: -85 - sip * 35, shF: -38, elF: -95, head: -sip * 9, tilt: -sip * 3 }, tea);
    q.steam = tea * (1 - sip * 0.6);
    if (tea > 0.4) face = sip > 0.5 ? 'fond' : 'stern';
    if (lu > 16.4 && lu < 18) {
      q.cue = 'ahh';
      q.cueU = (lu - 16.4) / 1.6;
    }
    // 4  her keys: a pat, a jingle, chin up
    const ky = hold(lu, 19.6, 20.1, 22.6, 23.2) * calm;
    go({ shF: 22, elF: -30, head: -8 + Math.sin((lu - 20) * 9) * ky * 2, tilt: -3 }, ky);
    if (lu > 20.2 && lu < 21.4) {
      q.jingle = (lu - 20.2) / 1.2;
      st.vvKyV = (st.vvKyV ?? 0) + Math.sin(lu * 30) * 6;
    }
    if (ky > 0.4) face = 'stern';
    // 5  waiting: arms folded, a foot tapping, a glance at the door
    const wt = hold(lu, 24.4, 25.2, 28.6, 29.4) * calm;
    const tap = Math.max(0, Math.sin((lu - 25.2) * 10));
    // (her arms down at her sides while she waits, one foot tapping)
    go({ shN: -6, elN: -18, shF: -5, elF: -16, fyN: tap * 0.12, head: lu > 27 ? -6 : 4, tilt: -3 }, wt);
    q.turn = 0.25 + (lu > 27 && lu < 28.4 ? -0.5 : 0) * wt;
    if (wt > 0.4) face = lu > 27.6 ? 'tsk' : 'stern';
    if (lu > 27.7 && lu < 29.2) {
      q.cue = 'Hmph.';
      q.cueU = (lu - 27.7) / 1.5;
    }
    if (face && !dead && !hurt) q.face = face;
  }
  // ---------- Her fight (2026-11-28, the player: "nice idle animations attack animations
  // expressively animated and smooth"): between her casts she's never idle: a hand on her hip, the
  // other at her apron, her toe tapping with impatience, and every few seconds a moment of her own (she
  // pushes her spectacles up, wags a finger, brushes down her apron). Sterner with each phase: stern,
  // then scandalised and shouting, then grimly focused. Her basic attack: her arm whisked up behind her
  // head with the feather duster, then swatted down and forward with a step into it. ----------
  {
    const walk = clamp(a.walkW ?? 0, 0, 1);
    const fwant = fighting && !dead && !napping && !m.cine && !m.pose ? 1 - walk * 0.7 : 0;
    // (eased in and out along a steady ramp, so it starts and ends gently: no snap as the fight begins)
    st.vvFWL = Number.isFinite(st.vvFWL) ? st.vvFWL + clamp(fwant - st.vvFWL, -dt * 2.2, dt * 1.6) : fwant;
    const fw = st.vvFWL * st.vvFWL * (3 - 2 * st.vvFWL);
    const p = m.mech?.phase ?? 1;
    if (fw > 0.01) {
      const tap = Math.max(0, Math.sin(t * 9)) * (1 - walk);
      go({ shF: 18, elF: -64, shN: -22, elN: -46, tilt: -2 + Math.sin(t * 1.3) * 1.5, head: 4 + Math.sin(t * 1.1) * 2, fyN: -0.05 * tap }, fw);
      const fu = (((t + (m.uid % 3) * 2.1) % 8) + 8) % 8;
      const specs = hold(fu, 1, 1.3, 2, 2.4) * fw;
      go({ shN: -150, elN: -118, head: 6, tilt: 2 }, specs);
      const wag = hold(fu, 3.4, 3.7, 4.8, 5.2) * fw;
      go({ shN: -122, elN: -58 + Math.sin(t * 16) * 12, head: -4, tilt: -3 }, wag);
      const brush = hold(fu, 6.2, 6.5, 7.2, 7.6) * fw;
      go({ shN: -28, elN: -20 + Math.sin(t * 14) * 10, head: 12, tilt: 5 }, brush);
      if (!hurt && !dead) {
        const base = p >= 3 ? 'focus' : p >= 2 ? 'tsk' : 'stern';
        q.face = specs > 0.4 ? 'inspect' : wag > 0.4 ? (p >= 2 ? 'shout' : 'tsk') : brush > 0.4 ? 'stern' : base;
        if (wag > 0.3) q.talk = Math.max(q.talk, wag * (0.5 + 0.5 * Math.sin(t * 12)));
      }
    }
    // (her basic attack, from the rig's attack phase: the duster whisked up, then swatted down)
    const ap = a.ph ?? { antic: 0, strike: 0 };
    if (!dead && ap.antic > 0.01) {
      go({ shN: -168, elN: -50, shF: 20, elF: -64, tilt: -7, head: -8, x: -0.015 }, ap.antic);
      q.duster = Math.max(q.duster, ap.antic);
      if (!hurt) q.face = 'shout';
    }
    if (!dead && ap.strike > 0.01) {
      // (the elbow kept softly bent: swung in fast and straightened, it overshoots into the elbow's
      // stop and snaps)
      go({ shN: -50, elN: -28, shF: 20, elF: -64, tilt: 13, head: 8, x: 0.03, fxN: 0.08 }, ap.strike);
      q.duster = Math.max(q.duster, ap.strike);
      if (!hurt) q.face = 'shout';
    }
  }
  // ---------- Her casts (world/manor.js): a pose for each bit of housekeeping, eased in, held, and
  // eased back out after it lands (never snapping) ----------
  const now = a.now ?? 0;
  let castWant = null;
  let cu = 0;
  if (!dead && m.cast && m.castPose) {
    castWant = m.castPose;
    cu = clamp((now - m.cast.t0) / Math.max(0.2, m.cast.dur), 0, 1);
  } else if (!dead && m.phaseAt != null && now - m.phaseAt < 1.6) {
    castWant = (m.mech?.phase ?? 1) >= 3 ? 'polish' : 'bell';
    cu = (now - m.phaseAt) / 1.6;
  } else if (!dead && m.cine?.act && SCENE_POSES.has(m.cine.act.move) && now >= m.cine.act.at && now < m.cine.act.at + m.cine.act.dur) {
    // (a cutscene's own moment (data/scenes.js { act, move }): the same pose, props and face as the
    // cast it's named after)
    castWant = m.cine.act.move;
    cu = (now - m.cine.act.at) / Math.max(0.2, m.cine.act.dur);
  }
  if (castWant) {
    st.vvCast = castWant;
    st.vvCastU = cu;
  }
  st.vvCastW = clamp((st.vvCastW ?? 0) + (castWant ? dt * 4.5 : -dt * 3), 0, 1);
  const cw = sstep(st.vvCastW);
  if (cw > 0.001 && st.vvCast) {
    const u = castWant ? cu : 1;
    const ph = t * 1;
    const late = sstep((u - 0.78) / 0.18);
    const P = {
      // flicking her runner out: bent low over it, then both arms swinging it forward
      runner: { tilt: 16 - late * 10, drop: 0.07 * (1 - late), shN: -40 - late * 70, elN: -20 - late * 20, shF: -36 - late * 60, elF: -18 - late * 30, head: 10 - late * 14 },
      // tea served: the tray held up high on her near hand, the far hand on her hip
      tea: { shN: -118, elN: -64, shF: 18, elF: -64, head: -6, tilt: -3 },
      // peering over her spectacles at the floor ahead, one hand at their rim
      inspect: { tilt: 18, head: 16, shN: -150, elN: -118, shF: -12, elF: -30, x: 0.02 },
      // the teapot raised and tipped over the tank
      pour: { shN: -140 + late * 20, elN: -40 - late * 30, shF: -20, elF: -40, tilt: 6 + late * 6, head: 6 },
      // the duster whirling round over her head
      dust: { shN: -158 + Math.sin(ph * 14) * 18, elN: -30 + Math.sin(ph * 14 + 1) * 22, shF: -10, elF: -30, tilt: Math.sin(ph * 7) * 4, head: -8 },
      // bent low, the duster swept along the skirting
      dustlow: { drop: 0.1, tilt: 22, head: 10, shN: -60 + Math.sin(ph * 12) * 26, elN: -10, shF: -30, elF: -40 },
      // the keys held up, jingling
      keys: { shN: -150, elN: -34 + Math.sin(ph * 24) * 6, shF: 16, elF: -60, head: -8, tilt: -4 },
      // bent over the floor, polishing in brisk circles
      polish: { drop: 0.12, tilt: 20, head: 12, shN: -78 + Math.sin(ph * 10) * 16, elN: -24 + Math.cos(ph * 10) * 16, shF: -70 + Math.cos(ph * 10) * 14, elF: -20 + Math.sin(ph * 10) * 14 },
      // reading out the house rules, one finger raised
      rules: { shN: -160, elN: -12, shF: 18, elF: -64, head: -10, tilt: -4 },
      // ringing the bell for the maids
      bell: { shN: -150 + Math.sin(ph * 30) * 8, elN: -40, shF: 16, elF: -60, head: -8, tilt: -3 },
    }[st.vvCast];
    if (P) go(P, cw);
    const c = st.vvCast;
    const FACE = { runner: late > 0.3 ? 'shout' : 'stern', tea: 'fond', inspect: 'inspect', pour: 'focus', dust: 'focus', dustlow: 'focus', keys: 'stern', polish: 'focus', rules: 'shout', bell: 'shout' };
    if (cw > 0.4 && !hurt) q.face = FACE[c] ?? q.face;
    if (c === 'tea') q.tray = cw;
    if (c === 'pour') {
      q.pot = cw;
      q.potTilt = late;
    }
    if (c === 'dust' || c === 'dustlow') q.duster = Math.max(q.duster, cw);
    if (c === 'keys') q.keyring = cw;
    if (c === 'polish') q.cloth = cw;
    if (c === 'bell') q.bell = cw;
    if (c === 'rules') q.talk = cw * (0.5 + 0.5 * Math.sin(t * 12));
  }
  if (m.faceTest) q.face = m.faceTest;
  springs(m, a, out, st, dt);
  q.bunBob = (a.vvBun ?? 0) * 0.8;
}
// Her props in her near hand (over it): the feather duster as she dusts, a cup and saucer for tea.
function handProps(ctx, a, mode, D) {
  const q = a.vv ?? {};
  const hs = a.blShapes?.handN;
  if (!hs) return;
  if (Math.max(q.tray, q.pot, q.keyring, q.cloth, q.bell) > 0.05) {
    castProps(ctx, a, mode, hs, q);
    return;
  }
  if (q.duster < 0.05 && q.cup < 0.05) return;
  ctx.save();
  ctx.transform(...hs.M);
  const [hx, hy] = hs.c;
  if (q.duster > 0.05) {
    ctx.globalAlpha *= Math.min(1, q.duster * 1.6);
    ctx.translate(hx, hy);
    ctx.rotate(-0.9 + (a.vvPlume ?? 0) * 0.2);
    if (mode === 'line') {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -9);
      ctx.lineWidth = 3;
      ctx.strokeStyle = INK;
      ctx.lineCap = 'round';
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(0, 1);
      ctx.lineTo(0, -8);
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = flashed(a, '#a8784c');
      ctx.lineCap = 'round';
      ctx.stroke();
      for (const [dx, dy, r] of [[0, -10.4, 3], [2.4, -9.2, 2.4], [-2.4, -9.2, 2.4], [0.6, -12.6, 2.2], [-1.4, -12, 1.8]]) {
        ell(ctx, dx, dy, r, r * 0.82);
        ctx.fillStyle = flashed(a, '#e6c8f4');
        ctx.fill();
      }
      glow(ctx, -0.6, -11.6, 3, '#ffffff', 0.6);
    }
  } else if (q.cup > 0.05) {
    ctx.globalAlpha *= Math.min(1, q.cup * 1.6);
    ctx.translate(hx + 1, hy - 2.6);
    if (mode === 'line') {
      ell(ctx, 0, 1.6, 4.6, 1.2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else {
      // the saucer, the cup with a gold rim, a plum band; the pinky out beside it
      ell(ctx, 0, 1.6, 4.4, 1.1);
      ctx.fillStyle = flashed(a, '#fbf8ff');
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-2.6, -2.2);
      ctx.lineTo(2.6, -2.2);
      ctx.quadraticCurveTo(2.4, 1.2, 0, 1.3);
      ctx.quadraticCurveTo(-2.4, 1.2, -2.6, -2.2);
      ctx.fillStyle = flashed(a, '#ffffff');
      ctx.fill();
      ctx.fillStyle = flashed(a, PLUM[1]);
      ctx.fillRect(-2.5, -1.2, 5, 0.7);
      ell(ctx, 0, -2.2, 2.6, 0.55);
      ctx.fillStyle = flashed(a, '#c27a4a');
      ctx.fill();
      ctx.strokeStyle = flashed(a, GOLD[1]);
      ctx.lineWidth = 0.35;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(3, -0.6, 1, -1.2, 1.2);
      ctx.lineWidth = 0.6;
      ctx.strokeStyle = flashed(a, '#ffffff');
      ctx.stroke();
    }
  }
  ctx.restore();
}
// Her cast props in her near hand: a silver tea tray with a cup, the teapot (tipping as she pours), the
// manor's key ring, a polishing cloth, the hand bell for the maids. Each outlined in her ink in the
// first pass, filled in the second.
function castProps(ctx, a, mode, hs, q) {
  ctx.save();
  ctx.transform(...hs.M);
  const [hx, hy] = hs.c;
  const ink = (w = 2) => {
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = INK;
    ctx.stroke();
  };
  const silver = (x0, y0, x1, y1) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, flashed(a, '#ffffff'));
    g.addColorStop(0.5, flashed(a, '#c8c4dc'));
    g.addColorStop(1, flashed(a, '#7a7498'));
    return g;
  };
  if (q.tray > 0.05) {
    ctx.globalAlpha *= Math.min(1, q.tray * 1.6);
    ctx.translate(hx, hy - 3);
    ell(ctx, 0, 0, 8, 1.8);
    if (mode === 'line') ink();
    else {
      ctx.fillStyle = silver(-8, -2, 8, 2);
      ctx.fill();
      // a cup and saucer on it, steaming
      ell(ctx, -1, -1.2, 3.4, 0.9);
      ctx.fillStyle = flashed(a, '#fbf8ff');
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-3, -4.6);
      ctx.lineTo(1, -4.6);
      ctx.quadraticCurveTo(0.8, -1.6, -1, -1.5);
      ctx.quadraticCurveTo(-2.8, -1.6, -3, -4.6);
      ctx.fillStyle = flashed(a, '#ffffff');
      ctx.fill();
      ctx.fillStyle = flashed(a, PLUM[1]);
      ctx.fillRect(-3, -3.6, 4, 0.6);
      for (let k = 0; k < 2; k++) {
        const u = ((a.t ?? 0) * 0.6 + k * 0.5) % 1;
        ctx.globalAlpha = Math.sin(Math.PI * u) * 0.5;
        ctx.beginPath();
        ctx.arc(-1 + Math.sin(u * 6 + k) * 1.4, -6 - u * 6, 1 + u, 0, TAU);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
    }
  } else if (q.pot > 0.05) {
    ctx.globalAlpha *= Math.min(1, q.pot * 1.6);
    ctx.translate(hx + 1, hy - 4);
    ctx.rotate(0.15 + q.potTilt * 0.9);
    const body = () => {
      ctx.beginPath();
      ctx.moveTo(-5, 3);
      ctx.quadraticCurveTo(-7, -2, -4, -5);
      ctx.lineTo(4, -5);
      ctx.quadraticCurveTo(7, -2, 5, 3);
      ctx.closePath();
      // (the spout, curving out to the front)
      ctx.moveTo(4.4, -1);
      ctx.quadraticCurveTo(9, -2, 11, -7);
      ctx.lineTo(12, -6.4);
      ctx.quadraticCurveTo(10, -1, 5, 1.6);
      ctx.closePath();
    };
    body();
    if (mode === 'line') ink();
    else {
      ctx.fillStyle = silver(-6, -5, 6, 3);
      ctx.fill();
      ell(ctx, 0, -5.4, 3.6, 1.1);
      ctx.fillStyle = silver(-4, -6, 4, -4);
      ctx.fill();
      ell(ctx, 0, -6.8, 1.1, 1.1);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-6.6, -1, 2.6, Math.PI * 0.5, Math.PI * 1.5);
      ctx.lineWidth = 1;
      ctx.strokeStyle = flashed(a, '#a8a4c0');
      ctx.stroke();
      ell(ctx, -2.4, -2, 0.8, 2.2, 0.2);
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fill();
    }
  } else if (q.keyring > 0.05) {
    ctx.globalAlpha *= Math.min(1, q.keyring * 1.6);
    ctx.translate(hx, hy - 4);
    const sw = Math.sin((a.t ?? 0) * 24) * 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, TAU);
    if (mode === 'line') ink(2.4);
    else {
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = flashed(a, GOLD[1]);
      ctx.stroke();
    }
    for (const [an, len] of [[1.2, 7], [1.65, 8.5], [2.1, 6.5]]) {
      const aa = an + sw;
      const p0 = [Math.cos(aa) * 3, Math.sin(aa) * 3];
      const p1 = [p0[0] + Math.cos(aa) * len, p0[1] + Math.sin(aa) * len];
      ctx.beginPath();
      ctx.moveTo(...p0);
      ctx.lineTo(...p1);
      if (mode === 'line') ink(2.4);
      else {
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = flashed(a, GOLD[1]);
        ctx.stroke();
        ell(ctx, p0[0] + Math.cos(aa) * 1.4, p0[1] + Math.sin(aa) * 1.4, 1.3, 1.3);
        ctx.fillStyle = flashed(a, GOLD[0]);
        ctx.fill();
        ctx.fillStyle = flashed(a, GOLD[2]);
        ctx.fillRect(p1[0] - 0.5, p1[1] - 1.6, 1.8, 1.2);
      }
    }
  } else if (q.cloth > 0.05) {
    ctx.globalAlpha *= Math.min(1, q.cloth * 1.6);
    ctx.translate(hx, hy + 1);
    ctx.beginPath();
    ctx.moveTo(-4, -2);
    ctx.quadraticCurveTo(0, -4, 4, -2);
    ctx.quadraticCurveTo(5, 2, 3, 4);
    ctx.quadraticCurveTo(0, 5, -3, 4);
    ctx.quadraticCurveTo(-5, 2, -4, -2);
    ctx.closePath();
    if (mode === 'line') ink();
    else {
      ctx.fillStyle = flashed(a, LINEN[1]);
      ctx.fill();
      ctx.strokeStyle = rgbaOf(LINEN[3], 0.8);
      ctx.lineWidth = 0.3;
      ctx.beginPath();
      ctx.moveTo(-2, -1);
      ctx.quadraticCurveTo(0, 1, 2, 3);
      ctx.stroke();
    }
  } else if (q.bell > 0.05) {
    ctx.globalAlpha *= Math.min(1, q.bell * 1.6);
    ctx.translate(hx, hy - 2);
    ctx.rotate(Math.sin((a.t ?? 0) * 30) * 0.35);
    ctx.beginPath();
    ctx.moveTo(-1, -3);
    ctx.lineTo(1, -3);
    ctx.lineTo(1, -8);
    ctx.lineTo(-1, -8);
    ctx.closePath();
    ctx.moveTo(-4.6, 6);
    ctx.quadraticCurveTo(-4, -3, 0, -3.4);
    ctx.quadraticCurveTo(4, -3, 4.6, 6);
    ctx.closePath();
    if (mode === 'line') ink();
    else {
      const g = ctx.createLinearGradient(-4, -3, 4, 6);
      g.addColorStop(0, flashed(a, GOLD[0]));
      g.addColorStop(1, flashed(a, GOLD[2]));
      ctx.fillStyle = g;
      ctx.fill();
      ell(ctx, 0, 6.6, 1.2, 1.2);
      ctx.fillStyle = flashed(a, GOLD[2]);
      ctx.fill();
      ell(ctx, -1.6, 0.6, 0.7, 2.2, 0.2);
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.fill();
    }
  }
  ctx.restore();
}
// Her act's little extras: the speck of mud found, a puff of dust, steam off her tea, a jingle of keys,
// and what she says.
function vvFx(ctx, m, a, S, matOf, D) {
  const q = a.vv;
  if (!q || m.hp <= 0) return;
  const t = a.t ?? 0;
  const hd = D.at(a, 'head', [0, -D.SC * 30]);
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
  if (q.cue) text(q.cue, hd[0] + 16, hd[1] - 4 - q.cueU * 4, 6, '#8e467e', Math.sin(Math.PI * q.cueU));
  const hs = a.blShapes?.handN;
  const hand = hs ? [hs.M[0] * hs.c[0] + hs.M[2] * hs.c[1] + hs.M[4], hs.M[1] * hs.c[0] + hs.M[3] * hs.c[1] + hs.M[5]] : hd;
  if (q.puff >= 0 && q.duster > 0.4) {
    const u = q.puff;
    ctx.save();
    ctx.globalAlpha *= (1 - u) * 0.8;
    for (let i = 0; i < 3; i++) {
      ell(ctx, hand[0] + 6 + i * 3 + u * 5, hand[1] - 8 + i * 2 - u * 6, 1.6 + u * 2, 1.3 + u * 1.6);
      ctx.fillStyle = '#ece4f6';
      ctx.fill();
    }
    ctx.restore();
  }
  if (q.steam > 0.2) {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < 2; i++) {
      const u = (t * 0.6 + i * 0.5) % 1;
      const x = hand[0] + 1 + i * 2.4;
      const y = hand[1] - 5 - u * 8;
      ctx.globalAlpha = q.steam * Math.sin(Math.PI * u) * 0.7;
      ctx.beginPath();
      ctx.moveTo(x, y + 3);
      ctx.quadraticCurveTo(x + 1.4, y + 1.5, x, y);
      ctx.quadraticCurveTo(x - 1.4, y - 1.5, x, y - 3);
      ctx.stroke();
    }
    ctx.restore();
  }
  if (q.jingle >= 0) {
    const kp = D.at(a, 'torso', [(D.J.waist[0] + 22 - D.J.hip[0]) * D.SC, (D.J.waist[1] + 6 - D.J.hip[1]) * D.SC]);
    for (let i = 0; i < 3; i++) {
      const u = (q.jingle + i * 0.33) % 1;
      const r = 0.8 + Math.sin(Math.PI * u) * 1.4;
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * u);
      ctx.translate(kp[0] + 4 + i * 3, kp[1] - 4 - u * 6);
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.quadraticCurveTo(0, 0, r, 0);
      ctx.quadraticCurveTo(0, 0, 0, r);
      ctx.quadraticCurveTo(0, 0, -r, 0);
      ctx.quadraticCurveTo(0, 0, 0, -r);
      ctx.fillStyle = '#fff0b4';
      ctx.fill();
      ctx.restore();
    }
  }
}

const DRESS = {
  id: 'velvet',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: 2 },
  liveHead: true,
  noMoves: true,
  hide: ['footFskin', 'footNskin', 'legF', 'legN'],
  under: {
    // (the hair behind her head hangs behind her whole body, far arm and all: it is drawn first, so it
    // never lies over her shoulders; tests/boss-layers.test.js)
    armF: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'back'),
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      dress(ctx, a, mode, S, D);
      keys(ctx, a, mode, D);
    },
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F'),
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N'),
    handFskin: (ctx, a, mode, S, D) => glove(ctx, a, mode, 'F'),
    handNskin: (ctx, a, mode, S, D) => {
      glove(ctx, a, mode, 'N');
      handProps(ctx, a, mode, D);
    },
    neckSkin: (ctx, a, mode, S, D) => {
      neckShade(ctx, a, mode, D);
      collarHigh(ctx, a, mode, D);
    },
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'front'),
  },
  pose,
  fx: vvFx,
};
const BIG = 1.15;
const R = dressRig('grownup', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
export const VELVET_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [120, 420, 220, 260], draw: R.still, rig, noHop: true };
export const VELVET_SIZE = { w: Math.round(R.w * BIG), h: Math.round(R.h * BIG), speed: Math.round(R.speed * BIG) };
