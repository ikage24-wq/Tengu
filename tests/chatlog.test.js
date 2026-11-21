// The other players' chat during a boss fight (2026-11-21: party lines and the boss's own piled up
// over its telegraphs): no idle chatter while a boss is up near you, one bubble every few seconds,
// and callouts past that still reach your chat log.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { botChat } from '../src/world/chatlog.js';

test('in a boss fight the others keep quiet: no idle chatter, one bubble every few seconds, callouts still logged', () => {
  const lines = [];
  const world = { now: 100, map: { id: 'm' }, body: { x: 0 }, mobs: [{ def: { boss: true }, hp: 10, x: 100 }], log: (t) => lines.push(t) };
  const a = { name: 'Ann', map: 'm' };
  const b = { name: 'Bo', map: 'm' };
  assert.equal(botChat(world, a, 'what a nice day out here'), false, 'idle chatter held back');
  assert.equal(botChat(world, a, 'step back from the swing', { important: true, prefix: '[Party] ' }), true);
  assert.ok(a.bubble, 'the first callout over her head');
  assert.equal(botChat(world, b, 'here comes the thunder', { important: true, prefix: '[Party] ' }), true);
  assert.equal(b.bubble, undefined, 'no second bubble straight after');
  assert.equal(lines.length, 2, 'both callouts in the chat log');
  world.now += 4;
  botChat(world, b, 'big swing coming now', { important: true });
  assert.ok(b.bubble, 'a bubble again a few seconds on');
  world.mobs = [];
  world.now += 100;
  assert.equal(botChat(world, a, 'what a lovely evening it is'), true, 'chatter back once the boss is down');
});
