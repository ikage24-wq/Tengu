// The Tanuki Picker on screen (2026-11-25, remade on the creature base, the player's pick "B, Tea Break").
// He moves on his own copy of the creature rig (creaturerig.js: its bones, gait, sway, moves, springs
// and live skin in his fur; his pieces from art.js); this adds what steams, floats and splashes:
//   - steam always curling up off his teacup (swirling away when he blows on it);
//   - his act's bits: little hearts as he sips, notes as he whistles innocently, a drifting z as he
//     nods off, a drop of tea spilled as he jolts awake, a tea bag on its string bobbing into the cup;
//   - his tea splash: hot tea flung out of the cup in an arc of drops, a puff of steam where it lands.
import { tanukiRig } from './creaturerig.js';
import { tanukiDesign, SKIN, KNOT, TOWEL_END, CUP, STEAM, MOUTH } from './art.js';
import { clamp } from '../mobs/rig.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const ease = (u) => 1 - (1 - u) ** 2;
// Text drawn the right way round even when he faces left (the rig's space is mirrored then).
function glyph(ctx, a, text, x, y) {
  ctx.save();
  ctx.translate(x, y);
  if (a.flip) ctx.scale(-1, 1);
  ctx.strokeText(text, 0, 0);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}
function heart(ctx, x, y, r, al, c = '#ff8aa8') {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y + r);
  ctx.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.8, y - r * 1.4, x, y - r * 0.5);
  ctx.bezierCurveTo(x + r * 0.8, y - r * 1.4, x + r * 1.6, y - r * 0.2, x, y + r);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A wisp of steam: a soft curl, fading as it rises.
function wisp(ctx, x, y, h, u, al, drift = 0) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al * Math.sin(Math.PI * u);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.4 * (1 - u * 0.5);
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const v = i / 8;
    const px = x + Math.sin(v * 5 + u * 6) * 1.6 + drift * v;
    const py = y - (u * 0.6 + v * 0.4) * h;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.globalAlpha = 1;
}
function drop(ctx, x, y, r, al) {
  if (al <= 0.01) return;
  ctx.globalAlpha = al;
  ctx.fillStyle = '#b8823a';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.6);
  ctx.quadraticCurveTo(x + r, y - r * 0.2, x, y + r);
  ctx.quadraticCurveTo(x - r, y - r * 0.2, x, y - r * 1.6);
  ctx.fill();
  ctx.fillStyle = '#f4d8a0';
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.2, r * 0.3, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function tanukiFx(ctx, m, a, S, matOf, K, H) {
  if (m.hp <= 0) return;
  const mv = a.blMove?.mv;
  const mt = a.blMove?.t ?? 0;
  const t = a.t ?? 0;
  ctx.save();
  const [sx, sy] = K.through(matOf('cup'), 'steamJ', 'cupJ');
  // steam off the cup: three curling wisps; swept sideways when he blows on it
  const blow = a.tkBlow ?? 0;
  for (let i = 0; i < 3; i++) {
    const u = (t * 0.55 + i / 3) % 1;
    wisp(ctx, sx - 2 + i * 2, sy, H * 0.2, u, 0.8 * (1 - (a.tkHide ?? 0) * 0.7), blow * 10 + (i - 1) * 1.5);
  }
  const [mx, my] = K.through(matOf('headJ'), 'mouthB', 'neck');
  // sipping: little hearts rising
  const sp = a.tkSip ?? 0;
  if (sp > 0.3) for (let i = 0; i < 3; i++) {
    const u = (t * 0.7 + i / 3) % 1;
    heart(ctx, mx + 6 + Math.sin(u * 6 + i) * 2, my - 6 - u * 14, 1.6, sp * Math.sin(Math.PI * u));
  }
  // whistling: notes off his lips
  const wh = a.tkWhistle ?? 0;
  if (wh > 0.1) {
    ctx.font = `bold ${Math.round(H * 0.11)}px sans-serif`;
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 3; k++) {
      const q = (t * 0.6 + k / 3) % 1;
      ctx.globalAlpha = wh * Math.sin(Math.PI * q);
      ctx.fillStyle = k % 2 ? '#8ab0d8' : '#7ab86a';
      ctx.strokeStyle = '#ffffff';
      glyph(ctx, a, k % 2 ? '♫' : '♪', mx + 6 + q * H * 0.12, my - 4 - q * H * 0.3);
    }
    ctx.globalAlpha = 1;
  }
  // dozing: a z drifting up
  const z = a.tkZ ?? 0;
  if (z > 0.3) {
    ctx.font = `bold ${Math.round(H * 0.1)}px sans-serif`;
    ctx.lineWidth = 1.4;
    for (let k = 0; k < 2; k++) {
      const q = (t * 0.4 + k / 2) % 1;
      ctx.globalAlpha = z * Math.sin(Math.PI * q);
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#6a8aa8';
      glyph(ctx, a, 'z', mx + 8 + q * H * 0.1, my - H * 0.2 - q * H * 0.2);
    }
    ctx.globalAlpha = 1;
  }
  // jolted awake: a drop of tea hopping out of the cup and falling
  const spill = a.tkSpill ?? -1;
  if (spill >= 0 && spill < 1) drop(ctx, sx + spill * 6, sy - Math.sin(Math.PI * Math.min(1, spill * 1.4)) * 8 + spill * spill * 30, 1.6, 1 - spill * 0.6);
  // dunking: a tea bag on its string from his far paw into the cup, bobbing
  const dk = a.tkDunk ?? 0;
  if (dk > 0.3) {
    const [px, py] = K.through(matOf('handF'), 'handF', 'wrF');
    const by = Math.min(sy + 2, py + 10 + Math.max(0, Math.sin(t * 7)) * 3);
    ctx.globalAlpha = dk;
    ctx.strokeStyle = '#f4f0e4';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(px + 1, py - 1);
    ctx.lineTo(sx, by - 3);
    ctx.stroke();
    ctx.fillStyle = '#e8b84a';
    ctx.fillRect(px - 0.6, py - 2.2, 1.8, 1.6);
    ctx.fillStyle = '#e8dcc0';
    ctx.strokeStyle = '#b8a888';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.rect(sx - 1.3, by - 2.4, 2.6, 3);
    ctx.fill();
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // the tea splash: an arc of hot tea drops flung out of the cup, a puff of steam where they land
  if (mv?.splash) {
    const u = (mt - mv.splash[0]) / 0.6;
    if (u >= 0 && u < 1) {
      for (let i = 0; i < 9; i++) {
        const v = clamp(u * 1.3 - i * 0.03, 0, 1);
        if (v <= 0 || v >= 1) continue;
        const d = ease(v) * H * (0.5 + hash(i) * 0.4);
        drop(ctx, sx + d, sy - Math.sin(Math.PI * v) * H * 0.18 + v * v * H * 0.1 + (hash(i + 3) - 0.5) * 4, 1.4 + hash(i + 5), 1 - v * 0.6);
      }
      if (u > 0.5) for (let i = 0; i < 3; i++) wisp(ctx, sx + H * 0.7 + (i - 1) * 4, 0, H * 0.25, (u - 0.5) * 2, 1);
    }
  }
  ctx.restore();
}

const R = tanukiRig({
  size: 40,
  design: tanukiDesign,
  skin: SKIN,
  J: { knotJ: KNOT, towelJ: TOWEL_END, cupJ: CUP, steamJ: STEAM, mouthB: MOUTH },
  fx: tanukiFx,
});
// (drawn at a tea picker's size: a little taller than the old one)
const BIG = 40 / R.H;
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
export const TANUKI_ART = { pad: 10, walk: 8, idle: 8, attack: 4, stride: R.stride * BIG, atkMs: [80, 300, 160], draw: R.still, rig, noHop: true };
