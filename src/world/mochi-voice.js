// A Mochi's voice (docs/design/mochi.md step 13): its own style and pitch (data/mochi-genes.js
// `voice`), heard when it does something with feeling: a cheer, a happy hop, eating, being petted
// (happy); a sulk, a sweet it hates, a goodbye (sad); a nap (sleepy); a wave, a peek (a call). The
// world only notes it (`world.juice`); the sound is played by src/audio/listen.js and sfx.js
// `mochiVoice`. A Mochi far off screen isn't heard, and one doesn't chatter: a moment apart.

// What each action sounds like.
const MOOD = {
  cheer: 'happy', levelup: 'happy', newstyle: 'happy', eat: 'happy', pet: 'happy', tickle: 'happy', play: 'happy', born: 'happy', evolved: 'happy',
  hops: 'happy', clap: 'happy', twirl: 'happy',
  sulk: 'sad', hated: 'sad', sigh: 'sad', farewell: 'sad',
  nap: 'sleepy', yawn: 'sleepy',
  wave: 'call', peek: 'call', lookaround: 'call', full: 'call',
};
export const moodOf = (action) => MOOD[action] ?? null;
const HEARD = 420;
const APART = 1.2;
const last = new WeakMap();

// Notes Mochi `rec` saying something in `mood` at world x `x` (if it's near enough to hear and
// hasn't just spoken).
export function mochiVoice(world, rec, mood, x) {
  if (!rec || !mood || x == null || Math.abs(x - world.body.x) > HEARD) return false;
  const now = world.now;
  if (now - (last.get(rec) ?? -99) < APART) return false;
  last.set(rec, now);
  world.juice.push({ type: 'mochiVoice', style: rec.voice?.style ?? 'chirp', pitch: rec.voice?.pitch ?? 1, mood, x });
  return true;
}
// Notes it as it starts a new action (once per action).
export function voiceAction(world, rec, m, x) {
  const a = m.action;
  if (!a || m.voiced === a) return;
  m.voiced = a;
  mochiVoice(world, rec, moodOf(a.name), x);
}
