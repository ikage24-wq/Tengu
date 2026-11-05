// Story cutscenes (world.scene, data/story.js): the screen letterboxes, a chapter's title card
// sweeps in, and the story plays out line by line in a dialogue box with whoever is speaking drawn
// big beside it, acting out the line (happy, sad, surprised, angry). Between the lines the scene is
// staged in the world itself (world/director.js): the camera pans, people walk, turn and hop,
// emotes pop over their heads, speech bubbles type out over them, bursts of petals or sparkles,
// fades, flashes and shakes. Lines and bubbles type out; Z, Space, Enter, a click or a tap finishes
// one or moves on; holding Z (or the mouse) plays the staging faster; Esc skips the rest.

import { drawHayate } from '../render/hayate.js';
import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { SCENES } from '../data/story.js';
import { wornGear } from '../core/character.js';
import { sceneStep, advanceScene, fillScene, isStaging } from '../world/story.js';
import { mobActor } from '../world/director.js';
import { groundAt } from '../world/physics.js';
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
  if (world.cine) world.cine.fast = input.held.has('KeyZ') || input.held.has('Space') || input.mouse.down;
  if (input.pressed.has('Escape')) advanceScene(world, true);
  else if (isStaging(step)) {
    // Staging plays out by itself; a press moves a speech bubble on.
    if (go && world.cine) world.cine.go = true;
  } else if (step?.card) {
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

export function drawScene(ui, world, cam) {
  const sc = world.scene;
  if (!sc) return;
  const { ctx } = ui;
  const step = sceneStep(world);
  if (!step) return;
  const c = world.cine;
  const real = performance.now() / 1000;
  if (c) {
    c.shownAt ??= real;
    // What the staging puts in the world: bursts, emotes, a speech bubble; then the fade and flash.
    if (cam) {
      for (const p of c.bursts) drawBurst(ctx, p, p.x - cam.x, p.y - cam.y, real);
      for (const e of c.emotes) {
        const a = actorAt(world, e.who);
        if (a) drawEmote(ctx, e, a.x - cam.x, a.y - cam.y - a.h - 6, real);
      }
      if (c.say) {
        const a = actorAt(world, c.say.who);
        if (a) drawSay(ctx, world, c.say, a.x - cam.x, a.y - cam.y - a.h - 8, real);
      }
    }
    if (c.spot && cam) {
      // The spotlight: dark all round, a soft ring of light on whoever it follows.
      const a = actorAt(world, c.spot.who);
      if (a) {
        const sx = a.x - cam.x;
        const sy = a.y - cam.y - a.h * 0.5;
        const r = c.spot.r + a.h * 0.4;
        const g = ctx.createRadialGradient(sx, sy, r * 0.7, sx, sy, r * 1.15);
        g.addColorStop(0, 'rgba(14,8,28,0)');
        g.addColorStop(1, `rgba(14,8,28,${0.78 * c.spot.a})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 640, 360);
        ctx.fillStyle = `rgba(255,240,200,${0.08 * c.spot.a})`;
        ctx.beginPath();
        ctx.moveTo(sx - 18, 0);
        ctx.lineTo(sx + 18, 0);
        ctx.lineTo(sx + r, sy + a.h * 0.5);
        ctx.lineTo(sx - r, sy + a.h * 0.5);
        ctx.fill();
      }
    }
    if (c.fade.a > 0) {
      ctx.fillStyle = hexA(c.fade.color ?? '#1e1430', c.fade.a);
      ctx.fillRect(0, 0, 640, 360);
    }
    if (c.flash) {
      ctx.fillStyle = hexA(c.flash.color, Math.max(0, c.flash.a) * 0.8);
      ctx.fillRect(0, 0, 640, 360);
    }
  }
  // Letterbox bars slide in at the start.
  const bar = BAR * easeOut(Math.min(1, (real - (c?.shownAt ?? real - 1)) / 0.35));
  ctx.fillStyle = 'rgba(30,20,48,0.94)';
  ctx.fillRect(0, 0, 640, bar);
  ctx.fillRect(0, 360 - bar, 640, bar);
  const filled = { ...step, text: fillScene(world, step.text), sub: fillScene(world, step.sub) };
  if (step.card) drawCard(ctx, filled, sc.t);
  else if (!isStaging(step)) drawLine(ctx, world, filled, sc.t, lineAtTop(world, step, cam));
  // Where you are in the scene, and how to skip it.
  const n = SCENES[sc.id].length;
  for (let k = 0; k < n; k++) {
    ctx.fillStyle = k <= sc.i ? '#ffb8dc' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(320 - (n - 1) * 5 + k * 10, 18, k === sc.i ? 2.6 : 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, isStaging(step) ? 'Hold Z: faster   Esc: skip' : 'Esc: skip', 630, 21, { size: 7, align: 'right', color: 'rgba(255,255,255,0.55)' });
}

const hexA = (hex, a) => `rgba(${parseInt(hex.slice(1, 3), 16)},${parseInt(hex.slice(3, 5), 16)},${parseInt(hex.slice(5, 7), 16)},${a})`;

// Where an actor's feet are and how tall they stand (the hero, an NPC on the map, or a monster in
// the scene, lifted while they hop).
function actorAt(world, who) {
  if (who === 'player') return { x: world.body.x, y: world.body.y, h: 52 };
  const n = world.map.npcs.find((q) => q.id === who);
  if (n) return { x: n.x, y: groundAt(world.map, n.x) - (n.cine?.lift ?? 0), h: 52 };
  const m = mobActor(world, who);
  return m ? { x: m.x, y: m.y - (m.cine.lift ?? 0), h: m.def.h } : null;
}

const easeOutBack = (u) => 1 + 2.7 * (u - 1) ** 3 + 1.7 * (u - 1) ** 2;

function heart(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45);
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  ctx.fill();
}

// An emote over someone's head: it pops in with a little overshoot, bobs, and fades at the end.
function drawEmote(ctx, e, x, y, real) {
  const pop = easeOutBack(Math.min(1, e.t / 0.28));
  const fade = Math.min(1, (e.dur - e.t) / 0.3);
  const bob = Math.sin(e.t * 5) * 1.2;
  ctx.save();
  ctx.globalAlpha = Math.max(0, fade);
  ctx.translate(Math.round(x + 10), Math.round(y + bob));
  ctx.scale(pop, pop);
  const k = e.kind;
  if (k === 'sweat') {
    // A drop sliding down the side of the head.
    const s = Math.min(1, e.t / 0.6) * 6;
    ctx.fillStyle = '#8fd0ff';
    ctx.strokeStyle = '#4a8ac8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(4, 14 + s - 6);
    ctx.quadraticCurveTo(8, 14 + s, 4, 14 + s + 4);
    ctx.quadraticCurveTo(0, 14 + s, 4, 14 + s - 6);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  if (k === 'anger') {
    // The cross-shaped vein, throbbing.
    const th = 1 + Math.max(0, Math.sin(e.t * 12)) * 0.15;
    ctx.scale(th, th);
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    for (const [a, b] of [[[-5, -5], [-1.5, -1.5]], [[5, -5], [1.5, -1.5]], [[-5, 5], [-1.5, 1.5]], [[5, 5], [1.5, 1.5]]]) {
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.quadraticCurveTo(0, 0, b[0] + (a[0] > 0 ? 3 : -3), b[1]);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  if (k === 'zzz') {
    for (let i = 0; i < 3; i++) {
      const u = ((e.t * 0.6 + i / 3) % 1);
      ctx.globalAlpha = Math.max(0, fade) * (1 - u);
      text(ctx, 'z', 2 + u * 10 + i * 2, -u * 18, { size: 7 + i * 2, bold: true, color: '#9fb8ff', outline: '#ffffff' });
    }
    ctx.restore();
    return;
  }
  // The rest sit in a round white bubble with a little tail.
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#8f6cc4';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -4, 9, 0, Math.PI * 2);
  ctx.moveTo(-4, 3);
  ctx.lineTo(-7, 9);
  ctx.lineTo(0, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, -4, 8.2, 0, Math.PI * 2);
  ctx.fill();
  if (k === '!') text(ctx, '!', 0, 0.5, { size: 13, bold: true, align: 'center', color: '#ffb020', outline: '#7a4a10' });
  else if (k === '?') text(ctx, '?', 0, 0.5, { size: 12, bold: true, align: 'center', color: '#4f95e0', outline: '#1e4a80' });
  else if (k === 'heart') heart(ctx, 0, -4, 5 + Math.sin(e.t * 9) * 0.6, '#ff6b9a');
  else if (k === 'note') text(ctx, '♪', 0.5, 0.5, { size: 12, bold: true, align: 'center', color: '#8f6cc4' });
  else if (k === 'idea') {
    ctx.fillStyle = '#ffe36b';
    ctx.beginPath();
    ctx.arc(0, -6, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c8b8d8';
    ctx.fillRect(-2, -2, 4, 3);
    ctx.strokeStyle = '#ffd020';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i - 2) * 0.55;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 6.5, -6 + Math.sin(a) * 6.5);
      ctx.lineTo(Math.cos(a) * 8, -6 + Math.sin(a) * 8);
      ctx.stroke();
    }
  } else sparkle(ctx, 0, -4, 5 + Math.sin(e.t * 8), '#ffd36b');
  ctx.restore();
}

// A speech bubble in the world over whoever speaks, the words typing out, a little arrow once
// they're all there.
function drawSay(ctx, world, say, x, y, real) {
  const words = fillScene(world, say.text);
  const W = Math.min(180, Math.max(60, words.length * 4.2 + 20));
  ctx.font = font(8, false);
  const lines = Math.max(1, Math.ceil(ctx.measureText(words).width / (W - 16)));
  const H = 12 + lines * 10;
  const bx = Math.max(6, Math.min(634 - W, x - W / 2));
  const by = y - H;
  const pop = easeOutBack(Math.min(1, say.t / 0.2));
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(pop, pop);
  ctx.translate(-x, -y);
  softShadow(ctx, bx, by, W, H, 8, 3);
  box(ctx, bx, by, W, H, { fill: '#ffffff', edge: '#8f6cc4', r: 8, width: 1.6 });
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#8f6cc4';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x - 5, by + H - 1);
  ctx.lineTo(x, by + H + 7);
  ctx.lineTo(x + 5, by + H - 1);
  ctx.fill();
  ctx.stroke();
  ctx.fillRect(x - 4, by + H - 2.5, 8, 2.5);
  const chars = Math.floor(say.t * TYPE);
  wrap(ctx, words, bx + 8, by + 13, W - 16, { size: 8, chars, lineHeight: 10, color: COLORS.ink });
  if (chars >= words.length) {
    const bob = Math.sin(real * 6) * 1.2;
    ctx.fillStyle = '#ff8fc1';
    ctx.beginPath();
    ctx.moveTo(bx + W - 10, by + H - 8 + bob);
    ctx.lineTo(bx + W - 5, by + H - 5 + bob);
    ctx.lineTo(bx + W - 10, by + H - 2 + bob);
    ctx.fill();
  }
  ctx.restore();
}

// A bit of a burst: sparkles, little hearts, cherry petals, leaves, wind streaks or confetti.
function drawBurst(ctx, p, x, y, real) {
  if (p.t < 0) return;
  const a = Math.min(1, (p.life - p.t) / 0.4);
  ctx.save();
  ctx.globalAlpha = Math.max(0, a);
  const spin = p.t * 6 + p.seed;
  if (p.kind === 'sparkle') sparkle(ctx, x, y, 2 + Math.sin(spin) * 1, p.seed > 5 ? '#ffe36b' : '#ffffff');
  else if (p.kind === 'hearts') heart(ctx, x, y, 2.6, p.seed > 5 ? '#ff6b9a' : '#ffb8dc');
  else if (p.kind === 'petals' || p.kind === 'leaves') {
    ctx.translate(x + Math.sin(spin) * 3, y);
    ctx.rotate(spin);
    ctx.fillStyle = p.kind === 'petals' ? (p.seed > 5 ? '#ffc6de' : '#ff9ec0') : (p.seed > 5 ? '#8fdc9a' : '#5fae7a');
    ctx.beginPath();
    ctx.ellipse(0, 0, 3, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'coins') {
    // A gold coin flipping as it flies.
    ctx.translate(x, y);
    ctx.scale(Math.cos(spin * 2), 1);
    ctx.fillStyle = '#ffd36b';
    ctx.beginPath();
    ctx.arc(0, 0, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a83a';
    ctx.fillRect(-0.6, -1.6, 1.2, 3.2);
  } else if (p.kind === 'shells') {
    // A little fan shell, pink or cream, tumbling.
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = p.seed > 5 ? '#ffc8d8' : '#fff0dc';
    ctx.beginPath();
    ctx.moveTo(0, 2.4);
    ctx.arc(0, 2.4, 3.4, Math.PI * 1.15, Math.PI * 1.85);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,120,150,0.6)';
    ctx.lineWidth = 0.6;
    for (const a of [-0.4, 0, 0.4]) {
      ctx.beginPath();
      ctx.moveTo(0, 2.4);
      ctx.lineTo(Math.sin(a) * 3.2, 2.4 - Math.cos(a) * 3.2);
      ctx.stroke();
    }
  } else if (p.kind === 'clouds') {
    // A soft puff of cloud drifting off, swelling and fading.
    const u = p.t / p.life;
    ctx.globalAlpha = Math.max(0, a) * 0.85;
    ctx.fillStyle = '#ffffff';
    for (const [dx, dy, r] of [[-4, 1, 4], [0, -2, 5], [5, 1, 4]]) {
      ctx.beginPath();
      ctx.arc(x + dx * (1 + u), y + dy, r * (1 + u * 0.8), 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (p.kind === 'shout') {
    // A ring of sound widening out from a megaphone.
    const u = p.t / p.life;
    ctx.globalAlpha = Math.max(0, 1 - u) * 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 6 + u * 46, -0.7, 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y, 6 + u * 46, Math.PI - 0.7, Math.PI + 0.7);
    ctx.stroke();
  } else if (p.kind === 'feathers') {
    // A parrot feather see-sawing down.
    ctx.translate(x, y);
    ctx.rotate(Math.sin(spin) * 0.9);
    ctx.fillStyle = ['#5fc06a', '#e8504a', '#ffd36b'][Math.floor(p.seed) % 3];
    ctx.beginPath();
    ctx.ellipse(0, 0, 1.6, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-0.3, -4, 0.6, 8);
  } else if (p.kind === 'sparks') {
    // A forge spark: a short bright streak along its flight.
    ctx.strokeStyle = p.seed > 5 ? '#ffe36b' : '#ff9a3a';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - p.vx * 0.03, y - p.vy * 0.03);
    ctx.stroke();
  } else if (p.kind === 'caramel') {
    // A glossy drop of caramel (or frosting), stretching as it flies.
    ctx.translate(x, y);
    ctx.rotate(Math.atan2(p.vy, p.vx));
    ctx.fillStyle = p.seed > 5 ? '#e89a3a' : '#f4b860';
    ctx.beginPath();
    ctx.ellipse(0, 0, 3 + Math.min(3, Math.hypot(p.vx, p.vy) / 80), 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(-1, -1.4, 1.4, 1);
  } else if (p.kind === 'crumbs') {
    // A crumb of gingerbread, tumbling.
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = p.seed > 5 ? '#c07a4a' : '#a8603a';
    ctx.fillRect(-1.6, -1.6, 3.2, 3.2);
    if (p.seed > 7) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-1.6, -1.6, 3.2, 0.8);
    }
  } else if (p.kind === 'pages') {
    // A loose page, fluttering: a white sheet with lines of ink, flipping as it turns.
    ctx.translate(x, y);
    ctx.rotate(Math.sin(spin) * 0.8);
    ctx.scale(Math.cos(spin * 1.3), 1);
    ctx.fillStyle = '#fffaf0';
    ctx.fillRect(-4, -5, 8, 10);
    ctx.fillStyle = '#b8a8c8';
    for (let k = 0; k < 3; k++) ctx.fillRect(-3, -3 + k * 3, 6, 0.8);
  } else if (p.kind === 'starfall') {
    // A falling star: a bright head with a fading streak behind it.
    const len = 18;
    const g = ctx.createLinearGradient(x, y, x - p.vx * 0.12, y - p.vy * 0.12);
    g.addColorStop(0, 'rgba(255,248,210,1)');
    g.addColorStop(1, 'rgba(255,248,210,0)');
    ctx.strokeStyle = g;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - (p.vx / 200) * len, y - (p.vy / 200) * len);
    ctx.stroke();
    sparkle(ctx, x, y, 2.4, '#fff6c8');
  } else if (p.kind === 'gears') {
    // A little brass cog, spinning as it falls.
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = p.seed > 5 ? '#e8b84a' : '#c8943a';
    for (let k = 0; k < 6; k++) {
      ctx.rotate(Math.PI / 3);
      ctx.fillRect(-1, -4.2, 2, 2);
    }
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a2a';
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'bubbles') {
    // A bubble wobbling up, with a glint.
    const r = 1.8 + (p.seed % 2.4);
    ctx.strokeStyle = 'rgba(200,240,255,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(x - r * 0.5, y - r * 0.5, 1, 1);
  } else if (p.kind === 'ink') {
    // A blot of sea-witch ink, spreading and thinning.
    const u = p.t / p.life;
    ctx.globalAlpha = Math.max(0, a) * 0.85;
    ctx.fillStyle = p.seed > 5 ? '#3a2a5a' : '#5a3a7a';
    ctx.beginPath();
    ctx.arc(x, y, 4 + u * 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'notes') {
    // A music note bobbing up.
    text(ctx, p.seed > 5 ? '\u266a' : '\u266b', x, y, { size: 9 + (p.seed % 3), bold: true, align: 'center', color: p.seed > 3 ? '#b88cff' : '#ff8fc1', outline: '#ffffff' });
  } else if (p.kind === 'china') {
    // A shard of fine china: white with a blue rim, spinning.
    ctx.translate(x, y);
    ctx.rotate(spin * 1.6);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(-3, -2);
    ctx.lineTo(3, -1);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#6a8ad8';
    ctx.fillRect(-3, -2, 6, 1);
  } else if (p.kind === 'dust') {
    // A soft round puff of floor dust, swelling and thinning.
    const u = p.t / p.life;
    ctx.globalAlpha = Math.max(0, a) * 0.7;
    ctx.fillStyle = p.seed > 5 ? '#e8dccc' : '#d8c8b4';
    ctx.beginPath();
    ctx.arc(x, y - u * 6, 3 + u * 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'rubble') {
    // A tumbling pebble or a crumb of root.
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = p.seed > 5 ? '#8a7a6a' : '#a8927a';
    ctx.fillRect(-2, -1.6, 4, 3.2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(-2, -1.6, 2, 1);
  } else if (p.kind === 'spores') {
    // A soft pink puff, swelling a little as it drifts.
    const r = 1.6 + (p.t / p.life) * 2.4 + (p.seed % 1.5);
    ctx.fillStyle = p.seed > 5 ? 'rgba(255,170,210,0.75)' : 'rgba(255,224,240,0.8)';
    ctx.beginPath();
    ctx.arc(x + Math.sin(spin * 0.5) * 2, y, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (p.kind === 'wind') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x - Math.sign(p.vx) * 14, y);
    ctx.quadraticCurveTo(x - Math.sign(p.vx) * 6, y - 4, x, y - 1);
    ctx.stroke();
  } else {
    ctx.translate(x, y);
    ctx.rotate(spin);
    ctx.fillStyle = ['#ffd36b', '#7fd8ff', '#ff9ab8', '#9fe0a8'][Math.floor(p.seed) % 4];
    ctx.fillRect(-2, -1, 4, 2);
  }
  ctx.restore();
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

// Whether a line's box goes at the top of the screen: it sits along the bottom unless it would
// cover the hero, whoever speaks, or a monster taking part in the scene (any of them, head to
// feet). Decided once per line, so it never jumps about.
function lineAtTop(world, step, cam) {
  const sc = world.scene;
  if (sc.boxFor === sc.i) return sc.boxTop;
  const top = 360 - BAR - 86 - 8;
  const cast = [step.who, 'player', ...(world.mobs ?? []).filter((m) => m.cine && m.hp > 0).map((m) => m.def.id)];
  const low = Boolean(cam) && cast.some((who) => {
    const a = who && actorAt(world, who);
    if (!a) return false;
    const x = a.x - cam.x;
    const feet = a.y - cam.y;
    return x > 70 && x < 570 && feet > top + 4 && feet - a.h < top + 86;
  });
  sc.boxFor = sc.i;
  sc.boxTop = low;
  return low;
}

// One line: the dialogue box along the bottom (or the top, clear of the actors), the speaker drawn
// big on the left.
function drawLine(ctx, world, step, t, atTop = false) {
  const who = step.who;
  const npc = who && NPCS[who];
  const mob = who && MOBS[who];
  const narration = !who;
  const name = who === 'player' ? world.char.name : npc ? npc.name : mob ? mob.name.split(',')[0] : who === 'hayate' ? 'Hayate' : '';
  const color = COLORS_OF[who] ?? (who === 'player' ? '#ff8fc1' : THEMES.pink.main);
  const W = 470;
  const H = 86;
  const x = (640 - W) / 2;
  const y = atTop ? BAR + 12 : 360 - BAR - H - 8;
  softShadow(ctx, x, y, W, H, 12, 4);
  box(ctx, x, y, W, H, { fill: narration ? 'rgba(46,32,72,0.92)' : 'rgba(255,250,246,0.97)', edge: narration ? '#c9b6ff' : color, r: 14, width: 2.5 });
  roundRect(ctx, x + 3, y + 3, W - 6, H - 6, 11);
  ctx.strokeStyle = narration ? 'rgba(201,182,255,0.4)' : '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // The speaker stands in the box's left end, peeking out over its top.
  if (!narration) {
    ctx.save();
    // Along the bottom they peek out over the box; at the top they stay inside it.
    // (Clipped short of the words, so a long staff or blade never crosses them.)
    if (atTop) roundRect(ctx, x + 3, y + 3, 113, H - 6, 11);
    else roundRect(ctx, x - 30, y - 70, 146, H + 70 - 3, 10);
    ctx.clip();
    drawSpeaker(ctx, world, step, x + 60, y + H - 6, t, atTop ? H - 14 : 130);
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
// little bounce on each new line; queens as themselves; Hayate as a sleepy princess, or awake.
function drawSpeaker(ctx, world, step, x, y, t, room = 130) {
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
    // (Scaled to the room it has: a boss in a box at the top fits inside it, head and all.)
    const k = Math.min(1.1, room / def.h);
    ctx.translate(x, y - pop);
    ctx.scale(k, k);
    drawMonster(ctx, m, 0, 0, world.now + t, world.now + t);
  } else if (who === 'hayate') {
    // Hayate herself, the sleepy princess (render/hayate.js): asleep and nodding, or (her happy
    // lines) awake.
    // (Scaled to the room it has: her cloud of hair and crown stand taller than anyone, so in a box
    // at the top she shrinks to fit, crown and all.)
    drawHayate(ctx, x, y - pop, world.now + t, { s: Math.min(2, room / 50), awake: step.mood === 'happy', talking });
  }
  ctx.restore();
}

// ---------- The root radio ----------

// Someone talking over the root radio during a dungeon run: a small box at the top middle of the
// screen, clear of the players and the floor, with their face in a round frame and the line typing
// out, fading after a few seconds. While the room's name banner is up it eases down to sit under it.
export function drawRadio(ui, world, banner = 0) {
  const r = world.radio;
  if (!r || world.scene) return;
  const age = world.now - r.at;
  if (age > 5.5) {
    world.radio = null;
    return;
  }
  const { ctx } = ui;
  const a = Math.min(1, age / 0.25, (5.5 - age) / 0.5);
  const npc = NPCS[r.who];
  const W = 250;
  // Tall enough for the whole line, however it wraps (measured without drawing).
  const H = Math.max(34, 19 + wrap(ctx, r.text, 0, 0, W - 46, { size: 7.5, chars: 0, lineHeight: 9 }));
  const under = banner > 0 ? 1 : 0;
  r.under = (r.under ?? under) + (under - (r.under ?? under)) * 0.15;
  const x = 320 - W / 2;
  const y = 6 + 52 * r.under * r.under * (3 - 2 * r.under);
  ctx.save();
  ctx.globalAlpha = a;
  box(ctx, x, y, W, H, { fill: 'rgba(255,250,246,0.9)', edge: '#a6dca2', r: 12, width: 2 });
  // Their face in a round frame, with little signal waves.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + 18, y + 17, 13, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = '#e8f6e0';
  ctx.fillRect(x + 4, y + 3, 28, 28);
  drawHero(ctx, npc.look, npc.gear ?? null, x + 18, y + 46, { pose: 'idle', time: world.now, seed: 5, scale: 1.2, talking: age * TYPE < r.text.length, facing: 1 });
  ctx.restore();
  ctx.strokeStyle = '#7fbf86';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x + 18, y + 17, 13, 0, Math.PI * 2);
  ctx.stroke();
  for (let k = 0; k < 2; k++) {
    ctx.globalAlpha = a * (0.4 + 0.4 * Math.sin(world.now * 6 - k));
    ctx.beginPath();
    ctx.arc(x + 31, y + 9, 4 + k * 3, -0.9, 0.3);
    ctx.stroke();
  }
  ctx.globalAlpha = a;
  text(ctx, `${npc.name} (root radio)`, x + 38, y + 11, { size: 6.5, bold: true, color: '#3f9f5f' });
  wrap(ctx, r.text, x + 38, y + 22, W - 46, { size: 7.5, chars: Math.floor(age * TYPE), lineHeight: 9 });
  ctx.restore();
}
