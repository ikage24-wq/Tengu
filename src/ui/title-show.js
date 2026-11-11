// The title screen is a show that goes wrong ("It's all a set", the player's pick, 2026-11-05).
// The curtains open on a painfully generic title screen: a painted meadow with the name in a
// default font. It creaks, tips over backwards and lands WHUMP, and behind it is the backstage of
// Madame Encore's theatre, where the cast scrambles to put the opening back together: the logo is
// lowered on ropes (one letter upside down), Pip wheels in the second word in the wrong order,
// Marlo sells popcorn in the spotlight, a sandbag finds Tora, and everyone takes a bow. Then the
// show settles: the logo hangs and sways, the "Press any key" board comes down on its ropes, and
// the island's folk keep popping in for close-ups (title-peek.js). Any key during the show skips
// to the end.

import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { NPCS } from '../data/npcs.js';
import { drawSceneBack } from '../render/scenery.js';
import { drawHero } from '../render/hero.js';
import { drawMonster } from '../render/monsters.js';
import { createAnim, stepAnim } from '../render/animator.js';
import { withZoom } from '../render/pixel.js';
import { font, text, roundRect } from './kit.js';
import { sfx } from '../audio/sfx.js';
import { logoTheft } from './title-peek.js';
import { castGear } from './title-cast.js';

// The game's name, as the logo spells it (one word a row).
export const TITLE = ['WINDBAG', 'ISLAND'];

const FLOOR = 300;
const S = 1.6;
const END = 36;
const clamp = (v) => Math.max(0, Math.min(1, v));
const ease = (u) => u * u * (3 - 2 * u);
const span = (T, a, b) => clamp((T - a) / (b - a));
const spring = (u) => (u <= 0 ? 0 : 1 - Math.exp(-7 * u) * Math.cos(10 * u));

// ---------- The cast: where each one is, which way they face, how they look, what they say ----------

// Moves along keys [[t, x], ...] with eased legs between them; returns x and its speed.
function along(keys, T) {
  if (T <= keys[0][0]) return { x: keys[0][1], v: 0 };
  for (let i = 1; i < keys.length; i++) {
    const [t0, x0] = keys[i - 1];
    const [t1, x1] = keys[i];
    if (T < t1) {
      const u = (T - t0) / (t1 - t0);
      return { x: x0 + (x1 - x0) * ease(u), v: ((x1 - x0) / (t1 - t0)) * 6 * u * (1 - u) };
    }
  }
  return { x: keys.at(-1)[1], v: 0 };
}

const CART = [[17, -170], [19.6, 300]];
const CAST = {
  encore: { keys: [[5.4, -40], [7, 140]], face: (T) => (T < 12 ? 'angry' : T < 15.6 ? 'determined' : T < 17 ? 'angry' : T < 23.4 ? 'judging' : T < 24.8 ? 'angry' : T < 32.4 ? 'judging' : 'proud') },
  tora: { keys: [[8.2, 690], [9.4, 510]], face: (T) => (T < 13 ? 'nervous' : T < 31.8 ? 'grin' : T < 37 ? 'dizzy' : 'grin'), facing: -1 },
  pip: { keys: [[17, -270], [19.6, 200]], face: (T) => (T < 22 ? 'determined' : T < 23.4 ? 'grin' : T < 25 ? 'shock' : 'grin') },
  nim: { keys: [[18, 700], [19.6, 440]], face: (T) => (T < 22 ? 'nervous' : T < 26 ? 'shy' : 'smile'), facing: -1 },
  marlo: { keys: [[26.4, 700], [27.8, 570], [31.4, 570], [32.8, 720]], face: () => 'sassy', facing: -1 },
};
const LINES = [
  [7.0, 9.6, 'encore', 'Who knocked over the SCENERY?!'],
  [9.6, 12, 'tora', 'It was... structurally optimistic.'],
  [12, 13.6, 'encore', 'Places! Lower the LOGO!'],
  [15.6, 17, 'encore', 'Upside. DOWN.'],
  [19.8, 22, 'nim', 'Um... th-that says ISNALD.'],
  [22, 23.4, 'pip', 'Close enough!'],
  [23.4, 24.8, 'encore', 'IT. IS. NOT.'],
  [29, 31.4, 'marlo', 'Popcorn! 3 gold! Disaster pricing!'],
  [31.9, 32.8, 'tora', 'Ow.'],
  [32.8, 34.4, 'encore', '...and SCENE!'],
];
const anims = Object.fromEntries(Object.keys(CAST).map((k) => [k, createAnim()]));
let lastT = null;

function drawCast(ctx, T, time) {
  const dt = lastT == null ? 0 : Math.max(0, Math.min(0.1, T - lastT));
  lastT = T;
  const bow = span(T, 33.2, 35.4);
  for (const [id, c] of Object.entries(CAST)) {
    const { x, v } = along(c.keys, T);
    if (x < -60 || x > 700) continue;
    const walking = Math.abs(v) > 4;
    const facing = walking ? Math.sign(v) : c.facing ?? 1;
    const a = anims[id];
    stepAnim(a, { vx: walking ? v : 0, vy: 0, onGround: true, rope: false, facing, y: 0 }, dt);
    let pose = walking ? 'walk' : 'idle';
    let progress = 0;
    // Encore throws her arms up on "...and SCENE!"; everyone still on stage bows after.
    if (id === 'encore' && T > 32.8 && T < 33.6) [pose, progress] = ['emcheer', span(T, 32.8, 33.6) * 0.5];
    if (id !== 'marlo' && bow > 0 && bow < 1) [pose, progress] = ['embow', bow];
    const talking = LINES.some(([a0, b0, who]) => who === id && T > a0 && T < b0);
    const npc = NPCS[id];
    withZoom(2, () => drawHero(ctx, { ...npc.look, face: c.face(T) }, castGear(id), x, FLOOR, { pose, progress, dur: 1, time, seed: id.length, scale: S, facing, talking }, pose === 'walk' || pose === 'idle' ? a : null));
    if (id === 'marlo') popcorn(ctx, x - 16, FLOOR - 30, time);
    if (id === 'tora' && T > 31.8 && T < 37) stars(ctx, x, FLOOR - 70, time);
  }
}

// A paper bag of popcorn held out in front, kernels hopping.
function popcorn(ctx, x, y, time) {
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#d8343a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 7, y - 10);
  ctx.lineTo(x + 7, y - 10);
  ctx.lineTo(x + 5, y + 6);
  ctx.lineTo(x - 5, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d8343a';
  for (const sx of [-4, 0, 4]) ctx.fillRect(x + sx - 0.8, y - 9, 1.6, 14);
  for (let i = 0; i < 5; i++) {
    const hop = Math.max(0, Math.sin(time * 5 + i * 1.7)) * 4;
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.arc(x - 5 + i * 2.5, y - 11 - hop * (i % 2), 2.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Knocked silly: little stars circling over the head.
function stars(ctx, x, y, time) {
  for (let i = 0; i < 3; i++) {
    const a = time * 4 + (i * Math.PI * 2) / 3;
    star(ctx, x + Math.cos(a) * 14, y + Math.sin(a) * 4, Math.sin(a) < 0 ? 2.5 : 3.5, '#ffe36b');
  }
}
function star(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

// A speech bubble over a speaker on the stage, the words typed out.
function stageSay(ctx, x, line, chars, name) {
  ctx.font = font(9, true);
  const w = Math.min(170, ctx.measureText(line).width + 18);
  const words = line.split(' ');
  const rows = [];
  let cur = '';
  for (const word of words) {
    const t = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(t).width > w - 16 && cur) {
      rows.push(cur);
      cur = word;
    } else cur = t;
  }
  rows.push(cur);
  const h = rows.length * 12 + 10;
  const bx = Math.max(62, Math.min(578 - w, x - w / 2));
  const by = FLOOR - 82 - h;
  ctx.fillStyle = 'rgba(40,20,60,0.25)';
  roundRect(ctx, bx + 2, by + 3, w, h, 9);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#5a3f7a';
  ctx.lineWidth = 1.6;
  roundRect(ctx, bx, by, w, h, 9);
  ctx.fill();
  ctx.stroke();
  const tx = Math.max(bx + 12, Math.min(bx + w - 12, x));
  ctx.beginPath();
  ctx.moveTo(tx - 5, by + h - 1);
  ctx.lineTo(tx, by + h + 8);
  ctx.lineTo(tx + 5, by + h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tx - 5, by + h);
  ctx.lineTo(tx, by + h + 8);
  ctx.lineTo(tx + 5, by + h);
  ctx.stroke();
  ctx.font = font(7, true);
  const nw = ctx.measureText(name).width + 10;
  ctx.fillStyle = '#ff8fc1';
  roundRect(ctx, bx + 7, by - 6, nw, 10, 5);
  ctx.fill();
  text(ctx, name, bx + 12, by + 1.5, { size: 7, bold: true, color: '#ffffff' });
  let left = chars;
  rows.forEach((r, i) => {
    text(ctx, r.slice(0, Math.max(0, left)), bx + 8, by + 15 + i * 12, { size: 9, bold: true, color: '#4a3560' });
    left -= r.length + 1;
  });
}

// ---------- The set ----------

// The painted meadow on its flat, and the generic name painted across it (drawn once: it's paint).
const PAINTED_W = 9000;
const PAINTED = (() => {
  const g = 300;
  const terrain = [[0, g]];
  for (let x = 400; x < PAINTED_W; x += 400) terrain.push([x, g - Math.round(8 * Math.sin(x * 0.0021))]);
  terrain.push([PAINTED_W, g]);
  return { ...MAPS.meadow1, id: 'title', width: PAINTED_W, height: 360, groundY: g, terrain, platforms: [], ropes: [], portals: [], spawns: [], npcs: [], deco: [] };
})();
let flat = null;
function flatArt(sc) {
  if (flat?.sc === sc) return flat.c;
  const c = document.createElement('canvas');
  c.width = Math.round(520 * sc);
  c.height = Math.round(266 * sc);
  const k = c.getContext('2d');
  k.setTransform(sc, 0, 0, sc, 0, 0);
  k.save();
  k.translate(-60, -34);
  drawSceneBack(k, PAINTED, { x: 300, y: 0 }, 640, 360, 2, null);
  k.restore();
  // The name in the plainest font there is, with a plain shadow: the most generic logo going.
  k.font = '34px "Times New Roman", serif';
  k.textAlign = 'center';
  k.fillStyle = 'rgba(0,0,0,0.25)';
  k.fillText(`${TITLE[0][0]}${TITLE[0].slice(1).toLowerCase()} ${TITLE[1][0]}${TITLE[1].slice(1).toLowerCase()}`, 262, 92);
  k.fillStyle = '#444444';
  k.fillText(`${TITLE[0][0]}${TITLE[0].slice(1).toLowerCase()} ${TITLE[1][0]}${TITLE[1].slice(1).toLowerCase()}`, 260, 90);
  k.font = 'italic 13px "Times New Roman", serif';
  k.fillText('An Adventure', 260, 110);
  flat = { sc, c };
  return c;
}

// The flat: standing, creaking, tipping over backwards, landing flat on the boards.
function drawFlat(ctx, T) {
  const sc = ctx.getTransform().a || 1;
  const fall = ease(span(T, 4, 4.85)) ** 1.6;
  const settle = T > 4.85 ? Math.abs(Math.sin(span(T, 4.85, 5.3) * Math.PI)) * 0.05 * (1 - span(T, 4.85, 5.3)) : 0;
  const a = (fall - settle) * Math.PI * 0.5;
  const creak = T < 4 ? Math.sin(T * 20) * 0.006 * span(T, 2.6, 3.8) : 0;
  const h = 266 * Math.cos(a);
  if (h < 2) {
    ctx.fillStyle = '#b08858';
    ctx.fillRect(60, FLOOR - 3, 520, 3);
    return;
  }
  ctx.save();
  ctx.translate(320, FLOOR);
  ctx.rotate(creak);
  ctx.transform(1, 0, 0, h / 266, 0, 0);
  ctx.drawImage(flatArt(sc), -260, -266, 520, 266);
  // It darkens as it tips away from the lights.
  ctx.fillStyle = `rgba(40,20,60,${0.5 * fall})`;
  ctx.fillRect(-260, -266, 520, 266);
  ctx.strokeStyle = '#b08858';
  ctx.lineWidth = 5;
  ctx.strokeRect(-260, -266, 520, 266);
  ctx.restore();
}

// The backstage behind it: a brick wall, ropes and sandbags, a ladder, crates, a costume rack, the
// stage door and a hanging work lamp, all swaying or flickering a little.
function drawBackstage(ctx, T, time) {
  ctx.fillStyle = '#3a2440';
  ctx.fillRect(0, 0, 640, FLOOR);
  for (let y = 36, row = 0; y < FLOOR; y += 16, row++) {
    for (let x = row % 2 ? -20 : 0; x < 640; x += 40) {
      ctx.fillStyle = (x * 7 + y * 3) % 5 ? '#4a2e4e' : '#523454';
      ctx.fillRect(x + 1, y + 1, 38, 14);
    }
  }
  // The stage door, its sign, a light over it.
  ctx.fillStyle = '#6a4030';
  ctx.fillRect(84, 196, 52, 104);
  ctx.strokeStyle = '#3a2020';
  ctx.lineWidth = 2;
  ctx.strokeRect(84, 196, 52, 104);
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath();
  ctx.arc(128, 250, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2a2440';
  roundRect(ctx, 80, 178, 60, 13, 3);
  ctx.fill();
  text(ctx, 'STAGE DOOR', 110, 188, { size: 7, bold: true, align: 'center', color: '#ffd66b' });
  // The costume rack: a rail on legs, outfits hanging and swaying.
  ctx.strokeStyle = '#8a8aa8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(160, FLOOR);
  ctx.lineTo(166, 214);
  ctx.lineTo(250, 214);
  ctx.lineTo(256, FLOOR);
  ctx.stroke();
  ['#ff8fc1', '#7fd3ff', '#ffd66b', '#9be08f', '#c9a6ff'].forEach((c, i) => {
    const sway = Math.sin(time * 1.4 + i) * 0.05;
    ctx.save();
    ctx.translate(176 + i * 17, 214);
    ctx.rotate(sway);
    ctx.fillStyle = c;
    ctx.strokeStyle = '#5a3f7a';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7, 4);
    ctx.lineTo(7, 4);
    ctx.lineTo(10, 40);
    ctx.lineTo(-10, 40);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  });
  // Crates, one stencilled PROPS, one FRAGILE (upside down).
  for (const [x, w, h, label, rot] of [[560, 56, 44, 'PROPS', 0], [586, 40, 34, 'FRAGILE', Math.PI]]) {
    const y = FLOOR - (x === 586 ? 44 + h : h);
    ctx.fillStyle = '#b07a4a';
    ctx.fillRect(x - w / 2, y, w, h);
    ctx.strokeStyle = '#5a3a2a';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y, w, h);
    ctx.save();
    ctx.translate(x, y + h / 2 + 3);
    ctx.rotate(rot);
    text(ctx, label, 0, rot ? -3 : 0, { size: 7, bold: true, align: 'center', color: '#5a3a2a' });
    ctx.restore();
  }
  // A ladder leaning on the wall.
  ctx.strokeStyle = '#c89a5a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(400, FLOOR);
  ctx.lineTo(440, 120);
  ctx.moveTo(424, FLOOR);
  ctx.lineTo(462, 122);
  ctx.stroke();
  ctx.lineWidth = 2;
  for (let k = 0.08; k < 1; k += 0.12) {
    ctx.beginPath();
    ctx.moveTo(400 + 40 * k, FLOOR - 180 * k);
    ctx.lineTo(424 + 38 * k, FLOOR - 178 * k);
    ctx.stroke();
  }
  // Ropes from the flies, and the fly rail's cleats on the wall.
  ctx.strokeStyle = '#c8a878';
  ctx.lineWidth = 1.5;
  for (const rx of [70, 600, 614]) {
    ctx.beginPath();
    ctx.moveTo(rx, 30);
    ctx.quadraticCurveTo(rx + Math.sin(time * 0.9 + rx) * 4, 160, rx + 2, 250);
    ctx.stroke();
  }
  // The work lamp: a bulb on a cord, swinging, with its light on the wall.
  const swing = Math.sin(time * 1.1) * 0.12;
  const lx = 300 + Math.sin(swing) * 70;
  const ly = 30 + Math.cos(swing) * 70;
  ctx.strokeStyle = '#2a2440';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(300, 30);
  ctx.lineTo(lx, ly);
  ctx.stroke();
  const flick = 0.85 + 0.15 * Math.sin(time * 23) * Math.sin(time * 7);
  const g = ctx.createRadialGradient(lx, ly, 2, lx, ly, 120);
  g.addColorStop(0, `rgba(255,236,170,${0.35 * flick})`);
  g.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = g;
  ctx.fillRect(lx - 120, ly - 120, 240, 240);
  ctx.fillStyle = '#fff3c0';
  ctx.beginPath();
  ctx.arc(lx, ly + 4, 5, 0, Math.PI * 2);
  ctx.fill();
}

// The floor: stage boards, and the footlights along the front edge.
function drawFloor(ctx, time) {
  ctx.fillStyle = '#7a4a2a';
  ctx.fillRect(0, FLOOR, 640, 60);
  ctx.fillStyle = '#9a6a3a';
  for (let x = 0; x < 640; x += 46) ctx.fillRect(x, FLOOR, 44, 3);
  ctx.strokeStyle = 'rgba(60,30,20,0.4)';
  ctx.lineWidth = 1;
  for (let y = FLOOR + 14; y < 350; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2020';
  ctx.fillRect(0, 344, 640, 16);
  for (let x = 30; x < 640; x += 48) {
    const glow = 0.7 + 0.3 * Math.sin(time * 2 + x);
    const g = ctx.createRadialGradient(x, 344, 0, x, 344, 16);
    g.addColorStop(0, `rgba(255,230,160,${0.6 * glow})`);
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 16, 328, 32, 32);
    ctx.fillStyle = '#fff3c0';
    ctx.beginPath();
    ctx.arc(x, 345, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The curtains and the valance: closed at first, drawn open over the opening seconds, swaying.
function drawProscenium(ctx, T, time) {
  const open = ease(span(T, 0.3, 1.8));
  const w = 58 + 262 * (1 - open);
  for (const side of [-1, 1]) {
    const x0 = side < 0 ? 0 : 640 - w;
    const folds = 7;
    for (let i = 0; i < folds; i++) {
      const fw = w / folds;
      const x = x0 + i * fw;
      const sway = Math.sin(time * 1.2 + i * 0.8) * 2;
      const g = ctx.createLinearGradient(x, 0, x + fw, 0);
      g.addColorStop(0, '#7a1430');
      g.addColorStop(0.5, '#d83a5a');
      g.addColorStop(1, '#7a1430');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + fw + 0.5, 0);
      ctx.quadraticCurveTo(x + fw + sway, 200, x + fw + sway * 2, 360);
      ctx.lineTo(x + sway * 2, 360);
      ctx.quadraticCurveTo(x + sway, 200, x, 0);
      ctx.fill();
    }
    // A gold tie-back once they're open.
    if (open > 0.9) {
      const tx = side < 0 ? w - 6 : 640 - w + 6;
      ctx.fillStyle = '#ffd66b';
      ctx.beginPath();
      ctx.ellipse(tx, 210, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#b02848';
  ctx.fillRect(0, 0, 640, 26);
  for (let x = 0; x < 640; x += 40) {
    ctx.beginPath();
    ctx.arc(x + 20, 26, 20, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd66b';
  ctx.fillRect(0, 24, 640, 3);
  for (let x = 0; x < 640; x += 40) {
    ctx.beginPath();
    ctx.arc(x + 20, 47, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- The logo: toy blocks on ropes ----------

const BLOCK = ['#ff8fc1', '#7fd3ff', '#ffd66b', '#9be08f', '#c9a6ff', '#ff9e7a'];
export function drawBlock(ctx, ch, x, y, rot, s = 34, i = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = 'rgba(40,20,60,0.3)';
  roundRect(ctx, -s / 2 + 2, -s / 2 + 3, s, s, 7);
  ctx.fill();
  ctx.fillStyle = BLOCK[i % BLOCK.length];
  ctx.strokeStyle = '#5a3f7a';
  ctx.lineWidth = 2;
  roundRect(ctx, -s / 2, -s / 2, s, s, 7);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  roundRect(ctx, -s / 2 + 3, -s / 2 + 3, s - 6, s * 0.28, 4);
  ctx.fill();
  ctx.font = font(s * 0.68, true);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#5a3f7a';
  ctx.strokeText(ch, 0, 1.5);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(ch, 0, 1.5);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();
}
const SIZES = [36, 30];
const ROW_Y = [86, 140];
const home = (row, i) => {
  const s = SIZES[row];
  const n = TITLE[row].length;
  return { x: 320 + (i - (n - 1) / 2) * (s + 5), y: ROW_Y[row] };
};
// Where the cart carries the second word, in the wrong order (ISNALD), and when it gets fixed.
const WRONG = [0, 1, 4, 3, 2, 5];
function cartSlot(slot, cartX) {
  return { x: cartX - 75 + slot * 30, y: FLOOR - 62 };
}

// Every letter's spot at time T (for drawing, and for the letter thief).
function letterSpots(T, time) {
  const out = [];
  const cart = along(CART, T).x;
  TITLE.forEach((word, row) => {
    [...word].forEach((ch, i) => {
      const h = home(row, i);
      const sway = Math.sin(time * 1.3 + i * 0.9 + row) * 0.05;
      let { x, y } = h;
      let rot = sway;
      let rope = true;
      if (row === 0) {
        // Lowered from the flies one by one, settling with a bounce; the W comes down upside down
        // and gets spun the right way up on "Upside. DOWN."
        const u = spring(span(T, 13 + i * 0.28, 13.9 + i * 0.28));
        y = -60 + (h.y + 60) * u;
        if (i === 0) rot += Math.PI * (1 + ease(span(T, 16.5, 16.95)));
      } else {
        // On the cart, in the wrong order; N and L hop over each other; then each hops up to its rope.
        const slot = WRONG.indexOf(i);
        const from = cartSlot(slot, cart);
        const fixed = cartSlot(i, cart);
        const sw = span(T, 24.9, 25.5);
        let cx = from.x + (fixed.x - from.x) * ease(sw);
        let cy = from.y - Math.sin(sw * Math.PI) * (i === 2 ? 34 : i === 4 ? 18 : 0);
        const up = span(T, 25.7 + i * 0.16, 26.25 + i * 0.16);
        x = cx + (h.x - cx) * ease(up);
        y = cy + (h.y - cy) * up - Math.sin(up * Math.PI) * 40;
        rot = up < 1 ? Math.sin(up * Math.PI) * 0.6 : sway;
        rope = up >= 1;
      }
      out.push({ ch, row, i, x, y, rot, rope, s: SIZES[row] });
    });
  });
  return out;
}

function drawLogo(ctx, spots, T, time) {
  spots.forEach((sp, k) => {
    if (k === logoTheft.letter) return;
    if (sp.rope && sp.y > -40) {
      ctx.strokeStyle = '#c8a878';
      ctx.lineWidth = 1.2;
      const top = sp.y - sp.s / 2;
      for (const dx of [-sp.s / 4, sp.s / 4]) {
        ctx.beginPath();
        ctx.moveTo(sp.x + dx * 0.6, 26);
        ctx.lineTo(sp.x + dx * Math.cos(sp.rot) + Math.sin(sp.rot) * sp.s * 0.5, top + 1);
        ctx.stroke();
      }
    }
    drawBlock(ctx, sp.ch, sp.x, sp.y, sp.rot, sp.s, k);
  });
  // The stolen letter, thrown back from the wings: it drops into its slot with a bounce.
  const gone = logoTheft.letter;
  if (gone >= 0 && logoTheft.back != null) {
    const sp = spots[gone];
    const u = clamp((time - logoTheft.back) / 0.9);
    if (u > 0) {
      const fall = u < 0.6 ? (u / 0.6) ** 2 : 1 - Math.abs(Math.sin(((u - 0.6) / 0.4) * Math.PI)) * 0.12;
      drawBlock(ctx, sp.ch, sp.x, -40 + (sp.y + 40) * fall, (1 - u) * 6, sp.s, gone);
    }
  }
}

// ---------- The rest of the stagecraft ----------

// The pull cart Pip wheels in, the Bud Snail riding on top like it owns it.
const rider = { def: MOBS.snailbun, hp: 10, maxHp: 10, state: 'idle', stagger: 0, dir: 1, x: 0, y: 0, uid: 77, flash: 0, air: 0, frozenUntil: 0, phase: 0 };
function drawCart(ctx, T, time) {
  const { x, v } = along(CART, T);
  if (x < -120) return;
  const roll = (x / 11) % (Math.PI * 2);
  ctx.fillStyle = '#b07a4a';
  ctx.strokeStyle = '#5a3a2a';
  ctx.lineWidth = 2;
  roundRect(ctx, x - 92, FLOOR - 46, 184, 26, 4);
  ctx.fill();
  ctx.stroke();
  for (const wx of [x - 62, x + 62]) {
    ctx.fillStyle = '#8a5a3a';
    ctx.beginPath();
    ctx.arc(wx, FLOOR - 12, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffd66b';
    ctx.beginPath();
    ctx.moveTo(wx + Math.cos(roll) * 10, FLOOR - 12 + Math.sin(roll) * 10);
    ctx.lineTo(wx - Math.cos(roll) * 10, FLOOR - 12 - Math.sin(roll) * 10);
    ctx.stroke();
    ctx.strokeStyle = '#5a3a2a';
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 92, FLOOR - 38);
  ctx.lineTo(x - 112, FLOOR - 44);
  ctx.stroke();
  rider.state = Math.abs(v) > 4 ? 'walk' : 'idle';
  rider.x = x + 60;
  drawMonster(ctx, rider, x + 70, FLOOR - 46, time, time);
}

// The big WHUMP: a dust cloud rolling out along the boards.
function drawDust(ctx, T) {
  const u = span(T, 4.85, 6.2);
  if (u <= 0 || u >= 1) return;
  for (let i = 0; i < 14; i++) {
    const dir = i % 2 ? 1 : -1;
    const x = 320 + dir * (40 + i * 18) * (0.3 + u);
    const y = FLOOR - 6 - Math.sin(i * 1.7) * 8 - u * 20;
    ctx.fillStyle = `rgba(230,210,200,${0.55 * (1 - u)})`;
    ctx.beginPath();
    ctx.arc(x, y, 8 + u * 16 + (i % 3) * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The sandbag over Tora's spot: hanging, then the rope gives, it drops on the head and rolls off.
function drawSandbag(ctx, T, time) {
  const x0 = 512;
  let x = x0 + Math.sin(time * 1.1) * 3;
  let y = 70;
  let rot = Math.sin(time * 1.1) * 0.08;
  const drop = span(T, 31.5, 31.8);
  const roll = span(T, 31.8, 32.5);
  if (drop > 0) {
    y = 70 + (FLOOR - 76 - 70) * drop * drop;
    if (roll > 0) {
      x = x0 + roll * 34;
      y = FLOOR - 76 + (64 * roll) - Math.sin(roll * Math.PI) * 24;
      rot = roll * 3;
    }
  }
  if (drop <= 0) {
    ctx.strokeStyle = '#c8a878';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x0, 26);
    ctx.lineTo(x, y - 12);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#d8b88a';
  ctx.strokeStyle = '#7a5a3a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, -10);
  ctx.lineTo(5, -10);
  ctx.stroke();
  text(ctx, '10t', 0, 3, { size: 6, bold: true, align: 'center', color: '#7a5a3a' });
  ctx.restore();
}

// Where the spotlight points: on whoever's yelling, the logo, the cart, a search, then Marlo, then
// Tora's sandbag, then the whole cast. Its beam and pool are drawn over a dimmed stage.
function spotAt(T) {
  if (T < 5.2) return null;
  if (T < 12) return { x: along(CAST.encore.keys, T).x, w: 60 };
  if (T < 17) return { x: 320, w: 110 };
  if (T < 25.6) return { x: along(CART, T).x, w: 110 };
  if (T < 28.6) return { x: 320 + Math.sin((T - 25.6) * 2.4) * 220, w: 60 };
  if (T < 31.4) return { x: 570, w: 60 };
  if (T < 32.6) return { x: 512, w: 50 };
  return { x: 320, w: 280 };
}
let spotX = 320;
let spotW = 60;
function drawLights(ctx, T) {
  const s = spotAt(T);
  if (!s) return;
  // The stage lights come up for the bow.
  const dim = 0.32 * (1 - span(T, 32.6, 34));
  spotX += (s.x - spotX) * 0.12;
  spotW += (s.w - spotW) * 0.1;
  if (dim > 0.01) {
    ctx.fillStyle = `rgba(20,8,30,${dim})`;
    ctx.fillRect(0, 0, 640, 360);
  }
  // The beam and its pool: a soft warm light, fading out once the stage lights are up.
  const on = 1 - span(T, 33.4, 34.6);
  if (on <= 0) return;
  ctx.save();
  ctx.globalAlpha = on;
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, 'rgba(255,244,210,0.02)');
  g.addColorStop(1, 'rgba(255,244,210,0.12)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(320 - 8, 0);
  ctx.lineTo(320 + 8, 0);
  ctx.lineTo(spotX + spotW, FLOOR);
  ctx.lineTo(spotX - spotW, FLOOR);
  ctx.fill();
  const p = ctx.createRadialGradient(spotX, FLOOR, 0, spotX, FLOOR, spotW);
  p.addColorStop(0, 'rgba(255,244,210,0.32)');
  p.addColorStop(1, 'rgba(255,244,210,0)');
  ctx.fillStyle = p;
  ctx.beginPath();
  ctx.ellipse(spotX, FLOOR, spotW, spotW * 0.22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// The "Press any key" board, lowered on its ropes for the finale; it keeps changing its mind.
const PRESS = ['Press any key', 'Press any key. Not that one.', 'Press the Any key', 'Press any key (we believe in you)', 'Still waiting. Press any key.'];
function drawBoard(ctx, T, time) {
  const u = spring(span(T, 34.4, 35.4));
  if (u <= 0) return;
  const ask = PRESS[Math.floor(time / 5) % PRESS.length];
  ctx.font = font(11, true);
  const w = ctx.measureText(ask).width + 28;
  const y = -30 + (196 + 30) * u;
  const rot = Math.sin(time * 1.6) * 0.02;
  ctx.save();
  ctx.translate(320, y);
  ctx.rotate(rot);
  ctx.strokeStyle = '#c8a878';
  ctx.lineWidth = 1.2;
  for (const dx of [-w / 2 + 10, w / 2 - 10]) {
    ctx.beginPath();
    ctx.moveTo(dx, -y + 26);
    ctx.lineTo(dx, -10);
    ctx.stroke();
  }
  const pulse = 0.85 + 0.15 * Math.sin(time * 3);
  ctx.fillStyle = '#d9a46c';
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 2;
  roundRect(ctx, -w / 2, -12, w, 24, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff8f2';
  roundRect(ctx, -w / 2 + 4, -9, w - 8, 18, 6);
  ctx.fill();
  ctx.globalAlpha = pulse;
  text(ctx, ask, 0, 4, { size: 11, bold: true, align: 'center', color: '#b062c8' });
  ctx.restore();
}

// Tonight's playbill on the wall, with a fresh joke each time the page loads.
function drawPlaybill(ctx, quote, time) {
  const flap = Math.sin(time * 1.7) * 0.03;
  ctx.save();
  ctx.translate(112, 96);
  ctx.rotate(-0.05 + flap);
  ctx.fillStyle = 'rgba(20,8,30,0.35)';
  ctx.fillRect(-36 + 2, -2 + 3, 72, 92);
  ctx.fillStyle = '#fff3d8';
  ctx.fillRect(-36, -2, 72, 92);
  ctx.fillStyle = '#d83a5a';
  ctx.fillRect(-36, -2, 72, 16);
  text(ctx, 'TONIGHT', 0, 9, { size: 8, bold: true, align: 'center', color: '#ffffff' });
  ctx.font = font(7, true);
  const words = quote.split(' ');
  let line = '';
  let y = 24;
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (ctx.measureText(t).width > 62 && line) {
      text(ctx, line, 0, y, { size: 7, bold: true, align: 'center', color: '#5a3f7a' });
      line = w;
      y += 9;
    } else line = t;
  }
  text(ctx, line, 0, y, { size: 7, bold: true, align: 'center', color: '#5a3f7a' });
  ctx.fillStyle = '#c8a878';
  ctx.beginPath();
  ctx.arc(0, 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------- The show ----------

let start = null;
// Draws the show at `time` and returns { letters, settled, skipped }: the logo's letters (for the
// thief), whether it's over, and whether this frame's key press was spent skipping it.
export function drawShow(ctx, time, quote, skip) {
  if (start == null) start = time;
  let skipped = false;
  if (skip && time - start < END) {
    start = time - END;
    skipped = true;
    for (const id of Object.keys(anims)) anims[id] = createAnim();
  }
  const T = time - start;
  // Sound cues as they happen.
  cue(T);
  // A shake on the WHUMP and on the sandbag.
  const shake = Math.max(0, 1 - Math.abs(T - 4.95) / 0.35) * 5 + Math.max(0, 1 - Math.abs(T - 31.85) / 0.25) * 3;
  ctx.save();
  if (shake > 0) ctx.translate(Math.sin(time * 70) * shake, Math.cos(time * 53) * shake * 0.6);
  drawBackstage(ctx, T, time);
  drawPlaybill(ctx, quote, time);
  // (The sandbag hangs behind the painted scenery until that's down, then in front of the cast.)
  if (T < 6) drawSandbag(ctx, T, time);
  drawFloor(ctx, time);
  drawFlat(ctx, T);
  drawDust(ctx, T);
  const letters = letterSpots(T, time);
  // The cart and the second word ride under the first word's ropes.
  drawCart(ctx, T, time);
  drawLogo(ctx, letters, T, time);
  drawCast(ctx, T, time);
  if (T >= 6) drawSandbag(ctx, T, time);
  drawLights(ctx, T);
  drawBoard(ctx, T, time);
  if (T > 4.85 && T < 5.9) whump(ctx, T);
  for (const [a, b, who, line] of LINES) {
    if (T > a && T < b) stageSay(ctx, along(CAST[who].keys, T).x, line, Math.floor((T - a) * 30), NPCS[who].name);
  }
  ctx.restore();
  drawProscenium(ctx, T, time);
  return { letters, settled: T >= END, skipped };
}

function whump(ctx, T) {
  const u = span(T, 4.85, 5.9);
  ctx.save();
  ctx.translate(320, 200 - u * 10);
  ctx.rotate(-0.08);
  ctx.scale(1 + spring(u * 2) * 0.2, 1 + spring(u * 2) * 0.2);
  ctx.globalAlpha = 1 - span(T, 5.5, 5.9);
  ctx.font = font(40, true);
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#5a3f7a';
  ctx.strokeText('WHUMP', 0, 0);
  ctx.fillStyle = '#ffd66b';
  ctx.fillText('WHUMP', 0, 0);
  ctx.restore();
}

const CUES = [[0.3, 'open'], [4.85, 'land'], [4.9, 'poof'], [13, 'swing'], [16.5, 'bellbonk'], [25, 'jump'], [25.7, 'jump'], [26.4, 'pickup'], [29, 'coin'], [31.8, 'bellbonk'], [33.2, 'levelup']];
let cued = -1;
function cue(T) {
  for (let i = cued + 1; i < CUES.length && CUES[i][0] <= T; i++) {
    // (Skipped past, nothing plays: no pile of sounds at once.)
    if (T - CUES[i][0] < 0.3) sfx(CUES[i][1]);
    cued = i;
  }
}
