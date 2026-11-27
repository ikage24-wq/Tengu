// The Ticket Lop (2026-11-27, new for the Dream Theatre's Grand Lobby, in the Usher Otter's place: the
// player wanted the late regulars to be new creatures that fit their place, each on its own base). The
// lobby's usher: a soft caramel lop-eared bunny in a red usher's pillbox cap with a gold band, a torn ticket
// stub tucked in the band, and a little red bow tie under its chin. Big gentle eyes, a pink nose, a blush.
// It hops about the lobby checking tickets. It moves on its own copy of the bunny base (bunnybase.js, its
// lop: bones, hops, springs and moves), dressed here; its face drawn here from scratch.
import { dressedBunny } from './bunnybase.js';

const TAU = Math.PI * 2;
const ell = (ctx, x, y, rx, ry, r = 0) => {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, r, 0, TAU);
};
const rrect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};
const fillOr = (ctx, a, K, mode, c) => {
  if (mode === 'line') K.edge(ctx);
  else {
    ctx.fillStyle = K.colour(a, c);
    ctx.fill();
  }
};
const COL = {
  cap: '#d8505e',
  capSh: '#b23c4c',
  capLt: '#f07c84',
  gold: '#ffd774',
  goldSh: '#e0a84a',
  ticket: '#fff3d6',
  ticketSh: '#ecd6a6',
  ticketInk: '#d8505e',
  tie: '#d8505e',
  tieSh: '#a83848',
  eye: '#3a2a2a',
  iris: '#7a4a3a',
  blush: '#ff9aa8',
};
const faceOf = (a) => a.tl?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.41) % 4.4) < 0.13 ? 'blink' : 'open');

// ---------- Its face (the head's frame) ----------
function eye(ctx, a, K, x, y, f) {
  const s = K.sc;
  const rx = s(2.1);
  const ry = s(2.6);
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.colour(a, COL.eye);
  if (f === 'hurt') {
    ctx.lineWidth = s(0.6);
    ctx.beginPath();
    ctx.moveTo(x + rx * 0.8, y - ry * 0.5);
    ctx.lineTo(x - rx * 0.5, y);
    ctx.lineTo(x + rx * 0.8, y + ry * 0.5);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = s(0.6);
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - rx, y);
    ctx.quadraticCurveTo(x, y + up * ry * 0.7, x + rx, y);
    ctx.stroke();
    return;
  }
  ell(ctx, x, y, rx, ry);
  ctx.fillStyle = K.colour(a, COL.eye);
  ctx.fill();
  ell(ctx, x + rx * 0.05, y + ry * 0.38, rx * 0.66, ry * 0.42);
  ctx.fillStyle = K.colour(a, COL.iris);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - rx * 0.28, y - ry * 0.36, rx * 0.4, ry * 0.3);
  ctx.fill();
  ell(ctx, x + rx * 0.34, y + ry * 0.3, rx * 0.16, ry * 0.12);
  ctx.fill();
  if (f === 'focus') {
    ctx.lineWidth = s(0.5);
    ctx.beginPath();
    ctx.moveTo(x - rx * 1.1, y - ry * 1.5);
    ctx.lineTo(x + rx * 1.0, y - ry * 1.05);
    ctx.stroke();
  }
}
function face(ctx, a, sk, K) {
  const s = K.sc;
  const f = faceOf(a);
  K.glow(ctx, [s(4.4), s(2.8)], s(2.2), 0.55, COL.blush);
  eye(ctx, a, K, s(3.4), s(-1.4), f);
  // a small mouth under its nose: a soft "w", an "o" when it gasps
  ctx.strokeStyle = K.colour(a, '#a0606a');
  ctx.lineWidth = s(0.42);
  ctx.lineCap = 'round';
  const mx = s(8.3);
  const my = s(3.8);
  if ((a.tl?.gasp ?? 0) > 0.3) {
    ell(ctx, mx, my + s(0.5), s(0.6), s(0.8));
    ctx.fillStyle = K.colour(a, '#a04a6e');
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(mx - s(0.9), my);
    ctx.quadraticCurveTo(mx - s(0.45), my + s(0.6), mx, my);
    ctx.quadraticCurveTo(mx + s(0.45), my + s(0.6), mx + s(0.9), my);
    ctx.stroke();
  }
}

// ---------- Its cap and bow tie (the head's frame) ----------
function cap(ctx, a, mode, K) {
  const s = K.sc;
  K.headFrame(ctx, a);
  ctx.translate(s(-0.6), s(-7.4));
  ctx.rotate(-0.18 + (a.tl?.capTip ?? 0));
  ctx.scale(1.25, 1.25);
  // the pillbox: a rounded drum, a gold band, a little gold button on top
  rrect(ctx, s(-4.4), s(-3.8), s(8.8), s(4.4), s(1.6));
  fillOr(ctx, a, K, mode, COL.cap);
  if (mode === 'fill') {
    ctx.fillStyle = K.colour(a, COL.capLt);
    rrect(ctx, s(-3.6), s(-3.4), s(5.6), s(1.1), s(0.55));
    ctx.fill();
    ctx.fillStyle = K.colour(a, COL.gold);
    ctx.fillRect(s(-4.4), s(-1.4), s(8.8), s(1.3));
    ctx.fillStyle = K.colour(a, COL.goldSh);
    ctx.fillRect(s(-4.4), s(-0.3), s(8.8), s(0.3));
  }
  ell(ctx, 0, s(-4.2), s(0.9), s(0.7));
  fillOr(ctx, a, K, mode, COL.gold);
  // the ticket stub tucked in the band, tilted up at the side
  ctx.save();
  ctx.translate(s(-3.2), s(-1.4));
  ctx.rotate(-0.55 + Math.sin((a.t ?? 0) * 2.1) * 0.04);
  rrect(ctx, s(-1.3), s(-4.6), s(2.6), s(4.8), s(0.4));
  fillOr(ctx, a, K, mode, COL.ticket);
  if (mode === 'fill') {
    ctx.fillStyle = K.colour(a, COL.ticketInk);
    ctx.fillRect(s(-1.3), s(-3.2), s(2.6), s(0.7));
    ctx.fillStyle = K.colour(a, COL.ticketSh);
    ctx.fillRect(s(-0.7), s(-2), s(1.4), s(0.35));
    ctx.fillRect(s(-0.7), s(-1.3), s(1), s(0.35));
  }
  ctx.restore();
}
function bowTie(ctx, a, mode, K) {
  const s = K.sc;
  K.headFrame(ctx, a);
  ctx.translate(s(2.2), s(7.6));
  ctx.rotate(0.15);
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(side * s(1.6), s(-2.2), side * s(3), s(-1.4));
    ctx.quadraticCurveTo(side * s(3.4), 0, side * s(3), s(1.4));
    ctx.quadraticCurveTo(side * s(1.6), s(2.2), 0, 0);
    ctx.closePath();
    fillOr(ctx, a, K, mode, COL.tie);
  }
  ell(ctx, 0, 0, s(0.9), s(0.9));
  fillOr(ctx, a, K, mode, COL.tieSh);
}

const look = {
  ink: '#a8785a',
  C: { lt: '#fff4e6', base: '#f0d4b0', sh: '#dcb48a', deep: '#c0946c', guide: '#f0d4b0', nose: '#f08a9a', inner: '#ffcccc' },
  face,
  over: {
    head: (ctx, a, mode, K) => {
      ctx.save();
      bowTie(ctx, a, mode, K);
      ctx.restore();
      ctx.save();
      cap(ctx, a, mode, K);
      ctx.restore();
    },
  },
  // (its own sprung channels for the legs: the near forepaw up over its head, `reach`; a hind foot up to
  // its ear, `scratch`)
  channels: { reach: [170, 21], scratch: [200, 20] },
  // Its act, about 30 s, the lobby usher between shows (on the base's channels: x, lift, hop, pitch, hunch,
  // crouch, sit, lie, loaf, neck, head, jaw, ears, and reach, scratch):
  //   - a ticket checked: up on its haunches, a forepaw up, the stub punched with a "click!";
  //   - a "shh!" to the noisy lobby, ears up, leaning in;
  //   - its cap set straight with a hind foot, a little shake, a proud chin up;
  //   - a patrol on the spot: little hops, looking one way and the other;
  //   - a quiet loaf by the door, eyes shut, a "z", then up again, ears bouncing.
  pose: (m, a, out, K, mv) => {
    const tl = { face: null, gasp: 0, capTip: 0, ticket: 0, punch: -1, shh: -1, z: 0 };
    a.tl = tl;
    if (m.hp <= 0) {
      tl.face = 'dead';
      return;
    }
    if ((a.hurtAgo ?? 9) < 0.45) {
      tl.face = 'hurt';
      return;
    }
    if (mv) {
      tl.face = 'focus';
      return;
    }
    const calm = Math.max(0, Math.min(1, (a.calm ?? 1) * (1 - Math.min(1, a.walkW ?? 0)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1)));
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 3.6) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // a ticket checked and punched
    const check = hold(lu, 1, 1.6, 4.6, 5.2) * calm;
    tl.ticket = check;
    go({ sit: 0.85, reach: 0.55, head: 8, ears: 0.2 }, check);
    if (lu > 3.2 && lu < 4.1) tl.punch = (lu - 3.2) / 0.9;
    // "shh!"
    const shh = hold(lu, 6.4, 6.8, 9.2, 9.8) * calm;
    go({ sit: 0.6, neck: 0.4, head: -4, ears: -0.4, pitch: -3 }, shh);
    if (shh > 0.4) tl.shh = ((lu - 6.8) % 1.2) / 1.2;
    // its cap set straight with a hind foot, then a proud chin up
    const fix = hold(lu, 11, 11.5, 13.6, 14.1) * calm;
    go({ scratch: 0.8, sit: 0.3, head: 6, crouch: 0.1 }, fix);
    tl.capTip = fix * Math.sin(lu * 30) * 0.12;
    const proud = hold(lu, 14, 14.3, 15.4, 15.9) * calm;
    go({ head: -10, sit: 0.25, ears: 0.3 }, proud);
    // a patrol on the spot
    const patrol = hold(lu, 17, 17.4, 21.6, 22) * calm;
    const hp = Math.max(0, Math.sin((lu - 17.4) * Math.PI * 2.4));
    go({ hop: hp * 0.12, head: Math.sin((lu - 17.4) * 1.6) * 16, pitch: -hp * 4 }, patrol);
    // a quiet loaf by the door
    const loaf = hold(lu, 23, 23.8, 27.4, 28) * calm;
    go({ loaf: 1, head: 6, ears: -0.2 }, loaf);
    tl.z = loaf;
    const up = hold(lu, 27.8, 28, 28.4, 28.9) * calm;
    go({ hop: 0.1, ears: 0.8 }, up);
    tl.face = check > 0.4 ? 'focus' : shh > 0.4 ? 'focus' : fix > 0.4 ? 'blink' : proud > 0.4 ? 'happy' : loaf > 0.4 ? 'sleep' : patrol > 0.4 ? 'open' : null;
  },
  // Its extras: the ticket it punches (a little star punched out, "click!"), its "shh!", sleepy z's.
  fx: (ctx, m, a, K) => {
    const tl = a.tl;
    const sk = a.bk;
    if (!tl || !sk || m.hp <= 0) return;
    const s = K.sc;
    const t = a.t ?? 0;
    const head = sk.hp;
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
    if (tl.ticket > 0.05) {
      // the ticket, held up in front of its face
      const p = [head[0] + s(14), head[1] + s(1)];
      ctx.save();
      ctx.globalAlpha *= Math.min(1, tl.ticket * 1.5);
      ctx.translate(p[0], p[1]);
      ctx.rotate(-0.25 + Math.sin(t * 2) * 0.04);
      rrect(ctx, s(-2.8), s(-1.6), s(5.6), s(3.2), s(0.5));
      ctx.fillStyle = K.colour(a, COL.ticket);
      ctx.fill();
      ctx.strokeStyle = K.colour(a, COL.ticketSh);
      ctx.lineWidth = s(0.35);
      ctx.stroke();
      ctx.fillStyle = K.colour(a, COL.ticketInk);
      ctx.fillRect(s(-2.8), s(-0.4), s(5.6), s(0.7));
      if (tl.punch >= 0) {
        // a little star punched out of it, popping free
        const u = tl.punch;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        const sx = s(1.4) + u * s(3);
        const sy = s(-0.6) - u * s(4);
        const r = s(0.9);
        for (let i = 0; i < 10; i++) {
          const an = -Math.PI / 2 + (i * Math.PI) / 5 + u * 3;
          const rr = i % 2 ? r * 0.45 : r;
          const q = [sx + Math.cos(an) * rr, sy + Math.sin(an) * rr];
          if (i) ctx.lineTo(...q);
          else ctx.moveTo(...q);
        }
        ctx.closePath();
        ctx.globalAlpha *= 1 - u * 0.6;
        ctx.fillStyle = K.colour(a, COL.gold);
        ctx.fill();
      }
      ctx.restore();
      if (tl.punch >= 0) text('click!', head[0] + s(15), head[1] - s(5) - tl.punch * s(3), s(4.4), '#d8505e', Math.sin(Math.PI * tl.punch));
    }
    if (tl.shh >= 0) text('shh!', head[0] + s(12), head[1] - s(4) - tl.shh * s(3), s(5), '#6a58c0', Math.sin(Math.PI * tl.shh));
    if (tl.z > 0.3) {
      const u = (t * 0.45) % 1;
      text('z', head[0] + s(4 + u * 4), head[1] - s(8 + u * 8), s(4 + u * 2.4), '#a99ee8', tl.z * Math.sin(Math.PI * u));
    }
  },
};

const B = dressedBunny(look);
export const TICKET_LOP_ART = { ...B.art, noHop: true };
export const TICKET_LOP_SIZE = { w: Math.round(B.w), h: Math.round(B.h), speed: B.speed };
