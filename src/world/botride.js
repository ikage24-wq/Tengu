// The other players ride too (data/mounts.js): about half of those past level 15 have a mount of
// their own (the common ones more often: the Puff Bun from Clover's quest, the crafted Kettle
// Racer), and they ride it to get about: on when they've been on the move a moment with nothing to
// fight, off (with the same poof as yours) to fight, gather, fish, climb a rope or stand about.
// Never in a dungeon run. `bot.riding` is the mount they're on (render/town.js draws it).

import { MOUNTS } from '../data/mounts.js';

const POOL = ['bun', 'bun', 'bun', 'kettle', 'kettle', 'nimbus', 'turtle', 'crane', 'gecko'];
const hash = (s) => {
  let h = 2166136261;
  for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
};

// The mount a bot owns (decided once, from who they are), or null.
export function botMount(bot) {
  if (bot.mountId === undefined) {
    const k = hash(`${bot.id}|${bot.name}`);
    bot.mountId = (bot.level ?? 1) >= 15 && k < 0.5 ? POOL[Math.floor((k / 0.5) * POOL.length) % POOL.length] : null;
  }
  return bot.mountId;
}

function poof(world, bot, on) {
  if (bot.map !== world.map?.id || !bot.body) return;
  world.fx.push({ kind: 'mountpoof', on, mount: bot.riding ?? bot.mountId, x: bot.body.x, y: bot.body.y, t: 0, dur: 0.45, ally: true });
}

// Each step: gets on or off as it suits them, and returns their speed factor for the step.
export function botRide(bot, world, intent, dt, { fighting = false, busy = false } = {}) {
  const id = botMount(bot);
  const body = bot.body;
  if (!id || !body) return 1;
  const moving = (intent.left || intent.right) && !intent.up && !intent.down;
  bot.rideMoving = moving ? (bot.rideMoving ?? 0) + dt : 0;
  bot.rideStill = !moving && body.onGround ? (bot.rideStill ?? 0) + dt : 0;
  const off = Boolean(world.dungeon) || bot.down || fighting || busy || bot.life || body.rope;
  if (bot.riding && (off || bot.rideStill > 4)) {
    poof(world, bot, false);
    bot.riding = null;
  } else if (!bot.riding && !off && bot.rideMoving > 1.2 && body.onGround) {
    bot.riding = id;
    poof(world, bot, true);
  }
  return bot.riding ? MOUNTS[bot.riding].speed / 100 : 1;
}
