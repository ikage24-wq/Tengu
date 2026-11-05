// Hayate, the great Tengu who guards the island (data/story.js), as she speaks in cutscenes
// (ui/cutscene.js). The player picked her look (2026-11-05): the Sleepy Sky Granny, a big puffy
// cloud of white hair, droopy sleepy eyes and cozy lavender clothes. She is built on the player
// character (drawHero) and then given her own tengu parts, drawn here: great feathered wings that
// breathe slowly open and closed, a little black tokin cap perched on her cloud of hair, the
// pom-pom sash of a mountain hermit, and a feather fan in her hand that sways as she talks. Asleep
// (the default), she nods, with her sleepy face's own drifting z's; awake, she smiles.

import { drawHero } from './hero.js';

const LOOK = { hairStyle: 'cloud', hairColor: '#ffffff', hairTip: '#d8e8ff', skinTone: '#fff0e6', eyeColor: '#7a96e0', eyeStyle: 'droopy', outfitColor: '#c9b8ff' };
const GEAR = null;

// Her feathers: a 4-tone ramp from a white core to lavender, leaning violet in the shadows, each
// outlined in a darker shade of its own colour (the art bible's rule for soft pastel shapes).
const FEATHER = ['#ffffff', '#eef0ff', '#d6ccff', '#a898e0'];
const FEATHER_INK = '#7a68b8';
const SKY = ['#ffffff', '#d8f0ff', '#9fd8ff', '#5aa8d8'];

const ease = (u) => u * u * (3 - 2 * u);

// One feather: a long leaf from its root along `a` (radians, 0 = up), `len` long, `w` wide.
function feather(ctx, x, y, a, len, w, ramp, ink) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w, -len * 0.45, 0, -len);
  ctx.quadraticCurveTo(-w, -len * 0.45, 0, 0);
  const g = ctx.createLinearGradient(0, 0, 0, -len);
  g.addColorStop(0, ramp[3]);
  g.addColorStop(0.35, ramp[2]);
  g.addColorStop(0.75, ramp[1]);
  g.addColorStop(1, ramp[0]);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(0.8, w * 0.14);
  ctx.stroke();
  // The quill down its middle.
  ctx.beginPath();
  ctx.moveTo(0, -len * 0.08);
  ctx.lineTo(0, -len * 0.8);
  ctx.strokeStyle = 'rgba(122,104,184,0.45)';
  ctx.lineWidth = Math.max(0.5, w * 0.08);
  ctx.stroke();
  ctx.restore();
}

// A wing on `side` (-1 left, 1 right), rooted at the shoulder: long flight feathers fanned up and
// out, short covert feathers over their roots. `open` (0-1) is how far it is spread.
function wing(ctx, x, y, side, u, open) {
  const spread = 0.7 + 0.3 * open;
  // Long flight feathers, from up-and-out round to out-and-down, longest at the top.
  for (let k = 0; k < 7; k++) {
    const f = k / 6;
    const a = side * (0.75 + f * 1.35 * spread);
    feather(ctx, x + side * f * 1.5 * u, y + f * 2.5 * u, a, (27 - f * 8) * u, 5.2 * u, FEATHER, FEATHER_INK);
  }
  // Short round covert feathers over their roots.
  for (let k = 0; k < 5; k++) {
    const f = k / 4;
    const a = side * (0.9 + f * 1.2 * spread);
    feather(ctx, x + side * (1 + f * 1.5) * u, y + (0.5 + f * 2) * u, a, (13 - f * 2) * u, 4.4 * u, ['#ffffff', '#ffffff', '#eef0ff', '#d6ccff'], FEATHER_INK);
  }
}

// The little black tokin cap of a mountain hermit, tied under the chin with a white cord.
function tokin(ctx, x, y, u, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.beginPath();
  ctx.moveTo(-4 * u, 0);
  ctx.lineTo(-3 * u, -4.5 * u);
  ctx.quadraticCurveTo(0, -6.5 * u, 3 * u, -4.5 * u);
  ctx.lineTo(4 * u, 0);
  ctx.closePath();
  ctx.fillStyle = '#3a3550';
  ctx.fill();
  ctx.strokeStyle = '#1e1a2e';
  ctx.lineWidth = 0.9 * u;
  ctx.stroke();
  // Its pleats, and a shine.
  ctx.strokeStyle = '#5a5478';
  ctx.lineWidth = 0.6 * u;
  for (const px of [-1.6, 0, 1.6]) {
    ctx.beginPath();
    ctx.moveTo(px * u, -0.6 * u);
    ctx.lineTo(px * 0.8 * u, -4.6 * u);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillRect(-2.6 * u, -3.8 * u, 1 * u, 1.6 * u);
  ctx.restore();
}

// The hermit's sash: fluffy pom-poms down the front, swaying a little after her.
function poms(ctx, x, y, u, t) {
  const at = [[-2.6, 0, SKY], [2.6, 0, SKY], [-2.2, 3.4, FEATHER], [2.2, 3.4, FEATHER]];
  at.forEach(([px, py, ramp], i) => {
    const sway = Math.sin(t * 1.6 + i) * 0.5 * u;
    const cx = x + px * u + sway;
    const cy = y + py * u;
    const r = 1.9 * u;
    const g = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, r * 0.2, cx, cy, r);
    g.addColorStop(0, ramp[0]);
    g.addColorStop(0.5, ramp[1]);
    g.addColorStop(1, ramp[2]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = ramp[3];
    ctx.lineWidth = 0.6 * u;
    ctx.stroke();
  });
}

// The feather fan (a tengu's hauchiwa): nine feathers spread from a short handle, in her hand.
function fan(ctx, x, y, u, a) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1.4 * u;
  ctx.beginPath();
  ctx.moveTo(0, 2 * u);
  ctx.lineTo(0, -4 * u);
  ctx.stroke();
  for (let k = 0; k < 9; k++) {
    const f = k / 8 - 0.5;
    feather(ctx, 0, -3.5 * u, f * 1.5, (10 - Math.abs(f) * 4) * u, 2.4 * u, SKY, '#4a88b8');
  }
  // The binding where the feathers meet the handle.
  ctx.fillStyle = '#ffd36b';
  ctx.beginPath();
  ctx.arc(0, -3.5 * u, 1.3 * u, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#a8701a';
  ctx.lineWidth = 0.5 * u;
  ctx.stroke();
  ctx.restore();
}

// Hayate at (x, y) (her feet), `s` the hero's scale (2 in the cutscene window), `t` seconds into
// her line, `awake` once she has woken, `talking` while her words type out.
export function drawHayate(ctx, x, y, t, { s = 2, awake = false, talking = false } = {}) {
  const u = s;
  // She breathes: a slow rise and fall, the wings opening a little on each breath in; asleep,
  // she nods now and then and catches herself.
  const breath = 0.5 + 0.5 * Math.sin(t * 1.3);
  const nod = awake ? 0 : Math.max(0, Math.sin(t * 0.7)) ** 6 * 1.6 * u;
  const by = y - breath * 0.6 * u;
  ctx.save();
  // Wings behind her, from the shoulders.
  const sy = by - 15 * u;
  wing(ctx, x - 5 * u, sy, -1, u, ease(breath));
  wing(ctx, x + 5 * u, sy, 1, u, ease(breath));
  // Herself, on the player-character base.
  drawHero(ctx, { ...LOOK, face: awake ? 'smile' : 'sleepy' }, GEAR, x, by + nod * 0.2, { pose: 'idle', time: t, seed: 7, scale: s, talking, facing: 1 });
  // The pom-pom sash over her robe.
  poms(ctx, x, by - 10.5 * u, u, t);
  // The tokin, perched on top of the cloud of hair, tipping with her nod.
  tokin(ctx, x + 2 * u, by - 42 * u + nod, u, 0.18 + nod * 0.03);
  // The fan in her hand, swaying as she talks.
  // (Held low and out to her side, so it never covers her face.)
  fan(ctx, x + 11 * u, by - 3 * u, u, 0.75 + Math.sin(t * (talking ? 3 : 1.1)) * (talking ? 0.2 : 0.08));
  ctx.restore();
}
