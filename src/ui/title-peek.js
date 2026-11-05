// The title screen's peekers: the island's own folk keep popping into the screen in a big
// close-up, one at a time, from the bottom, a side, or hanging upside down from the top, each with
// a line of their own (from who they are: Marlo sells, Nim apologises, Mira can't leave her spot).
// Each gag peeks in a little first (anticipation), pops the rest of the way with an overshoot,
// says its line, then ducks out fast. Click a face and they yelp and duck. Now and then Marlo
// hangs down and makes off with a letter of the logo, and throws it back a moment later.

import { NPCS } from '../data/npcs.js';
import { drawHero } from '../render/hero.js';
import { drawHayate } from '../render/hayate.js';
import { withZoom } from '../render/pixel.js';
import { clicked, roundRect, font, text, COLORS } from './kit.js';
import { sfx } from '../audio/sfx.js';

// How big they are, and where the face sits above the feet (in body units).
const S = 6;
const HEAD = 24;
const HEAD_R = 15;

// Who pops in, how, with which face and what they say. `faces`: [peeking, popped].
export const GAGS = [
  { who: 'marlo', kind: 'side', faces: ['smug', 'sassy'], lines: ['Psst. Title screen\'s free. Leaving it is 5 gold.', 'Rare item! Only slightly cursed. Interested?', 'Press any key. Premium keys sold separately.'] },
  { who: 'nim', kind: 'up', faces: ['nervous', 'shy'], lines: ['Oh! S-sorry! I was reading down here...', 'Is it... bedtime story time yet?', 'I-I\'m not peeking. This is a coincidence.'] },
  { who: 'mira', kind: 'top', faces: ['excited', 'excited'], lines: ['Hi! I have a quest! Come to me. I can\'t move.', 'Kill ten snails and I\'ll say "thanks"!', 'Press I for your bag! Press any key first!'] },
  { who: 'pip', kind: 'up', faces: ['grin', 'grin'], lines: ['Delivery for... the title screen? Sign here.', 'Potions! Get your potions! Before the game starts!'] },
  { who: 'lulu', kind: 'side', faces: ['judging', 'sassy'], lines: ['That outfit? On MY title screen? 200 gold. Now.', 'Hold still. You have menu on your face.'] },
  { who: 'tora', kind: 'up', faces: ['determined', 'grin'], lines: ['I could upgrade that logo. +1. Might explode.', 'Fresh off the anvil! It\'s a title screen!'] },
  { who: 'clover', kind: 'side', faces: ['shock', 'cat'], lines: ['Have you seen a puff bun? Round. Bouncy. Bites.', 'Ooh! Do you like riding things?'] },
  { who: 'kelp', kind: 'up', faces: ['sleepy', 'smile'], lines: ['Back in my day the title screen was a rock.', 'Mind the steps, dearie. And the logo.'] },
  { who: 'rook', kind: 'top', faces: ['grin', 'grin'], lines: ['Ahoy! Title screen ahoy! ...That\'s the joke.', 'Got time for a job? It\'s a quest. It\'s the same thing.'] },
  { who: 'hayate', kind: 'side', faces: ['sleepy', 'sleepy'], lines: ['Zzz... five more minutes... zzz...', 'Mmh... is it the finale yet...? Zzz...'] },
];
export const THIEF = { who: 'marlo', kind: 'thief', faces: ['smug', 'smug'], lines: ['Nice letter. Mine now.'], back: 'Fine! Rent it back. 2 gold.' };

const OW = ['Ow! My face!', 'Hey! Rude!', 'Eep!', 'Not the face!'];

let gag = null;
let next = 1.4;
let order = [];
let seen = 0;
// The logo's stolen letter: its index, and when it's thrown back.
export const logoTheft = { letter: -1, back: null, grab: 0, x: 0, y: 0, rot: 0 };

const ease = (u) => u * u * (3 - 2 * u);
// A spring settle: overshoots past 1 and wobbles back.
const spring = (u) => 1 - Math.exp(-6 * u) * Math.cos(9 * u);

function pickGag() {
  seen += 1;
  if (seen % 5 === 3) return { ...THIEF };
  if (!order.length) order = GAGS.map((_, i) => i).sort(() => Math.random() - 0.5);
  const g = GAGS[order.pop()];
  return { ...g, line: g.lines[Math.floor(Math.random() * g.lines.length)] };
}

// How far in they are (0 out of sight, 1 all the way, a little over during the pop).
function inAmount(g, t) {
  const leave = g.leave ?? Infinity;
  if (t >= leave) return Math.max(0, 1 - ease(Math.min(1, (t - leave) / 0.28)));
  if (t < 0.35) return 0.32 * ease(t / 0.35);
  if (t < 0.85) return 0.32 + 0.02 * Math.sin((t - 0.35) * 20);
  return 0.34 + 0.66 * spring((t - 0.85) / 0.6);
}

// Where the face is and how the figure is held, from the gag's kind and how far in it is.
function placeOf(g, k) {
  const off = 1 - k;
  if (g.kind === 'up') return { x: g.x, y: 360 + HEAD * S - 108 + off * 230, rot: 0, facing: g.x < 320 ? 1 : -1 };
  // Leaning in sideways from off an edge (the thief from the right, high up beside the logo).
  if (g.kind === 'side' || g.kind === 'thief') {
    const d = g.kind === 'thief' ? 1 : g.side;
    return { x: (d < 0 ? -80 : 720) + d * off * 150, y: g.kind === 'thief' ? 200 : g.y, rot: -d * 1.15, facing: -d };
  }
  // Hanging upside down from the top.
  return { x: g.x, y: -(HEAD * S) + 100 - off * 260, rot: Math.PI, facing: 1 };
}

// The face's centre on screen, for clicks and the speech bubble.
function faceAt(p) {
  const c = Math.cos(p.rot);
  const s = Math.sin(p.rot);
  return { x: p.x + s * HEAD * S, y: p.y - c * HEAD * S };
}

function bubble(ctx, fx, fy, line, chars, toward, name, below = false) {
  ctx.font = font(10, true);
  const shown = line.slice(0, chars);
  const words = line.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(t).width > 150 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = t;
  }
  lines.push(cur);
  const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 20;
  const h = lines.length * 13 + 14;
  const bx = Math.max(8, Math.min(632 - w, toward > 0 ? fx + 78 : fx - 78 - w));
  const by = below ? fy + 96 : Math.max(14, Math.min(300 - h, fy - h - 30));
  ctx.fillStyle = 'rgba(90,63,122,0.2)';
  roundRect(ctx, bx + 2, by + 3, w, h, 10);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#b062c8';
  ctx.lineWidth = 2;
  roundRect(ctx, bx, by, w, h, 10);
  ctx.fill();
  ctx.stroke();
  // The tail, pointing back at the face.
  const tx = toward > 0 ? bx + 10 : bx + w - 10;
  const ey = below ? by + 1 : by + h - 1;
  const tip = below ? by - 12 : by + h + 12;
  ctx.beginPath();
  ctx.moveTo(tx - 6, ey);
  ctx.lineTo(tx + toward * -14, tip);
  ctx.lineTo(tx + 6, ey);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(tx - 6, below ? by : by + h);
  ctx.lineTo(tx + toward * -14, tip);
  ctx.lineTo(tx + 6, below ? by : by + h);
  ctx.stroke();
  // The name tag on the bubble's corner.
  ctx.font = font(8, true);
  const nw = ctx.measureText(name).width + 12;
  ctx.fillStyle = '#ff8fc1';
  roundRect(ctx, bx + 8, by - 7, nw, 12, 6);
  ctx.fill();
  text(ctx, name, bx + 14, by + 2, { size: 8, bold: true, color: '#ffffff' });
  // The words, typed out (the full line laid out first so nothing jumps as it types).
  let left = shown.length;
  lines.forEach((l, i) => {
    const part = l.slice(0, Math.max(0, left));
    left -= l.length + 1;
    text(ctx, part, bx + 10, by + 18 + i * 13, { size: 10, bold: true, color: COLORS.ink });
  });
}

// What the one in view is saying, drawn over everything else on the screen (drawPeekerTalk).
let talk = null;
export function drawPeekerTalk(ctx) {
  if (talk) bubble(ctx, ...talk);
}

// `letters`: the logo's letters' spots ({ x, y }), so the thief knows where to reach.
export function drawPeekers(ui, time, letters, drawLetter) {
  const { ctx } = ui;
  if (!gag && time >= next) {
    gag = pickGag();
    gag.start = time;
    gag.side = Math.random() < 0.5 ? -1 : 1;
    gag.x = Math.random() < 0.5 ? 90 + Math.random() * 70 : 480 + Math.random() * 70;
    if (gag.kind === 'thief') {
      gag.letter = letters.length - 1 - Math.floor(Math.random() * 2);
      gag.line = gag.lines[0];
    }
    if (gag.kind === 'top' && gag.x > 200 && gag.x < 440) gag.x = 120;
    gag.y = 230 + Math.random() * 70;
    gag.say = 1.25;
    gag.hold = gag.say + gag.line.length / 22 + 1.6;
  }
  if (logoTheft.back != null && time > logoTheft.back + 0.9) {
    logoTheft.letter = -1;
    logoTheft.back = null;
  }
  talk = null;
  if (!gag) return;
  const t = time - gag.start;
  if (gag.leave == null && t > gag.hold) gag.leave = t;
  const k = inAmount(gag, t);
  if (gag.leave != null && k <= 0) {
    if (gag.kind === 'thief') logoTheft.back = time + 1.2;
    gag = null;
    next = time + 1.2 + Math.random() * 1.6;
    return;
  }
  const p = placeOf(gag, k);
  const face = faceAt(p);
  const popped = t > 0.85 && gag.leave == null;
  const bonked = gag.bonk != null;
  const mood = bonked ? 'dizzy' : gag.leave != null ? 'shock' : popped ? gag.faces[1] : gag.faces[0];
  const talking = popped && !bonked && t > gag.say && t < gag.say + gag.line.length / 22;
  // The thief grabs the letter as it pops in and carries it off.
  if (gag.kind === 'thief' && t > 0.9 && logoTheft.letter < 0) {
    logoTheft.letter = gag.letter;
    logoTheft.grab = time;
    sfx('poof');
  }
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  withZoom(S, () => {
    if (gag.who === 'hayate') drawHayate(ctx, 0, 0, time, { s: S, awake: bonked, talking: false });
    else {
      const npc = NPCS[gag.who];
      drawHero(ctx, { ...npc.look, face: mood }, npc.gear ?? {}, 0, 0, { pose: 'idle', time, seed: 5, scale: S, facing: p.facing, talking });
    }
  });
  ctx.restore();
  // The stolen letter zips from its slot into the thief's hold, held up by the face.
  if (gag.kind === 'thief' && logoTheft.letter >= 0) {
    const u = ease(Math.min(1, (time - logoTheft.grab) / 0.35));
    const from = letters[logoTheft.letter];
    const hx = face.x - 118;
    const hy = face.y + 34;
    logoTheft.x = from.x + (hx - from.x) * u;
    logoTheft.y = from.y + (hy - from.y) * u - Math.sin(u * Math.PI) * 30;
    logoTheft.rot = u * (-0.5 + Math.sin(time * 5) * 0.12);
    if (logoTheft.back == null) drawLetter(ctx, letters[logoTheft.letter].ch, logoTheft.x, logoTheft.y, logoTheft.rot);
  }
  talk = null;
  if (popped && (bonked || t > gag.say - 0.15)) {
    const line = bonked ? gag.ow : gag.line;
    const since = bonked ? time - gag.bonk : t - gag.say;
    talk = [face.x, face.y, line, Math.floor(since * 30), face.x < 320 ? 1 : -1, gag.who === 'hayate' ? 'Hayate' : NPCS[gag.who].name, gag.kind === 'thief' || gag.kind === 'top'];
  }
  // A click on the face: a yelp, and they duck out.
  const r = HEAD_R * S * 0.8;
  if (popped && !bonked && clicked(ui, face.x - r, face.y - r, r * 2, r * 2)) {
    gag.bonk = time;
    gag.ow = OW[Math.floor(Math.random() * OW.length)];
    gag.hold = t + 1.1;
    sfx('bellbonk');
  }
}
