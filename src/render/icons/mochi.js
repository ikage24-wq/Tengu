// Icons for the Mochi Garden's crops (data/mochi-raise.js GARDEN_CROPS) and the Mochi Bell, in the drop icons' kit
// (icons/items.js); added to ITEM_ART so icons.js draws them like any other. (The sweets cooked
// from them are drawn as the Mochi holds them: render/mochi-sweets.js sweetIcon.)

import { ITEM_ART, lt, S, oval, ball, tube, glint, framed, W } from './items.js';

const ART = {
  // A little cloth sack of mochi rice, tied at the neck, a few grains on its front.
  mochi_rice: () => [
    ...ball([[3, 14.6], [2.4, 10], [4.4, 6.6], [11.6, 6.6], [13.6, 10], [13, 14.6]], '#f2e6cf'),
    ...ball([[5, 6.8], [5.4, 3.4], [8, 1.8], [10.6, 3.4], [11, 6.8]], '#f2e6cf'),
    S(tube([[4.6, 6.6], [11.4, 6.6]], 1.3), '#c8a070'),
    ...[[6, 11.4], [8.6, 12.4], [10.4, 10.4], [7.4, 9.4]].map(([x, y]) => S(oval(x, y, 0.95, 0.55, 20, 10), W)),
    ...glint(5, 9.6, 0.8),
  ],
  // Three red beans, each with its little white eye.
  azuki: () => [[4.6, 10.8, -20], [10, 11.6, 25], [7.2, 6.4, 5]].flatMap(([x, y, a]) => [...ball(oval(x, y, 3.4, 2.5, a, 20), '#9a2a3a'), S(oval(x - 0.6, y - 0.9, 1, 0.45, a, 10), '#f4d8dc')]),
  // A little wooden bowl heaped with kinako.
  kinako: () => [
    ...ball([[1.6, 8.6], [14.4, 8.6], [12.4, 14.2], [3.6, 14.2]], '#b07a4a'),
    ...ball([[3, 8.8], [5.4, 5.2], [8, 4.2], [10.6, 5.2], [13, 8.8]], '#e6c56a'),
    ...glint(6.2, 6.4, 0.7),
  ],
  // A fire pepper: red, curled, with its green cap and stalk.
  fire_pepper: () => [
    S(tube([[11, 3.4], [11.6, 6.2], [10.4, 10], [7.4, 13], [3.2, 14.2]], 2.8, 0.6), '#e8483a'),
    S(tube([[10.4, 4.6], [10.4, 7.2], [9, 10]], 0.7), lt('#e8483a')),
    ...ball(oval(11.2, 3.4, 2.3, 1.4, 0, 14), '#5aa040'),
    S(tube([[11.4, 2.4], [12.8, 0.6]], 0.7), '#3f7a2a'),
  ],
  // The Mochi Bell: a little brass bell on a sakura ribbon bow, its clapper peeking out below.
  mochi_bell: () => [
    S(tube([[8, 3.4], [4.2, 1.2], [3.2, 3.6], [8, 3.6]], 1.3), '#ff9ec0'),
    S(tube([[8, 3.4], [11.8, 1.2], [12.8, 3.6], [8, 3.6]], 1.3), '#ff9ec0'),
    ...ball([[4, 13], [4.4, 8.4], [5.8, 5.4], [8, 4.4], [10.2, 5.4], [11.6, 8.4], [12, 13]], '#f2c94c'),
    S(tube([[3.2, 13], [12.8, 13]], 1.4), '#d8a830'),
    ...ball(oval(8, 14.6, 1.3, 1.1, 0, 12), '#b8862a'),
    ...ball(oval(8, 3.6, 1.4, 1.1, 0, 12), '#ff7aa8'),
    ...glint(6, 7.6, 0.8),
  ],
};
for (const [id, draw] of Object.entries(ART)) ITEM_ART[id] = framed(draw);
