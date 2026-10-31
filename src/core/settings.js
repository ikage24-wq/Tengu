// Player settings, saved in the browser apart from characters. `settings` is a live object:
// change a field, then call saveSettings().

const KEY = 'twzt-settings-v1';

export const DEFAULT_SETTINGS = {
  // Display
  hdGraphics: true,
  screenShake: 'full', // 'full' | 'low' | 'off'
  hitStop: true,
  damageNumbers: true,
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
  mapBanner: true,
  showFps: false,
  messageLog: true,
  // Sound ('off' | 'low' | 'mid' | 'high')
  masterVolume: 'mid',
  musicVolume: 'mid',
  sfxVolume: 'high',
  // Gameplay
  autoStats: true, // stat points placed for your job as soon as you get them
  autoLoot: false,
  npcClick: true,
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
