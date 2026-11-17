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
import { SKILLS } from '../data/skills.js';
import { isQueen } from '../world/story.js';
import { introLen, COUNTDOWN, CREST_AHEAD, JUMP_PHASE, FALL, ROLL_BEAT } from '../world/mochi-race.js';
import { CART_BEAT } from '../data/mochi-race.js';
import { SKY } from '../world/garden-weather.js';

const memo = new WeakMap();

// What each kind of map is underfoot.
const GROUND = { town: 'stone', meadow: 'grass', harbor: 'wood', forest: 'grass', ruins: 'stone', cave: 'crystal', sky: 'cloud', crag: 'sand', grove: 'grass', hollow: 'wood', manor: 'wood', aquarium: 'sand', carnival: 'wood', observatory: 'stone', candy: 'grass', shrine: 'stone', tea: 'grass', ridge: 'stone', springs: 'stone', snow: 'snow' };
// What's underfoot: the map's own ground, and the garden's snow on a snowy day.
const groundOf = (world) => (world.map.garden && !world.map.indoor && (SKY.now?.snow ?? 0) > 0.35 ? 'snow' : GROUND[world.map.theme] ?? 'grass');
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
  // A cutscene can set its own music, or none (world/cast.js `music`), and a set can be hushed.
  if (world?.cine && 'music' in world.cine) return world.cine.music;
  if (map.quiet) return null;
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

const SPELLS = new Set(['healbloom', 'feathers', 'meteor', 'judgment', 'burst', 'quake', 'vortex', 'beam', 'xslash', 'smoke', 'hammer', 'dragon', 'stampede', 'bladestorm', 'rain', 'thunderblast', 'gust', 'zapstrike', 'chainarc', 'staticfield', 'skybolt', 'stormsky', 'gigabolt']);
// Each mount's jump, step (and how far apart its steps are), for world/mount.js riding.
const MOUNT_JUMP = { bun: 'bunHop', crane: 'craneFlap', nimbus: 'nimbusPuff', kettle: 'kettleRattle', turtle: 'jump', gecko: 'jump' };
const MOUNT_STEP = { bun: 'bunHop', crane: 'craneFlap', nimbus: 'nimbusPuff', kettle: 'kettleRattle', turtle: 'turtleStep', gecko: 'geckoPatter' };
const MOUNT_STRIDE = { bun: 60, crane: 34, nimbus: 90, kettle: 40, turtle: 30, gecko: 16 };
const NAMED = new Set(['pillar', 'aegis', 'consecrate', 'verdict', 'bloodmoon', 'eclipse', 'rageburst', 'crack', 'roar', 'hook', 'fullmoon',
  // The Eclipse (her swarm and eyes in flight are shots).
  'echit', 'eceyeopen', 'ecring', 'ecringbig', 'ecportal', 'ecedge', 'ecpop', 'eccloud', 'ecflurry', 'ecnewmoon', 'ecpour', 'ectotal', 'ecdiamond',
  // The Moon Moth's second four, and her paths' versions.
  'mmveil', 'mmdodge', 'mmdazzle', 'mmlure', 'mmlurepop', 'mmfeint', 'ecveil', 'ecdodge', 'ecdazzle', 'eclure', 'eclurepop', 'ecfeint',
  // The Silkweaver (her thread and her swarm in flight are shots).
  'svhit', 'svwrapup', 'svpop', 'svknot', 'svlash', 'svzipline', 'svswing', 'svwhirl', 'svreel', 'svmoon', 'svburst', 'svcloud', 'svflurry', 'svflutter', 'svpearlmoon', 'svpour', 'svveil', 'svdodge', 'svdazzle', 'svlure', 'svlurepop', 'svfeint',
  // The Sunfeather (her arrows and sunbirds in flight are shots).
  'sfhit', 'sfhitbig', 'sfbird', 'sfcharge', 'sfupshot', 'sfupbig', 'sffeatherfall', 'sflightfall', 'sfgolden', 'sfsun',
  // The Phoenix (her bolts and fire birds in flight are shots).
  'phhit', 'phhitbig', 'phbird', 'phburn', 'phstuck', 'phblast', 'phburst', 'phwings', 'phsweep', 'phpillar', 'phcharge', 'phupshot', 'phupbig', 'phfeatherfall', 'phlightfall', 'phgolden', 'phsun',
  // The Songbird (her arrows and bluebirds in flight are shots).
  'sbhit', 'sbhitbig', 'sbbird', 'sbnotes', 'sbmend', 'sbmelody', 'sbanthem', 'sbribbon', 'sbflock', 'sbwave', 'sbcharge', 'sbupshot', 'sbupbig', 'sbfeatherfall', 'sblightfall', 'sbgolden', 'sbsun',
  // The Moon Moth (the swarm in flight is a shot: audio/sfx.js SHOTS).
  'mmflutter', 'ecflutter', 'mmhit', 'mmcloud', 'mmwings', 'mmflurry', 'mmnip', 'mmmoon', 'mmpour',
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
  // (Tanabata Hurdles' star night: a bamboo knock for the count, two and a wind chime at LEAP!)
  const tanabata = world.map.look.groundArt === 'tanabata';
  // (Mochitsuki Mountain: a temple bell's ding for the count, the great bell at Go.)
  const mountain = world.map.look.cast === 'pound';
  if (R.phase === 'ready') {
    const il = introLen(R);
    const n = R.t >= il ? Math.ceil(il + COUNTDOWN - R.t) : null;
    if (n != null && n !== f.beat && n >= 1 && n <= 3) {
      f.beat = n;
      sfx(lake ? 'lakeToot' : maple ? 'mochiPound' : snow ? 'snowBell' : sweets ? 'sweetPop' : matsuri ? 'matsuriDon' : kingdom ? 'kingTap' : tanabata ? 'tanaKnock' : mountain ? 'mtTing' : 'taikoDon', { rate: n === 1 ? (sweets ? 1.12 : 1.06) : 1 });
    }
  } else if (!f.go) {
    f.go = true;
    sfx(lake ? 'lakeWhistle' : maple ? 'mochiPoundGo' : snow ? 'snowGo' : sweets ? 'sweetGo' : matsuri ? 'matsuriGo' : kingdom ? 'kingGo' : tanabata ? 'tanaGo' : mountain ? 'mtGong' : 'taikoGo');
    if (kingdom) sfx('kingGate', { db: -4 });
  }
  if (lake) hearLake(world, R, f);
  if (maple) hearMaple(R, f, t);
  if (snow) hearSnow(R, f);
  if (sweets) hearSweets(world, R, f, t);
  if (matsuri) hearMatsuri(R, f, t);
  if (kingdom) hearKingdom(world, R, f, t);
  if (tanabata) hearTanabata(R, f, t);
  if (mountain) hearMountain(R, f);
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

// Tanabata Hurdles' star night (2026-11-16): each racer's leap - yours loudest, the rest softer and
// panned to where they are from yours - a soft whoosh off the ground, then over the bar a star's
// twinkle (clean), a clack and rattle (a toe caught it) or a bump, a pat and seeing stars (down
// over it); a glass wind chime in the bamboo now and then; the podium's shower of stars.
function hearTanabata(R, f, t) {
  const you = R.racers[R.me];
  f.leaps ??= new WeakMap();
  for (const r of R.racers) {
    const j = r.jump;
    if (!j || R.phase === 'ready') continue;
    let s = f.leaps.get(j);
    if (!s) f.leaps.set(j, (s = {}));
    const pan = Math.max(-0.6, Math.min(0.6, (r.x - you.x) / 260));
    const db = r.you ? 0 : -9;
    const e = R.clock - j.from + (j.gain ?? 0);
    if (!s.off && e >= JUMP_PHASE.pre - 0.02) {
      s.off = true;
      sfx('leapWhoosh', { pan, db: db - 8 });
    }
    const over = j.outcome === 'fall' ? FALL.hit : JUMP_PHASE.pre + j.T / 2;
    if (!s.over && e >= over) {
      s.over = true;
      sfx(j.outcome === 'fall' ? 'hurdleTumble' : j.outcome === 'clip' ? 'hurdleClack' : 'leapStar', { pan, db: db - (j.outcome === 'clear' ? 3 : 0) });
    }
  }
  if (R.phase !== 'done') {
    f.furinAt ??= t + 2.5;
    if (t >= f.furinAt) {
      f.furinAt = t + 4 + Math.random() * 6;
      sfx('furin', { pan: Math.random() * 1.2 - 0.6, db: -13 - Math.random() * 5, rate: [1, 1.12, 1.26, 0.94][Math.floor(Math.random() * 4)] });
    }
  } else if (!f.starred && R.t > 1.4) {
    f.starred = true;
    sfx('tanaStars');
  }
}

// The garden's Mochi pattering about (2026-11-16): a soft little paw step for each one near you as it
// walks, smaller and quicker for a baby, softer the further off, from where it is; in the snow on a
// snowy day; never while it's flying, swimming or carried.
function hearPaws(world, m) {
  const life = world.gardenLife;
  if (!life?.mochi || !world.map.garden || world.map.indoor) return;
  const you = world.body;
  m.paws ??= new WeakMap();
  const snow = (SKY.now?.snow ?? 0) > 0.35;
  for (const e of life.mochi) {
    const a = e.m;
    if (!m.paws.has(a)) m.paws.set(a, a.dist);
    const was = m.paws.get(a);
    const far = Math.abs(e.x - you.x);
    const baby = a.size === 'baby';
    if (a.mode !== 'run' || far > 160 || e.held || e.ride) {
      m.paws.set(a, a.dist);
      continue;
    }
    if (a.dist - was < (baby ? 7 : 10)) continue;
    m.paws.set(a, a.dist);
    sfx(snow ? 'stepSnow' : 'mochiStep', { pan: Math.max(-0.6, Math.min(0.6, (e.x - you.x) / 220)), db: -(far / 160) * 8 - (snow ? 8 : 0), rate: baby ? 1.25 : 1 });
  }
}

// Mochitsuki Mountain (2026-11-16): every racer's work - yours loudest, the rest softer and panned to
// where they are from yours, those far off not at all: each strike of its temple bell (the great
// bell, fuller the stronger it is), each blow on its boulder and the burst, its snowball crunching
// up through the snow with each shove (a swish as it slips back, a thump into the drift), its rice
// cart creaking with each tug (a thunk as a wheel sticks), each piece of kagami-mochi plopping on,
// each pound of the mochi; a twinkle as a stack is crowned or the mochi's done.
function hearMountain(R, f) {
  const you = R.racers[R.me];
  if (R.phase === 'ready') return;
  f.mt ??= new WeakMap();
  for (const r of R.racers) {
    let s = f.mt.get(r);
    if (!s) f.mt.set(r, (s = {}));
    const far = Math.abs(r.x - you.x);
    if (far > 300) continue;
    const pan = Math.max(-0.6, Math.min(0.6, (r.x - you.x) / 260));
    const db = r.you ? 0 : -9 - (far / 300) * 6;
    // (How hard a range of Power hits: the weakest softer and lighter, the strongest full.)
    const hard = (tier) => ({ db: db - (5 - tier) * 1.6, rate: 1.12 - tier * 0.035, pan });
    const b = r.bell;
    if (b && b.done > (s.bell ?? 0)) {
      s.bell = b.done;
      sfx('mtGong', hard(b.tier));
    }
    if (b?.rung != null && !s.rung) {
      s.rung = true;
      sfx('leapStar', { pan, db: db - 4 });
    }
    const k = r.rock;
    if (k && k.done > (s.rock ?? 0)) {
      s.rock = k.done;
      if (k.broke == null) sfx('rockHit', hard(k.tier));
    }
    if (k?.broke != null && !s.broke) {
      s.broke = true;
      sfx('rockBreak', { pan, db });
    }
    const ball = r.ball;
    if (ball) {
      const beat = Math.floor((R.clock - ball.act) / ROLL_BEAT[ball.tier]);
      if (ball.parked == null && ball.slip == null && (beat !== s.ballBeat || ball.act !== s.ballAct)) {
        s.ballBeat = beat;
        s.ballAct = ball.act;
        sfx('snowCrunch', { pan, db: db - 7 + ball.tier * 0.6 });
      }
      if (ball.slip != null && ball.slip !== s.slip) {
        s.slip = ball.slip;
        sfx('snowSlip', { pan, db: db - 3 });
      }
      if (ball.parked != null && !s.parked) {
        s.parked = true;
        sfx('snowThump', { pan, db: db - 2 });
      }
    }
    const c = r.cart;
    if (c) {
      const beat = Math.floor((R.clock - c.act) / CART_BEAT[c.tier]);
      if (c.parked == null && c.stuck == null && (beat !== s.cartBeat || c.act !== s.cartAct)) {
        s.cartBeat = beat;
        s.cartAct = c.act;
        sfx('cartCreak', { pan, db: db - 9, rate: 0.92 + ((beat * 7) % 5) * 0.04 });
      }
      if (c.stuck != null && c.stuck !== s.stuck) {
        s.stuck = c.stuck;
        sfx('cartStuck', { pan, db: db - 2 });
      }
      if (c.parked != null && !s.cartParked) {
        s.cartParked = true;
        sfx('snowThump', { pan, db: db - 4 });
      }
    }
    const st = r.stack;
    if (st && st.landed.length > (s.plops ?? 0)) {
      s.plops = st.landed.length;
      sfx('mochiPlop', { pan, db: db - (st.tier >= 4 ? 0 : 2), rate: [1, 1.12, 1.4][s.plops - 1] ?? 1 });
    }
    if (st?.done != null && !s.crowned) {
      s.crowned = true;
      sfx('leapStar', { pan, db: db - 4 });
    }
    const p = r.pound;
    if (p && p.done > (s.pound ?? 0)) {
      s.pound = p.done;
      sfx('mochiPound', hard(p.tier));
    }
    if (p?.finished != null && !s.pounded) {
      s.pounded = true;
      sfx('leapStar', { pan, db: db - 4 });
    }
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
  hearPaws(world, m);
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
    // A cutscene's own sound (world/cast.js `sound`).
    else if (j.type === 'scene') sfx(j.name, { pan: j.x == null ? 0 : pan(j.x) });
    else if (j.type === 'stomp') sfx('stomp', { big: j.big, pan: pan(j.x) });
    else if (j.type === 'loot') sfx('drop', { rare: true, pan: pan(j.x) });
    else if (j.type === 'stun') sfx('stun', { pan: pan(j.x) });
    else if (j.type === 'denied') sfx('denied');
    else if (j.type === 'swing') sfx(j.pierce ? 'thrust' : 'swing', { weight: j.big ? 1.8 : j.thick > 11 ? 1.4 : 1, school: j.school, weapon: j.weapon, lead: j.in, pan: 0 });
  }
  if (hit) {
    sfx('hit', { big: hit.big, crit: hit.crit, school: hit.school, via: hit.via, weapon: hit.weapon, element: hit.element, many: hits, pan: pan(hit.x), mob: hit.mob, boss: hit.boss });
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
        sfx('step', { ground: groundOf(world), run: Math.abs(b.vx) > 90 });
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
  Object.assign(m, { job: char.job, level: char.level, map: world.map.id, dead: world.dead, gold: char.gold, ground: b.onGround, x: b.x, y: b.y, volt: world.volt, gale: world.gale, bulwark: world.bulwark });

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
  // (A cutscene can change the place's sound: festival night in the bedchamber. world/cast.js `amb`.)
  updateAmbience(world.cine?.amb ? { ...world.map, amb: world.cine.amb } : world.map, m.fightK);
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
