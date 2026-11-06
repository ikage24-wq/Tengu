// The Skills window (K): a book per job on your path, a list of its skills on the left and the
// chosen one in full on the right.
//
// Each skill shows its state the way skill trees do (GameRes): learned skills are in full color
// with a level gauge, ones you can put a point into now breathe, and ones out of reach are grey.
// The detail pane has a big icon, what the skill does now and at the next level, its cost, what
// it needs, which hotkey it's on, and the Learn button. Skills drag onto the hotkey bar (or click
// one and press a hotkey) to bind them.

import { SKILLS } from '../data/skills.js';
import { pathName } from '../data/path-skills.js';
import { JOBS, jobChain, FIRST_JOB_LEVEL } from '../data/jobs.js';
import { learnSkill, canLearn, maxSkill, replaced } from '../core/character.js';
import { drawSkillIcon, skillTone } from '../render/icons.js';
import { COLORS, windowFrame, button, tabs, text, box, hover, clicked, tooltip, wrap, wrapCount, well, skillPlate, lighten, fit, icon, textFont, paper, roughRect, tape } from './kit.js';
import { describeSkill } from './tooltips.js';
import { hotkeyAt } from './hud.js';

const W = 336;
const H = 236;
const LIST_W = 150;
const ROW = 29;
const GREEN = '#2f9f58';

const kindOf = (s) => (s.type === 'passive' ? 'passive' : s.type === 'buff' ? 'buff' : 'active');
const KIND_NAMES = { passive: 'Passive', buff: 'Buff', active: 'Active' };

// The hotkey a skill is bound to, as its label ("Q"), or null.
const hotkeyOf = (char, id) => {
  const k = Object.entries(char.hotkeys ?? {}).find(([, b]) => b?.skill === id)?.[0];
  return k ? k.replace('Key', '').replace('Digit', '') : null;
};

// Why you can't put a point into a skill right now, or null if you can.
function learnBlocker(char, s) {
  const lv = char.skills[s.id] ?? 0;
  if (lv >= s.maxLevel) return 'Mastered';
  if (!jobChain(char.job).includes(s.job)) return `Learned as ${/^[aeiou]/i.test(JOBS[s.job].name) ? 'an' : 'a'} ${JOBS[s.job].name}`;
  if (char.sp <= 0) return 'No SP: level up for more';
  return null;
}

// A hint pinned beside the thing it's about instead of at the mouse, so it never lands on the
// words it explains: a row's + pins its note above the row, over the list, and the big icon pins
// its note above the details. The same sticky note as a tooltip (ui/kit.js), drawn last.
// `side` is 'right' to line its right edge up with `ax`, or 'left' for its left edge.
function pinnedTip(ui, label, ax, bottom, side) {
  const { ctx } = ui;
  ctx.font = textFont(9, true);
  const w = ctx.measureText(label).width + 18;
  const h = 22;
  const x = Math.max(4, Math.min(636 - w, side === 'right' ? ax - w : ax));
  const y = Math.max(4, bottom - h);
  const seed = Math.round(w + h) % 31;
  paper(ctx, x, y, w, h, { fill: '#fffbe2', edge: '#c8b070', r: 4, seed, width: 1.2 });
  ctx.save();
  roughRect(ctx, x, y, w, h, 4, seed, 0.6);
  ctx.clip();
  ctx.globalAlpha = 0.85;
  ctx.fillStyle = COLORS.accent;
  ctx.fillRect(x, y, 4, h);
  ctx.restore();
  tape(ctx, x + w / 2, y + 1, Math.min(34, w * 0.4), 7, 0.04, '#ffd6ea', { pattern: 'dots', alpha: 0.8 });
  text(ctx, label, x + 10, y + h - 8, { size: 9, bold: true, color: COLORS.ink });
}

// The skill's icon on a plate in its own hue, shaped by its kind: round for passives, cut corners
// for buffs, a rounded square for everything you cast. Grey and faded when out of reach.
function skillBadge(ctx, s, cx, cy, r, scale, lv, open, hot) {
  const kind = kindOf(s);
  const [toneLight, toneDeep] = skillTone(s.id) ?? ['#f4dcf4', '#ad62bb'];
  skillPlate(ctx, cx, cy, r, kind, lv ? lighten(toneLight, 0.35) : COLORS.cell, lv ? toneDeep : '#d8cce6');
  const half = 8 * scale;
  if (hot && lv) ctx.filter = 'brightness(1.12) saturate(1.15)';
  ctx.globalAlpha = lv || open ? 1 : 0.6;
  drawSkillIcon(ctx, s.id, cx - half, cy - half, scale);
  ctx.filter = 'none';
  if (!lv && !open) {
    ctx.globalCompositeOperation = 'saturation';
    ctx.fillStyle = '#808080';
    ctx.fillRect(cx - half, cy - half, half * 2, half * 2);
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.globalAlpha = 1;
  return toneDeep;
}

export function skillsWindow(ui, state, world) {
  const win = state.windows.skills;
  // A drag in flight ends when the window closes.
  if (win.lastDrawn == null || world.now - win.lastDrawn > 0.25) win.carry = null;
  win.lastDrawn = world.now;
  if (!windowFrame(ui, win, W, H, 'Skills')) return;
  const { ctx } = ui;
  const char = world.char;
  const th = ui.theme;
  const m = ui.mouse;
  const chain = jobChain(char.job);
  win.tab = Math.min(win.tab ?? chain.length - 1, chain.length - 1);
  // Tabs share the width left of the SP pill, so four job books still fit.
  const tabW = Math.min(64, Math.floor((W - 70) / chain.length) - 2);
  const was = win.tab;
  win.tab = tabs(ui, win.x + 8, win.y + 26, chain.map((j) => JOBS[j].short ?? JOBS[j].name), win.tab, { w: tabW, h: 14 });
  if (win.tab !== was) win.pick = null;
  const job = chain[win.tab];
  win.pin = null;
  box(ctx, win.x + W - 54, win.y + 24, 46, 17, { fill: char.sp ? th.main : COLORS.cell, edge: char.sp ? th.dark : null, r: 8.5 });
  text(ctx, `${char.sp} SP`, win.x + W - 31, win.y + 36, { size: 8.5, bold: true, align: 'center', color: char.sp ? '#ffffff' : COLORS.muted, outline: char.sp ? th.ink : null });
  if (hover(ui, win.x + W - 54, win.y + 24, 46, 17)) tooltip(ui, [{ text: 'Skill Points', bold: true }, { text: 'Each level up gives you more. Spend them with the + buttons.', size: 8, color: COLORS.muted }]);

  // (The stat-only skills grow by themselves, and a replaced one is gone: neither is listed.)
  const all = Object.values(SKILLS).filter((s) => s.job === job && !s.grows && !replaced(char, s.id));
  if (!all.some((s) => s.id === win.pick)) win.pick = all[0]?.id ?? null;

  // ---- The list ----
  const lx = win.x + 8;
  const ly = win.y + 47;
  const rows = Math.floor((H - 55) / ROW);
  win.scroll ??= {};
  if (hover(ui, lx, ly, LIST_W, rows * ROW)) win.scroll[job] = (win.scroll[job] ?? 0) + m.wheel;
  const top = (win.scroll[job] = Math.max(0, Math.min(all.length - rows, win.scroll[job] ?? 0)));
  const scrollbar = all.length > rows;
  const rw = LIST_W - (scrollbar ? 6 : 0);
  all.slice(top, top + rows).forEach((s, i) => listRow(ui, state, world, s, lx, ly + i * ROW, rw, win));
  if (scrollbar) {
    const trackH = rows * ROW - 3;
    box(ctx, lx + LIST_W - 3, ly, 3, trackH, { fill: th.light, edge: null, r: 1.5 });
    box(ctx, lx + LIST_W - 3, ly + (trackH * top) / all.length, 3, (trackH * rows) / all.length, { fill: th.main, edge: null, r: 1.5 });
  }

  // ---- The chosen skill ----
  const dx = lx + LIST_W + 6;
  details(ui, state, world, SKILLS[win.pick], dx, ly, win.x + W - 8 - dx, H - 55, win);

  if (job === 'novice' && char.level >= FIRST_JOB_LEVEL && chain.length === 1) {
    box(ctx, lx, win.y + H - 22, LIST_W, 15, { fill: '#fff0f7', edge: COLORS.accent, r: 7.5 });
    text(ctx, `Lv ${FIRST_JOB_LEVEL}: pick a job! (M for the map)`, lx + LIST_W / 2, win.y + H - 11.5, { size: 7, bold: true, align: 'center', color: COLORS.accent });
  }

  // A hovered control's hint, pinned where it covers nothing it explains (drawn over the rows).
  if (win.pin?.label && !win.carry?.live) pinnedTip(ui, win.pin.label, win.pin.ax, win.pin.bottom, win.pin.side);

  // ---- Dragging a skill onto the hotkey bar ----
  if (win.carry) {
    const d = win.carry;
    if (m.down) {
      if (!d.live && Math.hypot(m.x - d.x0, m.y - d.y0) > 4) d.live = true;
    } else {
      const key = d.live ? hotkeyAt(m.x, m.y) : null;
      if (key) bindSkill(world, d.id, key);
      win.carry = null;
    }
  }
  if (win.carry?.live) {
    const s = SKILLS[win.carry.id];
    ctx.globalAlpha = 0.92;
    drawSkillIcon(ctx, s.id, m.x - 8, m.y - 10);
    ctx.globalAlpha = 1;
    const label = hotkeyAt(m.x, m.y) ? 'Set hotkey' : 'Drop on a hotkey';
    ctx.font = textFont(6.5, true);
    const tw = ctx.measureText(label).width + 10;
    box(ctx, m.x - tw / 2, m.y - 24, tw, 10, { fill: th.main, edge: null, r: 5 });
    text(ctx, label, m.x, m.y - 16.5, { size: 6.5, bold: true, align: 'center', color: '#ffffff' });
  }
}

// Binds a skill to a hotkey, taking it off any other key first.
function bindSkill(world, id, key) {
  const char = world.char;
  for (const [k, b] of Object.entries(char.hotkeys)) if (b?.skill === id) delete char.hotkeys[k];
  char.hotkeys[key] = { skill: id };
  world.log(`${SKILLS[id].name} set to ${key.replace('Key', '').replace('Digit', '')}.`, '#d4cbe8');
}

// One skill in the list: its badge, name, level gauge and level, its hotkey if it has one, and a
// + button when a point can go in.
function listRow(ui, state, world, s, x, y, w, win) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const lv = char.skills[s.id] ?? 0;
  const open = canLearn(char, s.id);
  const on = win.pick === s.id;
  const binding = state.selectedSkill === s.id;
  const hot = hover(ui, x, y, w - 20, ROW - 3);
  // A skill you could put a point into now breathes.
  const breathe = open && !on ? 0.5 + 0.5 * Math.sin(world.now * 4) : 0;
  box(ctx, x, y, w, ROW - 3, { fill: binding ? '#fff3c4' : on ? th.light : hot ? '#ffffff' : 'rgba(255,255,255,0.7)', edge: binding ? COLORS.select : on ? th.main : lv || open ? th.main : th.light, r: 11, width: on || binding ? 1.6 : 1 + breathe });
  const tone = skillBadge(ctx, s, x + 13, y + 13, 10, 1, lv, open, hot);
  const nameW = w - 54;
  ctx.globalAlpha = lv || open ? 1 : 0.6;
  text(ctx, fit(ctx, pathName(s, char.job), nameW, 8), x + 27, y + 11, { size: 8, bold: true, color: COLORS.ink });
  ctx.globalAlpha = 1;
  // The level gauge in the skill's hue, and the level.
  const gw = nameW - 18;
  box(ctx, x + 27, y + 16, gw, 3, { fill: COLORS.cell, edge: null, r: 1.5 });
  if (lv) box(ctx, x + 27, y + 16, Math.max(3, (gw * lv) / s.maxLevel), 3, { fill: tone, edge: null, r: 1.5 });
  text(ctx, `${lv}/${s.maxLevel}`, x + 27 + gw + 2, y + 19.5, { size: 6.5, bold: true, color: lv ? COLORS.ink : COLORS.muted });
  const key = hotkeyOf(char, s.id);
  if (key) {
    box(ctx, x + 2, y - 1, 9, 7.5, { fill: '#cf8ad8', edge: '#ffffff', r: 3.75, width: 1 });
    text(ctx, key, x + 6.5, y + 4.6, { size: 5, bold: true, align: 'center', color: '#ffffff' });
  }
  if (button(ui, x + w - 19, y + 4, 16, 16, '+', { enabled: open, primary: open, size: 9 })) {
    learnSkill(char, s.id);
    win.pick = s.id;
  }
  // (Pinned above the row, over the list, so it never covers the skill's details beside it.)
  if (hover(ui, x + w - 19, y + 4, 16, 16)) win.pin = { label: open ? `Learn ${pathName(s, char.job)}` : learnBlocker(char, s) ?? '', ax: x + w, bottom: y - 1, side: 'right' };
  if (clicked(ui, x, y, w - 20, ROW - 3)) {
    win.pick = s.id;
    // A learned skill you cast is picked up: drag it to a hotkey, or press one now.
    if (lv && s.type !== 'passive') {
      state.selectedSkill = binding ? null : s.id;
      win.carry = { id: s.id, x0: ui.mouse.x, y0: ui.mouse.y, live: false };
    }
  }
}

// The chosen skill in full.
function details(ui, state, world, s, x, y, w, h, win) {
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  well(ctx, x, y, w, h, th);
  if (!s) return;
  const lv = char.skills[s.id] ?? 0;
  const open = canLearn(char, s.id);
  const kind = kindOf(s);
  const tx = x + 48;
  const tw = w - 54;
  const hot = hover(ui, x + 6, y + 6, 36, 36);
  const tone = skillBadge(ctx, s, x + 24, y + 24, 18, 2, lv, open, hot);
  // (Pinned above the icon, clear of the name and words beside and under it.)
  if (hot && lv && s.type !== 'passive') win.pin = { label: 'Drag to a hotkey', ax: x + 6, bottom: y + 3, side: 'left' };
  if (lv && s.type !== 'passive' && clicked(ui, x + 6, y + 6, 36, 36)) win.carry = { id: s.id, x0: ui.mouse.x, y0: ui.mouse.y, live: false };
  text(ctx, fit(ctx, pathName(s, char.job), tw, 9.5), tx, y + 15, { size: 9.5, bold: true, color: lv ? th.ink : COLORS.muted });
  text(ctx, `${KIND_NAMES[kind]} · ${JOBS[s.job].name}`, tx, y + 25, { size: 7, color: COLORS.muted });
  // The level gauge, big.
  box(ctx, tx, y + 30, tw - 30, 5, { fill: COLORS.cell, edge: null, r: 2.5 });
  if (lv) box(ctx, tx, y + 30, Math.max(5, ((tw - 30) * lv) / s.maxLevel), 5, { fill: tone, edge: null, r: 2.5 });
  text(ctx, `${lv}/${s.maxLevel}`, tx + tw, y + 35.5, { size: 7.5, bold: true, align: 'right', color: lv ? COLORS.ink : COLORS.muted });

  // What it does, then now and next. A big finisher can say more than fits above the footer:
  // then its words scroll (mouse wheel) inside the pane, never running under the hint or buttons.
  const fy = y + h - 21;
  const top = y + 43;
  const bottom = fy - 13;
  if (win.detailFor !== s.id) Object.assign(win, { detailFor: s.id, detailScroll: 0, detailMax: 0 });
  if (hover(ui, x, top, w, bottom - top) && ui.mouse.wheel) win.detailScroll += ui.mouse.wheel * 18;
  win.detailScroll = Math.max(0, Math.min(win.detailMax, win.detailScroll));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 2, top, w - 4, bottom - top);
  ctx.clip();
  let ly = wrap(ctx, s.desc ?? '', x + 8, y + 53 - win.detailScroll, w - 16, { size: 7, color: COLORS.ink, lineHeight: 9 }) + 2;
  const block = (label, body, color, fill) => {
    const bh = 6 + Math.max(1, wrapCount(ctx, body, w - 42, { size: 7 })) * 9;
    box(ctx, x + 6, ly - 7, w - 12, bh, { fill, edge: null, r: 8 });
    text(ctx, label, x + 10, ly, { size: 6.5, bold: true, color });
    ly = wrap(ctx, body, x + 34, ly, w - 42, { size: 7, color: COLORS.ink, lineHeight: 9 }) + 5;
  };
  if (lv > 0) block('Now', describeSkill(s.id, lv), GREEN, '#eaf8ef');
  if (lv < s.maxLevel) block(lv ? 'Next' : 'Lv 1', describeSkill(s.id, lv + 1), COLORS.accent, '#fff0f6');
  const notes = [s.weapons && `Needs ${s.weapons.join(' or ')}`, s.lock && `Roots you ${s.lock}s`].filter(Boolean).join(' · ');
  if (notes) text(ctx, fit(ctx, notes, w - 16, 6.5, false), x + 8, ly + 2, { size: 6.5, color: COLORS.muted });
  ctx.restore();
  // Where the words end (unscrolled), so the next frame knows how far they scroll.
  const end = (notes ? ly + 4 : ly - 4) + win.detailScroll;
  win.detailMax = Math.max(0, end + 2 - bottom);
  if (win.detailMax > 0) {
    const track = bottom - top - 4;
    const view = bottom - top;
    box(ctx, x + w - 6, top + 2, 3, track, { fill: th.light, edge: null, r: 1.5 });
    box(ctx, x + w - 6, top + 2 + (track * win.detailScroll) / (view + win.detailMax), 3, (track * view) / (view + win.detailMax), { fill: th.main, edge: null, r: 1.5 });
  }

  // Footer: the hotkey, and Learn.
  const key = hotkeyOf(char, s.id);
  let hint;
  // A proc sets itself off in a fight; other passives are simply always on.
  if (s.type === 'passive' && s.at(1, s.maxLevel).proc) hint = lv ? 'Goes off on its own' : 'Goes off on its own once learned';
  else if (s.type === 'passive') hint = lv ? 'Always on' : 'Always on once learned';
  else if (!lv) hint = 'Learn it to use it';
  else if (state.selectedSkill === s.id) hint = 'Press a hotkey to bind it';
  else if (key) hint = `On hotkey ${key}`;
  else hint = 'Drag it onto a hotkey';
  // The hint has a line of its own just above the buttons (beside them it was cut to "Learn it
  // to use...").
  const hy = fy - 4;
  const room = w - 16;
  if (key && s.type !== 'passive') {
    box(ctx, x + 8, hy - 8.5, 11, 11, { fill: '#cf8ad8', edge: '#ffffff', r: 5.5, width: 1 });
    text(ctx, key, x + 13.5, hy, { size: 7, bold: true, align: 'center', color: '#ffffff' });
  }
  text(ctx, fit(ctx, hint, room - (key ? 14 : 0), 7), x + 8 + (key ? 14 : 0), hy, { size: 7, bold: true, color: state.selectedSkill === s.id ? COLORS.accent : COLORS.muted });
  const why = learnBlocker(char, s);
  // Mastered: a gold pill instead of a dead button.
  if (lv >= s.maxLevel) {
    box(ctx, x + w - 62, fy, 56, 14, { fill: '#fff0c4', edge: '#f2c94c', r: 7, width: 1.2 });
    icon(ctx, 'star', x + w - 52, fy + 7, 7, '#e0a52f');
    text(ctx, 'Mastered', x + w - 30, fy + 10, { size: 7, bold: true, align: 'center', color: '#b07a12' });
    return;
  }
  if (button(ui, x + w - 62, fy, 56, 16, lv ? 'Level up' : 'Learn', { enabled: open, primary: open, size: 7.5 })) learnSkill(char, s.id);
  if (!open && why && hover(ui, x + w - 62, fy, 56, 16)) tooltip(ui, [{ text: why, bold: true }]);
  // Max: every point it can take, in one click.
  if (button(ui, x + w - 96, fy, 30, 16, 'Max', { enabled: open, primary: open, size: 7.5 })) {
    const n = maxSkill(char, s.id);
    world.log(`${s.name} Lv ${char.skills[s.id]}${char.skills[s.id] < s.maxLevel ? ` (out of SP after ${n})` : ' · Mastered!'}`, '#d4cbe8');
  }
  if (hover(ui, x + w - 96, fy, 30, 16)) tooltip(ui, [{ text: open ? `Spend up to ${Math.min(char.sp, s.maxLevel - lv)} SP` : why ?? '', bold: true }]);
}
