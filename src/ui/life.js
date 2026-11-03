// The Life Skills window (G): Fishing, Gathering, Mining, Cooking and Crafting (core/life.js), one
// row each: the skill's picture, its level, an EXP bar, what the next level gives (and what the
// next tier opens), and the tool in use. Hover a row for what the level does now.
//
// It moves like the rest of the UI: each picture bobs on its own beat, the bars ease to their
// value and flash white when EXP comes in, and a level up pops the level number and bursts a
// sparkle on its row.

import { LIFE_SKILLS, LIFE_NAMES, LIFE_MAX, TIER_LEVEL, lifeLevel, lifeExp, lifeExpToNext, perksAt, toolFor } from '../core/life.js';
import { drawItemIcon } from '../render/icons.js';
import { lifeIcon } from '../render/life-fx.js';
import { COLORS, windowFrame, text, box, bar, hover, tooltip, fit, sparkle, icon } from './kit.js';

const W = 340;
const H = 240;
// The skills that take a tool (crafted at a bench); cooking and crafting don't.
const TOOLED = { fishing: 'rod', mining: 'pickaxe', gathering: 'sickle' };
const ROW = 38;
const MINT = '#5fd3a0';

// What each level does for a skill, in words: [perk key, short, long].
const PERKS = {
  fishing: [['time', 'bites sooner', 'Bites come sooner'], ['extra', 'two at once', 'Chance of a second fish'], ['rare', 'rarer fish', 'Rare fish bite more']],
  gathering: [['time', 'quicker', 'Quicker picking'], ['extra', 'more finds', 'Chance of one more find'], ['rare', 'rarer finds', 'Better rare finds'], ['rest', 'regrows sooner', 'Spots grow back sooner']],
  mining: [['time', 'quicker', 'Quicker mining'], ['extra', 'more ore', 'Chance of one more ore'], ['rare', 'more gems', 'Better gem chance'], ['rest', 'veins refill sooner', 'Veins refill sooner']],
  cooking: [['extra', 'extra serving', 'Chance of an extra serving']],
  crafting: [],
};
const ABOUT = {
  fishing: 'Cast at a fishing spot (Up).',
  gathering: 'Herbs, fruit, honey, wood, fibre.',
  mining: 'Ore and gems in cliffs and caves.',
  cooking: 'Cook dishes at a town stove.',
  crafting: 'Gear, tools and charms at a bench.',
};

// A perk's value as a share: how much quicker, the chance, the boost, how much shorter.
const pct = (key, p) => (key === 'time' ? 1 / p.time - 1 : key === 'extra' ? p.extra : key === 'rare' ? p.rare - 1 : key === 'rest' ? 1 - p.rest : 0);
const show = (v) => `${Math.round(v * 1000) / 10}%`;

function toolLine(def) {
  if (!def) return null;
  const l = def.life;
  const bits = [l.speed && `+${Math.round(l.speed * 100)}% speed`, l.yield && `+${Math.round(l.yield * 100)}% finds`, l.rare && `+${Math.round(l.rare * 100)}% rare`].filter(Boolean);
  return `${def.name}${bits.length ? ` (${bits.join(', ')})` : ''}`;
}

export function lifeWindow(ui, state, world) {
  const win = state.windows.life;
  if (!windowFrame(ui, win, W, H, 'Life Skills')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const t = world.now;
  const x = win.x + 8;
  let y = win.y + 25;
  const anim = (win.anim ??= {});
  for (const [i, skill] of LIFE_SKILLS.entries()) {
    const level = lifeLevel(char, skill);
    const need = lifeExpToNext(level);
    const ratio = level >= LIFE_MAX ? 1 : lifeExp(char, skill) / need;
    // The bar eases toward its value (and from empty after a level up); a gain flashes it.
    const a = (anim[skill] ??= { shown: ratio, level, exp: lifeExp(char, skill), flashAt: -9, upAt: -9 });
    if (level > a.level) {
      a.upAt = t;
      a.shown = 0;
    }
    if (level !== a.level || lifeExp(char, skill) > a.exp) a.flashAt = t;
    a.level = level;
    a.exp = lifeExp(char, skill);
    const dt = Math.max(0, Math.min(0.1, t - (a.at ?? t)));
    a.at = t;
    a.shown += (ratio - a.shown) * (1 - Math.exp(-dt * 9));
    const hot = hover(ui, x, y, W - 16, ROW - 3);
    box(ctx, x, y, W - 16, ROW - 3, { fill: hot ? '#ffffff' : '#fffdfb', edge: hot ? th.main : th.light, r: 9, width: 1 });

    // The picture, in a round mint well, bobbing on its own beat.
    const cx = x + 17;
    const cy = y + (ROW - 3) / 2;
    box(ctx, cx - 13, cy - 13, 26, 26, { fill: '#e9fbf2', edge: MINT, r: 13, width: 1 });
    const id = lifeIcon(skill);
    const bob = Math.sin(t * 2.2 + i * 1.3) * 1.2;
    const up = t - a.upAt;
    const pop = up < 0.5 ? 1 + 0.35 * Math.sin((up / 0.5) * Math.PI) : 1;
    if (id) drawItemIcon(ctx, id, cx - 8 * pop, cy - 8 * pop + bob, pop);
    else icon(ctx, 'leaf', cx, cy + bob, 14 * pop, th.dark);
    if (up < 0.9) {
      // A level up: sparkles burst from the picture.
      for (let k = 0; k < 6; k++) {
        const ang = (k / 6) * Math.PI * 2 + up * 2;
        const r = 8 + up * 26;
        ctx.globalAlpha = 1 - up / 0.9;
        sparkle(ctx, cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 2.6, k % 2 ? '#ffe36b' : MINT);
      }
      ctx.globalAlpha = 1;
    }

    // Name and level, and the EXP bar.
    const nx = x + 36;
    text(ctx, LIFE_NAMES[skill], nx, y + 12, { size: 9, bold: true, color: COLORS.ink });
    const lvScale = up < 0.4 ? 1 + 0.4 * Math.sin((up / 0.4) * Math.PI) : 1;
    text(ctx, `Lv ${level}`, nx + 80, y + 12, { size: 9 * lvScale, bold: true, align: 'right', color: th.ink });
    const fresh = t - a.flashAt;
    bar(ctx, nx, y + 17, 80, 9, a.shown, MINT, level >= LIFE_MAX ? 'MAX' : `${lifeExp(char, skill)} / ${need}`, { size: 6, flash: fresh < 0.25 ? 1 - fresh / 0.25 : 0 });
    // Under the bar, the tool in hand (if this skill takes one and you have it).
    const held = TOOLED[skill] ? toolFor(char, skill) : null;
    if (held) text(ctx, fit(ctx, held.name, 92, 6.5, true), nx, y + 33, { size: 6.5, bold: true, color: '#3f9f5f' });

    // What the next level gives, and the tool.
    const rx = x + 132;
    const tool = toolFor(char, skill);
    const now = perksAt(level, tool);
    const next = perksAt(level + 1, tool);
    const opens = TIER_LEVEL.indexOf(level + 1);
    let line;
    let color = COLORS.ink;
    if (level >= LIFE_MAX) {
      line = 'Mastered!';
      color = COLORS.gold;
    } else if (opens > 1) {
      line = `Lv ${level + 1}: tier ${opens} spots and recipes open!`;
      color = COLORS.gold;
    } else if (PERKS[skill].length) {
      line = `Next: ${PERKS[skill].map(([k, short]) => `+${show(pct(k, next) - pct(k, now))} ${short}`).slice(0, 2).join(', ')}`;
    } else line = 'Next: better crafts as you level';
    text(ctx, 'NEXT LEVEL', rx, y + 10, { size: 5.5, bold: true, color: th.dark });
    text(ctx, fit(ctx, line, W - 148, 7, true), rx, y + 19, { size: 7, bold: true, color });
    // What you do, in full (it used to be cut off under the bar).
    text(ctx, fit(ctx, ABOUT[skill], W - 148, 6.5, false), rx, y + 30, { size: 6.5, color: COLORS.muted });

    if (hot) {
      const lines = [{ text: `${LIFE_NAMES[skill]} Lv ${level}`, bold: true, color: th.ink }];
      for (const [k, , long] of PERKS[skill]) lines.push({ text: `${long}: ${show(pct(k, now))}`, size: 8 });
      if (!PERKS[skill].length) lines.push({ text: 'Higher levels open recipes and roll better quality.', size: 8 });
      const nextTier = TIER_LEVEL.find((lv) => lv > level);
      if (nextTier) lines.push({ text: `Tier ${TIER_LEVEL.indexOf(nextTier)} opens at Lv ${nextTier}`, size: 8, color: COLORS.gold });
      if (TOOLED[skill]) lines.push(tool ? { text: `Tool: ${toolLine(tool)}`, size: 8, color: '#3f9f5f' } : { text: 'No tool yet: craft one at a bench.', size: 8, color: COLORS.muted });
      lines.push({ text: 'Every action also gives character EXP.', size: 7.5, color: COLORS.muted });
      tooltip(ui, lines);
    }
    y += ROW;
  }
  // Tools: said once, for the skills still without one.
  const missing = Object.keys(TOOLED).filter((s) => !toolFor(char, s));
  if (missing.length) {
    const names = missing.map((s) => ({ fishing: 'rod', mining: 'pickaxe', gathering: 'sickle' })[s]);
    const list = names.length > 1 ? `${names.slice(0, -1).join(', ')} or ${names[names.length - 1]}` : names[0];
    icon(ctx, 'hammer', x + 8, y + 5, 8, th.dark);
    text(ctx, fit(ctx, `No ${list} yet: craft tools at a bench for quicker, bigger finds.`, W - 40, 7, false), x + 16, y + 8, { size: 7, color: COLORS.muted });
  }
}
