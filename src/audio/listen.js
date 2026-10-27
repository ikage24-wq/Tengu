// Turns what happens in the world into sound, once per frame: new effects (swings, shots, spells,
// skills), the game-feel cues (hits, kills, hurts, stomps, loot), floating words (MISS, LINK!),
// and changes in the hero's state (steps, jumps, landings, climbing, gold, items, levels, jobs,
// quests, maps, the hit counter's tiers, a full gauge). The world itself never plays sounds, so
// the rules stay testable without audio; this reads what it left behind.
//
// Sounds pan with where they happen on screen. The music follows the map.

import { sfx } from './sfx.js';
import { updateMusic } from './music.js';
import { hasRage, hasFaith } from '../world/melee.js';
import { SKILLS } from '../data/skills.js';

const memo = new WeakMap();

// What each kind of map is underfoot.
const GROUND = { town: 'stone', meadow: 'grass', harbor: 'wood', forest: 'grass', ruins: 'stone', cave: 'crystal', sky: 'cloud', crag: 'sand', grove: 'grass', hollow: 'wood' };
const TOWN_SONG = { sprout: 'town', harbor: 'harbor', crag: 'crag', grove: 'grove' };

export function songFor(map) {
  if (!map) return 'title';
  if (map.id === 'discostage') return 'disco';
  if (map.id === 'bossroom' || map.id === 'hollow6') return 'boss';
  if (map.dungeon) return 'hollow';
  if (map.isTown) return TOWN_SONG[map.town] ?? 'town';
  return { crag: 'crag', meadow: 'meadow', forest: 'forest', ruins: 'ruins', cave: 'cave', sky: 'sky', harbor: 'harbor', grove: 'grove' }[map.theme] ?? 'meadow';
}

const SPELLS = new Set(['thunder', 'icespire', 'meteor', 'tempest', 'judgment', 'shiningray', 'mist', 'toxicblaze', 'chainbolt', 'burst', 'quake', 'vortex', 'beam', 'xslash', 'smoke', 'hammer', 'dragon', 'stampede', 'bladestorm', 'rain']);
const NAMED = new Set(['pillar', 'aegis', 'consecrate', 'verdict', 'bloodmoon', 'eclipse', 'rageburst', 'crack', 'roar', 'hook']);

export function hearWorld(world, cam) {
  const m = memo.get(world) ?? memo.set(world, {}).get(world);
  const char = world.char;
  const b = world.body;
  const pan = (x) => Math.max(-0.7, Math.min(0.7, (x - (cam?.x ?? b.x - 320) - 320) / 400));

  // ----- Effects that just started -----
  for (const f of world.fx) {
    if (f.heard || f.t < 0) continue;
    f.heard = true;
    const p = pan(f.x ?? b.x);
    switch (f.kind) {
      case 'arc': sfx('swing', { weight: f.big ? 1.8 : (f.thick ?? 7) > 11 ? 1.4 : 1, school: f.snd, pan: p }); break;
      case 'pierce': sfx('thrust', { pan: p }); break;
      case 'projectile': sfx('shot', { kind: f.shot, pan: p }); break;
      case 'castcircle': sfx('cast', { school: f.school, big: f.big, pan: p }); break;
      case 'powerup': sfx('powerup', { school: f.school, big: f.big, pan: p }); break;
      case 'buffcast': sfx('buff', { party: SKILLS[f.skill]?.party, pan: p }); break;
      case 'heal': sfx('heal', { pan: p }); break;
      case 'chargetrail': sfx('dash', { pan: p }); break;
      case 'blink': sfx('blink', { pan: p }); break;
      case 'gather': sfx('gather', { dur: f.dur, school: f.school, pan: p }); break;
      case 'freeze': sfx('freeze', { pan: p }); break;
      case 'poisonpuff': sfx('dot', { bleed: f.bleed, pan: p }); break;
      default:
        if (NAMED.has(f.kind)) sfx(f.kind, { pan: p });
        else if (SPELLS.has(f.kind) || f.kind === 'fire' || f.kind === 'holy') sfx('spell', { kind: f.kind, pan: p });
    }
  }

  // ----- Game-feel cues (read before the renderer drains them) -----
  let hits = 0;
  let hit = null;
  for (const j of world.juice) {
    if (j.heard) continue;
    j.heard = true;
    if (j.type === 'hit') {
      hits++;
      if (!hit || j.crit || j.big) hit = j;
    } else if (j.type === 'kill') sfx('poof', { boss: j.boss, pan: pan(j.x) });
    else if (j.type === 'hurt') sfx('hurt', { pan: pan(j.x) });
    else if (j.type === 'stomp') sfx('stomp', { big: j.big, pan: pan(j.x) });
    else if (j.type === 'loot') sfx('drop', { rare: true, pan: pan(j.x) });
  }
  if (hit) {
    const school = hit.party ? null : hasRage(char) ? 'rage' : hasFaith(char) ? 'holy' : null;
    sfx('hit', { big: hit.big, crit: hit.crit, school, element: hit.element, many: hits, pan: pan(hit.x) });
  }

  // ----- Floating words -----
  for (const n of world.numbers) {
    if (n.heard) continue;
    n.heard = true;
    if (n.text === 'MISS') sfx('miss', { pan: pan(n.x) });
    else if (n.text === 'LINK!') sfx('link');
  }

  // ----- The hero's state -----
  const first = m.level == null;
  if (!first) {
    if (char.job !== m.job) sfx('jobUp');
    else if (char.level > m.level) sfx('levelup');
    if (world.map.id !== m.map) sfx('portal');
    if (world.dead && !m.dead) sfx('death');
    if (char.gold > m.gold) sfx('coin');
    const items = countItems(char);
    if (items > m.items) sfx('pickup');
    m.items = items;
    const [active, done] = questCounts(char);
    if (done > m.done) sfx('questDone');
    else if (active > m.active) sfx('questAccept');
    m.active = active;
    m.done = done;
    // The hit counter's tiers, and gauges filling to the top.
    const tier = [10, 25, 50, 100].filter((t) => (world.hits ?? 0) >= t).length;
    if (tier > (m.tier ?? 0)) sfx('tier', { n: tier });
    m.tier = tier;
    if ((world.rage ?? 0) >= 100 && !(m.rage >= 100)) sfx('berserk');
    if ((world.faith ?? 0) >= 100 && !(m.faith >= 100)) sfx('sanctified');
    // Jumps, landings, steps, and climbing.
    if (m.ground && !b.onGround && !b.rope && b.vy < -50) sfx('jump', { pan: 0 });
    if (!m.ground && b.onGround && m.map === world.map.id) sfx('land', { hard: (m.fall ?? 0) > 520, pan: 0 });
    if (b.onGround && m.map === world.map.id) {
      m.walked = (m.walked ?? 0) + Math.abs(b.x - m.x);
      const stride = Math.abs(b.vx) > 90 ? 26 : 20;
      if (m.walked > stride) {
        m.walked = 0;
        sfx('step', { ground: GROUND[world.map.theme] ?? 'grass' });
      }
    } else m.walked = 0;
    if (b.rope && m.map === world.map.id) {
      m.climbed = (m.climbed ?? 0) + Math.abs(b.y - m.y);
      if (m.climbed > 14) {
        m.climbed = 0;
        sfx('climb');
      }
    }
  } else {
    m.items = countItems(char);
    [m.active, m.done] = questCounts(char);
  }
  m.fall = b.onGround ? 0 : Math.max(m.fall ?? 0, b.vy);
  Object.assign(m, { job: char.job, level: char.level, map: world.map.id, dead: world.dead, gold: char.gold, ground: b.onGround, x: b.x, y: b.y, rage: world.rage, faith: world.faith });

  updateMusic(songFor(world.map));
}

function countItems(char) {
  let n = 0;
  for (const tab of Object.values(char.inventory)) for (const e of tab) if (e) n += e.qty ?? 1;
  return n;
}

function questCounts(char) {
  let active = 0;
  let done = 0;
  for (const q of Object.values(char.quests ?? {})) {
    if (q.state === 'active') active++;
    else if (q.state === 'done') done++;
  }
  return [active, done];
}

// Windows popping open and closed.
const uiMemo = new WeakMap();
export function hearUi(state) {
  const was = uiMemo.get(state) ?? {};
  const now = {};
  for (const [name, w] of Object.entries(state.windows ?? {})) {
    now[name] = Boolean(w.open);
    if (name in was && now[name] !== was[name]) sfx(now[name] ? 'open' : 'close');
  }
  uiMemo.set(state, now);
}
