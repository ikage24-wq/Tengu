// Dev tools for checking the game live (2026-11-10, the player's ask: everything that helps find
// and fix bugs as it runs). Only on localhost (main.js installs them; the desktop game never has
// them), on the console handle `__tengu`. `__tengu.help()` lists them all.
import { gameHour, DAY_MINUTES, isNight } from '../world/daytime.js';
import { NPCS } from '../data/npcs.js';
import { ITEMS } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { gmCommand } from '../world/gm.js';
import { loadMap } from '../world/world.js';
import { groundAt } from '../world/physics.js';
import { installKits, KIT_HELP } from './kits.js';
import { installKits2, KIT2_HELP } from './kits2.js';
import { installKits3, KIT3_HELP } from './kits3.js';
import { installKits4, KIT4_HELP } from './kits4.js';

const HELP = {
  // Looking
  help: 'this list',
  state: 'where you are and how you are: map, position, speed, HP/MP, level, gold, hour, open windows',
  map: 'this map: size, portals, NPCs, monsters, spots',
  mobs: 'the monsters here: what, where, HP, what each is doing',
  npcs: 'the NPCs here and where they stand',
  windows: 'the open windows',
  log: 'log(n): the last n lines of the game log (all of them since load, not just the 7 on screen)',
  errors: 'every error and warning since load (uncaught, rejected promises, console.error/warn)',
  check: 'a sweep for broken state: NaN positions, things outside the map, unknown items, bad numbers',
  storage: 'the saves in local storage and their sizes',
  frames: 'frames(secs): real frame times over secs: fps, worst frame, hitches; with the game\'s own part budgets',
  // The clock
  clock: 'the game hour and how dark it is',
  hour: 'hour(h): jump the game clock to h (0-24), it keeps running; hour(null): back to real time',
  night: 'night(v): force the light, 0 day to 1 night; night(null): back to the clock',
  speed: 'speed(n): run the game n times as fast (0 pauses, 1 normal)',
  // Doing
  gm: "gm('level 30'): any Game Master command, no passphrase (gm('gmhelp') lists them)",
  tp: "tp('garden', portal?): go to a map",
  pos: 'pos(x, y?): put yourself at x (y: on the ground there if left out)',
  heal: 'full HP and MP',
  gold: 'gold(n): add gold (it saves like any gold: test saves only)',
  tap: "tap('ArrowUp'): press a key once, as the keyboard does",
  hold: "hold('ArrowRight', secs): hold a key down (the browser pane can only tap)",
  click: 'click(x, y): click the game at game coordinates',
  // Watching
  watch: 'watch(fn, secs, blink): call fn every frame; every change in what it returns, and any that flick back within blink s (pops)',
  watchHero: 'watchHero(secs): your footing and pose every frame: landing flicker, stuck, sliding',
  watchMochi: 'watchMochi(i, secs): a garden Mochi every frame: crawling, walking, actions, pops',
  film: "film('kinako', secs, every): record that spot (an NPC id, 'hero', 'mochi:0', or {x,y,w,h} on screen) every `every` frames for secs, shown as a contact sheet over the game; film() again or closeFilm() to hide it",
  closeFilm: 'hide the contact sheet',
  mochi: "the garden's Mochi now",
  npc: "npc('kinako'): one NPC, and whether it's in its night outfit",
};

export function install(t) {
  const w = () => t.world;
  const need = () => {
    if (!w()) throw new Error('Start a game first (choose a file and press Start).');
    return w();
  };

  // ---- Catching everything that goes wrong, from the start.
  const errors = [];
  const note = (kind, msg) => {
    errors.push({ at: (performance.now() / 1000).toFixed(1), kind, msg: String(msg).slice(0, 400) });
    if (errors.length > 300) errors.shift();
  };
  window.addEventListener('error', (e) => note('error', `${e.message} (${e.filename?.split('/').pop()}:${e.lineno})`));
  window.addEventListener('unhandledrejection', (e) => note('promise', e.reason?.stack ?? e.reason));
  for (const level of ['error', 'warn']) {
    const orig = console[level].bind(console);
    console[level] = (...args) => {
      note(level, args.map((a) => (a instanceof Error ? a.stack : typeof a === 'object' ? safe(a) : a)).join(' '));
      orig(...args);
    };
  }
  // ---- The whole game log, not just the lines on screen.
  const history = [];
  let hooked = null;
  setInterval(() => {
    const world = w();
    if (!world || hooked === world) return;
    hooked = world;
    const log = world.log;
    world.log = (text, color) => {
      history.push(`${(world.now ?? 0).toFixed(1)}s ${text}`);
      if (history.length > 500) history.shift();
      return log(text, color);
    };
  }, 500);

  const round = (v) => (typeof v === 'number' ? Math.round(v * 10) / 10 : v);
  const key = (code, type) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code.replace(/^Key|^Digit/, ''), bubbles: true }));

  // Records `fn()` every frame for `secs`: each change, how long it lasted, and blinks: a value
  // that's back to the one before within `blink` seconds (a pop, a flicker, a one-frame hop).
  function watch(fn, secs = 5, blink = 0.15) {
    const segs = [];
    const t0 = performance.now();
    return new Promise((done) => {
      const frame = () => {
        const at = (performance.now() - t0) / 1000;
        let v;
        try {
          v = fn();
        } catch (err) {
          v = `error: ${err.message}`;
        }
        const k = typeof v === 'string' ? v : safe(v);
        const last = segs.at(-1);
        if (last?.k === k) last.end = at;
        else segs.push({ k, start: at, end: at });
        if (at < secs) requestAnimationFrame(frame);
        else {
          const blinks = segs.filter((s, i) => i > 0 && i < segs.length - 1 && s.end - s.start < blink && segs[i - 1].k === segs[i + 1].k);
          done({
            changes: segs.slice(0, 120).map((s) => `${s.start.toFixed(2)}s ${s.k} (${(s.end - s.start).toFixed(2)}s)`),
            blinks: blinks.length,
            blinksAt: blinks.map((s) => `${s.start.toFixed(2)}s ${s.k}`),
          });
        }
      };
      requestAnimationFrame(frame);
    });
  }

  Object.assign(t, {
    help: () => ({ ...HELP, ...KIT_HELP, ...KIT2_HELP, ...KIT3_HELP, ...KIT4_HELP }),
    errorCount: () => errors.length,
    errors: () => (errors.length ? errors : 'No errors since load.'),
    log: (n = 30) => history.slice(-n),

    state() {
      const world = need();
      const b = world.body;
      const c = world.char;
      const open = Object.entries(t.ui?.windows ?? {}).filter(([, v]) => v?.open).map(([k]) => k);
      return {
        screen: t.screen, map: world.map.id, x: round(b.x), y: round(b.y), vx: round(b.vx), vy: round(b.vy), onGround: b.onGround, facing: b.facing,
        hp: `${round(c.hp ?? world.hp)}`, level: c.level, job: c.job, gold: c.gold, hour: t.clock(), windows: open, scene: Boolean(world.scene), speed: world.devSpeed ?? 1,
      };
    },
    map() {
      const m = need().map;
      return {
        id: m.id, name: m.name, width: m.width, height: m.height, night: m.night, garden: Boolean(m.garden),
        portals: (m.portals ?? []).map((p) => `${p.id ?? '?'} -> ${p.to ?? p.target ?? '?'} @${round(p.x)}`),
        npcs: (m.npcs ?? []).map((n) => `${n.id}@${round(n.x)}`), mobs: need().mobs?.length ?? 0,
      };
    },
    mobs() {
      return (need().mobs ?? []).map((m) => ({ id: m.id ?? m.mobId ?? m.type, x: round(m.x), y: round(m.y), hp: round(m.hp), state: m.state ?? m.mode ?? m.ai ?? null, asleep: m.asleep ?? m.sleeping ?? null }));
    },
    npcs() {
      const world = need();
      return world.map.npcs.map((n) => ({ id: n.id, name: NPCS[n.id]?.name, x: round(n.x), y: round(n.y) }));
    },
    windows() {
      return Object.entries(t.ui?.windows ?? {}).filter(([, v]) => v?.open).map(([k, v]) => ({ k, x: v.x, y: v.y }));
    },
    storage() {
      const out = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        out[k] = `${((localStorage.getItem(k)?.length ?? 0) / 1024).toFixed(1)} KB`;
      }
      return out;
    },
    check() {
      const world = need();
      const m = world.map;
      const c = world.char;
      const out = [];
      const bad = (v) => typeof v !== 'number' || !Number.isFinite(v);
      const b = world.body;
      if (bad(b.x) || bad(b.y)) out.push(`You: position is ${b.x}, ${b.y}`);
      if (m.width && (b.x < 0 || b.x > m.width)) out.push(`You: outside the map (x ${round(b.x)} of ${m.width})`);
      if (m.height && b.y > m.height + 50) out.push(`You: fell below the map (y ${round(b.y)})`);
      for (const mob of world.mobs ?? []) {
        const name = mob.id ?? mob.mobId ?? '?';
        if (bad(mob.x) || bad(mob.y)) out.push(`Monster ${name}: position ${mob.x}, ${mob.y}`);
        else if (m.width && (mob.x < -40 || mob.x > m.width + 40)) out.push(`Monster ${name}: outside the map at ${round(mob.x)}`);
        if (bad(mob.hp)) out.push(`Monster ${name}: HP ${mob.hp}`);
        if (mob.id && !MOBS[mob.id] && !mob.boss) out.push(`Monster ${name}: not in the monster list`);
      }
      for (const n of m.npcs ?? []) if (!NPCS[n.id]) out.push(`NPC ${n.id}: not in the NPC list`);
      for (const it of (c.inventory ?? []).flat?.() ?? []) {
        const id = it?.id ?? it;
        if (typeof id === 'string' && !ITEMS[id]) out.push(`Bag: unknown item ${id}`);
        if (it?.qty != null && (bad(it.qty) || it.qty < 0)) out.push(`Bag: ${id} qty ${it.qty}`);
      }
      for (const [slot, g] of Object.entries(c.equipment ?? c.gear ?? {})) if (g?.id && !ITEMS[g.id]) out.push(`Worn ${slot}: unknown item ${g.id}`);
      if (bad(c.gold) || c.gold < 0) out.push(`Gold is ${c.gold}`);
      for (const [k, v] of Object.entries({ hp: c.hp, mp: c.mp, level: c.level })) if (v != null && (bad(v) || v < 0)) out.push(`${k} is ${v}`);
      for (const e of world.gardenLife?.mochi ?? []) {
        if (e.x != null && bad(e.x)) out.push(`Mochi ${e.rec.name}: x ${e.x}`);
        if (e.rec.mood != null && (bad(e.rec.mood) || e.rec.mood < 0 || e.rec.mood > 100)) out.push(`Mochi ${e.rec.name}: mood ${e.rec.mood}`);
      }
      if (errors.length) out.push(`${errors.length} errors/warnings caught: __tengu.errors()`);
      return out.length ? out : 'Nothing wrong found.';
    },
    frames(secs = 5) {
      const gaps = [];
      let last = performance.now();
      const t0 = last;
      return new Promise((done) => {
        const frame = (now) => {
          gaps.push(now - last);
          last = now;
          if (now - t0 < secs * 1000) requestAnimationFrame(frame);
          else {
            const s = [...gaps].sort((a, b) => a - b);
            const parts = globalThis.__frameTimes?.summary?.() ?? {};
            done({
              fps: Math.round((gaps.length / (now - t0)) * 1000), avgMs: round(gaps.reduce((a, b) => a + b, 0) / gaps.length), worstMs: round(s.at(-1)),
              p99Ms: round(s[Math.floor(s.length * 0.99)]), hitches: gaps.filter((g) => g > 33).length,
              parts: Object.fromEntries(Object.entries(parts).filter(([k]) => !k.includes(':')).map(([k, v]) => [k, `${v.avg.toFixed(2)} avg / ${v.p99.toFixed(2)} worst, budget ${v.budget ?? '-'}`])),
            });
          }
        };
        requestAnimationFrame(frame);
      });
    },

    clock() {
      const world = need();
      return `${gameHour((world.dayClock ?? (() => new Date()))()).toFixed(2)}h, night ${world.night ?? 0}`;
    },
    hour(h) {
      const world = need();
      if (h == null) delete world.dayClock;
      else {
        const ahead = (((h - gameHour(new Date()) + 24) % 24) / 24) * DAY_MINUTES * 60000;
        world.dayClock = () => new Date(Date.now() + ahead);
      }
      world.dayT = 1;
      return t.clock();
    },
    night(v) {
      const world = need();
      if (v == null) delete world.forceNight;
      else world.forceNight = v;
      world.dayT = 1;
      return v ?? 'clock';
    },
    speed(n = 1) {
      need().devSpeed = n;
      return n;
    },

    gm(line) {
      const [cmd, ...args] = line.trim().replace(/^\//, '').split(/\s+/);
      return gmCommand(need(), cmd, args) ?? `No such command: ${cmd}`;
    },
    tp(mapId, portal) {
      loadMap(need(), mapId, portal);
      return need().map.id;
    },
    pos(x, y) {
      const b = need().body;
      Object.assign(b, { x, vx: 0, vy: 0, ...(y != null ? { y } : { y: b.y - 40 }) });
      return [b.x, b.y];
    },
    heal() {
      const world = need();
      return gmCommand(world, 'heal', []);
    },
    gold(n) {
      const world = need();
      world.char.gold += n;
      return world.char.gold;
    },
    tap(code) {
      key(code, 'keydown');
      setTimeout(() => key(code, 'keyup'), 60);
      return code;
    },
    hold(code, secs = 1) {
      key(code, 'keydown');
      return new Promise((done) => setTimeout(() => {
        key(code, 'keyup');
        done(t.state?.() ?? code);
      }, secs * 1000));
    },
    click(x, y) {
      const canvas = document.querySelector('canvas');
      const r = canvas.getBoundingClientRect();
      const cx = r.left + (x / 640) * r.width;
      const cy = r.top + (y / 360) * r.height;
      for (const type of ['mousemove', 'mousedown', 'mouseup', 'click']) canvas.dispatchEvent(new MouseEvent(type, { clientX: cx, clientY: cy, bubbles: true, button: 0, detail: 1 }));
      return [x, y];
    },

    watch,
    watchHero(secs = 5) {
      const b = need().body;
      return watch(() => `${b.onGround ? 'ground' : b.rope ? 'rope' : 'air'} ${Math.abs(b.vx) > 8 ? 'moving' : 'still'}`, secs);
    },
    watchMochi(i = 0, secs = 8) {
      const e = need().gardenLife?.mochi?.[i];
      if (!e) return Promise.resolve('No such Mochi here: __tengu.mochi() lists them.');
      return watch(() => `${e.m.cant ?? (e.m.mode === 'run' ? 'feet' : e.m.mode)} ${(e.m.speed ?? 0) > 1 ? 'moving' : 'still'}${e.m.action ? ` ${e.m.action.name}` : ''}`, secs);
    },
    // Where a spot is on the screen, in game pixels: an NPC id, 'hero', 'mochi:0' or {x,y,w,h}.
    filmBox(target) {
        const world = need();
        if (typeof target === 'object') return target;
        const cam = t.camera ?? { x: 0, y: 0 };
        let wx;
        let wy;
        if (target === 'hero') [wx, wy] = [world.body.x, world.body.y];
        else if (target.startsWith('mochi:')) {
          const e = world.gardenLife?.mochi?.[Number(target.slice(6))];
          [wx, wy] = [e?.x ?? 0, e?.y ?? groundAt(world.map, e?.x ?? 0)];
        } else {
          const n = world.map.npcs.find((x) => x.id === target);
          [wx, wy] = [n?.x ?? 0, n ? n.y ?? groundAt(world.map, n.x) : 0];
        }
        // (A Mochi is small: a tighter box.)
        const small = typeof target === 'string' && target.startsWith('mochi:');
        return small ? { x: wx - cam.x - 24, y: wy - cam.y - 40, w: 48, h: 48 } : { x: wx - cam.x - 32, y: wy - cam.y - 62, w: 64, h: 72 };
    },
    // Films a spot of the screen straight off the game's canvas, every `every` frames for `secs`,
    // and lays the frames out as a numbered contact sheet over the game (for the browser pane's
    // screenshot): what a swap, a hop or a flicker really looks like, frame by frame.
    film(target = 'hero', secs = 1.5, every = 3, scale = 3) {
      need();
      t.closeFilm();
      const canvas = document.getElementById('game');
      const k = canvas.width / 640;
      const box = () => t.filmBox(target);
      const shots = [];
      const t0 = performance.now();
      let f = 0;
      return new Promise((done) => {
        const frame = () => {
          if (f++ % every === 0) {
            const b = box();
            const c = document.createElement('canvas');
            c.width = b.w * scale;
            c.height = b.h * scale;
            const g = c.getContext('2d');
            g.imageSmoothingEnabled = false;
            g.drawImage(canvas, b.x * k, b.y * k, b.w * k, b.h * k, 0, 0, c.width, c.height);
            shots.push({ c, at: (performance.now() - t0) / 1000 });
          }
          if (performance.now() - t0 < secs * 1000) requestAnimationFrame(frame);
          else {
            const cols = Math.min(shots.length, Math.max(1, Math.floor((innerWidth - 20) / (shots[0].c.width + 4))));
            const sheet = document.createElement('div');
            sheet.id = 'tengu-film';
            Object.assign(sheet.style, { position: 'fixed', inset: '0', overflow: 'auto', background: '#222a', zIndex: 99999, display: 'grid', gridTemplateColumns: `repeat(${cols}, auto)`, gap: '4px', padding: '6px', alignContent: 'start', justifyContent: 'center' });
            for (const [i, s] of shots.entries()) {
              const cell = document.createElement('div');
              Object.assign(cell.style, { position: 'relative', background: '#fff' });
              cell.append(s.c);
              const tag = document.createElement('span');
              tag.textContent = `${i} ${s.at.toFixed(2)}s`;
              Object.assign(tag.style, { position: 'absolute', left: '2px', top: '1px', font: '10px monospace', color: '#000', background: '#fffc' });
              cell.append(tag);
              sheet.append(cell);
            }
            sheet.addEventListener('click', () => t.closeFilm());
            document.body.append(sheet);
            done(`${shots.length} frames over ${secs}s (click the sheet or closeFilm() to hide it)`);
          }
        };
        requestAnimationFrame(frame);
      });
    },
    closeFilm() {
      document.getElementById('tengu-film')?.remove();
      return 'hidden';
    },
    mochi() {
      return (need().gardenLife?.mochi ?? []).map((e, i) => ({
        i, name: e.rec.name, stage: e.rec.stage, x: Math.round(e.x ?? -1), speed: Math.round(e.m.speed ?? 0), mode: e.m.mode,
        cant: e.m.cant ?? null, action: e.m.action?.name ?? null, run: e.rec.stats?.run?.points ?? 0, mood: Math.round(e.rec.mood ?? 0),
      }));
    },
    npc(id) {
      const world = need();
      const n = world.map.npcs.find((x) => x.id === id);
      const npc = NPCS[id];
      return n ? { x: n.x, y: n.y ?? groundAt(world.map, n.x), night: isNight(world), nightOutfit: Boolean(npc?.nightGear && isNight(world)) } : 'Not on this map.';
    },
  });
  installKits(t);
  installKits2(t);
  installKits3(t);
  installKits4(t);
}

function safe(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
