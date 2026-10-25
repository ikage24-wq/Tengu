// Game state and update step. Wires together progression, combat, gear, mobs, and world.
// Rendering lives in render.js; this file never touches the canvas.

import { CLASSES } from './classes.js';
import { createCharacter, gainExp, gainGold } from './progression.js';
import { cast, createCooldowns, tickCooldowns, rectsOverlap } from './combat.js';
import { createMob, updateMob, damageMob, rollDeathRewards, MOB_TYPES } from './mobs.js';
import { tryUpgrade, upgradeCost, SLOTS } from './gear.js';
import { getMap } from './world.js';

export const FLOOR_Y = 300;
const GRAVITY = 1800;
const MOVE_SPEED = 260;
const JUMP_VELOCITY = -620;
const MOB_RESPAWN = 10;
const POTION_COST = 25;
const POTION_HEAL = 0.5;
const SKILL_LEVEL_CAP = 10;
const SKILL_DAMAGE_PER_LEVEL = 0.15;
const INTERACT_RANGE = 90;
const DROP_TIME = 0.25;

export function createGame(classId, appearance) {
  const classDef = CLASSES[classId];
  const character = createCharacter(classDef);
  const game = {
    classDef,
    appearance,
    character,
    skillLevels: {},
    equipped: {},
    inventory: [],
    potions: 0,
    cooldowns: createCooldowns(),
    player: {
      x: 200,
      y: FLOOR_Y - 48,
      w: 28,
      h: 48,
      vx: 0,
      vy: 0,
      onGround: false,
      onPlatform: false,
      dropTimer: 0,
      dir: 1,
      invuln: 0,
    },
    mapId: 'town',
    map: null,
    mobs: [],
    floaters: [],
    effects: [],
    messages: [],
    nearNpc: null,
    time: 0,
    showInventory: false,
  };
  loadMap(game, 'town', null);
  message(game, `Welcome, ${classDef.name}. Q/E/R to cast skills.`);
  return game;
}

export function message(game, text) {
  game.messages.push({ text, t: 5 });
  if (game.messages.length > 5) game.messages.shift();
}

// Floor groups spread across the map. Platform groups share out their mobs across the listed ledges
// and keep each patrol inside its ledge.
function spawnMobs(map, level) {
  const mobs = [];
  for (const group of map.spawns) {
    if (group.minLevel > level) continue;
    const t = MOB_TYPES[group.type];
    for (let i = 0; i < group.count; i++) {
      let mob;
      if (group.platforms) {
        const slots = group.platforms.length;
        const pl = map.platforms[group.platforms[i % slots]];
        const perLedge = Math.ceil(group.count / slots);
        const slot = Math.floor(i / slots);
        const homeX = pl.x + (pl.w * (slot + 0.5)) / perLedge - t.w / 2;
        const room = Math.min(homeX - pl.x, pl.x + pl.w - (homeX + t.w));
        mob = createMob(group.type, homeX, pl.y - t.h, Math.max(0, Math.min(room, 40)));
      } else {
        const span = map.width - 600;
        const x = 300 + ((i + 0.5) * span) / group.count;
        mob = createMob(group.type, x, FLOOR_Y - t.h);
      }
      mob.respawnIn = 0;
      mobs.push(mob);
    }
  }
  return mobs;
}

export function loadMap(game, mapId, fromMapId) {
  const map = getMap(mapId);
  game.mapId = mapId;
  game.map = map;
  game.mobs = spawnMobs(map, game.character.level);
  game.floaters = [];
  game.effects = [];
  // Arrive next to the portal that leads back to where we came from.
  const back = fromMapId && map.portals.find((p) => p.to === fromMapId);
  const p = game.player;
  if (back) {
    p.x = back.x < map.width / 2 ? back.x + 100 : back.x - 100 - p.w;
  } else {
    p.x = 200;
  }
  p.y = FLOOR_Y - p.h;
  p.vy = 0;
  p.onGround = true;
  p.onPlatform = false;
}

// Effective skill: damage scales with the skill's own level.
function effectiveSkill(game, skill) {
  const lvl = game.skillLevels[skill.id] ?? 1;
  return { ...skill, damageMult: skill.damageMult * (1 + SKILL_DAMAGE_PER_LEVEL * (lvl - 1)) };
}

export function gearAtk(game) {
  return SLOTS.reduce((sum, slot) => sum + (game.equipped[slot]?.atk ?? 0), 0);
}

function addGear(game, item) {
  game.inventory.push(item);
  const current = game.equipped[item.slot];
  if (!current || item.atk > current.atk) {
    game.equipped[item.slot] = item;
    message(game, `Equipped ${item.slot} (+${item.atk} ATK).`);
  } else {
    message(game, `Found ${item.slot} (+${item.atk} ATK).`);
  }
}

function giveExp(game, amount) {
  const levels = gainExp(game.character, amount, game.classDef);
  if (levels > 0) {
    message(game, `Level up! Now level ${game.character.level}.`);
    game.effects.push({ kind: 'levelup', t: 1.2, x: game.player.x, y: game.player.y });
  }
}

function onPlayerDeath(game) {
  message(game, 'You died. Returning to town...');
  game.character.hp = Math.floor(game.character.maxHp / 2);
  game.character.mp = game.character.maxMp;
  loadMap(game, 'town', null);
}

function floater(game, x, y, text, color) {
  game.floaters.push({ x, y, text, color, t: 0.8 });
}

function killMob(game, mob) {
  mob.respawnIn = MOB_RESPAWN;
  const rewards = rollDeathRewards(mob, Math.random, game.character.level);
  giveExp(game, rewards.exp);
  gainGold(game.character, rewards.gold);
  floater(game, mob.x, mob.y - 10, `+${rewards.gold}G`, '#ffd34d');
  if (rewards.gear) addGear(game, rewards.gear);
}

function updateMobs(game, dt) {
  const p = game.player;
  for (const mob of game.mobs) {
    if (!mob.alive) {
      mob.respawnIn -= dt;
      if (mob.respawnIn <= 0) {
        mob.alive = true;
        mob.hp = mob.maxHp;
        mob.x = mob.homeX;
      }
      continue;
    }
    updateMob(mob, dt);
    if (mob.hitCooldown <= 0 && rectsOverlap(p, mob) && p.invuln <= 0) {
      const dmg = Math.max(1, MOB_TYPES[mob.typeId].atk - Math.floor(game.character.level / 4));
      game.character.hp -= dmg;
      mob.hitCooldown = 1;
      p.invuln = 0.8;
      floater(game, p.x, p.y - 4, `-${dmg}`, '#ff6b6b');
    }
  }
}

function updateNpcs(game) {
  const p = game.player;
  game.nearNpc = game.map.npcs.find((n) => Math.abs(n.x - (p.x + p.w / 2)) < INTERACT_RANGE) ?? null;
}

function handleInteractions(game, input) {
  const npc = game.nearNpc;
  if (!npc) return;
  const c = game.character;
  if (npc.role === 'skills') {
    for (const [key, idx] of [['Digit1', 0], ['Digit2', 1], ['Digit3', 2]]) {
      if (!input.pressed.has(key)) continue;
      const skill = game.classDef.skills[idx];
      if (!skill || c.level < skill.unlockLevel) { message(game, 'That skill is locked.'); continue; }
      const lvl = game.skillLevels[skill.id] ?? 1;
      if (c.skillPoints <= 0) { message(game, 'No skill points.'); continue; }
      if (lvl >= SKILL_LEVEL_CAP) { message(game, `${skill.name} is maxed.`); continue; }
      c.skillPoints -= 1;
      game.skillLevels[skill.id] = lvl + 1;
      message(game, `${skill.name} is now level ${lvl + 1}.`);
    }
  }
  if (npc.role === 'upgrade' && input.pressed.has('KeyU')) {
    const item = game.equipped.weapon;
    if (!item) { message(game, 'Equip a weapon first.'); return; }
    if (item.upgrade >= 15) { message(game, 'Weapon is at max upgrade.'); return; }
    const cost = upgradeCost(item.upgrade, item.itemLevel);
    if (c.gold < cost) { message(game, `Need ${cost}G to upgrade.`); return; }
    c.gold -= cost;
    const r = tryUpgrade(item);
    message(game, r.ok ? `Upgrade success! +${item.upgrade}` : 'Upgrade failed. Gold lost.');
  }
  if (npc.role === 'shop' && input.pressed.has('KeyB')) {
    if (c.gold < POTION_COST) { message(game, 'Not enough gold for a potion.'); return; }
    c.gold -= POTION_COST;
    game.potions += 1;
    message(game, `Bought a potion (${game.potions} owned).`);
  }
}

// Gravity and landing. Ledges are one-way: you land on them only when falling onto their top.
function movePhysics(game, dt) {
  const p = game.player;
  const prevBottom = p.y + p.h;
  p.vy += GRAVITY * dt;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  p.x = Math.max(0, Math.min(game.map.width - p.w, p.x));
  p.onGround = false;
  p.onPlatform = false;
  if (p.vy < 0) return;

  if (p.y + p.h >= FLOOR_Y) {
    p.y = FLOOR_Y - p.h;
    p.vy = 0;
    p.onGround = true;
    return;
  }
  if (p.dropTimer > 0) return;
  for (const pl of game.map.platforms) {
    const overlapX = p.x + p.w > pl.x && p.x < pl.x + pl.w;
    if (overlapX && prevBottom <= pl.y + 1 && p.y + p.h >= pl.y) {
      p.y = pl.y - p.h;
      p.vy = 0;
      p.onGround = true;
      p.onPlatform = true;
      return;
    }
  }
}

// Main update step. `input` = { held: Set, pressed: Set } of key codes.
export function update(game, dt, input) {
  game.time += dt;
  const p = game.player;
  const c = game.character;

  const left = input.held.has('ArrowLeft') || input.held.has('KeyA');
  const right = input.held.has('ArrowRight') || input.held.has('KeyD');
  p.vx = (right - left) * MOVE_SPEED;
  if (p.vx !== 0) p.dir = Math.sign(p.vx);

  const jumpKey = input.held.has('Space') || input.held.has('ArrowUp') || input.held.has('KeyW');
  if (jumpKey && p.onGround) {
    p.vy = JUMP_VELOCITY;
    p.onGround = false;
  }
  // Holding Down while standing on a ledge drops through it.
  const down = input.held.has('ArrowDown') || input.held.has('KeyS');
  if (down && p.onPlatform && !jumpKey) {
    p.dropTimer = DROP_TIME;
    p.onPlatform = false;
    p.y += 2;
  }
  p.dropTimer = Math.max(0, p.dropTimer - dt);
  movePhysics(game, dt);
  p.invuln = Math.max(0, p.invuln - dt);

  // Skills: Q / E / R map to the class's skill slots 0..2.
  const slotKeys = ['KeyQ', 'KeyE', 'KeyR', 'KeyF'];
  slotKeys.forEach((key, idx) => {
    if (!input.pressed.has(key)) return;
    const skill = game.classDef.skills[idx];
    if (!skill) return;
    const result = cast(c, effectiveSkill(game, skill), game.cooldowns, p, game.mobs, damageMobWithFloater(game), gearAtk(game));
    if (result.ok) {
      if (skill.fullMap) game.effects.push({ kind: 'fullmap', t: 0.7, color: game.classDef.color });
      else game.effects.push({ kind: 'aoe', box: result.box, t: 0.2 });
      for (const hit of result.hits) if (hit.killed) killMob(game, hit.mob);
    } else if (result.reason === 'no-mp') {
      message(game, 'Not enough MP.');
    }
    // Locked and cooling-down keys stay silent; the skill bar already shows both.
  });
  tickCooldowns(game.cooldowns, dt);

  if (input.pressed.has('KeyH')) {
    if (game.potions <= 0) message(game, 'No potions.');
    else {
      game.potions -= 1;
      c.hp = Math.min(c.maxHp, c.hp + Math.floor(c.maxHp * POTION_HEAL));
    }
  }

  if (input.pressed.has('KeyI')) game.showInventory = !game.showInventory;

  updateMobs(game, dt);
  updateNpcs(game);
  handleInteractions(game, input);

  for (const portal of game.map.portals) {
    if (rectsOverlap(p, { x: portal.x, y: FLOOR_Y - 120, w: 40, h: 120 })) {
      loadMap(game, portal.to, game.mapId);
      message(game, `Entered ${getMap(portal.to).name}.`);
      break;
    }
  }

  if (c.hp <= 0) onPlayerDeath(game);
  c.hp = Math.min(c.hp, c.maxHp);
  c.mp = Math.min(c.mp + 4 * dt, c.maxMp);

  for (const f of game.floaters) {
    f.t -= dt;
    f.y -= 30 * dt;
  }
  game.floaters = game.floaters.filter((f) => f.t > 0);
  for (const e of game.effects) e.t -= dt;
  game.effects = game.effects.filter((e) => e.t > 0);
  for (const m of game.messages) m.t -= dt;
  game.messages = game.messages.filter((m) => m.t > 0);
}

// Wraps damageMob so every hit shows a floating number.
function damageMobWithFloater(game) {
  return (mob, dmg, crit) => {
    floater(game, mob.x + mob.w / 2, mob.y - 6, crit ? `${dmg}!` : `${dmg}`, crit ? '#ffd34d' : '#ffffff');
    return damageMob(mob, dmg);
  };
}

export function cameraFor(game, canvasWidth) {
  const target = game.player.x + game.player.w / 2 - canvasWidth / 2;
  return Math.max(0, Math.min(game.map.width - canvasWidth, target));
}
