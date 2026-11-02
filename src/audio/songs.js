// The music: one song per area, every one built the way of the village's "Market Hop" (the one the
// player liked; the others, in many genres, sounded smeared and cluttered): a plucked or struck
// lead playing short notes, a hook with rests that bounces, a bouncy bass under a steady kick,
// chords off the beat. Each area has its own lead instrument, key, tempo, groove and opening.
// Built by `edm()` below on recorded instruments; studio.js renders them.
//
// The areas:
// - Title: "Tengu Rising", disco house (122), D major, a piano hook, flute in the opening.
// - Sprout Village: "Market Hop", future house (126), F major, a skipping pluck hook, bouncy bass.
// - Meadows: "Flower Run", house (124), G major, marimba over nylon-guitar chops.
// - Pastel Harbor: "Seabreeze", tropical house (118), B-flat major, kalimba, shakers.
// - Ember Crag: "Ember Strut", funky house (124), E minor, brass stabs, a house piano, funk bass.
// - Forest: "Mossy Groove", afro house (120), A minor, balafon, toms and shakers, pan flute.
// - Moonleaf Grove: "Moonleaf", deep house (118), F# minor, harp, violin, cello.
// - Ruins: "Old Stones", house (120), C minor, vibraphone over a house piano, bells.
// - Cave: "Glimmer", house (122), B minor, celesta, glockenspiel in the opening.
// - Sky: "Cloud Hop", disco house (126), A major, glockenspiel over rolling arpeggios.
// - The Hollow: "Root Funk", funky house (124), G minor, pizzicato strings, horns.
// - Bosses: "Tengu King", house (130), D minor, the village's pluck turned dark, brass, timpani.
// - Fox Shrine Path: "Lantern Night", house (120), the koto in the old in-scale, taiko toms.
// - Moonlit Ridge: "Night Drive", swung chill house (116), A-flat major, nylon guitar, piano.
// - Serpent Springs: "Serpent Bounce", house (124), E Dorian, a sitar hook.
// - Frozen Peak: "Snowfall", house (120), E minor, xylophone, celesta, chimes.
// - Starfall Heights: "Stargazer", house (124), E major, vibraphone, hand chimes.
// - The queens (trials and rematches): "Queen's Gauntlet", a waltz in G minor, harp and violin.
// - Moonlit Manor: "Midnight Waltz", a music-box waltz in C minor, celesta and glockenspiel; its
//   bosses "The Last Waltz", faster, pizzicato over brass.
// - Sunken Aquarium Palace: "Bubble Pop", tropical city pop in E-flat, vibraphone and kalimba;
//   its bosses "Undertow", F minor, marimba over brass.
// - Clockwork Carnival: "Calliope Swing", a fairground march in F, glockenspiel over brass; its
//   bosses "Overwound", a xylophone polka in D minor.
// - Star Observatory: "Clockwork Stars", baroque pop in A minor, harpsichord over celesta; its
//   bosses "Event Horizon", church organ and brass in C minor.
// - Candy Volcano: "Sugar Rush", Latin house in D, nylon guitar and trumpet; its bosses
//   "Eruption", brass stabs and timpani in B minor.
// - Dream Theatre: "Opening Night", swing in B-flat, clarinet over a walking bass and house piano;
//   its bosses "Showstopper", a big band in G minor, brass over timpani, a sax answering.
// - Sky Whale's Back: "Skyfarers", epic folk in D Dorian, a fiddle hook over taiko toms and a harp;
//   its bosses "Leviathan", E minor, fiddle and brass over driving taiko and timpani.
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
  clarinet: { sample: 'clarinet', rel: 0.15, gate: 0.92 },
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


// The song instruments: the recorded ones above, plus a few synths.
const E = {
  ...I,
  koto: { sample: 'koto', rel: 0.5, gain: 0.9 },
  chimes: { sample: 'hand_chimes', rel: 0.6, gain: 0.8 },
  vibes: { sample: 'vibraphone', rel: 0.6, gain: 0.8 },
  bells: { sample: 'tubular_bells', rel: 0.8, gain: 0.7 },
  kalimba: { sample: 'kalimba', rel: 0.4, gain: 0.8 },
  cello: { sample: 'cello', attack: 0.05, rel: 0.4 },
  // Leads that are plucked or struck: short notes that stop, so a hook never smears (the
  // village's pluck is the model the player picked).
  edmPluck: { synth: 'pluck', gain: 0.45, cut: 5000, ring: 0.25 },
  saw: { synth: 'hardlead', gain: 0.5, drive: 1.3, cut: 6500 },
  pianoLead: { sample: 'acoustic_grand_piano', rel: 0.3, gain: 0.85 },
  marimbaLead: { sample: 'marimba', rel: 0.25, gain: 0.9 },
  kalimbaLead: { sample: 'kalimba', rel: 0.3, gain: 0.9 },
  balafonLead: { sample: 'balafon', rel: 0.2, gain: 0.9 },
  harpLead: { sample: 'orchestral_harp', rel: 0.4, gain: 0.9 },
  vibesLead: { sample: 'vibraphone', rel: 0.35, gain: 0.85 },
  celestaLead: { sample: 'celesta', rel: 0.5 },
  glockLead: { sample: 'glockenspiel', rel: 0.4, gain: 0.6 },
  xyloLead: { sample: 'xylophone', rel: 0.2, gain: 0.8 },
  harpsiLead: { sample: 'harpsichord', rel: 0.3, gain: 0.85 },
  organLead: { sample: 'church_organ', rel: 0.2, gate: 0.85, gain: 0.7 },
  pizzLead: { sample: 'pizzicato_strings', rel: 0.2, gain: 0.95 },
  guitarLead: { sample: 'acoustic_guitar_nylon', rel: 0.3, gain: 0.9 },
  // Swing leads: clarinet and sax, tongued short so the hook swings rather than smears.
  clarinetLead: { sample: 'clarinet', rel: 0.12, gate: 0.8, gain: 0.95 },
  saxLead: { sample: 'saxophone', rel: 0.12, gate: 0.8, gain: 0.9 },
  // A folk fiddle: bowed short and bright.
  fiddleLead: { sample: 'violin', rel: 0.12, gate: 0.78, gain: 0.95 },
  kotoLead: { sample: 'koto', rel: 0.5 },
  sitarLead: { sample: 'sitar', rel: 0.4 },
  // The areas' own instruments, played short for intros and breakdowns.
  fluteStacc: { sample: 'flute', rel: 0.1, gate: 0.6 },
  violinStacc: { sample: 'violin', rel: 0.12, gate: 0.6 },
  // Chord parts: a house piano and nylon-guitar chops.
  pianoChord: { sample: 'acoustic_grand_piano', rel: 0.2, gain: 0.7 },
  guitarChop: { sample: 'acoustic_guitar_nylon', rel: 0.15, gain: 0.7, strum: 0.012 },
  riser: { synth: 'riser', gain: 0.6 },
};

// ---------- The EDM builder ----------
// Every song: an intro, a build (a riser and a roll), the drop on the first hook, a breakdown on
// the area's own instrument, the build again, the second drop on the anthem hook. The arranging
// rule (the player's ask: no clutter): one melody at a time, nothing doubles the lead, one chord
// bed, at most one extra colour. What makes each its own:
// { name, bpm, rows (16, or 12 for the waltz), swing, chart (8 bars), hookA, hookB (8 bars each),
//   lead (the drop's instrument), lead2 (the second drop's, if different), voice (the area's
//   instrument: intro and breakdown), voiceShift (-12), bass (BASS below), chords (CHORDS below,
//   or 'none'), arp (sixteenths in the second drop: 1, eighths: 2, none: 0),
//   beat, fill (one bar of drums each), intro ('solo' | 'arp' | 'drums' | 'kick' | 'perc'),
//   introBeat, perc, build ('snare' | 'stop' | 'kick' | 'tom'), kick (the kick letter, K or P),
//   form ('classic' | 'coldopen' | 'breakfirst'), pump, extra }.
const r2 = (s) => nm(rootIn(s, 2));
const BASS = {
  off: ['synbass', (s, len) => Array(len / 4).fill(`r:2 ${r2(s)}:2`).join(' ')],
  // The village's: root then octave, bouncing between the kicks.
  house: ['synbass', (s, len) => Array(len / 4).fill(`r:2 ${r2(s)}:1 ${nm(rootIn(s, 3))}:1`).join(' ')],
  // Disco: octaves in eighths.
  octaves: ['synbass', F.octaves(2)],
  // Funk: root, octave and fifth, syncopated.
  funk: ['synbass', (s) => `${r2(s)}:2 r:1 ${r2(s)}:1 ${nm(rootIn(s, 3))}:2 ${r2(s)}:2 r:2 ${r2(s)}:1 ${nm(rootIn(s, 2) + 7)}:1 ${nm(rootIn(s, 3))}:2 r:2`],
  waltz: ['synbass', (s) => `r:4 ${r2(s)}:4 ${r2(s)}:4`],
  // Swing: a walking bass in quarters, root, fifth, octave, fifth.
  walk: ['synbass', (s, len) => Array(len / 16).fill(`${r2(s)}:4 ${nm(rootIn(s, 2) + 7)}:4 ${nm(rootIn(s, 3))}:4 ${nm(rootIn(s, 2) + 7)}:4`).join(' ')],
};
const CHORDS = {
  stab: ['stab', (s, len) => (len === 12 ? `r:4 ${tones(s, 64)}:3 r:1 ${tones(s, 64)}:3 r:1` : F.offbeat(64)(s, len))],
  pad: ['pad', F.hold(60)],
  // The house piano: chords off the beat, pushed.
  piano: ['pianoChord', (s, len) => Array(len / 16).fill(`r:2 ${tones(s, 64)}:2 r:1 ${tones(s, 64)}:1 r:2 ${tones(s, 64)}:2 r:2 ${tones(s, 64)}:2 r:2`).join(' ')],
  // Nylon-guitar chops on the offbeats.
  guitar: ['guitarChop', F.offbeat(62)],
};
// A four-bar roll on `c`: every beat, every beat, every eighth, every sixteenth.
const rollOf = (c, rows) => bars(...[4, 4, 2, 1].map((step) => Array.from({ length: rows }, (_, i) => (i % step ? '.' : c)).join('')));
const first4 = (line) => bars(...line.split(' | ').slice(0, 4));
const X = {
  high: F.hold(72),
  arp: F.arp(67, 2),
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
  // (Between the chord bed and the melody by default, so it never tangles with the melody; a song
  // whose melody sits low or high moves it with `arpCenter`.)
  const arp = F.arp(o.arpCenter ?? 67, o.arp === 1 ? 1 : 2);
  const tracks = {
    // (A soft, short echo: louder, it rang each note on under the next one, a step away.)
    lead: { inst: o.lead ?? 'saw', gain: 0.5, verb: 0.25, echo: { rows: 3, fb: 0.12, wet: 0.07 } },
    voice: { inst: o.voice, gain: o.voiceGain ?? 0.5, pan: -0.15, verb: 0.35 },
    arp: { inst: o.arpInst ?? 'edmPluck', gain: 0.3, pan: 0.25, verb: 0.3, echo: { rows: 3, fb: 0.12, wet: 0.07 } },
    bass: { inst: bassInst, gain: 0.36, verb: 0, low: true },
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
    name: o.name, bpm: o.bpm, rows, swing: o.swing, inst: E, pump: o.pump ?? 0.4, drums: o.drums ?? 1, bright: 0.6, reverb: { room: 0.84, wet: 0.18 },
    fight: { top: hats, kick: o.beat },
    tracks,
    patterns,
    intro,
    order,
  };
}

// ---------- The songs ----------
// Every song is built the village's way (the one the player liked): a plucked or struck lead
// playing short notes, a hook with rests that bounces, a bouncy bass under a steady kick, and
// chords off the beat. Each area has its own lead instrument, key, tempo and groove.
const title = edm({
  name: 'title', bpm: 122, voice: 'fluteStacc', lead: 'pianoLead', bass: 'octaves', chords: 'stab',
  intro: 'solo', build: 'snare', beat: 'K.o.C.o.K.o.C.o.', fill: 'K.o.C.o.K.SSSSSS',
  chart: ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'G', 'A'],
  hookA: bars('F#6:3 A6:3 D7:2 C#7:3 A6:3 F#6:2', 'F#6:3 B6:3 D7:2 C#7:3 B6:3 F#6:2', 'G6:3 B6:3 D7:2 C#7:3 B6:3 G6:2', 'A6:4 C#7:4 E7:8',
    'F#6:3 A6:3 D7:2 C#7:3 A6:3 F#6:2', 'F#6:3 B6:3 D7:2 C#7:3 B6:3 F#6:2', 'B6:3 D7:3 G7:2 F#7:3 D7:3 B6:2', 'A6:6 E6:2 A6:8'),
  hookB: bars('D7:4 F#7:4 A6:4 D7:4', 'F#7:6 E7:2 D7:8', 'G7:4 B6:4 D7:4 G7:4', 'E7:6 C#7:2 A6:8', 'F#7:4 A7:4 F#7:4 D7:4', 'D7:6 C#7:2 B6:8', 'B6:4 D7:4 G7:4 F#7:4', 'E7:8 C#7:8'),
  extra: { glock: ['glock', 'arp', 0.22] },
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
  name: 'meadow', bpm: 124, voice: 'violinStacc', lead: 'marimbaLead', bass: 'house', chords: 'guitar',
  intro: 'arp', build: 'snare', beat: 'K.hhC.hhK.hhC.hh', fill: 'K.hhC.hhK.hhSSSS',
  chart: ['G', 'Em', 'C', 'D', 'G', 'Em', 'Am', 'D'],
  hookA: bars('G6:1 r:1 B6:1 r:1 D7:2 B6:2 G6:2 A6:2 B6:4', 'E6:1 r:1 G6:1 r:1 B6:2 G6:2 E6:2 F#6:2 G6:4', 'C6:1 r:1 E6:1 r:1 G6:2 E6:2 C6:2 D6:2 E6:4', 'F#6:2 A6:2 D7:4 C7:2 A6:2 F#6:4',
    'G6:1 r:1 B6:1 r:1 D7:2 B6:2 G6:2 A6:2 B6:4', 'E6:1 r:1 G6:1 r:1 B6:2 G6:2 E6:2 F#6:2 G6:4', 'A6:1 r:1 C7:1 r:1 E7:2 C7:2 A6:2 B6:2 C7:4', 'D7:6 F#6:2 A6:8'),
  hookB: bars('D7:4 B6:2 G6:2 D7:4 E7:4', 'G7:4 E7:2 B6:2 G6:8', 'E7:4 C7:2 G6:2 E7:4 G7:4', 'F#7:6 E7:2 D7:8', 'B6:4 D7:2 G7:2 F#7:4 D7:4', 'E7:4 G7:2 B6:2 E7:8', 'C7:4 E7:2 A7:2 G7:4 E7:4', 'D7:8 A6:8'),
});

const harbor = edm({
  name: 'harbor', bpm: 118, voice: 'fluteStacc', voiceShift: 0, lead: 'kalimbaLead', bass: 'off', chords: 'stab',
  intro: 'perc', perc: bars(...Array(4).fill('x.hwx.h.x.hwx.hw')), build: 'tom', beat: 'K.x.C.x.K.xxC.x.', fill: 'K.x.C.x.K.x.SSSS',
  chart: ['Bb', 'F', 'Gm', 'Eb', 'Bb', 'F', 'Eb', 'F'],
  hookA: bars('r:2 D5:2 F5:2 Bb5:2 r:2 A5:2 F5:4', 'r:2 C5:2 F5:2 A5:2 r:2 G5:2 F5:4', 'r:2 Bb4:2 D5:2 G5:2 r:2 F5:2 D5:4', 'Eb5:3 G5:3 Bb5:2 G5:8',
    'r:2 D5:2 F5:2 Bb5:2 r:2 A5:2 F5:4', 'r:2 C5:2 F5:2 A5:2 r:2 G5:2 F5:4', 'G5:2 Bb5:2 Eb6:2 D6:2 C6:2 Bb5:2 G5:4', 'A5:6 C6:2 F5:8'),
  hookB: bars('F5:3 Bb5:3 D6:2 C6:4 Bb5:4', 'A5:3 C6:3 F5:2 A5:4 C6:4', 'Bb5:3 D6:3 G5:2 Bb5:4 D6:4', 'Eb6:6 D6:2 Bb5:8', 'D6:3 C6:3 Bb5:2 F5:4 D5:4', 'C6:3 A5:3 F5:2 A5:4 C6:4', 'G5:3 Bb5:3 Eb6:2 D6:4 C6:4', 'C6:8 F5:8'),
  extra: { marimba: ['marimba', 'arp', 0.22] },
});

const crag = edm({
  name: 'crag', bpm: 124, voice: 'horn', lead: 'brassStab', bass: 'funk', chords: 'piano',
  intro: 'drums', build: 'kick', beat: 'K.hhC.hKK.hhC.hh', fill: 'K.hhC.hKK.KKCCCC',
  chart: ['Em', 'C', 'D', 'B7', 'Em', 'C', 'Am', 'B7'],
  hookA: bars('E5:2 E5:1 G5:1 B5:2 E6:2 r:2 D6:2 B5:4', 'E5:2 E5:1 G5:1 C6:2 E6:2 r:2 D6:2 C6:4', 'D5:2 D5:1 F#5:1 A5:2 D6:2 r:2 C6:2 A5:4', 'D#6:4 F#6:4 B5:8',
    'E5:2 E5:1 G5:1 B5:2 E6:2 r:2 D6:2 B5:4', 'E5:2 E5:1 G5:1 C6:2 E6:2 r:2 D6:2 C6:4', 'A5:2 A5:1 C6:1 E6:2 A6:2 r:2 G6:2 E6:4', 'F#6:6 D#6:2 B5:8'),
  hookB: bars('B5:4 E6:4 G6:4 F#6:4', 'E6:6 D6:2 C6:8', 'A5:4 D6:4 F#6:4 E6:4', 'D#6:6 F#6:2 B6:8', 'G6:4 F#6:4 E6:4 B5:4', 'C6:4 E6:4 G6:8', 'A6:4 G6:4 E6:4 C6:4', 'B5:8 D#6:8'),
  extra: { timp: ['timpani', 'timp', 0.35] },
});

const forest = edm({
  name: 'forest', arpCenter: 60, bpm: 120, voice: 'panflute', voiceShift: 0, lead: 'balafonLead', bass: 'off', chords: 'pad',
  intro: 'perc', perc: bars(...Array(4).fill('t..xt.x.t..xt.xx')), build: 'tom', beat: 'K..tC.t.K.t.Cxt.', fill: 'K..tC.t.K.tttttt',
  chart: ['Am', 'G', 'F', 'G', 'Am', 'G', 'F', 'E'],
  hookA: bars('A4:1 r:1 C5:1 r:1 E5:2 C5:2 A4:2 B4:2 C5:4', 'G4:1 r:1 B4:1 r:1 D5:2 B4:2 G4:2 A4:2 B4:4', 'F4:1 r:1 A4:1 r:1 C5:2 A4:2 F4:2 G4:2 A4:4', 'B4:2 D5:2 G5:4 F5:2 D5:2 B4:4',
    'A4:1 r:1 C5:1 r:1 E5:2 C5:2 A4:2 B4:2 C5:4', 'G4:1 r:1 B4:1 r:1 D5:2 B4:2 G4:2 A4:2 B4:4', 'A4:1 r:1 C5:1 r:1 F5:2 E5:2 C5:2 A4:2 C5:4', 'B4:6 G#4:2 E5:8'),
  hookB: bars('E5:4 A5:4 C6:4 B5:4', 'D5:4 G5:4 B5:8', 'C5:4 F5:4 A5:4 G5:4', 'B5:6 A5:2 G5:8', 'C6:4 B5:4 A5:4 E5:4', 'D5:4 G5:4 B5:4 D6:4', 'C6:4 A5:4 F5:4 A5:4', 'G#5:8 E5:8'),
  extra: { kalimba: ['kalimba', 'arp', 0.2] },
});

const grove = edm({
  name: 'grove', bpm: 118, voice: 'violinStacc', lead: 'harpLead', bass: 'house', chords: 'pad',
  intro: 'solo', form: 'breakfirst', build: 'stop', beat: 'K.h.C.h.K.hhC.h.', fill: 'K.h.C.h.K.hhSSSS',
  chart: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'Bm', 'C#'],
  hookA: bars('C#6:3 F#6:3 A6:2 G#6:3 F#6:3 C#6:2', 'D6:3 F#6:3 A6:2 F#6:3 E6:3 D6:2', 'C#6:3 E6:3 A6:2 G#6:3 E6:3 C#6:2', 'B5:4 E6:4 G#6:8',
    'C#6:3 F#6:3 A6:2 G#6:3 F#6:3 C#6:2', 'D6:3 F#6:3 A6:2 F#6:3 E6:3 D6:2', 'B5:3 D6:3 F#6:2 E6:3 D6:3 B5:2', 'F6:6 G#6:2 C#6:8'),
  hookB: bars('A6:6 G#6:2 F#6:8', 'F#6:6 E6:2 D6:8', 'E6:6 F#6:2 A6:8', 'G#6:6 F#6:2 E6:8', 'C#7:6 B6:2 A6:8', 'A6:6 F#6:2 D6:8', 'F#6:4 D6:4 B5:8', 'G#6:8 F6:8'),
  extra: { cello: ['cello', 'high', 0.22] },
});

const ruins = edm({
  name: 'ruins', arpCenter: 84, bpm: 120, voice: 'horn', lead: 'vibesLead', bass: 'octaves', chords: 'piano',
  intro: 'arp', build: 'snare', beat: 'K.h.C.hhK.hhC.h.', fill: 'K.h.C.hhK.hhSSSS',
  chart: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G'],
  hookA: bars('C5:2 C5:1 Eb5:1 G5:2 C6:2 r:2 Bb5:2 G5:4', 'C5:2 C5:1 Eb5:1 Ab5:2 C6:2 r:2 Bb5:2 Ab5:4', 'C5:2 C5:1 F5:1 Ab5:2 C6:2 r:2 Ab5:2 F5:4', 'G5:4 B5:4 D6:8',
    'C5:2 C5:1 Eb5:1 G5:2 C6:2 r:2 Bb5:2 G5:4', 'C5:2 C5:1 Eb5:1 Ab5:2 C6:2 r:2 Bb5:2 Ab5:4', 'D5:2 D5:1 F5:1 Bb5:2 D6:2 r:2 C6:2 Bb5:4', 'B5:6 G5:2 D5:8'),
  hookB: bars('G5:4 C6:4 Eb6:4 D6:4', 'C6:6 Bb5:2 Ab5:8', 'Ab5:4 C6:4 F6:4 Eb6:4', 'D6:6 B5:2 G5:8', 'Eb6:4 D6:4 C6:4 G5:4', 'Ab5:4 C6:4 Eb6:8', 'F6:4 D6:4 Bb5:4 D6:4', 'B5:8 D6:8'),
  extra: { bells: ['bells', 'root5', 0.22] },
});

const cave = edm({
  name: 'cave', bpm: 122, voice: 'glock', voiceShift: 0, voiceGain: 0.4, lead: 'celestaLead', bass: 'house', chords: 'stab',
  intro: 'arp', build: 'stop', beat: 'K..hC..hK..hC.hh', fill: 'K..hC..hK..hSSSS',
  chart: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'],
  hookA: bars('r:1 F#6:1 B6:2 r:1 D7:1 C#7:2 B6:2 F#6:2 D6:4', 'r:1 G6:1 B6:2 r:1 D7:1 C#7:2 B6:2 G6:2 D6:4', 'r:1 F#6:1 A6:2 r:1 D7:1 C#7:2 A6:2 F#6:2 D6:4', 'E6:4 A6:4 C#7:8',
    'r:1 F#6:1 B6:2 r:1 D7:1 C#7:2 B6:2 F#6:2 D6:4', 'r:1 G6:1 B6:2 r:1 D7:1 C#7:2 B6:2 G6:2 D6:4', 'r:1 G6:1 B6:2 r:1 E7:1 D7:2 B6:2 G6:2 E6:4', 'A#6:6 C#7:2 F#6:8'),
  hookB: bars('D7:4 C#7:4 B6:8', 'B6:4 A6:4 G6:8', 'A6:4 F#6:4 D7:8', 'C#7:4 E7:4 A6:8', 'F#7:4 E7:4 D7:8', 'D7:4 B6:4 G6:8', 'G7:4 E7:4 B6:8', 'A#6:8 F#7:8'),
  extra: { vibes: ['vibes', 'arp', 0.2] },
});

const sky = edm({
  name: 'sky', bpm: 126, voice: 'fluteStacc', lead: 'glockLead', bass: 'octaves', chords: 'stab', arp: 1,
  intro: 'arp', build: 'snare', beat: 'K.oxC.oxK.oxC.ox', fill: 'K.oxC.oxSSSSSSSS',
  chart: ['A', 'E', 'F#m', 'D', 'A', 'E', 'D', 'E'],
  hookA: bars('A6:1 r:1 C#7:1 r:1 E7:2 C#7:2 A6:2 B6:2 C#7:4', 'G#6:1 r:1 B6:1 r:1 E7:2 B6:2 G#6:2 A6:2 B6:4', 'F#6:1 r:1 A6:1 r:1 C#7:2 A6:2 F#6:2 G#6:2 A6:4', 'D7:2 F#7:2 A7:4 G#7:2 F#7:2 D7:4',
    'A6:1 r:1 C#7:1 r:1 E7:2 C#7:2 A6:2 B6:2 C#7:4', 'G#6:1 r:1 B6:1 r:1 E7:2 B6:2 G#6:2 A6:2 B6:4', 'F#7:1 r:1 A7:1 r:1 D7:2 F#7:2 A7:2 G#7:2 F#7:4', 'E7:8 B6:8'),
  hookB: bars('E7:8 C#7:8', 'B6:8 E7:8', 'C#7:8 A6:8', 'F#7:6 E7:2 D7:8', 'A7:8 E7:8', 'G#7:8 B7:8', 'F#7:4 A7:4 D7:8', 'E7:16'),
});

const hollow = edm({
  name: 'hollow', arpCenter: 84, bpm: 124, voice: 'horn', lead: 'pizzLead', bass: 'funk', chords: 'stab',
  form: 'coldopen', build: 'kick', beat: 'K.hhC.h.KKhhC.h.', fill: 'K.hhC.h.KKKKCCCC',
  chart: ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Eb', 'F', 'D'],
  hookA: bars('G4:3 Bb4:3 D5:2 C5:3 Bb4:3 G4:2', 'G4:3 Bb4:3 Eb5:2 D5:3 Bb4:3 G4:2', 'G4:3 C5:3 Eb5:2 D5:3 C5:3 G4:2', 'F#4:4 A4:4 D5:8',
    'G4:3 Bb4:3 D5:2 C5:3 Bb4:3 G4:2', 'G4:3 Bb4:3 Eb5:2 D5:3 Bb4:3 G4:2', 'A4:3 C5:3 F5:2 Eb5:3 C5:3 A4:2', 'D5:6 C5:2 A4:8'),
  hookB: bars('D5:4 G5:4 Bb5:4 A5:4', 'G5:6 F5:2 Eb5:8', 'Eb5:4 G5:4 C6:4 Bb5:4', 'A5:6 F#5:2 D5:8', 'Bb5:4 A5:4 G5:4 D5:4', 'G5:4 Bb5:4 Eb6:8', 'C6:4 A5:4 F5:4 A5:4', 'F#5:8 D5:8'),
  extra: { timp: ['timpani', 'timp', 0.35] },
});

const boss = edm({
  name: 'boss', bpm: 130, voice: 'brass', lead: 'edmPluck', lead2: 'saw', bass: 'house', chords: 'stab',
  intro: 'drums', build: 'kick', beat: 'K.h.C.hKK.h.C.hK', fill: 'K.h.C.hKK.KKCCCC',
  chart: ['Dm', 'Bb', 'F', 'C', 'Dm', 'Bb', 'Gm', 'A'],
  hookA: bars('A5:2 D6:2 r:1 F6:1 E6:2 D6:2 r:1 A5:1 D6:4', 'Bb5:2 D6:2 r:1 F6:1 E6:2 D6:2 r:1 Bb5:1 F6:4', 'A5:2 C6:2 r:1 F6:1 E6:2 C6:2 r:1 A5:1 C6:4', 'E6:4 D6:2 C6:2 G5:8',
    'A5:2 D6:2 r:1 F6:1 E6:2 D6:2 r:1 A5:1 D6:4', 'Bb5:2 D6:2 r:1 F6:1 E6:2 D6:2 r:1 Bb5:1 F6:4', 'D6:2 G6:2 r:1 Bb6:1 A6:2 G6:2 r:1 D6:1 Bb6:4', 'C#7:6 A6:2 E6:8'),
  hookB: bars('D7:4 F7:4 A6:4 D7:4', 'F7:6 E7:2 D7:8', 'C7:4 F7:4 A7:4 G7:4', 'E7:6 D7:2 C7:8', 'A7:4 F7:4 D7:4 F7:4', 'Bb7:6 A7:2 F7:8', 'G7:4 D7:4 Bb6:4 D7:4', 'C#7:8 E7:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

const shrine = edm({
  name: 'shrine', bpm: 120, voice: 'panflute', voiceShift: 0, lead: 'kotoLead', bass: 'off', chords: 'stab',
  intro: 'perc', perc: bars(...Array(4).fill('t.t...w.t.tt..ww')), build: 'tom', beat: 'K.t.C.t.K.ttC.t.', fill: 'K.w.C.w.KwKwCwww',
  chart: ['Dm', 'Bb', 'Am', 'Dm', 'Gm', 'Bb', 'Am', 'A'],
  hookA: bars('D5:2 E5:1 F5:1 A5:2 Bb5:2 r:2 A5:2 F5:4', 'D5:2 F5:1 A5:1 Bb5:2 D6:2 r:2 A5:2 Bb5:4', 'E5:2 F5:1 A5:1 E6:2 D6:2 r:2 Bb5:2 A5:4', 'D6:4 A5:4 D5:8',
    'G5:2 A5:1 Bb5:1 D6:2 F6:2 r:2 D6:2 Bb5:4', 'F5:2 Bb5:1 D6:1 F6:2 E6:2 r:2 D6:2 Bb5:4', 'E6:4 D6:2 Bb5:2 A5:4 E5:4', 'A5:4 Bb5:4 A5:8'),
  hookB: bars('A5:4 D6:4 E6:4 F6:4', 'F6:6 E6:2 D6:8', 'E6:4 F6:4 A6:4 E6:4', 'D6:8 A5:8', 'G5:4 Bb5:4 D6:4 F6:4', 'F6:4 D6:4 Bb5:8', 'Bb5:4 A5:4 F5:4 E5:4', 'A5:16'),
  extra: { bells: ['bells', 'root5', 0.2] },
});

const ridge = edm({
  name: 'ridge', bpm: 116, swing: 0.55, voice: 'piano', voiceShift: 0, lead: 'guitarLead', bass: 'octaves', chords: 'pad',
  intro: 'solo', form: 'breakfirst', build: 'stop', beat: 'K.h.C.h.K.h.C.hh', fill: 'K.h.C.h.K.h.SSSS',
  chart: ['Ab', 'Fm', 'Db', 'Eb', 'Ab', 'Fm', 'Db', 'Eb'],
  hookA: bars('r:2 C5:2 Eb5:2 Ab5:2 r:2 G5:2 Eb5:4', 'r:2 C5:2 F5:2 Ab5:2 r:2 G5:2 F5:4', 'r:2 Db5:2 F5:2 Ab5:2 r:2 F5:2 Db5:4', 'Eb5:3 G5:3 Bb5:2 Eb6:8',
    'r:2 C5:2 Eb5:2 Ab5:2 r:2 G5:2 Eb5:4', 'r:2 C5:2 F5:2 Ab5:2 r:2 G5:2 F5:4', 'F5:2 Ab5:2 Db6:2 C6:2 Bb5:2 Ab5:2 F5:4', 'G5:6 Bb5:2 Eb5:8'),
  hookB: bars('C6:4 Eb6:4 Ab5:8', 'C6:6 Bb5:2 Ab5:8', 'Ab5:4 Db6:4 F6:8', 'Eb6:6 Db6:2 Bb5:8', 'Ab5:4 C6:4 Eb6:4 C6:4', 'F6:6 Eb6:2 C6:8', 'Db6:4 F6:4 Ab5:8', 'G5:8 Bb5:8'),
});

const springs = edm({
  name: 'springs', bpm: 124, voice: 'sitar', voiceShift: 0, lead: 'sitarLead', bass: 'house', chords: 'stab',
  intro: 'kick', build: 'kick', beat: 'K.hKC.h.K.hKC.h.', fill: 'K.hKC.h.KKKKCCCC',
  chart: ['Em', 'A', 'Em', 'D', 'Em', 'A', 'C', 'D'],
  hookA: bars('E5:2 E5:1 G5:1 A5:2 B5:2 r:2 A5:2 G5:4', 'E5:2 E5:1 A5:1 C#6:2 B5:2 r:2 A5:2 E5:4', 'B5:2 B5:1 A5:1 G5:2 E5:2 r:2 G5:2 A5:4', 'F#5:4 A5:4 D6:8',
    'E5:2 E5:1 G5:1 A5:2 B5:2 r:2 A5:2 G5:4', 'E5:2 E5:1 A5:1 C#6:2 B5:2 r:2 A5:2 E5:4', 'C6:2 C6:1 B5:1 G5:2 E5:2 r:2 G5:2 C6:4', 'B5:6 A5:2 F#5:8'),
  hookB: bars('B5:4 E6:4 B5:4 G5:4', 'C#6:6 B5:2 A5:8', 'G5:4 B5:4 E6:4 D6:4', 'D6:6 C#6:2 A5:8', 'E6:4 D6:4 B5:4 G5:4', 'E6:4 C#6:4 A5:8', 'G5:4 C6:4 E6:4 C6:4', 'F#5:8 D6:8'),
  extra: { koto: ['koto', 'arp', 0.2] },
});

const peak = edm({
  name: 'peak', bpm: 120, voice: 'celesta', lead: 'xyloLead', bass: 'off', chords: 'pad',
  form: 'coldopen', build: 'snare', beat: 'K.h.C.h.K.h.C.hh', fill: 'K.h.C.h.K.h.SSSS',
  chart: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'],
  hookA: bars('E6:3 G6:3 B6:2 A6:3 G6:3 E6:2', 'E6:3 G6:3 C7:2 B6:3 G6:3 E6:2', 'D6:3 G6:3 B6:2 A6:3 G6:3 D6:2', 'F#6:4 A6:4 D7:8',
    'E6:3 G6:3 B6:2 A6:3 G6:3 E6:2', 'E6:3 G6:3 C7:2 B6:3 G6:3 E6:2', 'C6:3 E6:3 A6:2 G6:3 E6:3 C6:2', 'D#6:6 F#6:2 B6:8'),
  hookB: bars('B6:8 G6:8', 'C7:8 E7:8', 'D7:8 B6:8', 'A6:6 F#6:2 D6:8', 'E7:4 D7:4 B6:8', 'G7:4 E7:4 C7:8', 'A6:4 C7:4 E7:8', 'D#7:8 B6:8'),
  extra: { chimes: ['chimes', 'root5', 0.2] },
});

const starfall = edm({
  name: 'starfall', arpCenter: 60, bpm: 124, voice: 'chimes', voiceShift: 0, lead: 'vibesLead', bass: 'house', chords: 'stab',
  intro: 'arp', build: 'stop', beat: 'K.o.C.o.K.o.C.oo', fill: 'K.o.C.o.K.o.SSSS',
  chart: ['E', 'C#m', 'A', 'B', 'E', 'G#m', 'A', 'B'],
  hookA: bars('B4:2 E5:2 r:1 G#5:1 F#5:2 E5:2 r:1 B4:1 E5:4', 'C#5:2 E5:2 r:1 G#5:1 F#5:2 E5:2 r:1 C#5:1 G#5:4', 'C#5:2 E5:2 r:1 A5:1 G#5:2 E5:2 r:1 C#5:1 A5:4', 'B5:4 A5:2 G#5:2 F#5:8',
    'B4:2 E5:2 r:1 G#5:1 F#5:2 E5:2 r:1 B4:1 E5:4', 'B4:2 D#5:2 r:1 G#5:1 F#5:2 D#5:2 r:1 B4:1 G#5:4', 'E5:2 A5:2 r:1 C#6:1 B5:2 A5:2 r:1 E5:1 C#6:4', 'D#6:6 B5:2 F#5:8'),
  hookB: bars('G#5:4 B5:4 E6:4 D#6:4', 'E6:6 C#6:2 G#5:8', 'A5:4 C#6:4 E6:4 C#6:4', 'D#6:6 F#6:2 B5:8', 'B5:4 E6:4 G#6:4 F#6:4', 'D#6:6 B5:2 G#5:8', 'C#6:4 E6:4 A6:8', 'F#6:8 D#6:8'),
  extra: { glock: ['glock', 'arp', 0.2] },
});

// The queens' trial: a waltz in three, the kick on one, claps on two and three, the harp leading.
const queen = edm({
  name: 'queen', bpm: 150, rows: 12, voice: 'violinStacc', lead: 'harpLead', bass: 'waltz', chords: 'stab',
  intro: 'solo', build: 'snare', beat: 'K...c...c...', fill: 'K...c.K.cccc',
  chart: ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Eb', 'D', 'Gm'],
  hookA: bars('D6:4 G6:4 Bb6:4', 'Bb6:8 G6:4', 'C7:4 Eb7:4 G7:4', 'F#7:8 D7:4', 'Bb6:4 D7:4 G7:4', 'G7:4 F7:4 Eb7:4', 'D7:4 C7:4 A6:4', 'G6:12'),
  hookB: bars('D7:4 G7:4 Bb7:4', 'Eb7:8 G7:4', 'C7:4 Eb7:4 G7:4', 'A7:8 F#7:4', 'G7:4 F7:4 D7:4', 'Eb7:4 D7:4 C7:4', 'F#7:4 A7:4 D7:4', 'G7:12'),
});


// Moonlit Manor: "Midnight Waltz", a music-box waltz in C minor (156, three to the bar): celesta
// over a glockenspiel music box, a waltz bass, soft pads, little bells. Spooky, but it smiles.
const manor = edm({
  name: 'manor', bpm: 156, rows: 12, voice: 'glock', lead: 'celestaLead', bass: 'waltz', chords: 'pad',
  intro: 'solo', build: 'snare', beat: 'K...c.h.c.h.', fill: 'K...c.K.cccc',
  chart: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Db', 'G'],
  hookA: bars('G5:2 C6:2 Eb6:2 G6:4 Eb6:2', 'F6:2 Eb6:2 C6:2 Ab5:6', 'F5:2 Ab5:2 C6:2 F6:4 Eb6:2', 'D6:3 C6:1 B5:2 G5:6',
    'G5:2 C6:2 Eb6:2 G6:4 Ab6:2', 'G6:2 F6:2 Eb6:2 C6:6', 'Db6:2 F6:2 Ab6:2 G6:3 F6:1 Db6:2', 'B5:4 D6:4 G6:4'),
  hookB: bars('C7:4 G6:4 Eb6:4', 'Ab6:6 C7:2 Eb7:4', 'F6:4 Ab6:4 C7:4', 'B6:6 D7:2 G6:4', 'Eb7:4 D7:4 C7:4', 'Ab6:4 C7:4 Eb7:4', 'Db7:4 F7:4 Ab6:4', 'G6:6 B6:2 D7:4'),
  extra: { bells: ['bells', 'root5', 0.2] },
});

// The manor's bosses: "The Last Waltz", the same key whirled faster (172), a pizzicato lead over
// brass, the waltz bass driving, bells on the downbeats.
const manorboss = edm({
  name: 'manorboss', bpm: 172, rows: 12, voice: 'brass', lead: 'pizzLead', bass: 'waltz', chords: 'stab',
  intro: 'drums', build: 'snare', beat: 'K...c.K.c...', fill: 'K...c.K.cccc',
  chart: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G'],
  hookA: bars('C6:2 C6:2 G6:2 Eb6:4 D6:2', 'C6:2 Ab5:2 C6:2 Eb6:6', 'F6:2 F6:2 C7:2 Ab6:4 G6:2', 'F6:2 Eb6:2 D6:2 B5:6',
    'C6:2 C6:2 G6:2 Eb6:4 G6:2', 'Ab6:2 G6:2 F6:2 Eb6:6', 'D6:2 F6:2 Bb6:2 Ab6:4 F6:2', 'G6:4 B6:4 D7:4'),
  hookB: bars('G7:6 Eb7:6', 'Ab7:6 C7:6', 'F7:4 Ab7:4 F7:4', 'D7:6 B6:6', 'Eb7:4 G7:4 C7:4', 'Ab7:4 G7:4 Eb7:4', 'D7:4 F7:4 Bb7:4', 'B6:6 G6:6'),
  extra: { bells: ['bells', 'root5', 0.24] },
});

// The Sunken Aquarium Palace: "Bubble Pop", tropical city pop in E-flat (112), a vibraphone hook
// that bubbles up the chord, chimes, a kalimba rippling underneath.
const aquarium = edm({
  name: 'aquarium', bpm: 112, voice: 'chimes', lead: 'vibesLead', bass: 'octaves', chords: 'pad',
  intro: 'arp', build: 'snare', beat: 'K...h.C.K.h.C.h.', fill: 'K...h.C.K.K.CCCC',
  chart: ['Eb', 'Cm', 'Ab', 'Bb', 'Eb', 'Gm', 'Ab', 'Bb'],
  hookA: bars('Eb6:2 G6:2 Bb6:2 r:2 G6:2 Bb6:2 Eb7:4', 'C7:2 Bb6:2 G6:2 r:2 Eb6:4 G6:4', 'Ab6:2 C7:2 Eb7:2 r:2 C7:2 Ab6:2 F6:4', 'Bb6:4 D7:4 F7:4 D7:4',
    'Eb6:2 G6:2 Bb6:2 r:2 G6:2 Bb6:2 Eb7:4', 'D7:2 Bb6:2 G6:2 r:2 Bb6:4 D7:4', 'C7:2 Eb7:2 Ab7:2 r:2 G7:2 F7:2 Eb7:4', 'F7:6 D7:2 Bb6:8'),
  hookB: bars('G7:8 Eb7:8', 'C7:8 Eb7:8', 'Ab6:8 C7:8', 'D7:8 F7:8', 'Bb6:8 Eb7:8', 'G7:8 D7:8', 'Eb7:4 F7:4 G7:8', 'F7:16'),
  extra: { kalimba: ['kalimba', 'arp', 0.2] },
});

// The palace's bosses: "Undertow", F minor (128), a marimba hook over brass and a funk bass,
// timpani rolling in like waves.
const aquaboss = edm({
  name: 'aquaboss', bpm: 128, voice: 'brass', lead: 'marimbaLead', bass: 'funk', chords: 'stab',
  form: 'coldopen', build: 'kick', beat: 'K.hhC.h.KKhhC.h.', fill: 'K.hhC.h.KKKKCCCC',
  chart: ['Fm', 'Db', 'Bb', 'C', 'Fm', 'Db', 'Eb', 'C'],
  hookA: bars('F5:2 Ab5:2 C6:2 r:1 Db6:1 C6:2 Ab5:2 F5:4', 'F5:2 Ab5:2 Db6:2 r:1 F6:1 Eb6:2 Db6:2 Ab5:4', 'F5:2 Bb5:2 Db6:2 r:1 F6:1 Eb6:2 Db6:2 Bb5:4', 'E5:4 G5:4 C6:4 Bb5:4',
    'F5:2 Ab5:2 C6:2 r:1 Db6:1 C6:2 Ab5:2 F5:4', 'F5:2 Ab5:2 Db6:2 r:1 F6:1 Eb6:2 Db6:2 Ab5:4', 'G5:2 Bb5:2 Eb6:2 r:1 G6:1 F6:2 Eb6:2 Bb5:4', 'C6:6 Bb5:2 G5:4 E5:4'),
  hookB: bars('C7:4 Ab6:4 F6:4 Ab6:4', 'Db7:6 C7:2 Ab6:8', 'Bb6:4 Db7:4 F7:4 Db7:4', 'C7:6 Bb6:2 G6:8', 'Ab6:4 C7:4 F7:4 Eb7:4', 'Db7:4 F7:4 Ab7:8', 'G7:4 Eb7:4 Bb6:4 G6:4', 'E7:8 C7:8'),
  extra: { timp: ['timpani', 'timp', 0.35] },
});

// The Clockwork Carnival: "Calliope Swing", a swinging fairground march in F (132): a glockenspiel
// hook over brass, the calliope's oom-pah bass, an accordion rippling under it.
const carnival = edm({
  name: 'carnival', bpm: 132, voice: 'brass', lead: 'glockLead', bass: 'octaves', chords: 'stab',
  intro: 'perc', build: 'snare', beat: 'K.h.C.h.K.h.C.hh', fill: 'K.h.C.h.K.C.CCCC',
  chart: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C'],
  hookA: bars('C6:3 A5:1 F5:2 A5:2 C6:4 D6:2 C6:2', 'Bb5:3 G5:1 E5:2 G5:2 C6:8', 'A5:3 F5:1 D5:2 F5:2 A5:4 Bb5:2 A5:2', 'G5:4 Bb5:4 D6:4 F6:4',
    'C6:3 A5:1 F5:2 A5:2 C6:4 D6:2 C6:2', 'E6:3 C6:1 G5:2 C6:2 E6:4 F6:2 E6:2', 'D6:3 Bb5:1 F5:2 Bb5:2 D6:4 C6:2 Bb5:2', 'A5:4 G5:4 E5:4 C5:4'),
  hookB: bars('F6:6 E6:2 D6:8', 'E6:6 D6:2 C6:8', 'D6:4 F6:4 A6:8', 'G6:6 F6:2 D6:8', 'F6:4 A6:4 C7:8', 'Bb6:6 A6:2 G6:8', 'F6:4 D6:4 Bb5:8', 'C6:8 E6:8'),
  extra: { accordion: ['accordion', 'arp', 0.18] },
});

// The carnival's bosses: "Overwound", D minor (150), a xylophone polka driven hard over brass and
// timpani.
const carnivalboss = edm({
  name: 'carnivalboss', bpm: 150, voice: 'brass', lead: 'xyloLead', bass: 'house', chords: 'stab',
  intro: 'drums', build: 'kick', beat: 'K.C.K.C.K.C.K.CC', fill: 'K.C.K.C.KKCCCCCC',
  chart: ['Dm', 'A', 'Dm', 'A', 'Gm', 'Dm', 'A', 'Dm'],
  hookA: bars('D6:2 F6:2 A6:2 F6:2 D6:2 F6:2 A6:4', 'C#6:2 E6:2 A6:2 E6:2 C#6:2 E6:2 A6:4', 'D6:2 F6:2 A6:2 D7:2 C7:2 A6:2 F6:4', 'E6:2 G6:2 C#7:2 A6:2 G6:2 E6:2 C#6:4',
    'G6:2 Bb6:2 D7:2 Bb6:2 G6:2 Bb6:2 D7:4', 'F6:2 A6:2 D7:2 A6:2 F6:2 A6:2 D7:4', 'E6:2 C#6:2 A5:2 C#6:2 E6:2 G6:2 A6:4', 'D7:6 A6:2 D6:8'),
  hookB: bars('A6:4 D7:4 F7:4 E7:4', 'E7:6 D7:2 C#7:8', 'D7:4 F7:4 A7:4 G7:4', 'G7:6 F7:2 E7:8', 'Bb6:4 D7:4 G7:4 F7:4', 'F7:6 E7:2 D7:8', 'C#7:4 E7:4 A7:4 G7:4', 'F7:8 D7:8'),
  extra: { timp: ['timpani', 'timp', 0.35] },
});

// The Star Observatory: "Clockwork Stars", baroque pop in A minor (116): a harpsichord hook over
// celesta, pizzicato strings walking under it.
const observatory = edm({
  name: 'observatory', bpm: 116, voice: 'celesta', lead: 'harpsiLead', bass: 'octaves', chords: 'pad',
  intro: 'solo', build: 'snare', beat: 'K...h...C...h.h.', fill: 'K...h...C.C.CCCC',
  chart: ['Am', 'F', 'C', 'G', 'Am', 'Dm', 'E', 'Am'],
  hookA: bars('A5:2 C6:2 E6:2 A6:2 G6:2 E6:2 C6:4', 'F5:2 A5:2 C6:2 F6:2 E6:2 C6:2 A5:4', 'E5:2 G5:2 C6:2 E6:2 D6:2 C6:2 G5:4', 'D6:2 B5:2 G5:2 B5:2 D6:4 G6:4',
    'A5:2 C6:2 E6:2 A6:2 G6:2 E6:2 C6:4', 'D6:2 F6:2 A6:2 F6:2 D6:2 C6:2 A5:4', 'G#5:2 B5:2 E6:2 G#6:2 F6:2 E6:2 D6:4', 'C6:4 B5:4 A5:8'),
  hookB: bars('E7:4 C7:4 A6:8', 'F7:4 C7:4 A6:8', 'G7:4 E7:4 C7:8', 'D7:4 B6:4 G6:8', 'A6:4 C7:4 E7:8', 'F7:4 D7:4 A6:8', 'E7:4 G#6:4 B6:8', 'A6:16'),
  extra: { pizz: ['pizz', 'arp', 0.22] },
});

// The observatory's bosses: "Event Horizon", C minor (136), a church organ hook over brass and
// timpani, driving.
const observatoryboss = edm({
  name: 'observatoryboss', bpm: 136, voice: 'brass', lead: 'organLead', bass: 'house', chords: 'stab',
  form: 'coldopen', build: 'kick', beat: 'K.h.C.h.K.h.C.hK', fill: 'K.h.C.h.KKKKCCCC',
  chart: ['Cm', 'Ab', 'Eb', 'Bb', 'Cm', 'Ab', 'Fm', 'G'],
  hookA: bars('C5:2 Eb5:2 G5:2 C6:2 Bb5:2 G5:2 Eb5:4', 'Ab4:2 C5:2 Eb5:2 Ab5:2 G5:2 Eb5:2 C5:4', 'Eb5:2 G5:2 Bb5:2 Eb6:2 D6:2 Bb5:2 G5:4', 'D5:4 F5:4 Bb5:8',
    'C5:2 Eb5:2 G5:2 C6:2 Bb5:2 G5:2 Eb5:4', 'Ab4:2 C5:2 Eb5:2 Ab5:2 G5:2 Eb5:2 C5:4', 'F5:2 Ab5:2 C6:2 F6:2 Eb6:2 C6:2 Ab5:4', 'B5:4 D6:4 G6:8'),
  hookB: bars('G6:6 Eb6:2 C6:8', 'Ab6:6 Eb6:2 C6:8', 'Bb6:6 G6:2 Eb6:8', 'Bb6:6 F6:2 D6:8', 'C7:4 G6:4 Eb6:8', 'Ab6:4 Eb6:4 C6:8', 'F6:4 Ab6:4 C7:8', 'B6:8 G6:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

// The Candy Volcano: "Sugar Rush", Latin house in D (122): a nylon-guitar hook over trumpet stabs,
// marimba rippling under it.
const volcano = edm({
  name: 'volcano', bpm: 122, voice: 'trumpet', lead: 'guitarLead', bass: 'funk', chords: 'stab',
  intro: 'perc', build: 'tom', beat: 'K..hC.h.K.hhC.h.', fill: 'K..hC.h.KKt.tttt',
  chart: ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em', 'A'],
  hookA: bars('F#5:2 A5:2 D6:1 r:1 C#6:2 B5:2 A5:2 F#5:4', 'F#5:2 B5:2 D6:1 r:1 C#6:2 B5:2 F#5:2 D5:4', 'G5:2 B5:2 D6:1 r:1 E6:2 D6:2 B5:2 G5:4', 'A5:2 C#6:2 E6:1 r:1 D6:2 C#6:2 A5:4 r:2',
    'F#5:2 A5:2 D6:1 r:1 C#6:2 B5:2 A5:2 F#5:4', 'F#5:2 B5:2 D6:1 r:1 F#6:2 E6:2 D6:2 B5:4', 'E5:2 G5:2 B5:1 r:1 E6:2 D6:2 B5:2 G5:4', 'A5:4 C#6:4 E6:4 A6:4'),
  hookB: bars('A6:6 F#6:2 D6:8', 'B6:6 F#6:2 D6:8', 'G6:6 B6:2 D7:8', 'E6:6 A6:2 C#7:8', 'D7:4 A6:4 F#6:8', 'F#6:4 B6:4 D7:8', 'G6:4 E6:4 B5:8', 'A6:8 C#7:8'),
  extra: { marimba: ['marimba', 'arp', 0.2] },
});

// The volcano's bosses: "Eruption", B minor (138), brass stabs over a funk bass, timpani rolling.
const volcanoboss = edm({
  name: 'volcanoboss', bpm: 138, voice: 'brass', lead: 'brassStab', lead2: 'saw', bass: 'funk', chords: 'stab',
  intro: 'drums', build: 'kick', beat: 'K.hhC.h.KKhhC.hK', fill: 'K.hhC.h.KKKKCCCC',
  chart: ['Bm', 'G', 'D', 'A', 'Bm', 'G', 'Em', 'F#'],
  hookA: bars('B5:2 D6:2 F#6:2 r:2 E6:2 D6:2 B5:4', 'B5:2 D6:2 G6:2 r:2 F#6:2 D6:2 B5:4', 'A5:2 D6:2 F#6:2 r:2 E6:2 D6:2 A5:4', 'C#6:4 E6:4 A6:8',
    'B5:2 D6:2 F#6:2 r:2 E6:2 D6:2 B5:4', 'B5:2 D6:2 G6:2 r:2 B6:2 A6:2 G6:4', 'G5:2 B5:2 E6:2 r:2 D6:2 B5:2 G5:4', 'A#5:4 C#6:4 F#6:8'),
  hookB: bars('F#6:6 D6:2 B5:8', 'G6:6 D6:2 B5:8', 'F#6:6 A6:2 D7:8', 'E6:6 A6:2 C#7:8', 'B6:4 F#6:4 D6:8', 'G6:4 B6:4 D7:8', 'E6:4 G6:4 B6:8', 'F#6:8 A#6:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

// The Dream Theatre: "Opening Night", swing in B-flat (128): a clarinet hook over a walking bass
// and the house piano, a sax taking the second chorus.
const theatre = edm({
  name: 'theatre', bpm: 128, swing: 0.6, voice: 'clarinet', voiceShift: 0, lead: 'clarinetLead', lead2: 'saxLead', bass: 'walk', chords: 'piano',
  intro: 'solo', build: 'snare', beat: 'K.h.C.hhK.h.C.hh', fill: 'K.h.C.hhK.C.CCCC',
  chart: ['Bb', 'Gm', 'Cm', 'F', 'Bb', 'Eb', 'Cm', 'F'],
  hookA: bars('F5:2 D5:2 F5:2 Bb5:4 A5:2 Bb5:2 r:2', 'G5:2 D5:2 G5:2 Bb5:4 A5:2 G5:4', 'Eb5:2 G5:2 C6:3 Bb5:1 G5:2 Eb5:2 C5:4', 'F5:2 A5:2 C6:2 r:2 Eb6:4 D6:4',
    'D6:2 C6:2 Bb5:2 F5:2 G5:2 Bb5:2 D6:4', 'Eb6:2 D6:2 C6:2 Bb5:2 G5:4 Eb5:4', 'C5:2 Eb5:2 G5:2 C6:2 Bb5:2 A5:2 G5:4', 'F5:4 A5:4 C6:4 Eb6:4'),
  hookB: bars('Bb5:6 D6:2 F6:8', 'G5:6 Bb5:2 D6:8', 'G5:4 C6:4 Eb6:8', 'F5:4 A5:4 C6:4 Eb6:4', 'D6:6 F6:2 Bb6:8', 'Eb6:6 G6:2 Bb6:8', 'C6:4 Eb6:4 G6:8', 'F6:6 Eb6:2 D6:4 C6:4'),
  extra: { vibes: ['vibes', 'arp', 0.16] },
});

// The theatre's bosses: "Showstopper", G minor (140), a big band: brass hits over timpani and a
// walking bass, the sax answering in the second chorus.
const theatreboss = edm({
  name: 'theatreboss', bpm: 140, swing: 0.55, voice: 'brass', lead: 'brassStab', lead2: 'saxLead', bass: 'walk', chords: 'stab',
  form: 'coldopen', build: 'tom', beat: 'K.hhC.h.K.hhC.hK', fill: 'K.hhC.h.KKKKCCCC',
  chart: ['Gm', 'Eb', 'Cm', 'D', 'Gm', 'Bb', 'Cm', 'D'],
  hookA: bars('G5:2 Bb5:2 D6:2 r:2 C6:2 Bb5:2 G5:4', 'G5:2 Bb5:2 Eb6:2 r:2 D6:2 Bb5:2 G5:4', 'Eb5:2 G5:2 C6:2 r:2 Bb5:2 G5:2 Eb5:4', 'F#5:4 A5:4 D6:8',
    'G5:2 Bb5:2 D6:2 r:2 G6:2 F6:2 D6:4', 'F5:2 Bb5:2 D6:2 r:2 F6:2 D6:2 Bb5:4', 'C6:2 Eb6:2 G6:2 r:2 F6:2 Eb6:2 C6:4', 'D6:4 C6:4 A5:4 F#5:4'),
  hookB: bars('D6:6 Bb5:2 G5:8', 'Eb6:6 Bb5:2 G5:8', 'Eb6:6 G6:2 C7:8', 'D6:6 F#6:2 A6:8', 'G6:4 D6:4 Bb5:8', 'F6:4 Bb6:4 D7:8', 'Eb6:4 G6:4 C7:8', 'D7:8 F#6:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

// The Sky Whale's Back: "Skyfarers", epic folk in D Dorian (128): a fiddle hook over taiko toms,
// a harp rippling, nylon-guitar chops.
const skywhale = edm({
  name: 'skywhale', bpm: 128, voice: 'violinStacc', voiceShift: 0, lead: 'fiddleLead', bass: 'house', chords: 'guitar',
  intro: 'drums', build: 'tom', beat: 'K..tC.t.K.ttC.t.', fill: 'K.t.C.t.tttttttt',
  chart: ['Dm', 'C', 'G', 'Dm', 'F', 'C', 'G', 'A'],
  hookA: bars('D6:2 A5:2 D6:2 E6:2 F6:4 E6:2 D6:2', 'C6:2 G5:2 C6:2 D6:2 E6:4 D6:2 C6:2', 'B5:2 D6:2 G6:2 F6:2 E6:4 D6:4', 'D6:4 A5:2 F5:2 D5:8',
    'F5:2 A5:2 C6:2 F6:2 E6:2 C6:2 A5:4', 'G5:2 C6:2 E6:2 G6:2 F6:2 E6:2 C6:4', 'B5:2 D6:2 G6:4 A6:2 G6:2 D6:4', 'C#6:4 E6:4 A6:8'),
  hookB: bars('A6:6 F6:2 D6:8', 'G6:6 E6:2 C6:8', 'B6:6 G6:2 D6:8', 'A6:4 F6:4 D6:8', 'C7:6 A6:2 F6:8', 'G6:4 C7:4 E7:8', 'D7:4 B6:4 G6:8', 'C#7:8 E7:8'),
  extra: { harp: ['harp', 'arp', 0.18] },
});

// The whale's bosses: "Leviathan", E minor (142): the fiddle, then brass, over driving taiko and
// timpani.
const skywhaleboss = edm({
  name: 'skywhaleboss', bpm: 142, voice: 'horn', lead: 'fiddleLead', lead2: 'brassStab', bass: 'octaves', chords: 'pad',
  form: 'coldopen', build: 'tom', beat: 'K.ttC.t.K.ttC.tK', fill: 'K.ttC.t.tttttttt',
  chart: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'],
  hookA: bars('E6:2 G6:2 B6:2 r:2 A6:2 G6:2 E6:4', 'E6:2 G6:2 C7:2 r:2 B6:2 G6:2 E6:4', 'D6:2 G6:2 B6:2 r:2 A6:2 G6:2 D6:4', 'F#6:4 A6:4 D7:8',
    'E6:2 G6:2 B6:2 r:2 E7:2 D7:2 B6:4', 'C6:2 E6:2 G6:2 r:2 C7:2 B6:2 G6:4', 'A5:2 C6:2 E6:2 r:2 A6:2 G6:2 E6:4', 'D#6:4 F#6:4 B6:8'),
  hookB: bars('B5:6 G5:2 E5:8', 'C6:6 G5:2 E5:8', 'D6:6 B5:2 G5:8', 'D6:6 A5:2 F#5:8', 'E6:4 B5:4 G5:8', 'C6:4 E6:4 G6:8', 'A5:4 C6:4 E6:8', 'D#6:8 F#6:8'),
  extra: { timp: ['timpani', 'timp', 0.4] },
});

export const SONGS = { title, town, meadow, harbor, crag, forest, grove, ruins, cave, sky, hollow, boss, shrine, ridge, springs, peak, starfall, queen, manor, manorboss, aquarium, aquaboss, carnival, carnivalboss, observatory, observatoryboss, volcano, volcanoboss, theatre, theatreboss, skywhale, skywhaleboss };

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
for (const key of ['town', 'meadow', 'harbor', 'crag', 'forest', 'grove', 'ruins', 'cave', 'sky', 'hollow', 'shrine', 'ridge', 'springs', 'peak', 'starfall', 'manor', 'aquarium', 'carnival', 'observatory', 'volcano', 'theatre', 'skywhale']) {
  const song = SONGS[key];
  SONGS[`${key}-fight`] = {
    ...song,
    name: `${key}-fight`,
    drums: 1,
    tracks: Object.fromEntries(Object.entries(song.tracks).map(([k, tr]) => [k, k === 'bass' ? { ...tr, gain: tr.gain * 1.2 } : { ...tr, gain: 0 }])),
    patterns: Object.fromEntries(Object.entries(song.patterns).map(([k, pat]) => [k, { ...pat, drums: pat.drums ? song.fight.top : song.fight.kick }])),
  };
}
