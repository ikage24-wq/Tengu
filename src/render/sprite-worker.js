// Draws sprites off the main thread (see `spriteLater` in pixel.js): it builds the shapes for a
// job, rasterizes them at the screen's density and sends the pixels back. Jobs:
//   { kind: 'mob', art, pose, frame, mood }  a monster's in-between pose (monsters.js)
//   { kind: 'summon', art, frame, cast, mood }  a summon's in-between pose (summons.js)

import { rasterOf, pixelsOf } from './pixel.js';
import { mobBuild } from './mobs/index.js';
import { summonBuild } from './summons.js';

const build = (j) => (j.kind === 'summon' ? summonBuild(j.art, j.frame, j.cast, j.mood) : mobBuild(j.art, j.pose, j.frame, j.mood));

self.onmessage = ({ data: { key, job, scale } }) => {
  try {
    const { w, h, res, crisp, pad, raster } = rasterOf(build(job), scale);
    const data = pixelsOf(raster);
    self.postMessage({ key, scale, w, h, res, crisp, pad, gw: raster.gw, gh: raster.gh, data }, [data.buffer]);
  } catch {
    self.postMessage({ key, scale });
  }
};
