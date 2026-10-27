// The sound-effect synthesizer: renders a recipe (recipes.js) into samples once, with no audio
// nodes, so every effect is exact, cheap to play, and testable in node. The model follows sfxr
// and its descendants (see docs/audio/research-sfx.md): an oscillator per layer with a
// punchy attack/sustain/decay envelope, pitch slides and one-shot jumps, arpeggios, a repeat that
// restarts the pitch ("bwip-bwip"), vibrato and tremolo, duty sweeps on pulse waves, pitched and
// NES-style noise, swept resonant filters, bit crushing and a short echo, in physical units.
//
// Jingles and menu sounds are written as notes instead (a `seq` layer: "G4:70 B4:70 r:40 D5:700",
// lengths in ms) and played on the chip's instruments (chip.js), like the music.
//
// Algorithms after sfxr (DrPetter, MIT), jsfxr (Unlicense), ZzFX (Frank Force, MIT) and bfxr2
// (Stephen Lavelle, MIT); no code is copied from them.

import { renderNote, midiHz } from './chip.js';

const TAU = Math.PI * 2;
const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const midiOf = (name) => {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note ${name}`);
  return 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
};

// "G4:70 r:40 D5:700" -> [{ at, ms, midi }] (ms).
export function parseSeq(src) {
  const out = [];
  let at = 0;
  for (const tok of src.trim().split(/\s+/)) {
    const [name, ms] = tok.split(':');
    const len = Number(ms);
    if (name !== 'r') out.push({ at, ms: len, midi: midiOf(name) });
    at += len;
  }
  return out;
}

// A chip line: one voice, each note cutting the last (with a 3 ms fade), the last one ringing out.
function renderSeqLayer(L, sr) {
  const notes = parseSeq(L.seq);
  const end = notes.length ? notes[notes.length - 1].at + notes[notes.length - 1].ms : 0;
  const n = Math.ceil(((end + (L.tail ?? 400)) / 1000) * sr);
  const out = new Float32Array(n);
  const fade = Math.round(0.003 * sr);
  notes.forEach((e, i) => {
    const s0 = Math.round((e.at / 1000) * sr);
    const cut = notes[i + 1] && notes[i + 1].at < e.at + e.ms + (L.tail ?? 400) ? Math.round(((notes[i + 1].at - e.at) / 1000) * sr) : n - s0;
    const tmp = new Float32Array(Math.max(1, Math.min(n - s0, cut + fade)));
    renderNote(tmp, 0, sr, L.inst ?? {}, { midi: e.midi + (L.transpose ?? 0), len: (e.ms / 1000) * (L.gate ?? 1), detune: L.detune });
    for (let k = 0; k < tmp.length; k++) out[s0 + k] += tmp[k] * (k < cut ? 1 : Math.max(0, 1 - (k - cut) / fade));
  });
  if (L.lpf) {
    const lp = biquad('lp');
    lp.set(L.lpf[0], L.lpf[2] ?? 0.7, sr);
    for (let i = 0; i < n; i++) out[i] = lp.run(out[i]);
  }
  return out;
}

// A small seeded random, so a recipe's noise variants are repeatable.
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 100000) / 100000;
  };
}

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

// The envelope at `t` ms into a layer: attack, sustain (with punch: a loud front edge that falls
// back to full), decay (curve > 1 falls faster at first). `bell` shapes rise and fall around
// `focus` (whooshes).
function envAt(env, t, len) {
  if (env.bell) {
    const peak = len * (env.focus ?? 0.4);
    return t < peak ? Math.pow(t / peak, 2) : Math.pow(Math.max(0, (len - t) / (len - peak)), 1.6);
  }
  const a = env.a ?? 0;
  const s = env.s ?? 0;
  const d = env.d ?? 100;
  if (t < a) return t / a;
  if (t < a + s) return 1 + (env.punch ?? 0) * 2 * (1 - (t - a) / s);
  const k = 1 - (t - a - s) / d;
  return k <= 0 ? 0 : Math.pow(k, env.curve ?? 1);
}

const layerLen = (L) => (L.env?.bell ? L.len ?? 170 : (L.env?.a ?? 0) + (L.env?.s ?? 0) + (L.env?.d ?? 100));

// A biquad (RBJ cookbook) whose coefficients are refreshed as the cutoff sweeps.
function biquad(type) {
  let b0 = 1, b1 = 0, b2 = 0, a1 = 0, a2 = 0, x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return {
    set(f, q, sr) {
      const w = (TAU * Math.min(f, sr * 0.45)) / sr;
      const cs = Math.cos(w);
      const al = Math.sin(w) / (2 * q);
      const a0 = 1 + al;
      if (type === 'lp') {
        b0 = (1 - cs) / 2 / a0;
        b1 = (1 - cs) / a0;
        b2 = b0;
      } else {
        b0 = (1 + cs) / 2 / a0;
        b1 = -(1 + cs) / a0;
        b2 = b0;
      }
      a1 = (-2 * cs) / a0;
      a2 = (1 - al) / a0;
    },
    run(x) {
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1;
      x1 = x;
      y2 = y1;
      y1 = y;
      return y;
    },
  };
}

function renderLayer(L, sr, rand) {
  if (L.seq) return renderSeqLayer(L, sr);
  const lenMs = layerLen(L);
  const n = Math.max(1, Math.ceil((lenMs / 1000) * sr));
  const out = new Float32Array(n);
  const wave = L.wave ?? 'pulse';
  let phase = rand();
  let lfsr = 1 + Math.floor(rand() * 30000);
  let pn = Array.from({ length: 32 }, () => rand() * 2 - 1);
  let noiseAcc = 0;
  let noiseVal = 0;
  let held = 0;
  const lp = L.lpf ? biquad('lp') : null;
  const hp = L.hpf ? biquad('hp') : null;
  const sweep = (spec, k) => (spec[1] ? spec[0] * Math.pow(spec[1] / spec[0], k) : spec[0]);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const ms = t * 1000;
    // Pitch: the base (or the arpeggio's current note), the repeat's restart, slides, jumps.
    let tp = t;
    let loops = 0;
    if (L.repeat) {
      loops = Math.floor(ms / L.repeat);
      tp = (ms - loops * L.repeat) / 1000;
    }
    let f = L.f0 ?? 440;
    if (L.arp) f = L.arp[Math.min(L.arp.length - 1, Math.floor(ms / (L.arpStep ?? 60)))];
    if (L.repeatSemis) f *= Math.pow(2, (loops * L.repeatSemis) / 12);
    f *= Math.pow(2, (L.slide ?? 0) * tp + 0.5 * (L.dslide ?? 0) * tp * tp);
    if (L.jumps) for (const [r, atMs] of L.jumps) if (ms >= atMs) f *= r;
    if (L.vib) f *= 1 + (L.vib[1] / 100) * Math.sin(TAU * L.vib[0] * t);
    f = Math.max(20, Math.min(f, sr * 0.45));
    const dt = f / sr;
    phase += dt;
    let wrapped = false;
    if (phase >= 1) {
      phase -= Math.floor(phase);
      wrapped = true;
    }
    let s;
    switch (wave) {
      case 'sine':
        s = Math.sin(TAU * phase);
        if (L.overtones) for (let h = 2; h <= L.overtones[0]; h++) s += Math.sin(TAU * phase * h) * Math.pow(L.overtones[1], h - 1);
        break;
      case 'tri':
        s = 1 - 4 * Math.abs(phase - 0.5);
        break;
      case 'saw':
        s = 2 * phase - 1 - blep(phase, dt);
        break;
      case 'noise':
        s = rand() * 2 - 1;
        break;
      case 'pnoise':
        // sfxr's pitched noise: 32 random values spread over one period, redrawn each period.
        if (wrapped) pn = pn.map(() => rand() * 2 - 1);
        s = pn[Math.floor(phase * 32)];
        break;
      case 'lfsr':
      case 'lfsr93': {
        // The NES noise register, clocked at f.
        noiseAcc += dt * 16;
        let sum = 0;
        let c = 0;
        while (noiseAcc >= 1) {
          noiseAcc -= 1;
          const bit = (lfsr ^ (lfsr >> (wave === 'lfsr93' ? 6 : 1))) & 1;
          lfsr = (lfsr >> 1) | (bit << 14);
          sum += lfsr & 1 ? -1 : 1;
          c++;
        }
        if (c) noiseVal = sum / c;
        s = noiseVal;
        break;
      }
      default: {
        const d = Math.max(0.05, Math.min(0.5, (L.duty ?? 0.5) + (L.dutySweep ?? 0) * t));
        s = phase < d ? 1 : -1;
        s += blep(phase, dt);
        s -= blep((phase - d + 1) % 1, dt);
      }
    }
    let a = envAt(L.env ?? {}, ms, lenMs);
    if (L.trem) a *= 1 - (L.trem[1] / 100) * (0.5 + 0.5 * Math.sin(TAU * L.trem[0] * t));
    s *= a;
    if ((lp || hp) && i % 16 === 0) {
      const k = i / n;
      if (lp) lp.set(sweep(L.lpf, k), L.lpf[2] ?? 0.8, sr);
      if (hp) hp.set(sweep(L.hpf, k), 0.7, sr);
    }
    if (lp) s = lp.run(s);
    if (hp) s = hp.run(s);
    if (L.crush) {
      if (i % L.crush === 0) held = s;
      s = held;
    }
    if (L.drive) s = Math.tanh(s * (1 + L.drive * 4)) / Math.tanh(1 + L.drive * 4);
    out[i] = s;
  }
  if (L.echo) {
    const d = Math.round((L.echo[0] / 1000) * sr);
    const g = Math.pow(10, L.echo[1] / 20);
    const withEcho = new Float32Array(n + d * 2);
    for (let i = 0; i < n; i++) {
      withEcho[i] += out[i];
      withEcho[i + d] += out[i] * g;
      withEcho[i + d * 2] += out[i] * g * g;
    }
    return withEcho;
  }
  return out;
}

// Renders a recipe ({ layers: [...] }) to a mono buffer, peak-normalized to 1, with a DC blocker
// and tiny fades so it never clicks.
export { midiHz };

export function render(recipe, sr = 44100, seed = 1) {
  const rand = rng(seed * 7919 + 13);
  const parts = recipe.layers.map((L) => ({ L, buf: renderLayer(L, sr, rand), at: Math.round(((L.at ?? 0) / 1000) * sr) }));
  const n = Math.max(...parts.map((p) => p.at + p.buf.length));
  const out = new Float32Array(n);
  for (const { L, buf, at } of parts) {
    const g = Math.pow(10, (L.db ?? 0) / 20);
    for (let i = 0; i < buf.length; i++) out[at + i] += buf[i] * g;
  }
  // DC blocker.
  let x1 = 0;
  let y1 = 0;
  for (let i = 0; i < n; i++) {
    const y = out[i] - x1 + 0.995 * y1;
    x1 = out[i];
    y1 = y;
    out[i] = y;
  }
  const fin = Math.round(0.0003 * sr);
  const fout = Math.round(0.005 * sr);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    if (i < fin) out[i] *= i / fin;
    if (i > n - fout) out[i] *= (n - i) / fout;
    peak = Math.max(peak, Math.abs(out[i]));
  }
  if (peak > 0) for (let i = 0; i < n; i++) out[i] /= peak;
  return out;
}
