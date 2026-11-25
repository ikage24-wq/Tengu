// The Lamplighter Wisp's own face (2026-11-24, the player: "She still has the player character
// face"): three styles of her own, nothing like the hero's (no tall shining eyes with a lash flick,
// no pink oval blush): each with its own skin, eyes, cheeks and mouth, in every expression she uses.
//   glow   Ghost Glow (the player's pick, 2026-11-24): pale lavender ghost skin; round lantern eyes, amber with a flame-shaped glint,
//          under a soft round lid, no lashes; lavender cheek glows; a tiny cat mouth.
//   sleepy Sleepy Lamplighter: warm skin; gentle half-lidded eyes with small round irises; freckles
//          over the nose, a rosy nose tip; a little lopsided smile.
//   plush  Plush Doll Ghost: pale skin; big solid button eyes with a plush shine, no lids or whites;
//          round blush; a tiny round mouth.
// (In her head's units: the face from about -34 to 34 across, chin about 31.)
import { E, T, F } from '../mobs/kit.js';
import { band, curve, blob } from '../mobs/kidbase.js';

export const STYLES = {
  glow: { skin: { lt: '#ffffff', base: '#f6f0ff', sh: '#e2d6f6', deep: '#c9b8ec' }, ink: '#4a2f6a' },
  sleepy: { skin: { lt: '#fff4ec', base: '#ffe6d2', sh: '#f4c8ae', deep: '#e4a88a' }, ink: '#5a3424' },
  plush: { skin: { lt: '#ffffff', base: '#fbf4ff', sh: '#e8dcf4', deep: '#cfc0e4' }, ink: '#3a2848' },
};
const faceShape = (skin) => [blob([[-33, -14], [-34, 6], [-29, 22], [-17, 31], [0, 34], [17, 31], [29, 22], [34, 6], [33, -14], [0, -30]], skin.base, 4), F(blob([[-30, -10], [30, -10], [28, -2], [12, 0], [0, -3], [-12, 0], [-28, -2]], skin.sh, 3))];
const arc = (pts, w, c) => band(curve(pts, 3), w, w, c, true);

// e: 'open' | 'happy' | 'squeeze' | 'sleepy' | 'wide'; m: 'calm' | 'open' | 'o' | 'blow' | 'wobble';
// brow: fierce.
function glowFace(e, m, brow) {
  const { skin, ink } = STYLES.glow;
  const out = [...faceShape(skin)];
  for (const o of [-1, 1]) {
    const x = 15 * o;
    const y = 13;
    if (e === 'happy') out.push(...arc([[x - 5.5, y + 1.5], [x, y - 4], [x + 5.5, y + 1.5]], 2.6, ink));
    else if (e === 'blink') out.push(...arc([[x - 5.5, y + 1], [x, y + 2.6], [x + 5.5, y + 1]], 2.4, ink));
    else if (e === 'squeeze') out.push(...arc([[x - 5 * o, y - 3.5], [x + 3 * o, y], [x - 5 * o, y + 3.5]], 2.2, ink));
    else {
      const r = e === 'wide' ? 6.2 : 5.6;
      out.push(F(E(x, y, r, r, ink)), F(E(x, y + 0.4, r - 1.3, r - 1.3, '#f2a33a')), F(E(x, y + 1.2, r - 2.8, r - 2.8, '#ffd27a')));
      // (a little flame for the glint)
      out.push(F(blob([[x - 1.6, y - 1.4], [x - 2.6, y - 3.4], [x - 1.4, y - 5.6], [x - 0.2, y - 3.4]], '#ffffff', 2)));
      // (the soft round lid over the top: lower when sleepy, flat and low when fierce)
      const lid = e === 'sleepy' ? 2.4 : brow ? 1.2 : -2.6;
      out.push(F(blob([[x - r - 1.4, y - 1 + lid], [x - r * 0.6, y - r - 1.6], [x + r * 0.6, y - r - 1.6], [x + r + 1.4, y - 1 + lid], [x + r * 0.5, y - r + 1 + lid * 0.8], [x - r * 0.5, y - r + 1 + lid * 0.8]], skin.base, 2)));
      out.push(...arc([[x - r - 0.6, y - 0.6 + lid], [x - r * 0.4, y - r + 0.6 + lid * 0.8], [x + r * 0.4, y - r + 0.6 + lid * 0.8], [x + r + 0.6, y - 0.6 + lid]], 1.6, ink));
      out.push(...arc([[x - r * 0.7, y + r + 0.6], [x, y + r + 1.4], [x + r * 0.7, y + r + 0.6]], 0.7, '#b8a4e0'));
    }
    out.push(F(E(23 * o, 22, 4.4, 3.6, '#ead6ff')), F(E(23 * o, 21.4, 2.4, 1.8, '#f6ecff')));
  }
  const my = 24;
  if (m === 'open') out.push(F(T([[-3, my - 0.6], [3, my - 0.6], [2, my + 2.6], [0, my + 3.4], [-2, my + 2.6]], '#8a4a7a')), F(E(0, my + 2, 1.4, 0.8, '#ff9ab8')));
  else if (m === 'o' || m === 'blow') out.push(F(E(0, my + 1, m === 'blow' ? 1.2 : 1.8, m === 'blow' ? 1.2 : 2.2, '#8a4a7a')));
  else if (m === 'wobble') out.push(...arc([[-3, my + 1], [-1.4, my], [0, my + 1], [1.4, my], [3, my + 1]], 1, ink));
  else out.push(...arc([[-3.4, my], [-1.7, my + 1.6], [0, my + 0.2], [1.7, my + 1.6], [3.4, my]], 1, ink));
  return out;
}

function sleepyFace(e, m, brow) {
  const { skin, ink } = STYLES.sleepy;
  const out = [...faceShape(skin)];
  for (const o of [-1, 1]) {
    const x = 12.5 * o;
    const y = 12;
    if (e === 'happy') out.push(...arc([[x - 5, y + 1.5], [x, y - 3], [x + 5, y + 1.5]], 2.2, ink));
    else if (e === 'squeeze') out.push(...arc([[x - 4.6 * o, y - 3], [x + 2.6 * o, y], [x - 4.6 * o, y + 3]], 2, ink));
    else {
      const wide = e === 'wide' ? 1 : 0;
      out.push(F(E(x, y + 0.6, 5.2, 4.6 + wide, '#ffffff')), F(E(x + 0.6 * o, y + 1.2, 2.8 + wide * 0.4, 3 + wide * 0.4, '#6a4a3a')), F(E(x + 0.6 * o, y + 1.4, 1.5, 1.7, '#2a1a14')), F(E(x - 0.4 * o, y - 0.2, 0.9, 0.9, '#ffffff')));
      // (the heavy, rounded lid: half down, all the way to a slit when she nods off)
      // (her calm look: the lid resting over the top third of the eye, the iris showing under it)
      const drop = e === 'sleepy' ? 3.4 : e === 'wide' ? -3.4 : brow ? -0.6 : -1.6;
      out.push(F(blob([[x - 6.4, y + drop - 1], [x - 5, y - 5], [x + 5, y - 5], [x + 6.4, y + drop - 1], [x, y + drop - 0.2]], skin.base, 3)));
      out.push(...arc([[x - 6, y + drop - 1], [x, y + drop], [x + 6, y + drop - 1]], 1.8, ink));
      out.push(...arc([[x - 3.6, y + 5.6], [x, y + 6.2], [x + 3.6, y + 5.6]], 0.6, '#c89070'));
      if (brow) out.push(...arc([[x - 5 * o, y - 9], [x + 3 * o, y - 7.4]], 1.6, '#8a74c8'));
    }
    // freckles
    for (const [fx, fy] of [[16, 19], [20, 18.4], [18.2, 21.4]]) out.push(F(E(fx * o, fy, 0.8, 0.8, '#e0a080')));
  }
  out.push(F(E(0, 18, 1.8, 1.3, '#ffb4a8')));
  const my = 24;
  if (m === 'open') out.push(F(T([[-2.6, my - 0.4], [3.6, my - 0.8], [2.4, my + 2.6], [0.4, my + 3.2], [-1.6, my + 2.2]], '#8a3a3a')));
  else if (m === 'o' || m === 'blow') out.push(F(E(0.6, my + 1, 1.5, 1.8, '#8a3a3a')));
  else if (m === 'wobble') out.push(...arc([[-3, my + 1], [-1.4, my], [0, my + 1], [1.4, my], [3, my + 1]], 1, ink));
  else out.push(...arc([[-2.6, my + 0.4], [0.4, my + 1.6], [3.6, my - 0.6]], 1.1, ink));
  return out;
}

function plushFace(e, m, brow) {
  const { skin, ink } = STYLES.plush;
  const out = [...faceShape(skin)];
  for (const o of [-1, 1]) {
    const x = 14 * o;
    const y = 12;
    if (e === 'happy') out.push(...arc([[x - 5, y + 2], [x, y - 3.4], [x + 5, y + 2]], 2.8, ink));
    else if (e === 'squeeze') out.push(...arc([[x - 4.6 * o, y - 3.4], [x + 2.6 * o, y], [x - 4.6 * o, y + 3.4]], 2.4, ink));
    else if (e === 'sleepy') out.push(...arc([[x - 5, y + 1], [x, y + 3], [x + 5, y + 1]], 2.4, ink));
    else {
      const k = e === 'wide' ? 1.12 : 1;
      out.push(F(E(x, y, 5.2 * k, 6.8 * k, ink)), F(E(x - 1.8, y - 2.6, 1.9, 2.2, '#ffffff')), F(E(x + 1.6, y + 3, 0.9, 0.9, '#ffffff')));
      // (fierce: the top of each button cut off on a slant down toward the nose)
      if (brow) out.push(F(T([[x - 6.4 * o, y - 9], [x + 6.4 * o, y - 9], [x + 6.4 * o, y - 6.4], [x - 6.4 * o, y - 2.4]], skin.base)));
    }
    out.push(F(E(22 * o, 21, 4.2, 4.2, '#ffc4d8')));
  }
  const my = 24;
  if (m === 'open') out.push(F(E(0, my + 1.2, 2.6, 2.4, '#7a3a5a')), F(E(0, my + 2.2, 1.4, 0.9, '#ff9ab8')));
  else if (m === 'o' || m === 'blow') out.push(F(E(0, my + 1, 1.4, 1.6, '#7a3a5a')));
  else if (m === 'wobble') out.push(...arc([[-3, my + 1], [-1.4, my], [0, my + 1], [1.4, my], [3, my + 1]], 1, ink));
  else out.push(F(E(0, my + 0.8, 1.6, 1.3, '#7a3a5a')));
  return out;
}

export const FACE_OF = { glow: glowFace, sleepy: sleepyFace, plush: plushFace };
