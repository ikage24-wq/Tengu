// Lady Abyssia, the Sea Witch, on screen (2026-11-26, remade from scratch: the Ink Abyss's boss, her
// name, role and story kept, world/aquarium.js her new fight). A grand little sea witch, half lady and
// half octopus, who has been quietly draining the light out of Queen Coralie's bubble wards into her
// lantern so the deep can be dark, and hers. Vain, theatrical, purring "darling" at everyone, petty
// and pleased with herself, never scary; she dotes on her Dumbo Lamplighters (render/dumbo/), who
// carry her violet sea-glass lanterns and are terribly scared of the dark she keeps making. She floats
// on her own copy of the spirit base (rig.js; body.js `seawitch`: a lady's upper body, no legs), her
// head, hair, hat, gown and six octopus arms drawn here (head.js, dress.js), never the shared face or
// the hero's body or hair.
//   look    pale skin with a lilac cast; ink-indigo hime hair (an even blunt fringe of five sections
//           just above her lashes, blunt side locks outside her eyes, the long hair behind her to her
//           waist, curled under); a dark violet witch's hat with a wide soft brim, the teal band and
//           the orange starfish buckle her darlings wear on their lantern caps, its point curling into
//           a nautilus shell; a pearl scallop-shell collar standing up behind her head; a violet gown
//           cut from her own outline (a sweetheart neckline, a teal sash, a sea-glass brooch), long
//           fitted sleeves with orchid frills at the cuffs, a ruffled orchid peplum of six sprung
//           frills; under it six orchid octopus arms with blush-pink undersides, curling at the tips
//           (each a sprung chain: never a rigid bell); her lamplighter's crook in her far hand, her big
//           lantern of violet sea-glass swinging from its hook, warm with stolen ward-light. Her own
//           soft outlines in each part's own deeper colour; her face bare.
//   faces   (head.js) wide almond eyes tipped up at the corners, the whole round iris always clear
//           (teal to sea-glass to a gold glow), a crescent-moon glint, a lash curling at the corner
//           like an arm's tip; fine high brows; plum lipstick. Moods: sly (rest), focus (casting, a
//           smirk), gloat ("ohoho"), cackle (eyes shut laughing), delighted, greedy (sparkling at
//           her lantern), kiss (a wink and a pucker), hum (eyes closed, humming), pout, cross, shock,
//           sad, hurt (> <), dizzy (beaten), sheepish, talk (vowels).
//   idle    a 30 s act, only while calm, in pieces that fit her pauses: her compact (opened, a look,
//           her lipstick touched up, a kiss for herself, a turn to her better side); her lantern (held
//           up and admired, a tap on the glass, a greedy little rub of her hands: all hers); a hum (a
//           slow sway, conducting the dark with one finger, little notes); counting her arms (each tip
//           lifted in turn, she counts... loses count, a frown; one arm waves at her; a giggle).
//   glide   she floats a hand over the floor, her arms rippling under her (a wave run down them by the
//           distance she glides), leaning into it, the lantern swinging behind.
//   fight   between casts her swings at the tank in turn: Arm Slap (a near arm whipped round at you),
//           Lantern Bonk (the crook swung over and down), Ink Flick (a flick of her fingers, a spatter of
//           ink). Her casts (m.castPose, world/aquarium.js): kiss (her hand to her lips, then the kiss
//           blown), blot (the crook raised, her fingers flicking ink up), snuff (the lantern held up,
//           her hand cupped over it: the light drawn in), embrace (arms and octopus arms flung wide),
//           flounce (hands on hips, then a haughty spin: clean mirror flips), cackle (the back of her
//           hand at her mouth, head back: "Ohohoho!"). A phase change (m.phaseAt): Darlings! (two claps,
//           a call), The Deep Is Mine (the lantern raised high, every light rushing into it).
//   scenes  her entrance (aquarium_abyssia): 'away' (not there yet), 'rise' (up out of a swirl of ink
//           on the floor: the nautilus first, the hat, her sly face, then all of her, her arms
//           unfurling one by one, lanterns winking alight round her), 'pose' (the crook twirled, a pose,
//           a kiss blown), 'snuff' (the lantern pinched dark: "Ink, my darlings!").
//   marks   all her own (`ownEmotes`): a violet note and a little heart after landing a hit, a drop of
//           ink flicked off her hat when hurt, a sweat drop when low, and beaten: sunk down on her arms,
//           dizzy, hat askew, the lantern dimmed.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { ARMS, NSEG, octoArm, peplum, collar, bodice, choker, sleeve, crook, crookGeom, compact, enter, ptOf, lantern } from './dress.js';
import { SKIN, SKIN_INK, INKY, LIGHT, STAFF } from './palette.js';

// (her drawn size over the base's)
const BIG = 2;
// (the outline: the body's own width in each frame's units)
const LWR = 2 / BIG;
let LWK = 2;
// ---------- Her head's frame (head units about her face's middle) ----------
const HS = 1.08;
const HO = [1.0, -18.2];
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

// ---------- Her moves ----------
const SWINGS = ['slap', 'bonk', 'flick'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.abN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'compact', t0: 0.4, len: 7.2 },
  { name: 'lantern', t0: 8.2, len: 6.8 },
  { name: 'hum', t0: 15.6, len: 6.4 },
  { name: 'count', t0: 22.6, len: 6.8 },
];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'sly', look: [0.3, 0], turn: 0.35, fx: null, sweat: 0, tears: false, lamp: 1, crook: 0.08, glow: 0.5, flip: 0, hidden: false, sink: 0, spread: 0, lift: 0, whirl: 0, armUp: [0, 0, 0, 0, 0, 0], slap: 0, compact: 0, compactOpen: 0, down: 0, noCrook: false };
  a.abQ = q;
  a.abUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.4);
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
  // (a cast's release: the strike moment as it ends, m.attackAt; which pose it was)
  if (cp) st.abLastPose = cp;
  const relU = !cast && st.abLastPose && since >= 0 && since < 1.2 ? since : -1;
  const relPose = relU >= 0 ? st.abLastPose : null;
  if (!cast && since >= 1.2) st.abLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.abAtk) {
    st.abN = (st.abN ?? (m.uid ?? 0)) + 1;
    st.abPick = pickSwing(m, st);
  }
  st.abAntic = swinging ? Math.max(anticK, st.abAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.abAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const gloatU = now - (m.gloatAt ?? -9);
  // ('away' holds until the next act: she isn't there yet)
  const sceneAct = act?.move === 'away' ? 'away' : act && actU >= 0 && actU < actDur + 0.4 ? act.move : null;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2) || sceneAct;

  // At rest: floating, grand: her far hand on her crook before her, the near one held out palm up
  // ("darling..."), her chin up, a slow sway.
  go({ tilt: -2 + Math.sin(t * 0.7) * 1.4, chest: -2 + breath * 0.8, head: -4 + Math.sin(t * 0.55) * 1.6, shN: -25, elN: -100, hwN: 20, shF: -50, elF: -55, hwF: 10 }, 1);
  q.look = [0.35 + Math.sin(t * 0.3) * 0.15, 0];
  // Gliding: leaning in, the near hand held out elegantly, the crook carried
  if (walkW > 0.01) {
    const sw = Math.sin(t * 2.2);
    go({ tilt: 7 + sw * 1.5, head: -6, chest: 2, shN: -40 + sw * 6, elN: -30, hwN: -20, shF: -10, elF: -50 }, walkW);
    q.crook = mix(q.crook, 0.32, walkW);
    q.turn = mix(q.turn, 0.5, walkW);
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say('focus');
  if (m.hp <= 0) {
    // beaten: sunk down on her arms, a hand to her hat, dizzy, the lantern dimmed
    const u = now - (st.abDeadAt ??= now);
    go({ drop: 1.0, tilt: 12, head: 14, chest: 6, shN: -150, elN: -40, hwN: 10, shF: -10, elF: 0, x: -0.02 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.down = 1;
    q.lamp = 0.25;
    q.noCrook = true;
    q.fx = { kind: 'beaten', u };
  } else st.abDeadAt = undefined;

  if (m.hp > 0) {
    if (sceneAct === 'away') q.hidden = true;
    else if (sceneAct === 'rise') {
      // up out of the ink: the nautilus first, her hat, her face, then all of her, her arms
      // unfurling one by one, the lantern winking alight
      const u = clamp(actU / actDur, 0, 1);
      q.sink = 1 - sstep(u / 0.78);
      const unfurl = (k) => sstep((u - 0.55 - k * 0.06) / 0.18);
      for (let k = 0; k < 6; k++) q.armUp[k] = 1 - unfurl(k);
      go({ tilt: -4, head: -10 + 6 * sstep((u - 0.7) / 0.3), shN: -120, elN: -40, hwN: 20, shF: -40, elF: -70 }, 1 - sstep((u - 0.8) / 0.2));
      q.lamp = sstep((u - 0.7) / 0.25);
      say(u < 0.5 ? 'sly' : 'delighted');
      q.look = [0.5, -0.2];
      q.fx = { kind: 'rise', u };
    } else if (sceneAct === 'pose') {
      // the crook twirled (clean flips of it, never spun), then a pose and a kiss blown
      const u = actU;
      const tw = win(u, 0, 0.2, 0.9, 1.15);
      const kiss = win(u, 1.1, 1.3, actDur - 0.3, actDur + 0.2);
      q.crook = 0.08 + tw * (Math.floor(u * 6) % 2 ? 0.7 : -0.5);
      go({ shF: -60, elF: -80, tilt: -4 }, tw);
      go({ shN: -110, elN: -150, hwN: 20, head: -6, tilt: -5 }, kiss * (u < 1.7 ? 1 : 0));
      go({ shN: -70, elN: -10, hwN: -20, head: -2, tilt: 4 }, kiss * (u >= 1.7 ? 1 : 0));
      say(u < 1.1 ? 'gloat' : 'kiss');
      q.fx = { kind: 'pose', u };
    } else if (sceneAct === 'snuff' && !cast) {
      const k = win(actU, 0, 0.3, actDur - 0.2, actDur + 0.4);
      go({ shF: -95, elF: -45, shN: -80, elN: -60, hwN: 40, tilt: -3, head: -6 }, k);
      q.lamp = 1 - 0.85 * sstep(actU / Math.max(0.2, actDur * 0.8));
      q.crook = mix(q.crook, 0.3, k);
      say('focus', k);
      q.fx = { kind: 'snuffScene', u: actU };
    } else if (cast) {
      castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say, phase);
    } else if (relPose) {
      releaseOf(relPose, relU, go, q, t, say);
    } else if (phaseU >= 0 && phaseU < 2) {
      const k = win(phaseU, 0, 0.25, 1.6, 2);
      if (phase >= 3) {
        // The Deep Is Mine: the lantern raised high, every light rushing into it
        go({ shF: -160, elF: -20, shN: -60, elN: -100, hwN: 30, tilt: -8, head: -12 }, k);
        q.crook = mix(q.crook, -0.05, k);
        q.lamp = 1 + 1.2 * k;
        say(phaseU < 1 ? 'greedy' : 'cackle', k);
        q.fx = { kind: 'deep', u: phaseU };
      } else {
        // Darlings!: two claps and a call
        const clap = Math.abs(Math.sin(phaseU * 9)) * sstep((phaseU - 0.2) / 0.2) * (1 - sstep((phaseU - 1.0) / 0.2));
        go({ tilt: -4, head: -8, shN: -70 + clap * 22, elN: -84, shF: -40, elF: -60 }, k);
        say(phaseU < 1.1 ? 'delighted' : 'talk', k);
        q.fx = { kind: 'darlings', u: phaseU };
      }
    } else if (swinging) {
      const kind = st.abPick ?? 'slap';
      const hitK = struck ? (since < 0.13 ? sstep(since / 0.13) : 1 - sstep((since - 0.32) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.abAntic) * (since < 0.13 ? 1 : 0) : sstep(anticK);
      if (kind === 'slap') {
        // a near arm cocked back high, then whipped round forward
        go({ tilt: -6, head: -4, shN: 40, elN: -120 }, wK);
        go({ tilt: 8, x: 0.03, head: 2 }, hitK);
        q.slap = wK * -1 + hitK * 1;
        say(hitK > 0.3 ? 'gloat' : 'focus');
      } else if (kind === 'bonk') {
        // the crook swung up behind, then over and down at you
        go({ shF: -150, elF: -35, tilt: -8, head: -6 }, wK);
        go({ shF: -75, elF: -15, tilt: 9, x: 0.035 }, hitK);
        q.crook = 0.08 - 0.6 * wK + 1.1 * hitK;
        say(hitK > 0.3 ? 'gloat' : 'focus');
      } else {
        // a flick of her fingers: the hand drawn back by her shoulder, flicked out
        go({ shN: -60, elN: -140, hwN: 50, tilt: -4 }, wK);
        go({ shN: -90, elN: -10, hwN: -30, tilt: 6, head: 2, x: 0.03 }, hitK);
        say(hitK > 0.3 ? 'pout' : 'focus');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -9, head: -10, x: -0.02, shN: -90, elN: -130, shF: 10 }, k);
      q.lift = 0.4 * k;
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    if ((sceneAct === 'attack' || sceneAct === 'windup') && !cast) {
      // a scene's flourish: the crook raised, a gesture
      const k = win(actU, 0, 0.2, actDur - 0.2, actDur + 0.2);
      go({ shF: -130, elF: -40, shN: -100, elN: -30, tilt: -6, head: -8 }, k);
      q.lamp = 1 + 0.6 * k;
      say(sceneAct === 'windup' ? 'focus' : 'gloat', k);
      q.fx = { kind: 'flourish', u: actU };
    }
    // her idle act: only when she's calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.abCalm = mix(st.abCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.abCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.abCalm), t, now, st);
    if (mood && !cast && !relPose && !swinging) {
      q.mood = { angry: 'cross', happy: 'delighted', sad: 'sad', talk: 'talk', sleep: 'dreamy', blink: 'dreamy', hurt: 'hurt' }[mood] ?? q.mood;
      if (mood === 'sad') {
        go({ head: 10, tilt: 3, shN: -60, elN: -130 }, 1);
        q.tears = true;
      }
    }
    // the gloat: a hit landed (between casts): a pleased little laugh behind her hand
    if (!busy && !hurt && gloatU >= 0 && gloatU < 0.9) {
      const k = win(gloatU, 0, 0.12, 0.6, 0.9);
      go({ shN: -80, elN: -150, hwN: 40, head: -6 }, k);
      say('gloat', k);
      q.fx = { kind: 'gloat', u: gloatU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'pout';
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  // (a face held for the check pages)
  if (m.abFace) q.mood = m.abFace;
  // (where her face is turned, eased: never a snap round)
  q.turn = spring(st, 'abTurn', q.turn, 220, 28, dt);
  // (the crook's swing, on a quick spring: a bonk curves through, never jumps)
  q.crook = spring(st, 'abCrook', q.crook, 320, 30, dt);
  // The face, eased toward its mood.
  const F = FACES[q.mood] ?? FACES.sly;
  const f = (st.abF ??= { ...FACES.sly, shut: { happy: 1, hum: 0, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  // (a lid shuts quickly and opens a touch slower, never lingering half open over the eye)
  for (const key of FKEYS) f[key] = mix(f[key], tgt[key], key === 'lid' || key === 'wk' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.abF = f;
  a.abFlip = q.flip;
  st.abOuter = { flip: q.flip, sink: q.sink, hidden: q.hidden };
  // Springs: her octopus arms (each piece trailing the one before, a wave run down them by the distance
  // she glides, pushed by her turns and her body's moves), the peplum's frills, her hair, her hat's
  // nautilus, the lantern on its ring.
  const kick = (st.abLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.abLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7;
  st.abLast = out.head;
  st.abLastT = out.tilt;
  const flipKick = st.abFlip0 != null && st.abFlip0 !== q.flip ? 1 : 0;
  st.abFlip0 = q.flip;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  const ph = a.blSl ?? t * 1.2;
  const moving = walkW;
  a.abArms = ARMS.map((A, k) => {
    const fwd = A.an > 0.2 ? 1 : A.an < -0.2 ? -1 : 0;
    const up = q.armUp[k];
    return Array.from({ length: NSEG }, (_, i) => {
      const tipW = i / NSEG;
      let goal = i ? A.bend + (i >= NSEG - 2 ? A.curl : 0) : 0;
      // the wave down the arm (bigger toward the tip and as she glides)
      goal += Math.sin(ph * 0.9 + A.ph - i * 0.85) * (0.05 + 0.1 * tipW) * (1 + moving * 1.6);
      // spread wide (embrace): the arm thrown out along the floor, its curl loosened
      if (q.spread > 0.001) goal = mix(goal, i === 0 ? (fwd || (k % 2 ? 1 : -1)) * 0.85 : i >= NSEG - 2 ? A.curl * 0.6 : (fwd || (k % 2 ? 1 : -1)) * 0.16, q.spread);
      // lifted (a count, rising from the ink): the arm raised up and curled
      if (up > 0.001) goal = mix(goal, i === 0 ? (fwd || (k < 3 ? -1 : 1)) * 1.6 : (fwd || (k < 3 ? -1 : 1)) * 0.32, up);
      if (q.lift > 0.001) goal += (i === 0 ? (fwd || 1) * 0.4 : 0) * q.lift;
      // swept back by a flounce
      goal -= q.whirl * (i === 0 ? 0.6 : 0.08);
      // her slap: the front near arm cocked back, then whipped forward
      if (k === 4 && q.slap) goal += (i === 0 ? 1.1 : 0.12) * q.slap;
      // beaten: laid out flat
      if (q.down > 0.01) goal = mix(goal, i === 0 ? (fwd || (k % 2 ? 1 : -1)) * 1.1 : (fwd || 1) * 0.05, q.down * 0.8);
      return spring(st, `ar${k}_${i}`, goal - lean * (i === 0 ? 0.25 : 0), 95 - i * 7, 7.2 - i * 0.35, dt, (kick * 0.006 + flipKick * 0.25) * (i + 1) * 0.35 * (k % 2 ? 1 : -1));
    });
  });
  a.abPep = [0, 1, 2, 3, 4, 5].map((i) => spring(st, `pp${i}`, Math.sin(t * 1.4 + i * 1.3) * 0.04 - lean * 0.4 + moving * -0.12 - q.whirl * 0.5 * (i % 2 ? 1 : -1), 110 + i * 8, 8, dt, kick * 0.01 + flipKick * 0.25 * (i % 2 ? 1 : -1)));
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0)) * (Math.PI / 180);
  a.abHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.7 + i * 1.9) * 0.02 + headLean * 0.12, 160 + i * 30, 13, dt, kick * 0.003 * (i % 2 ? 1 : -1) + flipKick * 0.06)),
    slN: spring(st, 'sln', Math.sin(t * 1.2) * 0.04 - headLean * 0.2 + moving * 0.1, 90, 8.5, dt, kick * 0.005 + flipKick * 0.12),
    slF: spring(st, 'slf', Math.sin(t * 1.1 + 2) * 0.04 - headLean * 0.2 + moving * 0.1, 85, 8.5, dt, kick * 0.005 + flipKick * 0.12),
    back: spring(st, 'bk', Math.sin(t * 0.9) * 0.08 - headLean * 0.5 - moving * 0.25 + q.whirl * 0.4, 60, 6.5, dt, kick * 0.01 + flipKick * 0.3),
    hat: spring(st, 'hat', Math.sin(t * 1.3) * 0.04 + headLean * 0.25 - moving * 0.08, 120, 9, dt, kick * 0.006 + flipKick * 0.12),
  };
  a.abLamp = spring(st, 'lamp', Math.sin(t * 1.1) * 0.06 - lean * 0.8 - moving * 0.25 + (q.crook - 0.08) * -0.9, 60, 4.6, dt, kick * 0.02 + flipKick * 0.5);
}

// A cast held (castK: how far through it; wind: its last 0.6 s, gathering).
function castPoseOf(cp, u, castK, wind, go, q, t, say, phase) {
  const k = sstep(u / 0.35);
  if (cp === 'kiss') {
    // Kiss Goodnight: her fingertips to her lips, leaning in, a wink
    go({ shN: -120 - 10 * wind, elN: -150, hwN: 20, tilt: -2 + 4 * wind, head: -4 }, k);
    say(u < 0.5 ? 'sly' : 'kiss', k);
    q.fx = { kind: 'castKiss', u, wind };
  } else if (cp === 'blot') {
    // Ink Blots: the crook raised high, her fingers flicking up at the dark over you
    const fl = Math.max(0, Math.sin(t * 9)) * k;
    go({ shF: -140, elF: -40, shN: -130 - 12 * fl, elN: -40 + 30 * fl, hwN: -30, tilt: -6, head: -10 }, k);
    q.crook = -0.1;
    q.lamp = 1.2;
    say('focus', k);
    q.fx = { kind: 'castBlot', u };
  } else if (cp === 'snuff') {
    // Lights Out!: the lantern brought up before her, her hand cupped over it, the light drawn in
    // (once the darlings carry lanterns, hers stays lit: she is a beam too)
    go({ shF: -95, elF: -45, shN: -80, elN: -60, hwN: 40, tilt: -3, head: -6 }, k);
    q.crook = mix(0.08, 0.3, k);
    q.lamp = phase >= 2 ? 1 + 0.5 * k : 1 - 0.85 * sstep(u / 1.4);
    say(castK < 0.6 ? 'focus' : 'greedy', k);
    q.fx = { kind: 'castSnuff', u };
  } else if (cp === 'embrace') {
    // Eight-Arm Embrace: arms and octopus arms flung wide, leaning in: "come here, darlings"
    go({ shN: -70 - 20 * Math.sin(t * 3) * 0.2, elN: -10, hwN: -20, shF: -50, elF: -20, tilt: 6, head: 2 }, k);
    q.spread = k;
    q.crook = 0.4;
    say('delighted', k);
    q.fx = { kind: 'castEmbrace', u };
  } else if (cp === 'flounce') {
    // Ink Flounce: her hand on her hip, chin up, the arms gathering in a swirl under her
    go({ shN: 34, elN: -116, hwN: 30, tilt: -6, head: -10 }, k);
    q.whirl = 0.4 * k + 0.2 * Math.sin(t * 6) * k;
    say('pout', k);
    q.look = [-0.4, -0.2];
    q.turn = 0.15;
    q.fx = { kind: 'castFlounce', u };
  } else if (cp === 'cackle') {
    // Ohohoho!: the back of her hand at her mouth, her head thrown back, shaking with laughter
    const sh = Math.sin(t * 16) * 2 * k;
    go({ shN: -125, elN: -150, hwN: 70, tilt: -8, head: -16 + sh, chest: -3 }, k);
    q.lift = 0.3 * k;
    say(u < 0.4 ? 'gloat' : 'cackle', k);
    q.fx = { kind: 'castCackle', u };
  }
}
// The moment a cast lets go (u: seconds since).
function releaseOf(rp, u, go, q, t, say) {
  const k = win(u, 0, 0.08, 0.7, 1.2);
  if (rp === 'kiss') {
    // the kiss blown: her hand opened out toward you
    go({ shN: -75, elN: -10, hwN: -25, tilt: 5, head: 2 }, k);
    say('kiss', k);
  } else if (rp === 'blot') {
    go({ shF: -60, elF: -20, shN: -70, elN: -10, hwN: -40, tilt: 6 }, k);
    say('gloat', k);
  } else if (rp === 'snuff') {
    // a snap of her fingers: the dark comes down
    go({ shN: -110, elN: -70, hwN: -20, tilt: 2, head: -4 }, k);
    q.lamp = 1;
    say('gloat', k);
  } else if (rp === 'embrace') {
    // the embrace closed: arms wrapped round herself, every arm swept in
    go({ shN: -40, elN: -130, shF: -40, elF: -110, tilt: 4, head: 4 }, k);
    q.spread = 0.6 * (1 - sstep(u / 0.5));
    say('delighted', k);
  } else if (rp === 'flounce') {
    // the spin: whole turns as clean mirror flips, the arms flung out round her
    q.flip = u < 0.55 ? Math.floor(u / 0.14) % 2 : 0;
    q.whirl = 0.8 * (1 - sstep(u / 0.8));
    q.spread = 0.45 * win(u, 0, 0.1, 0.4, 0.8);
    go({ shN: -60, elN: -20, shF: -60, elF: -20, tilt: 2 }, k);
    say('gloat', k);
  } else if (rp === 'cackle') {
    go({ shN: -120, elN: -150, hwN: 70, tilt: -10, head: -18 + Math.sin(t * 18) * 2 }, k);
    say('cackle', k);
  }
  q.fx = { kind: `rel_${rp}`, u };
}

// The 30 s act (only a piece she has time to finish, m.restUntil).
function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.abPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.abPiece = cur.name;
      else return;
    }
  } else {
    st.abPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'compact') {
    // the compact opened and looked in; lipstick touched up with a fingertip; a kiss for herself; a
    // turn of her head to her better side, then the other... the first, definitely; snapped shut
    const k = win(u, 0, 0.5, 6.6, 7.2);
    const lips = win(u, 1.8, 2.1, 2.9, 3.2);
    const kiss = win(u, 3.3, 3.5, 4.1, 4.4);
    go({ shN: -105, elN: -110, hwN: 20, head: -2, shF: -18, elF: -58 }, k * w);
    go({ shF: -70, elF: -150, hwF: 20 }, lips * k * w);
    q.compact = k * w;
    q.compactOpen = sstep((u - 0.5) / 0.4) * (1 - sstep((u - 6.3) / 0.3));
    if (at(k)) {
      q.look = [0.6, 0.4];
      q.mood = u < 1.8 ? 'sly' : u < 3.3 ? 'focus' : u < 4.4 ? 'kiss' : u < 6.2 ? 'gloat' : 'sly';
      q.turn = u > 4.6 && u < 5.4 ? 0.05 : u > 5.4 && u < 6.0 ? 0.6 : 0.35;
      q.fx = { kind: 'compact', u, kiss };
    }
  } else if (cur.name === 'lantern') {
    // the lantern lifted and admired; a tap on the glass; a greedy rub of her hands: all hers
    const k = win(u, 0, 0.5, 6.2, 6.8);
    const up = win(u, 0.2, 0.8, 3.4, 3.9);
    const tap = u > 1.8 && u < 2.6 ? Math.max(0, Math.sin(u * 20)) : 0;
    const rub = win(u, 3.9, 4.2, 5.8, 6.3);
    go({ shF: -95, elF: -60, tilt: -2, head: -4 }, up * k * w);
    q.crook = mix(0.08, 0.5, up * k * w);
    go({ shN: -95 + 10 * tap, elN: -120 + 10 * tap, hwN: 40 }, up * k * w);
    go({ shN: -60 + Math.sin(t * 14) * 4, elN: -120, hwN: 20, shF: -40, elF: -110 }, rub * k * w);
    q.lamp = 1 + 0.5 * up;
    if (at(k)) {
      q.look = u < 3.9 ? [0.7, -0.6] : [0.3, 0.2];
      q.mood = u < 3.9 ? 'greedy' : 'gloat';
      q.fx = { kind: 'lantern', u, tap, rub };
    }
  } else if (cur.name === 'hum') {
    // a slow sway, eyes shut, conducting the dark with one finger, soft notes rising
    const k = win(u, 0, 0.6, 5.8, 6.4);
    const sw = Math.sin(u * 2.2);
    go({ tilt: sw * 4, head: -6 + sw * 4, shN: -120 + Math.sin(u * 4.4) * 14, elN: -60 + Math.sin(u * 4.4 + 1) * 16, hwN: -20 }, k * w);
    if (at(k)) {
      q.mood = 'hum';
      q.fx = { kind: 'hum', u };
    }
  } else {
    // counting her arms: each tip lifted in turn as she counts on her fingers... she loses count,
    // frowns; one arm waves at her; a giggle behind her hand
    const k = win(u, 0, 0.4, 6.4, 6.8);
    const n = clamp(Math.floor((u - 0.4) / 0.55), -1, 5);
    for (let i = 0; i < 6; i++) q.armUp[i] = (n === i ? sstep(((u - 0.4) % 0.55) / 0.2) * (1 - sstep((((u - 0.4) % 0.55) - 0.35) / 0.2)) : 0) * k * w * (u < 3.8 ? 1 : 0);
    const wave = win(u, 4.4, 4.6, 5.4, 5.6);
    q.armUp[4] = Math.max(q.armUp[4], wave * 0.85 * k * w);
    if (wave > 0.01) q.slap = Math.sin(u * 14) * 0.25 * wave;
    const giggle = win(u, 5.4, 5.6, 6.3, 6.6);
    go({ shN: -70, elN: -100, hwN: 30, head: 6 }, k * w * (u < 3.8 ? 1 : 0));
    go({ shN: -125, elN: -150, hwN: 70, head: -6 }, giggle * k * w);
    if (at(k)) {
      q.look = u < 4.4 ? [0.2, 1] : [0.6, 0.6];
      q.mood = u < 3.8 ? 'focus' : u < 4.4 ? 'pout' : u < 5.4 ? 'shock' : 'cackle';
      q.fx = { kind: 'count', u, n };
    }
  }
}

// ---------- Effects (the rig's space, base px, facing right; drawn live in her own soft style) ----------
// A glossy drop of ink: a round little drop, violet-indigo, a white shine (never a speck).
export function inkDrop(ctx, x, y, s, ang = 0, al = 1) {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s * 1.5);
  ctx.quadraticCurveTo(s * 1.05, -s * 0.1, s * 0.9, s * 0.45);
  ctx.quadraticCurveTo(0, s * 1.35, -s * 0.9, s * 0.45);
  ctx.quadraticCurveTo(-s * 1.05, -s * 0.1, 0, -s * 1.5);
  pen(ctx, INKY.deep, Math.max(0.4, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = INKY.base;
  ctx.fill();
  ell(ctx, -s * 0.3, -s * 0.05, s * 0.28, s * 0.2, -0.5);
  ctx.fillStyle = INKY.gloss;
  ctx.fill();
  ctx.restore();
}
// A soft heart in her plum.
export function heart(ctx, x, y, s, al = 1, fill = '#d27ab8', rim = '#a2468e') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  pen(ctx, rim, Math.max(0.5, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
  ell(ctx, x - s * 0.4, y - s * 0.25, s * 0.22, s * 0.14, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
}
// A music note in violet.
function vnote(ctx, x, y, s, ang, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  pen(ctx, INKY.sh, s * 0.4);
  ctx.beginPath();
  ctx.moveTo(s * 0.62, 0);
  ctx.lineTo(s * 0.62, -s * 2.1);
  ctx.quadraticCurveTo(s * 1.3, -s * 1.8, s * 1.4, -s * 1.1);
  ctx.stroke();
  ell(ctx, 0, 0, s * 0.78, s * 0.58, -0.4);
  ctx.stroke();
  ctx.fillStyle = INKY.lt;
  ctx.fill();
  ctx.restore();
}
// A round bubble with a glint.
export function bubble(ctx, x, y, r, al = 1) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(236,228,255,0.35)';
  ctx.fill();
  pen(ctx, 'rgba(184,160,240,0.95)', Math.max(0.35, r * 0.18));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, Math.PI * 1.1, Math.PI * 1.5);
  pen(ctx, 'rgba(255,255,255,0.9)', Math.max(0.3, r * 0.2));
  ctx.stroke();
  ctx.restore();
}
// A pool of ink on the floor (her entrance): a flat glossy oval, swirling.
function inkPool(ctx, x, y, r, t, al) {
  if (al <= 0.01 || r <= 0.5) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r * 0.24);
  ctx.fillStyle = INKY.deep;
  ctx.fill();
  ell(ctx, x, y - r * 0.02, r * 0.86, r * 0.18);
  ctx.fillStyle = INKY.sh;
  ctx.fill();
  pen(ctx, 'rgba(200,180,255,0.6)', 0.6);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y, r * (0.3 + i * 0.2), r * (0.06 + i * 0.045), 0, t * (1.4 - i * 0.3) + i, t * (1.4 - i * 0.3) + i + 2.2);
    ctx.stroke();
  }
  ell(ctx, x - r * 0.4, y - r * 0.08, r * 0.2, r * 0.04);
  ctx.fillStyle = 'rgba(232,224,255,0.6)';
  ctx.fill();
  ctx.restore();
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.abQ;
  if (!q) return;
  fxIn(ctx, m, a, D, q);
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const f = a.flip !== Boolean(a.mo?.rig?.abOuter?.flip) ? -1 : 1;
  const crown = headAt(a, D, [0, -22]);
  const face = headAt(a, D, [6, 4]);
  const brim = headAt(a, D, [-14, -14]);
  const hand = ptOf(a, D, 'handN', D.J.handN);
  const G = crookGeom(a, D);
  const lampAt = [G.lamp[0], G.lamp[1] + 5.4];
  const X = q.fx;
  // always (fighting or not): a few motes of warm light drifting up out of her lantern
  if (m.hp > 0 && (q.lamp ?? 1) > 0.3) {
    for (let i = 0; i < 2; i++) {
      const v = (t * 0.35 + hash(i * 3.3 + (m.uid ?? 0))) % 1;
      sparkle(ctx, lampAt[0] + Math.sin(v * 6 + i * 2) * 3, lampAt[1] - 4 - v * 16, 0.9 + hash(i) * 0.5, Math.sin(Math.PI * v) * 0.7 * Math.min(1, q.lamp), LIGHT.halo);
    }
  }
  if (!X) return;
  const u = X.u;
  if (X.kind === 'rise') {
    // the ink pool: swelling as she rises, shrinking away after; lanterns winking alight round her
    const pool = sstep(u / 0.15) * (1 - sstep((u - 0.82) / 0.18));
    inkPool(ctx, 0, -0.5, 26 * (0.6 + 0.4 * pool), t, pool);
    for (let i = 0; i < 8; i++) {
      const v = (t * 0.8 + i / 8) % 1;
      bubble(ctx, Math.sin(i * 2.3) * 18, -2 - v * 30, 1 + hash(i) * 1.2, Math.sin(Math.PI * v) * pool);
    }
    const lit = sstep((u - 0.75) / 0.2);
    for (let i = 0; i < 3; i++) {
      const lx = [-40, 34, -18][i];
      const ly = [-62, -70, -88][i] + Math.sin(t * 1.4 + i) * 2;
      if (lit > 0.01) {
        ctx.save();
        ctx.globalAlpha *= lit;
        lantern(ctx, a, 'line', [lx, ly], [lx, ly], Math.sin(t + i) * 0.1, lit, LWR, 0.6);
        lantern(ctx, a, 'fill', [lx, ly], [lx, ly], Math.sin(t + i) * 0.1, lit, LWR, 0.6);
        ctx.restore();
        sparkle(ctx, lx, ly + 3, 2.4 * (1 - sstep((u - 0.85) / 0.15)), lit, LIGHT.halo);
      }
    }
  } else if (X.kind === 'pose') {
    if (u > 1.7 && u < 2.8) for (let i = 0; i < 3; i++) heart(ctx, hand[0] + 6 + (u - 1.7) * 30 + i * 5, hand[1] - 4 - i * 4 - Math.sin((u - 1.7) * 5 + i) * 2, 2.2 - i * 0.3, 1 - sstep((u - 2.4) / 0.4));
    if (u > 1.8 && u < 2.8) cue(ctx, 'Mwah!', face[0] + 18, face[1] - 18, 8, f, -0.1, INKY.sh, '#fff6ff');
  } else if (X.kind === 'snuffScene' || X.kind === 'castSnuff') {
    // the light drawn in toward the lantern: motes streaming in from all round
    const k = X.kind === 'castSnuff' ? sstep(u / 0.6) : sstep(u / 0.4);
    for (let i = 0; i < 9; i++) {
      const v = (t * 0.9 + i / 9) % 1;
      const an = (i / 9) * TAU + 0.4;
      const r = 46 * (1 - v) + 4;
      sparkle(ctx, lampAt[0] + Math.cos(an) * r, lampAt[1] + Math.sin(an) * r * 0.7, 1.4, Math.sin(Math.PI * v) * k, LIGHT.halo);
    }
  } else if (X.kind === 'rel_snuff') {
    // the snap: a little ring and two sparkles at her fingertips
    const k = clamp(u / 0.4, 0, 1);
    ctx.save();
    ctx.globalAlpha *= 1 - k;
    pen(ctx, INKY.lt, 1);
    ctx.beginPath();
    ctx.arc(hand[0] + 1, hand[1] - 2, 2 + k * 8, 0, TAU);
    ctx.stroke();
    ctx.restore();
    sparkle(ctx, hand[0] + 3, hand[1] - 5, 2.2 * (1 - k), 1 - k);
    if (u < 0.8) cue(ctx, '*snap*', hand[0] + 14, hand[1] - 14, 7, f, -0.1, INKY.sh, '#fff6ff');
  } else if (X.kind === 'castKiss') {
    if (u > 0.5) sparkle(ctx, face[0] + 4, face[1] + 6, 1.4 + Math.sin(t * 8) * 0.4, 0.9, '#ffd2ec');
  } else if (X.kind === 'rel_kiss') {
    const k = clamp(u / 0.8, 0, 1);
    for (let i = 0; i < 3; i++) heart(ctx, hand[0] + 6 + k * (30 + i * 10), hand[1] - 3 - Math.sin(k * 4 + i) * 4 - i * 3, 2.6 - i * 0.4, 1 - k);
    if (u < 0.7) cue(ctx, 'Mwah!', face[0] + 18, face[1] - 16, 8, f, -0.1, INKY.sh, '#fff6ff');
  } else if (X.kind === 'castBlot') {
    // ink gathering up over the crook's lantern, drops spinning up into the dark
    for (let i = 0; i < 5; i++) {
      const v = (t * 0.8 + i / 5) % 1;
      inkDrop(ctx, lampAt[0] + Math.sin(i * 2.1 + t) * 6, lampAt[1] - 8 - v * 34, 1.2 + hash(i) * 0.6, Math.sin(t * 3 + i) * 0.3, Math.sin(Math.PI * v));
    }
  } else if (X.kind === 'rel_blot') {
    const k = clamp(u / 0.6, 0, 1);
    for (let i = 0; i < 6; i++) inkDrop(ctx, hand[0] + 4 + Math.cos(-1.2 + i * 0.3) * k * 22, hand[1] - 4 + Math.sin(-1.2 + i * 0.3) * k * 18, 1.4, i, 1 - k);
  } else if (X.kind === 'castEmbrace' || X.kind === 'rel_embrace') {
    const k = X.kind === 'castEmbrace' ? sstep(u / 0.5) : 1 - sstep(u / 0.6);
    for (let i = 0; i < 4; i++) heart(ctx, Math.cos(t * 1.6 + i * 1.6) * 20, -46 - i * 6 + Math.sin(t * 2 + i) * 3, 1.8, k * 0.85);
    if (X.kind === 'castEmbrace' && u > 0.4 && u < 1.6) cue(ctx, 'Come here, darlings~', crown[0] + 6, crown[1] - 10, 7, f, -0.06, INKY.sh, '#fff6ff');
  } else if (X.kind === 'castFlounce') {
    for (let i = 0; i < 6; i++) {
      const an = t * 4 + (i / 6) * TAU;
      inkDrop(ctx, Math.cos(an) * 22, -6 + Math.sin(an) * 4, 1.2, an, 0.7 * sstep(u / 0.5));
    }
    if (u > 0.3 && u < 1.4) cue(ctx, 'Hmph!', face[0] + 16, face[1] - 18, 8, f, -0.1, INKY.sh, '#fff6ff');
  } else if (X.kind === 'rel_flounce') {
    const k = clamp(u / 0.7, 0, 1);
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU + k * 2;
      inkDrop(ctx, Math.cos(an) * (14 + k * 40), -6 + Math.sin(an) * (3 + k * 8), 1.5, an, 1 - k);
    }
  } else if (X.kind === 'castCackle' || X.kind === 'rel_cackle') {
    const k = X.kind === 'castCackle' ? sstep(u / 0.4) : 1 - sstep(u / 0.9);
    for (let i = 0; i < 6; i++) {
      const v = (t * 0.7 + i / 6) % 1;
      bubble(ctx, Math.sin(i * 2.7) * 24, -10 - v * 50, 1.2 + hash(i) * 1.4, Math.sin(Math.PI * v) * k);
    }
    if (k > 0.3) cue(ctx, 'Ohohoho!', crown[0] + 14, crown[1] - 6 - Math.sin(t * 9) * 1.5, 8, f, -0.08, INKY.sh, '#fff6ff');
  } else if (X.kind === 'darlings') {
    const k = Math.abs(Math.sin(u * 9));
    if (u < 1.1) for (let i = 0; i < 3; i++) sparkle(ctx, hand[0] + Math.cos(i * 2.1) * 7, hand[1] - 6 + Math.sin(i * 2.1) * 5, 2 * k, k);
    if (u > 0.9 && u < 1.9) cue(ctx, 'Darlings!', crown[0] + 20, crown[1] - 6, 9, f, -0.08, INKY.sh, '#fff6ff');
  } else if (X.kind === 'deep') {
    // every light in the room rushing into her lantern
    for (let i = 0; i < 12; i++) {
      const v = (u * 0.9 + i / 12) % 1;
      const an = (i / 12) * TAU;
      const r = 90 * (1 - v) + 6;
      sparkle(ctx, lampAt[0] + Math.cos(an) * r, lampAt[1] + Math.sin(an) * r * 0.6, 1.6, Math.sin(Math.PI * v), LIGHT.halo);
    }
    if (u > 0.8 && u < 2) cue(ctx, 'The deep is MINE!', crown[0] + 10, crown[1] - 8, 8, f, -0.06, INKY.sh, '#fff6ff');
  } else if (X.kind === 'slap') {
    // a soft swoosh of water where her arm whipped round
    if (u > -0.02 && u < 0.45) {
      const k = clamp(u / 0.35, 0, 1);
      ctx.save();
      ctx.globalAlpha *= 1 - k;
      pen(ctx, 'rgba(214,236,255,0.9)', 2.4 * (1 - k * 0.5));
      ctx.beginPath();
      ctx.arc(8, -8, 18 + k * 6, -0.6, 0.9);
      ctx.stroke();
      pen(ctx, 'rgba(255,255,255,0.9)', 0.9);
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 3; i++) bubble(ctx, 22 + i * 4 + k * 8, -10 + i * 5, 1.3, 1 - k);
    }
  } else if (X.kind === 'bonk') {
    if (u > -0.02 && u < 0.5) {
      const k = clamp(u / 0.4, 0, 1);
      for (let i = 0; i < 5; i++) {
        const an = -Math.PI / 2 + (i - 2) * 0.55;
        sparkle(ctx, lampAt[0] + Math.cos(an) * (4 + k * 16), lampAt[1] + 4 + Math.sin(an) * (4 + k * 12), 2 * (1 - k), 1 - k, LIGHT.halo);
      }
      if (u < 0.4) cue(ctx, 'Bonk!', lampAt[0] + 10, lampAt[1] - 12, 8, f, -0.1, INKY.sh, '#fff6ff');
    }
  } else if (X.kind === 'flick') {
    if (u > -0.02 && u < 0.5) {
      const k = clamp(u / 0.45, 0, 1);
      for (let i = 0; i < 5; i++) {
        const an = -0.7 + i * 0.3;
        inkDrop(ctx, hand[0] + 3 + Math.cos(an) * (3 + k * 22), hand[1] - 2 + Math.sin(an) * (3 + k * 14) + k * k * 6, 1.3 * (1 - k * 0.3), an + 1.6, 1 - k);
      }
    }
  } else if (X.kind === 'ready') {
    sparkle(ctx, hand[0] + 2, hand[1] - 4, 1.4 + Math.sin(t * 9) * 0.5, 0.7 * (X.k ?? 1), '#e8dcff');
  } else if (X.kind === 'flourish') {
    for (let i = 0; i < 6; i++) {
      const an = t * 2 + (i / 6) * TAU;
      sparkle(ctx, lampAt[0] + Math.cos(an) * 12, lampAt[1] + Math.sin(an) * 8, 1.6, 0.8, LIGHT.halo);
    }
  } else if (X.kind === 'hurt') {
    // a drop of ink flicked off her hat's brim, a little sparkle of the bump
    const v = clamp(u / 0.5, 0, 1);
    inkDrop(ctx, brim[0] - 4 - v * 10, brim[1] + v * 10 + v * v * 8, 1.3, -0.6 + v, 1 - v);
    sparkle(ctx, face[0] - 4, face[1] - 12, 2.2 * (1 - v), 1 - v, '#ffe0f0');
  } else if (X.kind === 'gloat') {
    const k = win(u, 0, 0.12, 0.6, 0.9);
    vnote(ctx, crown[0] + 12 + u * 6, crown[1] + 2 - u * 10, 1.6, 0.2, k);
    heart(ctx, crown[0] + 20 + u * 4, crown[1] + 8 - u * 8, 1.6, k);
  } else if (X.kind === 'compact') {
    if (X.kiss > 0.3) heart(ctx, face[0] + 12, face[1] - 6 - (u - 3.3) * 8, 2, X.kiss);
    if (u > 4.6 && u < 6) cue(ctx, u < 5.4 ? 'hmm...' : 'perfect.', face[0] + 20, face[1] - 22, 7, f, -0.1, INKY.sh, '#fff6ff');
  } else if (X.kind === 'lantern') {
    if (X.tap > 0.5) sparkle(ctx, lampAt[0] - 2, lampAt[1] - 2, 1.8, 0.9, LIGHT.halo);
    if (u > 4 && u < 6) cue(ctx, 'mine~', face[0] + 18, face[1] - 22, 7, f, -0.1, INKY.sh, '#fff6ff');
  } else if (X.kind === 'hum') {
    for (let i = 0; i < 3; i++) {
      const v = (u * 0.5 + i / 3) % 1;
      vnote(ctx, face[0] + 10 + v * 14, face[1] - 10 - v * 18, 1.5, Math.sin(v * 6 + i) * 0.3, Math.sin(Math.PI * v) * 0.9);
    }
  } else if (X.kind === 'count') {
    if (X.n >= 0 && u < 3.8) cue(ctx, ['one', 'two', 'three', 'four', 'five', 'six'][X.n], face[0] + 18, face[1] - 20, 7, f, -0.1, INKY.sh, '#fff6ff');
    if (u > 3.8 && u < 4.5) cue(ctx, '...seven?', face[0] + 20, face[1] - 22, 7, f, -0.1, INKY.sh, '#fff6ff');
  } else if (X.kind === 'beaten') {
    // her crook dropped on the floor before her, the lantern on its side, gone dim
    const fx0 = 18;
    ctx.save();
    pen(ctx, STAFF.ink, 3.4);
    ctx.beginPath();
    ctx.moveTo(fx0 - 30, -1.8);
    ctx.lineTo(fx0 + 8, -1.8);
    ctx.quadraticCurveTo(fx0 + 15, -2.2, fx0 + 14, -7);
    ctx.stroke();
    pen(ctx, STAFF.base, 2.2);
    ctx.stroke();
    ctx.restore();
    lantern(ctx, a, 'line', [fx0 + 18, -8], [fx0 + 18, -8], -1.2, 0.2, LWR);
    lantern(ctx, a, 'fill', [fx0 + 18, -8], [fx0 + 18, -8], -1.2, 0.2, LWR);
    for (let i = 0; i < 3; i++) {
      const an = t * 2.6 + (i / 3) * TAU;
      const px = crown[0] + Math.cos(an) * 10;
      const py = crown[1] + 4 + Math.sin(an) * 3;
      if (i % 2) sparkle(ctx, px, py, 1.8, Math.sin(an) > 0 ? 1 : 0.55, '#e8dcff');
      else inkDrop(ctx, px, py, 1.2, an, Math.sin(an) > 0 ? 1 : 0.55);
    }
  }
}

// ---------- Her dress (the rig's hooks) ----------
const lineW = (D) => (LWK = (2 / BIG) / D.SC);
const DRESS = {
  id: 'abyssia',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['lower'],
  // (behind everything of her: her far octopus arms, the back frills of her peplum, her long hair,
  // the shell collar standing behind her head)
  under2: (ctx, m, a, S, matOf, D) => {
    lineW(D);
    if (a.abQ?.sink > 0.999) return;
    for (const mode of ['line', 'fill']) {
      ARMS.forEach((A, k) => !A.near && octoArm(ctx, a, mode, D, A, k, LWR));
      peplum(ctx, a, mode, D, true, LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', a.abQ ?? {}, a.abF, a.abHair ?? {}, LWK / HS);
      ctx.restore();
      collar(ctx, a, mode, D, LWK);
    }
  },
  over: {
    // (her far sleeve on her far arm, then her crook in her far hand: the hand drawn over it)
    armF: (ctx, a, mode, S, D) => {
      sleeve(ctx, a, mode, D, 'F', LWK);
      crook(ctx, a, mode, D, LWR);
    },
    torsoSkin: (ctx, a, mode, S, D) => {
      if (mode === 'fill') bodice(ctx, a, D);
      ARMS.forEach((A, k) => A.near && octoArm(ctx, a, mode, D, A, k, LWR));
      peplum(ctx, a, mode, D, false, LWR);
    },
    neckSkin: (ctx, a, mode, S, D) => choker(ctx, a, mode, D, LWK),
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.abQ ?? {}, a.abF, a.abHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N', LWK),
    handNskin: (ctx, a, mode, S, D) => {
      const q = a.abQ ?? {};
      if (q.compact > 0.02) {
        const hd = ptOf(a, D, 'handN', D.J.handN);
        ctx.save();
        ctx.globalAlpha *= clamp(q.compact * 1.5, 0, 1);
        compact(ctx, a, mode, hd[0] + 1.4, hd[1] - 2.6, q.compactOpen ?? 0, -0.3, LWR);
        ctx.restore();
      }
    },
  },
  pose,
  fx,
};
const R = dressRig('seawitch', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (not there yet in her entrance; rising out of the ink; a whole turn a clean mirror flip)
  if (m.cine?.act?.move === 'away' || (m.offstage && !m.cine?.act)) return;
  const o = a.mo?.rig?.abOuter;
  const act = m.cine?.act;
  // (rising out of the ink: worked out from the act's own clock, so the first frame is right too)
  const sink = act?.move === 'rise' && m.hp > 0 ? 1 - sstep(clamp(((a.now ?? 0) - act.at) / (act.dur ?? 1), 0, 1) / 0.78) : 0;
  ctx.save();
  if (sink > 0.001) {
    // (everything under the floor hidden: she comes up through the ink's surface)
    ctx.beginPath();
    ctx.rect(-400, -600, 800, 600);
    ctx.clip();
    ctx.translate(0, sink * R.H * BIG * 1.25);
  }
  if (o?.flip) ctx.scale(-1, 1);
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
  if (sink > 0.001) {
    // the ink's surface over her as she comes up through it
    ctx.save();
    ctx.scale(BIG, BIG);
    inkPool(ctx, 0, -0.5, 26, a.t ?? 0, 1);
    ctx.restore();
  }
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.4);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own), her size as drawn and her gliding pace (the base's own at her size).
export const ABYSSIA_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 300, 240, 260], draw: R.still, rig, noHop: true, ownEmotes: true };
export const ABYSSIA_SIZE = { w: 66, h: 128, speed: Math.round(R.speed * BIG) };
