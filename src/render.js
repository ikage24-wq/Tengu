// Canvas drawing: world, actors, effects, HUD, and the class-select screen.
// Reads game state only; never mutates it.

import { FLOOR_Y, cameraFor } from './game.js';
import { CLASSES } from './classes.js';
import { expToNext } from './progression.js';
import { MOB_TYPES } from './mobs.js';

const COLORS = {
  sky: '#1b2a44',
  skyTown: '#2a3b5c',
  ground: '#3a5a3a',
  groundTop: '#5a8a4a',
  portal: '#7ad7ff',
  npc: '#ffe08a',
  hud: 'rgba(10,12,18,0.7)',
};

export function drawSelect(ctx, width, height) {
  ctx.fillStyle = COLORS.sky;
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.fillText('Choose your class', width / 2, height * 0.22);
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillStyle = '#b8c4d8';
  ctx.fillText('Press 1, 2, or 3', width / 2, height * 0.22 + 32);

  const ids = Object.keys(CLASSES);
  const boxW = 240;
  const gap = 40;
  const startX = width / 2 - (ids.length * boxW + (ids.length - 1) * gap) / 2;
  ids.forEach((id, i) => {
    const c = CLASSES[id];
    const x = startX + i * (boxW + gap);
    const y = height * 0.38;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.fillRect(x, y, boxW, 280);
    ctx.strokeStyle = '#5a6a88';
    ctx.strokeRect(x, y, boxW, 280);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px system-ui, sans-serif';
    ctx.fillText(`${i + 1}. ${c.name}`, x + boxW / 2, y + 36);
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillStyle = '#b8c4d8';
    ctx.fillText(`HP ${c.baseStats.maxHp}  MP ${c.baseStats.maxMp}  ATK ${c.baseStats.atk}`, x + boxW / 2, y + 66);
    c.skills.forEach((s, j) => {
      ctx.fillText(`${s.name} (Lv ${s.unlockLevel})`, x + boxW / 2, y + 110 + j * 26);
    });
  });
  ctx.textAlign = 'left';
}

function drawBackground(ctx, game, cam, width, height) {
  const isTown = game.map.isTown;
  ctx.fillStyle = isTown ? COLORS.skyTown : COLORS.sky;
  ctx.fillRect(0, 0, width, height);
  // Distant hills for a bit of depth, shifted slower than the foreground.
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < 6; i++) {
    const x = i * 420 - (cam * 0.3) % 420;
    ctx.beginPath();
    ctx.arc(x + 200, FLOOR_Y, 200, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.ground;
  ctx.fillRect(0, FLOOR_Y, width, height - FLOOR_Y);
  ctx.fillStyle = COLORS.groundTop;
  ctx.fillRect(0, FLOOR_Y, width, 6);
}

function drawPortals(ctx, game, cam) {
  for (const portal of game.map.portals) {
    const x = portal.x - cam;
    ctx.fillStyle = COLORS.portal;
    ctx.globalAlpha = 0.5 + 0.3 * Math.sin(game.time * 4);
    ctx.fillRect(x, FLOOR_Y - 120, 40, 120);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(portal.label, x + 20, FLOOR_Y - 130);
    ctx.textAlign = 'left';
  }
}

function drawNpcs(ctx, game, cam) {
  for (const npc of game.map.npcs) {
    const x = npc.x - cam - 14;
    ctx.fillStyle = COLORS.npc;
    ctx.fillRect(x, FLOOR_Y - 56, 28, 56);
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(npc.name, x + 14, FLOOR_Y - 64);
    ctx.textAlign = 'left';
  }
}

function drawMobs(ctx, game, cam) {
  for (const mob of game.mobs) {
    if (!mob.alive) continue;
    const t = MOB_TYPES[mob.typeId];
    const x = mob.x - cam;
    ctx.fillStyle = t.color;
    ctx.fillRect(x, mob.y, mob.w, mob.h);
    // Eyes so facing and mob type read at a glance.
    ctx.fillStyle = '#111';
    ctx.fillRect(x + mob.w * 0.25, mob.y + mob.h * 0.3, 4, 4);
    ctx.fillRect(x + mob.w * 0.6, mob.y + mob.h * 0.3, 4, 4);
    const bw = mob.w;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(x, mob.y - 10, bw, 5);
    ctx.fillStyle = '#e5484d';
    ctx.fillRect(x, mob.y - 10, bw * (mob.hp / mob.maxHp), 5);
  }
}

function drawPlayer(ctx, game, cam) {
  const p = game.player;
  const x = p.x - cam;
  if (p.invuln > 0 && Math.floor(game.time * 20) % 2 === 0) return;
  ctx.fillStyle = game.classDef.color;
  ctx.fillRect(x, p.y, p.w, p.h);
  ctx.fillStyle = '#111';
  const eyeX = p.dir > 0 ? x + p.w - 10 : x + 4;
  ctx.fillRect(eyeX, p.y + 10, 4, 4);
}

function drawEffects(ctx, game, cam) {
  for (const e of game.effects) {
    if (e.kind === 'aoe') {
      const b = e.box;
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(b.x - cam, b.y, b.w, b.h);
    } else if (e.kind === 'levelup') {
      ctx.strokeStyle = '#ffe866';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x - cam + 14, e.y + 24, 30 + (1.2 - e.t) * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}

function drawFloaters(ctx, game, cam) {
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  for (const f of game.floaters) {
    ctx.fillStyle = f.color;
    ctx.globalAlpha = Math.min(1, f.t * 2);
    ctx.fillText(f.text, f.x - cam, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// Draws a bar; if `label` is given it is centered on top of the bar.
function bar(ctx, x, y, w, h, ratio, color, label) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
  if (label) {
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h - 3);
    ctx.textAlign = 'left';
  }
}

function drawHud(ctx, game, width, height) {
  const c = game.character;
  const pad = 16;
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(pad, pad, 300, 94);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText(`${game.classDef.name}  Lv ${c.level}   ${game.map.name}`, pad + 10, pad + 20);
  bar(ctx, pad + 10, pad + 28, 280, 16, c.hp / c.maxHp, '#e5484d', `HP ${Math.ceil(c.hp)}/${c.maxHp}`);
  bar(ctx, pad + 10, pad + 48, 280, 16, c.mp / c.maxMp, '#4d8fe5', `MP ${Math.ceil(c.mp)}/${c.maxMp}`);
  bar(ctx, pad + 10, pad + 68, 280, 8, c.exp / expToNext(c.level), '#ffd34d');

  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(width - 230 - pad, pad, 230, 94);
  ctx.fillStyle = '#ffffff';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(`Gold: ${c.gold}`, width - 220 - pad, pad + 20);
  ctx.fillText(`Potions: ${game.potions} (H)`, width - 220 - pad, pad + 40);
  const equipped = Object.values(game.equipped).filter(Boolean);
  ctx.fillText(`Gear: ${equipped.length}/5 slots`, width - 220 - pad, pad + 60);
  ctx.fillText(`Skill pts: ${c.skillPoints}`, width - 220 - pad, pad + 80);

  // Skill bar with cooldown overlays.
  const keys = ['Q', 'E', 'R'];
  game.classDef.skills.forEach((s, i) => {
    const bx = width / 2 - 110 + i * 80;
    const by = height - 70;
    const locked = c.level < s.unlockLevel;
    ctx.fillStyle = locked ? 'rgba(40,40,50,0.8)' : COLORS.hud;
    ctx.fillRect(bx, by, 64, 48);
    ctx.fillStyle = locked ? '#666' : '#fff';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.fillText(`${keys[i]}`, bx + 6, by + 16);
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(locked ? `Lv ${s.unlockLevel}` : s.name, bx + 6, by + 36);
  });

  // Message log.
  ctx.font = '13px system-ui, sans-serif';
  game.messages.forEach((m, i) => {
    const alpha = Math.min(1, m.t);
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillText(m.text, pad, height - 150 + i * 18);
  });

  if (game.nearNpc) {
    ctx.fillStyle = COLORS.hud;
    const hint = {
      skills: 'Press 1/2/3 to spend a skill point',
      upgrade: 'Press U to upgrade your weapon',
      shop: 'Press B to buy a potion (25G)',
      quest: 'Explore the meadow to level up',
    }[game.nearNpc.role];
    const tw = 320;
    ctx.fillRect(width / 2 - tw / 2, height - 200, tw, 26);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(`${game.nearNpc.name}: ${hint}`, width / 2, height - 182);
    ctx.textAlign = 'left';
  }
}

export function drawGame(ctx, game, width, height) {
  const cam = cameraFor(game, width);
  drawBackground(ctx, game, cam, width, height);
  drawPortals(ctx, game, cam);
  drawNpcs(ctx, game, cam);
  drawMobs(ctx, game, cam);
  drawPlayer(ctx, game, cam);
  drawEffects(ctx, game, cam);
  drawFloaters(ctx, game, cam);
  drawHud(ctx, game, width, height);
}
