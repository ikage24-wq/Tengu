// Weapon-skill effects for warriors, archers, and thieves: power flares, charges, sword waves,
// the Paladin's light (a shield of light, pillars from the sky, a holy ring) and the Berserker's
// rage bursts,
// whirlwinds, quakes, X-slashes, beams, smoke, claw marks, and the screen-wide ultimates (a rain
// of swords, arrows, stars, or coins; a dragon; a hammer of light; a spirit stampede; a blade
// storm). Like the spell effects, everything is drawn from progress `p` (0-1) and a seed, colored
// by the skill's school. (x, y) is a monster's feet for per-target effects, the player's otherwise.

import { SCHOOL_COLORS } from './spells.js';
import { drawArcheryShot, drawArchery, windRainPiece } from './archery.js';
import { ghost, wash, needle, bloom, shardRing, shock, starFlash, crescent, stepped, easeOut, easeIn, deep, inked } from './fxkit.js';

const TAU = Math.PI * 2;
const ease = (p) => 1 - (1 - p) * (1 - p);
const rand = (n) => {
  const v = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return v - Math.floor(v);
};
const colors = (f) => SCHOOL_COLORS[f.school] ?? SCHOOL_COLORS.steel;

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

// A four-pointed throwing star.
function star(ctx, x, y, r, rot, color, core) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const rr = i % 2 ? r * 0.32 : r;
    ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.22, 0, TAU);
  ctx.fill();
  ctx.restore();
}

// A gold coin seen at an angle as it spins (`spin` 0-1 squashes it edge-on).
function coin(ctx, x, y, r, spin) {
  const w = Math.max(0.15, Math.abs(Math.cos(spin * TAU))) * r;
  ctx.fillStyle = '#c98a2b';
  ctx.beginPath();
  ctx.ellipse(x, y + 1, w, r, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath();
  ctx.ellipse(x, y, w, r, 0, 0, TAU);
  ctx.fill();
  if (w > r * 0.4) {
    ctx.fillStyle = '#fff6c9';
    ctx.fillRect(Math.round(x - w * 0.3), Math.round(y - r * 0.5), Math.max(1, Math.round(w * 0.25)), Math.round(r));
  }
}

// A spectral sword pointing down; (x, y) is its tip.
function sword(ctx, x, y, len, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = c.light;
  ctx.strokeStyle = c.deep;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-3, -len * 0.18);
  ctx.lineTo(-3, -len * 0.75);
  ctx.lineTo(3, -len * 0.75);
  ctx.lineTo(3, -len * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = c.main;
  ctx.fillRect(-8, -len * 0.8, 16, 3);
  ctx.fillStyle = c.deep;
  ctx.fillRect(-1.5, -len, 3, len * 0.2);
  ctx.restore();
}

// An arrow pointing along angle `a`; (x, y) is its head.
function arrow(ctx, x, y, a, len, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(a);
  const k = Math.max(1, len / 16);
  // A glowing streak behind, then the shaft, head, and fletching.
  const g = ctx.createLinearGradient(-len * 2, 0, 0, 0);
  g.addColorStop(0, 'rgba(255,255,255,0)');
  g.addColorStop(1, c.main);
  ctx.strokeStyle = g;
  ctx.lineWidth = 4 * k;
  ctx.beginPath();
  ctx.moveTo(-len * 2, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.strokeStyle = c.light;
  ctx.lineWidth = 2 * k;
  ctx.beginPath();
  ctx.moveTo(-len, 0);
  ctx.lineTo(0, 0);
  ctx.stroke();
  ctx.fillStyle = c.deep;
  ctx.beginPath();
  ctx.moveTo(5 * k, 0);
  ctx.lineTo(-3 * k, -4 * k);
  ctx.lineTo(-3 * k, 4 * k);
  ctx.fill();
  ctx.fillStyle = c.main;
  ctx.fillRect(-len, -3.5 * k, 6 * k, 2 * k);
  ctx.fillRect(-len, 1.5 * k, 6 * k, 2 * k);
  ctx.restore();
}

// ---------- Projectiles ----------

export function drawStrikeShot(ctx, f, x, y, dir, time) {
  const c = colors(f);
  switch (f.shot) {
    case 'wave': {
      // A giant crescent of force: a bright edge, a soft body, and streaks peeling off behind.
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      glow(ctx, 0, 0, 30, c.main, 0.5);
      ctx.fillStyle = c.main;
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(-14, 0, 26, -1.15, 1.15);
      ctx.arc(-24, 0, 22, 1.0, -1.0, true);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(-14, 0, 26, -1.05, 1.05);
      ctx.stroke();
      for (let i = 0; i < 4; i++) {
        ctx.globalAlpha = 0.6 - i * 0.12;
        ctx.fillStyle = c.light;
        ctx.fillRect(-30 - i * 12, -14 + i * 9 + Math.sin(time * 20 + i) * 2, 10, 1.5);
      }
      ctx.restore();
      return true;
    }
    case 'bigarrow': {
      // An arrow wrapped in a spiral of its school's energy.
      ctx.save();
      const g = ctx.createLinearGradient(x - dir * 46, y, x, y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, c.main);
      ctx.strokeStyle = g;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x - dir * 46, y);
      ctx.lineTo(x, y);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        const k = i / 6;
        ctx.fillStyle = i % 2 ? c.light : c.main;
        ctx.fillRect(Math.round(x - dir * k * 40), Math.round(y + Math.sin(time * 40 + k * 9) * 5), 2, 2);
      }
      glow(ctx, x, y, 10, c.light, 0.8);
      arrow(ctx, x, y, dir > 0 ? 0 : Math.PI, 16, c);
      ctx.restore();
      return true;
    }
    case 'bigstar': {
      ctx.save();
      glow(ctx, x, y, 16, c.main, 0.6);
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.35 - i * 0.08;
        star(ctx, x - dir * i * 9, y, 8, time * 25 - i, c.main, c.light);
      }
      ctx.globalAlpha = 1;
      star(ctx, x, y, 9, time * 25, c.deep, c.light);
      star(ctx, x, y, 6, time * 25, c.main, '#ffffff');
      ctx.restore();
      return true;
    }
    case 'coin': {
      ctx.save();
      glow(ctx, x, y, 10, '#ffe36b', 0.6);
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.3 - i * 0.07;
        coin(ctx, x - dir * i * 8, y, 5, time * 3);
      }
      ctx.globalAlpha = 1;
      coin(ctx, x, y, 5.5, time * 3);
      ctx.restore();
      return true;
    }
    case 'feather': {
      // A hawk's lightning-edged feather dart.
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(dir, 1);
      glow(ctx, 0, 0, 12, '#ffe86b', 0.5);
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.ellipse(-6, 0, 10, 3, 0, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = '#ffe86b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-16, 0);
      ctx.lineTo(4, 0);
      ctx.stroke();
      ctx.restore();
      return true;
    }
    default:
      return drawArcheryShot(ctx, f, x, y, dir, time);
  }
}

// ---------- Area and per-target effects ----------

export function drawStrike(ctx, f, x, y, p, cam, time) {
  if (f.t < 0) return true;
  const c = colors(f);
  const box = f.box ? { x: f.box.x - cam.x, y: f.box.y - cam.y, w: f.box.w, h: f.box.h } : null;
  switch (f.kind) {
    case 'powerup': {
      // A burst of power from the feet: a ground ring and streaks shooting upward.
      const k = Math.min(1, p * 3);
      const a = p > 0.6 ? (1 - p) / 0.4 : 1;
      glow(ctx, x, y - 20, (f.big ? 46 : 30) * ease(k), c.main, a * 0.5);
      ctx.globalAlpha = a;
      ctx.strokeStyle = c.light;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(x, y - 1, (f.big ? 34 : 22) * ease(k), (f.big ? 8 : 5) * ease(k), 0, 0, TAU);
      ctx.stroke();
      for (let i = 0; i < (f.big ? 12 : 7); i++) {
        const sx = x + (rand(i * 3.1) - 0.5) * (f.big ? 56 : 36);
        const u = (p * 1.8 + rand(i)) % 1;
        const len = 8 + rand(i * 7) * 14;
        ctx.globalAlpha = a * (1 - u);
        ctx.fillStyle = i % 2 ? c.main : c.light;
        ctx.fillRect(Math.round(sx), Math.round(y - 4 - u * (f.big ? 80 : 50) - len), 2, len);
      }
      return true;
    }
    case 'chargetrail': {
      // Speed lines and a shock cone along the dash, kicking up dust behind.
      const tx = f.tx - cam.x;
      const fade = 1 - p;
      ctx.globalAlpha = fade;
      const g = ctx.createLinearGradient(x, 0, tx, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, c.main);
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(x, tx), y - 34, Math.abs(tx - x), 30);
      for (let i = 0; i < 9; i++) {
        const ly = y - 6 - rand(i * 2.3) * 34;
        const lx = x + (tx - x) * rand(i * 5.7);
        ctx.fillStyle = i % 2 ? '#ffffff' : c.light;
        ctx.fillRect(Math.round(Math.min(lx, lx - f.dir * 24)), Math.round(ly), 24, 1.5);
      }
      // Afterimages along the path, the oldest vanishing first.
      for (let i = 0; i < 3; i++) {
        const left = 0.18 + i * 0.1 - p;
        if (left <= 0) continue;
        ctx.globalAlpha = 0.75;
        ghost(ctx, x + (tx - x) * (0.25 + i * 0.25), y, 0.9 * Math.min(1, left / 0.08), i === 2 ? '#ffffff' : c.main);
      }
      ctx.globalAlpha = 1 - p;
      // The shockwave cone in front of where you stopped.
      ctx.strokeStyle = c.light;
      ctx.lineWidth = 3 * fade + 1;
      ctx.beginPath();
      ctx.arc(tx - f.dir * 4, y - 18, 12 + ease(p) * 16, f.dir > 0 ? -1.1 : Math.PI - 1.1, f.dir > 0 ? 1.1 : Math.PI + 1.1);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.globalAlpha = fade * 0.6;
        ctx.fillStyle = '#e8d8c8';
        ctx.beginPath();
        ctx.arc(x + (tx - x) * (i / 6) - f.dir * p * 10, y - 3 - p * 6 * rand(i), 3 + p * 5, 0, TAU);
        ctx.fill();
      }
      return true;
    }
    case 'vortex': {
      if (!box) return true;
      // A whirlwind of blades: spinning crescent arcs layered around the area, with motes flung out.
      const cx = box.x + box.w / 2;
      const cy = box.y + box.h / 2;
      const k = ease(Math.min(1, p * 2));
      const fade = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
      for (let ring = 0; ring < 3; ring++) {
        const rx = (box.w / 2) * (0.45 + ring * 0.25) * k;
        const ry = (box.h / 2) * (0.35 + ring * 0.2) * k;
        const spin = time * (14 - ring * 3) * (ring % 2 ? -1 : 1);
        ctx.globalAlpha = fade * (0.9 - ring * 0.2);
        ctx.strokeStyle = ring === 1 ? c.light : c.main;
        ctx.lineWidth = 4 - ring;
        ctx.lineCap = 'round';
        for (let arc = 0; arc < 2; arc++) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, spin + arc * Math.PI, spin + arc * Math.PI + 1.6);
          ctx.stroke();
        }
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU + time * 6;
        const d = (box.w / 2) * k * (0.6 + rand(i) * 0.5);
        ctx.globalAlpha = fade;
        if (f.school === 'sakura') petal(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.45, a, c);
        else sparkle(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.45, 2.5, i % 2 ? '#ffffff' : c.main);
      }
      return true;
    }
    case 'pillar': {
      // A pillar of light from the sky, in order (holy light comes from above and plays one step
      // after another): a thin ray drops onto the monster, snaps open into a column that flares
      // at its foot with a bloom, then narrows and breaks into slices from the top down while
      // light diamonds float up.
      const top = y - 130;
      const cy = y - (f.h ?? 24) / 2;
      if (p < 0.14) {
        const k = stepped(p / 0.14, 4);
        const bottom = top + (y - top) * k;
        ctx.fillStyle = c.deep;
        ctx.fillRect(Math.round(x - 2.5), top, 5, bottom - top);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(Math.round(x - 1), top, 2, bottom - top);
        return true;
      }
      const k = (p - 0.14) / 0.86;
      const open = k < 0.06 ? 1.3 : 1;
      const w = 9 * open * (1 - easeIn(Math.max(0, (k - 0.3) / 0.7)));
      // The column: a tall wedge, narrow at the sky and wide at the foot, in four nested tones.
      const slices = 8;
      const gone = Math.max(0, (k - 0.4) / 0.6);
      for (let i = 0; i < slices; i++) {
        const u0 = i / slices;
        const u1 = (i + 1) / slices;
        // Slices near the top go first, and each shrinks to a sliver before it vanishes.
        const keep = 1 - Math.min(1, Math.max(0, gone * 1.6 - (1 - u0) * 0.6) * 1.4);
        if (keep <= 0.05 || w <= 0.4) continue;
        const y0 = top + (y - top) * u0;
        const y1 = y0 + (y - top) * (u1 - u0) * keep;
        const band = (k2, color) => {
          const w0 = w * k2 * (0.45 + 0.55 * u0);
          const w1 = w * k2 * (0.45 + 0.55 * u1);
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x - w0, y0);
          ctx.lineTo(x + w0, y0);
          ctx.lineTo(x + w1, y1);
          ctx.lineTo(x - w1, y1);
          ctx.closePath();
          ctx.fill();
        };
        if (inked(ctx)) band(1.18, deep(c.deep));
        band(1, c.main);
        band(0.66, c.light);
        band(0.28, '#ffffff');
      }
      if (k < 0.5) {
        const b = stepped(k / 0.5, 6);
        bloom(ctx, x, y - 6, 15 * (0.7 + b * 0.6), 6, f.seed * 3, c.main, '#ffffff', 0.5 + b * 1.4);
        shock(ctx, x, y - 1, 10 + 20 * easeOut(b), 2 + 3.5 * easeOut(b), 3 * (1 - b), c.main);
      }
      if (k > 0.05 && k < 0.3) bloom(ctx, x, cy, 9 * (1 - (k - 0.05) / 0.25) + 2, 4, f.seed * 5 + 0.4, c.light, '#ffffff', 1);
      // Diamonds of light drifting up, slowing as they go (light rises; it doesn't fall).
      for (let i = 0; i < 5; i++) {
        const u = Math.max(0, k - 0.15 - i * 0.06);
        if (u <= 0 || u >= 0.7) continue;
        const d = easeOut(u / 0.7);
        const r = 3 * (1 - d) + 0.6;
        const dx = x + (rand(i * 5.3 + f.seed * 7) - 0.5) * 34;
        const dy = y - 6 - d * (40 + rand(i * 2.1) * 30);
        diamond(ctx, dx, dy, r, i % 2 ? c.main : '#ffffff');
      }
      return true;
    }
    case 'aegis': {
      // A shield of light snaps up in front of the shove (overshooting as it opens), holds for the
      // blow, then cracks into shards that fly off ahead.
      const sx = x;
      const sy = y - 22;
      const dir = f.dir || 1;
      if (p < 0.5) {
        const g = p < 0.08 ? 0.5 + (p / 0.08) * 0.7 : p < 0.16 ? 1.2 - ((p - 0.08) / 0.08) * 0.2 : 1;
        const rx = 7 * g;
        const ry = 19 * g;
        if (inked(ctx)) {
          ctx.fillStyle = deep(c.deep);
          ctx.beginPath();
          ctx.ellipse(sx, sy, rx + 1.4, ry + 1.4, 0, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = c.main;
        ctx.beginPath();
        ctx.ellipse(sx, sy, rx, ry, 0, 0, TAU);
        ctx.fill();
        ctx.fillStyle = c.light;
        ctx.beginPath();
        ctx.ellipse(sx + dir * rx * 0.2, sy, rx * 0.72, ry * 0.8, 0, 0, TAU);
        ctx.fill();
        // The emblem: a gold diamond with a white heart, and a glint across the upper face.
        diamond(ctx, sx + dir * rx * 0.2, sy, 5 * g, c.deep);
        diamond(ctx, sx + dir * rx * 0.2, sy, 2.6 * g, '#ffffff');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(sx + dir * rx * 0.1 - 1, sy - ry * 0.7, 2, ry * 0.35);
        // The push: a ring rolling forward off the face.
        const k = Math.max(0, (p - 0.08) / 0.42);
        if (k > 0) shock(ctx, sx + dir * (4 + 16 * easeOut(k)), sy, 3 + 4 * easeOut(k), ry * (1 + 0.3 * k), 2.5 * (1 - k), c.light);
        return true;
      }
      const k = (p - 0.5) / 0.5;
      for (let i = 0; i < 7; i++) {
        const a = (i / 6 - 0.5) * 2.2;
        const d = easeOut(k) * (18 + rand(i * 4.1 + f.seed) * 16);
        const px = sx + dir * Math.cos(a) * d;
        const py = sy + Math.sin(a) * d * 1.4 + k * k * 10;
        const r = 4 * (1 - k) + 0.3;
        ctx.globalAlpha = 1;
        diamond(ctx, px, py, r, i % 2 ? c.main : c.light);
      }
      return true;
    }
    case 'consecrate': {
      // Hallowed ground: a flash of light where the blade goes in, two flat rings of light racing
      // out over the floor (thin, so the fighters stay clear in front of them), and diamond runes
      // that stand on the outer ring and then lift away as it settles.
      const R = f.r ?? 110;
      const ring = easeOut(Math.min(1, p / 0.32));
      const fade = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
      if (p < 0.22) {
        const b = stepped(p / 0.22, 5);
        bloom(ctx, x, y - 10, 26 * (0.6 + b * 0.5), 8, f.seed * 3, c.main, '#ffffff', 0.5 + b * 1.4);
      }
      const rx = 12 + (R - 12) * ring;
      shock(ctx, x, y - 1, rx, rx * 0.12, (4 * (1 - ring) + 1.6) * fade, c.main);
      shock(ctx, x, y - 1, rx * 0.7, rx * 0.7 * 0.12, 1.4 * fade, '#ffffff');
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.15;
        const lift = Math.max(0, (p - 0.35) / 0.65);
        const px = x + Math.cos(a) * rx;
        const py = y - 3 + Math.sin(a) * rx * 0.12 - easeOut(lift) * (20 + rand(i + f.seed) * 26);
        diamond(ctx, px, py, (3.2 * (1 - lift) + 0.4) * Math.min(1, ring * 1.5), i % 2 ? '#ffffff' : c.main);
      }
      return true;
    }
    case 'verdict': {
      // Grand Verdict: a giant sword of light drops out of the sky and buries its point in the
      // ground, a flash and a cross of light burst from the impact while flat rings race out, it
      // stands glowing while diamonds of light rise, then it breaks apart from the hilt down.
      const R = f.r ?? 170;
      const drop = 0.1;
      const k = Math.min(1, p / drop);
      const dy = -240 * (1 - k * k);
      const breakUp = Math.max(0, (p - 0.62) / 0.38);
      const blade = (W, top, bottom, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x - W, top);
        ctx.lineTo(x + W, top);
        ctx.lineTo(x + W * 0.8, bottom - W * 1.6);
        ctx.lineTo(x, bottom);
        ctx.lineTo(x - W * 0.8, bottom - W * 1.6);
        ctx.closePath();
        ctx.fill();
      };
      // The sword, cut into bands that vanish from the hilt end as it breaks up.
      const top = y - 210 + dy;
      const bottom = y + 6 + dy;
      const cut = top + (bottom - top) * Math.min(1, breakUp * 1.2);
      const shrink = 1 - easeIn(breakUp);
      if (shrink > 0.05) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 90, cut, 180, bottom - cut + 2);
        ctx.clip();
        if (inked(ctx)) blade(22 * shrink + 2, top, bottom + 2, deep(c.deep));
        blade(22 * shrink, top, bottom, c.main);
        blade(15 * shrink, top, bottom - 6, c.light);
        blade(5 * shrink, top, bottom - 14, '#ffffff');
        // The cross-guard and hilt.
        if (cut < top) {
          // A broad cross-guard swept up at the ends like wings, a grip, and a diamond pommel.
          const gy = top - 6;
          const guard = (gw, gh, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x - gw, gy - gh * 1.6);
            ctx.quadraticCurveTo(x - gw * 0.5, gy + gh * 0.2, x, gy + gh * 0.6);
            ctx.quadraticCurveTo(x + gw * 0.5, gy + gh * 0.2, x + gw, gy - gh * 1.6);
            ctx.quadraticCurveTo(x + gw * 0.5, gy + gh * 1.6, x, gy + gh * 1.9);
            ctx.quadraticCurveTo(x - gw * 0.5, gy + gh * 1.6, x - gw, gy - gh * 1.6);
            ctx.fill();
          };
          if (inked(ctx)) guard(54 * shrink + 2, 8 + 1.5, deep(c.deep));
          guard(54 * shrink, 8, c.deep);
          guard(48 * shrink, 5, c.main);
          ctx.fillStyle = c.main;
          ctx.fillRect(x - 6 * shrink, gy - 34, 12 * shrink, 30);
          ctx.fillStyle = c.light;
          ctx.fillRect(x - 2 * shrink, gy - 34, 4 * shrink, 30);
          diamond(ctx, x, gy - 40, 9 * shrink, '#ffffff');
          diamond(ctx, x, gy + 6, 7 * shrink, '#ffffff');
        }
        ctx.restore();
      }
      if (p >= drop) {
        const i = (p - drop) / (1 - drop);
        if (i < 0.18) {
          const b = stepped(i / 0.18, 4);
          bloom(ctx, x, y - 16, 46 * (0.6 + b * 0.6), 8, f.seed * 3, c.main, '#ffffff', 0.5 + b * 1.4);
          // A cross of light: long thin rays out along the ground and up the blade.
          needle(ctx, x + 10 + 120 * b, y - 8, 0, 60 * (1 - b) + 8, 6 * (1 - b) + 1, c.main, '#ffffff');
          needle(ctx, x - 10 - 120 * b, y - 8, Math.PI, 60 * (1 - b) + 8, 6 * (1 - b) + 1, c.main, '#ffffff');
        }
        const r1 = easeOut(Math.min(1, i / 0.4));
        const fade = 1 - Math.max(0, (i - 0.5) / 0.5);
        shock(ctx, x, y - 1, 20 + R * r1, (20 + R * r1) * 0.12, (6 * (1 - r1) + 1.5) * fade, c.main);
        shock(ctx, x, y - 1, (20 + R * r1) * 0.66, (20 + R * r1) * 0.08, 2 * fade, '#ffffff');
        for (let j = 0; j < 9; j++) {
          const u = Math.max(0, i - 0.12 - j * 0.04);
          if (u <= 0 || u >= 0.8) continue;
          const d = easeOut(u / 0.8);
          const dx = x + (rand(j * 4.3 + f.seed * 9) - 0.5) * R * 1.4;
          diamond(ctx, dx, y - 8 - d * (50 + rand(j * 1.7) * 60), 4 * (1 - d) + 0.6, j % 2 ? c.main : '#ffffff');
        }
      }
      return true;
    }
    case 'bloodmoon': {
      // The Berserker's moon: at the top of Crimson Eclipse a blood-red moon rises behind the axe,
      // a dark bite across it, then it's swallowed as the smash comes down.
      const mx = x - (f.dir || 1) * 8;
      const my = y - 120;
      const g = p < 0.15 ? easeOut(p / 0.15) * 1.15 : p < 0.25 ? 1.15 - ((p - 0.15) / 0.1) * 0.15 : 1;
      const out = Math.max(0, (p - 0.55) / 0.45);
      const r = 30 * g * (1 - easeIn(out));
      if (r <= 0.5) return true;
      if (inked(ctx)) {
        ctx.fillStyle = '#3a0814';
        ctx.beginPath();
        ctx.arc(mx, my, r + 2, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = '#c8243a';
      ctx.beginPath();
      ctx.arc(mx, my, r, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ff5a4a';
      ctx.beginPath();
      ctx.arc(mx - r * 0.18, my - r * 0.2, r * 0.74, 0, TAU);
      ctx.fill();
      // The bite of the eclipse, sliding across.
      ctx.fillStyle = '#4a0a1e';
      ctx.beginPath();
      ctx.arc(mx + r * (0.9 - 0.5 * Math.min(1, p / 0.5)), my - r * 0.1, r * 0.82, 0, TAU);
      ctx.fill();
      // A thin bright rim on the lit edge.
      ctx.strokeStyle = '#ffd27a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mx, my, r - 0.75, Math.PI * 0.6, Math.PI * 1.35);
      ctx.stroke();
      return true;
    }
    case 'eclipse': {
      // The crash under the red moon: a giant crimson crescent cut down through the impact, a
      // jagged flash, a ring of shards and red rings racing over the floor, embers flung wide.
      const R = f.r ?? 175;
      const dir = f.dir || 1;
      const cy = y - 20;
      if (p < 0.3) {
        const k = stepped(p / 0.3, 5);
        const a0 = dir > 0 ? -Math.PI * 0.85 : -Math.PI * 0.15;
        const a1 = dir > 0 ? Math.PI * 0.25 : Math.PI * 0.75;
        crescent(ctx, x, cy - 10, 70, a0, a0 + (a1 - a0) * Math.min(1, k * 1.6), 26 * (1 - k * 0.6), '#f0303f', '#ffd27a');
        starFlash(ctx, x + dir * 20, y - 10, 70 * (k < 0.2 ? 0.7 : 1 - k * 0.5), 8, f.seed * 6, c.main, '#ffffff', 12 * (1 - k));
      }
      const r1 = easeOut(Math.min(1, p / 0.45));
      const fade = 1 - Math.max(0, (p - 0.5) / 0.5);
      shock(ctx, x, y - 1, 20 + R * r1, (20 + R * r1) * 0.12, (6 * (1 - r1) + 1.5) * fade, '#f0303f');
      shardRing(ctx, x, cy, 16 + R * 0.7 * r1, 9 * (1 - r1), 11, f.seed, f.seed * 4, p < 0.4 ? c.main : c.deep);
      for (let i = 0; i < 16; i++) {
        const a = -Math.PI * (0.05 + 0.9 * rand(i * 2.9 + f.seed * 13));
        const d = easeOut(p) * (30 + rand(i * 7.1 + f.seed) * R);
        if (p > 0.85) continue;
        needle(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d + p * p * 30, a, 12 * (1 - p) + 1, 3 * (1 - p) + 0.6, i % 3 ? c.main : '#ffb347', c.light);
      }
      return true;
    }
    case 'gather': {
      // Power gathering before a big blow, at the weapon hand: a ring of the school's colour that
      // closes in on it, motes pulled in along with it (embers for rage, diamonds of light for
      // holy), and a small soft orb that swells until the blow lands.
      const cx = x + (f.dir || 1) * 9;
      const cy = y - 22;
      const ring = 1 - easeIn(p);
      shock(ctx, cx, cy, 6 + (f.big ? 34 : 24) * ring, (6 + (f.big ? 34 : 24) * ring) * 0.85, 1 + 2 * p, c.main);
      const n = f.big ? 10 : 7;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + f.dir * p * 2;
        const u = (p * 1.6 + rand(i * 1.9)) % 1;
        const d = (f.big ? 40 : 30) * (1 - easeIn(u));
        const px = cx + Math.cos(a) * d;
        const py = cy + Math.sin(a) * d * 0.8;
        if (f.school === 'holy') diamond(ctx, px, py, 1.8 * (0.5 + u), i % 2 ? '#ffffff' : c.main);
        else needle(ctx, px, py, a + Math.PI, 4 + 6 * u, 1.8, i % 3 ? c.main : '#ffb347', c.light);
      }
      const orb = (f.big ? 7 : 5) * easeIn(p) + 1.5;
      ctx.fillStyle = c.main;
      ctx.beginPath();
      ctx.arc(cx, cy, orb + 1.2, 0, TAU);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, orb * 0.6, 0, TAU);
      ctx.fill();
      return true;
    }
    case 'ragehit': {
      // A Berserker's blow: a brutal red gash torn across the target along the swing (it shoots
      // out from the middle, then thins to a line), a jagged flash under it, shards flung the way
      // the blow went, and a dark ring.
      const cy = y - (f.h ?? 24) / 2;
      const dir = f.dir || 1;
      const big = f.big ? 1.5 : 1;
      const open = easeOut(Math.min(1, p / 0.25));
      const thin = Math.max(0, 1 - p * 1.6);
      if (p < 0.3) starFlash(ctx, x, cy, 14 * big * (0.6 + 0.6 * open) * (1 - p / 0.3), 5, f.seed * 6, '#f0303f', '#ffd27a', 3.5 * big * (1 - p / 0.3));
      const ang = dir > 0 ? -0.55 : Math.PI + 0.55;
      const len = 26 * big * open;
      if (thin > 0) {
        for (const [w, color] of [[6 * big * thin + 1.5, '#5a0a1e'], [4.4 * big * thin + 0.8, '#f0303f'], [1.6 * big * thin + 0.3, '#fff0d0']]) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.moveTo(x - Math.cos(ang) * len, cy - Math.sin(ang) * len);
          ctx.quadraticCurveTo(x - Math.sin(ang) * w, cy + Math.cos(ang) * w, x + Math.cos(ang) * len, cy + Math.sin(ang) * len);
          ctx.quadraticCurveTo(x + Math.sin(ang) * w, cy - Math.cos(ang) * w, x - Math.cos(ang) * len, cy - Math.sin(ang) * len);
          ctx.fill();
        }
      }
      shock(ctx, x, cy, 6 + 20 * big * easeOut(p), (6 + 20 * big * easeOut(p)) * 0.8, 2.4 * (1 - p), '#c8243a');
      for (let i = 0; i < (f.big ? 7 : 5); i++) {
        const a = (dir > 0 ? 0 : Math.PI) + (rand(i * 3.7 + f.seed * 11) - 0.5) * 2.2;
        const d = easeOut(p) * (14 + rand(i * 2.3) * 18) * big;
        needle(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d + p * p * 10, a, (7 + 3 * big) * (1 - p) + 1, 2.4 * (1 - p) + 0.5, i % 2 ? '#f0303f' : '#ff8a3c', '#ffd27a');
      }
      return true;
    }
    case 'holyhit': {
      // A Paladin's blow: a four-pointed glint of light that swells past full size and settles
      // back as it fades, a thin golden ring, and diamonds lifting off the target.
      const cy = y - (f.h ?? 24) / 2;
      const big = f.big ? 1.45 : 1;
      const pop = p < 0.18 ? easeOut(p / 0.18) * 1.15 : 1.15 - 0.15 * easeOut(Math.min(1, (p - 0.18) / 0.2));
      const fade = 1 - easeIn(p);
      const r = 15 * big * pop * fade;
      if (r > 0.6) {
        const ray = (len, w, color) => {
          ctx.fillStyle = color;
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const a = (i * Math.PI) / 2 + f.seed;
            ctx.lineTo(x + Math.cos(a) * len, cy + Math.sin(a) * len);
            ctx.lineTo(x + Math.cos(a + Math.PI / 4) * w, cy + Math.sin(a + Math.PI / 4) * w);
          }
          ctx.closePath();
          ctx.fill();
        };
        if (inked(ctx)) ray(r + 1.5, r * 0.26 + 1.2, deep(c.deep));
        ray(r, r * 0.26, c.main);
        ray(r * 0.62, r * 0.16, '#ffffff');
      }
      shock(ctx, x, cy, 5 + 18 * big * easeOut(p), (5 + 18 * big * easeOut(p)) * 0.9, 2 * (1 - p), c.main);
      for (let i = 0; i < 3; i++) {
        const u = Math.max(0, p - i * 0.08);
        diamond(ctx, x + (rand(i + f.seed * 5) - 0.5) * 24, cy - easeOut(u) * 26, 2.6 * (1 - u) + 0.4, i % 2 ? '#ffffff' : c.main);
      }
      return true;
    }
    case 'rageburst': {
      // Rage breaks out of the blow: a jagged red flash, a ring of shards that scatters, and
      // embers flung up and out. (No dark contrast disc: hit-stop holds effects still, and a
      // held disc reads as a flat ball over the hero.)
      const R = Math.max(50, (f.r ?? 90) * 0.8);
      const cy = y - 14;
      const k = p;
      if (k < 0.3) {
        const s = stepped(k / 0.3, 5);
        starFlash(ctx, x, cy, R * 0.55 * (s < 0.2 ? 0.7 : 1 - s * 0.5), 7, f.seed * 6, c.main, '#ffffff', 8 * (1 - s));
      }
      ctx.globalAlpha = 1;
      shardRing(ctx, x, cy, 12 + R * easeOut(k), 7 * (1 - k), 9, f.seed, f.seed * 4, k < 0.5 ? c.main : c.deep);
      for (let i = 0; i < 11; i++) {
        const a = -Math.PI * (0.08 + 0.84 * rand(i * 2.9 + f.seed * 13));
        const d = easeOut(k) * (20 + rand(i * 7.1 + f.seed) * R * 0.8);
        const len = 9 * (1 - k) + 1;
        if (k > 0.85) continue;
        needle(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d + k * k * 18, a, len, 2.6 * (1 - k) + 0.6, i % 3 ? c.main : '#ffb347', c.light);
      }
      return true;
    }
    case 'quake': {
      if (box) {
        // A shockwave races along the ground with a crack of light, flinging rocks or thorns.
        const k = ease(Math.min(1, p * 1.8));
        const fade = p > 0.55 ? 1 - (p - 0.55) / 0.45 : 1;
        const gy = f.y - cam.y;
        const around = f.box.w > 0 && Math.abs(f.box.x + f.box.w / 2 - f.x) < 4;
        if (around) {
          // A spear (or fist) driven into the ground: an impact flash and rings racing outward.
          glow(ctx, x0Center(box), gy - 10, 46 * (1 - p) + 10, c.light, fade);
          for (let r = 0; r < 2; r++) {
            const rk = Math.max(0, k - r * 0.15);
            ctx.globalAlpha = fade * (1 - rk);
            ctx.strokeStyle = r ? c.light : c.main;
            ctx.lineWidth = 4 - r;
            ctx.beginPath();
            ctx.ellipse(x0Center(box), gy - 2, 10 + (box.w / 2) * rk, 3 + 12 * rk, 0, 0, TAU);
            ctx.stroke();
          }
        }
        const x0 = around ? box.x + box.w / 2 : f.dir > 0 ? box.x : box.x + box.w;
        const reach = around ? box.w / 2 : box.w;
        ctx.globalAlpha = fade;
        for (const side of around ? [-1, 1] : [f.dir]) {
          const front = x0 + side * reach * k;
          // The glowing crack.
          ctx.strokeStyle = c.light;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x0, gy);
          for (let i = 1; i <= 8; i++) ctx.lineTo(x0 + side * reach * k * (i / 8), gy + (rand(i * 3.3) - 0.5) * 4);
          ctx.stroke();
          // The wave crest: a hump of earth (or energy) rolling along.
          glow(ctx, front, gy - 10, 30, c.main, fade * 0.8);
          ctx.fillStyle = c.main;
          ctx.beginPath();
          ctx.ellipse(front, gy, 16, 16 * (1 - p * 0.4), 0, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = c.light;
          ctx.beginPath();
          ctx.ellipse(front - side * 3, gy, 8, 9 * (1 - p * 0.4), 0, Math.PI, 0);
          ctx.fill();
        }
        // Debris: rocks for earth, thorns for nature, embers for dragons.
        for (let i = 0; i < 18; i++) {
          const side = around ? (i % 2 ? 1 : -1) : f.dir;
          const dx = side * reach * k * rand(i * 4.7);
          const up = Math.sin(Math.min(1, p * 2 + rand(i)) * Math.PI) * (18 + rand(i) * 26);
          const px = x0 + dx;
          const py = gy - up;
          ctx.globalAlpha = fade;
          if (f.school === 'nature') thorn(ctx, px, gy, 4, up + 6, c);
          else if (f.school === 'dragon') glow(ctx, px, py, 5, i % 2 ? c.light : c.main, fade);
          else {
            ctx.fillStyle = i % 2 ? c.deep : c.main;
            ctx.fillRect(Math.round(px - 3), Math.round(py - 3), 5 + (i % 3) * 2, 5 + (i % 2) * 2);
            ctx.fillStyle = c.light;
            ctx.fillRect(Math.round(px - 2), Math.round(py - 2), 2, 2);
          }
        }
        return true;
      }
      // Each monster gets a burst of rubble (or thorns) from under its feet.
      const k = ease(p);
      ctx.globalAlpha = 1 - p;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * (0.15 + (i / 4) * 0.7);
        const d = k * (14 + rand(f.seed * 9 + i) * 10);
        ctx.fillStyle = i % 2 ? c.main : c.deep;
        ctx.fillRect(Math.round(x + Math.cos(a) * d - 2), Math.round(y - 4 + Math.sin(a) * d + p * p * 16), 4, 4);
      }
      return true;
    }
    case 'xslash': {
      // Two crossing slashes, one after the other, with a flash where they meet.
      const cy = y - (f.h ?? 24) / 2;
      const r = 14 + (f.h ?? 24) * 0.25;
      const cut = (k, flip) => {
        if (k <= 0) return;
        const e = ease(Math.min(1, k * 2));
        ctx.globalAlpha = Math.max(0, 1 - k);
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 5 * (1 - k) + 1;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - r * flip, cy - r);
        ctx.lineTo(x - r * flip + 2 * r * flip * e, cy - r + 2 * r * e);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2 * (1 - k) + 0.5;
        ctx.stroke();
      };
      cut(p, 1);
      cut(p - 0.15, -1);
      if (p > 0.15 && p < 0.5) glow(ctx, x, cy, 16, c.light, 1 - (p - 0.15) / 0.35);
      return true;
    }
    case 'beam': {
      if (!box) {
        const cy = y - (f.h ?? 24) / 2;
        glow(ctx, x, cy, 18 * (1 - p) + 4, c.light, 1 - p);
        return true;
      }
      // A straight beam blasting across the area: a white-hot core, a colored body, and rings
      // rippling outward along it. Ultimates span the whole screen.
      const full = f.box.w >= 600;
      const cy = full ? f.y - cam.y - 20 : box.y + box.h / 2;
      const x0 = full ? (f.dir > 0 ? f.x - cam.x + 8 : 0) : f.dir > 0 ? box.x : box.x + box.w;
      const len = full ? (f.dir > 0 ? 660 - x0 : f.x - cam.x - 8) : box.w;
      const grow = ease(Math.min(1, p * 4));
      const fade = p > 0.6 ? 1 - (p - 0.6) / 0.4 : 1;
      const th = (full ? 26 : f.school === 'dragon' ? 30 : 12) * (p < 0.15 ? p / 0.15 : 1) * (0.7 + 0.3 * fade);
      const xa = x0;
      const xb = x0 + f.dir * len * grow;
      ctx.globalAlpha = fade;
      glow(ctx, x0, cy, th * 2.2, c.light, fade);
      const g = ctx.createLinearGradient(0, cy - th, 0, cy + th);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.3, c.main);
      g.addColorStop(0.5, '#ffffff');
      g.addColorStop(0.7, c.main);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(Math.min(xa, xb), cy - th, Math.abs(xb - xa), th * 2);
      if (f.school === 'dragon') {
        // Flame tongues licking off the breath.
        for (let i = 0; i < 10; i++) {
          const fx = xa + f.dir * len * grow * rand(i * 2.1);
          const fh = th * (0.5 + rand(i) * 0.8) * (0.6 + 0.4 * Math.sin(time * 14 + i));
          ctx.fillStyle = i % 2 ? '#ffe36b' : '#ff8a3c';
          ctx.beginPath();
          ctx.ellipse(fx, cy - th * 0.6, 4, fh, 0, 0, TAU);
          ctx.fill();
        }
      }
      ctx.strokeStyle = c.light;
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const u = (p * 2 + i / 4) % 1;
        ctx.globalAlpha = fade * (1 - u);
        ctx.beginPath();
        ctx.ellipse(xa + f.dir * len * grow * u, cy, 3 + u * 3, th * 1.3, 0, 0, TAU);
        ctx.stroke();
      }
      if (full && p > 0.1 && p < 0.25) {
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ffffff';
        wash(ctx);
      }
      return true;
    }
    case 'smoke': {
      if (!box) return true;
      // A smoke bomb pops: a flash, then a rolling cloud with dizzy stars and threads of shadow.
      const cx = f.box.w && Math.abs(f.box.x + f.box.w / 2 - f.x) < 4 ? box.x + box.w / 2 : f.dir > 0 ? box.x + box.w * 0.4 : box.x + box.w * 0.6;
      const cy = box.y + box.h / 2 + 10;
      const k = ease(Math.min(1, p * 2.2));
      const fade = p > 0.55 ? 1 - (p - 0.55) / 0.45 : 1;
      if (p < 0.15) glow(ctx, cx, cy, 40, '#ffffff', 1 - p / 0.15);
      // Solid cartoon puffs: a darker underside, a lighter top, drifting up as they spread.
      for (const [dy, scale, color] of [[4, 1, '#8a82a6'], [-3, 0.82, '#c9c2dc'], [-7, 0.5, '#ece8f4']]) {
        ctx.globalAlpha = fade * 0.92;
        ctx.fillStyle = color;
        ctx.beginPath();
        for (let i = 0; i < 12; i++) {
          const a = rand(i * 3.3) * TAU;
          const d = k * (box.w / 2) * (0.15 + rand(i) * 0.7);
          const px = cx + Math.cos(a) * d;
          const py = cy - 6 + Math.sin(a) * d * 0.3 - p * 14 + dy;
          const r = (12 + rand(i * 2) * 10) * (0.4 + k * 0.6) * scale;
          ctx.moveTo(px + r, py);
          ctx.arc(px, py, r, 0, TAU);
        }
        ctx.fill();
      }
      // Dizzy stars spinning out of the cloud.
      for (let i = 0; i < 5; i++) {
        const a = time * 4 + (i / 5) * TAU;
        ctx.globalAlpha = fade;
        sparkle(ctx, cx + Math.cos(a) * box.w * 0.3 * k, cy - 18 + Math.sin(a) * 8, 3.5, '#ffe36b');
      }
      if (f.school === 'shadow' && f.box.w < 300) {
        ctx.strokeStyle = c.light;
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
          ctx.globalAlpha = fade * 0.7;
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.quadraticCurveTo(cx + (rand(i) - 0.5) * box.w * 0.6, cy - 30, cx + (rand(i * 7) - 0.5) * box.w * k, cy + (rand(i * 3) - 0.5) * 40);
          ctx.stroke();
        }
      }
      return true;
    }
    case 'claw': {
      // Three glowing claw marks rake down across the monster.
      const cy = y - (f.h ?? 24) / 2;
      const k = ease(Math.min(1, p * 2.5));
      ctx.globalAlpha = 1 - p;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 12 + i * 7, cy - 14);
        ctx.lineTo(x - 12 + i * 7 + 22 * k, cy - 14 + 26 * k);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      return true;
    }
    case 'coinpop': {
      // Coins burst off the hit and tumble away.
      const cy = y - (f.h ?? 24) / 2;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * (0.15 + (i / 4) * 0.7);
        const d = ease(p) * 22;
        ctx.globalAlpha = 1 - p;
        coin(ctx, x + Math.cos(a) * d, cy + Math.sin(a) * d + p * p * 26, 3.5, p * 3 + i * 0.2);
      }
      return true;
    }
    case 'rain': {
      if (box) {
        // The sky darkens (or glitters, for gold) while the barrage falls.
        const a = Math.sin(Math.PI * Math.min(1, p * 1.1));
        ctx.globalAlpha = 0.28 * a;
        ctx.fillStyle = f.variant === 'coin' ? '#ffd66b' : f.variant === 'star' ? '#2b2050' : c.deep;
        wash(ctx);
        // Extra falling pieces across the whole screen, not just on targets.
        for (let i = 0; i < 26; i++) {
          const u = (p * 1.6 + rand(i)) % 1;
          const px = rand(i * 3.7) * 640 + 120 * (1 - u) * (f.variant === 'arrow' || f.variant === 'windarrow' ? -1 : 0.3);
          const py = -20 + u * 340;
          ctx.globalAlpha = a * 0.8;
          rainPiece(ctx, f.variant, px, py, 0.7, time + i, c);
        }
        return true;
      }
      // One big piece plunges onto each monster and bursts.
      const hit = 0.4;
      const cy = y - (f.h ?? 24) / 2;
      if (p < hit) {
        const k = p / hit;
        const px = x + (f.variant === 'arrow' || f.variant === 'windarrow' ? -80 : 30) * (1 - k);
        const py = cy - 220 * (1 - k * k);
        rainPiece(ctx, f.variant, px, py, 1.4, time, c);
      } else {
        const k = (p - hit) / (1 - hit);
        ctx.globalAlpha = 1 - k;
        glow(ctx, x, cy, 28 * (1 - k) + 6, c.light, 1 - k);
        ctx.strokeStyle = c.main;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(x, y - 2, 8 + 30 * k, 3 + 9 * k, 0, 0, TAU);
        ctx.stroke();
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * TAU;
          if (f.variant === 'coin') coin(ctx, x + Math.cos(a) * 26 * k, cy + Math.sin(a) * 18 * k, 3 * (1 - k) + 1, k * 4 + i);
          else sparkle(ctx, x + Math.cos(a) * 24 * k, cy + Math.sin(a) * 16 * k, 4 * (1 - k) + 1, i % 2 ? '#ffffff' : c.main);
        }
        if (f.variant === 'sword' && k < 0.6) {
          ctx.globalAlpha = 1 - k / 0.6;
          sword(ctx, x, y + 2, 40, c);
        }
      }
      return true;
    }
    case 'dragon': {
      if (box) {
        // A colossal dragon surges across the screen in a sine wave, leaving fire in its wake.
        const a = Math.sin(Math.PI * Math.min(1, p * 1.05));
        ctx.globalAlpha = 0.3 * a;
        ctx.fillStyle = '#4a0f24';
        wash(ctx);
        const dir = f.dir || 1;
        const head = -120 + p * 900;
        const baseY = f.y - cam.y - 70;
        // Drawn solid on its own layer, then faded as one piece, so overlapping segments don't show.
        const main = ctx;
        const layer = scratch(main);
        ctx = layer.getContext('2d');
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, layer.width, layer.height);
        ctx.setTransform(main.getTransform());
        const segs = 30;
        const pts = [];
        for (let i = 0; i <= segs; i++) {
          pts.push({ x: dir > 0 ? head - i * 15 : 640 - head + i * 15, y: baseY + Math.sin(p * 10 - i * 0.32) * 30, r: 17 * (1 - i / (segs + 4)) + 2 });
        }
        ctx.lineCap = 'round';
        // A smooth serpentine body: a dark outline, the red body, then a pale belly stripe.
        for (const [color, grow, dy] of [['#6a1a30', 3, 0], ['#e8364f', 0, 0], ['#ffb38a', -0.55, 0.45]]) {
          ctx.strokeStyle = color;
          for (let i = 1; i <= segs; i++) {
            const q0 = pts[i - 1];
            const q1 = pts[i];
            const w = grow < 0 ? q1.r * 2 * -grow : q1.r * 2 + grow;
            ctx.lineWidth = w;
            ctx.beginPath();
            ctx.moveTo(q0.x, q0.y + q0.r * dy);
            ctx.lineTo(q1.x, q1.y + q1.r * dy);
            ctx.stroke();
          }
        }
        // Golden spines down the back, and fire dripping from the belly.
        for (let i = 2; i < segs; i += 2) {
          const q = pts[i];
          ctx.fillStyle = '#ffe36b';
          ctx.beginPath();
          ctx.moveTo(q.x - 4, q.y - q.r + 2);
          ctx.lineTo(q.x - dir * 6, q.y - q.r - 9 * (q.r / 17) - 2);
          ctx.lineTo(q.x + 4, q.y - q.r + 2);
          ctx.fill();
          if (i % 6 === 0) glow(ctx, q.x, q.y + q.r, 16, '#ff8a3c', 0.6);
        }
        // A finned tail tip.
        const tip = pts[segs];
        ctx.fillStyle = '#ffe36b';
        ctx.beginPath();
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(tip.x - dir * 16, tip.y - 12);
        ctx.lineTo(tip.x - dir * 10, tip.y);
        ctx.lineTo(tip.x - dir * 16, tip.y + 12);
        ctx.fill();
        // The head: a snout, horns, a glowing eye, and an open jaw.
        const hx = dir > 0 ? head : 640 - head;
        const hy = baseY + Math.sin(p * 10) * 30;
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(dir, 1);
        glow(ctx, 20, 0, 40, '#ff8a3c', 0.6);
        ctx.fillStyle = '#e8364f';
        ctx.beginPath();
        ctx.ellipse(0, 0, 24, 16, 0, 0, TAU);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(10, -10);
        ctx.lineTo(40, -4);
        ctx.lineTo(36, 4);
        ctx.lineTo(10, 4);
        ctx.fill();
        ctx.fillStyle = '#a02a4a';
        ctx.beginPath();
        ctx.moveTo(10, 6);
        ctx.lineTo(36, 10 + Math.sin(time * 20) * 3);
        ctx.lineTo(10, 14);
        ctx.fill();
        ctx.fillStyle = '#ffe36b';
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(-30, -30);
        ctx.lineTo(-4, -16);
        ctx.moveTo(0, -14);
        ctx.lineTo(-14, -36);
        ctx.lineTo(6, -16);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(8, -5, 3.5, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#ff2b2b';
        ctx.fillRect(8, -6, 2, 2);
        // Fire spilling from the jaws.
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = i % 2 ? '#ffe36b' : '#ff8a3c';
          ctx.beginPath();
          ctx.arc(44 + i * 8, 6 + Math.sin(time * 30 + i) * 4, 6 - i * 0.6, 0, TAU);
          ctx.fill();
        }
        ctx.restore();
        main.save();
        main.setTransform(1, 0, 0, 1, 0, 0);
        main.globalAlpha = a;
        main.drawImage(layer, 0, 0);
        main.restore();
        return true;
      }
      // Each monster is engulfed in a burst of dragon fire.
      const cy = y - (f.h ?? 24) / 2;
      const hit = 0.35 + rand(f.seed) * 0.15;
      if (p < hit) return true;
      const k = (p - hit) / (1 - hit);
      glow(ctx, x, cy, 30 * (1 - k) + 8, '#ff8a3c', 1 - k);
      ctx.globalAlpha = 1 - k;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * TAU + f.seed;
        ctx.fillStyle = i % 2 ? '#ffe36b' : '#e8364f';
        ctx.beginPath();
        ctx.arc(x + Math.cos(a) * 20 * ease(k), cy + Math.sin(a) * 14 * ease(k) - k * 10, 5 * (1 - k) + 1, 0, TAU);
        ctx.fill();
      }
      return true;
    }
    case 'hammer': {
      if (box) {
        // A titanic hammer of light descends over the field, then slams down with a blinding flash.
        const cx = f.x - cam.x + (f.dir || 1) * 150;
        const ground = f.y - cam.y;
        const drop = 0.42;
        const a = p > 0.8 ? (1 - p) / 0.2 : 1;
        if (p < drop) {
          const k = p / drop;
          const hy = ground - 60 - 260 * (1 - k * k);
          ctx.globalAlpha = 0.25 * k;
          ctx.fillStyle = '#fff6c9';
          wash(ctx);
          ctx.globalAlpha = 1;
          hammerShape(ctx, cx, hy, 1.6, c);
        } else {
          const k = (p - drop) / (1 - drop);
          if (k < 0.15) {
            ctx.globalAlpha = 0.85 * (1 - k / 0.15);
            ctx.fillStyle = '#ffffff';
            wash(ctx);
          }
          ctx.globalAlpha = a * (1 - k * 0.6);
          hammerShape(ctx, cx, ground - 60, 1.6, c);
          // Rings of light rolling out from the impact and pillars rising.
          for (let r = 0; r < 3; r++) {
            const rk = Math.max(0, k - r * 0.12);
            ctx.globalAlpha = a * (1 - rk);
            ctx.strokeStyle = r === 1 ? '#ffffff' : c.main;
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.ellipse(cx, ground - 2, 20 + 320 * ease(rk), 6 + 26 * ease(rk), 0, 0, TAU);
            ctx.stroke();
          }
        }
        return true;
      }
      const cy = y - (f.h ?? 24) / 2;
      if (p < 0.42) return true;
      const k = (p - 0.42) / 0.58;
      const g = ctx.createLinearGradient(0, cy - 100, 0, y);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(1, c.light);
      ctx.globalAlpha = 1 - k;
      ctx.fillStyle = g;
      ctx.fillRect(x - 10 * (1 - k) - 2, cy - 100, 20 * (1 - k) + 4, y - cy + 100);
      sparkle(ctx, x, cy, 12 * (1 - k) + 2, '#ffffff');
      return true;
    }
    case 'stampede': {
      if (box) {
        // A pack of spirit wolves runs across the whole screen in waves.
        const a = Math.sin(Math.PI * Math.min(1, p * 1.05));
        ctx.globalAlpha = 0.25 * a;
        ctx.fillStyle = '#1f3a2a';
        wash(ctx);
        const dir = f.dir || 1;
        const ground = f.y - cam.y;
        for (let i = 0; i < 9; i++) {
          const lane = i % 3;
          const start = -80 - rand(i * 3.1) * 260;
          const px = start + p * 1000;
          const wx = dir > 0 ? px : 640 - px;
          const wy = ground - 8 - lane * 18 + Math.abs(Math.sin(time * 14 + i)) * -6;
          ctx.globalAlpha = a * (0.95 - lane * 0.2);
          wolf(ctx, wx, wy, 1.1 - lane * 0.15, dir, time * 14 + i, c);
        }
        return true;
      }
      const hit = 0.3 + rand(f.seed) * 0.3;
      if (p < hit) return true;
      const k = (p - hit) / (1 - hit);
      const cy = y - (f.h ?? 24) / 2;
      ctx.globalAlpha = 1 - k;
      ctx.lineCap = 'round';
      for (let i = -1; i <= 1; i++) {
        ctx.strokeStyle = c.light;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x - 12 + i * 6, cy - 12);
        ctx.lineTo(x + 10 + i * 6, cy + 12);
        ctx.stroke();
      }
      glow(ctx, x, cy, 20, c.main, 1 - k);
      return true;
    }
    case 'bladestorm': {
      if (box) {
        // Time stops: the screen goes dark and dozens of slash lines cut across it, with petals.
        const a = Math.sin(Math.PI * Math.min(1, p * 1.05));
        ctx.globalAlpha = 0.45 * a;
        ctx.fillStyle = '#1a1030';
        wash(ctx);
        const n = Math.floor(p * 40);
        for (let i = 0; i < n; i++) {
          const age = p - i / 40;
          if (age > 0.25) continue;
          const cx = rand(i * 1.7) * 640;
          const cy = 60 + rand(i * 2.9) * 260;
          const ang = rand(i * 4.1) * Math.PI;
          const len = 60 + rand(i) * 80;
          ctx.globalAlpha = a * (1 - age / 0.25);
          ctx.strokeStyle = i % 3 ? '#ffffff' : c.main;
          ctx.lineWidth = 2.5 * (1 - age / 0.25) + 0.5;
          ctx.beginPath();
          ctx.moveTo(cx - Math.cos(ang) * len, cy - Math.sin(ang) * len);
          ctx.lineTo(cx + Math.cos(ang) * len, cy + Math.sin(ang) * len);
          ctx.stroke();
        }
        for (let i = 0; i < 24; i++) {
          const u = (p * 0.8 + rand(i)) % 1;
          ctx.globalAlpha = a;
          petal(ctx, rand(i * 5.3) * 640 + Math.sin(time * 2 + i) * 20, u * 360, time * 3 + i, c);
        }
        return true;
      }
      const hit = 0.2 + rand(f.seed) * 0.4;
      if (p < hit) return true;
      return drawStrike(ctx, { ...f, kind: 'xslash', t: 1 }, x, y, (p - hit) / (1 - hit), cam, time);
    }
    default:
      return drawArchery(ctx, f, x, y, p, cam, time);
  }
}

const x0Center = (box) => box.x + box.w / 2;

// A scratch canvas the size of the game canvas, for effects that need to fade as a single layer.
let scratchCanvas = null;
function scratch(main) {
  scratchCanvas ??= document.createElement('canvas');
  if (scratchCanvas.width !== main.canvas.width || scratchCanvas.height !== main.canvas.height) {
    scratchCanvas.width = main.canvas.width;
    scratchCanvas.height = main.canvas.height;
  }
  return scratchCanvas;
}

// One falling piece of a rain ultimate.
function rainPiece(ctx, variant, x, y, s, time, c) {
  switch (variant) {
    case 'sword':
      sword(ctx, x, y, 34 * s, c);
      glow(ctx, x, y, 10 * s, c.light, 0.6);
      break;
    case 'arrow':
      arrow(ctx, x, y, Math.atan2(2.6, 1), 22 * s, c);
      break;
    case 'windarrow':
      windRainPiece(ctx, x, y, s, time);
      break;
    case 'star':
      glow(ctx, x, y, 10 * s, c.main, 0.6);
      star(ctx, x, y, 8 * s, time * 12, c.deep, c.light);
      break;
    case 'coin':
      glow(ctx, x, y, 14 * s, '#ffe36b', 0.6);
      coin(ctx, x, y, 10 * s, time * 2);
      break;
    default:
      sparkle(ctx, x, y, 5 * s, c.main);
  }
}

// A small diamond of light on an inked rim (the holy school's spark: no spikes).
function diamond(ctx, x, y, r, color) {
  if (r <= 0.3) return;
  const shape = (R) => {
    ctx.beginPath();
    ctx.moveTo(x, y - R * 1.3);
    ctx.lineTo(x + R, y);
    ctx.lineTo(x, y + R * 1.3);
    ctx.lineTo(x - R, y);
    ctx.closePath();
    ctx.fill();
  };
  if (r > 1.2 && inked(ctx)) {
    ctx.fillStyle = deep(color);
    shape(r + 0.9);
  }
  ctx.fillStyle = color;
  shape(r);
}

function petal(ctx, x, y, rot, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.fillStyle = c.main;
  ctx.beginPath();
  ctx.ellipse(0, 0, 3.5, 2, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = c.light;
  ctx.fillRect(-1, -0.5, 2, 1);
  ctx.restore();
}

function thorn(ctx, x, y, w, h, c) {
  ctx.fillStyle = c.deep;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.lineTo(x, y - h);
  ctx.lineTo(x + w, y);
  ctx.fill();
  ctx.fillStyle = c.main;
  ctx.beginPath();
  ctx.moveTo(x - w * 0.4, y);
  ctx.lineTo(x, y - h * 0.8);
  ctx.lineTo(x + w * 0.2, y);
  ctx.fill();
}

// The hammer of heaven: a beveled warhammer head with gold caps and a glowing cross, on a
// wrapped handle. (x, y) is the head's center.
function hammerShape(ctx, x, y, s, c) {
  glow(ctx, x, y, 80 * s, c.light, 0.7);
  // Handle with grip wraps and a pommel.
  ctx.fillStyle = '#c9a46b';
  ctx.fillRect(x - 4 * s, y - 86 * s, 8 * s, 72 * s);
  ctx.fillStyle = '#8a5a3a';
  for (let i = 0; i < 5; i++) ctx.fillRect(x - 4 * s, y - (78 - i * 8) * s, 8 * s, 3 * s);
  ctx.fillStyle = '#ffd66b';
  ctx.beginPath();
  ctx.arc(x, y - 88 * s, 6 * s, 0, TAU);
  ctx.fill();
  // The head: a chamfered block with darker side faces.
  const hw = 36 * s;
  const hh = 20 * s;
  const bevel = 7 * s;
  ctx.fillStyle = '#d8dde8';
  ctx.beginPath();
  ctx.moveTo(x - hw + bevel, y - hh);
  ctx.lineTo(x + hw - bevel, y - hh);
  ctx.lineTo(x + hw, y - hh + bevel);
  ctx.lineTo(x + hw, y + hh - bevel);
  ctx.lineTo(x + hw - bevel, y + hh);
  ctx.lineTo(x - hw + bevel, y + hh);
  ctx.lineTo(x - hw, y + hh - bevel);
  ctx.lineTo(x - hw, y - hh + bevel);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = c.deep;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#f6f8ff';
  ctx.fillRect(x - hw + bevel, y - hh + 3 * s, hw * 2 - bevel * 2, hh * 0.7);
  ctx.fillStyle = '#aab3c8';
  ctx.fillRect(x - hw + bevel, y + hh * 0.35, hw * 2 - bevel * 2, hh * 0.6);
  // Gold caps on both striking faces.
  ctx.fillStyle = '#ffd66b';
  ctx.fillRect(x - hw - 3 * s, y - hh + bevel, 6 * s, hh * 2 - bevel * 2);
  ctx.fillRect(x + hw - 3 * s, y - hh + bevel, 6 * s, hh * 2 - bevel * 2);
  ctx.fillRect(x - hw + bevel, y - 2 * s, hw * 2 - bevel * 2, 4 * s);
  // A glowing cross in the middle.
  glow(ctx, x, y, 22 * s, '#ffffff', 0.9);
  ctx.fillStyle = c.main;
  ctx.fillRect(x - 3 * s, y - 14 * s, 6 * s, 28 * s);
  ctx.fillRect(x - 11 * s, y - 6 * s, 22 * s, 6 * s);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - 1.5 * s, y - 12 * s, 3 * s, 24 * s);
  ctx.fillRect(x - 9 * s, y - 4.5 * s, 18 * s, 3 * s);
}

// A running spirit wolf; (x, y) is its belly line, `t` drives the gallop.
function wolf(ctx, x, y, s, dir, t, c) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * s, s);
  glow(ctx, 0, -10, 28, c.main, 0.55);
  const leg = Math.sin(t) * 6;
  const shape = () => {
    ctx.beginPath();
    // Body.
    ctx.ellipse(0, -10, 16, 7, 0, 0, TAU);
    // Tail streaming back.
    ctx.moveTo(-14, -12);
    ctx.quadraticCurveTo(-28, -20 + leg * 0.4, -32, -8);
    ctx.quadraticCurveTo(-22, -9, -14, -7);
    // Head, snout, ear.
    ctx.moveTo(24, -16);
    ctx.ellipse(16, -16, 8, 6, 0, 0, TAU);
    ctx.moveTo(20, -19);
    ctx.lineTo(31, -14);
    ctx.lineTo(20, -11);
    ctx.moveTo(11, -20);
    ctx.lineTo(13, -29);
    ctx.lineTo(18, -21);
    // Legs mid-stride.
    ctx.rect(-12 + leg * 0.5, -5, 3.5, 11);
    ctx.rect(-6 - leg * 0.4, -5, 3.5, 10);
    ctx.rect(7 - leg * 0.5, -5, 3.5, 11);
    ctx.rect(12 + leg * 0.4, -5, 3.5, 10);
  };
  ctx.lineJoin = 'round';
  ctx.strokeStyle = c.deep;
  ctx.lineWidth = 3;
  shape();
  ctx.stroke();
  ctx.fillStyle = '#f4fff0';
  shape();
  ctx.fill();
  // A spirit-green mane and back stripe.
  ctx.fillStyle = c.main;
  ctx.beginPath();
  ctx.ellipse(-2, -14, 13, 3, 0, 0, TAU);
  ctx.ellipse(10, -17, 5, 5, 0, 0, TAU);
  ctx.fill();
  // A glowing eye.
  glow(ctx, 19, -18, 5, '#fff6a0', 0.9);
  ctx.fillStyle = '#2f5a1f';
  ctx.fillRect(18, -19, 2, 2);
  ctx.restore();
}
