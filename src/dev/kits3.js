// The game-wide audits (2026-11-10): every quest walked start to finish, every shop's prices
// checked against each other, a Mochi raised through whole lifetimes, every boss spawned and
// fought down, and a room flooded with pretend players. Localhost only, with the rest
// (dev/debug.js); `__tengu.help()` lists them.
import { QUESTS } from '../data/quests.js';
import { NPCS } from '../data/npcs.js';
import { MOBS } from '../data/mobs.js';
import { ITEMS, JOB_SLOTS, GEAR_FAMILIES, jobGearId } from '../data/items.js';
import { MAPS } from '../data/maps.js';
import { JOBS } from '../data/jobs.js';
import { createCharacter, wornGear } from '../core/character.js';
import { addItem } from '../core/inventory.js';
import { questState, acceptQuest, objectiveProgress, noteTalk, noteVisit, completeQuest, npcMap, mobPlaces, itemSources } from '../core/quests.js';
import { sellPrice } from '../ui/tooltips.js';
import { rollMochi, STATS } from '../data/mochi-genes.js';
import { newRecord, tick, feed, care, canEvolve, evolve, canRebirth, rebirth, canAscend, MOCHI_SWEETS, CARE, MAX_LEVEL } from '../data/mochi-raise.js';
import { spawn } from '../world/gm.js';
import { killMob } from '../world/world.js';

export const KIT3_HELP = {
  questWalk: 'questWalk(): every quest checked (its giver, monsters, items, people and places exist and can be found) and walked start to finish for each job family: which fail, and which can never be reached',
  economy: 'economy(): every shop\'s stock against every shop\'s buying prices: anything you can buy and sell back for a profit, free or missing prices, prices off the money scale',
  mochiLife: 'mochiLife(lives, hours): raises Mochi through whole lives with steady care (evolving, rebirth, ascending): when each step comes, and any broken numbers on the way',
  bossCheck: 'bossCheck(filter?): spawns each boss beside you, takes it down in steps (75%, 40%, 10%, 0) and watches for errors and what it drops; bossReport() while it runs',
  stress: 'stress(players, secs): (in a ?net=local tab, in a room: friendHost()) pretend players flood the room with moves; frame times before and during',
};

export function installKits3(t) {
  const w = () => {
    if (!t.world) throw new Error('Start a game first.');
    return t.world;
  };
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const bad = (v) => typeof v === 'number' && !Number.isFinite(v);

  // ---------- Quests ----------
  function questLint() {
    const out = {};
    const add = (id, why) => (out[id] ??= []).push(why);
    const given = new Set(Object.values(QUESTS).flatMap((q) => (q.gives ?? []).map((g) => g.id)));
    const sold = new Set(Object.values(NPCS).flatMap((n) => [...(n.shop ?? []), ...(n.secretShop ?? [])]));
    for (const q of Object.values(QUESTS)) {
      if (!NPCS[q.giver]) add(q.id, `giver ${q.giver} doesn't exist`);
      else if (!npcMap(q.giver)) add(q.id, `giver ${q.giver} stands on no map`);
      if (q.prereq && !QUESTS[q.prereq]) add(q.id, `needs quest ${q.prereq}, which doesn't exist`);
      for (const o of q.objectives) {
        if (o.type === 'kill') {
          if (!MOBS[o.mob]) add(q.id, `monster ${o.mob} doesn't exist`);
          else if (!mobPlaces(o.mob).length && !MOBS[o.mob].boss) add(q.id, `${MOBS[o.mob].name} lives nowhere`);
        }
        if (o.type === 'collect' || o.type === 'deliver') {
          if (!ITEMS[o.item]) add(q.id, `item ${o.item} doesn't exist`);
          else if (!itemSources(o.item).length && !given.has(o.item) && !sold.has(o.item) && !ITEMS[o.item].craft && !ITEMS[o.item].fish) add(q.id, `${ITEMS[o.item].name} can't be found anywhere (no drop, shop or quest)`);
        }
        if ((o.type === 'talk' || o.type === 'deliver') && !NPCS[o.npc]) add(q.id, `person ${o.npc} doesn't exist`);
        else if ((o.type === 'talk' || o.type === 'deliver') && !npcMap(o.npc)) add(q.id, `${NPCS[o.npc].name} stands on no map`);
        if (o.type === 'visit' && !MAPS[o.map]) add(q.id, `place ${o.map} doesn't exist`);
        if (o.type === 'catch' && !ITEMS[o.fish]) add(q.id, `fish ${o.fish} doesn't exist`);
      }
      for (const r of q.rewards?.items ?? []) if (!ITEMS[r.id]) add(q.id, `reward ${r.id} doesn't exist`);
    }
    return out;
  }
  // Walks every quest a hero of `family` can take, in the order they open, doing each objective.
  function walk(family) {
    const tops = Object.values(JOBS).filter((j) => j.family === family).sort((a, b) => b.tier - a.tier);
    const c = createCharacter('Walker', {});
    c.job = tops[0]?.id ?? 'novice';
    c.level = 50;
    const fails = {};
    for (let round = 0; round < 400; round++) {
      const open = Object.keys(QUESTS).filter((id) => questState(c, id) === 'available');
      if (!open.length) break;
      for (const id of open) {
        const q = QUESTS[id];
        try {
          acceptQuest(c, id);
          const rec = c.quests[id];
          for (const o of q.objectives) {
            if (o.type === 'kill') rec.kills[o.mob] = o.count;
            if (o.type === 'catch') (rec.catches ??= {})[o.fish] = o.count;
            if (o.type === 'collect') addItem(c.inventory, o.item, o.count);
            if (o.type === 'deliver') addItem(c.inventory, o.item, 1);
            if (o.type === 'visit') noteVisit(c, o.map, { y: (o.above ?? 0) - 1 });
            if (o.type === 'talk' || o.type === 'deliver') noteTalk(c, o.npc);
          }
          c.inventory.equip = [];
          // (A Novice can't take a job here: that one waits for the job families' walks.)
          if (family === 'beginner' && q.objectives.some((o) => o.type === 'job')) {
            c.quests[id] = { state: 'done' };
            continue;
          }
          if (!completeQuest(c, id)) {
            const left = objectiveProgress(c, id).filter((o) => o.have < o.count).map((o) => `${o.type} ${o.mob ?? o.item ?? o.npc ?? o.map ?? o.fish ?? ''} ${o.have}/${o.count}`);
            fails[id] = `couldn't hand in (${questState(c, id)}${left.length ? `: ${left.join(', ')}` : ''})`;
            c.quests[id] = { state: 'done' };
          }
        } catch (err) {
          fails[id] = `broke: ${err.message}`;
          c.quests[id] = { state: 'done' };
        }
      }
    }
    const never = Object.keys(QUESTS).filter((id) => questState(c, id) !== 'done' && (!QUESTS[id].family || QUESTS[id].family === family) && !QUESTS[id].daily);
    return { fails, never: never.map((id) => `${id} (${questState(c, id)}${QUESTS[id].prereq ? `, after ${QUESTS[id].prereq}` : ''})`) };
  }

  // ---------- Shops ----------
  function economy() {
    const shops = Object.values(NPCS).filter((n) => n.shop || n.stockLevels || n.secretShop);
    const gainAt = (n, id) => n.buys?.[id] ?? (n.buysSweets && ITEMS[id]?.mochiSweet ? n.buysSweets : Math.round(sellPrice(id) * (n.fishBonus && ITEMS[id]?.fish ? n.fishBonus : 1)));
    const profit = [];
    const odd = [];
    for (const n of shops) {
      const stock = new Set([...(n.shop ?? []), ...(n.secretShop ?? [])]);
      if (n.stockLevels) for (let L = n.stockLevels[0]; L <= n.stockLevels[1]; L += 5) for (const f of GEAR_FAMILIES) for (const s of JOB_SLOTS) stock.add(jobGearId(f, s, L));
      for (const id of stock) {
        const def = ITEMS[id];
        if (!def) {
          odd.push(`${n.name} sells ${id}, which doesn't exist`);
          continue;
        }
        const cost = n.prices?.[id] ?? def.price;
        if (!(cost > 0)) odd.push(`${n.name} sells ${def.name} for ${cost}`);
        if (cost > 1e6) odd.push(`${n.name} sells ${def.name} for ${cost.toLocaleString()} (off the scale)`);
        let best = null;
        for (const m of shops) {
          const g = gainAt(m, id);
          if (!best || g > best.g) best = { g, who: m.name };
        }
        if (best && cost > 0 && best.g > cost) profit.push(`${def.name}: buy from ${n.name} for ${cost}, sell to ${best.who} for ${best.g} (+${best.g - cost} each)`);
      }
    }
    // What shops pay that's more than the item is worth anywhere (their own `buys`).
    for (const n of shops) for (const [id, g] of Object.entries(n.buys ?? {})) if (!ITEMS[id]) odd.push(`${n.name} buys ${id}, which doesn't exist`);
    return { shops: shops.length, profit: profit.length ? profit : 'no buy-low, sell-high loops', odd: odd.length ? odd : 'nothing odd' };
  }

  // ---------- A Mochi's whole life ----------
  function mochiLife(lives = 3, hours = 120) {
    const out = [];
    for (let life = 0; life < lives; life++) {
      let rec = newRecord(rollMochi(1000 + life * 77));
      const steps = [];
      const broken = new Set();
      const sweets = MOCHI_SWEETS.map((s) => s.id);
      const cares = Object.keys(CARE);
      for (let m = 0; m < hours * 60; m++) {
        tick(rec, 60);
        // Steady care: a sweet every 20 minutes, a kind word every 10 (as a keen player might).
        if (m % 20 === 0) feed(rec, sweets[(m / 20) % sweets.length], () => 0.5);
        if (m % 10 === 0) care(rec, cares[(m / 10) % cares.length], () => 0.5);
        const at = `${(m / 60).toFixed(1)}h`;
        if (canEvolve(rec)) {
          evolve(rec, () => 0.5);
          steps.push(`${at} evolved to ${rec.stage}`);
        }
        if (canRebirth(rec)) {
          // (Reborn as an egg, which hatches into a new Mochiko: the garden's hatching.)
          const { egg, raised } = rebirth(rec, () => 0.5);
          rec = Object.assign(egg, { stage: 'mochiko', age: 0 });
          steps.push(`${at} reborn as gen ${rec.gen}${raised.length ? ` (${raised.join(', ')} up a grade)` : ''}`);
        }
        if (canAscend(rec) && rec.stage === 'mochiko' && !steps.some((x) => x.endsWith(`gen ${rec.gen} could ascend`))) steps.push(`${at} gen ${rec.gen} could ascend`);
        if (rec.stage === 'tsukimochi') {
          steps.push(`${at} ascended: a Tsukimochi for good`);
          break;
        }
        if (m % 30 === 0) {
          for (const [k, v] of Object.entries(rec)) if (bad(v)) broken.add(`${k} = ${v}`);
          for (const s of STATS) {
            const st = rec.stats[s];
            if (bad(st.points) || bad(st.level) || st.level > MAX_LEVEL) broken.add(`${s} ${st.level}/${st.points}`);
          }
          if (rec.mood < 0 || rec.mood > 100) broken.add(`mood ${rec.mood}`);
        }
      }
      out.push({ life: life + 1, stage: rec.stage, gen: rec.gen, mood: Math.round(rec.mood), steps: steps.slice(0, 30), broken: broken.size ? [...broken] : 'none' });
    }
    return out;
  }

  // ---------- Bosses ----------
  let bossRep = null;
  function bossCheck(filter = '') {
    const world = w();
    const ids = Object.values(MOBS).filter((m) => m.boss && m.id.includes(filter)).map((m) => m.id);
    t.snapshot('before-bosses');
    world.god = true;
    bossRep = { done: 0, of: ids.length, problems: {}, drops: {} };
    (async () => {
      for (const id of ids) {
        const errs0 = t.errorCount();
        const before = new Set(world.mobs);
        try {
          spawn(world, id, 1);
        } catch (err) {
          bossRep.problems[id] = [`could not spawn: ${err.message}`];
          bossRep.done += 1;
          continue;
        }
        const boss = world.mobs.find((m) => !before.has(m));
        const notes = [];
        if (!boss) notes.push('did not appear');
        else {
          await sleep(1200);
          for (const frac of [0.75, 0.4, 0.1]) {
            boss.hp = Math.max(1, Math.round((boss.maxHp ?? MOBS[id].hp) * frac));
            await sleep(900);
            if (bad(boss.x) || bad(boss.y) || bad(boss.hp)) notes.push(`broken numbers at ${frac * 100}%`);
          }
          const loot0 = (world.drops ?? world.loot ?? []).length;
          // (Killed the way the game does it: its death, experience and loot.)
          boss.hp = 0;
          try {
            killMob(world, boss);
          } catch (err) {
            notes.push(`dying broke: ${err.message}`);
          }
          await sleep(1500);
          bossRep.drops[id] = (world.drops ?? world.loot ?? []).length - loot0;
          if (world.mobs.includes(boss) && boss.hp > 0) notes.push('would not die');
        }
        const errs = t.errorCount() - errs0;
        if (errs) notes.push(`${errs} errors: errors()`);
        if (notes.length) bossRep.problems[id] = notes;
        // Clear up before the next one.
        for (const m of world.mobs) if (!before.has(m)) m.hp = 0;
        world.mobs = world.mobs.filter((m) => before.has(m));
        world.scene = null;
        bossRep.done += 1;
      }
      t.restore('before-bosses');
      world.god = false;
      bossRep.finished = true;
    })();
    return `Fighting ${ids.length} bosses down (about 5s each): bossReport() for progress.`;
  }

  // ---------- Pretend players ----------
  async function stress(players = 3, secs = 6) {
    const world = w();
    const net = await import('../net/online.js');
    if (net.online.status !== 'on') return 'Open a room first: friendHost() (in a ?net=local tab).';
    const calm = await t.frames(2);
    const c = world.char;
    const ids = Array.from({ length: players }, (_, i) => `fake${i}`);
    for (const [i, id] of ids.entries()) net.devReceive({ t: 'prof', id, name: `Pretend ${i + 1}`, look: c.appearance, gear: wornGear(c), job: c.job, level: c.level });
    const t0 = performance.now();
    let sent = 0;
    const timer = setInterval(() => {
      const k = (performance.now() - t0) / 1000;
      for (const [i, id] of ids.entries()) {
        const x = world.body.x + Math.sin(k * 1.3 + i) * 120 + i * 8;
        net.devReceive({ t: 'me', id, map: world.map.id, x, y: world.body.y, vx: Math.cos(k * 1.3 + i) * 150, vy: 0, g: true, r: false, f: Math.cos(k * 1.3 + i) > 0 ? 1 : -1, p: { pose: 'walk' }, hp: 100, mhp: 100, buffs: {}, gd: world.gardenVisit?.ownerId ?? net.online.id, fx: [], nums: [] });
        sent += 1;
      }
    }, 1000 / 18);
    const busy = await t.frames(Math.min(secs, 30));
    clearInterval(timer);
    for (const id of ids) net.devReceive({ t: 'bye', id });
    return { players, messagesIn: sent, perSecond: Math.round(sent / Math.min(secs, 30)), alone: `${calm.fps} fps, worst ${calm.worstMs} ms`, flooded: `${busy.fps} fps, worst ${busy.worstMs} ms, ${busy.hitches} hitches`, errors: t.errorCount() };
  }

  Object.assign(t, {
    questWalk() {
      const lint = questLint();
      const families = [...new Set(Object.values(JOBS).map((j) => j.family))].filter((f) => f !== 'gm');
      const walks = Object.fromEntries(families.map((f) => [f, walk(f)]));
      const fails = {};
      for (const [f, r] of Object.entries(walks)) for (const [id, why] of Object.entries(r.fails)) (fails[id] ??= []).push(`${f}: ${why}`);
      const never = {};
      for (const [f, r] of Object.entries(walks)) for (const n of r.never) (never[n] ??= []).push(f);
      return { quests: Object.keys(QUESTS).length, dataProblems: Object.keys(lint).length ? lint : 'none', failedToHandIn: Object.keys(fails).length ? fails : 'none', neverReached: Object.keys(never).length ? never : 'none' };
    },
    economy,
    mochiLife,
    bossCheck,
    bossReport: () => bossRep ?? 'Not run yet: bossCheck().',
    stress,
  });
}
