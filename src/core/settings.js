// Player settings, saved in the browser apart from characters. `settings` is a live object:
// change a field, then call saveSettings().

const KEY = 'twzt-settings-v1';

export const DEFAULT_SETTINGS = {
  // Display
  hdGraphics: true,
  sharpness: 'fast', // 'fast' | 'sharp': on a big screen, draw at the usual size and stretch it, or draw every pixel
  screenShake: 'full', // 'full' | 'low' | 'off'
  hitStop: true,
  damageNumbers: true,
  effects: 'full', // 'full' | 'reduced' | 'off': sets the three below together (Options)
  fps: 'max', // 'max' | '30' (battery saver)
  particles: 'full', // 'full' | 'reduced' | 'off'
  jobAuras: true,
  weaponEffects: true,
  showCrowd: true,
  chatBubbles: true,
  monsterHp: true,
  // Interface
  minimap: true,
  questTracker: true,
  trackerPos: null, // where the quest tracker was dragged to ({ x, y }), or null for the top right
  windowPos: {}, // where each window was left, and whether it was folded: { bag: { x, y, min } }
  minimapSize: 'normal', // 'small' | 'normal' | 'big'
  minimapPos: null, // where the minimap was dragged to ({ x, y }), or null for the top left
  minimapMin: false, // folded down to its name
  keys: {}, // actions moved onto other keys (core/keys.js): { KeyI: 'KeyU' }
  layout: {}, // each HUD piece moved, resized or hidden (ui/layout.js): { hotkeys: { dx, dy, s, hide } }
  showFps: false,
  messageLog: true,
  // Sound ('off' | 'low' | 'mid' | 'high')
  masterVolume: 'mid',
  musicVolume: 'mid',
  sfxVolume: 'high',
  muteAway: true, // quiet while the game's window isn't the one you're using
  // Gameplay
  autoPotion: 'off', // 'off' | '30%' | '50%': a tonic from your hotkeys when HP or MP drops below it
  autoStats: true, // stat points placed for your job as soon as you get them
  autoLoot: false,
  // Phone and tablet controls
  touchLeft: false, // the stick on the right, the buttons on the left
};

export const settings = { ...DEFAULT_SETTINGS };

export function loadSettings() {
  try {
    Object.assign(settings, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(KEY) ?? '{}'));
    // Saves from when screen shake was only on or off.
    if (typeof settings.screenShake === 'boolean') settings.screenShake = settings.screenShake ? 'full' : 'off';
  } catch {
    Object.assign(settings, DEFAULT_SETTINGS);
  }
  return settings;
}

export function saveSettings() {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // Private windows may refuse storage; settings then last for the session.
  }
}

export function resetSettings() {
  Object.assign(settings, DEFAULT_SETTINGS);
  saveSettings();
}
