// Turns what happens in the world into sound, once per frame: new effects (swings, shots, spells,
// skills), the game-feel cues (hits, kills, hurts, stomps, loot), floating words (MISS, LINK!),
// and changes in the hero's state (steps, jumps, landings, climbing, gold, items, levels, jobs,
// quests, maps, the hit counter's tiers, a full gauge). The world itself never plays sounds, so
// the rules stay testable without audio; this reads what it left behind.
//
// Sounds pan with where they happen on screen. What the other players do (party members, other
// hunters on the map, friends online) is theirs: it plays softer, behind your own sounds (`ally`;
// sfx.js). The music follows the map.

import { sfx } from './sfx.js';
import { updateMusic, setFight, setMuffle } from './music.js';
import { updateAmbience, dayPart } from './ambience.js';
import { prepareSongs } from './bank.js';
import { getMap } from '../data/maps.js';
import { hasRage, hasFaith, hasBond } from '../world/melee.js';
import { SKILLS } from '../data/skills.js';
import { isQueen } from '../world/story.js';

const memo = new WeakMap();

// What each kind of map is underfoot.
const GROUND = { town: 'stone', meadow: 'grass', harbor: 'wood', forest: 'grass', ruins: 'stone', cave: 'crystal', sky: 'cloud', crag: 'sand', grove: 'grass', hollow: 'wood', manor: 'wood', aquarium: 'sand', carnival: 'wood', observatory: 'stone', candy: 'grass', shrine: 'stone', ridge: 'stone', springs: 'stone', snow: 'cloud' };
// The manor's boss rooms play its boss waltz.
const MANOR_BOSS_ROOMS = new Set(['manor3', 'manor5', 'manor6']);
const AQUA_BOSS_ROOMS = new Set(['aquarium4', 'aquarium5', 'aquarium6']);
const CARNIVAL_BOSS_ROOMS = new Set(['carnival4', 'carnival5', 'carnival6']);
const OBS_BOSS_ROOMS = new Set(['observatory4', 'observatory5', 'observatory6']);
const VOLCANO_BOSS_ROOMS = new Set(['volcano4', 'volcano5', 'volcano6']);
const THEATRE_BOSS_ROOMS = new Set(['theatre4', 'theatre5', 'theatre6']);
const WHALE_BOSS_ROOMS = new Set(['skywhale4', 'skywhale5', 'skywhale6']);
// Each emote's sound (recipes.js, recorded.js).
const EMOTE_SOUND = { cheer: 'emoteCheer', dance: 'emoteDance', flip: 'emoteFlip', love: 'emoteLove', pray: 'emoteThanks', flex: 'emoteFlex', sleepy: 'emoteSleepy', sad: 'emoteSad' };
const TOWN_SONG = { sprout: 'town', harbor: 'harbor', crag: 'crag', grove: 'grove' };

export function songFor(map, world = null) {
  if (!map) return 'title';
  if (map.id === 'bossroom' || map.id === 'hollow6') return 'boss';
  if (map.dungeon === 'manor') return MANOR_BOSS_ROOMS.has(map.id) ? 'manorboss' : 'manor';
  if (map.dungeon === 'aquarium') return AQUA_BOSS_ROOMS.has(map.id) ? 'aquaboss' : 'aquarium';
  if (map.dungeon === 'carnival') return CARNIVAL_BOSS_ROOMS.has(map.id) ? 'carnivalboss' : 'carnival';
  if (map.dungeon === 'observatory') return OBS_BOSS_ROOMS.has(map.id) ? 'observatoryboss' : 'observatory';
  if (map.dungeon === 'volcano') return VOLCANO_BOSS_ROOMS.has(map.id) ? 'volcanoboss' : 'volcano';
  if (map.dungeon === 'theatre') return THEATRE_BOSS_ROOMS.has(map.id) ? 'theatreboss' : 'theatre';
  if (map.dungeon === 'skywhale') return WHALE_BOSS_ROOMS.has(map.id) ? 'skywhaleboss' : 'skywhale';
  if (map.dungeon) return 'hollow';
  // A queen's trial, or a queen back on her map for a rematch and in the fight.
  if (map.trial) return 'queen';
  if (world?.mobs?.some((m) => isQueen(m) && m.hp > 0 && (m.aggroUntil > world.now || Math.abs(m.x - world.body.x) < 420))) return 'queen';
  if (map.music) return map.music;
  if (map.isTown) return `${TOWN_SONG[map.town] ?? 'town'}${dayPart() === 'night' ? '-night' : ''}`;
  return { crag: 'crag', meadow: 'meadow', forest: 'forest', ruins: 'ruins', cave: 'cave', sky: 'sky', harbor: 'harbor', grove: 'grove', shrine: 'shrine', ridge: 'ridge', springs: 'springs', snow: 'peak' }[map.theme] ?? 'meadow';
}

const SPELLS = new Set(['healbloom', 'titanwave', 'feathers', 'moonslash', 'smokepuff', 'smokeburst', 'meteor', 'judgment', 'burst', 'quake', 'vortex', 'beam', 'xslash', 'smoke', 'hammer', 'dragon', 'stampede', 'bladestorm', 'rain', 'blast', 'galeblast', 'thunderblast', 'frostburst', 'stormburst', 'galeburst', 'gust', 'boltshock', 'zapstrike', 'chainarc', 'staticfield', 'skybolt', 'stormsky', 'gigabolt']);
// Each mount's jump, step (and how far apart its steps are), for world/mount.js riding.
const MOUNT_JUMP = { bun: 'bunHop', crane: 'craneFlap', nimbus: 'nimbusPuff', kettle: 'kettleRattle', turtle: 'jump', gecko: 'jump' };
const MOUNT_STEP = { bun: 'bunHop', crane: 'craneFlap', nimbus: 'nimbusPuff', kettle: 'kettleRattle', turtle: 'turtleStep', gecko: 'geckoPatter' };
const MOUNT_STRIDE = { bun: 60, crane: 34, nimbus: 90, kettle: 40, turtle: 30, gecko: 16 };
// The Starlight Idol's Center Stage, Hype Wave, Lullaby cloud, curtains and pyro.
const IDOL_SOUND = { sispot: 'idolsong', silullcloud: 'sisong', sicurtain: 'sisong', sipyro: 'siwave' };
const NAMED = new Set(['aeboom', 'aesteam', 'aeballista', 'stwish', 'stveil', 'starfallsky', 'starfallimpact', 'skytornado', 'skyupdraft', 'bdbounce', 'bdcarousel', 'pillar', 'aegis', 'consecrate', 'verdict', 'bloodmoon', 'eclipse', 'rageburst', 'crack', 'roar', 'hook', 'titanrise', 'titanbreak', 'falconcall', 'falconloose', 'nightfall', 'fullmoon', 'crescentcut',
  // The Spirit Mage and her doll.
  'spiritwave', 'blessing', 'wardbreak', 'heavenslantern', 'lanternray', 'lanternblaze', 'fanslap', 'bellbonk', 'dollcharm', 'dolltwirl', 'dollpop', 'spitball', 'spitsplat',
  // The Starlight Idol.
  'siwave', 'sistage', 'sihit',
  // The Phantom Trickster.
  'pthit', 'ptsmoke', 'ptillusion',
  // The Acrobat Archer.
  'achit', 'acfirework', 'acburst', 'trapsnap',
  // The Astronomer.
  'ashit', 'aswell', 'astide', 'asalign',
  // Team moves.
  'teamcatch', 'teamrevive', 'teamburst']);

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
    const ally = Boolean(f.ally || f._remote);
    const say = (name, o = {}) => sfx(name, { ...o, ally });
    switch (f.kind) {
      // A combo's own swings are heard from their wind-up (the 'swing' cue below); arcs without a
      // move (party members' cuts) are heard here.
      case 'arc': if (!f.move) say('swing', { weight: f.big ? 1.8 : (f.thick ?? 7) > 11 ? 1.4 : 1, school: f.snd, pan: p }); break;
      case 'projectile': say('shot', { kind: f.shot, weapon: f.weapon, pan: p }); break;
      case 'castcircle': say('cast', { school: f.school, big: f.big, pan: p }); break;
      case 'powerup': say('powerup', { school: f.school, big: f.big, pan: p }); break;
      case 'buffcast': say('buff', { party: SKILLS[f.skill]?.party, pan: p }); break;
      case 'heal': say('heal', { pan: p }); break;
      case 'chargetrail': say('dash', { pan: p }); break;
      case 'leapburst': say('dash', { pan: p }); break;
      case 'blink': say('blink', { pan: p }); break;
      case 'gather': say('gather', { dur: f.dur, school: f.school, pan: p }); break;
      // A life skill's level up: the little rising chime of a skill going up.
      case 'lifelevel': sfx('skillUp'); break;
      // Getting on or off a mount: a soft poof with a little rising (or falling) chime.
      case 'mountpoof': say(f.on ? 'mountOn' : 'mountOff', { pan: p }); break;
      case 'freeze': say('freeze', { pan: p }); break;
      // Each sight locking on ticks a step higher than the last (Rez; research/archery.md 26).
      case 'reticle': say('lockOn', { pan: p, rate: Math.pow(2, (2 * Math.min(8, f.n ?? 0)) / 12) }); break;
      case 'poisonpuff': say('dot', { bleed: f.bleed, pan: p }); break;
      default:
        // (A bolt's small muzzle sparks ride on the shot's own sound.)
        if (f.small && f.kind === 'boltshock') break;
        if (NAMED.has(f.kind)) say(f.kind, { pan: p });
        // The Starlight Idol's reworked songs play her existing song sounds.
        else if (IDOL_SOUND[f.kind] && !f.short) say(IDOL_SOUND[f.kind], { pan: p });
        else if (SPELLS.has(f.kind) || f.kind === 'fire' || f.kind === 'holy') say('spell', { kind: f.kind, pan: p });
    }
  }

  // ----- Game-feel cues (read before the renderer drains them) -----
  // Your hits this frame are heard as one blow (the biggest of them), the others' as one softer one.
  let hits = 0;
  let hit = null;
  let theirs = null;
  for (const j of world.juice) {
    if (j.heard) continue;
    j.heard = true;
    if (j.type === 'hit') {
      if (j.ally || j.party) {
        if (!theirs || j.crit || j.big) theirs = j;
        continue;
      }
      hits++;
      if (!hit || j.crit || j.big) hit = j;
    } else if (j.type === 'kill') sfx('poof', { boss: j.boss, pan: pan(j.x), ally: Boolean(j.ally || j.party) && !j.boss });
    else if (j.type === 'hurt') sfx('hurt', { pan: pan(j.x) });
    else if (j.type === 'stomp') sfx('stomp', { big: j.big, pan: pan(j.x) });
    else if (j.type === 'loot') sfx('drop', { rare: true, pan: pan(j.x) });
    else if (j.type === 'stun') sfx('stun', { pan: pan(j.x) });
    else if (j.type === 'denied') sfx('denied');
    else if (j.type === 'swing') sfx(j.pierce ? 'thrust' : 'swing', { weight: j.big ? 1.8 : j.thick > 11 ? 1.4 : 1, school: j.school, weapon: j.weapon, lead: j.in, pan: 0 });
  }
  if (hit) {
    const path = hit.party ? null : hasRage(char) ? 'rage' : hasFaith(char) ? 'holy' : hasBond(char) ? 'wind' : null;
    sfx('hit', { big: hit.big, crit: hit.crit, path, school: hit.school, via: hit.via, weapon: hit.weapon, element: hit.element, many: hits, pan: pan(hit.x), mob: hit.mob, boss: hit.boss });
  }
  if (theirs) sfx('hit', { big: theirs.big, via: theirs.via, weapon: theirs.weapon, school: theirs.school, pan: pan(theirs.x), ally: true });

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
  if (world.map.id !== m.map) prepareSongs((world.map.portals ?? []).map((pt) => pt.to && getMap(pt.to)).filter(Boolean).map((mp) => songFor(mp)));
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
    if ((world.momentum ?? 0) >= 100 && !(m.momentum >= 100)) sfx('showtime');
    if ((world.shadow ?? 0) >= 100 && !(m.shadow >= 100)) sfx('phantom');
    if ((world.ki ?? 0) >= 100 && !(m.ki >= 100)) sfx('carouselfull');
    if ((world.tails ?? 0) >= 100 && !(m.tails >= 100)) sfx('tailwindfull');
    if ((world.rage ?? 0) >= 100 && !(m.rage >= 100)) sfx('berserk');
    if ((world.faith ?? 0) >= 100 && !(m.faith >= 100)) sfx('sanctified');
    if ((world.bond ?? 0) >= 100 && !(m.bond >= 100)) sfx('galeFull');
    if ((world.charge ?? 0) >= 100 && !(m.charge >= 100)) sfx('overdrive');
    if (world.char.job === 'spiritmage' && (world.spirit ?? 0) >= 100 && !(m.spirit >= 100)) sfx('allstars');
    // Jumps, landings, steps, and climbing.
    // Riding, the mount's own sounds stand in for your feet (world/mount.js).
    const ride = world.riding && !world.riding.stowed ? world.riding.id : null;
    if (ride) {
      if (m.ground && !b.onGround && !b.rope && b.vy < -50) sfx(MOUNT_JUMP[ride], { pan: 0 });
      if (!m.ground && b.onGround && m.map === world.map.id) sfx(b.swimming ? 'turtleSplash' : 'land', { pan: 0 });
      if (world.now < (world.riding.dashUntil ?? 0) && !(m.dashing)) sfx('kettleWhistle', { pan: 0 });
      m.dashing = world.now < (world.riding.dashUntil ?? 0);
      if (b.gliding && !m.gliding) sfx('craneGlide', { pan: 0 });
      m.gliding = b.gliding;
      if (world.riding.hovering && !m.hovering) sfx('nimbusPuff', { pan: 0 });
      m.hovering = world.riding.hovering;
      if ((b.onGround || (b.rope && ride === 'gecko')) && m.map === world.map.id) {
        m.walked = (m.walked ?? 0) + Math.abs(b.x - m.x) + (b.rope ? Math.abs(b.y - m.y) : 0);
        if (m.walked > MOUNT_STRIDE[ride]) {
          m.walked = 0;
          sfx(b.swimming ? 'turtleSplash' : MOUNT_STEP[ride], { pan: 0 });
        }
      } else m.walked = 0;
    }
    if (ride) {
      // (handled above)
    } else {
    if (m.ground && !b.onGround && !b.rope && b.vy < -50) sfx('jump', { pan: 0 });
    if (!m.ground && b.onGround && m.map === world.map.id) sfx('land', { hard: (m.fall ?? 0) > 520, pan: 0 });
    if (b.onGround && m.map === world.map.id) {
      m.walked = (m.walked ?? 0) + Math.abs(b.x - m.x);
      const stride = Math.abs(b.vx) > 90 ? 26 : 20;
      if (m.walked > stride) {
        m.walked = 0;
        sfx('step', { ground: GROUND[world.map.theme] ?? 'grass', run: Math.abs(b.vx) > 90 });
      }
    } else m.walked = 0;
    if (b.rope && m.map === world.map.id) {
      m.climbed = (m.climbed ?? 0) + Math.abs(b.y - m.y);
      if (m.climbed > 14) {
        m.climbed = 0;
        sfx('climb');
      }
    }
    }
  } else {
    m.items = countItems(char);
    [m.active, m.done] = questCounts(char);
  }
  m.fall = b.onGround ? 0 : Math.max(m.fall ?? 0, b.vy);
  Object.assign(m, { job: char.job, level: char.level, map: world.map.id, dead: world.dead, gold: char.gold, ground: b.onGround, x: b.x, y: b.y, valor: world.valor, momentum: world.momentum, shadow: world.shadow, ki: world.ki, spirit: world.spirit, tails: world.tails, rage: world.rage, faith: world.faith, bond: world.bond, charge: world.charge });

  // ----- The summons' voices: each one speaks up when it sets about something new -----
  hearSummons(world, m, pan);

  // ----- Spending: a skill point, and something bought -----
  const sp = Object.values(char.skills ?? {}).reduce((n, v) => n + v, 0);
  if (!first && sp > (m.sp ?? sp)) sfx('skillUp');
  if (!first && char.gold < (m.gold0 ?? char.gold)) sfx('buy');
  m.sp = sp;
  m.gold0 = char.gold;

  // ----- Old Lumen landed (world/lumen.js): the fanfare -----
  if (world.fishCaught && world.fishCaught.at !== m.caughtAt) {
    m.caughtAt = world.fishCaught.at;
    if (!first && world.fishCaught.fish.boss) sfx('bossDefeated');
  }

  // ----- An emote (ui/emotes.js): its own little sound -----
  if (world.heard?.emote && world.heard.at !== m.emoteAt) {
    m.emoteAt = world.heard.at;
    if (!first) sfx(EMOTE_SOUND[world.heard.emote] ?? 'emoteCheer');
  }

  // ----- The music and the world around it -----
  // A fight is on while blows land or you're hurt, and for a few seconds after.
  if (world.juice.some((j) => j.type === 'hit' || j.type === 'hurt' || j.type === 'swing')) m.fightAt = world.now;
  const fighting = world.now - (m.fightAt ?? -99) < 5 && !world.map.isTown;
  m.fightK = (m.fightK ?? 0) + ((fighting ? 1 : 0) - (m.fightK ?? 0)) * 0.04;
  const song = songFor(world.map, world);
  updateMusic(song);
  setFight(song === 'boss' || song === 'queen' ? 0 : fighting ? 1 : 0);
  // Low HP muffles the music under a heartbeat.
  const low = !world.dead && char.hp > 0 && char.hp < (world.stats?.maxHp ?? 1) * 0.25;
  setMuffle(low ? 900 : 20000);
  if (low && world.now - (m.beatAt ?? -9) > 0.95) {
    m.beatAt = world.now;
    sfx('heartbeat');
  }
  updateAmbience(world.map, m.fightK);
}

// Each summon: what it says when it starts a move, and now and then when it's idle.
const SUMMONS = [
  ['doll', 'dollHey', 'dollGiggle'],
];
function hearSummons(world, m, pan) {
  const said = (m.said ??= {});
  for (const [key, act, idle] of SUMMONS) {
    const k = world[key];
    if (!k) continue;
    const a = k.act ?? null;
    if (a && a !== said[key] && Math.random() < 0.6) sfx(act, { pan: pan(k.x) });
    said[key] = a;
    // The doll giggles when she starts one of her idle bits.
    if (key === 'doll') {
      if (k.bit && k.bit !== said.dollBit) sfx('dollGiggle', { pan: pan(k.x) });
      said.dollBit = k.bit;
    }
    // Now and then, idle, a line of their own.
    if (idle && !a && world.now > (said[`${key}At`] ?? world.now + 8 + Math.random() * 10)) {
      said[`${key}At`] = world.now + 18 + Math.random() * 20;
      if (said[`${key}At0`]) sfx(idle, { pan: pan(k.x) });
      said[`${key}At0`] = true;
    }
  }
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

// Windows popping open and closed (some with a sound of their own).
const OPEN_SOUND = { quests: 'openPaper', worldmap: 'openPaper', bag: 'openBag' };
const uiMemo = new WeakMap();
export function hearUi(state) {
  const was = uiMemo.get(state) ?? {};
  const now = {};
  for (const [name, w] of Object.entries(state.windows ?? {})) {
    now[name] = Boolean(w.open);
    if (name in was && now[name] !== was[name]) sfx(now[name] ? OPEN_SOUND[name] ?? 'open' : 'close');
  }
  uiMemo.set(state, now);
}
