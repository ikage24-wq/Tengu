// Skill effects, projectiles, hit sparks, damage numbers, and loot on the ground.
// Everything is drawn in screen space from world positions minus the camera.

import { drawItemIcon } from './icons.js';
import { ITEMS, RARITIES } from '../data/items.js';
import { ELEMENTS } from './elements.js';
import { drawSpell, SCHOOL_COLORS } from './spells.js';
import { drawStrike, drawStrikeShot } from './strikes.js';
import { fxSprite } from './fx-sprites.js';
import { shuriken } from './thief-fx.js';
import { FX_SHEETS } from './fx-sheets.js';
import { debris, groundRing, groundWave, hitMark, pathTint } from './warrior-fx.js';
import { drawBuffCast } from './buffs.js';
import { crescent, starFlash, needle, shock, bloom, stepped, haloStroke, inked, wash, easeOut, easeIn } from './fxkit.js';
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



function drawShot(ctx, f, cam) {
  const p = Math.max(0, Math.min(1, f.t / f.dur));
  if (f.t < 0) return;
  const x = f.x + (f.tx - f.x) * p - cam.x;
  const y = f.y + (f.ty - f.y) * p - cam.y;
  const dir = Math.sign(f.tx - f.x) || 1;
  const c = f.element ? ELEMENTS[f.element].glow : SHOT_COLORS[f.shot] ?? '#ffffff';
  ctx.save();
  if (drawStrikeShot(ctx, f, x, y, dir, f.t)) {
    ctx.restore();
    return;
  }
  switch (f.shot) {
    case 'aebolt': case 'aebig': case 'aebertha': {
      // The Arbalist Engineer's: a brass bolt streaking teal, a heavy bolt in teal rings, and Big
      // Bertha's enormous one.
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      fxSprite(ctx, f.shot === 'aebolt' ? 'celaebolt' : 'celaebig', x, y, { t: f.t, flip: left, rot: left ? a + Math.PI : a, scale: f.shot === 'aebolt' ? 0.7 : f.shot === 'aebig' ? 0.75 : 2.2, alpha: f.split ? 0.85 : 1 });
      break;
    }
    case 'asplanet': case 'asbig': case 'asmoon': {
      // The Astronomer's: a little ringed planet rolling with an orbit trailing it, a great ringed
      // world, and one of her moons flying off at a monster.
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const name = f.shot === 'asplanet' ? 'celasplanet' : f.shot === 'asbig' ? 'celasbig' : 'celasmoon';
      fxSprite(ctx, name, x, y, { t: f.t, flip: left, rot: f.shot === 'asmoon' ? 0 : left ? a + Math.PI : a, scale: f.shot === 'asplanet' ? 0.75 : f.shot === 'asbig' ? 0.8 : 0.8, alpha: f.split ? 0.85 : 1 });
      break;
    }
    case 'siheart': {
      // Her heart drawn in the air: it sails on level, rocking gently, with a trail of sparkles.
      const born = bornAt(f);
      fxSprite(ctx, 'celsiheart', x, y, { t: f.t, flip: f.tx < f.x, rot: 0.12 * Math.sin(f.t * 9), scale: born, alpha: Math.min(1, born * 1.4) });
      break;
    }
    case 'sinote': case 'sibig': {
      // The Starlight Idol's: a pink note that bobs as it flies, and her big burst of sound.
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      // (Born small at the mic and grown to full in its first moment, so it never sits on her face.)
      const born = bornAt(f);
      fxSprite(ctx, f.shot === 'sinote' ? 'celsinote' : 'celsibig', x, y, { t: f.t, flip: left, rot: left ? a + Math.PI : a, scale: (f.shot === 'sinote' ? 1 : 1.05) * born, alpha: (f.split ? 0.85 : 1) * Math.min(1, born * 1.4) });
      break;
    }
    case 'clbolt': case 'clorb': case 'clpillar': {
      // The Cleric's: a little sun with gold rays trailing, an orb of light with feathers circling,
      // and Judgment's pillar of light falling straight down.
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const born = f.shot === 'clpillar' ? 1 : bornAt(f);
      const size = { clbolt: 0.6, clorb: 0.62, clpillar: 0.85 }[f.shot];
      fxSprite(ctx, `cel${f.shot}`, x, y, { t: f.t, flip: left, rot: f.shot === 'clorb' ? 0 : left ? a + Math.PI : a, scale: size * born, alpha: Math.min(1, born * 1.4) });
      break;
    }
    case 'sohand': case 'soflame': case 'sofire': case 'sograsp': case 'soslam': {
      // The Sorcerer's: a shadow hand flung reaching, a wisp or ball of violet flame round an ember
      // heart, shadow hands clawing up out of the ground as the line races along it, a giant hand
      // reaching down out of the sky (born small at the wand or staff, grown to full in its first
      // moment). An echo cast by Spellstorm comes a little smaller and fainter.
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const ground = f.shot === 'sograsp';
      const born = f.shot === 'soslam' ? 1 : bornAt(f);
      const size = { sohand: 0.55, soflame: 0.6, sofire: 0.7, sograsp: 0.62, soslam: 0.75 }[f.shot];
      fxSprite(ctx, `cel${f.shot}`, x, ground ? y + 18 : y, { t: f.t, flip: left, rot: ground ? 0 : left ? a + Math.PI : a, scale: size * born * (f.split ? 0.85 : 1), alpha: (f.split ? 0.8 : 1) * Math.min(1, born * 1.4) });
      break;
    }
    case 'qnorb': case 'qncrown': case 'qndecree': case 'qngeyser': case 'qnwall': case 'qnstrike': {
      // The Sorcerer's (the remake): a royal fire orb rolling slow and huge, a spinning ice crown,
      // a lightning scepter, fire geysers and a wall of ice racing along the floor, a crown of
      // lightning straight down from the sky (born small at the wand or staff, grown to full in its
      // first moment).
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const ground = f.shot === 'qngeyser' || f.shot === 'qnwall';
      const born = f.shot === 'qnstrike' ? 1 : bornAt(f);
      const size = { qnorb: 0.7, qncrown: 0.62, qndecree: 0.7, qngeyser: 0.62, qnwall: 0.62, qnstrike: 0.85 }[f.shot];
      const rot = ground || f.shot === 'qnorb' || f.shot === 'qncrown' ? 0 : left ? a + Math.PI : a;
      fxSprite(ctx, `cel${f.shot}`, x, ground ? y + 18 : y, { t: f.t, flip: left, rot, scale: size * born, alpha: Math.min(1, born * 1.4) });
      break;
    }
    case 'pmspark': case 'pmshard': case 'pmzap': case 'pmbomb': case 'pmspike': case 'pmstrike': case 'pmhuge': case 'pmwire': {
      // The Mage's (the remake): a firecracker spark, a spiky snowball, a crackling zap ball, a
      // grinning fireball that bounces along and rocks as it flies, ice spikes punching up along the
      // floor, and a strike straight down from the sky (born small at the wand or staff, grown to
      // full in its first moment).
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const ground = f.shot === 'pmspike';
      const bomb = f.shot === 'pmbomb' || f.shot === 'pmhuge';
      const born = f.shot === 'pmstrike' ? 1 : bornAt(f);
      const hop = f.shot === 'pmbomb' && f.dur > 0 ? -Math.abs(Math.sin(Math.max(0, f.t / f.dur) * Math.PI * 3)) * 14 * born : 0;
      const size = { pmspark: 0.6, pmshard: 0.6, pmzap: 0.62, pmbomb: 0.7, pmspike: 0.62, pmstrike: 0.8, pmhuge: 0.7, pmwire: 0.7 }[f.shot];
      const rot = ground ? 0 : bomb ? 0.15 * Math.sin(f.t * 20) : left ? a + Math.PI : a;
      fxSprite(ctx, `cel${f.shot}`, x, ground ? y + 18 : y + hop, { t: f.t, flip: left, rot, scale: size * born, alpha: Math.min(1, born * 1.4) });
      break;
    }
    case 'mgfire': case 'mgfireball': case 'mgice': case 'mgspike': case 'mgbolt': case 'mgsky': {
      // The Mage's: a fire bolt or a fireball streaming flame, a frost shard, ice spikes bursting up
      // out of the ground as the line races along it, a lightning bolt through the line, lightning
      // straight down from the sky (born small at the wand or orb, grown to full in its first moment).
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const spike = f.shot === 'mgspike';
      const born = f.shot === 'mgsky' ? 1 : bornAt(f);
      const size = { mgfire: 0.6, mgfireball: 0.7, mgice: 0.6, mgspike: 0.62, mgbolt: 0.7, mgsky: 0.8 }[f.shot];
      fxSprite(ctx, `cel${f.shot}`, x, spike ? y + 18 : y, { t: f.t, flip: left, rot: spike ? 0 : left ? a + Math.PI : a, scale: size * born * (f.split ? 0.8 : 1), alpha: (f.split ? 0.85 : 1) * Math.min(1, born * 1.4) });
      break;
    }
    case 'kwglob': case 'kwwave': case 'kpegg': case 'kpflame': case 'kwspice': {
      // The Kitchen Witch's: a glob of hot broth, a curling wave of soup, a spinning fried egg, a gush
      // of flambé fire, a cloud of salt and pepper, each turned along its flight (born small at the
      // ladle or pan and grown to full in its first moment, so it never sits on her face).
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const born = bornAt(f);
      const size = { kwglob: 0.62, kwwave: 0.8, kpegg: 0.62, kpflame: 0.95, kwspice: 0.6 }[f.shot];
      // (The wave and the fire roll along level; the egg wobbles as it spins; the spice just drifts.)
      const spin = f.shot === 'kwspice' || f.shot === 'kwwave' || f.shot === 'kpflame' ? 0 : f.shot === 'kpegg' ? 0.25 * Math.sin(f.t * 12) : left ? a + Math.PI : a;
      fxSprite(ctx, `cel${f.shot}`, x, y, { t: f.t, flip: left, rot: spin, scale: size * born * (f.split ? 0.8 : 1), alpha: (f.split ? 0.85 : 1) * Math.min(1, born * 1.4) });
      break;
    }
    case 'stbolt': case 'stcomet': case 'stmeteor': {
      // The Star Witch's: a spinning gold star with a midnight comet tail, turned along its flight; a
      // comet with a great tail and ring; a meteor falling from the sky.
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      const name = f.shot === 'stbolt' ? 'celstbolt' : f.shot === 'stcomet' ? 'celstcomet' : 'celstmeteor';
      // (A star or comet is born small at the wand's tip and its tail grows out behind it as it
      // flies, so the tail never lies back over her; a meteor falls in from the sky full size.)
      const born = f.shot === 'stmeteor' ? 1 : bornAt(f);
      fxSprite(ctx, name, x, y, { t: f.t, flip: left, rot: f.shot === 'stmeteor' ? 0 : left ? a + Math.PI : a, scale: 0.75 * born, alpha: (f.split ? 0.85 : 1) * Math.min(1, born * 1.4) });
      break;
    }
    case 'skygust': case 'skygustbig': {
      // The Sky Dancer's gust: a crescent of wind with a feather riding it, turned along its flight;
      // on full Tailwind (and her finishers) a great one.
      const big = f.shot === 'skygustbig';
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      fxSprite(ctx, 'celskygust', x, y, { t: f.t, flip: left, rot: left ? a + Math.PI : a, scale: big ? 1.45 : 0.95 });
      break;
    }
    case 'ring': case 'ringbig': {
      // The Blade Dancer's ring: spinning, its rose smear curling behind it the way it flies (home
      // to her hand too); a twin ring a little smaller and lighter.
      const big = f.shot === 'ringbig';
      const a = Math.atan2(f.ty - f.y, f.tx - f.x);
      const left = Math.cos(a) < 0;
      fxSprite(ctx, 'celbdring', x, y, { t: f.t, flip: left, rot: left ? a + Math.PI : a, scale: (big ? 1.3 : 0.92) * (f.twin ? 0.85 : 1), alpha: f.twin ? 0.85 : 1 });
      break;
    }
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
    case 'kunai': {
      // A Shinobi's kunai: a dark steel blade pointed along its flight, a cord-wrapped grip and a
      // ring at its end, a faint streak behind and a red tassel snapping in the wind.
      ctx.translate(x, y);
      ctx.rotate(Math.atan2(f.ty - f.y, f.tx - f.x));
      if (f.phantom) ctx.globalAlpha = 0.6;
      const a0 = ctx.globalAlpha;
      ctx.globalAlpha = a0 * 0.35;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-28, -0.6, 18, 1.2);
      ctx.globalAlpha = a0;
      ctx.fillStyle = f.phantom ? '#2a2234' : '#5a5868';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(1, -2.6);
      ctx.lineTo(-1, 0);
      ctx.lineTo(1, 2.6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#c8c6d8';
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(1, -2.6);
      ctx.lineTo(0, 0);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#1c1820';
      ctx.fillRect(-6, -0.9, 6, 1.8);
      ctx.strokeStyle = '#3a3440';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(-7.6, 0, 1.6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = '#d8283a';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-9, 0);
      ctx.quadraticCurveTo(-13, Math.sin(f.t * 40) * 2.5, -16, Math.sin(f.t * 40 + 1) * 3);
      ctx.stroke();
      break;
    }
    case 'star': case 'moonstar': {
      // A Thief's stars trail violet streaks; a big moon star is drawn large; the Phantom's copies
      // are violet shadows of a star.
      if (f.shadow) {
        const big = f.shot === 'moonstar';
        fxSprite(ctx, 'celshadowtrail', x - dir * (big ? 26 : 18), y, { t: f.t, flip: dir < 0, scale: big ? 0.8 : 0.5 });
        if (big) fxSprite(ctx, 'celsmoke', x - dir * 40, y + 12, { t: f.t % 0.38, flip: dir < 0, scale: 0.35 });
        ctx.translate(x, y);
        ctx.rotate(f.t * (big ? 16 : 20));
        if (f.phantom) ctx.globalAlpha = 0.65;
        const body = f.phantom ? '#8a6ae8' : big ? '#d2cff0' : f.starColor ?? '#b9c0cc';
        const r = big ? 12 : 7;
        // The Thief's own star is real steel (her realistic look): blurred by its spin (two faint
        // copies trailing the turn), a fine dark edge instead of an outline, and a glint flicking
        // off the blades as it turns.
        const a0 = ctx.globalAlpha;
        for (const [k, al] of [[0.26, 0.22], [0.13, 0.4]]) {
          ctx.save();
          ctx.rotate(-k);
          ctx.globalAlpha = a0 * al;
          shuriken(ctx, r, body, body, null);
          ctx.restore();
        }
        shuriken(ctx, r, body, f.phantom ? '#c9b4ff' : mix(body, '#ffffff', 0.6), f.phantom ? '#5a44b0' : mix(body, '#2a2440', 0.55));
        const glint = Math.max(0, Math.sin(f.t * 31));
        if (glint > 0.6) {
          ctx.rotate(-f.t * (big ? 16 : 20));
          ctx.globalAlpha = a0 * (glint - 0.6) * 2.5;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-r * 0.9, -0.5, r * 1.8, 1);
          ctx.fillRect(-0.5, -r * 0.9, 1, r * 1.8);
        }
        break;
      }
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
      // A thrust: speed streaks shooting forward from the weapon's point to the end of the blow's
      // reach, a burst at its end (steel; a Berserker's in rose red). When the weapon isn't level
      // at that moment (a dash still winding through), it leaves from the hand instead.
      const b = f.box;
      const dir = f.dir ?? 1;
      const pose = strikeAt(f);
      const level = pose && Math.abs(pose.angle - 90) < 30;
      const from0 = pose ? (level ? pose.tip : pose.hand) : null;
      const end = dir > 0 ? b.x + b.w : b.x;
      const start = from0 ? f.x + from0[0] : dir > 0 ? b.x : b.x + b.w;
      const by = (from0 ? f.y + from0[1] : b.y + b.h / 2) - cam.y;
      const reach = Math.max(24, Math.abs(end - start));
      const sx0 = start - cam.x;
      // The Wind Dancer's thrust sends a little crescent gust instead of a streak of steel.
      if (f.school === 'coral') {
        fxSprite(ctx, 'celwdgust', sx0 + (dir * reach) * 0.45, by + 2, { p, flip: dir < 0, scale: 0.5 });
        break;
      }
      fxSprite(ctx, pathTint(f.school, 'celstreak', 'celstreakgold', 'celstreakred'), sx0 + (dir * reach) / 2, by + 2, { p, flip: dir < 0, sx: reach / 100, sy: 0.7 });
      fxSprite(ctx, pathTint(f.school, 'celhit', 'celholyhit', 'celhitred'), sx0 + dir * reach, by + 2, { p, scale: 0.6 });
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
      // A shot leaving the bow or hand: a small pop of light. Where a blow lands: the burst for a
      // crit, the hero's mark for a blade cut (the Warrior's cross, the Paladin's star, the
      // Berserker's claws), a burst for everything else.
      if (f.muzzle) {
        fxSprite(ctx, 'celhit', x, y, { p: Math.min(1, p * 1.5), scale: 0.35 });
        break;
      }
      // A crit: the shared burst, but the warriors' are their own real light and fire (a big flare
      // of light for the Paladin, a white-hot burst and claws for the Berserker, a big cross of
      // cuts and sparks for the Warrior), and the Shinobi's a splash of ink.
      if (f.crit) {
        if (f.path === 'holy') fxSprite(ctx, 'celholyhit', x, y, { p, scale: 0.72 });
        else if (f.path === 'steel') fxSprite(ctx, 'celcross', x, y, { p, scale: 1.15, rot: ((f.seed ?? 0.5) - 0.5) * 0.8 });
        else if (f.path === 'rage') {
          fxSprite(ctx, 'celhitred', x, y, { p, scale: 0.95 });
          fxSprite(ctx, 'celclaw', x, y, { p, scale: 0.55, flip: (f.dir ?? 1) < 0 });
        } else if (f.path === 'rosegold') fxSprite(ctx, 'celbdhit', x, y, { p, scale: 0.75, rot: ((f.seed ?? 0.5) - 0.5) * 0.8 });
        else if (f.path === 'ink') fxSprite(ctx, 'celinkhit', x, y, { p, scale: 0.8, flip: (f.dir ?? 1) < 0, rot: ((f.seed ?? 0.5) - 0.5) * 0.8 });
        else fxSprite(ctx, 'celcrit', x, y, { p, scale: 0.75 });
        break;
      }
      // (A Paladin's and a Berserker's blade hits draw their own star and claws as holy and rage
      // hits, so the cut itself adds nothing here.)
      if (f.via === 'blade') {
        if (!f.path || f.path === 'steel' || f.path === 'shadow' || f.path === 'ink' || f.path === 'coral' || f.path === 'rosegold') hitMark(ctx, f.path ?? 'steel', x, y, p, { seed: f.seed ?? 0.5, dir: f.dir ?? 1 });
      }
      else fxSprite(ctx, pathTint(f.path, 'celhit', 'celholyhit', 'celhitred'), x, y, { p, scale: 0.65 });
      break;
    }
    case 'arc':
      bladeCut(ctx, f, cam, p);
      break;
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
      // The ground ruptures under a heavy blow: rock thrust up and dust across its width.
      for (let i = 0, n = Math.max(1, Math.round((f.w ?? 80) / 90)); i < n; i++) debris(ctx, x + ((i + 0.5) / n - 0.5) * (f.w ?? 80), y, Math.min(1, p * 1.2 + i * 0.05), Math.min(100, (f.w ?? 80) / n), f.school);
      break;
    case 'roar':
      // Provoke: zig-zag rings of a battle cry bursting out, and a wave racing out to its reach, in
      // the colour of the path that cried it (steel, the Paladin's gold, the Berserker's red).
      fxSprite(ctx, pathTint(f.school, 'celshout', 'celshoutgold', 'celshoutred'), x, y - 26, { p, scale: 0.9 });
      groundWave(ctx, f.school, x, y, p, f.r ?? 120);
      break;
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
// Effects that lie on the ground under everyone (the Starlight Idol's song rings and her stage,
// the Astronomer's Gravity Well, the dancers' finisher stages: Grand Finale's spotlight and rose,
// Golden Carousel's track, Sky Waltz's tornado, which stand round her and must not cover her face):
// drawn behind the heroes and monsters (drawGroundFx), so they never wash over a face.
const GROUND_FX = new Set(['qnnovafx', 'qnthrone', 'pmnovafx', 'pmcamp', 'sistage', 'sihype', 'sispot', 'sicurtain', 'sipyro', 'aswell', 'shock', 'wdfinale', 'bdcarousel', 'skytornado',
  // (the first jobs' skills as the paths play them: data/skills.js `paths`)
  'bdrevue', 'skycloudburst', 'siballad', 'siharmony', 'asmoonfall', 'asveil']);
export function drawEffects(ctx, world, cam, time) {
  hero = world.char ? { look: world.char.appearance, gear: wornGear(world.char) } : null;
  for (const f of world.fx) if (!GROUND_FX.has(f.kind)) drawFx(ctx, f, cam, time);
}
export function drawGroundFx(ctx, world, cam, time) {
  for (const f of world.fx) if (GROUND_FX.has(f.kind)) drawFx(ctx, f, cam, time);
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
    const pose = strikePose(hero.look, hero.gear, f.move, u, f.moveDur, f.dir, 1, f);
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



// A spell's growth out of the wand or mic: 0.3 of its size as it leaves, full by the time it has
// flown clear of the caster (about 0.12 s), eased.
function bornAt(f) {
  const u = Math.min(1, Math.max(0, f.t) / 0.12);
  return 0.3 + 0.7 * u * u * (3 - 2 * u);
}

// A blade's cut: the swipe (Tengu's own art, fx-sprites.js) laid along the blade's own path through
// the move (sampled from the hero's pose, `bladePath`), sized to the reach: steel blue, the
// Paladin's gold (and any heavy blow's but the Warrior's), the Berserker's rose red, or the Wind
// Dancer's coral ribbon. A cut all around (a whirl) is
// the spin slash instead.
function bladeCut(ctx, f, cam, p) {
  // The skill's school, else the path's own colour (a Berserker's basic blows are red too).
  const school = f.snd ?? f.path;
  const name = school === 'ink' ? 'celslashink' : school === 'shadow' ? 'celslashshadow' : school === 'coral' ? 'celslashcoral' : school === 'rage' ? 'celslashred' : school === 'holy' || (f.big && school !== 'steel') ? 'celslashgold' : 'celslash';
  if (school === 'rosegold') {
    // The Blade Dancer's cuts come from her ring spinning round her: its ring-cut, seen flat.
    fxSprite(ctx, 'celbdhit', f.x - cam.x, f.y - cam.y + 2, { p, scale: (f.r ?? 60) / 36, sy: f.flat ? 0.42 : 0.8, flip: (f.dir || 1) < 0 });
    return;
  }
  if (f.flat && school === 'coral') {
    // The Wind Dancer's whirl: her own swirl of coral and cream ribbons round her, seen flat.
    // (Flattened round her waist and kept to her reach, so its ribbons pass round her, not over her face.)
    fxSprite(ctx, 'celwdswirl', f.x - cam.x, f.y - cam.y + 4, { p, scale: (f.r ?? 60) / 88, sy: 0.38, alpha: 0.9, flip: (f.dir || 1) < 0 });
    return;
  }
  if (f.flat && (school === 'ink' || school === 'shadow')) {
    // A thief's whirl: a ring of her own cut (brushed ink, or violet moonlight) swept round her.
    fxSprite(ctx, school === 'ink' ? 'celringink' : 'celringshadow', f.x - cam.x, f.y - cam.y + 2, { p, scale: (f.r ?? 60) / 34, sy: 0.42 });
    return;
  }
  if (f.flat) {
    // A whirl: the spin slash sweeping right round the body, seen flat.
    fxSprite(ctx, school === 'rage' ? 'celspinred' : school === 'holy' ? 'celspingold' : 'celspin', f.x - cam.x, f.y - cam.y + 2, { p, scale: (f.r ?? 60) / 40, sy: 0.42, flip: (f.dir || 1) < 0 });
    return;
  }
  const path = bladePath(f);
  let cx, cy, mid, cw, r;
  if (path) {
    // The middle of the cut: the hands' average, the tip's angle halfway along, and which way
    // round it went.
    const hx = path.reduce((a, q) => a + q.hand[0], 0) / path.length;
    const hy = path.reduce((a, q) => a + q.hand[1], 0) / path.length;
    const a0 = Math.atan2(path[0].tip[1] - hy, path[0].tip[0] - hx);
    const m = path[Math.floor(path.length / 2)];
    const a1 = Math.atan2(path.at(-1).tip[1] - hy, path.at(-1).tip[0] - hx);
    mid = Math.atan2(m.tip[1] - hy, m.tip[0] - hx);
    cw = Math.sin(a1 - a0) >= 0;
    r = path.reduce((a, q) => a + Math.hypot(q.tip[0] - hx, q.tip[1] - hy), 0) / path.length;
    cx = f.bx + hx - cam.x;
    cy = f.by + hy - cam.y;
  } else {
    const dir = f.dir || 1;
    const deg = (a) => ((dir > 0 ? a : 180 - a) * Math.PI) / 180;
    mid = deg(f.start + f.sweep / 2);
    cw = (f.sweep > 0) === (dir > 0);
    r = f.r ?? 30;
    cx = f.x - cam.x;
    cy = f.y - cam.y;
  }
  // The swipe, turned so the middle of its sweep meets the middle of the blade's,
  // mirrored when it sweeps the other way round, and sized so its arc rides just past the tip; it
  // plays its own sweep over the cut. A downward cut stays above the floor: it leans out in front
  // rather than diving into the ground.
  if (Math.sin(mid) > 0.35) {
    if (Math.cos(mid) * (f.dir || 1) < 0) cw = !cw;
    mid = Math.atan2(0.35, (f.dir || 1) * Math.sqrt(1 - 0.35 * 0.35));
  }
  const sheet = FX_SHEETS[name];
  const flip = (cw ? 1 : -1) !== sheet.turn;
  const rot = mid - (flip ? Math.PI - sheet.mid : sheet.mid);
  const scale = ((r * 1.15) / (sheet.r / sheet.d)) * (f.big ? 1.15 : 1);
  fxSprite(ctx, name, cx, cy, { p, rot, flip, scale });
}

function strikeAt(f) {
  if (!hero || !f.move) return null;
  if (!posed.has(f)) posed.set(f, strikePose(hero.look, hero.gear, f.move, f.at, f.moveDur, f.dir, 1, f));
  return posed.get(f);
}

// The boss's wind-up warning, a telegraph that reads at a glance: the danger zone pulses on the
// floor, its edge inked, and a ring gathers inward from the edge, faster and faster, landing on
// the boss just as the slam comes down.
export function drawWarnings(ctx, world, cam, time) {
  for (const m of world.mobs) {
    if (!m.special || m.special.warn <= 0) continue;
    const x = m.x - cam.x;
    // (On the floor the slam hits: a flyer's is the one it hovers over, world.js.)
    const y = (m.def.fly ? m.spawn.y : m.y) - cam.y;
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

// Hits on one monster stack into a readable column (the way MapleStory's do): each number keeps a
// line's height clear above the newer one under it, so a quick string of hits reads as a list,
// never a pile. The push is eased (a spring toward where it must be), so numbers glide up, never jump.
const NUMBER_LINE = 13;
let stackedAt = -1;
function stackNumbers(numbers) {
  const now = performance.now() / 1000;
  const dt = stackedAt < 0 ? 1 / 60 : Math.min(0.1, now - stackedAt);
  stackedAt = now;
  const cols = new Map();
  for (const n of numbers) {
    if (n.mob == null || n.t < NUMBER_DELAY) continue;
    if (!cols.has(n.mob)) cols.set(n.mob, []);
    cols.get(n.mob).push(n);
  }
  for (const col of cols.values()) {
    // Newest first: each older one must sit at least a line above the one after it.
    col.sort((a, b) => a.t - b.t);
    let newer = null;
    for (const n of col) {
      const rise = (k) => easeOut(Math.min(1, (k.t - NUMBER_DELAY) / 0.6)) * 24 + Math.max(0, k.t - NUMBER_DELAY - 0.6) * 6;
      const line = NUMBER_LINE * (n.crit ? 1.25 : n.small ? 0.8 : 1);
      let want = 0;
      if (newer) {
        const newerY = newer.y - rise(newer) - (newer.lift ?? 0);
        const myY = n.y - rise(n);
        want = Math.max(0, myY - (newerY - line));
      }
      n.lift = (n.lift ?? 0) + (Math.max(want, n.lift ?? 0) - (n.lift ?? 0)) * Math.min(1, dt * 18);
      newer = n;
    }
  }
}

export function drawNumbers(ctx, world, cam) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.lineJoin = 'round';
  const totals = new Map();
  stackNumbers(world.numbers);
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
    const y = n.y - cam.y - rise - (n.lift ?? 0);
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
      g.top = Math.min(g.top, n.y - (n.lift ?? 0));
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
