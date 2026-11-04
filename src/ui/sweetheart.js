// Talking to a Sweetheart (world/sweethearts.js): their hearts over the dialogue, the choices
// (Chat, Give a gift, a date, and, between sweethearts, a gentle goodbye), and the gift page: your
// bag's giftable things, each with how they took it last time if you've tried it.

import { SWEETHEARTS, HEART, MAX_HEARTS, BOUQUET, RING } from '../data/sweethearts.js';
import { ITEMS } from '../data/items.js';
import { heartsOf, heartLevel, talkTo, giveGift, giftBlocker, isPartner, livesWith, breakUp, sceneId, markSeen, bringAlong, alongside } from '../world/sweethearts.js';
import { playScene } from '../world/story.js';
import { today } from '../core/quests.js';
import { drawItemIcon } from '../render/icons.js';
import { COLORS, text, box, hover, tooltip, button, wrap } from './kit.js';
import { say } from './chat.js';
import { sfx } from '../audio/sfx.js';

// A row of ten hearts: full, partly filled, empty. Gold when you're sweethearts.
export function drawHearts(ctx, x, y, pts, { partner = false, size = 4 } = {}) {
  for (let i = 0; i < MAX_HEARTS; i++) {
    const fill = Math.max(0, Math.min(1, pts / HEART - i));
    const cx = x + i * (size * 2.3);
    const heart = () => {
      ctx.beginPath();
      ctx.moveTo(cx, y + size * 0.9);
      ctx.bezierCurveTo(cx - size * 1.2, y, cx - size * 0.9, y - size * 0.9, cx, y - size * 0.25);
      ctx.bezierCurveTo(cx + size * 0.9, y - size * 0.9, cx + size * 1.2, y, cx, y + size * 0.9);
      ctx.closePath();
    };
    heart();
    ctx.fillStyle = '#f2e4ee';
    ctx.fill();
    if (fill > 0) {
      ctx.save();
      heart();
      ctx.clip();
      ctx.fillStyle = partner ? '#ffcf4a' : '#ff6b9a';
      ctx.fillRect(cx - size * 1.3, y - size, size * 2.6 * fill, size * 2);
      ctx.restore();
    }
    heart();
    ctx.strokeStyle = partner ? '#c8902a' : '#c84a7a';
    ctx.lineWidth = 0.7;
    ctx.stroke();
  }
}

// What they say when you walk up: a line for how close you are (no hearts for it: Chat gives those).
export function greetingFor(world, id) {
  const s = SWEETHEARTS[id];
  const char = world.char;
  const tier = livesWith(char, id) ? 5 : isPartner(char, id) ? 4 : Math.min(3, Math.floor(heartLevel(char, id) / 3));
  // Visiting them at home at night (world/goinghome.js), they've their own words for it.
  const late = world.map.id === `swh_${id}` && s.late;
  const lines = late ? [s.late[isPartner(char, id) ? 2 : heartLevel(char, id) >= 5 ? 1 : 0]] : s.talk[tier];
  return lines[(heartsOf(char, id).pts + today().length) % lines.length].replace(/\{name\}/g, char.name);
}

// After a chat or a gift: their words in the dialogue, a heart pop, and a heart scene if one's due.
function afterward(world, state, id, r) {
  const dlg = state.npc;
  dlg.words = r.line;
  dlg.page = null;
  if (r.gained > 0) world.fx.push({ kind: 'hearts', x: world.map.npcs.find((n) => n.id === id)?.x ?? world.body.x, y: world.body.y - 40, t: 0, dur: 1.2, n: r.gained >= 60 ? 5 : 3 });
  sfx(r.kind === 'dislike' ? 'cancel' : 'skillUp');
  if (r.scene?.lines) {
    markSeen(world.char, id, r.scene.at);
    state.npc = null;
    state.windows.npc.open = false;
    playScene(world, sceneId(id, r.scene.key));
  }
}

// The sweetheart's choices in the dialogue.
export function sweetheartChoices(world, state, npc) {
  const id = npc.id;
  const char = world.char;
  const h = heartsOf(char, id);
  const dlg = state.npc;
  const out = [];
  const talked = h.talked === today();
  out.push({ label: 'Chat', sub: talked ? 'You chatted today' : 'A little closer each day', icon: 'chat', primary: !talked, run: () => afterward(world, state, id, talkTo(world, id)) });
  const gifted = h.gifted === today();
  out.push({ label: 'Give a gift', sub: gifted ? 'One a day: come back tomorrow' : 'Something they love?', icon: 'gift', primary: !gifted, run: () => (dlg.gift = true) });
  if (heartLevel(char, id) >= 3) out.push({ label: 'Ask on a date', sub: `${SWEETHEARTS[id].name} loves a ${dateName(SWEETHEARTS[id].date)}`, icon: 'heart', run: () => (dlg.date = true) });
  if (isPartner(char, id)) {
    const with_ = alongside(world);
    out.push({ label: with_ ? 'Head home for now' : 'Come adventuring', sub: with_ ? 'They go back to waiting for you' : 'They join your party and fight beside you', icon: 'friends', run: () => {
      const why = bringAlong(world);
      if (why) world.log(why, '#ffb3c6');
      state.npc = null;
      state.windows.npc.open = false;
    } });
  }
  if (isPartner(char, id)) out.push({ label: livesWith(char, id) ? 'Move back to town' : 'Say goodbye', sub: 'Stop being sweethearts (you can make up)', icon: 'door', run: () => (dlg.breakup = true) });
  return out;
}
export const dateName = (kind) => ({ fish: 'fishing date', ride: 'ride together', stars: 'night of stargazing', cook: 'cooking date', dance: 'lantern dance' })[kind] ?? 'date';

// The hearts row over their dialogue.
export function drawSweetheartHeader(ui, world, npc, area) {
  const h = heartsOf(world.char, npc.id);
  drawHearts(ui.ctx, area.x + area.w - 92, area.y - 18, h.pts, { partner: isPartner(world.char, npc.id) });
  const tag = livesWith(world.char, npc.id) ? 'Living together' : isPartner(world.char, npc.id) ? 'Sweethearts' : heartLevel(world.char, npc.id) >= 8 ? 'Best friends' : heartLevel(world.char, npc.id) >= 4 ? 'Friends' : 'Getting to know';
  text(ui.ctx, tag, area.x + area.w - 98, area.y - 15.5, { size: 6.5, bold: true, align: 'right', color: '#c84a7a' });
}

// The gift page: what you have that you could give, how they took it before, and Give.
export function giftPage(ui, state, world, npc, area) {
  const { ctx } = ui;
  const dlg = state.npc;
  const char = world.char;
  const id = npc.id;
  const h = heartsOf(char, id);
  const { x: tx, w: tw } = area;
  const list = [...(char.inventory.etc ?? []), ...(char.inventory.use ?? [])].filter((e) => ITEMS[e.id] && !ITEMS[e.id].keep && !ITEMS[e.id].furniture);
  // The two special gifts first.
  list.sort((a, b) => ([BOUQUET, RING].includes(b.id) ? 1 : 0) - ([BOUQUET, RING].includes(a.id) ? 1 : 0));
  text(ctx, `A gift for ${npc.name}`, tx, area.y, { size: 9, bold: true });
  const size = 24;
  const cols = Math.floor(tw / (size + 4));
  dlg.giftScroll ??= 0;
  const rows = 3;
  const maxScroll = Math.max(0, Math.ceil(list.length / cols) - rows);
  if (hover(ui, tx, area.y + 8, tw, rows * (size + 4))) dlg.giftScroll = Math.max(0, Math.min(maxScroll, dlg.giftScroll + Math.sign(ui.mouse.wheel || 0)));
  list.slice(dlg.giftScroll * cols, (dlg.giftScroll + rows) * cols).forEach((e, i) => {
    const x = tx + (i % cols) * (size + 4);
    const y = area.y + 8 + Math.floor(i / cols) * (size + 4);
    const known = h.known?.[e.id];
    const special = e.id === BOUQUET || e.id === RING;
    box(ctx, x, y, size, size, { fill: special ? '#fff3c4' : '#ffffff', edge: known === 'love' ? '#ff6b9a' : known === 'dislike' ? '#b8a8c8' : '#eadcf3', r: 6, width: known === 'love' ? 2 : 1 });
    drawItemIcon(ctx, e.id, x + 4, y + 4, 1);
    if (known) text(ctx, { love: '♥', like: '☺', neutral: '·', dislike: '✗' }[known], x + size - 2, y + 8, { size: 7, bold: true, align: 'right', color: { love: '#ff4f8a', like: '#3f9f5f', neutral: COLORS.muted, dislike: '#8a7aa8' }[known] });
    if (hover(ui, x, y, size, size)) {
      const why = giftBlocker(char, id, e.id);
      tooltip(ui, [{ text: ITEMS[e.id].name, bold: true }, ...(known ? [{ text: { love: 'They loved it!', like: 'They liked it.', neutral: 'They were polite about it.', dislike: "They didn't like it." }[known], size: 7 }] : []), ...(why ? [{ text: why, size: 7, color: COLORS.bad }] : [{ text: 'Click to give', size: 7, color: COLORS.muted }])]);
      if (ui.mouse.clicked) {
        ui.mouse.clicked = false;
        const r = giveGift(world, id, e.id);
        if (r.why) {
          world.log(r.why, '#ffb3c6');
          sfx('denied');
        } else {
          dlg.gift = false;
          if (r.kind === 'bouquet') world.log(`You and ${npc.name} are sweethearts now!`, '#ff8fc4');
          if (r.kind === 'ring') world.log(`${npc.name} is moving in with you! They'll be on your island from now on.`, '#ff8fc4');
          afterward(world, state, id, r);
        }
      }
    }
  });
  if (!list.length) wrap(ctx, 'Nothing to give yet. Fish, gather, cook or craft something!', tx, area.y + 24, tw, { size: 8, color: COLORS.muted });
  if (button(ui, tx + tw - 74, area.bottom - 16, 74, 17, 'Back')) dlg.gift = false;
}

// "Are you sure?" before a goodbye.
export function breakupPage(ui, state, world, npc, area) {
  const dlg = state.npc;
  wrap(ui.ctx, livesWith(world.char, npc.id) ? `${npc.name} would move back to town. You'd stop being sweethearts, but you can make up later with another bouquet.` : `Stop being sweethearts with ${npc.name}? You can make up later with another bouquet.`, area.x, area.y + 4, area.w, { size: 8, lineHeight: 11 });
  if (button(ui, area.x + area.w - 154, area.bottom - 16, 74, 17, 'Yes, goodbye', { size: 7 })) {
    breakUp(world, npc.id);
    dlg.breakup = false;
    dlg.words = "Oh... okay. I understand. I'll still be here, you know. Always.";
    dlg.page = null;
    say(world, npc.id, 'Take care of yourself, okay?');
  }
  if (button(ui, area.x + area.w - 74, area.bottom - 16, 74, 17, 'No, stay', { primary: true })) dlg.breakup = false;
}
