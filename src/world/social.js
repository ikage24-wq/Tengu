// Shops, luck, groups and standing among the other players.
//
//   - Lucky drops: a rare piece dropping by other players gets a reaction ("how?? i farmed for 3
//     hours").
//   - Dungeon groups: players shout for the role their group is missing ("LF healer for Rootwood
//     Hollow"). When it's yours, right-click them (Join their group) and they take you in.

import { ITEMS, RARITIES } from '../data/items.js';
import { DUNGEONS, roleOf, ROLES } from '../data/dungeons.js';
import { JOBS } from '../data/jobs.js';
import { itemName } from '../core/items.js';
import { joinParty, partyMembers } from './party.js';
import { startRun } from './dungeon.js';
import { botChat } from './chatlog.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);

// (What drives the moment: an announcement, a vow, a winner. It skips chat's wait.)
function shout(world, bot, line) {
  botChat(world, bot, line, { important: true });
}

// ---------- Lucky drops ----------

// You picked up something rare: the players around react, and someone may want to buy it.
export function luckyDrop(bots, world, inst) {
  const tier = inst?.rarity ?? 0;
  const def = ITEMS[inst?.id];
  if (!def || (tier < 2 && !def.unique)) return;
  const rng = bots.rng;
  const near = bots.list.filter((b) => !b.gone && !b.party && (b.body ? b.map === world.map.id && Math.abs(b.body.x - world.body.x) < 600 : b.map === world.map.id));
  const label = `${RARITIES[tier]?.name ?? ''} ${itemName(inst)}`.trim();
  near.slice(0, 3).forEach((b, i) => {
    b.sayAt = world.now + 0.8 + i * 1.2;
    b.sayLine = pick([`omg gz ${world.char.name}!!`, 'how?? i farmed for 3 hours', 'lucky!!', `a ${RARITIES[tier]?.name.toLowerCase() ?? 'rare'}??`, 'drop rate on u is crazy', 'not fair lol', 'gzzz'], rng);
    b.sayShout = true;
  });
}

// ---------- Dungeon groups ----------

const LFG = (role, dungeon) => [`LF ${role} for ${dungeon}!!`, `need a ${role} for ${dungeon}, anyone?`, `${dungeon} group lf1m ${role}`, `any ${role}s? ${dungeon} run`];

function lookingForGroup(M, bots, world) {
  const rng = bots.rng;
  const mine = roleOf(world.char.job, JOBS[world.char.job].family);
  const def = DUNGEONS.hollow;
  if (!mine || world.char.level < def.minLevel || world.dungeon || partyMembers(bots).length) return;
  // Someone whose group is missing exactly what you are.
  const bot = pick(bots.list.filter((b) => !b.party && !b.hunter && !b.gone && !b.shop && b.map === world.map.id && b.level >= def.minLevel && roleOf(b.char.job, JOBS[b.char.job].family) && roleOf(b.char.job, JOBS[b.char.job].family) !== mine), rng);
  if (!bot) return;
  bot.lfg = { dungeon: def.id, role: mine, until: world.now + 90 };
  shout(world, bot, pick(LFG(ROLES[mine].label.toLowerCase(), def.name), rng));
  world.log?.(`(You're a ${ROLES[mine].label}: right-click ${bot.name} to join their group.)`, '#bff0dc');
}

// You answer: they take you into their group, and off you all go.
export function joinGroup(bots, world, bot) {
  if (!bot.lfg) return null;
  // (Their group has its other seats: you come alone, not with a party of your own.)
  if (partyMembers(bots).length || world.dungeon) {
    const why = world.dungeon ? "You're already in a dungeon." : 'Leave your party first: their group only has room for you.';
    world.log(why, '#ffb3c6');
    return why;
  }
  const id = bot.lfg.dungeon;
  bot.lfg = null;
  joinParty(bots, bot, world);
  bot.bubble = { text: pick(['yay a healer!! jk welcome', 'perfect, lets go', 'ty for joining!', 'group full, gogogo'], bots.rng), t: 4 };
  const why = startRun(world, id);
  if (why) {
    world.log(why, '#ffb3c6');
    return why;
  }
  world.log(`${bot.name}'s group takes you into ${DUNGEONS[id].name}!`, '#ffe36b');
  return null;
}

// ---------- Each frame ----------

export function updateSocial(bots, world, dt) {
  const rng = bots.rng;
  const M = (bots.social ??= { lfgIn: 200 });
  const tick = (key, lo, hi, fn) => {
    M[key] -= dt;
    if (M[key] > 0) return;
    M[key] = between(lo, hi, rng);
    fn();
  };
  tick('lfgIn', 240, 480, () => !world.dungeon && lookingForGroup(M, bots, world));
  for (const b of bots.list) if (b.lfg && world.now > b.lfg.until) b.lfg = null;
}
