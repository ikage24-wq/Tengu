// The Sunfeather's effects (docs/design/sunfeather.md), and her paths' (the Phoenix `ph*`, the
// Songbird `sb*`): her shots in flight (turned along their flight), her hit marks, sunbirds, the
// charge at her bow and the beam, arrows loosed up and the light raining down, Golden Hour, and
// Sunrise Volley's sun. Strips in tools/fx-art.js, three strip pixels to a game pixel.
import { fxSprite } from './fx-sprites.js';
import { onMob } from './storm-fx.js';

// Her shots in flight. Arrows and bolts point along their flight; birds fly level, facing the way
// they go.
const BIRDS = new Set(['sfbirdshot', 'phbirdshot', 'sbbirdshot', 'sblullabyshot']);
export function drawSunShot(ctx, f, x, y, dir) {
  if (!/^(sf|ph|sb)/.test(f.shot ?? '')) return false;
  const name = `cel${f.shot}`;
  if (BIRDS.has(f.shot)) return fxSprite(ctx, name, x, y + 2 * Math.sin(f.t * 14), { t: f.t, flip: dir < 0, scale: 0.6 }) || true;
  const ang = Math.atan2((f.ty ?? f.y) - f.y, (f.tx ?? f.x + dir) - f.x);
  return fxSprite(ctx, name, x, y, { t: f.t, rot: ang, scale: 0.6 }) || true;
}

// Her bursts. (x, y): where the blow put it (her feet for most, the monster for her marks).
export function drawSunFx(ctx, f, x, y, p) {
  const dir = f.dir || 1;
  const flip = dir < 0;
  const look = f.kind.slice(0, 2);
  const what = f.kind.slice(2);
  switch (what) {
    case 'hit': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, `cel${look}hit`, mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: f.big || f.crit ? 0.72 : 0.58 }) || true;
    }
    case 'hitbig': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, `cel${look}hitbig`, mx, my - (f.h ?? 40) * 0.55, { p, flip, scale: 0.72 }) || true;
    }
    case 'bird': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, `cel${look}bird`, mx, my - (f.h ?? 40) * 0.45, { p, flip, scale: 0.65 }) || true;
    }
    case 'charge': case 'golden': case 'upshot': case 'upbig': case 'sun':
      return fxSprite(ctx, `cel${f.kind}`, x, y + 2, { p, flip }) || true;
    case 'beamline':
      // The beam, from her bow out along the line.
      return fxSprite(ctx, `cel${f.kind}`, x, y, { p, flip }) || true;
    // ----- The Phoenix's own -----
    case 'burn': case 'stuck': case 'blast': case 'burst': {
      // On the monster: its burn licking up, Smoulder's bolt stuck in it, and the bursts.
      const [mx, my] = onMob(f, x, y);
      const h = f.h ?? 40;
      if (what === 'burn') return fxSprite(ctx, `cel${f.kind}`, mx, my + 2, { p, scale: Math.min(1.2, Math.max(0.5, h / 60)) }) || true;
      if (what === 'stuck') return fxSprite(ctx, `cel${f.kind}`, mx - dir * 4, my - h * 0.55, { t: f.t, flip, scale: 0.5, alpha: Math.min(1, (f.dur - f.t) / 0.1) }) || true;
      return fxSprite(ctx, `cel${f.kind}`, mx, my - h * 0.5, { p, scale: what === 'blast' ? 0.85 : 0.7 }) || true;
    }
    // ----- The Songbird's own -----
    case 'notes': {
      const [mx, my] = onMob(f, x, y);
      return fxSprite(ctx, `cel${f.kind}`, mx, my + 2, { p, flip, scale: 0.7 }) || true;
    }
    case 'mend': case 'melody': case 'anthem': case 'ribbon': case 'flock': case 'wave':
      return fxSprite(ctx, `cel${f.kind}`, x, y + 2, { p, flip }) || true;
    case 'wings': case 'sweep': case 'pillar':
      return fxSprite(ctx, `cel${f.kind}`, x, y + 2, { p, flip }) || true;
    case 'featherfall': case 'lightfall':
      // A piece of the rain coming down on a monster (it starts a beat late: `t` below 0).
      if (f.t < 0) return true;
      return fxSprite(ctx, `cel${f.kind}`, x, y + 2, { p, flip: false, scale: 0.85 }) || true;
  }
  return false;
}
