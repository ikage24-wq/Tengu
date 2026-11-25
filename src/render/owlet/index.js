// The Leaf Cloak Owlet (2026-11-25, the Moss Owlet remade on the owl base, the player's pick "C" of
// three): a snowy white puff of an owlet of Mossy Woods, wrapped in a big orange maple leaf worn as a
// hooded cloak (its veins, a darker edge, the stem curling up behind like the tip of a hood), a berry
// twig in its talons, ice-blue eyes. It moves on its own copy of the owl base (owlbase.js: its bones,
// walk, take-off and glide, springs and moves: swoop, wing slap, hoot), dressed here.
//   idle    an 18 s act: the owl's head tilt (curious, one way then the other, eyes wide); a cold
//           breeze: it fluffs right up and shivers as a leaf blows past; a nibble at a berry off its
//           twig, then a happy little hoot.
// Everything drawn here from scratch (the face too).
import { dressedOwl } from './owlbase.js';

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
const faceOf = (a) => a.owFace ?? a.face;
const R = (K) => K.sc(K.P.head.r);
const RX = (K) => K.sc(K.P.head.rx);

// An owl's eye (the head's frame, game px): huge and round in the facial disc, a dark rim, the iris
// in three tones round a big pupil, two glints and a star; a soft feathered brow over it; blinks
// (a slow owl blink, the lid closing from above), squeezes shut when hurt, a happy arc.
function eye(ctx, a, K, col) {
  const cl = (c) => K.colour(a, c);
  const ink = '#2a1a20';
  const f = faceOf(a);
  const x = RX(K) * 0.5;
  const y = -R(K) * 0.06;
  const r = K.sc(2.9) * (f === 'wide' ? 1.12 : 1);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const bl = ((a.t + (a.mo?.uid ?? 0) * 0.53) % 4.6);
  const blink = bl < 0.22 ? Math.sin((bl / 0.22) * Math.PI) : 0;
  if (f === 'dead' || f === 'hurt') {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(x - r, y - r * 0.6);
    ctx.lineTo(x + r * 0.7, y);
    ctx.lineTo(x - r, y + r * 0.6);
    ctx.stroke();
    return;
  }
  if (f === 'happy' || f === 'sleep') {
    ctx.strokeStyle = cl(ink);
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
  ell(ctx, x, y, r, r);
  ctx.fillStyle = cl(ink);
  ctx.fill();
  ell(ctx, x, y + r * 0.04, r * 0.84, r * 0.84);
  ctx.fillStyle = cl(col.iris);
  ctx.fill();
  ell(ctx, x, y - r * 0.5, r * 0.62, r * 0.26);
  ctx.fillStyle = cl(col.dk);
  ctx.fill();
  ell(ctx, x, y + r * 0.5, r * 0.58, r * 0.26);
  ctx.fillStyle = cl(col.lt);
  ctx.fill();
  ell(ctx, x + r * 0.08, y + r * 0.05, r * 0.46, r * 0.5);
  ctx.fillStyle = cl('#140a10');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.3, y - r * 0.34, r * 0.32, r * 0.26);
  ctx.fill();
  ell(ctx, x + r * 0.38, y + r * 0.42, r * 0.14, r * 0.12);
  ctx.fill();
  const sx = x + r * 0.3;
  const sy = y - r * 0.12;
  const s = r * 0.26;
  ctx.beginPath();
  ctx.moveTo(sx, sy - s);
  ctx.quadraticCurveTo(sx, sy, sx + s * 0.6, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy + s);
  ctx.quadraticCurveTo(sx, sy, sx - s * 0.6, sy);
  ctx.quadraticCurveTo(sx, sy, sx, sy - s);
  ctx.fill();
  // the lid: closing from above in a blink, lower when cross
  const lid = Math.max(blink, f === 'angry' ? 0.4 : 0);
  if (lid > 0.05) {
    ctx.save();
    ell(ctx, x, y, r * 1.02, r * 1.02);
    ctx.clip();
    ctx.fillStyle = cl(col.lid);
    ctx.fillRect(x - r * 1.2, y - r * 1.2, r * 2.4, r * 2.2 * lid);
    ctx.restore();
  }
  // (a lid line only when it closes or narrows)
  if (lid > 0.05) {
    ctx.strokeStyle = cl(ink);
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    const ly = y - r + r * 2 * lid;
    ctx.moveTo(x - r * 0.95, ly + r * 0.25);
    ctx.quadraticCurveTo(x, ly - r * 0.15, x + r * 0.95, ly + r * (f === 'angry' ? 0.45 : 0.2));
    ctx.stroke();
  }
  // a little lash flicking up at the back corner
  ctx.strokeStyle = cl(ink);
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.8, y - r * 0.62);
  ctx.quadraticCurveTo(x - r * 1.15, y - r * 0.85, x - r * 1.3, y - r * 1.15);
  ctx.stroke();
  // the feathered brow: a soft little tuft well above it, raised (cross: tipped down at the front)
  ctx.strokeStyle = cl(col.brow);
  ctx.lineWidth = K.sc(0.45);
  ctx.beginPath();
  if (f === 'angry') {
    ctx.moveTo(x - r * 0.8, y - r * 1.4);
    ctx.quadraticCurveTo(x, y - r * 1.35, x + r * 0.8, y - r * 1.05);
  } else {
    ctx.moveTo(x - r * 0.7, y - r * 1.5);
    ctx.quadraticCurveTo(x, y - r * 1.8, x + r * 0.7, y - r * 1.55);
  }
  ctx.stroke();
}
function blush(ctx, a, K) {
  ctx.fillStyle = K.tint(a, '#ff8fa6', 0.5);
  ell(ctx, RX(K) * 0.38, R(K) * 0.42, K.sc(1.8), K.sc(0.8));
  ctx.fill();
}
// Scalloped breast feathers: rows of little arcs over the front of the body.
function scallops(ctx, a, K, c) {
  const sk = a.bk;
  ctx.save();
  K.bodyPath(ctx, a);
  ctx.clip();
  ctx.strokeStyle = K.colour(a, c);
  ctx.lineWidth = K.sc(0.45);
  for (let r = 0; r < 4; r++) for (let i = 0; i < 3; i++) {
    const p = sk.at([2.6 + i * 2.2 - (r % 2) * 1.1, -4 + r * 2.8]);
    ctx.beginPath();
    ctx.arc(p[0], p[1], K.sc(1), 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

// A snowy white puff of an owlet wrapped in a big orange maple leaf worn as a hooded cloak, its stem
// curling up behind like a little tail of the hood; the leaf's veins, a red edge; ice-blue eyes; a
// berry twig in its talons.
const leaf = {
  P: { scale: 0.72 },
  C: { lt: '#ffffff', base: '#f4f2f6', sh: '#d8d4e2', deep: '#b8b2c8', guide: '#f4f2f6', beak: '#f0c060', beakSh: '#c8943a', leg: '#f0d090' },
  face: (ctx, a, sk, K) => {
    eye(ctx, a, K, { iris: '#5ab0f0', dk: '#2a6ab0', lt: '#c8ecff', lid: '#f4f2f6', brow: '#b8b2c8' });
    blush(ctx, a, K);
  },
  over: {
    body: (ctx, a, mode, K) => {
      if (mode === 'fill') scallops(ctx, a, K, '#d8d4e2');
    },
    head: (ctx, a, mode, K) => {
      K.headFrame(ctx, a);
      const rx = RX(K);
      const r = R(K);
      // the maple leaf hood: lobed, its points round, over the back of the head down to the neck
      const pts = [[-rx * 1.15, r * 0.6], [-rx * 1.3, -r * 0.1], [-rx * 1.05, -r * 0.45], [-rx * 1.2, -r * 0.95], [-rx * 0.6, -r * 0.9], [-rx * 0.45, -r * 1.4], [rx * 0.05, -r * 1.05], [rx * 0.35, -r * 1.3], [rx * 0.4, -r * 0.8], [rx * 0.15, -r * 0.55], [-rx * 0.4, -r * 0.4], [-rx * 0.55, r * 0.2], [-rx * 0.65, r * 0.75]];
      smooth(ctx, pts);
      fillOr(ctx, a, K, mode, '#f08a3a');
      if (mode === 'fill') {
        ctx.save();
        smooth(ctx, pts);
        ctx.clip();
        ctx.fillStyle = K.colour(a, '#d8602a');
        ell(ctx, -rx * 0.9, r * 0.2, rx * 0.5, r * 0.7);
        ctx.fill();
        ctx.fillStyle = K.tint(a, '#ffc060', 0.7);
        ell(ctx, -rx * 0.4, -r * 0.85, rx * 0.4, r * 0.18, -0.3);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = K.colour(a, '#c84a1e');
        ctx.lineWidth = K.sc(0.35);
        ctx.beginPath();
        const o = [-rx * 0.75, -r * 0.25];
        for (const p of [[-rx * 1.2, -r * 0.9], [-rx * 0.45, -r * 1.3], [rx * 0.3, -r * 1.2], [-rx * 1.2, r * 0.1]]) {
          ctx.moveTo(...o);
          ctx.quadraticCurveTo((o[0] + p[0]) / 2 + K.sc(0.3), (o[1] + p[1]) / 2, p[0] * 0.92, p[1] * 0.92);
        }
        ctx.stroke();
      }
      // the stem curling up behind
      ctx.beginPath();
      ctx.moveTo(-rx * 1.1, r * 0.3);
      ctx.quadraticCurveTo(-rx * 1.7, r * 0.1, -rx * 1.6, -r * 0.45);
      ctx.lineWidth = K.sc(1);
      ctx.lineCap = 'round';
      if (mode === 'line') {
        ctx.strokeStyle = '#2a2142';
        ctx.lineWidth = K.sc(1) + 2;
      } else ctx.strokeStyle = K.colour(a, '#a8502a');
      ctx.stroke();
    },
    legN: (ctx, a, mode, K) => {
      // a berry twig held in its talons
      const L = a.bk.legs?.legN;
      if (!L?.P) return;
      const [x, y] = L.P;
      ctx.beginPath();
      ctx.moveTo(x - K.sc(3), y - K.sc(0.6));
      ctx.lineTo(x + K.sc(4), y - K.sc(1.4));
      ctx.lineWidth = K.sc(0.7);
      ctx.lineCap = 'round';
      ctx.strokeStyle = mode === 'line' ? '#2a2142' : K.colour(a, '#8a5a3a');
      if (mode === 'line') ctx.lineWidth += 2;
      ctx.stroke();
      for (const [dx, dy] of [[3.4, -2.6], [4.4, -1.8], [2.6, -1.8]]) {
        ell(ctx, x + K.sc(dx), y + K.sc(dy), K.sc(0.8), K.sc(0.8));
        fillOr(ctx, a, K, mode, '#e8384a');
      }
    },
  },

  // Its own idle act, on top of the base's standing about (only while calm), an 18 s loop.
  pose: (m, a, out, K, mv) => {
    // (2026-11-25 polish, the player: "more expressive": a 30 s act)
    //   - curious head tilts, one way, the other, then a big owl head-swivel right over, eyes wide;
    //   - a cold breeze: fluffed right up, shivering, the leaf blowing past;
    //   - a big stretch: one wing up, then the other, then a wide yawn;
    //   - a berry off its twig, head down to it, nibbling;
    //   - dozing on its feet, sinking lower, head nodding... a jolt awake, all its feathers popping;
    //   - a practice flutter (the base's own), a proud landing, and a happy hoot.
    a.owFace = null;
    a.owBreeze = -1;
    a.owNibble = 0;
    a.owHoot = -1;
    a.owDoze = 0;
    a.owPop = -1;
    if (mv || m.hp <= 0) return;
    const calm = (a.calm ?? 1) * (1 - (a.walkW ?? 0));
    if (calm < 0.02) return;
    const lu = (a.t + (m.uid % 5) * 3.1) % 30;
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    const hold = K.hold;
    // the head tilts, then the swivel
    const tilt = hold(lu, 0.8, 1.2, 3.6, 4) * calm;
    const side = lu < 2.3 ? 1 : -1;
    go({ head: 18 * side, pitch: -2, fluff: 0.2 }, tilt);
    const swivel = hold(lu, 3.9, 4.3, 5, 5.5) * calm;
    go({ head: 70, pitch: -4, fluff: 0.4, tailUp: 8 }, swivel);
    // a cold breeze: fluffed right up, shivering, the leaf blowing past
    const cold = hold(lu, 6.8, 7.3, 9.6, 10.2) * calm;
    go({ fluff: 1, crouch: 0.25, pitch: 2 + Math.sin(a.t * 40) * 1.2, head: 6, wingN: 0.05, wingF: 0.05, tailUp: -4 }, cold);
    a.owBreeze = lu >= 6.4 && lu < 9.8 ? (lu - 6.4) / 3.4 : -1;
    // the stretch: one wing, the other, a wide yawn
    const st1 = hold(lu, 11.2, 11.6, 12.2, 12.5) * calm;
    const st2 = hold(lu, 12.4, 12.8, 13.4, 13.7) * calm;
    const yawn = hold(lu, 13.6, 13.9, 14.6, 15) * calm;
    go({ wingN: 1, spread: 0.6, pitch: -6, head: -10, tailUp: 14, fluff: 0.2 }, st1);
    go({ wingF: 1, spread: 0.6, pitch: -6, head: -10, tailUp: 14, fluff: 0.2 }, st2);
    go({ head: -22, pitch: -8, beak: 1, fluff: 0.5, reach: 0.2 }, yawn);
    // a berry off its twig: head down to it, nibbling
    const nib = hold(lu, 16, 16.4, 18.2, 18.6) * calm;
    const chew = Math.max(0, Math.sin(a.t * 12));
    go({ pitch: 14, reach: 0.5, head: 30, beak: chew * 0.6, fluff: 0.3 }, nib);
    a.owNibble = nib;
    // dozing on its feet, nodding lower and lower; then a jolt awake
    const doze = hold(lu, 19.4, 19.9, 22.6, 22.7) * calm;
    const sink = Math.min(1, Math.max(0, (lu - 19.9) / 2.6));
    const nod = Math.max(0, Math.sin(a.t * 2.4));
    go({ crouch: 0.3 * sink, fluff: 0.6, head: 10 + sink * 16 + nod * 6, pitch: 4 + sink * 6, tailUp: -6 }, doze);
    const pop = hold(lu, 22.6, 22.68, 22.9, 23.5) * calm;
    go({ hop: 0.1, fluff: 1, head: -12, pitch: -8, wingN: 0.5, wingF: 0.5, spread: 1, tailUp: 20 }, pop);
    a.owDoze = doze;
    a.owPop = lu >= 22.6 && lu < 23.6 ? lu - 22.6 : -1;
    // a practice flutter (the base's own), then a happy hoot
    const flut = hold(lu, 24.4, 24.5, 25.5, 25.7) * calm;
    if (flut > 0.001) go(K.poseAt(K.moves.flutter, Math.max(0, Math.min(1.05, lu - 24.5)), 1, out), flut);
    const hoot = hold(lu, 26.6, 26.7, 27.4, 27.7) * calm;
    if (hoot > 0.001) go(K.poseAt(K.moves.call, Math.max(0, Math.min(0.8, lu - 26.7)), 1, out), hoot);
    a.owHoot = lu >= 26.7 && lu < 28.2 ? (lu - 26.7) / 1.5 : -1;
    a.owFace = tilt > 0.5 ? 'wide' : swivel > 0.4 ? 'wide' : cold > 0.5 ? (Math.sin(a.t * 3) > 0.3 ? 'happy' : null) : yawn > 0.4 ? 'sleep' : st1 + st2 > 0.5 ? 'happy'
      : nib > 0.5 ? 'happy' : pop > 0.3 ? 'wide' : doze > 0.4 ? 'sleep' : flut > 0.3 ? 'happy' : hoot > 0.3 ? 'happy' : null;
  },
  // Its extras: the leaf blowing past in the breeze, crumbs off the berry, the hoot's little "hoo"
  // marks rising.
  fx: (ctx, m, a, K) => {
    if (m.hp <= 0 || !a.bk) return;
    const sk = a.bk;
    ctx.save();
    // dozing: a little "z" drifting up; the jolt: a few loose feathers popping off
    if ((a.owDoze ?? 0) > 0.5) {
      const u = (a.t * 0.5) % 1;
      ctx.globalAlpha = a.owDoze * Math.sin(Math.PI * u);
      ctx.fillStyle = '#8f7cc4';
      ctx.font = `800 ${K.sc(4 + u * 3)}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.fillText('z', sk.hp[0] + K.sc(6 + u * 5), sk.hp[1] - K.sc(10 + u * 10));
      ctx.globalAlpha = 1;
    }
    const pp = a.owPop ?? -1;
    if (pp >= 0) {
      for (let i = 0; i < 4; i++) {
        const an = -Math.PI * 0.9 + (i / 3) * Math.PI * 0.8;
        const d = K.sc(6 + pp * 12);
        const x = sk.hp[0] + Math.cos(an) * d;
        const y = sk.hp[1] + Math.sin(an) * d + pp * pp * K.sc(14);
        ctx.globalAlpha = 1 - pp;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(an + pp * 6);
        ctx.fillStyle = '#ffffff';
        smooth(ctx, [[-K.sc(1.8), 0], [0, -K.sc(0.8)], [K.sc(1.8), 0], [0, K.sc(0.8)]]);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
    const br = a.owBreeze ?? -1;
    if (br >= 0) {
      const H = K.H;
      const x = sk.hp[0] - H * 0.9 + br * H * 1.9;
      const y = sk.hp[1] - H * 0.25 + Math.sin(br * 9) * H * 0.08 + br * H * 0.35;
      ctx.globalAlpha = Math.min(1, br * 6, (1 - br) * 6);
      ctx.translate(x, y);
      ctx.rotate(br * 14);
      ctx.fillStyle = '#3a2430';
      smooth(ctx, [[-K.sc(3), 0], [-K.sc(1.4), -K.sc(2.2)], [K.sc(0.2), -K.sc(0.8)], [K.sc(1.6), -K.sc(2)], [K.sc(3), 0], [K.sc(0.4), K.sc(2)]]);
      ctx.fill();
      ctx.fillStyle = '#f0a040';
      smooth(ctx, [[-K.sc(2.5), 0], [-K.sc(1.2), -K.sc(1.7)], [K.sc(0.2), -K.sc(0.5)], [K.sc(1.4), -K.sc(1.5)], [K.sc(2.5), 0], [K.sc(0.3), K.sc(1.5)]]);
      ctx.fill();
      ctx.restore();
      ctx.save();
    }
    if ((a.owNibble ?? 0) > 0.4) {
      const tip = sk.beakTip ?? sk.hp;
      for (let i = 0; i < 3; i++) {
        const u = ((a.t * 1.5 + i / 3) % 1);
        ctx.globalAlpha = a.owNibble * (1 - u);
        ctx.fillStyle = i % 2 ? '#e8384a' : '#ff8a9a';
        ell(ctx, tip[0] + Math.sin(i * 2.1 + u * 3) * K.sc(1.2), tip[1] + u * K.sc(7), K.sc(0.4), K.sc(0.4));
        ctx.fill();
      }
    }
    const ho = a.owHoot ?? -1;
    if (ho >= 0) {
      const tip = sk.beakTip ?? sk.hp;
      ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const u = Math.max(0, Math.min(1, ho * 1.4 - i * 0.35));
        if (u <= 0 || u >= 1) continue;
        const r = K.sc(2 + u * 6);
        ctx.globalAlpha = Math.sin(Math.PI * u);
        for (const [c, w] of [['#ffffff', 1.8], ['#c8b4f0', 0.8]]) {
          ctx.strokeStyle = c;
          ctx.lineWidth = w;
          ctx.beginPath();
          ctx.arc(tip[0], tip[1] - K.sc(2), r, -Math.PI * 0.55, -Math.PI * 0.1);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  },
};

export const OWLET = dressedOwl(leaf);
OWLET.art.noHop = true;
