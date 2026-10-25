// Canvas drawing: world, actors, effects, HUD, and the setup screens.
// Everything is drawn on a fixed 640x360 virtual canvas that main.js scales up with crisp pixels.
// Reads game state only; never mutates it.

import { FLOOR_Y, cameraFor } from './game.js';
import { CLASSES } from './classes.js';
import { expToNext } from './progression.js';
import { drawCharacter, drawCharacterPreview, drawMob, drawNpc } from './sprites.js';
import { drawBackdrop, drawPlatforms } from './scenery.js';
import { APPEARANCE_FIELDS, COLOR_FIELDS } from './appearance.js';
import { RARITIES, SLOTS } from './gear.js';

export const VW = 640;
export const VH = 360;

const UI = {
  panel: 'rgba(38, 30, 62, 0.8)',
  panelEdge: '#fff3c4',
  text: '#fff9ee',
  muted: '#d4cbe8',
  hp: '#ff6b8a',
  mp: '#6fb8ff',
  exp: '#ffd66b',
};

const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';
const NPC_COLORS = { shop: '#ffd66b', skills: '#b8a6ff', upgrade: '#ff9b7a', quest: '#8ee3a6' };
const MENU_THEME = 'sunset';

function roundPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, r = 4) {
  const alpha = ctx.globalAlpha;
  roundPath(ctx, x, y, w, h, r);
  ctx.fillStyle = UI.panel;
  ctx.fill();
  ctx.strokeStyle = UI.panelEdge;
  ctx.globalAlpha = alpha * 0.5;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = alpha;
}

// Text gets a dark outline so it stays readable on any background.
function text(ctx, str, x, y, size, color = UI.text, align = 'left', weight = '') {
  ctx.font = `${weight} ${size}px ${FONT}`.trim();
  ctx.textAlign = align;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1.5, size / 4);
  ctx.strokeStyle = 'rgba(42, 36, 64, 0.85)';
  ctx.strokeText(str, x, y);
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
  ctx.textAlign = 'left';
}

// ---------- World ----------

function drawPortals(ctx, game, cam) {
  for (const portal of game.map.portals) {
    const x = portal.x - cam;
    const pulse = 0.6 + 0.3 * Math.sin(game.time * 4);
    ctx.fillStyle = `rgba(160, 220, 255, ${pulse})`;
    roundPath(ctx, x, FLOOR_Y - 120, 40, 120, 12);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, portal.label, x + 20, FLOOR_Y - 126, 8, UI.text, 'center', 'bold');
  }
}

function drawNpcs(ctx, game, cam) {
  for (const npc of game.map.npcs) {
    const sx = npc.x - cam;
    drawNpc(ctx, npc, sx, NPC_COLORS[npc.role] ?? '#ffd66b', FLOOR_Y);
    text(ctx, npc.name, sx, FLOOR_Y - 46, 8, UI.text, 'center', 'bold');
  }
}

function drawMobs(ctx, game, cam) {
  for (const mob of game.mobs) {
    if (!mob.alive) continue;
    const sx = mob.x - cam;
    drawMob(ctx, mob, sx, game.time);
    // Small HP bar above the mob.
    const bw = Math.max(mob.w, 24);
    const bx = sx + mob.w / 2 - bw / 2;
    const by = mob.y - 6;
    ctx.fillStyle = 'rgba(40,30,60,0.6)';
    ctx.fillRect(bx, by, bw, 3);
    ctx.fillStyle = UI.hp;
    ctx.fillRect(bx, by, bw * (mob.hp / mob.maxHp), 3);
  }
}

function drawPlayer(ctx, game, cam) {
  const p = game.player;
  if (p.invuln > 0 && Math.floor(game.time * 20) % 2 === 0) return;
  drawCharacter(ctx, p, p.x - cam, game.appearance, game.classDef.color, game.time);
}

function drawEffects(ctx, game, cam) {
  for (const e of game.effects) {
    if (e.kind === 'aoe') {
      const b = e.box;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      roundPath(ctx, b.x - cam, b.y, b.w, b.h, 6);
      ctx.fill();
    } else if (e.kind === 'fullmap') {
      // Screen flash, then light columns over every mob on the map.
      ctx.globalAlpha = e.t;
      ctx.fillStyle = e.color;
      ctx.fillRect(0, 0, VW, VH);
      ctx.fillStyle = '#ffffff';
      for (const mob of game.mobs) {
        if (!mob.alive) continue;
        ctx.fillRect(mob.x - cam + mob.w / 2 - 2, 0, 4, mob.y);
      }
      ctx.globalAlpha = 1;
    } else if (e.kind === 'levelup') {
      ctx.strokeStyle = '#ffe866';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x - cam + 14, e.y + 24, 14 + (1.2 - e.t) * 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}

function drawFloaters(ctx, game, cam) {
  for (const f of game.floaters) {
    ctx.globalAlpha = Math.min(1, f.t * 2);
    text(ctx, f.text, f.x - cam, f.y, 9, f.color, 'center', 'bold');
  }
  ctx.globalAlpha = 1;
}

// ---------- HUD ----------

function bar(ctx, x, y, w, h, ratio, color, label) {
  ctx.fillStyle = 'rgba(40,30,60,0.7)';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.round(w * Math.max(0, Math.min(1, ratio))), h);
  if (label) text(ctx, label, x + w / 2, y + h - 2, 6, UI.text, 'center', 'bold');
}

function drawHud(ctx, game, width, height) {
  const c = game.character;
  panel(ctx, 8, 8, 176, 50);
  text(ctx, `${game.classDef.name}  Lv ${c.level}  ${game.map.name}`, 14, 19, 8, UI.text, 'left', 'bold');
  bar(ctx, 14, 23, 164, 9, c.hp / c.maxHp, UI.hp, `HP ${Math.ceil(c.hp)}/${c.maxHp}`);
  bar(ctx, 14, 34, 164, 9, c.mp / c.maxMp, UI.mp, `MP ${Math.ceil(c.mp)}/${c.maxMp}`);
  bar(ctx, 14, 45, 164, 3, c.exp / expToNext(c.level), UI.exp);

  const rx = width - 184;
  panel(ctx, rx, 8, 176, 54);
  const equipped = Object.values(game.equipped).filter(Boolean).length;
  text(ctx, `Gold ${c.gold}`, rx + 8, 19, 8);
  text(ctx, `Potions ${game.potions}  (H)`, rx + 8, 29, 8);
  text(ctx, `Gear ${equipped}/5`, rx + 8, 39, 8);
  text(ctx, `Skill pts ${c.skillPoints}`, rx + 8, 49, 8);

  // Skill bar with a cooldown sweep.
  const keys = ['Q', 'E', 'R', 'F'];
  game.classDef.skills.forEach((s, i) => {
    const bx = width / 2 - 90 + i * 46;
    const by = height - 40;
    const locked = c.level < s.unlockLevel;
    const cd = game.cooldowns[s.id] ?? 0;
    panel(ctx, bx, by, 42, 32, 4);
    if (locked) {
      ctx.fillStyle = 'rgba(20,16,30,0.6)';
      ctx.fillRect(bx + 1, by + 1, 40, 30);
    } else if (cd > 0) {
      // Dark sweep that drains as the cooldown runs down, with the seconds left in the middle.
      ctx.fillStyle = 'rgba(10, 8, 20, 0.8)';
      ctx.fillRect(bx + 1, by + 1, 40, 30 * (cd / s.cooldown));
      text(ctx, `${Math.ceil(cd)}s`, bx + 21, by + 20, 9, UI.text, 'center', 'bold');
    }
    text(ctx, keys[i], bx + 5, by + 12, 8, locked ? '#777' : UI.text, 'left', 'bold');
    text(ctx, locked ? `Lv ${s.unlockLevel}` : s.name, bx + 21, by + 27, 6, locked ? '#777' : UI.muted, 'center');
  });

  // Message log: small chips stacked above the skill bar.
  ctx.font = `bold 8px ${FONT}`;
  game.messages.forEach((m, i) => {
    const y = height - 56 - (game.messages.length - 1 - i) * 12;
    ctx.globalAlpha = Math.min(1, m.t);
    panel(ctx, 8, y - 8, ctx.measureText(m.text).width + 12, 11, 3);
    text(ctx, m.text, 14, y, 8);
    ctx.globalAlpha = 1;
  });

  if (game.nearNpc) {
    const hint = {
      skills: 'Press 1/2/3 to spend a skill point',
      upgrade: 'Press U to upgrade your weapon',
      shop: 'Press B to buy a potion (25G)',
      quest: 'Explore the meadow to level up',
    }[game.nearNpc.role];
    const tw = 200;
    panel(ctx, width / 2 - tw / 2, height - 98, tw, 16, 4);
    text(ctx, `${game.nearNpc.name}: ${hint}`, width / 2, height - 87, 7, UI.text, 'center', 'bold');
  }
}

// Inventory overlay: equipped slots on the left, the most recent bag items on the right.
function drawInventory(ctx, game, width, height) {
  const w = 360;
  const h = 260;
  const x = (width - w) / 2;
  const y = (height - h) / 2;
  panel(ctx, x, y, w, h, 8);
  text(ctx, 'Inventory  (I to close)', x + 12, y + 18, 10, UI.text, 'left', 'bold');

  text(ctx, 'Equipped', x + 12, y + 36, 8, UI.muted, 'left', 'bold');
  SLOTS.forEach((slot, i) => {
    const item = game.equipped[slot];
    const ry = y + 48 + i * 24;
    text(ctx, slot, x + 12, ry + 10, 8, UI.muted);
    if (item) {
      const rarity = RARITIES.find((r) => r.id === item.rarity);
      text(ctx, `+${item.upgrade}  ${item.atk} ATK`, x + 80, ry + 10, 8, rarity.color, 'left', 'bold');
    } else {
      text(ctx, 'empty', x + 80, ry + 10, 8, '#8a8298');
    }
  });

  text(ctx, 'Bag', x + 200, y + 36, 8, UI.muted, 'left', 'bold');
  if (game.inventory.length === 0) {
    text(ctx, 'Nothing yet. Defeat monsters to find gear.', x + 200, y + 60, 8, UI.muted);
  }
  game.inventory.slice(-10).reverse().forEach((item, i) => {
    const rarity = RARITIES.find((r) => r.id === item.rarity);
    text(ctx, `${item.slot}  +${item.upgrade}  ${item.atk} ATK`, x + 200, y + 58 + i * 18, 8, rarity.color);
  });

  text(ctx, `Showing ${Math.min(10, game.inventory.length)} of ${game.inventory.length} items`, x + 12, y + h - 12, 7, UI.muted);
}

export function drawGame(ctx, game, width, height) {
  const cam = cameraFor(game, width);
  drawBackdrop(ctx, game.map.theme, cam, width, height, game.time);
  drawPlatforms(ctx, game.map.platforms, cam, width, game.map.theme);
  drawPortals(ctx, game, cam);
  drawNpcs(ctx, game, cam);
  drawMobs(ctx, game, cam);
  drawPlayer(ctx, game, cam);
  drawEffects(ctx, game, cam);
  drawFloaters(ctx, game, cam);
  drawHud(ctx, game, width, height);
  if (game.showInventory) drawInventory(ctx, game, width, height);
}

// ---------- Setup screens ----------

export function drawAppearance(ctx, width, height, appearance, row, time) {
  drawBackdrop(ctx, MENU_THEME, 0, width, height, time);
  text(ctx, 'Make your hero', width / 2, 34, 16, UI.text, 'center', 'bold');
  text(ctx, 'Up / Down: choose    Left / Right: change    Enter: continue', width / 2, 48, 8, UI.muted, 'center');

  // Live preview at 3x on a soft stage.
  const stageX = 80;
  const stageY = 70;
  panel(ctx, stageX, stageY, 170, 220, 8);
  drawCharacterPreview(ctx, appearance, '#ffd66b', time, stageX + (170 - 84) / 2, stageY + (220 - 144) / 2, 3);

  const rowX = 300;
  APPEARANCE_FIELDS.forEach((field, i) => {
    const y = 70 + i * 38;
    const selected = i === row;
    panel(ctx, rowX, y, 300, 30, 4);
    if (selected) {
      ctx.strokeStyle = '#ffd66b';
      ctx.lineWidth = 2;
      roundPath(ctx, rowX, y, 300, 30, 4);
      ctx.stroke();
    }
    text(ctx, field.label, rowX + 12, y + 19, 9, UI.muted, 'left', 'bold');
    const value = appearance[field.key];
    if (COLOR_FIELDS.includes(field.key)) {
      ctx.beginPath();
      ctx.arc(rowX + 240, y + 15, 6, 0, Math.PI * 2);
      ctx.fillStyle = value;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      text(ctx, value, rowX + 240, y + 19, 9, UI.text, 'center', 'bold');
    }
  });

  text(ctx, 'Press Enter to choose your class', width / 2, height - 20, 10, UI.text, 'center', 'bold');
}

export function drawSelect(ctx, width, height, time) {
  drawBackdrop(ctx, MENU_THEME, 0, width, height, time);
  text(ctx, 'Choose your class', width / 2, 62, 16, UI.text, 'center', 'bold');
  text(ctx, 'Press 1, 2, or 3', width / 2, 76, 8, UI.muted, 'center');

  const ids = Object.keys(CLASSES);
  const boxW = 170;
  const gap = 20;
  const startX = width / 2 - (ids.length * boxW + (ids.length - 1) * gap) / 2;
  ids.forEach((id, i) => {
    const c = CLASSES[id];
    const x = startX + i * (boxW + gap);
    const y = 96;
    panel(ctx, x, y, boxW, 200, 8);
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(x + boxW / 2, y + 50, 14, 0, Math.PI * 2);
    ctx.fill();
    text(ctx, `${i + 1}. ${c.name}`, x + boxW / 2, y + 92, 11, UI.text, 'center', 'bold');
    text(ctx, `HP ${c.baseStats.maxHp}  MP ${c.baseStats.maxMp}  ATK ${c.baseStats.atk}`, x + boxW / 2, y + 110, 7, UI.muted, 'center');
    c.skills.forEach((s, j) => {
      text(ctx, `${s.name} (Lv ${s.unlockLevel})`, x + boxW / 2, y + 134 + j * 18, 8, UI.text, 'center');
    });
  });
}
