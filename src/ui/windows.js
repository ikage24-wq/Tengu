// The Stats window (the Bag lives in bag.js, Skills in skills.js, Quests in quests.js).

import { SKILLS } from '../data/skills.js';
import { JOBS, jobChain } from '../data/jobs.js';
import { expToNext } from '../core/exp.js';
import { physicalRange, magicRange, accuracy, avoid } from '../core/formulas.js';
import { spendAp, autoAssignAp, learnSkill, canLearn, STAT_KEYS } from '../core/character.js';
import { drawSkillIcon, skillTone } from '../render/icons.js';
import { COLORS, windowFrame, button, tabs, text, box, bar, hover, clicked, tooltip, wrap, well, sparkle, skillPlate, lighten } from './kit.js';
import { skillTooltip } from './tooltips.js';

// ---------- Stats ----------

const STAT_COLORS = { str: '#ff7a6b', dex: '#3fc48a', int: '#5aa8ff', luk: '#f0b53a' };

export function statsWindow(ui, state, world) {
  const win = state.windows.stats;
  const W = 180;
  const H = 232;
  if (!windowFrame(ui, win, W, H, 'Stats')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const s = world.stats;
  const x = win.x + 8;
  let y = win.y + 33;
  text(ctx, char.name, x, y, { size: 11, bold: true });
  box(ctx, x + 164 - 70, y - 10, 70, 13, { fill: th.light, edge: null, r: 6.5 });
  text(ctx, `${JOBS[char.job].name} · Lv ${char.level}`, x + 164 - 35, y - 0.5, { size: 7, bold: true, align: 'center', color: th.ink });
  y += 6;
  const need = expToNext(char.level);
  bar(ctx, x, y, 164, 9, Number.isFinite(need) ? char.exp / need : 1, COLORS.exp, Number.isFinite(need) ? `EXP ${(100 * char.exp / need).toFixed(1)}%` : 'MAX', { textColor: '#ffffff' });
  y += 12;
  bar(ctx, x, y, 80, 9, char.hp / s.maxHp, COLORS.hp, `${char.hp}/${s.maxHp}`);
  bar(ctx, x + 84, y, 80, 9, char.mp / s.maxMp, COLORS.mp, `${char.mp}/${s.maxMp}`);
  y += 24;
  // Unspent points glow and bounce a little to say "spend me".
  const bounce = char.ap ? Math.abs(Math.sin(world.now * 4)) * 1.5 : 0;
  box(ctx, x, y - 11 - bounce, 92, 15, { fill: char.ap ? th.main : COLORS.cell, edge: char.ap ? th.dark : null, r: 7.5 });
  text(ctx, `${char.ap} Ability Points`, x + 46, y - 0.5 - bounce, { size: 8, bold: true, align: 'center', color: char.ap ? '#ffffff' : COLORS.muted, outline: char.ap ? th.ink : null });
  if (char.ap) sparkle(ctx, x + 90, y - 11 - bounce, 2 + bounce, '#ffffff');
  if (button(ui, x + 116, y - 12, 48, 16, 'Auto', { enabled: char.ap > 0, size: 8 })) autoAssignAp(char);
  y += 4;
  for (const k of STAT_KEYS) {
    y += 16;
    box(ctx, x, y - 11, 164, 14, { fill: '#ffffff', edge: th.light, r: 7 });
    box(ctx, x + 1, y - 10, 34, 12, { fill: STAT_COLORS[k], edge: null, r: 6 });
    text(ctx, k.toUpperCase(), x + 18, y - 1, { size: 8, bold: true, align: 'center', color: '#ffffff' });
    const bonus = s[k] - char.base[k];
    text(ctx, `${s[k]}`, x + 42, y, { size: 9, bold: true });
    if (bonus) text(ctx, `(${char.base[k]} + ${bonus})`, x + 62, y, { size: 7, color: COLORS.good });
    if (button(ui, x + 146, y - 11, 17, 14, '+', { enabled: char.ap > 0, primary: char.ap > 0, size: 9 })) {
      spendAp(char, k, ui.input.held.has('ShiftLeft') ? 5 : 1);
    }
  }
  y += 10;
  const phys = physicalRange(s, s.weaponType, 100);
  const mag = magicRange(s, 100);
  const family = JOBS[char.job].family;
  const rows = [
    ['Attack', `${Math.round(phys.min)} ~ ${Math.round(phys.max)}`],
    ['Magic', family === 'mage' ? `${Math.round(mag.min)} ~ ${Math.round(mag.max)}` : `${Math.floor(s.int / 2) + s.matk}`],
    ['Defense', `${s.wdef} / ${s.mdef}`],
    ['Accuracy', `${accuracy(family, s, char.level)}`],
    ['Avoid', `${avoid(s)}`],
    ['Critical', `${Math.round((0.05 + s.critRate) * 100)}%`],
    ['Speed', `${s.speed}%`],
  ];
  well(ctx, x, y - 4, 164, rows.length * 10 + 6, th);
  y += 6;
  for (const [k, v] of rows) {
    text(ctx, k, x + 6, y, { role: 'secondary' });
    text(ctx, v, x + 158, y, { size: 7.5, bold: true, align: 'right' });
    y += 10;
  }
}
