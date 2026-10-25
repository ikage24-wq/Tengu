// Skill books. Each skill's numbers come from `at(level)`, so balance lives in one place.
//
// Types:
//   attack  - weapon damage (pct is % of a basic hit)
//   magic   - spell damage (power is % of magic attack)
//   heal    - restores HP and smites monsters in range with holy damage
//   blink   - teleports you `distance` forward
//   buff    - timed bonuses; `buff` keys are added to the player's stats while active
//   passive - always-on bonuses once learned
//
// Range: `w`/`h` is the hit box in front of the player. `projectile` skills hit the nearest
// targets within range and draw a flying shot. `stun` (seconds) also stops monsters, with stars
// instead of ice; `bleed` works like poison, in red. `hitFx` is an extra effect on each monster hit,
// and `ultimate` marks a screen-wide ultimate. `freeze` (seconds) stops monsters it hits;
// `poison` ({ pct, secs }) makes them take pct of the hit again every second for secs.
// `school` (arcane, ice, lightning, fire, poison, holy) colors the casting circle.

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
    id: 'powerslash', name: 'Power Slash', job: 'warrior', type: 'attack', fx: 'slash',
    desc: 'A heavy swing at one monster.',
    at: (lv, m) => ({ mp: lerp(4, 12, lv, m), pct: lerp(160, 265, lv, m), hits: 1, targets: 1, range: { w: 80, h: 60 } }),
  }),
  whirlstrike: skill({
    id: 'whirlstrike', name: 'Whirl Strike', job: 'warrior', type: 'attack', fx: 'spin',
    desc: 'Spin your weapon to hit several monsters.',
    at: (lv, m) => ({ mp: lerp(8, 20, lv, m), pct: lerp(90, 170, lv, m), hits: 1, targets: lerp(3, 6, lv, m), range: { w: 150, h: 70 } }),
  }),
  ironskin: skill({
    id: 'ironskin', name: 'Iron Skin', job: 'warrior', type: 'buff', fx: 'buff',
    desc: 'Harden up and raise your weapon defense.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { wdef: lerp(10, 60, lv, m) } }),
  }),
  charge: skill({
    id: 'charge', name: 'Charge', job: 'warrior', type: 'blink', fx: 'charge', maxLevel: 10, school: 'steel',
    desc: 'Barrel forward shoulder-first, slamming every monster in your path.',
    at: (lv, m) => ({ mp: lerp(10, 6, lv, m), distance: lerp(70, 130, lv, m), pct: lerp(90, 160, lv, m), hits: 1, targets: 4 }),
  }),
  vigor: skill({
    id: 'vigor', name: 'Vigor', job: 'warrior', type: 'passive', fx: null,
    desc: 'Raises max HP and HP recovery.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.02, 0.2, lv, m), restRegen: lerp(2, 20, lv, m) } }),
  }),

  // ---------- Mage (glass cannon) ----------
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

  // ---------- Archer ----------
  doubleshot: skill({
    id: 'doubleshot', name: 'Double Shot', job: 'archer', type: 'attack', fx: 'arrow',
    desc: 'Fire two arrows at the nearest monster.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => ({ mp: lerp(4, 12, lv, m), pct: lerp(70, 128, lv, m), hits: 2, targets: 1, range: { w: 300, h: 60 }, projectile: true }),
  }),
  scattershot: skill({
    id: 'scattershot', name: 'Scatter Shot', job: 'archer', type: 'attack', fx: 'arrow',
    desc: 'A spread of arrows that hits several monsters.',
    weapons: ['bow', 'crossbow'],
    at: (lv, m) => ({ mp: lerp(10, 22, lv, m), pct: lerp(80, 150, lv, m), hits: 1, targets: lerp(3, 5, lv, m), range: { w: 280, h: 80 }, projectile: true }),
  }),
  eaglefocus: skill({
    id: 'eaglefocus', name: 'Eagle Focus', job: 'archer', type: 'buff', fx: 'buff',
    desc: 'Sharpen your aim: more accuracy and critical hits.',
    at: (lv, m) => ({ mp: lerp(10, 20, lv, m), duration: lerp(60, 180, lv, m), buff: { acc: lerp(5, 30, lv, m), critRate: lerpf(0.03, 0.15, lv, m) } }),
  }),
  backflip: skill({
    id: 'backflip', name: 'Backflip', job: 'archer', type: 'blink', fx: 'blink', maxLevel: 10, school: 'wind',
    desc: 'Flip backward out of danger on a gust of wind. Monsters lose track of you for a moment.',
    at: (lv, m) => ({ mp: lerp(10, 6, lv, m), distance: -lerp(70, 120, lv, m) }),
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
    desc: 'Throw two stars at the nearest monster. Needs a claw.',
    weapons: ['claw'],
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

  // ---------- Blademaster ----------
  blademastery: skill({
    id: 'blademastery', name: 'Blade Mastery', job: 'blademaster', type: 'passive', fx: null,
    desc: 'Steadier sword and axe hits: raises minimum damage and accuracy.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  rage: skill({
    id: 'rage', name: 'Rage', job: 'blademaster', type: 'buff', fx: 'buff',
    desc: 'Raises weapon attack for a while.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { watk: lerp(5, 25, lv, m), attackSpeed: 0.1 } }),
  }),
  cleave: skill({
    id: 'cleave', name: 'Cleave', job: 'blademaster', type: 'attack', fx: 'vortex', school: 'steel', lock: 0.6,
    desc: 'A huge sweep that hits a crowd.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(150, 300, lv, m), hits: 1, targets: 6, range: { w: 170, h: 80 } }),
  }),
  risingcombo: skill({
    id: 'risingcombo', name: 'Rising Combo', job: 'blademaster', type: 'attack', fx: 'flurry', hitFx: 'xslash', school: 'steel', lock: 0.55,
    desc: 'Three fast strikes on one monster.',
    at: (lv, m) => ({ mp: lerp(10, 24, lv, m), pct: lerp(85, 155, lv, m), hits: 3, targets: 1, range: { w: 90, h: 60 } }),
  }),

  // ---------- Lancer ----------
  spearmastery: skill({
    id: 'spearmastery', name: 'Spear Mastery', job: 'lancer', type: 'passive', fx: null,
    desc: 'Steadier spear hits: raises minimum damage and accuracy.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  ironwill: skill({
    id: 'ironwill', name: 'Iron Will', job: 'lancer', type: 'buff', fx: 'buff',
    desc: 'Raises max HP for a while.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { maxHpPct: lerpf(0.1, 0.6, lv, m) } }),
  }),
  sweep: skill({
    id: 'sweep', name: 'Crescent Sweep', job: 'lancer', type: 'attack', fx: 'vortex', school: 'dragon', lock: 0.6,
    desc: 'A long sweep that hits up to ten monsters.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(120, 235, lv, m), hits: 1, targets: lerp(6, 10, lv, m), range: { w: 230, h: 90 } }),
  }),
  dragonfang: skill({
    id: 'dragonfang', name: 'Dragon Fang', job: 'lancer', type: 'attack', fx: 'pierce', hitFx: 'xslash', school: 'dragon', lock: 0.55,
    desc: 'A crushing thrust on one monster.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), pct: lerp(250, 430, lv, m), hits: 1, targets: 1, range: { w: 120, h: 60 } }),
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

  // ---------- Ranger ----------
  bowmastery: skill({
    id: 'bowmastery', name: 'Bow Mastery', job: 'ranger', type: 'passive', fx: null,
    desc: 'Steadier bow hits: raises minimum damage and accuracy.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  bowbooster: skill({
    id: 'bowbooster', name: 'Bow Booster', job: 'ranger', type: 'buff', fx: 'buff',
    desc: 'Shoot faster for a while.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { attackSpeed: lerpf(0.1, 0.3, lv, m) } }),
  }),
  bombarrow: skill({
    id: 'bombarrow', name: 'Bomb Arrow', job: 'ranger', type: 'attack', fx: 'bomb', lock: 0.6,
    desc: 'An arrow that bursts and hits the whole group.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), pct: lerp(150, 280, lv, m), hits: 1, targets: 6, range: { w: 300, h: 90 }, projectile: true }),
  }),
  multishot: skill({
    id: 'multishot', name: 'Multi Shot', job: 'ranger', type: 'attack', fx: 'arrow', lock: 0.55,
    desc: 'Three arrows in a row at one monster.',
    at: (lv, m) => ({ mp: lerp(10, 24, lv, m), pct: lerp(75, 135, lv, m), hits: 3, targets: 1, range: { w: 320, h: 60 }, projectile: true }),
  }),

  // ---------- Marksman ----------
  xbowmastery: skill({
    id: 'xbowmastery', name: 'Crossbow Mastery', job: 'marksman', type: 'passive', fx: null,
    desc: 'Steadier crossbow hits: raises minimum damage and accuracy.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  xbowbooster: skill({
    id: 'xbowbooster', name: 'Crossbow Booster', job: 'marksman', type: 'buff', fx: 'buff',
    desc: 'Shoot faster for a while.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { attackSpeed: lerpf(0.1, 0.3, lv, m) } }),
  }),
  piercebolt: skill({
    id: 'piercebolt', name: 'Pierce Bolt', job: 'marksman', type: 'attack', fx: 'pierce', lock: 0.6,
    desc: 'A bolt that flies through every monster in a line.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(160, 300, lv, m), hits: 1, targets: 8, range: { w: 420, h: 40 }, projectile: true }),
  }),
  snipe: skill({
    id: 'snipe', name: 'Snipe', job: 'marksman', type: 'attack', fx: 'bigarrow', school: 'steel', lock: 0.75,
    desc: 'A slow, heavy shot with a high critical chance.',
    at: (lv, m) => ({ mp: lerp(16, 30, lv, m), pct: lerp(320, 520, lv, m), hits: 1, targets: 1, range: { w: 420, h: 60 }, projectile: true, critRate: lerpf(0.1, 0.4, lv, m) }),
  }),

  // ---------- Duelist ----------
  daggermastery: skill({
    id: 'daggermastery', name: 'Dagger Mastery', job: 'duelist', type: 'passive', fx: null,
    desc: 'Steadier dagger hits: raises minimum damage and accuracy.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  daggerbooster: skill({
    id: 'daggerbooster', name: 'Dagger Booster', job: 'duelist', type: 'buff', fx: 'buff',
    desc: 'Stab faster for a while.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { attackSpeed: lerpf(0.1, 0.3, lv, m) } }),
  }),
  flurry: skill({
    id: 'flurry', name: 'Flurry', job: 'duelist', type: 'attack', fx: 'flurry', hitFx: 'xslash', school: 'sakura', lock: 0.55,
    desc: 'A blur of stabs on one monster.',
    at: (lv, m) => ({ mp: lerp(12, 28, lv, m), pct: lerp(60, 110, lv, m), hits: lerp(4, 6, lv, m), targets: 1, range: { w: 85, h: 60 } }),
  }),
  shadowstrike: skill({
    id: 'shadowstrike', name: 'Shadow Strike', job: 'duelist', type: 'attack', fx: 'vortex', school: 'shadow', lock: 0.6,
    desc: 'Dash through a group in a burst of shadow.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(150, 265, lv, m), hits: 1, targets: 6, range: { w: 170, h: 80 } }),
  }),

  // ---------- Shadow ----------
  clawmastery: skill({
    id: 'clawmastery', name: 'Claw Mastery', job: 'shadow', type: 'passive', fx: null,
    desc: 'Steadier claw hits: raises minimum damage and accuracy.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  clawbooster: skill({
    id: 'clawbooster', name: 'Claw Booster', job: 'shadow', type: 'buff', fx: 'buff',
    desc: 'Throw faster for a while.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { attackSpeed: lerpf(0.1, 0.3, lv, m) } }),
  }),
  triplestar: skill({
    id: 'triplestar', name: 'Triple Star', job: 'shadow', type: 'attack', fx: 'star', lock: 0.55,
    desc: 'Three stars at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(10, 24, lv, m), pct: lerp(80, 150, lv, m), hits: 3, targets: 1, range: { w: 320, h: 60 }, projectile: true }),
  }),
  shurikenstorm: skill({
    id: 'shurikenstorm', name: 'Shuriken Storm', job: 'shadow', type: 'attack', fx: 'star', lock: 0.6,
    desc: 'A storm of stars that hits a whole group.',
    at: (lv, m) => ({ mp: lerp(16, 32, lv, m), pct: lerp(100, 195, lv, m), hits: 1, targets: 5, range: { w: 300, h: 90 }, projectile: true }),
  }),

  // ---------- Guardian (warrior branch) ----------
  guardmastery: skill({
    id: 'guardmastery', name: 'Guardian Mastery', job: 'guardian', type: 'passive', fx: null,
    desc: 'Steadier hits and thicker armor: raises minimum damage and weapon defense.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), wdef: lerp(5, 50, lv, m) } }),
  }),
  shieldbash: skill({
    id: 'shieldbash', name: 'Shield Bash', job: 'guardian', type: 'attack', fx: 'slash', hitFx: 'xslash', school: 'earth', lock: 0.45,
    desc: 'Smash monsters in front of you so hard they see stars. Stunned monsters can\'t move or hurt you.',
    at: (lv, m) => ({ mp: lerp(10, 24, lv, m), pct: lerp(180, 320, lv, m), hits: 1, targets: 3, range: { w: 95, h: 64 }, stun: lerpf(1.5, 3, lv, m) }),
  }),
  earthshaker: skill({
    id: 'earthshaker', name: 'Earthshaker', job: 'guardian', type: 'attack', fx: 'quake', school: 'earth', lock: 0.55,
    desc: 'Slam the ground: a shockwave rolls out and rocks burst up under every monster in front of you.',
    at: (lv, m) => ({ mp: lerp(16, 32, lv, m), pct: lerp(140, 260, lv, m), hits: 1, targets: 6, range: { w: 240, h: 80 }, delay: 0.15 }),
  }),
  bulwark: skill({
    id: 'bulwark', name: 'Bulwark', job: 'guardian', type: 'buff', fx: 'buff', school: 'earth',
    desc: 'Plant your feet like a mountain: huge weapon defense and max HP.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { wdef: lerp(20, 90, lv, m), maxHpPct: lerpf(0.1, 0.4, lv, m) } }),
  }),

  // ---------- Sword Saint (third job) ----------
  saintmastery: skill({
    id: 'saintmastery', name: 'Sword Saint Mastery', job: 'swordsaint', type: 'passive', fx: null,
    desc: 'Perfect form: more mastery, weapon attack, and critical damage.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 30, lv, m), critDamage: lerpf(0.05, 0.3, lv, m) } }),
  }),
  phantomslash: skill({
    id: 'phantomslash', name: 'Phantom Slash', job: 'swordsaint', type: 'attack', fx: 'wave', school: 'steel', lock: 0.5,
    desc: 'Cut the air itself: a giant crescent wave flies forward through up to eight monsters.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), pct: lerp(220, 380, lv, m), hits: 1, targets: 8, range: { w: 380, h: 70 }, projectile: true }),
  }),
  hundredcuts: skill({
    id: 'hundredcuts', name: 'Hundred Cuts', job: 'swordsaint', type: 'attack', fx: 'flurry', hitFx: 'xslash', school: 'steel', lock: 0.6,
    desc: 'Eight blinding strikes on one monster, too fast to see.',
    at: (lv, m) => ({ mp: lerp(18, 36, lv, m), pct: lerp(70, 125, lv, m), hits: 8, targets: 1, range: { w: 100, h: 64 } }),
  }),
  bladeaura: skill({
    id: 'bladeaura', name: 'Blade Aura', job: 'swordsaint', type: 'buff', fx: 'buff', school: 'steel', lock: 0.5,
    desc: 'Your blade sings: big weapon attack and critical rate.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { watk: lerp(15, 45, lv, m), critRate: lerpf(0.05, 0.2, lv, m) } }),
  }),
  thousandblades: skill({
    id: 'thousandblades', name: 'Thousand Blades', job: 'swordsaint', type: 'attack', fx: 'rain', variant: 'sword', school: 'steel', ultimate: true, lock: 1.1,
    desc: 'Raise your sword to the sky: a thousand spectral blades rain down on up to 15 monsters, twice.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(300, 520, lv, m), hits: 2, targets: 15, critRate: lerpf(0.05, 0.15, lv, m), range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Dragon Knight (third job) ----------
  dragonmastery: skill({
    id: 'dragonmastery', name: 'Dragon Mastery', job: 'dragonknight', type: 'passive', fx: null,
    desc: 'Dragon blood: more mastery, weapon attack, and max HP.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 30, lv, m), maxHpPct: lerpf(0.05, 0.25, lv, m) } }),
  }),
  dragonbreath: skill({
    id: 'dragonbreath', name: 'Dragon Breath', job: 'dragonknight', type: 'attack', fx: 'beam', school: 'dragon', lock: 0.6,
    desc: 'Roar out a torrent of dragon fire that scorches every monster in front of you.',
    at: (lv, m) => ({ mp: lerp(22, 44, lv, m), pct: lerp(180, 330, lv, m), hits: 1, targets: 8, range: { w: 300, h: 80 }, delay: 0.15 }),
  }),
  skyspear: skill({
    id: 'skyspear', name: 'Sky Spear', job: 'dragonknight', type: 'attack', fx: 'quake', school: 'dragon', lock: 0.7,
    desc: 'Leap high and plunge your spear into the ground: a crimson shockwave stuns everything nearby.',
    at: (lv, m) => ({ mp: lerp(24, 46, lv, m), pct: lerp(260, 420, lv, m), hits: 1, targets: 6, range: { w: 240, h: 110, around: true }, delay: 0.3, stun: lerpf(1.5, 3, lv, m) }),
  }),
  dragonblood: skill({
    id: 'dragonblood', name: 'Dragon Blood', job: 'dragonknight', type: 'buff', fx: 'buff', school: 'dragon', lock: 0.5,
    desc: 'Awaken the dragon inside: weapon attack and max HP surge.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { watk: lerp(12, 40, lv, m), maxHpPct: lerpf(0.1, 0.3, lv, m) } }),
  }),
  dragonroar: skill({
    id: 'dragonroar', name: "Dragon's Roar", job: 'dragonknight', type: 'attack', fx: 'dragon', school: 'dragon', ultimate: true, lock: 1.1,
    desc: 'A colossal crimson dragon tears across the screen, striking up to 15 monsters twice and stunning them.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(300, 510, lv, m), hits: 2, targets: 15, stun: 2, range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Paladin (third job) ----------
  paladinmastery: skill({
    id: 'paladinmastery', name: 'Paladin Mastery', job: 'paladin', type: 'passive', fx: null,
    desc: 'Holy steel: more mastery, weapon attack, and weapon defense.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 25, lv, m), wdef: lerp(20, 100, lv, m) } }),
  }),
  holycharge: skill({
    id: 'holycharge', name: 'Holy Charge', job: 'paladin', type: 'blink', fx: 'charge', school: 'holy', lock: 0.4,
    desc: 'Charge through a crowd wrapped in light, smiting up to eight monsters and stunning them.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), distance: lerp(120, 180, lv, m), pct: lerp(200, 340, lv, m), hits: 1, targets: 8, stun: 1.5 }),
  }),
  sacredcross: skill({
    id: 'sacredcross', name: 'Sacred Cross', job: 'paladin', type: 'attack', fx: 'shiningray', hitFx: 'xslash', school: 'holy', lock: 0.55,
    desc: 'Carve a blazing cross of light into every monster around you.',
    at: (lv, m) => ({ mp: lerp(24, 46, lv, m), pct: lerp(220, 380, lv, m), hits: 2, targets: 8, range: { w: 280, h: 150, around: true }, delay: 0.2 }),
  }),
  holyaegis: skill({
    id: 'holyaegis', name: 'Holy Aegis', job: 'paladin', type: 'buff', fx: 'shield', school: 'holy', lock: 0.5,
    desc: 'A shield of light: huge defense, avoid, and max HP.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { wdef: lerp(40, 140, lv, m), eva: lerp(10, 40, lv, m), maxHpPct: lerpf(0.15, 0.45, lv, m) } }),
  }),
  heavenshammer: skill({
    id: 'heavenshammer', name: "Heaven's Hammer", job: 'paladin', type: 'attack', fx: 'hammer', school: 'holy', ultimate: true, lock: 1.1,
    desc: 'A gigantic hammer of light falls from the heavens, crushing up to 15 monsters twice and stunning them.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(290, 500, lv, m), hits: 2, targets: 15, stun: 2.5, range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Hunter (archer branch) ----------
  huntmastery: skill({
    id: 'huntmastery', name: 'Hunter Mastery', job: 'hunter', type: 'passive', fx: null,
    desc: 'Steadier shots: raises minimum damage and accuracy.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), acc: lerp(2, 20, lv, m) } }),
  }),
  snareshot: skill({
    id: 'snareshot', name: 'Snare Shot', job: 'hunter', type: 'attack', fx: 'bigarrow', school: 'nature', lock: 0.4,
    desc: 'An arrow trailing vines that wraps the monster up so it can\'t move or hurt you.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), pct: lerp(170, 300, lv, m), hits: 1, targets: 1, range: { w: 320, h: 60 }, projectile: true, stun: lerpf(1.5, 3, lv, m) }),
  }),
  thorntrap: skill({
    id: 'thorntrap', name: 'Thorn Trap', job: 'hunter', type: 'attack', fx: 'quake', school: 'nature', lock: 0.5,
    desc: 'Brambles burst out of the ground under a group. Everything caught bleeds for a while.',
    at: (lv, m) => ({ mp: lerp(16, 32, lv, m), pct: lerp(110, 210, lv, m), hits: 1, targets: 6, range: { w: 260, h: 80 }, delay: 0.15, bleed: { pct: lerpf(0.25, 0.5, lv, m), secs: lerp(4, 8, lv, m) } }),
  }),
  huntersmark: skill({
    id: 'huntersmark', name: "Hunter's Instinct", job: 'hunter', type: 'buff', fx: 'buff', school: 'nature',
    desc: 'Sharpen your senses: more accuracy, speed, and weapon attack.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { acc: lerp(5, 30, lv, m), speed: lerp(5, 20, lv, m), watk: lerp(4, 18, lv, m) } }),
  }),

  // ---------- Windwalker (third job) ----------
  windmastery: skill({
    id: 'windmastery', name: 'Windwalker Mastery', job: 'windwalker', type: 'passive', fx: null,
    desc: 'One with the wind: more mastery, weapon attack, and critical rate.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 25, lv, m), critRate: lerpf(0.02, 0.12, lv, m) } }),
  }),
  hurricane: skill({
    id: 'hurricane', name: 'Hurricane', job: 'windwalker', type: 'attack', fx: 'bigarrow', school: 'wind', lock: 0.55,
    desc: 'Seven wind-wrapped arrows in a single breath at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(16, 34, lv, m), pct: lerp(65, 110, lv, m), hits: 7, targets: 1, range: { w: 340, h: 60 }, projectile: true }),
  }),
  galearrow: skill({
    id: 'galearrow', name: 'Gale Arrow', job: 'windwalker', type: 'attack', fx: 'wave', school: 'wind', lock: 0.5,
    desc: 'An arrow that becomes a howling crescent of wind, cutting through every monster in a line.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), pct: lerp(210, 360, lv, m), hits: 1, targets: 8, range: { w: 400, h: 70 }, projectile: true }),
  }),
  windspirit: skill({
    id: 'windspirit', name: 'Wind Spirit', job: 'windwalker', type: 'buff', fx: 'buff', school: 'wind', lock: 0.5,
    desc: 'The wind carries you: faster shots, faster feet, and more avoid.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { attackSpeed: lerpf(0.1, 0.25, lv, m), speed: lerp(10, 30, lv, m), eva: lerp(10, 40, lv, m) } }),
  }),
  arrowstorm: skill({
    id: 'arrowstorm', name: 'Arrow Storm', job: 'windwalker', type: 'attack', fx: 'rain', variant: 'arrow', school: 'wind', ultimate: true, lock: 1.1,
    desc: 'Fire one arrow into the sky and it comes back as a storm, striking up to 15 monsters twice.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(290, 500, lv, m), hits: 2, targets: 15, critRate: lerpf(0.05, 0.15, lv, m), range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Deadeye (third job) ----------
  deadeyemastery: skill({
    id: 'deadeyemastery', name: 'Deadeye Mastery', job: 'deadeye', type: 'passive', fx: null,
    desc: 'Perfect aim: more mastery, critical rate, and critical damage.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), critRate: lerpf(0.03, 0.15, lv, m), critDamage: lerpf(0.05, 0.35, lv, m) } }),
  }),
  railshot: skill({
    id: 'railshot', name: 'Piercing Ray', job: 'deadeye', type: 'attack', fx: 'beam', school: 'steel', lock: 0.6,
    desc: 'A bolt so fast it becomes a ray of light, piercing up to ten monsters in a line.',
    at: (lv, m) => ({ mp: lerp(22, 44, lv, m), pct: lerp(240, 400, lv, m), hits: 1, targets: 10, range: { w: 460, h: 44 }, delay: 0.1 }),
  }),
  fragbolt: skill({
    id: 'fragbolt', name: 'Frag Bolt', job: 'deadeye', type: 'attack', fx: 'bomb', school: 'fire', lock: 0.5,
    desc: 'A bolt packed with powder that bursts into shrapnel across a group.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), pct: lerp(190, 330, lv, m), hits: 1, targets: 6, range: { w: 340, h: 90 }, projectile: true }),
  }),
  eagleeye: skill({
    id: 'eagleeye', name: 'Eagle Eye', job: 'deadeye', type: 'buff', fx: 'buff', school: 'steel', lock: 0.5,
    desc: 'Lock on: critical rate and critical damage soar.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { critRate: lerpf(0.1, 0.3, lv, m), critDamage: lerpf(0.1, 0.4, lv, m) } }),
  }),
  finalshot: skill({
    id: 'finalshot', name: 'Final Shot', job: 'deadeye', type: 'attack', fx: 'beam', school: 'steel', ultimate: true, lock: 1.1,
    desc: 'Charge one perfect shot that splits the screen in two, striking up to 15 monsters twice. Huge criticals.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(300, 520, lv, m), hits: 2, targets: 15, critRate: lerpf(0.2, 0.4, lv, m), range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Beastmaster (third job) ----------
  beastmastery: skill({
    id: 'beastmastery', name: 'Beastmaster Mastery', job: 'beastmaster', type: 'passive', fx: null,
    desc: 'Pack instincts: more mastery, weapon attack, and max HP.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 25, lv, m), maxHpPct: lerpf(0.05, 0.2, lv, m) } }),
  }),
  feralclaw: skill({
    id: 'feralclaw', name: 'Feral Claws', job: 'beastmaster', type: 'attack', fx: 'quake', hitFx: 'claw', school: 'nature', lock: 0.5,
    desc: 'Spirit beasts rake every monster in front of you with glowing claws. They bleed for a while.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), pct: lerp(150, 270, lv, m), hits: 3, targets: 5, range: { w: 240, h: 90 }, delay: 0.15, bleed: { pct: lerpf(0.2, 0.4, lv, m), secs: lerp(4, 8, lv, m) } }),
  }),
  thunderhawk: skill({
    id: 'thunderhawk', name: 'Thunder Hawk', job: 'beastmaster', type: 'buff', fx: 'buff', icon: 'hawk', school: 'nature', lock: 0.8,
    desc: 'A great hawk swoops down to ride beside you and dives at nearby monsters on its own.',
    at: (lv, m) => ({
      mp: lerp(60, 110, lv, m), duration: lerp(60, 180, lv, m), buff: {},
      summon: { art: 'hawk', every: 2, power: lerp(150, 290, lv, m), targets: 5, range: { w: 420, h: 220, around: true }, fx: 'feather', school: 'nature', physical: true },
    }),
  }),
  callwild: skill({
    id: 'callwild', name: 'Call of the Wild', job: 'beastmaster', type: 'buff', fx: 'buff', school: 'nature', lock: 0.5,
    desc: 'Howl with the pack: weapon attack, speed, and avoid.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { watk: lerp(12, 40, lv, m), speed: lerp(10, 30, lv, m), eva: lerp(5, 30, lv, m) } }),
  }),
  wildhunt: skill({
    id: 'wildhunt', name: 'Wild Hunt', job: 'beastmaster', type: 'attack', fx: 'stampede', school: 'nature', ultimate: true, lock: 1.1,
    desc: 'A spirit pack of wolves stampedes across the screen, mauling up to 15 monsters twice. They bleed after.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(290, 500, lv, m), hits: 2, targets: 15, bleed: { pct: 0.3, secs: 6 }, range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Trickster (thief branch) ----------
  trickmastery: skill({
    id: 'trickmastery', name: 'Trickster Mastery', job: 'trickster', type: 'passive', fx: null,
    desc: 'Nimble fingers: raises minimum damage and avoid.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), eva: lerp(3, 25, lv, m) } }),
  }),
  cointoss: skill({
    id: 'cointoss', name: 'Coin Toss', job: 'trickster', type: 'attack', fx: 'coin', school: 'gold',
    desc: 'Flick two spinning gold coins at the nearest monster. They hit like bricks.',
    at: (lv, m) => ({ mp: lerp(8, 20, lv, m), pct: lerp(95, 165, lv, m), hits: 2, targets: 1, range: { w: 300, h: 60 }, projectile: true }),
  }),
  smokebomb: skill({
    id: 'smokebomb', name: 'Smoke Bomb', job: 'trickster', type: 'attack', fx: 'smoke', school: 'shadow', lock: 0.5,
    desc: 'Pop a smoke bomb at your feet. Every monster around you is left dizzy and seeing stars.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(80, 150, lv, m), hits: 1, targets: 6, range: { w: 220, h: 110, around: true }, delay: 0.15, stun: lerpf(1.5, 3, lv, m) }),
  }),
  luckycharm: skill({
    id: 'luckycharm', name: 'Lucky Charm', job: 'trickster', type: 'buff', fx: 'buff', school: 'gold',
    desc: 'Lady Luck smiles on you: critical rate and avoid.',
    at: (lv, m) => ({ mp: lerp(12, 24, lv, m), duration: lerp(60, 200, lv, m), buff: { critRate: lerpf(0.05, 0.2, lv, m), eva: lerp(5, 30, lv, m) } }),
  }),

  // ---------- Blade Dancer (third job) ----------
  dancermastery: skill({
    id: 'dancermastery', name: 'Blade Dancer Mastery', job: 'bladedancer', type: 'passive', fx: null,
    desc: 'Flowing steps: more mastery, weapon attack, and avoid.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 25, lv, m), eva: lerp(5, 30, lv, m) } }),
  }),
  phantomedge: skill({
    id: 'phantomedge', name: 'Phantom Edge', job: 'bladedancer', type: 'blink', fx: 'charge', hitFx: 'xslash', school: 'sakura', lock: 0.35,
    desc: 'Vanish and reappear on the far side of a crowd, cutting through up to six monsters twice.',
    at: (lv, m) => ({ mp: lerp(18, 36, lv, m), distance: lerp(120, 170, lv, m), pct: lerp(150, 260, lv, m), hits: 2, targets: 6 }),
  }),
  blossomdance: skill({
    id: 'blossomdance', name: 'Blossom Dance', job: 'bladedancer', type: 'attack', fx: 'vortex', school: 'sakura', lock: 0.6,
    desc: 'Spin through a whirlwind of petals and blades, hitting everything around you three times.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), pct: lerp(95, 165, lv, m), hits: 3, targets: 8, range: { w: 240, h: 110, around: true } }),
  }),
  shadowpartner: skill({
    id: 'shadowpartner', name: 'Shadow Partner', job: 'bladedancer', type: 'buff', fx: 'buff', school: 'shadow', lock: 0.5,
    desc: 'Your shadow fights alongside you: weapon attack and attack speed.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { watk: lerp(10, 35, lv, m), attackSpeed: lerpf(0.1, 0.25, lv, m) } }),
  }),
  bladefury: skill({
    id: 'bladefury', name: 'Blade Fury', job: 'bladedancer', type: 'attack', fx: 'bladestorm', school: 'sakura', ultimate: true, lock: 1.1,
    desc: 'Time stops. A hundred afterimages slash through up to 15 monsters twice in a storm of petals.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(300, 520, lv, m), hits: 2, targets: 15, critRate: lerpf(0.05, 0.2, lv, m), range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Nightstalker (third job) ----------
  nightmastery: skill({
    id: 'nightmastery', name: 'Nightstalker Mastery', job: 'nightstalker', type: 'passive', fx: null,
    desc: 'Born of the dark: more mastery, weapon attack, and critical rate.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 25, lv, m), critRate: lerpf(0.02, 0.12, lv, m) } }),
  }),
  darkshuriken: skill({
    id: 'darkshuriken', name: 'Dark Shuriken', job: 'nightstalker', type: 'attack', fx: 'bigstar', school: 'shadow', lock: 0.5,
    desc: 'Four huge shuriken wreathed in shadow at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(16, 34, lv, m), pct: lerp(110, 190, lv, m), hits: 4, targets: 1, range: { w: 340, h: 60 }, projectile: true }),
  }),
  shadowweb: skill({
    id: 'shadowweb', name: 'Shadow Web', job: 'nightstalker', type: 'attack', fx: 'smoke', school: 'shadow', lock: 0.55,
    desc: 'Threads of darkness bind every monster in front of you so they can\'t move.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), pct: lerp(130, 240, lv, m), hits: 1, targets: 8, range: { w: 280, h: 100 }, delay: 0.2, stun: lerpf(2, 3.5, lv, m) }),
  }),
  nightveil: skill({
    id: 'nightveil', name: 'Night Veil', job: 'nightstalker', type: 'buff', fx: 'buff', school: 'shadow', lock: 0.5,
    desc: 'Wrap yourself in night: avoid and critical rate.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { eva: lerp(15, 50, lv, m), critRate: lerpf(0.05, 0.2, lv, m) } }),
  }),
  shurikentempest: skill({
    id: 'shurikentempest', name: 'Shuriken Tempest', job: 'nightstalker', type: 'attack', fx: 'rain', variant: 'star', school: 'shadow', ultimate: true, lock: 1.1,
    desc: 'The night sky fills with spinning shadow stars that rain on up to 15 monsters, twice.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(290, 510, lv, m), hits: 2, targets: 15, critRate: lerpf(0.05, 0.15, lv, m), range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),

  // ---------- Phantom Thief (third job) ----------
  phantommastery: skill({
    id: 'phantommastery', name: 'Phantom Thief Mastery', job: 'phantomthief', type: 'passive', fx: null,
    desc: 'Sleight of hand: more mastery, weapon attack, and critical rate.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.5, 0.75, lv, m), watk: lerp(5, 25, lv, m), critRate: lerpf(0.02, 0.12, lv, m) } }),
  }),
  blitz: skill({
    id: 'blitz', name: 'Pickpocket Blitz', job: 'phantomthief', type: 'attack', fx: 'flurry', hitFx: 'xslash', school: 'gold', lock: 0.55,
    desc: 'Six lightning-fast swipes at one monster. Gold sparks fly off every hit.',
    at: (lv, m) => ({ mp: lerp(16, 34, lv, m), pct: lerp(80, 140, lv, m), hits: 6, targets: 1, range: { w: 110, h: 64 } }),
  }),
  bombtoss: skill({
    id: 'bombtoss', name: 'Bomb Toss', job: 'phantomthief', type: 'attack', fx: 'bomb', school: 'fire', lock: 0.5,
    desc: 'Lob a cartoon bomb that blows a whole group sky-high.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), pct: lerp(190, 330, lv, m), hits: 1, targets: 6, range: { w: 300, h: 90 }, projectile: true, stun: 1 }),
  }),
  mirage: skill({
    id: 'mirage', name: 'Mirage', job: 'phantomthief', type: 'buff', fx: 'buff', school: 'gold', lock: 0.5,
    desc: 'Leave decoys everywhere: huge avoid and speed.',
    at: (lv, m) => ({ mp: lerp(30, 60, lv, m), duration: lerp(60, 240, lv, m), buff: { eva: lerp(20, 60, lv, m), speed: lerp(10, 30, lv, m) } }),
  }),
  jackpot: skill({
    id: 'jackpot', name: 'Jackpot', job: 'phantomthief', type: 'attack', fx: 'rain', variant: 'coin', school: 'gold', ultimate: true, lock: 1.1,
    desc: 'Hit the jackpot: a downpour of giant gold coins crashes onto up to 15 monsters, twice.',
    at: (lv, m) => ({ mp: lerp(70, 120, lv, m), pct: lerp(300, 520, lv, m), hits: 2, targets: 15, critRate: lerpf(0.1, 0.25, lv, m), range: { w: 620, h: 320, around: true }, delay: 0.4 }),
  }),
};

// Numbers for `skillId` at `level`, with the skill's max level passed through for scaling.
export function skillAt(skillId, level) {
  const s = SKILLS[skillId];
  return { ...s.at(level, s.maxLevel), lock: s.lock };
}

export function skillsForJob(jobId) {
  return Object.values(SKILLS).filter((s) => s.job === jobId);
}
