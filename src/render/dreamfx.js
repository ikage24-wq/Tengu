// The Queen's dream's boss casts (Chapter 9, 2026-11-19): every one a little piece of her old life
// in the human world. render/bossfx.js hands these looks over to here: warn() draws the wind-up
// over the floor warning (`p` 0..1 through it), hit() the landing (`u` 0..1 over DREAM_HOLD[look]
// seconds). (x, y) is the zone's spot on screen (a band's left end); the screen is 640 x 360.
//   Night Manager      memo (a sticky note fluttering down), stamp (a rubber stamp: SEE ME),
//                      coffee (a spill rolling out ahead of him), files (a wobbling stack of folders)
//   Cup-Noodle Dragon  steam (steam bursting round him), noodle (a noodle whip), broth (a hot drop
//                      and a fish-cake slice), chopsticks (snapping shut), boil (the floor boiling over)
//   Monday             email (an envelope, one unread), redpen (a red cross drawn over the tank),
//                      alarm (the alarm clock ringing over the room), invite (meeting invites sliding
//                      in from the wall), deadline (a big clock running out)

import { puff, shock, starFlash, easeOut, inked } from './fxkit.js';
import { glowDisc } from './mobfx.js';
// (Chapter 10's storm looks live in render/stormfx.js and are handed out from here too.)
import { STORM_FX, STORM_HOLD } from './stormfx.js';
import { SHAMAN_FX, SHAMAN_HOLD, shamanShot } from './shaman/fx.js';
import { sugarShot } from './teahatter/index.js';
import { bubbleRingShot } from './beluga/index.js';
import { paperBoatShot } from './axolotl/index.js';
import { starGlintShot } from './constellation/shot.js';
import { redTapeShot } from './fiddler/shot.js';
import { paperPlaneShot } from './sprout/shot.js';
import { cloudBallShot } from './blunderpuss/index.js';
import { stormNoteShot } from './treefrog/index.js';
import { nebulaYarnShot } from './alpaca/index.js';
import { balloonShot } from './balloonseller/index.js';
import { clangShot } from './tindrummer/index.js';
import { flossShot } from './chinchilla/index.js';
import { gumdropShot } from './chameleon/index.js';
import { jellyBeanShot } from './gummypillar/shot.js';
import { HAZEL_FX, HAZEL_HOLD } from './mothercapper/fx.js';
import { TUSKAR_FX, TUSKAR_HOLD } from './tuskar/fx.js';
import { WALTZ_FX, WALTZ_HOLD } from './waltzrondo/looks.js';
import { MARIGOLD_FX, MARIGOLD_HOLD } from './marigold/looks.js';
import { MORAY_FX, MORAY_HOLD } from './moray/looks.js';
import { GK_FX, GK_HOLD } from './grandkettle/looks.js';
import { PRISMARIS_FX, PRISMARIS_LOOK_HOLD } from './prismaris/looks.js';
import { ABYSSIA_FX, ABYSSIA_HOLD } from './abyssia/looks.js';
import { CORALIE_FX, CORALIE_HOLD } from './coralie/looks.js';
import { FOLIO_FX, FOLIO_HOLD } from './folio/looks.js';
import { ECLIPSE_FX, ECLIPSE_HOLD } from './eclipse/looks.js';
import { ASTRAEA_FX, ASTRAEA_HOLD } from './astraea/looks.js';
import { MANAGER_FX, MANAGER_HOLD } from './manager/looks.js';
import { NOODLE_FX, NOODLE_HOLD } from './noodle/looks.js';
import { MONDAY_FX, MONDAY_HOLD } from './monday/looks.js';
import { REVEILLE_FX, REVEILLE_HOLD } from './reveille/looks.js';
import { CARNIVAL_FX, CARNIVAL_HOLD } from './carnivallooks.js';
import { CANDY_FX, CANDY_HOLD } from './candylooks.js';
import { SKY_FX, SKY_HOLD } from './skylooks.js';

const TAU = Math.PI * 2;
const SW = 640;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const DREAM_HOLD = { ...STORM_HOLD, ...SHAMAN_HOLD, ...HAZEL_HOLD, ...TUSKAR_HOLD, ...WALTZ_HOLD, ...MARIGOLD_HOLD, ...MORAY_HOLD, ...ABYSSIA_HOLD, ...CORALIE_HOLD, ...GK_HOLD, ...CARNIVAL_HOLD, ...CANDY_HOLD, ...SKY_HOLD, ...FOLIO_HOLD, ...ECLIPSE_HOLD, ...ASTRAEA_HOLD, ...MANAGER_HOLD, ...NOODLE_HOLD, ...MONDAY_HOLD, ...PRISMARIS_LOOK_HOLD, ...REVEILLE_HOLD, memo: 0.7, stamp: 0.8, coffee: 0.8, files: 0.9, steam: 0.9, noodle: 0.7, broth: 0.7, chopsticks: 0.6, boil: 1.1, email: 0.7, redpen: 0.8, alarm: 1, invite: 0.8, deadline: 1.1 };

// ---------- Little things ----------
function shadow(ctx, x, y, rx, a, c = '#2a2240') {
  ctx.globalAlpha = a;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.ellipse(x, y - 1, rx, Math.max(1.5, rx * 0.28), 0, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// A sticky note, a corner curling up, three lines of scribble.
function note(ctx, x, y, s, rot, c = '#ffe066') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#c8a030';
  ctx.fillRect(-s / 2 - 1, -s / 2 - 1, s + 2, s + 2);
  ctx.fillStyle = c;
  ctx.fillRect(-s / 2, -s / 2, s, s);
  ctx.fillStyle = '#ffd23a';
  ctx.fillRect(-s / 2, -s / 2, s, s * 0.2);
  ctx.fillStyle = '#e8c040';
  ctx.beginPath();
  ctx.moveTo(s / 2, s / 2 - s * 0.3);
  ctx.lineTo(s / 2 - s * 0.3, s / 2);
  ctx.lineTo(s / 2 - s * 0.24, s / 2 - s * 0.24);
  ctx.fill();
  ctx.strokeStyle = '#a87a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let k = 0; k < 3; k++) {
    const yy = -s * 0.12 + k * s * 0.18;
    ctx.moveTo(-s * 0.32, yy);
    ctx.quadraticCurveTo(-s * 0.1, yy - 1.4, s * (k === 2 ? 0.06 : 0.3), yy);
  }
  ctx.stroke();
  ctx.restore();
}
// A rubber stamp: a round knob, a neck, a wooden block, the red rubber under it.
function stampTool(ctx, x, y, s) {
  ctx.fillStyle = '#5a3a2a';
  ctx.beginPath();
  ctx.arc(x, y - s * 1.55, s * 0.42, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8844a';
  ctx.beginPath();
  ctx.arc(x, y - s * 1.55, s * 0.34, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8a86a';
  ctx.beginPath();
  ctx.arc(x - s * 0.1, y - s * 1.65, s * 0.12, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#a86a3a';
  ctx.fillRect(x - s * 0.16, y - s * 1.25, s * 0.32, s * 0.6);
  ctx.fillStyle = '#5a3a2a';
  ctx.fillRect(x - s - 1, y - s * 0.7 - 1, s * 2 + 2, s * 0.56 + 2);
  ctx.fillStyle = '#c8844a';
  ctx.fillRect(x - s, y - s * 0.7, s * 2, s * 0.56);
  ctx.fillStyle = '#e8a86a';
  ctx.fillRect(x - s, y - s * 0.7, s * 2, s * 0.12);
  ctx.fillStyle = '#d8303a';
  ctx.fillRect(x - s * 0.92, y - s * 0.14, s * 1.84, s * 0.14);
}
// The stamp's mark: a red ring of ink, SEE ME inside it.
function seeMe(ctx, x, y, s, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.scale(1, 0.34);
  ctx.strokeStyle = '#d8303a';
  ctx.lineWidth = 3;
  ctx.strokeRect(-s, -s * 0.62, s * 2, s * 1.24);
  ctx.fillStyle = '#d8303a';
  ctx.font = `bold ${Math.round(s * 0.7)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SEE ME', 0, 1);
  ctx.restore();
}
// A manila folder, its tab up, a sheet peeking out.
function folder(ctx, x, y, w, h, rot, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#8a6a3a';
  ctx.fillRect(-w / 2 - 1, -h / 2 - 4, w * 0.4 + 2, 5);
  ctx.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
  ctx.fillStyle = c;
  ctx.fillRect(-w / 2, -h / 2 - 3, w * 0.4, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w / 2 + 3, -h / 2 - 2, w - 8, 3);
  ctx.fillStyle = c;
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-w / 2, -h / 2, w, 1.5);
  ctx.restore();
}
// A flying sheet of paper.
function sheet(ctx, x, y, rot, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#c8c4d8';
  ctx.fillRect(-5.5, -7, 11, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-5, -6.5, 10, 13);
  ctx.fillStyle = '#b8c0d8';
  for (let k = 0; k < 3; k++) ctx.fillRect(-3.4, -3.6 + k * 3, 6.4 - (k === 2 ? 2.4 : 0), 1);
  ctx.restore();
}
// Steam: a soft, see-through little cloud (no outline: steam isn't a ball).
function steamPuff(ctx, x, y, r, a) {
  if (a <= 0.01 || r <= 0.3) return;
  ctx.globalAlpha = a * 0.45;
  ctx.fillStyle = '#dfe4f2';
  ctx.beginPath();
  ctx.arc(x, y + r * 0.15, r, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = a * 0.7;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y - r * 0.15, r * 0.72, 0, TAU);
  ctx.arc(x + r * 0.38, y - r * 0.02, r * 0.52, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}
// Coffee: a dark brown, a lighter crema, cream on the crests.
const COFFEE = ['#5a3420', '#8a5a34', '#c8925a', '#f4e4cc'];
// A pair of chopsticks, the tips at (x1, y1).
function chopstick(ctx, x0, y0, x1, y1, w) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  ctx.fillStyle = '#7a4a2a';
  ctx.beginPath();
  ctx.moveTo(x0 + nx * (w / 2 + 1), y0 + ny * (w / 2 + 1));
  ctx.lineTo(x1 + nx * 1.4, y1 + ny * 1.4);
  ctx.lineTo(x1 - nx * 1.4, y1 - ny * 1.4);
  ctx.lineTo(x0 - nx * (w / 2 + 1), y0 - ny * (w / 2 + 1));
  ctx.fill();
  ctx.fillStyle = '#e8b878';
  ctx.beginPath();
  ctx.moveTo(x0 + nx * (w / 2), y0 + ny * (w / 2));
  ctx.lineTo(x1 + nx * 0.6, y1 + ny * 0.6);
  ctx.lineTo(x1 - nx * 0.6, y1 - ny * 0.6);
  ctx.lineTo(x0 - nx * (w / 2), y0 - ny * (w / 2));
  ctx.fill();
  // (A red band near the top.)
  ctx.strokeStyle = '#d8303a';
  ctx.lineWidth = w;
  ctx.beginPath();
  ctx.moveTo(x0 + (x1 - x0) * 0.08, y0 + (y1 - y0) * 0.08);
  ctx.lineTo(x0 + (x1 - x0) * 0.16, y0 + (y1 - y0) * 0.16);
  ctx.stroke();
}
// A slice of fish cake: white, a pink swirl, a crinkled rim.
function naruto(ctx, x, y, r, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#d8c8d0';
  ctx.beginPath();
  for (let k = 0; k <= 24; k++) {
    const a = (k / 24) * TAU;
    const q = r + 1 + (k % 2 ? 0.8 : 0);
    ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
  }
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#ff7aa8';
  ctx.lineWidth = Math.max(1, r * 0.22);
  ctx.beginPath();
  for (let k = 0; k <= 20; k++) {
    const a = (k / 20) * TAU * 1.6;
    const q = r * 0.75 * (k / 20);
    ctx.lineTo(Math.cos(a) * q, Math.sin(a) * q);
  }
  ctx.stroke();
  ctx.restore();
}
// A drop of hot broth (a fat teardrop, point up), a shine on it.
function drop(ctx, x, y, r, c = '#e8903a') {
  ctx.fillStyle = '#a85a1a';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 2.2 - 1);
  ctx.quadraticCurveTo(x + r * 1.3, y - r * 0.6, x + r + 1, y);
  ctx.arc(x, y, r + 1, 0, Math.PI);
  ctx.quadraticCurveTo(x - r * 1.3, y - r * 0.6, x, y - r * 2.2 - 1);
  ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 2.2);
  ctx.quadraticCurveTo(x + r * 1.2, y - r * 0.6, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.quadraticCurveTo(x - r * 1.2, y - r * 0.6, x, y - r * 2.2);
  ctx.fill();
  ctx.fillStyle = '#ffd8a0';
  ctx.beginPath();
  ctx.ellipse(x - r * 0.35, y - r * 0.3, r * 0.22, r * 0.36, -0.4, 0, TAU);
  ctx.fill();
}
// A wavy noodle from (x0, y0) along `len` the way `dir` points, wiggling at `ph`.
function noodle(ctx, x0, y0, len, dir, ph, amp, w, a = 1) {
  if (len < 2) return;
  ctx.globalAlpha = a;
  ctx.lineCap = 'round';
  for (const [c, ww] of [['#c89a3a', w + 2], ['#ffe08a', w], ['#fff4c8', w * 0.35]]) {
    ctx.strokeStyle = c;
    ctx.lineWidth = ww;
    ctx.beginPath();
    const n = Math.max(4, Math.round(len / 6));
    for (let k = 0; k <= n; k++) {
      const s = (k / n) * len;
      ctx.lineTo(x0 + dir * s, y0 + Math.sin(s * 0.16 + ph) * amp - (c === '#fff4c8' ? w * 0.2 : 0));
    }
    ctx.stroke();
  }
  ctx.lineCap = 'butt';
  ctx.globalAlpha = 1;
}
// An envelope, its flap down, a red unread dot in the corner.
function envelope(ctx, x, y, s, rot) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const w = s * 1.5;
  const h = s;
  ctx.fillStyle = '#9a9ab8';
  ctx.fillRect(-w / 2 - 1, -h / 2 - 1, w + 2, h + 2);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.strokeStyle = '#c8c8dc';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2);
  ctx.lineTo(0, h * 0.1);
  ctx.lineTo(w / 2, -h / 2);
  ctx.stroke();
  ctx.fillStyle = '#e8304a';
  ctx.beginPath();
  ctx.arc(w / 2 - 1, -h / 2 + 1, s * 0.24, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(w / 2 - 1.5, -h / 2 - s * 0.1, 1, s * 0.16);
  ctx.restore();
}
// The alarm clock: two bells, a red body, a white face, hands at `hand` (radians), the hammer
// buzzing between the bells.
function alarmClock(ctx, x, y, r, hand, buzz) {
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#a8862a';
    ctx.beginPath();
    ctx.arc(x + s * r * 0.62, y - r * 0.86, r * 0.42, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#ffd34a';
    ctx.beginPath();
    ctx.arc(x + s * r * 0.62, y - r * 0.86, r * 0.34, Math.PI, 0);
    ctx.fill();
  }
  ctx.strokeStyle = '#6a6a7a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y - r * 0.9);
  ctx.lineTo(x + buzz * r * 0.3, y - r * 1.26);
  ctx.stroke();
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(x + s * r * 0.5, y + r * 0.8);
    ctx.lineTo(x + s * r * 0.75, y + r * 1.12);
    ctx.stroke();
  }
  ctx.fillStyle = '#a81a2e';
  ctx.beginPath();
  ctx.arc(x, y, r + 1.5, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#e8304a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.76, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c8c8dc';
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU;
    ctx.fillRect(x + Math.cos(a) * r * 0.62 - 0.6, y + Math.sin(a) * r * 0.62 - 0.6, 1.2, 1.2);
  }
  ctx.strokeStyle = '#2a2a3a';
  ctx.lineCap = 'round';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(hand - Math.PI / 2) * r * 0.58, y + Math.sin(hand - Math.PI / 2) * r * 0.58);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(hand * 0.083 - Math.PI / 2) * r * 0.38, y + Math.sin(hand * 0.083 - Math.PI / 2) * r * 0.38);
  ctx.stroke();
  ctx.lineCap = 'butt';
  ctx.fillStyle = '#e8304a';
  ctx.beginPath();
  ctx.arc(x, y, 1.6, 0, TAU);
  ctx.fill();
}
// Sound: little arcs either side.
function rings(ctx, x, y, r, a, c, w) {
  if (a <= 0.01) return;
  ctx.globalAlpha = a;
  ctx.strokeStyle = c;
  ctx.lineWidth = w;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.8, 0, s > 0 ? -0.6 : Math.PI - 0.6, s > 0 ? 0.6 : Math.PI + 0.6);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
// A meeting invite: a white card, a coloured top bar, a little clock, two lines of text.
const INVITE_C = ['#4a8ae8', '#3ab88a', '#e8904a', '#9a6ae8'];
function invite(ctx, x, y, rot, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#8a8aa8';
  ctx.fillRect(-12, -9, 24, 18);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-11, -8, 22, 16);
  ctx.fillStyle = c;
  ctx.fillRect(-11, -8, 22, 4.5);
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(-6, 2, 3, 0, TAU);
  ctx.moveTo(-6, 2);
  ctx.lineTo(-6, 0.2);
  ctx.moveTo(-6, 2);
  ctx.lineTo(-4.6, 2);
  ctx.stroke();
  ctx.fillStyle = '#b8c0d8';
  ctx.fillRect(-1, 0, 9, 1.4);
  ctx.fillRect(-1, 3, 6, 1.4);
  ctx.restore();
}

// ---------- The looks ----------
export const DREAM_FX = {
  // A sticky note drifts down onto each of you, rocking like a leaf; it slaps flat, "one more thing".
  memo: {
    warn(ctx, z, x, y, p) {
      const sway = Math.sin(p * 9 + z.x * 0.02);
      shadow(ctx, x, y, 6 + p * 12, 0.2 + 0.3 * p);
      note(ctx, x + sway * (1 - p) * 18, y - 150 + p * p * 140, 18, sway * 0.5 * (1 - p));
    },
    hit(ctx, z, x, y, u, e, fade) {
      puff(ctx, x, y - 4, 9 * (1 - u) + 3, '#fffbe8', '#e8dcb0');
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(x, y - 3);
      ctx.scale(1, 0.4);
      note(ctx, 0, 0, 20, 0.2, '#ffe066');
      ctx.restore();
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#ffd23a';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let k = 0; k < 5; k++) {
        const a = -Math.PI * (0.15 + (k / 4) * 0.7);
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * (10 + e * 8), y - 6 + Math.sin(a) * (10 + e * 8));
        ctx.lineTo(x + Math.cos(a) * (16 + e * 14), y - 6 + Math.sin(a) * (16 + e * 14));
        ctx.stroke();
      }
      ctx.lineCap = 'butt';
    },
  },
  // A rubber stamp rises over the tank, inking itself, then THUMP: SEE ME.
  stamp: {
    warn(ctx, z, x, y, p, time) {
      const drop = clamp01((p - 0.86) / 0.14);
      const lift = Math.sin(clamp01(p / 0.86) * Math.PI * 0.5) * 30;
      const sy = y - 70 - lift + drop * (70 + lift) - 4;
      shadow(ctx, x, y, 14 + p * 22, 0.2 + 0.35 * p, '#5a1a2a');
      stampTool(ctx, x + Math.sin(time * 20) * p * 1.5, sy, 16);
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      if (u < 0.25) starFlash(ctx, x, y - 8, 16 + u * 60, 10, time, '#ff6a7a', '#ffffff');
      shock(ctx, x, y, 20 + e * (z.w / 2), 4 + e * 4, (1 - u) * 4, '#ff8a9a');
      seeMe(ctx, x, y - 2, 18, Math.min(1, fade * 1.4));
      stampTool(ctx, x, y - 4 - easeOut(clamp01(u * 2)) * 40, 16);
    },
  },
  // Coffee sloshes out ahead of him, a dark spill rolling along the floor; then the wave.
  coffee: {
    warn(ctx, z, x, y, p, time) {
      const d = z.dir ?? 1;
      const x0 = d > 0 ? x : x + z.w;
      const len = z.w * easeOut(p);
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = COFFEE[0];
      ctx.beginPath();
      ctx.ellipse(x0 + (d * len) / 2, y - 1, len / 2, 3 + p * 2, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = COFFEE[2];
      ctx.beginPath();
      ctx.ellipse(x0 + (d * len) / 2, y - 2, len / 2.4, 1.4 + p, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let k = 0; k < 4; k++) {
        const u = (time * 0.6 + k / 4) % 1;
        steamPuff(ctx, x0 + d * len * ((k + 0.5) / 4), y - 6 - u * 24, (2.5 + u * 6) * p, 1 - u);
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      // A wave of coffee rolling out along the floor: a swell rising to a crest that curls over
      // the way it rolls, crema foam along its top, drops flying off; a thin puddle left behind.
      const d = z.dir ?? 1;
      const x0 = d > 0 ? x : x + z.w;
      const head = x0 + d * z.w * e;
      const hh = 24 * (1 - u * 0.55);
      const wob = Math.sin(time * 9) * 1.5;
      ctx.globalAlpha = fade;
      ctx.fillStyle = COFFEE[0];
      ctx.beginPath();
      ctx.ellipse((x0 + head) / 2, y - 1, Math.abs(head - x0) / 2 + 4, 3, 0, 0, TAU);
      ctx.fill();
      ctx.fillStyle = COFFEE[2];
      ctx.fillRect(Math.min(x0, head), y - 3.4, Math.abs(head - x0), 1.2);
      const back = head - d * 52;
      ctx.fillStyle = COFFEE[0];
      ctx.beginPath();
      ctx.moveTo(back, y + 1);
      ctx.quadraticCurveTo(back + d * 26, y - hh * 0.35, head - d * 8, y - hh + wob);
      ctx.quadraticCurveTo(head + d * 8, y - hh - 4 + wob, head + d * 14, y - hh * 0.5);
      ctx.quadraticCurveTo(head + d * 4, y - hh * 0.55, head + d * 8, y + 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COFFEE[1];
      ctx.beginPath();
      ctx.moveTo(back + d * 12, y + 1);
      ctx.quadraticCurveTo(back + d * 30, y - hh * 0.3, head - d * 8, y - hh * 0.78 + wob);
      ctx.quadraticCurveTo(head + d * 2, y - hh * 0.6, head + d * 3, y + 1);
      ctx.closePath();
      ctx.fill();
      for (let k = 0; k < 6; k++) {
        const s = k / 5;
        const fx = head - d * (4 + (1 - s) * 34);
        const fy = y - hh * (0.4 + 0.6 * s * s) + wob * s;
        ctx.fillStyle = COFFEE[2];
        ctx.beginPath();
        ctx.arc(fx, fy + 0.6, 2.4 + s * 2, 0, TAU);
        ctx.fill();
        ctx.fillStyle = COFFEE[3];
        ctx.beginPath();
        ctx.arc(fx - 0.4, fy - 0.3, 1.8 + s * 1.6, 0, TAU);
        ctx.fill();
      }
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = k % 2 ? COFFEE[2] : COFFEE[1];
        ctx.beginPath();
        ctx.arc(head + d * (6 + k * 6) * (0.4 + e * 0.6), y - hh - 4 + k * 3 - Math.sin(e * Math.PI) * 6 + u * u * 26, 2.4 - u * 1.2, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  },
  // A stack of folders wobbling high over the healer; down it comes, papers everywhere.
  files: {
    warn(ctx, z, x, y, p, time) {
      const f = clamp01((p - 0.8) / 0.2);
      const by = y - 120 + f * f * 110;
      shadow(ctx, x, y, 14 + p * 26, 0.2 + 0.3 * p);
      const cs = ['#e8c87a', '#f0d898', '#8ab8e8', '#e8a8b8', '#e8c87a'];
      for (let k = 0; k < 5; k++) folder(ctx, x + Math.sin(time * 5 + k * 0.9) * k * 1.2 * (1 - f), by - k * 7, 30, 8, Math.sin(time * 4 + k) * 0.05, cs[k]);
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      puff(ctx, x, y - 5, 14 * (1 - u) + 4, '#ffffff', '#d8d0e8');
      const cs = ['#e8c87a', '#8ab8e8', '#e8a8b8'];
      ctx.globalAlpha = fade;
      for (let k = 0; k < 3; k++) folder(ctx, x + (k - 1) * 12 * e, y - 5 - (k === 1 ? 6 : 0), 30, 8, (k - 1) * 0.3 * e, cs[k]);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 7; k++) {
        const a = Math.PI + 0.2 + (k / 6) * (Math.PI - 0.4);
        sheet(ctx, x + Math.cos(a) * e * (40 + (k % 3) * 10), y - 14 + Math.sin(a) * e * 40 + u * u * 26, k + u * 5 * (k % 2 ? 1 : -1), fade);
      }
    },
  },
  // Steam gathers round his feet, puffs swelling; then it bursts out round him.
  steam: {
    warn(ctx, z, x, y, p, time) {
      const r = z.w / 2;
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * TAU + time * 0.8;
        const q = r * (0.3 + 0.6 * p);
        steamPuff(ctx, x + Math.cos(a) * q, y - 6 + Math.sin(a) * q * 0.18 - (k % 3) * 3 - p * 4, (3 + p * 8) * (0.8 + 0.2 * Math.sin(time * 6 + k)), 0.4 + 0.6 * p);
        const u = (time * 0.8 + k / 10) % 1;
        steamPuff(ctx, x + Math.cos(a) * q * 0.8, y - 10 - u * 30 * p, (2 + u * 5) * p, (1 - u) * p);
      }
    },
    hit(ctx, z, x, y, u, e, fade) {
      const r = z.w / 2;
      for (let k = 0; k < 14; k++) {
        const a = Math.PI + (k / 13) * Math.PI;
        const q = r * (0.3 + 0.75 * e);
        steamPuff(ctx, x + Math.cos(a) * q, y - 8 + Math.sin(a) * q * 0.5 - e * 12, 8 + e * 9 - (k % 3) * 2, fade);
      }
      shock(ctx, x, y, r * e, 6 + e * 6, (1 - u) * 4, '#ffffff');
      ctx.globalAlpha = 1;
    },
  },
  // A noodle snakes out along the floor ahead of him, wiggling; then it lashes.
  noodle: {
    warn(ctx, z, x, y, p, time) {
      const d = z.dir ?? 1;
      const x0 = d > 0 ? x : x + z.w;
      noodle(ctx, x0, y - 5, z.w * easeOut(p), d, time * 6, 3 + p * 2, 3, 0.4 + 0.5 * p);
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const d = z.dir ?? 1;
      const x0 = d > 0 ? x : x + z.w;
      noodle(ctx, x0, y - 8 - Math.sin(u * Math.PI) * 10, z.w, d, -time * 20 + u * 10, 10 * (1 - u) + 2, 5, fade);
      const ex = x0 + d * z.w;
      if (u < 0.3) starFlash(ctx, ex, y - 10, 12 + u * 40, 8, time, '#ffd34a', '#ffffff');
      for (let k = 0; k < 5; k++) drop(ctx, ex - d * k * 8 * e, y - 10 - Math.sin((k / 4) * Math.PI) * 20 * e + u * u * 20, 2.6 * fade);
    },
  },
  // A fat drop of hot broth falls on each of you; it splashes, and a fish-cake slice flips out.
  broth: {
    warn(ctx, z, x, y, p, time) {
      const f = clamp01((p - 0.35) / 0.65);
      shadow(ctx, x, y, 6 + p * 12, 0.2 + 0.3 * p, '#5a2a1a');
      drop(ctx, x, y - 150 + f * f * 140, 4 + f * 3);
      steamPuff(ctx, x + Math.sin(time * 3) * 3, y - 150 + f * f * 140 - 16, 3 + 2 * (1 - f), 1 - f);
    },
    hit(ctx, z, x, y, u, e, fade) {
      ctx.globalAlpha = 0.7 * fade;
      ctx.fillStyle = '#e8903a';
      ctx.beginPath();
      ctx.ellipse(x, y - 1, (z.w / 2) * e, 3 + e * 3, 0, 0, TAU);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let k = 0; k < 6; k++) {
        const a = Math.PI + 0.3 + (k / 5) * (Math.PI - 0.6);
        drop(ctx, x + Math.cos(a) * e * 26, y - 6 + Math.sin(a) * e * 22 + u * u * 26, 2.4 * fade);
      }
      naruto(ctx, x + e * 10, y - 8 - Math.sin(u * Math.PI) * 26, 5 * Math.min(1, fade * 1.5), u * 9);
      steamPuff(ctx, x, y - 10 - e * 16, 5 + e * 6, fade);
    },
  },
  // Big chopsticks open wide over the tank, wider, wider; SNAP.
  chopsticks: {
    warn(ctx, z, x, y, p, time) {
      const shut = clamp01((p - 0.85) / 0.15);
      const open = (0.18 + 0.4 * Math.sin(clamp01(p / 0.85) * Math.PI * 0.5)) * (1 - shut);
      shadow(ctx, x, y, 10 + p * 18, 0.2 + 0.3 * p);
      const tip = [x, y - 14];
      for (const s of [-1, 1]) {
        const a = -Math.PI / 2 + s * open;
        chopstick(ctx, tip[0] + Math.cos(a) * 80 + Math.sin(time * 18) * p, tip[1] + Math.sin(a) * 80, tip[0] + s * open * 8, tip[1] - 6 * (1 - shut), 4);
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      if (u < 0.3) starFlash(ctx, x, y - 16, 14 + u * 50, 8, time, '#ffd34a', '#ffffff');
      ctx.globalAlpha = fade;
      for (const s of [-1, 1]) chopstick(ctx, x + s * 3 - e * s * 2, y - 94 + e * 10, x + s * 0.6, y - 14 + e * 2, 4);
      ctx.globalAlpha = 1;
      shock(ctx, x, y - 2, 14 + e * (z.w / 2), 3 + e * 4, (1 - u) * 3.5, '#ffd34a');
    },
  },
  // The whole floor starts to boil: broth rising off it, bubbles growing and popping; then it
  // boils over in a wave from wall to wall.
  boil: {
    warn(ctx, z, x, y, p, time) {
      const h = 3 + p * 10;
      ctx.globalAlpha = 0.25 + 0.3 * p;
      ctx.fillStyle = '#e8903a';
      ctx.fillRect(0, y - h, SW, h + 8);
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ffc070';
      ctx.fillRect(0, y - h, SW, 2);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 22; k++) {
        const bx = ((k * 97.3 + Math.floor(time * 0.7 + k * 0.37) * 53) % SW + SW) % SW;
        const u = (time * (0.7 + (k % 4) * 0.2) + k * 0.37) % 1;
        const r = (1.5 + u * 4) * (0.4 + p);
        ctx.globalAlpha = (1 - u * 0.6) * (0.4 + 0.6 * p);
        ctx.strokeStyle = '#fff0c8';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(bx, y - h - u * 8 * p, r, 0, TAU);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      for (let k = 0; k < 8; k++) {
        const u = (time * 0.5 + k / 8) % 1;
        steamPuff(ctx, ((k * 83 + 30) % SW), y - h - 6 - u * 30, (4 + u * 9) * p, (1 - u) * 0.9);
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const h = 30 * Math.sin(Math.min(1, u * 1.6) * Math.PI * 0.5) * (1 - Math.max(0, u - 0.5) * 2) + 4;
      ctx.globalAlpha = 0.75 * fade;
      ctx.fillStyle = '#d8782a';
      ctx.beginPath();
      ctx.moveTo(0, y + 10);
      for (let k = 0; k <= 32; k++) ctx.lineTo((k / 32) * SW, y - h - Math.sin(k * 0.9 + time * 9) * 4);
      ctx.lineTo(SW, y + 10);
      ctx.fill();
      ctx.fillStyle = '#ffb060';
      ctx.beginPath();
      ctx.moveTo(0, y + 10);
      for (let k = 0; k <= 32; k++) ctx.lineTo((k / 32) * SW, y - h * 0.6 - Math.sin(k * 1.3 - time * 7) * 3);
      ctx.lineTo(SW, y + 10);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (let k = 0; k < 6; k++) noodle(ctx, ((k * 117 + 20) % SW), y - h * 0.7, 30, k % 2 ? 1 : -1, time * 8 + k, 3, 2.4, fade);
      for (let k = 0; k < 10; k++) steamPuff(ctx, (k + 0.5) * (SW / 10), y - h - 8 - e * 22, 8 + e * 8 - (k % 3) * 2, fade);
    },
  },
  // An envelope tumbles down onto each of you, its unread dot blinking; it lands and bursts open.
  email: {
    warn(ctx, z, x, y, p, time) {
      const f = clamp01((p - 0.3) / 0.7);
      shadow(ctx, x, y, 6 + p * 12, 0.2 + 0.3 * p);
      envelope(ctx, x + Math.sin(f * 7 + z.x * 0.02) * (1 - f) * 12, y - 150 + f * f * 138, 13, Math.sin(time * 5 + z.x) * 0.3 * (1 - f));
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      puff(ctx, x, y - 4, 9 * (1 - u) + 3, '#ffffff', '#d8d8ec');
      ctx.globalAlpha = fade;
      envelope(ctx, x, y - 8, 13, 0);
      // The letter pops up out of it, and a "!" over it.
      sheet(ctx, x, y - 14 - e * 18, Math.sin(u * 6) * 0.3, fade);
      ctx.fillStyle = '#e8304a';
      ctx.fillRect(x - 1.5, y - 52 - e * 10, 3, 9);
      ctx.fillRect(x - 1.5, y - 40 - e * 10, 3, 3);
      ctx.globalAlpha = 1;
    },
  },
  // A red cross drawn over the tank, one stroke and then the other, the pen nib leading; it
  // flares and the ink splashes.
  redpen: {
    warn(ctx, z, x, y, p, time) {
      const r = z.w / 2 - 6;
      const s1 = clamp01(p / 0.45);
      const s2 = clamp01((p - 0.5) / 0.45);
      const cy = y - 14;
      ctx.strokeStyle = '#e8304a';
      ctx.lineCap = 'round';
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x - r, cy - r * 0.4);
      ctx.lineTo(x - r + 2 * r * s1, cy - r * 0.4 + r * 0.8 * s1);
      if (s2 > 0) {
        ctx.moveTo(x + r, cy - r * 0.4);
        ctx.lineTo(x + r - 2 * r * s2, cy - r * 0.4 + r * 0.8 * s2);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.lineCap = 'butt';
      // The nib where the line is being drawn.
      const [nx, ny] = s2 > 0 ? [x + r - 2 * r * s2, cy - r * 0.4 + r * 0.8 * s2] : [x - r + 2 * r * s1, cy - r * 0.4 + r * 0.8 * s1];
      ctx.fillStyle = '#e8304a';
      ctx.fillRect(nx - 2, ny - 26, 4, 22);
      ctx.fillStyle = '#f4e0c8';
      ctx.beginPath();
      ctx.moveTo(nx - 2, ny - 4);
      ctx.lineTo(nx + 2, ny - 4);
      ctx.lineTo(nx, ny);
      ctx.fill();
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(nx - 2.4, ny - 30, 4.8, 5);
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const r = z.w / 2 - 6;
      const cy = y - 14;
      if (u < 0.3) starFlash(ctx, x, cy, 14 + u * 50, 10, time, '#ff6a7a', '#ffffff');
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#e8304a';
      ctx.lineCap = 'round';
      ctx.lineWidth = 5 + e * 3;
      ctx.beginPath();
      ctx.moveTo(x - r, cy - r * 0.4);
      ctx.lineTo(x + r, cy + r * 0.4);
      ctx.moveTo(x + r, cy - r * 0.4);
      ctx.lineTo(x - r, cy + r * 0.4);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.fillStyle = '#e8304a';
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * TAU + 0.3;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * e * 30, cy + Math.sin(a) * e * 18 + u * u * 20, 2.4 * (1 - u) + 0.6, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    },
  },
  // The alarm clock appears over Monday, buzzing harder and harder; then it RINGS across the
  // whole room.
  alarm: {
    warn(ctx, z, x, y, p, time) {
      const buzz = Math.sin(time * (20 + p * 30));
      const cy = y - 176;
      alarmClock(ctx, x + buzz * p * 2.5, cy - Math.abs(buzz) * p * 2, 13, time * 2 + p * 6, buzz);
      for (let k = 0; k < 2; k++) {
        const u = (time * (1 + p * 1.5) + k / 2) % 1;
        rings(ctx, x, cy, 16 + u * 16, (1 - u) * p * 0.8, '#ffd34a', 2);
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const cy = y - 176;
      const buzz = Math.sin(time * 60);
      alarmClock(ctx, x + buzz * 3 * (1 - u), cy, 13 + Math.sin(u * Math.PI) * 3, time * 2, buzz);
      for (let k = 0; k < 4; k++) {
        const v = clamp01(e * 1.2 - k * 0.12);
        rings(ctx, x, cy, 20 + v * (SW * 0.9), (1 - u) * 0.8, k % 2 ? '#ffd34a' : '#ffffff', 3.4 - k * 0.5);
      }
    },
  },
  // Meeting invites slide in from the wall, card after card, toward the gap; then they all land
  // at once.
  invite: {
    warn(ctx, z, x, y, p, time) {
      const side = z.side ?? -1;
      const n = Math.max(1, Math.floor(z.w / 34));
      const reach = easeOut(p);
      for (let k = 0; k < n; k++) {
        // (Cards from the wall end first; each slides to its own place along the band.)
        const s = side < 0 ? k / n : 1 - (k + 1) / n;
        const cx = x + (s + 0.5 / n) * z.w;
        const wallX = side < 0 ? x - 30 : x + z.w + 30;
        const xx = wallX + (cx - wallX) * clamp01(reach * 1.4 - (k / n) * 0.4);
        invite(ctx, xx, y - 26 - (k % 2) * 10 + Math.sin(time * 3 + k) * 2, Math.sin(time * 2 + k) * 0.08, INVITE_C[k % 4]);
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const n = Math.max(1, Math.floor(z.w / 34));
      ctx.globalAlpha = fade;
      for (let k = 0; k < n; k++) {
        const cx = x + ((k + 0.5) / n) * z.w;
        invite(ctx, cx + Math.sin(k * 3 + u * 10) * 3 * (1 - u), y - 18 + e * 10 - (k % 2) * 6 * (1 - e), (k % 2 ? 1 : -1) * 0.2 * e, INVITE_C[k % 4]);
      }
      ctx.globalAlpha = 1;
      for (let k = 0; k < n; k += 2) puff(ctx, x + ((k + 0.5) / n) * z.w, y - 4, 7 * (1 - u) + 1, '#ffffff', '#d8d8ec');
    },
  },
  // A big clock over the room, its hand sweeping round to the hour, the red creeping in; then it
  // strikes and the floor flashes.
  deadline: {
    warn(ctx, z, x, y, p, time) {
      const cx = SW / 2;
      const cy = 64;
      const r = 26;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = '#3a2a4a';
      ctx.beginPath();
      ctx.arc(cx, cy, r + 3, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fill();
      // (Red fills the face as the time runs out.)
      ctx.fillStyle = '#ff8a9a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + p * TAU);
      ctx.fill();
      ctx.fillStyle = '#3a2a4a';
      for (let k = 0; k < 12; k++) {
        const a = (k / 12) * TAU;
        ctx.fillRect(cx + Math.cos(a) * r * 0.8 - 1, cy + Math.sin(a) * r * 0.8 - 1, 2, 2);
      }
      ctx.strokeStyle = '#e8304a';
      ctx.lineCap = 'round';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(-Math.PI / 2 + p * TAU) * r * 0.8, cy + Math.sin(-Math.PI / 2 + p * TAU) * r * 0.8);
      ctx.stroke();
      ctx.lineCap = 'butt';
      ctx.globalAlpha = 1;
      if (p > 0.75) {
        const tick = Math.max(0, Math.sin(time * 18));
        ctx.globalAlpha = (p - 0.75) * 4 * 0.3 * tick;
        ctx.fillStyle = '#ff3a5a';
        ctx.fillRect(0, y - 6, SW, 12);
        ctx.globalAlpha = 1;
      }
    },
    hit(ctx, z, x, y, u, e, fade, time) {
      const cx = SW / 2;
      const cy = 64;
      ctx.globalAlpha = Math.max(0, 1 - u / 0.3) * 0.25;
      ctx.fillStyle = '#ff6a7a';
      ctx.fillRect(0, 0, SW, 360);
      ctx.globalAlpha = 1;
      starFlash(ctx, cx, cy, 30 + e * 40, 14, time * 0.2, '#ff6a7a', '#ffffff');
      ctx.globalAlpha = fade * 0.6;
      ctx.fillStyle = '#ff3a5a';
      ctx.fillRect(0, y - 4 - e * 6, SW, 8 + e * 6);
      ctx.globalAlpha = 1;
      for (let k = 0; k < 8; k++) puff(ctx, (k + 0.5) * (SW / 8), y - 6 - e * 12, 7 * (1 - u) + 1, '#ffffff', '#f0d0dc');
    },
  },
};

// A monster's thrown shot with a look of its own (render/scene.js, the 'spit' vfx; `p` 0..1 along
// its flight, `d` the way it flies): the Candle Bride's flame; the Teacup Hermit's sugar cube; the Red-Tape
// Raccoon's red tape and the Intern Quokka's paper plane (their own folders); and more below.
export function dreamShot(ctx, shot, x, y, p, d) {
  // (the Myconid Shaman's acorn: render/shaman/fx.js)
  if (shamanShot(ctx, shot, x, y, p, d)) return true;
  // (the Teacup Hermit's sugar cube: render/teahatter/)
  if (sugarShot(ctx, shot, x, y, p, d)) return true;
  // (the Beluga Lifeguard's rescue ring: render/beluga/)
  if (bubbleRingShot(ctx, shot, x, y, p, d)) return true;
  // (the Axolotl Librarian's paper boat: render/axolotl/)
  if (paperBoatShot(ctx, shot, x, y, p, d)) return true;
  // (the Constellation Starfish's little gold star: render/constellation/)
  if (starGlintShot(ctx, shot, x, y, p, d)) return true;
  // (the Red-Tape Raccoon's roll of red tape: render/raccoon/)
  if (redTapeShot(ctx, shot, x, y, p, d)) return true;
  // (the Intern Quokka's paper plane: render/quokka/)
  if (paperPlaneShot(ctx, shot, x, y, p, d)) return true;
  // (Blunderpuss's cloudball: render/blunderpuss/)
  if (cloudBallShot(ctx, shot, x, y, p, d)) return true;
  // (the Stormsong Frog's note of lightning: render/treefrog/)
  if (stormNoteShot(ctx, shot, x, y, p, d)) return true;
  // (the Nebula Knitter's ball of nebula yarn: render/alpaca/)
  if (nebulaYarnShot(ctx, shot, x, y, p, d)) return true;
  // (the Koala Balloonist's balloon: render/balloonseller/)
  if (balloonShot(ctx, shot, x, y, p, d)) return true;
  // (the Cymbal Monkey's ring of sound: render/tindrummer/)
  if (clangShot(ctx, shot, x, y, p, d)) return true;
  // (the Candy Volcano's: the Floss Chinchilla's puff of floss, the Swirl Chameleon's gumdrop, the
  // Gummy Caterpillar's jelly bean: render/chinchilla/, render/chameleon/, render/gummypillar/)
  if (flossShot(ctx, shot, x, y, p, d)) return true;
  if (gumdropShot(ctx, shot, x, y, p, d)) return true;
  if (jellyBeanShot(ctx, shot, x, y, p, d)) return true;
  if (shot === 'flame') {
    // One of the Candle Bride's own flames (render/bride/) flung through the air: a soft teardrop
    // in her flame's colours, its tail streaming back and swaying, on a rim of its own colour, a
    // warm glow round it (the shared soft style, render/mobfx.js).
    const sw = Math.sin(p * 14) * 0.8;
    glowDisc(ctx, x, y, 13, '#ffd08a', 0.45);
    ctx.save();
    ctx.translate(x, y);
    const tear = (r, len, g) => {
      ctx.beginPath();
      ctx.moveTo(-d * (r + len + g), sw * (r / 5));
      ctx.bezierCurveTo(-d * r * 0.7, -r * 1.25 - g, d * (r * 0.9 + g), -r - g, d * (r + g), 0);
      ctx.bezierCurveTo(d * (r * 0.9 + g), r + g, -d * r * 0.7, r * 1.25 + g, -d * (r + len + g), sw * (r / 5));
      ctx.closePath();
    };
    if (inked(ctx)) {
      tear(5, 12, 1);
      ctx.fillStyle = '#c8683a';
      ctx.fill();
    }
    tear(5, 12, 0);
    ctx.fillStyle = '#ff9a3a';
    ctx.fill();
    tear(3, 7, 0);
    ctx.fillStyle = '#ffe9a0';
    ctx.fill();
    ctx.restore();
    return true;
  }
  return false;
}

// (render/bossfx.js calls these.)
const ALL_FX = () => (ALL ??= { ...DREAM_FX, ...STORM_FX, ...SHAMAN_FX, ...HAZEL_FX, ...TUSKAR_FX, ...WALTZ_FX, ...MARIGOLD_FX, ...MORAY_FX, ...ABYSSIA_FX, ...CORALIE_FX, ...GK_FX, ...CARNIVAL_FX, ...CANDY_FX, ...SKY_FX, ...FOLIO_FX, ...ECLIPSE_FX, ...ASTRAEA_FX, ...MANAGER_FX, ...NOODLE_FX, ...MONDAY_FX, ...PRISMARIS_FX, ...REVEILLE_FX });
let ALL = null;
export function dreamWarn(ctx, z, x, y, p, time) {
  const fx = ALL_FX()[z.look];
  if (!fx) return false;
  ctx.save();
  fx.warn(ctx, z, x, y, p, time);
  ctx.restore();
  return true;
}
export function dreamHit(ctx, z, x, y, u, time) {
  const fx = ALL_FX()[z.look];
  if (!fx) return false;
  u = clamp01(u);
  const e = easeOut(u);
  const fade = u < 0.5 ? 1 : 1 - (u - 0.5) / 0.5;
  ctx.save();
  fx.hit(ctx, z, x, y, u, e, fade, time);
  ctx.restore();
  return true;
}
