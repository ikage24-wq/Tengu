// Rebindable keys. Every action is known by its default key's code (the game reads `KeyI` for the
// Bag wherever it looks), and settings.keys moves an action onto another physical key:
// { KeyI: 'KeyU' } puts the Bag on U. The keyboard layer (input.js) turns each physical key into
// the action's code before anything else sees it, so every part of the game follows a rebind.
// Esc is never moved (it always closes things and opens Options).

import { settings, saveSettings } from './settings.js';

export const ACTIONS = [
  ['ArrowLeft', 'Move left'], ['ArrowRight', 'Move right'], ['ArrowUp', 'Climb up, talk, portals'], ['ArrowDown', 'Climb down, crouch'],
  ['Space', 'Jump'], ['KeyZ', 'Attack'], ['KeyX', 'Pick up loot'],
  ['KeyQ', 'Hotkey Q'], ['KeyW', 'Hotkey W'], ['KeyE', 'Hotkey E'], ['KeyR', 'Hotkey R'], ['KeyA', 'Hotkey A'], ['KeyS', 'Hotkey S'],
  ['KeyD', 'Hotkey D'], ['KeyF', 'Hotkey F'], ['Digit1', 'Hotkey 1'], ['Digit2', 'Hotkey 2'], ['Digit3', 'Hotkey 3'], ['Digit4', 'Hotkey 4'],
  ['KeyI', 'Bag'], ['KeyC', 'Stats'], ['KeyK', 'Skills'], ['KeyL', 'Quests'], ['KeyM', 'World map'], ['KeyN', 'Friends'],
  ['KeyB', 'Collection'], ['KeyG', 'Life skills'], ['KeyO', 'Cash Shop'], ['KeyP', 'Mochi pets'], ['KeyY', 'Decorate island'],
  ['KeyT', 'Emotes'], ['KeyV', 'Ping'], ['KeyH', 'Mount'], ['Enter', 'Chat'], ['Backquote', 'Hide interface'], ['F2', 'Edit layout'],
];
const ACTION_CODES = new Set(ACTIONS.map(([c]) => c));

// The physical key an action is on.
export const physOf = (action) => settings.keys?.[action] ?? action;

// The action a physical key does (its code as the game reads it), or null when its own action has
// moved elsewhere and nothing took its place.
export function gameCode(phys) {
  const keys = settings.keys ?? {};
  for (const [action, p] of Object.entries(keys)) if (p === phys) return action;
  if (ACTION_CODES.has(phys) && keys[phys] && keys[phys] !== phys) return null;
  return phys;
}

// Puts an action on a key. If another action was on that key, the two swap.
export function bind(action, phys) {
  if (phys === 'Escape' || !ACTION_CODES.has(action)) return false;
  const keys = { ...(settings.keys ?? {}) };
  const was = physOf(action);
  const other = gameCode(phys);
  if (other && other !== action && ACTION_CODES.has(other)) keys[other] = was;
  keys[action] = phys;
  for (const [a, p] of Object.entries(keys)) if (a === p) delete keys[a];
  settings.keys = keys;
  saveSettings();
  return true;
}

export function resetKeys() {
  settings.keys = {};
  saveSettings();
}

// A key's name for showing: Q, 1, Space, ←, F2.
export function keyName(code) {
  const arrows = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' };
  if (arrows[code]) return arrows[code];
  if (code === 'Backquote') return '`';
  return code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'Num ').replace(/Left$|Right$/, '');
}
