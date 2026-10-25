// Draws one frame of the world: scenery, NPCs, loot, monsters, the player, effects, and numbers.

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
  if (world.pose) return { pose: world.pose.kind, progress: 1 - world.pose.t / world.pose.dur, frame: 0 };
  if (b.rope) return { pose: 'climb', frame: Math.floor(b.y / 8) % 2 };
  if (!b.onGround) return { pose: 'jump', frame: 0 };
  if (Math.abs(b.vx) > 8) return { pose: 'walk', frame: Math.floor(world.now * 9) % 4 };
  return { pose: 'idle', frame: Math.floor(world.now * 2) % 2 };
}

function drawNpcs(ctx, world, cam, time) {
  const near = nearbyNpc(world);
  for (const n of world.map.npcs) {
    const npc = NPCS[n.id];
    const x = n.x - cam.x;
    const y = world.map.groundY - cam.y;
    if (x < -40 || x > VIEW_W + 40) continue;
    const facing = world.body.x < n.x ? -1 : 1;
    drawHero(ctx, npc.look, null, x, y, { pose: 'idle', frame: Math.floor(time * 2 + n.x) % 2, facing });
    ctx.font = 'bold 8px sans-serif';
    const label = npc.name;
    const w = ctx.measureText(label).width + 10;
    box(ctx, x - w / 2, y + 2, w, 11, { fill: 'rgba(90,63,122,0.75)', edge: null, r: 5 });
    text(ctx, label, x, y + 10, { size: 8, bold: true, align: 'center', color: '#ffffff' });
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
    drawMonster(ctx, m, x, y, time);
    if (m.def.boss) boss = m;
    if (m.hp > 0 && m.hp < m.def.hp && !m.def.boss) {
      const w = Math.max(24, m.def.w);
      box(ctx, x - w / 2, y - m.def.h - 7, w, 4, { fill: 'rgba(58,45,79,0.5)', edge: null, r: 2 });
      box(ctx, x - w / 2, y - m.def.h - 7, Math.max(2, (w * m.hp) / m.def.hp), 4, { fill: COLORS.hp, edge: null, r: 2 });
    }
  }
  if (boss && boss.hp > 0) {
    box(ctx, 170, 26, 300, 12, { fill: 'rgba(58,45,79,0.6)', edge: '#ffffff', r: 6 });
    box(ctx, 171, 27, Math.max(4, (298 * boss.hp) / boss.def.hp), 10, { fill: '#c9a6ff', edge: null, r: 5 });
    text(ctx, `${boss.def.name}  Lv ${boss.def.level}`, 320, 35, { size: 8, bold: true, align: 'center', color: '#ffffff', outline: '#5a3f7a' });
  }
}

export function drawWorld(ctx, world, cam, time) {
  const b = world.body;
  const nearPortal = world.map.portals.find((p) => !p.hidden && Math.abs(p.x - b.x) < 22 && Math.abs(p.y - b.y) < 6);
  drawSceneBack(ctx, world.map, cam, VIEW_W, VIEW_H, time, nearPortal?.id);
  drawNpcs(ctx, world, cam, time);
  drawWarnings(ctx, world, cam, time);
  drawDrops(ctx, world, cam, time);
  drawMobs(ctx, world, cam, time);

  const p = playerPose(world);
  const blink = world.invuln > 0 && Math.floor(time * 16) % 2 === 0;
  drawHero(ctx, world.char.appearance, world.char.equipment, b.x - cam.x, b.y - cam.y, {
    ...p, facing: b.facing, hurt: world.invuln > 0.6 && !world.pose, alpha: world.dead ? 0.5 : blink ? 0.45 : 1,
  });

  let summonIndex = 0;
  for (const buff of Object.values(world.char.buffs)) {
    if (!buff.summon) continue;
    const pos = summonPosition(world, summonIndex++);
    drawSummon(ctx, buff.summon.art, pos.x - cam.x, pos.y - cam.y, time, b.facing);
  }

  drawEffects(ctx, world, cam, time);
  drawNumbers(ctx, world, cam);
}
