// Procedural chat for the other "players": a grammar of templates with slots (items, maps,
// monsters, towns, prices, levels, jobs, NPCs, fish, dishes, queens, sets, titles, the real
// player's name), spoken in each player's own style (caps, emoticons, slang, the odd typo). The
// combinations run into the millions, and a memory of recent lines keeps anything from being said
// twice in a session. `answer` lets them reply to what the real player says in chat (directions,
// levels, where monsters live, how fishing and cooking work), from the game's own data.

import { ITEMS } from '../data/items.js';
import { MAPS, TOWNS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { NPCS } from '../data/npcs.js';
import { JOBS } from '../data/jobs.js';
import { FISH, SPOTS } from '../data/fishing.js';
import { DISHES } from '../data/cooking.js';
import { SETS } from '../data/sets.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { TRIALS } from '../data/story.js';
import { levelRange, routeBetween } from './routes.js';

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

const GEAR = () => Object.values(ITEMS).filter((d) => d.type === 'equip');
const WEAPONS = () => Object.values(ITEMS).filter((d) => d.slot === 'weapon');
const DROPS = () => Object.values(ITEMS).filter((d) => d.type === 'etc');
const POTIONS = () => Object.values(ITEMS).filter((d) => d.type === 'use' && d.effect && !d.scroll);
const HUNTS = () => Object.values(MAPS).filter((m) => !m.isTown);

export function price(n) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace(/\.0$/, '')}m`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return `${n}`;
}

// Slots: each returns a phrase. `ctx` carries the speaker and the real player's name.
const SLOTS = {
  item: () => pick(GEAR()).name,
  // A party member talks about their own weapon; anyone else about whatever.
  weapon: (c) => c.weapon ?? pick(WEAPONS()).name,
  drop: () => pick(DROPS()).name,
  potion: () => pick(POTIONS()).name,
  map: () => pick(HUNTS()).name,
  town: () => MAPS[pick(TOWNS)].name,
  mob: () => pick(Object.values(MOBS)).name,
  mobs: () => `${pick(Object.values(MOBS)).name}s`,
  boss: () => pick(['Crystal King', 'Gnarlroot', 'Sylvana', 'Tamamo', 'Lilith', 'Selene']),
  queen: () => pick(['Sylvana', 'Tamamo', 'Lilith', 'Selene']),
  fish: (c) => c.fishName ?? pick(FISH).name,
  rarefish: () => pick(FISH.filter((f) => f.rarity >= 3)).name,
  cm: () => `${pick([12, 18, 24, 31, 38, 45, 52, 66, 80, 120, 240])}`,
  dish: () => pick(DISHES).name,
  set: () => pick(Object.values(SETS)).name,
  title: () => pick(ACHIEVEMENTS).title,
  plus: () => pick(['+3', '+5', '+6', '+7', '+8', '+9', '+10']),
  dungeon: () => 'Rootwood Hollow',
  emotew: () => pick(['dance', 'flip', 'cheer', 'flex', 'love']),
  npc: () => pick(Object.values(NPCS)).name,
  job: (c) => c.jobName ?? pick(Object.values(JOBS).filter((j) => !j.hidden && j.id !== 'novice')).name,
  price: () => price(pick([1, 2, 3, 5, 8, 12, 15, 25, 40, 60, 80, 120, 200, 350, 500, 750, 900, 1200, 2500]) * 1000),
  small: () => pick(['2', '3', '5', '10', '20', '50', '100']),
  lvl: (c) => `${Math.max(2, c.level + pick([1, 2, 3, 5, 10]))}`,
  mylvl: (c) => `${c.level}`,
  hours: () => pick(['2', '3', '4', '6', 'like 8', '10', '3am-']),
  me: (c) => c.player ?? 'friend',
  stat: () => pick(['STR', 'DEX', 'INT', 'LUK']),
  feel: () => pick(['so cute', 'so good', 'adorable', 'insane', 'kinda op', 'super pretty', 'cozy', 'actually great', 'too good']),
  emote: () => pick([':D', ':)', ';)', ':3', '^^', 'xD', ':P', 'uwu', '<3', 'B)', ':O', '>_<', 'owo', '^_^']),
  laugh: () => pick(['lol', 'lmao', 'haha', 'hehe', 'lolol', 'xD', 'hahaha', 'rofl', 'pfft']),
  hi: () => pick(['hi', 'hey', 'hello', 'heyo', 'hiya', 'yo', 'hai', 'sup', 'howdy', 'heya', 'oh hi']),
  bye: () => pick(['gtg', 'cya', 'bye all', 'logging off', 'gn everyone', 'ttyl', 'brb dinner', 'night!', 'off to bed', 'later']),
  yes: () => pick(['yes', 'yep', 'ya', 'yeah', 'ofc', 'sure', 'yesss', 'mhm']),
  wow: () => pick(['wow', 'omg', 'whoa', 'woah', 'no way', 'wait what', 'ooh', 'yooo']),
  adj: () => pick(['legendary', 'shiny', 'rare', 'epic', 'cute', 'cheap', 'clean', 'perfect', 'sparkly', 'max']),
  color: () => pick(['pink', 'mint', 'lavender', 'peach', 'gold', 'sky blue', 'white', 'black']),
};

// Templates by mood. {slot} fills in; some lines only fit some players (pros, newbies, shops).
const TEMPLATES = {
  lfg: [
    'LFG {map}', 'anyone wanna party at {map}?', 'need 1 more for {map}!', 'party for {mobs}, lvl {lvl}+', 'LF healer for {boss}', 'duo {map}? {emote}',
    'party at {map} pls', 'who wants to grind {mobs} with me', 'lf2m {map}', 'any {job} want to party?', 'free exp at {map} come', 'need a tank for {boss} lol',
  ],
  trade: [
    'WTS {item} {price}', 'WTB {drop} x{small}', 'selling {weapon}, pm offers', 'buying {potion}s cheap', 'WTT {item} for {item}', 'S> {item} {price} B> {drop}',
    'anyone selling {weapon}?', 'price check {item}?', 'WTB {adj} {weapon}, paying {price}', 'selling {drop} x{small} {price} each', '{item} for {price} or best offer', 'trading {item}, need {item}',
  ],
  question: [
    'how do i get to {town}?', 'where do {mobs} spawn?', 'is {weapon} good for a {job}?', 'what lvl for {map}?', 'which job is best?', 'how do u get {item}?',
    'where is {npc}?', 'what do i put my AP in', 'is {stat} good for {job}?', 'how long to lvl {lvl}?', 'does anyone know where {drop} drops', 'whats the best map at lvl {mylvl}?',
    'should i go {job} or {job}?', 'is the {boss} hard?', 'how do i use hotkeys', 'what does {potion} do?',
  ],
  smalltalk: [
    '{hi} everyone {emote}', 'this game is {feel}', 'love the {color} outfit someone has', '{town} is so pretty at night', 'just hit lvl {mylvl}!!', '{laugh} i fell off the rope again',
    'been grinding {mobs} for {hours} hours', 'the music here is {feel}', 'anyone else love {npc}?', 'my {weapon} finally dropped!!', 'ok {mobs} are {feel}', '{wow} that {job} aura',
    'snack break brb', 'who else is up late {laugh}', 'i keep dying to {mobs} {laugh}', 'the fountain here is {feel}', 'finally got my {job} job {emote}', '{town} > {town} fight me',
    'i just want a pet {mob} tbh', 'grats to whoever just leveled!', '{yes} finally done with that quest', 'the sunset in {town} {emote}',
  ],
  brag: [
    'just soloed {boss} {emote}', 'lvl {mylvl} {job} btw', '{adj} {weapon} finally', 'who needs a carry? {emote}', 'max {stat} build ftw', 'farming {map} for fun now',
    'got a legendary {item} drop today', 'anyone wanna see my {weapon}?', '{boss} in under a minute B)', 'first {job} on the server ;)',
  ],
  newbie: [
    'how do i jump', 'what button attacks', 'where do i go first?', 'whats a hotkey', 'this is my first day {emote}', 'how do i talk to {npc}',
    'is {mob} dangerous?', 'how do i get money', 'im lost lol', 'what does AP mean', 'whats the {town}?', 'omg i leveled!',
  ],
  shop: [
    'come see my shop!', 'shop open: {item} and more', 'cheap stuff at my shop {emote}', 'selling my loot, come look', 'everything must go!!', 'new stock in my shop',
    'shop here, {adj} prices', 'my shop has {item}', 'browse my shop pls {emote}', 'clearing my bag, cheap!',
  ],
  greet: [
    '{hi} {me}!', '{hi} {me} {emote}', 'oh {hi} {me}', 'love your outfit {me}!', 'nice weapon {me}', '{me}!! {emote}', 'hey {me}, wanna party sometime?',
    '{hi}! cute look {me}', 'yo {me} whats ur lvl', '{me} hii {emote}', 'sup {me}', 'heya {me}, good luck out there',
  ],
  party: [
    'nice!', 'gj {me}', 'ty for the party {emote}', 'brb pot', '{laugh} that {mob}', 'this spot is good', 'go go go', 'omg crit', 'ez',
    'almost lvl up!', 'ooh a drop', 'my {weapon} hits so hard here', 'ur so strong {me}', 'lets do {map} after', 'one more round?', 'loot is yours {me}',
    'party exp is so good', 'love this party {emote}', 'careful {me}!', 'i got aggro lol', 'wait for me', 'so many {mobs}', 'grinding with friends > solo', 'nice combo',
  ],
  joined: ['{yes}! {emote}', 'omg ty for the invite', 'sure, lets go!', 'yay party!', 'ok im in {emote}', 'lets grind {me}!', 'thx {me}!!', 'ooh ok'],
  declined: ['sry cant rn', 'no ty', 'afk soon sorry', 'maybe later!', 'busy rn {emote}', 'im good solo ty', 'not rn sry'],
  tooHigh: ['ur a bit low for me sry', 'lvl gap too big lol', 'cant, u wouldnt get exp where i grind', 'come back when ur stronger {emote}', 'too low lvl sry'],
  shopBusy: ['cant, running my shop', 'shop open sry', 'i gotta watch my shop', 'busy selling {emote}'],
  levelUp: ['LVL UP!!', 'ding!! {emote}', 'lvl {mylvl}!!', 'leveled!! ty party', 'ding {mylvl} {emote}'],
  leaving: ['gtg, ty for the party!', 'thx for the pt {me}!', 'that was fun, cya!', 'ty! logging off', 'gg party {emote}'],
  thanks: ['ty!!', 'thanks {emote}', 'tysm', 'enjoy it!', 'pleasure doing business', 'thx {me}!', 'have fun with it!', 'ty, come again {emote}'],
  fishing: [
    'anyone know where {rarefish} bites?', 'just caught a {fish}, {cm} cm {emote}', 'fishing at the harbor pier is so relaxing', 'my rod is my main weapon now {laugh}',
    'WTB {fish} x{small}', 'selling {fish}, fresh!', 'still no {rarefish} after {hours} hours', 'the bobber dipped and i panicked {laugh}', 'fish book {small}/13 lets gooo',
    'Frozen Peak fishing hits different', 'the springs have Steamfins, so warm {emote}', 'who caught the {cm} cm one??',
  ],
  cooking: [
    'made {dish} {emote}', 'anyone wanna try my {dish}?', 'perfect stir!! 3 servings', 'what does {dish} do?', '{dish} + grind = so much exp', 'cooking is my new hobby {emote}',
    'i burned it {laugh} jk only Good', 'need {fish} for {dish}', 'the stove in {town} is so cozy', 'WTB {dish}',
  ],
  story: [
    'just beat {queen}\'s trial!!', '{queen} is so pretty tho', 'chapter {small} of the story was so sweet', 'is Hayate waking up soon?', 'cried a little at the {queen} cutscene ngl',
    'the {queen} rematch is back on her map!', 'Mira is the best {emote}', 'wait the wind STOPPED?? thats the plot??', '{queen} rematch dropped my {set} piece!!',
  ],
  dungeon: [
    'LF group {dungeon}!', 'anyone run {dungeon} with me?', 'the Hollow Heart is so cute when its asleep', 'need a healer for {dungeon} pls', 'hard mode {dungeon} anyone?',
    'got a {set} piece from the {dungeon} chest {emote}', 'the boar den room {laugh}', 'tank here, lf {dungeon}', 'cleared {dungeon} in {small} min B)',
  ],
  gear: [
    'finally full {set} set!!', 'is the {set} aura cute or what', 'polished to {plus} {emote}', 'Tora failed my polish {small} times {laugh}', 'just got the {title} title',
    'which title do u guys wear?', 'love my {set} hat', 'monster book {small} cards done', 'WTS {set} piece, wrong job', 'the fox tails on Foxfire omg',
  ],
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
  for (let i = 0; i < 10; i++) {
    const line = voice(fill(pick(REPLIES[kind], rng), ctx), style, rng);
    if (!memory.has(line)) {
      memory.add(line);
      return line;
    }
  }
  return voice(fill(pick(REPLIES[kind], rng), ctx), style, rng);
}

// A line of our own (an answer) in a player's voice, its {slots} filled.
export function voiced(line, ctx, style, rng = Math.random) {
  return voice(fill(line, ctx), style, rng);
}

// A little chat between two players: the lines in order, filled in.
export function conversation(ctx, rng = Math.random) {
  return pick(CONVERSATIONS, rng).map((l) => fill(l, ctx));
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
  if (has(w, ['cook', 'stove', 'recipe', 'food'])) return 'every town has a stove, press up at it. stop the spoon in the middle for 3 servings!';
  if (has(w, ['polish', 'enhance', 'upgrade'])) return 'Tora in Ember Crag polishes gear up to +10, gets harder each step tho';
  if (has(w, ['set', 'sets'])) return 'queens drop set pieces for ur job, and the Hollow chest gives Rootwood. full set = aura!';
  if (has(w, ['title', 'achievement', 'collection', 'book'])) return 'press B for the Collection, achievements give titles to wear';
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

function fill(template, ctx) {
  return template.replace(/\{(\w+)\}/g, (_, k) => (SLOTS[k] ? SLOTS[k](ctx) : k));
}

// A fresh line for `kind` (a mood), never one already said this session.
export function speak(memory, kind, ctx, style, rng = Math.random) {
  for (let i = 0; i < 12; i++) {
    const line = voice(fill(pick(TEMPLATES[kind], rng), ctx), style, rng);
    if (!memory.has(line)) {
      memory.add(line);
      return line;
    }
  }
  return null;
}

// What a player feels like saying, given who they are.
export function moodFor(bot, rng = Math.random) {
  if (bot.party && rng() < 0.7) return 'party';
  if (bot.shop && rng() < 0.55) return 'shop';
  if (bot.level < 12 && rng() < 0.55) return 'newbie';
  if (bot.pro && rng() < 0.4) return 'brag';
  const r = rng();
  if (r < 0.12) return 'lfg';
  if (r < 0.26) return 'trade';
  if (r < 0.38) return 'question';
  if (r < 0.46) return 'fishing';
  if (r < 0.52) return 'cooking';
  if (r < 0.6) return bot.level >= 18 ? 'story' : 'smalltalk';
  if (r < 0.66) return bot.level >= 12 ? 'dungeon' : 'smalltalk';
  if (r < 0.74) return bot.level >= 15 ? 'gear' : 'smalltalk';
  return 'smalltalk';
}
