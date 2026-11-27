// Astraea, the Star Keeper, on screen (2026-11-27, remade from scratch: the Star Observatory's final boss,
// her story kept, world/observatory.js her new fight). A small, gentle star keeper who has counted the
// stars from the Telescope Crown for a thousand years; every night one falls and is gone, and after the
// brightest fell on festival night she stopped them all. Kind, grand in her own soft way, sad and a little
// sleepy; she keeps count on her star abacus (every bead a star she has counted) and in tally marks
// stitched on her sash. She walks on her own copy of the maiden base (rig.js; body.js `starkeeper`: small,
// a round head a touch big for her, short legs), her head, hair, cloak, clothes and abacus drawn here
// (head.js, dress.js), never the shared face or the hero's body or hair, nothing of Folio's or the twins'.
//   look    warm fair skin; starlight-aqua hair warming to dawn at its ends (a soft fringe of rounded
//           locks above her lashes, a long side lock each side bound with a star bead, the rest down her
//           back to her knees); a long night-sky cloak pinned at her throat with a gold star clasp, its front
//           edges turned back over her shoulders, its hood lowered, hanging behind her to a hem that brushes
//           the floor (a plum night inside sown with
//           gold stars and the Little Mochi's faint lines, dusk rose outside); a periwinkle-lilac dress cut to her with
//           a round cream collar, full bishop sleeves into cream cuffs, a plum sash stitched with gold tally
//           marks and bowed at the back, a skirt to her knees with a plum constellation band and a cream
//           petticoat; cream tights and plum Mary-Janes with star buckles; her star abacus in her near hand.
//           Her own soft outlines in each part's deeper colour; her face bare.
//   faces   (head.js) tareme dusk eyes with a falling-star glint, the whole iris always clear; round brows;
//           a small soft mouth that rests level. Moods: keep (rest), still, count, tally (counting in a fight, brows set), focus, brave, cross,
//           hope, happy, joy, bliss, awe, sleepy, lost, fluster, sad, pout, hurt (> <), dizzy, talk, wink.
//   idle    a 30 s act, only while calm, in pieces that fit her pauses: counting (the abacus held up, a
//           bead flicked over for each star, her lips counting, eyes on the sky: "...998, 999..."); lost
//           count (a bead slips back: she freezes, panics, shakes the abacus, every bead clatters back,
//           a sigh: "...one."); polishing (a breath on her sleeve, one bead polished till it twinkles, held
//           up, a pleased little smile); dozing (her head nods, her eyes close, the abacus droops; a bead
//           clicks, she jolts awake, looks round and counts again, quickly).
//   walk    small careful steps, the abacus held close, her cloak's hem swinging after her.
//   fight   between casts, three swings at the tank in turn: Bead Flick (a star bead flicked off the abacus
//           with her thumb, zipping out: pop), Abacus Swat (swung over her shoulder and down: clack!), Cloak
//           Swirl (a swirl of her night-sky cloak, a crescent of stars swept low at their feet). Her casts
//           (m.castPose, world/observatory.js): tally (the abacus raised, a bead flicked over each second),
//           head / recount (pointing at each of you in turn, counting; flustered, recounting), catch (arms
//           up and open to the sky for the falling star), lights (the abacus held up over her head, every
//           bead alight), chart (the abacus swept across the sky, its beads drawing the constellation),
//           carry (the abacus swung back over her shoulder), fall (her arms opened wide, head back, crying:
//           letting them go), last (the abacus hugged to her heart, eyes shut, then raised high). A phase
//           change (m.phaseAt): Star Charts (a sweep of the abacus round the sky, determined), Let Them Fall
//           (the abacus hugged, tears, then her arms flung open).
//   scenes  her entrance (observatory_astraea): 'count' (counting the stopped stars on her abacus, each
//           flick answered by a twinkle overhead), 'hush' (the abacus hugged close, leaning in: hush!), 'cloak' (her
//           cloak thrown open: its night spreads out behind her, the stars in it all alight), 'attack'
//           (every bead swept across at once: CLACK, a ring of stars). Her ending (observatory_freed):
//           'lost' (looking down at her abacus, its count gone), 'stargaze' (her face lifted to the falling
//           stars, a hand held up to catch one), 'sitwatch' (sat by the telescope, knees up, watching them
//           fall, counting none), then she fades.
//   marks   all her own (`ownEmotes`): a soft "one~" and a bead's twinkle after landing a hit, a bead
//           knocked off the abacus when hurt, a sweat drop when low, and beaten: sat down on the floor,
//           dizzy, the abacus fallen beside her, beads rolled away.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring, dizzy } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { cloak, hood, clasp, mantle, bodice, sashBow, skirt, sleeve, stocking, shoe, abacus, abacusGeom, drawAbacus, AB, enter, ptOf } from './dress.js';
import { softStar } from './looks.js';
import { SKIN, SKIN_INK, GOWN, PLUM, STAR, GOLD } from './palette.js';

const BIG = 2.25;
const LWR = 2 / BIG;
let LWK = 2;
const HS = 1.06;
const HO = [1.0, -12.5];
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

const SWINGS = ['beadflick', 'abacusswat', 'cloakswirl'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.asN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'count', t0: 0.4, len: 8 },
  { name: 'lost', t0: 9, len: 6.6 },
  { name: 'polish', t0: 16.2, len: 6.6 },
  { name: 'doze', t0: 23.2, len: 6.4 },
];
const OPEN_REST = 0;
// (her count at rest: two rods full and a bead on the third)
const REST_COUNT = 9;

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'keep', look: [0.25, -0.15], turn: 0.35, fx: null, sweat: 0, tears: false, abRot: 0, lit: 0, noAb: false, op: OPEN_REST, count: REST_COUNT, armSwing: 0 };
  a.asQ = q;
  a.asUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.3);
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
  if (cp) st.asLastPose = cp;
  const relU = !cast && st.asLastPose && since >= 0 && since < 1.2 ? since : -1;
  const relPose = relU >= 0 ? st.asLastPose : null;
  if (!cast && since >= 1.2) st.asLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.asAtk) {
    st.asN = (st.asN ?? (m.uid ?? 0)) + 1;
    st.asPick = pickSwing(m, st);
  }
  st.asAntic = swinging ? Math.max(anticK, st.asAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.asAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const gloatU = now - (m.gloatAt ?? -9);
  // (her scene acts: the counting and the sitting stay until another act; a fade keeps the last one)
  const STICKY = { count: 1, sitwatch: 1, stargaze: 1 };
  if (act && act.move !== 'fade' && STICKY[act.move]) st.asSticky = act.move;
  else if (act && act.move !== 'fade') st.asSticky = null;
  if (!act) st.asSticky = null;
  const live = act && actU >= 0 && actU < actDur + 0.4 && act.move !== 'fade' ? act.move : null;
  const sceneAct = live ?? st.asSticky ?? null;
  const sceneU = live ? actU : act ? now - (st.asStickyAt ??= act.at) : 0;
  if (live) st.asStickyAt = act.at;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2.2) || sceneAct;

  // At rest: small and still, the abacus held in her near hand before her hip, her far hand easy at her
  // side, her head bowed a touch, her eyes on the sky; breathing, a slow sway.
  go({ tilt: -0.5 + Math.sin(t * 0.7) * 0.5, chest: breath * 0.6, head: 3 + Math.sin(t * 0.55) * 1.2, shN: -16, elN: -52, hwN: 6, shF: 6, elF: 16, hwF: -4 }, 1);
  q.look = [0.25 + Math.sin(t * 0.3) * 0.12, -0.25];
  if (walkW > 0.01) {
    // walking: small careful steps, the abacus held close, her head up
    go({ tilt: 2, head: -1, shN: -26, elN: -70, shF: 10 }, walkW);
    q.look = [0.5, 0];
  }
  // (in a fight her face sets, eased in and out with every other mood: focused as she closes in on you,
  // determined while she stands her ground; calm again once she lets you go)
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy) say(walkW > 0.3 ? 'focus' : 'brave');
  if (m.hp <= 0) {
    // beaten: sat down on the floor, dizzy, the abacus fallen beside her, its beads rolled away
    const u = now - (st.asDeadAt ??= now);
    go({ drop: 0.86, tilt: 6, head: 14, chest: 4, shN: 24, elN: -30, hwN: 20, shF: 36, elF: -10, hwF: 20, fxN: 0.5, fxF: 0.2 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.noAb = true;
    q.op = 0.1;
    q.fx = { kind: 'beaten', u };
  } else st.asDeadAt = undefined;

  if (m.hp > 0) {
    if (sceneAct) sceneOf(sceneAct, sceneU, actDur, go, q, t, say);
    else if (cast) castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say);
    else if (relPose) releaseOf(relPose, relU, go, q, t, say);
    else if (phaseU >= 0 && phaseU < 2.2) {
      const k = win(phaseU, 0, 0.25, 1.8, 2.2);
      if (phase >= 3) {
        // Let Them Fall: the abacus hugged to her heart, tears; then her arms flung open
        const open = sstep((phaseU - 1.1) / 0.4);
        go({ shN: -30, elN: -104, shF: -20, elF: -60, head: 10, tilt: 2 }, k * (1 - open));
        go({ shN: -110, elN: -12, shF: -105, elF: -14, head: -10, tilt: -4 }, k * open);
        q.op = 0.9 * open * k;
        q.tears = true;
        say(open > 0.5 ? 'hope' : 'sad', k);
        q.look = open > 0.5 ? [0.2, -0.9] : [0.1, 0.6];
        q.abRot = open * 0.2;
        q.fx = { kind: 'letgo', u: phaseU };
      } else {
        // Star Charts: a sweep of the abacus round the sky, determined
        const sw = sstep(phaseU / 1.6);
        go({ shN: -120 + sw * 60, elN: -12, tilt: -3, head: -6 }, k);
        q.abRot = Math.PI * (0.74 - sw * 0.4) * k;
        q.lit = 0.8 * k;
        q.look = [0.6, -0.8];
        say('brave', k);
        q.fx = { kind: 'charts', u: phaseU, sw };
      }
    } else if (swinging) {
      const kind = st.asPick ?? 'beadflick';
      // (a heavy Abacus Swat comes down over a longer beat)
      const R = kind === 'abacusswat' ? 0.26 : 0.17;
      const hitK = struck ? (since < R ? sstep(since / R) : 1 - sstep((since - R - 0.15) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.asAntic) * (since < R ? 1 : 0) : sstep(anticK);
      if (kind === 'beadflick') {
        go({ shN: -34, elN: -84, hwN: 20, tilt: -3, head: -2 }, wK);
        go({ shN: -86, elN: -8, hwN: -16, tilt: 6, x: 0.025 }, hitK);
        q.abRot = -0.4 * hitK;
        say(hitK > 0.3 ? 'brave' : 'focus');
      } else if (kind === 'abacusswat') {
        go({ shN: 34, elN: -30, tilt: -7, head: -5, shF: -20 }, wK);
        go({ shN: -98, elN: -8, tilt: 9, head: 3, x: 0.035, shF: 10 }, hitK);
        q.abRot = -0.9 * wK + 1.7 * hitK;
        say(hitK > 0.3 ? 'cross' : 'focus');
      } else {
        go({ tilt: -5, head: -3, shN: -30, elN: -40, shF: -40, elF: -20, turnC: -10 }, wK);
        go({ tilt: 7, head: 2, shN: -60, elN: -10, shF: 30, elF: 10, drop: 0.12, x: 0.02, turnC: 6 }, hitK);
        q.op = 0.45 * wK + 1.05 * hitK;
        say(hitK > 0.3 ? 'brave' : 'focus');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -10, x: -0.02, shN: -40, elN: -90, shF: -20 }, k);
      q.abRot = -0.6 * k;
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.asCalm = mix(st.asCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.asCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.asCalm), t, now, st);
    if (mood && !cast && !relPose && !swinging && !live) {
      q.mood = { angry: 'cross', happy: 'happy', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'still', hurt: 'hurt', surprised: 'lost' }[mood] ?? q.mood;
      if (mood === 'sad' && !sceneAct) {
        go({ head: 10, tilt: 3, shN: -30, elN: -100 }, 1);
        q.tears = true;
      }
    }
    if (!busy && !hurt && gloatU >= 0 && gloatU < 0.9) {
      const k = win(gloatU, 0, 0.12, 0.6, 0.9);
      go({ shN: -36, elN: -82, hwN: 16, head: -3 }, k);
      say('happy', k);
      q.count = REST_COUNT + k;
      q.fx = { kind: 'gloat', u: gloatU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'fluster';
      q.sweat = (t * 0.6) % 1;
      go({ shN: -30, elN: -100 }, 0.6);
    }
    if (m.talking) q.mood = 'talk';
  }
  if (m.asFace) q.mood = m.asFace;
  q.turn = spring(st, 'asTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.keep;
  const f = (st.asF ??= { ...FACES.keep, shut: { happy: 0, calm: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk' || q.mood === 'count' || q.mood === 'tally') {
    const v = VOWELS[Math.floor(t * (q.mood === 'talk' ? 7 : 5)) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] * (q.mood === 'talk' ? 1 : 0.6) };
  }
  const kf = 1 - Math.exp(-dt * 14);
  // (her lids come down over her eyes now, so they ease like a lid: quick to shut, never in a frame;
  // squeezed shut in pain, a snap quicker)
  const shutR = F.shut === 'squeeze' ? 34 : 17;
  for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' || key === 'wk' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? shutR : 13)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.asF = f;
  // Springs: her cloak (its fall, its back hem a beat later, how open, the hood), her skirt, the abacus's
  // swing and its beads, her hair.
  const kick = ((st.asLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.asLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7);
  st.asLast = out.head;
  st.asLastT = out.tilt;
  const arm = (out.shN ?? 0) + (out.elN ?? 0) * 0.5;
  const armKick = clamp(((st.asLastArm ?? arm) - arm) * 0.004, -0.06, 0.06);
  st.asLastArm = arm;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  const sw = spring(st, 'csw', -lean * 1.2 - walkW * 0.55 + Math.sin(t * 0.9) * 0.06, 60, 8, dt, kick * 0.008);
  a.asCloak = {
    sw,
    tr: spring(st, 'ctr', sw * 0.9 - walkW * 0.4 + Math.sin(t * 0.7 + 1) * 0.08, 34, 6, dt),
    op: spring(st, 'cop', q.op, 70, 11, dt),
    hood: spring(st, 'chd', Math.sin(t * 1.3) * 0.15 - lean * 2, 120, 12, dt, kick * 0.01),
  };
  a.asSkirt = spring(st, 'sk', -lean * 1.6 - walkW * 0.6 + Math.sin(t * 1.2) * 0.08, 90, 9, dt, kick * 0.01);
  // (the abacus hangs from her hand: it swings when her arm moves and when she walks, and settles)
  a.asAb = {
    rot: spring(st, 'abr', q.abRot + walkW * Math.sin(t * 6.5) * 0.12 + Math.sin(t * 1.1) * 0.03, 70, 9, dt, armKick + kick * 0.004),
    lit: spring(st, 'abl', q.lit, 60, 14, dt),
    s: 1,
  };
  // (the count: each bead slides over, never jumps)
  const cnt = spring(st, 'cnt', q.count, 70, 16, dt);
  a.asBeads = [0, 1, 2, 3].map((r) => clamp(cnt - r * 4, 0, 4));
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0) + (out.chest ?? 0) * 0.5) * (Math.PI / 180);
  a.asHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.6 + i * 1.9) * 0.02 + headLean * 0.1, 170 + i * 30, 14, dt, kick * 0.003 * (i % 2 ? 1 : -1))),
    slN: spring(st, 'sln', Math.sin(t * 1.1) * 0.05 - headLean * 0.3 + walkW * 0.12, 80, 9, dt, kick * 0.005),
    slF: spring(st, 'slf', Math.sin(t * 1.0 + 2) * 0.05 - headLean * 0.3 + walkW * 0.12, 76, 9, dt, kick * 0.005),
    back: spring(st, 'bk', Math.sin(t * 0.8) * 0.04 - walkW * 0.22 - lean * 0.4, 40, 7, dt, kick * 0.006),
    lean: spring(st, 'bkl', headLean, 70, 12, dt),
    sit: clamp(out.drop ?? 0, 0, 1),
  };
}

// Her scene acts (sceneU: how long into it).
function sceneOf(act, u, dur, go, q, t, say) {
  if (act === 'count') {
    // counting the stopped stars on her abacus, a bead flicked over for each, her eyes on the sky
    const k = sstep(u / 0.6);
    const flick = Math.pow(Math.abs(Math.sin(u * Math.PI * 0.9)), 6);
    go({ shN: -34, elN: -80, hwN: 8 + flick * 14, head: -6, tilt: -1 }, k);
    q.look = [0.3 + Math.sin(u * 0.9) * 0.4, -0.9];
    q.count = REST_COUNT + Math.min(6, Math.floor(u * 0.9) + sstep(((u * 0.9) % 1) / 0.25));
    q.lit = 0.4;
    say('count', k);
    q.fx = { kind: 'count', u };
  } else if (act === 'hush') {
    // the abacus hugged close to her chest, leaning in at you, cheeks puffed: hush!
    const k = win(u, 0, 0.25, dur - 0.3, dur + 0.2);
    go({ shN: -30, elN: -104, hwN: 10, shF: -20, elF: -60, head: -4, tilt: 4, x: 0.01 }, k);
    say('pout', k);
    q.look = [0.9, 0];
    q.fx = { kind: 'hush', u, k };
  } else if (act === 'cloak' || act === 'windup') {
    // her cloak thrown open: its night spreads out behind her, every star in it alight
    const k = win(u, 0, 0.3, dur - 0.1, dur + 0.4);
    go({ shN: -108, elN: -12, shF: -104, elF: -14, tilt: -5, head: -7 }, k);
    q.op = 1.15 * k;
    q.abRot = Math.PI * 0.7 * k;
    q.lit = k;
    say('cross', k);
    q.look = [0.9, -0.2];
    q.fx = { kind: 'cloakopen', u, k };
  } else if (act === 'attack') {
    // every bead swept across at once: CLACK, a ring of stars
    const k = win(u, 0, 0.12, dur - 0.2, dur + 0.3);
    const swp = sstep(u / 0.3);
    go({ shN: -112 + swp * 70, elN: -14 + swp * 4, tilt: -5 + swp * 12, head: -4 + swp * 4, x: 0.02 * swp }, k);
    q.abRot = (2.2 - swp * 3.2) * k;
    q.count = REST_COUNT + 7 * swp;
    q.op = 0.8 * k;
    q.lit = k;
    say('brave', k);
    q.fx = { kind: 'clack', u };
  } else if (act === 'lost') {
    // looking down at the abacus held out in both hands, its count gone
    const k = sstep(u / 0.6);
    go({ shN: -58, elN: -70, shF: -40, elF: -70, head: 12, tilt: 2 }, k);
    q.look = [0.3, 0.9];
    q.count = REST_COUNT * (1 - sstep(u / 1.2));
    say('sad', k);
    q.tears = true;
    q.fx = { kind: 'lostcount', u };
  } else if (act === 'stargaze') {
    // her face lifted to the falling stars, a hand held up to catch one
    const k = sstep(u / 0.8);
    go({ shF: -150, elF: -40, hwF: 20, shN: -30, elN: -70, head: -12, tilt: -3 }, k);
    q.look = [0.2, -1];
    say(Math.sin(t * 0.6) > 0.3 ? 'joy' : 'happy', k);
    q.fx = { kind: 'stargaze', u };
  } else if (act === 'sitwatch') {
    // sat on the floor by the telescope, knees up, watching them fall, counting none
    const k = sstep(u / 1);
    go({ drop: 0.86 * k, tilt: -4, head: -10, chest: -2, shN: -30, elN: -90, shF: -20, elF: -80, fxN: 0.35 * k, fxF: 0.3 * k, fyN: -0.2 * k, fyF: -0.18 * k }, k);
    q.look = [0.3, -1];
    q.noAb = k > 0.5;
    q.op = 0.15;
    say('happy', k);
    q.fx = { kind: 'sitwatch', u };
  }
}

// A cast held (castK: how far through it; wind: its last 0.6 s, gathering).
function castPoseOf(cp, u, castK, wind, go, q, t, say) {
  const k = sstep(u / 0.35);
  if (cp === 'tally') {
    // Tally: the abacus raised before her, a bead flicked over each second, her eyes on the tank
    const flick = Math.pow(Math.max(0, Math.sin(u * Math.PI * 2 - 0.4)), 8);
    go({ shN: -36 - wind * 40, elN: -80 + wind * 60, hwN: 6 + flick * 16, tilt: -2 - 3 * wind, head: -3 }, k);
    q.count = REST_COUNT + Math.min(3, Math.floor(u + 0.15));
    q.lit = 0.5 + 0.5 * wind;
    q.look = [0.8, 0.2];
    say(castK < 0.9 ? 'tally' : 'brave', k);
    q.fx = { kind: 'castTally', u };
  } else if (cp === 'head' || cp === 'recount') {
    // Head Count: pointing at each of you in turn, counting aloud (Recount: flustered, quicker)
    const rate = cp === 'recount' ? 3.4 : 2.2;
    const beat = Math.pow(Math.abs(Math.sin(u * rate)), 3);
    go({ shN: -84 + Math.sin(u * rate * 0.5) * 12, elN: -10 - beat * 6, hwN: -10, tilt: -1, head: -2 }, k);
    q.look = [Math.sin(u * rate * 0.5) * 0.9, 0.1];
    q.turn = 0.35 + Math.sin(u * rate * 0.5) * 0.15;
    q.abRot = -0.15;
    q.count = REST_COUNT + Math.min(4, Math.floor(u * rate / Math.PI));
    say(cp === 'recount' ? 'fluster' : 'tally', k);
    q.fx = { kind: cp === 'recount' ? 'castRecount' : 'castHead', u };
  } else if (cp === 'catch') {
    // Catch a Falling Star: arms up and open to the sky, the abacus held up out of the way
    go({ shN: -114, elN: -14, shF: -110, elF: -16, tilt: -4, head: -10 }, k);
    q.abRot = Math.PI * 0.7;
    q.look = [0.4, -1];
    say(castK < 0.6 ? 'hope' : 'awe', k);
    q.fx = { kind: 'castCatch', u };
  } else if (cp === 'lights') {
    // A Thousand Lights: the abacus held up over her head in both hands, every bead alight
    go({ shN: -120, elN: -10, shF: -112, elF: -14, tilt: -3 - 2 * wind, head: -8 }, k);
    q.abRot = Math.PI * 0.74;
    q.lit = k;
    q.count = REST_COUNT + castK * 7;
    q.look = [0.2, -1];
    say('tally', k);
    q.fx = { kind: 'castLights', u };
  } else if (cp === 'chart') {
    // Star Chart: the abacus swept across the sky, its beads drawing the constellation
    const sw = Math.sin(u * 1.9);
    go({ shN: -100 + sw * 20, elN: -12, shF: -40, elF: -30, tilt: -3, head: -8 }, k);
    q.abRot = Math.PI * (0.68 + sw * 0.08);
    q.lit = 0.8 * k;
    q.look = [0.5 + sw * 0.4, -0.9];
    say('brave', k);
    q.op = 0.4 * k;
    q.fx = { kind: 'castChart', u };
  } else if (cp === 'carry') {
    // Carry the One: the abacus swung back over her shoulder, held there, gathering
    go({ shN: 38 + wind * 8, elN: -18, tilt: -6 - wind * 3, head: -5, shF: -20, elF: -20 }, k);
    q.abRot = -0.9 - wind * 0.3;
    q.lit = 0.4 + 0.6 * wind;
    say('brave', k);
    q.look = [0.9, 0.2];
    q.fx = { kind: 'castCarry', u };
  } else if (cp === 'fall') {
    // Let Them Fall: her arms opened wide, head back, crying: letting them go
    go({ shN: -104, elN: -12, shF: -100, elF: -12, tilt: -4, head: -12 }, k);
    q.op = 0.95 * k;
    q.tears = true;
    q.look = [0.2, -1];
    say(castK < 0.7 ? 'sad' : 'hope', k);
    q.fx = { kind: 'castFall', u };
  } else if (cp === 'last') {
    // The Last Count: the abacus hugged to her heart, eyes shut, then raised high
    const up = sstep((castK - 0.75) / 0.25);
    go({ shN: -30, elN: -104, shF: -40, elF: -100, head: 8, tilt: 2 }, k * (1 - up));
    go({ shN: -118, elN: -10, shF: -40, elF: -40, head: -8, tilt: -4 }, k * up);
    q.abRot = Math.PI * 0.74 * up;
    q.lit = 0.4 + 0.6 * up;
    q.count = REST_COUNT + Math.floor(castK * 3.99) * 2;
    say(up > 0.5 ? 'brave' : 'bliss', k);
    q.fx = { kind: 'castLast', u, up };
  }
}
function releaseOf(rp, u, go, q, t, say) {
  const k = win(u, 0, 0.08, 0.7, 1.2);
  if (rp === 'tally') {
    go({ shN: -80, elN: -12, hwN: -20, tilt: 5 }, k);
    say('brave', k);
  } else if (rp === 'head' || rp === 'recount') {
    go({ shN: -60, elN: -100, tilt: -1 }, k);
    say(rp === 'recount' ? 'pout' : 'still', k);
  } else if (rp === 'catch') {
    go({ shN: -96, elN: -20, shF: -96, elF: -24, head: -4 }, k);
    q.abRot = Math.PI * 0.6 * (1 - sstep(u / 0.8));
    say('joy', k);
  } else if (rp === 'lights') {
    go({ shN: -60, elN: -30, shF: -60, elF: -40, tilt: 4 }, k);
    q.abRot = Math.PI * 0.74 * (1 - sstep(u / 0.5));
    q.lit = 1 - sstep(u / 0.8);
    say('bliss', k);
  } else if (rp === 'chart') {
    go({ shN: -60, elN: -30, tilt: 3, head: 2 }, k);
    say('brave', k);
  } else if (rp === 'carry') {
    go({ shN: -104, elN: -6, tilt: 9, head: 3, x: 0.03 }, k);
    q.abRot = 1.6 * (1 - sstep((u - 0.3) / 0.6));
    say('cross', k);
  } else if (rp === 'fall') {
    go({ shN: -116, elN: -12, shF: -112, elF: -14, head: -12 }, k);
    q.op = 1.1 * (1 - sstep(u / 1.2));
    q.tears = true;
    say('hope', k);
  } else if (rp === 'last') {
    go({ shN: -100, elN: -20, tilt: 4 }, k);
    q.abRot = Math.PI * 0.74 * (1 - sstep(u / 0.6));
    say('brave', k);
  }
  q.fx = { kind: `rel_${rp}`, u };
}

function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.asPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.asPiece = cur.name;
      else return;
    }
  } else {
    st.asPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'count') {
    // the abacus held up, a bead flicked over for each star, her lips counting, her eyes on the sky
    const k = win(u, 0, 0.6, 7.4, 8);
    const flick = Math.pow(Math.abs(Math.sin(u * Math.PI * 0.8)), 6);
    go({ shN: -34, elN: -80, hwN: 8 + flick * 12, head: -6, tilt: -1 }, k * w);
    if (at(k)) {
      q.count = REST_COUNT + Math.min(5, Math.floor(u * 0.8));
      q.look = [0.25 + Math.sin(u * 0.7) * 0.35, -0.95];
      q.mood = u > 6.2 ? 'still' : 'count';
      q.lit = 0.3;
      q.fx = { kind: 'idlecount', u };
    }
  } else if (cur.name === 'lost') {
    // a bead slips back: she freezes, panics, shakes the abacus, every bead clatters back; a sigh;
    // "...one."
    const k = win(u, 0, 0.4, 6.1, 6.6);
    const shake = win(u, 1.8, 2, 3, 3.2);
    go({ shN: -34 - shake * 10 * Math.sin(u * 30), elN: -80, hwN: 10, head: -2 + win(u, 3.6, 4, 4.8, 5.2) * 14, tilt: -1 }, k * w);
    if (at(k)) {
      q.abRot = shake * Math.sin(u * 30) * 0.25;
      q.count = u < 0.8 ? REST_COUNT + 5 : u < 1.8 ? REST_COUNT + 4 : u < 3.2 ? REST_COUNT + 4 - 13 * sstep((u - 2) / 1) : u < 5.4 ? 0 : 1;
      q.look = u < 1.8 ? [0.2, 0.8] : u < 3.2 ? [Math.sin(u * 9) * 0.6, 0.6] : [0.1, 0.5];
      q.mood = u < 0.8 ? 'count' : u < 1.8 ? 'lost' : u < 3.2 ? 'fluster' : u < 5.2 ? 'sad' : 'brave';
      q.fx = { kind: 'idlelost', u };
    }
  } else if (cur.name === 'polish') {
    // a breath on one bead, polished on her sleeve till it twinkles, held up, a pleased little smile
    const k = win(u, 0, 0.5, 6.1, 6.6);
    const rub = win(u, 1.6, 1.9, 3.4, 3.7);
    const up = win(u, 3.9, 4.3, 5.7, 6.1);
    go({ shN: -36 + rub * Math.sin(u * 16) * 8 - up * 60, elN: -88 + up * 70, hwN: 10, shF: -30, elF: -70, head: 6 - up * 10 }, k * w);
    if (at(k)) {
      q.look = up > 0.3 ? [0.6, -0.6] : [0.5, 0.7];
      q.mood = u < 1.5 ? 'pout' : u < 3.7 ? 'focus' : up > 0.3 ? 'bliss' : 'happy';
      q.lit = up;
      q.fx = { kind: 'idlepolish', u };
    }
  } else {
    // her head nods, her eyes close, the abacus droops; a bead clicks: she jolts awake, looks round,
    // and counts again, quickly
    const k = win(u, 0, 0.5, 5.9, 6.4);
    const nod = win(u, 0.6, 2, 3.2, 3.36);
    const jolt = win(u, 3.3, 3.4, 3.8, 4.4);
    go({ head: 14 * nod - 8 * jolt, tilt: 2 * nod - 3 * jolt, shN: -16 + 8 * nod - 30 * jolt, elN: -50 + 20 * nod - 40 * jolt }, k * w);
    if (at(k)) {
      q.abRot = -0.2 * nod;
      q.look = u < 3.3 ? [0.2, 0.4] : u < 4.6 ? [Math.sin(u * 7) * 0.9, -0.2] : [0.3, -0.9];
      q.turn = u > 3.4 && u < 4.6 ? 0.35 + Math.sin(u * 7) * 0.25 : 0.35;
      q.mood = u < 0.8 ? 'still' : u < 3.3 ? 'sleepy' : u < 3.9 ? 'lost' : u < 4.6 ? 'fluster' : 'count';
      q.count = u < 4.6 ? REST_COUNT : REST_COUNT + Math.min(2, Math.floor((u - 4.6) * 2));
      q.fx = { kind: 'idledoze', u };
    }
  }
}

// ---------- Effects (the rig's space, base px, facing right; drawn live in her own soft style) ----------
function bead(ctx, x, y, r, al = 1, lit = 0.6) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 3, STAR.glow, 0.45 * lit);
  const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, 0, x, y, r * 1.1);
  g.addColorStop(0, '#fffbe6');
  g.addColorStop(0.55, '#ffe9a0');
  g.addColorStop(1, '#f0c060');
  ell(ctx, x, y, r * 1.08, r);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, '#c89a48', Math.max(0.25, r * 0.18));
  ctx.stroke();
  ell(ctx, x - r * 0.38, y - r * 0.42, r * 0.26, r * 0.2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
const INKC = PLUM.deep;
function fx(ctx, m, a, S, matOf, D) {
  const q = a.asQ;
  if (!q) return;
  const t = a.t ?? 0;
  const f = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -24]);
  const face = headAt(a, D, [6, 4]);
  const AG = abacusGeom(a, D);
  // (the abacus's middle, wherever it hangs)
  const abMid = [AG.x - Math.sin(AG.rot) * AB.h * AG.s * 0.5, AG.y + Math.cos(AG.rot) * AB.h * AG.s * 0.5];
  const X = q.fx;
  // always: a couple of soft motes of starlight drifting up off her beads
  if (m.hp > 0 && !q.noAb) {
    for (let i = 0; i < 2; i++) {
      const v = (t * 0.3 + hash(i * 3.3 + (m.uid ?? 0))) % 1;
      sparkle(ctx, abMid[0] - 3 + i * 6 + Math.sin(v * 6 + i) * 2, abMid[1] - 4 - v * 16, 0.9 + (a.asAb?.lit ?? 0) * 0.6, Math.sin(Math.PI * v) * (0.5 + (a.asAb?.lit ?? 0) * 0.5), STAR.lt);
    }
  }
  if (!X) return;
  const u = X.u;
  const say = (text, x, y, size = 7, tilt = -0.08) => cue(ctx, text, x, y, size, f, tilt, INKC, '#fffaf0');
  switch (X.kind) {
    case 'count':
    case 'idlecount': {
      // each flick answered by a twinkle overhead
      const beat = (u * (X.kind === 'count' ? 0.9 : 0.8)) % 1;
      if (beat < 0.5) sparkle(ctx, crown[0] + 6 + Math.sin(Math.floor(u) * 2.1) * 14, crown[1] - 14 - Math.cos(Math.floor(u) * 1.3) * 6, 2.2 * (1 - beat * 2), 1 - beat * 2, STAR.lt);
      if (X.kind === 'idlecount' && u > 6.2 && u < 7.6) say('...998, 999...', crown[0] + 16, crown[1] - 4, 7);
      if (X.kind === 'count' && (u % 6) > 2 && (u % 6) < 4) say('...ninety-seven...', crown[0] + 18, crown[1] - 4, 7);
      break;
    }
    case 'hush':
      if (u > 0.2 && u < 2) say('Hush!', face[0] + 14, face[1] - 18, 8, -0.12);
      break;
    case 'cloakopen': {
      for (let i = 0; i < 9; i++) {
        const an = -Math.PI * 0.95 + (i / 8) * Math.PI * 0.8;
        const r = 26 + (i % 3) * 7;
        sparkle(ctx, -6 + Math.cos(an) * r, -30 + Math.sin(an) * r * 0.9, 1.6 + Math.sin(t * 5 + i) * 0.4, X.k, i % 2 ? STAR.lt : GOLD.lt);
      }
      break;
    }
    case 'clack': {
      if (u > 0.2 && u < 1.1) say('CLACK!', abMid[0] + 10, abMid[1] - 14, 9, -0.1);
      const v = clamp((u - 0.2) / 0.8, 0, 1);
      if (u > 0.2) for (let i = 0; i < 10; i++) {
        const an = (i / 10) * TAU;
        softStar(ctx, abMid[0] + Math.cos(an) * (6 + v * 34), abMid[1] + Math.sin(an) * (4 + v * 20), 2.2 * (1 - v * 0.5), an + v * 3, 1 - v, 0.6);
      }
      break;
    }
    case 'lostcount':
      for (let i = 0; i < 4; i++) {
        const v = clamp(u * 0.5 - i * 0.12, 0, 1);
        bead(ctx, abMid[0] + 2 + i * 4 + v * 8, abMid[1] + 2 + v * 14 - Math.sin(v * Math.PI) * 6, 0.9, 1 - sstep((v - 0.8) / 0.2));
      }
      break;
    case 'stargaze': {
      const hand = ptOf(a, D, 'handF', D.J.handF);
      sparkle(ctx, hand[0] + 1, hand[1] - 4 - Math.sin(t * 2) * 1, 1.8 + Math.sin(t * 6) * 0.4, 0.9, STAR.lt);
      break;
    }
    case 'sitwatch':
      // the abacus set down beside her, quiet
      drawAbacus(ctx, a, 'line', 14, -AB.h * AB.s - 0.2, 0, a.asBeads, 0.2, AB.s, LWR);
      drawAbacus(ctx, a, 'fill', 14, -AB.h * AB.s - 0.2, 0, a.asBeads, 0.2, AB.s, LWR);
      break;
    case 'letgo':
      if (u > 0.2 && u < 1.1) say('...', face[0] + 12, face[1] - 18, 8);
      if (u > 1.2 && u < 2.2) say('Then fall!', crown[0] + 16, crown[1] - 6, 8, -0.06);
      if (u > 1.1) for (let i = 0; i < 6; i++) {
        const v = clamp((u - 1.1) / 1 - i * 0.06, 0, 1);
        softStar(ctx, -20 + i * 9, -70 + v * 30 + Math.sin(i * 2) * 6, 2.4, v * 2 + i, Math.sin(Math.PI * v), 0.6);
      }
      break;
    case 'charts': {
      // the abacus's beads leaving a gold trail round the sky
      const pts = [];
      for (let i = 0; i <= 10; i++) {
        const an = Math.PI * (1.05 + i * 0.07 * clamp(X.sw * 1.3, 0, 1));
        pts.push([4 + Math.cos(an) * -20, -44 + Math.sin(an) * 22]);
      }
      pen(ctx, `rgba(255,236,170,${0.7 * (1 - sstep((u - 1.6) / 0.6))})`, 1);
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.stroke();
      for (let i = 0; i < pts.length; i += 3) sparkle(ctx, pts[i][0], pts[i][1], 1.6, 1 - sstep((u - 1.6) / 0.6), STAR.lt);
      if (u > 0.3 && u < 2) say('Star charts!', crown[0] + 16, crown[1] - 6, 8, -0.06);
      break;
    }
    case 'castTally':
      if (u > 0.2) say(['one...', 'two...', 'three!'][Math.min(2, Math.floor(u))], crown[0] + 16, crown[1] - 4, 8);
      break;
    case 'castHead':
      if (u > 0.2) say(['one,', 'two,', 'three,', 'four...'][Math.floor(u * 2.2 / Math.PI) % 4], crown[0] + 16, crown[1] - 4, 7);
      break;
    case 'castRecount':
      if (u > 0.2) say(u < 1 ? 'wait...' : 'recount!', crown[0] + 16, crown[1] - 4, 8);
      break;
    case 'castCatch':
      if (u > 0.3) say('catch it!', crown[0] + 16, crown[1] - 6, 8);
      break;
    case 'castLights':
      softStar(ctx, abMid[0], abMid[1] - 6, 2 + Math.sin(t * 8) * 0.4, 1, 1);
      break;
    case 'castChart':
      for (let i = 0; i < 4; i++) {
        const v = (u * 0.8 + i / 4) % 1;
        sparkle(ctx, abMid[0] - v * 18 + i * 2, abMid[1] - 2 + Math.sin(v * 5 + i) * 6, 1.6 * (1 - v), 1 - v, GOLD.lt);
      }
      if (u > 0.3 && u < 2.4) say('Star chart!', crown[0] + 16, crown[1] - 6, 8);
      break;
    case 'castCarry':
      if (u > 0.3) say('...carry the one!', crown[0] + 16, crown[1] - 6, 7);
      break;
    case 'castFall':
      if (u > 0.4) say('...let them fall.', crown[0] + 14, crown[1] - 6, 7);
      for (let i = 0; i < 4; i++) {
        const v = (u * 0.5 + i / 4) % 1;
        softStar(ctx, -26 + i * 16, -80 + v * 40, 2, i + v, Math.sin(Math.PI * v), 0.5);
      }
      break;
    case 'castLast':
      if (u > 0.3) say(X.up > 0.5 ? 'The last count!' : '...three... two...', crown[0] + 16, crown[1] - 6, 7);
      break;
    case 'rel_catch':
      if (u < 0.9) for (let i = 0; i < 5; i++) sparkle(ctx, face[0] - 10 + i * 6, face[1] - 22 - u * 10 - (i % 2) * 4, 1.6, 1 - u / 0.9, STAR.lt);
      break;
    case 'rel_carry':
    case 'abacusswat':
      if (u > -0.02 && u < 0.5) {
        const k = clamp(u / 0.4, 0, 1);
        if (u < 0.35) say('clack!', abMid[0] + 10, abMid[1] - 12, 8, -0.1);
        for (let i = 0; i < 4; i++) sparkle(ctx, abMid[0] + 4 + Math.cos(i * 1.6) * k * 12, abMid[1] + Math.sin(i * 1.6) * k * 7, 1.8 * (1 - k * 0.5), 1 - k, STAR.lt);
      }
      break;
    case 'beadflick':
      if (u > -0.02 && u < 0.45) {
        const k = clamp(u / 0.3, 0, 1);
        const hand = ptOf(a, D, 'handN', D.J.handN);
        bead(ctx, hand[0] + 3 + k * 26, hand[1] - 2 - Math.sin(k * Math.PI) * 5, 1, 1 - sstep((u - 0.3) / 0.15), 1);
        if (k > 0.9) sparkle(ctx, hand[0] + 30, hand[1] - 2, 2.6 * (1 - (u - 0.3) / 0.15), 1, STAR.lt);
        if (u > 0.28 && u < 0.45) say('pop!', hand[0] + 30, hand[1] - 12, 7);
      }
      break;
    case 'cloakswirl':
      if (u > -0.02 && u < 0.55) {
        const k = clamp(u / 0.5, 0, 1);
        pen(ctx, `rgba(255,240,184,${0.8 * (1 - k)})`, 1.6);
        ctx.beginPath();
        ctx.arc(2, -8, 18 + k * 14, -0.9, 0.5);
        ctx.stroke();
        for (let i = 0; i < 6; i++) softStar(ctx, 10 + k * 26 + i * 3, -3 - i * 2.4 + Math.sin(k * 6 + i) * 2, 1.6, i + k * 4, 1 - k, 0.5);
      }
      break;
    case 'ready':
      sparkle(ctx, abMid[0], abMid[1], 1.2 + Math.sin(t * 9) * 0.4, 0.7 * (X.k ?? 1), STAR.lt);
      break;
    case 'hurt': {
      const v = clamp(u / 0.5, 0, 1);
      bead(ctx, abMid[0] + 2 + v * 10, abMid[1] - Math.sin(v * Math.PI) * 10 + v * 8, 0.9, 1 - v);
      sparkle(ctx, face[0] - 4, face[1] - 12, 2 * (1 - v), 1 - v, '#ffe8f4');
      break;
    }
    case 'gloat': {
      const k = win(u, 0, 0.12, 0.6, 0.9);
      say('one~', face[0] + 14 + u * 4, face[1] - 16 - u * 8, 7);
      sparkle(ctx, abMid[0] + 2, abMid[1] - 2, 1.6, k, STAR.lt);
      break;
    }
    case 'idlelost':
      if (u > 0.9 && u < 1.9) say('!!', face[0] + 12, face[1] - 18, 9, -0.12);
      if (u > 2 && u < 3.2) for (let i = 0; i < 3; i++) say('clack', abMid[0] + 6 + i * 4, abMid[1] - 6 - i * 5 - Math.sin(u * 12 + i) * 1, 5, -0.2 + i * 0.1);
      if (u > 3.8 && u < 5.2) say('...oh no.', face[0] + 16, face[1] - 18, 7);
      if (u > 5.3 && u < 6.4) say('...one.', face[0] + 14, face[1] - 18, 7);
      break;
    case 'idlepolish':
      if (u > 0.6 && u < 1.6) say('hah~', face[0] + 12, face[1] - 14, 7);
      if (u > 4) sparkle(ctx, abMid[0] + 3, abMid[1] - 3, 2.4 + Math.sin(t * 10) * 0.5, win(u, 4, 4.3, 5.8, 6.2), STAR.lt);
      break;
    case 'idledoze':
      if (u > 1 && u < 3.3) say('zz', face[0] + 12 + Math.sin(u * 2) * 2, face[1] - 18 - (u - 1) * 3, 7, 0.1);
      if (u > 3.3 && u < 3.9) say('*click*', abMid[0] + 10, abMid[1] - 6, 6);
      if (u > 4.6 && u < 6) say('...one, two...', face[0] + 16, face[1] - 18, 7);
      break;
    case 'beaten': {
      // the abacus fallen on the floor beside her, its beads rolled away; little stars round her head
      drawAbacus(ctx, a, 'line', 22, -4.4, Math.PI / 2, [4, 2, 1, 3], 0, AB.s, LWR);
      drawAbacus(ctx, a, 'fill', 22, -4.4, Math.PI / 2, [4, 2, 1, 3], 0, AB.s, LWR);
      for (let i = 0; i < 4; i++) bead(ctx, 32 + i * 5 + hash(i) * 3, -0.9, 0.9, 1, 0.4);
      dizzy(ctx, crown[0], crown[1] + 6, 10, t, 3);
      break;
    }
    default:
      break;
  }
}

// ---------- Her dress (the rig's hooks) ----------
const DRESS = {
  id: 'astraea',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  // (behind everything of her: her cloak and its hood, then her long hair falling down her back)
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    const q = a.asQ ?? {};
    for (const mode of ['line', 'fill']) {
      cloak(ctx, a, mode, D, LWR);
      hood(ctx, a, mode, D, LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', q, a.asF, a.asHair ?? {}, LWK / HS);
      ctx.restore();
    }
  },
  over: {
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F', LWR),
    legF: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'F', LWR),
    footFskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'F', LWR),
    legN: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'N', LWR),
    footNskin: (ctx, a, mode, S, D) => shoe(ctx, a, mode, D, 'N', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      sashBow(ctx, a, mode, D, LWR);
      if (mode === 'fill') bodice(ctx, a, D);
      else if (a.blTorsoPts) {
        ctx.beginPath();
        a.blTorsoPts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
        ctx.closePath();
        pen(ctx, GOWN.ink, LWR);
        ctx.stroke();
      }
      skirt(ctx, a, mode, D, LWR);
    },
    neckSkin: (ctx, a, mode, S, D) => {
      mantle(ctx, a, mode, D, LWR, 'N');
      clasp(ctx, a, mode, D, LWR);
    },
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.asQ ?? {}, a.asF, a.asHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N', LWR),
    handNskin: (ctx, a, mode, S, D) => abacus(ctx, a, mode, D, LWR),
  },
  pose,
  fx,
};
const R = dressRig('starkeeper', DRESS);
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
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own), her size as drawn and her walking pace (the base's own at her size).
export const ASTRAEA_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 320, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const ASTRAEA_SIZE = { w: 56, h: 118, speed: Math.round(R.speed * BIG) };
