// Chat: press Enter to type, Enter again to send (Esc cancels). Messages go to the log and pop up
// as a speech bubble over your head. Emoticons make your face act them out for a few seconds, NPCs
// chat now and then, and NPCs nearby say hi back.

import { NPCS } from '../data/npcs.js';
import { FACE_STYLES } from '../render/hero.js';
import { COLORS, text, box, roundRect, font } from './kit.js';
import { isGm, unlockGm, gmCommand } from '../world/gm.js';

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
    if (cmd === 'help') {
      world.log('Chat: Enter to talk. Emoticons like :) :D ;) >:( :3 <3 B) change your face.', '#bff0dc');
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
export function drawChatBar(ui, chat, world) {
  if (chat.typing === null || chat.sendTo) return;
  const { ctx } = ui;
  const y = 311;
  box(ctx, 4, y, 300, 15, { fill: 'rgba(255,255,255,0.92)', edge: COLORS.accent, r: 6 });
  text(ctx, `${world.char.name}:`, 10, y + 11, { size: 8, bold: true, color: COLORS.accent });
  ctx.font = font(8, true);
  const nameW = ctx.measureText(`${world.char.name}:`).width;
  const caret = Math.floor(world.now * 2) % 2 ? '|' : '';
  text(ctx, chat.typing + caret, 14 + nameW, y + 11, { size: 8, color: COLORS.ink });
  if (!chat.typing) text(ctx, 'Say something... (Enter to send, Esc to cancel, /help)', 14 + nameW, y + 11, { size: 8, color: COLORS.muted });
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

export function flushBubbles(ctx) {
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
  // Lowest first; each later bubble moves up until it's clear of the ones already placed.
  list.sort((a, b) => b.by - a.by);
  const placed = [];
  for (const b of list) {
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

function paintBubble(ctx, { x, y, lines, w, h, bx, by, alpha }) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#c9a6ff';
  ctx.lineWidth = 1;
  // The tail reaches down to the speaker; a bubble that moved up gets a longer, slimmer one.
  const tip = Math.max(by + h + 5, y - 4);
  const half = tip - (by + h) > 8 ? 2.5 : 4;
  ctx.beginPath();
  ctx.moveTo(x - half, by + h - 1);
  ctx.lineTo(x, tip);
  ctx.lineTo(x + half, by + h - 1);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, bx + 0.5, by + 0.5, w, h, 6);
  ctx.fill();
  ctx.stroke();
  // Cover the tail's seam with the bubble's own white.
  ctx.fillRect(x - half + 1, by + h - 1.5, half * 2 - 2, 2.5);
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = 'center';
  lines.forEach((l, i) => ctx.fillText(l, bx + w / 2, by + 11 + i * 10));
  ctx.textAlign = 'left';
}
