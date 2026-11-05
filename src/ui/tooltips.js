// Tooltip lines for items and skills.

import { SETS } from '../data/sets.js';
import { setsWorn, computeStats } from '../core/stats.js';
import { physicalRange, magicRange } from '../core/formulas.js';
import { ITEMS, RARITIES, ELEMENT_NAMES, variantsFor, gauntletStars } from '../data/items.js';
import { itemName } from '../core/items.js';
import { SKILLS, skillAt } from '../data/skills.js';
import { JOBS } from '../data/jobs.js';
import { COLORS } from './kit.js';
import { QUALITIES } from '../data/crafting.js';

const STAT_NAMES = {
  watk: 'Weapon ATK', matk: 'Magic ATK', wdef: 'Weapon DEF', mdef: 'Magic DEF', str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK',
  hp: 'Max HP', mp: 'Max MP', acc: 'Accuracy', eva: 'Avoid', speed: 'Speed', jump: 'Jump', critRate: 'Crit rate', critDamage: 'Crit damage',
};

// Shops pay the full price for monster drops and finds, 40% for potions and food, and a tenth
// for gear (gear is dear to buy, and it drops often enough that it must not out-earn hunting).
export function sellPrice(id, inst = null) {
  const def = ITEMS[id];
  const price = def.price || 0;
  return Math.max(1, Math.floor(price * (def.type === 'etc' ? 1 : def.type === 'equip' ? 0.1 : 0.4)));
}

const SLOT_LOOKS = { hat: 'hat', top: 'top', bottom: 'bottom', shoes: 'shoes', gloves: 'gloves', cape: 'cape', earring: 'earrings', weapon: 'weapon' };

export function itemTooltip(char, id, inst = null) {
  const def = ITEMS[id];
  if (def.type === 'cash') return cashTooltip(def, inst);
  const lines = [];
  const rarity = RARITIES[inst?.rarity ?? 0];
  lines.push({ text: itemName(inst ?? id), bold: true, size: 10, color: rarity.color ?? COLORS.ink });
  const v = inst?.variant ? variantsFor(def)?.[inst.variant] : null;
  if (v) lines.push({ text: `◆ ${v.name} color`, bold: true, color: v.main === '#f3f0ea' || v.main === '#e8fbff' ? '#9a8fb8' : v.main });
  if (inst?.rarity) lines.push({ text: `★ ${rarity.name}`, bold: true, color: rarity.color });
  if (inst?.polish) lines.push({ text: `✦ Polished +${inst.polish}`, bold: true, color: '#e8a23c' });
  // Bench-made (data/crafting.js): its quality, or the Artisan line it belongs to.
  if (inst?.quality != null) lines.push({ text: `⚒ ${QUALITIES[inst.quality].name} craft`, bold: true, color: QUALITIES[inst.quality].color });
  else if (def.crafted && def.type === 'equip') lines.push({ text: '⚒ Made at a craft bench', bold: true, color: '#3fb383' });
  // Crafted for someone by a friend (world/coop-life.js).
  if (inst?.madeBy) lines.push({ text: `♥ Made by ${inst.madeBy}`, bold: true, color: '#e0609a' });
  if (def.unique) lines.push({ text: '♥ Unique look', bold: true, color: '#e06fa8' });
  if (def.element) lines.push({ text: `✦ ${ELEMENT_NAMES[def.element]} element`, bold: true, color: def.color === '#ffe36b' ? '#d9a440' : def.color });
  if (def.type === 'equip') {
    const kind = def.slot === 'weapon' ? def.weaponType[0].toUpperCase() + def.weaponType.slice(1) : def.slot[0].toUpperCase() + def.slot.slice(1);
    lines.push({ text: kind, color: COLORS.muted });
    if (def.weaponType === 'gauntlet') {
      const st = gauntletStars(def.reqLevel);
      lines.push({ text: `Throws ${st.name}: attack +${st.watk}${st.element ? `, ${ELEMENT_NAMES[st.element]}` : ''}`, bold: true, color: '#9a7fd0' });
    }
    const lvOk = !char || char.level >= def.reqLevel;
    lines.push({ text: `Req. level ${def.reqLevel}`, color: lvOk ? COLORS.muted : COLORS.bad });
    if (def.family) {
      const ok = !char || JOBS[char.job].family === def.family || (def.starter && char.job === 'novice');
      const who = `${def.family[0].toUpperCase() + def.family.slice(1)}s`;
      lines.push({ text: def.starter ? `${who} and Novices` : `${who} only`, color: ok ? COLORS.muted : COLORS.bad });
    }
    const stats = inst?.stats ?? def.stats;
    for (const [k, v] of Object.entries(stats)) {
      const base = def.stats[k] ?? 0;
      const diff = v - base;
      lines.push({ text: `${STAT_NAMES[k] ?? k} +${v}${diff > 0 ? `  (+${diff})` : ''}`, color: diff > 0 ? '#3f9f5f' : COLORS.ink });
    }
    // A set piece: the set, how much of it you're wearing, and what each step gives.
    if (def.set) {
      const set = SETS[def.set];
      const worn = char ? setsWorn(char.equipment)[def.set] ?? 0 : 0;
      lines.push({ text: `${set.name} set (${worn}/4 worn)`, bold: true, color: set.color === '#ffffff' ? COLORS.ink : darkened(set.color) });
      for (const [at, bonus] of Object.entries(set.bonus)) {
        const words = Object.entries(bonus).map(([k, v]) => (k === 'critRate' || k === 'critDamage' ? `${STAT_NAMES[k] ?? k} +${Math.round(v * 100)}%` : `${STAT_NAMES[k] ?? k} +${v}`));
        // All four main stats read as one.
        const joined = ['str', 'dex', 'int', 'luk'].every((k) => bonus[k] === bonus.str) && bonus.str ? [`All stats +${bonus.str}`, ...words.slice(4)] : words;
        lines.push({ text: `${at} pieces: ${joined.join(', ')}`, size: 8, color: worn >= Number(at) ? '#3f9f5f' : COLORS.muted });
      }
    }
  } else if (def.star) {
    lines.push({ text: 'Throwing stars', color: COLORS.muted });
    lines.push({ text: `Req. level ${def.reqLevel}`, color: !char || char.level >= def.reqLevel ? COLORS.muted : COLORS.bad });
    lines.push({ text: `Attack +${def.star.watk}`, color: COLORS.ink });
    if (def.star.element) lines.push({ text: `✦ ${ELEMENT_NAMES[def.star.element]} element`, bold: true, color: def.color === '#ffe36b' || def.color === '#fff3b8' ? '#d9a440' : def.color });
    lines.push({ text: 'Never runs out: just one is enough.', color: COLORS.muted });
    lines.push({ text: 'The first set in your bag is thrown.', color: COLORS.muted });
  } else {
    if (def.life && char?.lifeTools?.[def.life.slot] === id) lines.push({ text: '⚒ Equipped', bold: true, color: '#3fb383' });
    if (def.desc) lines.push({ text: def.desc, color: COLORS.muted });
  }
  if (def.price) lines.push({ text: `Sells for ${sellPrice(id, inst)} gold`, color: COLORS.gold, size: 8 });
  return lines;
}

// What a skill does at one level, in a line: "180% damage, 3 hits, up to 4 foes, 12 MP".
export function describeSkill(skillId, lv) {
  return describe(skillAt(skillId, lv));
}

function describe(params, tune = 1) {
  return describeParts(params, tune).join(', ');
}

const BUFF_NAMES = { attackSpeed: 'attack speed', manaShield: 'damage to MP', maxHpPct: 'max HP', critRate: 'crit rate', regenPct: 'HP every second', barrier: 'max HP as a barrier', dmgCut: 'less damage taken' };
const PCT_BUFFS = ['attackSpeed', 'manaShield', 'maxHpPct', 'critRate', 'regenPct', 'barrier', 'dmgCut'];
const buffParts = (buff, duration) => [
  ...Object.entries(buff).map(([k, v]) => `${k === 'barrier' || k === 'dmgCut' ? '' : '+'}${PCT_BUFFS.includes(k) ? `${Math.round(v * 1000) / 10}%` : v} ${BUFF_NAMES[k] ?? STAT_NAMES[k] ?? k}`),
  ...(duration ? [`${duration}s`] : []),
];

// What a skill does at a level, piece by piece (so the next level can show only what changes).
// `tune` is the skill's own damage tuning (data/skills.js `dmg`), shown in its percentages.
function describeParts(params, tune = 1) {
  // A proc (a skill that sets itself off): how often, then what it does when it does.
  if (params.proc) {
    const p = params.proc;
    const when = [p.chance != null && `${Math.round(p.chance * 100)}% chance`, p.hard && `on a hit of ${Math.round(p.hard * 100)}%+ HP`, p.crowd && `always on ${p.crowd}+ foes`].filter(Boolean);
    return [...when, ...describeParts({ ...p, chance: undefined, proc: undefined }, tune)];
  }
  const parts = [];
  const pc = (v) => `${Math.round(v * tune)}%`;
  // A combo skill: each step's blows (and the volleys, songs, wells and beams it calls down).
  const steps = params.combo ?? [];
  const stepHits = steps.map((st) => (st.strikes ?? []).flatMap((x) => {
    if (x.rain) return [`${x.rain}×${pc(x.pct)}`];
    if (x.concert) return [`${x.concert.beats.length} beats ×${pc(x.concert.pct)}`];
    if (x.align) return [`beam ${pc(x.align.pct)}`];
    if (x.well) return [`${pc(x.well.pct)} every ${x.well.every}s`];
    if (x.song?.pct) return [`${pc(x.song.pct)} every ${x.song.every}s`];
    return x.pct > 0 ? [pc(x.pct)] : [];
  }));
  if (stepHits.some((h) => h.length)) {
    if (steps.length > 1) parts.push(`${steps.length}-step chain: ${stepHits.map((h) => h.join('+') || '—').join(' / ')}`);
    else parts.push(`${stepHits[0].join(' + ')} damage`);
  } else {
    if (params.pct) parts.push(`${pc(params.pct)} damage`);
    if (params.power) parts.push(`${pc(params.power)} magic`);
    if (params.hits > 1) parts.push(`${params.hits} hits`);
  }
  if (params.targets > 1) parts.push(`up to ${params.targets} foes`);
  const strikes = steps.flatMap((st) => st.strikes ?? []);
  // Heals, blessings and revives a dance gives.
  for (const x of strikes) {
    if (x.heal) parts.push(`heals ${Math.round(x.heal * 100)}% max HP${params.range ? ' (you and the party near)' : ''}`);
    if (x.grant) parts.push(...buffParts(x.grant.buff, x.grant.duration));
    if (x.revive) parts.push(`revives the fallen at ${Math.round(x.revive.pct * 100)}% HP`);
    if (x.torii?.heal) parts.push(`each gate heals ${Math.round(x.torii.heal * 100)}%`, `ward ${Math.round(x.torii.ward * 100)}% for ${x.torii.wardDur}s`);
  }
  if (params.healPct) parts.push(`heals ${Math.round(params.healPct * 100)}% HP`);
  if (params.barrage) {
    const b = params.barrage;
    const unit = b.unit ?? 'star';
    parts.push(`${pc(b.pct)} a ${unit}`, `${b.from} to ${Math.round(b.to * 10) / 10} ${unit}s a second`);
    if (b.wolf) parts.push(`Snow wolf ${pc(b.wolf)} a cut`);
    if (b.finish) parts.push(`finisher ${pc(b.finish[0])} to ${pc(b.finish[1])}`);
  }
  if (params.hold) parts.push(`${params.range.w / 2}px around, holds them ${Math.round(params.hold * 10) / 10}s`);
  if (params.pull) parts.push(`pulls from ${params.range.w}px`);
  if (params.buff) parts.push(...buffParts(params.buff, params.duration));
  if (params.passive) {
    for (const [k, v] of Object.entries(params.passive)) {
      const pct = ['maxHpPct', 'maxMpPct', 'critRate', 'critDamage', 'mastery'].includes(k);
      const name = { maxHpPct: 'max HP', maxMpPct: 'max MP', critRate: 'crit rate', critDamage: 'crit damage', mastery: 'mastery', restRegen: 'rest recovery', mpRegen: 'MP recovery' }[k] ?? STAT_NAMES[k] ?? k;
      parts.push(`${pct ? `${Math.round(v * 100)}%` : `+${v}`} ${name}`);
    }
  }
  if (params.mp) parts.push(`${params.mp} MP`);
  return parts;
}

// The biggest single blow of a skill at a level, as a % (for its real damage range).
function biggestPct(params) {
  const p = params.proc ?? params;
  const strikes = (p.combo ?? []).flatMap((st) => st.strikes ?? []);
  return Math.max(0, p.pct ?? 0, ...strikes.map((x) => x.concert?.pct ?? x.align?.pct ?? x.well?.pct ?? x.song?.pct ?? x.pct ?? 0));
}

export function skillTooltip(char, skillId) {
  const s = SKILLS[skillId];
  const lv = char.skills[skillId] ?? 0;
  const tune = s.dmg ?? 1;
  const lines = [
    { text: s.name, bold: true, size: 10 },
    { text: `${JOBS[s.job].name} skill  ·  Level ${lv}/${s.maxLevel}`, color: COLORS.muted },
    { text: s.desc },
  ];
  // (Grand Concert's music and Planetary Alignment's beam hit everything they reach alike.)
  const focus = skillId === 'troupecombo' || skillId === 'thousandtorii' ? '' : ' Hits harder the fewer it catches (double on one).';
  if (s.fullGauge) lines.push({ text: `Finisher: needs a full gauge and spends it.${focus}`, color: '#c99a1f', size: 8 });
  const now = lv > 0 ? describeParts(skillAt(skillId, lv), tune) : [];
  if (lv > 0) lines.push({ text: `Now: ${now.join(', ')}`, color: '#3f9f5f' });
  // Your real damage with it: its biggest blow, from your stats right now.
  if (lv > 0 && SKILLS[skillId].type !== 'buff') {
    const params = skillAt(skillId, lv);
    const pct = biggestPct(params) * tune;
    if (pct > 0) {
      const st = computeStats(char);
      const magic = (params.proc ?? params).power != null || s.job === 'spiritmage' || JOBS[s.job]?.family === 'mage';
      const r = magic ? magicRange(st, pct) : physicalRange(st, st.weaponType, pct);
      lines.push({ text: `Your biggest blow: ${Math.round(r.min).toLocaleString()} – ${Math.round(r.max).toLocaleString()}`, color: '#a8467a', size: 8 });
    }
  }
  // The next level: only what changes.
  if (lv < s.maxLevel) {
    const next = describeParts(skillAt(skillId, lv + 1), tune);
    const changed = lv > 0 ? next.filter((p) => !now.includes(p)) : next;
    lines.push({ text: `${lv > 0 ? 'Next level' : 'Level 1'}: ${changed.join(', ') || 'no change'}`, color: COLORS.accent });
  }
  if (s.lock) lines.push({ text: `Roots you for ${s.lock}s`, color: COLORS.muted });
  if (s.weapons) lines.push({ text: `Needs: ${s.weapons.join(' or ')}`, color: COLORS.muted });
  return lines;
}

// Cash outfit pieces: what they cover and their color; they have no stats.
function cashTooltip(def, inst) {
  const v = inst?.variant ? variantsFor(def)?.[inst.variant] : null;
  const lines = [{ text: itemName(inst ?? def.id), bold: true, size: 10, color: '#d0559a' }];
  lines.push({ text: `✦ Cash outfit · ${def.slot[0].toUpperCase() + def.slot.slice(1)}`, bold: true, color: '#ff8fc1' });
  if (v) lines.push({ text: `◆ ${v.name} color`, bold: true, color: v.main === '#f3f0ea' || v.main === '#e8fbff' ? '#9a8fb8' : v.main });
  // (The face slot is outfit-only: there's no gear under it to cover.)
  const what = def.cover ? 'Reskins the weapon you hold. Its stats stay the same.' : def.slot === 'face' ? 'Worn on your face, under any hat.' : `Covers the look of your ${SLOT_LOOKS[def.slot]}. Your gear keeps its stats.`;
  lines.push({ text: what, color: COLORS.muted, size: 8 });
  return lines;
}

// A colour pulled down far enough to read as text on the tooltip's pale card.
function darkened(hex) {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.round(v * 0.7).toString(16).padStart(2, '0');
  return `#${f(n >> 16)}${f((n >> 8) & 255)}${f(n & 255)}`;
}
