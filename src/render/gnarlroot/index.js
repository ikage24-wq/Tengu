// Gnarlroot on screen (2026-11-25, remade on the brute base, the player's pick "A, Old Mossbeard": "heavy
// polish redraw ... it should look so awesome since it's a boss"). He moves on his own copy of the brute
// rig (bruterig.js: its bones, gait, sway, moves and springs; his pieces from art.js), drawn big for a
// boss; this adds what glows, falls and flies:
//   - the warm glow of his knothole eyes (amber, flaring orange when he's cross, dark when shut);
//   - leaves drifting down off his canopy now and then, a shower when he shakes, stretches or slams;
//   - his act's bits: snores (a bubble of breath and a drifting z), the acorn that drops on his nose
//     (falling, the bonk, bouncing off), notes rising as he hums, sparkles as he laughs, a little
//     shimmer at his cupped ear as he listens;
//   - his blows: the Root Slam's THOOM (dust rolling out both ways, a ripple of roots heaving up out
//     of the floor, leaves), the sweep's torn leaves; his heavy words landing the same way;
//   - Elder Yomogi tangled in two of his roots at his feet, until she's freed.
import { gnarlRig } from './bruterig.js';
import { gnarlDesign, CANOPY_ROOT, BEARD_ROOT, MOUTH, EYES, KNOT, H as HEAD_AT } from './art.js';
import { clamp } from '../mobs/rig.js';
import { drawMochiAnim } from '../mochi-anim.js';
import { rollMochi } from '../../data/mochi-genes.js';
import { YOMOGI } from '../mobs/gnarlrig.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (u) => 1 - (1 - u) ** 2;
function glow(ctx, x, y, r, al, rgb = '255,200,110') {
  if (al <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${al})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}
function twinkle(ctx, x, y, r, al, c = '#ffffff') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A leaf: a pointed oval with a midrib, turned by `a`, in one of his greens.
const GREENS = [['#86c864', '#529a48'], ['#c4e894', '#86c864'], ['#62a056', '#3c7a3c'], ['#e8c860', '#c89a40']];
function leafFx(ctx, x, y, s, a, k, al) {
  if (al <= 0.01) return;
  const [c, rib] = GREENS[k % GREENS.length];
  ctx.save();
  ctx.globalAlpha = al;
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.fillStyle = c;
  ctx.strokeStyle = rib;
  ctx.lineWidth = s * 0.18;
  ctx.beginPath();
  ctx.moveTo(-s, 0);
  ctx.quadraticCurveTo(0, -s * 0.62, s, 0);
  ctx.quadraticCurveTo(0, s * 0.62, -s, 0);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.8, 0);
  ctx.lineTo(s * 0.8, 0);
  ctx.stroke();
  ctx.restore();
}
function acornFx(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#c8925a';
  ctx.strokeStyle = '#7a5638';
  ctx.lineWidth = s * 0.25;
  ctx.beginPath();
  ctx.ellipse(0, s * 0.5, s * 0.9, s * 1.1, 0, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#7a5638';
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.3, s * 1.1, s * 0.6, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#e6b47c';
  ctx.beginPath();
  ctx.ellipse(-s * 0.35, s * 0.4, s * 0.25, s * 0.5, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}
function dust(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#d8c4a4';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.arc(x + r * 0.7, y + r * 0.2, r * 0.7, 0, TAU);
  ctx.arc(x - r * 0.7, y + r * 0.25, r * 0.6, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#efe2cc';
  ctx.beginPath();
  ctx.arc(x - r * 0.25, y - r * 0.3, r * 0.45, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A ripple of roots heaving up out of the floor: humps of bark rising and sinking along the ground.
function rootRipple(ctx, x0, x1, u, s) {
  const n = 7;
  for (let i = 0; i < n; i++) {
    const v = clamp(u * 1.6 - (Math.abs(i - (n - 1) / 2) / n) * 0.8, 0, 1);
    if (v <= 0 || v >= 1) continue;
    const h = Math.sin(Math.PI * v) * s * (0.8 + hash(i) * 0.5);
    const x = x0 + ((x1 - x0) * (i + 0.5)) / n;
    const w = s * 1.4;
    ctx.fillStyle = '#7a5238';
    ctx.strokeStyle = '#563826';
    ctx.lineWidth = s * 0.14;
    ctx.beginPath();
    ctx.moveTo(x - w, 0);
    ctx.quadraticCurveTo(x, -h * 2, x + w, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#c49a70';
    ctx.lineWidth = s * 0.1;
    ctx.beginPath();
    ctx.moveTo(x - w * 0.5, -h * 0.5);
    ctx.quadraticCurveTo(x - w * 0.1, -h * 1.2, x + w * 0.3, -h * 0.9);
    ctx.stroke();
  }
}

let BIG = 1;
// Text drawn the right way round even when he faces left (the rig's space is mirrored then).
function glyph(ctx, a, text, x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
const yomogiOf = (a) => {
  const st = a.mo;
  if (!st.gnYomo) {
    const genes = rollMochi(YOMOGI.seed, { ...YOMOGI.force });
    genes.wear = { ...YOMOGI.wear };
    st.gnYomo = { genes, dir: -1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, noIdle: true };
  }
  return st.gnYomo;
};

function gnarlUnder(ctx, m, a, S, matOf, K, H) {
  // his shadow, wide and soft
  ctx.globalAlpha = (a.alpha ?? 1) * 0.22;
  ctx.fillStyle = '#2a3a2a';
  ctx.beginPath();
  ctx.ellipse(0, -0.5, H * 0.34, H * 0.035, 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function gnarlFx(ctx, m, a, S, matOf, K, H) {
  const mv = a.blMove?.mv;
  const mt = a.blMove?.t ?? 0;
  const headM = matOf('headJ');
  const t = a.t ?? 0;
  ctx.save();
  // his eyes' glow (none when they're shut)
  const face = a.gnFace ?? (m.hp <= 0 ? 'dead' : 'idle');
  const shut = ['sleep', 'blink', 'yawn', 'hum', 'hurt', 'dead'].includes(face);
  if (!shut && m.hp > 0) {
    const cross = face === 'angry' || face === 'roar';
    const pulse = 0.5 + 0.1 * Math.sin(a.now * 2.4);
    ctx.globalCompositeOperation = 'lighter';
    for (const k of ['eyeF', 'eyeN']) {
      const [x, y] = K.through(headM, k, 'neck');
      glow(ctx, x, y, H * (cross ? 0.07 : 0.055), (cross ? 0.75 : 0.45) * pulse, cross ? '255,130,50' : '255,200,110');
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  // leaves drifting down off his canopy: a few always, a shower when he shakes
  const [cx, cy] = K.through(headM, 'canopyJ', 'neck');
  const shake = a.gnShake ?? 0;
  const n = 5 + Math.round(shake * 18);
  for (let i = 0; i < n; i++) {
    const period = 3.6 + hash(i) * 2.4;
    const u = (((t + hash(i + 7) * period) % period) + period) % period / period;
    const extra = i >= 5;
    if (extra && u > 0.75) continue;
    const sx = cx + (hash(i + 3) - 0.5) * H * 0.55;
    const sy = cy + (hash(i + 9) - 0.3) * H * 0.12;
    const fall = u * (0 - sy);
    const x = sx + Math.sin(u * 9 + i) * H * 0.04 + (extra ? (hash(i + 11) - 0.5) * H * 0.3 * u : u * H * 0.06);
    const y = sy + fall;
    leafFx(ctx, x, y, H * 0.018, u * 7 + i, i, (extra ? shake : 0.85) * Math.min(1, (1 - u) * 4) * Math.min(1, u * 8));
  }
  const [mx, my] = K.through(headM, 'mouthB', 'neck');
  // snoring: a bubble of breath swelling and popping at his mouth, a z drifting up
  const sn = a.gnSnore ?? 0;
  if (sn > 0.1 && m.hp > 0) {
    const u = (t * 0.5) % 1;
    const r = H * 0.006 + u * H * 0.028;
    ctx.globalAlpha = sn * (u < 0.92 ? 0.75 : 0);
    ctx.fillStyle = '#e8f6ff';
    ctx.strokeStyle = '#a8c8e0';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(mx + r * 0.6, my + r * 0.2, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(mx + r * 0.3, my - r * 0.2, r * 0.3, 0, TAU);
    ctx.fill();
    for (let k = 0; k < 2; k++) {
      const q = (t * 0.35 + k * 0.5) % 1;
      ctx.globalAlpha = sn * Math.sin(Math.PI * q) * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6a8aa8';
      ctx.lineWidth = 1.6;
      ctx.font = `bold ${Math.round(H * (0.05 + q * 0.03))}px sans-serif`;
      glyph(ctx, a, 'z', mx + H * 0.12 + q * H * 0.1, my - H * 0.15 - q * H * 0.22);
    }
    ctx.globalAlpha = 1;
  }
  // the acorn: dropping out of the canopy onto his nose, bonk, and bouncing off to the floor
  const ac = a.gnAcorn ?? -1;
  if (ac >= 0) {
    const [nx, ny] = K.through(headM, 'noseJ', 'neck');
    const s = H * 0.018;
    if (ac < 0.67) {
      const v = ac / 0.67;
      acornFx(ctx, nx + H * 0.02, cy - H * 0.1 + (ny - cy + H * 0.1) * v * v, s, v * 2);
    } else {
      const v = (ac - 0.67) / 0.33;
      acornFx(ctx, nx + H * 0.02 + v * H * 0.16, ny - Math.sin(Math.PI * v) * H * 0.08 + v * v * (0 - ny) * 0.9, s, 2 + v * 8);
      if (v < 0.5) twinkle(ctx, nx + H * 0.01, ny - H * 0.02, H * 0.03 * (1 - v * 2), 1 - v * 2, '#fff6c8');
    }
  }
  // humming: notes rising off to the side of his head
  const hm = a.gnHum ?? 0;
  if (hm > 0.1) {
    for (let k = 0; k < 3; k++) {
      const q = (t * 0.4 + k / 3) % 1;
      ctx.globalAlpha = hm * Math.sin(Math.PI * q);
      ctx.fillStyle = k % 2 ? '#f0b8d0' : '#a8d8a0';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.4;
      ctx.font = `bold ${Math.round(H * 0.07)}px sans-serif`;
      const x = mx + H * 0.14 + Math.sin(q * 5 + k) * H * 0.03 + q * H * 0.05;
      const y = my - H * 0.08 - q * H * 0.28;
      glyph(ctx, a, k % 2 ? '♫' : '♪', x, y);
    }
    ctx.globalAlpha = 1;
  }
  // laughing: sparkles and little leaves popping round his head
  const lg = a.gnLaugh ?? 0;
  if (lg > 0.1) {
    for (let k = 0; k < 5; k++) {
      const q = (t * 0.8 + k / 5) % 1;
      const an = -Math.PI / 2 + (k - 2) * 0.55;
      const d = H * (0.16 + q * 0.12);
      twinkle(ctx, mx + Math.cos(an) * d, my - H * 0.12 + Math.sin(an) * d, H * 0.022 * Math.sin(Math.PI * q), lg, '#fff6c8');
    }
  }
  // listening: a soft shimmer by his cupped ear
  const ls = a.gnListen ?? 0;
  if (ls > 0.3) {
    const [hx, hy] = K.through(matOf('handF'), 'handF', 'wrF');
    for (let k = 0; k < 3; k++) {
      const q = (t * 0.7 + k / 3) % 1;
      ctx.globalAlpha = ls * (1 - q) * 0.8;
      ctx.strokeStyle = '#fff2c8';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(hx, hy, H * (0.03 + q * 0.07), -Math.PI * 0.9, -Math.PI * 0.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  // the THOOM: his slam (his own move, or a heavy word landing): dust rolling out both ways along
  // the floor, a ripple of roots heaving up, leaves flung
  let thoom = -1;
  if (mv?.slam) {
    const u = (mt - mv.slam[0]) / 0.9;
    if (u >= 0 && u < 1) thoom = u;
  }
  const say = a.gnSay;
  if (say && (say.kind === 'slam' || say.kind === 'thorns') && say.after > 0 && say.after < 0.9) thoom = say.after / 0.9;
  if (thoom >= 0) {
    const u = thoom;
    for (let k = 0; k < 8; k++) {
      const side = k % 2 ? 1 : -1;
      const d = H * (0.12 + ease(u) * (0.35 + (k >> 1) * 0.08));
      dust(ctx, side * d, -H * 0.02 - (k >> 1) * H * 0.012, H * (0.03 + u * 0.03), (1 - u) * 0.85);
    }
    rootRipple(ctx, H * 0.15, H * 0.75, u, H * 0.05);
    rootRipple(ctx, -H * 0.75, -H * 0.15, u, H * 0.05);
    for (let k = 0; k < 10; k++) {
      const an = -Math.PI / 2 + (hash(k + 30) - 0.5) * 2.2;
      const d = ease(u) * H * (0.2 + hash(k) * 0.25);
      leafFx(ctx, Math.cos(an) * d, -H * 0.1 + Math.sin(an) * d + u * u * H * 0.2, H * 0.018, u * 8 + k, k, 1 - u);
    }
  }
  // the sweep: leaves torn off his arm along its arc
  if (mv?.sweep) {
    const [t0, t1] = mv.sweep;
    if (mt >= t0 && mt < t1 + 0.5) {
      const [hx, hy] = K.through(matOf('handN'), 'handN', 'wrN');
      for (let k = 0; k < 6; k++) {
        const v = clamp((mt - t0 - k * 0.04) / 0.6, 0, 1);
        if (v <= 0 || v >= 1) continue;
        leafFx(ctx, hx + v * H * 0.2 + k * 2, hy - H * 0.02 + v * v * H * 0.12 - k * 1.5, H * 0.018, v * 6 + k, k, 1 - v);
      }
    }
  }
  // his Big Hug: leaves whirling in round him as his arms sweep together
  if (say && say.kind === 'hug' && say.after > 0 && say.after < 0.9) {
    const u = say.after / 0.9;
    for (let k = 0; k < 12; k++) {
      const an = (k / 12) * TAU + u * 3;
      const d = H * (0.5 - ease(u) * 0.35);
      leafFx(ctx, Math.cos(an) * d, -H * 0.35 + Math.sin(an) * d * 0.4, H * 0.02, an + u * 5, k, 1 - u);
    }
  }
  ctx.restore();
  // Elder Yomogi in two of his roots, at his feet (until freed): drawn at her own size
  if (!m.yomogiFree && m.hp > 0) {
    const y = yomogiOf(a);
    const yx = H * 0.46;
    ctx.save();
    ctx.translate(yx, 0);
    ctx.scale(1 / BIG, 1 / BIG);
    ctx.globalAlpha = a.alpha ?? 1;
    drawMochiAnim(ctx, y, 0, -2, a.t);
    ctx.lineCap = 'round';
    const wob = Math.sin(a.t * 1.1) * 1.2;
    for (const [c, w] of [['#5a3a2a', 4.4], ['#9c6e4c', 2.8], ['#d4ac84', 0.8]]) {
      ctx.strokeStyle = c;
      ctx.lineWidth = w;
      ctx.beginPath();
      ctx.moveTo(-26, -2);
      ctx.bezierCurveTo(-14, -4, -14, -13 + wob, 0, -12 + wob);
      ctx.bezierCurveTo(12, -11 + wob, 13, -6, 6, -5);
      ctx.moveTo(-22, -1);
      ctx.bezierCurveTo(-10, 0, -10, -8 - wob, 2, -7 - wob);
      ctx.bezierCurveTo(10, -6, 10, -1, 14, -1);
      ctx.stroke();
    }
    // (a leaf sprouting off each root)
    leafFx(ctx, 8, -14 + wob, 3.4, -0.6, 0, 1);
    leafFx(ctx, -12, -9 - wob, 3, 0.5, 1, 1);
    ctx.restore();
  }
}

const R = gnarlRig({
  design: gnarlDesign,
  J: {
    canopyJ: CANOPY_ROOT, beardJ: BEARD_ROOT, mouthB: MOUTH, eyeF: EYES[0], eyeN: EYES[1], knotJ: KNOT, noseJ: HEAD_AT([154, 82]),
  },
  fx: gnarlFx,
  under: gnarlUnder,
});
// (drawn big, for a boss: the oldest tree, towering over everyone in the Hollow)
BIG = 168 / R.H;
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  // (drawn BIG: its steps measured in its own units, so its planted feet keep still on the ground)
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG);
rig.h = Math.round(rig.h * BIG);
export const GNARL_ART = { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [120, 200, 420, 280], draw: R.still, rig, noHop: true };
export const GNARL_SIZE = { w: Math.round(70 * BIG), h: Math.round(R.H * 0.9 * BIG) };
