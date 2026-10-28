// Draws Snow wolf, the Beastmaster's companion (world/pets.js): a small wolf girl on the hero's rig
// with a rig of her own (hero.js's 'drag' act: the slouch, the sighs, ears and tail and hair and
// kimono bouncing; no player uses it), dragging the Fang of the Wolf Queen behind her. She walks,
// jumps and climbs on her own body (world/pets.js). The sword is drawn here, turned to each thing she
// does: trailing on the ground as she walks, hanging down her back as she climbs, spun round her
// in a full circle (Fine, I'll Go; her swings), heaved overhead and dropped (her slam), planted
// before her like a wall (Moon Ward), the crescent through its blade glowing as she casts.

import { drawHero } from './hero.js';
import { createAnim, stepAnim } from './animator.js';
import { footShadow } from './pixel.js';
import { wild } from '../world/melee.js';
import { procOf } from '../world/combat.js';

// Her look (the hero's parts): a short tomboy wolf cut in white with ice-blue tips, blue cat eyes
// half shut, small thick brows, a bored mouth, wolf ears and tail, an oversized white kimono, barefoot.
export const SNOW_LOOK = {
  hairStyle: 'wolfsleek', hairColor: '#eef1f8', hairTip: '#9fd8ff', eyeStyle: 'cat', eyeColor: '#4fc8ff', browStyle: 'stubby',
  earStyle: 'wolf', tail: 'wolf', face: 'cool', lid: 0.85, mouth: 'bored', outfit: 'bigkimono', outfitColor: '#f6f8fc', act: 'drag',
};
// She's a head shorter than the Beastmaster (the whole figure scaled, never squashed).
const SCALE = 0.72;

// ---------- The Fang of the Wolf Queen ----------
// Drawn once, in its own units (1 = one body px) along its axis: the hilt at 0, the blade running
// to +LEN, the grip and pommel back toward -13. +y is the sword's top (the wolf head's ears), which
// faces the sky as she drags it behind her.
const LEN = 64;
const RES = 3;
const STEEL = '#e3e9f2';
const STEEL_SH = '#b7c3d6';
const STEEL_DK = '#8796b2';
const INK = '#2e3850';
const ICE = '#8fe6ff';
const ICE_DK = '#3c9cd0';
const GOLD = '#f2c94c';
const GOLD_DK = '#b8862a';
const SILVER = '#eef2f8';
const SILVER_SH = '#bcc7da';
const OX = 18; // where the hilt sits in the sword's canvas
const OY = 16;
let SWORD = null;
function sword() {
  if (SWORD) return SWORD;
  const cv = document.createElement('canvas');
  cv.width = (LEN + 24) * RES;
  cv.height = 32 * RES;
  const c = cv.getContext('2d');
  c.scale(RES, RES);
  c.translate(OX, OY);
  const path = (pts) => {
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.closePath();
  };
  const poly = (pts, fill, line = INK, w = 1) => {
    path(pts);
    c.fillStyle = fill;
    c.fill();
    if (line) {
      c.lineWidth = w;
      c.strokeStyle = line;
      c.stroke();
    }
  };
  const dot = (x, y, r, fill, line = null) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = fill;
    c.fill();
    if (line) {
      c.lineWidth = 0.8;
      c.strokeStyle = line;
      c.stroke();
    }
  };
  // The blade: broad and pale, two wolf fangs cut into its back edge, frosted ice along both
  // edges, a gold-inlaid fuller with ice runes, a crescent moon pierced through it.
  const back = [[-3, 4.8], [26, 4.6], [27.4, 2.8], [28.8, 4.6], [31.4, 4.5], [32.8, 2.7], [34.2, 4.4], [LEN - 10, 4], [LEN, 0]];
  const edge = [[LEN - 10, -4], [-3, -4.8]];
  poly([...back, ...edge], STEEL);
  poly([[-3, -0.4], [LEN - 10, -0.3], [LEN - 1, -0.1], [LEN - 10, -3.8], [-3, -4.6]], STEEL_SH, null);
  poly([[12, -4.6], [LEN - 10, -3.9], [LEN - 1.2, -0.2], [LEN - 10, -3.1], [12, -3.7]], '#c6f1ff', null);
  poly([[35, 4.3], [LEN - 10, 3.9], [LEN - 1.2, 0.2], [LEN - 10, 3.1], [35, 3.4]], '#c6f1ff', null);
  poly([[12, -0.7], [LEN - 16, -0.5], [LEN - 16, 0.5], [12, 0.7]], STEEL_DK, null);
  poly([[12, -0.25], [LEN - 16, -0.15], [LEN - 16, 0.15], [12, 0.25]], GOLD, null);
  for (const x of [38, 43, 48]) poly([[x, -1.4], [x + 1.2, 0], [x, 1.4], [x - 1.2, 0]], ICE, ICE_DK, 0.5);
  c.save();
  c.globalCompositeOperation = 'destination-out';
  c.beginPath();
  c.arc(19, 0, 2.6, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.beginPath();
  c.arc(19, 0, 2.6, 0, Math.PI * 2);
  c.lineWidth = 0.8;
  c.strokeStyle = GOLD_DK;
  c.stroke();
  dot(20.2, 0.6, 2.2, STEEL);
  path([...back, ...edge]);
  c.lineWidth = 1;
  c.strokeStyle = INK;
  c.stroke();
  // The guard: a silver wolf's head holding the blade in its jaws: a ruff of fur flaring back,
  // ears up, an ice-blue eye, fangs bared over and under the steel, a gold crown on its brow.
  poly([[-3, 8], [-8.4, 12], [-6, 8], [-10, 7.6], [-5.6, 5.4], [-9.6, 3.6], [-4, 3]], SILVER);
  poly([[-3, -5], [-8.4, -9.6], [-6, -6.2], [-10, -5.4], [-5.6, -3.4], [-9.4, -1.4], [-4, -1]], SILVER);
  poly([[-1, 9.6], [-3.4, 14.6], [2.6, 10.4]], SILVER);
  poly([[-0.6, 10], [-2.4, 13], [1.4, 10.4]], '#d9b8c8', null);
  poly([[2, 10.4], [1, 15], [5, 10]], SILVER);
  poly([[-4.4, 3], [-3.4, 8], [0, 10.4], [3.4, 10.6], [6.4, 9.2], [10.6, 7.8], [12.6, 6.4], [12, 5], [4, 5.2], [-1, 4.6], [-4.4, 4]], SILVER);
  poly([[-4.4, 4], [-1, 4.6], [4, 5.2], [12, 5], [11, 5.8], [4, 6.4], [-3.6, 6.2]], SILVER_SH, null);
  poly([[-4.6, -4.6], [4, -5], [10.6, -5.2], [11.4, -6.4], [6, -7.6], [0, -7.8], [-3.4, -6.4]], SILVER);
  poly([[-4.6, 4], [-4.6, -4.6], [-2.6, -4.6], [-2.6, 4]], SILVER);
  for (const x of [7.6, 10]) poly([[x - 0.8, 5.1], [x + 0.8, 5.1], [x, 3.2]], '#ffffff', INK, 0.5);
  for (const x of [6.4, 9]) poly([[x - 0.8, -5.1], [x + 0.8, -5.1], [x, -3.3]], '#ffffff', INK, 0.5);
  dot(12.6, 6.2, 0.9, '#2a3048');
  poly([[4.6, 7.4], [7.6, 8], [6.2, 6.8]], ICE, ICE_DK, 0.4);
  c.lineWidth = 0.6;
  c.strokeStyle = INK;
  c.beginPath();
  c.moveTo(3.4, 8.8);
  c.lineTo(7.8, 8.6);
  c.stroke();
  poly([[0, 10.2], [0.4, 12.8], [1.4, 11.4], [2.2, 13.4], [3, 11.4], [4, 12.8], [4.4, 10.2]], GOLD, GOLD_DK, 0.6);
  dot(2.2, 11, 0.55, ICE);
  // The grip in white leather bound with gold, a gold crown pommel set with a great ice stone, and
  // a white fur tassel hanging from it.
  poly([[-3.4, 1.7], [-9, 1.5], [-9, -1.5], [-3.4, -1.7]], '#f4f1ea');
  c.strokeStyle = GOLD_DK;
  c.lineWidth = 0.6;
  for (let x = -4.2; x > -9; x -= 1.5) {
    c.beginPath();
    c.moveTo(x, 1.5);
    c.lineTo(x - 0.9, -1.5);
    c.stroke();
  }
  poly([[-9, 2.6], [-9.8, 3.8], [-10.6, 2.6], [-11.6, 3.8], [-12.4, 2.6], [-13.2, 3.8], [-13.2, -2.6], [-9, -2.6]], GOLD, GOLD_DK, 0.7);
  dot(-11.1, 0, 1.5, ICE, ICE_DK);
  dot(-11.5, 0.5, 0.5, '#ffffff');
  poly([[-12, -2.6], [-13.4, -6.2], [-12.6, -8.8], [-11, -9.6], [-10.2, -7.6], [-11, -5.4], [-11, -2.6]], '#ffffff', SILVER_SH, 0.6);
  dot(-11.4, -3, 0.7, ICE);
  return (SWORD = cv);
}

// Where her hand holds the hilt as she drags it, from her feet (facing right), in body px.
const HILT = [-9.6, 6.6];

// The sword with its hilt at (hx, hy), turned to `ang`; `top` (1 or -1) which side of it is the
// sky side. `glow` (0-1) lights the crescent.
function drawSword(ctx, hx, hy, ang, top, glow) {
  const cv = sword();
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ang);
  ctx.scale(1, top);
  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(cv, -OX * SCALE, -OY * SCALE, (cv.width * SCALE) / RES, (cv.height * SCALE) / RES);
  if (glow > 0) {
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(19 * SCALE, 0, 0, 19 * SCALE, 0, 9 * SCALE);
    g.addColorStop(0, `rgba(220, 236, 255, ${0.9 * glow})`);
    g.addColorStop(1, 'rgba(120, 160, 240, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(10 * SCALE, -9 * SCALE, 18 * SCALE, 18 * SCALE);
  }
  ctx.restore();
}

// Her sleeve wrapped round the grip (her hand lost inside it).
function drawGrip(ctx, hx, hy, ang) {
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.ellipse(-6.2 * SCALE, 0.4 * SCALE, 1.9 * SCALE, 2.6 * SCALE, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = '#f6f8fc';
  ctx.fill();
  ctx.lineWidth = SCALE * 0.7;
  ctx.strokeStyle = INK;
  ctx.stroke();
  ctx.restore();
}

// The angle the sword lies at when dragged with its tip on the ground, hilt at height h (px).
function trailAngle(h, dir) {
  const reach = LEN * SCALE;
  const along = Math.sqrt(Math.max(0, reach * reach - h * h));
  return Math.atan2(h, -along * dir);
}

// The rig's walk and bounce springs, kept per companion between frames.
const ANIMS = new WeakMap();

export function drawSnowWolf(ctx, world, s, cam, time) {
  let st = ANIMS.get(s);
  if (!st) ANIMS.set(s, (st = { anim: createAnim(), last: time }));
  const dt = Math.max(0, Math.min(0.1, time - st.last));
  st.last = time;
  const a = s.act;
  const t = a ? world.now - a.t0 : 0;
  const dir = s.dir || 1;
  const x = Math.round(s.x - cam.x);
  const y = Math.round(s.y - cam.y);
  // Fed Up the crescent burns; Queen's Awakening opens her eyes.
  const fed = wild(world);
  const awake = fed && procOf(world.char, 'alpha');
  let look = awake ? { ...SNOW_LOOK, lid: 0.15 } : SNOW_LOOK;
  let glow = fed ? 0.6 + 0.3 * Math.sin(time * 6) : 0;
  const body = s.body ?? { onGround: true, rope: null, vy: 0, y: s.y };
  stepAnim(st.anim, { vx: s.moving ? s.vx / SCALE : 0, vy: body.vy, onGround: body.onGround, rope: body.rope, facing: dir, y: body.y }, dt);
  const pose = body.rope ? 'climb' : !body.onGround ? 'jump' : s.moving ? 'walk' : 'idle';
  let facing = dir;
  // Where the hilt is and how the sword lies: dragged behind her unless she's doing something.
  let hx = x + HILT[0] * SCALE * dir;
  let hy = y - HILT[1] * SCALE;
  let ang = trailAngle(y - 2 - hy, dir);
  let front = false; // the sword drawn over her (planted in front)
  let held = true;
  const spin = (k) => {
    // A full turn, carried round by the sword's weight; she turns with it.
    const turn = Math.min(1, k) * Math.PI * 2;
    ang += dir * turn;
    hy = y - (HILT[1] + 3 * Math.sin(Math.min(1, k) * Math.PI)) * SCALE;
    facing = Math.floor(Math.min(1, k) * 4) % 2 ? -dir : dir;
  };
  if (body.rope) {
    // Climbing: the sword hangs straight down her back.
    held = false;
    hx = x;
    hy = y - 22 * SCALE;
    ang = Math.PI / 2;
  } else if (a?.kind === 'go' && a.phase === 'spin') spin(t / 0.3);
  else if (a?.kind === 'swing') spin(t / 0.4);
  else if (a?.kind === 'slam') {
    // Dragged up over her head, wobbling, then let fall on the ground ahead.
    const up = Math.min(1, t / 0.32);
    const down = Math.max(0, Math.min(1, (t - 0.32) / 0.1));
    const wob = up < 1 ? Math.sin(t * 40) * 0.08 * up : 0;
    const raised = Math.PI * 1.5 + wob;
    const hit = Math.PI * 2 + 0.12;
    const k = dir > 0 ? Math.PI + (raised - Math.PI) * up + (hit - raised) * down : 0;
    ang = dir > 0 ? k : Math.PI - (Math.PI + (raised - Math.PI) * up + (hit - raised) * down);
    hx = x + (HILT[0] + 6 * up - 2 * down) * SCALE * dir;
    hy = y - (HILT[1] + 10 * up * (1 - down) + 2 * down) * SCALE;
    look = { ...look, mouth: up < 1 ? 'grit' : 'bored' };
  } else if (a?.kind === 'flick') {
    // A lazy tilt of the blade, and a crescent leaves it.
    ang -= dir * 0.3 * Math.sin(Math.min(1, t / 0.3) * Math.PI);
    glow = Math.max(glow, 1 - t / 0.35);
  } else if (a?.kind === 'cast') {
    // The crescent lights up as moonlight gathers in it.
    glow = Math.max(glow, Math.min(1, t / 0.15) * (1 - Math.max(0, t - 0.45) / 0.15));
  } else if (a?.kind === 'howl') {
    look = { ...look, mouth: 'ah', lid: 0.3 };
  } else if (a?.kind === 'ward') {
    // Planted point-down in front of her like a wall; arms crossed behind it.
    front = true;
    held = false;
    hx = x + 12 * SCALE * dir;
    hy = y - (LEN - 2) * SCALE;
    ang = Math.PI / 2;
    look = { ...look, act: 'pout' };
  }
  // The sky side of the sword: its wolf head's ears point up as she drags it.
  const top = Math.cos(ang) < 0 ? 1 : -1;
  if (body.onGround && (a?.kind !== 'go' || a.phase !== 'dash')) footShadow(ctx, x, y, 9, 0, 0.8);
  if (!front) drawSword(ctx, hx, hy, ang, top, glow);
  drawHero(ctx, look, null, x, y, { pose, vy: body.vy, time, facing, seed: 3, scale: SCALE }, st.anim);
  if (front) drawSword(ctx, hx, hy, ang, dir > 0 ? -1 : 1, glow);
  else if (held) drawGrip(ctx, hx, hy, ang);
}
