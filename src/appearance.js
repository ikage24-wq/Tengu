// Character appearance: the options players can pick and the default look.
// Pure data and helpers; drawing lives in sprites.js.

export const APPEARANCE_FIELDS = [
  { key: 'hairStyle', label: 'Hair', options: ['bob', 'spiky', 'long', 'bun', 'bald'] },
  { key: 'hairColor', label: 'Hair Color', options: ['#4a3a6b', '#ff7aa2', '#f2c14e', '#6fd3c4', '#3d2b1f', '#e9e9f5'] },
  { key: 'skinTone', label: 'Skin', options: ['#ffe2c7', '#f5c9a5', '#d9a078', '#f7d7e6'] },
  { key: 'eyeStyle', label: 'Eyes', options: ['round', 'sparkle', 'sleepy'] },
  { key: 'eyeColor', label: 'Eye Color', options: ['#2b2d6e', '#8a3fd1', '#1f7a6b', '#b5482b'] },
  { key: 'outfitColor', label: 'Outfit', options: ['#ff8fab', '#7fb8ff', '#ffd66b', '#9be08f', '#c9a6ff', '#ffffff'] },
];

export function defaultAppearance() {
  return {
    hairStyle: 'bob',
    hairColor: '#ff7aa2',
    skinTone: '#ffe2c7',
    eyeStyle: 'sparkle',
    eyeColor: '#2b2d6e',
    outfitColor: '#ff8fab',
  };
}

// Moves one field to the next (or previous) option, wrapping around.
export function cycleAppearance(appearance, key, step) {
  const field = APPEARANCE_FIELDS.find((f) => f.key === key);
  if (!field) return appearance;
  const i = field.options.indexOf(appearance[key]);
  const next = field.options[(i + step + field.options.length) % field.options.length];
  return { ...appearance, [key]: next };
}
