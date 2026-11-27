// The Commuter Pigeon (2026-11-27, new for Act I: The Morning Train, in the Toast-Dash Stoat's place: the
// player wanted the late regulars to be new creatures that fit their place, each on its own base). A
// round, chibi city pigeon who rides the morning train every day: soft lavender-grey, a shiny green and
// violet sheen at its neck, big dark eyes with warm orange rings, a cosy striped scarf against the
// morning chill, its train ticket held in its beak and the morning paper tucked under its wing, little
// pink feet. It moves on its own copy of the songbird base (pigeonbase.js: its bones, hops, flaps,
// springs and moves), dressed here; its face drawn here from scratch.
import { dressedPigeon } from './pigeonbase.js';

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
const R = (K) => K.sc(K.P.head.r);
const RX = (K) => K.sc(K.P.head.rx);
const faceOf = (a) => a.pgFace ?? a.face;

const COL = {
  sheenG: '#5fd0a4',
  sheenV: '#a98ae6',
  belly: '#d8d6f0',
  bar: '#7a7aa8',
  scarf: '#f08a70',
  scarfSh: '#d86a58',
  scarfStripe: '#fff4e6',
  ticket: '#ffe9a8',
  ticketSh: '#e8c46c',
  ticketInk: '#d05a6a',
  paper: '#f7f5ee',
  paperSh: '#d8d4c8',
  paperInk: '#a8a4b8',
  iris: '#ff9a4a',
  ink: '#2a2438',
  cere: '#f4f2fa',
};

// Its eye (the head's frame): a big round dark eye in a warm orange ring, two glints, a soft lash flick;
// blinks; a happy arc; squeezed shut when hurt.
function eye(ctx, a, K) {
  const cl = (c) => K.colour(a, c);
  const f = faceOf(a);
  const x = RX(K) * 0.34;
  const y = -R(K) * 0.1;
  const r = K.sc(2.5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const blink = ((a.t + (a.mo?.uid ?? 0) * 0.53) % 3.6) < 0.11;
  if (f === 'dead' || f === 'hurt') {
    ctx.strokeStyle = cl(COL.ink);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * 0.6);
    ctx.lineTo(x + r * 0.7, y);
    ctx.lineTo(x - r, y + r * 0.6);
    ctx.stroke();
    return;
  }
  if (blink || f === 'happy' || f === 'sleep') {
    ctx.strokeStyle = cl(COL.ink);
    ctx.lineWidth = 0.65;
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
  // the warm orange ring, then the big dark eye inside it
  ell(ctx, x, y, r * 1.02, r * 1.08);
  ctx.fillStyle = cl(COL.iris);
  ctx.fill();
  ell(ctx, x + r * 0.06, y + r * 0.06, r * 0.74, r * 0.8);
  ctx.fillStyle = cl(COL.ink);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.22, y - r * 0.3, r * 0.34, r * 0.3);
  ctx.fill();
  ell(ctx, x + r * 0.3, y + r * 0.34, r * 0.14, r * 0.12);
  ctx.fill();
  ctx.strokeStyle = cl(COL.ink);
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.75, y - r * 0.8);
  ctx.quadraticCurveTo(x - r * 1.1, y - r * 1.0, x - r * 1.25, y - r * 1.3);
  ctx.stroke();
  if (f === 'angry') {
    ctx.strokeStyle = cl('#6a6a9a');
    ctx.lineWidth = K.sc(0.5);
    ctx.beginPath();
    ctx.moveTo(x - r * 0.9, y - r * 1.6);
    ctx.lineTo(x + r * 0.9, y - r * 1.15);
    ctx.stroke();
  }
}
function blush(ctx, a, K) {
  ctx.fillStyle = K.tint(a, '#ff9aaa', 0.5);
  ell(ctx, RX(K) * 0.3, R(K) * 0.42, K.sc(1.7), K.sc(0.75));
  ctx.fill();
}
// The ticket held in its beak: a little cream stub with a punched notch and a pink stripe, tilted.
function ticket(ctx, a, K, mode) {
  const B = K.P.beak;
  ctx.save();
  ctx.translate(K.sc(B.at[0] + B.len * 0.45), K.sc(B.at[1] + 0.5));
  ctx.rotate(0.28 + Math.sin((a.t ?? 0) * 3.1) * 0.05);
  const s = K.sc(1);
  ctx.beginPath();
  ctx.moveTo(-0.6 * s, -1.9 * s);
  ctx.lineTo(6.4 * s, -1.9 * s);
  ctx.lineTo(6.4 * s, -0.5 * s);
  ctx.arc(6.4 * s, 0, 0.5 * s, -Math.PI / 2, Math.PI / 2, true);
  ctx.lineTo(6.4 * s, 1.9 * s);
  ctx.lineTo(-0.6 * s, 1.9 * s);
  ctx.closePath();
  fillOr(ctx, a, K, mode, COL.ticket);
  if (mode === 'fill') {
    ctx.fillStyle = K.colour(a, COL.ticketInk);
    ctx.fillRect(1.4 * s, -1.9 * s, 1.1 * s, 3.8 * s);
    ctx.fillStyle = K.colour(a, COL.ticketSh);
    ctx.fillRect(3.4 * s, -0.5 * s, 2.2 * s, 0.4 * s);
    ctx.fillRect(3.4 * s, 0.4 * s, 1.6 * s, 0.4 * s);
  }
  ctx.restore();
}

// (a pigeon, round and chibi: a plump breast, a big round head, a short fanned tail, small wings)
const PIGEON_P = {
  scale: 0.86,
  body: [[8.4, -3.6], [6.4, -7.8], [1.6, -9.6], [-3.8, -9], [-8.6, -6.4], [-10.6, -2.4], [-10, 1.6], [-7.2, 5.4], [-2.6, 7.8], [2.6, 8.2], [7.2, 6.2], [9.6, 2]],
  breast: [6.4, 2.4, 5.6],
  neck: { base: [6, -5.6], len: 3, ang: -64 },
  head: { r: 8.6, rx: 8.8 },
  beak: { kind: 'cone', at: [8.2, 1.2], len: 3.4, h: 2.6 },
  wing: { root: [2.4, -4.2], far: [-1.4, -1.2], fold: [-218, 5.2, 16, 8], up: [-104, 5.4, 3.8, 9], w: [6, 6.6, 2.6], feathers: 4 },
  leg: { top: [0.4, 3.6], bones: [[1.8, 2.8], [-1.4, 3], [0.6, 3.2]], w: [5, 3, 1.6, 1.5] },
  tail: { root: [-9.6, -1.6], ang: 194, len: 6, w: 3.6, n: 3, spread: 8 },
  moves: ['peck', 'wingSlap', 'call'],
  call: 'coo',
};

const COMMUTER = {
  P: PIGEON_P,
  noFly: true,
  ink: '#6c6a98',
  C: { lt: '#e2e4f6', base: '#b6b9e0', sh: '#9497c6', deep: '#7679ac', guide: '#b6b9e0', beak: '#6a6478', beakSh: '#4c475a', leg: '#ff9aa8' },
  face: (ctx, a, sk, K) => {
    // the white cere at the top of its beak
    const B = K.P.beak;
    ell(ctx, K.sc(B.at[0] - 0.2), K.sc(B.at[1] - 1.3), K.sc(1.1), K.sc(0.65));
    ctx.fillStyle = K.colour(a, COL.cere);
    ctx.fill();
    eye(ctx, a, K);
    blush(ctx, a, K);
  },
  over: {
    body: (ctx, a, mode, K) => {
      if (mode !== 'fill') return;
      const sk = a.bk;
      ctx.save();
      K.bodyPath(ctx, a);
      ctx.clip();
      // a paler belly
      ctx.fillStyle = K.colour(a, COL.belly);
      smooth(ctx, [sk.at([3, -1]), sk.at([10, 0]), sk.at([9, 7]), sk.at([1, 8.6]), sk.at([-4, 5])]);
      ctx.fill();
      // the shiny neck sheen, green into violet, low on its breast
      const g = ctx.createLinearGradient(...sk.at([4, -7]), ...sk.at([9, 1]));
      g.addColorStop(0, K.colour(a, COL.sheenG));
      g.addColorStop(1, K.colour(a, COL.sheenV));
      ctx.fillStyle = g;
      ctx.globalAlpha *= 0.9;
      smooth(ctx, [sk.at([4.6, -3.4]), sk.at([9.6, -1.6]), sk.at([10, 2.6]), sk.at([6.2, 3.2]), sk.at([3.4, 0.2])]);
      ctx.fill();
      ctx.restore();
    },
    scarf: (ctx, a, mode, K) => {
      // the scarf (drawn over its head's chin, so the big round head never hides it): a chunky knitted
      // band wrapped round its neck, pink-red with cream stripes, its long tail fluttering back
      const sk = a.bk;
      const c = sk.at([4.6, -3.2]);
      const S = K.sc(1);
      const flut = Math.sin((a.t ?? 0) * 6) * 0.7 * S * (0.4 + (a.pgRush ?? 0));
      // its tail first, streaming back over the shoulder
      smooth(ctx, [[c[0] - 2 * S, c[1] - 1 * S], [c[0] - 8.6 * S, c[1] - 0.2 * S + flut], [c[0] - 10.4 * S, c[1] + 2.4 * S + flut], [c[0] - 9.6 * S, c[1] + 4.2 * S + flut * 1.3], [c[0] - 3 * S, c[1] + 2.6 * S]]);
      fillOr(ctx, a, K, mode, COL.scarfSh);
      if (mode === 'fill') {
        // a little fringe at its end
        ctx.strokeStyle = K.colour(a, COL.scarfSh);
        ctx.lineWidth = 0.55 * S;
        ctx.lineCap = 'round';
        for (const k of [0, 1, 2]) {
          const fx = c[0] - (10.2 - k * 0.3) * S;
          const fy = c[1] + (2.6 + k * 0.7) * S + flut * 1.2;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx - 1.4 * S, fy + 0.5 * S + flut * 0.4);
          ctx.stroke();
        }
        ctx.strokeStyle = K.colour(a, COL.scarfStripe);
        ctx.lineWidth = 0.7 * S;
        for (const dx of [-7.2, -8.6]) {
          ctx.beginPath();
          ctx.moveTo(c[0] + dx * S, c[1] - 0.2 * S + flut * 0.7);
          ctx.lineTo(c[0] + (dx - 0.4) * S, c[1] + 3.2 * S + flut * 0.9);
          ctx.stroke();
        }
      }
      // the wrap round its neck
      smooth(ctx, [[c[0] - 4.6 * S, c[1] - 2.6 * S], [c[0] + 1 * S, c[1] - 3 * S], [c[0] + 5.2 * S, c[1] - 1.6 * S], [c[0] + 5 * S, c[1] + 2.2 * S], [c[0] + 0.4 * S, c[1] + 3.2 * S], [c[0] - 4.8 * S, c[1] + 2 * S]]);
      fillOr(ctx, a, K, mode, COL.scarf);
      if (mode === 'fill') {
        // a soft edge of its own deeper coral, a light along its top, and the knit's ribs
        ctx.save();
        ctx.clip();
        const hl = ctx.createLinearGradient(0, c[1] - 3 * S, 0, c[1] + 3 * S);
        hl.addColorStop(0, 'rgba(255,236,220,0.55)');
        hl.addColorStop(0.45, 'rgba(255,236,220,0)');
        ctx.fillStyle = hl;
        ctx.fillRect(c[0] - 6 * S, c[1] - 4 * S, 12 * S, 8 * S);
        ctx.strokeStyle = K.tint(a, COL.scarfSh, 0.55);
        ctx.lineWidth = 0.4 * S;
        ctx.lineCap = 'round';
        for (let i = 0; i < 6; i++) {
          const x = c[0] + (-3.8 + i * 1.6) * S;
          ctx.beginPath();
          ctx.moveTo(x, c[1] - 2.2 * S);
          ctx.quadraticCurveTo(x + 0.5 * S, c[1], x + 0.2 * S, c[1] + 2.4 * S);
          ctx.stroke();
        }
        ctx.restore();
        smooth(ctx, [[c[0] - 4.6 * S, c[1] - 2.6 * S], [c[0] + 1 * S, c[1] - 3 * S], [c[0] + 5.2 * S, c[1] - 1.6 * S], [c[0] + 5 * S, c[1] + 2.2 * S], [c[0] + 0.4 * S, c[1] + 3.2 * S], [c[0] - 4.8 * S, c[1] + 2 * S]]);
        ctx.strokeStyle = K.colour(a, COL.scarfSh);
        ctx.lineWidth = 0.6 * S;
        ctx.stroke();
      }
    },
    head: (ctx, a, mode, K) => {
      if ((a.pgTicket ?? 1) < 0.5) return;
      K.headFrame(ctx, a);
      ticket(ctx, a, K, mode);
    },
    wingN: (ctx, a, mode, K) => {
      const sk = a.bk;
      if (mode === 'fill') {
      // two soft dark bars across the folded wing, the way pigeons have
      ctx.strokeStyle = K.colour(a, COL.bar);
      ctx.lineWidth = K.sc(0.9);
      ctx.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [[0.4, -2.2, -5.4, 0.2], [-1.2, 0.4, -6.4, 2.4]]) {
        ctx.beginPath();
        ctx.moveTo(...sk.at([x0, y0]));
        ctx.lineTo(...sk.at([x1, y1]));
        ctx.stroke();
      }
      }
      // (the scarf last of all, over its chin and wing, so nothing hides or crops it)
      ctx.save();
      COMMUTER.over.scarf(ctx, a, mode, K);
      ctx.restore();
    },
  },
  under: {
    wingN: (ctx, a, mode, K) => {
      // the morning paper, folded and tucked under its wing, its edge peeking out behind
      const sk = a.bk;
      const p = sk.at([-6.4, 1.6]);
      ctx.save();
      ctx.translate(p[0], p[1]);
      ctx.rotate(-0.35);
      const s = K.sc(1);
      ctx.beginPath();
      ctx.rect(-5.4 * s, -2.4 * s, 9 * s, 4.6 * s);
      fillOr(ctx, a, K, mode, COL.paper);
      if (mode === 'fill') {
        ctx.fillStyle = K.colour(a, COL.paperSh);
        ctx.fillRect(-5.4 * s, 1.2 * s, 9 * s, 1 * s);
        ctx.fillStyle = K.colour(a, COL.paperInk);
        ctx.fillRect(-4.6 * s, -1.7 * s, 4.6 * s, 0.7 * s);
        ctx.fillRect(-4.6 * s, -0.5 * s, 3.4 * s, 0.4 * s);
        ctx.fillRect(-4.6 * s, 0.2 * s, 3.8 * s, 0.4 * s);
      }
      ctx.restore();
    },
  },
  // Its act, about 30 s (on top of the base's breathing, glances and tail flicks), a pigeon on the
  // morning platform:
  //   - waiting for the train: it leans out and peers down the line, one way, then the other;
  //   - a pigeon's head-bob on the spot, and a puffed-up "coo" with its scarf fluffing;
  //   - nodding off: its eyes droop, three slow nods, a little "z"; then it jolts awake (its stop!),
  //     fluffs up, looks round in a fluster and smooths itself down;
  //   - a proud look at its ticket, head tilted, a happy shuffle;
  //   - a courting turn: puffed up, tail fanned, a little side-to-side shuffle and a "coo coo".
  pose: (m, a, out, K, mv) => {
    const st = (a.mo.pg ??= { rush: 0 });
    const dt = Math.min(0.1, a.dt ?? 1 / 60);
    const moving = m.state === 'walk' || Boolean(mv);
    st.rush += ((moving ? 1 : 0) - st.rush) * (1 - Math.exp(-dt * 5));
    a.pgRush = st.rush;
    a.pgTicket = m.hp > 0 ? 1 : 0;
    a.pgFace = null;
    a.pgCoo = -1;
    a.pgZ = 0;
    a.pgJolt = -1;
    if (mv || m.hp <= 0) return;
    const calm = (a.calm ?? 1) * (1 - (a.walkW ?? 0));
    if (calm < 0.02) return;
    const lu = (a.t + (m.uid % 5) * 3.7) % 30;
    const hold = K.hold;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // waiting for the train: peering down the line, one way then the other
    const peer = hold(lu, 0.5, 0.9, 4.2, 4.6) * calm;
    go({ reach: 0.55, pitch: 2, head: lu < 2.5 ? -6 : 10, crouch: 0.12, tailUp: 6 }, peer);
    // the head-bob, then a puffed-up coo
    const bob = hold(lu, 5, 5.2, 7, 7.2) * calm;
    const bk = Math.max(0, Math.sin((lu - 5) * Math.PI * 3.2));
    go({ reach: bk * 0.7, pitch: 4 + bk * 4, head: -2 }, bob);
    const coo = hold(lu, 7.3, 7.6, 8.8, 9.2) * calm;
    go({ fluff: 0.95, pitch: -8, head: -10, spread: 0.6, tailUp: 14, crouch: 0.1 + Math.sin(lu * 14) * 0.03 }, coo);
    if (coo > 0.3) a.pgCoo = (lu - 7.6) / 1.4;
    // nodding off: three slow nods, then a jolt awake
    const doze = hold(lu, 10, 10.6, 15.2, 15.3) * calm;
    const nod = Math.max(0, Math.sin((lu - 10.6) * Math.PI * 0.68));
    go({ pitch: 6 + nod * 10, head: 10 + nod * 14, crouch: 0.3, fluff: 0.5, tailUp: -2 }, doze);
    a.pgZ = doze;
    const jolt = hold(lu, 15.25, 15.35, 15.7, 16.2) * calm;
    go({ hop: 0.18, fluff: 1, wingN: 0.7, wingF: 0.7, spread: 1, pitch: -8, head: -12, tailUp: 22 }, jolt);
    if (lu > 15.25 && lu < 16.4) a.pgJolt = (lu - 15.25) / 1.15;
    const fluster = hold(lu, 16.1, 16.3, 17.8, 18.2) * calm;
    go({ head: Math.sin(lu * 11) * 22, pitch: -2, fluff: 0.6, tailUp: 8 }, fluster);
    const smooth = hold(lu, 18.1, 18.4, 19.4, 19.8) * calm;
    go({ fluff: 0.2, wingN: 0.25 + Math.max(0, Math.sin(lu * 10)) * 0.2, pitch: 6, head: 16 }, smooth);
    // a proud look at its ticket, then a happy shuffle
    const proud = hold(lu, 20.4, 20.8, 22.6, 23) * calm;
    go({ head: -16, pitch: -6, fluff: 0.3, x: Math.sin(lu * 7) * 0.02, tailUp: 10 }, proud);
    // a courting turn: puffed up, tail fanned, side to side, coo coo
    const court = hold(lu, 24.2, 24.6, 27.4, 27.9) * calm;
    const sw = Math.sin((lu - 24.6) * Math.PI * 1.6);
    go({ fluff: 1, spread: 1, tailUp: 20, pitch: -6 + sw * 4, head: -8 - sw * 6, x: sw * 0.05, hop: 0.02 * Math.abs(sw), crouch: 0.15 }, court);
    if (court > 0.3) a.pgCoo = Math.max(a.pgCoo, (lu - 24.6) / 2.8);
    a.pgFace = jolt > 0.3 ? 'hurt' : fluster > 0.4 ? 'angry' : doze > 0.4 ? 'sleep' : coo > 0.4 || proud > 0.4 || court > 0.4 ? 'happy' : null;
  },
  // Its extras: its coos (little rising notes and a soft 'coo'), sleepy z's, a start's sweat drop.
  fx: (ctx, m, a, K) => {
    if (m.hp <= 0) return;
    const sk = a.bk;
    const hx = sk.hp[0];
    const hy = sk.hp[1];
    const S = K.sc(1);
    const text = (str, x, y, size, col, al) => {
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.translate(x, y);
      if (a.flip) ctx.scale(-1, 1);
      ctx.font = `800 ${size}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = col;
      ctx.strokeText(str, 0, 0);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    if (a.pgCoo >= 0 && a.pgCoo <= 1) {
      const u = a.pgCoo;
      text('coo~', hx + 5 * S, hy - (12 + u * 7) * S, 6 * S, '#ff7fa8', Math.sin(Math.PI * u));
    }
    if ((a.pgZ ?? 0) > 0.2) {
      const u = (a.t * 0.5) % 1;
      text('z', hx + (4 + u * 4) * S, hy - (10 + u * 8) * S, (4.6 + u * 2.4) * S, '#a99ee8', a.pgZ * Math.sin(Math.PI * u));
    }
    if (a.pgJolt >= 0 && a.pgJolt <= 1) {
      const u = a.pgJolt;
      ctx.save();
      ctx.globalAlpha *= Math.sin(Math.PI * u);
      ctx.fillStyle = K.colour(a, '#9fd8ff');
      const x = hx - 7 * S;
      const y = hy - (8 - u * 2) * S;
      ctx.beginPath();
      ctx.moveTo(x, y - 2 * S);
      ctx.quadraticCurveTo(x + 1.4 * S, y, x, y + 1 * S);
      ctx.quadraticCurveTo(x - 1.4 * S, y, x, y - 2 * S);
      ctx.fill();
      ctx.restore();
    }
  },
};

const B = dressedPigeon(COMMUTER);
export const COMMUTER_PIGEON_ART = { ...B.art, noHop: true };
export const COMMUTER_PIGEON_SIZE = { w: Math.round(B.w), h: Math.round(B.h), speed: B.speed };
