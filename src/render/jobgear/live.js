// Live gear effects, drawn over the hero each frame: fine pieces (tier 7 and up) catch the light
// with little glints, tier 12 and up shed motes in their glow color, and a full matching set of
// tier 15 or more wears its job's signature: embers off a warrior's shoulders, leaves drifting
// around an archer, runes circling a mage's hat, shadow wisps trailing a thief. Gilded pieces
// sparkle gold. Everything is a function of time, so nothing is stored per hero.

import { settings } from '../../core/settings.js';

const SLOTS = ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape'];

// Where each slot catches the light, in the figure's anchor points.
const SPOT = { hat: 'head', top: 'chest', bottom: 'hips', shoes: 'feet', gloves: 'hands', cape: 'back' };

// A four-point twinkle.
function glint(ctx, x, y, r, color, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.lineTo(x + r * 0.28, y - r * 0.28);
  ctx.lineTo(x + r, y);
  ctx.lineTo(x + r * 0.28, y + r * 0.28);
  ctx.lineTo(x, y + r);
  ctx.lineTo(x - r * 0.28, y + r * 0.28);
  ctx.lineTo(x - r, y);
  ctx.lineTo(x - r * 0.28, y - r * 0.28);
  ctx.closePath();
  ctx.fill();
}

function dot(ctx, x, y, r, color, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

const frac = (v) => v - Math.floor(v);
const hash = (n) => frac(Math.sin(n * 127.1 + 311.7) * 43758.5453);

// g: the resolved gear (pieces with family/tier/pal); at: anchors in screen space
// { head: [x, y], chest, hips, feet, hands, back, w } where w is the body's half width;
// s: scale; dir: facing (1 or -1); t: time.
export function drawGearFx(ctx, g, at, s, dir, t) {
  if (!settings.gearEffects || settings.particles === 'off') return;
  const few = settings.particles === 'reduced';
  const pieces = SLOTS.map((slot) => [slot, g[slot]]).filter(([, p]) => p?.family);
  if (!pieces.length) return;
  ctx.save();
  for (const [slot, p] of pieces) {
    const [ax, ay] = at[SPOT[slot]];
    const seed = p.tier * 7.3 + slot.length * 3.1;
    // Glints: one twinkle every couple of seconds, somewhere on the piece.
    if (p.tier >= 7 || p.variant === 'gilded') {
      const period = p.variant === 'gilded' ? 1.1 : 2.4 - p.tier * 0.05;
      const k = Math.floor(t / period + seed);
      const life = frac(t / period + seed) * period;
      if (life < 0.32) {
        const fade = Math.sin((life / 0.32) * Math.PI);
        const x = ax + (hash(k) - 0.5) * at.w * 1.6;
        const y = ay + (hash(k + 9) - 0.5) * 8 * s;
        glint(ctx, x, y, (1.6 + p.tier * 0.06) * s, p.variant === 'gilded' ? '#fff3b8' : '#ffffff', 0.9 * fade);
      }
    }
    // Motes: a few specks in the piece's glow color, drifting up and fading.
    if (p.tier >= 12 && p.pal.glow) {
      const n = few ? 1 : p.tier >= 16 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const life = frac(t * 0.45 + i / n + seed);
        // Off to the sides, so they never drift across the face.
        const x = ax + (i % 2 ? 1 : -1) * at.w * (1.2 + 0.4 * Math.sin(t * 1.3 + i * 2.1 + seed));
        const y = ay - life * 14 * s;
        dot(ctx, x, y, 0.7 * s, p.pal.glow, 0.7 * Math.sin(life * Math.PI));
      }
    }
  }
  // The signature of a full matching set.
  const family = pieces[0][1].family;
  const full = pieces.length === 6 && pieces.every(([, p]) => p.family === family);
  const tier = Math.min(...pieces.map(([, p]) => p.tier));
  if (full && tier >= 15) signature(ctx, family, pieces[1][1].pal, at, s, dir, t, few ? 3 : tier >= 19 ? 7 : 5);
  ctx.restore();
}

function signature(ctx, family, pal, at, s, dir, t, n) {
  const glow = pal.glow ?? pal.accent;
  if (family === 'warrior') {
    // Embers rising off the shoulders, flickering hot to dark.
    for (let i = 0; i < n; i++) {
      const life = frac(t * 0.7 + i / n);
      const side = i % 2 ? 1 : -1;
      const x = at.chest[0] + side * at.w * 1.7 + Math.sin(t * 3 + i) * 2 * s;
      const y = at.chest[1] - 4 * s - life * 22 * s;
      dot(ctx, x, y, (1 - life) * 1.1 * s + 0.3 * s, life < 0.5 ? '#ffd23b' : glow, 0.85 * (1 - life));
    }
  } else if (family === 'archer') {
    // Leaves drifting down around them, turning as they fall.
    for (let i = 0; i < n; i++) {
      const life = frac(t * 0.22 + i / n);
      const x = at.chest[0] + Math.sin(t * 0.9 + i * 2.3) * at.w * 2.2;
      const y = at.head[1] - 6 * s + life * 40 * s;
      ctx.globalAlpha = 0.8 * Math.sin(life * Math.PI);
      ctx.fillStyle = i % 2 ? glow : '#9be08f';
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(t * 2 + i);
      ctx.beginPath();
      ctx.ellipse(0, 0, 1.6 * s, 0.7 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (family === 'mage') {
    // Runes and stars circling the hat, the near side brighter.
    for (let i = 0; i < n; i++) {
      const a = t * 1.4 + (i / n) * Math.PI * 2;
      const x = at.head[0] + Math.cos(a) * at.w * 1.6;
      const y = at.head[1] + Math.sin(a) * 3 * s - 2 * s;
      const near = Math.sin(a) > 0;
      if (i % 2) glint(ctx, x, y, 1.5 * s, near ? '#ffffff' : glow, near ? 0.95 : 0.5);
      else dot(ctx, x, y, 0.9 * s, glow, near ? 0.9 : 0.45);
    }
  } else {
    // Shadow wisps trailing behind, low to the ground.
    for (let i = 0; i < n; i++) {
      const life = frac(t * 0.8 + i / n);
      const x = at.back[0] - dir * (4 + life * 18) * s;
      const y = at.hips[1] + Math.sin(t * 4 + i * 1.7) * 3 * s - life * 6 * s;
      dot(ctx, x, y, (1.6 - life) * s, i % 3 ? '#2a1f3a' : glow, 0.55 * (1 - life));
    }
  }
}
