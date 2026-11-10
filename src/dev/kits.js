// More dev kits (2026-11-10, the player's ask: "add all"): finding bugs, and checking feel,
// animation, art and online play live. Installed with the rest by dev/debug.js, on localhost only.
// Each one is on `__tengu`; `__tengu.help()` lists them.
import { MAPS } from '../data/maps.js';
import { loadMap } from '../world/world.js';
import { surfacesOf } from '../world/physics.js';

export const KIT_HELP = {
  // Bugs
  textCheck: 'one frame of the screen: text covered by something drawn over it, text off the screen, and text on text (name tags, bubbles, labels)',
  textSweep: "talks to every NPC on this map in turn and runs textCheck on each talk window",
  snapshot: "snapshot('name'): remember this moment (your hero, bag, garden, map, place)",
  restore: "restore('name'): go back to it, as many times as you like; snapshots() lists them",
  sweep: 'sweep(secs, filter?): visit every map (or the ones whose id has filter), checking errors, broken state and speed on each; sweepReport() while it runs',
  outlines: 'outlines(true): draw the ground (cyan), ledges, ropes, portals, your body, monsters and NPC click areas over the game; outlines(false) to stop',
  sounds: 'sounds(secs): every sound that plays for secs: how many, how loud, and the most at once',
  // Feel
  inputDelay: 'inputDelay(secs): press keys meanwhile (or hold/tap); how long from each press to your hero reacting',
  hitFilm: 'hitFilm(secs): waits for a hit to land within secs and films it frame by frame (flash, stop, shake)',
  moveGraph: 'moveGraph(secs): your speed and height over time, drawn as a graph (jerky starts, floaty jumps)',
  // Animation
  popFinder: "popFinder(target, secs): films a spot and finds frames that flick away and back (a pop or flicker); shows them",
  slow: 'slow(f): play at f speed (0.25 = quarter speed); slow(1) back to normal',
  step: 'step(n): pause and move on n game ticks (1/60 s each); speed(1) to play again',
  poseSheet: "poseSheet('KeyX', secs, target): press a key and film the move it starts, as a pose sheet",
  // Art
  shot: "shot('name', target): keep a picture of a spot (or the whole screen) to compare later, even after a reload",
  compare: "compare('name'): the kept picture beside the same spot now (before / after)",
  dayStrip: "dayStrip(target): the same spot at dawn, noon, dusk and night, side by side",
  smallView: 'smallView(scale): the game as it looks on a small screen (0.5 = half size); smallView() to hide',
  // Online
  netLog: 'netLog(true): log every message to and from the room; netStats() sums them up by kind and size',
  lag: 'lag(ms, drop, jitter): pretend a slow or lossy connection (drop 0-1); lag(0) back to normal',
  friendTab: 'how to play with a pretend friend: a second tab in local mode (no internet needed)',
};

export function installKits(t) {
  const w = () => {
    if (!t.world) throw new Error('Start a game first.');
    return t.world;
  };
  const canvas = () => document.getElementById('game');
  const K = () => canvas().width / 640;
  const raf = () => new Promise((r) => requestAnimationFrame(r));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Sheets: pictures laid out over the game ----------
  function showSheet(cells, title = '') {
    t.closeFilm?.();
    const sheet = document.createElement('div');
    sheet.id = 'tengu-film';
    const cw = cells[0]?.c.width ?? 100;
    const cols = Math.max(1, Math.min(cells.length, Math.floor((innerWidth - 20) / (cw + 4))));
    Object.assign(sheet.style, { position: 'fixed', inset: '0', overflow: 'auto', background: '#222d', zIndex: 99999, display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: '4px', padding: '6px', alignContent: 'start', justifyContent: 'center' });
    if (title) {
      const h = document.createElement('div');
      h.textContent = title;
      Object.assign(h.style, { gridColumn: '1 / -1', font: 'bold 12px sans-serif', color: '#fff' });
      sheet.append(h);
    }
    for (const cell of cells) {
      const d = document.createElement('div');
      Object.assign(d.style, { position: 'relative', background: '#fff', outline: cell.mark ? '3px solid #ff3b6b' : 'none' });
      d.append(cell.c);
      const tag = document.createElement('span');
      tag.textContent = cell.label ?? '';
      Object.assign(tag.style, { position: 'absolute', left: '2px', top: '1px', font: '10px monospace', color: '#000', background: '#fffc' });
      d.append(tag);
      sheet.append(d);
    }
    sheet.addEventListener('click', () => sheet.remove());
    document.body.append(sheet);
  }
  // A spot on the screen, in game pixels: an NPC id, 'hero', 'mochi:0', 'all' or {x,y,w,h}.
  function spot(target) {
    if (target && typeof target === 'object') return target;
    if (target === 'all') return { x: 0, y: 0, w: 640, h: 360 };
    const f = t.filmBox?.(target);
    return f ?? { x: 0, y: 0, w: 640, h: 360 };
  }
  function grab(box, scale = 1.5) {
    const c = document.createElement('canvas');
    c.width = Math.round(box.w * scale);
    c.height = Math.round(box.h * scale);
    const g = c.getContext('2d');
    g.imageSmoothingEnabled = false;
    const k = K();
    g.drawImage(canvas(), box.x * k, box.y * k, box.w * k, box.h * k, 0, 0, c.width, c.height);
    return c;
  }

  // ---------- Recording what's drawn: text, and what's drawn over it ----------
  // Watches every canvas for `ms` (the screen and the cached pictures windows are painted into,
  // which repaint only when something changes), keeping each one's last whole painting: its text
  // and whether anything was drawn over that text afterwards. A fill over a whole canvas, or a
  // clear, starts a new painting.
  function recordDrawing(ms) {
    const P = CanvasRenderingContext2D.prototype;
    const orig = { fillText: P.fillText, fill: P.fill, fillRect: P.fillRect, drawImage: P.drawImage, clearRect: P.clearRect };
    // (The box each path spans, so a clip's box is known, and text cut off by it can be found;
    // save and restore keep the clip with them.)
    const pathOps = ['beginPath', 'rect', 'roundRect', 'moveTo', 'lineTo', 'arc', 'ellipse', 'quadraticCurveTo', 'bezierCurveTo', 'clip', 'save', 'restore'];
    for (const k of pathOps) orig[k] = P[k];
    const clips = new WeakMap();
    const st = (g) => {
      let c = clips.get(g);
      if (!c) clips.set(g, (c = { path: null, clip: null, stack: [] }));
      return c;
    };
    const grow = (g, x, y, r = 0) => {
      const c = st(g);
      for (const [px, py] of [[x - r, y - r], [x + r, y + r]]) {
        const [dx, dy] = dev(g, px, py);
        c.path = c.path ? [Math.min(c.path[0], dx), Math.min(c.path[1], dy), Math.max(c.path[2], dx), Math.max(c.path[3], dy)] : [dx, dy, dx, dy];
      }
    };
    P.beginPath = function (...a) { st(this).path = null; return orig.beginPath.apply(this, a); };
    P.rect = function (x, y, wd, ht) { grow(this, x, y); grow(this, x + wd, y + ht); return orig.rect.call(this, x, y, wd, ht); };
    P.roundRect = function (x, y, wd, ht, ...r) { grow(this, x, y); grow(this, x + wd, y + ht); return orig.roundRect.call(this, x, y, wd, ht, ...r); };
    P.moveTo = function (x, y) { grow(this, x, y); return orig.moveTo.call(this, x, y); };
    P.lineTo = function (x, y) { grow(this, x, y); return orig.lineTo.call(this, x, y); };
    P.arc = function (x, y, r, ...a) { grow(this, x, y, r); return orig.arc.call(this, x, y, r, ...a); };
    P.ellipse = function (x, y, rx, ry, ...a) { grow(this, x, y, Math.max(rx, ry)); return orig.ellipse.call(this, x, y, rx, ry, ...a); };
    P.quadraticCurveTo = function (cx, cy, x, y) { grow(this, cx, cy); grow(this, x, y); return orig.quadraticCurveTo.call(this, cx, cy, x, y); };
    P.bezierCurveTo = function (a1, b1, a2, b2, x, y) { grow(this, a1, b1); grow(this, a2, b2); grow(this, x, y); return orig.bezierCurveTo.call(this, a1, b1, a2, b2, x, y); };
    P.clip = function (...a) {
      const c = st(this);
      if (!(a[0] instanceof Path2D) && c.path) c.clip = c.clip ? [Math.max(c.clip[0], c.path[0]), Math.max(c.clip[1], c.path[1]), Math.min(c.clip[2], c.path[2]), Math.min(c.clip[3], c.path[3])] : c.path;
      return orig.clip.apply(this, a);
    };
    P.save = function () { const c = st(this); c.stack.push(c.clip); return orig.save.call(this); };
    P.restore = function () { const c = st(this); c.clip = c.stack.pop() ?? null; return orig.restore.call(this); };
    const books = new Map();
    const book = (g) => {
      let b = books.get(g);
      if (!b) books.set(g, (b = { texts: [], last: [] }));
      return b;
    };
    const dev = (g, x, y) => {
      const m = g.getTransform();
      return [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f];
    };
    // (Nine points over the text: a third of it covered, even just its bottom, counts.)
    const pts = (b) => [0.15, 0.5, 0.85].flatMap((u) => [0.25, 0.5, 0.8].map((v) => [b[0] + (b[2] - b[0]) * u, b[1] + (b[3] - b[1]) * v]));
    // (Whether a picture is solid at a spot: its own pixel there, not just its box.)
    const probe = document.createElement('canvas');
    probe.width = probe.height = 1;
    const pg = probe.getContext('2d', { willReadFrequently: true });
    const solid = (img, u, v) => {
      try {
        pg.clearRect(0, 0, 1, 1);
        orig.drawImage.call(pg, img, Math.floor(u), Math.floor(v), 1, 1, 0, 0, 1, 1);
        return pg.getImageData(0, 0, 1, 1).data[3] > 200;
      } catch {
        return true;
      }
    };
    const fresh = (g) => {
      const b = book(g);
      if (b.texts.length) b.last = b.texts;
      b.texts = [];
    };
    const coverBy = (g, inside, what) => {
      if (g.globalAlpha < 0.75 || g.globalCompositeOperation !== 'source-over') return;
      for (const tx of book(g).texts) if (!tx.coveredBy && pts(tx.box).filter(([x, y]) => inside(x, y)).length >= 3) tx.coveredBy = what;
    };
    const rectCover = (g, x, y, wd, ht, what, src = null) => {
      const [x0, y0] = dev(g, x, y);
      const [x1, y1] = dev(g, x + wd, y + ht);
      const b = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
      if (b[2] - b[0] >= g.canvas.width * 0.95 && b[3] - b[1] >= g.canvas.height * 0.95) return fresh(g);
      const inBox = (px, py) => px >= b[0] && px <= b[2] && py >= b[1] && py <= b[3];
      // (A picture covers only where it's solid.)
      const inPic = src ? (px, py) => inBox(px, py) && solid(src.img, src.sx + ((px - x0) / (x1 - x0)) * src.sw, src.sy + ((py - y0) / (y1 - y0)) * src.sh) : inBox;
      coverBy(g, inPic, what);
    };
    P.fillText = function (str, x, y, ...rest) {
      const m = this.measureText(String(str));
      const [x0, y0] = dev(this, x - m.actualBoundingBoxLeft, y - m.actualBoundingBoxAscent);
      const [x1, y1] = dev(this, x + m.actualBoundingBoxRight, y + m.actualBoundingBoxDescent);
      const box = [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)];
      const cl = st(this).clip;
      // (Cut off by its box: more than a sliver of it outside the clip.)
      const cutOff = cl && (box[0] < cl[0] - 2 || box[1] < cl[1] - 2 || box[2] > cl[2] + 2 || box[3] > cl[3] + 2) && inter(box, cl) > 0;
      if (String(str).trim() && this.globalAlpha > 0.5) book(this).texts.push({ s: String(str), box, ...(cutOff ? { coveredBy: 'its box (cut off)' } : {}) });
      return orig.fillText.call(this, str, x, y, ...rest);
    };
    P.fill = function (...a) {
      const path = a[0] instanceof Path2D ? a[0] : null;
      const rule = typeof a.at(-1) === 'string' ? a.at(-1) : 'nonzero';
      const has = (px, py) => (path ? this.isPointInPath(path, px, py, rule) : this.isPointInPath(px, py, rule));
      const W = this.canvas.width;
      const H = this.canvas.height;
      if (has(2, 2) && has(W - 3, H - 3) && has(W - 3, 2) && has(2, H - 3)) fresh(this);
      else coverBy(this, has, 'a shape');
      return orig.fill.apply(this, a);
    };
    P.fillRect = function (x, y, wd, ht) {
      rectCover(this, x, y, wd, ht, 'a box');
      return orig.fillRect.call(this, x, y, wd, ht);
    };
    P.clearRect = function (x, y, wd, ht) {
      rectCover(this, x, y, wd, ht, 'cleared');
      return orig.clearRect.call(this, x, y, wd, ht);
    };
    P.drawImage = function (img, ...a) {
      const [dx, dy, dw, dh] = a.length === 2 ? [a[0], a[1], img.width, img.height] : a.length === 4 ? a : a.slice(4);
      const [sx, sy, sw, sh] = a.length === 8 ? a.slice(0, 4) : [0, 0, img.width, img.height];
      if (book(this).texts.length) rectCover(this, dx, dy, dw, dh, 'a picture', { img, sx, sy, sw, sh });
      else rectCover(this, dx, dy, dw, dh, 'a picture');
      return orig.drawImage.call(this, img, ...a);
    };
    return sleep(ms).then(() => {
      Object.assign(P, orig);
      // Each canvas's last whole painting (or the one in progress, if it never started another).
      return [...books.entries()].map(([g, b]) => ({ w: g.canvas.width, h: g.canvas.height, screen: g.canvas.id === 'game', texts: b.texts.length >= b.last.length ? b.texts : b.last }));
    });
  }
  const area = (b) => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
  const inter = (a, b) => area([Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.min(a[3], b[3])]);

  // ---------- Online: the log, lag, and dropped messages ----------
  const net = { log: false, lines: [], stats: {}, lag: 0, drop: 0, jitter: 0 };
  const passNet = (dir, msg, go) => {
    const size = JSON.stringify(msg).length;
    const s = (net.stats[`${dir} ${msg.t}${msg.op ? `:${msg.op}` : ''}`] ??= { n: 0, bytes: 0 });
    s.n += 1;
    s.bytes += size;
    if (net.log) {
      net.lines.push(`${(performance.now() / 1000).toFixed(2)} ${dir} ${msg.t}${msg.op ? `:${msg.op}` : ''} ${size}B`);
      if (net.lines.length > 400) net.lines.shift();
    }
    if (!net.lag && !net.drop) return false;
    if (Math.random() < net.drop) return true;
    setTimeout(() => go(msg), net.lag + Math.random() * net.jitter);
    return true;
  };
  t.netOut = (msg, go) => passNet('out', msg, go);
  t.netIn = (msg, go) => passNet('in', msg, go);

  // ---------- Sounds ----------
  let soundLog = null;
  t.onSound = (name, o) => soundLog?.push({ at: performance.now(), name, db: o.db ?? o.vol ?? null });

  // ---------- Overlays ----------
  const overlays = new Set();
  t.afterDraw = (ctx, world, cam) => {
    if (!overlays.size || !cam) return;
    ctx.save();
    ctx.setTransform(K(), 0, 0, K(), 0, 0);
    for (const o of overlays) o(ctx, world, cam);
    ctx.restore();
  };
  function outline(ctx, world, cam) {
    const map = world.map;
    const X = (x) => x - cam.x;
    const Y = (y) => y - cam.y;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#00f0ff';
    ctx.beginPath();
    const pts = map.terrain ?? [[0, map.groundY], [map.width, map.groundY]];
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(X(x), Y(y)) : ctx.moveTo(X(x), Y(y))));
    ctx.stroke();
    ctx.strokeStyle = '#2a8cff';
    for (const s of surfacesOf(map)) if (!s.ground) {
      ctx.beginPath();
      ctx.moveTo(X(s.x1), Y(s.y));
      ctx.lineTo(X(s.x2), Y(s.y));
      ctx.stroke();
    }
    ctx.strokeStyle = '#ffd400';
    for (const r of map.ropes ?? []) {
      ctx.beginPath();
      ctx.moveTo(X(r.x), Y(r.top ?? r.y1 ?? 0));
      ctx.lineTo(X(r.x), Y(r.bottom ?? r.y2 ?? 0));
      ctx.stroke();
    }
    ctx.strokeStyle = '#ff40ff';
    for (const p of map.portals ?? []) ctx.strokeRect(X(p.x) - 12, Y(p.y) - 34, 24, 34);
    ctx.strokeStyle = '#ff7a00';
    for (const n of map.npcs ?? []) ctx.strokeRect(X(n.x) - 14, Y(n.y ?? surfaceY(map, n.x)) - 44, 28, 44);
    ctx.strokeStyle = '#ff2a2a';
    const b = world.body;
    ctx.strokeRect(X(b.x) - (b.w ?? 16) / 2, Y(b.y) - (b.h ?? 36), b.w ?? 16, b.h ?? 36);
    for (const m of world.mobs ?? []) ctx.strokeRect(X(m.x) - (m.w ?? 24) / 2, Y(m.y) - (m.h ?? 24), m.w ?? 24, m.h ?? 24);
  }
  function surfaceY(map, x) {
    let y = map.groundY ?? 0;
    for (const s of surfacesOf(map)) if (s.ground && x >= s.x1 && x <= s.x2) y = s.yAt?.(x) ?? s.y;
    return y;
  }

  // ---------- Snapshots ----------
  const snaps = new Map();
  const loadSnaps = () => {
    try {
      for (const [k, v] of Object.entries(JSON.parse(sessionStorage.getItem('tengu-snaps') ?? '{}'))) snaps.set(k, v);
    } catch { /* none kept */ }
  };
  loadSnaps();

  t._record = (ms) => recordDrawing(ms);
  Object.assign(t, {
    // ---- Bugs
    async textCheck(ms = 600) {
      const pics = await recordDrawing(ms);
      const name = (x) => `"${x.s.slice(0, 40)}"`;
      const covered = new Set();
      const cut = new Set();
      const onText = new Set();
      for (const p of pics) {
        const where = p.screen ? '' : ` (in a ${p.w}x${p.h} picture)`;
        for (const x of p.texts) {
          if (x.coveredBy && x.coveredBy !== 'cleared') covered.add(`${name(x)} under ${x.coveredBy}${where}`);
          const b = x.box;
          if ((b[0] < 0 && b[2] > 0) || (b[1] < 0 && b[3] > 0) || (b[2] > p.w && b[0] < p.w) || (b[3] > p.h && b[1] < p.h)) cut.add(`${name(x)}${where}`);
        }
        for (let i = 0; i < p.texts.length; i++) for (let j = i + 1; j < p.texts.length; j++) {
          const a = p.texts[i];
          const b = p.texts[j];
          if (a.s === b.s) continue;
          if (inter(a.box, b.box) > 0.25 * Math.min(area(a.box), area(b.box))) onText.add(`${name(a)} and ${name(b)}${where}`);
        }
      }
      return { pictures: pics.length, texts: pics.reduce((n, p) => n + p.texts.length, 0), covered: [...covered], cutByEdge: [...cut], textOnText: [...onText] };
    },
    async textSweep() {
      const world = w();
      const ui = t.ui;
      const out = {};
      for (const n of world.map.npcs) {
        // (Talking the way the game does: a talk event, as walking up and pressing Up sends.)
        const check = t.textCheck(3000);
        world.events.push({ type: 'talk', npc: n.id });
        out[n.id] = await check;
        ui.windows.npc.open = false;
        ui.npc = null;
        await sleep(300);
      }
      return out;
    },
    snapshot(name = 'a') {
      const world = w();
      const s = { char: JSON.parse(JSON.stringify(world.char)), map: world.map.id, body: { x: world.body.x, y: world.body.y, facing: world.body.facing } };
      snaps.set(name, s);
      try {
        sessionStorage.setItem('tengu-snaps', JSON.stringify(Object.fromEntries(snaps)));
      } catch { /* too big to keep across reloads */ }
      return `kept "${name}" (${(JSON.stringify(s).length / 1024).toFixed(0)} KB)`;
    },
    restore(name = 'a') {
      const world = w();
      const s = snaps.get(name);
      if (!s) return `No snapshot "${name}": snapshots() lists them.`;
      const c = world.char;
      for (const key of Object.keys(c)) delete c[key];
      Object.assign(c, JSON.parse(JSON.stringify(s.char)));
      loadMap(world, s.map);
      Object.assign(world.body, s.body, { vx: 0, vy: 0 });
      return `back to "${name}"`;
    },
    snapshots: () => [...snaps.keys()],
    sweep(secs = 2, filter = '') {
      const world = w();
      const ids = Object.keys(MAPS).filter((id) => id.includes(filter));
      const home = world.map.id;
      const report = { done: 0, of: ids.length, problems: {}, slow: {}, skipped: [] };
      t.sweepReport = () => report;
      (async () => {
        for (const id of ids) {
          const before = t.errorCount?.() ?? 0;
          try {
            loadMap(world, id);
          } catch (err) {
            report.problems[id] = [`could not load: ${err.message}`];
            report.done += 1;
            continue;
          }
          if (world.map.id !== id) {
            report.skipped.push(`${id} (sent to ${world.map.id})`);
            report.done += 1;
            continue;
          }
          const f = await t.frames(secs);
          const found = t.check();
          const errs = (t.errorCount?.() ?? 0) - before;
          const list = [...(Array.isArray(found) ? found.filter((x) => !x.includes('errors/warnings caught')) : []), ...(errs > 0 ? [`${errs} new errors: errors()`] : [])];
          if (list.length) report.problems[id] = list;
          if (f.hitches > secs * 3 || f.avgMs > 20) report.slow[id] = `${f.fps} fps, worst ${f.worstMs} ms, ${f.hitches} hitches`;
          report.done += 1;
        }
        loadMap(world, home);
        report.finished = true;
      })();
      return `Sweeping ${ids.length} maps, ${secs}s each: sweepReport() for progress.`;
    },
    outlines(on = true) {
      if (on) overlays.add(outline);
      else overlays.delete(outline);
      return on ? 'cyan ground, blue ledges, yellow ropes, pink portals, orange NPCs, red you and monsters' : 'off';
    },
    async sounds(secs = 5) {
      soundLog = [];
      await sleep(secs * 1000);
      const log = soundLog;
      soundLog = null;
      const by = {};
      for (const s of log) by[s.name] = (by[s.name] ?? 0) + 1;
      let most = 0;
      for (const s of log) most = Math.max(most, log.filter((o) => Math.abs(o.at - s.at) < 60).length);
      return { total: log.length, perSecond: +(log.length / secs).toFixed(1), mostAtOnce: most, byName: by, loudest: log.filter((s) => s.db != null).sort((a, b) => b.db - a.db).slice(0, 5).map((s) => `${s.name} ${s.db}`) };
    },

    // ---- Feel
    inputDelay(secs = 6) {
      const world = w();
      const b = world.body;
      const sig = () => `${Math.sign(Math.round(b.vx))}|${Math.sign(Math.round(b.vy))}|${b.facing}|${b.onGround}|${b.rope ? 1 : 0}|${world.char.cast?.skill ?? world.attack?.t0 ?? b.attack?.t0 ?? b.swing ?? ''}`;
      const delays = [];
      let waiting = null;
      const onKey = (e) => {
        if (!e.repeat) waiting = { code: e.code, at: performance.now(), from: sig() };
      };
      window.addEventListener('keydown', onKey, true);
      const t0 = performance.now();
      return new Promise((done) => {
        const frame = () => {
          if (waiting && sig() !== waiting.from) {
            delays.push({ key: waiting.code, ms: Math.round(performance.now() - waiting.at) });
            waiting = null;
          }
          if (performance.now() - t0 < secs * 1000) requestAnimationFrame(frame);
          else {
            window.removeEventListener('keydown', onKey, true);
            const ms = delays.map((d) => d.ms);
            done({ presses: delays.length, avgMs: ms.length ? Math.round(ms.reduce((a, c) => a + c, 0) / ms.length) : null, worstMs: ms.length ? Math.max(...ms) : null, each: delays, noReaction: waiting ? waiting.code : null });
          }
        };
        requestAnimationFrame(frame);
      });
    },
    async hitFilm(secs = 8) {
      const world = w();
      const hp = () => (world.mobs ?? []).reduce((s, m) => s + (m.hp > 0 ? m.hp : 0), 0);
      const ring = [];
      const box = () => ({ ...spot('hero'), x: spot('hero').x - 48, w: 160, y: spot('hero').y - 10, h: 90 });
      let last = hp();
      const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) {
        await raf();
        ring.push({ c: grab(box(), 1.2), label: '' });
        if (ring.length > 6) ring.shift();
        const now = hp();
        if (now < last) {
          const shots = ring.map((r, i) => ({ ...r, label: `-${ring.length - i}` }));
          for (let i = 0; i < 24; i++) {
            await raf();
            if (i % 2 === 0) shots.push({ c: grab(box(), 1.2), label: `+${i}`, mark: i === 0 });
          }
          showSheet(shots, 'A hit: frames before (-) and after (+)');
          return `${shots.length} frames around the hit`;
        }
        last = now;
      }
      return 'No hit landed: attack a monster while it runs.';
    },
    moveGraph(secs = 4) {
      const b = w().body;
      const rows = [];
      const t0 = performance.now();
      return new Promise((done) => {
        const frame = () => {
          rows.push([(performance.now() - t0) / 1000, b.vx, b.vy, b.y]);
          if (performance.now() - t0 < secs * 1000) requestAnimationFrame(frame);
          else {
            const c = document.createElement('canvas');
            c.width = 720;
            c.height = 300;
            const g = c.getContext('2d');
            g.fillStyle = '#fff';
            g.fillRect(0, 0, c.width, c.height);
            const lines = [[1, '#e0306a', 'speed across'], [2, '#2a8cff', 'speed up/down'], [3, '#20a050', 'height']];
            for (const [k, color, label] of lines) {
              const vals = rows.map((r) => r[k]);
              const lo = Math.min(...vals);
              const hi = Math.max(...vals);
              g.strokeStyle = color;
              g.beginPath();
              rows.forEach((r, i) => {
                const x = (r[0] / secs) * (c.width - 10) + 5;
                const y = c.height - 20 - ((r[k] - lo) / (hi - lo || 1)) * (c.height - 40) * (k === 3 ? -1 : 1) - (k === 3 ? c.height - 40 : 0);
                if (i) g.lineTo(x, y);
                else g.moveTo(x, y);
              });
              g.stroke();
              g.fillStyle = color;
              g.fillText(`${label} ${lo.toFixed(0)} to ${hi.toFixed(0)}`, 8, 14 + k * 12);
            }
            showSheet([{ c, label: '' }], `Movement over ${secs}s`);
            done(`${rows.length} frames graphed`);
          }
        };
        requestAnimationFrame(frame);
      });
    },

    // ---- Animation
    async popFinder(target = 'hero', secs = 3) {
      const shots = [];
      const t0 = performance.now();
      while (performance.now() - t0 < secs * 1000) {
        await raf();
        shots.push({ c: grab(spot(target), 1), at: (performance.now() - t0) / 1000 });
      }
      const px = shots.map((s) => s.c.getContext('2d').getImageData(0, 0, s.c.width, s.c.height).data);
      const diff = (a, b) => {
        let d = 0;
        for (let i = 0; i < a.length; i += 4) d += Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]);
        return d / (a.length / 4);
      };
      const pops = [];
      for (let i = 1; i < px.length - 1; i++) {
        const a = diff(px[i - 1], px[i]);
        const b = diff(px[i], px[i + 1]);
        const across = diff(px[i - 1], px[i + 1]);
        if (a > 6 && b > 6 && across < 0.45 * Math.min(a, b)) pops.push(i);
      }
      if (pops.length) {
        const cells = [];
        for (const i of pops.slice(0, 8)) for (const j of [i - 1, i, i + 1]) cells.push({ c: shots[j].c, label: `${j} ${shots[j].at.toFixed(2)}s`, mark: j === i });
        showSheet(cells, 'Pops: each middle frame (red) flicks away and back');
      }
      return { frames: shots.length, pops: pops.length, at: pops.map((i) => shots[i].at.toFixed(2)) };
    },
    slow(f = 0.25) {
      return t.speed(f);
    },
    step(n = 1) {
      const world = w();
      world.devSpeed = 0;
      world.devSteps = (world.devSteps ?? 0) + n;
      return `paused, moving on ${n} tick(s)`;
    },
    async poseSheet(code = 'KeyX', secs = 1, target = 'hero') {
      t.tap(code);
      return t.film(target, secs, 2, 2);
    },

    // ---- Art
    shot(name = 'before', target = 'all') {
      const box = spot(target);
      const c = grab(box, target === 'all' ? 1 : 2);
      try {
        sessionStorage.setItem(`tengu-shot-${name}`, JSON.stringify({ box, target, url: c.toDataURL('image/png') }));
      } catch {
        return 'Too big to keep: try a smaller spot.';
      }
      return `kept "${name}"`;
    },
    async compare(name = 'before') {
      const kept = JSON.parse(sessionStorage.getItem(`tengu-shot-${name}`) ?? 'null');
      if (!kept) return `No picture "${name}".`;
      const img = new Image();
      img.src = kept.url;
      await img.decode();
      const old = document.createElement('canvas');
      old.width = img.width;
      old.height = img.height;
      old.getContext('2d').drawImage(img, 0, 0);
      const now = grab(typeof kept.target === 'string' && kept.target !== 'all' ? spot(kept.target) : kept.box, kept.target === 'all' ? 1 : 2);
      showSheet([{ c: old, label: `${name} (kept)` }, { c: now, label: 'now' }], 'Before and after');
      return 'shown';
    },
    async dayStrip(target = 'all') {
      const cells = [];
      for (const [h, label] of [[6.2, 'dawn'], [12, 'noon'], [19.9, 'dusk'], [23, 'night']]) {
        t.hour(h);
        await sleep(1700);
        cells.push({ c: grab(spot(target), target === 'all' ? 0.6 : 2), label });
      }
      t.hour(null);
      showSheet(cells, 'Dawn, noon, dusk, night');
      return 'shown';
    },
    smallView(scale = 0.5) {
      document.getElementById('tengu-small')?.remove();
      if (!scale) return 'hidden';
      const img = document.createElement('img');
      img.id = 'tengu-small';
      const c = document.createElement('canvas');
      c.width = Math.round(640 * scale * 2);
      c.height = Math.round(360 * scale * 2);
      c.getContext('2d').drawImage(canvas(), 0, 0, c.width, c.height);
      img.src = c.toDataURL();
      Object.assign(img.style, { position: 'fixed', left: '8px', top: '8px', width: `${640 * scale}px`, height: `${360 * scale}px`, zIndex: 99999, border: '2px solid #ff3b6b', background: '#000' });
      img.addEventListener('click', () => img.remove());
      document.body.append(img);
      return `the game at ${scale}x size (as on a small screen); click it or smallView(0) to hide`;
    },

    // ---- Online
    netLog(on = true) {
      net.log = on;
      if (on) net.lines = [];
      return on ? 'logging: netLines() to read' : 'off';
    },
    netLines: (n = 60) => net.lines.slice(-n),
    netStats() {
      const out = Object.fromEntries(Object.entries(net.stats).sort((a, b) => b[1].bytes - a[1].bytes).map(([k, v]) => [k, `${v.n} msgs, ${(v.bytes / 1024).toFixed(1)} KB`]));
      net.stats = {};
      return Object.keys(out).length ? out : 'Nothing sent or received yet (are you in a room?).';
    },
    lag(ms = 200, drop = 0, jitter = 0) {
      Object.assign(net, { lag: ms, drop, jitter });
      return ms || drop ? `pretending ${ms} ms lag, ${Math.round(drop * 100)}% dropped, ${jitter} ms jitter` : 'normal connection';
    },
    friendTab() {
      return `Open this game in two tabs with ${location.origin}/?net=local (both tabs). Host a room in one, join it with its code in the other: they talk through the browser, no internet. Use a different hero in each (a new one in an empty file works). Then netLog, lag and netStats work in either tab.`;
    },
  });
}
