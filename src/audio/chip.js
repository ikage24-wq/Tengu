// The chip: an 8-bit sound machine in plain JS, after the NES 2A03 and the Game Boy (see
// docs/audio/research-music.md). It writes samples straight into arrays (no live audio nodes),
// so a whole song loop or a sound effect is rendered once, exactly, and then played from a buffer.
//
// Voices:
//   pulse  a square wave with a duty of 12.5%, 25% or 50% (0, 1, 2), band-limited with PolyBLEP
//          so it doesn't alias, and pitched like the hardware (slightly out of tune up high).
//   tri    the NES triangle: a 32-step, 4-bit staircase with that faint buzz, no volume control.
//   noise  the NES 15-bit noise register, 16 pitches (0 brightest), long mode (hiss) or short
//          mode (a metallic buzz).
//   wave   a Game Boy-style 32-sample, 4-bit wave (softer leads and basses).
// Instruments are macros, as in FamiTracker: per-frame (60 Hz) tables for volume (0-15), duty,
// arpeggio (semitones) and pitch (cents), each with a loop point (`|`) and a release point (`/`),
// plus a delayed vibrato and a slide into the note.

export const FRAME = 1 / 60;
const CPU = 1789773;
const NOISE_PERIODS = [4, 8, 16, 32, 64, 96, 128, 160, 202, 254, 380, 508, 762, 1016, 2034, 4068];
const DUTIES = [0.125, 0.25, 0.5];

// A Game Boy wave: a rounded saw-sine, 32 steps of 0-15.
const GB_WAVE = [8, 11, 13, 14, 15, 15, 14, 13, 11, 9, 8, 6, 4, 3, 2, 1, 0, 0, 1, 2, 3, 4, 6, 7, 8, 9, 10, 10, 9, 8, 8, 8];

export const midiHz = (m) => 440 * Math.pow(2, (m - 69) / 12);
// The NES plays a pitch from an integer timer, so notes are a touch off the true pitch up high.
function nesHz(f, tri = false) {
  const div = tri ? 32 : 16;
  const t = Math.max(8, Math.round(CPU / (div * f) - 1));
  return CPU / (div * (t + 1));
}

// "11 10 9 | 8 / 6 4 0" -> { seq, loop, rel }.
export function macro(src) {
  if (src == null) return null;
  if (typeof src === 'object' && src.seq) return src;
  const seq = [];
  let loop = null;
  let rel = null;
  for (const tok of String(src).trim().split(/\s+/)) {
    if (tok === '|') loop = seq.length;
    else if (tok === '/') rel = seq.length;
    else if (tok !== '') seq.push(Number(tok));
  }
  return { seq, loop, rel };
}

// The value of a macro `f` frames into a note that was released at frame `off` (or never: null).
function step(m, f, off) {
  if (!m || !m.seq.length) return null;
  const { seq, loop, rel } = m;
  const holdEnd = rel ?? seq.length;
  if (off == null || f < off) {
    if (f < holdEnd) return seq[f];
    if (loop != null && loop < holdEnd) return seq[loop + ((f - loop) % (holdEnd - loop))];
    return seq[holdEnd - 1];
  }
  // Released: the part held until `off`, then on from the release point.
  const heldAt = off < holdEnd ? off : loop != null && loop < holdEnd ? loop + ((off - loop) % (holdEnd - loop)) : holdEnd - 1;
  const after = (rel ?? heldAt) + (f - off);
  if (rel == null) return seq[Math.min(seq.length - 1, Math.max(heldAt, after))];
  return seq[Math.min(seq.length - 1, after)];
}

const poly = (t, dt) => {
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

// Renders one note of an instrument into `out` (mono Float32Array) from sample `start`.
// note: { midi, len (seconds held), gain (0-1), detune (cents) }. Returns the samples written.
export function renderNote(out, start, sr, inst, note) {
  const vol = macro(inst.vol) ?? macro('15');
  const duty = macro(inst.duty);
  const arp = macro(inst.arp);
  const pitch = macro(inst.pitch);
  const arpFrames = inst.arpSpeed ?? 1;
  const offFrame = note.len != null ? Math.max(1, Math.round(note.len / FRAME)) : null;
  // How long the note can ring after release: the rest of the volume table.
  const tailFrames = vol.rel != null ? vol.seq.length - vol.rel : vol.loop != null ? 0 : vol.seq.length;
  const total = Math.min(out.length - start, Math.round(((offFrame ?? vol.seq.length) + tailFrames + 1) * FRAME * sr));
  const wave = inst.wave ?? 'pulse';
  const vib = inst.vib;
  const slide = inst.slideIn;
  const g = (note.gain ?? 1) * (inst.gain ?? 1);
  let phase = 0;
  let lfsr = 1;
  let acc = 0;
  let last = 0;
  let level = 0;
  for (let i = 0; i < total; i++) {
    const tt = i / sr;
    const f = Math.floor(tt / FRAME);
    const v = step(vol, f, offFrame);
    if (v == null) break;
    const target = (v / 15) * g;
    // A tiny ramp between volume steps (about 1 ms), so steps never click.
    level += (target - level) * 0.04;
    if (f > (offFrame ?? Infinity) + tailFrames && level < 1e-4) break;
    if (wave === 'noise') {
      const idx = Math.max(0, Math.min(15, (note.noise ?? 8) + (step(arp, Math.floor(f / arpFrames), offFrame) ?? 0)));
      const rate = CPU / NOISE_PERIODS[idx];
      acc += rate / sr;
      let sum = 0;
      let n = 0;
      while (acc >= 1) {
        acc -= 1;
        const bit = (lfsr ^ (lfsr >> (note.short || inst.short ? 6 : 1))) & 1;
        lfsr = (lfsr >> 1) | (bit << 14);
        sum += lfsr & 1 ? -1 : 1;
        n++;
      }
      if (n) last = sum / n;
      out[start + i] += last * level;
      continue;
    }
    let semis = (step(arp, Math.floor(f / arpFrames), offFrame) ?? 0) + (note.detune ?? 0) / 100 + (step(pitch, f, offFrame) ?? 0) / 100;
    if (slide && f < slide.frames) semis += slide.semis * (1 - f / slide.frames);
    if (note.slide) semis += note.slide.semis * Math.min(1, tt / note.slide.secs);
    if (vib && f > vib.delay) {
      const depth = Math.min(1, (f - vib.delay) / 8) * vib.cents;
      semis += (Math.sin(2 * Math.PI * vib.rate * tt) * depth) / 100;
    }
    let hz = midiHz(note.midi + semis);
    if (inst.nes !== false) hz = nesHz(hz, wave === 'tri');
    const dt = hz / sr;
    phase += dt;
    if (phase >= 1) phase -= 1;
    let s;
    if (wave === 'tri') {
      const k = Math.floor(phase * 32);
      const lv = k < 16 ? 15 - k : k - 16;
      s = lv / 7.5 - 1;
    } else if (wave === 'wave') {
      s = GB_WAVE[Math.floor(phase * 32)] / 7.5 - 1;
    } else {
      const d = DUTIES[step(duty, f, offFrame) ?? 2] ?? 0.5;
      s = phase < d ? 1 : -1;
      s += poly(phase, dt);
      s -= poly((phase - d + 1) % 1, dt);
    }
    out[start + i] += s * level;
  }
  return total;
}

// A one-pole high-pass and low-pass over a buffer (the NES output stage: ~90 Hz and ~14 kHz).
export function tone(buf, sr, hp = 90, lp = 14000) {
  const a = Math.exp((-2 * Math.PI * hp) / sr);
  const b = 1 - Math.exp((-2 * Math.PI * lp) / sr);
  let x1 = 0;
  let y1 = 0;
  let l = 0;
  for (let i = 0; i < buf.length; i++) {
    const x = buf[i];
    const y = a * (y1 + x - x1);
    x1 = x;
    y1 = y;
    l += (y - l) * b;
    buf[i] = l;
  }
}
