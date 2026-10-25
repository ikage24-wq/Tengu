// Getting around a map: a graph of the surfaces (the ground and every ledge) and the moves
// between them — jumping up to a ledge, dropping through one, walking off an edge, and climbing
// a rope up or down — with a shortest-path search, and a driver that turns a path into
// left/right/up/down/jump intents for physics.js. Party members use it to reach monsters
// anywhere on a field map.

import { surfacesOf, CLIMB_SPEED, WALK_SPEED } from './physics.js';

const REACH_UP = 86; // how high a jump reliably lands (the full jump is ~100px)
const REACH_SIDE = 44; // how wide a gap a running jump clears
const INSET = 10; // keep landings this far inside a ledge's ends

const cache = new WeakMap();

const contains = (s, x) => x >= s.x1 && x <= s.x2;

// The surface something standing at (x, y) is on, or the first one below it.
export function surfaceBelow(nav, x, y) {
  let best = -1;
  nav.surfaces.forEach((s, i) => {
    if (contains(s, x) && s.y >= y - 3 && (best < 0 || s.y < nav.surfaces[best].y)) best = i;
  });
  return best < 0 ? nav.ground : best;
}

// The surface a body is standing on (bodies get fresh surface objects each step, so match by
// position), or -1 in the air or on a rope.
export function surfaceOf(nav, body) {
  if (!body.onGround) return -1;
  return nav.surfaces.findIndex((s) => Math.abs(s.y - body.y) < 1.5 && contains(s, body.x));
}

export function navOf(map) {
  let nav = cache.get(map);
  if (nav) return nav;
  const surfaces = surfacesOf(map);
  const ground = surfaces.findIndex((s) => s.ground);
  nav = { surfaces, ground, edges: surfaces.map(() => []) };
  const below = (x, y) => surfaceBelow(nav, x, y + 2);
  surfaces.forEach((a, i) => {
    surfaces.forEach((b, j) => {
      if (i === j) return;
      // Jump up: straight up from under the ledge, or a running jump across a small gap.
      if (b.y < a.y && a.y - b.y <= REACH_UP) {
        const lo = Math.max(a.x1 + 4, b.x1 + INSET);
        const hi = Math.min(a.x2 - 4, b.x2 - INSET);
        if (lo <= hi) nav.edges[i].push({ to: j, kind: 'jump', lo, hi });
        else if (b.x1 - a.x2 > 0 && b.x1 - a.x2 <= REACH_SIDE) nav.edges[i].push({ to: j, kind: 'jump', lo: a.x2 - 6, hi: a.x2 - 6, land: b.x1 + INSET + 6 });
        else if (a.x1 - b.x2 > 0 && a.x1 - b.x2 <= REACH_SIDE) nav.edges[i].push({ to: j, kind: 'jump', lo: a.x1 + 6, hi: a.x1 + 6, land: b.x2 - INSET - 6 });
      }
    });
    if (a.ground) return;
    // Drop through the ledge onto whatever is right below, wherever that's this surface.
    const drops = new Map();
    for (let x = a.x1 + 6; x <= a.x2 - 6; x += 8) {
      const j = below(x, a.y);
      if (j === i) continue;
      const r = drops.get(j);
      if (r) r.hi = x;
      else drops.set(j, { lo: x, hi: x });
    }
    for (const [j, r] of drops) nav.edges[i].push({ to: j, kind: 'drop', lo: r.lo, hi: r.hi });
    // Walk off either end.
    for (const x of [a.x1 - 8, a.x2 + 8]) {
      if (x < 12 || x > map.width - 12) continue;
      nav.edges[i].push({ to: below(x, a.y), kind: 'walk', lo: x, hi: x });
    }
  });
  for (const r of map.ropes) {
    const bottom = nav.surfaces.findIndex((s) => Math.abs(s.y - r.bottom) < 2 && contains(s, r.x));
    const top = nav.surfaces.findIndex((s) => Math.abs(s.y - r.top) < 2 && contains(s, r.x));
    if (bottom < 0 || top < 0) continue;
    nav.edges[bottom].push({ to: top, kind: 'ropeUp', lo: r.x, hi: r.x, rope: r });
    nav.edges[top].push({ to: bottom, kind: 'ropeDown', lo: r.x, hi: r.x, rope: r });
  }
  cache.set(map, nav);
  return nav;
}

// Seconds each kind of move costs on top of the walk to it.
const MOVE_COST = { jump: 0.5, drop: 0.4, walk: 0.3 };

// The cheapest path from surface `from` (standing at x) to x `tx` on surface `to`: a list of
// steps { from, to, kind, x, land, rope }. Empty when already there; null when unreachable.
export function findPath(nav, from, x, to, tx) {
  if (from < 0 || to < 0) return null;
  if (from === to) return [];
  const n = nav.surfaces.length;
  const cost = new Array(n).fill(Infinity);
  const at = new Array(n).fill(0);
  const prev = new Array(n).fill(null);
  const done = new Array(n).fill(false);
  cost[from] = 0;
  at[from] = x;
  for (;;) {
    let i = -1;
    for (let k = 0; k < n; k++) if (!done[k] && cost[k] < Infinity && (i < 0 || cost[k] < cost[i])) i = k;
    if (i < 0) return null;
    if (i === to) break;
    done[i] = true;
    for (const e of nav.edges[i]) {
      const sx = Math.max(e.lo, Math.min(e.hi, at[i]));
      const land = e.land ?? sx;
      const move = e.rope ? (e.rope.bottom - e.rope.top) / CLIMB_SPEED : MOVE_COST[e.kind];
      const c = cost[i] + Math.abs(sx - at[i]) / WALK_SPEED + move;
      if (c < cost[e.to]) {
        cost[e.to] = c;
        at[e.to] = land;
        prev[e.to] = { from: i, to: e.to, kind: e.kind, x: sx, land, rope: e.rope ?? null };
      }
    }
  }
  const steps = [];
  for (let k = to; k !== from; k = prev[k].from) steps.unshift(prev[k]);
  return steps;
}

// Intents that carry a body along a path toward (tx) on the last surface. Advances (shifts)
// the path as steps complete; returns { intent, lost } where lost means the body ended up
// somewhere the path didn't expect (fell, got knocked off) and should plan again.
export function followPath(nav, body, path, tx, near = 4) {
  const intent = { left: false, right: false, up: false, down: false, jump: false };
  const toward = (x, slack) => {
    if (Math.abs(x - body.x) <= slack) return true;
    intent.right = x > body.x;
    intent.left = x < body.x;
    return false;
  };
  const step = path[0];
  if (body.rope) {
    if (step?.kind === 'ropeDown') intent.down = true;
    else intent.up = true;
    return { intent, lost: false };
  }
  if (!body.onGround) {
    // In the air: steer for the landing spot.
    if (step && (step.kind === 'jump' || step.kind === 'walk')) toward(step.land ?? step.x, 3);
    return { intent, lost: false };
  }
  const here = surfaceOf(nav, body);
  if (step && here === step.to) {
    path.shift();
    return followPath(nav, body, path, tx, near);
  }
  if (!step) {
    toward(tx, near);
    return { intent, lost: false };
  }
  if (here !== step.from) return { intent, lost: true };
  if (step.kind === 'walk') {
    toward(step.x, 0);
    return { intent, lost: false };
  }
  // Line up with the takeoff spot (exactly, for ropes), then make the move.
  if (!toward(step.x, step.kind === 'jump' && step.land == null ? 6 : 3)) return { intent, lost: false };
  if (step.kind === 'jump') {
    intent.jump = true;
    if (step.land != null) toward(step.land, 0);
  } else if (step.kind === 'drop') {
    intent.down = true;
    intent.jump = true;
  } else if (step.kind === 'ropeUp') intent.up = true;
  else if (step.kind === 'ropeDown') intent.down = true;
  return { intent, lost: false };
}
