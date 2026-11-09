// The speed check: plays every map (walking, with the crowd about), every job's skills, and every
// window, drawing real frames on a stand-in screen, and counts what gets painted afresh once it's
// warmed up. Anything painted over and over instead of once is what makes the game lag.
// Usage: node tools/perf-check.mjs [maps|skills|windows ...]   (all three when none is named)
import { installFakeScreen, fakeCanvas, screenStats } from '../tests/support/fake-screen.js';
installFakeScreen();
const { balanceChar } = await import('./balance.mjs');
const { createWorld, updateWorld, loadMap } = await import('../src/world/world.js');
const { createCamera, updateCamera, drawWorld } = await import('../src/render/scene.js');
const { setHd, nextFrame, paintStats, resetPaintStats, gfx } = await import('../src/render/pixel.js');
gfx.noBudget = true;
const { createBots, updateBots } = await import('../src/world/bots.js');
const { cast, castBlocker } = await import('../src/world/combat.js');
const { createInput } = await import('../src/input.js');
const { beginUi, endUi } = await import('../src/ui/kit.js');
const { createUiState, drawUi } = await import('../src/ui/manager.js');
const { MAPS } = await import('../src/data/maps.js');
const { DUNGEONS } = await import('../src/data/dungeons.js');
const { startRun } = await import('../src/world/dungeon.js');
const { paintAheadWith } = await import('../src/render/pixel.js');
const { heroBodySpec } = await import('../src/render/hero.js');
// (In a browser the sprite worker paints walks ahead; here they're painted in place and counted
// apart, as 'ahead', since in the game they never hold up a frame.)
globalThis.__paintAheadHere = true;
paintAheadWith((job) => heroBodySpec(job.look, job.g, job.rig, job.light));
const { JOBS } = await import('../src/data/jobs.js');

// How many fresh paintings a second, once warmed up, count as a problem.
// (Offscreen work a second: canvases made, pixels read back, tint passes.)
// (Canvases here are spare ones beyond the sprites painted, which the painting counts already
// cover; reads allow the glow pass's one a frame; tints allow the hazed backdrop's and new
// afterimages', far below a tint every frame for everything.)
export const LIMITS = { characters: 200, other: 20, canvases: 30, reads: 70, tints: 120 };
const CHARACTER = new Set(['you', 'hero', 'grip', 'arm', 'weapon', 'mob', 'mount', 'rig', 'critter']);
const AHEAD = 'ahead';
const canvas = fakeCanvas();
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

function frame(w, cam, time, ui) {
  updateCamera(cam, w, 1 / 60);
  nextFrame();
  ctx.setTransform(2, 0, 0, 2, 0, 0);
  setHd(true, 2);
  drawWorld(ctx, w, cam, time);
  if (ui) {
    const u = beginUi(ctx, input);
    drawUi(u, ui, w);
    endUi(u);
  }
}
function report(name, frames) {
  const secs = frames / 60;
  const painted = Object.values(paintStats.kinds).reduce((a, v) => a + v.n, 0);
  const off = { canvases: Math.max(0, Math.round((screenStats.canvases - mark.canvases - painted) / secs)), reads: Math.round((screenStats.reads - mark.reads) / secs), tints: Math.round((screenStats.tints - mark.tints) / secs) };
  let ch = 0;
  let other = 0;
  const kinds = Object.entries(paintStats.kinds).sort((a, b) => b[1].n - a[1].n);
  for (const [k, v] of kinds) if (k !== AHEAD) CHARACTER.has(k) ? (ch += v.n) : (other += v.n);
  const row = { name, characters: Math.round(ch / secs), other: Math.round(other / secs), top: kinds.slice(0, 3).map(([k, v]) => `${k} ${Math.round(v.n / secs)}/s`).join(', '), example: kinds.find(([k]) => !CHARACTER.has(k) && k !== AHEAD)?.[1].ex ?? '' };
  Object.assign(row, off);
  row.bad = row.characters > LIMITS.characters || row.other > LIMITS.other || off.canvases > LIMITS.canvases || off.reads > LIMITS.reads || off.tints > LIMITS.tints;
  return row;
}
// Where the offscreen counts stood when a check's warm-up ended.
const mark = { canvases: 0, reads: 0, tints: 0 };
const markNow = () => Object.assign(mark, screenStats);
const seeded = (seed) => { let r = seed; return () => ((r = (r * 16807) % 2147483647) / 2147483647); };
// (Everything random in the world, the crowd's choices and the fights, runs off one seed for each
// check, so a check gives the same answer every time.)
function steady(seed, fn) {
  const real = Math.random;
  Math.random = seeded(seed);
  try {
    return fn();
  } finally {
    Math.random = real;
  }
}

// Every map: walk back and forth with the crowd about.
export function checkMaps(ids = Object.keys(MAPS), warm = 300, frames = 300) {
  const out = [];
  for (const id of ids) steady(11, () => {
    const need = MAPS[id].dungeon ? DUNGEONS[MAPS[id].dungeon].minLevel ?? 1 : 1;
    const w = createWorld(balanceChar('archer', Math.max(40, need + 2)));
    w.log = () => {};
    w.god = true;
    // (Midday whatever the real clock says: the light and the night creatures follow the hour.)
    w.forceNight = 0;
    try {
      // A dungeon room is only entered through a run started at its gate (loading it bare sends
      // you back out to the gate), so it's entered the real way, and the check makes sure it's on
      // the map it means to check: a check of the wrong map once passed for weeks unseen.
      const map = MAPS[id];
      if (map.dungeon) {
        loadMap(w, DUNGEONS[map.dungeon].gate, 'start');
        w.bots = createBots(w, seeded(7), { daily: true, alts: [] });
        const why = startRun(w, map.dungeon);
        if (why) throw new Error(`couldn't start the run: ${why}`);
        if (w.map.id !== id) loadMap(w, id, 'start');
      } else {
        loadMap(w, id, 'west');
        w.bots = createBots(w, seeded(7), { daily: true, alts: [] });
      }
      if (w.map.id !== id) throw new Error(`asked for ${id}, got ${w.map.id}`);
      const cam = createCamera();
      let time = 0;
      for (let f = 0; f < warm + frames; f++) {
        if (f === warm) { resetPaintStats(); markNow(); }
        const keys = f % 300 < 150 ? ['ArrowRight'] : ['ArrowLeft'];
        updateWorld(w, 1 / 60, { held: new Set(keys), pressed: new Set(), locked: false });
        updateBots(w.bots, w, 1 / 60);
        frame(w, cam, time);
        time += 1 / 60;
      }
      out.push(report(`map ${id}`, frames));
    } catch (e) {
      out.push({ name: `map ${id}`, bad: true, error: e.message });
    }
  });
  return out;
}

// Every job: stand by a few monsters and cast each of its skills in turn, again and again.
export function checkSkills(jobs = Object.keys(JOBS), warm = 600, frames = 600) {
  const out = [];
  for (const job of jobs) steady(13, () => {
    let c;
    try {
      c = balanceChar(job, JOBS[job].tier >= 2 ? 45 : 25);
    } catch {
      return;
    }
    const w = createWorld(c);
    w.log = () => {};
    w.god = true;
    // (Midday whatever the real clock says: the light and the night creatures follow the hour.)
    w.forceNight = 0;
    try {
      loadMap(w, 'woods', 'west');
      const skills = Object.keys(c.skills ?? {});
      const cam = createCamera();
      let time = 0;
      let k = 0;
      for (let f = 0; f < warm + frames; f++) {
        if (f === warm) { resetPaintStats(); markNow(); }
        c.mp = 1e6;
        if (f % 20 === 0 && skills.length) {
          const id = skills[k++ % skills.length];
          if (!castBlocker(w, id)) cast(w, id, seeded(f));
        }
        updateWorld(w, 1 / 60, { held: new Set(f % 40 < 20 ? ['KeyZ'] : []), pressed: new Set(), locked: false });
        frame(w, cam, time);
        time += 1 / 60;
      }
      out.push(report(`job ${job}`, frames));
    } catch (e) {
      out.push({ name: `job ${job}`, bad: true, error: e.message });
    }
  });
  return out;
}

// Every window, open over a busy town.
export function checkWindows(warm = 120, frames = 240) {
  const out = [];
  const names = Object.keys(createUiState().windows);
  for (const name of names) steady(17, () => {
    const w = createWorld(balanceChar('archer', 40));
    w.log = () => {};
    w.god = true;
    // (Midday whatever the real clock says: the light and the night creatures follow the hour.)
    w.forceNight = 0;
    try {
      loadMap(w, 'coinbridge', 'west');
      const ui = createUiState();
      Object.assign(ui.windows[name], { open: true, openedAt: -99 });
      const cam = createCamera();
      let time = 0;
      for (let f = 0; f < warm + frames; f++) {
        if (f === warm) { resetPaintStats(); markNow(); }
        updateWorld(w, 1 / 60, { held: new Set(), pressed: new Set(), locked: false });
        frame(w, cam, time, ui);
        time += 1 / 60;
      }
      out.push(report(`window ${name}`, frames));
    } catch (e) {
      out.push({ name: `window ${name}`, bad: true, error: e.message });
    }
  });
  return out;
}

// The frame budgets (CLAUDE.md, "Budgets and caps"): the game logic and the other players, timed
// on the busiest places (a town full of people, a hunting field full of hunters, a dungeon room),
// their slowest 1% of frames against their share of the 6.9 ms frame. (The drawing's 4 ms is
// measured live in the browser, `__frameTimes.summary()`: a stand-in screen can't time it.)
const { timed, summary, reset: resetTimes, BUDGETS } = await import('../src/core/frametimes.js');
export function checkBudgets(places = [['town', 'sprout', 'start'], ['market', 'coinbridge', 'west'], ['field', 'meadow1', 'west'], ['field', 'woods', 'west']], frames = 900) {
  const out = [];
  for (const [kind, id, portal] of places) steady(11, () => {
    const w = createWorld(balanceChar('warrior', 40));
    w.log = () => {};
    w.forceNight = 0;
    w.bots = createBots(w, Math.random, { clock: () => new Date(2026, 9, 28, 20, 0) });
    loadMap(w, id, portal);
    const press = { held: new Set(['ArrowRight']), pressed: new Set(), locked: false };
    for (let f = 0; f < 300 + frames; f++) {
      if (f === 300) resetTimes();
      press.held = new Set(f % 240 < 120 ? ['ArrowRight', 'KeyZ'] : ['ArrowLeft', 'KeyZ']);
      timed('logic', () => updateWorld(w, 1 / 60, press));
      timed('bots', () => updateBots(w.bots, w, 1 / 60));
      w.events.length = 0;
    }
    const s = summary();
    const row = { name: `budget ${kind} ${id}`, logic: +s.logic.p99.toFixed(2), bots: +s.bots.p99.toFixed(2) };
    row.bad = row.logic > BUDGETS.logic || row.bots > BUDGETS.bots;
    out.push(row);
  });
  return out;
}

// The long session (CLAUDE.md, "Long sessions"): 30 minutes of play, hunting and changing map every
// two minutes, drawn on the stand-in screen now and then; it fails if memory or the time a frame
// takes keeps growing from the first five minutes to the last.
export function checkSession(minutes = 30) {
  const out = [];
  steady(5, () => {
    const w = createWorld(balanceChar('warrior', 40));
    w.log = () => {};
    w.forceNight = 0;
    w.bots = createBots(w, Math.random, { clock: () => new Date(2026, 9, 28, 20, 0) });
    const ids = Object.values(MAPS).filter((m) => !m.dungeon && !m.private && !m.indoor).map((m) => m.id);
    const cam = createCamera();
    const ui = createUiState();
    const heap = () => { globalThis.gc?.(); return process.memoryUsage().heapUsed / 1e6; };
    const frames = minutes * 60 * 60;
    let time = 0;
    let first = null;
    const spans = [];
    let t0 = performance.now();
    for (let f = 0; f < frames; f++) {
      if (f % (2 * 60 * 60) === 0) loadMap(w, ids[(f / 7200) % ids.length]);
      const press = { held: new Set(f % 240 < 120 ? ['ArrowRight', 'KeyZ'] : ['ArrowLeft', 'KeyZ']), pressed: new Set(), locked: false };
      updateWorld(w, 1 / 60, press);
      updateBots(w.bots, w, 1 / 60);
      if (f % 6 === 0) frame(w, cam, time, ui);
      else w.events.length = 0;
      time += 1 / 60;
      if ((f + 1) % (5 * 60 * 60) === 0) {
        spans.push({ ms: (performance.now() - t0) / (5 * 60 * 60), heap: heap() });
        t0 = performance.now();
        if (!first) first = spans[0];
      }
    }
    const last = spans.at(-1);
    const row = { name: `session ${minutes} min`, firstMs: +first.ms.toFixed(3), lastMs: +last.ms.toFixed(3), firstMB: Math.round(first.heap), lastMB: Math.round(last.heap) };
    row.bad = last.ms > first.ms * 1.5 || last.heap > first.heap * 1.5 + 20;
    out.push(row);
  });
  return out;
}

if (process.argv[1]?.endsWith('perf-check.mjs')) {
  const parts = process.argv.slice(2);
  const want = (p) => !parts.length || parts.includes(p);
  const rows = [...(want('maps') ? checkMaps() : []), ...(want('skills') ? checkSkills() : []), ...(want('windows') ? checkWindows() : []), ...(want('budgets') ? checkBudgets() : []), ...(parts.includes('session') ? checkSession() : [])];
  for (const r of rows.filter((r) => r.name.startsWith('budget') || r.name.startsWith('session'))) console.log(r.bad ? 'OVER' : 'ok  ', JSON.stringify(r));
  const bad = rows.filter((r) => r.bad);
  for (const r of rows.filter((r) => r.bad || r.characters > 60 || r.other > 5 || r.canvases > 10 || r.tints > 60 || r.reads > 61)) console.log(`${r.bad ? 'SLOW ' : '     '}${r.name}: ${r.error ? `error: ${r.error}` : `characters ${r.characters}/s, other ${r.other}/s, canvases ${r.canvases}/s, reads ${r.reads}/s, tints ${r.tints}/s  (${r.top})${r.other > 5 ? `  e.g. ${r.example}` : ''}`}`);
  console.log(`${rows.length} checked, ${bad.length} over the limits.`);
}
