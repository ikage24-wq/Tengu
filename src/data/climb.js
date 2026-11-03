// A builder for tall, zoned hunting maps (the player's map rules, see CLAUDE.md): describe the
// zones from the bottom up (each a few rows of ledges in a named shape, and the monsters that live
// there) and it lays out the floors 80 px apart, hangs ropes where each floor meets the one below
// (two per floor where they overlap enough, so every zone hunts in a loop), puts a lookout on top,
// and spreads the monsters and the gathering spots over the floors (none near ropes or portals).
// A map spreads the result into its own entry and adds what makes it its own: landmarks, moving
// parts, exits, lamps, its spirit and habits.
//
// climb({ width, ground, zones: [{ name, color, look, rows: ['split', 'long', ...], mobs: [...],
//   nodes: [{ kind, pool, rare, night, look }] }], lookout: { x, w }, quiet: [[x, y, r]] })
// -> { width, height, groundY, terrain, zones, platforms, ropes, spawns, nodes, top }

const GAP = 80;
const M = 100;
// Gathering spots keep this far from any monster's patrol start on their floor (and from each
// other, SPOT_APART), so you gather in peace and spots don't crowd.
const SPOT_ROOM = 120;
const SPOT_APART = 110;
// The free place nearest `k` in the list that isn't crowding a spot already placed.
function pickSpot(free, placed, k) {
  const ok = ([x, y]) => !placed.some((n) => n.y === y && Math.abs(n.x - x) < SPOT_APART);
  for (let d = 0; d < free.length; d++) {
    for (const j of [k + d, k - d]) if (free[j] && ok(free[j])) return free[j];
  }
  return null;
}

// Row shapes, as [from, to] fractions of the map's width.
const SHAPES = {
  split: [[0, 0.36], [0.64, 1]],
  splitwide: [[0, 0.42], [0.58, 1]],
  long: [[0.18, 0.82]],
  wide: [[0.08, 0.92]],
  tri: [[0, 0.28], [0.36, 0.64], [0.72, 1]],
  left: [[0, 0.56]],
  right: [[0.44, 1]],
  middle: [[0.3, 0.7]],
};

export function climb({ width, ground, zones, lookout = {}, quiet = [] }) {
  const span = (a, b) => [Math.round(M + a * (width - 2 * M)), Math.round(M + b * (width - 2 * M))];
  const platforms = [];
  const rows = [];
  const outZones = [];
  let y = ground;
  zones.forEach((z, zi) => {
    const first = y - GAP;
    z.rows.forEach((shape) => {
      y -= GAP;
      const ledges = SHAPES[shape].map(([a, b]) => {
        const [x1, x2] = span(a, b);
        return { x: x1, y, w: x2 - x1 };
      });
      platforms.push(...ledges);
      rows.push({ y, ledges, zone: zi });
    });
    outZones.push({ name: z.name, color: z.color, from: zi ? first + GAP / 2 : Infinity, ...(z.look ? { look: z.look } : {}) });
  });
  // The lookout on top.
  const lw = lookout.w ?? 420;
  const lx = Math.round(lookout.x ?? (width - lw) / 2);
  const top = { x: lx, y: y - GAP, w: lw, thick: 44 };
  platforms.push(top);
  rows.push({ y: top.y, ledges: [top], zone: zones.length - 1, top: true });

  // Ropes: each upper ledge gets one where it overlaps the floor below (two where the overlap is
  // long), inset from the ends; ladders on the ground floor and up to the lookout.
  const ropes = [];
  const groundRow = { y: ground, ledges: [{ x: 0, y: ground, w: width }] };
  rows.forEach((r, i) => {
    const below = i ? rows[i - 1] : groundRow;
    for (const up of r.ledges) {
      const hits = [];
      for (const lo of below.ledges) {
        const a = Math.max(up.x, lo.x) + 30;
        const b = Math.min(up.x + up.w, lo.x + lo.w) - 30;
        if (b - a >= 0) hits.push([a, b]);
      }
      // No overlap: reach two floors down.
      if (!hits.length && i > 1) {
        for (const lo of rows[i - 2].ledges) {
          const a = Math.max(up.x, lo.x) + 30;
          const b = Math.min(up.x + up.w, lo.x + lo.w) - 30;
          if (b - a >= 0) {
            ropes.push({ x: Math.round((a + b) / 2), top: up.y, bottom: lo.y });
            break;
          }
        }
        continue;
      }
      hits.forEach(([a, b], k) => {
        const ladder = !i || r.top;
        if (b - a > 500 && hits.length === 1) ropes.push({ x: a, top: up.y, bottom: below.y, ladder }, { x: b, top: up.y, bottom: below.y, ladder });
        else ropes.push({ x: Math.round(k % 2 ? b : a), top: up.y, bottom: below.y, ladder });
      });
    }
  });

  // Monsters: along each floor every ~300 px, kept clear of ropes, the lookout and quiet spots
  // (portals, docks); each zone's monsters in turn.
  const clear = (x, yy) => !ropes.some((rp) => Math.abs(rp.x - x) < 50 && (rp.top === yy || rp.bottom === yy)) && !quiet.some(([qx, qy, qr]) => Math.abs(qx - x) < qr && Math.abs(qy - yy) < 10);
  const spawns = [];
  const floorsOf = (zi) => [...(zi ? [] : [groundRow]), ...rows.filter((r) => r.zone === zi && !r.top)];
  zones.forEach((z, zi) => {
    let k = 0;
    for (const r of floorsOf(zi)) {
      for (const l of r.ledges) {
        for (let x = l.x + 120; x <= l.x + l.w - 120; x += 300) {
          if (!clear(x, r.y)) continue;
          spawns.push({ mob: z.mobs[k++ % z.mobs.length], x, y: r.y });
        }
      }
    }
  });

  // Gathering spots: one per wish, on that zone's floors, away from monsters and ropes.
  const nodes = [];
  zones.forEach((z, zi) => {
    const spots = [];
    for (const r of floorsOf(zi)) for (const l of r.ledges) for (let x = l.x + 60; x <= l.x + l.w - 60; x += 70) spots.push([x, r.y]);
    const free = spots.filter(([x, yy]) => clear(x, yy) && !spawns.some((s) => s.y === yy && Math.abs(s.x - x) < SPOT_ROOM));
    (z.nodes ?? []).forEach((n, i) => {
      const at = pickSpot(free, nodes, Math.floor(((i + 1) * free.length) / ((z.nodes.length) + 1)));
      if (at) nodes.push({ x: at[0], y: at[1], ...n });
    });
  });

  return {
    width, height: ground + 40, groundY: ground, terrain: [[0, ground], [width, ground]],
    zones: outZones, platforms, ropes, spawns, nodes, top,
  };
}

// For hand-laid maps (sky islands, valleys, side-by-side journeys): give the ledges yourself and
// it adds what each needs the same way, by zone. Zones here can run left to right (`by: 'x'`,
// each starting `from` its x) or by height (`from` its y up, listed bottom first). Any ledge with
// nothing within a jump below it gets a rope down to whatever is under it, so every ledge can be
// reached; monsters and gathering spots spread over each zone's ledges (and its stretch of the
// ground) as in climb().
// lay({ width, ground, ledges, by, zones: [{ name, color, look, from, mobs, nodes }], quiet })
export function lay({ width, ground, ledges, by = 'x', zones, quiet = [], terrain = null, ropes: extra = [] }) {
  const platforms = ledges.map((l) => ({ ...l }));
  // The ground: flat at `ground`, or shaped by a `terrain` line (cliffs as two points at one x).
  const pts = terrain ?? [[0, ground], [width, ground]];
  const groundAt = (x) => {
    for (let i = 1; i < pts.length; i++) if (x < pts[i][0] || i === pts.length - 1) return pts[i - 1][0] === pts[i][0] ? pts[i][1] : pts[i - 1][1] + ((pts[i][1] - pts[i - 1][1]) * (x - pts[i - 1][0])) / (pts[i][0] - pts[i - 1][0]);
    return ground;
  };
  const grounds = [];
  for (let i = 1; i < pts.length; i++) if (pts[i][1] === pts[i - 1][1] && pts[i][0] > pts[i - 1][0]) grounds.push({ x: pts[i - 1][0], y: pts[i][1], w: pts[i][0] - pts[i - 1][0] });
  const zoneOf = (x, y) => {
    let k = 0;
    zones.forEach((z, i) => {
      if (by === 'x' ? x >= (z.from ?? 0) : y <= (z.from ?? Infinity)) k = i;
    });
    return k;
  };
  const ropes = [...extra];
  for (const l of platforms) {
    if (l.drift) continue;
    const cx = l.x + l.w / 2;
    const under = platforms.filter((o) => o !== l && !o.drift && o.y > l.y && cx >= o.x && cx <= o.x + o.w).sort((a, b) => a.y - b.y)[0];
    const below = under ? under.y : groundAt(cx);
    // Close enough to jump up to from right below (or from a neighbour within reach)? No rope.
    const near = platforms.some((o) => o !== l && !o.drift && o.y > l.y && o.y - l.y <= 80 && o.x < l.x + l.w + 20 && o.x + o.w > l.x - 20) || below - l.y <= 80;
    if (!near) ropes.push({ x: Math.round(cx), top: l.y, bottom: below });
  }
  const clear = (x, y) => !ropes.some((rp) => Math.abs(rp.x - x) < 50 && (rp.top === y || rp.bottom === y)) && !quiet.some(([qx, qy, qr]) => Math.abs(qx - x) < qr && Math.abs(qy - y) < 10);
  const floors = [...grounds, ...platforms.filter((l) => !l.drift && !l.thick)];
  const spawns = [];
  const counts = zones.map(() => 0);
  for (const l of floors) {
    for (let x = l.x + 110; x <= l.x + l.w - 110; x += 280) {
      const k = zoneOf(x, l.y);
      if (!clear(x, l.y) || !zones[k].mobs?.length) continue;
      spawns.push({ mob: zones[k].mobs[counts[k]++ % zones[k].mobs.length], x, y: l.y });
    }
  }
  const nodes = [];
  zones.forEach((z, zi) => {
    const free = [];
    for (const l of floors) for (let x = l.x + 50; x <= l.x + l.w - 50; x += 60) if (zoneOf(x, l.y) === zi && clear(x, l.y) && !spawns.some((s) => s.y === l.y && Math.abs(s.x - x) < SPOT_ROOM)) free.push([x, l.y]);
    (z.nodes ?? []).forEach((n, i) => {
      const at = pickSpot(free, nodes, Math.floor(((i + 1) * free.length) / (z.nodes.length + 1)));
      if (at) nodes.push({ x: at[0], y: at[1], ...n });
    });
  });
  return {
    width, height: Math.max(...pts.map((q) => q[1])) + 40, groundY: ground, terrain: pts,
    zonesBy: by, zones: zones.map((z, i) => ({ name: z.name, color: z.color, from: i ? z.from : by === 'x' ? 0 : Infinity, ...(z.look ? { look: z.look } : {}) })),
    platforms, ropes, spawns, nodes,
  };
}

// After a map is finished (its homestone, field boss and extra portals added), slide each of its
// gathering spots along its own floor to the nearest place that is clear of everything that
// shares the floor: portals (where you arrive), monsters' patrols, rope and ladder ends, bounce
// springs, updrafts (Up rides them, so a spot inside one would fight it), fishing spots and other
// spots. A spot with no clear place on its floor is left out.
export function settleSpots(map, fishing = []) {
  if (!map.nodes?.length) return;
  const same = (a, b) => Math.abs(a - b) < 10;
  const floors = [
    ...map.platforms.filter((p) => !p.drift && !p.thick).map((p) => [p.x, p.x + p.w, p.y]),
    ...(map.terrain ?? []).slice(1).map((q, i) => [map.terrain[i][0], q[0], q[1], map.terrain[i][1]]).filter((f) => f[2] === f[3] && f[1] > f[0]),
  ];
  const placed = [];
  const clear = (x, y) =>
    map.portals.every((p) => !same(p.y ?? map.groundY, y) || Math.abs(p.x - x) >= SPOT_ROOM)
    && map.spawns.every((s) => !same(s.y, y) || Math.abs(s.x - x) >= SPOT_ROOM)
    && (map.ropes ?? []).every((r) => !(same(r.top, y) || same(r.bottom, y)) || Math.abs(r.x - x) >= 40)
    && (map.springs ?? []).every((s) => !same(s.y, y) || Math.abs(s.x - x) >= 50)
    && (map.updrafts ?? []).every((u) => y < u.top - 10 || y > u.bottom + 10 || Math.abs(u.x - x) >= u.w / 2 + 30)
    && fishing.every((s) => !same(s.y, y) || Math.abs(s.x - x) >= 60)
    && (map.npcs ?? []).every((n) => !same(map.groundY, y) || Math.abs(n.x - x) >= 60)
    && placed.every((n) => !same(n.y, y) || Math.abs(n.x - x) >= SPOT_APART);
  map.nodes = map.nodes.filter((n) => {
    const f = floors.find(([a, b, y]) => same(y, n.y) && n.x >= a && n.x <= b);
    if (!f) return false;
    const tries = [];
    for (let x = f[0] + 40; x <= f[1] - 40; x += 10) tries.push(x);
    tries.sort((a, b) => Math.abs(a - n.x) - Math.abs(b - n.x));
    const x = clear(n.x, n.y) ? n.x : tries.find((t) => clear(t, n.y));
    if (x == null) return false;
    n.x = x;
    placed.push(n);
    return true;
  });
}
