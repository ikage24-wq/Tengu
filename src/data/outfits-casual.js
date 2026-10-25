// Casual and swim outfits for the Cash Shop: everyday modern clothes (no fantasy) and beachwear.
// Each entry is drawn by src/render/jobgear/casual.js, which looks entries up by their index.
//
// { key, name, slot, style ('casual' | 'swim'), cash, color, colors (false: one look only),
//   covers (other slots this piece dresses too, like a one-piece's bottom) }

export const CASUAL_LOOKS = [
  { key: 'tee', name: 'Graphic Tee', slot: 'top', style: 'casual', cash: 600, color: '#8fd3ff' },
  { key: 'trunks', name: 'Swim Trunks', slot: 'bottom', style: 'swim', cash: 500, color: '#ff9b7a' },
];
