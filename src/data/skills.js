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
    id: 'pebble', name: 'Star Pebble', job: 'novice', type: 'attack', maxLevel: 3, fx: 'pebble',
    desc: 'Flick a sparkly pebble at the nearest monster.',
    at: (lv) => ({ mp: 2, pct: 110 + lv * 25, hits: 1, targets: 1, range: { w: 220, h: 50 }, projectile: true }),
  }),
  quickstep: skill({
    id: 'quickstep', name: 'Quick Step', job: 'novice', type: 'buff', maxLevel: 3, fx: 'buff',
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
          paladin: [{ move: 'shieldrush', dur: 0.9, step: k(90, 140), carry: 0.74, guard: 0.8, wall: true, strikes: [
            ...[0.22, 0.4, 0.58].map((at) => ({ at, pct: k(35, 60), reach: 50, h: 70, targets: 5, knock: 180, stop: 0.02 })),
            { at: 0.8, pct: k(110, 190), reach: 70, h: 90, targets: 5, knock: 90, stun: k(1, 1.8), fx: 'pillar', burst: 'shieldslam', burstAt: 0.45, big: true, stop: 0.08, shake: 4 },
          ] }],
          // Reckless Charge: he hunches low and sprints, the axe dragging sparks along the ground,
          // trampling through everything in his way, then leaps and crashes down in a cleave that
          // tears the ground open.
          berserker: [{ move: 'recklesscharge', dur: 0.95, step: k(100, 160), carry: 0.66, guard: 0.85, trail: true, strikes: [
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
    desc: 'Finisher: needs full Valor, and spends it. Crouch and leap high with the blade raised as a giant sword of steel forms above you, then crash down and split the ground in two, throwing everything around you into the air.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 3, targets,
        combo: [{ move: 'titanbreak', dur: 1.5, step: 10, finisher: true, guard: 1.2, strikes: [
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
        combo: [{ move: 'consecrate', dur: 0.9, step: 4, strikes: [
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
    desc: 'Finisher: needs full Faith, and spends it. Kneel, rise on a column of light, then drive a giant sword of light down on everything around you; pillars of light strike every monster it hits.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 3, targets,
        combo: [{ move: 'verdict', dur: 1.6, step: 0, finisher: true, guard: 1.3, strikes: [
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
        combo: [{ move: 'rampage', dur: 1.45, step: 30, carry: 0.6, strikes: [
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
    desc: 'Finisher: needs full Rage, and spends it. A whirlwind spins you up into the air, sucking monsters in, then you crash down under a blood-red moon in one enormous smash.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const whirl = (at, i) => ({ at, pct: k(60, 100), reach: 96, h: 120, around: true, targets, pull: 80, arc: [i % 2 ? 180 : 0, 300], thick: 12, stop: 0.02, rage: 0 });
      return {
        mp: k(30, 50), pct: k(440, 760), hits: 7, targets,
        combo: [{ move: 'eclipse', dur: 1.6, step: 6, finisher: true, guard: 1.3, strikes: [
          ...[0.08, 0.17, 0.26, 0.35, 0.44].map(whirl),
          { at: 0.47, pct: 0, reach: 0, h: 0, targets: 0, burst: 'bloodmoon', burstAt: 0, rage: 0 },
          { at: 0.68, pct: k(440, 760), reach: 175, h: 150, around: true, targets, knock: 300, launch: 380, crack: true, burst: 'eclipse', burstAt: 0, big: true, stop: 0.16, shake: 8, rage: 0 },
          { at: 0.8, pct: k(150, 260), reach: 185, h: 150, around: true, targets, knock: 200, burst: 'rageburst', burstAt: 0.3, big: true, stop: 0.05, shake: 3, rage: 0 },
        ] }],
      };
    },
  }),

  // ---------- Spirit Mage (white spirit light, paper streamers, scarlet cords, gold bells) ----------
  // Damage and support at once, cast as a shrine dance. Spells that land and heals build Spirit
  // (0-100, see world/melee.js), half again when she turns from one to the other; full (Kami's
  // Favour), every damage spell also mends allies near where it lands. Her Spirit Doll floats at
  // her side and fights with her own tricks (world/spiritdoll.js). Spells are timed combo steps
  // like every other attack: `magic` strikes hit with magic attack.
  spiritbolt: skill({
    id: 'spiritbolt', name: 'Spirit Bolt', job: 'spiritmage', type: 'attack', fx: 'bolt', icon: 'spiritbolt', school: 'spirit',
    desc: 'A three-part dance, one figure per press: a sweep that sends a spirit bolt, a swaying step that sends two, then a deep sweeping bow that looses a great bolt through the whole line.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const bolt = (at, pct, oy = 0) => ({ at, shot: 'spiritorb', magic: true, pct, range: 300, h: 60, knock: 25, speed: 620, oy });
      return {
        mp: k(10, 22), pct: k(330, 570), hits: 4, targets: 1,
        combo: [
          { move: 'kagura', dur: 1.01, step: 2, strikes: [bolt(0.55, k(330, 570))] },
          { move: 'kaguraturn', dur: 1.14, step: 2, strikes: [bolt(0.58, k(220, 375), -5), bolt(0.68, k(220, 375), 5)] },
          { move: 'kagurafin', dur: 1.54, step: 4, finisher: true, strikes: [{ at: 0.6, shot: 'spiritbig', magic: true, pct: k(485, 790), range: 320, h: 70, targets: k(2, 4), pierce: true, speed: 680, knock: 180, launch: 120, big: true, stop: 0.06, shake: 2 }] },
        ],
      };
    },
  }),

  spiritstep: skill({
    id: 'spiritstep', name: 'Spirit Step', job: 'spiritmage', type: 'attack', fx: 'blink', icon: 'spiritstep', maxLevel: 10, school: 'spirit', movement: true,
    desc: 'Rise on your toes and come apart into paper streamers and light, then gather again a long way ahead. Nothing touches you on the way.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: 0, hits: 0, targets: 0,
        combo: [{ move: 'spiritstep', dur: 0.55, step: k(120, 180), carry: 0.35, guard: 0.45, trail: true, strikes: [{ at: 0.35, pct: 0, reach: 0, h: 0, targets: 0, quiet: true }] }],
      };
    },
  }),

  spiritwave: skill({
    id: 'spiritwave', name: 'Spirit Wave', job: 'spiritmage', type: 'attack', fx: null, icon: 'spiritwave', school: 'spirit',
    desc: 'Raise the bell staff high and bring it down to the floor: a ring of white light races out along the ground both ways, paper streamers whipping off its edge, hitting every monster around you and throwing them back.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(12, 22), pct: k(220, 380), hits: 1, targets: k(5, 8),
        combo: [{ move: 'kaguraslam', dur: 1.25, step: 0, strikes: [{ at: 0.5, magic: true, pct: k(220, 380), reach: 160, h: 90, around: true, targets: k(5, 8), knock: 170, launch: 150, burst: 'spiritwave', burstAt: 0, burstDur: 0.8, big: true, stop: 0.06, shake: 3, gauge: 6 }] }],
      };
    },
  }),

  // Blessing and Spirit Ward land on the party round her in a dungeon (`grant`: a buff given when
  // the strike lands, see world/melee.js).
  blessing: skill({
    id: 'blessing', name: 'Blessing', job: 'spiritmage', type: 'heal', fx: null, icon: 'blessing', school: 'spirit', party: true,
    desc: 'Ring the bells over your head and open your arms: a column of warm light falls on you and the party around you, healing at once, then a little more every second for a while, and lifting everyone\'s attack and magic while it lasts.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 440, h: 160, around: true };
      return {
        mp: k(20, 40), pct: 0, hits: 0, targets: 0, range,
        combo: [{ move: 'kagurabless', dur: 1.35, step: 0, strikes: [{ at: 0.55, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, heal: kf(0.18, 0.4), healR: 220, burst: 'blessing', burstAt: 0, burstDur: 1, grant: { id: 'blessing', duration: k(8, 14), buff: { regenPct: kf(0.015, 0.035), watk: k(3, 10), matk: k(3, 10) }, range } }] }],
      };
    },
  }),

  spiritward: skill({
    id: 'spiritward', name: 'Spirit Ward', job: 'spiritmage', type: 'buff', fx: null, icon: 'spiritward', school: 'spirit', party: true, maxLevel: 15,
    desc: 'Sweep the open fan once all the way round you: a sphere of light bound with a sacred rope forms round you, and round the party nearby, soaking up damage until it breaks.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 440, h: 160, around: true };
      return {
        mp: k(24, 40), pct: 0, hits: 0, targets: 0, range,
        combo: [{ move: 'kaguraward', dur: 1.2, step: 0, strikes: [{ at: 0.62, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, grant: { id: 'spiritward', duration: k(20, 40), buff: { barrier: kf(0.2, 0.45) }, range } }] }],
      };
    },
  }),

  manamastery: skill({
    id: 'manamastery', name: 'Mana Mastery', job: 'spiritmage', type: 'passive', grows: true, fx: null, icon: 'manamastery',
    desc: 'Steadier spells, more magic attack, and a deeper well of MP.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), matk: lerp(2, 25, lv, m), maxMpPct: lerpf(0.04, 0.2, lv, m) } }),
  }),

  // ---------- Spirit Mage paths (docs/design/spirit-mage-paths.md) ----------
  // The Shrine Maiden (full support, with her kitsune shrine guardian, the doll grown up) and the
  // Onmyoji (damage, with a yokai troupe led by the tengu, the doll fused into him). The Shrine Maiden dances with a gohei
  // in place of the fan, builds Grace (world/melee.js), and her lasting spells live in
  // world/shrine.js.
  shrinemastery: skill({
    id: 'shrinemastery', name: 'Shrine Mastery', job: 'shrinemaiden', type: 'passive', grows: true, fx: null, icon: 'shrinemastery',
    desc: 'The shrine answers you: more magic attack, a deeper well of MP, and every heal you give mends more.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.65, lv, m), matk: lerp(5, 35, lv, m), maxMpPct: lerpf(0.05, 0.25, lv, m), healPower: lerpf(0.05, 0.3, lv, m) } }),
  }),
  grandblessing: skill({
    id: 'grandblessing', name: 'Grand Blessing', job: 'shrinemaiden', type: 'heal', fx: null, icon: 'grandblessing', school: 'spirit', party: true, replaces: 'blessing',
    desc: 'Ring the bells high and sweep the gohei over your head, left and right and left, then open your arms: a great pillar of warm light falls on you and the whole party, healing a lot at once and more every second for a good while, and everyone fights harder while it lasts.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      const range = { w: 640, h: 180, around: true };
      return {
        mp: k(45, 80), pct: 0, hits: 0, targets: 0, range,
        combo: [{ move: 'shrinegrand', dur: 1.55, step: 0, strikes: [{ at: 0.55, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, heal: kf(0.32, 0.55), healR: 320, burst: 'grandblessing', burstAt: 0, burstDur: 1.3, grant: { id: 'grandblessing', duration: k(12, 20), buff: { regenPct: kf(0.03, 0.05), watk: k(8, 18), matk: k(8, 18) }, range } }] }],
      };
    },
  }),
  purification: skill({
    id: 'purification', name: 'Purification', job: 'shrinemaiden', type: 'attack', fx: null, icon: 'purification', school: 'spirit',
    desc: 'Sweep the gohei in a long low arc across the ground and drive the bell staff down: a circle of sacred light opens round you for a while. Monsters standing in it burn, again and again; allies in it are mended.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(30, 55), pct: k(60, 110), hits: 1, targets: 0,
        combo: [{ move: 'shrinepurify', dur: 1.3, step: 0, strikes: [{ at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, purify: { r: k(120, 170), dur: k(6, 10), every: 0.5, pct: k(60, 110), heal: kf(0.01, 0.025) } }] }],
      };
    },
  }),
  resurrection: skill({
    id: 'resurrection', name: 'Resurrection Dance', job: 'shrinemaiden', type: 'heal', fx: null, icon: 'resurrection', school: 'spirit', party: true, maxLevel: 10,
    desc: 'A long, slow dance: kneel, rise turning the gohei over your head three times as the bells ring, and lift your arms to the sky. Every fallen ally nearby gets up again, and for a while the shrine won\'t let you fall: a blow that would knock you out leaves you standing instead (Last Rite), once.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(60, 100), pct: 0, hits: 0, targets: 0, range: { w: 640, h: 180, around: true },
        combo: [{ move: 'shrinerevive', dur: 1.8, step: 0, strikes: [{ at: 0.7, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, revive: { r: 320, pct: kf(0.4, 0.7), rite: k(20, 40) } }] }],
      };
    },
  }),
  thousandtorii: skill({
    id: 'thousandtorii', name: 'Thousand Torii', job: 'shrinemaiden', type: 'attack', fx: null, icon: 'thousandtorii', school: 'spirit', maxLevel: 10, fullGauge: true, party: true,
    desc: 'Finisher: needs full Grace, and spends it. Point the gohei ahead and raise it: a corridor of torii gates of light rises across the screen, one after another, mending everyone as each goes up; your guardian vanishes in fox fire and steps out at each gate in turn, cutting down every monster there, and when the last gate stands the whole party is warded.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(40, 60), pct: k(280, 460), hits: 1, targets: 0, range: { w: 640, h: 180, around: true },
        combo: [{ move: 'shrinetorii', dur: 2.2, step: 0, strikes: [{ at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, torii: { n: k(5, 8), span: 440, gap: 0.34, pct: k(280, 460), cut: 75, heal: kf(0.03, 0.06), ward: kf(0.2, 0.4), wardDur: k(10, 16), hold: 0.9 } }] }],
      };
    },
  }),
  onmyodo: skill({
    id: 'onmyodo', name: 'Onmyodo', job: 'onmyoji', type: 'passive', grows: true, fx: null, icon: 'onmyodo',
    desc: 'The way of yin and yang: steadier spells, much more magic attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.65, lv, m), matk: lerp(8, 45, lv, m), acc: lerp(5, 30, lv, m) } }),
  }),
  // The Onmyoji's spells (world/onmyoji.js): she builds Binding (world/melee.js) from her spells
  // and her troupe's blows; full, her troupe fights faster and Troupe Combo is ready.
  ofudabarrage: skill({
    id: 'ofudabarrage', name: 'Ofuda Barrage', job: 'onmyoji', type: 'attack', fx: null, icon: 'ofudabarrage', school: 'spirit',
    desc: 'Snap the fan shut and fling a fan of paper talismans from your fingers: each flies to a monster ahead, sticks fast, and a beat later bursts in a red star seal.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(22, 40), pct: k(90, 170), hits: 2, targets: 0,
        combo: [{ move: 'onmyoofuda', dur: 1.05, step: 0, strikes: [{ at: 0.42, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, ofuda: { n: k(4, 7), pct: k(90, 170), range: 330, stick: 0.38 } }] }],
      };
    },
  }),
  seimanseal: skill({
    id: 'seimanseal', name: 'Seiman Seal', job: 'onmyoji', type: 'attack', fx: null, icon: 'seimanseal', school: 'spirit',
    desc: 'Trace the five-pointed star of onmyodo in the air with the fan, stroke by stroke, and strike its heart: the seal opens on the ground ahead of you for a while. Monsters standing in it are bound fast where they stand and burn again and again.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(35, 60), pct: k(55, 100), hits: 1, targets: 0,
        combo: [{ move: 'onmyoseal', dur: 1.5, step: 0, strikes: [{ at: 0.66, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, seiman: { r: k(90, 130), ahead: 90, dur: k(4, 6), every: 0.5, pct: k(55, 100), bind: 0.6 } }] }],
      };
    },
  }),
  yokairally: skill({
    id: 'yokairally', name: 'Yokai Rally', job: 'onmyoji', type: 'buff', fx: null, icon: 'yokairally', school: 'spirit', maxLevel: 15,
    desc: 'Clap twice and raise a talisman high: your yokai troupe answers. For a while they fight faster and hit harder, and the tengu marks a monster for them at once.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      return {
        mp: k(30, 50), pct: 0, hits: 0, targets: 0,
        combo: [{ move: 'onmyorally', dur: 1.25, step: 0, strikes: [{ at: 0.6, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, rally: { dur: k(16, 30), power: kf(0.4, 0.9) } }] }],
      };
    },
  }),
  troupecombo: skill({
    id: 'troupecombo', dmg: 2.4, name: 'Troupe Combo', job: 'onmyoji', type: 'attack', fx: null, icon: 'troupecombo', school: 'spirit', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Binding, and spends it. Point your fan and call your whole troupe into one chained attack on every monster on the screen: the yuki-onna freezes them all solid, a whirlwind from the tengu lifts them high, the oni leaps up and smashes them back into the ground, and you snap your fan shut and they shatter.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(40, 60), pct: k(120, 210), hits: 1, targets: 0, range: { w: 700, h: 200, around: true },
        combo: [{ move: 'onmyocombo', dur: 4.4, step: 0, strikes: [{ at: 0.05, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, troupe: { pct: k(120, 210), big: k(600, 1000) } }] }],
      };
    },
  }),

  heavenslantern: skill({
    id: 'heavenslantern', name: "Heaven's Lantern", job: 'spiritmage', type: 'attack', fx: null, icon: 'heavenslantern', school: 'spirit', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Spirit, and spends it. Bow low, then lift both arms to the sky: a giant paper lantern rises over the monsters with the Spirit Doll riding on top, cheering. Its rays strike the monsters on the screen again and again, healing you and the party with every one, then it blazes and bursts over everything.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const kf = (a, b) => lerpf(a, b, lv, m);
      // She lifts the lantern; the lantern itself (world/spiritdoll.js) lands the rays, each with the
      // skill's `pct` and `heal`, and `big` for the last blaze.
      return {
        mp: k(30, 50), pct: k(140, 230), big: k(700, 1200), rays: k(8, 12), heal: kf(0.02, 0.04), hits: 2, targets: 12,
        combo: [{ move: 'kaguralantern', dur: 1.8, step: 0, finisher: true, guard: 1.8, strikes: [{ at: 0.48, pct: 0, reach: 0, h: 0, targets: 0, quiet: true, gauge: 0, lantern: true }] }],
      };
    },
  }),

  // ---------- Archer (warm gold and sky blue: gold arrows, a huntress with tricks) ----------
  // Every shot an Archer lands builds Momentum (0-100, see world/melee.js), more for each one in a
  // row; a hit taken knocks half of it away. Full (Hawkeye), arrows fly faster and curve to find
  // monsters. Comet Arrow needs it full and spends it.
  //
  // A simple first job: she fights with her basic shots, and three tricks set themselves off from
  // them (procs, see world/melee.js): Blast Arrow and Snare Arrow from any shot, Spring Trap from
  // her combo's last shot. Her buttons are Vault (getting past them) and Comet Arrow (the big one,
  // on a full gauge). Steady Hands and Light Feet are passives.
  blastarrow: skill({
    id: 'blastarrow', name: 'Blast Arrow', job: 'archer', type: 'passive', fx: null, school: 'hawk',
    desc: 'Your shots sometimes burst on impact, hitting everything close around their target, hit or miss.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.3, lv, m), r: lerp(50, 80, lv, m), pct: lerp(110, 160, lv, m) } }),
  }),
  snarearrow: skill({
    id: 'snarearrow', name: 'Snare Arrow', job: 'archer', type: 'passive', fx: null, school: 'hawk',
    desc: 'Your shots sometimes tangle their target in a net, holding it in place for a few seconds. While it is held, your shots hit it harder.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.3, lv, m), secs: lerpf(2, 3.5, lv, m), bonus: lerpf(0.15, 0.3, lv, m) } }),
  }),
  springtrap: skill({
    id: 'springtrap', name: 'Spring Trap', job: 'archer', type: 'attack', fx: null, school: 'hawk', maxLevel: 10,
    desc: 'Set a spring trap on the ground just ahead. The first monster to step on it is snapped and flung into the air. Up to three traps at once.',
    at: (lv, m) => ({ mp: lerp(8, 14, lv, m), pct: lerp(180, 300, lv, m), life: lerp(12, 20, lv, m), trap: true }),
  }),
  vault: skill({
    id: 'vault', name: 'Vault', job: 'archer', type: 'attack', fx: null, icon: 'vault', maxLevel: 10, school: 'hawk', movement: true,
    desc: 'Spring up and over the monster in front of you, land behind it, and turn to shoot it. Nothing touches you mid-vault.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(110, 180), hits: 1, targets: 1,
        combo: [{ move: 'vault', dur: 0.62, step: k(100, 140), carry: 0.62, guard: 0.6, strikes: [{ at: 0.8, turn: true, shot: 'hawkarrow', pct: k(110, 180), range: 300, h: 70, knock: 160, speed: 900, big: true, stop: 0.05, shake: 1 }] }],
      };
    },
  }),
  steadyhands: skill({
    id: 'steadyhands', name: 'Steady Hands', job: 'archer', type: 'passive', grows: true, fx: null,
    desc: 'Quicker on the draw: you shoot faster and aim truer.',
    at: (lv, m) => ({ passive: { attackSpeed: lerpf(0.03, 0.15, lv, m), acc: lerp(3, 25, lv, m), mastery: lerpf(0.1, 0.35, lv, m) } }),
  }),
  lightfeet: skill({
    id: 'lightfeet', name: 'Light Feet', job: 'archer', type: 'passive', grows: true, fx: null,
    desc: 'Light on your feet: you run faster and dodge more.',
    at: (lv, m) => ({ passive: { speed: lerp(3, 18, lv, m), eva: lerp(3, 25, lv, m) } }),
  }),
  cometarrow: skill({
    id: 'cometarrow', name: 'Comet Arrow', job: 'archer', type: 'attack', fx: null, school: 'hawk', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Momentum, and spends it. Leap high into the air and hang there aiming straight down, then fire a giant flaming arrow that crashes into the ground ahead like a meteor: the ground cracks open, a shockwave races out both ways, and everything nearby is thrown into the air.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 2, targets,
        combo: [{ move: 'comet', dur: 1.5, step: -10, finisher: true, guard: 1.3, strikes: [
          { at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, burst: 'cometfall', burstAt: 0, quiet: true, gauge: 0 },
          { at: 0.62, pct: k(420, 720), reach: 230, h: 170, targets, knock: 220, launch: 460, crack: true, burst: 'cometimpact', burstAt: 0.55, fx: 'hawkhit', big: true, stop: 0.16, shake: 8, gauge: 0 },
          { at: 0.76, pct: k(150, 260), reach: 270, h: 170, targets, knock: 300, burst: 'cometwave', burstAt: 0.55, big: true, stop: 0.05, shake: 3, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Beastmaster (the archer's bow path: green wild arrows, and Snow wolf) ----------
  // She hunts with a companion (world/pets.js): Snow wolf, a small, fed-up wolf girl dragging the
  // Fang of the Wolf Queen, a greatsword that casts moonlight. Her shots that land, and Snow wolf's
  // hits, build Bond (0-100, see world/melee.js), shown as Snow wolf's Patience running out; full
  // (Fed Up), Snow wolf fights on her own, and the finisher spends it. Like the Archer, she fights
  // with her basic shots and her skills set themselves off: Fine, I'll Go and Moonfall from any
  // shot, Lunar Howl from her combo's last shot. Her last skills: Moon Ward and
  // Queen's Awakening. Her buttons are the Archer's Vault, Snack Time and the finisher, Last Straw.
  // (The skill ids are the old animals' names, kept for saves.)
  beastmastery: skill({
    id: 'beastmastery', name: 'Beast Mastery', job: 'beastmaster', type: 'passive', grows: true, fx: null,
    desc: 'Steadier shots, more attack, and sharper aim, and Snow wolf hits harder too.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 25, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  // Changes her basic attack (world/melee.js barrageThrow, STREAMS.beastmaster): `from` to `to`
  // arrows a second over `ramp` seconds of holding; from the Duet on Snow wolf cuts beside her
  // (`wolf`, % a cut); let go and a gale arrow ends it (`finish`, growing over `full` seconds),
  // with Snow wolf's moon crashing down on them at `moon` of its strength.
  wildhunt: skill({
    id: 'wildhunt', name: 'Wild Hunt', job: 'beastmaster', type: 'passive', fx: null, icon: 'wildhunt', school: 'wind', maxLevel: 10,
    desc: 'Her basic attack becomes an endless hunt with Snow wolf: hold attack and green arrows fly faster and faster as she shoots on the move, and you can walk slowly while shooting. Soon Snow wolf joins in, cutting beside her, and at full tilt a gale of leaves wheels round her. Let go and she looses a great gale arrow through the line as Snow wolf brings the moon down on them, stronger the longer you held. Needs a bow.',
    weapons: ['bow'],
    at: (lv, m) => ({ passive: {}, barrage: { unit: 'arrow', pct: 48, from: 5, to: lerpf(9, 11, lv, m), ramp: 2.5, wolf: lerp(140, 240, lv, m), moon: 0.6, finish: [lerp(140, 200, lv, m), lerp(320, 460, lv, m)], full: 3 } }),
  }),
  wolfpounce: skill({
    id: 'wolfpounce', name: "Fine, I'll Go", job: 'beastmaster', type: 'passive', fx: null, school: 'wind',
    desc: 'Your shots sometimes make Snow wolf drag herself over to the nearest monster in front of you, hit or miss, and spin her greatsword round in a full circle of moonlight, cutting everything close.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.14, 0.32, lv, m), pct: lerp(90, 160, lv, m) } }),
  }),
  hawkstrike: skill({
    id: 'hawkstrike', name: 'Moonfall', job: 'beastmaster', type: 'passive', fx: null, school: 'wind',
    desc: 'Your shots sometimes make Snow wolf plant her greatsword with a sigh, hit or miss: a beam of moonlight crashes down on the farthest monster in front of you and throws it into the air.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.14, 0.32, lv, m), pct: lerp(80, 140, lv, m) } }),
  }),
  packhowl: skill({
    id: 'packhowl', name: 'Lunar Howl', job: 'beastmaster', type: 'attack', fx: null, school: 'wind', maxLevel: 10,
    desc: "Call on Snow wolf to howl, wherever she is and whatever she's doing (even mid-hunt): she lets out a grudging howl, a pale moon rising behind her, and every monster close round her is knocked away and stunned.",
    at: (lv, m) => ({ mp: lerp(10, 18, lv, m), pct: lerp(100, 170, lv, m), stun: lerpf(1, 2, lv, m), r: lerp(100, 140, lv, m), howl: true }),
  }),
  loyalguard: skill({
    id: 'loyalguard', name: 'Moon Ward', job: 'beastmaster', type: 'passive', fx: null, school: 'wind', maxLevel: 10,
    desc: 'A hit sometimes never reaches you: Snow wolf plants her greatsword in front of it, a crescent shield of moonlight takes it, and she flicks a crescent back at the attacker.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.25, lv, m), pct: lerp(120, 200, lv, m) } }),
  }),
  snacktime: skill({
    id: 'snacktime', name: 'Snack Time', job: 'beastmaster', type: 'buff', fx: 'buff', school: 'wind', maxLevel: 10,
    desc: "Toss Snow wolf a moon cookie. For a while she's happy: ears up, tail wagging, she keeps up with you instead of waddling, attacks harder and more often, gets through each attack quicker, and her Patience holds instead of fading. When it wears off she slumps right back.",
    at: (lv, m) => ({ mp: lerp(20, 30, lv, m), duration: lerp(15, 30, lv, m), buff: { snackPct: lerpf(1.25, 1.6, lv, m), snackSpeed: lerpf(1.2, 1.45, lv, m) } }),
  }),
  alpha: skill({
    id: 'alpha', name: "Queen's Awakening", job: 'beastmaster', type: 'passive', fx: null, school: 'wind', maxLevel: 10,
    desc: 'While Snow wolf is Fed Up (full Bond), the wolf head on her greatsword wakes: her eyes open, she attacks faster and harder, and every swing also throws a crescent of moonlight at the farthest monster.',
    at: (lv, m) => ({ passive: {}, proc: { pct: lerp(150, 260, lv, m), every: lerpf(1.3, 0.9, lv, m) } }),
  }),
  stampede: skill({
    id: 'stampede', name: 'Last Straw', job: 'beastmaster', type: 'attack', fx: null, school: 'wind', maxLevel: 10, fullGauge: true,
    desc: "Finisher: needs full Bond, and spends it. That's it: Snow wolf snaps. She's beside you in a flash, fuming, eyes blazing; for once she lifts the greatsword in one hand as if it weighed nothing, twirls it, leaps, and brings it down under a great full moon: everything across the whole screen around her is cut and thrown into the air. Then she keels over asleep.",
    weapons: ['bow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      // The Beastmaster raises her bow and gives the signal; Snow wolf acts it out and lands the
      // blow (world/pets.js lastStraw), with the skill's pct.
      return {
        mp: k(30, 50), pct: k(900, 1500), hits: 1, targets,
        combo: [{ move: 'skyshot', dur: 0.9, step: 0, finisher: true, guard: 0.9, strikes: [
          { at: 0.1, pct: 0, reach: 0, h: 0, targets: 0, burst: 'laststraw', burstAt: 0, burstDur: 0.1, quiet: true, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Stormcaller (the archer's crossbow path: electric violet and storm blue) ----------
  // Her bolts that land build Charge (0-100, see world/melee.js), and every monster her lightning
  // jumps to builds it too; it fades once the fighting stops. Full (Supercharged), every bolt
  // chains to one more monster. Like the Archer, she fights with her basic shots and her skills
  // set themselves off (world/storm.js): Arc Bolt and Static Field from any bolt, Thunderclap from
  // her combo's last bolt. Storm Mastery is her passive. Her last skills: Lightning
  // Rod and Eye of the Storm. Her buttons are the Archer's Vault, Overcharge and the finisher,
  // Thunderhead.
  stormmastery: skill({
    id: 'stormmastery', name: 'Storm Mastery', job: 'stormcaller', type: 'passive', grows: true, fx: null,
    desc: 'Steadier bolts, more attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 25, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  arcbolt: skill({
    id: 'arcbolt', name: 'Arc Bolt', job: 'stormcaller', type: 'passive', fx: null, school: 'storm',
    desc: 'Your bolts sometimes crackle with lightning when they hit: it jumps on to the nearest monsters, one after another. While Supercharged, every bolt jumps to one more.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.2, 0.45, lv, m), jumps: lerp(1, 2, lv, m), pct: lerp(50, 80, lv, m) } }),
  }),
  staticfield: skill({
    id: 'staticfield', name: 'Static Field', job: 'stormcaller', type: 'passive', fx: null, school: 'storm',
    desc: 'Your bolts sometimes charge the ground where they hit: for a few seconds it crackles, zapping every monster standing on it twice a second.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.1, 0.25, lv, m), secs: lerpf(2, 3.5, lv, m), r: lerp(50, 70, lv, m), pct: lerp(25, 45, lv, m) } }),
  }),
  thunderclap: skill({
    id: 'thunderclap', name: 'Thunderclap', job: 'stormcaller', type: 'passive', fx: null, school: 'storm',
    desc: 'The last bolt of your combo sometimes calls lightning down from the sky on the farthest monster in front of you, throwing everything close to it into the air and stunning it for a moment. Always, if three or more monsters are in front of you.',
    at: (lv, m) => ({ passive: {}, proc: { chance: lerpf(0.2, 0.6, lv, m), crowd: 3, pct: lerp(120, 200, lv, m), stun: lerpf(0.5, 1, lv, m), r: lerp(50, 70, lv, m) } }),
  }),
  lightningrod: skill({
    id: 'lightningrod', name: 'Lightning Rod', job: 'stormcaller', type: 'passive', fx: null, school: 'storm', maxLevel: 10,
    desc: 'You are charged with the storm: every hit you take is softened, and its shock arcs straight back into the monster that hit you.',
    at: (lv, m) => ({ passive: {}, proc: { cut: lerpf(0.1, 0.25, lv, m), pct: lerp(120, 220, lv, m) } }),
  }),
  eyeofstorm: skill({
    id: 'eyeofstorm', name: 'Eye of the Storm', job: 'stormcaller', type: 'passive', fx: null, school: 'storm', maxLevel: 10,
    desc: 'While you are Supercharged, a storm cloud gathers over your head and keeps dropping lightning on the monsters around you.',
    at: (lv, m) => ({ passive: {}, proc: { every: lerpf(1.1, 0.6, lv, m), pct: lerp(100, 180, lv, m), r: 280 } }),
  }),
  overcharge: skill({
    id: 'overcharge', name: 'Overcharge', job: 'stormcaller', type: 'buff', fx: 'buff', school: 'storm', maxLevel: 10,
    desc: 'Pour the storm into your crossbow: your next few bolts are massive bolts of lightning that tear through every monster in their line, hitting far harder.',
    at: (lv, m) => ({ mp: lerp(20, 30, lv, m), duration: 20, buff: { shots: lerp(3, 6, lv, m), power: lerpf(1.6, 2.2, lv, m) } }),
  }),
  thunderhead: skill({
    id: 'thunderhead', name: 'Thunderhead', job: 'stormcaller', type: 'attack', fx: null, school: 'storm', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Charge, and spends it. Fire a bolt straight up into the sky: the storm breaks over the whole screen, lightning crashes down on the monsters again and again, and then one giant bolt strikes, hitting everything on the screen and throwing it into the air.',
    weapons: ['crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      // She fires the bolt up; the storm itself (world/storm.js) lands the blows, with the skill's
      // `pct` for each strike and `big` for the giant bolt.
      return {
        mp: k(30, 50), pct: k(130, 220), big: k(700, 1200), strikes: k(8, 12), hits: 2, targets: 12,
        combo: [{ move: 'skyshot', dur: 0.9, step: 0, finisher: true, guard: 0.9, strikes: [
          { at: 0.45, pct: 0, reach: 0, h: 0, targets: 0, burst: 'thunderhead', burstAt: 0, burstDur: 0.1, quiet: true, gauge: 0 },
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
        combo: [{ move: 'wdencore', dur: 1.5, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.06, pct: 0, reach: 0, h: 0, targets: 0, burst: 'wdfinale', burstAt: 0, burstDur: 1.3, quiet: true, gauge: 0 },
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
        combo: [{ move: 'bdcarousel', dur: 1.6, step: 0, finisher: true, guard: 1.5, strikes: [
          { at: 0.04, pct: 0, reach: 0, h: 0, targets: 0, burst: 'bdcarousel', burstAt: 0, burstDur: 1.4, quiet: true, gauge: 0 },
          cut(0.2), cut(0.3), cut(0.4), cut(0.5), cut(0.58),
          ...[0, 1, 2, 3, 4, 5].map(ring),
        ] }],
      };
    },
  }),

  // ---------- Kitsune (the thief's gauntlet path: gold and blue fox fire) ----------
  // Stars that land build Tails (0-100, one tail to nine, see world/melee.js), more on monsters
  // already burning; every three tails a fox-fire illusion throws stars beside hers. Nine-Tail
  // Blaze needs all nine and spends them.
  kitsunemastery: skill({
    id: 'kitsunemastery', name: 'Kitsune Mastery', job: 'kitsune', type: 'passive', grows: true, fx: null, icon: 'kitsunemastery',
    desc: 'Steadier stars, more attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 20, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  // Changes her basic attack (world/melee.js barrageThrow): `from` to `to` stars a second over
  // `ramp` seconds of holding. No finisher: letting go just stops.
  foxbarrage: skill({
    id: 'foxbarrage', name: 'Endless Fox-Fire', job: 'kitsune', type: 'passive', fx: null, icon: 'foxbarrage', maxLevel: 10,
    desc: 'Her basic attack becomes an endless barrage: hold attack and fox-fire stars fly hand over hand without stopping, faster the longer you hold, and you can walk slowly while throwing. In the air she hangs a moment and keeps throwing. Let go and she simply stops. Needs a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => ({ passive: {}, barrage: { unit: 'star', pct: 26, from: 5, to: lerpf(10, 12, lv, m), ramp: 2.5 } }),
  }),
  foxfirefan: skill({
    id: 'foxfirefan', name: 'Fox-Fire Fan', job: 'kitsune', type: 'attack', fx: 'star', icon: 'foxfirefan', school: 'fox',
    desc: 'A three-part combo, one part per press: a fan of fox-fire stars, one per monster, another, then a great fox-fire star through the line. Everything they hit burns. Needs a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const n = k(3, 5);
      return {
        mp: k(6, 14), pct: k(80, 130), hits: 1, targets: n,
        combo: [
          { move: 'throw', dur: 0.42, step: -3, strikes: [{ at: 0.5, shot: 'foxstar', fan: n, pct: k(80, 130), range: 290, h: 150, knock: 50, speed: 800 }] },
          { move: 'twirlthrow', dur: 0.46, step: -3, strikes: [{ at: 0.62, shot: 'foxstar', fan: n, pct: k(85, 140), range: 290, h: 150, knock: 60, speed: 800 }] },
          { move: 'throwflip', dur: 0.64, step: -4, finisher: true, strikes: [{ at: 0.25, shot: 'foxmoon', pct: k(170, 280), range: 330, h: 70, targets: k(3, 5), pierce: true, speed: 860, knock: 200, launch: 120, big: true, stop: 0.06, shake: 2, kickback: 40 }] },
        ],
      };
    },
  }),
  foxillusion: skill({
    id: 'foxillusion', name: 'Fox Decoy', job: 'kitsune', type: 'attack', fx: null, icon: 'foxillusion', school: 'fox',
    desc: 'Set a fox-fire illusion of yourself down just ahead. For a few seconds every monster near it goes after it instead of you, and when its time is up it bursts in fox fire on everything close.',
    at: (lv, m) => ({ mp: lerp(16, 26, lv, m), duration: lerpf(5, 9, lv, m), pct: lerp(150, 260, lv, m), targets: lerp(4, 7, lv, m), r: 260, decoy: true }),
  }),
  foxtrap: skill({
    id: 'foxtrap', name: 'Fox-Fire Trap', job: 'kitsune', type: 'attack', fx: 'star', icon: 'foxtrap', school: 'fox',
    desc: 'Throw a ring of fox fire onto the ground ahead: it burns everything standing in it for a moment, then bursts. Needs a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const tick = (delay) => ({ at: 0.5, delay, pct: k(40, 70), reach: 200, h: 70, targets: 6, knock: 5, burn: { pct: 0.1, secs: 2 }, quiet: true, gauge: 2 });
      return {
        mp: k(12, 24), pct: k(160, 260), hits: 5, targets: 6,
        combo: [{ move: 'throw', dur: 0.5, step: -4, strikes: [
          { at: 0.5, pct: 0, reach: 0, h: 0, targets: 0, burst: 'foxtrap', burstAt: 0, burstDur: 1.6, quiet: true, gauge: 0 },
          tick(0.15), tick(0.45), tick(0.75),
          { at: 0.5, delay: 1.05, pct: k(160, 260), reach: 200, h: 80, targets: 6, knock: 160, launch: 140, burn: { pct: 0.12, secs: 3 }, burst: 'foxtrapburst', burstAt: 0.55, big: true, stop: 0.05, shake: 2 },
        ] }],
      };
    },
  }),
  foxhop: skill({
    id: 'foxhop', name: 'Fox Hop', job: 'kitsune', type: 'attack', fx: 'star', icon: 'foxhop', school: 'fox', maxLevel: 10, movement: true,
    desc: 'Spring back out of reach, leaving a decoy of fox fire where you stood that bursts on anything close. Nothing touches you on the way. Works with either weapon.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(80, 140), hits: 1, targets: 4,
        combo: [{ move: 'foxhop', dur: 0.46, step: -k(100, 150), carry: 0.6, guard: 0.45, strikes: [{ at: 0.06, pct: k(80, 140), reach: 60, h: 70, around: true, targets: 4, knock: 120, burn: { pct: 0.1, secs: 2 }, burst: 'foxdecoy', burstAt: 0, gauge: 3 }] }],
      };
    },
  }),
  ninetailblaze: skill({
    id: 'ninetailblaze', dmg: 1.45, name: 'Nine-Tail Blaze', job: 'kitsune', type: 'attack', fx: 'star', icon: 'ninetailblaze', school: 'fox', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs all nine Tails, and spends them. Nine fox-fire stars spin up into the night and rain down burning on every monster, then they gather into a giant fox of blue fire that pounces through the line. Needs a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(440, 760), hits: 16, targets,
        combo: [{ move: 'moonthrow', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.18, pct: 0, reach: 0, h: 0, targets: 0, burst: 'foxnight', burstAt: 0, burstDur: 1.1, quiet: true, gauge: 0 },
          { at: 0.5, rain: k(10, 14), pct: k(80, 130), rainFrom: 30, rainW: 320, span: 0.4, knock: 30, variant: 'foxstar', school: 'fox', burn: { pct: 0.1, secs: 3 }, gauge: 0 },
          { at: 0.8, pct: k(440, 760), reach: 230, h: 150, around: true, targets, knock: 300, launch: 380, burn: { pct: 0.15, secs: 3 }, burst: 'flamefoxpounce', burstAt: 0, burstDur: 0.9, big: true, stop: 0.16, shake: 8, gauge: 0 },
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
  pebble: 'throw', quickstep: 'cheer',
  vault: 'vault', cometarrow: 'comet', springtrap: 'throw', packhowl: 'cheer',
  stampede: 'skyshot', snacktime: 'throw', overcharge: 'steadyaim', thunderhead: 'skyshot',
  bladerush: 'overhead', whirlwind: 'spin', shouldercharge: 'dash', warcry: 'roar', ironguard: 'guard', titanbreak: 'titanbreak',
  aegissmite: 'bash', hallowedground: 'consecrate', divineaegis: 'salute', ravage: 'cleave1', bloodfrenzy: 'warroar', rampage: 'rampage', grandverdict: 'verdict', crimsoneclipse: 'eclipse',
  pirouette: 'wdchaine', grandfinale: 'wdencore',
  spiritbolt: 'kagura', spiritstep: 'spiritstep', spiritwave: 'kaguraslam', blessing: 'kagurabless', spiritward: 'kaguraward', heavenslantern: 'kaguralantern',
  grandblessing: 'shrinegrand', purification: 'shrinepurify', resurrection: 'shrinerevive', thousandtorii: 'shrinetorii',
  ofudabarrage: 'onmyoofuda', seimanseal: 'onmyoseal', yokairally: 'onmyorally', troupecombo: 'onmyocombo',
  goldencarousel: 'bdcarousel',
  kitsunemastery: 'cheer', foxfirefan: 'throw', foxillusion: 'cheer', foxtrap: 'throw', foxhop: 'foxhop', ninetailblaze: 'moonthrow',
  gmsmite: 'castup', gmhaste: 'cheer',
};
for (const [id, move] of Object.entries(MOVES_BY_SKILL)) SKILLS[id].anim = move;

// Numbers for `skillId` at `level`, with the skill's max level passed through for scaling.
export function skillAt(skillId, level) {
  const s = SKILLS[skillId];
  return { ...s.at(level, s.maxLevel), lock: s.lock };
}

