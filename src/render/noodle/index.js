// The Cup-Noodle Dragon on screen (remade 2026-11-27 from scratch, his idea kept: the Queen's 2 a.m. dinner,
// every single night, a cheeky little noodle dragon; the boss of the Convenience Store, 2 a.m.; world/theatre.js
// his new fight). He rises out of his own big cup of noodles from the waist, his noodle tail looping out over
// its back rim; greedy, cheeky, always hungry, and proud of being somebody's favourite dinner. He moves on his
// own copy of the blank bases' serpent (rig.js; body.js `noodle`): the serpent's lower body hidden in his broth,
// its tail bones carrying his noodle tail; his head, hair, horns, happi coat, cup and chopsticks drawn here
// (head.js, dress.js), never the shared face or the hero's body or hair, nothing of another boss's.
//   look    cream skin, peachy cheeks; wavy wheat-gold noodle hair (an even blunt fringe of four sections in a
//           gentle U above his brows, a long wavy side lock each side outside his eyes, the rest to his shoulder
//           blades), two short kamaboko horns (white with a pink swirl), soft pale-gold fin ears; a ramen-shop
//           happi coat in indigo with a white collar band and white waves at its hem, wide square sleeves, a
//           cherry obi knotted at his side; his cup (white, a cherry band with gold lines and a kamaboko badge,
//           noodles looping over its rim, amber broth), its peeled foil lid standing up behind him; his red
//           lacquered chopsticks. Soft own-colour outlines; his face bare.
//   faces   (head.js) big round bowl eyes in broth amber with a kamaboko-swirl glint, the whole iris always
//           clear; round brows; a cheeky little fang. Moods: cheeky (rest), rest, hungry, grin, slurp, yum, smug,
//           focus, cross, shout, shock, pout, sad, fluster, hurt (> <), dizzy, sleepy, talk, happy, spicy.
//   idle    a 30 s act, only while calm: slurp (a noodle lifted from the cup on his chopsticks, dangling, then
//           SLUUURP, cheeks puffed, "yum"); too hot (he blows on his broth, steam blown away, tastes it, "hot
//           hot!", fanning his tongue); drum (his chopsticks drummed on the cup's rim, impatient, humming);
//           bath (he sinks into his broth to the chest, eyes shut, steam rising: "ahh", then pops back up).
//   walk    he slides his cup along, his noodle tail rippling behind it, leaning in, chopsticks ahead.
//   fight   between casts, three swings at the tank in turn: Chopstick Jab (thrust out: poke!), Pinch (the
//           sticks opened wide over his head and snapped shut ahead: snap!), Noodle Lash (his tail whipped
//           round: whap). His casts (m.castPose, world/theatre.js): pinch (Chopstick Pinch: the sticks raised
//           high, opening wider and wider), slurp (SLUUURP: puckered, leaning back, everything pulled in; then a
//           burp of steam), toss (Noodle Toss: noodles flicked from the cup at each of you), soup (Soup's On:
//           both arms up, the broth leaping up out of the cup), packet (Flavour Packet: a packet held up and
//           torn open with his teeth), drop (Chopstick Drop: his chopsticks thrown up high, then a pinch of the
//           air), flip (Lid Flip: the foil lid hauled up behind his head, then swung forward), bowl (Bottomless
//           Bowl: both arms swirling the broth round and round). Phase moments (m.phaseAt): Three Minutes (a
//           little kitchen timer wound and held up), Extra Spicy (a chili packet shaken over himself: steam
//           out of his fins).
//   scenes  his entrance (theatre_noodledragon): 'hidden' (crouched down in his cup, the lid on his head, his
//           eyes peeking out), 'peel' (the lid pushed up off his head and flipped back, a burst of steam, a
//           big stretch), 'slurp' (a huge slurp), 'attack' (his chopsticks snapped: SNAP).
//   marks   all his own (`ownEmotes`): "itadakimasu~" and a sparkle after landing a hit, a noodle knocked loose
//           when hurt, sweat when low, and beaten: sunk down in his cup to the chin, dizzy, the lid flopped down
//           over the rim, steam drifting.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring, dizzy, steam, note } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { cupBack, cupFront, noodleTail, lid, happi, obiKnot, sleeve, chopsticks, sticksGeom, drawSticks, CS, cupGeom, ptAt, enter, ptOf } from './dress.js';
import { SKIN, SKIN_INK, NOOD, BROTH, CHILI, FOIL, CUP } from './palette.js';

const BIG = 1.75;
const LWR = 2 / BIG;
let LWK = 2;
const HS = 0.96;
const HO = [1.0, -12.6];
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

const SWINGS = ['jab', 'pinch', 'lash'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.ndN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'slurp', t0: 0.4, len: 6.6 },
  { name: 'hot', t0: 7.6, len: 6.4 },
  { name: 'drum', t0: 14.4, len: 7.2 },
  { name: 'bath', t0: 22.2, len: 6.6 },
];
const CYCLE = 30;
// (at rest: his chopsticks held up ready in his near hand, pointing ahead; his far hand on the cup's rim)
const REST = { shN: -24, elN: -48, hwN: 8, shF: 20, elF: -30, hwF: 10 };
const STICK_REST = -0.55;

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'cheeky', look: [0.35, 0], turn: 0.35, fx: null, sweat: 0, tears: false, stick: STICK_REST, open: 0, noSticks: false, flip: 0, spill: 0, lidHat: 0, steam: 0, fin: 0 };
  a.ndQ = q;
  a.ndUid = (m.uid ?? 0) % 7;
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
  const low = m.hp > 0 && frac < 0.25;
  const act = m.cine?.act;
  const actU = act ? now - act.at : -1;
  const actDur = act?.dur ?? 1;
  const since = now - (m.attackAt ?? -9);
  const cast = m.cast;
  const castU = cast ? now - cast.t0 : -1;
  const castK = cast ? clamp(castU / Math.max(0.2, cast.dur), 0, 1) : 0;
  const cp = m.castPose ?? null;
  const phase = m.mech?.phase ?? 1;
  if (cp) st.ndLastPose = cp;
  const relU = !cast && st.ndLastPose && since >= 0 && since < 1.1 ? since : -1;
  const relPose = relU >= 0 ? st.ndLastPose : null;
  if (!cast && since >= 1.1) st.ndLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.ndAtk) {
    st.ndN = (st.ndN ?? (m.uid ?? 0)) + 1;
    st.ndPick = pickSwing(m, st);
  }
  st.ndAntic = swinging ? Math.max(anticK, st.ndAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.ndAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const gloatU = now - (m.gloatAt ?? -9);
  // (his scene acts: hidden in the cup stays until another act)
  const STICKY = { hidden: 1 };
  if (act && STICKY[act.move]) st.ndSticky = act.move;
  else if (act) st.ndSticky = null;
  if (!act) st.ndSticky = null;
  const live = act && actU >= 0 && actU < actDur + 0.4 ? act.move : null;
  const sceneAct = live ?? st.ndSticky ?? null;
  const sceneU = live ? actU : act ? now - (st.ndStickyAt ??= act.at) : 0;
  if (live) st.ndStickyAt = act.at;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2.4) || sceneAct;

  // At rest: up out of his cup, chopsticks ready, his far hand on the rim; bobbing in the broth, swaying.
  go({ tilt: Math.sin(t * 0.8) * 1.4, chest: breath * 0.8, head: 1 + Math.sin(t * 0.7 + 1) * 2, drop: 0.04 + Math.sin(t * 1.5) * 0.02, ...REST }, 1);
  q.look = [0.4 + Math.sin(t * 0.33) * 0.25, 0.05];
  if (walkW > 0.01) {
    go({ tilt: 5, head: -3, shN: -50, elN: -50, shF: 30, elF: -40 }, walkW);
    q.stick = mix(q.stick, -0.2, walkW);
    q.spill = 0.6 * walkW;
    q.look = [0.6, 0];
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say('smug');
  if (m.hp <= 0) {
    // beaten: sunk in his cup to the chin, dizzy, the lid flopped over the rim, steam drifting
    const u = now - (st.ndDeadAt ??= now);
    go({ drop: 0.55, tilt: 4, head: 12, shN: -10, elN: -40, shF: 10, elF: -20 });
    q.mood = 'dizzy';
    q.noSticks = true;
    q.flip = -0.4;
    q.fx = { kind: 'beaten', u };
  } else st.ndDeadAt = undefined;

  if (m.hp > 0) {
    if (sceneAct) sceneOf(sceneAct, sceneU, actDur, go, q, t, say);
    else if (cast) castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say);
    else if (relPose) releaseOf(relPose, relU, go, q, t, say);
    else if (phaseU >= 0 && phaseU < 2.4) phaseOf(phase, phaseU, go, q, t, say);
    else if (swinging) {
      const kind = st.ndPick ?? 'jab';
      const R = kind === 'pinch' ? 0.22 : 0.17;
      const hitK = struck ? (since < R ? sstep(since / R) : 1 - sstep((since - R - 0.15) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.ndAntic) * (since < R ? 1 : 0) : sstep(anticK);
      if (kind === 'jab') {
        go({ shN: 20, elN: -100, tilt: -5, turnC: -8 }, wK);
        go({ shN: -88, elN: -4, tilt: 7, x: 0.03, turnC: 6 }, hitK);
        q.stick = mix(q.stick, -0.4, wK) + (0.05 - q.stick) * hitK;
        say(hitK > 0.3 ? 'shout' : 'focus');
      } else if (kind === 'pinch') {
        go({ shN: -150, elN: -40, tilt: -6, head: -5 }, wK);
        go({ shN: -80, elN: -10, tilt: 8, head: 3, x: 0.02 }, hitK);
        q.stick = mix(q.stick, -1.7, wK) + (0.15 - q.stick) * hitK;
        q.open = wK * 1.4;
        say(hitK > 0.3 ? 'grin' : 'hungry');
      } else {
        // the noodle tail whipped round
        go({ tilt: -6, turnC: -10, tailW: -0.5, shN: -60, elN: -60 }, wK);
        go({ tilt: 7, turnC: 8, tailW: 0.9, x: 0.015, shN: -40, elN: -70 }, hitK);
        say(hitK > 0.3 ? 'grin' : 'smug');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = sstep(hurtU / 0.07) * (1 - sstep((hurtU - 0.08) / 0.42));
      go({ tilt: -8, head: -10, x: -0.02, shN: -50, elN: -90, drop: 0.12 }, k);
      say('hurt', k * 2);
      q.spill = 1.2 * k;
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.ndCalm = mix(st.ndCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.ndCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.ndCalm), t, now, st);
    if (mood && !cast && !relPose && !swinging && !live) {
      q.mood = { angry: 'cross', happy: 'hungry', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'rest', hurt: 'hurt', surprised: 'shock' }[mood] ?? q.mood;
      if (mood === 'angry') go({ shN: -70, elN: -50, head: -3, tilt: 3 }, 1);
    }
    if (!busy && !hurt && gloatU >= 0 && gloatU < 2) st.ndGlAt ??= now;
    else if (busy || hurt || gloatU < 0 || gloatU >= 2) st.ndGlAt = undefined;
    const glU = st.ndGlAt != null ? now - st.ndGlAt : -1;
    st.ndGlW = mix(st.ndGlW ?? 0, glU >= 0 && glU < 0.75 ? 1 : 0, 1 - Math.exp(-dt * 10));
    if (st.ndGlW > 0.01) {
      const k = st.ndGlW;
      go({ shN: -110, elN: -40, head: -4, tilt: -2 }, k);
      q.stick = mix(q.stick, -1.4, k);
      say('grin', k);
      if (glU >= 0) q.fx = { kind: 'gloat', u: glU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'fluster';
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  if (m.ndFace) q.mood = m.ndFace;
  q.turn = spring(st, 'ndTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.cheeky;
  const f = (st.ndF ??= { ...FACES.cheeky, shut: { happy: 0, calm: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.ndF = f;
  // Springs: the noodles over the rim, the foil lid, the obi's knot, the chopsticks, his hair and fins.
  const kick = ((st.ndLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.ndLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7);
  st.ndLast = out.head;
  st.ndLastT = out.tilt;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  a.ndCup = {
    spill: spring(st, 'spl', q.spill + Math.sin(t * 1.4) * 0.15 - lean * 0.8, 90, 9, dt, kick * 0.01),
    lid: clamp(spring(st, 'lid', Math.sin(t * 0.9) * 0.05 - lean * 0.5 - walkW * 0.15, 70, 9, dt, kick * 0.006), -0.35, 0.3),
    flip: spring(st, 'flp', q.flip, 60, 11, dt),
    knot: spring(st, 'knt', Math.sin(t * 1.3) * 0.08 - lean * 1.2 - walkW * 0.3, 110, 10, dt, kick * 0.01),
  };
  a.ndSticks = { rot: spring(st, 'srot', q.stick, 150, 17, dt), open: spring(st, 'sopn', q.open, 200, 18, dt) };
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0) + (out.chest ?? 0) * 0.5) * (Math.PI / 180);
  a.ndHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.6 + i * 1.9) * 0.025 + headLean * 0.1, 200 + i * 30, 15, dt, kick * 0.003 * (i % 2 ? 1 : -1))),
    slN: spring(st, 'sln', Math.sin(t * 1.2) * 0.07 - headLean * 0.3 + walkW * 0.12, 90, 9, dt, kick * 0.005),
    slF: spring(st, 'slf', Math.sin(t * 1.1 + 2) * 0.07 - headLean * 0.3 + walkW * 0.12, 86, 9, dt, kick * 0.005),
    back: spring(st, 'bk', Math.sin(t * 0.9) * 0.06 - walkW * 0.2 - lean * 0.4, 50, 8, dt, kick * 0.006),
    lean: spring(st, 'bkl', headLean, 70, 12, dt),
    fin: spring(st, 'fin', q.fin + Math.sin(t * 2.1) * 0.15, 130, 10, dt, kick * 0.01),
  };
}

// His scene acts.
function sceneOf(act, u, dur, go, q, t, say) {
  if (act === 'hidden') {
    // crouched down in his cup, the lid on his head, his eyes peeking out over the rim
    go({ drop: 0.95, head: 4, tilt: 0, shN: -20, elN: -110, shF: -10, elF: -100 }, 1);
    q.lidHat = 1;
    q.noSticks = true;
    q.look = [0.6 + Math.sin(u * 1.3) * 0.4, 0.1];
    say(Math.sin(u * 0.8) > 0.6 ? 'smug' : 'rest');
    q.fx = { kind: 'hidden', u };
  } else if (act === 'peel') {
    // the lid pushed up off his head and flipped back behind him, a burst of steam; a big stretch
    const up = sstep(u / 0.5);
    const stretch = win(u, 0.5, 0.9, dur - 0.4, dur);
    go({ drop: 0.95 * (1 - up), shN: -120 - 30 * stretch, elN: -60 + 20 * stretch, shF: -120 - 20 * stretch, elF: -60, head: -6 * stretch, tilt: -4 * stretch }, 1);
    q.lidHat = 1 - sstep(u / 0.35);
    q.noSticks = u < 0.5;
    say(u < 0.5 ? 'focus' : stretch > 0.5 ? 'yum' : 'grin');
    q.fx = { kind: 'peel', u };
  } else if (act === 'slurp') {
    const k = win(u, 0, 0.3, dur - 0.3, dur + 0.2);
    go({ shN: -60, elN: -110, hwN: -10, head: -6, tilt: -3 }, k);
    q.stick = -1.2;
    say(u < dur - 0.6 ? 'slurp' : 'yum', k);
    q.fx = { kind: 'slurpIdle', u, dur };
  } else if (act === 'attack' || act === 'windup') {
    const k = win(u, 0, 0.12, dur - 0.2, dur + 0.3);
    const sn = sstep((u - 0.2) / 0.18);
    go({ shN: -150 + sn * 70, elN: -40 + sn * 30, tilt: -6 + sn * 14, head: -5 + sn * 8, x: 0.02 * sn }, k);
    q.stick = -1.7 + sn * 1.85;
    q.open = (1 - sn) * 1.4;
    say(sn > 0.3 ? 'grin' : 'hungry', k);
    q.fx = { kind: 'snap', u };
  }
}

// His cast poses.
function castPoseOf(cp, u, castK, wind, go, q, t, say) {
  const k = sstep(u / 0.4);
  if (cp === 'pinch') {
    // Chopstick Pinch: the sticks raised high, opening wider and wider
    go({ shN: -145 - wind * 15, elN: -35, head: -4, tilt: -4 - wind * 4, shF: 10, elF: -40 }, k);
    q.stick = -1.65;
    q.open = 0.5 + castK * 1.1;
    say(wind > 0.3 ? 'grin' : 'hungry', k);
    q.look = [1, -0.2];
    q.fx = { kind: 'castPinch', u };
  } else if (cp === 'slurp' || cp === 'seconds') {
    // SLUUURP: puckered, leaning back, chopsticks to his lips, everything pulled in
    go({ shN: -70, elN: -120, hwN: -14, head: -8, tilt: -7, chest: -3, shF: 30, elF: -20 }, k);
    q.stick = -1.3;
    say('slurp', k);
    q.look = [1, 0];
    q.fx = { kind: 'castSlurp', u };
  } else if (cp === 'toss') {
    // Noodle Toss: noodles flicked out of the cup with his sticks, at each of you in turn
    const flick = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.5)), 3);
    go({ shN: -20 - flick * 70, elN: -90 + flick * 60, tilt: 2 - flick * 4, head: 2 - flick * 4 }, k);
    q.stick = 0.6 - flick * 1.4;
    say('grin', k);
    q.fx = { kind: 'castToss', u };
  } else if (cp === 'soup') {
    // Soup's On: both arms up, the broth leaping up out of the cup
    go({ shN: -150, elN: -30, shF: -150, elF: -30, head: -8, tilt: -4, drop: -0.04 }, k);
    q.stick = -1.9;
    say(wind > 0.3 ? 'shout' : 'hungry', k);
    q.spill = 1;
    q.fx = { kind: 'castSoup', u };
  } else if (cp === 'packet') {
    // Flavour Packet: a packet held up in his far hand and torn open with his teeth
    const tear = win(castK, 0.55, 0.65, 0.9, 1);
    go({ shF: -110, elF: -80, hwF: -10, head: -3 + tear * 6, tilt: -2, shN: -40, elN: -70 }, k);
    say(tear > 0.4 ? 'grin' : 'focus', k);
    q.fx = { kind: 'castPacket', u, tear };
  } else if (cp === 'drop') {
    // Chopstick Drop: his chopsticks thrown up high; then a pinch of the empty air
    const thrown = castK > 0.18;
    go({ shN: thrown ? -130 : -150, elN: thrown ? -10 : -40, head: -10, tilt: -4 }, k);
    q.noSticks = thrown;
    q.look = [0.3, -1];
    say(thrown ? 'smug' : 'focus', k);
    q.fx = { kind: 'castDrop', u, castK };
  } else if (cp === 'flip') {
    // Lid Flip: the lid hauled up behind his head with his far hand, then swung forward (its look slaps down ahead)
    go({ shF: -170, elF: -40, tilt: -6, head: -4, turnC: -8 }, k * (1 - wind));
    go({ shF: -60, elF: -10, tilt: 8, head: 3, turnC: 8, x: 0.02 }, wind);
    q.flip = 0.35 + wind * 0.65;
    say(wind > 0.3 ? 'shout' : 'smug', k);
    q.fx = { kind: 'castFlip', u };
  } else if (cp === 'bowl') {
    // Bottomless Bowl: both arms swirling the broth round and round
    const an = u * 6;
    go({ shN: -60 + Math.sin(an) * 30, elN: -60 + Math.cos(an) * 20, shF: -50 + Math.cos(an) * 30, elF: -50, tilt: Math.sin(an) * 4, drop: 0.06 }, k);
    q.stick = -0.2 + Math.sin(an) * 0.4;
    q.spill = 0.8 + Math.sin(an) * 0.4;
    say('hungry', k);
    q.fx = { kind: 'castBowl', u, an };
  } else {
    go({ shN: -60, elN: -60 }, k);
    say('focus', k);
  }
}
function releaseOf(rp, u, go, q, t, say) {
  const k = 1 - sstep((u - 0.5) / 0.6);
  if (rp === 'pinch') {
    go({ shN: -75, elN: -8, tilt: 8, head: 3, x: 0.02 }, k);
    q.stick = 0.15;
    say('grin', k);
    q.fx = { kind: 'snap', u };
  } else if (rp === 'slurp' || rp === 'seconds') {
    // the burp of steam
    go({ head: -4, tilt: 4, chest: 4, shN: -40, elN: -60 }, k);
    say(u < 0.4 ? 'shock' : 'yum', k);
    q.fx = { kind: 'burp', u };
  } else if (rp === 'soup') {
    go({ shN: -110, elN: -20, shF: -110, elF: -20, head: -4 }, k);
    say('hungry', k);
  } else if (rp === 'flip') {
    go({ shF: -50, elF: -10, tilt: 6 }, k);
    q.flip = 1 - sstep((u - 0.4) / 0.6);
    say('grin', k);
  } else if (rp === 'drop') {
    go({ shN: -90, elN: -20, head: 2 }, k);
    say('smug', k);
    q.fx = { kind: 'catch', u };
  } else {
    go({ shN: -70, elN: -20, tilt: 4 }, k);
    say('grin', k);
  }
}
function phaseOf(phase, u, go, q, t, say) {
  const k = win(u, 0, 0.25, 2, 2.4);
  if (phase === 2) {
    // Three Minutes: a little kitchen timer wound and held up
    const wind = win(u, 0.3, 0.5, 1.2, 1.4);
    go({ shF: -120, elF: -70, hwF: wind * Math.sin(u * 30) * 10, head: -4, tilt: -2, shN: -40, elN: -70 }, k);
    say(u > 1.4 ? 'grin' : 'focus', k);
    q.fx = { kind: 'timer', u };
  } else {
    // Extra Spicy: a chili packet shaken over himself; steam out of his fins
    const shake = Math.sin(u * 26) * win(u, 0.3, 0.5, 1.1, 1.3);
    go({ shF: -150, elF: -40 + shake * 10, head: 4, tilt: 2, shN: -40, elN: -80 }, k);
    say(u > 1.2 ? 'spicy' : 'grin', k);
    q.fin = u > 1.2 ? 1 : 0;
    q.fx = { kind: 'spicy', u };
  }
}

function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % CYCLE;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.ndPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.ndPiece = cur.name;
      else return;
    }
  } else {
    st.ndPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'slurp') {
    // a noodle lifted from the cup on his sticks, dangling; SLUUURP; cheeks puffed; "yum"
    const k = win(u, 0, 0.5, 6, 6.6);
    const lift = win(u, 0.3, 1, 3.6, 4.2);
    go({ shN: -30 - 40 * lift, elN: -70 - 30 * lift, hwN: -10 * lift, head: 3 - 8 * lift, tilt: -2 * lift }, k * w);
    if (at(k)) {
      q.stick = -0.6 - 0.7 * lift;
      q.look = u < 2 ? [0.5, 0.6] : [0.4, 0];
      q.mood = u < 1.6 ? 'hungry' : u < 3.6 ? 'slurp' : u < 5.4 ? 'yum' : 'cheeky';
      q.fx = { kind: 'idleslurp', u };
    }
  } else if (cur.name === 'hot') {
    // he blows on his broth; tastes it; "hot hot!", fanning his tongue
    const k = win(u, 0, 0.5, 5.8, 6.4);
    const blow = win(u, 0.4, 0.8, 2.4, 2.8);
    const fan = win(u, 3.6, 3.8, 5.2, 5.6);
    go({ tilt: 6 * blow, head: 10 * blow - 4 * fan, chest: 3 * blow, shF: 20 - 120 * fan, elF: -30 - 60 * fan + Math.sin(u * 24) * 18 * fan }, k * w);
    if (at(k)) {
      q.look = blow > 0.3 ? [0.6, 1] : [0.5, 0];
      q.mood = u < 0.4 ? 'cheeky' : u < 2.8 ? 'pout' : u < 3.6 ? 'yum' : u < 5.4 ? 'spicy' : 'cheeky';
      q.fx = { kind: 'idlehot', u, blow };
    }
  } else if (cur.name === 'drum') {
    // his chopsticks drummed on the cup's rim, impatient, humming
    const k = win(u, 0, 0.5, 6.6, 7.2);
    const tap = Math.pow(Math.abs(Math.sin(u * Math.PI * 2.2)), 4);
    go({ shN: -10 + tap * 8, elN: -40 - tap * 14, hwN: 20, head: 2 + Math.sin(u * 2.2) * 4, tilt: Math.sin(u * 1.1) * 2 }, k * w);
    if (at(k)) {
      q.stick = 0.9 + tap * 0.25;
      q.look = [0.6 + Math.sin(u) * 0.3, 0.3];
      q.mood = u < 4.6 ? 'smug' : 'pout';
      q.fx = { kind: 'idledrum', u, tap };
    }
  } else {
    // he sinks into his broth to the chest, eyes shut, steam rising; "ahh"; then pops back up
    const k = win(u, 0, 0.6, 6, 6.6);
    const sink = win(u, 0.4, 1.4, 4.6, 5.2);
    go({ drop: 0.3 * sink, shN: -10, elN: -40, shF: 10, elF: -20, head: 4 * sink, tilt: -2 * sink }, k * w);
    if (at(k)) {
      q.mood = sink > 0.5 ? 'yum' : 'cheeky';
      q.fx = { kind: 'idlebath', u, sink };
    }
  }
}

// ---------- His effects ----------
function curlSteam(ctx, x, y, u, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al * Math.sin(Math.PI * u);
  pen(ctx, 'rgba(255,255,255,0.9)', s * 0.55);
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const v = i / 8;
    const px = x + Math.sin(v * 5 + u * 6) * s;
    const py = y - u * s * 7 - v * s * 3.4;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}
function noodleStrand(ctx, pts, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  pen(ctx, NOOD.ink, 2.2);
  ctx.stroke();
  pen(ctx, NOOD.base, 1.3);
  ctx.stroke();
  pen(ctx, NOOD.lt, 0.4);
  ctx.stroke();
  ctx.restore();
}
function flake(ctx, x, y, s, rot, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ell(ctx, 0, 0, s, s * 0.6);
  ctx.fillStyle = CHILI.base;
  ctx.fill();
  pen(ctx, CHILI.sh, 0.3);
  ctx.stroke();
  ctx.restore();
}
const INKC = '#7a3a2a';
function fx(ctx, m, a, S, matOf, D) {
  const q = a.ndQ;
  if (!q) return;
  const t = a.t ?? 0;
  const f = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -24]);
  const face = headAt(a, D, [6, 4]);
  const mouthP = headAt(a, D, [2.4, 12.4]);
  const C = cupGeom(D);
  const rimL = ptAt(a, D, 'lower', 'serp0', [C.cx - C.rw + 2, C.rimY]);
  const rimR = ptAt(a, D, 'lower', 'serp0', [C.cx + C.rw - 2, C.rimY]);
  const SG = sticksGeom(a, D);
  const stickTip = [SG.x + Math.cos(SG.rot) * CS.len * 0.68, SG.y + Math.sin(SG.rot) * CS.len * 0.68];
  const X = q.fx;
  // always: steam curling up off his broth
  if (m.hp > 0) for (let i = 0; i < 3; i++) curlSteam(ctx, mix(rimL[0], rimR[0], 0.2 + i * 0.3), mix(rimL[1], rimR[1], 0.5) - 2, ((t * 0.35 + i * 0.33 + hash(m.uid ?? 0)) % 1), 1.1, 0.5 + (q.steam ?? 0));
  // (the lid on his head, while he hides in the cup)
  if (q.lidHat > 0.01) {
    ctx.save();
    ctx.globalAlpha = q.lidHat;
    ctx.translate(crown[0], crown[1] + 9 - (1 - q.lidHat) * 8);
    ctx.rotate(-0.06 + Math.sin(t * 1.4) * 0.03);
    ell(ctx, 0, 0, 20, 4.2);
    ctx.fillStyle = FOIL.base;
    ctx.fill();
    pen(ctx, FOIL.ink, LWR);
    ctx.stroke();
    ell(ctx, -3, -1, 12, 2);
    ctx.fillStyle = FOIL.lt;
    ctx.fill();
    pen(ctx, FOIL.rim, 0.8);
    ell(ctx, 0, 0, 19, 3.6);
    ctx.stroke();
    ctx.restore();
  }
  if (!X) return;
  const u = X.u;
  const say = (text, x, y, size = 7, tilt = -0.08) => cue(ctx, text, x, y, size, f, tilt, INKC, '#fffaf0');
  switch (X.kind) {
    case 'hidden':
      if ((u % 4) > 2.4 && (u % 4) < 3.6) say('...', crown[0] + 14, crown[1] - 2, 8);
      break;
    case 'peel':
      if (u < 1.4) for (let i = 0; i < 6; i++) steam(ctx, crown[0] - 18 + i * 7, crown[1] + 6 - u * 24 - (i % 2) * 6, 3 + u * 5, 0.7 * (1 - u / 1.4));
      if (u > 0.6 && u < 2.2) say('*streeetch*', crown[0] + 18, crown[1] - 6, 7);
      break;
    case 'slurpIdle':
    case 'idleslurp': {
      // a noodle dangling from his sticks to the broth, then zipping up into his mouth
      const zip = X.kind === 'idleslurp' ? sstep((u - 2.2) / 1.2) : sstep((u - 0.3) / (X.dur - 0.6));
      const top = zip > 0 ? [mix(stickTip[0], mouthP[0], zip), mix(stickTip[1], mouthP[1], zip)] : stickTip;
      const bot = [mix(rimR[0] - 4, mouthP[0], zip), mix(rimR[1], mouthP[1], zip)];
      if (zip < 0.98 && (X.kind !== 'idleslurp' || u > 0.6)) {
        const pts = [];
        for (let i = 0; i <= 8; i++) {
          const v = i / 8;
          pts.push([mix(top[0], bot[0], v) + Math.sin(v * 9 + t * 8) * 1.4 * (1 - zip), mix(top[1], bot[1], v) + Math.sin(v * Math.PI) * 6 * (1 - zip)]);
        }
        noodleStrand(ctx, pts);
      }
      if (zip > 0.05 && zip < 0.98) say('SLUUURP', face[0] + 18, face[1] - 18, 8, -0.1);
      if (X.kind === 'idleslurp' && u > 3.8 && u < 5.2) say('yum~', face[0] + 14, face[1] - 18, 7);
      break;
    }
    case 'idlehot':
      if (X.blow > 0.2) for (let i = 0; i < 3; i++) {
        const v = (u * 1.2 + i / 3) % 1;
        steam(ctx, mouthP[0] + 6 + v * 20, mouthP[1] + 8 + v * 4, 2 + v * 3, 0.6 * (1 - v));
      }
      if (X.blow > 0.3) say('fuu~ fuu~', face[0] + 18, face[1] - 18, 7);
      if (u > 3.4 && u < 5.4) say('HOT HOT!', face[0] + 18, face[1] - 20, 8, -0.12);
      break;
    case 'idledrum':
      if (X.tap > 0.8) say('tok', stickTip[0] + 4, stickTip[1] - 4, 5, 0.1);
      if (u > 1 && u < 4.4) note(ctx, crown[0] + 14 + Math.sin(u * 2) * 4, crown[1] - 4 - ((u * 0.8) % 1) * 8, 1.6, 0.2, 0.8);
      if (u > 4.8 && u < 6.6) say('...three minutes yet?', face[0] + 22, face[1] - 20, 7);
      break;
    case 'idlebath':
      if (X.sink > 0.2) for (let i = 0; i < 4; i++) curlSteam(ctx, mix(rimL[0], rimR[0], 0.1 + i * 0.27), rimL[1] - 4, ((t * 0.5 + i / 4) % 1), 1.6, 0.6 * X.sink);
      if (X.sink > 0.6) say('ahh~', face[0] + 14, face[1] - 18, 7);
      break;
    case 'castPinch':
      if (u > 0.3) say(u < 1.5 ? 'Itada...' : '...kimasu!', crown[0] + 18, crown[1] - 4, 8);
      break;
    case 'snap':
      if (u < 0.5) {
        const k = u / 0.5;
        say('SNAP!', stickTip[0] + 6, stickTip[1] - 10, 9, -0.1);
        for (let i = 0; i < 4; i++) sparkle(ctx, stickTip[0] + Math.cos(i * 1.6) * k * 12, stickTip[1] + Math.sin(i * 1.6) * k * 8, 2 * (1 - k * 0.5), 1 - k);
      }
      break;
    case 'castSlurp': {
      // streaks of air pulled in toward his mouth
      for (let i = 0; i < 5; i++) {
        const v = (u * 1.6 + i / 5) % 1;
        const ox = mouthP[0] + 50 * (1 - v);
        const oy = mouthP[1] - 10 + (i - 2) * 6 * (1 - v);
        pen(ctx, `rgba(255,255,255,${0.7 * v})`, 1);
        ctx.beginPath();
        ctx.moveTo(ox, oy);
        ctx.lineTo(ox - 8, oy + (mouthP[1] - oy) * 0.1);
        ctx.stroke();
      }
      say('SLUUUUURP', crown[0] + 22, crown[1] - 6, 8, -0.08 + Math.sin(u * 20) * 0.02);
      break;
    }
    case 'burp':
      if (u < 0.9) {
        for (let i = 0; i < 6; i++) steam(ctx, mouthP[0] + Math.cos(i) * u * 30, mouthP[1] - 6 + Math.sin(i) * u * 18, 3 + u * 6, 0.8 * (1 - u / 0.9));
        say('*BURP*', face[0] + 18, face[1] - 22, 9, -0.1);
      }
      break;
    case 'castToss': {
      const v = (u * 1.5) % 1;
      const p0 = stickTip;
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const w0 = i / 6;
        pts.push([p0[0] + v * 40 + w0 * 8, p0[1] - Math.sin(v * Math.PI) * 24 + w0 * 4 + Math.sin(w0 * 8 + t * 10) * 1.2]);
      }
      noodleStrand(ctx, pts, 1 - v);
      if (u > 0.3) say('Have some!', crown[0] + 18, crown[1] - 4, 7);
      break;
    }
    case 'castSoup': {
      // the broth leaping up out of the cup in a soft fountain
      const h = sstep(u / 1.2) * 34;
      for (let i = 0; i < 6; i++) {
        const v = (t * 1.3 + i / 6) % 1;
        const px = mix(rimL[0], rimR[0], 0.2 + (i % 3) * 0.3) + Math.sin(i + t * 4) * 2;
        const py = rimL[1] - v * h;
        ell(ctx, px, py, 1.8, 2.2);
        ctx.fillStyle = BROTH.base;
        ctx.fill();
        pen(ctx, BROTH.ink, 0.4);
        ctx.stroke();
      }
      if (u > 0.3) say("Soup's ON!", crown[0] + 18, crown[1] - 6, 8);
      break;
    }
    case 'castPacket': {
      const hand = ptOf(a, D, 'handF', D.J.handF);
      ctx.save();
      ctx.translate(hand[0], hand[1] - 5);
      ctx.rotate(0.2);
      ctx.beginPath();
      ctx.roundRect(-3.4, -5, 6.8, 9, 0.8);
      ctx.fillStyle = CHILI.base;
      ctx.fill();
      pen(ctx, CHILI.sh, 0.5);
      ctx.stroke();
      ctx.fillStyle = '#ffe08a';
      ctx.fillRect(-2.4, -1.4, 4.8, 2.4);
      ctx.restore();
      if (X.tear > 0.3) for (let i = 0; i < 5; i++) flake(ctx, hand[0] + 2 + i * 2, hand[1] - 10 - X.tear * 6 - i, 0.8, i, X.tear);
      if (u > 0.3) say(X.tear > 0.3 ? '*rrrip*' : 'Flavour packet!', crown[0] + 18, crown[1] - 4, 7);
      break;
    }
    case 'castDrop':
      if (X.castK > 0.18) {
        // his chopsticks spinning up high overhead
        const v = sstep((X.castK - 0.18) / 0.3);
        drawSticks(ctx, a, 'fill', crown[0] + 6, crown[1] - 10 - v * 40, u * 9, 0.3, LWR);
      }
      if (u > 0.4) say('Heads up!', crown[0] + 18, crown[1] - 4, 7);
      break;
    case 'catch':
      if (u < 0.6) sparkle(ctx, stickTip[0], stickTip[1], 2.4 * (1 - u / 0.6), 1);
      break;
    case 'castFlip':
      if (u > 0.3) say('Lid FLIP!', crown[0] + 18, crown[1] - 4, 8);
      break;
    case 'castBowl': {
      // a whirlpool in his broth
      const cxm = (rimL[0] + rimR[0]) / 2;
      pen(ctx, 'rgba(255,230,180,0.8)', 1);
      ctx.beginPath();
      for (let i = 0; i <= 20; i++) {
        const an = X.an * 1.5 + (i / 20) * TAU * 1.4;
        const r = 2 + (i / 20) * 9;
        const px = cxm + Math.cos(an) * r;
        const py = rimL[1] + 0.6 + Math.sin(an) * r * 0.24;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.stroke();
      if (u > 0.3) say('Bottomless bowl!', crown[0] + 22, crown[1] - 6, 7);
      break;
    }
    case 'timer': {
      const hand = ptOf(a, D, 'handF', D.J.handF);
      ell(ctx, hand[0], hand[1] - 6, 4.6, 4.2);
      ctx.fillStyle = CUP.red;
      ctx.fill();
      pen(ctx, CUP.redInk, 0.6);
      ctx.stroke();
      ell(ctx, hand[0], hand[1] - 6, 3, 2.8);
      ctx.fillStyle = '#fffaf2';
      ctx.fill();
      pen(ctx, CUP.redInk, 0.5);
      ctx.beginPath();
      ctx.moveTo(hand[0], hand[1] - 6);
      ctx.lineTo(hand[0] + Math.sin(u * 3) * 2.2, hand[1] - 6 - Math.cos(u * 3) * 2.2);
      ctx.stroke();
      if (u > 0.6 && u < 2.4) say('Three minutes!', crown[0] + 20, crown[1] - 6, 8);
      if (u > 0.4 && u < 1.4) say('tick tick', hand[0] + 10, hand[1] - 14, 5);
      break;
    }
    case 'spicy':
      if (u < 1.3) for (let i = 0; i < 6; i++) flake(ctx, crown[0] - 6 + i * 3, crown[1] + 2 + ((u * 2 + i * 0.2) % 1) * 20, 0.9, i + u * 4, 1);
      if (u > 1.2) for (const s of [-1, 1]) for (let i = 0; i < 2; i++) steam(ctx, crown[0] + s * 14 + s * u * 6, crown[1] + 14 - (u - 1.2) * 20 - i * 6, 2.4 + (u - 1.2) * 3, 0.7 * (1 - (u - 1.2) / 1.2));
      if (u > 1.2 && u < 2.4) say('EXTRA SPICY!', crown[0] + 22, crown[1] - 8, 8);
      break;
    case 'jab':
      if (u > -0.02 && u < 0.4) say('poke!', stickTip[0] + 6, stickTip[1] - 8, 7);
      break;
    case 'pinch':
      if (u > -0.02 && u < 0.45) {
        const k = clamp(u / 0.4, 0, 1);
        say('snap!', stickTip[0] + 6, stickTip[1] - 10, 8);
        for (let i = 0; i < 3; i++) sparkle(ctx, stickTip[0] + Math.cos(i * 2) * k * 10, stickTip[1] + Math.sin(i * 2) * k * 6, 1.8 * (1 - k), 1 - k);
      }
      break;
    case 'lash':
      if (u > -0.02 && u < 0.5) {
        const k = clamp(u / 0.45, 0, 1);
        pen(ctx, `rgba(255,236,170,${0.8 * (1 - k)})`, 1.6);
        ctx.beginPath();
        ctx.arc(-6, -10, 30 + k * 10, 0.1, 1.2);
        ctx.stroke();
        if (u < 0.35) say('whap!', 20, -26, 7);
      }
      break;
    case 'ready':
      sparkle(ctx, stickTip[0], stickTip[1], 1.2 + Math.sin(t * 9) * 0.4, 0.6 * (X.k ?? 1));
      break;
    case 'hurt': {
      const v = clamp(u / 0.5, 0, 1);
      const p0 = [rimR[0] + v * 14, rimR[1] - Math.sin(v * Math.PI) * 14 + v * 6];
      noodleStrand(ctx, [p0, [p0[0] + 3, p0[1] + 2], [p0[0] + 5, p0[1] - 1]], 1 - v);
      break;
    }
    case 'gloat':
      say('itadakimasu~', face[0] + 20 + u * 4, face[1] - 18 - u * 8, 7);
      sparkle(ctx, stickTip[0], stickTip[1], 2, win(u, 0, 0.12, 0.6, 0.9));
      break;
    case 'beaten':
      if (u < 1.4) dizzy(ctx, crown[0], crown[1] + 6, 10, t, 3);
      else cue(ctx, '...full.', face[0] + 16, face[1] - 18, 7, f, 0.05, INKC, '#fffaf0');
      break;
    default:
      break;
  }
}

// ---------- His cup, coat and sticks (the rig's hooks) ----------
const DRESS = {
  id: 'noodle',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  // (the base's own serpent lower body and tail stay as joints: his cup and noodles are drawn over them)
  hide: ['lower', 'tailA', 'tailB', 'tailC'],
  // (behind everything of his: the foil lid, then the back of his hair, horns and fins)
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    const q = a.ndQ ?? {};
    for (const mode of ['line', 'fill']) {
      if (!(q.lidHat > 0.5)) lid(ctx, a, mode, D, LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', q, a.ndF, a.ndHair ?? {}, LWK / HS);
      ctx.restore();
    }
  },
  under: {
    torsoSkin: (ctx, a, mode, S, D) => {
      cupBack(ctx, a, mode, D, LWR);
      noodleTail(ctx, a, mode, D, LWR);
    },
    handNskin: (ctx, a, mode, S, D) => chopsticks(ctx, a, mode, D, LWR),
  },
  over: {
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      happi(ctx, a, mode, D, LWR);
      obiKnot(ctx, a, mode, D, LWR);
      cupFront(ctx, a, mode, D, LWR);
    },
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.ndQ ?? {}, a.ndF, a.ndHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N', LWR),
  },
  pose,
  fx,
};
const R = dressRig('noodle', DRESS);
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
export const NOODLE_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 180, 320, 220], draw: R.still, rig, noHop: true, ownEmotes: true };
export const NOODLE_SIZE = { w: 76, h: 118, speed: Math.round(R.speed * BIG) };
