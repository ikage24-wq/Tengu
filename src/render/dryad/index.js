// The Rootling Dryad on screen (2026-11-24): Gnarlroot's Root Tendrils, remade as a dryad on the serpent
// base. She moves on her own copy of the serpent rig (serpentrig.js: its bones, sway, slither, moves
// and springs, unchanged) and is drawn by this painter on those bones each frame:
//   - each part of her (the hair behind her head, each arm's upper and lower piece, her leaf skirt,
//     her bodice, her neck, her head and face in each expression) is painted once from her design
//     (art.js) into a picture, its outline and its fill apart, at PX pixels to her unit;
//   - every frame each picture is placed on its bone, every outline first and then every fill, so only
//     her outer edge is outlined;
//   - her root is built live along the tail's four pieces as one piece (one outline, one light, one
//     grain), so it bends with the rig without any seam.
// Her drawing code loads the first time she's drawn (the game's tests never draw her).
import { serpentRig } from './serpentrig.js';
import { clamp } from '../mobs/rig.js';

const PX = 2;
let ART = null;
let loading = null;
const load = () => {
  loading ??= import('./art.js').then((m) => {
    ART = m;
  });
  return loading;
};
const pics = new Map();
const canvasOf = (w, h) => {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
// One part's picture: its outline ('lines'), its fill ('fills'), or its fill washed white (for a hit's
// flash).
function picOf(part, face, pass) {
  const key = `${part}|${face}|${pass}`;
  let c = pics.get(key);
  if (c) return c;
  const [bx, by, bw, bh] = ART.PART_BOX;
  c = canvasOf(Math.ceil(bw * PX), Math.ceil(bh * PX));
  const g = c.getContext('2d');
  if (pass === 'flash') {
    g.drawImage(picOf(part, face, 'fills'), 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#ffffff';
    g.fillRect(0, 0, c.width, c.height);
  } else {
    g.setTransform(PX, 0, 0, PX, -bx * PX, -by * PX);
    ART.paintPart(g, part, face, pass, PX);
  }
  pics.set(key, c);
  return c;
}
// Her face this moment: eyes closed as she wilts, teary when hurt, her idle act's and her attacks'
// faces (the rig's a.dryFace), else dreamy with a blink now and then.
function faceOf(a) {
  if (a.face === 'dead') return 'blink';
  if (a.face === 'hurt' || (a.hurtAgo ?? 9) < 0.5) return 'teary';
  if (a.dryFace) return a.dryFace;
  const q = (a.t + ((a.m?.uid ?? 0) % 7) * 0.61) % 4.4;
  return q < 0.14 ? 'blink' : 'dreamy';
}
// (a point of the base's, carried by a bone: the bone's matrix, its joint)
const onBone = (M, pv, [x, y]) => {
  const lx = (x - pv[0]) / 3;
  const ly = (y - pv[1]) / 3;
  return [M[0] * lx + M[2] * ly + M[4], M[1] * lx + M[3] * ly + M[5]];
};
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
// A blossom petal: a soft teardrop, pink, deeper at its base.
function petal(ctx, x, y, r, ang, al) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha *= al;
  ctx.fillStyle = '#ffc2d6';
  ctx.strokeStyle = '#e07a9c';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(-r * 0.2, -r * 0.75, r, 0);
  ctx.quadraticCurveTo(-r * 0.2, r * 0.75, -r, 0);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
function leafBit(ctx, x, y, r, ang, al) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.globalAlpha *= al;
  ctx.fillStyle = '#86c862';
  ctx.strokeStyle = '#4f8a3a';
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(-r, 0);
  ctx.quadraticCurveTo(0, -r * 0.6, r, 0);
  ctx.quadraticCurveTo(0, r * 0.6, -r, 0);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
// Her effects, in the rig's space (facing right): the petal stream, the roots bursting up, leaves
// shaken off her root, and while she holds Gnarlroot up, motes of life rising off her.
function dryadFx(ctx, a, m) {
  const matOf = a.blMat;
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const H = 58;
  ctx.save();
  if (mv?.petals && t >= mv.petals[0] && t < mv.petals[1] + 0.7) {
    const mouth = onBone(matOf('head'), [151, 85], [152, 79]);
    for (let i = 0; i < 16; i++) {
      const born = mv.petals[0] + (i / 16) * (mv.petals[1] - mv.petals[0]);
      const u = (t - born) / 0.7;
      if (u < 0 || u > 1) continue;
      const sp = (hash(i) - 0.5) * 0.9;
      const d = 4 + u * (26 + hash(i + 9) * 14);
      const x = mouth[0] + Math.cos(sp) * d + Math.sin(u * 9 + i) * 1.2;
      const y = mouth[1] + Math.sin(sp) * d * 0.6 + u * u * 4 + Math.cos(u * 7 + i) * 1.4;
      petal(ctx, x, y, 1.6 + hash(i + 3) * 0.8, u * 8 + i, 1 - u * u);
    }
  }
  if (mv?.snare && t >= mv.snare[0] && t < mv.snare[1]) {
    const u = (t - mv.snare[0]) / (mv.snare[1] - mv.snare[0]);
    const up = u < 0.3 ? 1 - (1 - u / 0.3) ** 3 : u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
    for (const [dx, h, lean] of [[17, 13, -0.2], [25, 17, 0.1], [33, 11, 0.3]]) {
      const hh = h * up;
      if (hh < 0.5) continue;
      // (a root: thick where it breaks out of the floor, tapering to a soft tip, bark-lit on one side)
      const P0 = [dx, 0.8];
      const P1 = [dx + lean * hh, -hh * 0.6];
      const P2 = [dx + lean * hh * 1.6 + Math.sin(u * 10 + dx) * 0.6, -hh];
      const at = (v) => [(1 - v) ** 2 * P0[0] + 2 * (1 - v) * v * P1[0] + v * v * P2[0], (1 - v) ** 2 * P0[1] + 2 * (1 - v) * v * P1[1] + v * v * P2[1]];
      const L = [];
      const Rr = [];
      for (let k = 0; k <= 10; k++) {
        const v = k / 10;
        const p = at(v);
        const q = at(Math.min(1, v + 0.05));
        const o = at(Math.max(0, v - 0.05));
        const len = Math.hypot(q[0] - o[0], q[1] - o[1]) || 1;
        const n = [-(q[1] - o[1]) / len, (q[0] - o[0]) / len];
        const w = 1.7 * (1 - v) + 0.35;
        L.push([p[0] + n[0] * w, p[1] + n[1] * w]);
        Rr.push([p[0] - n[0] * w, p[1] - n[1] * w]);
      }
      const shape = new Path2D();
      [...L, ...Rr.reverse()].forEach(([x, y], k) => (k ? shape.lineTo(x, y) : shape.moveTo(x, y)));
      shape.closePath();
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#3a2d4f';
      ctx.lineWidth = 0.8;
      ctx.stroke(shape);
      const gr = ctx.createLinearGradient(dx - 2, 0, dx + 2, 0);
      gr.addColorStop(0, '#835c44');
      gr.addColorStop(0.6, '#a6795a');
      gr.addColorStop(1, '#c49572');
      ctx.fillStyle = gr;
      ctx.fill(shape);
      leafBit(ctx, dx + lean * hh * 1.6 + 1.4, -hh - 0.6, 1.8, -0.6, up);
    }
  }
  if (mv?.vine && t >= mv.vine[0] && t < mv.vine[1] + 0.7) {
    // The vine: out of her pointing hand toward you, fast, rippling, a curl at its tip; it reaches,
    // cracks, and draws back; leaves shed off its tip as it cracks.
    const hand = onBone(matOf('armNf'), [165.832, 110.6], [166.6, 131]);
    const [v0, v1] = mv.vine;
    const u = clamp((t - v0) / (v1 - v0), 0, 1);
    const out = u < 0.35 ? 1 - (1 - u / 0.35) ** 3 : u < 0.6 ? 1 : 1 - (u - 0.6) / 0.4;
    const len = 34 * out;
    if (len > 1) {
      const pts = [];
      for (let k = 0; k <= 16; k++) {
        const v = k / 16;
        const x = hand[0] + v * len;
        const y = hand[1] + v * 3 + Math.sin(v * 9 - t * 40) * 1.6 * v * (1 - u * 0.5) - Math.sin(Math.PI * v) * 3;
        pts.push([x, y]);
      }
      // (a curl at the tip)
      const e = pts[pts.length - 1];
      for (let k = 1; k <= 5; k++) pts.push([e[0] + Math.sin(k * 0.7) * 2.4, e[1] - (1 - Math.cos(k * 0.7)) * 2.4]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      for (const [w, c] of [[2.2, '#2e4a26'], [1.4, '#6ab04c'], [0.5, '#a8dc7c']]) {
        ctx.strokeStyle = c;
        ctx.lineWidth = w;
        ctx.beginPath();
        pts.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
      }
      for (let k = 3; k < 16; k += 4) leafBit(ctx, pts[k][0], pts[k][1] - 1, 1.6, -0.7 + (k % 8 ? 0.9 : 0), 1);
    }
    const k2 = t - 0.12;
    if (k2 >= 0 && k2 < 0.8) {
      const tip = [hand[0] + 34, hand[1] + 1];
      for (let i = 0; i < 6; i++) {
        const w = k2 / 0.8;
        const ang = -Math.PI / 2 + (hash(i) - 0.5) * 2.4;
        const d = 2 + w * (7 + hash(i + 4) * 7);
        leafBit(ctx, tip[0] + Math.cos(ang) * d + Math.sin(w * 8 + i), tip[1] + Math.sin(ang) * d + w * w * 6, 1.5, w * 6 + i, 1 - w);
      }
    }
  }
  // (holding Gnarlroot up: soft motes of green life drift up off her root and her hands)
  if (m?.add && m.hp > 0 && !mv) {
    const from = [onBone(matOf('torso'), [150, 126], [150, 140]), onBone(matOf('armNf'), [165.832, 110.6], [166, 130]), onBone(matOf('armFf'), [134.168, 110.6], [134, 130])];
    for (let i = 0; i < 7; i++) {
      const P = 2.2 + hash(i) * 1.2;
      const k = ((a.t + i * 0.77) / P) % 1;
      const s = from[i % 3];
      const x = s[0] + (hash(i + Math.floor((a.t + i * 0.77) / P)) - 0.5) * 8 + Math.sin(k * 6 + i) * 2;
      const y = s[1] - k * 22;
      const al = Math.sin(Math.PI * k) * 0.85;
      const g = ctx.createRadialGradient(x, y, 0, x, y, 3);
      g.addColorStop(0, `rgba(214,255,170,${al})`);
      g.addColorStop(1, 'rgba(140,220,110,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 3, y - 3, 6, 6);
      ctx.fillStyle = `rgba(255,255,230,${al})`;
      ctx.beginPath();
      ctx.arc(x, y, 0.55, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}
// (a joint of the base's, in the rig's space at rest: the base's units to game pixels, feet at 0, 0)
const atRest = ([x, y]) => [(x - 150) / 3, (y - 214) / 3];
// Each tail piece's turn as a matrix in the base's own units: from the base to the rig at rest (G),
// then the piece's bone (M), back to the base's units.
const G = () => new DOMMatrix().translate(-50, -214 / 3).scale(1 / 3);
function tailTurns(matOf) {
  const g = G();
  const gi = g.inverse();
  const out = {};
  for (const [n, pv] of [['lower', [128, 201]], ['tailA', [128, 201]], ['tailB', [88, 204]], ['tailC', [50, 208]]]) {
    const M = matOf(n);
    const m = new DOMMatrix([M[0], M[1], M[2], M[3], M[4], M[5]]);
    out[n] = gi.multiply(m).multiply(new DOMMatrix().scale(1 / 3).translate(-pv[0], -pv[1]));
  }
  return { T: out, g };
}
function paintDryad(ctx, a) {
  if (!ART) {
    load();
    return;
  }
  const matOf = a.blMat;
  if (!matOf) return;
  const face = faceOf(a);
  const { T, g } = tailTurns(matOf);
  const root = ART.rootItems(T, a.dryBloom ?? 0);
  const alpha = clamp(a.alpha ?? 1, 0, 1);
  const flash = clamp((a.flash ?? 0) * 6, 0, 0.85);
  const [bx, by, bw, bh] = ART.PART_BOX;
  ctx.save();
  ctx.globalAlpha = alpha;
  for (const pass of ['lines', 'fills']) {
    for (const [part, bone, pv] of ART.PARTS) {
      if (part === 'root') {
        ctx.save();
        ctx.transform(g.a, g.b, g.c, g.d, g.e, g.f);
        ART.paintItems(ctx, root, pass, 1);
        ctx.restore();
        continue;
      }
      const M = matOf(bone);
      const f = part === 'head' ? face : 'dreamy';
      ctx.save();
      ctx.transform(M[0], M[1], M[2], M[3], M[4], M[5]);
      ctx.scale(1 / 3, 1 / 3);
      ctx.translate(-pv[0], -pv[1]);
      ctx.drawImage(picOf(part, f, pass), bx, by, bw, bh);
      if (pass === 'fills' && flash > 0.01) {
        ctx.globalAlpha = alpha * flash;
        ctx.drawImage(picOf(part, f, 'flash'), bx, by, bw, bh);
      }
      ctx.restore();
    }
  }
  ctx.restore();
  dryadFx(ctx, a, a.m);
}

const R = serpentRig((ctx, a) => paintDryad(ctx, a));
// (the rig reads the monster through `a.m`)
const drawRig = R.rig.draw;
R.rig.draw = (ctx, m, a) => drawRig(ctx, m, Object.assign(a, { m }));
// (`noHop`: none of the monster drawer's little happy hops: she's rooted to the floor, and her own
// rig carries all her motion)
export const DRYAD_ART = { pad: 10, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 340, 240], draw: R.still, rig: R.rig, noHop: true };
export const DRYAD_SIZE = { w: 30, h: Math.round(R.H * 0.95) };
