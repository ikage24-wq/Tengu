// Lady Marigold, the Eternal Hostess, on screen (2026-11-26, remade from scratch: the Moonlit Manor's
// final boss, her story kept, world/manor.js her new fight). A lonely ghost hostess who has thrown the
// same midnight party for a hundred years with nobody coming: she floats, and her ball gown's skirt
// of marigold petals melts into a long glowing ghostly train (marigolds light the way home for
// spirits; she is the one ghost who won't let her guest go home). Over-eager, theatrical, a little
// tragic, never scary. She moves on her own copy of the spirit base (rig.js; body.js `hostess`: a
// slender lady's upper body, no legs), dressed here; her head, hair, gown and train drawn here from
// scratch over the mannequin's (never the shared face, never the hero's body or hair).
//   look    moonlit pale skin; plum-wine hair in a round chignon with a marigold blossom pinned in it,
//           a fringe swept to the side in three rounded clumps (each on its own spring), two soft
//           ringlets framing her cheeks (sprung chains); an off-shoulder marigold bodice with a frill
//           of cream petals and puffed petal sleeves; a plum sash with a bow at her back (its tails
//           sprung); a skirt of seven big rounded marigold petals in three layers, each petal on its
//           own spring (never a rigid bell), flowing into her train: a chain of six sprung pieces
//           from her hips down to just over the floor and away behind her, fading from marigold to a
//           pale moonlit gold, scalloped like petals, curling up at its tip; long white satin
//           gloves; her dance card (cream, gilt edged, every line blank) on a ribbon at her near
//           wrist; at her hip a little gold pocket watch on its chain, stopped at midnight. Her own
//           soft rose-plum outline on the outer edge only, her face bare.
//   eyes    tall soft rounded eyes: a plum-to-honey iris with a pale ring, a flame-shaped glint (a
//           candle's reflection) and a little round one; a thick upper lash line that sweeps up into
//           a winged flick at the outer corner; a lower lid with two tiny lashes; fine plum brows.
//           Faces: gracious (rest), delighted (sparkles in her eyes), pleading, pout, sad (teary),
//           focus (casting), dreamy (waltzing), shock, hurt (> <), dizzy (beaten), talk (vowels),
//           bliss (a tart!), sheepish.
//   idle    a 30 s act, only while calm (before the party starts): her dance card read (every line
//           blank, a sigh; then a pretend name written with a fingertip, pressed to her heart); her
//           stopped watch (tapped, held to her ear, a little frown); a practice waltz alone (a slow
//           turn, eyes closed; caught at it, a blush, the skirt smoothed); a wave to the door
//           (nobody there; a pat of her chignon as if that was what she meant).
//   glide   she waltzes along with an invisible partner: one hand raised in his, the other on his
//           shoulder, swaying, the train trailing.
//   fight   between casts her swings at the tank in turn: Petal Flick (a flick of her wrist, a puff of
//           petals), Train Swish (a half turn, her train swept round low at you), Shoo! (a prim little
//           two-fingered push). Her casts (m.castPose, world/manor.js): invite (an envelope held up,
//           then sent off with a flick), stay (arms flung wide, pleading), room (arms up, a spin:
//           clean mirror flips, the train swirling), toast (a ghostly coupe raised high), dance (a
//           curtsey and a hand held out, then a twirl), clap (two claps and a call), chime (the
//           watch held up before her face, alarmed), waltz (the hold, eyes closed, a slow turn, then
//           arms flung out). A phase change (m.phaseAt): a delighted clap (Second Helpings) or the
//           watch ticking again in her hands (Midnight). A tart arriving (m.feastAt): cupped hands, a
//           bite, bliss.
//   scenes  her entrance (manor_marigold): 'away' (not there yet), 'arrive' (she descends from the
//           moon down its beam, turning slowly as she comes, the train unfurling, petals spiralling
//           round her) and 'curtsey'; 'attack' her flourish; the director's sway, free and fade.
//   moods   hurt: a flinch, a petal knocked loose; low on health: pleading, a sweat drop; beaten: sunk
//           down on her train, dizzy, petals drifting.
import { dressRig } from './rig.js';
import { TAU, clamp, mix, sstep, hash, win, tone, ell, smooth, sline, pen, glow, sparkle, sweat, tear, cue, spring } from './fx.js';

const INK = '#a2607e';
const SKIN = ['#fffaf7', '#fcefe9', '#efd8da', '#d8b8c6'];
const GOWN = ['#ffe6a6', '#ffbb4c', '#f6922e', '#d06a24'];
const PETAL = ['#fff4c4', '#ffd26a', '#ffae3c'];
const CREAMY = ['#ffffff', '#fff6e6', '#f0dcc4'];
const HAIR = ['#c2678e', '#934067', '#6e2c4e', '#521c3a'];
const SASH = ['#b47cc0', '#7c4a8c', '#5a2e6a'];
const GLOVE = ['#fffaff', '#f1e2f2', '#d2b8d8', '#b48cba'];
const GOLD = ['#fff2b4', '#f4c450', '#c48f2c'];
const LASH = '#5a2846';
const IRIS = ['#ffe2a0', '#e8a456', '#a0587c', '#5a2a50'];
// (her drawn size over the base's)
const BIG = 2;
const LW = 2 / BIG;

const paint = (ctx, a, mode, col, w = LW) => {
  if (mode === 'line') {
    pen(ctx, INK, w);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, col);
    ctx.fill();
  }
};
function enter(ctx, a, D, bone) {
  D.frame(ctx, a, bone);
  const p = D.J[D.PIV[bone]];
  ctx.scale(D.SC, D.SC);
  ctx.translate(-p[0], -p[1]);
}
const ptOf = (a, D, bone, p) => D.at(a, bone, [(p[0] - D.J[D.PIV[bone]][0]) * D.SC, (p[1] - D.J[D.PIV[bone]][1]) * D.SC]);
// (a bone's angle in the rig's space)
const boneAng = (a, bone) => {
  const M = a.blMat(bone);
  return Math.atan2(M[1], M[0]);
};
// ---------- Her head (kid units about her neck joint) ----------
const HS = 1.08;
const HO = [1.2, -18.5];
const headAt = (a, D, [u, v]) => {
  const n = D.J.neck;
  return ptOf(a, D, 'head', [n[0] + (HO[0] + u) * HS, n[1] + (HO[1] + v) * HS]);
};

// ---------- Her face (every part eased) ----------
// lid (0 open .. 1 shut: only blinks and closed-eye moods), shut (which closed shape), bt (brow
// tilt: + knit, - worried), by (raise), mw/ms/mo (mouth width, smile, open), te (teeth), bl (blush), sp
// (sparkles in her eyes), wet (tears brimming), po (a pout), sm (small irises: shock).
// (Redone 2026-11-26 after the player's "fix the hair and outfits being on top and eye lids over eyes.
// Hair to badly made": in every awake mood both eyes and the whole iris stay clear, the lid only a
// neat lash line; the fringe an even blunt round cut just above the lashes; the hair one head of
// hair lit from one shared light; ringlets and the chignon behind the face.)
const FACES = {
  gracious: { lid: 0, shut: 'happy', bt: -0.05, by: 0.1, mw: 0.85, ms: 0.5, mo: 0, te: 0, bl: 0.55, sp: 0, wet: 0, po: 0, sm: 0 },
  delighted: { lid: 0, shut: 'happy', bt: -0.2, by: 0.7, mw: 1.15, ms: 1, mo: 0.85, te: 0, bl: 0.9, sp: 1, wet: 0, po: 0, sm: 0 },
  happy: { lid: 1, shut: 'happy', bt: -0.2, by: 0.6, mw: 1.1, ms: 1, mo: 0.6, te: 0, bl: 0.9, sp: 0, wet: 0, po: 0, sm: 0 },
  pleading: { lid: 0, shut: 'happy', bt: -0.85, by: 0.5, mw: 0.6, ms: -0.2, mo: 0.4, te: 0, bl: 0.7, sp: 0.2, wet: 0.7, po: 0, sm: 0 },
  pout: { lid: 0, shut: 'happy', bt: 0.75, by: -0.2, mw: 0.55, ms: -0.5, mo: 0, te: 0, bl: 0.9, sp: 0, wet: 0, po: 1, sm: 0 },
  sad: { lid: 0, shut: 'happy', bt: -0.85, by: 0.2, mw: 0.75, ms: -0.6, mo: 0.1, te: 0, bl: 0.5, sp: 0, wet: 1, po: 0, sm: 0.1 },
  focus: { lid: 0, shut: 'happy', bt: 0.4, by: 0, mw: 0.8, ms: 0.35, mo: 0, te: 0, bl: 0.55, sp: 0, wet: 0, po: 0, sm: 0.08 },
  cry: { lid: 0, shut: 'happy', bt: 0.5, by: 0.3, mw: 1.15, ms: 0.2, mo: 1, te: 0, bl: 0.8, sp: 0.3, wet: 0, po: 0, sm: 0.2 },
  dreamy: { lid: 1, shut: 'sleep', bt: -0.25, by: 0.3, mw: 0.9, ms: 0.7, mo: 0.1, te: 0, bl: 0.8, sp: 0, wet: 0, po: 0, sm: 0 },
  shock: { lid: 0, shut: 'happy', bt: -0.4, by: 1, mw: 0.6, ms: -0.1, mo: 0.75, te: 0, bl: 0.5, sp: 0, wet: 0.2, po: 0, sm: 0.9 },
  hurt: { lid: 1, shut: 'squeeze', bt: -0.6, by: 0.2, mw: 0.9, ms: -0.5, mo: 0.5, te: 1, bl: 0.7, sp: 0, wet: 0, po: 0, sm: 0 },
  dizzy: { lid: 1, shut: 'dizzy', bt: -0.4, by: 0.3, mw: 0.8, ms: -0.3, mo: 0.4, te: 0, bl: 0.5, sp: 0, wet: 0, po: 0, sm: 0 },
  bliss: { lid: 1, shut: 'happy', bt: -0.3, by: 0.5, mw: 1, ms: 1, mo: 0.3, te: 0, bl: 1, sp: 0, wet: 0, po: 0.5, sm: 0 },
  sheepish: { lid: 0, shut: 'happy', bt: -0.5, by: 0.2, mw: 0.8, ms: 0.45, mo: 0, te: 0, bl: 1, sp: 0, wet: 0, po: 0, sm: 0 },
  talk: { lid: 0, shut: 'happy', bt: -0.1, by: 0.3, mw: 0.9, ms: 0.45, mo: 0.4, te: 0, bl: 0.6, sp: 0, wet: 0, po: 0, sm: 0 },
};
const SHUTS = ['happy', 'sleep', 'squeeze', 'dizzy'];
const VOWELS = [[0.6, 0.2, 0.85], [1.15, 0.5, 0.65], [1.1, 0.6, 0.3], [0.8, 0.3, 0], [0.7, 0.3, 0.55]];
// (the eyes' place on her face: same size, level)
const EYE = { y: 2.8, dx: 5.3, w: 3.35, h: 4.4 };

// Corner cutting: a closed run of points rounded (every corner soft, the shape kept close).
function chaikin(pts, n = 2) {
  let q = pts;
  for (let k = 0; k < n; k++) {
    const o = [];
    for (let i = 0; i < q.length; i++) {
      const p0 = q[i];
      const p1 = q[(i + 1) % q.length];
      o.push([p0[0] * 0.75 + p1[0] * 0.25, p0[1] * 0.75 + p1[1] * 0.25], [p0[0] * 0.25 + p1[0] * 0.75, p0[1] * 0.25 + p1[1] * 0.75]);
    }
    q = o;
  }
  return q;
}
function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  ctx.closePath();
}

// One eye: tall and rounded, both the same size. side +1: the one toward the way she faces (its outer
// corner on the right).
function eye(ctx, a, x, y, side, f, look) {
  const { w, h } = EYE;
  const t = a.t ?? 0;
  const blink = f.lid < 0.6 ? win((t + (a.mgUid ?? 0) * 0.7) % 4.6, 4.08, 4.2, 4.28, 4.44) : 0;
  const L = Math.max(f.lid, blink);
  const closedW = sstep((L - 0.72) / 0.28);
  const inner = x - side * w;
  const outer = x + side * w;
  if (closedW > 0.01) {
    ctx.save();
    ctx.globalAlpha *= closedW;
    for (const s of SHUTS) {
      const sw = f.shut[s];
      if (sw <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha *= sw;
      if (s === 'happy' || s === 'sleep') {
        // one tapered stroke ending in a small curled tail at the outer corner
        const up = s === 'happy' ? -1 : 1;
        const pts = [];
        for (let i = 0; i <= 12; i++) {
          const u = i / 12;
          pts.push([inner + (outer - inner) * u, y + 0.4 + up * Math.sin(Math.PI * u) * h * (s === 'happy' ? 0.55 : 0.32)]);
        }
        ctx.beginPath();
        pts.forEach((p, i) => {
          const tw = 0.18 + 0.5 * (i / 12);
          if (!i) ctx.moveTo(p[0], p[1] - tw);
          else ctx.lineTo(p[0], p[1] - tw);
        });
        for (let i = 12; i >= 0; i--) ctx.lineTo(pts[i][0], pts[i][1] + 0.18 + 0.5 * (i / 12));
        ctx.closePath();
        ctx.fillStyle = tone(a, LASH);
        ctx.fill();
        pen(ctx, tone(a, LASH), 0.55);
        ctx.beginPath();
        ctx.moveTo(outer, y + 0.4);
        ctx.quadraticCurveTo(outer + side * 1.1, y + 0.3, outer + side * 1.2, y - 0.8);
        ctx.stroke();
      } else if (s === 'squeeze') {
        pen(ctx, tone(a, LASH), 0.8);
        ctx.beginPath();
        ctx.moveTo(x + side * w, y - 2.3);
        ctx.quadraticCurveTo(x - side * w * 0.1, y - 0.3, x - side * w * 0.9, y + 0.3);
        ctx.quadraticCurveTo(x - side * w * 0.1, y + 0.8, x + side * w, y + 2.7);
        ctx.stroke();
      } else {
        pen(ctx, tone(a, LASH), 0.6);
        ctx.beginPath();
        for (let i = 0; i <= 26; i++) {
          const an = (i / 26) * TAU * 2 + t * 4 * side;
          const r = (i / 26) * w * 0.95;
          const p = [x + Math.cos(an) * r, y + Math.sin(an) * r * 1.15];
          if (i) ctx.lineTo(...p);
          else ctx.moveTo(...p);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }
  const openW = 1 - closedW;
  if (openW <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= openW;
  // a soft rosy-peach eyeshadow wash and the lid's crease above the eye
  glow(ctx, x + side * 0.6, y - h * 0.95, 4.2, '#ffb7a8', 0.32);
  pen(ctx, tone(a, SKIN[3], 0.55), 0.35);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.75, y - h * 1.02);
  ctx.quadraticCurveTo(x + side * 0.4, y - h * 1.32, x + w * 0.8, y - h * 1.0);
  ctx.stroke();
  const shape = () => {
    ctx.beginPath();
    ctx.moveTo(x - w, y - h * 0.18);
    ctx.bezierCurveTo(x - w, y - h * 1.02, x + w, y - h * 1.02, x + w, y - h * 0.18);
    ctx.bezierCurveTo(x + w * 1.02, y + h * 0.86, x - w * 1.02, y + h * 0.86, x - w, y - h * 0.18);
    ctx.closePath();
  };
  shape();
  ctx.fillStyle = tone(a, '#fffdfb');
  ctx.fill();
  ctx.save();
  shape();
  ctx.clip();
  const small = 1 - 0.34 * f.sm;
  const ix = x + side * 0.15 + (look?.[0] ?? 0) * 0.8;
  const iy = y + 0.35 + (look?.[1] ?? 0) * 0.7;
  // the layered iris: a deep rim, a plum-to-honey gradient, fine lines of light, the pupil
  const g = ctx.createLinearGradient(0, iy - 3.8, 0, iy + 3.8);
  g.addColorStop(0, tone(a, IRIS[3]));
  g.addColorStop(0.42, tone(a, IRIS[2]));
  g.addColorStop(0.8, tone(a, IRIS[1]));
  g.addColorStop(1, tone(a, IRIS[0]));
  ell(ctx, ix, iy, 2.7 * small, 3.5 * small);
  ctx.fillStyle = g;
  ctx.fill();
  pen(ctx, tone(a, '#4a1c42', 0.9), 0.4);
  ctx.stroke();
  pen(ctx, tone(a, '#ffe2b8', 0.55), 0.28);
  for (const [a0, a1, rr] of [[0.35, 1.1, 2.0], [1.9, 2.6, 1.8], [0.9, 1.5, 2.3]]) {
    ctx.beginPath();
    ctx.ellipse(ix, iy + 0.2, rr * small, rr * 1.25 * small, 0, a0, a1);
    ctx.stroke();
  }
  ell(ctx, ix, iy + 0.1, 1.2 * small, 1.7 * small);
  ctx.fillStyle = tone(a, '#3e1834');
  ctx.fill();
  // the upper lid's soft shadow on the white (a thin wash, never over the iris)
  const sg = ctx.createLinearGradient(0, y - h, 0, y - h * 0.55);
  sg.addColorStop(0, 'rgba(120,60,100,0.32)');
  sg.addColorStop(1, 'rgba(120,60,100,0)');
  ctx.fillStyle = sg;
  ctx.fillRect(x - w * 1.2, y - h * 1.1, w * 2.4, h * 0.6);
  // the glints: her signature flame-shaped one up at the back, a small round one low at the front;
  // in delight they swell into little sparkles
  const sp = f.sp;
  const gx = ix - side * 1.0;
  const gy = iy - 1.6 * small;
  if (sp < 0.98) {
    ctx.save();
    ctx.globalAlpha *= 1 - sp;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 1.5);
    ctx.quadraticCurveTo(gx + 0.85, gy - 0.2, gx + 0.55, gy + 0.65);
    ctx.quadraticCurveTo(gx, gy + 1.15, gx - 0.55, gy + 0.65);
    ctx.quadraticCurveTo(gx - 0.85, gy - 0.2, gx, gy - 1.5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  if (sp > 0.02) {
    const s4 = 1.6 * sp;
    ctx.save();
    ctx.globalAlpha *= sp;
    ctx.beginPath();
    ctx.moveTo(gx, gy - s4);
    ctx.quadraticCurveTo(gx, gy, gx + s4, gy);
    ctx.quadraticCurveTo(gx, gy, gx, gy + s4);
    ctx.quadraticCurveTo(gx, gy, gx - s4, gy);
    ctx.quadraticCurveTo(gx, gy, gx, gy - s4);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  }
  ell(ctx, ix + side * 0.95, iy + 1.5 * small, 0.5 * (1 + sp * 0.4), 0.5 * (1 + sp * 0.4));
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  if (f.wet > 0.05) {
    ell(ctx, ix, y + h * 0.62, w * 0.9, 0.9);
    ctx.fillStyle = `rgba(220,242,255,${0.75 * f.wet})`;
    ctx.fill();
  }
  // (the lid sweeping down over it, skin-toned, only for a mood's lids; a blink is a quick cross-fade
  // to the closed eye, so nothing slides across the eye in a frame)
  const Lo = clamp(f.lid, 0, 0.9);
  if (Lo > 0.01) {
    ctx.fillStyle = tone(a, SKIN[1]);
    ctx.fillRect(x - w * 1.3, y - h * 1.4, w * 2.6, h * 1.75 * Lo + h * 0.4);
  }
  ctx.restore();
  // the upper lash: one closed shape, thin at the inner corner, thickening to a soft upturned wing,
  // two short round-tipped flicks grown from it leaning outward
  const top = (u) => y - h * 0.18 - (h * 0.62 + 0.15) * Math.sin(Math.PI * (0.08 + u * 0.84)) + h * 1.75 * Lo - f.bt * (side > 0 ? 0.2 : -0.2) * (u - 0.5);
  const N = 14;
  const upper = [];
  const lower = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const px = inner + (outer - inner) * u;
    const th = 0.2 + 0.95 * u ** 1.6;
    upper.push([px, top(u) - th * 0.55]);
    lower.push([px, top(u) + th * 0.45]);
  }
  const tip = [outer + side * 1.5, top(1) - 1.5];
  ctx.beginPath();
  ctx.moveTo(...lower[0]);
  for (const p of upper) ctx.lineTo(...p);
  ctx.quadraticCurveTo(outer + side * 1.1, top(1) - 1.2, tip[0], tip[1]);
  ctx.quadraticCurveTo(tip[0] + side * 0.35, tip[1] + 0.45, outer + side * 0.6, top(1) + 0.55);
  for (let i = N; i >= 0; i--) ctx.lineTo(...lower[i]);
  ctx.closePath();
  ctx.fillStyle = tone(a, LASH);
  ctx.fill();
  for (const [u, len, lean] of [[0.8, 0.7, 0.9], [0.92, 0.85, 1.15]]) {
    const px = inner + (outer - inner) * u;
    const py = top(u) - 0.4;
    const an = -Math.PI / 2 + side * lean;
    const ex = px + Math.cos(an) * len;
    const ey = py + Math.sin(an) * len;
    pen(ctx, tone(a, LASH), 0.42);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.quadraticCurveTo(px + side * 0.25, (py + ey) / 2, ex, ey);
    ctx.stroke();
  }
  // a soft sheen along the lash
  pen(ctx, 'rgba(255,220,240,0.35)', 0.22);
  ctx.beginPath();
  ctx.moveTo(x - w * 0.3, top(0.4) - 0.15);
  ctx.lineTo(x + w * 0.3, top(0.6) - 0.15);
  ctx.stroke();
  ctx.restore();
}
// Round brows: short, full, even thickness, round at both ends, gently curved.
function brow(ctx, a, x, y, side, f) {
  const yi = y - f.by * 0.85 + f.bt * 0.75;
  const yo = y - f.by * 0.85 - f.bt * 0.3;
  const xi = x - side * 1.7;
  const xo = x + side * 1.9;
  pen(ctx, tone(a, HAIR[1]), 0.85);
  ctx.beginPath();
  ctx.moveTo(xi, yi);
  ctx.quadraticCurveTo(x, Math.min(yi, yo) - 0.55, xo, yo + 0.15);
  ctx.stroke();
}
// The mouth: closed at rest, one smooth lip line fuller in the middle whose corners curl up (the
// one toward her face's turn a touch more), a soft lower lip; open shapes for her expressions.
function mouth(ctx, a, x, y, f) {
  const w = 1.7 * f.mw * (1 - 0.3 * f.po);
  const cy = y - f.ms * 0.55;
  if (f.mo > 0.08) {
    const o = f.mo;
    ctx.beginPath();
    ctx.moveTo(x - w, cy);
    ctx.quadraticCurveTo(x, y + f.ms * 0.5 - o * 0.4, x + w, cy - 0.1);
    ctx.quadraticCurveTo(x, y + f.ms * 0.9 + o * 2.4, x - w, cy);
    ctx.fillStyle = tone(a, '#a2385e');
    ctx.fill();
    ctx.save();
    ctx.clip();
    ell(ctx, x, y + f.ms * 0.7 + o * 2, w * 0.7, o * 0.9);
    ctx.fillStyle = tone(a, '#f08aa6');
    ctx.fill();
    if (f.te > 0.05) {
      ctx.fillStyle = tone(a, '#ffffff', f.te);
      ctx.fillRect(x - w, cy - 0.4, w * 2, 0.7);
    }
    ctx.restore();
    return;
  }
  // (a thin crescent: fuller in the middle, its corners curling up as part of it)
  const lift = f.ms * 0.6;
  ctx.beginPath();
  ctx.moveTo(x - w - 0.2, cy - lift * 0.3);
  ctx.quadraticCurveTo(x, y + f.ms * 0.55 - 0.12, x + w + 0.25, cy - lift * 0.45 - 0.1);
  ctx.quadraticCurveTo(x, y + f.ms * 0.55 + 0.42, x - w - 0.2, cy - lift * 0.3);
  ctx.closePath();
  ctx.fillStyle = tone(a, '#a84868');
  ctx.fill();
  // a soft lower lip and its little shine
  glow(ctx, x, y + 0.9, 1.6, '#ff9cb4', 0.35);
  ell(ctx, x + 0.3, y + 0.95, 0.35, 0.15);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.fill();
  if (f.po > 0.3) {
    ell(ctx, x + 0.2, y + 0.75, 0.9 * f.po, 0.45 * f.po);
    ctx.fillStyle = tone(a, '#f6a0b8', 0.7);
    ctx.fill();
  }
}

// ---------- Her hair (plum-wine, one head of hair under one light) ----------
// Her face: full cheeks at eye level, a straighter jaw to a small softly pointed chin.
function skullPts(tx) {
  return chaikin([[0, -17.4], [11.4, -13], [15.8, -4], [15.6, 4.4], [12.4, 10.6], [5.8 + tx * 0.2, 15], [1.2 + tx * 0.35, 16.5], [-4.6 + tx * 0.2, 15.2], [-12, 10.6], [-15.6, 4.2], [-16, -4], [-11.6, -13]], 3);
}
// The one light every lock is coloured from: lit at the top of her head, deeper toward the ends.
function hairFill(ctx, a) {
  const g = ctx.createLinearGradient(0, -22, 0, 30);
  g.addColorStop(0, tone(a, '#bb5f8a'));
  g.addColorStop(0.28, tone(a, '#9a446c'));
  g.addColorStop(0.55, tone(a, '#86375e'));
  g.addColorStop(1, tone(a, '#64264a'));
  return g;
}
const DEEP = '#5a2046';
const SHINE = '#eeb2cf';
// Paints a hair shape: its outline in the line pass; in the fill pass the shared light, then its own
// soft shading (a callback, clipped to it).
function hairShape(ctx, a, mode, pts, shade) {
  poly(ctx, pts);
  if (mode === 'line') {
    pen(ctx, INK, LW / HS);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = hairFill(ctx, a);
  ctx.fill();
  if (shade) {
    ctx.save();
    poly(ctx, pts);
    ctx.clip();
    shade();
    ctx.restore();
  }
}
// The cut: one even U-shaped line following her forehead, lowest in the middle just above her lashes,
// rising to her temples.
const CUT = { y: -4.5, rise: 3.8, half: 14.4 };
const cutY = (x, cx) => CUT.y + CUT.rise * ((x - cx) / CUT.half) ** 2;
// Its sections: where each split rises from the cut (a fraction of the width), how deep it goes, how
// wide it opens at the cut; narrower sections toward the sides, each a little different.
const SPLITS = [[0.17, 3.0, 1.0], [0.39, 4.2, 1.25], [0.61, 3.6, 1.1], [0.83, 2.7, 0.9]];
function fringeGeom(tx, sw) {
  const cx = 0.6 + tx * 0.6;
  const x0 = cx - CUT.half - 0.6;
  const x1 = cx + CUT.half + 0.6;
  const W = x1 - x0;
  const topY = (x) => -15.6 + 0.018 * (x - cx) ** 2;
  const xs = [x0, ...SPLITS.map(([u]) => x0 + W * u), x1];
  const secs = [];
  for (let i = 0; i < xs.length - 1; i++) {
    const L = xs[i];
    const R = xs[i + 1];
    const sl = i > 0 ? SPLITS[i - 1] : null;
    const sr = i < SPLITS.length ? SPLITS[i] : null;
    // (each section's end sways a touch on its own spring; its root stays put)
    const dx = (sw?.[i % 3] ?? 0) * 4 * (i % 2 ? -1 : 1);
    const lb = sl ? L + sl[2] / 2 : L + 0.4;
    const rb = sr ? R - sr[2] / 2 : R - 0.4;
    const pts = [[L, topY(L)], [R, topY(R)]];
    if (sr) pts.push([R, cutY(R, cx) - sr[1]]);
    const n = 6;
    for (let k = 0; k <= n; k++) {
      const x = rb + (lb - rb) * (k / n);
      // (trimmed flat along the cut, the corners soft)
      pts.push([x + dx * (1 - Math.abs(k / n - 0.5) * 2) * 0.3 + dx * 0.5, cutY(x, cx) + 0.25 * Math.sin(Math.PI * (k / n))]);
    }
    if (sl) pts.push([L, cutY(L, cx) - sl[1]]);
    secs.push({ pts: chaikin(pts, 2), L, R, mid: (L + R) / 2 });
  }
  return { cx, x0, x1, xs, secs, topY };
}
function fringe(ctx, a, mode, tx, sw) {
  const G = fringeGeom(tx, sw);
  // the deeper inner layer, seen up inside the splits
  const inner = chaikin([[G.x0 + 0.6, G.topY(G.x0) + 1], [G.x1 - 0.6, G.topY(G.x1) + 1], ...Array.from({ length: 9 }, (_, k) => {
    const x = G.x1 - 0.8 - (G.x1 - G.x0 - 1.6) * (k / 8);
    return [x, cutY(x, G.cx) - 0.2];
  })], 2);
  poly(ctx, inner);
  if (mode === 'line') {
    pen(ctx, INK, LW / HS);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, DEEP);
    ctx.fill();
  }
  for (const [i, s] of G.secs.entries()) {
    hairShape(ctx, a, mode, s.pts, () => {
      // a soft shade gathering toward the cut (the ends a clean deeper tone), the roots light
      const g = ctx.createLinearGradient(0, cutY(s.mid, G.cx) - 4, 0, cutY(s.mid, G.cx) + 0.6);
      g.addColorStop(0, 'rgba(90,32,70,0)');
      g.addColorStop(1, 'rgba(90,32,70,0.5)');
      ctx.fillStyle = g;
      ctx.fillRect(s.L - 2, -20, s.R - s.L + 4, 24);
      // thin shadows down its sides at the splits, fading up toward the crown
      for (const [ex, k] of [[s.L, 1], [s.R, -1]]) {
        const sg = ctx.createLinearGradient(0, -14, 0, cutY(ex, G.cx));
        sg.addColorStop(0, 'rgba(90,32,70,0)');
        sg.addColorStop(1, 'rgba(90,32,70,0.45)');
        ctx.strokeStyle = sg;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(ex + k * 0.3, -14);
        ctx.quadraticCurveTo(ex + k * 0.5, (cutY(ex, G.cx) - 14) / 2, ex + k * 0.4, cutY(ex, G.cx));
        ctx.stroke();
      }
      // a small shade cutting up into the widest sections
      if (s.R - s.L > 6) {
        const mx = s.mid + 0.6;
        const cy = cutY(mx, G.cx);
        const g2 = ctx.createLinearGradient(0, cy - 3, 0, cy);
        g2.addColorStop(0, 'rgba(90,32,70,0)');
        g2.addColorStop(1, 'rgba(90,32,70,0.5)');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.moveTo(mx - 0.5, cy + 0.3);
        ctx.quadraticCurveTo(mx, cy - 3.2, mx + 0.5, cy + 0.3);
        ctx.fill();
      }
      // the shared shine: one soft band across the fringe, a few fine lines of light in it
      shineBand(ctx, i);
    });
  }
}
// The shine all her hair shares: a soft band at one height across her head, fine light lines of
// varied lengths in it (drawn clipped into each piece, so it lines up across them).
function shineBand(ctx, seed = 0) {
  const g = ctx.createLinearGradient(0, -14.4, 0, -9.6);
  g.addColorStop(0, 'rgba(238,178,207,0)');
  g.addColorStop(0.5, 'rgba(238,178,207,0.42)');
  g.addColorStop(1, 'rgba(238,178,207,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-24, -14.4, 48, 4.8);
  pen(ctx, 'rgba(255,226,240,0.45)', 0.3);
  for (const [x, l] of [[-10.8, 2.6], [-3.6, 1.6], [3.2, 2.8], [9.8, 1.4]]) {
    const y = -12 - 0.004 * x * x * 2 + (seed % 2) * 0.05;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + l / 2, y - 0.4, x + l, y + 0.1);
    ctx.stroke();
  }
}
// The hair cap: one size larger than her head, from the hairline over the crown and down the back.
function capPts(tx) {
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const an = Math.PI * (0.98 + (i / 18) * 1.04);
    const off = 1.4 + Math.max(0, -Math.sin(an)) * 1.4;
    pts.push([Math.cos(an) * (16.4 + off), Math.sin(an) * (17.4 + off) + 0.4]);
  }
  return chaikin([[-17.4, 4], ...pts, [17.6, 1], [12, -6], [tx, -9], [-9, -7], [-15.6, -1]], 2);
}
// A side lock: framing her cheek from under the fringe down to her jaw, outside her eye, its top
// tucked under the fringe, a soft round end; sway: a little swing from its spring.
function sideLock(ctx, a, mode, side, tx, sway) {
  const turnShift = side > 0 ? tx * 0.75 : tx * 0.15;
  const inX = side > 0 ? 11.6 : -10.4;
  const outX = side > 0 ? 17 : -17.4;
  const sx = (v) => v + turnShift;
  const s = sway * 3;
  const pts = chaikin([
    [sx(outX - side * 0.8), -10.5], [sx(inX - side * 1.2), -10.2], [sx(inX), -2.5], [sx(inX + side * 0.1) + s * 0.3, 5.5],
    [sx(inX + side * 0.8) + s * 0.7, 11.6], [sx((inX + outX) / 2 + side * 0.4) + s, 14.6], [sx(outX - side * 0.2) + s * 0.8, 12],
    [sx(outX + side * 0.3) + s * 0.3, 4], [sx(outX + side * 0.2), -4],
  ], 3);
  hairShape(ctx, a, mode, pts, () => {
    // occlusion up under the fringe, a soft shade on its face side, a lighter outer edge
    const g = ctx.createLinearGradient(0, -10, 0, -4.5);
    g.addColorStop(0, 'rgba(70,24,56,0.55)');
    g.addColorStop(1, 'rgba(70,24,56,0)');
    ctx.fillStyle = g;
    ctx.fillRect(sx(outX) - 4, -11, 12 + Math.abs(outX - inX), 7);
    glow(ctx, sx(inX + side * 0.6), 6, 3.2, DEEP, 0.4);
    glow(ctx, sx(outX - side * 1.2), 0, 3.4, '#b45b86', 0.45);
    shineBand(ctx);
  });
}
// A ringlet: a smooth spiral coil hanging behind her face from under a side lock (a sprung chain of
// four), tapering to a rounded end; each turn of the coil a soft crescent of shade under one of light.
function ringlet(ctx, a, mode, root, angs, w0) {
  const Ls = [4.2, 4, 3.8, 3.4];
  const W = [w0, w0 * 0.98, w0 * 0.9, w0 * 0.78, w0 * 0.55];
  const pts = [root];
  for (let i = 0; i < 4; i++) {
    const p = pts[i];
    pts.push([p[0] + Math.cos(angs[i]) * Ls[i], p[1] + Math.sin(angs[i]) * Ls[i]]);
  }
  const Lp = [];
  const Rp = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const hw = W[i] / 2;
    Lp.push([pts[i][0] - Math.sin(an) * hw, pts[i][1] + Math.cos(an) * hw]);
    Rp.push([pts[i][0] + Math.sin(an) * hw, pts[i][1] - Math.cos(an) * hw]);
  }
  const tip = pts[4];
  const tan = Math.atan2(tip[1] - pts[3][1], tip[0] - pts[3][0]);
  const shape = chaikin([...Lp, [tip[0] + Math.cos(tan) * W[4] * 0.6, tip[1] + Math.sin(tan) * W[4] * 0.6], ...[...Rp].reverse()], 2);
  hairShape(ctx, a, mode, shape, () => {
    for (let i = 1; i <= 4; i++) {
      const p = pts[i - 1];
      const q = pts[i];
      const an = Math.atan2(q[1] - p[1], q[0] - p[0]);
      const mx = (p[0] + q[0]) / 2;
      const my = (p[1] + q[1]) / 2;
      const r = W[i] * 0.62;
      // the turn's lit top and shaded underside, both soft
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(an - 0.35);
      const g = ctx.createLinearGradient(0, -r, 0, r);
      g.addColorStop(0, 'rgba(238,178,207,0.38)');
      g.addColorStop(0.45, 'rgba(238,178,207,0)');
      g.addColorStop(0.6, 'rgba(80,28,62,0)');
      g.addColorStop(1, 'rgba(80,28,62,0.5)');
      ctx.fillStyle = g;
      ell(ctx, 0, 0, r * 0.9, r);
      ctx.fill();
      ctx.restore();
    }
  });
}
// The chignon: a round bun wound at the back of her head (its turns shown by soft spiral shading),
// held by a gold hairpin with a pearl at each end; behind her head.
function chignon(ctx, a, mode, tx, sw) {
  const bx = -11.4 - tx * 0.4;
  const by = -14.2;
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(sw * 0.12);
  const bun = chaikin(Array.from({ length: 14 }, (_, i) => {
    const an = (i / 14) * TAU;
    return [Math.cos(an) * 8.6, Math.sin(an) * 7.8];
  }), 2);
  hairShape(ctx, a, mode, bun, () => {
    // wound: soft spiral bands of shade, lit on top
    for (const [r, a0, a1] of [[6.6, -2.6, 0.2], [4.4, -0.6, 2.4], [2.4, 1.6, 4.2]]) {
      pen(ctx, 'rgba(80,28,62,0.45)', 1.1);
      ctx.beginPath();
      ctx.ellipse(0.4, 0.4, r, r * 0.9, 0, a0, a1);
      ctx.stroke();
    }
    glow(ctx, -2.4, -4.2, 6, '#c96e98', 0.55);
    glow(ctx, 3, 4, 7, DEEP, 0.55);
  });
  // the hairpin through it
  ctx.save();
  ctx.rotate(-0.55);
  ctx.beginPath();
  ctx.roundRect(-11, -0.45, 22, 0.9, 0.45);
  ctx.moveTo(-10.2 + 1.3, 0);
  ctx.arc(-10.2, 0, 1.3, 0, TAU);
  ctx.moveTo(10.2 + 1.3, 0);
  ctx.arc(10.2, 0, 1.3, 0, TAU);
  if (mode === 'line') {
    pen(ctx, INK, LW / HS);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    for (const ex of [-10.2, 10.2]) {
      ell(ctx, ex, 0, 1.3, 1.3);
      ctx.fillStyle = tone(a, '#fff6f0');
      ctx.fill();
      ell(ctx, ex - 0.4, -0.4, 0.45, 0.35);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
    }
  }
  ctx.restore();
  ctx.restore();
}
// The marigold pinned at the front of her chignon: a ruffled double blossom of rounded petals.
function blossom(ctx, a, mode, x, y, r, rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const ring = (n, rr, pr, off) => {
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const an = off + (i / n) * TAU;
      const px = Math.cos(an) * rr;
      const py = Math.sin(an) * rr * 0.9;
      ctx.moveTo(px + pr, py);
      ctx.arc(px, py, pr, 0, TAU);
    }
  };
  ring(10, r * 0.62, r * 0.42, 0);
  if (mode === 'line') {
    pen(ctx, INK, LW / HS);
    ctx.stroke();
  } else {
    ctx.fillStyle = tone(a, PETAL[2]);
    ctx.fill();
    ring(8, r * 0.38, r * 0.36, 0.3);
    ctx.fillStyle = tone(a, PETAL[1]);
    ctx.fill();
    ell(ctx, 0, 0, r * 0.32, r * 0.3);
    ctx.fillStyle = tone(a, GOLD[1]);
    ctx.fill();
    ell(ctx, -r * 0.1, -r * 0.12, r * 0.14, r * 0.1);
    ctx.fillStyle = tone(a, PETAL[0]);
    ctx.fill();
  }
  ctx.restore();
}
function head(ctx, a, mode, D, part) {
  ctx.save();
  enter(ctx, a, D, 'head');
  const n = D.J.neck;
  ctx.translate(n[0], n[1]);
  ctx.scale(HS, HS);
  ctx.translate(...HO);
  const q = a.mgQ ?? {};
  const f = a.mgF;
  const turn = q.turn ?? 0.35;
  const tx = turn * 4;
  const R = a.mgHair ?? {};
  if (part === 'back') {
    // behind her head and neck: the nape (her hair is up), the chignon and its pin, both ringlets
    hairShape(ctx, a, mode, chaikin([[-17.6, -6], [-16, -16], [-6, -20.4], [6, -19.6], [15.4, -11], [16.6, 0], [11, 6], [0, 8.6], [-9, 9], [-16.4, 4]], 3));
    chignon(ctx, a, mode, tx, R.bun ?? 0);
    ringlet(ctx, a, mode, [-14.6 + tx * 0.15, 11.4], R.rgN ?? [1.6, 1.6, 1.6, 1.6], 4.6);
    ringlet(ctx, a, mode, [14.8 + tx * 0.75, 11], R.rgF ?? [1.5, 1.5, 1.5, 1.5], 4.2);
    ctx.restore();
    return;
  }
  // the face
  poly(ctx, skullPts(tx));
  paint(ctx, a, mode, SKIN[1], LW / HS);
  if (mode === 'fill' && f) {
    ctx.save();
    poly(ctx, skullPts(tx));
    ctx.clip();
    glow(ctx, tx - 1, 2, 15, SKIN[0], 0.9);
    // soft face shade where the side locks frame it and along the jaw
    glow(ctx, -12, 4, 6, SKIN[2], 0.55);
    glow(ctx, 13 + tx * 0.7, 4, 5, SKIN[2], 0.45);
    glow(ctx, tx * 0.5, 15, 8, SKIN[2], 0.3);
    // the fringe's soft cast shadow: a copy of its cut, a little lower, in her skin's own shade
    const G = fringeGeom(tx, R.fr);
    ctx.beginPath();
    ctx.moveTo(G.x0, -20);
    ctx.lineTo(G.x1, -20);
    for (let k = 0; k <= 20; k++) {
      const x = G.x1 - (G.x1 - G.x0) * (k / 20);
      ctx.lineTo(x, cutY(x, G.cx) + 0.9);
    }
    ctx.closePath();
    ctx.fillStyle = tone(a, SKIN[2], 0.75);
    ctx.fill();
    ctx.restore();
    // the blush: a wide peachy flush, a rosier core, two neat curved strokes
    for (const s of [-1, 1]) {
      const bx = tx + s * 8.2;
      glow(ctx, bx, 8, 3.4, '#ffb0a0', 0.35 + 0.3 * f.bl);
      glow(ctx, bx, 8, 1.8, '#ff8aa8', 0.25 + 0.35 * f.bl);
      pen(ctx, tone(a, '#f08aa0', 0.35 + 0.4 * f.bl), 0.3);
      for (const dx of [-0.8, 0.5]) {
        ctx.beginPath();
        ctx.moveTo(bx + dx - 0.4, 8.6);
        ctx.quadraticCurveTo(bx + dx, 7.9, bx + dx + 0.5, 7.6);
        ctx.stroke();
      }
    }
    for (const s of [-1, 1]) eye(ctx, a, tx + s * EYE.dx, EYE.y, s, f, q.look);
    for (const s of [-1, 1]) brow(ctx, a, tx + s * EYE.dx + s * 0.2, -3.3, s, f);
    // the nose: a soft shade and a tip light
    glow(ctx, tx + 1.6, 7.2, 1.3, SKIN[3], 0.55);
    ell(ctx, tx + 1.2, 6.8, 0.35, 0.25);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
    mouth(ctx, a, tx + 1, 11, f);
    if (q.sweat) sweat(ctx, tx - 12.6, -2 + (q.sweat % 1) * 2.5, 1.3);
    if (f.wet > 0.6 && q.tears) for (const s of [-1, 1]) tear(ctx, tx + s * 6.4, 6.6 + (((a.t ?? 0) * 1.3) % 1) * 3, 0.9, 0.9);
  }
  // the hair cap, the side locks, the marigold, then the fringe over them all
  hairShape(ctx, a, mode, capPts(tx), () => {
    // where her hair is swept back to the chignon: soft gather shades on the crown, the shared shine
    pen(ctx, 'rgba(90,32,70,0.22)', 0.6);
    for (const [x0, y0] of [[2, -16], [7, -13.5], [-3, -17.6]]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 - 6, y0 - 2, -10.5 - tx * 0.4, -15);
      ctx.stroke();
    }
    glow(ctx, -15, 2, 7, DEEP, 0.5);
    shineBand(ctx);
  });
  sideLock(ctx, a, mode, -1, tx, R.slN ?? 0);
  sideLock(ctx, a, mode, 1, tx, R.slF ?? 0);
  blossom(ctx, a, mode, -9.6 - tx * 0.3, -18.6, 5, (R.bun ?? 0) * 0.2 - 0.3);
  fringe(ctx, a, mode, tx, R.fr);
  ctx.restore();
}

// ---------- Her gown ----------
// The bodice: off the shoulder, a frill of cream petals along its neckline, a pointed waist; the plum
// sash. In the chest's frame (and the hips' for its point), so it bends with her.
function bodice(ctx, a, mode, D) {
  if (mode !== 'fill') return;
  ctx.save();
  enter(ctx, a, D, 'chest');
  const st = D.J.stern;
  const rb = D.J.ribs;
  const wy = D.J.waist[1];
  const cx = st[0] + 0.8;
  const top = st[1] + 3.2;
  smooth(ctx, [[cx - 9.2, top], [cx - 3, top - 1.2], [cx + 3.6, top - 1], [cx + 9.6, top + 0.4], [cx + 8.4, rb[1]], [cx + 6, wy + 0.6], [cx - 6, wy + 0.6], [cx - 8.6, rb[1]]]);
  ctx.fillStyle = tone(a, GOWN[1]);
  ctx.fill();
  ctx.save();
  ctx.clip();
  glow(ctx, cx + 3, top + 4, 8, GOWN[0], 0.8);
  glow(ctx, cx - 8, wy - 2, 7, GOWN[2], 0.6);
  // soft boning seams
  pen(ctx, tone(a, GOWN[2], 0.6), 0.5);
  for (const dx of [-3, 3.4]) {
    ctx.beginPath();
    ctx.moveTo(cx + dx, top + 2);
    ctx.quadraticCurveTo(cx + dx * 0.7, (top + wy) / 2, cx + dx * 0.5, wy);
    ctx.stroke();
  }
  ctx.restore();
  // the frill of cream petals along the neckline
  for (let i = 0; i < 7; i++) {
    const u = i / 6;
    const px = cx - 9.6 + u * 19.4;
    const py = top - 0.3 + Math.sin(u * Math.PI) * -0.9;
    ell(ctx, px, py, 2.1, 1.6, (u - 0.5) * 0.6);
    ctx.fillStyle = tone(a, i % 2 ? CREAMY[1] : CREAMY[0]);
    ctx.fill();
    pen(ctx, tone(a, CREAMY[2]), 0.35);
    ctx.stroke();
  }
  ctx.restore();
}
// The sash at her waist with a bow at the back, its two tails hanging on springs.
function sash(ctx, a, mode, D, part) {
  ctx.save();
  enter(ctx, a, D, 'waistB');
  const w = D.J.waist;
  const cx = w[0];
  const cy = w[1] + 1.5;
  if (part === 'band') {
    if (mode === 'fill') {
      smooth(ctx, [[cx - 8.6, cy - 1.6], [cx, cy - 2.2], [cx + 8.4, cy - 1.4], [cx + 8, cy + 1.6], [cx, cy + 2.2], [cx - 8.2, cy + 1.6]]);
      ctx.fillStyle = tone(a, SASH[1]);
      ctx.fill();
      pen(ctx, tone(a, SASH[0], 0.8), 0.6);
      ctx.beginPath();
      ctx.moveTo(cx - 7.6, cy - 0.9);
      ctx.quadraticCurveTo(cx, cy - 1.5, cx + 7.4, cy - 0.7);
      ctx.stroke();
      // the pocket watch's chain, looped from the sash to her near hip
      pen(ctx, tone(a, GOLD[1]), 0.55);
      ctx.beginPath();
      ctx.moveTo(cx + 3.4, cy + 1.2);
      ctx.quadraticCurveTo(cx + 5.6, cy + 4.4, cx + 7, cy + 1.4);
      ctx.stroke();
    }
  } else {
    // the bow at her back: two round loops and the tails (sprung)
    const tw = a.mgSash ?? [0, 0];
    const bx = cx - 8.2;
    for (const [len, ang, k] of [[13, 1.95 + tw[0], 0], [11, 2.25 + tw[1], 1]]) {
      const ex = bx + Math.cos(ang) * len;
      const ey = cy + Math.sin(ang) * len;
      const mx = bx + Math.cos(ang - 0.15) * len * 0.5;
      const my = cy + Math.sin(ang - 0.15) * len * 0.5;
      smooth(ctx, [[bx - 1.4, cy - 0.6], [mx - 1.8, my], [ex - 1.6, ey], [ex + 0.2, ey + 1.6], [ex + 1.6, ey - 0.2], [mx + 1.8, my], [bx + 1.4, cy + 0.6]]);
      paint(ctx, a, mode, k ? SASH[2] : SASH[1]);
    }
    for (const [dx, dy, r] of [[-4.4, -2.2, 0.5], [-3.8, 2, -0.4]]) {
      ell(ctx, bx + dx, cy + dy, 4, 2.6, r);
      paint(ctx, a, mode, SASH[1]);
    }
    ell(ctx, bx, cy, 1.8, 1.8);
    paint(ctx, a, mode, SASH[2]);
  }
  ctx.restore();
}
// A puffed petal sleeve over a shoulder: three rounded petals on the arm's top.
function sleeve(ctx, a, mode, D, k) {
  ctx.save();
  enter(ctx, a, D, `arm${k}u`);
  const sh = D.J[`sh${k}`];
  const near = k === 'N';
  ctx.beginPath();
  for (const [dx, dy, rx, ry] of [[-2.6, 1.2, 3.2, 3.6], [0.4, 2.4, 3.6, 3.8], [2.8, 1, 3, 3.4]]) {
    ctx.moveTo(sh[0] + dx + rx, sh[1] + dy);
    ctx.ellipse(sh[0] + dx, sh[1] + dy, rx, ry, 0, 0, TAU);
  }
  paint(ctx, a, mode, near ? GOWN[1] : GOWN[2]);
  if (mode === 'fill') glow(ctx, sh[0] - 0.4, sh[1] + 0.8, 4, near ? GOWN[0] : GOWN[1], 0.8);
  ctx.restore();
}
// A long white satin glove over the forearm and hand.
function glove(ctx, a, mode, D, k) {
  const near = k === 'N';
  ctx.save();
  enter(ctx, a, D, `arm${k}f`);
  const el = D.J[`el${k}`];
  const wr = D.J[`wr${k}`];
  const an = Math.atan2(wr[1] - el[1], wr[0] - el[0]);
  const L = Math.hypot(wr[0] - el[0], wr[1] - el[1]);
  ctx.translate(el[0], el[1]);
  ctx.rotate(an);
  smooth(ctx, [[-1.6, -3.4], [L * 0.5, -2.9], [L + 0.6, -2.4], [L + 0.6, 2.4], [L * 0.5, 2.9], [-1.6, 3.4]]);
  paint(ctx, a, mode, near ? GLOVE[1] : GLOVE[2]);
  if (mode === 'fill') {
    // (a soft rim in the glove's own deeper shade, so the arm reads over her gown)
    pen(ctx, tone(a, GLOVE[3], near ? 0.8 : 0.6), 0.6);
    ctx.stroke();
    const sg = ctx.createLinearGradient(0, -3, 0, 3);
    sg.addColorStop(0, 'rgba(255,255,255,0.5)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0)');
    sg.addColorStop(1, 'rgba(150,110,160,0.35)');
    ctx.fillStyle = sg;
    ctx.fill();
    pen(ctx, tone(a, GLOVE[0], 0.9), 0.7);
    ctx.beginPath();
    ctx.moveTo(0, -1.6);
    ctx.lineTo(L * 0.8, -1.3);
    ctx.stroke();
    // the glove's soft cuff, a little petal-edged
    ell(ctx, -0.6, 0, 1.4, 2.9);
    ctx.fillStyle = tone(a, near ? '#ffffff' : GLOVE[1]);
    ctx.fill();
  }
  ctx.restore();
  ctx.save();
  enter(ctx, a, D, `hand${k}`);
  const hd = D.J[`hand${k}`];
  const w2 = D.J[`wr${k}`];
  const ha = Math.atan2(hd[1] - w2[1], hd[0] - w2[0]);
  ctx.translate(hd[0], hd[1]);
  ctx.rotate(ha - Math.PI / 2);
  // (a slim lady's hand: a mitten with a thumb and a soft line between the fingers)
  smooth(ctx, [[-2.8, -2.6], [0, -3.4], [2.8, -2.4], [3.2, 1], [2.2, 4.4], [0, 5.2], [-2.2, 4.2], [-3.2, 0.6]]);
  paint(ctx, a, mode, near ? GLOVE[1] : GLOVE[2]);
  if (mode === 'fill') {
    pen(ctx, tone(a, GLOVE[3], near ? 0.8 : 0.6), 0.55);
    ctx.stroke();
    pen(ctx, tone(a, GLOVE[2]), 0.4);
    ctx.beginPath();
    ctx.moveTo(0.2, 1);
    ctx.lineTo(0.3, 4.2);
    ctx.stroke();
  }
  ctx.restore();
}

// The skirt and the train, in the hips' frame. Seven petals in three layers hang from inside her
// waist, each on its own spring; the train is a chain of six sprung pieces from her hips.
const SKIRT = [
  // layer (0 back .. 2 front), root x (from the hips' middle), angle at rest (from straight down, +
  // backward), length, half-width
  { l: 0, x: -6, an: 0.75, len: 24, hw: 6.4 },
  { l: 0, x: 4, an: -0.42, len: 21, hw: 5.8 },
  { l: 1, x: -3, an: 0.42, len: 25, hw: 6.8 },
  { l: 1, x: 5.6, an: -0.18, len: 22, hw: 6 },
  { l: 2, x: -1, an: 0.12, len: 23, hw: 7 },
  { l: 2, x: 6, an: -0.36, len: 18, hw: 5.4 },
  { l: 2, x: -7.6, an: 0.62, len: 19, hw: 5.6 },
];
const TRAIN_L = [12, 12, 12, 11.5, 10.5, 9.5];
const TRAIN_W = [24, 27, 25, 20, 15, 10, 5.5];
function trainPts(a, D) {
  const h = D.J.hip;
  const angs = a.mgTrain ?? [1.75, 2, 2.45, 2.85, 3.1, 3.9];
  const pts = [[h[0] - 2, h[1] + 3]];
  for (let i = 0; i < 6; i++) {
    const p = pts[i];
    pts.push([p[0] + Math.cos(angs[i]) * TRAIN_L[i], p[1] + Math.sin(angs[i]) * TRAIN_L[i]]);
  }
  return pts;
}
function trainShape(ctx, pts, scal) {
  const Lp = [];
  const Rp = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[Math.min(pts.length - 1, i + 1)];
    const an = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
    const hw = TRAIN_W[i] / 2;
    Lp.push([pts[i][0] - Math.sin(an) * hw, pts[i][1] + Math.cos(an) * hw]);
    Rp.push([pts[i][0] + Math.sin(an) * hw, pts[i][1] - Math.cos(an) * hw]);
  }
  const tip = pts[pts.length - 1];
  const tan = Math.atan2(tip[1] - pts[pts.length - 2][1], tip[0] - pts[pts.length - 2][0]);
  // (its lower edge scalloped like petals: each scallop a little bulge between two points)
  const lower = [];
  for (let i = 0; i < Lp.length - 1; i++) {
    lower.push(Lp[i]);
    if (scal) {
      const m0 = [(Lp[i][0] + Lp[i + 1][0]) / 2, (Lp[i][1] + Lp[i + 1][1]) / 2];
      const d = [Lp[i + 1][0] - Lp[i][0], Lp[i + 1][1] - Lp[i][1]];
      const l = Math.hypot(...d) || 1;
      lower.push([m0[0] - (d[1] / l) * 1.6, m0[1] + (d[0] / l) * 1.6]);
    }
  }
  lower.push(Lp[Lp.length - 1]);
  smooth(ctx, [...lower, [tip[0] + Math.cos(tan) * 3, tip[1] + Math.sin(tan) * 3], ...[...Rp].reverse()]);
}
function train(ctx, a, mode, D) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const pts = trainPts(a, D);
  trainShape(ctx, pts, true);
  if (mode === 'line') {
    pen(ctx, INK, LW);
    ctx.stroke();
  } else {
    // marigold at her hips, fading along it to a pale moonlit gold, a glow inside
    const g = ctx.createLinearGradient(pts[0][0], pts[0][1], pts[6][0], pts[6][1]);
    g.addColorStop(0, tone(a, GOWN[2]));
    g.addColorStop(0.35, tone(a, GOWN[1]));
    g.addColorStop(0.75, tone(a, '#ffe2a4'));
    g.addColorStop(1, tone(a, '#fff6dc'));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    trainShape(ctx, pts, true);
    ctx.clip();
    for (let i = 1; i < 6; i++) glow(ctx, pts[i][0] + 1, pts[i][1] - 2, 9 - i * 0.6, '#fff4d0', 0.5);
    // soft folds running down it
    pen(ctx, tone(a, GOWN[2], 0.45), 0.8);
    for (const off of [-6, 2]) {
      ctx.beginPath();
      sline(ctx, pts.slice(0, 5).map((p, i) => {
        const p1 = pts[Math.min(6, i + 1)];
        const an = Math.atan2(p1[1] - p[1], p1[0] - p[0]);
        return [p[0] - Math.sin(an) * off * (1 - i * 0.15), p[1] + Math.cos(an) * off * (1 - i * 0.15)];
      }));
      ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}
function skirt(ctx, a, mode, D, layer) {
  ctx.save();
  enter(ctx, a, D, 'torso');
  const h = D.J.hip;
  const sw = a.mgSkirt ?? SKIRT.map(() => 0);
  const down = a.mgDown ?? 0;
  for (let i = 0; i < SKIRT.length; i++) {
    const P = SKIRT[i];
    if (P.l !== layer) continue;
    const an = Math.PI / 2 + P.an + sw[i] + down;
    const r = [h[0] + P.x, h[1] - 6];
    const dir = [Math.cos(an), Math.sin(an)];
    const nrm = [-dir[1], dir[0]];
    const L = P.len;
    const tip = [r[0] + dir[0] * L, r[1] + dir[1] * L];
    const pts = [
      [r[0] - nrm[0] * P.hw * 0.55, r[1] - nrm[1] * P.hw * 0.55],
      [r[0] + dir[0] * L * 0.55 - nrm[0] * P.hw, r[1] + dir[1] * L * 0.55 - nrm[1] * P.hw],
      [tip[0] - nrm[0] * P.hw * 0.55, tip[1] - nrm[1] * P.hw * 0.55],
      [tip[0] + dir[0] * 1.4, tip[1] + dir[1] * 1.4],
      [tip[0] + nrm[0] * P.hw * 0.55, tip[1] + nrm[1] * P.hw * 0.55],
      [r[0] + dir[0] * L * 0.55 + nrm[0] * P.hw, r[1] + dir[1] * L * 0.55 + nrm[1] * P.hw],
      [r[0] + nrm[0] * P.hw * 0.55, r[1] + nrm[1] * P.hw * 0.55],
    ];
    smooth(ctx, pts);
    paint(ctx, a, mode, [GOWN[2], GOWN[1], PETAL[1]][layer]);
    if (mode === 'fill') {
      ctx.save();
      smooth(ctx, pts);
      ctx.clip();
      glow(ctx, r[0] + dir[0] * L * 0.4 - nrm[0] * 2, r[1] + dir[1] * L * 0.4, P.hw * 1.6, [GOWN[1], GOWN[0], PETAL[0]][layer], 0.7);
      // the petal's soft middle vein
      pen(ctx, tone(a, [GOWN[3], GOWN[2], GOWN[2]][layer], 0.5), 0.6);
      ctx.beginPath();
      ctx.moveTo(r[0] + dir[0] * 4, r[1] + dir[1] * 4);
      ctx.quadraticCurveTo(r[0] + dir[0] * L * 0.55 + nrm[0] * 0.8, r[1] + dir[1] * L * 0.55, tip[0] - dir[0] * 4, tip[1] - dir[1] * 4);
      ctx.stroke();
      ctx.restore();
    }
  }
  ctx.restore();
}

// ---------- Her little things ----------
// The dance card on its ribbon from her near wrist (sprung): cream, gilt edged, its lines blank.
function danceCard(ctx, a, mode, D) {
  const q = a.mgQ ?? {};
  const wr = ptOf(a, D, 'handN', D.J.wrN);
  const sw = a.mgCard ?? 0;
  const held = q.cardUp ?? 0;
  const hd = ptOf(a, D, 'handN', D.J.handN);
  ctx.save();
  const x = mix(wr[0], hd[0] + 1.2, held);
  const y = mix(wr[1], hd[1] - 2.6, held);
  // (the ribbon down from the wrist, the card hanging on it)
  const ang = mix(Math.PI / 2 + sw, -0.4, held);
  const L = mix(3.2, 0.6, held);
  const cx = x + Math.cos(ang) * L;
  const cy = y + Math.sin(ang) * L;
  if (mode === 'fill' && held < 0.9) {
    pen(ctx, tone(a, SASH[0]), 0.35);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(cx, cy);
    ctx.stroke();
  }
  ctx.translate(cx, cy);
  ctx.rotate(mix(sw * 0.8, -0.25, held));
  ctx.beginPath();
  ctx.roundRect(-1.5, 0, 3, 3.8, 0.6);
  paint(ctx, a, mode, '#fffaf0', 0.5);
  if (mode === 'fill') {
    pen(ctx, tone(a, GOLD[1]), 0.25);
    ctx.stroke();
    pen(ctx, tone(a, '#d8c8b8', 0.8), 0.18);
    for (const yy of [1.3, 2.1, 2.9]) {
      ctx.beginPath();
      ctx.moveTo(-0.9, yy);
      ctx.lineTo(0.9, yy);
      ctx.stroke();
    }
    // a pretend name, written in with a fingertip (the act): a little heart
    if (q.cardHeart) {
      ctx.globalAlpha *= q.cardHeart;
      ctx.fillStyle = '#ff7aa8';
      ctx.beginPath();
      ctx.arc(-0.25, 1.1, 0.32, 0, TAU);
      ctx.arc(0.25, 1.1, 0.32, 0, TAU);
      ctx.moveTo(-0.55, 1.2);
      ctx.lineTo(0, 1.85);
      ctx.lineTo(0.55, 1.2);
      ctx.fill();
    }
  }
  ctx.restore();
}
// The pocket watch: at her near hip on its chain (sprung), or up in her near hand. Stopped at
// midnight; ticking again at the end.
function watchAt(a, D) {
  const q = a.mgQ ?? {};
  const held = q.watchUp ?? 0;
  const hip = ptOf(a, D, 'waistB', [D.J.waist[0] + 7, D.J.waist[1] + 3.5]);
  const sw = a.mgWatch ?? 0;
  const hang = [hip[0] + Math.sin(sw) * 2.6, hip[1] + Math.cos(sw) * 2.6];
  const hd = ptOf(a, D, 'handN', D.J.handN);
  return [mix(hang[0], hd[0] + 0.6, held), mix(hang[1], hd[1] - 1.6, held)];
}
function watch(ctx, a, mode, D) {
  const q = a.mgQ ?? {};
  const [x, y] = watchAt(a, D);
  const s = 1 + (q.watchUp ?? 0) * 0.8;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ell(ctx, 0, 0, 1.9, 1.9);
  ctx.moveTo(0.5, -2.2);
  ctx.arc(0, -2.2, 0.5, 0, TAU);
  paint(ctx, a, mode, GOLD[1], 0.5);
  if (mode === 'fill') {
    ell(ctx, 0, 0, 1.4, 1.4);
    ctx.fillStyle = tone(a, '#fffaf0');
    ctx.fill();
    // the hands: both at twelve, stopped; ticking again at midnight
    const tick = q.tick ?? 0;
    pen(ctx, tone(a, '#5a3a4a'), 0.22);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.sin(tick) * 1.1, -Math.cos(tick) * 1.1);
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -0.8);
    ctx.stroke();
    ell(ctx, -0.6, -0.7, 0.45, 0.3, -0.5);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fill();
  }
  ctx.restore();
}
// The things in her near hand for a cast: an envelope (Invitations), a ghostly coupe (A Toast!).
function envelope(ctx, a, mode, x, y, ang, s, al = 1) {
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.roundRect(-3, -2, 6, 4, 0.7);
  paint(ctx, a, mode, '#fff8ea', 0.5);
  if (mode === 'fill') {
    pen(ctx, tone(a, '#e8d6bc'), 0.35);
    ctx.beginPath();
    ctx.moveTo(-2.8, -1.8);
    ctx.lineTo(0, 0.4);
    ctx.lineTo(2.8, -1.8);
    ctx.stroke();
    // the marigold wax seal
    ell(ctx, 0, 0.5, 1, 0.95);
    ctx.fillStyle = tone(a, GOWN[2]);
    ctx.fill();
    ell(ctx, -0.25, 0.25, 0.35, 0.3);
    ctx.fillStyle = tone(a, PETAL[1]);
    ctx.fill();
  }
  ctx.restore();
}
function coupe(ctx, a, mode, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.beginPath();
  ctx.moveTo(-3.6, -5);
  ctx.quadraticCurveTo(0, -1.4, 3.6, -5);
  ctx.closePath();
  ctx.moveTo(-0.35, -2.8);
  ctx.lineTo(0.35, -2.8);
  ctx.lineTo(0.35, 0.6);
  ctx.lineTo(1.8, 1.2);
  ctx.lineTo(-1.8, 1.2);
  ctx.lineTo(-0.35, 0.6);
  ctx.closePath();
  if (mode === 'line') {
    pen(ctx, INK, 0.5);
    ctx.stroke();
  } else {
    ctx.fillStyle = 'rgba(236,246,255,0.85)';
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-3.1, -4.7);
    ctx.quadraticCurveTo(0, -2.1, 3.1, -4.7);
    ctx.closePath();
    ctx.fillStyle = tone(a, '#ffe08a', 0.95);
    ctx.fill();
    ell(ctx, -1.6, -4.4, 0.5, 0.3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  }
  ctx.restore();
}
function handThings(ctx, a, mode, D) {
  const q = a.mgQ ?? {};
  const hd = ptOf(a, D, 'handN', D.J.handN);
  if (q.envelope > 0.02) envelope(ctx, a, mode, hd[0] + 1.6, hd[1] - 2.6, -0.4, 0.85, q.envelope);
  if (q.coupe > 0.02) {
    ctx.save();
    ctx.globalAlpha *= q.coupe;
    coupe(ctx, a, mode, hd[0] + 0.4, hd[1] - 1.2, 0.9);
    ctx.restore();
  }
}

// ---------- Her act and her fight ----------
const SWINGS = ['flick', 'swish', 'shoo'];
const pickSwing = (m, st) => (typeof m.move === 'string' && SWINGS.includes(m.move) ? m.move : SWINGS[(st.mgN ?? 0) % SWINGS.length]);
function pose(m, a, out, c) {
  const st = c.st;
  const t = c.t;
  const now = a.now ?? t;
  const dt = Math.min(0.05, Math.max(0, a.dt ?? 0));
  const q = { mood: 'gracious', look: [0.3, 0], turn: 0.35, fx: null, sweat: 0, tears: false, envelope: 0, coupe: 0, cardUp: 0, cardHeart: 0, watchUp: 0, tick: 0, flip: 0, hidden: false, rise: 0, down: 0, whirl: 0 };
  a.mgQ = q;
  a.mgUid = (m.uid ?? 0) % 7;
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
  // (a cast's release: the strike moment as it ends, m.attackAt; which pose it was)
  if (cp) st.mgLastPose = cp;
  const relU = !cast && st.mgLastPose && since >= 0 && since < 1.1 ? since : -1;
  const relPose = relU >= 0 ? st.mgLastPose : null;
  if (!cast && since >= 1.1) st.mgLastPose = null;
  const anticK = m.windup > 0 && !cast ? clamp(1 - m.windup / Math.max(0.2, m.def.fight?.windup ?? 0.5), 0, 1) : 0;
  const swinging = !cast && !relPose && (anticK > 0 || (since >= 0 && since < 0.8));
  if (swinging && !st.mgAtk) {
    st.mgN = (st.mgN ?? (m.uid ?? 0)) + 1;
    st.mgPick = pickSwing(m, st);
  }
  st.mgAntic = swinging ? Math.max(anticK, st.mgAntic ?? 0) : 0;
  // (struck: the blow let go just now, its wind-up over)
  const struck = anticK <= 0 && since >= 0 && since < 0.85;
  st.mgAtk = swinging;
  const hurtU = a.hurtAgo ?? 9;
  const hurt = m.hp > 0 && hurtU >= 0 && hurtU < 0.5;
  const phaseU = m.phaseAt != null ? now - m.phaseAt : -1;
  const feastU = m.feastAt != null ? now - m.feastAt : -1;
  // ('away' holds until the next act: she isn't there yet)
  const sceneAct = act?.move === 'away' ? 'away' : act && actU >= 0 && actU < actDur + 0.4 ? act.move : null;
  const busy = m.hp <= 0 || cast || relPose || swinging || (phaseU >= 0 && phaseU < 1.8) || (feastU >= 0 && feastU < 2) || sceneAct;

  // At rest: hovering, a gracious lady: her near hand lightly at her collarbone, the far one relaxed
  // at her side, a soft sway, her chin a touch high.
  go({ tilt: -2 + Math.sin(t * 0.8) * 1.2, chest: -2 + breath * 0.8, head: -3 + Math.sin(t * 0.6) * 1.4, shN: -26, elN: -104, hwN: 20, shF: 24, elF: 20, hwF: -10 }, 1);
  // Gliding: she waltzes with an invisible partner (one hand raised in his, the other on his shoulder)
  if (walkW > 0.01) {
    const sw = Math.sin(t * 2.6);
    go({ tilt: 4 + sw * 3, head: -6 - sw * 2, chest: sw * 2, shN: -96 + sw * 6, elN: -40, hwN: -10, shF: -58, elF: -62, hwF: 30 }, walkW);
    q.turn = mix(q.turn, 0.55, walkW);
    say('dreamy', walkW);
  }
  if ((m.engaged || (m.aggroUntil ?? 0) > now) && !busy && walkW < 0.5) say('focus');
  if (m.hp <= 0) {
    // beaten: sunk down on her train, a hand to her cheek, dizzy
    const u = now - (st.mgDeadAt ??= now);
    go({ drop: 0.9, tilt: 14, head: 14, chest: 6, shN: -60, elN: -120, shF: 30, elF: 60, x: -0.02 });
    q.mood = 'dizzy';
    q.turn = 0.25;
    q.down = 0.5;
    q.fx = { kind: 'beaten', u };
  } else st.mgDeadAt = undefined;

  if (m.hp > 0) {
    if (sceneAct === 'away') q.hidden = true;
    else if (sceneAct === 'arrive') {
      // down the moon's beam: high up, turning slowly (clean mirror flips, slower and slower), the
      // train unfurling, landing in a deep curtsey
      const u = clamp(actU / actDur, 0, 1);
      const e = 1 - (1 - u) ** 2;
      q.rise = (1 - sstep(u * 1.05)) * 2.6;
      const turns = 2.5 * (1 - (1 - u) ** 2.2);
      q.flip = Math.floor(turns * 2) % 2;
      const land = sstep((u - 0.82) / 0.18);
      go({ tilt: -6, head: -10, shN: -150, elN: -30, hwN: 20, shF: -140, elF: -40, hwF: -20 }, 1 - land);
      go({ drop: 0.3, tilt: 7, head: 16, chest: 3, shN: -18, elN: 12, shF: 22, elF: -10 }, land);
      q.down = 0.35 * land;
      say(u < 0.82 ? 'dreamy' : 'gracious');
      q.whirl = 1 - e;
      q.fx = { kind: 'arrive', u, e };
    } else if (sceneAct === 'curtsey') {
      const k = win(actU, 0, 0.35, actDur - 0.3, actDur + 0.3);
      // (sinking low on her train, a little lean, her head bowed, both hands holding her skirt out)
      go({ drop: 0.3, tilt: 7, head: 16, chest: 3, shN: -18, elN: 12, hwN: -20, shF: 22, elF: -10 }, k);
      q.down = 0.45 * k;
      say('happy', k);
      q.fx = { kind: 'curtsey', u: actU };
    } else if (cast) {
      castPoseOf(cp, castU, castK, m.windup > 0 && m.windup < 0.6 ? 1 - m.windup / 0.6 : 0, go, q, t, say);
    } else if (relPose) {
      releaseOf(relPose, relU, go, q, t, say);
    } else if (phaseU >= 0 && phaseU < 1.8) {
      const k = win(phaseU, 0, 0.25, 1.4, 1.8);
      if ((m.mech?.phase ?? 1) >= 3) {
        // Midnight: the watch ticking again in her hands, pressed to her heart
        go({ tilt: -6, head: -10, shN: -60, elN: -130, hwN: 20, shF: -40, elF: -120 }, k);
        q.watchUp = k;
        q.tick = phaseU * 6;
        say(phaseU < 0.8 ? 'shock' : 'pleading', k);
        q.fx = { kind: 'midnight', u: phaseU };
      } else {
        // Second Helpings: a delighted clap
        const clap = Math.abs(Math.sin(phaseU * 9)) * sstep((phaseU - 0.2) / 0.2) * (1 - sstep((phaseU - 1.1) / 0.2));
        go({ tilt: -4, head: -8, shN: -70 + clap * 20, elN: -80, shF: -56 - clap * 18, elF: -88 }, k);
        say('delighted', k);
        q.fx = { kind: 'clap', u: phaseU };
      }
    } else if (feastU >= 0 && feastU < 2) {
      // a tart arriving: cupped hands, a bite, bliss
      const k = win(feastU, 0, 0.25, 1.6, 2);
      const bite = win(feastU, 0.5, 0.7, 0.9, 1.1);
      go({ shN: -70 - 40 * bite, elN: -90 - 30 * bite, shF: -60, elF: -90, head: 6 * bite, tilt: 2 }, k);
      say(feastU < 0.5 ? 'delighted' : 'bliss', k);
      q.fx = { kind: 'feast', u: feastU };
    } else if (swinging) {
      const kind = st.mgPick ?? 'flick';
      const hitK = struck ? (since < 0.07 ? sstep(since / 0.07) : 1 - sstep((since - 0.28) / 0.5)) : 0;
      const wK = struck ? (1 - hitK) * sstep(st.mgAntic) * (since < 0.07 ? 1 : 0) : sstep(anticK);
      if (kind === 'flick') {
        go({ shN: -150, elN: -70, hwN: 40, tilt: -6, head: -6 }, wK);
        go({ shN: -70, elN: -6, hwN: -30, tilt: 8, x: 0.03 }, hitK);
        say(hitK > 0.3 ? 'pout' : 'focus');
      } else if (kind === 'swish') {
        go({ tilt: -10, head: -8, shN: -120, elN: -40, shF: -110, elF: -40 }, wK);
        go({ tilt: 12, head: 4, x: 0.04, shN: -40, elN: -20, shF: -30, elF: 10 }, hitK);
        q.whirl = hitK;
        say(hitK > 0.3 ? 'pout' : 'focus');
      } else {
        go({ shN: -40, elN: -110, hwN: 30, tilt: -4 }, wK);
        go({ shN: -84, elN: -12, hwN: -10, tilt: 6, head: 4, x: 0.03 }, hitK);
        say(hitK > 0.3 ? 'pout' : 'focus');
      }
      q.fx = { kind: struck ? kind : 'ready', u: struck ? since : now };
    } else if (hurt) {
      const k = 1 - sstep(hurtU / 0.5);
      go({ tilt: -8, head: -10, x: -0.02, shN: -90, elN: -120, shF: 20 }, k);
      say('hurt', k * 2);
      if (k > 0.3) q.fx = { kind: 'hurt', u: hurtU };
    }
    if (sceneAct === 'attack' && !cast) {
      // a scene's swing: her flourish
      const k = win(actU, 0, 0.2, 0.7, 1);
      go({ shN: -140, elN: -20, shF: -100, elF: -30, tilt: -6, head: -8 }, k);
      say('delighted', k);
      q.fx = { kind: 'flourish', u: actU };
    }
    // her idle act: only when she's calm
    const calmK = (a.calm ?? 1) * (1 - walkW) * (mood || m.engaged || (m.aggroUntil ?? 0) > now || busy || hurt ? 0 : 1);
    st.mgCalm = mix(st.mgCalm ?? 0, calmK > 0.5 ? 1 : 0, 1 - Math.exp(-dt * (calmK > 0.5 ? 1.6 : 5)));
    if (st.mgCalm > 0.02 && !q.fx) idleAct(m, a, out, go, q, sstep(st.mgCalm), t, now, st);
    if (mood && !cast && !relPose && !swinging) {
      q.mood = { angry: 'pout', happy: 'delighted', sad: 'sad', talk: 'talk', sleep: 'dreamy', blink: 'dreamy', hurt: 'hurt' }[mood] ?? q.mood;
      if (mood === 'sad') {
        go({ head: 10, tilt: 3, shN: -60, elN: -130 }, 1);
        q.tears = true;
      }
    }
    if (low && !busy && !m.cine) {
      q.mood = 'pleading';
      q.sweat = (t * 0.6) % 1;
    }
    if (m.talking) q.mood = 'talk';
  }
  // (where her face is turned, eased: never a snap round)
  q.turn = spring(st, 'mgTurn', q.turn, 220, 28, dt);
  // The face, eased toward its mood.
  const F = FACES[q.mood] ?? FACES.gracious;
  const f = (st.mgF ??= { ...FACES.gracious, shut: { happy: 1, sleep: 0, squeeze: 0, dizzy: 0 } });
  let tgt = F;
  if (q.mood === 'talk') {
    const v = VOWELS[Math.floor(t * 7) % VOWELS.length];
    tgt = { ...F, mw: v[0], ms: v[1], mo: v[2] };
  }
  const kf = 1 - Math.exp(-dt * 14);
  // (a lid shuts quickly, a squeeze or a blink never lingering half open over the eye)
  for (const key of ['lid', 'bt', 'by', 'mw', 'ms', 'mo', 'te', 'bl', 'sp', 'wet', 'po', 'sm']) f[key] = mix(f[key], tgt[key], key === 'lid' ? 1 - Math.exp(-dt * (tgt.lid > f.lid ? 40 : 18)) : kf);
  for (const s of SHUTS) f.shut[s] = mix(f.shut[s], s === F.shut ? 1 : 0, 1 - Math.exp(-dt * 12));
  a.mgF = f;
  // (a whole turn, a clean mirror flip; held to the frame it flips on)
  a.mgFlip = q.flip;
  // (for the drawing round her, next frame: the drawer hands each frame a fresh `a`, the rig's state
  // is hers to keep)
  st.mgOuter = { flip: q.flip, rise: q.rise };
  // Springs: the train (each piece trails the one before it, pushed by her glide and her turns), the
  // skirt petals, the sash's tails, the fringe clumps and ringlets, the bun, the dance card, the watch.
  const kick = (st.mgLast ?? out.head ?? 0) - (out.head ?? 0) + ((st.mgLastT ?? out.tilt ?? 0) - (out.tilt ?? 0)) * 0.7;
  st.mgLast = out.head;
  st.mgLastT = out.tilt;
  const flipKick = st.mgFlip0 != null && st.mgFlip0 !== q.flip ? 1 : 0;
  st.mgFlip0 = q.flip;
  const lean = (out.tilt ?? 0) * (Math.PI / 180);
  const drift = walkW;
  const wh = q.whirl;
  const REST = [1.75, 2.0, 2.45, 2.85, 3.1, 3.9];
  a.mgTrain = REST.map((r0, i) => {
    const goal = r0 - lean * (0.6 + i * 0.1) + drift * (0.08 + i * 0.05) + Math.sin(t * 1.3 - i * 0.7) * (0.04 + i * 0.02) - wh * (0.5 + i * 0.25) + q.down * (i < 3 ? 0.6 : 0.2);
    return spring(st, `tr${i}`, goal, 55 - i * 5, 6.4 - i * 0.4, dt, (kick * 0.01 + flipKick * 0.6) * (i + 1) * 0.5);
  });
  a.mgSkirt = SKIRT.map((P, i) => spring(st, `sk${i}`, Math.sin(t * 1.5 + i * 1.3) * 0.05 - lean * 0.5 + drift * 0.12 - wh * 0.4 * (i % 2 ? 1 : -0.5), 70 + i * 6, 6, dt, kick * 0.015 + flipKick * 0.3 * (i % 2 ? 1 : -1)));
  a.mgDown = q.down * 0.4;
  a.mgSash = [0, 1].map((i) => spring(st, `sa${i}`, Math.sin(t * 1.2 + i * 1.7) * 0.12 - lean * 0.6 + drift * 0.3 + wh * 0.6, 55 + i * 10, 5, dt, kick * 0.02 + flipKick * 0.5));
  const headLean = ((out.head ?? 0) + (out.tilt ?? 0)) * (Math.PI / 180);
  a.mgHair = {
    fr: [0, 1, 2].map((i) => spring(st, `fr${i}`, Math.sin(t * 1.7 + i * 1.9) * 0.025 + headLean * 0.15, 150 + i * 30, 12, dt, kick * 0.004 * (i % 2 ? 1 : -1) + flipKick * 0.08)),
    rgN: [0, 1, 2, 3].map((i) => spring(st, `rn${i}`, Math.PI / 2 - headLean * 0.9 + 0.08 + Math.sin(t * 1.4 + i) * 0.05 + drift * 0.15 * i * 0.3, 80 - i * 10, 7, dt, kick * 0.012 * (i + 1) + flipKick * 0.3)),
    rgF: [0, 1, 2, 3].map((i) => spring(st, `rf${i}`, Math.PI / 2 - headLean * 0.9 - 0.05 + Math.sin(t * 1.3 + i + 2) * 0.05 + drift * 0.15 * i * 0.3, 75 - i * 10, 7, dt, kick * 0.012 * (i + 1) + flipKick * 0.3)),
    bun: spring(st, 'bun', Math.sin(t * 0.9) * 0.05 + headLean * 0.1, 120, 10, dt, kick * 0.004),
    slN: spring(st, 'sln', Math.sin(t * 1.2) * 0.04 - headLean * 0.25 + drift * 0.1, 90, 8, dt, kick * 0.006 + flipKick * 0.15),
    slF: spring(st, 'slf', Math.sin(t * 1.1 + 2) * 0.04 - headLean * 0.25 + drift * 0.1, 85, 8, dt, kick * 0.006 + flipKick * 0.15),
  };
  a.mgCard = spring(st, 'card', Math.sin(t * 1.6) * 0.12 - lean * 0.8 + drift * 0.3, 60, 4.5, dt, kick * 0.02 + flipKick * 0.6);
  a.mgWatch = spring(st, 'watch', Math.sin(t * 1.1) * 0.08 - lean * 0.7 + drift * 0.25, 70, 5, dt, kick * 0.015 + flipKick * 0.4);
}
// A cast held (castK: how far through it; wind: its last 0.6 s, gathering).
function castPoseOf(cp, u, castK, wind, go, q, t, say) {
  const k = sstep(u / 0.35);
  if (cp === 'invite') {
    // an envelope held up by her shoulder, then drawn back to send it off
    // (held up out in front at her shoulder's height, clear of her face; drawn back for the flick)
    go({ shN: -108 - 40 * wind, elN: -28 - 30 * wind, hwN: 30, tilt: -3 - 4 * wind, head: -6 }, k);
    q.envelope = k;
    say('delighted', k);
    q.fx = { kind: 'castInvite', u };
  } else if (cp === 'stay') {
    // arms opening wide toward the room, pleading, leaning in
    go({ shN: -80 - 10 * Math.sin(t * 3), elN: -20, hwN: -20, shF: -60, elF: -20, tilt: 8, head: 4 }, k);
    say('pleading', k);
    q.tears = castK > 0.5;
    q.fx = { kind: 'castStay', u };
  } else if (cp === 'room') {
    // arms rising overhead, turning on the spot faster and faster (clean mirror flips)
    go({ shN: -160, elN: -40, shF: -150, elF: -40, tilt: -4, head: -6 }, k);
    const turns = u * (0.6 + u * 0.9);
    q.flip = Math.floor(turns * 2) % 2;
    q.whirl = 0.6 * k;
    say('pout', k);
    q.fx = { kind: 'castRoom', u };
  } else if (cp === 'toast') {
    go({ shN: -150 - 10 * wind, elN: -30, hwN: 10, shF: 10, elF: -110, tilt: -4, head: -10 }, k);
    q.coupe = k;
    say('delighted', k);
    q.fx = { kind: 'castToast', u };
  } else if (cp === 'dance') {
    // a deep curtsey, then her near hand held out to her chosen partner
    const out1 = sstep((u - 1.0) / 0.5);
    go({ drop: 0.3, tilt: 7, head: 16, chest: 3, shN: -18, elN: 12, shF: 22, elF: -10 }, k * (1 - out1));
    go({ tilt: 2, head: -4, shN: -84, elN: -10, hwN: -20, shF: -20, elF: -90 }, out1);
    q.down = 0.45 * k * (1 - out1);
    q.cardUp = out1 * (1 - wind);
    say(out1 > 0.5 ? 'delighted' : 'happy', k);
    q.fx = { kind: 'castDance', u };
  } else if (cp === 'clap') {
    const clap = Math.abs(Math.sin(u * 8)) * (1 - sstep((u - 0.9) / 0.2));
    const call = sstep((u - 0.9) / 0.3);
    go({ shN: -70 + clap * 22, elN: -84, shF: -58 - clap * 20, elF: -86, tilt: -3, head: -6 }, k * (1 - call));
    go({ shN: -150, elN: -60, hwN: -20, shF: 10, elF: -100, head: -10, tilt: -4 }, call);
    say('delighted', k);
    q.fx = { kind: 'castClap', u };
  } else if (cp === 'chime') {
    // the watch held up before her face, ticking: alarmed
    go({ shN: -110, elN: -100, hwN: 20, shF: -30, elF: -110, tilt: -6, head: 4 }, k);
    q.watchUp = k;
    q.tick = u * 8;
    say('shock', k);
    q.fx = { kind: 'castChime', u };
  } else if (cp === 'waltz') {
    // the waltz hold with nobody in it, eyes closed, a slow turn
    go({ shN: -100, elN: -40, hwN: -10, shF: -58, elF: -62, tilt: 4 + Math.sin(t * 2.6) * 4, head: -6 }, k);
    q.flip = Math.floor(u * 0.9) % 2;
    q.whirl = 0.3 * k;
    say('dreamy', k);
    q.fx = { kind: 'castWaltz', u };
  }
}
// A cast let go (u: s since it ended).
function releaseOf(rp, u, go, q, t, say) {
  const k = win(u, 0, 0.06, 0.6, 1.1);
  if (rp === 'invite') {
    go({ shN: -70, elN: -6, hwN: -30, tilt: 8, x: 0.03 }, k);
    say('delighted', k);
  } else if (rp === 'stay') {
    go({ shN: -100, elN: 0, shF: -90, elF: 0, tilt: 10, head: -4 }, k);
    say('pleading', k);
  } else if (rp === 'room') {
    go({ shN: -110, elN: 0, shF: -100, elF: 0, tilt: -2 }, k);
    q.whirl = k;
    say('pout', k);
  } else if (rp === 'toast') {
    go({ shN: -165, elN: -10, hwN: 10, tilt: -6, head: -12 }, k);
    q.coupe = 1 - sstep((u - 0.6) / 0.3);
    say('happy', k);
  } else if (rp === 'dance') {
    go({ shN: -140, elN: -30, shF: -120, elF: -40, tilt: -4 }, k);
    q.flip = u < 0.3 ? 1 : 0;
    q.whirl = k;
    say('delighted', k);
  } else if (rp === 'clap') {
    go({ shN: -150, elN: -60, hwN: -20, head: -10 }, k);
    say('delighted', k);
  } else if (rp === 'chime') {
    go({ shN: -60, elN: -130, hwN: 20, shF: -40, elF: -120, head: 8 }, k);
    q.watchUp = k;
    say('pleading', k);
  } else if (rp === 'waltz') {
    go({ shN: -110, elN: 0, shF: -100, elF: 0, tilt: -6, head: -10 }, k);
    q.flip = u < 0.35 ? 1 : 0;
    q.whirl = k;
    say('cry', k);
  }
  q.fx = { kind: `rel_${rp}`, u };
}
// The 30 s act (only a piece she has time to finish, m.restUntil): her dance card; her watch; a
// practice waltz; a wave to the door.
const PIECES = [
  { name: 'card', t0: 0.5, len: 7.4 },
  { name: 'watch', t0: 8.6, len: 6.2 },
  { name: 'practice', t0: 15.6, len: 7.6 },
  { name: 'wave', t0: 24, len: 5.4 },
];
function idleAct(m, a, out, go, q, w, t, now, st) {
  const lu = (t + (m.uid % 7) * 4.3) % 30;
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
  if (cur.name === 'card') {
    // the card lifted and read (blank), a sigh; a pretend name written in; pressed to her heart
    const k = win(u, 0, 0.5, 6.8, 7.4);
    const write = win(u, 3.6, 3.9, 4.8, 5.1);
    const heart = win(u, 5.2, 5.5, 6.6, 7.2);
    go({ shN: -90 + 50 * heart, elN: -90 - 30 * heart, hwN: 30, head: 8 - 6 * heart, shF: -50 * write - 30 * heart, elF: -100 * write - 90 * heart }, k * w);
    q.cardUp = (1 - heart) * k * w;
    q.cardHeart = sstep((u - 4.6) / 0.4) * k * w;
    if (at(k)) {
      q.mood = u < 2 ? 'gracious' : u < 3.6 ? 'sad' : u < 5.2 ? 'focus' : 'bliss';
      q.look = u < 5.2 ? [0.6, 0.7] : [0.3, 0];
      q.fx = { kind: 'card', u };
    }
  } else if (cur.name === 'watch') {
    // the watch tapped, held to her ear, a little frown, let go
    const k = win(u, 0, 0.5, 5.6, 6.2);
    const ear = win(u, 2.2, 2.6, 4.2, 4.6);
    const tap = u > 1 && u < 2 ? Math.max(0, Math.sin(u * 18)) : 0;
    go({ shN: -100 - 30 * ear, elN: -90 - 40 * ear, hwN: 20, shF: -40 + 10 * tap, elF: -100 - 10 * tap, head: 6 - 12 * ear + 4 * tap, tilt: 2 }, k * w);
    q.watchUp = k * w;
    if (at(k)) {
      q.mood = u < 2.2 ? 'focus' : u < 4.4 ? 'dreamy' : 'pout';
      q.look = [0.5, 0.6];
      q.fx = { kind: 'watch', u };
    }
  } else if (cur.name === 'practice') {
    // the hold, eyes closed, a slow turn; caught at it: a blush, her skirt smoothed
    const k = win(u, 0, 0.6, 7, 7.6);
    const dance = win(u, 0, 0.6, 4.6, 5);
    const smooth2 = win(u, 5, 5.4, 6.8, 7.4);
    go({ shN: -96 + Math.sin(t * 2.6) * 6, elN: -40, hwN: -10, shF: -58, elF: -62, tilt: 4 + Math.sin(t * 2.6) * 4, head: -6 }, k * w * dance);
    go({ shN: 30, elN: -20, shF: 30, elF: 20, head: 10, tilt: 6 }, k * w * smooth2);
    if (at(k)) {
      q.flip = u > 1.6 && u < 3.4 ? Math.floor((u - 1.6) / 0.9) % 2 : 0;
      q.whirl = 0.3 * dance;
      q.mood = u < 4.6 ? 'dreamy' : u < 5.2 ? 'shock' : 'sheepish';
      q.fx = { kind: 'practice', u };
    }
  } else {
    // a wave to the door; nobody there; a pat of her chignon, as if that was what she meant
    const k = win(u, 0, 0.4, 4.8, 5.4);
    const wave = win(u, 0.3, 0.6, 2, 2.4);
    const pat = win(u, 3, 3.3, 4.4, 4.8);
    go({ shN: -150 * wave - 170 * pat, elN: -60 + Math.sin(t * 9) * 20 * wave - 70 * pat, hwN: 10, head: -4 + 6 * pat, tilt: -2 }, k * w);
    if (at(k)) {
      q.mood = u < 2.2 ? 'delighted' : u < 3 ? 'sad' : 'sheepish';
      q.look = u < 3 ? [-1, 0] : [0.3, 0];
      q.turn = u < 3 ? 0.1 : 0.35;
    }
  }
}

// ---------- Effects (the rig's space, facing right; drawn live in her own soft style) ----------
// A marigold petal: a rounded teardrop, its own deeper rim, a light vein.
export function mgPetal(ctx, x, y, s, ang, al = 1, col = PETAL[2], rim = GOWN[3]) {
  if (al <= 0.01 || s <= 0.05) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.translate(x, y);
  ctx.rotate(ang);
  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.8, 0, s);
  ctx.bezierCurveTo(-s * 0.7, s * 0.8, -s * 0.9, -s * 0.6, 0, -s);
  ctx.closePath();
  pen(ctx, rim, Math.max(0.5, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = col;
  ctx.fill();
  ell(ctx, -s * 0.2, -s * 0.25, s * 0.22, s * 0.4, 0.2);
  ctx.fillStyle = 'rgba(255,250,220,0.8)';
  ctx.fill();
  ctx.restore();
}
// A soft heart.
function heart(ctx, x, y, s, al = 1, fill = '#ff8ab4', rim = '#c8527e') {
  if (al <= 0.01) return;
  ctx.save();
  ctx.globalAlpha *= al;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y + s * 0.1, x - s * 1.1, y - s * 1.05, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 1.1, y - s * 1.05, x + s * 1.3, y + s * 0.1, x, y + s * 0.9);
  ctx.closePath();
  pen(ctx, rim, Math.max(0.6, s * 0.22));
  ctx.stroke();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}
function fx(ctx, m, a, S, matOf, D) {
  const q = a.mgQ;
  if (!q) return;
  ctx.save();
  ctx.scale(1 / BIG, 1 / BIG);
  fxIn(ctx, m, a, D, q);
  ctx.restore();
}
function fxIn(ctx, m, a, D, q) {
  const t = a.t ?? 0;
  const B = (p) => [p[0] * BIG, p[1] * BIG];
  const f = a.flip !== Boolean(a.mo?.rig?.mgOuter?.flip) ? -1 : 1;
  const crown = B(headAt(a, D, [0, -22]));
  const face = B(headAt(a, D, [6, 4]));
  const hand = B(ptOf(a, D, 'handN', D.J.handN));
  const handF = B(ptOf(a, D, 'handF', D.J.handF));
  const tp = trainPts(a, D).map((p) => B(ptOf(a, D, 'torso', p)));
  // always: a few glowing petals drifting off her train's tip and the hem of her skirt
  if (m.hp > 0) {
    for (let i = 0; i < 4; i++) {
      const v = (t * 0.32 + hash(i * 3.3 + (m.uid ?? 0))) % 1;
      const src = tp[4 + (i % 3)];
      mgPetal(ctx, src[0] - v * 14 + Math.sin(v * 6 + i) * 4, src[1] - v * 22, 1.6 + hash(i) * 0.8, v * 5 + i, Math.sin(Math.PI * v) * 0.8, i % 2 ? PETAL[1] : PETAL[2]);
    }
    glow(ctx, tp[5][0], tp[5][1], 18, '#fff2c4', 0.25);
  }
  const X = q.fx;
  if (!X) return;
  const u = X.u;
  if (X.kind === 'arrive') {
    // the moon's beam she comes down, petals spiralling round her, a glow where she'll land
    const al = 1 - sstep((u - 0.85) / 0.15);
    const top = -260;
    const g = ctx.createLinearGradient(0, top, 0, 0);
    g.addColorStop(0, 'rgba(255,246,214,0)');
    g.addColorStop(0.4, `rgba(255,246,214,${0.3 * al})`);
    g.addColorStop(1, `rgba(255,236,190,${0.4 * al})`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(-18, top);
    ctx.lineTo(18, top);
    ctx.lineTo(44, 0);
    ctx.lineTo(-44, 0);
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 12; i++) {
      const an = t * 2.4 + (i / 12) * TAU;
      const y = -10 - ((i * 23 + u * 300) % 200);
      mgPetal(ctx, Math.cos(an) * (26 + i % 3 * 6), y, 2 + (i % 3) * 0.5, an * 2, al * (Math.sin(an) > 0 ? 1 : 0.55));
    }
    glow(ctx, 0, -4, 46, '#fff0c0', 0.35 * sstep(u / 0.6));
    if (u > 0.86) for (let i = 0; i < 6; i++) sparkle(ctx, Math.cos(i * 1.05) * (20 + (u - 0.86) * 160), -6 + Math.sin(i * 1.05) * 6, 3 * (1 - (u - 0.86) / 0.14), 1);
  } else if (X.kind === 'curtsey') {
    for (let i = 0; i < 3; i++) sparkle(ctx, hand[0] + 8 + i * 6, hand[1] - 6 - i * 4, 2.4 * win(u, 0.2 + i * 0.1, 0.4 + i * 0.1, 0.9, 1.2), 1);
  } else if (X.kind === 'castInvite') {
    sparkle(ctx, hand[0] + 4, hand[1] - 8, 2.4 + Math.sin(t * 8), 0.9);
  } else if (X.kind === 'rel_invite') {
    // the envelopes fly off from her fingertips, fluttering up and away
    for (let i = 0; i < 3; i++) {
      const v = clamp(u * 1.6 - i * 0.12, 0, 1);
      if (v <= 0 || v >= 1) continue;
      envelope(ctx, a, 'line', hand[0] + 10 + v * (40 + i * 22), hand[1] - 10 - Math.sin(Math.PI * v) * 30 - i * 6, Math.sin(v * 9 + i) * 0.4, 1.6, 1 - v);
      envelope(ctx, a, 'fill', hand[0] + 10 + v * (40 + i * 22), hand[1] - 10 - Math.sin(Math.PI * v) * 30 - i * 6, Math.sin(v * 9 + i) * 0.4, 1.6, 1 - v);
    }
  } else if (X.kind === 'castStay' || X.kind === 'rel_stay') {
    // petals drawn in toward her arms; a soft warm glow round her (the one safe place)
    const k = X.kind === 'castStay' ? sstep(u / 0.6) : 1 - sstep(u / 0.8);
    glow(ctx, 0, -50, 60, '#ffe6b8', 0.3 * k);
    for (let i = 0; i < 8; i++) {
      const v = (t * 0.5 + i / 8) % 1;
      const an = (i / 8) * TAU + t * 0.3;
      const r = 90 * (1 - v) + 20;
      mgPetal(ctx, Math.cos(an) * r, -50 + Math.sin(an) * r * 0.5, 2, an + v * 4, Math.sin(Math.PI * v) * k);
    }
  } else if (X.kind === 'castRoom' || X.kind === 'rel_room') {
    // her train swirling: a ribbon of petals round her
    const k = X.kind === 'castRoom' ? sstep(u / 0.5) : 1 - sstep(u / 0.9);
    for (let i = 0; i < 14; i++) {
      const an = t * (X.kind === 'castRoom' ? 3 + u * 3 : 7) + (i / 14) * TAU;
      const r = X.kind === 'castRoom' ? 46 : 46 + u * 90;
      const front = Math.sin(an) > 0;
      mgPetal(ctx, Math.cos(an) * r, -40 + Math.sin(an) * 12 - (i % 3) * 14, 2.2, an * 1.5, k * (front ? 1 : 0.5), i % 2 ? PETAL[1] : PETAL[2]);
    }
  } else if (X.kind === 'castToast') {
    // fizz rising from the coupe
    for (let i = 0; i < 5; i++) {
      const v = (t * 0.9 + i / 5) % 1;
      ell(ctx, hand[0] + Math.sin(v * 8 + i) * 2.4, hand[1] - 12 - v * 22, 1 + v * 0.8, 1 + v * 0.8);
      pen(ctx, '#e8c25a', 0.6);
      ctx.globalAlpha = 1 - v;
      ctx.stroke();
      ctx.fillStyle = '#fff8d8';
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  } else if (X.kind === 'rel_toast') {
    const k = clamp(u / 0.5, 0, 1);
    for (let i = 0; i < 6; i++) sparkle(ctx, hand[0] + Math.cos(i * 1.05) * (6 + k * 18), hand[1] - 14 + Math.sin(i * 1.05) * (4 + k * 12), 2.6 * (1 - k), 1 - k);
    if (u < 0.7) cue(ctx, 'Cheers!', hand[0] + 6, hand[1] - 34, 9, f, -0.1, '#a05a2c');
  } else if (X.kind === 'castDance') {
    if (u > 1) for (let i = 0; i < 3; i++) heart(ctx, hand[0] + 10 + i * 7, hand[1] - 8 - ((t * 20 + i * 9) % 22), 2.2, 0.8);
  } else if (X.kind === 'rel_dance' || X.kind === 'rel_waltz') {
    const k = clamp(u / 0.8, 0, 1);
    for (let i = 0; i < 10; i++) {
      const an = (i / 10) * TAU + k * 3;
      mgPetal(ctx, Math.cos(an) * (24 + k * 60), -50 + Math.sin(an) * (12 + k * 26), 2.4, an * 2, 1 - k, i % 2 ? PETAL[1] : PETAL[2]);
    }
  } else if (X.kind === 'castClap' || X.kind === 'clap') {
    const k = Math.abs(Math.sin(u * 8));
    if (u < 1) for (let i = 0; i < 3; i++) sparkle(ctx, (hand[0] + handF[0]) / 2 + Math.cos(i * 2.1) * 8, (hand[1] + handF[1]) / 2 - 6 + Math.sin(i * 2.1) * 6, 2.4 * k, k);
    if (X.kind === 'castClap' && u > 0.9 && u < 1.6) cue(ctx, 'Humphrey!', crown[0] + 30, crown[1] - 4, 9, f, -0.1, '#a05a2c');
  } else if (X.kind === 'castChime' || X.kind === 'midnight' || X.kind === 'rel_chime') {
    // the watch ticking: a soft ring of chimes off it, little gold notes
    const v = (u * 1.1) % 1;
    const w = B(watchAt(a, D));
    ctx.save();
    ctx.globalAlpha = (1 - v) * 0.8;
    pen(ctx, '#e8c25a', 1.4);
    ctx.beginPath();
    ctx.arc(w[0], w[1], 6 + v * 22, 0, TAU);
    ctx.stroke();
    pen(ctx, '#fff6d0', 0.6);
    ctx.stroke();
    ctx.restore();
    if (X.kind === 'midnight' && u < 1.4) cue(ctx, 'tick... tick...', crown[0] + 26, crown[1] - 8, 8, f, -0.08, '#7a4a8c');
  } else if (X.kind === 'castWaltz') {
    for (let i = 0; i < 6; i++) {
      const an = t * 1.6 + (i / 6) * TAU;
      mgPetal(ctx, Math.cos(an) * 34, -56 + Math.sin(an) * 10 - (i % 2) * 18, 2.2, an, 0.8 * sstep(u / 0.6));
    }
  } else if (X.kind === 'feast') {
    if (u > 0.6 && u < 1.8) for (let i = 0; i < 3; i++) heart(ctx, face[0] + 10 + i * 6, face[1] - 18 - ((u - 0.6) * 30 + i * 6) % 24, 2.2, 1 - sstep((u - 1.4) / 0.4));
    if (u > 0.5 && u < 1.4) cue(ctx, 'Mmm!', face[0] + 26, face[1] - 26, 9, f, -0.1, '#a05a2c');
  } else if (X.kind === 'flick' || X.kind === 'swish' || X.kind === 'shoo') {
    if (u > -0.02 && u < 0.5) {
      const k = clamp(u / 0.4, 0, 1);
      const at = X.kind === 'swish' ? [tp[3][0] + 20, tp[3][1]] : [hand[0] + 6, hand[1]];
      for (let i = 0; i < 6; i++) {
        const an = -0.9 + i * 0.36;
        mgPetal(ctx, at[0] + Math.cos(an) * (4 + k * 22), at[1] + Math.sin(an) * (4 + k * 16), 2.2 * (1 - k * 0.4), an + k * 4, 1 - k);
      }
      if (X.kind === 'shoo') cue(ctx, 'Shoo!', hand[0] + 20, hand[1] - 22, 8, f, -0.1, '#a05a2c');
    }
  } else if (X.kind === 'ready') {
    sparkle(ctx, hand[0] + 2, hand[1] - 4, 1.8 + Math.sin(t * 9) * 0.6, 0.8);
  } else if (X.kind === 'flourish') {
    const k = clamp(u / 0.8, 0, 1);
    for (let i = 0; i < 8; i++) {
      const an = -Math.PI / 2 + (i - 3.5) * 0.4;
      mgPetal(ctx, hand[0] + Math.cos(an) * (6 + k * 30), hand[1] + Math.sin(an) * (6 + k * 24), 2.4, an + k * 3, 1 - k);
    }
  } else if (X.kind === 'hurt') {
    const v = clamp(u / 0.5, 0, 1);
    mgPetal(ctx, tp[1][0] - 8 - v * 16, tp[1][1] - 10 - v * 8 + v * v * 12, 2.4, v * 6, 1 - v);
    sparkle(ctx, face[0] - 6, face[1] - 10, 2.6 * (1 - v), 1 - v, '#ffe0e8');
  } else if (X.kind === 'card') {
    if (u > 2.2 && u < 3.6) cue(ctx, '...sigh', face[0] + 20, face[1] - 22, 7, f, -0.1, '#7a4a8c');
    if (u > 5.3 && u < 6.6) heart(ctx, face[0] + 14, face[1] - 20 - (u - 5.3) * 6, 2.6, win(u, 5.3, 5.5, 6.2, 6.6));
  } else if (X.kind === 'watch') {
    if (u > 2.6 && u < 4.2) cue(ctx, '...?', face[0] + 18, face[1] - 22, 8, f, -0.1, '#7a4a8c');
  } else if (X.kind === 'practice') {
    if (u < 4.6) for (let i = 0; i < 2; i++) mgPetal(ctx, Math.cos(t * 1.5 + i * 3) * 30, -44 - i * 16, 2, t + i, 0.7);
    if (u > 5 && u < 6.6) cue(ctx, 'oh!', face[0] + 18, face[1] - 24, 8, f, -0.1, '#a05a2c');
  } else if (X.kind === 'beaten') {
    for (let i = 0; i < 3; i++) {
      const an = t * 2.6 + (i / 3) * TAU;
      mgPetal(ctx, crown[0] + Math.cos(an) * 16, crown[1] - 6 + Math.sin(an) * 5, 2, an, Math.sin(an) > 0 ? 1 : 0.55);
    }
  }
}

const DRESS = {
  id: 'marigold',
  skin: { lt: SKIN[0], base: SKIN[1], sh: SKIN[2], deep: SKIN[3], ink: INK, guides: false, out: 2 / BIG },
  liveHead: true,
  noMoves: true,
  hide: ['lower'],
  under: {
    // (behind everything of her body: her hair at the back of her head (the chignon, the nape, the
    // ringlets hang behind her shoulders, never over her gown or arms), the bow at her back and the
    // back petals of her skirt (behind her far arm too: they hang behind her, the arm at her side))
    armF: (ctx, a, mode, S, D) => {
      head(ctx, a, mode, D, 'back');
      sash(ctx, a, mode, D, 'bow');
      skirt(ctx, a, mode, D, 0);
    },
  },
  under2: (ctx, m, a, S, matOf, D) => {
    train(ctx, a, 'line', D);
    train(ctx, a, 'fill', D);
  },
  over: {
    torsoSkin: (ctx, a, mode, S, D) => {
      skirt(ctx, a, mode, D, 1);
      skirt(ctx, a, mode, D, 2);
      bodice(ctx, a, mode, D);
      sash(ctx, a, mode, D, 'band');
      watch(ctx, a, mode, D);
    },
    armF: (ctx, a, mode, S, D) => {
      glove(ctx, a, mode, D, 'F');
      sleeve(ctx, a, mode, D, 'F');
    },
    head: (ctx, a, mode, S, D) => head(ctx, a, mode, D, 'front'),
    armN: (ctx, a, mode, S, D) => {
      glove(ctx, a, mode, D, 'N');
      sleeve(ctx, a, mode, D, 'N');
    },
    handNskin: (ctx, a, mode, S, D) => {
      handThings(ctx, a, mode, D);
      danceCard(ctx, a, mode, D);
    },
  },
  pose,
  fx,
};
const R = dressRig('hostess', DRESS);
const rig = R.rig;
const draw0 = rig.draw;
rig.draw = (ctx, m, a) => {
  // (not there yet in her entrance; up the moon's beam as she comes down it; a whole turn a clean
  // mirror flip)
  // (the pose works these out as it draws, kept in her rig's state: they follow it a frame behind;
  // 'away' is known at once: not drawn at all)
  if (m.cine?.act?.move === 'away' || (m.offstage && !m.cine?.act)) return;
  const o = a.mo?.rig?.mgOuter;
  const act = m.cine?.act;
  // (coming down the moon's beam: worked out from the act's own clock, so the first frame is right too)
  const rise = act?.move === 'arrive' && m.hp > 0 ? (1 - sstep(clamp(((a.now ?? 0) - act.at) / (act.dur ?? 1), 0, 1) * 1.05)) * 2.6 : 0;
  ctx.save();
  if (rise) ctx.translate(0, -rise * 60);
  if (o?.flip) ctx.scale(-1, 1);
  ctx.scale(BIG, BIG);
  a.gaitScale = BIG;
  draw0(ctx, m, a);
  ctx.restore();
};
rig.w = Math.round(rig.w * BIG * 1.3);
rig.h = Math.round(rig.h * BIG * 1.3);
// Her art entry, her size as drawn and her gliding pace (the base's own at her size).
export const MARIGOLD_ART = { pad: 18, walk: 8, idle: 8, attack: 5, stride: R.stride * BIG, atkMs: [100, 300, 240, 260], draw: R.still, rig, noHop: true };
export const MARIGOLD_SIZE = { w: 70, h: 110, speed: Math.round(R.speed * BIG) };
