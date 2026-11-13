// The Whispering Glade's two little folk (2026-11-12), drawn from scratch at chibi size: nothing
// scaled down from a taller figure. About two heads tall: a big round head, a small soft body,
// stubby arms with mitten hands, short legs with big round shoes.
//
// - The Puddle Kid: a tiny rain-sprite in a too-big yellow raincoat and round blue boots, standing
//   in her own little puddle, a lily pad held over her shoulder for an umbrella, dripping.
// - The Blossom Fairy: a tiny flower fairy, her skirt an upside-down bellflower, her hair up in two
//   rosebud buns, butterfly-petal wings, a dandelion puff for a wand.
//
// `gladeKidShapes(kind, mood)` gives the whole figure in a 160 x 150 box, feet (or the hover
// point) at the bottom middle, facing right.


import { E, T, F } from './kit.js';
import { W, H, CX, G, SKIN, SKIN_SH, band, curve, ovalPts, oval, petal, mitten, kidHead, twinkle, groups, HK, HS, mapShape } from './kidbase.js';

// ---------- The Puddle Kid ----------

const PUD = {
  hair: '#7ad6e8', hairSh: '#4fb0cc', hairDk: '#2e7a9a', hairLt: '#bff4fb',
  iris: '#4a9ae8', irisDk: '#24508e', irisLt: '#b8e2ff',
  coat: '#ffd84a', coatSh: '#eeb22a', coatDk: '#c88a1e', coatLt: '#fff2a6',
  boot: '#5aa8ec', bootSh: '#3a7ec4', bootDk: '#2a5e9e', bootLt: '#a8d8ff',
  pad: '#6cc46a', padSh: '#4a9a50', padDk: '#3a7a42', padLt: '#a6e28e',
  water: '#9ad8f0', waterLt: '#d2f2fc', waterDk: '#6ab8dc',
};

function puddleKid(mood) {
  const c = PUD;
  const { G: parts, use, out } = groups();
  use('puddle');
  const hx = CX + 2;
  const hy = 56;

  // Her puddle: a soft uneven pool, rings spreading round her boots, the boots' blue in the water.
  for (const [x, y, rx, ry, col] of [[CX - 6, G - 2, 40, 5.4, c.waterDk], [CX + 12, G - 1.6, 34, 5, c.waterDk], [CX - 6, G - 2.6, 38, 4.4, c.water], [CX + 12, G - 2.2, 32, 4, c.water]]) out.push(F(E(x, y, rx, ry, col)));
  // (The ripples, the shimmer and the boots' reflections are live, drawn by the rig on the water.)

  // The lily-pad umbrella over her far shoulder: tipped back, its notch to the front, a thick
  // dark underside, a light rim on the top edge, veins from the middle, two rain beads sitting on
  // it, drips running off. Its stem down behind her to her far hand, curling at the end.
  const hd = kidHead(CX + 2, 86, mood, c, 'fluffybob', c.hair, 'heavy');
  use('umbrella');
  const uc = [CX - 28, 40];
  const ua = -0.32;
  out.push(...band(curve([[uc[0] + 2, uc[1] + 4], [CX - 30, 70], [CX - 24, 104], [CX - 21, 110], [CX - 17, 110]], 4), 3.6, 2.6, c.padSh));
  out.push(oval(uc[0], uc[1] + 4.4, 50, 15, ua, c.padDk));
  const notch = -Math.PI / 2 + 0.9;
  out.push(T([[...uc], ...ovalPts(uc[0], uc[1], 50, 15, ua, notch + 0.2, notch + Math.PI, 12)], c.pad));
  out.push(T([[...uc], ...ovalPts(uc[0], uc[1], 50, 15, ua, notch + Math.PI, notch + Math.PI * 2 - 0.2, 12)], c.pad));
  out.push(F(T([[...uc], ...ovalPts(uc[0], uc[1], 50, 15, ua, 0.3, Math.PI - 0.3, 10)], c.padSh)));
  for (let k = 0; k < 7; k++) {
    const t = notch + 0.6 + k * 0.78;
    const [ex, ey] = ovalPts(uc[0], uc[1], 42, 12, ua, t, t, 1)[0];
    const mid = [(uc[0] + ex) / 2, (uc[1] + ey) / 2 - 1.4];
    out.push(...band(curve([[uc[0], uc[1]], mid, [ex, ey]], 3), 1.3, 0.5, c.padLt, true));
  }
  out.push(...band(curve(ovalPts(uc[0], uc[1], 48.6, 13.8, ua, Math.PI + 0.25, notch - 0.12, 8), 2), 1.6, 1.6, c.padLt, true));
  out.push(F(E(uc[0] - 12, uc[1] - 4, 12, 2.6, c.padLt)));
  for (const [x, y, r] of [[uc[0] - 22, uc[1] + 3, 2.8], [uc[0] + 12, uc[1] - 1, 2.1]]) out.push(E(x, y, r, r * 0.84, c.waterLt), F(E(x + r * 0.4, y + r * 0.4, r * 0.5, r * 0.3, c.water)), F(E(x - r * 0.3, y - r * 0.3, r * 0.34, r * 0.26, '#ffffff')));
  // (The drips off its rim are live: the rig swells them at the tips and lets them fall.)

  use('hood');
  // The hood, bunched behind her neck, its rim showing.
  out.push(E(CX - 12, 88, 16, 9, c.coatSh), E(CX - 12, 87, 14, 7, c.coat), F(E(CX - 12, 88.4, 9, 3.4, c.coatDk)));

  use('hairBack');
  // The back of her hair.
  out.push(...hd.back);

  use('farArm');
  // Far arm, up to the umbrella's stem.
  out.push(...band([[CX - 12, 92], [CX - 20, 100]], 9, 8.4, c.coatSh), ...mitten(CX - 23, 103, -2, SKIN_SH));
  out.push(...band([[CX - 27, 100], [CX - 19, 101]], 3.6, 3.6, c.padSh));

  // Boots: round and shiny; a dark sole, a fold-over cuff, a pull tab at the back, a shine down the
  // shaft and on the toe.
  const boot = (x, far) => {
    const bc = far ? c.bootSh : c.boot;
    const lt = far ? c.boot : c.bootLt;
    out.push(E(x - 6, G - 25, 2.4, 2.8, far ? c.bootDk : c.bootSh));
    out.push(T([[x - 6.6, G - 22], [x + 6.6, G - 22], [x + 7.4, G - 8], [x - 7.4, G - 8]], bc));
    out.push(E(x + 3, G - 5, 11, 6, c.bootDk), E(x + 3, G - 6.4, 11, 6, bc));
    out.push(F(E(x + 7, G - 9, 3.6, 1.6, lt)), F(E(x + 8.6, G - 9.6, 1.2, 0.7, '#ffffff')));
    out.push(...band([[x - 7.6, G - 21], [x + 7.6, G - 21]], 3.4, 3.4, lt), ...band([[x - 7.4, G - 19], [x + 7.4, G - 19]], 0.9, 0.9, far ? c.bootDk : c.bootSh, true));
    out.push(F(T([[x - 4.4, G - 17.6], [x - 2, G - 17.6], [x - 2.8, G - 10], [x - 4.8, G - 10]], lt)));
  };
  // Little legs from inside each boot up under the coat: the rig swings each one from its boot to
  // its hip, so boots and coat stay joined however she bobs and steps.
  for (const [k, x, far] of [['legF', CX - 9, true], ['legN', CX + 8, false]]) {
    use(k);
    out.push(...band([[x, G - 16], [x, G - 44]], 8, 7.4, far ? SKIN_SH : SKIN));
  }
  use('bootF');
  boot(CX - 9, true);
  use('bootN');
  boot(CX + 8, false);
  // The raincoat, in layers that each move: the yoke (shoulders to the waist), its darker lining
  // showing when the front opens, the two front panels swinging from the waist on either side of
  // the placket, a flap on each pocket, and the two round collar points. The shadow side, two soft
  // folds, a lit edge, the placket with three big buttons, a stitched hem.
  use('body');
  out.push(T([[CX - 12, 84], [CX + 13, 84], [CX + 17, 102], [CX + 15, 110], [CX - 15, 110], [CX - 17, 102]], c.coat));
  out.push(F(T([[CX - 12, 86], [CX - 6, 86], [CX - 7.6, 106], [CX - 16, 106], [CX - 16.6, 101]], c.coatSh)));
  out.push(...band(curve([[CX + 12, 87], [CX + 14.6, 98], [CX + 14.6, 108]], 3), 1.8, 1.8, c.coatLt, true));
  out.push(...band([[CX + 3, 88], [CX + 3.4, 108]], 1.2, 1.2, c.coatDk, true));
  out.push(F(E(CX + 8, 94, 3, 3, c.coatDk)), F(E(CX + 8, 93.6, 2.6, 2.6, '#ffffff')), F(E(CX + 7.2, 92.8, 0.9, 0.9, c.bootLt)));

  use('lining');
  out.push(T([[CX - 14.6, 103], [CX + 15, 103], [CX + 18.6, 122], [CX + 17.6, 126], [CX + 10, 127.6], [CX, 128], [CX - 10, 127.6], [CX - 18, 126], [CX - 19, 122]], c.coatDk));

  use('coatL');
  out.push(T([[CX - 16.4, 102], [CX + 3.8, 102], [CX + 3.8, 129.4], [CX, 129.6], [CX - 11, 129], [CX - 20, 127], [CX - 21, 122]], c.coat));
  out.push(F(T([[CX - 7.4, 102], [CX - 10, 129], [CX - 11, 129], [CX - 20, 127], [CX - 21, 122], [CX - 16.4, 102]], c.coatSh)));
  out.push(...band(curve([[CX - 4, 104], [CX - 7, 116], [CX - 8, 128]], 3), 1, 2.4, c.coatSh, true));
  out.push(...band(curve([[CX - 20, 124], [CX - 10, 126.4], [CX, 127], [CX + 3.8, 127]], 2), 2.6, 2.6, c.coatSh, true));
  for (let k = 0; k < 5; k++) out.push(F(E(CX - 17 + k * 4.25, 122.4 + Math.abs(k - 4) * -0.26 + (k === 0 ? -0.6 : 0), 1, 0.5, c.coatLt)));
  out.push(F(T([[CX - 16, 109], [CX - 8, 109], [CX - 8, 120], [CX - 15, 120.6]], c.coatDk)));

  use('flapL');
  out.push(F(T([[CX - 16.6, 107.6], [CX - 7.4, 107.6], [CX - 8, 112], [CX - 16, 112]], c.coatSh)), F(T([[CX - 16, 111.4], [CX - 8, 111.4], [CX - 8, 112.4], [CX - 16, 112.4]], c.coatDk)));
  out.push(F(E(CX - 12, 111, 1.2, 1.2, '#ffffff')));

  use('coatR');
  out.push(T([[CX + 3, 102], [CX + 16.4, 102], [CX + 21, 122], [CX + 20, 127], [CX + 11, 129], [CX + 3, 129.5]], c.coat));
  out.push(...band(curve([[CX + 13, 106], [CX + 15, 116], [CX + 16, 127]], 3), 0.8, 2, c.coatSh, true));
  out.push(...band(curve([[CX + 15, 103], [CX + 17, 113], [CX + 19, 123]], 3), 1.8, 1.8, c.coatLt, true));
  out.push(...band(curve([[CX + 3, 127], [CX + 10, 126.4], [CX + 20, 124]], 2), 2.6, 2.6, c.coatSh, true));
  for (let k = 5; k < 9; k++) out.push(F(E(CX - 17 + k * 4.25, 122.4 + Math.abs(k - 4) * -0.26 + (k === 8 ? -0.6 : 0), 1, 0.5, c.coatLt)));
  out.push(...band([[CX + 3.4, 102], [CX + 4, 127]], 1.2, 1.2, c.coatDk, true));
  for (let k = 1; k < 3; k++) out.push(F(E(CX + 8, 94 + k * 11, 3, 3, c.coatDk)), F(E(CX + 8, 93.6 + k * 11, 2.6, 2.6, '#ffffff')), F(E(CX + 7.2, 92.8 + k * 11, 0.9, 0.9, c.bootLt)));
  out.push(F(T([[CX + 8, 109], [CX + 16, 109], [CX + 16, 120], [CX + 9, 120.6]], c.coatSh)));

  use('flapR');
  out.push(F(T([[CX + 7.4, 107.6], [CX + 16.6, 107.6], [CX + 16, 112], [CX + 8, 112]], c.coat)), F(T([[CX + 8, 111.4], [CX + 16, 111.4], [CX + 16, 112.4], [CX + 8, 112.4]], c.coatDk)));
  out.push(F(E(CX + 12, 111, 1.2, 1.2, '#ffffff')));

  // The collar: two round points under her chin, and the chin's soft shadow over them.
  use('collarL');
  out.push(oval(CX - 6, 86, 8, 4.4, 0.25, c.coatLt));
  use('collarR');
  out.push(oval(CX + 8, 86, 8, 4.4, -0.25, c.coatLt));
  use('chin');
  out.push(F(E(CX + 3, 85.6, 13, 2.6, c.coatSh)));

  use('head');
  out.push(...hd.face);
  use('fringe');
  out.push(...hd.fringe);

  use('nearArm');
  // Near arm: held out, palm up, catching the rain; the sleeve's underside in shadow, a cuff.
  out.push(...band(curve([[CX + 12, 92], [CX + 22, 98], [CX + 30, 94]], 3), 9.6, 8.4, c.coat));
  out.push(...band(curve([[CX + 14, 96.6], [CX + 22, 101.4], [CX + 28, 98.4]], 3), 2, 1.6, c.coatSh, true));
  out.push(...band([[CX + 27.6, 91.6], [CX + 31, 97.6]], 3, 3, c.coatLt), ...band([[CX + 29.2, 91.2], [CX + 32.4, 97]], 0.8, 0.8, c.coatDk, true));
  out.push(...mitten(CX + 35, 92, -0.4, SKIN), F(E(CX + 34, 93.6, 2.4, 1.4, SKIN_SH)));
  // (The rain she catches in her palm is live, falling into it.)

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

// ---------- The Blossom Fairy ----------

const FAI = {
  hair: '#c8b0f4', hairSh: '#a68adc', hairDk: '#7a5eb4', hairLt: '#ece4ff',
  iris: '#e85a8a', irisDk: '#9a2a5a', irisLt: '#ffc8dc',
  bell: '#ff9ec4', bellSh: '#e878a4', bellDk: '#c4507e', bellLt: '#ffd4e4',
  wing: '#ffe2f0', wingRim: '#f6a8cc', wingFar: '#eab6d6', wingIn: '#fffafd', wingSpot: '#ff9ec4',
  leaf: '#7ccc6a', leafSh: '#58a852', leafLt: '#b4ec96',
  rose: '#ff7eae', roseSh: '#e0548a', roseLt: '#ffc0d8',
  puff: '#ffffff', puffSh: '#e8eef6', gold: '#fff2a0',
};

function blossomFairy(mood) {
  const c = FAI;
  const { G: parts, use, out } = groups();
  const hx = CX + 2;
  const hy = 50;

  // Wings: butterfly-petal wings from between her shoulders, the far pair peeking past the near.
  // Each: a rosy rim, the pale wing, a bright heart toward the root, veins, rosy eyespots toward
  // the tip with a light in each, a dusting of gold.
  const root = [CX - 6, 88];
  const wing = (a, len, w, far) => {
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const at = (u, v) => [root[0] + ca * len * u - sa * w * v, root[1] + sa * len * u + ca * w * v];
    const m = at(0.56, 0);
    out.push(oval(m[0], m[1], len * 0.56, w * 0.5, a, far ? c.wingFar : c.wingRim));
    out.push(F(oval(...at(0.53, 0), len * 0.5, w * 0.42, a, far ? c.bellLt : c.wing)));
    out.push(F(oval(...at(0.36, 0), len * 0.3, w * 0.24, a, c.wingIn)));
    for (const v of [-0.28, 0, 0.28]) out.push(...band(curve([root, at(0.5, v * 0.7), at(0.9, v)], 3), 1, 0.4, far ? c.wingFar : c.wingRim, true));
    out.push(F(E(...at(0.8, 0.16), w * 0.12, w * 0.12, c.wingSpot)), F(E(...at(0.8, 0.16), w * 0.05, w * 0.05, '#ffffff')));
    out.push(F(E(...at(0.74, -0.24), w * 0.08, w * 0.08, c.wingSpot)));
    for (const [u, v] of [[0.62, 0.3], [0.92, -0.1], [0.5, -0.3]]) out.push(F(E(...at(u, v), 0.9, 0.9, c.gold)));
  };
  use('wingFU');
  wing(-2.2, 52, 34, true);
  use('wingFL');
  wing(2.35, 34, 22, true);
  use('wingNU');
  wing(-2.75, 64, 42, false);
  use('wingNL');
  wing(2.85, 42, 28, false);

  // The back of her hair.
  const hd = kidHead(CX + 2, 83, mood, c, 'odango', c.hair);
  // Each pigtail its own group, so the rig can swing it from its root under its bun.
  use('tailL');
  out.push(hd.hang[0]);
  use('tailR');
  out.push(hd.hang[1]);
  use('hairBack');
  out.push(...hd.backHead);

  use('farArm');
  // Far arm: back and out a little, the hand open.
  out.push(...band([[CX - 8, 90], [CX - 20, 100]], 7, 6.4, SKIN_SH), ...mitten(CX - 23, 102, 2.4, SKIN_SH, 4.8));

  // Legs: short and dangling from under the skirt, the near one kicked back, toes pointed; little
  // leaf slippers curling up at the toe, a vein down each.
  const leg = (hip, foot, far) => {
    const sc = far ? SKIN_SH : SKIN;
    out.push(...band([hip, foot], 8.4, 7.4, sc));
    const lc = far ? c.leafSh : c.leaf;
    out.push(oval(foot[0] + 2, foot[1] + 2, 7, 4.4, 0.5, lc));
    out.push(...band(curve([[foot[0] + 7, foot[1] + 5], [foot[0] + 11, foot[1] + 4], [foot[0] + 11, foot[1]]], 2), 2.6, 1.4, lc));
    out.push(...band([[foot[0] - 2, foot[1] + 0.4], [foot[0] + 7, foot[1] + 4.6]], 0.8, 0.5, far ? c.leafSh : c.leafSh, true));
    out.push(F(E(foot[0] + 1, foot[1] + 0.2, 3, 1.3, far ? c.leaf : c.leafLt)));
  };
  use('legF');
  // (The legs start well up inside the bell, so a swinging leg never shows its top.)
  leg([CX - 5, 99], [CX - 8, 132], true);
  use('legN');
  leg([CX + 5, 99], [CX + 1, 137], false);

  use('skirt');
  // The bellflower skirt, swinging from her waist: the bell, then five round-pointed petals at the
  // hem flaring out, the outer ones curling most; a dark vein up each petal, the tips catching the
  // light.
  out.push(T([[CX - 9, 96], [CX + 9, 96], [CX + 18, 112], [CX - 18, 112]], c.bell));
  out.push(F(T([[CX - 9, 96], [CX - 4, 96], [CX - 11, 112], [CX - 18, 112]], c.bellSh)));
  out.push(F(T([[CX + 4, 98], [CX + 7, 98], [CX + 13, 110], [CX + 9, 111]], c.bellLt)));
  // Each petal its own layer, fluttering from where it grows out of the bell.
  for (let k = 0; k < 5; k++) {
    use(`petal${k}`);
    const x = CX - 16 + k * 8;
    const a = Math.PI / 2 + (k - 2) * -0.3;
    const col = k === 0 ? c.bellSh : k === 3 ? c.bellLt : c.bell;
    out.push(petal(x, 104, a, 19, 12, col));
    const tip = [x + Math.cos(a) * 16, 104 + Math.sin(a) * 16];
    out.push(...band([[x + Math.cos(a) * 4, 104 + Math.sin(a) * 4], tip], 1, 0.5, c.bellDk, true));
    out.push(F(E(tip[0] - 1, tip[1] - 1, 3, 1.6, k === 0 ? c.bell : c.bellLt)));
  }
  use('body');
  // The bodice: a little rounded top of the same petal, a sweetheart neckline; over it a ring of
  // sepal leaves at the waist (each its own layer, rustling) with a tiny rosebud at the front.
  out.push(T([[CX - 8, 83], [CX + 8, 83], [CX + 9.5, 98], [CX - 9.5, 98]], c.bell), E(CX - 3.4, 83, 5, 3, c.bell), E(CX + 4, 83, 5, 3, c.bell));
  out.push(F(T([[CX - 8, 84], [CX - 4, 84], [CX - 6, 97], [CX - 9.5, 97]], c.bellSh)), F(T([[CX + 3, 84], [CX + 6.5, 84], [CX + 7.5, 96], [CX + 4.5, 96]], c.bellLt)));
  out.push(...band([[CX + 0.6, 82.6], [CX + 0.6, 86]], 0.9, 0.5, c.bellDk, true));
  out.push(F(E(CX + 2, 84.4, 7, 1.6, c.bellSh)));
  for (let k = 0; k < 5; k++) {
    use(`leaf${k}`);
    out.push(petal(CX - 11 + k * 5.5, 96, Math.PI / 2 + (k - 2) * 0.32, 8, 5, k % 2 ? c.leaf : c.leafSh));
  }
  use('rose');
  out.push(E(CX + 6, 96, 2.6, 2.3, c.rose), F(E(CX + 5.4, 95.4, 1.2, 0.9, c.roseLt)), ...band(curve([[CX + 4.6, 96.4], [CX + 6, 97.2], [CX + 7.4, 96]], 2), 0.7, 0.7, c.roseSh, true));

  use('head');
  out.push(...hd.face);
  use('fringe');
  out.push(...hd.fringe);

  use('nearArm');
  // Near arm: raised, holding her dandelion-puff wand out in front.
  const hand = [CX + 30, 92];
  out.push(...band(curve([[CX + 8, 88], [CX + 20, 96], hand], 3), 7.4, 6.4, SKIN), ...band(curve([[CX + 11, 91.6], [CX + 20, 99]], 2), 1.4, 1, SKIN_SH, true));
  out.push(...band(curve([[hand[0] + 1, hand[1] + 3], [CX + 38, 76], [CX + 44, 62]], 3), 2, 1.6, c.leafSh), ...band([[hand[0] + 2, hand[1]], [CX + 41, 70]], 0.6, 0.6, c.leafLt, true));
  out.push(...mitten(hand[0], hand[1], -0.9, SKIN, 5));
  // The puff on the end of its stem, nodding there on its own. (The seeds it sheds are live.)
  use('puff');
  const pf = [CX + 46, 56];
  out.push(F(E(pf[0], pf[1], 12, 12, '#fffdf2')));
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2;
    out.push(...band([pf, [pf[0] + Math.cos(a) * 11, pf[1] + Math.sin(a) * 11]], 0.7, 0.5, c.puffSh, true), F(E(pf[0] + Math.cos(a) * 11.6, pf[1] + Math.sin(a) * 11.6, 1.6, 1.6, c.puff)));
  }
  out.push(E(pf[0], pf[1], 4, 4, c.puff), F(E(pf[0] + 1, pf[1] + 1, 2.4, 2.4, c.puffSh)));

  use('twinkles');
  // Twinkles round her: fairy dust.
  for (const [x, y, r] of [[CX - 52, 112, 4], [CX + 34, 120, 3.4], [CX - 30, 30, 3], [CX + 52, 96, 2.6]]) out.push(...twinkle(x, y, r, c.gold));

  return { w: W, h: H, res: 3, shapes: Object.values(parts).flat(), groups: parts };
}

export function gladeKidShapes(kind = 'puddle', mood = 'idle') {
  return kind === 'fairy' ? blossomFairy(mood) : puddleKid(mood);
}

// The box, and the joints the rig turns each part about (in the drawing's units; the feet, or for
// the fairy the point under her hover, at (CX, G)).
export const KID_BOX = { W, H, CX, G };
export const KID_JOINTS = {
  puddle: { hip: [CX, 104], crown: [CX + 2, 34], tipL: [CX - 74, 58], tipR: [CX - 50, 65], neck: [CX + 2, 86], shF: [CX - 12, 92], shN: [CX + 12, 92], grip: [CX - 23, 103], ankF: [CX - 9, G - 12], ankN: [CX + 8, G - 12], sockF: [CX - 7, 110], sockN: [CX + 6, 110], palm: [CX + 36, 88],
    // The coat's layers: each front panel hangs from the top of the placket, each pocket flap from
    // its top edge, both collar points from under the chin.
    hemL: [CX + 2, 103], hemR: [CX + 4, 103], flapL: [CX - 12, 107.6], flapR: [CX + 12, 107.6], colL: [CX, 87], colR: [CX + 2, 87] },
  fairy: { hip: [CX, 100], neck: [CX + 2, 83], shF: [CX - 8, 90], shN: [CX + 8, 88], wing: [CX - 6, 88], hipF: [CX - 5, 104], hipN: [CX + 5, 104], puff: [CX + 46, 56], stem: [CX + 44, 64], waist: [CX, 97], tailL: fairyTailRoot(6.2), tailR: fairyTailRoot(31 - 6.2),
    crown: [CX + 2, 31],
    // Each skirt petal from where it grows out of the bell, each waist leaf from the waist.
    ...Object.fromEntries([0, 1, 2, 3, 4].flatMap((k) => [[`petal${k}`, [CX - 16 + k * 8, 104]], [`leaf${k}`, [CX - 11 + k * 5.5, 96]]])) },
};
// Where a pigtail leaves her head, under its bun (the odango tail's first point, x in hero head
// space; placed as kidHead places her head).
function fairyTailRoot(x) {
  const k = HK * HS;
  return [CX + 2 + (x - 15.5) * k, 83 - 31 * HS + (6 - 15) * k];
}
export { mapShape };
