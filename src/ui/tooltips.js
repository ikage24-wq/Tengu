// Tooltip lines for items and skills.

import { ITEMS, RARITIES, ELEMENT_NAMES, variantsFor } from '../data/items.js';
import { itemName, variantPrice } from '../core/items.js';
import { SKILLS, skillAt } from '../data/skills.js';
import { JOBS } from '../data/jobs.js';
import { COLORS } from './kit.js';

const STAT_NAMES = {
  watk: 'Weapon ATK', matk: 'Magic ATK', wdef: 'Weapon DEF', mdef: 'Magic DEF', str: 'STR', dex: 'DEX', int: 'INT', luk: 'LUK',
  hp: 'Max HP', mp: 'Max MP', acc: 'Accuracy', eva: 'Avoid', speed: 'Speed', jump: 'Jump',
};

// Shops pay 40% of the price (the full price for monster drops); colors are worth a bit more.
export function sellPrice(id, inst = null) {
  const def = ITEMS[id];
  const price = inst?.variant ? variantPrice(def, inst.variant) : def.price || 0;
  return Math.max(1, Math.floor(price * (def.type === 'etc' ? 1 : 0.4)));
}

const SLOT_LOOKS = { hat: 'hat', top: 'top', bottom: 'bottom', shoes: 'shoes', gloves: 'gloves', cape: 'cape', earring: 'earrings', weapon: 'weapon' };

export function itemTooltip(char, id, inst = null) {
  const def = ITEMS[id];
  if (def.type === 'cash') return cashTooltip(def, inst);
  const lines = [];
  const upgrades = inst?.upgrades ? ` (+${inst.upgrades})` : '';
  const rarity = RARITIES[inst?.rarity ?? 0];
  lines.push({ text: `${itemName(inst ?? id)}${upgrades}`, bold: true, size: 10, color: rarity.color ?? (inst?.upgrades ? '#e06fa8' : COLORS.ink) });
  const v = inst?.variant ? variantsFor(def)?.[inst.variant] : null;
  if (v) lines.push({ text: `◆ ${v.name} color: +${v.about}`, bold: true, color: v.main === '#f3f0ea' || v.main === '#e8fbff' ? '#9a8fb8' : v.main });
  if (inst?.rarity) lines.push({ text: `★ ${rarity.name}`, bold: true, color: rarity.color });
  if (def.unique) lines.push({ text: '♥ Unique look', bold: true, color: '#e06fa8' });
  if (def.element) lines.push({ text: `✦ ${ELEMENT_NAMES[def.element]} element`, bold: true, color: def.color === '#ffe36b' ? '#d9a440' : def.color });
  if (def.type === 'equip') {
    const kind = def.slot === 'weapon' ? def.weaponType[0].toUpperCase() + def.weaponType.slice(1) : def.slot[0].toUpperCase() + def.slot.slice(1);
    lines.push({ text: kind, color: COLORS.muted });
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
    lines.push({ text: `Upgrade slots: ${inst ? inst.slotsLeft : 7}`, color: COLORS.muted });
  } else {
    if (def.desc) lines.push({ text: def.desc, color: COLORS.muted });
  }
  if (def.price) lines.push({ text: `Sells for ${sellPrice(id, inst)} gold`, color: COLORS.gold, size: 8 });
  return lines;
}

function describe(params) {
  const parts = [];
  if (params.pct) parts.push(`${params.pct}% damage`);
  if (params.power) parts.push(`${params.power}% magic`);
  if (params.hits > 1) parts.push(`${params.hits} hits`);
  if (params.targets > 1) parts.push(`up to ${params.targets} foes`);
  if (params.healPct) parts.push(`heals ${Math.round(params.healPct * 100)}% HP`);
  if (params.hold) parts.push(`${params.range.w / 2}px around, holds them ${Math.round(params.hold * 10) / 10}s`);
  if (params.pull) parts.push(`pulls from ${params.range.w}px`);
  if (params.buff) {
    for (const [k, v] of Object.entries(params.buff)) {
      const pct = ['attackSpeed', 'manaShield', 'maxHpPct', 'critRate', 'regenPct', 'barrier', 'dmgCut'].includes(k);
      const name = { attackSpeed: 'attack speed', manaShield: 'damage to MP', maxHpPct: 'max HP', critRate: 'crit rate', regenPct: 'HP every second', barrier: 'max HP as a barrier', dmgCut: 'less damage taken' }[k] ?? STAT_NAMES[k] ?? k;
      parts.push(`${k === 'barrier' || k === 'dmgCut' ? '' : '+'}${pct ? `${Math.round(v * 1000) / 10}%` : v} ${name}`);
    }
    parts.push(`${params.duration}s`);
  }
  if (params.passive) {
    for (const [k, v] of Object.entries(params.passive)) {
      const pct = ['maxHpPct', 'maxMpPct', 'critRate', 'critDamage', 'mastery'].includes(k);
      const name = { maxHpPct: 'max HP', maxMpPct: 'max MP', critRate: 'crit rate', critDamage: 'crit damage', mastery: 'mastery', restRegen: 'rest recovery', mpRegen: 'MP recovery' }[k] ?? STAT_NAMES[k] ?? k;
      parts.push(`${pct ? `${Math.round(v * 100)}%` : `+${v}`} ${name}`);
    }
  }
  if (params.mp) parts.push(`${params.mp} MP`);
  return parts.join(', ');
}

export function skillTooltip(char, skillId) {
  const s = SKILLS[skillId];
  const lv = char.skills[skillId] ?? 0;
  const lines = [
    { text: s.name, bold: true, size: 10 },
    { text: `${JOBS[s.job].name} skill  ·  Level ${lv}/${s.maxLevel}`, color: COLORS.muted },
    { text: s.desc },
  ];
  if (lv > 0) lines.push({ text: `Now: ${describe(skillAt(skillId, lv))}`, color: '#3f9f5f' });
  if (lv < s.maxLevel) lines.push({ text: `Next: ${describe(skillAt(skillId, lv + 1))}`, color: COLORS.accent });
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
  lines.push({ text: def.cover ? `Reskins the weapon you hold. Its stats stay the same.` : `Covers the look of your ${SLOT_LOOKS[def.slot]}. Your gear keeps its stats.`, color: COLORS.muted, size: 8 });
  return lines;
}
