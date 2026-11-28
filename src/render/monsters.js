// Monsters: picks each design's sprite for its pose, frame, and mood, and draws it in the world
// with its shadow, flashes, spawn pop, poof, status effects, and a face that shows how it feels:
//   idle   calm, with blinks and happy squints
//   angry  fierce while it chases you (or a boss winds up)
//   hurt   squeezed >< eyes for a moment after each hit
//   dead   x eyes as it poofs away
// The designs themselves live in mobs/, one module per region. Little emote bubbles (!, anger
// marks, sweat, music notes, z's) float over their heads.

import { sprite, spriteLater, spriteAsync, blit, snap, footShadow } from './pixel.js';
import { springStep } from './animator.js';
import { fxSprite } from './fx-sprites.js';
import { springy, cloud as softCloud } from './mobfx.js';
import { ARTS, mobBuild } from './mobs/index.js';

export { ARTS };

// How many frames an art has for walking (or flying), idling, and attacking (0: no attack pose),
// and how its walk keeps time: `stride` is how far it travels in one walk cycle, `cycle` (seconds)
// a fixed rhythm for designs that sway in place. An art may also give `atkMs`, its attack timing
// (see attackTiming).
export function framesOf(art) {
  const a = ARTS[art] ?? {};
  return { walk: a.walk ?? 4, idle: a.idle ?? 2, attack: a.attack ?? 0, stride: a.stride ?? null, cycle: a.cycle ?? null, sub: a.sub ?? SUB, tween: Boolean(a.atkTween), idleCycle: a.idleCycle ?? IDLE_CYCLE };
}

const IDLE_CYCLE = 1.8;

// Attack timing, after MapleStory's mob data and Slynyrd's per-weapon tables: frames are never
// even. Frame 0 is the wind-up, held for as long as the monster gathers itself (a dungeon swing's
// wind-up, a boss's warning); `atkMs` (per art, in ms) times the frames after it: the strike (a
// quick smear), the impact (held: the blow lands on it), and then the settle and recovery. When a
// wind-up came first, the strike plays in its last moments, so the impact frame shows the instant
// the damage lands; a touch attack with no wind-up flicks through the strike first.
const ATK_MS = { 4: [60, 230, 170], 5: [80, 150, 380, 220] };
export function attackTiming(art) {
  const a = ARTS[art];
  if (!a.attack) return [];
  return a.atkMs ?? ATK_MS[a.attack] ?? Array.from({ length: a.attack - 1 }, () => 120);
}

// Which attack frame shows: `wind` is the wind-up time left (s), `since` the time since the blow
// landed (s), and `led` whether the strike already played at the end of the wind-up. -1: none.
// With `tween` (an art that eases between its attack poses, `atkTween`), the frame comes back with
// how far through it the attack is, in quarters (2.5: halfway through the impact), and the art
// holds each pose for its beat, then eases into the next.
export function attackFrame(ms, wind, since, led, tween = false) {
  if (!ms.length) return -1;
  const at = (k, u) => (tween ? k + Math.min(0.75, Math.floor(u * 4) / 4) : k);
  if (wind > 0) return wind * 1000 < ms[0] ? at(1, 1 - (wind * 1000) / ms[0]) : 0;
  if (!(since >= 0)) return -1;
  let t = since * 1000;
  if (!led) {
    if (t < ms[0]) return at(1, t / ms[0]);
    t -= ms[0];
  }
  for (let i = 1; i < ms.length; i++) {
    if (t < ms[i]) return at(i + 1, t / ms[i]);
    t -= ms[i];
  }
  return -1;
}

// Walk and idle play through in-between poses: each art frame is drawn SUB times, a step of the
// way toward the next (the arts are posed from the frame's phase), so motion flows instead of
// stepping. Attack frames stay whole: their timing is the point.
// (An art may ask for more, `sub`: the smoothest designs take 8.)
const SUB = 4;
const fine = (x, n, sub = SUB) => {
  const v = Math.floor(x * sub) / sub;
  return ((v % n) + n) % n;
};

// Walkers step with the ground they cover, so their feet never slide and a fast monster's legs
// move faster than a slow one's. Flyers beat their wings at the rate that stride and speed set.
// (`raw`: the exact phase, unstepped, for an art's live body motion.)
function walkFrame(m, fr, t, fast, raw = false) {
  const stride = fr.stride ?? m.def.w * 1.2;
  const step = raw ? (x, n) => ((x % n) + n) % n : (x, n) => fine(x, n, fr.sub);
  if (fr.cycle || !m.def.speed) return step((t / (fr.cycle ?? 0.8)) * fr.walk, fr.walk);
  if (m.def.fly) return step(((t * fast * m.def.speed) / stride) * fr.walk, fr.walk);
  return step(((m.odo ?? 0) / stride) * fr.walk, fr.walk);
}

function poseOf(m, fr, moving, t, now, mo) {
  if (fr.attack && m.hp > 0) {
    const ms = attackTiming(m.def.art);
    const wind = Math.max(m.special?.warn > 0 ? m.special.warn : 0, m.windup > 0 ? m.windup : 0);
    const f = attackFrame(ms, wind, now - (m.attackAt ?? -9), (m.attackAt ?? -9) - mo.ledAt < 0.15, fr.tween);
    if (wind > 0 && Math.floor(f) === 1) mo.ledAt = now;
    if (f >= 0) return ['attack', f, f];
  }
  if (moving) return ['walk', walkFrame(m, fr, t, mo.fast), walkFrame(m, fr, t, mo.fast, true)];
  // Idles ease: they linger near their two extremes and pass quickly between them (like
  // MapleStory's stand frames), so the breath reads as poses rather than a steady drift.
  const u = (t / fr.idleCycle) % 1;
  const ui = (u + 0.07 * Math.sin(4 * Math.PI * u)) * fr.idle;
  return ['idle', fine(ui, fr.idle, fr.sub), ((ui % fr.idle) + fr.idle) % fr.idle];
}

const mobKey = (art, frame, mood, pose) => `mob|${art}|${pose}${frame}|${mood}`;
export function monsterSprite(art, frame, mood = 'idle', pose = 'walk') {
  return sprite(mobKey(art, frame, mood, pose), () => mobBuild(art, pose, frame, mood));
}

// (gloating over a hit it landed, for `secs` after it: a gloat still to come, as when a stage replays
// from the start with the last one remembered, is none)
const gloating = (m, now, secs) => {
  const e = now - (m.gloatAt ?? -9);
  return e >= 0 && e < secs;
};
// How a monster feels right now.
// Right after landing a hit on the hero it gloats (a happy face); nearly beaten, it blinks fast
// and nervously.
function moodOf(m, t, now, held, armored = false) {
  if (m.hp <= 0) return 'dead';
  // A face a cutscene holds on it (world/director.js): asleep, cross, sad...
  if (m.cine?.mood) return m.cine.mood;
  // (a boss's super armor: a blow's flash doesn't pull a hurt face, only its rare stagger does)
  if ((m.flash > 0 || m.stagger > 0) && !armored) return 'hurt';
  if (m.special?.warn > 0) return 'angry';
  if (held) return 'hurt';
  if (gloating(m, now, 0.9)) return 'happy';
  if (now < m.aggroUntil && m.def.aggro) return 'angry';
  // Napping (world/habits.js): eyes shut; playing chase: happy.
  if (m.habit?.kind === 'nap' && now < m.habit.until) return 'blink';
  if (m.habit?.kind === 'play' && now < m.habit.until) return 'happy';
  const cyc = (t * 0.3) % 1;
  if (cyc < 0.04) return 'blink';
  if (lowOn(m) && ((t * 1.7) % 1) < 0.08) return 'blink';
  if (m.state === 'idle' && cyc > 0.55 && cyc < 0.75) return 'happy';
  return 'idle';
}

const lowOn = (m) => m.hp > 0 && m.hp < m.def.hp * 0.25;
// Pop-in with overshoot: 0 -> 1.3 -> 1 over about a fifth of a second.
const pop = (e) => (e <= 0 ? 0 : e >= 0.2 ? 1 : e < 0.1 ? (e / 0.1) * 1.3 : 1.3 - ((e - 0.1) / 0.1) * 0.3);

// Where a rigged monster's head really is (2026-11-25). A rig's box is roomy (a raised arm, a swing,
// a hop must fit), so its top is well above the head: for a 40 px tanuki, 23 px over it. Marks over
// the head (emotes, dizzy stars, a lullaby's z's, dazzle dust) go by its drawn body instead: its
// calm pose drawn once off screen, its top found (its height above the feet) and the middle of its
// head (from its middle, toward the way it faces). Until measured, or with no canvas: the box.
const rigTops = new Map();
const rigTries = new Map();
export function rigTop(art, rig, def) {
  if (rigTops.has(art)) return rigTops.get(art);
  // (nothing drawn yet, its pieces still on their way: a few more tries, a second apart)
  const tr = (rigTries.get(art) ?? { n: 0, at: -9 });
  const now = performance.now() / 1000;
  if (tr.n > 0 && now - tr.at < 1) return null;
  tr.n++;
  tr.at = now;
  rigTries.set(art, tr);
  let top = null;
  try {
    const W = Math.ceil(rig.w * 3);
    const Hc = Math.ceil(rig.h * 2 + 20);
    const cv = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(W, Hc) : null;
    const c = cv?.getContext('2d');
    if (c) {
      const gy = Hc - 10;
      c.translate(W / 2, gy);
      const m = { def, hp: def.hp, uid: 0, x: 0, y: 0, dir: 1, state: 'idle', attackAt: -99, gloatAt: -99, aggroUntil: 0, odo: 0, flash: 0, phase: 0 };
      rig.draw(c, m, { t: 0, now: 0, dt: 0, mood: 'calm', moving: false, mo: {}, hurtAgo: 9, flip: false, flash: 0, alpha: 1 });
      const px = c.getImageData(0, 0, W, Hc).data;
      const solid = (x, y) => px[(y * W + x) * 4 + 3] > 140;
      let y0 = -1;
      for (let y = 0; y < gy && y0 < 0; y++) {
        let n = 0;
        for (let x = 0; x < W; x++) if (solid(x, y)) n++;
        if (n >= 2) y0 = y;
      }
      if (y0 >= 0) {
        const h = gy - y0;
        // (the head: the top quarter of the body, its left and right edges)
        let lo = W;
        let hi = -1;
        for (let y = y0; y < y0 + h * 0.25; y++) for (let x = 0; x < W; x++) if (solid(x, y)) {
          lo = Math.min(lo, x);
          hi = Math.max(hi, x);
        }
        // (hx: a mark's spot, a little toward the way it faces; hc: the middle of its head)
        top = { h, hx: (lo + hi) / 2 - W / 2 + (hi - lo) * 0.2, hc: (lo + hi) / 2 - W / 2 };
      }
    }
  } catch {
    top = null;
  }
  if (top || tr.n >= 8) rigTops.set(art, top);
  return top;
}

// Emote bubbles over the head: "!" right after it gets angry, a pulsing anger mark while it
// chases, a sweat drop when hit, and music notes or z's while it lazes about.
function drawEmote(ctx, m, mood, x, top, t, now, headX = null) {
  // (`ownEmotes` on an art: its rig draws every one of these marks itself, in its own style, on its
  // drawn head: the Puddle Kid, 2026-11-26)
  if (ARTS[m.def.art]?.ownEmotes) return;
  ctx.save();
  ctx.font = '800 9px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  const hx = x + ((m.heading ?? m.dir) < 0 ? -1 : 1) * (headX ?? m.def.w * 0.32);
  // A bubble that pops in with an overshoot and holds.
  const bubble = (mark, color, e) => {
    const k = pop(e);
    if (k <= 0) return;
    ctx.save();
    ctx.translate(hx, top - 8);
    ctx.scale(k, k);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillText(mark, 0, 3.4);
    ctx.restore();
  };
  // Losing the hero: a puzzled "?" when its anger runs out.
  const em = (m.emo ??= { angry: false, lostAt: -9 });
  const angryNow = m.hp > 0 && now < m.aggroUntil;
  if (em.angry && !angryNow && m.hp > 0) em.lostAt = now;
  em.angry = angryNow;
  if (mood === 'angry' && m.aggroUntil - now > 5.4 && !m.def.boss) {
    bubble('!', '#ff5b7f', 6 - (m.aggroUntil - now));
  } else if (mood === 'happy' && gloating(m, now, 0.9)) {
    // Gloating after a hit: a bouncing note.
    const e = now - m.gloatAt;
    ctx.globalAlpha = Math.min(1, (0.9 - e) * 4);
    ctx.fillStyle = '#ff7fb0';
    ctx.fillText('♪', hx + e * 6, top - 3 - e * 10 - Math.abs(Math.sin(e * 14)) * 2);
  } else if (now - em.lostAt < 1.4 && m.hp > 0 && !m.def.boss) {
    bubble('?', '#8f7cc4', now - em.lostAt);
  } else if (mood === 'angry') {
    const k = 1 + 0.25 * Math.max(0, Math.sin(t * 8));
    ctx.strokeStyle = '#ff4d6d';
    ctx.lineWidth = 1.4;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      ctx.beginPath();
      ctx.moveTo(hx + sx * 0.8 * k, top - 6 + sy * 2.6 * k);
      ctx.lineTo(hx + sx * 0.8 * k, top - 6 + sy * 0.8 * k);
      ctx.lineTo(hx + sx * 2.6 * k, top - 6 + sy * 0.8 * k);
      ctx.stroke();
    }
  } else if (mood === 'hurt') {
    ctx.fillStyle = '#9fdcff';
    ctx.beginPath();
    ctx.arc(hx, top + 2, 2.2, 0, Math.PI * 2);
    ctx.moveTo(hx - 2, top + 1.4);
    ctx.lineTo(hx, top - 2.6);
    ctx.lineTo(hx + 2, top + 1.4);
    ctx.fill();
  } else if (lowOn(m)) {
    // Nearly beaten: a sweat drop slides down, again and again.
    const u = (t * 0.9) % 1;
    ctx.globalAlpha = u < 0.8 ? 1 : (1 - u) * 5;
    ctx.fillStyle = '#9fdcff';
    ctx.beginPath();
    ctx.arc(hx + 3, top + 1 + u * 5, 2, 0, Math.PI * 2);
    ctx.moveTo(hx + 1.2, top + 0.4 + u * 5);
    ctx.lineTo(hx + 3, top - 3 + u * 5);
    ctx.lineTo(hx + 4.8, top + 0.4 + u * 5);
    ctx.fill();
  } else if (m.habit?.kind === 'nap' && now < m.habit.until && m.hp > 0) {
    // Asleep: a slow stream of z's, each drifting up and growing.
    for (let k = 0; k < 3; k++) {
      const u = (t * 0.45 + k / 3) % 1;
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = '#8f7cc4';
      ctx.font = `800 ${6 + u * 5}px Nunito, "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
      ctx.fillText('z', hx + u * 7, top - 1 - u * 13);
    }
  } else if (m.state === 'idle' && m.hp > 0 && !ARTS[m.def.art]?.noHop) {
    // (An art with its own idle act (`noHop`) goes without these idle notes too.)
    const cyc = (t * 0.3) % 1;
    if (cyc > 0.55 && cyc < 0.8) {
      const u = (cyc - 0.55) / 0.25;
      ctx.globalAlpha = Math.sin(u * Math.PI);
      ctx.fillStyle = '#8f7cc4';
      ctx.fillText(m.uid % 3 === 0 ? 'z' : '♪', hx + u * 4, top - 2 - u * 8);
    }
  }
  ctx.restore();
}

// Render-side motion state that lives on the monster between frames: springs for squash, lean
// and drag (solved exactly, so any frame rate looks the same), and what the last hit did.
function motionOf(m, time) {
  const mo = (m.motion ??= { t: time, sq: 0, sqV: 0, lean: 0, leanV: 0, shear: 0, shearV: 0, vs: 0, flash: 0, hitT: -9, hurtUntil: -9, push: 0, ledAt: -9, impactAt: -9, fast: 1 });
  mo.dt = Math.max(0, Math.min(0.1, time - mo.t));
  // (a clock gone back, as when a stage or a film replays from the start, forgets a hit still to
  // come: without it every frame up to that hit drew flashed white with a hurt face)
  if (time < mo.hitT) {
    mo.hitT = -9;
    mo.hurtUntil = -9;
  }
  mo.t = time;
  return mo;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (k) => k * k * (3 - 2 * k);

// Death, over the half second a fallen monster stays (m.dying 0 to 0.5): knocked up on an arc away
// from the blow with a tumble, one bounce that squashes it flat, a held beat, then one white
// contrast frame and a poof. Bosses buckle in place instead: thrown back, sinking, then gone.
const DIE_ARC = 0.22;
const DIE_LAND = 0.3;
const DIE_POOF = 0.38;
function deathPose(m, mo, D) {
  const out = { dx: 0, dy: 0, rot: 0, sx: 1, sy: 1, alpha: 1, white: 0, puff: -1 };
  const push = mo.push || -((m.heading ?? m.dir) < 0 ? -1 : 1);
  if (m.def.boss) {
    const k = smooth(clamp(D / 0.3, 0, 1));
    out.rot = push * 0.12 * k;
    out.dx = push * 6 * k + (D < 0.3 ? Math.sin(D * 90) * 1.5 * (1 - k) : 0);
    out.sy = 1 - 0.12 * k;
    out.sx = 1 + 0.05 * k;
    if (D > DIE_POOF) {
      const u = (D - DIE_POOF) / (0.5 - DIE_POOF);
      // (the white eased in and held, never switched on in one frame)
      out.white = smooth(clamp(u / 0.2, 0, 1)) * (1 - 0.4 * smooth(clamp((u - 0.3) / 0.3, 0, 1)));
      out.alpha = 1 - smooth(u);
    }
    return out;
  }
  const peak = clamp(m.def.h * 0.45, 8, 20) + (mo.air0 ?? 0) * 0.3;
  if (D < DIE_ARC) {
    const k = D / DIE_ARC;
    out.dy = -(4 * k * (1 - k) * peak + (mo.air0 ?? 0) * (1 - k));
    out.dx = push * 12 * k;
    out.rot = push * 0.32 * k;
    // Stretched along the flight, squashing round at the top.
    out.sy = 1 + 0.12 * (1 - k) - 0.08 * Math.sin(k * Math.PI);
    out.sx = 2 - out.sy;
  } else {
    out.dx = push * 12;
    out.rot = push * 0.32;
    const b = (D - DIE_ARC) / (DIE_LAND - DIE_ARC);
    // The bounce: flattened on landing, popping back with a little overshoot, then lying still.
    const sq = D < DIE_LAND ? 0.32 * (1 - b) - 0.1 * Math.sin(b * Math.PI) : 0;
    out.sx = 1 + sq;
    out.sy = 1 - sq;
    if (D >= DIE_POOF) {
      const u = (D - DIE_POOF) / (0.5 - DIE_POOF);
      // (a white glow eased in and out, never one frame switched on and off)
      out.white = smooth(clamp(u / 0.14, 0, 1)) * (1 - smooth(clamp((u - 0.14) / 0.3, 0, 1)));
      out.sx *= 1 + 0.5 * u;
      out.sy *= Math.max(0.05, 1 - 1.1 * u);
      out.alpha = u < 0.28 ? 1 : 1 - (u - 0.28) / 0.72;
      out.puff = u;
    }
  }
  return out;
}

// A small cartoon puff where the monster vanishes (2026-11-27, the remade monsters' soft style,
// render/mobfx.js): three soft clouds outlined in a deeper shade of their own colour, springing up
// and swelling apart as they thin out.
function poofCloud(ctx, x, y, w, u) {
  const r0 = Math.max(4, w * 0.16);
  const k = springy(Math.min(1, u / 0.35));
  const al = 0.9 * (1 - smooth(clamp((u - 0.3) / 0.7, 0, 1)));
  for (let i = 0; i < 3; i++) {
    const side = i - 1;
    const d = r0 * (0.4 + u * 1.2);
    softCloud(ctx, x + side * d * 1.3, y - r0 * (0.9 + (i === 1 ? 0.5 : 0)) - u * r0 * 0.6, r0 * (i === 1 ? 0.95 : 0.7) * (0.6 + 0.4 * k), '#ffffff', i === 1 ? '#ece4f8' : '#f6e6f0', al);
  }
}

// (x, y) is the monster's feet center in screen space; `now` is world time (for aggro).
// Monsters squash into their wind-ups, stretch through the strike and squash on the impact; a hit
// flattens them for one frame and they wobble back like jelly, leaning away from the blow with a
// hurt face held for a beat; they drag a little behind sudden starts and stops; new monsters pop
// in; and defeated ones are knocked up, bounce, and poof.
export function drawMonster(ctx, m, x, y, time, now = time) {
  // A beaten boss stood back up for its farewell (world/director.js `free`): drawn standing, at
  // its scene alpha, and not at all once it has left.
  if (m.cine?.gone) return;
  if (m.cine?.freed && m.hp <= 0) m = m.cine.standing ??= Object.assign(Object.create(m), { hp: 1, dying: 0 });
  if (m.cine?.freed && m.cine.alpha < 1) {
    ctx.save();
    ctx.globalAlpha *= Math.max(0, m.cine.alpha);
    drawMonsterNow(ctx, m, x, y, time, now);
    ctx.restore();
    return;
  }
  // A tanuki in disguise (`leafPoof`) is gone the instant it's beaten: it went up in smoke and left
  // a leaf (render/particles.js leafPoof).
  if (m.def.leafPoof && m.hp <= 0 && (m.dying ?? 0) > 0.03) return;
  drawMonsterNow(ctx, m, x, y, time, now);
}

function drawMonsterNow(ctx, m, x, y, time, now = time) {
  const frozen = m.frozenUntil > now && m.hp > 0;
  const flying = m.def.fly;
  const moving = !frozen && ((m.state === 'walk' && m.stagger <= 0) || flying);
  const mo = motionOf(m, time);
  const dt = frozen ? 0 : mo.dt;
  const boss = Boolean(m.def.boss);
  // A new hit: the flash timer jumps back up.
  // (Bosses have super armor (2026-11-28, the player: "bosses should have super armor most of that fight
  // she was in hurt animations never did another expression"): a party's blows only flash them. They
  // stagger, with the flinch and the hurt face, at most once in 10 s, and never mid-cast or mid-strike,
  // so their own idles, faces and attacks play through the fight. mo.stagT is that stagger's time.)
  const armored = boss && m.hp > 0 && (time - (mo.stagT ?? -99) < 10 || Boolean(m.cast) || now - (m.attackAt ?? -99) < 1.2);
  if (m.flash > mo.flash + 0.02 && armored) mo.hitT = time;
  else if (m.flash > mo.flash + 0.02) {
    mo.hitT = time;
    if (boss) {
      mo.stagT = time;
      mo.stagHurt = true;
    }
    mo.push = Math.sign(m.knockVx ?? 0) || -((m.heading ?? m.dir) < 0 ? -1 : 1);
    mo.hurtUntil = time + (boss ? 0.22 : 0.4);
    if (m.hp > 0 && !frozen) {
      // Saint11's take-hit: the most squashed, most thrown-back pose on the very first frame.
      mo.sq = boss ? 0.06 : 0.16;
      mo.sqV = 0;
      mo.lean = mo.push * (boss ? 0.035 : 0.17);
      mo.leanV = 0;
    } else mo.air0 = m.air > 0 ? m.air : 0;
  }
  mo.flash = m.flash;
  // (a stagger's hurt face lasts as long as its hit's flash, as any hit's did before super armor)
  if (!(m.flash > 0)) mo.stagHurt = false;
  // Frozen monsters stop animating: their clock stands still with the ice.
  const t = (frozen ? m.phase : time) + m.uid * 0.37;
  const mood = moodOf(m, t, now, time < mo.hurtUntil, boss && m.hp > 0 && !mo.stagHurt);
  mo.fast = mood === 'angry' ? 1.5 : 1;
  const fr = framesOf(m.def.art);
  // The distance it has walked, as drawn (a teleport or a new spawn doesn't count).
  const dx = m.x - (m.seenX ?? m.x);
  const step = Math.abs(dx);
  m.seenX = m.x;
  // (A jump counted as walking is paid out at no more than a quick walk's pace, so a short slide or
  // a nudge never shows as a one-frame burst of speed in its legs and its loose parts, 2026-11-26.)
  if (step < 40) mo.odoDue = Math.min(40, (mo.odoDue ?? 0) + step);
  // (never below a dash's pace, 360 px/s, so a charge or a fast mover keeps its legs in step and only
  // sudden jumps are spread out)
  const fdt = Math.max(mo.dt ?? 0, 1 / 240);
  const pay = Math.min(mo.odoDue ?? 0, Math.max(1, (m.def.speed || 40) * 3 * fdt, 360 * fdt));
  mo.odoDue = (mo.odoDue ?? 0) - pay;
  m.odo = (m.odo ?? 0) + pay;
  const [pose, frame, rawFrame] = poseOf(m, fr, moving, t, now, mo);
  // A rigged boss (render/mobs/rig.js) is posed live from its parts; its box stands in for a sprite.
  // Everyone else: in-between poses are drawn in the background; until one is ready, its whole frame
  // stands in. A calm whole frame not drawn yet (a blink, a happy face) is drawn in the background
  // too, the last such frame standing in for a frame or two; attacks and hits are drawn on the
  // spot, their timing is the point.
  // (globalThis.noRig: the old frames, for comparing the two.)
  const rig = globalThis.noRig ? null : ARTS[m.def.art]?.rig;
  const art = m.def.art;
  const whole = Math.floor(frame);
  const s = rig ? { w: rig.w, h: rig.h } : (frame % 1 && spriteLater(mobKey(art, frame, mood, pose), { kind: 'mob', art, pose, frame, mood })) || (pose === 'attack' || mood === 'hurt' || mood === 'dead' ? monsterSprite(art, whole, mood, pose) : spriteAsync(mobKey(art, whole, mood, pose), () => mobBuild(art, pose, whole, mood), `mob|${art}|${pose}`, () => ({ kind: 'mob', art, pose, frame: whole, mood })));

  // (a rig's drawn body, for the marks over its head: its box is taller than it)
  const body = rig ? rigTop(art, rig, m.def) : null;
  const bh = body?.h ?? s.h;

  // Squash (+ wide and short, - tall and thin) follows its pose on a jelly spring.
  let sqGoal = 0;
  let tremble = 0;
  if (pose === 'attack' && m.hp > 0) {
    if (whole === 0) {
      // The wind-up gathers low and wide (bosses tremble with it): the monster's tell is big.
      sqGoal = boss ? 0.1 : 0.12;
      tremble = boss ? 1.5 : 0.5;
    } else if (whole === 1) sqGoal = -0.08;
    else if (whole === 2 && mo.impactAt !== m.attackAt) {
      mo.impactAt = m.attackAt;
      mo.sq = boss ? 0.09 : 0.12;
      mo.sqV = 0;
    }
  }
  if (dt > 0) {
    [mo.sq, mo.sqV] = springStep(mo.sq, mo.sqV, sqGoal, 625, 15, dt);
    [mo.lean, mo.leanV] = springStep(mo.lean, mo.leanV, 0, 200, 14, dt);
    // Drag: the top lags a sudden start and swings past on a sudden stop (ignoring steady walking).
    const vel = step < 40 && mo.dt > 0 ? dx / mo.dt : 0;
    mo.vs += (vel - mo.vs) * (1 - Math.exp(-mo.dt / 0.18));
    [mo.shear, mo.shearV] = springStep(mo.shear, mo.shearV, clamp((vel - mo.vs) / 140, -1, 1) * (boss ? 0.03 : 0.09), 130, 8, dt);
  }

  let alpha = 1;
  // (A rig moves by its bones alone: no squash, no breathing stretch, its own tremble. Nor does an
  // art that moves its body live, `motion`: never squashed or stretched, the player's rule.)
  const live = ARTS[m.def.art]?.motion;
  const firm = rig || live;
  let sx = firm ? 1 : 1 + mo.sq;
  let sy = firm ? 1 : 1 / (1 + mo.sq);
  if (boss && !firm) sy *= 1 + Math.sin(t * 2) * 0.015;
  else if (!boss && !firm && !moving && pose !== 'attack') sy *= 1 + Math.sin(t * 3) * 0.012; // the idle frames breathe
  if (tremble && !rig) x += Math.sin(time * 60) * tremble;
  if (m.age < 0.3 && m.hp > 0) {
    // Spawn pop with a little overshoot.
    const k = m.age / 0.3;
    const pop = 1 + Math.sin(k * Math.PI) * 0.25;
    sx *= k * pop;
    sy *= k * pop;
    alpha = Math.min(1, k * 2);
  }
  let rot = 0;
  let lift = 0;
  let white = 0;
  let puff = -1;
  if (m.hp <= 0) {
    const d = deathPose(m, mo, m.dying ?? 0);
    // (A rigged boss falls by its bones, in its own death pose: never squashed.)
    if (!rig) {
      sx *= d.sx;
      sy *= d.sy;
    }
    x += d.dx;
    lift = -d.dy;
    rot = d.rot;
    alpha = d.alpha;
    white = d.white;
    puff = d.puff;
  }
  if (sx <= 0 || sy <= 0) return;
  if (!flying && !m.ceiling) {
    // Ground shadow, along the slope it stands on (shrinking as a falling body flies up).
    footShadow(ctx, x, y, Math.max(8, s.w * 0.42) * (1 - Math.min(0.5, lift / 60)), m.yAt ? (m.yAt(m.x + 6) - m.yAt(m.x - 6)) / 12 : 0, alpha);
  }

  // Knocked up into the air: drawn above its shadow, tumbling a little.
  // Bounders leave the ground on each leap, in step with how fast it carries them.
  const leap = m.def.gait === 'bound' && moving && !flying && !frozen ? Math.max(0, Math.sin(m.phase * 7)) * m.def.h * 0.3 : 0;
  // Body language: two happy hops while gloating, a little hop in an idle happy beat, and a
  // nervous tremble when nearly beaten (bosses keep their dignity).
  let act = 0;
  // (`noHop` on an art: it shows these moments in its own moves and face instead; it also goes
  // without the idle notes drawEmote floats over the others.)
  if (m.hp > 0 && !frozen && !boss) {
    const e = now - (m.gloatAt ?? -9);
    const hops = !ARTS[m.def.art]?.noHop;
    if (hops && e >= 0 && e < 0.7) act = Math.abs(Math.sin((e / 0.35) * Math.PI)) * Math.max(3, m.def.h * 0.12);
    else if (hops && mood === 'happy' && !moving) act = Math.abs(Math.sin(t * 9)) * 1.5;
    if (lowOn(m)) x += Math.floor(time * 20) % 2 ? 0.5 : -0.5;
  }
  const air = (m.air > 0 && m.hp > 0 ? m.air : 0) + leap + lift + act;
  ctx.save();
  ctx.translate(snap(x), snap(y - air));
  if (m.hp <= 0) ctx.rotate(rot);
  else if (m.air > 0) ctx.rotate(-((m.heading ?? m.dir) < 0 ? -1 : 1) * Math.min(0.5, (m.airV ?? 0) / 900) * 0.6 + mo.lean * 0.5);
  else if (mo.lean) ctx.rotate(mo.lean);
  // Rocking about its feet in a cutscene (tossing in its sleep, rearing up).
  if (m.cine?.sway && m.hp > 0) ctx.rotate(m.cine.sway);
  if (mo.shear && m.hp > 0 && !firm) ctx.transform(1, 0, mo.shear, 1, 0, 0);
  // The art's own body motion, worked out from the exact phase every frame (never stepped through
  // drawn poses): a rock, a hop, a lean, about its feet. Mirrored with it when it faces left.
  if (live && m.hp > 0 && pose !== 'attack') {
    const mv = live(pose, rawFrame, mood);
    const d = (m.heading ?? m.dir) < 0 ? -1 : 1;
    ctx.translate((mv.dx ?? 0) * d, -(mv.lift ?? 0));
    // (Turned about its feet, or about a point `py` above them: a flyer rolls about its middle.)
    if (mv.rot) {
      ctx.translate(0, -(mv.py ?? 0));
      ctx.rotate(((mv.rot * Math.PI) / 180) * d);
      ctx.translate(0, mv.py ?? 0);
    }
  }
  ctx.scale(sx, sy);
  // The hit flash: one white frame, then a quick fade, so the hurt face reads through it.
  const since = time - mo.hitT;
  // A light tint rather than solid white, so a crowd hit at once doesn't turn into white blobs.
  // A very large monster (a boss like Gnarlroot) gets a shorter, fainter flash: a full white frame on
  // something that fills the screen reads as a blink of the whole picture, not a hit.
  const huge = Math.min(1, Math.max(0, (s.h * Math.abs(sy) - 60) / 60));
  const peak = 0.8 - 0.5 * huge;
  const flash = white || (m.flash > 0 || since < 0.1 ? (since < 0.03 ? peak : Math.max(0, (0.45 - 0.25 * huge) * (1 - (since - 0.03) / (0.07 - 0.03 * huge)))) : 0);
  // A live rig (every remade monster and boss) gets a softer hit: a brief brightening that keeps its own
  // colours and outlines (2026-11-27, the player: hit, Astraea washed pale and see-through like a ghost;
  // its rig lifts every colour, outlines too, toward white by its flash). Lit in one frame, eased out
  // over 0.16 s, at most a sixth of the way to white (a ninth for a big one): it reads as a hit landing,
  // never as the figure fading. (The death and spawn glows, `white`, are unchanged.)
  const rigFlash = white || (since >= 0 && since < 0.16 ? (0.21 - 0.07 * huge) * (since < 0.02 ? 1 : 1 - smooth((since - 0.02) / 0.14)) : 0);
  // (a boss's rig reacts to its staggers only: super armor)
  const hurtAgo = boss && m.hp > 0 ? time - (mo.stagT ?? -99) : since;
  if (rig) rig.draw(ctx, m, { t, now, dt: mo.dt, mood, moving, mo, hurtAgo, flip: (m.heading ?? m.dir) < 0, flash: rigFlash / 8, alpha });
  else blit(ctx, s, -s.w / 2, -s.h, { flip: (m.heading ?? m.dir) < 0, flash: flash / 8, alpha, soft: Boolean(live) });
  ctx.restore();
  if (puff >= 0) poofCloud(ctx, x, y, s.w, puff);
  if (m.poison && m.hp > 0) (m.poison.kind === 'bleed' ? bleedDrops : poisonBubbles)(ctx, x, y, s, time + m.uid);
  if (frozen && m.hold === 'stun') dizzyStars(ctx, x, y - bh * sy - 2, time + m.uid);
  // The Silkweaver's cocoon: wrapped in pearl silk, swaying a little, loosening as it runs out.
  // (Fitted to its shape: as wide as it and as tall, kept a cocoon's shape between those; fading in as
  // the threads wind round it.)
  else if (frozen && m.hold === 'silk') {
    const ch = Math.min(2.2, Math.max(0.5, (bh * sy * 1.1) / 56));
    const cw = Math.min(ch * 1.35, Math.max(ch * 0.8, (s.w * 1.1) / 40));
    fxSprite(ctx, 'celsvcocoon', x, y - (bh * sy) / 2, { t: time + m.uid, sx: cw, sy: ch, alpha: Math.min(1, (m.frozenUntil - now) / 0.3, (now - (m.cocoonAt ?? now - 1)) / 0.28) });
  }
  // A Pin Feather: a gold feather of light stuck in it, pinning it where it stands, fading as it frees.
  else if (frozen && m.hold === 'pin') fxSprite(ctx, `cel${m.pinLook ?? 'sf'}pinned`, x, y - (bh * sy) * 0.55, { t: time + m.uid, scale: Math.min(1.4, Math.max(0.6, (bh * sy) / 50)), alpha: Math.min(1, (m.frozenUntil - now) / 0.25) });
  // A Lullaby: asleep on its feet, little notes and a Zz drifting up off it.
  else if (frozen && m.hold === 'sleep') fxSprite(ctx, 'celsbsleep', x, y - bh * sy - 6, { t: time + m.uid, scale: Math.min(1, Math.max(0.5, s.w / 50)), alpha: Math.min(1, (m.frozenUntil - now) / 0.25) });
  // A Wing Feint: it stands turned away, watching one of her moths flutter off behind it.
  else if (frozen && m.hold === 'feint') {
    const away = (m.dir || 1) < 0 ? -1 : 1;
    const bob = Math.sin((time + m.uid) * 5) * 3;
    fxSprite(ctx, `cel${m.feintLook ?? 'mm'}moth`, x + away * (s.w * 0.45 + 14), y - bh * sy - 6 + bob, { t: time + m.uid, flip: away < 0, scale: 0.3, alpha: Math.min(1, (m.frozenUntil - now) / 0.25) });
  }
  // A Snare Arrow's net over it (Tengu's own art), slipping off as the hold runs out.
  else if (frozen && m.hold === 'snare' && m.holdLook === 'ribbon') fxSprite(ctx, 'celacribbon', x, y - (bh * sy) / 2, { t: time + m.uid, scale: Math.max(0.35, s.w / 70), alpha: Math.min(1, (m.frozenUntil - now) / 0.25) });
  else if (frozen && m.hold === 'snare') fxSprite(ctx, 'celnet', x, y - (bh * sy) / 2, { t: time + m.uid, scale: Math.max(0.7, s.w / 30), alpha: Math.min(1, (m.frozenUntil - now) / 0.25) });
  // (Up in the air with it, if it's been lifted while frozen.)
  else if (frozen) iceBlock(ctx, x, y - (m.air > 0 && m.hp > 0 ? m.air : 0), s, m.frozenUntil - now, time + m.uid);
  // Dazzled (Dazzle Dust): glittering dust circling its head while it lasts.
  if (m.dazzleUntil > now && m.hp > 0) fxSprite(ctx, `cel${m.dazzleLook ?? 'mm'}dazzled`, x, y - bh * sy - 4, { t: time + m.uid, scale: Math.min(0.9, Math.max(0.5, s.w / 60)), alpha: Math.min(1, (m.dazzleUntil - now) / 0.3) });
  if (alpha > 0.5 && !frozen) drawEmote(ctx, m, mood, x, y - bh * sy, t, now, body?.hx);
}

// A clear block of ice around a frozen monster, with frosty edges, glints, and cracks as it thaws.
function iceBlock(ctx, x, y, s, left, time) {
  const w = s.w + 8;
  const h = s.h + 6;
  const bx = snap(x - w / 2);
  const by = snap(y - h);
  ctx.save();
  // Shiver just before it breaks.
  if (left < 0.4) ctx.translate(Math.sin(time * 70) * 1, 0);
  ctx.globalAlpha = 0.42;
  const g = ctx.createLinearGradient(bx, by, bx + w, by + h);
  g.addColorStop(0, '#e8fbff');
  g.addColorStop(0.5, '#9fe3ff');
  g.addColorStop(1, '#6fc4f0');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(bx + 3, by);
  ctx.lineTo(bx + w - 2, by + 2);
  ctx.lineTo(bx + w, by + h);
  ctx.lineTo(bx, by + h);
  ctx.lineTo(bx - 1, by + 4);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Shine streaks and a top rim of frost.
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(bx + 4, by + 3, 2, Math.round(h * 0.45));
  ctx.fillRect(bx + 8, by + 3, 1, Math.round(h * 0.25));
  ctx.fillRect(bx + 3, by, w - 6, 2);
  // Little crystals poking out of the top.
  ctx.fillStyle = '#c9f6ff';
  for (const [dx, ch] of [[0.25, 6], [0.55, 9], [0.8, 5]]) {
    const cx = bx + w * dx;
    ctx.beginPath();
    ctx.moveTo(cx - 2.5, by + 1);
    ctx.lineTo(cx, by - ch);
    ctx.lineTo(cx + 2.5, by + 1);
    ctx.fill();
  }
  // A glint that sweeps across.
  const k = (time * 0.8) % 1.6;
  if (k < 1) {
    ctx.globalAlpha = 0.8 * Math.sin(k * Math.PI);
    ctx.fillStyle = '#ffffff';
    const gx = bx + k * w;
    ctx.beginPath();
    ctx.moveTo(gx, by + 2);
    ctx.lineTo(gx + 4, by + 2);
    ctx.lineTo(gx - 2, by + h - 2);
    ctx.lineTo(gx - 6, by + h - 2);
    ctx.fill();
  }
  // Cracks spread as the ice is about to give.
  if (left < 1) {
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(bx + w * 0.5, by + h * 0.2);
    ctx.lineTo(bx + w * 0.4, by + h * 0.45);
    ctx.lineTo(bx + w * 0.6, by + h * 0.6);
    if (left < 0.5) {
      ctx.moveTo(bx + w * 0.4, by + h * 0.45);
      ctx.lineTo(bx + w * 0.2, by + h * 0.55);
      ctx.moveTo(bx + w * 0.6, by + h * 0.6);
      ctx.lineTo(bx + w * 0.75, by + h * 0.85);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// Stunned: little stars and a swirl circling over the head.
function dizzyStars(ctx, x, y, time) {
  ctx.save();
  // (soft, 2026-11-27: a fainter orbit, the stars' points rounded on a rim of their own gold)
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.ellipse(x, y, 13, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 3; i++) {
    const a = time * 5 + (i / 3) * Math.PI * 2;
    const sx = x + Math.cos(a) * 13;
    const sy = y + Math.sin(a) * 4;
    const r = 4 + Math.sin(a) * 1;
    ctx.fillStyle = i === 1 ? '#ffffff' : '#ffe36b';
    ctx.strokeStyle = '#c98a2b';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let k = 0; k < 10; k++) {
      const ang = (k / 10) * Math.PI * 2 - Math.PI / 2;
      const rr = k % 2 ? r * 0.5 : r;
      ctx.lineTo(sx + Math.cos(ang) * rr, sy + Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.fill();
  }
  ctx.restore();
}

// Bleeding: red drops falling off the monster.
function bleedDrops(ctx, x, y, s, time) {
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const u = (time * 0.9 + i / 4) % 1;
    const bx = x + (i - 1.5) * s.w * 0.18;
    const by = y - s.h * 0.6 + u * s.h * 0.6;
    ctx.globalAlpha = 1 - u;
    ctx.fillStyle = '#e8364f';
    ctx.beginPath();
    ctx.moveTo(bx, by - 3);
    ctx.quadraticCurveTo(bx + 2.2, by + 0.5, bx, by + 2);
    ctx.quadraticCurveTo(bx - 2.2, by + 0.5, bx, by - 3);
    ctx.fill();
  }
  ctx.restore();
}

// Venom: a sickly green sheen and bubbles that rise and pop off a poisoned monster.
function poisonBubbles(ctx, x, y, s, time) {
  ctx.save();
  for (let i = 0; i < 5; i++) {
    const u = (time * 0.7 + i / 5) % 1;
    const bx = x + Math.sin(i * 2.3 + time * 2) * s.w * 0.35;
    const by = y - s.h * 0.4 - u * s.h * 0.9;
    const r = (1.2 + (i % 3) * 0.7) * (u > 0.85 ? 1 + (u - 0.85) * 6 : 1);
    ctx.globalAlpha = u > 0.85 ? (1 - u) * 6 * 0.8 : 0.8;
    ctx.fillStyle = i % 2 ? '#9be86b' : '#c46bff';
    ctx.beginPath();
    ctx.arc(bx, by, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(Math.round(bx - r * 0.4), Math.round(by - r * 0.5), 1, 1);
  }
  ctx.globalAlpha = 0.18 + 0.08 * Math.sin(time * 5);
  const g = ctx.createRadialGradient(x, y - s.h / 2, 1, x, y - s.h / 2, s.w * 0.7);
  g.addColorStop(0, '#7de04f');
  g.addColorStop(1, 'rgba(125,224,79,0)');
  ctx.fillStyle = g;
  ctx.fillRect(x - s.w, y - s.h * 1.2, s.w * 2, s.h * 1.4);
  ctx.restore();
}
