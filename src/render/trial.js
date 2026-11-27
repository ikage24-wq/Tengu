// The queens' moves on screen (world/story.js): each warning drawn on the ground (or as a column
// of light) in the queen's own colour, filling up as it counts down and pulsing faster near the
// end, then her effect bursting where it lands; and the move's hint under her cast bar
// (render/fightui.js). The bursts are Tengu's own effect art (fxSprite); the warnings are simple marks, like a
// dungeon boss's.

import { fxSprite } from './fx-sprites.js';
import { drawAnnounce } from './fightui.js';
import { drawMochiAnim } from './mochi-anim.js';
import { rollMochi } from '../data/mochi-genes.js';
import { SHIRATAMA } from '../data/scenes.js';
import { castWarn, castHit, OWN_WARN } from './bossfx.js';
import { deep, inked } from './fxkit.js';
import { clamp01, springy, ready, floorMark, bandMark, chevron } from './mobfx.js';

const TAU = Math.PI * 2;

function rgba(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

// Behind everyone: the warnings counting down.
export function drawZonesBack(ctx, world, cam, time) {
  for (const z of world.zones ?? []) {
    if (z.hit) continue;
    const p = Math.min(1, z.t / z.warn);
    // (A boss's own look draws its whole telegraph: the Grand Kettle's, render/grandkettle/looks.js.)
    if (z.look && OWN_WARN.has(z.look)) {
      castWarn(ctx, z, z.kind === 'floor' ? 0 : z.x - cam.x, z.y - cam.y, p, time);
      continue;
    }
    // (In the remade monsters' soft style, render/mobfx.js, in the queen's own colours: a clear
    // edge on a deeper rim of her colour, the fill growing to it, breathing at one steady beat
    // phased by the mark's own place, never by the screen.)
    const pal = paletteOf(z);
    const seed = z.x * 0.05;
    const y = z.y - cam.y;
    ctx.save();
    if (z.kind === 'pillar') {
      const x = z.x - cam.x;
      const born = clamp01(springy(p / 0.12));
      const { throb } = ready(p, time, seed);
      const g = ctx.createLinearGradient(0, 0, 0, y);
      g.addColorStop(0, rgba(z.light, 0));
      g.addColorStop(1, rgba(z.color, 0.18 + 0.22 * p));
      ctx.fillStyle = g;
      ctx.fillRect(x - z.w / 2, 0, z.w, y);
      ctx.globalAlpha = born * (0.3 + 0.3 * p + 0.15 * throb);
      ctx.fillStyle = z.light;
      ctx.beginPath();
      ctx.roundRect(x - (z.w / 2) * p, -6, Math.max(0.5, z.w * p), y + 6, Math.min(6, (z.w * p) / 2));
      ctx.fill();
      // Its two sides: soft lines on a deeper rim of her colour.
      ctx.globalAlpha = born * (0.75 + 0.25 * p);
      ctx.lineCap = 'round';
      for (const s of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(x + (s * z.w) / 2, 0);
        ctx.lineTo(x + (s * z.w) / 2, y);
        if (inked(ctx)) {
          ctx.strokeStyle = pal.rim;
          ctx.lineWidth = 3 + 0.6 * throb;
          ctx.stroke();
        }
        ctx.strokeStyle = z.color;
        ctx.lineWidth = 1.6 + 0.6 * throb;
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      floorMark(ctx, x, y, z.w / 2, 7, p, time, seed, pal, BARE);
    } else if (z.kind === 'circle') {
      floorMark(ctx, z.x - cam.x, y, z.w / 2, 7, p, time, seed, pal);
    } else {
      const x0 = z.kind === 'floor' ? 0 : z.x - cam.x;
      const w = z.kind === 'floor' ? 640 : z.w;
      const h = z.kind === 'floor' ? 14 : 34;
      const dir = z.dir < 0 ? -1 : 1;
      const born = bandMark(ctx, x0, y + 4 - h / 2, w, h, p, time, seed, z.kind === 'floor' ? 0 : -dir, pal);
      // Soft chevrons running along it, all pointing the same way, so it reads as one move.
      const shift = (time * 40) % 24;
      for (let cx = 12 + shift; cx < w - 4; cx += 24) chevron(ctx, dir > 0 ? x0 + cx : x0 + w - cx, y - 4, 5.4, dir, born * (0.55 + 0.45 * p) * clamp01(Math.min(cx, w - cx) / 12), '#ffffff', pal.rim);
    }
    ctx.restore();
  }
}

// A queen's colours as a mark's palette (her light for the tint, her colour for the fill growing
// in and for the edge), kept so nothing is built per frame.
const PALS = new Map();
const BARE = { bare: true };
function paletteOf(z) {
  let byLight = PALS.get(z.color);
  if (!byLight) PALS.set(z.color, (byLight = new Map()));
  let pal = byLight.get(z.light);
  if (!pal) byLight.set(z.light, (pal = { lt: '#ffffff', fill: z.light, mid: z.color, edge: z.color, rim: deep(z.color) }));
  return pal;
}

// On top: each move bursting where it lands, and the queens' own flourishes (a puff of smoke).
// Prismaris's dark throne: Elder Shiratama sitting by the throne with a candle, keeping him company,
// until it goes home (render/prologue.js); not while a scene has it in its own cast.
export const SHIRATAMA_AT = { x: 860 };
const SHIRATAMA_SIT = { genes: null, dir: -1, speed: 0, dist: 0, size: 'grown', runPoints: 300, easy: true, idleBits: ['lookaround', 'yawn'] };
export function drawTrialSet(ctx, world, cam, time) {
  if (world.map.id !== 'nightthrone') return;
  // The room itself dim, every light drunk (the people in it drawn bright over this), until the
  // Queen has given him his star.
  if (!world.char?.elders?.shiratama) {
    ctx.fillStyle = 'rgba(8,6,28,0.5)';
    ctx.fillRect(-10, -10, 660, 380);
  }
  if (world.char?.elders?.shiratama) return;
  if ((world.cine?.cast ?? []).some((c) => c.id === 'shiratama' && c.alpha > 0)) return;
  const x = SHIRATAMA_AT.x - cam.x;
  const y = world.map.groundY - cam.y;
  SHIRATAMA_SIT.genes ??= Object.assign(rollMochi(SHIRATAMA.seed, SHIRATAMA.genes), { wear: { ...SHIRATAMA.wear } });
  drawMochiAnim(ctx, SHIRATAMA_SIT, x, y, time);
  // Its candle on the floor beside it, flickering.
  const cx = x - 20;
  const f = 1 + Math.sin(time * 9) * 0.12 + Math.sin(time * 14.3) * 0.08;
  const g = ctx.createRadialGradient(cx, y - 14, 0, cx, y - 14, 30);
  g.addColorStop(0, 'rgba(255,220,140,0.45)');
  g.addColorStop(1, 'rgba(255,220,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(cx - 30, y - 44, 60, 60);
  ctx.fillStyle = '#fff4e0';
  ctx.fillRect(cx - 2.5, y - 10, 5, 10);
  ctx.fillStyle = '#e8d8c0';
  ctx.fillRect(cx - 2.5, y - 10, 1.4, 10);
  ctx.fillStyle = '#ffb84a';
  ctx.beginPath();
  ctx.ellipse(cx, y - 13.6, 1.8, 3.2 * f, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = '#fff6c8';
  ctx.beginPath();
  ctx.ellipse(cx, y - 12.8, 0.9, 1.6 * f, 0, 0, TAU);
  ctx.fill();
}

export function drawZonesFront(ctx, world, cam, time) {
  for (const z of world.zones ?? []) {
    if (z.hit && z.look && castHit(ctx, z, z.kind === 'floor' ? 0 : z.x - cam.x, z.y - cam.y, z.after / (z.hold ?? 0.6), time)) continue;
    if (!z.hit || !z.fx) continue;
    const p = Math.min(1, z.after / 0.6);
    const y = z.y - cam.y;
    if (z.kind === 'floor') {
      for (let x = 40; x < 640; x += 120) fxSprite(ctx, z.fx, x + ((cam.x * 0) % 120), y, { p, scale: 0.9 });
    } else if (z.kind === 'lane') {
      for (let x = z.x + 40; x < z.x + z.w; x += 90) fxSprite(ctx, z.fx, x - cam.x, y - 14, { p, scale: 0.8 });
    } else if (z.kind === 'pillar') {
      fxSprite(ctx, z.fx, z.x - cam.x, y, { p, scale: 1 });
    } else {
      fxSprite(ctx, z.fx, z.x - cam.x, y - 10, { p, scale: 0.9 });
    }
  }
  for (const f of world.fx) {
    if (f.kind !== 'trialfx') continue;
    fxSprite(ctx, f.name, f.x - cam.x, f.y - cam.y, { p: f.t / f.dur });
  }
}

// A callout for a couple of seconds, in its own colour: a queen's move shows only its hint under
// her cast bar (which already names it); anything else is called out big (render/fightui.js).
export function drawCallout(ctx, world) {
  const c = world.callout;
  if (!c) return;
  const age = world.now - c.at;
  if (age > 2.4) {
    world.callout = null;
    return;
  }
  drawAnnounce(ctx, world, c, { age, life: 2.4, color: c.color });
}
