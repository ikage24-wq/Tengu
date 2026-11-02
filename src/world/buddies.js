// The players you get to know: friends, and whoever jumps in when you're in trouble.
//
// Friends: add a player (right-click them) and they're on your friends list for good (saved with
// your character, as they looked). Now and then they log in, wave hello if they're near, and ask
// you along to hunt; invite them from the friends list (N) and they come to you.
//
// Help: out in the field with your HP low, a player hunting nearby rushes over, takes on the
// monsters around you, and heals you or tosses you a potion. Say thanks and they might add you.

import { computeStats } from '../core/stats.js';
import { jobChain } from '../data/jobs.js';
import { MAPS } from '../data/maps.js';
import { createBody } from './physics.js';
import { joinParty, partyMembers, LEVEL_GAP, PARTY_MAX } from './party.js';

export const BUDDY_MAX = 20;

const between = (a, b, rng) => a + rng() * (b - a);
const pick = (list, rng) => list[Math.floor(rng() * list.length)];

function say(bot, text) {
  if (text) bot.bubble = { text, t: 4.5 };
}

// ---------- Players as remembered ----------

// Enough to bring a player back just as they were: name, level, job path, look and gear.
export function snapshot(bot) {
  const c = bot.char;
  return {
    name: bot.name, level: c.level, jobs: jobChain(c.job).filter((j) => j !== 'novice'),
    look: c.appearance, equipment: c.equipment, outfit: c.outfit,
    guild: bot.guild ?? null, style: bot.style, title: bot.title ?? null, since: Date.now(), seen: Date.now(),
  };
}

// A remembered player back as a character, at the level they're at now.
export function remake(snap, makeChar, rng) {
  const char = makeChar(rng, { name: snap.name, level: snap.level, jobs: snap.jobs, pro: false });
  char.appearance = snap.look;
  char.equipment = snap.equipment;
  char.outfit = snap.outfit ?? {};
  const s = computeStats(char);
  char.hp = s.maxHp;
  char.mp = s.maxMp;
  return char;
}

const who = (snap, char) => ({ name: snap.name, char, guild: snap.guild, style: snap.style, title: snap.title });

// ---------- Friends ----------

export const buddiesOf = (char) => (char.buddies ??= []);
export const isBuddy = (char, name) => buddiesOf(char).some((b) => b.name === name);

// Why you can't add this player right now, or null.
export function addBlocker(world, bot) {
  if (isBuddy(world.char, bot.name)) return 'Already your friend';
  if (buddiesOf(world.char).length >= BUDDY_MAX) return `Your friends list is full (${BUDDY_MAX})`;
  if (bot.friendAsk) return 'Waiting for an answer';
  return null;
}

// Asks them; they answer after a moment (see tickAsks). Those who partied with you, who helped
// you, or who offered say yes.
export function askFriend(world, bot) {
  const why = addBlocker(world, bot);
  if (why) return why;
  bot.friendAsk = { at: world.now + between(1, 2.2, Math.random) };
  world.log(`You asked ${bot.name} to be friends.`, '#bfe0ff');
  return null;
}

function tickAsks(bots, world) {
  const rng = bots.rng;
  for (const bot of bots.list) {
    if (!bot.friendAsk || world.now < bot.friendAsk.at) continue;
    bot.friendAsk = null;
    const keen = bot.party || bot.helped || bot.offered;
    const yes = keen || rng() < 0.7;
    if (!yes) {
      say(bot, pick(['sorry i dont add randoms', 'maybe later', 'hmm no ty'], rng));
      world.log(`${bot.name} declined your friend request.`, '#ffb3c6');
      continue;
    }
    if (isBuddy(world.char, bot.name) || buddiesOf(world.char).length >= BUDDY_MAX) continue;
    buddiesOf(world.char).push(snapshot(bot));
    bot.buddy = true;
    say(bot, pick(['added!! :D', 'yay friends', 'added u!', 'omg yes', 'hehe hi friend'], rng));
    world.log(`${bot.name} is now your friend! (N: friends list)`, '#bfe0ff');
  }
}

export function removeBuddy(world, bots, name) {
  world.char.buddies = buddiesOf(world.char).filter((b) => b.name !== name);
  const bot = bots?.list.find((b) => b.name === name);
  if (bot) bot.buddy = false;
}

// The friend online with that name, if any.
export const buddyOnline = (bots, name) => bots?.list.find((b) => b.buddy && b.name === name && !b.gone) ?? null;

// Friends log in and out over time; one online now and then asks you to hunt.
function tickBuddies(bots, world, dt, hooks) {
  const rng = bots.rng;
  const list = buddiesOf(world.char);
  // Keep what we know of them up to date (they level up partying with you).
  for (const b of bots.list) {
    if (!b.buddy || b.gone) continue;
    const snap = list.find((s) => s.name === b.name);
    if (!snap) continue;
    snap.level = b.char.level;
    snap.seen = Date.now();
  }
  bots.buddyIn = (bots.buddyIn ?? between(4, 10, rng)) - dt;
  if (bots.buddyIn > 0 || !list.length) return;
  bots.buddyIn = between(40, 110, rng);
  const online = list.filter((s) => buddyOnline(bots, s.name));
  const offline = list.filter((s) => !buddyOnline(bots, s.name) && !bots.list.some((b) => b.name === s.name));
  // Someone logs in (more likely the more friends you have and the fewer are on, and most likely
  // just after you log in yourself).
  const fresh = !bots.buddyRolled;
  bots.buddyRolled = true;
  if (offline.length && rng() < Math.min(0.85, (fresh ? 0.6 : 0.4) + offline.length * 0.06) && online.length < 4) {
    const snap = pick(offline, rng);
    const bot = hooks.logIn(who(snap, remake(snap, hooks.makeChar, rng)));
    if (bot) {
      bot.buddy = true;
      world.log(`[Friend] ${bot.name} logged in.`, '#bfe0ff');
      // Near you in town: they come over and wave.
      if (bot.map === world.map.id && world.map.isTown) {
        bot.state = 'approach';
        bot.waved = true;
        bot.hello = pick(['hiii', `${world.char.name}!!`, 'hey friend :D', 'o/ hi'], rng);
      }
    }
    return;
  }
  // A friend online (not with you) asks you to come hunt.
  const free = online.map((s) => buddyOnline(bots, s.name)).filter((b) => !b.party && !b.shop && b.state !== 'logout');
  if (free.length && !bots.huntAsk && rng() < 0.5 && partyMembers(bots).length < PARTY_MAX) {
    const bot = pick(free, rng);
    bots.huntAsk = { bot, until: world.now + 60 };
    world.log(`[Friend] ${bot.name}: ${pick(['wanna hunt together?', 'party up?? im bored', 'lets go grind!', 'u free? lets hunt'], rng)} (N to answer)`, '#bfe0ff');
  }
}

// You said yes (or invited them yourself): they come to you, in through the nearest portal, and join.
export function callBuddy(bots, world, bot) {
  if (bot.party) return 'Already in your party';
  if (partyMembers(bots).length >= PARTY_MAX) return 'Your party is full';
  if (bot.level > world.char.level + LEVEL_GAP) return `Lv ${bot.level} is too far above you`;
  const b = world.body;
  const p = world.map.portals.filter((q) => !q.hidden && !q.dungeon).sort((q, r) => Math.abs(q.x - b.x) - Math.abs(r.x - b.x))[0];
  const here = bot.map === world.map.id && bot.body;
  if (!here) {
    bot.map = world.map.id;
    bot.x = p ? p.x : b.x - 40;
    bot.body = createBody(bot.x, p ? p.y : b.y);
    bot.appear = 1;
  }
  joinParty(bots, bot, world);
  say(bot, pick(['omw!!', 'here!', 'lets gooo', 'party time :D'], bots.rng));
  world.log(`${bot.name} joined your party!`, '#bff0dc');
  if (bots.huntAsk?.bot === bot) bots.huntAsk = null;
  return null;
}

export function answerHunt(bots, world, yes) {
  const ask = bots.huntAsk;
  if (!ask) return;
  bots.huntAsk = null;
  if (!yes) {
    say(ask.bot, 'aw ok, next time!');
    return;
  }
  const no = callBuddy(bots, world, ask.bot);
  if (no) world.log(no, '#ffb3c6');
}

// ---------- Help when you're in trouble ----------

const HELP_LOW = 0.3;
const HELP_FOR = 10;

// Your HP low out in the field: a player hunting nearby comes running.
function sendHelp(bots, world) {
  const rng = bots.rng;
  const map = world.map;
  const s = world.stats;
  if (world.dead || map.isTown || world.dungeon || world.char.hp > s.maxHp * HELP_LOW) return;
  if (world.now < (bots.helpAt ?? 0)) return;
  const b = world.body;
  const near = bots.list
    .filter((x) => x.hunter && !x.gone && !x.down && !x.leaving && x.state !== 'logout' && x.body && Math.abs(x.body.x - b.x) < 520 && Math.abs(x.body.y - b.y) < 200)
    .sort((x, y) => Math.abs(x.body.x - b.x) - Math.abs(y.body.x - b.x));
  bots.helpAt = world.now + 45;
  const bot = near[0];
  if (!bot) return;
  bot.helping = world.now + HELP_FOR;
  bot.gave = false;
  Object.assign(bot.brain ?? {}, { target: null, path: null });
  say(bot, pick(['u ok??', 'i got u!', 'hang on!!', 'omg ur hp', 'coming!!'], rng));
  world.log(`${bot.name} rushes over to help you!`, '#bff0dc');
}

// A helper close enough patches you up once: a blessing from a Spirit Mage (or her paths), a
// potion tossed over from anyone else.
function helpers(bots, world) {
  const b = world.body;
  for (const bot of bots.list) {
    if (!bot.helping) continue;
    if (world.now > bot.helping || bot.down || bot.gone) {
      bot.helping = null;
      continue;
    }
    if (bot.gave || !bot.body || Math.abs(bot.body.x - b.x) > 140 || Math.abs(bot.body.y - b.y) > 80 || world.dead) continue;
    bot.gave = true;
    bot.helped = true;
    const max = world.stats.maxHp;
    const shrine = jobChain(bot.char.job).includes('spiritmage');
    const witch = bot.char.job === 'spiritmage';
    const amount = Math.round(max * (shrine ? 0.45 : 0.3));
    world.char.hp = Math.min(max, world.char.hp + amount);
    world.fx.push(shrine ? { kind: witch ? 'stwish' : bot.char.job === 'shrinemaiden' ? 'sisong' : 'astide', x: b.x, y: b.y, t: 0, dur: 1 } : { kind: 'heal', x: b.x, y: b.y, t: 0, dur: 0.8 });
    world.numbers.push({ x: b.x, y: b.y - 52, text: `+${amount}`, color: '#7ee081', t: 0 });
    if (shrine) bot.attack = { pose: witch ? 'swwish' : bot.char.job === 'shrinemaiden' ? 'sisong' : 'astide', t: 0, dur: witch ? 0.9 : 1.1 };
    say(bot, shrine ? pick(['blessed u!', 'heal!', 'there :)'], bots.rng) : pick(['here have a pot!', 'catch!! *throws pot*', 'drink this'], bots.rng));
  }
}

// Saying thanks to whoever just helped you: they're glad, and might offer to be friends.
export function thanked(bots, world) {
  const bot = bots.list.find((b) => b.helped && !b.thanked && !b.gone && b.map === world.map.id);
  if (!bot) return false;
  bot.thanked = true;
  const rng = bots.rng;
  say(bot, pick(['np!! stay safe', 'anytime :D', 'np, watch ur hp', 'thats what friends are for... wait are we friends?'], rng));
  if (!isBuddy(world.char, bot.name) && rng() < 0.6) {
    bot.offered = true;
    bot.nextOffer = world.now + 2.5;
  }
  return true;
}

function offers(bots, world) {
  for (const bot of bots.list) {
    if (!bot.nextOffer || world.now < bot.nextOffer || bot.bubble) continue;
    bot.nextOffer = null;
    say(bot, pick(['add me? :D', 'wanna be friends?', 'add me if u want!'], bots.rng));
    world.log(`${bot.name} would like to be friends. (Right-click them: Add friend)`, '#bfe0ff');
  }
}

// ---------- Each frame ----------

// `hooks` (from world/bots.js): logIn(who), makeChar.
export function updateBuddies(bots, world, dt, hooks) {
  tickAsks(bots, world);
  tickBuddies(bots, world, dt, hooks);
  if (bots.huntAsk && (world.now > bots.huntAsk.until || bots.huntAsk.bot.gone)) bots.huntAsk = null;
  sendHelp(bots, world);
  helpers(bots, world);
  offers(bots, world);
}

export const whereIs = (bot) => MAPS[bot.map]?.name ?? 'somewhere';
