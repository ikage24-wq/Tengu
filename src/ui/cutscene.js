// Story cutscenes (world.scene, data/story.js): the screen letterboxes, a chapter's title card
// sweeps in, and the story plays out line by line in a dialogue box with whoever is speaking drawn
// big beside it, acting out the line (happy, sad, surprised, angry). Lines type out; Z, Space,
// Enter, a click or a tap finishes the line or moves on; Esc skips the rest.

import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { SCENES } from '../data/story.js';
import { wornGear } from '../core/character.js';
import { sceneStep, advanceScene, fillScene } from '../world/story.js';
import { drawHero } from '../render/hero.js';
import { drawMonster } from '../render/monsters.js';
import { COLORS, THEMES, text, wrap, box, softShadow, roundRect, sparkle, font } from './kit.js';

const BAR = 34;
const TYPE = 55; // characters a second
const CARD = 2.8; // how long a title card stays up on its own

// Each face a line can carry, for heroes and NPCs.
const FACES = { happy: 'excited', sad: 'sad', surprised: 'shock', angry: 'angry' };
// The queens' and kings' name ribbons, in their own colours.
const COLORS_OF = { sylvana: '#5fb87f', tamamo: '#f08a3a', lilith: '#e0507e', selene: '#7a96e0', crystalking: '#9a7ae0', gnarlroot: '#8a6a4a', hayate: '#5aa8c8' };

// Handles the controls while a scene plays. Returns true while one is on.
export function sceneInput(world, input) {
  const sc = world.scene;
  if (!sc) return false;
  const step = sceneStep(world);
  const go = ['KeyZ', 'Space', 'Enter', 'NumpadEnter', 'ControlLeft', 'ArrowUp'].some((k) => input.pressed.has(k)) || input.mouse.clicked;
  if (input.pressed.has('Escape')) advanceScene(world, true);
  else if (step?.card) {
    if ((go && sc.t > 0.6) || sc.t > CARD) advanceScene(world);
  } else if (go) {
    // A line still typing shows in full first.
    if (sc.t * TYPE < fillScene(world, step?.text).length) sc.t = 99;
    else advanceScene(world);
  }
  input.mouse.clicked = false;
  input.pressed.clear();
  input.held.clear();
  return true;
}

export function drawScene(ui, world) {
  const sc = world.scene;
  if (!sc) return;
  const { ctx } = ui;
  const step = sceneStep(world);
  if (!step) return;
  const first = sc.i === 0 ? Math.min(1, sc.t / 0.35) : 1;
  // Letterbox bars slide in at the start.
  const bar = BAR * easeOut(first);
  ctx.fillStyle = 'rgba(30,20,48,0.94)';
  ctx.fillRect(0, 0, 640, bar);
  ctx.fillRect(0, 360 - bar, 640, bar);
  const filled = { ...step, text: fillScene(world, step.text), sub: fillScene(world, step.sub) };
  if (step.card) drawCard(ctx, filled, sc.t);
  else drawLine(ctx, world, filled, sc.t);
  // Where you are in the scene, and how to skip it.
  const n = SCENES[sc.id].length;
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = k <= sc.i ? '#ffb8dc' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(320 - (n - 1) * 5 + k * 10, 18, k === sc.i ? 2.6 : 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, 'Esc: skip', 630, 21, { size: 7, align: 'right', color: 'rgba(255,255,255,0.55)' });
}

const easeOut = (u) => 1 - (1 - u) ** 3;

// A chapter card: a ribbon sweeps across the middle with the chapter's name on it.
function drawCard(ctx, step, t) {
  const u = Math.min(1, t / 0.5);
  const out = t > CARD - 0.4 ? Math.max(0, (CARD - t) / 0.4) : 1;
  ctx.save();
  ctx.globalAlpha = out;
  ctx.fillStyle = `rgba(40,22,62,${0.45 * easeOut(u)})`;
  ctx.fillRect(0, BAR, 640, 360 - BAR * 2);
  const w = 360 * easeOut(u);
  const y = 150;
  softShadow(ctx, 320 - w / 2, y, w, 64, 32, 4);
  box(ctx, 320 - w / 2, y, w, 64, { fill: '#fff6fb', edge: '#ffb8dc', r: 32, width: 3 });
  if (u > 0.6) {
    const a = (u - 0.6) / 0.4;
    ctx.globalAlpha = out * a;
    text(ctx, step.card.toUpperCase(), 320, y + 22, { size: 9, bold: true, align: 'center', color: '#c46a9a' });
    text(ctx, step.sub, 320, y + 47, { size: 18, bold: true, align: 'center', color: COLORS.ink });
    for (let k = 0; k < 6; k++) {
      const ang = t * 1.4 + (k / 6) * Math.PI * 2;
      sparkle(ctx, 320 + Math.cos(ang) * (w / 2 + 8), y + 32 + Math.sin(ang) * 40, 2.4, k % 2 ? '#ffe36b' : '#ffb8dc');
    }
  }
  ctx.restore();
}

// One line: the dialogue box along the bottom, the speaker drawn big on the left.
function drawLine(ctx, world, step, t) {
  const who = step.who;
  const npc = who && NPCS[who];
  const mob = who && MOBS[who];
  const narration = !who;
  const name = who === 'player' ? world.char.name : npc ? npc.name : mob ? mob.name.split(',')[0] : who === 'hayate' ? 'Hayate' : '';
  const color = COLORS_OF[who] ?? (who === 'player' ? '#ff8fc1' : THEMES.pink.main);
  const W = 470;
  const H = 86;
  const x = (640 - W) / 2;
  const y = 360 - BAR - H - 8;
  softShadow(ctx, x, y, W, H, 12, 4);
  box(ctx, x, y, W, H, { fill: narration ? 'rgba(46,32,72,0.92)' : 'rgba(255,250,246,0.97)', edge: narration ? '#c9b6ff' : color, r: 14, width: 2.5 });
  roundRect(ctx, x + 3, y + 3, W - 6, H - 6, 11);
  ctx.strokeStyle = narration ? 'rgba(201,182,255,0.4)' : '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // The speaker stands in the box's left end, peeking out over its top.
  if (!narration) {
    ctx.save();
    roundRect(ctx, x - 30, y - 70, 150, H + 70 - 3, 10);
    ctx.clip();
    drawSpeaker(ctx, world, step, x + 60, y + H - 6, t);
    ctx.restore();
  }
  const tx = narration ? x + 24 : x + 122;
  const tw = narration ? W - 48 : W - 140;
  if (name) {
    ctx.font = font(10, true);
    const nw = ctx.measureText(name).width;
    box(ctx, tx - 6, y - 9, nw + 20, 18, { fill: color, edge: '#ffffff', r: 9, width: 2 });
    text(ctx, name, tx + 4, y + 4, { size: 10, bold: true, color: '#ffffff', outline: shadeInk(color) });
  }
  const chars = Math.floor(t * TYPE);
  wrap(ctx, step.text, tx, y + 26, tw, { size: 9, chars, lineHeight: 12.5, color: narration ? '#f4ecff' : COLORS.ink });
  if (chars >= step.text.length) {
    const bob = Math.sin(t * 6) * 1.5;
    ctx.fillStyle = narration ? '#ffe36b' : color;
    ctx.beginPath();
    ctx.moveTo(x + W - 22, y + H - 16 + bob);
    ctx.lineTo(x + W - 14, y + H - 12 + bob);
    ctx.lineTo(x + W - 22, y + H - 8 + bob);
    ctx.fill();
  }
}

const shadeInk = (c) => {
  const n = parseInt(c.slice(1), 16);
  const f = (v) => Math.max(0, Math.round(v * 0.62)).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
};

// Whoever speaks, acting their line: heroes and NPCs at twice their size with the line's face and a
// little bounce on each new line; queens as themselves; Hayate, still asleep, as a swirl of wind.
function drawSpeaker(ctx, world, step, x, y, t) {
  const who = step.who;
  const pop = t < 0.25 ? Math.sin((t / 0.25) * Math.PI) * 3 : 0;
  ctx.save();
  const g = ctx.createRadialGradient(x, y - 30, 4, x, y - 30, 60);
  g.addColorStop(0, 'rgba(255,240,250,0.85)');
  g.addColorStop(1, 'rgba(255,240,250,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - 70, y - 100, 140, 100);
  const talking = t * TYPE < step.text.length;
  const face = FACES[step.mood];
  if (who === 'player') {
    const look = face ? { ...world.char.appearance, face } : world.char.appearance;
    drawHero(ctx, look, wornGear(world.char), x, y - pop, { pose: step.mood === 'happy' ? 'cheer' : 'idle', progress: Math.min(1, t), dur: 1, time: world.now + t, seed: 1, scale: 2, job: world.char.job, talking, facing: 1 });
  } else if (NPCS[who]) {
    const npc = NPCS[who];
    const look = face ? { ...npc.look, face } : npc.look;
    drawHero(ctx, look, npc.gear ?? null, x, y - pop, { pose: 'idle', time: world.now + t, seed: 3, scale: 2, job: npc.showJob, talking, facing: 1 });
  } else if (MOBS[who]) {
    const def = MOBS[who];
    const m = { def, x: 0, y: 0, hp: def.hp, dir: 1, state: 'idle', flash: 0, stagger: 0, phase: t, age: 9, dying: 0, uid: 9000 + who.length, aggroUntil: step.mood === 'angry' ? Infinity : 0, attackAt: -9, gloatAt: step.mood === 'happy' ? world.now + t : -9 };
    const k = Math.min(1.1, 130 / def.h);
    ctx.translate(x, y - pop);
    ctx.scale(k, k);
    drawMonster(ctx, m, 0, 0, world.now + t, world.now + t);
  } else if (who === 'hayate') {
    // The sleeping Tengu's voice: a feather turning in a ring of wind.
    for (let k = 0; k < 10; k++) {
      const a = t * 2 + (k / 10) * Math.PI * 2;
      sparkle(ctx, x + Math.cos(a) * 34, y - 46 + Math.sin(a) * 18, 2 + (k % 3), k % 2 ? '#bff0ff' : '#ffffff');
    }
    ctx.fillStyle = '#e6f6ff';
    ctx.beginPath();
    ctx.ellipse(x, y - 46, 8, 24, Math.sin(t) * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7ab8d8';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }
  ctx.restore();
}
