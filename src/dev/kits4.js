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
import { advanceJob, autoAssignAp } from '../core/character.js';
import { loadMap, respawn } from '../world/world.js';
import { groundAt } from '../world/physics.js';

export const KIT4_HELP = {
  autoQuest: "autoQuest(id): play one quest start to finish (take it, fight, gather, talk, hand in), with real key presses in fights",
  autoPlay: "autoPlay(level, family?): play open quests in level order until `level` (taking the first job of `family` at 5); playReport() while it runs",
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
  const go = async (mapId) => {
    if (w().map.id !== mapId) {
      loadMap(w(), mapId, 'start');
      await sleep(400);
    }
  };
  const to = async (x, tol = 10) => {
    const b = w().body;
    for (let i = 0; i < 80 && Math.abs(b.x - x) > tol; i++) {
      key(b.x < x ? 'ArrowRight' : 'ArrowLeft', true);
      await sleep(Math.min(250, Math.abs(b.x - x) * 2));
      release();
      // (Stuck behind a step: a hop.)
      if (i % 6 === 5) {
        key('Space', true);
        await sleep(160);
        key('Space', false);
      }
    }
  };
  const talkTo = async (npcId) => {
    const mapId = npcMap(npcId);
    if (!mapId) return false;
    await go(mapId);
    const n = w().map.npcs.find((x) => x.id === npcId);
    if (!n) return false;
    await to(n.x - 16, 14);
    if (Math.abs(w().body.x - n.x) > 60) t.pos(n.x - 16, groundAt(w().map, n.x));
    return true;
  };
  const hpLow = () => w().char.hp < (w().stats?.maxHp ?? 50) * 0.35;
  // Fights monsters of `mobId` here until `enough()`; returns how many swings it took.
  async function fight(mobId, enough, secs = 90) {
    const t0 = performance.now();
    let swings = 0;
    while (!enough() && performance.now() - t0 < secs * 1000) {
      if (w().dead) {
        await sleep(500);
        respawn(w());
        return { swings, died: true };
      }
      if (hpLow()) {
        key('Digit1', true);
        await sleep(60);
        key('Digit1', false);
      }
      const b = w().body;
      const m = w().mobs.filter((x) => x.hp > 0 && x.def.id === mobId).sort((a, c) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) - (Math.abs(c.x - b.x) + Math.abs(c.y - b.y)))[0];
      if (!m) {
        await sleep(400);
        continue;
      }
      const dx = m.x - b.x;
      if (Math.abs(dx) > 36 || Math.abs(m.y - b.y) > 60) {
        if (Math.abs(m.y - b.y) > 60) t.pos(m.x - Math.sign(dx || 1) * 30, m.y);
        else {
          key(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true);
          await sleep(Math.min(220, Math.abs(dx) * 2));
          release();
        }
        continue;
      }
      if ((dx > 0) !== (b.facing > 0)) {
        key(dx > 0 ? 'ArrowRight' : 'ArrowLeft', true);
        await sleep(40);
        release();
      }
      key('KeyZ', true);
      await sleep(110);
      key('KeyZ', false);
      swings++;
      await sleep(180);
      // Pick up what's dropped nearby.
      if ((w().drops ?? []).some((d) => Math.abs(d.x - b.x) < 50)) {
        key('KeyX', true);
        await sleep(60);
        key('KeyX', false);
      }
    }
    return { swings };
  }
  const report = { log: [], done: [], failed: [], level: 0 };
  const say = (s) => {
    report.log.push(`${(w()?.now ?? 0).toFixed(0)}s L${w()?.char.level} ${s}`);
    if (report.log.length > 300) report.log.shift();
  };

  async function autoQuest(id) {
    const q = QUESTS[id];
    const c = w().char;
    if (questState(c, id) === 'available') {
      if (!(await talkTo(q.giver))) return say(`${id}: giver ${q.giver} not found`), false;
      acceptQuest(c, id);
      say(`took ${q.name}`);
    }
    if (questState(c, id) === 'locked' || questState(c, id) === 'done') return false;
    for (const [i, o] of q.objectives.entries()) {
      const left = () => objectiveProgress(c, id)[i];
      if (left().have >= left().count) continue;
      if (o.type === 'kill' || o.type === 'collect') {
        const mobId = o.type === 'kill' ? o.mob : itemSources(o.item).find((m) => mapsWith(m).length);
        const place = mobId && mapsWith(mobId)[0];
        if (!place) {
          say(`${id}: nowhere to find ${o.mob ?? o.item}`);
          continue;
        }
        await go(place);
        const r = await fight(mobId, () => left().have >= left().count);
        say(`${o.type} ${o.mob ?? o.item} ${left().have}/${left().count} in ${place} (${r.swings} swings${r.died ? ', fainted' : ''})`);
      } else if (o.type === 'talk' || o.type === 'deliver') {
        await talkTo(o.npc);
        noteTalk(c, o.npc);
      } else if (o.type === 'visit') {
        await go(o.map);
        noteVisit(c, o.map, { y: (o.above ?? 0) - 1 });
      }
    }
    if (questState(c, id) === 'ready') {
      await talkTo(q.giver);
      const r = completeQuest(c, id);
      say(r ? `handed in ${q.name}` : `could not hand in ${q.name}`);
      if (c.ap > 0) autoAssignAp(c);
      return Boolean(r);
    }
    say(`${q.name} not finished: ${JSON.stringify(objectiveProgress(c, id).map((o) => `${o.have}/${o.count}`))}`);
    return false;
  }

  Object.assign(t, {
    autoQuest,
    playReport: () => ({ ...report, level: w()?.char.level, job: w()?.char.job, map: w()?.map.id, log: report.log.slice(-40) }),
    async autoPlay(target = 5, family = null) {
      const c = w().char;
      for (let round = 0; round < 60 && c.level < target; round++) {
        // The first job, at 5.
        if (family && c.job === 'novice') {
          const job = nextJobs('novice', c.level).find((j) => j.family === family);
          if (job && advanceJob(c, job.id)) say(`became a ${JOBS[job.id].name}`);
        }
        const open = Object.values(QUESTS).filter((q) => !q.daily && questState(c, q.id) !== 'done' && questState(c, q.id) !== 'locked' && !report.failed.includes(q.id)).sort((a, b) => a.minLevel - b.minLevel);
        if (!open.length) {
          say('no quest open');
          break;
        }
        const q = open[0];
        const ok = await autoQuest(q.id);
        (ok ? report.done : report.failed).push(q.id);
      }
      release();
      return this.playReport();
    },
  });
}
