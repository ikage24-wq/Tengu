// The Options window (Esc with nothing else open, or the gear button): display, interface, and
// gameplay settings, the controls, and the way out to change character or return to the title.
// Settings save as soon as they change.

import { settings, saveSettings, resetSettings } from '../core/settings.js';
import { COLORS, windowFrame, tabs, text, toggle, button, box, hover, clicked, wrap } from './kit.js';

const PAGES = {
  Display: [
    ['screenShake', 'Screen shake', 'The camera shakes on big hits and boss attacks.'],
    ['hitStop', 'Hit-stop', 'Strong hits freeze the action for an instant.'],
    ['damageNumbers', 'Damage numbers', 'Numbers pop up over monsters you hit.'],
    ['particles', 'Particles', 'Dust, sparks, petals, and footsteps.', ['full', 'reduced', 'off']],
    ['jobAuras', 'Job auras', 'The glow around advanced jobs while idle.'],
    ['weaponEffects', 'Weapon effects', 'Live effects on weapons and elemental footsteps.'],
  ],
  Interface: [
    ['minimap', 'Minimap', 'The map in the top-left corner.'],
    ['questTracker', 'Quest tracker', 'Quests in progress in the top-right corner.'],
    ['messageLog', 'Message log', 'Loot, quest, and system messages.'],
    ['mapBanner', 'Map name banner', 'The ribbon that drops in when you enter a map.'],
    ['monsterHp', 'Monster HP bars', 'Health bars over hurt monsters.'],
    ['showFps', 'FPS counter', 'Frames per second, for the curious.'],
  ],
  Gameplay: [
    ['autoLoot', 'Auto-loot', 'Pick up items just by walking over them.'],
    ['npcClick', 'Click NPCs to talk', 'Click any NPC on screen to open their dialog.'],
    ['showCrowd', 'Townsfolk and players', 'Villagers and other players wandering the towns.'],
    ['chatBubbles', 'Chat bubbles', 'Speech bubbles over people who talk.'],
  ],
};

const CONTROLS = [
  ['← →', 'Move'], ['↑ ↓', 'Climb, talk, enter portals'], ['Space', 'Jump'], ['Z', 'Attack'], ['X', 'Pick up loot'],
  ['Q W E R A S D F 1-4', 'Hotkeys (skills and items)'], ['I', 'Bag'], ['C', 'Stats'], ['K', 'Skills'], ['L', 'Quests'], ['M', 'World map'],
  ['Enter', 'Chat'], ['Esc', 'Close windows / Options'],
];

const TAB_NAMES = [...Object.keys(PAGES), 'Controls', 'Character'];

export function optionsWindow(ui, state, world) {
  const win = state.windows.options;
  const W = 300;
  const H = 262;
  if (!windowFrame(ui, win, W, H, 'Options')) return;
  const { ctx } = ui;
  const th = ui.theme;
  win.tab = tabs(ui, win.x + 8, win.y + 24, TAB_NAMES, win.tab ?? 0, { w: 55 });
  const page = TAB_NAMES[win.tab];
  const x = win.x + 10;
  let y = win.y + 46;

  if (PAGES[page]) {
    for (const [key, label, desc, choices] of PAGES[page]) {
      box(ctx, x - 2, y, W - 16, 26, { fill: '#ffffff', edge: th.light, r: 8, width: 1.2 });
      text(ctx, label, x + 6, y + 11, { size: 8.5, bold: true });
      text(ctx, desc, x + 6, y + 21, { size: 6.5, color: COLORS.muted });
      if (choices) {
        choices.forEach((c, i) => {
          const bx = x + W - 128 + i * 38;
          const on = settings[key] === c;
          box(ctx, bx, y + 7, 36, 13, { fill: on ? th.main : hover(ui, bx, y + 7, 36, 13) ? '#ffffff' : th.light, edge: on ? th.dark : null, r: 6.5, width: 1 });
          text(ctx, c, bx + 18, y + 16.5, { size: 7, bold: true, align: 'center', color: on ? '#ffffff' : th.ink });
          if (clicked(ui, bx, y + 7, 36, 13) && !on) {
            settings[key] = c;
            saveSettings();
          }
        });
      } else {
        const v = toggle(ui, x + W - 50, y + 7, settings[key]);
        if (v !== settings[key]) {
          settings[key] = v;
          saveSettings();
        }
      }
      y += 29;
    }
  } else if (page === 'Controls') {
    CONTROLS.forEach(([keys, what], i) => {
      const cx = x + (i % 2) * 142;
      const cy = y + Math.floor(i / 2) * 22;
      ctx.font = 'bold 7px sans-serif';
      const kw = Math.min(70, ctx.measureText(keys).width + 10);
      box(ctx, cx, cy, kw, 13, { fill: th.light, edge: th.main, r: 4, width: 1 });
      text(ctx, keys, cx + kw / 2, cy + 9.5, { size: keys.length > 12 ? 5.5 : 7, bold: true, align: 'center', color: th.ink });
      wrap(ctx, what, cx + kw + 5, cy + 9.5, 132 - kw, { size: 7, lineHeight: 8, color: COLORS.ink });
    });
  } else {
    const char = world.char;
    box(ctx, x - 2, y, W - 16, 40, { fill: '#ffffff', edge: th.light, r: 8, width: 1.2 });
    text(ctx, char.name, x + 8, y + 16, { size: 11, bold: true });
    text(ctx, `Level ${char.level} · saved automatically`, x + 8, y + 30, { size: 7.5, color: COLORS.muted });
    y += 50;
    if (button(ui, x, y, W - 20, 22, 'Change character', { primary: true, iconName: 'user', size: 9 })) state.action = 'select';
    y += 28;
    if (button(ui, x, y, W - 20, 22, 'Exit to title', { iconName: 'door', size: 9 })) state.action = 'title';
    y += 28;
    if (button(ui, x, y, W - 20, 20, 'Reset all settings', { size: 8 })) resetSettings();
  }
  if (button(ui, win.x + W - 78, win.y + H - 24, 68, 18, 'Resume', { primary: true, size: 8 })) win.open = false;
}
