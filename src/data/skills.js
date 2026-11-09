// Skill books. Each skill's numbers come from `at(level)`, so balance lives in one place.
//
// Types:
//   attack  - weapon damage (pct is % of a basic hit)
//   magic   - spell damage (power is % of magic attack)
//   heal    - restores HP (yours, and in a dungeon your party's in range) and smites monsters in
//             range with holy damage (none with targets: 0)
//   revive  - gets a fallen party member in range back on their feet (dungeons)
// `movement` marks a combo skill that moves you (a dash or a dodge).
// `combo` makes a skill a combo of steps that play as timed strikes (see world/melee.js):
// each use plays the next step, so pressing again keeps it going.
//
//   blink   - teleports you `distance` forward
//   buff    - timed bonuses; `buff` keys are added to the player's stats while active. `party`
//             buffs also land on party members in `range` (in a dungeon). `regenPct` heals that
//             share of max HP every second; `barrier` absorbs damage up to that share of max HP;
//             `dmgCut` takes that share off every hit. `taunt` (seconds) also turns every monster
//             in `range` on you (a war cry; how long they stick to you in a dungeon).
//   passive - always-on bonuses once learned
// `grows` marks a passive that's only stats (the masteries): it isn't learned with SP, it comes
// with the job and grows with your level (see core/stats.js). `replaces` names a skill of an
// earlier job this one takes the place of (Haste for Quick Step): the old one leaves the list,
// its SP comes back, and its hotkeys move over.
//
// Range: `w`/`h` is the hit box in front of the player. `projectile` skills hit the nearest
// targets within range and draw a flying shot. `stun` (seconds) also stops monsters, with stars
// instead of ice; `bleed` works like poison, in red. `hitFx` is an extra effect on each monster hit,
// and `ultimate` marks a screen-wide ultimate. `freeze` (seconds) stops monsters it hits;
// `poison` ({ pct, secs }) makes them take pct of the hit again every second for secs.
// `school` (steel, hawk, shadow, spirit, ink, fox, arcane, ice, lightning, fire, poison, holy, rage, wind, focus) colors the casting circle.

const lerp = (a, b, lv, max) => Math.round(a + ((b - a) * (lv - 1)) / Math.max(1, max - 1));
const lerpf = (a, b, lv, max) => a + ((b - a) * (lv - 1)) / Math.max(1, max - 1);

// `lock` is a short delay after using a skill that plants you in place (no moving, jumping, or other attacks), for big wind-ups.
// `dmg` tunes a skill's whole damage (balance, see tools/balance.mjs), on top of the job's `power`.
function skill(def) {
  return { maxLevel: 20, lock: 0, ...def };
}

export const SKILLS = {
  // ---------- Novice ----------
  pebble: skill({
    id: 'pebble', name: 'Star Pebble', job: 'novice', type: 'attack', maxLevel: 3, fx: 'pebble', lock: 0.45,
    desc: 'Flick a sparkly pebble at the nearest monster.',
    at: (lv) => ({ mp: 2, pct: 110 + lv * 25, hits: 1, targets: 1, range: { w: 220, h: 50 }, projectile: true }),
  }),
  quickstep: skill({
    id: 'quickstep', name: 'Quick Step', job: 'novice', type: 'buff', maxLevel: 3, fx: 'buff', lock: 0.55, landAt: 0.75,
    desc: 'Move and jump faster for a while.',
    at: (lv) => ({ mp: 8, duration: 60 + lv * 30, buff: { speed: 8 + lv * 4, jump: 3 + lv * 2 } }),
  }),

  // ---------- Thunderguard (the Warrior remade: the storm, storm blue and white-gold) ----------
  // docs/design/thunderguard.md. Both a damage dealer and the dungeon tank. His blows and the hits he
  // takes build Charge (world/melee.js): the fuller it runs the harder he hits and the less he takes;
  // full (Overcharge), lightning jumps from every blow, a static shell shocks whatever hits him, and
  // Thunderfall is ready. Thunderclap and Static Guard are his tank's tools.
  thunderrush: skill({
    pathNames: { stormwall: 'Rolling Thunder', tempest: 'Red Rush' },
    id: 'thunderrush', name: 'Thunder Rush', job: 'warrior', type: 'attack', fx: null, icon: 'thunderrush', maxLevel: 10, school: 'thunder', movement: true,
    desc: 'Drop low into a sprint and go off like lightning: you flash forward through every monster in your path, shocking each one as you pass and throwing them aside, and come out of it in a cut. Nothing touches you on the way.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const hit = (at) => ({ at, pct: k(90, 160), reach: 50, h: 64, around: true, targets: 5, knock: 280, launch: 160, fx: 'tghit' });
      return {
        mp: k(10, 6), pct: k(90, 160), hits: 2, targets: 5,
        combo: [{ move: 'tgrush', dur: 0.5, step: k(110, 170), carry: 0.72, guard: 0.5, strikes: [
          { ...hit(0.28), burst: 'tgrush', burstAt: -1.4, burstDur: 0.5 },
          { ...hit(0.62), big: true, stop: 0.06, shake: 2, burst: 'tgburst', burstAt: 0.6, burstDur: 0.36 },
        ] }],
        // Red Rush: not a charge but a streak, low and leaning, red afterimages strung out behind.
        paths: {
          stormwall: [{ move: 'bwcharge', dur: 0.62, step: k(90, 140), carry: 0.6, guard: 0.6, strikes: [
            { ...hit(0.3), fx: 'bwhit', burst: 'bwplate', burstAt: 0.8, burstDur: 0.45 },
            { ...hit(0.62), fx: 'bwhit', provoke: 3, big: true, stop: 0.08, shake: 3, burst: 'bwroll', burstAt: 0.6, burstDur: 0.55 },
          ] }],
          tempest: [{ move: 'tprush', dur: 0.5, step: k(110, 170), carry: 0.72, guard: 0.5, strikes: [
          { ...hit(0.28), fx: 'tphit', burst: 'tprush', burstAt: -1.4, burstDur: 0.5 },
          { ...hit(0.62), fx: 'tphit', big: true, stop: 0.06, shake: 2, burst: 'tpflashburst', burstAt: 0.6, burstDur: 0.36 },
        ] }] },
      };
    },
  }),
  stormcleave: skill({
    pathNames: { stormwall: 'Rain Cleave', tempest: 'Crimson Cleave' },
    id: 'stormcleave', name: 'Storm Cleave', job: 'warrior', type: 'attack', fx: null, icon: 'stormcleave', school: 'thunder', maxLevel: 20,
    desc: 'Haul your weapon right back over your shoulder and hold it there as the storm pours into it, then bring it round in one huge two-handed cleave that hurls a giant crescent of lightning down the line, through every monster in it.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(12, 24), pct: k(180, 320), hits: 2, targets: 8,
        combo: [{ move: 'tgcleave', dur: 0.92, step: 12, strikes: [
          { at: 0.58, pct: k(90, 160), reach: 96, h: 80, targets: 4, knock: 120, arc: [-150, 300], thick: 16, fx: 'tghit', stop: 0.05, shake: 2 },
          { at: 0.6, shot: 'tgwave', pct: k(180, 320), range: 420, h: 110, targets: 8, pierce: true, knock: 240, launch: 120, speed: 760, burst: 'tghit', big: true, stop: 0.08, shake: 3 },
        ] }],
        // Crimson Cleave: no long haul back, a whipped cleave from the hip that hurls a red crescent.
        paths: {
          stormwall: [{ move: 'bwraincleave', dur: 0.95, step: 6, strikes: [
            { at: 0.58, pct: k(90, 160), reach: 100, h: 80, targets: 4, knock: 120, arc: [-150, 300], thick: 16, fx: 'bwhit', burst: 'bwrain', burstAt: 0.6, burstDur: 0.7, stop: 0.06, shake: 2 },
            { at: 0.6, shot: 'bwwave', pct: k(180, 320), range: 420, h: 110, targets: 8, pierce: true, knock: 240, launch: 120, speed: 640, burst: 'bwhit', provoke: 2, big: true, stop: 0.08, shake: 3 },
          ] }],
          tempest: [{ move: 'tpcleave', dur: 0.7, step: 16, strikes: [
          { at: 0.46, pct: k(90, 160), reach: 96, h: 80, targets: 4, knock: 120, arc: [-150, 300], thick: 15, fx: 'tphit', stop: 0.05, shake: 2 },
          { at: 0.48, shot: 'tpwave', pct: k(180, 320), range: 420, h: 110, targets: 8, pierce: true, knock: 240, launch: 120, speed: 900, burst: 'tphit', big: true, stop: 0.08, shake: 3 },
        ] }] },
      };
    },
  }),
  cycloneedge: skill({
    pathNames: { stormwall: 'Squall', tempest: 'Red Cyclone' },
    id: 'cycloneedge', name: 'Cyclone Edge', job: 'warrior', type: 'attack', fx: null, icon: 'cycloneedge', school: 'thunder', maxLevel: 20,
    desc: 'Spin with your weapon out at arm\'s length, round and round, as a storm whirls up round you, dragging the monsters near you in and cutting everything around you again and again; then stop dead and bring the weapon down in a thunderclap that flings them away. A short wait before the next (6 seconds).',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const cut = (at) => ({ at, pct: k(40, 70), reach: 96, h: 80, around: true, targets: 6, knock: 0, pull: 120, fx: 'tghit', gauge: 2 });
      return {
        mp: k(16, 28), pct: k(40, 70), hits: 6, targets: 6, cooldown: 6,
        combo: [{ move: 'tgcyclone', dur: 1.3, step: 0, guard: 0.3, strikes: [
          { ...cut(0.18), burst: 'tgcyclone', burstAt: 0, burstDur: 1.0, follow: true }, cut(0.32), cut(0.46), cut(0.6), cut(0.72),
          { at: 0.86, pct: k(150, 260), reach: 110, h: 90, around: true, targets: 6, knock: 300, launch: 220, fx: 'tghit', burst: 'tgclap', burstAt: 0, burstDur: 0.6, big: true, stop: 0.1, shake: 5 },
        ] }],
        // Red Cyclone: tighter and faster, four spins in the time of his three, ending in a flung cut.
        paths: {
          stormwall: [{ move: 'bwsquall', dur: 1.4, step: 0, guard: 0.5, strikes: [
            { ...cut(0.2), fx: 'bwhit', provoke: 2, burst: 'bwsquallfx', burstAt: 0, burstDur: 1.05, follow: true }, { ...cut(0.36), fx: 'bwhit' }, { ...cut(0.5), fx: 'bwhit' }, { ...cut(0.64), fx: 'bwhit' }, { ...cut(0.76), fx: 'bwhit' },
            { at: 0.88, pct: k(150, 260), reach: 110, h: 90, around: true, targets: 6, knock: 300, launch: 220, fx: 'bwhit', provoke: 3, burst: 'bwroll', burstAt: 0, burstDur: 0.6, big: true, stop: 0.1, shake: 5 },
          ] }],
          tempest: [{ move: 'tpcyclone', dur: 1.2, step: 0, guard: 0.3, strikes: [
          { ...cut(0.16), fx: 'tphit', burst: 'tpwhirlfx', burstAt: 0, burstDur: 0.95, follow: true }, { ...cut(0.3), fx: 'tphit' }, { ...cut(0.44), fx: 'tphit' }, { ...cut(0.58), fx: 'tphit' }, { ...cut(0.7), fx: 'tphit' },
          { at: 0.84, pct: k(150, 260), reach: 110, h: 90, around: true, targets: 6, knock: 300, launch: 220, fx: 'tphit', arc: [0, 330], thick: 14, big: true, stop: 0.1, shake: 4 },
        ] }] },
      };
    },
  }),
  lightningrod: skill({
    pathNames: { stormwall: 'Storm Pillars', tempest: 'Red Spears' },
    id: 'lightningrod', name: 'Lightning Rod', job: 'warrior', type: 'attack', fx: null, icon: 'lightningrod', school: 'thunder', maxLevel: 20,
    desc: 'Drive your weapon point-first into the floor and throw your free hand up to the sky: bolts of lightning crash down on the monsters ahead of you, one after another, each one dazing what it strikes.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const strike = (at) => ({ at, pct: k(80, 140), reach: 280, h: 140, targets: 2, knock: 60, stun: 0.4, fx: 'tgbolt', stop: 0.04, shake: 2 });
      return {
        mp: k(14, 26), pct: k(80, 140), hits: 3, targets: 6, cooldown: 4,
        combo: [{ move: 'tgrod', dur: 1.05, step: 0, strikes: [
          { at: 0.34, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tgrodfx', burstAt: 0.2, burstDur: 0.7 },
          strike(0.5), strike(0.62), { ...strike(0.74), big: true, shake: 3 },
        ] }],
        // Red Spears: he points the blade and red bolts slant in with the wind, one after another.
        paths: {
          stormwall: [{ move: 'bwquake', dur: 1.05, step: 0, strikes: [
            { at: 0.56, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'bwroll', burstAt: 0, burstDur: 0.6 },
            { ...strike(0.62), fx: 'bwboltdown', provoke: 2 }, { ...strike(0.72), fx: 'bwboltdown' }, { ...strike(0.82), fx: 'bwboltdown', big: true, shake: 3 },
          ] }],
          tempest: [{ move: 'tprod', dur: 0.95, step: 0, strikes: [
          { at: 0.28, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tpflashburst', burstAt: 0.3, burstDur: 0.5 },
          { ...strike(0.42), fx: 'tpbolt' }, { ...strike(0.54), fx: 'tpbolt' }, { ...strike(0.66), fx: 'tpbolt', big: true, shake: 3 },
        ] }] },
      };
    },
  }),
  thunderclap: skill({
    pathNames: { stormwall: 'Thunderhead', tempest: 'Warcry' },
    id: 'thunderclap', name: 'Thunderclap', job: 'warrior', type: 'buff', fx: null, icon: 'thunderclap', school: 'thunder', maxLevel: 10, party: true,
    desc: 'Raise your weapon flat over your head and slam it down flat on the floor with a shout: a thunderclap booms out, every monster around you turns on you and is dazed, and you and the party around you take less damage for a while. A wait before the next (20 seconds).',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: k(360, 520), h: 180, around: true };
      return {
        mp: k(12, 20), pct: 0, hits: 1, targets: 10, range, cooldown: 20, taunt: kf(2, 4), duration: k(20, 40), buff: { dmgCut: kf(0.06, 0.18) },
        combo: [{ move: 'tgthunderclap', dur: 0.85, step: 0, strikes: [
          { at: 0.52, pct: k(60, 110), reach: range.w / 2, h: 140, around: true, targets: 10, knock: 140, stun: kf(0.5, 1), provoke: kf(2, 4), fx: 'tgspark', burst: 'tgclapbig', burstAt: 0, burstDur: 0.7, big: true, stop: 0.08, shake: 4, gauge: 6,
            grant: { id: 'thunderclap', duration: k(20, 40), buff: { dmgCut: kf(0.06, 0.18) }, range } },
        ] }],
        // Warcry: a crack of red thunder off the blade, struck flat on the floor with a shout.
        paths: {
          stormwall: [{ move: 'bwclapmv', dur: 0.95, step: 0, strikes: [
            { at: 0.58, pct: k(60, 110), reach: range.w / 2, h: 140, around: true, targets: 10, knock: 140, stun: kf(0.5, 1), provoke: kf(3, 5), fx: 'bwhit', burst: 'bwclapbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.09, shake: 5, gauge: 8,
              grant: { id: 'thunderclap', duration: k(20, 40), buff: { dmgCut: kf(0.06, 0.18) }, range } },
          ] }],
          tempest: [{ move: 'tpclap', dur: 0.7, step: 0, strikes: [
          { at: 0.46, pct: k(60, 110), reach: range.w / 2, h: 140, around: true, targets: 10, knock: 140, stun: kf(0.5, 1), provoke: kf(2, 4), fx: 'tphit', burst: 'tpclapbig', burstAt: 0, burstDur: 0.7, big: true, stop: 0.08, shake: 4, gauge: 6,
            grant: { id: 'thunderclap', duration: k(20, 40), buff: { dmgCut: kf(0.06, 0.18) }, range } },
        ] }] },
      };
    },
  }),
  staticguard: skill({
    pathNames: { stormwall: 'Iron Cloud', tempest: 'Afterburn' },
    id: 'staticguard', name: 'Static Guard', job: 'warrior', type: 'buff', fx: null, icon: 'staticguard', school: 'thunder', maxLevel: 10,
    desc: 'Plant your feet wide behind your weapon and let the storm cover you: a crackling shell of static wraps you, you take much less from every hit, nothing knocks you back, and whatever hits you is shocked and dazed. A wait before the next (30 seconds).',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(10, 18), pct: 0, hits: 0, targets: 0, cooldown: 30, aimGain: 15,
        combo: [{ move: 'tgguard', dur: 0.75, step: 0, strikes: [
          { at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tgguardshell', burstAt: 0, burstDur: k(6, 10), follow: true,
            grant: { id: 'staticguard', duration: k(6, 10), buff: { dmgCut: kf(0.2, 0.4), wdef: lerp(10, 50, lv, m) }, range: { w: 0, h: 0 } } },
        ] }],
        // Afterburn: a blur of red speed wraps him; he takes the edge off every hit.
        paths: {
          stormwall: [{ move: 'bwguard', dur: 0.8, step: 0, strikes: [
            { at: 0.52, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'bwguardshell', burstAt: 0, burstDur: k(6, 10), follow: true,
              grant: { id: 'staticguard', duration: k(6, 10), buff: { dmgCut: kf(0.2, 0.4), wdef: lerp(10, 50, lv, m) }, range: { w: 0, h: 0 } } },
          ] }],
          tempest: [{ move: 'tpguard', dur: 0.6, step: 0, strikes: [
          { at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tpguardshell', burstAt: 0, burstDur: k(6, 10), follow: true,
            grant: { id: 'staticguard', duration: k(6, 10), buff: { dmgCut: kf(0.2, 0.4), wdef: lerp(10, 50, lv, m) }, range: { w: 0, h: 0 } } },
        ] }] },
      };
    },
  }),
  stormsteel: skill({
    id: 'stormsteel', name: 'Storm Steel', job: 'warrior', type: 'passive', grows: true, fx: null, icon: 'stormsteel',
    desc: 'The storm runs down your arm into the weapon: steadier, harder blows with every blade, axe and spear.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), watk: lerp(2, 20, lv, m) } }),
  }),
  stormbody: skill({
    id: 'stormbody', name: 'Storm Body', job: 'warrior', type: 'passive', grows: true, fx: null, icon: 'stormbody',
    desc: 'Toughened by the storm you carry: more max HP and harder armour.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.03, 0.2, lv, m), wdef: lerp(3, 30, lv, m) } }),
  }),
  thunderfall: skill({
    pathNames: { stormwall: 'Downpour', tempest: 'Skyfall' },
    id: 'thunderfall', dmg: 1.2, name: 'Thunderfall', job: 'warrior', type: 'attack', fx: null, icon: 'thunderfall', school: 'thunder', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a full Charge, and spends it. Leap high up into the storm gathering over you and hang there as the lightning pours into your weapon, then fall riding a giant bolt: the floor splits with lightning where you land, everything around you is thrown into the air, and bolts rain down round you.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const rain = (at, burstAt) => ({ at, pct: k(60, 100), reach: 200, h: 150, around: true, targets, knock: 60, burst: 'tgbolt', burstAt, burstDur: 0.6, stop: 0.03, shake: 2, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 5, targets,
        combo: [{ move: 'tgfall', dur: 1.5, step: 10, finisher: true, guard: 1.3, strikes: [
          { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tgstormcloud', burstAt: 0, burstDur: 1.2, follow: true },
          { at: 0.62, pct: k(420, 720), reach: 170, h: 150, around: true, targets, knock: 300, launch: 460, fx: 'tghit', burst: 'tgboltbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.16, shake: 8, gauge: 0 },
          { at: 0.7, pct: k(150, 260), reach: 200, h: 150, around: true, targets, knock: 220, burst: 'tgclapbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.05, shake: 3, gauge: 0 },
          rain(0.78, 0.7), rain(0.86, -0.7),
        ] }],
        // Skyfall: he leaps into a red storm and falls as a red bolt.
        paths: {
          stormwall: [{ move: 'bwfall', dur: 1.55, step: 6, finisher: true, guard: 1.4, strikes: [
            { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'bwstormcloud', burstAt: 0, burstDur: 1.2, follow: true },
            { at: 0.62, pct: k(420, 720), reach: 170, h: 150, around: true, targets, knock: 300, launch: 460, fx: 'bwhit', provoke: 4, burst: 'bwboltbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.16, shake: 8, gauge: 0 },
            { at: 0.7, pct: k(150, 260), reach: 200, h: 150, around: true, targets, knock: 220, burst: 'bwclapbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.05, shake: 3, gauge: 0 },
            { ...rain(0.78, 0.7), burst: 'bwrain' }, { ...rain(0.86, -0.7), burst: 'bwboltdown' },
          ] }],
          tempest: [{ move: 'tpfall', dur: 1.4, step: 10, finisher: true, guard: 1.2, strikes: [
          { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tpstormcloud', burstAt: 0, burstDur: 1.1, follow: true },
          { at: 0.6, pct: k(420, 720), reach: 170, h: 150, around: true, targets, knock: 300, launch: 460, fx: 'tphit', burst: 'tpboltbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.16, shake: 8, gauge: 0 },
          { at: 0.68, pct: k(150, 260), reach: 200, h: 150, around: true, targets, knock: 220, burst: 'tpclapbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.05, shake: 3, gauge: 0 },
          { ...rain(0.76, 0.7), burst: 'tpbolt' }, { ...rain(0.84, -0.7), burst: 'tpbolt' },
        ] }] },
      };
    },
  }),

  // ---------- Tempest (the Thunderguard's damage path: red lightning, speed itself) ----------
  // docs/design/tempest.md. His hits build Velocity (world/melee.js): the fuller it runs the faster he
  // swings, red afterimages of him striking again behind every blow; full (Lightspeed), every
  // finisher blinks him through the pack and Red Thunder is ready. He plays the Thunderguard's skills
  // his own way (their `paths`), and these are his.
  flashstep: skill({
    id: 'flashstep', anim: 'tpstep', name: 'Flash Step', job: 'tempest', type: 'attack', fx: null, icon: 'flashstep', school: 'redstorm', maxLevel: 10, movement: true,
    desc: 'Crouch a hair and be gone: you flash forward in a red bolt, cutting everything you pass through, and come out of it already turning. Nothing touches you on the way.',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(8, 5), pct: k(110, 190), hits: 1, targets: 6,
        combo: [{ move: 'tpstep', dur: 0.36, step: k(130, 190), carry: 0.85, guard: 0.45, strikes: [{ at: 0.42, fx: 'tphit', pct: k(110, 190), reach: 60, h: 64, around: true, targets: 6, knock: 120, burst: 'tprush', burstAt: -2.6, burstDur: 0.4, big: true, stop: 0.04, shake: 1 }] }],
      };
    },
  }),
  thousandcuts: skill({
    id: 'thousandcuts', anim: 'tpthousand', name: 'Thousand Cuts', job: 'tempest', type: 'attack', fx: null, icon: 'thousandcuts', school: 'redstorm', maxLevel: 20,
    desc: 'Lean in and let the blade go faster than the eye can follow: a blur of a dozen red streaks tears through everything in front of you in a second, and the last one is huge.',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const cut = (at) => ({ at, fx: 'tphit', pct: k(22, 38), reach: 96, h: 70, targets: 5, knock: 6, gauge: 2 });
      return {
        mp: k(14, 26), pct: k(22, 38), hits: 12, targets: 5, cooldown: 5,
        combo: [{ move: 'tpthousand', dur: 1.05, step: 4, strikes: [
          { ...cut(0.12), burst: 'tpcuts', burstAt: 0.5, burstDur: 0.85 },
          ...[0.18, 0.24, 0.3, 0.36, 0.42, 0.48, 0.54, 0.6, 0.66, 0.72].map(cut),
          { at: 0.84, fx: 'tphit', pct: k(150, 250), reach: 110, h: 80, targets: 5, knock: 260, launch: 160, arc: [-130, 260], thick: 15, big: true, stop: 0.1, shake: 4 },
        ] }],
      };
    },
  }),
  crimsonarc: skill({
    id: 'crimsonarc', anim: 'tparc', name: 'Crimson Arc', job: 'tempest', type: 'attack', fx: null, icon: 'crimsonarc', school: 'redstorm', maxLevel: 20,
    desc: 'Whip the blade round in a wide flat arc and fling a crescent of red lightning down the line, then whip it back the other way and fling a second after it.',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const arc = (at, oy) => ({ at, shot: 'tpwave', burst: 'tphit', pct: k(110, 190), range: 400, h: 100, targets: 6, pierce: true, knock: 120, speed: 820, oy, big: true, stop: 0.04, shake: 1 });
      return {
        mp: k(12, 22), pct: k(110, 190), hits: 2, targets: 6,
        combo: [{ move: 'tparc', dur: 0.7, step: 8, strikes: [arc(0.3, -6), arc(0.62, 6)] }],
      };
    },
  }),
  afterimage: skill({
    id: 'afterimage', anim: 'tpafter', name: 'Afterimage', job: 'tempest', type: 'buff', fx: null, icon: 'afterimage', school: 'redstorm', maxLevel: 10,
    desc: 'Flick the blade and blur: for a while a red afterimage of you strikes again behind every swing from the very first blow, and harder than it does on its own. A wait before the next (45 seconds).',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: lerp(16, 28, lv, m), pct: 0, hits: 0, targets: 0, cooldown: 45,
        combo: [{ move: 'tpafter', dur: 0.6, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tpflashburst', burstAt: 0, burstDur: 0.5,
          grant: { id: 'afterimage', duration: lerp(15, 30, lv, m), buff: { echo: kf(0.6, 0.85), attackSpeed: kf(0.04, 0.1) }, range: { w: 0, h: 0 } } }] }],
      };
    },
  }),
  stormblade: skill({
    id: 'stormblade', name: 'Storm Blade', job: 'tempest', type: 'passive', grows: true, fx: null, icon: 'stormblade',
    desc: 'The lightning is in your arm now: faster, harder blows, and more of them land as critical hits.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.4, lv, m), critRate: lerpf(0.04, 0.14, lv, m), attackSpeed: lerpf(0.02, 0.08, lv, m) } }),
  }),
  redthunder: skill({
    id: 'redthunder', anim: 'tpredthunder', dmg: 1.4, name: 'Red Thunder', job: 'tempest', type: 'attack', fx: null, icon: 'redthunder', school: 'redstorm', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a full Velocity, and spends it. Draw the blade back and vanish: you blink from monster to monster across the field, striking each, the air filling with red streaks where you have been, then appear in the middle of them as a red bolt falls on them all.',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const blink = (at) => ({ at, fx: 'tphit', pct: k(80, 130), reach: 280, h: 90, targets: 6, pierce: true, knock: 40, blink: 280, stop: 0.03, shake: 1, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(80, 130), hits: 6, targets: 10,
        combo: [{ move: 'tpredthunder', dur: 1.6, step: 0, finisher: true, guard: 1.5, strikes: [
          blink(0.24), blink(0.34), blink(0.44), blink(0.54), blink(0.64),
          { at: 0.84, fx: 'tphit', pct: k(320, 520), reach: 200, h: 160, around: true, targets: 12, knock: 300, launch: 380, burst: 'tpboltbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.14, shake: 7, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Stormwall (the Thunderguard's tank path: the storm as a fortress) ----------
  // docs/design/stormwall.md. The tank. The hits he takes build Thunderhead (world/melee.js): the
  // fuller it runs the less he takes; from half, its cloud answers whatever hits him or his party with
  // a bolt; full (Eye of the Storm), every monster near him is held to him and Fortress is ready. He
  // plays the Thunderguard's skills his own way (their `paths`), and these are his.
  lightningcage: skill({
    id: 'lightningcage', anim: 'bwcagecast', name: 'Lightning Cage', job: 'stormwall', type: 'attack', fx: null, icon: 'lightningcage', school: 'indigo', maxLevel: 20,
    desc: 'Drive your weapon into the floor and throw your arm up: pillars of lightning snap up in a ring round you, every monster inside is dragged in to you, dazed, and turns on you. A wait before the next (12 seconds).',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(14, 24), pct: k(90, 160), hits: 2, targets: 10, cooldown: 12,
        combo: [{ move: 'bwcagecast', dur: 0.9, step: 0, strikes: [
          { at: 0.42, fx: 'bwhit', pct: k(40, 70), reach: 200, h: 120, around: true, targets: 10, knock: 0, pull: 320, provoke: kf(3, 5), burst: 'bwcagebig', burstAt: 0, burstDur: 1, stop: 0.04, shake: 2 },
          { at: 0.72, fx: 'bwhit', pct: k(90, 160), reach: 140, h: 120, around: true, targets: 10, knock: 60, stun: kf(1, 1.8), provoke: kf(3, 5), big: true, stop: 0.08, shake: 3 },
        ] }],
      };
    },
  }),
  stormbarrier: skill({
    id: 'stormbarrier', anim: 'bwbarrier', name: 'Storm Wall', job: 'stormwall', type: 'buff', fx: null, icon: 'stormbarrier', school: 'indigo', party: true, maxLevel: 10,
    desc: 'Plant your feet and sweep your weapon across in front of you: a wall of rain and lightning bursts up before you and the party, and while it stands everyone behind it takes much less from every hit. A wait before the next (30 seconds).',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 560, h: 220, around: true };
      return {
        mp: lerp(18, 30, lv, m), pct: 0, hits: 0, targets: 0, range, cooldown: 30, aimGain: 15,
        combo: [{ move: 'bwbarrier', dur: 0.8, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 70, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'bwwallbig', burstAt: 0.9, burstDur: 1.2,
          grant: { id: 'stormbarrier', duration: lerp(10, 16, lv, m), buff: { dmgCut: kf(0.15, 0.3) }, range } }] }],
      };
    },
  }),
  magnetize: skill({
    id: 'magnetize', anim: 'bwmagnet', name: 'Magnetize', job: 'stormwall', type: 'attack', fx: null, icon: 'magnetize', school: 'indigo', maxLevel: 20,
    desc: 'Point your weapon at a group far out ahead of you and haul it back: field lines lock onto them and drag every one of them to your feet, where they turn on you. A short wait before the next (8 seconds).',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(10, 18), pct: k(70, 120), hits: 1, targets: 8, cooldown: 8,
        combo: [{ move: 'bwmagnet', dur: 0.8, step: 0, strikes: [{ at: 0.55, fx: 'bwhit', pct: k(70, 120), reach: 300, h: 110, targets: 8, knock: 0, pull: 480, provoke: kf(3, 5), burst: 'bwfieldbig', burstAt: 0, burstDur: 0.6, big: true, stop: 0.05, shake: 2 }] }],
      };
    },
  }),
  overcast: skill({
    id: 'overcast', anim: 'bwovercast', name: 'Overcast', job: 'stormwall', type: 'buff', fx: null, icon: 'overcast', school: 'indigo', party: true, maxLevel: 10,
    desc: 'Raise your weapon to the sky: the thundercloud spreads out over you and the party, and a shield of it settles on everyone, soaking up the next blows until it is gone. A wait before the next (35 seconds).',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 560, h: 220, around: true };
      return {
        mp: lerp(20, 34, lv, m), pct: 0, hits: 0, targets: 0, range, cooldown: 35, aimGain: 15,
        combo: [{ move: 'bwovercast', dur: 0.85, step: 0, strikes: [{ at: 0.55, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'bwovercastfx', burstAt: 0, burstDur: 1.6, follow: true,
          grant: { id: 'overcast', duration: 15, buff: { barrier: kf(0.12, 0.26) }, range } }] }],
      };
    },
  }),
  bedrock: skill({
    id: 'bedrock', name: 'Bedrock', job: 'stormwall', type: 'passive', grows: true, fx: null, icon: 'bedrock',
    desc: 'Rooted like a mountain under the storm: more max HP, harder armour, and less from every hit.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.06, 0.3, lv, m), wdef: lerp(6, 45, lv, m), mdef: lerp(4, 30, lv, m) } }),
  }),
  fortress: skill({
    id: 'fortress', anim: 'bwfortress', dmg: 1.1, name: 'Fortress', job: 'stormwall', type: 'attack', fx: null, icon: 'fortress', school: 'indigo', maxLevel: 10, fullGauge: true, party: true,
    desc: 'Finisher: needs a full Thunderhead, and spends it. Raise your weapon and call the whole storm down: a thunderhead spreads over the fight, a ring of lightning pillars locks round you and the party, every monster inside is dragged in, taunted and struck by bolt after bolt, and a shield of storm settles on everyone.',
    weapons: ['sword', 'axe', 'spear'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 600, h: 240, around: true };
      const bolt = (at, burstAt) => ({ at, fx: 'bwhit', pct: k(80, 130), reach: 260, h: 160, around: true, targets: 12, knock: 40, stun: 0.3, burst: 'bwboltdown', burstAt, burstDur: 0.6, stop: 0.04, shake: 2, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(80, 130), hits: 5, targets: 12,
        combo: [{ move: 'bwfortress', dur: 1.7, step: 0, finisher: true, guard: 1.6, strikes: [
          { at: 0.08, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'bwstormcloud', burstAt: 0, burstDur: 1.4, follow: true },
          { at: 0.42, fx: 'bwhit', pct: k(60, 100), reach: 280, h: 160, around: true, targets: 12, knock: 0, pull: 300, provoke: 6, burst: 'bwcagebig', burstAt: 0, burstDur: 1.2, gauge: 0,
            grant: { id: 'fortress', duration: 12, buff: { barrier: kf(0.2, 0.35), dmgCut: kf(0.1, 0.2) }, range } },
          bolt(0.56, 0.5), bolt(0.66, -0.5), bolt(0.76, 0.2),
          { at: 0.88, fx: 'bwhit', pct: k(260, 420), reach: 220, h: 160, around: true, targets: 12, knock: 260, launch: 300, provoke: 6, burst: 'bwclapbig', burstAt: 0, burstDur: 0.75, big: true, stop: 0.14, shake: 7, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- The Acrobat Archer (mint and gold: gold arrows, mint ribbons, stars, confetti) ----------
  // The Archer remade (ids kept; docs/design/acrobat-archer.md): a playful show-off who shoots
  // mid-trick with a short trick bow. Her shots that land build Combo (world/melee.js); full
  // (Showtime) every shot splits into three, and Grand Somersault needs it full and spends it.
  //
  // A simple first job: she fights with her basic shots, and two tricks set themselves off from them
  // (procs, see world/melee.js): Firework Arrow and Ribbon Snare. Her buttons are Handspring
  // (getting past them), Springboard (a trap) and Grand Somersault. Steady Hands and Light Feet are
  // passives.
  blastarrow: skill({
    id: 'blastarrow', name: 'Firework Arrow', job: 'archer', type: 'passive', fx: null, school: 'hawk',
    desc: 'Your shots sometimes go off like fireworks where they land, bursting in gold and mint on everything close around their target, hit or miss.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.3, lv, m), r: lerp(50, 80, lv, m), pct: lerp(110, 160, lv, m) } }),
  }),
  snarearrow: skill({
    id: 'snarearrow', name: 'Ribbon Snare', job: 'archer', type: 'passive', fx: null, school: 'hawk',
    desc: 'Your shots sometimes trail a ribbon that wraps their target up in a bow, holding it in place for a few seconds. While it is tied up, your shots hit it harder.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.3, lv, m), secs: lerpf(2, 3.5, lv, m), bonus: lerpf(0.15, 0.3, lv, m) } }),
  }),
  springtrap: skill({
    id: 'springtrap', name: 'Springboard', job: 'archer', type: 'attack', fx: null, school: 'hawk', maxLevel: 10, lock: 0.7, landAt: 0.4,
    desc: 'Set a little circus springboard down just ahead and give it a pat. The first monster to step on it is bounced high into the air. Up to three at once. A Phantom Trickster sets down her top hat instead (Top Hat), an Arbalist Engineer winds up a brass spring mine (Spring Mine).',
    pathNames: { beastmaster: 'Top Hat', stormcaller: 'Spring Mine' },
    // (Each archer path sets its own: data/path-skills.js.)
    at: (lv, m) => ({ mp: lerp(8, 14, lv, m), pct: lerp(180, 300, lv, m), life: lerp(12, 20, lv, m), trap: true, paths: { beastmaster: { anim: 'pthattrap', look: 'hat' }, stormcaller: { anim: 'aewind', look: 'mine' } } }),
  }),
  vault: skill({
    id: 'vault', name: 'Handspring', job: 'archer', type: 'attack', fx: null, icon: 'vault', maxLevel: 10, school: 'hawk', movement: true,
    desc: 'Run in and handspring right over the monster in front of you, land behind it, and turn to shoot it. Nothing touches you mid-flip. A Phantom Trickster vanishes in a puff of smoke and steps out behind it (Vanishing Act); an Arbalist Engineer rockets over it on her steam boots (Steam Hop).',
    pathNames: { beastmaster: 'Vanishing Act', stormcaller: 'Steam Hop' },
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(110, 180), hits: 1, targets: 1,
        combo: [{ move: 'achandspring', dur: 0.66, step: k(100, 140), carry: 0.62, guard: 0.6, strikes: [{ at: 0.02, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'achspring', burstAt: 0, burstDur: 0.75 }, { at: 0.8, turn: true, shot: 'hawkarrow', pct: k(110, 180), range: 300, h: 70, knock: 160, speed: 900, big: true, stop: 0.05, shake: 1 }] }],
        paths: {
          // Vanishing Act: she sweeps her cape across her with a flourish and is gone in a puff of
          // plum smoke; she steps out of another behind it with a twirl and looses back at it.
          beastmaster: [{ move: 'ptvanish', dur: 0.66, step: k(100, 140), carry: 0.6, guard: 0.6, vanish: [0.24, 0.56], strikes: [{ at: 0.8, turn: true, shot: 'hawkarrow', pct: k(110, 180), range: 300, h: 70, knock: 160, speed: 900, big: true, stop: 0.05, shake: 1 }] }],
          // Steam Hop: she crouches and slaps the valve on her belt; her boots blast steam and she
          // rockets over it in a tucked arc, the crossbow hugged to her chest, lands skidding, spins
          // round and fires.
          stormcaller: [{ move: 'aejet', dur: 0.66, step: k(100, 140), carry: 0.62, guard: 0.6, strikes: [
            { at: 0.14, pct: 0, reach: 0, h: 0, targets: 0, burst: 'aesteam', burstAt: 0, burstDur: 0.5, quiet: true, gauge: 0 },
            { at: 0.64, pct: 0, reach: 0, h: 0, targets: 0, burst: 'aesteam', burstAt: 0, burstDur: 0.4, quiet: true, gauge: 0 },
            { at: 0.8, turn: true, shot: 'hawkarrow', pct: k(110, 180), range: 300, h: 70, knock: 160, speed: 900, big: true, stop: 0.05, shake: 1 },
          ] }],
        },
      };
    },
  }),
  steadyhands: skill({
    id: 'steadyhands', name: 'Steady Hands', job: 'archer', type: 'passive', grows: true, fx: null,
    desc: 'Quicker on the draw: you shoot faster and aim truer.',
    at: (lv, m) => ({ passive: { attackSpeed: lerpf(0.03, 0.15, lv, m), acc: lerp(3, 25, lv, m), mastery: lerpf(0.1, 0.35, lv, m) } }),
  }),
  // (Its own id: the Wind Dancer's Light Feet once shared 'lightfeet' and silently replaced it.)
  springstep: skill({
    id: 'springstep', name: 'Spring Step', job: 'archer', type: 'passive', grows: true, fx: null, icon: 'springstep',
    desc: 'A tumbler\'s spring in every step: you run faster and dodge more.',
    at: (lv, m) => ({ passive: { speed: lerp(3, 18, lv, m), eva: lerp(3, 25, lv, m) } }),
  }),
  cometarrow: skill({
    id: 'cometarrow', dmg: 1.44, name: 'Grand Somersault', job: 'archer', type: 'attack', fx: null, school: 'hawk', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a full Combo, and spends it. Crouch deep and launch yourself into a huge triple somersault high above the screen; at the top a ring of gold bursts round you and you rain golden arrows down on everything below, then land with a wink. A Phantom Trickster levitates and tips a giant top hat over them (Levitation); an Arbalist Engineer fires a mortar shell that bursts into a hail of bolts (Bolt Mortar).',
    pathNames: { beastmaster: 'Levitation', stormcaller: 'Bolt Mortar' },
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 50), pct: k(120, 200), hits: 1, targets: 0,
        combo: [{ move: 'acsomersault', dur: 1.9, step: 0, finisher: true, guard: 1.7, strikes: [
          { at: 0.58, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'acburst', burstAt: 0, burstDur: 0.8, gauge: 0 },
          { at: 0.6, rain: k(12, 16), pct: k(120, 200), rainW: 420, around: true, span: 0.3, knock: 60, launch: 140, variant: 'acarrow', school: 'acro', gauge: 0 },
        ] }],
        paths: {
          // Levitation: the magician's levitation trick. She sweeps her cape round herself and floats
          // slowly up, lying back on the air; at the top a giant top hat appears over the stage, tips
          // over and pours plum arrows, cards and doves down on everything below while she draws and
          // looses into it; then she drifts down and takes her bow.
          beastmaster: [{ move: 'ptlevitate', dur: 1.9, step: 0, finisher: true, guard: 1.7, strikes: [
            { at: 0.48, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'pthat', burstAt: 0, burstDur: 0.95, gauge: 0 },
            { at: 0.6, rain: k(12, 16), pct: k(120, 200), rainW: 420, around: true, span: 0.3, knock: 60, launch: 140, variant: 'ptarrow', school: 'phantom', gauge: 0 },
          ] }],
          // Bolt Mortar: down on one knee, she plants the crossbow's stock on the ground pointing at
          // the sky, cranks it three times and fires a brass shell straight up with a kick that rocks
          // her back; it bursts high overhead into a ring of cogs and steam and a hail of teal bolts
          // comes down on everything below, while she shades her eyes and pumps her fist.
          stormcaller: [{ move: 'aemortar', dur: 1.9, step: 0, finisher: true, guard: 1.7, strikes: [
            { at: 0.44, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'aeshell', burstAt: 0, burstDur: 1.0, gauge: 0 },
            { at: 0.6, rain: k(12, 16), pct: k(120, 200), rainW: 420, around: true, span: 0.3, knock: 60, launch: 140, variant: 'aebolt', school: 'brass', gauge: 0 },
          ] }],
        },
      };
    },
  }),

  // ---------- The Phantom Trickster (the Acrobat Archer's bow path; replaces the Beastmaster) ----------
  // A stage magician with a bow (ids kept for saves; docs/design/phantom-trickster.md). Her shots that
  // land build Illusion (world/melee.js): half full, a see-through copy of her shoots beside her; full,
  // two (a third with Hall of Mirrors), shooting with every arrow. Her tricks set themselves off from
  // her shots (Vanishing Arrow, Dove Arrow, Card Trick: world/phantom.js); her buttons are Smoke Bomb,
  // Showstopper and the finisher, Grand Illusion.
  beastmastery: skill({
    id: 'beastmastery', name: 'Sleight of Hand', job: 'beastmaster', type: 'passive', grows: true, fx: null,
    desc: 'Quick fingers: steadier shots, more attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 25, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  wildhunt: skill({
    id: 'wildhunt', name: 'Vanishing Arrow', job: 'beastmaster', type: 'passive', fx: null, icon: 'wildhunt', school: 'phantom', maxLevel: 10,
    desc: 'Your shots sometimes vanish in a puff of smoke as they hit and reappear behind their target a beat later, striking it again from behind.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.12, 0.3, lv, m), pct: lerp(90, 160, lv, m) } }),
  }),
  wolfpounce: skill({
    id: 'wolfpounce', name: 'Dove Arrow', job: 'beastmaster', type: 'passive', fx: null, school: 'phantom',
    desc: 'Your shots sometimes burst into silver doves as they hit, which fly on and strike the monsters close round their target.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.12, 0.3, lv, m), pct: lerp(70, 130, lv, m), n: lerp(2, 3, lv, m) } }),
  }),
  hawkstrike: skill({
    id: 'hawkstrike', name: 'Card Trick', job: 'beastmaster', type: 'passive', fx: null, school: 'phantom',
    desc: 'Your shots sometimes come with a fan of three playing cards flicked from your fingers, cutting through the line.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.12, 0.3, lv, m), pct: lerp(50, 90, lv, m) } }),
  }),
  packhowl: skill({
    id: 'packhowl', name: 'Smoke Bomb', job: 'beastmaster', type: 'attack', fx: null, school: 'phantom', maxLevel: 10, lock: 0.62, landAt: 0.4,
    desc: 'Slap a smoke bomb down at your feet: everything close round you is knocked back and stunned, loses track of you, and nothing touches you while the smoke is thick.',
    at: (lv, m) => ({ mp: lerp(10, 18, lv, m), pct: lerp(100, 170, lv, m), stun: lerpf(1, 2, lv, m), r: lerp(100, 140, lv, m), smoke: true }),
  }),
  loyalguard: skill({
    id: 'loyalguard', name: 'Mirror Dodge', job: 'beastmaster', type: 'passive', fx: null, school: 'phantom', maxLevel: 10,
    desc: 'While a copy of you stands behind you, a hit sometimes strikes the copy instead: it pops in a puff of smoke and comes back a few seconds later.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.25, lv, m) } }),
  }),
  snacktime: skill({
    id: 'snacktime', name: 'Showstopper', job: 'beastmaster', type: 'buff', fx: 'buff', school: 'phantom', maxLevel: 10, lock: 0.8, landAt: 0.6,
    desc: 'Take a grand bow and snap your fingers: for a while your copies hit much harder.',
    at: (lv, m) => ({ mp: lerp(20, 30, lv, m), duration: lerp(15, 30, lv, m), buff: { copyPower: lerpf(0.4, 1, lv, m) } }),
  }),
  alpha: skill({
    id: 'alpha', name: 'Hall of Mirrors', job: 'beastmaster', type: 'passive', fx: null, school: 'phantom', maxLevel: 10,
    desc: 'While your Illusion is full, a third copy of you joins the other two.',
    at: (lv, m) => ({ passive: {}, proc: { pct: lerp(1, 1, lv, m) } }),
  }),
  stampede: skill({
    id: 'stampede', dmg: 3, name: 'Grand Illusion', job: 'beastmaster', type: 'attack', fx: null, school: 'phantom', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Illusion, and spends it. Sweep your cape up, snap your fingers and vanish in smoke: a ring of copies of you appears all round the screen, and they all loose at once at the monsters nearest them. Then you reappear and take a bow.',
    weapons: ['bow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 50), pct: k(260, 440), hits: 1, targets: 0,
        combo: [{ move: 'ptillusion', dur: 2.4, step: 0, finisher: true, guard: 2.2, strikes: [
          { at: 0.1, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, grand: { n: k(8, 12), r: 300, at: 1.2, pct: k(260, 440), hide: 1.7 } },
        ] }],
      };
    },
  }),


  // ---------- Arbalist Engineer (the archer's crossbow path: brass and teal, gears, steam) ----------
  // The Stormcaller remade (the player's ask, 2026-11-02; docs/design/arbalist.md): an excited
  // inventor whose crossbow is her own machine. Every bolt that lands builds Pressure (internally
  // Charge, world/melee.js); full (Overdrive), every shot fires a second bolt. Her gadgets go off by
  // themselves (world/engineer.js): Sticky Bolt from any bolt, Cluster Bolt from the string's last,
  // Steam Vent when a hit lands on her. Her buttons are Deploy Turret, Wind-Up Bomb, Overclock and
  // Big Bertha.
  // (Internally the path keeps the Stormcaller's id, so saves and quests carry over.)
  engmastery: skill({
    id: 'engmastery', name: 'Engineer Mastery', job: 'stormcaller', type: 'passive', grows: true, fx: null, icon: 'engmastery',
    desc: 'Steadier bolts, more attack, and sharper aim with a crossbow.',
    weapons: ['crossbow'],
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 20, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  stickybolt: skill({
    id: 'stickybolt', name: 'Sticky Bolt', job: 'stormcaller', type: 'passive', fx: null, icon: 'stickybolt', school: 'brass',
    desc: 'Your bolts sometimes stick where they hit, tick for a moment, and burst on everything close by.',
    weapons: ['crossbow'],
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.12, 0.3, lv, m), pct: lerp(90, 160, lv, m), r: lerp(50, 80, lv, m) } }),
  }),
  clusterbolt: skill({
    id: 'clusterbolt', name: 'Cluster Bolt', job: 'stormcaller', type: 'passive', fx: null, icon: 'clusterbolt', school: 'brass',
    desc: 'The last bolt of your string sometimes splits into little bomblets that burst in a row across where it lands.',
    weapons: ['crossbow'],
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.35, 0.8, lv, m), n: lerp(3, 5, lv, m), pct: lerp(60, 110, lv, m) } }),
  }),
  steamvent: skill({
    id: 'steamvent', name: 'Steam Vent', job: 'stormcaller', type: 'passive', fx: null, icon: 'steamvent', school: 'brass', maxLevel: 10,
    desc: 'A hit that lands on you sometimes makes your machine vent: the hit is softened, and the steam blasts the monsters close by away from you.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.2, 0.45, lv, m), cut: lerpf(0.2, 0.45, lv, m), pct: lerp(80, 150, lv, m), r: 80 } }),
  }),
  deployturret: skill({
    id: 'deployturret', name: 'Deploy Turret', job: 'stormcaller', type: 'attack', fx: null, icon: 'deployturret', school: 'brass', maxLevel: 10,
    desc: 'Kneel and set a little brass turret down in front of you: it turns to the nearest monster and fires bolts at it on its own for a while. Setting another packs the old one away.',
    weapons: ['crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(20, 30), pct: k(60, 110), hits: 0, targets: 1,
        combo: [{ move: 'aedeploy', dur: 0.8, step: 0, strikes: [{ at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, turret: { duration: k(15, 30), pct: k(60, 110), every: lerpf(0.7, 0.45, lv, m), range: 260 } }] }],
      };
    },
  }),
  windupbomb: skill({
    id: 'windupbomb', name: 'Wind-Up Bomb', job: 'stormcaller', type: 'attack', fx: null, icon: 'windupbomb', school: 'brass', maxLevel: 10,
    desc: 'Crouch, crank the key on a little clockwork bomb and let it go: it toddles off at the monsters on its tiny feet and goes off with a bang of gears and steam, catching everything round it. You cover your ears. Needs a crossbow.',
    weapons: ['crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 24), pct: k(200, 340), hits: 1, targets: 8,
        combo: [{ move: 'aewindup', dur: 0.85, step: 0, strikes: [
          { at: 0.46, shot: 'aewindup', free: true, pct: k(200, 340), range: 300, h: 70, oy: 16, targets: 8, blast: 110, blastFx: 'aeboom', burst: 'aeboom', speed: 230, knock: 180, launch: 160, big: true, stop: 0.08, shake: 4, gauge: 6 },
        ] }],
      };
    },
  }),
  overclock: skill({
    id: 'overclock', name: 'Overclock', job: 'stormcaller', type: 'buff', fx: 'buff', icon: 'overclock', school: 'brass', maxLevel: 10, lock: 0.8, landAt: 0.75,
    desc: 'Crank your crossbow past its limits: your next few bolts are heavy bolts that tear through every monster in their line, hitting far harder.',
    at: (lv, m) => ({ mp: lerp(20, 30, lv, m), duration: 20, buff: { shots: lerp(3, 6, lv, m), power: lerpf(1.6, 2.2, lv, m) } }),
  }),
  bigbertha: skill({
    id: 'bigbertha', dmg: 3, name: 'Big Bertha', job: 'stormcaller', type: 'attack', fx: null, icon: 'bigbertha', school: 'brass', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Pressure, and spends it. Flip your goggles down and unfold your crossbow into a giant ballista; crank it, and fire one enormous bolt that blasts through everything in front of you. Then push your goggles up, sooty, and grin.',
    weapons: ['crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 50), pct: k(700, 1200), hits: 1, targets: 12,
        combo: [{ move: 'aebertha', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.04, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'aeballista', burstAt: 0, burstDur: 1.5 },
          { at: 0.65, shot: 'aebertha', pct: k(700, 1200), range: 620, h: 140, targets: 12, pierce: true, speed: 1300, knock: 420, launch: 220, big: true, stop: 0.18, shake: 9, muzzle: 'aesteam', gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Wind Dancer (coral and cream: ribbons, crescent gusts, spinning rings) ----------
  // The Thief remade (the player's ask, 2026-11-02; docs/design/wind-dancer.md): a travelling
  // dancer who fights like it's a show, on the Warrior's formula. Her hits build Encore (the old
  // Shadow, world/melee.js: hits landing in a quick chain); full (Standing Ovation), every attack
  // strikes twice. Her book is mostly skills that go off by themselves from her own attacks
  // (procs, like the Warrior's): Ribbon Lash from any swing, Gust Line from a string's last blow,
  // Spotlight when Encore fills, Light Feet when a hit lands on her. Her only buttons besides
  // attack are Pirouette (getting about) and Grand Finale (the finisher, on full Encore). She
  // fights with chakrams (the dagger items) or with wind from her gloved hands (the gauntlets).
  // (Internally she keeps the Thief's id, so saves, gear and quests carry over.)
  pirouette: skill({
    id: 'pirouette', name: 'Pirouette', job: 'thief', type: 'attack', fx: null, icon: 'pirouette', maxLevel: 10, school: 'coral', movement: true,
    desc: 'Spin away across the stage in a whirl of ribbons, cutting every monster you pass. Nothing touches you on the way.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const hit = (at) => ({ at, pct: k(60, 110), reach: 52, h: 66, around: true, targets: 5, knock: 70, fx: 'wdhit', gauge: 2 });
      return {
        mp: k(10, 6), pct: k(60, 110), hits: 2, targets: 5,
        combo: [{ move: 'wdchaine', dur: 0.45, step: k(110, 170), carry: 0.6, guard: 0.5, trail: true, strikes: [{ ...hit(0.25), burst: 'wdswirl', burstAt: 0, burstDur: 0.4 }, hit(0.55)] }],
        // The Blade Dancer promenades across on her toes with both rings whirling round her at
        // arm's length, and catches them with a hip pop; the Sky Dancer is lifted on a sky-blue whirl
        // and turns through the air like a leaf on the wind. (Same numbers; world/combat.js.)
        paths: {
          shinobi: [{ move: 'bdpromenade', dur: 0.45, step: k(110, 170), carry: 0.6, guard: 0.5, trail: true, strikes: [{ ...hit(0.25), fx: 'bdhit', burst: 'bdorbit', burstAt: 0, burstDur: 0.45 }, { ...hit(0.55), fx: 'bdhit' }] }],
          kitsune: [{ move: 'sdzephyr', dur: 0.45, step: k(110, 170), carry: 0.6, guard: 0.5, trail: true, strikes: [{ ...hit(0.25), fx: 'skyhit', burst: 'skyupdraft', burstAt: 0, burstDur: 0.45 }, { ...hit(0.55), fx: 'skyhit' }] }],
        },
      };
    },
  }),
  ribbonlash: skill({
    id: 'ribbonlash', name: 'Ribbon Lash', job: 'thief', type: 'passive', fx: null, icon: 'ribbonlash', school: 'coral',
    desc: 'Your attacks sometimes whirl on into a lash of ribbons that cuts everything around you twice, hit or miss.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.28, lv, m), pct: lerp(55, 100, lv, m), targets: lerp(2, 5, lv, m) } }),
  }),
  gustline: skill({
    id: 'gustline', name: 'Gust Line', job: 'thief', type: 'passive', fx: null, icon: 'gustline', school: 'coral',
    desc: "The last blow of your string flings a crescent gust down the line that cuts every monster it passes.",
    at: (lv, m) => ({ passive: {}, proc: { pct: lerp(80, 150, lv, m), targets: lerp(3, 6, lv, m) } }),
  }),
  spotlight: skill({
    id: 'spotlight', name: 'Spotlight', job: 'thief', type: 'passive', fx: null, icon: 'spotlight', school: 'coral', party: true,
    desc: 'Whenever Encore fills, you strike a pose: every monster around you is dazzled for a moment, and you and the party around you move faster and dodge more for a while.',
    at: (lv, m) => ({ passive: {}, proc: { pct: lerp(60, 110, lv, m), stun: lerpf(0.8, 1.6, lv, m), duration: lerp(15, 40, lv, m), buff: { speed: lerp(8, 24, lv, m), eva: lerp(6, 30, lv, m) }, range: { w: lerp(320, 460, lv, m), h: 160, around: true } } }),
  }),
  lightfeet: skill({
    id: 'lightfeet', name: 'Light Feet', job: 'thief', type: 'passive', fx: null, icon: 'lightfeet', school: 'coral',
    desc: "A hit that lands on you sometimes sets you dancing: nothing can touch you for a moment, and you dodge more for a few seconds.",
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.15, 0.45, lv, m), secs: lerpf(0.8, 1.6, lv, m), duration: lerp(3, 8, lv, m), buff: { eva: lerp(10, 50, lv, m) } } }),
  }),
  nimblefeet: skill({
    id: 'nimblefeet', name: 'Nimble', job: 'thief', type: 'passive', grows: true, fx: null, icon: 'nimblefeet',
    desc: 'Permanently raises avoid and accuracy.',
    at: (lv, m) => ({ passive: { eva: lerp(3, 30, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  daggermastery: skill({
    id: 'daggermastery', name: 'Chakram Mastery', job: 'thief', type: 'passive', grows: true, fx: null, icon: 'daggermastery',
    desc: 'Steadier, stronger chakram hits.',
    weapons: ['dagger'],
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), watk: lerp(2, 18, lv, m) } }),
  }),
  gauntletmastery: skill({
    id: 'gauntletmastery', name: 'Glove Mastery', job: 'thief', type: 'passive', grows: true, fx: null, icon: 'gauntletmastery',
    desc: 'Steadier, stronger gusts and sharper aim with gloves.',
    weapons: ['gauntlet'],
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  grandfinale: skill({
    id: 'grandfinale', dmg: 1.2, name: 'Grand Finale', job: 'thief', type: 'attack', fx: null, icon: 'grandfinale', school: 'coral', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Encore, and spends it. A spotlight drops on you; you spin up a great rose of ribbons that cuts everything around you again and again, then it bursts open and throws them all into the air.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const cut = (at) => ({ at, pct: k(70, 120), reach: 180, h: 150, around: true, targets, knock: 10, pull: 60, fx: 'wdhit', quiet: true, stop: 0.03, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 6, targets,
        combo: [{ move: 'wdencore', dur: 1.35, step: 0, finisher: true, guard: 1.26, strikes: [
          { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, burst: 'wdfinale', burstAt: 0, burstDur: 1.17, quiet: true, gauge: 0 },
          cut(0.28), cut(0.36), cut(0.44), cut(0.52), cut(0.6),
          { at: 0.74, pct: k(420, 720), reach: 200, h: 160, around: true, targets, knock: 280, launch: 360, fx: 'wdhit', big: true, stop: 0.15, shake: 7, gauge: 0 },
        ] }],
        // The Blade Dancer's (a ring revue): she tosses her ring high and turns under it as rose-gold
        // rings cascade round her, cutting, then catches it in a high kick line and they all fly
        // out. The Sky Dancer's (a cloudburst): she spirals up into a gathering storm of clouds,
        // hangs at the top, and dives down through it in a spinning heel drop that bursts it open.
        paths: {
          shinobi: [{ move: 'bdrevue', dur: 1.35, step: 0, finisher: true, guard: 1.26, strikes: [
            { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, burst: 'bdrevue', burstAt: 0, burstDur: 1.17, quiet: true, gauge: 0 },
            ...[0.28, 0.36, 0.44, 0.52, 0.6].map((at) => ({ ...cut(at), fx: 'bdhit' })),
            { at: 0.74, pct: k(420, 720), reach: 200, h: 160, around: true, targets, knock: 280, launch: 360, fx: 'bdhit', big: true, stop: 0.15, shake: 7, gauge: 0 },
          ] }],
          kitsune: [{ move: 'sdcloudburst', dur: 1.35, step: 0, finisher: true, guard: 1.26, strikes: [
            { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, burst: 'skycloudburst', burstAt: 0, burstDur: 1.17, quiet: true, gauge: 0, floor: true },
            ...[0.28, 0.36, 0.44, 0.52, 0.6].map((at) => ({ ...cut(at), fx: 'skyhit' })),
            { at: 0.74, pct: k(420, 720), reach: 200, h: 160, around: true, targets, knock: 280, launch: 360, fx: 'skyhit', big: true, stop: 0.15, shake: 7, gauge: 0 },
          ] }],
        },
      };
    },
  }),

  // ---------- Blade Dancer (the Wind Dancer's chakram path: rose gold, bouncing rings, a carousel) ----------
  // docs/design/blade-dancer.md. Every blow of hers is a throw or a catch: her rings ricochet from
  // monster to monster and fly home to her hand (world/melee.js ringThrow). Rings landing and
  // bouncing build Ricochet (internally Ki, the Shinobi's it replaced); full (Carousel), two rings
  // orbit her and cut what comes close. Like the Wind Dancer, her book is mostly skills that go off
  // by themselves (Rebound, Twin Rings); her buttons are Hoopla, Juggling Act, Curtain Call (a
  // party buff) and Golden Carousel, the finisher.
  // (Internally the path keeps the Shinobi's id, so saves and quests carry over.)
  ringmastery: skill({
    id: 'ringmastery', name: 'Ring Mastery', job: 'shinobi', type: 'passive', grows: true, fx: null, icon: 'ringmastery',
    desc: 'Steadier ring throws, more attack, and more critical hits.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 16, lv, m), critRate: lerpf(0.02, 0.12, lv, m) } }),
  }),
  rebound: skill({
    id: 'rebound', name: 'Rebound', job: 'shinobi', type: 'passive', fx: null, icon: 'rebound', school: 'rosegold',
    desc: 'Your thrown rings sometimes keep ricocheting: they bounce on to two or three more monsters before they fly home.',
    weapons: ['dagger'],
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.15, 0.4, lv, m), extra: lerp(2, 3, lv, m) } }),
  }),
  twinrings: skill({
    id: 'twinrings', name: 'Twin Rings', job: 'shinobi', type: 'passive', fx: null, icon: 'twinrings', school: 'rosegold',
    desc: 'A second ring sometimes flies a beat after your throw, at the next monster along, and bounces just the same.',
    weapons: ['dagger'],
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.12, 0.35, lv, m), pct: lerp(50, 80, lv, m) } }),
  }),
  // Her new buttons (the all-class pass, 2026-11-07): a ring toss, a juggling act, and a bow.
  hoopla: skill({
    id: 'hoopla', name: 'Hoopla', job: 'shinobi', type: 'attack', fx: null, icon: 'hoopla', school: 'rosegold', maxLevel: 10,
    desc: 'Toss your big ring underhand in a high arc, like a fairground ring toss: it drops right over the monster, spins down tight round it with a gold DING, and leaves it dizzy for a moment. Needs chakrams.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(12, 20), pct: k(300, 500), hits: 1, targets: 1,
        combo: [{ move: 'bdhoopla', dur: 0.62, step: 6, strikes: [
          { at: 0.42, shot: 'ringbig', lob: 70, bounce: 0, pct: k(300, 500), range: 300, h: 80, knock: 0, stun: kf(1.2, 2), speed: 700, burst: 'bdhoopla', big: true, stop: 0.1, shake: 3, gauge: 6 },
        ] }],
      };
    },
  }),
  jugglingact: skill({
    id: 'jugglingact', name: 'Juggling Act', job: 'shinobi', type: 'attack', fx: null, icon: 'jugglingact', school: 'rosegold', maxLevel: 10,
    desc: 'Juggle three rings in a cascade high over your head, then sweep your arm round and send all three flying at once, each ricocheting on through the crowd. Needs chakrams.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const ring = (i) => ({ at: 0.66, lag: i * 0.04, shot: 'ring', pick: i, bounce: 2, pct: k(100, 170), range: 320, h: 80, knock: 60, speed: 900, oy: (i - 1) * 6, gauge: 3, big: !i, stop: i ? 0 : 0.05, shake: i ? 0 : 2 });
      return {
        mp: k(16, 26), pct: k(100, 170), hits: 3, targets: 3,
        combo: [{ move: 'bdjuggle', dur: 0.95, step: 0, strikes: [
          { at: 0.02, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'bdjuggle', burstAt: 0, burstDur: 0.6, follow: true, gauge: 0 },
          ...[0, 1, 2].map(ring),
        ] }],
      };
    },
  }),
  showstopper: skill({
    id: 'showstopper', name: 'Curtain Call', job: 'shinobi', type: 'buff', fx: null, icon: 'showstopper', school: 'rosegold', party: true, maxLevel: 10,
    desc: 'Twirl your ring up, catch it, and sink into a deep bow as confetti bursts round you: for a minute everyone near you lands critical hits more often, and harder. The crowd needs a while to calm down (a two-minute cooldown).',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 640, h: 200, around: true };
      return {
        mp: k(30, 50), pct: 0, hits: 0, targets: 0, range, cooldown: 120,
        combo: [{ move: 'bdbow', dur: 0.9, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'bdshow', burstAt: 0, burstDur: 0.85, follow: true, grant: { id: 'showstopper', duration: 60, buff: { critRate: kf(0.06, 0.15), critDamage: kf(0.12, 0.3) }, range } }] }],
      };
    },
  }),
  goldencarousel: skill({
    id: 'goldencarousel', name: 'Golden Carousel', job: 'shinobi', type: 'attack', fx: null, icon: 'goldencarousel', school: 'rosegold', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Ricochet, and spends it. You raise your ring and turn on your toes as rings gather round you on a golden track, cutting everything close, faster and faster; then you fling your arm out and they all fly, ricocheting through every monster around. Needs chakrams.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const cut = (at) => ({ at, pct: k(60, 100), reach: 120, h: 120, around: true, targets, knock: 10, pull: 40, fx: 'bdhit', quiet: true, stop: 0.03, gauge: 0 });
      const ring = (i) => ({ at: 0.66, shot: 'ringbig', around: true, pick: i, bounce: k(3, 5), pct: k(160, 260), range: 420, h: 200, knock: 160, launch: 220, speed: 900, gauge: 0, big: !i, stop: i ? 0 : 0.12, shake: i ? 0 : 6 });
      return {
        mp: k(30, 50), pct: k(160, 260), hits: 10, targets,
        combo: [{ move: 'bdcarousel', dur: 1.44, step: 0, finisher: true, guard: 1.35, strikes: [
          { at: 0.04, pct: 0, reach: 0, h: 0, targets: 0, burst: 'bdcarousel', burstAt: 0, burstDur: 1.26, quiet: true, gauge: 0 },
          cut(0.2), cut(0.3), cut(0.4), cut(0.5), cut(0.58),
          ...[0, 1, 2, 3, 4, 5].map(ring),
        ] }],
      };
    },
  }),

  // ---------- Sky Dancer (the Wind Dancer's glove path: sky blue, white and sunlight) ----------
  // docs/design/sky-dancer.md. She dances on the air: every blow lifts her and throws a crescent of
  // wind down at them (world/melee.js skyLift). Her hits build Tailwind (internally Tails, the
  // Kitsune's it replaced), faster in the air; full, she flies freely and her gusts are twice as
  // big. Like the Wind Dancer, her book is mostly skills that go off by themselves (Updraft,
  // Zephyr); her buttons are Downburst (a dive), Gale Step (a dash), Cloud Nine (a party buff)
  // and Sky Waltz, the finisher.
  // (Internally the path keeps the Kitsune's id, so saves and quests carry over.)
  skymastery: skill({
    id: 'skymastery', name: 'Sky Mastery', job: 'kitsune', type: 'passive', grows: true, fx: null, icon: 'skymastery',
    desc: 'Steadier gusts, more attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 20, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  updraft: skill({
    id: 'updraft', name: 'Updraft', job: 'kitsune', type: 'passive', fx: null, icon: 'updraft', school: 'aerial',
    desc: 'Your gusts sometimes land in a rising whirl of wind that hits harder and throws the monster high into the air.',
    weapons: ['gauntlet'],
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.12, 0.35, lv, m), pct: lerp(120, 160, lv, m), launch: lerp(320, 460, lv, m) } }),
  }),
  zephyr: skill({
    id: 'zephyr', name: 'Zephyr', job: 'kitsune', type: 'passive', fx: null, icon: 'zephyr', school: 'aerial',
    desc: 'While you dance in the air, a second gust sometimes follows the first a beat later.',
    weapons: ['gauntlet'],
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.15, 0.4, lv, m), pct: lerp(50, 80, lv, m) } }),
  }),
  // Her new buttons (the all-class pass, 2026-11-07): a dive, a dash, and a buff for the party.
  downburst: skill({
    id: 'downburst', name: 'Downburst', job: 'kitsune', type: 'attack', fx: null, icon: 'downburst', school: 'aerial', maxLevel: 10,
    desc: 'Ride the wind up, roll over at the top and dive palm-first into the ground: a blast of wind bursts out both ways where you land, knocking monsters flying. Needs gloves.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 22), pct: k(190, 330), hits: 1, targets: 6,
        combo: [{ move: 'sddive', dur: 0.6, step: 30, carry: 0.35, dive: 1100, diveAt: 0.36, strikes: [
          { onLand: true, pct: k(190, 330), reach: 120, h: 80, around: true, targets: 6, knock: 160, launch: 180, fx: 'skyhit', burst: 'sddownburst', burstAt: 0, burstDur: 0.55, big: true, stop: 0.08, shake: 4, gauge: 3 },
        ] }],
      };
    },
  }),
  galestep: skill({
    id: 'galestep', name: 'Gale Step', job: 'kitsune', type: 'attack', fx: null, icon: 'galestep', school: 'aerial', maxLevel: 10, movement: true,
    desc: 'Lie out flat on a gust and shoot forward through the air on a trail of feathers, cutting everything you pass. Nothing touches you on the way. Needs gloves.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const hit = (at) => ({ at, pct: k(80, 140), reach: 70, h: 70, around: true, targets: 6, knock: 60, fx: 'skyhit', gauge: 2 });
      return {
        mp: k(10, 16), pct: k(80, 140), hits: 2, targets: 6,
        combo: [{ move: 'sdgale', dur: 0.42, step: k(150, 210), carry: 0.55, guard: 0.5, strikes: [{ ...hit(0.3), burst: 'sdgalefx', burstAt: 0, burstDur: 0.45 }, hit(0.55)] }],
      };
    },
  }),
  cloudnine: skill({
    id: 'cloudnine', name: 'Cloud Nine', job: 'kitsune', type: 'buff', fx: null, icon: 'cloudnine', school: 'aerial', party: true, maxLevel: 10,
    desc: 'Spread your arms and call up a ring of little clouds: for a minute everyone near you attacks faster, dodges more, and runs and jumps lighter. The clouds need a while to gather again (a two-minute cooldown).',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 640, h: 200, around: true };
      return {
        mp: k(30, 50), pct: 0, hits: 0, targets: 0, range, cooldown: 120,
        combo: [{ move: 'sdcloud', dur: 0.8, step: 0, strikes: [{ at: 0.35, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'sdcloudring', burstAt: 0, burstDur: 1.6, follow: true }, { at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'sdcloudnine', burstAt: 0, burstDur: 1.4, follow: true, grant: { id: 'cloudnine', duration: 60, buff: { attackSpeed: kf(0.06, 0.12), eva: k(10, 30), speed: k(8, 20), jump: k(4, 10) }, range } }] }],
      };
    },
  }),
  skywaltz: skill({
    id: 'skywaltz', name: 'Sky Waltz', job: 'kitsune', type: 'attack', fx: null, icon: 'skywaltz', school: 'aerial', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Tailwind, and spends it. You turn on the air, faster and faster, as a giant tornado spins up round you and lifts every monster into the sky; then you drive both palms down and it slams them into the ground. Needs gloves.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const lift = (at) => ({ at, pct: k(60, 100), reach: 200, h: 220, around: true, targets, knock: 0, launch: 220, pull: 50, fx: 'skyhit', quiet: true, stop: 0.03, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(440, 740), hits: 6, targets,
        combo: [{ move: 'sdwaltz', dur: 1.44, step: 0, finisher: true, guard: 1.35, strikes: [
          { at: 0.04, pct: 0, reach: 0, h: 0, targets: 0, burst: 'skytornado', burstAt: 0, burstDur: 1.26, floor: true, quiet: true, gauge: 0 },
          lift(0.22), lift(0.32), lift(0.42), lift(0.52), lift(0.6),
          { at: 0.7, pct: k(440, 740), reach: 230, h: 240, around: true, targets, knock: 200, crack: true, fx: 'skyhit', big: true, stop: 0.16, shake: 8, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Tide Mage (sea teal and foam: curling waves, bubbles, spray, ripples) ----------
  // The new Mage (docs/design/tide-mage.md; the old line was wiped 2026-11-08): water from the head
  // of her staff, every blow hit with her magic. Her water that lands builds Tide (world/melee.js),
  // and so do her heals and shields; full (High Tide), every basic attack sends a little wave after
  // it and she and the party near her mend. Some support (Bubble Shield, Tide Pool) and the rest
  // water to fight with; she branches at 30 into a support path or a ranged damage path.
  bubbleshield: skill({
    id: 'bubbleshield', anim: 'tmshield', name: 'Bubble Shield', job: 'tidemage', type: 'buff', fx: null, icon: 'bubbleshield', school: 'tide', party: true, maxLevel: 10,
    pathNames: { maelstrom: 'Abyss Shell', tidecaller: 'Pearl Shell' },
    desc: 'Hug your staff close, then throw your hand wide: a bubble of water closes round you and everyone near you, soaking up the next blows until it pops. Builds Tide. A short wait before the next (30 seconds).',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 520, h: 200, around: true };
      return {
        mp: k(18, 30), pct: 0, hits: 0, targets: 0, range, cooldown: 30, aimGain: 15,
        combo: [{ move: 'tmshield', dur: 0.8, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tmshieldfx', burstAt: 0, burstDur: 0.6, follow: true, grant: { id: 'bubbleshield', duration: 12, buff: { barrier: kf(0.12, 0.3) }, range } }] }],
        // Abyss Shell: she folds round the staff, then throws herself open and a dark shell closes.
        paths: { maelstrom: [{ move: 'msshell', dur: 0.8, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'msshellfx', burstAt: 0, burstDur: 0.6, follow: true, grant: { id: 'bubbleshield', duration: 12, buff: { barrier: kf(0.12, 0.3) }, range } }] }],
          // Pearl Shell: she cups the staff's head as if holding a pearl, lets it rise and the shell opens.
          tidecaller: [{ move: 'tcpearlshell', dur: 0.8, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tcshellfx', burstAt: 0, burstDur: 0.6, follow: true, grant: { id: 'bubbleshield', duration: 12, buff: { barrier: kf(0.12, 0.3) }, range } }] }] },
      };
    },
  }),
  tidepool: skill({
    id: 'tidepool', anim: 'tmpool', name: 'Tide Pool', job: 'tidemage', type: 'buff', fx: null, icon: 'tidepool', school: 'tide', party: true, maxLevel: 10,
    pathNames: { maelstrom: 'Glowing Pool', tidecaller: 'Moon Pool' },
    desc: 'Plant your staff in the floor and a pool of sea water wells up round it: you and everyone near you mend a little every second while it lasts. Builds Tide. A short wait before the next (24 seconds).',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 360, h: 200, around: true };
      return {
        mp: k(20, 34), pct: 0, hits: 0, targets: 0, range, cooldown: 24, aimGain: 15,
        combo: [{ move: 'tmpool', dur: 0.8, step: 0, strikes: [{ at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tmpool', burstAt: 0, burstDur: 8, grant: { id: 'tidepool', duration: 8, buff: { regenPct: kf(0.015, 0.035) }, range } }] }],
        // Glowing Pool: she kneels with her palm on the floor and the glowing water spreads from it.
        paths: { maelstrom: [{ move: 'mspool', dur: 0.8, step: 0, strikes: [{ at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'mspool', burstAt: 0, burstDur: 8, grant: { id: 'tidepool', duration: 8, buff: { regenPct: kf(0.015, 0.035) }, range } }] }],
          // Moon Pool: she draws a slow circle on the floor round her with the staff and the pool spreads.
          tidecaller: [{ move: 'tcmoonpool', dur: 0.8, step: 0, strikes: [{ at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tcpool', burstAt: 0, burstDur: 8, grant: { id: 'tidepool', duration: 8, buff: { regenPct: kf(0.015, 0.035) }, range } }] }] },
      };
    },
  }),
  riptide: skill({
    id: 'riptide', anim: 'tmriptide', name: 'Riptide', job: 'tidemage', type: 'attack', fx: null, icon: 'riptide', school: 'tide', maxLevel: 20,
    pathNames: { maelstrom: 'Black Current', tidecaller: 'Moon Pull' },
    desc: 'Sweep your staff low across the floor and haul: a current drags the monsters round you in together, then you heave the staff over and bring the water crashing down on the lot of them.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 20), pct: k(120, 210), hits: 2, targets: 6,
        combo: [{ move: 'tmriptide', dur: 0.8, step: 4, strikes: [
          { at: 0.3, magic: true, fx: 'tmhit', pct: k(40, 70), reach: 170, h: 100, around: true, targets: 6, knock: 0, pull: 240, burst: 'tmwhirl', burstAt: 0.3, burstDur: 0.6 },
          { at: 0.66, magic: true, fx: 'tmhit', pct: k(120, 210), reach: 110, h: 100, targets: 6, knock: 200, launch: 160, burst: 'tmsplashbig', burstAt: 0.55, burstDur: 0.55, big: true, stop: 0.07, shake: 3 },
        ] }],
        // Black Current: the staff swept round low, the dark current dragging them in, then a stamp.
        paths: { maelstrom: [{ move: 'msriptide', dur: 0.8, step: 4, strikes: [
          { at: 0.3, magic: true, fx: 'mshit', pct: k(40, 70), reach: 170, h: 100, around: true, targets: 6, knock: 0, pull: 240, burst: 'msvortex', burstAt: 0.4, burstDur: 0.6 },
          { at: 0.66, magic: true, fx: 'mshit', pct: k(120, 210), reach: 110, h: 100, targets: 6, knock: 200, launch: 160, burst: 'msslam', burstAt: 0.55, burstDur: 0.55, big: true, stop: 0.07, shake: 3 },
        ] }],
        // Moon Pull: she reels them in with her free hand like a net, then the spring comes up under them.
        tidecaller: [{ move: 'tcpull', dur: 0.8, step: 4, strikes: [
          { at: 0.3, magic: true, fx: 'tchit', pct: k(40, 70), reach: 170, h: 100, around: true, targets: 6, knock: 0, pull: 240, burst: 'tcwhirl', burstAt: 0.3, burstDur: 0.6 },
          { at: 0.66, magic: true, fx: 'tchit', pct: k(120, 210), reach: 110, h: 120, targets: 6, knock: 120, launch: 300, burst: 'tcspring', burstAt: 0.55, burstDur: 0.6, big: true, stop: 0.07, shake: 3 },
        ] }] },
      };
    },
  }),
  tidalwave: skill({
    id: 'tidalwave', anim: 'tmtidal', name: 'Tidal Wave', job: 'tidemage', type: 'attack', fx: null, icon: 'tidalwave', school: 'tide', maxLevel: 20,
    pathNames: { maelstrom: 'Black Wave', tidecaller: 'Silver Wave' },
    desc: 'Crouch low with your staff swept back, then rise in one long heave: a great wave rears up off the floor and rolls away through every monster in front of you.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 26), pct: k(160, 280), hits: 1, targets: 8,
        combo: [{ move: 'tmtidal', dur: 0.9, step: 0, strikes: [{ at: 0.56, magic: true, burst: 'tmhit', shot: 'tmwavebig', pct: k(160, 280), range: 420, h: 110, targets: 8, pierce: true, knock: 260, launch: 160, speed: 560, big: true, stop: 0.07, shake: 3 }] }],
        // Black Wave: she heaves the black water up out of the floor and it rolls on.
        paths: { maelstrom: [{ move: 'msblack', dur: 0.9, step: 0, strikes: [{ at: 0.58, magic: true, burst: 'mshit', shot: 'msblackwave', pct: k(160, 280), range: 420, h: 110, targets: 8, pierce: true, knock: 260, launch: 160, speed: 560, big: true, stop: 0.07, shake: 3 }] }],
          // Silver Wave: she sways back, then rises and sweeps the silver wave up off the floor.
          tidecaller: [{ move: 'tcsilverwave', dur: 0.9, step: 0, strikes: [{ at: 0.56, magic: true, burst: 'tchit', shot: 'tcsilverwave', pct: k(160, 280), range: 420, h: 110, targets: 8, pierce: true, knock: 260, launch: 160, speed: 560, big: true, stop: 0.07, shake: 3 }] }] },
      };
    },
  }),
  flow: skill({
    id: 'flow', anim: 'tmflow', name: 'Flow', job: 'tidemage', type: 'buff', fx: null, icon: 'flow', school: 'tide', maxLevel: 10,
    pathNames: { maelstrom: 'Deep Flow', tidecaller: 'Lunar Flow' },
    desc: 'Twirl your staff and let the water run with you: for a while you cast faster and your magic hits harder.',
    weapons: ['staff'],
    at: (lv, m) => {
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: lerp(16, 26, lv, m), pct: 0, hits: 0, targets: 0, cooldown: 60,
        combo: [{ move: 'tmflow', dur: 0.7, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tmsplash', burstAt: 0, burstDur: 0.45, grant: { id: 'flow', duration: 60, buff: { attackSpeed: kf(0.06, 0.15), matk: lerp(4, 16, lv, m) }, range: { w: 0, h: 0 } } }] }],
        // Deep Flow: a slow breath with her eyes closed, motes rising, then a sharp turn of the staff.
        paths: { maelstrom: [{ move: 'msflow', dur: 0.8, step: 0, strikes: [{ at: 0.64, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'msglowpop', burstAt: 0, burstDur: 0.5, grant: { id: 'flow', duration: 60, buff: { attackSpeed: kf(0.06, 0.15), matk: lerp(4, 16, lv, m) }, range: { w: 0, h: 0 } } }] }],
          // Lunar Flow: the staff turned slowly over her palm, eyes closed, then a bright twirl.
          tidecaller: [{ move: 'tcflow', dur: 0.8, step: 0, strikes: [{ at: 0.62, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tcglint', burstAt: 0, burstDur: 0.5, grant: { id: 'flow', duration: 60, buff: { attackSpeed: kf(0.06, 0.15), matk: lerp(4, 16, lv, m) }, range: { w: 0, h: 0 } } }] }] },
      };
    },
  }),
  waverider: skill({
    id: 'waverider', anim: 'tmsurf', name: 'Wave Rider', job: 'tidemage', type: 'attack', fx: null, icon: 'waverider', school: 'tide', maxLevel: 10, movement: true,
    pathNames: { maelstrom: 'Deep Dive', tidecaller: 'Foam Glide' },
    desc: 'Ride a wave forward in a surfer\'s crouch, knocking aside whatever is in the way, and spring off the top of it with a splash. Nothing touches you on the wave.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(80, 140), hits: 1, targets: 4,
        combo: [{ move: 'tmsurf', dur: 0.62, step: k(130, 180), carry: 0.6, guard: 0.5, strikes: [{ at: 0.56, magic: true, fx: 'tmhit', pct: k(80, 140), reach: 92, h: 84, targets: 4, knock: 230, launch: 140, burst: 'tmsplashbig', burstAt: 0.45, burstDur: 0.55, big: true, stop: 0.05, shake: 2 }] }],
        // Deep Dive: she dives forward through a wall of black water and comes up out of it.
        paths: { maelstrom: [{ move: 'msdash', dur: 0.62, step: k(130, 180), carry: 0.6, guard: 0.5, strikes: [{ at: 0.56, magic: true, fx: 'mshit', pct: k(80, 140), reach: 92, h: 84, targets: 4, knock: 230, launch: 140, burst: 'msslam', burstAt: 0.45, burstDur: 0.55, big: true, stop: 0.05, shake: 2 }] }],
          // Foam Glide: she glides in on a ribbon of foam and swings through as she lands.
          tidecaller: [{ move: 'tcglide', dur: 0.62, step: k(130, 180), carry: 0.6, guard: 0.5, strikes: [{ at: 0.56, magic: true, fx: 'tchit', pct: k(80, 140), reach: 92, h: 84, targets: 4, knock: 230, launch: 140, burst: 'tcsplashbig', burstAt: 0.45, burstDur: 0.55, big: true, stop: 0.05, shake: 2 }] }] },
      };
    },
  }),
  oceanheart: skill({
    id: 'oceanheart', name: 'Ocean Heart', job: 'tidemage', type: 'passive', grows: true, fx: null, icon: 'oceanheart',
    desc: 'The sea runs deep in you: your magic hits truer and steadier, and your MP comes back faster.',
    at: (lv, m) => ({ passive: { acc: lerp(3, 25, lv, m), mastery: lerpf(0.1, 0.35, lv, m), mpRegen: lerp(1, 6, lv, m) } }),
  }),
  greatwave: skill({
    id: 'greatwave', anim: 'tmgreat', dmg: 2, name: 'Great Wave', job: 'tidemage', type: 'attack', fx: null, icon: 'greatwave', school: 'tide', maxLevel: 10, fullGauge: true,
    pathNames: { maelstrom: 'Black Tide', tidecaller: 'Silver Tide' },
    desc: 'Finisher: needs a full Tide, and spends it. Rise off the floor on the swell with your staff held high as the sea climbs up behind you, hold it while it towers, then bring it all down: a giant wave sweeps the screen, crashing through every monster in front of you, and mends you and the party as it passes.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 50), pct: k(160, 260), hits: 1, targets: 0,
        combo: [{ move: 'tmgreat', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.62, magic: true, burst: 'tmhit', shot: 'tmgreat', pct: k(160, 260), range: 560, h: 180, targets: 12, pierce: true, knock: 300, launch: 220, speed: 520, big: true, stop: 0.1, shake: 5, heal: 0.18, healR: 400 },
        ] }],
        // Black Tide: the dark sea towers behind her on a black swell and breaks.
        paths: { maelstrom: [{ move: 'msblacktide', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.62, magic: true, burst: 'mshit', shot: 'msblacktide', pct: k(160, 260), range: 560, h: 180, targets: 12, pierce: true, knock: 300, launch: 220, speed: 520, big: true, stop: 0.1, shake: 5, heal: 0.18, healR: 400 },
        ] }],
        // Silver Tide: she rises on the silver swell with the moon behind her and sweeps it down.
        tidecaller: [{ move: 'tcsilver', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.64, magic: true, burst: 'tchit', shot: 'tcsilvertide', pct: k(160, 260), range: 560, h: 180, targets: 12, pierce: true, knock: 300, launch: 220, speed: 520, big: true, stop: 0.1, shake: 5, heal: 0.18, healR: 400 },
        ] }] },
      };
    },
  }),

  // ---------- Maelstrom (the Tide Mage's damage path: the deep sea, midnight and glowing aqua) ----------
  // docs/design/maelstrom.md. Her hits build Depth (world/melee.js): the deeper it runs the harder she
  // hits; full (the Abyss), every hit opens a vortex on what it struck. She plays the Tide Mage's
  // skills her own way (their `paths`), and these are hers.
  tidallance: skill({
    id: 'tidallance', anim: 'mslance', name: 'Tidal Lance', job: 'maelstrom', type: 'attack', fx: null, icon: 'tidallance', school: 'deep', maxLevel: 20,
    desc: 'Coil low as the pressure builds at your staff, then uncoil in one lunging thrust: a great lance of water tears out through every monster in the line.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 26), pct: k(200, 340), hits: 1, targets: 8,
        combo: [{ move: 'mslance', dur: 0.85, step: 6, strikes: [{ at: 0.56, magic: true, burst: 'mshit', shot: 'msspearbig', pct: k(200, 340), range: 460, h: 64, targets: 8, pierce: true, knock: 240, speed: 1100, big: true, stop: 0.08, shake: 3 }] }],
      };
    },
  }),
  undertow: skill({
    id: 'undertow', anim: 'msundertow', name: 'Undertow', job: 'maelstrom', type: 'attack', fx: null, icon: 'undertow', school: 'deep', maxLevel: 20,
    desc: 'Point your staff out ahead and turn your hand: a vortex opens there, drags in every monster near it and shreds them again and again while it turns.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const tick = (at) => ({ at, magic: true, fx: 'mshit', pct: k(36, 60), reach: 230, h: 130, targets: 6, knock: 0, pull: 140, gauge: 1 });
      return {
        mp: k(16, 28), pct: k(36, 60), hits: 5, targets: 6, cooldown: 6,
        combo: [{ move: 'msundertow', dur: 1.2, step: 0, strikes: [
          { ...tick(0.3), burst: 'msvortex', burstAt: 0.62, burstDur: 0.9 }, tick(0.45), tick(0.6), tick(0.75),
          { ...tick(0.9), knock: 180, launch: 200, big: true, stop: 0.06, shake: 2 },
        ] }],
      };
    },
  }),
  hydrocannon: skill({
    id: 'hydrocannon', anim: 'mscannon', name: 'Hydro Cannon', job: 'maelstrom', type: 'attack', fx: null, icon: 'hydrocannon', school: 'deep', maxLevel: 20,
    desc: 'Drop into a braced stance with your staff levelled like a cannon and let it go: a beam of crushing water tears through everything ahead, driving you back along the floor as you hold it.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const beam = (at, f = {}) => ({ at, magic: true, fx: 'mshit', pct: k(55, 90), reach: 340, h: 60, targets: 8, knock: 40, ...f });
      return {
        mp: k(20, 34), pct: k(55, 90), hits: 4, targets: 8, cooldown: 8,
        combo: [{ move: 'mscannon', dur: 1.1, step: 0, strikes: [
          beam(0.42, { burst: 'msbeambig', burstAt: 0.05, burstDur: 0.45 }), beam(0.54), beam(0.66),
          beam(0.78, { knock: 260, big: true, stop: 0.08, shake: 3 }),
        ] }],
      };
    },
  }),
  depthcharge: skill({
    id: 'depthcharge', anim: 'mscharge', name: 'Depth Charge', job: 'maelstrom', type: 'attack', fx: null, icon: 'depthcharge', school: 'deep', maxLevel: 20,
    desc: 'Flick three glowing charges off your staff; they drift out to the monsters ahead and, at a snap of your fingers, go off together.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const charge = (at, oy) => ({ at, magic: true, burst: 'msglowpop', shot: 'msglow', pct: k(70, 120), range: 280, h: 90, targets: 3, knock: 120, speed: 330, oy, big: true, stop: 0.04 });
      return {
        mp: k(12, 22), pct: k(70, 120), hits: 3, targets: 3,
        combo: [{ move: 'mscharge', dur: 0.9, step: 0, strikes: [charge(0.3, -8), charge(0.42, 0), charge(0.54, 8)] }],
      };
    },
  }),
  deepmastery: skill({
    id: 'deepmastery', name: 'Deep Sea Mastery', job: 'maelstrom', type: 'passive', grows: true, fx: null, icon: 'deepmastery',
    desc: 'The weight of the whole sea behind every spell: your magic hits steadier, and lands critical hits more often.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.4, lv, m), critRate: lerpf(0.03, 0.12, lv, m), acc: lerp(4, 30, lv, m) } }),
  }),
  abyssmaelstrom: skill({
    id: 'abyssmaelstrom', anim: 'msfinale', dmg: 2, name: 'Maelstrom', job: 'maelstrom', type: 'attack', fx: null, icon: 'abyssmaelstrom', school: 'deep', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a full Depth, and spends it. Rise off the floor as the sea turns under you into a giant whirlpool that drags in everything on the screen and tears it apart, then drive your staff down and it bursts.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const rip = (at) => ({ at, magic: true, fx: 'mshit', pct: k(40, 66), reach: 420, h: 220, around: true, targets: 12, knock: 0, pull: 200, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(40, 66), hits: 6, targets: 12,
        combo: [{ move: 'msfinale', dur: 2, step: 0, finisher: true, guard: 1.8, strikes: [
          { ...rip(0.3), burst: 'msmaelstrom', burstAt: 0.35, burstDur: 1.2 }, rip(0.42), rip(0.54), rip(0.66), rip(0.78),
          { ...rip(0.88), pct: k(160, 260), knock: 320, launch: 300, big: true, stop: 0.12, shake: 6 },
        ] }],
      };
    },
  }),

  // ---------- Tidecaller (the Tide Mage's healer path: the moon's tide, seafoam, pearl and gold) ----------
  // docs/design/tidecaller.md. The party's healer. Her hits and heals build Moonsong (world/melee.js):
  // the fuller it runs the stronger she heals; full (Spring Tide), her heals leave a bubble on
  // everyone they reach and her basic attacks drop healing on whoever is hurt most. She plays the
  // Tide Mage's skills her own way (their `paths`), and these are hers.
  healingrain: skill({
    id: 'healingrain', anim: 'tcrain', name: 'Healing Rain', job: 'tidecaller', type: 'buff', fx: null, icon: 'healingrain', school: 'moon', party: true, maxLevel: 10,
    desc: 'Lift your staff high and turn its head slowly over you: a soft cloud gathers over you and the party and a gentle rain falls, mending everyone under it every second while it lasts. Builds Moonsong. A short wait before the next (20 seconds).',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 560, h: 220, around: true };
      return {
        mp: k(20, 34), pct: 0, hits: 0, targets: 0, range, cooldown: 20, aimGain: 15,
        combo: [{ move: 'tcrain', dur: 0.9, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tcrain', burstAt: 0, burstDur: 6, follow: true, grant: { id: 'healingrain', duration: 6, buff: { regenPct: kf(0.04, 0.07) }, range } }] }],
      };
    },
  }),
  springsurge: skill({
    id: 'springsurge', anim: 'tcsurge', name: 'Spring Surge', job: 'tidecaller', type: 'heal', fx: null, icon: 'springsurge', school: 'moon', party: true, maxLevel: 20,
    desc: 'Draw both hands in to your heart, then throw your arms wide as you rise onto your toes: a spring bursts up all round you, mending you and everyone near you in one great wave and throwing back the monsters close by. A short wait before the next (6 seconds).',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(16, 28), pct: k(60, 110), hits: 1, targets: 6, cooldown: 6, range: { w: 600, h: 220, around: true },
        combo: [{ move: 'tcsurge', dur: 0.85, step: 0, strikes: [{ at: 0.5, magic: true, fx: 'tchit', pct: k(60, 110), reach: 150, h: 120, around: true, targets: 6, knock: 140, launch: 120, burst: 'tcsurge', burstAt: 0, burstDur: 0.85, heal: kf(0.18, 0.32), healR: 300, big: true, stop: 0.05, shake: 1 }] }],
      };
    },
  }),
  moonblessing: skill({
    id: 'moonblessing', anim: 'tcbless', name: 'Moon Blessing', job: 'tidecaller', type: 'buff', fx: null, icon: 'moonblessing', school: 'moon', party: true, maxLevel: 10,
    desc: 'Stand your staff before you and bow your head over your heart, then lift your face and open your hand: moonlight falls on you and the party, and for a long while everyone defends better, takes less from every hit and gets MP back faster.',
    weapons: ['staff'],
    at: (lv, m) => {
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 600, h: 220, around: true };
      return {
        mp: lerp(24, 40, lv, m), pct: 0, hits: 0, targets: 0, range, cooldown: 120, aimGain: 10,
        combo: [{ move: 'tcbless', dur: 0.9, step: 0, strikes: [{ at: 0.6, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'tcbless', burstAt: 0, burstDur: 1, follow: true, grant: { id: 'moonblessing', duration: 120, buff: { wdef: lerp(10, 50, lv, m), dmgCut: kf(0.04, 0.1), mpRegen: lerp(2, 8, lv, m) }, range } }] }],
      };
    },
  }),
  tidesreturn: skill({
    id: 'tidesreturn', anim: 'tcreturn', name: "Tide's Return", job: 'tidecaller', type: 'revive', fx: null, icon: 'tidesreturn', school: 'moon', party: true, maxLevel: 10,
    desc: 'Kneel and reach your hand out over a fallen friend near you, then rise slowly, lifting it, and the tide brings them back up on their feet with some of their HP, mending everyone near you a little. Only when someone near you has fallen (in a dungeon). A wait before the next (30 seconds).',
    weapons: ['staff'],
    at: (lv, m) => {
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: lerp(40, 24, lv, m), pct: 0, hits: 0, targets: 0, range: { w: 640, h: 220, around: true }, healPct: kf(0.3, 0.7), cooldown: 30,
        combo: [{ move: 'tcreturn', dur: 1.1, step: 0, strikes: [{ at: 0.6, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, revive: kf(0.3, 0.7), reviveR: 320, heal: kf(0.05, 0.12), healR: 320 }] }],
      };
    },
  }),
  moonfall: skill({
    id: 'moonfall', anim: 'tcmoonfall', name: 'Moonfall', job: 'tidecaller', type: 'attack', fx: null, icon: 'moonfall', school: 'moon', maxLevel: 20,
    desc: 'Draw a crescent in the air over the monsters ahead with your hand, then pull it down: a great crescent of water and moonlight falls on them and bursts, and its light mends you and the party near you.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(14, 26), pct: k(150, 260), hits: 1, targets: 6,
        combo: [{ move: 'tcmoonfall', dur: 0.95, step: 0, strikes: [{ at: 0.56, magic: true, fx: 'tchit', pct: k(150, 260), reach: 240, h: 150, targets: 6, knock: 160, launch: 140, burst: 'tcmoonfall', burstAt: 0.62, burstDur: 0.8, big: true, stop: 0.07, shake: 3, heal: kf(0.05, 0.1), healR: 300 }] }],
      };
    },
  }),
  tidesong: skill({
    id: 'tidesong', name: 'Tidesong', job: 'tidecaller', type: 'passive', grows: true, fx: null, icon: 'tidesong',
    desc: 'The moon hears you: your heals mend more, your MP comes back faster, and your magic hits steadier.',
    at: (lv, m) => ({ passive: { healBoost: lerpf(0.05, 0.25, lv, m), mpRegen: lerp(2, 8, lv, m), mastery: lerpf(0.1, 0.3, lv, m) } }),
  }),
  moontide: skill({
    id: 'moontide', anim: 'tcmoontide', dmg: 2, name: 'Moon Tide', job: 'tidecaller', type: 'attack', fx: null, icon: 'moontide', school: 'moon', maxLevel: 10, fullGauge: true, party: true,
    desc: 'Finisher: needs a full Moonsong, and spends it. Rise off the floor with your staff held high as the moon climbs behind you and the tide rises across the whole floor, turn slowly with your arms open, then sweep the staff down: the tide floods the screen, crashing through every monster round you, mending you and the party and bringing the fallen back up.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const swell = (at) => ({ at, magic: true, fx: 'tchit', pct: k(40, 66), reach: 440, h: 200, around: true, targets: 12, knock: 30, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(160, 260), hits: 3, targets: 12,
        combo: [{ move: 'tcmoontide', dur: 2, step: 0, finisher: true, guard: 1.8, strikes: [
          { ...swell(0.4), burst: 'tcmoontide', burstAt: 0, burstDur: 1.7 }, swell(0.6),
          { ...swell(0.86), pct: k(160, 260), knock: 320, launch: 220, big: true, stop: 0.12, shake: 5, heal: kf(0.4, 0.6), healR: 500, revive: kf(0.4, 0.6), reviveR: 500 },
        ] }],
      };
    },
  }),

  // ---------- Game Master (hidden) ----------
  gmsmite: skill({
    id: 'gmsmite', name: 'GM Smite', job: 'gamemaster', type: 'magic', fx: 'judgment', maxLevel: 1,
    desc: 'Strike every monster on screen with overwhelming light.',
    at: () => ({ mp: 0, power: 99999, hits: 1, targets: 40, range: { w: 700, h: 400, around: true }, delay: 0.3 }),
  }),
  gmhaste: skill({
    id: 'gmhaste', name: 'GM Haste', job: 'gamemaster', type: 'buff', fx: 'buff', maxLevel: 1,
    desc: 'Move and jump like the wind.',
    at: () => ({ mp: 0, duration: 3600, buff: { speed: 60, jump: 30 } }),
  }),
  gmblessing: skill({
    id: 'gmblessing', name: 'GM Blessing', job: 'gamemaster', type: 'passive', fx: null, maxLevel: 1,
    desc: 'Bonus to everything.',
    at: () => ({ passive: { matk: 500, watk: 500, maxHpPct: 1, critRate: 0.5 } }),
  }),

};

// The move each skill plays (see render/moves.js), chosen to fit the skill and its job.
const MOVES_BY_SKILL = {
  pebble: 'pebbleflick', quickstep: 'qstep',
  vault: 'achandspring', cometarrow: 'acsomersault', springtrap: 'acspring', packhowl: 'ptbomb',
  stampede: 'ptillusion', snacktime: 'ptshow', deployturret: 'aedeploy', windupbomb: 'aewindup', overclock: 'aeoverclock', bigbertha: 'aebertha',
  lightningcage: 'bwcagecast', stormbarrier: 'bwbarrier', magnetize: 'bwmagnet', overcast: 'bwovercast', fortress: 'bwfortress',
  flashstep: 'tpstep', thousandcuts: 'tpthousand', crimsonarc: 'tparc', afterimage: 'tpafter', redthunder: 'tpredthunder',
  thunderrush: 'tgrush', stormcleave: 'tgcleave', cycloneedge: 'tgcyclone', lightningrod: 'tgrod', thunderclap: 'tgthunderclap', staticguard: 'tgguard', thunderfall: 'tgfall',
  pirouette: 'wdchaine', grandfinale: 'wdencore',
  goldencarousel: 'bdcarousel', hoopla: 'bdhoopla', jugglingact: 'bdjuggle', showstopper: 'bdbow',
  skywaltz: 'sdwaltz', downburst: 'sddive', galestep: 'sdgale', cloudnine: 'sdcloud',
  gmsmite: 'castup', gmhaste: 'cheer',
};
for (const [id, move] of Object.entries(MOVES_BY_SKILL)) SKILLS[id].anim = move;

// Numbers for `skillId` at `level`, with the skill's max level passed through for scaling.
export function skillAt(skillId, level) {
  const s = SKILLS[skillId];
  return { ...s.at(level, s.maxLevel), lock: s.lock };
}

