// Madame Velvet's tea trolley on its own, rattling with its steam curling, drawn in the hallway
// chase by render/manor.js. (This was the Moonlit Manor's first boss art; the bosses themselves are
// drawn by render/mobs/manorfolkboss.js now.)

import { KIT } from './maidens.js';

const { grand, within, at, opoly, ooval, dot, arcPts, oband, fband, line, round, soften, TAU } = KIT;

// ---------- Madame Velvet, the head housekeeper ----------

const MV = soften({
  skin: '#f0eeff', skinDk: '#d6d2f2', hair: '#4a3a7a', hairDk: '#2e2456', hairLt: '#8a78c8',
  dress: '#7a3a8a', dressDk: '#56246a', dressLt: '#a860b4', collar: '#ffffff', collarDk: '#e0dcf2', apron: '#f4f0ff', apronDk: '#d8d0f0',
  brass: '#ffd36b', brassDk: '#c8902a', key: '#ffe08a', glass: '#dff0ff', mist: '#e6e0ff', mistDk: '#c4b8f0', mistLt: '#ffffff',
  wood: '#c98a6b', woodDk: '#985a48', woodLt: '#e6b090', cloth: '#ffffff', china: '#ffffff', chinaDk: '#d8d4ea', chinaTrim: '#a860b4', tea: '#e8a070', cloche: '#e6ecf6', clocheDk: '#a8b4c8',
});

function trolley(x, y, ph, C, wob, stocked) {
  // A two-tier tea trolley: brass rails, a lace cloth, teapot, cups and a cloche on top, a cake
  // stand below, little wheels.
  const out = [];
  const top = y - 22;
  const mid = y - 10;
  out.push(line([[x - 13, top], [x - 13, y - 2]], 1, C.brassDk), line([[x + 11, top], [x + 11, y - 2]], 1, C.brassDk));
  out.push(...oband([[x - 18, top - 6], [x - 16, top - 1], [x - 13, top]], 0.9, C.brass, 2, 0.3));
  for (const yy of [top, mid]) out.push(...opoly(round([[x - 15, yy - 1], [x + 13, yy - 1], [x + 13, yy + 1.4], [x - 15, yy + 1.4]], 1), C.wood), fband([[x - 14, yy - 0.4], [x + 12, yy - 0.4]], 0.5, C.woodLt, 1));
  for (let k = 0; k < 7; k++) out.push(...ooval(x - 13 + k * 4, top + 2.2, 1.6, 1.1, C.cloth, 0, 0.25));
  for (const wx of [x - 12, x + 10]) out.push(...ooval(wx, y - 1.6, 2, 2, C.woodDk), dot(wx, y - 1.6, 0.7, C.brass));
  if (stocked) {
    // The teapot, steam curling from its spout.
    out.push(...ooval(x - 6, top - 4.2, 4.4, 3.6, C.china), fband(arcPts(x - 6, top - 3.6, 4, 2.6, 20, 160, 6), 0.6, C.chinaTrim, 1), ...opoly([[x - 2.4, top - 4.6], [x + 1.6, top - 8], [x + 2.2, top - 7.2], [x - 2, top - 3]], C.china), ...ooval(x - 6, top - 8, 2.2, 0.9, C.chinaDk), dot(x - 6, top - 9, 0.8, C.chinaTrim));
    for (let k = 0; k < 3; k++) out.push(dot(x + 2 + Math.sin(ph + k) * 0.8, top - 10 - k * 2.2, 0.7 - k * 0.12, C.mistLt));
    // The cloche, its dome catching the light.
    out.push(...opoly(round([[x + 3, top - 1], [x + 3.6, top - 5.6], [x + 7.4, top - 7.8], [x + 11.2, top - 5.6], [x + 11.8, top - 1]], 2), C.cloche), fband(arcPts(x + 7.4, top - 2, 3.4, 4.6, 200, 260, 4), 0.6, '#ffffff', 1), dot(x + 7.4, top - 8.4, 0.9, C.clocheDk));
    // Cake stand and stacked plates below.
    out.push(...ooval(x - 5, mid - 3.4, 4, 1, C.china), line([[x - 5, mid - 3], [x - 5, mid]], 0.6, C.chinaDk), ...ooval(x - 5, mid - 5, 2, 1.4, '#ffb3cf'), dot(x - 5, mid - 6.4, 0.6, '#ff5f8f'));
    for (let k = 0; k < 4; k++) out.push(...ooval(x + 6, mid - 1 - k * 1.1, 4.2, 0.9, C.china, 0, 0.3));
  }
  return within(at(x, y, wob), () => out);
}

// The tea trolley on its own (the hallway chase): frame f of 4, rattling, steam curling.
export function trolleyArt(f) {
  const ph = (f / 4) * TAU;
  return { w: 70, h: 64, res: 3, shapes: grand(1.62, 35 - 0 * 1.62, 64 - 0.6 - 78 * 1.62, () => trolley(0, 78, ph, MV, Math.sin(ph * 2) * 0.03, true)) };
}
