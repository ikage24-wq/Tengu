// The online party's word between games (src/net/together.js): invites, join requests, a leader
// leaving, trades with someone gone. Every player here shares one copy of the online module, so
// each one's session is kept aside and swapped in while their game acts or hears a message.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { online } from '../src/net/online.js';
import * as T from '../src/net/together.js';
import { createCharacter } from '../src/core/character.js';
import { createWorld } from '../src/world/world.js';

const KEYS = ['status', 'id', 'host', 'party', 'partyAsk', 'partyAsked', 'partyAskedAt', 'joinAsk', 'joinAsked', 'joinAskedAt', 'rosters', 'ghosts', 'trade', 'tradeAsk', 'tradeAsked', 'link'];

// A room of players by name: each with a world, a session and a log of what they were told.
function room(...names) {
  const bus = [];
  const players = names.map((name) => {
    const world = createWorld(createCharacter(name, {}));
    const heard = [];
    world.log = (words) => heard.push(words);
    const id = name.toLowerCase();
    return { name, id, world, heard, s: { status: 'on', id, host: false, party: null, ghosts: new Map(), rosters: null, link: { send: (msg) => bus.push(msg) } } };
  });
  for (const p of players) for (const q of players) if (p !== q) p.s.ghosts.set(q.id, { id: q.id, name: q.name, map: 'woods', job: 'warrior', body: {} });
  const as = (p, fn) => {
    const keep = Object.fromEntries(KEYS.map((k) => [k, online[k]]));
    for (const k of KEYS) online[k] = p.s[k];
    try {
      return fn();
    } finally {
      for (const k of KEYS) p.s[k] = online[k];
      Object.assign(online, keep);
    }
  };
  // Delivers everything said so far to everyone else (the host's star passes it all on).
  const flush = () => {
    for (let n = 0; bus.length && n < 100; n++) {
      const msg = bus.shift();
      for (const p of players) {
        const g = p.s.ghosts.get(msg.id);
        if (p.id !== msg.id && g) as(p, () => T.handleTogether(p.world, msg, g));
      }
    }
  };
  // Someone leaves the room: everyone else stops seeing them.
  const drop = (gone) => {
    for (const p of players) p.s.ghosts.delete(gone.id);
    players.splice(players.indexOf(gone), 1);
  };
  const tick = () => {
    for (const p of players) as(p, () => T.tickParty(p.world));
    flush();
  };
  return { players, as, flush, drop, tick };
}

function invite(r, from, to, yes = true) {
  assert.equal(r.as(from, () => T.askParty(from.world, to.id)), null);
  r.flush();
  assert.equal(to.s.partyAsk, from.id);
  r.as(to, () => T.answerParty(to.world, yes));
  r.flush();
}

test('an invite said yes to makes a party everyone agrees on', () => {
  const r = room('Hana', 'Kai', 'Mio');
  const [hana, kai, mio] = r.players;
  invite(r, hana, kai);
  invite(r, hana, mio);
  for (const p of [hana, kai, mio]) assert.deepEqual(p.s.party, { leader: 'hana', members: ['hana', 'kai', 'mio'] });
});

test('when the leader leaves the room, the party carries on under the next member', () => {
  const r = room('Hana', 'Kai', 'Mio');
  const [hana, kai, mio] = r.players;
  invite(r, hana, kai);
  invite(r, hana, mio);
  r.drop(hana);
  r.tick();
  for (const p of [kai, mio]) assert.deepEqual(p.s.party, { leader: 'kai', members: ['kai', 'mio'] }, `${p.name} agrees Kai leads now`);
  assert.ok(kai.heard.some((w) => /you're the leader now/.test(w)));
  // The new leader can invite again.
  assert.equal(r.as(kai, () => T.partyBlocker(kai.s.ghosts.get('mio'))), 'Already in your party');
});

test('a party of two whose leader leaves breaks up, for the one left too', () => {
  const r = room('Hana', 'Kai');
  const [hana, kai] = r.players;
  invite(r, hana, kai);
  r.drop(hana);
  r.tick();
  assert.equal(kai.s.party, null);
});

test('saying yes to an invite while already in another party doesn\'t pull you out of it', () => {
  const r = room('Hana', 'Kai', 'Mio');
  const [hana, kai, mio] = r.players;
  // Mio invites Kai, but Kai joins Hana's party before answering.
  r.as(mio, () => T.askParty(mio.world, 'kai'));
  r.flush();
  invite(r, hana, kai);
  kai.s.partyAsk = 'mio';
  r.as(kai, () => T.answerParty(kai.world, true));
  r.flush();
  assert.equal(kai.s.party.leader, 'hana', 'Kai stays in Hana\'s party');
  assert.equal(mio.s.party, null, 'Mio got no party out of it');
  assert.equal(mio.s.partyAsked, null, 'and isn\'t left waiting');
});

test('a friend already in a party can\'t be invited into yours; you can ask to join theirs instead', () => {
  const r = room('Hana', 'Kai', 'Mio');
  const [hana, kai, mio] = r.players;
  invite(r, hana, kai);
  assert.equal(r.as(mio, () => T.partyBlocker(mio.s.ghosts.get('kai'))), 'Already in another party');
  assert.equal(r.as(mio, () => T.askJoinParty(mio.world, 'kai')), null);
  r.flush();
  assert.equal(hana.s.joinAsk, 'mio', 'the ask goes to the leader');
  r.as(hana, () => T.answerJoinParty(hana.world, true));
  r.flush();
  for (const p of [hana, kai, mio]) assert.deepEqual(p.s.party?.members, ['hana', 'kai', 'mio']);
});

test('a friend who joins the party picks up the party quest it\'s on', () => {
  const r = room('Hana', 'Kai');
  const [hana, kai] = r.players;
  hana.world.char.partyQuest = { key: 'harbor|1|hunt|woods|boarlet', kind: 'hunt', town: 'harbor', map: 'woods', mob: 'boarlet', need: 30, have: 12, done: false, reward: { exp: 1, gold: 1, tokens: 1 } };
  invite(r, hana, kai);
  assert.equal(kai.world.char.partyQuest?.key, hana.world.char.partyQuest.key);
  assert.equal(kai.world.char.partyQuest.have, 12, 'with the count so far');
});

test('asks no one answers lapse, and those to someone who left clear at once', () => {
  const r = room('Hana', 'Kai', 'Mio');
  const [hana, kai, mio] = r.players;
  r.as(hana, () => T.askParty(hana.world, 'kai'));
  r.flush();
  assert.equal(r.as(hana, () => T.partyBlocker(hana.s.ghosts.get('kai'))), 'Waiting for an answer');
  hana.s.partyAskedAt -= 60;
  r.tick();
  assert.equal(hana.s.partyAsked, null, 'the invite lapsed');
  r.as(mio, () => T.askParty(mio.world, 'kai'));
  r.flush();
  r.drop(mio);
  r.tick();
  assert.equal(kai.s.partyAsk, null, 'an invite from someone gone is gone too');
});

test('a trade with someone who left the room is called off', () => {
  const r = room('Hana', 'Kai');
  const [hana, kai] = r.players;
  r.as(hana, () => T.askTrade(hana.world, 'kai'));
  r.flush();
  r.as(kai, () => T.answerTrade(kai.world, true));
  r.flush();
  assert.equal(hana.s.trade?.with, 'kai');
  r.drop(kai);
  r.tick();
  assert.equal(hana.s.trade, null);
});

test('party chat reaches a friend in a dungeon', () => {
  const r = room('Hana', 'Kai');
  const [hana, kai] = r.players;
  invite(r, hana, kai);
  kai.world.dungeon = { id: 'hollow', roles: {} };
  r.as(hana, () => T.togetherApi.partyChat(hana.world, 'boss is at the top!'));
  r.flush();
  assert.ok(kai.heard.some((w) => /\[Party\] Hana: boss is at the top!/.test(w)));
});
