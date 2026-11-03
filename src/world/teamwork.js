// Team moves: what a party does together, the same with bot party members (world/party.js) and
// with friends online (net/together.js carries the word between games; each game runs its own hero
// and decides its own hits, so a friend's catch or revive is worked out in their game and told to
// yours).
//
//   - Team Catch: a monster one of you launches can be caught in the air by another for a short
//     window: the catching blow hits harder, keeps it up (a juggle), and pops a shared "TEAM!".
//     Catches passed back and forth chain (TEAM! x2, x3...), each a little harder.
//   - Revive by standing by: stand close to a fallen party member for a couple of seconds and
//     they get back up with some HP (a ring fills round them). A hard hit or walking off breaks it.
//   - Side by side: fighting near party members (up to three) hits a little harder, and a soft
//     link of beads shows between you and those near you.
//   - Group Finisher: your finisher while another member's gauge is full too (world/raids.js joins
//     them in), ending in a shared burst and a short slow-motion beat.

import { partyMembers } from './party.js';
import { navOf, surfaceOf, surfaceBelow } from './nav.js';
import { physicalRange, magicRange, rollHit } from '../core/formulas.js';
import { JOBS } from '../data/jobs.js';
import { stale } from './chatlog.js';
import { remember } from './botmemory.js';
import { gaugeFull } from './melee.js';
import { cast, castBlocker } from './combat.js';
import { SKILLS } from '../data/skills.js';

export const CATCH_WINDOW = 1.2; // seconds after a launch another member can catch it
export const CATCH_BONUS = 0.25; // the first catch's extra damage
export const CATCH_STEP = 0.1; // more for each catch after it in a chain
export const CATCH_MAX = 0.6;
export const CATCH_JUGGLE = 260; // how hard a catch pops it back up (px/s)
export const CHAIN_MAX = 5; // a chain ends on its fifth catch
export const NEAR_X = 200;
export const NEAR_Y = 120;
export const NEAR_BONUS = 0.04; // per member fighting near you
export const NEAR_MAX = 3;
export const REVIVE_TIME = 2.5;
export const REVIVE_PCT = 0.3;
export const REVIVE_X = 40;
export const REVIVE_Y = 40;
export const REVIVE_BREAK = 0.1; // a hit taking this share of max HP at once breaks a revive
export const GROUP_BURST_PCT = 160; // the shared burst's power, plus GROUP_PER for each who joined
export const GROUP_PER = 60;

const pick = (list, rng = Math.random) => list[Math.floor(rng() * list.length)];

export function teamState(world) {
  return (world.team ??= { revive: {}, hpWas: {}, near: 0, links: [], burst: null, catches: 0 });
}

// Everyone in your party on this map: you, your bot members and your online party friends.
// { id, name, kind ('you' | 'bot' | 'friend'), body, up, hp, maxHp, bot?, ghost? }
export function teamOf(world) {
  const out = [{ id: 'you', name: world.char.name, kind: 'you', body: world.body, up: !world.dead, hp: world.char.hp, maxHp: world.stats?.maxHp ?? 1 }];
  for (const b of partyMembers(world.bots)) {
    if (!b.body || b.away || b.map !== world.map.id || !b.stats) continue;
    out.push({ id: b.id, name: b.name, kind: 'bot', body: b.body, up: !b.down, hp: b.hp ?? b.stats.maxHp, maxHp: b.stats.maxHp, bot: b });
  }
  for (const g of world.net?.teamFriends?.(world) ?? []) out.push({ id: g.id, name: g.name, kind: 'friend', body: g.body, up: !g.dead, hp: g.hp ?? 1, maxHp: g.maxHp ?? 1, ghost: g });
  return out;
}

const close = (a, b, dx, dy) => Math.abs(a.x - b.x) <= dx && Math.abs(a.y - b.y) <= dy;

// How many members are fighting by `who` (up, within reach), at most NEAR_MAX.
export function nearCount(team, who) {
  if (!who?.up) return 0;
  return Math.min(NEAR_MAX, team.filter((t) => t !== who && t.up && close(t.body, who.body, NEAR_X, NEAR_Y)).length);
}

const airborne = (m) => m.air > 0 || m.airV > 0;

// One blow landing (world.js runs every queued hit through here before it lands): the side-by-side
// bonus, and a Team Catch if someone else in the party launched this monster a moment ago.
export function teamHit(world, m, h) {
  if (h.stranger || h.miss) return;
  const who = h.party ?? 'you';
  const team = teamOf(world);
  if (team.length < 2) return;
  const me = team.find((t) => t.id === who);
  if (!me) return;
  let k = 1 + NEAR_BONUS * nearCount(team, me);
  const L = m.lift;
  if (L && L.by !== who && world.now - L.at <= CATCH_WINDOW && airborne(m) && !m.def.boss && team.some((t) => t.id === L.by)) {
    // (Yours: you launched it or you caught it. Two bots passing one between them still catch,
    // but only their effect shows, so the screen doesn't fill with words that aren't yours.)
    const yours = who === 'you' || L.by === 'you';
    L.chain += 1;
    L.by = who;
    L.at = world.now;
    k *= 1 + Math.min(CATCH_MAX, CATCH_BONUS + CATCH_STEP * (L.chain - 1));
    h.launch = Math.max(h.launch ?? 0, CATCH_JUGGLE);
    h.teamCatch = L.chain;
    const T = teamState(world);
    T.catches++;
    const y = m.y - (m.air ?? 0) - m.def.h;
    // One word for one moment: a blow catching several monsters at once (or two catches a beat
    // apart) shows a single "TEAM!", raised to the longest chain.
    const label = L.chain > 1 ? `TEAM! x${L.chain}` : 'TEAM!';
    if (yours) {
      const last = T.pop && world.now - T.popAt < 0.3 ? T.pop : null;
      if (last) {
        if (L.chain > (last.chain ?? 1)) Object.assign(last, { text: label, chain: L.chain });
      } else {
        T.pop = { x: m.x, y: y - 22, text: label, chain: L.chain, color: '#ffb38a', t: 0, crit: true, link: true };
        T.popAt = world.now;
        world.numbers.push(T.pop);
      }
    }
    world.fx.push({ kind: 'teamcatch', x: m.x, y: m.y - (m.air ?? 0) - m.def.h / 2, chain: L.chain, small: !yours, t: 0, dur: 0.45 });
    if (yours) world.hitstop = Math.max(world.hitstop ?? 0, who === 'you' ? 0.06 : 0.03);
    if (yours && L.chain >= 3) world.juice.push({ type: 'shake', mag: 2, dur: 0.15 });
    world.net?.teamLaunch?.(world, m, L.chain);
    // A long chain ends on its last catch: up it goes one more time and comes down for good.
    if (L.chain >= CHAIN_MAX) m.lift = null;
    // The one who caught it says so now and then (their own words, not every time).
    const bot = me.bot;
    if (bot && yours && !bot.bubble && Math.random() < 0.3) {
      const line = pick(L.chain > 2 ? [`${L.chain} in a row!!`, 'keep it up keep it up', 'juggle!!'] : ['caught it!', 'got ur launch', 'mine!!', 'nice pass']);
      if (!stale(world, line)) bot.bubble = { text: line, t: 3 };
    }
  }
  if (k !== 1) h.damage = Math.max(1, Math.round(h.damage * k));
}

// After a blow lands and the monster lives: a launcher marks who sent it up (for a catch by
// someone else), and online, your friends hear of it so they can catch it too.
export function teamLanded(world, m, h) {
  if (h.stranger || h.miss || m.def.boss || m.def.fly || !(h.launch > 0)) return;
  const who = h.party ?? 'you';
  if (h.teamCatch) return;
  m.lift = { by: who, at: world.now, chain: 0 };
  if (who === 'you') world.net?.teamLaunch?.(world, m, 0);
  callCatch(world, m, who);
}

// A friend online launched (or caught) one in their game.
export function friendLaunched(world, m, id, chain = 0) {
  if (!m || m.hp <= 0) return;
  m.lift = { by: id, at: world.now, chain };
}

// A bot member near a monster someone else just launched may go for the catch.
function callCatch(world, m, by) {
  const rng = world.bots?.rng ?? Math.random;
  for (const b of partyMembers(world.bots)) {
    if (b.id === by || b.down || !b.body || b.map !== world.map.id || !b.brain || b.reviveGoal) continue;
    // (Your launches are theirs to catch often; another bot's only now and then, the player's
    // pick, so a fight isn't one long juggle.)
    if (!close(b.body, m, 170, 90) || rng() > (by === 'you' ? 0.6 : 0.15)) continue;
    b.brain.target = m;
    return;
  }
}

// ---------- Every frame ----------

export function tickTeam(world, dt) {
  const T = teamState(world);
  const team = teamOf(world);
  // A launch that's come down (or gone stale) can't be caught any more.
  for (const m of world.mobs) if (m.lift && (m.hp <= 0 || (!airborne(m) && world.now - m.lift.at > 0.15) || world.now - m.lift.at > CATCH_WINDOW + 0.5)) m.lift = null;
  const you = team[0];
  T.near = team.length > 1 && !world.map.isTown ? nearCount(team, you) : 0;
  // The link shows only while you're fighting together.
  const fighting = world.now - (world.hitsAt ?? -99) < 3 || world.now - (world.hurtAt ?? -99) < 3;
  T.links = T.near && fighting ? team.filter((t) => t !== you && t.up && close(t.body, you.body, NEAR_X, NEAR_Y)).map((t) => t.body) : [];
  revives(world, team, dt);
  tickJoin(world);
  groupBurst(world);
}

// ---------- Revive by standing by ----------

function revives(world, team, dt) {
  const T = teamState(world);
  const seen = new Set();
  for (const d of team) {
    if (d.up) continue;
    seen.add(d.id);
    const r = (T.revive[d.id] ??= { t: 0, callAt: world.now + 0.6 + Math.random() * 0.6 });
    r.x = d.body.x;
    r.y = d.body.y;
    // Helpers in this game: you and your bot members (a friend's game counts its own helpers).
    const helpers = team.filter((t) => t !== d && t.up && t.kind !== 'friend' && close(t.body, d.body, REVIVE_X, REVIVE_Y));
    // A hard hit on someone helping breaks it.
    const hit = helpers.some((t) => (T.hpWas[t.id] ?? t.hp) - t.hp >= t.maxHp * REVIVE_BREAK);
    if (hit && r.t > 0) breakRevive(world, r, d);
    else if (helpers.length) {
      r.t += dt * (1 + 0.5 * (helpers.length - 1));
      r.by = helpers[0].id;
      // (A fallen member out in the field waits while someone's getting them up.)
      if (d.bot) d.bot.downAt += dt;
    } else if (r.t > 0) breakRevive(world, r, d);
    if (r.t >= REVIVE_TIME) {
      reviveOne(world, d, helpers[0]);
      delete T.revive[d.id];
      continue;
    }
    sendHelper(world, team, d, r);
  }
  for (const id of Object.keys(T.revive)) if (!seen.has(id)) delete T.revive[id];
  for (const t of team) T.hpWas[t.id] = t.hp;
  // Members who were off to help someone who's up again (or gone) go back to hunting.
  for (const b of partyMembers(world.bots)) if (b.reviveGoal && (!T.revive[b.reviveGoal.for] || b.down)) b.reviveGoal = null;
}

function breakRevive(world, r, d) {
  if (r.t > 0.3) world.numbers.push({ x: d.body.x, y: d.body.y - 40, text: 'Interrupted!', color: '#d4cbe8', t: 0, small: true });
  r.t = 0;
  r.by = null;
}

// The nearest bot member who's up walks over to get them up.
function sendHelper(world, team, d, r) {
  if (world.now < r.callAt) return;
  if (partyMembers(world.bots).some((b) => b.reviveGoal?.for === d.id)) return;
  let best = null;
  let bd = 600;
  for (const t of team) {
    if (t.kind !== 'bot' || !t.up || t.bot.reviveGoal) continue;
    const e = Math.abs(t.body.x - d.body.x) + Math.abs(t.body.y - d.body.y) * 2;
    if (e < bd) {
      bd = e;
      best = t.bot;
    }
  }
  if (!best) return;
  const nav = navOf(world.map);
  const side = Math.sign(best.body.x - d.body.x) || 1;
  const x = d.body.x + side * 14;
  const s = d.body.onGround ? surfaceOf(nav, d.body) : -1;
  best.reviveGoal = { for: d.id, x, y: d.body.y, mode: 'fight', surface: s >= 0 ? s : surfaceBelow(nav, d.body.x, d.body.y - 4) };
  best.brain.target = null;
  best.brain.goal = best.reviveGoal;
  best.brain.path = null;
  best.brain.think = Math.min(best.brain.think, 0.1);
  if (!best.bubble && Math.random() < 0.6) {
    const line = pick(d.kind === 'you' ? ['hold on im coming!!', `${world.char.name} dont move`, 'omw to get u up'] : [`got ${d.name}`, `${d.name} hang on`, 'getting them up!']);
    if (!stale(world, line)) best.bubble = { text: line, t: 3 };
  }
}

function reviveOne(world, d, by) {
  const pct = REVIVE_PCT;
  world.fx.push({ kind: 'teamrevive', x: d.body.x, y: d.body.y, t: 0, dur: 1 });
  const byName = by?.kind === 'you' ? 'You' : by?.name ?? 'Your party';
  if (d.kind === 'friend') {
    world.net?.teamRevive?.(world, d.id, pct);
    world.log(`You got ${d.name} back on their feet!`, '#bff0dc');
    return;
  }
  if (d.kind === 'bot') {
    const b = d.bot;
    Object.assign(b, { down: false, tomb: false, hp: Math.round(b.stats.maxHp * pct), invuln: 1.5 });
    b.reviveGoal = null;
    // (They'll remember you picking them up: world/botmemory.js.)
    if (by?.kind === 'you') remember(world.char, b, 'revive', null, world.map.id);
    const line = pick(by?.kind === 'you' ? [`ty ${world.char.name}!!`, 'saved me', 'back in it thx'] : [`thx ${by?.name ?? ''}!`, 'im up im up', 'phew']);
    if (!stale(world, line)) b.bubble = { text: line, t: 3.5 };
    world.log(`${byName === 'You' ? 'You' : byName} got ${b.name} back on their feet!`, '#bff0dc');
    return;
  }
  standUp(world, pct, byName);
}

// You get back up (a party member stood by you, here or in a friend's game).
export function standUp(world, pct, byName) {
  if (!world.dead) return;
  world.dead = false;
  world.char.hp = Math.max(1, Math.round(world.stats.maxHp * pct));
  world.invuln = 2;
  world.fx.push({ kind: 'teamrevive', x: world.body.x, y: world.body.y, t: 0, dur: 1 });
  world.log(`${byName} got you back on your feet!`, '#bff0dc');
}

// How far along a revive is for whoever's lying at (x, y): [{ x, y, k }] for the renderer.
export function reviveRings(world) {
  return Object.values(world.team?.revive ?? {}).filter((r) => r.t > 0).map((r) => ({ x: r.x, y: r.y, k: Math.min(1, r.t / REVIVE_TIME) }));
}

// ---------- Group Finisher ----------

// Whether your finisher would be a Group Finisher right now: another member near you has a full
// gauge too (yours is checked by the finisher itself).
export function groupReady(world) {
  return fullNear(world).length > 0;
}

export function fullNear(world) {
  const b = world.body;
  const near = (o) => o && Math.abs(o.x - b.x) < 360 && Math.abs(o.y - b.y) < 160;
  const bots = partyMembers(world.bots).filter((m) => m.body && !m.down && !m.away && m.map === world.map.id && (m.fight?.gauge ?? 0) >= 100 && near(m.body));
  const friends = (world.net?.teamFriends?.(world) ?? []).filter((g) => !g.dead && (g.gk >= 1 || g.form) && near(g.body));
  return [...bots, ...friends];
}

// The shared last burst, `delay` seconds from now, `n` heroes strong.
export function queueBurst(world, delay, n) {
  teamState(world).burst = { at: world.now + delay, n };
}

// A friend online let their Group Finisher loose by you: with your gauge full, yours goes off a
// beat later (your own finisher, played out as ever, so nothing skips its wait).
export function joinGroup(world) {
  if (world.dead || !gaugeFull(world)) return;
  const T = teamState(world);
  T.join = { at: world.now + 0.3, until: world.now + 1.3 };
}

// Whether this finisher answers a friend's call (it doesn't call them back).
export const answering = (world) => world.now - (world.team?.fromGroup ?? -99) < 1.5;

function tickJoin(world) {
  const T = teamState(world);
  const J = T.join;
  if (!J || world.now < J.at) return;
  if (world.now > J.until || world.dead || !gaugeFull(world)) {
    T.join = null;
    return;
  }
  const id = Object.values(SKILLS).find((s) => s.fullGauge && (world.char.skills[s.id] ?? 0) > 0 && !castBlocker(world, s.id))?.id;
  if (!id) return;
  T.fromGroup = world.now;
  if (cast(world, id).ok) T.join = null;
}

function groupBurst(world) {
  const T = teamState(world);
  const B = T.burst;
  if (!B || world.now < B.at) return;
  T.burst = null;
  const b = world.body;
  const stats = world.stats;
  const pct = GROUP_BURST_PCT + GROUP_PER * B.n;
  const mage = JOBS[world.char.job]?.family === 'mage';
  const range = mage ? magicRange(stats, pct * 1.3) : physicalRange(stats, stats.weaponType, pct);
  world.fx.push({ kind: 'teamburst', x: b.x, y: b.y - 30, n: B.n, t: 0, dur: 0.6 });
  world.numbers.push({ x: b.x, y: b.y - 84, text: 'GROUP FINISHER!', color: '#ffb38a', t: 0, crit: true, link: true });
  world.juice.push({ type: 'screenflash', life: 0.14, color: '#fff1dc' }, { type: 'shake', mag: 6, dur: 0.35 });
  world.slowmo = Math.max(world.slowmo ?? 0, 0.6);
  let i = 0;
  for (const m of world.mobs) {
    if (m.hp <= 0 || !close(m, b, 240, 140)) continue;
    const roll = rollHit(range, stats, m.def, world.char.level);
    world.pending.push({ at: world.now + 0.12 + i * 0.02, mob: m, miss: false, damage: roll.damage, crit: roll.crit, fromX: b.x, stack: i % 3, knock: 280, launch: 300, big: true, stop: i ? 0 : 0.12, team: true });
    i++;
  }
}
