// The character creator as the theatre's costume department (backstage at Madame Encore's, the
// same set as the title show and the dressing rooms). Your new hero stands on a fitting turntable
// under a spotlight, with their star plate hanging above; Lulu the stylist stands by and has an
// opinion about every choice (from who she is: a sassy salon owner who prices everything). The
// looks are picked from a wooden wardrobe cabinet on the right.

import { NPCS } from '../data/npcs.js';
import { drawHero } from '../render/hero.js';
import { withZoom } from '../render/pixel.js';
import { COLORS, THEMES, text, box, button, tabs, wrap, hover, roundRect, font, tooltip, toggle } from './kit.js';
import { lookRows, randomLook, LOOK_TABS } from './looks.js';
import { backstage } from './dressing.js';
import { castGear } from './title-cast.js';

const POSES = ['Idle', 'Walk', 'Cheer', 'Back'];
const POSE_DUR = 1.1;
const FLOOR = 300;
const CX = 168;

// What Lulu says, by what you just changed (never the same line twice in a row).
const SAYS = {
  hairStyle: ['Ooh, the hair! Iconic.', 'That hair has main character energy.', 'Bold. I love bold.', 'Now THAT is a hairdo.'],
  hairColor: ["That colour? Chef's kiss.", 'Very fashion. Very now.', 'It glows under the lights!'],
  hairTip: ['Dipped tips! So extra.', 'The tips make the look, darling.'],
  hairBangs: ['Fringe benefits!', 'Bangs: the hero of the hair.'],
  eyeStyle: ['Those eyes could sell potions.', 'Ooh, sparkly. Very protagonist.'],
  browStyle: ['Brows: on point.', 'Those brows have opinions.'],
  eyeColor: ['Gorgeous. Not jealous. Okay, a bit.'],
  face: ['Practise that face in the mirror. Daily.', 'Ooh, a smug one. Love that for you.', 'That face says "I read the patch notes."'],
  earStyle: ['Ears! Both of them. Perfect.'],
  skinTone: ['Glowing. Absolutely glowing.'],
  outfit: ["It's giving hero.", "That outfit? I'd charge 200 gold for it.", 'Wear it like the cash shop is watching.'],
  outfitColor: ['That colour pops on stage!', 'Matches nothing. Perfect.'],
  random: ['Let fate do your hair. I respect it.', 'Chaos! My favourite style.', 'A surprise makeover! Free. This once.'],
  undo: ['Changed your mind? Classic.', 'Back it goes. No refunds. Kidding!'],
  name: ['A star needs a name on the door!', 'Ooh, that name looks great in lights.'],
  idle: ['Take your time. Not too much time.', "The curtain's waiting, darling.", 'Hold still, you have menu on your face.'],
};
const said = {};
function line(kind) {
  const pool = SAYS[kind] ?? SAYS.idle;
  const options = pool.length > 1 ? pool.filter((l) => l !== said[kind]) : pool;
  const l = options[Math.floor(Math.random() * options.length)];
  said[kind] = l;
  return l;
}

// Lulu's speech bubble, the words typed out.
function bubble(ctx, x, y, words, chars) {
  ctx.font = font(9, true);
  const w = Math.min(124, ctx.measureText(words).width + 18);
  const rows = [];
  let cur = '';
  for (const word of words.split(' ')) {
    const t = cur ? `${cur} ${word}` : word;
    if (ctx.measureText(t).width > w - 16 && cur) {
      rows.push(cur);
      cur = word;
    } else cur = t;
  }
  rows.push(cur);
  const h = rows.length * 12 + 10;
  const by = y - h;
  ctx.fillStyle = 'rgba(40,20,60,0.25)';
  roundRect(ctx, x + 2, by + 3, w, h, 9);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#5a3f7a';
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, by, w, h, 9);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 10, by + h - 1);
  ctx.lineTo(x + 14, by + h + 8);
  ctx.lineTo(x + 20, by + h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 10, by + h);
  ctx.lineTo(x + 14, by + h + 8);
  ctx.lineTo(x + 20, by + h);
  ctx.stroke();
  let left = chars;
  rows.forEach((r, i) => {
    text(ctx, r.slice(0, Math.max(0, left)), x + 8, by + 15 + i * 12, { size: 9, bold: true, color: '#4a3560' });
    left -= r.length + 1;
  });
}

// The fitting turntable: a round wooden platform ringed with bulbs, its boards turning slowly.
function turntable(ctx, time) {
  const rx = 84;
  const ry = 16;
  ctx.fillStyle = '#5a3424';
  ctx.beginPath();
  ctx.ellipse(CX, FLOOR + 8, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(CX - rx, FLOOR, rx * 2, 8);
  ctx.fillStyle = '#c8945a';
  ctx.beginPath();
  ctx.ellipse(CX, FLOOR, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(CX, FLOOR, rx, ry, 0, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(120,70,40,0.35)';
  ctx.lineWidth = 1;
  for (let k = 0; k < 10; k++) {
    const a = time * 0.3 + (k * Math.PI) / 5;
    ctx.beginPath();
    ctx.moveTo(CX, FLOOR);
    ctx.lineTo(CX + Math.cos(a) * rx, FLOOR + Math.sin(a) * ry);
    ctx.stroke();
  }
  ctx.restore();
  for (let k = 0; k < 14; k++) {
    const a = Math.PI * (0.04 + (k / 13) * 0.92);
    const x = CX - Math.cos(a) * (rx - 2);
    const y = FLOOR + 4 + Math.sin(a) * (ry - 1);
    const on = (Math.floor(time * 5) + k) % 3 !== 0;
    ctx.fillStyle = on ? '#fff3c0' : '#c8a060';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The star plate over the hero, on two ropes, with the name typed in (or a blank waiting for one).
function plate(ctx, name, time) {
  const sway = Math.sin(time * 1.3) * 0.03;
  ctx.save();
  ctx.translate(CX, 74);
  ctx.rotate(sway);
  ctx.strokeStyle = '#c8a878';
  ctx.lineWidth = 1.2;
  for (const dx of [-40, 40]) {
    ctx.beginPath();
    ctx.moveTo(dx, -74 + 22);
    ctx.lineTo(dx, -8);
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd66b';
  ctx.strokeStyle = '#8a5a3a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let k = 0; k < 10; k++) {
    const r = k % 2 ? 8 : 17;
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    ctx.lineTo(Math.cos(a) * r, -10 + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const shown = name || 'Your name here';
  ctx.font = font(11, true);
  const w = Math.max(90, ctx.measureText(shown).width + 24);
  ctx.fillStyle = '#d83a5a';
  roundRect(ctx, -w / 2, 4, w, 20, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, shown, 0, 18, { size: 11, bold: true, align: 'center', color: name ? '#ffffff' : 'rgba(255,255,255,0.6)' });
  ctx.restore();
}

// The wardrobe cabinet the looks are picked from: a wooden frame with brass knobs, a sign on top
// and a cream inside.
function cabinet(ctx, x, y, w, h, time) {
  ctx.fillStyle = 'rgba(20,8,30,0.35)';
  roundRect(ctx, x + 3, y + 5, w, h, 12);
  ctx.fill();
  ctx.fillStyle = '#8a5a3a';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
  ctx.fillStyle = '#a8714a';
  roundRect(ctx, x + 3, y + 3, w - 6, h - 6, 10);
  ctx.fill();
  for (const [kx, ky] of [[x + 8, y + 8], [x + w - 8, y + 8], [x + 8, y + h - 8], [x + w - 8, y + h - 8]]) {
    ctx.fillStyle = '#ffd66b';
    ctx.beginPath();
    ctx.arc(kx, ky, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // The sign, swinging a touch on its chains.
  const sw = Math.sin(time * 1.5) * 0.02;
  ctx.save();
  ctx.translate(x + w / 2, y - 2);
  ctx.rotate(sw);
  ctx.fillStyle = '#d83a5a';
  roundRect(ctx, -78, -14, 156, 20, 10);
  ctx.fill();
  ctx.strokeStyle = '#ffd66b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  text(ctx, 'COSTUME DEPARTMENT', 0, 0, { size: 9, bold: true, align: 'center', color: '#ffffff' });
  ctx.restore();
  box(ctx, x + 10, y + 12, w - 20, h - 22, { fill: '#fffaf6', edge: '#e8c8a8', r: 8, width: 1.5 });
}

// Edits `draft` ({ name, look, tab, pose, facing, history }) in place. Returns 'start', 'back',
// or null.
export function creatorScreen(ui, time, draft) {
  const { ctx } = ui;
  ui.theme = THEMES.pink;
  draft.tab ??= 0;
  draft.pose ??= 0;
  draft.facing ??= 1;
  draft.history ??= [];
  draft.lulu ??= { line: "Welcome to costumes! Let's make you a star.", at: time, last: time };
  const lulu = draft.lulu;
  const react = (kind) => {
    if (time - lulu.at < 1.2 && kind !== 'random' && kind !== 'undo') return;
    Object.assign(lulu, { line: line(kind), at: time, last: time });
  };
  const remember = (look, kind) => {
    if (look === draft.look) return;
    draft.history.push(draft.look);
    if (draft.history.length > 40) draft.history.shift();
    const changed = Object.keys(look).find((k) => look[k] !== draft.look[k]);
    draft.look = look;
    react(kind ?? changed);
  };
  backstage(ctx, time);

  // The fitting: a spotlight on the turntable, the hero on it, the star plate above.
  const beam = ctx.createLinearGradient(0, 0, 0, FLOOR);
  beam.addColorStop(0, 'rgba(255,244,210,0.03)');
  beam.addColorStop(1, 'rgba(255,244,210,0.18)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(CX - 10, 0);
  ctx.lineTo(CX + 10, 0);
  ctx.lineTo(CX + 86, FLOOR);
  ctx.lineTo(CX - 86, FLOOR);
  ctx.fill();
  turntable(ctx, time);
  plate(ctx, draft.name, time);
  const pose = POSES[draft.pose];
  const cheer = pose === 'Cheer' ? (time % (POSE_DUR + 0.6)) / POSE_DUR : 2;
  const state = pose === 'Walk' ? { pose: 'walk' } : pose === 'Back' ? { pose: 'climb' } : cheer <= 1 ? { pose: 'cheer', progress: cheer, dur: POSE_DUR } : { pose: 'idle' };
  withZoom(3, () => drawHero(ctx, draft.look, null, CX, FLOOR, { ...state, time, facing: draft.facing, scale: 3, seed: 1 }));
  // Lulu by the turntable, with her opinion.
  if (time - lulu.last > 9) Object.assign(lulu, { line: line('idle'), at: time, last: time });
  const talking = (time - lulu.at) * 30 < lulu.line.length;
  withZoom(2, () => drawHero(ctx, NPCS.lulu.look, castGear('lulu'), 40, FLOOR + 12, { pose: 'idle', time, seed: 4, scale: 1.7, facing: 1, talking }));
  bubble(ctx, 16, 216, lulu.line, Math.floor((time - lulu.at) * 30));

  // Under the stage: the poses and a turn.
  draft.pose = tabs(ui, 30, 326, POSES, draft.pose, { w: 44, h: 15 });
  if (button(ui, 214, 325, 44, 17, 'Turn', { size: 8 })) draft.facing = -draft.facing;

  // The wardrobe cabinet: tabs over the look picker, then the name, then the buttons.
  const PX = 296;
  const PY = 28;
  const PW = 330;
  const PH = 326;
  cabinet(ctx, PX, PY, PW, PH, time);
  const IX = PX + 10;
  const IW = PW - 20;
  const tabNames = LOOK_TABS.map((t) => t.label);
  draft.tab = tabs(ui, IX + (IW - tabNames.length * 58) / 2, PY + 18, tabNames, draft.tab, { w: 56, h: 17 });
  const cell = [21, 30, 27, 24, 40][draft.tab];
  const picked = lookRows(ui, draft.look, draft.tab, IX + 10, PY + 40, IW - 20, { cell, time });
  remember(picked.look);

  // The name for the door: a field with a blinking caret.
  const NY = PY + PH - 62;
  if (PY + 40 + picked.h < NY - 26) wrap(ctx, "Gear you equip covers your outfit. Restyle any time at Lulu's salon in Sprout Village.", IX + 12, NY - 24, IW - 24, { size: 7, color: COLORS.muted });
  ctx.strokeStyle = '#e8c8a8';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(IX + 10, NY - 6);
  ctx.lineTo(IX + IW - 10, NY - 6);
  ctx.stroke();
  const had = draft.name;
  for (const ch of ui.input.typed) {
    if (ch === '\b') draft.name = draft.name.slice(0, -1);
    else if (/^[\w '-]$/.test(ch) && draft.name.length < 12 && !(ch === ' ' && !draft.name)) draft.name += ch;
  }
  if (!had && draft.name) react('name');
  text(ctx, 'Name', IX + 12, NY + 11, { size: 9, bold: true });
  box(ctx, IX + 46, NY, IW - 58, 17, { fill: '#ffffff', edge: COLORS.accent, r: 8.5 });
  const caret = Math.floor(time * 2) % 2 ? '|' : '';
  if (draft.name) text(ctx, `${draft.name}${caret}`, IX + 52, NY + 12, { size: 9, bold: true });
  else text(ctx, `${caret}Type a name`, IX + 52, NY + 12, { size: 9, color: COLORS.muted });
  text(ctx, `${draft.name.length}/12`, IX + IW - 16, NY + 12, { size: 7, align: 'right', color: COLORS.muted });

  const BY = PY + PH - 36;
  if (button(ui, IX + 10, BY, 84, 22, 'Surprise me', { size: 8.5, iconName: 'star' })) remember(randomLook(), 'random');
  if (button(ui, IX + 98, BY, 46, 22, 'Undo', { size: 8.5, enabled: draft.history.length > 0 })) {
    draft.look = draft.history.pop();
    react('undo');
  }
  // Start on Dawnlight Isle (the tutorial) or skip straight to Sprout Village.
  draft.tutorial ??= true;
  text(ctx, 'Tutorial', IX + 150, BY + 14.5, { size: 8, bold: true, color: draft.tutorial ? COLORS.ink : COLORS.muted });
  draft.tutorial = toggle(ui, IX + 190, BY + 4.5, draft.tutorial);
  if (hover(ui, IX + 146, BY, 72, 22)) tooltip(ui, [{ text: draft.tutorial ? 'Start on Dawnlight Isle' : 'Skip the tutorial', bold: true }, { text: draft.tutorial ? 'A short island that shows you the ropes, then a boat to Sprout Village.' : 'Start right in Sprout Village.', size: 8, color: COLORS.muted }]);
  if (button(ui, 8, 8, 100, 18, '< Dressing rooms', { size: 8 }) || ui.input.pressed.has('Escape')) return 'back';
  const ok = draft.name.trim().length > 0;
  if (!ok && hover(ui, IX + IW - 86, BY, 76, 22)) tooltip(ui, [{ text: 'Every star needs a name first', bold: true }]);
  return button(ui, IX + IW - 86, BY, 76, 22, 'Curtain up!', { primary: true, enabled: ok, size: 9.5 }) || (ok && ui.input.pressed.has('Enter')) ? 'start' : null;
}
