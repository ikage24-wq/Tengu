// Mage spell effects: casting circles, Blink, ice, lightning, venom, and holy light, plus the
// Glacial Tempest ultimate. Every effect is drawn from its progress `p` (0-1) and a seed, so it
// needs no state. (x, y) is the effect's anchor in screen space: a monster's feet for per-target
// effects, the caster's feet otherwise; `f.box` (world space) is the spell's area when it has one.

import { deep, ghost } from './fxkit.js';
import { fxSprite } from './fx-sprites.js';

const TAU = Math.PI * 2;

export const SCHOOL_COLORS = {
  arcane: { main: '#c9a6ff', light: '#efe4ff', deep: '#8f5cc4' },
  ice: { main: '#8fe3ff', light: '#e8fbff', deep: '#3f9fd8' },
  lightning: { main: '#ffe86b', light: '#fffbe0', deep: '#5fb8ff' },
  // The Stormcaller's lightning: electric violet, deep storm blue.
  storm: { main: '#b48cff', light: '#efe4ff', deep: '#2a3394' },
  fire: { main: '#ff8a3c', light: '#ffe9a8', deep: '#e0442b' },
  poison: { main: '#9be86b', light: '#e6ffd0', deep: '#9b4fe0' },
  holy: { main: '#ffe36b', light: '#fffbe0', deep: '#f0b33b' },
  steel: { main: '#cfe0ff', light: '#ffffff', deep: '#6f8fd8' },
  earth: { main: '#e0a96b', light: '#fff0c9', deep: '#8a5a3a' },
  dragon: { main: '#ff5a5a', light: '#ffe36b', deep: '#a02a4a' },
  // Wind: a saturated emerald, so it reads on purple and blue maps (pale mint vanished there).
  wind: { main: '#36e0a0', light: '#effff8', deep: '#0f9a74' },
  nature: { main: '#8fd86b', light: '#eaffd0', deep: '#4f8a3a' },
  shadow: { main: '#9b6bff', light: '#e6dcff', deep: '#3a2a6b' },
  sakura: { main: '#ff9ec0', light: '#fff0f6', deep: '#c94f8a' },
  gold: { main: '#ffd66b', light: '#fff6c9', deep: '#c98a2b' },
  // Hawk: the Archer's warm gold with sky blue (deep) under it.
  hawk: { main: '#ffc94a', light: '#fff4c8', deep: '#3a8ae0' },
  rage: { main: '#ff5a4a', light: '#ffd7a0', deep: '#8a1838' },
  // A Sniper's aim: a cool steel blue, with her sight's rose-red (see strikes.js `SIGHT`).
  focus: { main: '#7fc4ff', light: '#eef8ff', deep: '#3a5fc4' },
};

const ease = (p) => 1 - (1 - p) * (1 - p);
const rand = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function sparkle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

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

// A spinning magic circle laid flat on the ground: two rings, rune ticks, and a star.
function circle(ctx, x, y, r, rot, color, light, a, points = 6) {
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(x, y);
  ctx.scale(1, 0.32);
  glow(ctx, 0, 0, r * 1.2, color, 0.35);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, TAU);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = light;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, TAU);
  ctx.stroke();
  ctx.rotate(rot);
  // Rune ticks around the band.
  ctx.fillStyle = light;
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * TAU;
    ctx.save();
    ctx.rotate(ang);
    ctx.fillRect(r * 0.82, -1, i % 2 ? 4 : 7, 2);
    ctx.restore();
  }
  // A star polygon in the middle.
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let i = 0; i <= points; i++) {
    const ang = (i * 2 * TAU) / points;
    const px = Math.cos(ang) * r * 0.74;
    const py = Math.sin(ang) * r * 0.74;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

// ---------- Area and per-target spell effects ----------

// Draws one spell effect; returns false for kinds it doesn't know.
export function drawSpell(ctx, f, x, y, p, cam, time) {
  if (f.t < 0) return true;
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  switch (f.kind) {
    case 'castcircle': {
      // The casting circle grows in, spins, and fades; ultimates get a second, bigger ring.
      const c = SCHOOL_COLORS[f.school] ?? SCHOOL_COLORS.arcane;
      const k = Math.min(1, p * 4);
      const a = p > 0.7 ? (1 - p) / 0.3 : 1;
      const r = (f.big ? 34 : 22) * ease(k);
      circle(ctx, x, y - 1, r, time * 3, c.main, c.light, a * 0.95);
      if (f.big) circle(ctx, x, y - 1, r * 1.6, -time * 2, c.light, c.main, a * 0.6, 8);
      // Motes rising off the circle.
      for (let i = 0; i < (f.big ? 12 : 6); i++) {
        const u = (p * 1.6 + rand(i) ) % 1;
        const ang = rand(i + 9) * TAU;
        ctx.globalAlpha = a * (1 - u);
        ctx.fillStyle = i % 2 ? c.light : c.main;
        ctx.fillRect(Math.round(x + Math.cos(ang) * r), Math.round(y - u * (f.big ? 60 : 36)), 2, 2);
      }
      if (f.big) {
        // A column of power over the caster.
        const g = ctx.createLinearGradient(0, y - 120, 0, y);
        g.addColorStop(0, 'rgba(255,255,255,0)');
        g.addColorStop(1, c.main);
        ctx.globalAlpha = a * 0.45;
        ctx.fillStyle = g;
        ctx.fillRect(x - r * 0.5, y - 120, r, 120);
      }
      return true;
    }
    case 'blink': {
      // Where you vanished: an afterimage streak toward where you land.
      const c = SCHOOL_COLORS[f.school] ?? SCHOOL_COLORS.arcane;
      const tx = f.tx - cam.x;
      ctx.globalAlpha = 1 - p;
      const g = ctx.createLinearGradient(x, 0, tx, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, c.main);
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(x, tx), y - 30, Math.abs(tx - x), 22 * (1 - p) + 2);
      for (let i = 0; i < 10; i++) {
        const k = rand(i * 3.3);
        const px = x + (tx - x) * ((k + p * 0.6) % 1);
        sparkle(ctx, px, y - 8 - rand(i) * 34, 3 * (1 - p) + 0.5, i % 2 ? '#ffffff' : c.main);
      }
      // Afterimages along the path, the oldest vanishing first.
      for (let i = 0; i < 3; i++) {
        const left = 0.18 + i * 0.1 - p;
        if (left <= 0) continue;
        ctx.globalAlpha = 0.75;
        ghost(ctx, x + (tx - x) * (0.25 + i * 0.25), y, 0.9 * Math.min(1, left / 0.08), i === 2 ? '#ffffff' : c.main);
      }
      ctx.globalAlpha = 1 - p;
      // A shrinking burst at the spot you left.
      ctx.strokeStyle = c.light;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 18, 16 * (1 - p) + 2, 22 * (1 - p) + 2, 0, 0, TAU);
      ctx.stroke();
      return true;
    }
    case 'blinkin': {
      // Arriving: a flash, a ring snapping outward, and sparkles spraying off.
      const c = SCHOOL_COLORS[f.school] ?? SCHOOL_COLORS.arcane;
      glow(ctx, x, y - 18, 30 * (1 - p) + 6, '#ffffff', 1 - p);
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = c.main;
      ctx.lineWidth = 3 * (1 - p) + 1;
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 6 + ease(p) * 26, 2 + ease(p) * 6, 0, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        sparkle(ctx, x + Math.cos(a) * ease(p) * 22, y - 18 + Math.sin(a) * ease(p) * 22, 3 * (1 - p) + 0.5, i % 2 ? '#ffffff' : c.main);
      }
      return true;
    }
    case 'burst': {
      if (!box) {
        // Each target pops with a rune flash.
        const c = SCHOOL_COLORS.arcane;
        const cy = y - (f.h ?? 24) / 2;
        glow(ctx, x, cy, 20 * (1 - p) + 4, c.main, 1 - p);
        ctx.save();
        ctx.translate(x, cy);
        ctx.rotate(p * 3);
        ctx.globalAlpha = 1 - p;
        sparkle(ctx, 0, 0, 12 * (1 - p) + 2, c.light);
        ctx.restore();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU + p;
          sparkle(ctx, x + Math.cos(a) * 18 * ease(p), cy + Math.sin(a) * 14 * ease(p), 3 * (1 - p) + 0.5, i % 2 ? '#ffffff' : c.main);
        }
        return true;
      }
      // A ring of runes rushes outward across the area.
      const c = SCHOOL_COLORS.arcane;
      const cx = f.dir > 0 ? box.x + 6 : box.x + box.w - 6;
      const cy = box.y + box.h / 2;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = c.main;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, box.w * ease(p), box.h * 0.4 * ease(p), 0, -Math.PI / 2, Math.PI / 2, f.dir < 0);
      ctx.stroke();
      ctx.fillStyle = c.light;
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i / 8) * Math.PI;
        ctx.fillRect(Math.round(cx + f.dir * Math.cos(a) * box.w * ease(p)), Math.round(cy + Math.sin(a) * box.h * 0.4 * ease(p)), 3, 3);
      }
      return true;
    }
    case 'freeze': {
      // Ice shards snap shut around a monster as it freezes.
      const cy = y - (f.h ?? 24) / 2;
      const k = ease(p);
      ctx.globalAlpha = 1 - p * 0.8;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU;
        const d = (1 - k) * 30 + 6;
        ctx.save();
        ctx.translate(x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8);
        ctx.rotate(a);
        ctx.fillStyle = i % 2 ? '#e8fbff' : '#8fe3ff';
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(0, -2.5);
        ctx.lineTo(4, 0);
        ctx.lineTo(0, 2.5);
        ctx.fill();
        ctx.restore();
      }
      glow(ctx, x, cy, 26, '#e8fbff', (1 - p) * 0.7);
      return true;
    }
    case 'poisonpuff': {
      const cy = y - (f.h ?? 24) * 0.6;
      // A bleed ticking: a few drops of blood (the Berserker's wounds are real, not bubbles).
      if (f.bleed) {
        fxSprite(ctx, 'celblood', x + (rand(f.seed * 9) - 0.5) * 10, cy, { p, scale: 0.32, flip: rand(f.seed * 5) < 0.5 });
        return true;
      }
      ctx.globalAlpha = (1 - p) * 0.7;
      for (let i = 0; i < 3; i++) {
        ctx.fillStyle = f.bleed ? (i % 2 ? '#e8364f' : '#ff8a9a') : i % 2 ? '#9be86b' : '#9b4fe0';
        ctx.beginPath();
        ctx.arc(x + (rand(f.seed * 9 + i) - 0.5) * 16, cy - p * 14 - i * 3, 3 + p * 4, 0, TAU);
        ctx.fill();
      }
      return true;
    }
    default:
      return false;
  }
}

