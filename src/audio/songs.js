// The music: one song per area, all EDM (the player's ask: fast and epic, never boring; hardstyle,
// Frenchcore, rock and metal were tried and dropped), each area its own kind of EDM, with its own
// key, tempo, two hooks written note by note, the area's recorded instrument carrying the theme,
// its groove and its opening. Built by `edm()` below on recorded instruments and synths;
// studio.js renders them.
//
// The areas:
// - Title: "Dawn Over Tengu", progressive house (126), E-flat major, a piano opening.
// - Sprout Village: "Market Hop", future house (126), F major, a skipping pluck hook, bouncy bass.
// - Meadows: "Grass Runner", liquid drum & bass (174), D major, violin, a rolling reese bass.
// - Pastel Harbor: "Harbor Lights", UK garage (134, swung), A minor, a two-step beat, flute.
// - Ember Crag: "Forge Breaker", dubstep (140, half-time), F minor, recorded brass over a wobble.
// - Forest: "Mushroom Ritual", psytrance (145), E minor, a rolling bass, pan flute.
// - Moonleaf Grove: "Silver Canopy", melodic dubstep (150), D minor, violin, swelling chords.
// - Ruins: "Black Obelisk", dark techno (132), A minor, a stabbing pluck, then the horn.
// - Cave: "Crystal Depths", neurofunk drum & bass (174), B minor, celesta over a reese.
// - Sky: "Above the Clouds", uplifting trance (138), G major, glockenspiel, rolling arpeggios.
// - The Hollow: "Root Riot", electro house (128), C# minor, a dirty saw, horns.
// - Bosses: "Tengu King", drumstep (175, half-time), D minor, a fast wobble, brass, timpani.
// - Fox Shrine Path: "Fox Lantern", trap (140), the koto in the old in-scale over an 808, taiko.
// - Moonlit Ridge: "Night Drive", synthwave (124), F# minor, a piano opening, gated snares.
// - Serpent Springs: "Serpent Drop", big room (128), G minor, a recorded sitar hook.
// - Frozen Peak: "Ice Cathedral", melodic techno (130), B-flat minor, a glassy arpeggio.
// - Starfall Heights: "Falling Stars", future bass (150), B major, chopped hand chimes.
// - The queens (trials and rematches): "Queen's Gauntlet", an electro waltz in G minor, violin.
// At night the towns play an evening version (the lead on piano, the drums pulled back), and a
// fight layers more drums and bass over an area's song.

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


// The EDM instruments: the recorded ones above, plus the synths.
const E = {
  ...I,
  koto: { sample: 'koto', rel: 0.5, gain: 0.9 },
  chimes: { sample: 'hand_chimes', rel: 0.6, gain: 0.8 },
  vibes: { sample: 'vibraphone', rel: 0.6, gain: 0.8 },
  bells: { sample: 'tubular_bells', rel: 0.8, gain: 0.7 },
  kalimba: { sample: 'kalimba', rel: 0.4, gain: 0.8 },
  cello: { sample: 'cello', attack: 0.05, rel: 0.4 },
  // Leads: a wide supersaw, a dirty one, a singing one, plucks, and recorded instruments that
  // take the lead themselves.
  saw: { synth: 'hardlead', gain: 0.5, drive: 1.3, cut: 6500 },
  sawDirty: { synth: 'hardlead', gain: 0.5, drive: 3, cut: 3500, detune: 0.5 },
  edmLead: { synth: 'lead', gain: 0.5, cut: 4200 },
  edmPluck: { synth: 'pluck', gain: 0.45, cut: 5000, ring: 0.25 },
  darkPluck: { synth: 'pluck', gain: 0.45, cut: 2000, ring: 0.2 },
  brassLead: { sample: 'brass_section', rel: 0.15, gate: 0.9 },
  kotoLead: { sample: 'koto', rel: 0.5 },
  celestaLead: { sample: 'celesta', rel: 0.5 },
  chimesLead: { sample: 'hand_chimes', rel: 0.5 },
  sitarLead: { sample: 'sitar', rel: 0.4 },
  // Chord beds and basses.
  swellPad: { synth: 'pad', gain: 0.4, cut: 3000, attack: 0.02 },
  reese: { synth: 'reese', gain: 0.6 },
  wobble: { synth: 'wobble', gain: 0.6, rate: 4.67 },
  s808: { synth: 's808', gain: 0.6 },
  riser: { synth: 'riser', gain: 0.6 },
};

// ---------- The EDM builder ----------
// Every song: an intro, a build (a riser and a roll), the drop on the first hook, a breakdown on
// the area's own instrument, the build again, the second drop on the anthem hook. The arranging
// rule (the player's ask: no clutter): one melody at a time, nothing doubles the lead, one chord
// bed, at most one extra colour. What makes each its own:
// { name, bpm, rows (16, or 12 for the waltz), swing, chart (8 bars), hookA, hookB (8 bars each),
//   lead (the drop's instrument), lead2 (the second drop's, if different), voice (the area's
//   instrument: intro and breakdown), voiceShift (-12), bass (BASS below), chords ('stab' |
//   'pad' | 'swell' | 'none'), arp (sixteenths in the second drop: 1, eighths: 2, none: 0),
//   beat, fill (one bar of drums each), intro ('solo' | 'arp' | 'drums' | 'kick' | 'perc'),
//   introBeat, perc, build ('snare' | 'stop' | 'kick' | 'tom'), kick (the kick letter, K or P),
//   form ('classic' | 'coldopen' | 'breakfirst'), wobble (the wobble's rate in Hz), pump, extra }.
const r2 = (s) => nm(rootIn(s, 2));
const BASS = {
  off: ['synbass', (s, len) => Array(len / 4).fill(`r:2 ${r2(s)}:2`).join(' ')],
  roll: ['synbass', (s, len) => Array(len / 4).fill(`r:1 ${r2(s)}:1 ${r2(s)}:1 ${r2(s)}:1`).join(' ')],
  house: ['synbass', (s, len) => Array(len / 4).fill(`r:2 ${r2(s)}:1 ${nm(rootIn(s, 3))}:1`).join(' ')],
  garage: ['synbass', (s) => `${r2(s)}:3 r:1 ${r2(s)}:2 r:2 ${nm(rootIn(s, 3))}:3 r:1 ${r2(s)}:2 r:2`],
  techno: ['synbass', (s, len) => Array(len / 4).fill(`r:2 ${r2(s)}:1 ${r2(s)}:1`).join(' ')],
  octaves: ['synbass', F.octaves(2)],
  reese: ['reese', (s, len) => Array(len / 8).fill(`${r2(s)}:8`).join(' ')],
  wobble: ['wobble', (s) => `${r2(s)}:6 ${r2(s)}:2 ${r2(s)}:8`],
  sub: ['sub', F.root(2)],
  808: ['s808', (s) => `${nm(rootIn(s, 1))}:6 ${nm(rootIn(s, 1))}:2 r:4 ${nm(rootIn(s, 1))}:4`],
  waltz: ['synbass', (s) => `r:4 ${r2(s)}:4 ${r2(s)}:4`],
};
const CHORDS = {
  stab: ['stab', (s, len) => (len === 12 ? `r:4 ${tones(s, 64)}:3 r:1 ${tones(s, 64)}:3 r:1` : F.offbeat(64)(s, len))],
  pad: ['pad', F.hold(60)],
  swell: ['swellPad', (s, len) => Array(len / 8).fill(`${tones(s, 64)}:3 r:1 ${tones(s, 64)}:2 ${tones(s, 64)}:2`).join(' ')],
};
// A four-bar roll on `c`: every beat, every beat, every eighth, every sixteenth.
const rollOf = (c, rows) => bars(...[4, 4, 2, 1].map((step) => Array.from({ length: rows }, (_, i) => (i % step ? '.' : c)).join('')));
const first4 = (line) => bars(...line.split(' | ').slice(0, 4));
const X = {
  high: F.hold(72),
  arp: F.arp(76, 2),
  root5: (s, len) => `${nm(rootIn(s, 5))}:${len}`,
  timp: (s, len) => Array(len / 8).fill(`${nm(rootIn(s, 2))}:4 ${nm(rootIn(s, 2))}:2 ${nm(rootIn(s, 2))}:2`).join(' '),
};

function edm(o) {
  const rows = o.rows ?? 16;
  const shiftV = o.voiceShift ?? -12;
  const k = o.kick ?? 'K';
  const crash = k === 'P' ? 'U' : 'I';
  const drop = (fill) => bars(`${crash}${o.beat.slice(1)}`, o.beat, o.beat, fill, o.beat, o.beat, o.beat, fill);
  const c4 = o.chart.slice(0, 4);
  const [bassInst, bassFig] = BASS[o.bass ?? 'off'];
  const chords = CHORDS[o.chords ?? 'stab'];
  const arp = F.arp(72, o.arp === 1 ? 1 : 2);
  const inst = { ...E, wobble: { ...E.wobble, rate: o.wobble ?? E.wobble.rate } };
  const tracks = {
    lead: { inst: o.lead ?? 'saw', gain: 0.5, verb: 0.25, echo: { rows: 3, fb: 0.28, wet: 0.18 } },
    voice: { inst: o.voice, gain: o.voiceGain ?? 0.5, pan: -0.15, verb: 0.35 },
    arp: { inst: o.arpInst ?? 'edmPluck', gain: 0.3, pan: 0.25, verb: 0.3, echo: { rows: 3, fb: 0.25, wet: 0.18 } },
    bass: { inst: bassInst, gain: bassInst === 'sub' ? 0.3 : 0.36, verb: 0, low: true },
    riser: { inst: 'riser', gain: 0.5, verb: 0.3 },
  };
  if (chords) tracks.chords = { inst: chords[0], gain: 0.3, pan: -0.2, verb: 0.3 };
  const extra = {};
  for (const [name, [i, fig, gain]] of Object.entries(o.extra ?? {}).slice(0, 1)) {
    tracks[name] = { inst: i, gain: gain ?? 0.3, pan: 0.3, verb: 0.3 };
    extra[name] = part(o.chart, X[fig], rows);
  }
  const bass = part(o.chart, bassFig, rows);
  const bed = chords ? { chords: part(o.chart, chords[1], rows) } : {};
  const voice4 = shift(first4(o.hookA), shiftV);
  const intros = {
    solo: { voice: voice4 },
    arp: { voice: voice4, arp: part(c4, arp, rows) },
    drums: { drums: bars(...Array(4).fill(o.beat)), bass: part(c4, bassFig, rows) },
    kick: { voice: voice4, drums: o.introBeat ?? bars(...Array(4).fill(Array.from({ length: rows }, (_, i) => (i % 4 ? '.' : k)).join(''))) },
    perc: { voice: voice4, drums: o.perc },
  };
  const builds = { snare: rollOf('S', rows), kick: rollOf(k, rows), tom: rollOf('t', rows), stop: bars(...rollOf('S', rows).split(' | ').slice(0, 3), '.'.repeat(rows)) };
  const patterns = {
    intro: intros[o.intro ?? 'arp'],
    build: { arp: part(c4, arp, rows), riser: bars(`C4:${rows}`, `~:${rows}`, `~:${rows}`, `~:${rows}`), drums: builds[o.build ?? 'snare'] },
    drop: { lead: o.hookA, bass, ...bed, drums: drop(o.fill) },
    break: { voice: shift(o.hookB, shiftV), arp: part(o.chart, arp, rows) },
    drop2: { lead: o.lead2 ? `@${o.lead2} ${o.hookB}` : o.hookB, bass, ...bed, ...(o.arp ? { arp: part(o.chart, arp, rows) } : extra), drums: drop(o.fillB ?? o.fill) },
  };
  const forms = {
    classic: [['intro'], ['build', 'drop', 'break', 'build', 'drop2']],
    coldopen: [[], ['drop', 'break', 'build', 'drop2']],
    breakfirst: [['break'], ['build', 'drop', 'intro', 'build', 'drop2']],
  };
  const [intro, order] = forms[o.form ?? 'classic'];
  const hats = Array.from({ length: rows }, (_, i) => (i % 2 ? 'h' : '.')).join('');
  return {
    name: o.name, bpm: o.bpm, rows, swing: o.swing, inst, pump: o.pump ?? 0.4, drums: o.drums ?? 1, bright: 0.6, reverb: { room: 0.84, wet: 0.18 },
    fight: { top: hats, kick: o.beat },
    tracks,
    patterns,
    intro,
    order,
  };
}

// ---------- The songs ----------
const title = edm({
  name: 'title', bpm: 126, voice: 'piano', lead: 'saw', bass: 'off', chords: 'pad', arp: 2,
  intro: 'solo', form: 'breakfirst', build: 'stop', beat: 'K.h.C.h.K.h.C.h.', fill: 'K.h.C.h.K.SSSSSS',
  chart: ['Eb', 'Bb', 'Cm', 'Ab', 'Eb', 'Bb', 'Ab', 'Bb'],
  hookA: bars('G6:3 Bb6:3 Eb7:2 D7:4 Bb6:4', 'F6:3 Bb6:3 D7:2 C7:4 Bb6:4', 'G6:3 C7:3 Eb7:2 D7:4 C7:4', 'Ab6:6 G6:2 Eb6:8',
    'G6:3 Bb6:3 Eb7:2 F7:4 G7:4', 'F7:3 D7:3 Bb6:2 D7:4 F7:4', 'Eb7:3 C7:3 Ab6:2 C7:4 Eb7:4', 'D7:8 Bb6:8'),
  hookB: bars('Bb7:8 G7:8', 'F7:8 D7:8', 'G7:8 Eb7:8', 'C7:6 Ab6:2 Eb7:8', 'Bb7:4 G7:4 Eb7:4 G7:4', 'F7:4 D7:4 Bb6:4 D7:4', 'C7:4 Eb7:4 Ab7:4 G7:4', 'F7:8 D7:8'),
});

const town = edm({
  name: 'town', bpm: 126, voice: 'flute', lead: 'edmPluck', lead2: 'saw', bass: 'house', chords: 'stab',
  intro: 'arp', build: 'snare', beat: 'K.h.C.hhK.h.C.h.', fill: 'K.h.C.h.K.h.SSSS',
  chart: ['F', 'Dm', 'Bb', 'C', 'F', 'Dm', 'Bb', 'C'],
  hookA: bars('C6:2 F6:2 r:1 A6:1 G6:2 F6:2 r:1 C6:1 F6:4', 'D6:2 F6:2 r:1 A6:1 G6:2 F6:2 r:1 D6:1 A6:4', 'D6:2 F6:2 r:1 Bb6:1 A6:2 F6:2 r:1 D6:1 Bb6:4', 'C7:4 Bb6:2 A6:2 G6:8',
    'C6:2 F6:2 r:1 A6:1 G6:2 F6:2 r:1 C6:1 F6:4', 'D6:2 F6:2 r:1 A6:1 G6:2 F6:2 r:1 D6:1 A6:4', 'F6:2 Bb6:2 r:1 D7:1 C7:2 Bb6:2 r:1 F6:1 D7:4', 'E7:6 C7:2 G6:8'),
  hookB: bars('A6:4 C7:4 F7:4 E7:4', 'D7:6 C7:2 A6:8', 'Bb6:4 D7:4 F7:4 D7:4', 'E7:6 G7:2 C7:8', 'F7:4 E7:4 C7:4 A6:4', 'A6:4 D7:4 F7:8', 'D7:4 F7:4 Bb7:4 A7:4', 'G7:8 E7:8'),
  extra: { glock: ['glock', 'arp', 0.25] },
});

const meadow = edm({
  name: 'meadow', bpm: 174, voice: 'violin', lead: 'edmLead', bass: 'reese', chords: 'pad', kick: 'P', pump: 0.2,
  intro: 'drums', build: 'snare', beat: 'P.h.S.h..hP.S.h.', fill: 'P.h.S.hSP.SSS.SS',
  chart: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'],
  hookA: bars('F#6:6 E6:2 D6:4 A6:4', 'E6:6 C#6:2 A5:8', 'D6:4 F#6:4 B6:6 A6:2', 'G6:8 B6:8', 'A6:6 F#6:2 D7:4 C#7:4', 'C#7:6 B6:2 A6:8', 'B6:4 D7:4 G7:6 F#7:2', 'E7:8 C#7:8'),
  hookB: bars('D7:4 F#7:4 A7:4 F#7:4', 'E7:4 C#7:4 A6:8', 'F#7:4 D7:4 B6:4 D7:4', 'G7:6 F#7:2 D7:8', 'A7:4 F#7:4 D7:4 F#7:4', 'E7:4 A7:4 C#7:8', 'D7:4 G7:4 B7:4 A7:4', 'A7:16'),
  extra: { strings: ['strings', 'high', 0.25] },
});

const harbor = edm({
  name: 'harbor', bpm: 134, swing: 0.58, voice: 'flute', lead: 'edmLead', bass: 'garage', chords: 'stab',
  intro: 'perc', perc: bars(...Array(4).fill('x.hxx.h.x.hxx.hh')), build: 'tom', beat: 'K..hc.h..Kh.c.hh', fill: 'K..hc.h.SSc.SSSS',
  chart: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E'],
  hookA: bars('r:1 E6:2 A6:1 r:2 C7:2 B6:1 A6:2 E6:1 r:1 A6:3', 'r:1 F6:2 A6:1 r:2 C7:2 A6:1 F6:2 C6:1 r:1 F6:3', 'r:1 E6:2 G6:1 r:2 C7:2 G6:1 E6:2 C6:1 r:1 E6:3', 'D6:3 G6:3 B6:2 D7:8',
    'r:1 E6:2 A6:1 r:2 C7:2 B6:1 A6:2 E6:1 r:1 A6:3', 'r:1 F6:2 A6:1 r:2 C7:2 A6:1 F6:2 C6:1 r:1 F6:3', 'r:1 G6:2 C7:1 r:2 E7:2 D7:1 C7:2 G6:1 r:1 C7:3', 'B6:6 G#6:2 E6:8'),
  hookB: bars('C7:3 E7:3 A7:2 G7:4 E7:4', 'A6:3 C7:3 F7:2 E7:4 C7:4', 'G6:3 C7:3 E7:2 D7:4 C7:4', 'B6:6 D7:2 G7:8', 'E7:3 A7:3 B7:2 A7:4 E7:4', 'F7:3 E7:3 C7:2 A6:4 F6:4', 'E7:3 G7:3 C7:2 E7:4 G7:4', 'G#7:8 E7:8'),
  extra: { marimba: ['marimba', 'arp', 0.25] },
});

const crag = edm({
  name: 'crag', bpm: 140, voice: 'brass', lead: 'brassLead', lead2: 'saw', bass: 'wobble', wobble: 4.67, chords: 'none', pump: 0.25,
  intro: 'solo', build: 'stop', beat: 'K.h.h.h.S.h.h.hK', fill: 'K.h.h.h.S.SSSSSS',
  chart: ['Fm', 'Db', 'Ab', 'Eb', 'Fm', 'Db', 'Bbm', 'C'],
  hookA: bars('F6:2 r:2 F6:2 Ab6:2 C7:4 Bb6:2 Ab6:2', 'F6:2 r:2 F6:2 Ab6:2 Db7:4 C7:2 Ab6:2', 'Eb6:2 r:2 Eb6:2 Ab6:2 C7:4 Bb6:2 Ab6:2', 'G6:4 Bb6:4 Eb7:8',
    'F6:2 r:2 F6:2 Ab6:2 C7:4 Bb6:2 Ab6:2', 'F6:2 r:2 F6:2 Ab6:2 Db7:4 C7:2 Ab6:2', 'Db7:2 r:2 Db7:2 Bb6:2 F6:4 Bb6:2 Db7:2', 'C7:6 E6:2 G6:8'),
  hookB: bars('C7:4 Ab6:4 F6:4 C7:4', 'Db7:4 F7:4 Ab7:8', 'Eb7:4 C7:4 Ab6:4 Eb7:4', 'G7:6 Eb7:2 Bb6:8', 'F7:3 Eb7:3 C7:2 Ab6:4 C7:4', 'F7:4 Db7:4 Ab6:8', 'Bb6:4 Db7:4 F7:8', 'E7:8 C7:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

const forest = edm({
  name: 'forest', bpm: 145, voice: 'panflute', lead: 'edmPluck', lead2: 'saw', bass: 'roll', chords: 'none', pump: 0.2,
  intro: 'kick', build: 'snare', beat: 'K.ohK.ohK.ohK.oh', fill: 'K.ohK.ohK.ohSSSS',
  chart: ['Em', 'C', 'Em', 'D', 'Em', 'C', 'Am', 'B'],
  hookA: bars('E6:1 G6:1 B6:1 E7:1 B6:1 G6:1 E6:2 F#6:1 G6:1 A6:1 B6:1 A6:2 G6:2', 'C6:1 E6:1 G6:1 C7:1 G6:1 E6:1 C6:2 D6:1 E6:1 G6:1 A6:1 G6:2 E6:2',
    'E6:1 G6:1 B6:1 E7:1 B6:1 G6:1 E6:2 F#6:1 G6:1 A6:1 B6:1 A6:2 G6:2', 'D6:1 F#6:1 A6:1 D7:1 A6:1 F#6:1 D6:2 E6:1 F#6:1 A6:1 B6:1 A6:2 F#6:2',
    'E6:1 G6:1 B6:1 E7:1 B6:1 G6:1 E6:2 F#6:1 G6:1 A6:1 B6:1 A6:2 G6:2', 'C6:1 E6:1 G6:1 C7:1 G6:1 E6:1 C6:2 D6:1 E6:1 G6:1 A6:1 G6:2 E6:2',
    'A5:1 C6:1 E6:1 A6:1 E6:1 C6:1 A5:2 B5:1 C6:1 E6:1 F#6:1 E6:2 C6:2', 'B5:1 D#6:1 F#6:1 B6:1 F#6:1 D#6:1 B5:2 F#6:8'),
  hookB: bars('B6:8 G6:8', 'E7:8 C7:8', 'B6:6 G6:2 E6:8', 'F#6:8 A6:8', 'G6:4 B6:4 E7:8', 'G7:6 E7:2 C7:8', 'A6:4 C7:4 E7:8', 'D#7:8 F#7:8'),
  extra: { kalimba: ['kalimba', 'arp', 0.25] },
});

const grove = edm({
  name: 'grove', bpm: 150, voice: 'violin', lead: 'saw', bass: 'sub', chords: 'swell', pump: 0.3,
  intro: 'solo', form: 'breakfirst', build: 'stop', beat: 'K.h.h.h.S.h.h.h.', fill: 'K.h.h.hKS.h.SSSS',
  chart: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'],
  hookA: bars('A6:6 F6:2 D6:4 F6:4', 'D7:6 C7:2 Bb6:8', 'A6:6 F6:2 C7:4 A6:4', 'G6:8 E6:8', 'A6:4 D7:4 F7:6 E7:2', 'D7:6 C7:2 Bb6:4 F6:4', 'G6:4 Bb6:4 D7:4 C7:4', 'C#7:8 E7:8'),
  hookB: bars('F7:3 E7:3 D7:2 A6:4 D7:4', 'F7:3 D7:3 Bb6:2 F7:8', 'C7:3 F7:3 A7:2 G7:4 F7:4', 'E7:6 C7:2 G6:8', 'A7:3 F7:3 D7:2 F7:4 A7:4', 'Bb7:4 A7:4 F7:8', 'G7:3 F7:3 D7:2 Bb6:4 D7:4', 'E7:8 C#7:8'),
  extra: { cello: ['cello', 'high', 0.25] },
});

const ruins = edm({
  name: 'ruins', bpm: 132, voice: 'horn', lead: 'darkPluck', lead2: 'horn', bass: 'techno', chords: 'none', pump: 0.3,
  intro: 'kick', introBeat: bars(...Array(4).fill('K...K...K...K..h')), build: 'kick', beat: 'K.hoC.hoK.hoC.ho', fill: 'K.hoC.hoKKhoCCCC',
  chart: ['Am', 'Am', 'Bb', 'Am', 'Am', 'Am', 'Gm', 'Bb'],
  hookA: bars('A5:2 r:2 A5:2 C6:2 r:2 E6:2 r:2 D6:2', 'A5:2 r:2 A5:2 C6:2 r:2 E6:2 F6:2 E6:2', 'Bb5:2 r:2 Bb5:2 D6:2 r:2 F6:2 r:2 E6:2', 'A5:2 r:2 A5:2 E6:2 r:2 A6:2 G6:2 E6:2',
    'A5:2 r:2 A5:2 C6:2 r:2 E6:2 r:2 D6:2', 'A5:2 r:2 A5:2 C6:2 r:2 E6:2 F6:2 E6:2', 'G5:2 r:2 G5:2 Bb5:2 r:2 D6:2 r:2 C6:2', 'Bb5:2 D6:2 F6:2 A6:2 Bb6:8'),
  hookB: bars('E6:8 A6:8', 'G6:6 F6:2 E6:8', 'F6:8 Bb6:8', 'A6:16', 'C7:8 B6:4 A6:4', 'E7:6 D7:2 C7:8', 'D7:8 Bb6:8', 'A6:8 F6:8'),
  extra: { bells: ['bells', 'root5', 0.3] },
});

const cave = edm({
  name: 'cave', bpm: 174, voice: 'celesta', lead: 'celestaLead', lead2: 'edmLead', bass: 'reese', chords: 'none', kick: 'P', pump: 0.2,
  intro: 'arp', form: 'coldopen', build: 'stop', beat: 'P.h.S.h..PP.S.h.', fill: 'P.h.S.hSSP.SSSSS',
  chart: ['Bm', 'G', 'Em', 'F#', 'Bm', 'G', 'Em', 'F#'],
  hookA: bars('B6:2 D7:2 F#7:2 D7:2 B6:2 F#6:2 D6:4', 'B6:2 D7:2 G7:2 D7:2 B6:2 G6:2 D6:4', 'B6:2 E7:2 G7:2 E7:2 B6:2 G6:2 E6:4', 'A#6:4 C#7:4 F#7:8',
    'B6:2 D7:2 F#7:2 D7:2 B6:2 F#6:2 D6:4', 'B6:2 D7:2 G7:2 D7:2 B6:2 G6:2 D6:4', 'G6:2 B6:2 E7:2 B6:2 G6:2 E6:2 B5:4', 'C#7:6 A#6:2 F#6:8'),
  hookB: bars('F#7:6 E7:2 D7:8', 'D7:6 B6:2 G6:8', 'E7:6 D7:2 B6:8', 'C#7:8 A#6:8', 'B6:4 D7:4 F#7:8', 'G7:4 F#7:4 D7:8', 'E7:4 G7:4 B7:8', 'A#7:8 F#7:8'),
  extra: { glock: ['glock', 'arp', 0.25] },
});

const sky = edm({
  name: 'sky', bpm: 138, voice: 'glock', voiceShift: 0, voiceGain: 0.4, lead: 'saw', bass: 'off', chords: 'pad', arp: 1,
  intro: 'arp', build: 'snare', beat: 'K.oxC.oxK.oxC.ox', fill: 'K.oxC.oxSSSSSSSS',
  chart: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D'],
  hookA: bars('B6:2 D7:2 G7:2 D7:2 B6:2 D7:2 G7:2 A7:2', 'A6:2 D7:2 F#7:2 D7:2 A6:2 D7:2 F#7:2 G7:2', 'G6:2 B6:2 E7:2 B6:2 G6:2 B6:2 E7:2 F#7:2', 'E7:2 C7:2 G6:2 C7:2 E7:4 G7:4',
    'B6:2 D7:2 G7:2 D7:2 B6:2 D7:2 G7:2 A7:2', 'A6:2 D7:2 F#7:2 D7:2 A6:2 D7:2 F#7:2 G7:2', 'C7:2 E7:2 G7:2 E7:2 C7:2 E7:2 G7:2 B7:2', 'A7:8 F#7:8'),
  hookB: bars('B7:8 G7:8', 'A7:8 F#7:8', 'G7:8 E7:8', 'E7:6 G7:2 C7:8', 'B7:4 A7:4 G7:4 D7:4', 'F#7:4 A7:4 D7:8', 'E7:4 G7:4 C7:4 E7:4', 'F#7:8 A7:8'),
});

const hollow = edm({
  name: 'hollow', bpm: 128, voice: 'horn', lead: 'sawDirty', bass: 'off', chords: 'none',
  form: 'coldopen', build: 'kick', beat: 'K.h.C.hKK.h.C.h.', fill: 'K.h.C.hKKKKCCCCC',
  chart: ['C#m', 'A', 'E', 'B', 'C#m', 'A', 'F#m', 'G#'],
  hookA: bars('C#6:1 r:1 C#6:1 r:1 E6:2 C#6:2 G#6:2 F#6:2 E6:4', 'A5:1 r:1 A5:1 r:1 C#6:2 A5:2 E6:2 C#6:2 A5:4', 'B5:1 r:1 B5:1 r:1 E6:2 B5:2 G#6:2 F#6:2 E6:4', 'D#6:4 F#6:4 B6:8',
    'C#6:1 r:1 C#6:1 r:1 E6:2 C#6:2 G#6:2 F#6:2 E6:4', 'A5:1 r:1 A5:1 r:1 C#6:2 A5:2 E6:2 C#6:2 A5:4', 'F#6:1 r:1 F#6:1 r:1 A6:2 F#6:2 C#7:2 B6:2 A6:4', 'G#6:6 C7:2 D#7:8'),
  hookB: bars('E7:4 C#7:4 G#6:4 C#7:4', 'E7:4 A7:4 C#7:8', 'G#7:4 E7:4 B6:4 E7:4', 'F#7:6 D#7:2 B6:8', 'C#7:3 E7:3 G#7:2 F#7:4 E7:4', 'A7:4 E7:4 C#7:8', 'F#7:3 A7:3 F#7:2 C#7:4 A6:4', 'G#7:8 D#7:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

const boss = edm({
  name: 'boss', bpm: 175, voice: 'brass', lead: 'sawDirty', bass: 'wobble', wobble: 5.83, chords: 'none', kick: 'P', pump: 0.25,
  intro: 'drums', build: 'kick', beat: 'P.h.h.h.S.h.hPh.', fill: 'P.h.h.hPS.SSSSSS',
  chart: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A'],
  hookA: bars('D6:2 D6:1 D6:1 F6:2 A6:2 D7:2 C7:2 A6:4', 'D6:2 D6:1 D6:1 F6:2 Bb6:2 D7:2 C7:2 Bb6:4', 'C6:2 C6:1 C6:1 E6:2 G6:2 C7:2 Bb6:2 G6:4', 'A6:4 C#7:4 E7:8',
    'D6:2 D6:1 D6:1 F6:2 A6:2 D7:2 C7:2 A6:4', 'D6:2 D6:1 D6:1 F6:2 Bb6:2 D7:2 C7:2 Bb6:4', 'G6:2 G6:1 G6:1 Bb6:2 D7:2 G7:2 F7:2 D7:4', 'C#7:4 E7:4 A7:8'),
  hookB: bars('A7:6 F7:2 D7:8', 'Bb7:6 F7:2 D7:8', 'G7:6 E7:2 C7:8', 'A7:4 E7:4 C#7:8', 'D7:3 F7:3 A7:2 G7:4 F7:4', 'F7:3 D7:3 Bb6:2 D7:4 F7:4', 'G7:3 Bb7:3 G7:2 D7:4 Bb6:4', 'C#7:8 A6:8'),
  extra: { timp: ['timpani', 'timp', 0.45] },
});

const shrine = edm({
  name: 'shrine', bpm: 140, voice: 'panflute', lead: 'kotoLead', lead2: 'edmLead', bass: '808', chords: 'none', kick: 'P', pump: 0.15,
  intro: 'perc', perc: bars(...Array(4).fill('t.t...w.t.tt..ww')), build: 'tom', beat: 'P.hhh.hhS.hhh.hP', fill: 'P.hhhhhhS.hhhhhh',
  chart: ['Am', 'F', 'Em', 'Am', 'Dm', 'F', 'Em', 'E'],
  hookA: bars('E6:2 F6:2 r:2 A6:2 B6:3 A6:1 F6:2 E6:2', 'F6:2 A6:2 r:2 C7:2 B6:3 A6:1 F6:2 C6:2', 'B5:2 E6:2 r:2 F6:2 E6:3 C6:1 B5:4', 'A5:6 E6:2 A6:8',
    'E6:2 F6:2 r:2 A6:2 B6:3 A6:1 F6:2 E6:2', 'C7:2 A6:2 r:2 F6:2 A6:3 C7:1 F7:2 E7:2', 'E7:2 C7:2 r:2 B6:2 A6:3 F6:1 E6:4', 'E6:8 F6:4 E6:4'),
  hookB: bars('A6:4 B6:4 C7:4 E7:4', 'F7:6 E7:2 C7:8', 'B6:4 C7:4 E7:4 F7:4', 'E7:6 C7:2 A6:8', 'D7:4 F7:4 A7:4 F7:4', 'C7:4 F7:4 A7:8', 'B6:4 E7:4 F7:4 E7:4', 'E7:8 B6:8'),
  extra: { bells: ['bells', 'root5', 0.25] },
});

const ridge = edm({
  name: 'ridge', bpm: 124, voice: 'piano', voiceShift: 0, lead: 'edmLead', bass: 'octaves', chords: 'pad', arp: 1, pump: 0.25,
  intro: 'solo', form: 'breakfirst', build: 'stop', beat: 'K.h.S.h.K.h.S.h.', fill: 'K.h.S.h.K.t.t.tt',
  chart: ['F#m', 'D', 'E', 'C#m', 'F#m', 'D', 'E', 'C#'],
  hookA: bars('C#6:6 E6:2 F#6:4 A6:4', 'F#6:6 E6:2 D6:8', 'E6:6 G#6:2 B6:4 G#6:4', 'C#6:6 E6:2 G#5:8', 'C#7:6 B6:2 A6:4 F#6:4', 'A6:6 F#6:2 D6:8', 'B6:4 G#6:4 E6:4 B6:4', 'F6:8 G#6:8'),
  hookB: bars('A6:4 C#7:4 F#7:4 E7:4', 'D7:6 C#7:2 A6:8', 'B6:4 E7:4 G#7:4 F#7:4', 'E7:6 C#7:2 G#6:8', 'F#7:4 E7:4 C#7:4 A6:4', 'F#7:4 D7:4 A6:8', 'G#7:4 E7:4 B6:4 E7:4', 'F7:8 C#7:8'),
});

const springs = edm({
  name: 'springs', bpm: 128, voice: 'sitar', lead: 'sitarLead', lead2: 'saw', bass: 'off', chords: 'stab',
  intro: 'kick', build: 'kick', beat: 'K.o.C.o.K.o.C.o.', fill: 'K.o.C.o.KKKKCCCC',
  chart: ['Gm', 'Eb', 'Bb', 'F', 'Gm', 'Eb', 'Cm', 'D'],
  hookA: bars('G6:2 Bb6:1 A6:1 G6:2 D6:2 G6:3 Bb6:3 A6:2', 'G6:2 Bb6:1 A6:1 G6:2 Eb6:2 G6:3 Bb6:3 C7:2', 'D7:2 F7:1 Eb7:1 D7:2 Bb6:2 F6:3 Bb6:3 D7:2', 'C7:4 A6:4 F6:8',
    'G6:2 Bb6:1 A6:1 G6:2 D6:2 G6:3 Bb6:3 A6:2', 'G6:2 Bb6:1 A6:1 G6:2 Eb6:2 G6:3 Bb6:3 C7:2', 'C7:2 Eb7:1 D7:1 C7:2 G6:2 Eb6:3 G6:3 C7:2', 'D7:6 F#6:2 A6:8'),
  hookB: bars('G6:3 G6:3 D7:2 G6:3 G6:3 Bb6:2', 'Eb7:3 Eb7:3 Bb6:2 G6:4 Eb6:4', 'F6:3 F6:3 D7:2 F6:3 F6:3 Bb6:2', 'A6:4 C7:4 F7:8',
    'G6:3 G6:3 D7:2 G6:3 G6:3 Bb6:2', 'Eb7:3 Eb7:3 Bb6:2 G6:4 Eb6:4', 'C7:3 C7:3 G7:2 Eb7:4 C7:4', 'F#7:8 D7:8'),
  extra: { koto: ['koto', 'arp', 0.25] },
});

const peak = edm({
  name: 'peak', bpm: 130, voice: 'glock', voiceShift: 0, voiceGain: 0.4, lead: 'edmPluck', lead2: 'edmLead', bass: 'techno', chords: 'pad', pump: 0.3,
  form: 'coldopen', build: 'snare', beat: 'K..hC.hhK..hC.hh', fill: 'K..hC.hhK.KKCCCC',
  chart: ['Bbm', 'Gb', 'Db', 'Ab', 'Bbm', 'Gb', 'Ebm', 'F'],
  hookA: bars('F6:2 Bb6:2 Db7:2 Bb6:2 F6:2 Bb6:2 Db7:2 F7:2', 'Gb6:2 Bb6:2 Db7:2 Bb6:2 Gb6:2 Bb6:2 Db7:2 Gb7:2', 'F6:2 Ab6:2 Db7:2 Ab6:2 F6:2 Ab6:2 Db7:2 F7:2', 'Eb6:2 Ab6:2 C7:2 Ab6:2 Eb6:2 Ab6:2 C7:2 Eb7:2',
    'F6:2 Bb6:2 Db7:2 Bb6:2 F6:2 Bb6:2 Db7:2 F7:2', 'Gb6:2 Bb6:2 Db7:2 Bb6:2 Gb6:2 Bb6:2 Db7:2 Gb7:2', 'Eb6:2 Gb6:2 Bb6:2 Gb6:2 Eb6:2 Gb6:2 Bb6:2 Eb7:2', 'F6:2 A6:2 C7:2 A6:2 F6:2 A6:2 C7:2 F7:2'),
  hookB: bars('Db7:8 Bb6:8', 'Db7:8 Gb7:8', 'F7:8 Db7:8', 'Eb7:8 C7:8', 'F7:4 Db7:4 Bb6:8', 'Gb7:4 F7:4 Db7:8', 'Gb7:4 Eb7:4 Bb6:8', 'A6:8 C7:8'),
  extra: { chimes: ['chimes', 'root5', 0.25] },
});

const starfall = edm({
  name: 'starfall', bpm: 150, voice: 'chimes', lead: 'chimesLead', lead2: 'saw', bass: 'sub', chords: 'swell', pump: 0.35,
  intro: 'arp', build: 'stop', beat: 'K..h..h.S..h..hK', fill: 'K..h..h.SSSSSSSS',
  chart: ['B', 'G#m', 'E', 'F#', 'B', 'G#m', 'E', 'F#'],
  hookA: bars('F#6:2 r:1 F#6:1 D#6:2 B5:2 F#6:2 r:1 F#6:1 G#6:4', 'D#6:2 r:1 D#6:1 B5:2 G#5:2 D#6:2 r:1 D#6:1 F#6:4', 'E6:2 r:1 E6:1 B5:2 G#5:2 E6:2 r:1 E6:1 G#6:4', 'A#6:4 C#7:4 F#7:8',
    'F#6:2 r:1 F#6:1 D#6:2 B5:2 F#6:2 r:1 F#6:1 G#6:4', 'D#6:2 r:1 D#6:1 B5:2 G#5:2 D#6:2 r:1 D#6:1 F#6:4', 'G#6:2 B6:2 E7:4 D#7:2 B6:2 G#6:4', 'F#6:8 A#6:4 C#7:4'),
  hookB: bars('D#7:4 C#7:4 B6:4 F#6:4', 'G#6:4 B6:4 D#7:8', 'E7:4 D#7:4 B6:4 G#6:4', 'A#6:4 C#7:4 F#7:8', 'B6:3 D#7:3 F#7:2 D#7:4 B6:4', 'B6:3 D#7:3 G#7:2 F#7:4 D#7:4', 'G#6:3 B6:3 E7:2 D#7:4 C#7:4', 'C#7:8 A#6:8'),
  extra: { vibes: ['vibes', 'arp', 0.25] },
});

// The queens' trial: an electro waltz in three, the kick on one, claps on two and three.
const queen = edm({
  name: 'queen', bpm: 168, rows: 12, voice: 'violin', lead: 'saw', bass: 'waltz', chords: 'stab',
  intro: 'solo', build: 'snare', beat: 'K...c...c...', fill: 'K...c.K.cccc',
  chart: ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Eb', 'D', 'Gm'],
  hookA: bars('D6:4 G6:4 Bb6:4', 'Bb6:8 G6:4', 'C7:4 Eb7:4 G7:4', 'F#7:8 D7:4', 'Bb6:4 D7:4 G7:4', 'G7:4 F7:4 Eb7:4', 'D7:4 C7:4 A6:4', 'G6:12'),
  hookB: bars('D7:4 G7:4 Bb7:4', 'Eb7:8 G7:4', 'C7:4 Eb7:4 G7:4', 'A7:8 F#7:4', 'G7:4 F7:4 D7:4', 'Eb7:4 D7:4 C7:4', 'F#7:4 A7:4 D7:4', 'G7:12'),
});

export const SONGS = { title, town, meadow, harbor, crag, forest, grove, ruins, cave, sky, hollow, boss, shrine, ridge, springs, peak, starfall, queen };

// Each town's evening version: the same song a touch slower, the lead handed to a piano (or the
// horn, for the warriors' town), the drums pulled back.
const EVENING = { town: 'piano', harbor: 'piano', crag: 'horn', grove: 'piano' };
for (const [key, lead] of Object.entries(EVENING)) {
  const song = SONGS[key];
  SONGS[`${key}-night`] = {
    ...song,
    name: `${key}-night`,
    bpm: Math.round(song.bpm * 0.93),
    drums: (song.drums ?? 1) * 0.6,
    pump: 0.2,
    reverb: { ...song.reverb, wet: (song.reverb?.wet ?? 0.25) + 0.08 },
    tracks: Object.fromEntries(Object.entries(song.tracks).map(([k, tr]) => [k, k === 'lead' ? { ...tr, inst: lead, gain: tr.gain * 1.1, verb: (tr.verb ?? 0.3) + 0.1 } : tr])),
    patterns: Object.fromEntries(Object.entries(song.patterns).map(([k, pat]) => [k, pat.lead ? { ...pat, lead: pat.lead.replace(/^@\w+ /, '') } : pat])),
  };
}

// Each field and town song's fight layer: the same song, bar for bar (so it loops in step with
// it), faded in on top while there's a fight on (music.js). Over the drops it adds offbeat hats;
// where the song has no drums (the intro, the breakdown) it brings in the song's own beat, so a
// fight never goes quiet. Its bass comes up; the other parts stay in, silenced, so every section
// keeps its length.
for (const key of ['town', 'meadow', 'harbor', 'crag', 'forest', 'grove', 'ruins', 'cave', 'sky', 'hollow', 'shrine', 'ridge', 'springs', 'peak', 'starfall']) {
  const song = SONGS[key];
  SONGS[`${key}-fight`] = {
    ...song,
    name: `${key}-fight`,
    drums: 1,
    tracks: Object.fromEntries(Object.entries(song.tracks).map(([k, tr]) => [k, k === 'bass' ? { ...tr, gain: tr.gain * 1.2 } : { ...tr, gain: 0 }])),
    patterns: Object.fromEntries(Object.entries(song.patterns).map(([k, pat]) => [k, { ...pat, drums: pat.drums ? song.fight.top : song.fight.kick }])),
  };
}
