// Town life: the residents of each town (data/townsfolk.js) going about their day: apprentices
// loosing arrows at the range, kids playing tag round the fountain with the dog at their heels,
// trainees whacking dummies, students practising spells, a sailor hauling crates, cats asleep on
// the rooftops. Everything is worked out from time alone, like the strolling villagers, so it
// costs the world nothing; only who you've just walked up to is remembered, so they can turn and
// say hello.

import { drawHero, HAIR_STYLES, PICKABLE_EYE_STYLES, OUTFIT_STYLES, BROW_STYLES } from './hero.js';
import { createAnim, stepAnim } from './animator.js';
import { R, E, T, F, snap, footShadow } from './pixel.js';
import { art, place } from './scenery.js';
import { drawBubble } from '../ui/chat.js';
import { settings } from '../core/settings.js';
import { groundAt } from '../world/physics.js';
import { TOWNSFOLK } from '../data/townsfolk.js';

const TAU = Math.PI * 2;
const hash = (n) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const pick = (list, seed) => list[Math.floor(seed * list.length) % list.length];

// ---------- Looks ----------

const HAIR = ['#e9ebfa', '#ff9ec0', '#f5c95c', '#b9a7ff', '#7a5238', '#3b3650', '#9be08f', '#ffb38a', '#8fd3ff'];
const SKIN = ['#fff0e6', '#fbd9bf', '#e7b48f', '#c98e66', '#8a5a3c'];
const CLOTHES = ['#ffc2d6', '#bfe0ff', '#bff0dc', '#fff3a6', '#e0cfff', '#ffd0a8', '#ffffff'];

// Eye colours that stand out against each hair colour (never green on green or pink on pink):
// the iris is the face's accent, so it sits well away from the hair's hue.
const EYES_FOR = {
  '#e9ebfa': ['#5aa8ff', '#9b6cff', '#ff6b8a', '#3f9f5f'],
  '#ff9ec0': ['#4fcfb8', '#5aa8ff', '#3f9f5f'],
  '#f5c95c': ['#4fcfb8', '#5aa8ff', '#9b6cff'],
  '#b9a7ff': ['#e8a23c', '#4fcfb8', '#ff6b8a'],
  '#7a5238': ['#4fcfb8', '#5aa8ff', '#3f9f5f'],
  '#3b3650': ['#e8a23c', '#ff6b8a', '#4fcfb8'],
  '#9be08f': ['#ff6b8a', '#9b6cff', '#e8a23c'],
  '#ffb38a': ['#4fcfb8', '#5aa8ff', '#9b6cff'],
  '#8fd3ff': ['#ff6b8a', '#e8a23c', '#9b6cff'],
};
// Each villager wears their own calm resting face (they grin when they stop to look around).
const CALM_FACES = ['smile', 'smile', 'smug', 'shy', 'cool', 'cat'];

// A villager's look from a seed; `over` sets parts of it (a town's colours).
export function lookFor(seed, over = {}) {
  const hairColor = over.hairColor ?? pick(HAIR, hash(seed + 2));
  return {
    hairStyle: pick(HAIR_STYLES, hash(seed + 1)), hairColor, skinTone: pick(SKIN, hash(seed + 3)),
    eyeColor: pick(EYES_FOR[hairColor] ?? EYES_FOR['#7a5238'], hash(seed + 4)), eyeStyle: pick(PICKABLE_EYE_STYLES, hash(seed + 5)),
    outfit: pick(OUTFIT_STYLES, hash(seed + 6)), outfitColor: pick(CLOTHES, hash(seed + 7)), face: pick(CALM_FACES, hash(seed + 8)),
    // Villagers wear every brow, and now and then an elf passes through.
    browStyle: pick(BROW_STYLES, hash(seed + 9)), earStyle: hash(seed + 10) < 0.15 ? 'elf' : 'round',
    ...over,
  };
}

// ---------- What each of them is doing at time t ----------
// Each returns { x, facing, pose, progress, dur, walking, face, fx } (fx draws extras: an arrow
// in flight, sparks, a floating book), with y from the ground unless the act puts them on a ledge.

// Walking between a and b with a pause at each end.
function stroll(a, b, speed, pause, t) {
  const walk = (b - a) / speed;
  const c = ((t % (2 * walk + 2 * pause)) + 2 * walk + 2 * pause) % (2 * walk + 2 * pause);
  if (c < walk) return { x: a + c * speed, walking: true, facing: 1 };
  if (c < walk + pause) return { x: b, walking: false, facing: 1, paused: c - walk };
  if (c < 2 * walk + pause) return { x: b - (c - walk - pause) * speed, walking: true, facing: -1 };
  return { x: a, walking: false, facing: -1, paused: c - 2 * walk - pause };
}

const ACTS = {
  stroll(p, t) {
    const at = stroll(p.act.a, p.act.b, p.act.speed ?? 22, p.act.pause ?? 3, t + p.seed * 7.3);
    return { ...at, pose: at.walking ? 'walk' : 'idle', face: at.paused != null && at.paused < 1 ? 'grin' : null, fx: p.act.carry ? crateFx : null };
  },
  // Tag: run to one end, a little cheer, run back. A playmate runs the same lap a moment behind.
  chase(p, t) {
    const at = stroll(p.act.a, p.act.b, p.act.speed ?? 60, 0.7, t - (p.act.lag ?? 0));
    const cheering = at.paused != null;
    return { ...at, pose: cheering ? 'cheer' : at.walking ? 'walk' : 'idle', progress: cheering ? at.paused / 0.7 : 0, dur: 0.7, face: 'excited' };
  },
  // Draw, loose, and watch it fly into the target; then a breath before the next.
  shoot(p, t) {
    const period = 3.6;
    const k = t + (p.act.offset ?? 0);
    const c = ((k % period) + period) % period;
    const shot = Math.floor(k / period);
    const tx = p.act.targets[((shot % p.act.targets.length) + p.act.targets.length) % p.act.targets.length];
    const fx = (ctx, x, y, map, cam) => {
      const from = { x: x + p.act.facing * 14, y: y - 27 };
      const to = { x: tx - cam.x - p.act.facing * 4, y: groundAt(map, tx) - cam.y - 30 + (hash(shot + p.seed) - 0.5) * 8 };
      if (c >= 1.1 && c < 1.45) arrow(ctx, from, to, (c - 1.1) / 0.35, p.act.facing);
      else if (c >= 1.45) arrow(ctx, from, to, 1, p.act.facing, c < 1.6 ? (1.6 - c) / 0.15 : 0);
    };
    return { x: p.act.x, facing: p.act.facing, pose: c < 1.1 ? 'draw' : 'idle', progress: c / 1.1, dur: 1.1, ready: true, face: c >= 1.45 && c < 2.4 ? 'grin' : 'cool', fx };
  },
  // Three swings at the dummy in front of them, then a breather.
  train(p, t) {
    const period = 2.8;
    const c = (((t + (p.act.offset ?? 0)) % period) + period) % period;
    const steps = [['slash', 0, 0.45], ['slash2', 0.5, 0.45], ['overhead', 1.0, 0.6]];
    const s = steps.find(([, at, dur]) => c >= at && c < at + dur);
    const hit = s && c - s[1] > s[2] * 0.45 && c - s[1] < s[2] * 0.7;
    const fx = hit ? (ctx, x, y) => sparks(ctx, x + p.act.facing * 30, y - 30, (c - s[1]) / s[2], '#ffe36b') : null;
    return { x: p.act.x, facing: p.act.facing, pose: s ? s[0] : 'idle', progress: s ? (c - s[1]) / s[2] : 0, dur: s ? s[2] : 0.4, ready: true, face: s ? 'excited' : 'cool', fx };
  },
  // Trading blows: the lead swings while the other guards, then they swap.
  spar(p, t) {
    const period = 3.2;
    const c = ((t % period) + period) % period;
    const mine = p.act.lead ? c < 1.6 : c >= 1.6;
    const u = c % 1.6;
    const swinging = mine && u < 0.5;
    const guarding = !mine && u < 0.6;
    const fx = swinging && u > 0.2 && u < 0.36 ? (ctx, x, y) => sparks(ctx, x + p.act.facing * 22, y - 32, (u - 0.2) / 0.16, '#ffffff') : null;
    return { x: p.act.x, facing: p.act.facing, pose: swinging ? 'slash' : guarding ? 'guard' : 'idle', progress: swinging ? u / 0.5 : u / 0.6, dur: swinging ? 0.5 : 0.6, ready: true, face: swinging ? 'excited' : 'cool', fx };
  },
  // Hammering at the anvil: a sharp ring and a shower of sparks with each blow.
  smith(p, t) {
    const period = 1.5;
    const c = ((t % period) + period) % period;
    const fx = (ctx, x, y) => {
      anvil(ctx, x + p.act.facing * 20, y);
      if (c > 0.36 && c < 0.7) sparks(ctx, x + p.act.facing * 20, y - 14, (c - 0.36) / 0.34, '#ffb36b');
    };
    return { x: p.act.x, facing: p.act.facing, pose: c < 0.6 ? 'overhead' : 'idle', progress: c / 0.6, dur: 0.6, ready: true, face: 'cool', fx };
  },
  // A spell spun up, then the glitter rising off it.
  cast(p, t) {
    const period = 4.2;
    const c = (((t + (p.act.offset ?? 0)) % period) + period) % period;
    const fx = c >= 0.9 && c < 2.2 ? (ctx, x, y) => motes(ctx, x + p.act.facing * 16, y - 34, (c - 0.9) / 1.3) : null;
    return { x: p.act.x, facing: p.act.facing, pose: c < 1 ? 'castspin' : 'idle', progress: c, dur: 1, face: c < 2.2 ? 'excited' : 'smile', fx };
  },
  read(p, t) {
    return { x: p.act.x, facing: p.act.facing, pose: 'idle', face: 'shy', fx: (ctx, x, y) => book(ctx, x + p.act.facing * 13, y - 30 + Math.sin(t * 1.6) * 1.5, t, p.act.facing) };
  },
  chat(p, t) {
    // A nod now and then while the other one talks.
    const c = ((t + (p.act.offset ?? 0)) % 7 + 7) % 7;
    return { x: p.act.x, facing: p.act.facing, pose: c < 0.8 ? 'cheer' : 'idle', progress: c / 0.8, dur: 0.8, face: c < 3 ? 'grin' : 'smile' };
  },
  nap(p, t) {
    return { x: p.act.x, y: p.act.y, facing: hash(p.seed) < 0.5 ? -1 : 1, pose: 'nap' };
  },
  // A chick: little hops about its patch, pecking in between.
  peck(p, t) {
    const at = stroll(p.act.a, p.act.b, 14, 1.6, t + p.seed * 5);
    return { ...at, pose: at.walking ? 'hop' : Math.floor(t * 3 + p.seed) % 3 === 0 ? 'peck' : 'stand' };
  },
};

// ---------- Extras: arrows, sparks, crates, the anvil, the book ----------

function arrow(ctx, from, to, k, dir, flash = 0) {
  // A shallow arc on the way.
  const x = from.x + (to.x - from.x) * k;
  const y = from.y + (to.y - from.y) * k - Math.sin(k * Math.PI) * 10;
  const nx = from.x + (to.x - from.x) * Math.min(1, k + 0.05);
  const ny = from.y + (to.y - from.y) * Math.min(1, k + 0.05) - Math.sin(Math.min(1, k + 0.05) * Math.PI) * 10;
  const a = k >= 1 ? 0 : Math.atan2(ny - y, nx - x);
  ctx.save();
  ctx.translate(snap(x), snap(y));
  ctx.rotate(k >= 1 ? (dir < 0 ? Math.PI : 0) : a);
  ctx.fillStyle = '#a0703f';
  ctx.fillRect(-12, -0.5, 12, 1);
  ctx.fillStyle = '#ff9ec0';
  ctx.fillRect(-13, -1.5, 3, 1);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-13, 0.5, 3, 1);
  if (k < 1) {
    ctx.fillStyle = '#dfe6f2';
    ctx.fillRect(0, -1, 2.5, 2);
  }
  ctx.restore();
  if (flash > 0) {
    ctx.save();
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
      const b = (i / 4) * TAU;
      ctx.fillRect(snap(to.x + Math.cos(b) * 5), snap(to.y + Math.sin(b) * 5), 1.5, 1.5);
    }
    ctx.restore();
  }
}

function sparks(ctx, x, y, k, color) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - k);
  ctx.fillStyle = color;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4;
    const r = 3 + k * 10;
    ctx.fillRect(snap(x + Math.cos(a) * r), snap(y + Math.sin(a) * r * 0.7 + k * k * 6), 1.5, 1.5);
  }
  ctx.restore();
}

function motes(ctx, x, y, k) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const u = (k + i / 5) % 1;
    ctx.globalAlpha = 0.9 * (1 - u);
    ctx.fillStyle = i % 2 ? '#8ff0e0' : '#e0cfff';
    ctx.fillRect(snap(x + Math.sin(i * 2.3 + u * 4) * 7), snap(y - u * 26), 1.5, 1.5);
  }
  ctx.restore();
}

function crateFx(ctx, x, y, map, cam, at) {
  // Held up over their head while they walk (bobbing with the steps), set down when they stop.
  const cy = at.walking ? y - 58 + Math.abs(Math.sin(at.x * 0.2)) * 1.5 : y - 9;
  const cx = at.walking ? x : x + at.facing * 16;
  place(ctx, crateArt(), cx, cy + 10);
}
function crateArt() {
  return art('tl-crate', 16, 12, () => [R(0, 0, 16, 12, '#c9925a'), F(R(0, 0, 16, 1.2, '#e6b47a')), F(R(1, 5.4, 14, 1.2, '#8a5a3c')), F(R(2, 1, 1.2, 10, '#8a5a3c')), F(R(12.8, 1, 1.2, 10, '#8a5a3c'))]);
}

function anvil(ctx, x, y) {
  place(ctx, art('tl-anvil', 22, 14, () => [
    R(7, 8, 8, 6, '#5a5878'), T([[0, 2], [22, 2], [20, 6], [14, 8], [8, 8], [3, 6]], '#6e6c8e'), F(R(1, 2, 20, 1, '#9a98b8')), R(5, 12, 12, 2, '#4a4866'),
  ]), x, y);
}

function book(ctx, x, y, t, dir) {
  const flip = (t * 0.2) % 1 < 0.08;
  ctx.save();
  ctx.translate(snap(x), snap(y));
  ctx.fillStyle = '#6a4f9a';
  ctx.fillRect(-7, -1, 14, 6);
  ctx.fillStyle = '#fff4e6';
  ctx.fillRect(-6, -2, 5.6, 6);
  ctx.fillRect(0.4, -2, 5.6, 6);
  if (flip) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(dir > 0 ? 0 : -3, -5, 3, 6);
  }
  ctx.fillStyle = '#c9b8e6';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(-5, -0.5 + i * 1.5, 4, 0.6);
    ctx.fillRect(1.4, -0.5 + i * 1.5, 4, 0.6);
  }
  ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 3);
  ctx.fillStyle = '#e0cfff';
  ctx.fillRect(-1, -9 + Math.sin(t * 2) * 1.5, 1.5, 1.5);
  ctx.restore();
}

// ---------- Pets ----------

const INK = '#3a2d4f';

// A cat: curled up asleep (breathing, `f` 0-1), or walking (`f` the step).
function catArt(coat, pose, f) {
  return art(`tl-cat|${coat}|${pose}|${f}`, 24, 16, () => {
    const out = [];
    if (pose === 'nap') {
      const b = f ? 0.6 : 0;
      out.push(E(12, 11 - b / 2, 9, 5 + b / 2, coat), F(E(13, 13, 7, 2.6, mixShade(coat))), E(5, 10, 4.4, 3.8, coat),
        T([[2.4, 7.4], [3.2, 3.8], [5.4, 6.6]], coat), T([[5.6, 6.4], [7.4, 3.6], [8.2, 7.2]], coat),
        F(R(3.2, 10, 1.8, 0.6, INK)), F(R(6, 10, 1.8, 0.6, INK)), E(19, 13.4, 5, 1.8, coat), F(E(22.6, 13.4, 1.6, 1.4, '#ffffff')));
    } else {
      const step = f ? 1 : -1;
      out.push(R(6 + step, 10, 2, 6, coat), R(16 - step, 10, 2, 6, coat), E(12, 9, 8, 4.4, coat), F(E(13, 11, 6, 2, mixShade(coat))),
        R(9 - step, 10, 2, 6, mixShade(coat)), R(19 + step, 10, 2, 6, mixShade(coat)), E(20, 5.6, 4.2, 3.8, coat),
        T([[17.2, 3], [17.8, -0.4 + 0.6], [19.6, 2.4]], coat), T([[20.6, 2.2], [22.4, 0.2], [23, 3.4]], coat),
        F(E(21.6, 5.2, 0.6, 0.8, INK)), F(E(23.2, 6.6, 0.8, 0.5, '#ff9fb8')), T([[4.6, 8], [1, 2.4 + step], [2.6, 2 + step], [5.8, 7]], coat));
    }
    return out;
  });
}

function dogArt(pose, f) {
  return art(`tl-dog|${pose}|${f}`, 26, 20, () => {
    const coat = '#e6b47a';
    const dark = '#b8814e';
    const step = f ? 1.4 : -1.4;
    const out = [R(6 + step, 12, 2.4, 8, dark), R(17 - step, 12, 2.4, 8, dark), E(12, 11, 9, 5, coat), F(E(13, 13, 7, 2.4, '#fff4e6')),
      R(9 - step, 12, 2.4, 8, coat), R(20 + step, 12, 2.4, 8, coat), E(21, 6.4, 4.8, 4.4, coat), E(24.2, 8, 2.6, 2, '#fff4e6'),
      F(E(25.6, 7.2, 0.9, 0.8, INK)), F(E(22, 5.6, 0.6, 0.8, INK)), E(18.6, 5.4, 1.8, 3.6, dark)];
    // The tail wags.
    out.push(T([[3.6, 9], [f ? -0.4 : 1, f ? 3 : 4.6], [f ? 1.4 : 2.6, f ? 2.4 : 4], [5, 8]], coat));
    if (pose === 'run') out.push(F(E(25, 10.6, 1.2, 1.6, '#ff8fa8')));
    return out;
  });
}

function chickArt(pose) {
  return art(`tl-chick|${pose}`, 12, 12, () => {
    const down = pose === 'peck';
    return [R(4.6, 9, 0.8, 3, '#f0a040'), R(6.6, 9, 0.8, 3, '#f0a040'), E(6, 7, 4.4, 3.6, '#ffe36b'), F(E(5, 8, 2.4, 1.6, '#f5c95c')),
      E(down ? 9.4 : 8.4, down ? 7.4 : 3.8, 2.6, 2.4, '#ffe36b'), F(E(down ? 10 : 9, down ? 7 : 3.4, 0.5, 0.6, INK)),
      T(down ? [[11.4, 8], [12, 9.6], [10.6, 9]] : [[10.6, 3.6], [12, 4.4], [10.6, 5]], '#f0a040')];
  });
}

function mixShade(c) {
  return c === '#3b3650' ? '#2a2540' : '#e09a5a';
}

// ---------- Drawing ----------

const anims = new Map();
function animFor(key, x, facing, time) {
  let a = anims.get(key);
  if (!a) {
    a = { anim: createAnim(), x, t: time };
    anims.set(key, a);
  }
  const dt = Math.max(0, Math.min(0.1, time - a.t));
  const vx = dt > 0 ? (x - a.x) / dt : 0;
  a.x = x;
  a.t = time;
  stepAnim(a.anim, { vx: Math.abs(vx) > 400 ? 0 : vx, vy: 0, onGround: true, rope: false, facing, y: 0 }, dt);
  return a.anim;
}

// Who you've walked up to, and when they last said hello (so they don't say it every step).
const met = new Map();
const GREET_NEAR = 48;
const GREET_AGAIN = 20;

// What residents busy with the same thing might say, on top of their own lines.
const ACT_LINES = {
  shoot: ['Wind from the left today.', 'Who moved the target?', 'Draw, anchor, release...', 'I hit the hay bale again.', 'One day I\'ll split an arrow.', 'Fletching is harder than it looks.'],
  train: ['Left, right, left...', 'Is it lunch yet?', 'Sensei would be proud. Maybe.', 'This dummy has seen things.', 'Footwork first, then power.', 'I can feel tomorrow\'s bruises already.'],
  spar: ['Again!', 'Keep your guard up!', 'You call that a swing?', 'Best two out of three.', 'Okay, okay, truce!'],
  cast: ['The words are on the tip of my tongue...', 'Sparkles. Why is it always sparkles?', 'Focus, breathe, channel...', 'I singed my sleeve again.', 'That one was nearly a real spell!'],
  chase: ['You\'re it!', 'Safe! I touched the fountain!', 'Faster!', 'Hide and seek next!', 'I\'m telling Mum!', 'Ten more minutes!'],
  stroll: ['Lovely day for a walk.', 'The bakery smells wonderful.', 'So many adventurers these days.', 'Have you seen my glasses?', 'The flowers came up nicely this year.', 'Mind the puddles.'],
  chat: ['And then what happened?', 'You didn\'t hear it from me...', 'Honestly, the prices lately!', 'My cousin saw a slime the size of a cart.', 'We should have tea sometime.'],
  smith: ['Hot iron waits for no one.', 'Another dent? What do you DO with these?', 'Hand me the tongs, would you?', 'Good steel sings when you strike it.'],
  read: ['Just one more chapter.', 'Shh, this is the good part.', 'Did you know slimes have no bones?', 'The library\'s quiet today.'],
};

// Each resident's lines (their own, then their trade's), and a shuffled order to say them in, so
// a line only comes round again once all the others have.
const pools = new Map();
function poolOf(p) {
  let e = pools.get(p.id);
  if (!e) {
    const lines = [...new Set([...(p.lines ?? []), ...(ACT_LINES[p.act?.type] ?? [])])];
    const order = lines.map((_, i) => i).sort((a, b) => hash(p.seed * 31 + a) - hash(p.seed * 31 + b));
    pools.set(p.id, (e = { lines, order }));
  }
  return e;
}

// How far off they can be and still be heard, and how long between their lines.
const EARSHOT = 420;
const TALK_EVERY = 75;

// What a resident says right now, if anything: a hello when you've just walked up, or now and
// then one of their lines, while you're within earshot.
function speech(p, at, gx, gy, player, time) {
  if (!p.lines && !p.greet) return null;
  const near = player && Math.abs(player.x - at.x) < GREET_NEAR && Math.abs(player.y - gy) < 30;
  let m = met.get(p.id);
  if (!m) met.set(p.id, (m = { near: false, at: -99 }));
  if (near && !m.near && time - m.at > GREET_AGAIN) m.at = time;
  m.near = near;
  if (time - m.at < 2.6) return { text: pick(p.greet ?? ['Hi!', 'Hello!', 'Oh, hello!'], hash(Math.floor(m.at) + p.seed)), hello: true };
  if (!p.lines || !player || Math.abs(player.x - at.x) > EARSHOT) return null;
  const period = TALK_EVERY + (p.seed % 9) * 5;
  const k = time + p.seed * 3.7;
  if (k % period > 3.6) return null;
  const { lines, order } = poolOf(p);
  return { text: lines[order[Math.floor(k / period) % lines.length]] };
}

// Draws everyone who lives in this town; `player` is your body, so they can greet you.
export function drawTownLife(ctx, map, cam, width, time, player = null) {
  const folk = TOWNSFOLK[map.id];
  if (!folk || !map.isTown || !settings.showCrowd) return;
  const said = [];
  for (const p of folk) {
    const at = ACTS[p.act.type](p, time);
    const wx = at.x;
    const x = snap(wx - cam.x);
    if (x < -60 || x > width + 60) continue;
    const gyWorld = at.y ?? groundAt(map, wx);
    const gy = snap(gyWorld - cam.y);
    if (p.kind === 'cat' || p.kind === 'dog' || p.kind === 'chick') {
      drawPet(ctx, p, at, x, gy, time);
      continue;
    }
    const talk = speech(p, at, x, gyWorld, player, time);
    // Someone saying hello turns to face you.
    const facing = talk?.hello && player ? (player.x < wx ? -1 : 1) : at.facing;
    const look = lookFor(p.seed * 13.1, { ...p.look, ...(at.face ? { face: at.face } : {}), ...(talk?.hello ? { face: 'grin' } : {}) });
    const kid = p.kind === 'kid';
    const scale = kid ? 0.78 : 1;
    footShadow(ctx, x, gy, kid ? 9 : 12, 0);
    const anim = animFor(p.id, wx, facing, time);
    const state = { pose: at.pose, progress: at.progress ?? 0, dur: at.dur ?? 0.5, time: time + p.seed, seed: p.seed, facing, ready: at.ready ?? false };
    if (kid) {
      ctx.save();
      ctx.translate(x, gy);
      ctx.scale(scale, scale);
      drawHero(ctx, look, p.gear ?? null, 0, 0, state, anim);
      ctx.restore();
    } else drawHero(ctx, look, p.gear ?? null, x, gy, state, anim);
    at.fx?.(ctx, x, gy, map, cam, at);
    if (talk) said.push([x, gy - (kid ? 50 : 62), talk.text]);
  }
  if (settings.chatBubbles) for (const [x, y, words] of said) drawBubble(ctx, x, y, words);
}

function drawPet(ctx, p, at, x, gy, time) {
  const coat = p.look?.coat ?? '#f5c48a';
  if (p.kind === 'chick') {
    const hop = at.pose === 'hop' ? Math.abs(Math.sin(time * 9 + p.seed)) * 2.5 : 0;
    footShadow(ctx, x, gy, 5, 0);
    flipped(ctx, x, at.facing, () => place(ctx, chickArt(at.pose === 'peck' ? 'peck' : 'stand'), x, gy - hop));
    return;
  }
  if (p.kind === 'cat') {
    footShadow(ctx, x, gy, 10, 0);
    if (at.pose === 'nap') {
      flipped(ctx, x, at.facing, () => place(ctx, catArt(coat, 'nap', Math.floor(time * 0.8 + p.seed) % 2), x, gy + 1));
      // Zzz drifting up.
      const z = (time * 0.4 + p.seed * 0.1) % 1;
      ctx.save();
      ctx.globalAlpha = 0.8 * (1 - z);
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 6px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
      ctx.fillText('z', snap(x - at.facing * 6 + z * 6), snap(gy - 14 - z * 12));
      ctx.restore();
    } else flipped(ctx, x, at.facing, () => place(ctx, catArt(coat, at.walking ? 'walk' : 'walk', at.walking ? Math.floor(time * 6) % 2 : 0), x, gy + 1));
    return;
  }
  // The dog.
  footShadow(ctx, x, gy, 11, 0);
  const running = at.pose === 'walk' || at.walking;
  const f = running ? Math.floor(time * 10) % 2 : Math.floor(time * 6) % 2;
  const bounce = running ? Math.abs(Math.sin(time * 14)) * 1.5 : 0;
  flipped(ctx, x, at.facing, () => place(ctx, dogArt(running ? 'run' : 'stand', f), x, gy + 1 - bounce));
}

// Draws with the sprite turned to face `facing` (the art faces right).
function flipped(ctx, x, facing, draw) {
  if (facing >= 0) return draw();
  ctx.save();
  ctx.translate(x, 0);
  ctx.scale(-1, 1);
  ctx.translate(-x, 0);
  draw();
  ctx.restore();
}
