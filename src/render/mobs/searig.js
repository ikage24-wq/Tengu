// The fin rig (2026-11): the Sunken Aquarium Palace's swimmers. The manor rig's upper body (spine,
// neck, head, two-bone arms; manorrig.js) on a mermaid tail in place of legs: a chain of tail bones
// from the hips to the fluke. A tail pose is the chain's base angle and its curl; a wave runs down
// the chain from the hips (phase `ph`), stronger toward the tip, so the swim reads as one motion
// travelling through the body rather than a wag. Angles: 0 is straight down, + sweeps back (-x).
// Arms, head and costume work as on the manor rig.

import { KIT } from './maidens.js';
import { mix } from './kit.js';

const { oband, fband, ooval, dot, opoly, round, lerp } = KIT;

// The tail's bones: points from the hip, `n` segments over `len`.
// tail: { base, curl, wave, len, n } (wave: how far the swim wave swings, in radians at the tip)
export function tailChain(hip, t, ph) {
  const n = t.n ?? 6;
  const pts = [hip];
  let [x, y] = hip;
  let a = t.base ?? 0;
  for (let i = 1; i <= n; i++) {
    const u = i / n;
    a += (t.curl ?? 0) / n + Math.sin(ph - i * 0.85) * (t.wave ?? 0.3) * u * 0.55;
    const seg = (t.len ?? 34) / n;
    x -= Math.sin(a) * seg;
    y += Math.cos(a) * seg;
    pts.push([x, y]);
  }
  return { pts, tipA: a };
}

// A drawn mermaid tail along the chain: tapered, banded with scale rows, a pale belly stripe on the
// leading edge, a fin frill at the hips and a two-lobed fluke that flutters behind the wave.
// C: { tail, tailDk, tailLt, fin, finDk }
export function drawTail(chain, w0, C, ph, o = {}) {
  const { pts, tipA } = chain;
  const out = [...oband(pts, (t) => lerp(w0, w0 * 0.28, t ** 0.85), C.tail, 4)];
  const sp = KIT.spline(pts, 4);
  // Shade on the back edge, light on the belly.
  out.push(fband(sp.map(([x, y]) => [x - w0 * 0.22, y]), (t) => lerp(w0 * 0.34, w0 * 0.1, t), C.tailDk, 1));
  out.push(fband(sp.slice(0, Math.round(sp.length * 0.8)).map(([x, y]) => [x + w0 * 0.24, y]), (t) => lerp(w0 * 0.24, w0 * 0.08, t), C.tailLt, 1));
  // Scale rows: little arcs every few steps down the tail.
  for (let i = 2; i < sp.length - 3; i += 3) {
    const [x, y] = sp[i];
    const t = i / sp.length;
    const r = lerp(w0, w0 * 0.3, t) * 0.32;
    out.push(fband(KIT.arcPts(x, y - r * 0.4, r, r * 0.6, 20, 160, 4), 0.35, C.tailDk, 1));
  }
  // The fluke: two lobes swept back from the tip, fluttering a beat behind the wave.
  const [tx, ty] = pts[pts.length - 1];
  const flap = Math.sin(ph - 5.4) * 0.35;
  const fl = o.fluke ?? w0 * 1.15;
  for (const s of [-1, 1]) {
    const a = tipA + s * (0.75 + flap * s);
    const ex = tx - Math.sin(a) * fl;
    const ey = ty + Math.cos(a) * fl;
    const mx = (tx + ex) / 2 + Math.cos(a) * fl * 0.32 * s;
    const my = (ty + ey) / 2 + Math.sin(a) * fl * 0.32 * s;
    out.push(...opoly(round([[tx, ty], [mx, my], [ex, ey], [lerp(tx, ex, 0.55), lerp(ty, ey, 0.55)]], 2), s < 0 ? C.fin : C.finDk));
    out.push(fband([[tx, ty], [lerp(tx, ex, 0.8), lerp(ty, ey, 0.8)]], 0.35, mix(C.fin, '#ffffff', 0.4), 1));
  }
  // A frill of fin where the tail meets the hips.
  const [hx, hy] = pts[0];
  for (let k = 0; k < 4; k++) out.push(...ooval(hx - 3.6 + k * 2.4, hy + 1.6 + (k % 2) * 0.6, 1.8, 1.2, k % 2 ? C.fin : C.finDk, 0.3 * (k - 1.5), 0.3));
  return out;
}

// A drift of bubbles rising from (x, y), on the creature's own clock.
export function bubbles(x, y, f, n, c, k = 3) {
  const out = [];
  for (let i = 0; i < k; i++) {
    const u = ((f / n) + i / k) % 1;
    out.push(...ooval(x + Math.sin(u * 7 + i) * 2, y - u * 16, 0.6 + u * 0.9, 0.6 + u * 0.9, c, 0, 0.25));
  }
  return out;
}

export { dot };
