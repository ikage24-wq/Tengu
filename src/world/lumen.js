// Old Lumen, the great lantern fish under Lighthouse Point (data/fishing.js fish_lumen), the end of
// Granny Kelp's story (data/quests.js kelp_1 to kelp_5). While her last quest is on, he is what
// bites at the deep water off the point. He fights like nothing else on the sea (world/fishing.js,
// the reel: he pulls hard and gives line slowly), and when you land him you let him go: he sees
// the light up close, calms, and the sea with him.

import { FISH_BY_ID } from '../data/fishing.js';
import { questState, recordCatch } from '../core/quests.js';

const QUEST = 'kelp_5';
const waiting = (char) => questState(char, QUEST) === 'active' && !(char.quests[QUEST]?.catches?.fish_lumen > 0);

// What bites at a spot instead of its usual fish: Old Lumen, at the point's deep water, while
// Granny Kelp is waiting for him. Null otherwise.
export function bossFish(world, spot) {
  if (!spot.deep || world.map.id !== 'lagoon' || !waiting(world.char)) return null;
  return FISH_BY_ID.fish_lumen;
}

// Landed: counted for the quest, and let go.
export function lumenCaught(world, f) {
  recordCatch(world.char, f.fish.id);
  world.char.lumen = true;
  // On the Fish page, as the one you let go.
  const rec = ((world.char.fishBook ??= {}).fish_lumen ??= { n: 0 });
  rec.n += 1;
  rec.best = Math.max(rec.best ?? 0, f.size);
  world.log(`You reeled in Old Lumen, ${f.size} cm of glowing old fish! He looks up at the light... and you let him go.`, '#fff3a6');
  world.log('He glides off into the deep, his glow steady now. The sea feels calmer.', '#9fe8ff');
  (world.bubbles ??= {}).kelp = { text: 'There he goes... Well done, dearie. Come and see me!', t: 6 };
  world.juice.push({ type: 'loot', x: f.spot.bx, y: f.spot.by - 10, color: '#fff3a6' });
}

// He got away: he'll be back if you cast again.
export function lumenLost(world, f) {
  if (!f.fish.boss) return;
  (world.bubbles ??= {}).kelp = { text: "Don't fret, he'll come again. Gently does it!", t: 5 };
}
