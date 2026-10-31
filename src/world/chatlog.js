// One gate for everything the other players say, so chat reads like a real server instead of a
// firehose: nobody says a line someone already said in the last ten minutes (counting lines that
// only differ by names and numbers as the same), nobody talks more than once every half minute of
// their own accord, and your chat log takes a line at most every few seconds, a handful a minute.
// Anything past the log's pace is still said, over the speaker's head, just not written in the
// log. Lines meant for you (an answer, your party) skip the waits, never the no-repeats rule.

const SAME_FOR = 600;
const GAP = 4;
const PER_MIN = 7;
const OWN_GAP = 30;

// What a line comes down to: no names, numbers, emoticons or punctuation.
export function shape(text, names = []) {
  let s = ` ${text.toLowerCase()} `;
  for (const n of names) if (n) s = s.split(n.toLowerCase()).join(' ');
  return s.replace(/[0-9]+/g, '#').replace(/[^a-z# ]+/g, ' ').replace(/\s+/g, ' ').trim();
}

// Whether that line (or one just like it) was said lately.
export function stale(world, text) {
  const g = world.chatGate;
  const key = shape(text, [world.char?.name]);
  return Boolean(g && g.said.has(key) && world.now - g.said.get(key) < SAME_FOR);
}

// `bot` says `text`: over their head, and in your chat log when it's their map and the log has
// room. `important` skips the waits (an answer to you, party chat). `repeat` lets a line through
// that was said lately (the middle of a little scripted chat between two). `log: false` keeps it
// over their head only. Returns whether it was said.
export function botChat(world, bot, text, { color = '#e6dcff', prefix = '', important = false, repeat = false, log = true } = {}) {
  if (!text) return false;
  const g = (world.chatGate ??= { last: -99, recent: [], said: new Map() });
  const key = shape(text, [world.char?.name, bot.name]);
  if (!key || (!repeat && g.said.has(key) && world.now - g.said.get(key) < SAME_FOR)) return false;
  if (!important && !repeat && world.now - (bot.chatAt ?? -99) < OWN_GAP) return false;
  bot.chatAt = world.now;
  g.said.set(key, world.now);
  if (g.said.size > 400) for (const [k, t] of g.said) if (world.now - t >= SAME_FOR) g.said.delete(k);
  bot.bubble = { text, t: 4.5 };
  if (!log || bot.map !== world.map.id || !world.log) return true;
  g.recent = g.recent.filter((t) => world.now - t < 60);
  if (!important && (world.now - g.last < GAP || g.recent.length >= PER_MIN)) return true;
  g.last = world.now;
  g.recent.push(world.now);
  world.log(`${prefix}${bot.name}: ${text}`, color);
  return true;
}
