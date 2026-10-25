// The hidden Game Master: unlocked with a secret passphrase typed in chat (/gm <passphrase>).
// Only the passphrase's SHA-256 fingerprint lives here, so reading the code doesn't give it away.
// Once unlocked, the character (and this browser) can switch to any job, give items, set levels,
// teleport, spawn or clear monsters, and toggle god mode, from chat commands or the admin menu.

import { ITEMS } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { SKILLS } from '../data/skills.js';
import { MAX_LEVEL } from '../core/exp.js';
import { addItem } from '../core/inventory.js';
import { clampVitals, stats as statsOf, bindFreeHotkey } from '../core/character.js';
import { loadMap } from './world.js';
import { spawnMob } from './mobs.js';

const GM_HASH = '01a1ea974eb6725f52e6b8b8fe2c3261eaab572040dece2a859559cf8b3f6039';
const STORE_KEY = 'twzt-gm';

async function sha256(text) {
  const bytes = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function remembered() {
  try {
    return localStorage.getItem(STORE_KEY) === '1';
  } catch {
    return false;
  }
}

export function isGm(char) {
  return Boolean(char.gm) || remembered();
}

// Checks the passphrase; on success the character and this browser are unlocked.
export async function unlockGm(char, pass) {
  // Case and spaces don't matter, so it's easy to type.
  if ((await sha256(pass.trim().toLowerCase().replace(/\s+/g, ''))) !== GM_HASH) return false;
  char.gm = true;
  try {
    localStorage.setItem(STORE_KEY, '1');
  } catch {
    // Private windows can't store it; the character still remembers.
  }
  return true;
}

function refill(char) {
  const s = statsOf(char);
  char.hp = s.maxHp;
  char.mp = s.maxMp;
}

// Switches straight to any job, including the Game Master. GMs get their skills at once.
export function setJob(char, jobId) {
  if (!JOBS[jobId]) return false;
  char.job = jobId;
  if (jobId === 'gamemaster') {
    for (const s of Object.values(SKILLS).filter((k) => k.job === 'gamemaster')) {
      if (!char.skills[s.id]) {
        char.skills[s.id] = 1;
        if (s.type !== 'passive') bindFreeHotkey(char, { skill: s.id });
      }
    }
    char.baseHp = Math.max(char.baseHp, 50000);
    char.baseMp = Math.max(char.baseMp, 50000);
  }
  clampVitals(char);
  refill(char);
  return true;
}

export function giveItem(char, id, qty = 1) {
  if (!ITEMS[id]) return false;
  return addItem(char.inventory, id, Math.max(1, Math.min(999, qty)));
}

export function setLevel(char, level) {
  char.level = Math.max(1, Math.min(MAX_LEVEL, Math.round(level)));
  char.exp = 0;
  clampVitals(char);
  refill(char);
}

export function teleport(world, mapId) {
  if (!MAPS[mapId]) return false;
  loadMap(world, mapId, 'start');
  return true;
}

export function spawn(world, mobId, count = 1) {
  if (!MOBS[mobId]) return false;
  for (let i = 0; i < Math.max(1, Math.min(20, count)); i++) {
    const m = spawnMob(world.map, { mob: mobId, x: world.body.x + world.body.facing * (60 + i * 30), y: world.map.groundY });
    world.mobs.push(m);
  }
  return true;
}

export function killAll(world) {
  for (const m of world.mobs) m.hp = 0;
}

// Chat commands. Returns a line for the log, or null when `cmd` isn't a GM command.
export function gmCommand(world, cmd, args) {
  const char = world.char;
  const n = (i, d) => (Number.isFinite(Number(args[i])) ? Number(args[i]) : d);
  switch (cmd) {
    case 'gmhelp':
      return '/admin (F9) · /job <id> · /level <n> · /give <item> [qty] · /gold <n> · /sp <n> · /ap <n> · /tp <map> · /spawn <mob> [n] · /killall · /heal · /god';
    case 'admin':
      world.events.push({ type: 'admin' });
      return 'Admin menu opened.';
    case 'job':
      return setJob(char, args[0]) ? `You are now a ${JOBS[args[0]].name}.` : `Jobs: ${Object.keys(JOBS).join(', ')}`;
    case 'level':
      setLevel(char, n(0, char.level));
      return `Level set to ${char.level}.`;
    case 'give': {
      const id = args[0];
      if (!giveItem(char, id, n(1, 1))) return ITEMS[id] ? 'Your bag is full.' : `No item "${id}". Try the admin menu (F9).`;
      return `Gave ${n(1, 1)} x ${ITEMS[id].name}.`;
    }
    case 'gold':
      char.gold = Math.max(0, char.gold + n(0, 100000));
      return `Gold: ${char.gold.toLocaleString()}.`;
    case 'sp':
      char.sp += n(0, 10);
      return `SP: ${char.sp}.`;
    case 'ap':
      char.ap += n(0, 50);
      return `AP: ${char.ap}.`;
    case 'tp':
      return teleport(world, args[0]) ? `Teleported to ${MAPS[args[0]].name}.` : `Maps: ${Object.keys(MAPS).join(', ')}`;
    case 'spawn':
      return spawn(world, args[0], n(1, 1)) ? `Spawned ${MOBS[args[0]].name}.` : `Monsters: ${Object.keys(MOBS).join(', ')}`;
    case 'killall':
      killAll(world);
      return 'Cleared every monster.';
    case 'heal':
      refill(char);
      return 'Fully healed.';
    case 'god':
      world.god = !world.god;
      return `God mode ${world.god ? 'on' : 'off'}.`;
    default:
      return null;
  }
}
