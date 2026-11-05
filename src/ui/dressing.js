// Character select as the theatre's dressing rooms (the player's pick, 2026-11-05), backstage
// at Madame Encore's, the same set as the title show. Four rooms in a row on a raised platform,
// one per hero in this world, each with a star plate on top, its own wallpaper, and a mirror ringed
// with light bulbs over a vanity. A hero stands with their back to us at their mirror, and the
// mirror shows their face: smiling at themselves, winking, checking their teeth. Now and then they
// spin round and practise a pose for us. Pick one and they come out, down the steps and onto the
// stage under the spotlight, and take a bow; pick another and they head back to their room.
// An empty room has its bulbs off but one, and an AUDITIONS! board on an easel.

import { drawHero } from '../render/hero.js';
import { withZoom } from '../render/pixel.js';
import { wornGear } from '../core/character.js';
import { drawItemIcon } from '../render/icons.js';
import { text, hover, clicked, roundRect, font } from './kit.js';

const ROOM_W = 92;
const ROOM_X = (i) => 58 + i * (ROOM_W + 2);
const ROOM_TOP = 60;
const ROOM_FLOOR = 214;
const STAGE = 316;
const S = 1.35;
const SPEED = 110;
const WALLPAPER = [['#ffd6e8', '#ffc2dc'], ['#d6ecff', '#c2e0ff'], ['#e2f7d8', '#cdeec0'], ['#efe0ff', '#e0ccff']];
const POSES = ['emflex', 'emlove', 'emdance', 'emcheer', 'emflip'];
const MIRROR_FACES = ['smile', 'smug', 'sassy', 'grin', 'cat', 'proud'];
const ease = (u) => u * u * (3 - 2 * u);
const clamp = (v) => Math.max(0, Math.min(1, v));

// Where a hero stands: at their mirror, or out on the stage (the steps between).
const roomSpot = (i) => ({ x: ROOM_X(i) + 26, y: ROOM_FLOOR });
const stepTop = (i) => ({ x: ROOM_X(i) + 62, y: ROOM_FLOOR });
const stepFoot = (i) => ({ x: ROOM_X(i) + 62, y: STAGE });
const stageSpot = () => ({ x: 246, y: STAGE });

function backdrop(ctx, time) {
  ctx.fillStyle = '#3a2440';
  ctx.fillRect(0, 0, 640, 360);
  for (let y = 0, row = 0; y < 300; y += 16, row++) {
    for (let x = row % 2 ? -20 : 0; x < 640; x += 40) {
      ctx.fillStyle = (x * 7 + y * 3) % 5 ? '#4a2e4e' : '#523454';
      ctx.fillRect(x + 1, y + 1, 38, 14);
    }
  }
  // The stage floor in front, and the footlights.
  ctx.fillStyle = '#7a4a2a';
  ctx.fillRect(0, 290, 640, 70);
  ctx.fillStyle = '#9a6a3a';
  for (let x = 0; x < 640; x += 46) ctx.fillRect(x, 290, 44, 3);
  ctx.strokeStyle = 'rgba(60,30,20,0.4)';
  ctx.lineWidth = 1;
  for (let y = 304; y < 350; y += 12) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#3a2020';
  ctx.fillRect(0, 346, 640, 14);
  for (let x = 24; x < 640; x += 48) {
    const glow = 0.7 + 0.3 * Math.sin(time * 2 + x);
    const g = ctx.createRadialGradient(x, 347, 0, x, 347, 14);
    g.addColorStop(0, `rgba(255,230,160,${0.55 * glow})`);
    g.addColorStop(1, 'rgba(255,230,160,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, 333, 28, 28);
    ctx.fillStyle = '#fff3c0';
    ctx.beginPath();
    ctx.arc(x, 348, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // The valance across the top, scalloped, with gold bobbles.
  ctx.fillStyle = '#b02848';
  ctx.fillRect(0, 0, 640, 20);
  for (let x = 0; x < 640; x += 40) {
    ctx.beginPath();
    ctx.arc(x + 20, 20, 20, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = '#ffd66b';
  ctx.fillRect(0, 18, 640, 3);
  for (let x = 0; x < 640; x += 40) {
    ctx.beginPath();
    ctx.arc(x + 20, 41, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The raised platform the rooms sit on, with a little flight of steps down from each.
function platform(ctx, time) {
  ctx.fillStyle = '#5a3424';
  ctx.fillRect(ROOM_X(0) - 4, ROOM_FLOOR, ROOM_X(3) + ROOM_W - ROOM_X(0) + 8, 290 - ROOM_FLOOR);
  ctx.fillStyle = '#6a4030';
  ctx.fillRect(ROOM_X(0) - 4, ROOM_FLOOR, ROOM_X(3) + ROOM_W - ROOM_X(0) + 8, 5);
  // Panels on its front, and a row of marquee bulbs along the edge, chasing.
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = '#6a3e2c';
    roundRect(ctx, ROOM_X(i) + 6, ROOM_FLOOR + 16, 38, 52, 4);
    ctx.fill();
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, `${i + 1}`, ROOM_X(i) + 25, ROOM_FLOOR + 48, { size: 14, bold: true, align: 'center', color: '#c8945a' });
  }
  for (let x = ROOM_X(0); x < ROOM_X(3) + ROOM_W; x += 12) {
    const on = (Math.floor(time * 6) + Math.floor(x / 12)) % 3 === 0;
    ctx.fillStyle = on ? '#fff3c0' : '#c8a060';
    ctx.beginPath();
    ctx.arc(x + 6, ROOM_FLOOR + 9, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 4; i++) {
    const sx = ROOM_X(i) + 50;
    for (let k = 0; k < 5; k++) {
      const y = ROOM_FLOOR + k * 15;
      ctx.fillStyle = k % 2 ? '#9a6a3a' : '#a8784a';
      ctx.fillRect(sx, y, 24, 15);
      ctx.fillStyle = '#c8945a';
      ctx.fillRect(sx, y, 24, 2);
    }
  }
}

// A mirror's ring of bulbs (lit, or all but one off in an empty room).
function bulbs(ctx, x, y, w, h, time, lit, seed) {
  const pts = [];
  for (let k = 0; k < 4; k++) pts.push([x + (k + 0.5) * (w / 4), y - 3]);
  for (let k = 0; k < 3; k++) pts.push([x - 3, y + (k + 0.5) * (h / 3)], [x + w + 3, y + (k + 0.5) * (h / 3)]);
  pts.forEach(([bx, by], k) => {
    const on = lit ? 0.75 + 0.25 * Math.sin(time * 4 + k * 1.3 + seed) : k === 2 ? (Math.sin(time * 9) > 0.3 ? 0.9 : 0.15) : 0;
    if (on > 0.2) {
      const g = ctx.createRadialGradient(bx, by, 0, bx, by, 7);
      g.addColorStop(0, `rgba(255,240,180,${0.5 * on})`);
      g.addColorStop(1, 'rgba(255,240,180,0)');
      ctx.fillStyle = g;
      ctx.fillRect(bx - 7, by - 7, 14, 14);
    }
    ctx.fillStyle = on > 0.2 ? '#fff6c8' : '#8a7a8a';
    ctx.beginPath();
    ctx.arc(bx, by, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
}

const MIRROR = (i) => ({ x: ROOM_X(i) + 52, y: 120, w: 32, h: 50 });

// One dressing room: wallpaper, a star plate with the name, the mirror and the vanity.
function room(ctx, i, c, time, on, hot) {
  const x = ROOM_X(i);
  const [a, b] = WALLPAPER[i];
  ctx.fillStyle = a;
  ctx.fillRect(x, ROOM_TOP, ROOM_W, ROOM_FLOOR - ROOM_TOP);
  ctx.fillStyle = b;
  for (let sx = x + 6; sx < x + ROOM_W; sx += 14) ctx.fillRect(sx, ROOM_TOP, 5, ROOM_FLOOR - ROOM_TOP);
  // Little hearts or stars in the wallpaper, twinkling.
  for (let k = 0; k < 6; k++) {
    const px = x + 10 + ((k * 37) % (ROOM_W - 20));
    const py = ROOM_TOP + 30 + ((k * 23) % 60);
    ctx.globalAlpha = 0.35 + 0.2 * Math.sin(time * 1.5 + k + i);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(px, py, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // The floor.
  ctx.fillStyle = '#c8945a';
  ctx.fillRect(x, ROOM_FLOOR - 6, ROOM_W, 6);
  // The frame: posts and a lintel, warm wood.
  ctx.fillStyle = '#8a5a3a';
  ctx.fillRect(x - 1, ROOM_TOP, 4, ROOM_FLOOR - ROOM_TOP);
  ctx.fillRect(x + ROOM_W - 3, ROOM_TOP, 4, ROOM_FLOOR - ROOM_TOP);
  ctx.fillRect(x - 1, ROOM_TOP - 4, ROOM_W + 2, 6);
  // The vanity under the mirror: a table with a powder puff, a lipstick and a comb.
  const m = MIRROR(i);
  ctx.fillStyle = '#f4e4d0';
  ctx.fillRect(m.x - 6, m.y + m.h + 8, m.w + 12, 5);
  ctx.fillStyle = '#d8b898';
  ctx.fillRect(m.x - 4, m.y + m.h + 13, 3, ROOM_FLOOR - 6 - (m.y + m.h + 13));
  ctx.fillRect(m.x + m.w + 1, m.y + m.h + 13, 3, ROOM_FLOOR - 6 - (m.y + m.h + 13));
  ctx.fillStyle = '#ffc2dc';
  ctx.beginPath();
  ctx.arc(m.x + 4, m.y + m.h + 6, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d83a5a';
  ctx.fillRect(m.x + 14, m.y + m.h + 1, 3, 7);
  ctx.fillStyle = '#7fd3ff';
  ctx.fillRect(m.x + 24, m.y + m.h + 5, 12, 3);
  // The mirror itself (its reflection is drawn with the hero).
  ctx.fillStyle = '#d8b878';
  roundRect(ctx, m.x - 3, m.y - 3, m.w + 6, m.h + 6, 4);
  ctx.fill();
  const glass = ctx.createLinearGradient(m.x, m.y, m.x + m.w, m.y + m.h);
  glass.addColorStop(0, c ? '#eef6ff' : '#9aa4b8');
  glass.addColorStop(1, c ? '#cfe2f7' : '#7a8498');
  ctx.fillStyle = glass;
  roundRect(ctx, m.x, m.y, m.w, m.h, 3);
  ctx.fill();
  bulbs(ctx, m.x, m.y, m.w, m.h, time, Boolean(c), i * 2);
  if (!c) {
    // AUDITIONS! on an easel, and a cobweb in the corner.
    const ex = x + 26;
    ctx.strokeStyle = '#8a5a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ex - 12, ROOM_FLOOR - 6);
    ctx.lineTo(ex, 150);
    ctx.lineTo(ex + 12, ROOM_FLOOR - 6);
    ctx.stroke();
    const sway = Math.sin(time * 1.4 + i) * 0.03;
    ctx.save();
    ctx.translate(ex, 160);
    ctx.rotate(sway);
    ctx.fillStyle = '#fff3d8';
    ctx.fillRect(-20, -6, 40, 30);
    ctx.strokeStyle = '#d83a5a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-20, -6, 40, 30);
    text(ctx, 'AUDITIONS!', 0, 5, { size: 5.5, bold: true, align: 'center', color: '#d83a5a' });
    text(ctx, 'Click to', 0, 13, { size: 5, align: 'center', color: '#8a5a3a' });
    text(ctx, 'cast a hero', 0, 19, { size: 5, align: 'center', color: '#8a5a3a' });
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 0.6;
    for (let k = 1; k <= 3; k++) {
      ctx.beginPath();
      ctx.arc(x + ROOM_W - 3, ROOM_TOP + 2, k * 5, Math.PI / 2, Math.PI);
      ctx.stroke();
    }
  }
  // The star plate on the lintel, with the name (bright when picked).
  const sy = ROOM_TOP - 10;
  const pulse = on ? 1 + Math.sin(time * 4) * 0.06 : 1;
  ctx.save();
  ctx.translate(x + ROOM_W / 2, sy);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = on ? '#ffd66b' : hot ? '#ffe9a6' : '#e8c878';
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 6 : 14;
    const ang = -Math.PI / 2 + (k * Math.PI) / 5;
    ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  const name = c ? c.name : 'Open';
  ctx.font = font(7, true);
  const nw = ctx.measureText(name).width + 10;
  ctx.fillStyle = on ? '#d83a5a' : '#5a3424';
  roundRect(ctx, x + ROOM_W / 2 - nw / 2, sy + 9, nw, 11, 5);
  ctx.fill();
  text(ctx, name, x + ROOM_W / 2, sy + 17.5, { size: 7, bold: true, align: 'center', color: '#ffffff' });
  // Picked or hovered: a soft wash of light over the room.
  if (on || hot) {
    ctx.fillStyle = on ? 'rgba(255,240,190,0.16)' : 'rgba(255,255,255,0.08)';
    ctx.fillRect(x, ROOM_TOP, ROOM_W, ROOM_FLOOR - ROOM_TOP);
  }
}

// A hero's walk between their mirror and the stage: a list of points, walked at SPEED.
function pathFor(i, out) {
  const pts = [roomSpot(i), stepTop(i), stepFoot(i), stageSpot()];
  return out ? pts : pts.slice().reverse();
}
function walk(h, dt) {
  if (!h.path?.length) return false;
  let left = SPEED * dt;
  while (left > 0 && h.path.length) {
    const [p] = h.path;
    const dx = p.x - h.x;
    const dy = p.y - h.y;
    const d = Math.hypot(dx, dy);
    if (d <= left) {
      h.x = p.x;
      h.y = p.y;
      h.path.shift();
      left -= d;
    } else {
      h.x += (dx / d) * left;
      h.y += (dy / d) * left;
      if (Math.abs(dx) > 0.5) h.facing = Math.sign(dx);
      left = 0;
    }
  }
  return true;
}

// Draws the rooms and heroes. `state` keeps { slot, heroes }. Returns the slot clicked (or null),
// and whether it was the picked one (clicked again).
export function dressingRooms(ui, time, chars, state, live) {
  const { ctx } = ui;
  const dt = Math.max(0, Math.min(0.1, time - (state.roomsT ?? time)));
  state.roomsT = time;
  state.heroes ??= {};
  backdrop(ctx, time);
  platform(ctx, time);
  let click = null;
  for (let i = 0; i < chars.length; i++) {
    const on = i === state.slot;
    const hot = live && hover(ui, ROOM_X(i), ROOM_TOP - 20, ROOM_W, ROOM_FLOOR - ROOM_TOP + 20);
    room(ctx, i, chars[i], time, on, hot);
    if (live && clicked(ui, ROOM_X(i), ROOM_TOP - 20, ROOM_W, ROOM_FLOOR - ROOM_TOP + 20)) click = { slot: i, again: on };
  }
  // The spotlight on the stage, over the picked hero.
  const picked = chars[state.slot] ? state.heroes[state.slot] : null;
  const sx = picked ? picked.x : 246;
  const beam = ctx.createLinearGradient(0, 0, 0, STAGE);
  beam.addColorStop(0, 'rgba(255,244,210,0.02)');
  beam.addColorStop(1, 'rgba(255,244,210,0.13)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(sx - 6, 0);
  ctx.lineTo(sx + 6, 0);
  ctx.lineTo(sx + 40, STAGE + 4);
  ctx.lineTo(sx - 40, STAGE + 4);
  ctx.fill();
  const pool = ctx.createRadialGradient(sx, STAGE, 0, sx, STAGE, 44);
  pool.addColorStop(0, 'rgba(255,244,210,0.35)');
  pool.addColorStop(1, 'rgba(255,244,210,0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(sx, STAGE, 44, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // The heroes.
  chars.forEach((c, i) => {
    if (!c) {
      delete state.heroes[i];
      return;
    }
    const want = i === state.slot ? 'stage' : 'room';
    let h = state.heroes[i];
    if (!h) {
      const p = want === 'stage' ? stageSpot() : roomSpot(i);
      h = state.heroes[i] = { x: p.x, y: p.y, at: want, facing: 1, since: time - 5 };
    }
    if (h.at !== want && !h.path?.length) {
      h.path = pathFor(i, want === 'stage');
      h.at = want;
      h.since = time;
    }
    const moving = walk(h, dt);
    if (moving) h.arrived = time;
    drawHeroAt(ctx, c, h, i, time, moving);
  });
  return click;
}

// A hero in their room (back to us at the mirror, the mirror showing their face; now and then a
// spin round to practise a pose) or on the stage (a bow on arrival, then a cheer now and then).
function drawHeroAt(ctx, c, h, i, time, moving) {
  const look = c.appearance;
  const gear = wornGear(c);
  // (In the room their weapon hangs on its hook; they take it with them onto the stage.)
  const bare = { ...gear, weapon: null };
  const draw = (lk, x, y, st, g = gear, s = S) => withZoom(2, () => drawHero(ctx, lk, g, x, y, { scale: s, seed: i, time, ...st }));
  const onStage = h.at === 'stage' || h.y > ROOM_FLOOR + 1;
  if (gear.weapon && !onStage) hook(ctx, i, gear.weapon, time);
  if (moving) {
    // (Down the steps with a little hop to each one.)
    const hop = Math.abs(Math.sin(time * 12)) * (h.y > ROOM_FLOOR && h.y < STAGE ? 2 : 0.8);
    draw(look, h.x, h.y - hop, { pose: 'walk', facing: h.facing }, onStage ? gear : bare);
    return;
  }
  const since = time - (h.arrived ?? h.since);
  if (h.at === 'stage') {
    const bow = clamp(since / 1.6);
    const cycle = (since - 1.6) % 6;
    if (bow < 1) draw(look, h.x, h.y, { pose: 'embow', progress: ease(bow), dur: 1.6, facing: 1 });
    else if (cycle > 4.4) draw({ ...look, face: 'excited' }, h.x, h.y, { pose: 'emcheer', progress: (cycle - 4.4) / 1.6, dur: 1.6, facing: 1 });
    else draw(look, h.x, h.y, { pose: 'idle', facing: 1 });
    return;
  }
  // In the room: the fuss cycle, its own beat per hero.
  const t = time + i * 2.7;
  const turn = t % 8;
  const m = MIRROR(i);
  if (turn > 5.6) {
    // Turned to us to practise a pose; the mirror catches it from the side.
    const pose = POSES[Math.floor(t / 8 + i) % POSES.length];
    const face = MIRROR_FACES[(Math.floor(t / 8) + i) % MIRROR_FACES.length];
    const st = { pose, progress: (turn - 5.6) / 2.4, dur: 2.4 };
    reflect(ctx, m, () => draw({ ...look, face }, m.x + 16, m.y + 62, { ...st, facing: -1 }, bare, S * 0.8));
    draw({ ...look, face }, h.x, h.y, { ...st, facing: 1 }, bare);
    return;
  }
  // At the mirror, side-on: the mirror shows their face making faces back at them.
  const face = MIRROR_FACES[(Math.floor(t / 2.8) + i) % MIRROR_FACES.length];
  reflect(ctx, m, () => draw({ ...look, face }, m.x + 18, m.y + 62, { pose: 'idle', facing: -1 }, bare, S * 0.8));
  draw({ ...look, face }, h.x, h.y, { pose: 'idle', facing: 1 }, bare);
}

// A hero's weapon hung on its hook by the door while they get ready, swaying a little.
function hook(ctx, i, weapon, time) {
  const x = ROOM_X(i) + 12;
  const y = ROOM_TOP + 22;
  ctx.fillStyle = '#8a5a3a';
  ctx.beginPath();
  ctx.arc(x + 8, y - 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.translate(x + 8, y - 4);
  ctx.rotate(Math.sin(time * 1.2 + i) * 0.06);
  drawItemIcon(ctx, weapon.id, -8, 0, 1, weapon.variant ?? null);
  ctx.restore();
}

// Draws something inside a mirror: clipped to the glass, a little faded, with a shine across it.
function reflect(ctx, m, fn) {
  ctx.save();
  roundRect(ctx, m.x, m.y, m.w, m.h, 3);
  ctx.clip();
  ctx.globalAlpha = 0.85;
  fn();
  ctx.globalAlpha = 1;
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.beginPath();
  ctx.moveTo(m.x + 6, m.y);
  ctx.lineTo(m.x + 16, m.y);
  ctx.lineTo(m.x + 4, m.y + m.h);
  ctx.lineTo(m.x - 6, m.y + m.h);
  ctx.fill();
  ctx.restore();
}
