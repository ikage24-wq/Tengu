// The Mochi diary (2026-11-15): the Mochi live their own lives in the garden, and you miss most of
// it while you're away - so the garden keeps a little diary, a page a day, of what they got up to:
// who played tag with whom, who comforted a sad friend, who brought you a present, who came to see
// the new fountain. Read in the Mochi album (ui/mochi-album.js, the Diary page).
//
// Kept on the garden: `garden.diary = [{ day: '2026-11-15', notes: [{ k, who: [seeds], n: [names],
// x, c, v }] }]`, oldest day first. The same thing twice in a day (the same two playing tag again) is
// counted, not written twice; some things (sitting by you, missing you, the rain) gather everyone
// who did them into one note ("Pip, Momo and Hana sat by you a while"). A day holds PER_DAY notes -
// once it's full, something new takes the place of one of whatever there's most of, so the page
// keeps the day's variety - and the diary the last DAYS days.

export const PER_DAY = 14;
export const DAYS = 14;

// What's written, by kind: its picture (render/mochi-hearts.js drawIcon) and a few ways to say it
// ({a}, {b}: the Mochi, {x}: the thing). The way is picked from the pair, so it doesn't change.
export const LINES = {
  tag: { icon: 'ball', say: ['{a} and {b} played tag till they puffed.', '{a} and {b} chased round and round at tag.', 'Tag! {a} and {b} took turns being it.'] },
  hide: { icon: 'q', say: ['{b} counted to three and found {a} hiding.', '{a} hid, and {b} looked everywhere.', 'Hide-and-seek: {b} found {a} in the end!'] },
  chat: { icon: 'heart', say: ['{a} and {b} had a long chat about {x}.', '{a} told {b} all about {x}.'] },
  trick: { icon: 'star', say: ['{a} showed {b} a trick. {b} clapped!', '{a} did a trick for {b}, and was so proud.'] },
  dance: { icon: 'note', say: ['{a} and {b} danced together.', '{a} and {b} had a little dance.'] },
  snack: { icon: 'sweet', say: ['{a} and {b} shared a snack.', '{a} and {b} had a picnic snack together.'] },
  comfort: { icon: 'heart', say: ['{b} was sad, so {a} came over for a hug.', '{a} cheered {b} up with a pat and a hug.'] },
  makeup: { icon: 'heart', say: ['{a} and {b} made up. Friends again!'] },
  squabble: { icon: 'anger', say: ['{a} and {b} had a squabble and stomped off.', '{a} and {b} fell out a bit.'] },
  decline: { icon: 'cloud', say: ['{a} asked {b} to play, but {b} said no.'] },
  seesaw: { icon: 'kite', say: ['{a} and {b} rode the see-saw. Up, down, up!'] },
  hatched: { icon: 'star', say: ['{a} hatched! A brand-new little Mochiko.'] },
  evolved: { icon: 'star', say: ['{a} glowed, and grew up into {x}!'] },
  reborn: { icon: 'star', say: ['{a} went back to its egg, and hatched a little Mochiko again.'] },
  pound: { icon: 'sweet', say: ['{a} and {b} pounded mochi for the moon festival.', '{a} swung the mallet and {b} turned the mochi.'] },
  moon: { icon: 'moon', say: ['{a} watched the full moon rise, with a dango.', '{a} sat out late under the harvest moon.'], group: true },
  sumo: { icon: 'star', say: ['{a} and {b} had a sumo match on the grass - {x} won!', '{a} and {b} stamped, shoved and giggled: a sumo match, and {x} won.'] },
  hanami: { icon: 'flower', say: ['{a} had a picnic under the blossom.'], group: true },
  boat: { icon: 'star', say: ['{a} set a lantern boat afloat on the pond.'], group: true },
  hanabi: { icon: 'star', say: ['{a} watched the fireworks with a sparkler.'], group: true },
  snowball: { icon: 'ball', say: ['{a} and {b} had a snowball fight.', '{a} got {b} with a snowball - and {b} got it back!'] },
  litlantern: { icon: 'star', say: ['{a} lit the snow lanterns at dusk.'], group: true },
  warm: { icon: 'heart', say: ['{a} sat up late by the snow lanterns, warm and cosy.'], group: true },
  sumoring: { icon: 'star', say: ['{a} won the {x} sumo, all three bouts!'] },
  egg: { icon: 'star', say: ['{a} and {b} nuzzled and danced, and there was an egg!'] },
  gift: { icon: 'flower', say: ['{a} found {x} and brought it to you.'] },
  missed: { icon: 'heart', say: ['{a} missed you, and ran up for a hug.'], group: true },
  sitby: { icon: 'you', say: ['{a} sat by you a while.', '{a} came and sat beside you.'], group: true },
  news: { icon: 'q', say: ['{a} came to see the new {x}.'], group: true },
  hello: { icon: 'q', say: ['{a} came to say hello to {b}, who is new here.'] },
  rain: { icon: 'rain', say: ['{a} played out in the rain, and loved it.'], group: true },
};
// (Things that last a while, written once a day, not counted each moment.)
const ONCE = new Set(['missed', 'sitby', 'news', 'hello', 'rain', 'moon', 'litlantern', 'warm', 'hanami', 'boat', 'hanabi']);
// The day, as the diary keys it (the player's own calendar).
export const diaryDay = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
// What a chat was about (its first picture word), in words.
export const TOPIC_WORDS = {
  sweet: 'sweets', ball: 'balls', kite: 'kites', sun: 'the sunshine', flower: 'flowers', heart: 'friends', star: 'the stars',
  fish: 'fish', note: 'songs', rain: 'the rain', moon: 'the moon', you: 'you',
};

const hash = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};

// Writes in `garden`'s diary for `day`: what happened (`k`), to whom (`who`: records, one or two),
// and the thing (`x`, a word). Returns the note.
export function noteDiary(garden, day, k, who, x = null) {
  if (!garden || !LINES[k] || !who?.length) return null;
  const diary = (garden.diary ??= []);
  let page = diary[diary.length - 1];
  if (page?.day !== day) {
    page = { day, notes: [] };
    diary.push(page);
    while (diary.length > DAYS) diary.shift();
  }
  const seeds = who.map((r) => r.seed);
  // (The same two, the same thing, the same day: counted. Either way round, for what they did together.)
  const same = (n) => n.k === k && n.x === x && (n.who.join() === seeds.join() || (who.length === 2 && n.who.join() === [...seeds].reverse().join()));
  const old = page.notes.find(same);
  if (old) {
    if (ONCE.has(k)) return old;
    old.c = (old.c ?? 1) + 1;
    return old;
  }
  // (One more who did it, for a gathering note.)
  const gather = LINES[k].group && page.notes.find((n) => n.k === k && n.x === x);
  if (gather) {
    if (!gather.who.includes(seeds[0]) && gather.who.length < 4) {
      gather.who.push(seeds[0]);
      gather.n.push(who[0].name ?? 'Mochi');
    }
    return gather;
  }
  const note = { k, who: seeds, n: who.map((r) => r.name ?? 'Mochi'), x, v: Math.floor(hash(seeds[0] * 0.31 + (seeds[1] ?? 0) * 0.17) * 8) };
  if (page.notes.length >= PER_DAY) {
    // (Full: in place of one of whatever there's most of - unless that's this.)
    const many = {};
    for (const n of page.notes) many[n.k] = (many[n.k] ?? 0) + 1;
    const [top, most] = Object.entries(many).sort((p, q) => q[1] - p[1])[0];
    if (top === k || most <= (many[k] ?? 0) + 1) return null;
    // (The first of them that happened only once goes; failing that, the first of them.)
    const one = page.notes.findIndex((n) => n.k === top && !(n.c > 1));
    page.notes.splice(one >= 0 ? one : page.notes.findIndex((n) => n.k === top), 1);
  }
  page.notes.push(note);
  return note;
}

// The note as words: [{ text, name? }] pieces, the names marked (so they can be drawn bold).
export function diaryWords(note, nameOf = null) {
  const L = LINES[note.k];
  const say = L.say[(note.v ?? Math.floor(hash((note.who[0] ?? 1) * 0.31 + (note.who[1] ?? 0) * 0.17) * 8)) % L.say.length];
  let names = note.who.map((s, i) => nameOf?.(s) ?? note.n[i] ?? 'Mochi');
  // (Everyone who did it, for a gathering note: "Pip, Momo and Hana".)
  if (L.group && names.length > 1) names = [names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1]];
  const thing = TOPIC_WORDS[note.x] ?? note.x ?? '';
  const out = [];
  for (const part of say.split(/(\{[abx]\})/)) {
    if (!part) continue;
    if (part === '{a}') out.push({ text: names[0], name: true });
    else if (part === '{b}') out.push({ text: names[1] ?? 'a friend', name: true });
    else if (part === '{x}') out.push({ text: thing });
    else out.push({ text: part });
  }
  if ((note.c ?? 1) > 1) out.push({ text: ` (${note.c} times!)`, muted: true });
  return out;
}

// The day as a heading: Today, Yesterday, or the date ("Nov 12").
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export function dayName(day, today, yesterday) {
  if (day === today) return 'Today';
  if (day === yesterday) return 'Yesterday';
  const [, m, d] = day.split('-').map(Number);
  return `${MONTHS[m - 1] ?? ''} ${d}`;
}
