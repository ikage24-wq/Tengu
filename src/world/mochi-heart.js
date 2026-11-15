// A Mochi's heart (2026-11-15; the player asked for Mochi "as autonomous as possible, so realistic,
// the best AI"): what it feels, the little habits that are its own, and what it remembers of you.
// Pure rules here (no world): world/garden-life.js lives them out, render/garden.js shows them.
//
// Feelings. Besides its needs (world/mochi-brain.js), a Mochi has a feeling now and then, set off by
// what happens to it or by how it is: thrilled by a game, proud of a trick it showed a friend,
// sulky when a rival snubs it, lonely with no friend about, sleepy, bored, shy, curious about
// something new, full of love for you. A feeling shows on its face and in how it walks, leans what
// it wants to do next (a lonely one goes looking for a friend, a sulky one wants to be left alone),
// fades as time goes on - and some are catching: a happy one cheers up a friend beside it, a sleepy
// one sets the next yawning.
//
// Habits. Each Mochi has two of its own, from when it hatched: one hums as it walks, one collects
// little treasures, one loves the rain, one stretches every morning at the well... (QUIRKS).
//
// Memory. It remembers you: when it last saw you, how often you come, what sweets you've given it.
// One that loves you misses you while you're away, and brings you little presents.

export const FEELINGS = {
  joy: { icon: 'note', face: { mouth: 'D', closed: [true, true], sprout: 'happy' }, walk: 1.15, wants: { play: 1.3, social: 1.2, ride: 1.2 }, spread: 0.42, secs: 14, shows: 0.5 },
  excited: { icon: 'bang', face: { mouth: 'D', wide: true, sprout: 'excited' }, walk: 1.35, wants: { play: 1.4, ride: 1.4 }, spread: 0.6, secs: 9 },
  proud: { icon: 'star', face: { mouth: 'smirk', sprout: 'excited' }, walk: 1.1, wants: { social: 1.3, play: 1.1 }, spread: 0, secs: 12 },
  loving: { icon: 'heart', face: { mouth: 'mochiw', blush: 1.9, closed: [true, true], sprout: 'happy' }, walk: 1, wants: { social: 1.6, rest: 1.1 }, spread: 0.35, secs: 16 },
  sulky: { icon: 'cloud', face: { mouth: 'mochipout', brows: [[-0.4, 0.8], [-0.4, 0.8]], blush: 1.6, sprout: 'sad' }, walk: 0.72, wants: { social: 0.45, rest: 1.4, explore: 1.3, play: 0.7 }, spread: 0, secs: 20 },
  lonely: { icon: 'tear', face: { mouth: 'mochiflat', eyes: 'half', brows: [[0.5, -0.7], [0.5, -0.7]], sprout: 'sad' }, walk: 0.8, wants: { social: 2.4, play: 0.7 }, spread: 0, secs: 14 },
  sleepy: { icon: 'zzz', face: { eyes: 'half', mouth: 'mochio', sprout: 'sleepy' }, walk: 0.7, wants: { rest: 2.1, play: 0.6, ride: 0.6 }, spread: 0.3, secs: 12 },
  bored: { icon: 'dots', face: { mouth: 'mochiflat', eyes: 'half' }, walk: 0.85, wants: { play: 1.7, explore: 1.6, social: 1.4, rest: 0.6 }, spread: 0, secs: 12 },
  shy: { icon: 'sweat', face: { mouth: 'mochiwave', blush: 2, glance: -1 }, walk: 0.9, wants: { social: 0.7, rest: 1.2 }, spread: 0, secs: 8 },
  curious: { icon: 'q', face: { mouth: 'mochio', sprout: 'curious' }, walk: 1.15, wants: { explore: 1.9 }, spread: 0.3, secs: 9 },
};
// (The sad ones, that a kind friend comes over to comfort.)
export const SAD = new Set(['sulky', 'lonely']);

// Sets feeling `kind` on Mochi entry `e` at strength `k` (0-1) - unless it's already feeling
// something stronger. `now`: world seconds. Returns true if it took.
export function feel(e, kind, k, now, cause = null) {
  const F = FEELINGS[kind];
  if (!F) return false;
  const cur = e.feel && now < e.feel.until ? e.feel : null;
  if (cur && cur.kind !== kind && cur.k > k + 0.05) return false;
  const until = now + F.secs * (0.6 + 0.4 * k);
  e.feel = cur?.kind === kind ? { ...cur, k: Math.max(cur.k, k), until: Math.max(cur.until, until), cause: cause ?? cur.cause } : { kind, k, t0: now, until, cause };
  return true;
}
export const feelingOf = (e, now) => (e?.feel && now < e.feel.until ? e.feel : null);
// How much a feeling leans an option (by its kind: play, social, rest, ride, explore, snack, chore).
export function feelWant(e, o, now) {
  const f = feelingOf(e, now);
  if (!f) return 1;
  const lean = FEELINGS[f.kind].wants[o.kind] ?? FEELINGS[f.kind].wants[o.like] ?? 1;
  // (Strongly felt, it leans all the way; faintly, hardly at all.)
  return 1 + (lean - 1) * Math.min(1, f.k * 1.2);
}

// ---------- Habits ----------
export const QUIRKS = {
  hummer: { name: 'Hums as it walks' },
  collector: { name: 'Collects little treasures' },
  rainlover: { name: 'Loves the rain' },
  stargazer: { name: 'Gazes at the evening sky' },
  earlybird: { name: 'Stretches every morning' },
  wary: { name: 'Wary of water' },
  twirler: { name: 'Twirls when happy' },
  snacker: { name: 'Always a bit peckish' },
  sniffer: { name: 'Sniffs every flower' },
  cuddler: { name: 'Loves a cuddle' },
  napper: { name: 'Naps anywhere' },
  showy: { name: 'Shows off to anyone watching' },
};
const QUIRK_IDS = Object.keys(QUIRKS);
const hash = (n) => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
// Its two habits (picked once, from its seed, and kept on its record).
export function quirksOf(rec) {
  if (rec.quirks?.length) return rec.quirks;
  const a = Math.floor(hash((rec.seed ?? 1) * 0.613) * QUIRK_IDS.length) % QUIRK_IDS.length;
  let b = Math.floor(hash((rec.seed ?? 1) * 1.771 + 3) * QUIRK_IDS.length) % QUIRK_IDS.length;
  if (b === a) b = (a + 1 + Math.floor(hash(rec.seed ?? 1) * (QUIRK_IDS.length - 1))) % QUIRK_IDS.length;
  rec.quirks = [QUIRK_IDS[a], QUIRK_IDS[b]];
  return rec.quirks;
}
export const hasQuirk = (rec, q) => quirksOf(rec).includes(q);

// ---------- What it remembers of you ----------
// { seen: when it last saw you (real seconds), visits, given: { sweet id: how many }, gifts: how
// many presents it has brought you, giftDay: the day it last did }.
export const memoryOf = (rec) => (rec.memory ??= { seen: 0, visits: 0, given: {}, gifts: 0, giftDay: -1 });
// How it takes you coming back after `away` seconds: one that loves you missed you (more the longer
// you were gone), one that hardly knows you is shy of you again after a long time away.
export function welcomeOf(rec, away) {
  const bond = rec.bond ?? 0;
  if (away < 3 * 3600) return null;
  if (bond >= 150) return { kind: 'missed', k: Math.min(1, 0.55 + away / (3 * 86400)) };
  if (away > 2 * 86400) return { kind: 'shy', k: 0.6 };
  return null;
}
// Whether today's the day for a present (one that loves you, not yet today, a little more likely
// for a collector of treasures): `day` the real day number, `roll` 0-1.
export function giftDue(rec, day, roll) {
  const m = memoryOf(rec);
  if ((rec.bond ?? 0) < 450 || m.giftDay === day) return false;
  return roll < (hasQuirk(rec, 'collector') ? 0.55 : 0.3);
}
// The present it brings: what it found, for its likes - a flower, a shiny pebble, or (lucky!) a
// four-leaf clover.
export const GIFTS = ['mochi_daisy', 'mochi_pebble', 'mochi_clover'];
export const giftOf = (rec, roll) => (roll > 0.88 ? 'mochi_clover' : hasQuirk(rec, 'collector') || roll > 0.5 ? 'mochi_pebble' : 'mochi_daisy');

// ---------- What two Mochi do together ----------
// The game or the time together a Mochi asks a friend for, by its nature (and a kind one, seeing a
// friend sad, comes to comfort it; a gentle one makes up with one it fell out with).
const GAME_OF = {
  playful: 'tag', hyper: 'tag', cheeky: 'tag', sporty: 'sumo', mischief: 'tag', brave: 'sumo', sneaky: 'hide',
  shy: 'hide', timid: 'hide', clingy: 'hide', curious: 'hide', nosy: 'hide',
  showoff: 'trick', proud: 'trick', dramatic: 'dance', cool: 'dance', artsy: 'dance', sassy: 'dance', bubbly: 'dance',
  foodie: 'snack', lazy: 'snack', sleepy: 'snack',
  chatty: 'chat', sweet: 'chat', gentle: 'chat', polite: 'chat', dreamy: 'chat', bossy: 'chat', stoic: 'chat', grumpy: 'chat', loner: 'chat',
};
export const KIND_HEARTS = new Set(['gentle', 'sweet', 'clingy', 'polite', 'dreamy', 'shy']);
// (Mostly its favourite; now and then, for a change, something else - `roll` 0-1.)
const CHANGE = ['tag', 'hide', 'dance', 'snack', 'chat', 'trick', 'sumo'];
export function gameFor(rec, other, now, roll = 0) {
  if (SAD.has(other.feel && now < other.feel.until ? other.feel.kind : '') && (KIND_HEARTS.has(rec.personality) || hasQuirk(rec, 'cuddler'))) return 'comfort';
  let g = GAME_OF[rec.personality] ?? 'chat';
  if (roll > 0.6) g = CHANGE[Math.floor(((roll - 0.6) / 0.4) * CHANGE.length) % CHANGE.length];
  if (g === 'trick' && !(rec.tricks?.length)) g = 'dance';
  return g;
}
// Whether `rec` takes up `inviter`'s offer (a game of `kind`): how well they get on, whether it's in
// the mood (a sulky one wants to be left alone - though not when it's comfort it's offered), how
// much it needs some fun or company, and its whim (`roll` 0-1).
export function accepts(rec, friendship, kind, mood, needs, roll) {
  if (kind === 'comfort' || kind === 'makeup') return roll < (kind === 'makeup' ? 0.45 + friendship / 120 : 0.92);
  let s = 0.5 + friendship / 110 + ((100 - (needs.fun ?? 60)) / 100) * 0.35 + ((100 - (needs.social ?? 60)) / 100) * 0.3;
  if (mood === 'sulky') s -= 0.6;
  if (mood === 'sleepy') s -= 0.35;
  if (mood === 'lonely' || mood === 'bored') s += 0.4;
  if (['grumpy', 'loner'].includes(rec.personality)) s -= 0.35;
  return s + (roll - 0.5) * 0.4 > 0.45;
}
// What two Mochi chat about: picture words, from what they love and what's going on.
export const TOPICS = ['sweet', 'ball', 'kite', 'sun', 'flower', 'heart', 'star', 'fish', 'note', 'rain', 'moon', 'you'];
export function topicsFor(rec, other, roll, weather = null) {
  const out = [];
  const likes = Object.entries(rec.likes ?? {}).sort((a, b) => b[1] - a[1]).map(([k]) => k);
  const pick = (k) => ({ swim: 'fish', run: 'ball', ride: 'kite', play: 'ball', snack: 'sweet', rest: 'moon', explore: 'flower', social: 'heart', chore: 'flower' }[k]);
  if (likes[0]) out.push(pick(likes[0]));
  if (weather === 'rain') out.push('rain');
  if ((rec.bond ?? 0) > 300) out.push('you');
  out.push(TOPICS[Math.floor(roll * TOPICS.length) % TOPICS.length]);
  const theirs = Object.entries(other.likes ?? {}).sort((a, b) => b[1] - a[1])[0]?.[0];
  if (theirs) out.push(pick(theirs));
  return [...new Set(out.filter(Boolean))].slice(0, 4);
}
