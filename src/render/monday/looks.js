// Monday's cast looks (remade 2026-11-27, her new fight, world/theatre.js): each telegraph drawn whole in her own
// soft style (no plain floor marker under it: they are on render/bossfx.js OWN_WARN), while its cast winds up
// (`warn`, p 0..1 through the warning), and in place of the plain flash as it lands (`hit`, u 0..1 over its hold,
// e eased, fade). Her colours: red pen ink, cream calendar paper with a red header, envelope white, alarm-bell
// gold, night navy, a sunny gold for the weekend; every shape rounded, outlined in a deeper shade of its own
// colour, eased; sparkles, never specks. render/dreamfx.js hands each zone with one of these looks to them. (x, y)
// is the zone's spot on the 640 x 360 screen (a band's left end; a circle's or a marker's middle).
//   mnSeeMe    SEE ME (the tank's marker): a red pen circle drawn round them on the floor, "SEE ME" over them, the
//              giant pen hovering; landing, the pen stabs down: a red tick, ink splashes
//   mnUnread   Unread (each of you): an envelope over each head, its unread badge counting up; landing, it bursts
//              open in a flutter of paper
//   mnDay      This Week (a working day's tile): a calendar day standing on the floor (its header and name), a red
//              X drawn across it as the cast fills; landing, the page is torn off: an ink splash
//   mnWeekend  (the weekend's tile: safe) a sunny calendar day, SAT or SUN, a little sun or moon, a warm glow
//              round it; landing, a soft sparkle (a sigh of relief)
//   mnOff      (the floor beyond the week: overtime) dimmed, with a ticking clock face; landing, a dull thud
//   mnAlarm    Wake-Up Call (everyone): a big gold alarm clock over the room, ringing harder and harder; landing,
//              rings of sound across the whole room
//   mnAll      All-Hands Meeting (the healer's marker: gather in): a meeting invite card over them, "ALL-HANDS
//              9:00", a ring of chairs-dots on the floor; landing, a soft burst and papers
//   mnStrike   Strikethrough (ahead of her): a red line ruled across the floor ahead, growing; landing, it strikes
//              through in one stroke
//   mnSnooze   Snooze (everyone, twice): the alarm clock with a big snooze button being pressed; landing, a ring
import { TAU, clamp, sstep, ell, pen, glow, sparkle, hash } from './fx.js';
import { PEN, PAGE, GOLD, NAVY, CREAM, SLEEP } from './palette.js';

const SW = 640;
const rgba = (hex, al) => {
  const n = parseInt(hex.slice(1, 7), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${clamp(al, 0, 1)})`;
};
function word(ctx, text, x, y, size, al, col = NAVY.ink) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = size * 0.36;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = col;
  ctx.fillText(text, x, y);
  ctx.restore();
}
function floorRing(ctx, x, y, r, fill, rim, al, w = 1.6, dash = null) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.22);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (dash) ctx.setLineDash(dash);
  pen(ctx, rim, w);
  ctx.stroke();
  ctx.restore();
}
function inkStroke(ctx, pts, k, al, w = 3.2) {
  if (al <= 0.01 || k <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const n = Math.max(1, Math.floor((pts.length - 1) * k));
  ctx.beginPath();
  for (let i = 0; i <= n; i++) (i ? ctx.lineTo(...pts[i]) : ctx.moveTo(...pts[i]));
  pen(ctx, PEN.ink, w + 1.6);
  ctx.stroke();
  pen(ctx, PEN.base, w);
  ctx.stroke();
  ctx.restore();
}
function splash(ctx, x, y, r, e, fade, n = 7, seed = 0) {
  for (let i = 0; i < n; i++) {
    const an = Math.PI + (i / (n - 1)) * Math.PI;
    const d = r * (0.3 + e * (0.7 + hash(i + seed) * 0.4));
    ell(ctx, x + Math.cos(an) * d, y - 4 + Math.sin(an) * d * 0.7 + e * e * 12, 2.6 * (1 - e * 0.4), 2.8 * (1 - e * 0.4));
    ctx.fillStyle = rgba(PEN.base, fade);
    ctx.fill();
  }
}
// A calendar page standing on the floor: its red header, the day's name, a number.
function dayPage(ctx, x, y, w, h, day, al, opts = {}) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.roundRect(x, y - h, w, h, 5);
  ctx.fillStyle = opts.sunny ? '#fff4cc' : PAGE.base;
  ctx.fill();
  pen(ctx, opts.sunny ? '#e8b14a' : PAGE.ink, 1.6);
  ctx.stroke();
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y - h, w, h, 5);
  ctx.clip();
  ctx.fillStyle = opts.sunny ? '#ffb84a' : PAGE.head;
  ctx.fillRect(x, y - h, w, h * 0.28);
  ctx.restore();
  word(ctx, day, x + w / 2, y - h + h * 0.15, Math.min(12, w * 0.22), 1, '#ffffff');
  if (opts.sunny) {
    // a little sun (Saturday) or a sleepy moon (Sunday)
    if (day === 'SAT') {
      ell(ctx, x + w / 2, y - h * 0.42, 8, 8);
      ctx.fillStyle = '#ffd24a';
      ctx.fill();
      pen(ctx, '#e8a83a', 1.2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(x + w / 2, y - h * 0.42, 8, 0, TAU);
      ctx.arc(x + w / 2 + 4, y - h * 0.46, 7, 0, TAU, true);
      ctx.fillStyle = '#ffe48a';
      ctx.fill('evenodd');
    }
  } else word(ctx, String(opts.num ?? ''), x + w / 2, y - h * 0.45, Math.min(20, w * 0.3), 1, PAGE.head);
  ctx.restore();
}
function envelope(ctx, x, y, s, rot, al, badge = 0, n = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-s, -s * 0.66, s * 2, s * 1.32, s * 0.16);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  pen(ctx, '#a8a6c6', 1.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-s * 0.9, -s * 0.56);
  ctx.lineTo(0, s * 0.1);
  ctx.lineTo(s * 0.9, -s * 0.56);
  ctx.stroke();
  if (badge > 0.01) {
    ctx.globalAlpha *= badge;
    ell(ctx, s * 0.9, -s * 0.66, s * 0.46, s * 0.46);
    ctx.fillStyle = PEN.base;
    ctx.fill();
    pen(ctx, PEN.ink, 1);
    ctx.stroke();
    word(ctx, String(n), s * 0.9, -s * 0.62, s * 0.52, 1, '#ffffff');
  }
  ctx.restore();
}
function clock(ctx, x, y, r, ring, al, snooze = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(Math.sin(ring * 40) * 0.1 * ring);
  // the two bells, the hammer, the face
  for (const s of [-1, 1]) {
    ell(ctx, s * r * 0.62, -r * 0.88, r * 0.38, r * 0.3);
    ctx.fillStyle = GOLD.base;
    ctx.fill();
    pen(ctx, GOLD.ink, 1.4);
    ctx.stroke();
  }
  ell(ctx, 0, 0, r, r);
  ctx.fillStyle = GOLD.base;
  ctx.fill();
  pen(ctx, GOLD.ink, 1.8);
  ctx.stroke();
  ell(ctx, 0, 0, r * 0.8, r * 0.8);
  ctx.fillStyle = '#fffaf0';
  ctx.fill();
  pen(ctx, NAVY.ink, 2);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -r * 0.6);
  ctx.moveTo(0, 0);
  ctx.lineTo(r * 0.4, r * 0.1);
  ctx.stroke();
  if (snooze > 0.01) {
    // the big snooze button on top, pressed down
    ctx.beginPath();
    ctx.roundRect(-r * 0.5, -r * 1.36 + snooze * r * 0.16, r, r * 0.3, r * 0.1);
    ctx.fillStyle = PEN.base;
    ctx.fill();
    pen(ctx, PEN.ink, 1.2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- SEE ME ----------
function seeMeWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  const pts = [];
  for (let i = 0; i <= 40; i++) {
    const an = -Math.PI / 2 + (i / 40) * TAU * 1.06;
    pts.push([x + Math.cos(an) * r * (1 + Math.sin(i * 0.7) * 0.02), y + Math.sin(an) * r * 0.24]);
  }
  ctx.save();
  ctx.globalAlpha = 0.12 + 0.12 * p;
  ell(ctx, x, y, r, r * 0.24);
  ctx.fillStyle = PEN.lt;
  ctx.fill();
  ctx.restore();
  inkStroke(ctx, pts, sstep(p / 0.7), 1, 3);
  word(ctx, 'SEE ME.', x, y - 84 + Math.sin(time * 3) * 2, 15, sstep((p - 0.3) / 0.2), PEN.ink);
}
function seeMeHit(ctx, z, x, y, u, e, fade, time) {
  splash(ctx, x, y, z.w / 2, e, fade, 9, 3);
  inkStroke(ctx, [[x - 14, y - 26], [x - 4, y - 14], [x + 18, y - 44]], 1, fade, 4);
  word(ctx, 'UP!', x, y - 60 - e * 10, 18, fade, PEN.ink);
}

// ---------- Unread ----------
function unreadWarn(ctx, z, x, y, p, time) {
  floorRing(ctx, x, y, z.w / 2, rgba(CREAM.base, 0.2 + 0.14 * p), rgba('#a8a6c6', 0.85), sstep(p / 0.25), 1.8, [5, 4]);
  const n = 1 + Math.floor(p * 9) + (z.n ?? 0) * 3;
  envelope(ctx, x + Math.sin(time * 3 + (z.n ?? 0)) * 3, y - 74 + p * 26, 11, Math.sin(time * 2) * 0.12, sstep(p / 0.25), 1, n);
}
function unreadHit(ctx, z, x, y, u, e, fade, time) {
  for (let i = 0; i < 7; i++) {
    const an = Math.PI + (i / 6) * Math.PI;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x + Math.cos(an) * (6 + e * 30), y - 20 + Math.sin(an) * (6 + e * 24) + e * e * 12);
    ctx.rotate(e * 4 + i);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-4, -3, 8, 6);
    ctx.strokeStyle = '#a8a6c6';
    ctx.strokeRect(-4, -3, 8, 6);
    ctx.restore();
  }
}

// ---------- The Calendar ----------
const PAD = 4;
function dayWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  ctx.save();
  ctx.globalAlpha = 0.14 + 0.18 * p;
  ctx.fillStyle = PAGE.head;
  ctx.fillRect(x + 1, y - 8, w - 2, 12);
  ctx.restore();
  dayPage(ctx, x + PAD, y - 2, w - PAD * 2, 64, z.day, sstep(p / 0.2), { num: (z.n ?? 0) + 1 });
  // the red X drawn across it as the cast fills (each day crossed off in turn)
  const k = sstep((p - 0.3 - (z.n ?? 0) * 0.04) / 0.3);
  const L = x + PAD + 8;
  const R = x + w - PAD - 8;
  inkStroke(ctx, [[L, y - 56], [(L + R) / 2, y - 34], [R, y - 12]], k, 1, 3);
  inkStroke(ctx, [[R, y - 56], [(L + R) / 2, y - 34], [L, y - 12]], sstep((k - 0.5) * 2), 1, 3);
}
function dayHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  // the page torn off and flying
  ctx.save();
  ctx.translate(x + w / 2 + e * 20, y - 34 - e * 40);
  ctx.rotate(e * 2);
  dayPage(ctx, -(w - PAD * 2) / 2, 32, w - PAD * 2, 64, z.day, fade, { num: (z.n ?? 0) + 1 });
  ctx.restore();
  splash(ctx, x + w / 2, y, w / 2, e, fade * 0.8, 5, z.n ?? 0);
}
function weekendWarn(ctx, z, x0, y, p, time) {
  const x = z.bx != null ? x0 - z.w / 2 : x0;
  ctx.save();
  ctx.globalAlpha = sstep(p / 0.2);
  glow(ctx, x + z.w / 2, y - 20, z.w * 0.8, '#ffe8a0', 0.5);
  ctx.restore();
  dayPage(ctx, x + PAD, y - 2, z.w - PAD * 2, 64, z.day, sstep(p / 0.2), { sunny: true });
  word(ctx, 'SAFE', x + z.w / 2, y - 78 + Math.sin(time * 4) * 2, 11, sstep((p - 0.4) / 0.2), '#c88a2a');
}
function weekendHit(ctx, z, x0, y, u, e, fade, time) {
  const x = z.bx != null ? x0 - z.w / 2 : x0;
  for (let i = 0; i < 5; i++) sparkle(ctx, x + z.w / 2 + Math.cos(i * 1.3) * e * 24, y - 30 + Math.sin(i * 1.3) * e * 16, 4 * (1 - e), fade, '#fff2c8');
}
function offWarn(ctx, z, x, y, p, time) {
  ctx.save();
  ctx.globalAlpha = 0.16 + 0.24 * p;
  ctx.fillStyle = NAVY.deep;
  ctx.fillRect(x, y - 14, z.w, 18);
  ctx.globalAlpha = 0.2 * p;
  ctx.fillStyle = '#ffffff';
  for (let k = 0; k < z.w; k += 22) ctx.fillRect(x + k, y - 14, 8, 18);
  ctx.restore();
  if (z.w > 60) word(ctx, 'OVERTIME', Math.max(40, Math.min(SW - 40, x + z.w / 2)), y - 30, 11, sstep((p - 0.4) / 0.2), NAVY.ink);
}
function offHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.4 * fade;
  ctx.fillStyle = NAVY.lt;
  ctx.fillRect(x, y - 30 - e * 14, z.w, 34 + e * 14);
  ctx.restore();
}

// ---------- Wake-Up Call ----------
function alarmWarn(ctx, z, x0, y, p, time) {
  clock(ctx, SW / 2, 64, 18, p, sstep(p / 0.2));
  for (let k = 0; k < 3; k++) {
    const v = (time * (1 + p * 2) + k / 3) % 1;
    ctx.save();
    ctx.globalAlpha = sstep(p / 0.3) * (1 - v) * 0.7;
    pen(ctx, GOLD.sh, 2);
    ctx.beginPath();
    ctx.ellipse(SW / 2, 64, 24 + v * 80, 14 + v * 40, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
  word(ctx, 'GOOD MORNING!', SW / 2, 108, 15, sstep((p - 0.3) / 0.2), PEN.ink);
}
function alarmHit(ctx, z, x0, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = 0.3 * fade;
  ctx.fillStyle = '#fff6dc';
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
  clock(ctx, SW / 2, 64, 18, 1 - e, fade);
  for (let k = 0; k < 3; k++) {
    ctx.save();
    ctx.globalAlpha = fade * (1 - k * 0.25);
    pen(ctx, GOLD.base, 3);
    ctx.beginPath();
    ctx.ellipse(SW / 2, 160, (60 + e * 300) * (1 - k * 0.2), (20 + e * 100) * (1 - k * 0.2), 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------- All-Hands Meeting ----------
function allWarn(ctx, z, x, y, p, time) {
  const r = z.w / 2;
  floorRing(ctx, x, y, r, rgba(CREAM.base, 0.25 + 0.16 * p), rgba(NAVY.ink, 0.9), sstep(p / 0.2), 2.4);
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU;
    ell(ctx, x + Math.cos(an) * r * 0.75, y + Math.sin(an) * r * 0.17, 3.4, 1.6);
    ctx.fillStyle = rgba(NAVY.base, 0.7 * sstep(p / 0.3));
    ctx.fill();
  }
  ctx.save();
  ctx.globalAlpha = sstep(p / 0.25);
  ctx.translate(x, y - 88 + p * 16 + Math.sin(time * 3) * 2);
  ctx.beginPath();
  ctx.roundRect(-30, -16, 60, 32, 5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  pen(ctx, NAVY.ink, 1.6);
  ctx.stroke();
  ctx.fillStyle = PAGE.head;
  ctx.fillRect(-30, -16, 60, 9);
  ctx.restore();
  word(ctx, 'ALL-HANDS', x, y - 88 + p * 16 - 2, 9, sstep(p / 0.25), NAVY.ink);
  word(ctx, '9:00', x, y - 88 + p * 16 + 8, 9, sstep(p / 0.25), PAGE.head);
}
function allHit(ctx, z, x, y, u, e, fade, time) {
  ctx.save();
  ctx.globalAlpha = fade;
  glow(ctx, x, y - 16, 40 + e * 30, '#e8e0ff', 0.5);
  ctx.restore();
  for (let i = 0; i < 8; i++) {
    const an = (i / 8) * TAU;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x + Math.cos(an) * (10 + e * 50), y - 20 + Math.sin(an) * (8 + e * 26));
    ctx.rotate(an + e * 3);
    ctx.fillStyle = PAGE.base;
    ctx.fillRect(-4, -5, 8, 10);
    ctx.fillStyle = PAGE.head;
    ctx.fillRect(-4, -5, 8, 3);
    ctx.restore();
  }
}

// ---------- Strikethrough ----------
function strikeWarn(ctx, z, x, y, p, time) {
  const w = z.w;
  const d = z.dir ?? 1;
  ctx.save();
  ctx.globalAlpha = 0.14 + 0.2 * p;
  ctx.fillStyle = PEN.lt;
  ctx.fillRect(x, y - 10, w, 14);
  ctx.restore();
  const x0 = d > 0 ? x : x + w;
  const k = sstep(p / 0.8);
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.setLineDash([6, 6]);
  pen(ctx, PEN.base, 2);
  ctx.beginPath();
  ctx.moveTo(x0, y - 16);
  ctx.lineTo(x0 + d * w * k, y - 16);
  ctx.stroke();
  ctx.restore();
}
function strikeHit(ctx, z, x, y, u, e, fade, time) {
  const w = z.w;
  inkStroke(ctx, [[x, y - 16], [x + w * 0.5, y - 18], [x + w, y - 15]], sstep(u / 0.3), fade, 6);
  splash(ctx, x + w / 2, y, w / 3, e, fade * 0.7, 7, 5);
}

// ---------- Snooze ----------
function snoozeWarn(ctx, z, x0, y, p, time) {
  const press = Math.pow(Math.abs(Math.sin(p * Math.PI * 1.5)), 6);
  clock(ctx, SW / 2, 66, 18, p * (1 - press), sstep(p / 0.2), 0.4 + press * 0.6);
  word(ctx, 'SNOOZE', SW / 2, 112, 15, sstep((p - 0.3) / 0.2), PEN.ink);
  ctx.save();
  ctx.globalAlpha = 0.06 + 0.08 * p;
  ctx.fillStyle = SLEEP.base;
  ctx.fillRect(0, 0, SW, 360);
  ctx.restore();
}
function snoozeHit(ctx, z, x0, y, u, e, fade, time) {
  alarmHit(ctx, z, x0, y, u, e, fade, time);
}

export const MONDAY_FX = {
  mnSeeMe: { warn: seeMeWarn, hit: seeMeHit },
  mnUnread: { warn: unreadWarn, hit: unreadHit },
  mnDay: { warn: dayWarn, hit: dayHit },
  mnWeekend: { warn: weekendWarn, hit: weekendHit },
  mnOff: { warn: offWarn, hit: offHit },
  mnAlarm: { warn: alarmWarn, hit: alarmHit },
  mnAll: { warn: allWarn, hit: allHit },
  mnStrike: { warn: strikeWarn, hit: strikeHit },
  mnSnooze: { warn: snoozeWarn, hit: snoozeHit },
};
// (how long each landing plays, s: world/bossfight.js LOOK_HOLD carries the same)
export const MONDAY_HOLD = { mnSeeMe: 0.9, mnUnread: 0.6, mnDay: 0.8, mnWeekend: 0.7, mnOff: 0.6, mnAlarm: 1, mnAll: 0.9, mnStrike: 0.8, mnSnooze: 1 };
export const MONDAY_OWN_WARN = Object.keys(MONDAY_FX);
