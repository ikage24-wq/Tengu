// NPC conversations: quests, shops, the stylist, and job advancement. Also the "fainted" dialog.

import { NPCS } from '../data/npcs.js';
import { sfx } from '../audio/sfx.js';
import { MOUNTS } from '../data/mounts.js';
import { HOME_STAGES } from '../data/home.js';
import { nextStageNeeds, buildNext } from '../world/home.js';
import { QUESTS } from '../data/quests.js';
import { ITEMS } from '../data/items.js';
import { MOBS } from '../data/mobs.js';
import { JOBS, nextJobs, FAMILY_STATS } from '../data/jobs.js';
import { questState, acceptQuest, completeQuest, objectiveProgress, objectiveText, rewardId, objectiveHint, waitingToTalk, today } from '../core/quests.js';
import { advanceJob, wornGear, giveStarterWeapon } from '../core/character.js';
import { deathExpLoss } from '../core/formulas.js';
import { respawn, loadMap } from '../world/world.js';
import { playScene } from '../world/story.js';
import { SCENES } from '../data/story.js';
import { DUNGEONS, ROLES } from '../data/dungeons.js';
import { planGroup, startRun, leaveDungeon, clock, hardBlocker } from '../world/dungeon.js';
import { boardPage } from './partyboard.js';
import { fishRequestPage } from './fishreq.js';
import { bountyPage } from './bounty.js';
import { repPage } from './rep.js';
import { nightPage } from './nightmarket.js';
import { cardsPage } from './cards.js';
import { roundsLeft } from '../world/cards.js';
import { repTier, stallSize } from '../world/rep.js';
import { bountyBoard } from '../world/bounties.js';
import { checkIn, rumor, ROOM_GOLD } from '../world/inn.js';
import { fishRequests, requestProgress } from '../world/fishrequests.js';
import { say } from './chat.js';
import { sweetheartChoices, drawSweetheartHeader, giftPage, breakupPage, greetingFor } from './sweetheart.js';
import { datePage } from './dates.js';
import { boardOffers } from '../world/partyquest.js';
import { drawHero } from '../render/hero.js';
import { withZoom } from '../render/pixel.js';
import { lookRows, sameLook, fullLook, LOOK_TABS } from './looks.js';
import { COLORS, THEMES, windowFrame, button, tabs, text, box, hover, clicked, tooltip, wrap, icon, sparkle, roundRect, font, fit, itemSlot, paper, tape, doodle, sticker, roughRect } from './kit.js';
import { itemTooltip } from './tooltips.js';
import { questAccepted, questCompleted, thanksFor } from './questfx.js';
import { shopWindow } from './shop.js';
import { dressShopWindow } from './mochi-dress-shop.js';
import { isNight } from '../world/daytime.js';
import { countItem, removeItem } from '../core/inventory.js';
import { sendGardenPresent } from '../net/visit.js';
import { MOCHI_SWEETS } from '../data/mochi-raise.js';
import { dailyGoals, dailyLine, DAILY_KINDS, DAILY_PAY } from '../world/garden-life.js';

// Kinako's tips for a new gardener, one each time you ask "How do I start?".
const KINAKO_HELP = [
  "First, the eggs by my neighbour's stall: stand by one and press Up to rock it. Out pops a Mochiko!",
  "A new Mochiko can only crawl. Feed it two Kinako Mochi (stand by it, Up, then pick the sweet) and it'll be walking!",
  "Sweets come from the Sweet Kitchen. The crop bed in the orchard gives rice, beans and kinako; shake the fruit trees for cherries.",
  "A Mochi's tummy holds about four sweets an hour. Sweets raise its stats; petting and play make it happy.",
  "Race your Mochi from my counter! The Hatchling races are for little ones, and everybody gets a little something.",
  "Short of gold? I'll buy your crops, cherries and sweets. And after dark... come and see my secret stall!",
];
import { storageWindow } from './storage.js';
import { polishWindow } from './polish.js';
import { canCurse, curseOfDay, layCurse } from '../world/malvina.js';
import { teamOf } from '../world/teamwork.js';
import { routeFrom, setSail, hasSailed } from '../world/voyage.js';
import { derbyClock, standings, PRIZES } from '../world/derby.js';

export function questMarker(char, npcId) {
  const ids = NPCS[npcId].quests ?? [];
  // Someone you've been sent to talk to (or bring something to) waits with a "?" too.
  if (ids.some((id) => questState(char, id) === 'ready') || waitingToTalk(char, npcId)) return '?';
  // The next step of the story shows a star.
  if (ids.some((id) => QUESTS[id].story && questState(char, id) === 'available')) return '★';
  if (ids.some((id) => questState(char, id) === 'available')) return '!';
  return null;
}


// ---------- Dialog ----------

// Each NPC role gets its own color.
const ROLE_THEME = { guide: 'mint', shop: 'peach', stylist: 'pink', instructor: 'lavender', dungeon: 'mint', board: 'pink' };

// A visual-novel style dialog box along the bottom of the screen: the NPC stands large at the
// left, their name on a ribbon, and their words type out. Returns the text area, or null if the
// player closed it.
function dialogFrame(ui, win, npc, H, world, talking = false) {
  const { ctx } = ui;
  const th = THEMES[ROLE_THEME[npc.role] ?? 'pink'];
  const W = 440;
  const x = (640 - W) / 2;
  const y = 322 - H;
  Object.assign(win, { x, y, w: W, h: H });
  ui.theme = th;
  // (Scrapbook: a page of the hero's scrapbook, ruled, with the speaker's photo stuck on at the
  // left, peeking out over the top, and their name on a strip of washi tape.)
  paper(ctx, x, y, W, H, { fill: '#fffbf2', edge: th.ink, r: 7, seed: 23, width: 1.8 });
  ctx.save();
  roughRect(ctx, x, y, W, H, 7, 23, 0.6);
  ctx.clip();
  ctx.strokeStyle = th.light;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 0.8;
  for (let ly = y + 30; ly < y + H - 4; ly += 12) {
    ctx.beginPath();
    ctx.moveTo(x + 100, ly);
    ctx.lineTo(x + W - 4, ly);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // The speaker's photo: a white print taped at a tilt, the NPC drawn big, peeking over the top.
  const px = x + 52;
  ctx.save();
  ctx.translate(px, y + H / 2 + 4);
  ctx.rotate(-0.04);
  ctx.fillStyle = 'rgba(70,40,90,0.2)';
  ctx.fillRect(-40, -H / 2 + 6, 82, H - 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-42, -H / 2 + 4, 82, H - 14);
  ctx.fillStyle = th.light;
  ctx.fillRect(-37, -H / 2 + 9, 72, H - 30);
  ctx.restore();
  tape(ctx, px - 34, y + 10, 22, 8, -0.6, th.main, { pattern: 'dots', alpha: 0.85 });
  ctx.save();
  roundRect(ctx, x - 40, y - 60, 140, H + 60 - 3, 10);
  ctx.clip();
  // (Rasterized at the portrait's own size, so the big figure stays smooth in HD.)
  withZoom(2, () => drawHero(ctx, npc.look, npc.gear ?? null, px, y + H - 8, { pose: 'idle', time: world.now, seed: 3, scale: 2, job: npc.showJob, talking }));
  ctx.restore();

  // The name on washi tape, the title written beside it.
  ctx.font = font(10, true);
  const nw = ctx.measureText(npc.name).width;
  ctx.font = font(7, true);
  const tw = ctx.measureText(npc.title).width;
  const rx = x + 104;
  tape(ctx, rx + (nw + tw + 30) / 2, y, nw + tw + 34, 17, -0.015, th.main, { pattern: 'stripes', alpha: 0.95 });
  text(ctx, npc.name, rx + 10, y + 4, { size: 10, bold: true, color: '#ffffff', outline: th.ink });
  text(ctx, npc.title, rx + 18 + nw, y + 3.5, { size: 7, bold: true, color: '#ffffff', outline: th.ink });
  doodle(ctx, 'heart', x + W - 14, y + H - 12, 3.4, th.main, world.now);

  // Close: a round sticker with a hand-drawn cross.
  const cx = x + W - 20;
  const cy = y + 6;
  const hot = hover(ui, cx, cy, 13, 13);
  sticker(ctx, cx + 6.5, cy + 6.5, 5.6, hot ? '#ff6b8a' : th.light, { edge: hot ? '#e04a6c' : th.dark });
  ctx.strokeStyle = hot ? '#ffffff' : th.ink;
  ctx.lineWidth = 1.7;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx + 4, cy + 4);
  ctx.lineTo(cx + 9, cy + 9);
  ctx.moveTo(cx + 9, cy + 4);
  ctx.lineTo(cx + 4, cy + 9);
  ctx.stroke();
  if (clicked(ui, cx, cy, 13, 13)) return null;
  return { x: x + 108, y: y + 22, w: W - 128, bottom: y + H - 10, theme: th };
}

// Typewriter text: how many characters of the current page show. Clicking the text finishes it.
// `text` is the page, so the NPC talks (mouth moving) only while words are still coming;
// Space finishes the page at once, like clicking it.
function typed(ui, dlg, page, world, area, text = '') {
  const len = text.length;
  if (dlg.page !== page) {
    dlg.page = page;
    dlg.typedAt = world.now;
  }
  if (clicked(ui, area.x, area.y - 10, area.w, 30) || ui.input.pressed?.has('Space')) dlg.typedAt = -1e9;
  const n = (world.now - dlg.typedAt) * 70;
  dlg.talking = n < len;
  // Their voice: a blip every other letter as the words type out (none on spaces), at their own
  // pitch, rising on the last words of a question and brighter on an exclamation.
  const said = Math.floor(Math.min(n, len) / 2);
  if (dlg.talking && said > (dlg.blips ?? -1)) {
    const i = said * 2;
    const ch = text[i] ?? '';
    const end = text.slice(i).search(/[.!?]/);
    const mark = end >= 0 ? text[i + end] : '';
    if (ch.trim()) sfx('blip', { ...voiceOf(dlg.id), ch, rise: mark === '?' && end < 8 ? 4 * (1 - end / 8) : 0, loud: mark === '!' && end < 8 });
  }
  dlg.blips = dlg.talking ? said : -1;
  return n;
}

// Each NPC's speaking voice: a base note and a timbre picked from their id, so everyone sounds
// their own (from a low G to a high E; soft triangle, bright pulse, or a raspy flipping pulse).
function voiceOf(id = '') {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { base: [67, 69, 72, 74, 76, 79, 81, 84, 88][h % 9], kind: ['tri', 'pulse', 'tri', 'rasp'][(h >> 4) % 4] };
}

// Number keys pick dialog choices (the world ignores them while a dialog is open).
const pressedNumber = (ui) => {
  for (let i = 1; i <= 9; i++) if (ui.input.pressed?.has(`Digit${i}`) || ui.input.pressed?.has(`Numpad${i}`)) return i;
  return 0;
};

// A dialog choice: a row with a badge on the left (a quest's state, or an icon), a label and a
// line under it, and its number key on the right. Returns true when picked.
function choice(ui, x, y, w, c, n, th, key) {
  const { ctx } = ui;
  const hot = hover(ui, x, y, w, 21);
  const down = hot && ui.mouse.down;
  const fill = c.primary ? (hot ? '#ffffff' : th.light) : hot ? '#ffffff' : '#fffdfb';
  box(ctx, x, y + (down ? 1 : 0), w, 21, { fill, edge: hot ? th.dark : c.primary ? th.main : th.light, r: 8, width: hot || c.primary ? 1.5 : 1 });
  const bx = x + 11;
  const by = y + 10.5 + (down ? 1 : 0);
  ctx.beginPath();
  ctx.arc(bx, by, 7, 0, Math.PI * 2);
  if (c.badge === 'ready') {
    ctx.fillStyle = COLORS.good;
    ctx.fill();
    icon(ctx, 'check', bx, by, 9, '#ffffff');
  } else if (c.badge === 'available') {
    ctx.fillStyle = COLORS.select;
    ctx.fill();
    text(ctx, '!', bx, by + 3.5, { size: 9, bold: true, align: 'center', color: '#ffffff', outline: '#c99a1f' });
  } else if (c.badge === 'active') {
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = th.main;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 5.4, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.05, c.progress ?? 0));
    ctx.stroke();
  } else {
    ctx.fillStyle = c.primary ? th.main : th.light;
    ctx.fill();
    icon(ctx, c.icon ?? 'chat', bx, by, 8.5, c.primary ? '#ffffff' : th.dark);
  }
  const lw = w - 38;
  text(ctx, fit(ctx, c.label, lw, 7.5), x + 22, by - 1, { size: 7.5, bold: true, color: c.badge === 'ready' ? '#2f8f52' : COLORS.ink });
  if (c.sub) text(ctx, fit(ctx, c.sub, lw, 6, false), x + 22, by + 6.5, { size: 6, color: c.badge === 'ready' ? COLORS.good : COLORS.muted, bold: c.badge === 'ready' });
  box(ctx, x + w - 13, y + 6 + (down ? 1 : 0), 9, 9, { fill: th.light, edge: null, r: 3 });
  text(ctx, `${n}`, x + w - 8.5, y + 13.2 + (down ? 1 : 0), { size: 6, bold: true, align: 'center', color: th.ink });
  return clicked(ui, x, y, w, 21) || key === n;
}

export function npcWindow(ui, state, world) {
  const dlg = state.npc;
  // The shop and the salon are bigger than the talk box, so each places itself when it opens.
  if (dlg.mode !== 'shop') dlg.placedShop = false;
  if (dlg.mode !== 'style') dlg.placed = false;
  if (dlg.mode === 'shop') return shopWindow(ui, state, world);
  if (dlg.mode === 'dress') return dressShopWindow(ui, state, world);
  if (dlg.mode === 'style') return styleWindow(ui, state, world);
  if (dlg.mode === 'polish') return polishWindow(ui, state, world);
  if (dlg.mode !== 'storage') dlg.placedStore = false;
  if (dlg.mode === 'storage') return storageWindow(ui, state, world);
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const char = world.char;
  const { ctx } = ui;
  const jobOptions = dlg.job ? nextJobs(char.job, char.level, char.quests).filter((j) => !npc.family || j.family === npc.family) : [];
  const questIds = (npc.quests ?? []).filter((id) => !['locked', 'done'].includes(questState(char, id)));

  // What you can say: each quest (new, in progress, or ready to hand in), the NPC's own service,
  // and goodbye.
  const choices = [];
  for (const id of questIds) {
    const st = questState(char, id);
    const objs = objectiveProgress(char, id);
    const progress = objs.length ? objs.reduce((n, o) => n + o.have / o.count, 0) / objs.length : 1;
    const sub = st === 'ready' ? 'Ready to hand in!' : st === 'available' ? `New quest · ${QUESTS[id].rewards.exp.toLocaleString()} EXP` : `In progress · ${Math.round(progress * 100)}%`;
    choices.push({ label: QUESTS[id].name, sub, badge: st, progress, primary: st !== 'active', run: () => (dlg.quest = id) });
  }
  // Two or more new quests here: take them all in one go (a story step, with its own scene, is
  // still taken on its own).
  const fresh = questIds.filter((id) => questState(char, id) === 'available' && !QUESTS[id].scenes?.accept);
  if (fresh.length > 1) {
    choices.unshift({ label: `Take all ${fresh.length} quests`, sub: fresh.map((id) => QUESTS[id].name).join(' · '), icon: 'scroll', primary: true, run: () => {
      const took = fresh.filter((id) => acceptQuest(char, id));
      for (const id of took) world.log(`Quest accepted: ${QUESTS[id].name}`, '#bff0dc');
      if (took.length) questAccepted(world, took);
    } });
  }
  if (npc.polish) choices.push({ label: 'Polish gear', sub: 'Make a favourite piece stronger, up to +10', icon: 'star', primary: true, run: () => (dlg.mode = 'polish') });
  if (npc.shop) choices.push({ label: 'Browse the shop', sub: `${(npc.shop?.length ?? 0) > 0 ? 'Buy and sell' : 'Sell'} · you have ${char.gold.toLocaleString()} gold`, icon: 'shop', run: () => (dlg.mode = 'shop') });
  // Malvina's daily curse (world/malvina.js): a blessing in a terrible name, once a day.
  if (npc.id === 'malvina' && char.quests?.malv_minion?.state === 'done') {
    const c = curseOfDay();
    choices.push(canCurse(char)
      ? { label: 'Curse me!', sub: `Today: ${c.name} · ${c.about}, 30 min`, icon: 'star', primary: true, run: () => {
        layCurse(char, world.now);
        world.log(`Cursed! ${c.name}: ${c.about} for 30 minutes.`, '#e0a0f0');
        world.fx.push({ kind: 'potion', x: world.body.x, y: world.body.y, t: 0, dur: 0.6, color: '#8a3aa8' });
        sfx('buff');
        say(world, 'malvina', c.line);
      } }
      : { label: 'Curse me again!', sub: 'One curse a day. Come back tomorrow.', icon: 'star', run: () => say(world, 'malvina', "Greedy! One curse a day, minion. Even EVIL has opening hours.") });
  }
  if (npc.storage) choices.push({ label: 'Storage', sub: npc.storage, icon: 'bag', run: () => (dlg.mode = 'storage') });
// Kinako, the Garden Keeper: the race board, her costumes, and after dark her secret stall.
  // (Visiting a friend's garden: leave them a present, an egg of yours or some sweets.)
  if (npc.role === 'mochikeeper' && world.gardenVisit) {
    const friend = world.gardenVisit.name ?? 'your friend';
    const mine = world.char.garden?.eggs ?? [];
    choices.push(mine.length
      ? { label: `Leave an egg for ${friend}`, sub: 'One of the eggs in your own garden', icon: 'gift', primary: true, run: () => {
        if (sendGardenPresent(world, { egg: mine[0] })) {
          mine.shift();
          say(world, 'kinako', `How kind! I'll set it by ${friend}'s stall.`);
        }
      } }
      : { label: `Leave an egg for ${friend}`, sub: 'You have no eggs waiting in your garden', icon: 'gift', run: () => say(world, 'kinako', 'Bring one from your own garden next time, dear.') });
    const sw = MOCHI_SWEETS.map((s) => ({ s, n: countItem(world.char.inventory, s.id) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)[0];
    choices.push(sw
      ? { label: `Leave ${Math.min(3, sw.n)} ${sw.s.name} for ${friend}`, sub: 'Sweets from your bag', icon: 'gift', run: () => {
        const n = Math.min(3, sw.n);
        if (sendGardenPresent(world, { sweet: sw.s.id, n })) {
          removeItem(world.char.inventory, sw.s.id, n);
          say(world, 'kinako', `I'll make sure ${friend} gets them!`);
        }
      } }
      : { label: `Leave sweets for ${friend}`, sub: 'No sweets in your bag', icon: 'gift', run: () => say(world, 'kinako', 'Cook some at the Sweet Kitchen first!') });
  }
  if (npc.role === 'mochikeeper' && !world.gardenVisit) {
    choices.unshift({ label: 'Enter a race', sub: 'Pick a course and one of your Mochi', icon: 'star', primary: true, run: () => {
      Object.assign(state.windows.race, { open: true, openedAt: performance.now() / 1000 });
      state.npc = null;
      state.windows.npc.open = false;
    } });
    choices.push({ label: 'Mochi outfits', sub: 'Glasses, scarves and cute clothes for your Mochi', icon: 'hanger', run: () => (dlg.mode = 'dress') });
    choices.push({ label: "Today's goals", sub: dailyLine(world.char) || 'Three small things to do each day', icon: 'check', run: () => {
      const d = dailyGoals(world.char);
      say(world, 'kinako', d ? `Today: ${d.goals.map((x) => `${DAILY_KINDS[x.kind].words(x.need)} (${x.have}/${x.need})`).join(', ')}. ${d.all ? 'All done, well done!' : `${DAILY_PAY.each} gold for each!`}` : 'Come by your garden first!');
    } });
    choices.push({ label: 'How do I start?', sub: 'Kinako tells you how to raise a Mochi', icon: 'chat', run: () => say(world, 'kinako', KINAKO_HELP[(dlg.help = ((dlg.help ?? -1) + 1) % KINAKO_HELP.length)]) });
    choices.push({ label: 'The Mochi album', sub: 'Everything your Mochi have been, and its rewards', icon: 'book', run: () => {
      Object.assign(state.windows.album, { open: true, openedAt: performance.now() / 1000 });
      state.npc = null;
      state.windows.npc.open = false;
    } });
    if (isNight(world)) choices.push({ label: 'The secret stall', sub: 'Only after dark: rare eggs and finds', icon: 'moon', primary: true, run: () => Object.assign(dlg, { mode: 'shop', secret: true }) });
    else choices.push({ label: 'The secret stall', sub: 'Shut. Come back after dark...', icon: 'moon', run: () => say(world, 'kinako', "Oh, that one's only open at night, dear. Come back when the lanterns are lit!") });
  }
  if (npc.role === 'stylist') choices.push({ label: 'A new look', sub: `${npc.styleCost} gold a visit`, icon: 'wand', primary: true, run: () => Object.assign(dlg, { mode: 'style', look: fullLook(char.appearance) }) });
  // A Sweetheart: Chat, a gift, a date (ui/sweetheart.js).
  if (npc.role === 'sweetheart') choices.push(...sweetheartChoices(world, state, npc));
  // Shelly builds your island up (world/home.js).
  if (npc.role === 'builder' && world.map.guestOf) {
    choices.push({ label: 'Lovely island!', sub: `This is ${world.map.guestOf.name}'s. I built it all!`, icon: 'heart', run: () => say(world, 'shelly', `Isn't it? ${world.map.guestOf.name} brings me the best bits. Come back any time!`) });
  } else if (npc.role === 'builder') {
    const n = nextStageNeeds(char);
    choices.push(n ? { label: `Build: ${n.def.name}`, sub: n.def.about, icon: 'hammer', primary: true, run: () => (dlg.build = true) } : { label: 'All built!', sub: 'Your island is finished. Make it yours!', icon: 'star', run: () => say(world, 'shelly', "It's perfect, isn't it? I might need a bigger shell...") });
  }
  // Clover the Puff Bun keeper: your mounts, in the Collection.
  if (npc.role === 'stable' && char.mounts?.length) {
    choices.push({ label: 'My mounts', sub: `${char.mounts.length} found · press H to ride`, icon: 'paw', run: () => {
      Object.assign(state.windows.collection, { open: true, tab: 2, scroll: 0 });
      state.npc = null;
      state.windows.npc.open = false;
    } });
  }
  // Tilly's card table (world/cards.js).
  if (npc.role === 'cards') choices.push({ label: 'Play Higher or Lower', sub: roundsLeft(world) > 0 ? `${roundsLeft(world)} rounds left today · small stakes` : 'No more rounds today', icon: 'star', primary: true, run: () => (dlg.cards = true) });
  // The Masked Moth's wares at the Night Market (world/nightmarket.js).
  if (npc.role === 'night') choices.push({ label: "Tonight's wares", sub: 'An oddity and three one-offs', icon: 'star', primary: true, run: () => (dlg.night = true) });
  // Penny's book: your Merchant Rep and your stall (world/rep.js).
  if (npc.role === 'trade') {
    const till = char.stall?.till ?? 0;
    choices.push({ label: 'Merchant Rep', sub: till ? `${till.toLocaleString()} gold in your stall's till!` : `${repTier(char).name}${stallSize(char) ? ' · your stall' : ''}`, icon: 'star', primary: true, run: () => (dlg.rep = true) });
  }
  // Guildmaster Halvard's bounty board (world/bounties.js).
  if (npc.role === 'guild') {
    const board = char.guild?.joined ? bountyBoard(world) : [];
    const slain = board.filter((b) => b.state === 'slain').length;
    choices.push({ label: char.guild?.joined ? 'The bounty board' : 'Join the guild', sub: slain ? `${slain} to hand in!` : char.guild?.joined ? 'Elites to hunt, ranks to earn' : 'Free, and you get a cape', icon: 'star', primary: true, run: () => (dlg.bounty = true) });
  }
  // Madame Ledger's Auction House (world/auction.js).
  if (npc.role === 'auction') {
    const box = char.auction?.box?.length ?? 0;
    const up = char.auction?.mine?.length ?? 0;
    choices.push({ label: 'The Auction House', sub: box ? `${box} waiting in your collection box!` : up ? `${up} of yours up for sale` : 'Buy, bid and sell', icon: 'star', primary: true, run: () => {
      dlg.bye = true;
      state.windows.auction.open = true;
    } });
  }
  // Juniper's rooms at the Gilded Kettle: a night's sleep turns into rested EXP (world/inn.js).
  if (npc.role === 'inn') {
    const rested = Math.round(char.rested ?? 0);
    choices.push({ label: char.inn?.checkedIn ? 'Your room is ready' : `Rent a room · ${ROOM_GOLD} g`, sub: rested ? `Rested: ${rested.toLocaleString()} bonus EXP left` : 'Log off here, wake up well rested', icon: 'heart', primary: !char.inn?.checkedIn, run: () => {
      dlg.bye = true;
      const why = checkIn(world);
      (world.bubbles ??= {})[npc.id] = { text: why ?? 'Room at the top of the stair. Sweet dreams, love!', t: 5 };
    } });
  }
  // Old Wendell's rumours: true hints at hidden things.
  if (npc.role === 'rumor') {
    choices.push({ label: 'Heard any rumours?', sub: 'He hears everything', icon: 'star', primary: true, run: () => {
      dlg.bye = true;
      (world.bubbles ??= {})[npc.id] = { text: rumor(world), t: 8 };
    } });
  }
  // The tackle shops post the day's fish requests (world/fishrequests.js).
  if (npc.shop?.includes('fishing_rod')) {
    const reqs = fishRequests(world);
    const ready = reqs.filter((r) => !r.done && requestProgress(char, r).ready).length;
    const left = reqs.filter((r) => !r.done).length;
    choices.push({ label: 'Fish requests', sub: ready ? `${ready} ready to hand in!` : left ? `${left} today · gold and Fishing EXP` : 'All done today!', icon: 'star', primary: ready > 0, run: () => (dlg.fishreq = true) });
  }
  if (npc.role === 'board') {
    const pq = char.partyQuest;
    choices.push({ label: 'Party quests', sub: pq ? `On one: ${pq.have}/${pq.need}` : `${boardOffers(world).length} on the board · shared rewards`, icon: 'friends', primary: true, run: () => (dlg.board = true) });
  }
  // Captain Bobbin sails you across (world/voyage.js): the long way, or straight there once you know it.
  const route = npc.role === 'ferry' ? routeFrom(world) : null;
  if (route) {
    const sail = (quick) => () => {
      dlg.bye = true;
      setSail(world, { quick });
      sfx('waveWash');
    };
    // (Party friends on the quay come aboard with you: net/together.js.)
    const crew = (world.net?.partyFriends?.() ?? []).filter((g) => g.map === world.map.id).length;
    const along = crew ? ` · ${crew} ${crew > 1 ? 'friends come' : 'friend comes'} too` : '';
    choices.push({ label: `Sail to ${route.name}`, sub: `About a minute at sea · fish off the stern${along}`, icon: 'star', primary: true, run: sail(false) });
    if (hasSailed(char)) choices.push({ label: 'Full steam ahead', sub: `Straight to ${route.name}`, icon: 'door', run: sail(true) });
  }
  // From the harbor he'll run you out to your own island too (world/home.js).
  if (npc.role === 'ferry' && world.map.id === 'harbor' && char.home) {
    choices.push({ label: 'Sail to your island', sub: 'Half a minute at sea · fish off the stern', icon: 'heart', run: () => {
      dlg.bye = true;
      setSail(world, { island: true });
      sfx('waveWash');
    } });
  }
  // Nori and the Fishing Derby (world/derby.js): when it's on, and how it works.
  if (npc.role === 'derby') {
    const dc = derbyClock(world);
    const mins = Math.ceil((dc.next ?? 0) / 60);
    choices.push({ label: 'The Fishing Derby', sub: dc.on ? `On now! ${Math.ceil(dc.left / 60)} min left` : `Next one in ${mins} min`, icon: 'star', primary: dc.on, run: () => {
      dlg.bye = true;
      const d = world.derby;
      const me = d && !d.done ? standings(d, d.secs ?? 0).findIndex((r) => r.you) : -1;
      const line = dc.on ? (me >= 0 ? `You're in ${me + 1}${['st', 'nd', 'rd'][me] ?? 'th'} place! Bigger, BIGGER!` : 'It\'s on! Catch anything here at the lagoon to enter. The deep water off the point has the giants...')
        : `Every hour on the hour, five minutes, biggest catch wins! First prize: ${PRIZES[0].gold} gold, bait, and one of my medals.${char.derbyWins ? ` You've won ${char.derbyWins}. Lucky.` : ''}`;
      (world.bubbles ??= {}).nori = { text: line, t: 6 };
    } });
  }
  if (npc.role === 'dungeon') choices.push({ label: `Enter ${DUNGEONS[npc.dungeon].name}`, sub: `Lv ${DUNGEONS[npc.dungeon].minLevel}+ · a group of four`, icon: 'star', primary: true, run: () => (dlg.dungeon = true) });
  if (npc.role === 'instructor') {
    const ready = nextJobs(char.job, char.level, char.quests).some((j) => j.family === npc.family);
    const trial = !ready && nextJobs(char.job, char.level).some((j) => j.family === npc.family && j.trial);
    choices.push({ label: 'Job advancement', sub: ready ? 'You are ready!' : trial ? 'Pass my trial first' : 'Not yet', icon: 'star', primary: ready, run: () => (dlg.job = true) });
  }
  choices.push({ label: 'Goodbye', sub: null, icon: 'door', run: () => (dlg.bye = true) });
  const rows = Math.ceil(choices.length / 2);

  const qStateNow = dlg.quest ? questState(char, dlg.quest) : null;
  const H = dlg.quest ? (qStateNow === 'ready' ? 118 : 138) : dlg.dungeon ? 172 : dlg.board ? 172 : dlg.fishreq ? 206 : dlg.bounty ? 212 : dlg.rep ? 214 : dlg.night ? 196 : dlg.cards ? 214 : dlg.build ? 150 : dlg.gift ? 150 : dlg.breakup ? 110 : dlg.date ? 140 : dlg.job ? Math.max(104, 46 + jobOptions.length * 46) : Math.max(100, 50 + rows * 24);
  const area = dialogFrame(ui, win, npc, H, world, dlg.talking);
  if (!area || dlg.bye) {
    state.npc = null;
    win.open = false;
    return;
  }
  const { x: tx, w: tw, theme: th } = area;
  const key = pressedNumber(ui);

  // Sub-pages: a quest's text, a job choice, or the greeting with options.
  if (dlg.quest) {
    questPage(ui, state, world, npc, area, key);
    return;
  }

  if (dlg.dungeon) {
    dlg.talking = false;
    dungeonPage(ui, state, world, npc, area);
    return;
  }

  if (dlg.board) {
    dlg.talking = false;
    if (boardPage(ui, state, world, area)) dlg.board = false;
    return;
  }

  if (dlg.cards) {
    dlg.talking = false;
    if (cardsPage(ui, state, world, area)) dlg.cards = false;
    return;
  }
  if (dlg.night) {
    dlg.talking = false;
    if (nightPage(ui, state, world, area)) dlg.night = false;
    return;
  }
  if (dlg.rep) {
    dlg.talking = false;
    if (repPage(ui, state, world, area)) dlg.rep = false;
    return;
  }
  if (dlg.bounty) {
    dlg.talking = false;
    if (bountyPage(ui, state, world, area)) dlg.bounty = false;
    return;
  }
  if (dlg.fishreq) {
    dlg.talking = false;
    if (fishRequestPage(ui, state, world, area)) dlg.fishreq = false;
    return;
  }

  if (dlg.build) {
    dlg.talking = false;
    buildPage(ui, state, world, area);
    return;
  }
  if (npc.role === 'sweetheart') drawSweetheartHeader(ui, world, npc, area);
  if (dlg.gift) {
    dlg.talking = false;
    giftPage(ui, state, world, npc, area);
    return;
  }
  if (dlg.breakup) {
    dlg.talking = false;
    breakupPage(ui, state, world, npc, area);
    return;
  }
  if (dlg.date) {
    dlg.talking = false;
    datePage(ui, state, world, npc, area);
    return;
  }

  if (dlg.job) {
    const options = jobOptions;
    let y = area.y - 4;
    if (!options.length) {
      const next = Object.values(JOBS).filter((j) => j.parent === char.job && (!npc.family || j.family === npc.family));
      const trial = next.find((j) => j.trial && char.level >= j.level)?.trial;
      // An instructor whose way has no job right now (the Mage, being remade) says so.
      const remade = npc.family && !Object.values(JOBS).some((j) => j.family === npc.family);
      const msg = remade ? 'The way of magic is being remade from the ground up. Come back soon!' : trial ? `First, pass my trial: ${QUESTS[trial].name}. Then I'll teach you more.` : next.length ? `Come back at level ${next[0].level} and I'll teach you more.` : char.job === 'novice' ? '' : 'You have learned all I can teach for now.';
      const fam = JOBS[char.job].family;
      const words = npc.family && char.job !== 'novice' && fam !== npc.family ? 'You walk a different path. Seek your own instructor.' : msg;
      wrap(ctx, words, tx, y + 8, tw, { size: 8.5, chars: typed(ui, dlg, `job:${words}`, world, area, words) });
    } else dlg.talking = false;
    // One card per path: its name, what it's about, what it fights with and the stat it grows,
    // and a Choose button (or its number key).
    options.forEach((j, i) => {
      box(ctx, tx - 2, y - 4, tw + 4, 42, { fill: '#ffffff', edge: th.light, r: 8, width: 1.5 });
      text(ctx, j.name, tx + 4, y + 7, { size: 9.5, bold: true, color: th.dark });
      wrap(ctx, j.blurb, tx + 4, y + 17, tw - 70, { size: 7, lineHeight: 8.5 });
      const stat = (FAMILY_STATS[j.family] ?? FAMILY_STATS.beginner).primary.toUpperCase();
      const uses = (j.weapons ?? []).filter((w) => w !== 'none').map((w) => w[0].toUpperCase() + w.slice(1)).join(', ');
      text(ctx, fit(ctx, `${uses} · grows ${stat}`, tw - 70, 6.5, false), tx + 4, y + 34, { size: 6.5, color: COLORS.muted });
      const picked = button(ui, tx + tw - 60, y + 9, 58, 18, `${i + 1}  Choose`, { primary: true, size: 8 }) || key === i + 1;
      y += 46;
      if (picked) {
        advanceJob(char, j.id);
        world.log(`You are now a ${j.name}! Spend your new SP in the Skills window (K).`, '#ffe36b');
        // Your first weapon of your new kind, straight into your hands.
        const weapon = giveStarterWeapon(char, j.id);
        if (weapon) world.log(`${npc.name} hands you a ${ITEMS[weapon].name}. It's in your hands already.`, ITEMS[weapon].color ?? '#ffe36b');
        if (char.refunded) world.log(`Your ${char.refunded} stat points are back: put them into ${(FAMILY_STATS[j.family] ?? FAMILY_STATS.beginner).primary.toUpperCase()} in Stats (C), or press Auto.`, '#ffe36b');
        char.refunded = 0;
        world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
        // The instructor sends you off with a scene of your own.
        playScene(world, SCENES[`job_${j.id}`] ? `job_${j.id}` : 'job_path', { job: j.name });
        state.npc = null;
        win.open = false;
      }
    });
    if (!state.npc) return;
    if (button(ui, tx + tw - 70, area.bottom - 16, 70, 17, 'Back') || ui.input.pressed?.has('Backspace')) dlg.job = false;
    return;
  }

  // The greeting, typed out, with a bouncing sparkle when it's done; then the choices in two
  // columns, each with its number key.
  // (A Sweetheart says something for how close you are, or what they just said to your chat.)
  dlg.words ??= npc.role === 'sweetheart' ? greetingFor(world, npc.id) : null;
  const hello = dlg.words ?? (npc.nightGreeting && isNight(world) ? npc.nightGreeting : npc.greeting);
  const chars = typed(ui, dlg, `hi:${dlg.id}:${hello.length}`, world, area, hello);
  const end = wrap(ctx, hello, tx, area.y + 2, tw, { size: 8.5, chars, lineHeight: 11.5 });
  if (chars >= hello.length) sparkle(ctx, tx + tw - 4, end - 10 + Math.sin(world.now * 6) * 1.5, 2.5, th.main);
  const colW = (tw - 6) / 2;
  choices.forEach((c, i) => {
    const bx = tx + (i % 2) * (colW + 6);
    const by = area.bottom - rows * 24 + Math.floor(i / 2) * 24 + 2;
    if (choice(ui, bx, by, colW, c, i + 1, th, key)) c.run();
  });
}

// A quest, told by its giver: the story typing out, what it asks (with progress once it's yours,
// and where to go), the rewards as item cells, and Accept, Complete, or Back. Enter takes the main
// action and Backspace goes back.
function questPage(ui, state, world, npc, area, key) {
  const { ctx } = ui;
  const dlg = state.npc;
  const char = world.char;
  const { x: tx, w: tw, theme: th } = area;
  const q = QUESTS[dlg.quest];
  const st = questState(char, dlg.quest);
  const words = st === 'ready' ? `${thanksFor(dlg.quest)} Here is your reward.` : q.text;
  const chars = typed(ui, dlg, `q:${dlg.quest}:${st}`, world, area, words);
  text(ctx, q.name, tx, area.y, { size: 9.5, bold: true, color: th.ink });
  ctx.font = font(9.5, true);
  const nw = ctx.measureText(q.name).width;
  const chipText = st === 'ready' ? 'Complete!' : st === 'active' ? 'In progress' : 'New';
  ctx.font = font(6.5, true);
  const cw = ctx.measureText(chipText).width + 10;
  box(ctx, tx + nw + 6, area.y - 8, cw, 10, { fill: st === 'ready' ? COLORS.good : st === 'active' ? th.light : COLORS.select, edge: null, r: 5 });
  text(ctx, chipText, tx + nw + 6 + cw / 2, area.y - 0.5, { size: 6.5, bold: true, align: 'center', color: st === 'active' ? th.ink : '#ffffff' });
  let y = wrap(ctx, words, tx, area.y + 13, tw, { size: 8, chars, lineHeight: 10.5 });

  // What it asks.
  if (st !== 'ready') {
    for (const o of objectiveProgress(char, dlg.quest)) {
      const { verb, name: what } = objectiveText(o);
      const name = `${verb} ${what}`;
      const done = st === 'active' && o.have >= o.count;
      text(ctx, fit(ctx, `${name}${st === 'active' || ['talk', 'deliver', 'visit', 'job'].includes(o.type) ? '' : ` x${o.count}`}`, tw / 2, 7, true), tx, y + 2, { size: 7, bold: true, color: done ? '#2f8f52' : COLORS.ink });
      if (st === 'active') {
        box(ctx, tx + tw / 2 + 4, y - 3.5, tw / 2 - 40, 4, { fill: COLORS.cell, edge: null, r: 2 });
        box(ctx, tx + tw / 2 + 4, y - 3.5, Math.max(4, ((tw / 2 - 40) * o.have) / o.count), 4, { fill: done ? COLORS.good : th.main, edge: null, r: 2 });
        text(ctx, `${o.have}/${o.count}`, tx + tw, y + 2, { size: 7, bold: true, align: 'right', color: done ? '#2f8f52' : th.dark });
      } else {
        const hint = objectiveHint(o);
        if (hint) text(ctx, fit(ctx, hint, tw / 2 - 8, 6.5, false), tx + tw, y + 2, { size: 6.5, align: 'right', color: COLORS.muted });
      }
      y += 10;
    }
  }

  // The rewards, as cells you can hover, then EXP and gold.
  const by = area.bottom - 16;
  const ry = by - 23;
  text(ctx, st === 'ready' ? 'Your reward' : 'Reward', tx, ry + 12, { size: 7, bold: true, color: th.dark });
  let ix = tx + (st === 'ready' ? 50 : 34);
  for (const r of q.rewards.items) {
    const rid = rewardId(char, r);
    itemSlot(ctx, ix, ry + 1, 18, { id: rid, qty: r.qty, variant: r.variant === 'roll' ? null : r.variant ?? null }, { shadow: false });
    if (hover(ui, ix, ry + 1, 18, 18)) tooltip(ui, itemTooltip(char, rid));
    ix += 20;
  }
  icon(ctx, 'star', ix + 6, ry + 6, 7, COLORS.exp);
  text(ctx, `${q.rewards.exp.toLocaleString()} EXP`, ix + 12, ry + 8.5, { size: 7, bold: true, color: COLORS.ink });
  icon(ctx, 'coin', ix + 6, ry + 15, 7, COLORS.gold);
  text(ctx, `${q.rewards.gold.toLocaleString()} gold`, ix + 12, ry + 17.5, { size: 7, bold: true, color: COLORS.ink });

  const enter = ui.input.pressed?.has('Enter') && chars >= words.length;
  if (st === 'available' && (button(ui, tx + tw - 154, by, 74, 17, 'Accept', { primary: true }) || enter)) {
    acceptQuest(char, dlg.quest);
    world.log(`${q.story ? 'Story' : 'Quest'} accepted: ${q.name}`, '#bff0dc');
    questAccepted(world, [dlg.quest]);
    // A story quest opens with its scene.
    if (q.scenes?.accept) {
      playScene(world, q.scenes.accept);
      dlg.quest = null;
      return;
    }
    if (questState(char, dlg.quest) !== 'ready') dlg.quest = null;
    return;
  }
  if (st === 'ready' && (button(ui, tx + tw - 154, by, 74, 17, 'Complete', { primary: true }) || enter)) {
    const r = completeQuest(char, dlg.quest);
    if (r) {
      world.log(`Quest complete: ${q.name}! +${r.exp} EXP, +${r.gold} gold`, '#ffe36b');
      for (const it of r.items) world.log(`Received ${ITEMS[it.id].name}${it.qty > 1 ? ` x${it.qty}` : ''}.`, ITEMS[it.id].color);
      if (r.mount) {
        world.log(`New mount: ${MOUNTS[r.mount].name}! ${MOUNTS[r.mount].trickText}`, '#ffe36b');
        world.log('Press H to ride (pick mounts in the Collection, B).', '#bff0dc');
        world.events.push({ type: 'mount', id: r.mount });
      }
      if (r.levels) world.fx.push({ kind: 'levelup', x: world.body.x, y: world.body.y, t: 0, dur: 1.6 });
      questCompleted(world, dlg.quest, r);
      if (q.scenes?.done) playScene(world, q.scenes.done);
      // The next step of their chain, offered straight away (unless a scene is playing first).
      const next = q.scenes?.done ? null : (npc.quests ?? []).find((id) => QUESTS[id].prereq === dlg.quest && questState(char, id) === 'available');
      dlg.quest = next ?? null;
    } else {
      world.log('Make room in your bag first.', '#ffb3c6');
    }
    return;
  }
  if (button(ui, tx + tw - 74, by, 74, 17, 'Back') || ui.input.pressed?.has('Backspace')) dlg.quest = null;
}

// ---------- Shelly's building page ----------

// The next stage: what it adds, what she needs (with what you have), and Build.
function buildPage(ui, state, world, area) {
  const { ctx } = ui;
  const dlg = state.npc;
  const char = world.char;
  const n = nextStageNeeds(char);
  const { x: tx, w: tw, theme: th } = area;
  if (!n) {
    dlg.build = false;
    return;
  }
  text(ctx, `Stage ${n.stage}: ${n.def.name}`, tx, area.y, { size: 9, bold: true, color: th.ink });
  wrap(ctx, n.def.about, tx, area.y + 12, tw, { size: 7, lineHeight: 9, color: COLORS.muted });
  let x = tx;
  const y = area.y + 34;
  for (const it of n.items) {
    const ok = it.have >= it.need;
    itemSlot(ctx, x, y, 26, { id: it.id, qty: 1 }, { count: false, edge: ok ? '#9fe0a0' : '#f4bcd8' });
    text(ctx, `${Math.min(it.have, it.need)}/${it.need}`, x + 13, y + 36, { size: 6.5, bold: true, align: 'center', color: ok ? '#3f9f5f' : COLORS.bad });
    if (hover(ui, x, y, 26, 26)) tooltip(ui, [{ text: ITEMS[it.id].name, bold: true }, { text: `You have ${it.have}, she needs ${it.need}`, size: 7 }]);
    x += 34;
  }
  const goldOk = n.haveGold >= n.gold;
  text(ctx, `${n.gold.toLocaleString()} gold`, x + 4, y + 16, { size: 8, bold: true, color: goldOk ? COLORS.gold : COLORS.bad });
  const ready = goldOk && n.items.every((i) => i.have >= i.need);
  const by = area.bottom - 16;
  if (button(ui, tx + tw - 154, by, 74, 17, ready ? 'Build it!' : 'Not yet', { primary: ready, enabled: ready, size: 8 })) {
    const r = buildNext(char);
    if (typeof r === 'number') {
      world.log(`Shelly built ${HOME_STAGES[r].name}! ${HOME_STAGES[r].about}`, '#ffe36b');
      // (The island grows round you: reloaded with you just where you stood.)
      const x0 = world.body.x;
      loadMap(world, 'home', 'dock');
      Object.assign(world.body, { x: x0, y: world.map.groundY });
      world.fx.push({ kind: 'mountpoof', on: true, x: world.body.x + 40, y: world.body.y, t: 0, dur: 0.45 });
      say(world, 'shelly', ['Ta-daa! Do you love it? I love it.', "Done! Mind the paint, it's still wet.", 'Another job well clawed!'][r % 3]);
      state.npc = null;
      state.windows.npc.open = false;
      return;
    }
    world.log(r, '#ffb3c6');
  }
  if (button(ui, tx + tw - 74, by, 74, 17, 'Back')) dlg.build = false;
}

// ---------- Dungeon group finder ----------

// The group you'd go in with: one row per role, filled by you, your party, or the finder.
function dungeonPage(ui, state, world, npc, area) {
  const { ctx } = ui;
  const def = DUNGEONS[npc.dungeon];
  const { x: tx, w: tw, theme: th } = area;
  text(ctx, `${def.name}  ·  Lv ${def.minLevel}+`, tx, area.y, { size: 9, bold: true, color: th.ink });
  wrap(ctx, def.blurb, tx, area.y + 12, tw, { size: 7, lineHeight: 9, color: COLORS.muted });
  const plan = planGroup(world, def.id);
  let y = area.y + 42;
  if (plan.why) wrap(ctx, plan.why, tx, y + 8, tw, { size: 8.5, color: COLORS.bad });
  else {
    plan.slots.forEach((s, i) => {
      const cx = tx + (i % 2) * (tw / 2 + 2);
      const cy = y + Math.floor(i / 2) * 22;
      const r = ROLES[s.role];
      box(ctx, cx, cy, tw / 2 - 2, 19, { fill: '#ffffff', edge: th.light, r: 7, width: 1.2 });
      box(ctx, cx + 3, cy + 3, 36, 13, { fill: r.color, edge: null, r: 6 });
      text(ctx, r.label, cx + 21, cy + 12.5, { size: 7, bold: true, align: 'center', color: '#ffffff', outline: 'rgba(58,45,79,0.5)' });
      const f = s.who?.friend;
      const who = s.who === 'you' ? `${world.char.name} (you)` : f ? `Lv${f.level ?? 1} ${f.name} (friend)` : s.who ? `Lv${s.who.level} ${s.who.name}` : 'Group finder...';
      const job = s.who === 'you' ? JOBS[world.char.job].name : f ? JOBS[f.job]?.name ?? '' : s.who ? JOBS[s.who.char.job].short ?? JOBS[s.who.char.job].name : s.role === 'healer' ? 'a healer' : s.role === 'tank' ? 'a Warrior' : 'any job';
      text(ctx, who, cx + 44, cy + 9, { size: 7.5, bold: true, color: s.who ? COLORS.ink : COLORS.muted });
      text(ctx, job, cx + 44, cy + 16.5, { size: 6, color: COLORS.muted });
    });
    text(ctx, 'Warriors tank, everyone else deals damage.', tx, y + 52, { role: 'minor' });
  }
  // Your record here, the day's first-clear bonus, and Normal or Hard (open after a first clear).
  const rec = world.char.dungeons?.[def.id];
  const by = area.bottom - 16;
  const dailyReady = rec?.day !== today();
  const note = rec ? `Best: rank ${rec.best} in ${clock(rec.bestTime)} · ${rec.clears} clear${rec.clears === 1 ? '' : 's'}` : 'Not cleared yet';
  text(ctx, note, tx, by - 6, { size: 6.5, bold: true, color: th.dark });
  if (dailyReady) text(ctx, "★ Today's first clear: bonus Cash, Acorns and a set piece", tx, by + 3, { size: 6, bold: true, color: COLORS.gold });
  const dlg = state.npc;
  // Hard is party-only (data/coop.js): a party of two or more, after a first clear.
  const notHard = hardBlocker(world, def.id);
  if (notHard) dlg.hard = false;
  if (rec?.clears) {
    for (const [i, mode] of ['Normal', 'Hard'].entries()) {
      const on = Boolean(dlg.hard) === (i === 1);
      if (button(ui, tx + i * 46, by + 6, 44, 14, mode, { primary: on, size: 7, theme: i ? 'pink' : null, enabled: !i || !notHard })) dlg.hard = i === 1;
      if (i && notHard && hover(ui, tx + i * 46, by + 6, 44, 14)) tooltip(ui, [{ text: 'Hard mode', bold: true }, { text: notHard, size: 7, color: COLORS.muted }]);
    }
    if (!notHard) text(ctx, 'Hard: tougher, an extra boss move, 3x tokens, a Hard-only crown', tx + 96, by + 15, { size: 5.5, bold: true, color: '#e0659f' });
  }
  if (!plan.why && button(ui, tx + tw - 154, by, 74, 17, dlg.hard ? 'Go (Hard)' : 'Find group & go', { primary: true, size: 7.5 })) {
    const why = startRun(world, def.id, { hard: Boolean(dlg.hard) && !notHard });
    if (why) world.log(why, '#ffb3c6');
    state.npc = null;
    state.windows.npc.open = false;
    return;
  }
  if (button(ui, tx + tw - 74, by, 74, 17, 'Back')) state.npc.dungeon = false;
}

// ---------- Stylist ----------

function styleWindow(ui, state, world) {
  const dlg = state.npc;
  const npc = NPCS[dlg.id];
  const win = state.windows.npc;
  const W = 400;
  // Tall enough for the hair tab's rows (styles, bangs, colour and tips).
  const H = 290;
  // The salon is bigger than the talk box it opens from, so it starts centred on screen.
  if (!dlg.placed) {
    win.x = (640 - W) / 2;
    win.y = Math.round((360 - H) / 2) - 8;
    dlg.placed = true;
  }
  if (!windowFrame(ui, win, W, H, `${npc.name}'s Salon`, { theme: 'pink', icon: 'wand' })) {
    state.npc = null;
    return;
  }
  const { ctx } = ui;
  const char = world.char;
  dlg.tab ??= 0;
  // (Always a whole look, even from a save that's missing some of its keys.)
  dlg.look = dlg.look ? fullLook(dlg.look) : fullLook(char.appearance);
  box(ctx, win.x + 8, win.y + 24, 104, H - 32, { fill: '#fdf3fb', edge: COLORS.cellEdge, r: 6 });
  withZoom(2, () => drawHero(ctx, dlg.look, wornGear(char), win.x + 60, win.y + 190, { pose: 'idle', time: world.now, scale: 2.2 }));
  if (button(ui, win.x + 20, win.y + H - 30, 80, 15, 'As before', { size: 8, enabled: !sameLook(dlg.look, fullLook(char.appearance)) })) dlg.look = fullLook(char.appearance);
  dlg.tab = tabs(ui, win.x + 124, win.y + 26, LOOK_TABS.map((t) => t.label), dlg.tab, { w: 50, h: 15 });
  dlg.look = lookRows(ui, dlg.look, dlg.tab, win.x + 122, win.y + 46, W - 132, { cell: [20, 26, 24, 20, 32][dlg.tab], time: world.now, gap: 2 }).look;
  const cost = npc.styleCost;
  const by = win.y + H - 22;
  if (button(ui, win.x + 122, by, 110, 15, `Done (${cost}g)`, { primary: true, enabled: char.gold >= cost && !sameLook(dlg.look, fullLook(char.appearance)) })) {
    char.gold -= cost;
    char.appearance = dlg.look;
    world.log('Lulu: You look adorable!', '#ffc2d6');
    dlg.mode = null;
  }
  if (button(ui, win.x + W - 82, by, 72, 15, 'Cancel')) dlg.mode = null;
}

// ---------- Fainted ----------

export function deathWindow(ui, state, world) {
  // Got back up (a revive, or the group regrouping after a wipe).
  if (!world.dead) {
    state.death = false;
    return;
  }
  if (world.dungeon) return dungeonDeath(ui, state, world);
  const W = 230;
  const H = 112;
  const x = (640 - W) / 2;
  const y = 100;
  const { ctx } = ui;
  const th = THEMES.pink;
  ctx.fillStyle = 'rgba(70,40,100,0.4)';
  ctx.fillRect(0, 0, 640, 360);
  paper(ctx, x, y, W, H, { fill: '#fffbf2', edge: th.ink, r: 7, seed: 41, width: 1.8 });
  tape(ctx, x + 14, y + 4, 26, 9, -0.6, th.light, { pattern: 'stripes', alpha: 0.9 });
  tape(ctx, x + W - 14, y + 4, 26, 9, 0.6, th.light, { pattern: 'stripes', alpha: 0.9 });
  // A cracked heart bobbing sadly above the card.
  const bob = Math.sin(world.now * 2.5) * 2;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(x + W / 2, y + bob, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = th.dark;
  ctx.lineWidth = 2;
  ctx.stroke();
  icon(ctx, 'heart', x + W / 2, y + bob + 1, 18, th.main);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x + W / 2, y + bob - 4);
  ctx.lineTo(x + W / 2 - 2, y + bob);
  ctx.lineTo(x + W / 2 + 2, y + bob + 2);
  ctx.lineTo(x + W / 2, y + bob + 6);
  ctx.stroke();
  text(ctx, 'You fainted!', x + W / 2, y + 36, { size: 14, bold: true, align: 'center', color: '#ffffff', outline: th.ink });
  const loss = deathExpLoss(world.char.level, world.char.base.luk);
  const helped = teamOf(world).some((t) => t.kind !== 'you' && t.up);
  wrap(ctx, helped ? `Stay put and your party can stand by you to get you up, or wake up in town and lose ${loss} EXP.` : `You'll wake up in town and lose ${loss} EXP. Higher LUK softens the loss.`, x + 18, y + 54, W - 36, { size: 8, color: COLORS.muted });
  ui.theme = th;
  if (button(ui, x + W / 2 - 56, y + H - 28, 112, 19, 'Return to town', { primary: true })) {
    respawn(world);
    state.death = false;
  }
}

// Fainting in a dungeon: a small note at the top instead of a modal, so you can watch your group
// finish the fight. They'll get you up after it, or you can leave.
function dungeonDeath(ui, state, world) {
  const { ctx } = ui;
  const th = THEMES.pink;
  const W = 220;
  const x = (640 - W) / 2;
  const y = 92;
  box(ctx, x, y, W, 40, { fill: 'rgba(255,250,246,0.95)', edge: th.dark, r: 10, width: 1.5 });
  text(ctx, 'You fainted!', x + 10, y + 14, { size: 9, bold: true, color: th.ink });
  text(ctx, 'Your group will get you up after the fight.', x + 10, y + 26, { role: 'minor' });
  ui.theme = th;
  if (button(ui, x + W - 62, y + 6, 54, 15, 'Leave', { size: 7.5 })) {
    leaveDungeon(world);
    state.death = false;
  }
}
