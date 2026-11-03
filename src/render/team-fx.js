// Team moves' effects (world/teamwork.js), in Tengu's own effect art (tools/fx-art.js, the
// `celteam*` strips): the party's own sunrise peach with sky blue beside it, and two stars meeting.
//   - teamcatch: two stars clinking on a monster caught in the air.
//   - teamrevive: a column of peach light rising through someone getting back up.
//   - teamburst: a Group Finisher's last burst, a star for each friend snapping into one.
// And, drawn every frame from the world's team state: the soft link of beads between you and the
// party members fighting by you, and the ring filling round a fallen member someone stands by.

import { fxSprite } from './fx-sprites.js';
import { gfx } from './pixel.js';
import { reviveRings } from '../world/teamwork.js';

export function drawTeamFx(ctx, f, x, y, p) {
  switch (f.kind) {
    case 'teamcatch': {
      // A longer chain clinks bigger.
      const k = Math.min(1.4, 0.5 + 0.12 * (f.chain ?? 1)) * (f.small ? 0.6 : 1);
      fxSprite(ctx, 'celteamcatch', x, y, { p, scale: k, rot: ((f.chain ?? 1) % 2 ? 0.15 : -0.15) });
      return true;
    }
    case 'teamrevive':
      fxSprite(ctx, 'celteamrevive', x, y, { p, scale: 0.55 });
      return true;
    case 'teamburst':
      fxSprite(ctx, 'celteamburst', x, y, { p, scale: 0.9 + 0.08 * Math.min(4, f.n ?? 2) });
      return true;
    default:
      return false;
  }
}

const ease = (k) => k * k * (3 - 2 * k);

// The link and the revive rings (world positions, offset by the camera).
export function drawTeamOverlay(ctx, world, cam, time) {
  const T = world.team;
  if (!T) return;
  const me = world.body;
  // The link fades in and out with who's near (eased per member, so it never pops).
  const fade = (T.linkFade ??= new Map());
  const live = new Set(T.links);
  for (const b of live) if (!fade.has(b)) fade.set(b, 0);
  for (const [b, a] of fade) {
    const to = live.has(b) ? 1 : 0;
    const next = gfx.glowPass ? a : a + (to - a) * 0.12;
    if (!live.has(b) && next < 0.02) {
      fade.delete(b);
      continue;
    }
    fade.set(b, next);
    linkBeads(ctx, me, b, cam, time, ease(Math.min(1, next)));
  }
  for (const r of reviveRings(world)) reviveRing(ctx, r.x - cam.x, r.y - cam.y, r.k, time);
}

// A few beads of light drifting along a soft curve from you to a friend (phased from the pair's
// own positions in the world, so the camera never changes how they move).
function linkBeads(ctx, a, b, cam, time, alpha) {
  const ax = a.x - cam.x;
  const ay = a.y - 28 - cam.y;
  const bx = b.x - cam.x;
  const by = b.y - 28 - cam.y;
  const sag = Math.min(18, Math.abs(bx - ax) * 0.08);
  const n = 4;
  for (let i = 0; i < n; i++) {
    const u = (i / n + time * 0.35 + (a.x + b.x) * 0.0007) % 1;
    const x = ax + (bx - ax) * u;
    const y = ay + (by - ay) * u - Math.sin(Math.PI * u) * sag;
    // Each bead swells in the middle of the way and thins at either end.
    const s = 0.18 + 0.14 * Math.sin(Math.PI * u);
    fxSprite(ctx, 'celteamlink', x, y, { t: time + i * 0.17, scale: s, alpha: alpha * (0.35 + 0.45 * Math.sin(Math.PI * u)) });
  }
}

// A revive under way: a thin peach ring on the ground round them, filling clockwise, with a bead
// riding its leading edge (a supporting touch: the progress itself).
function reviveRing(ctx, x, y, k, time) {
  if (gfx.glowPass) return;
  ctx.save();
  ctx.translate(x, y - 2);
  ctx.scale(1, 0.38);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(196,86,122,0.35)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.stroke();
  const a0 = -Math.PI / 2;
  const a1 = a0 + Math.PI * 2 * k;
  ctx.strokeStyle = '#c4567a';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, 0, 22, a0, a1);
  ctx.stroke();
  ctx.strokeStyle = '#ffc58a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 22, a0, a1);
  ctx.stroke();
  ctx.restore();
  fxSprite(ctx, 'celteamlink', x + Math.cos(a1) * 22, y - 2 + Math.sin(a1) * 22 * 0.38, { t: time, scale: 0.3 });
  // Little stars rise off it as it fills.
  for (let i = 0; i < 3; i++) {
    const u = (time * 0.8 + i / 3) % 1;
    fxSprite(ctx, 'celteamlink', x + (i - 1) * 12, y - 6 - u * 34 * k, { t: time + i * 0.3, scale: 0.16, alpha: (1 - u) * k });
  }
}
