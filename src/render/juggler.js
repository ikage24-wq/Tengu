// The Spell Juggler's orbs circling her (world/juggle.js): each drawn from its own art strip
// (`celjgorb*`, tools/fx-art.js), behind her on the far side of the orbit and in front on the near
// side. When an orb is flung or caught the others glide round to space themselves evenly again
// (each eases toward its new place, never snapping); a new orb swells in from nothing, and a caught
// one lands with a twinkle (`celjgcatch`).

import { fxSprite } from './fx-sprites.js';
import { orbSlot } from '../world/juggle.js';

const CHEST = 13;
const SWELL = 0.22;

export function drawOrbs(ctx, world, hx, hy, time, layer) {
  const j = world.juggle;
  if (!j || (!j.orbs.length && !j.caught.length)) return;
  const n = j.orbs.length;
  const cy = hy - CHEST;
  j.orbs.forEach((o, i) => {
    // Glide toward this orb's even place in the ring (render-side easing of its angle offset).
    const want = (i / Math.max(1, n)) * Math.PI * 2;
    if (o.shown == null) o.shown = want;
    let d = want - o.shown;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    // (Eased once a frame: on the back pass, which is drawn first.)
    if (layer === 'back') o.shown += d * Math.min(1, (world.dt ?? 1 / 60) * 10);
    const a = j.spin + o.shown;
    const slot = orbSlot(a, 0, 1);
    if ((layer === 'front') !== slot.front) return;
    const age = world.now - (o.born ?? -9);
    const grow = Math.min(1, age / SWELL);
    const s = (0.62 + 0.1 * Math.sin(a)) * (1 - (1 - grow) ** 3);
    fxSprite(ctx, `celjgorb${o.el}`, hx + slot.x, cy + slot.y, { t: time + i * 0.3, scale: s, alpha: 1 });
  });
  if (layer !== 'front') return;
  for (const c of j.caught) {
    const k = (world.now - c.at) / 0.5;
    fxSprite(ctx, 'celjgcatch', hx + world.body.facing * 10, cy, { p: k, scale: 0.4 });
  }
}
