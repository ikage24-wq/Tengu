// Icons for the capsule machines' star prizes whose signature piece is drawn live in the game
// (render/gacha.js), so the worn shapes alone would show only a strap or a mantle: the Godforge
// Hammer and the Wandering Market. Same 16 x 16 cell as the other item icons.

import { R, E, T, F } from '../pixel.js';
import { ITEM_ART } from './items.js';

// A rectangle w x h centred on (cx, cy), turned by `a` radians.
function rot(cx, cy, w, h, a, c) {
  const [co, si] = [Math.cos(a), Math.sin(a)];
  const p = (x, y) => [cx + x * co - y * si, cy + x * si + y * co];
  return T([p(-w / 2, -h / 2), p(w / 2, -h / 2), p(w / 2, h / 2), p(-w / 2, h / 2)], c);
}

// The Godforge Hammer: obsidian head banded in gold, its faces molten, a gold-wrapped haft, a
// scrap of the crimson mantle behind.
ITEM_ART.look_gacha_godhammer_cape = () => {
  const a = -0.75;
  return [
    T([[1, 9], [5, 7.6], [7, 15], [2.4, 15.4], [3.6, 13], [1.4, 13.6]], '#6a1420'), F(T([[2, 13.4], [3, 12.6], [3.4, 14.4]], '#ff5a1a')),
    rot(7.2, 9.6, 1.8, 10, a, '#3a2a1a'),
    rot(5.4, 11.6, 2.2, 1, a, '#ffcf4a'), rot(6.8, 10.1, 2.2, 1, a, '#ffcf4a'), rot(8.2, 8.6, 2.2, 1, a, '#ffcf4a'),
    E(3.6, 13.6, 1.2, 1.2, '#ffcf4a'), F(E(3.6, 13.6, 0.55, 0.55, '#ff5a1a')),
    rot(10.6, 5.2, 9, 4.6, a, '#2a2232'), F(rot(10.2, 4.7, 8.2, 1.2, a, '#463a56')),
    rot(9.2, 6.4, 1, 4.8, a, '#ffcf4a'), rot(12, 4, 1, 4.8, a, '#ffcf4a'),
    rot(7.6, 8, 0.9, 4, a, '#ff7a2a'), rot(13.6, 2.4, 0.9, 4, a, '#ff7a2a'),
    F(E(10.6, 5.2, 0.7, 0.7, '#fff0a0')),
  ];
};

// The Wandering Market: the road peddler's towering pack, a wicker basket, a crate of potions,
// a plaid bedroll, the caged star and the map, a patched umbrella on top, a kettle at its side.
ITEM_ART.look_gacha_marketpack_cape = () => [
  T([[9.4, 0.6], [15.4, 3.4], [12.4, 3.4]], '#8a7a52'), T([[9.4, 0.6], [12.4, 3.4], [9.4, 3.4]], '#5a7a5a'), T([[9.4, 0.6], [9.4, 3.4], [6.4, 3.4]], '#a8584a'), T([[9.4, 0.6], [6.4, 3.4], [3.4, 3.4]], '#c8a060'),
  R(9.1, 0, 0.6, 6, '#6a4228'),
  E(6.4, 4.8, 2.4, 2, '#fff0a0'), F(E(6.4, 4.8, 1, 1, '#ffffff')), F(R(3.8, 6.2, 5.2, 0.6, '#d8a440')),
  R(10.4, 3.6, 2.4, 3.2, '#f4e8c8'), F(R(10.9, 4.4, 1.2, 0.4, '#5ab8ff')), F(R(10.9, 5.4, 1.2, 0.4, '#5ab8ff')),
  R(2.4, 6.8, 11.4, 2.4, '#a8402a'), F(R(4.4, 6.8, 0.6, 2.4, '#7a2a1a')), F(R(8.4, 6.8, 0.6, 2.4, '#7a2a1a')), F(R(2.4, 7.8, 11.4, 0.5, '#7a2a1a')),
  R(2.8, 9.2, 6.2, 2.6, '#9a6a44'), E(10.6, 10.6, 1.2, 1.2, '#ff7ab8'), E(12.6, 10.6, 1.2, 1.2, '#5ae0d0'),
  R(1.8, 11.8, 12.6, 4, '#b8905a'), F(R(1.8, 11.8, 12.6, 0.8, '#8a6a3a')), F(R(3, 13, 1, 1.4, '#9a7444')), F(R(6, 13, 1, 1.4, '#9a7444')), F(R(9, 13, 1, 1.4, '#9a7444')), F(R(12, 13, 1, 1.4, '#9a7444')),
  E(15, 9.4, 1.4, 1.2, '#5a5f6e'), F(E(14.6, 9, 0.5, 0.4, '#8a90a0')),
];

// The Moon Moth Wings: a great midnight moth wing pair, cyan moon-eyes glowing, stars inside.
ITEM_ART.look_gacha_moonmothwings_cape = () => [
  T([[8, 7], [3, 1], [0.6, 2.4], [1, 7], [4.4, 9]], '#a8b4f0'), T([[8, 7], [13, 1], [15.4, 2.4], [15, 7], [11.6, 9]], '#a8b4f0'),
  T([[8, 7], [3.4, 1.8], [1.4, 3], [1.8, 6.6], [4.6, 8.4]], '#2a2c6a'), T([[8, 7], [12.6, 1.8], [14.6, 3], [14.2, 6.6], [11.4, 8.4]], '#2a2c6a'),
  T([[8, 8], [4.6, 9.6], [2.6, 15], [4.4, 14], [6.6, 11]], '#22245a'), T([[8, 8], [11.4, 9.6], [13.4, 15], [11.6, 14], [9.4, 11]], '#22245a'),
  E(4.4, 4.6, 1.5, 1.4, '#d8e0ff'), E(4.4, 4.6, 1, 1, '#7ae8ff'), E(11.6, 4.6, 1.5, 1.4, '#d8e0ff'), E(11.6, 4.6, 1, 1, '#7ae8ff'), F(E(3, 7, 0.4, 0.4, '#e8f0ff')), F(E(13, 7.4, 0.4, 0.4, '#e8f0ff')), F(E(5, 12, 0.4, 0.4, '#e8f0ff')),
  R(7.4, 5, 1.2, 6, '#1a1a48'), E(8, 4.6, 0.9, 0.9, '#1a1a48'),
];

// The Koi Stream: a loop of living water and its koi, red-and-white and gold.
ITEM_ART.look_gacha_koistream_cape = () => [
  E(8, 8.6, 7.2, 3.8, '#4ac8e0'), E(8, 8.6, 5.6, 2.4, '#bff4ff'), E(8, 8.6, 4.4, 1.4, '#4ac8e0'),
  E(3.6, 6.6, 2.6, 1.3, '#fff6ee'), F(E(3.8, 6.4, 1, 0.7, '#e8402a')), E(1.2, 6.8, 1, 0.7, '#ffb08a'),
  E(12.2, 11, 2.6, 1.3, '#ffcf4a'), F(E(12, 10.8, 1, 0.7, '#ffe9a0')), E(14.6, 10.8, 1, 0.7, '#ffe08a'),
  F(E(10.4, 6, 0.6, 0.6, '#ffffff')), F(E(5.4, 11, 0.5, 0.5, '#ffffff')),
];
