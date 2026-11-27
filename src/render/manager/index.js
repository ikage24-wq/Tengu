// The Night Manager on screen (remade 2026-11-27 from scratch: Act III of the Dream Theatre, the Queen's
// manager from her old life, the overtime boss of her dream; world/theatre.js his new fight). A tall, lanky
// young manager who never goes home and always has just one more thing: cheerful, tireless, a little smug,
// running on coffee. He walks on his own copy of the blank bases' grown-up (rig.js; body.js `manager`), his
// head, hair, glasses and clothes drawn here (head.js, dress.js), never the shared face or the hero's body or
// hair, nothing of another boss's.
//   look    fair skin; warm cocoa hair (an even blunt fringe of four sections above his brows, a short side
//           lock each side outside his glasses, neat at the nape, one soft curl on his crown like a wisp of
//           coffee steam); round copper glasses; a white shirt cut to him, its sleeves rolled under the elbow,
//           navy braces, a loosened crimson tie, a blue lanyard with his ID card (his photo: asleep at his
//           desk); a honey-mustard cardigan thrown over his shoulders, its body hanging down his back, its
//           sleeves knotted on his chest; charcoal slacks, chestnut penny loafers. His travel mug in his near
//           hand, always level; his clipboard in his far hand. Soft own-colour outlines; his face bare.
//   faces   (head.js) wide, softly squared coffee eyes set dead level, a latte-art heart for a glint, the
//           whole iris always clear; round brows; a polite closed mouth. Moods: desk (rest), service, keen,
//           onemore, smug, stern, cross, shout, sip, bliss, tired, yawn, sleepy, shock, fluster, hurt (> <),
//           dizzy, sad, talk, happy, focus.
//   idle    a 30 s act, only while calm, in pieces: sip (the mug to his lips, his glasses fog up white, "ahh",
//           the fog clearing); the watch (he turns his mug hand to read his watch, the mug tips, he catches
//           it, sighs); the checklist (the clipboard up, each item ticked with a clink of his mug, then a
//           pleased little grin: "...and one more thing."); the stretch (props raised out to the sides, a
//           yawn he fights, a shake of the head, "Focus.").
//   walk    a brisk office power-walk, the mug held level out in front, the clipboard swinging.
//   fight   between casts, three swings at the tank in turn: Clipboard Swat (up beside his head and down:
//           whap!), Mug Jab (thrust out, the coffee sloshing over the rim), Backhand (the clipboard swept
//           low across: tsk). His casts (m.castPose, world/theatre.js): sync (the clipboard held up beside
//           his head, tapped, then slammed down), replyall (the clipboard held like a tablet, a jab of the
//           mug at send, then flung out), circle (the mug drawing a circle in the air, steam trailing it,
//           then pointing down), huddle (arms open wide: bring it in, team), delegate (the clipboard up,
//           pointing at each of you in turn), clock (the mug hand turned to read his watch, his foot tapping,
//           then pointing across the floor), onemore (the mug raised in a toast, finger up, grinning, then
//           both arms flung up). Phase moments (m.phaseAt): Overtime (a long gulp, head back, glasses fogged
//           white, then the mug thumped forward, steam pouring off him: "Intermission? No."), One More Thing
//           (he loosens his tie, rolls his neck, an eager grin).
//   scenes  his entrance (theatre_mugboss): 'sip' (a sip at his desk, glasses fogging), 'keen' (he turns,
//           delighted, a finger up: one more thing!), 'stack' (a tower of folders hauled up beside him out of
//           nowhere, wobbling), 'attack' (the clipboard swatted down: the tower topples, pages everywhere).
//   marks   all his own (`ownEmotes`): "Noted." and a tick after landing a hit, a sticky note knocked off his
//           board when hurt, sweat and fogged glasses when low, and beaten: sat down on the floor with his
//           back straight, his glasses slid down his nose, nodding off, the mug set down beside him still
//           steaming, the clipboard on his knees.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring, dizzy, steam } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { shirt, collar, tie, lanyard, sleeve, slacks, loafer, knitBack, knitFront, mug, mugGeom, drawMug, MG, clipboard, drawBoard, enter, ptOf } from './dress.js';
import { SKIN, SKIN_INK, NOTE, COFFEE, MUG, KNIT } from './palette.js';

const BIG = 1.5;
const LWR = 2 / BIG;
let LWK = 2;
const HS = 0.96;
const HO = [1.2, -12.8];
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

const SWINGS = ['swat', 'jab', 'backhand'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.mgN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'sip', t0: 0.4, len: 6.6 },
  { name: 'watch', t0: 7.6, len: 6.4 },
  { name: 'list', t0: 14.4, len: 7.4 },
  { name: 'stretch', t0: 22.2, len: 6.6 },
];
const CYCLE = 30;
// (his mug at rest: held out in front of his belt; his board hanging at his side)
const REST = { shN: -22, elN: -62, hwN: 4, shF: 8, elF: 14, hwF: -6 };
const BOARD_DOWN = 1.35;

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'desk', look: [0.35, 0], turn: 0.35, fx: null, sweat: 0, fog: 0, slip: 0, mugRot: 0, lid: 0, boardRot: BOARD_DOWN, ticks: 2, noMug: false, noBoard: false };
  a.mgQ = q;
  a.mgUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const walkW = m.cine ? 0 : clamp(a.walkW ?? 0, 0, 1);
  const breath = Math.sin(t * 1.25);
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
  if (cp) st.mgLastPose = cp;
  const relU = !cast && st.mgLastPose && since >= 0 && since < 1.1 ? since : -1;
  const relPose = relU >= 0 ? st.mgLastPose : null;
  if (!cast && since >= 1.1) st.mgLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.mgAtk) {
    st.mgN = (st.mgN ?? (m.uid ?? 0)) + 1;
    st.mgPick = pickSwing(m, st);
  }
  st.mgAntic = swinging ? Math.max(anticK, st.mgAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.mgAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const gloatU = now - (m.gloatAt ?? -9);
  // (his scene acts: the stack stays beside him until another act)
  const STICKY = { stack: 1 };
  if (act && STICKY[act.move]) st.mgSticky = act.move;
  else if (act) st.mgSticky = null;
  if (!act) st.mgSticky = null;
  const live = act && actU >= 0 && actU < actDur + 0.4 ? act.move : null;
  const sceneAct = live ?? st.mgSticky ?? null;
  const sceneU = live ? actU : act ? now - (st.mgStickyAt ??= act.at) : 0;
  if (live) st.mgStickyAt = act.at;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2.4) || sceneAct;

  // At rest: tall and easy, his weight on one hip, the mug held out level before his belt, the clipboard at
  // his side; breathing, a little sway, a slow bob of the head as if to music only he hears.
  go({ tilt: 0.6 + Math.sin(t * 0.6) * 0.6, chest: breath * 0.7, head: 2 + Math.sin(t * 0.5) * 1.4, pelvis: 1.2, ...REST }, 1);
  q.look = [0.4 + Math.sin(t * 0.27) * 0.2, 0.05];
  if (walkW > 0.01) {
    // the power-walk: leaning in, chin up, the mug held level out in front, the board swinging
    const sw = Math.sin(t * 7.2);
    go({ tilt: 4, head: -3, shN: -40, elN: -54, shF: 18 * sw, elF: 10 + 6 * sw }, walkW);
    q.boardRot = mix(BOARD_DOWN, BOARD_DOWN - sw * 0.25, walkW);
    q.look = [0.6, 0];
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say('focus');
  if (m.hp <= 0) {
    // beaten: sat down on the floor with his back straight, nodding off, glasses slid down his nose; the mug
    // set down beside him, the clipboard on his knees
    const u = now - (st.mgDeadAt ??= now);
    go({ drop: 0.84, tilt: 3, head: 10 + Math.sin(u * 1.4) * 5, chest: 2, shN: -26, elN: -70, hwN: 10, shF: -24, elF: -60, fxN: 0.5, fxF: 0.3 });
    q.mood = u < 0.9 ? 'dizzy' : 'sleepy';
    q.turn = 0.3;
    q.slip = 1.6;
    q.noMug = true;
    q.boardRot = -0.2;
    q.fx = { kind: 'beaten', u };
  } else st.mgDeadAt = undefined;

  if (m.hp > 0) {
    if (sceneAct) sceneOf(sceneAct, sceneU, actDur, go, q, t, say);
    else if (cast) castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say, cast);
    else if (relPose) releaseOf(relPose, relU, go, q, t, say);
    else if (phaseU >= 0 && phaseU < 2.4) phaseOf(phase, phaseU, go, q, t, say);
    else if (swinging) {
      const kind = st.mgPick ?? 'swat';
      const R = kind === 'swat' ? 0.24 : 0.16;
      const hitK = struck ? (since < R ? sstep(since / R) : 1 - sstep((since - R - 0.15) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.mgAntic) * (since < R ? 1 : 0) : sstep(anticK);
      if (kind === 'swat') {
        // the clipboard up beside his head, then swatted down ahead of him: whap!
        go({ shF: -175, elF: -50, tilt: -7, head: -4, chest: -3 }, wK);
        go({ shF: -92, elF: -6, tilt: 9, head: 4, x: 0.03, chest: 3 }, hitK);
        q.boardRot = mix(q.boardRot, -2.6, wK) + (0.35 - q.boardRot) * hitK;
        say(hitK > 0.3 ? 'cross' : 'stern');
      } else if (kind === 'jab') {
        // the mug drawn back, then thrust out: the coffee sloshes over the rim
        go({ shN: 30, elN: -80, tilt: -4, turnC: -8 }, wK);
        go({ shN: -88, elN: -6, tilt: 7, x: 0.035, turnC: 6 }, hitK);
        q.mugRot = 0.5 * hitK;
        q.lid = hitK;
        say(hitK > 0.3 ? 'shout' : 'focus');
      } else {
        // the clipboard swept low across in a backhand: tsk
        go({ shF: -60, elF: -100, tilt: -5, turnC: -10, head: -2 }, wK);
        go({ shF: -95, elF: -6, tilt: 6, turnC: 8, x: 0.02, drop: 0.08 }, hitK);
        q.boardRot = mix(q.boardRot, -2.4, wK) + (-0.5 - q.boardRot) * hitK;
        say(hitK > 0.3 ? 'smug' : 'stern');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = sstep(hurtU / 0.07) * (1 - sstep((hurtU - 0.08) / 0.42));
      go({ tilt: -8, head: -10, x: -0.02, shN: -50, elN: -90, shF: -20 }, k);
      q.slip = 0.8 * k;
      q.mugRot = -0.3 * k;
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.mgCalm = mix(st.mgCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.mgCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.mgCalm), t, now, st);
    if (mood && !cast && !relPose && !swinging && !live) {
      q.mood = { angry: 'cross', happy: 'keen', sad: 'sad', talk: 'talk', sleep: 'sleepy', blink: 'desk', hurt: 'hurt', surprised: 'shock' }[mood] ?? q.mood;
      if (mood === 'angry') go({ shN: -40, elN: -70, head: -3, tilt: 2 }, 1);
    }
    // (a gloat eases in from whenever he's free to make it, never snapping in part way through)
    if (!busy && !hurt && gloatU >= 0 && gloatU < 2) st.mgGlAt ??= now;
    else if (busy || hurt || gloatU < 0 || gloatU >= 2) st.mgGlAt = undefined;
    const glU = st.mgGlAt != null ? now - st.mgGlAt : -1;
    st.mgGlW = mix(st.mgGlW ?? 0, glU >= 0 && glU < 0.75 ? 1 : 0, 1 - Math.exp(-dt * 10));
    if (st.mgGlW > 0.01) {
      const k = st.mgGlW;
      go({ shF: -60, elF: -70, head: -3 }, k);
      q.boardRot = mix(q.boardRot, -0.3, k);
      q.ticks = 3 + k;
      say('smug', k);
      if (glU >= 0) q.fx = { kind: 'gloat', u: glU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'fluster';
      q.sweat = (t * 0.6) % 1;
      q.fog = 0.35 + 0.2 * Math.sin(t * 1.3);
    }
    if (m.talking) q.mood = 'talk';
  }
  if (m.mgFace) q.mood = m.mgFace;
  q.turn = spring(st, 'mgTurn', q.turn, 220, 28, dt);
  const F = FACES[q.mood] ?? FACES.desk;
  const f = (st.mgF ??= { ...FACES.desk, shut: { bliss: 0, calm: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.mgF = f;
  // (his glasses fog quickly and clear slowly; they slide down his nose and get pushed back up)
  q.fog = spring(st, 'mgFog', q.fog, q.fog > (st.mgFog?.x ?? 0) ? 120 : 6, q.fog > (st.mgFog?.x ?? 0) ? 22 : 5, dt);
  q.slip = spring(st, 'mgSlip', q.slip, 90, 14, dt);
  // Springs: the cardigan's back and its dangling cuffs, the tie's blade, the ID card, the mug's tip (it
  // only ever eases, his hand keeps it level), the board, his hair.
  const kick = ((st.mgLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.mgLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7);
  st.mgLast = out.head;
  st.mgLastT = out.tilt;
  const arm = (out.shN ?? 0) + (out.elN ?? 0) * 0.5;
  const armKick = clamp(((st.mgLastArm ?? arm) - arm) * 0.004, -0.05, 0.05);
  st.mgLastArm = arm;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  a.mgKnit = {
    sw: clamp(spring(st, 'kbk', lean * 1.1 - walkW * 0.5 + Math.sin(t * 0.8) * 0.05, 60, 9, dt, kick * 0.006), -0.9, 0.5),
    cN: spring(st, 'kcn', -lean * 1.3 - walkW * 0.3 + Math.sin(t * 1.1) * 0.05, 110, 9, dt, kick * 0.01),
    cF: spring(st, 'kcf', -lean * 1.2 - walkW * 0.3 + Math.sin(t * 1.0 + 1) * 0.05, 100, 9, dt, kick * 0.01),
  };
  a.mgTie = clamp(spring(st, 'tie', -lean * 1.4 - walkW * 0.25 + Math.sin(t * 1.3) * 0.03, 120, 10, dt, kick * 0.01), -0.15, 0.7);
  a.mgCard = spring(st, 'card', -lean * 1.2 - walkW * 0.3 + Math.sin(t * 1.5 + 2) * 0.04, 130, 9, dt, kick * 0.012 + armKick);
  a.mgMug = { rot: spring(st, 'mrot', q.mugRot, 160, 18, dt), lid: spring(st, 'mlid', q.lid, 200, 20, dt) };
  a.mgBoard = { rot: spring(st, 'brot', q.boardRot, 120, 15, dt, armKick * 2), ticks: spring(st, 'btk', q.ticks, 90, 16, dt) };
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0) + (out.chest ?? 0) * 0.5) * (Math.PI / 180);
  a.mgHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.5 + i * 1.9) * 0.02 + headLean * 0.08, 220 + i * 30, 16, dt, kick * 0.002 * (i % 2 ? 1 : -1))),
    slN: spring(st, 'sln', Math.sin(t * 1.1) * 0.05 - headLean * 0.25 + walkW * 0.1, 120, 11, dt, kick * 0.004),
    slF: spring(st, 'slf', Math.sin(t * 1.0 + 2) * 0.05 - headLean * 0.25 + walkW * 0.1, 115, 11, dt, kick * 0.004),
    curl: spring(st, 'crl', Math.sin(t * 0.9) * 0.18 - headLean * 0.6 - walkW * 0.3, 90, 8, dt, kick * 0.01),
  };
}

// His scene acts (sceneU: how long into it).
function sceneOf(act, u, dur, go, q, t, say) {
  if (act === 'sip') {
    // a sip at his desk, his glasses fogging up white
    const k = win(u, 0, 0.5, dur - 0.4, dur + 0.2);
    go({ shN: -62, elN: -120, hwN: -14, head: -7, tilt: -1 }, k);
    q.mugRot = -0.55 * k;
    q.fog = k;
    say('sip', k);
    q.fx = { kind: 'sip', u };
  } else if (act === 'keen') {
    // he turns, delighted: a finger up (the mug raised like a toast), one more thing!
    const k = win(u, 0, 0.25, dur - 0.3, dur + 0.2);
    go({ shN: -110, elN: -40, hwN: -10, head: -5, tilt: -3, shF: -20, elF: -40 }, k);
    q.boardRot = mix(q.boardRot, 0.4, k);
    say('onemore', k);
    q.look = [0.9, -0.1];
    q.fx = { kind: 'keen', u };
  } else if (act === 'stack') {
    // a tower of folders hauled up beside him, wobbling; he pats it proudly
    const k = sstep(u / 0.5);
    const pat = win(u % 1.4, 0.2, 0.35, 0.55, 0.7);
    go({ shF: -40 - pat * 10, elF: -60, head: -2, tilt: -2, shN: -30, elN: -70 }, k);
    say(u < 0.6 ? 'keen' : 'service', k);
    q.look = [0.9, 0];
    q.fx = { kind: 'stack', u };
  } else if (act === 'attack' || act === 'windup') {
    // the clipboard swatted down: the tower topples toward you, pages everywhere
    const k = win(u, 0, 0.12, dur - 0.2, dur + 0.3);
    const sw = sstep((u - 0.18) / 0.22);
    go({ shF: -150 + sw * 100, elF: -40 + sw * 30, tilt: -6 + sw * 14, head: -4 + sw * 6, x: 0.03 * sw }, k);
    q.boardRot = -1.9 + sw * 1.8;
    say(sw > 0.3 ? 'shout' : 'keen', k);
    q.fx = { kind: 'topple', u };
  }
}

// His cast poses (u: how long into the cast, castK 0..1 through it, wind: its last moments' wind-up).
function castPoseOf(cp, u, castK, wind, go, q, t, say, cast) {
  const k = sstep(u / 0.4);
  if (cp === 'sync') {
    // Quick Sync: the clipboard held up beside his head, tapped, then slammed down (the release)
    const tap = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.6)), 8) * (1 - wind);
    go({ shF: -140 - wind * 30 - tap * 6, elF: -50 - wind * 10, head: -3, tilt: -3 - wind * 4, shN: -40, elN: -70 }, k);
    q.boardRot = -1.1 - wind * 0.8;
    say(wind > 0.3 ? 'stern' : 'smug', k);
    q.look = [1, 0];
    q.fx = { kind: 'castSync', u };
  } else if (cp === 'replyall') {
    // Reply All: the clipboard held like a tablet, the mug jabbed at send
    const jab = win(castK, 0.55, 0.62, 0.72, 0.8);
    go({ shF: -70, elF: -80, shN: -60 - jab * 20, elN: -70 + jab * 30, head: 6, tilt: 2 }, k);
    q.boardRot = -0.15;
    q.mugRot = 0.1 * jab;
    q.look = [0.5, 0.8];
    say(castK > 0.6 ? 'keen' : 'focus', k);
    q.fx = { kind: 'castReply', u, castK };
  } else if (cp === 'circle' || cp === 'circleback') {
    // Circle Back: the mug drawing a circle in the air (steam trailing it), then pointing down
    const an = u * 3.4;
    const circ = 1 - wind;
    go({ shN: -90 + Math.sin(an) * 28 * circ - wind * 10, elN: -30 + Math.cos(an) * 20 * circ + wind * 10, head: -2 + wind * 6, tilt: -2 + wind * 3 }, k);
    q.mugRot = Math.sin(an) * 0.1 * circ;
    q.look = wind > 0.3 ? [0.7, 0.8] : [0.6, -0.3];
    say(wind > 0.3 ? 'smug' : 'keen', k);
    q.fx = { kind: 'castCircle', u, an, back: cp === 'circleback' };
  } else if (cp === 'huddle') {
    // Team Huddle: arms open wide, beckoning: bring it in, team
    const beck = Math.pow(Math.abs(Math.sin(u * Math.PI * 1.3)), 2);
    go({ shN: -70, elN: -60 - beck * 30, shF: -90, elF: -50 - beck * 30, head: -4, tilt: -2, chest: 2 }, k);
    q.boardRot = mix(q.boardRot, -0.6, k);
    say('service', k);
    q.fx = { kind: 'castHuddle', u };
  } else if (cp === 'delegate') {
    // Delegate: the clipboard up, pointing (mug and all) at each of you in turn
    const turnTo = Math.floor(u * 1.6) % 4;
    go({ shF: -80, elF: -70, shN: -70 - turnTo * 8, elN: -10, head: -2 + turnTo * 2 }, k);
    q.boardRot = -0.4;
    q.look = [0.9, -0.2 + turnTo * 0.15];
    say('smug', k);
    q.fx = { kind: 'castDelegate', u };
  } else if (cp === 'clock') {
    // Clock Watching: the mug hand turned to read his watch, a foot tapping; then pointing across the floor
    const read = 1 - wind;
    go({ shN: -60 * read - 80 * wind, elN: -110 * read - 10 * wind, hwN: 40 * read, head: 8 * read - 2, tilt: 1, fxN: 0.1 * Math.abs(Math.sin(u * 7)) * read }, k);
    q.mugRot = 0.6 * read;
    q.look = read > 0.5 ? [0.5, 0.9] : [1, 0.3];
    say(read > 0.5 ? 'focus' : 'stern', k);
    q.fx = { kind: 'castClock', u, wind };
  } else if (cp === 'onemore') {
    // Just One More Thing: the mug raised in a toast, grinning; then both arms flung up
    go({ shN: -120, elN: -30, shF: -40, elF: -60, head: -6, tilt: -4 }, k * (1 - wind));
    go({ shN: -140, elN: -20, shF: -140, elF: -30, head: -8, tilt: -6 }, wind);
    q.boardRot = mix(q.boardRot, -1.6, wind);
    say(wind > 0.3 ? 'shout' : 'onemore', k);
    q.fx = { kind: 'castOne', u };
  } else {
    go({ shN: -60, elN: -60, head: -2 }, k);
    say('focus', k);
  }
  if (cast && cast.extra) q.fx = { ...(q.fx ?? {}), extra: 1 };
}
// The moment a cast lets go (u: since).
function releaseOf(rp, u, go, q, t, say) {
  const k = 1 - sstep((u - 0.5) / 0.6);
  if (rp === 'sync') {
    go({ shF: -90, elF: -6, tilt: 9, head: 4, x: 0.03, chest: 4 }, k);
    q.boardRot = 0.35;
    say('stern', k);
    q.fx = { kind: 'relSync', u };
  } else if (rp === 'replyall') {
    go({ shF: -130, elF: -20, shN: -40, elN: -70, head: -6, tilt: -4 }, k);
    q.boardRot = -1.2;
    say('keen', k);
    q.fx = { kind: 'relReply', u };
  } else if (rp === 'circle' || rp === 'circleback') {
    go({ shN: -40, elN: -20, head: 4, tilt: 3 }, k);
    say('smug', k);
  } else if (rp === 'huddle') {
    go({ shN: -40, elN: -100, shF: -40, elF: -100, head: 2, chest: 3 }, k);
    say('happy', k);
  } else if (rp === 'clock') {
    go({ shN: -95, elN: -5, head: -2, tilt: 4, x: 0.02 }, k);
    say('stern', k);
  } else if (rp === 'onemore') {
    go({ shN: -140, elN: -20, shF: -140, elF: -30, head: -8, tilt: -6 }, k);
    say('shout', k);
    q.fx = { kind: 'relOne', u };
  } else {
    go({ shN: -80, elN: -10, tilt: 5, x: 0.02 }, k);
    say('stern', k);
  }
}
// The phase moments.
function phaseOf(phase, u, go, q, t, say) {
  const k = win(u, 0, 0.25, 2, 2.4);
  if (phase === 2) {
    // Overtime: a long gulp, head back, glasses fogged white; then the mug thumped forward, steam pouring off
    const thump = sstep((u - 1.2) / 0.25);
    go({ shN: -80, elN: -125, hwN: -20, head: -14, tilt: -6 }, k * (1 - thump));
    go({ shN: -50, elN: -40, head: 3, tilt: 5, x: 0.02 }, k * thump);
    q.mugRot = -1.1 * (1 - thump) * k;
    q.fog = k;
    say(thump > 0.5 ? 'stern' : 'sip', k);
    q.fx = { kind: 'overtime', u };
  } else {
    // One More Thing: he loosens his tie with the board hand, rolls his neck, an eager grin
    const roll = Math.sin(u * 4) * win(u, 0.6, 0.8, 1.5, 1.8);
    go({ shF: -110, elF: -110, hwF: -20, head: -4 + roll * 8, tilt: roll * 3 }, k);
    q.noBoard = u < 1.6;
    say(u > 1.4 ? 'onemore' : 'keen', k);
    q.fx = { kind: 'onemorePhase', u };
  }
}

// His idle act, only while calm.
function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % CYCLE;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.mgPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.mgPiece = cur.name;
      else return;
    }
  } else {
    st.mgPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'sip') {
    // the mug to his lips, glasses fogging white; "ahh"; the fog clears slowly
    const k = win(u, 0, 0.5, 6, 6.6);
    const lift = win(u, 0.5, 1.1, 2.8, 3.4);
    go({ shN: -22 - 40 * lift, elN: -62 - 58 * lift, hwN: 4 - 18 * lift, head: -6 * lift + 2 * win(u, 3.4, 3.8, 5.6, 6.2), tilt: -1 * lift }, k * w);
    if (at(k)) {
      q.mugRot = -0.55 * lift;
      q.fog = u < 3.6 ? lift : 0.9 * (1 - sstep((u - 3.6) / 2.4));
      q.mood = u < 0.6 ? 'desk' : u < 3.2 ? 'sip' : u < 5 ? 'bliss' : 'service';
      q.look = [0.4, 0.1];
      q.fx = { kind: 'idlesip', u };
    }
  } else if (cur.name === 'watch') {
    // he turns his mug hand to read his watch; the mug tips; he catches it; a sigh
    const k = win(u, 0, 0.5, 5.8, 6.4);
    const read = win(u, 0.5, 1, 3.6, 4.1);
    const tip = win(u, 2.4, 2.7, 3.2, 3.6);
    const catchK = win(u, 3, 3.2, 3.8, 4.2);
    go({ shN: -22 - 34 * read, elN: -62 - 50 * read, hwN: 4 + 40 * read - 30 * catchK, head: 9 * read, tilt: 1 * read, shF: 8 - 40 * catchK, elF: 14 - 60 * catchK }, k * w);
    if (at(k)) {
      q.mugRot = 0.95 * tip * (1 - catchK) + 0.15 * read;
      q.look = read > 0.3 ? [0.5, 0.95] : [0.4, 0];
      q.mood = u < 2.4 ? 'focus' : u < 3.6 ? 'shock' : u < 5 ? 'tired' : 'desk';
      q.fx = { kind: 'idlewatch', u, tip };
    }
  } else if (cur.name === 'list') {
    // the clipboard up; each item ticked with a clink of his mug; a pleased grin: "...and one more thing."
    const k = win(u, 0, 0.6, 6.8, 7.4);
    const n = Math.min(4, Math.max(0, Math.floor((u - 1) / 0.9)));
    const clink = Math.pow(Math.max(0, Math.sin(((u - 1) / 0.9) * Math.PI)), 10) * (u > 1 && u < 4.6 ? 1 : 0);
    go({ shF: -64, elF: -84, hwF: 6, shN: -44 - clink * 10, elN: -72 + clink * 14, head: 7, tilt: 1 }, k * w);
    if (at(k)) {
      q.boardRot = -0.25;
      q.ticks = u < 1 ? 0 : n + sstep(((u - 1) % 0.9) / 0.3);
      q.look = [0.5, 0.9];
      q.mood = u < 4.7 ? 'focus' : u < 5.4 ? 'smug' : 'onemore';
      q.fx = { kind: 'idlelist', u };
    }
  } else {
    // the stretch: props held out to the sides, a yawn he fights; a shake of the head: "Focus."
    const k = win(u, 0, 0.6, 6, 6.6);
    const up = win(u, 0.5, 1.2, 3, 3.6);
    const shake = win(u, 3.8, 4, 4.6, 4.8) * Math.sin(u * 22);
    go({ shN: -22 - 98 * up, elN: -62 + 22 * up, shF: 8 - 128 * up, elF: 14 - 44 * up, tilt: -5 * up, head: -8 * up + shake * 6, chest: -3 * up }, k * w);
    if (at(k)) {
      q.boardRot = mix(BOARD_DOWN, -1.2, up);
      q.mood = u < 0.9 ? 'tired' : u < 3.6 ? 'yawn' : u < 4.8 ? 'fluster' : 'stern';
      q.fx = { kind: 'idlestretch', u };
    }
  }
}

// ---------- His effects (over everything: his own marks) ----------
// A sticky note, a corner curled.
function sticky(ctx, x, y, s, rot, al = 1, col = NOTE.base) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-s, -s);
  ctx.lineTo(s, -s);
  ctx.lineTo(s, s * 0.45);
  ctx.quadraticCurveTo(s * 0.7, s * 0.7, s * 0.45, s);
  ctx.lineTo(-s, s);
  ctx.closePath();
  ctx.fillStyle = col;
  ctx.fill();
  pen(ctx, NOTE.ink, 0.35);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(-s, -s, s * 2, s * 0.4);
  pen(ctx, 'rgba(160,120,60,0.6)', 0.25);
  ctx.beginPath();
  ctx.moveTo(-s * 0.6, -s * 0.1);
  ctx.lineTo(s * 0.5, -s * 0.1);
  ctx.moveTo(-s * 0.6, s * 0.35);
  ctx.lineTo(s * 0.2, s * 0.35);
  ctx.stroke();
  ctx.restore();
}
// A soft curl of steam rising (u 0..1 up its rise).
function curlSteam(ctx, x, y, u, s, al) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al * Math.sin(Math.PI * u);
  pen(ctx, 'rgba(255,255,255,0.9)', s * 0.5);
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const v = i / 8;
    const px = x + Math.sin(v * 5 + u * 6) * s * 0.9;
    const py = y - u * s * 6 - v * s * 3;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}
// A folder (for his tower), its tab and its colour.
function folder(ctx, x, y, w, h, rot, col) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h, w, h, 0.8);
  ctx.fillStyle = col;
  ctx.fill();
  pen(ctx, 'rgba(120,90,60,0.6)', 0.35);
  ctx.stroke();
  ctx.fillStyle = '#fffdf6';
  ctx.fillRect(-w / 2 + 1, -h + 0.4, w - 2, 0.8);
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 2, -h - 1, w * 0.3, 1.4, 0.5);
  ctx.fillStyle = col;
  ctx.fill();
  ctx.restore();
}
const TOWER = ['#ffd27a', '#9fd0ff', '#ffb0c4', '#b8e6a8', '#ffd27a', '#c8b8ff', '#9fd0ff', '#ffb0c4'];
function tower(ctx, x, y, n, sway, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  for (let i = 0; i < n; i++) folder(ctx, x + Math.sin(i * 1.7) * 1.1 + sway * i * i * 0.05, y - i * 4.2, 17, 4.2, sway * 0.02 * i + Math.sin(i * 2.3) * 0.04, TOWER[i % TOWER.length]);
  ctx.restore();
}
const INKC = '#4a2e36';
function fx(ctx, m, a, S, matOf, D) {
  const q = a.mgQ;
  if (!q) return;
  const t = a.t ?? 0;
  const f = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -24]);
  const face = headAt(a, D, [6, 4]);
  const G = mugGeom(a, D);
  const lip = [G.x + Math.cos(G.rot) * (2.2 + MG.w - 1.6) + Math.sin(G.rot) * MG.h, G.y + Math.sin(G.rot) * (2.2 + MG.w - 1.6) - Math.cos(G.rot) * MG.h];
  const X = q.fx;
  // always: two soft curls of steam rising off his mug's sip hole
  if (m.hp > 0 && !q.noMug) for (let i = 0; i < 2; i++) curlSteam(ctx, lip[0] + i * 1.4, lip[1] - 1, ((t * 0.4 + i * 0.5 + hash(m.uid ?? 0)) % 1), 0.9, 0.55);
  if (!X) return;
  const u = X.u;
  const say = (text, x, y, size = 7, tilt = -0.08) => cue(ctx, text, x, y, size, f, tilt, INKC, '#fffaf0');
  const handF = ptOf(a, D, 'handF', D.J.handF);
  switch (X.kind) {
    case 'sip':
    case 'idlesip':
      if (u > 3.4 && u < 4.8) say('ahh~', face[0] + 14, face[1] - 16, 7);
      break;
    case 'keen':
      if (u > 0.2 && u < 2.4) say('One more thing!', crown[0] + 22, crown[1] - 4, 8);
      sparkle(ctx, lip[0] + 2, lip[1] - 4, 2 + Math.sin(t * 9) * 0.4, win(u, 0.1, 0.3, 1.4, 1.8));
      break;
    case 'stack':
    case 'topple': {
      // his tower of folders beside him (toppling toward you on the swat)
      const fall = X.kind === 'topple' ? sstep((u - 0.3) / 0.5) : 0;
      const grow = X.kind === 'stack' ? sstep(u / 0.5) : 1;
      const n = Math.round(14 * grow);
      if (fall < 0.98) {
        ctx.save();
        ctx.translate(34, 0);
        ctx.rotate(fall * 1.3);
        tower(ctx, 0, 0, n, X.kind === 'stack' ? Math.sin(t * 3) * 0.6 : 0, 1 - fall * 0.6);
        ctx.restore();
      }
      if (X.kind === 'stack' && u > 0.4 && u < 2) say('Just a few!', 40, -66, 7);
      if (X.kind === 'topple' && u > 0.5) for (let i = 0; i < 7; i++) {
        const v = clamp((u - 0.5) / 1.2 - i * 0.05, 0, 1);
        sticky(ctx, 40 + v * (40 + i * 9), -12 - Math.sin(v * Math.PI) * (16 + i * 4) + v * 10, 2.2, v * 6 + i, 1 - sstep((v - 0.7) / 0.3), [NOTE.base, NOTE.pink, NOTE.blue][i % 3]);
      }
      break;
    }
    case 'castSync':
      if (u > 0.3) say(u < 1.4 ? 'Quick sync?' : 'Got a sec?', crown[0] + 20, crown[1] - 4, 7);
      break;
    case 'relSync':
      if (u < 0.5) {
        const k = u / 0.5;
        for (let i = 0; i < 4; i++) sparkle(ctx, handF[0] + 10 + Math.cos(i * 1.6) * k * 12, handF[1] + Math.sin(i * 1.6) * k * 6, 1.8 * (1 - k * 0.5), 1 - k);
        if (u < 0.4) say('WHAP', handF[0] + 14, handF[1] - 10, 8, -0.1);
      }
      break;
    case 'castReply': {
      // little notification pings popping up off his board
      for (let i = 0; i < 3; i++) {
        const v = (u * 0.8 + i / 3) % 1;
        const p = [handF[0] + 6 + i * 3, handF[1] - 6 - v * 18];
        ctx.save();
        ctx.globalAlpha = Math.sin(Math.PI * v);
        ell(ctx, p[0], p[1], 2.4, 2.4);
        ctx.fillStyle = '#ff6a7a';
        ctx.fill();
        cue(ctx, '1', p[0], p[1] + 0.2, 3.4, f, 0, '#ffffff', '#ff6a7a');
        ctx.restore();
      }
      if (X.castK > 0.55) say('...send!', crown[0] + 18, crown[1] - 4, 8);
      else if (u > 0.3) say('Reply all...', crown[0] + 18, crown[1] - 4, 7);
      break;
    }
    case 'relReply':
      if (u < 0.7) say('Sent!', crown[0] + 18, crown[1] - 6, 8);
      break;
    case 'castCircle': {
      // the steam trailing his mug round a circle in the air
      ctx.save();
      ctx.globalAlpha = 0.7;
      pen(ctx, 'rgba(255,255,255,0.9)', 1.2);
      ctx.beginPath();
      const cx0 = lip[0] - Math.sin(X.an) * 4;
      const cy0 = lip[1] - Math.cos(X.an) * 3;
      ctx.arc(cx0, cy0, 8, X.an, X.an + Math.min(TAU, u * 3), false);
      ctx.stroke();
      ctx.restore();
      if (u > 0.3) say(X.back ? '...and back around.' : "Let's circle back.", crown[0] + 22, crown[1] - 4, 7);
      break;
    }
    case 'castHuddle':
      if (u > 0.2) say('Bring it in, team!', crown[0] + 22, crown[1] - 4, 7);
      break;
    case 'castDelegate': {
      if (u > 0.2) say('You, you, and you.', crown[0] + 22, crown[1] - 4, 7);
      const v = (u * 1.6) % 1;
      sticky(ctx, handF[0] + 6 + v * 26, handF[1] - 4 - Math.sin(v * Math.PI) * 10, 2, v * 5, 1 - v, [NOTE.base, NOTE.pink, NOTE.blue][Math.floor(u * 1.6) % 3]);
      break;
    }
    case 'castClock':
      if (X.wind < 0.3) say(['tick', 'tock'][Math.floor(u * 2) % 2], face[0] + 16, face[1] - 18, 7, Math.floor(u * 2) % 2 ? 0.1 : -0.1);
      else say('Look at the time!', crown[0] + 22, crown[1] - 4, 7);
      break;
    case 'castOne':
      if (u > 0.2) say('Just ONE more thing...', crown[0] + 22, crown[1] - 4, 7);
      sparkle(ctx, lip[0] + 2, lip[1] - 5, 2, 0.8);
      break;
    case 'relOne':
      if (u < 0.9) for (let i = 0; i < 6; i++) {
        const v = clamp(u / 0.9, 0, 1);
        sticky(ctx, crown[0] - 14 + i * 6, crown[1] - 6 - v * 18 + (i % 2) * 4, 2, v * 4 + i, 1 - v, [NOTE.base, NOTE.pink, NOTE.blue][i % 3]);
      }
      break;
    case 'overtime':
      if (u < 1.2) say('*gulp gulp*', face[0] + 14, face[1] - 18, 7);
      if (u > 1.3 && u < 2.4) {
        say('Intermission? No.', crown[0] + 22, crown[1] - 8, 8);
        for (let i = 0; i < 5; i++) steam(ctx, crown[0] - 14 + i * 7 + Math.sin(u * 3 + i) * 2, crown[1] + 4 - (u - 1.3) * 22 - (i % 2) * 5, 3 + (u - 1.3) * 3, 0.55 * (1 - (u - 1.3) / 1.1));
      }
      break;
    case 'onemorePhase':
      if (u > 1.2 && u < 2.4) say('Now. About that report.', crown[0] + 24, crown[1] - 6, 7);
      break;
    case 'swat':
      if (u > -0.02 && u < 0.45) {
        const k = clamp(u / 0.35, 0, 1);
        if (u < 0.35) say('whap!', handF[0] + 12, handF[1] - 10, 8, -0.1);
        for (let i = 0; i < 3; i++) sticky(ctx, handF[0] + 8 + i * 4 + k * 10, handF[1] - 2 - Math.sin(k * Math.PI) * (6 + i * 2), 1.6, k * 4 + i, 1 - k, [NOTE.base, NOTE.pink, NOTE.blue][i]);
      }
      break;
    case 'jab':
      if (u > -0.02 && u < 0.5) {
        // the coffee sloshing over the rim in a little arc of drops
        const k = clamp(u / 0.4, 0, 1);
        for (let i = 0; i < 5; i++) {
          const px = lip[0] + 3 + k * (10 + i * 3);
          const py = lip[1] - 2 - Math.sin(k * Math.PI) * (4 + i) + k * k * 6;
          ell(ctx, px, py, 1 - i * 0.1, 1.2 - i * 0.1);
          ctx.fillStyle = `rgba(168,106,64,${1 - k})`;
          ctx.fill();
          ell(ctx, px - 0.3, py - 0.4, 0.3, 0.3);
          ctx.fillStyle = `rgba(255,240,220,${1 - k})`;
          ctx.fill();
        }
        if (u < 0.35) say('sip THIS', lip[0] + 14, lip[1] - 12, 7);
      }
      break;
    case 'backhand':
      if (u > -0.02 && u < 0.45) {
        const k = clamp(u / 0.4, 0, 1);
        pen(ctx, `rgba(255,236,190,${0.8 * (1 - k)})`, 1.4);
        ctx.beginPath();
        ctx.arc(4, -26, 22 + k * 8, -0.2, 0.9);
        ctx.stroke();
        if (u < 0.35) say('tsk.', handF[0] + 12, handF[1] - 8, 7);
      }
      break;
    case 'ready':
      sparkle(ctx, handF[0] + 4, handF[1] - 4, 1.2 + Math.sin(t * 9) * 0.4, 0.6 * (X.k ?? 1));
      break;
    case 'hurt': {
      const v = clamp(u / 0.5, 0, 1);
      sticky(ctx, handF[0] + 4 + v * 12, handF[1] - Math.sin(v * Math.PI) * 10 + v * 8, 1.8, v * 4, 1 - v);
      break;
    }
    case 'gloat': {
      const k = win(u, 0, 0.12, 0.7, 1);
      say('Noted.', face[0] + 16 + u * 4, face[1] - 18 - u * 8, 7);
      // a teal tick drawn in the air
      ctx.save();
      ctx.globalAlpha = k;
      pen(ctx, '#4aa79c', 1.4);
      ctx.beginPath();
      ctx.moveTo(face[0] + 26, face[1] - 6);
      ctx.lineTo(face[0] + 28, face[1] - 3.6);
      ctx.lineTo(face[0] + 32, face[1] - 10);
      ctx.stroke();
      ctx.restore();
      break;
    }
    case 'idlewatch':
      if (X.tip > 0.4) say('whoa', lip[0] + 10, lip[1] - 10, 6, 0.1);
      if (u > 4.3 && u < 5.8) say('...ten past ten.', face[0] + 18, face[1] - 18, 7);
      break;
    case 'idlelist':
      if (u > 1 && u < 4.6 && ((u - 1) % 0.9) < 0.3) say('clink', lip[0] + 8, lip[1] - 8, 5, -0.15);
      if (u > 4.8 && u < 7) say('...and one more thing.', face[0] + 22, face[1] - 20, 7);
      break;
    case 'idlestretch':
      if (u > 1.4 && u < 3.4) say('hhhaaa...', face[0] + 16, face[1] - 18, 7);
      if (u > 4.9 && u < 6.2) say('Focus.', face[0] + 14, face[1] - 18, 7);
      break;
    case 'beaten': {
      // the mug set down beside him, still steaming; zz
      drawMug(ctx, a, 'line', 18, -0.3, 0, 0, LWR);
      drawMug(ctx, a, 'fill', 18, -0.3, 0, 0, LWR);
      for (let i = 0; i < 2; i++) curlSteam(ctx, 25 + i * 1.4, -12, (t * 0.4 + i * 0.5) % 1, 0.9, 0.5);
      if (u < 1.2) dizzy(ctx, crown[0], crown[1] + 6, 10, t, 3);
      else cue(ctx, 'zz', face[0] + 14 + Math.sin(t) * 2, face[1] - 18 - ((t * 0.6) % 1) * 4, 7, f, 0.1, INKC, '#fffaf0');
      break;
    }
    default:
      break;
  }
}

// ---------- His clothes (the rig's hooks) ----------
const DRESS = {
  id: 'manager',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  // (behind everything of his: the cardigan's body down his back, then the back of his hair)
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    const q = a.mgQ ?? {};
    for (const mode of ['line', 'fill']) {
      knitBack(ctx, a, mode, D, LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', q, a.mgF, a.mgHair ?? {}, LWK / HS);
      ctx.restore();
    }
  },
  under: {
    handFskin: (ctx, a, mode, S, D) => clipboard(ctx, a, mode, D, LWR),
    handNskin: (ctx, a, mode, S, D) => mug(ctx, a, mode, D, LWR),
  },
  over: {
    armF: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'F', LWR),
    legF: (ctx, a, mode, S, D) => slacks(ctx, a, mode, D, 'F', LWR),
    footFskin: (ctx, a, mode, S, D) => loafer(ctx, a, mode, D, 'F', LWR),
    legN: (ctx, a, mode, S, D) => slacks(ctx, a, mode, D, 'N', LWR),
    footNskin: (ctx, a, mode, S, D) => loafer(ctx, a, mode, D, 'N', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      shirt(ctx, a, mode, D, LWR);
      lanyard(ctx, a, mode, D, LWR);
      tie(ctx, a, mode, D, LWR);
    },
    neckSkin: (ctx, a, mode, S, D) => {
      collar(ctx, a, mode, D, LWR);
      knitFront(ctx, a, mode, D, LWR);
    },
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.mgQ ?? {}, a.mgF, a.mgHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => sleeve(ctx, a, mode, D, 'N', LWR),
  },
  pose,
  fx,
};
const R = dressRig('manager', DRESS);
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
// His art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: his marks over his
// head are his own), his size as drawn and his walking pace (the base's own at his size).
export const MANAGER_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 180, 320, 220], draw: R.still, rig, noHop: true, ownEmotes: true };
export const MANAGER_SIZE = { w: 60, h: 132, speed: Math.round(R.speed * BIG) };
