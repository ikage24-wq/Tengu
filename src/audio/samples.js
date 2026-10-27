// The sample bank: the recorded instruments and effects (assets/audio, built by
// tools/build-audio.mjs), fetched and decoded once, as soon as the page loads (no click needed:
// decoding uses an offline audio context). Instruments are decoded at 24 kHz and kept as 16-bit
// numbers to save memory; effects at 44.1 kHz, also as 16-bit numbers.
//
// The bank: { inst: { name: { data, scale, sr, offset, lead, slot, notes, sustain } },
//   sfx: { data, scale, sr, offset, lead, items: { name: [[start, length], ...] } } }.
// `offset` is how far the browser's decoder shifted the file (found from the click each strip
// starts with), so every slot lines up exactly.

import { MANIFEST } from './manifest.js';

const INST_SR = 24000;
const SFX_SR = 44100;

// Where the alignment click landed, minus where it was put.
function offsetOf(x, sr) {
  for (let i = 0; i < Math.min(x.length, sr); i++) if (Math.abs(x[i]) > 0.45) return i / sr - MANIFEST.mark;
  return 0;
}

async function decode(url, sr) {
  const bytes = await (await fetch(url)).arrayBuffer();
  const OAC = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  const ctx = new OAC(1, 1, sr);
  const buf = await new Promise((ok, no) => ctx.decodeAudioData(bytes, ok, no));
  return buf.getChannelData(0);
}

const toInt16 = (x) => {
  const out = new Int16Array(x.length);
  for (let i = 0; i < x.length; i++) out[i] = Math.max(-32767, Math.min(32767, Math.round(x[i] * 32767)));
  return out;
};

let loading = null;
// Loads everything (once, unless `fresh`); resolves to the bank.
export function loadSamples(fresh = false, base = new URL('../../', import.meta.url)) {
  if (fresh) loading = null;
  loading ??= (async () => {
    const inst = {};
    await Promise.all(
      Object.entries(MANIFEST.inst).map(async ([name, m]) => {
        const x = await decode(new URL(m.file, base), INST_SR);
        inst[name] = { ...m, data: toInt16(x), scale: 1 / 32767, sr: INST_SR, offset: offsetOf(x, INST_SR), lead: MANIFEST.lead };
      }),
    );
    const x = await decode(new URL(MANIFEST.sfx.file, base), SFX_SR);
    const sfx = { ...MANIFEST.sfx, data: toInt16(x), scale: 1 / 32767, sr: SFX_SR, offset: offsetOf(x, SFX_SR), lead: MANIFEST.lead };
    return { inst, sfx };
  })();
  return loading;
}

// The arrays to hand to a worker (so they move rather than copy).
export const transferables = (bank) => [...Object.values(bank.inst).map((i) => i.data.buffer), bank.sfx.data.buffer];

// One recorded effect: a variant of `name` (picked by `pick`, 0-1), as a Float32Array at the
// bank's rate, or null.
export function effectSamples(bank, name, pick = 0) {
  const items = bank?.sfx?.items?.[name];
  if (!items) return null;
  const [start, len] = items[Math.min(items.length - 1, Math.floor(pick * items.length))];
  const s = bank.sfx;
  const a = Math.round((s.offset + start) * s.sr);
  const out = new Float32Array(Math.round(len * s.sr));
  for (let i = 0; i < out.length; i++) out[i] = (s.data[a + i] ?? 0) * s.scale;
  return out;
}
