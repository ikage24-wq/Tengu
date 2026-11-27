// The Geode Turtle (2026-11-27, new for the Crystal Caves, in the Geode Bear's place: the player wanted
// the late regulars to be new creatures that fit their place, each on its own base; the id stays
// `rockgolem`). A little sea turtle that swam into the cave's underground lake long ago and never left:
// its shell turned to stone over the years and cracked open on top like a geode, a cluster of soft
// amethyst crystals growing out of it that glow when it hums. Aqua skin, big lilac eyes with a
// crystal shine, a blush. It moves on its own copy of the shell crawler base (turtlebase.js, its sea
// turtle: flippers that row it along on land, its head tucked in, its moves), dressed here.
import { dressedTurtle } from './turtlebase.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const sstep = (u) => {
  const v = clamp(u, 0, 1);
  return v * v * (3 - 2 * v);
};
const add = (p, q) => [p[0] + q[0], p[1] + q[1]];
const turn = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const INK = '#4f7a88';
const GT = {
  stone: '#c7bad4', stoneLt: '#e6ddef', stoneSh: '#a796ba', stoneDeep: '#8c7ba2',
  band: '#f7f2ff', bandSh: '#ddd0ee',
  hollow: '#4a3478', hollowLt: '#6c4fa0',
  gem: '#b48cf2', gemLt: '#e6d6ff', gemSh: '#8a64d4', gemGlow: '#d8c4ff',
  eye: '#2c3a5c', iris: '#8a7ad8', blush: '#ff9eb4', mouth: '#3c5a66',
  drop: '#bfe8ff', note: '#9a7ae0',
};

// ---------- Its face (in the head's frame: x forward, y down) ----------
// Its eyes: tall soft ovals, a lilac ring low in each, a diamond of crystal shine and a little dot.
function eye(ctx, a, K, x, y, r, f) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.colour(a, GT.eye);
  if (f === 'hurt') {
    ctx.lineWidth = r * 0.34;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, y - r * 0.7);
    ctx.lineTo(x + r * 0.5, y);
    ctx.lineTo(x - r * 0.8, y + r * 0.7);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = r * 0.32;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r * 0.95, y + r * 0.1);
    ctx.quadraticCurveTo(x, y + up * r * 0.8, x + r * 0.95, y + r * 0.1);
    ctx.stroke();
    return;
  }
  const big = f === 'startled' ? 1.1 : 1;
  ell(ctx, x, y, r * 0.82 * big, r * 1.12 * big);
  ctx.fillStyle = K.colour(a, GT.eye);
  ctx.fill();
  ell(ctx, x, y + r * 0.42, r * 0.56, r * 0.5);
  ctx.fillStyle = K.colour(a, GT.iris);
  ctx.fill();
  // the crystal shine
  const hx = x - r * 0.22;
  const hy = y - r * 0.42;
  const s = r * 0.42;
  ctx.beginPath();
  ctx.moveTo(hx, hy - s);
  ctx.lineTo(hx + s * 0.62, hy);
  ctx.lineTo(hx, hy + s);
  ctx.lineTo(hx - s * 0.62, hy);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ell(ctx, x + r * 0.3, y + r * 0.42, r * 0.15, r * 0.15);
  ctx.fill();
  if (f === 'focus') {
    // its lids down a little, minding the job
    ctx.fillStyle = K.colour(a, K.C.base);
    ctx.beginPath();
    ctx.rect(x - r * 1.1, y - r * 1.4, r * 2.2, r * 0.8);
    ctx.fill();
  }
}
const faceOf = (a) => a.gt?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.43) % 5) < 0.13 ? 'blink' : 'open');
function face(ctx, a, sk, K) {
  const f = faceOf(a);
  K.soft(ctx, a, [1.6, 1.7], 1.6, f === 'happy' ? 0.75 : 0.55, GT.blush);
  eye(ctx, a, K, 4.9, -1.1, 0.95, f);
  eye(ctx, a, K, 1.6, -0.9, 1.4, f);
  ctx.fillStyle = K.colour(a, GT.mouth);
  ell(ctx, 5.9, 0, 0.24, 0.18);
  ctx.fill();
  if ((sk.jaw ?? 0) > 0.12) return;
  ctx.strokeStyle = K.colour(a, GT.mouth);
  ctx.lineWidth = 0.36;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (f === 'startled' || f === 'hurt' || (a.gt?.hum ?? 0) > 0.4) {
    ell(ctx, 4.6, 2.0, 0.45, 0.55);
    ctx.fillStyle = K.colour(a, GT.mouth);
    ctx.fill();
  } else if (f === 'focus') {
    ctx.moveTo(5.4, 1.8);
    ctx.lineTo(3.6, 2.0);
    ctx.stroke();
  } else {
    ctx.moveTo(5.6, 1.5);
    ctx.quadraticCurveTo(4.6, f === 'happy' ? 2.9 : 2.5, 3.3, 1.8);
    ctx.stroke();
  }
}

// ---------- Its stone shell, cracked open on top like a geode ----------
// (the opening: an oval on top of the shell; the crystals growing up out of it: [x at the root, its
// height, its width, its lean])
const HOLE = { c: [-2.6, -4.6], rx: 7.4, ry: 3.1 };
const FRONT = [[-6.4, 2.4, 1.8, -0.4], [-3.2, 3, 2, -0.15], [0.2, 2.8, 2, 0.15], [3, 2.2, 1.7, 0.4]];
const GEMS = [[-7.4, 4.2, 2.4, -0.32], [-4.6, 6.6, 3, -0.12], [-1.6, 8.4, 3.4, 0.04], [1.6, 6, 2.8, 0.2], [3.9, 3.8, 2.2, 0.34]];
function gemPath(ctx, g, wob = 0, dy = 0.8) {
  const [x, h, w, lean] = g;
  const root = [x, HOLE.c[1] + dy];
  const up = [Math.sin(lean + wob), -Math.cos(lean + wob)];
  const side = [-up[1], up[0]];
  const p = (u, v) => [root[0] + up[0] * u + side[0] * v, root[1] + up[1] * u + side[1] * v];
  ctx.beginPath();
  ctx.moveTo(...p(0, -w / 2));
  ctx.lineTo(...p(h * 0.72, -w / 2));
  // (a soft point: the tip rounded off)
  ctx.quadraticCurveTo(...p(h, 0), ...p(h * 0.72, w / 2));
  ctx.lineTo(...p(0, w / 2));
  ctx.closePath();
  return p;
}
function geode(ctx, a, mode, K) {
  const g = a.gt ?? {};
  K.shellFrame(ctx, a);
  const t = a.t ?? 0;
  const wob = (g.shine ?? 0) * Math.sin(t * 30) * 0.02;
  if (mode === 'line') {
    // the crystals' outer edge (inside the shell it is covered by the shell's own fill)
    for (const gm of GEMS) {
      gemPath(ctx, gm, wob);
      ctx.lineJoin = 'round';
      K.edge(ctx);
    }
    return;
  }
  // the stone shell, lit from above, a darker band under its rim
  ctx.save();
  K.shellPath(ctx);
  const gr = ctx.createLinearGradient(0, -9, 0, 5);
  gr.addColorStop(0, K.colour(a, GT.stoneLt));
  gr.addColorStop(0.45, K.colour(a, GT.stone));
  gr.addColorStop(1, K.colour(a, GT.stoneSh));
  ctx.fillStyle = gr;
  ctx.fill();
  ctx.clip();
  ctx.beginPath();
  const rim = K.P.shell.rim;
  ctx.moveTo(rim[0][0] + 4, rim[0][1]);
  for (const q of rim) ctx.lineTo(q[0], q[1]);
  ctx.lineTo(rim[rim.length - 1][0] - 4, rim[rim.length - 1][1]);
  ctx.lineTo(-20, 9);
  ctx.lineTo(16, 9);
  ctx.closePath();
  ctx.fillStyle = K.colour(a, GT.stoneDeep);
  ctx.globalAlpha *= 0.55;
  ctx.fill();
  ctx.globalAlpha /= 0.55;
  // a few soft stone plates, lighter, round the opening
  ctx.fillStyle = K.colour(a, GT.stoneLt);
  ctx.globalAlpha *= 0.5;
  for (const [x, y, rx, ry, r] of [[7.6, -2.6, 2.6, 1.6, -0.5], [-11.4, -1.4, 2.8, 1.5, 0.35], [2.4, -0.2, 2.2, 1.1, 0]]) {
    ell(ctx, x, y, rx, ry, r);
    ctx.fill();
  }
  ctx.restore();
  // the geode's white quartz band, then the violet hollow inside it
  crackPath(ctx, 1.5);
  ctx.fillStyle = K.colour(a, GT.bandSh);
  ctx.fill();
  crackPath(ctx, 0.9, -0.15);
  ctx.fillStyle = K.colour(a, GT.band);
  ctx.fill();
  ell(ctx, HOLE.c[0], HOLE.c[1] + 0.3, HOLE.rx, HOLE.ry);
  const hg = ctx.createLinearGradient(0, HOLE.c[1] - HOLE.ry, 0, HOLE.c[1] + HOLE.ry);
  hg.addColorStop(0, K.colour(a, GT.hollow));
  hg.addColorStop(1, K.colour(a, GT.hollowLt));
  ctx.fillStyle = hg;
  ctx.fill();
  // its glow: soft, and brighter as it hums
  const glowK = 0.35 + (g.glow ?? 0) * 0.65;
  const gc = [HOLE.c[0] - 1, HOLE.c[1] - 3];
  const rg = ctx.createRadialGradient(gc[0], gc[1], 0, gc[0], gc[1], 11);
  rg.addColorStop(0, 'rgba(226,206,255,0.85)');
  rg.addColorStop(1, 'rgba(226,206,255,0)');
  ctx.save();
  ctx.globalAlpha *= glowK * 0.7;
  ctx.fillStyle = rg;
  ctx.beginPath();
  ctx.arc(gc[0], gc[1], 11, 0, TAU);
  ctx.fill();
  ctx.restore();
  // the crystals, each with a lit face and a shaded one
  GEMS.forEach((gm, i) => {
    const wave = (g.wave ?? -1) >= 0 ? Math.max(0, Math.sin(Math.PI * clamp(g.wave * 2.2 - i * 0.24, 0, 1))) : 0;
    const p = gemPath(ctx, gm, wob);
    ctx.fillStyle = K.colour(a, GT.gem);
    ctx.fill();
    const [, h, w] = gm;
    ctx.beginPath();
    ctx.moveTo(...p(0, -w / 2));
    ctx.lineTo(...p(h * 0.72, -w / 2));
    ctx.quadraticCurveTo(...p(h * 0.95, -w * 0.1), ...p(h, 0));
    ctx.lineTo(...p(0, w * 0.02));
    ctx.closePath();
    ctx.fillStyle = K.colour(a, GT.gemLt);
    ctx.globalAlpha *= 0.75;
    ctx.fill();
    ctx.globalAlpha /= 0.75;
    ctx.beginPath();
    ctx.moveTo(...p(0, w / 2));
    ctx.lineTo(...p(h * 0.72, w / 2));
    ctx.lineTo(...p(h * 0.66, w * 0.26));
    ctx.lineTo(...p(0, w * 0.26));
    ctx.closePath();
    ctx.fillStyle = K.colour(a, GT.gemSh);
    ctx.globalAlpha *= 0.6;
    ctx.fill();
    ctx.globalAlpha /= 0.6;
    // a light running up it as it hums
    if (wave > 0.02) {
      ctx.save();
      gemPath(ctx, gm, wob);
      ctx.globalAlpha *= wave * 0.85;
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }
  });
  // a front row of little crystals filling the hollow, then the cracked lip in front of their roots
  for (const [x, h, w, lean] of FRONT) {
    const p = gemPath(ctx, [x, h, w, lean], wob, 2.2);
    ctx.fillStyle = K.colour(a, GT.gem);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(...p(0, -w / 2));
    ctx.lineTo(...p(h * 0.72, -w / 2));
    ctx.quadraticCurveTo(...p(h * 0.95, -w * 0.1), ...p(h, 0));
    ctx.lineTo(...p(0, 0));
    ctx.closePath();
    ctx.fillStyle = K.colour(a, GT.gemLt);
    ctx.globalAlpha *= 0.7;
    ctx.fill();
    ctx.globalAlpha /= 0.7;
  }
  ctx.save();
  ell(ctx, HOLE.c[0], HOLE.c[1] - 40, 40, 40.2 + HOLE.ry);
  ctx.rect(-30, -30, 60, 60);
  ctx.clip('evenodd');
  crackPath(ctx, 0.9, -0.15);
  ctx.fillStyle = K.colour(a, GT.band);
  ctx.fill();
  ctx.restore();
}

// The hollow's cracked rim: a soft zigzag round the oval (its points rounded off), out by `out`.
function crackPath(ctx, out, dy = 0) {
  const n = 18;
  const pts = [];
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU;
    const k = i % 2 ? 0.55 : 1;
    pts.push([HOLE.c[0] + Math.cos(an) * (HOLE.rx + out * k), HOLE.c[1] + dy + Math.sin(an) * (HOLE.ry + out * 0.8 * k)]);
  }
  ctx.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  ctx.moveTo(...mid(pts[n - 1], pts[0]));
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(...pts[i], ...mid(pts[i], pts[(i + 1) % n]));
  ctx.closePath();
}
// (a point in the shell's frame, in the rig's own space, for effects)
const inRig = (a, p) => {
  const sk = a.bk;
  return sk.X(add(sk.sc, turn(p, sk.ang)));
};

const LOOK = {
  C: { lt: '#d4f4ec', base: '#9fd8cc', sh: '#7cbcb6', deep: '#5e9ea2', guide: '#9fd8cc', nose: '#3c5a66', mouth: '#3c5a66' },
  ink: INK,
  face,
  over: { shell: geode },
  // Its act, about 30 s, the cave lake's old turtle (on the base's channels: x, hop, lift, pitch,
  // crouch, roll, hide, peek, down, splay, free, neck, nAng, head, jaw, flipN, tail):
  //   - polishing its crystals, a flipper rubbing up the back of its shell, a squeaky-clean glint;
  //   - a hum: its neck up, eyes shut, a light running up each crystal in turn, little notes;
  //   - a drip from the cave roof: looking up, the drop lands on its nose, a start, a head shake;
  //   - swimming on dry land: rowing its flippers in the air, a few bubbles;
  //   - a nap settled flat, its chin on the floor, the crystals glowing softly, a "z"; then up, a look round.
  pose: (m, a, out, K, mv) => {
    const g = { face: null, sniff: 0, pebble: 0, glow: 0, wave: -1, hum: 0, shine: 0, glint: -1, drop: -1, splash: -1, swim: 0, z: 0 };
    a.gt = g;
    const st = a.mo.rig;
    const dt = clamp(a.dt ?? 0, 0, 0.1);
    const napping = m.habit?.kind === 'nap' && (a.now ?? 0) < (m.habit.until ?? 0);
    const dead = m.hp <= 0;
    const hurt = (a.hurtAgo ?? 9) < 0.45;
    // (its act, eased in and out, never while it walks, fights, naps or is posed in a scene)
    const fighting = (m.aggroUntil ?? 0) > (a.now ?? 0) || (a.now ?? 0) - (m.attackAt ?? -99) < 4 || (a.hurtAgo ?? 9) < 3;
    const want = dead || hurt || mv || napping || fighting ? 0 : clamp((a.calm ?? 1) * (1 - clamp(a.walkW ?? 0, 0, 1)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1), 0, 1);
    st.gtW = Number.isFinite(st.gtW) ? st.gtW + (want - st.gtW) * Math.min(1, dt * (want < st.gtW ? 9 : 4)) : want;
    const calm = st.gtW;
    g.face = dead ? 'dead' : hurt ? 'hurt' : mv ? 'focus' : napping ? 'sleep' : null;
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.3) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // nosing the ground for a shiny pebble, little sniffs, then a pleased glint
    const pol = hold(lu, 1, 1.6, 4.6, 5.2) * calm;
    const sniff = Math.max(0, Math.sin((lu - 1.6) * 11)) * (lu < 3.6 ? 1 : 0);
    go({ neck: 0.55, nAng: -14, head: 16 + sniff * 4, pitch: 3, jaw: 0 }, pol);
    g.sniff = pol * sniff;
    g.pebble = pol;
    if (lu > 3.6 && lu < 4.6) g.glint = lu - 3.6;
    // a hum, a light running up its crystals
    const hum = hold(lu, 7, 7.6, 11.2, 11.8) * calm;
    g.hum = hum;
    go({ nAng: 16, neck: 0.25, head: -8, jaw: 0.15, lift: 0.6 + Math.sin(lu * 3) * 0.3 }, hum);
    if (hum > 0.3) g.wave = ((lu - 7.6) % 1.6) / 1.6;
    g.glow = hum;
    // a drip from the roof, onto its nose
    const look = hold(lu, 13, 13.5, 15.6, 16.1) * calm;
    go({ nAng: 24, neck: 0.3, head: -16 }, look);
    if (lu > 13.6 && lu < 14.6) g.drop = (lu - 13.6) / 1;
    if (lu > 14.6 && lu < 15.2) g.splash = (lu - 14.6) / 0.6;
    const shake = hold(lu, 15.3, 15.5, 16.4, 16.8) * calm;
    go({ head: Math.sin(lu * 24) * 10, nAng: 8 }, shake);
    // swimming on dry land
    const swim = hold(lu, 18.5, 19, 22.4, 23) * calm;
    const row = Math.sin((lu - 19) * 5.2);
    g.swim = swim;
    go({ flipN: row * 0.8, lift: 1.4 + row * 0.5, pitch: -4 + row * 2, neck: 0.3, nAng: 4 }, swim);
    // a nap in its shell, then a peek out
    const nap = hold(lu, 24.2, 25, 28, 28.6) * calm;
    // (settled flat, its chin on the floor, its head half drawn in: never the full tuck, whose
    // flipper fold flips over in a frame)
    go({ down: 1, neck: -0.45, nAng: -8, head: 6, lift: Math.sin(t * 0.9) * 0.12 }, nap);
    g.glow = Math.max(g.glow, nap * (0.4 + 0.3 * Math.sin(t * 1.3)));
    g.z = Math.max(g.z, nap);
    const peek = hold(lu, 28.3, 28.6, 29.2, 29.6) * calm;
    go({ neck: 0.2, nAng: 10, head: -4 }, peek);
    if (!g.face) g.face = pol > 0.4 ? (g.glint >= 0 ? 'happy' : 'focus') : hum > 0.4 ? 'happy' : g.splash >= 0 ? 'startled' : shake > 0.4 ? 'blink' : look > 0.4 ? 'open' : swim > 0.4 ? 'happy' : nap > 0.4 ? 'sleep' : null;
  },
  // Its extras: a clean glint on its crystals, its hum's notes, the drip and its splash, bubbles as it
  // swims on dry land, a sleepy z.
  fx: (ctx, m, a, S, K) => {
    const g = a.gt;
    const sk = a.bk;
    if (!g || !sk || m.hp <= 0) return;
    const t = a.t ?? 0;
    const head = sk.X(sk.hp);
    const top = inRig(a, [-1.6, -12]);
    const text = (str, x, y, size, col, al) => {
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.translate(x, y);
      if (a.flip) ctx.scale(-1, 1);
      ctx.font = `800 ${size}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.strokeText(str, 0, 0);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    const spark = (x, y, r, al) => {
      if (al <= 0.01) return;
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.beginPath();
      ctx.moveTo(x, y - r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.quadraticCurveTo(x, y, x, y + r);
      ctx.quadraticCurveTo(x, y, x - r, y);
      ctx.quadraticCurveTo(x, y, x, y - r);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    };
    if (g.pebble > 0.05) {
      // a little shiny pebble on the ground, under its nose
      const nose = sk.X(add(sk.hp, turn([6.4, 2.6], sk.ha)));
      const px = nose[0] + 1;
      const py = 0;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, g.pebble * 1.5);
      ell(ctx, px, py - 1, 1.5, 1.1);
      ctx.fillStyle = GT.gem;
      ctx.fill();
      ell(ctx, px - 0.45, py - 1.4, 0.6, 0.4, -0.3);
      ctx.fillStyle = GT.gemLt;
      ctx.fill();
      ctx.restore();
      if (g.sniff > 0.6) text('sniff', nose[0] - 1, nose[1] - 4, 3.4, GT.note, (g.sniff - 0.6) / 0.4);
      if (g.glint >= 0) {
        const u = g.glint;
        spark(px + 0.6, py - 2, 0.8 + Math.sin(Math.PI * u) * 1.6, Math.sin(Math.PI * u));
        if (u > 0.15) text('ooh!', nose[0] + 2, nose[1] - 6 - u * 3, 4, GT.note, Math.sin(Math.PI * u));
      }
    }
    if (g.hum > 0.4) {
      for (let i = 0; i < 2; i++) {
        const u = (t * 0.55 + i * 0.5) % 1;
        text('♪', head[0] + 2 + u * 3 + i * 2, head[1] - 5 - u * 7, 4 + u, GT.note, g.hum * Math.sin(Math.PI * u));
      }
    }
    if (g.drop >= 0) {
      // a drop of cave water, falling from above onto its nose
      const u = g.drop;
      const nose = sk.X(add(sk.hp, turn([5.4, -1], sk.ha)));
      const y = nose[1] - 22 * (1 - u * u);
      ctx.save();
      ctx.globalAlpha *= Math.min(1, u * 4);
      ctx.beginPath();
      ctx.moveTo(nose[0], y - 2.2);
      ctx.quadraticCurveTo(nose[0] + 1.2, y, nose[0], y + 0.9);
      ctx.quadraticCurveTo(nose[0] - 1.2, y, nose[0], y - 2.2);
      ctx.fillStyle = GT.drop;
      ctx.fill();
      ctx.restore();
    }
    if (g.splash >= 0) {
      const u = g.splash;
      const nose = sk.X(add(sk.hp, turn([5.4, -1.4], sk.ha)));
      ctx.save();
      ctx.globalAlpha *= 1 - u;
      ctx.fillStyle = GT.drop;
      for (const s of [-1, 1]) {
        ell(ctx, nose[0] + s * (1 + u * 3), nose[1] - u * 2.4 + u * u * 2, 0.6, 0.8, s * 0.5);
        ctx.fill();
      }
      ctx.restore();
      if (u < 0.8) text('!', head[0] + 1, head[1] - 7, 4.4, '#e8608e', Math.sin((Math.PI * u) / 0.8));
    }
    if (g.swim > 0.3) {
      // bubbles rising off it as it pretends to swim
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const u = (t * 0.7 + i / 3) % 1;
        const x = head[0] - 4 - i * 4 + Math.sin(u * 7 + i) * 0.8;
        const y = head[1] - 2 - u * 10;
        ctx.globalAlpha = g.swim * Math.sin(Math.PI * u) * 0.85;
        ell(ctx, x, y, 1 + i * 0.2, 1 + i * 0.2);
        ctx.strokeStyle = '#d8f4ff';
        ctx.lineWidth = 0.4;
        ctx.stroke();
        ell(ctx, x - 0.3, y - 0.3, 0.3, 0.3);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    }
    if (g.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', top[0] + 4 + u * 4, top[1] - 2 - u * 8, 4 + u * 2.4, GT.note, g.z * Math.sin(Math.PI * u));
    }
  },
};

const D = dressedTurtle(LOOK);
export const GEODE_TURTLE_ART = { ...D.art, noHop: true };
export const GEODE_TURTLE_SIZE = { w: Math.round(D.w), h: Math.round(D.h), speed: D.speed };
