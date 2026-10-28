// Draws sprites off the main thread (see `spriteLater` in pixel.js): it builds the shapes for a
// job, rasterizes them at the screen's density and sends the pixels back. Jobs:
//   { kind: 'mob', art, pose, frame, mood }  a monster's in-between pose (monsters.js)

import { rasterOf, pixelsOf } from './pixel.js';
import { mobBuild } from './mobs/index.js';

self.onmessage = ({ data: { key, job, scale } }) => {
  try {
    const { w, h, res, crisp, pad, raster } = rasterOf(mobBuild(job.art, job.pose, job.frame, job.mood), scale);
    const data = pixelsOf(raster);
    self.postMessage({ key, scale, w, h, res, crisp, pad, gw: raster.gw, gh: raster.gh, data }, [data.buffer]);
  } catch {
    self.postMessage({ key, scale });
  }
};
