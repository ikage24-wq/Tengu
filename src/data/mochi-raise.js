// Raising a Mochi (docs/design/mochi.md, step 3): levels, points and grades; sweets (what raises its stats);
// mood and bond; the sweet/spicy lean; evolving and rebirth. Pure rules: the Garden keeps the
// records and calls these.
//
// A Mochi's record is its genes (data/mochi-genes.js rollMochi) plus what raising adds:
//   stage      'egg' | 'mochiko' | 'amamochi' | 'karamochi'
//   path       null | 'angel' | 'demon'
//   stats      { run, fly, power, stamina, swim }: { grade 'E'-'S', level 1-99, exp, points }
//   mood       0-100, how happy it is right now (it learns faster happy)
//   bond       0-1000, how close it is to you (it only grows)
//   lean       -1 (demon) to 1 (angel): sweet treats and gentle care pull it up, spicy treats and
//              rough play down; a Mochiko's sprout shows it once it's past LEAN_SHOWS either way
//   age        seconds it has lived in the Garden (this life)
//   gen        its generation: 1, then one more each rebirth
//   grown      total exp it has gained this life (evolving waits for EVOLVE.exp)
//   trend      exp each stat has had lately (fading by half every TREND.half s): what it's being
//              raised on now. A Mochiko's dough buds toward the leader, and it evolves into that
//              stat's form, or the plain form if it's been raised evenly
//   form       set on evolving: the stat it grew into, 'plain', or 'moon' (the Tsukimochi)
//   tricks     the tricks it has learned this life (each sweet teaches one, the first time)
//   gen        (see above) and `immortal`: a Tsukimochi lives forever
//   tummy      0-100, how full it is: each sweet fills it, and it empties over TUMMY.empty seconds;
//              a full Mochi won't eat (so raising takes its time)
//   hungry     its tummy has sat empty a while (HUNGER.after s): it rubs its tummy and looks round
//              for food, and its mood sinks until it's fed
import { STATS, PATHS } from './mochi-genes.js';

export const GRADES = ['E', 'D', 'C', 'B', 'A', 'S'];
// Points a level adds, by grade: an E stat at Lv 99 sits near 980, an S near 2,450 (its ceiling).
export const GRADE_POINTS = { E: 10, D: 13, C: 16, B: 19, A: 22, S: 25 };
export const MAX_LEVEL = 99;
// Exp for the next level: a little more each level (about 11,700 exp from Lv 1 to 99).
export const expToNext = (level) => 20 + 2 * level;
export const LEAN_SHOWS = 0.35;
// The points each movement style starts at (render/mochi-anim.js draws them, six a stat).
export const STYLE_POINTS = [0, 300, 700, 1100, 1600, 2100];
export const styleOf = (points) => STYLE_POINTS.reduce((t, need, i) => (points >= need ? i : t), 0);
// (A whole tummy takes an hour to empty: about four sweets an hour at most, so raising one takes
// real time; tools/raise-pace.mjs checks the pace: a top-talent Mochi Master-ready in about 32 h.)
export const TUMMY = { sweet: 25, spicy: 20, empty: 60 * 60 };
export const HUNGER = { after: 20 * 60, sink: 1 / 180 };
export const TREND = { half: 30 * 60 };
// Below these points it can't yet (render/mochi-anim.js CANT): it scoots on its bottom instead of
// walking, flails in water until it's lifted out, flops back down when it tries to fly.
export const CANT_POINTS = { run: 50, swim: 100, fly: 100 };
export const canDo = (rec, stat) => (rec.stats[stat]?.points ?? 0) >= (CANT_POINTS[stat] ?? 0);

// ---------- A new record ----------
// Fresh from the egg: every stat Lv 1 at its talent's grade, content, a little attached already.
export function newRecord(genes, { gen = 1, stats = null } = {}) {
  return {
    ...genes,
    stage: 'mochiko',
    path: null,
    stats: Object.fromEntries(STATS.map((s) => [s, stats?.[s] ? { ...stats[s] } : { grade: genes.talents?.[s] ?? 'E', level: 1, exp: 0, points: 0 }])),
    mood: 60,
    bond: genes.bond ?? 20,
    lean: 0,
    age: 0,
    gen,
    grown: 0,
    tummy: 0,
    trend: Object.fromEntries(STATS.map((s) => [s, 0])),
    form: null,
    tricks: [],
  };
}
// Runs `fn` on it and adds what changed to the result: `levels` gained in all, and each stat whose
// movement style went up (`styleUps`: [{ stat, from, to }]): something to celebrate.
function noting(rec, fn) {
  const before = Object.fromEntries(STATS.map((st) => [st, [rec.stats[st].level, styleOf(rec.stats[st].points)]]));
  const out = fn();
  if (!out) return out;
  out.levels = STATS.reduce((n, st) => n + rec.stats[st].level - before[st][0], 0);
  out.styleUps = STATS.filter((st) => styleOf(rec.stats[st].points) > before[st][1]).map((st) => ({ stat: st, from: before[st][1], to: styleOf(rec.stats[st].points) }));
  return out;
}

// ---------- Exp, levels and points ----------
// How much it takes in, as happy as it is: half at its glummest, half again at its happiest.
export const moodMul = (mood) => 0.5 + Math.max(0, Math.min(100, mood)) / 100;
// Gives stat `stat` `amount` exp (already scaled however the caller likes) and levels it up as far
// as it goes; each level adds its grade's points, give or take one (`rng`, 0-1). Returns the levels
// gained.
export function giveExp(rec, stat, amount, rng = Math.random) {
  const s = rec.stats[stat];
  if (!s || amount <= 0) return 0;
  rec.grown += amount;
  rec.trend ??= Object.fromEntries(STATS.map((st) => [st, 0]));
  rec.trend[stat] += amount;
  if (s.level >= MAX_LEVEL) return 0;
  s.exp += amount;
  let ups = 0;
  while (s.level < MAX_LEVEL && s.exp >= expToNext(s.level)) {
    s.exp -= expToNext(s.level);
    s.level += 1;
    s.points += GRADE_POINTS[s.grade] + Math.floor(rng() * 3) - 1;
    ups += 1;
  }
  if (s.level >= MAX_LEVEL) s.exp = 0;
  return ups;
}
// What it's growing into, from what it's been raised on lately: { stat, share, amount }, the
// leader and its share of the recent exp, or null if nothing yet. `plain` when nothing leads by
// enough (it's been raised evenly).
export const LEADS = { share: 0.34, gap: 0.1 };
export function trendOf(rec) {
  const t = rec.trend ?? {};
  const total = STATS.reduce((n, s) => n + (t[s] ?? 0), 0);
  if (total < 1) return null;
  const order = [...STATS].sort((a, b) => (t[b] ?? 0) - (t[a] ?? 0));
  const share = (t[order[0]] ?? 0) / total;
  const gap = share - (t[order[1]] ?? 0) / total;
  return { stat: order[0], share, amount: t[order[0]] ?? 0, plain: share < LEADS.share || gap < LEADS.gap };
}
export const totalLevels = (rec) => STATS.reduce((sum, s) => sum + rec.stats[s].level, 0);
export const bestStat = (rec) => STATS.reduce((b, s) => (rec.stats[s].points > rec.stats[b].points ? s : b), STATS[0]);

// ---------- Mood, bond, lean ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function feel(rec, { mood = 0, bond = 0, lean = 0 }) {
  rec.mood = clamp(rec.mood + mood, 0, 100);
  rec.bond = clamp(rec.bond + Math.max(0, bond), 0, 1000);
  rec.lean = clamp(rec.lean + lean, -1, 1);
}
// The way it's leaning, once it shows ('angel' / 'demon'), or null.
export const leanOf = (rec) => (rec.lean >= LEAN_SHOWS ? 'angel' : rec.lean <= -LEAN_SHOWS ? 'demon' : null);
// Time passing (`secs`): it ages, its tummy empties, and its mood drifts back toward content (60).
export function tick(rec, secs) {
  if (rec.stage === 'egg') return;
  rec.age += secs;
  if (rec.bloom > 0) rec.bloom = Math.max(0, rec.bloom - secs);
  if (rec.bredRest > 0) rec.bredRest = Math.max(0, rec.bredRest - secs);
  const fade = 0.5 ** (secs / TREND.half);
  for (const s of STATS) if (rec.trend) rec.trend[s] *= fade;
  rec.tummy = Math.max(0, (rec.tummy ?? 0) - (secs * 100) / TUMMY.empty);
  rec.emptyFor = rec.tummy <= 0 ? (rec.emptyFor ?? 0) + secs : 0;
  rec.hungry = rec.emptyFor >= HUNGER.after;
  if (rec.hungry) rec.mood = Math.max(0, rec.mood - secs * HUNGER.sink);
  const drift = secs / 120;
  if (rec.hungry) return;
  rec.mood = rec.mood > 60 ? Math.max(60, rec.mood - drift) : Math.min(60, rec.mood + drift * 0.5);
}

// ---------- Sweets ----------
// What it eats: the sixteen wagashi (sweet: they lean it angel a touch) and five spicy treats
// (they lean it demon), each raising one or two stats. Made at the Garden's kitchen from Garden
// crops, monster drops, gathered finds and fish. `kind` is the prop it holds (render/mochi-sweets.js).
// Garden crops (step 4 grows them): mochi_rice, azuki (red beans), kinako (roasted soy flour),
// fire_pepper.
export const GARDEN_CROPS = {
  mochi_rice: { name: 'Mochi Rice', color: '#fbf6ec' },
  azuki: { name: 'Red Beans', color: '#8a2e3a' },
  kinako: { name: 'Kinako', color: '#e6c56a' },
  fire_pepper: { name: 'Fire Pepper', color: '#e8483a' },
};
const sweet = (kind, name, trains, needs, more = {}) => ({ id: `msweet_${kind.replace(/ /g, '')}`, kind, name, trains, needs, taste: 'sweet', ...more });
const spicy = (id, kind, name, trains, needs) => ({ id: `msweet_${id}`, kind, name, trains, needs, taste: 'spicy' });
export const MOCHI_SWEETS = [
  sweet('dango', 'Dango', { run: 40 }, { mochi_rice: 2, cherry: 1, sprout_leaf: 1 }),
  sweet('daifuku', 'Daifuku', { stamina: 40 }, { mochi_rice: 2, azuki: 1 }),
  sweet('taiyaki', 'Taiyaki', { swim: 40 }, { azuki: 1, brownie_crumb: 2 }),
  sweet('dorayaki', 'Dorayaki', { power: 40 }, { azuki: 1, honeycomb: 1, brownie_crumb: 1 }),
  sweet('warabi mochi', 'Warabi Mochi', { swim: 30, stamina: 12 }, { crystal_gel: 1, kinako: 1 }),
  sweet('sakura mochi', 'Sakura Mochi', { fly: 40 }, { mochi_rice: 2, cherry: 1, sprite_petal: 1 }),
  sweet('kashiwa mochi', 'Kashiwa Mochi', { power: 30, stamina: 12 }, { mochi_rice: 2, azuki: 1, leaf_fragment: 1 }),
  sweet('monaka', 'Monaka', { fly: 30, run: 12 }, { azuki: 1, wind_whisker: 1 }),
  sweet('yokan', 'Yokan', { stamina: 45 }, { azuki: 2, honeycomb: 1 }),
  sweet('kakigori', 'Kakigori', { swim: 28, fly: 16 }, { snow_gem: 1, cherry: 1 }),
  sweet('manju', 'Manju', { stamina: 28, power: 16 }, { mochi_rice: 1, azuki: 1, brownie_crumb: 1 }),
  sweet('ohagi', 'Ohagi', { power: 45 }, { mochi_rice: 2, azuki: 2 }),
  sweet('anmitsu', 'Anmitsu', { run: 12, fly: 12, power: 12, stamina: 12, swim: 12 }, { crystal_gel: 1, azuki: 1, cherry: 1, honeycomb: 1 }),
  sweet('imagawayaki', 'Imagawayaki', { run: 28, power: 16 }, { azuki: 1, brownie_crumb: 1, honeycomb: 1 }),
  sweet('kinako mochi', 'Kinako Mochi', { run: 45 }, { mochi_rice: 2, kinako: 1 }),
  sweet('mitarashi', 'Mitarashi Dango', { run: 25, power: 25 }, { mochi_rice: 2, honeycomb: 1 }),
  // (No stat: a grown Mochi that eats one blooms, ready to make an egg with another: data/mochi-breed.js.)
  sweet('heart mochi', 'Heart Mochi', {}, { mochi_rice: 2, cherry: 2, honeycomb: 1 }, { heart: true }),
  spicy('senbei', 'fire senbei', 'Fire Senbei', { power: 34 }, { mochi_rice: 1, fire_pepper: 1 }),
  spicy('shichimi', 'shichimi dango', 'Shichimi Dango', { run: 34 }, { mochi_rice: 2, fire_pepper: 1 }),
  spicy('ember', 'ember arare', 'Ember Arare', { fly: 34 }, { mochi_rice: 1, wisp_flame: 1 }),
  spicy('firedrop', 'firedrop', 'Ginger Firedrop', { stamina: 34 }, { honeycomb: 1, fire_pepper: 1 }),
  spicy('hotkoi', 'hot koi', 'Hot Koi Cake', { swim: 34 }, { fish_carp: 1, fire_pepper: 1 }),
];
export const SWEET_BY_ID = Object.fromEntries(MOCHI_SWEETS.map((s) => [s.id, s]));
// The trick each sweet teaches (render/mochi-anim.js draws them), the first time it eats one.
export const TRICK_OF = {
  msweet_dango: 'roll', msweet_daifuku: 'situps', msweet_taiyaki: 'paddle', msweet_dorayaki: 'chestbeat', msweet_warabimochi: 'hum',
  msweet_sakuramochi: 'twirl', msweet_kashiwamochi: 'boxing', msweet_monaka: 'flaps', msweet_yokan: 'meditate', msweet_kakigori: 'brr',
  msweet_manju: 'plop', msweet_ohagi: 'sumo', msweet_anmitsu: 'clap', msweet_imagawayaki: 'shuffle', msweet_kinakomochi: 'hops',
  msweet_mitarashi: 'wave', msweet_senbei: 'fire', msweet_shichimi: 'sneeze', msweet_ember: 'backflip', msweet_firedrop: 'peek', msweet_hotkoi: 'sprout',
};
export const TRICKS = [...new Set(Object.values(TRICK_OF))];
// Feeds it sweet `id`: its favourite trains half again as much and delights it; the one it hates
// trains half as much and sulks it; sweet treats lean it angel, spicy ones demon. Full up, it
// won't (`refused`, the 'full' action). Returns what happened: { action ('eat' | 'hated' |
// 'full'), ups: { stat: levels }, loved, hated, refused, levels, styleUps }.
export function feed(rec, id, rng = Math.random) {
  return noting(rec, () => feedNow(rec, id, rng));
}
function feedNow(rec, id, rng) {
  const sw = SWEET_BY_ID[id];
  if (!sw) return null;
  if ((rec.tummy ?? 0) >= 100) return { action: 'full', ups: {}, refused: true, loved: false, hated: false };
  rec.tummy = Math.min(100, (rec.tummy ?? 0) + TUMMY[sw.taste]);
  // (Hungry, anything tastes good: it cheers up a bit more.)
  // (Something new to it teaches it a trick.)
  const trick = TRICK_OF[id];
  rec.tricks ??= [];
  const learned = trick && !rec.tricks.includes(trick) ? trick : null;
  if (learned) rec.tricks.push(learned);
  const starving = Boolean(rec.hungry);
  rec.hungry = false;
  rec.emptyFor = 0;
  if (starving) feel(rec, { mood: 8 });
  const loved = rec.loves === sw.kind && sw.taste === 'sweet';
  const hated = rec.hates === sw.kind && sw.taste === 'sweet';
  const foodie = rec.personality === 'foodie';
  const mul = moodMul(rec.mood) * (loved ? 1.5 : hated ? 0.5 : 1);
  const ups = {};
  for (const [stat, exp] of Object.entries(sw.trains)) ups[stat] = giveExp(rec, stat, Math.round(exp * mul), rng);
  feel(rec, {
    mood: loved ? 20 : hated ? -15 : foodie ? 10 : 6,
    bond: loved ? 8 : hated ? 0 : 3,
    lean: sw.taste === 'spicy' ? -0.06 : 0.03,
  });
  // (A Heart Mochi: a grown one blooms, unless it had an egg not long ago.)
  const bloomed = sw.heart ? canBloom(rec) : undefined;
  if (bloomed) rec.bloom = BLOOM.secs;
  return { action: hated ? 'hated' : 'eat', ups, loved, hated, learned, bloomed };
}

// ---------- Care ----------
// What you do with it. Gentle care leans it angel, rough mischievous play demon; how much each
// pleases it depends who it is. `action` is the animation it plays (render/mochi-anim.js ACTIONS).
export const CARE = {
  pet: { mood: 8, bond: 4, lean: 0.015, action: 'pet', likes: ['clingy', 'sweet', 'gentle', 'shy'], dislikes: ['loner', 'grumpy'] },
  tuck: { mood: 5, bond: 3, lean: 0.03, action: 'nap', likes: ['sleepy', 'lazy', 'dreamy'], dislikes: ['hyper'] },
  cheer: { mood: 6, bond: 3, lean: 0.015, action: 'cheer', likes: ['proud', 'showoff', 'bubbly', 'brave'], dislikes: ['timid'] },
  tickle: { mood: 6, bond: 2, lean: -0.015, action: 'tickle', likes: ['playful', 'cheeky', 'hyper', 'chatty'], dislikes: ['stoic', 'grumpy', 'timid'] },
  wrestle: { mood: 3, bond: 2, lean: -0.03, action: 'play', exp: { power: 8 }, likes: ['brave', 'sporty', 'bossy'], dislikes: ['gentle', 'shy', 'polite'] },
  prank: { mood: 2, bond: 1, lean: -0.045, action: 'sulk', likes: ['mischief', 'cheeky', 'sneaky'], dislikes: ['proud', 'dramatic', 'polite', 'sassy'] },
  play: { mood: 7, bond: 3, lean: 0, action: 'play', exp: { run: 6 }, likes: ['playful', 'hyper', 'sporty'], dislikes: [] },
};
export const CARE_EXP_EVERY = 10 * 60;
// Lifting it out of the water while it can't swim yet: it clings on, grateful.
export function rescue(rec) {
  feel(rec, { mood: 12, bond: 5, lean: 0.01 });
  return { action: 'pet' };
}
// Does `what` to it. One it likes pleases it twice as much; one it dislikes sulks it (and a prank
// on one who likes them is a laugh, so it cheers instead). Returns { action, ups }.
export function care(rec, what, rng = Math.random) {
  return noting(rec, () => careNow(rec, what, rng));
}
function careNow(rec, what, rng) {
  const c = CARE[what];
  if (!c) return null;
  const likes = c.likes.includes(rec.personality);
  const dislikes = c.dislikes.includes(rec.personality);
  const mood = dislikes ? -Math.max(4, c.mood) : c.mood * (likes ? 2 : 1);
  feel(rec, { mood, bond: dislikes ? 0 : c.bond * (likes ? 1.5 : 1), lean: c.lean });
  // (What playing teaches it, only now and then: CARE_EXP_EVERY seconds of its life apart for each
  // kind of care, so clicking away at it doesn't raise it. Its mood and bond take any amount.)
  const ups = {};
  rec.careExp ??= {};
  if (c.exp && (rec.age ?? 0) - (rec.careExp[what] ?? -Infinity) >= CARE_EXP_EVERY) {
    rec.careExp[what] = rec.age ?? 0;
    for (const [stat, exp] of Object.entries(c.exp)) ups[stat] = giveExp(rec, stat, Math.round(exp * moodMul(rec.mood)), rng);
  }
  const action = what === 'prank' ? (likes ? 'cheer' : 'sulk') : dislikes ? 'sulk' : c.action;
  return { action, ups };
}

// ---------- Evolving ----------
// A Mochiko evolves once it has grown enough (EVOLVE.exp taken in, its levels adding up to
// EVOLVE.levels) and lived long enough (EVOLVE.age seconds), and only when happy.
export const EVOLVE = { exp: 3000, levels: 40, age: 2 * 3600, mood: 50 };
// Blooming (a Heart Mochi): how long a grown Mochi blooms, and how long after having an egg before it
// can again (garden time, seconds).
export const BLOOM = { secs: 10 * 60, rest: 60 * 60 };
export const canBloom = (rec) => ['amamochi', 'karamochi', 'tsukimochi'].includes(rec.stage) && !(rec.bredRest > 0);
export const canEvolve = (rec) => rec.stage === 'mochiko' && rec.grown >= EVOLVE.exp && totalLevels(rec) >= EVOLVE.levels && rec.age >= EVOLVE.age && rec.mood >= EVOLVE.mood;
// Which path it takes: the way it leans; dead even, its personality decides.
const ANGELIC = ['gentle', 'sweet', 'polite', 'shy', 'dreamy', 'clingy', 'timid', 'stoic', 'artsy', 'sleepy', 'bubbly', 'foodie', 'lazy', 'curious', 'chatty', 'proud'];
export const pathFor = (rec) => (rec.lean > 0.05 ? 'angel' : rec.lean < -0.05 ? 'demon' : ANGELIC.includes(rec.personality) ? 'angel' : 'demon');
const raise = (grade) => GRADES[Math.min(GRADES.length - 1, GRADES.indexOf(grade) + 1)];
// The Tsukimochi (the moon mochi, after the rabbit in the moon who pounds it): a Mochi on its
// third life or later, very happy, that has learned every trick and been raised evenly becomes,
// when it evolves, this legendary form on its path, glowing like the moon. It lives forever (no
// rebirth) and its grades stay as they are.
export const ASCEND = { gen: 3, mood: 85 };
export const canAscend = (rec) => rec.gen >= ASCEND.gen && rec.mood >= ASCEND.mood && TRICKS.every((t) => rec.tricks?.includes(t)) && Boolean(trendOf(rec)?.plain);
// Evolves it (call when canEvolve): it takes its path and grows into the form of what it's been
// raised on lately (that stat's grade goes up one), or the plain form if it was raised evenly
// (then its best stat's does); each other stat has a one in five chance to. Returns { path,
// stage, form, raised: [stats] }.
export function evolve(rec, rng = Math.random) {
  const path = pathFor(rec);
  rec.path = path;
  rec.stage = PATHS[path];
  const tr = trendOf(rec);
  if (canAscend(rec)) {
    rec.stage = 'tsukimochi';
    rec.form = 'moon';
    rec.immortal = true;
    feel(rec, { mood: 15, bond: 50 });
    return { path, stage: rec.stage, form: rec.form, raised: [] };
  }
  rec.form = tr && !tr.plain ? tr.stat : 'plain';
  const best = rec.form === 'plain' ? bestStat(rec) : rec.form;
  const raised = [];
  for (const s of STATS) {
    const st = rec.stats[s];
    if (st.grade !== 'S' && (s === best || rng() < 0.2)) {
      st.grade = raise(st.grade);
      raised.push(s);
    }
  }
  feel(rec, { mood: 15, bond: 20 });
  return { path, stage: rec.stage, form: rec.form, raised };
}

// ---------- Rebirth ----------
// A grown Mochi that has lived a full, happy life (REBIRTH.age seconds, mood at REBIRTH.mood)
// goes back into its mortar and is reborn as an egg: the same Mochi, a generation on. Its grades
// can rise (one level up for any stat at Lv 50 or more, three in five times; always at Lv 99), its
// levels start again at 1 with a tenth of its points as a head start, and it keeps its bond.
export const REBIRTH = { age: 20 * 3600, mood: 80 };
export const canRebirth = (rec) => (rec.stage === 'amamochi' || rec.stage === 'karamochi') && rec.age >= REBIRTH.age && rec.mood >= REBIRTH.mood;
export function rebirth(rec, rng = Math.random) {
  const stats = {};
  const raised = [];
  for (const s of STATS) {
    const st = rec.stats[s];
    let grade = st.grade;
    if (grade !== 'S' && (st.level >= MAX_LEVEL || (st.level >= 50 && rng() < 0.6))) {
      grade = raise(grade);
      raised.push(s);
    }
    stats[s] = { grade, level: 1, exp: 0, points: Math.round(st.points * 0.1) };
  }
  const egg = newRecord({ ...rec, tricks: [] }, { gen: rec.gen + 1, stats });
  egg.stage = 'egg';
  egg.bond = rec.bond;
  return { egg, raised };
}
