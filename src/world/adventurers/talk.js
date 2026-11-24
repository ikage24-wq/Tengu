// What an adventurer says to you, picked from what is really going on with them: the first time
// you meet; a boss they just beat or lost to; being hurt, worn out or hungry; what they're doing
// right now; the boss in their way and how many times they've tried it; the set they're saving for;
// their friend and their rival; what they think of you; a memory you share, a thing that happened
// to them, or news they heard from someone else; their mood; their dream (once they know you).
// Lines are their own (data/adventurer-lines.js), never the same twice running.
import { LINES, COMMON, FIGHT, FIGHT_COMMON } from '../../data/adventurer-lines.js';
import { ADVENTURER_BY_ID } from '../../data/adventurers.js';
import { JOBS } from '../../data/jobs.js';
import { MAPS } from '../../data/maps.js';
import { bossById } from './catalog.js';
import { rand } from './state.js';
import { wallOf, savingFor } from './grow.js';
import { nameOf } from './social.js';

const WHY = {
  asleep: "I'm half asleep",
  hurt: "I'm still patching up",
  busy: "I'm in the middle of something",
  tired: "I'm worn out",
  hungry: "I need to eat first",
  'not yet': "I don't know you well enough yet",
  gone: 'I have to go',
};
const placeName = (id) => (id?.startsWith('guild') ? 'the guild' : MAPS[id]?.name ?? id ?? 'here');
const jobName = (id) => JOBS[id]?.name ?? id;
const pick = (s, str) => {
  const list = str.split('|');
  return list[Math.floor(rand(s) * list.length)];
};

// A memory said out loud: one you share ("remember when we..."), their own, or news they heard.
function memoryLine(s, m, youName) {
  const boss = m.text.replace(/^(beat|lost to) /, '').replace(/ with you$/, '');
  if (m.heard || (m.of && m.of !== s.id)) {
    const who = nameOf(m.of);
    if (m.of === 'you') return null;
    return { key: `heard:${m.t}`, text: fill(pick(s, COMMON.heard), { news: `${who} ${m.text}` }) };
  }
  if (m.who.includes('you')) {
    if (m.kind === 'beat') return { key: `yours:${m.t}`, text: `Remember when we beat ${boss}? I still grin about it.` };
    if (m.kind === 'lost') return { key: `yours:${m.t}`, text: `We'll get ${boss} next time, ${youName}. You and me.` };
    if (m.kind === 'party') return { key: `yours:${m.t}`, text: m.n > 2 ? 'We make a good team, you know.' : 'That trip with you was fun. Let\'s go again.' };
    if (m.kind === 'gift') return { key: `yours:${m.t}`, text: m.feel > 0.3 ? 'I still have the present you gave me.' : 'Thanks again for the present. Really.' };
    return null;
  }
  if (m.kind === 'met' || m.kind === 'rested') return null;
  if (m.kind === 'taught') return { key: `own:${m.t}`, text: m.n > 1 ? `${nameOf(m.who[0])} keeps giving me pointers. It's helping.` : `I ${m.text}.` };
  const times = m.n > 1 && ['beat', 'lost', 'bounty', 'hurt'].includes(m.kind) ? (m.n === 2 ? ' twice' : ` ${m.n} times`) : '';
  const tail = { beat: ', you know.', lost: '. Still stings.', hurt: '. Still sore.', job: '!', level: '!', gear: '. Looks good, right?', hobby: '!', bounty: '. Easy coin.', explore: '. You should go.', grown: '. Halvard said I earned it.' }[m.kind] ?? '.';
  return { key: `own:${m.t}`, text: `I ${m.text}${times}${tail}` };
}

function fill(str, v) {
  return str.replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? `{${k}}`)).replace(/\s+/g, ' ').trim();
}

// The line. opts: { youName, asked: 'yes' | 'no', why }. Returns { text, topic }.
// `aloud`: said to the room or a friend rather than to you (no greetings to you, nothing about you).
// `topic`: 'news' (what's happened: their memories and gossip) or 'doing' (what they're up to and
// working toward), when you ask about that; anything else on their mind if there's nothing.
export function lineFor(g, id, t, { youName = 'you', asked = null, why = null, aloud = false, topic = null } = {}) {
  const s = g.adv[id];
  const def = ADVENTURER_BY_ID[id];
  const book = LINES[id] ?? {};
  const wall = wallOf(s);
  const saving = savingFor(s);
  const op = s.ops.you ?? { aff: 0, res: 0, trust: 0 };
  const recentMem = (kinds, within) => [...s.mem].reverse().find((m) => !m.heard && kinds.includes(m.kind) && t - m.t < within);
  const taughtBy = recentMem(['taught'], 24)?.who?.[0];
  const vars = {
    you: youName,
    map: placeName(s.place),
    friend: def.friend ? nameOf(def.friend) : '',
    rival: def.rival === 'you' ? youName : def.rival ? nameOf(def.rival) : '',
    gear: saving ? `a ${saving.id} set` : 'new gear',
    job: jobName(s.job),
    home: MAPS[def.home]?.name ?? def.home,
    level: s.level,
    hobby: def.hobby,
    boss: wall?.name.split(',')[0] ?? '',
    tries: wall ? s.know.boss[wall.id]?.tries ?? 0 : 0,
    why: WHY[why] ?? WHY.busy,
    other: s.act.with ? nameOf(s.act.with) : taughtBy ? nameOf(taughtBy) : '',
  };
  const say = (key, topic = key) => {
    const str = book[key] || COMMON[key];
    if (!str) return null;
    return { text: fill(pick(s, str), vars), topic, key };
  };

  // (what must come first)
  if (asked) return say(asked);
  if (s.act.kind === 'sleep') return remember(s, say('asleep'));
  if (!s.met && !aloud) return say('meet');
  const fight = recentMem(['beat', 'lost'], 6);
  if (fight && !(s.said ?? []).includes(`fight:${fight.t}`)) {
    vars.boss = fight.text.replace(/^(beat|lost to) /, '').replace(/ with you$/, '');
    const r = say(fight.kind);
    if (r) return remember(s, { ...r, key: `fight:${fight.t}` });
  }
  if (s.injured > 0.5) return remember(s, say('hurt'));
  if (s.needs.energy < 0.15) return remember(s, say('tired'));
  if (s.needs.food < 0.15) return remember(s, say('hungry'));

  // (everything else, weighed by how much it's on their mind, never the same twice running)
  const pool = [];
  const add = (w, r) => r && w > 0 && !(s.said ?? []).includes(r.key + r.text) && pool.push({ w, r });
  const actKey = { hunt: 'hunt', bounty: 'hunt', explore: 'hunt', train: 'train', hobby: 'hobby', eat: 'eat', home: 'home', shop: 'shop', mentor: 'mentor', rest: 'rest', party: 'hi' }[s.act.kind];
  if (actKey) add(1.3, say(actKey));
  if (!aloud) add(1, say(op.aff > 0.45 ? 'close' : op.aff < -0.2 ? 'cold' : 'hi'));
  if (wall && s.know.boss[wall.id]?.tries) add(0.9 + Math.min(0.6, s.know.boss[wall.id].tries * 0.1), say('wall'));
  if (saving) add(0.35, say('gear'));
  if (def.friend) add(0.4, say('friend'));
  if (def.rival && !(aloud && def.rival === 'you')) add(0.3 + def.traits.pride * 0.4, say('rival'));
  if (op.res > 0.35 && !aloud) add(0.3 + op.res * 0.5, say('you'));
  if (aloud || op.aff > 0.3 || s.bond > 15) add(0.25 + s.bond / 120, say('dream'));
  if (taughtBy) add(0.6, say('taught'));
  if (s.mood.v > 0.55) add(0.7, say('happy'));
  if (s.mood.v < -0.35) add(0.9, say('down'));
  // (memories: the ones that matter, recent first)
  const mems = [...s.mem].filter((m) => t - m.t < 72).sort((a, b) => b.sal - a.sal).slice(0, 4);
  for (const m of mems) {
    if (aloud && m.who.includes('you')) continue;
    const r = memoryLine(s, m, youName);
    if (r) add((m.who.includes('you') ? 1.2 : m.heard ? 0.5 : 0.6) * m.sal, { ...r, topic: 'memory' });
  }
  if (topic) {
    const want = TOPICS[topic];
    const only = pool.filter((p) => want.has(p.r.topic));
    if (only.length) pool.splice(0, pool.length, ...only);
  }
  if (!pool.length) return remember(s, say('hi'));
  const total = pool.reduce((a, p) => a + p.w, 0);
  let x = rand(s) * total;
  for (const p of pool) {
    x -= p.w;
    if (x <= 0) return remember(s, p.r);
  }
  return remember(s, pool.at(-1).r);
}

const TOPICS = {
  news: new Set(['memory', 'taught', 'happy', 'down']),
  doing: new Set(['hunt', 'train', 'hobby', 'eat', 'home', 'shop', 'mentor', 'rest', 'wall', 'gear', 'dream']),
};

function remember(s, r) {
  if (!r) return r;
  s.said = [...(s.said ?? []), r.key + r.text].slice(-8);
  if (r.key?.startsWith('fight:')) s.said.push(r.key);
  return { text: r.text, topic: r.topic };
}

// What they say in a fight (party chat): `kind` is a callout (world/botfight.js: slam, lane, aggro,
// heal, finisher, revive, drink...) or a dungeon moment (dgHello, dgPull, dgTaunt, dgHeal, dgDown,
// dgUp). Their own words where they have them, the plain ones otherwise.
const WARN = new Set(['slam', 'lane', 'windupYou', 'spores', 'thorns']);
const DUNGEON = { dgPull: 'pull', dgTaunt: 'aggro', dgHeal: 'heal', dgDown: 'down', dgUp: 'up' };
export function fightLine(g, id, kind, ctx = {}) {
  const s = g?.adv[id];
  if (!s) return null;
  const own = FIGHT[id] ?? {};
  if (kind === 'dgHello') return fill(pick(s, LINES[id]?.yes || "Let's go!"), { you: ctx.you ?? 'you' });
  const k = DUNGEON[kind] ?? kind;
  const str = (WARN.has(k) && own.warn) || own[k] || FIGHT_COMMON[k] || (k === 'down' ? 'Ow...' : null);
  if (!str) return null;
  return fill(pick(s, str), { boss: ctx.boss ?? 'it', skill: ctx.skill ?? 'Finisher', level: ctx.level ?? s.level });
}
