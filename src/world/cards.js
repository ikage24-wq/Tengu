// Tilly's card game at the Gilded Kettle: Higher or Lower, with her own deck (ui/cards.js draws
// the table).
//
// Her deck: ace to king (1-13) in four suits, kettles, coins, lanterns and moons, shuffled. Put
// down a stake and she turns up a card; say whether the next is higher or lower. Right, and the
// pot grows (STEPS); wrong, and the stake is hers; the same rank is a draw (the pot stands, play
// on). Cash out whenever you like, and at the top of the ladder it cashes out by itself.
// The ladder is set so the house keeps a small edge (about 5% at best play): a bit of fun, never a
// way to farm gold. She plays ROUNDS rounds a day ("my mum says").
// She cheats, badly: now and then (PEEK) she fumbles the deck and you glimpse the next card.
// char.cards = { day, rounds }; the game in progress is world.cardGame (not saved).

import { today } from '../core/quests.js';

export const STAKES = [50, 100, 250, 500];
export const STEPS = [1.2, 1.5, 1.9, 2.4, 3.1];
export const ROUNDS = 12;
const PEEK = 0.15;
export const SUITS = [
  { key: 'kettle', name: 'Kettles', color: '#d8704a' },
  { key: 'coin', name: 'Coins', color: '#e0a020' },
  { key: 'lantern', name: 'Lanterns', color: '#e0507a' },
  { key: 'moon', name: 'Moons', color: '#6a6ad8' },
];
export const RANK_NAMES = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

const QUIPS = {
  start: ["Shuffle shuffle shuffle! ...Okay that's enough shuffling.", "New deck! I only lost two cards this time.", 'Ready? I was born ready. Mum says I was born early.'],
  right: ['Hmph. Lucky.', "Okay you're good. Again!", 'Whaaat. Did you see my cards?', 'Beginner\'s luck! ...You said that last time.'],
  wrong: ['HA! The cards love me!', 'Better luck next time! Pay up!', "I'm the best! Don't tell Juniper.", 'Mine! All mine!'],
  push: ['Same card! The deck is confused.', 'A tie! Nobody wins! Again!'],
  peek: ['Oops! Did you see that? You did NOT see that.', "*a card slips out of Tilly's sleeve*", "Don't look! ...You looked."],
  cash: ["Fine, take it. I'll win it back.", 'Cashing out? Scaredy-cat!', 'Spend it on cocoa. Not for Wendell.'],
  out: ["That's all my rounds today. Mum says. Come back tomorrow!"],
};
const quip = (kind, rng) => QUIPS[kind][Math.floor(rng() * QUIPS[kind].length)];

function shuffled(rng) {
  const deck = [];
  for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) deck.push({ rank: r, suit: s });
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

const tally = (world) => {
  const day = today(world.dayClock?.() ?? new Date());
  if (world.char.cards?.day !== day) world.char.cards = { day, rounds: 0 };
  return world.char.cards;
};
export const roundsLeft = (world) => ROUNDS - tally(world).rounds;

// Starts a round for `stake` gold. Returns why not, or null.
export function deal(world, stake, rng = Math.random) {
  const char = world.char;
  if (world.cardGame?.live) return 'Finish this round first!';
  if (roundsLeft(world) <= 0) return quip('out', rng);
  if (!STAKES.includes(stake)) return 'Pick a stake.';
  if (char.gold < stake) return 'Not enough gold.';
  char.gold -= stake;
  tally(world).rounds += 1;
  const deck = shuffled(rng);
  const card = deck.pop();
  world.cardGame = { live: true, stake, steps: 0, deck, card, last: null, peek: null, say: quip('start', rng), result: null };
  maybePeek(world.cardGame, rng);
  return null;
}
function maybePeek(g, rng) {
  g.peek = g.deck.length && rng() < PEEK ? g.deck[g.deck.length - 1] : null;
  if (g.peek) g.say = quip('peek', rng);
}

// What the pot is worth now.
export const pot = (g) => Math.round(g.stake * (g.steps ? STEPS[g.steps - 1] : 1));

// Guesses the next card: 'higher' or 'lower'.
export function guess(world, way, rng = Math.random) {
  const g = world.cardGame;
  if (!g?.live) return 'Deal first!';
  const next = g.deck.pop();
  g.last = g.card;
  g.card = next;
  g.peek = null;
  if (next.rank === g.last.rank) {
    g.say = quip('push', rng);
    maybePeek(g, rng);
    return null;
  }
  const right = way === 'higher' ? next.rank > g.last.rank : next.rank < g.last.rank;
  if (!right) {
    g.live = false;
    g.result = { won: 0 };
    g.say = quip('wrong', rng);
    return null;
  }
  g.steps += 1;
  g.say = quip('right', rng);
  // The top of the ladder pays out by itself.
  if (g.steps >= STEPS.length) return cashOut(world, rng);
  maybePeek(g, rng);
  return null;
}

// Takes the pot.
export function cashOut(world, rng = Math.random) {
  const g = world.cardGame;
  if (!g?.live) return 'Nothing to take.';
  if (!g.steps) return 'Win at least one first!';
  const won = pot(g);
  world.char.gold += won;
  g.live = false;
  g.result = { won };
  g.say = quip('cash', rng);
  world.log(`You won ${won.toLocaleString()} gold at Tilly's table!`, '#ffe36b');
  return null;
}
