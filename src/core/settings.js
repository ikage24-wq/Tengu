// Player settings, saved in the browser apart from characters. `settings` is a live object:
// change a field, then call saveSettings().

const KEY = 'twzt-settings-v1';

export const DEFAULT_SETTINGS = {
  // Display
  screenShake: true,
  hitStop: true,
  damageNumbers: true,
  particles: 'full', // 'full' | 'reduced' | 'off'
  jobAuras: true,
  weaponEffects: true,
  gearEffects: true,
  showCrowd: true,
  chatBubbles: true,
  monsterHp: true,
  // Interface
  minimap: true,
  questTracker: true,
  mapBanner: true,
  showFps: false,
  messageLog: true,
  // Gameplay
  autoLoot: false,
  npcClick: true,
};

export const settings = { ...DEFAULT_SETTINGS };

export function loadSettings() {
  try {
    Object.assign(settings, DEFAULT_SETTINGS, JSON.parse(localStorage.getItem(KEY) ?? '{}'));
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
