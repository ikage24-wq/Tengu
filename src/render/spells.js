// Mage spell effects: casting circles, Blink, ice, lightning, venom, and holy light, plus the
// Glacial Tempest ultimate. Every effect is drawn from its progress `p` (0-1) and a seed, so it
// needs no state. (x, y) is the effect's anchor in screen space: a monster's feet for per-target
// effects, the caster's feet otherwise; `f.box` (world space) is the spell's area when it has one.

import { inked, deep, shock, bloom, ghost, wash } from './fxkit.js';

const TAU = Math.PI * 2;

export const SCHOOL_COLORS = {
  arcane: { main: '#c9a6ff', light: '#efe4ff', deep: '#8f5cc4' },
  ice: { main: '#8fe3ff', light: '#e8fbff', deep: '#3f9fd8' },
  lightning: { main: '#ffe86b', light: '#fffbe0', deep: '#5fb8ff' },
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

// A jagged lightning path from (x1, y1) to (x2, y2): a white core inside a colored stroke on a
// deep rim (no blur; the HD glow layer lights it). `fresh` draws the strike's first drawings
// all white and fatter, the way lightning is brightest the instant it hits.
function bolt(ctx, x1, y1, x2, y2, seed, color, width = 3, segs = 7, fresh = false) {
  const pts = [[x1, y1]];
  const len = Math.hypot(x2 - x1, y2 - y1);
  const nx = -(y2 - y1) / (len || 1);
  const ny = (x2 - x1) / (len || 1);
  for (let i = 1; i < segs; i++) {
    const k = i / segs;
    const off = (rand(seed * 31 + i) - 0.5) * Math.min(26, len * 0.22);
    pts.push([x1 + (x2 - x1) * k + nx * off, y1 + (y2 - y1) * k + ny * off]);
  }
  pts.push([x2, y2]);
  const w = fresh ? width * 1.5 : width;
  ctx.save();
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'round';
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  if (inked(ctx)) {
    ctx.strokeStyle = deep(color);
    ctx.lineWidth = w + 4.5;
    ctx.stroke();
  }
  ctx.strokeStyle = fresh ? '#ffffff' : color;
  ctx.lineWidth = w + 2.5;
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = w;
  ctx.stroke();
  // A forked branch off the middle.
  const [mx, my] = pts[Math.floor(segs / 2)];
  ctx.lineWidth = Math.max(1, w - 1.5);
  ctx.strokeStyle = fresh ? '#ffffff' : color;
  ctx.beginPath();
  ctx.moveTo(mx, my);
  ctx.lineTo(mx + nx * 14 * (rand(seed) > 0.5 ? 1 : -1) + (x2 - x1) * 0.08, my + 10);
  ctx.stroke();
  ctx.restore();
}

// Lightning timing, from the effect's age in seconds: the path jumps to a new shape every two
// ticks, the first two drawings are white-hot, and now and then a drawing is left blank, so it
// crackles instead of sliding.
const zap = (t) => {
  const tick = Math.floor(t * 60);
  return { seed: Math.floor(t * 30), fresh: tick < 2, blank: tick > 3 && tick % 5 === 2 };
};

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

// ---------- Projectiles ----------

// Draws spell shots; returns false for shots it doesn't know.
export function drawSpellShot(ctx, f, x, y, dir, time) {
  switch (f.shot) {
    case 'bolt': {
      // A spinning orb of arcane force wrapped in two orbiting runes, trailing lilac motes.
      const c = SCHOOL_COLORS.arcane;
      for (let i = 1; i <= 5; i++) {
        ctx.globalAlpha = 0.5 - i * 0.08;
        ctx.fillStyle = i % 2 ? c.main : c.light;
        ctx.beginPath();
        ctx.arc(x - dir * i * 6, y + Math.sin(time * 30 + i) * 2, 4 - i * 0.5, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      glow(ctx, x, y, 14, c.main, 0.9);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, TAU);
      ctx.fill();
      for (let i = 0; i < 2; i++) {
        const a = time * 18 + i * Math.PI;
        ctx.save();
        ctx.translate(x + Math.cos(a) * 8, y + Math.sin(a) * 4);
        ctx.rotate(a);
        sparkle(ctx, 0, 0, 3.5, c.light);
        ctx.restore();
      }
      return true;
    }
    case 'icebeam': {
      // A long spear of ice with a frost trail and snowflakes peeling off it.
      const c = SCHOOL_COLORS.ice;
      const g = ctx.createLinearGradient(x - dir * 40, y, x, y);
      g.addColorStop(0, 'rgba(232,251,255,0)');
      g.addColorStop(1, 'rgba(143,227,255,0.8)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 7;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - dir * 40, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      glow(ctx, x, y, 12, c.main, 0.7);
      ctx.fillStyle = c.light;
      ctx.strokeStyle = c.deep;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + dir * 9, y);
      ctx.lineTo(x - dir * 4, y - 4);
      ctx.lineTo(x - dir * 16, y - 1.5);
      ctx.lineTo(x - dir * 16, y + 1.5);
      ctx.lineTo(x - dir * 4, y + 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(Math.round(x - dir * 10), Math.round(y - 1), 9 * dir, 1);
      for (let i = 0; i < 4; i++) {
        const u = (time * 3 + i / 4) % 1;
        ctx.globalAlpha = 1 - u;
        snowflake(ctx, x - dir * (10 + u * 30), y + Math.sin(i * 2.4) * (3 + u * 8), 2.2, '#ffffff', time * 4 + i);
      }
      return true;
    }
    case 'fire': case 'venomfire': {
      // A roaring fireball: a white-hot core, licking flame tongues, and a smoky tail.
      const venom = f.shot === 'venomfire';
      const outer = venom ? '#7de04f' : '#ff6b2b';
      const mid = venom ? '#c46bff' : '#ffa53b';
      for (let i = 1; i <= 6; i++) {
        ctx.globalAlpha = 0.55 - i * 0.07;
        ctx.fillStyle = i % 2 ? outer : mid;
        ctx.beginPath();
        ctx.arc(x - dir * i * 5, y + Math.sin(time * 40 + i * 1.7) * (i * 0.5), 7 - i * 0.7, 0, TAU);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      glow(ctx, x, y, 18, outer, 0.75);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + time * 12;
        const r = 6 + Math.sin(time * 30 + i) * 1.5;
        ctx.fillStyle = i % 2 ? outer : mid;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * r * 0.7 - dir * 2, y + Math.sin(a) * r * 0.7, 3, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = venom ? '#e6ffd0' : '#fff3c4';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, TAU);
      ctx.fill();
      return true;
    }
    default:
      return false;
  }
}

function snowflake(ctx, x, y, r, color, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.lineTo(-Math.cos(a) * r, -Math.sin(a) * r);
  }
  ctx.stroke();
  ctx.restore();
}

// An ice spike rising out of the ground: (x, y) its base, h its full height, k how far it's out.
function spike(ctx, x, y, w, h, k, lean = 0) {
  const top = y - h * k;
  ctx.save();
  const g = ctx.createLinearGradient(x - w, 0, x + w, 0);
  g.addColorStop(0, '#e8fbff');
  g.addColorStop(0.45, '#9fe3ff');
  g.addColorStop(1, '#3f9fd8');
  ctx.fillStyle = g;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x + lean, top);
  ctx.lineTo(x + w, y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.beginPath();
  ctx.moveTo(x - w * 0.5, y);
  ctx.lineTo(x + lean, top + 2);
  ctx.lineTo(x - w * 0.15, y);
  ctx.fill();
  ctx.restore();
}

// A wavering wall of flame along the ground from x0 to x0 + len (dir), at height h.
function flameWall(ctx, x0, y, len, h, dir, time, colors, a) {
  ctx.save();
  ctx.globalAlpha = a;
  const n = Math.max(2, Math.floor(len / 15));
  // A hot glowing band along the base.
  const g = ctx.createLinearGradient(0, y - h * 0.5, 0, y);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, colors[1]);
  ctx.fillStyle = g;
  ctx.fillRect(Math.min(x0, x0 + dir * len) - 8, y - h * 0.5, len + 16, h * 0.5);
  // Fat teardrop flames, overlapping, in three layers from the outer flame to the hot core.
  for (let layer = 0; layer < 3; layer++) {
    ctx.fillStyle = colors[layer];
    for (let i = 0; i <= n; i++) {
      const fx = x0 + dir * (i / n) * len;
      const fh = h * (1 - layer * 0.3) * (0.65 + 0.35 * Math.abs(Math.sin(time * 8 + i * 1.7 + layer * 0.6)));
      const fw = 13 - layer * 4;
      const sway = Math.sin(time * 7 + i * 1.3) * 3;
      ctx.beginPath();
      ctx.moveTo(fx - fw, y);
      ctx.bezierCurveTo(fx - fw * 1.1, y - fh * 0.45, fx - fw * 0.3 + sway * 0.5, y - fh * 0.7, fx + sway, y - fh);
      ctx.bezierCurveTo(fx + fw * 0.3 + sway * 0.5, y - fh * 0.7, fx + fw * 1.1, y - fh * 0.45, fx + fw, y);
      ctx.closePath();
      ctx.fill();
    }
  }
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
    case 'thunder': {
      const c = SCHOOL_COLORS.lightning;
      if (box) {
        // A storm cloud rolls in over the area, flickering with light from inside.
        const a = Math.sin(Math.PI * p);
        const cy = Math.max(14, box.y - 70);
        const flash = p > 0.22 && p < 0.42;
        // One merged cloud body (all puffs in a single path, so no seams), a lit top, and a dark belly.
        const body = (dy, scale, color) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const px = box.x + (i + 0.5) * (box.w / 8) + Math.sin(time * 1.5 + i) * 2;
            const r = (9 + 13 * Math.sin((Math.PI * (i + 0.5)) / 8) + rand(i * 2.2) * 5) * scale * (0.7 + a * 0.3);
            ctx.moveTo(px + r, cy + dy + rand(i) * 6);
            ctx.arc(px, cy + dy + rand(i) * 6, r, 0, TAU);
          }
          ctx.fill();
        };
        ctx.globalAlpha = a * 0.92;
        body(4, 1, '#5d5a8a');
        body(-3, 0.8, flash ? '#fff6c9' : '#8884b8');
        body(-7, 0.55, flash ? '#ffffff' : '#a9a5d6');
        if (flash) glow(ctx, box.x + box.w / 2, cy, box.w * 0.55, c.light, 0.35 * a);
        return true;
      }
      // A thunderbolt smashes down onto each monster, then crackles over it.
      const cy = y - (f.h ?? 24) / 2;
      const z = zap(f.t);
      if (f.t >= 0 && p < 0.55 && !z.blank) {
        ctx.globalAlpha = z.fresh ? 1 : 1 - p / 0.55;
        bolt(ctx, x + (f.seed - 0.5) * 50, y - 170, x, cy, f.seed * 100 + z.seed, c.main, 3.5, 9, z.fresh);
      }
      // Where it strikes: a dark ring for a moment, then the crackle.
      if (f.t >= 0 && f.t < 3 / 60) {
        ctx.globalAlpha = 1;
        shock(ctx, x, cy, 14, 10, 4, deep(c.deep));
      }
      glow(ctx, x, cy, 26 * (1 - p) + 4, c.main, 1 - p);
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 4; i++) {
        const a = rand(f.seed * 10 + i + Math.floor(p * 10)) * TAU;
        bolt(ctx, x, cy, x + Math.cos(a) * 16, cy + Math.sin(a) * 12, f.seed + i + p, c.deep, 1, 3);
      }
      return true;
    }
    case 'chainbolt': {
      // One bolt that leaps target to target; each hop lights up in turn and flickers.
      const c = SCHOOL_COLORS.lightning;
      const pts = f.points.map((q) => ({ x: q.x - cam.x, y: q.y - cam.y }));
      const hops = pts.length - 1;
      const shown = Math.min(hops, Math.floor(p * hops * 2.2) + 1);
      for (let i = 0; i < shown; i++) {
        const age = p - i / (hops * 2.2);
        ctx.globalAlpha = Math.max(0, 1 - age * 1.6);
        const z = zap(age * f.dur);
        if (z.blank) continue;
        bolt(ctx, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, f.seed * 50 + i * 7 + z.seed, c.deep, 2.5, 6, z.fresh);
        glow(ctx, pts[i + 1].x, pts[i + 1].y, 18, c.main, ctx.globalAlpha);
      }
      return true;
    }
    case 'icespire': {
      if (box) {
        // A carpet of frost races across the ground.
        const k = ease(Math.min(1, p * 2));
        const gy = box.y + box.h / 2 + 30;
        const x0 = f.dir > 0 ? box.x : box.x + box.w;
        const g = ctx.createLinearGradient(x0, 0, x0 + f.dir * box.w * k, 0);
        g.addColorStop(0, 'rgba(232,251,255,0.8)');
        g.addColorStop(1, 'rgba(143,227,255,0)');
        ctx.globalAlpha = 1 - Math.max(0, (p - 0.6) / 0.4);
        ctx.fillStyle = g;
        ctx.fillRect(Math.min(x0, x0 + f.dir * box.w * k), gy - 4, box.w * k, 8);
        for (let i = 0; i < 8; i++) {
          const sx = x0 + f.dir * box.w * k * rand(i * 5.1);
          spike(ctx, sx, gy + 2, 2.5, 8 + rand(i) * 6, Math.min(1, k * 1.4));
        }
        return true;
      }
      // A giant spike bursts up under the monster, holds, then shatters into shards.
      const up = Math.min(1, p / 0.25);
      const h = (f.h ?? 24) + 26;
      if (p < 0.7) {
        spike(ctx, x - 7, y + 2, 5, h * 0.6, ease(up), -2);
        spike(ctx, x + 7, y + 2, 5, h * 0.55, ease(up), 2);
        spike(ctx, x, y + 2, 8, h, ease(up));
        glow(ctx, x, y - h * 0.4, 24, '#e8fbff', 0.5 * up);
      } else {
        const k = (p - 0.7) / 0.3;
        ctx.globalAlpha = 1 - k;
        for (let i = 0; i < 10; i++) {
          const a = -Math.PI * rand(f.seed * 7 + i);
          const d = ease(k) * (18 + rand(i) * 18);
          ctx.fillStyle = i % 2 ? '#e8fbff' : '#8fe3ff';
          ctx.save();
          ctx.translate(x + Math.cos(a) * d, y - h * 0.4 + Math.sin(a) * d + k * k * 20);
          ctx.rotate(k * 8 + i);
          ctx.fillRect(-2, -3, 4, 6);
          ctx.restore();
        }
      }
      return true;
    }
    case 'mist': {
      const c = SCHOOL_COLORS.poison;
      if (box) {
        // A rolling green cloud billows out across the area and lingers before thinning out.
        const k = ease(Math.min(1, p * 1.8));
        const fade = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
        const x0 = f.dir > 0 ? box.x : box.x + box.w;
        for (let i = 0; i < 20; i++) {
          const along = rand(i * 2.7) * k;
          const px = x0 + f.dir * along * box.w;
          const py = box.y + box.h * (0.3 + rand(i * 4.1) * 0.6) - p * 10;
          const r = (16 + rand(i) * 16) * (0.5 + k * 0.6);
          glow(ctx, px + Math.sin(time * 2 + i) * 4, py, r, i % 4 === 0 ? '#a45be0' : i % 2 ? '#7fd05a' : '#5fb84a', fade * 0.85);
        }
        // Skull-shaped wisps drifting up.
        for (let i = 0; i < 3; i++) {
          const u = (p * 1.3 + i / 3) % 1;
          const px = x0 + f.dir * box.w * (0.25 + i * 0.25) * k;
          const py = box.y + box.h * 0.6 - u * 50;
          ctx.globalAlpha = fade * Math.sin(u * Math.PI) * 0.8;
          skull(ctx, px, py, 5, '#e6ffd0');
        }
        return true;
      }
      // Each target chokes in a green puff.
      const cy = y - (f.h ?? 24) / 2;
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU + f.seed * 3;
        ctx.fillStyle = i % 2 ? c.main : c.deep;
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 12 * ease(p), cy + Math.sin(a) * 9 * ease(p), 5 * (1 - p) + 2, 0, TAU);
        ctx.fill();
      }
      return true;
    }
    case 'toxicblaze': {
      const c = SCHOOL_COLORS.poison;
      if (box) {
        // A wall of venom-green fire sweeps forward across the area, then gutters out.
        const k = ease(Math.min(1, p * 1.6));
        const fade = p > 0.65 ? 1 - (p - 0.65) / 0.35 : 1;
        const gy = box.y + box.h / 2 + 30;
        const x0 = f.dir > 0 ? box.x : box.x + box.w;
        // Purple venom smoke boils up behind the green flames.
        for (let i = 0; i < 8; i++) {
          const px = x0 + f.dir * box.w * k * ((i + 0.5) / 8);
          glow(ctx, px, gy - 30 - Math.sin(time * 3 + i) * 6, 26, '#9b4fe0', fade * 0.45);
        }
        flameWall(ctx, x0, gy, box.w * k, 50, f.dir, time, ['#7a3fc4', '#8fe04f', '#f4ffd8'], fade * 0.95);
        // The leading edge burns hottest.
        glow(ctx, x0 + f.dir * box.w * k, gy - 24, 40, c.main, fade * 0.6);
        for (let i = 0; i < 10; i++) {
          const u = (p * 2 + rand(i)) % 1;
          ctx.globalAlpha = fade * (1 - u);
          ctx.fillStyle = i % 2 ? '#b46bff' : '#c9ff9b';
          ctx.fillRect(Math.round(x0 + f.dir * box.w * k * rand(i * 3)), Math.round(gy - 10 - u * 60), 2, 2);
        }
        return true;
      }
      const cy = y - (f.h ?? 24) / 2;
      glow(ctx, x, cy, 24 * (1 - p) + 6, c.main, 1 - p);
      flameWall(ctx, x - 12, y, 24, 30 * (1 - p) + 8, 1, time, ['#7a3fc4', '#8fe04f', '#f4ffd8'], 1 - p);
      return true;
    }
    case 'shiningray': {
      const c = SCHOOL_COLORS.holy;
      if (box) {
        // A great cross of light flares around the caster, with rays wheeling outward.
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        const k = ease(Math.min(1, p * 2.5));
        const fade = p > 0.5 ? 1 - (p - 0.5) / 0.5 : 1;
        glow(ctx, cx, cy, 70 * k, '#ffffff', fade * 0.6);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(p * 0.6);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * TAU;
          const len = (i % 3 === 0 ? box.w * 0.55 : box.w * 0.32) * k;
          const w = i % 3 === 0 ? 7 : 3;
          ctx.save();
          ctx.rotate(a);
          const g = ctx.createLinearGradient(0, 0, len, 0);
          g.addColorStop(0, `rgba(255,255,255,${fade})`);
          g.addColorStop(0.6, `rgba(255,227,107,${fade * 0.7})`);
          g.addColorStop(1, 'rgba(255,227,107,0)');
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(0, -w / 2);
          ctx.lineTo(len, 0);
          ctx.lineTo(0, w / 2);
          ctx.fill();
          ctx.restore();
        }
        ctx.restore();
        ctx.globalAlpha = fade;
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 30, box.w * 0.45 * k, 10 * k, 0, 0, TAU);
        ctx.stroke();
        return true;
      }
      const cy = y - (f.h ?? 24) / 2;
      ctx.globalAlpha = 1 - p;
      const s = 6 + ease(p) * 14;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 1.5, cy - s, 3, s * 2);
      ctx.fillRect(x - s, cy - 1.5, s * 2, 3);
      sparkle(ctx, x, cy, 9 * (1 - p) + 2, c.main);
      // Holy light lands in rounded petals rather than spikes.
      ctx.globalAlpha = 1;
      bloom(ctx, x, cy, 14 * ease(Math.min(1, p * 3)), 5, 0.3 + p, c.main, '#ffffff', p * 2);
      return true;
    }
    case 'tempest': {
      if (box) {
        // The whole screen freezes over: an icy tint, a driving blizzard, and lightning flashes.
        const a = Math.sin(Math.PI * Math.min(1, p * 1.15));
        ctx.globalAlpha = 0.32 * a;
        ctx.fillStyle = '#6fa8d8';
        wash(ctx);
        ctx.globalAlpha = 0.85 * a;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        for (let i = 0; i < 70; i++) {
          const sx = ((rand(i) * 760 + time * 520) % 760) - 60;
          const sy = (rand(i * 3.7) * 400 + time * 300) % 400 - 20;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 9, sy - 5);
          ctx.stroke();
        }
        if ((p > 0.3 && p < 0.36) || (p > 0.55 && p < 0.6)) {
          ctx.globalAlpha = 0.45;
          ctx.fillStyle = '#ffffff';
          wash(ctx);
        }
        return true;
      }
      // An ice lance plunges down at a slant, lightning follows it in, then the ice bursts.
      const hit = 0.45;
      const cy = y - (f.h ?? 24) / 2;
      if (p < hit) {
        const k = p / hit;
        const lx = x + 110 * (1 - k);
        const ly = cy - 240 * (1 - k);
        const ang = Math.atan2(240, -110);
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(ang);
        const g = ctx.createLinearGradient(-60, 0, 0, 0);
        g.addColorStop(0, 'rgba(232,251,255,0)');
        g.addColorStop(1, 'rgba(143,227,255,0.85)');
        ctx.fillStyle = g;
        ctx.fillRect(-60, -3, 60, 6);
        ctx.fillStyle = '#e8fbff';
        ctx.strokeStyle = '#3f9fd8';
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(-4, -5);
        ctx.lineTo(-22, -2);
        ctx.lineTo(-22, 2);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else {
        const k = (p - hit) / (1 - hit);
        const z = zap(k * (1 - hit) * f.dur);
        if (k < 0.4 && !z.blank) {
          ctx.globalAlpha = z.fresh ? 1 : 1 - k / 0.4;
          bolt(ctx, x + (f.seed - 0.5) * 30, cy - 160, x, cy, f.seed * 40 + z.seed, '#ffe86b', 3, 8, z.fresh);
        }
        ctx.globalAlpha = 1 - k;
        spike(ctx, x - 9, y + 2, 4, 22, 1 - k * 0.5, -3);
        spike(ctx, x + 9, y + 2, 4, 26, 1 - k * 0.5, 3);
        spike(ctx, x, y + 2, 6, 36, 1 - k * 0.5);
        ctx.strokeStyle = '#e8fbff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 10 + 40 * k, 4 + 12 * k, 0, 0, TAU);
        ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * TAU;
          snowflake(ctx, x + Math.cos(a) * 30 * k, cy + Math.sin(a) * 20 * k, 3 * (1 - k) + 1, '#ffffff', k * 4 + i);
        }
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

function skull(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.fillRect(x - r * 0.6, y + r * 0.5, r * 1.2, r * 0.7);
  ctx.fillStyle = '#2f5a1f';
  ctx.fillRect(Math.round(x - r * 0.55), Math.round(y - r * 0.1), 2, 2);
  ctx.fillRect(Math.round(x + r * 0.15), Math.round(y - r * 0.1), 2, 2);
}
