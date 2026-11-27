// The Candy Volcano's boss cast looks, gathered for render/dreamfx.js and render/bossfx.js (and their
// landing lengths for world/bossfight.js): Toffee's (render/toffee/looks.js) and Gretel's
// (render/gretel/looks.js).
import { TOFFEE_FX, TOFFEE_HOLD, TOFFEE_OWN_WARN } from './toffee/looks.js';
import { GRETEL_FX, GRETEL_HOLD, GRETEL_OWN_WARN } from './gretel/looks.js';

export const CANDY_FX = { ...TOFFEE_FX, ...GRETEL_FX };
export const CANDY_HOLD = { ...TOFFEE_HOLD, ...GRETEL_HOLD };
export const CANDY_OWN_WARN = [...TOFFEE_OWN_WARN, ...GRETEL_OWN_WARN];
