// Monster art: the Star Observatory's sky-folk (the levels 30-35 group dungeon, see
// docs/design/star-observatory.md), Astraea's household, each remade from scratch on its own copy of
// a blank base (2026-11-26):
//   cometcourier   Star Glider (a sugar glider, render/glider/)      nebulawitch   Nebula Knitter (an alpaca, render/alpaca/)
//   starcarto      Spyglass Loris (render/loris/)                     mothlibrarian Raven Scribe (render/raven/)
//   meteormaiden   Meteor Maiden (render/meteormaiden/)               geminighosts  the Mirror Twins (render/gemini/)
// (The old ids stay so old saves and quest counts keep working.) Also two little star helpers the sky
// bosses draw with.

import { T, TAU, D2R, star } from './critter.js';
import { METEOR_MAIDEN_ART, METEOR_MAIDEN_SIZE } from '../meteormaiden/index.js';
import { TWIN_ART, TWIN_SIZE } from '../gemini/index.js';
import { STAR_GLIDER_ART, STAR_GLIDER_SIZE } from '../glider/index.js';
import { SPYGLASS_LORIS_ART, SPYGLASS_LORIS_SIZE } from '../loris/index.js';
import { NEBULA_KNITTER_ART, NEBULA_KNITTER_SIZE } from '../alpaca/index.js';
import { RAVEN_SCRIBE_ART, RAVEN_SCRIBE_SIZE } from '../raven/index.js';

// A five-point star.
export function star5(x, y, r, c, deg = -90) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (deg + i * 36) * D2R;
    const rr = i % 2 ? r * 0.45 : r;
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]);
  }
  return T(pts, c);
}
// A few little stars twinkling round a point, on the phase.
export function twinkles(x, y, q, n = 3, rad = 14) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + q * TAU * 0.5;
    const k = 0.5 + 0.5 * Math.sin(q * TAU * 2 + i * 2);
    if (k > 0.25) out.push(...star(x + Math.cos(a) * rad, y + Math.sin(a) * rad * 0.6, 1.4 * k + 0.4, '#fff6c8'));
  }
  return out;
}

export const ART = {
  // (the Star Glider, 2026-11-26: a sugar glider who catches falling stars in its pouch, render/glider/)
  cometcourier: STAR_GLIDER_ART,
  // (the Nebula Knitter, 2026-11-26: an alpaca whose fleece is a star nursery, render/alpaca/)
  nebulawitch: NEBULA_KNITTER_ART,
  // (the Spyglass Loris, 2026-11-26: the tower's slow star surveyor, render/loris/)
  starcarto: SPYGLASS_LORIS_ART,
  // (the Raven Scribe, 2026-11-26: the Archive's copyist, a raven with a quill, render/raven/)
  mothlibrarian: RAVEN_SCRIBE_ART,
  // (The Meteor Golem was wiped 2026-11-22; the Meteor Maiden took its place, meteorrig.js.)
  // (rebuilt 2026-11-26 to today's standard on her own copy of the kid base, her own hair and face:
  // render/meteormaiden/)
  meteormaiden: METEOR_MAIDEN_ART,
  // (the Mirror Twins, 2026-11-24: a ghost girl and her night twin back to back, render/gemini/)
  geminighosts: TWIN_ART,
};
export const INFO = {
  cometcourier: { name: 'Star Glider', w: STAR_GLIDER_SIZE.w, h: STAR_GLIDER_SIZE.h },
  nebulawitch: { name: 'Nebula Knitter', w: NEBULA_KNITTER_SIZE.w, h: NEBULA_KNITTER_SIZE.h },
  starcarto: { name: 'Spyglass Loris', w: SPYGLASS_LORIS_SIZE.w, h: SPYGLASS_LORIS_SIZE.h },
  mothlibrarian: { name: 'Raven Scribe', w: RAVEN_SCRIBE_SIZE.w, h: RAVEN_SCRIBE_SIZE.h },
  meteormaiden: { name: 'Meteor Maiden', w: METEOR_MAIDEN_SIZE.w, h: METEOR_MAIDEN_SIZE.h },
  geminighosts: { name: 'Gemini Ghosts', ...TWIN_SIZE },
};
