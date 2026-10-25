// Procedural chat for the other "players": a grammar of templates with slots (items, maps,
// monsters, towns, prices, levels, jobs, NPCs, the real player's name), spoken in each player's
// own style (caps, emoticons, slang, the odd typo). The combinations run into the millions, and a
// memory of recent lines keeps anything from being said twice in a session.

import { ITEMS } from '../data/items.js';
import { MAPS, TOWNS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { NPCS } from '../data/npcs.js';
import { JOBS } from '../data/jobs.js';

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
  weapon: () => pick(WEAPONS()).name,
  drop: () => pick(DROPS()).name,
  potion: () => pick(POTIONS()).name,
  map: () => pick(HUNTS()).name,
  town: () => MAPS[pick(TOWNS)].name,
  mob: () => pick(Object.values(MOBS)).name,
  mobs: () => `${pick(Object.values(MOBS)).name}s`,
  boss: () => 'Crystal King',
  npc: () => pick(Object.values(NPCS)).name,
  job: () => pick(Object.values(JOBS).filter((j) => !j.hidden && j.id !== 'novice')).name,
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
  bye: ['{bye}', '{bye} {emote}', 'ok {bye}', '{bye}, gl everyone'],
};

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
  if (r < 0.2) return 'lfg';
  if (r < 0.42) return 'trade';
  if (r < 0.6) return 'question';
  return 'smalltalk';
}
