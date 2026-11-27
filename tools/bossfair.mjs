// Are the story's trial bosses fair for a normal player? (2026-11-21, before 1.0.) For each trial
// boss and each job family: a hero at the quest's level and job, in that level's tier of the gear
// ladder (weapon and armour), every skill learned, a bag of the shop's potions drunk at half HP (the
// Options' auto potion), fighting with a player's reactions: each warning zone noticed a moment after
// it appears, then walked out of, jumped (a low sweep, a floor slam) or stepped clear of. Reports
// win / faint / out of time, how long it took, potions used and the lowest HP.
//
// Usage: node tools/bossfair.mjs [boss ...] [--family warrior|mage|thief|archer] [--react 0.3]
const S = new URL('../src/', import.meta.url).href;
const { createWorld, updateWorld, loadMap, useItem } = await import(S + 'world/world.js');
const { createCharacter, gainExp, advanceJob, autoAssignAp } = await import(S + 'core/character.js');
const { expToNext } = await import(S + 'core/exp.js');
const { makeEquip } = await import(S + 'core/items.js');
const { addItem, countItem } = await import(S + 'core/inventory.js');
const { computeStats } = await import(S + 'core/stats.js');
const { cast, castBlocker } = await import(S + 'world/combat.js');
const { TRIALS } = await import(S + 'data/story.js');
const { QUESTS } = await import(S + 'data/quests.js');
const { MAPS } = await import(S + 'data/maps.js');
const { MOBS } = await import(S + 'data/mobs.js');
const { JOBS } = await import(S + 'data/jobs.js');
const { SKILLS } = await import(S + 'data/skills.js');
const { ITEMS, bestWeaponId } = await import(S + 'data/items.js');

const args = process.argv.slice(2);
const flag = (name, def) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : def; };
const REACT = Number(flag('--react', 0.3));
const only = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));
const FAMILIES = { warrior: ['warrior', 'tempest', 'sword'], mage: ['tidemage', 'maelstrom', 'staff'], thief: ['moonmoth', 'eclipse', 'dagger'], archer: ['sunfeather', 'phoenix', 'bow'] };
const families = flag('--family', null) ? [flag('--family')] : Object.keys(FAMILIES);
const TIERS = [[50, 'regalia'], [40, 'dreamsilk'], [30, 'starglass'], [20, 'tidepearl'], [10, 'rootwood'], [5, 'sprout']];
const DT = 1 / 60;
let seed = 7;
Math.random = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

const skillKind = (id) => {
  const s = SKILLS[id];
  if (!s || s.job === 'novice' || s.type === 'passive' || s.type === 'revive' || s.type === 'blink' || s.movement) return null;
  return s.type === 'buff' ? 'buff' : s.fullGauge ? 'finisher' : s.type === 'heal' ? null : 'attack';
};

function hero(family, level, trialQuest) {
  const [job1, job2, weapon1] = FAMILIES[family];
  const c = createCharacter('Fair', {});
  while (c.level < level) gainExp(c, expToNext(c.level) - c.exp);
  for (const q of Object.values(QUESTS)) if (q.minLevel < level && q.id !== trialQuest && (!q.family || q.family === JOBS[job1].family)) c.quests[q.id] = { state: 'done', kills: {} };
  advanceJob(c, job1);
  if (level >= 30) {
    c.quests[`${JOBS[job1].family}_trial`] = { state: 'done', kills: {} };
    advanceJob(c, job2);
  }
  const type = family === 'archer' && level >= 30 ? 'crossbow' : weapon1;
  c.equipment.weapon = makeEquip(bestWeaponId(type, level), { variance: 0 });
  const tier = TIERS.find(([l]) => l <= level)?.[1];
  const fam = JOBS[job1].family;
  for (const slot of ['hat', 'top', 'bottom', 'shoes', 'gloves', 'cape']) {
    const id = `${tier}_${fam}_${slot}`;
    if (tier && ITEMS[id]) c.equipment[slot] = makeEquip(id, { variance: 0 });
  }
  const chain = [];
  for (let j = JOBS[c.job]; j; j = JOBS[j.parent]) chain.push(j.id);
  for (const [id, s] of Object.entries(SKILLS)) if (chain.includes(s.job) && (s.reqLevel ?? 0) <= c.level) c.skills[id] = s.maxLevel;
  autoAssignAp(c);
  const hp = level < 10 ? 'red_potion' : level < 20 ? 'orange_potion' : 'white_potion';
  addItem(c.inventory, hp, 40);
  addItem(c.inventory, 'blue_potion', 30);
  c.quests[trialQuest] = { state: 'active', kills: {} };
  return { c, hp, ranged: ['bow', 'crossbow', 'staff', 'wand'].includes(type) };
}

// Whether standing (or being in the air) as now, zone z would catch you when it goes off.
function catches(z, b, map) {
  // (a column across the floor, Madame Reveille's: walk out of it like a lane)
  if (z.kind === 'mark' && z.col) return Math.abs(b.x - z.x) < z.w / 2 + 10;
  // (the whole room, or a marker on you: nothing to walk out of)
  if (z.kind === 'raid' || z.kind === 'mark') return false;
  if (z.kind === 'circle') return Math.abs(b.x - z.x) < z.w / 2 + 10;
  if (z.kind === 'floor') return true;
  if (z.kind === 'pillar') return Math.abs(b.x - z.x) < z.w / 2 + 8;
  return b.x >= z.x - 10 && b.x <= z.x + z.w + 10;
}
const jumpable = (z) => z.kind === 'floor' || z.kind === 'circle' || (z.kind === 'lane' && z.low);
// The nearest spot along the floor that none of the zones about to go off would catch.
function safeX(zones, b, map) {
  const marks = [b.x];
  for (const z of zones) {
    if (z.kind === 'floor') continue;
    const lo = z.kind === 'lane' ? z.x - 22 : z.x - z.w / 2 - 22;
    const hi = z.kind === 'lane' ? z.x + z.w + 22 : z.x + z.w / 2 + 22;
    marks.push(lo, hi);
  }
  const ok = (x) => x > 30 && x < map.width - 30 && zones.every((z) => z.kind === 'floor' || !catches(z, { x }, map));
  return marks.filter(ok).sort((p, q) => Math.abs(p - b.x) - Math.abs(q - b.x))[0] ?? null;
}

function fight(family, trialId) {
  const t = TRIALS[trialId];
  const quest = QUESTS[t.quest];
  const level = Math.max(quest.minLevel, 5);
  const { c, hp, ranged } = hero(family, level, t.quest);
  const w = createWorld(c);
  w.log = () => {};
  const mapId = Object.values(MAPS).find((m) => m.trial === trialId).id;
  loadMap(w, mapId, MAPS[mapId].portals[0].id);
  w.scene = null;
  const boss = w.mobs.find((m) => m.def.id === t.boss);
  if (!boss) return { family, boss: t.boss, level, result: 'NO BOSS' };
  const max = () => computeStats(c).maxHp;
  let lowest = 1, potions = 0, secs = 0, ai = 0;
  const seen = new Map();
  const tried = {};
  const before = countItem(c.inventory, hp);
  while (secs < 360) {
    const b = w.body;
    const held = new Set(), pressed = new Set();
    if (w.scene) w.scene = null;
    for (const z of w.zones ?? []) if (!seen.has(z)) seen.set(z, w.now);
    // What's about to go off that you've noticed, and would catch you here.
    // (a marker still following you isn't dodged until it stops; a stack's spot is where you go, not a threat;
    // only what lands next is dealt with, so two waves one after the other are taken one at a time)
    const noticed = (w.zones ?? []).filter((z) => !z.hit && w.now - seen.get(z) >= REACT && !z.stack && !(z.follow && z.t < z.warn - (z.lock ?? 0.6)));
    const first = noticed.length ? Math.min(...noticed.map((z) => z.warn - z.t)) : 0;
    const live = noticed.filter((z) => z.warn - z.t <= first + 0.5);
    const threats = live.filter((z) => catches(z, b, w.map));
    const soon = threats.length ? Math.min(...threats.map((z) => z.warn - z.t)) : Infinity;
    let busy = false;
    if (threats.length) {
      const x = safeX(live, b, w.map);
      const speed = computeStats(c).speed ?? 140;
      const walkable = threats.filter((z) => z.kind !== 'floor');
      if (walkable.length && x !== null && Math.abs(x - b.x) / Math.max(60, speed) < soon + 0.05) {
        if (Math.abs(x - b.x) > 4) held.add(x > b.x ? 'ArrowRight' : 'ArrowLeft');
        busy = true;
      }
      if (threats.every(jumpable) && soon < 0.22 && b.onGround) {
        held.add('Space');
        pressed.add('Space');
        busy = true;
      }
      if (!busy && x !== null && Math.abs(x - b.x) > 4) {
        held.add(x > b.x ? 'ArrowRight' : 'ArrowLeft');
        busy = true;
      }
    }
    if (!busy && boss.hp > 0) {
      const dx = boss.x - b.x;
      const want = ranged ? 170 : 55;
      if (Math.abs(dx) > want) held.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
      else {
        if (Math.sign(dx) !== (b.facing || 1) && Math.abs(dx) > 6) held.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
        b.facing = Math.sign(dx) || b.facing;
        held.add('KeyZ');
        const skills = Object.keys(c.skills).filter(skillKind);
        const ready = (id) => !castBlocker(w, id) && !(tried[id] > w.now);
        const buffs = skills.filter((id) => skillKind(id) === 'buff');
        const att = skills.filter((id) => skillKind(id) !== 'buff');
        const pick = buffs.find((id) => !(c.buffs[id]?.until > w.now) && ready(id)) ?? att[ai % Math.max(1, att.length)];
        if (pick && ready(pick)) {
          const ok = cast(w, pick).ok;
          if (!ok) tried[pick] = w.now + 2;
          else if (buffs.includes(pick)) tried[pick] = w.now + 15;
          ai++;
        }
      }
    }
    // Auto potion at half HP, as the Options set it; mana when low.
    if (c.hp < max() * 0.5 && w.now >= (w.itemReadyAt ?? 0) && countItem(c.inventory, hp) > 0) useItem(w, hp);
    if (c.mp < computeStats(c).maxMp * 0.2 && w.now >= (w.itemReadyAt ?? 0) && countItem(c.inventory, 'blue_potion') > 0) useItem(w, 'blue_potion');
    updateWorld(w, DT, { held, pressed, locked: false });
    secs += DT;
    lowest = Math.min(lowest, c.hp / max());
    if (w.dead || c.hp <= 0) return { family, boss: t.boss, level, result: 'FAINTED', secs, potions: before - countItem(c.inventory, hp), lowest: 0, left: Math.round((100 * boss.hp) / boss.maxHp) };
    if (boss.hp <= 0) return { family, boss: t.boss, level, result: 'won', secs, potions: before - countItem(c.inventory, hp), lowest };
  }
  return { family, boss: t.boss, level, result: 'OUT OF TIME', secs, potions: before - countItem(c.inventory, hp), lowest, left: Math.round((100 * boss.hp) / boss.maxHp) };
}

const trials = Object.keys(TRIALS).filter((id) => !only.length || only.includes(id) || only.includes(TRIALS[id].boss));
for (const id of trials) {
  for (const f of families) {
    const r = fight(f, id);
    const name = MOBS[r.boss]?.name ?? r.boss;
    console.log(`${name.padEnd(30)} lv ${String(r.level).padStart(2)}  ${f.padEnd(8)} ${r.result.padEnd(11)} ${r.secs ? `${(r.secs / 60).toFixed(1)} min` : ''}  potions ${r.potions ?? '-'}  lowest HP ${Math.round((r.lowest ?? 0) * 100)}%${r.left != null ? `  boss left ${r.left}%` : ''}`);
  }
}
