// Folio, the Archivist, on screen (2026-11-27, remade from scratch: the Star Observatory's Archive keeper,
// her story kept, world/observatory.js her new fight). The tower's head librarian, a prim young snowy owl
// of a woman who keeps the star records with her Raven Scribes (render/raven/: the copyists in starlight
// ink, whom she calls to her), quiet, exact, secretly delighted by a good book and by nobody else; anyone
// stamping through her Archive has overdue books, and fines are payable at once. She walks on her own copy
// of the winged base (rig.js; body.js `archivist`: a tall prim young woman, long slim legs, wings from her
// shoulder blades), her head, hair, wings, clothes and things drawn here (head.js, dress.js), never the
// shared face or the hero's body or hair.
//   look    fair skin; snowy white hair (an even blunt fringe of five sections just above her lashes,
//           straight side locks cut at her chin, a big wound bun low at the back with a quill through it
//           and a long soft tail of hair down her back), brass reading glasses pushed up on her hair; a
//           snowy owl's wings folded down her back like a long cape, opening for her casts; a soft ruff of
//           white feathers at her neck with a brass star; a midnight indigo coat-dress with a cream blouse
//           down a narrow V, brass buttons, a cream sash, the Archive's keys on a ring at her hip; long
//           fitted sleeves with feathered cuffs; a skirt to just under her knees with a band of brass stars
//           and a cream underskirt; plum stockings and little cream boots; a white owl's quill in her near
//           hand, and floating at her side the Great Catalogue, an enormous teal book with a star chart on
//           its cover that opens in a fan of pages lit with starlight writing. Her own soft outlines in
//           each part's deeper colour; her face bare.
//   faces   (head.js) owl-gold eyes, the whole iris always clear, a little arched window for a glint, one
//           soft lash wing; round brows; a prim little mouth whose near corner lifts. Moods: prim (rest),
//           still, read, stern, shush, smug, delighted, bliss, proud, focus, shock, flustered, sad, hurt
//           (> <), dizzy, talk, wink.
//   idle    a 30 s act, only while calm, in pieces that fit her pauses: reading (the Catalogue open before
//           her, a page turned with the quill, a little hum); dust (a speck of dust on the cover, blown
//           off, a tiny sneeze, flustered, a look round to check nobody saw); a card (a library card
//           taken from the book and stamped, thunk, smug); preening (her wings shaken out and folded
//           neatly, her glasses set straight on her hair).
//   walk    a prim upright walk, little steps, her wings folded, the book floating after her.
//   fight   between casts, her swings at the tank in turn: Quill Jab (a poke with the quill, a dot of
//           starlight ink), Book Bonk (the Catalogue swung down shut), Wing Buffet (a wing flung open, a
//           gust of pages). Her casts (m.castPose, world/observatory.js): hardback (both hands raised,
//           conducting the Catalogue up over the tank, then down), stacks (wings opening, her arm sweeping
//           along the hall at the shelves), riffle (the book flipping through itself before her, pages
//           whirling), noted (the quill writing fast in the air, her eyes going from one of you to the
//           next), top / bottom (her hand flat up high for the top shelf, pointing down for the bottom),
//           scribes (a tap on the book: the scribes are called). A phase change (m.phaseAt): Top Shelf,
//           Bottom Shelf (the book shut with a snap, the quill tucked behind her ear: she means business),
//           Closing Time (her wings thrown wide, stern).
//   scenes  her entrance (observatory_folio): 'perch' (sitting up on the top of a tall rolling library
//           ladder, reading, wings folded), 'notice' (eyes up over the page), 'glide' (the book shut, her
//           wings opened, a slow glide down to the floor while the ladder rolls away), 'card' (a library
//           card held out: "Library card?"), 'overdue' (a stamp in the air in starlight ink: OVERDUE), and
//           'attack' (her wings flung wide in a gust of pages).
//   marks   all her own (`ownEmotes`): a tiny "shh~" after landing a hit, a page knocked out of the book
//           and her glasses tipping when hurt, a sweat drop when low, and beaten: sat down on the floor,
//           dizzy, the Catalogue fallen open beside her, pages everywhere.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, ell, pen, glow, sparkle, cue, spring, dust } from './fx.js';
import { drawHead, FACES, SHUTS, FKEYS, VOWELS } from './head.js';
import { wing, collar, bodice, skirt, sleeve, stocking, boot, keys, book, bookGeom, drawBook, heldQuill, quillGeom, enter, ptOf, star5, rounded } from './dress.js';
import { SKIN, SKIN_INK, INDIGO, INK, CREAM, GOLD } from './palette.js';

const BIG = 1.9;
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

const SWINGS = ['quilljab', 'bookbonk', 'wingbuffet'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.foN ?? 0) % SWINGS.length]);
const PIECES = [
  { name: 'read', t0: 0.4, len: 7.6 },
  { name: 'dust', t0: 8.6, len: 6.2 },
  { name: 'card', t0: 15.4, len: 6 },
  { name: 'preen', t0: 22, len: 7.2 },
];
// (the book's place by her: an offset from the top of her breastbone, base px; how open; its tilt)
const BOOK_REST = { dx: -15, dy: -3, tilt: 0.12, open: 0, s: 1 };
const BOOK_READ = { dx: 9, dy: 4, tilt: -0.08, open: 1, s: 0.9 };

function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'prim', look: [0.3, 0], turn: 0.35, fx: null, sweat: 0, tears: false, qa: 0.5, noQuill: false, bookFront: false, wingOpen: 0, flap: 0, tipGlasses: 0, ladder: 0, behindEar: 0 };
  const B = { ...BOOK_REST, flip: 0 };
  a.foQ = q;
  a.foUid = (m.uid ?? 0) % 7;
  const go = (p, k = 1) => {
    if (k > 0.001) for (const [ch, val] of Object.entries(p)) out[ch] = (out[ch] ?? 0) + (val - (out[ch] ?? 0)) * k;
  };
  const say = (mood, k = 1) => {
    if (k > 0.4) q.mood = mood;
  };
  const toBook = (p, k = 1) => {
    if (k > 0.001) for (const [kk, v] of Object.entries(p)) B[kk] = mix(B[kk], v, k);
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
  if (cp) st.foLastPose = cp;
  const relU = !cast && st.foLastPose && since >= 0 && since < 1.2 ? since : -1;
  const relPose = relU >= 0 ? st.foLastPose : null;
  if (!cast && since >= 1.2) st.foLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.85));
  if (swinging && !st.foAtk) {
    st.foN = (st.foN ?? (m.uid ?? 0)) + 1;
    st.foPick = pickSwing(m, st);
  }
  st.foAntic = swinging ? Math.max(anticK, st.foAntic ?? 0) : 0;
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.foAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const gloatU = now - (m.gloatAt ?? -9);
  const STICKY = { perch: 1, notice: 1 };
  const sceneAct = act && actU >= 0 && actU < actDur + 0.4 ? act.move : STICKY[act?.move] ? act.move : null;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 2) || sceneAct;

  // At rest: upright and prim, the quill held up before her chest in her near hand, her far hand
  // resting at her side, chin a touch up, a gentle sway; the Catalogue floating by her far shoulder.
  go({ tilt: -1 + Math.sin(t * 0.8) * 0.6, chest: -1 + breath * 0.6, head: -3 + Math.sin(t * 0.6) * 1.2, shN: -28, elN: -96, hwN: 10, shF: 8, elF: 18, hwF: -6 }, 1);
  q.look = [0.35 + Math.sin(t * 0.33) * 0.15, 0];
  if (walkW > 0.01) {
    // walking: prim and upright, little steps, the quill kept up, the book floating after her
    go({ tilt: 2, head: -2, shN: -24, elN: -92 }, walkW);
    toBook({ dx: -19, dy: -5, tilt: 0.22 }, walkW);
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say('focus');
  if (m.hp <= 0) {
    // beaten: sat down on the floor, dizzy, her glasses askew, the Catalogue fallen open beside her
    const u = now - (st.foDeadAt ??= now);
    go({ drop: 0.86, tilt: 8, head: 16, chest: 4, shN: 30, elN: -20, hwN: 20, shF: 40, elF: -10, hwF: 20, fxN: 0.5, fxF: 0.2 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.noQuill = true;
    q.tipGlasses = 0.6;
    q.wingOpen = 0.15;
    B.dx = 999;
    q.fx = { kind: 'beaten', u };
  } else st.foDeadAt = undefined;

  if (m.hp > 0) {
    if (sceneAct === 'perch' || sceneAct === 'notice') {
      // up on the top of the rolling ladder, sitting, reading; (notice) her eyes come up over the page
      const u = act ? actU : 0;
      // (as the scene opens she flutters up onto it, the ladder rolling in under her)
      const rise = sceneAct === 'perch' ? sstep(u / 0.8) : 1;
      go({ lift: 0.95 * rise, drop: 0.62 * rise, tilt: -4, chest: -2, head: 6, shN: -60, elN: -70, hwN: 10, shF: -50, elF: -60, fxN: 0.42 * rise, fxF: 0.3 * rise, fyN: -0.1 * rise, fyF: -0.05 * rise }, 1);
      if (sceneAct === 'perch' && u < 1.2) {
        q.wingOpen = win(u, 0, 0.2, 0.7, 1.1) * 0.9;
        q.flap = Math.sin(u * 14) * 0.25 * q.wingOpen;
      }
      toBook({ dx: 10, dy: 7, tilt: -0.1, open: 1, s: 0.86 }, 1);
      q.bookFront = true;
      q.ladder = sceneAct === 'perch' ? sstep(u / 0.5) : 1;
      q.qa = 0.9;
      if (sceneAct === 'perch') {
        q.look = [0.4, 0.9];
        say(Math.sin(t * 0.7) > 0.6 ? 'bliss' : 'read');
        B.flip = (t * 0.25) % 1 < 0.35 ? ((t * 0.25) % 1) / 0.35 : 0;
      } else {
        q.look = [0.6, -0.4];
        go({ head: -4 }, sstep(u / 0.5));
        say(u < 0.6 ? 'read' : 'stern');
      }
      q.fx = { kind: sceneAct, u };
    } else if (sceneAct === 'glide') {
      // the book shut with a snap, wings opened, a slow glide down to the floor
      const u = actU;
      const down = sstep((u - 0.5) / Math.max(0.5, actDur - 0.8));
      go({ lift: 0.95 * (1 - down), drop: 0.62 * (1 - sstep(u / 0.6)), tilt: -6 + 10 * down, head: -6, shN: -70, elN: -40, shF: -60, elF: -40, fxN: 0.4 * (1 - down), fxF: 0.3 * (1 - down), fyN: -0.15 * (1 - down) }, 1);
      q.wingOpen = win(u, 0.3, 0.7, actDur - 0.5, actDur + 0.1) * 1.05;
      q.flap = Math.sin(u * 4.2) * 0.22 * q.wingOpen;
      toBook({ dx: -20, dy: -8, tilt: 0.3, open: 0 }, sstep(u / 0.4));
      q.ladder = 1 - sstep((u - 0.6) / 0.8);
      say(u < 0.4 ? 'stern' : 'focus');
      q.look = [0.5, 0.4];
      q.fx = { kind: 'glide', u, down };
    } else if (sceneAct === 'card') {
      // a library card held out at you
      const k = win(actU, 0, 0.3, actDur - 0.3, actDur + 0.2);
      go({ shN: -78, elN: -12, hwN: -10, tilt: -2, head: -4 }, k);
      q.noQuill = k > 0.5;
      say('stern', k);
      q.fx = { kind: 'card', u: actU, k };
    } else if (sceneAct === 'overdue') {
      // a stamp in the air in starlight ink: OVERDUE
      const u = actU;
      const lift = win(u, 0, 0.25, 0.45, 0.55);
      const hit = win(u, 0.45, 0.55, actDur - 0.2, actDur + 0.2);
      go({ shN: -150, elN: -40, tilt: -6, head: -6 }, lift);
      go({ shN: -82, elN: -8, hwN: -20, tilt: 6, head: 2, x: 0.02 }, hit);
      say(u < 0.5 ? 'stern' : 'smug');
      q.qa = 2.2;
      q.fx = { kind: 'overdue', u };
    } else if (sceneAct === 'attack' || sceneAct === 'windup') {
      // wings flung wide, the Catalogue thrown open in a gust of pages
      const k = win(actU, 0, 0.2, actDur - 0.2, actDur + 0.3);
      go({ shN: -120, elN: -30, shF: -120, elF: -30, tilt: -6, head: -6 }, k);
      q.wingOpen = 1.1 * k;
      q.flap = Math.sin(actU * 9) * 0.1 * k;
      toBook({ dx: 12, dy: -14, tilt: 0, open: 1, s: 1 }, k);
      q.bookFront = k > 0.5;
      say(sceneAct === 'windup' ? 'focus' : 'stern', k);
      q.fx = { kind: 'gust', u: actU };
    } else if (cast) {
      castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say, toBook, B);
    } else if (relPose) {
      releaseOf(relPose, relU, go, q, t, say, toBook);
    } else if (phaseU >= 0 && phaseU < 2) {
      const k = win(phaseU, 0, 0.25, 1.6, 2);
      if (phase >= 3) {
        // Closing Time: her wings thrown wide, stern
        go({ shN: -40, elN: -60, shF: -40, elF: -60, tilt: -4, head: -6 }, k);
        q.wingOpen = 1.15 * k;
        q.flap = Math.sin(phaseU * 6) * 0.08 * k;
        say('stern', k);
        q.fx = { kind: 'closing', u: phaseU };
      } else {
        // Top Shelf, Bottom Shelf: the book shut with a snap, the quill tucked behind her ear
        const tuck = win(phaseU, 0.5, 0.8, 1.7, 2);
        go({ shN: -150, elN: -110, hwN: 20, head: 4 }, tuck * k);
        toBook({ dx: -16, dy: -6, open: 0 }, k);
        q.behindEar = tuck;
        say(phaseU < 0.5 ? 'stern' : 'smug', k);
        q.fx = { kind: 'shelves', u: phaseU };
      }
    } else if (swinging) {
      const kind = st.foPick ?? 'quilljab';
      // (a heavy Book Bonk comes down over a longer beat)
      const R = kind === 'bookbonk' ? 0.26 : 0.17;
      const hitK = struck ? (since < R ? sstep(since / R) : 1 - sstep((since - R - 0.15) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.foAntic) * (since < R ? 1 : 0) : sstep(anticK);
      if (kind === 'quilljab') {
        go({ shN: -40, elN: -120, hwN: 30, tilt: -4 }, wK);
        go({ shN: -86, elN: -6, hwN: -10, tilt: 7, x: 0.03 }, hitK);
        q.qa = mix(0.5, 1.4, hitK);
        say(hitK > 0.3 ? 'stern' : 'focus');
      } else if (kind === 'bookbonk') {
        go({ shF: -150, elF: -30, tilt: -6, head: -4 }, wK);
        go({ shF: -70, elF: -14, tilt: 8, x: 0.03 }, hitK);
        toBook({ dx: -6, dy: -26, tilt: -0.4 }, wK);
        toBook({ dx: 18, dy: 2, tilt: 0.5 }, hitK);
        say(hitK > 0.3 ? 'shush' : 'focus');
      } else {
        go({ tilt: -6, head: -4, shF: -30, elF: -30 }, wK);
        go({ tilt: 6, head: 2, x: 0.02 }, hitK);
        q.wingOpen = 0.5 * wK + 0.9 * hitK;
        q.flap = -0.3 * wK + 0.4 * hitK;
        say(hitK > 0.3 ? 'stern' : 'focus');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now, k: wK };
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -10, x: -0.02, shN: -80, elN: -120, shF: -20 }, k);
      q.tipGlasses = 0.4 * k;
      q.wingOpen = 0.25 * k;
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.foCalm = mix(st.foCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.foCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.foCalm), t, now, st, toBook, B);
    if (mood && !cast && !relPose && !swinging && !sceneAct) {
      q.mood = { angry: 'stern', happy: 'smug', sad: 'sad', talk: 'talk', sleep: 'bliss', blink: 'read', hurt: 'hurt', surprised: 'shock' }[mood] ?? q.mood;
      if (mood === 'sad') {
        go({ head: 10, tilt: 3, shN: -50, elN: -120 }, 1);
        q.tears = true;
      }
    }
    if (!busy && !hurt && gloatU >= 0 && gloatU < 0.9) {
      const k = win(gloatU, 0, 0.12, 0.6, 0.9);
      go({ shN: -60, elN: -140, hwN: 30, head: -4 }, k);
      say('smug', k);
      q.fx = { kind: 'gloat', u: gloatU };
    }
    if (low && !busy && !m.cine) {
      q.mood = 'flustered';
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  if (m.foFace) q.mood = m.foFace;
  q.turn = spring(st, 'foTurn', q.turn, 220, 28, dt);
  q.qa = spring(st, 'foQa', q.qa, 150, 22, dt);
  const F = FACES[q.mood] ?? FACES.prim;
  const f = (st.foF ??= { ...FACES.prim, shut: { happy: 0, calm: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  for (const key of FKEYS) f[key] = mix(f[key] ?? 0, tgt[key] ?? 0, key === 'lid' || key === 'wk' ? 1 - Math.exp(-dt * (tgt[key] > f[key] ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.foF = f;
  // Springs: her wings (how open, each one's beat), the book (where it floats, how open), the skirt, the
  // keys, her hair, her glasses.
  const kick = ((st.foLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.foLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7);
  st.foLast = out.head;
  st.foLastT = out.tilt;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  const W = spring(st, 'wOpen', q.wingOpen, 90, 15, dt);
  a.foWing = {
    open: W,
    flap: [0, 1].map((i) => spring(st, `wf${i}`, q.flap * (i ? 1 : 0.8) + Math.sin(t * 1.3 + i) * 0.02 + walkW * 0.04, 120, 11, dt, kick * 0.004)),
  };
  if (B.dx === 999) a.foBook = null;
  else {
    const bob = Math.sin(t * 1.6) * 1.1;
    a.foBook = {
      dx: spring(st, 'bx', B.dx, 70, 11, dt),
      dy: spring(st, 'by', B.dy + bob, 70, 11, dt),
      tilt: spring(st, 'bt', B.tilt + Math.sin(t * 1.1) * 0.04, 80, 10, dt),
      open: spring(st, 'bo', B.open, 140, 18, dt),
      s: spring(st, 'bs', B.s, 120, 16, dt),
      flip: B.flip,
    };
  }
  st.foBookFront = q.bookFront;
  a.foSkirt = spring(st, 'sk', -lean * 1.6 - walkW * 0.6 + Math.sin(t * 1.2) * 0.08, 90, 9, dt, kick * 0.01);
  a.foKeys = spring(st, 'ky', -lean * 0.8 + walkW * Math.sin(t * 6) * 0.2, 60, 5, dt, kick * 0.02);
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0)) * (Math.PI / 180);
  a.foHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.7 + i * 1.9) * 0.02 + headLean * 0.1, 170 + i * 30, 14, dt, kick * 0.003 * (i % 2 ? 1 : -1))),
    slN: spring(st, 'sln', Math.sin(t * 1.2) * 0.05 - headLean * 0.2 + walkW * 0.1, 90, 9, dt, kick * 0.005),
    slF: spring(st, 'slf', Math.sin(t * 1.1 + 2) * 0.05 - headLean * 0.2 + walkW * 0.1, 86, 9, dt, kick * 0.005),
    back: spring(st, 'bk', Math.sin(t * 0.9) * 0.05 - headLean * 0.45 - walkW * 0.25, 55, 7, dt, kick * 0.008),
    glasses: spring(st, 'gl', q.tipGlasses + headLean * 0.05, 150, 11, dt, kick * 0.004),
  };
}

// A cast held (castK: how far through it; wind: its last 0.6 s, gathering).
function castPoseOf(cp, u, castK, wind, go, q, t, say, toBook, B) {
  const k = sstep(u / 0.35);
  if (cp === 'hardback') {
    // Hardback: both hands raised, conducting the Catalogue up over the tank, about to bring it down
    go({ shN: -150 + 10 * wind, elN: -30, shF: -140, elF: -30, tilt: -4 - 3 * wind, head: -8 }, k);
    toBook({ dx: 26, dy: -40 - 6 * wind, tilt: -0.2, open: 0.3 * (1 - wind), s: 1.25 }, k);
    q.bookFront = true;
    q.noQuill = true;
    say('stern', k);
    q.fx = { kind: 'castHardback', u };
  } else if (cp === 'stacks') {
    // Toppling Stacks: wings opening, her near arm sweeping along the hall at the shelves
    const sw = Math.sin(u * 2.4);
    go({ shN: -95 + sw * 20, elN: -10, hwN: -20, shF: -20, elF: -30, tilt: -3, head: -4 }, k);
    q.wingOpen = 0.8 * k;
    q.look = [0.8 + sw * 0.2, -0.3];
    say('stern', k);
    q.fx = { kind: 'castStacks', u };
  } else if (cp === 'riffle') {
    // Riffle: the book open before her, flipping through itself, pages whirling
    go({ shN: -70, elN: -60, hwN: 20, shF: -70, elF: -60, tilt: -2, head: 2 }, k);
    toBook({ dx: 14, dy: 0, tilt: 0, open: 1, s: 1.1 }, k);
    B.flip = (u * 2.2) % 1;
    q.bookFront = true;
    q.look = [0.4, 0.7];
    say(castK < 0.7 ? 'read' : 'stern', k);
    q.fx = { kind: 'castRiffle', u };
  } else if (cp === 'noted') {
    // Noted: the quill writing fast in the air, her eyes going from one of you to the next
    const sc = Math.sin(u * 14);
    go({ shN: -70 + sc * 8, elN: -70 + Math.cos(u * 14) * 10, hwN: 10, tilt: -2, head: -2 }, k);
    toBook({ dx: 8, dy: 6, open: 1, s: 0.9 }, k);
    q.bookFront = true;
    q.qa = 1.1;
    q.look = [Math.sin(u * 1.7) * 0.9, 0];
    q.turn = 0.35 + Math.sin(u * 1.7) * 0.2;
    say('focus', k);
    q.fx = { kind: 'castNoted', u };
  } else if (cp === 'top') {
    // Top Shelf: her hand held flat up high
    go({ shN: -165, elN: -10, hwN: 60, tilt: -4, head: -8 }, k);
    q.look = [0.5, -0.8];
    say('stern', k);
    q.fx = { kind: 'castTop', u };
  } else if (cp === 'bottom') {
    // Bottom Shelf: pointing down at the floor
    go({ shN: -30, elN: 10, hwN: -20, tilt: 6, head: 8 }, k);
    q.look = [0.5, 0.9];
    say('stern', k);
    q.fx = { kind: 'castBottom', u };
  } else if (cp === 'scribes') {
    // Scribes!: a tap on the book, calling them
    const tap = Math.abs(Math.sin(u * 7)) * (1 - sstep((u - 1.2) / 0.3));
    go({ shN: -60 - tap * 10, elN: -80, shF: -40, elF: -40, tilt: -2, head: -4 }, k);
    toBook({ dx: 10, dy: 4, open: 0 }, k);
    q.bookFront = true;
    say('smug', k);
    q.fx = { kind: 'castScribes', u };
  }
}
function releaseOf(rp, u, go, q, t, say, toBook) {
  const k = win(u, 0, 0.08, 0.7, 1.2);
  if (rp === 'hardback') {
    go({ shN: -60, elN: -10, shF: -50, elF: -10, tilt: 8, head: 2 }, k);
    toBook({ dx: 34, dy: 30, tilt: 0.1, s: 1.25 }, k * (1 - sstep((u - 0.5) / 0.6)));
    q.bookFront = true;
    q.noQuill = true;
    say('smug', k);
  } else if (rp === 'stacks') {
    go({ shN: -80, elN: -10, tilt: 2 }, k);
    q.wingOpen = 0.6 * (1 - sstep(u / 1));
    say('smug', k);
  } else if (rp === 'riffle') {
    go({ shN: -60, elN: -60, shF: -60, elF: -60 }, k);
    toBook({ dx: 14, dy: 0, open: 1 - sstep(u / 0.6) }, k);
    say('proud', k);
  } else if (rp === 'noted') {
    go({ shN: -110, elN: -60, hwN: 30, tilt: -2 }, k);
    q.qa = 2;
    say('smug', k);
  } else if (rp === 'top' || rp === 'bottom') {
    go({ shN: -40, elN: -110, hwN: 20 }, k);
    say('smug', k);
  } else if (rp === 'scribes') {
    go({ shN: -70, elN: -120, tilt: -2 }, k);
    say('smug', k);
  }
  q.fx = { kind: `rel_${rp}`, u };
}

function idleAct(m, a, out, go, q, w, t, now, st, toBook, B) {
  const lu = (t + (m.uid % 7) * 4.3) % 30;
  const left = typeof m.restUntil === 'number' ? m.restUntil - now : Infinity;
  const cur = PIECES.find((p) => lu >= p.t0 && lu < p.t0 + p.len);
  if (cur) {
    if (st.foPiece !== cur.name) {
      if (lu - cur.t0 < 0.3 && left >= cur.t0 + cur.len - lu) st.foPiece = cur.name;
      else return;
    }
  } else {
    st.foPiece = null;
    return;
  }
  const at = (k) => k * w > 0.5;
  const u = lu - cur.t0;
  if (cur.name === 'read') {
    // the Catalogue open before her, a page turned with the quill, a little hum
    const k = win(u, 0, 0.6, 7, 7.6);
    const turnP = win(u, 3.2, 3.5, 4.1, 4.4);
    go({ shN: -60 - turnP * 20, elN: -70 + turnP * 20, hwN: 10, shF: -40, elF: -70, head: 6, tilt: -1 }, k * w);
    toBook(BOOK_READ, k * w);
    B.flip = turnP > 0.01 ? clamp((u - 3.3) / 0.9, 0, 1) : 0;
    if (k * w > 0.5) q.bookFront = true;
    if (at(k)) {
      q.look = [0.3, 0.9];
      q.mood = u > 4.4 && u < 6.4 ? 'bliss' : 'read';
      q.fx = { kind: 'read', u };
    }
  } else if (cur.name === 'dust') {
    // a speck of dust on the cover: blown off; a tiny sneeze; flustered; a look round
    const k = win(u, 0, 0.5, 5.7, 6.2);
    const blow = win(u, 1.2, 1.4, 1.9, 2.2);
    const sneeze = win(u, 2.8, 2.9, 3.05, 3.4);
    toBook({ dx: 10, dy: 1, tilt: -0.3, open: 0, s: 0.9 }, k * w);
    go({ shF: -60, elF: -60, head: 4 - sneeze * 14, tilt: -sneeze * 4 }, k * w);
    if (k * w > 0.5) q.bookFront = true;
    if (at(k)) {
      q.look = u < 2.4 ? [0.6, 0.6] : u < 4.2 ? [0, 0] : [Math.sin(u * 3) * 0.9, 0];
      q.turn = u > 4.2 ? 0.35 + Math.sin(u * 3) * 0.25 : 0.35;
      q.mood = u < 1.2 ? 'focus' : u < 2.2 ? 'shush' : u < 2.8 ? 'prim' : u < 3.4 ? 'hurt' : 'flustered';
      q.fx = { kind: 'dust', u };
    }
  } else if (cur.name === 'card') {
    // a library card taken from the book, stamped (thunk), smug
    const k = win(u, 0, 0.5, 5.5, 6);
    const stampK = win(u, 2.4, 2.6, 2.75, 3.1);
    toBook({ dx: 8, dy: 4, tilt: 0, open: 1, s: 0.85 }, k * w);
    go({ shF: -60, elF: -60, shN: -70 - stampK * 30 + win(u, 2, 2.4, 2.5, 2.7) * 40, elN: -60, hwN: 10, head: 4 }, k * w);
    if (k * w > 0.5) q.bookFront = true;
    q.noQuill = k * w > 0.5;
    if (at(k)) {
      q.look = [0.4, 0.8];
      q.mood = u < 2.6 ? 'focus' : u < 4 ? 'smug' : 'proud';
      q.fx = { kind: 'cardstamp', u };
    }
  } else {
    // her wings shaken out and folded neatly; her glasses set straight
    const k = win(u, 0, 0.5, 6.7, 7.2);
    const shake = win(u, 0.4, 0.8, 2.4, 2.9);
    const fix = win(u, 3.6, 3.9, 5, 5.4);
    q.wingOpen = Math.max(q.wingOpen, 0.55 * shake * k * w);
    q.flap = Math.sin(u * 18) * 0.12 * shake * k * w;
    go({ shN: -165, elN: -110, hwN: 30, head: -2 }, fix * k * w);
    q.tipGlasses = 0.25 * win(u, 3, 3.3, 3.9, 4.2);
    if (at(k)) {
      q.look = u < 3 ? [-0.5, -0.2] : [0.3, -0.4];
      q.turn = u < 3 ? 0.15 : 0.35;
      q.mood = u < 3 ? 'bliss' : u < 5.4 ? 'focus' : 'proud';
      q.fx = { kind: 'preen', u };
    }
  }
}

// ---------- Effects (the rig's space, base px, facing right; drawn live in her own soft style) ----------
// A loose page: cream, rounded, a few lines of starlight writing, turning as it flutters.
export function page(ctx, x, y, s, rot, al = 1, flip = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(flip, 1);
  rounded(ctx, [[-s * 0.75, -s], [s * 0.75, -s], [s * 0.75, s], [-s * 0.75, s]], s * 0.25);
  ctx.fillStyle = CREAM.base;
  ctx.fill();
  pen(ctx, CREAM.ink, Math.max(0.3, s * 0.12));
  ctx.stroke();
  pen(ctx, INK.base, Math.max(0.25, s * 0.1));
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 0.45, -s * 0.5 + i * s * 0.45);
    ctx.lineTo(s * (0.45 - (i === 2 ? 0.3 : 0)), -s * 0.5 + i * s * 0.45);
    ctx.stroke();
  }
  ctx.restore();
}
// A soft glowing dot of starlight ink.
export function inkDot(ctx, x, y, r, al = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  glow(ctx, x, y, r * 2.6, INK.glow, 0.6);
  ell(ctx, x, y, r, r);
  ctx.fillStyle = INK.base;
  ctx.fill();
  ell(ctx, x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.28);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
// A stamp of starlight ink in the air: a soft rounded frame and its word.
export function inkStamp(ctx, x, y, text, size, al, rot = -0.12, f = 1) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.scale(f, 1);
  ctx.rotate(rot);
  ctx.font = `900 ${size}px "Trebuchet MS", sans-serif`;
  const w = ctx.measureText(text).width + size * 0.9;
  glow(ctx, 0, 0, w * 0.6, INK.glow, 0.35);
  rounded(ctx, [[-w / 2, -size * 0.75], [w / 2, -size * 0.75], [w / 2, size * 0.75], [-w / 2, size * 0.75]], size * 0.35);
  pen(ctx, INK.deep, size * 0.14);
  ctx.stroke();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = INK.deep;
  ctx.fillText(text, 0, size * 0.05);
  ctx.restore();
}
function libraryCard(ctx, x, y, s, al, stamped, rot = 0) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(rot);
  rounded(ctx, [[-s * 1.2, -s * 0.8], [s * 1.2, -s * 0.8], [s * 1.2, s * 0.8], [-s * 1.2, s * 0.8]], s * 0.25);
  ctx.fillStyle = CREAM.base;
  ctx.fill();
  pen(ctx, CREAM.ink, s * 0.12);
  ctx.stroke();
  ctx.fillStyle = INDIGO.base;
  ctx.fillRect(-s * 1.2 + s * 0.1, -s * 0.8 + s * 0.1, s * 2.2, s * 0.35);
  pen(ctx, CREAM.deep, s * 0.08);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-s * 1, -s * 0.1 + i * s * 0.32);
    ctx.lineTo(s * 0.6, -s * 0.1 + i * s * 0.32);
    ctx.stroke();
  }
  if (stamped > 0.01) {
    ctx.globalAlpha *= stamped;
    ell(ctx, s * 0.7, s * 0.25, s * 0.42, s * 0.42);
    pen(ctx, INK.deep, s * 0.12);
    ctx.stroke();
    star5(ctx, s * 0.7, s * 0.25, s * 0.26, INK.base, null);
  }
  ctx.restore();
}
function ladder(ctx, a, mode, x, y0, y1, al, lw) {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  const wood = '#a8744a';
  const woodSh = '#86583a';
  const ink = '#6e4a32';
  // (two rails, rungs between, a little reading seat on top with a brass rail, brass wheels below)
  for (const dx of [-5, 5]) {
    ctx.beginPath();
    ctx.moveTo(x + dx - 1, y0);
    ctx.lineTo(x + dx * 0.8 - 1, y1);
    ctx.lineTo(x + dx * 0.8 + 1, y1);
    ctx.lineTo(x + dx + 1, y0);
    ctx.closePath();
    paint2(ctx, mode, dx < 0 ? woodSh : wood, ink, lw);
  }
  if (mode === 'fill') {
    pen(ctx, woodSh, 1.3);
    for (let yy = y0 - 9; yy > y1 + 4; yy -= 9) {
      ctx.beginPath();
      ctx.moveTo(x - 4.6, yy);
      ctx.lineTo(x + 4.6, yy);
      ctx.stroke();
    }
  }
  rounded(ctx, [[x - 9, y1 - 1.5], [x + 9, y1 - 1.5], [x + 9, y1 + 2], [x - 9, y1 + 2]], 1);
  paint2(ctx, mode, wood, ink, lw);
  for (const dx of [-4, 4]) {
    ell(ctx, x + dx, y0 - 1.5, 1.7, 1.7);
    paint2(ctx, mode, GOLD.base, GOLD.ink, lw);
  }
  ctx.restore();
}
function paint2(ctx, mode, col, ink, lw) {
  if (mode === 'line') {
    pen(ctx, ink, lw);
    ctx.stroke();
  } else {
    ctx.fillStyle = col;
    ctx.fill();
  }
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.foQ;
  if (!q) return;
  const t = a.t ?? 0;
  const f = a.flip ? -1 : 1;
  const crown = headAt(a, D, [0, -26]);
  const face = headAt(a, D, [6, 4]);
  const Q = quillGeom(a, D);
  const BG = bookGeom(a, D);
  const X = q.fx;
  // always: a few motes of starlight ink drifting up off the open book
  if (m.hp > 0 && a.foBook && a.foBook.open > 0.5) {
    for (let i = 0; i < 3; i++) {
      const v = (t * 0.35 + hash(i * 3.3 + (m.uid ?? 0))) % 1;
      sparkle(ctx, BG.x - 6 + i * 6 + Math.sin(v * 6 + i) * 2, BG.y - 6 - v * 20, 0.9 + hash(i) * 0.4, Math.sin(Math.PI * v) * 0.8, INK.lt);
    }
  }
  if (!X) return;
  const u = X.u;
  if (X.kind === 'perch' || X.kind === 'notice') {
    if (X.kind === 'perch' && Math.sin(t * 0.7) > 0.6) cue(ctx, '♪', face[0] + 12, face[1] - 18 - Math.sin(t * 3) * 2, 7, f, -0.1, INDIGO.ink, '#fffaf0');
    if (X.kind === 'notice' && u > 0.6 && u < 2.2) cue(ctx, '...?', face[0] + 14, face[1] - 18, 7, f, -0.1, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'glide') {
    for (let i = 0; i < 5; i++) {
      const v = clamp(u * 0.6 - i * 0.08, 0, 1);
      page(ctx, -20 + i * 9 + Math.sin(v * 7 + i) * 6, -60 - X.down * -30 + v * 40 - i * 6, 2.2, v * 5 + i, Math.sin(Math.PI * v) * 0.9);
    }
    if (u > 0.2 && u < 0.7) cue(ctx, '*snap*', BG.x, BG.y - 14, 7, f, -0.1, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'card') {
    const hand = ptOf(a, D, 'handN', D.J.handN);
    libraryCard(ctx, hand[0] + 4, hand[1] - 2, 3.4, X.k, 0, -0.1);
    if (u > 0.3 && u < 2.2) cue(ctx, 'Library card?', crown[0] + 18, crown[1] - 4, 8, f, -0.06, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'overdue') {
    if (u > 0.5) inkStamp(ctx, 34, -46, 'OVERDUE', 9, win(u, 0.5, 0.6, 1.8, 2.3), -0.15, f);
    if (u > 0.5 && u < 1.2) for (let i = 0; i < 6; i++) inkDot(ctx, 34 + Math.cos(i) * (6 + (u - 0.5) * 30), -46 + Math.sin(i * 1.3) * (4 + (u - 0.5) * 20), 0.9, 1 - (u - 0.5) / 0.7);
  } else if (X.kind === 'gust') {
    for (let i = 0; i < 12; i++) {
      const v = clamp(u * 0.9 - i * 0.03, 0, 1);
      page(ctx, BG.x + Math.cos(i * 1.9) * (6 + v * 50), BG.y - 10 + Math.sin(i * 2.3) * (4 + v * 26) - v * 10, 2.4, v * 6 + i, Math.sin(Math.PI * v), i % 2 ? 1 : -1);
    }
  } else if (X.kind === 'castHardback') {
    sparkle(ctx, BG.x + 4, BG.y - 10, 1.6 + Math.sin(t * 9) * 0.5, 0.9, GOLD.lt);
  } else if (X.kind === 'rel_hardback') {
    if (u < 0.8) cue(ctx, 'THUD.', BG.x + 6, BG.y - 18, 9, f, -0.1, INDIGO.ink, '#fffaf0');
    for (let i = 0; i < 6; i++) {
      const v = clamp(u / 0.8, 0, 1);
      page(ctx, BG.x + Math.cos(i * 1.05) * (4 + v * 22), BG.y + 6 + Math.sin(i * 1.05) * 4 - v * 18 + v * v * 14, 2, v * 4 + i, 1 - v);
    }
  } else if (X.kind === 'castStacks') {
    if (u > 0.3 && u < 2.4) cue(ctx, 'Reshelving!', crown[0] + 16, crown[1] - 4, 8, f, -0.06, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'castRiffle' || X.kind === 'rel_riffle') {
    const k = X.kind === 'castRiffle' ? sstep(u / 0.4) : 1 - sstep(u / 0.8);
    for (let i = 0; i < 8; i++) {
      const an = t * 3 + (i / 8) * TAU;
      page(ctx, BG.x + Math.cos(an) * 16, BG.y - 4 + Math.sin(an) * 9, 2, an, k * (Math.sin(an) > 0 ? 1 : 0.6), i % 2 ? 1 : -1);
    }
  } else if (X.kind === 'castNoted') {
    // starlight ink trailing off her quill as she writes
    for (let i = 0; i < 7; i++) {
      const uu = u - i * 0.04;
      inkDot(ctx, Q.tip[0] + Math.sin(uu * 14) * 3 - i * 0.6, Q.tip[1] + Math.cos(uu * 14) * 2, 0.6, 1 - i / 7);
    }
    if (u > 0.3) cue(ctx, 'Noted.', crown[0] + 16, crown[1] - 4, 8, f, -0.06, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'rel_noted') {
    if (u < 0.6) sparkle(ctx, Q.tip[0], Q.tip[1], 2 * (1 - u / 0.6), 1, INK.lt);
  } else if (X.kind === 'castTop') {
    const hand = ptOf(a, D, 'handN', D.J.handN);
    sparkle(ctx, hand[0], hand[1] - 4, 1.8 + Math.sin(t * 8) * 0.5, 0.9, GOLD.lt);
    if (u > 0.2) cue(ctx, 'Top shelf!', crown[0] + 16, crown[1] - 4, 8, f, -0.06, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'castBottom') {
    if (u > 0.2) cue(ctx, 'Bottom shelf!', crown[0] + 16, crown[1] - 4, 8, f, -0.06, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'castScribes') {
    if (u > 0.3) cue(ctx, 'Scribes!', crown[0] + 16, crown[1] - 4, 8, f, -0.06, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'shelves') {
    if (u > 0.5 && u < 1.9) cue(ctx, 'Top shelf. Bottom shelf.', crown[0] + 10, crown[1] - 6, 7, f, -0.05, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'closing') {
    if (u > 0.4 && u < 1.9) cue(ctx, 'The Archive is CLOSING.', crown[0] + 8, crown[1] - 6, 7, f, -0.05, INDIGO.ink, '#fffaf0');
    for (let i = 0; i < 6; i++) {
      const v = clamp(u * 0.7 - i * 0.05, 0, 1);
      page(ctx, Math.cos(i * 1.1) * (10 + v * 40), -40 + Math.sin(i * 1.7) * 10 - v * 20, 2.2, v * 5 + i, Math.sin(Math.PI * v));
    }
  } else if (X.kind === 'quilljab') {
    if (u > -0.02 && u < 0.5) {
      const k = clamp(u / 0.4, 0, 1);
      inkDot(ctx, Q.tip[0] + 2 + k * 6, Q.tip[1], 1.2 * (1 - k * 0.5), 1 - k);
      for (let i = 0; i < 3; i++) sparkle(ctx, Q.tip[0] + 4 + Math.cos(i * 2.1) * k * 8, Q.tip[1] + Math.sin(i * 2.1) * k * 6, 1.4 * (1 - k), 1 - k, INK.lt);
    }
  } else if (X.kind === 'bookbonk') {
    if (u > -0.02 && u < 0.5) {
      const k = clamp(u / 0.4, 0, 1);
      if (u < 0.35) cue(ctx, 'Bonk.', BG.x + 8, BG.y - 14, 8, f, -0.1, INDIGO.ink, '#fffaf0');
      for (let i = 0; i < 4; i++) dust(ctx, BG.x + 6 + Math.cos(i * 1.6) * k * 10, BG.y + 6 + Math.sin(i * 1.6) * k * 5, 1.6 * (1 - k * 0.5), 1 - k, '#ffffff', CREAM.sh);
    }
  } else if (X.kind === 'wingbuffet') {
    if (u > -0.02 && u < 0.55) {
      const k = clamp(u / 0.5, 0, 1);
      for (let i = 0; i < 5; i++) page(ctx, 12 + k * 30 + i * 4, -40 + i * 6 + Math.sin(k * 6 + i) * 3, 1.8, k * 4 + i, 1 - k, i % 2 ? 1 : -1);
      pen(ctx, 'rgba(255,255,255,0.8)', 1.6 * (1 - k));
      ctx.beginPath();
      ctx.arc(4, -34, 18 + k * 8, -0.7, 0.7);
      ctx.stroke();
    }
  } else if (X.kind === 'ready') {
    sparkle(ctx, Q.tip[0], Q.tip[1], 1.2 + Math.sin(t * 9) * 0.4, 0.7 * (X.k ?? 1), INK.lt);
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.5, 0, 1);
    if (a.foBook) page(ctx, BG.x + 4 + v * 10, BG.y - 6 - Math.sin(v * Math.PI) * 12 + v * 10, 2.2, v * 4, 1 - v);
    sparkle(ctx, face[0] - 4, face[1] - 12, 2 * (1 - v), 1 - v, '#ffe8f4');
  } else if (X.kind === 'gloat') {
    const k = win(u, 0, 0.12, 0.6, 0.9);
    cue(ctx, 'shh~', face[0] + 14 + u * 4, face[1] - 16 - u * 8, 7, f, -0.08, INDIGO.ink, '#fffaf0');
    sparkle(ctx, face[0] + 22 + u * 4, face[1] - 22 - u * 10, 1.4, k, INK.lt);
  } else if (X.kind === 'read') {
    if (u > 4.4 && u < 6.4) cue(ctx, '♪', face[0] + 12, face[1] - 18 - Math.sin(u * 5) * 2, 7, f, -0.1, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'dust') {
    if (u > 1.3 && u < 2.4) for (let i = 0; i < 4; i++) dust(ctx, BG.x + 4 + (u - 1.3) * 18 + i * 2, BG.y - 8 - i * 2, 1 + (u - 1.3), 1 - (u - 1.3) / 1.1, '#ffffff', '#e6e0f0');
    if (u > 2.8 && u < 3.8) cue(ctx, 'hic!', face[0] + 14, face[1] - 16, 8, f, -0.12, INDIGO.ink, '#fffaf0');
    if (u > 4.2 && u < 5.8) cue(ctx, '...nobody saw.', face[0] + 18, face[1] - 20, 7, f, -0.08, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'cardstamp') {
    const hand = ptOf(a, D, 'handN', D.J.handN);
    libraryCard(ctx, BG.x + 2, BG.y - 2, 3, win(u, 0.4, 0.8, 5, 5.5), sstep((u - 2.65) / 0.1), 0.05);
    // (her little stamp, in her hand)
    ctx.save();
    ctx.translate(hand[0] + 1, hand[1] + 1.5);
    rounded(ctx, [[-1.4, 0], [1.4, 0], [1.4, 2.2], [-1.4, 2.2]], 0.5);
    ctx.fillStyle = INDIGO.base;
    ctx.fill();
    ell(ctx, 0, -1.2, 1.1, 1.3);
    ctx.fillStyle = '#a8744a';
    ctx.fill();
    ctx.restore();
    if (u > 2.6 && u < 3.4) cue(ctx, 'thunk', BG.x + 10, BG.y - 10, 7, f, -0.1, INDIGO.ink, '#fffaf0');
  } else if (X.kind === 'preen') {
    if (u > 0.6 && u < 2.6) for (let i = 0; i < 3; i++) {
      const v = (u * 0.8 + i / 3) % 1;
      sparkle(ctx, -14 - v * 12, -40 + i * 8 - v * 6, 1.2, Math.sin(Math.PI * v), '#ffffff');
    }
  } else if (X.kind === 'beaten') {
    // the Catalogue fallen open on the floor beside her, pages everywhere; little stars round her head
    drawBook(ctx, a, 'line', 26, -3.5, 0.06, 1, 0, 0.8, LWR);
    drawBook(ctx, a, 'fill', 26, -3.5, 0.06, 1, 0, 0.8, LWR);
    for (let i = 0; i < 4; i++) page(ctx, -18 + i * 14 + hash(i) * 6, -1.6, 2, 1.4 + hash(i * 3) * 0.4, 0.9, 1);
    for (let i = 0; i < 3; i++) {
      const an = t * 2.4 + (i / 3) * TAU;
      const px = crown[0] + Math.cos(an) * 10;
      const py = crown[1] + 6 + Math.sin(an) * 3;
      if (i % 2) sparkle(ctx, px, py, 1.8, Math.sin(an) > 0 ? 1 : 0.55, GOLD.lt);
      else page(ctx, px, py, 1.5, an, Math.sin(an) > 0 ? 1 : 0.55);
    }
  }
}
// ---------- Her dress (the rig's hooks) ----------
const DRESS = {
  id: 'folio',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: SKIN_INK, guides: false, out: 2 / BIG },
  liveHead: true,
  liveWings: true,
  noMoves: true,
  // (behind everything of her: the ladder (in her entrance), her wings, her long hair)
  under2: (ctx, m, a, S, matOf, D) => {
    LWK = (2 / BIG) / D.SC;
    const q = a.foQ ?? {};
    for (const mode of ['line', 'fill']) {
      if (q.ladder > 0.01) {
        const seat = ptOf(a, D, 'torso', D.J.hip);
        ladder(ctx, a, mode, seat[0] - 2 - (1 - q.ladder) * 30, 0, seat[1] + 3, q.ladder, LWR);
      }
      wing(ctx, a, mode, D, 'F', LWR);
      wing(ctx, a, mode, D, 'N', LWR);
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'back', q, a.foF, a.foHair ?? {}, LWK / HS);
      ctx.restore();
    }
  },
  over: {
    armF: (ctx, a, mode, S, D) => {
      sleeve(ctx, a, mode, D, 'F', LWR);
      if (!a.mo?.rig?.foBookFront && a.foBook) book(ctx, a, mode, D, LWR);
    },
    legF: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'F', LWR),
    footFskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'F', LWR),
    legN: (ctx, a, mode, S, D) => stocking(ctx, a, mode, D, 'N', LWR),
    footNskin: (ctx, a, mode, S, D) => boot(ctx, a, mode, D, 'N', LWR),
    torsoSkin: (ctx, a, mode, S, D) => {
      if (mode === 'fill') bodice(ctx, a, D);
      else if (a.blTorsoPts) {
        ctx.beginPath();
        a.blTorsoPts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
        ctx.closePath();
        pen(ctx, INDIGO.ink, LWR);
        ctx.stroke();
      }
      skirt(ctx, a, mode, D, LWR);
      keys(ctx, a, mode, D, LWR);
    },
    neckSkin: (ctx, a, mode, S, D) => collar(ctx, a, mode, D, LWR),
    head: (ctx, a, mode, S, D) => {
      ctx.save();
      headIn(ctx, a, D);
      drawHead(ctx, a, mode, 'front', a.foQ ?? {}, a.foF, a.foHair ?? {}, LWK / HS);
      ctx.restore();
    },
    armN: (ctx, a, mode, S, D) => {
      sleeve(ctx, a, mode, D, 'N', LWR);
      heldQuill(ctx, a, mode, D, LWR);
    },
    handNskin: (ctx, a, mode, S, D) => {
      if (a.mo?.rig?.foBookFront && a.foBook) book(ctx, a, mode, D, LWR);
    },
  },
  pose,
  fx,
};
const R = dressRig('archivist', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  ctx.save();
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.5);
// Her art entry (`noHop`: none of the monster drawer's hops or idle notes; `ownEmotes`: her marks over
// her head are her own), her size as drawn and her walking pace (the base's own at her size).
export const FOLIO_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [110, 180, 320, 240], draw: R.still, rig, noHop: true, ownEmotes: true };
export const FOLIO_SIZE = { w: 56, h: 112, speed: Math.round(R.speed * BIG) };
