// The Mirror Twins' cast looks (2026-11-28; the player: "do the animations and effects b4 putting it in",
// then "effects needs to be extremely detailed"). Each telegraph is drawn whole in their own look while its
// cast winds up (`warn`, p 0..1 through the warning) and in place of the plain flash as it lands (`hit`, u
// 0..1 over its hold), the way Lady Marigold's are (render/hostess/looks.js); every piece is painted in
// layers (render/twins/fxparts.js): ornate clocks with cogs behind them, twisting satin ribbons, beams of
// stage light with motes in them, framed mirror glass that cracks before it breaks, music staves with a
// clef, rose petals, soft ghost puffs, a jewelled heart locket. Their colours: Rondo's night satin and
// silver, Minuet's snow white and lilac, the ruby of the hidden eye, a little gold.
//   twFrozen   Frozen Moment (the cast that stops time): over the caster's head an ornate ruby clock
//              builds itself (cogs spin up behind it, its bezel and scrolls draw on), its hands racing
//              round and slowing to a stop at twelve, ruby petals and sparkles drawn in to it; landing,
//              the clock strikes: a bright flash, rings of ruby and gold rolling out, and the world stops
//              (drawTimeStop holds it; drawTimeResume breaks it again)
//   twGaze     Eyes on Me (face away or be frozen): a ruby stage spotlight sweeps out from her, layered,
//              motes drifting in it, a pool of red light on the floor, a little clock turning at the lamp;
//              landing, a flash of red light rolling out from her
//   twTick     Metronome (Rondo; rings on the beat): an engraved silver ring on the floor, a brass-weighted
//              metronome over it ticking down three beats, a sound ring pulsing out on each; landing, the
//              ring is struck: a silver flash, a burst of notes and shards, a ring of sound
//   twCue      Conductor's Cue (Rondo; a line across the floor): a five-line stave drawn on along it with a
//              treble clef at her end and bar lines, notes of every kind gliding in on it with trails;
//              landing, the stave lights white and every note leaps up off it, sparkling
//   twBoo      Boo! (Minuet; behind you): white mist welling and curling up where she'll pop out, little
//              ghost puffs rising with wisps, a bat bow fluttering, "hee hee" floating; landing, BOO!:
//              bubbly letters, a ring of ghost puffs bursting outward, lilac petals and sparkles
//   twRewind   Rewind (a mark on each of you): an ornate silver clock lying on the floor, its hands winding
//              backwards, two engraved rings counter-turning round it, a satin ribbon arrow circling the
//              wrong way, sparkles flowing backwards into it; landing, the ribbon snaps shut in a flash
//   twMirror   Mirror Step (a line from above and below at once): strips of framed mirror glass on the floor
//              and the ceiling, reflections drifting in them, light gliding across, cracks spreading as the
//              cast ends; landing, the glass bursts into faceted shards
//   twPas      Pas de Deux (everyone; the finale): the ruby clock and the silver one turning over the room,
//              cogs behind them, satin ribbons in both their colours spiralling in, petals and notes
//              circling; landing, two great rings of ruby and silver rolling out with a ring of gold
//              between, notes, petals and shards flung wide, a flash
//   (Change Partners!: drawSwap, an instant swap through a pair of mirrors, below)
//   twNote     Rondo's basic attack: a silver note flicked from her fingertip; landing, a chime of light
//   twPuff     Minuet's basic attack: a shove of ghost puffs; landing, a soft pop
// And not floor zones: drawTimeStop / drawTimeResume, drawSwap, drawBond, drawFrozenMark.

import {
  RUBY, NIGHT, SILVER, LILAC, PINK, GOLD, NIGHT_SATIN, WHITE_SATIN,
  ornateClock, cog, satin, motes, petal, richNote, clef, puff, batBow, shard, mirrorStrip, mirrorPortal, locket, bubbleText, floorDisc, beam,
  glow, pen, sparkle, ell, hash, clamp, mix, TAU,
} from './fxparts.js';
import { sstep } from '../marigold/fx.js';

const ease = (u) => 1 - (1 - clamp(u, 0, 1)) ** 3;
const back = (u) => {
  const v = clamp(u, 0, 1) - 1;
  return 1 + 2.4 * v * v * v + 1.4 * v * v;
};

// A ring of light rolling out (an ellipse), with a soft wide band and a bright thin edge.
function shockRing(ctx, x, y, r, squash, col, al, w = 3) {
  if (al <= 0.01 || r < 1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * squash);
  ctx.save();
  ctx.globalAlpha *= 0.3;
  pen(ctx, col, w * 2.6);
  ctx.stroke();
  ctx.restore();
  pen(ctx, col, w);
  ctx.stroke();
  pen(ctx, 'rgba(255,255,255,0.9)', Math.max(0.6, w * 0.3));
  ctx.stroke();
  ctx.restore();
}
// Petals and sparkles drawn in toward a point (`p` how far through), each on its own spiral.
function drawIn(ctx, x, y, R, n, p, time, tone, seed = 0) {
  for (let i = 0; i < n; i++) {
    const s = seed + i * 1.91;
    const v = (time * 0.7 + hash(s)) % 1;
    const an = hash(s * 2.9) * TAU + v * 2.2;
    const d = R * (1 - v);
    const px = x + Math.cos(an) * d;
    const py = y + Math.sin(an) * d * 0.8;
    const al = Math.sin(Math.PI * v) * p;
    if (i % 3 === 0) sparkle(ctx, px, py, 1.6 + hash(s * 4) * 1.6, al, tone === 'ruby' ? RUBY[0] : LILAC[0]);
    else petal(ctx, px, py, 2 + hash(s * 6) * 1.6, an + time * 3, al, tone, i % 2 ? 1 : -1);
  }
}

// ---------- 1 Frozen Moment ----------
function frozenWarn(ctx, z, x, y, p, time) {
  const cy = z.ceil ? y + 128 : y - 128;
  const build = ease(p / 0.55);
  const r = 6 + back(p / 0.6) * 22;
  // the hands race round and slow to stop at twelve as the cast ends
  const hand = TAU * 6 * (1 - (1 - p) ** 2.2);
  glow(ctx, x, cy, r * 4, RUBY[2], 0.28 * p);
  drawIn(ctx, x, cy, r * 3.6, 14, p, time, 'ruby');
  // a thin ruby line of light from the clock down to her eye
  ctx.save();
  ctx.globalAlpha *= 0.5 * p;
  ctx.beginPath();
  ctx.moveTo(x, cy + (z.ceil ? -r : r));
  ctx.lineTo(x + (z.eyeX ?? 4), z.ceil ? y + 62 : y - 62);
  pen(ctx, RUBY[1], 1.2);
  ctx.stroke();
  ctx.restore();
  ornateClock(ctx, x, cy, r, hand, 0.25 + 0.75 * build, 'ruby', time * (1 + (1 - p) * 4), { sec: hand * 4 });
}
function frozenHit(ctx, z, x, y, u, e, fade, time) {
  const cy = z.ceil ? y + 128 : y - 128;
  // the strike: a white flash at the clock, rings of ruby, gold and ruby rolling out over the room
  glow(ctx, x, cy, 60 + e * 200, '#ffffff', 0.7 * (1 - e));
  ornateClock(ctx, x, cy, 28 + e * 6, TAU * 6, fade, 'ruby', time);
  for (let k = 0; k < 3; k++) {
    const kk = clamp(e * 1.25 - k * 0.14, 0, 1);
    shockRing(ctx, x, cy, 30 + kk * 380, 0.62, k === 1 ? GOLD[1] : RUBY[1], fade * (1 - kk), 3 - k * 0.6);
  }
  for (let i = 0; i < 14; i++) {
    const an = hash(i * 2.1) * TAU;
    const d = e * (40 + hash(i * 3.3) * 120);
    petal(ctx, x + Math.cos(an) * d, cy + Math.sin(an) * d * 0.7, 2.6 + hash(i) * 1.6, an + e * 4, fade, 'ruby', i % 2 ? 1 : -1);
  }
}
// The stopped world, over the whole screen (W x H), `k` 0..1 how far it has stopped: its colour drained to
// a cool lilac grey; a ruby vignette; the great ornate clock faint over the room, cogs turning slowly behind
// it while its hands are held, the second hand trembling; rose petals and sparkles hanging still in the air
// where they were; thin rings of glass round the clock.
export function drawTimeStop(ctx, W, H, k, time, cx = W / 2, cy = H / 2) {
  if (k <= 0.01) return;
  ctx.save();
  ctx.globalCompositeOperation = 'saturation';
  ctx.fillStyle = `rgba(128,128,128,${0.9 * k})`;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(110,96,168,${0.2 * k})`;
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(cx, cy, Math.min(W, H) * 0.3, cx, cy, Math.max(W, H) * 0.78);
  g.addColorStop(0, 'rgba(120,10,30,0)');
  g.addColorStop(0.7, `rgba(120,10,30,${0.22 * k})`);
  g.addColorStop(1, `rgba(90,4,20,${0.55 * k})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  const R = Math.min(W, H) * 0.4;
  ctx.globalAlpha = 0.16 * k;
  cog(ctx, cx - R * 1.05, cy - R * 0.35, R * 0.5, 14, time * 0.15, 'gold', 1);
  cog(ctx, cx + R * 1.08, cy + R * 0.3, R * 0.42, 12, -time * 0.18, 'gold', 1);
  ctx.globalAlpha = 0.24 * k;
  ornateClock(ctx, cx, cy, R, TAU * 6, 1, 'ruby', 0, { cogs: false, sec: Math.sin(time * 30) * 0.02 });
  ctx.globalAlpha = 0.5 * k;
  for (let i = 0; i < 3; i++) {
    ell(ctx, cx, cy, R * (1.12 + i * 0.12), R * (1.12 + i * 0.12));
    pen(ctx, i % 2 ? 'rgba(255,220,220,0.5)' : 'rgba(220,210,255,0.5)', 0.8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (let i = 0; i < 18; i++) {
    const px = hash(i * 3.1) * W;
    const py = hash(i * 7.7) * H * 0.85;
    if (i % 3 === 0) sparkle(ctx, px, py, 1.8 + hash(i * 5) * 1.6, 0.8 * k, LILAC[0]);
    else petal(ctx, px, py, 2.4 + hash(i * 9) * 1.6, hash(i * 4.4) * TAU, 0.75 * k, i % 2 ? 'ruby' : 'lilac', i % 4 ? 1 : -1);
  }
  ctx.restore();
}
// Time starting again (`u` 0..1): the great clock bursts into faceted shards flung outward, a ring of colour
// rolling back out over the room from the middle, a flash at its heart.
export function drawTimeResume(ctx, W, H, u, time, cx = W / 2, cy = H / 2) {
  if (u >= 1) return;
  const e = ease(u);
  const left = 1 - sstep(u / 0.7);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, W, H);
  ctx.ellipse(cx, cy, e * W * 0.9 + 1, e * H * 0.9 + 1, 0, 0, TAU, true);
  ctx.clip('evenodd');
  drawTimeStop(ctx, W, H, left, time, cx, cy);
  ctx.restore();
  glow(ctx, cx, cy, 40 + e * 160, '#ffffff', 0.6 * (1 - e));
  shockRing(ctx, cx, cy, e * W * 0.9, H / W, RUBY[1], 1 - e, 3);
  shockRing(ctx, cx, cy, e * W * 0.75, H / W, GOLD[1], (1 - e) * 0.8, 2);
  for (let i = 0; i < 26; i++) {
    const an = hash(i * 2.3) * TAU;
    const d = e * (60 + hash(i * 5.1) * 260);
    shard(ctx, cx + Math.cos(an) * d, cy + Math.sin(an) * d * 0.7, 3.5 + hash(i) * 6, an + e * 5 * (hash(i * 9) - 0.5), 1 - e, i % 3 ? LILAC[1] : RUBY[0]);
  }
}

// ---------- 2 Change Partners! ----------
// An instant swap through a pair of mirrors (the player, 2026-11-28: "the swap should just be an instant
// smooth heavily detailed teleport"). Round each twin an oval mirror snaps open (the floor twin's upright at
// (x0, y0), the ceiling twin's hanging at (x1, y1), each at her middle); at SWAP_AT both twins vanish into
// the glass in a ruby-white flash, a streak of light and satin joining the two mirrors, the glass rippling,
// and each steps out of the other mirror in a burst of shards, petals and sparkles; the mirrors close
// behind them (drawSwapBack under the twins, drawSwap over them). `u` 0..1 over SWAP_DUR seconds; swapAlpha(u) is how solid the twins are, SWAP_AT when their
// places change.
export const SWAP_DUR = 0.9;
export const SWAP_AT = 0.4;
export function swapAlpha(u) {
  if (u < SWAP_AT) return 1 - sstep((u - (SWAP_AT - 0.1)) / 0.1);
  return sstep((u - SWAP_AT - 0.02) / 0.14);
}
function ringSoft(ctx, x, y, r, al, col) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 1.2);
  pen(ctx, col, 2);
  ctx.stroke();
  pen(ctx, 'rgba(255,255,255,0.8)', 0.7);
  ctx.stroke();
  ctx.restore();
}
// (drawn behind the twins: the two mirrors, so each twin is seen stepping into the glass)
const swapOpen = (u) => (u < 0.3 ? back(u / 0.3) : 1 - sstep((u - 0.75) / 0.25));
export function drawSwapBack(ctx, x0, y0, x1, y1, u, time) {
  if (u <= 0 || u >= 1) return;
  // the mirrors: snapping open with a little overshoot, holding, closing once the twins are through
  const open = swapOpen(u);
  const ripple = clamp((u - (SWAP_AT - 0.08)) / 0.4, 0, 1);
  mirrorPortal(ctx, x0, y0, 22, 52, open, 1, time, ripple, false);
  mirrorPortal(ctx, x1, y1, 22, 52, open, 1, time + 0.37, ripple, true);
}
// (drawn over the twins: the flash, the streak joining the mirrors, the burst as each steps out)
export function drawSwap(ctx, x0, y0, x1, y1, u, time) {
  if (u <= 0 || u >= 1) return;
  const open = swapOpen(u);
  // the flash as both twins pass through
  const f = Math.exp(-(((u - SWAP_AT) / 0.07) ** 2));
  if (f > 0.01) {
    for (const [sd, look] of [[1, NIGHT_SATIN], [-1, WHITE_SATIN]]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) {
        const v = i / 24;
        pts.push([mix(x0, x1, v) + Math.sin(v * TAU + time * 6) * 8 * sd, mix(y0, y1, v)]);
      }
      satin(ctx, pts, 6, look[0], look[1], sd > 0 ? NIGHT[4] : LILAC[4], f, 3, time * 4 * sd);
    }
    ctx.save();
    ctx.globalAlpha *= f;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    pen(ctx, 'rgba(255,140,150,0.6)', 6);
    ctx.stroke();
    pen(ctx, 'rgba(255,255,255,0.95)', 2.4);
    ctx.stroke();
    ctx.restore();
  }
  for (const [x, y, sg] of [[x0, y0, 1], [x1, y1, -1]]) {
    glow(ctx, x, y, 70, '#ffffff', 0.8 * f);
    glow(ctx, x, y, 110, RUBY[1], 0.35 * f);
    sparkle(ctx, x, y, 22 * f, 1, '#ffffff');
    // the burst as each twin steps out: shards, petals and sparkles flung from the glass
    const e = clamp((u - SWAP_AT) / 0.45, 0, 1);
    if (e > 0 && e < 1) {
      const ee = 1 - (1 - e) ** 3;
      const fade = 1 - e;
      for (let i = 0; i < 16; i++) {
        const an = hash(i * 2.3 + sg) * TAU;
        const d = ee * (24 + hash(i * 3.9 + sg) * 46);
        const px = x + Math.cos(an) * d;
        const py = y + Math.sin(an) * d * 1.3;
        if (i % 3 === 0) shard(ctx, px, py, 2.6 + hash(i) * 2.4, an + ee * 4, fade, i % 2 ? SILVER[1] : RUBY[0]);
        else if (i % 3 === 1) petal(ctx, px, py, 2.2 + hash(i * 5) * 1.2, an + ee * 6, fade, sg > 0 ? 'lilac' : 'ruby', i % 2 ? 1 : -1);
        else sparkle(ctx, px, py, 2.2 * fade, 1, i % 2 ? SILVER[0] : PINK[0]);
      }
      ringSoft(ctx, x, y, 10 + ee * 60, fade, sg > 0 ? LILAC[2] : RUBY[1]);
    }
  }
  // a few sparkles lingering round the mirrors while they are open
  motes(ctx, x0 - 30, y0 - 50, 60, 100, 6, time, [SILVER[0], LILAC[0]], open * 0.8, 5, 0.6);
  motes(ctx, x1 - 30, y1 - 50, 60, 100, 6, time, [SILVER[0], PINK[0]], open * 0.8, 9, -0.6);
}

// ---------- 3 Eyes on Me ----------
// (from her eye: about 78 px down from where she hangs, or up from her feet; the pool of light where it
// meets the floor, z.floorDY below the spot)
function gazeWarn(ctx, z, x, y, p, time) {
  const ey = z.ceil ? y + 78 : y - 78;
  const dir = z.dir ?? 1;
  const len = 120 + ease(p) * 440;
  const spread = 0.14 + p * 0.3;
  // (down across the room, the way she faces)
  const ang = (dir > 0 ? 0.7 : Math.PI - 0.7) + Math.sin(time * 1.5) * 0.08;
  const floorY = z.floorDY != null ? y + z.floorDY : z.floorY ?? null;
  beam(ctx, x, ey, ang, len, spread, ['rgba(255,150,150,0.9)', 'rgba(216,40,60,0.45)', '#ffd0d0'], 0.35 + 0.65 * p, time, floorY);
  ornateClock(ctx, x, ey + (z.ceil ? 26 : -26), 6 + p * 5, time * 6, p, 'ruby', time, { cogs: false });
  drawIn(ctx, x, ey, 60, 8, p, time, 'ruby', 11);
}
function gazeHit(ctx, z, x, y, u, e, fade, time) {
  const ey = z.ceil ? y + 78 : y - 78;
  glow(ctx, x, ey, 80 + e * 460, RUBY[1], 0.42 * fade);
  shockRing(ctx, x, ey, 20 + e * 300, 0.7, RUBY[1], fade * (1 - e), 3);
  sparkle(ctx, x, ey, 10 + e * 12, fade, RUBY[0]);
}
// A little ruby clock over someone caught by her gaze: its hands still, a frosted ring of glass round it,
// petals hanging frozen beside it.
export function drawFrozenMark(ctx, x, y, k, time) {
  if (k <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= k;
  ell(ctx, x, y, 14, 14);
  const g = ctx.createRadialGradient(x, y, 6, x, y, 14);
  g.addColorStop(0, 'rgba(230,226,255,0)');
  g.addColorStop(1, 'rgba(230,226,255,0.55)');
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, LILAC[2], 1);
  ctx.stroke();
  ctx.restore();
  ornateClock(ctx, x, y, 8, 0, k, 'ruby', time, { cogs: false, sec: Math.sin(time * 30) * 0.03 });
  petal(ctx, x - 13, y + 4, 2.2, 0.6, k * 0.9, 'ruby');
  petal(ctx, x + 12, y - 6, 1.8, 2.2, k * 0.9, 'ruby', -1);
}

// ---------- 4 Metronome ----------
function vgrad(ctx, y0, y1, a, b) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, a);
  g.addColorStop(1, b);
  return g;
}
function metronome(ctx, x, y, s, swing, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  glow(ctx, 0, -s * 1.2, s * 3, SILVER[2], 0.3);
  // the foot: a silver plinth
  ctx.beginPath();
  ctx.roundRect(-s * 1.05, -s * 0.18, s * 2.1, s * 0.36, s * 0.12);
  ctx.fillStyle = vgrad(ctx, -s * 0.2, s * 0.2, SILVER[1], SILVER[3]);
  ctx.fill();
  pen(ctx, SILVER[4], Math.max(0.5, s * 0.07));
  ctx.stroke();
  // the body: a tall rounded pyramid in night satin
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, -s * 0.15);
  ctx.quadraticCurveTo(-s * 0.95, -s * 0.4, -s * 0.36, -s * 2.3);
  ctx.quadraticCurveTo(0, -s * 2.58, s * 0.36, -s * 2.3);
  ctx.quadraticCurveTo(s * 0.95, -s * 0.4, s * 0.9, -s * 0.15);
  ctx.closePath();
  const bg = ctx.createLinearGradient(-s, 0, s, 0);
  bg.addColorStop(0, NIGHT[3]);
  bg.addColorStop(0.4, NIGHT[1]);
  bg.addColorStop(1, NIGHT[3]);
  ctx.fillStyle = bg;
  ctx.fill();
  pen(ctx, NIGHT[4], Math.max(0.6, s * 0.09));
  ctx.stroke();
  // its scale: a pale slot with fine marks
  ctx.beginPath();
  ctx.moveTo(-s * 0.32, -s * 0.5);
  ctx.lineTo(-s * 0.14, -s * 2);
  ctx.lineTo(s * 0.14, -s * 2);
  ctx.lineTo(s * 0.32, -s * 0.5);
  ctx.closePath();
  ctx.fillStyle = SILVER[1];
  ctx.fill();
  ctx.strokeStyle = NIGHT[2];
  ctx.lineWidth = Math.max(0.3, s * 0.035);
  for (let i = 0; i < 7; i++) {
    const yy = -s * (0.65 + i * 0.2);
    ctx.beginPath();
    ctx.moveTo(-s * 0.08, yy);
    ctx.lineTo(s * 0.08, yy);
    ctx.stroke();
  }
  // a gold trim and a gold finial at its top
  ctx.beginPath();
  ctx.moveTo(-s * 0.86, -s * 0.32);
  ctx.lineTo(s * 0.86, -s * 0.32);
  pen(ctx, GOLD[2], Math.max(0.5, s * 0.08));
  ctx.stroke();
  ell(ctx, 0, -s * 2.42, s * 0.16, s * 0.16);
  ctx.fillStyle = GOLD[1];
  ctx.fill();
  // the swinging arm and its brass weight
  ctx.rotate(swing);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.3);
  ctx.lineTo(0, -s * 2.8);
  pen(ctx, SILVER[3], Math.max(0.8, s * 0.13));
  ctx.stroke();
  pen(ctx, SILVER[0], Math.max(0.4, s * 0.05));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.3, -s * 1.7);
  ctx.lineTo(s * 0.3, -s * 1.7);
  ctx.lineTo(s * 0.2, -s * 2.05);
  ctx.lineTo(-s * 0.2, -s * 2.05);
  ctx.closePath();
  const wg = ctx.createLinearGradient(-s * 0.3, 0, s * 0.3, 0);
  wg.addColorStop(0, GOLD[1]);
  wg.addColorStop(0.5, GOLD[0]);
  wg.addColorStop(1, GOLD[3]);
  ctx.fillStyle = wg;
  ctx.fill();
  pen(ctx, GOLD[4], Math.max(0.4, s * 0.06));
  ctx.stroke();
  ctx.restore();
}
function tickWarn(ctx, z, x, y, p, time) {
  const r = (z.w ?? 80) / 2;
  const b = p * 3;
  const f = b % 1;
  const kick = Math.exp(-f * 6);
  const swing = Math.sin(b * Math.PI) * 0.55;
  floorDisc(ctx, x, y, r * (1 + kick * 0.05), ['rgba(230,234,255,0.06)', `rgba(200,206,246,${0.16 + 0.14 * kick})`, 'rgba(140,150,210,0.3)'], NIGHT[1], 0.6 + 0.4 * p, { w: 1.6 + kick, marks: 24, turn: time * 0.3 });
  // a ring of sound pulsing out on each beat, and a quaver hopping up
  shockRing(ctx, x, y, r * (0.3 + 0.75 * f), 0.26, SILVER[2], (1 - f) * 0.9, 1.4);
  richNote(ctx, x + r * 0.5, y - 10 - f * 22, 2.2, (1 - f) * p, 'silver', 1, 0.2);
  metronome(ctx, x, y - 40 - Math.sin(time * 2) * 2, 12, swing, 0.6 + 0.4 * p);
}
function tickHit(ctx, z, x, y, u, e, fade, time) {
  const r = (z.w ?? 80) / 2;
  glow(ctx, x, y - 10, r * 1.4, SILVER[1], 0.6 * fade);
  floorDisc(ctx, x, y, r * (1 + e * 0.3), ['rgba(255,255,255,0.5)', 'rgba(230,236,255,0.4)', 'rgba(180,190,240,0.35)'], SILVER[4], fade, { w: 2.4, marks: 24 });
  shockRing(ctx, x, y, r * (1 + e * 1.4), 0.26, SILVER[1], fade * (1 - e), 2.4);
  sparkle(ctx, x, y - 6, 14 * fade, 1, SILVER[0]);
  for (let i = 0; i < 7; i++) {
    const an = -Math.PI * (0.12 + 0.76 * (i / 6));
    const d = e * (30 + hash(i * 3) * 24);
    if (i % 2) shard(ctx, x + Math.cos(an) * d * 1.3, y - 6 + Math.sin(an) * d, 3.4, an + e * 3, fade, SILVER[1]);
    else richNote(ctx, x + Math.cos(an) * d * 1.3, y - 6 + Math.sin(an) * d, 2.6, fade, 'silver', i % 4 ? 1 : 2, an + Math.PI / 2);
  }
}

// ---------- 5 Conductor's Cue ----------
function stave(ctx, x, y, w, al, lit, time) {
  if (al <= 0.01 || w < 2) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.fillStyle = vgrad(ctx, y - 26, y + 2, 'rgba(200,210,255,0)', lit ? 'rgba(240,244,255,0.5)' : 'rgba(170,180,240,0.22)');
  ctx.fillRect(x, y - 26, w, 28);
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    for (let k = 0; k <= 30; k++) {
      const px = x + (w * k) / 30;
      const py = y - 4 - i * 4 + Math.sin(k * 0.5 + i + time * 2) * 0.5;
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    pen(ctx, lit ? '#ffffff' : SILVER[2], lit ? 1.4 : 0.9);
    ctx.stroke();
  }
  for (let k = 1; k < 4; k++) {
    const bx = x + (w * k) / 4;
    ctx.beginPath();
    ctx.moveTo(bx, y - 4);
    ctx.lineTo(bx, y - 20);
    pen(ctx, lit ? '#ffffff' : SILVER[3], 1);
    ctx.stroke();
  }
  ctx.restore();
}
function cueWarn(ctx, z, x, y, p, time) {
  const w = z.w ?? 200;
  const dir = z.dir ?? 1;
  const on = ease(p / 0.5);
  const sx = dir > 0 ? x : x + w * (1 - on);
  stave(ctx, sx, y, w * on, 0.5 + 0.5 * p, false, time);
  clef(ctx, dir > 0 ? x + 6 : x + w - 6, y - 12, 2.4, on, 'silver');
  // notes of every kind gliding in along it, each trailing a streak of light
  for (let i = 0; i < 9; i++) {
    const v = clamp(p * 1.7 - i * 0.1, 0, 1);
    if (v <= 0) continue;
    const t = 0.12 + i * 0.095;
    const nx = dir > 0 ? x + v * w * t : x + w - v * w * t;
    const ny = y - 6 - ((i * 7) % 5) * 4;
    ctx.save();
    ctx.globalAlpha *= v * 0.5;
    const tg = ctx.createLinearGradient(nx - dir * 26, 0, nx, 0);
    tg.addColorStop(0, 'rgba(220,226,255,0)');
    tg.addColorStop(1, 'rgba(220,226,255,0.8)');
    ctx.fillStyle = tg;
    ctx.fillRect(Math.min(nx, nx - dir * 26), ny - 1.5, 26, 3);
    ctx.restore();
    richNote(ctx, nx, ny, 2.4, v, 'silver', i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0, Math.sin(time * 5 + i) * 0.15);
  }
  motes(ctx, x, y - 36, w, 34, 8, time, [SILVER[0], SILVER[1]], p * 0.8, 21);
}
function cueHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w ?? 200;
  stave(ctx, x, y, w, fade, true, time);
  glow(ctx, x + w / 2, y - 12, w * 0.6, SILVER[0], 0.35 * fade);
  for (let i = 0; i < 12; i++) {
    const nx = x + (w * (i + 0.5)) / 12;
    const h = e * (28 + hash(i * 3) * 46);
    richNote(ctx, nx + (hash(i) - 0.5) * 10, y - 12 - h, 2.8, fade, i % 4 === 3 ? 'lilac' : 'silver', i % 3 === 0 ? 2 : 1, (hash(i * 5) - 0.5) * e * 1.4);
    if (i % 2) sparkle(ctx, nx, y - 10 - h * 0.6, 3 * fade, 1, SILVER[0]);
  }
}

// ---------- 6 Boo! ----------
function mist(ctx, x, y, r, time, al) {
  if (al <= 0.01) return;
  for (let i = 0; i < 7; i++) {
    const v = (time * 0.35 + hash(i * 1.3)) % 1;
    const px = x + (hash(i * 3.7) - 0.5) * r * 1.5 + Math.sin(time + i) * 4;
    const py = y - 4 - v * r * 0.9;
    const rr = r * (0.3 + 0.3 * hash(i * 2.2)) * (0.6 + v);
    const g = ctx.createRadialGradient(px, py, 0, px, py, rr);
    g.addColorStop(0, `rgba(250,246,255,${0.55 * al * Math.sin(Math.PI * v)})`);
    g.addColorStop(1, 'rgba(250,246,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(px - rr, py - rr, rr * 2, rr * 2);
  }
}
function booWarn(ctx, z, x, y, p, time) {
  const r = (z.w ?? 80) / 2;
  floorDisc(ctx, x, y, r, ['rgba(255,255,255,0.1)', 'rgba(236,224,255,0.28)', 'rgba(200,180,240,0.35)'], LILAC[3], 0.5 + 0.5 * p, { w: 1.6, marks: 16, turn: -time * 0.5 });
  mist(ctx, x, y, r, time, p);
  // a curl of mist winding up out of the floor
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const v = i / 24;
    pts.push([x + Math.sin(v * TAU * 1.2 + time * 2) * r * 0.4 * (1 - v * 0.5), y - v * (30 + p * 40)]);
  }
  satin(ctx, pts, 6, WHITE_SATIN[0], WHITE_SATIN[1], LILAC[3], 0.5 * p, 2, time);
  for (let i = 0; i < 5; i++) {
    const v = (time * 0.6 + hash(i * 2.1)) % 1;
    const px = x + (hash(i * 3.7) - 0.5) * r * 1.4;
    puff(ctx, px, y - 8 - v * 46 * p, (3.4 + hash(i) * 2.4) * (0.5 + 0.5 * p), Math.sin(Math.PI * v) * 0.9 * p, (hash(i * 9) - 0.5) * 0.4, 0.8);
  }
  batBow(ctx, x, y - 24 - p * 24 + Math.sin(time * 6) * 2, 4.4 + p * 2, p, Math.sin(time * 14) * 0.5);
  for (let k = 0; k < 2; k++) {
    const v = (time * 0.7 + k * 0.5) % 1;
    bubbleText(ctx, 'hee', x + (k ? -18 : 18), y - 56 - v * 16, 9, '#ffffff', LILAC[1], LILAC[4], Math.sin(Math.PI * v) * p, k ? -0.15 : 0.15);
  }
}
function booHit(ctx, z, x, y, u, e, fade, time) {
  const r = (z.w ?? 80) / 2;
  glow(ctx, x, y - 30, r * 2, LILAC[1], 0.5 * fade);
  floorDisc(ctx, x, y, r * (1 + e * 0.3), ['rgba(255,255,255,0.4)', 'rgba(240,232,255,0.35)', 'rgba(200,180,240,0.4)'], LILAC[3], fade, { w: 2.2, marks: 16 });
  shockRing(ctx, x, y - 30, 10 + e * r * 1.6, 0.8, LILAC[2], fade * (1 - e), 2.4);
  for (let i = 0; i < 12; i++) {
    const an = -Math.PI * (0.02 + 0.96 * (i / 11));
    const d = e * (28 + hash(i * 2.2) * 34);
    puff(ctx, x + Math.cos(an) * d * 1.35, y - 26 + Math.sin(an) * d, 4.6 + hash(i) * 2.6, fade, an + Math.PI / 2, 0.6);
  }
  for (let i = 0; i < 10; i++) {
    const an = hash(i * 5.3) * TAU;
    const d = e * (20 + hash(i * 2.7) * 50);
    if (i % 2) sparkle(ctx, x + Math.cos(an) * d, y - 30 + Math.sin(an) * d * 0.7, 2.6 * fade, 1, i % 4 ? LILAC[0] : PINK[1]);
    else petal(ctx, x + Math.cos(an) * d, y - 30 + Math.sin(an) * d * 0.7, 2.4, an + e * 3, fade, 'lilac');
  }
  bubbleText(ctx, 'BOO!', x, y - 70 - e * 8, 15 + back(u / 0.3) * 5, '#ffffff', LILAC[1], LILAC[4], fade, -0.08);
}

// ---------- 7 Rewind ----------
function rewindWarn(ctx, z, x, y, p, time) {
  const r = 17;
  for (const [k, sp] of [[1.35, 0.6], [1.6, -0.45]]) {
    floorDisc(ctx, x, y, r * k, ['rgba(255,255,255,0)', 'rgba(220,210,255,0.08)', 'rgba(200,180,240,0.12)'], LILAC[3], 0.4 + 0.6 * p, { w: 1, marks: 20, turn: time * sp });
  }
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.36);
  ornateClock(ctx, 0, 0, r, -time * 5, 0.5 + 0.5 * p, 'silver', -time, { cogs: false, sec: -time * 12 });
  ctx.restore();
  // a satin ribbon arrow circling it the wrong way, above it
  const pts = [];
  const a0 = -time * 2.4;
  for (let i = 0; i <= 28; i++) {
    const an = a0 - (i / 28) * TAU * 0.8;
    pts.push([x + Math.cos(an) * (r + 10), y - 26 + Math.sin(an) * (r + 10) * 0.5]);
  }
  satin(ctx, pts, 6, WHITE_SATIN[0], WHITE_SATIN[1], LILAC[4], 0.5 + 0.5 * p, 2, time);
  const tip = pts[pts.length - 1];
  const prev = pts[pts.length - 3];
  const ang = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]);
  ctx.save();
  ctx.globalAlpha *= 0.5 + 0.5 * p;
  ctx.translate(...tip);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(6, 0);
  ctx.quadraticCurveTo(0, -1, -3, -5);
  ctx.quadraticCurveTo(-1.5, 0, -3, 5);
  ctx.quadraticCurveTo(0, 1, 6, 0);
  ctx.fillStyle = LILAC[1];
  ctx.fill();
  pen(ctx, LILAC[4], 1);
  ctx.stroke();
  ctx.restore();
  // sparkles and petals flowing backwards into it, as sand runs back up a glass
  drawIn(ctx, x, y - 10, 50, 10, p, time, 'lilac', 31);
}
function rewindHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, 0.36);
  ornateClock(ctx, 0, 0, 17 * (1 - e * 0.5), 0, fade, 'silver', time, { cogs: false });
  ctx.restore();
  shockRing(ctx, x, y - 26, 28 * (1 - e * 0.8), 0.55, LILAC[2], fade, 3 * (1 - e) + 1);
  glow(ctx, x, y - 26, 30, LILAC[0], 0.7 * fade);
  sparkle(ctx, x, y - 26, 12 * fade, 1, LILAC[0]);
}

// ---------- 8 Mirror Step ----------
function mirrorWarn(ctx, z, x, y, p, time) {
  const w = z.w ?? 200;
  const gleam = (time * 0.5) % 1;
  const h = 8 + ease(p) * 12;
  const crack = sstep((p - 0.7) / 0.3);
  mirrorStrip(ctx, x, y, w, h, 0.4 + 0.6 * p, gleam, false, crack, time);
  if (z.ceilY != null) mirrorStrip(ctx, x, z.ceilY, w, h, 0.4 + 0.6 * p, 1 - gleam, true, crack, time);
  motes(ctx, x, y - 30, w, 26, 8, time, [SILVER[0], LILAC[0]], p * 0.7, 41);
  if (z.ceilY != null) motes(ctx, x, z.ceilY + 4, w, 26, 8, time, [SILVER[0], LILAC[0]], p * 0.7, 43, -0.25);
}
function mirrorHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w ?? 200;
  mirrorStrip(ctx, x, y, w, 20, fade * (1 - e), 0.5, false, 1, time);
  if (z.ceilY != null) mirrorStrip(ctx, x, z.ceilY, w, 20, fade * (1 - e), 0.5, true, 1, time);
  glow(ctx, x + w / 2, y - 10, w * 0.6, '#ffffff', 0.4 * fade);
  for (let i = 0; i < 18; i++) {
    const sx = x + (w * (i + 0.5)) / 18;
    shard(ctx, sx + (hash(i) - 0.5) * 8, y - 10 - e * (22 + hash(i * 3) * 48), 3 + hash(i * 7) * 4, (hash(i * 5) - 0.5) * 3 + e * 3, fade, i % 5 ? SILVER[1] : PINK[0]);
    if (z.ceilY != null) shard(ctx, sx + (hash(i * 2) - 0.5) * 8, z.ceilY + 10 + e * (22 + hash(i * 4) * 48), 3 + hash(i * 8) * 4, (hash(i * 6) - 0.5) * 3 - e * 3, fade, i % 5 ? SILVER[1] : LILAC[1]);
  }
}

// ---------- 9 Twin Bond ----------
// Two satin ribbons braided between the twins (a, b), a jewelled heart locket at the knot beating, light and
// little hearts flowing along it to the one with less health (`to` 0: toward a, 1: toward b); `k` 0..1.
export function drawBond(ctx, ax, ay, bx, by, k, to, time) {
  if (k <= 0.01) return;
  for (const [sd, look] of [[1, NIGHT_SATIN], [-1, WHITE_SATIN]]) {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const v = i / 40;
      pts.push([mix(ax, bx, v) + Math.sin(v * TAU * 3 + time * 2) * 6 * sd, mix(ay, by, v) + Math.cos(v * TAU * 3 + time * 2) * 3 * sd]);
    }
    satin(ctx, pts, 7, look[0], look[1], sd > 0 ? NIGHT[4] : LILAC[4], k * 0.95, 6, time * sd);
  }
  locket(ctx, mix(ax, bx, 0.5), mix(ay, by, 0.5), 7, k, Math.max(0, Math.sin(time * 6)) ** 4);
  for (let i = 0; i < 6; i++) {
    const v = (time * 0.6 + i / 6) % 1;
    const w = to ? v : 1 - v;
    const px = mix(ax, bx, w);
    const py = mix(ay, by, w);
    if (i % 2) sparkle(ctx, px, py, 3 * Math.sin(Math.PI * v) * k, 1, PINK[0]);
    else {
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * v) * k;
      ctx.beginPath();
      const s = 2.4;
      ctx.moveTo(px, py + s * 0.9);
      ctx.bezierCurveTo(px - s * 1.3, py + s * 0.1, px - s * 1.1, py - s * 1.05, px, py - s * 0.4);
      ctx.bezierCurveTo(px + s * 1.1, py - s * 1.05, px + s * 1.3, py + s * 0.1, px, py + s * 0.9);
      ctx.fillStyle = PINK[1];
      ctx.fill();
      pen(ctx, PINK[3], 0.6);
      ctx.stroke();
      ctx.restore();
    }
  }
  glow(ctx, to ? bx : ax, to ? by : ay, 40, PINK[1], 0.35 * k * (0.7 + 0.3 * Math.sin(time * 4)));
}

// ---------- 10 Pas de Deux ----------
function pasWarn(ctx, z, x, y, p, time) {
  const cy = y - 140;
  glow(ctx, x, cy, 260, RUBY[2], 0.15 * p);
  for (const [sd, look] of [[1, NIGHT_SATIN], [-1, WHITE_SATIN]]) {
    const pts = [];
    for (let i = 0; i <= 44; i++) {
      const v = i / 44;
      const an = v * TAU * 1.3 + time * 1.4 * sd;
      const rr = (1 - v) * (60 + (1 - p) * 160) + 8;
      pts.push([x + Math.cos(an) * rr * sd, cy + Math.sin(an) * rr * 0.55]);
    }
    satin(ctx, pts, 8, look[0], look[1], sd > 0 ? NIGHT[4] : LILAC[4], 0.3 + 0.6 * p, 5, time * sd);
  }
  ornateClock(ctx, x - 74, cy, 16 + back(p / 0.6) * 12, time * 4, 0.4 + 0.6 * p, 'ruby', time);
  ornateClock(ctx, x + 74, cy, 16 + back(p / 0.6) * 12, -time * 4, 0.4 + 0.6 * p, 'silver', -time);
  for (let i = 0; i < 12; i++) {
    const v = (time * 0.45 + i / 12) % 1;
    const an = i * 1.3 + time;
    const px = x + Math.cos(an) * (1 - v) * 180;
    const py = cy + Math.sin(an) * (1 - v) * 80;
    const al = Math.sin(Math.PI * v) * p;
    if (i % 3 === 0) richNote(ctx, px, py, 2.6, al, i % 2 ? 'silver' : 'lilac', i % 2 ? 1 : 2, an);
    else petal(ctx, px, py, 2.6, an * 2 + time * 2, al, i % 2 ? 'ruby' : 'lilac', i % 4 ? 1 : -1);
  }
}
function pasHit(ctx, z, x, y, u, e, fade, time) {
  const cy = y - 140;
  glow(ctx, x, cy, 80 + e * 300, '#ffffff', 0.6 * (1 - e));
  for (let k = 0; k < 3; k++) {
    const kk = clamp(e * 1.2 - k * 0.1, 0, 1);
    shockRing(ctx, x, cy, 40 + kk * 470, 0.6, k === 0 ? RUBY[1] : k === 1 ? GOLD[1] : SILVER[1], fade * (1 - kk * 0.7), 5 - k);
  }
  for (let i = 0; i < 24; i++) {
    const an = hash(i * 2.7) * TAU;
    const d = e * (60 + hash(i * 4.2) * 220);
    const px = x + Math.cos(an) * d;
    const py = cy + Math.sin(an) * d * 0.6;
    if (i % 3 === 0) shard(ctx, px, py, 4 + hash(i) * 3, an + e * 3, fade, i % 2 ? RUBY[0] : SILVER[1]);
    else if (i % 3 === 1) richNote(ctx, px, py, 3, fade, i % 2 ? 'silver' : 'lilac', 1, an);
    else petal(ctx, px, py, 3, an + e * 5, fade, i % 2 ? 'ruby' : 'lilac');
  }
}

// ---------- Basic attacks ----------
function noteWarn(ctx, z, x, y, p, time) {
  floorDisc(ctx, x, y, (z.w ?? 60) / 2, ['rgba(255,255,255,0.05)', 'rgba(210,216,250,0.2)', 'rgba(160,170,230,0.3)'], NIGHT[1], 0.4 + 0.6 * p, { w: 1.4, marks: 12, turn: time });
  richNote(ctx, x, y - 30 - Math.sin(time * 6) * 2, 2.6, p, 'silver', 1, -0.2);
}
function noteHit(ctx, z, x, y, u, e, fade, time) {
  glow(ctx, x, y - 10, 30, SILVER[1], 0.6 * fade);
  floorDisc(ctx, x, y, ((z.w ?? 60) / 2) * (1 + e * 0.2), ['rgba(255,255,255,0.4)', 'rgba(235,240,255,0.35)', 'rgba(180,190,240,0.35)'], SILVER[4], fade, { w: 1.8 });
  richNote(ctx, x, y - 30 + e * 22, 3.4, fade, 'silver', 1, -0.3 + e * 0.5);
  sparkle(ctx, x, y - 8, 10 * fade, 1, SILVER[0]);
  shockRing(ctx, x, y - 8, 6 + e * 26, 0.6, SILVER[1], fade * (1 - e), 1.6);
}
function puffWarn(ctx, z, x, y, p, time) {
  floorDisc(ctx, x, y, (z.w ?? 60) / 2, ['rgba(255,255,255,0.05)', 'rgba(240,230,255,0.2)', 'rgba(200,180,240,0.3)'], LILAC[3], 0.4 + 0.6 * p, { w: 1.4, marks: 12, turn: -time });
  mist(ctx, x, y, (z.w ?? 60) / 2, time, p * 0.7);
}
function puffHit(ctx, z, x, y, u, e, fade, time) {
  glow(ctx, x, y - 16, 30, LILAC[1], 0.5 * fade);
  for (let i = 0; i < 5; i++) puff(ctx, x + (i - 2) * 9 * (0.6 + e), y - 14 - e * 12 - (i % 2) * 6, 4.6, fade, (i - 2) * 0.2, 0.5);
  sparkle(ctx, x, y - 22, 7 * fade, 1, LILAC[0]);
  shockRing(ctx, x, y - 16, 6 + e * 24, 0.7, LILAC[2], fade * (1 - e), 1.6);
}

// (a zone of the fight's own that draws nothing: Twin Bond's mending lands with drawBond)
const none = () => {};
export const TWINS_FX = {
  twNone: { warn: none, hit: none },
  twFrozen: { warn: frozenWarn, hit: frozenHit },
  twGaze: { warn: gazeWarn, hit: gazeHit },
  twTick: { warn: tickWarn, hit: tickHit },
  twCue: { warn: cueWarn, hit: cueHit },
  twBoo: { warn: booWarn, hit: booHit },
  twRewind: { warn: rewindWarn, hit: rewindHit },
  twMirror: { warn: mirrorWarn, hit: mirrorHit },
  twPas: { warn: pasWarn, hit: pasHit },
  twNote: { warn: noteWarn, hit: noteHit },
  twPuff: { warn: puffWarn, hit: puffHit },
};
// How long each landing plays (s).
export const TWINS_HOLD = { twNone: 0.1, twFrozen: 1, twGaze: 0.7, twTick: 0.7, twCue: 0.8, twBoo: 0.9, twRewind: 0.7, twMirror: 0.9, twPas: 1.3, twNote: 0.5, twPuff: 0.5 };
// (they draw their own floor markers: render/bossfx.js leaves out the plain one under them)
export const TWINS_OWN_WARN = Object.keys(TWINS_FX);
