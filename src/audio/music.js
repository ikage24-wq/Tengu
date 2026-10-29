// Background music: each area's written song (songs.js), rendered once into a seamless loop
// (bank.js) and played from that buffer, so the timing is exact and the loop never shows a seam.
//
// Moving between areas, the old song fades out over a second while the new one fades in, and an
// area's song picks up where it left off if the player comes back within a minute and a half
// (towns and fields feel continuous, like MapleStory's). Bosses cut in at once on their sting.

import { audioReady, now, loop, stop, muffleMusic } from './engine.js';
import { songBuffer, prepareSongs } from './bank.js';
import { SONGS } from './songs.js';

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
  if (cur.fight) stop(cur.fight, fade);
  cur = null;
}

// The fight layer (songs.js): started silent in step with the area's song once it's made, and
// faded up while there's a fight on (`setFight`).
let fightK = 0;
function startFight(c) {
  const key = `${c.key}-fight`;
  if (!SONGS[key]) return;
  const go = (song) => {
    if (cur !== c || c.fight) return;
    // In step with the song: from where it is now, or with it if it hasn't begun yet.
    const t = Math.max(now() + 0.05, c.v.startedAt);
    c.fight = loop(song.buffer, { at: t, offset: songPos(c.v, t), loopStart: song.loopStart, loopEnd: song.loopEnd, silent: true });
    setFight(fightK, true);
  };
  const song = songBuffer(key, go);
  if (song) go(song);
}

// How much of the fight layer to play (0-1): it comes in over about a second and goes back out
// slowly, a few seconds after the fighting stops.
export function setFight(k, force = false) {
  if (!force && Math.abs(k - fightK) < 0.01) return;
  const up = k > fightK;
  fightK = k;
  if (!cur?.fight) return;
  cur.fight.gain.gain.setTargetAtTime(0.85 * k, now(), up ? 0.35 : 1.2);
}

// Muffles the music (a lowpass at `hz`; 20000 is wide open): low HP, a calm night in town.
let muffled = 20000;
export function setMuffle(hz) {
  if (Math.abs(hz - muffled) < 50) return;
  const closing = hz < muffled;
  muffled = hz;
  muffleMusic(hz, closing ? 0.3 : 0.9);
}

function start(key, hard) {
  const song = songBuffer(key);
  if (!song) return;
  const t = now();
  const back = resume.get(key);
  const offset = back && t - back.at < 90 ? back.pos : 0;
  const v = loop(song.buffer, { at: t + (hard ? 0 : 0.35), offset, loopStart: song.loopStart, loopEnd: song.loopEnd, fade: hard ? 0 : offset ? 1.2 : 0.4 });
  cur = { key, v };
  startFight(cur);
}

// What's playing, for tools and play tests: the song, and the fight layer's level (null until it's
// made).
export const musicState = () => ({ key: cur?.key ?? null, fight: cur?.fight ? cur.fight.gain.gain.value : null, fightK, muffled });
