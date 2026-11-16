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

  // ---------- Moon Moth (lilac and moon silver: spirit moths, sparkles, little gold crescents) ----------
  // The new Thief (docs/design/moon-moth.md; the old line was wiped 2026-11-16): a dagger in each
  // hand and a cloud of moths. Her cuts that land build Moondust (world/melee.js); the fuller it
  // runs the more she crits, and full (Full Moon) every basic attack sends a moth off to nip another
  // monster. The first pass: four skills and her mastery; four more and her paths come later.
  mothstep: skill({
    id: 'mothstep', anim: 'mmstep', name: 'Moth Step', job: 'moonmoth', type: 'attack', fx: null, icon: 'mothstep', school: 'moth', maxLevel: 10, movement: true,
    pathNames: { eclipse: 'Umbra Step' },
    desc: 'Break into a cloud of moths and re-form past them, turned round to cut whatever you passed through: a backstab on anything facing away. Nothing touches you while you\'re moths.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(8, 5), pct: k(90, 150), hits: 1, targets: 4,
        combo: [{ move: 'mmstep', dur: 0.38, step: k(140, 200), carry: 0.7, guard: 0.5, moths: [0.12, 0.5], strikes: [
          { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'mmcloud', burstAt: 0, burstDur: 0.5 },
          // (Still moths, she turns round; she re-forms facing what she passed through and cuts it.)
          { at: 0.46, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, turn: true },
          { at: 0.62, school: 'moth', fx: 'mmhit', pct: k(90, 150), reach: k(160, 220), h: 60, targets: 4, knock: 120, turn: true, backstab: 1.5, burst: 'mmcloud', burstAt: 0, burstDur: 0.5, big: true, stop: 0.05 },
        ] }],
        // Umbra Step: she sinks into dark moths, flies on as them, and comes out of
        // them crouched low, both daggers cutting back.
        paths: { eclipse: [{ move: 'ecumbrastep', dur: 0.38, step: k(140, 200), carry: 0.7, guard: 0.5, moths: [0.12, 0.5], flight: 'ecflight', strikes: [
          { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'eccloud', burstAt: 0, burstDur: 0.5 },
          { at: 0.46, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, turn: true },
          { at: 0.62, school: 'eclipse', fx: 'echit', pct: k(90, 150), reach: k(160, 220), h: 60, targets: 4, knock: 120, turn: true, backstab: 1.5, burst: 'eccloud', burstAt: 0, burstDur: 0.5, big: true, stop: 0.05 },
        ] }] },
      };
    },
  }),
  wingflurry: skill({
    id: 'wingflurry', anim: 'mmflurry', name: 'Wing Flurry', job: 'moonmoth', type: 'attack', fx: null, icon: 'wingflurry', school: 'moth', maxLevel: 20,
    pathNames: { eclipse: 'Black Flurry' },
    desc: 'Cut six times in a blur, both daggers flashing, wing dust whirling off every cut; the last cut throws them back.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const per = k(34, 58);
      // (The Eclipse's Black Flurry: the same six cuts in her own move, dark crescents edged in gold.)
      const flurry = (move, school, fx, burst) => {
        const cut = (at, i) => ({ at, school, fx, pct: per, reach: 72, h: 58, targets: 3, knock: 8, arc: i % 2 ? [100, -200] : [-110, 200], thick: 6 });
        return [{ move, dur: 0.6, step: 10, strikes: [
          { ...cut(0.13, 0), burst, burstAt: 0.45, burstDur: 0.6 },
          ...[0.24, 0.34, 0.44, 0.55].map((at, i) => cut(at, i + 1)),
          { at: 0.76, school, fx, pct: Math.round(per * 1.8), reach: 76, h: 62, targets: 3, knock: 200, arc: [-150, 300], thick: 9, big: true, stop: 0.06, shake: 2 },
        ] }];
      };
      return {
        mp: k(8, 16), pct: per, hits: 6, targets: 3,
        combo: flurry('mmflurry', 'moth', 'mmhit', 'mmflurry'),
        paths: { eclipse: flurry('ecflurry', 'eclipse', 'echit', 'ecflurry') },
      };
    },
  }),
  mothswarm: skill({
    id: 'mothswarm', anim: 'mmswarm', name: 'Moth Swarm', job: 'moonmoth', type: 'attack', fx: null, icon: 'mothswarm', school: 'moth', maxLevel: 20,
    pathNames: { eclipse: 'Shadow Swarm' },
    desc: 'Draw both daggers in to your chest, then fling your hands forward: a swarm of moths pours out ahead, nibbling through every monster in a line.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(12, 22), pct: k(150, 250), hits: 1, targets: 6,
        combo: [{ move: 'mmswarm', dur: 0.5, step: -4, strikes: [{ at: 0.48, school: 'moth', burst: 'mmhit', shot: 'mmswarm', pct: k(150, 250), range: 360, h: 80, targets: 6, pierce: true, knock: 120, speed: 400, big: true, stop: 0.04 }] }],
        // Shadow Swarm: she cups her hands at her chest and opens them like a book; the dark moths
        // pour out, their gold crescents lit.
        paths: { eclipse: [{ move: 'ecswarmcast', dur: 0.5, step: -4, strikes: [{ at: 0.48, school: 'eclipse', burst: 'echit', shot: 'ecswarm', pct: k(150, 250), range: 360, h: 80, targets: 6, pierce: true, knock: 120, speed: 400, big: true, stop: 0.04 }] }] },
      };
    },
  }),
  nighteyes: skill({
    id: 'nighteyes', name: 'Night Eyes', job: 'moonmoth', type: 'passive', grows: true, fx: null, icon: 'nighteyes',
    desc: 'You see best by moonlight: your cuts land truer, and they crit more often and harder.',
    at: (lv, m) => ({ passive: { acc: lerp(3, 25, lv, m), mastery: lerpf(0.1, 0.35, lv, m), critRate: lerpf(0.03, 0.1, lv, m), critDamage: lerpf(0.05, 0.2, lv, m) } }),
  }),
  midnightswarm: skill({
    id: 'midnightswarm', anim: 'mmmidnight', dmg: 2, name: 'Midnight Swarm', job: 'moonmoth', type: 'attack', fx: null, icon: 'midnightswarm', school: 'moth', maxLevel: 10, fullGauge: true,
    pathNames: { eclipse: 'New Moon' },
    desc: 'Finisher: needs a full Moondust, and spends it. Spring up as a full moon rises behind you, hang there with your daggers crossed while the moths gather, then throw your arms wide: the swarm pours down across the screen through every monster in front of you.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(26, 44), pct: k(170, 270), hits: 1, targets: 0,
        combo: [{ move: 'mmmidnight', dur: 1.35, step: 0, finisher: true, guard: 1.2, strikes: [
          { at: 0.2, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'mmmoon', burstAt: 0, burstDur: 1.4 },
          { at: 0.62, school: 'moth', fx: 'mmhit', pct: k(170, 270), reach: 520, h: 220, targets: 12, knock: 260, launch: 160, burst: 'mmpour', burstAt: 0.02, burstDur: 0.9, big: true, stop: 0.1, shake: 4 },
        ] }],
        // New Moon (the Eclipse's): she sinks to one knee and rises slowly as a dark moon in its
        // corona climbs behind her, then sweeps both arms down and the dark swarm pours.
        paths: { eclipse: [{ move: 'ecnewmoon', dur: 1.35, step: 0, finisher: true, guard: 1.2, strikes: [
          { at: 0.2, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'ecnewmoon', burstAt: 0, burstDur: 1.4 },
          { at: 0.62, school: 'eclipse', fx: 'echit', pct: k(170, 270), reach: 520, h: 220, targets: 12, knock: 260, launch: 160, burst: 'ecpour', burstAt: 0.02, burstDur: 0.9, big: true, stop: 0.1, shake: 4 },
        ] }] },
      };
    },
  }),

  // ---------- Eclipse (the Moon Moth's damage path: eclipse violet and corona gold) ----------
  // docs/design/eclipse.md. The boss-killer. Her hits build Umbra (world/melee.js): the fuller it runs
  // the harder her crits land; full (Totality), every blow crits and Total Eclipse is ready. Some
  // blows leave marks (little eclipses) on monsters (`mark`), Umbral Edge spends them (`consume`) and
  // Total Eclipse sets them all off (`detonateAll`). She plays the Moon Moth's skills her own way
  // (their `paths`), and these are hers.
  shadowstep: skill({
    id: 'shadowstep', anim: 'ecstep', name: 'Shadow Step', job: 'eclipse', type: 'attack', fx: null, icon: 'shadowstep', school: 'eclipse', maxLevel: 10, movement: true,
    desc: 'Step into a disc of shadow and out of one behind the nearest monster ahead, already stabbing its back. Nothing touches you in between.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(140, 240), hits: 1, targets: 1,
        combo: [{ move: 'ecstep', dur: 0.36, step: 0, guard: 0.5, hide: [0.14, 0.42], strikes: [
          { at: 0.08, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'ecportal', burstAt: 0, burstDur: 0.45 },
          { at: 0.44, school: 'eclipse', fx: 'echit', pct: k(140, 240), reach: 64, h: 60, targets: 1, knock: 140, behind: k(170, 230), backstab: 1.5, burst: 'ecportal', burstAt: 0, burstDur: 0.45, big: true, stop: 0.07, shake: 2 },
        ] }],
      };
    },
  }),
  nighteye: skill({
    id: 'nighteye', anim: 'eceyecast', name: 'Eye of the Night', job: 'eclipse', type: 'attack', fx: null, icon: 'nighteye', school: 'eclipse', maxLevel: 20,
    desc: 'Flick your fingers open and three little eclipses fly at the nearest monsters: a little damage, and a mark on each that stays a while.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(8, 14), pct: k(60, 100), hits: 1, targets: 3,
        combo: [{ move: 'eceyecast', dur: 0.4, step: 0, strikes: [{ at: 0.42, school: 'eclipse', burst: 'echit', shot: 'eceye', fan: 3, pct: k(60, 100), range: 340, h: 100, knock: 30, speed: 560, mark: 1, stop: 0.03 }] }],
      };
    },
  }),
  umbraledge: skill({
    id: 'umbraledge', anim: 'ecedge', dmg: 1.2, name: 'Umbral Edge', job: 'eclipse', type: 'attack', fx: null, icon: 'umbraledge', school: 'eclipse', maxLevel: 20,
    desc: 'Two slow, deep stabs into one monster. Every mark on it makes the second far harder (and spends the marks).',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 24), pct: k(200, 330), hits: 2, targets: 1, cooldown: 4,
        combo: [{ move: 'ecedge', dur: 0.6, step: 6, strikes: [
          { at: 0.32, school: 'eclipse', fx: 'echit', pct: k(80, 130), reach: 66, h: 56, targets: 1, knock: 10, pierce: true },
          { at: 0.7, school: 'eclipse', fx: 'echit', pct: k(200, 330), reach: 70, h: 60, targets: 1, knock: 220, pierce: true, consume: 0.6, burst: 'ecedge', burstAt: 0.6, burstDur: 0.6, big: true, stop: 0.12, shake: 3 },
        ] }],
      };
    },
  }),
  corona: skill({
    id: 'corona', anim: 'eccorona', name: 'Corona', job: 'eclipse', type: 'attack', fx: null, icon: 'corona', school: 'eclipse', maxLevel: 20,
    desc: 'Spin once with both daggers out and a ring of gold fire flares all round you, burning and marking everything in it.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 26), pct: k(130, 220), hits: 1, targets: 8,
        combo: [{ move: 'eccorona', dur: 0.5, step: 0, strikes: [{ at: 0.5, school: 'eclipse', fx: 'echit', pct: k(130, 220), reach: 150, h: 110, around: true, targets: 8, knock: 160, launch: 120, mark: 1, burst: 'ecringbig', burstAt: 0, burstDur: 0.65, big: true, stop: 0.07, shake: 3 }] }],
      };
    },
  }),
  umbralmastery: skill({
    id: 'umbralmastery', name: 'Umbral Mastery', job: 'eclipse', type: 'passive', grows: true, fx: null, icon: 'umbralmastery',
    desc: 'The dark is where you work best: truer, steadier cuts, and your crits land much harder.',
    at: (lv, m) => ({ passive: { acc: lerp(4, 30, lv, m), mastery: lerpf(0.15, 0.4, lv, m), critDamage: lerpf(0.1, 0.35, lv, m), critRate: lerpf(0.02, 0.06, lv, m) } }),
  }),
  totaleclipse: skill({
    id: 'totaleclipse', anim: 'ectotal', dmg: 1.6, name: 'Total Eclipse', job: 'eclipse', type: 'attack', fx: null, icon: 'totaleclipse', school: 'eclipse', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a full Umbra, and spends it. The moon slides over the sun and the screen goes dark but for the corona; you vanish and strike from monster to monster, marking each, then the diamond ring flashes on the rim and every mark on the screen goes off at once.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const flick = (at) => ({ at, school: 'eclipse', fx: 'echit', pct: k(60, 100), reach: 300, h: 160, around: true, targets: 8, knock: 30, mark: 1, gauge: 0, stop: 0.03 });
      return {
        mp: k(30, 50), pct: k(240, 400), hits: 4, targets: 12,
        combo: [{ move: 'ectotal', dur: 1.5, step: 0, finisher: true, guard: 1.4, hide: [0.26, 0.66], strikes: [
          { at: 0.12, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'ectotal', burstAt: 0, burstDur: 1.6 },
          flick(0.32), flick(0.44), flick(0.56),
          { at: 0.76, school: 'eclipse', fx: 'echit', pct: k(240, 400), reach: 400, h: 200, around: true, targets: 12, knock: 300, launch: 300, detonateAll: k(60, 100), burst: 'ecdiamond', burstAt: 0, burstDur: 0.7, big: true, stop: 0.14, shake: 6, gauge: 0 },
        ] }],
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
  lightningcage: 'bwcagecast', stormbarrier: 'bwbarrier', magnetize: 'bwmagnet', overcast: 'bwovercast', fortress: 'bwfortress',
  flashstep: 'tpstep', thousandcuts: 'tpthousand', crimsonarc: 'tparc', afterimage: 'tpafter', redthunder: 'tpredthunder',
  thunderrush: 'tgrush', stormcleave: 'tgcleave', cycloneedge: 'tgcyclone', lightningrod: 'tgrod', thunderclap: 'tgthunderclap', staticguard: 'tgguard', thunderfall: 'tgfall',
  gmsmite: 'castup', gmhaste: 'cheer',
};
for (const [id, move] of Object.entries(MOVES_BY_SKILL)) SKILLS[id].anim = move;

// Numbers for `skillId` at `level`, with the skill's max level passed through for scaling.
export function skillAt(skillId, level) {
  const s = SKILLS[skillId];
  return { ...s.at(level, s.maxLevel), lock: s.lock };
}

