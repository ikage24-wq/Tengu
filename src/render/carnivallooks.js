// The Clockwork Carnival's boss cast looks, gathered for render/dreamfx.js and render/bossfx.js (and their
// landing lengths for world/bossfight.js): Leonie's (render/leonie/looks.js), Madame Marionette's
// (render/marionetta/looks.js) and Queen Gearheart's (render/gearheart/looks.js).
import { LEONIE_FX, LEONIE_HOLD, LEONIE_OWN_WARN } from './leonie/looks.js';
import { MADAME_FX, MADAME_HOLD, MADAME_OWN_WARN } from './marionetta/looks.js';
import { GEARHEART_FX, GEARHEART_HOLD, GEARHEART_OWN_WARN } from './gearheart/looks.js';

export const CARNIVAL_FX = { ...LEONIE_FX, ...MADAME_FX, ...GEARHEART_FX };
export const CARNIVAL_HOLD = { ...LEONIE_HOLD, ...MADAME_HOLD, ...GEARHEART_HOLD };
export const CARNIVAL_OWN_WARN = [...LEONIE_OWN_WARN, ...MADAME_OWN_WARN, ...GEARHEART_OWN_WARN];
