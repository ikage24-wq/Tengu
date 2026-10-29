// The music: one written song per area, arranged for real recorded instruments with modern
// production (studio.js renders them). Every melody is written out note by note; the
// accompaniment is built from each song's written chord chart by the helpers below (strums,
// arpeggios, basslines, pads), so each part follows the harmony exactly.
//
// The sound, area by area (see docs/audio/README.md):
// - Town: flute over nylon guitar, plucked strings and a soft synth double, light modern drums.
// - Meadows: a running flute and synth pluck, marimba, a punchy bass, full pop drums.
// - Harbor: accordion and guitar in a lilting 6/8, shaker and woodblock.
// - Crags: sitar and oboe over a drone, toms and shaker.
// - Forest: pan flute, harp and marimba, hats only.
// - Mage grove: a waltz for oboe, celesta and harp.
// - Ruins: choir and harp, a horn lead, timpani.
// - Cave: celesta and glockenspiel echoing over strings and choir.
// - Sky: flute and bells, harp, an airy pad.
// - The Hollow: horns and a grumbling bass march.
// - Bosses: brass, strings, choir, timpani, a synth bass gallop and big drums.

// ---------- Writing helpers ----------
const bars = (...b) => b.join(' | ');
const times = (s, n) => Array(n).fill(s).join(' | ');
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const nm = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
const pc = (s) => NOTE[s[0]] + (s[1] === '#' ? 1 : s[1] === 'b' ? -1 : 0);
// Moves every note in a pattern by `n` semitones.
function shift(src, n) {
  return src.replace(/\b([A-G][#b]?)(-?\d)(?=[:+])/g, (_, l, oct) => nm(12 * (Number(oct) + 1) + pc(l) + n));
}
const QUALITY = { '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], sus4: [0, 5, 7], add9: [0, 4, 7, 14], madd9: [0, 3, 7, 14], dim: [0, 3, 6] };
// A chord symbol ('Am7', 'Bb', 'F#m') -> { root (pitch class), tones (MIDI, voiced around `center`) }.
function chord(sym, center = 64) {
  const m = /^([A-G][#b]?)(.*)$/.exec(sym);
  const root = pc(m[1]);
  const iv = QUALITY[m[2]] ?? QUALITY[''];
  let base = 48 + root;
  while (base + iv[iv.length - 1] / 2 < center - 6) base += 12;
  while (base + iv[iv.length - 1] / 2 > center + 6) base -= 12;
  return { root, tones: iv.map((i) => base + i) };
}
const rootIn = (sym, oct) => 12 * (oct + 1) + chord(sym).root;
// Builds a part from a chord chart: each bar is 'C' or 'Dm7 G' (two chords, half a bar each);
// `fn(sym, rows)` writes that many rows for one chord.
function part(chart, fn, rows = 16) {
  return bars(
    ...chart.map((bar) => {
      const syms = bar.split(' ');
      const len = rows / syms.length;
      return syms.map((s) => fn(s, len)).join(' ');
    }),
  );
}
const tones = (sym, c) => chord(sym, c).tones.map(nm).join('+');
// Accompaniment figures (each fills `len` rows):
const F = {
  // A chord on each offbeat eighth ("chk, chk").
  offbeat: (c = 64) => (s, len) => Array(len / 4).fill(`r:2 ${tones(s, c)}:2`).join(' '),
  // A strum on the beat, then a breath.
  strum: (c = 62) => (s, len) => Array(len / 4).fill(`${tones(s, c)}:3 r:1`).join(' '),
  // The chord held.
  hold: (c = 60) => (s, len) => `${tones(s, c)}:${len}`,
  // The root held, in octave `oct`.
  root: (oct = 2) => (s, len) => `${nm(rootIn(s, oct))}:${len}`,
  // Root and fifth bouncing on the beats.
  bounce: (oct = 2) => (s, len) => {
    const r = rootIn(s, oct);
    return Array(len / 8).fill(`${nm(r)}:3 r:1 ${nm(r + 7)}:3 r:1`).join(' ');
  },
  // Root and its octave in eighths.
  octaves: (oct = 2) => (s, len) => {
    const r = rootIn(s, oct);
    return Array(len / 4).fill(`${nm(r)}:2 ${nm(r + 12)}:2`).join(' ');
  },
  // Chord tones climbing and falling, `step` rows each.
  arp: (c = 72, step = 2) => (s, len) => {
    const t = chord(s, c).tones;
    const up = [...t, t[0] + 12];
    const seq = [...up, ...up.slice(1, -1).reverse()];
    return Array.from({ length: len / step }, (_, i) => `${nm(seq[i % seq.length])}:${step}`).join(' ');
  },
  // A gallop: long, short, short.
  gallop: (oct = 2) => (s, len) => {
    const r = nm(rootIn(s, oct));
    const o = nm(rootIn(s, oct) + 12);
    return Array(len / 8).fill(`${r}:2 ${r}:1 ${r}:1 ${o}:2 ${r}:2`).join(' ');
  },
  // 3/4: the root on one, the fifth on two and three.
  waltzBass: (oct = 2) => (s) => `${nm(rootIn(s, oct))}:4 ${nm(rootIn(s, oct) + 7)}:8`,
  // 3/4: the chord on two and three.
  waltzChord: (c = 64) => (s) => `r:4 ${tones(s, c)}:3 r:1 ${tones(s, c)}:3 r:1`,
  // 6/8: the root on one and four.
  sixEight: (oct = 2) => (s, len) => Array(len / 12).fill(`${nm(rootIn(s, oct))}:5 r:1 ${nm(rootIn(s, oct) + 7)}:5 r:1`).join(' '),
  // 6/8: the chord on the off-pulses.
  sixEightChord: (c = 64) => (s, len) => Array(len / 12).fill(`r:2 ${tones(s, c)}:2 ${tones(s, c)}:2 r:2 ${tones(s, c)}:2 ${tones(s, c)}:2`).join(' '),
};

// ---------- Instruments ----------
const I = {
  flute: { sample: 'flute', rel: 0.15, gate: 0.95 },
  panflute: { sample: 'pan_flute', rel: 0.15, gate: 0.95 },
  oboe: { sample: 'oboe', rel: 0.15, gate: 0.95 },
  violin: { sample: 'violin', rel: 0.2, gate: 0.97 },
  strings: { sample: 'string_ensemble_1', attack: 0.12, rel: 0.45, gain: 0.8 },
  choir: { sample: 'choir_aahs', attack: 0.15, rel: 0.5, gain: 0.8 },
  accordion: { sample: 'accordion', rel: 0.12, gate: 0.92 },
  horn: { sample: 'french_horn', attack: 0.03, rel: 0.25 },
  trumpet: { sample: 'trumpet', rel: 0.15, gate: 0.92 },
  brass: { sample: 'brass_section', rel: 0.15, gate: 0.9 },
  brassStab: { sample: 'brass_section', rel: 0.08, gate: 0.5 },
  guitar: { sample: 'acoustic_guitar_nylon', strum: 0.018, rel: 0.3, gain: 0.8 },
  pizz: { sample: 'pizzicato_strings', rel: 0.2 },
  harp: { sample: 'orchestral_harp', rel: 0.6, gain: 0.9 },
  piano: { sample: 'acoustic_grand_piano', rel: 0.4, gain: 0.8 },
  marimba: { sample: 'marimba', rel: 0.3, gain: 0.8 },
  glock: { sample: 'glockenspiel', rel: 0.5, gain: 0.7 },
  celesta: { sample: 'celesta', rel: 0.5, gain: 0.8 },
  sitar: { sample: 'sitar', rel: 0.4, gain: 0.9 },
  timpani: { sample: 'timpani', rel: 0.5 },
  ebass: { sample: 'electric_bass_finger', rel: 0.08, gate: 0.85 },
  pluck: { synth: 'pluck', gain: 0.5 },
  pluckSoft: { synth: 'pluck', gain: 0.4, cut: 2500, ring: 0.3 },
  pad: { synth: 'pad', gain: 0.35, cut: 1400 },
  padDark: { synth: 'pad', gain: 0.35, cut: 800, attack: 0.4 },
  sub: { synth: 'sub', gain: 0.5, gate: 0.85 },
  synbass: { synth: 'bass', gain: 0.55, gate: 0.8 },
  lead: { synth: 'lead', gain: 0.42 },
  stab: { synth: 'stab', gain: 0.4 },
  bell: { synth: 'bell', gain: 0.35 },
};

// ---------- Title (C major, gentle: piano, harp, strings, celesta) ----------
const titleA = ['G5:6 E5:2 C6:4 G5:4', 'A5:6 G5:2 E5:8', 'F5:4 A5:4 C6:4 A5:4', 'B5:6 A5:2 G5:8', 'A5:6 C6:2 E6:4 C6:4', 'D6:6 B5:2 G5:4 F5:4'];
const titleChart = ['C', 'Am', 'F', 'G', 'FM7', 'G7', 'Em7 Am', 'Dm7 G7'];
const titleLine1 = bars(...titleA, 'E5:4 G5:4 A5:4 C6:4', 'D6:8 B5:4 G5:4');
const titleLine2 = bars(...titleA, 'C6:4 B5:4 A5:4 E5:4', 'F5:4 A5:4 B5:4 D6:4');
const title = {
  name: 'title', bpm: 100, inst: I, drums: 0.45, reverb: { room: 0.88, wet: 0.32 },
  tracks: {
    lead: { inst: 'piano', gain: 0.9, pan: -0.05, verb: 0.35 },
    echo: { inst: 'celesta', gain: 0.25, pan: 0.4, delay: 3, verb: 0.5 },
    harp: { inst: 'harp', gain: 0.22, pan: 0.3, verb: 0.4 },
    strings: { inst: 'strings', gain: 0.2, pan: -0.3, verb: 0.5 },
    bass: { inst: 'pizz', gain: 0.5, verb: 0.2 },
    pad: { inst: 'pad', gain: 0.4, verb: 0.4 },
  },
  patterns: {
    pickup: { lead: 'r:10 G4:2 C5:2 E5:2', harp: 'r:16' },
    A: { lead: titleLine1, echo: titleLine1, harp: part(titleChart, F.arp(64, 2)), strings: part(titleChart, F.hold(58)), bass: part(titleChart, F.root(2)) },
    A2: { lead: titleLine2, echo: titleLine2, harp: part(titleChart, F.arp(64, 2)), strings: part(titleChart, F.hold(58)), pad: part(titleChart, F.hold(64)), bass: part(titleChart, F.root(2)), drums: 'K.......h...x...|K.......h...x.x.' },
  },
  intro: ['pickup'],
  order: ['A', 'A2'],
};

// ---------- Town: "Morning Bread" (C major, swung, cozy) ----------
const townA = bars('E5:4 G5:2 E5:2 D5:4 C5:4', 'A4:4 C5:4 E5:8', 'F5:4 A5:2 F5:2 E5:4 D5:4', 'G4:4 B4:4 D5:8', 'E5:4 G5:2 E5:2 D5:4 C5:4', 'A5:4 G5:2 E5:2 C5:4 E5:4', 'F5:4 E5:2 D5:2 B4:4 D5:4', 'C5:12 r:4');
const townB = bars('A5:6 G5:2 F5:4 E5:4', 'D5:6 E5:2 F5:4 G5:4', 'B5:6 A5:2 G5:4 E5:4', 'C6:8 A5:8', 'F5:4 A5:4 D6:4 C6:4', 'B5:4 G5:4 F5:4 D5:4', 'E5:8 G5:4 C6:4', 'C6:12 r:4');
const townChartA = ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm7 G', 'C'];
const townChartB = ['FM7', 'G7', 'Em7', 'Am', 'Dm7', 'G7', 'C', 'C'];
const townDrums = bars(times('K...h.c.h...h.hh', 3), 'K...h.c.h...hxhh', times('K...h.c.h...h.hh', 3), 'K...h.c.h.c.c.cc');
const townPart = (mel, chart) => ({
  lead: mel,
  double: shift(mel, -12),
  glock: shift(mel, 12),
  guitar: part(chart, F.offbeat(62)),
  strings: part(chart, (s, len) => `${nm(chord(s).tones[0] - 12)}:${len}`),
  bass: part(chart, F.bounce(2)),
  sub: part(chart, F.bounce(1)),
  drums: townDrums,
});
const town = {
  name: 'town', bpm: 100, swing: 0.58, inst: I, pump: 0.18, drums: 0.7, reverb: { room: 0.85, wet: 0.26 },
  tracks: {
    lead: { inst: 'flute', gain: 0.7, pan: -0.05, verb: 0.3 },
    double: { inst: 'pluckSoft', gain: 0.35, pan: 0.1, echo: { rows: 3, fb: 0.25, wet: 0.25 }, verb: 0.2 },
    glock: { inst: 'glock', gain: 0.25, pan: 0.45, delay: 3, verb: 0.4 },
    guitar: { inst: 'guitar', gain: 0.32, pan: 0.3, verb: 0.25 },
    strings: { inst: 'strings', gain: 0.18, pan: -0.35, verb: 0.4 },
    bass: { inst: 'pizz', gain: 0.45, verb: 0.15 },
    sub: { inst: 'sub', gain: 0.2, verb: 0 },
  },
  patterns: { A: townPart(townA, townChartA), B: townPart(townB, townChartB) },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- Meadows: "Meadow Run" (D dorian, running) ----------
const meadowA = bars('D5:3 F5:3 A5:2 G5:4 F5:2 E5:2', 'D5:3 B4:3 D5:2 G5:8', 'D5:3 F5:3 A5:2 C6:4 A5:2 F5:2', 'G5:6 B5:2 A5:4 G5:4', 'F5:3 D5:3 F5:2 Bb5:4 A5:2 G5:2', 'E5:3 C5:3 E5:2 G5:4 F5:2 E5:2', 'F5:3 E5:3 D5:2 A4:4 D5:2 F5:2', 'E5:8 C#5:4 A4:4');
const meadowB = bars('D5:4 F5:4 Bb4:6 C5:2', 'E5:4 G5:4 C5:8', 'C5:4 E5:4 A4:6 B4:2', 'C5:4 D5:4 A4:8', 'F5:4 D5:2 F5:2 Bb5:4 A5:4', 'G5:4 E5:2 G5:2 C6:8', 'B5:4 G#5:4 E5:4 B4:4', 'C#5:4 E5:4 A5:8');
const meadowChartA = ['Dm', 'G', 'Dm', 'G', 'Bb', 'C', 'Dm', 'A'];
const meadowChartB = ['Bb', 'C', 'Am', 'Dm', 'Bb', 'C', 'E', 'A'];
const meadowPart = (mel, chart) => ({
  lead: mel,
  pluck: mel,
  marimba: part(chart, F.arp(67, 2)),
  guitar: part(chart, F.strum(62)),
  bass: part(chart, F.octaves(2)),
  drums: bars(times('K.h.S.h.K.hKS.h.', 7), 'K.h.S.h.S.SSt.t.'),
});
const meadow = {
  name: 'meadow', bpm: 132, inst: I, pump: 0.22, drums: 0.8, reverb: { room: 0.8, wet: 0.2 },
  tracks: {
    lead: { inst: 'flute', gain: 0.8, pan: -0.1, verb: 0.25 },
    pluck: { inst: 'pluck', gain: 0.3, pan: 0.15, echo: { rows: 3, fb: 0.25, wet: 0.2 }, verb: 0.15 },
    marimba: { inst: 'marimba', gain: 0.22, pan: 0.4, verb: 0.2 },
    guitar: { inst: 'guitar', gain: 0.3, pan: -0.35, verb: 0.2 },
    bass: { inst: 'synbass', gain: 0.36, verb: 0 },
  },
  patterns: { A: meadowPart(meadowA, meadowChartA), B: meadowPart(meadowB, meadowChartB) },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- Harbor (F major, a lilting 6/8: accordion and guitar) ----------
const harborA = bars('C5:4 F5:2 A5:4 G5:2', 'F5:4 D5:2 Bb4:6', 'C5:4 E5:2 G5:4 Bb5:2', 'A5:6 F5:4 r:2', 'A5:4 F5:2 D5:4 F5:2', 'G5:4 Bb5:2 D6:4 C6:2', 'Bb5:4 A5:2 G5:4 E5:2', 'G5:4 Bb5:2 C6:6');
const harborB = bars('D6:6 C6:4 Bb5:2', 'A5:6 F5:6', 'Bb5:4 A5:2 G5:4 F5:2', 'E5:6 C5:6', 'D5:4 F5:2 Bb5:4 D6:2', 'C6:4 A5:2 F5:4 A5:2', 'G5:4 Bb5:2 E5:4 G5:2', 'F5:12');
const harborChartA = ['F', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C', 'C7'];
const harborChartB = ['Bb', 'F', 'Gm', 'C', 'Bb', 'F', 'Gm C', 'F'];
const harborPart = (mel, chart) => ({
  lead: mel,
  echo: shift(mel, -12),
  guitar: part(chart, (s, len) => (len === 12 ? F.sixEightChord(62)(s, len) : `r:2 ${tones(s, 62)}:2 ${tones(s, 62)}:2`), 12),
  bass: part(chart, (s, len) => (len === 12 ? F.sixEight(2)(s, len) : `${nm(rootIn(s, 2))}:5 r:1`), 12),
  strings: part(chart, F.hold(58), 12),
  drums: 'K.x.x.w.x.x.',
});
const harbor = {
  name: 'harbor', bpm: 104, rows: 12, inst: I, drums: 0.7, reverb: { room: 0.84, wet: 0.24 },
  tracks: {
    lead: { inst: 'accordion', gain: 0.55, pan: -0.1, verb: 0.25 },
    echo: { inst: 'pluckSoft', gain: 0.22, pan: 0.2, delay: 3, verb: 0.3 },
    guitar: { inst: 'guitar', gain: 0.3, pan: 0.35, verb: 0.2 },
    bass: { inst: 'pizz', gain: 0.42, verb: 0.15 },
    strings: { inst: 'strings', gain: 0.14, pan: -0.4, verb: 0.4 },
  },
  patterns: { A: harborPart(harborA, harborChartA), B: harborPart(harborB, harborChartB) },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- The crags (E Phrygian dominant: sitar and oboe, toms) ----------
const cragA = bars('E5:2 F5:2 G#5:4 F5:2 E5:2 B4:4', 'A5:4 G#5:2 F5:2 E5:8', 'G#5:2 A5:2 B5:4 C6:2 B5:2 A5:4', 'G#5:4 F5:4 E5:8', 'E6:4 D6:2 C6:2 B5:4 A5:4', 'C6:4 B5:2 A5:2 G#5:4 F5:4', 'A5:2 G#5:2 F5:4 D5:4 F5:4', 'E5:12 r:4');
const cragB = bars('B4:2 E5:2 G#5:2 B5:2 C6:4 B5:4', 'A5:2 F5:2 D5:2 F5:2 A5:8', 'G#5:2 E5:2 B4:2 E5:2 G#5:4 A5:4', 'B5:16', 'C6:6 B5:2 A5:4 G#5:4', 'A5:6 G#5:2 F5:4 E5:4', 'F5:4 E5:4 D5:4 C5:4', 'B4:8 E5:8');
const cragChartA = ['E', 'F', 'E', 'Dm E', 'E', 'F', 'Dm', 'E'];
const cragChartB = ['E', 'Dm', 'E', 'E', 'Am', 'F', 'Dm', 'E'];
const cragPart = (mel, chart, lead) => ({
  [lead]: mel,
  pluck: shift(mel, -12),
  drone: part(chart, (s, len) => `${nm(rootIn(s, 3))}+${nm(rootIn(s, 3) + 7)}:${len}`),
  bass: part(chart, (s, len) => Array(len / 8).fill(`${nm(rootIn(s, 2))}:4 ${nm(rootIn(s, 2))}:2 ${nm(rootIn(s, 2))}:2`).join(' ')),
  drums: bars(times('K.x.x.t.K.xt.xt.', 7), 'K.x.t.t.t.t.tttt'),
});
const crag = {
  name: 'crag', bpm: 108, inst: I, pump: 0.15, drums: 0.6, reverb: { room: 0.82, wet: 0.24 },
  tracks: {
    sitar: { inst: 'sitar', gain: 0.8, pan: -0.15, verb: 0.3 },
    oboe: { inst: 'oboe', gain: 0.8, pan: -0.1, verb: 0.3 },
    pluck: { inst: 'pluckSoft', gain: 0.2, pan: 0.25, echo: { rows: 2, fb: 0.3, wet: 0.3 }, verb: 0.2 },
    drone: { inst: 'strings', gain: 0.15, pan: 0.3, verb: 0.4 },
    bass: { inst: 'pizz', gain: 0.35, verb: 0.15 },
  },
  patterns: { A: cragPart(cragA, cragChartA, 'sitar'), B: cragPart(cragB, cragChartB, 'oboe') },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- The forest (D dorian, gentle: pan flute, harp, marimba) ----------
const forestA = bars('D5:4 F5:4 A5:6 G5:2', 'B5:4 A5:2 G5:2 D5:8', 'F5:4 E5:2 D5:2 A5:4 C6:4', 'G5:8 E5:4 C5:4', 'D5:4 F5:2 G5:2 A5:4 Bb5:4', 'C6:4 B5:2 G5:2 E5:8', 'A5:4 G5:2 E5:2 C5:4 E5:4', 'D5:12 r:4');
const forestB = bars('A5:6 C6:2 A5:4 F5:4', 'G5:6 E5:2 C5:8', 'F5:4 A5:4 D6:4 C6:4', 'A5:4 E5:4 C5:8', 'Bb5:6 A5:2 F5:4 D5:4', 'C6:6 A5:2 F5:8', 'B5:4 G5:4 D5:4 B4:4', 'C#5:4 E5:4 A5:8');
const forestChartA = ['Dm', 'G', 'Dm', 'C', 'Bb', 'C', 'Am', 'Dm'];
const forestChartB = ['F', 'C', 'Dm', 'Am', 'Bb', 'F', 'G', 'A'];
const forestPart = (mel, chart) => ({
  lead: mel,
  harp: part(chart, F.arp(62, 2)),
  marimba: part(chart, F.offbeat(67)),
  strings: part(chart, F.hold(57)),
  bass: part(chart, F.bounce(2)),
  drums: bars('K...h.h.x...h.h.', 'K...h.h.x...hxh.'),
});
const forest = {
  name: 'forest', bpm: 92, inst: I, drums: 0.55, pump: 0.1, reverb: { room: 0.88, wet: 0.3 },
  tracks: {
    lead: { inst: 'panflute', gain: 0.65, pan: -0.1, echo: { rows: 3, fb: 0.2, wet: 0.15 }, verb: 0.35 },
    harp: { inst: 'harp', gain: 0.32, pan: 0.35, verb: 0.35 },
    marimba: { inst: 'marimba', gain: 0.2, pan: -0.35, verb: 0.25 },
    strings: { inst: 'strings', gain: 0.18, pan: 0.1, verb: 0.45 },
    bass: { inst: 'pizz', gain: 0.5, verb: 0.15 },
  },
  patterns: { A: forestPart(forestA, forestChartA), B: forestPart(forestB, forestChartB) },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- The mage grove (E dorian waltz in 3/4: oboe, celesta, harp) ----------
const groveA = bars('E5:4 G5:4 B5:4', 'C#6:6 B5:2 A5:4', 'G5:4 F#5:4 E5:4', 'F#5:8 D5:4', 'E5:4 G5:4 C6:4', 'D6:6 C6:2 A5:4', 'B5:4 G5:4 E5:4', 'F#5:8 B4:4');
const groveA2 = bars('E6:6 D6:2 B5:4', 'C#6:4 A5:4 E5:4', 'G5:6 A5:2 B5:4', 'D6:8 B5:4', 'C6:4 B5:4 G5:4', 'A5:4 F#5:4 D5:4', 'E5:4 F#5:4 G5:4', 'E5:12');
const groveChartA = ['Em', 'A', 'Em', 'Bm', 'C', 'D', 'Em', 'B'];
const groveChartA2 = ['Em', 'A', 'Em', 'Bm', 'C', 'D', 'Em', 'Em'];
const grovePart = (mel, chart) => ({
  lead: mel,
  celesta: shift(mel, 12),
  harp: part(chart, F.waltzChord(64), 12),
  bass: part(chart, F.waltzBass(2), 12),
  strings: part(chart, F.hold(57), 12),
  drums: 'x.....x.....|x.....x...x.',
});
const grove = {
  name: 'grove', bpm: 88, rows: 12, inst: I, drums: 0.5, reverb: { room: 0.9, wet: 0.34 },
  tracks: {
    lead: { inst: 'oboe', gain: 0.6, pan: -0.1, verb: 0.35 },
    celesta: { inst: 'celesta', gain: 0.16, pan: 0.45, delay: 2, verb: 0.5 },
    harp: { inst: 'harp', gain: 0.32, pan: 0.3, verb: 0.35 },
    bass: { inst: 'pizz', gain: 0.5, verb: 0.2 },
    strings: { inst: 'strings', gain: 0.15, pan: -0.3, verb: 0.5 },
  },
  patterns: { A: grovePart(groveA, groveChartA), A2: grovePart(groveA2, groveChartA2) },
  order: ['A', 'A2'],
};

// ---------- The ruins (A minor: a harp and choir bed, a horn lead joining in) ----------
const ruinsChart = ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'E'];
const ruinsBed = {
  harp: part(ruinsChart, F.arp(62, 2)),
  choir: part(ruinsChart, F.hold(60)),
  bass: part(ruinsChart, F.root(2)),
  pad: part(ruinsChart, F.hold(57)),
  timp: bars('A2:8 r:8', 'r:16', 'r:16', 'r:16', 'A2:8 r:8', 'r:16', 'r:16', 'E2:4 E2:4 E2:8'),
};
const ruins = {
  name: 'ruins', bpm: 84, inst: I, drums: 0.6, reverb: { room: 0.9, wet: 0.34 },
  tracks: {
    lead: { inst: 'horn', gain: 0.6, pan: -0.1, verb: 0.4 },
    harp: { inst: 'harp', gain: 0.3, pan: 0.35, verb: 0.4 },
    choir: { inst: 'choir', gain: 0.22, pan: -0.3, verb: 0.5 },
    bass: { inst: 'pizz', gain: 0.45, verb: 0.2 },
    pad: { inst: 'padDark', gain: 0.25, verb: 0.4 },
    timp: { inst: 'timpani', gain: 0.4, verb: 0.35 },
  },
  patterns: {
    A: { ...ruinsBed, lead: bars('r:16', 'r:16', 'r:16', 'r:16', 'E5:6 D5:2 C5:4 E5:4', 'A5:8 G5:4 F5:4', 'G5:6 F5:2 D5:4 B4:4', 'G#5:8 E5:8'), drums: 'K.......x.......|K.......x...h.h.' },
    B: { ...ruinsBed, lead: bars('A5:6 B5:2 C6:4 A5:4', 'F5:8 C6:8', 'E5:4 G5:4 C6:4 E6:4', 'D6:12 B5:4', 'C6:6 B5:2 A5:4 E5:4', 'F5:6 E5:2 D5:4 C5:4', 'B4:4 D5:4 G5:4 B5:4', 'G#5:12 r:4'), drums: 'K...h...S...h...|K...h...S...h.h.' },
  },
  order: ['A', 'B'],
};

// ---------- The crystal cave: "Glass Hollow" (A minor, slow, echoing) ----------
const caveLine = bars('r:4 E5:4 B5:6 A5:2', 'C6:8 B5:4 E5:4', 'A5:6 G5:2 E5:8', 'D5:12 r:4', 'r:4 C5:4 F5:4 A5:4', 'B5:8 G5:4 E5:4', 'F5:6 E5:2 D5:4 F5:4', 'G#5:8 B5:4 E5:4');
const caveChart = ['Amadd9', 'FM7', 'Am', 'G', 'FM7', 'Em', 'Dm', 'E'];
const caveBed = {
  strings: part(caveChart, F.hold(57)),
  choir: part(caveChart, (s, len) => `${nm(chord(s, 64).tones[1])}:${len}`),
  bass: part(caveChart, (s, len) => `${nm(rootIn(s, 2))}:${len / 2} ${nm(rootIn(s, 2) + 7)}:${len / 2}`),
};
const cave = {
  name: 'cave', bpm: 76, inst: I, drums: 0.6, reverb: { room: 0.93, wet: 0.4, damp: 0.25 },
  tracks: {
    lead: { inst: 'celesta', gain: 0.75, pan: -0.15, echo: { rows: 3, fb: 0.4, wet: 0.4 }, verb: 0.5 },
    strings: { inst: 'strings', gain: 0.18, pan: 0.3, verb: 0.5 },
    choir: { inst: 'choir', gain: 0.16, pan: -0.35, verb: 0.6 },
    bass: { inst: 'pizz', gain: 0.4, verb: 0.3 },
  },
  patterns: {
    A: { ...caveBed, lead: caveLine, drums: '........w.......|............w...' },
    A2: { ...caveBed, lead: `@glock ${shift(caveLine, 12)}`, drums: '........w.......|....w.......w...' },
  },
  order: ['A', 'A2'],
};

// ---------- The sky (D Lydian, high and airy: flute, bells, harp) ----------
const skyLine = bars('A5:4 F#5:2 A5:2 D6:8', 'G#5:4 B5:2 G#5:2 E6:8', 'F#6:4 E6:2 D6:2 A5:4 F#5:4', 'G#5:4 B5:4 E6:4 G#6:4', 'F#6:6 E6:2 D6:4 B5:4', 'G#5:6 B5:2 E6:8', 'D6:4 B5:2 G5:2 D6:4 G6:4', 'E6:8 C#6:4 A5:4');
const skyChart = ['D', 'E', 'D', 'E', 'Bm', 'E', 'G', 'A'];
const skyPart = (mel) => ({
  lead: mel,
  bell: shift(mel, 12),
  harp: part(skyChart, F.arp(66, 2)),
  pad: part(skyChart, F.hold(62)),
  bass: part(skyChart, (s, len) => `${s === 'E' ? 'D2' : nm(rootIn(s, 1))}:${len}`),
  drums: 'K...x...h...x...|K...x...h.h.x.x.',
});
const sky = {
  name: 'sky', bpm: 112, inst: I, drums: 0.5, pump: 0.12, reverb: { room: 0.9, wet: 0.36 },
  tracks: {
    lead: { inst: 'flute', gain: 0.6, pan: -0.15, verb: 0.4 },
    bell: { inst: 'bell', gain: 0.25, pan: 0.5, delay: 3, verb: 0.5 },
    harp: { inst: 'harp', gain: 0.3, pan: 0.35, verb: 0.4 },
    pad: { inst: 'pad', gain: 0.35, verb: 0.4 },
    bass: { inst: 'sub', gain: 0.28, verb: 0 },
  },
  patterns: { A: skyPart(skyLine), A2: skyPart(shift(skyLine, -12)) },
  order: ['A', 'A2'],
};

// ---------- The Hollow (C minor, a grumbling dungeon march: horns, brass, a growling bass) ----------
const hollowA = bars('C5:4 Eb5:2 C5:2 G4:4 r:4', 'Ab4:4 F4:2 Ab4:2 Db5:8', 'C5:2 Eb5:2 G5:4 F5:2 Eb5:2 D5:4', 'B4:8 r:4 G4:4', 'C5:4 Eb5:2 C5:2 G5:4 r:4', 'F5:4 Eb5:2 Db5:2 C5:8', 'Eb5:4 C5:2 Ab4:2 Eb5:4 F5:4', 'D5:4 B4:4 G4:8');
const hollowB = bars('G5:8 Ab5:4 G5:4', 'F5:8 Eb5:8', 'Eb5:4 F5:4 G5:4 C6:4', 'B5:12 r:4', 'C6:8 Bb5:4 Ab5:4', 'G5:8 F5:4 Eb5:4', 'F5:4 Eb5:4 D5:4 F5:4', 'G5:12 r:4');
const hollowChartA = ['Cm', 'Db', 'Cm', 'G', 'Cm', 'Db', 'Ab', 'G'];
const hollowChartB = ['Cm', 'Db', 'Ab', 'G', 'Ab', 'Cm', 'Fm', 'G'];
const grumble = (s, len) => {
  const r = rootIn(s, 1);
  return Array(len / 16).fill(`${nm(r)}:2 ${nm(r)}:2 ${nm(r)}:2 ${nm(r + 1)}:2 ${nm(r)}:2 ${nm(r)}:2 ${nm(r + 7)}:2 ${nm(r)}:2`).join(' ');
};
const hollowPart = (mel, chart, lead) => ({
  [lead]: mel,
  stabs: part(chart, F.offbeat(58)),
  bass: part(chart, (s, len) => shift(grumble(s, len), 12)),
  low: part(chart, grumble),
  strings: part(chart, F.hold(55)),
  drums: bars(times('K.h.S.hKK.h.S.h.', 7), 'K.h.S.S.S.SSt.t.'),
});
const hollow = {
  name: 'hollow', bpm: 112, inst: I, pump: 0.2, drums: 0.8, reverb: { room: 0.86, wet: 0.28 },
  tracks: {
    horn: { inst: 'horn', gain: 0.85, pan: -0.1, verb: 0.35 },
    oboe: { inst: 'oboe', gain: 0.75, pan: -0.1, verb: 0.35 },
    stabs: { inst: 'brassStab', gain: 0.45, pan: 0.3, verb: 0.3 },
    bass: { inst: 'pizz', gain: 0.35, verb: 0.1 },
    low: { inst: 'synbass', gain: 0.24, verb: 0 },
    strings: { inst: 'strings', gain: 0.16, pan: -0.35, verb: 0.45 },
  },
  patterns: { A: hollowPart(hollowA, hollowChartA, 'horn'), B: hollowPart(hollowB, hollowChartB, 'oboe') },
  order: ['A', 'A', 'B', 'A'],
};

// ---------- Bosses: "Crystal King" (C harmonic minor, galloping: brass, strings, choir, drums) ----------
const bossA = bars('C5:2 C5:2 G5:4 F5:2 Eb5:2 D5:2 Eb5:2', 'C5:2 C5:2 G5:4 Ab5:4 G5:4', 'Ab5:4 G5:2 F5:2 Eb5:4 C5:4', 'D5:4 F5:4 Bb5:8', 'C6:2 C6:2 G5:4 F5:2 Eb5:2 D5:2 Eb5:2', 'C6:2 Bb5:2 G5:4 Eb6:4 D6:4', 'C6:4 Ab5:4 D6:4 Bb5:4', 'B5:8 D6:4 G5:4');
const bossB = bars('F5:8 Ab5:8', 'C6:16', 'Db6:8 C6:4 Bb5:4', 'Bb5:12 G5:4', 'Ab5:8 C6:8', 'D6:8 F6:8', 'Eb6:4 D6:4 B5:8', 'G5:12 G5:2 B5:2');
const bossChartA = ['Cm', 'Cm', 'Ab', 'Bb', 'Cm', 'Cm', 'Ab Bb', 'G'];
const bossChartB = ['Fm', 'Fm', 'Db', 'Eb', 'Ab', 'Bb', 'G', 'G'];
const bossPart = (mel, chart) => ({
  lead: mel,
  violin: shift(mel, 12),
  stabs: part(chart, F.offbeat(60)),
  strings: part(chart, F.arp(60, 1)),
  choir: part(chart, F.hold(62)),
  bass: part(chart, F.gallop(1)),
  timp: part(chart, (s, len) => `${nm(rootIn(s, 2))}:${len / 2} r:${len / 2}`),
  drums: bars(times('K.hhS.hKK.hhS.hh', 7), 'S.S.SSSSt.t.ttSS'),
});
const boss = {
  name: 'boss', bpm: 160, inst: I, pump: 0.25, drums: 0.95, reverb: { room: 0.86, wet: 0.26 },
  tracks: {
    lead: { inst: 'brass', gain: 0.8, pan: -0.1, verb: 0.3 },
    violin: { inst: 'violin', gain: 0.3, pan: 0.25, verb: 0.35 },
    stabs: { inst: 'stab', gain: 0.25, pan: 0.35, verb: 0.2 },
    strings: { inst: 'strings', gain: 0.2, pan: -0.35, verb: 0.35 },
    choir: { inst: 'choir', gain: 0.18, pan: 0.1, verb: 0.5 },
    bass: { inst: 'synbass', gain: 0.36, verb: 0 },
    timp: { inst: 'timpani', gain: 0.35, verb: 0.3 },
  },
  patterns: {
    sting: { lead: 'C6:2 G5:2 Eb5:2 C5:2 B4:4 G4:4', timp: 'C3:4 C3:4 G2:8', bass: 'C2:4 C2:4 G1:8', drums: 'B...B...S.S.SSSS' },
    A: bossPart(bossA, bossChartA),
    B: bossPart(bossB, bossChartB),
  },
  intro: ['sting'],
  order: ['A', 'A', 'B', 'A'],
};

export const SONGS = { title, town, meadow, harbor, crag, forest, grove, ruins, cave, sky, hollow, boss };

// Each field and town song's fight layer: the same song, bar for bar (so it loops in step with
// it), with only its bass and a driving drum line of its own, heavier. The music player fades it
// in on top of the area's song while there's a fight on, and out again after (music.js). The
// other parts stay in, silenced, so every section keeps the same length.
const FIGHT_DRUMS = { 16: 'K.h.S.hKK.h.S.tt', 12: 'K.hS.hK.hS.t' };
for (const key of ['town', 'meadow', 'harbor', 'crag', 'forest', 'grove', 'ruins', 'cave', 'sky', 'hollow']) {
  const song = SONGS[key];
  const grid = FIGHT_DRUMS[song.rows ?? 16] ?? FIGHT_DRUMS[16];
  SONGS[`${key}-fight`] = {
    ...song,
    name: `${key}-fight`,
    drums: 1.15,
    pump: 0.3,
    tracks: Object.fromEntries(Object.entries(song.tracks).map(([k, tr]) => [k, k === 'bass' || k === 'sub' ? { ...tr, gain: tr.gain * 1.3 } : { ...tr, gain: 0 }])),
    patterns: Object.fromEntries(Object.entries(song.patterns).map(([k, pat]) => [k, { ...pat, drums: grid }])),
  };
}
