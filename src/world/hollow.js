// What makes each room of Rootwood Hollow its own (the map fields are described in data/maps.js),
// and the three bosses' phases. world/dungeon.js calls in here; the drawing is in
// render/hollow.js.
//
//   Hollow Entrance   pitch dark: only the group and the glowcaps they light give any light.
//   Capper's Garden   the Myconid Queen: spore rain, then lights out while she hides in her spore
//                     fog and mushrooms sprout where her spores land, then the Spore Tide floods
//                     the floor (jump on a bounce mushroom to reach the high ledges, or time a jump).
//   Bramble Tunnels   roots fall from the low ceiling during fights; every Sprout you free cheers
//                     the group on (more damage) for the rest of the run.
//   Boar Den          Tuskar charges; a stone pillar in his way stops him cold (dazed, and the
//                     pillar breaks). Then he calls his Wargs, then he stampedes there and back.
//   The Root Gate     sap surges over the floor now and then: get up on a ledge.
//   Heart of the Hollow  Gnarlroot, the oldest tree, who says one word a day: each move comes with
//                     the next word of his sentence crawling out over his head (slam, thorns, and
//                     from 60% the big hug with one gap); at a third he holds on to Elder Yomogi
//                     and won't go lower until the Root Tendrils holding it are cut.

import { addZone, adds, callout, hurtMember, isUp } from './dungeon.js';
import { navOf, surfaceBelow } from './nav.js';
import { playScene } from './story.js';
import { HOLLOW_RADIO, MANOR_RADIO, AQUA_RADIO, CARNIVAL_RADIO, OBS_RADIO, VOLCANO_RADIO, THEATRE_RADIO, WHALE_RADIO } from '../data/scenes.js';
import { DUNGEONS } from '../data/dungeons.js';

// The warden on the radio (Bramble through the roots, Mr. Pumpkins through the keyhole): a line
// from `key` shows over the group for a few seconds.
const RADIO = { hollow: HOLLOW_RADIO, manor: MANOR_RADIO, aquarium: AQUA_RADIO, carnival: CARNIVAL_RADIO, observatory: OBS_RADIO, volcano: VOLCANO_RADIO, theatre: THEATRE_RADIO, skywhale: WHALE_RADIO };
export function radio(world, key) {
  const id = world.dungeon?.id ?? 'hollow';
  const lines = RADIO[id]?.[key];
  if (!lines) return;
  world.radio = { who: DUNGEONS[id].warden, text: lines[Math.floor(Math.random() * lines.length)], at: world.now };
}


// How hard a bounce mushroom throws you: high enough for the top ledges (about 180px).
export const BOUNCE = 740;
const SPROUT_CHEER = 0.04;

// A room's own state, set up the first time the group walks in.
export function roomSetup(world, room) {
  const map = world.map;
  room.pillars = (map.pillars ?? []).map((p) => ({ x: p.x, up: true, fellAt: null }));
  room.flood = map.flood ? { t: map.flood.every * 0.55, state: 'calm', since: 0 } : null;
  room.rootIn = map.rootfall ? 3 : null;
  room.walls = null;
  room.darkUntil = 0;
}

// Damage multiplier the Sprouts' cheering adds (each one freed this run).
export const cheerOf = (run) => 1 + SPROUT_CHEER * (run.cheer ?? 0);

// Every tick of a room.
export function tickRoom(world, dt, group, up) {
  const run = world.dungeon;
  const room = run.room;
  const map = world.map;
  // Bounce mushrooms: a jump taken on one throws you far higher, up to the top ledges (walking
  // across one does nothing, so nobody is flung about by accident).
  for (const pad of map.bouncers ?? []) {
    for (const g of up) {
      const b = g.body;
      if (b.onGround) b.bounced = false;
      if (b.bounced || b.onGround || b.rope || b.vy > -300 || Math.abs(b.x - pad.x) > 20 || map.groundY - b.y > 12) continue;
      b.vy = -BOUNCE;
      b.bounced = true;
      pad.at = world.now;
      world.juice.push({ type: 'jump', x: pad.x, y: map.groundY });
    }
  }
  // Roots falling from the tunnel ceiling while the group fights.
  if (room.rootIn != null && run.combat) {
    room.rootIn -= dt;
    if (room.rootIn <= 0 && up.length) {
      room.rootIn = 3.5 + Math.random() * 2.5;
      const g = up[Math.floor(Math.random() * up.length)];
      const nav = navOf(map);
      const surf = nav.surfaces[Math.max(0, surfaceBelow(nav, g.body.x, g.body.y))];
      addZone(world, { kind: 'circle', x: g.body.x, y: surf.y, w: 58, warn: 1.3, damage: 95, root: true });
    }
  }
  tickFlood(world, dt, up);
  // Gnarlroot's closing roots keep everyone inside the shrinking ring.
  if (room.walls) {
    const w = room.walls;
    w.l += (w.toL - w.l) * Math.min(1, dt * 0.6);
    w.r += (w.toR - w.r) * Math.min(1, dt * 0.6);
    for (const g of up) {
      const b = g.body;
      if (b.x < w.l + 14) {
        b.x = w.l + 14;
        if (world.now - (g.wallAt ?? -9) > 1) {
          g.wallAt = world.now;
          hurtMember(world, g, 55, w.l - 10, { knock: true });
        }
      }
      if (b.x > w.r - 14) {
        b.x = w.r - 14;
        if (world.now - (g.wallAt ?? -9) > 1) {
          g.wallAt = world.now;
          hurtMember(world, g, 55, w.r + 10, { knock: true });
        }
      }
    }
    for (const m of world.mobs) m.x = Math.max(w.l + m.def.w / 2, Math.min(w.r - m.def.w / 2, m.x));
  }
}

// The sap: calm, then a warning (bubbling), then the floor floods for a while.
function tickFlood(world, dt, up) {
  const room = world.dungeon.room;
  const f = room.flood;
  if (!f) return;
  const def = world.map.flood;
  f.t -= dt;
  f.since += dt;
  if (f.state === 'calm' && f.t <= 0) {
    f.state = 'rising';
    f.t = def.warn;
    f.since = 0;
    callout(world, def.name ?? 'Sap Surge!', 'Get up on a ledge!');
    radio(world, 'flood');
  } else if (f.state === 'rising' && f.t <= 0) {
    f.state = 'flooded';
    f.t = def.last;
    f.since = 0;
    f.tick = 0;
  } else if (f.state === 'flooded') {
    f.tick -= dt;
    if (f.tick <= 0) {
      f.tick = 1;
      for (const g of up) if (onFloor(world, g.body)) hurtMember(world, g, def.damage, g.body.x, { pierce: true });
    }
    if (f.t <= 0) {
      f.state = 'calm';
      f.t = def.every;
      f.since = 0;
    }
  }
}

export const onFloor = (world, body) => body.onGround && Math.abs(body.y - world.map.groundY) < 2;
// Whether the sap is coming or here (party members head for the ledges).
export const floodComing = (world) => ['rising', 'flooded'].includes(world.dungeon?.room?.flood?.state);

// ---------- The bosses' phases ----------

// The Myconid Queen. Returns nothing; moves go on the floor as zones.
export function capperPhases(world, m, dt) {
  const s = m.mech;
  const frac = m.hp / m.def.hp;
  const room = world.dungeon.room;
  s.phase ??= 1;
  if (s.phase === 1 && frac <= 0.7) {
    s.phase = 2;
    room.darkUntil = world.now + 10;
    s.darkIn = 22;
    callout(world, 'Lights Out!', 'She hides in her spores. Stay together near the light!');
    radio(world, 'lightsout');
  }
  if (s.phase === 2 && frac <= 0.35) {
    s.phase = 3;
    s.tide = 4;
    callout(world, 'Spore Tide!', 'The floor floods with spores: the bounce mushrooms throw you up high!');
    radio(world, 'tide');
  }
  if (s.phase >= 2) {
    s.darkIn = (s.darkIn ?? 22) - dt;
    if (s.darkIn <= 0) {
      s.darkIn = 22;
      room.darkUntil = world.now + 8;
      callout(world, 'Lights Out!', 'Stay together near the light!');
    }
  }
  if (s.phase === 3) {
    s.tide -= dt;
    if (s.tide <= 0 && !world.dungeon.zones.some((z) => !z.hit && z.kind === 'floor')) {
      s.tide = 13;
      addZone(world, { kind: 'floor', x: 0, w: world.map.width, warn: 2.4, damage: 170, from: m });
    }
  }
}

// When a spore circle lands in her garden after the lights first go out, a mushroom sprouts there.
export function sporeSprout(world, z) {
  const m = z.from;
  if (m?.def.mech !== 'capper' || (m.mech?.phase ?? 1) < 2 || m.hp <= 0 || Math.random() > 0.45) return;
  const live = world.dungeon.room.adds.filter((a) => a.hp > 0).length;
  if (live < 5) adds(world, m, 'sporeling', [z.x], null);
}

// Tuskar: crashing into a pillar instead of the wall, calling his Wargs, and stampeding back.
// `next` is where he's about to be this tick. Returns the pillar he hit, or null.
export function pillarHit(world, m, next) {
  const room = world.dungeon.room;
  for (const p of room.pillars ?? []) {
    if (!p.up) continue;
    const between = (m.x - p.x) * (next - p.x) <= 0 || Math.abs(next - p.x) < m.def.w / 2;
    if (!between) continue;
    p.up = false;
    p.fellAt = world.now;
    return p;
  }
  return null;
}

export function boarPhases(world, m) {
  const s = m.mech;
  const frac = m.hp / m.def.hp;
  if (!s.wargs && frac <= 0.6) {
    s.wargs = true;
    adds(world, m, 'boarlet', [m.x - 300, m.x + 300], null);
    m.callAt = world.now;
    callout(world, 'Tuskar calls his Wargs!', 'Tank, grab them! Damage, bring them down!');
    radio(world, 'wargs');
  }
  if (!s.stampede && frac <= 0.3) {
    s.stampede = true;
    s.charge = Math.min(s.charge, 2);
    callout(world, 'STAMPEDE!', 'He charges there and back now. Watch both ways!');
    radio(world, 'stampede');
  }
}

// Gnarlroot's sentence, one word per move, through the whole fight (he finishes it at the end:
// data/scenes.js hollow_sleep).
export const GNARL_WORDS = ['long', 'ago', 'the', 'little', 'ones', 'sang', 'to', 'me', 'and', 'I', 'slept', 'and', 'then', 'a', 'star', 'went', 'ding', 'and', 'they', 'all', 'ran', 'away', 'all', 'but', 'one', 'little', 'one', 'who', 'waited', 'for', 'me', 'to', 'finish', 'so', 'I', 'held', 'on', 'and', 'now', 'you', 'came', 'too', 'and'];

// Gnarlroot: from 60% his hug joins his moves; at a third he holds on to Elder Yomogi, swaying, and
// the Root Tendrils holding it come up out of the floor round him.
export function gnarlPhases(world, m) {
  const s = m.mech;
  const frac = m.hp / m.def.hp;
  if (!s.hugs && frac <= 0.6) {
    s.hugs = true;
    radio(world, 'hug');
  }
  if (!s.untangle && frac <= 0.3 + 1e-6) {
    s.untangle = true;
    m.swaying = true;
    const w = world.map.width;
    adds(world, m, 'sapling', [-170, -90, 90, 170].map((d) => Math.max(40, Math.min(w - 40, m.x + d))), null);
    s.tendrils = true;
    callout(world, "He's holding on to Elder Yomogi!", 'Cut the Root Tendrils to free it');
    radio(world, 'yomogi');
  }
}

// The Hollow calmed: Gnarlroot falls asleep at last.
export function hollowCalmed(world) {
  // (Elder Yomogi goes home to the Queen's bedchamber, and stays: render/prologue.js.)
  world.char.elders = { ...(world.char.elders ?? {}), yomogi: true };
  playScene(world, 'hollow_sleep');
}
