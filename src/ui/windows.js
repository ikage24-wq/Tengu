// Player windows: Stats and Skills (the Bag lives in bag.js, Quests in quests.js).

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

// ---------- Skills ----------

export function skillsWindow(ui, state, world) {
  const win = state.windows.skills;
  const W = 256;
  const H = 216;
  if (!windowFrame(ui, win, W, H, 'Skills')) return;
  const { ctx } = ui;
  const char = world.char;
  const chain = jobChain(char.job);
  win.tab = Math.min(win.tab ?? chain.length - 1, chain.length - 1);
  // Tabs share the window width, so four job books still fit.
  const tabW = Math.min(64, Math.floor((W - 64) / chain.length) - 2);
  win.tab = tabs(ui, win.x + 6, win.y + 22, chain.map((j) => JOBS[j].short ?? JOBS[j].name), win.tab, { w: tabW });
  const job = chain[win.tab];
  const th = ui.theme;
  box(ctx, win.x + W - 50, win.y + 22, 44, 15, { fill: char.sp ? th.main : COLORS.cell, edge: char.sp ? th.dark : null, r: 7.5 });
  text(ctx, `${char.sp} SP`, win.x + W - 28, win.y + 33, { size: 8, bold: true, align: 'center', color: char.sp ? '#ffffff' : COLORS.muted, outline: char.sp ? th.ink : null });
  const all = Object.values(SKILLS).filter((s) => s.job === job);
  // Five rows show at once; the wheel scrolls longer books.
  const ROWS = 5;
  win.scroll ??= {};
  if (hover(ui, win.x + 6, win.y + 42, W - 12, ROWS * 33)) win.scroll[job] = (win.scroll[job] ?? 0) + ui.mouse.wheel;
  const top = (win.scroll[job] = Math.max(0, Math.min(all.length - ROWS, win.scroll[job] ?? 0)));
  const list = all.slice(top, top + ROWS);
  if (all.length > ROWS) {
    const trackH = ROWS * 33 - 6;
    box(ctx, win.x + W - 5, win.y + 44, 3, trackH, { fill: COLORS.cell, edge: null, r: 1.5 });
    box(ctx, win.x + W - 5, win.y + 44 + (trackH * top) / all.length, 3, (trackH * ROWS) / all.length, { fill: th.main, edge: null, r: 1.5 });
  }
  let y = win.y + 42;
  for (const s of list) {
    const lv = char.skills[s.id] ?? 0;
    const sel = state.selectedSkill === s.id;
    const hot = hover(ui, win.x + 6, y, W - 40, 30);
    // A skill you could put a point into now breathes; one you can't reach yet is greyed out.
    const open = canLearn(char, s.id);
    const breathe = open && !sel ? 0.5 + 0.5 * Math.sin(world.now * 4) : 0;
    box(ctx, win.x + 6, y, W - 12, 30, { fill: sel ? '#fff3c4' : hot ? '#ffffff' : '#fffdfb', edge: sel ? COLORS.select : lv || open ? th.main : th.light, r: 8, width: sel ? 2 : 1.2 + breathe });
    // The icon sits on a plate in its own hue, shaped by its kind: round for passives, cut corners
    // for buffs, a rounded square for everything you cast.
    const kind = s.type === 'passive' ? 'passive' : s.type === 'buff' ? 'buff' : 'active';
    const [toneLight, toneDeep] = skillTone(s.id) ?? [th.light, th.dark];
    skillPlate(ctx, win.x + 20, y + 15, 11.5, kind, lv ? lighten(toneLight, 0.35) : COLORS.cell, lv ? toneDeep : '#d8cce6');
    // Icon states over the one drawing: brighter under the mouse, grey when out of reach.
    if (hot && lv) ctx.filter = 'brightness(1.12) saturate(1.15)';
    ctx.globalAlpha = lv || open ? 1 : 0.6;
    drawSkillIcon(ctx, s.id, win.x + 12, y + 7);
    ctx.filter = 'none';
    if (!lv && !open) {
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = '#808080';
      ctx.fillRect(win.x + 12, y + 7, 16, 16);
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.globalAlpha = 1;
    // A little level gauge under the name, in the skill's hue.
    box(ctx, win.x + 35, y + 21, 70, 3, { fill: COLORS.cell, edge: null, r: 1.5 });
    if (lv) box(ctx, win.x + 35, y + 21, Math.max(3, (70 * lv) / s.maxLevel), 3, { fill: toneDeep, edge: null, r: 1.5 });
    ctx.globalAlpha = lv ? 1 : 0.55;
    text(ctx, s.name, win.x + 35, y + 13, { size: 9, bold: true });
    text(ctx, kind === 'passive' ? 'Passive' : kind === 'buff' ? 'Buff' : 'Active', win.x + 109, y + 25, { role: 'minor' });
    ctx.globalAlpha = 1;
    text(ctx, `${lv}/${s.maxLevel}`, win.x + W - 34, y + 19, { size: 9, bold: true, align: 'right', color: lv ? COLORS.ink : COLORS.muted });
    if (button(ui, win.x + W - 28, y + 7, 17, 16, '+', { enabled: open, primary: open })) {
      learnSkill(char, s.id);
    }
    if (hover(ui, win.x + 6, y, W - 40, 30)) tooltip(ui, [...skillTooltip(char, s.id), ...(lv && s.type !== 'passive' ? [{ text: 'Click, then press a hotkey to bind', color: COLORS.muted, size: 8 }] : [])]);
    if (clicked(ui, win.x + 6, y, W - 40, 30) && lv && s.type !== 'passive') state.selectedSkill = sel ? null : s.id;
    y += 33;
  }
  if (job === 'novice' && char.level >= 10) {
    wrap(ctx, 'You can choose a job! Kestrel (archer) is in Sprout Village, Vex (thief) in Pastel Harbor, Brann (warrior) in Ember Crag, and Elowen (mage) in Moonleaf Grove. Press M for the world map.', win.x + 10, y + 10, W - 20, { size: 8, color: COLORS.accent });
  }
}
