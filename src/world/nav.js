// Getting around a map: a graph of the surfaces (the ground and every ledge) and the moves
// between them — jumping up to a ledge, dropping through one, walking off an edge, and climbing
// a rope up or down — with a shortest-path search, and a driver that turns a path into
// left/right/up/down/jump intents for physics.js. Party members use it to reach monsters
// anywhere on a field map.

import { surfacesOf, ropeTop, driftOffset, CLIMB_SPEED, WALK_SPEED } from './physics.js';

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
  nav = { map, surfaces, ground, edges: surfaces.map(() => []) };
  // A bounce flower or vent on surface j between x0 and x1 (where a move would come down): it
  // throws you straight back up, and a party member taking that move would loop.
  const springOn = (view, j, x0, x1) => (map.springs ?? []).some((sp) => sp.x >= Math.min(x0, x1) - 18 && sp.x <= Math.max(x0, x1) + 18 && contains(view(j), sp.x) && Math.abs(view(j).yAt(sp.x) - sp.y) < 4);
  // The moves among the surfaces `ids` (indices into nav.surfaces), each seen through `view`
  // (a drifting cloud as it stands at one point of its glide). `push(i, edge)` keeps one.
  const plan = (ids, view, push) => {
    const under = (x, y) => {
      let best = -1;
      for (const k of ids) if (contains(view(k), x) && view(k).yAt(x) >= y - 3 && (best < 0 || view(k).yAt(x) < view(best).yAt(x))) best = k;
      return best;
    };
    for (const i of ids) {
      const a = view(i);
      for (const j of ids) {
        if (i === j) continue;
        const b = view(j);
        // Jump up: straight up from under the ledge (wherever it's in reach over this surface)...
        const lo = Math.max(a.x1 + 4, b.x1 + INSET);
        const hi = Math.min(a.x2 - 4, b.x2 - INSET);
        // A jump only lands where nothing else is in the way: a ledge between the target and the
        // top of the jump would catch you first.
        const clear = (x, from) => !ids.some((k) => k !== i && k !== j && contains(view(k), x) && view(k).yAt(x) < b.yAt(x) && view(k).yAt(x) > from - JUMP_TOP);
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
          if (best) push(i, { to: j, kind: 'jump', lo: best.lo, hi: best.hi });
          continue;
        }
        // ...or a running jump across a small gap (or up a cliff wall from right below it).
        const across = (from, to, dir) => {
          const rise = a.yAt(from) - b.yAt(to);
          if (rise > 0 && rise <= REACH_UP && clear(to + dir * 6, a.yAt(from)) && !springOn(view, j, to, to + dir * 6)) push(i, { to: j, kind: 'jump', lo: from, hi: from, land: to + dir * 6 });
        };
        if (b.x1 >= a.x2 && b.x1 - a.x2 <= REACH_SIDE) across(a.x2 - 6, b.x1 + INSET, 1);
        else if (a.x1 >= b.x2 && a.x1 - b.x2 <= REACH_SIDE) across(a.x1 + 6, b.x2 - INSET, -1);
      }
      // Drop through a ledge onto whatever is right below, wherever that's this surface (never onto a
      // bounce flower or vent).
      if (!a.ground) {
        const drops = [];
        let run = null;
        for (let x = a.x1 + 6; x <= a.x2 - 6; x += 8) {
          const below = under(x, a.yAt(x) + 2);
          const j = below < 0 ? ground : below;
          if (j === i || j < 0 || springOn(view, j, x, x)) {
            run = null;
            continue;
          }
          if (run && run.to === j) run.hi = x;
          else drops.push((run = { to: j, lo: x, hi: x }));
        }
        for (const r of drops) push(i, { to: r.to, kind: 'drop', lo: r.lo, hi: r.hi });
      }
      // Walk off either end, onto whatever is below (not up a cliff wall, nor onto a bounce flower
      // or vent where you'd come down, carried on a little by your walk).
      for (const [x, from, dir] of [[a.x1 - 8, a.x1, -1], [a.x2 + 8, a.x2, 1]]) {
        if (x < 12 || x > map.width - 12) continue;
        const j = under(x, a.yAt(from));
        if (j >= 0 && j !== i && !springOn(view, j, x, x + dir * 40)) push(i, { to: j, kind: 'walk', lo: x, hi: x });
      }
    }
  };
  // The fixed surfaces, as they stand.
  const fixed = surfaces.map((_, i) => i).filter((i) => !surfaces[i].drift);
  plan(fixed, (k) => surfaces[k], (i, e) => nav.edges[i].push(e));
  // Each drifting cloud at nine points along its glide: the moves onto it and off it from there,
  // each remembering where along the glide it works (`cloudAt`, how far the cloud has glided),
  // the takeoff (off a cloud) or the landing (onto one) kept relative to the cloud, and a wait
  // added to its cost. The driver waits for the cloud to come round to that point (followPath).
  surfaces.forEach((c, d) => {
    if (!c.drift) return;
    const p = c.drift;
    const wait = p.drift.period;
    // Moves off it that work wherever it is along its glide (stepping off onto the wide floor
    // below, say) are kept once, to take at any time: no waiting for it to come round.
    const offAt = new Map();
    for (let k = 0; k <= 8; k++) {
      const off = (p.drift.dx * k) / 8;
      const at = { x1: p.x + off, x2: p.x + p.w + off, y: p.y, yAt: () => p.y, ground: false };
      const left = p.x + off;
      plan([...fixed, d], (q) => (q === d ? at : surfaces[q]), (i, e0) => {
        // Level with a floor it docks against: hop across rather than walk (a cloud a hair's
        // breadth away by the time you step over drops you through the crack).
        let e = e0;
        const a = i === d ? at : surfaces[i];
        const b = e.to === d ? at : surfaces[e.to];
        if (e.kind === 'walk' && Math.abs(a.yAt(e.lo) - b.yAt(Math.max(b.x1, Math.min(b.x2, e.lo)))) < 6) {
          const right = e.lo > a.x2;
          e = { to: e.to, kind: 'jump', lo: right ? a.x2 - 6 : a.x1 + 6, hi: right ? a.x2 - 6 : a.x1 + 6, land: right ? b.x1 + INSET + 6 : b.x2 - INSET - 6 };
        }
        if (i === d) {
          const key = `${e.to}|${e.kind}|${e.land == null ? Math.round((e.lo - left) / 16) : 'land'}`;
          if (!offAt.has(key)) offAt.set(key, []);
          offAt.get(key).push({ ...e, cloud: d, cloudAt: off, wait, takeLo: e.lo - left, takeHi: e.hi - left });
        }
        else if (e.to === d) nav.edges[i].push({ ...e, cloud: d, cloudAt: off, wait, land: e.land ?? Math.max(e.lo, Math.min(e.hi, (at.x1 + at.x2) / 2)), landRel: (e.land ?? Math.max(e.lo, Math.min(e.hi, (at.x1 + at.x2) / 2))) - left });
      });
    }
    for (const [key, list] of offAt) {
      if (list.length === 9 && !key.endsWith('land')) nav.edges[d].push({ ...list[4], cloudAt: null, wait: 0, anytime: true });
      else nav.edges[d].push(...list);
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
      // (Onto or off a cloud: plus a wait for it to come round.)
      const move = (e.rope ? (e.rope.bottom - e.rope.top) / CLIMB_SPEED : MOVE_COST[e.kind]) + (e.wait ?? 0);
      const c = cost[i] + Math.abs(sx - at[i]) / WALK_SPEED + move;
      if (c < cost[e.to]) {
        cost[e.to] = c;
        at[e.to] = land;
        prev[e.to] = { from: i, to: e.to, kind: e.kind, x: sx, land, rope: e.rope ?? null };
        if (e.cloud != null) Object.assign(prev[e.to], { cloud: e.cloud, cloudAt: e.cloudAt, anytime: !!e.anytime, landRel: e.landRel, takeRel: e.takeLo == null ? null : sx - (e.lo - e.takeLo) });
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
// A move onto or off a drifting cloud, as things stand now: off a cloud, the takeoff is the spot on
// it that has glided along with it; onto one, it lands where the cloud will be by the time you
// come down. `ready` once the cloud has come round to where along its glide the move works.
function cloudStep(nav, raw) {
  const s = nav.surfaces[raw.cloud];
  const p = s.drift;
  if (raw.to === raw.cloud) {
    // Where the cloud will be by the time you come down, and the spot you'd come down on: a jump
    // can steer onto the nearest part of it (within reach), a drop or a step off an edge lands
    // right below. Ready when that spot is on the cloud.
    const soon = driftOffset(p, (nav.map.clock ?? 0) + (raw.kind === 'jump' ? 0.45 : 0.25));
    const x1 = p.x + soon;
    const x2 = x1 + p.w;
    const land = raw.kind === 'jump' ? Math.max(x1 + INSET, Math.min(x2 - INSET, raw.land ?? raw.x)) : raw.x;
    const reach = raw.kind === 'jump' ? (raw.land == null ? 0 : REACH_SIDE + 12) : 0;
    const from = raw.kind === 'jump' && raw.land != null ? raw.land : raw.x;
    return { ...raw, land, ready: land >= x1 + 6 && land <= x2 - 6 && Math.abs(land - from) <= reach + 0.5 };
  }
  return { ...raw, x: s.x1 + raw.takeRel, ready: raw.anytime || Math.abs(s.x1 - p.x - raw.cloudAt) <= 10 };
}

export function followPath(nav, body, path, tx, near = 4) {
  const intent = { left: false, right: false, up: false, down: false, jump: false };
  const toward = (x, slack) => {
    if (Math.abs(x - body.x) <= slack) return true;
    intent.right = x > body.x;
    intent.left = x < body.x;
    return false;
  };
  const raw = path[0];
  const step = raw?.cloud != null ? cloudStep(nav, raw) : raw;
  if (body.rope) {
    if (step?.kind === 'ropeDown') intent.down = true;
    else intent.up = true;
    return { intent, lost: false };
  }
  if (!body.onGround) {
    // In the air: steer for the landing spot.
    // Up level with (or above) the ledge they're after but not over it (lifted past it by an
    // updraft, or a jump that went straight up): drift across onto it.
    // Lifted by an updraft above where the path ends (or already over it, on the way down from
    // one): straight there, skipping the steps between.
    // (Rising, over it only counts with nothing else between: a jump up off a ledge that overhangs
    // the last floor would otherwise turn back for it in mid-air and land on the ledge again, forever.)
    const lastI = path.length ? path[path.length - 1].to : -1;
    const last = lastI >= 0 ? nav.surfaces[lastI] : null;
    if (last && (body.lifted || (contains(last, body.x) && (body.vy > 0 || firstBelow(nav, body.x, body.y) === lastI))) && body.y < last.yAt(Math.max(last.x1, Math.min(last.x2, body.x))) - 4) {
      toward(Math.max(last.x1 + 10, Math.min(last.x2 - 10, tx)), 3);
      return { intent, lost: false };
    }
    const s = step && (step.kind === 'jump' || step.kind === 'walk') ? nav.surfaces[step.to] : null;
    const onto = s ? Math.max(s.x1 + 10, Math.min(s.x2 - 10, body.x)) : 0;
    if (s && body.y < s.yAt(onto) - 4 && Math.abs(onto - body.x) > 4) toward(onto, 3);
    else if (s) toward(step.land ?? step.x, 3);
    // On the last ledge already (thrown up by a bounce flower on the way): drift on toward the goal
    // rather than come down on the flower and bounce in place.
    else if (!step) toward(tx, near);
    return { intent, lost: false };
  }
  let here = surfaceOf(nav, body);
  // A footbridge level with the ground (physics.js `walkOn`) carries you along that ground's way:
  // on it counts as on the ground the path is walking.
  if (step && here !== step.to && here !== step.from && nav.surfaces[here]?.walkOn && nav.surfaces[step.from]?.ground) here = step.from;
  if (step && here === step.to) {
    path.shift();
    return followPath(nav, body, path, tx, near);
  }
  if (!step) {
    toward(tx, near);
    // Heading down the bank of a pool on this same piece of ground: hold Down so a footbridge over
    // it doesn't carry them across (physics.js `walkOn`).
    // (Only with a footbridge in the way: Down beside a rope's top would grab the rope.)
    const s = nav.surfaces[here];
    const lo = Math.min(body.x, tx);
    const hi = Math.max(body.x, tx);
    const bridged = nav.surfaces.some((b) => b.walkOn && b.x1 < hi && b.x2 > lo);
    if (s?.ground && bridged && s.yAt(Math.max(s.x1, Math.min(s.x2, tx))) > body.y + 8) intent.down = true;
    return { intent, lost: false };
  }
  if (here !== step.from) return { intent, lost: true };
  if (step.ready === false) {
    // Waiting for a cloud to come round: stand ready at the takeoff (on a cloud, the spot on it
    // that rides along).
    const a = nav.surfaces[step.from];
    toward(Math.max(a.x1 + 6, Math.min(a.x2 - 6, step.x)), 3);
    return { intent, lost: false };
  }
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
