// The Mochi raising pace (node tools/raise-pace.mjs): how long a dedicated player takes to raise a
// Mochi with sweets alone, by its talent, and how far clicking a care button over and over gets.
const R = new URL('../src/', import.meta.url).href;
const { rollMochi } = await import(R + 'data/mochi-genes.js');
const { newRecord, feed, care, tick, canEvolve, evolve, MOCHI_SWEETS, CANT_POINTS, GRADE_POINTS } = await import(R + 'data/mochi-raise.js');
const { RACE_RANKS } = await import(R + 'data/mochi-race.js');

const hm = (s) => `${Math.floor(s / 3600)} h ${String(Math.round((s % 3600) / 60)).padStart(2, '0')} min`;
const best = (stat) => MOCHI_SWEETS.filter((sw) => sw.trains[stat]).sort((a, b) => b.trains[stat] - a.trains[stat])[0];

// A: a dedicated player, in the Garden the whole time (its time only passes there), feeding the
// strongest sweet for one stat each time its tummy has room, with unlimited ingredients, and petting
// it now and then to keep it happy. Reports when it reaches each mark.
function dedicated(grade, stat = 'run', seed = 11) {
  const rec = newRecord(rollMochi(seed, { coat: null }));
  for (const s of Object.keys(rec.stats)) rec.stats[s].grade = 'C';
  rec.stats[stat].grade = grade;
  rec.loves = null;
  rec.hates = null;
  const sw = best(stat);
  const marks = [
    ['can walk', () => rec.stats.run.points >= CANT_POINTS.run],
    ['evolves', () => rec.stage !== 'mochiko'],
    ['Beginner-strong (top of its rivals)', () => rec.stats[stat].points >= RACE_RANKS.beginner.rivals[1]],
    ['Challenge-strong', () => rec.stats[stat].points >= RACE_RANKS.challenge.rivals[1]],
    ['Master-strong', () => rec.stats[stat].points >= RACE_RANKS.master.rivals[1]],
    ['Lv 99', () => rec.stats[stat].level >= 99],
  ];
  const hit = {};
  let t = 0;
  let sweets = 0;
  const step = 30;
  while (t < 400 * 3600 && Object.keys(hit).length < marks.length) {
    tick(rec, step);
    t += step;
    if ((rec.tummy ?? 0) <= 75) {
      feed(rec, sw.id, () => 0.5);
      sweets += 1;
    }
    if (rec.mood < 80) care(rec, 'pet');
    if (canEvolve(rec)) evolve(rec, () => 0.9);
    for (const [name, ok] of marks) if (!(name in hit) && ok()) hit[name] = { t, sweets };
  }
  return { grade, sweet: sw.name, hit, marks: marks.map(([n]) => n) };
}

// B: someone clicking a care button over and over (no cooldown), 4 clicks a second.
function spam(what, stat) {
  const rec = newRecord(rollMochi(12, { coat: null }));
  rec.stats[stat].grade = 'S';
  let t = 0;
  while (rec.stats[stat].level < 99 && t < 3600) {
    care(rec, what, () => 0.5);
    tick(rec, 0.25);
    t += 0.25;
  }
  return { t, level: rec.stats[stat].level, points: rec.stats[stat].points };
}

console.log('Ranks (rival points):', Object.entries(RACE_RANKS).map(([k, v]) => `${k} ${JSON.stringify(v.points ?? v)}`).join(' | '));
console.log(`Points a level by grade: ${JSON.stringify(GRADE_POINTS)}\n`);
console.log('A. A dedicated player: in the Garden the whole time, a sweet whenever its tummy has room (unlimited ingredients):');
for (const g of ['S', 'C', 'E']) {
  const r = dedicated(g);
  console.log(`  ${g}-grade Run, fed ${r.sweet}:`);
  for (const m of r.marks) console.log(`    ${m.padEnd(38)} ${r.hit[m] ? `${hm(r.hit[m].t).padStart(11)}  (${r.hit[m].sweets} sweets)` : 'never'}`);
}
console.log('\nB. Clicking a care button over and over, 4 clicks a second:');
for (const [what, stat] of [['play', 'run'], ['wrestle', 'power']]) {
  const r = spam(what, stat);
  console.log(`  ${what} (${stat}): Lv ${r.level}, ${r.points} points after ${Math.round(r.t / 60)} min of clicking`);
}
