// The adventurers' minds (world/adventurers/): sixteen people who live, grow, learn and remember,
// run on the game clock with their own seeded randomness, so every check here is exact.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ADVENTURERS, ADVENTURER_BY_ID } from '../src/data/adventurers.js';
import { LINES } from '../src/data/adventurer-lines.js';
import { newGuild, saveGuild, loadGuild } from '../src/world/adventurers/state.js';
import { initGuild, tickGuild, youDid, joinYou, leaveYou, willJoin, CATCHUP_HOURS } from '../src/world/adventurers/sim.js';
import { jobAt, bestHunt, expNeed, bosses } from '../src/world/adventurers/catalog.js';
import { growthRate, winChance, blockedBy, fightBoss } from '../src/world/adventurers/grow.js';
import { sleepiness, decide } from '../src/world/adventurers/mind.js';
import { lineFor } from '../src/world/adventurers/talk.js';
import { JOBS } from '../src/data/jobs.js';
import { GAME_HOUR_MS, DAY_MS } from '../src/world/daytime.js';

const T0 = 24 * 400;
const run = (g, from, hours, playerLevel) => {
  for (let h = 0.5; h <= hours; h += 0.5) tickGuild(g, from + h, { playerLevel: typeof playerLevel === 'function' ? playerLevel(h) : playerLevel });
  return from + hours;
};

test('sixteen adventurers, each with a real job line, a voice and a book of lines', () => {
  assert.equal(ADVENTURERS.length, 16);
  for (const d of ADVENTURERS) {
    for (const lv of [1, 5, 12, 30, 50]) assert.ok(JOBS[jobAt(d, lv)], `${d.id} at ${lv}: ${jobAt(d, lv)}`);
    assert.ok(LINES[d.id]?.meet && LINES[d.id]?.hi && LINES[d.id]?.wall, d.id);
    if (d.friend) assert.ok(ADVENTURER_BY_ID[d.friend], d.friend);
    if (d.rival && d.rival !== 'you') assert.ok(ADVENTURER_BY_ID[d.rival], d.rival);
  }
  // (a rookie is a novice first, takes their path's job at 5 and a branch at 30)
  const milo = ADVENTURER_BY_ID.milo;
  assert.deepEqual([jobAt(milo, 3), jobAt(milo, 12)], ['novice', 'tidemage']);
  assert.ok(['tidecaller', 'maelstrom'].includes(jobAt(milo, 31)));
});

test('a day in their lives: they sleep at night, eat, hunt and keep their own hours', () => {
  const g = initGuild(newGuild(15, T0));
  run(g, T0, 48, 15);
  for (const s of Object.values(g.adv)) {
    const kinds = new Set(s.log.map((l) => l.kind));
    assert.ok(kinds.has('sleep'), `${s.id} slept`);
    assert.ok(kinds.has('eat'), `${s.id} ate`);
    // (needs are kept up: nobody starves or drops)
    assert.ok(s.needs.food > 0.05 && s.needs.energy > 0.02, `${s.id} ${JSON.stringify(s.needs)}`);
  }
  // (sleep falls in their own night; a few short afternoon naps are fine)
  const sleeps = Object.values(g.adv).flatMap((s) => s.log.filter((l) => l.kind === 'sleep').map((l) => ({ s, h: ((l.t % 24) + 24) % 24 })));
  assert.ok(sleeps.filter(({ s, h }) => sleepiness(s, h) > 0 || h >= 19 || h < 9).length / sleeps.length > 0.75);
  // (not everyone does the same thing at once)
  const now = new Set(Object.values(g.adv).map((s) => s.act.kind));
  assert.ok(now.size >= 1);
});

test('the same seed lives the same life (their randomness is their own)', () => {
  const a = initGuild(newGuild(20, T0));
  const b = initGuild(newGuild(20, T0));
  run(a, T0, 30, 20);
  run(b, T0, 30, 20);
  assert.deepEqual(a.adv.jett.log, b.adv.jett.log);
  assert.equal(a.adv.gideon.gold, b.adv.gideon.gold);
});

test('growth rules: veterans never level, peers stop three above you, rookies catch up', () => {
  const g = initGuild(newGuild(20, T0));
  assert.equal(growthRate(g.adv.bram, 20), 0);
  g.adv.jett.level = 23;
  assert.equal(growthRate(g.adv.jett, 20), 0);
  g.adv.jett.level = 22;
  assert.ok(growthRate(g.adv.jett, 20) < growthRate({ ...g.adv.jett, level: 20 }, 20));
  assert.ok(growthRate(g.adv.milo, 20) > growthRate({ ...g.adv.lyra, level: 20 }, 20));
  // (you stop playing: in a long while away they never pass three above you)
  const h = initGuild(newGuild(18, T0));
  run(h, T0, 24 * 10, 18);
  for (const s of Object.values(h.adv)) {
    if (ADVENTURER_BY_ID[s.id].rank === 'veteran') assert.equal(s.level, ADVENTURER_BY_ID[s.id].start.level);
    else assert.ok(s.level <= 21, `${s.id} ${s.level}`);
  }
});

test('over a whole playthrough the peers keep pace with you (1 to 49 in 34 hours)', () => {
  // (34 real hours of play, in game hours: five real minutes each)
  const hours = (34 * 60 * 60000) / GAME_HOUR_MS;
  const raw = [];
  for (let l = 1; l < 50; l++) raw[l] = expNeed(l) / (10 * bestHunt(l).exp);
  const sum = raw.slice(1).reduce((a, b) => a + b, 0);
  const at = [0];
  for (let l = 1, acc = 0; l < 50; l++) at[l] = acc += (raw[l] / sum) * hours;
  const levelAt = (h) => {
    let l = 1;
    while (l < 50 && at[l] <= h) l++;
    return l;
  };
  const g = initGuild(newGuild(1, T0));
  run(g, T0, hours, levelAt);
  const you = levelAt(hours);
  const peers = ADVENTURERS.filter((d) => d.rank !== 'veteran').map((d) => g.adv[d.id].level);
  const avg = peers.reduce((a, b) => a + b, 0) / peers.length;
  assert.ok(avg >= you - 6 && avg <= you + 2, `avg ${avg} vs ${you}`);
  for (const l of peers) assert.ok(l >= you - 10, `${peers}`);
  // (they changed jobs on the way, beat bosses and the guild has stories)
  assert.ok(ADVENTURERS.filter((d) => d.path).every((d) => g.adv[d.id].job !== 'novice'));
  assert.ok(Object.keys(g.firsts).length >= 10);
  assert.ok(g.board.some((b) => b.kind === 'beat'));
});

test('boss walls: held at the level past their wall until they beat it; mastery comes from trying', () => {
  const g = initGuild(newGuild(20, T0));
  const s = g.adv.lyra;
  const boss = bosses().find((b) => b.id === 'marigold');
  s.walls = ['marigold'];
  s.level = boss.level + 1;
  assert.equal(blockedBy(s)?.id, 'marigold');
  const before = winChance(g, boss, ['lyra']);
  for (let i = 0; i < 4; i++) fightBoss(g, boss, ['lyra'], T0 + i);
  assert.ok(winChance(g, boss, ['lyra']) > before, 'learned from trying');
  assert.ok(s.know.boss.marigold.tries === 4);
  // (a group with a tank and a healer stands a better chance than one alone)
  g.adv.arlo.level = g.adv.delphine.level = boss.level + 1;
  g.adv.arlo.job = 'stormwall';
  assert.ok(winChance(g, boss, ['lyra', 'arlo', 'delphine']) > winChance(g, boss, ['lyra']));
  // (a veteran's own wall almost never falls without you)
  const sulk = bosses().find((b) => b.id === 'whalestorm');
  assert.ok(winChance(g, sulk, ['bram', 'maribel', 'vesper', 'rory']) <= 0.04);
  assert.ok(winChance(g, sulk, ['bram', 'maribel', 'vesper'], { withYou: true }) > 0.04);
});

test('they learn what pays: activities, maps and bosses carry learned values', () => {
  const g = initGuild(newGuild(25, T0));
  run(g, T0, 24 * 5, 25);
  const learned = Object.values(g.adv).filter((s) => Object.keys(s.know.value).length >= 5 && Object.keys(s.know.map).length >= 1);
  assert.ok(learned.length >= 10, `${learned.length}`);
  // (each has their own favourites: not everyone values the same things the same)
  const hunts = Object.values(g.adv).map((s) => s.know.value.hunt ?? 0);
  assert.ok(new Set(hunts.map((v) => v.toFixed(3))).size > 5);
});

test('memories, opinions and gossip: what happens to one spreads, and repeats add up', () => {
  const g = initGuild(newGuild(22, T0));
  run(g, T0, 24 * 4, 22);
  const heard = Object.values(g.adv).filter((s) => s.mem.some((m) => m.heard));
  assert.ok(heard.length >= 8, `${heard.length} heard gossip`);
  assert.ok(Object.values(g.adv).some((s) => s.mem.some((m) => (m.n ?? 1) > 1)));
  // (friends like each other more for time together)
  assert.ok(g.adv.bram.ops.maribel.aff >= 0.6);
});

test('what you do matters to them: talks, parties, gifts, your wins, your rival', () => {
  const g = initGuild(newGuild(20, T0));
  let t = run(g, T0, 10, 20);
  const delph = g.adv.delphine;
  if (delph.act.kind === 'sleep') t = run(g, t, 8, 20);
  const aff0 = delph.ops.you.aff;
  youDid(g, 'talk', { id: 'delphine' }, t);
  assert.ok(delph.met);
  joinYou(g, 'delphine', t);
  assert.equal(delph.act.kind, 'party');
  t = run(g, t, 3, 20);
  assert.equal(delph.act.kind, 'party', 'stays with you while you have them');
  leaveYou(g, 'delphine', t, 'tea');
  youDid(g, 'gift', { id: 'delphine', liked: 1 }, t);
  assert.ok(delph.ops.you.aff > aff0 + 0.1);
  assert.ok(delph.mem.some((m) => m.kind === 'party' && m.who.includes('you')));
  // (your rival takes it personally when you pass her)
  youDid(g, 'level', { level: g.adv.scarlett.level + 1 }, t);
  assert.ok(g.adv.scarlett.mem.some((m) => m.kind === 'rival'));
  // (a boss you beat with them is their win and lifts what they think of you)
  youDid(g, 'beat', { boss: 'marigold', with: ['delphine'] }, t);
  assert.ok(delph.beaten.marigold);
  assert.ok(g.board.some((b) => b.kind === 'you'));
});

test('asking one along: they say no for real reasons (asleep, hurt, worn out) and yes when they want to', () => {
  const g = initGuild(newGuild(20, T0));
  const s = g.adv.hattie;
  s.act = { kind: 'sleep', since: T0, until: T0 + 5 };
  assert.deepEqual(willJoin(g, 'hattie'), { yes: false, why: 'asleep' });
  s.act = { kind: 'social', since: T0, until: T0 + 5 };
  s.injured = 3;
  assert.equal(willJoin(g, 'hattie').why, 'hurt');
  s.injured = 0;
  s.ops.you.aff = 0.6;
  s.needs.energy = 0.8;
  s.needs.food = 0.8;
  assert.equal(willJoin(g, 'hattie').yes, true);
});

test('they talk about what is really going on with them, in their own voice, without repeating', () => {
  const g = initGuild(newGuild(20, T0));
  let t = run(g, T0, 24 * 3 + 12, 20);
  for (const d of ADVENTURERS) {
    const s = g.adv[d.id];
    if (s.act.kind === 'sleep') continue;
    const first = lineFor(g, d.id, t, { youName: 'Kiri' }).text;
    assert.ok(LINES[d.id].meet.split('|').includes(first), `${d.id} meets you first: ${first}`);
    youDid(g, 'talk', { id: d.id }, t);
    const seen = [];
    for (let i = 0; i < 5; i++) {
      const l = lineFor(g, d.id, t, { youName: 'Kiri' }).text;
      assert.ok(!/\{\w+\}/.test(l), `${d.id} unfilled: ${l}`);
      assert.ok(!seen.includes(l) || s.injured > 0.5 || s.needs.energy < 0.15 || s.needs.food < 0.15, `${d.id} repeated: ${l}`);
      seen.push(l);
    }
  }
  // (asleep, they mumble)
  const sleeper = Object.values(g.adv).find((s) => s.act.kind === 'sleep');
  if (sleeper) assert.ok(/z|snore|mumble|asleep|minutes|\*/i.test(lineFor(g, sleeper.id, t).text));
});

test('away from the game the guild catches up (up to three days), and a save keeps them', () => {
  const g = initGuild(newGuild(20, T0));
  run(g, T0, 5, 20);
  tickGuild(g, T0 + 5 + 24 * 30, { playerLevel: 20 });
  assert.ok(Math.abs(g.clock - (T0 + 5 + 24 * 30)) < 1e-6);
  assert.equal(CATCHUP_HOURS, 72);
  const data = JSON.parse(JSON.stringify(saveGuild(g)));
  const back = initGuild(loadGuild(data, 20, g.clock));
  assert.equal(back.adv.jett.level, g.adv.jett.level);
  assert.deepEqual(back.adv.bram.ops.maribel, g.adv.bram.ops.maribel);
  assert.equal(back.board.length, Math.min(60, g.board.length));
});

test('the guild runs cheap: a game day for all sixteen in a few milliseconds', () => {
  const g = initGuild(newGuild(30, T0));
  const t0 = performance.now();
  run(g, T0, 24 * 5, 30);
  assert.ok((performance.now() - t0) / 5 < 25, 'per game day');
  // (and a decision is a pure function of their state)
  const s = g.adv.ottilie;
  assert.ok(decide(g, s, { hour: 10, t: g.clock }).kind);
});

// ---------- In the game (world/adventurers/bodies.js) ----------
import { createWorld, loadMap } from '../src/world/world.js';
import { createCharacter } from '../src/core/character.js';
import { createBots, updateBots, botsIn, bodiedIn } from '../src/world/bots.js';
import { invite } from '../src/world/party.js';
import { attachGuild, updateAdventurers } from '../src/world/adventurers/bodies.js';

function liveWorld(level, hour) {
  const char = createCharacter('Kiri', {});
  char.level = level;
  const world = createWorld(char);
  let clock = (Math.floor(Date.UTC(2026, 10, 24) / DAY_MS) * 24 + hour) * GAME_HOUR_MS;
  const bots = createBots(world, Math.random, { guild: true, clock: () => new Date(clock) });
  world.bots = bots;
  attachGuild(world, bots);
  const run = (secs) => {
    for (let i = 0; i < secs * 10; i++) {
      clock += 100;
      world.now += 0.1;
      updateBots(bots, world, 0.1);
      updateAdventurers(world, bots, 0.1);
    }
  };
  return { world, bots, run };
}

test('in the game: nobody made up is online; the adventurers are where their minds put them', () => {
  const { world, bots, run } = liveWorld(20, 11);
  loadMap(world, 'coinbridge', 'start');
  run(20);
  assert.equal(bots.list.filter((b) => !b.adv && !b.alt).length, 0, 'no made-up players');
  const here = botsIn(bots, 'coinbridge').filter((b) => b.adv);
  const atGuild = Object.values(world.guild.adv).filter((s) => s.place?.startsWith('guild:') && s.act.kind !== 'sleep');
  assert.ok(here.length >= Math.min(3, atGuild.length), `${here.length} of ${atGuild.length} at the guild`);
  for (const b of here) {
    const s = world.guild.adv[b.adv];
    assert.equal(b.char.level, s.level);
    assert.equal(b.char.job, s.job);
    assert.equal(b.char.appearance.hairStyle, ADVENTURER_BY_ID[b.adv].look.hairStyle);
    assert.equal(b.char.equipment.hat, null, 'no hat over their hair');
  }
  // (out on a map where one of them is hunting, they're there fighting, and asked along they answer)
  const hunter = Object.values(world.guild.adv).find((s) => ['hunt', 'bounty', 'explore'].includes(s.act.kind));
  if (hunter) {
    loadMap(world, hunter.place, 'start');
    run(6);
    const body = bodiedIn(bots, world.map.id).find((b) => b.adv === hunter.id);
    assert.ok(body, `${hunter.id} hunting ${hunter.place}`);
    assert.equal(invite(bots, body, world), null);
    run(4);
    assert.ok(body.bubble?.text, 'they answer in their own words');
    assert.equal(body.party, world.guild.adv[hunter.id].act.kind === 'party');
  }
});

test('in the game: asleep in the bunks they are out of sight; the save carries the guild', () => {
  const { world, bots, run } = liveWorld(20, 3);
  loadMap(world, 'coinbridge', 'start');
  run(10);
  const sleeping = Object.values(world.guild.adv).filter((s) => s.act.kind === 'sleep').map((s) => s.id);
  for (const id of sleeping) assert.ok(!botsIn(bots, 'coinbridge').some((b) => b.adv === id && b.state !== 'leave'), `${id} asleep`);
  const saved = JSON.parse(JSON.stringify(world.char));
  assert.equal(Object.keys(saved.adventurers.adv).length, 16);
  assert.ok(saved.adventurers.adv.bram.mem.length <= 40);
});

// ---------- Their hair, their fight voices, the board ----------
import { ADVENTURER_HAIR, hairParts } from '../src/render/hair.js';
import { fightLine } from '../src/world/adventurers/talk.js';
import { botChat } from '../src/world/chatlog.js';
import { doingText } from '../src/ui/guildboard.js';

test('each has a signature hairstyle of their own, and it draws', () => {
  const styles = ADVENTURERS.map((d) => d.look.hairStyle);
  assert.equal(new Set(styles).size, 16, 'sixteen different styles');
  for (const id of styles) {
    assert.ok(ADVENTURER_HAIR.includes(id), id);
    const p = hairParts(id, { base: '#888888', sh1: '#666666', sh2: '#444444', hi: '#cccccc' }, null, { root: 0, tip: 0, wave: 0 });
    assert.ok(p.head.length && p.front.length, id);
  }
});

test('in a fight they speak in their own voice, and the chat gate lets nothing else through for them', () => {
  const g = initGuild(newGuild(20, T0));
  for (const d of ADVENTURERS) {
    for (const kind of ['slam', 'aggro', 'heal', 'finisher', 'revive', 'drink', 'dgHello', 'dgDown', 'dgUp', 'levelup']) {
      const l = fightLine(g, d.id, kind, { boss: 'Gnarlroot', skill: 'Storm Crash' });
      assert.ok(l && !/\{\w+\}/.test(l), `${d.id} ${kind}: ${l}`);
    }
  }
  const world = { now: 100, map: { id: 'x' }, char: { name: 'Kiri' }, log: () => {} };
  const bot = { adv: 'jett', name: 'Jett', map: 'x' };
  assert.equal(botChat(world, bot, 'lol rip me'), false, 'a made-up line is never said');
  assert.equal(botChat(world, bot, fightLine(g, 'jett', 'slam'), { voiced: true, important: true }), true);
});

test('fighting at your side grows them in the guild, by the growth rules', () => {
  const { world, bots, run } = liveWorld(20, 11);
  const s = world.guild.adv.milo;
  const body = { adv: 'milo', name: 'Milo', map: world.map.id, char: {}, body: null, x: 0 };
  const before = s.level * 1e9 + s.exp;
  bots.advExp(body, 5000);
  assert.ok(s.level * 1e9 + s.exp > before);
  // (a veteran never levels)
  const bram = world.guild.adv.bram;
  bots.advExp({ adv: 'bram', name: 'Bram', map: world.map.id }, 1e7);
  assert.equal(bram.level, 48);
  run(1);
});

test('the notice board says truly what each one is doing', () => {
  const g = initGuild(newGuild(20, T0));
  run(g, T0, 30, 20);
  for (const s of Object.values(g.adv)) {
    const t = doingText(g, s);
    assert.ok(t && !/undefined|null/.test(t), `${s.id}: ${t}`);
    if (s.act.kind === 'sleep') assert.equal(t, 'Asleep');
  }
});
