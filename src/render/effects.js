// Skill effects, projectiles, hit sparks, damage numbers, and loot on the ground.
// Everything is drawn in screen space from world positions minus the camera.

import { drawItemIcon } from './icons.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { ELEMENTS } from './elements.js';
import { drawSpell, drawSpellShot, SCHOOL_COLORS } from './spells.js';
import { drawStrike, drawStrikeShot } from './strikes.js';
import { drawBuffCast } from './buffs.js';
import { drawFunny } from './funnyfx.js';
import { crescent, starFlash, needle, shock, puff, crown, easeOut, easeIn } from './fxkit.js';

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

const SHOT_COLORS = {
  pebble: '#ffc2e0', arrow: '#fff6fb', star: '#dfe6ff', bolt: '#c9b6ff', fire: '#ff9b5c', holy: '#fff3a6',
  bomb: '#ffb347', pierce: '#a8e8ff', swing: '#ffffff',
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

function ease(p) {
  return 1 - (1 - p) * (1 - p);
}

// A swing smear in front of the swinger: a crescent whose head races around the arc while its tail
// follows and catches up, thick in the middle and tapered at both ends, with a white-hot core,
// a few speed lines peeling off the outside, and sparks flung from the tip.
function slash(ctx, cx, cy, dir, radius, p, color, thick = 6) {
  const start = dir > 0 ? -Math.PI * 0.8 : -Math.PI * 0.2;
  const sweep = Math.PI * 1.05 * (dir > 0 ? 1 : -1);
  const head = easeOut(Math.min(1, p / 0.45));
  const tail = easeIn(Math.max(0, (p - 0.12) / 0.88));
  const a0 = start + sweep * tail;
  const a1 = start + sweep * head;
  crescent(ctx, cx, cy, radius, a0, a1, thick * (1.6 - p), color);
  // Speed lines just outside the smear.
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const u = 0.25 + i * 0.25;
    const a = a0 + (a1 - a0) * u;
    const r = radius + thick * (0.9 + i * 0.35);
    ctx.globalAlpha = Math.max(0, 1 - p * 1.4);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a - 0.12 * Math.sign(sweep), a + 0.12 * Math.sign(sweep), dir < 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  if (p < 0.5) {
    const tip = a1;
    const tx = cx + Math.cos(tip) * radius;
    const ty = cy + Math.sin(tip) * radius;
    const fly = tip + (Math.PI / 2) * Math.sign(sweep);
    for (let i = 0; i < 2; i++) needle(ctx, tx + Math.cos(fly) * (4 + i * 5) * p * 6, ty + Math.sin(fly) * (4 + i * 5) * p * 6, fly, 6 - i * 2, 2.2 - i * 0.6, color);
  }
}

// A melee cut's smear along the blade's real path: `start` and `sweep` in degrees for a hero
// facing right (0 = forward, -90 = up; mirrored when facing left). The head races ahead and the
// tail catches up, with a white-hot inner edge; heavy blows get a second, fatter smear and a flash
// where the cut ends. `flat` squashes it into a whirl around the body.
function arcSmear(ctx, f, x, y, p) {
  const rad = Math.PI / 180;
  let a0 = f.start * rad;
  let sweep = f.sweep * rad;
  if (f.dir < 0) {
    a0 = Math.PI - a0;
    sweep = -sweep;
  }
  const head = easeOut(Math.min(1, p / 0.4));
  const tail = easeIn(Math.max(0, (p - 0.1) / 0.9));
  const from = a0 + sweep * tail;
  const to = a0 + sweep * head;
  const el = f.element ? ELEMENTS[f.element] : null;
  const color = el?.color ?? (f.school ? SCHOOL_COLORS[f.school]?.main : null) ?? f.color ?? '#ffe9f3';
  const thick = f.thick * (f.big ? 1.25 : 1) * (1.5 - p);
  ctx.save();
  ctx.translate(x, y);
  if (f.flat) ctx.scale(1, 0.45);
  if (f.big) {
    ctx.globalAlpha = 0.45 * (1 - p);
    crescent(ctx, 0, 0, f.r + thick * 0.6, from, to, thick * 1.9, color);
    ctx.globalAlpha = 1;
  }
  crescent(ctx, 0, 0, f.r, from, to, thick, color);
  // Speed lines peeling off the outside.
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap = 'round';
  ctx.lineWidth = 1;
  ctx.globalAlpha = Math.max(0, 1 - p * 1.5);
  for (let i = 0; i < 3; i++) {
    const a = from + (to - from) * (0.3 + i * 0.25);
    const r = f.r + thick * (0.8 + i * 0.35);
    ctx.beginPath();
    ctx.arc(0, 0, r, a - 0.14 * Math.sign(sweep), a + 0.14 * Math.sign(sweep), sweep < 0);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // Sparks flung off the tip, and on a heavy blow a flash where it ends.
  if (p < 0.5) {
    const tx = Math.cos(to) * f.r;
    const ty = Math.sin(to) * f.r;
    const fly = to + (Math.PI / 2) * Math.sign(sweep);
    for (let i = 0; i < 2; i++) needle(ctx, tx + Math.cos(fly) * (4 + i * 5) * p * 6, ty + Math.sin(fly) * (4 + i * 5) * p * 6, fly, 6 - i * 2, 2.2 - i * 0.6, color);
    if (f.big) starFlash(ctx, tx, ty, 16 * (1 - p * 2), 6, 0.3, color, '#ffffff', 4 * (1 - p * 2));
  }
  if (el && p < 0.8) {
    for (let i = 0; i < 6; i++) {
      const a = from + (to - from) * (i / 5);
      ctx.globalAlpha = (1 - p) * 0.9;
      ctx.fillStyle = el.sparks[i % el.sparks.length];
      const r = f.r + Math.sin(i * 3.1) * 6 + p * 10;
      ctx.fillRect(Math.round(Math.cos(a) * r), Math.round(Math.sin(a) * r), 2, 2);
    }
  }
  ctx.restore();
}

// The floor splitting open under a heavy blow: jagged cracks racing out both ways, chips of
// ground flung up, a burst of spikes, and dust rolling out.
function crack(ctx, f, x, y, p) {
  const out = easeOut(Math.min(1, p / 0.18));
  const fade = p > 0.55 ? 1 - (p - 0.55) / 0.45 : 1;
  const half = f.w / 2;
  ctx.save();
  ctx.globalAlpha = fade;
  // The cracks run just under the grass line: a dark split with a hot glow inside.
  for (const side of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      ctx.strokeStyle = ['#ffb36b', '#4a2f3a', '#fff3c9'][k];
      ctx.lineWidth = [6, 3, 1][k];
      ctx.globalAlpha = fade * (k === 0 ? 0.45 : 1);
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y + 5);
      const n = 7;
      for (let i = 1; i <= n; i++) {
        const u = (i / n) * out;
        const jag = Math.sin((i + f.seed * 10) * 2.7 + side) * 3;
        ctx.lineTo(x + side * half * u, y + 5 + jag + (i % 2 ? 2 : -1));
      }
      ctx.stroke();
      // A branch off the middle.
      ctx.beginPath();
      ctx.moveTo(x + side * half * 0.35 * out, y + 5);
      ctx.lineTo(x + side * half * 0.5 * out, y + 11);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  if (p < 0.35) crown(ctx, x, y + 1, 26 * Math.sin((p / 0.35) * Math.PI), 18, 5, '#e8c8a8');
  // Chips of ground thrown up and falling back.
  for (let i = 0; i < 8; i++) {
    const sd = i % 2 ? 1 : -1;
    const vx = sd * (30 + ((i * 37 + f.seed * 50) % 50));
    const vy = 160 + ((i * 53) % 90);
    const t = p * 0.7;
    const cx = x + vx * t;
    const cy = y - (vy * t - 450 * t * t);
    if (cy > y + 2) continue;
    ctx.globalAlpha = fade;
    ctx.fillStyle = i % 3 ? '#c9a27a' : '#8a6a5a';
    ctx.fillRect(Math.round(cx - 1.5), Math.round(cy - 1.5), 3, 3);
  }
  ctx.globalAlpha = fade * 0.9;
  for (const side of [-1, 1]) puff(ctx, x + side * (10 + half * 0.7 * easeOut(p)), y - 4 - p * 4, 6 * (1 - p) + 2, '#f6e2c8', '#d9b89a');
  ctx.restore();
}

function drawShot(ctx, f, cam) {
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  if (f.t < 0) return;
  const x = f.x + (f.tx - f.x) * p - cam.x;
  const y = f.y + (f.ty - f.y) * p - cam.y;
  const dir = Math.sign(f.tx - f.x) || 1;
  const c = f.element ? ELEMENTS[f.element].glow : SHOT_COLORS[f.shot] ?? '#ffffff';
  ctx.save();
  if (drawSpellShot(ctx, f, x, y, dir, f.t) || drawStrikeShot(ctx, f, x, y, dir, f.t)) {
    ctx.restore();
    return;
  }
  switch (f.shot) {
    case 'arrow': case 'pierce':
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - dir * 14, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.fillStyle = f.shot === 'pierce' ? '#a8e8ff' : '#ffd66b';
      ctx.beginPath();
      ctx.moveTo(x + dir * 4, y);
      ctx.lineTo(x - dir * 2, y - 3);
      ctx.lineTo(x - dir * 2, y + 3);
      ctx.fill();
      break;
    case 'star':
      ctx.translate(x, y);
      ctx.rotate(f.t * 20);
      sparkle(ctx, 0, 0, 6, c);
      sparkle(ctx, 0, 0, 3, '#ffffff');
      break;
    case 'bolt': case 'holy': case 'fire': case 'bomb': {
      const r = f.shot === 'fire' ? 7 : 6;
      const g = ctx.createRadialGradient(x, y, 1, x, y, r * 2.2);
      g.addColorStop(0, '#ffffff');
      g.addColorStop(0.4, c);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.5 - i * 0.12;
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x - dir * i * 7, y, r - i, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    default:
      sparkle(ctx, x, y, 5, c);
      sparkle(ctx, x, y, 2, '#ffffff');
  }
  ctx.restore();
}

// A glowing streak behind elemental projectiles.
function shotTrail(ctx, f, cam) {
  if (f.t < 0) return;
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  const el = ELEMENTS[f.element];
  const x = f.x + (f.tx - f.x) * p - cam.x;
  const y = f.y + (f.ty - f.y) * p - cam.y;
  const dir = Math.sign(f.tx - f.x) || 1;
  ctx.save();
  const g = ctx.createLinearGradient(x - dir * 34, y, x, y);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, el.color);
  ctx.strokeStyle = g;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(x - dir * 34, y);
  ctx.lineTo(x, y);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = el.sparks[i % el.sparks.length];
    ctx.fillRect(Math.round(x - dir * (8 + i * 9)), Math.round(y + Math.sin(f.t * 30 + i * 2) * 3), 2, 2);
  }
  ctx.restore();
}

// An elemental burst where a hit lands. (x, y) is the monster's feet; f.h its height.
function impact(ctx, f, x, y, p, time) {
  const el = ELEMENTS[f.element];
  const cy = y - f.h / 2;
  const fade = 1 - p;
  switch (f.element) {
    case 'holy': {
      // A pillar of light with a cross flash.
      const w = 10 * fade + 2;
      const g = ctx.createLinearGradient(0, cy - 70, 0, y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, '#fff3a6');
      ctx.globalAlpha = fade * 0.8;
      ctx.fillStyle = g;
      ctx.fillRect(x - w / 2, cy - 70, w, y - cy + 70);
      ctx.fillStyle = '#ffffff';
      const s = 6 + p * 10;
      ctx.fillRect(x - 1, cy - s, 3, s * 2);
      ctx.fillRect(x - s * 0.7, cy - s * 0.35, s * 1.4, 3);
      break;
    }
    case 'cosmic': {
      // A starburst: a ring and five spinning stars flung outward.
      ctx.globalAlpha = fade;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, cy, 4 + p * 18, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + f.seed * 6;
        ctx.save();
        ctx.translate(x + Math.cos(a) * p * 22, cy + Math.sin(a) * p * 22);
        ctx.rotate(time * 6 + i);
        sparkle(ctx, 0, 0, 4 * fade + 1, el.sparks[i % 3]);
        ctx.restore();
      }
      break;
    }
    case 'storm': {
      // A lightning bolt strikes from above, then crackles.
      if (p < 0.6) {
        ctx.globalAlpha = 1 - p / 0.6;
        ctx.strokeStyle = '#ffffff';
        ctx.shadowColor = el.color;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.beginPath();
        let bx = x + (f.seed - 0.5) * 20;
        let by = cy - 90;
        ctx.moveTo(bx, by);
        for (let i = 1; i <= 6; i++) {
          bx = x + (i === 6 ? 0 : Math.sin(f.seed * 50 + i * 2.3) * 9);
          by = cy - 90 + i * 15;
          ctx.lineTo(bx, by);
        }
        ctx.stroke();
        ctx.strokeStyle = el.color;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.globalAlpha = fade;
      ctx.fillStyle = el.color;
      ctx.beginPath();
      ctx.arc(x, cy, 10 * fade + 2, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'fire': {
      // An explosion: a hot core and puffs blooming outward.
      const r = 6 + ease(p) * 16;
      const g = ctx.createRadialGradient(x, cy, 1, x, cy, r);
      g.addColorStop(0, '#fff3a6');
      g.addColorStop(0.4, '#ffa53b');
      g.addColorStop(1, 'rgba(255,75,43,0)');
      ctx.globalAlpha = fade;
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, cy, r, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + f.seed * 4;
        ctx.fillStyle = el.sparks[i % 3];
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r, cy + Math.sin(a) * r - p * 8, 3 * fade + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'water': {
      // A splash crown with droplets, and a ripple on the ground.
      ctx.globalAlpha = fade;
      ctx.fillStyle = '#c9f6ff';
      for (let i = 0; i < 7; i++) {
        const a = -Math.PI * (0.15 + (i / 6) * 0.7);
        const d = ease(p) * 20;
        const dy = p * p * 30;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, cy + Math.sin(a) * d + dy, 2.5 * fade + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(x, y, 6 + p * 24, 2 + p * 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'demonic': {
      // Hellfire: spikes of dark flame burst up through the target, and a black-red ring snaps in.
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#5a0f1f';
      ctx.lineWidth = 3 * fade + 1;
      ctx.beginPath();
      ctx.arc(x, cy, 22 * (1 - ease(p)) + 3, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 5; i++) {
        const sx = x + (i - 2) * 7 + (f.seed - 0.5) * 6;
        const h = (18 + ((i * 7 + f.seed * 13) % 9) * 2) * Math.sin(Math.min(1, p * 2.5) * Math.PI * 0.5) * (1 - p * 0.6);
        ctx.fillStyle = '#3a0614';
        ctx.beginPath();
        ctx.moveTo(sx - 4, y);
        ctx.quadraticCurveTo(sx - 2, y - h * 0.6, sx, y - h);
        ctx.quadraticCurveTo(sx + 2, y - h * 0.6, sx + 4, y);
        ctx.fill();
        ctx.fillStyle = i % 2 ? '#ff3b2b' : '#ffb03b';
        ctx.beginPath();
        ctx.moveTo(sx - 2, y);
        ctx.quadraticCurveTo(sx - 1, y - h * 0.5, sx, y - h * 0.8);
        ctx.quadraticCurveTo(sx + 1, y - h * 0.5, sx + 2, y);
        ctx.fill();
      }
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = el.sparks[i % 2];
        ctx.fillRect(x + Math.sin(f.seed * 40 + i * 2.1) * 14, cy - p * 30 - i * 3, 2, 2);
      }
      break;
    }
    case 'bone': {
      // A ghostly skull flashes over the target and green souls spiral out of it.
      ctx.globalAlpha = fade * 0.85;
      const r = 7 + ease(p) * 4;
      ctx.fillStyle = '#e6ffee';
      ctx.beginPath();
      ctx.arc(x, cy - 2 - p * 8, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - r * 0.6, cy - 2 - p * 8 + r * 0.4, r * 1.2, r * 0.8);
      ctx.fillStyle = '#1f6b44';
      ctx.beginPath();
      ctx.arc(x - r * 0.4, cy - 1 - p * 8, r * 0.28, 0, Math.PI * 2);
      ctx.arc(x + r * 0.4, cy - 1 - p * 8, r * 0.28, 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + p * 5 + f.seed * 6;
        const d = ease(p) * 24;
        ctx.globalAlpha = fade;
        ctx.fillStyle = el.color;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7 - p * 10, 2.5 * fade + 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 'laser': {
      // A searing slice of light through the target, a white flash, and a hex ring.
      ctx.globalCompositeOperation = 'lighter';
      const w = 40 * ease(Math.min(1, p * 3));
      ctx.globalAlpha = fade;
      ctx.fillStyle = el.color;
      ctx.fillRect(x - w, cy - 2.5 * fade - 0.5, w * 2, 5 * fade + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - w * 0.8, cy - 0.75, w * 1.6, 1.5);
      if (p < 0.25) {
        ctx.globalAlpha = 1 - p / 0.25;
        ctx.beginPath();
        ctx.arc(x, cy, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = fade;
      ctx.strokeStyle = el.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const hr = 6 + ease(p) * 16;
      for (let i = 0; i <= 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * hr, cy + Math.sin(a) * hr);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
      break;
    }
    case 'chainsaw': {
      // Grinding: jagged rips across the target and a fountain of sparks.
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let j = 0; j < 3; j++) {
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const px = x - 14 + i * 4.7;
          const py = cy - 8 + j * 8 + (i % 2 ? -2.5 : 2.5) + (px - x) * 0.25;
          ctx[i ? 'lineTo' : 'moveTo'](px, py);
        }
        ctx.stroke();
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI * (0.1 + ((i * 0.37 + f.seed) % 1) * 0.8);
        const d = ease(p) * (16 + (i % 3) * 8);
        ctx.strokeStyle = el.sparks[i % 3];
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(a) * d, cy + Math.sin(a) * d + p * p * 20);
        ctx.lineTo(x + Math.cos(a) * (d + 4), cy + Math.sin(a) * (d + 4) + p * p * 20);
        ctx.stroke();
      }
      ctx.fillStyle = '#ffd23b';
      ctx.globalAlpha = fade * 0.6;
      ctx.beginPath();
      ctx.arc(x, cy, 6 * fade + 1, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cyber': {
      // A glitch: slices of the target shear sideways in neon, and pixels scatter.
      for (let i = 0; i < 5; i++) {
        const sy = cy - 14 + ((i * 0.41 + f.seed) % 1) * 28;
        const shift = Math.sin(p * 40 + i * 3) * 10 * fade;
        ctx.globalAlpha = fade * 0.8;
        ctx.fillStyle = i % 2 ? '#ff3bd4' : '#3bf0ff';
        ctx.fillRect(x - 10 + shift, sy, 20 + (i % 3) * 6, 2 + (i % 2) * 2);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + f.seed * 5;
        const d = ease(p) * 26;
        ctx.globalAlpha = fade;
        ctx.fillStyle = el.sparks[i % 3];
        ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(cy + Math.sin(a) * d), 2, 2);
      }
      ctx.strokeStyle = '#3bf0ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.globalAlpha = fade;
      ctx.strokeRect(x - 8 - p * 10, cy - 8 - p * 10, 16 + p * 20, 16 + p * 20);
      ctx.setLineDash([]);
      break;
    }
  }
}

function drawFx(ctx, f, cam, time) {
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  const x = f.x - cam.x;
  const y = f.y - cam.y;
  ctx.save();
  if ((f.t >= 0 && drawFunny(ctx, f, x, y, p, cam, time)) || drawSpell(ctx, f, x, y, p, cam, time) || drawStrike(ctx, f, x, y, p, cam, time)) {
    ctx.restore();
    return;
  }
  switch (f.kind) {
    case 'projectile':
      if (f.element) shotTrail(ctx, f, cam);
      drawShot(ctx, f, cam);
      break;
    case 'impact':
      impact(ctx, f, x, y, p, time);
      break;
    case 'swing': case 'slash': {
      const cx = x + f.dir * 10;
      if (f.element) {
        // Elemental slashes are wider, glow in the element's color, and leave motes behind.
        const el = ELEMENTS[f.element];
        slash(ctx, cx, y - 24, f.dir, 32, p, el.color, f.kind === 'slash' ? 11 : 9);
        for (let i = 0; i < 6; i++) {
          const a = (f.dir > 0 ? -Math.PI * 0.75 : -Math.PI * 0.25) + (i / 5) * Math.PI * ease(p) * f.dir;
          ctx.globalAlpha = (1 - p) * 0.9;
          ctx.fillStyle = el.sparks[i % el.sparks.length];
          const r = 32 + Math.sin(i * 3.1) * 6 + p * 10;
          ctx.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(y - 24 + Math.sin(a) * r), 2, 2);
        }
      } else {
        slash(ctx, cx, y - 24, f.dir, 26, p, f.kind === 'slash' ? '#ffb38a' : '#ffc2e0', f.kind === 'slash' ? 8 : 6);
      }
      break;
    }
    case 'spin': {
      // A whirl: two smears chasing each other around the body, squashed into an ellipse.
      const b = f.box;
      const cx = b.x + b.w / 2 - cam.x;
      const cy = b.y + b.h / 2 - cam.y;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, 0.42);
      const r = (b.w / 2) * (0.75 + 0.25 * easeOut(p));
      const turn = p * Math.PI * 4;
      for (const k of [0, Math.PI]) crescent(ctx, 0, 0, r, turn + k, turn + k + Math.PI * 0.9 * (1 - p * 0.6), 14 * (1 - p), '#ffd66b');
      ctx.restore();
      break;
    }
    case 'flurry': {
      // A flurry of quick cuts: short smears flashing open across the area one after another.
      const b = f.box;
      for (let i = 0; i < 5; i++) {
        const q = (p - i * 0.12) / 0.4;
        if (q <= 0 || q >= 1) continue;
        const lx = b.x - cam.x + ((i * 37 + 11) % Math.max(1, b.w));
        const ly = b.y - cam.y + 10 + ((i * 23) % Math.max(1, b.h - 14));
        const a = -0.9 + (i % 2) * 1.8;
        crescent(ctx, lx, ly + 14, 16, a - 1.1 * easeOut(q), a + 1.1 * easeOut(q) * (1 - q * 0.5), 6 * (1 - q), i % 2 ? '#ffffff' : '#ffc2e0');
      }
      break;
    }
    case 'pierce': {
      // A thrust: one long spike shooting forward with a shock ring popping at its tip.
      const b = f.box;
      const dir = f.dir ?? 1;
      const by = b.y + b.h / 2 - cam.y;
      const from = dir > 0 ? b.x - cam.x : b.x + b.w - cam.x;
      const reach = b.w * easeOut(Math.min(1, p / 0.35));
      const tipX = from + dir * reach;
      ctx.globalAlpha = p < 0.6 ? 1 : (1 - p) / 0.4;
      needle(ctx, tipX, by, dir > 0 ? 0 : Math.PI, reach, 7 * (1 - p * 0.7), '#a8e8ff');
      if (p > 0.2) shock(ctx, tipX, by, 4 + 14 * easeOut((p - 0.2) / 0.8), 9 * easeOut((p - 0.2) / 0.8), 3 * (1 - p), '#ffffff');
      break;
    }
    case 'blaze': case 'fire': case 'holy': case 'heal': {
      if (f.box) {
        // Area glow where the spell lands.
        const b = f.box;
        ctx.globalAlpha = 0.35 * (1 - p);
        ctx.fillStyle = f.kind === 'heal' || f.kind === 'holy' ? '#fff3a6' : f.kind === 'burst' ? '#e0d4ff' : '#ffb38a';
        ctx.fillRect(b.x - cam.x, b.y - cam.y, b.w, b.h);
        break;
      }
      const color = { burst: '#ffe36b', blaze: '#ff9b5c', fire: '#ff8a6b', holy: '#fff3a6', heal: '#9be08f' }[f.kind];
      ctx.globalAlpha = 1 - p;
      if (f.kind === 'blaze' || f.kind === 'fire') {
        for (let i = 0; i < 5; i++) {
          const fx = x - 14 + i * 7;
          const fh = 14 + ((i * 7) % 10) + p * 12;
          ctx.fillStyle = i % 2 ? '#ffd66b' : color;
          ctx.beginPath();
          ctx.ellipse(fx, y - fh / 2, 4, fh / 2, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          sparkle(ctx, x + Math.cos(a) * 18 * ease(p), y - 16 + Math.sin(a) * 14 * ease(p), 4 * (1 - p) + 1, color);
        }
        sparkle(ctx, x, y - 16, 9 * (1 - p), '#ffffff');
      }
      break;
    }
    case 'meteor': case 'judgment': {
      const gold = f.kind === 'judgment';
      if (f.box) {
        // The whole screen glows while the storm lands.
        ctx.globalAlpha = 0.3 * Math.sin(Math.PI * p);
        ctx.fillStyle = gold ? '#fff3a6' : '#ff9b5c';
        ctx.fillRect(0, 0, 640, 360);
        break;
      }
      if (f.t < 0) break;
      const impact = 0.45;
      if (gold) {
        // A pillar of light drops from the sky, then fades out from the edges.
        const width = 20 * (p < impact ? p / impact : 1 - (p - impact) / (1 - impact));
        const g = ctx.createLinearGradient(0, 0, 0, y);
        g.addColorStop(0, 'rgba(255,243,166,0)');
        g.addColorStop(0.6, 'rgba(255,248,210,0.8)');
        g.addColorStop(1, 'rgba(255,255,255,1)');
        ctx.fillStyle = g;
        ctx.fillRect(x - width / 2, 0, width, y);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - width / 6, 0, width / 3, y);
        for (let i = 0; i < 5; i++) sparkle(ctx, x - 14 + ((i * 13) % 28), y - ((p * 220 + i * 37) % 120), 2.5, i % 2 ? '#ffffff' : '#ffe36b');
      } else if (p < impact) {
        // A meteor streaks down at a slant with a flaming tail.
        const k = p / impact;
        const mx = x - 130 * (1 - k);
        const my = y - 260 * (1 - k) - 10;
        for (let i = 4; i >= 1; i--) {
          ctx.globalAlpha = 0.18 * i;
          ctx.fillStyle = i % 2 ? '#ffd66b' : '#ff8a6b';
          ctx.beginPath();
          ctx.arc(mx - i * 9, my - i * 18, 9 - i, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ff8a6b';
        ctx.beginPath();
        ctx.arc(mx, my, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3c4';
        ctx.beginPath();
        ctx.arc(mx + 2, my - 2, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      if (p >= impact) {
        // Burst on impact.
        const k = (p - impact) / (1 - impact);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = gold ? '#fff3a6' : '#ffb347';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(x, y - 4, 10 + 36 * k, 5 + 12 * k, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          sparkle(ctx, x + Math.cos(a) * 26 * k, y - 16 + Math.sin(a) * 18 * k, 5 * (1 - k) + 1, gold ? '#ffffff' : '#ffd66b');
        }
      }
      break;
    }
    case 'buffcast':
      drawBuffCast(ctx, f, x, y, p, time);
      break;
    case 'buff': case 'potion': {
      ctx.globalAlpha = 1 - p;
      const color = f.color ?? SCHOOL_COLORS[f.school]?.main ?? '#ffe36b';
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + p * 4;
        sparkle(ctx, x + Math.cos(a) * 16, y - 10 - p * 36 - (i % 2) * 6, 3, color);
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 2, 18 * ease(p) + 4, 5, 0, 0, Math.PI * 2);
      ctx.stroke();
      break;
    }
    case 'levelup': {
      ctx.globalAlpha = Math.min(1, 2 * (1 - p));
      const g = ctx.createLinearGradient(0, y - 140, 0, y);
      g.addColorStop(0, 'rgba(255,243,166,0)');
      g.addColorStop(1, 'rgba(255,243,166,0.75)');
      ctx.fillStyle = g;
      ctx.fillRect(x - 16, y - 140, 32, 140);
      for (let i = 0; i < 10; i++) {
        sparkle(ctx, x - 22 + ((i * 17) % 44), y - ((p * 160 + i * 23) % 140), 3, i % 2 ? '#ffffff' : '#ffe36b');
      }
      ctx.font = `bold 15px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#8f5cc4';
      ctx.strokeText('LEVEL UP!', x, y - 70 - p * 20);
      ctx.fillStyle = '#ffe36b';
      ctx.fillText('LEVEL UP!', x, y - 70 - p * 20);
      break;
    }
    case 'spark': {
      // Where a blow lands: a star flash that snaps open and pulls in.
      const k = p < 0.3 ? easeOut(p / 0.3) : 1 - (p - 0.3) / 0.7;
      starFlash(ctx, x, y, (f.crit ? 18 : 11) * k, f.crit ? 8 : 4, f.crit ? 0.4 : 0.8, f.crit ? '#ffb347' : '#ffd66b', '#ffffff', (f.crit ? 5 : 3.2) * k);
      break;
    }
    case 'arc':
      arcSmear(ctx, f, x, y, p);
      break;
    case 'crack':
      crack(ctx, f, x, y, p);
      break;
    case 'roar': {
      // Provoke: rings of a battle roar rolling out to its reach.
      ctx.globalAlpha = 1 - p;
      const k = easeOut(p);
      shock(ctx, x, y - 24, 14 + (f.r ?? 120) * k, 10 + 36 * k, 4 * (1 - p) + 0.5, '#ff7a6b');
      shock(ctx, x, y - 24, 8 + (f.r ?? 120) * 0.7 * k, 6 + 24 * k, 3 * (1 - p) + 0.5, '#ffffff');
      break;
    }
    case 'hook': {
      // Chain Hook: links race out to each monster caught, then reel it in.
      const out = Math.min(1, p / 0.3);
      ctx.globalAlpha = p > 0.8 ? (1 - p) / 0.2 : 1;
      const ends = f.mobs.length ? f.mobs.map((m) => [m.x - cam.x, m.y - m.def.h / 2 - cam.y]) : [[(f.reach ?? f.x) - cam.x, y]];
      for (const [ex, ey] of ends) {
        const tx = x + (ex - x) * out;
        const ty = y + (ey - y) * out;
        const len = Math.hypot(tx - x, ty - y);
        const n = Math.max(1, Math.floor(len / 6));
        for (let i = 0; i <= n; i++) {
          const lx = x + ((tx - x) * i) / n;
          const ly = y + ((ty - y) * i) / n + Math.sin(i * 0.9 + p * 10) * (1 - out) * 2;
          ctx.fillStyle = '#5a4a6e';
          ctx.beginPath();
          ctx.ellipse(lx, ly, 2.6, 1.8, i % 2 ? 0.6 : -0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#d8d0e6';
          ctx.beginPath();
          ctx.ellipse(lx, ly, 1.6, 1, i % 2 ? 0.6 : -0.6, 0, Math.PI * 2);
          ctx.fill();
        }
        // The hook at the end.
        const dir = Math.sign(tx - x) || 1;
        ctx.strokeStyle = '#3a2d4f';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(tx - dir * 2, ty + 2, 4, dir > 0 ? -Math.PI / 2 : Math.PI * 1.5, dir > 0 ? Math.PI * 0.7 : Math.PI * 0.3, dir < 0);
        ctx.stroke();
        ctx.strokeStyle = '#e6e0f0';
        ctx.lineWidth = 1.4;
        ctx.stroke();
        if (out >= 1 && p < 0.45) starFlash(ctx, tx, ty, 7, 4, 0.3, '#ffd66b', '#ffffff', 2);
      }
      break;
    }
    case 'slam': {
      // The ground cracks open in a flat shockwave that thins as it spreads.
      const k = easeOut(p);
      shock(ctx, x, y, f.range * k, 14 * k, 7 * (1 - p), '#c9b6ff');
      shock(ctx, x, y, f.range * k * 0.7, 10 * k, 3 * (1 - p), '#ffffff');
      break;
    }
    default:
  }
  ctx.restore();
}

export function drawEffects(ctx, world, cam, time) {
  for (const f of world.fx) drawFx(ctx, f, cam, time);
}

// The boss's wind-up warning: a pulsing ring on the floor around it.
export function drawWarnings(ctx, world, cam, time) {
  for (const m of world.mobs) {
    if (!m.special || m.special.warn <= 0) continue;
    const x = m.x - cam.x;
    const y = m.y - cam.y;
    ctx.save();
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(time * 18);
    ctx.fillStyle = '#ff6b8a';
    ctx.beginPath();
    ctx.ellipse(x, y, m.def.special.range, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function drawNumbers(ctx, world, cam) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  for (const n of world.numbers) {
    const p = n.t / 1.1;
    const pop = n.t < 0.12 ? 1 + (0.12 - n.t) * 4 : 1;
    const size = Math.round((n.crit ? 17 : n.small ? 10 : 14) * pop);
    const x = n.x - cam.x;
    const y = n.y - cam.y - p * 26;
    ctx.globalAlpha = p > 0.7 ? (1 - p) / 0.3 : 1;
    ctx.font = `bold ${size}px ${FONT}`;
    ctx.lineWidth = 4;
    ctx.strokeStyle = n.crit ? '#8a3a1f' : '#3a2d4f';
    ctx.strokeText(n.text, x, y);
    ctx.fillStyle = n.color;
    ctx.fillText(n.text, x, y);
    if (n.crit) sparkle(ctx, x - ctx.measureText(n.text).width / 2 - 6, y - size / 2, 4, '#ffe36b');
  }
  ctx.restore();
}

export function drawDrops(ctx, world, cam, time) {
  for (const d of world.drops) {
    const bob = d.landed ? Math.sin(time * 3 + d.uid) * 1.5 : 0;
    const x = Math.round(d.x - cam.x);
    const y = Math.round(d.y - cam.y - 2 + bob);
    // Fade out in the last few seconds before despawning.
    ctx.globalAlpha = d.age > 84 ? Math.max(0, (90 - d.age) / 6) : 1;
    ctx.fillStyle = 'rgba(58,45,79,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, Math.round(d.y - cam.y), 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    if (d.kind === 'gold') {
      const big = d.amount >= 100;
      ctx.fillStyle = '#e8a23c';
      ctx.beginPath();
      ctx.arc(x, y - 5, big ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffd66b';
      ctx.beginPath();
      ctx.arc(x, y - 5, big ? 4.5 : 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff6c9';
      ctx.fillRect(x - 2, y - 7, 1, 2);
    } else {
      const id = d.inst ? d.inst.id : d.id;
      if (d.inst) {
        const fade = d.age > 84 ? Math.max(0, (90 - d.age) / 6) : 1;
        const rarity = RARITIES[d.inst.rarity ?? 0];
        const color = rarity.color ?? (ITEMS[id].unique ? '#ff9ec0' : null);
        if (color && d.landed) lootBeam(ctx, x, y, color, time + d.uid, d.inst.rarity ?? 1, fade);
        // Equipment glows so it stands out among the coins.
        ctx.globalAlpha = fade * (0.4 + 0.2 * Math.sin(time * 4 + d.uid));
        sparkle(ctx, x, y - 8, 12, color ?? '#fff3a6');
        ctx.globalAlpha = fade;
      }
      drawItemIcon(ctx, id, x - 8, y - 16, 1, d.inst?.variant);
    }
  }
  ctx.globalAlpha = 1;
}

// A soft column of light over rare loot, taller and brighter for better rarities.
function lootBeam(ctx, x, y, color, t, rarity, fade) {
  const h = 40 + rarity * 22;
  ctx.save();
  const pulse = 0.75 + 0.25 * Math.sin(t * 3);
  const grad = ctx.createLinearGradient(0, y - h, 0, y);
  grad.addColorStop(0, 'rgba(255,255,255,0)');
  grad.addColorStop(1, color);
  ctx.globalAlpha = 0.45 * pulse * fade;
  ctx.fillStyle = grad;
  ctx.fillRect(x - 5, y - h, 10, h);
  ctx.globalAlpha = 0.7 * pulse * fade;
  ctx.fillRect(x - 1.5, y - h * 0.8, 3, h * 0.8);
  // Rising motes inside the beam.
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 2 + rarity; i++) {
    const k = (t * 0.6 + i / (2 + rarity)) % 1;
    ctx.globalAlpha = (1 - k) * fade;
    ctx.fillRect(Math.round(x + Math.sin(t * 2 + i * 2) * 3), Math.round(y - k * h), 1, 1);
  }
  ctx.restore();
}
