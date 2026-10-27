// Buff effects: every buff skill has a look of its own while it's active (drawn behind and in
// front of the hero, even while moving), and a cast moment when it goes up: a burst shaped for the
// skill, with its name popping over your head. Everything is drawn from time alone.

import { haloStroke } from './fxkit.js';
import { font } from '../ui/kit.js';
import { SKILLS } from '../data/skills.js';
import { groundRing, pillarOf, ringOf } from './warrior-fx.js';
import { fxSprite } from './fx-sprites.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function glow(ctx, x, y, r, color, a) {
  if (a <= 0 || r <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
  ctx.restore();
}

function star(ctx, x, y, r, color, a, points = 4) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const ang = (i / (points * 2)) * TAU - Math.PI / 2;
    const rr = i % 2 ? r * 0.35 : r;
    ctx.lineTo(x + Math.cos(ang) * rr, y + Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function ring(ctx, x, y, rx, ry, color, width, a) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU);
  ctx.stroke();
  ctx.restore();
}

// Motes rising off the body.
function motes(ctx, x, y, t, a, { n = 6, spread = 14, height = 44, speed = 0.7, color = '#ffffff', size = 1.4, seed = 0 }) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const u = (t * speed + hash(i + seed)) % 1;
    ctx.globalAlpha = a * Math.sin(u * Math.PI);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x + (hash(i * 3 + seed) - 0.5) * 2 * spread + Math.sin(t * 2 + i) * 2, y - u * height, size * (1 - u * 0.4), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// Things circling the body; `front` picks the near half of the orbit.
function orbit(ctx, x, y, t, { n = 3, rx = 18, ry = 5, speed = 2, draw }, front) {
  for (let i = 0; i < n; i++) {
    const ang = t * speed + (i / n) * TAU;
    const z = Math.sin(ang);
    if ((z >= 0) !== front) continue;
    draw(x + Math.cos(ang) * rx, y + z * ry, 0.8 + z * 0.2, i, ang);
  }
}

// Speed lines streaming off behind the heels.
function speedLines(ctx, x, y, t, dir, a, color, n = 4) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const u = (t * 2.2 + i / n) % 1;
    const ly = y - 4 - i * 9;
    ctx.globalAlpha = a * (1 - u) * 0.85;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x - dir * (8 + u * 10), ly);
    ctx.lineTo(x - dir * (18 + u * 18), ly);
    ctx.stroke();
  }
  ctx.restore();
}

// The little anime anger mark: four curved strokes in a cross.
function angerMark(ctx, x, y, r, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  // Four bent corners pointing in at a cross-shaped gap, outlined in white so it pops.
  const g = r * 0.28;
  for (const [color, width] of [['#ffffff', r * 0.95], ['#ff2a3a', r * 0.5]]) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath();
      ctx.moveTo(x + sx * g, y + sy * r);
      ctx.quadraticCurveTo(x + sx * g * 0.6, y + sy * g * 0.6, x + sx * r, y + sy * g);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function clover(ctx, x, y, r, rot, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#5fc84a';
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i / 4) * TAU);
    ctx.beginPath();
    ctx.arc(-r * 0.32, -r * 0.5, r * 0.42, 0, TAU);
    ctx.arc(r * 0.32, -r * 0.5, r * 0.42, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#9be86b';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.25, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#3f9a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(r * 0.4, r * 0.8, r * 0.2, r * 1.3);
  ctx.stroke();
  ctx.restore();
}

function gear(ctx, x, y, r, rot, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * TAU;
    const rr = i % 2 ? r : r * 0.78;
    ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.35, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function miniBlade(ctx, x, y, len, rot, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  glow(ctx, 0, 0, len, color, 0.5);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.lineTo(len * 0.18, len * 0.2);
  ctx.lineTo(-len * 0.18, len * 0.2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.fillRect(-len * 0.35, len * 0.2, len * 0.7, len * 0.12);
  ctx.restore();
}

function shuriken(ctx, x, y, r, rot, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * TAU;
    const rr = i % 2 ? r * 0.3 : r;
    ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.18, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function cross(ctx, x, y, r, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.fillRect(x - r * 0.22, y - r, r * 0.44, r * 2);
  ctx.fillRect(x - r * 0.7, y - r * 0.45, r * 1.4, r * 0.44);
  ctx.restore();
}

function rune(ctx, x, y, r, i, color, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  const kind = i % 3;
  if (kind === 0) {
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
    ctx.moveTo(x, y - r * 0.3);
    ctx.lineTo(x + r * 0.7, y - r);
  } else if (kind === 1) {
    ctx.moveTo(x - r * 0.6, y + r);
    ctx.lineTo(x, y - r);
    ctx.lineTo(x + r * 0.6, y + r);
    ctx.moveTo(x - r * 0.3, y);
    ctx.lineTo(x + r * 0.3, y);
  } else {
    ctx.arc(x, y, r * 0.6, 0, TAU);
    ctx.moveTo(x, y - r);
    ctx.lineTo(x, y + r);
  }
  ctx.stroke();
  ctx.restore();
}

// A sweeping glint passing down over the body.
function sheen(ctx, x, y, t, color, a, period = 2.2) {
  const u = (t % period) / period;
  if (u > 0.4) return;
  const k = u / 0.4;
  ctx.save();
  ctx.globalAlpha = a * Math.sin(k * Math.PI) * 0.8;
  ctx.fillStyle = color;
  const gy = y - 48 + k * 50;
  ctx.beginPath();
  ctx.moveTo(x - 12, gy);
  ctx.lineTo(x + 12, gy - 6);
  ctx.lineTo(x + 12, gy - 3);
  ctx.lineTo(x - 12, gy + 3);
  ctx.fill();
  ctx.restore();
}

function eyeSigil(ctx, x, y, r, color, a, t) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(255,251,224,0.8)';
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x, y - r * 0.8, x + r, y);
  ctx.quadraticCurveTo(x, y + r * 0.8, x - r, y);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - r, y);
  ctx.quadraticCurveTo(x, y - r * 0.8, x + r, y);
  ctx.quadraticCurveTo(x, y + r * 0.8, x - r, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + Math.sin(t * 1.3) * r * 0.2, y, r * 0.3, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// Each buff: its color, how it bursts when cast, and what it draws while active.
// back/front(ctx, x, y, t, dir, a) — (x, y) the hero's feet on screen, a the strength (0-1).
export const BUFF_LOOKS = {
  quickstep: {
    color: '#9fe8c8', cast: 'gust',
    back: (ctx, x, y, t, dir, a) => windSwirl(ctx, x, y - 3, t, a, '#9fe8c8', false),
    front: (ctx, x, y, t, dir, a) => {
      // A little whirl of wind around the ankles, sparkles kicking up.
      windSwirl(ctx, x, y - 3, t, a, '#e8fff4', true);
      speedLines(ctx, x, y, t, dir, a, '#c9f6e0', 3);
      star(ctx, x - dir * 6, y - 2, 2.5, '#ffffff', a * (0.5 + 0.5 * Math.sin(t * 9)));
    },
  },
  ironguard: {
    color: '#9fd2ff', cast: 'converge',
    back: (ctx, x, y, t, dir, a) => {
      glow(ctx, x, y - 24, 30, '#cfd8e8', a * 0.6);
      orbit(ctx, x, y - 26, t, { n: 4, rx: 15, ry: 18, speed: 0.8, draw: (px, py) => {
        ctx.save();
        ctx.globalAlpha = a * 0.6;
        ctx.fillStyle = '#b8c2d6';
        ctx.fillRect(px - 3.5, py - 4.5, 7, 9);
        ctx.restore();
      } }, false);
    },
    front: (ctx, x, y, t, dir, a) => {
      // Steel plates bolted to the air around you, and a metal sheen sweeping down.
      orbit(ctx, x, y - 26, t, { n: 4, rx: 15, ry: 18, speed: 0.8, draw: (px, py, z) => {
        ctx.save();
        ctx.globalAlpha = a * z;
        ctx.fillStyle = '#eef2f8';
        ctx.strokeStyle = '#6d7487';
        ctx.lineWidth = 1;
        ctx.fillRect(px - 4, py - 5, 8, 10);
        ctx.strokeRect(px - 4, py - 5, 8, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px - 3, py - 4, 2, 6);
        ctx.fillStyle = '#8d96a8';
        ctx.fillRect(px - 0.5, py - 0.5, 1, 1);
        ctx.restore();
      } }, true);
      sheen(ctx, x, y, t, '#ffffff', a);
    },
  },
  manashield: {
    color: '#9fb8ff', cast: 'converge',
    back: (ctx, x, y, t, dir, a) => {
      glow(ctx, x, y - 24, 30, '#9fb8ff', a * 0.35);
      orbit(ctx, x, y - 24, t, { n: 6, rx: 20, ry: 22, speed: 1.2, draw: (px, py, z, i) => rune(ctx, px, py, 3, i, '#c9d6ff', a * 0.6) }, false);
    },
    front: (ctx, x, y, t, dir, a) => {
      // Arcane runes turning around you on a ring of mana.
      ring(ctx, x, y - 24, 20, 22, '#9fb8ff', 1, a * (0.35 + 0.15 * Math.sin(t * 3)));
      orbit(ctx, x, y - 24, t, { n: 6, rx: 20, ry: 22, speed: 1.2, draw: (px, py, z, i) => rune(ctx, px, py, 3.5, i, '#ffffff', a * 0.9) }, true);
    },
  },
  huntersfocus: {
    color: '#ffc94a', cast: 'shine',
    front: (ctx, x, y, t, dir, a) => {
      // A golden hawk's eye watching from over your head, blinking now and then.
      const blink = (t % 3.5) < 0.12 ? 0.2 : 1;
      glow(ctx, x, y - 62, 16, '#ffe36b', a * 0.8);
      eyeSigil(ctx, x, y - 62, 10, '#ffb020', a, t);
      if (blink < 1) ring(ctx, x, y - 62, 10, 1, '#ffb020', 2, a);
      if ((t % 1.6) < 0.2) star(ctx, x + dir * 8, y - 42, 3, '#ffffff', a);
    },
  },
  // The Mage's Bloom Barrier: a bud of petals curled round her, faint, until it bursts.
  bloombarrier: {
    color: '#ffa6cc', cast: 'converge',
    front: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celbudshield', x, y + 4, { t, scale: 0.42, alpha: a * 0.55 }),
  },
  // The Assassin's: Poisoned Blade drips crimson round her feet; Vanish is drawn on the hero (she
  // fades to a shadow). The Night Lord's Shadow Shuriken: shadow stars turning round him.
  poisonblade: {
    color: '#ff5c7e', cast: 'shine',
    back: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celringcrimson', x, y, { frame: 2, scale: 0.3, sy: 0.32, alpha: a * 0.55 }),
  },
  vanish: { color: '#d6d0e6', cast: 'gust' },
  shadowshuriken: {
    color: '#8e96ff', cast: 'shine',
    front: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celstuckstar', x + Math.cos(t * 4) * 16, y - 26 + Math.sin(t * 4) * 6, { t, scale: 0.4, alpha: a * 0.8 }),
  },
  quickhaste: {
    color: '#b89cff', cast: 'gust',
    // A faint violet ring at the feet and streaks of shadow peeling off behind (Tengu's own art).
    back: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celringshadow', x, y, { frame: 2, scale: 0.32, sy: 0.32, alpha: a * 0.6 }),
    front: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celstreakshadow', x - dir * 22, y - 10, { frame: Math.floor(t * 10) % 2, flip: dir < 0, scale: 0.3, alpha: a * 0.75 }),
  },
  rage: {
    color: '#ff5a4a', cast: 'burst',
    back: (ctx, x, y, t, dir, a) => {
      // Furious red flames licking up off your body.
      glow(ctx, x, y - 24, 30, '#ff3a2a', a * (0.35 + 0.15 * Math.sin(t * 8)));
      for (let i = 0; i < 7; i++) {
        const fx = x + (i - 3) * 5;
        const h = 24 + Math.sin(t * 11 + i * 2) * 7 + (i === 3 ? 12 : 0);
        ctx.save();
        ctx.globalAlpha = a * 0.85;
        ctx.fillStyle = i % 2 ? '#ff5a3a' : '#ff9a4a';
        ctx.beginPath();
        ctx.moveTo(fx - 4, y - 8);
        ctx.quadraticCurveTo(fx + Math.sin(t * 7 + i) * 3, y - 8 - h * 1.4, fx + 4, y - 8);
        ctx.fill();
        ctx.restore();
      }
    },
    front: (ctx, x, y, t, dir, a) => {
      // And the anime anger mark throbbing by your head.
      const pulse = 1 + Math.max(0, Math.sin(t * 7)) * 0.25;
      angerMark(ctx, x + dir * 13, y - 52, 4.5 * pulse, a);
    },
  },
  ironwill: {
    color: '#7fb8ff', cast: 'pillar',
    back: (ctx, x, y, t, dir, a) => glow(ctx, x, y - 26, 34, '#7fb8ff', a * 0.55),
    front: (ctx, x, y, t, dir, a) => {
      // Chevrons of blue willpower rising up through you.
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.7 + i / 3) % 1;
        const cy = y - 6 - u * 46;
        ctx.save();
        ctx.globalAlpha = a * Math.sin(u * Math.PI);
        ctx.strokeStyle = '#dff0ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 13, cy + 6);
        ctx.lineTo(x, cy);
        ctx.lineTo(x + 13, cy + 6);
        haloStroke(ctx, '#7fb8ff');
        ctx.restore();
      }
    },
  },
  bulwark: {
    color: '#e0a96b', cast: 'slam',
    back: (ctx, x, y, t, dir, a) => {
      orbit(ctx, x, y - 6, t, { n: 4, rx: 20, ry: 5, speed: 0.9, draw: (px, py, z) => stone(ctx, px, py, 4.5 * z, a * 0.8) }, false);
    },
    front: (ctx, x, y, t, dir, a) => {
      // Stone slabs grinding round your legs like a wall, dust trickling.
      orbit(ctx, x, y - 6, t, { n: 4, rx: 20, ry: 5, speed: 0.9, draw: (px, py, z) => stone(ctx, px, py, 4.5 * z, a) }, true);
      motes(ctx, x, y, t, a * 0.6, { n: 4, spread: 18, height: 14, speed: 0.6, color: '#e0c49b', size: 1.2, seed: 5 });
    },
  },
  bladeaura: {
    color: '#bfe0ff', cast: 'blades',
    back: (ctx, x, y, t, dir, a) => {
      glow(ctx, x, y - 26, 34, '#8fd3ff', a * 0.4);
      orbit(ctx, x, y - 26, t, { n: 3, rx: 22, ry: 8, speed: 3, draw: (px, py, z, i, ang) => miniBlade(ctx, px, py, 6, ang + Math.PI, '#8fd3ff', a * 0.6) }, false);
    },
    front: (ctx, x, y, t, dir, a) => {
      // Three spectral blades whirling around you, ringing with light.
      orbit(ctx, x, y - 26, t, { n: 3, rx: 22, ry: 8, speed: 3, draw: (px, py, z, i, ang) => miniBlade(ctx, px, py, 7, ang + Math.PI, '#8fd3ff', a) }, true);
    },
  },
  dragonblood: {
    color: '#ff4a4a', cast: 'roar',
    back: (ctx, x, y, t, dir, a) => {
      // A heartbeat of dragon blood: the glow throbs red twice a second.
      const beat = Math.max(0, Math.sin(t * 7)) ** 3;
      glow(ctx, x, y - 26, 28 + beat * 10, '#ff2a3a', a * (0.3 + beat * 0.35));
    },
    front: (ctx, x, y, t, dir, a) => {
      const beat = Math.max(0, Math.sin(t * 7)) ** 3;
      ring(ctx, x, y - 26, 16 + beat * 12, 20 + beat * 14, '#ff5a5a', 1.5, a * beat * 0.8);
      motes(ctx, x, y, t, a, { n: 7, spread: 14, height: 50, speed: 0.8, color: '#ffb35a', size: 1.2, seed: 11 });
      // Glowing draconic slit pupils over the eyes.
      ctx.save();
      ctx.globalAlpha = a * (0.6 + beat * 0.4);
      ctx.fillStyle = '#ffe36b';
      ctx.fillRect(x + dir * 2 - 0.5, y - 38, 1, 3);
      ctx.restore();
    },
  },
  holyaegis: {
    color: '#ffe36b', cast: 'dome',
    back: (ctx, x, y, t, dir, a) => {
      const g = ctx.createRadialGradient(x, y - 26, 10, x, y - 26, 32);
      g.addColorStop(0, 'rgba(255,246,201,0)');
      g.addColorStop(1, 'rgba(255,227,107,0.35)');
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y - 24, 26, 32, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    },
    front: (ctx, x, y, t, dir, a) => {
      // A golden shield bubble with light rippling over its surface.
      ring(ctx, x, y - 24, 26, 32, '#ffe36b', 1.5, a * 0.8);
      const u = (t * 0.6) % 1;
      ctx.save();
      ctx.globalAlpha = a * Math.sin(u * Math.PI) * 0.8;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y - 24, 26 * Math.sin(u * Math.PI), 32, 0, -Math.PI / 2, Math.PI / 2);
      ctx.stroke();
      ctx.restore();
      cross(ctx, x, y - 64, 3, '#ffe36b', a * (0.6 + 0.4 * Math.sin(t * 3)));
    },
  },
  stormfocus: {
    color: '#ffe86b', cast: 'bolt',
    back: (ctx, x, y, t, dir, a) => glow(ctx, x, y - 26, 30, '#ffe86b', a * (0.25 + 0.15 * Math.sin(t * 13))),
    front: (ctx, x, y, t, dir, a) => {
      // Static crackling over your body in little jagged arcs.
      for (let i = 0; i < 3; i++) {
        if (((t * 5 + i * 0.37) % 1) > 0.35) continue;
        const sx = x + (hash(Math.floor(t * 5) + i * 7) - 0.5) * 30;
        const sy = y - 10 - hash(Math.floor(t * 5) + i * 3) * 40;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.strokeStyle = '#fffbe0';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 4, sy + 3);
        ctx.lineTo(sx + 1, sy + 5);
        ctx.lineTo(sx + 6, sy + 9);
        haloStroke(ctx, '#ffe86b');
        ctx.restore();
      }
    },
  },
  meditate: {
    color: '#ff9a4a', cast: 'lotus',
    back: (ctx, x, y, t, dir, a) => {
      // A lotus of flame blooming under your feet, a calm warm glow above it.
      glow(ctx, x, y - 20, 30, '#ffb35a', a * 0.35);
      lotus(ctx, x, y, t, a, 1);
    },
    front: (ctx, x, y, t, dir, a) => {
      motes(ctx, x, y, t, a, { n: 6, spread: 16, height: 50, speed: 0.4, color: '#ffd66b', size: 1.3, seed: 17 });
    },
  },
  bless: {
    color: '#ffe36b', cast: 'shower',
    back: (ctx, x, y, t, dir, a) => glow(ctx, x, y - 28, 28, '#fff6c9', a * 0.4),
    front: (ctx, x, y, t, dir, a) => {
      // Three little golden crosses circling your chest, and soft light falling.
      orbit(ctx, x, y - 28, t, { n: 3, rx: 16, ry: 5, speed: 1.6, draw: (px, py, z) => cross(ctx, px, py, 3 * z, '#ffe36b', a) }, true);
      for (let i = 0; i < 4; i++) {
        const u = (t * 0.5 + hash(i + 40)) % 1;
        star(ctx, x + (hash(i + 41) - 0.5) * 34, y - 60 + u * 56, 1.6, '#fffbe0', a * Math.sin(u * Math.PI));
      }
    },
  },
  sanctuary: {
    color: '#fff3a6', cast: 'dome',
    back: (ctx, x, y, t, dir, a) => {
      // Holy ground: a ring of light around you with columns rising at its edge.
      ring(ctx, x, y, 30, 7, '#ffe36b', 2, a * 0.8);
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * TAU + t * 0.3;
        if (Math.sin(ang) > 0) continue;
        column(ctx, x + Math.cos(ang) * 30, y + Math.sin(ang) * 7, t + i, a);
      }
    },
    front: (ctx, x, y, t, dir, a) => {
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * TAU + t * 0.3;
        if (Math.sin(ang) <= 0) continue;
        column(ctx, x + Math.cos(ang) * 30, y + Math.sin(ang) * 7, t + i, a);
      }
    },
  },
  bowbooster: {
    color: '#8fd86b', cast: 'gust',
    front: (ctx, x, y, t, dir, a) => {
      // Green chevrons racing forward off the bow arm: shoot faster.
      for (let i = 0; i < 3; i++) {
        const u = (t * 2 + i / 3) % 1;
        const cx = x + dir * (8 + u * 26);
        ctx.save();
        ctx.globalAlpha = a * (1 - u);
        ctx.strokeStyle = '#b8f07a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - dir * 4, y - 32);
        ctx.lineTo(cx, y - 27);
        ctx.lineTo(cx - dir * 4, y - 22);
        ctx.stroke();
        ctx.restore();
      }
    },
  },
  xbowbooster: {
    color: '#8fd3ff', cast: 'gears',
    front: (ctx, x, y, t, dir, a) => {
      // Clockwork: two meshed gears spinning by your shoulder.
      glow(ctx, x - dir * 12, y - 40, 12, '#8fd3ff', a * 0.4);
      gear(ctx, x - dir * 14, y - 42, 5, t * 4, '#cfe0ff', a * 0.9);
      gear(ctx, x - dir * 6.5, y - 46, 3.5, -t * 5.7 + 0.2, '#ffd66b', a * 0.9);
    },
  },
  daggerbooster: {
    color: '#ff9ec0', cast: 'blades',
    front: (ctx, x, y, t, dir, a) => {
      // Quick little slash glints flickering around you.
      for (let i = 0; i < 2; i++) {
        const u = (t * 3 + i * 0.5) % 1;
        if (u > 0.3) continue;
        const k = u / 0.3;
        const sx = x + (hash(Math.floor(t * 3 + i * 0.5) * 3 + i) - 0.5) * 34;
        const sy = y - 14 - hash(Math.floor(t * 3 + i * 0.5) * 5 + i) * 34;
        ctx.save();
        ctx.globalAlpha = a * (1 - k);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - 6, sy + 4);
        ctx.lineTo(sx - 6 + 12 * Math.min(1, k * 3), sy + 4 - 8 * Math.min(1, k * 3));
        ctx.stroke();
        ctx.restore();
      }
      motes(ctx, x, y, t, a * 0.7, { n: 4, spread: 14, height: 40, speed: 0.9, color: '#ff9ec0', size: 1.2, seed: 23 });
    },
  },
  clawbooster: {
    color: '#b48cff', cast: 'blades',
    back: (ctx, x, y, t, dir, a) => {
      orbit(ctx, x, y - 18, t, { n: 2, rx: 18, ry: 5, speed: 3.4, draw: (px, py, z) => shuriken(ctx, px, py, 4 * z, t * 20, '#b48cff', a * 0.7) }, false);
    },
    front: (ctx, x, y, t, dir, a) => {
      // A pair of shuriken whirling round your waist.
      orbit(ctx, x, y - 18, t, { n: 2, rx: 18, ry: 5, speed: 3.4, draw: (px, py, z) => shuriken(ctx, px, py, 4 * z, t * 20, '#dccfff', a) }, true);
    },
  },
  huntersmark: {
    color: '#8fd86b', cast: 'shine',
    front: (ctx, x, y, t, dir, a) => {
      // A hunter's mark over your head: a leaf-shaped crosshair, with leaves swirling by.
      const hx = x;
      const hy = y - 62;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = '#8fd86b';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, TAU);
      ctx.moveTo(hx - 8, hy);
      ctx.lineTo(hx - 3, hy);
      ctx.moveTo(hx + 3, hy);
      ctx.lineTo(hx + 8, hy);
      ctx.moveTo(hx, hy - 8);
      ctx.lineTo(hx, hy - 3);
      ctx.moveTo(hx, hy + 3);
      ctx.lineTo(hx, hy + 8);
      ctx.stroke();
      ctx.restore();
      orbit(ctx, x, y - 26, t, { n: 3, rx: 20, ry: 8, speed: 1.4, draw: (px, py, z, i, ang) => leaf(ctx, px, py, 3 * z, ang * 2, a) }, true);
    },
  },
  windspirit: {
    color: '#9fe8c8', cast: 'gust',
    back: (ctx, x, y, t, dir, a) => {
      // Riding the wind: a swirl of air under your feet that lifts you a little.
      for (let i = 0; i < 3; i++) {
        ring(ctx, x, y - 2 - i * 3, 14 + i * 4 + Math.sin(t * 4 + i) * 2, 3 + i, '#c9f6e0', 1.2, a * (0.7 - i * 0.15));
      }
    },
    front: (ctx, x, y, t, dir, a) => {
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.6 + i / 3) % 1;
        ctx.save();
        ctx.globalAlpha = a * Math.sin(u * Math.PI);
        ctx.translate(x + Math.sin(t * 2 + i * 2) * 16, y - 10 - u * 46);
        ctx.rotate(t * 2 + i);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(0, 0, 3.5, 1.2, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
      speedLines(ctx, x, y, t, dir, a * 0.6, '#c9f6e0', 3);
    },
  },
  eagleeye: {
    color: '#ff5a5a', cast: 'lock',
    front: (ctx, x, y, t, dir, a) => {
      // A golden eagle emblem over your head, wings spread, with a red critical glint.
      eagle(ctx, x, y - 64, a, t);
      if ((t % 1.2) < 0.15) star(ctx, x + dir * 10, y - 38, 4, '#ff5a5a', a);
    },
  },
  callwild: {
    color: '#5fe8b0', cast: 'howl',
    back: (ctx, x, y, t, dir, a) => glow(ctx, x, y - 26, 30, '#5fe8b0', a * 0.35),
    front: (ctx, x, y, t, dir, a) => {
      // Spirit claw marks flickering on the air beside you, and paw-shaped motes rising.
      const u = (t * 0.8) % 1;
      if (u < 0.35) {
        ctx.save();
        ctx.globalAlpha = a * (1 - u / 0.35);
        ctx.strokeStyle = '#c9ffe8';
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath();
          ctx.moveTo(x + dir * (14 + i * 3), y - 40);
          ctx.lineTo(x + dir * (20 + i * 3), y - 26);
          ctx.stroke();
        }
        ctx.restore();
      }
      for (let i = 0; i < 3; i++) {
        const v = (t * 0.5 + i / 3) % 1;
        paw(ctx, x + (hash(i + 60) - 0.5) * 30, y - 6 - v * 44, 1.4, a * Math.sin(v * Math.PI));
      }
    },
  },
  luckycharm: {
    color: '#5fc84a', cast: 'clover',
    front: (ctx, x, y, t, dir, a) => {
      // A four-leaf clover bobbing over your head, gold sparkles twinkling around it.
      clover(ctx, x, y - 64 + Math.sin(t * 2) * 2, 5, Math.sin(t * 1.5) * 0.3, a);
      for (let i = 0; i < 3; i++) {
        const tw = Math.max(0, Math.sin(t * 4 + i * 2.1));
        star(ctx, x + Math.cos(i * 2.1 + t) * 12, y - 64 + Math.sin(i * 2.1 + t) * 8, 2 * tw + 0.5, '#ffe36b', a * tw);
      }
    },
  },
  shadowpartner: {
    color: '#9b6bff', cast: 'smoke',
    // The shadow clone itself is drawn by the scene (it copies your pose); this adds its wisps.
    back: (ctx, x, y, t, dir, a) => motes(ctx, x - dir * 14, y, t, a * 0.8, { n: 6, spread: 10, height: 40, speed: 0.6, color: '#3a2a6b', size: 2, seed: 29 }),
  },
  nightveil: {
    color: '#7a5ac8', cast: 'smoke',
    back: (ctx, x, y, t, dir, a) => {
      // A veil of night: dark mist wrapping you, a crescent moon sigil glowing over your head.
      for (let i = 0; i < 6; i++) {
        const ang = t * 0.8 + (i / 6) * TAU;
        glow(ctx, x + Math.cos(ang) * 14, y - 24 + Math.sin(ang * 2) * 14, 12, '#2a1a4a', a * 0.5);
      }
    },
    front: (ctx, x, y, t, dir, a) => {
      ctx.save();
      ctx.globalAlpha = a * 0.9;
      ctx.fillStyle = '#c9a6ff';
      ctx.beginPath();
      ctx.arc(x, y - 62, 5, 0, TAU);
      ctx.arc(x + 2.5, y - 63.5, 4.3, 0, TAU, true);
      ctx.fill('evenodd');
      ctx.restore();
      glow(ctx, x, y - 62, 9, '#9b6bff', a * 0.5);
      motes(ctx, x, y, t, a * 0.7, { n: 5, spread: 14, height: 46, speed: 0.4, color: '#9b6bff', size: 1.3, seed: 31 });
    },
  },
  mirage: {
    color: '#ffd66b', cast: 'split',
    // The golden decoys are drawn by the scene; this adds the shimmer between them.
    front: (ctx, x, y, t, dir, a) => {
      for (let i = 0; i < 4; i++) {
        const tw = Math.max(0, Math.sin(t * 5 + i * 1.7));
        star(ctx, x + (i - 1.5) * 14, y - 20 - (i % 2) * 18, 2.2 * tw, '#fff6c9', a * tw);
      }
    },
  },
  gmhaste: {
    color: '#ff9ec0', cast: 'gust',
    front: (ctx, x, y, t, dir, a) => {
      const hues = ['#ff9ec0', '#ffd66b', '#9fe0b0', '#8fd3ff', '#c9a6ff'];
      hues.forEach((c, i) => speedLines(ctx, x, y + 2 - i * 2, t + i * 0.13, dir, a, c, 1));
    },
  },
  // Summons are their own effect; they get a summoning burst when cast.
  frostsprite: { color: '#8fe3ff', cast: 'summon' },
  salamander: { color: '#ff8a3c', cast: 'summon' },
  guardianangel: { color: '#fff3a6', cast: 'summon' },
};

// A whirl of wind circling the ankles; `front` draws the near half.
function windSwirl(ctx, x, y, t, a, color, front) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 2; i++) {
    const start = t * 7 + i * Math.PI;
    ctx.globalAlpha = a * 0.9;
    ctx.beginPath();
    ctx.ellipse(x, y - i * 4, 14 - i * 2, 3.5, 0, front ? start % TAU : (start + Math.PI) % TAU, (front ? start % TAU : (start + Math.PI) % TAU) + 1.8);
    ctx.stroke();
  }
  ctx.restore();
}

function stone(ctx, x, y, r, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#b8895a';
  ctx.strokeStyle = '#7a5238';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - r, y + r * 0.6);
  ctx.lineTo(x - r * 0.8, y - r);
  ctx.lineTo(x + r * 0.7, y - r * 1.1);
  ctx.lineTo(x + r, y + r * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0c49b';
  ctx.fillRect(x - r * 0.5, y - r * 0.8, r * 0.6, r * 0.3);
  ctx.restore();
}

function lotus(ctx, x, y, t, a, open) {
  ctx.save();
  for (let layer = 0; layer < 2; layer++) {
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + (i - 2.5) * (0.5 - layer * 0.12);
      const len = Math.max(0.5, (14 - layer * 4) * open + Math.sin(t * 6 + i) * open);
      ctx.globalAlpha = a * (0.75 - layer * 0.1);
      ctx.fillStyle = layer ? '#ffd66b' : '#ff8a3c';
      ctx.save();
      ctx.translate(x, y - 1);
      ctx.scale(1, 0.45);
      ctx.rotate(ang + Math.PI / 2);
      ctx.beginPath();
      ctx.ellipse(0, -len / 2, 3.2 - layer, len / 2, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }
  ctx.restore();
}

function column(ctx, x, y, t, a) {
  const h = 16 + Math.sin(t * 2) * 4;
  const g = ctx.createLinearGradient(0, y - h, 0, y);
  g.addColorStop(0, 'rgba(255,246,201,0)');
  g.addColorStop(1, 'rgba(255,246,201,0.85)');
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.fillRect(x - 1.5, y - h, 3, h);
  ctx.restore();
}

function leaf(ctx, x, y, r, rot, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = '#7fc45a';
  ctx.beginPath();
  ctx.ellipse(0, 0, r, r * 0.45, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function paw(ctx, x, y, r, a) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#9ff0cc';
  ctx.beginPath();
  ctx.ellipse(x, y, r * 1.4, r, 0, 0, TAU);
  for (const [dx, dy] of [[-1.6, -1.6], [-0.5, -2.3], [0.6, -2.3], [1.6, -1.6]]) {
    ctx.moveTo(x + dx * r + r * 0.5, y + dy * r);
    ctx.arc(x + dx * r, y + dy * r, r * 0.5, 0, TAU);
  }
  ctx.fill();
  ctx.restore();
}

function eagle(ctx, x, y, a, t) {
  const flap = Math.sin(t * 2) * 0.15;
  glow(ctx, x, y, 12, '#ffd66b', a * 0.5);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = '#ffd66b';
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(side, 1);
    ctx.rotate(-flap);
    ctx.beginPath();
    ctx.moveTo(1, 0);
    ctx.lineTo(10, -5);
    ctx.lineTo(9, -2);
    ctx.lineTo(11, -2);
    ctx.lineTo(8, 1);
    ctx.lineTo(9, 2);
    ctx.lineTo(1, 3);
    ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#fff6c9';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 2.2, 3.5, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#c98a2b';
  ctx.fillRect(x - 0.5, y - 3, 1, 1.5);
  ctx.restore();
}

// Draws every active buff's effect for one layer. Buffs fade in over their first moment and
// flicker in their last three seconds so you can see them about to wear off.
export function drawBuffEffects(ctx, buffs, layer, x, y, time, now, dir) {
  for (const [id, b] of Object.entries(buffs ?? {})) {
    const look = BUFF_LOOKS[id];
    if (!look?.[layer]) continue;
    const left = b.until - now;
    if (left <= 0) continue;
    const ending = left < 3 ? (Math.floor(left * 6) % 2 ? 0.35 : 1) : 1;
    const start = b.since != null ? Math.min(1, (now - b.since) * 3) : 1;
    ctx.save();
    look[layer](ctx, x, y, time, dir, ending * start);
    ctx.restore();
  }
}

// The cast moment for buff `f.skill`: a burst shaped for the skill, and its name popping up.
export function drawBuffCast(ctx, f, x, y, p, time) {
  const look = BUFF_LOOKS[f.skill] ?? { color: '#ffe36b', cast: 'burst' };
  const c = look.color;
  ctx.save();
  // The moment it goes up, as MapleStory draws a buff: a pillar of the skill's light from the
  // ground with the job's emblem rising inside (Tengu's own effect art). War Cry is a battle cry
  // bursting out instead; Iron Guard snaps plates of steel round the body behind a steel shield.
  const school = SKILLS[f.skill]?.school ?? 'steel';
  if (f.skill === 'warcry') {
    fxSprite(ctx, 'celshout', x, y - 26, { p, scale: 1.1 });
    groundRing(ctx, ringOf(school), x, y, Math.min(1, p * 1.3), 90);
    if (p > 0.1) fxSprite(ctx, 'celembsteel', x, y - 70, { p: (p - 0.1) / 0.9, scale: 0.5 });
  } else if (f.skill === 'vanish') {
    fxSprite(ctx, 'celsmoke', x, y, { p, scale: 1.1 });
    fxSprite(ctx, 'celcrowburst', x, y - 10, { p, scale: 0.6 });
  } else if (f.skill === 'ironguard') {
    pillarOf(ctx, school, x, y, p);
    fxSprite(ctx, 'celplates', x, y - 26, { p: Math.min(1, p * 1.2), scale: 0.6 });
    fxSprite(ctx, 'celshieldsteel', x + (f.dir || 1) * 16, y - 26, { p, scale: 0.6, sx: 0.7 });
  } else pillarOf(ctx, school, x, y, p);
  ctx.restore();
  // The skill's name pops up over your head.
  if (f.name) {
    // It pops in big, overshoots a touch small, and settles.
    const k = Math.min(1, p * 9);
    const pop = 1.5 - 0.5 * (1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2);
    ctx.save();
    ctx.globalAlpha = p > 0.75 ? (1 - p) / 0.25 : 1;
    ctx.font = font((9 * pop).toFixed(1), true);
    ctx.textAlign = 'center';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#3a2d4f';
    ctx.strokeText(f.name, x, y - 74 - p * 10);
    ctx.fillStyle = c;
    ctx.fillText(f.name, x, y - 74 - p * 10);
    ctx.restore();
  }
}
