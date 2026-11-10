// Still more dev kits (2026-11-10): every NPC's talk window in every place, record and replay,
// a long-play leak watch, a save fuzzer, and a two-tab friend helper. Localhost only, with the rest
// (dev/debug.js); `__tengu.help()` lists them.
import { MAPS } from '../data/maps.js';
import { loadMap, createWorld, updateWorld } from '../world/world.js';
import { loadGame } from '../core/save.js';

export const KIT2_HELP = {
  npcSweep: 'npcSweep(filter?): visits every map with NPCs (or those whose id has filter), talks to each NPC and checks its talk window for hidden or cut-off text; npcReport() while it runs. Your save is put back afterwards.',
  record: 'record(): start recording your key presses (with a snapshot of this moment); stopRecord() ends it',
  replay: 'replay(): go back to the recording\'s start and press the same keys at the same times',
  leakWatch: 'leakWatch(mins, everySecs): sample memory, save size, effects, monsters and the page every few seconds; leakReport() shows the trend',
  fuzzHung: 'fuzzHung(): after a fuzz run froze the page (reload it), which damaged save did it, and put the spare slot back as it was',
  fuzzSaves: 'fuzzSaves(n): load n damaged copies of your save (missing parts, wrong types, old shapes) in a spare slot and play a second of each: what crashes or gets lost. Your saves are untouched.',
  friendHost: 'friendHost(): (in a ?net=local tab) open a room and leave its code for the other tab',
  friendJoin: 'friendJoin(): (in the second ?net=local tab, playing another hero) join the room the first tab opened',
};

export function installKits2(t) {
  const w = () => {
    if (!t.world) throw new Error('Start a game first.');
    return t.world;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---------- Every NPC's talk window ----------
  let npcRep = null;
  // ---------- Record and replay ----------
  let rec = null;
  let tape = null;
  const onKey = (e) => {
    if (rec) rec.keys.push({ at: performance.now() - rec.t0, type: e.type, code: e.code });
  };
  // ---------- Leak watch ----------
  let leak = null;

  Object.assign(t, {
    npcSweep(filter = '') {
      const world = w();
      const ids = Object.keys(MAPS).filter((id) => id.includes(filter) && (MAPS[id].npcs?.length ?? 0) > 0);
      t.snapshot('before-npc-sweep');
      const home = world.map.id;
      npcRep = { done: 0, of: ids.length, problems: {}, talkedTo: 0 };
      (async () => {
        for (const id of ids) {
          try {
            loadMap(world, id);
          } catch (err) {
            npcRep.problems[id] = { load: err.message };
            npcRep.done += 1;
            continue;
          }
          if (world.map.id !== id) {
            npcRep.done += 1;
            continue;
          }
          await sleep(400);
          const found = await t.textSweep();
          for (const [npc, r] of Object.entries(found)) {
            npcRep.talkedTo += 1;
            const bad = [...r.covered, ...r.cutByEdge, ...r.textOnText];
            if (bad.length) (npcRep.problems[id] ??= {})[npc] = bad;
          }
          npcRep.done += 1;
        }
        t.restore('before-npc-sweep');
        loadMap(world, home);
        npcRep.finished = true;
      })();
      return `Talking to the NPCs of ${ids.length} maps (about 3s each): npcReport() for progress.`;
    },
    npcReport: () => npcRep ?? 'Not run yet: npcSweep().',

    record() {
      t.snapshot('replay-start');
      rec = { t0: performance.now(), keys: [] };
      window.addEventListener('keydown', onKey, true);
      window.addEventListener('keyup', onKey, true);
      return 'recording your keys: play, then stopRecord()';
    },
    stopRecord() {
      if (!rec) return 'Not recording.';
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', onKey, true);
      tape = rec;
      rec = null;
      const secs = (tape.keys.at(-1)?.at ?? 0) / 1000;
      return `${tape.keys.length} key events over ${secs.toFixed(1)}s: replay() to play them back`;
    },
    async replay() {
      if (!tape) return 'Nothing recorded: record() first.';
      t.restore('replay-start');
      await sleep(200);
      const t0 = performance.now();
      for (const k of tape.keys) {
        const wait = k.at - (performance.now() - t0);
        if (wait > 0) await sleep(wait);
        window.dispatchEvent(new KeyboardEvent(k.type, { code: k.code, key: k.code.replace(/^Key|^Digit/, ''), bubbles: true }));
      }
      return `replayed ${tape.keys.length} key events`;
    },

    leakWatch(mins = 5, every = 10) {
      const world = w();
      leak = { samples: [], until: performance.now() + mins * 60000 };
      const sample = () => {
        const mem = performance.memory?.usedJSHeapSize;
        leak.samples.push({
          min: +((mins * 60000 - (leak.until - performance.now())) / 60000).toFixed(1),
          heapMB: mem ? +(mem / 1048576).toFixed(1) : null,
          saveKB: +(JSON.stringify(world.char).length / 1024).toFixed(1),
          fx: world.fx?.length ?? 0, mobs: world.mobs?.length ?? 0, drops: world.drops?.length ?? world.loot?.length ?? 0,
          bots: world.bots?.list?.length ?? world.bots?.length ?? 0, events: world.events?.length ?? 0,
          page: document.getElementsByTagName('*').length, canvases: document.getElementsByTagName('canvas').length,
        });
        if (performance.now() < leak.until) leak.timer = setTimeout(sample, every * 1000);
      };
      sample();
      return `watching for ${mins} min, every ${every}s: leakReport()`;
    },
    leakReport() {
      if (!leak?.samples.length) return 'Not run yet: leakWatch().';
      const s = leak.samples;
      const first = s[0];
      const last = s.at(-1);
      const grew = Object.keys(first).filter((k) => k !== 'min' && typeof first[k] === 'number' && last[k] > first[k] * 1.5 + 2).map((k) => `${k}: ${first[k]} -> ${last[k]}`);
      return { samples: s.length, overMinutes: last.min, grewALot: grew.length ? grew : 'nothing grew much', first, last };
    },

    async fuzzSaves(n = 20) {
      const base = JSON.parse(JSON.stringify(w().char));
      // Everything in local storage, to put back exactly afterwards.
      const keep = {};
      for (let i = 0; i < localStorage.length; i++) keep[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
      const FILE = 2;
      const SLOT = 3;
      const key = `twzt-w${FILE}-c${SLOT}`;
      // (What the spare slot and its file held, for fuzzHung() to put back if the page freezes.)
      sessionStorage.setItem('tengu-fuzz-spare', JSON.stringify({ [key]: localStorage.getItem(key), [`twzt-w${FILE}`]: localStorage.getItem(`twzt-w${FILE}`) }));
      const paths = [];
      const walk = (o, p = []) => {
        if (p.length > 3 || !o || typeof o !== 'object') return;
        for (const k of Object.keys(o)) {
          paths.push([...p, k]);
          walk(o[k], [...p, k]);
        }
      };
      walk(base);
      const odd = [null, undefined, 0, -1, '', 'x', [], {}, NaN, 1e12, true];
      const results = { tried: 0, crashed: [], lost: [], fine: 0 };
      for (let i = 0; i < n; i++) {
        const c = JSON.parse(JSON.stringify(base));
        const what = [];
        for (let k = 0; k < 1 + (i % 3); k++) {
          const p = paths[Math.floor(Math.random() * paths.length)];
          let o = c;
          for (const step of p.slice(0, -1)) o = o?.[step];
          if (!o || typeof o !== 'object') continue;
          const last = p.at(-1);
          if (Math.random() < 0.4) {
            delete o[last];
            what.push(`no ${p.join('.')}`);
          } else {
            const v = odd[Math.floor(Math.random() * odd.length)];
            o[last] = v;
            what.push(`${p.join('.')} = ${JSON.stringify(v) ?? 'undefined'}`);
          }
        }
        results.tried += 1;
        // (Noted first: if one hangs the game, fuzzHung() after a reload says which.)
        sessionStorage.setItem('tengu-fuzz-last', what.join(', '));
        try {
          localStorage.setItem(key, JSON.stringify(c));
          const loaded = loadGame(SLOT, FILE);
          if (!loaded) {
            results.lost.push(what.join(', '));
            continue;
          }
          const world = createWorld(loaded);
          const input = { held: new Set(), pressed: new Set(), locked: false };
          for (let f = 0; f < 60; f++) updateWorld(world, 1 / 60, input);
          results.fine += 1;
        } catch (err) {
          results.crashed.push(`${what.join(', ')} -> ${err.message}`);
        }
        await sleep(0);
      }
      sessionStorage.removeItem('tengu-fuzz-last');
      // Put local storage back exactly as it was.
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (!(k in keep)) localStorage.removeItem(k);
      }
      for (const [k, v] of Object.entries(keep)) if (localStorage.getItem(k) !== v) localStorage.setItem(k, v);
      return results;
    },

    // After a fuzz run froze the page and it was reloaded: what that damaged save was, and the spare
    // slot (and its file) put back as they were.
    fuzzHung() {
      const last = sessionStorage.getItem('tengu-fuzz-last');
      for (const [k, v] of Object.entries(JSON.parse(sessionStorage.getItem('tengu-fuzz-spare') ?? '{}'))) {
        if (v == null) localStorage.removeItem(k);
        else localStorage.setItem(k, v);
      }
      sessionStorage.removeItem('tengu-fuzz-spare');
      sessionStorage.removeItem('tengu-fuzz-last');
      return last ? `The save that froze it: ${last}` : 'No fuzz run was cut short.';
    },
    async friendHost() {
      const net = await import('../net/online.js');
      net.hostRoom(w());
      for (let i = 0; i < 40 && net.online.status !== 'on'; i++) await sleep(100);
      localStorage.setItem('tengu-dev-room', net.online.code ?? '');
      return net.online.status === 'on' ? `Room ${net.online.code} open: friendJoin() in the other tab.` : `Could not open a room (${net.online.error ?? net.online.status}).`;
    },
    async friendJoin() {
      const code = localStorage.getItem('tengu-dev-room');
      if (!code) return 'No room yet: friendHost() in the other tab first.';
      const net = await import('../net/online.js');
      net.joinRoom(w(), code);
      for (let i = 0; i < 60 && net.online.status !== 'on'; i++) await sleep(100);
      await sleep(1500);
      return net.online.status === 'on' ? `In room ${code} with ${net.online.ghosts.size} other player(s).` : `Could not join (${net.online.error ?? net.online.status}).`;
    },
  });
}
