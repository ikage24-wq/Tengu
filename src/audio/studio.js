// The studio: renders a song (songs.js) into a stereo loop, mixing instrument voices and modern
// synths and drums, all made in code, then a reverb, a gentle
// sidechain pump under the kick, and a level that's the same for every song. Pure JS, so it runs
// in the worker, on the page, or in node tests.
//
// A song: { name, bpm, swing (0.5 straight), rows (per bar: 16 in 4/4, 12 in 3/4 or 6/8),
//   inst: { name: instrument }, tracks: { name: { inst, gain, pan, verb (reverb send), echo: { rows, fb, wet }, delay (rows late) } },
//   patterns: { A: { track: notes, drums: grid } }, intro: [...], order: [...],
//   reverb: { room, damp, wet }, pump (0-1), transpose, bright (presence, 0-1), drums (kit level),
//   level, raw (true: leave the level as mixed, for measuring) }.
// Notes: `E5:4` (note and length in rows), `C4+E4+G4:8` (a chord), `r:4` rest, `~:4` hold the last
// note longer, `@name` switch instrument, `v12` volume 0-15 until changed, `|` bar marks (checked:
// every bar must add up to a whole bar).
// Drums, one character per row: K kick, S snare, c clap, h hat, o open hat, t tom, x shaker,
// w woodblock, * crash, C kick + clap, O kick + open hat, B kick + snare, H kick + hat, . nothing.
// Instruments: { sample: 'flute', gain, attack, rel, gate } for an instrument voice (VOICES below,
// named after the General MIDI instrument each stands in for), or
// { synth: 'pluck' | 'pad' | 'sub' | 'lead' | 'bell' | 'stab' | 'bass', gain, gate, cut } for a synth.

const TAU = Math.PI * 2;
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function midiOf(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
}
export const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);

// A small seeded random (the same song always renders the same).
export function rng(seed = 1) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// ---------- Instrument voices ----------
// Plays one note of an instrument voice into `out` (mono) from sample `s0`. Every voice is a synth
// (SYNTHS below) with its own settings and a level matching the rest of the mix: the music has no
// recordings in it. (`bank` is unused, kept so callers stay the same.)
export function sampleNote(out, s0, sr, bank, inst, midi, dur, gain = 1) {
  const v = VOICES[inst.sample];
  if (!v) return;
  const o = { ...v, attack: inst.attack ?? v.attack, rel: inst.rel ?? v.rel };
  const x = SYNTHS[v.synth](midi, dur * (inst.gate ?? 1), sr, rng(midi * 7919 + s0), o);
  const g = gain * (inst.gain ?? 1) * v.level;
  const n = Math.min(x.length, out.length - s0);
  for (let i = 0; i < n; i++) out[s0 + i] += x[i] * g * (i >= n - 64 ? (n - i) / 64 : 1);
}

// ---------- Synths ----------
const blep = (t, dt) => {
  if (t < dt) {
    t /= dt;
    return t + t - t * t - 1;
  }
  if (t > 1 - dt) {
    t = (t - 1) / dt;
    return t * t + t + t + 1;
  }
  return 0;
};
// A state-variable lowpass whose cutoff follows `cut(t)`.
function lowpass(x, sr, cut, q = 0.8) {
  let lo = 0;
  let bp = 0;
  const k = 1 / q;
  for (let i = 0; i < x.length; i++) {
    const fc = Math.min(cut(i / sr), sr / 6);
    const f = 2 * Math.sin((Math.PI * fc) / sr);
    for (let o = 0; o < 2; o++) {
      const hi = x[i] - lo - k * bp;
      bp += f * hi;
      lo += f * bp;
    }
    x[i] = lo;
  }
  return x;
}
// An attack, a hold for the note, and a release after it.
function env(x, sr, d, attack, rel) {
  for (let i = 0; i < x.length; i++) {
    const t = i / sr;
    x[i] *= Math.min(1, t / Math.max(attack, 0.001)) * (t < d ? 1 : Math.exp((-(t - d) / Math.max(rel, 0.01)) * 2.5));
  }
  return x;
}
// Detuned saws (`voices` of them).
function saws(f, n, sr, voices, detune, rand) {
  const x = new Float32Array(n);
  const ph = Array.from({ length: voices }, () => rand());
  const fr = Array.from({ length: voices }, (_, v) => f * (1 + (detune / 100) * (voices > 1 ? (v / (voices - 1)) * 2 - 1 : 0)));
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let v = 0; v < voices; v++) {
      const dt = fr[v] / sr;
      ph[v] += dt;
      if (ph[v] >= 1) ph[v] -= 1;
      s += 2 * ph[v] - 1 - blep(ph[v], dt);
    }
    x[i] = s / Math.sqrt(voices);
  }
  return x;
}
// Each synth: (midi, held seconds, sr, rand, inst) -> mono samples.
export const SYNTHS = {
  // A bright pluck (saw and square through a fast-closing filter): the modern lead and arps.
  pluck(m, d, sr, rand, o) {
    const f = hz(m);
    const n = Math.round((d + 0.35) * sr);
    const x = saws(f, n, sr, 3, 0.4, rand);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      ph = (ph + (f * 2) / sr) % 1;
      x[i] += ph < 0.5 ? 0.25 : -0.25;
    }
    const top = o.cut ?? 5000;
    lowpass(x, sr, (t) => 400 + top * Math.exp(-t / (o.decay ?? 0.12)), 1.1);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] *= Math.min(1, t / 0.003) * Math.exp(-t / (o.ring ?? 0.4)) * (t < d ? 1 : Math.exp(-(t - d) / 0.05));
    }
    return x;
  },
  // A wide supersaw pad, softly filtered, swelling in.
  pad(m, d, sr, rand, o) {
    const n = Math.round((d + 0.5) * sr);
    const x = saws(hz(m), n, sr, 5, 0.35, rand);
    lowpass(x, sr, (t) => (o.cut ?? 1500) + 400 * Math.sin(t * 1.7), 0.7);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] *= Math.min(1, t / (o.attack ?? 0.12)) * (t < d ? 1 : Math.exp(-(t - d) / 0.18)) * 0.6;
    }
    return x;
  },
  // A clean sub bass (sine with a touch of its octave).
  sub(m, d, sr) {
    const f = hz(m);
    const n = Math.round((d + 0.06) * sr);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] = (Math.sin(TAU * f * t) + 0.25 * Math.sin(TAU * 2 * f * t)) * Math.min(1, t / 0.004) * (t < d ? 1 : Math.exp(-(t - d) / 0.02));
    }
    return x;
  },
  // A punchy synth bass (saw through a filter that snaps shut, over a sine).
  bass(m, d, sr, rand, o) {
    const f = hz(m);
    const n = Math.round((d + 0.08) * sr);
    const x = saws(f, n, sr, 2, 0.3, rand);
    lowpass(x, sr, (t) => 180 + (o.cut ?? 1800) * Math.exp(-t / 0.08), 1.3);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] = (x[i] * 0.6 + Math.sin(TAU * f * t) * 0.7) * Math.min(1, t / 0.003) * (t < d ? 1 : Math.exp(-(t - d) / 0.03));
    }
    return x;
  },
  // A singing supersaw lead with vibrato.
  lead(m, d, sr, rand, o) {
    const f = hz(m);
    const n = Math.round((d + 0.25) * sr);
    const x = new Float32Array(n);
    const ph = [rand(), rand(), rand()];
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const vib = 1 + 0.004 * Math.sin(TAU * 5.5 * t) * Math.min(1, Math.max(0, (t - 0.15) / 0.2));
      let s = 0;
      for (let v = 0; v < 3; v++) {
        const dt = (f * vib * (1 + (v - 1) * 0.004)) / sr;
        ph[v] = (ph[v] + dt) % 1;
        s += 2 * ph[v] - 1 - blep(ph[v], dt);
      }
      x[i] = s / 1.7;
    }
    lowpass(x, sr, () => o.cut ?? 3200, 0.9);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] *= Math.min(1, t / 0.01) * (t < d ? 1 : Math.exp(-(t - d) / 0.08));
    }
    return x;
  },
  // A short brassy synth chord stab.
  stab(m, d, sr, rand) {
    const n = Math.round((Math.min(d, 0.25) + 0.12) * sr);
    const x = saws(hz(m), n, sr, 3, 0.3, rand);
    lowpass(x, sr, (t) => 600 + 3500 * Math.exp(-t / 0.06), 1);
    for (let i = 0; i < n; i++) x[i] *= Math.min(1, i / sr / 0.004) * Math.exp(-i / sr / 0.12);
    return x;
  },
  // A flute: a pure tone with a little of its octave, a breath of noise in the attack, and a
  // vibrato that comes in once the note settles. (`breath`, `vib`.)
  flute(m, d, sr, rand, o) {
    const f = hz(m);
    const n = Math.round((d + (o.rel ?? 0.15) + 0.05) * sr);
    const x = new Float32Array(n);
    let ph = rand();
    let lp = 0;
    const br = o.breath ?? 0.1;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const vib = 1 + (o.vib ?? 0.005) * Math.sin(TAU * 5.2 * t) * Math.min(1, Math.max(0, (t - 0.18) / 0.25));
      ph = (ph + (f * vib) / sr) % 1;
      lp += (rand() * 2 - 1 - lp) * 0.2;
      x[i] = Math.sin(TAU * ph) + 0.18 * Math.sin(2 * TAU * ph) + 0.05 * Math.sin(3 * TAU * ph) + lp * br * (0.5 + 2 * Math.exp(-t / 0.06));
    }
    return env(x, sr, d, o.attack ?? 0.04, o.rel ?? 0.15);
  },
  // A reed (oboe, accordion): a narrow pulse, filtered, with a light vibrato; `trem` adds the
  // accordion's shimmer of two reeds a hair apart.
  reed(m, d, sr, rand, o) {
    const f = hz(m);
    const n = Math.round((d + (o.rel ?? 0.12) + 0.05) * sr);
    const x = new Float32Array(n);
    const duty = o.duty ?? 0.3;
    const ph = [rand(), rand()];
    const reeds = o.trem ? 2 : 1;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const vib = 1 + 0.003 * Math.sin(TAU * 5 * t) * Math.min(1, t / 0.3);
      let s = 0;
      for (let r = 0; r < reeds; r++) {
        const dt = (f * vib * (1 + r * 0.004)) / sr;
        ph[r] = (ph[r] + dt) % 1;
        const q = (ph[r] + duty) % 1;
        s += 2 * ph[r] - 1 - blep(ph[r], dt) - (2 * q - 1 - blep(q, dt));
      }
      x[i] = s / reeds;
    }
    lowpass(x, sr, () => o.cut ?? 2400, 0.9);
    return env(x, sr, d, o.attack ?? 0.03, o.rel ?? 0.12);
  },
  // Bowed strings (violin, a string section, a choir): detuned saws, softly filtered, swelling in,
  // with a vibrato that grows. (`voices`, `detune`, `cut`, `vib`.)
  bowed(m, d, sr, rand, o) {
    const f = hz(m);
    const n = Math.round((d + (o.rel ?? 0.3) + 0.05) * sr);
    const voices = o.voices ?? 4;
    const x = new Float32Array(n);
    const ph = Array.from({ length: voices }, () => rand());
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const vib = 1 + (o.vib ?? 0.006) * Math.sin(TAU * 5.6 * t + 1) * Math.min(1, Math.max(0, (t - 0.12) / 0.3));
      let s = 0;
      for (let v = 0; v < voices; v++) {
        const dt = (f * vib * (1 + ((o.detune ?? 0.25) / 100) * (voices > 1 ? (v / (voices - 1)) * 2 - 1 : 0))) / sr;
        ph[v] = (ph[v] + dt) % 1;
        s += 2 * ph[v] - 1 - blep(ph[v], dt);
      }
      x[i] = s / Math.sqrt(voices);
    }
    lowpass(x, sr, () => o.cut ?? 2400, 0.75);
    return env(x, sr, d, o.attack ?? 0.08, o.rel ?? 0.3);
  },
  // Brass (horn, trumpet, a section): saws whose filter opens with the breath and settles back.
  brass(m, d, sr, rand, o) {
    const n = Math.round((d + (o.rel ?? 0.15) + 0.05) * sr);
    const x = saws(hz(m), n, sr, o.voices ?? 3, 0.2, rand);
    const top = o.cut ?? 2600;
    lowpass(x, sr, (t) => 400 + top * (1 - Math.exp(-t / 0.05)) * (0.75 + 0.25 * Math.exp(-t / 0.3)), 1);
    return env(x, sr, d, o.attack ?? 0.025, o.rel ?? 0.15);
  },
  // An electric-piano tine (two-operator FM): a bright strike that mellows, lower notes ringing longer.
  keys(m, d, sr, rand, o) {
    const f = hz(m);
    const ring = (o.decay ?? 1.3) * Math.min(1.6, Math.max(0.5, 440 / f));
    const n = Math.round((d + (o.rel ?? 0.3) + 0.1) * sr);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const idx = 1.6 * Math.exp(-t / 0.18) + 0.25;
      x[i] = (Math.sin(TAU * f * t + idx * Math.sin(TAU * f * t)) + 0.15 * Math.sin(TAU * 4 * f * t) * Math.exp(-t / 0.05)) * Math.exp(-t / ring);
    }
    return env(x, sr, d, 0.002, o.rel ?? 0.3);
  },
  // A plucked string (guitar, harp, pizzicato, sitar): a burst of noise ringing down a tuned
  // delay line (Karplus-Strong). `bright` 0-1, `decay` in seconds; `buzz` adds the sitar's rattle.
  string(m, d, sr, rand, o) {
    const f = hz(m);
    const len = Math.max(2, Math.round(sr / f));
    const line = new Float32Array(len);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      lp += (rand() * 2 - 1 - lp) * (0.25 + 0.7 * (o.bright ?? 0.6));
      line[i] = lp;
    }
    const n = Math.round((Math.min(d, 4) + (o.rel ?? 0.3) + 0.1) * sr);
    const x = new Float32Array(n);
    const fb = Math.pow(0.001, 1 / ((o.decay ?? 1) * f));
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const k = i % len;
      const v = line[k];
      line[k] = (v + prev) * 0.5 * fb;
      prev = v;
      x[i] = o.buzz ? Math.tanh(v * 2.2) * 0.7 + v * 0.4 : v;
    }
    return env(x, sr, d, 0.001, o.rel ?? 0.3);
  },
  // A mallet (marimba, glockenspiel, celesta): FM with an inharmonic modulator, struck and
  // decaying. `ratio` sets the bar's colour, `decay` how long it rings.
  mallet(m, d, sr, rand, o) {
    const f = hz(m);
    const ring = o.decay ?? 0.6;
    const n = Math.round((Math.max(d, 0.2) + ring * 2) * sr);
    const x = new Float32Array(n);
    const r = o.ratio ?? 4;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] = (Math.sin(TAU * f * t + 1.2 * Math.exp(-t / 0.03) * Math.sin(TAU * f * r * t)) * Math.exp(-t / ring) + 0.25 * Math.sin(TAU * f * r * t) * Math.exp(-t / (ring * 0.2))) * Math.min(1, t / 0.001);
    }
    return x;
  },
  // A timpani: a deep tone that sags a touch in pitch, over a soft thump.
  timpani(m, d, sr, rand) {
    const f = hz(m);
    const n = Math.round(1.6 * sr);
    const x = new Float32Array(n);
    let ph = 0;
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      ph += (f * (1 + 0.04 * Math.exp(-t / 0.05))) / sr;
      lp += (rand() * 2 - 1 - lp) * 0.08;
      x[i] = (Math.sin(TAU * ph) + 0.4 * Math.sin(TAU * ph * 1.5) * Math.exp(-t / 0.3)) * Math.exp(-t / 0.7) + lp * 1.5 * Math.exp(-t / 0.04);
    }
    return x;
  },
  // A soft bell (two sines, a touch of a higher partial): sparkle.
  bell(m, d, sr) {
    const f = hz(m);
    const n = Math.round((Math.max(d, 0.4) + 1) * sr);
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      x[i] = (Math.sin(TAU * f * t) * Math.exp(-t / 0.8) + 0.3 * Math.sin(TAU * f * 2.76 * t) * Math.exp(-t / 0.25) + 0.12 * Math.sin(TAU * f * 5.4 * t) * Math.exp(-t / 0.08)) * Math.min(1, t / 0.002);
    }
    return x;
  },
};

// Each synth's level, so a synth and a recorded instrument at the same gain sound about as loud.
const SYNTH_LEVEL = { pluck: 0.4, pad: 0.6, sub: 0.21, bass: 0.58, lead: 0.26, stab: 0.5, bell: 0.28 };

// The instrument voices, named after the General MIDI instruments each stands in for. `level`
// matches each voice to the loudness of the recording it replaced, so songs keep their balance.
export const VOICES = {
  flute: { synth: 'flute', level: 0.173 },
  pan_flute: { synth: 'flute', breath: 0.22, vib: 0.003, level: 0.205 },
  oboe: { synth: 'reed', duty: 0.22, cut: 2200, level: 0.227 },
  violin: { synth: 'bowed', voices: 2, detune: 0.12, cut: 3400, vib: 0.008, level: 0.291 },
  string_ensemble_1: { synth: 'bowed', voices: 6, detune: 0.3, cut: 2200, level: 0.14 },
  choir_aahs: { synth: 'bowed', voices: 5, detune: 0.35, cut: 1100, vib: 0.004, attack: 0.15, level: 0.198 },
  accordion: { synth: 'reed', trem: true, duty: 0.35, cut: 2800, level: 0.234 },
  french_horn: { synth: 'brass', cut: 1300, level: 0.2 },
  trumpet: { synth: 'brass', voices: 2, cut: 3400, level: 0.252 },
  brass_section: { synth: 'brass', voices: 5, cut: 2600, level: 0.153 },
  acoustic_guitar_nylon: { synth: 'string', bright: 0.45, decay: 1.6, level: 1.51 },
  pizzicato_strings: { synth: 'string', bright: 0.35, decay: 0.35, level: 2.24 },
  orchestral_harp: { synth: 'string', bright: 0.65, decay: 2.2, level: 1.525 },
  acoustic_grand_piano: { synth: 'keys', decay: 1.4, level: 0.208 },
  marimba: { synth: 'mallet', ratio: 4, decay: 0.35, level: 0.356 },
  glockenspiel: { synth: 'mallet', ratio: 3.5, decay: 1.2, level: 0.221 },
  celesta: { synth: 'mallet', ratio: 2, decay: 0.9, level: 0.258 },
  sitar: { synth: 'string', bright: 0.8, decay: 1.8, buzz: true, level: 0.826 },
  timpani: { synth: 'timpani', level: 0.207 },
  electric_bass_finger: { synth: 'bass', cut: 900, level: 0.394 },
};

// ---------- Drums ----------
// Each piece: (sr, rand, bank) -> mono samples.
export const DRUMS = {
  K(sr, rand) {
    const n = Math.round(0.4 * sr);
    const x = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      ph += (48 + 150 * Math.exp(-t / 0.028)) / sr;
      x[i] = Math.tanh(1.7 * Math.sin(TAU * ph)) * Math.exp(-t / 0.17) + (t < 0.003 ? (rand() * 2 - 1) * 0.4 : 0);
    }
    return x;
  },
  S(sr, rand) {
    const n = Math.round(0.28 * sr);
    const x = new Float32Array(n);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const w = rand() * 2 - 1;
      lp += (w - lp) * 0.5;
      x[i] = (w - lp) * Math.exp(-t / 0.07) * 0.8 + Math.sin(TAU * (180 + 60 * Math.exp(-t / 0.02)) * t) * Math.exp(-t / 0.05) * 0.6;
    }
    return x;
  },
  c(sr, rand) {
    const n = Math.round(0.25 * sr);
    const x = new Float32Array(n);
    let lo = 0;
    let bp = 0;
    const f = 2 * Math.sin((Math.PI * 1500) / sr);
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      const burst = [0, 0.01, 0.02].reduce((a, o) => a + (t >= o ? Math.exp(-(t - o) / 0.006) : 0), 0);
      const w = (rand() * 2 - 1) * (burst * 0.6 + Math.exp(-t / 0.07) * 0.6);
      const hi = w - lo - 0.7 * bp;
      bp += f * hi;
      lo += f * bp;
      x[i] = bp * 1.6;
    }
    return x;
  },
  h: (sr, rand) => hat(sr, rand, 0.016),
  o: (sr, rand) => hat(sr, rand, 0.09),
  x(sr, rand) {
    const n = Math.round(0.09 * sr);
    const x = hat(sr, rand, 0.03, n);
    for (let i = 0; i < n; i++) x[i] *= Math.min(1, i / sr / 0.012) * 0.7;
    return x;
  },
  t(sr) {
    const n = Math.round(0.4 * sr);
    const x = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr;
      ph += (110 + 80 * Math.exp(-t / 0.05)) / sr;
      x[i] = Math.sin(TAU * ph) * Math.exp(-t / 0.18);
    }
    return x;
  },
  '*': (sr, rand) => hat(sr, rand, 0.6, Math.round(1.6 * sr)),
  // A woodblock: two hollow tones, knocked and gone.
  w(sr) {
    const x = new Float32Array(Math.round(0.15 * sr));
    for (let i = 0; i < x.length; i++) {
      const t = i / sr;
      x[i] = (Math.sin(TAU * 1250 * t) * 0.8 + Math.sin(TAU * 2030 * t) * 0.35) * Math.exp(-t / 0.025) * Math.min(1, t / 0.0005) * 0.6;
    }
    return x;
  },
};
function hat(sr, rand, decay, n = Math.round((decay * 5 + 0.02) * sr)) {
  // Noise with everything under about 6 kHz taken out (twice), decaying.
  const x = new Float32Array(n);
  const a = 1 - Math.exp((-TAU * 6000) / sr);
  let l1 = 0;
  let l2 = 0;
  for (let i = 0; i < n; i++) {
    const w = rand() * 2 - 1;
    l1 += (w - l1) * a;
    const h1 = w - l1;
    l2 += (h1 - l2) * a;
    x[i] = (h1 - l2) * Math.exp(-i / sr / decay) * 4;
  }
  return x;
}
const COMBO = { C: ['K', 'c'], O: ['K', 'o'], B: ['K', 'S'], H: ['K', 'h'] };
const DRUM_MIX = { K: 0.32, S: 0.22, c: 0.2, h: 0.14, o: 0.14, x: 0.25, t: 0.2, '*': 0.18, w: 0.12 };
const DRUM_PAN = { h: 0.25, o: 0.25, x: -0.3, t: -0.15, w: -0.35, '*': 0.1 };

// ---------- Effects ----------
// Freeverb (Jezar's public-domain design): eight combs and four allpasses a side.
export function reverb(L, R, sr, { room = 0.84, damp = 0.4 } = {}) {
  const scale = sr / 44100;
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
  const aps = [556, 441, 341, 225];
  const outs = [];
  [L, R].forEach((x, side) => {
    const spread = side ? 23 : 0;
    const y = new Float32Array(x.length);
    const cb = combs.map((c) => ({ b: new Float32Array(Math.round((c + spread) * scale)), i: 0, f: 0 }));
    const ab = aps.map((a) => ({ b: new Float32Array(Math.round((a + spread) * scale)), i: 0 }));
    for (let k = 0; k < x.length; k++) {
      const inp = x[k] * 0.015;
      let s = 0;
      for (const c of cb) {
        const o = c.b[c.i];
        c.f = o * (1 - damp) + c.f * damp;
        c.b[c.i] = inp + c.f * room;
        if (++c.i === c.b.length) c.i = 0;
        s += o;
      }
      for (const a of ab) {
        const o = a.b[a.i];
        const v = o - s;
        a.b[a.i] = s + o * 0.5;
        if (++a.i === a.b.length) a.i = 0;
        s = v;
      }
      y[k] = s * 3;
    }
    outs.push(y);
  });
  return outs;
}

// ---------- Patterns ----------
function rowTimes(song) {
  const rowSec = 60 / song.bpm / 4;
  const sw = song.swing ?? 0.5;
  return (r) => Math.floor(r / 2) * 2 * rowSec + (r % 2 ? sw * 2 * rowSec : 0);
}

// Parses a note line into events: { row, rows, midis, inst, vol }.
export function parseNotes(src, defInst, rowsPerBar = 0, where = '') {
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
      const midis = name.split('+').map(midiOf);
      if (midis.some((m) => m == null)) throw new Error(`${where}: bad note ${tok}`);
      out.push({ row, rows, midis, inst, vol });
      row += rows;
    }
  }
  return { events: out, rows: row };
}

// ---------- The whole song ----------
// Renders a song into { left, right, sampleRate, loopStart, loopEnd } (seconds), the buffer
// exactly one loop long (the reverb tail folded back onto the loop start).
export function renderSong(song, bank, sr = 32000) {
  const at = rowTimes(song);
  const rowsPerBar = song.rows ?? 16;
  const rand = rng(7);
  const sections = [...(song.intro ?? []), ...song.order];
  const tracks = song.tracks;
  const events = Object.fromEntries(Object.keys(tracks).map((k) => [k, []]));
  const hits = [];
  let row = 0;
  let loopRow = 0;
  sections.forEach((name, i) => {
    if (i === (song.intro ?? []).length) loopRow = row;
    const pat = song.patterns[name];
    if (!pat) throw new Error(`${song.name}: no section ${name}`);
    let len = 0;
    for (const [k, src] of Object.entries(pat)) {
      if (k === 'drums') continue;
      if (!tracks[k]) throw new Error(`${song.name} ${name}: no track ${k}`);
      const { events: ev, rows } = parseNotes(src, tracks[k].inst, rowsPerBar, `${song.name} ${name}.${k}`);
      for (const e of ev) events[k].push({ ...e, row: e.row + row });
      len = Math.max(len, rows);
    }
    if (pat.drums) {
      const grid = pat.drums.replace(/[|\s]/g, '');
      const fill = Math.max(grid.length, len);
      for (let r0 = 0; r0 < fill; r0 += grid.length) [...grid].forEach((c, r) => r0 + r < fill && c !== '.' && hits.push({ c, row: row + r0 + r }));
      len = Math.max(len, grid.length);
    }
    row += Math.ceil(len / rowsPerBar) * rowsPerBar;
  });
  const loopStart = at(loopRow);
  const loopEnd = at(row);
  const n = Math.ceil((loopEnd + 4) * sr);
  const L = new Float32Array(n);
  const R = new Float32Array(n);
  const sendL = new Float32Array(n);
  const sendR = new Float32Array(n);
  const pan = (p) => [Math.cos(((p + 1) * Math.PI) / 4) * Math.SQRT2, Math.sin(((p + 1) * Math.PI) / 4) * Math.SQRT2];
  const tp = song.transpose ?? 0;

  // Each track: its notes into a mono buffer, its echo, then into the mix and the reverb send.
  for (const [k, tr] of Object.entries(tracks)) {
    const buf = new Float32Array(n);
    for (const e of events[k]) {
      const inst = song.inst[e.inst];
      if (!inst) throw new Error(`${song.name}: no instrument ${e.inst}`);
      const t0 = at(e.row) + (tr.delay ? at(tr.delay) - at(0) : 0) + (inst.sample ? (rand() - 0.5) * 0.008 : 0);
      const d = (at(e.row + e.rows) - at(e.row)) * (inst.gate ?? 1);
      const vel = (e.vol != null ? e.vol / 15 : 1) * (inst.sample ? 0.94 + rand() * 0.08 : 1);
      const s0 = Math.max(0, Math.round(t0 * sr));
      e.midis.forEach((m0, j) => {
        const m = m0 + tp;
        const g = vel / Math.sqrt(e.midis.length) * 1.2;
        const s1 = s0 + Math.round(j * (inst.strum ?? 0) * sr);
        if (inst.sample) sampleNote(buf, s1, sr, bank, inst, m, d, g);
        else {
          const x = SYNTHS[inst.synth](m, d, sr, rand, inst);
          const gg = g * (inst.gain ?? 1) * (SYNTH_LEVEL[inst.synth] ?? 1);
          for (let i = 0; i < x.length && s1 + i < n; i++) buf[s1 + i] += x[i] * gg;
        }
      });
    }
    if (tr.echo) {
      const dl = Math.round((at(tr.echo.rows) - at(0)) * sr);
      const fb = tr.echo.fb ?? 0.3;
      const wet = tr.echo.wet ?? 0.3;
      const e = new Float32Array(n);
      for (let i = dl; i < n; i++) e[i] = (buf[i - dl] + e[i - dl] * fb);
      for (let i = 0; i < n; i++) buf[i] += e[i] * wet;
    }
    const [gl, gr] = pan(tr.pan ?? 0);
    const g = tr.gain ?? 1;
    const send = tr.verb ?? 0.25;
    for (let i = 0; i < n; i++) {
      const v = buf[i] * g;
      if (!v) continue;
      L[i] += v * gl;
      R[i] += v * gr;
      sendL[i] += v * gl * send;
      sendR[i] += v * gr * send;
    }
  }

  // The sidechain pump: everything but the drums dips under each kick and swells back.
  const kicks = hits.filter((h) => 'KCOBH'.includes(h.c)).map((h) => at(h.row));
  if (song.pump && kicks.length) {
    const env = new Float32Array(n).fill(1);
    const len = Math.round(0.22 * sr);
    for (const k of kicks) {
      const s0 = Math.round(k * sr);
      for (let i = 0; i < len && s0 + i < n; i++) env[s0 + i] = Math.min(env[s0 + i], 1 - song.pump * (1 - i / len));
    }
    for (let i = 0; i < n; i++) {
      L[i] *= env[i];
      R[i] *= env[i];
    }
  }

  // Drums (rendered once per piece, then placed).
  const kit = {};
  const dg = song.drums ?? 1;
  for (const h of hits) {
    for (const c of COMBO[h.c] ?? [h.c]) {
      if (!DRUMS[c]) continue;
      kit[c] ??= DRUMS[c](sr, rng(c.charCodeAt(0)), bank);
      const x = kit[c];
      const [gl, gr] = pan(DRUM_PAN[c] ?? 0);
      const g = DRUM_MIX[c] * dg * (0.95 + rand() * 0.1);
      const s0 = Math.round(at(h.row) * sr);
      const sv = c === 'c' || c === 'S' || c === '*' ? 0.15 : 0.04;
      for (let i = 0; i < x.length && s0 + i < n; i++) {
        L[s0 + i] += x[i] * g * gl;
        R[s0 + i] += x[i] * g * gr;
        sendL[s0 + i] += x[i] * g * gl * sv;
        sendR[s0 + i] += x[i] * g * gr * sv;
      }
    }
  }

  // The reverb, then fold the tail past the loop end back onto the loop start.
  const [wl, wr] = reverb(sendL, sendR, sr, song.reverb);
  const wet = song.reverb?.wet ?? 0.25;
  const len = Math.ceil(loopEnd * sr);
  const ls = Math.round(loopStart * sr);
  const left = new Float32Array(len);
  const right = new Float32Array(len);
  for (let i = 0; i < n; i++) {
    const j = i < len ? i : ls + (i - len);
    if (j >= len) continue;
    left[j] += L[i] + wl[i] * wet;
    right[j] += R[i] + wr[i] * wet;
  }
  // A touch of presence (a gentle lift above about 2.5 kHz, `bright`), a low cut (no rumble),
  // and the same loudness for every song.
  const lift = song.bright ?? 0.5;
  const ab = 1 - Math.exp((-TAU * 2500) / sr);
  for (const x of [left, right]) {
    let lp = 0;
    for (let i = 0; i < x.length; i++) {
      lp += (x[i] - lp) * ab;
      x[i] += (x[i] - lp) * lift;
    }
  }
  for (const x of [left, right]) {
    const a = Math.exp((-TAU * 30) / sr);
    let px = 0;
    let py = 0;
    for (let i = 0; i < x.length; i++) {
      const y = a * (py + x[i] - px);
      px = x[i];
      py = y;
      x[i] = y;
    }
  }
  if (!song.raw) normalize(left, right, song.level ?? 1, sr);
  return { left, right, sampleRate: sr, loopStart, loopEnd };
}

// The same loudness for every song: brought to a set level, then any peaks above 0.9 caught by
// a look-ahead limiter (it starts turning down 5 ms early and lets go over 120 ms), so one loud
// drum hit can't make the whole song quieter.
function normalize(l, r, level, sr) {
  let sum = 0;
  for (let i = 0; i < l.length; i++) sum += l[i] * l[i] + r[i] * r[i];
  const k = (0.13 * level) / (Math.sqrt(sum / (2 * l.length)) || 1);
  const n = l.length;
  // The gain each block of 32 samples needs to stay under 0.9.
  const B = 32;
  const need = new Float32Array(Math.ceil(n / B) + 1).fill(1);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(l[i]), Math.abs(r[i])) * k;
    if (p > 0.9) need[(i / B) | 0] = Math.min(need[(i / B) | 0], 0.9 / p);
  }
  const ahead = Math.max(1, Math.round((0.005 * sr) / B));
  const rel = Math.exp(-B / (0.12 * sr));
  // (Already turned down for a peak right at the start, since there's no earlier block to ease in on.)
  let cur = Math.min(1, ...need.slice(0, ahead + 1));
  for (let b = 0; b * B < n; b++) {
    let want = 1;
    for (let j = b; j <= Math.min(need.length - 1, b + ahead); j++) want = Math.min(want, need[j]);
    const next = want < cur ? want : Math.min(want, 1 - (1 - cur) * rel);
    // Glide from this block's gain to the next across the block.
    for (let i = b * B; i < Math.min(n, (b + 1) * B); i++) {
      const g = cur + ((next - cur) * (i - b * B)) / B;
      l[i] *= k * g;
      r[i] *= k * g;
    }
    cur = next;
  }
}
