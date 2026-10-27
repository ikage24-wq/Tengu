// Renders sounds and song loops off the main thread, so the game never hitches while they're made.
// First it's handed the sample bank ({ type: 'bank', bank }); then it's asked for
// { type: 'sfx', name, sr, prio } or { type: 'song', key, sr, prio } and answers with the samples.
// Lower `prio` goes first: a song wanted right now (0), the everyday effects (1), every other
// effect (2), and songs prepared for later (3).

import { render } from './synth.js';
import { RECIPES, variantsOf } from './recipes.js';
import { renderSong } from './studio.js';
import { SONGS } from './songs.js';

let bank = null;
// Jobs wait in a line by priority (until the bank arrives); one runs per tick so a newly
// asked-for job can jump ahead.
const line = [];
let busy = false;
self.onmessage = ({ data: m }) => {
  if (m.type === 'bank') bank = m.bank;
  else {
    const i = line.findIndex((j) => j.prio > m.prio);
    i < 0 ? line.push(m) : line.splice(i, 0, m);
  }
  if (!busy && bank) {
    busy = true;
    setTimeout(next, 0);
  }
};

function next() {
  const m = line.shift();
  if (!m) {
    busy = false;
    return;
  }
  run(m);
  setTimeout(next, 0);
}

function run(m) {
  try {
    if (m.type === 'sfx') {
      const variants = [];
      for (let v = 0; v < variantsOf(m.name); v++) variants.push(render(RECIPES[m.name], m.sr, v + 1, bank));
      self.postMessage({ type: 'sfx', name: m.name, variants }, variants.map((b) => b.buffer));
    } else if (m.type === 'song') {
      const r = renderSong(SONGS[m.key], bank, m.sr);
      self.postMessage({ type: 'song', key: m.key, ...r }, [r.left.buffer, r.right.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', key: m.key ?? m.name, message: String(err?.message ?? err) });
  }
}
