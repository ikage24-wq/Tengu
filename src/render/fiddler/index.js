// The Paperclip Fiddler (2026-11-27, new for Act II: The Office, in the Red-Tape Raccoon's place: the
// player wanted the late regulars to be new creatures that fit their place, each on its own base). A
// soft coral fiddler crab who works in the dream office: its big claw holds a red stapler (it staples
// red tape at you from afar), a silver paperclip clipped on its shell like a hair clip, a yellow sticky note stuck on its back. Its face is on the front of its shell (no eye
// stalks: big round eyes, a blush, a small mouth). It moves on its own copy of the crab base
// (crabbase.js, its fiddler: bones, scuttle, claws, springs and moves), dressed here.
import { dressedCrab } from './crabbase.js';

const TAU = Math.PI * 2;
const plus = (p, q) => [p[0] + q[0], p[1] + q[1]];
const turn = ([x, y], r) => [x * Math.cos(r) - y * Math.sin(r), x * Math.sin(r) + y * Math.cos(r)];
const mix = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
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
const INK = '#b0605a';
const COL = {
  eye: '#3a2228',
  stapler: '#e8505e',
  staplerSh: '#b83848',
  staplerLt: '#ff8a94',
  metal: '#d8dce8',
  metalSh: '#a8aec2',
  clip: '#c8d0e4',
  lanyard: '#5b8fd8',
  badge: '#ffffff',
  badgeSh: '#dfe6f2',
  badgeInk: '#5b8fd8',
  note: '#ffe98a',
  noteSh: '#f2cf58',
  blush: '#ff8f9c',
};

// Where things sit on the shell: along the front rim (u 0..1 from its far end) and up from it.
function onFront(sk, u, up) {
  const F = sk.front;
  if (!F || F.length < 2) return sk.top;
  const i = Math.min(F.length - 2, Math.floor(u * (F.length - 1)));
  const k = u * (F.length - 1) - i;
  const p = mix(F[i], F[i + 1], k);
  return [p[0], p[1] - up];
}
const faceOf = (a) => a.fd?.face ?? ((((a.t ?? 0) + (a.mo?.uid ?? 0) * 0.5) % 4.4) < 0.13 ? 'blink' : 'open');

function eye(ctx, a, K, x, y, r, f) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = K.tone(a, COL.eye);
  if (f === 'hurt') {
    ctx.lineWidth = r * 0.38;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.8, y - r * 0.6);
    ctx.lineTo(x + r * 0.5, y);
    ctx.lineTo(x - r * 0.8, y + r * 0.6);
    ctx.stroke();
    return;
  }
  if (f === 'blink' || f === 'sleep' || f === 'dead' || f === 'happy') {
    ctx.lineWidth = r * 0.38;
    ctx.beginPath();
    const up = f === 'happy' ? -1 : 1;
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x, y + up * r * 0.8, x + r, y);
    ctx.stroke();
    return;
  }
  ell(ctx, x, y, r, r * 1.12);
  ctx.fillStyle = K.tone(a, COL.eye);
  ctx.fill();
  ell(ctx, x, y + r * 0.45, r * 0.62, r * 0.4);
  ctx.fillStyle = K.tone(a, '#7a4a5a');
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ell(ctx, x - r * 0.3, y - r * 0.38, r * 0.36, r * 0.32);
  ctx.fill();
  ell(ctx, x + r * 0.32, y + r * 0.3, r * 0.15, r * 0.13);
  ctx.fill();
  if (f === 'focus') {
    ctx.lineWidth = r * 0.3;
    ctx.beginPath();
    ctx.moveTo(x - r * 1.1, y - r * 1.6);
    ctx.lineTo(x + r * 1.0, y - r * 1.15);
    ctx.stroke();
  }
}
function face(ctx, a, K) {
  const sk = a.bk;
  const S = K.sc(1);
  const f = faceOf(a);
  const eL = onFront(sk, 0.42, 4.6 * S);
  const eR = onFront(sk, 0.64, 4.8 * S);
  ctx.fillStyle = K.tone(a, COL.blush, 0.55);
  ell(ctx, eL[0] - 1.6 * S, eL[1] + 2.4 * S, 1.6 * S, 0.8 * S);
  ctx.fill();
  ell(ctx, eR[0] + 1.6 * S, eR[1] + 2.4 * S, 1.6 * S, 0.8 * S);
  ctx.fill();
  eye(ctx, a, K, eL[0], eL[1], 1.7 * S, f);
  eye(ctx, a, K, eR[0], eR[1], 1.75 * S, f);
  const m = mix(eL, eR, 0.5);
  ctx.strokeStyle = K.tone(a, '#9a4a52');
  ctx.lineWidth = 0.45 * S;
  ctx.lineCap = 'round';
  ctx.beginPath();
  if (f === 'focus' || f === 'hurt') {
    ctx.moveTo(m[0] - 1 * S, m[1] + 2.6 * S);
    ctx.lineTo(m[0] + 1 * S, m[1] + 2.4 * S);
  } else {
    ctx.moveTo(m[0] - 1 * S, m[1] + 2.2 * S);
    ctx.quadraticCurveTo(m[0], m[1] + 3 * S, m[0] + 1 * S, m[1] + 2.2 * S);
  }
  ctx.stroke();
}

// The red stapler held in its big claw (the claw's own frame: along the hand from the wrist).
function stapler(ctx, a, K, mode) {
  const sk = a.bk;
  const c = sk.claws.lead;
  const L = c.c.L;
  const W = c.c.W;
  const o = plus(c.W, turn([L * 0.35, -W * 0.05], c.ang));
  const S = K.sc(1);
  const open = (a.fd?.staple ?? 0) * 0.35;
  ctx.save();
  ctx.translate(o[0], o[1]);
  ctx.rotate(c.ang);
  // its grey base
  rrect(ctx, -1 * S, 0.6 * S, 11 * S, 2.2 * S, 1 * S);
  if (mode === 'line') K.outline(ctx);
  else {
    ctx.fillStyle = K.tone(a, COL.metal);
    ctx.fill();
    ctx.fillStyle = K.tone(a, COL.metalSh);
    ctx.fillRect(-0.6 * S, 2 * S, 10.6 * S, 0.6 * S);
  }
  // its red top, hinged at the back (it opens a little to staple)
  ctx.save();
  ctx.translate(-0.4 * S, 0.6 * S);
  ctx.rotate(-open);
  rrect(ctx, 0, -3.2 * S, 11.4 * S, 3.4 * S, 1.6 * S);
  if (mode === 'line') K.outline(ctx);
  else {
    ctx.fillStyle = K.tone(a, COL.stapler);
    ctx.fill();
    ctx.fillStyle = K.tone(a, COL.staplerLt);
    rrect(ctx, 1.4 * S, -2.8 * S, 7.6 * S, 0.9 * S, 0.45 * S);
    ctx.fill();
    ctx.fillStyle = K.tone(a, COL.staplerSh);
    ctx.fillRect(0.6 * S, -0.6 * S, 10.2 * S, 0.6 * S);
  }
  ctx.restore();
  ctx.restore();
}
// The paperclip on its shell, like a hair clip, and the sticky note on its back.
function clipAndNote(ctx, a, K, mode) {
  const sk = a.bk;
  const S = K.sc(1);
  // the sticky note, on the far side of the dome, a corner curling
  const n = plus(sk.top, [-5.4 * S, 1.2 * S]);
  ctx.save();
  ctx.globalAlpha *= 1 - (a.fd?.noteOff ?? 0);
  ctx.translate(n[0], n[1]);
  ctx.rotate(-0.25);
  ctx.beginPath();
  ctx.moveTo(-2.6 * S, -2.6 * S);
  ctx.lineTo(2.6 * S, -2.6 * S);
  ctx.lineTo(2.6 * S, 1.4 * S);
  ctx.quadraticCurveTo(2.2 * S, 2.6 * S, 1.2 * S, 2.6 * S);
  ctx.lineTo(-2.6 * S, 2.6 * S);
  ctx.closePath();
  if (mode === 'line') K.outline(ctx);
  else {
    ctx.fillStyle = K.tone(a, COL.note);
    ctx.fill();
    ctx.strokeStyle = K.tone(a, COL.noteSh);
    ctx.lineWidth = 0.4 * S;
    ctx.beginPath();
    ctx.moveTo(-1.6 * S, -0.8 * S);
    ctx.lineTo(1.4 * S, -0.8 * S);
    ctx.moveTo(-1.6 * S, 0.6 * S);
    ctx.lineTo(0.6 * S, 0.6 * S);
    ctx.stroke();
  }
  ctx.restore();
  // the paperclip, clipped on near the top: a long rounded loop of silver wire
  const p = plus(sk.top, [2.6 * S, -0.6 * S]);
  ctx.save();
  ctx.translate(p[0], p[1]);
  ctx.rotate(-0.5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const wire = () => {
    ctx.beginPath();
    ctx.moveTo(-1 * S, 1.2 * S);
    ctx.lineTo(4.4 * S, 1.2 * S);
    ctx.arc(4.4 * S, 0, 1.2 * S, Math.PI / 2, -Math.PI / 2, true);
    ctx.lineTo(-2.6 * S, -1.2 * S);
    ctx.arc(-2.6 * S, 0.1 * S, 1.3 * S, -Math.PI / 2, Math.PI / 2, true);
    ctx.lineTo(3.2 * S, 1.4 * S);
  };
  wire();
  if (mode === 'line') {
    ctx.lineWidth = 1.7 * S;
    K.outline(ctx);
    ctx.lineWidth = 1.7 * S;
    ctx.stroke();
  } else {
    ctx.strokeStyle = K.tone(a, COL.clip);
    ctx.lineWidth = 0.9 * S;
    ctx.stroke();
  }
  ctx.restore();
}
// The ID badge on a blue lanyard, hanging at the front of its shell.
function badge(ctx, a, K, mode) {
  const sk = a.bk;
  const S = K.sc(1);
  const top = onFront(sk, 0.9, 6 * S);
  const sw = Math.sin((a.t ?? 0) * 2.3) * 0.08 + (a.fd?.badgeKick ?? 0);
  const hang = plus(onFront(sk, 0.82, -1.4 * S), [Math.sin(sw) * 2 * S, 0]);
  if (mode === 'fill') {
    ctx.strokeStyle = K.tone(a, COL.lanyard);
    ctx.lineWidth = 0.7 * S;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(...top);
    ctx.quadraticCurveTo(top[0] + 1.6 * S, (top[1] + hang[1]) / 2, ...hang);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(hang[0], hang[1]);
  ctx.rotate(sw);
  rrect(ctx, -2.2 * S, 0, 4.4 * S, 5.2 * S, 0.8 * S);
  if (mode === 'line') K.outline(ctx);
  else {
    ctx.fillStyle = K.tone(a, COL.badge);
    ctx.fill();
    ctx.fillStyle = K.tone(a, COL.badgeInk);
    ctx.fillRect(-2.2 * S, 0.3 * S, 4.4 * S, 1.2 * S);
    ell(ctx, -0.8 * S, 3 * S, 0.8 * S, 0.9 * S);
    ctx.fillStyle = K.tone(a, '#ffbfa6');
    ctx.fill();
    ctx.fillStyle = K.tone(a, COL.badgeSh);
    ctx.fillRect(0.4 * S, 2.4 * S, 1.4 * S, 0.4 * S);
    ctx.fillRect(0.4 * S, 3.3 * S, 1.1 * S, 0.4 * S);
  }
  ctx.restore();
}

const look = {
  kind: 'fiddler',
  ink: INK,
  C: { lt: '#fff1ea', base: '#ffc2a8', sh: '#f29e84', deep: '#d47c66', guide: '#ffc2a8', nose: '#d47c66', mouth: '#9a4a52' },
  CC: { lt: '#fff1ea', base: '#ffb49a', sh: '#ec9078', deep: '#cc6e5a' },
  seam: '#ffe2d6',
  hide: { eyes: true },
  mouth: () => {},
  over: {
    body: (ctx, a, mode, K) => {
      ctx.save();
      clipAndNote(ctx, a, K, mode);
      ctx.restore();
      if (mode === 'fill') {
        ctx.save();
        face(ctx, a, K);
        ctx.restore();
      }
    },
    clawLead: (ctx, a, mode, K) => stapler(ctx, a, K, mode),
  },
  // Its act, about 30 s, an office crab at its desk (on the base's channels: x, hop in body heights,
  // crouch, tilt, lR/lU/lO/lA the stapler claw's lunge, raise, open and angle, tR/tU/tO/tA the small
  // claw's):
  //   - stapling a stack of papers: the stapler raised and brought down, ka-chunk! three times;
  //   - a sideways scuttle with a page held up in its small claw, filing it;
  //   - the sticky note peeled off its back and held up to read; a nod; stuck back on;
  //   - its paperclip straightened with the small claw, a little proud tilt;
  //   - work done: both claws up, clack-clack, a happy hop.
  pose: (m, a, out, K, mv) => {
    const fd = { face: null, staple: 0, chunk: -1, stack: 0, page: 0, noteOff: 0, clack: -1 };
    a.fd = fd;
    if (m.hp <= 0) {
      fd.face = 'dead';
      return;
    }
    if ((a.hurtAgo ?? 9) < 0.45) {
      fd.face = 'hurt';
      return;
    }
    if (mv) {
      fd.face = 'focus';
      fd.staple = 1;
      return;
    }
    const calm = Math.max(0, Math.min(1, (a.calm ?? 1) * (1 - Math.min(1, a.walkW ?? 0)) * (a.moving ? 0 : 1) * (m.pose || m.cine ? 0 : 1)));
    if (calm < 0.02) return;
    const t = a.t ?? 0;
    const lu = (((t + (m.uid % 5) * 4.1) % 30) + 30) % 30;
    const hold = (x, a0, a1, b0, b1) => {
      const e = (u) => u * u * (3 - 2 * u);
      return x <= a0 || x >= b1 ? 0 : x < a1 ? e((x - a0) / (a1 - a0)) : x <= b0 ? 1 : e((b1 - x) / (b1 - b0));
    };
    const go = (pose, w) => {
      if (w > 0.001) for (const [k, v] of Object.entries(pose)) out[k] = (out[k] ?? 0) + (v - (out[k] ?? 0)) * w;
    };
    // stapling: the stapler raised, then brought down hard, three times
    const staple = hold(lu, 1.5, 2, 6.2, 6.7) * calm;
    fd.stack = staple;
    const beat = (((lu - 2) % 1.3) + 1.3) % 1.3;
    const down = beat > 0.75 && beat < 1.05 ? 1 : beat >= 1.05 ? Math.max(0, 1 - (beat - 1.05) / 0.25) : 0;
    go({ lU: 1.2 - down * 1.5, lR: 0.5, lO: 0.15, lA: -30 + down * 28, crouch: 0.12 + down * 0.08, tilt: 3 + down * 2 }, staple);
    if (staple > 0.5 && beat > 0.78 && beat < 1.2 && lu < 6) fd.chunk = (beat - 0.78) / 0.42;
    if (staple > 0.3) fd.staple = down * 0.6;
    // a sideways scuttle with a page held up, filing it
    const file = hold(lu, 8, 8.4, 11.6, 12) * calm;
    fd.page = file;
    go({ x: Math.sin((lu - 8.4) * Math.PI * 0.9) * 0.18, hop: Math.abs(Math.sin(lu * 12)) * 0.015, tU: 1.3, tA: -70, tO: 0.1, tilt: Math.sin(lu * 12) * 2 }, file);
    // the sticky note: peeled off its back, held up to read, a nod, stuck back on
    const read = hold(lu, 13, 13.6, 17.4, 18) * calm;
    fd.noteOff = hold(lu, 13.3, 13.5, 17.6, 17.8);
    go({ tU: 1.5, tR: 0.6, tA: -100, tO: 0.05, tilt: -4, crouch: 0.05 }, read);
    const nod = hold(lu, 16, 16.2, 16.9, 17.1) * calm;
    out.tilt = (out.tilt ?? 0) + nod * Math.sin((lu - 16) * 14) * 3;
    // the paperclip straightened, then a little proud tilt
    const clip = hold(lu, 20.5, 21, 23, 23.5) * calm;
    go({ tU: 1.8, tR: -0.2, tA: -150 + Math.sin(lu * 9) * 8, tO: 0.4, tilt: -6 }, clip);
    const proud = hold(lu, 23.4, 23.7, 24.6, 25) * calm;
    go({ tilt: 7, crouch: -0.04 }, proud);
    // work done: both claws up, clack-clack, a happy hop
    const yay = hold(lu, 26, 26.3, 28.6, 29) * calm;
    const ck = Math.max(0, Math.sin((lu - 26.3) * Math.PI * 4));
    go({ lU: 1.6, tU: 1.6, lO: ck, tO: ck, lA: -60, tA: -110, hop: Math.abs(Math.sin((lu - 26.3) * Math.PI * 2)) * 0.06 }, yay);
    if (yay > 0.4) fd.clack = ((lu - 26.3) % 0.75) / 0.75;
    fd.face = staple > 0.4 ? 'focus' : read > 0.4 ? 'open' : clip > 0.4 || proud > 0.4 || yay > 0.4 || nod > 0.3 ? 'happy' : null;
  },
  // Its extras: the stack of papers it staples (a "ka-chunk!"), the page it files, the sticky note in
  // its claw while it reads, and a "clack!" when its work is done.
  fx: (ctx, m, a, K) => {
    const fd = a.fd;
    if (!fd || m.hp <= 0) return;
    const sk = a.bk;
    const S = K.sc(1);
    const t = a.t ?? 0;
    const text = (str, x, y, size, col, al, rot = 0) => {
      ctx.save();
      ctx.globalAlpha *= al;
      ctx.translate(x, y);
      if (a.flip) ctx.scale(-1, 1);
      ctx.rotate(rot);
      ctx.font = `800 ${size}px Nunito, "Trebuchet MS", sans-serif`;
      ctx.lineWidth = Math.max(1, size * 0.22);
      ctx.strokeStyle = '#ffffff';
      ctx.fillStyle = col;
      ctx.textAlign = 'center';
      ctx.strokeText(str, 0, 0);
      ctx.fillText(str, 0, 0);
      ctx.restore();
    };
    const lead = sk.claws.lead;
    const trail = sk.claws.trail;
    const tipL = plus(lead.W, turn([lead.c.L * 0.9, 0], lead.ang));
    const tipT = plus(trail.W, turn([trail.c.L * 0.6, 0], trail.ang));
    // the stack of papers on the ground under the stapler
    if (fd.stack > 0.02) {
      ctx.save();
      ctx.globalAlpha *= Math.min(1, fd.stack * 1.5);
      for (let i = 0; i < 4; i++) {
        rrect(ctx, tipL[0] - 5 * S + (i % 2) * 0.6 * S, -1.6 * S - i * 1.1 * S, 9 * S, 1.3 * S, 0.4 * S);
        ctx.fillStyle = K.tone(a, i % 2 ? '#f6f2ea' : '#ffffff');
        ctx.fill();
        ctx.strokeStyle = K.tone(a, '#d8d0c4');
        ctx.lineWidth = 0.35 * S;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (fd.chunk >= 0) text('ka-chunk!', tipL[0], tipL[1] - 8 * S - fd.chunk * 3 * S, 4.6 * S, '#e8505e', Math.sin(Math.PI * fd.chunk));
    // the page held up while it files it
    if (fd.page > 0.05) {
      ctx.save();
      ctx.globalAlpha *= Math.min(1, fd.page * 1.5);
      ctx.translate(tipT[0], tipT[1]);
      ctx.rotate(trail.ang + Math.PI / 2 + Math.sin(t * 9) * 0.06);
      rrect(ctx, -3 * S, -8 * S, 6 * S, 8 * S, 0.6 * S);
      ctx.fillStyle = K.tone(a, '#ffffff');
      ctx.fill();
      ctx.strokeStyle = K.tone(a, '#c8c0b8');
      ctx.lineWidth = 0.35 * S;
      ctx.stroke();
      ctx.fillStyle = K.tone(a, '#b8b4c8');
      for (let i = 0; i < 4; i++) ctx.fillRect(-2 * S, -6.6 * S + i * 1.5 * S, (i % 2 ? 2.6 : 4) * S, 0.5 * S);
      ctx.restore();
    }
    // the sticky note, held up to read
    if (fd.noteOff > 0.05) {
      ctx.save();
      ctx.globalAlpha *= fd.noteOff;
      ctx.translate(tipT[0], tipT[1] - 2 * S);
      ctx.rotate(-0.15);
      rrect(ctx, -2.8 * S, -5.4 * S, 5.6 * S, 5.4 * S, 0.5 * S);
      ctx.fillStyle = K.tone(a, COL.note);
      ctx.fill();
      ctx.strokeStyle = K.tone(a, COL.noteSh);
      ctx.lineWidth = 0.4 * S;
      ctx.stroke();
      ctx.fillStyle = K.tone(a, '#e8505e');
      ctx.fillRect(-1.8 * S, -4 * S, 3.4 * S, 0.6 * S);
      ctx.fillRect(-1.8 * S, -2.6 * S, 2.2 * S, 0.6 * S);
      ctx.restore();
    }
    if (fd.clack >= 0) {
      const u = fd.clack;
      text('clack!', sk.top[0], sk.top[1] - 9 * S - u * 3 * S, 4.6 * S, '#ff7fa8', Math.sin(Math.PI * u), Math.sin(t * 20) * 0.06);
    }
  },
};

const F = dressedCrab(look);
export const PAPERCLIP_FIDDLER_ART = { ...F.art, noHop: true };
export const PAPERCLIP_FIDDLER_SIZE = { w: Math.round(F.w), h: Math.round(F.h), speed: F.speed };
