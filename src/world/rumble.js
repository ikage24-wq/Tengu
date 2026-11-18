// The rumbles under Windy Canyon (Chapter 3's story): at night Gnarlroot, deep in Rootwood Hollow,
// tosses in his sleep every so often, for a couple of seconds. Shared by what you see (pebbles
// hopping, sand trickling: render/canyon.js) and what you hear (audio/listen.js), on the same clock
// (the page's, in seconds). 0 by day; at night it swells and dies away smoothly.
export const RUMBLE_EVERY = 13;
export const RUMBLE_LEN = 2.6;
export function rumbleAt(time, night) {
  if (!(night > 0.35)) return 0;
  const t = ((time % RUMBLE_EVERY) + RUMBLE_EVERY) % RUMBLE_EVERY;
  if (t > RUMBLE_LEN) return 0;
  return Math.sin((Math.PI * t) / RUMBLE_LEN) ** 2 * Math.min(1, (night - 0.35) / 0.35);
}
