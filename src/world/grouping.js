// Easy grouping: party pings, asking to join someone's party, party chat and quick emotes, and
// sharing quest progress with the party. Works the same with friends online (net/together.js
// carries it) and with the players you party with here (world/party.js): what they see, they
// act on, and what they say goes through the chat gate (world/chatlog.js).
//
// Pings: V (or the flag button on a phone) drops a marker that your party sees on the screen and
// the minimap for a few seconds. It picks itself: "Attack this!" on the monster you face, "Help!"
// when you're low or swarmed, "Here!" otherwise. Members act on it: they focus that monster, run
// over to help, or come to you.

import { partyMembers, joinParty, LEVEL_GAP, PARTY_MAX } from './party.js';
import { botChat } from './chatlog.js';
import { voiced } from './chatter.js';
import { QUESTS } from '../data/quests.js';
import { MAPS } from '../data/maps.js';
import { JOBS } from '../data/jobs.js';
import { ITEMS } from '../data/items.js';
import { countItem, addItem } from '../core/inventory.js';
import { partyFriends, warpTo, setGroupHandler } from '../net/together.js';

export const PINGS = {
  here: { label: 'Here!', color: '#5fb8ff', dark: '#2f78c0' },
  attack: { label: 'Attack this!', color: '#ff6b8a', dark: '#c23d5e' },
  help: { label: 'Help!', color: '#ffb347', dark: '#c97412' },
};
export const PING_LIFE = 6;
// One of your own pings at a time, and a beat between them, so the party isn't flooded.
export const PING_GAP = 1.2;
const PARTY_COLOR = '#9fe0b0';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const rngOf = (world) => world.bots?.rng ?? Math.random;
const here = (world) => partyMembers(world.bots).filter((b) => b.map === world.map.id && b.body && !b.down && !b.away);
const mapName = (id) => MAPS[id]?.name ?? 'here';

// Whether you have anyone to ping or talk to: players with you, or friends online.
export function hasParty(world, friends = world.dungeon ? [] : partyFriends()) {
  return partyMembers(world.bots).length > 0 || friends.length > 0;
}

// The ping that fits right now: help when you're low or swarmed, the monster you face, or here.
export function pingFor(world) {
  const b = world.body;
  const live = world.mobs.filter((m) => m.hp > 0 && !m.dying);
  const close = live.filter((m) => Math.abs(m.x - b.x) < 110 && Math.abs(m.y - b.y) < 70);
  if (world.char.hp < world.stats.maxHp * 0.35 || close.length >= 3) return { kind: 'help' };
  let mob = null;
  let best = Infinity;
  for (const m of live) {
    const dx = (m.x - b.x) * b.facing;
    const dy = Math.abs(m.y - b.y);
    if (dx < -20 || dx > 240 || dy > 90) continue;
    const score = Math.abs(dx) + dy * 2 - (m.def.boss ? 200 : 0);
    if (score < best) {
      best = score;
      mob = m;
    }
  }
  return mob ? { kind: 'attack', mob } : { kind: 'here' };
}

// Drops a ping. Yours (no `from`) is shared with friends online and heard by the party here.
// Returns the ping, or null while the last one is still too fresh.
export function dropPing(world, kind, { mob = null, x, y, from = null, name = null, map = world.map.id } = {}) {
  const mine = !from;
  world.pings ??= [];
  if (mine && world.now - (world.pingAt ?? -99) < PING_GAP) return null;
  const b = world.body;
  const p = { kind, mob, x: x ?? mob?.x ?? b.x, y: y ?? mob?.y ?? b.y, from: from ?? 'you', name: name ?? world.char.name, map, at: world.now, until: world.now + PING_LIFE };
  world.pings = world.pings.filter((q) => q.from !== p.from);
  world.pings.push(p);
  if (!mine) return p;
  world.pingAt = world.now;
  world.net?.ping?.(world, p);
  if (hasParty(world)) world.log(`[Party] ${world.char.name}: ${PINGS[kind].label}${mob ? ` (${mob.def.name})` : ''}`, PINGS[kind].color);
  else world.log('Pinged! (Party members see your pings.)', '#d4cbe8');
  heardPing(world, p);
  return p;
}

export function smartPing(world) {
  if (world.dead) return null;
  const { kind, mob } = pingFor(world);
  return dropPing(world, kind, { mob });
}

// Where a member is from the ping, in words: how they're getting there.
function wayTo(bot, p) {
  const dy = bot.body.y - p.y;
  const dx = Math.abs(bot.body.x - p.x);
  if (dx < 70 && Math.abs(dy) < 40) return null;
  if (dy < -50) return 'dropping down';
  if (dy > 50) return 'climbing up';
  return dx > 300 ? 'running over from across the map' : 'running over';
}

const LINES = {
  attack: ['on the {mob}!', '{mob}? got it', 'focusing ur {mob}', 'switching to the {mob}', 'ok {mob} first', '{mob} is going down', 'saw the ping, {mob} it is', 'target {mob}, on it', 'helping on the {mob}'],
  help: ['hang on {player}, {way}!', 'coming!! {way}', 'hold on, {way}', 'pop a pot, im {way}', 'omw {player}, {way}', 'dont die!! {way}', 'i got u, {way}'],
  helpNear: ['right here, i got u!', 'im on them, pot up', 'behind u, keep swinging', 'covering u {player}!'],
  here: ['omw, {way}', 'ok coming, {way}', 'see ur ping, {way}', 'be right there, {way}', 'on my way, {way}'],
  hereNear: ['already here :)', 'right next to u!', 'here!', 'with u'],
};

function line(kind, bot, p, world, rng) {
  const way = bot.body ? wayTo(bot, p) : null;
  const key = way || kind === 'attack' ? kind : `${kind}Near`;
  const fill = (t) => t.replace('{mob}', p.mob?.def.name ?? 'that one').replace('{player}', world.char.name).replace('{way}', way ?? '');
  return LINES[key].map(fill).sort(() => rng() - 0.5);
}

// The party here acts on a ping: all of them, though only one or two say so.
export function heardPing(world, p) {
  const rng = rngOf(world);
  const members = here(world);
  if (!members.length || p.map !== world.map.id) return [];
  // (A friend's "Here!" or "Help!" is for them to answer: your party takes their monster calls.)
  if (p.from !== 'you' && p.kind !== 'attack') return [];
  for (const bot of members) {
    const br = (bot.brain ??= { think: 0, goal: null, target: null });
    if (p.kind === 'attack' && p.mob && p.mob.hp > 0) {
      bot.helping = null;
      br.skip = null;
      br.target = p.mob;
      br.goal = null;
      br.path = null;
      br.think = Math.min(br.think ?? 0, 0.15);
      bot.pingFocus = { mob: p.mob, until: p.until };
    } else {
      bot.helping = world.now + (p.kind === 'help' ? 14 : 9);
      bot.pingSpot = p.kind === 'here' ? { x: p.x, y: p.y, until: bot.helping } : null;
      br.target = null;
      br.goal = null;
      br.path = null;
      br.think = Math.min(br.think ?? 0, 0.15);
    }
  }
  // The nearest one or two answer, a moment later.
  const talkers = [...members].sort((a, c) => Math.abs(a.body.x - p.x) - Math.abs(c.body.x - p.x)).slice(0, rng() < 0.35 ? 2 : 1);
  talkers.forEach((bot, i) => queueSay(world, bot, line(p.kind, bot, p, world, rng), 0.4 + i * 0.7 + rng() * 0.5));
  return members;
}

// ---------- Party chat and quick emotes ----------

function queueSay(world, bot, options, delay) {
  (world.groupSay ??= []).push({ bot, options, at: world.now + delay });
}

function sayNow(world, bot, options, { prefix = '[Party] ', color = PARTY_COLOR } = {}) {
  const style = { ...(bot.style ?? {}), typos: false, shout: false };
  for (const o of options) {
    if (!o) continue;
    const text = voiced(o, {}, style, rngOf(world));
    if (botChat(world, bot, text, { prefix, color, important: true })) return text;
  }
  return null;
}

// What a party member says back to an emote meant for the party, about what's real for them.
function emoteLines(id, bot, world) {
  const job = JOBS[bot.char?.job]?.name?.toLowerCase();
  const map = mapName(world.map.id);
  const mob = world.mobs.find((m) => m.hp > 0)?.def.name;
  const lv = bot.char?.level ?? bot.level;
  return {
    cheer: ['yaaay!!', `${map} is going great`, mob ? `${mob}s dont stand a chance` : 'we make a good team', 'woo! go team', `lv${lv} me approves`],
    dance: ['dance break!!', `dancing in ${map} lol`, 'ok one dance then back to it', mob ? `the ${mob}s are watching us dance` : 'we look so silly rn'],
    flip: ['show off :P', 'ok ok i saw that', 'teach me that flip', `cant do that as a ${job ?? 'novice'} sadly`],
    love: ['<3', 'aww <3', 'best party', `glad i came to ${map} with u`],
    pray: ['np!', 'anytime!', 'no problem :)', job ? `thats what a ${job} is for` : 'happy to help'],
    flex: ['ok strongest one', 'flex harder lol', `my lv${lv} arms are tired`, 'show the gear!'],
    sleepy: ['need a break? we can rest in town', 'same, one more round?', `${map} has been a long grind huh`, 'zzz... wait no, monsters'],
    sad: ['aw whats wrong?', 'hey its ok!', 'want to go somewhere else?', `we can leave ${map} if its rough`],
  }[id] ?? [];
}

// You played an emote for the party (the quick bar): it shows over your head, friends online see
// it, and a party member here may answer in character.
export function partyEmote(world, e) {
  if (world.dead || world.fishing) return false;
  if (world.now - (world.partyEmoteAt ?? -99) < 1.5) return false;
  world.partyEmoteAt = world.now;
  world.emote = { face: e.face, t: 3 };
  if (e.pose && world.body.onGround && !world.pose && !(world.attackTimer > 0)) world.pose = { kind: e.pose, t: e.dur, dur: e.dur, since: world.now };
  world.net?.partyEmote?.(world, e.id, e.label);
  if (hasParty(world)) world.log(`[Party] ${world.char.name} · ${e.label}`, PARTY_COLOR);
  const rng = rngOf(world);
  const members = here(world);
  if (members.length && rng() < 0.75) {
    const bot = pick(members, rng);
    queueSay(world, bot, emoteLines(e.id, bot, world).sort(() => rng() - 0.5), 0.6 + rng() * 0.8);
    if (['cheer', 'dance', 'love'].includes(e.id) && bot.body && !bot.attack) bot.attack = { pose: e.id === 'dance' ? 'emdance' : 'cheer', t: 0, dur: 1 };
  }
  return true;
}

const ASKS = [
  [/\b(ready|go+|lets go|gogo)\b/i, ['ready!', 'lets gooo', 'go go', 'right behind u']],
  [/\b(wait|brb|sec|hold on)\b/i, ['ok waiting', 'np, ill keep hunting', 'take ur time']],
  [/\b(ty|thanks|thank you|thx)\b/i, ['np!', 'anytime :)', 'of course']],
  [/\b(gg|nice|good job|gj)\b/i, ['gg!', 'we did good', 'nice one']],
  [/\b(where|which way|lost)\b/i, ['im right by u on {map}', 'still on {map}', 'check the minimap, im the colored dot']],
  [/\b(heal|pots?|potion|hp)\b/i, ['pot up!', 'got pots? i have a few', 'ill cover u']],
];

// You said something in party chat: it goes to the party only (friends online in your party
// get it too), and someone here answers when it's something to answer.
export function partySay(world, words) {
  if (!hasParty(world)) {
    world.log("You're not in a party. (Tab switches back to everyone.)", '#ffb3c6');
    return false;
  }
  world.log(`[Party] ${world.char.name}: ${words}`, PARTY_COLOR);
  (world.bubbles ??= {}).player = { text: words, t: 4.5 };
  world.net?.partyChat?.(world, words);
  const rng = rngOf(world);
  const members = here(world);
  const named = members.find((b) => words.toLowerCase().includes(b.name.toLowerCase()));
  const hit = ASKS.find(([re]) => re.test(words));
  if (members.length && (hit || named)) {
    const bot = named ?? pick(members, rng);
    const opts = (hit ? hit[1] : ['yes?', 'hm?', 'whats up', 'here!']).map((t) => t.replace('{map}', mapName(world.map.id)));
    queueSay(world, bot, opts.sort(() => rng() - 0.5), 0.7 + rng());
  }
  return true;
}

// ---------- Asking to join a party ----------

// Why you can't ask player `bot` to join their party now, or null.
export function joinBlocker(world, bot) {
  if (!bot) return 'Not here';
  if (bot.party) return 'Already in your party';
  if (world.dungeon) return 'Busy in a dungeon';
  if (bot.joinAsk) return 'Waiting for an answer';
  if (['leave', 'logout', 'transit'].includes(bot.state) || bot.gone) return 'They are leaving';
  if (!bot.lfg && partyMembers(world.bots).length) return 'Leave your party first';
  return null;
}

// Asks: they think it over a moment, then answer in their own words (see updateGrouping).
export function askToJoin(world, bot) {
  const why = joinBlocker(world, bot);
  if (why) return why;
  bot.joinAsk = { at: world.now + 1 + rngOf(world)() * 1.4 };
  world.log(`You asked to join ${bot.name}'s party.`, '#bff0dc');
  return null;
}

// Their answer: yes when your level fits what they're hunting and they have room.
export function joinAnswer(world, bot) {
  if (bot.shop) return { yes: false, say: ['im minding my shop rn, after i sell out?', 'cant, shop is open! later?'] };
  const need = bot.level - LEVEL_GAP;
  if (world.char.level < need) {
    const where = mapName(bot.map);
    return { yes: false, say: [`sry, ${where} would flatten u. come back at lv${need}?`, `im grinding lv${bot.level} stuff in ${where}, too rough for lv${world.char.level} :(`, `maybe at lv${need}! ${where} hits hard`] };
  }
  if (partyMembers(world.bots).length >= PARTY_MAX) return { yes: false, say: ['we are full rn sorry', 'no room left :('] };
  const job = JOBS[world.char.job]?.name?.toLowerCase();
  const mob = (MAPS[bot.map]?.spawns ?? []).map((s) => s.mob)[0];
  const lines = [`sure! welcome to the party`, job && job !== 'novice' ? `a ${job}? perfect, join up` : 'yes! the more the merrier', `yay, lets clear ${mapName(bot.map)}`];
  if (world.char.level > bot.level + 15) lines.unshift('a carry?? yes pls', `lv${world.char.level}?! carry me pls`);
  return { yes: true, say: lines, mob };
}

function answerJoin(world, bot) {
  bot.joinAsk = null;
  if (['leave', 'logout', 'transit'].includes(bot.state) || bot.gone) {
    world.log(`${bot.name} logged off before answering.`, '#d4cbe8');
    return false;
  }
  const a = joinAnswer(world, bot);
  const away = bot.map !== world.map.id;
  const said = sayNow(world, bot, a.say.sort(() => rngOf(world)() - 0.5), { prefix: '', color: '#e6dcff' });
  if (away && said) world.log(`[Friend] ${bot.name}: ${said}`, '#bfe0ff');
  if (!a.yes) {
    world.log(`${bot.name} can't take you right now.`, '#ffb3c6');
    return false;
  }
  // Joining someone means going to them: a friend elsewhere brings you to their map.
  if (away) {
    const go = warpTo(world, bot);
    if (go) {
      world.log(go, '#ffb3c6');
      return false;
    }
  }
  joinParty(world.bots, bot, world);
  world.bots.partyLead = bot.id;
  world.log(`You joined ${bot.name}'s party!`, '#bff0dc');
  return true;
}

// ---------- Shared quest progress ----------

// A party member here gathered something one of your quests wants: they pass you one for it (up
// to what you still need).
export function shareGather(world, itemId, qty, byName) {
  const char = world.char;
  let short = 0;
  let qid = null;
  for (const [id, rec] of Object.entries(char.quests)) {
    if (rec.state !== 'active' || !QUESTS[id]) continue;
    const goal = QUESTS[id].objectives.find((o) => o.type === 'collect' && o.item === itemId);
    if (!goal) continue;
    const need = goal.count - countItem(char.inventory, itemId);
    if (need > short) {
      short = need;
      qid = id;
    }
  }
  const n = Math.min(qty, short);
  if (n <= 0 || !ITEMS[itemId]) return 0;
  addItem(char.inventory, itemId, n);
  const goal = QUESTS[qid].objectives.find((o) => o.type === 'collect' && o.item === itemId);
  (world.partyCredit ??= {})[`${qid}|${itemId}`] = { name: byName, at: world.now };
  world.log(`[Party] ${byName} found ${ITEMS[itemId].name} for ${QUESTS[qid].name}: ${Math.min(goal.count, countItem(char.inventory, itemId))}/${goal.count}`, PARTY_COLOR);
  return n;
}

// For the players with you: a member who gathers on your map shares it this way.
export function partyGathered(world, bot, itemId, qty = 1) {
  if (!bot.party || bot.map !== world.map.id) return 0;
  return shareGather(world, itemId, qty, bot.name);
}

// ---------- Each frame ----------

export function updateGrouping(world, dt) {
  const bots = world.bots;
  // Pings fade; a monster's ping goes with it.
  if (world.pings?.length) world.pings = world.pings.filter((p) => world.now < p.until && (!p.mob || p.mob.hp > 0 || world.now - p.at < 0.6));
  if (world.groupSay?.length) {
    const due = world.groupSay.filter((s) => world.now >= s.at);
    world.groupSay = world.groupSay.filter((s) => world.now < s.at);
    for (const s of due) if (s.bot.party) sayNow(world, s.bot, s.options);
  }
  if (!bots) return;
  for (const bot of bots.list) if (bot.joinAsk && world.now >= bot.joinAsk.at) answerJoin(world, bot);
  // A focus call holds until that monster is down (or the ping fades).
  for (const bot of partyMembers(bots)) {
    const f = bot.pingFocus;
    if (!f) continue;
    if (f.mob.hp <= 0 || world.now > f.until + 6) bot.pingFocus = null;
    else if (bot.brain && bot.brain.target !== f.mob) bot.brain.target = f.mob;
  }
  if (bots.partyLead && !partyMembers(bots).some((b) => b.id === bots.partyLead)) bots.partyLead = null;
  // Your own gathers reach friends online in your party.
  const g = world.lastGathered;
  if (g && g.at !== world.sharedGatherAt) {
    world.sharedGatherAt = g.at;
    world.net?.gathered?.(world, g.items);
  }
}

// Friends online reach the same code: their pings show (and your party takes their monster
// calls), and what they gather here counts for your quests.
setGroupHandler({
  ping(world, kind, o) {
    if (!PINGS[kind]) return;
    const p = dropPing(world, kind, o);
    if (p) heardPing(world, p);
  },
  label: (kind) => PINGS[kind]?.label,
  color: (kind) => PINGS[kind]?.color,
  gathered: (world, id, qty, name) => shareGather(world, id, qty, name),
});
