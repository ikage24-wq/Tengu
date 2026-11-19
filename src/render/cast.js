// Draws a cutscene's own cast (world/cast.js) in the world, between the townsfolk and the hero:
// Hayate (sitting up in her bed or at her kotatsu, under its covers), the Mochi (standing,
// waddling, cheering, peeking over the bed) and the crown (on its way to her head, or riding it).
//
// Back to front: whoever is behind the bed's covers (clipped at their line, so a Mochi sunk out of
// sight is hidden rather than poking out under the bed), then Hayate, then the covers over her lap,
// then everyone else.

import { drawHayate } from './hayate.js';
import { HEAD_POSE } from './gacha.js';
import { drawMochiAnim, drawSpectator, SPECTATOR_BEATS } from './mochi-anim.js';
import { drawBedCovers, drawKotatsuCovers, drawCrown, drawFlatCues, bedchamberNight, drawBoatBack, drawBoatFront } from './prologue.js';
import { drawHero } from './hero.js';
import { wornGear } from '../core/character.js';
import { glow } from './sweetrooms.js';
import { fakeBeardShapes } from './jobgear/wardrobe.js';
import { art, place } from './scenery.js';
import { MOCHI_SIZE } from './wagashi.js';
import { SCENES } from '../data/story.js';

// Where the crown sits on her head, in the head's own space (measured on her, like her sprout:
// render/hayate.js): the middle of its band, and a point straight up from it for its lean.
const CROWN_ROOT = [15.5, 9];
const CROWN_UP = [15.5, 0];

// The fake beard on its own, for when it falls off (world/cast.js `toss`), at a grown Mochi's size.
function beardArt() {
  return art('cast-beard', 22, 20, () => fakeBeardShapes().map((s) => (s.t === 'p' ? { ...s, x: (s.x ?? 0) - 6, y: (s.y ?? 0) - 15 } : { ...s, x: s.x - 6, y: s.y - 15 })), false);
}
function drawBeard(ctx, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  ctx.scale(MOCHI_SIZE.grown, MOCHI_SIZE.grown);
  place(ctx, beardArt(), 0, 10);
  ctx.restore();
}

function withAlpha(ctx, a, draw) {
  if (a <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= Math.min(1, a);
  draw();
  ctx.restore();
}

function drawMochi(ctx, world, a, x, y, time0) {
  const time = time0 + (a.phase ?? 0);
  if (a.pose === 'cheer') {
    // Cheering: the race crowd's bounce and wave, a beat at a time, each Mochi on its own count.
    const beat = Math.floor((time + a.x * 0.013) * 7) % SPECTATOR_BEATS;
    drawSpectator(ctx, a.m.genes, x, y, beat, a.facing);
    return;
  }
  drawMochiAnim(ctx, a.m, x, y, time);
}

function drawHayateActor(ctx, a, x, y, cam, time, talking) {
  const opts = { s: 1, human: a.human, crown: a.crown === true, sprout: a.sprout, awake: a.awake, talking, face: a.face ?? null, sleepwalk: Boolean(a.sleepwalk) };
  // Leaning from the hips (the covers hide everything below them).
  const px = x;
  const py = y - 15;
  ctx.save();
  // (Up out of bed and walking (Chapter 8's sleepwalk), she turns to face the way she goes.)
  if (!a.seat && a.facing < 0) {
    ctx.translate(px, 0);
    ctx.scale(-1, 1);
    ctx.translate(-px, 0);
  }
  if (a.tilt) {
    ctx.translate(px, py);
    ctx.rotate(a.tilt);
    ctx.translate(-px, -py);
  }
  HEAD_POSE.at = null;
  drawHayate(ctx, x, y, time, opts);
  // Where the top of her head ended up (in the space she was drawn in, lean and all).
  const head = HEAD_POSE.at;
  const root = head ? head(CROWN_ROOT[0], CROWN_ROOT[1]) : null;
  const up = head ? head(CROWN_UP[0], CROWN_UP[1]) : null;
  if (a.crown === 'prop' && root) drawCrown(ctx, root[0], root[1], Math.atan2(up[0] - root[0], root[1] - up[1]) + (a.crownTilt ?? 0));
  ctx.restore();
  // ...and in the world, for the crown to fly to (world/cast.js).
  if (root) {
    const cs = Math.cos(a.tilt ?? 0);
    const sn = Math.sin(a.tilt ?? 0);
    const dx = root[0] - px;
    const dy = root[1] - py;
    a.headTop = { x: px + dx * cs - dy * sn + cam.x, y: py + dx * sn + dy * cs + cam.y };
  }
}

export function drawCast(ctx, world, cam, time) {
  const c = world.cine;
  if (!c?.cast?.length) return;
  // Whoever is speaking the line on screen moves their mouth while it types out.
  const sc = world.scene;
  const step = sc ? SCENES[sc.id]?.[sc.i] : null;
  const speaking = step && !step.card && step.text && sc.t * 55 < step.text.length ? step.who : null;
  const at = (a) => [a.x - cam.x, a.y - (a.lift ?? 0) + (a.sink ?? 0) - cam.y];
  const one = (a) => {
    const [x, y] = at(a);
    withAlpha(ctx, a.alpha, () => {
      if (a.kind === 'hayate') drawHayateActor(ctx, a, x, y, cam, time, speaking === a.id);
      else if (a.kind === 'mochi') {
        if (a.tilt) {
          // (Tumbling as it's blown away: turned about its middle.)
          ctx.translate(x, y - 12);
          ctx.rotate(a.tilt);
          ctx.translate(-x, -(y - 12));
        }
        if (a.clipY != null) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x - 40, y - 80 - (a.sink ?? 0), 80, a.clipY - cam.y - (y - 80 - (a.sink ?? 0)));
          ctx.clip();
          drawMochi(ctx, world, a, x, y, time);
          ctx.restore();
        } else drawMochi(ctx, world, a, x, y, time);
      } else if (a.kind === 'crown') drawCrown(ctx, x, y, a.tilt ?? 0);
      else if (a.kind === 'hero') drawYou(ctx, world, a, x, y, time, c.flags);
      else if (a.kind === 'gust') drawGust(ctx, x, y, time);
      else if (a.kind === 'cake') drawCake(ctx, x, y, a.tilt ?? 0);
      else if (a.kind === 'beard') drawBeard(ctx, x, y, a.tilt ?? 0);
    });
  };
  for (const a of c.cast) if (a.behind && a.kind !== 'hayate') one(a);
  const seated = c.cast.filter((a) => a.kind === 'hayate');
  for (const a of seated) one(a);
  if (world.map.id === 'royal_bed') drawBedCovers(ctx, -cam.x, -cam.y);
  if (world.map.id === 'pr_flat') {
    drawKotatsuCovers(ctx, -cam.x, -cam.y);
    drawFlatCues(ctx, -cam.x, -cam.y, time, c.flags);
  }
  for (const a of c.cast) if (!a.behind && a.kind !== 'hayate') one(a);
  // Festival night falls over the bedchamber and everyone in it.
  if (world.map.id === 'royal_bed' && c.flags?.night) bedchamberNight(ctx, -cam.x, -cam.y, 2000, 2000, time);
}

// You, asleep in your little boat out at sea, rocking on the swell: the mast and sail, you, then the
// hull in front of you. (The sail fills once the gust finds you: the scene's 'sail' cue.)
function drawYou(ctx, world, a, x, y, time, flags = {}) {
  const rock = Math.sin(time * 0.9) * 0.04;
  const bob = Math.sin(time * 1.2) * 1.5;
  const full = flags.sail ? Math.min(1, (performance.now() / 1000 - (flags.sailAt ?? 0)) / 0.8) : 0;
  drawBoatBack(ctx, x, y + bob, rock, full, time);
  const look = { ...world.char.appearance, face: a.face ?? 'sleepy' };
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.rotate(rock);
  drawHero(ctx, look, wornGear(world.char), 0, -1, { pose: 'idle', time, seed: 1, scale: 1, job: world.char.job, facing: a.facing ?? 1 });
  ctx.restore();
  drawBoatFront(ctx, x, y + bob, rock, time);
}

// A slice of strawberry shortcake on a little white plate (the Queen's cake).
function drawCake(ctx, x, y, tilt) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);
  const ell = (cx, cy, rx, ry, c) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  ell(0, 0, 9, 2.4, '#e8e4f0');
  ell(0, -0.6, 8, 1.8, '#ffffff');
  ctx.fillStyle = '#5a4a6a';
  ctx.beginPath();
  ctx.moveTo(-6, -1.5);
  ctx.lineTo(6, -1.5);
  ctx.lineTo(4, -9.6);
  ctx.lineTo(-6, -9.6);
  ctx.closePath();
  ctx.fill();
  for (const [y0, h, c] of [[-2, 2.2, '#f2d29a'], [-4.2, 1.2, '#ffffff'], [-5.4, 2, '#f2d29a'], [-7.4, 1.2, '#ffffff']]) {
    ctx.fillStyle = c;
    ctx.fillRect(-5.4, y0 - h + 0.4, 10.2, h);
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-5.6, -9.4, 10.6, 1.6);
  ell(-0.4, -11.2, 2.4, 2.2, '#ff5a6e');
  ell(-1.2, -11.9, 0.7, 0.5, '#ffd0d8');
  ctx.fillStyle = '#7fcf9a';
  ctx.fillRect(-0.8, -13.8, 0.8, 1.4);
  ctx.restore();
}

// The gust that went looking for someone: a little swirl of wind and sparkles.
function drawGust(ctx, x, y, time) {
  glow(ctx, x, y, 18, '#cfe8ff', 0.5);
  ctx.strokeStyle = 'rgba(230,242,255,0.85)';
  ctx.lineWidth = 1.2;
  for (let k = 0; k < 3; k++) {
    const r = 4 + k * 3;
    const a0 = time * 5 + k * 2;
    ctx.beginPath();
    ctx.arc(x, y, r, a0, a0 + 2.2);
    ctx.stroke();
  }
  for (let k = 0; k < 5; k++) {
    const a = time * 3 + k * 1.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 12 - k * 5 + Math.sin(a) * 2, y + Math.cos(a * 1.3) * 4, 1.4, 1.4);
  }
}
