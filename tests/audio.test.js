// The sounds and songs: every effect and every song renders cleanly (no broken samples, no
// clipping, sensible lengths and levels), every bar of every song adds up, the jingles keep to the
// lengths the research sets (docs/audio/research-japanese.md, G1 and G2), and every recording
// the recipes ask for exists. The tests use a stand-in for the recordings (soft tones and noise in
// the same layout), so they run without decoding audio files.

import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/audio/synth.js';
import { RECIPES, variantsOf } from '../src/audio/recipes.js';
import { renderSong, parseNotes, VOICES } from '../src/audio/studio.js';
import { SONGS } from '../src/audio/songs.js';
import { MANIFEST } from '../src/audio/manifest.js';

// A stand-in bank: each instrument's notes as decaying tones, each effect as a noise burst.
function fakeBank() {
  const sr = 8000;
  const inst = {};
  for (const [name, m] of Object.entries(MANIFEST.inst)) {
    const data = new Float32Array(Math.ceil((MANIFEST.lead + m.notes.length * m.slot) * sr));
    m.notes.forEach((note, k) => {
      const f = 440 * Math.pow(2, (note - 69) / 12);
      const s0 = Math.round((MANIFEST.lead + k * m.slot) * sr);
      for (let i = 0; i < m.slot * sr - 1; i++) data[s0 + i] = 0.3 * Math.sin((2 * Math.PI * f * i) / sr) * Math.exp(-i / sr / 1.5);
    });
    inst[name] = { ...m, data, scale: 1, sr, offset: 0, lead: MANIFEST.lead };
  }
  const items = MANIFEST.sfx.items;
  let end = 0;
  for (const list of Object.values(items)) for (const [a, l] of list) end = Math.max(end, a + l);
  const data = new Float32Array(Math.ceil((end + 0.1) * sr));
  let seed = 1;
  for (const list of Object.values(items)) for (const [a, l] of list) for (let i = 0; i < l * sr; i++) data[Math.round(a * sr) + i] = (((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1) * 0.5 * Math.exp(-i / sr / 0.1);
  return { inst, sfx: { ...MANIFEST.sfx, data, scale: 1, sr, offset: 0, lead: MANIFEST.lead } };
}
const bank = fakeBank();

const SR = 22050;
const secs = (b) => b.length / SR;
// The length until the sound has died away (below -50 dB).
function audible(b) {
  let last = 0;
  for (let i = 0; i < b.length; i++) if (Math.abs(b[i]) > 0.003) last = i;
  return last / SR;
}

test('every recording and instrument the sounds ask for exists', () => {
  for (const [name, r] of Object.entries(RECIPES)) {
    for (const L of r.layers) {
      if (L.rec) assert.ok(MANIFEST.sfx.items[L.rec], `${name} wants a recording "${L.rec}"`);
      if (L.inst) assert.ok(MANIFEST.inst[L.inst] || VOICES[L.inst], `${name} wants an instrument "${L.inst}"`);
    }
  }
  for (const [key, song] of Object.entries(SONGS)) {
    for (const [iname, inst] of Object.entries(song.inst)) if (inst.sample) assert.ok(MANIFEST.inst[inst.sample] || VOICES[inst.sample], `${key}: ${iname} wants "${inst.sample}"`);
  }
});

test('every instrument the songs used to play is recorded again (only the choir stays a synth)', () => {
  for (const name of Object.keys(VOICES)) if (name !== 'choir_aahs') assert.ok(MANIFEST.inst[name], `${name} has no recording`);
  for (const [name, I] of Object.entries(MANIFEST.inst)) {
    assert.ok(I.notes.length >= 2 && I.slot > 0, `${name}: notes and a slot`);
    assert.ok(fs.existsSync(new URL(`../${I.file}`, import.meta.url)), `${name}: ${I.file} is missing`);
  }
});

test('every sound effect renders cleanly', () => {
  for (const [name, r] of Object.entries(RECIPES)) {
    for (let v = 0; v < variantsOf(name); v++) {
      const b = render(r, SR, v + 1, bank);
      let peak = 0;
      let sum = 0;
      for (const x of b) {
        assert.ok(Number.isFinite(x), `${name} has a broken sample`);
        peak = Math.max(peak, Math.abs(x));
        sum += x;
      }
      assert.ok(peak <= 1.0001 && peak > 0.5, `${name} peak ${peak}`);
      if (secs(b) > 0.1) assert.ok(Math.abs(sum / b.length) < 0.02, `${name} is off-centre`);
      assert.ok(secs(b) < 6, `${name} is ${secs(b)} s long`);
      assert.ok(typeof r.db === 'number' && r.db <= -6, `${name} needs a level`);
    }
  }
});

test('jingles keep to their lengths', () => {
  const len = (name) => audible(render(RECIPES[name], SR, 1, bank));
  // Small rewards 0.4-1.2 s, normal ones 1.5-2.5 s, ceremonies 3-5 s (with ring-out).
  for (const n of ['itemGet', 'heal', 'questAccept']) assert.ok(len(n) >= 0.3 && len(n) <= 1.8, `${n} ${len(n)}`);
  for (const n of ['levelup', 'questDone', 'rareDrop', 'death']) assert.ok(len(n) >= 1.2 && len(n) <= 3.2, `${n} ${len(n)}`);
  for (const n of ['jobUp', 'bossDefeated']) assert.ok(len(n) >= 2.5 && len(n) <= 5.5, `${n} ${len(n)}`);
});

test('every song renders a clean, level loop', () => {
  for (const [key, song] of Object.entries(SONGS)) {
    const r = renderSong(song, bank, 8000);
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
    assert.ok(rms > 0.08 && rms < 0.18, `${key} level ${rms}`);
  }
});

test('a bar that does not add up is caught, and chords parse', () => {
  assert.throws(() => parseNotes('C5:4 D5:4 | E5:16', 'x', 16, 'test'), /bar 1 is 8 rows/);
  const { events } = parseNotes('C4+E4+G4:8 r:8', 'x', 16);
  assert.deepEqual(events[0].midis, [60, 64, 67]);
});


test('each fight layer loops in step with its area song, and every ambience sound is a recipe', async () => {
  for (const k of ['meadow', 'harbor', 'town', 'cave']) {
    const a = renderSong(SONGS[k], bank, 8000);
    const f = renderSong(SONGS[`${k}-fight`], bank, 8000);
    assert.ok(Math.abs(a.loopEnd - f.loopEnd) < 1e-6 && Math.abs(a.loopStart - f.loopStart) < 1e-6, `${k} fight layer matches`);
  }
  const { RECIPES } = await import('../src/audio/recipes.js');
  const { MATERIAL } = await import('../src/audio/materials.js');
  for (const name of ['birdChirp', 'cricket', 'waveWash', 'gull', 'drip', 'chatter', 'heartbeat', 'skillUp', 'buy', 'dollGiggle', ...new Set(Object.values(MATERIAL))]) assert.ok(RECIPES[name], `${name} exists`);
});
