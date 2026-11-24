// The guild's notice board, in Guildmaster Halvard's dialog (the adventurers' lives, world/adventurers/):
//   News         what the guild's been up to: bosses beaten (and firsts for the guild), new jobs,
//                bounties brought in, levels, gear, and what you did
//   Who's where  all sixteen: level, job, and what each is doing right now, where
//   Help wanted  someone stuck at a boss asks for a hand: "I'll help" asks them into your party, and
//                beating it together is a win they remember
import { ADVENTURERS, ADVENTURER_BY_ID } from '../data/adventurers.js';
import { JOBS } from '../data/jobs.js';
import { MAPS } from '../data/maps.js';
import { bossById } from '../world/adventurers/catalog.js';
import { nowHours } from '../world/adventurers/bodies.js';
import { joinParty, partyMembers, PARTY_MAX } from '../world/party.js';
import { COLORS, text, box, button, fit, tabs } from './kit.js';

const PLACE = { 'guild:hall': 'in the guild hall', 'guild:kitchen': 'at the tea corner', 'guild:yard': 'in the training yard', 'guild:bunks': 'in the bunks' };
const placeOf = (p) => PLACE[p] ?? (MAPS[p] ? `at ${MAPS[p].name}` : '');

// What someone is doing, in a few words ("Hunting at Whispering Glade").
export function doingText(g, s) {
  const def = ADVENTURER_BY_ID[s.id];
  const at = placeOf(s.place);
  const k = s.act.kind;
  if (k === 'party') return 'Adventuring with you';
  if (k === 'sleep') return 'Asleep';
  if (k === 'boss') {
    const b = bossById(s.act.target);
    const n = (s.act.party?.length ?? 1) - 1;
    return `Taking on ${b?.name.split(',')[0] ?? 'a boss'}${n > 0 ? ` with ${n} other${n > 1 ? 's' : ''}` : ''}`;
  }
  if (k === 'mentor') return `Teaching ${ADVENTURER_BY_ID[s.act.with]?.name ?? 'a rookie'}`;
  if (k === 'rest') return s.injured > 0.5 ? 'Resting up after a knock' : `Taking it easy ${at}`;
  const verb = { hunt: 'Hunting', bounty: 'On a bounty', explore: 'Exploring', train: 'Training', eat: 'Having a meal', social: 'Chatting', shop: 'Shopping', home: 'Visiting home' }[k];
  if (verb) return `${verb} ${k === 'explore' ? (MAPS[s.place]?.name ?? '') : at}`.trim();
  if (k === 'hobby') return `${{ fishing: 'Fishing', cooking: 'Cooking', crafting: 'Crafting', gathering: 'Gathering', drawing: 'Drawing' }[def.hobby] ?? 'Relaxing'} ${at}`.trim();
  return `Somewhere ${at}`.trim();
}

const ago = (now, t) => {
  if (t < 0) return 'long ago';
  const days = Math.floor(now / 24) - Math.floor(t / 24);
  return days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
};

// Returns true when it closed.
export function guildBoardPage(ui, state, world, area) {
  const { ctx } = ui;
  const { x: tx, w: tw, theme: th } = area;
  const dlg = state.npc;
  const g = world.guild;
  if (!g) return true;
  const now = nowHours(world.bots);
  const open = (g.requests ?? []).filter((r) => r.open && !g.adv[r.by]?.beaten?.[r.boss]);
  dlg.boardTab = tabs(ui, tx, area.y - 6, ['News', "Who's where", `Help wanted${open.length ? ` (${open.length})` : ''}`], dlg.boardTab ?? 0, { total: tw - 70 });
  let y = area.y + 18;
  if (dlg.boardTab === 0) {
    const news = g.board.slice(-11).reverse();
    if (!news.length) text(ctx, 'Nothing pinned up yet. Give it a day.', tx, y + 6, { size: 7.5, color: COLORS.muted });
    for (const n of news) {
      const col = n.kind === 'beat' ? '#c0782a' : n.kind === 'request' ? '#c0506a' : n.kind === 'job' ? '#6a58b8' : n.kind === 'you' ? '#2f8f52' : COLORS.ink;
      text(ctx, fit(ctx, n.text, tw - 52, 7, n.kind === 'beat' || n.kind === 'you'), tx, y + 6, { size: 7, color: col, bold: n.kind === 'beat' || n.kind === 'you' });
      text(ctx, ago(now, n.t), tx + tw, y + 6, { size: 6, align: 'right', color: COLORS.muted });
      y += 12.5;
    }
  } else if (dlg.boardTab === 1) {
    const colW = (tw - 6) / 2;
    ADVENTURERS.forEach((def, i) => {
      const s = g.adv[def.id];
      const cx = tx + (i % 2) * (colW + 6);
      const cy = y + Math.floor(i / 2) * 18.5;
      box(ctx, cx, cy - 2, colW, 17, { fill: s.act.kind === 'party' ? '#f0fff4' : '#fffdfb', edge: th.light, r: 6 });
      text(ctx, def.name, cx + 4, cy + 5.5, { size: 7, bold: true, color: th.ink });
      text(ctx, fit(ctx, `Lv ${s.level} ${JOBS[s.job]?.name ?? s.job}`, colW - 50, 6, false), cx + colW - 4, cy + 5.5, { size: 6, align: 'right', color: COLORS.muted });
      text(ctx, fit(ctx, doingText(g, s), colW - 8, 6, false), cx + 4, cy + 12.5, { size: 6, color: s.injured > 0.5 ? '#c0506a' : COLORS.ink });
    });
  } else {
    if (!open.length) text(ctx, "Nobody's stuck right now. They'll pin a note here if they need a hand.", tx, y + 6, { size: 7.5, color: COLORS.muted });
    for (const r of open.slice(0, 5)) {
      const s = g.adv[r.by];
      const def = ADVENTURER_BY_ID[r.by];
      const boss = bossById(r.boss);
      if (!s || !boss) continue;
      box(ctx, tx, y - 2, tw, 26, { fill: '#fff7f3', edge: th.light, r: 7 });
      text(ctx, fit(ctx, `${def.name} needs help with ${boss.name.split(',')[0]}`, tw - 70, 7.5, true), tx + 5, y + 7, { size: 7.5, bold: true, color: th.ink });
      const tries = s.know.boss[r.boss]?.tries ?? 0;
      text(ctx, fit(ctx, `Lv ${boss.level} boss · ${tries} tries so far · ${doingText(g, s)}`, tw - 70, 6, false), tx + 5, y + 17, { size: 6, color: COLORS.muted });
      const inParty = s.act.kind === 'party';
      const full = partyMembers(world.bots).length >= PARTY_MAX;
      if (inParty) text(ctx, 'With you!', tx + tw - 8, y + 12, { size: 7, bold: true, align: 'right', color: COLORS.good });
      else if (button(ui, tx + tw - 60, y + 3, 54, 16, "I'll help", { primary: !full, size: 7 })) helpOut(world, g, r, full);
      y += 30;
    }
  }
  return button(ui, tx + tw - 60, area.bottom - 16, 60, 17, 'Back') || ui.input?.pressed?.has('Backspace');
}

// Answering a call for help: they come to you wherever they are (asleep, they'll come in the
// morning), and join your party for the fight.
function helpOut(world, g, r, full) {
  const def = ADVENTURER_BY_ID[r.by];
  if (full) return world.log('Your party is full.', '#ffb3c6');
  const s = g.adv[r.by];
  if (s.act.kind === 'sleep') return world.log(`${def.name} is asleep. Ask again in the morning.`, '#ffb3c6');
  // (being asked to help with the very thing they asked for, they come unless hurt)
  if (s.injured > 0.5) return world.log(`${def.name} is still patching up. Soon!`, '#ffb3c6');
  const bot = world.bots.advSummon?.(r.by);
  if (!bot) return world.log(`${def.name} can't come right now.`, '#ffb3c6');
  joinParty(world.bots, bot, world);
  world.bots.advJoined?.(bot);
  r.helper = 'you';
  world.log(`${def.name} joined your party: "${bossById(r.boss)?.name.split(',')[0]}, here we come!"`, '#bff0dc');
}
