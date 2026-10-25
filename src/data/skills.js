// Skill books. Each skill's numbers come from `at(level)`, so balance lives in one place.
//
// Types:
//   attack  - weapon damage (pct is % of a basic hit)
//   magic   - spell damage (power is % of magic attack)
//   heal    - restores HP and smites monsters in range with holy damage
//   buff    - timed bonuses; `buff` keys are added to the player's stats while active
//   passive - always-on bonuses once learned
//
// Range: `w`/`h` is the hit box in front of the player. `projectile` skills hit the nearest
// targets within range and draw a flying shot.

const lerp = (a, b, lv, max) => Math.round(a + ((b - a) * (lv - 1)) / Math.max(1, max - 1));
const lerpf = (a, b, lv, max) => a + ((b - a) * (lv - 1)) / Math.max(1, max - 1);

function skill(def) {
  return { maxLevel: 20, cooldown: 0, ...def };
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
  vigor: skill({
    id: 'vigor', name: 'Vigor', job: 'warrior', type: 'passive', fx: null,
    desc: 'Raises max HP and HP recovery.',
    at: (lv, m) => ({ passive: { maxHpPct: lerpf(0.02, 0.2, lv, m), restRegen: lerp(2, 20, lv, m) } }),
  }),

  // ---------- Mage ----------
  magicbolt: skill({
    id: 'magicbolt', name: 'Magic Bolt', job: 'mage', type: 'magic', fx: 'bolt',
    desc: 'Fire a bolt of magic at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(6, 14, lv, m), power: lerp(150, 280, lv, m), hits: 1, targets: 1, range: { w: 260, h: 60 }, projectile: true }),
  }),
  sparkburst: skill({
    id: 'sparkburst', name: 'Spark Burst', job: 'mage', type: 'magic', fx: 'burst',
    desc: 'A crackling burst that hits a group in front of you.',
    at: (lv, m) => ({ mp: lerp(12, 28, lv, m), power: lerp(80, 155, lv, m), hits: 1, targets: lerp(4, 6, lv, m), range: { w: 190, h: 90 } }),
  }),
  manashield: skill({
    id: 'manashield', name: 'Mana Shield', job: 'mage', type: 'buff', fx: 'shield',
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
    id: 'cleave', name: 'Cleave', job: 'blademaster', type: 'attack', fx: 'spin',
    desc: 'A huge sweep that hits a crowd.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(150, 300, lv, m), hits: 1, targets: 6, range: { w: 170, h: 80 } }),
  }),
  risingcombo: skill({
    id: 'risingcombo', name: 'Rising Combo', job: 'blademaster', type: 'attack', fx: 'flurry',
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
    id: 'sweep', name: 'Crescent Sweep', job: 'lancer', type: 'attack', fx: 'spin',
    desc: 'A long sweep that hits up to ten monsters.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(120, 235, lv, m), hits: 1, targets: lerp(6, 10, lv, m), range: { w: 230, h: 90 } }),
  }),
  dragonfang: skill({
    id: 'dragonfang', name: 'Dragon Fang', job: 'lancer', type: 'attack', fx: 'pierce',
    desc: 'A crushing thrust on one monster.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), pct: lerp(250, 430, lv, m), hits: 1, targets: 1, range: { w: 120, h: 60 } }),
  }),

  // ---------- Pyromancer ----------
  firemastery: skill({
    id: 'firemastery', name: 'Ember Mastery', job: 'pyromancer', type: 'passive', fx: null,
    desc: 'Steadier spells and more magic attack.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), matk: lerp(2, 20, lv, m) } }),
  }),
  meditate: skill({
    id: 'meditate', name: 'Meditate', job: 'pyromancer', type: 'buff', fx: 'buff',
    desc: 'Raises magic attack for a while.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(60, 200, lv, m), buff: { matk: lerp(5, 30, lv, m) } }),
  }),
  fireball: skill({
    id: 'fireball', name: 'Fireball', job: 'pyromancer', type: 'magic', fx: 'fire',
    desc: 'Hurl a fireball at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), power: lerp(200, 360, lv, m), hits: 1, targets: 1, range: { w: 300, h: 60 }, projectile: true }),
  }),
  blaze: skill({
    id: 'blaze', name: 'Blaze', job: 'pyromancer', type: 'magic', fx: 'blaze',
    desc: 'A wall of fire that hits everything in front of you.',
    at: (lv, m) => ({ mp: lerp(20, 40, lv, m), power: lerp(120, 240, lv, m), hits: 1, targets: 6, range: { w: 260, h: 120 } }),
  }),

  // ---------- Cleric ----------
  holymastery: skill({
    id: 'holymastery', name: 'Holy Mastery', job: 'cleric', type: 'passive', fx: null,
    desc: 'Steadier spells and more magic attack.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.15, 0.6, lv, m), matk: lerp(2, 16, lv, m) } }),
  }),
  bless: skill({
    id: 'bless', name: 'Bless', job: 'cleric', type: 'buff', fx: 'buff',
    desc: 'Raises defense, accuracy, and avoid.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), duration: lerp(60, 200, lv, m), buff: { wdef: lerp(5, 30, lv, m), acc: lerp(5, 25, lv, m), eva: lerp(5, 25, lv, m) } }),
  }),
  heal: skill({
    id: 'heal', name: 'Heal', job: 'cleric', type: 'heal', fx: 'heal', cooldown: 2,
    desc: 'Restore HP and burn nearby monsters with holy light.',
    at: (lv, m) => ({ mp: lerp(16, 34, lv, m), healPct: lerpf(0.15, 0.5, lv, m), power: lerp(70, 180, lv, m), hits: 1, targets: 5, range: { w: 220, h: 120, around: true } }),
  }),
  holybolt: skill({
    id: 'holybolt', name: 'Holy Bolt', job: 'cleric', type: 'magic', fx: 'holy',
    desc: 'A spear of light at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(12, 26, lv, m), power: lerp(210, 370, lv, m), hits: 1, targets: 1, range: { w: 300, h: 60 }, projectile: true }),
  }),

  // ---------- Inferno Sage (third job) ----------
  infernomastery: skill({
    id: 'infernomastery', name: 'Inferno Mastery', job: 'infernosage', type: 'passive', fx: null,
    desc: 'Steadier, fiercer spells: more mastery, magic attack, and critical damage.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.7, lv, m), matk: lerp(10, 40, lv, m), critDamage: lerpf(0.05, 0.3, lv, m) } }),
  }),
  overload: skill({
    id: 'overload', name: 'Arcane Overload', job: 'infernosage', type: 'buff', fx: 'buff',
    desc: 'Pour raw mana into every spell: big magic attack and critical rate.',
    at: (lv, m) => ({ mp: lerp(40, 80, lv, m), duration: lerp(60, 240, lv, m), buff: { matk: lerp(15, 50, lv, m), critRate: lerpf(0.05, 0.2, lv, m) } }),
  }),
  shadowcross: skill({
    id: 'shadowcross', name: 'Shadow Cross', job: 'infernosage', type: 'buff', fx: 'buff',
    desc: 'Summon a dark cross that floats beside you and blasts nearby monsters on its own.',
    at: (lv, m) => ({
      mp: lerp(60, 110, lv, m), duration: lerp(60, 180, lv, m), buff: {},
      summon: { art: 'cross', every: 2.4, power: lerp(160, 300, lv, m), targets: 6, range: { w: 420, h: 220, around: true }, fx: 'darkbolt' },
    }),
  }),
  meteor: skill({
    id: 'meteor', name: 'Meteor Shower', job: 'infernosage', type: 'magic', fx: 'meteor',
    desc: 'Rain blazing meteors on up to 15 monsters across a huge area, twice.',
    at: (lv, m) => ({
      mp: lerp(70, 120, lv, m), power: lerp(290, 520, lv, m), hits: 2, targets: 15,
      range: { w: 620, h: 320, around: true }, critRate: lerpf(0.05, 0.15, lv, m), delay: 0.4,
    }),
  }),

  // ---------- Seraph (third job) ----------
  seraphmastery: skill({
    id: 'seraphmastery', name: 'Seraph Mastery', job: 'seraph', type: 'passive', fx: null,
    desc: 'Steadier, brighter spells: more mastery, magic attack, and critical rate.',
    at: (lv, m) => ({ passive: { mastery: lerpf(0.4, 0.7, lv, m), matk: lerp(10, 36, lv, m), critRate: lerpf(0.02, 0.12, lv, m) } }),
  }),
  sanctuary: skill({
    id: 'sanctuary', name: 'Sanctuary', job: 'seraph', type: 'buff', fx: 'shield',
    desc: 'A halo of light: huge defense, avoid, and max HP.',
    at: (lv, m) => ({ mp: lerp(40, 80, lv, m), duration: lerp(60, 240, lv, m), buff: { wdef: lerp(30, 120, lv, m), eva: lerp(10, 40, lv, m), maxHpPct: lerpf(0.1, 0.4, lv, m) } }),
  }),
  guardianangel: skill({
    id: 'guardianangel', name: 'Guardian Angel', job: 'seraph', type: 'buff', fx: 'buff',
    desc: 'Summon an angel that floats beside you and strikes nearby monsters with light.',
    at: (lv, m) => ({
      mp: lerp(60, 110, lv, m), duration: lerp(60, 180, lv, m), buff: {},
      summon: { art: 'angel', every: 2.2, power: lerp(150, 280, lv, m), targets: 6, range: { w: 420, h: 220, around: true }, fx: 'holy' },
    }),
  }),
  judgment: skill({
    id: 'judgment', name: 'Radiant Judgment', job: 'seraph', type: 'magic', fx: 'judgment',
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
    id: 'bombarrow', name: 'Bomb Arrow', job: 'ranger', type: 'attack', fx: 'bomb',
    desc: 'An arrow that bursts and hits the whole group.',
    at: (lv, m) => ({ mp: lerp(14, 28, lv, m), pct: lerp(150, 280, lv, m), hits: 1, targets: 6, range: { w: 300, h: 90 }, projectile: true }),
  }),
  multishot: skill({
    id: 'multishot', name: 'Multi Shot', job: 'ranger', type: 'attack', fx: 'arrow',
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
    id: 'piercebolt', name: 'Pierce Bolt', job: 'marksman', type: 'attack', fx: 'pierce',
    desc: 'A bolt that flies through every monster in a line.',
    at: (lv, m) => ({ mp: lerp(14, 30, lv, m), pct: lerp(160, 300, lv, m), hits: 1, targets: 8, range: { w: 420, h: 40 }, projectile: true }),
  }),
  snipe: skill({
    id: 'snipe', name: 'Snipe', job: 'marksman', type: 'attack', fx: 'arrow', cooldown: 1.5,
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
    id: 'flurry', name: 'Flurry', job: 'duelist', type: 'attack', fx: 'flurry',
    desc: 'A blur of stabs on one monster.',
    at: (lv, m) => ({ mp: lerp(12, 28, lv, m), pct: lerp(60, 110, lv, m), hits: lerp(4, 6, lv, m), targets: 1, range: { w: 85, h: 60 } }),
  }),
  shadowstrike: skill({
    id: 'shadowstrike', name: 'Shadow Strike', job: 'duelist', type: 'attack', fx: 'spin',
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
    id: 'triplestar', name: 'Triple Star', job: 'shadow', type: 'attack', fx: 'star',
    desc: 'Three stars at the nearest monster.',
    at: (lv, m) => ({ mp: lerp(10, 24, lv, m), pct: lerp(80, 150, lv, m), hits: 3, targets: 1, range: { w: 320, h: 60 }, projectile: true }),
  }),
  shurikenstorm: skill({
    id: 'shurikenstorm', name: 'Shuriken Storm', job: 'shadow', type: 'attack', fx: 'star',
    desc: 'A storm of stars that hits a whole group.',
    at: (lv, m) => ({ mp: lerp(16, 32, lv, m), pct: lerp(100, 195, lv, m), hits: 1, targets: 5, range: { w: 300, h: 90 }, projectile: true }),
  }),
};

// Numbers for `skillId` at `level`, with the skill's max level passed through for scaling.
export function skillAt(skillId, level) {
  const s = SKILLS[skillId];
  return { ...s.at(level, s.maxLevel), cooldown: s.cooldown };
}

export function skillsForJob(jobId) {
  return Object.values(SKILLS).filter((s) => s.job === jobId);
}
