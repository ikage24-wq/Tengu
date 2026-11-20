// Rig kit: small helpers every live-rig monster uses (shapes, the house face, step phases, stills).
import { E, T, F, stroke } from './kit.js';
import { simpleEye, deadEye, tear, vein } from './faces.js';
import { part, partBare, smooth, clamp, TAU } from './rig.js';
import { sprite } from '../pixel.js';

export const D2R = Math.PI / 180;
export const INK = '#2e1c26';
export const fr = (x) => ((x % 1) + 1) % 1;
// Shared helpers for the live-rig monsters (the Chapter 3 Hollow rigs grew these; the manor's use
// them from here).

export const ov = (cx, cy, rx, ry, deg, c, n = 18) => {
  const r = deg * D2R;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx;
    const y = Math.sin(a) * ry;
    pts.push([cx + x * Math.cos(r) - y * Math.sin(r), cy + x * Math.sin(r) + y * Math.cos(r)]);
  }
  return T(pts, c);
};
export const arcP = (cx, cy, rx, ry, a0, a1, n = 10) => {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = (a0 + ((a1 - a0) * i) / n) * D2R;
    out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]);
  }
  return out;
};
export const taper = (pts, w0, w1, c) => {
  const l = [];
  const r = [];
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[Math.max(0, i - 1)];
    const [bx, by] = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(bx - ax, by - ay) || 1;
    const nx = -(by - ay) / d;
    const ny = (bx - ax) / d;
    const w = (w0 + (w1 - w0) * (i / (pts.length - 1))) / 2;
    l.push([x + nx * w, y + ny * w]);
    r.push([x - nx * w, y - ny * w]);
  });
  return T([...l, ...r.reverse()], c);
};
export const pairOf = (pre) => (key, w, h, shapes, pad = 3, padB = undefined) => [() => part(`${pre}|${key}`, w, h, shapes, pad, 2, padB), () => partBare(`${pre}|${key}`, w, h, shapes, pad, 2, padB)];
export const faceSprite = (key, w, h, shapes) => sprite(`rig|${key}`, () => ({ w, h, res: 2, soft: 'cel', crisp: true, bare: true, pad: 3, shapes: shapes() }));
export const hold = (u, a, b, c, d) => (u < a || u > d ? 0 : u < b ? smooth((u - a) / (b - a)) : u < c ? 1 : 1 - smooth((u - c) / (d - c)));
// How far into a moment that started at `at` we are, 0..1 over `dur` (0 outside it), with an eased
// rise over `ein` and fall over `eout`.
export const window1 = (now, at, dur, ein = 0.25, eout = 0.35) => {
  if (at == null) return 0;
  const s = now - at;
  if (s < 0 || s > dur) return 0;
  return Math.min(smooth(clamp(s / ein, 0, 1)), smooth(clamp((dur - s) / eout, 0, 1)));
};
export const stepPhase = (m, a, key, stride, cap = 600) => {
  const st = (a.mo.rig ??= {});
  const odo = m.odo ?? 0;
  const dt = Math.max(1e-3, a.dt);
  const raw = Math.min(cap, Math.abs(odo - (st[`${key}O`] ?? odo)) / dt);
  st[`${key}O`] = odo;
  st[`${key}V`] = (st[`${key}V`] ?? 0) + (raw - (st[`${key}V`] ?? 0)) * Math.min(1, dt * 5);
  st[`${key}U`] = ((st[`${key}U`] ?? 0) + (st[`${key}V`] / stride) * dt) % 1;
  return st[`${key}U`];
};
export const pawStep = (u, ph, stride, duty, lift) => {
  const R = (stride * duty) / 2;
  const q = (((u + ph) % 1) + 1) % 1;
  if (q < duty) return [R - (2 * R * q) / duty, 0];
  const s = (q - duty) / (1 - duty);
  return [-R + 2 * R * smooth(s), Math.sin(Math.PI * s) * lift];
};
export const moveOf = (m, kind) => (m.move?.kind === kind ? m.move : null);
export const shift = (shapes, dx, dy) => shapes.filter(Boolean).map((s) => (s.t === 'p' ? { ...s, x: 0, y: 0, pts: s.pts.map(([x, y]) => [x + (s.x ?? 0) + dx, y + (s.y ?? 0) + dy]) } : { ...s, x: s.x + dx, y: s.y + dy }));
export const rot = (shapes, ang, px, py) => {
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const R2 = ([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c];
  return shapes.filter(Boolean).map((sh) => (sh.t === 'p' ? { ...sh, x: 0, y: 0, pts: sh.pts.map(([x, y]) => R2([x + (sh.x ?? 0), y + (sh.y ?? 0)])) } : { ...sh, ...(([x, y]) => ({ x, y }))(R2([sh.x, sh.y])) }));
};
export const put = (shapes, [pvx, pvy], x, y, deg = 0) => rot(shift(shapes, x - pvx, y - pvy), deg * D2R, x, y);
export const MOODS = new Set(['idle', 'angry', 'hurt', 'happy', 'blink', 'dead', 'shout', 'sleep', 'dizzy']);
// A boss's own face for a mood, from its own face map; a mood it has no face for takes its nearest own
// face (closed eyes for sleep, its hurt face for dizzy and so on), never the shared face.
export const FACE_NEAR = { sleep: 'blink', dizzy: 'hurt', dead: 'hurt', shout: 'angry', blink: 'idle', sad: 'hurt', cross: 'angry', happy: 'idle' };
export const ownFace = (map, mood) => (map[mood] ?? map[FACE_NEAR[mood]] ?? map.idle ?? map.sleep)();
export const moodOf = (a, extra = null) => {
  if (a.face === 'dead') return 'dead';
  if (extra === 'dizzy') return extra;
  if (a.ph.strike > 0.25) return 'shout';
  if (a.ph.atk || a.ph.antic > 0.3) return 'angry';
  if (extra) return extra;
  if (a.face === 'idle' && (a.t + (a.uidOff ?? 0)) % 4.7 < 0.14) return 'blink';
  return MOODS.has(a.face) ? a.face : 'idle';
};
export const faceShapes = (mood, o) => {
  const { eyes, mouth, blush, iris, lid = 0.3, k = 1, lashes = 0 } = o;
  const out = [];
  if (mood === 'dead') for (const [x, y, w] of eyes) out.push(...deadEye(x, y, w * 0.75, { c: INK, th: 0.5 * k }));
  else if (mood === 'sleep') for (const [x, y, w] of eyes) out.push(...stroke(arcP(x, y - 0.4 * k, w, w * 0.45, 20, 160, 6), 0.5 * k, INK));
  else if (mood === 'dizzy') for (const [x, y, w] of eyes) {
    const pts = [];
    for (let i = 0; i <= 16; i++) pts.push([x + Math.cos(i * 0.75) * w * (i / 16) * 1.1, y + Math.sin(i * 0.75) * w * (i / 16) * 1.1]);
    out.push(...stroke(pts, 0.42 * k, INK));
  } else {
    const em = mood === 'shout' ? 'angry' : mood;
    for (const [x, y, w, h, s] of eyes) out.push(...simpleEye(x, y, { s, w, h, mood: em, iris, ink: INK, lid: em === 'idle' ? lid : 0, wing: lashes }));
  }
  if (blush && mood !== 'dead') for (const [x, y, rx] of blush) out.push(F(E(x, y, rx, rx * 0.5, '#ff9fb4')));
  const [mx, my, mw] = mouth;
  if (mood === 'shout') out.push(F(E(mx, my + 0.4 * k, mw * 0.55, mw * 0.5, '#7a3040')), F(E(mx, my + 0.8 * k, mw * 0.32, mw * 0.2, '#ff9ab0')));
  else if (mood === 'happy') out.push(...stroke(arcP(mx, my - 0.3 * k, mw * 0.5, mw * 0.4, 20, 160, 6), 0.42 * k, INK));
  else if (mood === 'sleep') out.push(F(E(mx, my, mw * 0.22, mw * 0.18, '#7a3040')));
  else if (mood === 'dizzy') out.push(...stroke([[mx - mw * 0.5, my], [mx - mw * 0.2, my + 0.5 * k], [mx + mw * 0.1, my - 0.2 * k], [mx + mw * 0.45, my + 0.4 * k]], 0.42 * k, INK), F(E(mx + mw * 0.15, my + 1.1 * k, mw * 0.18, mw * 0.25, '#ff8aa8')));
  else if (mood === 'angry' || mood === 'hurt') out.push(...stroke(arcP(mx, my + 0.6 * k, mw * 0.45, mw * 0.3, 200, 340, 6), 0.42 * k, INK));
  else out.push(...stroke([[mx - mw * 0.45, my], [mx, my + 0.5 * k], [mx + mw * 0.45, my - 0.1 * k]], 0.4 * k, INK));
  if (mood === 'hurt') out.push(...tear(eyes[0][0] + 0.6 * k, eyes[0][1] + 1.6 * k, 0.8 * k, { type: 'stream', len: 2 }));
  if (mood === 'angry') out.push(...vein(eyes[0][0] - 3.6 * k, eyes[0][1] - 5 * k, 0.7 * k));
  return out;
};


// ---------- Live extras for fx hooks (drawn fresh each frame, never cached) ----------
// A round dot (a drop, a speck of dust).
export const dot = (ctx, a, x, y, r, al, c = '#efe6f8') => {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.globalAlpha = a.alpha * al;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
};
// A soft round puff of steam or mist.
export const puff = (ctx, a, x, y, r, al, rgb = '255,255,255') => {
  if (al <= 0.01 || r <= 0.2) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb},${al * a.alpha})`);
  g.addColorStop(0.6, `rgba(${rgb},${al * a.alpha * 0.5})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
};
// A four-pointed twinkle.
export const sparkle = (ctx, a, x, y, r, al, c = '#ffffff') => {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.globalAlpha = a.alpha * al;
  ctx.fillStyle = c;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
};
// A music note.
export const note = (ctx, a, x, y, al, c = '#ffffff', size = 7) => {
  if (al <= 0.01) return;
  ctx.globalAlpha = a.alpha * al;
  ctx.fillStyle = c;
  ctx.font = `bold ${size}px sans-serif`;
  ctx.fillText('\u266a', x, y);
};
