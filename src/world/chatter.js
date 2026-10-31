// Procedural chat for the other "players": templates about what's real for each speaker (their own
// weapon, job and title, the map they're on and its monsters, where they're headed next, the
// weather, what just happened on the server), spoken in each player's own style (caps, emoticons,
// slang, the odd typo). A line whose slots don't fit the speaker isn't used; no line is said twice
// in a session, and no template comes round again until many others have. `answer` lets them reply to what the real player says in chat (directions,
// levels, where monsters live, how fishing and cooking work), from the game's own data.

import { ITEMS } from '../data/items.js';
import { MAPS, TOWNS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { NPCS } from '../data/npcs.js';
import { JOBS } from '../data/jobs.js';
import { FISH, SPOTS } from '../data/fishing.js';
import { DISHES } from '../data/cooking.js';
import { SETS } from '../data/sets.js';
import { TRIALS } from '../data/story.js';
import { levelRange, routeBetween } from './routes.js';

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];


export function price(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')}m`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return `${n}`;
}

// Slots: each returns a phrase, or null when it doesn't fit this speaker (and then the line isn't
// used). `ctx` (contextOf) is the speaker: who they are, where, what's around them, what just
// happened on the server, and the real player's name.
const SLOTS = {
  // About the speaker.
  me: (c) => c.player ?? null,
  mylvl: (c) => (c.level ? `${c.level}` : null),
  myjob: (c) => c.jobName ?? null,
  myweapon: (c) => c.weapon ?? null,
  myguild: (c) => c.guild ?? null,
  shopitem: (c) => c.shopItem ?? null,
  // Where they are, and what's there.
  here: (c) => c.hereName ?? null,
  town: (c) => (c.isTown ? c.hereName : null),
  field: (c) => (c.isTown ? null : c.hereName),
  mobhere: (c) => (c.mobsHere?.length ? pick(c.mobsHere) : null),
  drophere: (c) => (c.dropsHere?.length ? pick(c.dropsHere) : null),
  next: (c) => c.next ?? null,
  nextmob: (c) => c.nextMob ?? null,
  weather: (c) => c.weather ?? null,
  happened: (c) => c.happened ?? null,
  // Things anyone might mention.
  fish: (c) => c.fishName ?? pick(FISH.filter((f) => f.rarity <= 2)).name,
  rarefish: () => pick(FISH.filter((f) => f.rarity >= 3)).name,
  dish: () => pick(DISHES).name,
  queen: (c) => (c.level >= 18 ? pick(['Sylvana', 'Tamamo', 'Lilith', 'Selene'].slice(0, c.level >= 40 ? 4 : c.level >= 30 ? 3 : 2)) : null),
  dungeon: () => 'Rootwood Hollow',
  npc: (c) => c.npcHere ?? pick(Object.values(NPCS)).name,
  stat: () => pick(['STR', 'DEX', 'INT', 'LUK']),
  small: () => pick(['2', '3', '5', '10', '20']),
  hours: () => pick(['2', '3', '4', 'like 6']),
  emote: () => pick([':D', ':)', ';)', ':3', '^^', 'xD', ':P', 'uwu', '<3', 'B)', ':O', '>_<', 'owo', '^_^']),
  laugh: () => pick(['lol', 'lmao', 'haha', 'hehe', 'lolol', 'xD', 'hahaha', 'pfft']),
  hi: () => pick(['hi', 'hey', 'hello', 'heyo', 'hiya', 'yo', 'hai', 'sup', 'heya', 'oh hi']),
  bye: () => pick(['gtg', 'cya', 'bye all', 'logging off', 'gn everyone', 'ttyl', 'brb dinner', 'night!', 'off to bed', 'later']),
  yes: () => pick(['yes', 'yep', 'ya', 'yeah', 'ofc', 'sure', 'yesss', 'mhm']),
  wow: () => pick(['wow', 'omg', 'whoa', 'woah', 'no way', 'wait what', 'ooh', 'yooo']),
  emotew: () => pick(['dance', 'flip', 'cheer', 'flex', 'love']),
  // (Answers only: a weapon that came up, a job.)
  weapon: (c) => c.weapon ?? null,
  job: (c) => c.jobName ?? null,
  mob: (c) => (c.mobsHere?.length ? pick(c.mobsHere) : null),
  map: (c) => c.next ?? null,
  price: () => price(pick([2, 5, 8, 12, 25, 40]) * 1000),
  set: () => pick(Object.values(SETS)).name,
};

// Templates by mood. Every one is about something real for the speaker (their own weapon, the map
// they're on and its monsters, where they're headed next, what just happened); a line whose slots
// don't fit them is skipped.
const TEMPLATES = {
  hunting: [
    '{mobhere}s keep knocking me off the ledge {laugh}', 'need {small} more {mobhere}s for my quest', '{field} is packed today', 'anyone else farming {drophere}?',
    'been on {field} for {hours} hours', '{mobhere} respawn is so fast here', 'my {myweapon} two-shots {mobhere}s now', 'finally got a {drophere}',
    'why do {mobhere}s always aggro me', '{field} music hits different', 'one more lvl then im leaving {field}', 'the {mobhere}s here are kinda cute ngl',
  ],
  plans: [
    'heading to {next} after this', 'is {next} good at lvl {mylvl}?', 'almost strong enough for {next}', 'gonna try the {nextmob}s at {next}',
    '{next} tomorrow, today i rest', 'lvl {mylvl}... {next} time soon', 'who wants to duo {next} later?',
  ],
  gear: [
    'my {myweapon} finally feels strong', 'should i upgrade my {myweapon}?',
    'saving up for a better {myweapon}', '{myguild} gang', 'anyone else in {myguild} on?', 'love being {myjob} tbh', '{myjob} is so fun at lvl {mylvl}',
  ],
  newbie: [
    'how do i jump', 'what button attacks', 'where do i go first?', 'whats a hotkey', 'this is my first day {emote}', 'how do i talk to {npc}',
    'im lost lol', 'what does AP mean', 'omg i leveled!', 'is {next} too hard for me?', 'how do i get a job?',
  ],
  shop: ['come see my shop!', 'selling {shopitem}, come look', '{shopitem} in my shop {emote}', 'clearing my bag, {shopitem} and more', 'shop open in {town}!'],
  news: [
    'did anyone see {happened}?', '{happened} was wild', 'still thinking about {happened}', 'i missed {happened} :(', 'was anyone at {happened}?', '{happened} tho {laugh}',
  ],
  weather: ['this {weather} tho', 'who ordered {weather}', '{weather} in {here} is kinda cozy', 'my hair in this {weather}...', 'perfect {weather} for fishing', 'ugh {weather}'],
  fishing: [
    'anyone know where {rarefish} bites?', 'just caught a {fish} {emote}', 'fishing here is so relaxing', 'my rod is my main weapon now {laugh}',
    'still no {rarefish} after {hours} hours', 'the bobber dipped and i panicked {laugh}', 'who caught the big one??',
  ],
  cooking: ['made {dish} {emote}', 'anyone wanna try my {dish}?', '{dish} + grind = so much exp', 'cooking is my new hobby {emote}', 'i burned it {laugh} jk only Good'],
  story: [
    'just beat {queen}\'s trial!!', '{queen} is so pretty tho', 'is Hayate waking up soon?', 'cried a little at the {queen} cutscene ngl', 'Mira is the best {emote}', 'wait the wind STOPPED?? thats the plot??',
  ],
  dungeon: ['anyone run {dungeon} with me?', 'the Hollow Heart is so cute when its asleep', 'hard mode {dungeon} anyone?', 'the boar den room {laugh}', 'cleared {dungeon} in {small} min B)'],
  smalltalk: [
    '{hi} everyone {emote}', '{here} is so pretty today', 'love the music in {here}', 'who else just idles in {here}', 'snack break brb', 'who else is up late {laugh}',
    'anyone else love {npc}?', 'i just want a pet {mobhere} tbh', 'ok who keeps dancing {laugh}', 'brb gonna get water',
  ],
  brag: ['lvl {mylvl} {myjob} btw', 'my {myweapon} hits so hard', 'farming {field} for fun now', 'who needs a carry? {emote}'],
  greet: [
    '{hi} {me}!', '{hi} {me} {emote}', 'oh {hi} {me}', 'love your outfit {me}!', '{me}!! {emote}', 'hey {me}, wanna party sometime?',
    'yo {me} whats ur lvl', '{me} hii {emote}', 'sup {me}', 'heya {me}, good luck out there',
  ],
  party: [
    'gj {me}', 'ty for the party {emote}', 'brb pot', '{laugh} that {mobhere}', 'this spot is good', 'almost lvl up!', 'ooh a {drophere}', 'my {myweapon} hits so hard here',
    'ur so strong {me}', 'lets do {next} after', 'one more round?', 'careful {me}!', 'i got aggro lol', 'wait for me', 'so many {mobhere}s', 'nice combo',
  ],
  joined: ['{yes}! {emote}', 'omg ty for the invite', 'sure, lets go!', 'yay party!', 'ok im in {emote}', 'lets grind {me}!', 'thx {me}!!', 'ooh ok'],
  levelUp: ['LVL UP!!', 'ding!! {emote}', 'lvl {mylvl}!!', 'leveled!! ty party', 'ding {mylvl} {emote}'],
  leaving: ['gtg, ty for the party!', 'thx for the pt {me}!', 'that was fun, cya!', 'ty! logging off', 'gg party {emote}'],
  thanks: ['ty!!', 'thanks {emote}', 'tysm', 'enjoy it!', 'pleasure doing business', 'thx {me}!', 'have fun with it!', 'ty, come again {emote}'],
  bye: ['{bye}', '{bye} {emote}', 'ok {bye}', '{bye}, gl everyone'],
};

// Replies to the real player: what they said, a level up, a rare catch, an emote at them.
const REPLIES = {
  hi: ['{hi} {me}!', '{hi} {me} {emote}', 'oh {hi}!', 'heyyy {me}', '{hi}! hows it going', 'yo {me}', 'hii {emote}', 'hello hello', '{me}!! {hi}'],
  name: ['hm? yes {me}?', 'whats up {me}', 'yes?? {emote}', 'oh me? hi {me}!', 'im here {laugh}', 'need something {me}?'],
  thanks: ['np!', 'no problem {emote}', 'anytime {me}', 'ofc!', 'glad to help', 'np np', 'yw!'],
  laugh: ['{laugh}', '{laugh} {emote}', 'LOL', '{laugh} same', 'xD'],
  chat: ['true', 'fr', 'same tbh', 'ooh nice', '{laugh}', 'agreed {emote}', 'mhm', 'real', 'haha yeah', 'thats cute {emote}', 'omg same', 'oh really?', 'hmm interesting'],
  level: ['grats {me}!!', 'gz {me} {emote}', 'grats on lvl {mylvl}!', 'ding! gz', 'congrats!!', 'nice level {me}', 'gratz {emote}', 'woo grats!'],
  job: ['grats on the job {me}!!', 'ooh new job {emote}', 'welcome to the {job} club', 'congrats {me}! looks so cool'],
  catch: ['{wow} a {fish}!!', 'grats on the {fish} {me}!', 'jealous {laugh}', 'how big??', 'lucky {emote}', 'no way a {fish}', 'teach me ur ways {me}'],
  emote: ['{emote}', 'hehe {emote}', 'lol {me} {emote}', 'cute {emote}', '*{emotew}s back*', 'aww {emote}'],
  dunno: ['hmm idk sorry', 'not sure, ask Mira?', 'no idea {laugh}', 'idk, check the world map (M)?', 'good question tbh', 'hmm someone else might know'],
};
// Whole little chats between two players in town: the first speaks, the other answers, and so on.
const CONVERSATIONS = [
  ['anyone wanna party?', 'sure! where?', '{map}?', 'ok omw {emote}'],
  ['how much for {fish}?', '{price}', 'thats a lot {laugh}', 'ok ok half price for u'],
  ['love ur outfit!', 'tyy {emote} urs too', 'its the {set} set', 'so pretty'],
  ['did u beat {queen} yet?', 'not yet, so hard', 'u got this!', 'ty {emote}'],
  ['whats ur lvl?', '{mylvl}, u?', 'a bit higher {laugh}', 'show off'],
  ['made {dish}, want some?', 'omg yes', 'here {emote}', 'tysm!!'],
  ['brb food', 'what are u eating', 'noodles {emote}', 'jealous'],
  ['where do i fish?', 'harbor pier!', 'ty!!', 'np {emote}'],
  ['{dungeon} later?', 'yes! need a healer tho', 'ill ask around', 'ok ping me'],
  ['this music is so good', 'right?? {town} song is my fav', 'same', '{emote}'],
];

// Light texture: how a given player types.
function voice(line, style, rng) {
  let s = line;
  if (style.lower) s = s.toLowerCase();
  if (style.shout && rng() < 0.3) s = s.toUpperCase();
  if (style.excited && rng() < 0.4) s = s.replace(/[.!?]*$/, pick(['!', '!!', '!!!'], rng));
  if (style.emotes && rng() < 0.35 && !/[:;<^>]|B\)|xD|uwu|owo/.test(s)) s += ` ${SLOTS.emote()}`;
  if (style.laughs && rng() < 0.2) s += ` ${SLOTS.laugh()}`;
  if (style.typos && rng() < 0.25 && s.length > 6) {
    const i = 1 + Math.floor(rng() * (s.length - 3));
    s = s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
  }
  if (style.stretch && rng() < 0.2) s = s.replace(/([aeiou])/, '$1$1$1');
  return s;
}

// A reply to the real player of a kind (REPLIES), never one said this session.
export function reply(memory, kind, ctx, style, rng = Math.random) {
  let last = null;
  for (let i = 0; i < 10; i++) {
    const filled = fill(pick(REPLIES[kind], rng), ctx);
    if (!filled) continue;
    const line = voice(filled, style, rng);
    last = line;
    if (!memory.has(line)) {
      memory.add(line);
      return line;
    }
  }
  return last;
}

// A line of our own (an answer) in a player's voice, its {slots} filled.
export function voiced(line, ctx, style, rng = Math.random) {
  return voice(fill(line, ctx) ?? line.replace(/\{\w+\}/g, ''), style, rng);
}

// A little chat between two players: the lines in order, filled in.
export function conversation(ctx, rng = Math.random) {
  // (One whose every line fits.)
  for (let i = 0; i < 10; i++) {
    const lines = pick(CONVERSATIONS, rng).map((l) => fill(l, ctx));
    if (lines.every(Boolean)) return lines;
  }
  return ['{hi}', '{hi} {emote}'].map((l) => fill(l, ctx));
}

// ---------- Answering the real player ----------
// Looks for something in what was said that the game knows about (a map, a monster, an NPC, a
// fish, a dish, or a topic) and answers it, casually; null when there's nothing to say.

const lc = (s) => s.toLowerCase();
const has = (words, list) => list.some((w) => words.includes(w));
const findName = (words, list) => list.filter((x) => x.name && words.includes(lc(x.name))).sort((a, b) => b.name.length - a.name.length)[0] ?? null;

// The way from here to a map: the first portal to take and how far it is.
function directions(from, map) {
  if (from === map.id) return "ur already there {laugh}";
  const path = routeBetween(from, map.id);
  if (!path) return `${map.name}? use the world map (M), it shows the way`;
  const first = MAPS[path[0].to].name;
  return path.length === 1 ? `${map.name} is right next door, take the portal to it` : `${map.name}: head to ${first} first, its ${path.length} maps away. M shows a pink trail!`;
}

// The best hunting map for a level.
function bestMap(level) {
  let best = null;
  for (const m of Object.values(MAPS)) {
    if (m.isTown || m.dungeon || m.trial || !m.spawns?.length) continue;
    const lv = m.spawns.filter((s) => !MOBS[s.mob].boss).map((s) => MOBS[s.mob].level);
    if (!lv.length) continue;
    const mid = (Math.min(...lv) + Math.max(...lv)) / 2;
    const score = Math.abs(mid - level - 2);
    if (!best || score < best.score) best = { m, score };
  }
  return best?.m ?? null;
}

export function answer(said, ctx) {
  const w = lc(said);
  const asking = /\?|^(how|where|what|which|who|is|are|does|do|can|any|wher|wat|hw)\b/.test(w);
  const level = ctx.playerLevel ?? 1;
  // Things with names.
  const map = findName(w, Object.values(MAPS).filter((m) => !m.trial && !m.dungeon));
  // (Bosses answer to their first name too: "where is Tamamo".)
  const mob = findName(w, Object.values(MOBS)) ?? Object.values(MOBS).find((m) => m.boss && (new RegExp(`\\b${lc(m.name.split(/[ ,]/)[0])}\\b`).test(w) || (m.name.includes(', the ') && w.includes(lc(m.name.split(', the ')[1]))))) ?? null;
  const npc = findName(w, Object.values(NPCS));
  const fish = findName(w, FISH);
  const dish = findName(w, DISHES);
  if (dish) return `${dish.name}: ${Object.entries(dish.needs).map(([id, n]) => `${n} ${ITEMS[id]?.name ?? id}`).join(' + ')} at any town stove. ${dish.about}!`;
  if (fish) {
    const at = Object.entries(SPOTS).filter(([, list]) => list.some((sp) => sp.pool[fish.id])).map(([id]) => MAPS[id]?.name).filter(Boolean);
    return at.length ? `${fish.name} bites at ${at.join(' or ')}${fish.rarity >= 3 ? ', but its rare, be patient!' : '!'}` : `never seen a ${fish.name} {laugh}`;
  }
  if (mob && !mob.boss) {
    const at = Object.values(MAPS).filter((m) => m.spawns?.some((sp) => sp.mob === mob.id) && !m.dungeon && !m.trial).map((m) => m.name);
    return at.length ? `${mob.name}s are at ${at.slice(0, 2).join(' and ')} (lvl ${mob.level})` : `${mob.name}s live in ${'{dungeon}'} i think`;
  }
  if (mob?.boss) {
    const trial = Object.values(TRIALS).find((t) => t.boss === mob.id);
    const short = mob.name.split(',')[0];
    if (trial) return `${short}: follow the story (★ quests) to her trial, then she comes back on ${MAPS[trial.field].name} for rematches`;
    const lair = Object.values(MAPS).find((m) => m.spawns?.some((sp) => sp.mob === mob.id));
    return lair ? `${short} is at ${lair.dungeon ? 'the end of Rootwood Hollow' : lair.name}, bring a party!` : `${short} is a big boss, go with a party!`;
  }
  if (npc) {
    const home = Object.values(MAPS).find((m) => m.npcs?.some((n) => n.id === npc.id));
    return home ? `${npc.name} is in ${home.name}${npc.title ? ` (${npc.title})` : ''}` : `hmm where is ${npc.name}...`;
  }
  if (map && asking) {
    const range = levelRange(map);
    if (has(w, ['lvl', 'level', 'lv'])) return range ? `${map.name} is ${range.toLowerCase()}` : `${map.name} is a town, no monsters there`;
    return `${directions(ctx.here, map)}${range ? ` (${range.toLowerCase()})` : ''}`;
  }
  // Topics.
  if (has(w, ['fish', 'fishing', 'rod', 'bobber'])) return 'buy a rod from Pip or Marlo, stand at ripples on the water, press up, then attack the second it bites!';
  if (has(w, ['cook', 'stove', 'recipe', 'food'])) return 'every town has a stove, press up at it. a pot makes 2 dishes';
  if (has(w, ['polish', 'enhance', 'upgrade'])) return 'Tora in Ember Crag polishes gear up to +10, gets harder each step tho';
  if (has(w, ['set', 'sets'])) return 'queens drop set pieces for ur job, and the Hollow chest gives Rootwood. full set = aura!';
  if (has(w, ['collection', 'book', 'cards'])) return 'press B for the Collection, a card for every monster you beat';
  if (has(w, ['dungeon', 'hollow', 'warden'])) return 'Rootwood Hollow is at Hollow Gate, talk to the warden to make a group';
  if (has(w, ['job', 'advance', 'class'])) return level < 10 ? 'first job at lvl 10, visit the instructor in their town!' : 'second job is at lvl 30, ur instructor gives a trial';
  if (has(w, ['money', 'gold', 'meso', 'rich'])) return 'sell fish and drops, and grind a map at ur level. dishes sell well too';
  if (has(w, ['ap', 'stat', 'stats', 'str', 'dex', 'int', 'luk'])) return 'put AP in ur job\'s main stat, or just press Auto in stats (C)';
  if (has(w, ['pet', 'mochi'])) return 'Mochis are in the Mochi window (P), they pick up loot for u {emote}';
  if (has(w, ['friend', 'online', 'room'])) return 'press N to host a room and share the code, its so fun';
  if (has(w, ['party', 'pt', 'group'])) return 'right-click (or tap) a player and invite them!';
  if (has(w, ['story', 'quest', 'quests']) && asking) return 'the gold ★ quests are the story, Mira starts it in Sprout';
  if (asking && has(w, ['exp', 'grind', 'train', 'lvl', 'level', 'where'])) {
    const m = bestMap(level);
    return m ? `at lvl ${level}? try ${m.name} (${(levelRange(m) ?? '').toLowerCase()})` : 'just grind wherever {laugh}';
  }
  return null;
}

export function makeStyle(rng = Math.random) {
  return { lower: rng() < 0.6, shout: rng() < 0.08, excited: rng() < 0.4, emotes: rng() < 0.5, laughs: rng() < 0.3, typos: rng() < 0.25, stretch: rng() < 0.15 };
}

// A template with its slots filled, or null when one doesn't fit the speaker.
function fill(template, ctx) {
  let ok = true;
  const line = template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = SLOTS[k] ? SLOTS[k](ctx) : k;
    if (v == null) ok = false;
    return v ?? '';
  });
  return ok ? line : null;
}

// Templates used lately (by anyone), so the same line shape doesn't come round again soon.
const RECENT_TEMPLATES = 60;

// A fresh line for `kind` (a mood): never one already said this session, never a template used
// lately, and only one that fits the speaker. Null when there's nothing good to say.
export function speak(memory, kind, ctx, style, rng = Math.random) {
  const list = TEMPLATES[kind];
  if (!list) return null;
  memory.recent ??= [];
  const fresh = list.filter((t) => !memory.recent.includes(t));
  for (let i = 0; i < 12; i++) {
    const t = pick(fresh.length ? fresh : list, rng);
    const filled = fill(t, ctx);
    if (!filled) continue;
    const line = voice(filled, style, rng);
    if (memory.has(line)) continue;
    memory.add(line);
    memory.recent.push(t);
    if (memory.recent.length > RECENT_TEMPLATES) memory.recent.shift();
    return line;
  }
  return null;
}

// ---------- What a player knows to talk about ----------

const dropName = (id) => (ITEMS[id]?.type === 'etc' ? ITEMS[id].name : null);

// The speaker: who they are, where they are and what's there, where they're headed next, what
// just happened on the server, the weather if they're with you.
export function contextOf(bot, bots, world) {
  const c = bot.char;
  const map = MAPS[bot.map];
  const spawns = (map?.spawns ?? []).map((s) => MOBS[s.mob]).filter((d) => d && !d.boss);
  const mobs = [...new Set(spawns.map((d) => d.name))];
  const drops = [...new Set(spawns.flatMap((d) => (d.drops ?? []).map((x) => dropName(x.id)).filter(Boolean)))];
  const next = bestMap(c.level + 3);
  const nextMobs = (next?.spawns ?? []).map((s) => MOBS[s.mob]).filter((d) => d && !d.boss);
  const w = c.equipment?.weapon;
  const recent = (bots.happened ?? []).filter((h) => world.now - h.at < 900);
  return {
    player: world.char.name, level: c.level, jobName: c.job === 'novice' ? null : JOBS[c.job]?.name,
    weapon: w ? ITEMS[w.id]?.name ?? null : null, title: bot.title ?? null, guild: bot.guild ?? null,
    shopItem: bot.shop?.items[0] ? (ITEMS[bot.shop.items[0].id]?.name ?? null) : null,
    hereName: map?.name ?? null, isTown: Boolean(map?.isTown), here: bot.map,
    mobsHere: mobs, dropsHere: drops, npcHere: map?.npcs?.length ? NPCS[pick(map.npcs).id]?.name : null,
    next: next && next.id !== bot.map ? next.name : null, nextMob: nextMobs.length ? pick(nextMobs).name : null,
    weather: bot.map === world.map.id ? world.weather ?? null : null,
    happened: recent.length ? pick(recent).what : null,
  };
}

// Something big just happened on the server (a raid, a wedding, a GM event): people talk about it
// for a while after.
export function happened(bots, world, what) {
  bots.happened = [...(bots.happened ?? []), { what, at: world.now }].slice(-8);
}

// What a player feels like saying, given who they are, where, and what's going on.
export function moodFor(bot, rng = Math.random, ctx = {}) {
  if (bot.party && rng() < 0.7) return 'party';
  if (bot.shop && rng() < 0.55) return 'shop';
  if (bot.level < 12 && rng() < 0.5) return 'newbie';
  if (ctx.happened && rng() < 0.3) return 'news';
  if (ctx.weather && rng() < 0.25) return 'weather';
  if (bot.pro && rng() < 0.3) return 'brag';
  if (!ctx.isTown && ctx.mobsHere?.length && rng() < 0.6) return 'hunting';
  const r = rng();
  if (r < 0.2) return 'plans';
  if (r < 0.38) return 'gear';
  if (r < 0.46 && ctx.isTown) return 'fishing';
  if (r < 0.52 && ctx.isTown) return 'cooking';
  if (r < 0.62) return bot.level >= 18 ? 'story' : 'plans';
  if (r < 0.7) return bot.level >= 12 ? 'dungeon' : 'smalltalk';
  return 'smalltalk';
}
