// Skill effects, projectiles, hit sparks, damage numbers, and loot on the ground.
// Everything is drawn in screen space from world positions minus the camera.

import { drawItemIcon } from './icons.js';
import { ITEMS, RARITIES } from '../data/items.js';

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

const SHOT_COLORS = {
  pebble: '#ffc2e0', arrow: '#fff6fb', star: '#dfe6ff', bolt: '#c9b6ff', fire: '#ff9b5c', holy: '#fff3a6',
  bomb: '#ffb347', pierce: '#a8e8ff', swing: '#ffffff', darkbolt: '#b48cff',
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

// A crescent slash in front of the player.
function slash(ctx, cx, cy, dir, radius, p, color, thick = 6) {
  const start = dir > 0 ? -Math.PI * 0.75 : -Math.PI * 0.25;
  const sweep = Math.PI * 1.0 * ease(p) * (dir > 0 ? 1 : -1);
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = thick;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, start, start + sweep, dir < 0);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = thick / 2.5;
  ctx.stroke();
  ctx.restore();
}

function drawShot(ctx, f, cam) {
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  if (f.t < 0) return;
  const x = f.x + (f.tx - f.x) * p - cam.x;
  const y = f.y + (f.ty - f.y) * p - cam.y;
  const dir = Math.sign(f.tx - f.x) || 1;
  const c = SHOT_COLORS[f.shot] ?? '#ffffff';
  ctx.save();
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
    case 'bolt': case 'holy': case 'fire': case 'bomb': case 'darkbolt': {
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

function drawFx(ctx, f, cam, time) {
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  const x = f.x - cam.x;
  const y = f.y - cam.y;
  ctx.save();
  switch (f.kind) {
    case 'projectile':
      drawShot(ctx, f, cam);
      break;
    case 'swing': case 'slash': {
      const cx = x + f.dir * 10;
      slash(ctx, cx, y - 24, f.dir, 26, p, f.kind === 'slash' ? '#ffb38a' : '#ffe6f3', f.kind === 'slash' ? 8 : 5);
      break;
    }
    case 'spin': {
      const b = f.box;
      const cx = b.x + b.w / 2 - cam.x;
      const cy = b.y + b.h / 2 - cam.y;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#ffd66b';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(cx, cy, (b.w / 2) * ease(p), (b.h / 2.5) * ease(p), 0, time * 12, time * 12 + Math.PI * 1.6);
      ctx.stroke();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      break;
    }
    case 'flurry': {
      const b = f.box;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const lx = b.x - cam.x + ((i * 37 + Math.floor(p * 10) * 13) % b.w);
        const ly = b.y - cam.y + 8 + ((i * 23) % (b.h - 10));
        ctx.beginPath();
        ctx.moveTo(lx - 8, ly + 6);
        ctx.lineTo(lx + 8, ly - 6);
        ctx.stroke();
      }
      break;
    }
    case 'pierce': {
      const b = f.box;
      ctx.globalAlpha = 1 - p;
      const g = ctx.createLinearGradient(b.x - cam.x, 0, b.x + b.w - cam.x, 0);
      g.addColorStop(0, 'rgba(168,232,255,0)');
      g.addColorStop(1, '#a8e8ff');
      ctx.fillStyle = g;
      ctx.fillRect(b.x - cam.x, b.y + b.h / 2 - cam.y - 3, b.w * ease(p), 6);
      break;
    }
    case 'burst': case 'blaze': case 'fire': case 'holy': case 'heal': {
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
    case 'buff': case 'potion': {
      ctx.globalAlpha = 1 - p;
      const color = f.color ?? '#ffe36b';
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
      ctx.globalAlpha = 1 - p;
      const r = (f.crit ? 14 : 9) * (0.5 + p);
      sparkle(ctx, x, y, r, f.crit ? '#ffb347' : '#ffffff');
      sparkle(ctx, x, y, r * 0.45, '#ffffff');
      break;
    }
    case 'slam': {
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = '#c9b6ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(x, y, f.range * ease(p), 14 * ease(p), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(201,182,255,0.35)';
      ctx.fill();
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
      drawItemIcon(ctx, id, x - 8, y - 16);
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
