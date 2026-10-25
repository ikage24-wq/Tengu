// The Game Master's admin menu (F9, or /admin): set level, gold, and points, switch to any job,
// give any item, teleport anywhere, and spawn or clear monsters. Only opens once GM is unlocked.

import { ITEMS } from '../data/items.js';
import { JOBS } from '../data/jobs.js';
import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { MAX_LEVEL } from '../core/exp.js';
import { setJob, giveItem, setLevel, teleport, spawn, killAll, gmCommand } from '../world/gm.js';
import { COLORS, windowFrame, tabs, button, text, box, hover, tooltip } from './kit.js';

const W = 380;
const H = 236;
const TABS = ['Player', 'Jobs', 'Items', 'Teleport', 'Monsters'];
const ITEM_GROUPS = [
  ['Weapon', (d) => d.slot === 'weapon'], ['Hat', (d) => d.slot === 'hat'], ['Top', (d) => d.slot === 'top'], ['Bottom', (d) => d.slot === 'bottom'],
  ['Shoes', (d) => d.slot === 'shoes'], ['Gloves', (d) => d.slot === 'gloves'], ['Cape', (d) => d.slot === 'cape'], ['Earring', (d) => d.slot === 'earring'],
  ['Use', (d) => d.type === 'use' || d.type === 'scroll'], ['Etc', (d) => d.type === 'etc'],
];
const PER_PAGE = 24;

// A grid of buttons; returns the index clicked, or -1.
function grid(ui, x, y, cols, w, h, labels, { selected = -1, gap = 3 } = {}) {
  let hit = -1;
  labels.forEach((label, i) => {
    const bx = x + (i % cols) * (w + gap);
    const by = y + Math.floor(i / cols) * (h + gap);
    if (button(ui, bx, by, w, h, label, { size: 7, primary: i === selected })) hit = i;
  });
  return hit;
}

export function adminWindow(ui, state, world) {
  const win = state.windows.admin;
  if (!windowFrame(ui, win, W, H, 'Game Master')) return;
  const { ctx } = ui;
  const char = world.char;
  win.tab = tabs(ui, win.x + 6, win.y + 22, TABS, win.tab ?? 0, { w: 60 });
  const x = win.x + 10;
  const y = win.y + 42;
  const log = (line) => world.log(`[GM] ${line}`, '#ffe36b');

  switch (win.tab ?? 0) {
    case 0: {
      text(ctx, `${char.name} · ${JOBS[char.job].name} · Lv ${char.level} · ${char.gold.toLocaleString()}g · SP ${char.sp} · AP ${char.ap}`, x, y + 8, { size: 8, bold: true });
      const rows = [
        ['Level', [['+1', () => setLevel(char, char.level + 1)], ['+10', () => setLevel(char, char.level + 10)], ['Max', () => setLevel(char, MAX_LEVEL)], ['1', () => setLevel(char, 1)]]],
        ['Gold', [['+10k', () => (char.gold += 10000)], ['+1M', () => (char.gold += 1000000)], ['Reset', () => (char.gold = 0)]]],
        ['Points', [['SP +10', () => (char.sp += 10)], ['AP +50', () => (char.ap += 50)]]],
        ['Powers', [['Heal', () => log(gmCommand(world, 'heal', []))], [world.god ? 'God: ON' : 'God: off', () => log(gmCommand(world, 'god', []))], ['Kill all', () => log(gmCommand(world, 'killall', []))]]],
      ];
      rows.forEach(([label, btns], r) => {
        const ry = y + 20 + r * 24;
        box(ctx, x, ry, W - 20, 20, { fill: COLORS.cell, edge: null, r: 5 });
        text(ctx, label, x + 8, ry + 13, { size: 8, bold: true });
        btns.forEach(([b, act], i) => {
          if (button(ui, x + 80 + i * 66, ry + 3, 60, 14, b, { size: 7, primary: b === 'God: ON' })) act();
        });
      });
      text(ctx, 'Chat commands: /gmhelp', x, y + 126, { size: 8, color: COLORS.muted });
      break;
    }
    case 1: {
      const jobs = Object.values(JOBS);
      const hit = grid(ui, x, y + 4, 4, 86, 18, jobs.map((j) => j.name), { selected: jobs.findIndex((j) => j.id === char.job) });
      if (hit >= 0) {
        setJob(char, jobs[hit].id);
        log(`You are now a ${jobs[hit].name}.`);
      }
      break;
    }
    case 2: {
      win.group = tabs(ui, x - 4, y, ITEM_GROUPS.map(([n]) => n), win.group ?? 0, { w: 33, h: 12 });
      const items = Object.values(ITEMS).filter(ITEM_GROUPS[win.group ?? 0][1]);
      const pages = Math.max(1, Math.ceil(items.length / PER_PAGE));
      win.page = Math.min(win.page ?? 0, pages - 1);
      const shown = items.slice(win.page * PER_PAGE, (win.page + 1) * PER_PAGE);
      const many = ui.input?.held?.has('ShiftLeft') || ui.input?.held?.has('ShiftRight');
      shown.forEach((d, i) => {
        const bx = x + (i % 3) * 120;
        const by = y + 18 + Math.floor(i / 3) * 18;
        if (button(ui, bx, by, 116, 15, d.name.length > 20 ? `${d.name.slice(0, 19)}…` : d.name, { size: 7 })) {
          const qty = many ? 10 : 1;
          log(giveItem(char, d.id, qty) ? `Gave ${qty} x ${d.name}.` : 'Your bag is full.');
        }
        if (hover(ui, bx, by, 116, 15)) tooltip(ui, [{ text: d.name, bold: true }, { text: `id: ${d.id}`, color: COLORS.muted, size: 8 }, { text: 'Click to give · Shift-click for 10', color: COLORS.muted, size: 8 }]);
      });
      const py = win.y + H - 20;
      if (button(ui, x, py, 20, 14, '<', { size: 8, enabled: win.page > 0 })) win.page -= 1;
      text(ctx, `${win.page + 1} / ${pages}`, x + 40, py + 10, { size: 8, align: 'center' });
      if (button(ui, x + 60, py, 20, 14, '>', { size: 8, enabled: win.page < pages - 1 })) win.page += 1;
      break;
    }
    case 3: {
      const maps = Object.values(MAPS);
      const hit = grid(ui, x, y + 4, 3, 116, 18, maps.map((m) => m.name), { selected: maps.findIndex((m) => m.id === world.map.id) });
      if (hit >= 0) {
        teleport(world, maps[hit].id);
        log(`Teleported to ${maps[hit].name}.`);
      }
      break;
    }
    case 4: {
      const mobs = Object.values(MOBS);
      const hit = grid(ui, x, y + 4, 4, 86, 16, mobs.map((m) => `${m.name} ${m.level}`));
      if (hit >= 0) {
        spawn(world, mobs[hit].id, 1);
        log(`Spawned ${mobs[hit].name}.`);
      }
      if (button(ui, x, win.y + H - 22, 80, 15, 'Kill all', { size: 8, primary: true })) {
        killAll(world);
        log('Cleared every monster.');
      }
      break;
    }
    default:
  }
}
