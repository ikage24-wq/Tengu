// Jitter probe (2026-11-26, after the Porcelain Doll's "the parts bug out so much"): any rigged
// monster, played through the mob stage's own script (tools/mob-stage.html: its idle act, walking
// both ways, its attacks, two hits, a nap (a boss: its cutscene beats), beaten, and the loop back to
// the start, a teleport) on the stand-in test screen, with a frame time that is steady (1/144, 1/60,
// 1/30) or wanders between those with 0.1 s spikes. The general form of tools/zz-porcelaindollprobe.mjs.
//
// Nothing per monster: the shared rig engine (render/mobs/rig.js makeRig) is instrumented as it loads
// (a loader hook adds a few calls to a copy in memory; the file itself is never touched), so every
// part of every rig is followed: its own picture (its pivot and two points along its axes) and every extra drawn
// with it (a dress's paths and pictures in a part's paint, under or over it, and in the rig's
// under/fx, told apart by the line of code that draws them). Each is logged relative to the rig's own
// origin (its feet, so the stage's walking, the engine's hops and a beaten monster's tumble are taken
// out), and each frame checked against where its last motion would carry it: a spring or an eased move
// curves smoothly, a pop lands far off that line. The rig's origin is followed too, in the world, for
// the engine's hops. Flags are sorted into the engine's own sharp moments, which every monster has
// (the one-frame hit flinch, the turn-round kick, the defeat's knock-up, a strike's start), and the
// monster's own: a pop (off a smooth curve too) or 'fast' (a quick swing that still curves, a wing's
// beat). Also logged: soft layers slamming into their stops, parts that never settle in the idle.
// (The walk goes out from where it stood and back: the stage's own jump to one end at the walk's
// start reads as a 30 px step and spikes everything that follows its speed.)
//
//   node tools/jitter-probe.mjs <mobId ...|--all> [--sched=mixed,60] [--idle=33] [--strip=key@time]
//        [--worst=12] [--keys] [--json] [--fast] [--skip=regex] [--soft=layer] [--orig=dir]
// Run monsters one after another (never in parallel: keep the CPU free).

import { registerHooks } from 'node:module';
import { pathToFileURL } from 'node:url';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// (--orig=dir: files kept from before a change, laid out as under src/render/ (dir/<folder>/x.js,
// dir/mobs/rig.js, dir/monsters.js...): each one found there is played in place of the game's own,
// to measure "before" against "after" at any time)
const ORIG_ARG = process.argv.find((v) => v.startsWith('--orig='))?.slice(7);
const ORIG = ORIG_ARG ? pathToFileURL(ORIG_ARG.replace(/[\\/]*$/, '/')).href : null;
const KEPT = new Map();
const kept = (rest) => (KEPT.has(rest) ? KEPT.get(rest) : KEPT.set(rest, existsSync(fileURLToPath(ORIG + rest))).get(rest));
const SRC = new URL('../src/render/', import.meta.url).href;

// ---------- The rig engine, instrumented as it loads ----------
let hooked = false;
registerHooks({
  resolve(specifier, context, next) {
    if (!ORIG) return next(specifier, context);
    // (a file in a kept folder imports the game's own files as if it sat in its own place)
    const parent = context.parentURL?.startsWith(ORIG) ? SRC + context.parentURL.slice(ORIG.length) : context.parentURL;
    const r = next(specifier, { ...context, parentURL: parent });
    if (r.url.startsWith(SRC)) {
      const rest = r.url.slice(SRC.length);
      if (kept(rest)) return { ...r, url: ORIG + rest };
    }
    return r;
  },
  load(url, context, next) {
    const r = next(url, context);
    if (!/\/mobs\/rig\.js$/.test(url)) return r;
    let src = String(r.source);
    const sub = (a, b, optional = false) => {
      if (!src.includes(a)) {
        if (optional) return;
        throw new Error(`jitter-probe: rig.js changed, can't find: ${a}`);
      }
      src = src.replace(a, b);
    };
    sub('export function makeRig(spec) {', 'export function makeRig(spec) {\n  const __r = makeRig0(spec);\n  const __d = __r.draw;\n  __r.draw = function (ctx, m, a) {\n    globalThis.__jit?.begin(ctx, m, a);\n    try { return __d.call(this, ctx, m, a); } finally { globalThis.__jit?.end(); }\n  };\n  return __r;\n}\nfunction makeRig0(spec) {');
    sub('spec.under(ctx, m, a, S, matOf);', 'globalThis.__jit?.z("(under)");\n        spec.under(ctx, m, a, S, matOf);');
    sub('const M = matOf(p);', 'const M = matOf(p);\n        globalThis.__jit?.z(p.name);');
    sub('spec.fx(ctx, m, a, S, matOf);', 'globalThis.__jit?.z("(fx)");\n        spec.fx(ctx, m, a, S, matOf);');
    // (a soft layer slamming into its stop: the engine's hard limit, a snap whenever it's reached)
    sub('s.th = Math.sign(s.th) * max;', 's.th = Math.sign(s.th) * max;\n      globalThis.__jit?.stop(key);', true);
    // (--soft=layer: that layer's swing logged every frame: its angle, speed, goal and the pushes on it)
    sub('  if (!Number.isFinite(s.th)) Object.assign(s, { th: 0, w: 0 });', '  if (!Number.isFinite(s.th)) Object.assign(s, { th: 0, w: 0 });\n  globalThis.__jit?.soft?.(key, s, goal, pose, pa, a);', true);
    hooked = true;
    return { ...r, source: src };
  },
});

const ROOT = new URL('../', import.meta.url);
const imp = (p) => import(new URL(p, ROOT).href);
const { installFakeScreen, fakeCanvas } = await imp('tests/support/fake-screen.js');
installFakeScreen();
const { MOBS } = await imp('src/data/mobs.js');
const { drawMonster } = await imp('src/render/monsters.js');
const { ARTS } = await imp('src/render/mobs/index.js');
const { setHd, gfx, nextFrame } = await imp('src/render/pixel.js');
const Z = 6;
setHd(true, Z);
gfx.noBudget = true;

// The monsters remade in their own folders (src/render/<folder>/), by mob id.
export const REMADE = ['bonbon', 'candlebride', 'snailbun', 'brownie', 'understudy', 'leafling', 'sapling', 'puffle', 'geminighosts', 'gnarlroot', 'harvmouse', 'crystalslime', 'lambkin', 'macgoblin', 'scorpip', 'peppermint', 'mosstort', 'mothercapper', 'mossowlet', 'pebblet', 'bumble', 'pumpgob', 'queenbee', 'rootling', 'noodledragon', 'sporecap', 'strawhog', 'whalestorm', 'tanukipicker', 'thornback', 'sproutling', 'tuskar', 'boarlet', 'lanternghost', 'porcelaindoll'];

// ---------- The recorder: a screen that remembers where things are drawn ----------
// (extras are told apart by the line of code drawing them; --fast: by their kind and paint instead, quicker
// but two extras of one paint can swap numbers as one comes or goes, a false jump)
const SITES = !process.argv.includes('--fast');
const SOFT_LOG = process.argv.find((v) => v.startsWith('--soft='))?.slice(7) ?? null;
const SKIP = process.argv.find((v) => v.startsWith('--skip='))?.slice(7);
const SKIP_RE = SKIP ? new RegExp(SKIP) : null;
const D = { stack: [], rigs: 0, ops: null, probeM: null, zoneName: null, counts: null };
const siteOf = () => {
  const keep = Error.stackTraceLimit;
  const prep = Error.prepareStackTrace;
  Error.stackTraceLimit = 8;
  Error.prepareStackTrace = (e, frames) => frames;
  const o = {};
  Error.captureStackTrace(o, siteOf);
  const s = o.stack;
  Error.stackTraceLimit = keep;
  Error.prepareStackTrace = prep;
  // (the first two frames outside this probe and the sprite blitter: a helper and who called it)
  const out = [];
  for (let i = 0; i < s.length && out.length < 2; i++) {
    const f = s[i].getFileName() ?? '';
    if (f.includes('jitter-probe') || f.endsWith('pixel.js')) continue;
    out.push(`${f.slice(f.lastIndexOf('/') + 1)}:${s[i].getLineNumber()}`);
  }
  return out.join('<') || '?';
};
globalThis.__jit = {
  begin(ctx, m, a) {
    const top = D.stack.at(-1);
    const on = ctx === D.ctx && (m === D.probeM || top?.on);
    D.stack.push({ on, inv: ctx.getTransform().inverse(), origin: ctx.getTransform(), id: on ? `r${D.rigs++}` : null, zone: '-' });
    if (on && D.stack.length === 1) D.origin = ctx.getTransform().transformPoint({ x: 0, y: 0 });
  },
  end() {
    D.stack.pop();
  },
  soft(key, s, goal, pose, pa, a) {
    if (SOFT_LOG && key === SOFT_LOG && D.stack.at(-1)?.on && D.ops) console.log(`soft ${key} t=${a.now?.toFixed(3)} th=${((s.th * 180) / Math.PI).toFixed(1)} w=${s.w.toFixed(2)} goal=${((goal * 180) / Math.PI).toFixed(1)} pose=${((pose * 180) / Math.PI).toFixed(1)} pa=${((pa * 180) / Math.PI).toFixed(1)} ax=${(s.ax ?? 0).toFixed(0)} ay=${(s.ay ?? 0).toFixed(0)} aa=${(s.aa ?? 0).toFixed(1)}`);
  },
  stop(key) {
    if (D.stops && D.stack.at(-1)?.on) D.stops.add(key);
  },
  z(name) {
    const top = D.stack.at(-1);
    if (!top) return;
    top.zone = name.replace(/~.*$/, '');
    top.twin = name.includes('~');
  },
};
function rec(kind, pts, style = '', paint = 1) {
  const top = D.stack.at(-1);
  if (!top?.on || !D.ops || !pts.length) return;
  // (an extra is known by the line of code drawing it, or with --fast by its kind and paint)
  // (a part's picture is followed in its first pass only: its outlined and bare twins share one place)
  if (kind === 'img' && top.twin && top.zone !== '-') return;
  const site = kind === 'img' ? 'img' : SITES ? siteOf() : `${kind}:${style.replace(/^(rgba?\([^,]+,[^,]+,[^,]+),[^)]*\)/, '$1)')}`;
  const base = `${top.id}/${top.zone}/${site}`;
  const n = (D.counts[base] = (D.counts[base] ?? 0) + 1) - 1;
  const key = `${base}#${n}`;
  const L = pts.map((p) => {
    const q = top.inv.transformPoint(p);
    return [q.x / 1, q.y / 1];
  });
  // (how strongly it shows: a twinkle fading in from nothing may start anywhere)
  L.alpha = (D.ctx.globalAlpha ?? 1) * paint;
  D.ops.set(key, L);
}
// A screen point (rig drawing units = world px) for a local point under the current transform.
function recordingCtx() {
  const base = fakeCanvas(800, 600).getContext('2d');
  let path = [];
  const T = () => base.getTransform();
  const pt = (x, y) => {
    const q = T().transformPoint({ x, y });
    path.push({ x: q.x, y: q.y });
  };
  const hooks = {
    beginPath: () => (path = []),
    // (gradients remember their colours, so a glow fading out through its colours counts as faint)
    createLinearGradient: () => new Grad(),
    createRadialGradient: () => new Grad(),
    createConicGradient: () => new Grad(),
    // (the rig mirroring itself: facing left, or a twirl of its own)
    scale: (x, y = x) => {
      const top = D.stack.at(-1);
      if (top?.on && D.stack.length === 1 && top.zone === '-' && x < 0) D.rigFlip = true;
      base.scale(x, y);
    },
    moveTo: (x, y) => pt(x, y),
    lineTo: (x, y) => pt(x, y),
    quadraticCurveTo: (cx, cy, x, y) => (pt(cx, cy), pt(x, y)),
    bezierCurveTo: (a, b, c, d, x, y) => (pt(a, b), pt(c, d), pt(x, y)),
    arcTo: (a, b, x, y) => (pt(a, b), pt(x, y)),
    arc: (x, y) => pt(x, y),
    ellipse: (x, y) => pt(x, y),
    rect: (x, y, w, h) => pt(x + w / 2, y + h / 2),
    roundRect: (x, y, w, h) => pt(x + w / 2, y + h / 2),
    fill: (p) => {
      if (!p && path.length) rec('fill', [centroid(path)], styleKey(base.fillStyle), alphaOf(base.fillStyle));
    },
    stroke: (p) => {
      if (!p && path.length) rec('stroke', [centroid(path)], `${styleKey(base.strokeStyle)}/${base.lineWidth}`, alphaOf(base.strokeStyle));
    },
    fillRect: (x, y, w, h) => {
      const t = T();
      rec('rect', [t.transformPoint({ x: x + w / 2, y: y + h / 2 })], styleKey(base.fillStyle), alphaOf(base.fillStyle));
    },
    drawImage: (img, ...v) => {
      let x;
      let y;
      let w;
      let h;
      if (v.length >= 8) [, , , , x, y, w, h] = v;
      else if (v.length >= 4) [x, y, w, h] = v;
      else [x, y, w, h] = [v[0], v[1], img.width, img.height];
      const t = T();
      // (a part's own picture: its pivot, where the rig hangs it, and two points a little way out
      // along its own axes, so a turn shows as well as a move. Not its box's corners: many rigs draw
      // every piece in one body-sized box, and a turn about a pivot far inside it looked many times
      // bigger than the piece really moves. Any other picture: its middle, and the same two points.)
      const top = D.stack.at(-1);
      const part = top && !top.twin && !/^[-(]/.test(top.zone) && !D.counts?.[`${top.id}/${top.zone}/img`];
      const R = Math.max(3, Math.min(10, 0.25 * Math.min(Math.abs(w), Math.abs(h))));
      const [cx, cy] = part ? [0, 0] : [x + w / 2, y + h / 2];
      rec('img', [[cx, cy], [cx + R, cy], [cx, cy + R]].map(([px, py]) => t.transformPoint({ x: px, y: py })));
    },
  };
  return new Proxy(base, {
    get: (t, k) => (k in hooks ? hooks[k] : t[k]),
    set: (t, k, v) => {
      t[k] = v;
      return true;
    },
  });
}
class Grad {
  constructor() {
    this.stops = [];
  }
  addColorStop(o, c) {
    this.stops.push(c);
  }
}
const alphaOfColour = (c) => {
  const m = /rgba?(([^)]*))/.exec(String(c));
  if (m) {
    const v = m[1].split(/[ ,/]+/).filter(Boolean);
    return v.length > 3 ? Number(v[3]) : 1;
  }
  if (/^#[0-9a-f]{8}$/i.test(c)) return parseInt(c.slice(7), 16) / 255;
  return c === 'transparent' ? 0 : 1;
};
const alphaOf = (st) => (st instanceof Grad ? Math.max(0, ...st.stops.map(alphaOfColour)) : alphaOfColour(st));
const styleKey = (st) => (st instanceof Grad ? 'grad' : String(st));
const centroid = (P) => {
  let x = 0;
  let y = 0;
  for (const p of P) {
    x += p.x;
    y += p.y;
  }
  return { x: x / P.length, y: y / P.length };
};

// ---------- The stage's script ----------
function scriptOf(def, IDLE) {
  return def.boss
    ? [[IDLE, 'idle'], [2.6, 'walk', 1], [2.6, 'walk', -1], [0.8, 'idle'], [1.2, 'windup'], [1.6, 'blow'], [0.7, 'hit'], [0.9, 'hit'], [1, 'idle'], [3, 'freed:sad'], [2.6, 'freed:happy'], [1.6, 'give'], [2.4, 'after'], [2.2, 'die']]
    : [[IDLE, 'idle'], [2.6, 'walk', 1], [2.6, 'walk', -1], [0.8, 'idle'], [0.6, 'windup'], [1.3, 'blow'], [0.6, 'windup'], [1.3, 'blow'], [1.2, 'touch'], [0.7, 'hit'], [0.9, 'hit'], [1.2, 'idle'], [4.5, 'nap'], [1, 'idle'], [2.2, 'die']];
}
const freshMob = (def) => ({ def, x: 0, y: 0, hp: def.hp, dir: 1, state: 'idle', flash: 0, stagger: 0, phase: 0, age: 9, dying: 0, uid: 0, aggroUntil: 0, attackAt: -9, gloatAt: -9, windup: 0, odo: 0, spawn: { x: 0, y: 0 } });

const dtFor = (sched) => {
  let k = 0;
  return () => {
    k++;
    if (sched === '144') return 1 / 144;
    if (sched === '60') return 1 / 60;
    if (sched === '30') return 1 / 30;
    if (k % 97 === 0) return 0.1;
    return [1 / 144, 1 / 60, 1 / 30][Math.floor(k / 180) % 3];
  };
};

// Plays one monster through the script and returns every frame's record.
async function play(id, sched, IDLE) {
  const def = MOBS[id];
  if (!def) throw new Error(`no mob ${id}`);
  const ctx = recordingCtx();
  D.ctx = ctx;
  // (warmed up first: an art loading its pictures late gets them, then a fresh monster is filmed)
  for (let w = 0; w < 6; w++) {
    const mw = freshMob(def);
    D.probeM = mw;
    D.ops = null;
    ctx.setTransform(Z, 0, 0, Z, 400 * Z, 400 * Z);
    drawMonster(ctx, mw, 0, def.fly ? -6 : 0, 1 + w * 0.1, 1 + w * 0.1);
    await new Promise((r) => setTimeout(r, 5));
  }
  const m = freshMob(def);
  D.probeM = m;
  const SCRIPT = scriptOf(def, IDLE);
  const LENGTH = SCRIPT.reduce((a, s) => a + s[0], 0);
  let lastI = -1;
  let hitAt = -9;
  function act(t, now, dt) {
    let at = t % LENGTH;
    let i = 0;
    while (at > SCRIPT[i][0]) at -= SCRIPT[i++][0];
    const [dur, what, dir] = SCRIPT[i];
    const fresh = i !== lastI;
    lastI = i;
    m.state = what === 'walk' ? 'walk' : 'idle';
    if (what === 'walk') {
      m.dir = dir;
      const span = def.speed * dur;
      // (out from where it stood and back again: the stage jumps it to one end first, which the game
      // counts as a step of 30 px in one frame, a false start for everything that follows its speed)
      m.x = (dir > 0 ? 0 : span) + dir * at * def.speed;
    }
    if (i === 0) m.x = 0;
    m.windup = what === 'windup' ? Math.max(0.001, dur - at) : 0;
    if ((what === 'blow' || what === 'touch') && fresh) m.attackAt = now;
    if (what === 'hit' && fresh) {
      m.flash = 0.15;
      hitAt = now;
    }
    if (what === 'blow' && at > 0.4 && at < 0.45) m.gloatAt = now;
    m.flash = Math.max(0, m.flash - dt);
    m.habit = what === 'nap' ? { kind: 'nap', until: now + 1 } : null;
    if (what.startsWith('freed') || what === 'give' || what === 'after') {
      m.cine ??= {};
      Object.assign(m.cine, { freed: true, alpha: 1, mood: what === 'freed:sad' ? 'sad' : 'happy' });
      if (what === 'give' && fresh) m.cine.gave = now;
      if (what === 'freed:happy' && fresh) m.cine.star = true;
    } else if (m.cine && what !== 'die') m.cine = null;
    m.hp = what === 'die' || m.cine?.freed ? 0 : def.hp;
    m.dying = what === 'die' ? Math.min(at, 0.5) : 0;
    m.aggroUntil = what === 'windup' || what === 'blow' || what === 'touch' || what === 'hit' ? now + 2 : 0;
    return { what, at, i };
  }
  const dtOf = dtFor(sched);
  const rows = [];
  const END = LENGTH + 6;
  let t = 0;
  while (t < END) {
    const dt = dtOf();
    t += dt;
    const st = act(t, t, dt);
    nextFrame?.();
    ctx.setTransform(Z, 0, 0, Z, 400 * Z, 400 * Z);
    D.ops = new Map();
    D.stops = new Set();
    D.counts = {};
    D.rigs = 0;
    D.origin = null;
    D.rigFlip = false;
    drawMonster(ctx, m, m.x, def.fly ? -6 : 0, t, t);
    const o = D.origin ? [D.origin.x / Z - 400 - m.x, D.origin.y / Z - 400] : null;
    rows.push({ t, dt, ...st, x: m.x, flip: D.rigFlip, hitAgo: t - hitAt, atkAgo: t - (m.attackAt ?? -9), origin: o, ops: D.ops, counts: D.counts, stops: D.stops });
  }
  D.ops = null;
  return { rows, def, SCRIPT, LENGTH };
}

// ---------- The checks ----------
const isPart = (key) => key.endsWith('/img#0') && !key.includes('/(');
function analyse({ rows, def, SCRIPT }) {
  const flags = [];
  let flips = 0;
  let lastFlip = -9;
  const keys = new Set();
  // (--skip=regex: leave some keys out, to look past a known one)
  for (const r of rows) for (const k of r.ops.keys()) if (!SKIP_RE || !SKIP_RE.test(k)) keys.add(k);
  const bucketOf = (r) => {
    if (r.what === 'die' && r.at < 0.25) return 'defeat knock-up';
    if (r.hitAgo >= 0 && r.hitAgo < 0.12) return 'hit flinch';
    if (r.atkAgo >= 0 && r.atkAgo < 0.12) return 'strike start';
    if (r.t - lastFlip < 0.12) return 'turn kick';
    return 'own';
  };
  for (let j = 2; j < rows.length; j++) {
    const [r0, r1, r2] = [rows[j - 2], rows[j - 1], rows[j]];
    if (r2.flip !== r1.flip || r1.flip !== r0.flip) {
      if (r2.flip !== r1.flip) {
        flips++;
        lastFlip = r2.t;
      }
      continue;
    }
    // (the stage's loop: up again and home, a teleport by design)
    if (r2.i < r1.i || r1.i < r0.i) continue;
    if ((r1.what === 'die') !== (r2.what === 'die') || (r0.what === 'die') !== (r1.what === 'die')) continue;
    const bucket = bucketOf(r2);
    const k = r2.dt / r1.dt;
    const allow = 0.9 + 1800 * r2.dt * r2.dt;
    // (and two frames further back, for the curve test below)
    const ok = (r) => r && r.flip === r0.flip && r.i <= r0.i && (r.what === 'die') === (r0.what === 'die');
    const rm = j >= 3 && ok(rows[j - 3]) ? rows[j - 3] : null;
    const rmm = rm && j >= 4 && ok(rows[j - 4]) ? rows[j - 4] : null;
    // (Lagrange weights: the curve through the last few places, carried on to this frame)
    const lag = (ts) => ts.map((ti, a) => ts.reduce((w, tk, b) => (b === a ? w : (w * (r2.t - tk)) / (ti - tk)), 1));
    const W4 = rmm ? lag([rmm.t, rm.t, r0.t, r1.t]) : null;
    const W3 = rm ? lag([rm.t, r0.t, r1.t]) : null;
    const check = (key, p0, p1, p2, pm, pmm) => {
      if (!p0 || !p1 || !p2 || p0.length !== p1.length || p1.length !== p2.length) return;
      if (Math.min(p0.alpha ?? 1, p1.alpha ?? 1, p2.alpha ?? 1) < 0.25) return;
      let err = 0;
      let move = 0;
      for (let q = 0; q < p2.length; q++) {
        const px = p1[q][0] + (p1[q][0] - p0[q][0]) * k;
        const py = p1[q][1] + (p1[q][1] - p0[q][1]) * k;
        err = Math.max(err, Math.hypot(p2[q][0] - px, p2[q][1] - py));
        move = Math.max(move, Math.hypot(p2[q][0] - p1[q][0], p2[q][1] - p1[q][1]));
      }
      if (err <= allow) return;
      // A pop, or only fast? A quick swing that still curves smoothly (a wing's beat, a quick
      // sway) is caught by a curve through its last three places; a pop (a kink, a jolt, a snap)
      // lands off that curve too.
      // (a cubic through four places where it can: a fast spin or a quick wing beat follows it, a
      // jolt never does)
      const fine = (p) => p && p.length === p2.length && (p.alpha ?? 1) >= 0.25;
      // (smooth if either the quadratic or the cubic follows it)
      const off = (H, W) => {
        let e = 0;
        for (let q = 0; q < p2.length; q++) {
          let px = 0;
          let py = 0;
          H.forEach((p, a) => {
            px += W[a] * p[q][0];
            py += W[a] * p[q][1];
          });
          e = Math.max(e, Math.hypot(p2[q][0] - px, p2[q][1] - py));
        }
        return e;
      };
      let curve = Infinity;
      if (W3 && fine(pm)) curve = off([pm, p0, p1], W3);
      if (W4 && fine(pm) && fine(pmm)) curve = Math.min(curve, off([pmm, pm, p0, p1], W4));
      const kind = curve > allow ? 'pop' : 'fast';
      flags.push({ t: +r2.t.toFixed(3), dt: +r2.dt.toFixed(4), key, what: r2.what, bucket: kind === 'fast' && bucket === 'own' ? 'fast' : bucket, kind, err: +err.toFixed(2), move: +move.toFixed(2) });
    };
    // (an extra drawn a varying number of times, sparkles coming and going, is only compared while
    // its count holds: its numbering shifts as one comes or goes)
    for (const key of keys) {
      const base = key.replace(/#\d+$/, '');
      if (r0.counts[base] !== r1.counts[base] || r1.counts[base] !== r2.counts[base]) continue;
      const same = (r) => r && r.counts[base] === r0.counts[base];
      check(key, r0.ops.get(key), r1.ops.get(key), r2.ops.get(key), same(rm) ? rm.ops.get(key) : null, same(rm) && same(rmm) ? rmm.ops.get(key) : null);
    }
    // (the rig's origin in the world: the engine's hops, minus the stage's own walking)
    if (r0.origin && r1.origin && r2.origin) check('@origin', [r0.origin], [r1.origin], [r2.origin], rm?.origin ? [rm.origin] : null, rmm?.origin ? [rmm.origin] : null);
  }
  // Flicker: a part's own picture gone for a frame or three, then back.
  const flicker = [];
  for (const key of keys) {
    if (!isPart(key)) continue;
    for (let j = 1; j < rows.length - 4; j++) {
      if (!rows[j - 1].ops.has(key) || rows[j].ops.has(key) || rows[j].what === 'die' || rows[j - 1].what === 'die') continue;
      for (let q = j + 1; q <= j + 3; q++)
        if (rows[q].ops.has(key)) {
          flicker.push({ t: +rows[j].t.toFixed(3), key, what: rows[j].what });
          break;
        }
    }
  }
  // Settling: the quietest 1.4 s of the idle act (after its first 2 s): every part should rest there
  // but for its breathing. Px a second, relative to the rig's feet.
  const idle = rows.filter((r) => r.i === 0 && r.t > 2);
  const restless = {};
  if (idle.length > 10) {
    const span = 1.4;
    for (const key of keys) {
      // (per frame speed of its fastest corner)
      const sp = [];
      for (let j = 1; j < idle.length; j++) {
        const a = idle[j - 1].ops.get(key);
        const b = idle[j].ops.get(key);
        const base = key.replace(/#\d+$/, '');
        if (!a || !b || a.length !== b.length || idle[j - 1].counts[base] !== idle[j].counts[base]) {
          sp.push(null);
          continue;
        }
        let d = 0;
        for (let q = 0; q < a.length; q++) d = Math.max(d, Math.hypot(b[q][0] - a[q][0], b[q][1] - a[q][1]));
        sp.push(d);
      }
      let best = Infinity;
      let lo = 0;
      let sum = 0;
      let nulls = 0;
      for (let hi = 0; hi < sp.length; hi++) {
        if (sp[hi] === null) nulls++;
        else sum += sp[hi];
        while (idle[hi + 1].t - idle[lo + 1].t > span) {
          if (sp[lo] === null) nulls--;
          else sum -= sp[lo];
          lo++;
        }
        if (idle[hi + 1].t - idle[lo + 1].t > span * 0.95 && nulls === 0) best = Math.min(best, sum / span);
      }
      if (best !== Infinity && best > 3) restless[key] = +best.toFixed(1);
    }
  }
  return { flags, flips, flicker, restless, keys: [...keys] };
}

// A short name for a key: the part (and the line of code for an extra).
const nice = (key) => key.replace(/^r\d+\//, (s) => (s === 'r0/' ? '' : s)).replace(/\/img#0$/, '').replace(/#0$/, '');

export async function probe(id, { sched = 'mixed', idle = 33 } = {}) {
  const run = await play(id, sched, idle);
  const an = analyse(run);
  const own = an.flags.filter((f) => f.bucket === 'own');
  const byBucket = {};
  for (const f of an.flags) byBucket[f.bucket] = (byBucket[f.bucket] ?? 0) + 1;
  const byKey = {};
  const byKeyWhat = {};
  for (const f of own) {
    const w = (byKeyWhat[f.key] ??= {});
    w[f.what] = (w[f.what] ?? 0) + 1;
  }
  for (const f of own) byKey[f.key] = (byKey[f.key] ?? 0) + 1;
  const worst = [...own].sort((a, b) => b.err - a.err);
  const art = ARTS[run.def.art] ?? {};
  return {
    id,
    sched,
    frames: run.rows.length,
    own: own.length,
    ownParts: own.filter((f) => isPart(f.key)).length,
    // (frames with any jump of its own: a part and all its extras popping at once count once)
    frames60: new Set(own.map((f) => f.t)).size,
    partFrames: new Set(own.filter((f) => isPart(f.key)).map((f) => f.t)).size,
    byKeyWhat,
    hop: own.filter((f) => f.key === '@origin').length,
    byBucket,
    byKey,
    worst: worst.slice(0, 12).map((f) => ({ ...f, key: nice(f.key) })),
    worstKey: Object.entries(byKey).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    flicker: an.flicker,
    // (frames a soft layer hit its stop in, by layer and by what it was doing)
    stops: (() => {
      const o = {};
      for (const r of run.rows) {
        for (const k of r.stops ?? []) {
          const w = (o[k] ??= { n: 0 });
          w.n++;
          w[r.what] = (w[r.what] ?? 0) + 1;
        }
      }
      return o;
    })(),
    restless: an.restless,
    boss: Boolean(run.def.boss),
    noHop: Boolean(art.noHop),
    run,
    an,
  };
}

// ---------- From the command line ----------
const main = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (main) {
  const args = process.argv.slice(2);
  const opt = (name, d) => args.find((s) => s.startsWith(`--${name}=`))?.split('=')[1] ?? d;
  let ids = args.filter((s) => !s.startsWith('--'));
  if (args.includes('--all')) ids = REMADE;
  const scheds = opt('sched', 'mixed,60').split(',');
  const idle = Number(opt('idle', 33));
  const worstN = Number(opt('worst', 6));
  const out = [];
  for (const id of ids) {
    const row = { id };
    for (const sched of scheds) {
      const t0 = performance.now();
      const r = await probe(id, { sched, idle });
      const ms = performance.now() - t0;
      row[sched] = r;
      if (args.includes('--json')) continue;
      const head = `${id}${r.boss ? ' (boss)' : ''} @${sched}: ${r.frames} frames, ${(ms / 1000).toFixed(1)} s`;
      console.log(`${head}\n  own jumps ${r.own} in ${r.frames60} frames (part pictures ${r.ownParts} in ${r.partFrames} frames, hops ${r.hop}); engine's: ${JSON.stringify(Object.fromEntries(Object.entries(r.byBucket).filter(([b]) => b !== 'own')))}; noHop ${r.noHop}`);
      for (const [k, n] of Object.entries(r.byKey).sort((a, b) => b[1] - a[1]).slice(0, 10)) console.log(`    ${n}x ${nice(k)}  ${Object.entries(r.byKeyWhat[k]).sort((a, b) => b[1] - a[1]).map(([w, c]) => `${w} ${c}`).join(", ")}`);
      for (const f of r.worst.slice(0, worstN)) console.log(`    worst: ${f.key} in ${f.what} @${f.t} (dt ${f.dt}) off ${f.err} px, moved ${f.move}`);
      const sp = Object.entries(r.stops).sort((a, b) => b[1].n - a[1].n);
      if (sp.length) console.log(`  soft layers hitting their stop (frames): ${sp.slice(0, 8).map(([k, w]) => `${k} ${w.n} (${Object.entries(w).filter(([q]) => q !== 'n').map(([q, c]) => `${q} ${c}`).join(', ')})`).join('; ')}`);
      if (r.flicker.length) console.log(`  flicker ${r.flicker.length}: ${JSON.stringify(r.flicker.slice(0, 4).map((f) => [nice(f.key), f.what, f.t]))}`);
      const rs = Object.entries(r.restless).sort((a, b) => b[1] - a[1]);
      if (rs.length) console.log(`  never settling (px/s, quietest 1.4 s of idle): ${rs.slice(0, 8).map(([k, v]) => `${nice(k)} ${v}`).join(', ')}`);
      if (args.includes('--keys')) console.log(r.an.keys.map(nice).join('\n'));
      const strip = opt('strip', null);
      if (strip) {
        const [key, at] = strip.split('@');
        const rows = r.run.rows;
        const j = rows.findIndex((x) => x.t >= Number(at));
        const full = r.an.keys.find((k) => nice(k) === key) ?? key;
        for (const x of rows.slice(Math.max(0, j - 4), j + 6)) console.log(x.t.toFixed(3), x.dt.toFixed(4), x.what, JSON.stringify((full === '@origin' ? [x.origin] : x.ops.get(full))?.map((p) => p.map((v) => +v.toFixed(2)))));
      }
      // (let go of the frames before the next monster)
      delete r.run;
      delete r.an;
    }
    out.push(row);
  }
  if (args.includes('--json')) console.log(JSON.stringify(out.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'object' ? { own: v.own, ownParts: v.ownParts, hop: v.hop, byBucket: v.byBucket, worst: v.worst.slice(0, 3), worstKey: v.worstKey && nice(v.worstKey), flicker: v.flicker.length, restless: v.restless, noHop: v.noHop, boss: v.boss } : v])))));
  if (!hooked) console.warn('(warning: the rig engine was not instrumented)');
}
