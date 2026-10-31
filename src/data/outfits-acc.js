// Accessories for the Cash Shop: face pieces (glasses, masks, stickers) worn in the face slot,
// headpieces (halos, horns, crowns), and wings, capes and things on the back. Drawn by
// src/render/jobgear/acc.js, which looks entries up by their index (so keep the order). Same
// fields as outfits-casual.js.

export const ACC_LOOKS = [
  // Face.
  { key: 'biground', name: 'Big Round Glasses', slot: 'face', style: 'fancy', cash: 900, color: '#3a2d4f' },
  { key: 'cateye', name: 'Cat-Eye Glasses', slot: 'face', style: 'fancy', cash: 900, color: '#e8485f' },
  { key: 'starshades', name: 'Star Shades', slot: 'face', style: 'fancy', cash: 1000, color: '#ffd34d' },
  { key: 'monocle', name: 'Gold Monocle', slot: 'face', style: 'fancy', cash: 1100, color: '#ffd66b', colors: false },
  { key: 'masquerade', name: 'Masquerade Mask', slot: 'face', style: 'fancy', cash: 1400, color: '#7a4ad8' },
  { key: 'heartstickers', name: 'Heart Cheek Stickers', slot: 'face', style: 'fancy', cash: 600, color: '#ff6b9a' },
  { key: 'bandaid', name: 'Cheek Bandage', slot: 'face', style: 'fancy', cash: 500, color: '#ffd9b8', colors: false },
  { key: 'eyepatch', name: 'Pirate Eyepatch', slot: 'face', style: 'fancy', cash: 800, color: '#2a2233', colors: false },
  // Head.
  { key: 'halo', name: 'Angel Halo', slot: 'hat', style: 'fancy', cash: 1800, color: '#ffe36b' },
  { key: 'devilhorns', name: 'Little Devil Horns', slot: 'hat', style: 'fancy', cash: 1500, color: '#d8303a' },
  { key: 'flowercrown', name: 'Flower Crown', slot: 'hat', style: 'fancy', cash: 1300, color: '#ff9ec0' },
  { key: 'bunnyband', name: 'Bunny Ear Headband', slot: 'hat', style: 'fancy', cash: 1100, color: '#ffffff' },
  { key: 'sprout', name: 'Sprout Clip', slot: 'hat', style: 'fancy', cash: 700, color: '#7fd17a' },
  { key: 'tinycrown', name: 'Tilted Mini Crown', slot: 'hat', style: 'fancy', cash: 1600, color: '#ffd66b' },
  { key: 'starclips', name: 'Star Hair Clips', slot: 'hat', style: 'fancy', cash: 700, color: '#ffe36b' },
  // Wings, capes and back pieces.
  { key: 'butterfly', name: 'Butterfly Wings', slot: 'cape', style: 'fancy', cash: 2600, color: '#8fd3ff' },
  { key: 'bat', name: 'Little Bat Wings', slot: 'cape', style: 'fancy', cash: 2000, color: '#3a2a4a' },
  { key: 'dragon', name: 'Dragon Wings', slot: 'cape', style: 'fancy', cash: 3000, color: '#3fae7a' },
  { key: 'heartwings', name: 'Tiny Heart Wings', slot: 'cape', style: 'fancy', cash: 1600, color: '#ff8fb8' },
  { key: 'royalcape', name: 'Royal Ermine Cape', slot: 'cape', style: 'fancy', cash: 2400, color: '#c8323f' },
  { key: 'starcape', name: 'Starry Night Cape', slot: 'cape', style: 'fancy', cash: 2400, color: '#2e3f8a' },
  { key: 'bigbow', name: 'Giant Back Bow', slot: 'cape', style: 'fancy', cash: 1400, color: '#ff6b8a' },
  { key: 'teddy', name: 'Teddy Backpack', slot: 'cape', style: 'fancy', cash: 1500, color: '#c8905a' },
];
