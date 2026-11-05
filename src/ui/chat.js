// Chat: press Enter to type, Enter again to send (Esc cancels). Messages go to the log and pop up
// as a speech bubble over your head. Emoticons make your face act them out for a few seconds, NPCs
// chat now and then, and NPCs nearby say hi back.

import { NPCS } from '../data/npcs.js';
import { FACE_STYLES } from '../render/hero.js';
import { COLORS, text, font, clicked, paper, tape, roughRect } from './kit.js';
import { isGm, unlockGm, gmCommand } from '../world/gm.js';
import { partySay, hasParty } from '../world/grouping.js';

const MAX_LEN = 70;
const BUBBLE_TIME = 4.5;
const EMOTE_TIME = 4;
const CHAT_COLOR = '#ffffff';

// Emoticons and words that set a face, checked in order (longer ones first).
const EMOTICONS = [
  ['>:(', 'angry'], ['>:c', 'angry'], ['>_<', 'angry'], [':D', 'excited'], ['xD', 'excited'], ['XD', 'excited'], [':O', 'excited'], [':o', 'excited'],
  [';)', 'sassy'], [':P', 'sassy'], [':p', 'sassy'], [':3', 'cat'], ['uwu', 'cat'], ['owo', 'cat'], ['<3', 'shy'], [':$', 'shy'],
  [':(', 'pout'], [':c', 'pout'], ['B)', 'cool'], ['-_-', 'cool'], ['>_>', 'smug'], ['hehe', 'smug'], ['^^', 'grin'], ['^_^', 'grin'], [':)', 'grin'], ['lol', 'grin'],
];

const HELLO = /\b(hi|hey|hello|hiya|yo|howdy|sup|heya)\b/i;
const NPC_HELLOS = ['Hi, {name}!', 'Hey there, {name}!', 'Oh! Hello, {name}~', 'Heya, {name}!', '{name}! Good to see you!'];

// Things NPCs say on their own, by role, plus a few for everyone.
const CHATTER = {
  guide: ['Need directions? Press M for the map!', 'The meadow is lovely this time of day.', 'Remember to stock up on tonics!'],
  shop: ['Fresh stock today!', 'Everything must go! Well, most things.', 'Ooh, a customer?'],
  stylist: ['That outfit is SO you.', 'Have you tried a new hairstyle?', 'Fashion is a battle, too!'],
  instructor: ['Training never ends!', 'Ready for your next step?', 'Show me what you have learned.'],
  any: ['La la la~', '*yawn*', 'What a nice day!', 'Hmm hmm~', 'I wonder what is for dinner...'],
};

export function createChat() {
  return { typing: null, history: [] };
}

function bubbles(world) {
  world.bubbles ??= {};
  return world.bubbles;
}

// Shows a speech bubble over the player ('player') or an NPC (by id).
export function say(world, who, words) {
  bubbles(world)[who] = { text: words, t: BUBBLE_TIME };
}

function emoteOf(words) {
  for (const [token, face] of EMOTICONS) if (words.includes(token)) return face;
  return null;
}

function send(chat, world, words) {
  const name = world.char.name;
  if (words.startsWith('/')) {
    const [cmd, ...args] = words.slice(1).split(/\s+/);
    const arg = args[0];
    // The Game Master passphrase is checked privately and never echoed to the log.
    if (cmd === 'gm') {
      unlockGm(world.char, args.join(' ')).then((ok) => {
        world.log(ok ? 'Game Master unlocked! /gmhelp for commands, F9 for the admin menu.' : 'Unknown command. Try /help.', ok ? '#ffe36b' : '#ffb3c6');
        if (ok) world.events.push({ type: 'admin' });
      });
      return;
    }
    if (isGm(world.char)) {
      const line = gmCommand(world, cmd, args);
      if (line) {
        world.log(`[GM] ${line}`, '#ffe36b');
        return;
      }
    }
    // /p words: to your party only.
    if (cmd === 'p' && args.length) {
      partyLine(chat, world, args.join(' '));
      return;
    }
    if (cmd === 'help') {
      world.log('Chat: Enter to talk. Emoticons like :) :D ;) >:( :3 <3 B) change your face.', '#bff0dc');
      world.log('Party chat: Tab while typing (or /p words). V pings your party.', '#bff0dc');
      world.log(`/e <face> shows a face: ${FACE_STYLES.join(', ')}.`, '#bff0dc');
    } else if (cmd === 'e' && FACE_STYLES.includes(arg)) {
      world.emote = { face: arg, t: EMOTE_TIME };
    } else {
      world.log('Unknown command. Try /help.', '#ffb3c6');
    }
    return;
  }
  // A window with a chat of its own (trading) takes what's typed.
  if (chat.sendTo) {
    chat.sendTo(words);
    return;
  }
  if (chat.channel === 'party') {
    partyLine(chat, world, words);
    return;
  }
  world.log(`${name}: ${words}`, CHAT_COLOR);
  world.messages.at(-1).t = 14;
  say(world, 'player', words);
  // Friends in your online room hear it too, and the players around you (world/bots.js).
  world.net?.chat(words);
  world.heard = { words, at: world.now };
  const face = emoteOf(words);
  if (face) world.emote = { face, t: EMOTE_TIME };
  chat.history.push(words);
  // Say hi near an NPC and they wave back.
  if (HELLO.test(words)) {
    const near = world.map.npcs.filter((n) => Math.abs(n.x - world.body.x) < 140);
    for (const [i, n] of near.entries()) {
      const line = NPC_HELLOS[(n.x + chat.history.length + i) % NPC_HELLOS.length].replace('{name}', name);
      chat.pending ??= [];
      chat.pending.push({ who: n.id, text: line, at: 0.7 + i * 0.6 });
    }
  }
}

// A line to the party: only they hear it (no one else around answers).
function partyLine(chat, world, words) {
  if (!partySay(world, words)) return;
  world.messages.at(-1).t = 14;
  chat.history.push(words);
  const face = emoteOf(words);
  if (face) world.emote = { face, t: EMOTE_TIME };
}

// Handles typing while the chat bar is open. Returns true while it has the keyboard.
export function chatInput(chat, world, input) {
  if (chat.typing === null) {
    if (!input.pressed.has('Enter') && !input.pressed.has('NumpadEnter')) return false;
    // Letters typed in the same instant as Enter belong to the message, so keep them.
    chat.typing = '';
    input.pressed.delete('Enter');
    input.pressed.delete('NumpadEnter');
  }
  for (const ch of input.typed) {
    if (ch === '\b') chat.typing = chat.typing.slice(0, -1);
    else if (chat.typing.length < MAX_LEN) chat.typing += ch;
  }
  // Tab switches who hears you: everyone around, or just your party.
  if (input.pressed.has('Tab')) chat.channel = chat.channel === 'party' ? 'all' : 'party';
  if (input.pressed.has('Escape')) {
    chat.typing = null;
    input.pressed.delete('Escape');
  } else if (input.pressed.has('Enter') || input.pressed.has('NumpadEnter')) {
    const words = chat.typing.trim();
    chat.typing = null;
    if (words) send(chat, world, words);
  }
  // Typing never moves the character or opens windows.
  input.pressed.clear();
  input.held.clear();
  return true;
}

// Ages bubbles, the emote, delayed NPC replies, and NPCs' idle chatter.
export function updateChat(chat, world, dt) {
  for (const [k, b] of Object.entries(bubbles(world))) {
    b.t -= dt;
    if (b.t <= 0) delete world.bubbles[k];
  }
  if (world.emote) {
    world.emote.t -= dt;
    if (world.emote.t <= 0) world.emote = null;
  }
  if (chat.pending?.length) {
    for (const p of chat.pending) p.at -= dt;
    for (const p of chat.pending.filter((q) => q.at <= 0)) say(world, p.who, p.text);
    chat.pending = chat.pending.filter((q) => q.at > 0);
  }
  chat.chatter = (chat.chatter ?? 6) - dt;
  if (chat.chatter <= 0 && world.map.npcs.length) {
    chat.chatter = 18 + Math.random() * 14;
    const n = world.map.npcs[Math.floor(Math.random() * world.map.npcs.length)];
    if (!world.bubbles[n.id]) {
      const lines = [...(NPCS[n.id].chatter ?? CHATTER[NPCS[n.id].role] ?? []), ...CHATTER.any];
      say(world, n.id, lines[Math.floor(Math.random() * lines.length)]);
    }
  }
}

// The chat bar along the bottom of the message log while typing.
// The All and Party tabs sit on its right end: the Party tab shows the party's lines only, and
// what you type goes to them alone.
const PARTY_INK = '#2f9a68';
export function drawChatBar(ui, chat, world) {
  if (chat.typing === null || chat.sendTo) return;
  const { ctx } = ui;
  const y = 311;
  const party = chat.channel === 'party';
  const ink = party ? PARTY_INK : COLORS.accent;
  // (Scrapbook: a strip of lined paper you write on, taped down at its end, your name in ink.)
  paper(ctx, 4, y, 300, 15, { fill: party ? '#f0fff6' : '#fffbf2', edge: ink, r: 4, seed: 7, width: 1.4 });
  ctx.strokeStyle = party ? 'rgba(80,170,120,0.35)' : 'rgba(255,143,193,0.35)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(8, y + 12.5);
  ctx.lineTo(300, y + 12.5);
  ctx.stroke();
  tape(ctx, 302, y + 3, 16, 7, 0.6, party ? '#b8f0cc' : '#ffd6ea', { pattern: 'dots', alpha: 0.9 });
  const who = party ? `[Party] ${world.char.name}:` : `${world.char.name}:`;
  text(ctx, who, 10, y + 11, { size: 8, bold: true, color: ink });
  ctx.font = font(8, true);
  const nameW = ctx.measureText(who).width;
  const caret = Math.floor(world.now * 2) % 2 ? '|' : '';
  text(ctx, chat.typing + caret, 14 + nameW, y + 11, { size: 8, color: COLORS.ink });
  if (!chat.typing) text(ctx, party ? (hasParty(world) ? 'To your party... (Tab: everyone)' : 'No party yet (Tab: everyone)') : 'Say something... (Tab: party, /help)', 14 + nameW, y + 11, { size: 8, color: COLORS.muted });
  // The tabs, eased in: the picked one lifts a little.
  chat.tabEase = (chat.tabEase ?? 0) + ((party ? 1 : 0) - (chat.tabEase ?? 0)) * 0.25;
  const tabs = [['all', 'All', COLORS.accent], ['party', 'Party', PARTY_INK]];
  tabs.forEach(([id, label, c], i) => {
    const on = chat.channel === id || (id === 'all' && !party);
    const lift = (id === 'party' ? chat.tabEase : 1 - chat.tabEase) * 2;
    const tx = 308 + i * 38;
    // Index tabs on the strip's end: paper tabs, the picked one standing a little taller.
    const top = y + 1 - lift;
    ctx.beginPath();
    ctx.moveTo(tx, y + 14);
    ctx.lineTo(tx, top + 4);
    ctx.quadraticCurveTo(tx, top, tx + 4, top);
    ctx.lineTo(tx + 31, top);
    ctx.quadraticCurveTo(tx + 35, top, tx + 35, top + 4);
    ctx.lineTo(tx + 35, y + 14);
    ctx.closePath();
    ctx.fillStyle = on ? c : '#fffbf2';
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 1.1;
    ctx.stroke();
    text(ctx, label, tx + 17.5, y + 10.5 - lift, { size: 7.5, bold: true, align: 'center', color: on ? '#ffffff' : c, outline: on ? '#5a3f7a' : null });
    if (clicked(ui, tx, y, 35, 15)) chat.channel = id;
  });
}

// Speech bubbles are queued while the scene draws (you, NPCs, the crowd, your party) and laid out
// together at the end of the frame (flushBubbles), so bubbles from people standing close stack
// up instead of covering each other: the one nearest its speaker stays, the others move up, and
// their tails stretch down to whoever is talking.
const queued = [];

// Queues a rounded speech bubble with a little tail, centered over (x, y).
export function drawBubble(ctx, x, y, words, alpha = 1) {
  queued.push({ x, y, words, alpha });
}

export function flushBubbles(ctx, hide = false) {
  // (While a cutscene plays, the crowd's chatter stays out of the way: dropped, not drawn.)
  if (hide) queued.length = 0;
  if (!queued.length) return;
  ctx.save();
  ctx.font = font(8, true);
  // Wrap each to a comfortable width and keep it on screen.
  const list = queued.map((b) => {
    const lines = [];
    let line = '';
    for (const w of b.words.split(' ')) {
      const next = line ? `${line} ${w}` : w;
      if (ctx.measureText(next).width > 110 && line) {
        lines.push(line);
        line = w;
      } else line = next;
    }
    lines.push(line);
    const w = Math.min(124, Math.max(...lines.map((l) => ctx.measureText(l).width)) + 12);
    const h = lines.length * 10 + 6;
    return { ...b, lines, w, h, bx: Math.round(Math.max(4, Math.min(636 - w, b.x - w / 2))), by: Math.round(b.y - h - 5) };
  });
  queued.length = 0;
  // A crowd talking at once is capped: the same words twice show once, at most two bubbles over
  // people standing within a few steps of each other (the freshest), and five on screen, so a
  // party bunched round you never becomes a wall of bubbles.
  list.sort((a, b) => b.alpha - a.alpha || b.by - a.by);
  const kept = [];
  for (const b of list) {
    if (kept.length >= 5 || kept.some((o) => o.words === b.words)) continue;
    if (kept.filter((o) => Math.abs(o.x - b.x) < 40 && Math.abs(o.y - b.y) < 40).length >= 2) continue;
    kept.push(b);
  }
  // Lowest first; each later bubble moves up until it's clear of the ones already placed.
  kept.sort((a, b) => b.by - a.by);
  const placed = [];
  for (const b of kept) {
    for (let guard = 0; guard < 8; guard++) {
      const hit = placed.find((o) => b.bx < o.bx + o.w + 2 && o.bx < b.bx + b.w + 2 && b.by < o.by + o.h + 3 && o.by < b.by + b.h + 3);
      if (!hit) break;
      b.by = hit.by - b.h - 4;
    }
    placed.push(b);
  }
  for (const b of placed) paintBubble(ctx, b);
  ctx.restore();
}

// (Scrapbook: a speech bubble cut from paper by hand, pencilled round, lying a little lifted.)
function paintBubble(ctx, { x, y, lines, w, h, bx, by, alpha }) {
  ctx.globalAlpha = alpha;
  const seed = Math.round(w + h) % 29;
  // The tail reaches down to the speaker; a bubble that moved up gets a longer, slimmer one.
  const tip = Math.max(by + h + 5, y - 4);
  const half = tip - (by + h) > 8 ? 2.5 : 4;
  ctx.fillStyle = 'rgba(70,40,90,0.18)';
  roughRect(ctx, bx + 1.5, by + 2, w, h, 5, seed + 2, 0.45);
  ctx.fill();
  ctx.fillStyle = '#fffdf6';
  ctx.strokeStyle = '#8a6a9a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x - half, by + h - 1);
  ctx.quadraticCurveTo(x - 0.5, by + h + (tip - by - h) * 0.5, x + 0.5, tip);
  ctx.quadraticCurveTo(x + half * 0.3, by + h + 2, x + half, by + h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  roughRect(ctx, bx + 0.5, by + 0.5, w, h, 5, seed, 0.45);
  ctx.fill();
  ctx.stroke();
  // Cover the tail's seam with the bubble's own paper.
  ctx.fillRect(x - half + 1, by + h - 1.5, half * 2 - 2, 2.5);
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 11 + i * 10));
  ctx.textAlign = 'left';
}
