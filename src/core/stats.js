// Derived stats: base stats + equipment + passive skills + active buffs.
// Everything that needs "the player's real numbers" calls computeStats().

import { ITEMS } from '../data/items.js';
import { SETS } from '../data/sets.js';
import { SKILLS, skillAt } from '../data/skills.js';
import { jobChain, JOBS } from '../data/jobs.js';
import { thrownStars } from './items.js';

const FIST_WATK = 6; // bare hands still do a little damage
const BASE_MASTERY = 0.1;

const ZERO = () => ({
  str: 0, dex: 0, int: 0, luk: 0, watk: 0, matk: 0, wdef: 0, mdef: 0, acc: 0, eva: 0,
  hp: 0, mp: 0, speed: 0, jump: 0,
});

// Sums the stat bonuses on every equipped item (rolled stats plus scroll upgrades).
export function equipmentBonus(equipment) {
  const total = ZERO();
  for (const inst of Object.values(equipment)) {
    if (!inst) continue;
    for (const [k, v] of Object.entries(inst.stats)) total[k] = (total[k] ?? 0) + v;
  }
  return total;
}

// Gear sets: how many pieces of each set are worn, and the bonuses they've reached.
export function setsWorn(equipment) {
  const count = {};
  for (const inst of Object.values(equipment ?? {})) {
    const set = inst && ITEMS[inst.id]?.set;
    if (set) count[set] = (count[set] ?? 0) + 1;
  }
  return count;
}
export function setBonus(equipment) {
  const out = {};
  for (const [set, n] of Object.entries(setsWorn(equipment))) {
    for (const [at, bonus] of Object.entries(SETS[set].bonus)) {
      if (n < Number(at)) continue;
      for (const [k, v] of Object.entries(bonus)) out[k] = (out[k] ?? 0) + v;
    }
  }
  return out;
}

// Passive bonuses from every learned passive in the character's job chain. A weapon's own passive
// (`weapons`, like Dagger Mastery) only counts while that weapon is held.
export function passiveBonus(char) {
  const chain = new Set(jobChain(char.job));
  const weapon = char.equipment ? weaponTypeOf(char) : null;
  const out = {};
  for (const [id, lv] of Object.entries(char.skills)) {
    const s = SKILLS[id];
    if (!s || s.type !== 'passive' || lv <= 0 || !chain.has(s.job)) continue;
    if (s.weapons && weapon && !s.weapons.includes(weapon)) continue;
    for (const [k, v] of Object.entries(skillAt(id, lv).passive)) {
      // Mastery doesn't stack between books; the best one wins.
      out[k] = k === 'mastery' ? Math.max(out[k] ?? 0, v) : (out[k] ?? 0) + v;
    }
  }
  return out;
}

// Active buffs, as a merged bonus object. `now` is game time in seconds.
export function buffBonus(char, now) {
  const out = {};
  for (const b of Object.values(char.buffs ?? {})) {
    if (b.until <= now) continue;
    for (const [k, v] of Object.entries(b.values)) out[k] = (out[k] ?? 0) + v;
  }
  return out;
}

export function weaponTypeOf(char) {
  const w = char.equipment.weapon;
  return w ? ITEMS[w.id].weaponType : 'none';
}

export function computeStats(char, now = 0) {
  const eq = equipmentBonus(char.equipment);
  const pas = passiveBonus(char);
  const buf = buffBonus(char, now);
  const set = setBonus(char.equipment);
  const get = (k) => (eq[k] ?? 0) + (pas[k] ?? 0) + (buf[k] ?? 0) + (set[k] ?? 0);

  const str = char.base.str + get('str');
  const dex = char.base.dex + get('dex');
  const int = char.base.int + get('int');
  const luk = char.base.luk + get('luk');

  const hasWeapon = Boolean(char.equipment.weapon);
  const maxHpPct = (pas.maxHpPct ?? 0) + (buf.maxHpPct ?? 0);
  const maxMpPct = (pas.maxMpPct ?? 0) + (buf.maxMpPct ?? 0);

  return {
    str, dex, int, luk,
    // A gauntlet hits as hard as the stars it throws.
    watk: (hasWeapon ? 0 : FIST_WATK) + get('watk') + (thrownStars(char)?.watk ?? 0),
    matk: get('matk'),
    wdef: Math.floor(str / 4) + get('wdef'),
    mdef: Math.floor(int / 4) + get('mdef'),
    acc: get('acc'),
    eva: get('eva'),
    maxHp: Math.round((char.baseHp + get('hp')) * (1 + maxHpPct)),
    maxMp: Math.round((char.baseMp + get('mp')) * (1 + maxMpPct)),
    speed: 100 + get('speed'),
    jump: 100 + get('jump'),
    // The job's damage tuning (data/jobs.js `power`): how hard it hits for its role.
    power: JOBS[char.job]?.power ?? 1,
    // How much of its damage carries to a crowd (world.js): hits on the monsters past the first.
    spread: JOBS[char.job]?.spread ?? 1,
    // A tank's steadiness (data/jobs.js `guard`): the share of every hit it actually takes.
    guard: JOBS[char.job]?.guard ?? 1,
    mastery: Math.max(BASE_MASTERY, pas.mastery ?? 0),
    critRate: (pas.critRate ?? 0) + (buf.critRate ?? 0) + (set.critRate ?? 0),
    critDamage: (pas.critDamage ?? 0) + (buf.critDamage ?? 0) + (set.critDamage ?? 0),
    attackSpeed: Math.min(0.5, (pas.attackSpeed ?? 0) + (buf.attackSpeed ?? 0)),
    manaShield: buf.manaShield ?? 0,
    restRegen: pas.restRegen ?? 0,
    mpRegen: pas.mpRegen ?? 0,
    weaponType: weaponTypeOf(char),
  };
}
