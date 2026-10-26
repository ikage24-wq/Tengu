// Getting around a map: a graph of the surfaces (the ground and every ledge) and the moves
// between them — jumping up to a ledge, dropping through one, walking off an edge, and climbing
// a rope up or down — with a shortest-path search, and a driver that turns a path into
// left/right/up/down/jump intents for physics.js. Party members use it to reach monsters
// anywhere on a field map.

import { surfacesOf, ropeTop, CLIMB_SPEED, WALK_SPEED } from './physics.js';

const REACH_UP = 86; // how high a jump reliably lands (the full jump is ~100px)
const JUMP_TOP = 104; // how high a jump goes, at most
const REACH_SIDE = 44; // how wide a gap a running jump clears
const INSET = 10; // keep landings this far inside a ledge's ends

const cache = new WeakMap();

const contains = (s, x) => x >= s.x1 && x <= s.x2;

// The surface something standing at (x, y) is on, or the first one below it.
export function surfaceBelow(nav, x, y) {
  const best = firstBelow(nav, x, y);
  return best < 0 ? nav.ground : best;
}

// The highest surface at x whose top is at or below y, or -1.
function firstBelow(nav, x, y) {
  let best = -1;
  nav.surfaces.forEach((s, i) => {
    if (contains(s, x) && s.yAt(x) >= y - 3 && (best < 0 || s.yAt(x) < nav.surfaces[best].yAt(x))) best = i;
  });
  return best;
}

// The surface a body is standing on (bodies get fresh surface objects each step, so match by
// position), or -1 in the air or on a rope.
export function surfaceOf(nav, body) {
  if (!body.onGround) return -1;
  return nav.surfaces.findIndex((s) => contains(s, body.x) && Math.abs(s.yAt(body.x) - body.y) < 1.5);
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
      // Jump up: straight up from under the ledge (wherever it's in reach over this surface)...
      const lo = Math.max(a.x1 + 4, b.x1 + INSET);
      const hi = Math.min(a.x2 - 4, b.x2 - INSET);
      // A jump only lands where nothing else is in the way: a ledge between the target and the
      // top of the jump would catch you first.
      const clear = (x, from) => !surfaces.some((c) => c !== a && c !== b && contains(c, x) && c.yAt(x) < b.yAt(x) && c.yAt(x) > from - JUMP_TOP);
      if (lo <= hi) {
        const ok = (x) => a.yAt(x) - b.yAt(x) > 0 && a.yAt(x) - b.yAt(x) <= REACH_UP && clear(x, a.yAt(x));
        let run = null;
        let best = null;
        for (let x = lo; x <= hi + 0.01; x += Math.max(1, Math.min(8, hi - lo))) {
          if (ok(x)) {
            run = run ? { lo: run.lo, hi: x } : { lo: x, hi: x };
            if (!best || run.hi - run.lo >= best.hi - best.lo) best = run;
          } else run = null;
          if (hi === lo) break;
        }
        if (best) nav.edges[i].push({ to: j, kind: 'jump', lo: best.lo, hi: best.hi });
        return;
      }
      // ...or a running jump across a small gap (or up a cliff wall from right below it).
      const across = (from, to, dir) => {
        const rise = a.yAt(from) - b.yAt(to);
        if (rise > 0 && rise <= REACH_UP && clear(to + dir * 6, a.yAt(from))) nav.edges[i].push({ to: j, kind: 'jump', lo: from, hi: from, land: to + dir * 6 });
      };
      if (b.x1 >= a.x2 && b.x1 - a.x2 <= REACH_SIDE) across(a.x2 - 6, b.x1 + INSET, 1);
      else if (a.x1 >= b.x2 && a.x1 - b.x2 <= REACH_SIDE) across(a.x1 + 6, b.x2 - INSET, -1);
    });
    // Drop through a ledge onto whatever is right below, wherever that's this surface.
    if (!a.ground) {
      const drops = new Map();
      for (let x = a.x1 + 6; x <= a.x2 - 6; x += 8) {
        const j = below(x, a.y);
        if (j === i) continue;
        const r = drops.get(j);
        if (r) r.hi = x;
        else drops.set(j, { lo: x, hi: x });
      }
      for (const [j, r] of drops) nav.edges[i].push({ to: j, kind: 'drop', lo: r.lo, hi: r.hi });
    }
    // Walk off either end, onto whatever is below (not up a cliff wall).
    for (const [x, from] of [[a.x1 - 8, a.x1], [a.x2 + 8, a.x2]]) {
      if (x < 12 || x > map.width - 12) continue;
      const j = firstBelow(nav, x, a.yAt(from));
      if (j >= 0 && j !== i) nav.edges[i].push({ to: j, kind: 'walk', lo: x, hi: x });
    }
  });
  for (const r of map.ropes) {
    const bottom = nav.surfaces.findIndex((s) => contains(s, r.x) && Math.abs(s.yAt(r.x) - r.bottom) < 2);
    const top = nav.surfaces.indexOf(ropeTop(map, r));
    if (bottom < 0 || top < 0) continue;
    nav.edges[bottom].push({ to: top, kind: 'ropeUp', lo: r.x, hi: r.x, rope: r });
    const at = Math.max(nav.surfaces[top].x1 + 4, Math.min(nav.surfaces[top].x2 - 4, r.x));
    nav.edges[top].push({ to: bottom, kind: 'ropeDown', lo: at, hi: at, rope: r });
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
