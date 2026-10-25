// Canvas drawing: world, actors, effects, HUD, and the setup screens.
// Reads game state only; never mutates it.

import { FLOOR_Y, cameraFor } from './game.js';
import { CLASSES } from './classes.js';
import { expToNext } from './progression.js';
import { drawCharacter, drawMob } from './sprites.js';
import { APPEARANCE_FIELDS } from './appearance.js';

const UI = {
  panel: 'rgba(38, 30, 62, 0.78)',
  panelEdge: '#fff3c4',
  text: '#fff9ee',
  muted: '#c8bfe0',
  hp: '#ff6b8a',
  mp: '#6fb8ff',
  exp: '#ffd66b',
};

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

function panel(ctx, x, y, w, h, r = 12) {
  const alpha = ctx.globalAlpha;
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = UI.panel;
  ctx.fill();
  ctx.strokeStyle = UI.panelEdge;
  ctx.globalAlpha = alpha * 0.5;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = alpha;
}

function roundPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Text gets a soft dark outline so it stays readable on the pale sky.
function text(ctx, str, x, y, size, color = UI.text, align = 'left', weight = '') {
  ctx.font = `${weight} ${size}px ${FONT}`.trim();
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(2, size / 5);
  ctx.strokeStyle = 'rgba(42, 36, 64, 0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

// ---------- Setup screens ----------

export function drawAppearance(ctx, width, height, appearance, row, time) {
  drawSky(ctx, width, height, 0, time);
  text(ctx, 'Make your hero', width / 2, height * 0.13, 34, UI.text, 'center', 'bold');
  text(ctx, 'Up / Down: choose    Left / Right: change    Enter: continue', width / 2, height * 0.13 + 30, 15, UI.muted, 'center');

  // Live preview, drawn at 3x scale on a soft stage.
  const stageX = width * 0.3;
  const stageY = height * 0.5;
  panel(ctx, stageX - 110, stageY - 150, 220, 270, 18);
  ctx.save();
  ctx.translate(stageX - 42, stageY - 84);
  ctx.scale(3, 3);
  drawCharacter(ctx, { x: 0, y: 0, w: 28, h: 48, vx: 0, dir: 1, onGround: true }, 0, appearance, '#ffd66b', time);
  ctx.restore();

  // Option rows.
  const rowX = width * 0.55;
  APPEARANCE_FIELDS.forEach((field, i) => {
    const y = height * 0.32 + i * 52;
    const selected = i === row;
    panel(ctx, rowX, y, 380, 40, 10);
    if (selected) {
      ctx.strokeStyle = '#ffd66b';
      ctx.lineWidth = 3;
      roundPath(ctx, rowX, y, 380, 40, 10);
      ctx.stroke();
    }
    text(ctx, field.label, rowX + 16, y + 26, 16, UI.muted, 'left', 'bold');
    const value = appearance[field.key];
    if (field.key.endsWith('Color') || field.key === 'skinTone' || field.key === 'outfitColor') {
      ctx.beginPath();
      ctx.arc(rowX + 300, y + 20, 11, 0, Math.PI * 2);
      ctx.fillStyle = value;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      text(ctx, value, rowX + 300, y + 26, 16, UI.text, 'center', 'bold');
    }
  });

  text(ctx, 'Press Enter to choose your class', width / 2, height * 0.9, 18, UI.text, 'center', 'bold');
}

export function drawSelect(ctx, width, height, time) {
  drawSky(ctx, width, height, 0, time);
  text(ctx, 'Choose your class', width / 2, height * 0.22, 36, UI.text, 'center', 'bold');
  text(ctx, 'Press 1, 2, or 3', width / 2, height * 0.22 + 32, 16, UI.muted, 'center');

  const ids = Object.keys(CLASSES);
  const boxW = 240;
  const gap = 40;
  const startX = width / 2 - (ids.length * boxW + (ids.length - 1) * gap) / 2;
  ids.forEach((id, i) => {
    const c = CLASSES[id];
    const x = startX + i * (boxW + gap);
    const y = height * 0.38;
    panel(ctx, x, y, boxW, 280, 16);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(x + boxW / 2, y + 110, 26, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `${i + 1}. ${c.name}`, x + boxW / 2, y + 36, 22, UI.text, 'center', 'bold');
    text(ctx, `HP ${c.baseStats.maxHp}  MP ${c.baseStats.maxMp}  ATK ${c.baseStats.atk}`, x + boxW / 2, y + 66, 14, UI.muted, 'center');
    c.skills.forEach((s, j) => {
      text(ctx, `${s.name} (Lv ${s.unlockLevel})`, x + boxW / 2, y + 160 + j * 26, 14, UI.text, 'center');
    });
  });
}

// ---------- World ----------

function drawSky(ctx, width, height, cam, time) {
  const g = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
  g.addColorStop(0, '#9fd8ff');
  g.addColorStop(1, '#ffe9f3');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // Sun.
  ctx.fillStyle = 'rgba(255, 240, 180, 0.9)';
  ctx.beginPath();
  ctx.arc(width * 0.8, 120, 46, 0, Math.PI * 2);
  ctx.fill();

  // Clouds drift slowly and move a little with the camera for depth.
  for (let i = 0; i < 8; i++) {
    const speed = 12 + i * 3;
    const baseX = (i * 360 + 80 - cam * 0.25 + time * speed) % (width + 400) - 200;
    const y = 80 + (i % 3) * 60;
    drawCloud(ctx, baseX, y, 0.8 + (i % 3) * 0.2);
  }
}

function drawCloud(ctx, x, y, s) {
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.beginPath();
  ctx.arc(x, y, 26 * s, 0, Math.PI * 2);
  ctx.arc(x + 30 * s, y - 14 * s, 32 * s, 0, Math.PI * 2);
  ctx.arc(x + 62 * s, y, 26 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawHills(ctx, cam) {
  const tint = ['#b9e6c0', '#a6dcb5'];
  for (let layer = 0; layer < 2; layer++) {
    ctx.fillStyle = tint[layer];
    const shift = cam * (0.3 + layer * 0.15);
    for (let i = -1; i < 8; i++) {
      const x = i * 340 - (shift % 340);
      ctx.beginPath();
      ctx.arc(x + 170, FLOOR_Y + 10, 150 + layer * 40, Math.PI, 0);
      ctx.fill();
    }
  }
}

function drawGround(ctx, width, height) {
  ctx.fillStyle = '#c99a6b';
  ctx.fillRect(0, FLOOR_Y + 10, width, height - FLOOR_Y);
  ctx.fillStyle = '#7bc96a';
  ctx.fillRect(0, FLOOR_Y, width, 12);
  // Grass tufts along the top edge.
  ctx.fillStyle = '#5fb050';
  for (let x = 0; x < width; x += 22) {
    ctx.beginPath();
    ctx.moveTo(x, FLOOR_Y);
    ctx.lineTo(x + 6, FLOOR_Y - 6);
    ctx.lineTo(x + 11, FLOOR_Y);
    ctx.fill();
  }
}

function drawBackground(ctx, game, cam, width, height) {
  drawSky(ctx, width, height, cam, game.time);
  drawHills(ctx, cam);
  drawGround(ctx, width, height);
}

function drawPortals(ctx, game, cam) {
  for (const portal of game.map.portals) {
    const x = portal.x - cam;
    const pulse = 0.6 + 0.3 * Math.sin(game.time * 4);
    ctx.fillStyle = `rgba(160, 220, 255, ${pulse})`;
    roundPath(ctx, x, FLOOR_Y - 120, 40, 120, 20);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    text(ctx, portal.label, x + 20, FLOOR_Y - 130, 13, UI.text, 'center', 'bold');
  }
}

function drawNpcs(ctx, game, cam) {
  for (const npc of game.map.npcs) {
    const x = npc.x - cam;
    const colors = { shop: '#ffd66b', skills: '#b8a6ff', upgrade: '#ff9b7a', quest: '#8ee3a6' };
    const body = colors[npc.role] ?? '#ffd66b';
    // Little NPC: round head, body, and a role-colored hat.
    ctx.fillStyle = body;
    roundPath(ctx, x - 14, FLOOR_Y - 46, 28, 46, 10);
    ctx.fill();
    ctx.strokeStyle = '#2a2440';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffe2c7';
    ctx.beginPath();
    ctx.arc(x, FLOOR_Y - 54, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = body;
    ctx.fillRect(x - 11, FLOOR_Y - 64, 22, 6);
    ctx.fillStyle = '#2a2440';
    ctx.fillRect(x - 5, FLOOR_Y - 56, 2.5, 3);
    ctx.fillRect(x + 3, FLOOR_Y - 56, 2.5, 3);
    text(ctx, npc.name, x, FLOOR_Y - 76, 13, UI.text, 'center', 'bold');
  }
}

function drawMobs(ctx, game, cam) {
  for (const mob of game.mobs) {
    if (!mob.alive) continue;
    const sx = mob.x - cam;
    drawMob(ctx, mob, sx, game.time);
    // Soft HP pill above the mob.
    const bw = Math.max(mob.w, 30);
    const bx = sx + mob.w / 2 - bw / 2;
    roundPath(ctx, bx, mob.y - 12, bw, 6, 3);
    ctx.fillStyle = 'rgba(40,30,60,0.5)';
    ctx.fill();
    roundPath(ctx, bx, mob.y - 12, bw * (mob.hp / mob.maxHp), 6, 3);
    ctx.fillStyle = UI.hp;
    ctx.fill();
  }
}

function drawPlayer(ctx, game, cam) {
  const p = game.player;
  if (p.invuln > 0 && Math.floor(game.time * 20) % 2 === 0) return;
  const accent = game.classDef.color;
  drawCharacter(ctx, p, p.x - cam, game.appearance, accent, game.time);
}

function drawEffects(ctx, game, cam) {
  for (const e of game.effects) {
    if (e.kind === 'aoe') {
      const b = e.box;
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      roundPath(ctx, b.x - cam, b.y, b.w, b.h, 14);
      ctx.fill();
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
  ctx.textAlign = 'center';
  for (const f of game.floaters) {
    ctx.font = `bold 15px ${FONT}`;
    ctx.fillStyle = f.color;
    ctx.globalAlpha = Math.min(1, f.t * 2);
    ctx.fillText(f.text, f.x - cam, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

// ---------- HUD ----------

function bar(ctx, x, y, w, h, ratio, color, label) {
  roundPath(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(40,30,60,0.6)';
  ctx.fill();
  const fill = w * Math.max(0, Math.min(1, ratio));
  if (fill > 0) {
    roundPath(ctx, x, y, Math.max(h, fill), h, h / 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
  if (label) text(ctx, label, x + w / 2, y + h - 3, 11, UI.text, 'center', 'bold');
}

function drawHud(ctx, game, width, height) {
  const c = game.character;
  const pad = 16;
  panel(ctx, pad, pad, 300, 94);
  text(ctx, `${game.classDef.name}  Lv ${c.level}   ${game.map.name}`, pad + 12, pad + 22, 14, UI.text, 'left', 'bold');
  bar(ctx, pad + 10, pad + 30, 280, 16, c.hp / c.maxHp, UI.hp, `HP ${Math.ceil(c.hp)}/${c.maxHp}`);
  bar(ctx, pad + 10, pad + 50, 280, 16, c.mp / c.maxMp, UI.mp, `MP ${Math.ceil(c.mp)}/${c.maxMp}`);
  bar(ctx, pad + 10, pad + 72, 280, 8, c.exp / expToNext(c.level), UI.exp);

  panel(ctx, width - 230 - pad, pad, 230, 94);
  const rx = width - 220 - pad;
  text(ctx, `Gold: ${c.gold}`, rx, pad + 22, 14);
  text(ctx, `Potions: ${game.potions} (H)`, rx, pad + 42, 14);
  const equipped = Object.values(game.equipped).filter(Boolean);
  text(ctx, `Gear: ${equipped.length}/5 slots`, rx, pad + 62, 14);
  text(ctx, `Skill pts: ${c.skillPoints}`, rx, pad + 82, 14);

  // Skill bar with a cooldown sweep.
  const keys = ['Q', 'E', 'R'];
  game.classDef.skills.forEach((s, i) => {
    const bx = width / 2 - 110 + i * 80;
    const by = height - 72;
    const locked = c.level < s.unlockLevel;
    const cd = game.cooldowns[s.id] ?? 0;
    panel(ctx, bx, by, 64, 50, 10);
    if (locked) {
      roundPath(ctx, bx, by, 64, 50, 10);
      ctx.fillStyle = 'rgba(20,16,30,0.6)';
      ctx.fill();
    } else if (cd > 0) {
      ctx.fillStyle = 'rgba(20,16,30,0.6)';
      ctx.fillRect(bx, by, 64, 50 * (cd / s.cooldown));
    }
    text(ctx, keys[i], bx + 8, by + 18, 13, locked ? '#777' : UI.text, 'left', 'bold');
    text(ctx, locked ? `Lv ${s.unlockLevel}` : s.name, bx + 32, by + 38, 10, locked ? '#777' : UI.muted, 'center');
  });

  // Message log, as small chips above the skill bar.
  game.messages.forEach((m, i) => {
    const y = height - 170 + i * 24;
    ctx.globalAlpha = Math.min(1, m.t);
    ctx.font = `bold 13px ${FONT}`;
    panel(ctx, pad, y - 16, ctx.measureText(m.text).width + 24, 22, 8);
    text(ctx, m.text, pad + 12, y, 13);
    ctx.globalAlpha = 1;
  });

  if (game.nearNpc) {
    const hint = {
      skills: 'Press 1/2/3 to spend a skill point',
      upgrade: 'Press U to upgrade your weapon',
      shop: 'Press B to buy a potion (25G)',
      quest: 'Explore the meadow to level up',
    }[game.nearNpc.role];
    const tw = 340;
    panel(ctx, width / 2 - tw / 2, height - 214, tw, 30, 10);
    text(ctx, `${game.nearNpc.name}: ${hint}`, width / 2, height - 194, 14, UI.text, 'center', 'bold');
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
