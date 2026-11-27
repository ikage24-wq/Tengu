// Sol and Luna, the Eclipse Twins, on screen (2026-11-27, remade from scratch: the Star Observatory's Orrery
// keepers, their story kept, world/observatory.js their new fight). Astraea's two little helpers, who wind
// the brass planets and keep the sun and moon of glass turning; they have never once been apart. Sol, the
// elder, is the sun: a fox-eared girl, loud, cheeky and brave, who rushes in first. Luna, the younger, is the
// moon: a rabbit-eared girl, dreamy and soft-spoken, who pounds mochi for her sister with her little mallet
// and hides behind her when shy. Each walks on her own copy of the maiden base (rig.js; body.js `sunfox`,
// `moonbun`), her head, hair, ears, clothes and things drawn here (head.js, dress.js), never the shared face
// or the hero's body or hair, and never each other's face.
//   Sol     (look) sunset orange hair in a high ponytail with a sun-disc tie, fox ears, freckles, sunburst
//           eyes and a little fang; a gold ring of the sun at her back; a cropped coral jacket over a cream
//           top, a gold sash, a short pleated orange skirt, puffed sleeves and arm warmers, knee socks and
//           coral boots; a big fluffy fox's tail. (moods, head.js) grin (rest), still, cheer, smug, fierce,
//           shout, proud, pout, shock, sad, hurt, dizzy, talk, wink.
//   Luna    (look) silver-lilac hime hair, long rabbit ears, a gold crescent clip, a star mark, moonlit eyes, a
//           bunny's mouth; a night-blue hooded capelet with a crescent clasp, a moon-white dress with a
//           night-blue bow and a band of crescents at the hem, loose sleeves, white tights and blue shoes; a
//           puff of a tail; her mochi mallet. (moods) dreamy (rest), still, happy, sleepy, bliss, focus,
//           worried, pout, shock, sad, hurt, dizzy, talk, wink.
//   idle    a 30 s act each, only while calm, in pieces: Sol: stretches (arms up, a yawn, a bounce on her
//           toes), shadow-boxing (three quick jabs, a proud grin), polishing her sun ring (a breath on it,
//           a rub, it shines); Luna: pounding mochi (three pounds of the mallet, a pat of the dough), a doze
//           standing up (her head nodding, her ears drooping, a start awake), counting stars on her fingers.
//   walk    Sol a bouncy stride, Luna small light steps, her ears bobbing behind.
//   fight   between casts, their own swings at the tank in turn: Sol: Sun Punch, Fox Kick, Tail Swipe;
//           Luna: Mallet Bonk, Mallet Poke, Bunny Stomp. Their casts (m.castPose, world/observatory.js):
//           Sol: flare (a little sun gathered over her head and flung), sunbeam (palms thrust out, a beam
//           along the floor), sunspots (little suns tossed up from both hands); Luna: ripple (the mallet
//           raised high and pounded: rings of mochi), moonbeam (the mallet held up, moonlight pouring at head
//           height), mochi (a big round mochi held up to share); both: conjunction (a hand held out to her
//           sister: the eclipse), crossing (a dash past each other), diamond (arms wide, the diamond
//           ring). A phase change (m.phaseAt): Eclipse Season (a high five, a twirl); alone (her sister down:
//           her sister's keepsake held to her heart, teary, then set: "For you!").
//   scenes  their entrance (observatory_eclipse): 'wave' (Sol: a big wave hello; Luna: a shy little wave),
//           'eclipse' (back to back: Sol's sun ring blazing, Luna's mallet raised in front of it, a ring of
//           light round them both), 'spring' (they spring apart), 'attack' (ready).
//   marks   all their own (`ownEmotes`): Sol: a little sun after landing a hit, a flicker of her ring when
//           hurt; Luna: a little crescent and a heart; a sweat drop when low; beaten: sat down, dizzy.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring } from './fx.js';
import { drawSol, drawLuna, SOL_FACES, LUNA_FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { solHalo, solTail, solJacket, solSkirt, solSleeve, solSock, solBoot, lunaCape, lunaClasp, lunaDress, lunaSkirt, lunaSleeve, lunaTights, lunaShoe, lunaPuff, mallet, malletGeom, enter, ptOf, crescent, sunStar } from './dress.js';
import { SOL, LUNA, SUNLIGHT, MOONLIGHT } from './palette.js';

const BIG = 1.75;
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

// ---------- Each sister's own ----------
const SISTER = {
  sol: {
    rest: 'grin', faces: SOL_FACES, swings: ['sunpunch', 'foxkick', 'tailswipe'],
    pieces: [{ name: 'stretch', t0: 0.6, len: 6.4 }, { name: 'box', t0: 9, len: 6 }, { name: 'polish', t0: 18, len: 7 }],
    moodOf: { angry: 'fierce', happy: 'cheer', sad: 'sad', talk: 'talk', sleep: 'proud', blink: 'proud', hurt: 'hurt', surprised: 'shock' },
    rest0: { tilt: -1, chest: -1, head: -3, shN: -14, elN: -30, hwN: 0, shF: 10, elF: 20, hwF: -6 },
  },
  luna: {
    rest: 'dreamy', faces: LUNA_FACES, swings: ['bonk', 'poke', 'stomp'],
    pieces: [{ name: 'pound', t0: 1, len: 7 }, { name: 'doze', t0: 10.4, len: 7 }, { name: 'stars', t0: 20, len: 6.6 }],
    moodOf: { angry: 'pout', happy: 'happy', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'sleepy', hurt: 'hurt', surprised: 'shock' },
    rest0: { tilt: 1, chest: 0, head: 3, shN: -30, elN: -70, hwN: 20, shF: 6, elF: 30, hwF: -10 },
  },
};

function makePose(who) {
  const W = SISTER[who];
  const sol = who === 'sol';
  return function pose(m, a, out, c) {
    const st = c.st;
    const t = c.t;
    const now = a.now ?? t;
    const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
    const q = { mood: W.rest, look: [0.3, 0], turn: 0.35, fx: null, sweat: 0, tears: false, halo: 1, haloSpin: 0, ma: sol ? 0 : 0.5, noMallet: false, earUp: 0, tailUp: 0, flip: 0 };
    a.ecQ = q;
    a.ecUid = (m.uid ?? 0) % 7;
    const go = (p, k = 1) => {
      if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
    };
    const say = (mood, k = 1) => {
      if (k > 0.4) q.mood = mood;
    };
    const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
    const breath = Math.sin(t * (sol ? 1.7 : 1.2));
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
    if (cp) st.ecLastPose = cp;
    const relU = !cast && st.ecLastPose && since >= 0 && since < 1.2 ? since : -1;
    const relPose = relU >= 0 ? st.ecLastPose : null;
    if (!cast && since >= 1.2) st.ecLastPose = null;
    const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
    const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
    if (swinging && !st.ecAtk) {
      st.ecN = (st.ecN ?? (m.uid ?? 0)) + 1;
      st.ecPick = typeof m.move === 'string' && W.swings.includes(m.move) ? m.move : W.swings[st.ecN % W.swings.length];
    }
    st.ecAntic = swinging ? Math.max(anticK, st.ecAntic ?? 0) : 0;
    const struck = anticK <= 0 && since >= 0 && since < 0.85;
    st.ecAtk = swinging;
    const hurtU = a.hurtAgo ?? 9;
    const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
    const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
    const alone = Boolean(m.mech?.alone);
    const gloatU = now - (m.gloatAt ?? -9);
    const sceneAct = act && actU >= 0 && actU < actDur + 0.4 ? act.move : act?.move === 'eclipse' ? 'eclipse' : null;
    const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2.2) || sceneAct;

    // At rest: Sol on her toes, fists loose, chin up; Luna with her mallet held before her in both hands.
    go({ ...W.rest0, chest: W.rest0.chest + breath * 0.7, head: W.rest0.head + Math.sin(t * 0.6) * 1.3, tilt: W.rest0.tilt + Math.sin(t * 0.8) * 0.6 }, 1);
    if (sol) go({ lift: 0.012 * Math.abs(Math.sin(t * 2.2)) }, 1);
    else go({ shF: -40, elF: -60, hwF: 10 }, 1);
    q.look = [0.35 + Math.sin(t * 0.33 + (sol ? 0 : 2)) * 0.15, 0];
    if (walkW > 0.01) {
      if (sol) go({ tilt: 4, head: -3 }, walkW);
      else go({ tilt: 2, head: 1, shN: -30, elN: -70 }, walkW);
    }
    if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say(sol ? 'fierce' : 'focus');
    if (m.hp <= 0) {
      const u = now - (st.ecDeadAt ??= now);
      go({ drop: 0.86, tilt: 8, head: 16, chest: 4, shN: 30, elN: -20, hwN: 20, shF: 40, elF: -10, hwF: 20, fxN: 0.5, fxF: 0.2 });
      q.mood = 'dizzy';
      q.turn = 0.25;
      q.halo = 0.25;
      q.noMallet = true;
      q.earUp = -0.6;
      q.fx = { kind: 'beaten', u };
    } else st.ecDeadAt = undefined;

    if (m.hp > 0) {
      if (sceneAct === 'wave') {
        const k = win(actU, 0, 0.3, actDur - 0.3, actDur + 0.2);
        const wv = Math.sin(actU * (sol ? 11 : 7));
        if (sol) go({ shN: -165, elN: -20 + wv * 18, hwN: wv * 20, tilt: -4, head: -6 }, k);
        else go({ shN: -110, elN: -110 + wv * 10, hwN: 20 + wv * 15, tilt: 4, head: 8 }, k);
        say(sol ? 'cheer' : 'happy', k);
        q.earUp = sol ? 0.2 : 0.4 * k;
        q.fx = { kind: 'wave', u: actU };
      } else if (sceneAct === 'eclipse') {
        // back to back: Sol's sun ring blazing, Luna's mallet raised in front of it
        const k = sstep(Math.max(0, actU) / 0.6);
        if (sol) go({ shN: -150, elN: -40, shF: -150, elF: -40, tilt: -6, head: -8 }, k);
        else go({ shN: -165, elN: -30, shF: -120, elF: -60, tilt: -4, head: -6 }, k);
        q.halo = 1 + 0.4 * k;
        q.haloSpin = actU * 1.2;
        q.ma = sol ? 0 : mix(0.5, 0.1, k);
        // (Luna turns round, back to back with her sister: a clean mirror flip)
        q.flip = sol ? 0 : 1;
        say(sol ? 'smug' : 'bliss', k);
        q.fx = { kind: 'eclipse', u: actU };
      } else if (sceneAct === 'spring') {
        const u = actU;
        const up = Math.sin(Math.PI * clamp(u / 0.6, 0, 1));
        go({ lift: 0.25 * up, tilt: sol ? 10 : -8, shN: -120, elN: -40, shF: -60, elF: -30, fyN: -0.3 * up, fyF: -0.2 * up }, win(u, 0, 0.1, actDur - 0.2, actDur + 0.2));
        say(sol ? 'cheer' : 'happy');
        q.tailUp = 0.6 * up;
        q.fx = { kind: 'spring', u };
      } else if (sceneAct === 'attack' || sceneAct === 'windup') {
        const k = win(actU, 0, 0.2, actDur - 0.2, actDur + 0.3);
        if (sol) go({ shN: -80, elN: -110, shF: -60, elF: -110, tilt: 6, drop: 0.12, head: 2 }, k);
        else go({ shN: -150, elN: -30, shF: -140, elF: -40, tilt: -4, head: -2 }, k);
        if (!sol) q.ma = mix(0.5, -0.3, k);
        say(sol ? 'fierce' : 'focus', k);
        q.fx = { kind: 'ready', u: actU, k };
      } else if (cast) {
        castPose(sol, cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say);
      } else if (relPose) {
        releasePose(sol, relPose, relU, go, q, say);
      } else if (phaseU >= 0 && phaseU < 2.2) {
        const k = win(phaseU, 0, 0.25, 1.8, 2.2);
        if (alone) {
          // her sister's keepsake held to her heart, teary; then set: "For you!"
          go({ shN: -70, elN: -130, hwN: 30, shF: -60, elF: -120, head: 10, tilt: 3 }, k * (1 - sstep((phaseU - 1.2) / 0.3)));
          go({ shN: -150, elN: -30, tilt: -4, head: -6 }, k * sstep((phaseU - 1.2) / 0.3));
          say(phaseU < 1.2 ? 'sad' : sol ? 'fierce' : 'focus', k);
          q.tears = phaseU < 1.3;
          q.fx = { kind: 'alone', u: phaseU };
        } else {
          // Eclipse Season: a high five toward her sister, a twirl
          const five = win(phaseU, 0.1, 0.35, 0.8, 1.1);
          go({ shN: -150, elN: -20, tilt: -3, head: -5 }, five * k);
          if (phaseU > 1.1 && phaseU < 1.6) q.flip = 1;
          say(phaseU < 1.1 ? (sol ? 'cheer' : 'happy') : sol ? 'smug' : 'wink', k);
          q.fx = { kind: 'season', u: phaseU };
        }
      } else if (swinging) {
        swingPose(sol, st.ecPick, struck, since, anticK, st, go, q, say);
      } else if (hurt) {
        const k = 1 - sstep(hurtU / 0.5);
        go({ tilt: -8, head: -10, x: -0.02, shN: -80, elN: -120, shF: -20 }, k);
        q.earUp = -0.5 * k;
        q.halo = 1 - 0.4 * k;
        say('hurt', k * 2);
        if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
      }
      const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
      st.ecCalm = mix(st.ecCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
      if (st.ecCalm > 0.02 && !q.fx) idleAct(sol, W, m, go, q, sstep(st.ecCalm), t, now, st);
      if (mood && !cast && !relPose && !swinging && !sceneAct) {
        q.mood = W.moodOf[mood] ?? q.mood;
        if (mood === 'sad') {
          go({ head: 10, tilt: 3 }, 1);
          q.tears = true;
        }
      }
      if (!busy && !hurt && gloatU >= 0 && gloatU < 0.9) {
        const k = win(gloatU, 0, 0.12, 0.6, 0.9);
        if (sol) go({ shN: -150, elN: -20, head: -6 }, k);
        else go({ shF: -90, elF: -110, head: 6 }, k);
        say(sol ? 'smug' : 'happy', k);
        q.fx = { kind: 'gloat', u: gloatU };
      }
      if (low && !busy && !m.cine) {
        q.mood = sol ? 'pout' : 'worried';
        q.sweat = (t * 0.6) % 1;
      }
      if (m.talking) q.mood = 'talk';
    }
    const face = sol ? m.solFace : m.lunaFace;
    if (face) q.mood = face;
    q.turn = spring(st, 'ecTurn', q.turn, 220, 28, dt);
    q.ma = spring(st, 'ecMa', q.ma, 140, 20, dt);
    const F = W.faces[q.mood] ?? W.faces[W.rest];
    const f = (st.ecF ??= { ...W.faces[W.rest], shut: { happy: 0, calm: 0, squeeze: 0, dizzy: 0 } });
    let tgt = F;
    if (q.mood === 'talk') {
      const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
      tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
    }
    const kf = 1 - Math.exp(-dt * 14);
    for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' || key === 'wk' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
    for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
    a.ecF = f;
    st.ecOuter = { flip: q.flip };
    // Springs: the tail (Sol) or puff (Luna), the cape, the skirt, the ears, the hair.
    const kick = ((st.ecLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.ecLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7);
    st.ecLast = out.head;
    st.ecLastT = out.tilt;
    const flipKick = st.ecFlip0 != null && st.ecFlip0 !== q.flip ? 1 : 0;
    st.ecFlip0 = q.flip;
    const lean = (out.tilt ?? 0) * (Math.PI / 180);
    const headLean = ((out.head ?? 0) + (out.tilt ?? 0)) * (Math.PI / 180);
    if (sol) {
      const sw = Math.sin(t * 1.9);
      a.ecTail = [0, 1, 2, 3, 4].map((i) => spring(st, `tl${i}`, [0.25, 0.6, 0.62, 0.48, 0.3][i] - q.tailUp * 0.3 + Math.sin(t * 1.9 - i * 0.7) * 0.08 * (1 + walkW) + (i === 0 ? -lean * 0.5 : 0), 90 - i * 8, 7.5, dt, (kick * 0.006 + flipKick * 0.2) * (i + 1) * 0.3));
      void sw;
    } else {
      a.ecCape = [0, 1].map((i) => spring(st, `cp${i}`, Math.sin(t * 1.1 + i * 1.4) * 0.04 + walkW * 0.3 - lean * 0.5, 60 + i * 8, 6, dt, kick * 0.015 + flipKick * 0.4));
      a.ecPuff = spring(st, 'puff', walkW * Math.sin(t * 9) * 0.6, 120, 8, dt, kick * 0.01);
    }
    a.ecSkirt = spring(st, 'sk', -lean * 1.6 - walkW * 0.5 + Math.sin(t * 1.2) * 0.08, 90, 9, dt, kick * 0.01 + flipKick * 0.4);
    a.ecHair = {
      fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.7 + i * 1.9) * 0.02 + headLean * 0.1, 170 + i * 30, 14, dt, kick * 0.003 * (i % 2 ? 1 : -1) + flipKick * 0.05)),
      slN: spring(st, 'sln', Math.sin(t * 1.2) * 0.05 - headLean * 0.2 + walkW * 0.1, 90, 9, dt, kick * 0.005 + flipKick * 0.1),
      slF: spring(st, 'slf', Math.sin(t * 1.1 + 2) * 0.05 - headLean * 0.2 + walkW * 0.1, 86, 9, dt, kick * 0.005 + flipKick * 0.1),
      back: spring(st, 'bk', Math.sin(t * 0.9) * 0.06 - headLean * 0.45 - walkW * 0.3, 55, 6.5, dt, kick * 0.01 + flipKick * 0.3),
      earN: spring(st, 'en', -q.earUp * 0.4 - headLean * 0.2 + Math.sin(t * 1.3) * 0.03 + walkW * 0.05 * Math.sin(t * 8), 130, 9, dt, kick * 0.006 + flipKick * 0.1),
      earF: spring(st, 'ef', -q.earUp * 0.4 - headLean * 0.2 + Math.sin(t * 1.2 + 1) * 0.03, 126, 9, dt, kick * 0.006 + flipKick * 0.1),
      droopN: spring(st, 'dn', -q.earUp * 0.5 + walkW * 0.1, 100, 8, dt, kick * 0.004),
      droopF: spring(st, 'df', -q.earUp * 0.5 + walkW * 0.1, 96, 8, dt, kick * 0.004),
    };
  };
}

function castPose(sol, cp, u, castK, wind, go, q, t, say) {
  const k = sstep(u / 0.35);
  if (cp === 'flare') {
    // Solar Flare: a little sun gathered in her hands over her head
    go({ shN: -160 + 10 * wind, elN: -50, shF: -160, elF: -50, tilt: -6 - 4 * wind, head: -8 }, k);
    q.halo = 1.2 + 0.3 * wind;
    say(castK < 0.6 ? 'smug' : 'fierce', k);
    q.fx = { kind: 'castFlare', u, wind };
  } else if (cp === 'sunbeam') {
    // her half of Opposition: palms thrust out, the beam pouring along the floor
    go({ shN: -80, elN: -6, hwN: -50, shF: -76, elF: -10, hwF: -50, tilt: 6, drop: 0.1, head: 2 }, k);
    q.halo = 1.3;
    q.haloSpin = u * 2;
    say('shout', k);
    q.fx = { kind: 'castSunbeam', u };
  } else if (cp === 'sunspots') {
    const toss = Math.abs(Math.sin(u * 3.4));
    go({ shN: -120 - toss * 40, elN: -40, shF: -120 - (1 - toss) * 40, elF: -40, tilt: -3, head: -6 }, k);
    say('cheer', k);
    q.fx = { kind: 'castSunspots', u };
  } else if (cp === 'ripple') {
    // Moon Mallet: raised high overhead, pounded down three times (the cast's thirds)
    const beat = (castK * 3) % 1;
    const down = sstep((beat - 0.55) / 0.2) * (1 - sstep((beat - 0.85) / 0.15));
    go({ shN: -170 + down * 110, elN: -20 + down * 10, shF: -160 + down * 100, elF: -30, tilt: -6 + down * 14, head: -6 + down * 8 }, k);
    q.ma = mix(-0.6, 2.0, down);
    say(down > 0.5 ? 'focus' : 'happy', k);
    q.fx = { kind: 'castRipple', u, beat, down };
  } else if (cp === 'moonbeam') {
    // her half of Opposition: the mallet held up high, moonlight pouring at head height
    go({ shN: -165, elN: -15, shF: -150, elF: -40, tilt: -4, head: -8 }, k);
    q.ma = 0.1;
    say('bliss', k);
    q.fx = { kind: 'castMoonbeam', u };
  } else if (cp === 'mochi') {
    // Share the Mochi: a big round mochi held up on both hands
    go({ shN: -140, elN: -60, shF: -140, elF: -60, tilt: -3, head: -6 }, k);
    q.noMallet = true;
    say('happy', k);
    q.fx = { kind: 'castMochi', u };
  } else if (cp === 'conjunction') {
    // a hand held out to her sister: the eclipse
    go({ shN: -95, elN: -10, hwN: -10, shF: -60, elF: -40, tilt: 2, head: -2 }, k);
    q.halo = sol ? 1.3 : 1;
    say(sol ? 'smug' : 'bliss', k);
    q.fx = { kind: 'castConjunction', u };
  } else if (cp === 'crossing') {
    // a dash past each other: leaning hard, arms back
    go({ tilt: 16, head: -8, shN: 40, elN: -40, shF: 50, elF: -30, drop: 0.08 }, k);
    q.tailUp = 0.8;
    q.earUp = -0.4;
    say(sol ? 'shout' : 'focus', k);
    q.fx = { kind: 'castCrossing', u };
  } else if (cp === 'diamond') {
    // Diamond Ring: arms flung wide, her light blazing
    go({ shN: -130, elN: -10, shF: -130, elF: -10, tilt: -6, head: -10 }, k);
    q.halo = 1.4;
    q.haloSpin = u * 3;
    say(sol ? 'shout' : 'focus', k);
    q.fx = { kind: 'castDiamond', u };
  }
}
function releasePose(sol, rp, u, go, q, say) {
  const k = win(u, 0, 0.08, 0.7, 1.2);
  if (rp === 'flare') {
    go({ shN: -60, elN: -10, shF: -50, elF: -10, tilt: 10, head: 2 }, k);
    say('cheer', k);
  } else if (rp === 'ripple') {
    go({ shN: -60, elN: -10, tilt: 10, head: 6 }, k);
    q.ma = mix(2.0, 0.5, sstep(u / 1));
    say('happy', k);
  } else if (rp === 'mochi') {
    go({ shN: -40, elN: -110, shF: -40, elF: -110, head: 6 }, k);
    q.noMallet = u < 0.5;
    say('bliss', k);
  } else if (rp === 'crossing') {
    go({ tilt: -6, head: 4 }, k);
    say(sol ? 'smug' : 'happy', k);
  } else {
    go({ shN: -150, elN: -30, head: -4 }, k * 0.6);
    say(sol ? 'smug' : 'happy', k);
  }
  q.fx = { kind: `rel_${rp}`, u };
}
function swingPose(sol, kind, struck, since, anticK, st, go, q, say) {
  const R = kind === 'stomp' || kind === 'bonk' || kind === 'foxkick' ? 0.28 : 0.22;
  const hitK = struck ? (since < R ? sstep(since / R) : 1 - sstep((since - R - 0.15) / 0.5)) : 0;
  const wK = struck ? (1 - hitK) * sstep(st.ecAntic) * (since < R ? 1 : 0) : sstep(anticK);
  if (kind === 'sunpunch') {
    go({ shN: 20, elN: -120, tilt: -6, head: -4 }, wK);
    go({ shN: -88, elN: -4, hwN: -10, tilt: 9, x: 0.04 }, hitK);
    say(hitK > 0.3 ? 'shout' : 'fierce');
  } else if (kind === 'foxkick') {
    go({ fxN: -0.2, fyN: -0.25, tilt: -8, shN: -40, elN: -80, shF: -30, elF: -80 }, wK);
    go({ fxN: 0.55, fyN: -0.42, tilt: -11, x: 0.02, shN: 0, elN: -70, shF: -60, elF: -60 }, hitK);
    q.tailUp = hitK;
    say(hitK > 0.3 ? 'shout' : 'fierce');
  } else if (kind === 'tailswipe') {
    go({ tilt: -6, head: -4 }, wK);
    go({ tilt: 10, head: 4, x: 0.02 }, hitK);
    q.tailUp = -0.6 * wK + 1.2 * hitK;
    say(hitK > 0.3 ? 'smug' : 'fierce');
  } else if (kind === 'bonk') {
    go({ shN: -170, elN: -20, shF: -160, elF: -30, tilt: -6, head: -6 }, wK);
    go({ shN: -70, elN: -10, shF: -60, elF: -10, tilt: 10, x: 0.03 }, hitK);
    q.ma = 0.5 - 1.1 * wK + 1.5 * hitK;
    say(hitK > 0.3 ? 'focus' : 'happy');
  } else if (kind === 'poke') {
    go({ shN: -30, elN: -110, tilt: -4 }, wK);
    go({ shN: -90, elN: -5, hwN: -60, tilt: 8, x: 0.04 }, hitK);
    q.ma = 0.5 + 0.9 * Math.max(wK, hitK);
    say(hitK > 0.3 ? 'pout' : 'focus');
  } else {
    // the bunny stomp: a little hop, a stamp
    go({ lift: 0.06, fyN: -0.3, fyF: -0.2, tilt: -4, shN: -120, elN: -40 }, wK);
    go({ lift: 0, tilt: 6, drop: 0.08, x: 0.02 }, hitK);
    q.earUp = 0.5 * wK - 0.4 * hitK;
    say(hitK > 0.3 ? 'pout' : 'focus');
  }
  q.fx = { kind: struck ? kind : 'readySwing', u: struck ? since : 0, k: wK };
}

function idleAct(sol, W, m, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = W.pieces.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.ecPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.ecPiece = cur.name;
      else return;
    }
  } else {
    st.ecPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  const k = win(u, 0, 0.5, cur.len - 0.5, cur.len);
  const kw = k * w;
  if (cur.name === 'stretch') {
    // arms up, a big yawn, then a bounce on her toes
    const up = win(u, 0.4, 1, 3, 3.6);
    const bounce = win(u, 3.8, 4, 5.4, 5.8) * Math.abs(Math.sin(u * 7));
    go({ shN: -170, elN: -30, shF: -170, elF: -30, tilt: -4, head: -8 }, up * kw);
    go({ lift: 0.04 * bounce }, kw);
    if (at(k)) {
      q.mood = u < 1.4 ? 'grin' : u < 3 ? 'shout' : u < 3.8 ? 'proud' : 'cheer';
      q.fx = { kind: 'stretch', u };
    }
  } else if (cur.name === 'box') {
    // shadow-boxing: three quick jabs, a proud grin
    const n = Math.floor((u - 0.6) / 0.7);
    const jab = n >= 0 && n < 3 ? win((u - 0.6) % 0.7, 0, 0.1, 0.25, 0.45) : 0;
    go({ shN: -30, elN: -110, shF: -40, elF: -110, drop: 0.08 }, kw);
    go({ shN: -88, elN: -6 }, jab * kw);
    if (at(k)) {
      q.mood = u < 2.8 ? 'fierce' : 'proud';
      q.fx = { kind: 'box', u, n };
    }
  } else if (cur.name === 'polish') {
    // her sun ring: a breath on it, a rub with her sleeve, it shines
    const rub = win(u, 2, 2.3, 4, 4.3);
    go({ shN: -130, elN: -90 + Math.sin(u * 12) * 15 * rub, shF: -40, elF: -40, head: -6, tilt: -2 }, kw);
    q.haloSpin = rub * Math.sin(u * 3) * 0.3;
    if (at(k)) {
      q.look = [-0.5, -0.6];
      q.turn = 0.15;
      q.mood = u < 1.6 ? 'still' : u < 4.4 ? 'smug' : 'cheer';
      q.fx = { kind: 'polishRing', u };
    }
  } else if (cur.name === 'pound') {
    // pounding mochi: three pounds of the mallet, a pat of the dough
    const n = Math.floor((u - 0.8) / 1.3);
    const ph = (u - 0.8) % 1.3;
    const pound = n >= 0 && n < 3 ? win(ph, 0, 0.5, 0.65, 0.85) : 0;
    const hit = n >= 0 && n < 3 ? win(ph, 0.55, 0.65, 0.75, 1.1) : 0;
    go({ shN: -165, elN: -20, shF: -150, elF: -30, tilt: -4, head: -4 }, pound * kw);
    go({ shN: -60, elN: -10, shF: -60, elF: -10, tilt: 8, head: 8 }, hit * kw);
    q.ma = 0.5 - 1.1 * pound + 1.5 * hit;
    if (at(k)) {
      q.look = [0.5, 0.8];
      q.mood = u < 4.9 ? 'focus' : 'bliss';
      q.fx = { kind: 'pound', u, hit };
    }
  } else if (cur.name === 'doze') {
    // a doze standing up: her head nodding, her ears drooping, a start awake
    const nod = win(u, 0.8, 1.6, 4.4, 4.6);
    const start = win(u, 4.5, 4.6, 5, 5.6);
    go({ head: 14 + Math.sin(u * 1.6) * 4, tilt: 3 }, nod * kw);
    go({ head: -6, tilt: -3, lift: 0.03 }, start * kw);
    q.earUp = -0.8 * nod + 0.5 * start;
    if (at(k)) {
      q.mood = u < 1 ? 'dreamy' : u < 4.5 ? 'sleepy' : u < 5.4 ? 'shock' : 'worried';
      q.fx = { kind: 'doze', u };
    }
  } else if (cur.name === 'stars') {
    // counting stars on her fingers
    const n = clamp(Math.floor((u - 0.8) / 1), -1, 4);
    go({ shF: -120, elF: -70, hwF: 20, shN: -40, elN: -80, head: -10, tilt: -2 }, kw);
    if (at(k)) {
      q.look = [0.4, -1];
      q.mood = u < 5 ? 'dreamy' : 'happy';
      q.fx = { kind: 'stars', u, n };
    }
  }
}

// ---------- Effects (the rig's space, base px, facing right; drawn live in their own soft style) ----------
export function sunlet(ctx, x, y, r, al = 1, rot = 0) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.6, SUNLIGHT.glow, 0.45);
  ctx.translate(x, y);
  ctx.rotate(rot);
  sunStar(ctx, 0, 0, r, SUNLIGHT.base);
  ell(ctx, 0, 0, r * 0.55, r * 0.55);
  ctx.fillStyle = SUNLIGHT.lt;
  ctx.fill();
  ctx.restore();
}
export function moonlet(ctx, x, y, r, al = 1, rot = -0.5) {
  if (al <= 0.01 || r <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.4, MOONLIGHT.glow, 0.45);
  crescent(ctx, x, y, r, rot, MOONLIGHT.lt);
  ctx.restore();
}
export function mochiBall(ctx, x, y, r, al = 1, squish = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y + squish * r * 0.3, r * (1 + squish * 0.25), r * (0.85 - squish * 0.25));
  ctx.fillStyle = LUNA.mochi.base;
  ctx.fill();
  pen(ctx, LUNA.mochi.ink, Math.max(0.4, r * 0.1));
  ctx.stroke();
  glow(ctx, x - r * 0.3, y - r * 0.3, r * 0.6, '#ffffff', 0.9);
  glow(ctx, x + r * 0.2, y + r * 0.4, r * 0.7, LUNA.mochi.sh, 0.8);
  ctx.restore();
}
function heart(ctx, x, y, s, al, col) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
function makeFx(who) {
  const sol = who === 'sol';
  const ink = sol ? SOL.coral.ink : LUNA.night.ink;
  return function fx(ctx, m, a, S, matOf, D) {
    const q = a.ecQ;
    if (!q) return;
    const t = a.t ?? 0;
    const f = a.flip !== Boolean(a.mo?.rig?.ecOuter?.flip) ? -1 : 1;
    const crown = headAt(a, D, [0, -28]);
    const face = headAt(a, D, [6, 4]);
    const hand = ptOf(a, D, 'handN', D.J.handN);
    const handF = ptOf(a, D, 'handF', D.J.handF);
    const X = q.fx;
    const say = (text, x, y, size = 8) => cue(ctx, text, x, y, size, f, -0.07, ink, '#fffaf0');
    // always: Sol's ring sheds a mote or two of sunlight; Luna's mallet a sparkle
    if (m.hp > 0) {
      for (let i = 0; i < 2; i++) {
        const v = (t * 0.3 + hash(i * 3.3 + (m.uid ?? 0))) % 1;
        if (sol) sparkle(ctx, -10 + i * 8 + Math.sin(v * 6 + i) * 3, -40 - v * 22, 1, Math.sin(Math.PI * v) * 0.7, SUNLIGHT.lt);
        else sparkle(ctx, -8 + i * 12 + Math.sin(v * 5 + i) * 3, -36 - v * 20, 1, Math.sin(Math.PI * v) * 0.7, MOONLIGHT.lt);
      }
    }
    if (!X) return;
    const u = X.u;
    if (X.kind === 'wave') {
      if (u > 0.2 && u < 2) say(sol ? 'Visitors!' : '...hi.', crown[0] + 16, crown[1] + 2, sol ? 9 : 7);
    } else if (X.kind === 'eclipse') {
      // a ring of light round them both, sun gold outside, moon silver inside
      const k = sstep(Math.max(0, u) / 0.8);
      if (sol) {
        ctx.save();
        ctx.globalAlpha *= 0.8 * k;
        pen(ctx, SUNLIGHT.glow, 2.6);
        ctx.beginPath();
        ctx.arc(-2, -36, 30 + Math.sin(t * 3) * 1.5, 0, TAU);
        ctx.stroke();
        pen(ctx, MOONLIGHT.lt, 1.2);
        ctx.beginPath();
        ctx.arc(-2, -36, 26, 0, TAU);
        ctx.stroke();
        ctx.restore();
        for (let i = 0; i < 6; i++) sunlet(ctx, -2 + Math.cos(t * 0.8 + i) * 32, -36 + Math.sin(t * 0.8 + i) * 32, 1.4, k * 0.9, t + i);
      } else for (let i = 0; i < 4; i++) moonlet(ctx, Math.cos(-t * 0.8 + i * 1.6) * 20, -40 + Math.sin(-t * 0.8 + i * 1.6) * 20, 1.6, k * 0.9);
    } else if (X.kind === 'spring') {
      for (let i = 0; i < 6; i++) (sol ? sunlet : moonlet)(ctx, Math.cos(i * 1.05) * (6 + u * 30), -6 - Math.abs(Math.sin(i * 1.05)) * u * 16, 1.4, 1 - u / 0.9, i);
    } else if (X.kind === 'ready') {
      if (sol) sunlet(ctx, hand[0] + 2, hand[1] - 2, 1.6 + Math.sin(t * 9) * 0.4, (X.k ?? 1) * 0.9, t * 2);
      else moonlet(ctx, malletGeom(a, D).head[0], malletGeom(a, D).head[1] - 6, 1.6, (X.k ?? 1) * 0.9);
    } else if (X.kind === 'castFlare') {
      const mid = [(hand[0] + handF[0]) / 2, Math.min(hand[1], handF[1]) - 6];
      sunlet(ctx, mid[0], mid[1], 3 + 2.5 * sstep(u / 1.5) + Math.sin(t * 12) * 0.4 * X.wind, 1, t * 3);
      if (u > 0.3 && u < 1.8) say('Here comes the sun!', crown[0] + 18, crown[1] - 6, 7);
    } else if (X.kind === 'rel_flare') {
      const k = clamp(u / 0.5, 0, 1);
      for (let i = 0; i < 6; i++) sunlet(ctx, hand[0] + Math.cos(i * 1.05) * k * 18, hand[1] + Math.sin(i * 1.05) * k * 12, 1.4 * (1 - k), 1 - k, i);
    } else if (X.kind === 'castSunbeam') {
      ctx.save();
      ctx.globalAlpha *= 0.6 * sstep(u / 0.6);
      glow(ctx, hand[0] + 8, hand[1], 14, SUNLIGHT.glow, 0.7);
      ctx.restore();
      if (u > 0.3 && u < 1.8) say('Sunrise!', crown[0] + 16, crown[1], 9);
    } else if (X.kind === 'castMoonbeam') {
      const G = malletGeom(a, D);
      moonlet(ctx, G.head[0], G.head[1] - 6, 2.4 + Math.sin(t * 4) * 0.3, sstep(u / 0.5));
      if (u > 0.3 && u < 1.8) say('Moonrise...', crown[0] + 16, crown[1], 8);
    } else if (X.kind === 'castSunspots') {
      for (let i = 0; i < 4; i++) {
        const v = (u * 0.9 + i / 4) % 1;
        sunlet(ctx, (i % 2 ? hand[0] : handF[0]) + Math.sin(i * 2) * 4, Math.min(hand[1], handF[1]) - v * 30, 1.6, Math.sin(Math.PI * v), i + t);
      }
      if (u > 0.4 && u < 1.8) say('Catch!', crown[0] + 16, crown[1], 9);
    } else if (X.kind === 'castRipple') {
      if (X.down > 0.5) {
        const G = malletGeom(a, D);
        for (let i = 0; i < 4; i++) mochiBall(ctx, G.head[0] + (i - 1.5) * 4, -1.5, 1.4, X.down, 0.6);
      }
      if (u > 0.2 && u < 1.2) say('Mochi, mochi...', crown[0] + 16, crown[1], 7);
    } else if (X.kind === 'castMochi') {
      const mid = [(hand[0] + handF[0]) / 2, Math.min(hand[1], handF[1]) - 5];
      mochiBall(ctx, mid[0], mid[1], 5.4, sstep(u / 0.4), Math.sin(t * 6) * 0.1);
      if (u > 0.4 && u < 2) say("Let's share!", crown[0] + 16, crown[1], 8);
    } else if (X.kind === 'rel_mochi') {
      for (let i = 0; i < 5; i++) mochiBall(ctx, hand[0] + Math.cos(i * 1.2) * u * 20, hand[1] - 8 + Math.sin(i * 1.2) * u * 12 + u * u * 20, 1.6, 1 - u, 0);
    } else if (X.kind === 'castConjunction') {
      if (sol) sunlet(ctx, hand[0] + 3, hand[1], 2 + Math.sin(t * 7) * 0.4, 0.9, t);
      else moonlet(ctx, hand[0] + 3, hand[1], 2, 0.9);
      if (u > 0.3 && u < 2) say(sol ? 'Luna, hand!' : 'Together...', crown[0] + 16, crown[1], 8);
    } else if (X.kind === 'castCrossing') {
      for (let i = 0; i < 4; i++) (sol ? sunlet : moonlet)(ctx, -14 - i * 7, -20 + Math.sin(t * 9 + i) * 4, 1.4, 1 - i * 0.2, i);
    } else if (X.kind === 'castDiamond') {
      for (let i = 0; i < 6; i++) {
        const an = t * 1.4 + (i / 6) * TAU;
        (sol ? sunlet : moonlet)(ctx, Math.cos(an) * 26, -36 + Math.sin(an) * 26, 1.6, 0.9, an);
      }
      if (u > 0.4 && u < 2) say(sol ? 'Diamond ring!' : 'Shine...', crown[0] + 16, crown[1], 8);
    } else if (X.kind === 'season') {
      if (u > 0.3 && u < 1.6) say(sol ? 'Eclipse season!' : 'Mm!', crown[0] + 16, crown[1], 8);
      if (u > 0.3 && u < 0.9) sparkle(ctx, hand[0], hand[1] - 4, 2.4, 1, sol ? SUNLIGHT.lt : MOONLIGHT.lt);
    } else if (X.kind === 'alone') {
      // her sister's keepsake: Sol holds Luna's crescent clip; Luna holds Sol's sun tie
      if (u < 1.3) (sol ? moonlet : sunlet)(ctx, hand[0] + 1, hand[1] - 2, 2.2, 1, 0);
      if (u > 1.3 && u < 2.2) say(sol ? 'For you, Luna!' : 'For you, Sol!', crown[0] + 14, crown[1], 8);
    } else if (X.kind === 'sunpunch') {
      if (u > -0.02 && u < 0.45) {
        const k = clamp(u / 0.4, 0, 1);
        sunlet(ctx, hand[0] + 4 + k * 6, hand[1], 2.4 * (1 - k * 0.5), 1 - k, k * 4);
      }
    } else if (X.kind === 'foxkick') {
      if (u > -0.02 && u < 0.45) {
        const k = clamp(u / 0.4, 0, 1);
        const ft = ptOf(a, D, 'footN', D.J.ankN);
        for (let i = 0; i < 3; i++) sunlet(ctx, ft[0] + 6 + i * 4 + k * 8, ft[1] - 2 - i * 3, 1.3, 1 - k, i);
        if (u < 0.35) say('Hyah!', ft[0] + 10, ft[1] - 14, 8);
      }
    } else if (X.kind === 'tailswipe') {
      if (u > -0.02 && u < 0.5) {
        const k = clamp(u / 0.45, 0, 1);
        ctx.save();
        ctx.globalAlpha *= 1 - k;
        pen(ctx, SUNLIGHT.glow, 2.2 * (1 - k * 0.5));
        ctx.beginPath();
        ctx.arc(-6, -18, 18 + k * 6, Math.PI * 0.6, Math.PI * 1.2);
        ctx.stroke();
        ctx.restore();
      }
    } else if (X.kind === 'bonk' || X.kind === 'poke') {
      if (u > -0.02 && u < 0.5) {
        const G = malletGeom(a, D);
        const k = clamp(u / 0.4, 0, 1);
        for (let i = 0; i < 4; i++) moonlet(ctx, G.head[0] + Math.cos(i * 1.6) * (3 + k * 12), G.head[1] + Math.sin(i * 1.6) * (3 + k * 8), 1.3, 1 - k, -0.5 + i);
        if (u < 0.35 && X.kind === 'bonk') say('Pon!', G.head[0] + 6, G.head[1] - 12, 8);
      }
    } else if (X.kind === 'stomp') {
      if (u > -0.02 && u < 0.5) {
        const k = clamp(u / 0.45, 0, 1);
        for (let i = 0; i < 5; i++) mochiBall(ctx, -8 + i * 6 + (i - 2) * k * 6, -1.4 - Math.sin(Math.PI * k) * 4 * (i % 2), 1.2, 1 - k, 0.5);
      }
    } else if (X.kind === 'readySwing') {
      if (sol) sunlet(ctx, hand[0], hand[1], 1.2, 0.7 * (X.k ?? 1), t * 3);
    } else if (X.kind === 'hurt') {
      const v = clamp(u / 0.5, 0, 1);
      (sol ? sunlet : moonlet)(ctx, crown[0] - 6 - v * 10, crown[1] + 8 - Math.sin(v * Math.PI) * 8 + v * 10, 1.6, 1 - v, v * 3);
      sparkle(ctx, face[0] - 4, face[1] - 12, 2 * (1 - v), 1 - v, '#ffe8f4');
    } else if (X.kind === 'gloat') {
      const k = win(u, 0, 0.12, 0.6, 0.9);
      if (sol) sunlet(ctx, crown[0] + 14 + u * 4, crown[1] + 8 - u * 10, 1.8, k, t * 2);
      else {
        moonlet(ctx, crown[0] + 14 + u * 4, crown[1] + 8 - u * 10, 1.8, k);
        heart(ctx, crown[0] + 20 + u * 6, crown[1] + 2 - u * 12, 1.4, k, LUNA.lip.base);
      }
    } else if (X.kind === 'stretch') {
      if (u > 1.4 && u < 2.9) say('Fwaaah~', face[0] + 16, face[1] - 18, 7);
    } else if (X.kind === 'box') {
      if (X.n >= 0 && X.n < 3 && (u - 0.6) % 0.7 < 0.3) sunlet(ctx, hand[0] + 4, hand[1], 1.4, 0.9, t * 4);
      if (u > 3 && u < 5) say('Undefeated!', face[0] + 18, face[1] - 20, 7);
    } else if (X.kind === 'polishRing') {
      if (u > 1 && u < 1.8) for (let i = 0; i < 2; i++) ell(ctx, -6 - i * 2, -48 - (u - 1) * 4, 1.4 - i * 0.4, 1);
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      if (u > 1 && u < 1.8) ctx.fill();
      if (u > 4.3 && u < 5.6) for (let i = 0; i < 3; i++) sparkle(ctx, -8 + i * 8, -50 + Math.sin(i * 2) * 6, 2 * win(u, 4.3, 4.5, 5.2, 5.6), 1, SUNLIGHT.lt);
    } else if (X.kind === 'pound') {
      // the mochi on the floor before her: a round of dough, squished by each pound
      mochiBall(ctx, 14, -3.4, 4.2, win(u, 0.4, 0.8, 6.2, 6.8), X.hit);
      if (X.hit > 0.5) say('pon!', 18, -16, 7);
      if (u > 5 && u < 6.4) heart(ctx, 14, -14 - (u - 5) * 4, 1.6, win(u, 5, 5.2, 6, 6.4), LUNA.lip.base);
    } else if (X.kind === 'doze') {
      if (u > 1.2 && u < 4.4) for (let i = 0; i < 2; i++) {
        const v = ((u - 1.2) * 0.5 + i * 0.5) % 1;
        cue(ctx, 'z', face[0] + 12 + v * 6, face[1] - 16 - v * 10, 6 + v * 2, f, -0.1, LUNA.night.ink, '#fffaf0');
      }
      if (u > 4.5 && u < 5.3) say('!', face[0] + 12, face[1] - 18, 9);
    } else if (X.kind === 'stars') {
      if (X.n >= 0 && u < 5) say(['one', 'two', 'three', 'four', 'five'][X.n], face[0] + 18, face[1] - 20, 7);
      if (u > 5 && u < 6.4) say('...so many.', face[0] + 20, face[1] - 22, 7);
      for (let i = 0; i < 3; i++) sparkle(ctx, -12 + i * 14, -64 - Math.sin(t * 2 + i) * 3, 1.6, 0.8, MOONLIGHT.lt);
    } else if (X.kind === 'beaten') {
      if (!sol) {
        // her mallet on the floor beside her
        ctx.save();
        pen(ctx, LUNA.wood.ink, 2.4);
        ctx.beginPath();
        ctx.moveTo(8, -1.4);
        ctx.lineTo(24, -1.4);
        ctx.stroke();
        pen(ctx, LUNA.wood.base, 1.4);
        ctx.stroke();
        ell(ctx, 27, -3.6, 3.4, 3.4);
        ctx.fillStyle = LUNA.wood.base;
        ctx.fill();
        ctx.restore();
      }
      for (let i = 0; i < 3; i++) {
        const an = t * 2.4 + (i / 3) * TAU;
        const px = crown[0] + Math.cos(an) * 10;
        const py = crown[1] + 8 + Math.sin(an) * 3;
        (sol ? sunlet : moonlet)(ctx, px, py, 1.4, Math.sin(an) > 0 ? 1 : 0.55, an);
      }
    }
  };
}

// ---------- Their dresses (the rig's hooks) ----------
const solDress = {
  id: 'eclipsesol',
  skin: { lt: SOL.skin[0], base: SOL.skin[1], sh: SOL.skin[2], deep: SOL.skin[3], ink: SOL.skinInk, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    for (const mode of ['line', 'fill']) {
      solHalo(ctx, a, mode, D, LWR);
      solTail(ctx, a, mode, D, LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawSol(ctx, a, mode, 'back', a.ecQ ?? {}, a.ecF, a.ecHair ?? {}, LWK / HS);
      ctx.restore();
    }
  },
  over: {
    armF: (ctx, a, mode, S, D) => solSleeve(ctx, a, mode, D, 'F', LWR),
    legF: (ctx, a, mode, S, D) => solSock(ctx, a, mode, D, 'F', LWR),
    footFskin: (ctx, a, mode, S, D) => solBoot(ctx, a, mode, D, 'F', LWR),
    legN: (ctx, a, mode, S, D) => solSock(ctx, a, mode, D, 'N', LWR),
    footNskin: (ctx, a, mode, S, D) => solBoot(ctx, a, mode, D, 'N', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      solJacket(ctx, a, mode, D, LWR);
      solSkirt(ctx, a, mode, D, LWR);
    },
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawSol(ctx, a, mode, 'front', a.ecQ ?? {}, a.ecF, a.ecHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => solSleeve(ctx, a, mode, D, 'N', LWR),
  },
  pose: makePose('sol'),
  fx: makeFx('sol'),
};
const lunaDressDef = {
  id: 'eclipseluna',
  skin: { lt: LUNA.skin[0], base: LUNA.skin[1], sh: LUNA.skin[2], deep: LUNA.skin[3], ink: LUNA.skinInk, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    for (const mode of ['line', 'fill']) {
      lunaCape(ctx, a, mode, D, LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawLuna(ctx, a, mode, 'back', a.ecQ ?? {}, a.ecF, a.ecHair ?? {}, LWK / HS);
      ctx.restore();
    }
  },
  over: {
    armF: (ctx, a, mode, S, D) => lunaSleeve(ctx, a, mode, D, 'F', LWR),
    legF: (ctx, a, mode, S, D) => lunaTights(ctx, a, mode, D, 'F', LWR),
    footFskin: (ctx, a, mode, S, D) => lunaShoe(ctx, a, mode, D, 'F', LWR),
    legN: (ctx, a, mode, S, D) => lunaTights(ctx, a, mode, D, 'N', LWR),
    footNskin: (ctx, a, mode, S, D) => lunaShoe(ctx, a, mode, D, 'N', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      lunaPuff(ctx, a, mode, D, LWR);
      lunaDress(ctx, a, mode, D, LWR);
      lunaSkirt(ctx, a, mode, D, LWR);
    },
    neckSkin: (ctx, a, mode, S, D) => lunaClasp(ctx, a, mode, D, LWR),
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawLuna(ctx, a, mode, 'front', a.ecQ ?? {}, a.ecF, a.ecHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => {
      lunaSleeve(ctx, a, mode, D, 'N', LWR);
      mallet(ctx, a, mode, D, LWR);
    },
  },
  pose: makePose('luna'),
  fx: makeFx('luna'),
};
function build(kind, def) {
  const R = dressRig(kind, def);
  const rig = R.rig;
  const draw0 = rig.draw;
  rig.draw = (ctx, m, a) => {
    const o = a.mo?.rig?.ecOuter;
    ctx.save();
    if (o?.flip) ctx.scale(-1, 1);
    ctx.scale(BIG, BIG);
    a.gaitScale = BIG;
    draw0(ctx, m, a);
    ctx.restore();
  };
  rig.w = Math.round(rig.w * BIG * 1.4);
  rig.h = Math.round(rig.h * BIG * 1.5);
  // (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: their marks over their heads
  // are their own)
  return { art: { pad: 16, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 180, 300, 220], draw: R.still, rig, noHop: true, ownEmotes: true }, speed: Math.round(R.speed * BIG) };
}
const SOLB = build('sunfox', solDress);
const LUNAB = build('moonbun', lunaDressDef);
export const SOL_ART = SOLB.art;
export const LUNA_ART = LUNAB.art;
export const SOL_SIZE = { w: 46, h: 96, speed: SOLB.speed };
export const LUNA_SIZE = { w: 44, h: 90, speed: LUNAB.speed };
