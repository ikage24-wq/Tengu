// The Mochi album (docs/design/mochi.md step 10): a book that fills in as you raise Mochi. Each page
// is one kind of thing a Mochi can be (its grown form, its personality, a rare coat, its hairstyle,
// its eyes, its voice); every Mochi you keep in your garden fills in what it is (kept for good in
// `char.album`, even after a goodbye). Each page pays out at half full and again when it's
// complete (on the money scale: a long collector's goal, so the rewards are big).

import { PERSONALITIES, HAIRS, EYES, VOICES, COATS, STAGES } from './mochi-genes.js';
import { addItem } from '../core/inventory.js';

const FORMS = [...['angel', 'demon'].flatMap((path) => ['run', 'fly', 'power', 'stamina', 'swim', 'plain'].map((f) => `${path}|${f}`)), 'angel|moon', 'demon|moon'];
const FORM_NAME = { run: 'Run', fly: 'Fly', power: 'Power', stamina: 'Stamina', swim: 'Swim', plain: 'Plain', moon: 'Tsukimochi' };

export const ALBUM_PAGES = {
  forms: { name: 'Forms', icon: 'star', keys: FORMS, label: (k) => { const [p, f] = k.split('|'); return `${p === 'angel' ? STAGES.amamochi : STAGES.karamochi} · ${FORM_NAME[f]}`; }, reward: [{ gold: 30000 }, { gold: 150000, item: 'mochi_egg_star' }] },
  personalities: { name: 'Personalities', icon: 'heart', keys: PERSONALITIES, label: (k) => k[0].toUpperCase() + k.slice(1), reward: [{ gold: 15000 }, { gold: 60000 }] },
  coats: { name: 'Rare Coats', icon: 'gift', keys: COATS.map(([c]) => c), label: (k) => k[0].toUpperCase() + k.slice(1), reward: [{ gold: 80000 }, { gold: 300000, item: 'mochi_egg_star' }] },
  hairs: { name: 'Hairstyles', icon: 'hanger', keys: HAIRS, label: (k) => k, reward: [{ gold: 20000 }, { gold: 80000 }] },
  eyes: { name: 'Eyes', icon: 'sight', keys: EYES, label: (k) => k.replace(/^mochi/, ''), reward: [{ gold: 15000 }, { gold: 60000 }] },
  voices: { name: 'Voices', icon: 'note', keys: VOICES, label: (k) => k[0].toUpperCase() + k.slice(1), reward: [{ gold: 8000 }, { gold: 25000 }] },
};
export const PAGE_ORDER = Object.keys(ALBUM_PAGES);

// What a Mochi record fills in, page by page.
export function albumKeys(rec) {
  const out = { personalities: rec.personality, hairs: rec.hair, eyes: rec.eyes, voices: rec.voice?.style ?? null, coats: rec.coat ?? null, forms: null };
  if (rec.form && (rec.stage === 'amamochi' || rec.stage === 'karamochi' || rec.stage === 'tsukimochi')) out.forms = `${rec.path === 'demon' ? 'demon' : 'angel'}|${rec.form}`;
  return out;
}
// Fills in what Mochi `rec` is. Returns the pages it added to.
export function noteAlbum(char, rec) {
  const album = (char.album ??= {});
  const added = [];
  for (const [page, key] of Object.entries(albumKeys(rec))) {
    if (key == null || !ALBUM_PAGES[page].keys.includes(key)) continue;
    const seen = (album[page] ??= []);
    if (!seen.includes(key)) {
      seen.push(key);
      added.push(page);
    }
  }
  return added;
}
export const seenOn = (char, page) => char.album?.[page] ?? [];
// The page's milestones: [half, complete], and whether each is reached and claimed.
export function milestones(char, page) {
  const p = ALBUM_PAGES[page];
  const have = seenOn(char, page).length;
  const need = [Math.ceil(p.keys.length / 2), p.keys.length];
  const claimed = char.albumClaimed?.[page] ?? 0;
  return need.map((n, i) => ({ need: n, reached: have >= n, claimed: claimed > i, reward: p.reward[i] }));
}
// Claims the next reached milestone on a page. Returns the reward, or null.
export function claimAlbum(char, page) {
  const ms = milestones(char, page);
  const i = ms.findIndex((m) => m.reached && !m.claimed);
  if (i < 0 || ms.slice(0, i).some((m) => !m.claimed)) return null;
  const r = ms[i].reward;
  char.gold += r.gold ?? 0;
  if (r.item) addItem(char.inventory, r.item, 1);
  (char.albumClaimed ??= {})[page] = i + 1;
  return r;
}
