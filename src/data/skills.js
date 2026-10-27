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
//   provoke - every monster in range turns on you (`hold` seconds of sticking to you in a dungeon)
//   hook    - a chain flies forward and drags the monsters it catches (up to `targets`) to you
//   blink   - teleports you `distance` forward
//   buff    - timed bonuses; `buff` keys are added to the player's stats while active. `party`
//             buffs also land on party members in `range` (in a dungeon). `regenPct` heals that
//             share of max HP every second; `barrier` absorbs damage up to that share of max HP;
//             `dmgCut` takes that share off every hit.
//   passive - always-on bonuses once learned
//
// Range: `w`/`h` is the hit box in front of the player. `projectile` skills hit the nearest
// targets within range and draw a flying shot. `stun` (seconds) also stops monsters, with stars
// instead of ice; `bleed` works like poison, in red. `hitFx` is an extra effect on each monster hit,
// and `ultimate` marks a screen-wide ultimate. `freeze` (seconds) stops monsters it hits;
// `poison` ({ pct, secs }) makes them take pct of the hit again every second for secs.
// `school` (arcane, ice, lightning, fire, poison, holy, rage) colors the casting circle.

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

  // ---------- Warrior ----------
  powerslash: skill({
    id: 'powerslash', name: 'Blade Rush', job: 'warrior', type: 'attack', fx: 'slash', school: 'steel',
    desc: 'A three-part combo, one part per press: a quick cross-cut, a rising launcher that throws them into the air, and a leaping dive that cracks the ground.',
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
  whirlstrike: skill({
    id: 'whirlstrike', name: 'Whirlwind', job: 'warrior', type: 'attack', fx: 'spin', school: 'steel',
    desc: 'Spin into a whirlwind that carries you forward, hitting everything around you five times and sucking monsters in, then flinging them away.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(4, 8);
      const hit = (at, i) => ({ at, pct: k(40, 72), reach: 80, h: 76, around: true, targets, pull: 70, arc: [i % 2 ? 180 : 0, 300], thick: 10, stop: 0.02 });
      return {
        mp: k(10, 24), pct: k(40, 72), hits: 5, targets,
        combo: [{ move: 'spin', dur: 0.9, step: 36, carry: 0.75, finisher: true, strikes: [
          ...[0.15, 0.3, 0.45, 0.6].map(hit),
          { ...hit(0.75, 4), pull: 0, knock: 240, launch: 220, big: true, stop: 0.07, shake: 3 },
        ] }],
      };
    },
  }),
  titanbreaker: skill({
    id: 'titanbreaker', name: 'Titan Breaker', job: 'warrior', type: 'attack', fx: 'quake', icon: 'quake', school: 'steel',
    desc: 'A heavy three-blow combo in one go: a crushing smash, a rising drag that hurls them up, and a leaping dive that splits the ground wide open.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(4, 7);
      return {
        mp: k(18, 36), pct: k(180, 320), hits: 3, targets, flare: true,
        combo: [{ move: 'titan', dur: 1.1, step: 14, finisher: true, strikes: [
          { at: 0.17, pct: k(150, 260), reach: 94, h: 74, targets, knock: 140, arc: [-105, 190], thick: 14, big: true, crack: true, stop: 0.08, shake: 3 },
          { at: 0.46, pct: k(130, 230), reach: 90, h: 86, targets, knock: 50, launch: 470, arc: [80, -175], thick: 12, big: true, stop: 0.06 },
          { at: 0.83, pct: k(260, 460), reach: 112, h: 92, around: true, targets: targets + 2, knock: 290, crack: true, big: true, stop: 0.15, shake: 7 },
        ] }],
      };
    },
  }),
  ironskin: skill({
    id: 'ironskin', name: 'Iron Skin', job: 'warrior', type: 'buff', fx: 'buff',
    desc: 'Harden up and raise your weapon defense.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { wdef: lerp(10, 60, lv, m) } }),
  }),
  charge: skill({
    id: 'charge', name: 'Charge', job: 'warrior', type: 'attack', fx: 'charge', maxLevel: 10, school: 'steel', movement: true,
    desc: 'Barrel forward shoulder-first, bowling over every monster in your path and tossing them aside. Nothing touches you on the way.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const hit = (at) => ({ at, pct: k(90, 160), reach: 46, h: 64, around: true, targets: 4, knock: 300, launch: 180 });
      return {
        mp: k(10, 6), pct: k(90, 160), hits: 1, targets: 4,
        combo: [{ move: 'dash', dur: 0.42, step: k(80, 140), carry: 0.7, guard: 0.45, trail: true, strikes: [hit(0.25), { ...hit(0.6), big: true, stop: 0.06, shake: 2 }] }],
      };
    },
  }),
  vigor: skill({
    id: 'vigor', name: 'Vigor', job: 'warrior', type: 'passive', fx: null,
    desc: 'Raises max HP and HP recovery.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.02, 0.2, lv, m), restRegen: lerp(2, 20, lv, m) } }),
  }),
  // Tanking: warriors hold the monsters so the rest of the group can fight.
  provoke: skill({
    id: 'provoke', name: 'Provoke', job: 'warrior', type: 'provoke', fx: 'roar', icon: 'provoke', school: 'steel', maxLevel: 10,
    desc: 'Roar at every monster around you so they all come after you.',
    at: (lv, m) => ({ mp: lerp(8, 4, lv, m), hold: lerpf(2, 4, lv, m), range: { w: lerp(300, 480, lv, m), h: 140, around: true } }),
  }),
  chainhook: skill({
    id: 'chainhook', name: 'Chain Hook', job: 'warrior', type: 'hook', fx: 'hook', icon: 'hook', school: 'steel', lock: 0.25,
    desc: 'Hurl a chain hook ahead and drag the monsters it catches right to you, gathered up for the party.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), pct: lerp(60, 130, lv, m), hits: 1, targets: lerp(3, 8, lv, m), range: { w: lerp(180, 320, lv, m), h: 80 }, pull: true }),
  }),
  shieldwall: skill({
    id: 'shieldwall', name: 'Shield Wall', job: 'warrior', type: 'buff', fx: 'shield', school: 'steel',
    desc: 'Brace behind your shield and take less damage from every hit for a while.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(10, 25, lv, m), buff: { dmgCut: lerpf(0.15, 0.4, lv, m) } }),
  }),
  rallycry: skill({
    id: 'rallycry', name: 'Rally Cry', job: 'warrior', type: 'buff', fx: 'buff', icon: 'rally', school: 'steel', party: true,
    desc: 'A rousing shout: you and the party around you take less damage.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(20, 45, lv, m), buff: { dmgCut: lerpf(0.06, 0.18, lv, m) }, range: { w: 440, h: 160, around: true } }),
  }),
  stalwart: skill({
    id: 'stalwart', name: 'Stalwart', job: 'warrior', type: 'passive', fx: null,
    desc: 'Tougher all around: more max HP and weapon defense.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.03, 0.2, lv, m), wdef: lerp(3, 30, lv, m) } }),
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
    id: 'grandverdict', name: 'Grand Verdict', job: 'paladin', type: 'attack', fx: 'judgment', icon: 'verdict', school: 'holy', maxLevel: 10, hitsCost: 25,
    desc: 'Finisher: needs a 25-hit combo, and spends it. Kneel, rise on a column of light, then drive a giant sword of light down on everything around you; pillars of light strike every monster it hits.',
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
// Finishers (`hitsCost`) need that long a hit counter and spend it (see world/world.js HITS_WINDOW).
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
    id: 'crimsoneclipse', name: 'Crimson Eclipse', job: 'berserker', type: 'attack', fx: 'quake', icon: 'eclipse', school: 'rage', maxLevel: 10, hitsCost: 25,
    desc: 'Finisher: needs a 25-hit combo, and spends it. A whirlwind spins you up into the air, sucking monsters in, then you crash down under a blood-red moon in one enormous smash. Fills your Rage to the top.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const targets = k(8, 12);
      const whirl = (at, i) => ({ at, pct: k(60, 100), reach: 96, h: 120, around: true, targets, pull: 80, arc: [i % 2 ? 180 : 0, 300], thick: 12, stop: 0.02, rage: 0 });
      return {
        mp: k(30, 50), pct: k(440, 760), hits: 7, targets, rageGain: 100,
        combo: [{ move: 'eclipse', dur: 1.6, step: 6, finisher: true, guard: 1.3, strikes: [
          ...[0.08, 0.17, 0.26, 0.35, 0.44].map(whirl),
          { at: 0.47, pct: 0, reach: 0, h: 0, targets: 0, burst: 'bloodmoon', burstAt: 0, rage: 0 },
          { at: 0.68, pct: k(440, 760), reach: 175, h: 150, around: true, targets, knock: 300, launch: 380, crack: true, burst: 'eclipse', burstAt: 0, big: true, stop: 0.16, shake: 8, rage: 0 },
          { at: 0.8, pct: k(150, 260), reach: 185, h: 150, around: true, targets, knock: 200, burst: 'rageburst', burstAt: 0.3, big: true, stop: 0.05, shake: 3, rage: 0 },
        ] }],
      };
    },
  }),

  // ---------- Mage (spells and support) ----------
  magicbolt: skill({
    id: 'magicbolt', name: 'Magic Bolt', job: 'mage', type: 'magic', fx: 'bolt', school: 'arcane',
    desc: 'Fire a spinning bolt of raw magic at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(6, 14, lv, m), power: lerp(170, 310, lv, m), hits: 1, targets: 1, range: { w: 270, h: 60 }, projectile: true }),
  }),
  sparkburst: skill({
    id: 'sparkburst', name: 'Arcane Burst', job: 'mage', type: 'magic', fx: 'burst', school: 'arcane',
    desc: 'Detonate a ring of runes that hits a group in front of you.',
    at: (lv, m) => ({ mp: lerp(12, 28, lv, m), power: lerp(95, 175, lv, m), hits: 1, targets: lerp(4, 6, lv, m), range: { w: 190, h: 90 } }),
  }),
  blink: skill({
    id: 'blink', name: 'Blink', job: 'mage', type: 'blink', fx: 'blink', maxLevel: 10, school: 'arcane',
    desc: 'Vanish in a flash and reappear a short way ahead. Monsters lose track of you for a moment.',
    at: (lv, m) => ({ mp: lerp(10, 6, lv, m), distance: lerp(80, 150, lv, m) }),
  }),
  manashield: skill({
    id: 'manashield', name: 'Mana Shield', job: 'mage', type: 'buff', fx: 'shield', school: 'arcane',
    desc: 'Part of the damage you take comes out of MP instead.',
    at: (lv, m) => ({ mp: lerp(10, 25, lv, m), duration: lerp(60, 180, lv, m), buff: { manaShield: lerpf(0.3, 0.8, lv, m) } }),
  }),
  arcanemind: skill({
    id: 'arcanemind', name: 'Arcane Mind', job: 'mage', type: 'passive', fx: null,
    desc: 'Raises max MP and MP recovery.',
    at: (lv, m) => ({ passive: { maxMpPct: lerpf(0.03, 0.3, lv, m), mpRegen: lerp(2, 24, lv, m) } }),
  }),
  // Support: mages are the healers of a dungeon group.
  mend: skill({
    id: 'mend', name: 'Mend', job: 'mage', type: 'heal', fx: 'heal', school: 'holy', lock: 0.3,
    desc: 'Restore HP to you and every party member around you.',
    at: (lv, m) => ({ mp: lerp(10, 24, lv, m), healPct: lerpf(0.12, 0.32, lv, m), power: 0, hits: 1, targets: 0, range: { w: 440, h: 160, around: true } }),
  }),
  renew: skill({
    id: 'renew', name: 'Renew', job: 'mage', type: 'buff', fx: 'buff', icon: 'renew', school: 'holy', party: true,
    desc: 'A soothing glow on you and the party around you that restores HP every second.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), duration: lerp(15, 30, lv, m), buff: { regenPct: lerpf(0.015, 0.04, lv, m) }, range: { w: 440, h: 160, around: true } }),
  }),
  barrier: skill({
    id: 'barrier', name: 'Arcane Barrier', job: 'mage', type: 'buff', fx: 'shield', school: 'arcane', party: true,
    desc: 'Wrap you and the party around you in a bubble that soaks up damage until it pops.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), duration: lerp(15, 30, lv, m), buff: { barrier: lerpf(0.12, 0.35, lv, m) }, range: { w: 440, h: 160, around: true } }),
  }),
  revive: skill({
    id: 'revive', name: 'Revive', job: 'mage', type: 'revive', fx: 'heal', icon: 'revive', school: 'holy', maxLevel: 10, lock: 0.6,
    desc: 'Get a fallen party member nearby back on their feet, even mid-fight.',
    at: (lv, m) => ({ mp: lerp(40, 22, lv, m), healPct: lerpf(0.3, 0.7, lv, m), range: { w: 300, h: 140, around: true } }),
  }),

  // ---------- Archer ----------
  doubleshot: skill({
    id: 'doubleshot', name: 'Rapid Fire', job: 'archer', type: 'attack', fx: 'arrow', school: 'wind',
    desc: 'A three-part combo, one part per press: three quick arrows, three more as you hop back, then a heavy arrow that tears through the whole line.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      const quick = (at) => ({ at, shot: 'arrow', pct: k(45, 75), range: 310, h: 60, knock: 20, speed: 820 });
      return {
        mp: k(5, 11), pct: k(45, 75), hits: 7, targets: 1,
        combo: [
          { move: 'rapid', dur: 0.52, step: -2, strikes: [quick(0.17), quick(0.5), quick(0.83)] },
          { move: 'rapid', dur: 0.52, step: -12, strikes: [quick(0.17), quick(0.5), quick(0.83)] },
          { move: 'aimshot', dur: 0.72, step: -10, finisher: true, strikes: [{ at: 0.68, shot: 'bigarrow', pct: k(180, 300), range: 360, h: 64, targets: k(3, 6), pierce: true, speed: 950, knock: 230, launch: 150, big: true, stop: 0.07, shake: 2 }] },
        ],
      };
    },
  }),
  scattershot: skill({
    id: 'scattershot', name: 'Arrow Fan', job: 'archer', type: 'attack', fx: 'arrow', school: 'wind',
    desc: 'Loose a fan of arrows at once; each one finds its own monster.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 22), pct: k(100, 170), hits: 1, targets: k(3, 6),
        combo: [{ move: 'draw', dur: 0.62, step: -6, strikes: [{ at: 0.6, shot: 'arrow', fan: k(3, 6), pct: k(100, 170), range: 300, h: 150, knock: 90, speed: 780 }] }],
      };
    },
  }),
  arrowrain: skill({
    id: 'arrowrain', name: 'Arrow Rain', job: 'archer', type: 'attack', fx: 'rain', icon: 'rain-arrow', school: 'wind',
    desc: 'Shoot a volley into the sky; arrows pour down on everything in the area ahead.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(16, 32), pct: k(60, 100), hits: k(8, 14), targets: 6,
        combo: [{ move: 'skyshot', dur: 0.75, step: -4, finisher: true, strikes: [{ at: 0.58, rain: k(8, 14), pct: k(60, 100), rainFrom: 60, rainW: 280, span: 0.7, knock: 20 }] }],
      };
    },
  }),
  eaglefocus: skill({
    id: 'eaglefocus', name: 'Eagle Focus', job: 'archer', type: 'buff', fx: 'buff',
    desc: 'Sharpen your aim: more accuracy and critical hits.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { acc: lerp(5, 30, lv, m), critRate: lerpf(0.03, 0.15, lv, m) } }),
  }),
  thunderhawk: skill({
    id: 'thunderhawk', name: 'Thunder Hawk', job: 'archer', type: 'buff', fx: 'buff', icon: 'hawk', school: 'lightning', lock: 0.8,
    desc: 'Call a storm hawk that circles above you and dives lightning-edged feathers into nearby monsters.',
    at: (lv, m) => ({
      mp: lerp(40, 80, lv, m), duration: lerp(60, 180, lv, m), buff: {},
      summon: { art: 'hawk', every: 2.4, power: lerp(60, 140, lv, m), targets: 3, range: { w: 400, h: 200, around: true }, fx: 'feather', physical: true },
    }),
  }),
  backflip: skill({
    id: 'backflip', name: 'Backflip Shot', job: 'archer', type: 'attack', fx: 'blink', maxLevel: 10, school: 'wind', movement: true,
    desc: 'Flip backward out of danger on a gust of wind, firing a spread of arrows at whatever was on you. Nothing touches you mid-flip.',
    at: (lv, m) => {
      const k = (a, b) => lerp(a, b, lv, m);
      return {
        mp: k(10, 6), pct: k(70, 120), hits: 3, targets: 3,
        combo: [{ move: 'flip', dur: 0.5, step: -k(80, 140), carry: 0.75, guard: 0.5, strikes: [{ at: 0.42, shot: 'arrow', fan: 3, pct: k(70, 120), range: 300, h: 130, knock: 80, speed: 820 }] }],
      };
    },
  }),
  keeneye: skill({
    id: 'keeneye', name: 'Keen Eye', job: 'archer', type: 'passive', fx: null,
    desc: 'Permanently raises critical rate and critical damage.',
    at: (lv, m) => ({ passive: { critRate: lerpf(0.01, 0.15, lv, m), critDamage: lerpf(0.05, 0.3, lv, m) } }),
  }),

  // ---------- Thief ----------
  twinstab: skill({
    id: 'twinstab', name: 'Twin Stab', job: 'thief', type: 'attack', fx: 'flurry',
    desc: 'Two quick stabs. Needs a dagger.',
    weapons: ['dagger'],
    at: (lv, m) => ({ mp: lerp(4, 12, lv, m), pct: lerp(80, 145, lv, m), hits: 2, targets: 1, range: { w: 75, h: 60 } }),
  }),
  startoss: skill({
    id: 'startoss', name: 'Star Toss', job: 'thief', type: 'attack', fx: 'star',
    desc: 'Throw two stars at the nearest monster. Needs a gauntlet.',
    weapons: ['gauntlet'],
    at: (lv, m) => ({ mp: lerp(4, 12, lv, m), pct: lerp(65, 125, lv, m), hits: 2, targets: 1, range: { w: 290, h: 60 }, projectile: true }),
  }),
  haste: skill({
    id: 'haste', name: 'Haste', job: 'thief', type: 'buff', fx: 'buff',
    desc: 'Run faster and jump higher.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { speed: lerp(8, 30, lv, m), jump: lerp(4, 18, lv, m) } }),
  }),
  shadowstep: skill({
    id: 'shadowstep', name: 'Shadow Step', job: 'thief', type: 'blink', fx: 'blink', maxLevel: 10, school: 'shadow',
    desc: 'Melt into the shadows and step out a long way ahead.',
    at: (lv, m) => ({ mp: lerp(10, 6, lv, m), distance: lerp(90, 160, lv, m) }),
  }),
  nimble: skill({
    id: 'nimble', name: 'Nimble', job: 'thief', type: 'passive', fx: null,
    desc: 'Permanently raises avoid and accuracy.',
    at: (lv, m) => ({ passive: { eva: lerp(3, 30, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),

  // ---------- Stormfrost Wizard (ice & lightning) ----------
  ilmastery: skill({
    id: 'ilmastery', name: 'Stormfrost Mastery', job: 'ilwizard', type: 'passive', fx: null,
    desc: 'Steadier spells and more magic attack.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), matk: lerp(2, 20, lv, m) } }),
  }),
  coldbeam: skill({
    id: 'coldbeam', name: 'Cold Beam', job: 'ilwizard', type: 'magic', fx: 'icebeam', school: 'ice',
    desc: 'Launch a spear of ice that freezes the monster solid. Frozen monsters can\'t move or hurt you.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), power: lerp(190, 330, lv, m), hits: 1, targets: 1, range: { w: 300, h: 60 }, projectile: true, freeze: lerpf(1.5, 3, lv, m) }),
  }),
  thunderbolt: skill({
    id: 'thunderbolt', name: 'Thunder Bolt', job: 'ilwizard', type: 'magic', fx: 'thunder', school: 'lightning', lock: 0.5,
    desc: 'Call jagged lightning down on every monster in front of you.',
    at: (lv, m) => ({ mp: lerp(18, 36, lv, m), power: lerp(130, 250, lv, m), hits: 1, targets: 6, range: { w: 260, h: 120 }, delay: 0.15 }),
  }),
  stormfocus: skill({
    id: 'stormfocus', name: 'Storm Focus', job: 'ilwizard', type: 'buff', fx: 'buff', icon: 'storm', school: 'lightning',
    desc: 'Charge yourself with static: more magic attack and faster casting.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(60, 200, lv, m), buff: { matk: lerp(4, 22, lv, m), attackSpeed: lerpf(0.05, 0.2, lv, m) } }),
  }),

  // ---------- Venomflame Wizard (fire & poison) ----------
  firemastery: skill({
    id: 'firemastery', name: 'Venomflame Mastery', job: 'fpwizard', type: 'passive', fx: null,
    desc: 'Steadier spells and more magic attack.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), matk: lerp(2, 20, lv, m) } }),
  }),
  fireball: skill({
    id: 'fireball', name: 'Fireball', job: 'fpwizard', type: 'magic', fx: 'fire', school: 'fire',
    desc: 'Hurl a roaring fireball that explodes on the nearest monster.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), power: lerp(210, 370, lv, m), hits: 1, targets: 1, range: { w: 300, h: 60 }, projectile: true }),
  }),
  poisonmist: skill({
    id: 'poisonmist', name: 'Poison Mist', job: 'fpwizard', type: 'magic', fx: 'mist', school: 'poison', lock: 0.5,
    desc: 'Exhale a choking green mist. Everything caught in it is poisoned and keeps taking damage.',
    at: (lv, m) => ({
      mp: lerp(18, 36, lv, m), power: lerp(60, 120, lv, m), hits: 1, targets: 6, range: { w: 240, h: 110 }, delay: 0.2,
      poison: { pct: lerpf(0.25, 0.5, lv, m), secs: lerp(4, 8, lv, m) },
    }),
  }),
  meditate: skill({
    id: 'meditate', name: 'Meditate', job: 'fpwizard', type: 'buff', fx: 'buff', school: 'fire',
    desc: 'Raises magic attack for a while.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(60, 200, lv, m), buff: { matk: lerp(5, 30, lv, m) } }),
  }),

  // ---------- Cleric (holy) ----------
  holymastery: skill({
    id: 'holymastery', name: 'Holy Mastery', job: 'cleric', type: 'passive', fx: null,
    desc: 'Steadier spells and more magic attack.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), matk: lerp(2, 16, lv, m) } }),
  }),
  bless: skill({
    id: 'bless', name: 'Bless', job: 'cleric', type: 'buff', fx: 'buff', school: 'holy',
    desc: 'Raises defense, accuracy, and avoid.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(60, 200, lv, m), buff: { wdef: lerp(5, 30, lv, m), acc: lerp(5, 25, lv, m), eva: lerp(5, 25, lv, m) } }),
  }),
  heal: skill({
    id: 'heal', name: 'Heal', job: 'cleric', type: 'heal', fx: 'heal', school: 'holy', lock: 0.5,
    desc: 'Restore HP and burn nearby monsters with holy light.',
    at: (lv, m) => ({ mp: lerp(16, 34, lv, m), healPct: lerpf(0.15, 0.5, lv, m), power: lerp(70, 180, lv, m), hits: 1, targets: 5, range: { w: 220, h: 120, around: true } }),
  }),
  holybolt: skill({
    id: 'holybolt', name: 'Holy Bolt', job: 'cleric', type: 'magic', fx: 'holy', school: 'holy',
    desc: 'A spear of light at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), power: lerp(210, 370, lv, m), hits: 1, targets: 1, range: { w: 300, h: 60 }, projectile: true }),
  }),

  // ---------- Stormfrost Archmage (third job) ----------
  ilarchmastery: skill({
    id: 'ilarchmastery', name: 'Archmage Mastery', job: 'ilarchmage', type: 'passive', fx: null,
    desc: 'Steadier, sharper spells: more mastery, magic attack, and critical damage.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.7, lv, m), matk: lerp(10, 40, lv, m), critDamage: lerpf(0.05, 0.3, lv, m) } }),
  }),
  chainlightning: skill({
    id: 'chainlightning', name: 'Chain Lightning', job: 'ilarchmage', type: 'magic', fx: 'chain', school: 'lightning', lock: 0.55,
    desc: 'A bolt of lightning that leaps from monster to monster, striking up to six.',
    at: (lv, m) => ({ mp: lerp(24, 48, lv, m), power: lerp(230, 400, lv, m), hits: 1, targets: 6, range: { w: 380, h: 160 }, delay: 0.05, chain: true }),
  }),
  icespire: skill({
    id: 'icespire', name: 'Glacier Spikes', job: 'ilarchmage', type: 'magic', fx: 'icespire', school: 'ice', lock: 0.6,
    desc: 'Giant spikes of ice burst out of the ground, impaling and freezing a whole crowd.',
    at: (lv, m) => ({ mp: lerp(28, 52, lv, m), power: lerp(200, 360, lv, m), hits: 1, targets: 8, range: { w: 300, h: 120 }, delay: 0.25, freeze: lerpf(2, 4, lv, m) }),
  }),
  frostsprite: skill({
    id: 'frostsprite', name: 'Frost Sprite', job: 'ilarchmage', type: 'buff', fx: 'buff', icon: 'sprite', school: 'ice', lock: 0.8,
    desc: 'Summon a little ice spirit that floats beside you and pelts monsters with freezing shards.',
    at: (lv, m) => ({
      mp: lerp(60, 110, lv, m), duration: lerp(60, 180, lv, m), buff: {},
      summon: { art: 'sprite', every: 2.2, power: lerp(150, 290, lv, m), targets: 5, range: { w: 420, h: 220, around: true }, fx: 'icebeam', freeze: 1 },
    }),
  }),
  tempest: skill({
    id: 'tempest', name: 'Glacial Tempest', job: 'ilarchmage', type: 'magic', fx: 'tempest', school: 'ice', ultimate: true, lock: 1.1,
    desc: 'The sky freezes over: a blizzard of ice lances and lightning crashes onto up to 15 monsters, twice, freezing them all.',
    at: (lv, m) => ({
      mp: lerp(70, 120, lv, m), power: lerp(280, 510, lv, m), hits: 2, targets: 15,
      range: { w: 620, h: 320, around: true }, critRate: lerpf(0.05, 0.15, lv, m), delay: 0.4, freeze: 3,
    }),
  }),

  // ---------- Venomflame Archmage (third job) ----------
  infernomastery: skill({
    id: 'infernomastery', name: 'Inferno Mastery', job: 'fparchmage', type: 'passive', fx: null,
    desc: 'Steadier, fiercer spells: more mastery, magic attack, and critical damage.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.7, lv, m), matk: lerp(10, 40, lv, m), critDamage: lerpf(0.05, 0.3, lv, m) } }),
  }),
  toxicblaze: skill({
    id: 'toxicblaze', name: 'Plague Inferno', job: 'fparchmage', type: 'magic', fx: 'toxicblaze', school: 'poison', lock: 0.6,
    desc: 'A roaring wall of venom-green fire sweeps forward, burning and poisoning everything in its path.',
    at: (lv, m) => ({
      mp: lerp(28, 52, lv, m), power: lerp(190, 340, lv, m), hits: 1, targets: 8, range: { w: 300, h: 120 }, delay: 0.2,
      poison: { pct: lerpf(0.3, 0.6, lv, m), secs: lerp(5, 9, lv, m) },
    }),
  }),
  salamander: skill({
    id: 'salamander', name: 'Venom Salamander', job: 'fparchmage', type: 'buff', fx: 'buff', icon: 'salamander', school: 'fire', lock: 0.8,
    desc: 'Summon a fiery salamander that rides beside you and spits poisoned fire at nearby monsters.',
    at: (lv, m) => ({
      mp: lerp(60, 110, lv, m), duration: lerp(60, 180, lv, m), buff: {},
      summon: { art: 'salamander', every: 2.4, power: lerp(160, 300, lv, m), targets: 5, range: { w: 420, h: 220, around: true }, fx: 'venomfire', poison: { pct: 0.3, secs: 4 } },
    }),
  }),
  meteor: skill({
    id: 'meteor', name: 'Meteor Shower', job: 'fparchmage', type: 'magic', fx: 'meteor', school: 'fire', ultimate: true, lock: 1.1,
    desc: 'Rain blazing meteors on up to 15 monsters across a huge area, twice.',
    at: (lv, m) => ({
      mp: lerp(70, 120, lv, m), power: lerp(290, 520, lv, m), hits: 2, targets: 15,
      range: { w: 620, h: 320, around: true }, critRate: lerpf(0.05, 0.15, lv, m), delay: 0.4,
    }),
  }),

  // ---------- Bishop (third job) ----------
  seraphmastery: skill({
    id: 'seraphmastery', name: 'Divine Mastery', job: 'bishop', type: 'passive', fx: null,
    desc: 'Steadier, brighter spells: more mastery, magic attack, and critical rate.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.7, lv, m), matk: lerp(10, 36, lv, m), critRate: lerpf(0.02, 0.12, lv, m) } }),
  }),
  shiningray: skill({
    id: 'shiningray', name: 'Shining Ray', job: 'bishop', type: 'magic', fx: 'shiningray', school: 'holy', lock: 0.55,
    desc: 'A blinding cross of light bursts out around you, striking every monster near it.',
    at: (lv, m) => ({ mp: lerp(26, 50, lv, m), power: lerp(210, 370, lv, m), hits: 2, targets: 8, range: { w: 300, h: 160, around: true }, delay: 0.2 }),
  }),
  sanctuary: skill({
    id: 'sanctuary', name: 'Sanctuary', job: 'bishop', type: 'buff', fx: 'shield', school: 'holy', lock: 0.6,
    desc: 'A halo of light: huge defense, avoid, and max HP.',
    at: (lv, m) => ({ mp: lerp(40, 80, lv, m), duration: lerp(60, 240, lv, m), buff: { wdef: lerp(30, 120, lv, m), eva: lerp(10, 40, lv, m), maxHpPct: lerpf(0.1, 0.4, lv, m) } }),
  }),
  guardianangel: skill({
    id: 'guardianangel', name: 'Guardian Angel', job: 'bishop', type: 'buff', fx: 'buff', icon: 'angel', school: 'holy', lock: 0.8,
    desc: 'Summon an angel that floats beside you and strikes nearby monsters with light.',
    at: (lv, m) => ({
      mp: lerp(60, 110, lv, m), duration: lerp(60, 180, lv, m), buff: {},
      summon: { art: 'angel', every: 2.2, power: lerp(150, 280, lv, m), targets: 6, range: { w: 420, h: 220, around: true }, fx: 'holy' },
    }),
  }),
  judgment: skill({
    id: 'judgment', name: 'Radiant Judgment', job: 'bishop', type: 'magic', fx: 'judgment', school: 'holy', ultimate: true, lock: 1.1,
    desc: 'Pillars of holy light strike up to 15 monsters across a huge area, twice. Strong criticals.',
    at: (lv, m) => ({
      mp: lerp(70, 120, lv, m), power: lerp(280, 500, lv, m), hits: 2, targets: 15,
      range: { w: 620, h: 320, around: true }, critRate: lerpf(0.1, 0.25, lv, m), delay: 0.4,
    }),
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
  powerslash: 'overhead', whirlstrike: 'spin', ironskin: 'guard', charge: 'dash',
  provoke: 'roar', chainhook: 'throw', shieldwall: 'guard', rallycry: 'roar', titanbreaker: 'titan',
  aegissmite: 'bash', hallowedground: 'consecrate', divineaegis: 'salute', ravage: 'cleave1', bloodfrenzy: 'warroar', rampage: 'rampage', grandverdict: 'verdict', crimsoneclipse: 'eclipse',
  magicbolt: 'castforward', sparkburst: 'castspin', blink: 'vanish', manashield: 'castup',
  mend: 'pray', renew: 'castup', barrier: 'castup', revive: 'pray',
  doubleshot: 'rapid', scattershot: 'draw', eaglefocus: 'cheer', thunderhawk: 'castup', backflip: 'flip', arrowrain: 'skyshot',
  twinstab: 'flurry', startoss: 'barrage', haste: 'cheer', shadowstep: 'vanish',
  coldbeam: 'castforward', thunderbolt: 'castup', stormfocus: 'castup',
  fireball: 'castforward', poisonmist: 'castforward', meditate: 'pray',
  bless: 'pray', heal: 'pray', holybolt: 'castforward',
  chainlightning: 'castforward', icespire: 'slam', frostsprite: 'castup', tempest: 'castup',
  toxicblaze: 'castspin', salamander: 'castup', meteor: 'castup',
  shiningray: 'castspin', sanctuary: 'pray', guardianangel: 'pray', judgment: 'castup',
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
