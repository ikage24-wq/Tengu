// Raids and big moments with the other players.
//
//   - A boss on your map (a queen back for a rematch, the Crystal King on his throne): players
//     gather for it, a friend among them, and fight her with you. They call out her
//     moves as she shows them, dodge (mostly), and take the hit when they don't.
//   - A party combo: let your finisher loose and the members fighting by you join in with theirs,
//     a beat apart, each hitting harder for it.

import { inZone, isQueen } from './story.js';
import { hurtBot, joinCombo, partyMembers } from './party.js';
import { buddyOnline, buddiesOf } from './buddies.js';
import { botChat, stale } from './chatlog.js';
import { happened } from './chatter.js';

const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const between = (a, b, rng) => a + rng() * (b - a);

function say(bot, text) {
  if (text) bot.bubble = { text, t: 4 };
}

// The boss on this map right now, if any (one the players can join: not a trial or a dungeon).
export function raidBoss(world) {
  if (world.map.trial || world.dungeon || world.map.isTown) return null;
  return world.mobs.find((m) => m.hp > 0 && (isQueen(m) || m.def.boss)) ?? null;
}

// Everyone fighting alongside you here: other players hunting the map and your party.
const raiders = (bots, world) => bots.list.filter((b) => (b.hunter || b.party) && !b.gone && !b.down && b.body && b.map === world.map.id && b.state !== 'logout');

// ---------- Gathering ----------

// A boss shows up: word gets around and players come running (a friend who's online among
// them), a few seconds apart.
export function gather(bots, world, boss, hooks) {
  const rng = bots.rng;
  const name = boss.def.name.split(',')[0];
  world.log(`★ ${name} is on ${world.map.name}! Players are gathering.`, '#ffd6f0');
  const n = 3 + Math.floor(rng() * 2);
  const come = [];
  // A friend online drops what they're doing.
  const friend = buddiesOf(world.char).map((s) => buddyOnline(bots, s.name)).find((b) => b && !b.party && !b.hunter && b.state !== 'logout');
  if (friend && rng() < 0.7) {
    friend.gone = true;
    friend.quietGone = true;
    const b = hooks.addHunter({ name: friend.name, char: friend.char, guild: friend.guild, style: friend.style, title: friend.title });
    if (b) {
      b.buddy = true;
      world.log(`[Friend] ${b.name}: omw to help with ${name}!`, '#bfe0ff');
      come.push([b, pick(['im here!!', 'friend assist :D', 'lets do this together'], rng)]);
    }
  }
  // (A roll can come up a beginner who can't hunt yet: try again, a few times.)
  for (let tries = 0; come.length < n && tries < n * 3; tries++) {
    const b = hooks.addHunter(null);
    if (!b) continue;
    come.push([b, pick(['is she here?? lets gooo', 'raid time!', 'wait for me!!', 'boss!!', 'lfg lfg', 'who has pots'], rng)]);
  }
  come.forEach(([b, line], i) => {
    b.appear = 1 + i * 0.5;
    b.raid = true;
    b.sayAt = world.now + 0.8 + i * 1.6;
    b.sayLine = line;
  });
}

// ---------- During the fight ----------

const CALLS = {
  circle: ['circles!! spread out', 'move out of the circles', 'CIRCLES', 'dodge the circles!!'],
  floor: ['get on a ledge!!', 'FLOOR! go up go up', 'jump on a platform!'],
  low: ['JUMP', 'jump jump jump', 'hop over it!'],
  lane: ['line attack! move!', 'get out of the line', 'beam incoming'],
  pillar: ['pillars! move!', 'watch the pillars', 'step out!!'],
  any: (title) => [`${title}!!`, `${title.toLowerCase()} incoming`, `careful, ${title.toLowerCase()}!`],
};

// When she shows a move, someone calls it out.
function callouts(bots, world) {
  const c = world.callout;
  if (!c || c.at === bots.calloutSeen) return;
  bots.calloutSeen = c.at;
  const rng = bots.rng;
  const here = raiders(bots, world);
  if (!here.length || rng() < 0.25) return;
  const zones = (world.zones ?? []).filter((z) => !z.hit);
  const kind = zones.find((z) => z.kind === 'floor') ? 'floor' : zones.find((z) => z.kind === 'circle') ? 'circle' : zones.find((z) => z.low) ? 'low' : zones.find((z) => z.kind === 'pillar') ? 'pillar' : zones.length ? 'lane' : null;
  const lines = kind && rng() < 0.7 ? CALLS[kind] : CALLS.any(c.title || 'boss');
  const bot = pick(here, rng);
  bot.sayAt = world.now + between(0.25, 0.7, rng);
  bot.sayLine = pick(lines, rng);
}

// Her moves catch the players standing in them, as they catch you (a little softer).
function zoneHits(bots, world) {
  world.onZoneHit = (z) => {
    for (const b of raiders(bots, world)) if (inZone(world, z, b.body)) hurtBot(b, world, z.damage * 0.6, z.from?.x ?? z.x, bots.rng);
  };
}

// Lines said a beat later out in the field (a callout, a hello on the way in, calling out a kill
// stealer); `sayShout` ones go in the chat too. (Town lines: world/drama.js.)
function sayings(bots, world) {
  for (const b of bots.list) {
    if (b.sayAt == null || world.now < b.sayAt || !(b.hunter || b.party)) continue;
    b.sayAt = null;
    if (b.down || b.gone) continue;
    if (b.sayShout) botChat(world, b, b.sayLine);
    else if (!stale(world, b.sayLine)) say(b, b.sayLine);
    b.sayShout = false;
  }
}

// ---------- Party combos ----------

function combos(bots, world) {
  const c = world.finisherCast;
  if (!c || c.at === bots.comboSeen) return;
  bots.comboSeen = c.at;
  const rng = bots.rng;
  const b = world.body;
  const joined = partyMembers(bots)
    .filter((m) => m.body && !m.down && !m.away && m.map === world.map.id && m.fight && m.fight.gauge >= 40 && Math.abs(m.body.x - b.x) < 360 && Math.abs(m.body.y - b.y) < 160)
    .filter((m, i) => joinCombo(m, world, 0.25 + i * 0.3));
  if (!joined.length) return;
  world.numbers.push({ x: b.x, y: b.y - 70, text: 'PARTY COMBO!', color: '#ffd24f', t: 0, crit: true, link: true });
  world.juice.push({ type: 'screenflash', life: 0.1, color: '#fff3c4' });
  world.log(`Party Combo! ${joined.map((m) => m.name).join(' and ')} join${joined.length > 1 ? '' : 's'} your finisher!`, '#ffd24f');
  joined.forEach((m, i) => {
    m.sayAt = world.now + 0.1 + i * 0.3;
    m.sayLine = pick(['NOW!!', 'together!!', 'combo!!', 'all in!', 'go go go'], rng);
  });
}

// ---------- The boss falls ----------

function bossDown(bots, world) {
  world.onBossDown = (m) => {
    const here = raiders(bots, world);
    if (!here.length) return;
    const rng = bots.rng;
    here.forEach((b, i) => {
      b.sayAt = world.now + 0.3 + i * 0.35;
      b.sayLine = pick(['GG!!', 'we did it!!', 'ez clap', 'gg everyone', 'WOOO', 'that was so fun'], rng);
    });
    happened(bots, world, `the ${m.def.name.split(',')[0]} raid`);
  };
}

// ---------- Each frame ----------

export function updateRaids(bots, world) {
  zoneHits(bots, world);
  bossDown(bots, world);
  callouts(bots, world);
  sayings(bots, world);
  combos(bots, world);
}
