// The music: one song per area, fast and epic (the player's ask: hardstyle and EDM, never boring;
// rock and metal were tried and dropped), each its own: its key, tempo, two hooks written note by
// note, the area's own recorded instrument carrying the theme, its groove and its opening. Most
// are hardstyle (`hard()`: the distorted kick, the supersaw lead, the reverse bass, a raw screech
// for the wild places); the bright open ones are EDM (`edm()`). All on recorded instruments;
// studio.js renders them.
//
// The areas:
// - Title: "Wings of the Tengu", F# minor, a brass call over piano, opening on the breakdown.
// - Sprout Village: "Sprout Bounce", EDM (big room, 128), A major, a flute hook that skips a beat.
// - Meadows: "Windrunner", Frenchcore (172), E major, cold open, staccato violin, a screech run.
// - Pastel Harbor: "Coral Lights", euphoric (142), B-flat major, a flute hook off the beat, marimba.
// - Ember Crag: "Ember March", G minor, a dotted brass march, galloping kicks, timpani.
// - Forest: "Thornwood Reel", Frenchcore (168), A Dorian, an ornamented pan-flute reel.
// - Moonleaf Grove: "Silverleaf", E minor, half-time, a long violin line, cello.
// - Ruins: "Fallen Spire", C minor, a horn hymn in whole steps, bells, a wide screech.
// - Cave: "Echo Hollow", B minor (the Andalusian fall), celesta arpeggios, a breakbeat.
// - Sky: "Skyline", trance (138), D major, glockenspiel, then the longest, highest notes.
// - The Hollow: "Rootwood Rampage", Frenchcore (168), G# minor, hammered horn notes.
// - Bosses: "Tengu King", Frenchcore (175), D minor: brass, timpani, two raw sections.
// - Fox Shrine Path: "Kitsune Matsuri", the koto in the old in-scale, taiko toms, woodblock.
// - Moonlit Ridge: "Moonfall", A-flat major, half-time, a piano hook with horn.
// - Serpent Springs: "Serpent Groove", F# Dorian, a 3-3-2 sitar hook over a 3-3-2 kick.
// - Frozen Peak: "Glacier Run", A minor (165), cold open, icy glockenspiel and celesta.
// - Starfall Heights: "Starfall", half-time future bass, E major, chopped hand chimes.
// - The queens (trials and rematches): "Queen's Gauntlet", a hardstyle waltz in E minor, violin.
// The arranging rule (the player's ask: no clutter): one melody at a time, nothing doubles the
// lead, one chord bed at a time, and at most one extra colour in a song's last drop or chorus.
// At night the towns play an evening version (the lead on piano, the kicks pulled back), and a
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


// The hardstyle instruments: the recorded ones above, plus the hard synths.
const H = {
  ...I,
  lead: { synth: 'hardlead', gain: 0.55 },
  leadSoft: { synth: 'hardlead', gain: 0.35, cut: 2200, drive: 1.1 },
  screech: { synth: 'screech', gain: 0.5 },
  screechWide: { synth: 'screech', gain: 0.5, bend: -9, lfo: 3 },
  rb: { synth: 'rbass', gain: 0.75 },
  pad: { synth: 'pad', gain: 0.4, cut: 2400 },
  riser: { synth: 'riser', gain: 0.6 },
  koto: { sample: 'koto', rel: 0.5, gain: 0.9 },
  chimes: { sample: 'hand_chimes', rel: 0.6, gain: 0.8 },
  vibes: { sample: 'vibraphone', rel: 0.6, gain: 0.8 },
  bells: { sample: 'tubular_bells', rel: 0.8, gain: 0.7 },
  kalimba: { sample: 'kalimba', rel: 0.4, gain: 0.8 },
  cello: { sample: 'cello', attack: 0.05, rel: 0.4 },
  // The EDM synths: a singing supersaw, a bright pluck.
  edmLead: { synth: 'lead', gain: 0.5, cut: 4200 },
  edmPluck: { synth: 'pluck', gain: 0.45, cut: 5000, ring: 0.25 },
};

// ---------- The hardstyle builder ----------
// Every song has the same bones (an intro on the area's own instrument, a snare-roll build, the
// drop, a raw screech section for the wild places, a breakdown, the build again, a bigger second
// drop), and is made its own by what's passed in:
// { name, bpm, rows (16, or 12 for the waltz), chart (8 bars), hookA, hookB (8 bars each),
//   voice (the area's instrument: it plays the intro and the breakdown and doubles the drops),
//   voiceShift (semitones, -12 by default), arp (the instrument for the arpeggios), bass ('off' |
//   'roll' | 'gallop' | 'stutter' | 'waltz'), beat and fill (one bar of drums each; the drops
//   open on a crash), raw: [bar, bar] (a screech riff in R root, O octave, F fifth, M minor
//   third, L fourth below; the two bars alternate), extra: { track: [inst, figure] } (more layers
//   in the second drop), order }.
const BASS = {
  off: (s, len) => Array(len / 4).fill(`r:2 ${nm(rootIn(s, 2))}:2`).join(' '),
  roll: (s, len) => Array(len / 4).fill(`r:1 ${nm(rootIn(s, 2))}:1 ${nm(rootIn(s, 2))}:1 ${nm(rootIn(s, 2))}:1`).join(' '),
  gallop: (s, len) => Array(len / 4).fill(`r:2 ${nm(rootIn(s, 2))}:1 ${nm(rootIn(s, 2))}:1`).join(' '),
  stutter: (s, len) => Array(len / 8).fill(`r:2 ${nm(rootIn(s, 2))}:2 r:2 ${nm(rootIn(s, 2))}:1 ${nm(rootIn(s, 3))}:1`).join(' '),
  waltz: (s) => `r:4 ${nm(rootIn(s, 2))}:4 ${nm(rootIn(s, 2))}:4`,
};
const RAW = { R: 0, O: 12, F: 7, M: 3, L: -5 };
const riff = (chart, [a, b]) => bars(...chart.map((s, i) => (i % 2 ? b : a).replace(/\b([ROFML]):/g, (_, t) => `${nm(rootIn(s, 4) + RAW[t])}:`)));
const first4 = (line) => bars(...line.split(' | ').slice(0, 4));
// Extra figures for the second drop.
const X = {
  hold: F.hold(60),
  high: F.hold(72),
  arp: F.arp(76, 2),
  root5: (s, len) => `${nm(rootIn(s, 5))}:${len}`,
  timp: (s, len) => Array(len / 8).fill(`${nm(rootIn(s, 2))}:4 ${nm(rootIn(s, 2))}:2 ${nm(rootIn(s, 2))}:2`).join(' '),
  stab: (s, len) => Array(len / 4).fill(`r:2 ${tones(s, 64)}:2`).join(' '),
  // The timpani on one, for the waltz.
  timp3: (s, len) => `${nm(rootIn(s, 2))}:4 r:${len - 4}`,
};

// The kicks a song can be built on: its kick, the kick with a clap, the kick with a crash. The
// grooves are written with X and Z and turned into the song's own kick.
const KICKS = { X: ['X', 'Z', 'W'], F: ['F', 'G', 'V'], P: ['P', 'Y', 'U'] };
// A four-bar roll on `c`: every beat, every beat, every eighth, every sixteenth.
const rollOf = (c, rows) => bars(...[4, 4, 2, 1].map((step) => Array.from({ length: rows }, (_, i) => (i % step ? '.' : c)).join('')));

// More of what makes each song its own:
//   kick: 'X' hardstyle, 'F' Frenchcore, 'P' euphoric. form: 'classic' (an intro, then the build
//   and drop), 'coldopen' (straight into the drop), 'rawfirst' (the screech section opens it),
//   'breakfirst' (the breakdown opens it). intro: 'arp' (the voice over arpeggios and a pad),
//   'solo' (the voice alone), 'kick' (the voice over the bare kick), 'perc' (the voice over the
//   song's own percussion line, `perc`). build: 'snare', 'kick', 'tom' (a roll on it) or 'stop'
//   (a snare roll that drops out for the last bar, so the drop lands out of silence). drums: the
//   kit's level (the busiest grooves sit a little lower, so their kicks don't swamp the song).
function hard(o) {
  const rows = o.rows ?? 16;
  const shiftV = o.voiceShift ?? -12;
  const [k, kc, kx] = KICKS[o.kick ?? 'X'];
  const own = (grid) => grid.replace(/X/g, k).replace(/Z/g, kc);
  const crash = (bar) => (bar[0] === k || bar[0] === kc ? kx : bar[0]) + bar.slice(1);
  const drop = (beat, fill) => bars(crash(own(beat)), own(beat), own(beat), own(fill), own(beat), own(beat), own(beat), own(fill));
  const silent = '.'.repeat(rows);
  const builds = {
    snare: rollOf('S', rows),
    kick: rollOf(k, rows),
    tom: rollOf('t', rows),
    stop: bars(...rollOf('S', rows).split(' | ').slice(0, 3), silent),
  };
  const c4 = o.chart.slice(0, 4);
  const arp = F.arp(o.arpAt ?? 72, 2);
  const bass = BASS[o.bass ?? 'off'];
  const tracks = {
    lead: { inst: 'lead', gain: 0.5, verb: 0.22, echo: { rows: 3, fb: 0.25, wet: 0.16 } },
    voice: { inst: o.voice, gain: o.voiceGain ?? 0.55, pan: -0.15, verb: 0.35 },
    arp: { inst: o.arp, gain: o.arpGain ?? 0.38, pan: 0.2, verb: 0.3 },
    strings: { inst: 'strings', gain: 0.28, pan: 0.25, verb: 0.4 },
    pad: { inst: 'pad', gain: 0.22, verb: 0.3 },
    rb: { inst: 'rb', gain: 0.3, verb: 0, low: true },
    sub: { inst: 'sub', gain: 0.26, verb: 0, low: true },
    riser: { inst: 'riser', gain: 0.5, verb: 0.3 },
  };
  const extra = {};
  for (const [k, [inst, fig, gain]] of Object.entries(o.extra ?? {}).slice(0, 1)) {
    tracks[k] = { inst, gain: gain ?? 0.35, pan: 0.3, verb: 0.3 };
    extra[k] = part(o.chart, X[fig], rows);
  }
  const voice4 = shift(first4(o.hookA), shiftV);
  const intros = {
    arp: { voice: voice4, arp: part(c4, arp, rows) },
    solo: { voice: voice4 },
    kick: { voice: voice4, drums: own(o.introBeat ?? (rows === 12 ? 'X.....X.....' : 'X...X...X...X...')) },
    perc: { voice: voice4, pad: part(c4, F.hold(60), rows), drums: o.perc ?? 'h.t.h.w.h.t.hww.' },
  };
  const bassline = o.bass === 'none' ? {} : { rb: part(o.chart, bass, rows) };
  const patterns = {
    intro: intros[o.intro ?? 'arp'],
    build: { lead: `@leadSoft ${first4(o.hookA)}`, arp: part(c4, arp, rows), riser: bars(`C4:${rows}`, `~:${rows}`, `~:${rows}`, `~:${rows}`), drums: builds[o.build ?? 'snare'] },
    dropA: { lead: o.hookA, pad: part(o.chart, F.hold(60), rows), ...bassline, drums: drop(o.beat, o.fill) },
    break: { voice: shift(o.hookB, shiftV), arp: part(o.chart, arp, rows), sub: part(o.chart, F.root(2), rows), ...(o.breakBeat ? { drums: own(o.breakBeat) } : {}) },
    dropB: { lead: o.hookB, strings: part(o.chart, F.hold(60), rows), ...bassline, ...extra, drums: drop(o.beatB ?? o.beat, o.fillB ?? o.fill) },
  };
  if (o.raw) {
    tracks.screech = { inst: o.screech ?? 'screech', gain: 0.5, pan: 0.05, verb: 0.15, echo: { rows: 3, fb: 0.2, wet: 0.12 } };
    patterns.raw = { screech: riff(o.chart, o.raw), drums: drop(o.rawBeat ?? o.beat, o.rawFill ?? o.fill) };
  }
  const raw = o.raw ? ['raw'] : [];
  const forms = {
    classic: [['intro'], ['build', 'dropA', ...raw, 'break', 'build', 'dropB']],
    coldopen: [[], ['dropA', 'break', 'build', 'dropB', ...raw]],
    rawfirst: [['intro'], ['raw', 'build', 'dropA', 'break', 'build', 'dropB']],
    breakfirst: [['break'], ['build', 'dropA', ...raw, 'intro', 'build', 'dropB']],
  };
  const [intro, order] = forms[o.form ?? 'classic'];
  return {
    name: o.name, bpm: o.bpm, rows, kick: k, inst: H, pump: o.pump ?? 0.3, drums: o.drums ?? 1.05, bright: 0.6, reverb: { room: 0.84, wet: 0.17 },
    tracks,
    patterns,
    intro,
    order: o.order ?? order,
  };
}

// ---------- The EDM builder ----------
// An EDM song: an intro of plucked arpeggios and the area's instrument, a build (a riser, a snare
// roll), the drop (a singing supersaw over chord stabs, an offbeat bass and the four-on-the-floor
// kick, pumping), a piano breakdown, the build again, the second drop with a running arpeggio.
// { name, bpm, chart, hookA, hookB, voice, voiceShift, beat, fill, style: 'bigroom' (offbeat
//   stabs and open hats) | 'trance' (rolling sixteenth arpeggios) | 'future' (half-time, swelling
//   chords), extra, order }.
function edm(o) {
  const rows = 16;
  const shiftV = o.voiceShift ?? -12;
  const c4 = o.chart.slice(0, 4);
  const style = o.style ?? 'bigroom';
  const drop = (fill) => bars(`I${o.beat.slice(1)}`, o.beat, o.beat, fill, o.beat, o.beat, o.beat, fill);
  const stabs = style === 'future' ? part(o.chart, (s, len) => Array(len / 8).fill(`${tones(s, 64)}:3 r:1 ${tones(s, 64)}:2 ${tones(s, 64)}:2`).join(' '), rows) : part(o.chart, F.offbeat(64), rows);
  const arp = style === 'trance' ? F.arp(72, 1) : F.arp(72, 2);
  const tracks = {
    lead: { inst: 'edmLead', gain: 0.5, verb: 0.3, echo: { rows: 3, fb: 0.3, wet: 0.2 } },
    voice: { inst: o.voice, gain: o.voiceGain ?? 0.5, pan: -0.15, verb: 0.35 },
    arp: { inst: 'edmPluck', gain: 0.32, pan: 0.25, verb: 0.3, echo: { rows: 3, fb: 0.25, wet: 0.2 } },
    stabs: { inst: 'stab', gain: 0.32, pan: -0.2, verb: 0.25 },
    piano: { inst: 'piano', gain: 0.45, pan: 0.1, verb: 0.35 },
    pad: { inst: 'pad', gain: 0.24, verb: 0.35 },
    bass: { inst: 'synbass', gain: 0.4, verb: 0, low: true },
    riser: { inst: 'riser', gain: 0.5, verb: 0.3 },
  };
  const extra = {};
  for (const [k, [inst, fig, gain]] of Object.entries(o.extra ?? {}).slice(0, 1)) {
    tracks[k] = { inst, gain: gain ?? 0.35, pan: 0.3, verb: 0.3 };
    extra[k] = part(o.chart, X[fig], rows);
  }
  const bass = part(o.chart, style === 'future' ? F.root(2) : F.offbeat(40), rows);
  const patterns = {
    intro: { voice: shift(first4(o.hookA), shiftV), arp: part(c4, arp, rows), drums: o.introBeat ?? '..h...h...h...h.' },
    build: { lead: first4(o.hookA).replace(/^/, '@edmPluck '), riser: bars(`C4:${rows}`, `~:${rows}`, `~:${rows}`, `~:${rows}`), pad: part(c4, F.hold(60), rows), drums: rollOf('S', rows) },
    drop: { lead: o.hookA, stabs, bass, drums: drop(o.fill) },
    break: { voice: shift(o.hookB, shiftV), piano: part(o.chart, F.hold(60), rows) },
    drop2: { lead: o.hookB, arp: part(o.chart, arp, rows), stabs, bass, ...extra, drums: drop(o.fillB ?? o.fill) },
  };
  return {
    name: o.name, bpm: o.bpm, rows, inst: H, pump: o.pump ?? 0.5, drums: 1, bright: 0.6, reverb: { room: 0.84, wet: 0.18 },
    fight: { top: '..h.S.h...h.S.hh', kick: 'K.o.C.o.K.o.C.o.' },
    tracks,
    patterns,
    intro: ['intro'],
    order: o.order ?? ['build', 'drop', 'break', 'build', 'drop2'],
  };
}

// ---------- The songs ----------
// Each hook is a short motif stated, answered and resolved; the second hook is the anthem.
const title = hard({
  name: 'title', bpm: 145, voice: 'brass', arp: 'piano', bass: 'off',
  kick: 'X', form: 'breakfirst', intro: 'solo', build: 'stop', beat: 'X.h.Z.h.X.h.Z.h.', beatB: 'X.hhZ.hXX.hhZ.hX', fill: 'X.h.Z.hXX.XXZZZZ',
  chart: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'Bm', 'C#'],
  hookA: bars('C#6:3 F#6:3 A6:2 G#6:2 F#6:2 E6:4', 'F#6:3 D6:3 A5:2 D6:8', 'C#6:3 E6:3 A6:2 G#6:2 E6:2 C#6:4', 'B5:3 E6:3 G#6:2 B6:8',
    'C#6:3 F#6:3 A6:2 G#6:2 F#6:2 E6:4', 'F#6:3 A6:3 D7:2 C#7:2 A6:2 F#6:4', 'D7:3 B6:3 F#6:2 D6:4 F#6:4', 'F6:6 G#6:2 C#7:8'),
  hookB: bars('A6:6 G#6:2 F#6:4 C#7:4', 'D7:6 C#7:2 A6:8', 'E7:6 D7:2 C#7:4 A6:4', 'B6:6 G#6:2 E6:8',
    'A6:4 C#7:4 F#7:6 E7:2', 'D7:4 F#7:4 A7:8', 'F#7:3 D7:3 B6:2 D7:4 F#7:4', 'F7:8 C#7:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

const town = edm({
  name: 'town', bpm: 128, voice: 'flute', style: 'bigroom',
  beat: 'K.o.C.oxK.o.C.ox', fill: 'K.o.C.o.SSSSSSSS',
  chart: ['A', 'E', 'F#m', 'D', 'A', 'E', 'D', 'E'],
  hookA: bars('E6:2 A6:2 r:2 A6:2 C#7:2 B6:2 A6:4', 'B6:2 G#6:2 r:2 E6:2 G#6:2 B6:2 E7:4', 'C#7:2 A6:2 r:2 F#6:2 A6:2 C#7:2 E7:4', 'D7:4 C#7:2 B6:2 A6:8',
    'E6:2 A6:2 r:2 A6:2 C#7:2 B6:2 A6:4', 'B6:2 G#6:2 r:2 E6:2 G#6:2 B6:2 E7:4', 'F#7:2 E7:2 D7:2 A6:2 F#6:2 A6:2 D7:4', 'E7:8 r:4 E6:4'),
  hookB: bars('A6:3 A6:3 C#7:2 E7:3 C#7:3 A6:2', 'G#6:3 G#6:3 B6:2 E7:3 B6:3 G#6:2', 'F#6:3 A6:3 C#7:2 F#7:3 E7:3 C#7:2', 'D7:4 E7:4 F#7:8',
    'A6:3 A6:3 C#7:2 E7:3 C#7:3 A6:2', 'G#6:3 G#6:3 B6:2 E7:3 B6:3 G#6:2', 'A7:3 F#7:3 D7:2 E7:3 F#7:3 A7:2', 'G#7:8 E7:8'),
  extra: { glock: ['glock', 'arp', 0.25] },
});

const meadow = hard({
  name: 'meadow', bpm: 172, voice: 'violin', arp: 'pizz', bass: 'none',
  kick: 'F', form: 'coldopen', build: 'kick', beat: 'X.hXZ.h.X.hXZ.h.', fill: 'XXhXZXhXXXXXZZZZ',
  chart: ['E', 'B', 'C#m', 'A', 'E', 'B', 'A', 'B'],
  hookA: bars('E6:1 r:1 G#6:1 r:1 B6:2 G#6:2 E6:2 B5:2 E6:4', 'D#6:1 r:1 F#6:1 r:1 B6:2 F#6:2 D#6:2 B5:2 D#6:4', 'C#6:1 r:1 E6:1 r:1 G#6:2 E6:2 C#6:2 G#6:2 C#7:4', 'A6:4 G#6:2 F#6:2 E6:8',
    'E6:1 r:1 G#6:1 r:1 B6:2 G#6:2 E6:2 B5:2 E6:4', 'D#6:1 r:1 F#6:1 r:1 B6:2 F#6:2 D#6:2 B5:2 D#6:4', 'A6:2 B6:2 C#7:2 E7:2 C#7:2 B6:2 A6:4', 'B6:6 D#7:2 F#7:8'),
  hookB: bars('B6:4 E7:4 G#7:4 F#7:4', 'F#7:6 D#7:2 B6:8', 'C#7:4 E7:4 G#7:4 F#7:4', 'E7:6 C#7:2 A6:8',
    'G#7:4 F#7:4 E7:4 B6:4', 'D#7:4 F#7:4 B7:8', 'C#7:3 E7:3 A7:2 G#7:4 F#7:4', 'F#7:8 D#7:4 B6:4'),
  raw: ['R:2 O:1 R:1 F:2 R:2 O:2 R:2 F:4', 'O:3 F:3 R:2 L:3 R:3 O:2'],
  extra: { horn: ['horn', 'hold', 0.3] },
});

const harbor = hard({
  name: 'harbor', bpm: 142, voice: 'flute', arp: 'guitar', bass: 'stutter',
  kick: 'P', intro: 'perc', perc: 'x.hwx.h.x.hwx.hh', build: 'tom', beat: 'X.hhZ..hX.hhZ.Xh', fill: 'X.hhZ..hXXXXZZZZ',
  chart: ['Bb', 'F', 'Gm', 'Eb', 'Bb', 'F', 'Eb', 'F'],
  hookA: bars('r:2 D6:2 F6:2 Bb6:2 r:2 A6:2 F6:4', 'r:2 C6:2 F6:2 A6:2 r:2 G6:2 F6:4', 'r:2 Bb5:2 D6:2 G6:2 r:2 F6:2 D6:4', 'Eb6:3 G6:3 Bb6:2 G6:8',
    'r:2 D6:2 F6:2 Bb6:2 r:2 A6:2 F6:4', 'r:2 C6:2 F6:2 A6:2 r:2 G6:2 F6:4', 'G6:2 Bb6:2 Eb7:2 D7:2 C7:2 Bb6:2 G6:4', 'A6:6 C7:2 F6:8'),
  hookB: bars('F7:3 D7:3 Bb6:2 D7:4 F7:4', 'C7:3 A6:3 F6:2 A6:4 C7:4', 'D7:3 Bb6:3 G6:2 Bb6:4 D7:4', 'Eb7:6 D7:2 Bb6:8',
    'F7:3 G7:3 F7:2 D7:4 Bb6:4', 'A6:3 C7:3 F7:2 E7:4 C7:4', 'G7:3 F7:3 Eb7:2 Bb6:4 G6:4', 'F7:8 A6:4 C7:4'),
  extra: { marimba: ['marimba', 'arp', 0.3] },
});

const crag = hard({
  name: 'crag', bpm: 152, voice: 'brass', arp: 'pizz', bass: 'none',
  kick: 'X', drums: 0.8, form: 'rawfirst', intro: 'kick', introBeat: 'X.t.X.t.X.tXX.t.', build: 'kick', beat: 'XX.hZ.XhXX.hZ.X.', fill: 'XX.XZ.XXXXXXZZZZ',
  chart: ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Eb', 'F', 'D'],
  hookA: bars('G5:3 G5:1 Bb5:3 D6:1 G6:4 F6:2 D6:2', 'Eb6:3 Eb6:1 G6:3 Bb6:1 Eb7:4 D7:2 Bb6:2', 'C6:3 C6:1 Eb6:3 G6:1 C7:4 Bb6:2 G6:2', 'F#6:4 A6:4 D7:8',
    'G5:3 G5:1 Bb5:3 D6:1 G6:4 F6:2 D6:2', 'Eb6:3 Eb6:1 G6:3 Bb6:1 Eb7:4 D7:2 Bb6:2', 'F6:3 F6:1 A6:3 C7:1 F7:4 Eb7:2 C7:2', 'D7:6 C7:2 A6:4 F#6:4'),
  hookB: bars('D7:4 Bb6:4 G6:4 D7:4', 'Eb7:4 G7:4 Bb7:8', 'G7:4 Eb7:4 C7:4 G6:4', 'A6:4 F#6:4 D6:8',
    'G7:3 F7:3 D7:2 Bb6:3 C7:3 D7:2', 'Eb7:3 D7:3 Bb6:2 G6:4 Bb6:4', 'C7:3 Eb7:3 F7:2 A7:4 F7:4', 'F#7:8 D7:8'),
  raw: ['R:3 R:1 O:3 R:1 F:4 M:2 R:2', 'R:2 M:2 F:2 O:2 r:2 F:2 R:4'],
  extra: { timp: ['timpani', 'timp', 0.45] },
});

const forest = hard({
  name: 'forest', bpm: 168, voice: 'panflute', arp: 'harp', bass: 'roll',
  kick: 'F', intro: 'kick', introBeat: 'X...X...X..XX.X.', build: 'stop', beat: 'X.hhZ.hXX.hhZ.hh', fill: 'XXhhZXhXXXXXZZZZ',
  chart: ['Am', 'D', 'Am', 'G', 'Am', 'D', 'F', 'E'],
  hookA: bars('A5:2 C6:1 B5:1 A5:2 E6:2 A6:2 G6:1 F#6:1 E6:4', 'F#6:2 A6:1 G6:1 F#6:2 D6:2 A5:2 D6:2 F#6:4', 'E6:2 G6:1 F#6:1 E6:2 C6:2 A5:2 C6:2 E6:4', 'D6:2 B5:2 G5:2 B5:2 D6:2 G6:2 B6:4',
    'A5:2 C6:1 B5:1 A5:2 E6:2 A6:2 G6:1 F#6:1 E6:4', 'F#6:2 A6:1 G6:1 F#6:2 D6:2 A5:2 D6:2 F#6:4', 'C7:2 A6:2 F6:2 A6:2 C7:2 F7:2 E7:4', 'E7:4 B6:4 G#6:8'),
  hookB: bars('E7:3 C7:3 A6:2 E7:3 F#7:3 E7:2', 'D7:3 F#7:3 A7:2 F#7:4 D7:4', 'C7:3 E7:3 A7:2 G7:4 E7:4', 'D7:6 B6:2 G6:8',
    'A7:3 G7:3 E7:2 C7:3 D7:3 E7:2', 'F#7:4 E7:4 D7:4 A6:4', 'F7:3 E7:3 C7:2 A6:4 C7:4', 'B6:8 G#6:4 E6:4'),
  raw: ['R:1 R:1 O:2 R:1 R:1 F:2 M:2 O:2 R:4', 'O:2 F:2 M:2 R:2 O:2 F:2 R:4'],
  extra: { fiddle: ['violin', 'high', 0.25] },
});

const grove = hard({
  name: 'grove', bpm: 144, voice: 'violin', arp: 'piano', bass: 'off',
  kick: 'P', form: 'breakfirst', intro: 'solo', build: 'stop', beat: 'X.h.h.h.Z.h.h.hX', beatB: 'X.h.Z.h.X.h.Z.hX', fill: 'X.h.h.h.Z.hXZZZZ',
  chart: ['Em', 'C', 'G', 'B7', 'Em', 'C', 'Am', 'B'],
  hookA: bars('B5:6 E6:2 G6:4 F#6:4', 'E6:6 C6:2 G5:8', 'D6:6 G6:2 B6:4 A6:4', 'F#6:6 D#6:2 B5:8',
    'B6:6 G6:2 E6:4 G6:4', 'C7:6 B6:2 G6:4 E6:4', 'A6:4 C7:4 E7:4 C7:4', 'D#7:8 F#7:4 B6:4'),
  hookB: bars('E7:3 D7:3 B6:2 G6:3 B6:3 E7:2', 'E7:3 G7:3 E7:2 C7:4 G6:4', 'D7:3 B6:3 G6:2 B6:3 D7:3 G7:2', 'F#7:4 D#7:4 B6:4 A6:4',
    'G7:3 F#7:3 E7:2 B6:3 E7:3 G7:2', 'G7:4 E7:4 C7:4 E7:4', 'E7:3 A7:3 C8:2 B7:4 A7:4', 'B7:8 F#7:4 D#7:4'),
  extra: { cello: ['cello', 'hold', 0.3] },
});

const ruins = hard({
  name: 'ruins', bpm: 148, voice: 'horn', arp: 'harp', bass: 'roll',
  kick: 'X', form: 'rawfirst', build: 'tom', beat: 'X..hZ.hXX..hZ.XX', fill: 'X.XXZ.XXXXXXZZXX',
  chart: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G'],
  hookA: bars('C6:4 Eb6:4 G6:4 Eb6:4', 'Ab6:6 G6:2 Eb6:8', 'F6:4 Ab6:4 C7:4 Ab6:4', 'G6:6 F6:2 D6:8',
    'Eb6:4 G6:4 C7:4 Bb6:4', 'Ab6:4 C7:4 Eb7:8', 'D7:4 Bb6:4 F6:4 D6:4', 'B5:6 D6:2 G6:8'),
  hookB: bars('G6:2 Eb6:2 C6:4 Eb6:2 G6:2 C7:4', 'C7:2 Ab6:2 Eb6:4 Ab6:8', 'Ab6:2 F6:2 C6:4 F6:2 Ab6:2 C7:4', 'B6:4 D7:4 G7:8',
    'Eb7:2 D7:2 C7:4 G6:2 Bb6:2 C7:4', 'Eb7:4 C7:4 Ab6:8', 'F7:2 D7:2 Bb6:4 D7:2 F7:2 Bb7:4', 'B6:8 D7:4 G7:4'),
  raw: ['R:2 R:1 R:1 M:2 r:2 F:2 R:2 O:4', 'L:2 R:2 M:2 F:2 r:2 O:2 R:4'],
  screech: 'screechWide',
  extra: { bells: ['bells', 'root5', 0.35] },
});

const cave = hard({
  name: 'cave', bpm: 158, voice: 'celesta', arp: 'vibes', bass: 'stutter',
  kick: 'X', intro: 'perc', perc: 'w..hw..tw..hw.tt', build: 'stop', beat: 'X.hXZ.h.hXh.Z.hX', fill: 'X.hXZXhXX.XXZZZZ',
  chart: ['Bm', 'A', 'G', 'F#', 'Bm', 'A', 'G', 'F#'],
  hookA: bars('F#6:2 B6:2 D7:2 B6:2 F#6:2 D6:2 B5:4', 'E6:2 A6:2 C#7:2 A6:2 E6:2 C#6:2 A5:4', 'D6:2 G6:2 B6:2 G6:2 D6:2 B5:2 G5:4', 'C#6:4 F#6:4 A#6:8',
    'B6:2 D7:2 F#7:2 D7:2 B6:2 F#6:2 D6:4', 'A6:2 C#7:2 E7:2 C#7:2 A6:2 E6:2 C#6:4', 'G6:2 B6:2 D7:2 G7:2 F#7:2 D7:2 B6:4', 'A#6:6 C#7:2 F#7:8'),
  hookB: bars('D7:6 C#7:2 B6:8', 'C#7:6 B6:2 A6:8', 'B6:6 A6:2 G6:8', 'A#6:4 C#7:4 F#7:8',
    'F#7:4 E7:4 D7:4 B6:4', 'E7:4 D7:4 C#7:4 A6:4', 'D7:4 C#7:4 B6:4 G6:4', 'F#7:8 C#7:4 A#6:4'),
  raw: ['R:2 O:2 r:1 R:1 O:2 F:2 R:2 M:4', 'O:2 R:2 L:2 R:2 F:3 M:3 R:2'],
  extra: { glock: ['glock', 'arp', 0.25] },
});

const sky = edm({
  name: 'sky', bpm: 138, voice: 'glock', voiceShift: 0, voiceGain: 0.4, style: 'trance',
  beat: 'K.o.C.oxK.oxC.o.', fill: 'K.oxC.oxSSSSSSSS',
  chart: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A'],
  hookA: bars('F#6:2 A6:2 D7:2 A6:2 F#6:2 A6:2 D7:4', 'E6:2 A6:2 C#7:2 A6:2 E6:2 A6:2 C#7:4', 'D6:2 F#6:2 B6:2 F#6:2 D6:2 F#6:2 B6:4', 'D7:4 B6:4 G6:8',
    'A6:2 D7:2 F#7:2 D7:2 A6:2 D7:2 F#7:4', 'C#7:2 E7:2 A7:2 E7:2 C#7:2 E7:2 A7:4', 'B6:2 D7:2 G7:2 D7:2 B6:2 D7:2 G7:4', 'E7:8 C#7:8'),
  hookB: bars('A7:8 F#7:8', 'E7:8 C#7:8', 'D7:8 F#7:8', 'G7:8 B7:8',
    'A7:4 F#7:4 D7:4 F#7:4', 'E7:4 C#7:4 A6:4 C#7:4', 'D7:4 G7:4 B7:4 A7:4', 'A7:16'),
  extra: { flute: ['flute', 'high', 0.3] },
});

const hollow = hard({
  name: 'hollow', bpm: 168, voice: 'horn', arp: 'pizz', bass: 'none',
  kick: 'F', form: 'coldopen', build: 'kick', beat: 'X.XhZ.hXX.XhZ.h.', fill: 'XXXXZ.XXXXXXZZZZ',
  chart: ['G#m', 'E', 'B', 'F#', 'G#m', 'E', 'C#', 'D#'],
  hookA: bars('G#5:2 G#5:1 G#5:1 B5:2 D#6:2 G#6:2 F#6:2 D#6:4', 'G#5:2 G#5:1 G#5:1 B5:2 E6:2 G#6:2 F#6:2 E6:4', 'F#5:2 F#5:1 F#5:1 B5:2 D#6:2 F#6:2 E6:2 D#6:4', 'C#6:4 F#6:4 A#6:8',
    'G#5:2 G#5:1 G#5:1 B5:2 D#6:2 G#6:2 F#6:2 D#6:4', 'G#5:2 G#5:1 G#5:1 B5:2 E6:2 G#6:2 F#6:2 E6:4', 'C#6:2 C#6:1 C#6:1 F6:2 G#6:2 C#7:2 B6:2 G#6:4', 'D#6:4 G6:4 A#6:8'),
  hookB: bars('D#7:3 B6:3 G#6:2 D#7:3 E7:3 D#7:2', 'E7:3 B6:3 G#6:2 E7:4 B6:4', 'F#7:3 D#7:3 B6:2 F#7:3 E7:3 D#7:2', 'C#7:4 A#6:4 F#6:8',
    'G#7:3 F#7:3 D#7:2 B6:3 C#7:3 D#7:2', 'E7:4 G#7:4 B7:8', 'F7:3 C#7:3 G#6:2 C#7:4 F7:4', 'G7:8 D#7:8'),
  raw: ['R:1 R:1 R:1 R:1 O:2 F:2 M:2 O:2 R:4', 'R:2 O:2 r:2 M:2 F:2 r:2 R:4'],
  extra: { timp: ['timpani', 'timp', 0.45] },
});

const boss = hard({
  name: 'boss', bpm: 175, voice: 'brass', arp: 'strings', bass: 'none',
  kick: 'F', form: 'rawfirst', intro: 'kick', introBeat: 'X.X.X.X.X.X.XXXX', build: 'kick', beat: 'X.hXZ.hXX.hXZ.hX', fill: 'XXXXZXXXXXXXZZZZ',
  chart: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A7'],
  hookA: bars('D6:2 A6:2 D7:2 A6:1 A6:1 F6:2 E6:2 D6:4', 'D6:2 F6:2 Bb6:2 F6:1 F6:1 D6:2 C6:2 Bb5:4', 'C6:2 E6:2 G6:2 E6:1 E6:1 C7:2 Bb6:2 G6:4', 'A6:2 C#7:2 E7:2 A7:6 r:4',
    'D6:2 A6:2 D7:2 A6:1 A6:1 F6:2 E6:2 D6:4', 'D6:2 F6:2 Bb6:2 F6:1 F6:1 D6:2 C6:2 Bb5:4', 'G6:2 Bb6:2 D7:2 G7:2 F7:2 D7:2 Bb6:4', 'C#7:4 E7:4 G7:4 A7:4'),
  hookB: bars('F7:4 E7:4 D7:4 A6:4', 'Bb6:4 D7:4 F7:8', 'E7:4 D7:4 C7:4 G6:4', 'A6:4 C#7:4 E7:8',
    'A7:3 F7:3 D7:2 F7:3 E7:3 D7:2', 'D7:3 Bb6:3 F6:2 Bb6:4 D7:4', 'G7:3 F7:3 D7:2 Bb6:3 C7:3 D7:2', 'C#7:4 E7:4 A7:8'),
  raw: ['R:1 O:1 R:1 O:1 F:2 R:2 M:1 M:1 R:2 O:4', 'R:2 R:1 R:1 L:2 R:2 O:2 F:2 M:4'],
  order: ['raw', 'build', 'dropA', 'break', 'build', 'dropB', 'raw'],
  extra: { timp: ['timpani', 'timp', 0.5] },
});

const shrine = hard({
  name: 'shrine', bpm: 150, voice: 'koto', arp: 'koto', arpGain: 0.3, bass: 'off',
  kick: 'X', intro: 'perc', perc: 't.t...w.t.tt..ww', build: 'tom', beat: 'X.t.Z.tXX.t.Z.tt', fill: 'X.w.Z.w.XwXwZwww',
  chart: ['Dm', 'Bb', 'Am', 'Dm', 'Gm', 'Bb', 'Am', 'A'],
  hookA: bars('A6:2 Bb6:2 D7:4 E7:2 D7:2 Bb6:2 A6:2', 'F6:2 A6:2 Bb6:4 D7:4 Bb6:4', 'E6:2 A6:2 E7:4 D7:2 Bb6:2 A6:4', 'D7:6 A6:2 D6:8',
    'G6:2 Bb6:2 D7:4 F7:2 D7:2 Bb6:2 G6:2', 'F7:2 D7:2 Bb6:4 A6:2 Bb6:2 D7:4', 'E7:4 D7:2 Bb6:2 A6:4 E6:4', 'A6:4 Bb6:4 A6:8'),
  hookB: bars('D7:3 E7:3 F7:2 A7:4 F7:4', 'D7:3 F7:3 Bb7:2 A7:4 F7:4', 'E7:3 A7:3 Bb7:2 A7:4 E7:4', 'F7:4 E7:4 D7:8',
    'G6:3 Bb6:3 D7:2 Bb6:4 G6:4', 'F6:3 Bb6:3 D7:2 F7:4 D7:4', 'Bb7:3 A7:3 F7:2 E7:4 Bb6:4', 'A7:8 E7:4 A6:4'),
  raw: ['R:2 F:2 R:1 R:1 O:2 M:3 F:3 R:2', 'O:4 F:2 M:2 R:2 L:2 R:4'],
  extra: { bells: ['bells', 'root5', 0.3] },
});

const ridge = hard({
  name: 'ridge', bpm: 140, voice: 'piano', voiceShift: 0, arp: 'harp', bass: 'off',
  kick: 'P', form: 'breakfirst', build: 'stop', breakBeat: 'h.h.h.h.h.h.h.h.', beat: 'X.h.h.h.Z.h.h.h.', beatB: 'X.h.Z.hhX.h.Z.hh', fill: 'X.h.h.hXZ.hXZZZZ',
  chart: ['Ab', 'Eb', 'Fm', 'Db', 'Ab', 'Eb', 'Db', 'Eb'],
  hookA: bars('C6:4 Eb6:4 Ab6:4 G6:4', 'G6:6 Bb6:2 Eb6:8', 'F6:4 Ab6:4 C7:4 Bb6:4', 'Ab6:6 F6:2 Db6:8',
    'Eb7:4 C7:4 Ab6:4 C7:4', 'Bb6:6 G6:2 Eb7:8', 'F6:4 Ab6:4 Db7:4 C7:4', 'Bb6:8 G6:4 Eb6:4'),
  hookB: bars('Ab6:3 C7:3 Eb7:2 Ab7:4 G7:4', 'G7:3 Eb7:3 Bb6:2 Eb7:8', 'C7:3 F7:3 Ab7:2 G7:4 F7:4', 'F7:6 Db7:2 Ab6:8',
    'C7:3 Eb7:3 Ab7:2 G7:4 Eb7:4', 'Bb6:3 Eb7:3 G7:2 Bb7:8', 'Ab7:3 F7:3 Db7:2 F7:4 Ab7:4', 'G7:8 Bb6:4 Eb7:4'),
  extra: { horn: ['horn', 'hold', 0.3] },
});

const springs = hard({
  name: 'springs', bpm: 155, voice: 'sitar', arp: 'marimba', bass: 'off',
  kick: 'X', drums: 0.8, intro: 'kick', introBeat: 'X..X..X.X..X..X.', build: 'kick', beat: 'X..XZ.X.X..XZ.X.', fill: 'X..XZ.XXX.XXZXXX',
  chart: ['F#m', 'B', 'F#m', 'E', 'F#m', 'B', 'D', 'E'],
  hookA: bars('F#6:3 A6:3 C#7:2 B6:3 A6:3 F#6:2', 'D#6:3 F#6:3 B6:2 A6:3 F#6:3 D#6:2', 'C#7:3 B6:3 A6:2 F#6:3 E6:3 C#6:2', 'B5:4 E6:4 G#6:8',
    'F#6:3 A6:3 C#7:2 B6:3 A6:3 F#6:2', 'D#6:3 F#6:3 B6:2 A6:3 F#6:3 D#6:2', 'D6:3 F#6:3 A6:2 D7:3 C#7:3 A6:2', 'B6:8 G#6:4 E6:4'),
  hookB: bars('A6:2 C#7:2 F#7:4 E7:2 C#7:2 A6:4', 'B6:2 D#7:2 F#7:4 E7:2 D#7:2 B6:4', 'C#7:2 F#7:2 A7:4 G#7:2 F#7:2 C#7:4', 'B6:4 E7:4 G#7:8',
    'A6:2 C#7:2 F#7:4 E7:2 C#7:2 A6:4', 'B6:2 D#7:2 F#7:4 E7:2 D#7:2 B6:4', 'D7:2 F#7:2 A7:4 G#7:2 F#7:2 D7:4', 'E7:8 B6:8'),
  raw: ['R:3 R:3 F:2 O:3 R:3 M:2', 'L:2 R:2 F:2 R:2 O:2 R:2 M:4'],
  extra: { koto: ['koto', 'arp', 0.3] },
});

const peak = hard({
  name: 'peak', bpm: 165, voice: 'glock', voiceShift: 0, voiceGain: 0.4, arp: 'celesta', bass: 'off',
  kick: 'X', form: 'coldopen', build: 'snare', beat: 'X.hhZhhhX.hhZhhh', fill: 'X.hhZhhhXXXXZZZZ',
  chart: ['Am', 'Em', 'F', 'C', 'Am', 'Em', 'Dm', 'E'],
  hookA: bars('E7:2 C7:2 A6:2 C7:2 E7:2 A7:2 G7:4', 'B6:2 G6:2 E6:2 G6:2 B6:2 E7:2 D7:4', 'C7:2 A6:2 F6:2 A6:2 C7:2 F7:2 E7:4', 'G6:4 C7:4 E7:8',
    'E7:2 C7:2 A6:2 C7:2 E7:2 A7:2 G7:4', 'B6:2 G6:2 E6:2 G6:2 B6:2 E7:2 D7:4', 'D7:2 F7:2 A7:2 F7:2 D7:2 A6:2 F6:4', 'G#6:4 B6:4 E7:8'),
  hookB: bars('A6:6 C7:2 E7:8', 'G7:6 E7:2 B6:8', 'A6:6 C7:2 F7:8', 'E7:6 D7:2 C7:8',
    'A7:4 G7:4 E7:4 C7:4', 'B6:4 E7:4 G7:4 B7:4', 'A7:4 F7:4 D7:4 F7:4', 'G#7:8 E7:8'),
  raw: ['O:2 R:2 O:2 F:2 R:2 M:2 R:4', 'R:4 F:2 O:2 r:2 M:2 R:4'],
  extra: { flute: ['flute', 'high', 0.3] },
});

const starfall = edm({
  name: 'starfall', bpm: 140, voice: 'chimes', style: 'future', pump: 0.35,
  beat: 'K..h..h.C..h..hK', fill: 'K..h..h.CSCSSSSS',
  chart: ['E', 'C#m', 'A', 'B', 'E', 'G#m', 'A', 'B'],
  hookA: bars('B6:2 r:1 B6:1 G#6:2 E6:2 B6:2 r:1 B6:1 C#7:4', 'G#6:2 r:1 G#6:1 E6:2 C#6:2 G#6:2 r:1 G#6:1 B6:4', 'A6:2 r:1 A6:1 E6:2 C#6:2 A6:2 r:1 A6:1 C#7:4', 'D#7:4 F#7:4 B7:8',
    'B6:2 r:1 B6:1 G#6:2 E6:2 B6:2 r:1 B6:1 C#7:4', 'G#6:2 r:1 G#6:1 D#6:2 B5:2 G#6:2 r:1 G#6:1 B6:4', 'C#7:2 E7:2 A7:4 G#7:2 E7:2 C#7:4', 'B6:8 D#7:4 F#7:4'),
  hookB: bars('G#7:4 F#7:4 E7:4 B6:4', 'C#7:4 E7:4 G#7:8', 'A7:4 G#7:4 E7:4 C#7:4', 'D#7:4 F#7:4 B7:8',
    'E7:3 G#7:3 B7:2 G#7:4 E7:4', 'D#7:3 G#7:3 B7:2 G#7:4 D#7:4', 'C#7:3 E7:3 A7:2 G#7:4 F#7:4', 'F#7:8 D#7:8'),
  extra: { vibes: ['vibes', 'arp', 0.3] },
});

// The queens' trial: a hardstyle waltz in three, the kick on one, claps on two and three.
const queen = hard({
  name: 'queen', bpm: 168, rows: 12, voice: 'violin', arp: 'harp', bass: 'waltz',
  kick: 'X', intro: 'solo', build: 'snare', beat: 'X...Z...Z...', fill: 'X...Z.X.ZXXX',
  chart: ['Em', 'C', 'Am', 'B7', 'Em', 'C', 'B7', 'Em'],
  hookA: bars('B5:4 E6:4 G6:4', 'G6:8 E6:4', 'A6:4 C7:4 E7:4', 'D#7:8 B6:4', 'G6:4 B6:4 E7:4', 'E7:4 D7:4 C7:4', 'B6:4 A6:4 F#6:4', 'E6:12'),
  hookB: bars('E7:4 G7:4 B7:4', 'C7:8 E7:4', 'A7:4 G7:4 E7:4', 'F#7:8 D#7:4', 'B6:4 E7:4 G7:4', 'G7:4 F#7:4 E7:4', 'D#7:4 F#7:4 A7:4', 'G7:12'),
  raw: ['R:4 O:2 R:2 F:4', 'M:4 R:2 O:2 L:4'],
  extra: { brass: ['brassStab', 'stab', 0.3] },
});

export const SONGS = { title, town, meadow, harbor, crag, forest, grove, ruins, cave, sky, hollow, boss, shrine, ridge, springs, peak, starfall, queen };

// Each town's evening version: the same song a touch slower, the lead handed to a piano (or the
// horn, for the warriors' town), the screech and the kicks pulled back a little.
const EVENING = { town: 'piano', harbor: 'piano', crag: 'horn', grove: 'piano' };
for (const [key, lead] of Object.entries(EVENING)) {
  const song = SONGS[key];
  SONGS[`${key}-night`] = {
    ...song,
    name: `${key}-night`,
    bpm: Math.round(song.bpm * 0.93),
    drums: (song.drums ?? 1) * 0.6,
    pump: 0.25,
    reverb: { ...song.reverb, wet: (song.reverb?.wet ?? 0.25) + 0.08 },
    tracks: Object.fromEntries(Object.entries(song.tracks).map(([k, tr]) => [k,
      k === 'lead' ? { ...tr, inst: lead, gain: tr.gain * 1.1, verb: (tr.verb ?? 0.3) + 0.1 }
        : k === 'screech' ? { ...tr, gain: tr.gain * 0.45 } : tr])),
  };
}

// Each field and town song's fight layer: the same song, bar for bar (so it loops in step with
// it), faded in on top while there's a fight on (music.js). Over the drops it adds hats and
// snares; where the song has no drums (the intro, the breakdown) it brings in the kick (each genre
// its own: EDM's is the four-on-the-floor, `fight` on the song), so a fight
// never goes quiet. Its bass comes up; the other parts stay in, silenced, so every section keeps
// its length.
const FIGHT_TOP = { 16: '..h.S.h...h.S.hh', 12: '..h.S...h.S.' };
const FIGHT_KICK = { 16: 'X.h.Z.h.X.h.Z.h.', 12: 'X...Z...Z...' };
const ownKick = (grid, k) => grid.replace(/X/g, k).replace(/Z/g, { X: 'Z', F: 'G', P: 'Y' }[k]);
for (const key of ['town', 'meadow', 'harbor', 'crag', 'forest', 'grove', 'ruins', 'cave', 'sky', 'hollow', 'shrine', 'ridge', 'springs', 'peak', 'starfall']) {
  const song = SONGS[key];
  const rows = song.rows ?? 16;
  SONGS[`${key}-fight`] = {
    ...song,
    name: `${key}-fight`,
    drums: 1,
    tracks: Object.fromEntries(Object.entries(song.tracks).map(([k, tr]) => [k, k === 'rb' || k === 'sub' || k === 'bass' ? { ...tr, gain: tr.gain * 1.2 } : { ...tr, gain: 0 }])),
    patterns: Object.fromEntries(Object.entries(song.patterns).map(([k, pat]) => [k, { ...pat, drums: pat.drums ? (song.fight?.top ?? FIGHT_TOP[rows]) : (song.fight?.kick ?? ownKick(FIGHT_KICK[rows], song.kick ?? 'X')) }])),
  };
}
