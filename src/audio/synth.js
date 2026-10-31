// The sound-effect synthesizer: renders a recipe (recipes.js) into samples once, with no audio
// nodes, so every effect is exact, cheap to play, and testable in node. The model follows sfxr
// and its descendants (see docs/audio/research-sfx.md): an oscillator per layer with a
// punchy attack/sustain/decay envelope, pitch slides and one-shot jumps, arpeggios, a repeat that
// restarts the pitch ("bwip-bwip"), vibrato and tremolo, duty sweeps on pulse waves, pitched and
// NES-style noise, swept resonant filters, bit crushing and a short echo, in physical units.
//
// Layers can also be recordings: `rec` plays a recorded effect (samples.js; a different take for
// each variant), `seq` plays written notes ("G4:70 B4:70 r:40 D5+G5:700", lengths in ms) on an
// instrument voice (`inst`) or one of the studio's synths (`synth`), and `drum` one hit of the
// studio's drum kit.
//
// Algorithms after sfxr (DrPetter, MIT), jsfxr (Unlicense), ZzFX (Frank Force, MIT) and bfxr2
// (Stephen Lavelle, MIT); no code is copied from them.

import { sampleNote, SYNTHS, DRUMS, midiOf, rng as studioRng } from './studio.js';
import { effectSamples } from './samples.js';

const TAU = Math.PI * 2;

// "G4:70 r:40 D5+G5:700" -> [{ at, ms, midis }] (ms).
export function parseSeq(src) {
  const out = [];
  let at = 0;
  for (const tok of src.trim().split(/\s+/)) {
    const [name, ms] = tok.split(':');
    const len = Number(ms);
    if (name !== 'r') {
      const midis = name.split('+').map(midiOf);
      if (midis.some((m) => m == null)) throw new Error(`bad note ${tok}`);
      out.push({ at, ms: len, midis });
    }
    at += len;
  }
  return out;
}

// Written notes on a recorded instrument or a synth; each note rings out under the next.
function renderSeqLayer(L, sr, bank, seed) {
  const notes = parseSeq(L.seq);
  const end = notes.length ? notes[notes.length - 1].at + notes[notes.length - 1].ms : 0;
  const out = new Float32Array(Math.ceil(((end + (L.tail ?? 600)) / 1000) * sr));
  const rand = studioRng(seed);
  for (const e of notes) {
    const s0 = Math.round((e.at / 1000) * sr);
    const d = (e.ms / 1000) * (L.gate ?? 1);
    for (const m0 of e.midis) {
      const m = m0 + (L.transpose ?? 0);
      const g = 1 / Math.sqrt(e.midis.length);
      if (L.inst) sampleNote(out, s0, sr, bank, { sample: L.inst, rel: L.rel, attack: L.attack }, m, d, g);
      else {
        const x = SYNTHS[L.synth](m, d, sr, rand, L);
        for (let i = 0; i < x.length && s0 + i < out.length; i++) out[s0 + i] += x[i] * g;
      }
    }
  }
  return out;
}

// A recorded effect, retuned by `rate` (and so shortened or stretched), optionally cut to `len` ms.
function renderRecLayer(L, sr, bank, seed, index) {
  const pick = (seed * 0.618 + index * 0.37) % 1;
  const x = effectSamples(bank, L.rec, pick);
  if (!x) return new Float32Array(1);
  const step = (L.rate ?? 1) * (bank.sfx.sr / sr);
  let n = Math.floor((x.length - 1) / step);
  if (L.len) n = Math.min(n, Math.round((L.len / 1000) * sr));
  const out = new Float32Array(n);
  // Cut short (`len`): a 60 ms fade; played whole: a short fade anyway, in case it ends loud.
  const fade = Math.min(n, Math.round((L.len ? 0.06 : 0.012) * sr));
  for (let i = 0; i < n; i++) {
    const p = i * step;
    const k = Math.floor(p);
    out[i] = (x[k] + (x[k + 1] - x[k]) * (p - k)) * (i > n - fade ? (n - i) / fade : 1);
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

function renderLayer(L, sr, rand, bank, seed, index) {
  if (L.seq) return renderSeqLayer(L, sr, bank, seed);
  if (L.rec) return renderRecLayer(L, sr, bank, seed, index);
  if (L.drum) return DRUMS[L.drum](sr, studioRng(seed + index), bank);
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
// and tiny fades so it never clicks. `bank` holds the recordings (samples.js).
export function render(recipe, sr = 44100, seed = 1, bank = null) {
  const rand = rng(seed * 7919 + 13);
  const parts = recipe.layers.map((L, i) => ({ L, buf: renderLayer(L, sr, rand, bank, seed, i), at: Math.round(((L.at ?? 0) / 1000) * sr) }));
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
  const fout = Math.round(0.012 * sr);
  let peak = 0;
  for (let i = 0; i < n; i++) {
    if (i < fin) out[i] *= i / fin;
    if (i > n - fout) out[i] *= (n - i) / fout;
    peak = Math.max(peak, Math.abs(out[i]));
  }
  if (peak > 0) for (let i = 0; i < n; i++) out[i] /= peak;
  return out;
}
