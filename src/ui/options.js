// The Options window (Esc with nothing else open, or the gear button): display, interface, sound,
// and gameplay settings, the controls, and the way out to change character or return to the title.
// Settings save as soon as they change.

import { settings, saveSettings, resetSettings } from '../core/settings.js';
import { applyVolumes } from '../audio/engine.js';
import { touchLayout } from './touch.js';
import { toggleLayoutEditor } from './layout.js';
import { ACTIONS, bind, physOf, keyName, resetKeys } from '../core/keys.js';
import { COLORS, windowFrame, tabs, text, toggle, button, box, hover, clicked, wrap, tooltip } from './kit.js';

// Every option here is one a player would really reach for (the "no useless features" rule).
// A row: [setting, label, what it does, choices (pills) or a toggle].
const PAGES = {
  Display: [
    ['fullscreen', 'Fullscreen', 'Fill the whole screen. Esc or F11 leaves it too.'],
    ['hdGraphics', 'HD graphics', 'Lighting, glow, and a smooth-gliding camera.'],
    ['effects', 'Effects', 'Particles, job auras and weapon effects. Lower it on slow devices.', ['full', 'reduced', 'off']],
    ['screenShake', 'Screen shake', 'The camera shakes on big hits and boss attacks.', ['full', 'low', 'off']],
    ['fps', 'Frame rate', '30 saves battery on laptops and phones.', ['max', '30']],
    ['showCrowd', 'Townsfolk and players', 'Villagers and other players wandering the towns.'],
  ],
  Interface: [
    ['minimap', 'Minimap', 'Drag it by its name; fold it or resize it with its stickers.'],
    ['minimapSize', 'Minimap size', 'How big the minimap is.', ['small', 'normal', 'big']],
    ['questTracker', 'Quest tracker', 'Your pinned quests on a card you can drag anywhere.'],
    ['messageLog', 'Message log', 'Loot, quest, and system messages.'],
    ['chatBubbles', 'Chat bubbles', 'Speech bubbles over people who talk.'],
    ['showFps', 'Show FPS', 'Frames per second, to check how smoothly it runs.'],
  ],
  Sound: [
    ['masterVolume', 'Volume', 'Everything at once.', ['off', 'low', 'mid', 'high']],
    ['musicVolume', 'Music', 'A tune for every town, field, dungeon, and boss.', ['off', 'low', 'mid', 'high']],
    ['sfxVolume', 'Sound effects', 'Hits, spells, steps, loot, menus, and voices.', ['off', 'low', 'mid', 'high']],
    ['muteAway', 'Mute when away', "Quiet while you're in another window or tab."],
  ],
  Gameplay: [
    ['autoPotion', 'Auto potion', 'Drinks a tonic from your hotkeys when HP or MP drops below this.', ['off', '30%', '50%']],
    ['autoLoot', 'Auto-loot', 'Pick up items just by walking over them.'],
    ['autoStats', 'Auto stats', 'Stat points go where your job needs them as soon as you level up.'],
    ['damageNumbers', 'Damage numbers', 'Numbers pop up over monsters you hit.'],
    ['monsterHp', 'Monster HP bars', 'Health bars over hurt monsters.'],
    ['hitStop', 'Hit-stop', 'Strong hits freeze the action for an instant.'],
  ],
  Phone: [
    ['touchLeft', 'Left-handed', 'The stick on the right, the buttons on the left.'],
  ],
};

// Settings that aren't a plain field: Fullscreen is the window's own state, and Effects sets the
// three effect switches together.
const SPECIAL = {
  fullscreen: {
    get: () => Boolean(typeof document !== 'undefined' && document.fullscreenElement),
    set: (on) => {
      if (on) document.documentElement.requestFullscreen?.().catch(() => {});
      else document.exitFullscreen?.().catch(() => {});
    },
  },
  effects: {
    get: () => settings.effects ?? 'full',
    set: (v) => Object.assign(settings, { effects: v, particles: v, jobAuras: v === 'full', weaponEffects: v !== 'off' }),
  },
};
const getOpt = (key) => (SPECIAL[key] ? SPECIAL[key].get() : settings[key]);
function setOpt(key, v) {
  if (SPECIAL[key]) SPECIAL[key].set(v);
  else settings[key] = v;
  saveSettings();
  applyVolumes();
}

const TAB_NAMES = [...Object.keys(PAGES), 'Controls', 'Character'];

export function optionsWindow(ui, state, world) {
  const win = state.windows.options;
  const W = 300;
  // Tall enough for the longest page (Gameplay's eight rows) to sit clear of the Resume button.
  const H = 284;
  if (!windowFrame(ui, win, W, H, 'Options')) return;
  const { ctx } = ui;
  const th = ui.theme;
  win.tab = tabs(ui, win.x + 10, win.y + 24, TAB_NAMES, win.tab ?? 0, { total: W - 22 });
  const page = TAB_NAMES[win.tab];
  const x = win.x + 10;
  let y = win.y + 46;

  if (PAGES[page]) {
    // Longer pages pack their rows a little tighter so they stay clear of the buttons.
    const step = PAGES[page].length > 6 ? 26.5 : 29;
    for (const [key, label, desc, choices] of PAGES[page]) {
      // The description wraps in the room left of its pills or toggle, and the row grows to fit.
      const room = (choices ? W - 22 - choices.length * 38 : W - 52) - 14;
      // (Measured without drawing: `chars: 0` shows nothing and returns the height it would take.)
      const descH = wrap(ctx, desc, 0, 0, room, { role: 'minor', lineHeight: 8.5, chars: 0 });
      const rowH = step + Math.max(0, descH - 8.5);
      box(ctx, x - 2, y, W - 16, rowH - 3, { fill: '#ffffff', edge: th.light, r: 8, width: 1.2 });
      text(ctx, label, x + 6, y + 11, { size: 8.5, bold: true });
      wrap(ctx, desc, x + 6, y + 21, room, { role: 'minor', lineHeight: 8.5 });
      if (choices) {
        choices.forEach((c, i) => {
          const bx = x + W - 22 - choices.length * 38 + i * 38;
          const on = getOpt(key) === c;
          box(ctx, bx, y + 7, 36, 13, { fill: on ? th.main : hover(ui, bx, y + 7, 36, 13) ? '#ffffff' : th.light, edge: on ? th.dark : null, r: 6.5, width: 1 });
          text(ctx, c, bx + 18, y + 16.5, { size: 7, bold: true, align: 'center', color: on ? '#ffffff' : th.ink });
          if (clicked(ui, bx, y + 7, 36, 13) && !on) setOpt(key, c);
        });
      } else {
        const was = getOpt(key);
        const v = toggle(ui, x + W - 50, y + 7, was);
        if (v !== was) setOpt(key, v);
      }
      y += rowH;
    }
    // Everything you've moved, folded or resized back where it started.
    if (page === 'Interface' && button(ui, x, y + 1, (W - 24) / 2, 18, 'Edit layout (F2)', { size: 7.5, primary: true, iconName: 'map' })) {
      win.open = false;
      toggleLayoutEditor(true);
    }
    if (page === 'Interface' && button(ui, x + (W - 24) / 2 + 4, y + 1, (W - 24) / 2, 18, 'Reset layout', { size: 7.5 })) {
      Object.assign(settings, { windowPos: {}, layout: {}, minimapPos: null, minimapMin: false, minimapSize: 'normal', trackerPos: null });
      saveSettings();
      for (const w of Object.values(state.windows)) {
        if (!w.key) continue;
        w.min = false;
        w.moved = false;
        if (w.home) Object.assign(w, { x: w.home.x, y: w.home.y });
      }
    }
    // The phone's screen in small, with the controls where they'll be.
    if (page === 'Phone') drawTouchPreview(ctx, x + (W - 16) / 2 - 64, y + 2, 128, 72, th);
  } else if (page === 'Controls') {
    // Every action and its key; click a key, then press the new one (two actions swap if they
    // clash). Esc always closes and opens Options, so it isn't on the list.
    const listening = win.listen;
    if (listening && ui.input.raw?.length) {
      const k = ui.input.raw[0];
      if (k !== 'Escape') bind(listening, k);
      win.listen = null;
      ui.input.pressed.clear();
    }
    ACTIONS.forEach(([code, what], i) => {
      const cx = x + (i % 2) * 142;
      const cy = y + Math.floor(i / 2) * 11.4;
      const on = listening === code;
      const name = on ? '...' : keyName(physOf(code));
      const moved = physOf(code) !== code;
      const hot = hover(ui, cx, cy, 34, 10.5);
      box(ctx, cx, cy, 34, 10.5, { fill: on ? th.main : hot ? '#ffffff' : th.light, edge: moved ? th.dark : th.main, r: 3, width: moved ? 1.4 : 0.8 });
      text(ctx, name, cx + 17, cy + 8, { size: name.length > 4 ? 5.5 : 6.5, bold: true, align: 'center', color: on ? '#ffffff' : th.ink });
      text(ctx, what, cx + 38, cy + 8, { size: 6.5, color: COLORS.ink });
      if (hot && !on) tooltip(ui, [{ text: `Change: ${what}`, bold: true }, { text: 'Click, then press the new key', size: 7, color: COLORS.muted }]);
      if (clicked(ui, cx, cy, 34, 10.5)) win.listen = on ? null : code;
    });
    if (listening) text(ctx, 'Press the new key (Esc keeps the old one).', x + 76, win.y + H - 12, { size: 7, bold: true, color: th.dark });
    if (button(ui, x, win.y + H - 24, 70, 18, 'Reset keys', { size: 7.5 })) resetKeys();
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
