// The Sky Whale's boss cast looks, gathered for render/dreamfx.js and render/bossfx.js (and their landing
// lengths for world/bossfight.js): Captain Gale's (render/gale/looks.js) and the Barnacle Matriarch's
// (render/matriarch/looks.js).
import { GALE_FX, GALE_HOLD, GALE_OWN_WARN } from './gale/looks.js';
import { MATRIARCH_FX, MATRIARCH_HOLD, MATRIARCH_OWN_WARN } from './matriarch/looks.js';
// (and The Sulk's, render/sulk/looks.js)
import { SULK_FX, SULK_HOLD, SULK_OWN_WARN } from './sulk/looks.js';

export const SKY_FX = { ...GALE_FX, ...MATRIARCH_FX, ...SULK_FX };
export const SKY_HOLD = { ...GALE_HOLD, ...MATRIARCH_HOLD, ...SULK_HOLD };
export const SKY_OWN_WARN = [...GALE_OWN_WARN, ...MATRIARCH_OWN_WARN, ...SULK_OWN_WARN];
