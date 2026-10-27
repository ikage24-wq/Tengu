// Renders sounds and song loops off the main thread, so the game never hitches while they're made.
// First it's handed the sample bank ({ type: 'bank', bank }); then it's asked for
// { type: 'sfx', name, sr, front } or { type: 'song', key, sr, front } and answers with the samples.

import { render } from './synth.js';
import { RECIPES, variantsOf } from './recipes.js';
import { renderSong } from './studio.js';
import { SONGS } from './songs.js';

let bank = null;
// Jobs wait in a line (until the bank arrives); one runs per tick so a newly asked-for song
// (`front`) can jump ahead.
const line = [];
let busy = false;
self.onmessage = ({ data: m }) => {
  if (m.type === 'bank') bank = m.bank;
  else if (m.front) line.unshift(m);
  else line.push(m);
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
