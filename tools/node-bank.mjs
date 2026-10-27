// Loads the sample bank in node (decoding the strips with ffmpeg), for previews and tools.
import { execFileSync } from 'child_process';
import path from 'path';
import { MANIFEST } from '../src/audio/manifest.js';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const decode = (file, sr) => {
  const raw = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', path.join(ROOT, file), '-ac', '1', '-ar', String(sr), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.length));
};
const offsetOf = (x, sr) => {
  for (let i = 0; i < sr; i++) if (Math.abs(x[i]) > 0.45) return i / sr - MANIFEST.mark;
  return 0;
};
export function nodeBank() {
  const inst = {};
  for (const [name, m] of Object.entries(MANIFEST.inst)) {
    const x = decode(m.file, 24000);
    inst[name] = { ...m, data: x, scale: 1, sr: 24000, offset: offsetOf(x, 24000), lead: MANIFEST.lead };
  }
  const x = decode(MANIFEST.sfx.file, 44100);
  return { inst, sfx: { ...MANIFEST.sfx, data: x, scale: 1, sr: 44100, offset: offsetOf(x, 44100), lead: MANIFEST.lead } };
}
