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

  // ---------- Warrior (steel blue and white: the blue cross, swords, a shield) ----------
  // Every blow a Warrior lands builds Valor (0-100, see world/melee.js), faster the more monsters
  // one blow catches; full (Unbroken), his blows land heavier and nothing knocks him back. Titan
  // Breaker needs it full and spends it. He is the dungeon tank: War Cry taunts, Iron Guard braces.
  //
  // A Warrior fights with his basic attacks; his skills are procs (`proc`, see world/melee.js and
  // world/combat.js) that set off on their own from what he does: Blade Rush and Whirlwind from
  // his blows, War Cry when his gauge fills, Iron Guard when a hard hit lands. His only buttons
  // besides attack are Shoulder Charge (getting about) and Titan Breaker (the big one, on a full
  // gauge). Proc skills are passives with an empty `passive` (they add no stats of their own).
  bladerush: skill({
    id: 'bladerush', name: 'Blade Rush', job: 'warrior', type: 'passive', fx: null, school: 'steel',
    desc: 'Your swings sometimes rush on into an extra cross-cut of steel that slashes everything in front of you twice, whether they hit or not.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.08, 0.25, lv, m), pct: lerp(60, 110, lv, m), targets: lerp(2, 4, lv, m) } }),
  }),
  whirlwind: skill({
    id: 'whirlwind', name: 'Whirlwind', job: 'warrior', type: 'passive', fx: null, school: 'steel',
    desc: 'The last swing of your combo sometimes spins on into a whirlwind that sucks monsters in, hits everything around you five times, then flings them away, hit or miss. Always, if the swing catches three or more.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.15, 0.6, lv, m), crowd: 3, pct: lerp(40, 72, lv, m), targets: lerp(4, 8, lv, m) } }),
  }),
  shouldercharge: skill({
    id: 'shouldercharge', name: 'Shoulder Charge', job: 'warrior', type: 'attack', fx: 'charge', icon: 'charge', maxLevel: 10, school: 'steel', movement: true,
    desc: 'Barrel forward shoulder-first, bowling over every monster in your path and tossing them aside. Nothing touches you on the way. A Paladin rushes behind a wall of light instead (Shield Rush), a Berserker charges dragging his axe and crashes down in a cleave (Reckless Charge).',
    pathNames: { paladin: 'Shield Rush', berserker: 'Reckless Charge' },
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const hit = (at) => ({ at, pct: k(90, 160), reach: 46, h: 64, around: true, targets: 4, knock: 300, launch: 180 });
      return {
        mp: k(10, 6), pct: k(90, 160), hits: 2, targets: 4,
        combo: [{ move: 'dash', dur: 0.42, step: k(80, 140), carry: 0.7, guard: 0.45, trail: true, strikes: [hit(0.25), { ...hit(0.6), big: true, stop: 0.06, shake: 2 }] }],
        // Each warrior path charges its own way (it's the same skill and key, in their style):
        paths: {
          // Shield Rush: she raises her blade flat before her and a wall of golden light snaps up;
          // she marches in behind it in heavy steps, shoving and gathering monsters up ahead of
          // her, then plants the blade and the wall bursts in pillars of light that stun them.
          paladin: [{ move: 'shieldrush', dur: 0.84, step: k(90, 140), carry: 0.74, guard: 0.8, wall: true, strikes: [
            ...[0.22, 0.4, 0.58].map((at) => ({ at, pct: k(35, 60), reach: 50, h: 70, targets: 5, knock: 180, stop: 0.02 })),
            { at: 0.8, pct: k(110, 190), reach: 70, h: 90, targets: 5, knock: 90, stun: k(1, 1.8), fx: 'pillar', burst: 'shieldslam', burstAt: 0.45, big: true, stop: 0.08, shake: 4 },
          ] }],
          // Reckless Charge: he hunches low and sprints, the axe dragging sparks along the ground,
          // trampling through everything in his way, then leaps and crashes down in a cleave that
          // tears the ground open.
          berserker: [{ move: 'recklesscharge', dur: 0.88, step: k(100, 160), carry: 0.66, guard: 0.85, trail: true, strikes: [
            ...[0.25, 0.45].map((at) => ({ at, pct: k(45, 80), reach: 46, h: 64, around: true, targets: 5, knock: 70, launch: 140, bleed: { pct: 0.15, secs: 3 }, stop: 0.02 })),
            { at: 0.8, pct: k(140, 230), reach: 90, h: 90, around: true, targets: 5, knock: 260, launch: 300, crack: true, burst: 'rageburst', burstAt: 0.2, big: true, stop: 0.1, shake: 5 },
          ] }],
        },
      };
    },
  }),
  warcry: skill({
    id: 'warcry', name: 'War Cry', job: 'warrior', type: 'passive', fx: null, icon: 'warcry', school: 'steel', party: true,
    desc: 'Whenever your gauge fills, you let out a great shout: every monster around you turns on you, and you and the party around you take less damage for a while.',
    at: (lv, m) => ({ passive: {}, proc: { duration: lerp(20, 45, lv, m), taunt: lerpf(2, 4, lv, m), buff: { dmgCut: lerpf(0.06, 0.18, lv, m) }, range: { w: lerp(320, 480, lv, m), h: 160, around: true } } }),
  }),
  ironguard: skill({
    id: 'ironguard', name: 'Iron Guard', job: 'warrior', type: 'passive', fx: null, icon: 'ironguard', school: 'steel',
    desc: 'A hard hit sometimes makes you plant your feet behind your guard: much less damage from every hit and harder armor for a few seconds.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.2, 0.6, lv, m), hard: 0.06, duration: lerp(4, 10, lv, m), buff: { dmgCut: lerpf(0.15, 0.4, lv, m), wdef: lerp(10, 50, lv, m) } } }),
  }),
  swordmastery: skill({
    id: 'swordmastery', name: 'Weapon Mastery', job: 'warrior', type: 'passive', grows: true, fx: null, icon: 'swordmastery',
    desc: 'Steadier blows and more attack with every blade.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), watk: lerp(2, 20, lv, m) } }),
  }),
  toughness: skill({
    id: 'toughness', name: 'Toughness', job: 'warrior', type: 'passive', grows: true, fx: null, icon: 'toughness',
    desc: 'Tougher all around: more max HP and weapon defense.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.03, 0.2, lv, m), wdef: lerp(3, 30, lv, m) } }),
  }),
  titanbreak: skill({
    id: 'titanbreak', dmg: 1.2, name: 'Titan Breaker', job: 'warrior', type: 'attack', fx: 'quake', icon: 'titanbreak', school: 'steel', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Valor, and spends it. Leap high, somersaulting inside a wheel of steel as your blade turns over and over, while a giant sword of steel forms above you; then crash down with it and split the ground in two, throwing everything around you into the air.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 3, targets,
        combo: [{ move: 'gstitan', dur: 1.38, step: 10, finisher: true, guard: 1.2, strikes: [
          { at: 0.1, pct: 0, reach: 0, h: 0, targets: 0, burst: 'gswheel', burstAt: 0, burstDur: 0.46, quiet: true, gauge: 0 },
          { at: 0.3, pct: 0, reach: 0, h: 0, targets: 0, burst: 'titanrise', burstAt: 0, quiet: true, gauge: 0 },
          { at: 0.62, pct: k(420, 720), reach: 170, h: 150, around: true, targets, knock: 300, launch: 460, crack: true, burst: 'titanbreak', burstAt: 0.25, big: true, stop: 0.16, shake: 8, gauge: 0 },
          { at: 0.8, pct: k(150, 260), reach: 185, h: 150, around: true, targets, knock: 220, burst: 'titanwave', burstAt: 0, big: true, stop: 0.05, shake: 3, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Paladin (the warrior's tank path: holy light, stuns, taunts, blessings) ----------
  // Like the Warrior, she fights with her basic attacks and her skills set themselves off (procs,
  // see the Warrior above): Aegis Smite from her swings, Hallowed Ground from her combo's last
  // swing, Divine Aegis when a hit leaves her low. Her buttons are Shoulder Charge and Grand
  // Verdict, the big finisher on full Faith.
  paladinmastery: skill({
    id: 'paladinmastery', name: 'Paladin Mastery', job: 'paladin', type: 'passive', grows: true, fx: null,
    desc: 'Steadier blows, thicker armor, and more max HP.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), wdef: lerp(5, 40, lv, m), maxHpPct: lerpf(0.02, 0.15, lv, m) } }),
  }),
  aegissmite: skill({
    id: 'aegissmite', name: 'Aegis Smite', job: 'paladin', type: 'passive', fx: null, school: 'holy',
    desc: 'Your swings sometimes call a pillar of light down just ahead of you, hit or miss: holy damage to everything under it, and a stun.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.3, lv, m), pct: lerp(80, 150, lv, m), targets: lerp(2, 4, lv, m), stun: lerpf(0.6, 1.4, lv, m) } }),
  }),
  hallowedground: skill({
    id: 'hallowedground', name: 'Hallowed Ground', job: 'paladin', type: 'attack', fx: null, icon: 'hallowed', school: 'holy', maxLevel: 10, party: true,
    desc: 'Drive your blade into the ground: a ring of holy light bursts out round you, every monster it catches turns on you, and its warmth mends you and the party around you. A beat later the ring flares again and throws them off their feet.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(6, 9);
      return {
        mp: k(14, 24), pct: k(140, 240), hits: 2, targets, mend: lerpf(0.06, 0.12, lv, m),
        combo: [{ move: 'consecrate', dur: 0.84, step: 4, strikes: [
          { at: 0.46, pct: k(140, 240), reach: 120, h: 90, around: true, targets, knock: 60, provoke: lerpf(3, 5, lv, m), burst: 'consecrate', burstAt: 0, big: true, stop: 0.08, shake: 3 },
          { at: 0.8, pct: k(110, 190), reach: 130, h: 90, around: true, targets, knock: 30, launch: 220, burst: 'consecrate', burstAt: 0, stop: 0.04, shake: 1 },
        ] }],
      };
    },
  }),
  divineaegis: skill({
    id: 'divineaegis', name: 'Divine Aegis', job: 'paladin', type: 'passive', fx: null, icon: 'aegis', school: 'holy', party: true,
    desc: 'When a hit leaves you under half your HP, you raise your blade to the sky: you and the party around you take less damage and slowly heal for a while. And a shield of light sometimes flashes up and blocks a hit outright, then answers with a holy shockwave that stuns everything around you (twice as often while the blade is raised).',
    at: (lv, m) => ({ passive: {}, proc: {
      low: 0.5, duration: lerp(12, 24, lv, m), buff: { dmgCut: lerpf(0.1, 0.25, lv, m), regenPct: lerpf(0.01, 0.025, lv, m) }, range: { w: 440, h: 160, around: true },
      block: lerpf(0.06, 0.15, lv, m), pct: lerp(120, 220, lv, m), targets: lerp(4, 7, lv, m), stun: lerpf(1, 2, lv, m),
    } }),
  }),

  judgment: skill({
    id: 'judgment', name: 'Judgment', job: 'paladin', type: 'passive', fx: null, icon: 'judgment', school: 'holy', maxLevel: 10,
    desc: 'When your Faith fills, you ascend for a while: every swing strikes again with holy light (no knockback), your swings reach farther, your Faith stays full, and the last swing of every combo calls a rain of holy swords down ahead of you that mends you and the party around you a little.',
    at: (lv, m) => ({ passive: {}, proc: { duration: lerp(8, 15, lv, m), echo: lerp(50, 80, lv, m), buff: { watk: lerp(10, 40, lv, m), dmgCut: lerpf(0.05, 0.12, lv, m) }, swords: lerp(5, 8, lv, m), pct: lerp(90, 150, lv, m), heal: lerpf(0.01, 0.02, lv, m) } }),
  }),

  grandverdict: skill({
    id: 'grandverdict', dmg: 1.75, name: 'Grand Verdict', job: 'paladin', type: 'attack', fx: 'judgment', icon: 'verdict', school: 'holy', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Faith, and spends it. Plant your blade and kneel as a sun of light rises over you, then rise on the light and swing as a giant sword of light drives down on everything around you; pillars of light strike every monster it hits.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 3, targets,
        combo: [{ move: 'plverdict', dur: 1.46, step: 0, finisher: true, guard: 1.3, strikes: [
          { at: 0.05, pct: 0, reach: 0, h: 0, targets: 0, burst: 'verdicthalo', burstAt: 0, burstDur: 0.92, quiet: true, rage: 0 },
          { at: 0.24, pct: k(60, 110), reach: 150, h: 130, around: true, targets, pull: 90, burst: 'consecrate', burstAt: 0, stop: 0.03, rage: 0 },
          { at: 0.66, pct: k(420, 720), reach: 170, h: 150, around: true, targets, knock: 120, launch: 440, burst: 'verdict', burstAt: 0, fx: 'pillar', big: true, stop: 0.16, shake: 8 },
          { at: 0.82, pct: k(150, 260), reach: 180, h: 150, around: true, targets, knock: 260, burst: 'consecrate', burstAt: 0, big: true, stop: 0.05, shake: 3 },
        ] }],
      };
    },
  }),

  // ---------- Berserker (the warrior's damage path: Rage, bleeding, savage flurries) ----------
  // Every blow a Berserker lands builds Rage (0-100, see world/melee.js); it drains away out of a
  // fight. `rageCost` is the least Rage Rampage needs to go off; it feeds on the Rage without spending it. Like the
  // Warrior, he fights with his basic attacks and his skills set themselves off (procs): Ravage
  // from his swings, Rampage from his combo's last swing once he has the Rage, Blood Frenzy from a
  // critical hit. His buttons are Shoulder Charge and Crimson Eclipse on full Rage.
// Finishers (`fullGauge`) need the path's own gauge full (Rage, Faith, Gale or Focus) and spend
// all of it (see world/combat.js).
  berserkermastery: skill({
    id: 'berserkermastery', name: 'Berserker Mastery', job: 'berserker', type: 'passive', grows: true, fx: null,
    desc: 'Steadier blows, more attack, and harder critical hits.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(3, 30, lv, m), critDamage: lerpf(0.05, 0.25, lv, m) } }),
  }),
  ravage: skill({
    id: 'ravage', name: 'Ravage', job: 'berserker', type: 'passive', fx: null, icon: 'ravage', school: 'rage',
    desc: 'Your swings sometimes rip on into two savage cleaves, hit or miss, that make everything they catch bleed. Builds Rage.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.3, lv, m), pct: lerp(70, 120, lv, m), targets: lerp(2, 4, lv, m), bleed: { pct: lerpf(0.15, 0.3, lv, m), secs: 4 } } }),
  }),
  bloodfrenzy: skill({
    id: 'bloodfrenzy', name: 'Blood Frenzy', job: 'berserker', type: 'passive', fx: null, icon: 'frenzy', school: 'rage',
    desc: 'A critical hit sometimes sends you into a frenzy: more attack, attack speed, and critical hits for a while, and a quarter of your Rage at once.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.5, 1, lv, m), duration: lerp(10, 20, lv, m), rageGain: 25, buff: { watk: lerp(5, 35, lv, m), attackSpeed: lerpf(0.05, 0.15, lv, m), critRate: lerpf(0.02, 0.1, lv, m) } } }),
  }),
  rampage: skill({
    id: 'rampage', name: 'Rampage', job: 'berserker', type: 'attack', fx: null, icon: 'rampage', school: 'rage', rageCost: 30, maxLevel: 10,
    desc: 'Needs 30 Rage, and spends it. Three wild cleaves back and forth, then a leaping skull-splitter that smashes the ground around you. It feeds on the rest of your Rage: the more you have, the harder it hits (double at full Rage).',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(4, 7);
      const chop = (at, arc) => ({ at, pct: k(110, 190), reach: 82, h: 70, targets, knock: 40, arc, thick: 12, rage: 0 });
      return {
        mp: 0, pct: k(110, 190), hits: 4, targets,
        combo: [{ move: 'rampage', dur: 1.32, step: 30, carry: 0.6, strikes: [
          chop(0.064, [-150, 230]), chop(0.227, [110, -240]), chop(0.384, [-150, 230]),
          { at: 0.724, pct: k(300, 520), reach: 120, h: 92, around: true, targets: targets + 2, knock: 300, launch: 250, crack: true, big: true, burst: 'rageburst', stop: 0.14, shake: 7, rage: 0 },
        ] }],
      };
    },
  }),

  bloodlust: skill({
    id: 'bloodlust', name: 'Bloodlust', job: 'berserker', type: 'passive', fx: null, icon: 'bloodlust', school: 'rage', maxLevel: 10,
    desc: 'Your blows drink blood: they heal you for a share of the damage they do (up to a share of your max HP each second), up to three times as much the lower your HP.',
    at: (lv, m) => ({ passive: {}, proc: { steal: lerpf(0.02, 0.05, lv, m), low: 3, cap: lerpf(0.012, 0.02, lv, m) } }),
  }),
  demonform: skill({
    id: 'demonform', name: 'Demon Form', job: 'berserker', type: 'passive', fx: null, icon: 'demonform', school: 'rage', maxLevel: 10,
    desc: 'When your Rage fills, the demon takes you over for a while: a blood-red shadow of you stands behind you and strikes again after every swing (no knockback), your swings reach farther, and your Rage stays full until it ends.',
    at: (lv, m) => ({ passive: {}, proc: { duration: lerp(8, 15, lv, m), echo: lerp(50, 80, lv, m), buff: { watk: lerp(10, 40, lv, m) } } }),
  }),

  crimsoneclipse: skill({
    id: 'crimsoneclipse', dmg: 2.5, name: 'Crimson Eclipse', job: 'berserker', type: 'attack', fx: 'quake', icon: 'eclipse', school: 'rage', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Rage, and spends it. Hurl your axe spinning round you in a burning wheel that drags monsters in, catch it, leap up under a blood-red moon as a giant axe of fire forms over you, and smash down with it.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const whirl = (at, i) => ({ at, pct: k(60, 100), reach: 96, h: 120, around: true, targets, pull: 80, arc: [i % 2 ? 180 : 0, 300], thick: 12, stop: 0.02, rage: 0 });
      return {
        mp: k(30, 50), pct: k(440, 760), hits: 7, targets,
        combo: [{ move: 'bkeclipse', dur: 1.46, step: 6, finisher: true, guard: 1.3, strikes: [
          { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, burst: 'axethrow', burstAt: 0, burstDur: 0.53, quiet: true, rage: 0 },
          ...[0.08, 0.17, 0.26, 0.35, 0.44].map(whirl),
          { at: 0.47, pct: 0, reach: 0, h: 0, targets: 0, burst: 'bloodmoon', burstAt: 0, rage: 0 },
          { at: 0.68, pct: k(440, 760), reach: 175, h: 150, around: true, targets, knock: 300, launch: 380, crack: true, burst: 'eclipse', burstAt: 0, big: true, stop: 0.16, shake: 8, rage: 0 },
          { at: 0.8, pct: k(150, 260), reach: 185, h: 150, around: true, targets, knock: 200, burst: 'rageburst', burstAt: 0.3, big: true, stop: 0.05, shake: 3, rage: 0 },
        ] }],
      };
    },
  }),

  // ---------- Star Witch (midnight blue and gold: stars, comets, constellations) ----------
  // The Spirit Mage remade (the player's ask, 2026-11-02; docs/design/star-witch.md): a bright
  // prodigy who casts like she's showing off, every cast out in about a fifth of a second. Spells
  // that land and heals light the stars of her Constellation (the old Spirit, world/melee.js), half
  // again when she turns from one to the other; full, her bolts split into three. She keeps two
  // star heals for the healer's seat in the early dungeons. (Internally she keeps the Spirit Mage's
  // id and skill ids, so saves, the dungeon healer and her paths carry over.)
  spiritbolt: skill({
    id: 'spiritbolt', name: 'Shooting Star', job: 'spiritmage', type: 'attack', fx: 'bolt', icon: 'spiritbolt', school: 'starlit',
    desc: 'A three-part cast, one per press: a flick of the wand that sends a shooting star, a twirl that sends two, then a snap that fires a comet through the whole line.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const bolt = (at, pct, oy = 0) => ({ at, shot: 'stbolt', magic: true, pct, range: 300, h: 60, knock: 30, speed: 880, oy });
      return {
        mp: k(8, 16), pct: k(150, 260), hits: 4, targets: 1,
        combo: [
          { move: 'swflick', dur: 0.36, step: 10, strikes: [bolt(0.3, k(150, 260))] },
          { move: 'swtwirl', dur: 0.46, step: 12, carry: 0.6, strikes: [bolt(0.3, k(95, 165), -4), bolt(0.5, k(95, 165), 4)] },
          { move: 'swsnap', dur: 0.56, step: 18, finisher: true, strikes: [{ at: 0.48, shot: 'stcomet', magic: true, pct: k(240, 400), range: 320, h: 70, targets: k(2, 4), pierce: true, speed: 800, knock: 180, big: true, stop: 0.06, shake: 2 }] },
        ],
      };
    },
  }),

  spiritstep: skill({
    id: 'spiritstep', name: 'Star Step', job: 'spiritmage', type: 'attack', fx: 'blink', icon: 'spiritstep', maxLevel: 10, school: 'starlit', movement: true,
    desc: 'Spin on the spot and pop into sparkles, then appear a long way ahead with a little bounce. Nothing touches you on the way.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: 0, hits: 0, targets: 0,
        combo: [{ move: 'swblink', dur: 0.5, step: k(120, 180), carry: 0.35, guard: 0.45, trail: true, strikes: [{ at: 0.3, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'sthit', burstAt: 0, burstDur: 0.4 }] }],
      };
    },
  }),

  spiritwave: skill({
    id: 'spiritwave', name: 'Comet', job: 'spiritmage', type: 'attack', fx: null, icon: 'spiritwave', school: 'starlit',
    desc: 'Spin the wand once and point: a great comet tears through every monster in the line, knocking them back.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(12, 22), pct: k(220, 380), hits: 1, targets: k(5, 8),
        combo: [{ move: 'swshowoff', dur: 0.54, step: 12, strikes: [{ at: 0.48, shot: 'stcomet', magic: true, pct: k(220, 380), range: 360, h: 80, targets: k(5, 8), pierce: true, speed: 840, knock: 200, launch: 120, big: true, stop: 0.06, shake: 3, gauge: 6 }] }],
      };
    },
  }),

  // Wishing Star and Star Veil land on the party round her in a dungeon (`grant`: a buff given when
  // the strike lands, see world/melee.js).
  blessing: skill({
    id: 'blessing', name: 'Wishing Star', job: 'spiritmage', type: 'heal', fx: null, icon: 'blessing', school: 'starlit', party: true,
    desc: 'Hold your wand to your heart and make a wish: a star falls into a column of gold light on you and the party around you, healing at once, then a little more every second for a while, and lifting everyone\'s attack and magic while it lasts.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 440, h: 160, around: true };
      return {
        mp: k(20, 40), pct: 0, hits: 0, targets: 0, range,
        combo: [{ move: 'swwish', dur: 0.8, step: 0, strikes: [{ at: 0.55, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, heal: kf(0.18, 0.4), healR: 220, burst: 'stwish', burstAt: 0, burstDur: 1, grant: { id: 'blessing', duration: k(8, 14), buff: { regenPct: kf(0.015, 0.035), watk: k(3, 10), matk: k(3, 10) }, range } }] }],
      };
    },
  }),

  spiritward: skill({
    id: 'spiritward', name: 'Star Veil', job: 'spiritmage', type: 'buff', fx: null, icon: 'spiritward', school: 'starlit', party: true, maxLevel: 15,
    desc: 'Draw a circle in the air and push it out: a veil of linked stars settles over you and the party nearby, soaking up damage until it breaks.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 440, h: 160, around: true };
      return {
        mp: k(24, 40), pct: 0, hits: 0, targets: 0, range,
        combo: [{ move: 'swveil', dur: 0.72, step: 0, strikes: [{ at: 0.55, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'stveil', burstAt: 0, burstDur: 0.9, grant: { id: 'spiritward', duration: k(20, 40), buff: { barrier: kf(0.2, 0.45) }, range } }] }],
      };
    },
  }),

  manamastery: skill({
    id: 'manamastery', name: 'Mana Mastery', job: 'spiritmage', type: 'passive', grows: true, fx: null, icon: 'manamastery',
    desc: 'Steadier spells, more magic attack, and a deeper well of MP.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), matk: lerp(2, 25, lv, m), maxMpPct: lerpf(0.04, 0.2, lv, m) } }),
  }),

  // ---------- The Star Witch's paths ----------
  // The Starlight Idol (the Shrine Maiden remade, id kept; docs/design/starlight-idol.md): the
  // party's healer, singing into her wand as a microphone. Her songs hang in the air where she sang
  // them (`song`, world/idol.js), she builds Applause (world/melee.js), and her finisher is Grand
  // Concert. The Astronomer (damage, below) is the other path.
  shrinemastery: skill({
    id: 'shrinemastery', name: 'Stage Presence', job: 'shrinemaiden', type: 'passive', grows: true, fx: null, icon: 'shrinemastery',
    desc: 'The crowd is with you: more magic attack, a deeper well of MP, and every heal you give mends more.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.65, lv, m), matk: lerp(5, 35, lv, m), maxMpPct: lerpf(0.05, 0.25, lv, m), healPower: lerpf(0.05, 0.3, lv, m) } }),
  }),
  grandblessing: skill({
    id: 'grandblessing', name: 'Healing Song', job: 'shrinemaiden', type: 'heal', fx: null, icon: 'grandblessing', school: 'idol', party: true, replaces: 'blessing',
    desc: 'Lay a hand on your heart and sing: you and the party around you are healed at once, and the song hangs in the air where you sang it for a while, a ring of pink notes that mends everyone standing in it every second.',
    weapons: ['wand'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(40, 70), pct: 0, hits: 0, targets: 0, range: { w: 400, h: 180, around: true },
        combo: [{ move: 'sisong', dur: 0.95, step: 0, strikes: [{ at: 0.42, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, heal: kf(0.22, 0.38), healR: 220, song: { kind: 'heal', r: k(110, 140), dur: k(8, 14), every: 1, heal: kf(0.03, 0.055) } }] }],
      };
    },
  }),
  idolcheer: skill({
    id: 'idolcheer', name: 'Cheer', job: 'shrinemaiden', type: 'buff', fx: null, icon: 'idolcheer', school: 'idol', party: true,
    desc: 'Three pumps of the mic, "hey, hey, HEY!": a cheer hangs in the air where you sang it for a while, a ring of gold stars, and everyone standing in it hits harder.',
    weapons: ['wand'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 50), pct: 0, hits: 0, targets: 0, range: { w: 400, h: 180, around: true },
        combo: [{ move: 'sicheer', dur: 0.8, step: 0, strikes: [{ at: 0.6, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, song: { kind: 'cheer', r: k(115, 150), dur: k(10, 18), every: 1, watk: k(8, 22), matk: k(8, 22) } }] }],
      };
    },
  }),
  purification: skill({
    id: 'purification', name: 'Lullaby', job: 'shrinemaiden', type: 'attack', fx: null, icon: 'purification', school: 'idol',
    desc: 'Rock slowly and sing them to sleep: a lullaby hangs in the air where you sang it for a while, a ring of soft lilac moons. Monsters in it slow to a sleepy drift, and your notes chip at them again and again.',
    weapons: ['wand'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 55), pct: k(50, 95), hits: 1, targets: 0,
        combo: [{ move: 'silullaby', dur: 0.95, step: 0, strikes: [{ at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, song: { kind: 'lull', r: k(110, 140), dur: k(6, 10), every: 0.6, pct: k(50, 95) } }] }],
      };
    },
  }),
  resurrection: skill({
    id: 'resurrection', name: 'Curtain Call', job: 'shrinemaiden', type: 'heal', fx: null, icon: 'resurrection', school: 'idol', party: true, maxLevel: 10,
    desc: 'Take a deep bow, then rise with your arms flung up to the crowd: every fallen ally nearby gets back up. And for a while the crowd won\'t let you leave the stage: a blow that would knock you out leaves you standing instead (Encore), once.',
    weapons: ['wand'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(60, 100), pct: 0, hits: 0, targets: 0, range: { w: 640, h: 180, around: true },
        combo: [{ move: 'sibow', dur: 1.15, step: 0, strikes: [{ at: 0.66, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, revive: { r: 320, pct: kf(0.4, 0.7), rite: k(20, 40) } }] }],
      };
    },
  }),
  thousandtorii: skill({
    id: 'thousandtorii', name: 'Grand Concert', job: 'shrinemaiden', type: 'attack', fx: null, icon: 'thousandtorii', school: 'idol', maxLevel: 10, fullGauge: true, party: true,
    desc: 'Finisher: needs full Applause, and spends it. A stage of light rises under you and the spotlights find you: everyone near is healed in full and wrapped in a ward, and you sing it out, three big beats, each one blasting the monsters back with the music.',
    weapons: ['wand'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(40, 60), pct: k(240, 400), hits: 3, targets: 0, range: { w: 640, h: 180, around: true },
        combo: [{ move: 'siconcert', dur: 2.1, step: 0, strikes: [{ at: 0.12, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, concert: { r: 320, pct: k(240, 400), beats: [0.62, 0.95, 1.33], ward: kf(0.2, 0.4), wardDur: k(10, 16) } }] }],
      };
    },
  }),
  // The Astronomer (the Onmyoji remade, id kept; docs/design/astronomer.md): a calm stargazer who
  // conducts the planets with an orrery staff. Her gauge, Orbit, is the moons round her (world/
  // melee.js); her spells live in world/astro.js.
  onmyodo: skill({
    id: 'onmyodo', name: 'Celestial Lore', job: 'onmyoji', type: 'passive', grows: true, fx: null, icon: 'onmyodo',
    desc: 'Years under the night sky: steadier spells, much more magic attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.65, lv, m), matk: lerp(8, 45, lv, m), acc: lerp(5, 30, lv, m) } }),
  }),
  ofudabarrage: skill({
    id: 'ofudabarrage', name: 'Ringed Planet', job: 'onmyoji', type: 'attack', fx: null, icon: 'ofudabarrage', school: 'astral',
    desc: 'Plant your staff and turn your free hand slowly, as if spinning a globe, then push: a great ringed planet rolls away through every monster in the line, knocking them back.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(22, 40), pct: k(240, 400), hits: 1, targets: k(5, 8),
        combo: [{ move: 'asglobe', dur: 0.95, step: 0, strikes: [{ at: 0.56, shot: 'asbig', magic: true, pct: k(240, 400), range: 380, h: 90, targets: k(5, 8), pierce: true, speed: 540, knock: 220, launch: 100, big: true, stop: 0.06, shake: 2, gauge: 6 }] }],
      };
    },
  }),
  seimanseal: skill({
    id: 'seimanseal', name: 'Gravity Well', job: 'onmyoji', type: 'attack', fx: null, icon: 'seimanseal', school: 'astral',
    desc: 'Hold the staff out and draw it slowly in, as if pulling on something heavy, then point it down: a small world hangs there for a while, pulling the monsters round it in toward it and crushing them again and again.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(35, 60), pct: k(55, 100), hits: 1, targets: 0,
        combo: [{ move: 'aswell', dur: 0.95, step: 0, strikes: [{ at: 0.6, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, well: { r: k(110, 150), ahead: 120, dur: k(5, 8), every: 0.5, pct: k(55, 100), pull: 16 } }] }],
      };
    },
  }),
  yokairally: skill({
    id: 'yokairally', name: 'Lunar Tide', job: 'onmyoji', type: 'buff', fx: null, icon: 'yokairally', school: 'astral', maxLevel: 15,
    desc: 'Lift your staff to the sky and close your eyes: the tide of the moons rises round you. For a while your moons circle faster, fly out more often and strike harder.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(30, 50), pct: 0, hits: 0, targets: 0,
        combo: [{ move: 'astide', dur: 0.85, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'astide', burstAt: 0, burstDur: 0.9, grant: { id: 'yokairally', duration: k(16, 30), buff: { moonPower: kf(0.4, 0.9), moonHaste: 0.6 } } }] }],
      };
    },
  }),
  troupecombo: skill({
    id: 'troupecombo', dmg: 2, name: 'Planetary Alignment', job: 'onmyoji', type: 'attack', fx: null, icon: 'troupecombo', school: 'astral', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a Full Orbit, and spends it. Rise off the ground and draw a line across the sky with your staff: five planets fall into a row ahead of you, and when you sweep the staff forward they fire as one beam through every monster in the row.',
    weapons: ['staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(40, 60), pct: k(300, 520), hits: 1, targets: 0,
        combo: [{ move: 'asalign', dur: 2, step: 0, strikes: [{ at: 0.1, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, align: { span: 520, at: 1.04, pct: k(300, 520) } }] }],
      };
    },
  }),

  heavenslantern: skill({
    id: 'heavenslantern', name: 'Starfall', job: 'spiritmage', type: 'attack', fx: null, icon: 'heavenslantern', school: 'starlit', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a full Constellation, and spends it. Draw the constellation across the sky star by star, then swing your wand down: it all comes crashing down as a shower of meteors on every monster ahead, ending in one great impact. Then strike a pose.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 50), pct: k(500, 860), hits: 14, targets: 12,
        combo: [{ move: 'swstarfall', dur: 1.45, step: 0, finisher: true, guard: 1.35, strikes: [
          { at: 0.1, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, burst: 'starfallsky', burstAt: 0, burstDur: 0.9 },
          { at: 0.66, rain: k(10, 14), magic: true, pct: k(110, 180), rainFrom: 20, rainW: 380, span: 0.45, knock: 40, variant: 'stmeteor', school: 'starlit', gauge: 0 },
          { at: 0.86, magic: true, pct: k(500, 860), reach: 210, h: 160, around: true, targets: 12, knock: 260, launch: 260, burst: 'starfallimpact', burstAt: 0.5, burstDur: 0.7, big: true, stop: 0.16, shake: 8, gauge: 0 },
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
    desc: 'Set a little circus springboard down just ahead and give it a pat. The first monster to step on it is bounced high into the air. Up to three at once.',
    at: (lv, m) => ({ mp: lerp(8, 14, lv, m), pct: lerp(180, 300, lv, m), life: lerp(12, 20, lv, m), trap: true }),
  }),
  vault: skill({
    id: 'vault', name: 'Handspring', job: 'archer', type: 'attack', fx: null, icon: 'vault', maxLevel: 10, school: 'hawk', movement: true,
    desc: 'Run in and handspring right over the monster in front of you, land behind it, and turn to shoot it. Nothing touches you mid-flip.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(110, 180), hits: 1, targets: 1,
        combo: [{ move: 'achandspring', dur: 0.66, step: k(100, 140), carry: 0.62, guard: 0.6, strikes: [{ at: 0.8, turn: true, shot: 'hawkarrow', pct: k(110, 180), range: 300, h: 70, knock: 160, speed: 900, big: true, stop: 0.05, shake: 1 }] }],
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
    id: 'cometarrow', name: 'Grand Somersault', job: 'archer', type: 'attack', fx: null, school: 'hawk', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs a full Combo, and spends it. Crouch deep and launch yourself into a huge triple somersault high above the screen; at the top a ring of gold bursts round you and you rain golden arrows down on everything below, then land with a wink.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(30, 50), pct: k(120, 200), hits: 1, targets: 0,
        combo: [{ move: 'acsomersault', dur: 1.9, step: 0, finisher: true, guard: 1.7, strikes: [
          { at: 0.58, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, burst: 'acburst', burstAt: 0, burstDur: 0.8, gauge: 0 },
          { at: 0.6, rain: k(12, 16), pct: k(120, 200), rainW: 420, around: true, span: 0.3, knock: 60, launch: 140, variant: 'acarrow', school: 'acro', gauge: 0 },
        ] }],
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
    id: 'stampede', name: 'Grand Illusion', job: 'beastmaster', type: 'attack', fx: null, school: 'phantom', maxLevel: 10, fullGauge: true,
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
  // Steam Vent when a hit lands on her. Her buttons are Deploy Turret, Overclock and Big Bertha.
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
  overclock: skill({
    id: 'overclock', name: 'Overclock', job: 'stormcaller', type: 'buff', fx: 'buff', icon: 'overclock', school: 'brass', maxLevel: 10, lock: 0.8, landAt: 0.75,
    desc: 'Crank your crossbow past its limits: your next few bolts are heavy bolts that tear through every monster in their line, hitting far harder.',
    at: (lv, m) => ({ mp: lerp(20, 30, lv, m), duration: 20, buff: { shots: lerp(3, 6, lv, m), power: lerpf(1.6, 2.2, lv, m) } }),
  }),
  bigbertha: skill({
    id: 'bigbertha', name: 'Big Bertha', job: 'stormcaller', type: 'attack', fx: null, icon: 'bigbertha', school: 'brass', maxLevel: 10, fullGauge: true,
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
    id: 'grandfinale', name: 'Grand Finale', job: 'thief', type: 'attack', fx: null, icon: 'grandfinale', school: 'coral', maxLevel: 10, fullGauge: true,
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
      };
    },
  }),

  // ---------- Blade Dancer (the Wind Dancer's chakram path: rose gold, bouncing rings, a carousel) ----------
  // docs/design/blade-dancer.md. Every blow of hers is a throw or a catch: her rings ricochet from
  // monster to monster and fly home to her hand (world/melee.js ringThrow). Rings landing and
  // bouncing build Ricochet (internally Ki, the Shinobi's it replaced); full (Carousel), two rings
  // orbit her and cut what comes close. Like the Wind Dancer, her book is mostly skills that go off
  // by themselves (Rebound, Twin Rings); her button is Golden Carousel, the finisher.
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
  // Zephyr); her button is Sky Waltz, the finisher.
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
  stampede: 'ptillusion', snacktime: 'ptshow', deployturret: 'aedeploy', overclock: 'aeoverclock', bigbertha: 'aebertha',
  bladerush: 'overhead', whirlwind: 'spin', shouldercharge: 'dash', warcry: 'roar', ironguard: 'guard', titanbreak: 'titanbreak',
  aegissmite: 'bash', hallowedground: 'consecrate', divineaegis: 'salute', ravage: 'cleave1', bloodfrenzy: 'warroar', rampage: 'rampage', grandverdict: 'verdict', crimsoneclipse: 'eclipse',
  pirouette: 'wdchaine', grandfinale: 'wdencore',
  spiritbolt: 'swflick', spiritstep: 'swblink', spiritwave: 'swshowoff', blessing: 'swwish', spiritward: 'swveil', heavenslantern: 'swstarfall',
  grandblessing: 'sisong', idolcheer: 'sicheer', purification: 'silullaby', resurrection: 'sibow', thousandtorii: 'siconcert',
  ofudabarrage: 'asglobe', seimanseal: 'aswell', yokairally: 'astide', troupecombo: 'asalign',
  goldencarousel: 'bdcarousel',
  skywaltz: 'sdwaltz',
  gmsmite: 'castup', gmhaste: 'cheer',
};
for (const [id, move] of Object.entries(MOVES_BY_SKILL)) SKILLS[id].anim = move;

// Numbers for `skillId` at `level`, with the skill's max level passed through for scaling.
export function skillAt(skillId, level) {
  const s = SKILLS[skillId];
  return { ...s.at(level, s.maxLevel), lock: s.lock };
}

