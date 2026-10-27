// Renders sounds and song loops off the main thread, so the game never hitches while the chip
// works. Asked for { type: 'sfx', name, sr } or { type: 'song', key, sr }; answers with the samples.

import { render } from './synth.js';
import { RECIPES, variantsOf } from './recipes.js';
import { renderSong } from './tracker.js';
import { SONGS } from './songs.js';

// Jobs wait in a line; one runs per tick so a newly asked-for song (`front`) can jump ahead.
const line = [];
let busy = false;
self.onmessage = ({ data: m }) => {
  m.front ? line.unshift(m) : line.push(m);
  if (!busy) {
    busy = true;
    setTimeout(next, 0);
  }
}

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
      for (let v = 0; v < variantsOf(m.name); v++) variants.push(render(RECIPES[m.name], m.sr, v + 1));
      self.postMessage({ type: 'sfx', name: m.name, variants }, variants.map((b) => b.buffer));
    } else if (m.type === 'song') {
      const r = renderSong(SONGS[m.key], m.sr);
      self.postMessage({ type: 'song', key: m.key, ...r }, [r.left.buffer, r.right.buffer]);
    }
  } catch (err) {
    self.postMessage({ type: 'error', key: m.key ?? m.name, message: String(err?.message ?? err) });
  }
}
