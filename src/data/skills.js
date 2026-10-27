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
//
// Range: `w`/`h` is the hit box in front of the player. `projectile` skills hit the nearest
// targets within range and draw a flying shot. `stun` (seconds) also stops monsters, with stars
// instead of ice; `bleed` works like poison, in red. `hitFx` is an extra effect on each monster hit,
// and `ultimate` marks a screen-wide ultimate. `freeze` (seconds) stops monsters it hits;
// `poison` ({ pct, secs }) makes them take pct of the hit again every second for secs.
// `school` (steel, hawk, shadow, crow, night, bloom, arcane, ice, lightning, fire, poison, holy, rage, wind, focus) colors the casting circle.

const lerp = (a, b, lv, max) => Math.round(a + ((b - a) * (lv - 1)) / Math.max(1, max - 1));
const lerpf = (a, b, lv, max) => a + ((b - a) * (lv - 1)) / Math.max(1, max - 1);

// `lock` is a short delay after using a skill that plants you in place (no moving, jumping, or other attacks), for big wind-ups.
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
  cozyrest: skill({
    id: 'cozyrest', name: 'Cozy Rest', job: 'novice', type: 'passive', maxLevel: 3, fx: null,
    desc: 'Recover extra HP and MP while standing still.',
    at: (lv) => ({ passive: { restRegen: lv * 4 } }),
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
  bladerush: skill({
    id: 'bladerush', name: 'Blade Rush', job: 'warrior', type: 'attack', fx: 'slash', school: 'steel',
    desc: 'A three-part combo, one part per press: a quick cross-cut, a rising launcher that throws them into the air, and a leaping slam that cracks the ground.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(3, 5);
      return {
        mp: k(4, 10), pct: k(90, 150), hits: 4, targets,
        combo: [
          { move: 'cross', dur: 0.5, step: 10, strikes: [
            { at: 0.22, pct: k(90, 150), reach: 76, h: 60, targets, knock: 40, arc: [-115, 205], thick: 9 },
            { at: 0.72, pct: k(90, 150), reach: 76, h: 62, targets, knock: 60, arc: [100, -215], thick: 9 },
          ] },
          { move: 'rising', dur: 0.46, step: 8, strikes: [{ at: 0.4, pct: k(130, 220), reach: 80, h: 84, targets, knock: 50, launch: 430, arc: [80, -175], thick: 11, big: true, stop: 0.06 }] },
          { move: 'plunge', dur: 0.62, step: 18, finisher: true, strikes: [{ at: 0.56, pct: k(200, 340), reach: 92, h: 84, around: true, targets: targets + 2, knock: 230, crack: true, big: true, stop: 0.11, shake: 5 }] },
        ],
      };
    },
  }),
  whirlwind: skill({
    id: 'whirlwind', name: 'Whirlwind', job: 'warrior', type: 'attack', fx: 'spin', school: 'steel',
    desc: 'Spin into a whirlwind that carries you forward, hitting everything around you five times and sucking monsters in, then flinging them away. Builds Valor fast in a crowd.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(4, 8);
      const hit = (at, i) => ({ at, pct: k(40, 72), reach: 80, h: 76, around: true, targets, pull: 70, arc: [i % 2 ? 180 : 0, 300], thick: 10, stop: 0.02, gauge: 2 });
      return {
        mp: k(10, 24), pct: k(40, 72), hits: 5, targets,
        combo: [{ move: 'spin', dur: 0.9, step: 36, carry: 0.75, finisher: true, strikes: [
          ...[0.15, 0.3, 0.45, 0.6].map(hit),
          { ...hit(0.75, 4), pull: 0, knock: 240, launch: 220, big: true, stop: 0.07, shake: 3, gauge: 4 },
        ] }],
      };
    },
  }),
  shouldercharge: skill({
    id: 'shouldercharge', name: 'Shoulder Charge', job: 'warrior', type: 'attack', fx: 'charge', icon: 'charge', maxLevel: 10, school: 'steel', movement: true,
    desc: 'Barrel forward shoulder-first, bowling over every monster in your path and tossing them aside. Nothing touches you on the way.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const hit = (at) => ({ at, pct: k(90, 160), reach: 46, h: 64, around: true, targets: 4, knock: 300, launch: 180 });
      return {
        mp: k(10, 6), pct: k(90, 160), hits: 2, targets: 4,
        combo: [{ move: 'dash', dur: 0.42, step: k(80, 140), carry: 0.7, guard: 0.45, trail: true, strikes: [hit(0.25), { ...hit(0.6), big: true, stop: 0.06, shake: 2 }] }],
      };
    },
  }),
  warcry: skill({
    id: 'warcry', name: 'War Cry', job: 'warrior', type: 'buff', fx: 'buff', icon: 'warcry', school: 'steel', party: true,
    desc: 'A great shout: every monster around you turns on you, and you and the party around you take less damage for a while.',
    at: (lv, m) => ({ mp: lerp(10, 22, lv, m), duration: lerp(20, 45, lv, m), taunt: lerpf(2, 4, lv, m), buff: { dmgCut: lerpf(0.06, 0.18, lv, m) }, range: { w: lerp(320, 480, lv, m), h: 160, around: true } }),
  }),
  ironguard: skill({
    id: 'ironguard', name: 'Iron Guard', job: 'warrior', type: 'buff', fx: 'shield', icon: 'ironguard', school: 'steel',
    desc: 'Plant your feet behind your guard: much less damage from every hit and harder armor for a while.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(12, 30, lv, m), buff: { dmgCut: lerpf(0.15, 0.4, lv, m), wdef: lerp(10, 50, lv, m) } }),
  }),
  swordmastery: skill({
    id: 'swordmastery', name: 'Weapon Mastery', job: 'warrior', type: 'passive', fx: null, icon: 'swordmastery',
    desc: 'Steadier blows and more attack with every blade.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), watk: lerp(2, 20, lv, m) } }),
  }),
  toughness: skill({
    id: 'toughness', name: 'Toughness', job: 'warrior', type: 'passive', fx: null, icon: 'toughness',
    desc: 'Tougher all around: more max HP, weapon defense, and HP recovery.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.03, 0.2, lv, m), wdef: lerp(3, 30, lv, m), restRegen: lerp(2, 20, lv, m) } }),
  }),
  titanbreak: skill({
    id: 'titanbreak', name: 'Titan Breaker', job: 'warrior', type: 'attack', fx: 'quake', icon: 'titanbreak', school: 'steel', maxLevel: 10, fullGauge: true,
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
  paladinmastery: skill({
    id: 'paladinmastery', name: 'Paladin Mastery', job: 'paladin', type: 'passive', fx: null,
    desc: 'Steadier blows, thicker armor, and more max HP.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), wdef: lerp(5, 40, lv, m), maxHpPct: lerpf(0.02, 0.15, lv, m) } }),
  }),
  aegissmite: skill({
    id: 'aegissmite', name: 'Aegis Smite', job: 'paladin', type: 'attack', fx: 'slash', school: 'holy',
    desc: 'A three-part combo, one part per press: a shove behind a shield of light that stuns, a rising cut that throws them up, then an overhead smite that calls pillars of light down on them.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(3, 5);
      return {
        mp: k(6, 14), pct: k(110, 180), hits: 3, targets,
        combo: [
          { move: 'bash', dur: 0.48, step: 14, strikes: [{ at: 0.42, pct: k(110, 180), reach: 70, h: 64, targets, knock: 120, stun: lerpf(1, 2, lv, m), burst: 'aegis', stop: 0.05, rage: 0 }] },
          { move: 'ascend', dur: 0.5, step: 8, strikes: [{ at: 0.45, pct: k(120, 200), reach: 80, h: 84, targets, knock: 40, launch: 380, arc: [100, -215], thick: 10, big: true, stop: 0.06 }] },
          { move: 'smite', dur: 0.74, step: 12, finisher: true, strikes: [{ at: 0.43, pct: k(220, 380), reach: 100, h: 82, targets: targets + 2, knock: 200, arc: [-95, 185], thick: 13, big: true, fx: 'pillar', stop: 0.1, shake: 4 }] },
        ],
      };
    },
  }),
  hallowedground: skill({
    id: 'hallowedground', name: 'Hallowed Ground', job: 'paladin', type: 'attack', fx: 'quake', icon: 'hallowed', school: 'holy',
    desc: 'Drive your blade into the ground: a ring of holy light bursts out, every monster it hits turns on you, and pillars of light lift them up.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(5, 8);
      return {
        mp: k(14, 30), pct: k(100, 170), hits: 2, targets,
        combo: [{ move: 'consecrate', dur: 0.9, step: 4, finisher: true, strikes: [
          { at: 0.46, pct: k(100, 170), reach: 120, h: 90, around: true, targets, knock: 60, provoke: lerpf(3, 5, lv, m), burst: 'consecrate', burstAt: 0, big: true, stop: 0.08, shake: 3 },
          { at: 0.8, pct: k(80, 140), reach: 130, h: 90, around: true, targets, knock: 30, launch: 220, fx: 'pillar', stop: 0.04 },
        ] }],
      };
    },
  }),
  divineaegis: skill({
    id: 'divineaegis', name: 'Divine Aegis', job: 'paladin', type: 'buff', fx: 'shield', icon: 'aegis', school: 'holy', party: true, lock: 0.45,
    desc: 'Raise your blade to the sky: you and the party around you take less damage and slowly heal for a while.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), duration: lerp(20, 40, lv, m), buff: { dmgCut: lerpf(0.1, 0.25, lv, m), regenPct: lerpf(0.01, 0.025, lv, m) }, range: { w: 440, h: 160, around: true } }),
  }),

  grandverdict: skill({
    id: 'grandverdict', name: 'Grand Verdict', job: 'paladin', type: 'attack', fx: 'judgment', icon: 'verdict', school: 'holy', maxLevel: 10, fullGauge: true,
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
  // fight. `rageCost` is the least Rage a skill needs; Rampage spends all of it.
// Finishers (`fullGauge`) need the path's own gauge full (Rage, Faith, Gale or Focus) and spend
// all of it (see world/combat.js).
  berserkermastery: skill({
    id: 'berserkermastery', name: 'Berserker Mastery', job: 'berserker', type: 'passive', fx: null,
    desc: 'Steadier blows, more attack, and harder critical hits.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(3, 30, lv, m), critDamage: lerpf(0.05, 0.25, lv, m) } }),
  }),
  ravage: skill({
    id: 'ravage', name: 'Ravage', job: 'berserker', type: 'attack', fx: 'slash', icon: 'ravage', school: 'rage',
    desc: 'A four-part combo, one part per press: a huge wound-up cleave, a rising return cleave, a low whirl all around you, then a leaping skull-splitter that cracks the ground. Everything before the smash makes them bleed. Builds a lot of Rage.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(2, 4);
      const bleed = { pct: lerpf(0.15, 0.3, lv, m), secs: 4 };
      return {
        mp: k(5, 12), pct: k(85, 140), hits: 4, targets,
        combo: [
          { move: 'cleave1', dur: 0.5, step: 10, strikes: [{ at: 0.4, pct: k(110, 180), reach: 80, h: 62, targets: targets + 1, knock: 60, bleed, arc: [-150, 230], thick: 12, rage: 7 }] },
          { move: 'cleave2', dur: 0.5, step: 8, strikes: [{ at: 0.42, pct: k(110, 180), reach: 80, h: 70, targets: targets + 1, knock: 50, launch: 200, bleed, arc: [110, -240], thick: 12, rage: 7 }] },
          { move: 'gyre', dur: 0.55, step: 16, strikes: [{ at: 0.5, pct: k(110, 180), reach: 80, h: 56, around: true, targets: targets + 2, knock: 90, bleed, arc: [0, 330], thick: 11, big: true, stop: 0.05, rage: 8 }] },
          { move: 'reaver', dur: 0.82, step: 16, finisher: true, strikes: [{ at: 0.47, pct: k(260, 420), reach: 98, h: 78, targets: targets + 1, knock: 240, arc: [-110, 200], thick: 15, big: true, crack: true, burst: 'rageburst', stop: 0.1, shake: 5, rage: 12 }] },
        ],
      };
    },
  }),
  bloodfrenzy: skill({
    id: 'bloodfrenzy', name: 'Blood Frenzy', job: 'berserker', type: 'buff', fx: 'buff', icon: 'frenzy', school: 'rage',
    desc: 'Let out a furious roar: more attack, attack speed, and critical hits for a while, and a quarter of your Rage at once.',
    at: (lv, m) => ({ mp: lerp(16, 32, lv, m), duration: lerp(60, 180, lv, m), rageGain: 25, buff: { watk: lerp(5, 35, lv, m), attackSpeed: lerpf(0.05, 0.15, lv, m), critRate: lerpf(0.02, 0.1, lv, m) } }),
  }),
  rampage: skill({
    id: 'rampage', name: 'Rampage', job: 'berserker', type: 'attack', fx: 'quake', icon: 'rampage', school: 'rage', rageCost: 30,
    desc: 'Needs 30 Rage, and spends all of it: three wild cleaves back and forth, then a leaping skull-splitter that smashes the ground around you. The more Rage, the harder it hits (double at full Rage).',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(4, 7);
      const chop = (at, arc) => ({ at, pct: k(110, 190), reach: 82, h: 70, targets, knock: 40, arc, thick: 12, rage: 0 });
      return {
        mp: k(10, 20), pct: k(110, 190), hits: 4, targets, flare: true,
        combo: [{ move: 'rampage', dur: 1.45, step: 30, carry: 0.6, finisher: true, strikes: [
          chop(0.064, [-150, 230]), chop(0.227, [110, -240]), chop(0.384, [-150, 230]),
          { at: 0.724, pct: k(300, 520), reach: 120, h: 92, around: true, targets: targets + 2, knock: 300, launch: 250, crack: true, big: true, burst: 'rageburst', stop: 0.14, shake: 7, rage: 0 },
        ] }],
      };
    },
  }),

  crimsoneclipse: skill({
    id: 'crimsoneclipse', name: 'Crimson Eclipse', job: 'berserker', type: 'attack', fx: 'quake', icon: 'eclipse', school: 'rage', maxLevel: 10, fullGauge: true,
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

  // ---------- Mage (rose pink and mint: flowers, petals and light) ----------
  // Damage and support at once. Spells that land and heals build Bloom (0-100, see world/melee.js);
  // full (Full Bloom), every damage spell also heals allies near where it lands. Garden of Light
  // needs it full and spends it. Spells are timed combo steps like every other attack: `magic`
  // strikes hit with magic attack, and `heal` strikes mend you and the party around you.
  petalbolt: skill({
    id: 'petalbolt', name: 'Petal Bolt', job: 'mage', type: 'attack', fx: 'bolt', icon: 'petalbolt', school: 'bloom',
    desc: 'A three-part combo, one cast per press: a bolt of petals, two more, then a great blossom bolt that bursts through the whole line.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const bolt = (at, pct, oy = 0) => ({ at, shot: 'petalbolt', magic: true, pct, range: 300, h: 60, knock: 25, speed: 620, oy });
      return {
        mp: k(6, 14), pct: k(150, 260), hits: 4, targets: 1,
        combo: [
          { move: 'castforward', dur: 0.42, step: -2, strikes: [bolt(0.5, k(150, 260))] },
          { move: 'castforward', dur: 0.46, step: -2, strikes: [bolt(0.32, k(100, 170), -4), bolt(0.66, k(100, 170), 4)] },
          { move: 'castspin', dur: 0.62, step: -4, finisher: true, strikes: [{ at: 0.55, shot: 'bloombolt', magic: true, pct: k(220, 360), range: 320, h: 70, targets: k(2, 4), pierce: true, speed: 700, knock: 180, launch: 120, big: true, stop: 0.06, shake: 2 }] },
        ],
      };
    },
  }),
  petalstorm: skill({
    id: 'petalstorm', name: 'Petal Storm', job: 'mage', type: 'attack', fx: 'burst', icon: 'petalstorm', school: 'bloom',
    desc: 'Raise a whirling storm of petals over the monsters ahead: it cuts them four times, drawing them together, then flings them away.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(4, 8);
      const cut = (at) => ({ at, magic: true, pct: k(70, 120), reach: 230, h: 120, targets, knock: 0, pull: 40, quiet: true, stop: 0.02 });
      return {
        mp: k(12, 26), pct: k(70, 120), hits: 4, targets,
        combo: [{ move: 'castspin', dur: 1, step: -2, strikes: [
          { ...cut(0.3), burst: 'petalstorm', burstAt: 0.55 }, cut(0.45), cut(0.6),
          { ...cut(0.75), pull: 0, knock: 180, launch: 160, big: true, stop: 0.06, shake: 2 },
        ] }],
      };
    },
  }),
  healingbloom: skill({
    id: 'healingbloom', name: 'Healing Bloom', job: 'mage', type: 'attack', fx: 'heal', icon: 'healingbloom', school: 'bloom',
    desc: 'A flower of light opens at your feet: it heals you and the party around you, and its petals cut the monsters close by.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 30), pct: k(80, 140), hits: 1, targets: 6,
        combo: [{ move: 'pray', dur: 0.7, step: 0, strikes: [{ at: 0.5, magic: true, pct: k(80, 140), reach: 130, h: 120, around: true, targets: 6, knock: 60, heal: lerpf(0.15, 0.35, lv, m), healR: 260, burst: 'healbloom', burstAt: 0, quiet: true }] }],
      };
    },
  }),
  bloombarrier: skill({
    id: 'bloombarrier', name: 'Bloom Barrier', job: 'mage', type: 'buff', fx: 'shield', icon: 'bloombarrier', school: 'bloom', party: true,
    desc: 'Wrap you and the party around you in a bud of petals that soaks up damage until it bursts.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), duration: lerp(15, 30, lv, m), buff: { barrier: lerpf(0.12, 0.35, lv, m) }, range: { w: 440, h: 160, around: true } }),
  }),
  petalblink: skill({
    id: 'petalblink', name: 'Blink', job: 'mage', type: 'attack', fx: 'blink', icon: 'petalblink', maxLevel: 10, school: 'bloom', movement: true,
    desc: 'Scatter into petals and gather again a long way ahead. Nothing touches you on the way.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: 0, hits: 0, targets: 0,
        combo: [{ move: 'vanish', dur: 0.34, step: k(120, 180), carry: 0.3, guard: 0.4, trail: true, strikes: [{ at: 0.3, pct: 0, reach: 0, h: 0, targets: 0, quiet: true }] }],
      };
    },
  }),
  rebloom: skill({
    id: 'rebloom', name: 'Rebloom', job: 'mage', type: 'revive', fx: 'heal', icon: 'rebloom', school: 'bloom', maxLevel: 10, lock: 0.6,
    desc: 'Get a fallen party member nearby back on their feet, even mid-fight.',
    at: (lv, m) => ({ mp: lerp(40, 22, lv, m), healPct: lerpf(0.3, 0.7, lv, m), range: { w: 300, h: 140, around: true } }),
  }),
  spellmastery: skill({
    id: 'spellmastery', name: 'Spell Mastery', job: 'mage', type: 'passive', fx: null, icon: 'spellmastery',
    desc: 'Steadier spells and more magic attack.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.45, lv, m), matk: lerp(2, 20, lv, m) } }),
  }),
  blossomheart: skill({
    id: 'blossomheart', name: 'Blossom Heart', job: 'mage', type: 'passive', fx: null, icon: 'blossomheart',
    desc: 'Sturdier and steadier: more max HP and MP, and faster HP recovery.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.03, 0.15, lv, m), maxMpPct: lerpf(0.03, 0.15, lv, m), restRegen: lerp(2, 20, lv, m) } }),
  }),
  gardenoflight: skill({
    id: 'gardenoflight', name: 'Garden of Light', job: 'mage', type: 'attack', fx: 'heal', icon: 'gardenoflight', school: 'bloom', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Bloom, and spends it. Raise your wand and a garden springs up under the monsters ahead: a giant flower of light blooms and bursts through them, and its petals rain down healing on the party.',
    weapons: ['wand', 'staff'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 3, targets,
        combo: [{ move: 'castup', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.15, pct: 0, reach: 0, h: 0, targets: 0, burst: 'gardenbud', burstAt: 0, quiet: true, gauge: 0 },
          { at: 0.5, magic: true, pct: k(150, 260), reach: 240, h: 150, targets, knock: 40, launch: 200, quiet: true, stop: 0.04, gauge: 0 },
          { at: 0.7, magic: true, pct: k(420, 720), reach: 260, h: 160, targets, knock: 300, launch: 380, burst: 'gardenbloom', burstAt: 0.55, big: true, stop: 0.15, shake: 7, heal: 0.4, healR: 400, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Archer (warm gold and sky blue: a hawk, its feathers, gold arrows) ----------
  // Every shot an Archer lands builds Momentum (0-100, see world/melee.js), more for each one in a
  // row; a hit taken knocks half of it away. Full (Hawkeye), arrows fly faster and curve to find
  // monsters. Falcon Dive needs it full and spends it.
  twinshot: skill({
    id: 'twinshot', name: 'Double Shot', job: 'archer', type: 'attack', fx: 'arrow', icon: 'twinshot', school: 'hawk',
    desc: 'A two-part combo, one part per press: two gold arrows loosed a beat apart, then a hop back and a full draw that sends a heavy pair tearing through the line.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const quick = (at, oy = 0) => ({ at, shot: 'hawkarrow', pct: k(70, 120), range: 310, h: 60, knock: 30, speed: 840, oy });
      const heavy = (at, oy) => ({ at, shot: 'hawkbig', pct: k(110, 190), range: 340, h: 64, targets: k(2, 4), pierce: true, speed: 920, knock: 200, launch: 120, big: true, stop: 0.06, shake: 2, oy });
      return {
        mp: k(5, 11), pct: k(70, 120), hits: 4, targets: 1,
        combo: [
          { move: 'rapid', dur: 0.46, step: -3, strikes: [quick(0.17, -3), quick(0.5, 3)] },
          { move: 'aimshot', dur: 0.66, step: -14, finisher: true, strikes: [heavy(0.68, -4), heavy(0.74, 4)] },
        ],
      };
    },
  }),
  arrowfan: skill({
    id: 'arrowfan', name: 'Arrow Fan', job: 'archer', type: 'attack', fx: 'arrow', icon: 'arrowfan', school: 'hawk',
    desc: 'Loose a fan of five gold arrows at once; each one finds its own monster, and a gust of feathers bursts off the bow.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 22), pct: k(100, 170), hits: 1, targets: 5,
        combo: [{ move: 'draw', dur: 0.62, step: -6, strikes: [{ at: 0.6, shot: 'hawkarrow', fan: 5, pct: k(100, 170), range: 300, h: 150, knock: 90, speed: 800, muzzle: 'feathers' }] }],
      };
    },
  }),
  arrowshower: skill({
    id: 'arrowshower', name: 'Arrow Rain', job: 'archer', type: 'attack', fx: 'rain', icon: 'arrowshower', school: 'hawk',
    desc: 'Shoot a volley into the sky; gold arrows pour down on everything in the area ahead.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(16, 32), pct: k(60, 100), hits: k(8, 14), targets: 6,
        combo: [{ move: 'skyshot', dur: 0.75, step: -4, finisher: true, strikes: [{ at: 0.58, rain: k(8, 14), pct: k(60, 100), rainFrom: 60, rainW: 280, span: 0.7, knock: 20, variant: 'hawkarrow', gauge: 2 }] }],
      };
    },
  }),
  flipshot: skill({
    id: 'flipshot', name: 'Backflip Shot', job: 'archer', type: 'attack', fx: 'blink', icon: 'flipshot', maxLevel: 10, school: 'hawk', movement: true,
    desc: 'Flip backward out of danger in a flurry of feathers, firing a spread of arrows at whatever was on you. Nothing touches you mid-flip.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(70, 120), hits: 3, targets: 3,
        combo: [{ move: 'flip', dur: 0.5, step: -k(80, 140), carry: 0.75, guard: 0.5, strikes: [{ at: 0.42, shot: 'hawkarrow', fan: 3, pct: k(70, 120), range: 300, h: 130, knock: 80, speed: 820, muzzle: 'feathers' }] }],
      };
    },
  }),
  huntersfocus: skill({
    id: 'huntersfocus', name: "Hunter's Focus", job: 'archer', type: 'buff', fx: 'buff', icon: 'huntersfocus', school: 'hawk',
    desc: 'Sharpen your eye like a hunting hawk: more accuracy and critical hits for a while.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { acc: lerp(5, 30, lv, m), critRate: lerpf(0.03, 0.15, lv, m) } }),
  }),
  bowmastery: skill({
    id: 'bowmastery', name: 'Archery Mastery', job: 'archer', type: 'passive', fx: null, icon: 'bowmastery',
    desc: 'Steadier shots and sharper aim with bows and crossbows.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  eagleeye: skill({
    id: 'eagleeye', name: 'Eagle Eye', job: 'archer', type: 'passive', fx: null, icon: 'eagleeye',
    desc: 'Permanently raises critical rate and critical damage.',
    at: (lv, m) => ({ passive: { critRate: lerpf(0.01, 0.15, lv, m), critDamage: lerpf(0.05, 0.3, lv, m) } }),
  }),
  falcondive: skill({
    id: 'falcondive', name: 'Falcon Dive', job: 'archer', type: 'attack', fx: 'arrow', icon: 'falcondive', school: 'hawk', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Momentum, and spends it. Raise your bow to the sky and call down a great golden falcon of light, then loose it: it dives through the whole line, and a storm of feathers follows in its wake.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 2, targets,
        combo: [{ move: 'falcondive', dur: 1.6, step: 0, finisher: true, guard: 1.3, strikes: [
          { at: 0.12, pct: 0, reach: 0, h: 0, targets: 0, burst: 'falconcall', burstAt: 0, quiet: true, gauge: 0 },
          { at: 0.63, shot: 'falcon', pct: k(420, 720), range: 600, h: 150, targets, pierce: true, speed: 1000, oy: -60, knock: 320, launch: 260, big: true, stop: 0.16, shake: 7, muzzle: 'falconloose', burst: 'falconhit', gauge: 0 },
          { at: 0.74, shot: 'featherwake', pct: k(150, 260), range: 600, h: 150, targets, pierce: true, speed: 900, knock: 180, big: true, stop: 0.05, shake: 3, burst: 'hawkhit', gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Ranger (the archer's bow path: wind, speed, leaps and storms of arrows) ----------
  // Every arrow a Ranger lands builds Gale (0-100, see world/melee.js): the fuller it is the
  // quicker she shoots, and full, every basic shot looses a twin. `aimGain` adds to it at once.
  rangermastery: skill({
    id: 'rangermastery', name: 'Ranger Mastery', job: 'ranger', type: 'passive', fx: null,
    desc: 'Steadier shots, more attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 25, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  galevolley: skill({
    id: 'galevolley', name: 'Gale Volley', job: 'ranger', type: 'attack', fx: 'arrow', icon: 'galevolley', school: 'wind',
    desc: 'A three-part combo, one part per press: twirl and loose two wind arrows, leap and fan three down on them, then a gale arrow that tears through the whole line and blows them away.',
    weapons: ['bow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const wind = (at, pct, knock = 25) => ({ at, shot: 'windarrow', pct, range: 310, h: 60, knock, speed: 900 });
      return {
        mp: k(6, 13), pct: k(80, 135), hits: 6, targets: 1,
        combo: [
          { move: 'spinshot', dur: 0.5, step: 6, strikes: [wind(0.32, k(75, 125)), wind(0.72, k(80, 135), 40)] },
          { move: 'leapshot', dur: 0.6, step: -8, strikes: [{ at: 0.55, shot: 'windarrow', fan: 3, pct: k(80, 130), range: 300, h: 120, knock: 60, launch: 120, speed: 900 }] },
          { move: 'galeshot', dur: 0.72, step: -10, finisher: true, strikes: [{ at: 0.62, shot: 'galearrow', pct: k(200, 330), range: 360, h: 64, targets: k(4, 7), pierce: true, speed: 950, knock: 300, launch: 180, big: true, stop: 0.07, shake: 3, muzzle: 'gust' }] },
        ],
      };
    },
  }),
  cyclonearrow: skill({
    id: 'cyclonearrow', name: 'Cyclone Arrow', job: 'ranger', type: 'attack', fx: 'arrow', icon: 'cyclone', school: 'wind',
    desc: 'Loose an arrow wrapped in a whirlwind. It tears slowly down the line, cutting everything it passes three more times and lifting it off its feet.',
    weapons: ['bow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(14, 28), pct: k(70, 120), hits: 4, targets: k(4, 7),
        combo: [{ move: 'galeshot', dur: 0.7, step: -6, strikes: [{ at: 0.6, shot: 'cyclone', pct: k(70, 120), range: 340, h: 80, targets: k(4, 7), pierce: true, ticks: 3, tickGap: 0.14, speed: 460, knock: 40, launch: 160, big: true, stop: 0.04, shake: 1, muzzle: 'gust' }] }],
      };
    },
  }),
  tailwind: skill({
    id: 'tailwind', name: 'Tailwind', job: 'ranger', type: 'buff', fx: 'buff', icon: 'tailwind', school: 'wind', anim: 'tailwind',
    desc: 'Call the wind to your back: run faster, shoot faster, and dodge more for a while, and half your Gale at once.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(60, 180, lv, m), aimGain: 50, buff: { speed: lerp(5, 20, lv, m), attackSpeed: lerpf(0.05, 0.15, lv, m), eva: lerp(5, 25, lv, m) } }),
  }),
  stormvolley: skill({
    id: 'stormvolley', name: 'Storm Volley', job: 'ranger', type: 'attack', fx: 'rain', icon: 'stormvolley', school: 'wind', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Gale, and spends it. A gust throws you spinning high into the air, loosing arrows in every direction that pour down all around you, then you dive back down in a burst of storm wind that blows everything away.',
    weapons: ['bow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const pour = (at) => ({ at, rain: k(6, 9), around: true, pct: k(70, 120), rainW: 340, span: 0.32, knock: 20, variant: 'windarrow', gauge: 0 });
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 22, targets,
        combo: [{ move: 'stormvolley', dur: 1.7, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.12, pct: k(50, 90), reach: 120, h: 110, around: true, targets, pull: 70, burst: 'galeburst', burstAt: 0, sky: 1.4, quiet: true, via: 'wind', school: 'wind', stop: 0.02, gauge: 0 },
          pour(0.3), pour(0.42), pour(0.54),
          { at: 0.8, pct: k(420, 720), reach: 175, h: 150, around: true, targets, knock: 320, launch: 380, burst: 'stormburst', burstAt: 0, quiet: true, via: 'wind', school: 'wind', big: true, stop: 0.15, shake: 7, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Sniper (the archer's crossbow path: Focus, heavy bolts, frost and blasts) ----------
  // Bolts that land and standing still build Focus (0-100, see world/melee.js): sharper criticals,
  // and full, the next bolt is a Deadeye.
  snipermastery: skill({
    id: 'snipermastery', name: 'Sniper Mastery', job: 'sniper', type: 'passive', fx: null,
    desc: 'Steadier bolts, harder critical hits, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), critDamage: lerpf(0.05, 0.3, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  marksman: skill({
    id: 'marksman', name: "Marksman's Chain", job: 'sniper', type: 'attack', fx: 'arrow', icon: 'marksman', school: 'focus',
    desc: 'A three-part combo, one part per press: drop to a knee and send a heavy bolt through the line, crank and fire two more, then a ballista bolt that kicks you back and blasts straight through everything in its way.',
    weapons: ['crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(2, 4);
      const bolt = (at, pct, knock = 80) => ({ at, shot: 'heavybolt', pct, range: 340, h: 56, knock, speed: 780, pierce: true, targets });
      return {
        mp: k(6, 13), pct: k(130, 210), hits: 4, targets,
        combo: [
          { move: 'kneelshot', dur: 0.58, step: -2, strikes: [bolt(0.56, k(140, 230), 110)] },
          { move: 'crankshot', dur: 0.64, step: -3, charge: true, strikes: [bolt(0.5, k(90, 150)), bolt(0.8, k(95, 155), 120)] },
          { move: 'ballista', dur: 0.86, step: -6, finisher: true, strikes: [{ at: 0.62, shot: 'ballista', pct: k(260, 430), range: 380, h: 60, targets: targets + 3, pierce: true, speed: 820, knock: 320, launch: 160, kickback: 26, big: true, stop: 0.1, shake: 4, muzzle: 'boltshock' }] },
        ],
      };
    },
  }),
  glacierbolt: skill({
    id: 'glacierbolt', name: 'Glacier Bolt', job: 'sniper', type: 'attack', fx: 'arrow', icon: 'glacier', school: 'ice',
    desc: 'Fire a bolt of ice at the nearest monster. It shatters into a burst of frost that freezes everything close around it solid.',
    weapons: ['crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(4, 7);
      return {
        mp: k(14, 28), pct: k(150, 250), hits: 1, targets,
        combo: [{ move: 'kneelshot', dur: 0.66, step: -4, strikes: [{ at: 0.6, shot: 'frostbolt', pct: k(150, 250), range: 340, h: 60, targets, blast: 80, blastFx: 'frostshard', freeze: lerpf(1.2, 2.4, lv, m), burst: 'frostburst', speed: 720, knock: 60, big: true, stop: 0.06, shake: 2 }] }],
      };
    },
  }),
  steadyaim: skill({
    id: 'steadyaim', name: 'Steady Aim', job: 'sniper', type: 'buff', fx: 'buff', icon: 'steadyaim', school: 'focus', anim: 'steadyaim', lock: 0.4,
    desc: 'Settle your breathing and sight down the bolt: more critical hits, harder critical hits, and sharper aim for a while, and half your Focus at once.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(60, 180, lv, m), aimGain: 50, buff: { critRate: lerpf(0.05, 0.15, lv, m), critDamage: lerpf(0.05, 0.2, lv, m), acc: lerp(5, 30, lv, m) } }),
  }),
  heartseeker: skill({
    id: 'heartseeker', name: 'Heartseeker', job: 'sniper', type: 'attack', fx: 'arrow', icon: 'heartseeker', school: 'focus', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Focus, and spends it. Kneel and take a long, steady aim as a sight locks onto every monster in the line, then one enormous bolt that always crits tears through all of them, and its shockwave follows.',
    weapons: ['crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(480, 820), hits: 2, targets,
        combo: [{ move: 'heartseeker', dur: 1.7, step: 0, finisher: true, guard: 1.4, mark: true, strikes: [
          { at: 0.6, shot: 'heartbolt', pct: k(480, 820), range: 560, h: 76, targets, pierce: true, crit: true, speed: 950, knock: 340, launch: 220, kickback: 40, big: true, stop: 0.16, shake: 8, muzzle: 'heartshock', gauge: 0 },
          { at: 0.74, shot: 'wave', pct: k(150, 260), range: 560, h: 90, targets, pierce: true, speed: 900, knock: 200, big: true, stop: 0.05, shake: 3, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Thief (violet and midnight with moonlight silver: crescent moons and smoke) ----------
  // Every Thief shares Shadow (0-100, see world/melee.js): hits landing in quick chains build it,
  // and full (Phantom) a shadow copy repeats every attack. The rest of the book is a choice: dagger
  // skills or gauntlet skills (the two paths of the 2nd job), each with its own finisher that
  // needs full Shadow and spends it.
  shadowdash: skill({
    id: 'shadowdash', name: 'Shadow Step', job: 'thief', type: 'attack', fx: 'blink', icon: 'shadowdash', maxLevel: 10, school: 'shadow', movement: true,
    desc: 'Melt into smoke and dart a long way forward through the monsters, cutting each one you pass. Nothing touches you on the way. Works with either weapon.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const hit = (at) => ({ at, pct: k(60, 110), reach: 50, h: 64, around: true, targets: 4, knock: 60, gauge: 2 });
      return {
        mp: k(10, 6), pct: k(60, 110), hits: 2, targets: 4,
        combo: [{ move: 'dashstab', dur: 0.4, step: k(110, 170), carry: 0.6, guard: 0.45, trail: true, strikes: [hit(0.3), hit(0.55)] }],
      };
    },
  }),
  quickhaste: skill({
    id: 'quickhaste', name: 'Haste', job: 'thief', type: 'buff', fx: 'buff', icon: 'quickhaste', school: 'shadow', party: true,
    desc: 'You and the party around you run faster and jump higher.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { speed: lerp(8, 30, lv, m), jump: lerp(4, 18, lv, m) }, range: { w: 440, h: 160, around: true } }),
  }),
  nimblefeet: skill({
    id: 'nimblefeet', name: 'Nimble', job: 'thief', type: 'passive', fx: null, icon: 'nimblefeet',
    desc: 'Permanently raises avoid and accuracy.',
    at: (lv, m) => ({ passive: { eva: lerp(3, 30, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  // The dagger skills (up close).
  twinfang: skill({
    id: 'twinfang', name: 'Twin Fang', job: 'thief', type: 'attack', fx: 'flurry', icon: 'twinfang', school: 'shadow',
    desc: 'A three-part combo, one part per press: a quick stab, a second stab, then a cross-slash that throws them back. Needs a dagger.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const stab = (at, pct) => ({ at, pct, reach: 66, h: 50, targets: 2, knock: 25, pierce: true });
      return {
        mp: k(4, 10), pct: k(80, 140), hits: 5, targets: 2,
        combo: [
          { move: 'thrust', dur: 0.3, step: 8, strikes: [stab(0.42, k(80, 140))] },
          { move: 'flurry', dur: 0.36, step: 8, strikes: [stab(0.3, k(60, 100)), stab(0.7, k(60, 100))] },
          { move: 'cross', dur: 0.48, step: 12, finisher: true, strikes: [
            { at: 0.22, pct: k(90, 150), reach: 70, h: 58, targets: 3, knock: 50, arc: [-110, 200], thick: 7 },
            { at: 0.72, pct: k(130, 210), reach: 72, h: 60, targets: 3, knock: 200, launch: 160, arc: [100, -210], thick: 8, big: true, stop: 0.07, shake: 2 },
          ] },
        ],
      };
    },
  }),
  backstab: skill({
    id: 'backstab', name: 'Backstab', job: 'thief', type: 'attack', fx: 'flurry', icon: 'backstab', school: 'shadow',
    desc: "Slip through the monster in front of you in a puff of smoke, turn, and stab it in the back. Hits much harder on a monster that isn't facing you. Needs a dagger.",
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(8, 16), pct: k(180, 300), hits: 1, targets: 2,
        combo: [{ move: 'backstab', dur: 0.56, step: 90, carry: 0.35, guard: 0.35, trail: true, strikes: [{ at: 0.62, pct: k(180, 300), reach: 70, h: 56, targets: 2, turn: true, backstab: 1.6, knock: 160, pierce: true, big: true, stop: 0.08, shake: 2 }] }],
      };
    },
  }),
  daggermastery: skill({
    id: 'daggermastery', name: 'Dagger Mastery', job: 'thief', type: 'passive', fx: null, icon: 'daggermastery',
    desc: 'Steadier, stronger dagger hits and more critical hits with a dagger.',
    weapons: ['dagger'],
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), watk: lerp(2, 18, lv, m) } }),
  }),
  moonlitassassin: skill({
    id: 'moonlitassassin', name: 'Moonlit Assassination', job: 'thief', type: 'attack', fx: 'flurry', icon: 'moonlitassassin', school: 'shadow', maxLevel: 10, fullGauge: true,
    desc: 'Dagger finisher: needs full Shadow, and spends it. Night falls; you vanish and blink from monster to monster cutting each one, then a giant crescent moon cuts through the whole line.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const cut = (at) => ({ at, pct: k(70, 120), reach: 200, h: 140, around: true, targets, knock: 20, fx: 'moonslash', quiet: true, stop: 0.03, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 6, targets,
        combo: [{ move: 'assassinate', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.08, pct: 0, reach: 0, h: 0, targets: 0, burst: 'nightfall', burstAt: 0, quiet: true, gauge: 0 },
          cut(0.3), cut(0.38), cut(0.46), cut(0.54),
          { at: 0.74, pct: k(420, 720), reach: 220, h: 150, around: true, targets, knock: 280, launch: 360, burst: 'crescentcut', burstAt: 0.35, big: true, stop: 0.15, shake: 7, gauge: 0 },
        ] }],
      };
    },
  }),
  // The gauntlet skills (throwing stars from range).
  luckyseven: skill({
    id: 'luckyseven', name: 'Lucky Seven', job: 'thief', type: 'attack', fx: 'star', icon: 'luckyseven', school: 'shadow',
    desc: 'A three-part combo, one part per press: two stars, two more, then one big spinning star that tears through the line. Needs a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const star = (at, oy = 0) => ({ at, shot: 'star', pct: k(60, 105), range: 290, h: 60, knock: 25, speed: 760, oy });
      return {
        mp: k(4, 10), pct: k(60, 105), hits: 5, targets: 1,
        combo: [
          { move: 'barrage', dur: 0.4, step: -2, strikes: [star(0.17, -3), star(0.5, 3)] },
          { move: 'barrage', dur: 0.4, step: -3, strikes: [star(0.17, 3), star(0.5, -3)] },
          { move: 'throw', dur: 0.5, step: -6, finisher: true, strikes: [{ at: 0.5, shot: 'moonstar', pct: k(160, 260), range: 330, h: 64, targets: k(2, 4), pierce: true, speed: 820, knock: 200, launch: 120, big: true, stop: 0.06, shake: 2 }] },
        ],
      };
    },
  }),
  starfan: skill({
    id: 'starfan', name: 'Star Fan', job: 'thief', type: 'attack', fx: 'star', icon: 'starfan', school: 'shadow',
    desc: 'Fling a fan of stars at once; each one finds its own monster. Needs a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const n = k(3, 5);
      return {
        mp: k(10, 20), pct: k(90, 150), hits: 1, targets: n,
        combo: [{ move: 'throw', dur: 0.5, step: -4, strikes: [{ at: 0.5, shot: 'star', fan: n, pct: k(90, 150), range: 290, h: 150, knock: 80, speed: 760, muzzle: 'smokepuff' }] }],
      };
    },
  }),
  gauntletmastery: skill({
    id: 'gauntletmastery', name: 'Gauntlet Mastery', job: 'thief', type: 'passive', fx: null, icon: 'gauntletmastery',
    desc: 'Steadier, stronger stars and sharper aim with a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => ({ passive: { mastery: lerpf(0.1, 0.4, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  fullmoonvolley: skill({
    id: 'fullmoonvolley', name: 'Full Moon Volley', job: 'thief', type: 'attack', fx: 'star', icon: 'fullmoonvolley', school: 'shadow', maxLevel: 10, fullGauge: true,
    desc: 'Gauntlet finisher: needs full Shadow, and spends it. Hurl a spinning storm of stars up that gathers into a full moon over the monsters, then it bursts and rains stars down on all of them, and a giant crescent moon cuts the line.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(420, 720), hits: 16, targets,
        combo: [{ move: 'moonthrow', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.18, pct: 0, reach: 0, h: 0, targets: 0, burst: 'fullmoon', burstAt: 0, quiet: true, gauge: 0 },
          { at: 0.5, rain: k(10, 14), pct: k(80, 130), rainFrom: 30, rainW: 320, span: 0.4, knock: 30, variant: 'moonstar', school: 'shadow', gauge: 0 },
          { at: 0.78, pct: k(420, 720), reach: 220, h: 150, around: true, targets, knock: 280, launch: 360, burst: 'crescentcut', burstAt: 0.6, big: true, stop: 0.15, shake: 7, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Assassin (the thief's dagger path: black, crimson and silver; crows and a blood moon) ----------
  // Hits from behind and critical hits build Killing Intent (0-100, see world/melee.js); full
  // (Execution), the first cut on each monster is sure to crit and a weakened monster dies in one
  // blow. Blood Moon Requiem needs it full and spends it.
  assassinmastery: skill({
    id: 'assassinmastery', name: 'Assassin Mastery', job: 'assassin', type: 'passive', fx: null, icon: 'assassinmastery',
    desc: 'Steadier dagger cuts, and harder, more frequent critical hits.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), critRate: lerpf(0.02, 0.15, lv, m), critDamage: lerpf(0.05, 0.3, lv, m) } }),
  }),
  crowcombo: skill({
    id: 'crowcombo', name: 'Crow Combo', job: 'assassin', type: 'attack', fx: 'flurry', icon: 'crowcombo', school: 'crow',
    desc: 'A four-part combo, one part per press: a stab, a slash, the return slash, then a leaping X-cut that scatters crows.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(3, 5);
      return {
        mp: k(5, 12), pct: k(100, 170), hits: 5, targets,
        combo: [
          { move: 'thrust', dur: 0.28, step: 10, strikes: [{ at: 0.42, pct: k(100, 170), reach: 70, h: 50, targets, knock: 30, pierce: true }] },
          { move: 'slash', dur: 0.3, step: 8, strikes: [{ at: 0.45, pct: k(100, 170), reach: 70, h: 56, targets, knock: 35, arc: [-110, 200], thick: 6 }] },
          { move: 'slash2', dur: 0.3, step: 8, strikes: [{ at: 0.45, pct: k(110, 180), reach: 70, h: 58, targets, knock: 35, launch: 140, arc: [100, -210], thick: 6 }] },
          { move: 'cross', dur: 0.5, step: 16, finisher: true, strikes: [
            { at: 0.22, pct: k(120, 200), reach: 78, h: 62, targets, knock: 60, arc: [-110, 200], thick: 8 },
            { at: 0.72, pct: k(170, 280), reach: 80, h: 64, targets, knock: 220, launch: 200, arc: [100, -210], thick: 9, big: true, burst: 'crowburst', burstAt: 0.6, stop: 0.08, shake: 3 },
          ] },
        ],
      };
    },
  }),
  markdeath: skill({
    id: 'markdeath', name: 'Mark for Death', job: 'assassin', type: 'attack', fx: 'flurry', icon: 'markdeath', school: 'crow',
    desc: 'Flick a crow feather at the nearest monster and mark it: for a while every hit on it lands harder and builds Killing Intent twice as fast.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(8, 14), pct: k(80, 140), hits: 1, targets: 1,
        combo: [{ move: 'throw', dur: 0.42, step: -2, strikes: [{ at: 0.5, pct: k(80, 140), reach: 280, h: 70, targets: 1, knock: 20, mark: lerpf(8, 16, lv, m), markPower: lerpf(0.15, 0.3, lv, m), fx: 'deathmark' }] }],
      };
    },
  }),
  vanish: skill({
    id: 'vanish', name: 'Vanish', job: 'assassin', type: 'buff', fx: 'buff', icon: 'vanish', school: 'crow', maxLevel: 10,
    desc: 'Melt into the dark: monsters lose track of you and you dodge far more often, and your first cut out of it is a sure backstab.',
    at: (lv, m) => ({ mp: lerp(14, 8, lv, m), duration: lerpf(3, 6, lv, m), buff: { eva: lerp(40, 120, lv, m) } }),
  }),
  poisonblade: skill({
    id: 'poisonblade', name: 'Poisoned Blade', job: 'assassin', type: 'buff', fx: 'buff', icon: 'poisonblade', school: 'crow',
    desc: 'Coat your dagger in nightshade: every cut makes them bleed for a while.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { venom: lerpf(0.06, 0.18, lv, m) } }),
  }),
  bloodmoonrequiem: skill({
    id: 'bloodmoonrequiem', name: 'Blood Moon Requiem', job: 'assassin', type: 'attack', fx: 'flurry', icon: 'bloodmoonrequiem', school: 'crow', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Killing Intent, and spends it. The moon turns red and crows burst across the sky; you appear behind each monster in turn and cut it down, then a crimson crescent tears through them all.',
    weapons: ['dagger'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const cut = (at) => ({ at, pct: k(90, 150), reach: 220, h: 150, around: true, targets, knock: 30, fx: 'crowcut', quiet: true, crit: true, stop: 0.03, gauge: 0 });
      return {
        mp: k(30, 50), pct: k(460, 780), hits: 6, targets,
        combo: [{ move: 'assassinate', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.08, pct: 0, reach: 0, h: 0, targets: 0, burst: 'bloodmoonrise', burstAt: 0, quiet: true, gauge: 0 },
          cut(0.3), cut(0.38), cut(0.46), cut(0.54),
          { at: 0.74, pct: k(460, 780), reach: 230, h: 150, around: true, targets, knock: 300, launch: 380, burst: 'redcrescent', burstAt: 0.35, big: true, stop: 0.16, shake: 8, gauge: 0 },
        ] }],
      };
    },
  }),

  // ---------- Night Lord (the thief's gauntlet path: deep indigo and starlight gold; constellations) ----------
  // Stars that land build Starlight (0-100, see world/melee.js), more when they pile onto the same
  // monster; full (Constellation), every star thrown splits into three. Galaxy Fall needs it full
  // and spends it.
  nightlordmastery: skill({
    id: 'nightlordmastery', name: 'Night Lord Mastery', job: 'nightlord', type: 'passive', fx: null, icon: 'nightlordmastery',
    desc: 'Steadier stars, more attack, and sharper aim.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.55, lv, m), watk: lerp(2, 20, lv, m), acc: lerp(3, 25, lv, m) } }),
  }),
  starstorm: skill({
    id: 'starstorm', name: 'Star Storm', job: 'nightlord', type: 'attack', fx: 'star', icon: 'starstorm', school: 'night',
    desc: 'A four-part combo, one part per press: two stars, two more, three in a row, then a fan of stars at everything ahead.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const star = (at, oy = 0) => ({ at, shot: 'star', pct: k(70, 115), range: 300, h: 60, knock: 25, speed: 800, oy });
      return {
        mp: k(5, 12), pct: k(70, 115), hits: 9, targets: 1,
        combo: [
          { move: 'barrage', dur: 0.38, step: -2, strikes: [star(0.17, -3), star(0.5, 3)] },
          { move: 'barrage', dur: 0.38, step: -2, strikes: [star(0.17, 3), star(0.5, -3)] },
          { move: 'barrage', dur: 0.46, step: -3, strikes: [star(0.17), star(0.5, -4), star(0.83, 4)] },
          { move: 'throw', dur: 0.5, step: -8, finisher: true, strikes: [{ at: 0.5, shot: 'nightstar', fan: k(4, 6), pct: k(110, 180), range: 310, h: 150, knock: 120, launch: 100, speed: 820, big: true, stop: 0.05, shake: 2 }] },
        ],
      };
    },
  }),
  giantshuriken: skill({
    id: 'giantshuriken', name: 'Giant Shuriken', job: 'nightlord', type: 'attack', fx: 'star', icon: 'giantshuriken', school: 'night',
    desc: 'Hurl one huge spinning star that cuts through the whole line, then whirls back through them again to your hand.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(12, 24), pct: k(130, 220), hits: 2, targets: k(4, 7),
        combo: [{ move: 'throw', dur: 0.6, step: -6, strikes: [{ at: 0.5, shot: 'giantstar', pct: k(130, 220), range: 320, h: 80, targets: k(4, 7), pierce: true, boomerang: true, speed: 620, knock: 60, big: true, stop: 0.04, shake: 1 }] }],
      };
    },
  }),
  starmark: skill({
    id: 'starmark', name: 'Star Mark', job: 'nightlord', type: 'attack', fx: 'star', icon: 'starmark', school: 'night',
    desc: 'Throw three glowing stars that stick in the monsters they hit and burst a moment later, catching everything close by.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 20), pct: k(60, 100), hits: 2, targets: 3,
        combo: [{ move: 'throw', dur: 0.5, step: -4, strikes: [{ at: 0.5, shot: 'nightstar', fan: 3, pct: k(60, 100), range: 300, h: 140, knock: 20, speed: 760, stick: { delay: 0.9, pct: k(150, 260), r: 60 } }] }],
      };
    },
  }),
  shadowshuriken: skill({
    id: 'shadowshuriken', name: 'Shadow Shuriken', job: 'nightlord', type: 'buff', fx: 'buff', icon: 'shadowshuriken', school: 'night',
    desc: 'For a while, a shadow star flies beside every star you throw, free.',
    at: (lv, m) => ({ mp: lerp(16, 30, lv, m), duration: lerp(30, 90, lv, m), buff: { shadowStar: lerpf(0.3, 0.6, lv, m) } }),
  }),
  galaxyfall: skill({
    id: 'galaxyfall', name: 'Galaxy Fall', job: 'nightlord', type: 'attack', fx: 'star', icon: 'galaxyfall', school: 'night', maxLevel: 10, fullGauge: true,
    desc: 'Finisher: needs full Starlight, and spends it. Fling stars into the sky that join into a giant constellation over the monsters, then it falls on all of them at once and bursts in a ring of starlight.',
    weapons: ['gauntlet'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      return {
        mp: k(30, 50), pct: k(440, 760), hits: 18, targets,
        combo: [{ move: 'moonthrow', dur: 1.6, step: 0, finisher: true, guard: 1.4, strikes: [
          { at: 0.18, pct: 0, reach: 0, h: 0, targets: 0, burst: 'constellation', burstAt: 0, quiet: true, gauge: 0 },
          { at: 0.55, rain: k(12, 16), pct: k(80, 130), rainFrom: 30, rainW: 340, span: 0.35, knock: 30, variant: 'goldstar', school: 'night', gauge: 0 },
          { at: 0.8, pct: k(440, 760), reach: 230, h: 150, around: true, targets, knock: 300, launch: 380, burst: 'galaxyburst', burstAt: 0.6, big: true, stop: 0.16, shake: 8, gauge: 0 },
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
  bladerush: 'overhead', whirlwind: 'spin', shouldercharge: 'dash', warcry: 'roar', ironguard: 'guard', titanbreak: 'titanbreak',
  aegissmite: 'bash', hallowedground: 'consecrate', divineaegis: 'salute', ravage: 'cleave1', bloodfrenzy: 'warroar', rampage: 'rampage', grandverdict: 'verdict', crimsoneclipse: 'eclipse',
  petalbolt: 'castforward', petalstorm: 'castspin', healingbloom: 'pray', bloombarrier: 'castup', petalblink: 'vanish', rebloom: 'pray', gardenoflight: 'castup',
  twinshot: 'rapid', arrowfan: 'draw', huntersfocus: 'cheer', flipshot: 'flip', arrowshower: 'skyshot', falcondive: 'falcondive',
  galevolley: 'spinshot', cyclonearrow: 'galeshot', tailwind: 'tailwind', stormvolley: 'stormvolley', marksman: 'kneelshot', glacierbolt: 'kneelshot', steadyaim: 'steadyaim', heartseeker: 'heartseeker',
  shadowdash: 'dashstab', quickhaste: 'cheer', twinfang: 'thrust', backstab: 'backstab', moonlitassassin: 'assassinate', luckyseven: 'barrage', starfan: 'throw', fullmoonvolley: 'moonthrow',
  crowcombo: 'thrust', markdeath: 'throw', vanish: 'vanish', poisonblade: 'cheer', bloodmoonrequiem: 'assassinate',
  starstorm: 'barrage', giantshuriken: 'throw', starmark: 'throw', shadowshuriken: 'cheer', galaxyfall: 'moonthrow',
  gmsmite: 'castup', gmhaste: 'cheer',
};
for (const [id, move] of Object.entries(MOVES_BY_SKILL)) SKILLS[id].anim = move;

// Numbers for `skillId` at `level`, with the skill's max level passed through for scaling.
export function skillAt(skillId, level) {
  const s = SKILLS[skillId];
  return { ...s.at(level, s.maxLevel), lock: s.lock };
}

export function skillsForJob(jobId) {
  return Object.values(SKILLS).filter((s) => s.job === jobId);
}
