// Racing your Mochi with your party (docs/design/mochi.md step 5, batch 4; the race itself:
// world/mochi-race.js). At the Race Stadium's board, "Race with your party" invites everyone in
// your party who's online, wherever they are: each picks one of their Mochi (ui/mochi-race.js) and
// sends it over. When you start, your Mochi runs in the first lane, theirs in the next, and the
// hour's rivals fill the rest. Your game runs the race and sends where everyone is a few times a
// second; theirs draw it (and are brought to the course, and back where they were after), send
// their cheers to you, and give their own Mochi its own prize and medal at the end.
//
//   { t: 'mrace', op: 'invite' | 'join' | 'no' | 'cancel' | 'start' | 'state' | 'end' | 'cheer', to }
//   online.raceInvite (a friend's invite, waiting for your answer), online.raceWait (you've joined:
//   waiting for them to start), world.raceLobby (yours: who you invited, who's joined with which Mochi)

import { online, send } from './online.js';
import { inParty, partyFriends } from './together.js';
import { STAGES } from '../data/mochi-genes.js';
import { RACE_STAGES, RACE_RANKS } from '../data/mochi-race.js';
import { startRace, rivalsFor, raceHour, setRaceNet, raceState, applyRaceState, applyRaceEnd, applyCheer } from '../world/mochi-race.js';

// How long an invite waits for an answer, and a friend who's joined waits for you to start.
const INVITE_SECS = 60;
const WAIT_SECS = 120;
const now = () => Date.now() / 1000;
const stageName = (id, rank) => `${RACE_STAGES[id]?.name ?? 'a race'} (${RACE_RANKS[rank]?.name ?? ''})`;
const mochiName = (who, rec) => `${who}'s ${STAGES[rec.stage] ?? 'Mochi'}`;

// ---------- Hosting ----------
// Invites your party to race `stageId` at `rank`, your Mochi `rec` in the first lane.
export function inviteParty(world, rec, stageId, rank) {
  const friends = partyFriends();
  if (!friends.length) return 'No one in your party is online.';
  if (!rec || rec.stage === 'egg') return 'Pick one of your Mochi first.';
  world.raceLobby = { stageId, rank, rec, invited: friends.map((g) => g.id), joined: {}, declined: [] };
  for (const g of friends) send({ t: 'mrace', op: 'invite', to: g.id, stageId, rank, name: world.char.name });
  world.log(`You invite your party to ${stageName(stageId, rank)}...`, '#ffc2d4');
  return null;
}
// Calls the party race off.
export function cancelLobby(world) {
  const L = world.raceLobby;
  if (!L) return;
  for (const id of L.invited) send({ t: 'mrace', op: 'cancel', to: id });
  world.raceLobby = null;
}
// Starts it: your Mochi, the friends' who joined, rivals in the empty lanes.
export function startPartyRace(world) {
  const L = world.raceLobby;
  if (!L) return false;
  const joined = Object.entries(L.joined).slice(0, 5);
  const field = [
    { rec: L.rec, name: null, owner: online.id },
    ...joined.map(([id, j]) => ({ rec: j.rec, name: mochiName(j.name, j.rec), owner: id })),
    ...rivalsFor(L.stageId, L.rank, raceHour()),
  ].slice(0, 6);
  if (!startRace(world, L.rec, L.stageId, L.rank, { field, party: joined.map(([id]) => id) })) return false;
  // (What the friends' games need: everyone's Mochi, by lane; yours named for them.)
  const wire = field.map((f, i) => ({ rec: f.rec, name: i === 0 ? mochiName(world.char.name, f.rec) : f.name, owner: f.owner ?? null }));
  joined.forEach(([id], i) => send({ t: 'mrace', op: 'start', to: id, stageId: L.stageId, rank: L.rank, field: wire, me: i + 1 }));
  for (const id of L.invited) if (!L.joined[id]) send({ t: 'mrace', op: 'cancel', to: id });
  world.raceLobby = null;
  return true;
}

// ---------- Joining ----------
// Answers a friend's invite: with one of your Mochi (`rec`), or no thanks (null).
export function answerInvite(world, rec) {
  const inv = online.raceInvite;
  online.raceInvite = null;
  if (!inv) return;
  if (!rec || rec.stage === 'egg' || world.race || world.dungeon || world.scene) {
    send({ t: 'mrace', op: 'no', to: inv.from });
    return;
  }
  send({ t: 'mrace', op: 'join', to: inv.from, rec: JSON.parse(JSON.stringify(rec)), name: world.char.name });
  online.raceWait = { from: inv.from, name: inv.name, rec, until: now() + WAIT_SECS, back: { map: world.map.id, x: Math.round(world.body.x) } };
  world.log(`You're in! Waiting for ${inv.name} to start...`, '#ffc2d4');
}
// Leaves a race you'd joined before it starts.
export function leaveWait(world) {
  const W = online.raceWait;
  if (!W) return;
  send({ t: 'mrace', op: 'no', to: W.from });
  online.raceWait = null;
}
// (An invite or a wait that's gone stale drops away.)
export function tickRaceInvites() {
  if (online.raceInvite && now() > online.raceInvite.until) online.raceInvite = null;
  if (online.raceWait && now() > online.raceWait.until) online.raceWait = null;
}

// ---------- Messages ----------
export function onMochiRace(world, msg, g) {
  if (msg.to !== online.id) return;
  const L = world.raceLobby;
  switch (msg.op) {
    case 'invite':
      if (!inParty(msg.id) || world.race || online.raceWait) {
        send({ t: 'mrace', op: 'no', to: msg.id });
        return;
      }
      online.raceInvite = { from: msg.id, name: msg.name, stageId: msg.stageId, rank: msg.rank, until: now() + INVITE_SECS };
      world.events.push({ type: 'raceinvite' });
      world.log(`${msg.name} invites you to race your Mochi: ${stageName(msg.stageId, msg.rank)}!`, '#ffe36b');
      return;
    case 'join':
      if (!L || !L.invited.includes(msg.id) || !msg.rec) return;
      L.joined[msg.id] = { rec: msg.rec, name: msg.name };
      world.log(`${msg.name} joins your race with their ${STAGES[msg.rec.stage] ?? 'Mochi'}!`, '#bff0dc');
      return;
    case 'no':
      if (!L) return;
      delete L.joined[msg.id];
      if (!L.declined.includes(msg.id)) L.declined.push(msg.id);
      return;
    case 'cancel':
      if (online.raceInvite?.from === msg.id) online.raceInvite = null;
      if (online.raceWait?.from === msg.id) {
        online.raceWait = null;
        world.log(`${g?.name ?? 'Your friend'} called the race off.`, '#ffb3c6');
      }
      return;
    case 'start': {
      const W = online.raceWait;
      if (!W || W.from !== msg.id || !Array.isArray(msg.field) || !msg.field[msg.me]) return;
      online.raceWait = null;
      if (!startRace(world, W.rec, msg.stageId, msg.rank, { field: msg.field, me: msg.me, remote: msg.id, back: W.back })) send({ t: 'mrace', op: 'no', to: msg.id });
      return;
    }
    case 'state':
      applyRaceState(world, msg);
      return;
    case 'end':
      applyRaceEnd(world, msg);
      return;
    case 'cheer':
      if (world.race?.party?.includes(msg.id)) applyCheer(world, msg.id);
      return;
    default:
  }
}

setRaceNet({
  state(world, R) {
    const rs = raceState(R);
    // (`pt`: how far into its phase; `t` is the message's own kind.)
    for (const id of R.party) send({ t: 'mrace', op: 'state', to: id, phase: R.phase, pt: R.t, clock: R.clock, rs });
  },
  end(world, R) {
    const places = R.racers.map((r) => [r.place, r.done]);
    for (const id of R.party) send({ t: 'mrace', op: 'end', to: id, places });
  },
  cheer(world, R) {
    send({ t: 'mrace', op: 'cheer', to: R.remote });
  },
});
