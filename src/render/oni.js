// The Onmyoji's oni (docs/design/spirit-mage-paths.md): a big, cheerful red brute of the yokai
// troupe, built on the player character (hero.js drawPosed) with new clothes (jobgear/troupe.js),
// new hair (hair.js TROUPE_HAIR), horns and fangs, drawn much bigger than the Onmyoji (the whole
// figure scaled, never stretched), with a huge studded iron club (a kanabo).
//
// For now: his three designs to pick from (tools/troupe-designs.html). His rig, moves and brain
// come once one is picked.

export const ONI_SCALE = 2;

// His designs: each a look on the hero's body.
export const ONI_DESIGNS = {
  classic: {
    name: 'Classic red oni',
    look: {
      hairStyle: 'onimane', hairColor: '#2a2028', hairTip: '#a8321e', skinTone: '#e2533e', eyeColor: '#ffd23a', eyeStyle: 'round', browStyle: 'thick', face: 'grin',
      earStyle: 'pointed', outfit: 'oniclassic', outfitColor: '#ffffff', marks: ['onifangs'],
    },
  },
  festival: {
    name: 'Festival drummer',
    look: {
      hairStyle: 'onitopknot', hairColor: '#1e1a2a', skinTone: '#e2533e', eyeColor: '#ffcc33', eyeStyle: 'round', browStyle: 'thick', face: 'grin',
      earStyle: 'pointed', outfit: 'onifestival', outfitColor: '#ffffff', marks: ['onifangs'],
    },
  },
  warrior: {
    name: 'Blue war oni',
    look: {
      hairStyle: 'oniwhite', hairColor: '#f2f0f6', hairTip: '#b8c4e8', skinTone: '#5a78d6', eyeColor: '#ffd23a', eyeStyle: 'round', browStyle: 'thick', face: 'determined',
      earStyle: 'pointed', outfit: 'oniwarrior', outfitColor: '#ffffff', marks: ['onifangs'],
    },
  },
};

// ---------- The kanabo ----------
// A huge iron club: a wrapped grip with a red cord, a long octagonal shaft of dark iron
// thickening toward the head, bound with iron bands and studded with rows of steel spikes, a
// rounded iron cap. Drawn from her hand along `ang` (0 up, + forward), held near its butt, in
// body px scaled by `k`.
const LEN = 46;
const IRON = '#4a4652';
const IRON_LT = '#7a7486';
const IRON_DK = '#26232c';
const STUD = '#d8dce6';
export function paintKanabo(c, hand, flip, ang, k) {
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(k, k);
  const bot = 6;
  const top = -LEN + bot;
  // The grip, wrapped, and its cord.
  c.fillStyle = '#5a3a2a';
  c.fillRect(-1.3, -2, 2.6, bot + 2);
  c.strokeStyle = '#d8352c';
  c.lineWidth = 0.5;
  for (let y = -1.5; y < bot; y += 1.2) {
    c.beginPath();
    c.moveTo(-1.3, y);
    c.lineTo(1.3, y + 0.6);
    c.stroke();
  }
  c.fillStyle = IRON_DK;
  c.fillRect(-1.6, bot - 0.4, 3.2, 1.2);
  // The shaft: widening from the grip to the head.
  const w = (u) => 1.6 + 2.6 * u;
  c.beginPath();
  c.moveTo(-w(0), -2);
  c.lineTo(-w(1), top + 4);
  c.quadraticCurveTo(0, top - 1.6, w(1), top + 4);
  c.lineTo(w(0), -2);
  c.closePath();
  c.fillStyle = IRON;
  c.fill();
  c.strokeStyle = IRON_DK;
  c.lineWidth = 0.6;
  c.stroke();
  // A light edge down one side.
  c.strokeStyle = IRON_LT;
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(-w(0) + 0.6, -3);
  c.lineTo(-w(1) + 0.8, top + 5);
  c.stroke();
  // Iron bands and rows of studs.
  for (const u of [0.18, 0.5, 0.82]) {
    const y = -2 + (top + 4 + 2) * u;
    c.fillStyle = IRON_DK;
    c.fillRect(-w(u) - 0.3, y - 0.6, 2 * w(u) + 0.6, 1.2);
  }
  c.fillStyle = STUD;
  for (let row = 0; row < 7; row++) {
    const u = 0.28 + row * 0.1;
    const y = -2 + (top + 4 + 2) * u;
    for (const s of [-1, 0, 1]) {
      const x = s * w(u) * 0.6;
      c.beginPath();
      c.moveTo(x - 0.6, y + 0.5);
      c.lineTo(x + 0.6, y + 0.5);
      c.lineTo(x, y - 0.9);
      c.closePath();
      c.fill();
    }
    // Spikes standing out from each edge.
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * w(u), y - 0.6);
      c.lineTo(s * (w(u) + 1.4), y);
      c.lineTo(s * w(u), y + 0.6);
      c.closePath();
      c.fill();
    }
  }
  c.restore();
}
