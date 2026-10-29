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
  crimson: {
    name: 'Crimson oni',
    club: 'crimson',
    look: {
      hairStyle: 'onisilver', hairColor: '#eceaf2', hairTip: '#f4d2d2', skinTone: '#d9483a', eyeColor: '#ffc23a', eyeStyle: 'cat', browStyle: 'sharp', face: 'smug',
      earStyle: 'pointed', outfit: 'onicrimson', outfitColor: '#ffffff', marks: ['onifangs', 'oniglow'],
    },
  },
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
export function paintKanabo(c, hand, flip, ang, k, style = 'iron', time = 0) {
  if (style === 'crimson') return paintCrimsonKanabo(c, hand, flip, ang, k, time);
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

// The crimson oni's club: a great crimson kanabo, thick and heavy, its head ringed with big
// crimson spikes, white swirls of light burned into it and a row of round holes glowing white
// down its face; the light pulses (`time`).
const CR = '#b0202a';
const CR_DK = '#5a0c14';
const CR_LT = '#e8503e';
function paintCrimsonKanabo(c, hand, flip, ang, k, time) {
  c.save();
  c.translate(hand[0], hand[1]);
  if (flip) c.scale(-1, 1);
  c.rotate(ang);
  c.scale(k, k);
  const bot = 6;
  const top = -LEN - 2 + bot;
  // The grip, bound in black, a gold cord.
  c.fillStyle = '#1e1418';
  c.fillRect(-1.4, -2, 2.8, bot + 2);
  c.strokeStyle = '#f2c94c';
  c.lineWidth = 0.4;
  for (let y = -1.6; y < bot; y += 1.3) {
    c.beginPath();
    c.moveTo(-1.4, y);
    c.lineTo(1.4, y + 0.7);
    c.stroke();
  }
  const w = (u) => 1.8 + 3.4 * Math.min(1, u * 1.3);
  const yAt = (u) => -2 + (top + 4 + 2) * u;
  // Big spikes along both edges of the head.
  c.fillStyle = CR_DK;
  for (let i = 0; i < 6; i++) {
    const u = 0.38 + i * 0.11;
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * w(u), yAt(u) - 1.4);
      c.lineTo(s * (w(u) + 3.4), yAt(u) - 2.8);
      c.lineTo(s * w(u), yAt(u) + 0.6);
      c.closePath();
      c.fill();
    }
  }
  // The body of the club.
  c.beginPath();
  c.moveTo(-w(0), -2);
  c.lineTo(-w(1), top + 4);
  c.quadraticCurveTo(0, top - 2, w(1), top + 4);
  c.lineTo(w(0), -2);
  c.closePath();
  c.fillStyle = CR;
  c.fill();
  c.strokeStyle = CR_DK;
  c.lineWidth = 0.7;
  c.stroke();
  c.strokeStyle = CR_LT;
  c.lineWidth = 0.7;
  c.beginPath();
  c.moveTo(-w(0) + 0.6, -3);
  c.lineTo(-w(1) + 0.9, top + 5);
  c.stroke();
  // Dark ridges across it.
  c.fillStyle = CR_DK;
  for (const u of [0.22, 0.36]) c.fillRect(-w(u) - 0.3, yAt(u) - 0.6, 2 * w(u) + 0.6, 1.2);
  // The white swirls of light burned into it, and the glowing holes, pulsing.
  const glow = 0.75 + 0.25 * Math.sin(time * 4);
  c.save();
  c.shadowColor = `rgba(255, 220, 220, ${glow})`;
  c.shadowBlur = 8;
  c.strokeStyle = `rgba(255, 244, 244, ${glow})`;
  c.lineWidth = 0.55;
  for (let i = 0; i < 3; i++) {
    const y = yAt(0.48 + i * 0.16);
    const r = 1.8;
    c.beginPath();
    c.arc(-1.2, y, r, Math.PI * 0.2, Math.PI * 1.6);
    c.stroke();
    c.beginPath();
    c.arc(1.4, y - 1.6, r * 0.8, Math.PI * 1.1, Math.PI * 2.4);
    c.stroke();
  }
  c.fillStyle = `rgba(255, 250, 250, ${glow})`;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.ellipse(0, yAt(0.42 + i * 0.16), 1, 1.3, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  c.restore();
}
