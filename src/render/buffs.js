// Buff effects: every buff skill has a look of its own while it's active (drawn behind and in
// front of the hero, even while moving), and a cast moment when it goes up: a burst shaped for the
// skill, with its name popping over your head. Everything is drawn from time alone.

import { SKILLS } from '../data/skills.js';
import { groundWave, pillarOf, pathTint } from './warrior-fx.js';
import { fxSprite } from './fx-sprites.js';

const TAU = Math.PI * 2;

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
// Each buff: its color, how it bursts when cast, and what it draws while active.
// back/front(ctx, x, y, t, dir, a) — (x, y) the hero's feet on screen, a the strength (0-1).
export const BUFF_LOOKS = {
  // Spirit Ward: a sphere of pale light round her with a sacred rope bound round its middle,
  // streamers hanging off it (Tengu's own effect art), see-through so she shows inside it.
  spiritward: {
    color: '#fff3dc',
    front: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celspiritward', x, y + 4, { t, scale: 0.78, alpha: 0.6 * a }),
  },
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
  quickhaste: {
    color: '#b89cff', cast: 'gust',
    // A faint violet ring at the feet and streaks of shadow peeling off behind (Tengu's own art).
    back: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celringshadow', x, y, { frame: 2, scale: 0.32, sy: 0.32, alpha: a * 0.6 }),
    front: (ctx, x, y, t, dir, a) => fxSprite(ctx, 'celstreakshadow', x - dir * 22, y - 10, { frame: Math.floor(t * 10) % 2, flip: dir < 0, scale: 0.3, alpha: a * 0.75 }),
  },
  gmhaste: {
    color: '#ff9ec0', cast: 'gust',
    front: (ctx, x, y, t, dir, a) => {
      const hues = ['#ff9ec0', '#ffd66b', '#9fe0b0', '#8fd3ff', '#c9a6ff'];
      hues.forEach((c, i) => speedLines(ctx, x, y + 2 - i * 2, t + i * 0.13, dir, a, c, 1));
    },
  },
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

// The cast moment for buff `f.skill`: a burst shaped for the skill.
export function drawBuffCast(ctx, f, x, y, p, time) {
  ctx.save();
  // The moment it goes up, as MapleStory draws a buff: a pillar of the skill's light from the
  // ground with the job's emblem rising inside (Tengu's own effect art). War Cry is a battle cry
  // bursting out instead; Iron Guard snaps plates of steel round the body behind a steel shield.
  const school = f.school ?? SKILLS[f.skill]?.school ?? 'steel';
  if (f.skill === 'warcry') {
    fxSprite(ctx, pathTint(school, 'celshout', 'celshoutgold', 'celshoutred'), x, y - 26, { p, scale: 1.1 });
    groundWave(ctx, school, x, y, Math.min(1, p * 1.3), 90);
    if (p > 0.1) fxSprite(ctx, `celemb${school}`, x, y - 70, { p: (p - 0.1) / 0.9, scale: 0.5 });
  } else if (f.skill === 'ironguard') {
    pillarOf(ctx, school, x, y, p);
    fxSprite(ctx, pathTint(school, 'celplates', 'celplatesgold', 'celplatesred'), x, y - 26, { p: Math.min(1, p * 1.2), scale: 0.6 });
    fxSprite(ctx, pathTint(school, 'celshieldsteel', 'celshield', 'celshieldred'), x + (f.dir || 1) * 16, y - 26, { p, scale: 0.6, sx: 0.7 });
  } else pillarOf(ctx, school, x, y, p);
  ctx.restore();
}
