// Draws sprites off the main thread (see `spriteLater` in pixel.js): it builds the shapes for a
// job, rasterizes them at the screen's density and sends the pixels back. Jobs:
//   { kind: 'mob', art, pose, frame, mood }  a monster's in-between pose (monsters.js)
//   { kind: 'hero', look, g, rig, light }     a crowd hero's body in a new pose (hero.js)

import { rasterOf, pixelsOf } from './pixel.js';
import { mobBuild } from './mobs/index.js';
import { heroBodySpec } from './hero.js';

self.onmessage = ({ data: { key, job, scale } }) => {
  try {
    const spec = job.kind === 'hero' ? heroBodySpec(job.look, job.g, job.rig, job.light) : mobBuild(job.art, job.pose, job.frame, job.mood);
    const { w, h, res, crisp, pad, raster } = rasterOf(spec, scale);
    const data = pixelsOf(raster);
    self.postMessage({ key, scale, w, h, res, crisp, pad, gw: raster.gw, gh: raster.gh, data }, [data.buffer]);
  } catch {
    self.postMessage({ key, scale });
  }
};
