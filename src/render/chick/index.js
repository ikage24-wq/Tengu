// The Cellar Scout (2026-11-25, the Chickling remade on the bird base, the player's pick "C" of
// three): a sunny little chick exploring Clover Hills' dark Root Cellar, in a walnut-shell miner's
// helmet with a glowing firefly lamp on the front and a chin strap, a green scarf, a smudge of soil
// on its cheek, an ear of golden grain tucked under its wing (its Golden Grain drops). It moves on its
// own copy of the bird base (chickbase.js), reshaped into a round chick that never flies: a ball of a
// body, a big head, a stubby tail, little wings, short legs (its bones, hop, springs and moves: peck,
// wing slap, cheep).
//   idle    an 18 s act: the lamp flickers out, it taps its helmet with a wing, and the lamp comes
//           back brighter, pleased; it pecks about the floor and finds a seed; it crouches low and
//           peers into the dark one way then the other, then a happy cheep.
// Everything drawn here from scratch (the face too).
import { dressedChick } from './chickbase.js';

const TAU = Math.PI * 2;

const fillOr = (ctx, a, K, mode, c) => {
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = K.colour(a, c);
    ctx.fill();
  }
};
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const smooth = (ctx, pts) => {
  ctx.beginPath();
  const n = pts.length;
  for (let i = 0; i <= n; i++) {
    const p = pts[i % n];
    const q = pts[(i + 1) % n];
    const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
    if (i === 0) ctx.moveTo(...m);
    else ctx.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  ctx.closePath();
};
const faceOf = (a) => a.chFace ?? a.face;
const R = (K) => K.sc(K.P.head.r);
const RX = (K) => K.sc(K.P.head.rx);

// A chick's eye (the head's frame, game px): a big round shiny bead, dark with a warm brown iris
// ring, two big glints and a star; a little lash flick; blinks; a happy arc; squeezed when hurt.
function eye(ctx, a, K, col) {
  const cl = (c) => K.colour(a, c);
  const ink = '#2a1a14';
  const f = faceOf(a);
  const x = RX(K) * 0.36;
  const y = -R(K) * 0.12;
  const r = K.sc(2.3);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const blink = ((a.t + (a.mo?.uid ?? 0) * 0.47) % 3.2) < 0.11;
  if (f === 'dead' || f === 'hurt') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * 0.6);
    ctx.lineTo(x + r * 0.7, y);
    ctx.lineTo(x - r, y + r * 0.6);
    ctx.stroke();
    return;
  }
  if (blink || f === 'happy' || f === 'sleep') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    if (f === 'happy') {
      ctx.moveTo(x - r, y + r * 0.3);
      ctx.quadraticCurveTo(x, y - r * 0.9, x + r, y + r * 0.3);
    } else {
      ctx.moveTo(x - r, y);
      ctx.quadraticCurveTo(x, y + r * 0.7, x + r, y);
    }
    ctx.stroke();
    return;
  }
  ell(ctx, x, y, r * 0.92, r);
  ctx.fillStyle = cl(ink);
  ctx.fill();
  ell(ctx, x + r * 0.05, y + r * 0.1, r * 0.74, r * 0.8);
  ctx.fillStyle = cl(col.iris);
  ctx.fill();
  ell(ctx, x + r * 0.05, y + r * 0.5, r * 0.5, r * 0.24);
  ctx.fillStyle = cl(col.lt);
  ctx.fill();
  ell(ctx, x + r * 0.1, y + r * 0.05, r * 0.46, r * 0.54);
  ctx.fillStyle = cl('#140a08');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.28, y - r * 0.38, r * 0.36, r * 0.3);
  ctx.fill();
  ell(ctx, x + r * 0.36, y + r * 0.42, r * 0.16, r * 0.13);
  ctx.fill();
  ctx.strokeStyle = cl(ink);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.7, y - r * 0.72);
  ctx.quadraticCurveTo(x - r * 1.05, y - r * 0.95, x - r * 1.2, y - r * 1.25);
  ctx.stroke();
  if (f === 'angry') {
    ctx.strokeStyle = cl(col.brow);
    ctx.lineWidth = K.sc(0.5);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 1.5);
    ctx.lineTo(x + r * 0.9, y - r * 1.05);
    ctx.stroke();
  }
}
function blush(ctx, a, K) {
  ctx.fillStyle = K.tint(a, '#ff8f8f', 0.55);
  ell(ctx, RX(K) * 0.3, R(K) * 0.38, K.sc(1.7), K.sc(0.8));
  ctx.fill();
  ctx.strokeStyle = K.tint(a, '#ffffff', 0.8);
  ctx.lineWidth = 0.25;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(RX(K) * 0.3 + K.sc(-0.8 + i * 0.8), R(K) * 0.38 + K.sc(0.4));
    ctx.lineTo(RX(K) * 0.3 + K.sc(-0.3 + i * 0.8), R(K) * 0.38 - K.sc(0.4));
    ctx.stroke();
  }
}
// A fluffy tuft on the crown: three soft curls (the head's frame).
function tuft(ctx, a, K, mode, x, y, c) {
  for (const [dx, dy, r, an] of [[-K.sc(1.4), -K.sc(0.2), K.sc(1.5), -0.6], [0, -K.sc(1), K.sc(1.8), 0], [K.sc(1.4), -K.sc(0.2), K.sc(1.4), 0.6]]) {
    ctx.save();
    ctx.translate(x + dx, y + dy);
    ctx.rotate(an);
    ctx.beginPath();
    ctx.moveTo(-r * 0.6, r * 0.5);
    ctx.quadraticCurveTo(-r * 0.8, -r * 1.2, r * 0.2, -r * 1.4);
    ctx.quadraticCurveTo(r * 0.9, -r * 1.3, r * 0.4, -r * 0.7);
    ctx.quadraticCurveTo(r * 0.5, r * 0.2, r * 0.6, r * 0.5);
    ctx.closePath();
    fillOr(ctx, a, K, mode, c);
    ctx.restore();
  }
}
// The fluffy down along the breast, and a paler belly (over the body).
function belly(ctx, a, K, c) {
  const sk = a.bk;
  ctx.save();
  K.bodyPath(ctx, a);
  ctx.clip();
  ctx.fillStyle = K.colour(a, c);
  smooth(ctx, [sk.at([2, -2]), sk.at([9, -1]), sk.at([8, 6]), sk.at([1, 7.6]), sk.at([-3, 4])]);
  ctx.fill();
  ctx.restore();
}
// (a chick, not a songbird: a round ball of a body, a big head, a stubby tail, little wings, short legs)
const CHICK_P = {
  scale: 0.75,
  body: [[7.4, -3.6], [5.4, -7.8], [0.6, -9.6], [-4.6, -8.8], [-8.2, -5.4], [-9.4, -0.4], [-8.2, 4.4], [-4.4, 7.6], [0.6, 8.6], [5.4, 7], [8.4, 2.6]],
  breast: [5, 2, 5],
  neck: { base: [5, -6], len: 2.4, ang: -66 },
  head: { r: 8.8, rx: 9 },
  beak: { kind: 'cone', at: [8.2, 1], len: 3, h: 2.8 },
  wing: { root: [1.6, -4.4], far: [-1.4, -1.2], fold: [-216, 4.4, 14, 6.4], up: [-104, 4.6, 3.4, 7.6], w: [5, 5.6, 2.2], feathers: 3 },
  leg: { top: [0.4, 3.6], bones: [[1.8, 2.6], [-1.4, 2.8], [0.6, 3]], w: [5, 3, 1.6, 1.5] },
  tail: { root: [-8.4, -1.2], ang: 196, len: 3.6, w: 3.2, n: 3, spread: 5 },
};
const YEL = { lt: '#fffbe0', base: '#ffe27a', sh: '#f2c04a', deep: '#d89e30', guide: '#ffe27a', beak: '#ffaa4a', beakSh: '#e8862a', leg: '#ffaa4a' };

// A sunny chick exploring the dark Root Cellar: a little miner's helmet (a walnut shell) with a
// glowing firefly lamp on the front, a green scarf, a smudge of soil on its cheek; a stubby grain-ear
// tucked under its wing; bright eyes.
const scout = {
  P: CHICK_P,
  noFly: true,
  C: { ...YEL, base: '#ffd860', sh: '#f0b840', deep: '#d0942a', guide: '#ffd860' },
  face: (ctx, a, sk, K) => {
    eye(ctx, a, K, { iris: '#7a4a24', lt: '#c88a50', brow: '#d0942a' });
    blush(ctx, a, K);
    ctx.fillStyle = K.tint(a, '#8a6040', 0.45);
    ell(ctx, -RX(K) * 0.2, R(K) * 0.35, K.sc(1.3), K.sc(0.7), 0.3);
    ctx.fill();
  },
  over: {
    body: (ctx, a, mode, K) => {
      if (mode === 'fill') belly(ctx, a, K, '#fff2a8');
    },
    neck: (ctx, a, mode, K) => {
      const sk = a.bk;
      const c = sk.at([6.8, -4]);
      smooth(ctx, [[c[0] - K.sc(2.6), c[1] - K.sc(1.6)], [c[0] + K.sc(2.6), c[1] - K.sc(1.2)], [c[0] + K.sc(2), c[1] + K.sc(1.2)], [c[0] - K.sc(2.4), c[1] + K.sc(1.4)]]);
      fillOr(ctx, a, K, mode, '#5cb86a');
      // its tail end fluttering back
      smooth(ctx, [[c[0] - K.sc(2), c[1]], [c[0] - K.sc(6), c[1] + K.sc(1)], [c[0] - K.sc(6.4), c[1] + K.sc(2.6)], [c[0] - K.sc(2.4), c[1] + K.sc(1.6)]]);
      fillOr(ctx, a, K, mode, '#4ea85c');
    },
    head: (ctx, a, mode, K) => {
      K.headFrame(ctx, a);
      const rx = RX(K);
      const r = R(K);
      // the walnut-shell helmet, a strap, a firefly lamp glowing on the front
      ctx.save();
      ctx.translate(-rx * 0.15, -r * 0.5);
      ctx.rotate(-0.12);
      const w = rx * 1;
      ctx.beginPath();
      ctx.moveTo(-w, r * 0.05);
      ctx.bezierCurveTo(-w * 1.05, -r * 1, w * 1.05, -r * 1, w, r * 0.05);
      ctx.quadraticCurveTo(0, r * 0.25, -w, r * 0.05);
      ctx.closePath();
      fillOr(ctx, a, K, mode, '#a8743e');
      if (mode === 'fill') {
        ctx.strokeStyle = K.colour(a, '#7a4e26');
        ctx.lineWidth = K.sc(0.4);
        ctx.beginPath();
        ctx.moveTo(0, -r * 0.7);
        ctx.quadraticCurveTo(-w * 0.1, -r * 0.3, 0, r * 0.1);
        ctx.moveTo(-w * 0.6, -r * 0.45);
        ctx.quadraticCurveTo(-w * 0.4, -r * 0.2, -w * 0.55, r * 0.05);
        ctx.moveTo(w * 0.55, -r * 0.45);
        ctx.quadraticCurveTo(w * 0.35, -r * 0.2, w * 0.5, r * 0.05);
        ctx.stroke();
        ctx.fillStyle = K.tint(a, '#e8b878', 0.7);
        ell(ctx, -w * 0.35, -r * 0.55, w * 0.3, r * 0.1, -0.3);
        ctx.fill();
      }
      // the lamp
      ell(ctx, w * 0.85, -r * 0.3, K.sc(1.3), K.sc(1.3));
      fillOr(ctx, a, K, mode, (a.chLamp ?? 1) > 0.4 ? '#ffe27a' : '#c8b070');
      if (mode === 'fill') {
        K.glow(ctx, [w * 0.95, -r * 0.3], K.sc(5) * (0.6 + 0.5 * (a.chLamp ?? 1)), 0.6 * (a.chLamp ?? 1), '#fff6b0');
        ctx.fillStyle = K.colour(a, '#ffffff');
        ell(ctx, w * 0.75, -r * 0.42, K.sc(0.45), K.sc(0.35));
        ctx.fill();
      }
      ctx.restore();
      if (mode === 'fill') {
        ctx.strokeStyle = K.colour(a, '#7a4e26');
        ctx.lineWidth = K.sc(0.5);
        ctx.beginPath();
        ctx.moveTo(-rx * 0.6, -r * 0.35);
        ctx.quadraticCurveTo(-rx * 0.45, r * 0.4, -rx * 0.05, r * 0.85);
        ctx.stroke();
      }
    },
    wingN: (ctx, a, mode, K) => {
      // the ear of grain tucked under its wing
      const sk = a.bk;
      const p = sk.at([-2, 1.5]);
      ctx.translate(...p);
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.ellipse(K.sc(3.4), 0, K.sc(2.2), K.sc(0.9), 0, 0, TAU);
      fillOr(ctx, a, K, mode, '#f0c050');
      if (mode === 'fill') {
        ctx.fillStyle = K.colour(a, '#d8a038');
        for (let j = -2; j <= 2; j++) {
          ell(ctx, K.sc(3.4) + j * K.sc(0.75), (j % 2 ? 0.25 : -0.25) * K.sc(1), K.sc(0.38), K.sc(0.3), 0.4);
          ctx.fill();
        }
      }
    },
  },
  // Its own idle act, on top of the base's standing about (only while calm), an 18 s loop.
  pose: (m, a, out, K, mv) => {
    // (2026-11-25 polish, the player: "more expressive": a 28 s act)
    //   - the lamp flickers out; a cross tap on the helmet with a wing; back on, brighter, proud;
    //   - pecking about the floor, a seed found, gulped down with a happy shiver;
    //   - a drip from the cellar roof: plink! on its helmet; it jumps, fluffs up, peeks up, squints;
    //   - peering into the dark, low, one way then the other, the beam sweeping;
    //   - a little victory dance, side to side, wings flapping; a happy cheep.
    a.chFace = null;
    a.chLamp = 1;
    a.chCheep = -1;
    a.chSeed = 0;
    a.chDrip = -1;
    a.chGulp = 0;
    if (mv || m.hp <= 0) return;
    const calm = (a.calm ?? 1) * (1 - (a.walkW ?? 0));
    if (calm < 0.02) return;
    const lu = (a.t + (m.uid % 5) * 3.1) % 28;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const hold = K.hold;
    // the lamp: flickers out; a tap on the helmet with a wing; back on, brighter
    const dim = hold(lu, 0.8, 1, 2.2, 2.3);
    const flick = lu > 0.8 && lu < 1.2 ? (Math.sin(lu * 60) > 0 ? 1 : 0) : 0;
    const tap = hold(lu, 1.5, 1.7, 2.2, 2.5) * calm;
    const knock = Math.max(0, Math.sin((lu - 1.7) * 18)) * (lu > 1.7 && lu < 2.25 ? 1 : 0);
    go({ wingN: 0.9 + knock * 0.15, head: 6 + knock * 4, pitch: 2 }, tap);
    const proud = hold(lu, 2.4, 2.6, 3.8, 4.2) * calm;
    go({ pitch: -8, head: -12, fluff: 0.5, tailUp: 18, hop: 0.03 * Math.abs(Math.sin((lu - 2.6) * 6)) }, proud);
    a.chLamp = Math.max(flick, 1 - dim) + hold(lu, 2.3, 2.4, 3.4, 4) * 0.4;
    // pecking about the floor, then a seed found and gulped
    const peck = hold(lu, 6, 6.3, 8.4, 8.8) * calm;
    const jab = Math.max(0, Math.sin(a.t * 9));
    go({ pitch: 24 + jab * 8, reach: 0.4 + jab * 0.5, head: 18, beak: jab > 0.7 ? 0.5 : 0, tailUp: 16 }, peck);
    a.chSeed = hold(lu, 8, 8.2, 9.1, 9.3) * calm;
    go({ pitch: -4, head: -6, beak: 0.15, fluff: 0.3 }, a.chSeed);
    const gulp = hold(lu, 9.2, 9.35, 9.6, 10.4) * calm;
    go({ pitch: -10, head: -20, reach: 0.4, fluff: 0.8 + Math.sin(a.t * 40) * 0.15, tailUp: 20 }, gulp);
    a.chGulp = gulp;
    // a drip from the roof: plink! a jump, fluffed up, a suspicious look up
    const dripAt = 11.6;
    const jump = hold(lu, dripAt, dripAt + 0.08, dripAt + 0.35, dripAt + 0.7) * calm;
    const look = hold(lu, dripAt + 0.6, dripAt + 1, dripAt + 2.4, dripAt + 2.8) * calm;
    go({ hop: 0.22, fluff: 1, wingN: 0.6, wingF: 0.6, spread: 1, pitch: -6, head: -6, tailUp: 24 }, jump);
    go({ head: -34, pitch: -10, fluff: 0.5, crouch: 0.2, tailUp: 6 }, look);
    a.chDrip = lu >= dripAt - 0.8 && lu < dripAt + 0.8 ? (lu - (dripAt - 0.8)) / 0.8 : -1;
    // peering into the dark, low, one way then the other
    const peer = hold(lu, 16, 16.4, 18.6, 19) * calm;
    go({ crouch: 0.5, pitch: 6, head: (lu < 17.3 ? 1 : -1) * 12, reach: 0.3, tailUp: 4 }, peer);
    // a little victory dance, then a happy cheep
    const dance = hold(lu, 21, 21.3, 23.5, 23.8) * calm;
    const dp = Math.sin((lu - 21.3) * Math.PI * 2.2);
    go({ hop: 0.08 * Math.abs(dp), x: dp * 0.05, pitch: dp * 8, head: -dp * 10, wingN: 0.8, wingF: 0.8, flap: 1, spread: 0.6, tailUp: 20 + dp * 8, fluff: 0.3 }, dance);
    const cheep = hold(lu, 24.2, 24.3, 25, 25.3) * calm;
    if (cheep > 0.001) go(K.poseAt(K.moves.call, Math.max(0, Math.min(0.8, lu - 24.3)), 1, out), cheep);
    a.chCheep = lu >= 24.3 && lu < 25.6 ? (lu - 24.3) / 1.3 : -1;
    a.chFace = tap > 0.5 && knock > 0.3 ? 'angry' : proud > 0.4 ? 'happy' : gulp > 0.3 ? 'happy' : a.chSeed > 0.4 ? 'happy' : jump > 0.3 ? 'hurt'
      : look > 0.4 ? 'angry' : dance > 0.4 ? 'happy' : cheep > 0.3 ? 'happy' : null;
  },
  // Its extras: the lamp's soft beam ahead of it, the seed in its beak, the cheep's little notes.
  fx: (ctx, m, a, K) => {
    if (m.hp <= 0 || !a.bk) return;
    const sk = a.bk;
    ctx.save();
    // the drip: a drop falling from above onto the helmet, a splash and a ring
    const dr = a.chDrip ?? -1;
    if (dr >= 0) {
      const top = [sk.hp[0], sk.hp[1] - K.sc(K.P.head.r) * 1.25];
      ctx.fillStyle = '#a8dcff';
      if (dr < 1) {
        const y = top[1] - K.H * 1.1 + dr * dr * K.H * 1.1;
        ctx.globalAlpha = Math.min(1, dr * 5);
        ctx.beginPath();
        ctx.moveTo(top[0], y - K.sc(2.4));
        ctx.quadraticCurveTo(top[0] + K.sc(1.5), y + K.sc(0.4), top[0], y + K.sc(1.2));
        ctx.quadraticCurveTo(top[0] - K.sc(1.5), y + K.sc(0.4), top[0], y - K.sc(2.4));
        ctx.fill();
      } else {
        const u = dr - 1;
        for (let i = 0; i < 4; i++) {
          const an = -Math.PI + (i / 3) * Math.PI;
          ctx.globalAlpha = 1 - u;
          ell(ctx, top[0] + Math.cos(an) * K.sc(2 + u * 8), top[1] + Math.sin(an) * K.sc(2 + u * 6) + u * u * K.sc(8), K.sc(0.8), K.sc(0.8));
          ctx.fill();
        }
        ctx.globalAlpha = (1 - u) * 0.8;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 0.6;
        ctx.beginPath();
        ctx.arc(top[0] + K.sc(6), top[1] - K.sc(3), K.sc(2 + u * 3), -Math.PI * 0.7, -Math.PI * 0.1);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    }
    // the gulp: a happy shiver of little sparkles
    if ((a.chGulp ?? 0) > 0.3) {
      for (let i = 0; i < 3; i++) {
        const u = (a.t * 2 + i / 3) % 1;
        ctx.globalAlpha = a.chGulp * Math.sin(Math.PI * u);
        ctx.fillStyle = '#fff2a8';
        const x = sk.hp[0] + (i - 1) * K.sc(7);
        const y = sk.hp[1] - K.sc(12) - u * K.sc(6);
        ctx.beginPath();
        ctx.moveTo(x, y - K.sc(1.6));
        ctx.quadraticCurveTo(x, y, x + K.sc(1.6), y);
        ctx.quadraticCurveTo(x, y, x, y + K.sc(1.6));
        ctx.quadraticCurveTo(x, y, x - K.sc(1.6), y);
        ctx.quadraticCurveTo(x, y, x, y - K.sc(1.6));
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    // the beam: a faint warm cone out ahead from the lamp
    const lamp = a.chLamp ?? 1;
    if (lamp > 0.3) {
      const r = K.sc(K.P.head.r);
      const rx = K.sc(K.P.head.rx);
      const ca = Math.cos(sk.ha);
      const sa = Math.sin(sk.ha);
      const lx = sk.hp[0] + ca * rx * 0.75 - sa * -r * 0.75;
      const ly = sk.hp[1] + sa * rx * 0.75 + ca * -r * 0.75;
      const L = K.H * 1.1;
      const g = ctx.createLinearGradient(lx, ly, lx + ca * L, ly + sa * L);
      g.addColorStop(0, `rgba(255,246,180,${0.2 * Math.min(1, lamp)})`);
      g.addColorStop(1, 'rgba(255,246,180,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      ctx.lineTo(lx + ca * L - sa * L * 0.26, ly + sa * L + ca * L * 0.26);
      ctx.lineTo(lx + ca * L + sa * L * 0.26, ly + sa * L - ca * L * 0.26);
      ctx.closePath();
      ctx.fill();
    }
    // the seed it found, in its beak
    if ((a.chSeed ?? 0) > 0.3) {
      const tip = sk.beakTip ?? sk.hp;
      ctx.globalAlpha = Math.min(1, (a.chSeed - 0.3) * 4);
      ctx.translate(tip[0] - K.sc(0.4), tip[1] + K.sc(0.4));
      ctx.rotate(0.4);
      ctx.fillStyle = '#3a2418';
      ell(ctx, 0, 0, K.sc(1.3), K.sc(0.75));
      ctx.fill();
      ctx.fillStyle = '#f0c050';
      ell(ctx, 0, 0, K.sc(1.05), K.sc(0.55));
      ctx.fill();
      ctx.restore();
      ctx.save();
    }
    // the cheep: two little notes popping up off its beak
    const ch = a.chCheep ?? -1;
    if (ch >= 0) {
      const tip = sk.beakTip ?? sk.hp;
      for (let i = 0; i < 2; i++) {
        const u = Math.max(0, Math.min(1, ch * 1.5 - i * 0.3));
        if (u <= 0 || u >= 1) continue;
        const x = tip[0] + K.sc(2 + u * 5 + i * 2);
        const y = tip[1] - K.sc(3 + u * 7);
        ctx.globalAlpha = Math.sin(Math.PI * u);
        for (const [c, g] of [['#ffffff', 0.5], [i ? '#ff8ab0' : '#f0a030', 0]]) {
          ctx.fillStyle = c;
          ctx.strokeStyle = c;
          ell(ctx, x, y, K.sc(0.9) + g, K.sc(0.7) + g, -0.4);
          ctx.fill();
          ctx.lineWidth = K.sc(0.35) + g * 2;
          ctx.beginPath();
          ctx.moveTo(x + K.sc(0.8), y);
          ctx.lineTo(x + K.sc(0.8), y - K.sc(2.6));
          ctx.quadraticCurveTo(x + K.sc(1.8), y - K.sc(2), x + K.sc(1.6), y - K.sc(1.2));
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  },
};

// (its hop: longer and higher than a songbird's, a quick touch down, about two hops a second at its
// pace, so its short legs never patter: the player, "try to polish the walk animation please")
scout.hop = { stride: 3.4, height: 2.8, duty: 0.32 };
export const CHICK = dressedChick(scout);
CHICK.art.noHop = true;
