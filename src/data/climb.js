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
    const free = spots.filter(([x, yy]) => clear(x, yy) && !spawns.some((s) => s.y === yy && Math.abs(s.x - x) < 90));
    (z.nodes ?? []).forEach((n, i) => {
      const at = free[Math.floor(((i + 1) * free.length) / ((z.nodes.length) + 1))];
      if (at) nodes.push({ x: at[0], y: at[1], ...n });
    });
  });

  return {
    width, height: ground + 40, groundY: ground, terrain: [[0, ground], [width, ground]],
    zones: outZones, platforms, ropes, spawns, nodes, top,
  };
}
