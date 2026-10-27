// "Funky Fever", Dancing Green's own song (written out in songs.js), played locked to the stage:
// its bars line up with the stage lights' beat (they flash every half second of the real clock,
// with a drop every sixteen beats), so the floor, the lights and the music hit together. Every
// change waits for a beat or a bar line, the way FFXIV moves its battle music only at musical
// seams.
//
// It follows the fight:
// - The cutscene: his groove, muffled as if from behind a door, opening up as he struts in and
//   dances; a riser and a snare roll while the red energy gathers; a boom and a crash as he turns
//   into his toad form, then a heartbeat until the fight starts.
// - The fight: the song drops in on a bar line, with its chorus landing on the stage's drop.
// - Hi-NRG Fever (the enrage): a phase sting whose hit lands on the next bar line, where the song
//   jumps up a whole step with doubled hats, carrying on from the same place in the song.
// - His defeat: the song stops on the beat and the victory fanfare plays, then the stage is quiet.

import { now, loop, stop, play, duck } from './engine.js';
import { songBuffer, sfxBuffer, prepareSongs } from './bank.js';
import { songPos } from './music.js';

const BEAT = 0.5;
const BAR = BEAT * 4;
let st = null;

// The real clock (the stage lights') at audio time `t`, and back.
const offset = () => performance.now() / 1000 - now();
// The next audio time on a multiple of `step` seconds of the stage clock.
const nextOn = (step, lead = 0.05) => {
  const off = offset();
  return Math.ceil((now() + lead + off) / step) * step - off;
};

function once(name, o = {}) {
  const buf = sfxBuffer(name);
  if (buf) play(buf, { db: o.db ?? -12, at: o.at, rate: o.rate });
  return Boolean(buf);
}

// Call every frame while on his stage. `key`: 'funky-intro' | 'funky' | 'funky-fever' | 'funky-win';
// `cut`: seconds into the cutscene (intro only).
export function updateFunky(key, cut = 0) {
  if (!st) {
    st = { key: null, done: {} };
    prepareSongs(['funky-groove', 'funky-heart', 'funky', 'funky-fever']);
  }
  if (key === 'funky-intro') intro(cut);
  else if (key === 'funky') fight();
  else if (key === 'funky-fever') fever();
  else if (key === 'funky-win') win();
  st.key = key;
}

export function stopFunky() {
  if (!st) return;
  for (const v of [st.groove, st.heart, st.song, st.fever]) if (v) stop(v, 0.5);
  st = null;
}

// The cutscene, timed to what happens on screen.
function intro(cut) {
  if (cut < 8.7 && !st.groove && !st.done.boom) {
    const g = songBuffer('funky-groove');
    if (g) st.groove = loop(g.buffer, { at: nextOn(BEAT), loopEnd: g.loopEnd, filter: 300 });
  }
  if (st.groove?.lp) {
    // The door opens as he dances.
    const open = Math.min(1, Math.max(0, (cut - 1.2) / 5));
    st.groove.lp.frequency.setTargetAtTime(300 + open * open * 5500, now(), 0.1);
  }
  if (cut >= 6.8 && !st.done.riser && once('riser', { db: -10 }) && once('roll', { db: -12 })) st.done.riser = true;
  if (cut >= 8.7 && !st.done.boom) {
    st.done.boom = true;
    stop(st.groove, 0.05);
    st.groove = null;
    once('boom', { db: -6 });
    once('crash', { db: -10 });
    duck(-6, 600);
  }
  if (st.done.boom && !st.heart) {
    const h = songBuffer('funky-heart');
    if (h) st.heart = loop(h.buffer, { at: nextOn(BEAT), loopEnd: h.loopEnd, fade: 0.8 });
  }
}

// The drop: on the next stage bar that's a multiple of two, at the point in the song that puts
// a chorus downbeat on the stage's next drop.
function fight() {
  if (st.song) return;
  const s = songBuffer('funky');
  if (!s) return;
  const at = nextOn(BAR * 2);
  const stageBar = Math.round((at + offset()) / BAR);
  const off = stageBar % 4 === 0 ? 0 : BAR * 2;
  st.song = loop(s.buffer, { at, offset: off, loopStart: s.loopStart, loopEnd: s.loopEnd });
  for (const k of ['groove', 'heart']) {
    stop(st[k], 0.05, at);
    st[k] = null;
  }
  if (!off) play(sfxBuffer('crash'), { db: -12, at });
}

// Hi-NRG Fever: the sting's hit lands on a bar line, and the song carries on a whole step up.
function fever() {
  if (st.fever) return;
  if (!st.song) return fight();
  const f = songBuffer('funky-fever');
  const sting = sfxBuffer('phase');
  if (!f || !sting) return;
  const at = nextOn(BAR, 1.0);
  play(sting, { db: -9, at: at - 0.96 });
  setTimeout(() => duck(-6, 700), Math.max(0, (at - 0.96 - now()) * 1000));
  const pos = songPos(st.song, at);
  st.fever = loop(f.buffer, { at, offset: pos, loopStart: f.loopStart, loopEnd: f.loopEnd });
  stop(st.song, 0.02, at);
}

// His defeat: the music stops on the next beat and the fanfare plays (a whole step up, in the
// song's key), then quiet.
function win() {
  if (st.done.win) return;
  const fanfare = sfxBuffer('bossDefeated');
  if (!fanfare) return;
  st.done.win = true;
  const at = nextOn(BEAT);
  for (const k of ['groove', 'heart', 'song', 'fever']) {
    stop(st[k], 0.25, at);
    st[k] = null;
  }
  play(fanfare, { db: -7, at, rate: Math.pow(2, 2 / 12) });
  play(sfxBuffer('crash'), { db: -12, at });
}
