// The Mirror Twins' fight, drawn over the Ballroom (world/twins.js; render/scene.js calls these): the
// stopped world while time is held (the room and everyone in it drained of colour; the twins, the only ones
// moving, drawn over it in full colour: twinsLate), the mirrors they trade places through, Twin Bond's
// ribbon, and the little ruby clock over anyone her gaze has frozen.

import { drawTimeStop, drawTimeResume, drawSwap, drawSwapBack, drawBond, drawFrozenMark, swapAlpha, SWAP_DUR } from './looks.js';

const roomOf = (world) => world.dungeon?.room?.twins ?? null;
const isTwin = (m) => m.def.mech === 'twins';
// (the last beat of their entrance, data/scenes.js manor_twins: both red eyes open and time stops, on the
// scene's own clock)
function sceneStop(world) {
  const m = world.mobs?.find((o) => isTwin(o) && o.cine?.act?.move === 'stopped');
  if (!m) return -1;
  const now = world.now + (world.cine?.clock ?? 0);
  return Math.min(1, (now - m.cine.act.at) / 0.3);
}

// Are the twins drawn after everything else just now (time stopped, or starting again)?
export function twinsLate(world, m) {
  if (!isTwin(m)) return false;
  const tw = roomOf(world);
  return Boolean((tw && (tw.stop || tw.resume)) || sceneStop(world) >= 0);
}

// Under the twins: the stopped world over the screen (W x H), the mirrors behind them.
export function drawTwinsUnder(ctx, world, cam, time, W, H) {
  const ss = sceneStop(world);
  if (ss >= 0) drawTimeStop(ctx, W, H, ss, time);
  const tw = roomOf(world);
  if (!tw) return;
  const now = world.now;
  if (tw.stop) drawTimeStop(ctx, W, H, Math.min(1, (now - tw.stop.t0) / 0.3), time);
  if (tw.resume) drawTimeResume(ctx, W, H, (now - tw.resume.t0) / 0.8, time);
  const sw = tw.swap;
  const su = sw ? (now - sw.t0) / SWAP_DUR : -1;
  for (const m of world.mobs) if (isTwin(m)) m.twAlpha = su > 0 && su < 1 ? swapAlpha(su) : 1;
  if (sw?.a && sw.b && su > 0 && su < 1) drawSwapBack(ctx, sw.a[0] - cam.x, sw.a[1] - cam.y, sw.b[0] - cam.x, sw.b[1] - cam.y, su, time);
}

// Over everything: the flash and burst of the trade, the bond, the frozen marks.
export function drawTwinsOver(ctx, world, cam, time) {
  const tw = roomOf(world);
  if (!tw) return;
  const now = world.now;
  const sw = tw.swap;
  const su = sw ? (now - sw.t0) / SWAP_DUR : -1;
  if (sw?.a && sw.b && su > 0 && su < 1) drawSwap(ctx, sw.a[0] - cam.x, sw.a[1] - cam.y, sw.b[0] - cam.x, sw.b[1] - cam.y, su, time);
  const bd = tw.bond;
  if (bd && now < bd.until) {
    const twins = world.mobs.filter((m) => isTwin(m) && m.hp > 0);
    const r = twins.find((m) => m.def.id === 'waltzrondo');
    const n = twins.find((m) => m.def.id === 'waltzminuet');
    if (r && n) {
      const mid = (m) => [m.x - cam.x, (m.ceiling ? m.y - m.def.h * 0.5 : m.y - m.def.h * 0.55) - cam.y];
      const k = Math.min(1, (now - bd.t0) / 0.4, (bd.until - now) / 0.4);
      drawBond(ctx, ...mid(r), ...mid(n), k, bd.to, time);
    }
  }
  for (const mk of tw.marks ?? []) drawFrozenMark(ctx, mk.body.x - cam.x, mk.body.y - 62 - cam.y, Math.min(1, (mk.until - now) / 0.3), time);
}
