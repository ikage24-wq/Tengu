// A hero that plays its own quests (2026-11-10, for co-op runs with tools/quad.cjs): takes a quest
// from its giver, travels where its monsters are, fights them with real key presses, picks up what
// they drop, talks to whoever the quest names, and hands it in. Localhost only, with the rest
// (dev/debug.js); `__tengu.help()` lists them.
import { QUESTS } from '../data/quests.js';
import { MAPS } from '../data/maps.js';
import { MOBS } from '../data/mobs.js';
import { JOBS, nextJobs } from '../data/jobs.js';
import { questState, acceptQuest, completeQuest, objectiveProgress, noteTalk, noteVisit, npcMap, itemSources } from '../core/quests.js';
import { countItem } from '../core/inventory.js';
import { advanceJob, autoAssignAp, learnSkill, canLearn, giveStarterWeapon, equipFromBag, equipBlocker } from '../core/character.js';
import { SKILLS } from '../data/skills.js';
import { ITEMS } from '../data/items.js';
import { NPCS, shopStock } from '../data/npcs.js';
import { addItem } from '../core/inventory.js';
import { makeEquip } from '../core/items.js';
import { loadMap, respawn } from '../world/world.js';
import { startRun, taskProgress } from '../world/dungeon.js';
import { DUNGEONS } from '../data/dungeons.js';
import { groundAt } from '../world/physics.js';
import { navOf, surfaceOf, surfaceBelow, findPath, followPath } from '../world/nav.js';

export const KIT4_HELP = {
  autoQuest: "autoQuest(id): play one quest start to finish (take it, fight, gather, talk, hand in), with real key presses in fights",
  autoPlay: "autoPlay(level, family?, {walk}): play open quests in level order until `level` (taking the first job of `family` at 5); playReport() while it runs. walk: true goes through the doors on foot like a player (learns skills, wears better gear, buys potions, takes the job from its instructor)",
  walkTo: "walkTo(mapId): walk there through the doors, like a player (logs doors that don't work and ledges it can't reach)",
  notebook: "the auto-player's notebook (localStorage 'tengu-dev-notebook'): faints, hunting speeds, doors; it learns from it between runs. localStorage.removeItem('tengu-dev-notebook') to forget",
};

export function installKits4(t) {
  const w = () => t.world;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const held = new Set();
  const key = (code, down) => {
    if (down === held.has(code)) return;
    if (down) held.add(code);
    else held.delete(code);
    window.dispatchEvent(new KeyboardEvent(down ? 'keydown' : 'keyup', { code, key: code, bubbles: true }));
  };
  const release = () => [...held].forEach((c) => key(c, false));
  const mapsWith = (mobId) => Object.values(MAPS).filter((m) => !m.dungeon && m.spawns?.some((s) => s.mob === mobId)).map((m) => m.id);
  const opts = { walk: false };
  // The player's notebook, kept between runs (this browser only): where it fainted and to what,
  // how fast each hunting spot went for each monster, and doors that misbehaved. It picks spots and
  // roads from it next time, the way a player learns a game.
  const NOTE_KEY = 'tengu-dev-notebook';
  const book = (() => {
    try {
      return JSON.parse(localStorage.getItem(NOTE_KEY)) ?? {};
    } catch {
      return {};
    }
  })();
  book.faints ??= {};
  book.hunts ??= {};
  book.doors ??= {};
  const keepBook = () => {
    try {
      localStorage.setItem(NOTE_KEY, JSON.stringify(book));
    } catch {}
  };
  // Faints on a map at about this level: a place to stay away from for a while.
  const scary = (mapId) => (book.faints[mapId] ?? []).filter((f) => f.level >= (w()?.char.level ?? 1) - 3).length;
  const go = async (mapId) => {
    if (w().map.id === mapId) return;
    if (opts.walk && (await walkTo(mapId))) return;
    loadMap(w(), mapId, 'start');
    await sleep(400);
  };
  // The roads: the shortest chain of doors from one map to another (no dungeons, no private places).
  const road = (from, dest) => {
    const prev = { [from]: null };
    const queue = [from];
    while (queue.length) {
      const m = queue.shift();
      if (m === dest) break;
      for (const p of MAPS[m]?.portals ?? []) {
        const n = MAPS[p.to];
        if (!n || p.homestone || n.dungeon || n.private || n.home || n.garden || p.to in prev) continue;
        // (Not through a map whose monsters would flatten you, unless that's where you're going.)
        const low = Math.min(...(n.spawns ?? []).filter((x) => !MOBS[x.mob]?.boss).map((x) => MOBS[x.mob]?.level ?? 0));
        if (p.to !== dest && Number.isFinite(low) && low > (w()?.char.level ?? 1) + 8) continue;
        if (p.to !== dest && scary(p.to) >= 2) continue;
        prev[p.to] = m;
        queue.push(p.to);
      }
    }
    if (!(dest in prev)) return null;
    const path = [];
    for (let m = dest; m !== from; m = prev[m]) path.unshift(m);
    return path;
  };
  const trip = { doors: 0, climbs: 0, broken: [], secs: 0 };
  async function walkTo(mapId) {
    const path = road(w().map.id, mapId);
    if (!path) return say(`no road from ${w().map.id} to ${mapId}`), false;
    const t0 = w().now;
    for (const next of path) {
      const here = w().map;
      const p = here.portals.find((x) => x.to === next);
      // (A ferry or a boat isn't a door: you ride it. Taken as a ride.)
      if (p.hidden) {
        trip.rides = (trip.rides ?? 0) + 1;
        loadMap(w(), next, p.toPortal);
        await sleep(600);
        continue;
      }
      const py = p.y ?? here.groundY;
      if (!(await navTo(p.x, py, 8))) trip.climbs++;
      for (let k = 0; k < 4 && w().map.id === here.id; k++) {
        key('ArrowUp', true);
        await sleep(140);
        key('ArrowUp', false);
        await sleep(350);
      }
      trip.doors++;
      if (w().map.id !== next) {
        trip.broken.push(`${here.id}->${next} at x ${p.x}`);
        book.doors[`${here.id}->${next}`] = (book.doors[`${here.id}->${next}`] ?? 0) + 1;
        keepBook();
        say(`door from ${here.name} to ${MAPS[next].name} didn't take me (x ${p.x}); jumped`);
        loadMap(w(), next, p.toPortal);
      }
      await sleep(500);
    }
    trip.secs += w().now - t0;
    return true;
  }
  // A player's habits between fights: skill points, better gear, potions.
  // Where SP goes, the way a mage player thinks: one point opens each buff (a buff is worth having
  // at all more than worth having high), then the attack that has done the most per MP so far
  // (from the notebook), then the rest.
  const spPick = (c) => {
    const ids = Object.values(SKILLS).filter((x) => !x.grows && x.type !== 'passive' && canLearn(c, x.id)).map((x) => x.id);
    const open = ids.filter((id) => SKILLS[id].type === 'buff' && !c.skills[id]);
    const attacks = ids.filter((id) => SKILLS[id].type === 'attack' && !SKILLS[id].movement).sort((a, b) => {
      const ra = learnt(a)?.casts >= 5 ? learnt(a).dmg / Math.max(1, learnt(a).mp) : 0;
      const rb = learnt(b)?.casts >= 5 ? learnt(b).dmg / Math.max(1, learnt(b).mp) : 0;
      return rb - ra || (c.skills[b] ?? 0) - (c.skills[a] ?? 0);
    });
    return [...open, ...attacks, ...ids];
  };
  const PLAN = {};
  const habits = () => {
    const c = w().char;
    const plan = PLAN[c.job] ?? spPick(c);
    for (let guard = 0; c.sp > 0 && guard < 50; guard++) {
      const id = plan.find((x) => learnSkill(c, x)) ?? Object.keys(SKILLS).find((x) => learnSkill(c, x));
      if (!id) break;
      if (c.skills[id] === 1) say(`learned ${SKILLS[id].name}`);
    }
    // Better gear from the bag: the most stat points that fit.
    const score = (inst) => Object.values(inst?.stats ?? ITEMS[inst?.id]?.stats ?? {}).reduce((a, v) => a + (Number(v) || 0), 0);
    for (let i = c.inventory.equip.length - 1; i >= 0; i--) {
      const inst = c.inventory.equip[i];
      const slot = ITEMS[inst.id]?.slot;
      if (!slot || equipBlocker(c, inst) || score(inst) <= score(c.equipment[slot])) continue;
      if (equipFromBag(c, i)) say(`put on ${ITEMS[inst.id].name}`);
    }
  };
  // Potions from a shop on this map, when running low (a third of your gold at most). And gear, as
  // a player checks the shop on the way past: a piece for her job and level with more stats than
  // what she wears, if it costs no more than half her gold.
  const shopping = () => {
    const c = w().char;
    const gearScore = (id) => Object.values(ITEMS[id]?.stats ?? {}).reduce((a, v) => a + (Number(v) || 0), 0);
    for (const n of w().map.npcs.map((x) => NPCS[x.id]).filter((x) => x?.shop)) {
      for (const id of shopStock(n, c)) {
        const def = ITEMS[id];
        if (def?.type !== 'equip' || !def.slot) continue;
        const inst = { id };
        if (equipBlocker(c, inst)) continue;
        const now = c.equipment[def.slot];
        const nowScore = Object.values(now?.stats ?? ITEMS[now?.id]?.stats ?? {}).reduce((a, v) => a + (Number(v) || 0), 0);
        if (gearScore(id) <= nowScore || def.price > c.gold / 2) continue;
        const made = makeEquip(id);
        if (!addItem(c.inventory, made)) continue;
        c.gold -= def.price;
        say(`bought ${def.name} from ${n.name} (${def.price.toLocaleString()}g)`);
      }
    }
    habits();
    for (const id of ['red_potion', 'blue_potion']) {
      if (countItem(c.inventory, id) >= 15) continue;
      const npc = w().map.npcs.map((n) => NPCS[n.id]).find((n) => n && shopStock(n, c).includes(id));
      if (!npc) continue;
      const each = ITEMS[id].price ?? 10;
      const qty = Math.min(30 - countItem(c.inventory, id), Math.floor(c.gold / 3 / each));
      if (qty > 0 && addItem(c.inventory, id, qty)) {
        c.gold -= qty * each;
        say(`bought ${qty} ${ITEMS[id].name} from ${npc.name} (${qty * each}g)`);
      }
    }
  };
  // Walking somewhere on this map like a player: the same route-finding the party helpers use
  // (ledges, ropes, drops), turned into held arrow keys and jumps, re-planned when knocked off.
  const ARROWS = { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', jump: 'Space' };
  const stuckLog = [];
  // Fainted somewhere: back up in town, counted (and why, if a monster did it).
  const faints = [];
  const getUp = async () => {
    if (!w().dead) return false;
    faints.push(`L${w().char.level} on ${w().map.name}`);
    const b = w().body;
    const near = w().mobs.filter((m) => m.hp > 0 && Math.abs(m.x - b.x) < 160 && Math.abs(m.y - b.y) < 80).map((m) => m.def.id);
    (book.faints[w().map.id] ??= []).push({ level: w().char.level, near: [...new Set(near)] });
    keepBook();
    say(`fainted on ${w().map.name}`);
    await sleep(800);
    respawn(w());
    await sleep(600);
    return true;
  };
  async function navTo(tx, ty = null, near = 10, secs = 40) {
    if (await getUp()) return false;
    if (w().scene) await watchScene();
    const t0 = performance.now();
    const mapId = w().map.id;
    let path = null;
    let plannedAt = 0;
    let lastX = w().body.x;
    let stillFor = 0;
    let regrab = 0;
    try {
      while (performance.now() - t0 < secs * 1000 && !opts.stop) {
        if (w().map.id !== mapId || w().dead || w().scene) return false;
        const b = w().body;
        const nav = navOf(w().map);
        const goal = surfaceBelow(nav, tx, ty ?? groundAt(w().map, tx));
        const here = surfaceOf(nav, b);
        if (here === goal && Math.abs(b.x - tx) <= near) return true;
        if (here >= 0 && (!path || performance.now() - plannedAt > 1500)) {
          path = findPath(nav, here, b.x, goal, tx) ?? [];
          plannedAt = performance.now();
        }
        const { intent, lost } = followPath(nav, b, path ?? [], tx, near);
        if (lost) path = null;
        // (A rope only catches a fresh press of Up or Down: let go and press again now and then.)
        const ropeMove = path?.[0]?.kind?.startsWith('rope');
        if (ropeMove && !b.rope && (intent.up || intent.down) && (regrab = (regrab ?? 0) + 1) % 8 === 0) {
          key('ArrowUp', false);
          key('ArrowDown', false);
          await sleep(30);
        }
        for (const [k, code] of Object.entries(ARROWS)) key(code, Boolean(intent[k]));
        await sleep(30);
        // (Pressed against something for a while: a hop.)
        stillFor = Math.abs(b.x - lastX) < 0.5 && (intent.left || intent.right) ? stillFor + 1 : 0;
        lastX = b.x;
        if (stillFor > 25) {
          key('Space', true);
          await sleep(120);
          key('Space', false);
          stillFor = 0;
        }
      }
      stuckLog.push(`${w().map.id}: couldn't reach x ${Math.round(tx)} y ${Math.round(ty ?? 0)} from x ${Math.round(w().body.x)} y ${Math.round(w().body.y)}`);
      say(`couldn't find a way to x ${Math.round(tx)} on ${w().map.name}; put there`);
      t.pos(tx, ty ?? undefined);
      return false;
    } finally {
      release();
    }
  }
  const talkTo = async (npcId) => {
    const mapId = npcMap(npcId);
    if (!mapId) return false;
    await go(mapId);
    const n = w().map.npcs.find((x) => x.id === npcId);
    if (!n) return false;
    await navTo(n.x - 14, groundAt(w().map, n.x), 6);
    return true;
  };
  // Opens a talk the way a player does: beside them, Up. Waits for the window.
  const ui = () => t.ui;
  async function openTalk(npcId) {
    if (!(await talkTo(npcId))) return false;
    for (let k = 0; k < 4; k++) {
      if (ui().windows?.npc?.open && ui().npc?.id === npcId) return true;
      key('ArrowUp', true);
      await sleep(120);
      key('ArrowUp', false);
      await sleep(400);
    }
    const ok = ui().windows?.npc?.open && ui().npc?.id === npcId;
    if (!ok) say(`Up beside ${npcId} didn't open a talk`);
    return ok;
  }
  const closeTalk = async () => {
    for (let k = 0; k < 3 && ui().windows?.npc?.open; k++) {
      key('Escape', true);
      await sleep(80);
      key('Escape', false);
      await sleep(250);
    }
  };
  // Waits out a cutscene, watching it like a player.
  const scenesSeen = { lines: 0 };
  const watchScene = async () => {
    const t0 = performance.now();
    // (A line at a time: let it type out, read it, then Enter for the next.)
    while (w().scene && performance.now() - t0 < 120000) {
      await sleep(1600);
      if (!w().scene) break;
      key('Enter', true);
      await sleep(80);
      key('Enter', false);
      scenesSeen.lines++;
    }
  };
  // Picks a quest in an open talk with its number key, lets the words type out (and a moment to
  // read them), then Enter: Accept or Complete. Returns the words read.
  const read = [];
  async function questPage(npcId, id) {
    const dlg = ui().npc;
    if (!dlg) return null;
    const npc = NPCS[npcId];
    if (dlg.quest !== id) {
      const ids = (npc.quests ?? []).filter((q) => !['locked', 'done'].includes(questState(w().char, q)));
      const fresh = ids.filter((q) => questState(w().char, q) === 'available' && !QUESTS[q].scenes?.accept);
      const i = ids.indexOf(id) + (fresh.length > 1 ? 1 : 0);
      if (i < 0 || i > 8) return null;
      key(`Digit${i + 1}`, true);
      await sleep(80);
      key(`Digit${i + 1}`, false);
      await sleep(250);
      if (ui().npc && ui().npc.quest !== id) {
        say(`number key ${i + 1} at ${npc.name} didn't open ${QUESTS[id].name}`);
        ui().npc.quest = id;
      }
    }
    const t0 = performance.now();
    await sleep(200);
    while (ui().npc?.talking && performance.now() - t0 < 30000) await sleep(150);
    await sleep(700);
    key('Enter', true);
    await sleep(80);
    key('Enter', false);
    await sleep(400);
    await watchScene();
    return QUESTS[id].text;
  }
  const hpLow = () => w().char.hp < (w().stats?.maxHp ?? 50) * 0.35;
  const tap = async (code, ms = 70) => {
    key(code, true);
    await sleep(ms);
    key(code, false);
  };

  // ---------- How her skills work, read from the game itself ----------
  // Each learned skill's shape at its level: how far it reaches, in front or all round, how many
  // it hits, its MP, its wait, and for a buff how long it lasts. A player learns this by reading
  // the skill window and trying things; she reads the same numbers.
  const shapeOf = (id) => {
    const c = w().char;
    const def = SKILLS[id];
    const lv = c.skills[id] ?? 0;
    if (!def || !lv || def.type === 'passive') return null;
    const a = def.at(lv, def.maxLevel);
    const strikes = (a.combo ?? []).flatMap((m) => m.strikes ?? []);
    const hitting = strikes.filter((x) => x.pct > 0);
    const grant = strikes.find((x) => x.grant)?.grant ?? null;
    return {
      id, type: def.type, mp: a.mp ?? 0, cooldown: a.cooldown ?? 0, finisher: Boolean(def.fullGauge), movement: Boolean(def.movement),
      reach: Math.max(0, ...hitting.map((x) => x.range ?? x.reach ?? 0), a.range?.w ?? 0),
      tall: Math.max(40, ...hitting.map((x) => x.h ?? 0)),
      around: hitting.some((x) => x.around) || Boolean(a.range?.around),
      targets: Math.max(a.targets ?? 1, ...hitting.map((x) => x.targets ?? 1)),
      pct: a.pct ?? 0, buff: grant?.id ?? null, lasts: grant?.duration ?? 0,
    };
  };
  const keyOf = (id) => Object.entries(w().char.hotkeys ?? {}).find(([, x]) => x?.skill === id)?.[0] ?? null;
  const castAt = {};
  // (What each skill really did, from watching monster HP drop after casting it: kept in the
  // notebook so she learns which skill earns its MP.)
  book.skills ??= {};
  const learnt = (id) => book.skills[id];
  async function cast(id, watch = true) {
    const code = keyOf(id);
    if (!code) return false;
    // (Only the monsters that were there when she cast: a respawn mid-count isn't her doing.)
    const before = watch ? w().mobs.filter((m) => m.hp > 0).map((m) => [m, m.hp]) : [];
    const mp0 = w().char.mp;
    await tap(code);
    castAt[id] = w().now;
    await sleep(Math.max(250, 900 / (w().devSpeed ?? 1)));
    if (w().char.mp >= mp0) return false; // (didn't go off: on its wait, or no MP)
    if (watch) {
      const alive = new Set(w().mobs);
      const dealt = before.reduce((n, [m, hp]) => n + hp - (alive.has(m) ? Math.max(0, m.hp) : 0), 0);
      const e = (book.skills[id] ??= { casts: 0, dmg: 0, mp: 0 });
      e.casts++;
      e.dmg += dealt;
      e.mp += mp0 - w().char.mp;
      if (e.casts % 10 === 0) keepBook();
    }
    return true;
  }
  // Who a skill would catch if cast from here, facing `dir`.
  const caught = (sh, dir) => {
    const b = w().body;
    return w().mobs.filter((m) => m.hp > 0 && Math.abs(m.y - b.y) < sh.tall && (sh.around ? Math.abs(m.x - b.x) < sh.reach : (m.x - b.x) * dir > -10 && Math.abs(m.x - b.x) < sh.reach)).length;
  };
  // Buffs kept up while fighting, like a player: Flow when it runs out, the shield when monsters
  // are close, the pool when hurt.
  async function keepBuffs(nearby) {
    const c = w().char;
    for (const id of Object.keys(c.skills)) {
      const sh = shapeOf(id);
      if (!sh || sh.type !== 'buff' || c.mp < sh.mp + 10) continue;
      const on = c.buffs?.[sh.buff]?.until > w().now || (castAt[id] != null && w().now - castAt[id] < Math.max(sh.lasts, sh.cooldown));
      if (on) continue;
      const want = id === 'bubbleshield' ? nearby >= 2 : id === 'tidepool' ? c.hp < (w().stats?.maxHp ?? 1) * 0.7 : true;
      if (want && (await cast(id, false))) say(`cast ${SKILLS[id].name}`);
    }
  }
  // The best attack for this moment: hits it'd land times its punch, against its MP (and what it
  // has really done so far, once she's tried it enough).
  const pickAttack = (dir) => {
    const c = w().char;
    let best = null;
    for (const id of Object.keys(c.skills)) {
      const sh = shapeOf(id);
      if (!sh || sh.type !== 'attack' || sh.movement || sh.finisher || c.mp < sh.mp) continue;
      const n = Math.min(sh.targets, caught(sh, dir));
      if (!n) continue;
      // (Damage per cast is what clears a field; MP thrift only matters once MP runs low.)
      const seen = learnt(id);
      const perCast = seen?.casts >= 5 ? seen.dmg / seen.casts : sh.pct * n;
      const perMp = perCast / Math.max(1, sh.mp);
      const thrifty = c.mp < (w().stats?.maxMp ?? 50) * 0.35;
      const score = thrifty ? perMp : perCast;
      if (!best || score > best.score) best = { id, score, n };
    }
    return best;
  };
  const stance = () => {
    // How far back she stands: just inside her longest reach, so monsters walk into her spells
    // instead of into her.
    const c = w().char;
    const reaches = Object.keys(c.skills).map(shapeOf).filter((x) => x?.type === 'attack' && !x.movement && !x.finisher).map((x) => x.reach * (x.around ? 0.6 : 0.75));
    return Math.max(30, Math.min(200, ...(reaches.length ? reaches : [30])));
  };

  // Fights monsters of `mobId` here until `enough()`; returns how many swings it took.
  async function fight(mobId, enough, secs = 90) {
    const t0 = performance.now();
    let swings = 0;
    let misses = 0;
    const sensed = new Set();
    while (!enough() && performance.now() - t0 < secs * 1000 && !opts.stop) {
      if (w().scene) {
        await watchScene();
        continue;
      }
      if (w().dead) {
        await sleep(500);
        respawn(w());
        return { swings, died: true };
      }
      const c = w().char;
      const maxMp = w().stats?.maxMp ?? 50;
      if (hpLow()) await tap('Digit1');
      if (c.mp < maxMp * 0.2 && countItem(c.inventory, 'blue_potion')) await tap('Digit2');
      const b = w().body;
      const m = w().mobs.filter((x) => x.hp > 0 && (!mobId || x.def.id === mobId)).sort((a, d) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) * 2 - (Math.abs(d.x - b.x) + Math.abs(d.y - b.y) * 2))[0];
      if (!m) {
        await sleep(400);
        continue;
      }
      // Reading the room like a player reads the callouts: sap rising or a heart that only opens to
      // blows from above means up on a ledge (the nearest one within her reach of the target).
      const room = w().dungeon?.room;
      const highWanted = opts.walk && (m.heartOpen || ['rising', 'flooded'].includes(room?.flood?.state));
      const groundY = w().map.groundY;
      if (highWanted && b.y > groundY - 40) {
        const nav = navOf(w().map);
        const reach = stance() + 60;
        const ledge = nav.surfaces.filter((sf) => sf.yAt((sf.x1 + sf.x2) / 2) < groundY - 40 && sf.x2 > m.x - reach && sf.x1 < m.x + reach)
          .sort((p, q) => Math.abs((p.x1 + p.x2) / 2 - b.x) - Math.abs((q.x1 + q.x2) / 2 - b.x))[0];
        if (ledge) {
          const lx = Math.max(ledge.x1 + 12, Math.min(ledge.x2 - 12, m.x));
          if (!sensed.has(m.heartOpen ? 'heart' : 'sap')) {
            sensed.add(m.heartOpen ? 'heart' : 'sap');
            say(m.heartOpen ? 'heart open: up to a ledge to hit it from above' : 'sap rising: up to a ledge');
          }
          await navTo(lx, ledge.yAt(lx), 16, 10);
          continue;
        }
      }
      const dx = m.x - b.x;
      const dir = Math.sign(dx || b.facing || 1);
      const range = opts.walk ? stance() : 36;
      // Another floor: go there (rope, ledge), and come at it from the side.
      // (A flyer hovers over its ledge: standing on that ledge is the same floor.)
      const nav = navOf(w().map);
      const theirs = surfaceBelow(nav, m.x, m.y);
      const mine = surfaceOf(nav, b);
      if (Math.abs(m.y - b.y) > 60 && mine !== theirs && !highWanted) {
        const sf = nav.surfaces[theirs];
        const tx = sf ? Math.max(sf.x1 + 12, Math.min(sf.x2 - 12, m.x - dir * Math.min(range, 60))) : m.x;
        const ok = await navTo(tx, sf ? sf.yAt(tx) : m.y, 20, 15);
        if (!ok) misses += 1;
        if (misses > 3) {
          say(`can't get up to the ${m.def.name}s here`);
          break;
        }
        continue;
      }
      if (Math.abs(dx) > range) {
        key(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true);
        await sleep(Math.min(200, (Math.abs(dx) - range + 10) * 2));
        release();
        continue;
      }
      // Too close for a caster: a step back first (not into a wall or off a ledge).
      if (opts.walk && range > 60 && Math.abs(dx) < 24 && c.mp > maxMp * 0.3) {
        key(dx > 0 ? 'ArrowLeft' : 'ArrowRight', true);
        await sleep(120);
        release();
      }
      if ((dx > 0) !== (b.facing > 0)) {
        key(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true);
        await sleep(40);
        release();
      }
      const nearby = w().mobs.filter((x) => x.hp > 0 && Math.abs(x.x - b.x) < 160 && Math.abs(x.y - b.y) < 80).length;
      if (opts.walk) await keepBuffs(nearby);
      const pick = opts.walk ? pickAttack(dir) : null;
      if (pick) await cast(pick.id);
      else await tap('KeyZ', 110);
      swings++;
      await sleep(pick ? 60 : 180);
      // Pick up what's dropped nearby.
      if ((w().drops ?? []).some((d) => Math.abs(d.x - w().body.x) < 50)) await tap('KeyX', 60);
    }
    return { swings };
  }
  const report = { log: [], done: [], failed: [], level: 0 };
  const say = (s) => {
    report.log.push(`${(w()?.now ?? 0).toFixed(0)}s L${w()?.char.level} ${s}`);
    if (report.log.length > 300) report.log.shift();
  };

  // A dungeon the way a player does it: to the gate, talk to the warden, Enter, Find group & go;
  // then each room: clear it with the group, through the door that opens, on to the boss and out.
  const dungeonOf = (mobId) => Object.values(DUNGEONS).find((d) => d.rooms?.some((r) => MAPS[r]?.spawns?.some((x) => x.mob === mobId)));
  async function dungeonRun(d) {
    const t0 = performance.now();
    if (!w().dungeon) {
      if (!(await openTalk(d.warden))) return say(`couldn't reach ${d.warden} at the ${d.name} gate`), false;
      ui().npc.dungeon = true; // (her pick of "Enter ${d.name}")
      await sleep(1500);
      const why = startRun(w(), d.id); // (her click on "Find group & go")
      // (The button closes the talk itself.)
      ui().npc = null;
      ui().windows.npc.open = false;
      if (why) return say(`${d.name}: ${why}`), false;
      await sleep(1500);
    }
    say(`entered ${d.name} with ${(w().dungeon?.party ?? w().party?.members ?? []).length || 'a'} group`);
    const rooms = [];
    const taskSeen = new Set();
    let tries = 0;
    while (w().dungeon && performance.now() - t0 < 12 * 60000 && !opts.stop) {
      await getUp();
      if (w().scene) await watchScene();
      const here = w().map;
      if (!rooms.includes(here.id)) rooms.push(here.id);
      const alive = () => w().mobs.some((m) => m.hp > 0);
      if (alive()) {
        await fight(null, () => !alive(), 60);
        continue;
      }
      // The room's own goal (light the glowcaps, free the cages...): read off the tracker, then the
      // nearest one not done, stand at it and hold Up till it's done.
      const task = taskProgress(w());
      // (Keys lie on the floor: walk over them.)
      const key1 = task && task.have < task.need && (w().dungeon.room.keys ?? []).filter((k) => !k.got).sort((a, c) => Math.abs(a.x - w().body.x) - Math.abs(c.x - w().body.x))[0];
      if (key1) {
        if (!taskSeen.has(here.id)) {
          taskSeen.add(here.id);
          say(`${here.name}: the room wants "${task.label}"`);
        }
        await navTo(key1.x, key1.y, 3, 25);
        await sleep(300);
        if (!key1.got && ++tries > 8) {
          say(`${here.name}: couldn't pick up the key at x ${Math.round(key1.x)}`);
          break;
        }
        continue;
      }
      if (task && task.have < task.need) {
        const objs = (w().dungeon.room.objects ?? []).filter((o) => !o.done);
        const b = w().body;
        const o = objs.sort((a, c) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) - (Math.abs(c.x - b.x) + Math.abs(c.y - b.y)))[0];
        if (!o) {
          say(`${here.name}: "${task.label}" ${task.have}/${task.need}, but nothing left to work on`);
          break;
        }
        if (!taskSeen.has(here.id)) {
          taskSeen.add(here.id);
          say(`${here.name}: the room wants "${task.label}"`);
        }
        await navTo(o.x, o.y, 8, 25);
        key('ArrowUp', true);
        const t1 = performance.now();
        while (!o.done && performance.now() - t1 < 6000) await sleep(100);
        key('ArrowUp', false);
        if (!o.done) {
          tries += 1;
          if (tries > 8) {
            say(`${here.name}: couldn't work the ${o.kind} at x ${Math.round(o.x)}`);
            break;
          }
        }
        continue;
      }
      // Cleared: the door to the next room (or the exit after the boss).
      const next = d.rooms[d.rooms.indexOf(here.id) + 1];
      const door = here.portals.find((p) => (next ? p.to === next : p.id === 'out' && p.sealed)) ?? here.portals.find((p) => p.sealed);
      if (!door) {
        say(`${here.name}: cleared, but no door onward`);
        break;
      }
      await sleep(1200);
      await navTo(door.x, door.y ?? here.groundY, 10, 30);
      for (let k = 0; k < 4 && w().map.id === here.id; k++) await tap('ArrowUp', 140), await sleep(500);
      if (w().map.id === here.id) {
        say(`${here.name}: the door to ${next ?? 'the exit'} didn't open after clearing`);
        break;
      }
      say(`${here.name} cleared (${((performance.now() - t0) / 60000).toFixed(1)} real min in)`);
    }
    habits();
    say(`${d.name}: ${w().dungeon ? 'stopped inside' : 'out'} after ${rooms.length} rooms, ${((performance.now() - t0) / 60000).toFixed(1)} real min`);
    return !w().dungeon;
  }

  async function autoQuest(id) {
    const q = QUESTS[id];
    const c = w().char;
    const began = w().now;
    if (questState(c, id) === 'available') {
      if (!(await openTalk(q.giver))) return say(`${id}: couldn't talk to ${q.giver}`), false;
      const words = await questPage(q.giver, id);
      if (questState(c, id) === 'available') {
        say(`Enter on ${q.name} didn't take it; took it by hand`);
        acceptQuest(c, id);
      }
      read.push({ id, name: q.name, words });
      say(`took ${q.name}`);
      await closeTalk();
    }
    if (questState(c, id) === 'locked' || questState(c, id) === 'done') return false;
    for (const [i, o] of q.objectives.entries()) {
      const left = () => objectiveProgress(c, id)[i];
      if (left().have >= left().count) continue;
      if (o.type === 'kill' || o.type === 'collect') {
        const mobId = o.type === 'kill' ? o.mob : itemSources(o.item).find((m) => mapsWith(m).length);
        // (The nearest place they live, as a player would pick: fewest doors from here.)
        const hops = (m) => (m === w().map.id ? 0 : road(w().map.id, m)?.length ?? 99);
        // (From the notebook: skip places it keeps fainting in, and favour the fastest spot it found,
        // as long as it isn't miles away.)
        const rate = (m) => book.hunts[`${mobId}@${m}`]?.perMin ?? null;
        const best = Math.max(0, ...mapsWith(mobId ?? '').map((m) => rate(m) ?? 0));
        const cost = (m) => hops(m) * 1.5 + (scary(m) >= 2 ? 50 : 0) + (rate(m) != null && best ? (1 - rate(m) / best) * 3 : 0);
        const place = mobId && mapsWith(mobId).sort((a, b) => cost(a) - cost(b))[0];
        if (!place) {
          const d = opts.walk && dungeonOf(mobId ?? o.mob);
          if (d) {
            await dungeonRun(d);
            continue;
          }
          say(`${id}: nowhere to find ${o.mob ?? o.item}`);
          continue;
        }
        await go(place);
        const had = left().have;
        const t0 = w().now;
        const r = await fight(mobId, () => left().have >= left().count);
        const mins = (w().now - t0) / 60;
        if (mins > 0.2 && !r.died) {
          const k = `${mobId}@${place}`;
          const perMin = (left().have - had) / mins;
          const old = book.hunts[k];
          book.hunts[k] = { perMin: old ? old.perMin * 0.5 + perMin * 0.5 : perMin, runs: (old?.runs ?? 0) + 1 };
          keepBook();
        }
        say(`${o.type} ${o.mob ?? o.item} ${left().have}/${left().count} in ${place} (${r.swings} swings${r.died ? ', fainted' : ''})`);
      } else if (o.type === 'talk' || o.type === 'deliver') {
        await openTalk(o.npc);
        await sleep(600);
        await watchScene();
        if (left().have < left().count) {
          say(`talking to ${o.npc} didn't count for ${q.name}`);
          noteTalk(c, o.npc);
        }
        await closeTalk();
      } else if (o.type === 'visit') {
        await go(o.map);
        // (Up high: climbs to the nearest ledge above that height, and the game notices on its own.)
        if (o.above != null) {
          const nav = navOf(w().map);
          const b = w().body;
          const high = nav.surfaces.filter((sf) => sf.yAt((sf.x1 + sf.x2) / 2) < o.above - 2).sort((m, n) => Math.abs((m.x1 + m.x2) / 2 - b.x) - Math.abs((n.x1 + n.x2) / 2 - b.x))[0];
          if (high) await navTo((high.x1 + high.x2) / 2, high.yAt((high.x1 + high.x2) / 2), 20, 60);
          await sleep(1200);
        } else await sleep(800);
        if (left().have < left().count) {
          say(`being at ${MAPS[o.map].name}${o.above != null ? ` above ${o.above}` : ''} didn't count for ${q.name}`);
          noteVisit(c, o.map, { y: (o.above ?? 0) - 1 });
        }
      }
    }
    if (questState(c, id) === 'ready') {
      await openTalk(q.giver);
      const before = questState(c, id);
      await questPage(q.giver, id);
      let r = questState(c, id) === 'done';
      if (!r && before === 'ready') {
        say(`Enter on ${q.name} didn't hand it in; by hand`);
        r = Boolean(completeQuest(c, id));
      }
      if (r && ui().npc?.quest && questState(c, ui().npc.quest) === 'available') {
        const next = ui().npc.quest;
        read.push({ id: next, name: QUESTS[next].name, words: await questPage(q.giver, next) });
        say(`took the next one, ${QUESTS[next].name}`);
      }
      await closeTalk();
      say(r ? `handed in ${q.name} (${((w().now - began) / 60).toFixed(1)} game min)` : `could not hand in ${q.name}`);
      if (c.ap > 0) autoAssignAp(c);
      return Boolean(r);
    }
    say(`${q.name} not finished: ${JSON.stringify(objectiveProgress(c, id).map((o) => `${o.have}/${o.count}`))}`);
    return false;
  }

  Object.assign(t, {
    autoQuest,
    dungeonRun: (id = 'hollow') => dungeonRun(DUNGEONS[id]),
    playReport: () => ({ ...report, trip, stuck: stuckLog.slice(-20), faints, notebook: book, read: read.length, gold: w()?.char.gold, level: w()?.char.level, job: w()?.char.job, map: w()?.map.id, log: report.log.slice(-40) }),
    walkTo,
    // Stops autoPlay where it is (after its current step), so a newer kit can carry on.
    stopPlay: () => {
      opts.stop = true;
      release();
    },
    async autoPlay(target = 5, family = null, { walk = false } = {}) {
      opts.walk = walk;
      const c = w().char;
      opts.stop = false;
      for (let round = 0; round < 80 && c.level < target && !opts.stop; round++) {
        await getUp();
        // The first job, at 5.
        if (family && c.job === 'novice') {
          const job = nextJobs('novice', c.level).find((j) => j.family === family);
          const teacher = job && Object.values(NPCS).find((n) => n.jobs?.includes?.(job.id) || n.family === family);
          if (job && opts.walk && teacher) await talkTo(teacher.id);
          if (job && advanceJob(c, job.id)) {
            const wpn = giveStarterWeapon(c, job.id);
            say(`became a ${JOBS[job.id].name}${teacher ? ` at ${teacher.name}'s` : ''}${wpn ? `, got ${ITEMS[wpn].name}` : ''}`);
          }
        }
        if (opts.walk) {
          habits();
          shopping();
        }
        const open = Object.values(QUESTS).filter((q) => !q.daily && questState(c, q.id) !== 'done' && questState(c, q.id) !== 'locked' && !report.failed.includes(q.id)).sort((a, b) => a.minLevel - b.minLevel);
        if (!open.length) {
          say('no quest open');
          break;
        }
        // (Like a player: what's open at your level, nearest giver first; nothing that needs a rod.)
        const canDo = (qq) => qq.objectives.every((o) => o.type !== 'catch' && (o.type !== 'collect' || itemSources(o.item).some((m) => mapsWith(m).length)));
        const near = (qq) => { const m = npcMap(qq.giver); return m === w().map.id ? 0 : road(w().map.id, m)?.length ?? 20; };
        const ready = open.filter((qq) => qq.minLevel <= c.level && canDo(qq)).sort((a, b) => near(a) - near(b) || a.minLevel - b.minLevel);
        const q = ready[0] ?? open.filter(canDo)[0];
        if (!q) {
          say('nothing left I can do');
          break;
        }
        const ok = await autoQuest(q.id);
        (ok ? report.done : report.failed).push(q.id);
      }
      release();
      return this.playReport();
    },
  });
}
