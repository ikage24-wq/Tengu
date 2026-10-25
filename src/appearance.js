// Character appearance: the options players can pick and the default look.
// Pure data and helpers; drawing lives in sprites.js.

export const APPEARANCE_FIELDS = [
  { key: 'hairStyle', label: 'Hair', options: ['wavy', 'bob'] },
  { key: 'hairColor', label: 'Hair Color', options: ['#e9ebfa', '#ff9ec0', '#f5c95c', '#b9a7ff', '#7a5238', '#3b3650'] },
  { key: 'skinTone', label: 'Skin', options: ['#fff0e6', '#fbd9bf', '#e7b48f', '#c98e66'] },
  { key: 'eyeStyle', label: 'Eyes', options: ['sparkle', 'sleepy'] },
  { key: 'eyeColor', label: 'Eye Color', options: ['#4fcfb8', '#9b6cff', '#5aa8ff', '#e8a23c', '#7a4a2b'] },
  { key: 'outfitColor', label: 'Dress', options: ['#fbf3df', '#ffc2d6', '#bff0dc', '#bfe0ff', '#e0cfff', '#4a4560'] },
];

export const COLOR_FIELDS = ['hairColor', 'skinTone', 'eyeColor', 'outfitColor'];

export function defaultAppearance() {
  return {
    hairStyle: 'wavy',
    hairColor: '#e9ebfa',
    skinTone: '#fff0e6',
    eyeStyle: 'sparkle',
    eyeColor: '#4fcfb8',
    outfitColor: '#fbf3df',
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
