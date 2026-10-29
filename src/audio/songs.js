// The music: one written song per area, arranged for real recorded instruments with modern
// production (studio.js renders them). Every melody is written out note by note; the
// accompaniment is built from each song's written chord chart by the helpers below (strums,
// arpeggios, basslines, pads), so each part follows the harmony exactly.
//
// The sound, area by area (see docs/audio/README.md). Each town has a style of its own and each
// song runs four or five sections (a hook, an answer, a bridge or a contrasting verse, the hook
// again), so a loop takes a minute and a half or more:
// - Sprout Village: "Treetop Picnic", a swung, hopping flute hook with a marimba answering it, a
//   bridge in the relative minor, and the hook a step up.
// - Pastel Harbor: "Seaside Café", bossa nova: flute over nylon-guitar comping, jazz chords, a
//   piano solo.
// - Ember Crag: "March of the Hall", a brass march with a lyrical horn trio.
// - Moonleaf Grove: "Moonleaf Waltz", a violin waltz, a turn to C minor, a music-box verse.
// - Meadows: "Petal Dash", the adventure theme: flute and violin, a chase, a half-time lift.
// - Forest: "Mossy Jig", a Celtic jig in 6/8 on pan flute, with a slow air in the middle.
// - Ruins: "Forgotten Hymn", a horn hymn with the choir taking it alone.
// - Cave: "Crystal Lullaby", a celesta music box with one verse in the major.
// - Sky: "Cloud Garden", Lydian flute and bells.
// At night the towns play an evening version of their song: slower, softer, the lead on piano.
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

// ---------- Arranging helpers for the town and field songs ----------
// 4/4 bossa figures: the chord on the bossa's syncopated pulse, and the root and fifth beneath.
F.bossa = (c = 62) => (s, len) => (len === 16 ? `${tones(s, c)}:3 r:3 ${tones(s, c)}:2 r:2 ${tones(s, c)}:3 r:1 ${tones(s, c)}:2` : `${tones(s, c)}:3 r:1 ${tones(s, c)}:2 r:2`);
F.bossaBass = (oct = 2) => (s, len) => {
  const r = rootIn(s, oct);
  return len === 16 ? `${nm(r)}:6 ${nm(r + 7)}:2 ${nm(r + 7)}:6 ${nm(r)}:2` : `${nm(r)}:6 ${nm(r + 7)}:2`;
};
// A march: root and fifth on the beats, like a tuba.
F.oompah = (oct = 2) => (s, len) => {
  const r = rootIn(s, oct);
  return Array(len / 8).fill(`${nm(r)}:3 r:1 ${nm(r + 7)}:3 r:1`).join(' ');
};
// A bar of rest, for a part sitting a section out.
const rest = (n, rows = 16) => times(`r:${rows}`, n);

// ---------- Town: "Treetop Picnic" (Sprout Village; F major, swung, bouncy) ----------
// A hook that hops (flute), a marimba answering it, a bridge in D minor where the strings swell,
// and the hook back a whole step up in G before it all drops home to F again.
const picnicA = ['C5:2 F5:2 A5:3 G5:1 F5:4 C5:4', 'E5:2 G5:2 C6:4 A5:8', 'D5:2 F5:2 Bb5:3 A5:1 G5:4 F5:4', 'E5:6 G5:2 Bb5:4 G5:4', 'C5:2 F5:2 A5:3 G5:1 F5:4 A5:4', 'D6:6 C6:2 A5:4 F5:4', 'G5:4 Bb5:4 A5:2 G5:2 E5:4'];
const picnic = {
  A: { mel: bars(...picnicA, 'F5:12 r:4'), chart: ['F', 'Am7', 'Bb', 'C7', 'F', 'Dm7', 'Gm7 C7', 'F'] },
  B: {
    mel: bars('D6:4 C6:2 Bb5:2 A5:8', 'r:8 G5:2 A5:2 G5:2 E5:2', 'C6:4 B5:2 A5:2 E5:8', 'r:8 F5:2 G5:2 A5:2 C6:2', 'D6:4 C6:2 Bb5:2 G5:8', 'r:8 A5:2 G5:2 E5:2 C5:2', 'D5:4 F5:4 E5:4 G5:4', 'F5:8 r:8'),
    answer: bars('r:8 F5:2 G5:2 A5:2 C6:2', 'E6:4 C6:4 r:8', 'r:8 A5:2 C6:2 E6:2 C6:2', 'A5:4 F5:4 r:8', 'r:8 Bb5:2 D6:2 G6:2 D6:2', 'C6:4 A5:4 r:8', 'r:16', 'r:8 C6:2 A5:2 F5:2 C5:2'),
    chart: ['BbM7', 'C', 'Am7', 'Dm7', 'Gm7', 'Am7', 'BbM7 C7', 'F'],
  },
  C: { mel: bars('A5:6 F5:2 D5:8', 'D6:6 C6:2 Bb5:8', 'G5:4 Bb5:4 D6:4 C6:4', 'C#6:8 A5:8', 'F5:4 A5:4 D6:6 E6:2', 'F6:8 D6:4 Bb5:4', 'D6:6 C6:2 Bb5:4 G5:4', 'F#5:4 A5:4 C6:4 D6:4'), chart: ['Dm', 'Bb', 'Gm', 'A7', 'Dm', 'Bb', 'Gm7', 'D7'] },
  D: { mel: bars(...picnicA.map((b) => shift(b, 2)), 'E5:4 G5:4 Bb5:4 C6:4'), chart: ['G', 'Bm7', 'C', 'D7', 'G', 'Em7', 'Am7 D7', 'C7'] },
};
const picnicDrums = bars(times('K...h.c.h...h.hh', 3), 'K...h.c.h...hxhh', times('K...h.c.h...h.hh', 3), 'K...h.c.h.c.c.cc');
const picnicPart = ({ mel, chart, answer }, { glock = false, swell = false } = {}) => ({
  lead: mel,
  double: shift(mel, -12),
  ...(glock ? { glock: shift(mel, 12) } : {}),
  ...(answer ? { answer } : {}),
  guitar: part(chart, F.offbeat(62)),
  strings: swell ? part(chart, F.hold(62)) : part(chart, (s, len) => `${nm(chord(s).tones[0] - 12)}:${len}`),
  bass: part(chart, F.bounce(2)),
  sub: part(chart, F.bounce(1)),
  drums: swell ? bars(times('K.......h.......', 7), 'K...S...S.S.SSSS') : picnicDrums,
});
const town = {
  name: 'town', bpm: 104, swing: 0.6, inst: I, pump: 0.18, drums: 0.7, reverb: { room: 0.85, wet: 0.26 },
  tracks: {
    lead: { inst: 'flute', gain: 0.72, pan: -0.05, verb: 0.3 },
    double: { inst: 'pluckSoft', gain: 0.32, pan: 0.1, echo: { rows: 3, fb: 0.25, wet: 0.25 }, verb: 0.2 },
    answer: { inst: 'marimba', gain: 0.42, pan: 0.35, verb: 0.25 },
    glock: { inst: 'glock', gain: 0.26, pan: 0.45, delay: 3, verb: 0.4 },
    guitar: { inst: 'guitar', gain: 0.32, pan: 0.3, verb: 0.25 },
    strings: { inst: 'strings', gain: 0.2, pan: -0.35, verb: 0.45 },
    bass: { inst: 'pizz', gain: 0.45, verb: 0.15 },
    sub: { inst: 'sub', gain: 0.2, verb: 0 },
  },
  patterns: { A: picnicPart(picnic.A), B: picnicPart(picnic.B), C: picnicPart(picnic.C, { swell: true }), D: picnicPart(picnic.D, { glock: true }) },
  order: ['A', 'A', 'B', 'C', 'D'],
};

// ---------- Meadows: "Petal Dash" (G major, bright and running: flute, violin, pop drums) ----------
// The adventure theme: a hook that climbs, a chase in E minor, a half-time lift in C with the
// violin singing over it, then the chase and the hook again.
const dash = {
  A: { mel: bars('D5:2 G5:2 B5:2 D6:2 B5:4 G5:4', 'A5:2 F#5:2 A5:2 D6:2 C#6:4 A5:4', 'B5:2 G5:2 E5:2 G5:2 B5:4 E6:4', 'D6:4 C6:4 G5:8', 'D5:2 G5:2 B5:2 D6:2 G6:4 F#6:4', 'E6:4 D6:4 A5:8', 'G5:4 E5:4 F#5:4 A5:4', 'G5:12 r:4'), chart: ['G', 'D', 'Em', 'C', 'G', 'D', 'C D', 'G'] },
  B: { mel: bars('E6:4 D6:2 B5:2 G5:4 B5:4', 'C6:6 B5:2 A5:4 G5:4', 'B5:4 A5:2 G5:2 D5:4 G5:4', 'F#5:8 A5:8', 'G5:4 B5:4 E6:6 D6:2', 'C6:4 E6:4 G6:8', 'E6:4 C6:4 A5:4 G5:4', 'F#5:4 A5:4 D6:8'), chart: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am7', 'D'] },
  C: { mel: bars('E6:8 G5:8', 'D6:8 B5:8', 'C6:6 B5:2 A5:8', 'A5:4 C6:4 F6:8', 'G6:8 E6:8', 'D6:6 E6:2 D6:8', 'C6:4 A5:4 F5:8', 'F#5:4 A5:4 C6:4 D6:4'), chart: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'D7'] },
};
const dashPart = ({ mel, chart }, { half = false, sing = false } = {}) => ({
  lead: mel,
  pluck: half ? rest(8) : mel,
  ...(sing ? { violin: shift(mel, -12) } : { violin: part(chart, (s, len) => `${nm(chord(s, 72).tones[1])}:${len}`) }),
  marimba: part(chart, F.arp(67, 2)),
  guitar: part(chart, F.strum(62)),
  bass: half ? part(chart, F.root(2)) : part(chart, F.octaves(2)),
  drums: half ? bars(times('K.......S.......', 7), 'K...S...S.S.SSSS') : bars(times('K.h.S.h.K.hKS.h.', 7), 'K.h.S.h.S.SSt.t.'),
});
const meadow = {
  name: 'meadow', bpm: 140, inst: I, pump: 0.22, drums: 0.8, reverb: { room: 0.8, wet: 0.2 },
  tracks: {
    lead: { inst: 'flute', gain: 0.8, pan: -0.1, verb: 0.25 },
    pluck: { inst: 'pluck', gain: 0.28, pan: 0.15, echo: { rows: 3, fb: 0.25, wet: 0.2 }, verb: 0.15 },
    violin: { inst: 'violin', gain: 0.3, pan: 0.25, verb: 0.35 },
    marimba: { inst: 'marimba', gain: 0.2, pan: 0.4, verb: 0.2 },
    guitar: { inst: 'guitar', gain: 0.28, pan: -0.35, verb: 0.2 },
    bass: { inst: 'synbass', gain: 0.36, verb: 0 },
  },
  patterns: { A: dashPart(dash.A), B: dashPart(dash.B), C: dashPart(dash.C, { half: true, sing: true }) },
  order: ['A', 'A', 'B', 'C', 'B', 'A'],
};

// ---------- Harbor: "Seaside Café" (Pastel Harbor; G major bossa nova) ----------
// A flute over nylon-guitar bossa comping, brushed drums and a walking root-fifth bass, jazz chords
// (major sevenths, ii-V turns), a turn to E minor, and a piano solo over its own changes.
const cafe = {
  A: { mel: bars('B5:3 A5:3 G5:2 F#5:8', 'E5:3 G5:3 A5:2 C6:6 B5:2', 'D6:3 C#6:3 B5:2 F#5:8', 'G#5:4 B5:4 D6:8', 'C6:3 B5:3 A5:2 E5:8', 'F#5:3 A5:3 C6:2 B5:4 A5:4', 'B5:8 D6:4 F#6:4', 'E6:4 C6:4 A5:4 F#5:4'), chart: ['GM7', 'Am7 D7', 'Bm7', 'E7', 'Am7', 'D7', 'GM7', 'Am7 D7'] },
  B: { mel: bars('E6:6 D6:2 B5:4 G5:4', 'D#6:6 C6:2 A5:4 F#5:4', 'G5:6 B5:2 E6:8', 'C#6:4 E6:4 G6:4 E6:4', 'C6:6 B5:2 A5:4 G5:4', 'F#5:4 A5:4 C6:4 E6:4', 'D6:8 G#5:8', 'A5:4 B5:4 C6:4 D6:4'), chart: ['CM7', 'B7', 'Em7', 'A7', 'Am7', 'D7', 'GM7 E7', 'Am7 D7'] },
  C: { solo: bars('B5:2 G5:2 E5:2 G5:2 B5:4 D6:4', 'C#6:6 B5:2 A5:4 G5:4', 'F#5:2 A5:2 C#6:2 E6:2 D6:8', 'B5:4 A5:4 F#5:8', 'E5:4 G#5:4 A#5:4 C#6:4', 'D6:6 C#6:2 B5:8', 'G5:4 B5:4 C#6:4 E6:4', 'C6:4 A5:4 F#5:4 D5:4'), chart: ['Em7', 'A7', 'DM7', 'GM7', 'C#m7 F#7', 'Bm7', 'Em7 A7', 'Am7 D7'] },
};
const cafePart = ({ mel, solo, chart }) => ({
  ...(mel ? { lead: mel } : {}),
  ...(solo ? { piano: solo } : {}),
  guitar: part(chart, F.bossa(60)),
  pad: part(chart, F.hold(64)),
  bass: part(chart, F.bossaBass(2)),
  drums: times('K.hxh.K.hxh.K.hx', 8),
});
const harbor = {
  name: 'harbor', bpm: 112, inst: I, drums: 0.5, reverb: { room: 0.84, wet: 0.26 },
  tracks: {
    lead: { inst: 'flute', gain: 0.72, pan: -0.05, verb: 0.3 },
    piano: { inst: 'piano', gain: 0.75, pan: 0.1, verb: 0.3 },
    guitar: { inst: 'guitar', gain: 0.4, pan: 0.3, verb: 0.2 },
    pad: { inst: 'pad', gain: 0.25, pan: -0.3, verb: 0.4 },
    bass: { inst: 'ebass', gain: 0.45, verb: 0.05 },
  },
  patterns: { A: cafePart(cafe.A), B: cafePart(cafe.B), C: cafePart(cafe.C) },
  order: ['A', 'B', 'A', 'C', 'B', 'A'],
};

// ---------- Ember Crag: "March of the Hall" (the warriors' town; Bb major, a brass march) ----------
// Trumpets on the tune over an oom-pah bass and snare, horns taking a minor turn, and a lyrical
// trio in Eb in the middle, as marches go.
const hall = {
  A: { mel: bars('F5:3 F5:1 Bb5:4 D6:4 Bb5:4', 'C6:3 Bb5:1 G5:4 Eb6:8', 'C5:3 C5:1 F5:4 A5:4 C6:4', 'D6:8 Bb5:8', 'G5:3 A5:1 Bb5:4 D6:4 Bb5:4', 'Eb6:6 D6:2 C6:4 Bb5:4', 'A5:4 C6:4 E5:4 G5:4', 'F5:12 r:4'), chart: ['Bb', 'Eb', 'F', 'Bb', 'Gm', 'Eb', 'C7', 'F'] },
  B: { mel: bars('D5:4 G5:4 Bb5:6 A5:2', 'F#5:4 A5:4 C6:8', 'Bb5:4 G5:4 D6:6 C6:2', 'Bb5:8 G5:8', 'C6:4 Eb6:4 G5:4 C6:4', 'A5:4 C6:4 F5:8', 'D6:4 F5:4 G5:4 Bb5:4', 'E5:4 G5:4 A5:8'), chart: ['Gm', 'D7', 'Gm', 'Eb', 'Cm', 'F', 'Bb Gm', 'C7 F'] },
  C: { mel: bars('G5:6 F5:2 Eb5:8', 'F5:4 Ab5:4 D5:8', 'Bb5:6 Ab5:2 G5:8', 'C6:6 Bb5:2 Ab5:8', 'G5:4 Bb5:4 Eb6:8', 'C6:4 Bb5:4 G5:8', 'A5:4 C6:4 Eb6:4 C6:4', 'D6:4 Bb5:4 Ab5:4 F5:4'), chart: ['Eb', 'Bb7', 'Eb', 'Ab', 'Eb', 'Cm', 'F7', 'Bb7'] },
};
const hallPart = ({ mel, chart }, { trio = false } = {}) => ({
  ...(trio ? { horn: shift(mel, -12) } : { lead: mel }),
  brass: part(chart, (s, len) => Array(len / 8).fill(`r:4 ${tones(s, 60)}:3 r:1`).join(' ')),
  strings: trio ? part(chart, F.hold(62)) : rest(8),
  bass: part(chart, F.oompah(2)),
  timp: part(chart, (s, len) => Array(len / 8).fill(`${nm(rootIn(s, 2))}:4 r:4`).join(' ')),
  drums: trio ? times('K.......h.......', 8) : bars(times('K.S.K.S.K.S.KSSS', 3), 'K.S.SSSSS.S.S.SS', times('K.S.K.S.K.S.KSSS', 3), 'S.SSS.SSSSSSSSSS'),
});
const crag = {
  name: 'crag', bpm: 120, inst: I, pump: 0.1, drums: 0.75, reverb: { room: 0.84, wet: 0.24 },
  tracks: {
    lead: { inst: 'trumpet', gain: 0.6, pan: -0.05, verb: 0.3 },
    horn: { inst: 'horn', gain: 0.7, pan: 0.05, verb: 0.35 },
    brass: { inst: 'brassStab', gain: 0.3, pan: 0.3, verb: 0.25 },
    strings: { inst: 'strings', gain: 0.22, pan: -0.3, verb: 0.45 },
    bass: { inst: 'pizz', gain: 0.5, verb: 0.15 },
    timp: { inst: 'timpani', gain: 0.35, verb: 0.3 },
  },
  patterns: { A: hallPart(hall.A), B: hallPart(hall.B), C: hallPart(hall.C, { trio: true }) },
  order: ['A', 'A', 'B', 'A', 'C', 'C', 'A'],
};

// ---------- The forest: "Mossy Jig" (E minor, a Celtic jig in 6/8: pan flute, pizzicato, harp) ----------
// Two quick jig tunes (the second brighter, in G) and a slow air in the middle where only the
// harp and the flute are left.
const jig = {
  A: { mel: bars('E5:2 G5:2 B5:2 E6:2 B5:2 G5:2', 'F#5:2 A5:2 D6:2 A5:4 F#5:2', 'G5:2 B5:2 E6:2 G6:4 E6:2', 'F#6:4 D6:2 B5:6', 'E5:2 G5:2 B5:2 E6:2 B5:2 G5:2', 'A5:2 F#5:2 D5:2 F#5:2 A5:2 D6:2', 'E6:4 C6:2 G5:4 E5:2', 'F#5:6 D5:6'), chart: ['Em', 'D', 'Em', 'Bm', 'Em', 'D', 'C', 'D'] },
  B: { mel: bars('D6:4 B5:2 G5:4 B5:2', 'A5:4 F#5:2 D5:6', 'E5:2 F#5:2 G5:2 B5:4 G5:2', 'C6:6 E6:6', 'D6:2 C6:2 B5:2 G5:2 B5:2 D6:2', 'F#6:4 E6:2 D6:6', 'C6:2 B5:2 A5:2 E5:2 A5:2 C6:2', 'D#6:6 B5:6'), chart: ['G', 'D', 'Em', 'C', 'G', 'D', 'Am', 'B7'] },
  C: { mel: bars('A5:6 C6:6', 'B5:12', 'C6:6 E6:6', 'D6:12', 'E6:6 C6:6', 'B5:6 G5:6', 'A5:6 E5:6', 'D#5:12'), chart: ['Am', 'Em', 'C', 'D', 'Am', 'Em', 'C', 'B7'] },
};
const jigPart = ({ mel, chart }, { air = false } = {}) => ({
  lead: mel,
  harp: part(chart, F.arp(62, 2), 12),
  guitar: air ? rest(8, 12) : part(chart, F.sixEightChord(62), 12),
  bass: air ? part(chart, F.root(2), 12) : part(chart, F.sixEight(2), 12),
  drums: air ? times('K...........', 8) : times('K.hS.hK.hS.h', 8),
});
const forest = {
  name: 'forest', bpm: 100, rows: 12, inst: I, drums: 0.55, reverb: { room: 0.88, wet: 0.3 },
  tracks: {
    lead: { inst: 'panflute', gain: 0.75, pan: -0.05, verb: 0.3 },
    harp: { inst: 'harp', gain: 0.3, pan: 0.35, verb: 0.4 },
    guitar: { inst: 'pizz', gain: 0.35, pan: -0.3, verb: 0.2 },
    bass: { inst: 'pizz', gain: 0.45, verb: 0.15 },
  },
  patterns: { A: jigPart(jig.A), B: jigPart(jig.B), C: jigPart(jig.C, { air: true }) },
  order: ['A', 'A', 'B', 'C', 'B', 'A'],
};

// ---------- Moonleaf Grove: "Moonleaf Waltz" (the mages' town; Eb major waltz: violin, celesta, harp) ----------
// A violin waltz, a turn into C minor, and a music-box verse where the celesta takes over.
const waltz = {
  A: { mel: bars('G5:4 Bb5:4 Eb6:4', 'D6:4 C6:8', 'Ab5:4 C6:4 Eb6:4', 'D6:8 Bb5:4', 'G5:4 Bb5:4 G6:4', 'F6:4 D6:4 Bb5:4', 'C6:4 Eb6:4 C6:4', 'Bb5:12'), chart: ['Eb', 'Cm', 'Ab', 'Bb7', 'Eb', 'Gm', 'Ab', 'Bb7'] },
  A2: { mel: bars('G5:4 Bb5:4 Eb6:4', 'D6:4 C6:8', 'Ab5:4 C6:4 Eb6:4', 'D6:8 Bb5:4', 'G5:4 Bb5:4 G6:4', 'F6:4 D6:4 Bb5:4', 'D6:4 F5:4 Ab5:4', 'G5:12'), chart: ['Eb', 'Cm', 'Ab', 'Bb7', 'Eb', 'Gm', 'Bb7', 'Eb'] },
  B: { mel: bars('Eb6:4 D6:4 C6:4', 'B5:8 G5:4', 'C6:4 Eb6:4 G6:4', 'F6:4 Eb6:4 C6:4', 'Ab5:4 C6:4 F6:4', 'D6:8 Ab5:4', 'G5:4 Bb5:4 Eb6:4', 'D6:4 B5:4 G5:4'), chart: ['Cm', 'G7', 'Cm', 'Ab', 'Fm', 'Bb7', 'Eb', 'G7'] },
};
const waltzPart = ({ mel, chart }, { box = false } = {}) => ({
  ...(box ? { music: shift(mel, 12) } : { lead: mel }),
  celesta: part(chart, F.arp(74, 2), 12),
  harp: part(chart, F.waltzChord(64), 12),
  strings: part(chart, F.hold(57), 12),
  bass: part(chart, F.waltzBass(2), 12),
});
const grove = {
  name: 'grove', bpm: 88, rows: 12, inst: I, drums: 0.4, reverb: { room: 0.9, wet: 0.34 },
  tracks: {
    lead: { inst: 'violin', gain: 0.62, pan: -0.05, verb: 0.4 },
    music: { inst: 'celesta', gain: 0.5, pan: 0.1, verb: 0.45 },
    celesta: { inst: 'celesta', gain: 0.18, pan: 0.4, verb: 0.45 },
    harp: { inst: 'harp', gain: 0.25, pan: -0.3, verb: 0.4 },
    strings: { inst: 'strings', gain: 0.18, pan: -0.2, verb: 0.5 },
    bass: { inst: 'pizz', gain: 0.4, verb: 0.2 },
  },
  patterns: { A: waltzPart(waltz.A), A2: waltzPart(waltz.A2), B: waltzPart(waltz.B), C: waltzPart(waltz.A, { box: true }) },
  order: ['A', 'A2', 'B', 'C', 'A2'],
};

// ---------- The ruins: "Forgotten Hymn" (A minor, slow: horn, choir, harp, timpani) ----------
// A horn hymn over harp and timpani, a lift into the relative major with the choir, and a verse
// where the choir sings the hymn alone over the harp.
const hymn = {
  A: { mel: bars('A4:6 G4:2 E4:8', 'F4:4 A4:4 C5:8', 'E5:6 D5:2 C5:8', 'B4:4 D5:4 G4:8', 'C5:6 B4:2 A4:8', 'A4:4 C5:4 F5:8', 'E5:4 D5:4 A4:8', 'G#4:8 B4:8'), chart: ['Am', 'F', 'C', 'G', 'Am', 'F', 'Dm', 'E'] },
  B: { mel: bars('A4:4 C5:4 F5:6 E5:2', 'D5:8 B4:8', 'E5:6 D5:2 B4:8', 'C5:4 E5:4 A4:8', 'F5:6 E5:2 D5:8', 'B4:4 D5:4 F5:8', 'E5:12 r:4', 'G#4:4 B4:4 E5:8'), chart: ['F', 'G7', 'Em', 'Am', 'Dm', 'G7', 'C', 'E'] },
};
const hymnPart = ({ mel, chart }, { choir = false } = {}) => ({
  ...(choir ? { choir: mel } : { lead: mel, choir: part(chart, F.hold(60)) }),
  harp: part(chart, F.arp(62, 2)),
  bass: part(chart, F.root(2)),
  timp: part(chart, (s, len) => `${nm(rootIn(s, 2))}:4 r:${len - 4}`),
  drums: choir ? times('K...............', 8) : times('K.......K...h...', 8),
});
const ruins = {
  name: 'ruins', bpm: 84, inst: I, drums: 0.5, reverb: { room: 0.9, wet: 0.36 },
  tracks: {
    lead: { inst: 'horn', gain: 0.7, pan: -0.05, verb: 0.4 },
    choir: { inst: 'choir', gain: 0.32, pan: 0.15, verb: 0.55 },
    harp: { inst: 'harp', gain: 0.3, pan: 0.35, verb: 0.4 },
    bass: { inst: 'strings', gain: 0.3, verb: 0.4 },
    timp: { inst: 'timpani', gain: 0.3, verb: 0.35 },
  },
  patterns: { A: hymnPart(hymn.A), B: hymnPart(hymn.B), C: hymnPart(hymn.A, { choir: true }) },
  order: ['A', 'B', 'C', 'B', 'A'],
};

// ---------- The crystal cave: "Crystal Lullaby" (A minor music box: celesta, glockenspiel, choir) ----------
// A lullaby on the celesta, a climbing answer, and one shining verse in A major before it slips
// back to the minor.
const lullaby = {
  A: { mel: bars('E6:4 A5:4 C6:4 E6:4', 'D6:4 B5:4 G5:8', 'C6:4 A5:4 F5:4 A5:4', 'G5:8 E5:8', 'F5:4 A5:4 D6:4 F6:4', 'E6:8 C6:8', 'A5:4 C6:4 F6:4 E6:4', 'B5:8 G#5:8'), chart: ['Am', 'Em', 'F', 'C', 'Dm', 'Am', 'F', 'E'] },
  B: { mel: bars('A6:6 G6:2 F6:8', 'G6:4 D6:4 B5:8', 'E6:4 G6:4 B6:8', 'A6:8 E6:8', 'F6:4 D6:4 A5:8', 'G#5:4 B5:4 E6:8', 'C6:4 E6:4 A6:8', 'G#6:8 E6:8'), chart: ['F', 'G', 'Em', 'Am', 'Dm', 'E', 'Am', 'E'] },
  C: { mel: bars('E6:4 A5:4 C#6:4 E6:4', 'F#6:8 C#6:8', 'D6:4 F#6:4 A6:8', 'G#6:8 B5:8', 'A6:6 G#6:2 E6:8', 'C#6:4 F#6:4 A6:8', 'F6:4 D6:4 A5:8', 'G#5:8 B5:8'), chart: ['A', 'F#m', 'D', 'E', 'A', 'F#m', 'Dm', 'E'] },
};
const lullabyPart = ({ mel, chart }) => ({
  lead: mel,
  echo: mel,
  glock: part(chart, F.arp(76, 4)),
  strings: part(chart, F.hold(57)),
  choir: part(chart, F.hold(64)),
  bass: part(chart, F.root(2)),
  drums: times('K.......h.......', 8),
});
const cave = {
  name: 'cave', bpm: 76, inst: I, drums: 0.4, reverb: { room: 0.93, wet: 0.42, damp: 0.25 },
  tracks: {
    lead: { inst: 'celesta', gain: 0.75, pan: -0.1, verb: 0.5 },
    echo: { inst: 'celesta', gain: 0.25, pan: 0.45, delay: 3, verb: 0.6 },
    glock: { inst: 'glock', gain: 0.16, pan: 0.3, verb: 0.55 },
    strings: { inst: 'strings', gain: 0.2, pan: -0.3, verb: 0.55 },
    choir: { inst: 'choir', gain: 0.14, pan: 0.2, verb: 0.6 },
    bass: { inst: 'pizz', gain: 0.35, verb: 0.3 },
  },
  patterns: { A: lullabyPart(lullaby.A), B: lullabyPart(lullaby.B), C: lullabyPart(lullaby.C) },
  order: ['A', 'B', 'A', 'C', 'A'],
};

// ---------- The sky: "Cloud Garden" (D Lydian, floating: flute, bells, harp, a soft beat) ----------
// The bright Lydian lift (D major with an E major chord) on a flute, a warmer verse, and an
// interlude where the bells and harp carry it alone.
const cloud = {
  A: { mel: bars('F#5:4 A5:4 C#6:4 A5:4', 'G#5:4 B5:4 E6:8', 'D6:6 C#6:2 B5:8', 'G#5:8 E5:8', 'A5:4 C#6:4 F#6:4 E6:4', 'G#6:6 F#6:2 E6:8', 'D6:4 B5:4 F#6:8', 'E6:8 C#6:8'), chart: ['DM7', 'E', 'Bm7', 'E', 'DM7', 'E', 'GM7', 'A'] },
  B: { mel: bars('B5:6 A5:2 F#5:8', 'E5:4 A5:4 C#6:8', 'C#6:6 B5:2 A5:8', 'D6:4 F#6:4 B5:8', 'B5:4 D6:4 F#6:8', 'E6:6 C#6:2 A5:8', 'B5:4 D6:4 G#5:4 B5:4', 'A5:12 r:4'), chart: ['GM7', 'A', 'F#m7', 'Bm7', 'GM7', 'A', 'Bm7 E', 'DM7'] },
};
const cloudPart = ({ mel, chart }, { bells = false } = {}) => ({
  ...(bells ? { bells: shift(mel, 12) } : { lead: mel, bells: part(chart, F.arp(79, 4)) }),
  harp: part(chart, F.arp(64, 2)),
  pad: part(chart, F.hold(64)),
  bass: part(chart, F.root(2)),
  drums: bells ? times('K...............', 8) : times('K.....h.K.h...h.', 8),
});
const sky = {
  name: 'sky', bpm: 112, inst: I, pump: 0.12, drums: 0.5, reverb: { room: 0.9, wet: 0.36 },
  tracks: {
    lead: { inst: 'flute', gain: 0.72, pan: -0.05, verb: 0.35 },
    bells: { inst: 'bell', gain: 0.32, pan: 0.35, verb: 0.5 },
    harp: { inst: 'harp', gain: 0.25, pan: -0.3, verb: 0.4 },
    pad: { inst: 'pad', gain: 0.3, verb: 0.45 },
    bass: { inst: 'pizz', gain: 0.38, verb: 0.2 },
  },
  patterns: { A: cloudPart(cloud.A), B: cloudPart(cloud.B), C: cloudPart(cloud.A, { bells: true }) },
  order: ['A', 'B', 'A', 'C', 'B', 'A'],
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

// Each town's evening version: the same song a little slower and softer, the lead handed to a
// piano (or the horn, for the warriors' march), the bright parts and the drums pulled back.
const EVENING = { town: 'piano', harbor: 'piano', crag: 'horn', grove: 'piano' };
for (const [key, lead] of Object.entries(EVENING)) {
  const song = SONGS[key];
  SONGS[`${key}-night`] = {
    ...song,
    name: `${key}-night`,
    bpm: Math.round(song.bpm * 0.86),
    drums: (song.drums ?? 0.6) * 0.45,
    pump: 0,
    reverb: { ...song.reverb, wet: (song.reverb?.wet ?? 0.3) + 0.08 },
    tracks: Object.fromEntries(Object.entries(song.tracks).map(([k, tr]) => [k,
      k === 'lead' ? { ...tr, inst: lead, gain: tr.gain * 0.95, verb: (tr.verb ?? 0.3) + 0.1 }
        : ['glock', 'answer', 'brass', 'timp', 'pluck', 'double', 'marimba'].includes(k) ? { ...tr, gain: tr.gain * 0.45 } : tr])),
  };
}

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
