// The Masquerade Diva on screen (2026-11-25, the Understudy Ghost remade on the spirit base, the
// player's pick "B"): the theatre's understudy in the leading lady's borrowed gown. She moves on her
// own copy of the spirit rig (divarig.js: its bones, hover, glide, moves and springs, her pieces from
// art.js); this adds her sparkle:
//   - the tiara's jewel twinkling now and then;
//   - a pink feather drifting down off her boa now and then;
//   - music notes floating up as she warms up her voice, a bigger one on the high note;
//   - a pink heart floating off her lips as she blows a kiss;
//   - Diva's Aria: a burst of music notes and sparkles bowling out ahead of her as she belts;
//   - Mask Swat: the mask's feathers puffing out, sparkles, as it lands.
import { divaRig } from './divarig.js';
import { divaDesign, SKIN_COLORS, MOUTH, CURL_F, CURL_N, TIARA, TIARA_GEM, MASK, PLUME } from './art.js';
import { clamp } from '../mobs/rig.js';

const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (u) => 1 - (1 - u) ** 2;
// A four-pointed twinkle.
function twinkle(ctx, x, y, r, al, col = '#ffffff') {
  if (al <= 0.01 || r <= 0.2) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
function glow(ctx, x, y, r, al, rgb = '255,200,225') {
  if (al <= 0.01) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${al})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}
// A music note (a quaver, or two beamed), tipped by `rot`, with a soft rim.
function note(ctx, x, y, s, al, col, rot = 0, two = false) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = al;
  const draw = (c, grow) => {
    ctx.fillStyle = c;
    ctx.strokeStyle = c;
    ctx.lineCap = 'round';
    ctx.lineWidth = s * 0.32 + grow * 2;
    const heads = two ? [[-s * 0.7, 0], [s * 0.7, -s * 0.3]] : [[0, 0]];
    for (const [hx, hy] of heads) {
      ctx.beginPath();
      ctx.ellipse(hx, hy, s * 0.62 + grow, s * 0.46 + grow, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(hx + s * 0.52, hy - s * 0.1);
      ctx.lineTo(hx + s * 0.52, hy - s * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    if (two) {
      ctx.moveTo(-s * 0.18, -s * 2);
      ctx.lineTo(s * 1.22, -s * 2.3);
    } else {
      ctx.moveTo(s * 0.52, -s * 2);
      ctx.quadraticCurveTo(s * 1.3, -s * 1.6, s * 1.1, -s * 0.9);
    }
    ctx.stroke();
  };
  draw('#ffffff', 0.5);
  draw(col, 0);
  ctx.restore();
  ctx.globalAlpha = 1;
}
// A little heart.
function heart(ctx, x, y, r, al, col = '#ff8ab0') {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  for (const [c, g] of [['#ffffff', 0.7], [col, 0]]) {
    const rr = r + g;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(x, y + rr * 0.9);
    ctx.bezierCurveTo(x - rr * 1.4, y - rr * 0.1, x - rr * 0.7, y - rr * 1.2, x, y - rr * 0.4);
    ctx.bezierCurveTo(x + rr * 0.7, y - rr * 1.2, x + rr * 1.4, y - rr * 0.1, x, y + rr * 0.9);
    ctx.fill();
  }
  ctx.fillStyle = '#ffe0ec';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.45, y - r * 0.35, r * 0.25, r * 0.18, -0.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A loose boa feather: a soft curved plume with a fine quill.
function feather(ctx, x, y, s, al, rot, col = '#ffc4da') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = al;
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.quadraticCurveTo(s * 0.7, -s * 0.2, 0.1 * s, s);
  ctx.quadraticCurveTo(-s * 0.6, -s * 0.1, 0, -s);
  ctx.fill();
  ctx.fillStyle = '#ffeef4';
  ctx.beginPath();
  ctx.ellipse(-s * 0.05, -s * 0.2, s * 0.18, s * 0.45, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.8);
  ctx.quadraticCurveTo(s * 0.15, 0, 0.1 * s, s * 1.2);
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;
}
const NOTE_COLS = ['#ff7aa8', '#b890ff', '#ffc85a', '#7ad8e8'];

function divaFx(ctx, m, a, S, matOf, K, H) {
  const mv = a.blMove?.mv;
  const t = a.blMove?.t ?? 0;
  const dead = m?.hp <= 0;
  ctx.save();
  if (!dead) {
    // the tiara's jewel twinkling
    const gem = K.through(matOf('tiara'), 'tiaraGem', 'tiaraJ');
    const gu = ((a.t + (m.uid % 7) * 0.6) % 3.4) / 0.5;
    if (gu < 1) twinkle(ctx, gem[0] + 0.3, gem[1] - 0.6, 3.2 * Math.sin(Math.PI * gu), 0.95);
    // a feather drifting off the boa
    const P = 4.4;
    const fu = ((a.t + (m.uid % 5) * 1.3) % P) / 2.6;
    const fn = Math.floor((a.t + (m.uid % 5) * 1.3) / P);
    if (fu < 1) {
      const b0 = K.through(matOf('chest'), 'stern', 'ribs');
      const x0 = b0[0] + (hash(fn) - 0.5) * H * 0.12;
      feather(ctx, x0 - fu * H * 0.08 + Math.sin(fu * 7 + fn) * 2, b0[1] + 2 + fu * H * 0.3, 1.9, Math.sin(Math.PI * fu) * 0.95, Math.sin(fu * 6 + fn) * 0.8, hash(fn + 3) > 0.5 ? '#ffc4da' : '#ffa8c8');
    }
    // notes floating up from her lips as she warms up
    const sing = a.divaSing ?? 0;
    if (sing > 0.05) {
      const mo = K.through(matOf('headJ'), 'mouthD', 'neck');
      for (let i = 0; i < 3; i++) {
        const PP = 1.3;
        const u = ((a.t + i * PP / 3) % PP) / PP;
        const n = Math.floor((a.t + i * PP / 3) / PP);
        note(ctx, mo[0] + 3 + u * H * 0.12 + Math.sin(u * 6 + n) * 1.6, mo[1] - 2 - u * H * 0.26, 1.5 + (a.divaHigh ?? 0) * 0.8, sing * Math.sin(Math.PI * u), NOTE_COLS[(n + i) % 4], Math.sin(u * 4 + n) * 0.3, hash(n * 3 + i) > 0.6);
      }
    }
    // stage fright: a bead of sweat sliding off her brow, and two little fluster lines
    const fret = a.divaFret ?? 0;
    if (fret > 0.05) {
      const hd = K.through(matOf('headJ'), 'mouthD', 'neck');
      const u = (a.t * 0.9) % 1;
      ctx.globalAlpha = fret * Math.min(1, (1 - u) * 3);
      ctx.fillStyle = '#bfe8ff';
      const sx = hd[0] - H * 0.1;
      const sy = hd[1] - H * 0.2 + u * H * 0.06;
      ctx.beginPath();
      ctx.moveTo(sx, sy - 2.6);
      ctx.quadraticCurveTo(sx + 1.8, sy + 0.2, sx, sy + 1.4);
      ctx.quadraticCurveTo(sx - 1.8, sy + 0.2, sx, sy - 2.6);
      ctx.fill();
      ctx.globalAlpha = fret * (0.6 + 0.4 * Math.sin(a.t * 20));
      ctx.strokeStyle = '#6a3a7a';
      ctx.lineWidth = 0.7;
      ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        ctx.beginPath();
        ctx.moveTo(hd[0] + H * 0.12 + i * 2.6, hd[1] - H * 0.2 - i * 1.4);
        ctx.lineTo(hd[0] + H * 0.15 + i * 2.6, hd[1] - H * 0.23 - i * 1.4);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // the curtsy: roses tossed on stage, landing round her
    const bw = a.divaBow ?? -1;
    if (bw >= 0 && bw < 1.15) {
      const ft = K.through(matOf('chest'), 'stern', 'ribs');
      for (let i = 0; i < 5; i++) {
        const v = clamp((bw - i * 0.08) * 1.6, 0, 1);
        if (v <= 0) continue;
        const x = ft[0] + (i - 2) * H * 0.14 + (hash(i + 2) - 0.5) * 4;
        const y = ft[1] - H * 0.5 + ease(Math.min(1, v * 1.4)) * H * 0.95;
        const al = Math.min(1, v * 6) * clamp((1.15 - bw) * 4, 0, 1);
        ctx.globalAlpha = al;
        ctx.strokeStyle = '#4a9a5a';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 2.4, y + 3.4);
        ctx.stroke();
        ctx.globalAlpha = 1;
        heart(ctx, x, y, 1.6, al, i % 2 ? '#ff5a8a' : '#ff8ab0');
        if (v > 0.6 && v < 1) twinkle(ctx, x + 2, y - 2, 1.4 * Math.sin(Math.PI * (v - 0.6) / 0.4), al, '#fff0b0');
      }
    }
    // the kiss: a heart floating off her lips, out toward you
    const kiss = a.divaKiss ?? -1;
    if (kiss >= 0) {
      const mo = K.through(matOf('headJ'), 'mouthD', 'neck');
      const u = clamp(kiss, 0, 1);
      heart(ctx, mo[0] + 3 + ease(u) * H * 0.34, mo[1] - u * H * 0.12 + Math.sin(u * 8) * 1.2, 1.4 + ease(Math.min(1, u * 3)) * 1.6, Math.min(1, (1 - u) * 2.4));
    }
  }
  // Diva's Aria: a burst of notes and sparkles bowling out ahead of her
  if (mv?.aria) {
    const [t0, t1] = mv.aria;
    const u = (t - t0) / (t1 - t0);
    if (u >= 0 && u < 1.15) {
      const mo = K.through(matOf('headJ'), 'mouthD', 'neck');
      const k = clamp(1 - (u - 0.85) / 0.3, 0, 1);
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, mo[0] + 4 + u * H * 0.2, mo[1], H * (0.1 + u * 0.18), 0.5 * k * (1 - u * 0.4));
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 9; i++) {
        const v = clamp(u * 1.3 - (i % 3) * 0.14, 0, 1);
        if (v <= 0) continue;
        const ang = -0.6 + (i / 8) * 1.1 + (hash(i + 4) - 0.5) * 0.2;
        const d = 4 + ease(v) * H * (0.45 + hash(i) * 0.25);
        note(ctx, mo[0] + Math.cos(ang) * d, mo[1] + Math.sin(ang) * d * 0.8 + Math.sin(v * 9 + i) * 1.4, 1.8 + hash(i + 1) * 0.8, k * Math.min(1, v * 5) * (1 - v * 0.3), NOTE_COLS[i % 4], Math.sin(v * 6 + i) * 0.4, i % 3 === 1);
        twinkle(ctx, mo[0] + Math.cos(ang + 0.15) * d * 0.8, mo[1] + Math.sin(ang + 0.15) * d * 0.7, 1.6 * (1 - v), k * (1 - v));
      }
    }
  }
  // Mask Swat: the feathers puffing out, sparkles
  if (mv?.swat) {
    const u = (t - mv.swat[0]) / 0.45;
    if (u >= 0 && u < 1) {
      const c = K.through(matOf('mask'), 'maskC', 'wrN');
      ctx.globalCompositeOperation = 'lighter';
      glow(ctx, c[0], c[1], 5 + u * 9, 0.6 * (1 - u), '255,220,150');
      ctx.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 6; i++) {
        const ang = -Math.PI * 0.9 + (i / 5) * Math.PI * 1.3 + (hash(i + 7) - 0.5) * 0.4;
        const d = 2 + ease(u) * (8 + hash(i) * 7);
        feather(ctx, c[0] + Math.cos(ang) * d, c[1] + Math.sin(ang) * d + u * u * 6, 2.2, 1 - u, ang + Math.PI / 2 + u * 2, ['#ff8ab0', '#b890ff', '#7ae0e8'][i % 3]);
        twinkle(ctx, c[0] + Math.cos(ang + 0.3) * d * 1.2, c[1] + Math.sin(ang + 0.3) * d * 1.2, 2 * (1 - u), 1 - u, '#fff0b0');
      }
    }
  }
  ctx.restore();
}

const R = divaRig({ design: divaDesign, skin: SKIN_COLORS, mouth: MOUTH, curlF: CURL_F, curlN: CURL_N, tiara: TIARA, tiaraGem: TIARA_GEM, mask: MASK, plume: PLUME, fx: divaFx });
export const DIVA_ART = { pad: 14, walk: 8, idle: 8, attack: 5, stride: R.stride, atkMs: [110, 180, 320, 240], draw: R.still, rig: R.rig, noHop: true };
export const DIVA_SIZE = { w: 30, h: Math.round(R.H * 0.92) };
