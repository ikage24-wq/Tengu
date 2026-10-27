// Skill effects, projectiles, hit sparks, damage numbers, and loot on the ground.
// Everything is drawn in screen space from world positions minus the camera.

import { drawItemIcon } from './icons.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { ELEMENTS } from './elements.js';
import { drawSpell, drawSpellShot, SCHOOL_COLORS } from './spells.js';
import { drawStrike, drawStrikeShot } from './strikes.js';
import { drawBuffCast } from './buffs.js';
import { crescent, starFlash, needle, shock, puff, crown, bloom, stepped, haloStroke, inked, wash, easeOut, easeIn } from './fxkit.js';
import { mix, snap, gfx } from './pixel.js';
import { font } from '../ui/kit.js';
import { strikePose } from './hero.js';
import { wornGear } from '../core/character.js';


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

// A four-point throwing star around the origin: plum-outlined steel blades, each with a lit half,
// and a hole in the middle. Without an outline it's a flat silhouette (for afterimages).
function shuriken(ctx, r, body, lit, ink) {
  const pt = (k, d, off = 0) => {
    const a = (k * Math.PI) / 2 - Math.PI / 2 + off;
    return [Math.cos(a) * d, Math.sin(a) * d];
  };
  ctx.beginPath();
  for (let k = 0; k < 4; k++) {
    const p = [pt(k, r), pt(k, r * 0.5, 0.4), pt(k, r * 0.3, Math.PI / 4)];
    p.forEach(([px, py], i) => (k || i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  }
  ctx.closePath();
  if (ink) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = 2.4;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
  ctx.fillStyle = body;
  ctx.fill();
  if (!ink) return;
  // The lit half of each blade.
  ctx.fillStyle = lit;
  for (let k = 0; k < 4; k++) {
    const [tx, ty] = pt(k, r - 0.8);
    const [ix, iy] = pt(k, r * 0.3, -Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(tx, ty);
    ctx.lineTo(ix, iy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#8a92a3';
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
  ctx.fill();
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
    case 'arrow': case 'pierce': {
      // Pointed along its flight, with a fading streak behind and fletching at the tail.
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(f.ty - f.y, f.tx - f.x));
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-30, -0.75, 18, 1.5);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#3a2d4f';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-14, 0);
      ctx.lineTo(2, 0);
      ctx.stroke();
      ctx.strokeStyle = c;
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.fillStyle = f.shot === 'pierce' ? '#a8e8ff' : '#ffd66b';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(0, -3);
      ctx.lineTo(0, 3);
      ctx.fill();
      ctx.fillStyle = '#ff9ec0';
      ctx.fillRect(-15, -3, 4, 2);
      ctx.fillRect(-15, 1, 4, 2);
      break;
    }
    case 'star': {
      // A spinning shuriken with a faint trail of its own afterimage.
      const trail = f.element ? c : '#dfe6ff';
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = trail;
      ctx.beginPath();
      ctx.moveTo(x - dir * 22, y);
      ctx.lineTo(x - dir * 2, y - 3.5);
      ctx.lineTo(x - dir * 2, y + 3.5);
      ctx.fill();
      ctx.globalAlpha = 1;
      for (const [k, a] of [[2, 0.22], [1, 0.45]]) {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(x - dir * k * 5, y);
        ctx.rotate((f.t - k * 0.02) * 20);
        shuriken(ctx, 6.5, trail, trail, null);
        ctx.restore();
      }
      ctx.translate(x, y);
      ctx.rotate(f.t * 20);
      // Each kind of star has its own color.
      const body = f.starColor ?? '#b9c0cc';
      shuriken(ctx, 7, body, f.starColor ? mix(body, '#ffffff', 0.55) : '#eef2f7', '#3a2d4f');
      break;
    }
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
      // Then, once the light has come down, a bloom of round petals opens where it landed.
      if (p > 0.1) {
        ctx.globalAlpha = 1;
        const q = (p - 0.1) / 0.9;
        bloom(ctx, x, cy, 16 * easeOut(Math.min(1, q * 2.5)), 6, q * 0.8, '#ffe36b', '#ffffff', q * 2);
      }
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
        haloStroke(ctx, el.color);
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

// The ultimate's staging, around the caster (the skill draws its own storm on top): one drawing
// of a ring flash in the school's color, the view dimming while the power gathers with light
// streaks rising around the caster, then at the impact two drawings of a flat tint over
// everything and a starburst over the caster.
const ULT_IMPACT = 0.4;
function ultimateCue(ctx, f, x, y) {
  const c = SCHOOL_COLORS[f.school] ?? SCHOOL_COLORS.arcane;
  const t = f.t;
  if (t < 1 / 30) {
    ctx.globalAlpha = 0.9;
    shock(ctx, x, y - 26, 26, 34, 5, c.main);
  }
  if (t < ULT_IMPACT) {
    const k = Math.min(1, t / 0.12) * (t > ULT_IMPACT - 0.08 ? (ULT_IMPACT - t) / 0.08 : 1);
    if (inked(ctx)) {
      ctx.globalAlpha = 0.24 * k;
      ctx.fillStyle = '#2a1d40';
      wash(ctx);
    }
    ctx.globalAlpha = k;
    for (let i = 0; i < 6; i++) {
      const u = ((t * 3 + i / 6) % 1);
      const sx = x + Math.sin(i * 2.4) * 22;
      const sy = y - 8 - u * 70;
      ctx.fillStyle = i % 2 ? c.light : c.main;
      ctx.fillRect(Math.round(sx), Math.round(sy), 1.5, 12 * (1 - u) + 3);
    }
    return;
  }
  const after = t - ULT_IMPACT;
  if (after < 2 / 60 && inked(ctx)) {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = c.light;
    wash(ctx);
  }
  if (after < 0.25) {
    ctx.globalAlpha = 1;
    const k = stepped(after / 0.25, 8);
    starFlash(ctx, x, y - 30, 40 * (k < 0.15 ? 0.5 : 1 - k * 0.6), 8, 0.2, c.main, '#ffffff', 9 * (1 - k));
  }
}

function drawFx(ctx, f, cam, time) {
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  const x = f.x - cam.x;
  const y = f.y - cam.y;
  ctx.save();
  if (drawSpell(ctx, f, x, y, p, cam, time) || drawStrike(ctx, f, x, y, p, cam, time)) {
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
      // From the weapon's point, at its height, out to the end of the blow's reach.
      // When the weapon isn't level at that moment (a dash still winding through), the spike
      // leaves from the hand at its height instead.
      const pose = strikeAt(f);
      const level = pose && Math.abs(pose.angle - 90) < 30;
      const from0 = pose ? (level ? pose.tip : pose.hand) : null;
      const end = dir > 0 ? b.x + b.w : b.x;
      const start = from0 ? f.x + from0[0] : dir > 0 ? b.x : b.x + b.w;
      const by = (from0 ? f.y + from0[1] : b.y + b.h / 2) - cam.y;
      const from = start - cam.x;
      const reach = Math.max(18, Math.abs(end - start)) * easeOut(Math.min(1, p / 0.35));
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
        wash(ctx);
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
      // A sequence, one beat after another: a gold ring bursts along the ground, a column of
      // light shoots up, "LEVEL UP!" drops in letter by letter with a bounce, and a shine sweeps
      // across it; motes in the column cycle through the gold ramp.
      const t = f.t;
      const out = p > 0.75 ? (1 - p) / 0.25 : 1;
      if (t < 0.4) {
        const k = easeOut(t / 0.4);
        ctx.globalAlpha = 1 - t / 0.4;
        shock(ctx, x, y - 2, 10 + 46 * k, 3 + 10 * k, 5 * (1 - k) + 1, '#ffe36b');
      }
      const rise = easeOut(Math.min(1, Math.max(0, (t - 0.08) / 0.25)));
      if (rise > 0) {
        const h = 150 * rise;
        ctx.globalAlpha = out;
        const g = ctx.createLinearGradient(0, y - h, 0, y);
        g.addColorStop(0, 'rgba(255,243,166,0)');
        g.addColorStop(1, 'rgba(255,243,166,0.75)');
        ctx.fillStyle = g;
        ctx.fillRect(x - 16, y - h, 32, h);
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = out * 0.8;
        ctx.fillRect(x - 3, y - h * 0.85, 6, h * 0.85);
        const ramp = ['#ffffff', '#fff3a6', '#ffe36b', '#ffb347', '#ffe36b', '#fff3a6'];
        const step = Math.floor(time * 12);
        ctx.globalAlpha = out;
        for (let i = 0; i < 10; i++) {
          sparkle(ctx, x - 22 + ((i * 17) % 44), y - ((t * 100 + i * 23) % h), 3, ramp[(i + step) % ramp.length]);
        }
      }
      // The words go on the main canvas only, so the glow doesn't wash the gold out to white.
      if (!inked(ctx)) break;
      const word = 'LEVEL UP!';
      ctx.font = font(15, true);
      ctx.textAlign = 'left';
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#8f5cc4';
      const total = ctx.measureText(word).width;
      const ty = y - 70 - Math.max(0, t - 0.3) * 12;
      let lx = x - total / 2;
      const letters = [];
      for (let i = 0; i < word.length; i++) {
        const ch = word[i];
        const w = ctx.measureText(ch).width;
        const q = Math.min(1, Math.max(0, (t - 0.25 - i * 0.04) / 0.18));
        if (q > 0) {
          const drop = (1 - backOut(q)) * -18;
          ctx.globalAlpha = Math.min(1, q * 3) * out;
          ctx.strokeText(ch, lx, ty + drop);
          ctx.fillStyle = '#ffe36b';
          ctx.fillText(ch, lx, ty + drop);
          letters.push([ch, lx]);
        }
        lx += w;
      }
      // The shine: a slanted white band sweeping across the word.
      const sweep = (t - 0.75) / 0.35;
      if (sweep > 0 && sweep < 1) {
        const sx = x - total / 2 - 10 + (total + 20) * sweep;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(sx - 4, ty - 16);
        ctx.lineTo(sx + 4, ty - 16);
        ctx.lineTo(sx - 2, ty + 4);
        ctx.lineTo(sx - 10, ty + 4);
        ctx.closePath();
        ctx.clip();
        ctx.fillStyle = '#ffffff';
        for (const [ch, cx] of letters) ctx.fillText(ch, cx, ty);
        ctx.restore();
      }
      break;
    }
    case 'spark': {
      // A shot leaving the bow or hand: a white disc on its first drawings (the muzzle flash),
      // then a small flash.
      if (f.muzzle && p < 0.2) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 5 * (1 - p * 2), 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      // Where a blow lands: a star flash that snaps open and pulls in, held on twos.
      const q = stepped(p, Math.max(3, Math.round(f.dur * 30)));
      const k = q < 0.3 ? easeOut(q / 0.3 + 0.34) : 1 - (q - 0.3) / 0.7;
      starFlash(ctx, x, y, (f.crit ? 18 : 11) * k, f.crit ? 8 : 4, f.crit ? 0.4 : 0.8, f.crit ? '#ffb347' : '#ffd66b', '#ffffff', (f.crit ? 5 : 3.2) * k);
      break;
    }
    case 'arc': {
      // The smear follows the weapon's tip: centered on the shoulder it swings from, as far out
      // as the tip was when the blow landed.
      // Best: trace the blade's own path through the cut, so every move's smear matches it.
      const path = f.flat ? null : bladePath(f);
      if (path) bladeSmear(ctx, f, path, f.bx - cam.x, f.by - cam.y, p);
      else {
        const pose = f.flat ? null : strikeAt(f);
        if (pose) arcSmear(ctx, { ...f, r: Math.max(16, Math.hypot(pose.tip[0] - pose.shoulder[0], pose.tip[1] - pose.shoulder[1])) }, f.bx + pose.shoulder[0] - cam.x, f.by + pose.shoulder[1] - cam.y, p);
        else arcSmear(ctx, f, x, y, p);
      }
      break;
    }
    case 'ultcue':
      ultimateCue(ctx, f, x, y);
      break;
    case 'tint': {
      // A heavy blow's impact frame: the whole view washes flat in one tone for two drawings.
      if (!inked(ctx)) break;
      ctx.globalAlpha = f.t < 2 / 60 ? 0.25 : 0;
      ctx.fillStyle = f.color ?? '#fff3c4';
      wash(ctx);
      break;
    }
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

// The hero whose blows the smears and spikes belong to, so they line up with the weapon.
let hero = null;
export function drawEffects(ctx, world, cam, time) {
  hero = world.char ? { look: world.char.appearance, gear: wornGear(world.char) } : null;
  for (const f of world.fx) drawFx(ctx, f, cam, time);
}

// Where the weapon was at the moment a blow landed (offsets from the feet), or null.
const posed = new WeakMap();
// The blade's path through a cut: where the hand and the tip were over the last stretch of the
// move before the blow landed (and a touch after), sampled from the hero's own pose. Null when the
// tip barely travels (a thrust), so a plain arc stands in.
const traced = new WeakMap();
function bladePath(f) {
  if (!hero || !f.move || f.at == null) return null;
  if (traced.has(f)) return traced.get(f);
  const span = f.span ?? 0.22;
  let pts = [];
  for (let i = 0; i <= 28; i++) {
    const u = Math.max(0, f.at - span + ((span + 0.03) * i) / 28);
    const pose = strikePose(hero.look, hero.gear, f.move, u, f.moveDur, f.dir);
    if (pose) pts.push({ tip: pose.tip, hand: pose.hand });
  }
  // Keep only the cut itself: drop the slow wind-up (and any hold) before the blade gets moving,
  // so the smear starts where the swing does.
  const speed = pts.map((q, i) => (i ? Math.hypot(q.tip[0] - pts[i - 1].tip[0], q.tip[1] - pts[i - 1].tip[1]) : 0));
  const peak = Math.max(...speed);
  let first = speed.findIndex((v) => v >= peak * 0.25);
  first = Math.max(0, first - 1);
  pts = pts.slice(first).filter((q, i, a) => i === 0 || Math.hypot(q.tip[0] - a[i - 1].tip[0], q.tip[1] - a[i - 1].tip[1]) > 0.5);
  // Round the corners off (one pass of corner cutting), so the ribbon curves smoothly.
  for (let pass = 0; pass < 2 && pts.length > 2; pass++) {
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const mixp = (k) => ({ tip: [a.tip[0] + (b.tip[0] - a.tip[0]) * k, a.tip[1] + (b.tip[1] - a.tip[1]) * k], hand: [a.hand[0] + (b.hand[0] - a.hand[0]) * k, a.hand[1] + (b.hand[1] - a.hand[1]) * k] });
      out.push(mixp(0.25), mixp(0.75));
    }
    out.push(pts.at(-1));
    pts = out;
  }
  let travel = 0;
  for (let i = 1; i < pts.length; i++) travel += Math.hypot(pts[i].tip[0] - pts[i - 1].tip[0], pts[i].tip[1] - pts[i - 1].tip[1]);
  const path = pts.length >= 4 && travel > 24 ? pts : null;
  traced.set(f, path);
  return path;
}

// A smear along the traced path: a ribbon from partway down the blade out to its tip, fat in the
// middle and tapering to points at both ends, whose head races along the path and whose tail
// follows to close it. Inked rim, the colour, a white-hot band along the outer edge, and a darker
// trailing end; heavy blows get a wider ghost band behind.
function bladeSmear(ctx, f, path, ox, oy, p) {
  const n = path.length - 1;
  const head = easeOut(Math.min(1, p / 0.22)) * n;
  const tail = easeIn(Math.max(0, (p - 0.12) / 0.88)) * n;
  if (head - tail < 0.05) return;
  const at = (v) => {
    const i = Math.min(n - 1, Math.floor(v));
    const u = v - i;
    const a = path[i];
    const b = path[i + 1];
    return { tip: [a.tip[0] + (b.tip[0] - a.tip[0]) * u, a.tip[1] + (b.tip[1] - a.tip[1]) * u], hand: [a.hand[0] + (b.hand[0] - a.hand[0]) * u, a.hand[1] + (b.hand[1] - a.hand[1]) * u] };
  };
  const steps = Math.max(4, Math.ceil((head - tail) * 3));
  const ribbon = (inner, outer, from = 0, to = 1, grow = 0) => {
    const outerPts = [];
    const innerPts = [];
    for (let i = 0; i <= steps; i++) {
      const s = from + ((to - from) * i) / steps;
      const v = tail + (head - tail) * s;
      const q = at(v);
      const w = Math.pow(Math.sin(Math.PI * s), 0.7);
      const kIn = 1 - (1 - inner) * w;
      const kOut = 1 + (outer - 1) * w;
      const dx = q.tip[0] - q.hand[0];
      const dy = q.tip[1] - q.hand[1];
      const len = Math.hypot(dx, dy) || 1;
      outerPts.push([ox + q.hand[0] + dx * kOut + (dx / len) * grow, oy + q.hand[1] + dy * kOut + (dy / len) * grow]);
      innerPts.push([ox + q.hand[0] + dx * kIn - (dx / len) * grow, oy + q.hand[1] + dy * kIn - (dy / len) * grow]);
    }
    ctx.beginPath();
    outerPts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    for (let i = innerPts.length - 1; i >= 0; i--) ctx.lineTo(innerPts[i][0], innerPts[i][1]);
    ctx.closePath();
    ctx.fill();
  };
  const el = f.element ? ELEMENTS[f.element] : null;
  const color = el?.color ?? f.color ?? '#ffe9f3';
  const fade = 1 - p;
  const reachIn = f.big ? 0.32 : 0.45;
  ctx.save();
  if (f.big) {
    ctx.globalAlpha = 0.22 * fade;
    ctx.fillStyle = color;
    ribbon(reachIn + 0.1, 1.12);
    ctx.globalAlpha = 1;
  }
  if (inked(ctx)) {
    ctx.fillStyle = deepTone(color);
    ribbon(reachIn, 1.04, 0, 1, 1.1);
  }
  ctx.fillStyle = color;
  ribbon(reachIn, 1.04);
  ctx.fillStyle = mix(color, '#3a2a5a', 0.25);
  ribbon(reachIn, 1.04, 0, 0.28);
  ctx.fillStyle = '#ffffff';
  ribbon(0.8, 1.0, 0.25, 1);
  // Sparks flung off the tip as the head passes, and a flash where a heavy blow ends.
  if (p < 0.45) {
    const q = at(head);
    const prev = at(Math.max(0, head - 0.6));
    const dir = Math.atan2(q.tip[1] - prev.tip[1], q.tip[0] - prev.tip[0]);
    const tx = ox + q.tip[0];
    const ty = oy + q.tip[1];
    for (let i = 0; i < 3; i++) {
      const a = dir + (i - 1) * 0.5;
      const d = (5 + i * 4) * p * 6;
      needle(ctx, tx + Math.cos(a) * d, ty + Math.sin(a) * d, a, 7 - i * 1.5, 2.4 - i * 0.5, color);
    }
    if (f.big) starFlash(ctx, tx, ty, 18 * (1 - p * 2), 6, dir, color, '#ffffff', 4.5 * (1 - p * 2));
  }
  ctx.restore();
}

const deepTones = new Map();
function deepTone(c) {
  if (!deepTones.has(c)) deepTones.set(c, /^#[0-9a-f]{6}$/i.test(c) ? mix(c, '#3a2a6a', 0.55) : '#6b4f9e');
  return deepTones.get(c);
}

function strikeAt(f) {
  if (!hero || !f.move) return null;
  if (!posed.has(f)) posed.set(f, strikePose(hero.look, hero.gear, f.move, f.at, f.moveDur, f.dir));
  return posed.get(f);
}

// The boss's wind-up warning, a telegraph that reads at a glance: the danger zone pulses on the
// floor, its edge inked, and a ring gathers inward from the edge, faster and faster, landing on
// the boss just as the slam comes down.
export function drawWarnings(ctx, world, cam, time) {
  for (const m of world.mobs) {
    if (!m.special || m.special.warn <= 0) continue;
    const x = m.x - cam.x;
    const y = m.y - cam.y;
    const r = m.def.special.range;
    const q = 1 - m.special.warn / (m.def.special.warn || 1);
    ctx.save();
    ctx.globalAlpha = (0.25 + 0.2 * Math.sin(time * 18)) * (0.6 + 0.4 * q);
    ctx.fillStyle = '#ff6b8a';
    ctx.beginPath();
    ctx.ellipse(x, y, r, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.9;
    shock(ctx, x, y, r, 12, 2, '#ff8fa8');
    const k = 1 - easeIn(q);
    shock(ctx, x, y, Math.max(6, r * k), Math.max(2, 12 * k), 1.5 + 2.5 * q, '#ffffff');
    ctx.restore();
  }
}

// Damage numbers. Each one waits two ticks so the eye reads the spark first, then the number;
// it pops in big and settles (1.4x to 1x in 80 ms, crits bigger with a white flash and a burst
// behind them), then drifts up on a little arc, every other number leaning the other way so a
// string of hits fans out instead of piling up. When three or more hits land on one monster
// together, their total rises above them.
const NUMBER_DELAY = 2 / 60;
let numberSide = 0;
const backOut = (p) => 1 + 2.7 * (p - 1) ** 3 + 1.7 * (p - 1) ** 2;
const isDamage = (n) => /^\d+$/.test(n.text) && !n.small && n.color !== '#ff6b8a';

export function drawNumbers(ctx, world, cam) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const totals = new Map();
  for (const n of world.numbers) {
    if (n.t < NUMBER_DELAY) continue;
    n.side ??= (numberSide = -numberSide || 1);
    const age = n.t - NUMBER_DELAY;
    // A hit's size follows how much of the monster's HP it took: chip damage is smaller and
    // fainter, a big chunk is bigger and lingers (zh research: damage-number tiers).
    const w = n.weight ?? 0.05;
    // Party members' hits are smaller and fainter, so your own numbers lead (fx research).
    const tier = (w >= 0.25 ? 1.25 : w >= 0.1 ? 1.1 : w < 0.02 ? 0.88 : 1) * (n.party ? 0.72 : 1);
    const p = Math.min(1, n.t / (w >= 0.25 ? 1.4 : 1.1));
    const popIn = Math.min(1, age / (n.crit ? 0.11 : 0.08));
    const pop = n.crit ? 1.7 - 0.7 * backOut(popIn) : 1.4 - 0.4 * backOut(popIn);
    const base = (n.crit ? 17 : n.small ? 10 : 14) * tier;
    // HD numbers pop smoothly (no whole-pixel font steps).
    const size = gfx.hd ? base * pop : Math.round(base * pop);
    const rise = easeOut(Math.min(1, age / 0.6)) * 24 + Math.max(0, age - 0.6) * 6;
    const x = n.x - cam.x + n.side * (n.small ? 4 : 9) * easeOut(Math.min(1, age / 0.5));
    const y = n.y - cam.y - rise;
    ctx.globalAlpha = (p > 0.7 ? (1 - p) / 0.3 : 1) * (n.party ? 0.6 : tier < 1 ? 0.85 : 1);
    if (n.crit && age < 0.14) starFlash(ctx, x, y - size * 0.35, (size + 6) * (1 - age / 0.14) + 4, 8, age * 4, '#ffb347', '#fff3c4', 4);
    ctx.font = font(size, true);
    ctx.lineWidth = 4;
    ctx.strokeStyle = n.crit ? '#8a3a1f' : '#3a2d4f';
    ctx.strokeText(n.text, x, y);
    // A crit's first two drawings are white-hot before they take their color.
    ctx.fillStyle = n.crit && age < 2 / 60 ? '#ffffff' : n.color;
    ctx.fillText(n.text, x, y);
    if (n.crit) sparkle(ctx, x - ctx.measureText(n.text).width / 2 - 6, y - size / 2, 4, '#ffe36b');
    if (isDamage(n)) {
      const key = Math.round(n.x / 14);
      const g = totals.get(key) ?? { sum: 0, count: 0, top: Infinity, x: n.x, oldest: 0, youngest: 9 };
      g.sum += Number(n.text);
      g.count++;
      g.top = Math.min(g.top, n.y);
      g.oldest = Math.max(g.oldest, n.t);
      g.youngest = Math.min(g.youngest, n.t);
      totals.set(key, g);
    }
  }
  for (const g of totals.values()) {
    if (g.count < 3 || g.oldest - g.youngest > 0.65 || g.youngest < 0.12) continue;
    const age = g.youngest - 0.12;
    const pop = 1.35 - 0.35 * backOut(Math.min(1, age / 0.1));
    const size = gfx.hd ? 13 * pop : Math.round(13 * pop);
    const x = g.x - cam.x;
    const y = g.top - cam.y - 34 - easeOut(Math.min(1, age / 0.5)) * 10;
    ctx.globalAlpha = g.oldest > 0.8 ? Math.max(0, (1.1 - g.oldest) / 0.3) : 1;
    ctx.font = font(size, true);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#5a3f7a';
    const label = `${g.sum.toLocaleString('en-US')}`;
    ctx.strokeText(label, x, y);
    ctx.fillStyle = '#ffe36b';
    ctx.fillText(label, x, y);
  }
  ctx.restore();
}

// Loot plays out in beats: it pops out with a white flash and spins (edge-on and back) while it
// flies, squashes as it lands, and only then does a rare item's beam of light grow up out of it.
export function drawDrops(ctx, world, cam, time) {
  for (const d of world.drops) {
    if (d.landed) d.landAt ??= d.age;
    const landed = d.landed ? d.age - d.landAt : -1;
    const bob = landed > 0.4 ? Math.sin(time * 3 + d.uid) * 1.5 : 0;
    const x = snap(d.x - cam.x);
    const y = snap(d.y - cam.y - 2 + bob);
    // Fade out in the last few seconds before despawning.
    const fade = d.age > 84 ? Math.max(0, (90 - d.age) / 6) : 1;
    ctx.globalAlpha = fade;
    ctx.fillStyle = 'rgba(58,45,79,0.18)';
    ctx.beginPath();
    ctx.ellipse(x, snap(d.y - cam.y), 6, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Spin in the air; squash on the landing, then spring back.
    const sx = landed < 0 ? Math.max(0.2, Math.abs(Math.cos(d.age * 12))) : landed < 0.14 ? 1.25 - 0.25 * (landed / 0.14) : 1;
    const sy = landed >= 0 && landed < 0.14 ? 0.72 + 0.28 * easeOut(landed / 0.14) : 1;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.translate(-x, -y);
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
        const rarity = RARITIES[d.inst.rarity ?? 0];
        const color = rarity.color ?? (ITEMS[id].unique ? '#ff9ec0' : null);
        if (color && landed > 0.08) lootBeam(ctx, x, y, color, time + d.uid, d.inst.rarity ?? 1, fade, easeOut(Math.min(1, (landed - 0.08) / 0.25)));
        // Equipment glows so it stands out among the coins.
        ctx.globalAlpha = fade * (0.4 + 0.2 * Math.sin(time * 4 + d.uid));
        sparkle(ctx, x, y - 8, 12, color ?? '#fff3a6');
        ctx.globalAlpha = fade;
      }
      drawItemIcon(ctx, id, x - 8, y - 16, 1, d.inst?.variant);
    }
    ctx.restore();
    // The pop: a white flash where it leaps out.
    if (d.age < 0.1) {
      ctx.globalAlpha = 1;
      starFlash(ctx, x, y - 8, 12 * (1 - d.age / 0.1) + 3, 4, 0.4, '#ffffff', '#ffffff', 3);
    }
  }
  ctx.globalAlpha = 1;
}

// A soft column of light over rare loot, taller and brighter for better rarities.
function lootBeam(ctx, x, y, color, t, rarity, fade, grow = 1) {
  const h = (40 + rarity * 22) * grow;
  if (h < 1) return;
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
  // Rising motes inside the beam, cycling between white and the rarity's color.
  const cycle = Math.floor(t * 8);
  for (let i = 0; i < 2 + rarity; i++) {
    const k = (t * 0.6 + i / (2 + rarity)) % 1;
    ctx.fillStyle = (i + cycle) % 2 ? color : '#ffffff';
    ctx.globalAlpha = (1 - k) * fade;
    ctx.fillRect(Math.round(x + Math.sin(t * 2 + i * 2) * 3), Math.round(y - k * h), 1, 1);
  }
  ctx.restore();
}
