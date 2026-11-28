// Boss fights built the way FFXIV builds its dungeon bosses (2026-11-18): a fixed, learnable
// rotation of named casts, each shown on a cast bar under the boss's health bar and telegraphed on
// the floor, so a group can read the fight and learn it; a handful of shared patterns; phases that
// swap the rotation at health marks and layer one new idea on what came before.
//
// The patterns (zone kinds, drawn by render/dungeon.js, resolved by world/dungeon.js tickZones):
//   raid    everyone takes a hit; no dodging it (a check on the healer)
//   buster  a big hit on one member, the tank (a marker follows them; anyone beside them is hit too)
//   stack   a marker on one member: everyone gathers in it to share the hit (too few, and it hurts)
//   spread  a marker on each member: keep apart, or two markers overlapping hit twice
//   circle  a patch round a spot (round the boss: "get out")
//   donut   a ring round the boss, its middle safe ("get in")
//   band    the floor from x to x + w (a cleave to one side, a line across the room)
//   floor   the whole floor (jump it)
// Markers follow their member until a beat before they land (`lock`), then stay put.
//
// A rotation is a list of steps { gap, cast, dur, sub, pose, run(world, m, up, ctx) }: wait `gap`
// seconds, start casting `cast` for `dur` seconds (run() lays out the telegraphs, set to land as the
// cast ends), and on to the next, round and round. The boss doesn't swing at the tank while it
// casts. In the last half second of a cast the boss winds up (m.windup, the rigs' wind-up pose) and
// lets fly as it ends (m.attackAt, the strike pose); `pose` tells a rig which of its moves to use.

import { addZone, callout } from './dungeon.js';

const pick = (list) => list[Math.floor(Math.random() * list.length)];

// ---------- The patterns ----------
export const raidwide = (world, m, damage, dur) => addZone(world, { kind: 'raid', x: m.x, y: m.y, w: world.map.width, warn: dur, damage, from: m });
export const buster = (world, m, g, damage, dur, w = 80) => g && addZone(world, { kind: 'buster', target: g.id, x: g.body.x, y: g.body.y, w, warn: dur, lock: 0.5, damage, from: m });
export const stack = (world, m, g, damage, dur, need, w = 96) => g && addZone(world, { kind: 'stack', target: g.id, x: g.body.x, y: g.body.y, w, warn: dur, lock: 0.7, damage, need, from: m });
export const spread = (world, m, up, damage, dur, w = 70) => { for (const g of up) addZone(world, { kind: 'spread', target: g.id, x: g.body.x, y: g.body.y, w, warn: dur, lock: 0.6, damage, from: m }); };
export const out = (world, m, r, damage, dur) => addZone(world, { kind: 'circle', x: m.x, y: world.map.groundY, w: r * 2, warn: dur, damage, from: m, noSprout: true });
export const donut = (world, m, inner, r, damage, dur) => addZone(world, { kind: 'donut', x: m.x, y: world.map.groundY, w: r * 2, inner, warn: dur, damage, from: m });
export const band = (world, m, x0, x1, damage, dur) => addZone(world, { kind: 'band', x: Math.min(x0, x1), w: Math.abs(x1 - x0), dir: x1 >= x0 ? 1 : -1, warn: dur, damage, from: m });
// A cleave from the boss across `len` of the floor, the way it faces.
export const cleave = (world, m, len, damage, dur) => (m.dir < 0 ? band(world, m, m.x + 20, m.x + 20 - len, damage, dur) : band(world, m, m.x - 20, m.x - 20 + len, damage, dur));

// How long each look's landing plays (s): render/bossfx.js draws it over that long.
export const LOOK_HOLD = { overdue: 0.9, books: 0.8, study: 0.9, bookmark: 0.7, comet: 0.75, crescentsweep: 0.75, eclipse: 1.3, total: 1.3, night: 1.3, shush: 0.9, nova: 0.9, lines: 0.8, starfall: 0.7,
  // (The Queen's dream: render/dreamfx.js.)
  drizzle: 0.7, bolt: 0.6, downpour: 0.8, grumble: 1, forked: 0.6, cloudburst: 1.1, umbrella: 0.9,
  // (the Myconid Shaman's Feather Flurry: render/shaman/fx.js)
  feathers: 1.4,
  // (the Myconid Queen's Seed Spit, Hoarder's Whirl and Pouch Burst: render/mothercapper/fx.js HAZEL_HOLD)
  seedspit: 0.7, seedsprout: 1, whirl: 0.8, pouchburst: 1.3,
  // (the Ballroom's penguin and bat: render/waltzrondo/looks.js WALTZ_HOLD)
  polish: 0.5, echoswoop: 0.8, count: 0.9, kiss: 0.8, twirl: 0.8, rings: 0.9, lift: 0.9, bow: 1.2,
  // (Madame Velvet's: render/velvet/looks.js VELVET_HOLD)
  vvRunner: 0.8, vvTea: 0.8, vvInspect: 0.8, vvPour: 0.8, vvDust: 0.8, vvDustLow: 0.8, vvKeys: 0.8, vvPolish: 1, vvRules: 1.1,
  // (Lady Marigold's new fight: render/hostess/looks.js HOSTESS_HOLD)
  mgCards: 0.8, mgPartners: 0.8, mgSteps: 0.7, mgToes: 0.8, mgLanterns: 0.8, mgBloom: 1.3, mgTwelve: 1.2,
  // (Lady Marigold's: render/marigold/looks.js MARIGOLD_HOLD)
  mgInvite: 0.8, mgStay: 0.9, mgRoom: 0.8, mgToast: 0.8, mgDance: 0.8, mgChime: 0.7, mgWaltz: 1.1,
  // (the Twin Morays': render/moray/looks.js MORAY_HOLD)
  mrPeek: 0.8, mrChomp: 0.7, mrGossip: 0.6, mrPickM: 0.4, mrPickE: 0.4, mrTwirl: 0.7, mrHuddle: 0.8, mrSquabble: 1,
  // (Lady Abyssia's: render/abyssia/looks.js ABYSSIA_HOLD)
  abKiss: 0.8, abBlot: 0.7, abDark: 1.1, abDarkPart: 0.1, abEmbrace: 0.8, abFlounce: 0.7, abCackle: 1,
  // (Queen Coralie's: render/coralie/looks.js CORALIE_HOLD)
  crDecree: 0.8, crCases: 0.1, crCase: 0.7, crStrand: 0.8, crWave: 1, crPortrait: 0.9, crWalls: 0.9, crWallsHigh: 0.1,
  // (Folio's: render/folio/looks.js FOLIO_HOLD)
  foHardback: 0.9, foShelf: 0.8, foNook: 0.1, foRiffle: 1.1, foNoted: 0.7, foTop: 0.8, foBottom: 0.9,
  // (the Eclipse Twins': render/eclipse/looks.js ECLIPSE_HOLD)
  ecFlare: 0.8, ecRipple: 0.6, ecSunspot: 0.6, ecMochi: 0.8, ecSunbeam: 0.8, ecMoonbeam: 0.8, ecCorona: 0.9, ecCrossing: 0.7, ecDiamond: 1.2,
  // (Astraea's: render/astraea/looks.js ASTRAEA_HOLD)
  asTally: 0.9, asHead: 0.6, asRecount: 0.6, asCatch: 0.9, asLights: 1.1, asChart: 0.8, asChartStar: 1.4, asCarry: 0.8, asFall: 0.7, asLast: 1.2,
  // (Leonie's: render/leonie/looks.js LEONIE_HOLD)
  lnPins: 0.7, lnLeap: 0.7, lnPyramid: 0.9, lnCartwheel: 0.8, lnSwing: 0.8, lnSpot: 0.6, lnCannon: 0.8, lnOvation: 1.1,
  // (Madame Marionette's: render/marionetta/looks.js MADAME_HOLD)
  mmStrings: 0.7, mmRap: 0.7, mmSnip: 0.7, mmBow: 0.9, mmRope: 0.6, mmTug: 0.8, mmCurtain: 1.1,
  // (Queen Gearheart's: render/gearheart/looks.js GEARHEART_HOLD)
  ghCogs: 0.7, ghTap: 0.7, ghNoon: 0.8, ghMelody: 0.6, ghDuet: 0.9, ghSpring: 1.1,
  // (Toffee's: render/toffee/looks.js TOFFEE_HOLD)
  tfStrike: 0.8, tfDrizzle: 0.7, tfGlass: 0.9, tfQuench: 0.9, tfToss: 0.7, tfRing: 1, tfReel: 0.7, tfCrack: 1.1,
  // (Captain Gale's: render/gale/looks.js GALE_HOLD)
  glBlank: 0.8, glVolley: 0.6, glHaul: 0.8, glDown: 0.8, glBlow: 1, glGale: 0.7, glShift: 0.7,
  // (the Barnacle Matriarch's: render/matriarch/looks.js MATRIARCH_HOLD)
  maScold: 0.8, maBabies: 0.6, maCluster: 0.9, maUndertow: 1, maCoral: 0.9, maTide: 1.1, maTideHi: 0.8,
  // (The Sulk's: render/sulk/looks.js SULK_HOLD)
  sbWallop: 0.8, sbClouds: 0.6, sbPile: 0.9, sbTantrum: 1, sbSob: 0.8, sbHuff: 0.8, sbPillow: 0.6, sbSun: 1.1,
  // (Gretel's: render/gretel/looks.js GRETEL_HOLD)
  grSmack: 0.8, grButtons: 0.6, grIcing: 0.9, grBash: 0.7, grRoll: 0.7, grPress: 0.7, grHeat: 1.1,
  // (the Night Manager's: render/manager/looks.js MANAGER_HOLD)
  nmSync: 0.9, nmDelegate: 0.6, nmCircle: 0.9, nmBack: 0.8, nmReply: 1, nmHuddle: 0.9, nmTick: 0.8, nmOne: 0.7, nmOneMore: 1.1,
  // (the Cup-Noodle Dragon's: render/noodle/looks.js NOODLE_HOLD)
  ndChop: 0.8, ndSlurp: 0.1, ndBurp: 0.9, ndToss: 0.6, ndSoup: 1, ndPacket: 0.9, ndStick: 1.7, ndPinch: 0.8, ndFlip: 0.9, ndBowl: 1.1,
  // (Monday's: render/monday/looks.js MONDAY_HOLD)
  mnSeeMe: 0.9, mnUnread: 0.6, mnDay: 0.8, mnWeekend: 0.7, mnOff: 0.6, mnAlarm: 1, mnAll: 0.9, mnStrike: 0.8, mnSnooze: 1,
  memo: 0.7, stamp: 0.8, coffee: 0.8, files: 0.9, steam: 0.9, noodle: 0.7, broth: 0.7, chopsticks: 0.6, boil: 1.1, email: 0.7, redpen: 0.8, alarm: 1, invite: 0.8, deadline: 1.1 };

// ---------- Who ----------
export const tankOf = (up) => up.find((g) => g.role === 'tank') ?? up[0];
export const healerOf = (up) => up.find((g) => g.role === 'healer') ?? pick(up);
export const dpsOf = (up) => { const d = up.filter((g) => g.role !== 'tank' && g.role !== 'healer'); return d.length ? pick(d) : pick(up); };

// ---------- The rotation ----------
// Runs `list` for boss m (its state in m.mech.rot, so a wipe resets it). Returns true while m is
// casting (it doesn't swing at the tank then). `ctx` is passed on to each step's run().
export function runRotation(world, m, list, up, dt, ctx = {}) {
  const s = (m.mech.rot ??= { i: 0, wait: list[0]?.gap ?? 2, list });
  // A new list (a new phase): start it from the top, after its first gap.
  if (s.list !== list) Object.assign(s, { i: 0, wait: list[0]?.gap ?? 2, list, end: null });
  const caster = ctx.caster ?? m;
  if (s.end != null) {
    // (The one actually casting: for a pair, the sister whose turn it is.)
    const c = s.who ?? caster;
    const left = s.end - world.now;
    const total = Math.max(0.2, c.def.fight?.windup ?? 0.5);
    c.windup = left > 0 && left < total ? left : 0;
    if (left <= 0 || c.hp <= 0) {
      c.cast = null;
      c.castPose = null;
      c.windup = 0;
      c.attackAt = world.now;
      s.who = null;
      s.end = null;
      s.i = (s.i + 1) % list.length;
      s.wait = list[s.i].gap ?? 2;
    }
    return true;
  }
  if (!up.length) return false;
  s.wait -= dt;
  if (s.wait > 0) return false;
  const step = list[s.i];
  const who = step.by ? ctx[step.by] ?? caster : caster;
  if (!who || who.hp <= 0) {
    s.i = (s.i + 1) % list.length;
    s.wait = 0.5;
    return false;
  }
  who.cast = { name: step.cast, t0: world.now, dur: step.dur };
  who.castPose = step.pose ?? null;
  world.dungeon.nextLook = step.look ?? null;
  world.dungeon.lookI = 0;
  step.run(world, who, up, ctx);
  world.dungeon.nextLook = null;
  if (step.sub) callout(world, step.cast, step.sub);
  s.end = world.now + step.dur;
  s.who = who;
  return true;
}
