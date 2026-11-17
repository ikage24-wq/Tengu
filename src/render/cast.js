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
import { drawBedCovers, drawKotatsuCovers, drawCrown, drawFlatCues } from './prologue.js';
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
  const opts = { s: 1, human: a.human, crown: a.crown === true, sprout: a.sprout, awake: a.awake, talking, face: a.face ?? null };
  // Leaning from the hips (the covers hide everything below them).
  const px = x;
  const py = y - 15;
  ctx.save();
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
        if (a.clipY != null) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x - 40, y - 80 - (a.sink ?? 0), 80, a.clipY - cam.y - (y - 80 - (a.sink ?? 0)));
          ctx.clip();
          drawMochi(ctx, world, a, x, y, time);
          ctx.restore();
        } else drawMochi(ctx, world, a, x, y, time);
      } else if (a.kind === 'crown') drawCrown(ctx, x, y, a.tilt ?? 0);
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
}
