// The Options window (Esc with nothing else open, or the gear button): display, interface, sound,
// and gameplay settings, the controls, and the way out to change character or return to the title.
// Settings save as soon as they change.

import { settings, saveSettings, resetSettings } from '../core/settings.js';
import { applyVolumes } from '../audio/engine.js';
import { touchLayout } from './touch.js';
import { COLORS, windowFrame, tabs, text, toggle, button, box, hover, clicked, wrap, font } from './kit.js';

const PAGES = {
  Display: [
    ['filter', 'Filter', 'A look for the whole screen.', ['natural', 'vivid', 'dreamy', 'retro']],
    ['hdGraphics', 'HD graphics', 'Lighting, glow, and a smooth-gliding camera.'],
    ['particles', 'Particles', 'Dust, sparks, petals, and footsteps.', ['full', 'reduced', 'off']],
    ['jobAuras', 'Job auras', 'The glow around advanced jobs while idle.'],
    ['weaponEffects', 'Weapon effects', 'Live effects on weapons and elemental footsteps.'],
    ['gearEffects', 'Gear effects', 'Glints on fine armor, and the glow of a full high-level set.'],
  ],
  Interface: [
    ['minimap', 'Minimap', 'The map in the top-left corner.'],
    ['questTracker', 'Quest tracker', 'Your pinned quests on a card you can drag anywhere.'],
    ['messageLog', 'Message log', 'Loot, quest, and system messages.'],
    ['mapBanner', 'Map name banner', 'The ribbon that drops in when you enter a map.'],
    ['monsterHp', 'Monster HP bars', 'Health bars over hurt monsters.'],
    ['showFps', 'FPS counter', 'Frames per second, for the curious.'],
  ],
  Sound: [
    ['masterVolume', 'Volume', 'Everything at once.', ['off', 'low', 'mid', 'high']],
    ['musicVolume', 'Music', 'A tune for every town, field, dungeon, and boss.', ['off', 'low', 'mid', 'high']],
    ['sfxVolume', 'Sound effects', 'Hits, spells, steps, loot, menus, and voices.', ['off', 'low', 'mid', 'high']],
  ],
  Gameplay: [
    ['screenShake', 'Screen shake', 'The camera shakes on big hits and boss attacks.', ['full', 'low', 'off']],
    ['hitStop', 'Hit-stop', 'Strong hits freeze the action for an instant.'],
    ['damageNumbers', 'Damage numbers', 'Numbers pop up over monsters you hit.'],
    ['autoLoot', 'Auto-loot', 'Pick up items just by walking over them.'],
    ['npcClick', 'Click NPCs to talk', 'Click any NPC on screen to open their dialog.'],
    ['showCrowd', 'Townsfolk and players', 'Villagers and other players wandering the towns.'],
    ['chatBubbles', 'Chat bubbles', 'Speech bubbles over people who talk.'],
  ],
  Phone: [
    ['touchSize', 'Button size', 'How big the stick and buttons are.', ['small', 'normal', 'big']],
    ['touchAlpha', 'See-through', 'How much of the game shows through them.', ['clear', 'soft', 'solid']],
    ['touchLeft', 'Left-handed', 'The stick on the right, the buttons on the left.'],
    ['touchVibrate', 'Vibrate', 'A little buzz when you press a button.'],
  ],
};

const CONTROLS = [
  ['← →', 'Move'], ['↑ ↓', 'Climb, talk, enter portals'], ['Space', 'Jump'], ['Z', 'Attack'], ['X', 'Pick up loot'],
  ['Q W E R A S D F 1-4', 'Hotkeys (skills and items)'], ['I', 'Bag'], ['C', 'Stats'], ['K', 'Skills'], ['L', 'Quests'], ['M', 'World map'], ['N', 'Play with friends'], ['B', 'Collection: Monster Book, achievements, titles'], ['T', 'Emote wheel'],
  ['Enter', 'Chat'], ['Esc', 'Close windows / Options'], ['Drag', 'Move items, wear gear, set hotkeys'],
];

const TAB_NAMES = [...Object.keys(PAGES), 'Controls', 'Character'];

export function optionsWindow(ui, state, world) {
  const win = state.windows.options;
  const W = 300;
  const H = 262;
  if (!windowFrame(ui, win, W, H, 'Options')) return;
  const { ctx } = ui;
  const th = ui.theme;
  win.tab = tabs(ui, win.x + 8, win.y + 24, TAB_NAMES, win.tab ?? 0, { w: 40 });
  const page = TAB_NAMES[win.tab];
  const x = win.x + 10;
  let y = win.y + 46;

  if (PAGES[page]) {
    // Longer pages pack their rows a little tighter so they stay clear of the buttons.
    const step = PAGES[page].length > 6 ? 25.5 : 29;
    for (const [key, label, desc, choices] of PAGES[page]) {
      box(ctx, x - 2, y, W - 16, step - 3, { fill: '#ffffff', edge: th.light, r: 8, width: 1.2 });
      text(ctx, label, x + 6, y + 11, { size: 8.5, bold: true });
      text(ctx, desc, x + 6, y + 21, { role: 'minor' });
      if (choices) {
        choices.forEach((c, i) => {
          const bx = x + W - 22 - choices.length * 38 + i * 38;
          const on = settings[key] === c;
          box(ctx, bx, y + 7, 36, 13, { fill: on ? th.main : hover(ui, bx, y + 7, 36, 13) ? '#ffffff' : th.light, edge: on ? th.dark : null, r: 6.5, width: 1 });
          text(ctx, c, bx + 18, y + 16.5, { size: 7, bold: true, align: 'center', color: on ? '#ffffff' : th.ink });
          if (clicked(ui, bx, y + 7, 36, 13) && !on) {
            settings[key] = c;
            saveSettings();
            applyVolumes();
          }
        });
      } else {
        const v = toggle(ui, x + W - 50, y + 7, settings[key]);
        if (v !== settings[key]) {
          settings[key] = v;
          saveSettings();
        }
      }
      y += step;
    }
    // The phone's screen in small, with the controls where they'll be.
    if (page === 'Phone') drawTouchPreview(ctx, x + (W - 16) / 2 - 64, y + 2, 128, 72, th);
  } else if (page === 'Controls') {
    CONTROLS.forEach(([keys, what], i) => {
      const cx = x + (i % 2) * 142;
      const cy = y + Math.floor(i / 2) * 22;
      ctx.font = font(7, true);
      const kw = Math.min(70, ctx.measureText(keys).width + 10);
      box(ctx, cx, cy, kw, 13, { fill: th.light, edge: th.main, r: 4, width: 1 });
      text(ctx, keys, cx + kw / 2, cy + 9.5, { size: keys.length > 12 ? 5.5 : 7, bold: true, align: 'center', color: th.ink });
      wrap(ctx, what, cx + kw + 5, cy + 9.5, 132 - kw, { size: 7, lineHeight: 8, color: COLORS.ink });
    });
  } else {
    const char = world.char;
    box(ctx, x - 2, y, W - 16, 40, { fill: '#ffffff', edge: th.light, r: 8, width: 1.2 });
    text(ctx, char.name, x + 8, y + 16, { size: 11, bold: true });
    text(ctx, `Level ${char.level} · saved automatically`, x + 8, y + 30, { role: 'secondary' });
    y += 50;
    if (button(ui, x, y, W - 20, 22, 'Change character', { primary: true, iconName: 'user', size: 9 })) state.action = 'select';
    y += 28;
    if (button(ui, x, y, W - 20, 22, 'Exit to title', { iconName: 'door', size: 9 })) state.action = 'title';
    y += 28;
    if (button(ui, x, y, W - 20, 20, 'Reset all settings', { size: 8 })) {
      resetSettings();
      applyVolumes();
    }
  }
  if (button(ui, win.x + W - 78, win.y + H - 24, 68, 18, 'Resume', { primary: true, size: 8 })) win.open = false;
}

function drawTouchPreview(ctx, x, y, w, h, th) {
  const k = w / 640;
  box(ctx, x - 3, y - 3, w + 6, h + 6, { fill: '#5a4a72', edge: null, r: 8 });
  box(ctx, x, y, w, h, { fill: '#cfe9ff', edge: null, r: 4 });
  box(ctx, x, y + h * 0.72, w, h * 0.28, { fill: '#9fdc9f', edge: null, r: 0 });
  const { fade, parts } = touchLayout();
  ctx.globalAlpha = Math.min(1, 0.75 * fade);
  for (const b of parts) {
    ctx.fillStyle = b.color ?? (b.grab ? '#ffffff' : '#fffaf8');
    ctx.strokeStyle = b.dark ?? '#9a7cc8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x + b.x * k, y + b.y * (h / 360), Math.max(1.5, b.r * k), 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  text(ctx, 'Preview', x + w / 2, y + h + 12, { size: 6.5, bold: true, align: 'center', color: th.ink });
}
