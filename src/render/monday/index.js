// Monday on screen (remade 2026-11-27 from scratch, her idea kept: the Weekend-Eating Baku; the final boss of the
// Dream Theatre, in the Queen's flat at two in the morning; world/theatre.js her new fight). A baku eats dreams;
// this one ate the Queen's weekends, so it is ALWAYS Monday. A smug, bossy little girl at a boss's size who never,
// ever admits she's sleepy. She walks on her own copy of the blank bases' kid (rig.js on blankbase.js, read only),
// her head, hair, ears and clothes drawn here (head.js, dress.js), never the shared face or the hero's body or hair,
// nothing of another boss's.
//   look    fair skin, a pink flush; long straight night-navy hair with a lilac sheen (an even blunt fringe of four
//           sections cut straight across above her brows, a long side lock each side outside her eyes clipped with
//           a little gold alarm bell, the rest down her back to her knees); round baku ears, navy with pink
//           insides; a cropped navy bolero over a white blouse with a round collar and a red bow; the baku's cream
//           saddle, a wide sash bowed at her back with two calendar pages (MON) for tails; a pleated navy skirt
//           with a cream stripe; white tights, navy Mary-Janes; a short round baku tail; her giant red fountain pen
//           in her near hand, the sun cookie she's half eaten (Saturday) in her far hand. Soft own-colour
//           outlines; her face bare.
//   faces   (head.js) tsurime violet eyes with a crescent-moon glint, the whole iris always clear; round brows; a
//           smug little mouth, one corner up. Moods: smug (rest), rest, bossy, shout, grin, nibble, yum, cross,
//           focus, shock, pout, sad, fluster, drowsy, yawn, asleep, hurt (> <), dizzy, talk, happy.
//   idle    a 30 s act, only while calm: nibble (the cookie nibbled, cheeks puffed, crumbs, "nom"); tap (the pen's
//           cap tapped on the floor, her toe tapping, impatient); point (the pen pointed at you: "Up!", then a
//           smug grin); the yawn she fights (a yawn rising, hidden behind the cookie, a fierce shake of the head:
//           "I'm NOT sleepy.").
//   walk    a brisk, bossy march, chin up, the pen swung on the beat, the cookie hand swinging, ears bobbing.
//   fight   between casts, three swings at the tank in turn: Pen Jab (nib first: jab!), Red Ink (the pen swung
//           down like a sword, a red ink arc), Stomp (a bossy stamp of her foot, calendar pages fluttering up).
//           Her casts (m.castPose, world/theatre.js): seeme (SEE ME: the pen up, drawing a red circle in the air
//           at the tank, then slammed down), alarm (Wake-Up Call: a hand cupped to her mouth, up on her toes, her
//           bell clips ringing), unread (Unread: envelopes flung from her hand, one after another), allhands
//           (All-Hands Meeting: arms open wide, beckoning, sly), week (This Week / Next Week: the pen held out
//           like a pointer, ticking off the days along the floor), strike (Strikethrough: the pen swept across
//           ahead of her), snooze (Snooze: the pen slapped down twice on an alarm only she can see). Phase moments
//           (m.phaseAt): Rush Hour (a stamp of her foot, the pen pointed at the clock: "Running LATE!"), Always
//           Monday (the cookie gobbled whole: "No more weekends!").
//   scenes  her entrance (theatre_monday): 'nibble' (nibbling her cookie as you walk in), 'stomp' (a stamp of
//           her foot), 'circle' (a big red circle drawn in the air round today: "Up!"), 'attack' (the pen swung
//           down: a red X). Her ending (theatre_monday_end, `mood: 'crumple'`): she opens her mouth to shout and
//           yawns instead (yawns are catching), then sleeps on her feet leaning on her pen, her ears drooping.
//   marks   all her own (`ownEmotes`): "Up!" and a red tick after landing a hit, a page torn off when hurt, sweat
//           when low, and beaten: asleep, sat on the floor hugging her pen.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring, dizzy } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { jacket, sashBow, skirt, tail, sleeve, tights, shoe, bigPen, penGeom, nibAt, cookie, drawCookie, enter, ptOf } from './dress.js';
import { SKIN, SKIN_INK, PEN, PAGE, SLEEP, GOLD } from './palette.js';

const BIG = 3.8;
const LWR = 2 / BIG;
let LWK = 2;
const HS = 1.18;
const HO = [1.0, -15.5];
const headIn = (ctx, a, D) => {
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
};
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS]);
};

const SWINGS = ['jab', 'ink', 'stomp'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.mnN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'nibble', t0: 0.4, len: 6.6 },
  { name: 'tap', t0: 7.6, len: 6.4 },
  { name: 'point', t0: 14.4, len: 7 },
  { name: 'yawn', t0: 22.2, len: 6.8 },
];
const CYCLE = 30;
// (at rest: the pen held upright beside her like a staff, nib down on the floor; the cookie hand easy at her side)
const REST = { shN: -14, elN: -36, hwN: 4, shF: 10, elF: -24, hwF: -4 };
const PEN_REST = -0.12;

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'smug', look: [0.35, 0], turn: 0.35, fx: null, sweat: 0, tears: false, pen: PEN_REST, noPen: false, noCookie: false, bites: 1, ring: 0, ears: [0, 0], tail: 0 };
  a.mnQ = q;
  a.mnUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.5);
  const mood = m.cine?.mood;
  const frac = m.hp / m.def.hp;
  const low = m.hp > 0 && frac < 0.25 && !m.mech?.ending;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const actDur = act?.dur ?? 1;
  const since = now - (m.attackAt ?? -9);
  const cast = m.cast;
  const castU = cast ? now - cast.t0 : -1;
  const castK = cast ? clamp(castU / Math.max(0.2, cast.dur), 0, 1) : 0;
  const cp = m.castPose ?? null;
  const phase = m.mech?.phase ?? 1;
  // (once she's gobbled the cookie in Always Monday, it's gone)
  const ate = phase >= 3;
  if (cp) st.mnLastPose = cp;
  const relU = !cast && st.mnLastPose && since >= 0 && since < 1.1 ? since : -1;
  const relPose = relU >= 0 ? st.mnLastPose : null;
  if (!cast && since >= 1.1) st.mnLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const crumple = mood === 'crumple';
  const swinging = !cast && !relPose && !crumple && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.mnAtk) {
    st.mnN = (st.mnN ?? (m.uid ?? 0)) + 1;
    st.mnPick = pickSwing(m, st);
  }
  st.mnAntic = swinging ? Math.max(anticK, st.mnAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.mnAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const gloatU = now - (m.gloatAt ?? -9);
  const live = act && actU >= 0 && actU < actDur + 0.4 ? act.move : null;
  const sceneAct = live;
  const sceneU = actU;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2.4) || sceneAct || crumple;
  if (ate) {
    q.noCookie = true;
  }

  // At rest: chin up, weight on one hip, the pen planted beside her like a staff, the cookie at her side; a
  // small impatient bob, her ears twitching now and then.
  go({ tilt: -1 + Math.sin(t * 0.7) * 0.8, chest: breath * 0.8, head: -2 + Math.sin(t * 0.6 + 1) * 1.6, pelvis: 1.4, ...REST }, 1);
  q.look = [0.45 + Math.sin(t * 0.31) * 0.2, 0];
  if (walkW > 0.01) {
    const sw = Math.sin(t * 8);
    go({ tilt: 3, head: -5, shN: -30 - sw * 14, elN: -40, shF: 18 * sw, elF: -20 }, walkW);
    q.pen = mix(q.pen, 0.25 + sw * 0.15, walkW);
    q.look = [0.7, -0.1];
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say('bossy');
  if (m.hp <= 0) {
    // beaten: fast asleep, sat on the floor hugging her pen
    const u = now - (st.mnDeadAt ??= now);
    go({ drop: 0.84, tilt: 5, head: 14, shN: -50, elN: -100, shF: -40, elF: -90, fxN: 0.5, fxF: 0.3 });
    q.mood = u < 0.9 ? 'dizzy' : 'asleep';
    q.turn = 0.3;
    q.pen = -0.5;
    q.fx = { kind: 'beaten', u };
  } else st.mnDeadAt = undefined;

  if (m.hp > 0) {
    if (crumple) crumpleOf(now - (st.mnCrAt ??= now), go, q, t, say);
    else st.mnCrAt = undefined;
    if (crumple) {
      // (the ending's sleep, above)
    } else if (sceneAct) sceneOf(sceneAct, sceneU, actDur, go, q, t, say);
    else if (cast) castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say, ate);
    else if (relPose) releaseOf(relPose, relU, go, q, t, say);
    else if (phaseU >= 0 && phaseU < 2.4) phaseOf(phase, phaseU, go, q, t, say);
    else if (swinging) {
      const kind = st.mnPick ?? 'jab';
      const R = kind === 'ink' ? 0.22 : 0.16;
      const hitK = struck ? (since < R ? sstep(since / R) : 1 - sstep((since - R - 0.15) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.mnAntic) * (since < R ? 1 : 0) : sstep(anticK);
      if (kind === 'jab') {
        go({ shN: 10, elN: -100, tilt: -5, turnC: -8 }, wK);
        go({ shN: -90, elN: -4, tilt: 7, x: 0.03, turnC: 6 }, hitK);
        q.pen = mix(q.pen, -1.9, wK) + (-1.55 - q.pen) * hitK;
        say(hitK > 0.3 ? 'shout' : 'bossy');
      } else if (kind === 'ink') {
        go({ shN: -160, elN: -30, tilt: -6, head: -5 }, wK);
        go({ shN: -70, elN: -6, tilt: 8, head: 4, x: 0.02 }, hitK);
        q.pen = mix(q.pen, -3.1, wK) + (-1.2 - q.pen) * hitK;
        say(hitK > 0.3 ? 'cross' : 'focus');
      } else {
        go({ lift: 0.06, tilt: -3, shN: -40, elN: -50, shF: -30, fyN: -0.25 }, wK);
        go({ drop: 0.08, tilt: 4, shN: -20, elN: -40, shF: 20, fyN: 0 }, hitK);
        say(hitK > 0.3 ? 'shout' : 'bossy');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = sstep(hurtU / 0.07) * (1 - sstep((hurtU - 0.08) / 0.42));
      go({ tilt: -8, head: -10, x: -0.02, shN: -40, elN: -70, shF: -30 }, k);
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.mnCalm = mix(st.mnCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.mnCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.mnCalm), t, now, st);
    if (mood && !crumple && !cast && !relPose && !swinging && !live) {
      q.mood = { angry: 'shout', happy: 'grin', sad: 'sad', talk: 'talk', sleep: 'asleep', blink: 'rest', hurt: 'hurt', surprised: 'shock' }[mood] ?? q.mood;
      if (mood === 'angry') go({ shN: -80, elN: -30, head: -4, tilt: 2 }, 1);
      if (mood === 'angry') q.pen = -1.5;
      if (mood === 'sad') go({ head: 8, shN: -10, elN: -30 }, 1);
    }
    if (!busy && !hurt && gloatU >= 0 && gloatU < 2) st.mnGlAt ??= now;
    else if (busy || hurt || gloatU < 0 || gloatU >= 2) st.mnGlAt = undefined;
    const glU = st.mnGlAt != null ? now - st.mnGlAt : -1;
    st.mnGlW = mix(st.mnGlW ?? 0, glU >= 0 && glU < 0.75 ? 1 : 0, 1 - Math.exp(-dt * 10));
    if (st.mnGlW > 0.01) {
      const k = st.mnGlW;
      go({ shN: -90, elN: -20, head: -4 }, k);
      q.pen = mix(q.pen, -1.5, k);
      say('grin', k);
      if (glU >= 0) q.fx = { kind: 'gloat', u: glU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'fluster';
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking && !crumple) q.mood = 'talk';
  }
  if (m.mnFace) q.mood = m.mnFace;
  q.turn = spring(st, 'mnTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.smug;
  const f = (st.mnF ??= { ...FACES.smug, shut: { happy: 0, calm: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.mnF = f;
  // Springs: her skirt, the sash's calendar pages, her tail, the pen, the bell clips' ringing, her hair and ears.
  const kick = ((st.mnLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.mnLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7);
  st.mnLast = out.head;
  st.mnLastT = out.tilt;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  a.mnSkirt = spring(st, 'sk', -lean * 1.6 - walkW * 0.6 + Math.sin(t * 1.2) * 0.08, 90, 9, dt, kick * 0.01);
  a.mnBow = spring(st, 'bow', -lean * 1.4 - walkW * 0.35 + Math.sin(t * 1.3) * 0.06, 100, 9, dt, kick * 0.01);
  a.mnTail = spring(st, 'tl', q.tail + Math.sin(t * 1.7) * 0.12 + walkW * Math.sin(t * 8) * 0.2, 140, 10, dt, kick * 0.01);
  a.mnPen = { rot: spring(st, 'pen', q.pen, 150, 17, dt) };
  a.mnCookie = spring(st, 'ck', q.bites, 60, 14, dt);
  a.mnRing = spring(st, 'ring', q.ring, 120, 14, dt);
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0) + (out.chest ?? 0) * 0.5) * (Math.PI / 180);
  a.mnHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.6 + i * 1.9) * 0.02 + headLean * 0.1, 200 + i * 30, 15, dt, kick * 0.003 * (i % 2 ? 1 : -1))),
    slN: spring(st, 'sln', Math.sin(t * 1.1) * 0.05 - headLean * 0.3 + walkW * 0.12, 80, 9, dt, kick * 0.005),
    slF: spring(st, 'slf', Math.sin(t * 1.0 + 2) * 0.05 - headLean * 0.3 + walkW * 0.12, 76, 9, dt, kick * 0.005),
    back: spring(st, 'bk', Math.sin(t * 0.8) * 0.04 - walkW * 0.22 - lean * 0.4, 40, 7, dt, kick * 0.006),
    lean: spring(st, 'bkl', headLean, 70, 12, dt),
    sit: clamp(out.drop ?? 0, 0, 1),
    ears: [0, 1].map((i) => spring(st, `ear${i}`, q.ears[i] + Math.max(0, Math.sin(t * 0.9 + i * 2.6)) ** 12 * 0.6, 160, 12, dt, kick * 0.01)),
  };
}

// Her ending: she opens her mouth to shout, and yawns instead; then sleeps on her feet leaning on her pen.
function crumpleOf(u, go, q, t, say) {
  const yawn = win(u, 0, 0.6, 2.2, 2.8);
  const sleep = sstep((u - 2.2) / 1.2);
  go({ shN: -140, elN: -40, shF: -140, elF: -40, head: -10, tilt: -5, chest: -3 }, yawn);
  go({ shN: -50, elN: -30, hwN: 10, shF: -30, elF: -70, head: 14 + Math.sin(t * 0.8) * 3, tilt: 5, drop: 0.08 }, sleep);
  q.pen = mix(-0.6, 0.35, sleep);
  q.ears = [0.8 * sleep, 0.8 * sleep];
  say(sleep > 0.4 ? 'asleep' : 'yawn');
  q.fx = { kind: 'crumple', u, sleep };
}

// Her scene acts.
function sceneOf(act, u, dur, go, q, t, say) {
  if (act === 'nibble') {
    const k = win(u, 0, 0.3, dur - 0.3, dur + 0.2);
    const bite = Math.pow(Math.abs(Math.sin(u * 4)), 6);
    go({ shF: -60, elF: -110, hwF: -10, head: 3 + bite * 2 }, k);
    q.cookieFront = k > 0.5;
    q.bites = 1 + Math.min(1, u * 0.3);
    say('nibble', k);
    q.fx = { kind: 'crumbs', u };
  } else if (act === 'stomp') {
    const k = win(u, 0, 0.12, dur - 0.2, dur + 0.2);
    const st = sstep((u - 0.15) / 0.12);
    go({ lift: 0.06 * (1 - st), fyN: -0.3 * (1 - st), drop: 0.06 * st, tilt: -3 + st * 5, shN: -60, elN: -40, head: -6 }, k);
    say('bossy', k);
    q.fx = { kind: 'stompfx', u: u - 0.27 };
  } else if (act === 'circle') {
    // a big red circle drawn in the air round today: "Up!"
    const k = win(u, 0, 0.3, dur - 0.3, dur + 0.2);
    const an = Math.min(1, u / (dur * 0.7)) * TAU;
    go({ shN: -100 + Math.sin(an) * 25, elN: -20 + Math.cos(an) * 15, head: -4, tilt: -2 }, k);
    q.pen = -1.6 + Math.sin(an) * 0.2;
    say(u > dur * 0.7 ? 'shout' : 'focus', k);
    q.fx = { kind: 'circlefx', u, an };
  } else if (act === 'attack' || act === 'windup') {
    const k = win(u, 0, 0.12, dur - 0.2, dur + 0.3);
    const sw = sstep((u - 0.2) / 0.22);
    go({ shN: -160 + sw * 90, elN: -30 + sw * 24, tilt: -6 + sw * 14, head: -5 + sw * 9, x: 0.02 * sw }, k);
    q.pen = -3.1 + sw * 1.9;
    say(sw > 0.3 ? 'shout' : 'bossy', k);
    q.fx = { kind: 'redX', u: u - 0.3 };
  }
}

function castPoseOf(cp, u, castK, wind, go, q, t, say, ate) {
  const k = sstep(u / 0.4);
  if (cp === 'seeme') {
    // SEE ME: the pen up, drawing a red circle in the air at the tank; then slammed down
    const an = u * 3.2;
    go({ shN: -120 + Math.sin(an) * 14 * (1 - wind) - wind * 30, elN: -20 + Math.cos(an) * 10, head: -4, tilt: -3 - wind * 4 }, k);
    q.pen = -1.7 - wind * 1.2;
    say(wind > 0.3 ? 'cross' : 'bossy', k);
    q.look = [1, 0];
    q.fx = { kind: 'castSeeMe', u };
  } else if (cp === 'alarm') {
    // Wake-Up Call: a hand cupped to her mouth, up on her toes, her bell clips ringing
    const bounce = Math.abs(Math.sin(u * 9)) * 0.05;
    go({ shF: -90, elF: -110, hwF: -20, lift: bounce, head: -6, tilt: -2, shN: -30, elN: -40 }, k);
    q.ring = 1;
    q.noCookie = true;
    say('shout', k);
    q.fx = { kind: 'castAlarm', u };
  } else if (cp === 'unread') {
    // Unread: envelopes flung from her hand, one after another
    const fl = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.4)), 3);
    go({ shF: -40 - fl * 90, elF: -60 + fl * 40, tilt: -2 + fl * 4, head: -2, shN: -30, elN: -40 }, k);
    q.noCookie = true;
    say('grin', k);
    q.fx = { kind: 'castUnread', u };
  } else if (cp === 'allhands') {
    // All-Hands Meeting: arms open wide, beckoning, sly
    const beck = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.3)), 2);
    go({ shN: -80, elN: -50 - beck * 30, shF: -90, elF: -40 - beck * 30, head: -3, chest: 2 }, k);
    q.pen = -1.1;
    say('smug', k);
    q.fx = { kind: 'castAll', u };
  } else if (cp === 'week' || cp === 'nextweek' || cp === 'noweekend') {
    // This Week: the pen held out like a pointer, ticking off the days along the floor
    const tick = Math.floor(u * 2.2);
    const tk = Math.pow(Math.abs(Math.sin(u * Math.PI * 2.2)), 4);
    go({ shN: -70 - tk * 8, elN: -10, head: 6, tilt: 2, shF: -20 }, k);
    q.pen = -1.2 - tk * 0.2;
    q.look = [0.9, 0.8];
    if (cp === 'noweekend' && !ate) {
      // (she gobbles the cookie first: no more weekends)
      const gob = win(u, 0.2, 0.5, 1.2, 1.5);
      go({ shF: -80, elF: -120, head: 4 }, gob);
      q.cookieFront = gob > 0.5;
      q.bites = 1 + gob * 3;
    }
    say(tick % 2 ? 'bossy' : 'smug', k);
    q.fx = { kind: 'castWeek', u, cp };
  } else if (cp === 'strike') {
    // Strikethrough: the pen swept across ahead of her
    go({ shN: -40 - 60 * (1 - wind), elN: -80 + 70 * wind, tilt: -4 + wind * 8, turnC: -8 + wind * 14 }, k);
    q.pen = -2.2 + wind * 0.6;
    say(wind > 0.3 ? 'shout' : 'focus', k);
    q.fx = { kind: 'castStrike', u };
  } else if (cp === 'snooze') {
    // Snooze: the pen slapped down twice on an alarm only she can see
    const slap = Math.pow(Math.abs(Math.sin(u * Math.PI * 0.9)), 6);
    go({ shN: -130 + slap * 80, elN: -30, head: -2 + slap * 4, tilt: -3 + slap * 6 }, k);
    q.pen = -2.6 + slap * 1.2;
    q.ring = 1 - slap;
    say(slap > 0.5 ? 'cross' : 'bossy', k);
    q.fx = { kind: 'castSnooze', u, slap };
  } else {
    go({ shN: -60, elN: -60 }, k);
    say('bossy', k);
  }
}
function releaseOf(rp, u, go, q, t, say) {
  const k = 1 - sstep((u - 0.5) / 0.6);
  if (rp === 'seeme') {
    go({ shN: -80, elN: -6, tilt: 8, head: 4, x: 0.02 }, k);
    q.pen = -1.4;
    say('grin', k);
    q.fx = { kind: 'relSeeMe', u };
  } else if (rp === 'strike') {
    go({ shN: -110, elN: -10, tilt: 6, turnC: 6 }, k);
    q.pen = -1.6;
    say('grin', k);
  } else if (rp === 'alarm') {
    go({ shF: -120, elF: -40, shN: -60, elN: -30, head: -8 }, k);
    q.ring = 1 - u;
    say('grin', k);
  } else {
    go({ shN: -70, elN: -20, tilt: 4 }, k);
    say('smug', k);
  }
}
function phaseOf(phase, u, go, q, t, say) {
  const k = win(u, 0, 0.25, 2, 2.4);
  if (phase === 2) {
    // Rush Hour: a stamp of her foot, the pen pointed at the clock: "Running LATE!"
    const st = sstep((u - 0.3) / 0.15);
    go({ drop: 0.06 * st * (1 - sstep((u - 0.8) / 0.4)), fyN: -0.25 * (1 - st), shN: -120, elN: -10, head: -8, tilt: -3 }, k);
    q.pen = -2.4;
    say('shout', k);
    q.fx = { kind: 'rush', u };
  } else {
    // Always Monday: the cookie gobbled whole: "No more weekends!"
    const gob = win(u, 0.2, 0.5, 1, 1.3);
    go({ shF: -80, elF: -120, head: 4 }, gob * k);
    q.cookieFront = gob > 0.5 && u < 1.1;
    go({ shF: -100, elF: -30, shN: -110, elN: -20, head: -6, tilt: -3 }, k * sstep((u - 1.2) / 0.3));
    q.bites = 1 + sstep(u / 1) * 3;
    q.noCookie = u > 1.1;
    say(u < 1.2 ? 'nibble' : 'grin', k);
    q.fx = { kind: 'gobble', u };
  }
}

function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % CYCLE;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.mnPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.mnPiece = cur.name;
      else return;
    }
  } else {
    st.mnPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'nibble') {
    const k = win(u, 0, 0.5, 6, 6.6);
    const up = win(u, 0.4, 0.9, 4.2, 4.8);
    const bite = Math.pow(Math.abs(Math.sin(u * 3.6)), 6) * up;
    go({ shF: 10 - 70 * up, elF: -24 - 86 * up, hwF: -10 * up, head: 2 * up + bite * 2 }, k * w);
    if (at(k)) {
      q.cookieFront = up * k * w > 0.6;
      q.bites = 1 + sstep((u - 1) / 3);
      q.mood = up > 0.5 ? 'nibble' : u > 4.6 ? 'yum' : 'smug';
      q.fx = { kind: 'crumbs', u };
    }
  } else if (cur.name === 'tap') {
    const k = win(u, 0, 0.5, 5.8, 6.4);
    const tap = Math.pow(Math.abs(Math.sin(u * Math.PI * 2)), 4);
    go({ shN: -14 + tap * 6, elN: -36 - tap * 10, fyN: -0.12 * Math.abs(Math.sin(u * 6)), head: 4, tilt: 1 }, k * w);
    if (at(k)) {
      q.pen = PEN_REST + 0.05 * tap;
      q.mood = u < 4.4 ? 'bossy' : 'pout';
      q.look = [0.5, 0.5];
      q.fx = { kind: 'idletap', u, tap };
    }
  } else if (cur.name === 'point') {
    const k = win(u, 0, 0.4, 6.6, 7);
    const pt = win(u, 0.4, 0.7, 3.6, 4.2);
    go({ shN: -14 - 80 * pt, elN: -36 + 26 * pt, tilt: -2 * pt, head: -4 * pt }, k * w);
    if (at(k)) {
      q.pen = mix(PEN_REST, -1.55, pt);
      q.mood = pt > 0.5 ? (u < 2.4 ? 'shout' : 'bossy') : u > 4.2 ? 'grin' : 'smug';
      q.look = [1, 0];
      q.fx = { kind: 'idlepoint', u };
    }
  } else {
    // the yawn she fights: it rises, she hides it behind the cookie, shakes her head: "I'm NOT sleepy."
    const k = win(u, 0, 0.5, 6.2, 6.8);
    const hide = win(u, 1.2, 1.5, 3, 3.3);
    const shake = win(u, 3.4, 3.6, 4.4, 4.6) * Math.sin(u * 22);
    q.cookieFront = hide > 0.6;
    go({ shF: 10 - 90 * hide, elF: -24 - 100 * hide, head: -6 * win(u, 0.4, 1, 3, 3.4) + shake * 8, tilt: shake * 2 }, k * w);
    if (at(k)) {
      q.mood = u < 0.8 ? 'drowsy' : u < 3.3 ? 'yawn' : u < 4.6 ? 'fluster' : 'pout';
      q.ears = [0.6 * win(u, 0.4, 1, 3, 3.4), 0.6 * win(u, 0.4, 1, 3, 3.4)];
      q.fx = { kind: 'idleyawn', u };
    }
  }
}

// ---------- Her effects ----------
function crumb(ctx, x, y, s, al) {
  if (al <= 0.01) return;
  ell(ctx, x, y, s, s * 0.8);
  ctx.fillStyle = `rgba(246,196,106,${al})`;
  ctx.fill();
}
function page(ctx, x, y, s, rot, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-s, -s * 1.2, s * 2, s * 2.4, s * 0.25);
  ctx.fillStyle = PAGE.base;
  ctx.fill();
  pen(ctx, PAGE.ink, 0.4);
  ctx.stroke();
  ctx.fillStyle = PAGE.head;
  ctx.fillRect(-s, -s * 1.2, s * 2, s * 0.6);
  ctx.restore();
}
function inkArc(ctx, cx, cy, r, a0, a1, al, w = 1.8) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  pen(ctx, PEN.ink, w + 0.8);
  ctx.beginPath();
  ctx.arc(cx, cy, r, a0, a1);
  ctx.stroke();
  pen(ctx, PEN.base, w);
  ctx.stroke();
  ctx.restore();
}
const INKC = '#2e2a5a';
// (her effects are drawn in her rig's space, which is scaled up more than the others': K brings them to size)
const K = 0.42;
function fx(ctx, m, a, S, matOf, D) {
  const q = a.mnQ;
  if (!q) return;
  const t = a.t ?? 0;
  const f = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -24]);
  const face = headAt(a, D, [6, 4]);
  const mouthP = headAt(a, D, [2, 12]);
  const PG = penGeom(a, D);
  const nib = nibAt(PG);
  const handF = ptOf(a, D, 'handF', D.J.handF);
  // (the cookie brought up to her mouth: her far hand is behind her, so it's drawn in front of her here)
  if (q.cookieFront && !q.noCookie) for (const mode of ['line', 'fill']) drawCookie(ctx, a, mode, mouthP[0] + 2.4, mouthP[1] + 0.6, a.mnCookie ?? 1, LWR);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  const say = (text, x, y, size = 7, tilt = -0.08) => cue(ctx, text, x, y, size * K, f, tilt, INKC, '#fffaf0');
  switch (X.kind) {
    case 'crumbs':
      for (let i = 0; i < 3; i++) {
        const v = (u * 0.9 + i / 3) % 1;
        crumb(ctx, mouthP[0] + 2 * K + i * 1.5 * K, mouthP[1] + 2 * K + v * 14 * K, 0.7 * K, 1 - v);
      }
      if ((u % 2) > 1.2 && (u % 2) < 1.8) say('nom', face[0] + 14 * K, face[1] - 16 * K, 6);
      break;
    case 'stompfx':
      if (u > 0 && u < 0.8) {
        for (let i = 0; i < 4; i++) page(ctx, (-10 + i * 8) * K, (-4 - u * 30 - (i % 2) * 6) * K, 2 * K, i + u * 4, 1 - u / 0.8);
        say('STOMP', 4 * K, -8 * K, 8);
      }
      break;
    case 'circlefx':
      inkArc(ctx, crown[0] + 28 * K, crown[1] + 10 * K, 14 * K, -Math.PI / 2, -Math.PI / 2 + X.an, 1, 2.2 * K);
      if (X.an >= TAU - 0.01) say('UP!', crown[0] + 28 * K, crown[1] + 11 * K, 10, -0.1);
      break;
    case 'redX':
      if (u > 0 && u < 1) {
        const k = sstep(u / 0.3);
        ctx.save();
        ctx.globalAlpha = 1 - sstep((u - 0.6) / 0.4);
        ctx.lineCap = 'round';
        for (const [x0, y0, x1, y1] of [[30 * K, -40 * K, 52 * K, -14 * K], [52 * K, -40 * K, 30 * K, -14 * K]]) {
          pen(ctx, PEN.ink, 4 * K);
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k);
          ctx.stroke();
          pen(ctx, PEN.base, 2.6 * K);
          ctx.stroke();
        }
        ctx.restore();
      }
      break;
    case 'castSeeMe':
      inkArc(ctx, nib[0] + 6 * K, nib[1] - 4 * K, 7 * K, u * 4, u * 4 + Math.min(TAU, u * 3), 0.9, 1.4 * K);
      if (u > 0.3) say('SEE ME.', crown[0] + 18 * K, crown[1] - 4 * K, 8);
      break;
    case 'relSeeMe':
      if (u < 0.5) say('Up!', nib[0] + 8 * K, nib[1] - 8 * K, 9, -0.1);
      break;
    case 'castAlarm':
      for (let k = 0; k < 3; k++) {
        const v = (u * 1.6 + k / 3) % 1;
        ctx.save();
        ctx.globalAlpha = 1 - v;
        pen(ctx, GOLD.sh, 1.2 * K);
        ctx.beginPath();
        ctx.arc(mouthP[0] + 4 * K, mouthP[1], (6 + v * 26) * K, -0.7, 0.7);
        ctx.stroke();
        ctx.restore();
      }
      say('GOOD MORNING!', crown[0] + 26 * K, crown[1] - 6 * K, 8, -0.06 + Math.sin(u * 30) * 0.02);
      break;
    case 'castUnread': {
      const v = (u * 1.4) % 1;
      ctx.save();
      ctx.globalAlpha = 1 - v;
      ctx.translate(handF[0] + 6 * K + v * 30 * K, handF[1] - 8 * K - Math.sin(v * Math.PI) * 14 * K);
      ctx.rotate(v * 3);
      ctx.scale(K, K);
      ctx.beginPath();
      ctx.roundRect(-3.4, -2.2, 6.8, 4.4, 0.6);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      pen(ctx, '#a8a6c6', 0.4);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-3, -1.8);
      ctx.lineTo(0, 0.4);
      ctx.lineTo(3, -1.8);
      ctx.stroke();
      ctx.restore();
      if (u > 0.3) say('Unread!', crown[0] + 18 * K, crown[1] - 4 * K, 7);
      break;
    }
    case 'castAll':
      if (u > 0.2) say('Everyone. My office.', crown[0] + 24 * K, crown[1] - 4 * K, 7);
      break;
    case 'castWeek':
      if (u > 0.2) say(X.cp === 'nextweek' ? 'And NEXT week...' : X.cp === 'noweekend' ? 'No weekends!' : 'This week...', crown[0] + 22 * K, crown[1] - 4 * K, 7);
      if (X.cp === 'noweekend' && u > 0.3 && u < 1.4) for (let i = 0; i < 4; i++) crumb(ctx, mouthP[0] + 2 * K + i * K, mouthP[1] + 3 * K + ((u * 2 + i * 0.3) % 1) * 12 * K, 0.8 * K, 1);
      break;
    case 'castStrike':
      if (u > 0.3) say('Strike that.', crown[0] + 20 * K, crown[1] - 4 * K, 7);
      break;
    case 'castSnooze':
      if (X.slap > 0.7) say('SNOOZE!', nib[0] + 8 * K, nib[1] - 10 * K, 8, -0.1);
      break;
    case 'rush':
      if (u > 0.4 && u < 2.2) say('Running LATE!', crown[0] + 24 * K, crown[1] - 6 * K, 8);
      if (u > 0.4 && u < 1.2) for (let i = 0; i < 4; i++) page(ctx, (-10 + i * 8) * K, (-4 - (u - 0.4) * 30 - (i % 2) * 6) * K, 2 * K, i + u * 4, 1 - (u - 0.4) / 0.8);
      break;
    case 'gobble':
      if (u > 0.2 && u < 1.2) say('*GULP*', face[0] + 16 * K, face[1] - 18 * K, 8);
      if (u > 1.3 && u < 2.4) say('No more weekends!', crown[0] + 24 * K, crown[1] - 6 * K, 8);
      break;
    case 'jab':
      if (u > -0.02 && u < 0.4) say('jab!', nib[0] + 6 * K, nib[1] - 8 * K, 7);
      break;
    case 'ink':
      if (u > -0.02 && u < 0.5) {
        const k = clamp(u / 0.4, 0, 1);
        inkArc(ctx, 0, -34 * K, (28 + k * 6) * K, -1.2, -1.2 + 1.8 * sstep(k * 1.6), 1 - sstep((k - 0.6) / 0.4), 2 * K);
      }
      break;
    case 'stomp':
      if (u > -0.02 && u < 0.7) {
        for (let i = 0; i < 3; i++) page(ctx, (6 + i * 8) * K, (-3 - u * 24 - (i % 2) * 5) * K, 1.8 * K, i + u * 5, 1 - u / 0.7);
        if (u < 0.4) say('stomp!', 14 * K, -12 * K, 7);
      }
      break;
    case 'ready':
      sparkle(ctx, nib[0], nib[1], (1.2 + Math.sin(t * 9) * 0.4) * K, 0.6 * (X.k ?? 1), '#ffd0d8');
      break;
    case 'hurt': {
      const v = clamp(u / 0.5, 0, 1);
      page(ctx, (-8 - v * 12) * K, (-30 - Math.sin(v * Math.PI) * 10 + v * 10) * K, 2 * K, v * 4, 1 - v);
      break;
    }
    case 'gloat': {
      say('Up!', face[0] + 16 * K + u * 4, face[1] - 18 * K - u * 8, 8);
      ctx.save();
      ctx.globalAlpha = win(u, 0, 0.12, 0.6, 0.9);
      pen(ctx, PEN.base, 1.6 * K);
      ctx.beginPath();
      ctx.moveTo(face[0] + 26 * K, face[1] - 6 * K);
      ctx.lineTo(face[0] + 28 * K, face[1] - 3.6 * K);
      ctx.lineTo(face[0] + 32 * K, face[1] - 10 * K);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'idletap':
      if (X.tap > 0.85) say('tap', nib[0] + 6 * K, nib[1] - 6 * K, 5, 0.1);
      break;
    case 'idlepoint':
      if (u > 0.6 && u < 2.4) say('Up!', nib[0] + 8 * K, nib[1] - 10 * K, 9, -0.1);
      if (u > 4.3 && u < 6.4) say("It's Monday~", face[0] + 20 * K, face[1] - 18 * K, 7);
      break;
    case 'idleyawn':
      if (u > 0.8 && u < 3) say('hhaa...', face[0] + 14 * K, face[1] - 16 * K, 6);
      if (u > 4.6 && u < 6.6) say("I'm NOT sleepy.", face[0] + 22 * K, face[1] - 18 * K, 7);
      break;
    case 'crumple':
      if (u < 2.4) say('hhhAAAAaa...', face[0] + 18 * K, face[1] - 20 * K, 8);
      if (X.sleep > 0.5) {
        // a soft sleep bubble, lilac, swelling and shrinking
        const b = (2.4 + Math.sin(t * 1.4) * 1) * K;
        ell(ctx, mouthP[0] + 4 * K, mouthP[1] - 2 * K, b, b);
        ctx.fillStyle = 'rgba(239,232,255,0.75)';
        ctx.fill();
        pen(ctx, SLEEP.deep, 0.4 * K);
        ctx.stroke();
        cue(ctx, 'zz', crown[0] + 12 * K + Math.sin(t) * 2 * K, crown[1] - ((t * 0.5) % 1) * 6 * K, 8 * K, f, 0.1, SLEEP.deep, '#fffaf0');
      }
      break;
    case 'beaten':
      if (u < 1.2) dizzy(ctx, crown[0], crown[1] + 6 * K, 10 * K, t, 3);
      else cue(ctx, 'zz', face[0] + 14 * K + Math.sin(t) * 2 * K, face[1] - 18 * K - ((t * 0.6) % 1) * 4 * K, 7 * K, f, 0.1, SLEEP.deep, '#fffaf0');
      break;
    default:
      break;
  }
}

// ---------- Her clothes (the rig's hooks) ----------
const DRESS = {
  id: 'monday',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  // (behind everything of hers: her long hair and ears; her tail and the sash's bow)
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    const q = a.mnQ ?? {};
    for (const mode of ['line', 'fill']) {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', q, a.mnF, a.mnHair ?? {}, LWK / HS);
      ctx.restore();
      tail(ctx, a, mode, D, LWR);
      sashBow(ctx, a, mode, D, LWR);
    }
  },
  under: {
    handFskin: (ctx, a, mode, S, D) => cookie(ctx, a, mode, D, LWR),
    handNskin: (ctx, a, mode, S, D) => bigPen(ctx, a, mode, D, LWR),
  },
  over: {
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F', LWR),
    legF: (ctx, a, mode, S, D) => tights(ctx, a, mode, D, 'F', LWR),
    footFskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'F', LWR),
    legN: (ctx, a, mode, S, D) => tights(ctx, a, mode, D, 'N', LWR),
    footNskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'N', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      jacket(ctx, a, mode, D, LWR);
      skirt(ctx, a, mode, D, LWR);
    },
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.mnQ ?? {}, a.mnF, a.mnHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N', LWR),
  },
  pose,
  fx,
};
const R = dressRig('kid', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.6);
rig.h = Math.round(rig.h * BIG * 1.5);
export const MONDAY_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const MONDAY_SIZE = { w: 62, h: 136, speed: Math.round(R.speed * BIG) };
