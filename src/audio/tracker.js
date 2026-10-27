// A tiny tracker: songs are written as text patterns per channel (see docs/audio/research-music.md,
// "Compact text format") and rendered by the chip (chip.js) into a stereo loop.
//
// A song: { bpm, swing (0.5 = straight, 0.58 = cozy swing), rows (per bar, 16 in 4/4, 12 in 3/4),
//   inst: { name: instrument }, voices: { p1, p2, tri, wave }: default instrument per channel,
//   patterns: { A: { p1, p2, tri, wave, noise } }, intro: [...names], order: [...names] }.
// Melodic channels are note strings: `E5:4` (note and length in 16th rows), `r:4` (rest),
// `~:4` (hold the last note longer), `@lead` (switch instrument), `v9` (note volume 0-15 until
// changed). Bars may be marked with `|` (ignored). p2 may instead be { echo: { rows, gain, cents,
// inst } }, which copies p1 later and softer.
// Drums are one character per row: K kick, S snare, h closed hat, o open hat, c clap, t tom,
// x crystal ting, C kick + clap, O kick + open hat, B kick + snare, H kick + hat, . nothing (bars
// marked with `|` are ignored). `transpose` (semitones) shifts every melodic note; `drums` scales
// the kit's level, and `hp` sets the output's low cut (90 Hz like the NES; lower for more bass).

import { renderNote, tone, midiHz } from './chip.js';

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midiOf(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}

// Drum kits: each hit is one or two chip notes.
const DRUMS = {
  K: [{ wave: 'tri', midi: 52, slide: { semis: -24, secs: 0.065 }, vol: '15 15 13 10 6 0', gain: 1.15 }, { wave: 'noise', noise: 12, vol: '8 4 0', gain: 0.6 }],
  S: [{ wave: 'noise', noise: 5, vol: '15 13 10 8 6 5 4 3 2 1 0', arp: '0 1 2 2', gain: 0.62 }, { wave: 'tri', midi: 55, slide: { semis: -12, secs: 0.05 }, vol: '12 8 0', gain: 0.8 }],
  h: [{ wave: 'noise', noise: 1, vol: '10 6 3 1 0', gain: 0.4 }],
  o: [{ wave: 'noise', noise: 1, vol: '9 8 7 6 5 4 4 3 3 2 2 1 1 0', gain: 0.36 }],
  c: [{ wave: 'noise', noise: 4, vol: '12 0 12 0 14 10 7 5 3 2 1 0', gain: 0.55 }],
  t: [{ wave: 'tri', midi: 60, slide: { semis: -12, secs: 0.12 }, vol: '15 14 12 10 7 4 0', gain: 1 }],
  x: [{ wave: 'noise', noise: 2, short: true, vol: '8 5 3 2 1 0', gain: 0.4 }],
};
// Two at once: C kick and clap, O kick and open hat, B kick and snare, H kick and closed hat.
Object.assign(DRUMS, { C: [...DRUMS.K, ...DRUMS.c], O: [...DRUMS.K, ...DRUMS.o], B: [...DRUMS.K, ...DRUMS.S], H: [...DRUMS.K, ...DRUMS.h] });

// Channel weights from the NES mixer (pulse 1, triangle 1.13, noise 0.66) and a slight spread.
const MIX = { p1: { w: 1, pan: -0.22 }, p2: { w: 1, pan: 0.22 }, tri: { w: 1.13, pan: 0 }, wave: { w: 0.9, pan: 0.1 }, noise: { w: 0.66, pan: 0.08 }, drumtri: { w: 1.13, pan: 0 } };

function rowTimes(song) {
  const rowSec = 60 / song.bpm / 4;
  const sw = song.swing ?? 0.5;
  return (r) => Math.floor(r / 2) * 2 * rowSec + (r % 2 ? sw * 2 * rowSec : 0);
}

// Parses a melodic channel into events: { row, rows, midi, inst, vol }.
function parseNotes(src, defInst, rowsPerBar = 0, where = '') {
  // Each bar (between `|` marks) must add up to a whole bar, or the song drifts off the beat.
  if (rowsPerBar) {
    src.split('|').forEach((bar, i) => {
      const len = bar.trim().split(/\s+/).filter((t) => /:/.test(t)).reduce((n, t) => n + Number(t.split(':')[1]), 0);
      if (bar.trim() && len !== rowsPerBar) throw new Error(`${where} bar ${i + 1} is ${len} rows, not ${rowsPerBar}`);
    });
  }
  const out = [];
  let row = 0;
  let inst = defInst;
  let vol = null;
  for (const tok of src.trim().split(/\s+/)) {
    if (!tok || tok === '|') continue;
    if (tok[0] === '@') {
      inst = tok.slice(1);
      continue;
    }
    if (/^v\d+$/.test(tok)) {
      vol = Number(tok.slice(1));
      continue;
    }
    const [name, lenS] = tok.split(':');
    const rows = Number(lenS ?? 1);
    if (name === 'r') row += rows;
    else if (name === '~') {
      if (out.length) out[out.length - 1].rows += rows;
      row += rows;
    } else {
      const midi = midiOf(name);
      if (midi == null) throw new Error(`bad note ${tok}`);
      out.push({ row, rows, midi, inst, vol });
      row += rows;
    }
  }
  return { events: out, rows: row };
}

function parseDrums(src) {
  const rows = src.replace(/[|\s]/g, '');
  return { hits: [...rows].map((c, row) => ({ c, row })).filter((h) => DRUMS[h.c]), rows: rows.length };
}

// Renders a song into { left, right, sampleRate, loopStart, loopEnd } (seconds).
export function renderSong(song, sr = 44100) {
  const at = rowTimes(song);
  const rowsPerBar = song.rows ?? 16;
  const sections = [...(song.intro ?? []), ...song.order];
  // Lay every channel's events out on one timeline.
  const ch = { p1: [], p2: [], tri: [], wave: [], noise: [] };
  let row = 0;
  let loopRow = 0;
  sections.forEach((name, i) => {
    if (i === (song.intro ?? []).length) loopRow = row;
    const pat = song.patterns[name];
    let len = 0;
    for (const c of ['p1', 'p2', 'tri', 'wave']) {
      const src = pat[c];
      if (typeof src !== 'string') continue;
      const { events, rows } = parseNotes(src, song.voices?.[c] ?? c, rowsPerBar, `${song.name ?? 'song'} ${name}.${c}`);
      for (const e of events) ch[c].push({ ...e, row: e.row + row });
      len = Math.max(len, rows);
    }
    // Drums repeat to fill the section (write one or two bars and they tile).
    if (pat.noise) {
      const { hits, rows } = parseDrums(pat.noise);
      const fill = Math.max(rows, len);
      for (let r0 = 0; r0 < fill; r0 += rows) for (const h of hits) if (r0 + h.row < fill) ch.noise.push({ ...h, row: h.row + r0 + row });
      len = Math.max(len, rows);
    }
    // Echo: pulse 2 repeats pulse 1, later, softer and a little detuned.
    if (pat.p2?.echo) {
      const e = pat.p2.echo;
      const { events } = parseNotes(pat.p1, song.voices?.p1 ?? 'p1');
      for (const ev of events) ch.p2.push({ ...ev, row: ev.row + row + e.rows, inst: e.inst ?? ev.inst, gain: e.gain, detune: e.cents ?? 7 });
    }
    row += Math.ceil(len / rowsPerBar) * rowsPerBar;
  });
  const loopEnd = at(row);
  const loopStart = at(loopRow);
  const tail = 60 / song.bpm * 4;
  const n = Math.ceil((loopEnd + tail) * sr);
  const bufs = {};
  for (const c of Object.keys(MIX)) bufs[c] = new Float32Array(n);
  const fade = Math.round(0.003 * sr);
  // Melodic channels are one voice each: a new note cuts the last (with a 3 ms fade).
  for (const c of ['p1', 'p2', 'tri', 'wave']) {
    const evs = ch[c].sort((a, b) => a.row - b.row);
    evs.forEach((e, i) => {
      const inst = song.inst[e.inst];
      if (!inst) throw new Error(`no instrument ${e.inst}`);
      const t0 = at(e.row);
      const t1 = at(e.row + e.rows);
      const next = evs[i + 1] ? at(evs[i + 1].row) : loopEnd + tail;
      const gate = inst.gate != null ? (t1 - t0) * inst.gate : t1 - t0;
      const tmp = new Float32Array(Math.max(1, Math.round((next - t0) * sr) + fade));
      renderNote(tmp, 0, sr, inst, { midi: e.midi + (song.transpose ?? 0), len: gate, gain: (e.vol != null ? e.vol / 15 : 1) * (e.gain ?? 1), detune: e.detune });
      const s0 = Math.round(t0 * sr);
      const cut = Math.round((next - t0) * sr);
      for (let k = 0; k < tmp.length && s0 + k < n; k++) {
        const fadeK = k < cut ? 1 : Math.max(0, 1 - (k - cut) / fade);
        bufs[c][s0 + k] += tmp[k] * fadeK;
      }
    });
  }
  for (const h of ch.noise) {
    const t0 = at(h.row);
    for (const part of DRUMS[h.c]) {
      const target = part.wave === 'tri' ? bufs.drumtri : bufs.noise;
      const s0 = Math.round(t0 * sr);
      if (s0 >= n) continue;
      renderNote(target, s0, sr, part, { midi: part.midi ?? 60, len: 0.02, noise: part.noise, short: part.short, slide: part.slide });
    }
  }
  // Mix into stereo, fold the tail past the loop end back onto the loop start, then the output
  // filters and a level that's the same for every song.
  const left = new Float32Array(Math.ceil(loopEnd * sr));
  const right = new Float32Array(left.length);
  const ls = Math.round(loopStart * sr);
  for (const [c, m] of Object.entries(MIX)) {
    const b = bufs[c];
    const dg = c === 'noise' || c === 'drumtri' ? song.drums ?? 1 : 1;
    const gl = dg * m.w * Math.min(1, 1 - m.pan) * 0.11;
    const gr = dg * m.w * Math.min(1, 1 + m.pan) * 0.11;
    for (let k = 0; k < n; k++) {
      const v = b[k];
      if (!v) continue;
      const j = k < left.length ? k : ls + (k - left.length);
      if (j >= left.length) continue;
      left[j] += v * gl;
      right[j] += v * gr;
    }
  }
  tone(left, sr, song.hp ?? 90);
  tone(right, sr, song.hp ?? 90);
  normalize(left, right, song.level ?? 1);
  return { left, right, sampleRate: sr, loopStart, loopEnd };
}

// Every song lands at the same loudness (RMS), with peaks kept under 0.9.
function normalize(l, r, level) {
  let sum = 0;
  let peak = 0;
  for (let i = 0; i < l.length; i++) {
    sum += l[i] * l[i] + r[i] * r[i];
    peak = Math.max(peak, Math.abs(l[i]), Math.abs(r[i]));
  }
  const rms = Math.sqrt(sum / (2 * l.length)) || 1;
  const k = Math.min((0.14 * level) / rms, 0.9 / (peak || 1));
  for (let i = 0; i < l.length; i++) {
    l[i] *= k;
    r[i] *= k;
  }
}

export { midiHz };
