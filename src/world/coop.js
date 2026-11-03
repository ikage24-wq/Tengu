// Co-op content's hooks into the rest of the world (docs/design/coop.md, part 2): party quests
// (world/partyquest.js) and the two-person boss mechanics (world/coopboss.js).

import './../data/coop.js';
import { tickPartyQuest, pqSteer } from './partyquest.js';
import { tickCoopBosses, coopSteer } from './coopboss.js';

export { coopHit } from './coopboss.js';
export { pqKill, pqGather } from './partyquest.js';

export function tickCoop(world, dt) {
  tickCoopBosses(world, dt);
  tickPartyQuest(world, dt);
}

// A party member, every frame after their own thinking (world/party.js): a boss mechanic first,
// then a party quest's gathering.
export function coopAfterThink(bot, world) {
  if (world.mobs.some((m) => m.coop && m.hp > 0)) coopSteer(bot, world);
  if (!bot.brain?.goal?.coop) pqSteer(bot, world);
}
