// Players with lives of their own.
//
//   - Regulars: the players you meet are remembered (saved with your character). Next time you
//     play some of them are back, grown: levels gained since you last saw them (more the longer
//     it's been), a new job once they reach it. They remember you, come over, and tell you about it.
//   - Asking for help: now and then a player is stuck on a quest and asks around. Right-click
//     them (Help) and they join your party; hunt their monsters together and they thank you with a
//     gift (and remember it).
//   - Weather: rain or snow comes and goes on each map. In the rain the players in town put up
//     umbrellas and grumble; in the snow they start snowball fights.
//   - Photographers: a player poses at a landmark while a friend takes the picture, and asks you
//     to get in it (stand by them: the photo's yours too, in the Collection).
//   - Music jams: a few players gather and play, notes floating up, others dancing round them.
//   - Cosplay: a player dresses up as a townsperson (or a queen) and plays the part.

import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { MAPS } from '../data/maps.js';
import { LANDMARKS } from '../render/landmarks.js';
import { queenStyle } from './story.js';
import { snapshot, remake } from './buddies.js';
import { joinParty, partyMembers } from './party.js';
import { addItem } from '../core/inventory.js';
import { jobChain } from '../data/jobs.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);
const WALK = 46;
const REGULARS_MAX = 30;

function walk(bot, x, dt) {
  const d = x - bot.x;
  if (Math.abs(d) < 3) return true;
  bot.facing = Math.sign(d);
  bot.x += Math.sign(d) * Math.min(Math.abs(d), WALK * 1.3 * dt);
  bot.moving = true;
  return false;
}

const free = (b, world) => b.map === world.map.id && b.state === 'idle' && !b.shop && !b.party && !b.hunter && !b.legend && !b.drama && !b.event && !b.life;

function release(bot, rng) {
  bot.life = null;
  bot.state = 'idle';
  bot.timer = between(2, 5, rng);
}

function shout(world, bot, line) {
  bot.bubble = { text: line, t: 4.5 };
  if (bot.map === world.map.id) world.log?.(`${bot.name}: ${line}`, '#e6dcff');
}

function later(bot, at, line) {
  bot.sayAt = at;
  bot.sayLine = line;
  bot.sayShout = true;
}

// ---------- Regulars ----------

export const regularsOf = (char) => (char.regulars ??= []);

// Remembers a player you've met (or brings what we know of them up to date).
export function remember(world, bot, why = 'met') {
  if (!bot.char || bot.gm || bot.merchant || bot.legend) return;
  const list = regularsOf(world.char);
  // (The server's clock: the real time, pinned in tests.)
  const now = world.bots?.clock?.().getTime() ?? Date.now();
  let r = list.find((x) => x.name === bot.name);
  if (!r) {
    r = { ...snapshot(bot), metLevel: bot.char.level, metAt: now, times: 0, why };
    list.unshift(r);
    list.length = Math.min(list.length, REGULARS_MAX);
  }
  Object.assign(r, { level: bot.char.level, jobs: jobChain(bot.char.job).filter((j) => j !== 'novice'), seen: now });
  if (why === 'helped') r.helped = true;
  bot.regular = r;
  return r;
}

const SECOND = { warrior: ['paladin', 'berserker'], archer: ['beastmaster', 'stormcaller'], thief: ['shinobi', 'kitsune'], spiritmage: ['shrinemaiden', 'onmyoji'] };

// What they've been up to since you saw them: levels (more the longer it's been), and a job
// when they reach one. Returns what changed.
export function grow(r, now, rng) {
  const hours = Math.max(0, (now - (r.seen ?? now)) / 3.6e6);
  const was = { level: r.level, job: r.jobs?.at(-1) ?? 'novice' };
  if (hours < 0.25) return null;
  r.level = Math.min(70, r.level + Math.max(1, Math.round(Math.min(15, hours * between(0.3, 1.2, rng)))));
  r.jobs = [...(r.jobs ?? [])];
  if (r.level >= 10 && !r.jobs.length) r.jobs.push(pick(Object.keys(SECOND), rng));
  if (r.level >= 30 && r.jobs.length === 1 && SECOND[r.jobs[0]]) r.jobs.push(pick(SECOND[r.jobs[0]], rng));
  r.seen = now;
  return { from: was.level, to: r.level, job: r.jobs.at(-1) !== was.job ? r.jobs.at(-1) : null };
}

// Logging in: a few of the regulars are on today, grown since last time.
function regularsLogIn(L, bots, world, hooks) {
  const rng = bots.rng;
  const list = regularsOf(world.char).filter((r) => !bots.list.some((b) => b.name === r.name) && !(world.char.buddies ?? []).some((f) => f.name === r.name));
  const n = Math.min(list.length, 2 + Math.floor(rng() * 3));
  for (const r of [...list].sort(() => rng() - 0.5).slice(0, n)) {
    const changed = grow(r, hooks.now(), rng);
    const bot = hooks.logIn({ name: r.name, char: remake(r, hooks.makeChar, rng), guild: r.guild, style: r.style, title: r.title });
    if (!bot) continue;
    bot.regular = r;
    r.times = (r.times ?? 0) + 1;
    // They'll come and say hello when they see you, with their news.
    bot.news = hello(r, changed, world, rng);
  }
}

const JOB_CHEER = { paladin: 'finally paladin!!', berserker: 'berserker life now >:)', beastmaster: 'i have animal friends now', stormcaller: 'stormcaller gang', shinobi: 'shinobi now, cant see me', kitsune: 'look at my tails!!', shrinemaiden: 'shrine maiden now :3', onmyoji: 'onmyoji! i have a troupe', warrior: 'im a warrior now!', archer: 'archer now!', thief: 'thief now hehe', spiritmage: 'spirit mage now!' };

function hello(r, changed, world, rng) {
  const p = world.char.name;
  if (r.helped && rng() < 0.4) return `${p}! thanks again for helping me that time`;
  if (changed?.job) return `${p}!! ${JOB_CHEER[changed.job] ?? `${changed.job} now!`}`;
  if (changed && changed.to - (r.metLevel ?? changed.from) >= 3) return pick([`${p}! remember me? i was lv ${r.metLevel} when we met, lv ${changed.to} now :D`, `hey ${p}, long time no see! lv ${changed.to} now`], rng);
  return pick([`${p}!! hiii`, `oh hey ${p}, its been a while`, `${p}! u still play :D`], rng);
}

// A regular who sees you comes over with their news.
function greetings(L, bots, world) {
  if (!world.map.isTown) return;
  for (const b of bots.list) {
    if (!b.news || b.map !== world.map.id || b.state !== 'idle' || Math.abs(b.x - world.body.x) > 500) continue;
    b.state = 'approach';
    b.waved = true;
    b.hello = b.news;
    b.news = null;
  }
}

// Whoever spends time around you, or with you, is remembered.
function noticing(L, bots, world, dt) {
  for (const b of bots.list) {
    if (b.gone || !b.char || b.map !== world.map.id) continue;
    if (b.party || b.helped) {
      remember(world, b, b.helped ? 'helped' : 'party');
      continue;
    }
    const near = Math.abs((b.body?.x ?? b.x) - world.body.x) < 220;
    b.knownFor = (b.knownFor ?? 0) + (near ? dt : 0);
    if (b.knownFor > 45 && !b.regular) remember(world, b);
  }
}

// ---------- Asking for help ----------

const ASK = (mob, n) => [`can someone help me kill ${n} ${mob}s? for my quest`, `stuck on a quest... need ${n} ${mob}s, anyone?`, `help pls, ${mob}s are too strong for me`, `lf help with ${mob}s!! will pay`];

function askForHelp(L, bots, world) {
  const rng = bots.rng;
  if (L.ask || partyMembers(bots).length >= 5) return;
  const bot = pick(bots.list.filter((b) => free(b, world) && b.level >= 10 && b.level <= world.char.level + 5), rng);
  if (!bot) return;
  // A monster from a field near their level.
  const kinds = Object.values(MOBS).filter((d) => !d.boss && d.atk > 0 && Math.abs(d.level - bot.level) <= 6 && Object.values(MAPS).some((m) => !m.isTown && !m.dungeon && (m.spawns ?? []).some((s) => s.mob === d.id)));
  if (!kinds.length) return;
  const def = pick(kinds, rng);
  const n = 6 + Math.floor(rng() * 6);
  L.ask = { bot, mob: def.id, n, until: world.now + 90 };
  bot.helpAsk = L.ask;
  shout(world, bot, pick(ASK(def.name, n), rng));
  world.log?.(`(Right-click ${bot.name} to help them.)`, '#bff0dc');
}

// You said yes: they join your party, and you hunt their monsters together.
export function helpOut(bots, world, bot) {
  const ask = bot.helpAsk;
  if (!ask || bot.party) return;
  joinParty(bots, bot, world);
  bot.helpAsk = null;
  bots.lives.ask = null;
  bot.quest = { mob: ask.mob, n: ask.n, got: 0 };
  bot.bubble = { text: pick(['omg thank u!!', 'ur the best', 'yay lets go!'], bots.rng), t: 4 };
  world.log(`${bot.name} joined your party: help them hunt ${ask.n} ${MOBS[ask.mob].name}s.`, '#bff0dc');
  remember(world, bot, 'helped');
}

// Their monsters going down (yours or theirs).
export function questKill(bots, world, m) {
  for (const b of partyMembers(bots)) {
    const q = b.quest;
    if (!q || q.mob !== m.def.id || q.done) continue;
    q.got += 1;
    if (q.got === Math.ceil(q.n / 2)) b.bubble = { text: `${q.got}/${q.n}! halfway`, t: 3 };
    if (q.got < q.n) continue;
    q.done = true;
    b.helped = true;
    const gold = 300 + b.level * 40;
    world.char.gold += gold;
    addItem(world.char.inventory, 'elixir', 1);
    b.bubble = { text: pick(['QUEST DONE!! thank u so much', 'finally!! ur a lifesaver', 'done!! here, take this'], bots.rng), t: 5 };
    world.log(`${b.name} finished their quest! They give you ${gold} gold and an Elixir as thanks.`, '#ffe36b');
    world.juice.push({ type: 'confetti', x: b.body?.x ?? world.body.x, y: (b.body?.y ?? world.body.y) - 60, w: 80, count: 24 });
    remember(world, b, 'helped');
  }
}

// ---------- Weather ----------

const SNOWY = (map) => /snow|frost|ice|winter/.test(`${map.theme} ${map.id} ${JSON.stringify(map.look?.props ?? [])} ${JSON.stringify(map.deco ?? [])}`);

function weatherTick(L, bots, world, dt, hooks) {
  const rng = bots.rng;
  const map = world.map;
  if (map.dungeon || map.look?.ceiling) {
    world.weather = null;
    return;
  }
  if (L.weatherMap !== map.id) {
    L.weatherMap = map.id;
    L.weatherIn = 0;
  }
  L.weatherIn -= dt;
  if (L.weatherIn <= 0) {
    L.weatherIn = between(120, 300, rng);
    const month = hooks.now() ? new Date(hooks.now()).getMonth() : 0;
    const snow = SNOWY(map) || month === 11 || month === 0;
    const was = world.weather;
    world.weather = rng() < 0.3 ? (snow ? 'snow' : 'rain') : null;
    if (world.weather && world.weather !== was) world.log?.(world.weather === 'snow' ? `Snow starts to fall on ${map.name}.` : `It starts to rain on ${map.name}.`, '#bfe0ff');
    else if (!world.weather && was) world.log?.(`The ${was} stops.`, '#bfe0ff');
  }
  const here = bots.list.filter((b) => b.map === map.id && !b.gone && !b.party && !b.hunter);
  // Umbrellas up in the rain (and down again after).
  for (const b of here) {
    const want = world.weather === 'rain' && map.isTown && (b.umbrellaRoll ??= rng()) < 0.65;
    if (want && !b.umbrella && rng() < dt * 0.6) {
      b.umbrella = true;
      if (!b.bubble && rng() < 0.2) shout(world, b, pick(['ugh rain', 'good thing i brought an umbrella', 'my hair!!', 'rain = fishing weather'], rng));
    } else if (!want && b.umbrella) b.umbrella = false;
  }
  // Snowball fights.
  if (world.weather === 'snow' && map.isTown) {
    L.snowAt = (L.snowAt ?? 0) - dt;
    if (L.snowAt <= 0) {
      L.snowAt = between(1.2, 3, rng);
      const a = pick(here.filter((b) => free(b, world)), rng);
      const b = a && pick(here.filter((o) => o !== a && Math.abs(o.x - a.x) < 220 && Math.abs(o.x - a.x) > 30 && !o.shop), rng);
      if (a && b) {
        a.facing = Math.sign(b.x - a.x);
        a.emote = { pose: 'throw', t: 0, dur: 0.45 };
        world.juice.push({ type: 'snowball', x: a.x + a.facing * 8, y: map.groundY - 28, tx: b.x, ty: map.groundY - 26, delay: 0.2 });
        b.emote = { pose: 'guard', t: 0, dur: 0.5 };
        if (rng() < 0.3) later(b, world.now + 0.7, pick(['HEY', 'its on now', 'SNOWBALL FIGHT', 'right in the face!!', 'revenge!!'], rng));
      }
    }
  }
}

// ---------- Photographers ----------

// The sights worth a photo: a map's big landmarks, not its crates and fences.
const PROPS = new Set(['fence', 'crates', 'barrels', 'haystack', 'bowrack', 'weaponrack', 'dummy', 'archtarget', 'alleylamp', 'laundryline', 'brazier', 'runecircle', 'signpost', 'bones']);
const sight = (kind) => LANDMARKS[kind] && !PROPS.has(kind) && LANDMARKS[kind].h >= 50;

function photoShoot(L, bots, world) {
  const rng = bots.rng;
  const spots = (world.map.deco ?? []).filter((d) => sight(d[0]));
  if (!spots.length || L.shoot) return;
  const [kind, x] = pick(spots, rng);
  const pair = bots.list.filter((b) => free(b, world)).sort((a, b) => Math.abs(a.x - x) - Math.abs(b.x - x)).slice(0, 2);
  if (pair.length < 2) return;
  const [model, cam] = pair;
  L.shoot = { kind, x, model, cam, at: world.now + 12, asked: false };
  for (const b of pair) Object.assign(b, { life: 'photo', state: 'life' });
}

function shootTick(L, bots, world, dt) {
  const s = L.shoot;
  const rng = bots.rng;
  const { model, cam, x } = s;
  if (model.gone || cam.gone || model.life !== 'photo' || cam.life !== 'photo') {
    for (const b of [model, cam]) if (b.life === 'photo') release(b, rng);
    L.shoot = null;
    return;
  }
  const a = walk(model, x + 6, dt);
  const b = walk(cam, x + 70, dt);
  if (!(a && b)) return;
  model.facing = 1;
  cam.facing = -1;
  if (!s.asked) {
    s.asked = true;
    s.at = world.now + 7;
    const near = world.map.id === model.map && Math.abs(world.body.x - x) < 320;
    shout(world, cam, near ? `${world.char.name} get in the pic!! stand by ${model.name}` : 'ok pose!!');
    model.emote = { pose: 'cheer', t: 0, dur: 1.2 };
  }
  if (world.now < s.at) {
    cam.emote = { pose: 'aimshot', t: 0.3, dur: 1 };
    return;
  }
  shout(world, cam, pick(['say cheese!!', 'perfect!', 'cute!!', 'one more... ok done'], rng));
  model.emote = { pose: pick(['flip', 'cheer'], rng), t: 0, dur: 1 };
  world.juice.push({ type: 'screenflash', life: 0.08, color: '#ffffff' });
  // Standing in the shot: the photo's yours too.
  if (world.map.id === model.map && Math.abs(world.body.x - x) < 70 && !world.dead) {
    const pose = (name, c) => ({ name, look: c.appearance, equipment: c.equipment, outfit: c.outfit ?? {}, job: c.job, level: c.level });
    const photos = (world.char.photos ??= []);
    photos.unshift({ at: Date.now(), landmark: s.kind, name: world.map.name, map: world.map.id, mapName: world.map.name, people: [pose(world.char.name, world.char), pose(model.name, model.char)] });
    photos.length = Math.min(photos.length, 24);
    world.log?.(`You're in ${cam.name}'s photo! It's in your Collection (B, Photos).`, '#ffe36b');
    remember(world, model);
    remember(world, cam);
  }
  release(model, rng);
  release(cam, rng);
  L.shoot = null;
}

// ---------- Music jams ----------

function jam(L, bots, world) {
  const rng = bots.rng;
  const band = bots.list.filter((b) => free(b, world)).sort(() => rng() - 0.5).slice(0, 3);
  if (band.length < 3 || L.jam) return;
  const cx = Math.max(160, Math.min(world.map.width - 160, world.body.x + between(-200, 200, rng)));
  L.jam = { band, cx, until: world.now + between(25, 40, rng), noteAt: 0, fans: [] };
  band.forEach((b, i) => Object.assign(b, { life: 'jam', state: 'life', spot: cx + (i - 1) * 26 }));
  shout(world, band[0], pick(['jam session!!', 'who wants to hear a song', 'band practice in the plaza', 'music time :D'], rng));
}

function jamTick(L, bots, world, dt) {
  const J = L.jam;
  const rng = bots.rng;
  for (const b of J.band) if (b.life === 'jam' && walk(b, b.spot, dt)) {
    b.facing = Math.sign(J.cx - b.x) || 1;
    if (!b.emote) b.emote = { pose: pick(['bellshake', 'kagura', 'cheer', 'sleevefan'], rng), t: 0, dur: 1.1 };
  }
  if (world.now >= J.noteAt) {
    J.noteAt = world.now + between(0.3, 0.6, rng);
    const b = pick(J.band, rng);
    if (b.map === world.map.id) world.juice.push({ type: 'notes', x: b.x, y: world.map.groundY - 40, color: pick(['#ff8fc1', '#8fd3ff', '#ffe36b', '#9be08f', '#c9a6ff'], rng) });
  }
  // People drift over to dance.
  if (J.fans.length < 4 && rng() < dt * 0.4) {
    const f = pick(bots.list.filter((b) => free(b, world) && Math.abs(b.x - J.cx) < 500), rng);
    if (f) {
      Object.assign(f, { life: 'jam', state: 'life', spot: J.cx + (rng() < 0.5 ? -1 : 1) * between(50, 90, rng) });
      J.fans.push(f);
      if (rng() < 0.4) later(f, world.now + 1.5, pick(['this slaps', 'encore!!', 'play the town theme!', 'dance party', 'u guys should start a band'], rng));
    }
  }
  for (const f of J.fans) if (f.life === 'jam' && walk(f, f.spot, dt) && !f.emote) f.emote = { pose: pick(['kagura', 'flip', 'cheer'], rng), t: 0, dur: 1.1 };
  if (world.now < J.until) return;
  shout(world, J.band[0], pick(['thank u thank u', 'thats all folks!', 'same time tomorrow?'], rng));
  for (const b of [...J.band, ...J.fans]) if (b.life === 'jam') release(b, rng);
  L.jam = null;
}

// ---------- Cosplay ----------

function cosplay(L, bots, world) {
  const rng = bots.rng;
  const bot = pick(bots.list.filter((b) => free(b, world) && !b.costume), rng);
  if (!bot) return;
  if (rng() < 0.65) {
    const npc = pick(Object.values(NPCS).filter((n) => n.look), rng);
    bot.costume = { as: npc.name, look: npc.look, gear: npc.gear ?? null, lines: [npc.greeting?.split(/[.!?]/)[0] + '!', `im ${npc.name} now`, `${npc.name.toLowerCase()} cosplay, how do i look`] };
  } else {
    const id = pick(['sylvana', 'tamamo', 'lilith', 'selene'], rng);
    const q = queenStyle(id);
    const move = pick(q.moves, rng);
    bot.costume = { as: MOBS[id].name.split(',')[0], look: { hairColor: q.color, outfitColor: q.light }, gear: null, lines: [`${move.name}!! ...jk`, `i am ${MOBS[id].name.split(',')[0]}, bow before me`, 'queen cosplay, rate it'] };
  }
  bot.costumeUntil = world.now + between(60, 120, rng);
  bot.lineAt = world.now + 1;
  world.log?.(`${bot.name} is cosplaying as ${bot.costume.as}!`, '#ffd6f0');
  const o = pick(bots.list.filter((b) => b !== bot && b.map === world.map.id && !b.party && !b.hunter && !b.gone), rng);
  if (o) later(o, world.now + 3, pick([`omg fake ${bot.costume.as} lol`, 'the cosplay is so good', `${bot.costume.as}?? wait no`, '10/10 costume'], rng));
}

function costumeTick(L, bots, world) {
  const rng = bots.rng;
  for (const b of bots.list) {
    if (!b.costume) continue;
    if (world.now >= b.costumeUntil || b.party || b.hunter) {
      b.costume = null;
      continue;
    }
    if (world.now >= b.lineAt && b.map === world.map.id && !b.bubble) {
      b.lineAt = world.now + between(15, 30, rng);
      shout(world, b, pick(b.costume.lines, rng));
    }
  }
}

// ---------- Each frame ----------

// `hooks` (from world/bots.js): logIn(who), makeChar, now() (real time, ms).
export function updateLives(bots, world, dt, hooks) {
  const rng = bots.rng;
  const L = (bots.lives ??= { askIn: between(120, 300, rng), shootIn: between(60, 180, rng), jamIn: between(150, 360, rng), cosplayIn: between(120, 300, rng), weatherIn: 0 });
  if (!L.loggedIn) {
    L.loggedIn = true;
    regularsLogIn(L, bots, world, hooks);
  }
  world.onAnyKill = (m) => questKill(bots, world, m);
  noticing(L, bots, world, dt);
  greetings(L, bots, world);
  weatherTick(L, bots, world, dt, hooks);
  costumeTick(L, bots, world);
  if (L.ask && (world.now > L.ask.until || L.ask.bot.gone)) {
    if (L.ask.bot.helpAsk === L.ask) L.ask.bot.helpAsk = null;
    L.ask = null;
  }
  if (L.shoot) shootTick(L, bots, world, dt);
  if (L.jam) jamTick(L, bots, world, dt);
  // Anyone left from a shoot or a jam that's over goes back to normal.
  for (const b of bots.list) if ((b.life === 'photo' && !L.shoot) || (b.life === 'jam' && !L.jam)) release(b, rng);
  if (!world.map.isTown || world.dungeon) return;
  const tick = (key, lo, hi, fn) => {
    L[key] -= dt;
    if (L[key] > 0) return;
    L[key] = between(lo, hi, rng);
    fn();
  };
  tick('askIn', 240, 480, () => askForHelp(L, bots, world));
  tick('shootIn', 150, 300, () => photoShoot(L, bots, world));
  tick('jamIn', 300, 600, () => jam(L, bots, world));
  tick('cosplayIn', 240, 480, () => cosplay(L, bots, world));
}
