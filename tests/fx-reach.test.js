// Effects stay with the character (2026-11-25, after the player: "some emotions the effects are
// waaaay not close to the character"). Every rigged monster's idle act and its scene moods (happy,
// sad, angry, talking, asleep) are drawn on a recording screen: everything it paints is measured
// against its own body (its calm pose), and nothing (a heart, a note, a z, a tear, a sweat drop) may
// drift more than REACH body heights away from it. Attacks are left out: a splash or a bolt is meant
// to fly off. And in story scenes, a monster's emotes and speech bubbles go over its drawn head (its
// data height was off by up to half its size on the scaled bosses: marks landed on their faces).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const { installFakeScreen } = await import('./support/fake-screen.js');
installFakeScreen();
const { ARTS } = await import('../src/render/mobs/index.js');
const { MOBS } = await import('../src/data/mobs.js');

// How far (in body heights, past the body's box) an effect may stray.
const REACH = 0.6;
// Not emotions but part of a little scene, meant to come from farther off (each says what it is).
const SCENERY = {
  mossowlet: 'a leaf blowing past on the breeze, which it watches go by',
};

// A recording 2D context: a full transform, and the box of everything painted since `clear()`.
function recorder() {
  let T = [1, 0, 0, 1, 0, 0];
  const stack = [];
  let path = [];
  let box = null;
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  const at = (x, y) => [T[0] * x + T[2] * y + T[4], T[1] * x + T[3] * y + T[5]];
  const ctx = { globalAlpha: 1, lineWidth: 1, font: '10px sans-serif' };
  const paint = (pts) => {
    if (ctx.globalAlpha < 0.15) return;
    for (const [x, y] of pts) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      box = box ? [Math.min(box[0], x), Math.min(box[1], y), Math.max(box[2], x), Math.max(box[3], y)] : [x, y, x, y];
    }
  };
  const ring = (x, y, rx, ry = rx) => [at(x - rx, y), at(x + rx, y), at(x, y - ry), at(x, y + ry)];
  const rect = (x, y, w, h) => [at(x, y), at(x + w, y), at(x, y + h), at(x + w, y + h)];
  const size = () => Number(/(\d+(?:\.\d+)?)px/.exec(ctx.font)?.[1] ?? 10);
  Object.assign(ctx, {
    save: () => stack.push({ T, a: ctx.globalAlpha, f: ctx.font }),
    restore: () => {
      const s = stack.pop();
      if (s) ({ T, a: ctx.globalAlpha, f: ctx.font } = s);
    },
    translate: (x, y) => { T = mul(T, [1, 0, 0, 1, x, y]); },
    scale: (x, y = x) => { T = mul(T, [x, 0, 0, y, 0, 0]); },
    rotate: (r) => { T = mul(T, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]); },
    transform: (a, b, c, d, e, f) => { T = mul(T, [a, b, c, d, e, f]); },
    setTransform: (a, b, c, d, e, f) => { T = typeof a === 'object' ? [a.a, a.b, a.c, a.d, a.e, a.f] : [a, b, c, d, e, f]; },
    resetTransform: () => { T = [1, 0, 0, 1, 0, 0]; },
    getTransform: () => new DOMMatrix(T),
    beginPath: () => { path = []; },
    moveTo: (x, y) => path.push(at(x, y)),
    lineTo: (x, y) => path.push(at(x, y)),
    quadraticCurveTo: (cx, cy, x, y) => path.push(at(x, y)),
    bezierCurveTo: (a, b, c, d, x, y) => path.push(at(x, y)),
    arc: (x, y, r) => path.push(...ring(x, y, r)),
    ellipse: (x, y, rx, ry) => path.push(...ring(x, y, rx, ry)),
    rect: (x, y, w, h) => path.push(...rect(x, y, w, h)),
    roundRect: (x, y, w, h) => path.push(...rect(x, y, w, h)),
    closePath: () => {},
    fill: () => paint(path),
    stroke: () => paint(path),
    fillRect: (x, y, w, h) => paint(rect(x, y, w, h)),
    strokeRect: (x, y, w, h) => paint(rect(x, y, w, h)),
    clearRect: () => {},
    fillText: (t, x, y) => paint(rect(x - size() / 2, y - size(), size(), size())),
    strokeText: (t, x, y) => paint(rect(x - size() / 2, y - size(), size(), size())),
    drawImage: (img, ...v) => {
      const [x, y, w, h] = v.length >= 8 ? v.slice(4, 8) : v.length >= 4 ? v : [v[0], v[1], img.width ?? 0, img.height ?? 0];
      paint(rect(x, y, w, h));
    },
    measureText: (t) => ({ width: String(t).length * size() * 0.5 }),
    createLinearGradient: () => ({ addColorStop() {} }),
    createRadialGradient: () => ({ addColorStop() {} }),
    createPattern: () => ({ setTransform() {} }),
    getImageData: (x, y, w, h) => ({ width: w, height: h, data: new Uint8ClampedArray(Math.max(1, w * h * 4)) }),
    clip: () => {},
    clear: () => { box = null; },
    box: () => box,
  });
  return new Proxy(ctx, { get: (t, k) => (k in t ? t[k] : () => {}) });
}

const defOf = {};
for (const d of Object.values(MOBS)) defOf[d.art] ??= d;

// The farthest any frame of its act or moods paints from its calm body, in body heights.
function strayOf(art) {
  const rig = ARTS[art].rig;
  const def = defOf[art];
  const ctx = recorder();
  const m = { def, hp: def.hp, uid: 0, x: 0, y: 0, dir: 1, state: 'idle', attackAt: -99, gloatAt: -99, aggroUntil: 0, odo: 0, flash: 0, phase: 0 };
  const a = { t: 0, now: 0, dt: 0.1, mood: 'calm', moving: false, mo: {}, hurtAgo: 9, flip: false, flash: 0, alpha: 1 };
  const draw = (t) => {
    a.t = a.now = t;
    ctx.clear();
    ctx.resetTransform();
    rig.draw(ctx, m, a);
    return ctx.box();
  };
  const body = draw(0);
  if (!body) return null;
  const bh = Math.max(8, -body[1]);
  let worst = { d: 0 };
  const look = (b, t, label) => {
    if (!b) return;
    const dx = Math.max(body[0] - b[0], b[2] - body[2], 0);
    const dy = Math.max(body[1] - b[1], b[3] - body[3], 0);
    const d = Math.max(dx, dy) / bh;
    if (d > worst.d) worst = { d, t, label };
  };
  for (let t = 0.1, i = 0; t <= 40; t += 0.1, i++) {
    const b = draw(t);
    if (i % 5 === 0) look(b, t, 'act');
  }
  for (const md of ['happy', 'sad', 'angry', 'talk', 'sleep']) {
    m.cine = { mood: md };
    a.mood = md === 'sleep' ? 'calm' : md;
    for (let k = 0; k < 20; k++) {
      const b = draw(41 + k * 0.1);
      if (k % 5 === 4) look(b, 41 + k * 0.1, md);
    }
  }
  return worst;
}

const RIGGED = Object.keys(ARTS).filter((a) => ARTS[a]?.rig && defOf[a]);
// (FX_DUMP=1: every monster's worst, for tuning)
if (process.env.FX_DUMP) for (const art of RIGGED) {
  const w = strayOf(art);
  console.log(art, w ? `${w.d.toFixed(2)} ${w.label} ${w.t?.toFixed(1)}` : '-');
}

test('the effects check draws every rigged monster', () => {
  assert.ok(RIGGED.length > 100, `only ${RIGGED.length}`);
});

test('emotion effects stay close to the character (act and moods)', () => {
  const bad = [];
  for (const art of RIGGED) {
    const w = strayOf(art);
    if (w && w.d > REACH && !SCENERY[art]) bad.push(`${art}: ${w.d.toFixed(2)} body heights away (${w.label}, ${w.t.toFixed(1)} s)`);
  }
  assert.deepEqual(bad, []);
});

test('in story scenes, emotes and speech bubbles go over a rigged monster’s drawn head', () => {
  const cut = readFileSync('src/ui/cutscene.js', 'utf8');
  assert.ok(/const actorAt = \(world, who\) => \{[\s\S]*?rigTop\(/.test(cut), 'scene actors are not measured');
  assert.ok(readFileSync('src/world/director.js', 'utf8').includes('mob: m }'), 'a scene actor no longer says which monster it is');
});
