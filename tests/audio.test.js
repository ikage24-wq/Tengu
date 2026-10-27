// The chip sounds and songs: every effect and every song renders cleanly (no broken samples, no
// clipping, sensible lengths and levels), every bar of every song adds up, and the jingles keep to
// the lengths the research sets (docs/audio/research-japanese.md, G1 and G2).

import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/audio/synth.js';
import { RECIPES, variantsOf } from '../src/audio/recipes.js';
import { renderSong } from '../src/audio/tracker.js';
import { SONGS } from '../src/audio/songs.js';

const SR = 22050;
const secs = (b) => b.length / SR;
// The length until the sound has died away (below -50 dB).
function audible(b) {
  let last = 0;
  for (let i = 0; i < b.length; i++) if (Math.abs(b[i]) > 0.003) last = i;
  return last / SR;
}

test('every sound effect renders cleanly', () => {
  for (const [name, r] of Object.entries(RECIPES)) {
    for (let v = 0; v < variantsOf(name); v++) {
      const b = render(r, SR, v + 1);
      let peak = 0;
      let sum = 0;
      for (const x of b) {
        assert.ok(Number.isFinite(x), `${name} has a broken sample`);
        peak = Math.max(peak, Math.abs(x));
        sum += x;
      }
      assert.ok(peak <= 1.0001 && peak > 0.5, `${name} peak ${peak}`);
      assert.ok(Math.abs(sum / b.length) < 0.02, `${name} is off-centre`);
      assert.ok(secs(b) < 6, `${name} is ${secs(b)} s long`);
      assert.ok(typeof r.db === 'number' && r.db <= -6, `${name} needs a level`);
    }
  }
});

test('jingles and menu sounds keep to their lengths', () => {
  const len = (name) => audible(render(RECIPES[name], SR));
  // Small rewards 0.4-1.2 s, normal ones 1.5-2.5 s, ceremonies 3-5 s (with a little ring-out).
  for (const n of ['itemGet', 'healJingle', 'questAccept']) assert.ok(len(n) >= 0.3 && len(n) <= 1.4, `${n} ${len(n)}`);
  for (const n of ['levelup', 'questDone', 'rareDrop', 'death']) assert.ok(len(n) >= 1.2 && len(n) <= 2.8, `${n} ${len(n)}`);
  for (const n of ['jobUp', 'bossDefeated']) assert.ok(len(n) >= 2.5 && len(n) <= 5, `${n} ${len(n)}`);
  // Menu sounds are tiny.
  for (const n of ['click', 'cursor', 'cancel', 'open', 'close']) assert.ok(len(n) <= 0.25, `${n} ${len(n)}`);
});

test('every song renders a clean, level loop', () => {
  for (const [key, song] of Object.entries(SONGS)) {
    const r = renderSong(song, 8000);
    assert.ok(r.loopEnd > r.loopStart && r.loopEnd - r.loopStart >= 3.9, `${key} loop`);
    assert.equal(r.left.length, Math.ceil(r.loopEnd * 8000), `${key} buffer is the loop`);
    let peak = 0;
    let sum = 0;
    for (let i = 0; i < r.left.length; i++) {
      assert.ok(Number.isFinite(r.left[i]) && Number.isFinite(r.right[i]), `${key} broken sample`);
      peak = Math.max(peak, Math.abs(r.left[i]), Math.abs(r.right[i]));
      sum += r.left[i] * r.left[i];
    }
    const rms = Math.sqrt(sum / r.left.length);
    assert.ok(peak < 0.95, `${key} peak ${peak}`);
    assert.ok(rms > 0.1 && rms < 0.18, `${key} level ${rms}`);
  }
});

test('a bar that does not add up is caught', () => {
  const bad = { bpm: 120, inst: { a: {} }, voices: { p1: 'a' }, patterns: { A: { p1: 'C5:4 D5:4 | E5:16' } }, order: ['A'] };
  assert.throws(() => renderSong(bad, 8000), /bar 1 is 8 rows/);
});

test('the disco songs keep time with the stage (120 bpm, whole bars, the fever a step up)', () => {
  for (const k of ['funky', 'funky-fever', 'funky-groove', 'funky-heart']) {
    const r = renderSong(SONGS[k], 8000);
    assert.equal(SONGS[k].bpm, 120);
    assert.ok(Math.abs((r.loopEnd / 2) % 1) < 1e-9 && Math.abs((r.loopStart / 2) % 1) < 1e-9, `${k} is whole bars`);
  }
  assert.equal(SONGS['funky-fever'].transpose, 2);
});
