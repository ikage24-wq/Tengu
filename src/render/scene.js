// Draws one frame of the world: scenery, NPCs, loot, monsters, the player, effects, and numbers.

import { settings } from '../core/settings.js';
import { NPCS } from '../data/npcs.js';
import { drawSceneBack } from './scenery.js';
import { drawHero } from './hero.js';
import { drawMonster } from './monsters.js';
import { drawEffects, drawWarnings, drawNumbers, drawDrops } from './effects.js';
import { questMarker } from '../ui/npc.js';
import { nearbyNpc } from '../world/world.js';
import { summonPosition } from '../world/combat.js';
import { drawSummon } from './summons.js';
import { text, box, COLORS } from '../ui/kit.js';
import { createAnim, stepAnim } from './animator.js';
import { createParticles, updateParticles, drawParticles, absorbJuice, shakeOffset, dust, elementStep, elementAura } from './particles.js';
import { ITEMS } from '../data/items.js';
import { drawBubble } from '../ui/chat.js';
import { drawBuffEffects } from './buffs.js';
import { drawStreet, drawTownsfolk, npcRoutine } from './town.js';

// Render-side state that persists between frames: the player's animation and the particles.
const feel = { anim: createAnim(), fx: createParticles(), last: null, world: null };

export const VIEW_W = 640;
export const VIEW_H = 360;
const BAR_ROOM = 34;

export function createCamera() {
  return { x: 0, y: 0, ready: false };
}

// Follows the player smoothly and stays inside the map.
export function updateCamera(cam, world, dt) {
  const map = world.map;
  const tx = Math.max(0, Math.min(map.width - VIEW_W, world.body.x - VIEW_W / 2));
  // The camera can sit a bar's height below the map so the floor shows above the status bar.
  const ty = Math.max(0, Math.min(map.height - VIEW_H + BAR_ROOM, world.body.y - VIEW_H * 0.6));
  if (!cam.ready || cam.mapId !== map.id) {
    cam.x = tx;
    cam.y = ty;
    cam.ready = true;
    cam.mapId = map.id;
    return;
  }
  const k = 1 - Math.exp(-dt * 8);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
}

function playerPose(world) {
  const b = world.body;
  if (world.pose) return { pose: world.pose.kind, progress: 1 - world.pose.t / world.pose.dur, dur: world.pose.dur };
  if (b.rope) return { pose: 'climb' };
  if (!b.onGround) return { pose: 'jump', vy: b.vy };
  if (Math.abs(b.vx) > 8) return { pose: 'walk' };
  return { pose: 'idle' };
}

function drawNpcs(ctx, world, cam, time) {
  const near = nearbyNpc(world);
  for (const n of world.map.npcs) {
    const npc = NPCS[n.id];
    const x = n.x - cam.x;
    const y = world.map.groundY - cam.y;
    if (x < -40 || x > VIEW_W + 40) continue;
    // Each NPC runs their own idle routine, but turns to face you while you're close.
    const r = npcRoutine(n.id, time + (n.x % 97) * 0.1);
    const close = near?.id === n.id;
    const facing = r.facing && !close ? r.facing : world.body.x < n.x ? -1 : 1;
    const busy = r.pose && !close;
    const look = r.face ? { ...npc.look, face: r.face } : npc.look;
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#3a2d4f';
    ctx.beginPath();
    ctx.ellipse(x, y, 10, 2.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawHero(ctx, look, npc.gear ?? null, x, y - (r.lift ?? 0), { pose: busy ? r.pose : 'idle', progress: r.progress ?? 0, dur: 0.5, time, seed: n.x % 97, facing, job: npc.showJob });
    if (r.extra && !close) r.extra(ctx, x, y - (r.lift ?? 0), time, facing);
    ctx.font = 'bold 8px sans-serif';
    const label = npc.name;
    const w = ctx.measureText(label).width + 10;
    const hovered = world.hoverNpc === n.id;
    box(ctx, x - w / 2, y + 2, w, 11, { fill: hovered ? COLORS.accent : 'rgba(90,63,122,0.75)', edge: hovered ? '#ffffff' : null, r: 5 });
    text(ctx, label, x, y + 10, { size: 8, bold: true, align: 'center', color: '#ffffff' });
    if (hovered && near?.id !== n.id) {
      box(ctx, x - 28, y - 70, 56, 12, { fill: '#ffffff', edge: COLORS.accent, r: 6 });
      text(ctx, 'Click to talk', x, y - 61, { size: 7.5, bold: true, align: 'center', color: COLORS.accent });
    }
    const mark = questMarker(world.char, n.id);
    if (mark) {
      const bob = Math.sin(time * 4) * 2;
      text(ctx, mark, x, y - 54 + bob, { size: 16, bold: true, align: 'center', color: mark === '?' ? '#7ee081' : '#ffe36b', outline: '#8f5cc4' });
    }
    if (near?.id === n.id) {
      box(ctx, x - 22, y - 70, 44, 12, { fill: '#ffffff', edge: COLORS.accent, r: 6 });
      text(ctx, '▲ Talk', x, y - 61, { size: 8, bold: true, align: 'center', color: COLORS.accent });
    }
  }
}

function drawMobs(ctx, world, cam, time) {
  let boss = null;
  for (const m of world.mobs) {
    const x = m.x - cam.x;
    const y = m.y - cam.y;
    if (x < -80 || x > VIEW_W + 80) continue;
    drawMonster(ctx, m, x, y, time, world.now);
    if (m.def.boss) boss = m;
    if (settings.monsterHp && m.hp > 0 && m.hp < m.def.hp && !m.def.boss) {
      const w = Math.max(24, m.def.w);
      box(ctx, x - w / 2, y - m.def.h - 7, w, 4, { fill: 'rgba(58,45,79,0.5)', edge: null, r: 2 });
      box(ctx, x - w / 2, y - m.def.h - 7, Math.max(2, (w * m.hp) / m.def.hp), 4, { fill: COLORS.hp, edge: null, r: 2 });
    }
  }
  if (boss && boss.hp > 0) {
    box(ctx, 170, 60, 300, 12, { fill: 'rgba(58,45,79,0.6)', edge: '#ffffff', r: 6 });
    box(ctx, 171, 61, Math.max(4, (298 * boss.hp) / boss.def.hp), 10, { fill: '#c9a6ff', edge: null, r: 5 });
    text(ctx, `${boss.def.name}  Lv ${boss.def.level}`, 320, 69, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: '#5a3f7a' });
  }
}

export function drawWorld(ctx, world, viewCam, time) {
  const b = world.body;
  const dt = feel.last === null ? 0 : Math.min(0.1, Math.max(0, time - feel.last));
  feel.last = time;
  if (feel.world !== world || feel.mapId !== world.map.id) {
    feel.fx = createParticles();
    if (feel.world !== world) feel.anim = createAnim();
    feel.world = world;
    feel.mapId = world.map.id;
  }
  absorbJuice(feel.fx, world);
  // Endgame weapons leave elemental footsteps and wrap their wielder in sparkles.
  const element = settings.weaponEffects && world.char.equipment.weapon ? ITEMS[world.char.equipment.weapon.id].element : null;
  for (const e of stepAnim(feel.anim, b, dt)) {
    if (e === 'step') {
      dust(feel.fx, b.x - b.facing * 6, b.y, 1, -b.facing);
      if (element) elementStep(feel.fx, b.x - b.facing * 4, b.y, element, b.facing);
    }
    if (e === 'land') {
      dust(feel.fx, b.x, b.y, 6);
      if (element) for (const dx of [-6, 0, 6]) elementStep(feel.fx, b.x + dx, b.y, element, Math.sign(dx) || 1);
    }
    if (e === 'jump') dust(feel.fx, b.x, b.y, 3);
  }
  if (element && !world.dead) elementAura(feel.fx, b.x, b.y, element, dt);
  updateParticles(feel.fx, dt, world, viewCam, VIEW_W, VIEW_H);
  const [ox, oy] = shakeOffset(feel.fx, time);
  const cam = { x: viewCam.x + ox, y: viewCam.y + oy };
  const nearPortal = world.map.portals.find((p) => !p.hidden && Math.abs(p.x - b.x) < 22 && Math.abs(p.y - b.y) < 6);
  drawSceneBack(ctx, world.map, cam, VIEW_W, VIEW_H, time, nearPortal?.id, () => drawStreet(ctx, world.map, cam, VIEW_W, time));
  drawTownsfolk(ctx, world.map, cam, VIEW_W, time);
  drawNpcs(ctx, world, cam, time);
  drawWarnings(ctx, world, cam, time);
  drawDrops(ctx, world, cam, time);
  drawMobs(ctx, world, cam, time);

  const p = playerPose(world);
  const blink = world.invuln > 0 && Math.floor(time * 16) % 2 === 0;
  if (b.onGround) drawShadow(ctx, b.x - cam.x, b.y - cam.y, 1);
  // A chat emoticon shows on the face for a few seconds.
  const look = world.emote ? { ...world.char.appearance, face: world.emote.face } : world.char.appearance;
  const hx = Math.round(b.x - cam.x);
  const hy = Math.round(b.y - cam.y);
  const heroState = { ...p, time, facing: b.facing, hurt: world.invuln > 0.6 && !world.pose, alpha: world.dead ? 0.5 : blink ? 0.45 : 1, job: world.char.job };
  const buffs = world.dead ? {} : world.char.buffs;
  drawBuffEffects(ctx, buffs, 'back', hx, hy, time, world.now, b.facing);
  drawBuffClones(ctx, buffs, look, world.char.equipment, hx, hy, heroState, time);
  drawHero(ctx, look, world.char.equipment, hx, hy, heroState, feel.anim);
  drawBuffEffects(ctx, buffs, 'front', hx, hy, time, world.now, b.facing);

  let summonIndex = 0;
  for (const buff of Object.values(world.char.buffs)) {
    if (!buff.summon) continue;
    const pos = summonPosition(world, summonIndex++);
    drawSummon(ctx, buff.summon.art, pos.x - cam.x, pos.y - cam.y, time, b.facing);
  }

  drawEffects(ctx, world, cam, time);
  drawParticles(ctx, feel.fx, cam, time);
  if (settings.damageNumbers) drawNumbers(ctx, world, cam);
  if (settings.chatBubbles) drawBubbles(ctx, world, cam);
}

// Buffs that copy you: Shadow Partner's dark clone just behind, and Mirage's golden decoys.
function drawBuffClones(ctx, buffs, look, gear, x, y, state, time) {
  const clone = (dx, alpha, filter) => {
    ctx.save();
    ctx.filter = filter;
    drawHero(ctx, look, gear, x + dx, y, { ...state, job: null, alpha: state.alpha * alpha });
    ctx.restore();
  };
  if (buffs.shadowpartner) {
    clone(-state.facing * (12 + Math.sin(time * 2) * 2), 0.6, 'brightness(0.3) sepia(1) hue-rotate(220deg) saturate(3)');
  }
  if (buffs.mirage) {
    for (const side of [-1, 1]) {
      const flicker = 0.25 + 0.2 * Math.sin(time * 6 + side * 2);
      clone(side * (20 + Math.sin(time * 1.5 + side) * 4), flicker, 'sepia(1) saturate(2.5) brightness(1.25)');
    }
  }
}

// A soft oval under the feet.
function drawShadow(ctx, x, y, k) {
  ctx.save();
  ctx.globalAlpha = 0.18 * k;
  ctx.fillStyle = '#3a2d4f';
  ctx.beginPath();
  ctx.ellipse(x, y, 11 * k, 2.5 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Speech bubbles over the player and NPCs; they fade out at the end.
function drawBubbles(ctx, world, cam) {
  for (const [who, bubble] of Object.entries(world.bubbles ?? {})) {
    const npc = who === 'player' ? null : world.map.npcs.find((n) => n.id === who);
    if (who !== 'player' && !npc) continue;
    const x = who === 'player' ? world.body.x : npc.x;
    const y = who === 'player' ? world.body.y : world.map.groundY;
    drawBubble(ctx, Math.round(x - cam.x), Math.round(y - cam.y - 62), bubble.text, Math.min(1, bubble.t * 2));
  }
}
