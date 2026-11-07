// Icons for fishing and cooking: every fish (one body drawn in each fish's colours and pattern),
// the fishing rod, and the dishes (a bowl or plate with what's on it). Same kit and style as the
// drop icons (icons/items.js); added to ITEM_ART so icons.js draws them like any other.

import { FISH } from '../../data/fishing.js';
import { fishArt } from './fish.js';
import { DISHES, FEASTS } from '../../data/cooking.js';
import { ITEM_ART, hi, lt, sh, S, oval, bez3, rect, ball, tube, glint, twinkle, framed, W } from './items.js';

// A wooden rod with a cork grip, a reel, and the line curling to a red-and-white bobber.
function rodArt() {
  const wood = '#c99a6b';
  return [S(tube([[2, 15], [14, 1.6]], 1.4, 0.6), wood), S(tube([[2.4, 14.4], [5.6, 10.8]], 2), '#e8c69a'), ...ball(oval(6.4, 11.6, 1.8, 1.8, 0, 12), '#9aa8c6'),
    S(tube([[14, 1.6], [14.6, 6], [13, 10]], 0.3), '#ffffff'), ...ball(oval(13, 11.6, 1.8, 1.8, 0, 12), '#ff6b8a'), S(rect(11.2, 11.4, 3.6, 1.2), W)];
}

// A dish: a bowl (soups, rice) or a plate, its food on top in its own colours, steam rising.
function dishArt(d) {
  return () => {
    const out = [];
    const [c1, c2] = d.colors;
    if (d.vessel === 'bowl') {
      out.push(...ball([[1.4, 8], [14.6, 8], [12.6, 13.4], [3.4, 13.4]], d.dish ?? '#fff4ea'), S(rect(5, 13.2, 6, 1.4), sh(d.dish ?? '#fff4ea')));
      out.push(S(oval(8, 8, 6.6, 2, 0, 18), c1), S(oval(6.4, 7.6, 2.2, 0.8, 0, 10), hi(c1)));
      if (c2) for (const [x, y] of [[5, 7.4], [9, 7], [11, 8.2]]) out.push(S(oval(x, y, 1.3, 0.9, 0, 10), c2));
    } else {
      out.push(S(oval(8, 12, 7.4, 2.6, 0, 22), d.dish ?? '#fff4ea'), S(oval(8, 12.6, 6.2, 1.6, 0, 18), sh(d.dish ?? '#fff4ea')));
      out.push(...ball([[3, 11], [4, 6.6], [8, 5], [12, 6.6], [13, 11]], c1));
      if (c2) out.push(S(oval(8, 7.6, 3, 1.4, 0, 12), c2));
    }
    out.push(S(tube([[6, 4.6], [5.4, 2.8], [6.4, 1]], 0.4), '#ffffff'), S(tube([[10, 4.6], [10.8, 2.6], [10, 0.8]], 0.4), '#ffffff'), ...glint(4.4, 9, 0.5));
    return out;
  };
}

for (const f of FISH) ITEM_ART[f.id] = framed(fishArt(f));
ITEM_ART.fishing_rod = framed(rodArt);
for (const d of DISHES) ITEM_ART[d.id] = framed(dishArt(d));
for (const f of FEASTS) ITEM_ART[f.id] = framed(dishArt(f));
