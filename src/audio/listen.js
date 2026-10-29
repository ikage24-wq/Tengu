// Turns what happens in the world into sound, once per frame: new effects (swings, shots, spells,
// skills), the game-feel cues (hits, kills, hurts, stomps, loot), floating words (MISS, LINK!),
// and changes in the hero's state (steps, jumps, landings, climbing, gold, items, levels, jobs,
// quests, maps, the hit counter's tiers, a full gauge). The world itself never plays sounds, so
// the rules stay testable without audio; this reads what it left behind.
//
// Sounds pan with where they happen on screen. The music follows the map.

import { sfx } from './sfx.js';
import { updateMusic } from './music.js';
import { prepareSongs } from './bank.js';
import { getMap } from '../data/maps.js';
import { hasRage, hasFaith, hasBond } from '../world/melee.js';
import { SKILLS } from '../data/skills.js';

const memo = new WeakMap();

// What each kind of map is underfoot.
const GROUND = { town: 'stone', meadow: 'grass', harbor: 'wood', forest: 'grass', ruins: 'stone', cave: 'crystal', sky: 'cloud', crag: 'sand', grove: 'grass', hollow: 'wood' };
const TOWN_SONG = { sprout: 'town', harbor: 'harbor', crag: 'crag', grove: 'grove' };

export function songFor(map, world = null) {
  if (!map) return 'title';
  // Dancing Green's stage plays his song, following the fight.
  if (map.id === 'discostage') {
    const boss = world?.mobs.find((m) => m.def.disco);
    // Gone (or falling): the victory fanfare, then quiet.
    if (!boss || boss.hp <= 0) return 'funky-win';
    if (world.cutscene) return 'funky-intro';
    return boss.brain?.enraged ? 'funky-fever' : 'funky';
  }
  if (map.id === 'bossroom' || map.id === 'hollow6') return 'boss';
  if (map.dungeon) return 'hollow';
  if (map.isTown) return TOWN_SONG[map.town] ?? 'town';
  return { crag: 'crag', meadow: 'meadow', forest: 'forest', ruins: 'ruins', cave: 'cave', sky: 'sky', harbor: 'harbor', grove: 'grove' }[map.theme] ?? 'meadow';
}

const SPELLS = new Set(['healbloom', 'titanwave', 'feathers', 'moonslash', 'smokepuff', 'smokeburst', 'logpoof', 'inkcut', 'foxtrapburst', 'foxdecoy', 'meteor', 'judgment', 'burst', 'quake', 'vortex', 'beam', 'xslash', 'smoke', 'hammer', 'dragon', 'stampede', 'bladestorm', 'rain', 'blast', 'galeblast', 'thunderblast', 'frostburst', 'stormburst', 'galeburst', 'gust', 'boltshock', 'zapstrike', 'chainarc', 'staticfield', 'skybolt', 'stormsky', 'gigabolt']);
const NAMED = new Set(['pillar', 'aegis', 'consecrate', 'verdict', 'bloodmoon', 'eclipse', 'rageburst', 'crack', 'roar', 'hook', 'titanrise', 'titanbreak', 'falconcall', 'falconloose', 'nightfall', 'fullmoon', 'crescentcut', 'sealburst', 'inkwash', 'inkfoxsweep', 'foxnight', 'flamefoxpounce',
  // The Spirit Mage and her doll.
  'spiritwave', 'blessing', 'wardbreak', 'heavenslantern', 'lanternray', 'lanternblaze', 'fanslap', 'bellbonk', 'dollcharm', 'dolltwirl', 'dollpop', 'spitball', 'spitsplat',
  // The Shrine Maiden's kitsune guardian.
  'kitsunecall', 'kitsuneblock', 'kitsuneport', 'kitsunegather', 'kitsunemoonfall', 'kitsunecrescent', 'kitsunejab']);

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
      // A combo's own swings are heard from their wind-up (the 'swing' cue below); arcs without a
      // move (party members' cuts) are heard here.
      case 'arc': if (!f.move) sfx('swing', { weight: f.big ? 1.8 : (f.thick ?? 7) > 11 ? 1.4 : 1, school: f.snd, pan: p }); break;
      case 'projectile': sfx('shot', { kind: f.shot, weapon: f.weapon, pan: p }); break;
      case 'castcircle': sfx('cast', { school: f.school, big: f.big, pan: p }); break;
      case 'powerup': sfx('powerup', { school: f.school, big: f.big, pan: p }); break;
      case 'buffcast': sfx('buff', { party: SKILLS[f.skill]?.party, pan: p }); break;
      case 'heal': sfx('heal', { pan: p }); break;
      case 'chargetrail': sfx('dash', { pan: p }); break;
      case 'blink': sfx('blink', { pan: p }); break;
      case 'gather': sfx('gather', { dur: f.dur, school: f.school, pan: p }); break;
      case 'freeze': sfx('freeze', { pan: p }); break;
      // Each sight locking on ticks a step higher than the last (Rez; research/archery.md 26).
      case 'reticle': sfx('lockOn', { pan: p, rate: Math.pow(2, (2 * Math.min(8, f.n ?? 0)) / 12) }); break;
      case 'poisonpuff': sfx('dot', { bleed: f.bleed, pan: p }); break;
      default:
        // (A bolt's small muzzle sparks ride on the shot's own sound.)
        if (f.small && f.kind === 'boltshock') break;
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
    } else if (j.type === 'kill') sfx('poof', { boss: j.boss, stage: world.map.id === 'discostage', pan: pan(j.x) });
    else if (j.type === 'hurt') sfx('hurt', { pan: pan(j.x) });
    else if (j.type === 'stomp') sfx('stomp', { big: j.big, pan: pan(j.x) });
    else if (j.type === 'loot') sfx('drop', { rare: true, pan: pan(j.x) });
    else if (j.type === 'stun') sfx('stun', { pan: pan(j.x) });
    else if (j.type === 'denied') sfx('denied');
    else if (j.type === 'swing') sfx(j.pierce ? 'thrust' : 'swing', { weight: j.big ? 1.8 : j.thick > 11 ? 1.4 : 1, school: j.school, weapon: j.weapon, lead: j.in, pan: 0 });
  }
  if (hit) {
    const path = hit.party ? null : hasRage(char) ? 'rage' : hasFaith(char) ? 'holy' : hasBond(char) ? 'wind' : null;
    sfx('hit', { big: hit.big, crit: hit.crit, path, school: hit.school, via: hit.via, weapon: hit.weapon, element: hit.element, many: hits, pan: pan(hit.x) });
  }

  // ----- Floating words -----
  for (const n of world.numbers) {
    if (n.heard) continue;
    n.heard = true;
    if (n.text === 'MISS') sfx('miss', { pan: pan(n.x) });
    else if (n.text === 'LINK!') sfx('link');
    else if (n.text === 'DEADEYE!') sfx('crit', { pan: pan(n.x) });
  }

  // ----- The hero's state -----
  const first = m.level == null;
  // Get the songs of the maps next door ready, so walking on never waits for one.
  if (world.map.id !== m.map) prepareSongs((world.map.portals ?? []).map((pt) => pt.to && getMap(pt.to)).filter(Boolean).flatMap((mp) => (mp.id === 'discostage' ? ['funky-groove', 'funky-heart', 'funky'] : [songFor(mp)])));
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
    if ((world.valor ?? 0) >= 100 && !(m.valor >= 100)) sfx('unbroken');
    if ((world.momentum ?? 0) >= 100 && !(m.momentum >= 100)) sfx('hawkeye');
    if ((world.shadow ?? 0) >= 100 && !(m.shadow >= 100)) sfx('phantom');
    if ((world.ki ?? 0) >= 100 && !(m.ki >= 100)) sfx('shadowclones');
    if ((world.tails ?? 0) >= 100 && !(m.tails >= 100)) sfx('ninetails');
    if ((world.rage ?? 0) >= 100 && !(m.rage >= 100)) sfx('berserk');
    if ((world.faith ?? 0) >= 100 && !(m.faith >= 100)) sfx('sanctified');
    if ((world.bond ?? 0) >= 100 && !(m.bond >= 100)) sfx('galeFull');
    if ((world.charge ?? 0) >= 100 && !(m.charge >= 100)) sfx('spell', { kind: 'supercharged' });
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
  Object.assign(m, { job: char.job, level: char.level, map: world.map.id, dead: world.dead, gold: char.gold, ground: b.onGround, x: b.x, y: b.y, valor: world.valor, momentum: world.momentum, shadow: world.shadow, ki: world.ki, tails: world.tails, rage: world.rage, faith: world.faith, bond: world.bond, charge: world.charge });

  updateMusic(songFor(world.map, world), world.disco?.cut ?? 0);
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
