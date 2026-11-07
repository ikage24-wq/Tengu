// The Collection window (B): the Monster Book (a card for every monster: shown once you've
// defeated one, a silhouette until then, with a star once mastered), the fish you've caught, and
// your mounts (each one moving on its card; pick the one H rides, or see how to earn the rest).

import { MOBS } from '../data/mobs.js';
import { masteryAt } from '../core/collection.js';
import { drawMonster } from '../render/monsters.js';
import { drawItemIcon } from '../render/icons.js';
import { FISH, RARITY_NAMES, RARITY_COLORS, SPOTS, WHEN_NAMES } from '../data/fishing.js';
import { COLORS, windowFrame, tabs, text, box, hover, tooltip, sparkle, fit, wrap, button } from './kit.js';
import { MOUNTS, MOUNT_IDS } from '../data/mounts.js';
import { drawMount } from '../render/mounts.js';
import { ownsMount, mountUp } from '../world/mount.js';
import { SWEETHEARTS, SWEETHEART_IDS } from '../data/sweethearts.js';
import { heartsOf, isPartner, livesWith } from '../world/sweethearts.js';
import { drawHearts } from './sweetheart.js';
import { drawHero } from '../render/hero.js';
import { NPCS } from '../data/npcs.js';
import { getMap } from '../data/maps.js';
import { SKIN_KINDS, SKIN_LABEL, ownsSkin, useSkin } from '../data/cosmetics.js';
import { ITEMS } from '../data/items.js';

const W = 340;
const H = 250;
const TABS = ['Monster Book', 'Fish', 'Mounts', 'Sweethearts', 'Style'];

// Monsters by level, the bosses after.
const ORDER = Object.keys(MOBS).sort((a, b) => (MOBS[a].boss ? 1 : 0) - (MOBS[b].boss ? 1 : 0) || MOBS[a].level - MOBS[b].level);

export function collectionWindow(ui, state, world) {
  const win = state.windows.collection;
  if (!windowFrame(ui, win, W, H, 'Collection')) return;
  const { ctx } = ui;
  const th = ui.theme;
  const char = world.char;
  const tab = tabs(ui, win.x + 10, win.y + 26, TABS, win.tab ?? 0, { w: 62, h: 15 });
  if (tab === 4) {
    if (tab !== win.tab) Object.assign(win, { tab, scroll: 0 });
    return stylePage(ui, win, world, win.x + 10, win.y + 48, th);
  }
  if (tab !== win.tab) Object.assign(win, { tab, scroll: 0 });
  const x = win.x + 10;
  const y = win.y + 48;
  if (win.tab === 0) book(ui, win, char, world, x, y, th);
  else if (win.tab === 1) fishPage(ui, win, char, x, y, th);
  else if (win.tab === 2) mountsPage(ui, win, world, x, y, th);
  else sweetheartsPage(ui, win, world, x, y, th);
}

// The book: a grid of cards, scrolled by the wheel, with what it's all worth along the bottom.
function book(ui, win, char, world, x, y, th) {
  const { ctx } = ui;
  const cols = 6;
  const cw = 52;
  const ch = 58;
  const rows = 3;
  const lines = Math.ceil(ORDER.length / cols);
  if (hover(ui, x, y, cols * cw, rows * ch)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, lines - rows));
  ORDER.slice(win.scroll * cols, (win.scroll + rows) * cols).forEach((id, i) => {
    const def = MOBS[id];
    const n = char.book?.[id] ?? 0;
    const seen = n > 0;
    const master = n >= masteryAt(id);
    const cx = x + (i % cols) * cw;
    const cy = y + Math.floor(i / cols) * ch;
    box(ctx, cx, cy, cw - 4, ch - 4, { fill: master ? '#fff6d6' : seen ? '#ffffff' : '#f2ecf8', edge: master ? '#f0c64a' : seen ? th.light : '#e2d8ee', r: 8, width: master ? 2 : 1.2 });
    // The monster itself, fitted into the card (a dark silhouette until you've met it).
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 2, cy + 2, cw - 8, ch - 20);
    ctx.clip();
    const k = Math.min(0.55, 34 / def.h, 40 / def.w);
    ctx.translate(cx + (cw - 4) / 2, cy + ch - 20);
    ctx.scale(k, k);
    if (!seen) {
      ctx.filter = 'brightness(0) opacity(0.25)';
    }
    drawMonster(ctx, { def, x: 0, y: 0, hp: def.hp, dir: 1, state: 'idle', flash: 0, stagger: 0, phase: 0, age: 9, dying: 0, uid: 7000 + i, aggroUntil: 0, attackAt: -9, gloatAt: -9 }, 0, 0, world.now, world.now);
    ctx.restore();
    text(ctx, seen ? fit(ctx, def.name.split(',')[0], cw - 8, 6, true) : '???', cx + (cw - 4) / 2, cy + ch - 12, { size: 6, bold: true, align: 'center', color: seen ? COLORS.ink : COLORS.muted });
    if (master) sparkle(ctx, cx + cw - 11, cy + 7, 3, '#f0b53a');
    if (hover(ui, cx, cy, cw - 4, ch - 4)) {
      tooltip(ui, seen ? [
        { text: def.name, bold: true },
        { text: `Lv ${def.level}${def.boss ? ' boss' : ''}`, size: 8, color: COLORS.muted },
        { text: `Defeated ${n.toLocaleString()} / ${masteryAt(id)} to master`, size: 8, color: master ? '#3f9f5f' : COLORS.ink },
        ...(master ? [{ text: 'Mastered!', size: 8, color: '#3f9f5f' }] : []),
      ] : [{ text: 'Not met yet', bold: true }, { text: `Lv ${def.level}`, size: 8, color: COLORS.muted }]);
    }
  });
  const cards = Object.keys(char.book ?? {}).filter((id) => MOBS[id]).length;
  text(ctx, `${cards} / ${ORDER.length} cards`, x, y + rows * ch + 10, { size: 8, bold: true, color: th.dark });
  if (lines > rows) text(ctx, 'Scroll for more', x + cols * cw - 6, y + rows * ch + 10, { size: 6.5, align: 'right', color: COLORS.muted });
}

// Where a caught fish bites, and when (the Fish page's tooltip).
function fishWhere(f) {
  const maps = [...new Set(Object.entries(SPOTS).filter(([, list]) => list.some((sp) => sp.pool[f.id])).map(([id]) => getMap(id).name))];
  return [...(maps.length ? [{ text: `Found at ${maps.join(', ')}`, size: 8, color: COLORS.muted }] : []), ...(f.when ? [{ text: `Only bites ${WHEN_NAMES[f.when]}`, size: 8, color: '#7a6ab0' }] : []), ...(f.legend ? [{ text: `Title: ${f.legend.title}`, size: 8, color: '#b07a2a' }] : [])];
}

// The fish you've caught: each one's card with how many (a dark shape until then),
// in its rarity's colour, three rows at a time, scrolled by the wheel.
function fishPage(ui, win, char, x, y, th) {
  const { ctx } = ui;
  const cols = 5;
  const cw = 64;
  const ch = 50;
  const rows = 3;
  const lines = Math.ceil(FISH.length / cols);
  if (hover(ui, x, y, cols * cw, rows * ch)) win.scroll = (win.scroll ?? 0) + ui.mouse.wheel;
  win.scroll = Math.max(0, Math.min(win.scroll ?? 0, lines - rows));
  FISH.slice(win.scroll * cols, (win.scroll + rows) * cols).forEach((f, i) => {
    const rec = char.fishBook?.[f.id];
    const cx = x + (i % cols) * cw;
    const cy = y + Math.floor(i / cols) * ch;
    box(ctx, cx, cy, cw - 4, ch - 4, { fill: rec ? '#ffffff' : '#f2ecf8', edge: rec ? RARITY_COLORS[f.rarity] : '#e2d8ee', r: 8, width: rec ? 1.5 : 1 });
    ctx.save();
    if (!rec) ctx.filter = 'brightness(0) opacity(0.25)';
    drawItemIcon(ctx, f.id, cx + (cw - 4) / 2 - 12, cy + 3, 1.5);
    ctx.restore();
    text(ctx, rec ? fit(ctx, f.name, cw - 8, 6, true) : '???', cx + (cw - 4) / 2, cy + 35, { size: 6, bold: true, align: 'center', color: rec ? COLORS.ink : COLORS.muted });
    if (rec) text(ctx, rec.best ? `x${rec.n} · ${rec.best} cm` : `x${rec.n}`, cx + (cw - 4) / 2, cy + 42, { size: 5.5, align: 'center', color: COLORS.muted });
    if (hover(ui, cx, cy, cw - 4, ch - 4)) tooltip(ui, rec ? [{ text: f.name, bold: true }, { text: RARITY_NAMES[f.rarity], size: 8, color: RARITY_COLORS[f.rarity] }, { text: `Caught ${rec.n}`, size: 8 }, ...(rec.best ? [{ text: `Biggest: ${rec.best} cm`, size: 8 }] : []), ...fishWhere(f)] : [{ text: 'Not caught yet', bold: true }, { text: RARITY_NAMES[f.rarity], size: 8, color: RARITY_COLORS[f.rarity] }, ...(f.when ? [{ text: `Only bites ${WHEN_NAMES[f.when]}`, size: 8, color: '#7a6ab0' }] : []), ...(f.legend ? [{ text: f.legend.rumor, size: 8, color: '#b07a2a' }] : [])]);
  });
  const got = FISH.filter((f) => char.fishBook?.[f.id]).length;
  text(ctx, `${got} / ${FISH.length} fish  ·  Get a rod from Pip, Marlo or Mister Brine, and look for the fish signs by the water.`, x, y + rows * ch + 8, { size: 7, bold: true, color: th.dark });
  if (lines > rows) text(ctx, 'Scroll for more', x + cols * cw - 6, y + rows * ch + 18, { size: 6.5, align: 'right', color: COLORS.muted });
}

// Your style: which capsule skins (data/cosmetics.js) you use for your chat bubble, your name tag
// and your damage numbers. Plain, or any you've won (the rest show where they come from).
function stylePage(ui, win, world, x, y, th) {
  const { ctx } = ui;
  const char = world.char;
  const machines = { sprout: 'Sprout Village' };
  let ry = y;
  for (const kind of ['bubble', 'tag', 'dmg']) {
    text(ctx, SKIN_LABEL[kind], x, ry + 7, { size: 8, bold: true, color: th.dark });
    const using = char.cosmetics?.using?.[kind] ?? null;
    const options = [[null, 'Plain'], ...Object.entries(SKIN_KINDS[kind]).map(([k, v]) => [k, v.name])];
    options.forEach(([key, name], i) => {
      const bx = x + (i % 3) * 106;
      const by = ry + 12 + Math.floor(i / 3) * 18;
      const own = key === null || ownsSkin(char, kind, key);
      const on = using === key;
      if (own) {
        if (button(ui, bx, by, 100, 15, `${on ? '✓ ' : ''}${name}`, { primary: on, size: 6.5 })) useSkin(char, kind, key);
      } else {
        box(ctx, bx, by, 100, 15, { fill: '#f2ecf8', edge: '#e2d8ee', r: 6, width: 1 });
        text(ctx, fit(ctx, `${name} · ${machines[SKIN_KINDS[kind][key].machine] ?? ''} capsules`, 94, 5.6, false), bx + 50, by + 10, { size: 5.6, align: 'center', color: COLORS.muted });
      }
    });
    ry += 12 + Math.ceil(options.length / 3) * 18 + 8;
  }
  text(ctx, 'Skins come out of the capsule machines. They only change how things look.', x, ry + 6, { size: 6.5, color: COLORS.muted });
}

// Your mounts: a card each, the mount moving on it (trotting along if it's the one you ride),
// its trick, and a button to choose it; the ones you haven't got stand in shadow with how to earn
// them.
const cardRiders = Object.fromEntries(MOUNT_IDS.map((id) => [id, {}]));
function mountsPage(ui, win, world, x, y, th) {
  const { ctx } = ui;
  const char = world.char;
  const cols = 3;
  const cw = 107;
  const ch = 94;
  MOUNT_IDS.forEach((id, i) => {
    const def = MOUNTS[id];
    const own = ownsMount(char, id);
    const chosen = own && char.mount === id;
    const cx = x + (i % cols) * cw;
    const cy = y + Math.floor(i / cols) * ch;
    box(ctx, cx, cy, cw - 5, ch - 5, { fill: chosen ? '#fff6d6' : own ? '#ffffff' : '#f2ecf8', edge: chosen ? '#f0c64a' : own ? th.light : '#e2d8ee', r: 9, width: chosen ? 2 : 1.2 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 2, cy + 2, cw - 9, 46);
    ctx.clip();
    if (!own) ctx.filter = 'brightness(0) opacity(0.22)';
    ctx.translate(cx + (cw - 5) / 2, cy + 46);
    ctx.scale(0.72, 0.72);
    drawMount(ctx, cardRiders[id], id, 0, 0, world.now, { facing: 1, speed: chosen ? 0.6 : 0 });
    ctx.restore();
    text(ctx, def.name, cx + 6, cy + 56, { size: 8, bold: true, color: own ? COLORS.ink : COLORS.muted });
    wrap(ctx, own ? def.trickText : def.hint, cx + 6, cy + 64, cw - 16, { size: 5.6, lineHeight: 6.6, color: own ? COLORS.ink : COLORS.muted });
    if (own && !chosen && button(ui, cx + cw - 41, cy + 49, 34, 12, 'Choose', { size: 6.5, primary: true })) {
      char.mount = id;
      if (world.riding) mountUp(world, id);
    }
    if (chosen) text(ctx, 'Riding with H', cx + cw - 9, cy + 57, { size: 6, bold: true, align: 'right', color: '#c9961f' });
    if (hover(ui, cx, cy, cw - 5, ch - 5)) tooltip(ui, own ? [{ text: def.name, bold: true }, { text: def.about, size: 7 }, { text: `Speed ${def.speed}%  ·  Jump ${def.jump}%`, size: 7, color: COLORS.muted }] : [{ text: 'Not found yet', bold: true }, { text: def.hint, size: 7 }]);
  });
  const got = MOUNT_IDS.filter((id) => ownsMount(char, id)).length;
  text(ctx, `${got} / ${MOUNT_IDS.length} mounts  ·  Press H to ride. Attacking hops you off.`, x, y + 2 * ch + 4, { size: 7, bold: true, color: th.dark });
}

// The Sweethearts: each one's card (them, idling), their hearts, where to find them, and the gifts
// you've found they love.
function sweetheartsPage(ui, win, world, x, y, th) {
  const { ctx } = ui;
  const char = world.char;
  const cw = 107;
  const ch = 94;
  SWEETHEART_IDS.forEach((id, i) => {
    const s = SWEETHEARTS[id];
    const h = heartsOf(char, id);
    const cx = x + (i % 3) * cw;
    const cy = y + Math.floor(i / 3) * ch;
    const partner = isPartner(char, id);
    box(ctx, cx, cy, cw - 5, ch - 5, { fill: partner ? '#fff0f6' : '#ffffff', edge: partner ? '#ff8fc4' : th.light, r: 9, width: partner ? 2 : 1.2 });
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx + 2, cy + 2, 40, ch - 9);
    ctx.clip();
    ctx.translate(cx + 22, cy + 62);
    ctx.scale(0.6, 0.6);
    drawHero(ctx, s.look, NPCS[id].gear, 0, 0, { pose: 'idle', time: world.now + i, seed: i * 5, facing: 1 });
    ctx.restore();
    text(ctx, s.name, cx + 44, cy + 12, { size: 8, bold: true, color: COLORS.ink });
    text(ctx, s.title, cx + 44, cy + 20, { size: 5.6, color: COLORS.muted });
    drawHearts(ctx, cx + 47, cy + 29, h.pts, { partner, size: 2.2 });
    const where = livesWith(char, id) ? 'Lives with you' : getMap(s.map).name;
    text(ctx, where, cx + 44, cy + 40, { size: 5.8, bold: true, color: livesWith(char, id) ? '#c84a7a' : th.dark });
    const loved = Object.entries(h.known ?? {}).filter(([, k]) => k === 'love').map(([it]) => ITEMS[it]?.name).filter(Boolean);
    wrap(ctx, loved.length ? `Loves: ${loved.join(', ')}` : 'Try a gift to learn what they love.', cx + 44, cy + 50, cw - 52, { size: 5.4, lineHeight: 6.4, color: COLORS.muted });
    if (h.dates) text(ctx, `${h.dates} date${h.dates > 1 ? 's' : ''}`, cx + cw - 9, cy + ch - 10, { size: 5.6, bold: true, align: 'right', color: '#c84a7a' });
  });
  text(ctx, char.partner ? `Your sweetheart: ${SWEETHEARTS[char.partner].name}` : 'Chat each day, give gifts, and ask them out. A Promise Bouquet (6 hearts) starts romance.', x, y + 2 * ch + 4, { size: 7, bold: true, color: th.dark });
}
