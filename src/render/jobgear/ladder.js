// The Island Journey armour (docs/design/island-journey-gear.md): each ladder tier's sets, one per
// job family, in its own module (render/jobgear/ladder-sprout.js and on). A piece with `ladder`
// is drawn by its tier's module for its family instead of the old job modules (gear.js `gearOf`).
import sprout from './ladder-sprout.js';
import rootwood from './ladder-rootwood.js';
import tidepearl from './ladder-tidepearl.js';
import starglass from './ladder-starglass.js';
import dreamsilk from './ladder-dreamsilk.js';
import regalia from './ladder-regalia.js';

export const LADDER_GEAR = { sprout, rootwood, tidepearl, starglass, dreamsilk, regalia };
