// Background music: each area's written song (songs.js), rendered once into a seamless loop
// (bank.js) and played from that buffer, so the timing is exact and the loop never shows a seam.
//
// Moving between areas, the old song fades out over a second while the new one fades in, and an
// area's song picks up where it left off if the player comes back within a minute and a half
// (towns and fields feel continuous, like MapleStory's). Bosses cut in at once on their sting.

import { audioReady, now, loop, stop } from './engine.js';
import { songBuffer, prepareSongs } from './bank.js';

let want = null;
let cur = null;
const resume = new Map();

// Where in a song (seconds into its buffer) a playing loop is at audio time `t`.
export function songPos(v, t) {
  const e = t - v.startedAt + v.offset;
  if (e < v.loopEnd) return e;
  return v.loopStart + ((e - v.loopStart) % (v.loopEnd - v.loopStart));
}

// Call every frame with the music that should be playing (or null for silence).
export function updateMusic(key) {
  if (!audioReady()) return;
  if (key === want) return;
  want = key;
  const hard = key === 'boss';
  if (cur) leave(hard ? 0.12 : 1);
  if (!key) return;
  const song = songBuffer(key, () => want === key && !cur && start(key, false));
  if (song) start(key, hard);
  // The title leads to town; get it ready.
  if (key === 'title') prepareSongs(['town']);
}

function leave(fade) {
  const t = now();
  if (cur.key !== 'boss') resume.set(cur.key, { pos: songPos(cur.v, t), at: t });
  stop(cur.v, fade);
  cur = null;
}

function start(key, hard) {
  const song = songBuffer(key);
  if (!song) return;
  const t = now();
  const back = resume.get(key);
  const offset = back && t - back.at < 90 ? back.pos : 0;
  const v = loop(song.buffer, { at: t + (hard ? 0 : 0.35), offset, loopStart: song.loopStart, loopEnd: song.loopEnd, fade: hard ? 0 : offset ? 1.2 : 0.4 });
  cur = { key, v };
}
