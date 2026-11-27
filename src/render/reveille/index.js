// Madame Reveille on screen (remade 2026-11-27 from scratch, her idea kept: the Queen's bedside alarm clock grown into
// a prim, bossy lady who means to ring the Queen awake and back to her Mondays; the finale's trial at dawn on the
// palace lawn, world/reveille.js her new fight). A brisk morning governess with a rooster's pride: up before the sun,
// never late, never tired (she says). She walks on her own copy of the blank bases' hooked rig (rig.js) on her own
// `reveille` build (body.js: the maiden's, grown upright and proud), her head, hair, bonnet and clothes drawn here
// (head.js, dress.js), never the shared face or the hero's body or hair, nothing of another boss's.
//   look    warm fair skin; copper-auburn hair (an even blunt fringe of four sections just above her lashes, neat
//           chin-length side locks curling under outside her eyes, the rest a long fall down her back rolled under at
//           its end); a little rose pillbox bonnet set back on her crown with the alarm clock's two brass bells on top
//           and their striker between them, a tiny dial on its side keeping time, two rose ribbons; a cream ruffled
//           stand collar with her clock brooch; a rose waistcoat with two rows of gold buttons and a cream jabot; a
//           pleated rose skirt with a gold hem band marked like a clock's bezel, a cream petticoat frill; a bustle of
//           three rooster plumes (deep iridescent teal, the longest tipped gold) from a rose bow at her back;
//           leg-of-mutton sleeves with cream wrist ruffles; white stockings, rose button boots; her brass handbell in
//           her near hand; a gold pocket watch on a chain at her hip. Soft own-colour outlines; her face bare.
//   faces   (head.js) "sunrise eyes": a high dome over a flatter lower edge, a sunrise in each iris (gold coming up
//           into rose and dusk plum), a little round sun for a glint; long prim arched brows; a small prim mouth.
//           Moods: prim (rest), brisk, pleased, tut, sweet, shout, cross, focus, alarmed, proud, count, worried,
//           frazzled, drowsy, yawn, asleep, hurt (> <), dizzy, talk, beam.
//   idle    a 30 s act, only while calm: watch (the pocket watch up, a look, a tap of the glass, held to her ear:
//           "tick... tock...", a satisfied "Six fifty-nine."), polish (the handbell buffed on her cuff, a tiny test
//           ring: "ding~", her bonnet's bells answering), crow (hands on hips, chest out, up on her toes, her plumes
//           fanning up: a rooster's pride, "Hmph!"), tap (her toe tapping, a look up at the sky: "Late." "LATE.").
//   walk    a brisk, prim march, chin up, the handbell swung on the beat, her plumes bobbing behind.
//   fight   between casts, three swings in turn: Bell Bonk (the handbell up and knocked down: ding!), Ring Out (the
//           bell swept round ringing: rings of sound), Shoo! (a stamp and a flick of her hand: "Up!"). Her casts
//           (m.castPose, world/reveille.js): entrance (Good Morning!: the bell rung high overhead), bell (Morning
//           Bell: the bell lifted high, then brought down hard), ring (Ring-a-Ding: three swings on the beat), snooze
//           (The Snooze Button: the bell pointed at the lit button, a hand on her hip), again (Snooze Again?!: one
//           button, then the other, cross), rise (Rise and Shine!: arms flung wide, up on her toes, plumes fanned),
//           doodle (Cock-a-Doodle-Doo!: a hand cupped to her mouth, leaning in, crowing), minutes (Five More
//           Minutes?: a finger wagged, alarm clocks tossed from her hand one after another), light (First Light: the
//           bell raised to the sun, her free hand beckoning the light down). Her phase moments (her rotation's phase
//           changing): "Five more minutes?! NO!" (a stamp, the bell shaken furiously), "RIIIIIIING!!" (both arms up,
//           the bell rung overhead, every bell going).
//   scenes  her entrance (dawnpalace_intro): 'tap' (her toe tapping, a look up at the sun), 'ring' (the bell rung high
//           over her head, the bonnet's bells going), 'clang' (the bell swung down: a CLANG of sound). Her ending
//           (alarm_win): stood up, worn out and cross, flicked, she fades.
//   marks   all her own (`ownEmotes`): a little bell-shaped "!" when she spots you, "Up and at 'em!" after landing a
//           hit, a "ting" knocked off her bonnet bells when hurt, a sweat drop when low, z's when she nods off (she'd
//           never), and beaten: sat down, wound down, dizzy then dozing, her bell in her lap.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, win, ell, pen, glow, sparkle, cue, spring, dizzy } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { waistcoat, collar, bustle, skirt, sleeve, stocking, boot, handbell, bellGeom, bellMouth, watchHang, drawWatch, drawHandbell, enter, ptOf } from './dress.js';
import { SKIN, SKIN_INK, GOLD, ROSE, CREAM, DAWN, SLEEP, SNOOZE, PLUME } from './palette.js';

const BIG = 2.05;
const LWR = 2 / BIG;
let LWK = 2;
const HS = 1.06;
const HO = [1.0, -18.0];
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

const SWINGS = ['bonk', 'peal', 'shoo'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.rvN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'watch', t0: 0.4, len: 7.2 },
  { name: 'polish', t0: 8.0, len: 6.6 },
  { name: 'crow', t0: 15.0, len: 6.8 },
  { name: 'tap', t0: 22.2, len: 7.0 },
];
const CYCLE = 30;
// (at rest: the handbell hanging from her near hand at her side, her far hand on her hip)
const REST = { shN: -6, elN: -18, hwN: 2, shF: 30, elF: -105, hwF: 10 };

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'prim', look: [0.4, 0], turn: 0.35, fx: null, sweat: 0, tears: false, bell: 0, ring: 0, watch: 0, fan: 0, noBell: false, mark: null };
  a.rvQ = q;
  a.rvUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.4);
  const mood = m.cine?.mood;
  const freed = Boolean(m.cine?.freed);
  const frac = m.hp / m.def.hp;
  const low = m.hp > 0 && frac < 0.25;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const actDur = act?.dur ?? 1;
  const since = now - (m.attackAt ?? -9);
  const cast = m.cast;
  const castU = cast ? now - cast.t0 : -1;
  const cp = m.castPose ?? null;
  if (cp) st.rvLastPose = cp;
  const relU = !cast && st.rvLastPose && since >= 0 && since < 1.1 ? since : -1;
  const relPose = relU >= 0 ? st.rvLastPose : null;
  if (!cast && since >= 1.1) st.rvLastPose = null;
  // (her rotation's phase: world/story.js keeps it on m.rot; a change is her phase moment)
  const ph = m.rot?.phase ?? 0;
  if (st.rvPh == null) st.rvPh = ph;
  if (ph > st.rvPh && m.hp > 0) st.rvPhAt = now;
  st.rvPh = ph;
  const phaseU = st.rvPhAt != null ? now - st.rvPhAt : -1;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.rvAtk) {
    st.rvN = (st.rvN ?? (m.uid ?? 0)) + 1;
    st.rvPick = pickSwing(m, st);
  }
  st.rvAntic = swinging ? Math.max(anticK, st.rvAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.rvAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const gloatU = now - (m.gloatAt ?? -9);
  const sceneAct = act && actU >= 0 && actU < actDur + 0.4 ? act.move : null;
  const beaten = m.hp <= 0 && !freed;
  const busy = beaten || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2.4) || sceneAct;
  const fighting = m.hp > 0 && (m.engaged || (m.aggroUntil ?? 0) > now || Boolean(cast));

  // At rest: upright and proud, chin up, chest out, the bell at her side, her far hand on her hip; a small
  // brisk bob, as if counting the seconds.
  const tick = Math.pow(Math.abs(Math.sin(t * Math.PI)), 8);
  go({ tilt: -2 + Math.sin(t * 0.6) * 0.6, chest: -1.5 + breath * 0.8, head: -3 + Math.sin(t * 0.5 + 1) * 1.2 - tick * 0.6, pelvis: 1.2, ...REST }, 1);
  q.bell = Math.sin(t * 0.9) * 0.04;
  q.look = [0.45 + Math.sin(t * 0.27) * 0.2, 0];
  if (walkW > 0.01) {
    const sw = Math.sin(t * 7.2);
    go({ tilt: 1, head: -5, chest: -2, shN: -20 - sw * 18, elN: -26, shF: 22 + sw * 6, elF: -100 }, walkW);
    q.bell = mix(q.bell, sw * 0.35, walkW);
    q.look = [0.75, -0.1];
  }
  if (fighting && !busy && walkW < 0.5) say('brisk');
  if (beaten) {
    // beaten: wound down, sat on the lawn, the bell in her lap; dizzy, then dozing
    const u = now - (st.rvDeadAt ??= now);
    go({ drop: 0.84, tilt: 4, head: 12 + Math.sin(t * 0.8) * 2, shN: 10, elN: -45, shF: -30, elF: -90, fxN: 0.5, fxF: 0.3 });
    q.mood = u < 1.1 ? 'dizzy' : 'asleep';
    q.turn = 0.3;
    q.bell = -0.7;
    q.fx = { kind: 'beaten', u };
  } else st.rvDeadAt = undefined;

  if (!beaten) {
    if (sceneAct) sceneOf(sceneAct, actU, actDur, go, q, t, say);
    else if (cast) castPoseOf(cp, castU, cast.dur, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say);
    else if (relPose) releaseOf(relPose, relU, go, q, t, say);
    else if (phaseU >= 0 && phaseU < 2.4) phaseOf(ph, phaseU, go, q, t, say);
    else if (swinging) {
      const kind = st.rvPick ?? 'bonk';
      const R = kind === 'peal' ? 0.22 : 0.16;
      const hitK = struck ? (since < R ? sstep(since / R) : 1 - sstep((since - R - 0.15) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.rvAntic) * (since < R ? 1 : 0) : sstep(anticK);
      if (kind === 'bonk') {
        // Bell Bonk: the bell up over her shoulder, then knocked down in front: ding!
        go({ shN: -150, elN: -50, tilt: -5, head: -4, lift: 0.03 }, wK);
        go({ shN: -70, elN: -10, tilt: 7, head: 3, x: 0.03 }, hitK);
        q.bell = mix(q.bell, -2.6, wK) + (-1.3 - q.bell) * hitK;
        say(hitK > 0.3 ? 'shout' : 'focus');
        q.ring = hitK;
      } else if (kind === 'peal') {
        // Ring Out: the bell swept round from behind her, ringing all the way
        go({ shN: 30, elN: -60, tilt: -4, turnC: -10, chest: -3 }, wK);
        go({ shN: -100, elN: -14, tilt: 6, turnC: 8, x: 0.02 }, hitK);
        q.bell = mix(q.bell, 0.6, wK) + (-1.9 - q.bell) * hitK;
        say(hitK > 0.3 ? 'shout' : 'brisk');
        q.ring = Math.max(wK * 0.4, hitK);
      } else {
        // Shoo!: a stamp and a flick of her far hand, "Up!"
        go({ lift: 0.05, tilt: -3, fyN: -0.25, shF: -40, elF: -90, hwF: -20 }, wK);
        go({ drop: 0.06, tilt: 4, fyN: 0, shF: -95, elF: -12, hwF: 25 }, hitK);
        say(hitK > 0.3 ? 'cross' : 'brisk');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = sstep(hurtU / 0.07) * (1 - sstep((hurtU - 0.08) / 0.42));
      go({ tilt: -7, head: -9, x: -0.02, shN: -30, elN: -50, shF: -20, elF: -70 }, k);
      q.bell = mix(q.bell, 0.5, k);
      q.ring = 0.6 * k;
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const napping = m.habit?.kind === 'nap' && (m.habit.until ?? 0) > now;
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || fighting || busy || hurt || napping || low ? 0 : 1);
    st.rvCalm = mix(st.rvCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.rvCalm > 0.02 && !q.fx) idleAct(m, go, q, sstep(st.rvCalm), t, now, st);
    if (napping && !busy) {
      // a nap (she'd never): nodding off on her feet, the bell drooping, then jolting awake
      const nu = (t + (m.uid ?? 0)) % 6;
      const jolt = win(nu, 4.9, 5.0, 5.3, 5.7);
      const nod = sstep(nu / 3) * (1 - jolt);
      go({ head: 14 * nod + Math.sin(t * 0.9) * 2 * nod - 6 * jolt, tilt: 2 * nod, shN: 4 * nod, elN: -8, shF: 30 - 10 * jolt }, 1);
      q.bell = 0.1 * nod;
      q.mood = jolt > 0.3 ? 'alarmed' : nod > 0.6 ? 'asleep' : 'drowsy';
      q.fx = { kind: jolt > 0.3 ? 'jolt' : 'nap', u: nu };
    }
    if (mood && !cast && !relPose && !swinging && !sceneAct) {
      q.mood = { angry: 'shout', happy: 'pleased', sad: 'worried', talk: 'talk', sleep: 'asleep', blink: 'prim', hurt: 'hurt', surprised: 'alarmed', sleepy: 'drowsy' }[mood] ?? q.mood;
      if (mood === 'angry') {
        go({ shN: -110, elN: -30, head: -5, tilt: -2 }, 1);
        q.bell = -1.8;
        q.ring = freed ? 0.15 : 0.5;
      }
      if (mood === 'sad') go({ head: 8, shN: -10, elN: -30 }, 1);
      // (freed for her farewell: worn out, cross, the bell barely up)
      if (freed && mood === 'angry') {
        go({ shN: -70, elN: -40, head: -2, tilt: 2, drop: 0.02 }, 1);
        q.bell = -1.1;
        q.mood = 'cross';
        q.sweat = (t * 0.5) % 1;
      }
    }
    if (!busy && !hurt && gloatU >= 0 && gloatU < 2) st.rvGlAt ??= now;
    else if (busy || hurt || gloatU < 0 || gloatU >= 2) st.rvGlAt = undefined;
    const glU = st.rvGlAt != null ? now - st.rvGlAt : -1;
    st.rvGlW = mix(st.rvGlW ?? 0, glU >= 0 && glU < 0.75 ? 1 : 0, 1 - Math.exp(-dt * 10));
    if (st.rvGlW > 0.01) {
      // a gloat: the bell held up, her chin higher, "Up and at 'em!"
      const k = st.rvGlW;
      go({ shN: -120, elN: -40, head: -6, tilt: -3, chest: -3 }, k);
      q.bell = mix(q.bell, -2.2, k);
      q.ring = Math.max(q.ring, 0.4 * k);
      say('pleased', k);
      if (glU >= 0) q.fx = { kind: 'gloat', u: glU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'frazzled';
      q.sweat = (t * 0.6) % 1;
      // (her bonnet's bells keep giving little nervous jangles)
      q.ring = Math.max(q.ring, Math.pow(Math.max(0, Math.sin(t * 2.3)), 12) * 0.5);
    }
    if (m.talking) q.mood = 'talk';
    // (her own "!" when she spots you)
    if (fighting && !st.rvHunt) st.rvBangAt = now;
    st.rvHunt = fighting;
    const bang = now - (st.rvBangAt ?? -9);
    if (bang >= 0 && bang < 1.1 && !q.fx) q.fx = { kind: 'bang', u: bang };
  }
  if (m.rvFace) q.mood = m.rvFace;
  q.turn = spring(st, 'rvTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.prim;
  const f = (st.rvF ??= { ...FACES.prim, shut: { happy: 0, calm: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.rvF = f;
  // Springs: her skirt, her plumes, the bonnet's ribbons and striker, the bell and its clapper, the watch, her hair.
  const kick = ((st.rvLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.rvLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7);
  st.rvLast = out.head;
  st.rvLastT = out.tilt;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  a.rvSkirt = spring(st, 'sk', -lean * 1.6 - walkW * 0.6 + Math.sin(t * 1.2) * 0.08, 90, 9, dt, kick * 0.01);
  a.rvFan = spring(st, 'fan', q.fan, 60, 11, dt);
  a.rvPlume = [0, 1, 2].map((i) => spring(st, `pl${i}`, -lean * (0.8 + i * 0.3) - walkW * (0.12 + i * 0.05) * (1 + Math.sin(t * 7.2 + i)) + Math.sin(t * (1.1 + i * 0.23) + i * 2) * 0.04, 70 + i * 16, 8, dt, kick * (0.008 + i * 0.003)));
  // (the bell: eased to where her pose holds it; its clapper hangs toward the ground and swings when it moves)
  const bellRot = spring(st, 'bell', q.bell, 160, 17, dt);
  const bellV = (st.rvBellLast ?? bellRot) - bellRot;
  st.rvBellLast = bellRot;
  a.rvBell = { rot: bellRot };
  const ringK = spring(st, 'ring', q.ring, 140, 16, dt);
  a.rvRing = clamp(ringK, 0, 1.2);
  const handTurn = ((out.shN ?? 0) + (out.elN ?? 0)) * (Math.PI / 180);
  a.rvClap = spring(st, 'clap', clamp(-bellRot - handTurn * 0.2, -0.55, 0.55) + Math.sin(t * 38) * 0.35 * a.rvRing, 90, 6, dt, bellV * 6);
  a.rvWatch = q.watch;
  a.rvWatchSw = spring(st, 'wsw', -lean * 0.8 - walkW * Math.sin(t * 7.2) * 0.4, 70, 6, dt, kick * 0.01);
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0) + (out.chest ?? 0) * 0.5) * (Math.PI / 180);
  a.rvHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.6 + i * 1.9) * 0.02 + headLean * 0.1, 200 + i * 30, 15, dt, kick * 0.003 * (i % 2 ? 1 : -1))),
    slN: spring(st, 'sln', Math.sin(t * 1.1) * 0.05 - headLean * 0.3 + walkW * 0.1, 90, 10, dt, kick * 0.005),
    slF: spring(st, 'slf', Math.sin(t * 1.0 + 2) * 0.05 - headLean * 0.3 + walkW * 0.1, 86, 10, dt, kick * 0.005),
    back: spring(st, 'bk', Math.sin(t * 0.8) * 0.04 - walkW * 0.2 - lean * 0.4, 40, 7, dt, kick * 0.006),
    lean: spring(st, 'bkl', headLean, 70, 12, dt),
    sit: clamp(out.drop ?? 0, 0, 1),
    rib: [0, 1].map((i) => spring(st, `rb${i}`, -headLean * 0.4 - walkW * (0.25 + i * 0.1) + Math.sin(t * (1.3 + i * 0.4) + i) * 0.06, 60 + i * 14, 7, dt, kick * 0.008)),
    hammer: clamp(spring(st, 'ham', Math.sin(t * 46) * 0.32 * a.rvRing, 260, 18, dt, kick * 0.004), -0.5, 0.5),
  };
}

// Her scene acts.
function sceneOf(act, u, dur, go, q, t, say) {
  if (act === 'tap') {
    // her toe tapping, a look up at the sun, a tut
    const k = win(u, 0, 0.3, dur - 0.3, dur + 0.2);
    const tp = Math.pow(Math.abs(Math.sin(u * Math.PI * 2.2)), 4);
    go({ fyN: -0.18 * tp, head: -8, tilt: -2 }, k);
    q.look = [0.6, -0.9];
    say(u < dur * 0.6 ? 'focus' : 'tut', k);
    q.fx = { kind: 'idletap', u, tap: tp };
  } else if (act === 'ring') {
    // the bell rung high over her head, the bonnet's bells going: RIIIIING!
    const k = win(u, 0, 0.3, dur - 0.3, dur + 0.2);
    const sh = Math.sin(u * 26);
    go({ shN: -142 + sh * 8, elN: -8, head: -8, tilt: -4, chest: -3, lift: 0.04 + Math.abs(sh) * 0.01, shF: -40, elF: -60 }, k);
    q.bell = -2.5 + sh * 0.35;
    q.ring = k;
    q.fan = k;
    say('shout', k);
    q.fx = { kind: 'ringing', u, big: true };
  } else if (act === 'clang' || act === 'attack' || act === 'windup') {
    // the bell swung down: a CLANG of sound
    const k = win(u, 0, 0.12, dur - 0.2, dur + 0.3);
    const sw = sstep((u - 0.25) / 0.2);
    go({ shN: -165 + sw * 100, elN: -30 + sw * 22, tilt: -6 + sw * 13, head: -6 + sw * 9, x: 0.02 * sw }, k);
    q.bell = -3.0 + sw * 1.6;
    q.ring = sw;
    say(sw > 0.3 ? 'shout' : 'focus', k);
    q.fx = { kind: 'clang', u: u - 0.4 };
  }
}

function castPoseOf(cp, u, dur, wind, go, q, t, say) {
  const k = sstep(u / 0.4);
  if (cp === 'entrance') {
    // Good Morning!: the bell rung high overhead, a bright smile (it's not a nice one)
    const sh = Math.sin(u * 24);
    const up = sstep((u - 0.5) / 0.5);
    go({ shN: -60 - 82 * up + sh * 6 * up, elN: -30 + 22 * up, head: -6, tilt: -3, chest: -3, lift: 0.03 * up, shF: 20, elF: -100 }, k);
    q.bell = mix(-1.2, -2.5 + sh * 0.3, up);
    q.ring = up;
    q.fan = up * 0.6;
    say(u < 0.8 ? 'sweet' : 'shout', k);
    q.fx = { kind: 'castMorning', u };
  } else if (cp === 'bell') {
    // Morning Bell: the bell lifted high, held trembling... then brought down hard
    const sh = Math.sin(u * 30) * (0.3 + 0.7 * sstep(u / dur));
    go({ shN: -142 + sh * 3 + wind * 82, elN: -8 + wind * 8, head: -6 + wind * 8, tilt: -4 + wind * 11, lift: 0.04 * (1 - wind), x: 0.03 * wind }, k);
    q.bell = -2.5 + sh * 0.15 + wind * 1.3;
    q.ring = 0.3 + wind * 0.7;
    q.look = [1, 0.3];
    say(wind > 0.3 ? 'shout' : 'focus', k);
    q.fx = { kind: 'castBell', u };
  } else if (cp === 'ring') {
    // Ring-a-Ding: three swings on the beat, ring... ring... RING
    const beat = (u % 0.9) / 0.9;
    const sw = Math.sin(beat * Math.PI);
    go({ shN: -60 - sw * 70, elN: -30, tilt: -2 + sw * 3, head: -3 - sw * 2, shF: 30, elF: -105 }, k);
    q.bell = -1.0 - sw * 1.2;
    q.ring = 0.5 + 0.5 * sw;
    say(sw > 0.6 ? 'shout' : 'brisk', k);
    q.fx = { kind: 'castRing', u };
  } else if (cp === 'snooze' || cp === 'again') {
    // The Snooze Button: the bell pointed at the lit button, her far hand on her hip; Snooze Again?!: one button,
    // then the other, cross
    const sw = cp === 'again' ? sstep((u - dur * 0.45) / 0.3) : 0;
    const jab = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.2)), 6);
    go({ shN: -80 - jab * 10 + sw * 20, elN: -12, tilt: -2, head: 2 + sw * 4, shF: 30, elF: -105, turnC: -4 + sw * 8 }, k);
    q.bell = -1.7 - jab * 0.15;
    q.look = [0.9, 0.6];
    say(cp === 'again' && u > dur * 0.45 ? 'cross' : 'sweet', k);
    q.fx = { kind: 'castSnooze', u, cp };
  } else if (cp === 'rise') {
    // Rise and Shine!: arms flung wide, up on her toes, plumes fanned
    const op = sstep((u - 0.3) / 0.6);
    go({ shN: -130 * op - 20, elN: -10, shF: -120 * op, elF: -15, head: -10 * op, tilt: -4 * op, chest: -4 * op, lift: 0.05 * op }, k);
    q.bell = -2.4 * op;
    q.ring = op * 0.6;
    q.fan = op;
    say(op > 0.5 ? 'beam' : 'sweet', k);
    q.fx = { kind: 'castRise', u };
  } else if (cp === 'doodle') {
    // Cock-a-Doodle-Doo!: her handbell lifted to her mouth like a horn, chest out, head back, then crowed through
    // it, leaning in; plumes up
    const crow = sstep((u - dur * 0.55) / 0.3);
    go({ shN: -72 - crow * 10, elN: -78 + crow * 30, hwN: -10, tilt: -4 + crow * 9, head: -9 + crow * 5, chest: -4, shF: 30, elF: -105, lift: 0.03 * (1 - crow), x: 0.03 * crow }, k);
    q.bell = -1.75 - crow * 0.1;
    q.ring = crow * 0.8;
    q.fan = 0.6 + 0.4 * crow;
    say(crow > 0.3 ? 'shout' : 'proud', k);
    q.fx = { kind: 'castDoodle', u, crow };
  } else if (cp === 'minutes') {
    // Five More Minutes?: her bell wagged at you like a finger ("NO."), then shaken: little alarm clocks tumbling out
    // of it one after another
    const toss = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.25)), 3);
    const wag = u < 0.8 ? Math.sin(u * 16) : 0;
    go({ shN: -100 + toss * 30 + wag * 8, elN: -40 + toss * 20, tilt: -2 + toss * 3, head: -2, shF: 30, elF: -105 }, k);
    q.bell = -2.2 + toss * 0.8 + wag * 0.25;
    q.ring = toss * 0.5;
    say(u < 0.8 ? 'tut' : 'cross', k);
    q.fx = { kind: 'castMinutes', u, toss };
  } else if (cp === 'light') {
    // First Light: the bell raised to the sun, her free hand beckoning the light down
    const beck = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.1)), 2);
    go({ shN: -140, elN: -8, shF: -70 - beck * 30, elF: -50 - beck * 40, head: -9, tilt: -3, chest: -2 }, k);
    q.bell = -2.4;
    q.ring = 0.35;
    q.look = [0.6, -0.8];
    say('pleased', k);
    q.fx = { kind: 'castLight', u };
  } else {
    go({ shN: -60, elN: -60 }, k);
    say('brisk', k);
  }
}
function releaseOf(rp, u, go, q, t, say) {
  const k = 1 - sstep((u - 0.5) / 0.6);
  if (rp === 'bell') {
    go({ shN: -60, elN: -8, tilt: 7, head: 3, x: 0.03 }, k);
    q.bell = -1.2;
    q.ring = 1 - u;
    say('pleased', k);
    q.fx = { kind: 'relBell', u };
  } else if (rp === 'doodle') {
    go({ shF: -110, elF: -60, tilt: 6, head: -6, chest: -3 }, k);
    q.fan = 1 - u;
    say('proud', k);
  } else if (rp === 'rise' || rp === 'entrance') {
    go({ shN: -140, elN: -10, shF: -100, elF: -20, head: -8, chest: -3 }, k);
    q.bell = -2.4;
    q.ring = 1 - u;
    q.fan = 1 - u;
    say('beam', k);
  } else if (rp === 'snooze' || rp === 'again') {
    go({ shN: -138, elN: -10, head: -6, tilt: -3 }, k);
    q.bell = -2.4 + Math.sin(u * 26) * 0.3;
    q.ring = 1 - u;
    say('shout', k);
    q.fx = { kind: 'relSnooze', u };
  } else {
    go({ shN: -70, elN: -20, tilt: 4 }, k);
    say('pleased', k);
  }
}
function phaseOf(phase, u, go, q, t, say) {
  const k = win(u, 0, 0.25, 2, 2.4);
  if (phase <= 1) {
    // "Five more minutes?! NO!": a stamp of her foot, the bell shaken furiously
    const stp = sstep((u - 0.3) / 0.15);
    const sh = Math.sin(u * 30);
    go({ drop: 0.06 * stp * (1 - sstep((u - 0.8) / 0.4)), fyN: -0.25 * (1 - stp), shN: -125 + sh * 10, elN: -14, head: -8, tilt: -3 }, k);
    q.bell = -2.6 + sh * 0.4;
    q.ring = k;
    say(u < 0.3 ? 'alarmed' : 'shout', k);
    q.fx = { kind: 'phaseNo', u };
  } else {
    // "RIIIIIIING!!": both arms up, the bell rung overhead, every bell going
    const sh = Math.sin(u * 32);
    go({ shN: -145 + sh * 8, elN: -6, shF: -160, elF: -20, head: -12, tilt: -4, chest: -4, lift: 0.05 }, k);
    q.bell = -2.5 + sh * 0.4;
    q.ring = 1.2 * k;
    q.fan = k;
    say('shout', k);
    q.fx = { kind: 'phaseRing', u };
  }
}

function idleAct(m, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % CYCLE;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.rvPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.rvPiece = cur.name;
      else return;
    }
  } else {
    st.rvPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'watch') {
    // the pocket watch up from her hip: a look, a tap of the glass, held to her ear, a satisfied nod
    const k = win(u, 0, 0.5, 6.6, 7.2);
    const up = win(u, 0.4, 1.0, 5.6, 6.3);
    const ear = win(u, 3.0, 3.5, 4.6, 5.1);
    const tap = Math.pow(Math.abs(Math.sin((u - 2) * 9)), 6) * win(u, 1.9, 2, 2.6, 2.7);
    go({ shF: 30 - 92 * up + 10 * ear, elF: -105 + 25 * up - 30 * ear, hwF: -10 * up, head: 6 * up * (1 - ear) - 4 * ear, tilt: 1 * up, shN: -6 - 30 * tap, elN: -18 - 40 * tap }, k * w);
    if (at(k)) {
      q.watch = up > 0.5 ? 1 : 0;
      q.ear = ear;
      q.mood = ear > 0.5 ? 'tut' : up > 0.5 ? (u < 2.8 ? 'count' : 'focus') : u > 5.6 ? 'pleased' : 'prim';
      q.look = ear > 0.5 ? [0.2, 0] : [0.7, 0.9];
      q.fx = { kind: 'idlewatch', u, up, ear };
    }
  } else if (cur.name === 'polish') {
    // the handbell buffed on her cuff, then a tiny test ring: "ding~", her bonnet's bells answering
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const lift = win(u, 0.3, 0.8, 5.6, 6.1);
    const rub = win(u, 0.9, 1.2, 3.2, 3.5);
    const ding = win(u, 3.8, 4.0, 4.6, 5.2);
    const circ = Math.sin(u * 9) * rub;
    go({ shN: -6 - 60 * lift - 30 * ding, elN: -18 - 70 * lift + 30 * ding, shF: 30 - 70 * rub, elF: -105 + 10 * rub + circ * 10, head: 4 * lift - 4 * ding }, k * w);
    if (at(k)) {
      q.bell = mix(0, -1.1, lift) - ding * 0.5 + Math.sin(u * 30) * 0.2 * ding;
      q.ring = ding * 0.6;
      q.mood = rub > 0.5 ? 'focus' : ding > 0.3 ? 'sweet' : u > 5 ? 'pleased' : 'prim';
      q.look = [0.7, 0.6];
      q.fx = { kind: 'idlepolish', u, rub, ding };
    }
  } else if (cur.name === 'crow') {
    // a rooster's pride: hands on hips, chest out, up on her toes, plumes fanning up
    const k = win(u, 0, 0.5, 6.3, 6.8);
    const puff = win(u, 0.6, 1.4, 4.8, 5.8);
    const toes = win(u, 1.6, 2.0, 3.6, 4.1);
    go({ shN: 20 * puff, elN: -18 - 80 * puff, hwN: 10 * puff, chest: -5 * puff, head: -9 * puff, tilt: -3 * puff, lift: 0.05 * toes }, k * w);
    if (at(k)) {
      q.bell = mix(0, 0.9, puff);
      q.fan = puff;
      q.mood = toes > 0.5 ? 'proud' : puff > 0.5 ? 'pleased' : 'prim';
      q.look = [0.5, -0.4];
      q.fx = { kind: 'idlecrow', u, toes };
    }
  } else {
    // her toe tapping, a look up at the sky (the sun isn't up yet): "Late." ... "LATE."
    const k = win(u, 0, 0.5, 6.5, 7.0);
    const tp = Math.pow(Math.abs(Math.sin(u * Math.PI * 2)), 4) * win(u, 0.3, 0.6, 5.4, 5.8);
    const look = win(u, 1.2, 1.6, 4.2, 4.6);
    const shake = win(u, 4.6, 4.8, 5.6, 5.9) * Math.sin(u * 16);
    go({ fyN: -0.14 * tp, head: -9 * look + shake * 5, tilt: -1.5 * look, shF: 30, elF: -105 }, k * w);
    if (at(k)) {
      q.mood = look > 0.5 ? 'focus' : u > 4.6 ? 'tut' : 'brisk';
      q.look = look > 0.5 ? [0.5, -1] : [0.5, 0.2];
      q.fx = { kind: 'idletap', u, tap: tp };
    }
  }
}

// ---------- Her effects ----------
const INKC = '#7a2c48';
// (her effects are drawn in her rig's space; K brings them to size)
const K = 0.5;
// soft arcs of sound off a bell's mouth: `n` of them, travelling outward
function soundRings(ctx, x, y, dir, ang, u, n = 3, r0 = 4, r1 = 22, al = 1, spread = 0.7) {
  for (let i = 0; i < n; i++) {
    const v = (u * 1.4 + i / n) % 1;
    const a2 = al * (1 - v) * sstep(v / 0.15);
    if (a2 <= 0.02) continue;
    ctx.save();
    ctx.globalAlpha *= a2;
    ctx.lineCap = 'round';
    const r = (r0 + v * (r1 - r0)) * K;
    pen(ctx, GOLD.sh, 1.6 * K);
    ctx.beginPath();
    ctx.arc(x, y, r, ang - spread, ang + spread);
    ctx.stroke();
    pen(ctx, '#fff6d8', 0.8 * K);
    ctx.stroke();
    ctx.restore();
  }
}
// a little round alarm clock (the ones she tosses), two bells, a cream face, little feet
function tinyClock(ctx, x, y, s, rot, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  for (const sx of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(sx * s * 0.62, -s * 0.86, s * 0.42, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = GOLD.base;
    ctx.fill();
    pen(ctx, GOLD.ink, s * 0.1);
    ctx.stroke();
  }
  ell(ctx, 0, 0, s, s);
  ctx.fillStyle = ROSE.base;
  ctx.fill();
  pen(ctx, ROSE.ink, s * 0.12);
  ctx.stroke();
  ell(ctx, 0, 0, s * 0.72, s * 0.72);
  ctx.fillStyle = '#fffdf6';
  ctx.fill();
  pen(ctx, '#6a3a58', s * 0.12);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -s * 0.5);
  ctx.moveTo(0, 0);
  ctx.lineTo(s * 0.36, s * 0.1);
  ctx.stroke();
  ctx.restore();
}
function bangBell(ctx, x, y, u) {
  // her "!": a little brass bell bubble with a "!" in it, popping in with an overshoot
  const k = u < 0.15 ? sstep(u / 0.15) * 1.15 : u < 0.3 ? 1.15 - 0.15 * sstep((u - 0.15) / 0.15) : 1;
  const al = 1 - sstep((u - 0.8) / 0.3);
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.moveTo(-4.6 * K, 3 * K);
  ctx.bezierCurveTo(-4.6 * K, -6.4 * K, 4.6 * K, -6.4 * K, 4.6 * K, 3 * K);
  ctx.quadraticCurveTo(5.4 * K, 4.4 * K, 4 * K, 4.4 * K);
  ctx.lineTo(-4 * K, 4.4 * K);
  ctx.quadraticCurveTo(-5.4 * K, 4.4 * K, -4.6 * K, 3 * K);
  ctx.closePath();
  ctx.fillStyle = '#fff6d8';
  ctx.fill();
  pen(ctx, GOLD.sh, 0.8 * K);
  ctx.stroke();
  cue(ctx, '!', 0, -0.4 * K, 7 * K, 1, 0, '#e2485e', '#fff6d8');
  ctx.restore();
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.rvQ;
  if (!q) return;
  const t = a.t ?? 0;
  const f = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -26]);
  const face = headAt(a, D, [6, 4]);
  const mouthP = headAt(a, D, [2, 13]);
  const bon = headAt(a, D, [-3, -26]);
  const BG = bellGeom(a, D);
  const mouthB = bellMouth(BG);
  const handF = ptOf(a, D, 'handF', D.J.handF);
  // (the watch up in her far hand: her far hand is behind her, so it's drawn in front of her here)
  if ((a.rvWatch ?? 0) > 0.5) {
    const ear = q.ear ?? 0;
    // (held out in front of her, below her eyes: never over them)
    const wx = mix(handF[0] + 3.4, handF[0] + 1.2, ear);
    const wy = handF[1] + 0.6;
    const hip = D.J.hip;
    const clip = ptOf(a, D, 'torso', [hip[0] + 7.4, hip[1] - 6]);
    // (its fine chain, sagging from her hip to her hand)
    pen(ctx, GOLD.sh, 0.32);
    ctx.beginPath();
    ctx.moveTo(clip[0], clip[1]);
    ctx.quadraticCurveTo(mix(clip[0], wx, 0.5) + 3.2, Math.max(clip[1], wy) + 3, wx, wy + 1.9);
    ctx.stroke();
    for (const mode of ['line', 'fill']) drawWatch(ctx, a, mode, wx, wy, 1.9, LWR, 1);
  }
  // (the bonnet's bells ringing: little arcs off them)
  if ((a.rvRing ?? 0) > 0.35) soundRings(ctx, bon[0], bon[1], f, -Math.PI / 2, t * 1.2, 2, 4, 14, (a.rvRing - 0.35) * 1.2, 1.1);
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  const say = (text, x, y, size = 7, tilt = -0.08) => cue(ctx, text, x, y, size * K, f, tilt, INKC, '#fffaf0');
  const bellAng = Math.atan2(mouthB[1] - BG.y, mouthB[0] - BG.x);
  switch (X.kind) {
    case 'bang':
      bangBell(ctx, crown[0] + 10 * K, crown[1] - 4 * K - u * 3 * K, u);
      break;
    case 'ringing':
      soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 4, 4, 34, 1, 1.0);
      if (X.big && u > 0.2) say('RIIIIING!', crown[0] + 20 * K, crown[1] - 10 * K + Math.sin(u * 30) * K, 10, -0.08 + Math.sin(u * 40) * 0.03);
      break;
    case 'clang':
      if (u > 0 && u < 1) {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 3, 6, 46, 1 - u, 1.2);
        say('CLANG!', mouthB[0] + 10 * K, mouthB[1] - 10 * K, 10);
      }
      break;
    case 'castMorning':
      if (u < 1.2) say('Good morning~', crown[0] + 22 * K, crown[1] - 6 * K, 7);
      else {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 4, 4, 30, 1, 1.0);
        say('GOOD. MORNING!', crown[0] + 24 * K, crown[1] - 8 * K + Math.sin(u * 30) * 0.6 * K, 9);
      }
      break;
    case 'castBell':
      soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u * 0.7, 2, 3, 12, 0.7, 0.9);
      if (u > 0.3) say('Morning bell!', crown[0] + 22 * K, crown[1] - 6 * K, 7);
      break;
    case 'relBell':
      if (u < 0.6) {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 3, 6, 40, 1 - u / 0.6, 1.2);
        say('DONG!', mouthB[0] + 10 * K, mouthB[1] - 12 * K, 10);
      }
      break;
    case 'castRing': {
      const n = Math.min(3, Math.floor(u / 0.9) + 1);
      soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 3, 4, 26, 1, 1.0);
      say(['ring...', 'ring...', 'RING!'][n - 1], crown[0] + 20 * K, crown[1] - 6 * K, n === 3 ? 9 : 7);
      break;
    }
    case 'castSnooze':
      if (u > 0.3) say(X.cp === 'again' ? (u > 1.4 ? 'No, THAT one!' : 'Snooze?') : 'Press it. I dare you.', crown[0] + 24 * K, crown[1] - 6 * K, 7);
      break;
    case 'relSnooze':
      if (u < 0.9) {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 4, 6, 44, 1, 1.2);
        say('RIIIING!', crown[0] + 20 * K, crown[1] - 8 * K, 10);
      }
      break;
    case 'castRise':
      if (u > 0.4) {
        for (let i = 0; i < 5; i++) sparkle(ctx, crown[0] + Math.cos(t * 0.8 + i * 1.3) * 22 * K, crown[1] + 10 * K + Math.sin(t * 0.8 + i * 1.3) * 12 * K, 1.6 * K, 0.7, DAWN.gold);
        say('Rise and SHINE!', crown[0] + 24 * K, crown[1] - 8 * K, 9);
      }
      break;
    case 'castDoodle':
      if (X.crow > 0.2) {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 3, 4, 30, X.crow, 0.6);
        say('COCK-A-DOODLE-DOO!', crown[0] + 28 * K, crown[1] - 8 * K + Math.sin(u * 30) * 0.5 * K, 9);
      } else if (u > 0.2) say('Ahem.', crown[0] + 16 * K, crown[1] - 4 * K, 6);
      break;
    case 'castMinutes':
      if (u < 0.8) say('Five more minutes?', crown[0] + 24 * K, crown[1] - 6 * K, 7);
      else {
        say('NO.', crown[0] + 16 * K, crown[1] - 6 * K, 9);
        const v = (u * 1.25) % 1;
        tinyClock(ctx, mouthB[0] + v * 26 * K, mouthB[1] - Math.sin(v * Math.PI) * 16 * K + v * 8 * K, 2.6 * K, v * 6, 1 - sstep((v - 0.8) / 0.2));
      }
      break;
    case 'castLight':
      for (let i = 0; i < 3; i++) sparkle(ctx, mouthB[0] + Math.sin(t * 2 + i * 2) * 4 * K, mouthB[1] - 10 * K - ((t * 0.6 + i / 3) % 1) * 14 * K, 1.4 * K, 0.8, DAWN.gold);
      if (u > 0.3) say('First light! Everyone in it!', crown[0] + 28 * K, crown[1] - 6 * K, 7);
      break;
    case 'phaseNo':
      if (u > 0.3 && u < 2.3) say('Five more minutes?! NO!', crown[0] + 28 * K, crown[1] - 8 * K, 8);
      soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 3, 4, 24, 1, 1.0);
      break;
    case 'phaseRing':
      if (u > 0.2 && u < 2.3) say('RIIIIIIIIING!!', crown[0] + 24 * K, crown[1] - 10 * K + Math.sin(u * 34) * 0.8 * K, 11, -0.08 + Math.sin(u * 40) * 0.04);
      soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 4, 4, 40, 1, 1.3);
      break;
    case 'bonk':
      if (u > -0.02 && u < 0.5) {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 2, 4, 20, 1 - u / 0.5, 1.0);
        if (u < 0.35) say('ding!', mouthB[0] + 6 * K, mouthB[1] - 10 * K, 7);
      }
      break;
    case 'peal':
      if (u > -0.02 && u < 0.6) {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 3, 4, 30, 1 - u / 0.6, 0.9);
        if (u < 0.45) say('RING!', mouthB[0] + 8 * K, mouthB[1] - 10 * K, 8);
      }
      break;
    case 'shoo':
      if (u > -0.02 && u < 0.6) {
        if (u < 0.45) say('Up!', handF[0] + 10 * K, handF[1] - 8 * K, 9, -0.1);
        for (let i = 0; i < 3; i++) {
          const v = clamp(u / 0.5, 0, 1);
          ell(ctx, (6 + i * 5 + v * 8) * K, (-1 - v * 3 - i) * K, (1.8 + v * 2) * K, (1.2 + v) * K);
          ctx.fillStyle = `rgba(255,246,230,${0.7 * (1 - v)})`;
          ctx.fill();
        }
      }
      break;
    case 'ready':
      sparkle(ctx, mouthB[0], mouthB[1], (1.2 + Math.sin(t * 9) * 0.4) * K, 0.6 * (X.k ?? 1), DAWN.gold);
      break;
    case 'hurt': {
      // a "ting" knocked off her bonnet's bells, a sparkle
      const v = clamp(u / 0.5, 0, 1);
      say('ting!', bon[0] - 8 * K - v * 4 * K, bon[1] - 4 * K - v * 6 * K, 6, 0.1);
      sparkle(ctx, bon[0] - 4 * K, bon[1] - 2 * K, 2 * K * (1 - v), 1 - v, GOLD.lt);
      break;
    }
    case 'gloat':
      say("Up and at 'em!", face[0] + 22 * K + u * 4, face[1] - 22 * K - u * 6, 7);
      sparkle(ctx, mouthB[0], mouthB[1] - 4 * K, 1.8 * K * win(u, 0, 0.1, 0.5, 0.8), 1, GOLD.lt);
      break;
    case 'idlewatch':
      if (X.up > 0.5 && u < 2.8) say(Math.floor(u * 2) % 2 ? 'tock...' : 'tick...', face[0] + 18 * K, face[1] - 18 * K, 5, 0.05);
      if (X.ear > 0.5) say('tick. tick.', face[0] + 18 * K, face[1] - 20 * K, 5, 0.08);
      if (u > 5.4 && u < 7) say('Six fifty-nine.', face[0] + 22 * K, face[1] - 20 * K, 6);
      break;
    case 'idlepolish':
      if (X.rub > 0.5) for (let i = 0; i < 2; i++) sparkle(ctx, mouthB[0] + Math.sin(t * 3 + i * 3) * 3 * K, mouthB[1] - 6 * K, 1.4 * K * Math.abs(Math.sin(t * 4 + i)), 0.8, GOLD.lt);
      if (X.ding > 0.3) {
        soundRings(ctx, mouthB[0], mouthB[1], f, bellAng, u, 2, 3, 14, X.ding, 0.8);
        say('ding~', mouthB[0] + 8 * K, mouthB[1] - 10 * K, 6);
      }
      if (u > 4.6 && u < 5.4) say('ting', bon[0] - 6 * K, bon[1] - 6 * K, 5, 0.1);
      break;
    case 'idlecrow':
      if (X.toes > 0.5) say('Hmph!', face[0] + 18 * K, face[1] - 20 * K, 7);
      break;
    case 'idletap':
      if (X.tap > 0.85) say('tap', 8 * K, -4 * K, 5, 0.1);
      if (u > 2.2 && u < 3.8) say('Late.', face[0] + 16 * K, face[1] - 20 * K, 6);
      if (u > 4.8 && u < 6.6) say('LATE.', face[0] + 18 * K, face[1] - 20 * K, 8);
      break;
    case 'nap':
      cue(ctx, 'z', crown[0] + 12 * K + Math.sin(t) * 2 * K, crown[1] - ((t * 0.5) % 1) * 6 * K, 6 * K, f, 0.1, SLEEP.deep, '#fffaf0');
      if (u > 2.4) cue(ctx, 'zz', crown[0] + 16 * K, crown[1] - 6 * K - ((t * 0.4) % 1) * 5 * K, 7 * K, f, 0.1, SLEEP.deep, '#fffaf0');
      break;
    case 'jolt':
      bangBell(ctx, crown[0] + 10 * K, crown[1] - 2 * K, u - 4.9);
      say("I'm UP!", face[0] + 20 * K, face[1] - 22 * K, 7);
      break;
    case 'beaten':
      if (u < 1.3) dizzy(ctx, crown[0], crown[1] + 8 * K, 10 * K, t, 3);
      else {
        cue(ctx, 'zz', face[0] + 14 * K + Math.sin(t) * 2 * K, face[1] - 18 * K - ((t * 0.6) % 1) * 4 * K, 7 * K, f, 0.1, SLEEP.deep, '#fffaf0');
        if (u < 4) say('...five more min...', face[0] + 22 * K, face[1] - 26 * K, 5);
      }
      break;
    default:
      break;
  }
}

// ---------- Her clothes (the rig's hooks) ----------
const DRESS = {
  id: 'reveille',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  // (behind everything of hers: her long hair and the bonnet's ribbons; her rooster bustle)
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    const q = a.rvQ ?? {};
    for (const mode of ['line', 'fill']) {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', q, a.rvF, a.rvHair ?? {}, LWK / HS);
      ctx.restore();
      bustle(ctx, a, mode, D, LWR);
    }
  },
  under: {
    handNskin: (ctx, a, mode, S, D) => handbell(ctx, a, mode, D, LWR),
  },
  over: {
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F', LWR),
    legF: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'F', LWR),
    footFskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'F', LWR),
    legN: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'N', LWR),
    footNskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'N', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      waistcoat(ctx, a, mode, D, LWR);
      skirt(ctx, a, mode, D, LWR);
      watchHang(ctx, a, mode, D, LWR);
    },
    neckSkin: (ctx, a, mode, S, D) => collar(ctx, a, mode, D, LWR),
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.rvQ ?? {}, a.rvF, a.rvHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N', LWR),
  },
  pose,
  fx,
};
const R = dressRig('reveille', DRESS);
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
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over her head her
// own).
export const REVEILLE_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 340, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const REVEILLE_SIZE = { w: 60, h: Math.round(R.H * BIG), speed: Math.round(R.speed * BIG) };
// (for her cast looks: the handbell and the little alarm clocks drawn the same way)
export { drawHandbell, tinyClock, PLUME, CREAM, SNOOZE };
