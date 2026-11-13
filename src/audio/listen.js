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
import { introLen, COUNTDOWN, CREST_AHEAD } from '../world/mochi-race.js';

const memo = new WeakMap();

// What each kind of map is underfoot.
const GROUND = { town: 'stone', meadow: 'grass', harbor: 'wood', forest: 'grass', ruins: 'stone', cave: 'crystal', sky: 'cloud', crag: 'sand', grove: 'grass', hollow: 'wood', manor: 'wood', aquarium: 'sand', carnival: 'wood', observatory: 'stone', candy: 'grass', shrine: 'stone', tea: 'grass', ridge: 'stone', springs: 'stone', snow: 'cloud' };
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
  // A Mochi race: its own music (audio/tracks.js), the final-lap mix from the final stretch, the
  // jingle once it's over.
  const R = world?.race;
  if (R && map.race) return R.phase === 'done' ? 'racewin' : R.finalAt != null ? 'raceclimax' : 'race';
  if (map.music) return map.music;
  if (map.isTown) return `${TOWN_SONG[map.town] ?? 'town'}${dayPart() === 'night' ? '-night' : ''}`;
  return { crag: 'crag', meadow: 'meadow', forest: 'forest', ruins: 'ruins', cave: 'cave', sky: 'sky', harbor: 'harbor', grove: 'grove', shrine: 'shrine', tea: 'shrine', ridge: 'ridge', springs: 'springs', snow: 'peak' }[map.theme] ?? 'meadow';
}

const SPELLS = new Set(['healbloom', 'feathers', 'moonslash', 'smokepuff', 'smokeburst', 'meteor', 'judgment', 'burst', 'quake', 'vortex', 'beam', 'xslash', 'smoke', 'hammer', 'dragon', 'stampede', 'bladestorm', 'rain', 'blast', 'galeblast', 'thunderblast', 'frostburst', 'stormburst', 'galeburst', 'gust', 'boltshock', 'zapstrike', 'chainarc', 'staticfield', 'skybolt', 'stormsky', 'gigabolt']);
// Each mount's jump, step (and how far apart its steps are), for world/mount.js riding.
const MOUNT_JUMP = { bun: 'bunHop', crane: 'craneFlap', nimbus: 'nimbusPuff', kettle: 'kettleRattle', turtle: 'jump', gecko: 'jump' };
const MOUNT_STEP = { bun: 'bunHop', crane: 'craneFlap', nimbus: 'nimbusPuff', kettle: 'kettleRattle', turtle: 'turtleStep', gecko: 'geckoPatter' };
const MOUNT_STRIDE = { bun: 60, crane: 34, nimbus: 90, kettle: 40, turtle: 30, gecko: 16 };
const NAMED = new Set(['aeboom', 'aesteam', 'aeballista', 'skytornado', 'skyupdraft', 'bdbounce', 'bdcarousel', 'pillar', 'aegis', 'consecrate', 'verdict', 'bloodmoon', 'eclipse', 'rageburst', 'crack', 'roar', 'hook', 'falconcall', 'falconloose', 'nightfall', 'fullmoon', 'crescentcut',
  // The Phantom Trickster.
  'pthit', 'ptsmoke', 'ptillusion',
  // The Tide Mage.
  'tmlash', 'tmsplash', 'tmsplashbig', 'tmgeyser', 'tmwhirl', 'tmfall', 'tmfallbig', 'tmhit', 'tmshieldfx', 'tmpool',
  // The Stormwall.
  'bwhit', 'bwplate', 'bwfield', 'bwspout', 'bwrain', 'bwcage', 'bwwall', 'bwboltdown', 'bwroll', 'bwovercastfx', 'bwcagebig', 'bwwallbig', 'bwfieldbig', 'bwsquallfx', 'bwstormcloud', 'bwclapbig', 'bwboltbig', 'bwguardshell',
  // The Tempest.
  'tphit', 'tpline', 'tpflashstep', 'tpwhirlfx', 'tpfloor', 'tpflashburst', 'tpbolt', 'tpcuts', 'tprush', 'tpclapbig', 'tpboltbig', 'tpguardshell', 'tpstormcloud',
  // The Thunderguard.
  'tghit', 'tgspark', 'tgchain', 'tgdart', 'tgburst', 'tgfloor', 'tgring', 'tgbeam', 'tgcolumn', 'tgflash', 'tgbolt', 'tgclap', 'tgrush', 'tgcyclone', 'tgrodfx', 'tgclapbig', 'tgboltbig', 'tgguardshell', 'tgstormcloud',
  // The Tidecaller.
  'tchit', 'tcbubblepop', 'tcribbon', 'tcdrop', 'tcpillar', 'tcdrops', 'tcdropsbig', 'tcspring', 'tcsplash', 'tcsplashbig', 'tcrevive', 'tcrain', 'tcsurge', 'tcbless', 'tcmoonfall', 'tcmoontide', 'tcglint', 'tcshellfx', 'tcpool', 'tcwhirl',
  // The Maelstrom.
  'mshit', 'msvortex', 'msvortexsmall', 'msbeam', 'msbeambig', 'msslam', 'msglowpop', 'msslash', 'msmaelstrom', 'msshellfx', 'mspool',
  // The Acrobat Archer.
  'achit', 'acfirework', 'acburst', 'trapsnap',
  // Team moves.
  'teamcatch', 'teamrevive', 'teamburst']);

// Which monsters were already angry last frame (for their call as they turn on you).
const spotted = new WeakMap();

// A festival course's own sounds (Sakura Sprint, 2026-11-13: `look.festival`): a taiko drum on
// each beat of the countdown and a double beat at Go, the crowd swelling as the final stretch
// begins, and wind chimes tinkling now and then in the breeze (a few notes of one bell, pitched
// into a pentatonic little tune, here and there across the stereo).
const CHIME_NOTES = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2];
function hearFestival(world, m) {
  const R = world.race;
  if (!R || !world.map?.look?.festival) {
    m.fest = null;
    return;
  }
  if (m.fest?.R !== R) m.fest = { R, beat: null, go: false, final: false, chimeAt: 0, queue: [], modes: new Map(), buoys: new Set(), bubbled: false };
  const f = m.fest;
  const t = (globalThis.performance?.now?.() ?? Date.now()) / 1000;
  // (Lily Lake's gala has a lifeguard's whistle for a taiko, and the lake for wind chimes.)
  const lake = world.map.look.waterArt === 'lake';
  // (Mortar Cliff's has a mallet pounding mochi for its drum, and the breeze in the maples.)
  const maple = world.map.look.wallArt === 'maple';
  // (Cloud Glide's has soft bells for its count, and the wind over the peak.)
  const snow = world.map.look.launchArt === 'snow';
  // (Long Hill Run's sweets hills have kawaii pops for their count and a music box for chimes.)
  const sweets = world.map.look.groundArt === 'sweets';
  // (The Grand Mochi Course's festival at dusk: a deeper taiko, fireworks far off now and then.)
  const matsuri = world.map.look.groundArt === 'matsuri';
  // (The Grand Tour's kingdom: spears for the count, horns and a gate at Go, a far horn now and then.)
  const kingdom = world.map.look.groundArt === 'kingdom';
  if (R.phase === 'ready') {
    const il = introLen(R);
    const n = R.t >= il ? Math.ceil(il + COUNTDOWN - R.t) : null;
    if (n != null && n !== f.beat && n >= 1 && n <= 3) {
      f.beat = n;
      sfx(lake ? 'lakeToot' : maple ? 'mochiPound' : snow ? 'snowBell' : sweets ? 'sweetPop' : matsuri ? 'matsuriDon' : kingdom ? 'kingTap' : 'taikoDon', { rate: n === 1 ? (sweets ? 1.12 : 1.06) : 1 });
    }
  } else if (!f.go) {
    f.go = true;
    sfx(lake ? 'lakeWhistle' : maple ? 'mochiPoundGo' : snow ? 'snowGo' : sweets ? 'sweetGo' : matsuri ? 'matsuriGo' : kingdom ? 'kingGo' : 'taikoGo');
    if (kingdom) sfx('kingGate', { db: -4 });
  }
  if (lake) hearLake(world, R, f);
  if (maple) hearMaple(R, f, t);
  if (snow) hearSnow(R, f);
  if (sweets) hearSweets(world, R, f, t);
  if (matsuri) hearMatsuri(R, f, t);
  if (kingdom) hearKingdom(world, R, f, t);
  if (R.finalAt != null && !f.final) {
    f.final = true;
    sfx('crowdSwell');
  }
  if (snow && t >= f.chimeAt) {
    f.chimeAt = t + 7 + Math.random() * 5;
    sfx('snowWind', { pan: Math.random() * 0.8 - 0.4 });
  } else if (maple && t >= f.chimeAt) {
    f.chimeAt = t + 6 + Math.random() * 5;
    sfx('leafGust', { pan: Math.random() * 0.8 - 0.4 });
  } else if (sweets && t >= f.chimeAt) {
    // (A few notes of a music box, slower than the wind chimes, now and then.)
    f.chimeAt = t + 6 + Math.random() * 5;
    const base = Math.random() < 0.5 ? 1 : 3 / 4;
    let at = t;
    for (let i = 0, n = 3 + Math.floor(Math.random() * 3); i < n; i++) {
      at += 0.22 + Math.random() * 0.16;
      f.queue.push({ at, name: 'sweetChime', rate: base * CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)], pan: Math.random() * 0.6 - 0.3, db: -6 - Math.random() * 4 });
    }
  } else if (lake && t >= f.chimeAt) {
    f.chimeAt = t + 3.5 + Math.random() * 4;
    sfx('lakeLap', { pan: Math.random() * 0.8 - 0.4 });
  } else if (t >= f.chimeAt) {
    f.chimeAt = t + 4 + Math.random() * 5;
    const base = 2 * (Math.random() < 0.5 ? 1 : 9 / 8);
    let at = t;
    for (let i = 0, n = 2 + Math.floor(Math.random() * 3); i < n; i++) {
      at += 0.1 + Math.random() * 0.22;
      f.queue.push({ at, rate: base * CHIME_NOTES[Math.floor(Math.random() * CHIME_NOTES.length)], pan: Math.random() - 0.5, db: -3 - Math.random() * 5 });
    }
  }
  while (f.queue.length && f.queue[0].at <= t) {
    const c = f.queue.shift();
    sfx(c.name ?? 'chimeBell', { rate: c.rate, pan: c.pan, db: c.db });
  }
}

// The Mochi Grand Tour: racers into the moat and out again, the drawbridge chain overhead as yours
// swims under it, a flag running up at each wall top (and a cheer), a horn as it takes off from the
// keep, far horn calls across the kingdom, and the fanfare as it comes home and on the podium.
function hearKingdom(world, R, f, t) {
  const you = R.racers[R.me];
  for (const r of R.racers) {
    const was = f.modes.get(r);
    const mode = r.m.mode;
    f.modes.set(r, mode);
    if (R.phase !== 'run' || !was || was === mode) continue;
    const pan = Math.max(-0.6, Math.min(0.6, (r.x - you.x) / 260));
    if (mode === 'swim') sfx('lakeDive', { pan, db: r.you ? 0 : -7 });
    else if (was === 'swim') sfx('lakeSwish', { pan, db: r.you ? 0 : -8 });
    if (!r.you) continue;
    if (was === 'climb') {
      sfx('kingFlag');
      sfx('landCheer', { db: -5 });
    }
    if (mode === 'fly') sfx('kingHorn', { db: -8 });
    if (was === 'fly') sfx('snowLand');
  }
  if (R.phase === 'run' && !f.chained && you.x > 2180) {
    f.chained = true;
    sfx('kingChain', { db: -6 });
  }
  f.hornAt ??= t + 8;
  if (R.phase === 'run' && t >= f.hornAt) {
    f.hornAt = t + 14 + Math.random() * 10;
    sfx('kingHorn', { pan: Math.random() * 0.6 - 0.3, db: -10 });
  }
  if (you.done != null && !f.hailed) {
    f.hailed = true;
    sfx('kingFanfare');
  }
}

// The Grand Mochi Course: racers diving into the pond and climbing out (as at the lake), the
// drummer on the yagura drumming yours over its top (and the crowd's cheer), a firework as yours
// takes off, a soft landing, fireworks far off now and then, and sparkles over the podium.
function hearMatsuri(R, f, t) {
  const you = R.racers[R.me];
  for (const r of R.racers) {
    const was = f.modes.get(r);
    const mode = r.m.mode;
    f.modes.set(r, mode);
    if (R.phase !== 'run' || !was || was === mode) continue;
    const pan = Math.max(-0.6, Math.min(0.6, (r.x - you.x) / 260));
    if (mode === 'swim') sfx('lakeDive', { pan, db: r.you ? 0 : -7 });
    else if (was === 'swim') sfx('lakeSwish', { pan, db: r.you ? 0 : -8 });
    if (!r.you) continue;
    if (was === 'climb') {
      sfx('yaguraDon');
      sfx('landCheer', { db: -4 });
    }
    if (mode === 'fly') sfx('fwLaunch');
    if (was === 'fly') sfx('snowLand');
  }
  f.boomAt ??= t + 3;
  if (t >= f.boomAt) {
    f.boomAt = t + 6 + Math.random() * 6;
    sfx('fwFar', { pan: Math.random() * 0.8 - 0.4, db: -6 - Math.random() * 4 });
  }
  if (R.phase === 'done' && !f.sparked && R.t > 1.4) {
    f.sparked = true;
    sfx('sparkShower');
  }
}

// Long Hill Run: yours coming over a hilltop (the picnickers there cheer it over, then a soft gust
// as it runs on down), the podium's sprinkles.
function hearSweets(world, R, f, t) {
  const you = R.racers[R.me];
  f.crests ??= new Set();
  f.gusts ??= [];
  if (R.phase === 'run') {
    for (const [kind, wx] of world.map.townPieces ?? []) {
      if (kind !== 'mr_fans' || you.x < wx + CREST_AHEAD || f.crests.has(wx)) continue;
      f.crests.add(wx);
      sfx('landCheer', { db: -2 });
      f.gusts.push(t + 0.35);
    }
  }
  while (f.gusts.length && f.gusts[0] <= t) {
    f.gusts.shift();
    sfx('hillWhoosh');
  }
  if (R.phase === 'done' && !f.showered && R.t > 1.4) {
    f.showered = true;
    sfx('sweetShower');
  }
}

// Cloud Glide: yours taking off in a gust, every racer landing in the snow (yours loudest, and a
// cheer from the squad), the podium's bells.
function hearSnow(R, f) {
  const you = R.racers[R.me];
  f.snowModes ??= new Map();
  for (const r of R.racers) {
    const was = f.snowModes.get(r);
    f.snowModes.set(r, r.m.mode);
    if (R.phase !== 'run' || !was || was === r.m.mode) continue;
    if (r.you && r.m.mode === 'fly') sfx('glideGust');
    if (was === 'fly' && r.m.mode === 'run') {
      sfx('snowLand', { pan: Math.max(-0.6, Math.min(0.6, (r.x - you.x) / 260)), db: r.you ? 0 : -7 });
      if (r.you) sfx('landCheer');
    }
  }
  if (R.phase === 'done' && !f.belled && R.t > 1.4) {
    f.belled = true;
    sfx('snowBell');
  }
}

// Mortar Cliff: yours coming over a wall's top rings its bell and sets its pounders going, three
// quick strokes in time with their burst (render/courseart.js pounders); the podium's breeze.
function hearMaple(R, f, t) {
  const you = R.racers[R.me];
  const was = f.youMode;
  f.youMode = you.m.mode;
  f.pounds ??= [];
  if (R.phase === 'run' && was === 'climb' && you.m.mode !== 'climb') {
    sfx('wallBell');
    for (const d of [0.27, 0.87, 1.47]) f.pounds.push(t + d);
  }
  while (f.pounds.length && f.pounds[0] <= t) {
    f.pounds.shift();
    sfx('mochiPound', { db: -3 });
  }
  if (R.phase === 'done' && !f.gusted && R.t > 1.4) {
    f.gusted = true;
    sfx('leafGust');
  }
}

// Lily Lake: each racer diving in (yours loudest, the rest softer and panned to where they are from
// yours), climbing out and shaking off, yours sending up a buoy's fountain, the podium's bubbles.
function hearLake(world, R, f) {
  const you = R.racers[R.me];
  for (const r of R.racers) {
    const was = f.modes.get(r);
    const mode = r.m.mode;
    f.modes.set(r, mode);
    if (R.phase !== 'run' || !was || was === mode) continue;
    const pan = Math.max(-0.6, Math.min(0.6, (r.x - you.x) / 260));
    if (mode === 'swim') sfx('lakeDive', { pan, db: r.you ? 0 : -7 });
    else if (was === 'swim') sfx('lakeSwish', { pan, db: r.you ? 0 : -8 });
  }
  if (R.phase === 'run') {
    for (const [kind, wx] of world.map.townPieces ?? []) {
      if (kind !== 'mr_buoy' || f.buoys.has(wx) || you.x < wx) continue;
      f.buoys.add(wx);
      sfx('lakeJet');
    }
  }
  if (R.phase === 'done' && !f.bubbled && R.t > 1.4) {
    f.bubbled = true;
    sfx('lakeBubbles');
  }
}

export function hearWorld(world, cam) {
  const m = memo.get(world) ?? memo.set(world, {}).get(world);
  hearFestival(world, m);
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
    } else if (j.type === 'kill') sfx('poof', { boss: j.boss, pan: pan(j.x), ally: Boolean(j.ally || j.party) && !j.boss, mob: j.mob });
    else if (j.type === 'hurt') sfx('hurt', { pan: pan(j.x) });
    else if (j.type === 'mochiVoice') sfx('mochiVoice', { style: j.style, pitch: j.pitch, mood: j.mood, pan: pan(j.x) });
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

  // ----- The monsters' voices (voices.js) -----
  // A monster on screen that turns on you calls out as it does (one call at a time); that call
  // stands for its cry at the blow that angered it.
  const now = world.now ?? 0;
  let calledOut = false;
  const mid = (cam?.x ?? b.x - 320) + 320;
  for (const mob of world.mobs ?? []) {
    const angry = mob.hp > 0 && mob.def.aggro && now < (mob.aggroUntil ?? 0);
    const was = spotted.get(mob) ?? false;
    spotted.set(mob, angry);
    if (angry && !was && Math.abs(mob.x - mid) < 340 && now - (m.spotVoice ?? -9) > 0.7) {
      m.spotVoice = now;
      calledOut = true;
      sfx('mobVoice', { mob: mob.def.id, moment: 'Spot', pan: pan(mob.x) });
    }
  }
  // Hit by you, it cries out now and then: not for every blow of a combo (each kind of monster
  // waits a beat, and only one cries at a time).
  m.hurtVoice ??= {};
  if (hit?.mob && !calledOut && now - (m.anyHurtVoice ?? -9) > 0.3 && now - (m.hurtVoice[hit.mob] ?? -9) > 0.8) {
    m.anyHurtVoice = now;
    m.hurtVoice[hit.mob] = now;
    sfx('mobVoice', { mob: hit.mob, moment: 'Hurt', pan: pan(hit.x) });
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
    if ((world.volt ?? 0) >= 100 && !(m.volt >= 100)) sfx('tgovercharge');
    if ((world.gale ?? 0) >= 100 && !(m.gale >= 100)) sfx('tplightspeed');
    if ((world.bulwark ?? 0) >= 100 && !(m.bulwark >= 100)) sfx('bweye');
    if ((world.momentum ?? 0) >= 100 && !(m.momentum >= 100)) sfx('showtime');
    if ((world.shadow ?? 0) >= 100 && !(m.shadow >= 100)) sfx('phantom');
    if ((world.ki ?? 0) >= 100 && !(m.ki >= 100)) sfx('carouselfull');
    if ((world.tails ?? 0) >= 100 && !(m.tails >= 100)) sfx('tailwindfull');
    if ((world.rage ?? 0) >= 100 && !(m.rage >= 100)) sfx('berserk');
    if ((world.faith ?? 0) >= 100 && !(m.faith >= 100)) sfx('sanctified');
    if ((world.bond ?? 0) >= 100 && !(m.bond >= 100)) sfx('galeFull');
    if ((world.charge ?? 0) >= 100 && !(m.charge >= 100)) sfx('overdrive');
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
  Object.assign(m, { job: char.job, level: char.level, map: world.map.id, dead: world.dead, gold: char.gold, ground: b.onGround, x: b.x, y: b.y, volt: world.volt, gale: world.gale, bulwark: world.bulwark, momentum: world.momentum, shadow: world.shadow, ki: world.ki, spirit: world.spirit, tails: world.tails, rage: world.rage, faith: world.faith, bond: world.bond, charge: world.charge });

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
const SUMMONS = [];
function hearSummons(world, m, pan) {
  const said = (m.said ??= {});
  for (const [key, act, idle] of SUMMONS) {
    const k = world[key];
    if (!k) continue;
    const a = k.act ?? null;
    if (a && a !== said[key] && Math.random() < 0.6) sfx(act, { pan: pan(k.x) });
    said[key] = a;
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
