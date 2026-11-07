// One hero plays the real game (world/world.js) from level 1 to the ending: every story and side
// quest open to her, in level order, story first; real hunting for kill and collect objectives
// (real monsters, real drops, picked up with auto-loot), going to every map she has to visit or
// talk on, a group run with the dungeon autopilot for every dungeon boss, job advancement at 5.
// It logs whatever goes wrong: ERROR (the game threw), BUG (a quest that can't be taken or handed
// in, a monster that spawns nowhere, falling out of a map) and STALL (a hunt or a dungeon that did
// not finish in its time: often the autopilot, worth a look).
// What it does not play: fishing (catches are counted), grinding between quests (when nothing is
// open it is granted the EXP to the next quest's level), shopping (it wears its job's gear for its
// level, sells junk and old gear), the second job (that happens at the trainer), menus and dialogue.
//
// Usage: node tools/autoplay.mjs [first job] [second job]     e.g. node tools/autoplay.mjs thief kitsune
const S = new URL('../src/', import.meta.url).href;
const { createWorld, updateWorld, loadMap } = await import(S + 'world/world.js');
const { createCharacter, gainExp, advanceJob, autoAssignAp } = await import(S + 'core/character.js');
const { expToNext } = await import(S + 'core/exp.js');
const { makeEquip } = await import(S + 'core/items.js');
const { addItem, countItem } = await import(S + 'core/inventory.js');
const { computeStats } = await import(S + 'core/stats.js');
const Q = await import(S + 'core/quests.js');
const { cast, castBlocker } = await import(S + 'world/combat.js');
const { navOf, surfaceOf, surfaceBelow, findPath, followPath } = await import(S + 'world/nav.js');
const { createBots, updateBots } = await import(S + 'world/bots.js');
const { startRun, groupOf, isUp } = await import(S + 'world/dungeon.js');
const { QUESTS } = await import(S + 'data/quests.js');
const { MAPS } = await import(S + 'data/maps.js');
const { MOBS } = await import(S + 'data/mobs.js');
const { NPCS } = await import(S + 'data/npcs.js');
const { JOBS } = await import(S + 'data/jobs.js');
const { SKILLS } = await import(S + 'data/skills.js');
const { DUNGEONS } = await import(S + 'data/dungeons.js');
const { sellJunk } = await import(S + 'ui/shop.js');
const { GEAR_LEVELS } = await import(S + 'data/items.js');

const JOB1 = process.argv[2] ?? 'archer';
const JOB2 = process.argv[3] ?? 'beastmaster';
const WEAPON = { warrior: 'sword', archer: 'bow', thief: 'dagger', spiritmage: 'wand' };
let seed = 11;
Math.random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const DT = 1 / 60;
const log = [];
const seenErr = new Map();
const note = (kind, text) => { log.push({ kind, level: c.level, text }); console.log(`[lv ${c.level}] ${kind}: ${text}`); };
const err = (where, e) => {
  const key = e.message + (e.stack.split('\n')[1] ?? '');
  if (seenErr.has(key)) { seenErr.set(key, seenErr.get(key) + 1); return; }
  seenErr.set(key, 1);
  note('ERROR', `${where}: ${e.message}  @ ${(e.stack.split('\n')[1] ?? '').trim().replace(/.*src\//, 'src/')}`);
};

const c = createCharacter('Autoplay', {});
const w = createWorld(c);
w.log = () => {};
w.settings = { ...(w.settings ?? {}), autoLoot: true };
try { w.bots = createBots(w, Math.random, { clock: () => new Date(2026, 9, 28, 20, 0) }); } catch (e) { err('bots', e); w.bots = []; }
let simSecs = 0;
let skippedExp = 0;
let deaths = 0;
const skillKind = (id) => {
  const s = SKILLS[id];
  if (!s || s.job === 'novice' || s.type === 'passive' || s.type === 'revive' || s.type === 'blink' || s.movement) return null;
  return s.type === 'buff' ? 'buff' : s.fullGauge ? 'finisher' : s.type === 'heal' ? null : 'attack';
};
// Gear and skills as a player keeps them up: her job's gear at the best level she can wear, every
// skill of her line learned.
function kit() {
  const fam = JOBS[c.job].family;
  if (fam === 'beginner') return;
  const gl = Math.max(...GEAR_LEVELS.filter((l) => l <= c.level));
  if (c.kitLevel !== gl) {
    c.kitLevel = gl;
    try {
      c.equipment.weapon = makeEquip(`${WEAPON[JOBS[JOB1].family === fam ? JOB1 : JOB1]}_${gl}`, { variance: 0 });
      for (const slot of ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape']) c.equipment[slot] = makeEquip(`${fam}_${slot}_${gl}`, { variance: 0 });
    } catch (e) { err(`gear at ${gl}`, e); }
  }
  const chain = [];
  for (let j = JOBS[c.job]; j; j = JOBS[j.parent]) chain.push(j.id);
  for (const [id, s] of Object.entries(SKILLS)) if (chain.includes(s.job) && !c.skills[id] && (s.reqLevel ?? 0) <= c.level) c.skills[id] = s.maxLevel;
  autoAssignAp(c);
}
// The bag as a player keeps it: junk sold at a shop, old gear sold.
const tidy = () => { try { sellJunk(c); c.inventory.equip = []; } catch (e) { err('selling junk', e); } };
const bagNote = () => Object.entries(c.inventory).filter(([, v]) => Array.isArray(v)).map(([k, v]) => `${k} ${v.length}/32`).join(', ');
const heal = () => { const s = computeStats(c); c.hp = s.maxHp; c.mp = s.maxMp; };

function go(mapId, portal) {
  try {
    const m = MAPS[mapId];
    const pid = portal ?? ((m.portals ?? []).find((p) => p.id === 'start') ? 'start' : m.portals?.[0]?.id);
    loadMap(w, mapId, pid);
    w.scene = null;
  } catch (e) { err(`going to ${mapId}`, e); }
}
function step(held = new Set(), pressed = new Set()) {
  if (w.scene) w.scene = null;
  try { updateWorld(w, DT, { held, pressed, locked: false }); } catch (e) { err(`playing ${w.map?.id}`, e); }
  try { if (w.bots?.length) updateBots(w.bots, w, DT); } catch (e) { err(`bots on ${w.map?.id}`, e); }
  simSecs += DT;
  if (w.dead || c.hp <= 0) { deaths++; w.dead = false; heal(); }
  const st = computeStats(c);
  if (c.hp < st.maxHp * 0.35) c.hp = st.maxHp; // (a potion)
  if (c.mp < st.maxMp * 0.2) c.mp = st.maxMp;
  if (w.body && w.body.y > (w.map.height ?? 3000) + 400) { note('BUG', `fell out of the bottom of ${w.map.id}`); go(w.map.id); }
}

// Hunts the current map until `done()` (or `secs` of game time): walks, climbs and fights the
// nearest wanted monster, with her skills.
function huntHere(want, done, secs) {
  const nav = navOf(w.map);
  const tried = {};
  let target = null, path = null, stuck = 0, lastX = w.body.x, t = 0, ai = 0;
  while (t < secs && !done()) {
    const b = w.body;
    const held = new Set();
    const pressed = new Set();
    const live = w.mobs.filter((m) => m.hp > 0 && (!want || want(m)));
    if (!target || target.hp <= 0 || stuck > 4) {
      const cost = (m) => Math.abs(m.x - b.x) + Math.abs(m.y - b.y) * 4;
      target = live.sort((p, q) => cost(p) - cost(q))[stuck > 4 ? Math.min(1, live.length - 1) : 0] ?? null;
      path = null;
      stuck = 0;
    }
    // Walk over loot lying close by on her floor first (auto-loot picks it up).
    const loot = (w.drops ?? []).filter((d) => Math.abs(d.y - b.y) < 24 && Math.abs(d.x - b.x) < 260).sort((p, q) => Math.abs(p.x - b.x) - Math.abs(q.x - b.x))[0];
    if (loot && Math.abs(loot.x - b.x) > 8) held.add(loot.x > b.x ? 'ArrowRight' : 'ArrowLeft');
    else if (target) {
      const same = Math.abs(target.y - b.y) < (target.def.fly ? 70 : 12) && !b.rope;
      const dx = target.x - b.x;
      if (same && Math.abs(dx) < 70) {
        b.facing = Math.sign(dx) || b.facing;
        held.add('KeyZ');
        const skills = Object.keys(c.skills).filter(skillKind);
        const ready = (id) => { try { return !castBlocker(w, id) && !(tried[id] > w.now); } catch (e) { err(`castBlocker ${id}`, e); return false; } };
        const buffs = skills.filter((id) => skillKind(id) === 'buff');
        const fin = skills.filter((id) => skillKind(id) === 'finisher');
        const att = skills.filter((id) => skillKind(id) === 'attack');
        const pick = buffs.find((id) => !(c.buffs[id]?.until > w.now) && ready(id)) ?? fin.find(ready) ?? att[ai % Math.max(1, att.length)];
        if (pick && ready(pick)) {
          try { const ok = cast(w, pick).ok; if (!ok) tried[pick] = w.now + 2; if (att.includes(pick)) ai++; if (ok && buffs.includes(pick)) tried[pick] = w.now + 15; } catch (e) { err(`casting ${pick}`, e); tried[pick] = w.now + 60; }
        }
      } else {
        const here = surfaceOf(nav, b);
        if (here >= 0 && !path) path = findPath(nav, here, b.x, surfaceBelow(nav, target.x, target.y - 4), target.x);
        if (path) {
          const { intent, lost } = followPath(nav, b, path, target.x, 30);
          if (lost) path = null;
          for (const [k, key] of [['left', 'ArrowLeft'], ['right', 'ArrowRight'], ['up', 'ArrowUp'], ['down', 'ArrowDown'], ['jump', 'Space']]) if (intent[k]) held.add(key);
        } else {
          held.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
          if (b.rope) held.add(target.y > b.y ? 'ArrowDown' : 'ArrowUp');
        }
      }
    }
    // Pick up what dropped near her (the game picks up by walking over it).
    step(held, pressed);
    stuck = Math.abs(b.x - lastX) < 0.5 && !held.has('KeyZ') ? stuck + DT : 0;
    lastX = b.x;
    t += DT;
    if (Math.round(t * 60) % (60 * 120) === 0) tidy();
  }
  return done();
}

// The party autopilot from the dungeon tests, for a whole run.
function pilot() {
  const run = w.dungeon;
  const b = w.body;
  const held = new Set(), pressed = new Set();
  const goX = (x) => { if (Math.abs(x - b.x) > 6) held.add(x > b.x ? 'ArrowRight' : 'ArrowLeft'); };
  const nav = navOf(w.map);
  const goTo = (x, y) => {
    const here = surfaceOf(nav, b);
    if (here >= 0) { w.pilotPath = findPath(nav, here, b.x, surfaceBelow(nav, x, y - 4), x); if (!w.pilotPath) return goX(x); }
    else if (!w.pilotPath) { if (b.rope) held.add(y > b.y ? 'ArrowDown' : 'ArrowUp'); return goX(x); }
    const { intent, lost } = followPath(nav, b, w.pilotPath, x, 6);
    if (lost) w.pilotPath = null;
    for (const [k, key] of [['left', 'ArrowLeft'], ['right', 'ArrowRight'], ['up', 'ArrowUp'], ['down', 'ArrowDown'], ['jump', 'Space']]) if (intent[k]) held.add(key);
  };
  if (w.dead) return { held, pressed };
  const fights = w.mobs.filter((m) => m.hp > 0 && m.engaged);
  const danger = run.zones.find((z) => !z.hit && z.kind !== 'floor' && (z.kind === 'circle' ? Math.abs(b.x - z.x) < z.w / 2 + 8 : b.x >= z.x - 8 && b.x <= z.x + z.w + 8));
  if (run.zones.some((z) => !z.hit && z.kind === 'floor' && z.warn - z.t < 0.3) && b.onGround) held.add('Space');
  const room = run.room;
  if (danger) {
    const lo = danger.kind === 'circle' ? danger.x - danger.w / 2 - 20 : danger.x - 20;
    const hi = danger.kind === 'circle' ? danger.x + danger.w / 2 + 20 : danger.x + danger.w + 20;
    goX(Math.abs(b.x - lo) < Math.abs(b.x - hi) && lo > 30 ? lo : hi);
  } else if (fights.length) {
    const t = fights.reduce((a, m) => (Math.abs(m.x - b.x) + Math.abs(m.y - b.y) < Math.abs(a.x - b.x) + Math.abs(a.y - b.y) ? m : a));
    const spot = t.x + (Math.sign(b.x - t.x) || -1) * 150;
    if (Math.abs(t.y - b.y) > 4 || b.rope) goTo(spot, t.y);
    else if (Math.abs(b.x - spot) > 20) goX(spot);
    else { b.facing = Math.sign(t.x - b.x) || 1; held.add('KeyZ'); }
  } else if (room.cleared) {
    const door = w.map.portals.find((p) => p.sealed);
    if (door) { goTo(door.x, door.y); if (Math.abs(door.x - b.x) < 10 && Math.abs(door.y - b.y) < 4 && Math.round(w.now * 60) % 10 === 0) pressed.add('ArrowUp'); }
  } else {
    const key = room.keys.find((k) => !k.got);
    const asleep = w.mobs.filter((m) => m.hp > 0 && !m.engaged);
    const obj = room.objects.find((o) => !o.done && (o.kind !== 'clam' || room.bell.order[room.bell.next] === o.id) && (o.kind !== 'starlamp' || room.lamps.press.has(o.id)) && (o.kind !== 'dispenser' || (room.recipe.need[o.colour] ?? 0) > (room.recipe.have[o.colour] ?? 0)) && (o.kind !== 'cue' || room.cues.seq[room.cues.next] === o.id) && !asleep.some((m) => Math.abs(m.x - o.x) < 170 && Math.abs(m.y - o.y) < 60));
    if (key) goTo(key.x, key.y);
    else if (obj) { goTo(obj.x, obj.y); if (Math.abs(obj.x - b.x) < 8 && Math.abs(obj.y - b.y) < 4 && !w.channel && b.onGround && Math.abs(b.vx) < 1) pressed.add('ArrowUp'); }
    else if (asleep.length) {
      // (Nothing else to do: go and wake the nearest sleeper.)
      const t = asleep.reduce((p, m) => (Math.abs(m.x - b.x) + Math.abs(m.y - b.y) < Math.abs(p.x - b.x) + Math.abs(p.y - b.y) ? m : p));
      if (Math.abs(t.y - b.y) > 4 || Math.abs(t.x - b.x) > 140) goTo(t.x + (Math.sign(b.x - t.x) || -1) * 120, t.y);
      else { b.facing = Math.sign(t.x - b.x) || 1; held.add('KeyZ'); }
    } else { const tank = groupOf(w).find((g) => g.role === 'tank' && isUp(w, g)); if (tank) goTo(tank.body.x - 60, tank.body.y); }
  }
  return { held, pressed };
}
function runDungeon(id) {
  const d = DUNGEONS[id];
  go(d.gate);
  let why;
  try { w.bots = createBots(w, Math.random, { clock: () => new Date(2026, 9, 28, 20, 0) }); } catch (e) { err('bots for a run', e); }
  try { why = startRun(w, id); } catch (e) { err(`starting ${id}`, e); return false; }
  if (why) { note('BUG', `could not start ${d.name}: ${why}`); return false; }
  let t = 0;
  const seen = new Set();
  while (w.dungeon && t < 60 * 25) {
    seen.add(w.map.id);
    let input;
    try { input = pilot(); } catch (e) { err(`dungeon autopilot in ${w.map.id}`, e); input = { held: new Set(), pressed: new Set() }; }
    step(input.held, input.pressed);
    t += DT;
  }
  if (w.dungeon) {
    const r = w.dungeon.room;
    note('STALL', `${d.name}: the autopilot was still going after 25 game minutes in ${w.map.id} (room cleared: ${Boolean(r?.cleared)}, monsters up: ${w.mobs.filter((m) => m.hp > 0).length}, keys left: ${r?.keys?.filter((k) => !k.got).length ?? 0}, objects left: ${r?.objects?.filter((o) => !o.done).length ?? 0}); the dungeon tests' own autopilot stalls on some runs too`);
    try { w.dungeon = null; } catch {}
    go(d.gate);
    return false;
  }
  note('ok', `cleared ${d.name} in ${(t / 60).toFixed(1)} min (${seen.size} rooms)`);
  return true;
}

const where = {};
for (const m of Object.values(MAPS)) for (const s of [...(m.spawns ?? []), ...((m.zones ?? []).flatMap((z) => z.spawns ?? []))]) (where[s.mob ?? s.id ?? s] ??= new Set()).add(m.id);
const dungeonOf = (mapId) => Object.values(DUNGEONS).find((d) => d.rooms.includes(mapId));
const npcMap = (id) => Object.values(MAPS).find((m) => (m.npcs ?? []).some((n) => n.id === id));
const dropsFrom = (item) => Object.values(MOBS).filter((m) => (m.drops ?? []).some((d) => d.id === item));

function talkTo(npc) {
  const m = npcMap(npc);
  if (!m) { note('BUG', `NPC ${npc} stands on no map`); return; }
  go(m.id);
  const n = m.npcs.find((x) => x.id === npc);
  w.body.x = n.x;
  for (let i = 0; i < 10; i++) step();
  try { Q.noteTalk(c, npc); } catch (e) { err(`talking to ${npc}`, e); }
}

function doObjective(q, o) {
  if (o.type === 'kill') {
    const maps = [...(where[o.mob] ?? [])];
    const field = maps.find((id) => !dungeonOf(id));
    if (!field && maps.length) {
      const d = dungeonOf(maps[0]);
      if (!runDungeon(d.id)) for (let k = 0; k < o.count; k++) Q.recordKill(c, o.mob);
      return;
    }
    if (!field) { note('BUG', `${q.id}: ${o.mob} spawns nowhere`); return; }
    go(field);
    const have = () => (c.quests[q.id]?.kills?.[o.mob] ?? 0) >= o.count;
    let ok = huntHere((m) => m.def.id === o.mob, have, Math.min(1200, 120 + o.count * 25));
    if (!ok) {
      const alive = w.mobs.filter((m) => m.def.id === o.mob).length;
      note('STALL', `${q.id}: killed ${c.quests[q.id]?.kills?.[o.mob] ?? 0}/${o.count} ${MOBS[o.mob].name} on ${MAPS[field].name} in the time (${alive} on the map now)`);
      for (let k = 0; k < o.count; k++) Q.recordKill(c, o.mob);
    }
  } else if (o.type === 'collect') {
    const from = dropsFrom(o.item).filter((m) => where[m.id] && [...where[m.id]].some((id) => !dungeonOf(id)));
    const need = () => countItem(c.inventory, o.item) >= o.count;
    if (!from.length) { addItem(c.inventory, o.item, o.count - countItem(c.inventory, o.item)); note('skip', `${q.id}: ${o.item} comes from gathering, crafting or a shop (given)`); return; }
    const best = from.sort((a, b) => Math.abs(a.level - c.level) - Math.abs(b.level - c.level))[0];
    const field = [...where[best.id]].find((id) => !dungeonOf(id));
    go(field);
    const ids = new Set(from.map((m) => m.id));
    if (!huntHere((m) => ids.has(m.def.id), need, Math.min(1500, 200 + o.count * 40))) {
      note('STALL', `${q.id}: (bag: ${bagNote()}) only ${countItem(c.inventory, o.item)}/${o.count} ${o.item} from ${best.name} on ${MAPS[field].name} in ${Math.min(1500, 200 + o.count * 40)}s of hunting`);
      addItem(c.inventory, o.item, o.count - countItem(c.inventory, o.item));
    }
  } else if (o.type === 'talk' || o.type === 'deliver') talkTo(o.npc);
  else if (o.type === 'visit') {
    go(o.map);
    for (let i = 0; i < 30; i++) step();
    if (o.above != null) Q.noteVisit(c, o.map, { y: o.above - 1 });
    if (!c.quests[q.id]?.marks?.[q.objectives.indexOf(o)]) Q.noteVisit(c, o.map, { y: -1e9 });
  } else if (o.type === 'catch') {
    for (let k = 0; k < o.count; k++) Q.recordCatch(c, o.fish);
    note('skip', `${q.id}: fishing (${o.fish}) counted`);
  } else if (o.type === 'job') {
    const id = o.tier === 1 ? JOB1 : JOB2;
    if (!advanceJob(c, id)) note('BUG', `${q.id}: could not advance to ${id} at level ${c.level}`);
    else { note('ok', `became ${JOBS[id].name}`); kit(); heal(); }
  }
}

function doQuest(id) {
  const q = QUESTS[id];
  tidy();
  if (!Q.acceptQuest(c, id)) { note('BUG', `${id}: could not accept (state ${Q.questState(c, id)})`); return; }
  for (const o of q.objectives) {
    try { doObjective(q, o); } catch (e) { err(`${id} objective ${o.type}`, e); }
  }
  // Hand it in at the giver.
  if (q.giver) talkTo(q.giver);
  tidy();
  let r = null;
  try { r = Q.completeQuest(c, id); } catch (e) { err(`handing in ${id}`, e); }
  if (!r) note('BUG', `${id} (${q.name}): could not hand in: ${JSON.stringify(Q.objectiveProgress(c, id).filter((x) => x.have < x.count).map((x) => `${x.type} ${x.mob ?? x.item ?? x.npc ?? x.map ?? ''} ${x.have}/${x.count}`))} (bag: ${bagNote()})`);
  kit();
}

// ---------- The run ----------
go(c.mapId ?? 'meadow1');
kit();
heal();
const t0 = Date.now();
const fam = JOBS[JOB1].family;
while (c.level <= 50) {
  const open = Object.keys(QUESTS).filter((id) => !QUESTS[id].daily && Q.questState(c, id) === 'available' && (!QUESTS[id].family || QUESTS[id].family === fam));
  open.sort((a, b) => (QUESTS[b].story ? 1 : 0) - (QUESTS[a].story ? 1 : 0) || QUESTS[a].minLevel - QUESTS[b].minLevel);
  if (open.length) { doQuest(open[0]); continue; }
  // Nothing open: the next quest's level (skip the grind to it), or the end.
  const next = Object.values(QUESTS).filter((q) => !q.daily && Q.questState(c, q.id) === 'locked' && q.minLevel > c.level && (!q.family || q.family === fam)).sort((a, b) => a.minLevel - b.minLevel)[0];
  if (!next || c.level >= 50) break;
  const before = c.level;
  while (c.level < next.minLevel) { const e = expToNext(c.level) - c.exp; skippedExp += e; gainExp(c, e); }
  note('skip', `nothing open, levelled ${before} -> ${c.level} for ${next.name}`);
  kit();
  if (Date.now() - t0 > 40 * 60 * 1000) { note('STOP', 'out of real time'); break; }
}
const left = Object.values(QUESTS).filter((q) => !q.daily && Q.questState(c, q.id) !== 'done' && (!q.family || q.family === fam));
console.log('\n===== SUMMARY =====');
console.log(`job ${c.job}, level ${c.level}, ${Object.values(c.quests).filter((r) => r.state === 'done').length} quests done, ${deaths} deaths, ${(simSecs / 3600).toFixed(1)} h of game time, ${((Date.now() - t0) / 60000).toFixed(1)} min real`);
console.log(`left undone: ${left.map((q) => `${q.id} (${Q.questState(c, q.id)}, lv ${q.minLevel})`).join(', ') || 'none'}`);
console.log(`errors: ${[...seenErr.values()].reduce((a, b) => a + b, 0)} (${seenErr.size} distinct)`);
for (const k of ['ERROR', 'BUG', 'STALL']) { const l = log.filter((x) => x.kind === k); console.log(`${k}: ${l.length}`); for (const x of l) console.log(`  lv ${x.level}: ${x.text}`); }
