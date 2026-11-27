// Queen Coralie, the Drowned Queen, on screen (2026-11-26, remade from scratch: the Sunken Aquarium
// Palace's final boss, her story kept, world/aquarium.js her new fight). A young mermaid queen, lonely
// since the palace sank, who keeps everything she loves in glass so that nothing can ever leave: her
// fish, her pearls, Elder Warabi, and now you. Sweet, proud, a little spoiled, quick to tears and quick to
// brighten; the queen of the household that wears her livery (render/seabunny/, seaangel/, beluga/,
// sailfish/, axolotl/: coral pink with a pearl), worn by her in full. She floats on her own copy of the
// spirit base (rig.js; body.js `merqueen`: a young queen's upper body, no legs), her head, hair, crown,
// gown, mantle and mermaid's tail drawn here (head.js, dress.js), never the shared face or the hero's body
// or hair.
//   look    warm pale skin; long seafoam hair (an even blunt fringe of four rounded sections just above
//           her lashes, long side locks outside her eyes down to her chest with pearl beads, the rest in
//           big soft waves down her back); a little crown of branching coral on a gold band with pearls;
//           a coral bodice cut from her own outline, a strand of pearls along its neckline and one big
//           pearl, a pearl sash with a pearl clasp at her hips; little puffed sea-silk sleeves and pearl
//           bracelets; a royal mantle of sheer sea-silk in three sprung panels down her back; a coral
//           mermaid's tail fading to pearly peach, a pearl-white belly, a big sheer two-lobed fluke, a
//           little fin at each hip; in her far hand her scepter, topped by her keepsake globe with one
//           little orange fish swimming round inside. Her own soft outlines in each part's deeper colour;
//           her face bare.
//   faces   (head.js) big round doll eyes, the whole iris always clear (deep sea blue to aqua to a pink
//           glow), a round pearl of a glint, three small round flicks at each lash's end; short soft brows;
//           a small rosy mouth. Moods: regal (rest), still (holding a pose), delighted, proud (eyes shut,
//           chin up), bliss, focus, pleading, pout, sad (teary), sob, shock, hurt (> <), dizzy, sheepish,
//           talk, wink.
//   idle    a 30 s act, only while calm, in pieces that fit her pauses: her globe (breathed on and
//           polished with her sleeve; the little fish swims up to the glass and she boops it); counting
//           her treasures (a point round the room, one, two, three... all here, proud); her crown (it
//           slips; caught with both hands, set straight, a sheepish look round); the door (a hopeful look
//           toward it, waiting... nobody; a droop; then the globe hugged to her, a smile).
//   swim    she swims a hand over the floor, leaning into it, her tail kicking in a wave run by the
//           distance she swims, her near arm sweeping, the mantle streaming.
//   fight   between casts her swings at the tank in turn: Tail Slap (her tail whipped round at you),
//           Scepter Bop (the globe bopped down), Splash (a flick of water from her fingers). Her casts
//           (m.castPose, world/aquarium.js): decree (the scepter raised high, then stamped down), cases
//           (conducting her display cases down, scepter and hand sweeping), strand (her pearl strand
//           pulled loose and swung), wave (a royal wave), portrait (a hand to her cheek, a wink: "Say
//           pearls!"), walls (both arms pushing out to the walls, pleading). A phase change (m.phaseAt):
//           Say Pearls! (a delighted clap), Nobody Ever Leaves! (the globe hugged to her, teary, then set).
//   scenes  her entrance (aquarium_coralie): 'exhibit' (standing perfectly still inside a glass display
//           case with a little plaque, "Exhibit No. 1: Me!"), 'alive' (a blink, a wink: the case lifts
//           away in bubbles and she stretches), 'present' (her collection presented with a sweep of her
//           arm), 'keep' (the scepter raised at you, a glint of glass). Her ending (aquarium_freed):
//           'open' (the scepter tapped to the biggest tank's glass: it melts into bubbles), 'release'
//           (her own keepsake globe opened: the little fish swims out, circles her and away, a wave
//           goodbye), and swimming up after her fish (the director's 'swimup', the fish leading).
//   marks   all her own (`ownEmotes`): a heart and a bubble after landing a hit, a pearl knocked off her
//           crown when hurt, a sweat drop when low, and beaten: sunk down on her tail, dizzy, her crown
//           askew, the scepter dropped beside her.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { TSEG, TAIL_REST, tail, hipFin, mantle, bodice, sleeve, scepter, scepterGeom, globe, fish, displayCase, plaque, enter, ptOf } from './dress.js';
import { SKIN, SKIN_INK, CORAL, PEARL, WATER, GOLD } from './palette.js';

const BIG = 2;
const LWR = 2 / BIG;
let LWK = 2;
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

const SWINGS = ['tailslap', 'bop', 'splash'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.crN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'polish', t0: 0.4, len: 7.2 },
  { name: 'count', t0: 8.2, len: 6.4 },
  { name: 'crown', t0: 15.2, len: 6 },
  { name: 'door', t0: 22, len: 7.4 },
];

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'regal', look: [0.3, 0], turn: 0.35, fx: null, sweat: 0, tears: false, sc: 0.12, flip: 0, tailFlick: 0, tailUp: 0, whirl: 0, down: 0, noScepter: false, crownTip: 0, fishOut: 0, strand: 0, casePose: 0 };
  a.crQ = q;
  a.crUid = (m.uid ?? 0) % 7;
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
  if (cp) st.crLastPose = cp;
  const relU = !cast && st.crLastPose && since >= 0 && since < 1.2 ? since : -1;
  const relPose = relU >= 0 ? st.crLastPose : null;
  if (!cast && since >= 1.2) st.crLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.crAtk) {
    st.crN = (st.crN ?? (m.uid ?? 0)) + 1;
    st.crPick = pickSwing(m, st);
  }
  st.crAntic = swinging ? Math.max(anticK, st.crAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.crAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const gloatU = now - (m.gloatAt ?? -9);
  const sceneAct = act && actU >= 0 && actU < actDur + 0.4 ? act.move : act?.move === 'exhibit' ? 'exhibit' : null;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2) || sceneAct;

  // At rest: floating, a young queen: her scepter held up before her, her near hand light at her
  // chest, chin up, a gentle sway.
  go({ tilt: -2 + Math.sin(t * 0.8) * 1.2, chest: -2 + breath * 0.8, head: -4 + Math.sin(t * 0.6) * 1.4, shN: -20, elN: -100, hwN: 20, shF: -50, elF: -55, hwF: 10 }, 1);
  q.look = [0.35 + Math.sin(t * 0.33) * 0.15, 0];
  // Swimming: leaning in, her near arm sweeping in a slow stroke, the scepter carried
  if (walkW > 0.01) {
    const sw = Math.sin(t * 2.4);
    go({ tilt: 10 + sw * 1.5, head: -8, chest: 2, shN: -60 + sw * 18, elN: -30 - sw * 10, hwN: -20, shF: -30, elF: -50 }, walkW);
    q.sc = mix(q.sc, 0.5, walkW);
    q.turn = mix(q.turn, 0.5, walkW);
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say('focus');
  if (m.hp <= 0) {
    // beaten: sunk down on her tail, a hand to her crown, dizzy, the scepter dropped beside her
    const u = now - (st.crDeadAt ??= now);
    go({ drop: 1.0, tilt: 12, head: 14, chest: 6, shN: -150, elN: -40, hwN: 10, shF: -10, elF: 0, x: -0.02 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.down = 1;
    q.noScepter = true;
    q.crownTip = 0.6;
    q.fx = { kind: 'beaten', u };
  } else st.crDeadAt = undefined;

  if (m.hp > 0) {
    if (sceneAct === 'exhibit') {
      // perfectly still in her display case: a pose held, not a breath (her chin up, her hand at her
      // cheek, the scepter just so)
      go({ tilt: -3, chest: -2, head: -6, shN: -110, elN: -150, hwN: 40, shF: -60, elF: -50 }, 1);
      say('still');
      q.look = [0.5, 0];
      q.fx = { kind: 'exhibit', u: act ? actU : 0 };
    } else if (sceneAct === 'alive') {
      // a blink, a wink, the case lifting away in bubbles, a stretch
      const u = actU;
      const stretch = win(u, 0.7, 1.1, 1.8, 2.2);
      go({ tilt: -3, chest: -2, head: -6, shN: -110, elN: -150, hwN: 40, shF: -60, elF: -50 }, 1 - sstep(u / 0.7));
      go({ shN: -170, elN: -30, shF: -150, elF: -40, tilt: -6, head: -10 }, stretch);
      q.tailUp = 0.5 * stretch;
      say(u < 0.5 ? 'still' : u < 0.9 ? 'wink' : u < 2 ? 'bliss' : 'delighted');
      q.fx = { kind: 'alive', u };
    } else if (sceneAct === 'present') {
      // her collection presented: a sweep of her near arm round the room, looking proudly along it
      const k = win(actU, 0, 0.35, actDur - 0.3, actDur + 0.2);
      const sweep = sstep(actU / Math.max(0.4, actDur * 0.8));
      go({ shN: -70 - 30 * sweep, elN: -20, hwN: -30, tilt: -4, head: -6 }, k);
      q.look = [mix(-0.6, 1, sweep), -0.3];
      q.turn = mix(0.2, 0.6, sweep);
      say('delighted', k);
      q.fx = { kind: 'present', u: actU };
    } else if (sceneAct === 'keep' || sceneAct === 'attack') {
      // the scepter raised at you: "I'll keep YOU too!"
      const k = win(actU, 0, 0.25, actDur - 0.2, actDur + 0.3);
      go({ shF: -150, elF: -40, shN: 30, elN: -110, hwN: 30, tilt: -6, head: -8 }, k);
      q.sc = mix(q.sc, 0.5, k);
      say('delighted', k);
      q.fx = { kind: 'keep', u: actU };
    } else if (sceneAct === 'open') {
      // the scepter tapped to the glass
      const k = win(actU, 0, 0.3, actDur - 0.3, actDur + 0.2);
      const tap = win(actU, 0.5, 0.65, 0.75, 0.95);
      go({ shF: -90, elF: -30 + tap * 10, tilt: 4 + 3 * tap, head: -2 }, k);
      q.sc = mix(q.sc, 0.9 + 0.2 * tap, k);
      say(actU < 0.9 ? 'focus' : 'sheepish', k);
      q.fx = { kind: 'open', u: actU };
    } else if (sceneAct === 'release') {
      // her own keepsake let go: the globe held up before her, its lid lifted, the fish out; a wave
      const u = actU;
      const hold = win(u, 0, 0.4, 1.8, 2.2);
      const wave = win(u, 2.0, 2.3, actDur - 0.3, actDur + 0.2);
      go({ shF: -95, elF: -60, shN: -95, elN: -80, hwN: 20, tilt: -2, head: -4 }, hold);
      go({ shN: -150, elN: -60 + Math.sin(u * 10) * 14, hwN: Math.sin(u * 10) * 20, shF: -50, elF: -55 }, wave);
      q.fishOut = sstep((u - 0.9) / 0.3);
      if (u > 1.2) st.crFree = true;
      say(u < 0.9 ? 'regal' : u < 2.2 ? 'sad' : 'bliss');
      q.tears = u > 0.9 && u < 2.2;
      q.fx = { kind: 'release', u };
    } else if (sceneAct === 'swimup') {
      // up after her fish: arms streaming back, her tail kicking hard
      go({ tilt: -10, head: -10, shN: -160, elN: -10, shF: -140, elF: -20 }, 1);
      q.fishOut = 1;
      q.tailUp = 0.6;
      say('bliss');
      q.fx = { kind: 'swimup', u: actU };
    } else if (cast) {
      castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say);
    } else if (relPose) {
      releaseOf(relPose, relU, go, q, t, say);
    } else if (phaseU >= 0 && phaseU < 2) {
      const k = win(phaseU, 0, 0.25, 1.6, 2);
      if (phase >= 3) {
        // Nobody Ever Leaves!: the globe hugged to her, teary, then set
        go({ shF: -110, elF: -110, shN: -70, elN: -120, hwN: 30, tilt: 4, head: 8 }, k);
        q.sc = mix(q.sc, -0.3, k);
        say(phaseU < 1.1 ? 'pleading' : 'focus', k);
        q.tears = phaseU < 1.1;
        q.fx = { kind: 'nobody', u: phaseU };
      } else {
        // Say Pearls!: a delighted clap
        const clap = Math.abs(Math.sin(phaseU * 9)) * sstep((phaseU - 0.2) / 0.2) * (1 - sstep((phaseU - 1.0) / 0.2));
        go({ tilt: -4, head: -8, shN: -70 + clap * 22, elN: -84, shF: -60, elF: -70 }, k);
        say('delighted', k);
        q.fx = { kind: 'pearls', u: phaseU };
      }
    } else if (swinging) {
      const kind = st.crPick ?? 'tailslap';
      const hitK = struck ? (since < 0.13 ? sstep(since / 0.13) : 1 - sstep((since - 0.32) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.crAntic) * (since < 0.13 ? 1 : 0) : sstep(anticK);
      if (kind === 'tailslap') {
        go({ tilt: -8, head: -4, shN: -60, elN: -60 }, wK);
        go({ tilt: 10, x: 0.03, head: 2 }, hitK);
        q.tailFlick = -wK + hitK;
        say(hitK > 0.3 ? 'pout' : 'focus');
      } else if (kind === 'bop') {
        go({ shF: -150, elF: -35, tilt: -7, head: -6 }, wK);
        go({ shF: -75, elF: -15, tilt: 9, x: 0.035 }, hitK);
        q.sc = 0.12 - 0.5 * wK + 1.0 * hitK;
        say(hitK > 0.3 ? 'pout' : 'focus');
      } else {
        go({ shN: -60, elN: -140, hwN: 50, tilt: -4 }, wK);
        go({ shN: -90, elN: -10, hwN: -30, tilt: 6, head: 2, x: 0.03 }, hitK);
        say(hitK > 0.3 ? 'delighted' : 'focus');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -9, head: -10, x: -0.02, shN: -90, elN: -130, shF: -20 }, k);
      q.tailFlick = -0.4 * k;
      q.crownTip = 0.25 * k;
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.crCalm = mix(st.crCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.crCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.crCalm), t, now, st);
    if (mood && !cast && !relPose && !swinging) {
      q.mood = { angry: 'pout', happy: 'delighted', sad: 'sad', talk: 'talk', sleep: 'proud', blink: 'proud', hurt: 'hurt' }[mood] ?? q.mood;
      if (mood === 'sad') {
        go({ head: 10, tilt: 3, shN: -60, elN: -130 }, 1);
        q.tears = true;
      }
    }
    if (!busy && !hurt && gloatU >= 0 && gloatU < 0.9) {
      const k = win(gloatU, 0, 0.12, 0.6, 0.9);
      go({ shN: -80, elN: -140, hwN: 30, head: -6 }, k);
      say('delighted', k);
      q.fx = { kind: 'gloat', u: gloatU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'pleading';
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  // (her little fish, once let go, stays free for the rest of her scene)
  if (!m.cine) st.crFree = false;
  if (st.crFree) q.fishOut = 1;
  if (m.crFace) q.mood = m.crFace;
  q.turn = spring(st, 'crTurn', q.turn, 220, 28, dt);
  q.sc = spring(st, 'crSc', q.sc, 320, 30, dt);
  const F = FACES[q.mood] ?? FACES.regal;
  const f = (st.crF ??= { ...FACES.regal, shut: { happy: 1, sob: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' || key === 'wk' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.crF = f;
  st.crOuter = { flip: q.flip };
  // Springs: the tail (a wave run down it by the distance she swims, pushed by her turns and moves), the
  // fluke's spread, the hip fins, the mantle's panels, her hair, her crown.
  const still = sceneAct === 'exhibit' ? 1 : 0;
  const kick = ((st.crLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.crLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7) * (1 - still);
  st.crLast = out.head;
  st.crLastT = out.tilt;
  const flipKick = st.crFlip0 != null && st.crFlip0 !== q.flip ? 1 : 0;
  st.crFlip0 = q.flip;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  const ph = a.blSl ?? t * 1.2;
  const moving = walkW;
  const amp = (1 - still) * (1 + moving * 1.8 + q.tailUp * 2);
  a.crTail = Array.from({ length: TSEG }, (_, i) => {
    const u = i / TSEG;
    let goal = TAIL_REST[i] + Math.sin(ph * 0.9 - i * 0.7) * (0.03 + 0.06 * u) * amp;
    goal += q.tailFlick * (i < 3 ? 0.3 : 0.12);
    goal += q.tailUp * (i < 4 ? -0.08 : 0.16);
    if (q.down > 0.01) goal = mix(goal, i < 2 ? 0.5 : 0.18, q.down * 0.8);
    return spring(st, `tl${i}`, goal - lean * (i === 0 ? 0.3 : 0), 110 - i * 7, 8 - i * 0.35, dt, (kick * 0.005 + flipKick * 0.2) * (i + 1) * 0.3);
  });
  a.crFluke = spring(st, 'flk', Math.sin(ph * 0.9 - 6) * 0.3 * amp, 90, 7, dt, kick * 0.01);
  a.crFin = [0, 1].map((i) => spring(st, `fn${i}`, Math.sin(t * 1.6 + i * 2) * 0.12 * (1 - still) - moving * 0.3, 90, 7, dt, kick * 0.01 + flipKick * 0.2));
  a.crCape = [0, 1, 2].map((i) => spring(st, `cp${i}`, Math.sin(t * 1.1 + i * 1.4) * 0.04 * (1 - still) + moving * 0.35 - lean * 0.5 + q.whirl * 0.5, 55 + i * 8, 5.5, dt, kick * 0.015 + flipKick * 0.4));
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0)) * (Math.PI / 180);
  a.crHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.7 + i * 1.9) * 0.02 * (1 - still) + headLean * 0.12, 160 + i * 30, 13, dt, kick * 0.003 * (i % 2 ? 1 : -1) + flipKick * 0.06)),
    slN: spring(st, 'sln', Math.sin(t * 1.2) * 0.05 * (1 - still) - headLean * 0.25 + moving * 0.15, 80, 8, dt, kick * 0.006 + flipKick * 0.15),
    slF: spring(st, 'slf', Math.sin(t * 1.1 + 2) * 0.05 * (1 - still) - headLean * 0.25 + moving * 0.15, 76, 8, dt, kick * 0.006 + flipKick * 0.15),
    back: spring(st, 'bk', Math.sin(t * 0.9) * 0.07 * (1 - still) - headLean * 0.5 - moving * 0.3 + q.whirl * 0.4, 55, 6.5, dt, kick * 0.01 + flipKick * 0.3),
    crown: spring(st, 'crn', q.crownTip + headLean * 0.05, 140, 10, dt, kick * 0.004),
  };
}

// A cast held (castK: how far through it; wind: its last 0.6 s, gathering).
function castPoseOf(cp, u, castK, wind, go, q, t, say) {
  const k = sstep(u / 0.35);
  if (cp === 'decree') {
    // Royal Decree: the scepter raised high, her near hand on her hip, about to stamp it down
    go({ shF: -165 + 15 * wind, elF: -20, shN: 30, elN: -110, hwN: 30, tilt: -5 - 3 * wind, head: -8 }, k);
    q.sc = -0.1 + 0.3 * wind;
    say('focus', k);
    q.fx = { kind: 'castDecree', u };
  } else if (cp === 'cases') {
    // Display Cases: conducting them down, scepter and hand sweeping in turn
    const sw = Math.sin(u * 4.2);
    go({ shF: -110 + sw * 30, elF: -40, shN: -110 - sw * 30, elN: -40, tilt: -2, head: -6 + sw * 3 }, k);
    q.sc = 0.2 + sw * 0.3;
    q.look = [sw, -0.4];
    say('delighted', k);
    q.fx = { kind: 'castCases', u };
  } else if (cp === 'strand') {
    // Strand of Pearls: her pearl strand pulled loose, swinging in her near hand
    go({ shN: -130 - 20 * wind, elN: -60 + 30 * wind, hwN: 20, tilt: -4 - 4 * wind, head: -6 }, k);
    q.strand = k;
    say('pout', k);
    q.fx = { kind: 'castStrand', u };
  } else if (cp === 'wave') {
    // Royal Wave: the royal wave itself, her near hand turning at the wrist
    go({ shN: -165, elN: -25, hwN: Math.sin(u * 8) * 30, tilt: -3, head: -6 }, k);
    say(u < 1.5 ? 'proud' : 'delighted', k);
    q.fx = { kind: 'castWave', u };
  } else if (cp === 'portrait') {
    // Royal Portrait: her hand to her cheek, head tilted, a wink
    go({ shN: -115, elN: -150, hwN: 40, tilt: -3, head: 8, chest: -2 }, k);
    say(castK < 0.6 ? 'delighted' : 'wink', k);
    q.fx = { kind: 'castPortrait', u };
  } else if (cp === 'walls') {
    // Glass Walls: both arms pushing out to the walls, pleading
    go({ shN: -80, elN: -10, hwN: -40, shF: -80, elF: -10, tilt: 2, head: 2 }, k);
    q.sc = 0.6;
    q.whirl = 0.3 * k;
    say('pleading', k);
    q.fx = { kind: 'castWalls', u };
  }
}
function releaseOf(rp, u, go, q, t, say) {
  const k = win(u, 0, 0.08, 0.7, 1.2);
  if (rp === 'decree') {
    go({ shF: -60, elF: -10, tilt: 8, head: 2 }, k);
    q.sc = 0.9;
    say('proud', k);
  } else if (rp === 'cases') {
    const clap = Math.abs(Math.sin(u * 10)) * (1 - sstep(u / 0.6));
    go({ shN: -70 + clap * 20, elN: -84, shF: -60, elF: -70, tilt: -2 }, k);
    say('delighted', k);
  } else if (rp === 'strand') {
    go({ shN: -60, elN: -5, hwN: -30, tilt: 8, x: 0.03 }, k);
    q.strand = 1 - sstep(u / 0.8);
    say('pout', k);
  } else if (rp === 'wave') {
    go({ shN: -160, elN: -40, hwN: 30, tilt: -4, head: -8 }, k);
    say('delighted', k);
  } else if (rp === 'portrait') {
    go({ shN: -120, elN: -150, hwN: 40, tilt: -3, head: 8 }, k);
    say('wink', k);
  } else if (rp === 'walls') {
    go({ shN: -60, elN: -130, shF: -60, elF: -120, tilt: 4, head: 6 }, k);
    say('pout', k);
  }
  q.fx = { kind: `rel_${rp}`, u };
}

function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.crPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.crPiece = cur.name;
      else return;
    }
  } else {
    st.crPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'polish') {
    // the globe brought before her, breathed on, polished with her sleeve; the fish swims up to the
    // glass and she boops it
    const k = win(u, 0, 0.5, 6.6, 7.2);
    const rub = win(u, 2.2, 2.5, 4, 4.3);
    const boop = win(u, 5, 5.2, 5.6, 5.9);
    go({ shF: -60, elF: -40, tilt: 4, head: 8 }, k * w);
    go({ shN: -60 + Math.sin(u * 12) * 8 * rub, elN: -60 + Math.cos(u * 12) * 8 * rub, hwN: 20 }, (rub + boop) * k * w);
    q.sc = mix(q.sc, 0.7, k * w);
    if (at(k)) {
      q.look = [0.6, 0.4];
      q.mood = u < 2.2 ? 'regal' : u < 4.3 ? 'focus' : u < 5 ? 'shock' : 'delighted';
      q.fx = { kind: 'polish', u, boop };
    }
  } else if (cur.name === 'count') {
    // a point round the room at each of her treasures, counting; all here; proud
    const k = win(u, 0, 0.4, 5.9, 6.4);
    const n = clamp(Math.floor((u - 0.4) / 1.1), -1, 3);
    const pt = win(u, 0.3, 0.6, 4.4, 4.8);
    go({ shN: -95 - n * 10, elN: -15, hwN: -10, tilt: -2 }, pt * k * w);
    if (at(k)) {
      q.look = [[-0.8, 0.2, 1, 0.6][Math.max(0, n)], -0.3];
      q.turn = [0.1, 0.35, 0.6, 0.5][Math.max(0, n)];
      q.mood = u < 4.6 ? 'focus' : 'proud';
      q.fx = { kind: 'count', u, n };
    }
  } else if (cur.name === 'crown') {
    // her crown slips; caught with both hands, set straight; a sheepish look round
    const k = win(u, 0, 0.4, 5.5, 6);
    const slip = win(u, 0.8, 1.1, 2.2, 3.2);
    const fix = win(u, 1.2, 1.5, 3, 3.4);
    q.crownTip = 0.7 * slip;
    go({ shN: -165, elN: -100, hwN: 30, shF: -150, elF: -100, head: -4 }, fix * k * w);
    if (at(k)) {
      q.mood = u < 1.2 ? 'regal' : u < 2 ? 'shock' : u < 3.4 ? 'focus' : 'sheepish';
      q.look = u > 3.4 ? [-0.6, 0] : [0.3, -0.6];
      q.fx = { kind: 'crown', u };
    }
  } else {
    // the door: a hopeful look toward it... nobody; a droop; then the globe hugged to her, a smile
    const k = win(u, 0, 0.5, 6.9, 7.4);
    const hope = win(u, 0.2, 0.6, 3, 3.6);
    const droop = win(u, 3.2, 3.6, 4.6, 5);
    const hug = win(u, 4.8, 5.2, 6.8, 7.3);
    go({ tilt: -4, head: -6 }, hope * k * w);
    go({ head: 12, tilt: 4, shN: -40, elN: -60 }, droop * k * w);
    go({ shF: -110, elF: -110, shN: -70, elN: -120, hwN: 30, head: 6 }, hug * k * w);
    if (hug > 0.1) q.sc = mix(q.sc, -0.3, hug);
    if (at(k)) {
      q.turn = u < 3.4 ? 0.05 : 0.35;
      q.look = u < 3.4 ? [-1, 0] : [0.2, 0.6];
      q.mood = u < 3.2 ? 'delighted' : u < 5 ? 'sad' : 'bliss';
      q.fx = { kind: 'door', u };
    }
  }
}

// ---------- Effects (the rig's space, base px, facing right; drawn live in her own soft style) ----------
export function bubble(ctx, x, y, r, al = 1) {
  if (al <= 0.01 || r <= 0.1) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = 'rgba(230,250,255,0.4)';
  ctx.fill();
  pen(ctx, WATER.sh, Math.max(0.35, r * 0.18));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.62, Math.PI * 1.1, Math.PI * 1.5);
  pen(ctx, 'rgba(255,255,255,0.9)', Math.max(0.3, r * 0.2));
  ctx.stroke();
  ctx.restore();
}
export function heart(ctx, x, y, s, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  pen(ctx, CORAL.ink, Math.max(0.5, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = CORAL.base;
  ctx.fill();
  ell(ctx, x - s * 0.4, y - s * 0.25, s * 0.22, s * 0.14, -0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();
  ctx.restore();
}
function pearlFx(ctx, x, y, r, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ell(ctx, x, y, r, r);
  ctx.fillStyle = PEARL.base;
  ctx.fill();
  pen(ctx, PEARL.ink, Math.max(0.3, r * 0.22));
  ctx.stroke();
  ell(ctx, x - r * 0.35, y - r * 0.35, r * 0.32, r * 0.24);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function splash(ctx, x, y, s, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y - s * 1.4);
  ctx.quadraticCurveTo(x + s, y + s * 0.2, x, y + s);
  ctx.quadraticCurveTo(x - s, y + s * 0.2, x, y - s * 1.4);
  ctx.fillStyle = WATER.base;
  ctx.fill();
  pen(ctx, WATER.ink, Math.max(0.35, s * 0.2));
  ctx.stroke();
  ell(ctx, x - s * 0.3, y - s * 0.1, s * 0.25, s * 0.18, -0.5);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.crQ;
  if (!q) return;
  const t = a.t ?? 0;
  const f = a.flip !== Boolean(a.mo?.rig?.crOuter?.flip) ? -1 : 1;
  const crown = headAt(a, D, [0, -26]);
  const face = headAt(a, D, [6, 4]);
  const hand = ptOf(a, D, 'handN', D.J.handN);
  const G = scepterGeom(a, D);
  const X = q.fx;
  // always: a few little bubbles rising off her tail
  if (m.hp > 0 && X?.kind !== 'exhibit') {
    for (let i = 0; i < 2; i++) {
      const v = (t * 0.3 + hash(i * 3.3 + (m.uid ?? 0))) % 1;
      bubble(ctx, -6 + i * 9 + Math.sin(v * 6 + i) * 2, -8 - v * 30, 0.8 + hash(i) * 0.5, Math.sin(Math.PI * v) * 0.7);
    }
  }
  // her pearl strand, swinging from her near hand
  if (q.strand > 0.02) {
    for (let i = 0; i < 9; i++) {
      const u = i / 8;
      const sw = Math.sin(t * 7 - i * 0.6) * 4 * u;
      pearlFx(ctx, hand[0] + 2 + u * 14 * q.strand + sw * 0.3, hand[1] + 1 + Math.sin(u * Math.PI) * 6 + sw, 1.05, q.strand);
    }
  }
  if (!X) return;
  const u = X.u;
  if (X.kind === 'exhibit') {
    displayCase(ctx, 0, 0, 52, 112, 1);
    plaque(ctx, 0, -5, 1, 'Exhibit No. 1: Me!', f);
    sparkle(ctx, 20, -90 + Math.sin(t * 1.4) * 4, 1.6, 0.7, '#ffffff');
  } else if (X.kind === 'alive') {
    const lift = sstep((u - 0.8) / 0.9);
    displayCase(ctx, 0, 0, 52, 112, 1 - lift, lift * 50);
    plaque(ctx, 0, -5, 1 - sstep((u - 1.2) / 0.6), 'Exhibit No. 1: Me!', f);
    if (u > 0.8 && u < 2.6) for (let i = 0; i < 10; i++) {
      const v = clamp((u - 0.8) * 0.8 - i * 0.04, 0, 1);
      bubble(ctx, -26 + (i % 5) * 13 + Math.sin(v * 5 + i) * 3, -10 - v * 100 - (i >> 1) * 8, 1.4 + hash(i), Math.sin(Math.PI * v));
    }
    if (u > 0.5 && u < 0.95) sparkle(ctx, face[0] - 6, face[1] - 4, 2.4, 1, '#ffffff');
  } else if (X.kind === 'present') {
    for (let i = 0; i < 5; i++) sparkle(ctx, hand[0] + 10 + i * 12, hand[1] - 6 - Math.sin(i + u * 3) * 6, 1.8 * win(u, 0.2 + i * 0.15, 0.4 + i * 0.15, 1.6, 2), 1, '#fff4c8');
    if (u > 0.4 && u < 2) cue(ctx, 'My collection!', crown[0] + 16, crown[1] - 4, 8, f, -0.08, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'keep') {
    sparkle(ctx, G.globe[0], G.globe[1] - 4, 2.6 + Math.sin(t * 8) * 0.6, 1, '#e8fbff');
    if (u > 0.2 && u < 1.2) cue(ctx, 'Mine!', G.globe[0] + 12, G.globe[1] - 12, 8, f, -0.1, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'open') {
    if (u > 0.6 && u < 1.6) for (let i = 0; i < 8; i++) {
      const v = clamp((u - 0.6) * 1.2 - i * 0.03, 0, 1);
      bubble(ctx, G.globe[0] + 10 + Math.cos(i * 0.8) * (6 + v * 20), G.globe[1] - v * 30 + Math.sin(i) * 8, 1.4, 1 - v);
    }
    if (u > 0.6 && u < 0.9) cue(ctx, '*tink*', G.globe[0] + 14, G.globe[1] - 10, 7, f, -0.1, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'release' || X.kind === 'swimup') {
    // the little fish, free: out of the globe, a loop round her, and away up (leading her, swimming up)
    const out = X.kind === 'swimup' ? 1 : sstep((u - 0.9) / 0.3);
    if (out > 0.01) {
      const v = X.kind === 'swimup' ? 1 + u * 0.3 : clamp((u - 0.9) / 1.6, 0, 1);
      const an = v * TAU * 1.2;
      const r = 14 + v * 10;
      const px = X.kind === 'swimup' ? Math.sin(t * 2.4) * 8 : G.globe[0] * (1 - v) + Math.cos(an) * r * v;
      const py = X.kind === 'swimup' ? crown[1] - 18 - Math.sin(t * 1.3) * 3 : G.globe[1] * (1 - v) + (-50 + Math.sin(an) * r * 0.5) * v;
      fish(ctx, px, py, 1.6, Math.cos(an + 0.4) > 0 ? -1 : 1, 0, out);
      for (let i = 0; i < 3; i++) bubble(ctx, px - 4 - i * 3, py + 2 + i * 3, 0.8, (1 - i * 0.3) * out);
    }
    if (X.kind === 'release' && u > 2.2 && u < 3.6) cue(ctx, 'Bye-bye...!', crown[0] + 18, crown[1] - 2, 8, f, -0.08, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'castDecree') {
    sparkle(ctx, G.globe[0], G.globe[1], 1.8 + Math.sin(t * 9) * 0.6, 0.9, '#fff4c8');
  } else if (X.kind === 'rel_decree') {
    const k = clamp(u / 0.5, 0, 1);
    for (let i = 0; i < 6; i++) sparkle(ctx, G.globe[0] + Math.cos(i * 1.05) * (4 + k * 16), G.globe[1] + Math.sin(i * 1.05) * (4 + k * 10), 2 * (1 - k), 1 - k, '#fff4c8');
    if (u < 0.8) cue(ctx, 'Decreed!', G.globe[0] + 14, G.globe[1] - 14, 8, f, -0.1, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'castCases') {
    for (let i = 0; i < 4; i++) {
      const v = (t * 0.6 + i / 4) % 1;
      sparkle(ctx, Math.cos(i * 1.7 + t) * 30, -80 - v * 20, 1.6, Math.sin(Math.PI * v), '#e8fbff');
    }
  } else if (X.kind === 'castWave' || X.kind === 'rel_wave') {
    const k = X.kind === 'castWave' ? sstep(u / 0.5) : 1 - sstep(u / 0.8);
    for (let i = 0; i < 3; i++) sparkle(ctx, hand[0] + Math.cos(t * 3 + i * 2) * 6, hand[1] - 4 + Math.sin(t * 3 + i * 2) * 4, 1.6, k, '#fff4c8');
    if (k > 0.3) cue(ctx, X.kind === 'castWave' ? 'Hello, hello!' : 'Mwah~', crown[0] + 16, crown[1] - 2, 8, f, -0.08, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'castPortrait' || X.kind === 'rel_portrait') {
    if (X.kind === 'castPortrait' && u > 0.5) cue(ctx, 'Say pearls!', crown[0] + 16, crown[1] - 2, 8, f, -0.08, CORAL.ink, '#fff8fa');
    sparkle(ctx, face[0] + 8, face[1] - 6, 2 + Math.sin(t * 7) * 0.5, 0.9, '#fff4c8');
  } else if (X.kind === 'castWalls') {
    if (u > 0.3 && u < 2) cue(ctx, 'Nobody ever leaves!', crown[0] + 10, crown[1] - 4, 7, f, -0.06, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'castStrand' && u > 0.4 && u < 1.6) {
    cue(ctx, 'Hmph!', face[0] + 18, face[1] - 18, 8, f, -0.1, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'pearls') {
    const k = Math.abs(Math.sin(u * 9));
    if (u < 1.1) for (let i = 0; i < 3; i++) sparkle(ctx, hand[0] + Math.cos(i * 2.1) * 7, hand[1] - 6 + Math.sin(i * 2.1) * 5, 2 * k, k, '#fff4c8');
    if (u > 0.9 && u < 1.9) cue(ctx, 'Say pearls!', crown[0] + 18, crown[1] - 4, 9, f, -0.08, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'nobody') {
    if (u > 0.6 && u < 1.9) cue(ctx, 'Nobody ever leaves!', crown[0] + 10, crown[1] - 6, 8, f, -0.06, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'tailslap') {
    if (u > -0.02 && u < 0.45) {
      const k = clamp(u / 0.35, 0, 1);
      ctx.save();
      ctx.globalAlpha *= 1 - k;
      pen(ctx, 'rgba(214,246,255,0.95)', 2.4 * (1 - k * 0.5));
      ctx.beginPath();
      ctx.arc(10, -8, 16 + k * 6, -0.4, 1.1);
      ctx.stroke();
      ctx.restore();
      for (let i = 0; i < 4; i++) splash(ctx, 22 + i * 4 + k * 10, -6 - i * 4 - k * 6, 1.4, 1 - k);
    }
  } else if (X.kind === 'bop') {
    if (u > -0.02 && u < 0.5) {
      const k = clamp(u / 0.4, 0, 1);
      for (let i = 0; i < 5; i++) {
        const an = -Math.PI / 2 + (i - 2) * 0.55;
        bubble(ctx, G.globe[0] + Math.cos(an) * (4 + k * 14), G.globe[1] + Math.sin(an) * (4 + k * 10), 1.4, 1 - k);
      }
      if (u < 0.4) cue(ctx, 'Bop!', G.globe[0] + 10, G.globe[1] - 12, 8, f, -0.1, CORAL.ink, '#fff8fa');
    }
  } else if (X.kind === 'splash') {
    if (u > -0.02 && u < 0.5) {
      const k = clamp(u / 0.45, 0, 1);
      for (let i = 0; i < 5; i++) {
        const an = -0.7 + i * 0.3;
        splash(ctx, hand[0] + 3 + Math.cos(an) * (3 + k * 22), hand[1] - 2 + Math.sin(an) * (3 + k * 14) + k * k * 6, 1.3, 1 - k);
      }
    }
  } else if (X.kind === 'ready') {
    sparkle(ctx, G.globe[0], G.globe[1], 1.4 + Math.sin(t * 9) * 0.5, 0.7 * (X.k ?? 1), '#e8fbff');
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.5, 0, 1);
    pearlFx(ctx, crown[0] - 6 - v * 10, crown[1] + 6 - Math.sin(v * Math.PI) * 8 + v * 10, 1.2, 1 - v);
    sparkle(ctx, face[0] - 4, face[1] - 12, 2.2 * (1 - v), 1 - v, '#ffe0f0');
  } else if (X.kind === 'gloat') {
    const k = win(u, 0, 0.12, 0.6, 0.9);
    heart(ctx, crown[0] + 14 + u * 4, crown[1] + 8 - u * 10, 1.7, k);
    bubble(ctx, crown[0] + 20 + u * 6, crown[1] + 2 - u * 12, 1.2, k);
  } else if (X.kind === 'polish') {
    if (X.u > 1.2 && X.u < 2.2) for (let i = 0; i < 2; i++) ell(ctx, G.globe[0] - 6 - i * 2, G.globe[1] - 2 - (X.u - 1.2) * 4, 1.6 - i * 0.4, 1.2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    if (X.u > 1.2 && X.u < 2.2) ctx.fill();
    if (X.boop > 0.3) heart(ctx, G.globe[0] + 8, G.globe[1] - 8, 2, X.boop);
    if (X.u > 2.5 && X.u < 4) sparkle(ctx, G.globe[0] - 2, G.globe[1] - 2, 1.8, 0.9, '#ffffff');
  } else if (X.kind === 'count') {
    if (X.n >= 0 && u < 4.6) cue(ctx, ['one', 'two', 'three', 'four'][X.n], face[0] + 18, face[1] - 20, 7, f, -0.1, CORAL.ink, '#fff8fa');
    if (u > 4.6 && u < 6) cue(ctx, '...all here.', face[0] + 20, face[1] - 22, 7, f, -0.1, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'crown') {
    if (u > 1.1 && u < 2) cue(ctx, 'eep!', face[0] + 18, face[1] - 22, 8, f, -0.1, CORAL.ink, '#fff8fa');
  } else if (X.kind === 'door') {
    if (u > 1 && u < 3) cue(ctx, '...visitors?', face[0] + 20, face[1] - 22, 7, f, -0.1, CORAL.ink, '#fff8fa');
    if (u > 5.4 && u < 7) heart(ctx, face[0] + 14, face[1] - 16 - (u - 5.4) * 5, 2, win(u, 5.4, 5.6, 6.6, 7));
  } else if (X.kind === 'beaten') {
    // her scepter on the floor beside her, the globe on its side
    ctx.save();
    pen(ctx, GOLD.ink, 2.6);
    ctx.beginPath();
    ctx.moveTo(4, -1.4);
    ctx.lineTo(24, -1.4);
    ctx.stroke();
    pen(ctx, GOLD.base, 1.6);
    ctx.stroke();
    ctx.restore();
    globe(ctx, a, 'line', 29, -4.6, 4.4, LWR);
    globe(ctx, a, 'fill', 29, -4.6, 4.4, LWR);
    for (let i = 0; i < 3; i++) {
      const an = t * 2.6 + (i / 3) * TAU;
      const px = crown[0] + Math.cos(an) * 10;
      const py = crown[1] + 6 + Math.sin(an) * 3;
      if (i % 2) sparkle(ctx, px, py, 1.8, Math.sin(an) > 0 ? 1 : 0.55, '#fff4c8');
      else pearlFx(ctx, px, py, 1.1, Math.sin(an) > 0 ? 1 : 0.55);
    }
  }
}

// ---------- Her dress (the rig's hooks) ----------
const DRESS = {
  id: 'coralie',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['lower'],
  // (behind everything of her: her mantle, her long hair, her tail and fluke, her far hip fin)
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    for (const mode of ['line', 'fill']) {
      mantle(ctx, a, mode, D, LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', a.crQ ?? {}, a.crF, a.crHair ?? {}, LWK / HS);
      ctx.restore();
      tail(ctx, a, mode, D, LWR);
      hipFin(ctx, a, mode, D, -1, LWR);
    }
  },
  over: {
    armF: (ctx, a, mode, S, D) => {
      sleeve(ctx, a, mode, D, 'F', LWK);
      scepter(ctx, a, mode, D, LWR);
    },
    torsoSkin: (ctx, a, mode, S, D) => {
      if (mode === 'fill') bodice(ctx, a, D);
      hipFin(ctx, a, mode, D, 1, LWR);
    },
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.crQ ?? {}, a.crF, a.crHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N', LWK),
  },
  pose,
  fx,
};
const R = dressRig('merqueen', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  const o = a.mo?.rig?.crOuter;
  ctx.save();
  if (o?.flip) ctx.scale(-1, 1);
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.4);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own), her size as drawn and her swimming pace (the base's own at her size).
export const CORALIE_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 300, 240, 260], draw: R.still, rig, noHop: true, ownEmotes: true };
export const CORALIE_SIZE = { w: 60, h: 124, speed: Math.round(R.speed * BIG) };
