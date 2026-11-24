// Fawnelle's painter (2026-11-23): a worker of her own that keeps her rig moving and paints her, off
// the game's thread, so her soft drawing (several milliseconds a frame) never costs the game a frame.
// render/fawnelle/index.js sends each request: the time, how far she has walked since the last one
// (her units), her emotion and how far into it, whether she's talking, and the views wanted (her whole
// body at the screen's density; a close portrait for a talk or a cutscene). This steps her rig once,
// builds her once, paints each view, and hands the pictures back (ImageBitmaps, moved, not copied).
import { stepFawnelle, paintFawnelle, resetFawnelle } from './art.js';

const canvases = new Map();
let last = null;
self.onmessage = ({ data: q }) => {
  try {
    if (q.reset) {
      resetFawnelle();
      last = null;
    }
    const dt = last == null ? 1 / 30 : Math.min(0.1, Math.max(0, q.t - last));
    last = q.t;
    stepFawnelle(dt, q.dist, q.emote, q.emoteT, q.talk);
    const pics = {};
    const moved = [];
    for (const v of q.views) {
      let c = canvases.get(v.id);
      if (!c) canvases.set(v.id, (c = new OffscreenCanvas(v.w, v.h)));
      if (c.width !== v.w || c.height !== v.h) {
        c.width = v.w;
        c.height = v.h;
      }
      const g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, v.w, v.h);
      g.setTransform(v.k, 0, 0, v.k, -v.x0 * v.k, -v.y0 * v.k);
      paintFawnelle(g, v.k, v.upper);
      pics[v.id] = c.transferToImageBitmap();
      moved.push(pics[v.id]);
    }
    self.postMessage({ seq: q.seq, pics }, moved);
  } catch (err) {
    self.postMessage({ seq: q.seq, error: String(err?.stack ?? err) });
  }
};
