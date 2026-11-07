// Hayate, the great guardian who keeps the island's wind (data/story.js), as she speaks in
// cutscenes (ui/cutscene.js). The player's call (2026-11-05): a sleepy princess. She is drawn on
// the player-character base: a big puffy cloud of white hair, droopy sleepy eyes, the Starlight
// Princess Gown and a crystal crown. Asleep (the default) she yawns and nods, breathing slowly;
// on her happy lines she is awake and smiling.

import { drawHero } from './hero.js';
import { ITEMS } from '../data/items.js';
import '../data/cash.js';

export const HAYATE_LOOK = { hairStyle: 'cloud', hairColor: '#ffffff', hairTip: '#d8e8ff', skinTone: '#fff0e6', eyeColor: '#7a96e0', eyeStyle: 'droopy', outfitColor: '#c9b8ff' };

// The princess gown, piece by piece (a costume is worn as a look on each slot it covers), and the
// crystal crown. Built once, on first use.
let gear = null;
export function hayateGear() {
  if (gear) return gear;
  const gown = ITEMS.cash_costume_ballgown;
  gear = Object.fromEntries(Object.entries(gown?.covers ?? {}).map(([slot, id]) => [slot, { id }]));
  if (gown) gear[gown.slot] = { id: gown.skin };
  gear.hat = { id: 'crystal_crown' };
  return gear;
}

// Hayate at (x, y) (her feet), `s` the hero's scale (2 in the cutscene window), `t` seconds,
// `awake` once she has woken, `talking` while her words type out.
export function drawHayate(ctx, x, y, t, { s = 2, awake = false, talking = false } = {}) {
  // She breathes slowly; asleep, she nods off now and then and catches herself.
  const breath = 0.5 + 0.5 * Math.sin(t * 1.3);
  const nod = awake ? 0 : Math.max(0, Math.sin(t * 0.7)) ** 6 * 1.2 * s;
  drawHero(ctx, { ...HAYATE_LOOK, face: awake ? 'smile' : 'sleepy' }, hayateGear(), x, y - breath * 0.6 * s + nod * 0.3, { pose: 'idle', time: t, seed: 7, scale: s, talking, facing: 1 });
}
