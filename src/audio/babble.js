// Talking babble (the player's call, 2026-11-18: "cute sounds for talking"): as a line types out in
// a cutscene, its speaker babbles along in little sung syllables - a quick vowel for every few
// letters, each in that speaker's own voice. Not words: a tune of the line, rising on a question,
// bouncing on an exclamation, drifting down when she mumbles in her sleep.
//
// Each syllable is made on the spot: a tone at the speaker's pitch (with a tiny scoop up into it)
// through two band-pass filters set to the vowel's formants (so "a" sounds like "a", "i" like "i"),
// and a short soft envelope, onto the voice bus. A voice is { pitch (Hz), wave, formant (scale on
// the vowel formants: higher for small folk), every (letters a syllable), soft (dB down), droop }.

import { context, busNode, audioReady } from './engine.js';

// The vowel formants (Hz), roughly a child's voice: enough to tell the vowels apart, kept soft.
const VOWELS = { a: [850, 1250], e: [520, 2000], i: [340, 2400], o: [520, 950], u: [360, 820] };
// A consonant sounds like the vowel it's nearest in the mouth.
const NEAR = { b: 'u', c: 'e', d: 'e', f: 'e', g: 'a', h: 'a', j: 'e', k: 'a', l: 'e', m: 'u', n: 'e', p: 'u', q: 'u', r: 'o', s: 'i', t: 'i', v: 'e', w: 'u', x: 'e', y: 'i', z: 'i' };
const vowelOf = (ch) => {
  const c = ch.toLowerCase();
  return VOWELS[c] ? c : NEAR[c] ?? 'a';
};

// One syllable in voice `v`, for letter `ch`; `lift` bends its pitch (a question rises).
export function syllable(v, ch, { lift = 1, pan = 0 } = {}) {
  if (!audioReady()) return;
  const ac = context();
  const out = busNode('voice');
  if (!ac || !out) return;
  const t = ac.currentTime;
  const f0 = v.pitch * lift * (1 + (Math.random() * 2 - 1) * (v.wobble ?? 0.06));
  const len = v.len ?? 0.06;
  const [F1, F2] = VOWELS[vowelOf(ch)].map((f) => f * (v.formant ?? 1));
  const osc = ac.createOscillator();
  osc.type = v.wave ?? 'triangle';
  osc.frequency.setValueAtTime(f0 * 0.9, t);
  osc.frequency.exponentialRampToValueAtTime(f0, t + 0.018);
  if (v.droop) osc.frequency.exponentialRampToValueAtTime(f0 * (1 - v.droop), t + len);
  const g = ac.createGain();
  const peak = 0.55 * 10 ** (-(v.soft ?? 0) / 20);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.setValueAtTime(peak, t + len * 0.55);
  g.gain.exponentialRampToValueAtTime(0.0001, t + len);
  for (const [f, q, k] of [[F1, 5, 1], [F2, 7, 0.7]]) {
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = f;
    bp.Q.value = q;
    const kg = ac.createGain();
    kg.gain.value = k;
    osc.connect(bp).connect(kg).connect(g);
  }
  // A little of the plain tone underneath, for body.
  const lp = ac.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = f0 * 2.2;
  const body = ac.createGain();
  body.gain.value = 0.25;
  osc.connect(lp).connect(body).connect(g);
  let node = g;
  if (pan && ac.createStereoPanner) {
    const p = ac.createStereoPanner();
    p.pan.value = Math.max(-0.7, Math.min(0.7, pan));
    g.connect(p);
    node = p;
  }
  node.connect(out);
  osc.start(t);
  osc.stop(t + len + 0.03);
}

// Babbles the letters of `words` from index `from` up to `to` (what has just typed), a syllable every
// `v.every` letters (spaces and punctuation are breaths); a question rises at its end, an
// exclamation bounces up.
export function babbleAlong(v, words, from, to, state) {
  for (let i = from; i < to; i++) {
    const ch = words[i];
    if (!/[a-z0-9]/i.test(ch)) continue;
    state.n = (state.n ?? 0) + 1;
    if (state.n % (v.every ?? 3)) continue;
    const rest = words.slice(i, i + 6);
    const lift = /\?/.test(rest) ? 1.18 : /!/.test(rest) ? 1.1 : 1 + Math.sin(state.n * 1.7) * 0.05;
    syllable(v, ch, { lift });
  }
}
