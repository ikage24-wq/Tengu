// Talking to an adventurer of the guild (click one): the scrapbook talk box like the townsfolk's,
// their photo, their words typed out, and what you can say:
//   Chat                whatever's on their mind (talk.js picks it from their real state)
//   What are you up to? what they're doing and working toward
//   What's new?         what happened to them lately, or what they've heard
//   Come along?         asks them into your party: a real yes or no (and why)
//   (in your party)     That's all for today: they head off
//   Goodbye
// Every talk is remembered (world/adventurers/sim.js youDid 'talk'): meeting them, warming to you.
import { ADVENTURER_BY_ID } from '../data/adventurers.js';
import { JOBS } from '../data/jobs.js';
import { wornGear } from '../core/character.js';
import { lineFor } from '../world/adventurers/talk.js';
import { youDid } from '../world/adventurers/sim.js';
import { nowHours } from '../world/adventurers/bodies.js';
import { joinParty, dismiss, partyMembers, PARTY_MAX } from '../world/party.js';
import { dialogFrame, typed, choice, pressedNumber } from './npc.js';
import { wrap, sparkle } from './kit.js';

const RANK = { veteran: { role: 'instructor', title: 'Guild Veteran' }, peer: { role: 'guide', title: 'Adventurer' }, rookie: { role: 'shop', title: 'Guild Rookie' } };

export function openAdvTalk(state, world, bot) {
  state.npc = { adv: bot.adv, bot: bot.id };
  state.windows.npc.open = true;
}

export function advTalkWindow(ui, state, world) {
  const dlg = state.npc;
  const win = state.windows.npc;
  const g = world.guild;
  const bot = world.bots?.list.find((b) => b.id === dlg.bot);
  const s = g?.adv[dlg.adv];
  if (!g || !s || !bot || bot.gone) {
    state.npc = null;
    win.open = false;
    return;
  }
  const def = ADVENTURER_BY_ID[s.id];
  const now = nowHours(world.bots);
  const say = (opts = {}) => {
    dlg.words = lineFor(g, s.id, now, { youName: world.char.name, ...opts })?.text ?? '...';
    dlg.n = (dlg.n ?? 0) + 1;
  };
  // (opening it: they say what's on their mind, and you've talked)
  if (dlg.words == null) {
    say();
    youDid(g, 'talk', { id: s.id }, now);
    bot.facing = world.body.x < (bot.body?.x ?? bot.x) ? -1 : 1;
  }
  const asleep = s.act.kind === 'sleep';
  const choices = [];
  if (!asleep) {
    choices.push({ label: 'Chat', sub: 'Whatever is on their mind', icon: 'chat', run: () => say() });
    choices.push({ label: 'What are you up to?', sub: 'What they are doing and working toward', icon: 'star', run: () => say({ topic: 'doing' }) });
    choices.push({ label: "What's new?", sub: 'What happened lately, or what they heard', icon: 'book', run: () => say({ topic: 'news' }) });
    if (bot.party) {
      choices.push({ label: "That's all for today", sub: 'They leave your party', icon: 'door', run: () => {
        dismiss(world.bots, bot, world, { quiet: true });
        dlg.words = lineFor(g, s.id, now, { youName: world.char.name, aloud: false })?.text ?? 'See you!';
      } });
    } else {
      const full = partyMembers(world.bots).length >= PARTY_MAX;
      choices.push({ label: 'Come along?', sub: full ? 'Your party is full' : 'Ask them into your party', icon: 'heart', primary: !full, run: () => {
        if (full) return;
        const r = world.bots.advAnswer(bot);
        dlg.words = r.line ?? (r.yes ? 'Okay!' : 'Not now.');
        if (r.yes) {
          joinParty(world.bots, bot, world);
          world.log(`${def.name} joined your party!`, '#bff0dc');
        }
      } });
    }
  }
  choices.push({ label: 'Goodbye', sub: null, icon: 'door', run: () => (dlg.bye = true) });
  const rows = Math.ceil(choices.length / 2);
  const rank = RANK[def.rank];
  const npc = { name: def.name, title: `${rank.title} · Lv ${s.level} ${JOBS[s.job]?.name ?? s.job}`, role: rank.role, look: bot.char.appearance, gear: wornGear(bot.char), showJob: s.job };
  const H = Math.max(100, 50 + rows * 24);
  const area = dialogFrame(ui, win, npc, H, world, dlg.talking);
  if (!area || dlg.bye) {
    state.npc = null;
    win.open = false;
    return;
  }
  const { ctx } = ui;
  const { x: tx, w: tw, theme: th } = area;
  const key = pressedNumber(ui);
  const words = dlg.words;
  const chars = typed(ui, dlg, `adv:${s.id}:${dlg.n}`, world, area, words);
  const end = wrap(ctx, words, tx, area.y + 2, tw, { size: 8.5, chars, lineHeight: 11.5 });
  if (chars >= words.length) sparkle(ctx, tx + tw - 4, end - 10 + Math.sin(world.now * 6) * 1.5, 2.5, th.main);
  const colW = (tw - 6) / 2;
  choices.forEach((c, i) => {
    const bx = tx + (i % 2) * (colW + 6);
    const by = area.bottom - rows * 24 + Math.floor(i / 2) * 24 + 2;
    if (choice(ui, bx, by, colW, c, i + 1, th, key)) c.run();
  });
}
